# One Step GPS — Cory timekeeping evidence

## Current state (October 16, 2026)

- Kevin authorized a `device.read`-only One Step GPS key and personally accepted the provider's API agreement. The key is stored only in the existing MPI Workflow Email Service Apps Script project's private Script Properties as `MPI_ONE_STEP_GPS_API_KEY`; it must never be copied into this repository, browser-delivered code, or chat.
- `OneStepGps.gs` in that project and `one-step-gps-service.gs` here contain private connection, trip-history, Spectora-coverage, and job-stop matching checks. The key, vehicle identification, and route request passed live tests. One Step returned drive/stop history with stop coordinates; neither credentials nor coordinates are logged.
- Spectora lists multiple inspectors in a single comma-separated `inspector_name` field. The first exact-name check therefore missed Cory's assignments. The corrected GET-only check found eight Cory-assigned inspections this week: three Monday, one Tuesday, none Wednesday, two Thursday, and two Friday. All eight have property coordinates and matched sustained One Step GPS stops within 200 meters and a bounded appointment-time window.
- Cory's MPI profile still has no current-week Spectora schedule or operations records, so this is a separate planning comparison. GPS can propose a **first-job arrival to last-inspection departure** window on four days, but it cannot verify a subsequent lab or extra task, paid hours, or the end of his workday. Wednesday has vehicle activity but no Cory-assigned Spectora job and must remain unclassified.
- The protected Cory profile backfill completed for October 12–16, with eight matched job stops across five saved days and no raw coordinates stored. The Office dashboard card is prepared locally but **not yet published**. No hours, payroll, Spectora records, or phone tracking have been modified.

## Safe path to dashboard integration

1. Publish the separate `GPS + Spectora planning check` Office card. The initial `syncOneStepGpsCoryReview` backfill has already written only proposed timestamps, counts, and freshness to Cory's protected profile; it did not write a timecard or approved hours.
2. Verify the card against known days in MPI Office and confirm the Monday, Tuesday, Thursday, and Friday job-site windows are plausible. Wednesday must display unclassified vehicle activity rather than zero work hours.
3. Only after the backfill and live card are verified, run `installOneStepGpsCoryRefresh` to add one 4-hour refresh trigger. Do not create duplicates.
4. Obtain/confirm lab and extra-task locations from the MPI workflow before proposing a final workday departure. If no final-task evidence exists, retain `workdayEndVerified: false` and show only the last-inspection departure.
5. Test a completed known Cory workday including a lab/extra-task case, a no-job day, no GPS signal, multiple stops near a job, and daylight-saving transitions. Only then consider reducing Cory's duplicate phone-route collection; leave Kevin's phone behavior unchanged without his explicit choice.

Provider reference: <https://track.onestepgps.com/v3/apidoc/> (`device.read`, `/device-info`, `/route/drive-stop`).
