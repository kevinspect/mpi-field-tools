import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const gpsSource = readFileSync(new URL("../one-step-gps-service.gs", import.meta.url), "utf8");
const workflowSource = readFileSync(new URL("../workflow-email-service.gs", import.meta.url), "utf8");
const deviceId = "6ljQwIubNfqQJk81f07-0F";
let quota = "180";
let providerReads = 0;
let providerStatus = 200;
let cached = null;
const point = (overrides = {}) => ({
  lat: 42.5, lng: -83.4, dt_tracker: new Date().toISOString(),
  device_state: { drive_status: "on" },
  device_point_detail: { speed: { value: 20, unit: "km/h" } },
  ...overrides
});
let latest = point();
const context = {
  console: { log() {} },
  PropertiesService: { getScriptProperties: () => ({ getProperty: name => name === "MPI_ONE_STEP_GPS_HOURLY_LIMIT" ? quota : "test-key" }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  UrlFetchApp: { fetch(url) {
    assert.match(url, new RegExp(`/device/${deviceId}\\?latest_point=true$`));
    providerReads += 1;
    return { getResponseCode: () => providerStatus, getContentText: () => JSON.stringify({ device_id: deviceId, latest_device_point: latest }) };
  }}
};
runInNewContext(workflowSource, context);
runInNewContext(gpsSource, context);
context.oneStepGpsLiveDocument_ = () => cached;
context.oneStepGpsWriteLive_ = fields => { cached = { ...cached, ...fields }; };

assert.equal(context.MPI_ONE_STEP_GPS.CORY_DEVICE_ID, deviceId);
assert.equal(context.oneStepGpsValidLivePoint_(latest), true);
assert.equal(context.oneStepGpsValidLivePoint_(point({ lat: 200 })), false);
assert.equal(context.oneStepGpsValidLivePoint_(point({ dt_tracker: new Date(Date.now() + 3600000).toISOString() })), false);
assert.equal(context.refreshOneStepGpsCoryLive_().hasValidPoint, true);
assert.equal(cached.vehicleStatus, "Moving");
assert.equal(providerReads, 1);
assert.equal(context.refreshOneStepGpsCoryLive_().cached, true);
assert.equal(providerReads, 1, "two office requests must use the same server cache");

cached = null;
latest = point({ device_state: { drive_status: "off" }, device_point_detail: { speed: { value: 0, unit: "km/h" } } });
context.refreshOneStepGpsCoryLive_();
assert.equal(cached.vehicleStatus, "Stationary");
assert.equal(context.refreshOneStepGpsCoryLive_().refreshSeconds >= 120, true);

quota = "";
cached = null;
const readsBeforeGate = providerReads;
assert.throws(() => context.refreshOneStepGpsCoryLive_(), /allowance has not been verified/);
assert.equal(providerReads, readsBeforeGate, "unverified quota must block provider polling");
quota = "0"; // One Step documents zero as an explicitly unlimited key.
assert.equal(context.refreshOneStepGpsCoryLive_().refreshSeconds, 120, "unknown movement still uses a two-minute floor");
quota = "180";
providerStatus = 429;
cached = { vehicleStatus: "Moving", lastAttemptAt: new Date(Date.now() - 180000).toISOString() };
assert.throws(() => context.refreshOneStepGpsCoryLive_(), /status 429/);
assert.ok(cached.lastErrorAt);
assert.ok(Date.parse(cached.rateLimitUntilAt) - Date.now() > 59 * 60000, "429 must pause provider calls for an hour");
const readsAfterError = providerReads;
assert.equal(context.refreshOneStepGpsCoryLive_().rateLimited, true);
assert.equal(providerReads, readsAfterError, "provider 429 must not retry during the cooldown");
const readsBeforeUnauthorized = providerReads;

context.response_ = value => value;
context.safeText_ = value => String(value || "");
context.verifyFirebaseUser_ = () => ({ uid: "test-user", email: "field@michiganpropertyinspections.com", emailVerified: true });
const checkOfficeReader = context.isAuthorizedOfficeGpsReader_;
context.isAuthorizedOfficeGpsReader_ = () => false;
const rejected = context.handleOneStepGpsLiveRequest_({ idToken: "test" }, "request-1");
assert.equal(rejected.ok, false);
assert.equal(providerReads, readsBeforeUnauthorized, "inspector identity must not trigger a provider read");
context.isAuthorizedOfficeGpsReader_ = checkOfficeReader;

context.ScriptApp = { getOAuthToken: () => "test-oauth" };
let officeRole = "admin";
let officeEmail = "brooke@michiganpropertyinspections.com";
context.UrlFetchApp.fetch = url => {
  assert.match(url, /\/documents\/users\/test-user$/);
  return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ fields: {
    active: { booleanValue: true }, role: { stringValue: officeRole }, email: { stringValue: officeEmail }
  }}) };
};
const officeSender = { uid: "test-user", email: officeEmail, emailVerified: true };
assert.equal(context.isAuthorizedOfficeGpsReader_(officeSender), true);
officeRole = "inspector";
assert.equal(context.isAuthorizedOfficeGpsReader_(officeSender), false);
officeRole = "admin";
officeEmail = "someone-else@michiganpropertyinspections.com";
assert.equal(context.isAuthorizedOfficeGpsReader_(officeSender), false);

console.log("PASS Cory-only device mapping, real-point validation, shared cache, stationary interval, quota gate, and office authorization");
