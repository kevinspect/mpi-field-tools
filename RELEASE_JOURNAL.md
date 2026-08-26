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

Status: published August 26, 2026 as GitHub commit `43875547513bbe3e684ce3956232de696354854d`.

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

### Build 3 — Safety and near-miss communication

Status: published August 26, 2026 as GitHub commit `bb54dcdb70beddd6d58a265671ca8e97783d8b02`.

#### Additions

1. Added **Safety & Near-Miss Notice** under Team & support.
   - Covers near misses, unsafe access/site conditions, tool or equipment failures, vehicle events, property concerns, injury/illness, and other safety events.
   - Captures the occurrence time, facts observed, inspection decision, immediate action, everyone informed, and follow-up needed.
   - Allows multiple notified parties, an explained Other selection, or No one informed.
   - Sends the initial notice only to `kev@michiganpropertyinspections.com` through the same existing form-delivery service already used by MPI Field Tools.
   - Does not add a new recipient, subscription, paid service, photo upload, or background tracking.

2. Connected the notice to the current field workflow.
   - Current-job inspector and property details fill automatically.
   - Job Companion includes a direct Safety / near miss shortcut.
   - The universal safe-stop procedure links directly to the Safety Notice and Ask Management.
   - The notice links separately to Damaged Item Notice when confirmed damage must also be recorded.

3. Added clear safety and privacy boundaries.
   - Emergency response and reaching a safe position come before completing the form.
   - The form is an initial company notice, not an emergency request or substitute for a required formal report.
   - Inspectors are told to record facts, not blame or unsupported causes, and not to enter medical history or identification numbers.

4. Updated the offline cache identifier to Build 40.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Safety screen count: 1.
- People-informed choices: 8.
- Other / No one selection behavior: passed.
- Current-job inspector and property autofill: passed locally.
- No test email was submitted during validation.

#### Rollback for this build

- Restore GitHub `main` to `43875547513bbe3e684ce3956232de696354854d` to keep Builds 1–2 but remove the Safety Notice.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 4 — Purchased-tool onboarding and support routing

Status: published August 26, 2026 as GitHub commit `38f470ed16c442eecbf43a6f31f7da84a54ce23d`.

#### Additions

1. Added **Newly purchased tool — first-use setup** to Company Tool Guides.
   - Verifies the exact model, serial number, parts, rating, and intended purchase before packaging is discarded.
   - Requires the current manufacturer manual, receipt/warranty record, asset label, condition inspection, startup/function check, and any required calibration, registration, certification, or service interval.
   - Establishes accessories, charger/case, storage position, cleaning method, assignment, and end-of-job accountability.
   - Requires the Tool Master List and model-specific quick guide to be updated before independent field use.
   - Records who trained the inspector and any supervision or authorization restriction.

2. Added a support route to every operating card.
   - Every physical tool card now includes **Report a problem with this tool**.
   - The Inspector Request opens with Tool or equipment repair and the exact company tool/model already filled in.
   - The first-use setup card includes **Request a guide for a new purchase** and opens a new Company tool guide addition or update request type.

3. Clarified the guide inventory.
   - The browser contains the 21 current inventory tools plus one company first-use setup checklist.
   - The end-of-job physical tool count remains 21 and was not changed.

4. Updated the offline cache identifier to Build 41.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Tool Guide browser count: 22 total cards (21 inventory + 1 setup).
- Newly purchased tool search: returned the commissioning checklist.
- New-guide request shortcut: correct request type and item were filled automatically.
- Moisture-meter problem shortcut: correct repair type and exact model were filled automatically.
- No request was submitted during testing.

#### Rollback for this build

- Restore GitHub `main` to `bb54dcdb70beddd6d58a265671ca8e97783d8b02` to keep Builds 1–3 but remove purchased-tool onboarding.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 5 — Expanded SOP field prompts

Status: published August 26, 2026 as GitHub commit `11f11585eced2c7837f28b638910c6e37139a548`.

#### Additions

1. Expanded Field Procedures from 12 to 26 searchable quick prompts using the controlled MPI Residential Inspector Field Operations Handbook v1.3.
   - Exterior faucet / hose-bibb test — SOP 6.3.
   - Installed appliance primary-function test — SOP 7.4.
   - Water heater / hot-water source check — SOP 8.4.
   - Sewage ejector and floor-drain check — SOP 8.6.
   - Representative receptacle, GFCI, and AFCI testing — SOP 9.2.
   - Generator, transfer equipment, and EV charging check — SOP 9.3.
   - HVAC system identification and pre-operation check — SOP 10.1.
   - Forced-air heating functional check — SOP 10.3.
   - Boiler and hydronic-system check — SOP 10.4.
   - Sump-pump functional check — SOP 11.3.
   - Attic access and inspection sequence — SOP 11.4.
   - Garage vehicle door and operator check — SOP 12.2.
   - Smoke and carbon-monoxide alarm check — SOP 13.2.
   - Fireplace inspection and gas-operation boundary — SOP 13.3.

2. Preserved the quick-reference format for every new prompt.
   - Purpose.
   - Short step-by-step sequence.
   - Required report record.
   - Stop conditions and limitations.
   - Exact handbook section, handbook version, and effective date.

3. Added four common-task shortcuts without creating another home-screen tool.
   - Furnace heat.
   - Water heater.
   - Sump pump.
   - Garage door.

4. Updated the electrical tester-kit card to open the new representative receptacle/GFCI/AFCI procedure instead of the less-specific panel-cover procedure.

5. Updated the offline cache identifier to Build 42.

#### Source control

- Source: Michigan Property Inspections Residential Inspector Field Operations Handbook, Version 1.3, effective August 17, 2026.
- New prompts condense the controlled text for field use; they do not broaden the inspection scope or authorize a procedure.
- No Internet source or generic inspection procedure was substituted for the MPI handbook.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Quick prompt count: 26.
- Unique quick prompt IDs: 26.
- Furnace shortcut: opened Forced-air heating functional check and displayed SOP 10.3 source information.
- Water-heater shortcut: opened Water heater / hot-water source check.
- Garage-door shortcut: opened Garage vehicle door and operator check.
- Browser error log during these tests: 0 errors.

#### Rollback for this build

- Restore GitHub `main` to `38f470ed16c442eecbf43a6f31f7da84a54ce23d` to keep Builds 1–4 but remove the expanded SOP prompts.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 6 — SOP knowledge checks

Status: published August 26, 2026 as GitHub commit `b51d6fdc57f301bcf9960ee6f5cc4bea065cde72`.

#### Additions

1. Expanded the Training Center from five to ten short, device-local knowledge checks.
   - Electrical device testing and power restoration — SOP 9.2.
   - Water-heater identification and safety boundaries — SOP 8.4.
   - Installed-appliance primary-function testing and closeout — SOP 7.4.
   - Attic access, viewing method, contamination, and restoration — SOP 11.4.
   - Garage-door operator safety, non-contact testing, and restoration — SOP 12.2.

2. Kept the training experience short and field focused.
   - Each lesson presents the approved sequence, stop boundary, required record, and one knowledge check.
   - Each lesson cites the exact controlled MPI SOP section.
   - Completion progress stays on the company phone and remains available offline.
   - The new lessons use the existing Training Center and do not add another home-screen button.

3. Updated the offline cache identifier to Build 43.

#### Source control

- Source: Michigan Property Inspections Residential Inspector Field Operations Handbook, Version 1.3, effective August 17, 2026.
- The lessons are condensed refreshers and do not replace supervised competency sign-off or authorize work outside company policy.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Training modules: 10 unique modules.
- Completion controls: 10 matching buttons.
- Knowledge checks: 10 quiz groups, each with one correct and one incorrect answer.
- Garage-door lesson: opened successfully and displayed the SOP 12.2 source.
- Browser error log during the lesson test: 0 errors.

#### Rollback for this build

- Restore GitHub `main` to `11f11585eced2c7837f28b638910c6e37139a548` to keep Builds 1–5 but remove the five new lessons.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 7 — Start-of-day readiness

Status: published August 26, 2026 as GitHub commit `23f4732b1bc59235cd98ba0500cac952c9e40498`.

#### Additions

1. Added a 30-second **Start-of-day readiness** check inside Job Companion.
   - Reviews the schedule, route, weather, special services, and access notes.
   - Confirms the company phone, cameras, apps, tools, meters, detectors, ladders, PPE, vehicle supplies, forms, batteries, and consumables are ready.
   - Confirms no missing or damaged item will prevent safe completion of assigned work.
   - Records a one-tap “Ready” status for the current date on that company phone.

2. Kept normal operation quiet and private.
   - A normal readiness confirmation does not send an email.
   - The next calendar day automatically starts as Not checked.
   - The check lives inside Job Companion and does not add another home-screen button.

3. Added exception routing.
   - **Something needs attention** opens the existing Inspector Request form.
   - The request is automatically categorized as Scheduling or operational support.
   - The item, requested date, and details prompt are filled automatically; the inspector reviews and submits it intentionally.
   - No test request was submitted.

4. Updated the offline cache identifier to Build 44.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Initial state: Not checked today.
- One-tap result: status changed to Ready with the local completion time.
- Issue route: opened Inspector Request with the correct request type, item, date, and details prompt.
- Browser error log during the test: 0 errors.

#### Rollback for this build

- Restore GitHub `main` to `39cb091424372bc761ebb335639f56af14f5e31d` to keep Builds 1–6 but remove Start-of-day readiness.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 8 — Report release quality check

Status: published August 26, 2026 as GitHub commit `e3278efd19e05e8ad24136f35a7e283b297aec5e`.

#### Additions

1. Added a collapsed **60-second report release check** inside Job Companion.
   - Confirms every applicable report section and item is addressed.
   - Confirms required room and General/Overview photographs are present and properly oriented.
   - Confirms significant findings include a specific location, supporting photograph, and recorded test result when applicable.
   - Confirms limitations state the affected area, reason, method used, and effect on the inspection.
   - Confirms condition-specific titles and supported Observation / Implication / Recommendation wording.
   - Confirms urgent hazards were communicated and the report, summary, and photographs are synchronized.

2. Connected the check to the active job.
   - Progress is stored with that property on the company phone.
   - The status changes from 0 of 6 to Release check complete only after all six confirmations.
   - Starting a different property creates a fresh check; clearing the finished job removes the saved check.
   - Nothing is emailed and no central employee score is created.

3. Updated the offline cache identifier to Build 45.

#### Source control

- Source: MPI Residential Inspector Field Operations Handbook v1.3, including the Eight Non-Negotiable Company Standards and the report-completion and quality-control requirements.
- The check is a final inspector prompt and does not replace management report review.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Report-release controls: 6 unique checks.
- Active-job test: all six selections persisted and changed the status to Release check complete.
- 390-pixel phone layout: card width and status remained inside the viewport with no horizontal overflow.
- Browser error log during the interaction test: 0 errors.

#### Rollback for this build

- Restore GitHub `main` to `53c47b3ceb222e436d0e92f35946099f1e7709c5` to keep Builds 1–7 but remove the report release check.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

## Cross-build phone and offline validation

- Tested at a true 390 × 844 CSS-pixel phone viewport.
- Home, Job Companion, Today’s Jobs, Equipment Age Finder, Damaged Item Notice, Equipment Photo Record, Field Procedures, End-of-Job Tool Check, Company Tool Guides, Training Center, Team Messages, Requests & Feedback, and Safety & Near-Miss Notice all remained within the phone viewport.
- Horizontal overflow: none detected on all 13 screens.
- With the test browser’s network disabled after the first visit, the cached app opened Job Companion and displayed Start-of-day readiness successfully.
- Online-only forms and live company services still require a connection by design.

### Build 9 — Field escalation guide

Status: published August 26, 2026 as GitHub commit `e9ff0a0a9df54249361e8fabfd6228a218465165`.

#### Additions

1. Added **What needs attention?** inside Team Messages.
   - Immediate danger or injury: stop, move to safety, keep others clear, call emergency services, then open the Safety Notice.
   - Property damage or an item not restored: protect the area, photograph it, inform the responsible party, and open Damaged Item Notice.
   - Cannot proceed, access, or finish: open a management question with During this inspection selected and a factual decision prompt already entered.
   - Tool or equipment problem: open Inspector Request with Tool or equipment repair, the requested date, and a tool-condition prompt already entered.
   - Procedure or report decision: open Field Procedures first or open a management question with Before the report is released selected.

2. Kept escalation deliberate and low-noise.
   - The guide opens the correct existing workflow but never submits a form automatically.
   - No new recipient, service, paid system, or background activity was added.
   - The guide is collapsed by default and does not add another home-screen tool.

3. Updated the offline cache identifier to Build 46.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Escalation routes: 5.
- Access/finish route: correctly filled During this inspection and the management-question prompt.
- Tool-problem route: correctly filled Tool or equipment repair, the item, requested date, and details prompt.
- 390-pixel phone layout: one-column route cards with no horizontal overflow.
- Browser error log during the route test: 0 errors.
- No form, phone call, or emergency-service action was submitted during testing.

#### Rollback for this build

- Restore GitHub `main` to `5f080f755b088d0604fd4679eefa4156984a86ff` to keep Builds 1–8 but remove the escalation guide.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 10 — Factory-documented Age Finder expansion

Status: published August 26, 2026 as GitHub commit `050c0c8532a59254b1911f28c9045b16b57f4b8f`.

#### Additions

1. Added four clearly separated equipment choices to the Age Finder.
   - Lochinvar tank-type water heaters using the documented 2011+ year/week code or the documented 1993–2012 year/month letter code.
   - Navien NR/NP units using the documented middle `YYYYMMDD` product-date block.
   - Lochinvar Copper-Fin, Power-Fin, Knight, Armor, Shield, Sync, Crest, FTXL, and related systems using the documented pre-May-2015 or post-May-2015 code.
   - Lochinvar legacy specialty equipment, with separate handling for legacy Copper-Fin, Hi-Fire/Power Gas/oil-fired equipment, and electric boosters.

2. Added older documented Lochinvar coverage.
   - Copper-Fin month/year examples supported from the published 1970–1981 year table.
   - Hi-Fire/Power Gas/oil-fired month/year examples supported for the published 1975–1986 table.
   - Eight-digit year/month format supported from 1984 onward.
   - Electric-booster year/month positions supported for the documented 1978–2010 layout.
   - The unusual Lochinvar 2015 week/year transition is decoded separately from the 2016+ year/week order.

3. Added safety controls around ambiguous labels.
   - Lochinvar product families are separate dropdown choices so one family’s code is not silently applied to another.
   - Navien formats outside the documented NR/NP layout direct the inspector to Navien’s official serial lookup.
   - Invalid calendar dates, future dates, unsupported year ranges, invalid weeks, and mismatched serial lengths are rejected.
   - Updated the offline cache identifier to Build 47.

#### Source control

- Lochinvar Serial Number Guide, Lochinvar LLC, document 904026WARR Rev. 21.
- Navien NR/NP Service Manual serial-number example and Navien official serial lookup.
- Only formats explicitly documented by the manufacturers were added.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Manufacturer/equipment choices: 20; every choice has a decoder configuration.
- All 20 built-in examples: passed in the browser.
- Historical and transition examples tested: 10; all returned the documented dates.
- Invalid and cross-format examples tested: 5; all were safely rejected.
- 390-pixel phone layout: Age Finder remained inside the viewport with no horizontal overflow.

#### Rollback for this build

- Restore GitHub `main` to `312c193c44ef078517a4b8c271d06b115eda794b` to keep Builds 1–9 but remove the manufacturer expansion.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 11 — New-tool commissioning record

Status: published August 26, 2026 as GitHub commit `acc80637103ac0aa0112f002c7765f58e055c123`.

#### Additions

1. Added a collapsed **Put a new or replacement tool into service** workflow inside Company Tool Guides.
   - Opens the existing seven-step first-use setup guide with one tap.
   - Records the person completing setup, received date, brand, exact model, serial/asset number, and assigned inspector/vehicle/storage.
   - Records official-manual/quick-guide status, controlled function-check result, training/authorization status, and the next service or calibration date.
   - Records accessories, storage position, restrictions, missing items, and follow-up.
   - Requires an explicit Ready for approved company use or Hold out of service decision.

2. Kept management communication simple.
   - One professional commissioning record is emailed only to Kevin.
   - No email is sent merely for opening, completing, or saving the form.
   - The form is collapsed by default and no additional home-screen item was added.
   - A failed function check, missing instructions, or incomplete authorization can be clearly recorded as Hold out of service.

3. Updated the offline cache identifier to Build 48.

#### Source control

- MPI company tool master list.
- MPI Residential Inspector Field Operations Handbook v1.3 equipment-readiness, safe-operation, property-protection, and competency requirements.
- Current manufacturer instructions remain controlling for exact model setup and operation.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Required commissioning controls: 12.
- Empty-form safeguard: passed with a clear required-field message.
- First-use link: correctly opened **Newly purchased tool — first-use setup**.
- Recipient: only `kev@michiganpropertyinspections.com`.
- 390-pixel phone layout: opened form stayed within the viewport with no horizontal overflow.
- No test email was sent.

#### Rollback for this build

- Restore GitHub `main` to `7f5228ca05ab87cd45ec3db4727a384ea60ccc6a` to keep Builds 1–10 but remove the commissioning record.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.
