# MPI Field Tools — Six-Hour Improvement Journal

## Protected fallback

- Date created: August 26, 2026
- Live baseline commit: `f522e534b8d8123c1880e24a0d5eb1ad6311924d`
- Protected GitHub branch: `fallback/pre-six-hour-review-2026-08-26`
- Purpose: exact copy of the live app before this improvement cycle began.
- Rollback instruction: move the public `main` branch back to the protected fallback commit and refresh the service-worker cache version.

## Guardrails for this improvement cycle

- Preserve the current mobile-first MPI visual style.
- Keep inspector workflows short and obvious.
- Prefer free, device-local, or existing-company systems.
- Do not add paid services, subscriptions, or purchases.
- Do not weaken existing privacy or send data to new recipients.
- Do not replace InterNACHI-issued credentials with MPI approval.
- Publish only changes that pass local checks.

## Change log

### Build 1 — Guided workday and company tool knowledge

Status: published August 26, 2026 as GitHub commit `35b84a468f542021525a09cf0c57bfcf1fbffb82`.

#### Additions

1. Added **Job Companion** to the home screen.
   - Stores the inspector and current property on that company phone.
   - Automatically fills the inspector and property in the damage, equipment-photo, tool-check, and field-question forms.
   - Provides a 12-step, four-stage job flow: Before travel, On arrival, Before leaving, and Closeout.
   - Saves progress locally and works without cell service.
   - Opens the current property in Apple Maps.
   - Includes direct shortcuts to photo records, damaged-item notices, field procedures, and the tool closeout.
   - Requires the inspector to intentionally clear a finished job; it does not track location or transmit activity in the background.

2. Added **Company Tool Guides** to the home screen.
   - Covers all 21 items on the MPI Inspector Tool Master List.
   - Searchable by tool, purpose, brand, model, or task.
   - Filterable by category.
   - Each card includes purpose, field sequence, required record, care/return steps, stop conditions, and model-specific manufacturer links where exact controls matter.
   - Cards remain available offline after the app is cached.

3. Added model-specific operating links and safety boundaries for higher-risk equipment.
   - Milwaukee voltage/GFCI test equipment, IR thermometer, and clamp meter.
   - General Tools moisture meter.
   - TOPTES combustible-gas and carbon-monoxide detectors.
   - Environmental Express Bio-Pump IAQ Lite.
   - Xtend+Climb ladder plus OSHA ladder requirements.
   - Inspector Cameras Scout 3-Pro Plus.
   - UplinkRobotics Wombat.
   - DJI Mini 4 Pro plus FAA Part 107 operating requirements.

4. Updated the offline cache identifier to Build 38 so installed phones receive the new app shell after publication.

#### Safety and privacy decisions

- Tool cards do not authorize an inspector to perform a task.
- Manufacturer instructions and the MPI SOP control when more restrictive.
- Job progress stays on the phone and is not silently emailed or tracked.
- No background location collection was added.
- No new paid service or third-party data recipient was added.

#### Validation record

- Inline JavaScript syntax: passed.
- Tool-guide inventory count: 21.
- Duplicate HTML IDs: none detected.
- Local app response: HTTP 200.

#### Rollback for this build

- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26`.
- The protected branch contains the complete prior live release, including its matching service worker.

### Build 2 — Calmer navigation and connected field help

Status: implemented locally; publication pending validation.

#### Additions

1. Reorganized the home screen into three clearly labeled work areas.
   - Today’s inspection.
   - Reference & training.
   - Team & support.
   - Preserved every existing tool as a full-width, website-style button; no feature was removed or hidden in a menu.

2. Connected the end-of-job checklist to Company Tool Guides.
   - The checklist guidance now includes a direct button to the operating cards.

3. Added direct tool-to-procedure links where a controlled MPI procedure exists.
   - Electrical tester kit → electrical panel cover safety check.
   - IR thermometer → cooling temperature differential.
   - Combustible-gas detector → universal safe-stop procedure.
   - Carbon-monoxide detector → ambient CO screening.
   - Telescoping ladder and roof drone → roof access decision.
   - The matching procedure and search result open automatically.

4. Updated the offline cache identifier to Build 39.

#### Validation record

- Home-screen tool count: 12, unchanged.
- Home-screen groups: 3.
- Tool-guide inventory count: 21, unchanged.
- Tool-to-procedure navigation: tested locally through the IR thermometer card.
- IR thermometer link opened “Cooling temperature differential” automatically.

#### Rollback for this build

- Restore GitHub `main` to `35b84a468f542021525a09cf0c57bfcf1fbffb82` to keep Build 1 but remove Build 2.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.
