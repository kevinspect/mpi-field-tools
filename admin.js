(function () {
  "use strict";

  const shared = window.MPI_SHARED;
  const authCard = document.getElementById("adminAuthCard");
  const dashboard = document.getElementById("adminDashboard");
  const signInButton = document.getElementById("adminSignIn");
  const signOutButton = document.getElementById("adminSignOut");
  const authStatus = document.getElementById("adminAuthStatus");
  const accountPill = document.getElementById("adminAccountPill");
  const accountName = document.getElementById("adminAccountName");
  const accountEmail = document.getElementById("adminAccountEmail");
  const accountInitial = document.getElementById("adminInitial");
  const form = document.getElementById("adminUpdateForm");
  const typeInput = document.getElementById("adminUpdateType");
  const priorityInput = document.getElementById("adminUpdatePriority");
  const audienceInput = document.getElementById("adminUpdateAudience");
  const targetField = document.getElementById("adminTargetField");
  const targetInput = document.getElementById("adminUpdateTarget");
  const titleInput = document.getElementById("adminUpdateTitle");
  const messageInput = document.getElementById("adminUpdateMessage");
  const linkInput = document.getElementById("adminUpdateLink");
  const dueInput = document.getElementById("adminUpdateDue");
  const ackInput = document.getElementById("adminUpdateAck");
  const publishButton = document.getElementById("adminPublishButton");
  const publishStatus = document.getElementById("adminPublishStatus");
  const updatesList = document.getElementById("adminUpdatesList");
  const peopleList = document.getElementById("adminPeopleList");
  const inspectorSelector = document.getElementById("adminInspectorSelector");
  const rangePicker = document.getElementById("adminRangePicker");
  const teamOverview = document.getElementById("adminTeamOverview");
  const inspectorDetail = document.getElementById("adminInspectorDetail");
  const operationsSync = document.getElementById("adminOperationsSync");
  const tabButtons = [...document.querySelectorAll("[data-admin-view]")];
  const panels = [...document.querySelectorAll("[data-admin-panel]")];
  const stats = {
    working: document.getElementById("statWorking"),
    jobs: document.getElementById("statJobs"),
    hours: document.getElementById("statHours"),
    alerts: document.getElementById("statAlerts")
  };
  const actionLabels = {
    "Morning readiness completed": "Morning Readiness Complete",
    "Inspector activity started": "Activity tracking started",
    "On My Way selected": "On My Way",
    "Directions selected": "Directions opened",
    Arrived: "Arrived at job",
    "Hours worked started": "Hours Worked started",
    "Inspection started": "Inspection started",
    "Job Complete selected": "Job completion selected",
    "Used tools back on truck confirmed": "Used tools back on truck",
    "Final job completion": "Job complete",
    "Lab selected": "Lab stop selected",
    "Arrived at lab": "Arrived at lab",
    "Lab visit completed": "Lab visit complete",
    "Lab route departure / continuation": "Departed lab / continued",
    "Clocked off": "Clocked out",
    "End-of-day equipment check completed": "End-of-day equipment check complete",
    "Signed off for day": "Signed off for day",
    "Arrival verification failed": "GPS arrival verification failed",
    "Running Behind selected": "Running Behind message prepared"
  };
  let currentUser = null;
  let currentProfile = null;
  let people = [];
  let updates = [];
  let currentRange = "today";
  let selectedInspectorId = "all";
  let unsubscribePeople = null;
  let unsubscribeUpdates = null;
  const messageReceiptCache = new Map();

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function asDate(value) {
    const date = value?.toDate?.() || (value ? new Date(value) : null);
    return date && !Number.isNaN(date.getTime()) ? date : null;
  }

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function rangeDateKeys(range = currentRange) {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    if (range === "today") return [dateKey(today)];
    if (range === "yesterday") {
      today.setDate(today.getDate() - 1);
      return [dateKey(today)];
    }
    const day = today.getDay() || 7;
    today.setDate(today.getDate() - day + 1);
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(today);
      value.setDate(today.getDate() + index);
      return dateKey(value);
    }).filter(key => key <= dateKey());
  }

  function formatDate(value) {
    if (!value) return "No due date";
    const date = value?.toDate?.() || new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function formatDateTime(value) {
    const date = asDate(value);
    if (!date) return "Just now";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
  }

  function formatTime(value) {
    const date = asDate(value);
    return date ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—";
  }

  function formatMinutes(value) {
    const minutes = Math.max(0, Math.round(Number(value) || 0));
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
  }

  function operativePeople() {
    return people.filter(person => person.active !== false && (person.role === "inspector" || person.operationsCurrent || person.operationsDays?.length));
  }

  function operationDays(person) {
    const values = Array.isArray(person?.operationsDays) ? person.operationsDays.slice() : [];
    if (person?.operationsCurrent?.date && !values.some(day => day.date === person.operationsCurrent.date)) values.push(person.operationsCurrent);
    return values.filter(day => day?.date);
  }

  function selectedDays(person) {
    const keys = new Set(rangeDateKeys());
    return operationDays(person).filter(day => keys.has(day.date)).sort((left, right) => String(left.date).localeCompare(String(right.date)));
  }

  function latestDay(person) {
    return selectedDays(person).at(-1) || null;
  }

  function correctionsFor(person, day) {
    return (Array.isArray(person?.adminCorrections) ? person.adminCorrections : [])
      .filter(item => item?.date === day?.date)
      .sort((left, right) => String(left.correctedAt || "").localeCompare(String(right.correctedAt || "")));
  }

  function effectiveClockOut(person, day) {
    const corrected = correctionsFor(person, day).filter(item => item.targetAction === "Clocked off").at(-1);
    if (corrected?.correctedValue) return corrected.correctedValue;
    const sessions = day?.timeClock?.sessions || [];
    return sessions.at(-1)?.clockedOutAt || "";
  }

  function workedMinutes(person, day) {
    if (!day?.timeClock) return 0;
    const correction = effectiveClockOut(person, day);
    return (day.timeClock.sessions || []).reduce((total, session, index, sessions) => {
      const start = asDate(session.clockedInAt)?.getTime();
      const isLast = index === sessions.length - 1;
      const end = asDate(session.clockedOutAt || (isLast ? correction : ""))?.getTime() || (day.timeClock.active && isLast ? Date.now() : 0);
      return total + (start && end > start ? Math.floor((end - start) / 60000) : 0);
    }, 0) || Number(day.timeClock.workedMinutes) || 0;
  }

  function weeklyMinutes(person) {
    return operationDays(person).filter(day => rangeDateKeys("week").includes(day.date)).reduce((total, day) => total + workedMinutes(person, day), 0);
  }

  function statusClass(status, alerts = []) {
    if (alerts.length) return "alert";
    if (/NOT STARTED|WAITING|CHECKS|FINAL JOB/.test(status || "")) return "waiting";
    if (/CLOCKED OUT/.test(status || "")) return "neutral";
    return "";
  }

  function jobCounts(day) {
    const jobs = day?.jobs || [];
    return { complete: jobs.filter(job => job.status === "completed").length, total: jobs.length };
  }

  function nextAppointment(day) {
    const currentId = day?.currentJob?.id;
    return (day?.jobs || []).find(job => job.status !== "completed" && job.id !== currentId) || (day?.currentJob?.status !== "completed" ? day?.currentJob : null);
  }

  function meaningfulAlerts(person, day) {
    const alerts = Array.isArray(day?.alerts) ? day.alerts.slice() : [];
    if (day?.readiness && ["denied", "default"].includes(day.readiness.notificationPermission)) alerts.push("Important notification permissions are not fully enabled.");
    if (weeklyMinutes(person) >= 38 * 60) alerts.push("Weekly hours are approaching the configured 40-hour review point.");
    return [...new Set(alerts)].slice(0, 10);
  }

  function showView(name) {
    tabButtons.forEach(button => button.classList.toggle("active", button.dataset.adminView === name));
    panels.forEach(panel => panel.classList.toggle("active", panel.dataset.adminPanel === name));
  }

  function renderTargetOptions() {
    const selected = targetInput.value;
    const inspectors = operativePeople();
    targetInput.innerHTML = '<option value="">Choose inspector</option>' + inspectors.map(person => `<option value="${escapeHtml(person.email)}">${escapeHtml(person.name || person.email)} — ${escapeHtml(person.email)}</option>`).join("");
    if (inspectors.some(person => person.email === selected)) targetInput.value = selected;
  }

  function renderInspectorSelector() {
    const selected = selectedInspectorId;
    inspectorSelector.innerHTML = '<option value="all">All inspectors</option>' + operativePeople().map(person => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.name || person.email)}</option>`).join("");
    selectedInspectorId = operativePeople().some(person => person.id === selected) ? selected : "all";
    inspectorSelector.value = selectedInspectorId;
  }

  function renderPeople() {
    renderTargetOptions();
    renderInspectorSelector();
    peopleList.innerHTML = people.length ? people.map(person => `
      <article class="person-card" data-person-id="${escapeHtml(person.id)}">
        <div class="person-main"><strong>${escapeHtml(person.name || "MPI Team Member")}</strong><small>${escapeHtml(person.email)}</small></div>
        <div class="person-controls">
          <select data-person-role aria-label="Role for ${escapeHtml(person.name || person.email)}" ${person.role === "owner" ? "disabled" : ""}>
            <option value="inspector" ${person.role === "inspector" ? "selected" : ""}>Inspector</option>
            <option value="admin" ${person.role === "admin" ? "selected" : ""}>Office admin</option>
            <option value="owner" ${person.role === "owner" ? "selected" : ""}>Owner</option>
          </select>
          <label class="check" style="padding:8px"><input data-person-active type="checkbox" ${person.active !== false ? "checked" : ""} ${person.role === "owner" ? "disabled" : ""}><span>Active</span></label>
        </div>
      </article>`).join("") : '<div class="empty">No company accounts have signed in yet.</div>';
    renderOperations();
  }

  function overviewRow(person) {
    const day = latestDay(person);
    const counts = jobCounts(day);
    const alerts = meaningfulAlerts(person, day);
    const next = nextAppointment(day);
    const hours = selectedDays(person).reduce((total, item) => total + workedMinutes(person, item), 0);
    const drive = selectedDays(person).reduce((total, item) => total + (Number(item.driveTime?.totalMinutes) || 0), 0);
    const status = day?.liveStatus || "NOT STARTED";
    const punctuality = day?.currentJob?.arrivalPerformance || next?.arrivalPerformance || (alerts.some(item => /late/i.test(item)) ? "Needs review" : "On schedule");
    return `<button class="inspector-row${alerts.length ? " has-alert" : ""}" type="button" data-open-inspector="${escapeHtml(person.id)}">
      <div><strong>${escapeHtml(person.name || person.email)}</strong><small>${escapeHtml(day?.currentJob?.property || (next ? `Next: ${next.property}` : "No current appointment"))}</small></div>
      <div><span class="status-badge ${statusClass(status, alerts)}">${escapeHtml(status)}</span><small>${alerts[0] ? escapeHtml(alerts[0]) : escapeHtml(punctuality)}</small></div>
      <div class="row-metric"><span>Jobs</span><b>${counts.complete} / ${counts.total}</b></div>
      <div class="row-metric"><span>Hours worked</span><b>${formatMinutes(hours)}</b></div>
      <div class="row-metric"><span>Drive time</span><b>${formatMinutes(drive)}</b></div>
      <div class="row-metric"><span>Next appointment</span><b>${next ? formatTime(next.scheduledStart) : "—"}</b></div>
      <span class="row-open">›</span>
    </button>`;
  }

  function renderOperationsStats() {
    const inspectors = operativePeople();
    const days = inspectors.map(person => ({ person, day: latestDay(person) })).filter(item => item.day);
    stats.working.textContent = String(days.filter(item => !["NOT STARTED", "CLOCKED OUT"].includes(item.day.liveStatus)).length);
    stats.jobs.textContent = String(days.reduce((total, item) => total + jobCounts(item.day).complete, 0));
    const totalMinutes = days.reduce((total, item) => total + selectedDays(item.person).reduce((sum, day) => sum + workedMinutes(item.person, day), 0), 0);
    stats.hours.textContent = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, "0")}`;
    stats.alerts.textContent = String(days.reduce((total, item) => total + meaningfulAlerts(item.person, item.day).length, 0));
  }

  function renderTeamOverview() {
    const inspectors = operativePeople();
    teamOverview.hidden = false;
    inspectorDetail.hidden = true;
    teamOverview.innerHTML = inspectors.length ? inspectors.map(overviewRow).join("") : '<div class="empty">No inspector devices have synced operational data yet. Ask each inspector to open MPI Field Tools while signed in.</div>';
  }

  function jobCard(job) {
    const status = String(job.status || "scheduled").replace(/-/g, " ");
    return `<article class="job-line"><time>${escapeHtml(formatTime(job.scheduledStart))}</time><div><strong>${escapeHtml(job.property || "Inspection appointment")}</strong><small>${escapeHtml((job.services || []).join(" + ") || "Inspection")} · ${escapeHtml(job.arrivalPerformance || "Arrival not recorded")}</small></div><span class="status-badge ${job.status === "completed" ? "neutral" : ""}">${escapeHtml(status)}</span></article>`;
  }

  function activityDetail(item) {
    if (item.action === "Arrival performance calculated") return item.data?.performance || "Compared with scheduled time";
    if (item.action === "Lab selected") return (item.data?.labs || []).join(" + ");
    if (item.action === "Arrived at lab" || item.action === "Lab visit completed") return item.data?.lab || item.property || "Laboratory";
    if (item.action === "Clocked off") return item.data?.worked || "Hours frozen for the day";
    return item.property || "";
  }

  function timelineHtml(person, day) {
    const corrections = correctionsFor(person, day).map(item => ({ timestamp: item.correctedValue, action: `Admin correction — ${item.targetAction}`, property: item.property || "", data: { reason: item.reason } }));
    const events = [...(day?.activity || []), ...corrections].sort((left, right) => (asDate(left.timestamp)?.getTime() || 0) - (asDate(right.timestamp)?.getTime() || 0));
    return events.length ? events.map(item => `<div class="timeline-row"><time>${escapeHtml(formatTime(item.timestamp))}</time><span class="timeline-dot"></span><div><strong>${escapeHtml(actionLabels[item.action] || item.action)}</strong><small>${escapeHtml(activityDetail(item) || item.data?.reason || "")}</small></div></div>`).join("") : '<div class="empty">No activity is recorded for this period.</div>';
  }

  function labHtml(day) {
    const lab = day?.labStop;
    const labEvents = (day?.activity || []).filter(item => ["Lab selected", "Arrived at lab", "Lab visit completed", "Lab route departure / continuation"].includes(item.action));
    if (!lab && !labEvents.length) return '<p class="ops-sub">No lab stop recorded.</p>';
    const names = [...new Set(labEvents.flatMap(item => item.data?.labs || item.data?.lab || []).filter(Boolean))];
    const arrivals = labEvents.filter(item => item.action === "Arrived at lab");
    const completions = labEvents.filter(item => item.action === "Lab visit completed");
    return `<div class="fact-list"><div class="fact"><span>Lab selected</span><strong>${escapeHtml(names.join(" + ") || "Recorded")}</strong></div><div class="fact"><span>Arrival</span><strong>${escapeHtml(arrivals.map(item => `${item.data?.lab || "Lab"} ${formatTime(item.timestamp)}`).join(" · ") || "—")}</strong></div><div class="fact"><span>Complete</span><strong>${escapeHtml(completions.map(item => `${item.data?.lab || "Lab"} ${formatTime(item.timestamp)}`).join(" · ") || "—")}</strong></div><div class="fact"><span>Lab drive</span><strong>${formatMinutes(day?.driveTime?.labMinutes)}</strong></div></div>`;
  }

  function messagesFor(person) {
    return updates.filter(update => update.type === "message" && shared.normalizeEmail(update.targetEmail) === shared.normalizeEmail(person.email));
  }

  function messageHistoryHtml(person) {
    const messages = messagesFor(person);
    return messages.length ? messages.slice(0, 20).map(message => {
      const receipt = messageReceiptCache.get(message.id);
      const state = receipt?.status ? receipt.status.replace(/-/g, " ") : "Sent to app";
      return `<article><strong>${escapeHtml(formatDateTime(message.createdAt))} · ${escapeHtml(message.createdByName || "MPI Office")}</strong><p>${escapeHtml(message.message)}</p><p><b>Status:</b> ${escapeHtml(state)}</p></article>`;
    }).join("") : '<div class="empty">No direct messages sent to this inspector.</div>';
  }

  async function hydrateMessageReceipts(person) {
    await Promise.all(messagesFor(person).slice(0, 20).map(async message => {
      try {
        const receipt = await shared.db.collection("officeUpdates").doc(message.id).collection("receipts").doc(person.id).get();
        if (receipt.exists) messageReceiptCache.set(message.id, receipt.data());
      } catch (_) {}
    }));
    if (selectedInspectorId === person.id && !inspectorDetail.hidden) {
      const host = document.getElementById("adminMessageHistory");
      if (host) host.innerHTML = messageHistoryHtml(person);
    }
  }

  function correctionHistoryHtml(person, day) {
    const corrections = correctionsFor(person, day).slice().reverse();
    return corrections.length ? corrections.map(item => `<article><strong>${escapeHtml(item.targetAction)} · ${escapeHtml(formatTime(item.correctedValue))}</strong><p>Original: ${escapeHtml(item.originalValue ? formatTime(item.originalValue) : "Not recorded")} · Corrected by ${escapeHtml(item.correctedByName || "MPI Admin")} on ${escapeHtml(formatDateTime(item.correctedAt))}</p><p>Reason: ${escapeHtml(item.reason)}</p></article>`).join("") : '<div class="empty">No admin corrections for this day.</div>';
  }

  function renderInspectorDetail(person) {
    const days = selectedDays(person);
    const day = days.at(-1);
    const counts = jobCounts(day);
    const hours = days.reduce((total, item) => total + workedMinutes(person, item), 0);
    const weekly = weeklyMinutes(person);
    const drive = days.reduce((summary, item) => {
      Object.keys(summary).forEach(key => { summary[key] += Number(item.driveTime?.[key]) || 0; });
      return summary;
    }, { morningMinutes: 0, betweenJobMinutes: 0, labMinutes: 0, finalMinutes: 0, totalMinutes: 0 });
    const current = day?.currentJob;
    const next = nextAppointment(day);
    const alerts = meaningfulAlerts(person, day);
    const clockOut = effectiveClockOut(person, day);
    const activityStart = day?.timeClock?.activityStartedAt || day?.readiness?.completedAt;
    const activityStartMs = asDate(activityStart)?.getTime() || 0;
    const activityMinutes = activityStartMs ? Math.max(0, Math.floor(((asDate(clockOut)?.getTime() || Date.now()) - activityStartMs) / 60000)) : 0;
    const eodStatus = day?.dayComplete?.completedAt ? "CLOCKED OUT" : counts.total && counts.complete === counts.total ? "END-OF-DAY CHECKS" : "DAY IN PROGRESS";
    const correctionActions = ["Arrived", "Inspection started", "Lab visit completed", "Clocked off", "On My Way selected"];
    const jobOptions = (day?.jobs || []).map(job => `<option value="${escapeHtml(job.id)}">${escapeHtml(job.property)}</option>`).join("");
    const timeAtProperty = current?.arrivedAt && asDate(current.arrivedAt) ? formatMinutes(Math.floor((Date.now() - asDate(current.arrivedAt).getTime()) / 60000)) : "—";
    inspectorDetail.innerHTML = `
      <div class="detail-hero"><div><p class="ops-eyebrow">Inspector operations</p><h2>${escapeHtml(person.name || person.email)}</h2><p>${escapeHtml(person.email || "")} · ${escapeHtml(day?.date ? formatDate(day.date) : "No activity synced for this period")}</p></div><div><span class="status-badge ${statusClass(day?.liveStatus, alerts)}">${escapeHtml(day?.liveStatus || "NOT STARTED")}</span><button class="detail-back" type="button" data-back-overview>← All inspectors</button></div></div>
      <div class="ops-grid">
        <article class="ops-card span-6"><p class="ops-eyebrow">Current job</p><strong class="ops-primary">${escapeHtml(current?.property || "No job currently open")}</strong><p class="ops-sub">${current ? `Scheduled ${formatTime(current.scheduledStart)} · ${escapeHtml(current.arrivalPerformance || "Arrival not recorded")} · ${escapeHtml(String(current.status || "scheduled").replace(/-/g, " "))}` : "The inspector is not inside an active job workflow."}</p><div class="fact-list" style="margin-top:13px"><div class="fact"><span>Arrived</span><strong>${escapeHtml(formatTime(current?.arrivedAt))}</strong></div><div class="fact"><span>Inspection started</span><strong>${escapeHtml(formatTime(current?.inspectionStartedAt))}</strong></div><div class="fact"><span>Time at property</span><strong>${timeAtProperty}</strong></div></div></article>
        <article class="ops-card span-6"><p class="ops-eyebrow">Next appointment</p><strong class="ops-primary">${escapeHtml(next?.property || "No remaining appointment")}</strong><p class="ops-sub">${next ? `${formatTime(next.scheduledStart)} · ${escapeHtml(next.arrivalPerformance || "On schedule")}` : "The scheduled job list is complete."}</p><div class="fact-list" style="margin-top:13px"><div class="fact"><span>Estimated drive</span><strong>${current?.departurePlan?.estimatedDriveMinutes ? `${current.departurePlan.estimatedDriveMinutes} min` : "—"}</strong></div><div class="fact"><span>Required departure</span><strong>${escapeHtml(formatTime(current?.departurePlan?.leaveBy))}</strong></div><div class="fact"><span>Schedule status</span><strong>${alerts.some(item => /late|affect next/i.test(item)) ? "ATTENTION REQUIRED" : "ON SCHEDULE"}</strong></div></div></article>
        <article class="ops-card"><p class="ops-eyebrow">Hours worked</p><strong class="ops-primary">${formatMinutes(hours)}</strong><p class="ops-sub">Started ${formatTime(day?.timeClock?.hoursWorkedStartedAt)} · ${clockOut ? `Frozen at ${formatTime(clockOut)}` : day?.timeClock?.active ? "Running now" : "Not started"}</p></article>
        <article class="ops-card"><p class="ops-eyebrow">Activity window</p><strong class="ops-primary">${formatMinutes(activityMinutes)}</strong><p class="ops-sub">Morning readiness ${formatTime(activityStart)} · End ${formatTime(clockOut)}</p></article>
        <article class="ops-card"><p class="ops-eyebrow">Weekly hours</p><strong class="ops-primary">${formatMinutes(weekly)}</strong><p class="ops-sub">Current Monday-to-today total${weekly >= 38 * 60 ? " · Review threshold approaching" : ""}</p></article>
        <article class="ops-card span-6"><h3>Drive Time</h3><div class="fact-list"><div class="fact"><span>Morning drive</span><strong>${formatMinutes(drive.morningMinutes)}</strong></div><div class="fact"><span>Between jobs</span><strong>${formatMinutes(drive.betweenJobMinutes)}</strong></div><div class="fact"><span>Lab travel</span><strong>${formatMinutes(drive.labMinutes)}</strong></div><div class="fact"><span>Final drive</span><strong>${day?.driveTime?.finalPending ? "Pending" : formatMinutes(drive.finalMinutes)}</strong></div><div class="fact"><span>Total drive today</span><strong>${formatMinutes(drive.totalMinutes)}</strong></div></div></article>
        <article class="ops-card span-6"><h3>Day Progress</h3><strong class="ops-primary">${counts.complete} / ${counts.total} complete</strong><p class="ops-sub">Completed jobs remain visible for the full calendar day.</p><div class="fact-list" style="margin-top:13px"><div class="fact"><span>Completed</span><strong>${counts.complete}</strong></div><div class="fact"><span>Remaining</span><strong>${Math.max(0, counts.total - counts.complete)}</strong></div><div class="fact"><span>Total jobs</span><strong>${counts.total}</strong></div></div></article>
        <article class="ops-card full"><h3>Today’s Jobs</h3><div class="job-list">${(day?.jobs || []).length ? day.jobs.map(jobCard).join("") : '<div class="empty">No scheduled jobs are available for this period.</div>'}</div></article>
        <article class="ops-card span-8"><h3>Activity Timeline</h3><div class="timeline">${timelineHtml(person, day)}</div></article>
        <article class="ops-card"><h3>Alerts / Exceptions</h3><div class="alert-list">${alerts.length ? alerts.map(item => `<div class="alert-item">${escapeHtml(item)}</div>`).join("") : '<div class="clear-item">✓ No meaningful workflow issues recorded.</div>'}</div></article>
        <article class="ops-card"><h3>Morning Readiness</h3><div class="fact-list"><div class="fact"><span>Status</span><strong>${day?.readiness ? "Complete" : "Not recorded"}</strong></div><div class="fact"><span>Completed</span><strong>${formatTime(day?.readiness?.completedAt)}</strong></div><div class="fact"><span>Important notifications</span><strong>${escapeHtml(day?.readiness?.notificationPermission === "granted" ? "Enabled" : day?.readiness?.notificationPermission || "Unknown")}</strong></div></div></article>
        <article class="ops-card"><h3>Lab Activity</h3>${labHtml(day)}</article>
        <article class="ops-card"><h3>End-of-Day Status</h3><div class="fact-list"><div class="fact"><span>Status</span><strong>${escapeHtml(eodStatus)}</strong></div><div class="fact"><span>Clock out</span><strong>${formatTime(clockOut)}</strong></div><div class="fact"><span>Location</span><strong>${escapeHtml(day?.timeClock?.sessions?.at(-1)?.clockOutLocation?.status || "Not recorded")}</strong></div><div class="fact"><span>Equipment check</span><strong>${day?.dayComplete?.equipment?.length ? "Complete" : "Pending"}</strong></div></div></article>
        <article class="ops-card span-6"><h3>Message Inspector</h3><div class="quick-messages" id="adminQuickMessages">${["CALL OFFICE", "PLEASE CHECK APP", "RUNNING LATE – UPDATE OFFICE", "REMEMBER LAB DROP", "PLEASE CONFIRM STATUS", "CONTACT CLIENT"].map(value => `<button type="button" data-quick-message="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join("")}</div><form class="compact-form" id="adminMessageForm" data-person-id="${escapeHtml(person.id)}"><div class="field"><label for="adminMessageText">Review or write the message</label><textarea id="adminMessageText" maxlength="1000" required placeholder="Type a clear operational message for ${escapeHtml(person.name || "the inspector")}"></textarea></div><button class="primary" type="submit">SEND TO INSPECTOR APP</button><span class="status" id="adminMessageStatus"></span></form><h3 style="margin-top:20px">Message History</h3><div class="message-history" id="adminMessageHistory">${messageHistoryHtml(person)}</div></article>
        <article class="ops-card span-6"><h3>Admin Corrections</h3><p class="ops-sub">Corrections are appended to the audit trail. Original records are never deleted or overwritten.</p><form class="compact-form" id="adminCorrectionForm" data-person-id="${escapeHtml(person.id)}"><div class="two-col"><div class="field"><label for="adminCorrectionAction">Missed / incorrect action</label><select id="adminCorrectionAction" required>${correctionActions.map(action => `<option value="${escapeHtml(action)}">${escapeHtml(action)}</option>`).join("")}</select></div><div class="field"><label for="adminCorrectionJob">Job</label><select id="adminCorrectionJob"><option value="">No specific job</option>${jobOptions}</select></div></div><div class="field"><label for="adminCorrectionValue">Correct date and time</label><input id="adminCorrectionValue" type="datetime-local" required></div><div class="field"><label for="adminCorrectionReason">Reason for correction</label><textarea id="adminCorrectionReason" maxlength="500" required placeholder="Explain why management is adding this correction."></textarea></div><button class="primary" type="submit">ADD AUDITABLE CORRECTION</button><span class="status" id="adminCorrectionStatus"></span></form><h3 style="margin-top:20px">Correction History</h3><div class="correction-history">${correctionHistoryHtml(person, day)}</div></article>
      </div>`;
    teamOverview.hidden = true;
    inspectorDetail.hidden = false;
    hydrateMessageReceipts(person);
  }

  function renderOperations() {
    renderOperationsStats();
    rangePicker.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.range === currentRange));
    const syncDates = operativePeople().map(person => asDate(person.operationsUpdatedAt)).filter(Boolean);
    const latest = syncDates.sort((a, b) => b - a)[0];
    operationsSync.textContent = latest ? `Latest device sync ${formatDateTime(latest)}` : "Waiting for inspector devices to sync.";
    if (selectedInspectorId === "all") renderTeamOverview();
    else {
      const person = people.find(item => item.id === selectedInspectorId);
      if (person) renderInspectorDetail(person);
      else renderTeamOverview();
    }
  }

  async function receiptSummary(updateId) {
    try {
      const snapshot = await shared.db.collection("officeUpdates").doc(updateId).collection("receipts").get();
      const values = snapshot.docs.map(doc => doc.data());
      return { total: values.length, acknowledged: values.filter(item => ["acknowledged", "completed", "read"].includes(item.status)).length, completed: values.filter(item => item.status === "completed").length };
    } catch (_) {
      return { total: 0, acknowledged: 0, completed: 0 };
    }
  }

  async function renderUpdates() {
    const summaries = await Promise.all(updates.map(update => receiptSummary(update.id)));
    updatesList.innerHTML = updates.length ? updates.map((update, index) => {
      const summary = summaries[index];
      const recipient = update.audience === "all" ? "All inspectors" : update.targetName || update.targetEmail || "One inspector";
      return `<article class="update-card"><div class="update-top"><div><span class="type-badge">${escapeHtml(String(update.type || "update").replace("-", " "))}</span>${update.priority !== "normal" ? `<span class="priority-badge">${escapeHtml(update.priority)}</span>` : ""}<h3>${escapeHtml(update.title)}</h3></div><span class="role-badge">${escapeHtml(recipient)}</span></div><p>${escapeHtml(update.message)}</p><div class="update-meta"><span>Published ${escapeHtml(formatDateTime(update.createdAt))}</span><span>Due ${escapeHtml(formatDate(update.dueDate))}</span><span>${summary.total} response${summary.total === 1 ? "" : "s"}</span><span>${summary.acknowledged} read / acknowledged</span></div></article>`;
    }).join("") : '<div class="empty">No office updates have been published.</div>';
    if (selectedInspectorId !== "all") renderOperations();
  }

  function startAdminData() {
    unsubscribePeople?.();
    unsubscribeUpdates?.();
    unsubscribePeople = shared.db.collection("users").orderBy("name").onSnapshot(snapshot => {
      people = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeople();
    }, error => { authStatus.textContent = error.message; });
    unsubscribeUpdates = shared.db.collection("officeUpdates").orderBy("createdAt", "desc").limit(200).onSnapshot(snapshot => {
      updates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderUpdates();
    }, error => { publishStatus.textContent = error.message; publishStatus.className = "status error"; });
  }

  async function publishUpdate(event) {
    event.preventDefault();
    if (!currentUser || !shared.isAdminRole(currentProfile)) return;
    const audience = audienceInput.value;
    const targetEmail = audience === "inspector" ? shared.normalizeEmail(targetInput.value) : "";
    if (audience === "inspector" && !targetEmail) {
      publishStatus.textContent = "Choose the inspector who should receive this item.";
      publishStatus.className = "status error";
      targetInput.focus();
      return;
    }
    const targetPerson = people.find(person => shared.normalizeEmail(person.email) === targetEmail);
    publishButton.disabled = true;
    publishStatus.textContent = "Publishing…";
    publishStatus.className = "status";
    try {
      await shared.db.collection("officeUpdates").add({
        type: typeInput.value,
        priority: priorityInput.value,
        audience: audience === "all" ? "all" : "inspector",
        targetEmail,
        targetName: targetPerson?.name || "",
        title: titleInput.value.trim(),
        message: messageInput.value.trim(),
        link: linkInput.value.trim(),
        dueDate: dueInput.value,
        requiresAcknowledgement: ackInput.checked,
        active: true,
        createdAt: shared.serverTimestamp(),
        createdBy: currentUser.uid,
        createdByEmail: shared.normalizeEmail(currentUser.email),
        createdByName: currentProfile.name || currentUser.displayName || "MPI Management"
      });
      form.reset();
      ackInput.checked = true;
      audienceInput.value = "all";
      targetField.hidden = true;
      publishStatus.textContent = "Published to MPI Field Tools.";
      publishStatus.className = "status success";
      showView("updates");
    } catch (error) {
      publishStatus.textContent = error.message || "The update could not be published.";
      publishStatus.className = "status error";
    } finally {
      publishButton.disabled = false;
    }
  }

  async function sendInspectorMessage(formElement) {
    const person = people.find(item => item.id === formElement.dataset.personId);
    const text = formElement.querySelector("#adminMessageText").value.trim();
    const status = formElement.querySelector("#adminMessageStatus");
    if (!person || !text) return;
    status.textContent = "Sending…";
    try {
      await shared.db.collection("officeUpdates").add({
        type: "message", priority: "important", audience: "inspector",
        targetEmail: shared.normalizeEmail(person.email), targetName: person.name || "",
        title: "Message from MPI Office", message: text, link: "", dueDate: "", requiresAcknowledgement: false, active: true,
        createdAt: shared.serverTimestamp(), createdBy: currentUser.uid,
        createdByEmail: shared.normalizeEmail(currentUser.email), createdByName: currentProfile.name || currentUser.displayName || "MPI Management"
      });
      formElement.reset();
      status.textContent = `Sent to ${person.name || "inspector"}.`;
      status.className = "status success";
    } catch (error) {
      status.textContent = error.message || "The message could not be sent.";
      status.className = "status error";
    }
  }

  async function addAdminCorrection(formElement) {
    const person = people.find(item => item.id === formElement.dataset.personId);
    const day = latestDay(person);
    const action = formElement.querySelector("#adminCorrectionAction").value;
    const jobId = formElement.querySelector("#adminCorrectionJob").value;
    const correctedValue = formElement.querySelector("#adminCorrectionValue").value;
    const reason = formElement.querySelector("#adminCorrectionReason").value.trim();
    const status = formElement.querySelector("#adminCorrectionStatus");
    if (!person || !day || !action || !correctedValue || !reason) return;
    const original = (day.activity || []).find(item => item.action === action && (!jobId || String(item.calendarEventId || item.jobId || "") === jobId));
    const job = (day.jobs || []).find(item => item.id === jobId);
    const correction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: day.date, targetAction: action, targetEventId: original?.id || "", jobId,
      property: job?.property || original?.property || "", originalValue: original?.timestamp || "",
      correctedValue: new Date(correctedValue).toISOString(), reason, correctedAt: new Date().toISOString(),
      correctedById: currentUser.uid, correctedByEmail: shared.normalizeEmail(currentUser.email),
      correctedByName: currentProfile.name || currentUser.displayName || "MPI Admin"
    };
    status.textContent = "Adding correction…";
    try {
      await shared.db.collection("users").doc(person.id).update({ adminCorrections: shared.arrayUnion(correction), operationsUpdatedAt: shared.serverTimestamp() });
      formElement.reset();
      status.textContent = "Correction added without changing the original record.";
      status.className = "status success";
    } catch (error) {
      status.textContent = error.message || "The correction could not be added.";
      status.className = "status error";
    }
  }

  async function updatePerson(event) {
    const card = event.target.closest("[data-person-id]");
    if (!card || !shared.isAdminRole(currentProfile)) return;
    const person = people.find(item => item.id === card.dataset.personId);
    if (!person || person.role === "owner") return;
    const role = card.querySelector("[data-person-role]").value;
    const active = card.querySelector("[data-person-active]").checked;
    try {
      await shared.db.collection("users").doc(person.id).set({ role, active, updatedAt: shared.serverTimestamp(), updatedBy: currentUser.uid }, { merge: true });
    } catch (error) {
      authStatus.textContent = error.message || "The account change could not be saved.";
    }
  }

  tabButtons.forEach(button => button.addEventListener("click", () => showView(button.dataset.adminView)));
  audienceInput.addEventListener("change", () => { targetField.hidden = audienceInput.value !== "inspector"; });
  form.addEventListener("submit", publishUpdate);
  peopleList.addEventListener("change", updatePerson);
  inspectorSelector.addEventListener("change", () => { selectedInspectorId = inspectorSelector.value; renderOperations(); });
  rangePicker.addEventListener("click", event => {
    const button = event.target.closest("[data-range]");
    if (!button) return;
    currentRange = button.dataset.range;
    renderOperations();
  });
  teamOverview.addEventListener("click", event => {
    const row = event.target.closest("[data-open-inspector]");
    if (!row) return;
    selectedInspectorId = row.dataset.openInspector;
    inspectorSelector.value = selectedInspectorId;
    renderOperations();
  });
  inspectorDetail.addEventListener("click", event => {
    if (event.target.closest("[data-back-overview]")) {
      selectedInspectorId = "all";
      inspectorSelector.value = "all";
      renderOperations();
      return;
    }
    const quick = event.target.closest("[data-quick-message]");
    if (quick) {
      const textarea = document.getElementById("adminMessageText");
      if (textarea) textarea.value = quick.dataset.quickMessage;
    }
  });
  inspectorDetail.addEventListener("submit", event => {
    event.preventDefault();
    if (event.target.id === "adminMessageForm") sendInspectorMessage(event.target);
    if (event.target.id === "adminCorrectionForm") addAdminCorrection(event.target);
  });
  signInButton.addEventListener("click", async () => {
    signInButton.disabled = true;
    authStatus.textContent = "Opening company sign-in…";
    try { await shared.signIn(); } catch (error) { authStatus.textContent = error.message || "Sign-in did not finish."; }
    signInButton.disabled = false;
  });
  signOutButton.addEventListener("click", () => shared.signOut());

  const localPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname) && new URLSearchParams(window.location.search).get("preview") === "operations";
  if (localPreview) {
    const now = new Date();
    const at = (hours, minutes) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).toISOString();
    const makeDay = (name, id, status, offset = 0) => ({
      date: dateKey(), updatedAtClient: new Date().toISOString(), inspector: { name, id }, liveStatus: status,
      readiness: { completedAt: at(7, 3 + offset), items: ["vehicle-ready", "fuel-ready", "route-reviewed"], notificationPermission: "granted" },
      timeClock: { activityStartedAt: at(7, 3 + offset), hoursWorkedStartedAt: at(8, 2 + offset), workedMinutes: 286, active: true, sessions: [{ clockedInAt: at(8, 2 + offset), clockedOutAt: "", clockInLocation: { status: "recorded" } }] },
      driveTime: { morningMinutes: 48, betweenJobMinutes: 31, labMinutes: 0, finalMinutes: 0, finalPending: false, totalMinutes: 79 },
      currentJob: { id: `${id}-2`, property: "456 Oak Street, Brighton, MI", scheduledStart: at(12, 0), arrivedAt: at(11, 54), inspectionStartedAt: at(11, 58), status: "in-progress", arrivalPerformance: "6 minutes early", departurePlan: { estimatedDriveMinutes: 34, leaveBy: at(14, 18) } },
      nextJob: { id: `${id}-3`, property: "789 Main Street, Ypsilanti, MI", scheduledStart: at(15, 0), status: "scheduled", arrivalPerformance: "Not recorded" },
      jobs: [
        { id: `${id}-1`, property: "123 First Street, Ann Arbor, MI", scheduledStart: at(8, 0), arrivedAt: at(8, 2), inspectionStartedAt: at(8, 5), completedAt: at(10, 38), status: "completed", arrivalPerformance: "2 minutes late", services: ["Residential Inspection"] },
        { id: `${id}-2`, property: "456 Oak Street, Brighton, MI", scheduledStart: at(12, 0), arrivedAt: at(11, 54), inspectionStartedAt: at(11, 58), status: "in-progress", arrivalPerformance: "6 minutes early", services: ["Residential Inspection", "Well Inspection"], departurePlan: { estimatedDriveMinutes: 34, leaveBy: at(14, 18) } },
        { id: `${id}-3`, property: "789 Main Street, Ypsilanti, MI", scheduledStart: at(15, 0), status: "scheduled", arrivalPerformance: "Not recorded", services: ["Residential Inspection"] }
      ],
      dayComplete: null, labStop: null, alerts: [],
      activity: [
        { id: `${id}-a`, timestamp: at(7, 3 + offset), action: "Morning readiness completed", property: "", data: {} },
        { id: `${id}-b`, timestamp: at(7, 14 + offset), action: "On My Way selected", property: "123 First Street, Ann Arbor, MI", data: {} },
        { id: `${id}-c`, timestamp: at(8, 2 + offset), action: "Arrived", property: "123 First Street, Ann Arbor, MI", data: {} },
        { id: `${id}-d`, timestamp: at(8, 2 + offset), action: "Hours worked started", property: "123 First Street, Ann Arbor, MI", data: {} },
        { id: `${id}-e`, timestamp: at(10, 38 + offset), action: "Final job completion", property: "123 First Street, Ann Arbor, MI", data: {} },
        { id: `${id}-f`, timestamp: at(11, 54 + offset), action: "Arrived", property: "456 Oak Street, Brighton, MI", data: {} },
        { id: `${id}-g`, timestamp: at(11, 58 + offset), action: "Inspection started", property: "456 Oak Street, Brighton, MI", data: {} }
      ]
    });
    people = [
      { id: "preview-kevin", name: "Kevin Cave", email: "kev@michiganpropertyinspections.com", role: "owner", active: true, operationsCurrent: makeDay("Kevin Cave", "KC", "INSPECTION IN PROGRESS"), operationsUpdatedAt: new Date() },
      { id: "preview-corey", name: "Corey Inspector", email: "corey@michiganpropertyinspections.com", role: "inspector", active: true, operationsCurrent: makeDay("Corey Inspector", "CI", "DRIVING TO JOB", 6), operationsUpdatedAt: new Date() }
    ];
    currentUser = { uid: "preview", email: "kev@michiganpropertyinspections.com", displayName: "Kevin Cave" };
    currentProfile = { name: "Kevin Cave", role: "owner", active: true };
    authCard.hidden = true;
    dashboard.hidden = false;
    accountPill.hidden = false;
    accountName.textContent = "Kevin Cave";
    accountEmail.textContent = currentUser.email;
    renderPeople();
    showView("operations");
    return;
  }

  if (!shared?.available) {
    authStatus.textContent = "The secure company connection is unavailable. Reconnect and reload.";
    signInButton.disabled = true;
    return;
  }

  shared.watchSession(({ user, profile, error }) => {
    currentUser = user;
    currentProfile = profile;
    authStatus.textContent = error?.message || "";
    if (!user || !profile || !shared.isAdminRole(profile)) {
      dashboard.hidden = true;
      accountPill.hidden = true;
      signOutButton.hidden = !user;
      authCard.hidden = false;
      if (user && profile && !shared.isAdminRole(profile)) authStatus.textContent = "This account has inspector access only.";
      unsubscribePeople?.();
      unsubscribeUpdates?.();
      return;
    }
    authCard.hidden = true;
    dashboard.hidden = false;
    accountPill.hidden = false;
    signOutButton.hidden = false;
    accountName.textContent = profile.name || user.displayName || "MPI Owner";
    accountEmail.textContent = user.email || "";
    accountInitial.textContent = (profile.name || user.displayName || "K").trim().charAt(0).toUpperCase();
    startAdminData();
  });
})();
