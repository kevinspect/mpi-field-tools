import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../admin.js", import.meta.url), "utf8");
const start = source.indexOf("  function renderTeamOverview() {");
const end = source.indexOf("\n  function coryGpsReviewCard(", start);
assert.ok(start >= 0 && end > start, "Cory's dashboard renderer must be present");
const renderSource = source.slice(start, end);

function render(gpsMinutes) {
  const cory = { name: "Cory Leese", email: "cory@michiganpropertyinspections.com" };
  const teamOverview = { hidden: true, innerHTML: "" };
  const context = {
    teamOverviewEntries: () => [{ kind: "inspector", person: cory }],
    operativePeople: () => [cory],
    shared: { normalizeEmail: value => value.toLowerCase() },
    weeklyMinutes: () => 417,
    gpsPlanningWindowMinutes: () => gpsMinutes,
    formatMinutes: minutes => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`,
    currentProfile: { role: "owner" },
    coryGpsReviewCard: () => "",
    overviewRow: () => "<div>Cory</div>",
    teamOverview,
    inspectorDetail: { hidden: false }
  };
  runInNewContext(`${renderSource}\nrenderTeamOverview();`, context);
  return teamOverview.innerHTML;
}

const gpsCard = render(480);
assert.match(gpsCard, /CORY · GPS MATCHED-TASK WINDOW THIS WEEK/);
assert.match(gpsCard, /8h 00m/);
assert.match(gpsCard, /cory-hours-card gps-planning/);
assert.doesNotMatch(gpsCard, /RECORDED HOURS · PAYROLL|GPS estimate is not payroll time|cory-overtime/);

const fallback = render(0);
assert.match(fallback, /CORY · RECORDED HOURS THIS WEEK/);
assert.match(fallback, /6h 57m/);
console.log("PASS Cory's GPS card omits the payroll panel and retains recorded-hours fallback");
