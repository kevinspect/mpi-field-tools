# MPI Field Tools — Product Roadmap

## Product rule

MPI Field Tools should feel like a calm field companion, not office software squeezed onto a phone. The inspector should usually make one decision per screen, see only the next useful action, and never have to re-enter information the app already knows.

## Build next with current or free systems

### Completed foundations in this improvement cycle

- Job Companion with reusable current-job details and staged closeout.
- Company Tool Guides for all 21 inventory tools plus first-use commissioning.
- Direct links between selected tool cards, controlled SOP prompts, support requests, and safety reporting.
- Safety & Near-Miss initial notice.
- 26 condensed field prompts traceable to the controlled MPI SOP.
- 10 short offline knowledge checks that reinforce the MPI field sequence and safety boundaries.
- A one-tap, phone-local start-of-day readiness check with exception-only support routing.
- A 60-second, active-job report release check for coverage, evidence, limitations, wording, communication, and synchronization.
- A five-route field escalation guide connected to existing safety, damage, management-question, tool-support, and procedure workflows.

### 1. Manager coaching and competency matrix

- Keep InterNACHI credentials separate from MPI competency.
- Let Kevin assign a field skill to an individual inspector: Observe, Supervised, or Independent.
- Add a due date, trainer, evidence note, and manager sign-off.
- Inspector sees only their plan; Kevin sees the team view.
- Use the existing secure Google Apps Script training profile rather than adding a paid platform.

### 2. Equipment readiness board

- Track high-risk equipment readiness: charged, function checked, calibration/service due, damaged, or removed from service.
- Show the inspector only their assigned equipment.
- Email Kevin only when an item needs attention or misses a due date, not after every normal check.
- **Build 41 now establishes the first-use commissioning process and routes tool problems to management; a central readiness board remains future work.**

### 3. Inspection quality coaching

- After report review, Kevin records no more than three coaching points: missed item, wording issue, or evidence issue.
- Inspector acknowledges the coaching and is directed to the matching SOP prompt or short lesson.
- Repeated patterns become a training assignment instead of a punitive score.
- **Build 45 adds the inspector’s pre-release quality check; manager coaching and pattern review remain future work.**

### 4. Incident and near-miss record

- Short form for injury, near miss, property concern, equipment failure, or unsafe access.
- Capture immediate action and who was informed.
- Keep it separate from the damaged-item notice so safety trends can be reviewed.
- **Initial email notice implemented in Build 40; a central trend dashboard remains future work.**

### 5. Daily readiness check

- A 30-second start-of-day screen for phone charge, meters, ladders, PPE, assignments, and weather.
- Only exceptions are sent to management.
- The normal state should take one tap, not a full checklist.
- **Implemented in Build 44 inside Job Companion; normal checks remain on the phone and issues open the existing management-request workflow.**

### 6. Company updates with acknowledgement

- Kevin publishes a short update to everyone or a selected inspector.
- Urgent policy updates require a simple “Read and understood” acknowledgement.
- Training assignments remain separate from general messages.
- **Initial required-message acknowledgement implemented in Build 52; targeted publishing and central management status remain future work.**

### 7. Smart links between the existing tools

- Tool guides link directly to the matching SOP test. **Initial links implemented in Build 39.**
- SOP stop conditions link to Damage Notice, Incident/Near Miss, or Team Question.
- Team Messages routes common field problems to the correct existing MPI workflow. **Implemented in Build 46.**
- The Age Finder now separates factory-documented Lochinvar product families and adds Navien NR/NP coverage. **Implemented in Build 47.**
- Company Tool Guides now includes a first-use commissioning record and explicit ready/hold decision for new or replacement equipment. **Implemented in Build 48.**
- Training Center now includes a 20-milestone new-inspector pathway with local progress and a deliberate email review to Kevin. **Implemented in Build 49.**
- The home screen now shows a one-tap resume/directions banner for the active Job Companion property. **Implemented in Build 50.**
- The app now shows its build number and provides a small, safe, inspector-controlled update checker. **Implemented in Build 51.**
- Job Companion identifies the single next incomplete field or report-release action and opens the relevant app screen or checklist stage. **Implemented in Build 53.** Showing only required forms by inspection type remains future work.
- Training coaching links to the exact lesson or InterNACHI course.

## Low-cost improvements

### 1. MPI Comment Builder

- Online only and used only when the template has no suitable comment.
- Use a small, locked server function so no API key is exposed in the app.
- Provide the report category, inspector’s exact observation, MPI writing rules, and approved examples.
- Set a hard monthly spending limit and log usage by inspector.
- Return a read-only title, Observation, Implication, and Recommendation.

### 2. Scheduled management digest

- One concise email to Kevin each evening containing only exceptions: damaged items, missing tools, overdue training, unanswered questions, and equipment removed from service.
- Avoid sending a separate notification for every normal action.

### 3. Spectora-assisted job handoff

- Prefer a supported Spectora API or calendar feed if available.
- Until then, keep the read-only company calendar connection and avoid fragile screen scraping.

## Later integrations

- Role-based sign-in and device enrollment for company phones.
- Central, auditable inspector activity and training records.
- Spectora job/report status connection.
- Automated quality-control checks against the report before release.
- Company analytics for repeat defects, missed components, report revision rates, training needs, equipment loss, and response time.

## Management dashboard design

Kevin’s view should lead with exceptions, not raw activity:

1. Needs attention today.
2. Inspector training due soon.
3. Equipment or tool problems.
4. Unanswered field questions.
5. Repeated quality-coaching topics.
6. Recognition and completed milestones.

## Privacy and employment-policy guardrails

- Do not collect continuous or background location.
- If arrival/departure location is ever added, require an obvious inspector action, a written company policy, a clear business purpose, limited retention, and access restricted to management.
- Keep employee training and coaching data behind company sign-in.
- Show inspectors what is recorded and how it is used.
- Do not mix safety reporting with performance discipline.
