import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../admin.js", import.meta.url), "utf8");
const start = source.indexOf("  function workdayReviewHtml(");
const end = source.indexOf("\n  async function saveWorkdayReview(", start);
assert.ok(start >= 0 && end > start);

const day = { date: "2026-10-19", timeClock: { hoursWorkedStartedAt: "2026-10-19T15:44:00Z" } };
const person = {
  oneStepGpsReviewDays: [{ day: day.date, assignedJobs: 2, matchedJobStops: 2, firstJobArrivalCandidate: "2026-10-19T15:49:00Z" }]
};
const context = {
  escapeHtml: value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;"),
  formatDate: value => value,
  formatTime: value => value || "—",
  formatDateTime: value => value,
  formatMinutes: value => `${value} min`,
  workdayReviewState: () => ({ decision: "pending", label: "AWAITING APPROVAL", revision: "revision-1", latest: null }),
  jobCounts: () => ({ complete: 2, total: 2 }),
  driveTimeForDay: () => ({ totalMinutes: 0 }),
  effectiveTimeClockFor: () => ({ effectiveHoursWorkedStartedAt: "2026-10-19T22:44:00Z" }),
  effectiveClockOut: () => "2026-10-19T22:45:00Z",
  workedMinutes: () => 1,
  gpsDayPlanningWindow: () => ({ minutes: 388, departure: "2026-10-19T22:17:00Z", labName: "" }),
  correctionsFor: () => [{ targetAction: "Hours Worked start", correctedValue: "2026-10-19T22:44:00Z" }],
  workedTimeAuditForDay: () => ({ issues: [] }),
  operationDayIsClosed: () => true
};
runInNewContext(`${source.slice(start, end)}\nthis.render = workdayReviewHtml;`, context);
const markup = context.render(person, day);
assert.match(markup, /Verify workday/);
assert.match(markup, /RECORDED HOURS · PAYROLL/);
assert.match(markup, /TRUCK \+ JOB STOPS · CROSS-CHECK/);
assert.match(markup, /Check the 387 min gap/);
assert.match(markup, /needs-time-check/);
assert.match(markup, /1 management correction/);
assert.match(markup, /data-prefill-workday-correction="Hours Worked start"/);
assert.match(markup, /data-prefill-workday-correction="Hours Worked end"/);
assert.match(markup, /APPROVE WORKDAY/);
assert.match(markup, /QUESTION WORKDAY/);
assert.doesNotMatch(markup, /automatically approved/i);

context.workdayReviewState = () => ({ decision: "approved", label: "APPROVED", revision: "revision-1", latest: null });
assert.match(context.render(person, day), /Previously approved, but please recheck the 387 min gap/);
context.workdayReviewState = () => ({ decision: "pending", label: "AWAITING APPROVAL", revision: "revision-1", latest: null });

context.gpsDayPlanningWindow = () => null;
assert.match(context.render(person, day), /no complete window/);
assert.doesNotMatch(context.render(person, day), /Check the 387 min gap/);
console.log("PASS quick review shows clock and GPS evidence together without changing payroll or approval");
