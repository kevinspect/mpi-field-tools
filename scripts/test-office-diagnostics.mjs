import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../mpi-office-diagnostics.js", import.meta.url), "utf8");
function fixture(options = {}) {
  const calls = { fetch: 0, messaging: 0, storage: 0 };
  let click;
  const button = { disabled: false, textContent: "Run self-diagnosis", addEventListener: (_, callback) => { click = callback; } };
  const output = { hidden: true, innerHTML: "", textContent: "" };
  const user = { uid: "brooke" }, profile = { role: "admin", active: true };
  const shared = {
    auth: { currentUser: user }, isAdminRole: person => ["admin", "owner"].includes(person?.role),
    syncCoolingDown: () => Boolean(options.cooldown),
    messagingHealth: async () => { calls.messaging++; return options.health || { status: "healthy", authentication: "verified", backend: "connected" }; },
    sendDirectMessage: () => { throw Error("A diagnostic must not send a message"); },
    flushPendingSync: () => { throw Error("A diagnostic must not change saved work"); }
  };
  const window = { MPI_SHARED: shared, MPI_OWNER_PREVIEW: options.preview, Notification: { permission: options.permission || "granted" } };
  if (options.native) window.MPI_NATIVE = { isNative: true, pushPermission: async () => ({ receive: "granted" }) };
  const context = {
    window, navigator: { onLine: options.online !== false }, AbortController, setTimeout, clearTimeout,
    document: {
      getElementById: id => ({ adminRunSelfDiagnosis: button, adminSelfDiagnosisResult: output, adminSyncNotice: { hidden: !options.notice } })[id],
      querySelector: () => ({ content: "205" })
    },
    localStorage: { getItem: () => { calls.storage++; if (options.storageBlocked) throw Error("Blocked"); return null; }, setItem: () => { throw Error("No diagnostic storage writes"); }, clear: () => { throw Error("No resets"); } },
    fetch: async () => { calls.fetch++; if (options.fetch) return options.fetch(); return { ok: true, json: async () => ({ build: options.build || 205 }) }; }
  };
  vm.runInNewContext(source, context);
  assert.deepEqual(calls, { fetch: 0, messaging: 0, storage: 0 }, "Loading Settings must not make diagnostic requests");
  window.MPI_OFFICE_DIAGNOSTICS.setContext(user, profile);
  return { calls, button, output, window, click: () => click(), user, profile };
}

const normal = fixture();
await normal.click();
assert.deepEqual(normal.calls, { fetch: 1, messaging: 1, storage: 1 });
assert.match(normal.output.innerHTML, /Device checks complete/);
assert.match(normal.output.innerHTML, /Actual alert delivery was not tested/);
assert.equal(normal.button.disabled, false);

for (const options of [{ cooldown: true }, { notice: true }]) {
  const held = fixture(options); await held.click();
  assert.equal(held.calls.messaging, 0, "Do not consume more messaging reads during a recovery hold");
  assert.match(held.output.innerHTML, /Deferred/);
  assert.match(held.output.innerHTML, /last-known data/);
}
const offline = fixture({ online: false }); await offline.click();
assert.equal(offline.calls.fetch, 0); assert.equal(offline.calls.messaging, 0);
assert.match(offline.output.innerHTML, /offline/);
const preview = fixture({ preview: true }); await preview.click();
assert.equal(preview.calls.fetch, 0); assert.equal(preview.button.disabled, true);
const failed = fixture({ health: { status: "failed", referenceId: '<unsafe>"&', pending: 0 }, permission: "denied", storageBlocked: true, build: 206 });
await failed.click();
assert.match(failed.output.innerHTML, /Attention/);
assert.match(failed.output.innerHTML, /&lt;unsafe&gt;&quot;&amp;/);
assert.doesNotMatch(failed.output.innerHTML, /Device checks complete|<unsafe>/);
assert.match(failed.output.innerHTML, /Build 206 is available/);
const native = fixture({ native: true }); await native.click();
assert.match(native.output.innerHTML, /Bundled app files/);
assert.match(native.output.innerHTML, /checks server access separately/);

let release;
const inFlight = fixture({ fetch: () => new Promise(resolve => { release = resolve; }) });
const first = inFlight.click(); await inFlight.click();
assert.equal(inFlight.calls.fetch, 1, "Double clicks must not duplicate diagnostic requests");
inFlight.window.MPI_SHARED.auth.currentUser = null;
inFlight.window.MPI_OFFICE_DIAGNOSTICS.setContext(null, null);
release({ ok: true, json: async () => ({ build: 205 }) }); await first;
assert.equal(inFlight.output.hidden, true); assert.equal(inFlight.output.innerHTML, "");
assert.equal(inFlight.calls.messaging, 0, "Do not probe another account after sign-out");
assert.equal(inFlight.button.disabled, true);
const inspector = fixture(); inspector.profile.role = "inspector";
inspector.window.MPI_OFFICE_DIAGNOSTICS.setContext(inspector.user, inspector.profile); await inspector.click();
assert.equal(inspector.calls.fetch, 0);
console.log("PASS On-demand office diagnosis: existing messaging checks, no data resets/messages, recovery/offline limits, account isolation and read-only previews.");
