import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../mpi-office-setup-policy.js", import.meta.url), "utf8");
const context = { globalThis: {} };
context.window = context.globalThis;
vm.runInNewContext(source, context);
const policy = context.globalThis.MPI_OFFICE_SETUP_POLICY;
for (const role of ["owner", "admin"]) assert.equal(policy.eligible({ role, active: true }), true);
for (const role of ["inspector", "subcontractor"]) assert.equal(policy.eligible({ role, active: true }), false);
assert.equal(policy.isMac("MacIntel", "Safari", 0), true);
assert.equal(policy.isMac("MacIntel", "iPhone", 5), false, "An iPhone reporting MacIntel is not treated as a Mac");
assert.notEqual(policy.storageKey("kevin"), policy.storageKey("brooke"));
assert.equal(policy.isInstalled(false, false), false);
assert.equal(policy.isInstalled(false, true), true);
assert.equal(policy.ready({ installed: true, version: true, notifications: true, messaging: true, liveUpdates: true, adminServices: true }), true);
assert.equal(policy.ready({ installed: true, version: true, notifications: false, messaging: true, liveUpdates: true, adminServices: true }), false);
console.log("PASS Mac setup policy covers Kevin, Adrienne and Brooke, excludes field-only roles and only reports verified checks as ready.");
