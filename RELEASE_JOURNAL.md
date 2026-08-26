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
