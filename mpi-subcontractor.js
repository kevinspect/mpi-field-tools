(function () {
  "use strict";

  const shared = window.MPI_SHARED;
  const screen = document.getElementById("subcontractor-home");
  const testCard = document.getElementById("subcontractorTestCard");
  const startTestButton = document.getElementById("startSubcontractorTestBtn");
  const exitTestButton = document.getElementById("subcontractorExitTestBtn");
  const resetButtons = [...document.querySelectorAll("[data-reset-subcontractor-test]")];
  const jobNumber = document.getElementById("subcontractorJobNumber");
  const statusLabel = document.getElementById("subcontractorStatus");
  const statusDetail = document.getElementById("subcontractorStatusDetail");
  const testBadge = document.getElementById("subcontractorTestBadge");
  const onWayButton = document.getElementById("subcontractorOnWayBtn");
  const arrivedButton = document.getElementById("subcontractorArrivedBtn");
  const completeButton = document.getElementById("subcontractorCompleteBtn");
  const waterTechButton = document.getElementById("subcontractorWaterTechBtn");
  const imsButton = document.getElementById("subcontractorImsBtn");
  const labCard = document.getElementById("subcontractorLabCard");
  const labTitle = document.getElementById("subcontractorLabTitle");
  const labDetail = document.getElementById("subcontractorLabDetail");
  const labDirections = document.getElementById("subcontractorLabDirections");
  const labArrivedButton = document.getElementById("subcontractorLabArrivedBtn");
  const labCompleteButton = document.getElementById("subcontractorLabCompleteBtn");
  const messageForm = document.getElementById("subcontractorMessageForm");
  const messageInput = document.getElementById("subcontractorMessageText");
  const messagePhotos = document.getElementById("subcontractorMessagePhotos");
  const messageStatus = document.getElementById("subcontractorMessageStatus");
  const officeUpdateCount = document.getElementById("subcontractorOfficeUpdateCount");
  const conversation = document.getElementById("subcontractorConversation");
  const accessGate = document.getElementById("subcontractorAccessGate");
  const accessTitle = document.getElementById("subcontractorAccessTitle");
  const accessMessage = document.getElementById("subcontractorAccessMessage");
  const accessButton = document.getElementById("subcontractorAccessButton");
  const actionStatus = document.getElementById("subcontractorActionStatus");
  const TEST_MODE_KEY = "mpiSubcontractorTestModeV1";
  const accessParameters = new URLSearchParams(window.location.search);
  const accessKey = String(accessParameters.get("subcontractor") || "").trim().toLowerCase();
  const deviceActivationId = String(accessParameters.get("access") || "").trim();
  const productionAccessRequested = Boolean(accessKey);
  const LOCAL_PREVIEW = ["127.0.0.1", "localhost"].includes(window.location.hostname) && new URLSearchParams(window.location.search).get("preview") === "subcontractor";
  const TEST_SUBCONTRACTOR = { name: "Jason Chamarro" };
  const LABS = {
    "water-tech": { name: "Water Tech", address: "718 S Michigan Ave, Howell, MI 48843" },
    ims: { name: "IMS Laboratory", address: "3130 Old Farm Lane, Suite 1, Commerce Township, MI 48390" }
  };

  let session = null;
  let state = null;
  let testMode = false;
  let unsubscribeUpdates = null;
  let unsubscribeState = null;
  let unsubscribeMessages = null;
  let unsubscribeDirectMessages = null;
  let unsubscribeDirectory = null;
  let currentOfficeUpdates = [];
  let currentFieldMessages = [];
  let currentDirectMessages = [];
  let teamDirectory = [];
  let activationRunning = false;

  function localDateKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function emptyState(isTest = false) {
    const timestamp = nowIso();
    return {
      date: localDateKey(),
      test: Boolean(isTest),
      subcontractorName: isTest ? TEST_SUBCONTRACTOR.name : String(session?.inspectorName || "MPI Subcontractor"),
      subcontractorPhone: isTest ? "" : String(session?.phone || ""),
      currentJobNumber: 1,
      currentJob: { number: 1, status: "ready", onWayAt: "", arrivedAt: "", completedAt: "" },
      completedJobs: [],
      lab: null,
      resumeAfterLab: null,
      status: "READY FOR JOB 1",
      events: [],
      updatedAtClient: timestamp
    };
  }

  function storageKey() {
    return `mpiSubcontractorDayV1:${session?.userId || "signed-out"}:${testMode ? "test" : "live"}`;
  }

  function loadLocalState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey()) || "null");
      if (saved?.date === localDateKey() && saved.currentJob) return saved;
    } catch (_) {}
    return emptyState(testMode);
  }

  function formatTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function timestampValue(value) {
    const date = value?.toDate?.() || new Date(value || "");
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function formatDateTime(value) {
    const date = value?.toDate?.() || new Date(value || "");
    if (Number.isNaN(date.getTime())) return "Pending synchronization";
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function setProductionAccessState(mode, detail = "") {
    document.body.classList.toggle("mpi-subcontractor-access-pending", mode === "pending" || mode === "activating");
    document.body.classList.toggle("mpi-subcontractor-access-denied", mode === "denied");
    if (!accessGate) return;
    accessGate.hidden = mode === "authorized" || mode === "test";
    if (mode === "activating") {
      accessTitle.textContent = "Activating Jason's company phone";
      accessMessage.textContent = "Please keep this page open for a moment. No Google account or password is required.";
      if (accessButton) accessButton.hidden = true;
    } else if (mode === "pending") {
      const displayName = accessKey ? `${accessKey.charAt(0).toUpperCase()}${accessKey.slice(1)}` : "Subcontractor";
      accessTitle.textContent = `${displayName}'s phone is not activated`;
      accessMessage.textContent = deviceActivationId
        ? "Tap Activate Company Phone to finish the secure one-time setup. No Google account is needed."
        : "Open the private activation link supplied by MPI Office on this phone. No Google account is needed.";
      if (accessButton) {
        accessButton.hidden = !deviceActivationId;
        accessButton.textContent = "ACTIVATE COMPANY PHONE";
      }
    } else if (mode === "denied") {
      accessTitle.textContent = "Subcontractor access not authorized";
      accessMessage.textContent = detail || "This device is not authorized for Jason's Subcontractor Field Tool. Ask MPI Office to issue a new private activation link.";
      if (accessButton) {
        accessButton.hidden = !deviceActivationId;
        accessButton.textContent = "TRY ACTIVATION AGAIN";
      }
    }
  }

  function removeActivationSecretFromAddress() {
    const clean = new URL(window.location.href);
    clean.searchParams.delete("access");
    window.history.replaceState({}, "", `${clean.pathname}${clean.search}${clean.hash}`);
  }

  async function activateCompanyPhone() {
    if (activationRunning || !productionAccessRequested || !deviceActivationId || !shared?.activateSubcontractorDevice) return;
    activationRunning = true;
    setProductionAccessState("activating");
    try {
      const activated = await shared.activateSubcontractorDevice(deviceActivationId, accessKey);
      removeActivationSecretFromAddress();
      const profile = activated.profile || {};
      applySession({
        userId: activated.user.uid,
        role: "subcontractor",
        active: true,
        subcontractorOnly: true,
        subcontractorKey: String(profile.subcontractorKey || accessKey),
        subcontractorAccessId: String(profile.subcontractorAccessId || deviceActivationId),
        inspectorName: String(profile.name || TEST_SUBCONTRACTOR.name),
        inspectorEmail: "",
        phone: String(profile.phone || "")
      });
    } catch (error) {
      const code = String(error?.code || "");
      const message = code === "auth/operation-not-allowed"
        ? "Secure phone activation is not available yet. Contact MPI Office."
        : code === "auth/network-request-failed"
          ? "The secure connection could not be reached. Check the phone's signal and try again."
          : /permission/i.test(String(error?.message || ""))
            ? "This private link is not active. Ask MPI Office for a replacement link."
            : error?.message || "This phone could not be activated. Ask MPI Office for a replacement link.";
      setProductionAccessState("denied", message);
    } finally {
      activationRunning = false;
    }
  }

  function renderConversation() {
    if (!conversation) return;
    const office = currentOfficeUpdates
      .filter(update => update.type === "message" && (String(update.targetUid || "") === String(session?.userId || "") || (!session?.inspectorEmail || String(update.targetEmail || "").toLowerCase() === String(session.inspectorEmail).toLowerCase())))
      .map(update => ({ direction: "office", timestamp: update.createdAt, message: update.message, author: update.createdByName || "MPI Office", update }));
    const field = currentFieldMessages.map(message => ({
      direction: "field",
      timestamp: message.createdAt || message.createdAtClient,
      message: message.message || (message.attachments?.length ? `${message.attachments.length} photo(s) sent` : "Message sent"),
      author: message.senderName || session?.inspectorName || "Jason"
    }));
    const direct = currentDirectMessages.map(message => ({
      direction: message.senderUid === session?.userId ? "field" : "office",
      timestamp: message.createdAt || message.createdAtClient,
      message: message.message || (message.attachments?.length ? `${message.attachments.length} attachment(s)` : "Message sent"),
      author: message.senderName || "MPI Team Member"
    }));
    const values = [...office, ...field, ...direct].sort((left, right) => timestampValue(left.timestamp) - timestampValue(right.timestamp)).slice(-30);
    conversation.innerHTML = values.length ? values.map(item => `<article class="subcontractor-message ${item.direction}"><strong>${escapeHtml(item.direction === "office" ? `${item.author} → Jason` : `${item.author} → MPI Office`)}</strong><span>${escapeHtml(item.message || "")}</span><time>${escapeHtml(formatDateTime(item.timestamp))}</time></article>`).join("") : '<div class="subcontractor-conversation-empty">No messages in this conversation yet.</div>';
    conversation.scrollTop = conversation.scrollHeight;
    office.filter(item => !item.update?.receipt).forEach(item => {
      shared.setUpdateStatus?.(item.update.id, shared.auth.currentUser, { name: session?.inspectorName || "Jason" }, "read").catch(() => false);
    });
  }

  function watchFieldConversation() {
    unsubscribeMessages?.();
    unsubscribeMessages = null;
    currentFieldMessages = [];
    if (!session?.userId || !shared?.db || LOCAL_PREVIEW) {
      renderConversation();
      return;
    }
    unsubscribeMessages = shared.db.collection("fieldMessages").where("senderUid", "==", session.userId).onSnapshot(snapshot => {
      currentFieldMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => item.active !== false && item.kind !== "lab-coc");
      renderConversation();
    }, () => renderConversation());
  }

  function watchDirectConversation() {
    unsubscribeDirectMessages?.();
    unsubscribeDirectory?.();
    currentDirectMessages = [];
    teamDirectory = [];
    if (!session?.userId || LOCAL_PREVIEW) return;
    unsubscribeDirectMessages = shared.watchDirectMessages?.(shared.auth.currentUser, (records, error) => {
      if (error) return;
      currentDirectMessages = records;
      const incoming = records.filter(item => item.senderUid !== session.userId);
      const unread = incoming.filter(item => !(Array.isArray(item.readBy) && item.readBy.includes(session.userId)));
      officeUpdateCount.textContent = unread.length ? `${unread.length} NEW` : "OPEN";
      [...new Set(unread.map(item => item.senderUid))].forEach(uid => shared.markDirectConversationRead?.(shared.auth.currentUser, uid).catch(() => false));
      renderConversation();
    });
    unsubscribeDirectory = shared.watchTeamDirectory?.((records, error) => {
      if (!error) teamDirectory = records;
    });
  }

  function appendEvent(type, extra = {}) {
    const timestamp = nowIso();
    state.events = [...(state.events || []), {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      timestamp,
      jobNumber: state.currentJobNumber,
      status: state.status,
      test: testMode,
      ...extra
    }].slice(-120);
    return timestamp;
  }

  function saveLocalState() {
    state.updatedAtClient = nowIso();
    localStorage.setItem(storageKey(), JSON.stringify(state));
  }

  function syncState() {
    if (!session?.userId || !shared?.db || !state) return;
    const field = testMode ? "subcontractorTestCurrent" : "subcontractorCurrent";
    shared.db.collection("users").doc(session.userId).set({
      [field]: state,
      subcontractorUpdatedAt: shared.serverTimestamp()
    }, { merge: true }).catch(() => {
      actionStatus.textContent = "Saved on this phone. It will sync when the connection returns.";
    });
    if (!testMode) {
      const role = "subcontractor";
      const status = state.lab?.status === "on-way" ? "DRIVING TO LAB"
        : state.lab?.status === "arrived" ? "AT LAB"
          : state.currentJob?.status === "on-way" ? "DRIVING TO JOB"
            : state.currentJob?.status === "arrived" ? "ARRIVED AT JOB"
              : state.currentJob?.status === "completed" ? "FINAL JOB COMPLETE"
                : "READY / WAITING TO DEPART";
      shared.db.collection("teamPresence").doc(session.userId).set({
        userId: session.userId,
        name: String(session.inspectorName || "MPI Subcontractor").slice(0, 80),
        role,
        photoURL: "",
        profilePhoto: "",
        status,
        date: localDateKey(),
        active: true,
        updatedAtClient: nowIso(),
        updatedAt: shared.serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
  }

  function persist() {
    saveLocalState();
    render();
    syncState();
  }

  function watchRemoteState() {
    unsubscribeState?.();
    unsubscribeState = null;
    if (!session?.userId || !shared?.db || LOCAL_PREVIEW) return;
    const field = testMode ? "subcontractorTestCurrent" : "subcontractorCurrent";
    unsubscribeState = shared.db.collection("users").doc(session.userId).onSnapshot(snapshot => {
      const remote = snapshot.data()?.[field];
      if (!remote?.currentJob || remote.date !== localDateKey()) {
        syncState();
        return;
      }
      const remoteTime = Date.parse(remote.updatedAtClient || "") || 0;
      const localTime = Date.parse(state?.updatedAtClient || "") || 0;
      if (remoteTime > localTime) {
        state = remote;
        saveLocalState();
        render();
      } else if (localTime > remoteTime) {
        syncState();
      }
    }, () => {});
  }

  function jobStatusText(job = state?.currentJob) {
    if (!job) return "READY";
    if (job.status === "on-way") return "ON WAY";
    if (job.status === "arrived") return "ARRIVED / AT JOB";
    if (job.status === "completed") return `JOB ${job.number} COMPLETE / AVAILABLE`;
    return "READY TO START";
  }

  function render() {
    if (!state) return;
    const job = state.currentJob;
    const inLab = Boolean(state.lab);
    jobNumber.textContent = `JOB ${job.number}`;
    statusLabel.textContent = inLab ? state.status : jobStatusText(job);
    statusDetail.textContent = inLab
      ? `${state.lab.name} · ${state.lab.status === "on-way" ? `departed ${formatTime(state.lab.onWayAt)}` : state.lab.status === "arrived" ? `arrived ${formatTime(state.lab.arrivedAt)}` : "visit complete"}`
      : job.status === "on-way"
        ? `On way recorded ${formatTime(job.onWayAt)}`
        : job.status === "arrived"
          ? `Arrival recorded ${formatTime(job.arrivedAt)}`
          : job.status === "completed"
            ? `Completed ${formatTime(job.completedAt)} · The next On Way starts Job ${job.number + 1}.`
            : "Tap On Way when you leave for the next job.";
    testBadge.hidden = !testMode;
    exitTestButton.hidden = !testMode;
    resetButtons.forEach(button => { button.hidden = !testMode; });

    onWayButton.disabled = inLab || !["ready", "completed"].includes(job.status);
    arrivedButton.disabled = inLab || job.status !== "on-way";
    completeButton.disabled = inLab || job.status !== "arrived";
    waterTechButton.disabled = inLab;
    imsButton.disabled = inLab;

    labCard.hidden = !inLab;
    if (inLab) {
      labTitle.textContent = state.lab.name;
      labDetail.textContent = state.lab.status === "on-way"
        ? "ON WAY TO LAB"
        : state.lab.status === "arrived"
          ? "ARRIVED AT LAB"
          : "LAB COMPLETE";
      labDirections.href = `https://maps.apple.com/?daddr=${encodeURIComponent(state.lab.address)}&dirflg=d`;
      labArrivedButton.hidden = state.lab.status !== "on-way";
      labCompleteButton.hidden = state.lab.status !== "arrived";
    }
  }

  function onWayToJob() {
    if (state.lab || !["ready", "completed"].includes(state.currentJob.status)) return;
    if (state.currentJob.status === "completed") {
      const nextNumber = state.currentJob.number + 1;
      state.currentJobNumber = nextNumber;
      state.currentJob = { number: nextNumber, status: "ready", onWayAt: "", arrivedAt: "", completedAt: "" };
    }
    state.currentJob.status = "on-way";
    state.status = `ON WAY – JOB ${state.currentJob.number}`;
    const timestamp = appendEvent("ON WAY");
    state.currentJob.onWayAt = timestamp;
    actionStatus.textContent = `Job ${state.currentJob.number} On Way recorded at ${formatTime(timestamp)}.`;
    persist();
  }

  function arriveAtJob() {
    if (state.lab || state.currentJob.status !== "on-way") return;
    state.currentJob.status = "arrived";
    state.status = `AT JOB – JOB ${state.currentJob.number}`;
    const timestamp = appendEvent("ARRIVED");
    state.currentJob.arrivedAt = timestamp;
    actionStatus.textContent = `Job ${state.currentJob.number} arrival recorded at ${formatTime(timestamp)}.`;
    persist();
  }

  function completeJob() {
    if (state.lab || state.currentJob.status !== "arrived") return;
    state.currentJob.status = "completed";
    state.status = `JOB ${state.currentJob.number} COMPLETE / AVAILABLE`;
    const timestamp = appendEvent("COMPLETE JOB");
    state.currentJob.completedAt = timestamp;
    state.completedJobs = [...(state.completedJobs || []).filter(item => item.number !== state.currentJob.number), { ...state.currentJob }];
    actionStatus.textContent = `Job ${state.currentJob.number} completed. The next On Way will start Job ${state.currentJob.number + 1}.`;
    persist();
  }

  function startLab(labId) {
    if (state.lab || !LABS[labId]) return;
    state.resumeAfterLab = {
      status: state.status,
      currentJobNumber: state.currentJobNumber,
      currentJob: { ...state.currentJob }
    };
    state.status = `ON WAY TO ${LABS[labId].name.toUpperCase()}`;
    const timestamp = appendEvent(`ON WAY TO ${LABS[labId].name.toUpperCase()}`, { lab: LABS[labId].name });
    state.lab = { id: labId, ...LABS[labId], status: "on-way", onWayAt: timestamp, arrivedAt: "", completedAt: "" };
    actionStatus.textContent = `${state.lab.name} departure recorded at ${formatTime(timestamp)}.`;
    persist();
  }

  function arriveAtLab() {
    if (!state.lab || state.lab.status !== "on-way") return;
    state.status = `AT ${state.lab.name.toUpperCase()}`;
    const timestamp = appendEvent(`ARRIVED AT ${state.lab.name.toUpperCase()}`, { lab: state.lab.name });
    state.lab.status = "arrived";
    state.lab.arrivedAt = timestamp;
    actionStatus.textContent = `${state.lab.name} arrival recorded at ${formatTime(timestamp)}.`;
    persist();
  }

  function completeLab() {
    if (!state.lab || state.lab.status !== "arrived") return;
    const name = state.lab.name;
    const resume = state.resumeAfterLab;
    if (resume?.currentJob) {
      state.currentJobNumber = resume.currentJobNumber;
      state.currentJob = resume.currentJob;
      state.status = ["ready", "completed"].includes(resume.currentJob.status)
        ? "LAB COMPLETE / AVAILABLE"
        : resume.status;
    }
    const timestamp = appendEvent("LAB COMPLETE", { lab: name });
    const finishedLab = { ...state.lab, status: "completed", completedAt: timestamp };
    state.lastLab = finishedLab;
    state.lab = null;
    state.resumeAfterLab = null;
    actionStatus.textContent = `${name} visit completed at ${formatTime(timestamp)}. Job tracking resumed without changing the job number.`;
    persist();
  }

  async function sendOfficeMessage(event) {
    event.preventDefault();
    const message = String(messageInput.value || "").trim().slice(0, 1000);
    const photos = [...(messagePhotos?.files || [])].slice(0, 3);
    if ((!message && !photos.length) || !session?.userId || !shared?.db) return;
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      message,
      senderName: testMode ? TEST_SUBCONTRACTOR.name : (session.inspectorName || "MPI Subcontractor"),
      senderEmail: session.inspectorEmail || "",
      createdAt: nowIso(),
      status: "sent",
      test: testMode
    };
    messageForm.querySelector("button").disabled = true;
    messageStatus.textContent = "Sending…";
    try {
      const latestIncoming = currentDirectMessages.filter(item => item.senderUid !== session.userId).sort((left, right) => timestampValue(right.createdAt || right.createdAtClient) - timestampValue(left.createdAt || left.createdAtClient))[0];
      const target = teamDirectory.find(item => item.id === latestIncoming?.senderUid)
        || teamDirectory.find(item => String(item.email || "").toLowerCase() === "kev@michiganpropertyinspections.com")
        || null;
      if (target && shared.sendDirectMessage) await shared.sendDirectMessage(shared.auth.currentUser, { name: record.senderName, role: "subcontractor" }, target, message, photos);
      else await shared.sendFieldMessage(shared.auth.currentUser, { name: record.senderName, role: "subcontractor" }, message, photos, { senderName: record.senderName, senderRole: "subcontractor", test: testMode });
      messageInput.value = "";
      if (messagePhotos) messagePhotos.value = "";
      messageStatus.textContent = photos.length ? `Message and ${photos.length} photo${photos.length === 1 ? "" : "s"} sent to MPI Office.` : "Message sent to MPI Office.";
    } catch (error) {
      messageStatus.textContent = navigator.onLine ? "Message could not be sent. Try again." : "Reconnect before sending this message.";
    } finally {
      messageForm.querySelector("button").disabled = false;
    }
  }

  function resetTestDay() {
    if (!testMode || !session?.userId) return;
    state = emptyState(true);
    actionStatus.textContent = "Test day reset to Job 1.";
    persist();
  }

  function enterTestMode() {
    if (!session || !["owner", "admin"].includes(String(session.role || "").toLowerCase())) return;
    localStorage.setItem(TEST_MODE_KEY, "1");
    testMode = true;
    document.body.classList.add("mpi-subcontractor-mode");
    state = loadLocalState();
    window.location.hash = "#subcontractor-home";
    render();
    watchRemoteState();
    if (LOCAL_PREVIEW) syncState();
  }

  function exitTestMode() {
    localStorage.removeItem(TEST_MODE_KEY);
    testMode = false;
    document.body.classList.remove("mpi-subcontractor-mode");
    unsubscribeState?.();
    unsubscribeState = null;
    window.location.hash = "#settings";
  }

  function renderOfficeUpdates(updates) {
    currentOfficeUpdates = Array.isArray(updates) ? updates : [];
    const unread = (updates || []).filter(item => !item.receipt).length;
    officeUpdateCount.textContent = unread ? `${unread} NEW` : "OPEN";
    renderConversation();
  }

  function applySession(nextSession) {
    if (LOCAL_PREVIEW && !nextSession) return;
    session = nextSession;
    if (!nextSession) {
      unsubscribeUpdates?.();
      unsubscribeUpdates = null;
      unsubscribeState?.();
      unsubscribeState = null;
      unsubscribeMessages?.();
      unsubscribeMessages = null;
      unsubscribeDirectMessages?.();
      unsubscribeDirectMessages = null;
      unsubscribeDirectory?.();
      unsubscribeDirectory = null;
      currentOfficeUpdates = [];
      currentFieldMessages = [];
      renderConversation();
    }
    const role = String(session?.role || "").toLowerCase();
    const isAdmin = ["owner", "admin"].includes(role);
    testMode = isAdmin && localStorage.getItem(TEST_MODE_KEY) === "1";
    const subcontractorIdentity = role === "subcontractor" || session?.subcontractorOnly === true;
    const subcontractorMode = subcontractorIdentity || testMode || productionAccessRequested;
    document.body.classList.toggle("mpi-subcontractor-mode", subcontractorMode);
    if (testCard) testCard.hidden = !isAdmin || testMode;
    if (productionAccessRequested && !nextSession) {
      setProductionAccessState("pending");
      window.location.hash = "#subcontractor-home";
      return;
    }
    if (productionAccessRequested && !subcontractorIdentity && !testMode) {
      setProductionAccessState("denied");
      window.location.hash = "#subcontractor-home";
      return;
    }
    setProductionAccessState(testMode ? "test" : "authorized");
    if (!subcontractorMode) return;
    state = loadLocalState();
    render();
    watchRemoteState();
    if (LOCAL_PREVIEW) syncState();
    if (window.location.hash !== "#subcontractor-home" && !["#comment-builder", "#age-finder", "#damage-report", "#office-updates"].includes(window.location.hash)) {
      window.location.hash = "#subcontractor-home";
    }
    unsubscribeUpdates?.();
    if (shared?.watchUpdates && shared.auth?.currentUser) unsubscribeUpdates = shared.watchUpdates(shared.auth.currentUser, { role }, renderOfficeUpdates);
    watchFieldConversation();
    watchDirectConversation();
  }

  onWayButton?.addEventListener("click", onWayToJob);
  arrivedButton?.addEventListener("click", arriveAtJob);
  completeButton?.addEventListener("click", completeJob);
  waterTechButton?.addEventListener("click", () => startLab("water-tech"));
  imsButton?.addEventListener("click", () => startLab("ims"));
  labArrivedButton?.addEventListener("click", arriveAtLab);
  labCompleteButton?.addEventListener("click", completeLab);
  messageForm?.addEventListener("submit", sendOfficeMessage);
  accessButton?.addEventListener("click", activateCompanyPhone);
  startTestButton?.addEventListener("click", enterTestMode);
  exitTestButton?.addEventListener("click", exitTestMode);
  resetButtons.forEach(button => button.addEventListener("click", resetTestDay));
  window.addEventListener("online", syncState);
  window.addEventListener("mpi-company-session-ready", event => applySession(event.detail));
  if (window.MPI_COMPANY_SESSION) applySession(window.MPI_COMPANY_SESSION);
  else if (productionAccessRequested) applySession(null);
  if (!LOCAL_PREVIEW && productionAccessRequested && deviceActivationId) activateCompanyPhone();
  if (LOCAL_PREVIEW) {
    applySession({ userId: "local-subcontractor-preview", role: "owner", inspectorName: "Kevin Cave", inspectorEmail: "kev@michiganpropertyinspections.com" });
    enterTestMode();
  }

  window.MPI_SUBCONTRACTOR_TEST = { onWayToJob, arriveAtJob, completeJob, startLab, arriveAtLab, completeLab, resetTestDay };
})();
