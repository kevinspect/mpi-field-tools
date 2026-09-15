import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../mpi-shared.js", import.meta.url), "utf8");
const fieldSource = await readFile(new URL("../mpi-field-sync.js", import.meta.url), "utf8");
const appSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
const adminSource = await readFile(new URL("../admin.js", import.meta.url), "utf8");
const subcontractorSource = await readFile(new URL("../mpi-subcontractor.js", import.meta.url), "utf8");
const documents = new Map();
const listeners = new Set();
let writes = 0, reads = 0, transactions = 0, quota = false, pauseTransaction = null;
const tick = () => new Promise(resolve => setImmediate(resolve));
const apply = (previous, data) => Object.fromEntries(Object.entries({ ...previous, ...data }).map(([key, value]) => [key, value?.union ? [...new Set([...(previous?.[key] || []), ...value.union])] : value]));
function snapshot(path, filters) {
  return { docs: [...documents].filter(([key, data]) => key.startsWith(`${path}/`) && key.split("/").length === path.split("/").length + 1 && filters.every(([field, op, value]) => op === "array-contains" ? data[field]?.includes(value) : data[field] === value)).map(([key, data]) => ({ id: key.split("/").at(-1), data: () => data })), metadata: { fromCache: false, hasPendingWrites: false } };
}
function emit() { queueMicrotask(() => listeners.forEach(listener => listener.callback(snapshot(listener.path, listener.filters)))); }
function failQuota() { if (quota) throw Object.assign(new Error("Quota exceeded"), { code: "resource-exhausted" }); }
function ref(path) {
  return { id: path.split("/").at(-1), path, collection: name => query(`${path}/${name}`),
    get: async () => { reads += 1; failQuota(); return { exists: documents.has(path), data: () => documents.get(path) }; },
    set: async (data, options) => { failQuota(); writes += 1; documents.set(path, apply(options?.merge ? documents.get(path) : {}, data)); emit(); }
  };
}
function query(path, filters = []) {
  return { doc: id => ref(`${path}/${id || "generated"}`),
    where: (field, op, value) => query(path, [...filters, [field, op, value]]),
    get: async () => { reads += 1; failQuota(); return snapshot(path, filters); },
    onSnapshot: (options, callback) => {
      if (typeof options === "function") callback = options;
      const listener = { path, filters, callback }; listeners.add(listener);
      queueMicrotask(() => { if (listeners.has(listener)) callback(snapshot(path, filters)); });
      return () => listeners.delete(listener);
    }
  };
}
const db = {
  collection: query, enablePersistence: async () => {},
  batch: () => { const records = []; return { set: (...args) => records.push(args), commit: async () => { failQuota(); for (const [document, data, options] of records) await document.set(data, options); } }; },
  runTransaction: async callback => {
    transactions += 1; failQuota();
    const records = [];
    await callback({ get: document => document.get(), set: (...args) => records.push(args) });
    if (pauseTransaction) { const pause = pauseTransaction; pauseTransaction = null; await pause; }
    failQuota();
    for (const [document, data, options] of records) await document.set(data, options);
  }
};
const user = { uid: "kevin", email: "kev@michiganpropertyinspections.com", getIdToken: async () => "test-token" };
function device(storage = new Map()) {
  const auth = { currentUser: user, setPersistence: async () => {} };
  const authFactory = () => auth; authFactory.Auth = { Persistence: { LOCAL: "local" } };
  const firestore = () => db; firestore.FieldValue = { serverTimestamp: () => new Date().toISOString(), arrayUnion: (...union) => ({ union }) };
  const events = new Map(), timers = new Set();
  const on = (name, callback) => { const values = events.get(name) || []; values.push(callback); events.set(name, values); };
  const window = { firebase: { apps: [{}], initializeApp: () => {}, app: () => ({ auth: authFactory, firestore }), auth: authFactory, firestore }, Capacitor: { isNativePlatform: () => true }, addEventListener: on,
    dispatchEvent: event => (events.get(event.type) || []).forEach(callback => callback(event)) };
  const context = vm.createContext({ window, navigator: { onLine: true, userAgent: "iPhone" }, document: { visibilityState: "visible", addEventListener: on },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }, console, Date, Map, Set, Math, URL,
    setTimeout: (callback, delay) => { const timer = setTimeout(callback, delay); timer.unref(); timers.add(timer); return timer; }, clearTimeout,
    fetch: async () => ({ ok: true, json: async () => ({ success: true }) })
  });
  vm.runInContext(source, context);
  return { shared: window.MPI_SHARED, context, storage, auth, window, close: () => timers.forEach(clearTimeout) };
}
const phone = device();
documents.set("users/kevin", { name: "Kevin Cave", role: "owner", email: user.email, active: true, operationsDays: [{ date: "2026-09-01", jobs: [{ id: "historical" }] }] });
const at = minute => new Date(Date.UTC(2026, 8, 15, 12, minute)).toISOString();
const day = { date: "2026-09-15", updatedAtClient: at(0), jobs: [{ id: "job-a", status: "scheduled" }], activity: [{ id: "ready", timestamp: at(0), action: "Morning readiness completed", data: { syncStatus: "queued" } }], readiness: { completedAt: at(0) }, timeClock: { activityStartedAt: at(0), sessions: [] } };
assert.equal(await phone.shared.syncOperationsSnapshot(day), true);
const initialTransactions = transactions, initialWrites = writes;
assert.equal(await phone.shared.syncOperationsSnapshot({ ...day, updatedAtClient: at(9), activity: day.activity.map(event => ({ ...event, data: { ...event.data, syncStatus: "synced", syncedAt: at(3) } })) }), true);
assert.equal(transactions, initialTransactions, "Unchanged snapshots do not read the profile again");
assert.equal(writes, initialWrites, "Local transport metadata does not cause writes");
await phone.shared.syncOperationsSnapshot(day, { force: true });
assert.equal(transactions, initialTransactions + 1, "Office requests can explicitly resend unchanged status");
phone.context.navigator.onLine = false;
const arriving = { ...day, updatedAtClient: at(20), jobs: [{ id: "job-a", status: "arrived", arrivedAt: at(20) }], activity: [...day.activity, { id: "arrived", timestamp: at(20), action: "Arrived", data: {} }], timeClock: { ...day.timeClock, sessions: [{ clockedInAt: at(20), startSource: "first-arrival" }] } };
assert.equal(await phone.shared.syncOperationsSnapshot(arriving), false);
assert.ok(JSON.parse(phone.storage.get("mpiEventSyncV1:kevin")).operations[day.date], "Offline day snapshot is durable");
phone.close();
const resumed = device(phone.storage);
await resumed.shared.flushPendingSync();
assert.equal(documents.get("users/kevin").operationsCurrent.jobs[0].arrivedAt, at(20));
assert.equal(documents.get("users/kevin").operationsCurrent.timeClock.sessions[0].clockedInAt, at(20));
assert.ok(documents.get("users/kevin").operationsDays.find(value => value.date === "2026-09-01"), "Prior days remain intact");
quota = true;
const completed = { ...arriving, updatedAtClient: at(50), jobs: [{ ...arriving.jobs[0], status: "completed", completedAt: at(50) }], activity: [...arriving.activity, { id: "completed", timestamp: at(50), action: "Final job completion", data: {} }] };
assert.equal(await resumed.shared.syncOperationsSnapshot(completed), false);
const attempts = transactions;
for (let index = 0; index < 12; index += 1) await resumed.shared.syncOperationsSnapshot(completed, { force: true });
assert.equal(transactions, attempts, "Quota cooldown prevents refresh/retry storms");
const held = JSON.parse(resumed.storage.get("mpiEventSyncV1:kevin"));
assert.equal(held.lastError.quota, true);
assert.equal(held.operations[day.date].snapshot.jobs[0].completedAt, at(50));
quota = false; held.retryAt = 0; resumed.storage.set("mpiEventSyncV1:kevin", JSON.stringify(held));
await resumed.shared.flushPendingSync();
assert.equal(documents.get("users/kevin").operationsCurrent.jobs[0].status, "completed");
await resumed.shared.syncOperationsSnapshot({ ...day, date: "2026-09-14", activity: [{ id: "yesterday", action: "Morning readiness completed", timestamp: "2026-09-14T12:00:00Z", data: {} }] });
assert.equal(documents.get("users/kevin").operationsCurrent.date, "2026-09-15", "Late older-day uploads cannot replace today's status");
resumed.context.navigator.onLine = false;
await resumed.shared.syncOperationsSnapshot({ ...completed, date: "2026-09-16" });
resumed.auth.currentUser = { ...user, uid: "cory" }; resumed.context.navigator.onLine = true;
await resumed.shared.flushPendingSync("kevin");
assert.ok(JSON.parse(resumed.storage.get("mpiEventSyncV1:kevin")).operations["2026-09-16"], "Account switch retains pending work with its original author");
assert.equal(documents.has("users/cory"), false);
resumed.auth.currentUser = user;
await resumed.shared.flushPendingSync();
const directory = { id: "brooke", userId: "brooke", name: "Brooke", email: "admin@michiganpropertyinspections.com", role: "admin", active: true };
await resumed.shared.syncTeamDirectoryRecords([directory]);
const directoryWrites = writes;
for (let index = 0; index < 25; index += 1) await resumed.shared.syncTeamDirectoryRecords([directory]);
assert.equal(writes, directoryWrites, "Repeated GPS/status snapshots never rewrite unchanged team-directory records");
await resumed.shared.syncTeamDirectoryRecords([{ ...directory, profilePhoto: "new-photo" }]);
assert.equal(writes, directoryWrites + 1, "Real profile changes still update the directory");

documents.set("teamMessages/brooke-message", { participantIds: ["brooke", "kevin"], conversationId: "brooke__kevin", senderUid: "brooke", targetUid: "kevin", readBy: ["brooke"], deliveredTo: ["kevin"], active: true, createdAtClient: at(2), message: "Please confirm." });
const computer = device();
let phoneMessages = [], computerMessages = [];
const stopPhone = resumed.shared.watchDirectMessages(user, values => { phoneMessages = values; });
const stopComputer = computer.shared.watchDirectMessages(user, values => { computerMessages = values; });
await tick();
assert.equal(computerMessages[0].readBy.includes("kevin"), false);
// The office UI mutates its optimistic view before calling the shared receipt
// function. Server receipt state must not be inferred from that mutated object.
phoneMessages[0].readBy = [...phoneMessages[0].readBy, "kevin"];
await resumed.shared.markDirectConversationRead(user, "brooke", ["brooke-message"]);
await tick();
assert.equal(computerMessages[0].readBy.includes("kevin"), true, "Reading on phone immediately updates another device's real-time subscription");
const receiptWrites = writes;
await resumed.shared.markDirectConversationRead(user, "brooke", ["brooke-message"]);
assert.equal(writes, receiptWrites, "Reopening an already-read thread does not rewrite its receipts");
documents.set("teamMessages/offline-read", { ...documents.get("teamMessages/brooke-message"), readBy: ["brooke"], createdAtClient: at(3) }); emit(); await tick();
resumed.context.navigator.onLine = false;
await assert.rejects(resumed.shared.markDirectConversationRead(user, "brooke", ["offline-read"]));
assert.ok(JSON.parse(resumed.storage.get("mpiEventSyncV1:kevin")).receipts["direct:offline-read"]);
assert.equal(computerMessages.find(value => value.id === "offline-read").readBy.includes("kevin"), false);
resumed.context.navigator.onLine = true;
await resumed.shared.flushPendingSync(); await tick();
assert.equal(computerMessages.find(value => value.id === "offline-read").readBy.includes("kevin"), true, "Retained offline reads reach other devices after recovery");
documents.set("officeUpdates/update-a/receipts/kevin", { userEmail: user.email, status: "completed", completedAt: at(1) });
await resumed.shared.setUpdateStatus("update-a", user, { name: "Kevin" }, "read");
assert.equal(documents.get("officeUpdates/update-a/receipts/kevin").status, "completed", "Late read receipt cannot downgrade a completed/acknowledged update");
assert.ok(documents.get("officeUpdates/update-a/receipts/kevin").readAtClient);
stopPhone(); stopComputer(); resumed.close(); computer.close();

function functionSource(text, start, end) { return text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start))); }
const nativeFlush = functionSource(fieldSource, "async function flushNativeLocations()", "async function waitForNativeLocationUpload()");
let routeWrites = 0, profileWrites = 0, acknowledged = [], failBatch = false;
const points = Array.from({ length: 45 }, (_, index) => ({ nativeId: `point-${index}`, timestamp: Date.now() - (45 - index) * 60000, coords: { latitude: 42 + index / 1000, longitude: -83, accuracy: 10 }, nativeContext: { userId: "kevin", workDate: "2026-09-15", workStatus: "DRIVING TO JOB" } }));
points.push({ ...points[0], nativeId: "cory-point", nativeContext: { ...points[0].nativeContext, userId: "cory" } });
const nativeContext = vm.createContext({ window: { MPI_NATIVE: { isNative: true, pendingLocations: async () => points.filter(point => !acknowledged.includes(point.nativeId)), acknowledgeLocations: async ids => { acknowledged.push(...ids); } } },
  shared: { syncCoolingDown: () => false, deferPendingSync: () => {}, serverTimestamp: () => "server", db: {
    collection: name => ({ doc: id => ({ collection: sub => ({ doc: date => ({ collection: leaf => ({ doc: point => ({ point }) }) }) }), set: async () => { profileWrites += 1; } }) }),
    batch: () => { let count = 0; return { set: () => { count += 1; }, commit: async () => { if (failBatch) throw new Error("offline"); routeWrites += count; } }; }
  } },
  currentUser: { uid: "kevin" }, currentProfile: {}, navigator: { onLine: true }, nativeLocationSyncInFlight: false, Date, Math,
  localDateKey: () => "2026-09-15", liveLocationValue: (position, state) => ({ workDate: state.date, workStatus: state.status, recordedAtClient: new Date(position.timestamp).toISOString(), latitude: position.coords.latitude, longitude: position.coords.longitude }) });
vm.runInContext(nativeFlush, nativeContext);
failBatch = true; await nativeContext.flushNativeLocations();
assert.equal(acknowledged.length, 0, "Failed route upload must retain every native point");
failBatch = false; await nativeContext.flushNativeLocations();
assert.equal(routeWrites, 45); assert.equal(profileWrites, 1, "45 background points upload with only ONE profile update");
assert.equal(acknowledged.length, 45); assert.equal(acknowledged.includes("cory-point"), false, "Foreign inspector queue points remain untouched");
const nativeRecorder = functionSource(fieldSource, "async function ensureNativeLocationSharing", "function ensureLiveLocationWatch");
const browserWatch = functionSource(fieldSource, "function ensureLiveLocationWatch", "function syncLiveLocationSharing");
assert.doesNotMatch(nativeRecorder, /publishLiveLocation|await flushNativeLocations/);
assert.doesNotMatch(browserWatch, /publishLiveLocation/);
assert.doesNotMatch(functionSource(fieldSource, "function startLiveLocationSharing", "function teamInitials"), /setInterval|publishLiveLocation/);
assert.doesNotMatch(appSource, /workflowPresenceHeartbeatInterval = window\.setInterval/);
assert.doesNotMatch(functionSource(adminSource, "if (!liveLocationAgeTimer)", "unsubscribePeople ="), /loadHistoricalRoute/);
assert.match(fieldSource, /mpi-office-status-requested/);
assert.match(appSource, /markWorkflowEventsSynced\(event\.detail\.snapshot\)/);
let subcontractorWrites = 0;
const subcontractorContext = vm.createContext({ session: { userId: "jason", inspectorName: "Jason" }, testMode: false, state: { date: "2026-09-15", status: "AVAILABLE / NO CURRENT JOB", events: [], currentJob: null }, navigator: { onLine: true },
  shared: { syncCoolingDown: () => false, currentWorkflowStatus: record => ({ value: record.status, updatedAt: "2026-09-15T12:00:00Z" }), syncPayloadSignature: value => JSON.stringify(value), serverTimestamp: () => "server", db: { collection: () => ({ doc: () => ({ set: async () => { subcontractorWrites += 1; } }) }) } },
  nowIso: () => "2026-09-15T12:00:00Z", localDateKey: () => "2026-09-15", window: { clearTimeout, setTimeout }, actionStatus: {}, JSON, Promise });
vm.runInContext(functionSource(subcontractorSource, "let subcontractorSyncFlight", "function persist()"), subcontractorContext);
await subcontractorContext.syncState();
for (let index = 0; index < 30; index += 1) await subcontractorContext.syncState();
assert.equal(subcontractorWrites, 2, "A subcontractor with no current job must not enter a profile-listener write loop");
await subcontractorContext.syncState(true);
assert.equal(subcontractorWrites, 4, "An explicit office request still refreshes subcontractor status");
console.log("PASS Event sync: no-op deduplication, explicit refresh, durable offline/restart recovery, quota cooldown, historical/account isolation, directory write reduction, cross-device and offline read receipts, native route batching and retained failed points; no periodic location/day uploads or route reads.");
