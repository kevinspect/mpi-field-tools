import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../admin.js", import.meta.url), "utf8");
const functions = source.slice(source.indexOf("  function coryTruckPoint()"), source.indexOf("  function coryTruckPopup("));
const layers = [];
const routeLayer = {
  addLayer: item => layers.push(item),
  removeLayer: item => { const index = layers.indexOf(item); if (index >= 0) layers.splice(index, 1); },
  clearLayers: () => { layers.length = 0; }
};
const map = { fitBounds: (...args) => { map.bounds = args; } };
const eta = { hidden: true, innerHTML: "", classList: { toggle() {} } };
const routes = [];
const line = (points, style) => ({ points, style, bindPopup(value) { this.popup = value; return this; }, addTo(layer) { layer.addLayer(this); return this; } });
const now = new Date();
const context = vm.createContext({
  Date, Number, String, Math, AbortController, console,
  window: { L: { polyline: line }, MPI_PLANNING: { roadTravel: async (origin, destination) => {
    routes.push({ origin, destination });
    return { miles: 12.4, minutes: 22, geometry: [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]] };
  } }, setTimeout, clearTimeout },
  coryTruckRecord: { latitude: 42.5, longitude: -83.1, gpsAt: now.toISOString() },
  coryJobRouteLayer: routeLayer, coryJobRouteController: null, coryJobRouteGeneration: 0, coryJobRouteLast: null,
  coryJobEta: eta, liveLocationMap: map, liveRouteDate: { value: "2026-10-19" }, dateKey: () => "2026-10-19",
  selectedMapJobValue: JSON.stringify(["cory", "job-1"]),
  liveLocationPlannedStops: [{ person: { id: "cory", name: "Cory Leese" }, job: { id: "job-1", property: "100 Main St" }, coordinates: { latitude: 42.6, longitude: -83.2 } }],
  parseMapJobValue: value => { try { const [personId, jobId] = JSON.parse(value); return { personId, jobId }; } catch { return null; } },
  canonicalTeamName: person => person.name,
  scheduleAddress: job => job.property,
  escapeHtml: value => String(value),
  formatTime: value => new Date(value).toISOString(),
  asDate: value => value ? new Date(value) : null
});
vm.runInContext(functions, context);

await context.updateCoryJobRoute({ force: true });
assert.equal(routes.length, 1, "Selecting Cory's job requests one road route");
assert.equal(routes[0].origin.latitude, 42.5, "The route starts at the truck's current point");
assert.equal(routes[0].destination.latitude, 42.6, "The route ends at the selected job");
assert.equal(layers.length, 1);
assert.match(eta.innerHTML, /About 22 min.*ETA around.*if leaving now.*without live traffic/i);
assert.ok(map.bounds, "Selecting the job frames the truck and destination");

context.coryTruckRecord = { latitude: 42.501, longitude: -83.101, gpsAt: new Date().toISOString() };
await context.updateCoryJobRoute();
assert.equal(routes.length, 1, "A new point within a minute does not spam the public road router");
assert.equal(layers.length, 2, "A short connector keeps the line attached to the newest truck point");
assert.equal(layers[1].points[0][0], 42.501);

vm.runInContext("coryJobRouteLast.calculatedAt -= 61000", context);
await context.updateCoryJobRoute();
assert.equal(routes.length, 2, "A moving truck recalculates the road ETA after the throttle interval");
assert.equal(layers.length, 1, "The previous road route and connector are replaced");

context.coryTruckRecord.gpsAt = new Date(Date.now() - 10 * 60000).toISOString();
await context.updateCoryJobRoute();
assert.equal(layers.length, 0, "A stale truck point clears the route rather than showing a false live ETA");
assert.match(eta.innerHTML, /ETA paused.*GPS is stale/s);

context.coryTruckRecord.gpsAt = new Date().toISOString();
context.selectedMapJobValue = JSON.stringify(["kevin", "job-1"]);
await context.updateCoryJobRoute({ force: true });
assert.equal(eta.hidden, true, "Other inspectors' jobs do not use Cory's truck");
assert.equal(routes.length, 2);

context.selectedMapJobValue = JSON.stringify(["cory", "job-1"]);
context.window.MPI_PLANNING.roadTravel = async () => { throw new Error("Router unavailable"); };
await context.updateCoryJobRoute({ force: true });
assert.match(eta.innerHTML, /Road ETA temporarily unavailable.*direct connection only/s);
assert.equal(layers.length, 1, "Router failure retains a clearly labeled direct line but no invented ETA");
assert.equal(layers[0].style.dashArray, "7 7");

console.log("PASS Cory job routing uses current truck GPS, throttles road ETA, clears stale routes, handles router failure, and does not route other inspectors from Cory's truck");
