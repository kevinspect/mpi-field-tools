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

### Build 12 — New inspector field pathway

Status: published August 26, 2026 as GitHub commit `6514beed53401864685374f457a567f4748c90ea`.

#### Additions

1. Added a collapsed **New inspector field pathway** inside Training Center.
   - 20 milestones organized into five stages: safe start/company standard; rooms/wet areas/appliances; building systems; structure/access/closeout; and report quality/release.
   - Milestones are drawn from the MPI handbook workflow and competency sign-off topics.
   - Progress saves on the company phone and works offline.
   - Each stage changes to a completed state only when all four milestones are checked.

2. Added a deliberate management review summary.
   - Inspector and optional trainer/reviewer names, review date, next review date, and next coaching focus can be recorded.
   - One button emails Kevin a snapshot containing the completed milestones, remaining milestones, overall progress, and next focus.
   - Nothing is emailed in the background and normal checkbox activity stays on the phone.

3. Kept training authority clear.
   - The pathway does not issue or approve InterNACHI badges.
   - It does not replace MPI’s supervised competency sign-off.
   - It does not authorize ancillary services or independent work beyond documented training.
   - Updated the offline cache identifier to Build 49.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Onboarding milestones: 20 across 5 stages.
- Progress persistence: 2 checked milestones remained checked after page reload.
- Isolated email-summary test: 3 of 20 progress, 3 completed labels, 17 remaining labels, timestamp, and subject were generated correctly without external submission.
- Recipient: only `kev@michiganpropertyinspections.com`.
- 390-pixel phone layout: opened pathway and form stayed within the viewport with no horizontal overflow.
- During an earlier redirect check, one QA progress submission may have been delivered only to Kevin; no inspector or other company address was included.

#### Rollback for this build

- Restore GitHub `main` to `46b3b8739f85b4efbb8c230b1096ac7b552bafcc` to keep Builds 1–11 but remove the onboarding pathway.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 13 — Home-screen active job resume

Status: published August 26, 2026 as GitHub commit `fbe72654e02a184100ebf06968980b0171565710`.

#### Additions

1. Added a current-inspection banner at the top of the home screen when Job Companion has an active property.
   - Shows the exact property address.
   - Shows live closeout progress out of 12 steps.
   - Shows when the report release check is complete.
   - Provides one-tap Resume job and Apple Maps Directions actions.

2. Kept the home screen uncluttered.
   - The banner is completely hidden when no job is active.
   - It uses information already stored by Job Companion on the company phone.
   - No new tracking, email, background service, or home-screen tool was added.
   - Progress changes immediately as Job Companion steps or the release check are updated.

3. Updated the offline cache identifier to Build 50.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Active job: property, Apple Maps link, step count, and release-check status displayed correctly.
- Live progress: checking two Job Companion steps updated the banner to 2 of 12.
- 390-pixel phone layout: a long demonstration property address and both action buttons stayed inside the viewport with no horizontal overflow.
- No network request or email is created by the banner.

#### Rollback for this build

- Restore GitHub `main` to `18c4d43cedf4e14e8013200963c9ee22a15bed62` to keep Builds 1–12 but remove the active-job banner.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 14 — App version and safe update checker

Status: published August 26, 2026 as GitHub commit `75a8b04d76f21ff968397ddc0d454b00e721c88e`.

#### Additions

1. Added a visible app build number at the bottom of the home screen.
   - Inspectors and management can now confirm exactly which published version is open.
   - A **Check for updates** button checks a small version file instead of downloading the full app again.

2. Added a safe newer-version notice.
   - If a newer build exists, the app shows the new build number and a clear Load update button.
   - The notice tells the inspector to finish any unsent form first.
   - The app never reloads automatically, protecting typed notes and selected photographs.
   - Returning to the app checks again only after a five-minute interval, limiting unnecessary phone data use.

3. Added a cache-busting update load.
   - The Load update action keeps the inspector on the current app section and requests a fresh published copy.
   - Offline users receive a reconnect message instead of a broken page.
   - Updated the offline cache identifier to Build 51.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- `version.json`: valid JSON.
- Current-build check: reported Build 51 is current and kept the update notice hidden.
- Newer-build simulation: showed Build 52 available, the unsent-form warning, and Load Build 52.
- 390-pixel phone layout: version row and update notice stayed within the viewport; the Load update control remained 44 pixels high.
- Update remains inspector-controlled; no automatic reload occurs.

#### Rollback for this build

- Restore GitHub `main` to `c90144931a6b3ecb69bc7f2277c064f38ad66f9c` to keep Builds 1–13 but remove the update checker.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 15 — Required company-message acknowledgement

Status: published August 26, 2026 as GitHub commit `bc004847b809a459683388154c4d2bbf7283e315`.

#### Additions

1. Added acknowledgement to the current required Before and After photo reminder.
   - Ordinary company notices remain read-only and never create email.
   - The inspector enters their name and confirms that the required instruction was read and understood.
   - One acknowledgement is emailed only to Kevin when the inspector deliberately submits it.

2. Added device-side acknowledgement memory.
   - After a successful return from the email service, the required message changes to Acknowledged on this phone.
   - The acknowledgement form is hidden to reduce duplicate submissions.
   - The confirmation query is removed from the address after it has been processed.
   - Nothing is tracked or emailed in the background.

3. Kept the acknowledgement specific and auditable.
   - The email includes the inspector, exact required-message title, stable message ID, and submission time.
   - The acknowledgement does not represent training completion or competency sign-off.
   - Updated the visible build, version file, and offline cache identifier to Build 52.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Isolated submission test: subject, timestamp, disabled pending state, and Kevin-only recipient generated correctly without external submission.
- Successful-return simulation: card marked acknowledged, form hidden, completion notice shown, and query removed.
- 390-pixel phone layout: acknowledgement panel stayed within the viewport with no horizontal overflow.

#### Rollback for this build

- Restore GitHub `main` to `2d259244ce384413d1d751ea8f998e28bd0914c6` to keep Builds 1–14 but remove required-message acknowledgement.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 16 — Job Companion next useful action

Status: published August 26, 2026 as GitHub commit `a002a82347353bd7f3c6742f39be4b11cd13bd35`.

#### Additions

1. Added one focused **Next useful action** card to Job Companion.
   - It identifies the first incomplete step instead of making the inspector scan all four stages.
   - The guidance advances immediately when a field step is checked.
   - The wording stays short and task specific for phone use.

2. Connected each next action to the relevant place.
   - Schedule and scope open Today’s Jobs.
   - Field-kit readiness opens Company Tool Guides.
   - Before/After documentation opens Equipment Photo Record.
   - Wet-area recheck opens Field Procedures.
   - Tool closeout and communication open their matching app screens.
   - Local checklist actions open and move to the correct stage without leaving Job Companion.

3. Added clear final states.
   - After all 12 field steps, the card directs the inspector to the 60-second report release check.
   - After both the field steps and report release check are complete, the card displays **Job closeout checks complete** and removes its action button.
   - Updated the visible build, version file, and offline cache identifier to Build 53.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- First-incomplete-step test: after the first three travel items were complete, the card advanced to **Verify the property and report**.
- Local action test: **Open this stage** expanded the matching On arrival checklist.
- Final-step test: all 12 field steps changed the card to **Complete the report release check** and opened that panel.
- Completion test: all 12 field steps plus all six release checks changed the card to **Job closeout checks complete** with no action button.
- 390-pixel phone layout: no horizontal overflow; the action button remained 44 pixels high.
- The feature stores no new data and creates no email or network submission.

#### Rollback for this build

- Restore GitHub `main` to `f994b5f79ed3fbdc7c2bede9700d6a8f2030f454` to keep Builds 1–15 but remove the next-action guide.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 17 — Field reference reliability audit

Status: published August 26, 2026 as GitHub commit `da3d7b23bffbfb29e6eeb43e143e8276cbf210c1`.

#### Additions

1. Audited the complete static app structure.
   - All 41 internal hash links resolve to an existing destination.
   - All 13 app screens open correctly in the phone router.
   - Every text field has an associated label.
   - Every outgoing company form is addressed only to Kevin.

2. Refreshed manufacturer references.
   - Replaced the stale Trane eLibrary path with Trane’s current accessible factory serial-label guide.
   - Replaced the Bradford White lookup page with the factory’s dedicated date-code article.
   - Replaced the blocked direct Scout 3-Pro Plus PDF with the manufacturer’s current product/manual page.
   - Added the factory-reference review date to the Age Finder notes.

3. Updated the visible build, version file, and offline cache identifier to Build 54.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Internal routes: 41 links checked; no missing destination.
- Form recipients: nine online company forms checked; all point only to `kev@michiganpropertyinspections.com`.
- Field labels: no unlabeled text, date, select, or textarea control detected.
- Phone navigation: all 13 app screens opened at 390 by 844 pixels.
- Phone overflow: none detected on any app screen.
- Runtime errors: none during the 13-screen phone-navigation pass.
- Replacement Trane factory document: direct HTTP 200 response.

#### Rollback for this build

- Restore GitHub `main` to `380271577756339489a4129bd52d86c2d753c46f` to keep Builds 1–16 but restore the previous reference links.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 18 — Next MPI refresher

Status: published August 26, 2026 as GitHub commit `113f424e3d11403bbacdf0c6f2cab5d36f6ab35e`.

#### Additions

1. Added one focused **Next MPI refresher** card to Training Center.
   - It finds the first incomplete MPI lesson on the company phone.
   - The card displays the lesson title and subject.
   - One tap opens the correct lesson and closes the other lesson panels.

2. Connected the recommendation to saved training progress.
   - Completing a correct knowledge check immediately advances the card to the next incomplete lesson.
   - Existing progress remains on the phone and works offline.
   - When all 10 lessons are complete, the card confirms completion and removes its action button.

3. Kept authority boundaries unchanged.
   - The card guides company refresher order only.
   - It does not issue a credential, approve an InterNACHI badge, replace supervised competency sign-off, or authorize new work.
   - Updated the visible build, version file, and offline cache identifier to Build 55.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Empty-progress test: selected **Before/After photo records** as the first lesson.
- One-complete test: advanced to **Cooling temperature differential**.
- Open action test: expanded the exact recommended lesson.
- All-complete test: displayed **All MPI refresher lessons complete** and hid the action button.
- 390-pixel phone layout: no horizontal overflow.
- No new email, network request, credential claim, or management approval was added.

#### Rollback for this build

- Restore GitHub `main` to `9214edb02bce3e4e76897b367ba479464ebe54f3` to keep Builds 1–17 but remove the next-refresher card.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 19 — Unsent field-form draft protection

Status: published August 26, 2026 as GitHub commit `2ade1aa3cea5bc2aab76994f67bc31aeca83c561`.

#### Additions

1. Added device-only draft protection to the four field forms most likely to contain unsent notes.
   - Damaged Item Notice.
   - Ask Management.
   - Safety & Near-Miss Notice.
   - Requests & Feedback.

2. Protected field work without saving photographs.
   - Typed text, selected options, checkboxes, dates, inspector, and property information restore after reload or reopening the app.
   - Photo selections are never stored by the app and must be selected again after a reload.
   - A clear restored-draft message appears when saved information is recovered.

3. Added safe cleanup.
   - Each draft clears only after the matching FormSubmit success return is received.
   - FormSubmit control fields, honeypots, hidden values, buttons, and file controls are excluded.
   - Drafts remain only in that browser on the company phone; no background email or network transfer occurs.
   - Updated the visible build, version file, and offline cache identifier to Build 56.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Damage draft: 13 user fields and selections restored after reload; both photo inputs remained empty.
- Multi-selection test: informed-party choices and the conditional Other person field restored correctly.
- Ask Management, Safety Notice, and Request drafts restored correctly after reload.
- Successful-return simulations cleared each matching draft and displayed the existing success state.
- 390-pixel phone layout: no horizontal overflow.
- Live offline regression: Build 55 reopened from its service-worker cache with the connection disabled, the requested Field Procedures screen remained open, and all 26 procedure prompts were present with no runtime error.

#### Rollback for this build

- Restore GitHub `main` to `bcd4d418bff11bd1a7b598e2b6229fe9652e6377` to keep Builds 1–18 but remove device-only draft protection.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 20 — Offline HVAC temperature-difference calculator

Status: published August 26, 2026 as GitHub commit `2cab17486ab20e28a11b21f2e9023e01e41f5200`.

#### Additions

1. Added a collapsed temperature-difference calculator at the top of Field Procedures.
   - Cooling mode calculates return air minus supply air.
   - Heating mode calculates supply air minus return air.
   - Decimal Fahrenheit readings are accepted and the result is rounded to one decimal place.
   - A copy button copies only the mode, actual readings, and calculated difference.

2. Added MPI-specific interpretation boundaries.
   - Cooling results between 14°F and 22°F are identified only as falling within MPI’s usual field-screen range under typical conditions.
   - Cooling results outside that range prompt the inspector to record readings, conditions, and run time and recommend qualified HVAC evaluation without diagnosing refrigerant charge or capacity.
   - Heating results direct the inspector to compare actual rise with the manufacturer’s nameplate range; no generic heating pass/fail range is applied.
   - Reversed readings prompt verification of mode, locations, run time, and thermometer operation.

3. Kept the calculator offline and non-diagnostic.
   - No result is emailed or stored.
   - The existing SOP procedure and company training continue to control the test.
   - Updated the visible build, version file, and offline cache identifier to Build 57.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Cooling typical-range test: 74.0°F return and 56.0°F supply produced 18.0°F and the qualified field-screen wording.
- Cooling outside-range test: 74.0°F return and 65.0°F supply produced 9.0°F and the evaluation/no-diagnosis wording.
- Heating test: 70.0°F return and 120.0°F supply produced 50.0°F and nameplate-comparison wording.
- Reversed-reading test: 70.0°F return and 75.0°F supply produced a verification prompt.
- Copied output contained the mode, both readings, and calculated result without adding a diagnosis.
- 390-pixel phone layout: no horizontal overflow; Calculate remained 46 pixels high.

#### Rollback for this build

- Restore GitHub `main` to `b19f9e7604027f34d5c08bf4720f24ecc057caa9` to keep Builds 1–19 but remove the temperature calculator.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 21 — Room photo coverage tracker

Status: published August 26, 2026 as GitHub commit `4ed70ce6e4b18fd1e459b5ea786f25cab3897398`.

#### Additions

1. Added an optional, collapsed **Room photo coverage** tracker inside Job Companion.
   - Inspectors add only the rooms and areas that actually exist at the property.
   - Quick-add buttons cover common rooms; repeated room types automatically become Bedroom 2, Bathroom 2, and so on.
   - Custom room names support areas such as Office, Sunroom, or Workshop.

2. Added a job-specific completion record on the company phone.
   - Each room is checked only after its four required landscape overview photographs are present.
   - The live count changes from incomplete to complete and survives a reload with the active job.
   - Starting a different job begins a clean room list, while updating the same job preserves its list.

3. Kept the safeguard simple and within policy.
   - The tracker is optional and does not block report release.
   - It expressly states that doorway, panoramic, thermal, and defect images do not replace the four required overview images.
   - No room data is emailed or uploaded; it remains with the active job on that phone and works offline.
   - Updated the visible build, version file, and offline cache identifier to Build 58.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- No-job state displayed **Start job** and prevented room entry.
- Repeated-preset test produced Bedroom and Bedroom 2; Kitchen and a custom Office were also added correctly.
- Completion persisted after reload, changed from **1 of 4** to **4 of 4**, and displayed the completed state.
- Removing a completed room updated the count to **3 of 3**.
- 390-pixel phone layout: no horizontal overflow; the Remove control remained 44 pixels high.
- No email, network submission, location collection, or background activity was added.

#### Rollback for this build

- Restore GitHub `main` to `b0e6dc56f9def791eb51bd4f1c0bc4362e79cc86` to keep Builds 1–20 but remove the room photo coverage tracker.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 22 — Device-only equipment readiness tracker

Status: published August 26, 2026 as GitHub commit `e2f4c33213bcb7ec4f884c12f85a049d71b8b02c`.

#### Additions

1. Added a collapsed **Equipment readiness** panel to Company Tool Guides.
   - Records a tool and identifying number, its next required check or service date, current Ready/Hold state, and a concise check, restriction, or storage note.
   - Supports updating and removing each item without creating duplicate records.
   - Keeps the list on the company phone and works offline.

2. Added clear exception-first status.
   - Held and overdue equipment sorts to the top and is counted as needing attention.
   - Checks due within 30 days receive a distinct due-soon label.
   - Future-dated and non-scheduled ready equipment remains visually quiet.

3. Preserved equipment-control boundaries.
   - The inspector must enter dates from the current manufacturer instruction or MPI schedule; the app does not invent service or calibration intervals.
   - The list does not replace a calibration certificate, ladder inspection, manufacturer instruction, asset record, or management hold.
   - No normal readiness item is emailed; the existing Requests & Feedback form remains the route for an equipment problem.
   - Updated the visible build, version file, and offline cache identifier to Build 59.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Status test correctly sorted and labeled an overdue meter, held camera, due-soon item, and ready item.
- The initial status counted **2 need attention**; updating the overdue date changed it to **1 need attention**.
- All items and their details persisted after reload.
- Removing one item updated the rendered list from four to three.
- 390-pixel phone layout: no horizontal overflow; Update and Remove controls remained 44 pixels high.
- No email, network submission, location collection, or background monitoring was added.

#### Rollback for this build

- Restore GitHub `main` to `655949a11ea61a710ec8716e1bd0580fbf64548d` to keep Builds 1–21 but remove the equipment readiness tracker.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 23 — Offline home tool and procedure search

Status: published August 26, 2026 as GitHub commit `3782b2efbdddb42714e213a4566ff9d765644acc`.

#### Additions

1. Added one **Find a field tool or procedure** search at the top of the home screen.
   - Searches all principal app screens, all 26 MPI field prompts, and all 21 company tool cards.
   - Understands practical terms such as water pressure, moisture meter, damage, calendar, safety, training, and equipment age.
   - Returns no more than eight focused matches and remains hidden when unused so the home screen stays uncluttered.

2. Added exact destination routing.
   - A procedure result opens Field Procedures with the correct prompt already selected.
   - A tool result opens Company Tool Guides with the correct operating card already selected.
   - A screen result opens the selected MPI tool directly.
   - Enter opens the best match and Escape clears the search.

3. Kept search private and offline.
   - Search terms are not stored, submitted, or emailed.
   - All results come from the app’s existing embedded MPI content and remain available without cell service after installation.
   - Updated the visible build, version file, and offline cache identifier to Build 60.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- **Water pressure** opened the exact Water pressure and functional flow prompt.
- **Moisture meter** opened the exact company tool card.
- **Damage** opened Damaged Item Notice; keyboard Enter selected the best match.
- A nonsense search displayed a clear no-match state without routing elsewhere.
- 390-pixel phone layout: no horizontal overflow; the search field remained 52 pixels high.
- No email, network submission, location collection, or search logging was added.

#### Rollback for this build

- Restore GitHub `main` to `9dfaa2418e8965c52d5880cdda5aae470946b5c9` to keep Builds 1–22 but remove the home search.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 24 — Company phone setup check

Status: published August 26, 2026 as GitHub commit `3b785e496cb2eb59ccc8bc0e0ce31a585f0e56c9`.

#### Additions

1. Added a collapsed **Company phone setup** check to Training Center.
   - Detects whether MPI Field Tools is running from the Home Screen, the current app is controlled by its offline service worker, MPI notification permission and the phone’s push token are present, and an inspector name is saved.
   - Provides direct links to save the inspector name, verify Today’s Jobs, and set up MPI notifications.

2. Added two clear account confirmations.
   - The inspector confirms that Today’s Jobs opened with the correct MPI company Google account and showed the assigned jobs.
   - The inspector confirms that the MPI training profile and InterNACHI account opened under their own credentials.
   - The confirmations stay on that company phone and persist after reload.

3. Kept the rollout check quiet and private.
   - The card remains collapsed unless opened.
   - A complete phone shows **Phone ready**; an incomplete phone displays the exact completed count out of six.
   - No setup report, account information, push token, or checklist state is emailed.
   - Updated the visible build, version file, and offline cache identifier to Build 61.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Complete-phone simulation detected Home Screen mode, active offline control, granted notification permission with a saved push token, and the saved inspector name.
- Both manual account confirmations produced **Phone ready**.
- Removing the training-account confirmation changed the result to **5 of 6** and persisted after reload.
- 390-pixel phone layout: no horizontal overflow; all setup actions remained at least 44 pixels high.
- No email, background monitoring, location collection, password handling, or external account data storage was added.

#### Rollback for this build

- Restore GitHub `main` to `b9b1248b08e620021085ca53199f8555d0500f86` to keep Builds 1–23 but remove the company phone setup check.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 25 — Home equipment exception banner and master-list audit

Status: published August 26, 2026 as GitHub commit `3a50c6aefb348ebca6f17224abde755b49daf4b4`.

#### Additions

1. Added one exception-only equipment banner to the home screen.
   - The banner appears only when the phone’s Equipment readiness list contains an item held out of service or past its entered required date.
   - It shows the total needing attention and separates the held and overdue counts.
   - One tap opens Company Tool Guides and the Equipment readiness panel.

2. Kept normal operation visually quiet.
   - No banner appears for an empty list, normal ready equipment, or an item that is merely due soon.
   - Correcting or removing the final exception removes the home banner automatically.
   - No email or management alert is created by a normal readiness-list change.

3. Completed a source-workbook coverage audit.
   - Compared the app against `Michigan_Property_Inspections_Inspector_Tool_Master_List.xlsx`.
   - All 21 master-list tools have a matching operating card in the app; the separate first-use commissioning card brings the app total to 22.
   - Every card contains a category, exact tool/model identity, aliases, purpose, field sequence, required record, care/return steps, stop conditions, and a link collection.
   - No duplicate cards were added during the audit.
   - Updated the visible build, version file, and offline cache identifier to Build 62.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Empty and due-soon readiness lists kept the home banner hidden.
- A held camera and overdue meter produced **2 equipment items need attention**, **1 held out of service · 1 overdue**.
- The banner opened Company Tool Guides correctly.
- 390-pixel phone layout: no horizontal overflow; Review equipment remained 44 pixels high.
- Workbook comparison: 21 of 21 master-list items matched; all 22 app cards contained every required content block.
- No email, network submission, location collection, or background monitoring was added.

#### Rollback for this build

- Restore GitHub `main` to `492a6995dd573f85d1e6a3a3a2ce1c525926b39a` to keep Builds 1–24 but remove the home equipment exception banner.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 26 — One-tap water COC package copy

Status: published August 26, 2026 as GitHub commit `5a24e5e9cfc0ef4d4598be665534412b864e4bf7`.

#### Additions

1. Added a **Copy COC list** control to every package in the existing Water test parameters / COC guide.
   - Copies the exact visible MPI package name followed by only that package’s listed parameters.
   - Covers Basic Water Test, FHA/VA Water Test, Essential Water Test, and Complete Water Test.
   - Keeps the package cards and their existing visual hierarchy unchanged until the inspector chooses to copy.

2. Kept the helper factual and offline.
   - It does not add a contaminant, interpret a result, choose a package, complete a chain-of-custody form, or submit information.
   - The inspector still confirms the contracted package, current laboratory form, sample identifiers, preservation, times, and signatures.
   - Updated the visible build, version file, and offline cache identifier to Build 63.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- Water-test search opened the exact Water test parameters / COC guide.
- All four package cards displayed a copy control.
- The Basic Water Test copied exactly **Basic Water Test: Coliform, Nitrate, Arsenic**, matching its three visible parameter chips.
- The successful-copy confirmation appeared.
- 390-pixel phone layout: no horizontal overflow; every Copy COC list control remained 44 pixels high.
- No email, network submission, data storage, location collection, or laboratory interpretation was added.

#### Rollback for this build

- Restore GitHub `main` to `bb2b6f935ae4b48afa6762ff55f3c74ae04ee9e2` to keep Builds 1–25 but remove the water-package copy controls.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 27 — Active-job factual readings notebook

Status: published August 26, 2026 as GitHub commit `91e9a5d2713eab8f7102a4a475dc9eb61a3f348f`.

#### Additions

1. Added a collapsed **Field readings notebook** inside Job Companion.
   - Records the reading type, exact location/component, exact value with unit, and optional conditions or instrument note.
   - Supports water pressure, temperature, temperature difference, carbon monoxide, moisture, electrical, and other factual field measurements.
   - Allows an entry to be updated or removed before it is copied.

2. Connected readings to the active property.
   - Entries persist with the active job on that phone through reloads.
   - Updating the same property preserves its readings; starting a different property begins a clean notebook.
   - Clearing the finished active job removes its reading scratchpad from the phone.

3. Added factual report transfer without interpretation.
   - One button copies the property and all current readings in a clean line-by-line format.
   - The app does not decide whether a reading passes or fails, diagnose a system, recommend a repair, or replace the applicable MPI procedure and report item.
   - No reading is emailed or uploaded.
   - Updated the visible build, version file, and offline cache identifier to Build 64.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- No-job state displayed **Start job** and linked entries to a newly started property.
- Two readings persisted after reload; editing changed a CO entry from 0 ppm to 1 ppm.
- Copied output exactly preserved the property, type, location, reading/unit, and entered conditions without adding interpretation.
- Removing one entry changed **2 readings** to **1 reading**; starting a new property changed the card to **No readings**.
- 390-pixel phone layout: no horizontal overflow; Update, Remove, and Copy controls remained 44 pixels high.
- No email, network submission, background monitoring, or diagnostic logic was added.

#### Rollback for this build

- Restore GitHub `main` to `3d50856e88654110ccb41cf5f560f0417ec0a0dc` to keep Builds 1–26 but remove the field readings notebook.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 28 — Copyable active-job status handoff

Status: published August 26, 2026 as GitHub commit `e0ec4474c4edc2ea71ed930405d18f6094f37c80`.

#### Additions

1. Added **Copy job status** to the Current Job card.
   - Copies the inspector, property, start time, closeout-step count, next incomplete action, room-photo coverage, saved-reading count, and report-release count.
   - Uses the actual active-job records already stored on the phone.

2. Added a factual handoff boundary.
   - The app creates text only after the inspector deliberately taps Copy job status.
   - The text can be pasted into Team Messages or another authorized company channel when a handoff or management question is needed.
   - With no active job, the button refuses to create an empty or misleading summary.

3. Kept the status private and offline.
   - Nothing is emailed, uploaded, or shared automatically.
   - The copied summary contains no location tracking, diagnosis, report conclusion, or invented completion claim.
   - Updated the visible build, version file, and offline cache identifier to Build 65.

#### Validation record

- Inline JavaScript syntax: passed.
- Duplicate HTML IDs: none detected.
- No-job test displayed **Start the current job first** and produced no status.
- A partial-job test copied **2 of 12** closeout steps, the exact next incomplete equipment-readiness step, **1 of 2 rooms confirmed**, one saved reading, and **1 of 6** release checks.
- Date/time formatting used the phone’s local time.
- 390-pixel phone layout: no horizontal overflow; Copy job status remained 44 pixels high and the three Current Job actions stacked on the phone.
- No email, network submission, background monitoring, or automatic sharing was added.

#### Rollback for this build

- Restore GitHub `main` to `983c30454b373add8d849ad256f56f491edcd5c7` to keep Builds 1–27 but remove the job-status copy action.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 29 — Trane historical age-finder reliability

Status: published August 26, 2026 as GitHub commit `9c75647fce45dde88ae0ad1218a8ca15d15f98ea`.

#### Additions

1. Rechecked the Trane/American Standard decoder against the current Trane Residential and Light Commercial Product Handbook.
   - Retained the factory year table used by nine-character Trane serials from 1980 through the 2004 transition, including **L = 1996**.
   - Retained the ten-character YYWW format used from the 2004 transition onward.
   - Added the factory-documented three-character date block used on certain Trane accessories and coils.

2. Added clearer field guidance.
   - The dropdown now identifies the Trane choice as based on the factory 1980+ table.
   - The format helper gives a full 1996 example, a short accessory/coil example, and a modern example.
   - Short accessory/coil results display **Check the era** and explicitly warn the inspector not to apply the short code to a main unit.
   - A printed manufacture date takes priority over a serial inference.

3. Added a safe unsupported-format route.
   - A Trane serial that does not match a documented pattern is not guessed.
   - The no-match result provides a direct link to Trane’s official warranty lookup for verification.
   - Replaced the prior label-location reference with the current factory product-handbook equipment-date table.
   - Updated the visible build, version file, and offline cache identifier to Build 66.

#### Validation record

- Trane `L264A1B2C` decoded as production week 26 of **1996**.
- Trane accessory/coil block `L26` decoded as production week 26 of **1996** with the short-code caution.
- Trane `11241KADBB` decoded as production week 24 of **2011**.
- Invalid `MODEL123` produced **No reliable match**, displayed all three expected patterns, and offered **Verify with Trane**.
- 390-pixel phone layout: no horizontal overflow.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.
- Technical source: Trane Technologies, *2026 Residential & Light Commercial Product Handbook*, equipment-date identification table.

#### Rollback for this build

- Restore GitHub `main` to `88973b393e9cb569db9abca5d6fc1d83b0094a9d` to keep Builds 1–28 but remove the Trane age-finder changes.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 30 — HTP and Ariston factory age formats

Status: published August 26, 2026 as GitHub commit `9e9f87f8cfa3083a7c9ad5df02ef575238e70653`.

#### Additions

1. Added **HTP / Ariston** as the twenty-first manufacturer/equipment choice in the Age Finder.
   - HTP letter-month/day/letter-year serials used from 1994 through 2011.
   - HTP MMDDYY serials used from 2011 through September 2021.
   - The current 21-character HTP/Ariston year-plus-calendar-day format used since September 2021, including the Hybrid Heat Pump Water Heater layout.
   - The current shorter Ariston month-letter/year format used on non-hybrid products.

2. Kept the decoder date-safe.
   - Calendar dates and day-of-year values are validated before a result is shown.
   - Future dates and malformed formats are refused.
   - The result highlights only the characters that carry the date and states the exact factory format that matched.
   - Added the HTP/Ariston manufacturer serial guide to the in-app source list.
   - Updated the visible build, version file, and offline cache identifier to Build 67.

#### Validation record

- HTP `I22M28666` decoded as **September 22, 2006**.
- HTP `112116E2054485` decoded as **November 21, 2016**.
- Current 21-character `3251200U4220450000188` decoded as calendar day 45, **February 14, 2022**.
- Ariston `J21-6869` decoded as **September 2021**.
- An invalid serial produced **No reliable match** and no guessed date.
- All **21** built-in manufacturer examples decoded successfully.
- 390-pixel phone layout: no horizontal overflow.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.
- Technical source: HTP / Ariston, *Understand Serial Numbers*, factory guide revised February 2024.

#### Rollback for this build

- Restore GitHub `main` to `df336fc8e2c842893da46e65a58305bd1b65443e` to keep Builds 1–29 but remove the HTP/Ariston expansion.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 31 — Complete copied equipment-age note

Status: published August 26, 2026 as GitHub commit `769af264eb091814af0eb71da22eb7b1e3a153c7`.

#### Additions

1. Changed **Copy result** to **Copy age result**.
   - The copied text now clearly labels the equipment family, exact entered serial, manufacture result, and the visible approximate age or valid-match count.
   - The date-code explanation remains included so the inspector can see why the result was produced.
   - Updated the visible build, version file, and offline cache identifier to Build 68.

#### Validation record

- The 1996 Trane test copied: equipment, serial, June 1996 / production week 26, the exact L/year explanation, and **Approx. equipment age: 30 yr 2 mo**.
- Clipboard operation completed successfully.
- 390-pixel phone layout: no horizontal overflow.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `34cc94a3642a381c32dfa6e9bd7d7a973c9a86da` to keep Builds 1–30 but remove the expanded copied result.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 32 — Special-service packing check

Status: published August 26, 2026 as GitHub commit `d7265810891421e49d27624677d960f1737d61f1` (app Build 69).

#### Additions

1. Added a collapsed **Special-service pack check** inside Company Tool Guides.
   - The inspector chooses Standard home inspection, Sewer scope, Mold / IAQ sampling, Well / septic / water service, Drone roof inspection, or Crawlspace robot inspection.
   - The result shows only the high-use or extra equipment, consumables, records, and setup checks that apply to that selection.
   - Every listed company tool has a direct **Open guide** action that opens its exact instruction card.

2. Kept packing separate from authorization.
   - Every specialist pack states that the contracted scope, current inspector authorization, approved field procedure, and applicable external requirements must be confirmed separately.
   - The check does not record completion, authorize a service, make a report conclusion, or email management.
   - Updated the visible build, version file, and offline cache identifier to Build 69.

#### Validation record

- All six choices rendered the intended number of equipment links: Standard 4, Sewer 3, Mold 3, Well/septic/water 4, Drone 1, Crawlspace robot 3.
- The Sewer scope pack’s **Open guide** action opened the exact Sewer scope company card.
- 390-pixel phone layout: no horizontal overflow.
- Every new action was at least 42 pixels high.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `1d7aaa7118eb3d3ea3a7e058f1c3f810d0364850` to keep Builds 1–31 but remove the special-service packing check.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 33 — Checkable special-service packs

Status: published August 26, 2026 as GitHub commit `a5c06fb14ba82e911d602888284d0ac0aba6c76c` (app Build 70).

#### Additions

1. Turned every service pack into a real, temporary check-off aid.
   - Each listed company tool now has its own checkbox while retaining the direct link to the exact instruction card.
   - A final checkbox confirms applicable forms, consumables, PPE, power, storage, and assignment details.
   - The panel shows live progress and changes to **Pack checked** only when every displayed check is complete.

2. Kept the completion state deliberately narrow.
   - Changing the selected service resets its checks, which prevents a prior service from appearing complete.
   - The check does not state that the full vehicle inventory is complete or that the inspector is authorized to perform the service.
   - Updated the visible build, version file, and offline cache identifier to Build 70.

#### Validation record

- Standard, Sewer, Mold/IAQ, Well/septic/water, Drone, and Crawlspace-robot packs each started at 0 and changed to **Pack checked** only after all displayed checks were selected.
- Check totals were 5, 4, 4, 5, 2, and 4 respectively, including the final supporting-items confirmation.
- The direct Sewer scope link still opened the exact company tool card.
- 390-pixel phone layout: no horizontal overflow; every new button or confirmation target was at least 42 pixels high.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.

#### Whole-app workflow checkpoint

- All 13 principal screens opened on a 390-pixel phone with no horizontal overflow.
- A simulated current job populated the field forms and produced the correct Apple Maps address.
- Room-photo progress, one factual reading, four closeout steps, and two release checks survived a reload.
- Copied job status exactly reported 4 of 12 closeout steps, 1 of 2 rooms, one reading, and 2 of 6 release checks.
- No email form was submitted during this test.

#### Rollback for this build

- Restore GitHub `main` to `524cbeb57cef17a1f2f80478fa0f1c6c6da3a6a6` to keep Builds 1–32 but return the service packs to read-only lists.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 34 — Job-linked service packs

Status: published August 26, 2026 as GitHub commit `ef2192db0c6591ea7c9aeff1e0de2221cdda7eb3` (app Build 71).

#### Additions

1. Added a collapsed **Additional service packs** control to Current Job.
   - The inspector can mark Sewer scope, Mold / IAQ sampling, Well/septic/water service, Drone roof inspection, and Crawlspace robot when that specialist equipment is booked for the active property.
   - The selections stay with that property on the company phone and reset with a new or cleared job.
   - A selection cannot be saved before the inspector starts the current job.

2. Connected job scope to the exact field aid.
   - Every selected service produces a direct button that opens its corresponding special-service packing checklist.
   - The copied job-status handoff now lists the selected additional service packs.
   - The visible note clarifies that this records equipment planning only and does not authorize the ancillary service.
   - Updated the visible build, version file, and offline cache identifier to Build 71.

#### Validation record

- Attempting to select a service without an active job immediately cleared the selection and displayed **Start job**.
- Sewer scope and Mold / IAQ sampling both saved to one test property and survived a full page reload.
- The job-status clipboard output listed both service packs exactly.
- **Open Sewer scope pack** navigated to Company Tool Guides, opened the pack panel, selected Sewer scope, and rendered the correct pack title.
- 390-pixel phone layout: no horizontal overflow.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `5f915992f5e9e572433ab49146b19667144d666a` to keep Builds 1–33 but remove job-linked service packs.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 35 — End-of-day field reset

Status: published August 26, 2026 as GitHub commit `029b2d4cae12f288a6f7b757038d9c154ef5aeb4` (app Build 72).

#### Additions

1. Added a collapsed **End-of-day reset** to Job Companion.
   - The short closeout covers report/photo synchronization, samples and chain-of-custody handling, charging, tool and ladder security, equipment holds, vehicle restocking, tomorrow’s schedule, and required notices.
   - A normal confirmation records the local date and time on the company phone and stays quiet.
   - The panel resets automatically on a later date.

2. Added safe exception handling.
   - **Something needs attention** opens the existing management-request form and pre-fills an end-of-day operational issue.
   - If the current job still has incomplete closeout or report-release checks, the inspector receives a clear warning before the shift reset can be recorded.
   - Dismissing that warning records nothing.
   - Updated the visible build, version file, and offline cache identifier to Build 72.

#### Validation record

- The initial state displayed **Not completed today**.
- A normal completion stored the local date/time and displayed the same completion time after a full page reload.
- The issue action opened Requests & Feedback and pre-filled **Scheduling or operational support**, **End-of-day reset issue**, and a factual prompt.
- An incomplete active job produced the warning; dismissing it left no reset record.
- 390-pixel phone layout: no horizontal overflow.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.
- No email or management notification was sent during testing.

#### Rollback for this build

- Restore GitHub `main` to `e9511cc459a82492ccb3399010eb9aa1ca1f11d5` to keep Builds 1–34 but remove the end-of-day reset.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 36 — High-risk and specialist refresher lessons

Status: published August 26, 2026 as GitHub commit `4670f78e50cc1ee3f0c957c03c745d2c127878f2` (app Build 73).

#### Additions

1. Expanded the Training Center from 10 to 16 short MPI refresher lessons.
   - **Electrical panel cover boundary** covers authorization, the pre-touch hazard assessment, no-remove conditions, control of the cover/fasteners, and restored-condition evidence.
   - **Ambient CO screening and response** covers instrument readiness, background and trend readings, emergency priority, exact records, and the non-diagnostic boundary.
   - **Roof and ladder access decision** covers ladder inspection/setup, roof conditions, alternative inspection methods, and specific limitation records.
   - **Water sampling and chain of custody** covers the ordered package, correct bottles and parameters, clean collection, sample identity, custody, temperature, and holding time.
   - **Sewer scope operating boundary** covers authorized access, equipment readiness, controlled cable advance, stop conditions, contamination control, and restoration.
   - **Mold / IAQ sampling control** covers the approved sampling plan, media identity, pump readiness, required flow/time, immediate labeling, custody, and deviations.

2. Preserved the training boundary.
   - Each lesson is an offline company refresher with one knowledge check.
   - Completion stays on the inspector’s phone and does not create an InterNACHI credential, service authorization, or competency sign-off.
   - Updated the visible build, version file, and offline cache identifier to Build 73.

#### Validation record

- All 16 training modules were detected by the progress system.
- An incorrect panel-cover answer did not complete the lesson.
- Correct completion of all six new lessons produced **6 of 16 complete**, changed each button to **Completed ✓**, and saved all six exact module IDs.
- The 6-of-16 progress and completed states remained correct after a full reload.
- 390-pixel phone layout: no horizontal overflow.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `9a95c37e96abf9418bceaf405a3e9a1b86b213ff` to keep Builds 1–35 but return the Training Center to 10 refresher lessons.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 37 — Inspector-visible update note and structural hardening

Status: published August 26, 2026 as GitHub commit `7949971e8b8947371bca10560a1c2c6ace48d9cd` (app Build 74).

#### Additions

1. Added an offline Company Messages card for the current rollout.
   - It tells inspectors where to find the job-linked service packs, focused packing checks, end-of-day reset, and six new training refreshers.
   - The notice is informational and does not create another required acknowledgement or email.

2. Made every Age Finder manufacturer/source link explicitly use both opener and referrer protection when it opens a new tab.
   - The same protection now applies to dynamically generated manufacturer verification links.
   - Updated the visible build, version file, and offline cache identifier to Build 74.

#### Full structural validation record

- All 13 principal screens had valid named destinations.
- Broken internal hash links: none.
- Duplicate HTML IDs: none.
- Missing label targets or `aria-labelledby` targets: none.
- Visible form controls without an accessible name: none.
- Unnamed buttons or links: none.
- New-tab links missing explicit opener protection: none.
- All nine online forms use POST and point only to `kev@michiganpropertyinspections.com` through the existing form service.
- All six required offline/app-icon assets were present.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `bbf6d2dc0b9cb6ba76ff36a0e9edfbdc972ddd72` to keep Builds 1–36 but remove the update note and explicit link hardening.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 38 — Direct links for every company tool guide

Status: published August 26, 2026 as GitHub commit `6daa53bed72b71b31843b945c501e6d5722ee5a9` (app Build 75).

#### Additions

1. Added **Copy direct link to this guide** to every company tool instruction card.
   - A copied URL includes the stable company tool ID and opens the app directly to that exact card.
   - Kevin can use the link in an individual training assignment, a team message, an equipment record, or a future printed QR label on a tool or case.
   - This requires no new account, subscription, service, or exposed key.

2. Added safe link handling.
   - A recognized tool ID selects and displays only the intended guide.
   - An invalid or retired ID falls back to the normal Moisture meter starting card rather than breaking the Tool Guides screen.
   - Updated the Company Tool Guides release description and the visible build, version file, and offline cache identifier to Build 75.

#### Validation record

- `?tool=roof-drone#tool-guides` opened **Roof inspection drone — DJI Mini 4 Pro** as the single selected result.
- The copied URL reopened the exact same guide.
- An invalid tool ID fell back safely to **Moisture meter**.
- The copy action was increased to a 44-pixel phone target after the first test identified a 39-pixel control.
- 390-pixel phone layout: no horizontal overflow.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `3e8ae320c516dc9b98ef6e786de64775b1d3c970` to keep Builds 1–37 but remove direct tool-guide links.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 39 — Direct links for every field procedure

Status: published August 26, 2026 as GitHub commit `13d679b6fca4461cd5438eb53c89d0818b8fb43a` (app Build 76).

#### Additions

1. Added **Copy direct link to this procedure** to all 26 Field Procedures.
   - A copied URL opens the app directly to that exact step-by-step prompt.
   - Kevin can use the link to direct an individual inspector to a procedure from a training assignment, coaching note, company message, or field answer without asking the inspector to search.
   - The linked prompt remains part of the offline app after the normal first online visit.

2. Added safe procedure-link handling.
   - A recognized procedure ID selects and displays only the intended prompt.
   - An invalid or retired procedure ID falls back to the normal Cooling temperature differential starting prompt.
   - Updated the Field Procedures release description and the visible build, version file, and offline cache identifier to Build 76.

#### Validation record

- The Water Test Parameters / COC URL opened that exact prompt as the single selected result.
- The copied URL reopened the exact same prompt.
- The existing **Copy COC list** action still returned **Basic Water Test: Coliform, Nitrate, Arsenic**.
- An invalid procedure ID fell back to **Cooling temperature differential**, with all 26 prompts still available.
- The copy action measured 44 pixels high.
- 390-pixel phone layout: no horizontal overflow.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `ec73b771a12bf7e9603e808f17069dd642674a32` to keep Builds 1–38 but remove direct Field Procedure links.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 40 — Direct links for every MPI refresher lesson

Status: published August 26, 2026 as GitHub commit `78dfecef93394233e980be952be8de5da41a01d3` (app Build 77).

#### Additions

1. Added **Copy direct link to this lesson** to all 16 MPI Training Center refreshers.
   - A recognized link opens the app to Training Center with the exact requested lesson expanded.
   - Kevin can now direct an individual inspector to one precise MPI lesson in the same way as a company tool guide or field procedure.
   - Lesson progress still stays on that inspector’s phone and remains separate from InterNACHI-issued credentials.

2. Added safe lesson-link handling.
   - An invalid or retired lesson ID opens no module rather than showing unrelated training as if it were assigned.
   - Updated the Training Center description and the visible build, version file, and offline cache identifier to Build 77.

#### Validation record

- All 16 modules received the direct-link action.
- The Ambient CO lesson URL opened that exact module and the copied URL reopened it.
- The copied-link action measured 44 pixels high.
- Completing the linked lesson with its correct answer still worked.
- An invalid lesson ID left all modules closed.
- 390-pixel phone layout: no horizontal overflow.
- Duplicate HTML IDs: none detected.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `8d495cf590e4769e9bab055176d730790f101121` to keep Builds 1–39 but remove direct MPI lesson links.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Regression checkpoint — labeled photo email records

Status: passed August 26, 2026 against app Build 77. No email was sent during the test.

#### Validation record

- Re-ran the Damaged Item Notice with two real iPhone photographs through the complete submit-preparation path.
- Confirmed one generated `MPI-Before-After-Photo-Record.jpg` attachment at 1200 × 1900 pixels with permanent **PHOTO 1 — BEFORE** and **PHOTO 2 — AFTER** labels.
- Re-ran the Thermostat & Furnace Photo Record with four real iPhone photographs through the complete submit-preparation path.
- Confirmed one generated `MPI-Thermostat-Furnace-Photo-Record.jpg` attachment at 1200 × 3510 pixels with permanent labels for thermostat Before, thermostat After / Restored, furnace Before Opening, and furnace After Closing / System Restored.
- Confirmed both forms reached the intended final native-submit boundary while the test harness blocked the send.
- Confirmed zero outbound FormSubmit requests and therefore zero test emails.
- No application change was required; the existing Build 77 implementation passed.

### Regression checkpoint — Equipment Age Finder coverage

Status: passed August 26, 2026 against app Build 77.

#### Validation record

- Exercised the displayed example for every one of the 21 selectable equipment families; all 21 produced a decoded result with no browser errors.
- Confirmed the Trane / American Standard factory code `L264A1B2C` resolves to production week 26 of 1996.
- Exercised 16 additional historical or alternate layouts and confirmed every expected year, including:
  - Trane short accessory/coil and modern serials.
  - A. O. Smith and Rheem-family 1960 water-heater formats.
  - Pre-1996 Ducane oil-furnace layout.
  - Rinnai older numeric code.
  - Lochinvar tank, system, and specialty legacy layouts.
  - Navien NR/NP product-date block.
  - HTP/Ariston legacy, transition, and current layouts.
  - YORK commercial SAP layout.
- No application change was required; the current Build 77 date decoders passed all 37 field examples.

### Live regression checkpoint — direct guidance links and offline use

Status: passed August 26, 2026 on the published GitHub Pages Build 77.

#### Validation record

- Confirmed the live version file and visible app both report Build 77.
- Confirmed the installed-app service worker controls the published app.
- Confirmed the exact Roof inspection drone tool URL opens that one company tool card.
- Confirmed the exact Water Test Parameters / COC URL opens that one field procedure.
- Confirmed the exact Ambient CO screening URL opens that one MPI refresher lesson.
- Switched the browser fully offline and reloaded the linked lesson; the requested Training Center screen and lesson remained available with no script errors.
- No application change was required; the published Build 77 passed.

### Build 41 — Recover the last cleared job

Status: published August 26, 2026 as GitHub commit `036c4cf326f86dae28a6400252c85dec37220585` (app Build 78).

#### Additions

1. Added a one-job recovery safety net to Job Companion.
   - Clearing a finished job now retains one recoverable copy on that company phone.
   - **Restore last cleared job** appears only when there is no active job and a recovery copy exists, so normal job use is not made busier.
   - Restoring brings back the inspector, property, start time, specialist services, closeout steps, report-release checks, room-photo coverage, and factual field readings.
   - After a successful restore, the recovery copy is removed and the action hides again.

2. Strengthened the clear-job warning.
   - A completed job receives a concise finished-job confirmation.
   - A job with incomplete closeout or report-release checks receives an explicit warning before anything is cleared.
   - Updated the visible build, version file, and offline cache identifier to Build 78.

#### Validation record

- Started a job at `789 Recovery Street` and saved one closeout step, a Kitchen room record, and a 62 psi water-pressure reading.
- Cleared the incomplete job and confirmed the stronger warning appeared.
- Confirmed the active record was removed, one recovery copy was retained, and the restore action became visible.
- Restored the job and confirmed the property, inspector, start time, step, room, and reading all returned exactly.
- Confirmed the recovery copy then cleared, the restore action hid, and the 390-pixel phone layout had no horizontal overflow.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `3978bc4f6e5ba1a94f4d7905728457713da42f2b` to keep Builds 1–40 but remove cleared-job recovery.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 42 — Inspector-initiated MPI refresher progress snapshot

Status: published August 26, 2026 as GitHub commit `255474f1fc6fae19851569c5011465970bd122a1` (app Build 79).

#### Additions

1. Added **Share MPI refresher progress** to Training Center.
   - The control stays collapsed during normal training and sends nothing in the background.
   - When requested by management, the inspector can deliberately email one snapshot containing their name, timestamp, exact completion total, completed MPI lesson titles, and remaining MPI lesson titles.
   - The snapshot uses the existing no-cost form route and is addressed only to Kevin.
   - The app distinguishes this phone-local MPI refresher snapshot from the private training profile, InterNACHI credentials, competency approval, and ancillary-service authorization.

2. Added clear submission confirmation.
   - A successful redirect returns to Training Center, opens the progress card, and shows that the snapshot was sent.
   - Updated the visible build, version file, and offline cache identifier to Build 79.

#### Validation record

- Seeded two completed lessons: **Before/After photo records** and **Ambient CO screening and response**.
- Confirmed the generated progress was exactly **2 of 16 MPI refreshers complete**.
- Confirmed both completed titles appeared and all 14 other lesson titles appeared in the remaining list, without duplicating the completed lessons.
- Confirmed the email subject included the inspector and total, and the record included the local America/Detroit timestamp.
- Intercepted the submit in the browser and confirmed zero outbound test emails.
- 390-pixel phone layout: no horizontal overflow.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `b72695619366901186945585cbd127d6f5fd7b68` to keep Builds 1–41 but remove MPI refresher progress sharing.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 43 — Copy an Equipment Age Finder no-match handoff

Status: published August 26, 2026 as GitHub commit `8a84cd11ae70c2922329d5b74dca587f33a1b725` (app Build 80).

#### Additions

1. Added **Copy details for verification** whenever a serial has no reliable supported match.
   - The copied field handoff includes the selected equipment family, cleaned serial, explicit no-reliable-match status, the exact decoder reason, and the supported-format guidance shown in the app.
   - The handoff does not add a guessed year, month, or equipment age.
   - Inspectors can paste the details into a field question, office verification note, or manufacturer lookup without retyping the data plate.

2. Kept the normal matched-result workflow unchanged.
   - A supported serial still shows and copies the manufacture result and approximate age.
   - Updated the visible build, version file, and offline cache identifier to Build 80.

#### Validation record

- Entered an unsupported Trane serial and confirmed the no-match action appeared.
- Confirmed the copied text contained **Trane / American Standard**, cleaned serial `NOTATRANESERIAL`, **No reliable match**, the exact decoder reason, and all three supported Trane example layouts.
- Confirmed the phone action measured 44 pixels high.
- Entered `L264A1B2C` immediately afterward and confirmed it still decoded to week 26 of 1996 with the normal matched-result action.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `04ba76323471f8c71e447d0ce53a67f254e8bbd1` to keep Builds 1–42 but remove copied no-match handoffs.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 44 — Route an unresolved equipment age to management

Status: published August 26, 2026 as GitHub commit `5ba6b282d5f1a9823c98d0131b10a8ac6586aa87` (app Build 81).

#### Additions

1. Added **Ask management to verify** to Equipment Age Finder no-match results.
   - One tap opens the existing Team Messages field-question form.
   - The response timing is set to **Before the report is released**.
   - The question is prefilled with the equipment family, cleaned serial, no-match status, exact decoder reason, supported-format guidance, and a clear request to verify the manufacture date.
   - The inspector still reviews and deliberately submits the question; no email is sent automatically.

2. Preserved the unresolved-age question as an unsent draft.
   - The prefilled timing and question survive a reload or signal interruption on that company phone.
   - Updated the visible build, version file, and offline cache identifier to Build 81.

#### Validation record

- Entered unsupported Ducane serial `UNKNOWN-9988` and opened the management-verification action.
- Confirmed Team Messages opened with the exact equipment family and cleaned serial `UNKNOWN9988`.
- Confirmed **Before the report is released** was selected and the question field received focus.
- Confirmed the full prefilled question survived a reload through the existing draft-protection system.
- Confirmed no FormSubmit request or email occurred.
- The action measured 44 pixels high and the 390-pixel phone layout had no horizontal overflow.
- Browser script errors: none detected.

#### Rollback for this build

- Restore GitHub `main` to `34bcd68bf3111be84786bfddfe159e6636c48da3` to keep Builds 1–43 but remove one-tap unresolved-age escalation.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Hardening checkpoint — complete screen, link, and published-offline audit

Status: passed August 26, 2026 against app Build 81.

#### Validation record

- Audited all 13 app screens at a 390-pixel phone width.
- Confirmed all 16 forms are structurally valid and all 10 company-submission forms route only to `kev@michiganpropertyinspections.com`.
- Confirmed there are no duplicate IDs, broken internal destinations, unnamed visible controls, unsafe new-window links, horizontal overflow, or visible legacy **AI Comment Builder** wording.
- Tested all 64 shareable guidance destinations: 22 Company Tool Guides, 26 Field Procedures, and 16 MPI refresher lessons. Every direct URL reopened the exact requested item.
- Confirmed the published site reported Build 81 and was controlled by its service worker.
- After switching the browser fully offline, confirmed exact direct links still reopened the Roof inspection drone guide, Water test parameters / COC procedure, and Water sampling and chain of custody refresher.
- Browser script errors: none detected. Google’s own sign-in page may refuse to appear inside its embedded frame; the app retains the secure open-in-browser link for that case.

### Build 45 — Professional company submission language

Status: published August 26, 2026 as GitHub commit `75d1e67c2fe118a4d4e3ae7a833e65bea071a3a8` (app Build 82).

#### Additions

1. Standardized older inspector-facing submission wording.
   - Replaced informal references such as **email … to Kevin** with professional **submit to MPI management** language.
   - Updated the end-of-job tool check, tool commissioning, MPI refresher progress, new-inspector pathway, and company-message acknowledgement wording.
   - Kept the recipient, deliberate-submit boundary, online requirement, and no-background-send behavior unchanged.

2. Updated the visible build, version file, and offline cache identifier to Build 82.

#### Validation record

- Confirmed no visible direct-to-Kevin or email-to-Kevin phrasing remains.
- Re-ran the complete 13-screen structural audit at 390 pixels.
- Confirmed all 10 company-submission forms still route only to Kevin’s company address.
- Confirmed no broken routes, duplicate IDs, unsafe links, unnamed visible controls, legacy AI naming, or horizontal overflow.

#### Rollback for this build

- Restore GitHub `main` to `79f93855228d80c8fa6e8f84623c908bbc8fe22a` to keep Builds 1–44 but remove the submission-language cleanup.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 46 — Calm mobile section navigation

Status: published August 26, 2026 as GitHub commit `699040bf188030ef53cd068573435f3d1d349ac9` (app Build 83).

#### Additions

1. Simplified the secondary header on narrow phones.
   - Replaced the long mobile **Back to Field Tools** label with a familiar 44-pixel back arrow.
   - Centered the current section name and protected long names with clean truncation instead of allowing labels to collide.
   - Kept the full back label on larger screens.

2. Updated the visible build, version file, and offline cache identifier to Build 83.

#### Validation record

- Captured and visually reviewed the Home, Job Companion, Company Tool Guides, Field Procedures, and Training Center screens at 390 × 844 pixels.
- Confirmed Company Tool Guides and Training Center no longer crowd or join the back label and section title.
- Re-ran the complete 13-screen phone audit and confirmed no horizontal overflow, route failures, duplicate IDs, unnamed controls, unsafe links, non-Kevin submission recipients, or legacy AI naming.

#### Rollback for this build

- Restore GitHub `main` to `e48442aad9ef7334a5d7c325ad1bd02cfc2a4ad5` to keep Builds 1–45 but restore the earlier mobile secondary header.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Build 47 — Find MPI refresher lessons from Home

Status: published August 26, 2026 as GitHub commit `38a68aaf3c795dac0b9875d6db31944d14d7a0ec` (app Build 84).

#### Additions

1. Expanded the existing Home search without adding another card.
   - Home now searches all 16 MPI refresher lessons in addition to principal screens, 26 Field Procedures, and 22 Company Tool Guides.
   - Lesson results show the refresher title and focus, then open the exact module in Training Center.
   - Updated the search label, example, empty-state message, and accessibility description to include lessons.

2. Updated the visible build, version file, and offline cache identifier to Build 84.

#### Validation record

- Confirmed **photo records**, **chain custody**, **roof ladder**, and **panel cover boundary** each returned and opened the exact intended lesson.
- Confirmed existing **moisture meter** tool-guide and **water pressure** field-procedure searches still open the correct sections.
- Re-ran the complete 13-screen structural and phone-width audit with no failures.

#### Rollback for this build

- Restore GitHub `main` to `6d96358fd7f90469201f237d23544eb7afd17db8` to keep Builds 1–46 but remove lesson results from Home search.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Form regression checkpoint — all non-photo company submissions

Status: passed August 26, 2026 against app Build 84.

#### Validation record

- Exercised the complete valid-submit path for the End-of-Job Tool Check, tool commissioning, MPI refresher progress, new-inspector progress, required-message acknowledgement, field question, Safety / Near-Miss Notice, and Requests & Feedback forms.
- Confirmed all eight prepared a professional subject, local America/Detroit timestamp, and complete form payload.
- Confirmed every action remained a POST addressed only to `kev@michiganpropertyinspections.com`.
- Blocked the final browser submit boundary; zero test emails were sent.
- The two photograph forms remain covered by the separate real-image attachment regression checkpoint.

### Build 48 — Honor all-not-used tool closeouts

Status: published August 26, 2026 as GitHub commit `ccc579797a44c221725871c29e5fda2bf50e771b` (app Build 85).

#### Additions

1. Corrected the End-of-Job Tool Check edge case.
   - When both **Field / General** and **Specialist / Company** sections are truthfully marked **Not used on this job**, the inspector can now submit without falsely checking an individual tool.
   - When either section remains applicable, the form still requires at least one applicable checked tool and retains the existing section-level behavior.
   - Updated the validation message to explain both valid completion methods.

2. Changed the brief pending state from **Emailing** to the more professional **Submitting completed tool check**.

3. Updated the visible build, version file, and offline cache identifier to Build 85.

#### Validation record

- Submitted a zero-tool test record with both sections marked not used.
- Confirmed both section names were included, zero individual tools were claimed, the subject and Detroit timestamp were prepared, and the action remained a Kevin-only POST.
- Intercepted the submit boundary; no email was sent.
- Re-ran the complete 13-screen structural and phone-width audit with no failures.

#### Rollback for this build

- Restore GitHub `main` to `8bc160c7df0485b3afabe2981f2b2d20f1721072` to keep Builds 1–47 but restore the earlier tool-check rule.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.

### Training regression checkpoint — refresher and new-inspector progress

Status: passed August 26, 2026 against app Build 85.

#### Validation record

- Confirmed an incorrect answer does not complete an MPI refresher lesson.
- Completed all 16 refreshers with correct answers and confirmed **16 of 16 complete** before and after a reload.
- Confirmed all 16 completed markers persisted, the next-action card changed to the all-complete state, and the 390-pixel layout remained stable.
- Completed all 20 new-inspector pathway milestones and confirmed **20 of 20 complete** before and after reload.
- Confirmed the management review summary contained all 20 milestone titles, no remaining items, the correct subject, and local America/Detroit timestamp.
- Intercepted the review-summary submit boundary; no email was sent.

### Build 49 — Recover unfinished long-form work

Status: published August 26, 2026 as GitHub commit `98b91aba555a22de6aa4acf7cc129c8c08bae0d5` (app Build 86).

#### Additions

1. Added phone-local draft recovery to three longer inspector workflows.
   - End-of-Job Tool Check entries and selections now return after a reload.
   - New-tool commissioning fields, decisions, restrictions, and confirmation now return after a reload.
   - New-inspector review names, dates, and coaching focus now return after a reload; the 20 pathway milestones continue using their separate progress record.
   - Each draft is cleared after the app receives its successful-submission return marker.

2. Strengthened the new-tool management record.
   - The required inspector confirmation is now included as a named item in the submitted commissioning record.
   - Clarified that only an unfinished tool checklist is retained and that submitted checklists are not kept in the app.

3. Updated the visible build, version file, and offline cache identifier to Build 86.

#### Validation record

- Saved and reloaded a partial tool closeout with two accounted tools, one not-used section, the result, note, and inspector confirmation; every value returned exactly.
- Saved and reloaded a commissioning record with brand, model, asset number, assignment, decisions, release state, confirmation, and restriction; every value returned exactly.
- Saved and reloaded an onboarding review with inspector, reviewer, coaching focus, and next-review date; every value returned exactly.
- Confirmed all three draft keys clear after their respective simulated successful-submission return.
- Re-ran all eight non-photo submission paths and the complete 13-screen structural audit with no failures or outbound test emails.

#### Rollback for this build

- Restore GitHub `main` to `522ede58895371f8cb57ebdae9d58c89a4ca974d` to keep Builds 1–48 but remove the additional draft recovery.
- Restore GitHub `main` to `fallback/pre-six-hour-review-2026-08-26` to remove the entire six-hour improvement cycle.
