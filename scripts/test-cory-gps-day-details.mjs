import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../admin.js", import.meta.url), "utf8");
const start = source.indexOf("  function coryGpsReviewCard(person) {");
const end = source.indexOf("\n  function gpsDayPlanningWindow(", start);
assert.ok(start >= 0 && end > start, "GPS review renderer must be present");

const html = runInNewContext(`${source.slice(start, end)}\ncoryGpsReviewCard(person);`, {
  person: {
    id: "cory-id",
    oneStepGpsReviewDays: [{
      day: "2026-10-22",
      assignedJobs: 2,
      matchedJobStops: 1,
      vehicleStopCount: 3,
      firstJobArrivalCandidate: "2026-10-22T14:15:00Z",
      lastJobDepartureCandidate: "2026-10-22T18:32:00Z"
    }]
  },
  rangeDateKeys: () => ["2026-10-22"],
  gpsPlanningWindowMinutes: () => 0,
  gpsDayPlanningWindow: () => null,
  scheduleDayFor: () => ({ jobs: [
    { scheduledStart: "2026-10-22T14:00:00Z", propertyAddress: "First address", services: ["Inspection"] },
    { scheduledStart: "2026-10-22T17:00:00Z", propertyAddress: "Second <address>", services: ["Radon pickup"] }
  ] }),
  operationDays: () => [{ date: "2026-10-22", activity: [] }],
  formatDate: () => "Oct 22, 2026",
  formatTime: value => value ? value.slice(11, 16) : "",
  formatMinutes: value => `${value}m`,
  escapeHtml: value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
});

assert.match(html, /<details><summary>/, "day should expand with a keyboard-accessible summary");
assert.match(html, /Oct 22, 2026/);
assert.match(html, /1\/2 jobs matched/);
assert.match(html, /First address/);
assert.match(html, /Second &lt;address&gt;/);
assert.match(html, /Radon pickup/);
assert.match(html, /3 sustained vehicle stops/);
assert.match(html, /does not identify which individual inspection matched/);
assert.match(html, /No known-lab stop was matched/);
assert.match(html, /no actions synced for this date/);
assert.match(html, /data-open-gps-workday="2026-10-22"/);
assert.doesNotMatch(html, /Second <address>/, "scheduled content must be escaped");
console.log("PASS Cory GPS dates expand into qualified job, truck, and phone details");
