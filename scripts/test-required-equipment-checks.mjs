import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const extract = name => {
  const start = source.search(new RegExp(`\\n      (?:async )?function ${name}\\(`));
  assert.ok(start >= 0, `${name} exists`);
  const rest = source.slice(start + 1);
  const next = rest.search(/\n      (?:async )?function [A-Za-z]/);
  return next < 0 ? rest : rest.slice(0, next);
};

const jobChecklist = source.match(/<div class="workflow-checklist" id="workflowEquipmentChecklist">([\s\S]*?)<\/div>/)?.[1] || "";
assert.equal((jobChecklist.match(/data-workflow-equipment=/g) || []).length, 5);
assert.match(source, /id="workflowEquipmentCompleteBtn"[^>]*disabled/);

const job = { property: "Example job", workflowStatus: "equipment", isPractice: true };
const checks = ["hand-tools", "inspection-devices", "ladders-safety", "power-samples", "property-sweep"].map(id => ({ checked: false, dataset: { workflowEquipment: id } }));
const jobEvents = [];
let completed = 0;
const jobState = {
  workflowEquipmentCard: { dataset: { jobKey: "Example job|" }, querySelectorAll: () => checks },
  workflowEquipmentCompleteBtn: { disabled: false, textContent: "" },
  workflowEquipmentStatus: { textContent: "" },
  loadActiveJob: () => job, rejectLockedWorkflowJob: () => false,
  updateWorkflowStage: () => { completed += 1; return job; },
  appendWorkflowEvent: (action, data) => jobEvents.push({ action, data }),
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  PHONE_PRACTICE_STORAGE_KEY: "practice", ACTIVE_JOB_STORAGE_KEY: "active",
  loadPhonePracticeRecord: () => null, renderActiveJob: () => {},
  renderAppScreen: () => {}, renderPhonePractice: () => {}, renderWorkflowApp: () => {},
  window: { location: { hash: "" } }, showToast: () => {}
};
runInNewContext(`${["workflowEquipmentJobKey", "workflowAllEquipmentChecks", "updateWorkflowEquipmentButton", "completeWorkflowEquipment"].map(extract).join("\n")}\nthis.updateButton=updateWorkflowEquipmentButton;this.complete=completeWorkflowEquipment;`, jobState);
jobState.updateButton();
assert.equal(jobState.workflowEquipmentCompleteBtn.disabled, true);
jobState.complete();
assert.equal(completed, 0, "an incomplete check must not finish a job");
checks.forEach(check => { check.checked = true; });
jobState.updateButton();
assert.equal(jobState.workflowEquipmentCompleteBtn.disabled, false);
jobState.complete();
assert.equal(completed, 1);
assert.equal(jobEvents[0].action, "Phone setup practice completed");

const guardedJob = { property: "Example job", workflowStatus: "equipment", scheduledStart: "2026-10-19T14:00:00Z" };
const stageState = {
  WORKFLOW_STAGES: ["scheduled", "equipment", "completed"],
  workflowEquipmentCard: { dataset: { jobKey: "Example job|2026-10-19T14:00:00Z" } },
  workflowAllEquipmentChecks: () => checks,
  workflowEquipmentJobKey: value => `${value.property}|${value.scheduledStart}`,
  storeActiveJob: () => {}, appendWorkflowEvent: () => {},
  renderWorkflowJob: () => {}, renderWorkflowTodayJobs: () => {},
  rememberWorkflowCompletedJob: () => {}
};
runInNewContext(`${extract("updateWorkflowStage")}\nthis.updateStage=updateWorkflowStage;`, stageState);
checks[0].checked = false;
assert.equal(stageState.updateStage(guardedJob, "completed", "Finish"), null, "stage completion must enforce the checklist centrally");
assert.equal(guardedJob.workflowStatus, "equipment");
checks[0].checked = true;
assert.equal(stageState.updateStage(guardedJob, "completed", "Finish"), guardedJob);

const endChecks = [{ checked: false, dataset: { workflowEodEquipment: "thermal-camera" } }];
const active = { clockedInAt: "2026-10-19T12:00:00Z", clockedOutAt: "" };
const record = { sessions: [active] };
const dayEvents = [];
const clockState = {
  workflowDayCompleteCard: { dataset: { eodDate: "2026-10-19" } },
  workflowEndOfDayChecks: endChecks, localDateKey: () => "2026-10-19",
  loadWorkflowTimeClock: () => record, workflowActiveClockSession: () => active.clockedOutAt ? null : active,
  workflowScheduleJobs: () => [], workflowJobIsComplete: () => false,
  workflowClockOffRemainingJobs: () => [], loadWorkflowNachiTraining: () => null,
  loadActiveJob: () => null, renderWorkflowJob: () => {},
  isCoryWorkflowUser: () => false, workflowNextScheduledJob: () => null,
  loadWorkflowLabStop: () => null, renderWorkflowTimeClock: () => {},
  requestWorkflowClockLocation: async () => ({ status: "unavailable" }),
  saveWorkflowTimeClock: () => {}, appendWorkflowEvent: action => dayEvents.push(action),
  workflowWorkedDuration: () => "8h", updateWorkflowDayCompleteButton: () => {},
  workflowClock: () => "5:00 PM", showToast: () => {}
};
runInNewContext(`let workflowTimeClockInFlight=false;\n${["workflowEndOfDayConfirmed", "clockWorkflowOff"].map(extract).join("\n")}\nthis.confirmed=workflowEndOfDayConfirmed;this.clockOff=clockWorkflowOff;`, clockState);
clockState.loadActiveJob = () => job;
await clockState.clockOff();
assert.equal(active.clockedOutAt, "", "Clock Off must not run with a job still active");
clockState.loadActiveJob = () => null;
await clockState.clockOff();
assert.equal(active.clockedOutAt, "", "Clock Off must not run without the end-of-day check");
endChecks[0].checked = true;
assert.equal(clockState.confirmed(), true);
await clockState.clockOff();
assert.ok(active.clockedOutAt);
assert.equal(active.endOfDayEquipmentCheck.date, "2026-10-19");
assert.deepEqual(Array.from(active.endOfDayEquipmentCheck.equipment), ["thermal-camera"]);
assert.deepEqual(dayEvents, ["End-of-day equipment check confirmed", "Clocked off"]);
clockState.workflowDayCompleteCard.dataset.eodDate = "2026-10-18";
assert.equal(clockState.confirmed(), false, "yesterday's check must not unlock today's Clock Off");

console.log("PASS job completion and Clock Off require fresh, itemized equipment checks");
