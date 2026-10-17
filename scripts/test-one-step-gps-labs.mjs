import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../one-step-gps-service.gs", import.meta.url), "utf8");
const context = {
  Utilities: {
    formatDate(value, timeZone) {
      assert.equal(timeZone, "America/Detroit");
      const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
      const part = name => parts.find(item => item.type === name).value;
      return `${part("year")}-${part("month")}-${part("day")}`;
    }
  }
};
runInNewContext(source, context);

const [waterTech, ims] = context.MPI_ONE_STEP_GPS.LABS;
const stop = (from, to, lab) => ({
  start: Date.parse(from),
  end: Date.parse(to),
  coordinates: { lat: lab.latitude, lng: lab.longitude }
});
const lastJob = Date.parse("2026-10-16T18:00:00Z");
const date = "2026-10-16";
const waterVisit = stop("2026-10-16T18:40:00Z", "2026-10-16T19:00:00Z", waterTech);
const imsVisit = stop("2026-10-16T19:30:00Z", "2026-10-16T19:50:00Z", ims);

assert.equal(context.oneStepGpsCoryFinalLabStop_([waterVisit], date, lastJob)?.labName, "Water Tech");
assert.equal(context.oneStepGpsCoryFinalLabStop_([waterVisit, imsVisit], date, lastJob)?.labName, "IMS Laboratory");
assert.equal(context.oneStepGpsCoryFinalLabStop_([waterVisit, imsVisit], date, lastJob)?.end, imsVisit.end);
assert.equal(context.oneStepGpsCoryFinalLabStop_([waterVisit], date, Date.parse("2026-10-16T19:05:00Z")), null);
assert.equal(context.oneStepGpsCoryFinalLabStop_([stop("2026-10-16T18:40:00Z", "2026-10-16T18:44:00Z", waterTech)], date, lastJob), null);
assert.equal(context.oneStepGpsCoryFinalLabStop_([stop("2026-10-16T18:40:00Z", "2026-10-16T19:00:00Z", { latitude: 42.7, longitude: -83.9 })], date, lastJob), null);
assert.equal(context.oneStepGpsCoryFinalLabStop_([stop("2026-10-17T05:00:00Z", "2026-10-17T05:20:00Z", waterTech)], date, lastJob), null);
assert.equal(context.oneStepGpsCoryFinalLabStop_([waterVisit], date, null), null);

console.log("PASS Cory lab-departure proposals require a sustained, same-day post-job stop at a known lab");
