import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../one-step-gps-service.gs", import.meta.url), "utf8");
const monitorSource = source.slice(source.indexOf("function oneStepGpsCoryJobMonitor_("), source.indexOf("function oneStepGpsValidLivePoint_("));
const schedule = { spectoraScheduleDays: [{ date: "2026-10-19", jobs: [
  { id: "first", latitude: 42.6, longitude: -83.2 },
  { id: "second", latitude: 42.7, longitude: -83.3 }
] }] };
const context = vm.createContext({
  Date, Number, String, Math, isFinite,
  Utilities: { formatDate: () => "2026-10-19" },
  oneStepGpsCoryProfile_: () => ({ fields: schedule }),
  oneStepGpsValidCoordinate_: (value, limit) => Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit,
  oneStepGpsDistanceMeters_: (left, right) => Math.hypot(left.lat - right.lat, left.lng - right.lng) * 111000
});
vm.runInContext(monitorSource, context);
const t = Date.now();
const sample = (offset, latitude, longitude) => ({ gpsAt: new Date(t + offset).toISOString(), latitude, longitude });
let state = context.oneStepGpsCoryJobMonitor_(null, sample(-120000, 42.6, -83.2));
assert.equal(state.jobs[0].arrivedAt, null, "one GPS point cannot confirm arrival");
assert.equal(context.oneStepGpsCoryJobMonitor_(state, sample(-120000, 42.6, -83.2)), null, "duplicate tracker timestamps do not advance evidence");
state = context.oneStepGpsCoryJobMonitor_(state, sample(-80000, 42.6, -83.2));
assert.equal(state.jobs[0].arrivedAt, sample(-120000, 42.6, -83.2).gpsAt, "two fresh positions confirm arrival");
state = context.oneStepGpsCoryJobMonitor_(state, sample(-40000, 42.605, -83.205));
assert.equal(state.jobs[0].departedAt, null, "one outside point cannot confirm departure");
state = context.oneStepGpsCoryJobMonitor_(state, sample(0, 42.605, -83.205));
assert.equal(state.jobs[0].departedAt, sample(-40000, 42.605, -83.205).gpsAt, "two outside points confirm approximate departure");

schedule.spectoraScheduleDays[0].jobs[1].latitude = 42.6003;
schedule.spectoraScheduleDays[0].jobs[1].longitude = -83.2;
const ambiguous = context.oneStepGpsCoryJobMonitor_(null, sample(-40000, 42.6, -83.2));
const ambiguousSecond = context.oneStepGpsCoryJobMonitor_(ambiguous, sample(0, 42.6, -83.2));
assert.equal(ambiguousSecond.jobs[0].arrivedAt, null, "nearby jobs are not attributed ambiguously");
assert.equal(ambiguousSecond.jobs[1].arrivedAt, null);
assert.equal(context.oneStepGpsCoryJobMonitor_(null, sample(-360000, 42.6, -83.2)), null, "stale tracker points are rejected");
console.log("PASS Cory GPS monitor confirms two-point arrivals/departures and rejects duplicate, stale, or ambiguous points");
