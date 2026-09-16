import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const sharedSource = await readFile(new URL("../mpi-shared.js", import.meta.url), "utf8");
const documents = new Map();
const storage = new Map();
const events = new Map();
const listeners = new Set();
let nextId = 0;
let persistenceCalls = 0;
let acknowledgementLost = false;
let sendWrites = 0;
const user = { uid: "kevin", email: "kev@michiganpropertyinspections.com", getIdToken: async () => "test-token" };
const auth = { currentUser: user, setPersistence: async () => true };
const applyValues = (old, data) => Object.fromEntries(Object.entries({ ...old, ...data }).map(([key, value]) => [key, value?.union ? [...new Set([...(old?.[key] || []), ...value.union])] : value]));
const tick = () => new Promise(resolve => setImmediate(resolve));
function snapshotFor(query) {
  const docs = [...documents].filter(([path, data]) => path.startsWith(`${query.path}/`) && path.split("/").length === query.path.split("/").length + 1 && query.filters.every(([key, op, value]) => op === "array-contains" ? data[key]?.includes(value) : data[key] === value)).map(([path, data]) => ({ id: path.split("/").at(-1), ref: docRef(path), data: () => data }));
  return { docs: docs.slice(0, query.maximum || docs.length), metadata: { fromCache: false } };
}
function emit() { queueMicrotask(() => listeners.forEach(listener => listener.next(snapshotFor(listener.query)))); }
function docRef(path) {
  return {
    id: path.split("/").at(-1), collection: name => queryRef(`${path}/${name}`),
    get: async () => ({ exists: documents.has(path), data: () => documents.get(path) }),
    set: async (data, options) => {
      if (documents.has(path) && !options?.merge && path.startsWith("teamMessages/")) throw Object.assign(new Error("Immutable message cannot be rewritten"), { code: "permission-denied" });
      documents.set(path, applyValues(options?.merge ? documents.get(path) : {}, data));
      if (path.split("/").length === 2 && path.startsWith("teamMessages/")) sendWrites += 1;
      emit();
      if (acknowledgementLost) { acknowledgementLost = false; throw Object.assign(new Error("Lost acknowledgement after server accepted"), { code: "unavailable" }); }
    },
    update: async data => { documents.set(path, applyValues(documents.get(path), data)); emit(); }
  };
}
function queryRef(path, filters = [], maximum = 0) {
  const query = { path, filters, maximum };
  return {
    doc: id => docRef(`${path}/${id || `message-${++nextId}`}`),
    where: (key, op, value) => queryRef(path, [...filters, [key, op, value]], maximum),
    limit: value => queryRef(path, filters, value),
    get: async () => snapshotFor(query),
    onSnapshot: (options, next, error) => {
      if (typeof options === "function") { error = next; next = options; }
      const listener = { query, next, error }; listeners.add(listener);
      queueMicrotask(() => { if (listeners.has(listener)) next(snapshotFor(query)); });
      return () => listeners.delete(listener);
    }
  };
}
const db = {
  collection: queryRef, enablePersistence: async () => { persistenceCalls += 1; },
  batch: () => { const writes = []; return { set: (ref, value, options) => writes.push(() => ref.set(value, options)), commit: async () => { for (const write of writes) await write(); } }; }
};
const firebaseAuth = () => auth;
firebaseAuth.Auth = { Persistence: { LOCAL: "local" } };
const firestore = () => db;
firestore.FieldValue = { serverTimestamp: () => new Date().toISOString(), arrayUnion: (...union) => ({ union }) };
const document = { visibilityState: "visible", addEventListener: (name, callback) => events.set(name, callback) };
const window = { firebase: { apps: [{}], app: () => ({ auth: firebaseAuth, firestore }), initializeApp: () => {}, auth: firebaseAuth, firestore }, Capacitor: { isNativePlatform: () => true }, crypto: { randomUUID: () => `reference-${++nextId}` }, addEventListener: (name, callback) => events.set(name, callback) };
const context = vm.createContext({ window, document, navigator: { userAgent: "iPhone", platform: "iPhone", onLine: true }, localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }, fetch: async () => ({ ok: true, json: async () => ({ success: true }) }), console, Date, Map, Set, URL, setTimeout, clearTimeout });
vm.runInContext(sharedSource, context);
const shared = window.MPI_SHARED;
assert.equal(persistenceCalls, 0, "Installed mobile app must not use IndexedDB persistence");

const target = { id: "brooke", name: "Brooke", email: "admin@michiganpropertyinspections.com", role: "admin" };
acknowledgementLost = true;
await assert.rejects(shared.sendDirectMessage(user, { name: "Kevin" }, target, "Please credit the sewer scope."));
const pending = JSON.parse(storage.get("mpiPendingDirectMessagesV1:kevin"));
assert.equal(Object.keys(pending).length, 1);
const accepted = await shared.sendDirectMessage(user, { name: "Kevin" }, target, "Please credit the sewer scope.");
assert.equal(sendWrites, 1, "Lost acknowledgement must not create duplicate message");
assert.equal(accepted.targetUid, "brooke");
assert.equal(Object.keys(JSON.parse(storage.get("mpiPendingDirectMessagesV1:kevin"))).length, 0);
context.navigator.onLine = false;
await assert.rejects(shared.sendDirectMessage(user, {}, target, "Preserve this offline draft."));
assert.equal(sendWrites, 1);
assert.match(shared.messageFailure(new Error("FIRESTORE INTERNAL ASSERTION cursor")).message, /preserved.*try again/i);
assert.doesNotMatch(shared.messageFailure(new Error("FIRESTORE INTERNAL ASSERTION cursor")).message, /FIRESTORE|ASSERTION|cursor/);
context.navigator.onLine = true;

let records = [];
const unsubscribeA = shared.watchDirectMessages(user, value => { records = value; });
const unsubscribeB = shared.watchDirectMessages(user, () => {});
await tick();
assert.equal(listeners.size, 1, "Multiple views share one underlying message listener");
document.visibilityState = "hidden"; events.get("visibilitychange")();
assert.equal(listeners.size, 0);
assert.ok(records.length, "Backgrounding retains last-known conversation");
document.visibilityState = "visible"; events.get("visibilitychange")(); await tick();
assert.equal(listeners.size, 1);
events.get("online")(); await tick();
assert.equal(listeners.size, 1, "Reconnect replaces, not duplicates, the listener");
documents.set("teamMessages/incoming", { conversationId: "brooke__kevin", participantIds: ["brooke", "kevin"], targetUid: "kevin", senderUid: "brooke", message: "Done", active: true, readBy: ["brooke"], createdAtClient: new Date().toISOString() });
emit(); await tick();
await Promise.all([shared.markDirectConversationRead(user, "brooke"), shared.markDirectConversationRead(user, "brooke")]);
assert.deepEqual(documents.get("teamMessages/incoming").readBy, ["brooke", "kevin"]);
assert.deepEqual(Array.from(documents.get(`teamMessages/${accepted.id}`).readBy), ["kevin"], "Sender must not mark recipient's message read");
assert.equal((await shared.messagingHealth()).status, "healthy");
unsubscribeA(); assert.equal(listeners.size, 1); unsubscribeB(); assert.equal(listeners.size, 0);

const at = minutes => new Date(Date.UTC(2026, 8, 15, 12, minutes)).toISOString();
const day = { date: "2026-09-15", activity: [], timeClock: { active: true, sessions: [{ clockedInAt: at(0), startSource: "first-arrival" }] } };
const transitions = [["Inspection started", "INSPECTION STARTED", {}], ["Lab selected", "ON WAY TO IMS", { labs: ["IMS"] }], ["Arrived at lab", "AT IMS", { lab: "IMS" }], ["Lab visit completed", "LAB COMPLETE", {}], ["Proceed home selected", "DRIVING HOME", {}], ["Arrived home / end location", "ARRIVED HOME / END LOCATION", {}], ["Clocked off", "CLOCKED OUT", {}]];
transitions.forEach(([action, expected, data], index) => {
  day.activity.push({ id: `event-${index}`, action, timestamp: at(index + 1), data });
  const state = shared.currentWorkflowStatus(day);
  assert.equal(state.value, expected);
  assert.equal(state.updatedAt, at(index + 1));
});
const newer = { ...day, currentJob: null, nextJob: null, updatedAtClient: at(15) };
const old = { date: day.date, liveStatus: "INSPECTION IN PROGRESS", updatedAtClient: at(2), currentJob: { id: "old-job" }, activity: day.activity.slice(0, 1) };
const before = JSON.stringify(newer);
const merged = shared.mergeOperationsDay(newer, old);
assert.equal(shared.currentWorkflowStatus({ currentJob: { onMyWayAt: null, arrivedAt: null } }).value, "NOT STARTED");
assert.equal(merged.liveStatus, "CLOCKED OUT", "Late snapshot cannot restore old inspection status");
assert.equal(merged.currentJob, null, "Late snapshot cannot reopen a closed appointment");
assert.equal(JSON.stringify(newer), before, "Merging preserves original source data");
assert.equal(shared.currentWorkflowStatus({ ...day, labStop: { stage: "travel", labs: ["water-tech", "ims"], currentIndex: 1, travelStartedAt: at(20) } }).value, "ON WAY TO IMS");
assert.equal(shared.currentWorkflowStatus({ activity: [{ action: "NACHI training started", timestamp: at(0) }] }).value, "NACHI TRAINING");
const subcontractorState = { status: "AT JOB – JOB 1", updatedAtClient: at(30), events: [{ status: "AT JOB – JOB 1", timestamp: at(10) }, { status: "ON WAY TO IMS LABORATORY", timestamp: at(20) }] };
assert.equal(shared.currentWorkflowStatus({ events: subcontractorState.events.slice(0, 1), currentJob: { number: 1, arrivedAt: at(10) } }).value, "AT JOB – JOB 1");
assert.equal(shared.currentWorkflowStatus(subcontractorState).value, "ON WAY TO IMS");
assert.equal(shared.currentWorkflowStatus(subcontractorState).updatedAt, at(20), "Subcontractor status uses the real button-action time, not a sync heartbeat");
assert.match(shared.teamQualification({ email: "cory@michiganpropertyinspections.com" }), /CPI.*Certified Professional Inspector/);

const planningSource = await readFile(new URL("../mpi-planning.js", import.meta.url), "utf8");
vm.runInContext(planningSource, context);
const planning = window.MPI_PLANNING;
assert.equal(planning.addressResult({ geometry: { coordinates: [-83, 42] }, properties: { housenumber: "4481", street: "Oak Road", city: "Canton", state: "Michigan", postcode: "48187", countrycode: "US" } }).address, "4481 Oak Road, Canton, MI 48187");
assert.equal(planning.earliestArrival("2026-09-16T13:30:00-04:00", 31, "2026-09-16", "2026-09-15"), "2026-09-16T18:01:00.000Z");
assert.equal(planning.earliestArrival("", 31, "2026-09-16", "2026-09-15"), "");
const michiganFeature = (state, coordinates, number = "4481") => ({ geometry: { coordinates }, properties: { housenumber: number, street: "Oak Road", city: "Canton", state, postcode: "48187", countrycode: "US" } });
const originalFetch = context.fetch;
const addressRequests = [];
context.fetch = async endpoint => { addressRequests.push(new URL(endpoint)); return { ok: true, json: async () => ({ features: [michiganFeature("Michigan", [-83, 42]), michiganFeature("Ohio", [-83, 41.7]), michiganFeature("Wisconsin", [-90, 46]), michiganFeature("Michigan", [-87.4, 46.5], "22"), michiganFeature("Michigan", [-120, 42])] }) }; };
const michiganMatches = await planning.searchAddresses("Oak Road Canton");
assert.equal(michiganMatches.length, 2, "Only Michigan results from both peninsulas are suggested, excluding neighboring states and invalid coordinates");
assert.equal(planning.isMichiganAddress({ state: "Ohio", matchedAddress: "100 Michigan Avenue, Toledo, Ohio", latitude: 41.7, longitude: -83.5 }), false, "A Michigan street name in another state must not pass the state filter");
assert.ok(addressRequests.every(url => url.searchParams.get("bbox") === "-90.5,41.6,-82.1,48.35" && url.searchParams.get("countrycode") === "US"));
await planning.searchAddresses("Oak Road Canton");
assert.equal(addressRequests.length, 2, "Address suggestions are cached rather than repeatedly requested");
context.fetch = originalFetch;
const planningJobs = [{ id: "first", scheduledStart: "2026-09-16T09:00:00-04:00" }, { id: "last", scheduledStart: "2026-09-16T13:00:00-04:00" }];
assert.equal(planning.defaultJob(planningJobs, "2026-09-16", "2026-09-15").id, "first");
assert.equal(planning.defaultJob(planningJobs, "2026-09-16", "2026-09-15", "", "last").id, "last");
assert.equal(planning.defaultJob(planningJobs, "2026-09-16", "2026-09-16", "first", "auto", Date.parse("2026-09-16T12:00:00-04:00")).id, "first", "Actual current job overrides a later scheduled job");
assert.equal(planning.defaultJob([], "2026-09-16", "2026-09-15"), null, "Missing schedules never create a false origin");

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const draftStorage = new Map([["drafts", JSON.stringify({ "brooke__kevin": "Original unsent draft" })], ["drafts:legacyOwner", "kevin"]]);
const accountWindow = { MPI_COMPANY_SESSION: { userId: "kevin" }, MPI_SHARED: { directConversationId: (a, b) => [a, b].sort().join("__") } };
const accountContext = vm.createContext({ window: accountWindow, selectedTeamMemberId: "brooke", TEAM_MESSAGE_DRAFT_STORAGE_KEY: "drafts", localStorage: { getItem: key => draftStorage.get(key), setItem: (key, value) => draftStorage.set(key, value) }, URL });
vm.runInContext(html.slice(html.indexOf("      function loadTeamMessageDrafts()"), html.indexOf("      function teamRoleLabel")), accountContext);
assert.equal(accountContext.teamMessageDraft("brooke"), "Original unsent draft");
accountWindow.MPI_COMPANY_SESSION = { userId: "brooke" };
assert.equal(accountContext.teamMessageDraft("kevin"), "", "Another signed-in account must not inherit the original author's draft");
accountContext.saveTeamMessageDraft("Brooke's own reply", "kevin");
accountWindow.MPI_COMPANY_SESSION = { userId: "kevin" };
assert.equal(accountContext.teamMessageDraft("brooke"), "Original unsent draft");
accountContext.saveTeamMessageDraft("", "brooke");
assert.equal(accountContext.teamMessageDraft("brooke"), "", "Clearing a successfully sent draft cannot resurrect legacy text");
assert.equal(JSON.parse(draftStorage.get("drafts")).brooke__kevin, "Original unsent draft", "Legacy draft data is retained intact");

let subscriptionsCreated = 0;
let subscriptionsClosed = 0;
const retiredMessageCallbacks = [];
const watched = callback => { subscriptionsCreated += 1; retiredMessageCallbacks.push(callback); return () => { subscriptionsClosed += 1; }; };
Object.assign(accountWindow.MPI_SHARED, { watchTeamDirectory: watched, watchTeamPresence: watched, watchDirectMessages: (_, callback) => watched(callback), watchSentFieldMessages: (_, callback) => watched(callback), auth: { currentUser: user } });
Object.assign(accountWindow, { location: { href: "http://localhost/" } });
vm.runInContext("let unsubscribeTeamDirectory=null, unsubscribeTeamPresence=null, unsubscribeTeamDirectMessages=null, unsubscribeFieldSentMessages=null, teamDirectListenerReady=false, teamDirectoryRecords=[], teamPresenceRecords=[], teamDirectMessages=[], fieldSentMessages=[], selectedTeamMemberIdForTest='';", accountContext);
Object.assign(accountContext, { closeTeamProfile() {}, closeFieldInboxConversation() {}, renderTeamDirectory() {}, renderFieldInbox() {}, fieldInboxComposeForm: { reset() {} }, fieldInboxThreadSend: {}, teamPrivateSend: {}, fieldInboxComposeSend: {} });
vm.runInContext(html.slice(html.indexOf("      function startTeamConnection("), html.indexOf('      window.addEventListener("mpi-workflow-status-changed"')), accountContext);
accountContext.startTeamConnection({ userId: "kevin" });
accountContext.startTeamConnection({ userId: "kevin" });
assert.equal(subscriptionsCreated, 4, "Remounting the same user does not create more listeners");
accountWindow.MPI_COMPANY_SESSION = { userId: "brooke" };
accountContext.startTeamConnection({ userId: "brooke" });
assert.equal(subscriptionsClosed, 4, "Changing signed-in user unsubscribes all prior account listeners");
retiredMessageCallbacks[2]([{ id: "private-old-user-message" }], null);
assert.equal(vm.runInContext("teamDirectMessages.length", accountContext), 0, "Late snapshots from another account are ignored");
accountWindow.MPI_COMPANY_SESSION = null;
accountContext.startTeamConnection(null);
assert.equal(subscriptionsClosed, 8, "Signing out closes all account listeners");
const evidenceFunction = html.slice(html.indexOf("      function updateCommentGenerateState()"), html.indexOf("      function setSelectedCommentPhoto"));
const evidenceContext = vm.createContext({ defectInput: { value: "" }, selectedCommentPhoto: null, commentGenerationPending: false, generateCommentBtn: { disabled: false, setAttribute() {} } });
vm.runInContext(evidenceFunction, evidenceContext);
for (const [note, photo, disabled] of [["", null, true], ["", { name: "ceiling.jpg" }, false], ["Loose GFCI", null, false], ["Active leak in ceiling utility closet", { name: "ceiling.jpg" }, false]]) {
  evidenceContext.defectInput.value = note; evidenceContext.selectedCommentPhoto = photo;
  vm.runInContext("updateCommentGenerateState()", evidenceContext);
  assert.equal(evidenceContext.generateCommentBtn.disabled, disabled);
}
const aiSource = await readFile(new URL("../mpi-comment-ai.js", import.meta.url), "utf8");
const commentPolicySource = await readFile(new URL("../mpi-comment-policy.js", import.meta.url), "utf8");
const parsing = aiSource.slice(aiSource.indexOf("function cleanSentence"), aiSource.indexOf("async function generate"));
vm.runInContext(parsing, context);
const output = context.parseResponse(JSON.stringify({ title: "Electrical - Loose GFCI", observation: "The GFCI receptacle was loose.", implication: "Movement may loosen electrical connections.", recommendation: "Have a qualified electrical contractor secure the receptacle." }), "Loose GFCI", "defect", "auto");
assert.equal(output.split("\n").length, 4); assert.ok(!output.includes("\n\n"));
assert.throws(() => context.parseResponse(JSON.stringify({ title: "Loose GFCI", observation: "Loose", implication: "Hazard", recommendation: "Repair" }), "", "defect", "auto"));
assert.match(commentPolicySource, /inspector's factual field observation is authoritative/);
assert.ok(!/<textarea id="defectInput"[^>]*required/.test(html));
const modelRequests = [];
let transientFailure = false;
let permanentFailure = false;
const aiStorage = new Map();
const aiWindow = { MPI_COMPANY_SESSION: { inspectorEmail: user.email }, dispatchEvent() {}, setTimeout, clearTimeout };
const aiContext = vm.createContext({
  window: aiWindow, navigator: { onLine: true },
  localStorage: { getItem: key => aiStorage.get(key), setItem: (key, value) => aiStorage.set(key, value) },
  sessionStorage: { getItem: key => aiStorage.get(key), setItem: (key, value) => aiStorage.set(key, value) },
  Schema: { object: value => value, string: () => "string" }, initializeApp: () => ({}), getApps: () => [], initializeAppCheck() {},
  ReCaptchaEnterpriseProvider: class {}, GoogleAIBackend: class {}, getAI: () => ({}),
  getGenerativeModel: () => ({ generateContent: async content => {
    modelRequests.push(content);
    if (transientFailure || permanentFailure) { transientFailure = false; throw Object.assign(new Error("503 service unavailable"), { status: 503 }); }
    return { response: { text: () => JSON.stringify({ title: "Ceilings - Water Staining", observation: "Staining was visible on the ceiling.", implication: "The condition may be associated with previous moisture exposure.", recommendation: "Have a qualified contractor evaluate the affected area and repair as appropriate." }) } };
  } }),
  CustomEvent: class {}, console: { warn() {} }, Date, Map, URL, setTimeout, clearTimeout,
  createImageBitmap: async () => ({ width: 100, height: 100, close() {} }),
  document: { createElement: () => ({ getContext: () => ({ fillRect() {}, drawImage() {} }), toBlob: callback => callback({ size: 100 }) }) },
  FileReader: class { readAsDataURL() { this.result = "data:image/jpeg;base64,cGhvdG8="; this.onload(); } }
});
vm.runInContext(commentPolicySource, aiContext);
vm.runInContext(aiSource.replace(/^import .*;\n/gm, ""), aiContext);
const photo = { name: "ceiling.jpg", type: "image/jpeg", size: 100 };
for (const [id, note, supportingPhoto, mode] of [["photo", "", photo, "PHOTO ONLY"], ["text", "Ceiling staining", null, "TEXT ONLY"], ["both", "Prior staining, no active leak", photo, "PHOTO + TEXT"]]) {
  const result = await aiWindow.MPI_COMMENT_AI.generate({ id, note, photo: supportingPhoto });
  assert.equal(result.split("\n").length, 4);
  const request = modelRequests.at(-1);
  assert.match(Array.isArray(request) ? request[0] : request, new RegExp(mode.replace("+", "\\+")));
  assert.equal(Array.isArray(request), Boolean(supportingPhoto));
  if (supportingPhoto) assert.equal(request[1].inlineData.mimeType, "image/jpeg");
}
const visionLog = aiWindow.MPI_COMMENT_AI.technicalLog().find(entry => entry.requestId === "photo" && entry.result === "success");
assert.equal(visionLog.aiRequestContainedImage, true);
assert.equal(visionLog.imageUploadSucceeded, true);
assert.equal(visionLog.imageAnalysisCompleted, true);
assert.equal(visionLog.imageCount, 1);
assert.equal(visionLog.originalImageWidth, 100);
assert.equal(visionLog.processedImageWidth, 100);
assert.match(visionLog.promptVersion, /^mpi-comment-v\d/);
transientFailure = true;
const beforeRetry = modelRequests.length;
await aiWindow.MPI_COMMENT_AI.generate({ id: "retry", note: "Ceiling staining", photo });
assert.equal(modelRequests.length, beforeRetry + 2, "Transient failure retries once");
await aiWindow.MPI_COMMENT_AI.generate({ id: "retry", note: "Ceiling staining", photo });
assert.equal(modelRequests.length, beforeRetry + 2, "Same successful request ID reuses output without another AI call");
permanentFailure = true;
await assert.rejects(aiWindow.MPI_COMMENT_AI.generate({ id: "failed", note: "Keep my original note", photo }), error => error.requestId === "failed" && error.mpiFallbackAllowed === false);
assert.equal(aiWindow.MPI_COMMENT_AI.usageSnapshot().monthlyUsed, 4, "Retry and failure do not count duplicate comments");
assert.ok(aiWindow.MPI_COMMENT_AI.technicalLog().some(entry => entry.requestId === "failed" && entry.result === "failed"));
console.log("PASS Field update: mobile memory cache, retry idempotency, offline preservation, listener lifecycle, private receipts, health, status chronology, training/CPI, planner, three actual AI request modes, transient retry and failure logging");
