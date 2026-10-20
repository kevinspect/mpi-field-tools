import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../admin.js", import.meta.url), "utf8");
const start = source.indexOf("  function renderAttentionPanel(");
const end = source.indexOf("\n  function showView(", start);
assert.ok(start >= 0 && end > start);

const day = { date: "2026-10-19", timeClock: { hoursWorkedStartedAt: "2026-10-19T15:00:00Z" }, jobs: [{ id: "job-1", property: "Example job" }] };
const person = { id: "inspector-1", adminCorrections: [], workdayReviews: [] };
const attentionList = { innerHTML: "", querySelector: () => null };
const escapeHtml = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const context = {
  attentionList, people: [person], operationDays: () => [day], operationDayIsClosed: () => true,
  effectiveTimeClockFor: () => ({ effectiveHoursWorkedStartedAt: "2026-10-19T15:00:00Z" }),
  effectiveClockOut: () => "2026-10-19T21:00:00Z", gpsReviewGapForDay: () => 60,
  businessLocalDateTimeValue: value => value.replace("Z", "").slice(0, 16),
  formatMinutes: value => `${value} min`, escapeHtml,
  document: { activeElement: null }
};
runInNewContext(`${source.slice(start, end)}\nthis.render = renderAttentionPanel;`, context);
context.render([
  { id: "workday-1", kind: "workday", personId: person.id, date: day.date, name: "Cory", message: "GPS difference" },
  { id: "job-1", kind: "workflow", personId: person.id, date: day.date, jobId: "job-1", name: "Cory", message: "No Start Inspection event" }
]);
assert.match(attentionList.innerHTML, /data-attention-form="workday"/);
assert.match(attentionList.innerHTML, /Work started/);
assert.match(attentionList.innerHTML, /Work finished/);
assert.match(attentionList.innerHTML, /SAVE TIMES &amp; APPROVE|SAVE TIMES & APPROVE/);
assert.match(attentionList.innerHTML, /data-attention-form="inspection-start"/);
assert.match(attentionList.innerHTML, /Actual inspection start/);
assert.match(attentionList.innerHTML, /SAVE TIME &amp; APPROVE WORKDAY|SAVE TIME & APPROVE WORKDAY/);
assert.match(source, /attentionList\?\.addEventListener\("submit"/);
assert.match(source, /gpsGapAcknowledged/);
assert.match(source, /adminCorrections = shared\.arrayUnion/);
assert.match(source, /workdayReviews = shared\.arrayUnion/);

console.log("PASS issues list offers inline time correction and auditable approval without opening inspector detail");
