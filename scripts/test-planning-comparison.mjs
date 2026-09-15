import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../admin.js", import.meta.url), "utf8");
const planningSource = await readFile(new URL("../mpi-planning.js", import.meta.url), "utf8");
class Select {
  value = "";
  markup = "";
  get innerHTML() { return this.markup; }
  set innerHTML(markup) { this.markup = markup; this.value = markup.match(/value="([^"]*)"/)?.[1] || ""; }
}
const people = [
  { id: "kevin", name: "Kevin", jobs: [{ id: "k1", property: "10 Main St, Ann Arbor, MI", latitude: 42.3, longitude: -83.7, scheduledStart: "2026-09-16T09:00:00-04:00", scheduledEnd: "2026-09-16T11:00:00-04:00" }, { id: "k2", property: "20 Main St, Brighton, MI", latitude: 42.5, longitude: -83.8, scheduledStart: "2026-09-16T13:00:00-04:00", scheduledEnd: "2026-09-16T15:00:00-04:00" }] },
  { id: "cory", name: "Cory", jobs: [{ id: "c1", property: "30 Main St, Canton, MI", latitude: 42.4, longitude: -83.4, scheduledStart: "2026-09-16T10:00:00-04:00", scheduledEnd: "2026-09-16T12:00:00-04:00" }] },
  { id: "new", name: "No schedule", jobs: [] }
];
const calls = [];
const removed = [];
const layers = [];
const layer = { addLayer: item => layers.push(item), removeLayer: item => removed.push(item) };
const map = { fitBounds: bounds => { map.bounds = bounds; }, setView: bounds => { map.bounds = bounds; } };
const shape = type => ({ type, bindPopup() { return this; }, addTo(target) { target.addLayer(this); return this; }, openPopup() {} });
const window = { L: { divIcon: options => options, marker: () => shape("marker"), polyline: () => shape("route") } };
const context = vm.createContext({
  window, console, Date, Map, URL, AbortController, setTimeout, clearTimeout,
  people, operativePeople: () => people, escapeHtml: value => String(value), canonicalTeamName: person => person.name,
  scheduleDayFor: person => ({ jobs: person.jobs }), scheduleAddress: job => job.property,
  asDate: value => value ? new Date(value) : null, dateKey: () => "2026-09-15", formatTime: value => new Date(value).toISOString(), formatDate: value => value,
  planningInspector: new Select(), planningOrigin: new Select(), planningResult: { hidden: true },
  liveCandidateAddress: { value: "100 Oak Rd, Canton, MI 48187" }, liveCandidatePin: {}, liveRouteDate: { value: "2026-09-16" },
  selectedPlanningAddress: { address: "100 Oak Rd, Canton, MI 48187", state: "Michigan", latitude: 42.2, longitude: -83.5 },
  planningCalculationGeneration: 0, liveLocationCandidate: null, liveLocationRouteLayer: layer, liveLocationMap: map,
  liveLocationRouteStatus: { dataset: {} }, ensureLiveLocationMap: () => map, liveLocationRecord: () => { throw new Error("Office/live GPS must not be used for all-inspector planning"); },
  geocodeScheduleAddress: async job => ({ latitude: job.latitude, longitude: job.longitude }),
  PLAN_COLORS: ["navy", "blue", "green"], localStorage: { setItem() {} }
});
vm.runInContext(planningSource, context);
window.MPI_PLANNING = { ...window.MPI_PLANNING, roadTravel: async (origin, destination) => {
  calls.push(origin);
  return { miles: 21.9, minutes: 31, geometry: [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]] };
} };
vm.runInContext(source.slice(source.indexOf("  async function dropPlanningCandidatePin()"), source.indexOf('  planningInspector?.addEventListener("change"')), context);

context.renderPlanningControls();
assert.match(context.planningInspector.innerHTML, /value="all">All inspectors/);
context.planningInspector.value = "all";
context.renderPlanningControls();
assert.equal(context.planningOrigin.value, "auto");
await context.dropPlanningCandidatePin();
assert.equal(calls.length, 2, "Exactly one route lookup per scheduled inspector; none for missing schedules");
assert.match(context.planningResult.innerHTML, /ALL INSPECTORS.*Kevin.*Cory.*No schedule.*No synchronized jobs/s);
assert.match(context.planningResult.innerHTML, /2026-09-16T15:31:00.000Z/, "Kevin arrival is based on his own scheduled job end plus travel");
assert.match(context.planningResult.innerHTML, /2026-09-16T16:31:00.000Z/, "Cory arrival is based on his own scheduled job end plus travel");
assert.equal(context.liveLocationCandidate.routes.length, 2);
assert.ok(map.bounds.length >= 3, "Map fits all inspector origins and the candidate");

context.planningOrigin.value = "last";
context.invalidatePlanningResult();
assert.equal(removed.length, 3, "Changing criteria removes the stale pin and both comparison routes");
context.renderPlanningControls();
assert.equal(context.planningOrigin.value, "last", "Refreshing controls preserves the selected origin policy");
await context.dropPlanningCandidatePin();
assert.equal(calls[2].latitude, 42.5, "Final-job mode uses Kevin's final job rather than first/current");
assert.match(context.planningResult.innerHTML, /2026-09-16T19:31:00.000Z/);

context.planningInspector.value = "cory";
context.planningOrigin.innerHTML = "";
context.renderPlanningControls();
assert.equal(context.planningOrigin.value, "c1");
await context.dropPlanningCandidatePin();
assert.equal(context.liveLocationCandidate.routes.length, 1, "Single-inspector planning still works");
assert.doesNotMatch(context.planningResult.innerHTML, /ALL INSPECTORS|Kevin/);
console.log("PASS All-inspector comparison, own scheduled origins, earliest arrival, missing schedules, final-job mode, route cleanup and single-inspector regression");
