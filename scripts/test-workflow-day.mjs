import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../index.html", import.meta.url), "utf8");
const functions = [
  "beginWorkflowLabDecision",
  "chooseWorkflowLabStop",
  "chooseWorkflowFinishTasks",
  "startWorkflowExtraTask",
  "completeWorkflowExtraTask",
  "completeWorkflowLabVisit"
];
const extract = name => {
  const start = source.search(new RegExp(`\\n      (?:async )?function ${name}\\(`));
  assert.ok(start >= 0, `${name} exists`);
  const rest = source.slice(start + 1);
  const next = rest.search(/\n      (?:async )?function [A-Za-z]/);
  return next < 0 ? rest : rest.slice(0, next);
};

const events = [];
const state = {
  record: null,
  nextJob: null,
  localDateKey: () => "2026-10-16",
  nextWorkflowAppointment: () => state.nextJob,
  saveWorkflowLabStop: record => { state.record = record; },
  loadWorkflowLabStop: () => state.record,
  normalizeWorkflowLabStop: () => state.record,
  cancelFieldAlarmGroup: () => {},
  workflowDepartureAlarmGroup: () => "departure",
  renderWorkflowApp: () => {},
  resetWorkflowEndOfDayChecks: () => {},
  renderWorkflowLabStop: () => {},
  updateWorkflowLabTravelPlan: () => {},
  appendWorkflowEvent: (action, data) => { events.push({ action, data }); },
  currentWorkflowLab: record => state.WORKFLOW_LABS[record?.labs?.[record.currentIndex]] || null,
  workflowCocPhotosForLab: async () => [{ id: "coc-photo" }],
  workflowRemainingScheduledJobs: () => [],
  WORKFLOW_LABS: {
    "water-tech": { id: "water-tech", name: "Water Tech", address: "Water Tech" },
    ims: { id: "ims", name: "IMS", address: "IMS" }
  },
  workflowExtraTaskInput: { value: "" }
};
runInNewContext(functions.map(extract).join("\n"), state);

const firstJob = { calendarEventId: "first", property: "First job" };
state.nextJob = { id: "second", location: "Second job", start: { dateTime: "2026-10-16T13:00:00" } };
state.beginWorkflowLabDecision(firstJob);
assert.equal(state.record.stage, "choose", "every intermediate job asks about labs");
assert.equal(state.record.nextProperty, "Second job");
state.chooseWorkflowLabStop("none");
assert.equal(state.record, null, "skipping a lab resumes the next job");

state.nextJob = null;
state.beginWorkflowLabDecision({ calendarEventId: "second", property: "Second job" });
assert.equal(state.record.stage, "finish-choice", "the final job asks whether work tasks are finished");
state.chooseWorkflowFinishTasks("no");
assert.equal(state.record.stage, "extra-task-entry");
state.workflowExtraTaskInput.value = "Pick up supplies at the office";
state.startWorkflowExtraTask({ preventDefault() {} });
assert.equal(state.record.stage, "extra-task-active");
assert.equal(state.record.extraTask.description, "Pick up supplies at the office");
state.completeWorkflowExtraTask();
assert.equal(state.record.stage, "finish-choice", "a completed extra task returns to the finish question");
assert.equal(state.record.extraTasks.length, 1);

state.chooseWorkflowFinishTasks("labs");
assert.equal(state.record.stage, "choose");
state.chooseWorkflowLabStop("ims");
assert.equal(state.record.stage, "travel");
assert.deepEqual(Array.from(state.record.labs), ["ims"]);
state.record.stage = "arrived";
await state.completeWorkflowLabVisit();
assert.equal(state.record.stage, "finish-choice", "a final lab visit returns to the finish question");
state.chooseWorkflowFinishTasks("yes");
assert.equal(state.record.stage, "finished-work");
assert.ok(events.some(event => event.action === "Finished work tasks"));

assert.match(source, /workflowArrivedBtn\.hidden = !\["scheduled", "on-my-way"\]\.includes\(status\)/);
assert.match(source, /workflowOnMyWayBtn\.hidden = true/);
assert.match(source, /workflowFinishTasksCard/);
console.log("Field-day workflow transitions passed");
