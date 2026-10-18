import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

process.env.TZ = "America/Detroit";

const admin = readFileSync(new URL("../admin.js", import.meta.url), "utf8");
const field = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const gps = readFileSync(new URL("../one-step-gps-service.gs", import.meta.url), "utf8");

function functionSource(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `Could not find ${start}`);
  return source.slice(from, to);
}

const adminFunction = functionSource(admin, "  function rangeDateKeys(", "\n  function formatDate(");
const fieldFunction = functionSource(field, "      function workflowWeekDateKeys()", "\n      function workflowWeeklyWorkedMinutes()");
const shiftDateKey = (key, offset) => {
  const day = new Date(`${key}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
};

for (const [day, expected] of [
  ["2026-10-17", ["2026-10-11", "2026-10-17"]], // Saturday closes the old week.
  ["2026-10-18", ["2026-10-18"]], // Sunday starts at zero.
  ["2026-10-19", ["2026-10-18", "2026-10-19"]],
  ["2027-01-01", ["2026-12-27", "2027-01-01"]],
  ["2027-01-03", ["2027-01-03"]]
]) {
  const adminContext = { dateKey: () => day, shiftDateKey, currentRange: "week" };
  runInNewContext(`${adminFunction}\nthis.result = rangeDateKeys("week");`, adminContext);
  const adminKeys = Array.from(adminContext.result);
  assert.equal(adminKeys[0], expected[0]);
  assert.equal(adminKeys.at(-1), expected.at(-1));
  assert.equal(adminKeys.length, 1 + (Date.parse(`${day}T12:00:00Z`) - Date.parse(`${expected[0]}T12:00:00Z`)) / 86400000);

  const instant = `${day}T16:00:00Z`;
  const fieldContext = {
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [instant])); } },
    localDateKey: value => {
      const date = value || new Date(instant);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
  };
  runInNewContext(`${fieldFunction}\nthis.result = workflowWeekDateKeys();`, fieldContext);
  assert.deepEqual(Array.from(fieldContext.result), adminKeys, `Field and office weeks differ on ${day}`);
}

const gpsContext = {
  Utilities: {
    formatDate(date, timeZone) {
      assert.equal(timeZone, "America/Detroit");
      return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    }
  }
};
runInNewContext(gps, gpsContext);
for (const [instant, expectedSunday] of [
  ["2026-10-17T16:00:00Z", "2026-10-11"],
  ["2026-10-18T16:00:00Z", "2026-10-18"],
  ["2026-10-19T16:00:00Z", "2026-10-18"],
  ["2027-01-03T16:00:00Z", "2027-01-03"]
]) {
  const bounds = gpsContext.oneStepGpsWeekBounds_(new Date(instant));
  assert.equal(new Date(bounds.sundayUtc).toISOString().slice(0, 10), expectedSunday);
}

assert.ok(!admin.includes("Current Monday-to-today total"));
assert.ok(field.includes("if (![5, 6].includes(today)) return false;"), "Sunday must not send a partial new-week summary");
console.log("PASS office, field, and GPS planning all use Sunday–Saturday workweeks");
