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
  document: { activeElement: null }, currentUser: { uid: "office-1", email: "office@example.com" },
  currentProfile: { name: "Office" },
  shared: {
    isAdminRole: () => true, normalizeEmail: value => value,
    arrayUnion: (...values) => ({ values }), serverTimestamp: () => "server-time",
    db: { collection: () => ({ doc: () => ({ update: async updates => { context.savedUpdates = updates; } }) }) }
  },
  asDate: value => value ? new Date(value) : null,
  businessLocalDateTimeToIso: value => new Date(Date.parse(`${value}:00Z`) + 4 * 3600000).toISOString(),
  shiftDateKey: () => "2026-10-20",
  workedTimeAuditForDay: () => ({ issues: [] }),
  workdayReviewRevision: () => "revision-2", workedMinutes: () => 360,
  jobCounts: () => ({ complete: 1, total: 1 }), driveTimeForDay: () => ({ totalMinutes: 0 }),
  renderOperations: () => { context.rerendered = true; }, operationAttentionItems: () => []
};
runInNewContext(`${source.slice(start, end)}\nthis.render = renderAttentionPanel; this.save = saveInlineAttention;`, context);
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

const status = { textContent: "", className: "" };
const button = { disabled: false };
const card = { dataset: { attentionKind: "workday", attentionPerson: person.id, attentionDate: day.date } };
const fields = { start: { value: "2026-10-19T11:00" }, end: { value: "2026-10-19T17:00" }, note: { value: "GPS also included an unrelated stop." } };
const form = {
  dataset: { attentionForm: "workday" },
  elements: { namedItem: name => fields[name] },
  closest: () => card,
  querySelector: selector => selector === "[data-attention-status]" ? status : button
};
await context.save(form);
assert.equal(context.savedUpdates.workdayReviews.values[0].decision, "approved");
assert.equal(context.savedUpdates.workdayReviews.values[0].gpsGapAcknowledged, true);
assert.equal(context.savedUpdates.adminCorrections, undefined, "unchanged times must not create corrections");
assert.equal(person.workdayReviews.length, 1);
assert.equal(context.rerendered, true);

fields.start.value = "2026-10-19T10:00";
fields.note.value = "Corrected against the inspected job log.";
button.disabled = false;
await context.save(form);
assert.equal(context.savedUpdates.adminCorrections.values.length, 1);
assert.equal(context.savedUpdates.adminCorrections.values[0].targetAction, "Hours Worked start");
assert.equal(context.savedUpdates.workdayReviews.values[0].decision, "approved");
assert.equal(person.adminCorrections.length, 1);

console.log("PASS issues list offers inline correction and saves auditable approval without opening inspector detail");
