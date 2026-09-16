import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];

function run(label, command, args, options = {}) {
  try {
    execFileSync(command, args, {
      cwd: root,
      encoding: "utf8",
      stdio: options.quiet === false ? "inherit" : "pipe"
    });
    console.log(`PASS  ${label}`);
  } catch (error) {
    const detail = String(error.stderr || error.stdout || error.message || error).trim();
    failures.push(`${label}${detail ? `: ${detail}` : ""}`);
    console.error(`FAIL  ${label}`);
  }
}

async function assertText(label, path, predicate, failureDetail) {
  try {
    const source = await readFile(join(root, path), "utf8");
    if (!predicate(source)) throw new Error(failureDetail);
    console.log(`PASS  ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
    console.error(`FAIL  ${label}`);
  }
}

for (const file of [
  "scripts/test-event-sync.mjs",
  "mpi-native-bridge.js",
  "mpi-office-navigation.js",
  "mpi-owner-view.js",
  "mpi-tool-bag.js",
  "scripts/test-owner-view.mjs",
  "mpi-shared.js",
  "mpi-field-sync.js",
  "mpi-subcontractor.js",
  "mpi-comment-ai.js",
  "mpi-equipment.js",
  "mpi-equipment-admin.js",
  "admin.js",
  "mpi-planning.js",
  "sw.js",
  "scripts/prepare-native-web.mjs",
  "scripts/native-doctor.mjs",
  "scripts/simulator-smoke.mjs",
  "scripts/verify-native.mjs"
]) {
  run(`JavaScript syntax — ${file}`, process.execPath, ["--check", file]);
}
run("Event-based syncing and cross-device receipts", process.execPath, ["scripts/test-event-sync.mjs"], { quiet: false });
run("Owner-only read-only previews and field Tool Bag", process.execPath, ["scripts/test-owner-view.mjs"], { quiet: false });
await assertText("Native Office does not wait for external map scripts", "native-web/admin.html", source => source.includes("./vendor/leaflet.css") && source.includes("./vendor/maplibre-gl.css") && source.includes("mpi-office-navigation.js") && !/<script[^>]+src="https:\/\/unpkg/.test(source), "Native Office still blocks on a remote map library");

const temporaryDirectory = await mkdtemp(join(tmpdir(), "mpi-native-verify-"));
try {
  const index = await readFile(join(root, "index.html"), "utf8");
  const inlineScripts = [...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());

  for (const [index, source] of inlineScripts.entries()) {
    const temporaryScript = join(temporaryDirectory, `inline-${index + 1}.js`);
    await writeFile(temporaryScript, source);
    run(`Inline app script ${index + 1} syntax`, process.execPath, ["--check", temporaryScript]);
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

try {
  const releasedBuild = Number(JSON.parse(await readFile(join(root, "version.json"), "utf8")).build);
  const appSource = await readFile(join(root, "index.html"), "utf8");
  const projectSource = await readFile(join(root, "ios/App/App.xcodeproj/project.pbxproj"), "utf8");
  const appBuild = Number(appSource.match(/<meta name="app-build" content="(\d+)">/)?.[1] || 0);
  const projectBuilds = [...projectSource.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map(match => Number(match[1]));
  if (appBuild !== releasedBuild || projectBuilds.length < 2 || projectBuilds.some(build => build !== releasedBuild)) {
    throw new Error(`release=${releasedBuild}, app=${appBuild}, iOS=${projectBuilds.join(",")}`);
  }
  console.log("PASS  Web and native build numbers match the release");
} catch (error) {
  failures.push(`Web and native build numbers match the release: ${error.message}`);
  console.error("FAIL  Web and native build numbers match the release");
}

for (const plist of [
  "ios/App/App/Info.plist",
  "ios/App/App/GoogleService-Info.plist",
  "ios/App/App/GoogleService-Info-Development.plist",
  "ios/App/App/App.entitlements",
  "ios/App/App/App-Debug.entitlements",
  "ios/App/App/PrivacyInfo.xcprivacy",
  "native-plugins/mpi-background-location/ios/Sources/MPIBackgroundLocationPlugin/PrivacyInfo.xcprivacy",
  "ios/App/App.xcodeproj/project.pbxproj"
]) {
  run(`Apple property list — ${plist}`, "/usr/bin/plutil", ["-lint", plist]);
}

run("Capacitor package graph", "swift", ["package", "dump-package", "--package-path", "ios/App/CapApp-SPM"]);
run("Background-location package graph", "swift", ["package", "dump-package", "--package-path", "native-plugins/mpi-background-location"]);
run("Native app Swift syntax", "swiftc", ["-parse", "ios/App/App/AppDelegate.swift", "ios/App/App/SceneDelegate.swift"]);
run("Background-location Swift syntax", "swiftc", ["-parse", "native-plugins/mpi-background-location/ios/Sources/MPIBackgroundLocationPlugin/MPIBackgroundLocationPlugin.swift"]);

await assertText(
  "Storyboard-backed Capacitor scene",
  "ios/App/App/SceneDelegate.swift",
  source => source.includes('UIStoryboard(name: "Main"') && !source.includes("rootViewController = CAPBridgeViewController()"),
  "SceneDelegate can replace the configured storyboard controller and produce a blank launch screen"
);

await assertText(
  "Firebase initializes before native plugins",
  "ios/App/App/AppDelegate.swift",
  source => source.includes("import FirebaseCore")
    && source.includes("GoogleService-Info-Development")
    && source.includes("FirebaseApp.configure(options: options)"),
  "AppDelegate does not configure the bundled Firebase app"
);

await assertText(
  "Remote notification delegate wiring",
  "ios/App/App/AppDelegate.swift",
  source => [
    "didRegisterForRemoteNotificationsWithDeviceToken",
    "didFailToRegisterForRemoteNotificationsWithError",
    "didReceiveRemoteNotification"
  ].every(value => source.includes(value)),
  "AppDelegate is missing Firebase Messaging notification forwarding"
);

await assertText(
  "Workday background modes",
  "ios/App/App/Info.plist",
  source => ["<string>location</string>", "<string>remote-notification</string>"].every(value => source.includes(value)),
  "Info.plist is missing required background modes"
);

await assertText(
  "Secure subcontractor app link",
  "ios/App/App/Info.plist",
  source => source.includes("<string>mpifieldtools</string>"),
  "Info.plist does not register the private subcontractor activation route"
);

await assertText(
  "Office-controlled first-launch choice",
  "index.html",
  source => source.includes("mpiAccessChoice") && source.includes("SUBCONTRACTOR INVITATION") && source.includes("cannot grant or change a role"),
  "The installed app is missing its secure employee/subcontractor entry choice"
);

await assertText(
  "Push entitlement",
  "ios/App/App/App.entitlements",
  source => source.includes("aps-environment"),
  "App entitlements do not declare APNs"
);

await assertText(
  "Native bundle uses local Firebase runtime",
  "native-web/index.html",
  source => source.includes("./vendor/firebase-app-compat.js") && !source.includes("accounts.google.com/gsi/client"),
  "Prepared native bundle still depends on Google Identity Services or remote Firebase scripts"
);

await assertText(
  "Native alarm bundled in Xcode target",
  "ios/App/App.xcodeproj/project.pbxproj",
  source => source.includes("mpi_alarm.wav in Resources"),
  "The distinctive alarm sound is not in the app target"
);

await assertText(
  "Firebase configuration bundled in Xcode target",
  "ios/App/App.xcodeproj/project.pbxproj",
  source => source.includes("GoogleService-Info.plist in Resources")
    && source.includes("GoogleService-Info-Development.plist in Resources"),
  "GoogleService-Info.plist is not in the app target"
);

await assertText(
  "Debug app uses Personal Team signing without APNs",
  "ios/App/App.xcodeproj/project.pbxproj",
  source => {
    const debug = source.split("504EC3171FED79650016851F /* Debug */")[1]?.split("504EC3181FED79650016851F /* Release */")[0] || "";
    return debug.includes("CODE_SIGN_ENTITLEMENTS = App/App-Debug.entitlements;") && !debug.includes("APS_ENVIRONMENT");
  },
  "The Debug target must use the no-cost Personal Team entitlement set"
);

await assertText(
  "Release app retains APNs",
  "ios/App/App.xcodeproj/project.pbxproj",
  source => {
    const release = source.split("504EC3181FED79650016851F /* Release */")[1] || "";
    return release.includes("APS_ENVIRONMENT = production;") && release.includes("CODE_SIGN_ENTITLEMENTS = App/App.entitlements;");
  },
  "The Release target must retain its production APNs entitlement"
);

await assertText(
  "Operations workspace excludes ordinary messaging",
  "admin.html",
  source => {
    const operations = source.split('data-admin-panel="operations"')[1]?.split('data-admin-panel="requests"')[0] || "";
    return !operations.includes("adminReplyInbox") && !operations.includes("Inspector Replies");
  },
  "Operations contains an ordinary reply inbox"
);

await assertText(
  "Inspector operations excludes message composer",
  "admin.js",
  source => {
    const detail = source.split("function renderInspectorDetail")[1]?.split("function renderOperations")[0] || "";
    return !detail.includes("Message Inspector") && !detail.includes("adminMessageForm") && !detail.includes("adminMessageHistory");
  },
  "Inspector operational detail contains messaging controls"
);

await assertText(
  "Messages workspace owns conversations",
  "admin.html",
  source => source.includes('id="adminInboxMailbox"') && source.includes('id="adminInboxConversation"') && source.includes("admin-conversation-list"),
  "Messages workspace is missing its mailbox or focused conversation list"
);

await assertText(
  "Opening an inbox item shows only its focused conversation",
  "index.html",
  source => source.includes('id="fieldInboxMailbox"')
    && source.includes('id="fieldInboxConversation"')
    && source.includes('id="fieldInboxThreadBack"')
    && source.includes('id="fieldInboxThreadFiles"')
    && source.includes("function openFieldInboxConversation(userId)")
    && source.includes("fieldInboxMailbox.hidden = true")
    && source.includes("closeFieldInboxConversation"),
  "The field inbox cannot isolate one thread with Back, Reply, and attachment controls"
);

await assertText(
  "Message refresh preserves active composer",
  "admin.js",
  source => {
    const updates = source.split("function renderUpdates")[1]?.split("function canonicalTeamName")[0] || "";
    return updates.includes("refreshAdminInboxConversation()") && !updates.includes("renderOperations()");
  },
  "A message/data refresh can still redraw Operations and clear an active message"
);

await assertText(
  "Private-message read receipts only update inbound messages",
  "mpi-shared.js",
  source => {
    const read = source.split("async function markDirectConversationRead")[1]?.split("async function markFieldMessageRead")[0] || "";
    return read.includes("message.targetUid === user.uid")
      && read.includes("message.senderUid !== user.uid")
      && read.includes("message.readBy.includes(user.uid)");
  },
  "A legacy sent message can still make the whole conversation read-receipt batch fail"
);

await assertText(
  "Opening or replying clears the field inbox unread badge",
  "index.html",
  source => source.includes("function markTeamConversationRead(userId)")
    && source.includes("rememberFieldReadIds")
    && source.includes('window.dispatchEvent(new CustomEvent("mpi-office-update-opened"')
    && source.includes("markTeamConversationRead(selectedTeamMemberId);")
    && source.includes("markTeamConversationRead(userId);"),
  "The field inbox does not mark opened conversations and office updates read"
);

await assertText(
  "Stale message snapshots cannot restore an opened unread badge",
  "admin.js",
  source => source.includes("ADMIN_LOCAL_DIRECT_READ_KEY")
    && source.includes("rememberAdminDirectRead(incoming)")
    && source.includes("adminDirectMessageIsRead"),
  "The office inbox is missing its durable local read-state safeguard"
);

await assertText(
  "Office-update replies clear unread state immediately",
  "mpi-field-sync.js",
  source => source.includes('status: "replied"')
    && source.includes("async function markOpenedOfficeUpdateRead(updateId)")
    && source.includes('window.addEventListener("mpi-office-update-opened"'),
  "A read or replied office update can leave the field inbox badge stuck"
);

await assertText(
  "Comment Builder accepts photo, text, or both",
  "index.html",
  source => source.includes("Boolean(defectInput.value.trim() || selectedCommentPhoto)")
    && source.includes("if (!note && !photo)")
    && source.includes("ADD A PHOTO, ENTER A FIELD NOTE, OR USE BOTH.")
    && !/<textarea id="defectInput"[^>]*required/.test(source),
  "The Comment Builder still requires text or does not recognize photo evidence"
);

await assertText(
  "Photo-only comments use vision without text fallback",
  "mpi-comment-ai.js",
  source => source.includes('"PHOTO ONLY"')
    && source.includes('"PHOTO + TEXT"')
    && source.includes('"TEXT ONLY"')
    && source.includes("friendly.mpiFallbackAllowed = Boolean(cleanNote && !preparedPhoto)"),
  "Photo-only input is missing or can incorrectly fall back to the text-only rules engine"
);

await assertText(
  "Generated comments use continuous report lines",
  "mpi-comment-ai.js",
  source => source.includes("`${title}\\n${labels[0]}: ${observation}\\n${labels[1]}: ${implication}\\n${labels[2]}: ${recommendation}`"),
  "Generated comments still insert blank lines between report fields"
);

await assertText(
  "Completed jobs keep a durable restart lock",
  "index.html",
  source => source.includes('const WORKFLOW_COMPLETED_JOBS_STORAGE_KEY = "mpiWorkflowCompletedJobsV1"')
    && source.includes("rememberWorkflowCompletedJob(job)")
    && source.includes("workflowCompletedSnapshotJobs()")
    && !source.split("function clearDeliveredWorkflowLogs")[1]?.split("const WORKFLOW_EMAIL_EQUIPMENT_LABELS")[0]?.includes("WORKFLOW_COMPLETED_JOBS_STORAGE_KEY"),
  "Completed-job protection is missing or is cleared with the delivered daily log"
);

await assertText(
  "Completed jobs reject every workflow restart action",
  "index.html",
  source => {
    const update = source.split("function updateWorkflowStage")[1]?.split("function workflowClock")[0] || "";
    const onMyWay = source.split("function setWorkflowOnMyWay")[1]?.split("function workflowArrivalPerformance")[0] || "";
    return update.includes('status !== "completed" && rejectLockedWorkflowJob(job)')
      && onMyWay.includes("rejectLockedWorkflowJob(job)");
  },
  "A stale completed-job card can still record On My Way or another workflow stage"
);

await assertText(
  "Completion recovery uses one cached Office read",
  "index.html",
  source => {
    const recovery = source.split("async function reconcileWorkflowCompletionsFromOffice")[1]?.split("function workflowCompletedEventIds")[0] || "";
    return recovery.includes("MPI_SHARED.loadOwnOperationsDay(date)")
      && recovery.includes("WORKFLOW_COMPLETION_SYNC_STORAGE_KEY")
      && recovery.includes('receipt?.status === "complete"');
  },
  "Completed-job recovery is missing or can repeatedly consume Firebase reads"
);

await assertText(
  "Signed-in inspector can recover their own completed jobs",
  "mpi-shared.js",
  source => source.includes("async function loadOwnOperationsDay(date)")
    && source.includes("loadOwnOperationsDay,"),
  "The field app cannot read its own preserved Operations day for restart protection"
);

await assertText(
  "Historical route merges GPS and workflow checkpoints",
  "admin.js",
  source => source.includes("mergeHistoricalRoutePoints(uploadedPoints, verifiedPoints)")
    && source.includes("operationalRoutePoints(person, selectedDate)")
    && source.includes("loadHistoricalRoute({ refresh: true })"),
  "Actual Route can omit verified arrival, lab, home, or Clock Off locations or remain stale"
);

await assertText(
  "Historical route loads the complete workday efficiently",
  "admin.js",
  source => source.includes("async function uploadedHistoricalRoutePoints")
    && source.includes('.limit(4000)')
    && source.includes('where("recordedAtClient", ">=", latestRecordedAt)')
    && !source.includes('collection("points").orderBy("recordedAtClient", "asc").limit(500)'),
  "Actual Route is still capped at the first 500 points or lacks incremental refresh"
);

await assertText(
  "Native route point density is bounded",
  "native-plugins/mpi-background-location/ios/Sources/MPIBackgroundLocationPlugin/MPIBackgroundLocationPlugin.swift",
  source => source.includes("elapsed >= 165 || (elapsed >= 45 && distance >= 500)"),
  "The iPhone recorder can still write route points every few seconds while driving"
);

await assertText(
  "Native route finalizes before tracking stops",
  "mpi-field-sync.js",
  source => {
    const finalizer = source.split("async function finalizeNativeLocationSharing")[1]?.split("async function ensureNativeLocationSharing")[0] || "";
    return finalizer.includes("currentWorkdayLocation")
      && finalizer.includes('publishLiveLocation("native-final"')
      && finalizer.indexOf("flushNativeLocations().catch") < finalizer.indexOf("stopWorkdayLocation?.().catch");
  },
  "Clock Off can stop native tracking before its final location is uploaded"
);

await assertText(
  "Queued native route keeps observed timestamps",
  "mpi-field-sync.js",
  source => source.includes("const observedAt = Number(position?.timestamp)")
    && source.includes("new Date(Number.isFinite(observedAt)"),
  "Delayed native route uploads can be assigned the upload time instead of the observed time"
);

await assertText(
  "Requested iPhone location bypasses route throttling",
  "native-plugins/mpi-background-location/ios/Sources/MPIBackgroundLocationPlugin/MPIBackgroundLocationPlugin.swift",
  source => source.includes("var requestedPoint: MPIQueuedLocation?")
    && source.includes("requestedPoint != nil || shouldRecord(newest)"),
  "The final requested iPhone point can still be discarded by distance/time throttling"
);

await assertText(
  "Read-only Spectora completion closes the matching workflow job",
  "index.html",
  source => source.includes('status: String(job?.status || "")')
    && source.includes("jobs.filter(job => workflowJobIsComplete(job)).forEach(job => rememberWorkflowCompletedJob(job))"),
  "A completed read-only Spectora appointment can still be activated as a scheduled job"
);

await assertText(
  "Closed field day cannot expose a next appointment",
  "index.html",
  source => {
    const next = source.split("function workflowNextScheduledJob")[1]?.split("function workflowServiceLabel")[0] || "";
    const snapshot = source.split("function workflowOperationsSnapshot")[1]?.split("function syncWorkflowOperationsNow")[0] || "";
    const home = source.split("function renderActiveJob")[1]?.split("function saveActiveJob")[0] || "";
    return next.includes("workflowDayCompleteRecord()?.completedAt")
      && snapshot.includes("currentJob: null")
      && snapshot.includes("nextJob: null")
      && home.includes("completedDay?.completedAt ? []");
  },
  "A clocked-off field day can still display or restore a stale appointment"
);

await assertText(
  "Operations merge preserves explicit appointment clears",
  "mpi-shared.js",
  source => {
    const merge = source.split("function mergeOperationsDay")[1]?.split("async function syncOperationsSnapshot")[0] || "";
    return merge.includes('hasOwnProperty.call(latestData, "currentJob")')
      && merge.includes('hasOwnProperty.call(latestData, "nextJob")')
      && merge.includes('hasOwnProperty.call(latestData, "dayComplete")');
  },
  "Firestore merging can revive a current job, next job, or stale completed-day state"
);

await assertText(
  "Office next appointment respects closed workdays",
  "admin.js",
  source => {
    const closed = source.split("function operationDayIsClosed")[1]?.split("function currentAppointment")[0] || "";
    const next = source.split("function nextAppointment")[1]?.split("function operationalDuration")[0] || "";
    return closed.includes('=== "CLOCKED OUT"')
      && closed.includes("day?.dayComplete?.completedAt")
      && next.includes("operationDayIsClosed(day)");
  },
  "Office Console can still label a completed appointment as the next job"
);

await assertText(
  "Cory equipment catalog contains the exact 27 planned tools",
  "mpi-equipment.js",
  source => (source.match(/\btool\(\{/g) || []).length === 27
    && source.includes('model: "Milwaukee 2224-20"')
    && source.includes('title: "Digital GFCI receptacle tester"')
    && source.includes('model: "DJI Mini 4"')
    && source.includes("Scout 3-Pro Plus Micro sewer scope")
    && source.includes("never force the camera through an obstruction"),
  "The planned equipment catalog or detailed sewer-scope guide is incomplete"
);

await assertText(
  "Equipment remains not issued until handover",
  "mpi-equipment-admin.js",
  source => source.includes('status: "Not Issued"')
    && source.includes('item.status === "Issued"')
    && source.includes("!item.acknowledgmentReference")
    && source.includes('!received ? "Not Issued"')
    && source.includes("update.dateIssued = localDateKey(now)"),
  "The initial equipment setup can still falsely mark tools issued or a handover does not set the issue date"
);

await assertText(
  "Equipment records and mobile acknowledgment are available in Office",
  "admin.html",
  source => source.includes('data-admin-panel="equipment"')
    && source.includes('id="adminEquipmentDashboard"')
    && source.includes('id="equipmentEmployeeSignature"') === false
    && source.includes("mpi-equipment-admin.js"),
  "The Office Console is missing the equipment workspace or acknowledgment module"
);

await assertText(
  "Issued-tool acknowledgment requires employee signature and preserves history",
  "mpi-equipment-admin.js",
  source => source.includes("SUBMIT SIGNED ACKNOWLEDGMENT")
    && source.includes("if (!employeeSignature)")
    && source.includes("immutable: true")
    && source.includes("equipmentAcknowledgments")
    && source.includes("RE-SEND EMAIL")
    && source.includes("Tool added. It will appear in the employee's next acknowledgment."),
  "Signature enforcement, immutable history, email resend, or future-tool handling is missing"
);

await assertText(
  "Equipment handover contains only explicitly selected tools",
  "mpi-equipment-admin.js",
  source => source.includes("const selectedAssignmentIds = new Set()")
    && source.includes("function selectedPendingAssignments()")
    && source.includes('data-select-equipment-issue=')
    && source.includes("The form will include only these items")
    && source.includes("const records = selectedPendingAssignments();"),
  "The acknowledgment can still include tools that the admin did not select for handover"
);

await assertText(
  "Equipment cards use exact bundled product photos",
  "admin.html",
  source => source.includes(".equipment-product-photo")
    && source.includes(".equipment-issue-select"),
  "The equipment cards are missing their bundled product photos or handover selector"
);

await assertText(
  "Every equipment guide maps to its own product photo",
  "mpi-equipment.js",
  source => source.includes('window.MPI_EQUIPMENT_IMAGE_DATA?.[value.id]')
    && source.includes('`./equipment-images/${value.id}.jpg`'),
  "Equipment guides no longer map to individual make/model product photos"
);

try {
  const catalog = await readFile(join(root, "mpi-equipment.js"), "utf8");
  const ids = [...catalog.matchAll(/^\s+id: "([^"]+)",$/gm)].map(match => match[1]);
  if (ids.length !== 27) throw new Error(`expected 27 tool photos, found ${ids.length} catalog items`);
  for (const id of ids) {
    const photo = await readFile(join(root, "equipment-images", `${id}.jpg`));
    if (photo.length < 1000) throw new Error(`${id}.jpg is missing or incomplete`);
  }
  console.log("PASS  All 27 individual equipment product photos are bundled");
} catch (error) {
  failures.push(`All 27 individual equipment product photos are bundled: ${error.message}`);
  console.error("FAIL  All 27 individual equipment product photos are bundled");
}

await assertText(
  "Firestore protects signed equipment acknowledgments",
  "firestore.rules",
  source => source.includes("match /equipmentAssignments/{assignmentId}")
    && source.includes("match /equipmentAcknowledgments/{acknowledgmentId}")
    && source.includes("allow update, delete: if false;"),
  "Equipment collections or immutable acknowledgment rules are missing"
);

await assertText(
  "Native app bundles equipment functionality",
  "scripts/prepare-native-web.mjs",
  source => source.includes('"mpi-equipment.js"')
    && source.includes('"mpi-equipment-images.js"')
    && source.includes('"mpi-equipment-admin.js"')
    && source.includes('join(root, "equipment-images")'),
  "The native iPhone build omits the equipment catalog, product photos, or admin workflow"
);

run("Field update behavior regressions", process.execPath, ["scripts/test-field-update.mjs"]);
run("Michigan / all-inspector planning regressions", process.execPath, ["scripts/test-planning-comparison.mjs"]);

if (failures.length) {
  console.error(`\n${failures.length} native verification check${failures.length === 1 ? "" : "s"} failed:`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("\nNative source and project validation passed.");
}
