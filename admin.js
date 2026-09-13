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
  const attachmentInput = document.getElementById("adminUpdateFiles");
  const attachmentDrop = document.getElementById("adminAttachmentDrop");
  const attachmentList = document.getElementById("adminAttachmentList");
  const ackInput = document.getElementById("adminUpdateAck");
  const publishButton = document.getElementById("adminPublishButton");
  const publishStatus = document.getElementById("adminPublishStatus");
  const updatesList = document.getElementById("adminUpdatesList");
  const peopleList = document.getElementById("adminPeopleList");
  const trainingList = document.getElementById("adminTrainingList");
  const inspectorSelector = document.getElementById("adminInspectorSelector");
  const rangePicker = document.getElementById("adminRangePicker");
  const teamOverview = document.getElementById("adminTeamOverview");
  const inspectorDetail = document.getElementById("adminInspectorDetail");
  const subcontractorList = document.getElementById("adminSubcontractorList");
  const operationsSync = document.getElementById("adminOperationsSync");
  const safetyAlertCenter = document.getElementById("adminSafetyAlerts");
  const safetyAlertCount = document.getElementById("adminSafetyAlertCount");
  const safetyAlertList = document.getElementById("adminSafetyAlertList");
  const liveLocationPanel = document.getElementById("adminLiveLocationPanel");
  const liveLocationMapElement = document.getElementById("adminLiveLocationMap");
  const liveLocationList = document.getElementById("adminLiveLocationList");
  const liveLocationStatus = document.getElementById("adminLiveLocationStatus");
  const liveLocationRefresh = document.getElementById("adminLiveLocationRefresh");
  const liveLocationHistory = document.getElementById("adminLiveLocationHistory");
  const liveLocationPlan = document.getElementById("adminLiveLocationPlan");
  const liveLocationAllPlans = document.getElementById("adminLiveLocationAllPlans");
  const liveLocationShowAll = document.getElementById("adminLiveLocationShowAll");
  const liveRouteDate = document.getElementById("adminLiveRouteDate");
  const liveCandidateAddress = document.getElementById("adminLiveCandidateAddress");
  const liveCandidatePin = document.getElementById("adminLiveCandidatePin");
  const liveLocationRouteStatus = document.getElementById("adminLiveLocationRouteStatus");
  const spectoraScheduleStatus = document.getElementById("adminSpectoraScheduleStatus");
  const commentUsageUsed = document.getElementById("commentUsageUsed");
  const commentUsagePanel = document.getElementById("commentUsagePanel");
  const commentUsageRemaining = document.getElementById("commentUsageRemaining");
  const commentUsageStatus = document.getElementById("commentUsageStatus");
  const commentUsageProgress = document.getElementById("commentUsageProgress");
  const commentUsageNote = document.getElementById("commentUsageNote");
  const operationsSummary = document.getElementById("adminOperationsSummary");
  const requestCount = document.getElementById("adminRequestCount");
  const requestList = document.getElementById("adminRequestList");
  const requestStatusFilter = document.getElementById("adminRequestStatusFilter");
  const requestInspectorFilter = document.getElementById("adminRequestInspectorFilter");
  const requestTypeFilter = document.getElementById("adminRequestTypeFilter");
  const requestAssigneeFilter = document.getElementById("adminRequestAssigneeFilter");
  const requestDateFilter = document.getElementById("adminRequestDateFilter");
  const requestSort = document.getElementById("adminRequestSort");
  const diagnosticCount = document.getElementById("adminDiagnosticCount");
  const diagnosticList = document.getElementById("adminDiagnosticList");
  const diagnosticSummary = document.getElementById("adminDiagnosticSummary");
  const diagnosticStatusFilter = document.getElementById("adminDiagnosticStatusFilter");
  const officeAlertButtons = [...document.querySelectorAll("[data-enable-office-alerts]")];
  const replyCount = document.getElementById("adminReplyCount");
  const unifiedInboxList = document.getElementById("adminUnifiedInboxList");
  const unifiedInboxSummary = document.getElementById("adminInboxSummary");
  const sentMessagesList = document.getElementById("adminSentMessagesList");
  const sentMessagesSummary = document.getElementById("adminSentSummary");
  const inboxComposeForm = document.getElementById("adminInboxComposeForm");
  const inboxComposeRecipient = document.getElementById("adminInboxComposeRecipient");
  const inboxComposeText = document.getElementById("adminInboxComposeText");
  const inboxComposeFiles = document.getElementById("adminInboxComposeFiles");
  const inboxComposeSend = document.getElementById("adminInboxComposeSend");
  const inboxComposeStatus = document.getElementById("adminInboxComposeStatus");
  const inboxMailbox = document.getElementById("adminInboxMailbox");
  const inboxConversation = document.getElementById("adminInboxConversation");
  const tabButtons = [...document.querySelectorAll("[data-admin-view]")];
  const panels = [...document.querySelectorAll("[data-admin-panel]")];
  const stats = {
    working: document.getElementById("statWorking"),
    jobs: document.getElementById("statJobs"),
    hours: document.getElementById("statHours"),
    alerts: document.getElementById("statAlerts")
  };
  const statHoursLabel = document.getElementById("statHoursLabel");
  const adminOnboarding = document.getElementById("adminOnboarding");
  const adminOnboardingBody = document.getElementById("adminOnboardingBody");
  const adminOnboardingStepLabel = document.getElementById("adminOnboardingStepLabel");
  const adminOnboardingProgress = document.getElementById("adminOnboardingProgress");
  const adminOnboardingBack = document.getElementById("adminOnboardingBack");
  const adminOnboardingNext = document.getElementById("adminOnboardingNext");
  const actionLabels = {
    "Morning readiness completed": "Morning Readiness Complete",
    "Inspector activity started": "Activity tracking started",
    "On My Way selected": "On My Way",
    "Directions selected": "Directions opened",
    Arrived: "Arrived at job",
    "Hours worked started": "Hours Worked started",
    "NACHI training started": "NACHI Training started",
    "NACHI training ended": "NACHI Training ended",
    "Inspection started": "Inspection started",
    "Job Complete selected": "Job completion selected",
    "Used tools back on truck confirmed": "Used tools back on truck",
    "Final job completion": "Job complete",
    "Lab selected": "Lab stop selected",
    "Arrived at lab": "Arrived at lab",
    "Chain of Custody photos added": "Chain of Custody photos saved",
    "Chain of Custody photos synchronized": "Chain of Custody photos synchronized",
    "Lab visit completed": "Lab visit complete",
    "Lab route departure / continuation": "Departed lab / continued",
    "Clocked off": "Clocked out",
    "End-of-day equipment check completed": "End-of-day equipment check complete",
    "Signed off for day": "Signed off for day",
    "Arrival verification failed": "GPS arrival verification failed",
    "Arrival location verified": "Arrival location verified",
    "Arrival location review required": "Arrival location review required",
    "Weekly summary submitted to management": "Weekly summary emailed",
    "Running Behind selected": "Running Behind message prepared"
  };
  let currentUser = null;
  let currentProfile = null;
  let people = [];
  let updates = [];
  let currentRange = "today";
  let currentAdminView = "operations";
  const COMMENT_MONTHLY_PLANNING_ALLOWANCE = 400;
  let selectedInspectorId = "all";
  let selectedOperationDate = "";
  let unsubscribePeople = null;
  let unsubscribeUpdates = null;
  let unsubscribeReplies = null;
  let unsubscribeFieldMessages = null;
  let unsubscribeDirectMessages = null;
  let selectedFiles = [];
  let inspectorReplies = [];
  let fieldMessages = [];
  let directMessages = [];
  let activeInboxPersonId = "";
  let directMessageListenerReady = false;
  let fieldMessageListenerReady = false;
  let knownFieldMessageIds = new Set();
  let officeUpdateListenerReady = false;
  let knownOfficeUpdateIds = new Set();
  let knownReplyKeys = new Set();
  let readReplyKeys = new Set();
  let unreadSafetyCount = 0;
  let replyListenerReady = false;
  let officeMessaging = null;
  const OFFICE_PUSH_TOKEN_KEY = "mpiOfficePushTokenV1";
  let knownRequestIds = new Set();
  let reviewingRequests = false;
  const assignedRequestMigrations = new Set();
  let legacyRequestChecked = false;
  const messageReceiptCache = new Map();
  let updateReceiptRecords = [];
  const MAX_ATTACHMENT_FILES = 5;
  const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
  const MAX_ATTACHMENT_TOTAL_BYTES = 12 * 1024 * 1024;
  const ATTACHMENT_CHUNK_LENGTH = 560000;
  const ADMIN_ONBOARDING_VERSION = 1;
  const ADMIN_ONBOARDING_EMAILS = new Set(["adrienne@michiganpropertyinspections.com"]);
  let adminOnboardingStep = 0;
  let teamDeepLinkApplied = false;
  let initialAdminViewApplied = false;
  let liveLocationMap = null;
  let liveLocationLayer = null;
  let liveLocationRouteLayer = null;
  let liveLocationMarkers = new Map();
  let liveLocationMapSignature = "";
  let liveLocationAgeTimer = 0;
  let selectedLiveLocationPersonId = "";
  let liveLocationMapMode = "all";
  let liveLocationPlanVisible = false;
  let liveLocationAllPlansVisible = false;
  let liveLocationRouteVisible = false;
  let liveLocationRouteLoading = false;
  let liveLocationPlannedStops = [];
  let liveLocationCandidate = null;

  const adminOnboardingSteps = [
    () => ({
      title: `Welcome, ${escapeHtml(currentProfile?.name || "Adrienne")}`,
      copy: "Your secure MPI owner account is ready. This short setup will prepare the Office Console on this device and show you where the important daily controls are.",
      items: ["Use your own MPI Google account every time.", "Your access includes live operations, messages, requests, reports and team management.", "Your sign-in stays on this approved device until you sign out or clear its browser data."]
    }),
    () => ({
      title: "Keep the Office Console handy",
      copy: "Save the console like an app so you can open it directly without finding the link again.",
      items: ["iPhone or iPad: open this page in Safari, tap Share, then Add to Home Screen and Add.", "Computer: bookmark this page in the browser toolbar.", "Always open the MPI Office icon or the saved Office Console bookmark."]
    }),
    () => ({
      title: "Turn on office alerts",
      copy: "Alerts are important for inspector replies, urgent safety notices and new requests. Approve the notification prompt on every office device you use.",
      items: ["Tap Enable Office Alerts below.", "Choose Allow when the device asks for notification permission.", "Repeat this one time on each additional phone or computer."],
      alertButton: true
    }),
    () => ({
      title: "Know the five office sections",
      copy: "The main navigation keeps the office work in one place.",
      items: ["Operations: live inspector status, job progress, hours, drive time and safety alerts.", "Requests: assign, update and complete employee requests.", "Send to Field: send messages, instructions, PDFs and images.", "Sent Updates: review delivery, confirmations and replies.", "Team: manage accounts, roles, phone numbers and inspector details."]
    }),
    () => ({
      title: "Setup complete",
      copy: "Adrienne now has owner-level Office Console access. Press Finish Setup to save this setup and open the live Operations screen.",
      items: ["Use Enable Office Alerts on any new device.", "Safety alerts require each administrator to acknowledge them separately.", "The private MPI Comment Builder allowance remains visible only to Kevin, as previously requested."]
    })
  ];

  function renderAdminOnboarding() {
    if (!adminOnboarding || !adminOnboardingBody) return;
    const step = adminOnboardingSteps[adminOnboardingStep]();
    adminOnboardingStepLabel.textContent = `Step ${adminOnboardingStep + 1} of ${adminOnboardingSteps.length}`;
    adminOnboardingBody.innerHTML = `<h2 id="adminOnboardingTitle">${step.title}</h2><p>${step.copy}</p><ul class="admin-onboarding-list">${step.items.map(item => `<li>${item}</li>`).join("")}</ul>${step.alertButton ? '<button class="primary admin-onboarding-alert" type="button" data-onboarding-enable-alerts>ENABLE OFFICE ALERTS</button><p class="admin-onboarding-status" data-onboarding-alert-status></p>' : ""}<p class="admin-onboarding-status" data-onboarding-save-status></p>`;
    adminOnboardingProgress.innerHTML = adminOnboardingSteps.map((_, index) => `<span class="${index === adminOnboardingStep ? "active" : ""}"></span>`).join("");
    adminOnboardingBack.hidden = adminOnboardingStep === 0;
    adminOnboardingNext.textContent = adminOnboardingStep === adminOnboardingSteps.length - 1 ? "FINISH SETUP" : "CONTINUE";
  }

  function maybeStartAdminOnboarding() {
    if (!currentUser || !currentProfile || !adminOnboarding) return;
    const email = shared.normalizeEmail(currentUser.email);
    const completed = Number(currentProfile.adminOnboardingVersion || 0) >= ADMIN_ONBOARDING_VERSION;
    if (!ADMIN_ONBOARDING_EMAILS.has(email) || completed) return;
    adminOnboardingStep = 0;
    renderAdminOnboarding();
    adminOnboarding.hidden = false;
    document.body.style.overflow = "hidden";
  }

  async function completeAdminOnboarding() {
    const status = adminOnboardingBody?.querySelector("[data-onboarding-save-status]");
    adminOnboardingNext.disabled = true;
    if (status) status.textContent = "Saving your setup…";
    try {
      await shared.db.collection("users").doc(currentUser.uid).set({
        adminOnboardingVersion: ADMIN_ONBOARDING_VERSION,
        adminOnboardingCompletedAt: shared.serverTimestamp()
      }, { merge: true });
      currentProfile.adminOnboardingVersion = ADMIN_ONBOARDING_VERSION;
      adminOnboarding.hidden = true;
      document.body.style.overflow = "";
      showView("operations");
    } catch (error) {
      if (status) status.textContent = error.message || "Setup could not be saved. Please try again.";
    } finally {
      adminOnboardingNext.disabled = false;
    }
  }

  function savedOfficePushToken() {
    try { return String(localStorage.getItem(OFFICE_PUSH_TOKEN_KEY) || "").trim(); }
    catch (_) { return ""; }
  }

  function setOfficeAlertButtonState(label, disabled = false) {
    officeAlertButtons.forEach(button => {
      const text = button.querySelector("span");
      if (text) text.textContent = label;
      button.disabled = disabled;
    });
  }

  function playOfficeAlertTone() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const start = context.currentTime;
      [740, 932, 1175].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.2, start + index * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.15 + 0.12);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start + index * 0.15);
        oscillator.stop(start + index * 0.15 + 0.13);
      });
      window.setTimeout(() => context.close().catch(() => {}), 850);
    } catch (_) {}
  }

  async function showOfficeAlert(title, body, tag = "mpi-office-alert", url = "./admin.html?view=inbox") {
    playOfficeAlertTone();
    try { navigator.vibrate?.([250, 100, 250, 100, 450]); } catch (_) {}
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
      if (registration) {
        await registration.showNotification(title, {
          body,
          icon: "./icon-192.png",
          badge: "./icon-192.png",
          tag,
          renotify: true,
          requireInteraction: true,
          silent: false,
          vibrate: [250, 100, 250, 100, 450],
          data: { url }
        });
      } else {
        const notification = new Notification(title, { body, icon: "./icon-192.png", tag });
        notification.onclick = () => { window.location.href = url; window.focus(); };
      }
    } catch (_) {}
  }

  async function enableOfficeAlerts(button = null, requestPermission = true) {
    if (!currentUser || !currentProfile || !shared.isAdminRole(currentProfile)) return false;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !window.firebase?.messaging) {
      setOfficeAlertButtonState("ALERTS NOT SUPPORTED");
      return false;
    }
    if (requestPermission) {
      button && (button.disabled = true);
      setOfficeAlertButtonState("ENABLING ALERTS…", true);
    }
    try {
      const permission = Notification.permission === "granted" ? "granted" : requestPermission ? await Notification.requestPermission() : Notification.permission;
      if (permission !== "granted") {
        setOfficeAlertButtonState(permission === "denied" ? "ALLOW ALERTS IN SETTINGS" : "ENABLE OFFICE ALERTS");
        return false;
      }
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      officeMessaging ||= window.firebase.messaging();
      if (!officeMessaging.__mpiForegroundReady) {
        officeMessaging.onMessage(payload => {
          const title = payload?.notification?.title || payload?.data?.title || "New MPI office notification";
          const body = payload?.notification?.body || payload?.data?.body || "Open the Office Console to review it.";
          showOfficeAlert(title, body, payload?.data?.tag || "mpi-office-push");
        });
        officeMessaging.__mpiForegroundReady = true;
      }
      const token = await officeMessaging.getToken({ vapidKey: shared.vapidKey, serviceWorkerRegistration: registration });
      if (!token) throw new Error("No office notification token was returned.");
      try { localStorage.setItem(OFFICE_PUSH_TOKEN_KEY, token); } catch (_) {}
      await shared.db.collection("users").doc(currentUser.uid).set({
        officeNotificationDevice: { token, enabled: true, app: "MPI Office Console", updatedAt: shared.serverTimestamp() }
      }, { merge: true });
      currentProfile.officeNotificationDevice = { token, enabled: true };
      setOfficeAlertButtonState("OFFICE ALERTS ENABLED", true);
      return true;
    } catch (error) {
      setOfficeAlertButtonState("TRY OFFICE ALERTS AGAIN");
      console.warn("MPI office alert setup failed", error);
      return false;
    } finally {
      if (button && !button.disabled) button.disabled = false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function formatFileSize(value) {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function attachmentKind(file) {
    return String(file?.type || "").includes("pdf") || /\.pdf$/i.test(file?.name || "") ? "PDF" : "IMG";
  }

  function updateForReply(reply) {
    return updates.find(update => update.id === reply.updateId) || null;
  }

  function replyKey(reply) {
    if (reply.fieldMessageId) return `field:${reply.fieldMessageId}`;
    const timestamp = reply.repliedAt?.toMillis?.() || String(reply.repliedAt || reply.updatedAt || "");
    return `${reply.path || `${reply.updateId}/${reply.userId}`}:${timestamp}:${reply.replyText || ""}`;
  }

  function replyIsForCurrentAdmin(reply) {
    if (reply.fieldMessageId) return shared.isAdminRole(currentProfile);
    const update = updateForReply(reply);
    const recipientId = String(reply.replyToUserId || update?.createdBy || "");
    const recipientEmail = shared.normalizeEmail(reply.replyToEmail || update?.createdByEmail);
    if (recipientId) return recipientId === currentUser?.uid;
    if (recipientEmail) return recipientEmail === shared.normalizeEmail(currentUser?.email);
    return shared.isOwnerEmail(currentUser?.email);
  }

  function isPrimaryOwner() {
    return shared.normalizeEmail(currentUser?.email) === shared.ownerEmail;
  }

  function markReplyRead(key) {
    if (!key || readReplyKeys.has(key)) return;
    readReplyKeys.add(key);
    const savedKeys = [...readReplyKeys].slice(-200);
    currentProfile.officeReplyReadKeys = savedKeys;
    renderAdminUnifiedInbox();
    renderSafetyAlerts();
    renderOperationsStats();
    shared.db.collection("users").doc(currentUser.uid).set({
      officeReplyReadKeys: savedKeys,
      officeRepliesReadAt: shared.serverTimestamp()
    }, { merge: true }).catch(() => {});
  }

  function safetyMessages() {
    return fieldMessages
      .filter(item => item.kind === "safety-alert" && item.active !== false)
      .sort((left, right) => (asDate(right.createdAt || right.createdAtClient)?.getTime() || 0) - (asDate(left.createdAt || left.createdAtClient)?.getTime() || 0));
  }

  function unreadSafetyAlerts() {
    return safetyMessages().filter(item => !readReplyKeys.has(`field:${item.id}`));
  }

  function acknowledgeSafetyAlert(alertId) {
    const id = String(alertId || "").trim();
    if (!id || !currentUser || !currentProfile) return;
    const alert = fieldMessages.find(item => item.id === id);
    const existing = Array.isArray(currentProfile.safetyAlertAcknowledgements)
      ? currentProfile.safetyAlertAcknowledgements.filter(item => item?.alertId !== id)
      : [];
    const acknowledgement = {
      alertId: id,
      alertTitle: String(alert?.title || alert?.safety?.noticeType || "Safety alert").slice(0, 120),
      acknowledgedAtClient: new Date().toISOString(),
      acknowledgedBy: currentProfile.name || currentUser.displayName || currentUser.email || "MPI Admin"
    };
    currentProfile.safetyAlertAcknowledgements = [...existing, acknowledgement].slice(-200);
    markReplyRead(`field:${id}`);
    shared.db.collection("users").doc(currentUser.uid).set({
      safetyAlertAcknowledgements: currentProfile.safetyAlertAcknowledgements,
      safetyAlertsAcknowledgedAt: shared.serverTimestamp()
    }, { merge: true }).catch(() => {});
  }

  function updateOperationsNotificationBadge() {
    const total = adminInboxItems().filter(item => item.unread).length;
    if (replyCount) replyCount.textContent = total ? String(total) : "";
  }

  function adminInboxItems() {
    const currentUid = currentUser?.uid || "";
    const fieldItems = fieldMessages.map(message => {
      const safety = message.kind === "safety-alert";
      const coc = message.kind === "lab-coc";
      return {
        key: `field:${message.id}`,
        kind: "field",
        messageId: message.id,
        personId: message.senderUid || "",
        name: message.senderName || message.senderEmail || "MPI Field User",
        type: safety ? "Safety alert" : coc ? "Chain of Custody" : message.replyToUpdateId ? "Reply to office update" : "Message to office",
        body: message.message || (message.attachments?.length ? `${message.attachments.length} attachment${message.attachments.length === 1 ? "" : "s"}` : "Field message"),
        timestamp: message.createdAt || message.createdAtClient,
        unread: !readReplyKeys.has(`field:${message.id}`) && !(Array.isArray(message.readBy) && message.readBy.includes(currentUid)),
        safety,
        attachments: message.attachments || []
      };
    });
    const directByPerson = new Map();
    directMessages.forEach(message => {
      if (message.senderUid === currentUid) return;
      const otherUid = message.senderUid;
      if (!otherUid) return;
      const timestamp = asDate(message.createdAt || message.createdAtClient)?.getTime() || 0;
      const unread = !(Array.isArray(message.readBy) && message.readBy.includes(currentUid));
      const existing = directByPerson.get(otherUid);
      if (!existing || timestamp > existing.sortTime) {
        directByPerson.set(otherUid, {
          key: `direct:${otherUid}`,
          kind: "direct",
          personId: otherUid,
          name: message.senderName,
          type: "Private conversation",
          body: message.message || (message.attachments?.length ? `${message.attachments.length} attachment${message.attachments.length === 1 ? "" : "s"}` : "Private message"),
          timestamp: message.createdAt || message.createdAtClient,
          sortTime: timestamp,
          unread,
          attachments: message.attachments || []
        });
      } else if (unread) existing.unread = true;
    });
    const mirrored = new Set(fieldMessages.filter(item => item.replyToUpdateId).map(item => `${item.replyToUpdateId}:${item.senderUid}`));
    const receiptItems = inspectorReplies.filter(reply => !mirrored.has(`${reply.updateId}:${reply.userId}`)).map(reply => ({
      key: replyKey(reply),
      kind: "receipt",
      personId: reply.userId || "",
      name: reply.userName || reply.userEmail || "MPI Field User",
      type: "Reply to office update",
      body: reply.replyText || "Inspector replied",
      timestamp: reply.repliedAt || reply.updatedAt,
      unread: !readReplyKeys.has(replyKey(reply)),
      attachments: reply.attachments || []
    }));
    return [...fieldItems, ...directByPerson.values(), ...receiptItems]
      .sort((left, right) => (asDate(right.timestamp)?.getTime() || 0) - (asDate(left.timestamp)?.getTime() || 0));
  }

  function renderAdminUnifiedInbox() {
    if (!unifiedInboxList) return;
    const items = adminInboxItems();
    const unread = items.filter(item => item.unread).length;
    if (unifiedInboxSummary) unifiedInboxSummary.textContent = unread ? `${unread} unread` : "All caught up";
    if (replyCount) replyCount.textContent = unread ? String(unread) : "";
    unifiedInboxList.innerHTML = items.length ? items.map(item => {
      const files = item.attachments?.length ? ` · ${item.attachments.length} attachment${item.attachments.length === 1 ? "" : "s"}` : "";
      return `<button class="office-reply-card${item.unread ? " unread" : ""}${item.safety ? " safety" : ""}" type="button" data-admin-inbox-kind="${escapeHtml(item.kind)}" data-admin-inbox-key="${escapeHtml(item.key)}" data-admin-inbox-message="${escapeHtml(item.messageId || "")}" data-admin-inbox-person="${escapeHtml(item.personId || "")}"><div><strong>${escapeHtml(item.name || "MPI Team Member")}</strong><span class="admin-inbox-type">${escapeHtml(item.type)}</span>${item.unread ? '<span class="office-reply-new">Unread</span>' : ""}</div><div><span>${escapeHtml(item.body)}</span><small>${escapeHtml(files.replace(/^ · /, ""))}</small></div><time>${escapeHtml(formatDateTime(item.timestamp))}</time></button>`;
    }).join("") : '<div class="empty">No received messages yet. Inspector messages and private team conversations will appear here automatically.</div>';
    renderAdminSentMessages();
  }

  function directDeliveryState(message) {
    const targetUid = String(message?.targetUid || "");
    if (targetUid && Array.isArray(message?.readBy) && message.readBy.includes(targetUid)) return "read";
    if (targetUid && Array.isArray(message?.deliveredTo) && message.deliveredTo.includes(targetUid)) return "delivered";
    return "sent";
  }

  function deliveryStateHtml(state) {
    const value = ["read", "delivered"].includes(state) ? state : "sent";
    const label = value === "read" ? "✓✓ Read" : value === "delivered" ? "✓✓ Delivered" : "✓ Sent";
    return `<span class="delivery-state ${value}">${label}</span>`;
  }

  function renderAdminSentMessages() {
    if (!sentMessagesList) return;
    const sent = directMessages
      .filter(message => message.senderUid === currentUser?.uid)
      .sort((left, right) => (asDate(right.createdAt || right.createdAtClient)?.getTime() || 0) - (asDate(left.createdAt || left.createdAtClient)?.getTime() || 0))
      .slice(0, 50);
    if (sentMessagesSummary) {
      const total = sent.length + updates.length;
      sentMessagesSummary.textContent = total ? `${total} sent item${total === 1 ? "" : "s"}` : "Nothing sent yet";
    }
    sentMessagesList.innerHTML = sent.length ? sent.map(message => {
      const files = message.attachments?.length ? `${message.attachments.length} attachment${message.attachments.length === 1 ? "" : "s"}` : "";
      const state = directDeliveryState(message);
      return `<button class="office-reply-card" type="button" data-admin-sent-person="${escapeHtml(message.targetUid || "")}"><div><strong>To ${escapeHtml(message.targetName || message.targetEmail || "MPI Team Member")}</strong><span class="admin-inbox-type">Private message</span>${deliveryStateHtml(state)}</div><div><span>${escapeHtml(message.message || "Attachment sent")}</span><small>${escapeHtml(files)}</small></div><time>${escapeHtml(formatDateTime(message.createdAt || message.createdAtClient))}</time></button>`;
    }).join("") : '<div class="empty">No private messages have been sent from this account.</div>';
  }

  function renderSafetyAlerts() {
    if (!safetyAlertCenter || !safetyAlertList) return;
    const alerts = unreadSafetyAlerts();
    unreadSafetyCount = alerts.length;
    safetyAlertCenter.hidden = !alerts.length;
    if (safetyAlertCount) safetyAlertCount.textContent = String(alerts.length);
    safetyAlertList.innerHTML = alerts.map(alert => {
      const details = alert.safety || {};
      const informed = Array.isArray(details.peopleInformed) && details.peopleInformed.length
        ? details.peopleInformed.join(", ")
        : "Not recorded";
      return `<article class="safety-alert-card" data-safety-alert-id="${escapeHtml(alert.id)}"><header><div><span class="safety-critical-badge">Immediate review required</span><h4>${escapeHtml(details.noticeType || alert.title || "Safety event")}</h4></div><time>${escapeHtml(formatDateTime(alert.createdAt || alert.createdAtClient))}</time></header><div class="safety-alert-meta"><span><strong>Inspector:</strong> ${escapeHtml(alert.senderName || alert.senderEmail || "MPI Inspector")}</span><span><strong>Location:</strong> ${escapeHtml(details.property || "Not supplied")}</span><span><strong>Occurred:</strong> ${escapeHtml(formatDateTime(details.occurredAt))}</span></div><div class="safety-alert-facts">${escapeHtml(details.facts || alert.message || "Safety notice submitted.")}</div>${details.immediateAction ? `<p class="safety-alert-detail"><strong>Immediate action:</strong> ${escapeHtml(details.immediateAction)}</p>` : ""}${details.decision ? `<p class="safety-alert-detail"><strong>Inspection decision:</strong> ${escapeHtml(details.decision)}</p>` : ""}<p class="safety-alert-detail"><strong>People informed:</strong> ${escapeHtml(informed)}</p>${details.followUp ? `<p class="safety-alert-detail"><strong>Follow-up requested:</strong> ${escapeHtml(details.followUp)}</p>` : ""}<p class="safety-alert-receipt-note">Acknowledge the safety record here. Any follow-up conversation stays in Messages.</p><button class="primary" type="button" data-acknowledge-safety="${escapeHtml(alert.id)}">ACKNOWLEDGE SAFETY ALERT</button></article>`;
    }).join("");
    updateOperationsNotificationBadge();
  }

  function processFieldMessages(snapshot) {
    const values = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => item.active !== false);
    const ids = new Set(values.map(item => item.id));
    if (fieldMessageListenerReady) {
      const fresh = values.filter(item => !knownFieldMessageIds.has(item.id));
      if (fresh.length) {
        const ordered = fresh.sort((left, right) => (asDate(right.createdAt)?.getTime() || 0) - (asDate(left.createdAt)?.getTime() || 0));
        const latest = ordered.find(item => item.kind === "safety-alert") || ordered[0];
        const safety = latest.kind === "safety-alert";
        showOfficeAlert(
          safety ? latest.title || "URGENT MPI SAFETY ALERT" : `Message from ${latest.senderName || "MPI Field User"}`,
          safety ? `${latest.senderName || "MPI Inspector"} · ${latest.safety?.property || "Location not supplied"} · ${latest.message || "Safety notice submitted."}` : latest.message || `${latest.attachments?.length || 1} field photo attached.`,
          safety ? `mpi-safety-${latest.id}` : `mpi-field-${latest.id}`
        );
      }
    }
    fieldMessages = values;
    shared.markFieldMessagesDelivered?.(currentUser, values).catch(() => false);
    knownFieldMessageIds = ids;
    fieldMessageListenerReady = true;
    renderSafetyAlerts();
    renderAdminUnifiedInbox();
    renderOperationsStats();
    refreshAdminInboxConversation();
  }

  function processReplySnapshot(snapshot) {
    const values = snapshot.docs.map(doc => ({
      id: doc.id,
      path: doc.ref.path,
      updateId: doc.ref.parent.parent?.id || doc.data().updateId || "",
      ...doc.data()
    }));
    updateReceiptRecords = values;
    const replies = values.filter(item => item.status === "replied" || item.replyText);
    const nextKeys = new Set(replies.map(replyKey));
    if (replyListenerReady) {
      const newReplies = replies.filter(reply => !knownReplyKeys.has(replyKey(reply)) && replyIsForCurrentAdmin(reply));
      if (newReplies.length) {
        const latest = newReplies.sort((left, right) => (asDate(right.repliedAt)?.getTime() || 0) - (asDate(left.repliedAt)?.getTime() || 0))[0];
        showOfficeAlert(`Reply from ${latest.userName || "MPI Inspector"}`, latest.replyText || "A new inspector reply is available.", `mpi-reply-${latest.updateId}-${latest.userId}`);
      }
    }
    inspectorReplies = replies;
    knownReplyKeys = nextKeys;
    replyListenerReady = true;
    renderAdminUnifiedInbox();
    messageReceiptCache.clear();
    values.forEach(receipt => {
      if (receipt.updateId && receipt.userId) messageReceiptCache.set(`${receipt.updateId}:${receipt.userId}`, receipt);
    });
    renderUpdates();
  }

  function notificationTokensForUpdate(audience, targetEmail = "", targetUid = "") {
    return [...new Set(people.filter(person => {
      const role = String(person.role || "").toLowerCase();
      if (person.active === false) return false;
      if (audience === "all") return ["owner", "inspector", "subcontractor"].includes(role);
      return ["owner", "admin", "inspector", "subcontractor"].includes(role) && (person.id === targetUid || shared.normalizeEmail(person.email) === shared.normalizeEmail(targetEmail));
    }).map(person => person.notificationDevice?.token || person.officeNotificationDevice?.token).filter(Boolean))];
  }

  function officeReplyToken() {
    return String(currentProfile?.officeNotificationDevice?.token || savedOfficePushToken() || "").trim();
  }

  function validAttachment(file) {
    return /^(application\/pdf|image\/(jpeg|png|webp|heic|heif))$/i.test(file?.type || "") || /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file?.name || "");
  }

  function renderSelectedFiles() {
    attachmentList.innerHTML = selectedFiles.map((file, index) => `<div class="attachment-item"><span class="attachment-kind">${attachmentKind(file)}</span><span><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(formatFileSize(file.size))}</small></span><button class="attachment-remove" type="button" data-remove-attachment="${index}">REMOVE</button></div>`).join("");
  }

  function addSelectedFiles(files) {
    publishStatus.textContent = "";
    publishStatus.className = "status";
    for (const file of [...files]) {
      if (!validAttachment(file)) {
        publishStatus.textContent = `${file.name} is not a supported PDF or image.`;
        publishStatus.className = "status error";
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        publishStatus.textContent = `${file.name} is larger than 8 MB.`;
        publishStatus.className = "status error";
        continue;
      }
      const duplicate = selectedFiles.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
      if (!duplicate) selectedFiles.push(file);
    }
    if (selectedFiles.length > MAX_ATTACHMENT_FILES) {
      selectedFiles = selectedFiles.slice(0, MAX_ATTACHMENT_FILES);
      publishStatus.textContent = "A maximum of 5 files can be attached to one update.";
      publishStatus.className = "status error";
    }
    while (selectedFiles.reduce((total, file) => total + file.size, 0) > MAX_ATTACHMENT_TOTAL_BYTES) selectedFiles.pop();
    if ([...files].length && selectedFiles.reduce((total, file) => total + file.size, 0) >= MAX_ATTACHMENT_TOTAL_BYTES) {
      publishStatus.textContent = "Attachments are limited to 12 MB total per update.";
      publishStatus.className = "status error";
    }
    attachmentInput.value = "";
    renderSelectedFiles();
  }

  function fileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",").pop() || "");
      reader.onerror = () => reject(new Error(`${file.name} could not be read.`));
      reader.readAsDataURL(file);
    });
  }

  async function uploadAttachments(updateRef, files, audience, targetEmail, statusElement = publishStatus, targetUid = "") {
    const attachments = [];
    for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
      const file = files[fileIndex];
      if (statusElement) statusElement.textContent = `Uploading ${fileIndex + 1} of ${files.length}: ${file.name}`;
      const encoded = await fileAsBase64(file);
      const pieces = [];
      for (let offset = 0; offset < encoded.length; offset += ATTACHMENT_CHUNK_LENGTH) pieces.push(encoded.slice(offset, offset + ATTACHMENT_CHUNK_LENGTH));
      const attachmentRef = updateRef.collection("attachments").doc();
      const metadata = {
        id: attachmentRef.id,
        name: String(file.name || "MPI attachment").slice(0, 160),
        type: file.type || (/\.pdf$/i.test(file.name) ? "application/pdf" : "application/octet-stream"),
        size: file.size,
        chunkCount: pieces.length
      };
      await attachmentRef.set({ ...metadata, audience, targetEmail, targetUid, active: true, createdAt: shared.serverTimestamp(), createdBy: currentUser.uid });
      for (let start = 0; start < pieces.length; start += 6) {
        await Promise.all(pieces.slice(start, start + 6).map((data, part) => attachmentRef.collection("chunks").doc(String(start + part).padStart(4, "0")).set({ index: start + part, data, audience, targetEmail, targetUid, active: true })));
      }
      attachments.push(metadata);
    }
    return attachments;
  }

  function chatAttachmentHtml() {
    return `<label class="attachment-drop chat-attachment-drop" data-chat-drop tabindex="0"><span class="upload-icon"><svg class="app-icon"><use href="#icon-upload"></use></svg></span><span><strong>Drop a PDF or images here</strong><span>or click to choose · up to 5 files</span></span><input type="file" data-chat-files accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif" multiple hidden></label><div class="attachment-list" data-chat-file-list></div>`;
  }

  function addChatFiles(formElement, files) {
    const status = formElement.querySelector("[data-message-status], #adminMessageStatus");
    const current = Array.isArray(formElement._mpiFiles) ? formElement._mpiFiles : [];
    for (const file of [...files]) {
      if (!validAttachment(file)) {
        if (status) status.textContent = `${file.name} is not a supported PDF or image.`;
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        if (status) status.textContent = `${file.name} is larger than 8 MB.`;
        continue;
      }
      if (!current.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) current.push(file);
    }
    formElement._mpiFiles = current.slice(0, MAX_ATTACHMENT_FILES);
    while (formElement._mpiFiles.reduce((total, file) => total + file.size, 0) > MAX_ATTACHMENT_TOTAL_BYTES) formElement._mpiFiles.pop();
    renderChatFiles(formElement);
  }

  function renderChatFiles(formElement) {
    const list = formElement.querySelector("[data-chat-file-list]");
    if (!list) return;
    list.innerHTML = (formElement._mpiFiles || []).map((file, index) => `<div class="attachment-item"><span class="attachment-kind">${attachmentKind(file)}</span><span><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(formatFileSize(file.size))}</small></span><button class="attachment-remove" type="button" data-remove-chat-file="${index}">REMOVE</button></div>`).join("");
  }

  function adminAttachmentsHtml(update) {
    const attachments = Array.isArray(update?.attachments) ? update.attachments : [];
    if (!attachments.length) return "";
    return `<div class="admin-attachments"><strong>${attachments.length} attached file${attachments.length === 1 ? "" : "s"}</strong>${attachments.map(file => `<button class="admin-attachment-open" type="button" data-open-admin-attachment="${escapeHtml(file.id)}" data-update-id="${escapeHtml(update.id)}"><span>${escapeHtml(attachmentKind(file))} · ${escapeHtml(file.name)} · ${escapeHtml(formatFileSize(file.size))}</span><span>OPEN ↗</span></button>`).join("")}</div>`;
  }

  function fieldAttachmentsHtml(message) {
    const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
    if (!attachments.length) return "";
    return `<div class="admin-attachments"><strong>${attachments.length} field photo${attachments.length === 1 ? "" : "s"}</strong>${attachments.map(file => `<button class="admin-attachment-open" type="button" data-open-field-attachment="${escapeHtml(file.id)}" data-field-message-id="${escapeHtml(message.id)}"><span>IMG · ${escapeHtml(file.name)} · ${escapeHtml(formatFileSize(file.size))}</span><span>OPEN ↗</span></button>`).join("")}</div>`;
  }

  function directAttachmentsHtml(message) {
    const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
    if (!attachments.length) return "";
    return `<div class="admin-attachments"><strong>${attachments.length} attached file${attachments.length === 1 ? "" : "s"}</strong>${attachments.map(file => `<button class="admin-attachment-open" type="button" data-open-direct-attachment="${escapeHtml(file.id)}" data-direct-message-id="${escapeHtml(message.id)}"><span>${escapeHtml(attachmentKind(file))} · ${escapeHtml(file.name)} · ${escapeHtml(formatFileSize(file.size))}</span><span>OPEN ↗</span></button>`).join("")}</div>`;
  }

  async function openDirectAttachment(button) {
    const message = directMessages.find(item => item.id === button.dataset.directMessageId);
    const attachment = message?.attachments?.find(item => item.id === button.dataset.openDirectAttachment);
    if (!message || !attachment) return;
    button.disabled = true;
    try {
      const blob = await shared.loadDirectAttachment(message.id, attachment);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name || "MPI-team-attachment";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } catch (error) {
      publishStatus.textContent = error?.message || "The team attachment could not be opened.";
      publishStatus.className = "status error";
    } finally {
      button.disabled = false;
    }
  }

  async function openFieldAttachment(button) {
    const message = fieldMessages.find(item => item.id === button.dataset.fieldMessageId);
    const attachment = message?.attachments?.find(item => item.id === button.dataset.openFieldAttachment);
    if (!message || !attachment) return;
    const viewer = window.open("about:blank", "_blank");
    button.disabled = true;
    try {
      const blob = await shared.loadFieldAttachment(message.id, attachment);
      const url = URL.createObjectURL(blob);
      if (viewer) viewer.location.replace(url);
      else {
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.name || "field-photo.jpg";
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } catch (error) {
      viewer?.close();
      publishStatus.textContent = error?.message || "The field photo could not be opened.";
      publishStatus.className = "status error";
    } finally {
      button.disabled = false;
    }
  }

  async function openAdminAttachment(button) {
    const update = updates.find(item => item.id === button.dataset.updateId);
    const attachment = update?.attachments?.find(item => item.id === button.dataset.openAdminAttachment);
    if (!update || !attachment) return;
    const viewer = window.open("about:blank", "_blank");
    button.disabled = true;
    const prior = button.lastElementChild?.textContent || "OPEN ↗";
    if (button.lastElementChild) button.lastElementChild.textContent = "LOADING…";
    try {
      const blob = await shared.loadOfficeAttachment(update.id, attachment);
      const url = URL.createObjectURL(blob);
      if (viewer) viewer.location.replace(url);
      else {
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.name || "MPI attachment";
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } catch (error) {
      viewer?.close();
      publishStatus.textContent = error.message || "The attachment could not be opened.";
      publishStatus.className = "status error";
    } finally {
      button.disabled = false;
      if (button.lastElementChild) button.lastElementChild.textContent = prior;
    }
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

  function lastLocationForDay(day) {
    const event = (day?.activity || []).slice().reverse().find(item => Number.isFinite(Number(item?.data?.latitude)) && Number.isFinite(Number(item?.data?.longitude)));
    if (event) return { latitude: Number(event.data.latitude), longitude: Number(event.data.longitude), timestamp: event.timestamp, label: event.property || actionLabels[event.action] || event.action };
    const sessions = day?.timeClock?.sessions || [];
    const session = sessions.slice().reverse().find(item => item?.clockOutLocation?.status === "recorded" || item?.clockInLocation?.status === "recorded");
    const location = session?.clockOutLocation?.status === "recorded" ? session.clockOutLocation : session?.clockInLocation;
    return location ? { latitude: Number(location.latitude), longitude: Number(location.longitude), timestamp: location.recordedAt || session.clockedOutAt || session.clockedInAt, label: "Recorded phone location" } : null;
  }

  function initials(value) {
    return String(value || "MPI").trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase() || "MPI";
  }

  function avatarHtml(person, extraClass = "") {
    const name = person?.name || person?.email || "MPI Inspector";
    const photoSource = person?.profilePhoto || person?.photoURL;
    const photo = photoSource
      ? `<img src="${escapeHtml(photoSource)}" alt="" referrerpolicy="no-referrer" onerror="this.nextElementSibling.hidden=false;this.remove()">`
      : "";
    return `<span class="inspector-avatar ${escapeHtml(extraClass)}">${photo}<b${photo ? " hidden" : ""}>${escapeHtml(initials(name))}</b></span>`;
  }

  function latestSyncDate(person, day = latestDay(person)) {
    return asDate(person?.operationsUpdatedAt) || asDate(day?.updatedAtClient) || asDate(person?.lastSeenAt);
  }

  function syncAgeLabel(person, day = latestDay(person)) {
    const date = latestSyncDate(person, day);
    if (!date) return "Waiting for first device sync";
    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return "Updated just now";
    if (minutes < 60) return `Updated ${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Updated ${hours} hr${hours === 1 ? "" : "s"} ago`;
    return `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  function driveTimeForDay(day, person = null) {
    const saved = day?.driveTime || {};
    const events = (person ? effectiveActivityForDay(person, day) : (Array.isArray(day?.activity) ? day.activity : []))
      .filter(item => asDate(item?.timestamp))
      .slice()
      .sort((left, right) => asDate(left.timestamp) - asDate(right.timestamp));
    if (!events.length) return saved;
    const eventTime = item => asDate(item?.timestamp)?.getTime() || 0;
    const minutesBetween = (start, end) => {
      const first = eventTime(start);
      const last = eventTime(end);
      return first && last > first ? Math.round((last - first) / 60000) : 0;
    };
    const destinations = events.filter(item => ["Arrived", "Arrived at lab", "Arrived home / end location"].includes(item.action));
    let morningMinutes = 0;
    let betweenJobMinutes = 0;
    let labMinutes = 0;
    let finalMinutes = 0;
    let previousDestinationAt = 0;
    let firstJobArrivalRecorded = false;
    destinations.forEach(arrival => {
      const arrivalAt = eventTime(arrival);
      if (arrival.action === "Arrived" && !firstJobArrivalRecorded) {
        const jobId = String(arrival.calendarEventId || arrival.jobId || "");
        const matchedOnMyWay = events.filter(item => item.action === "On My Way selected" && eventTime(item) < arrivalAt
          && (!jobId || String(item.calendarEventId || item.jobId || "") === jobId)).at(-1);
        const recentOnMyWay = events.filter(item => item.action === "On My Way selected"
          && eventTime(item) > previousDestinationAt && eventTime(item) < arrivalAt).at(-1);
        const onMyWay = matchedOnMyWay || recentOnMyWay;
        const labDeparture = events.filter(item => item.action === "Lab visit completed" && eventTime(item) < arrivalAt).at(-1);
        const departure = labDeparture && (!onMyWay || eventTime(labDeparture) > eventTime(onMyWay)) ? labDeparture : onMyWay;
        morningMinutes += minutesBetween(departure, arrival);
        firstJobArrivalRecorded = true;
        previousDestinationAt = arrivalAt;
        return;
      }
      const completion = events.filter(item => ["Final job completion", "Lab visit completed"].includes(item.action)
        && eventTime(item) > previousDestinationAt && eventTime(item) < arrivalAt).at(-1);
      const fallback = arrival.action === "Arrived at lab"
        ? events.filter(item => item.action === "Lab selected" && eventTime(item) > previousDestinationAt && eventTime(item) < arrivalAt).at(-1)
        : arrival.action === "Arrived"
          ? events.filter(item => item.action === "On My Way selected" && eventTime(item) > previousDestinationAt && eventTime(item) < arrivalAt).at(-1)
          : null;
      const minutes = minutesBetween(completion || fallback, arrival);
      if (arrival.action === "Arrived home / end location") finalMinutes += minutes;
      else if (arrival.action === "Arrived at lab" || completion?.action === "Lab visit completed") labMinutes += minutes;
      else betweenJobMinutes += minutes;
      if (arrival.action === "Arrived") firstJobArrivalRecorded = true;
      previousDestinationAt = arrivalAt;
    });
    const finalDeparture = events.filter(item => item.action === "Proceed home selected").at(-1);
    const finalArrival = events.filter(item => item.action === "Arrived home / end location" && (!finalDeparture || eventTime(item) >= eventTime(finalDeparture))).at(-1);
    const legacyClockOff = events.filter(item => item.action === "Clocked off" && finalDeparture && eventTime(item) >= eventTime(finalDeparture)).at(-1);
    if (finalDeparture && !finalArrival && legacyClockOff) finalMinutes += minutesBetween(finalDeparture, legacyClockOff);
    const calculated = {
      morningMinutes,
      betweenJobMinutes,
      labMinutes,
      finalMinutes,
      finalPending: Boolean(finalDeparture && !finalArrival && !legacyClockOff),
      totalMinutes: morningMinutes + betweenJobMinutes + labMinutes + finalMinutes
    };
    const hasRelevantCorrection = Boolean(person && correctionsFor(person, day).some(item => ["On My Way selected", "Arrived", "Final job completion", "Arrived at lab", "Lab visit completed", "Arrived home / end location", "Clocked off"].includes(item.targetAction)));
    return hasRelevantCorrection || Number(calculated.totalMinutes) >= Number(saved.totalMinutes || 0) ? calculated : saved;
  }

  function operativePeople() {
    return people.filter(person => person.active !== false && person.role !== "subcontractor" && (person.role === "inspector" || person.operationsCurrent || person.operationsDays?.length));
  }

  function preferredSubcontractors(source = people.filter(person => person.role === "subcontractor")) {
    const grouped = new Map();
    source.forEach(person => {
      const key = String(person.subcontractorKey || person.name || person.id || "subcontractor").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const existing = grouped.get(key);
      const score = value => (value?.subcontractorOnly ? 8 : 0) + (value?.subcontractorCurrent ? 4 : 0) + (value?.active !== false ? 2 : 0) + (!/@mpi\.local$/i.test(String(value?.email || "")) ? 1 : 0);
      if (!existing || score(person) > score(existing)) grouped.set(key, person);
    });
    return [...grouped.values()];
  }

  function officePeople() {
    return people.filter(person => person.active !== false && ["owner", "admin"].includes(String(person.role || "").toLowerCase()));
  }

  function subcontractorEntries() {
    const productionPeople = preferredSubcontractors(people.filter(person => person.active !== false && person.role === "subcontractor"));
    const entries = productionPeople.map(person => ({ id: `sub:${person.id}`, person, state: person.subcontractorCurrent, test: false }));
    const productionNames = new Set(productionPeople.map(person => String(person.name || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean));
    people.filter(person => person.active !== false && person.subcontractorTestCurrent?.test === true).forEach(person => {
      const testName = String(person.subcontractorTestCurrent?.subcontractorName || person.name || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!testName || !productionNames.has(testName)) entries.push({ id: `subtest:${person.id}`, person, state: person.subcontractorTestCurrent, test: true });
    });
    return entries;
  }

  function teamOverviewEntries() {
    return [
      ...operativePeople().map(person => ({ id: person.id, person, kind: "inspector" })),
      ...subcontractorEntries().map(entry => ({ ...entry, kind: "subcontractor" })),
      ...officePeople().filter(person => !operativePeople().some(fieldPerson => fieldPerson.id === person.id)).map(person => ({ id: `office:${person.id}`, person, kind: "office" }))
    ];
  }

  function liveLocationPeople() {
    const values = [
      ...operativePeople(),
      ...subcontractorEntries().filter(entry => !entry.test).map(entry => entry.person)
    ];
    return [...new Map(values.map(person => [person.id, person])).values()];
  }

  function liveWorkState(person) {
    const today = dateKey();
    const role = String(person?.role || "").toLowerCase();
    const operation = person?.operationsCurrent;
    if (operation?.date === today) {
      const status = String(operation.liveStatus || "NOT STARTED").toUpperCase();
      return { active: !["NOT STARTED", "CLOCKED OUT"].includes(status), status, date: today };
    }
    if (role === "subcontractor") {
      const record = person?.subcontractorCurrent || person?.subcontractorTestCurrent;
      const status = String(record?.status || "AVAILABLE / NO CURRENT JOB").toUpperCase();
      const recordDate = String(record?.date || record?.updatedAtClient || "").slice(0, 10);
      return { active: recordDate === today && !/AVAILABLE|NO CURRENT JOB|CLOCKED OUT/.test(status), status, date: recordDate };
    }
    return { active: false, status: "NOT STARTED", date: "" };
  }

  function liveLocationRecord(person) {
    const location = person?.liveLocation || {};
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    const recordedAt = asDate(location.recordedAtClient) || asDate(person?.liveLocationUpdatedAt);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !recordedAt) return null;
    return {
      latitude,
      longitude,
      recordedAt,
      accuracyFeet: Math.max(0, Math.round(Number(location.accuracyFeet) || 0)),
      workStatus: String(location.workStatus || "")
    };
  }

  function liveLocationAge(record) {
    if (!record?.recordedAt) return { minutes: Infinity, label: "No location yet", tone: "unavailable" };
    const minutes = Math.max(0, Math.floor((Date.now() - record.recordedAt.getTime()) / 60000));
    if (minutes < 1) return { minutes, label: "Updated just now", tone: "current" };
    if (minutes <= 7) return { minutes, label: `Updated ${minutes} min ago`, tone: "current" };
    if (minutes <= 15) return { minutes, label: `Delayed · ${minutes} min ago`, tone: "delayed" };
    return { minutes, label: `Stale · ${minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr`} ago`, tone: "stale" };
  }

  function ensureLiveLocationMap() {
    if (liveLocationMap || !liveLocationMapElement || !window.L) return liveLocationMap;
    liveLocationMap = window.L.map(liveLocationMapElement, { zoomControl: true, scrollWheelZoom: false }).setView([42.62, -83.25], 8);
    if (window.L.maplibreGL && window.maplibregl) {
      window.L.maplibreGL({ style: "https://tiles.openfreemap.org/styles/positron", attribution: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" }).addTo(liveLocationMap);
    } else {
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(liveLocationMap);
    }
    liveLocationLayer = window.L.layerGroup().addTo(liveLocationMap);
    liveLocationRouteLayer = window.L.layerGroup().addTo(liveLocationMap);
    return liveLocationMap;
  }

  function liveLocationValues() {
    return liveLocationPeople().map(person => {
      const state = liveWorkState(person);
      const location = liveLocationRecord(person);
      const age = liveLocationAge(location);
      const visibleLocation = state.active ? location : null;
      const statusAttempt = String(person?.liveLocationStatus?.status || "");
      return { person, state, location: visibleLocation, age, statusAttempt };
    });
  }

  function frameAllLiveLocations(map, plotted = liveLocationValues().filter(item => item.location)) {
    if (!map) return;
    liveLocationMapMode = "all";
    if (plotted.length === 1) map.setView([plotted[0].location.latitude, plotted[0].location.longitude], 10);
    else if (plotted.length > 1) map.fitBounds(plotted.map(item => [item.location.latitude, item.location.longitude]), { padding: [38, 38], maxZoom: 10 });
    else map.setView([42.62, -83.25], 8);
  }

  function updateLiveLocationControls() {
    const person = liveLocationPeople().find(item => item.id === selectedLiveLocationPersonId);
    const hasPeople = liveLocationPeople().length > 0;
    const selectedDate = liveRouteDate?.value || dateKey();
    const hasSchedule = allSchedulePlansForDate(selectedDate).length > 0 || Boolean(nextScheduleDateOnOrAfter(selectedDate));
    const allPlansShowing = liveLocationAllPlansVisible || (liveLocationMapMode === "all-plans" && liveLocationPlannedStops.length > 0);
    if (allPlansShowing) liveLocationAllPlansVisible = true;
    if (liveLocationAllPlans) {
      liveLocationAllPlans.disabled = !hasPeople || !hasSchedule || liveLocationRouteLoading;
      liveLocationAllPlans.textContent = liveLocationRouteLoading ? "LOADING…" : allPlansShowing ? "HIDE ALL INSPECTORS' JOBS" : "SHOW ALL INSPECTORS' JOBS";
    }
    if (liveLocationPlan) {
      liveLocationPlan.disabled = !person || liveLocationRouteLoading;
      liveLocationPlan.textContent = liveLocationRouteLoading ? "LOADING…" : liveLocationPlanVisible && !liveLocationAllPlansVisible ? "HIDE SELECTED INSPECTOR'S JOBS" : "SHOW SELECTED INSPECTOR'S JOBS";
    }
    if (liveLocationHistory) {
      liveLocationHistory.disabled = !person || liveLocationRouteLoading;
      liveLocationHistory.textContent = liveLocationRouteLoading ? "LOADING…" : liveLocationRouteVisible && !liveLocationPlanVisible && !liveLocationAllPlansVisible ? "HIDE ACTUAL ROUTE" : "SHOW ACTUAL ROUTE";
    }
    if (!liveLocationRouteStatus) return;
    if (!person && !liveLocationRouteStatus.dataset.result) liveLocationRouteStatus.textContent = "All inspectors selected. Choose a date, then show every inspector's jobs. Tap one inspector to see that person's plan or actual route.";
    else if (person && !liveLocationRouteVisible && !liveLocationRouteLoading) liveLocationRouteStatus.innerHTML = `<strong>${escapeHtml(canonicalTeamName(person))}</strong> selected. Choose a date, then show the Spectora job plan or actual route.`;
  }

  function routePerson({ preferSchedule = false } = {}) {
    const values = liveLocationPeople();
    let person = values.find(item => item.id === selectedLiveLocationPersonId) || null;
    if (!person && inspectorSelector?.value) person = values.find(item => item.id === inspectorSelector.value) || null;
    const selectedDate = liveRouteDate?.value || dateKey();
    const signedInFieldUser = currentUser?.uid ? values.find(item => item.id === currentUser.uid) || null : null;
    if (!person && signedInFieldUser && (!preferSchedule || (scheduleDayFor(signedInFieldUser, selectedDate)?.jobs || []).some(job => scheduleAddress(job)))) person = signedInFieldUser;
    if (!person && preferSchedule) person = values.find(item => (scheduleDayFor(item, selectedDate)?.jobs || []).some(job => scheduleAddress(job))) || null;
    if (!person && signedInFieldUser) person = signedInFieldUser;
    if (!person) person = values.find(item => operationDays(item).some(day => day?.date === selectedDate)) || values[0] || null;
    if (person && selectedLiveLocationPersonId !== person.id) {
      selectedLiveLocationPersonId = person.id;
      liveLocationMapMode = "focus";
      renderLiveLocationMap();
    }
    return person;
  }

  function renderLiveLocationMap() {
    if (!liveLocationPanel || !liveLocationList) return;
    const values = liveLocationValues();
    const spectoraDays = liveLocationPeople().reduce((total, person) => total + (Array.isArray(person?.spectoraScheduleDays) ? person.spectoraScheduleDays.length : 0), 0);
    if (spectoraScheduleStatus) spectoraScheduleStatus.innerHTML = spectoraDays
      ? `<strong>SPECTORA · READ ONLY</strong><span>${escapeHtml(spectoraDays)} synchronized inspector-day record${spectoraDays === 1 ? "" : "s"}. Route planning can display these appointments; no app action can alter Spectora.</span>`
      : '<strong>SPECTORA · READ ONLY</strong><span>Protected Spectora schedule feed is not connected yet. The route planner may temporarily use an inspector\'s synchronized phone/calendar schedule and will label that fallback clearly.</span>';
    const current = values.filter(item => item.location && item.age.tone === "current");
    const delayed = values.filter(item => item.location && item.age.tone !== "current");
    liveLocationList.innerHTML = values.length ? values.map(item => {
      const tone = !item.state.active ? "off-duty" : item.location ? item.age.tone : "unavailable";
      const locationDetail = !item.state.active
        ? "Not sharing · workday inactive"
        : item.location
          ? `${item.age.label}${item.location.accuracyFeet ? ` · accuracy ~${item.location.accuracyFeet} ft` : ""}`
          : item.statusAttempt === "permission-denied"
            ? "Location permission is blocked on phone"
            : "Waiting for the field app";
      const selected = item.person.id === selectedLiveLocationPersonId ? " selected" : "";
      const operational = operationalContextHtml(item.person, item.person?.operationsCurrent, "em");
      return `<button type="button" class="live-location-person ${escapeHtml(tone)}${selected}" data-live-location-person="${escapeHtml(item.person.id)}" aria-pressed="${selected ? "true" : "false"}"><span class="live-location-dot" aria-hidden="true"></span><div><strong>${escapeHtml(canonicalTeamName(item.person))}</strong><span>${escapeHtml(locationDetail)}</span>${operational}</div><b>${escapeHtml(item.state.status.replace(/_/g, " "))}</b></button>`;
    }).join("") : '<div class="empty">No active field users are configured.</div>';
    liveLocationStatus.textContent = current.length
      ? `${current.length} current position${current.length === 1 ? "" : "s"}${delayed.length ? ` · ${delayed.length} delayed` : ""}`
      : delayed.length
        ? `${delayed.length} delayed position${delayed.length === 1 ? "" : "s"}`
        : "Waiting for an active field device to share its location.";

    const map = ensureLiveLocationMap();
    if (!map || !liveLocationLayer) {
      liveLocationMapElement.innerHTML = '<div class="empty">The map tiles could not load. Location timestamps remain available beside the map.</div>';
      return;
    }
    liveLocationLayer.clearLayers();
    liveLocationMarkers = new Map();
    const plotted = values.filter(item => item.location);
    plotted.forEach(item => {
      const name = canonicalTeamName(item.person);
      const icon = window.L.divIcon({ className: "", html: `<span class="mpi-live-marker">${escapeHtml(initials(name))}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
      const marker = window.L.marker([item.location.latitude, item.location.longitude], { icon }).bindPopup(`<strong>${escapeHtml(name)}</strong><br>${escapeHtml(item.state.status.replace(/_/g, " "))}<br>${escapeHtml(item.age.label)}${item.location.accuracyFeet ? `<br>GPS accuracy about ${escapeHtml(item.location.accuracyFeet)} ft` : ""}`);
      liveLocationLayer.addLayer(marker);
      liveLocationMarkers.set(item.person.id, marker);
    });
    const signature = plotted.map(item => `${item.person.id}:${item.location.latitude}:${item.location.longitude}`).sort().join("|");
    if (signature !== liveLocationMapSignature && liveLocationMapMode === "all" && !liveLocationRouteVisible) {
      liveLocationMapSignature = signature;
      frameAllLiveLocations(map, plotted);
    } else if (liveLocationMapMode === "focus" && !liveLocationRouteVisible) {
      const selected = plotted.find(item => item.person.id === selectedLiveLocationPersonId);
      if (selected) map.panTo([selected.location.latitude, selected.location.longitude]);
    }
    updateLiveLocationControls();
    updateOperationalClocks();
    window.setTimeout(() => map.invalidateSize(), 0);
  }

  function hideHistoricalRoute({ keepSelection = true } = {}) {
    liveLocationRouteVisible = false;
    liveLocationPlanVisible = false;
    liveLocationAllPlansVisible = false;
    liveLocationRouteLoading = false;
    liveLocationPlannedStops = [];
    liveLocationCandidate = null;
    if (liveLocationRouteStatus) delete liveLocationRouteStatus.dataset.result;
    liveLocationRouteLayer?.clearLayers();
    if (!keepSelection) selectedLiveLocationPersonId = "";
    updateLiveLocationControls();
    renderLiveLocationMap();
  }

  function focusLiveLocationPerson(personId) {
    const item = liveLocationValues().find(value => value.person.id === personId);
    if (!item) return;
    if (selectedLiveLocationPersonId !== personId) hideHistoricalRoute({ keepSelection: true });
    selectedLiveLocationPersonId = personId;
    liveLocationMapMode = "focus";
    liveLocationRouteVisible = false;
    liveLocationPlanVisible = false;
    liveLocationAllPlansVisible = false;
    liveLocationPlannedStops = [];
    liveLocationCandidate = null;
    liveLocationRouteLayer?.clearLayers();
    renderLiveLocationMap();
    const marker = liveLocationMarkers.get(personId);
    if (item.location && liveLocationMap) {
      liveLocationMap.setView([item.location.latitude, item.location.longitude], 15);
      marker?.openPopup();
    }
    updateLiveLocationControls();
  }

  function routePointRecord(value) {
    const latitude = Number(value?.latitude);
    const longitude = Number(value?.longitude);
    const recordedAt = asDate(value?.recordedAtClient) || asDate(value?.recordedAt);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !recordedAt) return null;
    return { latitude, longitude, recordedAt, accuracyFeet: Math.max(0, Math.round(Number(value?.accuracyFeet) || 0)), workStatus: String(value?.workStatus || "") };
  }

  function operationalRoutePoints(person, selectedDate) {
    const day = operationDays(person).find(item => item?.date === selectedDate);
    const values = [];
    const add = (source, timestamp, workStatus = "") => {
      const latitude = Number(source?.latitude);
      const longitude = Number(source?.longitude);
      const recordedAt = asDate(source?.recordedAtClient) || asDate(source?.recordedAt) || asDate(timestamp);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !recordedAt) return;
      values.push({ latitude, longitude, recordedAt, accuracyFeet: Math.max(0, Math.round(Number(source?.accuracyFeet) || 0)), workStatus });
    };
    (Array.isArray(day?.activity) ? day.activity : []).forEach(event => add(event?.data, event?.timestamp, event?.action));
    (Array.isArray(day?.timeClock?.sessions) ? day.timeClock.sessions : []).forEach(session => {
      add(session?.clockInLocation, session?.clockedInAt, "Hours Worked started");
      add(session?.clockOutLocation, session?.clockedOutAt, "Clocked out");
    });
    if (String(person?.liveLocation?.workDate || "") === selectedDate) add(person.liveLocation, person?.liveLocationUpdatedAt, person?.liveLocation?.workStatus || "Latest recorded position");
    const deduped = new Map();
    values.sort((left, right) => left.recordedAt - right.recordedAt).forEach(point => {
      const key = `${point.recordedAt.getTime()}:${point.latitude.toFixed(5)}:${point.longitude.toFixed(5)}`;
      deduped.set(key, point);
    });
    return [...deduped.values()];
  }

  async function loadHistoricalRoute() {
    if (liveLocationRouteLoading) return;
    if (liveLocationRouteVisible && !liveLocationPlanVisible) {
      hideHistoricalRoute({ keepSelection: true });
      return;
    }
    if (liveLocationPlanVisible) {
      liveLocationRouteVisible = false;
      liveLocationPlanVisible = false;
      liveLocationAllPlansVisible = false;
      liveLocationPlannedStops = [];
      liveLocationCandidate = null;
      liveLocationRouteLayer?.clearLayers();
    }
    const person = routePerson();
    if (!person || !liveLocationMap || !liveLocationRouteLayer) return;
    const selectedDate = liveRouteDate?.value || dateKey();
    liveLocationRouteLoading = true;
    updateLiveLocationControls();
    if (liveLocationRouteStatus) liveLocationRouteStatus.textContent = `Loading ${canonicalTeamName(person)}'s recorded route…`;
    try {
      let points = [];
      let fallbackStops = false;
      if (localPreview) {
        const origin = liveLocationRecord(person);
        if (origin) points = [-0.035, -0.022, -0.01, 0].map((offset, index) => ({ latitude: origin.latitude + offset * .45, longitude: origin.longitude + offset, recordedAt: new Date(Date.now() - (3 - index) * 18 * 60000), accuracyFeet: origin.accuracyFeet, workStatus: origin.workStatus }));
      } else {
        const snapshot = await shared.db.collection("users").doc(person.id).collection("locationRouteDays").doc(selectedDate).collection("points").orderBy("recordedAtClient", "asc").limit(500).get();
        points = snapshot.docs.map(doc => routePointRecord(doc.data())).filter(Boolean);
      }
      if (!points.length) {
        points = operationalRoutePoints(person, selectedDate);
        fallbackStops = points.length > 0;
      }
      liveLocationRouteLayer.clearLayers();
      liveLocationRouteVisible = true;
      liveLocationPlanVisible = false;
      liveLocationAllPlansVisible = false;
      if (!points.length) {
        if (liveLocationRouteStatus) liveLocationRouteStatus.innerHTML = `<strong>${escapeHtml(canonicalTeamName(person))}</strong> has no uploaded GPS route or verified workflow locations for ${escapeHtml(new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))}.`;
        return;
      }
      const latLngs = points.map(point => [point.latitude, point.longitude]);
      if (points.length > 1) liveLocationRouteLayer.addLayer(window.L.polyline(latLngs, { color: "#2775b9", weight: 5, opacity: .85, lineJoin: "round" }));
      const start = points[0];
      const end = points.at(-1);
      liveLocationRouteLayer.addLayer(window.L.circleMarker([start.latitude, start.longitude], { radius: 7, color: "#fff", weight: 2, fillColor: "#28765e", fillOpacity: 1 }).bindPopup(`<strong>${escapeHtml(canonicalTeamName(person))}</strong><br>Route started ${escapeHtml(formatTime(start.recordedAt))}`));
      if (points.length > 1) liveLocationRouteLayer.addLayer(window.L.circleMarker([end.latitude, end.longitude], { radius: 7, color: "#fff", weight: 2, fillColor: "#9b3838", fillOpacity: 1 }).bindPopup(`<strong>${escapeHtml(canonicalTeamName(person))}</strong><br>Latest point ${escapeHtml(formatTime(end.recordedAt))}`));
      liveLocationMapMode = "route";
      if (points.length === 1) liveLocationMap.setView(latLngs[0], 14);
      else liveLocationMap.fitBounds(latLngs, { padding: [38, 38], maxZoom: 15 });
      if (liveLocationRouteStatus) liveLocationRouteStatus.innerHTML = fallbackStops
        ? `<strong>${escapeHtml(canonicalTeamName(person))}</strong> · ${escapeHtml(points.length)} verified workflow location${points.length === 1 ? "" : "s"} shown. A continuous GPS route was not uploaded for this date.`
        : `<strong>${escapeHtml(canonicalTeamName(person))}</strong> · ${escapeHtml(points.length)} route point${points.length === 1 ? "" : "s"} · ${escapeHtml(formatTime(start.recordedAt))}–${escapeHtml(formatTime(end.recordedAt))}`;
    } catch (error) {
      liveLocationRouteVisible = false;
      if (liveLocationRouteStatus) liveLocationRouteStatus.textContent = error?.message || "The route could not be loaded.";
    } finally {
      liveLocationRouteLoading = false;
      updateLiveLocationControls();
    }
  }

  function scheduleDayFor(person, selectedDate) {
    const spectoraDay = (Array.isArray(person?.spectoraScheduleDays) ? person.spectoraScheduleDays : []).find(day => day?.date === selectedDate);
    if (spectoraDay) return {
      date: selectedDate,
      source: "Spectora · read only",
      jobs: (Array.isArray(spectoraDay.jobs) ? spectoraDay.jobs : []).filter(job => !/cancel|delete/i.test(String(job?.status || ""))).map(job => ({
        id: String(job?.id || job?.spectoraJobId || ""),
        spectoraJobId: String(job?.spectoraJobId || job?.id || ""),
        property: String(job?.property || job?.propertyAddress || job?.address || ""),
        propertyAddress: String(job?.propertyAddress || job?.address || job?.property || ""),
        scheduledStart: job?.scheduledStart || "",
        scheduledEnd: job?.scheduledEnd || "",
        inspectorId: String(job?.inspectorId || ""),
        inspectorName: String(job?.inspectorName || person?.name || ""),
        clientName: String(job?.clientName || ""),
        clientPhone: String(job?.clientPhone || ""),
        notes: String(job?.notes || ""),
        latitude: job?.latitude === null || job?.latitude === "" || !Number.isFinite(Number(job?.latitude)) ? null : Number(job.latitude),
        longitude: job?.longitude === null || job?.longitude === "" || !Number.isFinite(Number(job?.longitude)) ? null : Number(job.longitude),
        matchedAddress: String(job?.matchedAddress || ""),
        services: Array.isArray(job?.services) ? job.services.map(String) : String(job?.services || "").split(",").map(value => value.trim()).filter(Boolean)
      }))
    };
    const syncedDay = operationDays(person).find(day => day?.date === selectedDate);
    return syncedDay ? { ...syncedDay, source: String(syncedDay.scheduleSource || "Inspector schedule sync") } : null;
  }

  function scheduleAddress(job) {
    return String(job?.propertyAddress || job?.address || job?.property || "").trim();
  }

  function scheduleServices(job) {
    const source = Array.isArray(job?.services) ? job.services : Array.isArray(job?.serviceNames) ? job.serviceNames : String(job?.services || job?.serviceNames || "").split(",");
    return source.map(value => String(value || "").trim()).filter(Boolean);
  }

  function censusGeocodeScheduleAddress(address) {
    return new Promise((resolve, reject) => {
      const callbackName = `mpiAdminGeocode_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const script = document.createElement("script");
      let settled = false;
      const cleanup = () => {
        delete window[callbackName];
        script.remove();
      };
      const finish = (error, result = null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        cleanup();
        if (error) reject(error);
        else resolve(result);
      };
      const timeout = window.setTimeout(() => finish(new Error("Address lookup timed out.")), 7000);
      window[callbackName] = data => {
        const match = data?.result?.addressMatches?.[0];
        const latitude = Number(match?.coordinates?.y);
        const longitude = Number(match?.coordinates?.x);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          finish(new Error("That address could not be located. Include the street, city, state and ZIP code."));
          return;
        }
        finish(null, { latitude, longitude, matchedAddress: String(match?.matchedAddress || address), provider: "US Census" });
      };
      script.onerror = () => finish(new Error("Address lookup is temporarily unavailable."));
      const endpoint = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
      endpoint.searchParams.set("address", String(address || "").slice(0, 300));
      endpoint.searchParams.set("benchmark", "Public_AR_Current");
      endpoint.searchParams.set("format", "jsonp");
      endpoint.searchParams.set("callback", callbackName);
      script.src = endpoint.toString();
      document.head.appendChild(script);
    });
  }

  async function geocodeScheduleAddress(addressOrJob) {
    const job = addressOrJob && typeof addressOrJob === "object" ? addressOrJob : null;
    const directLatitude = Number(job?.latitude);
    const directLongitude = Number(job?.longitude);
    if (job?.latitude !== null && job?.latitude !== "" && job?.longitude !== null && job?.longitude !== "" && Number.isFinite(directLatitude) && Number.isFinite(directLongitude)) {
      return { latitude: directLatitude, longitude: directLongitude, matchedAddress: String(job?.matchedAddress || ""), provider: "Synchronized schedule" };
    }
    const address = String(job ? scheduleAddress(job) : addressOrJob || "").trim();
    if (!address) return null;
    const key = `mpiAdminGeocode:${address.toLowerCase()}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude)) return saved;
    } catch (_) {}
    const result = await censusGeocodeScheduleAddress(address);
    try { localStorage.setItem(key, JSON.stringify(result)); } catch (_) {}
    return result;
  }

  function plannedDriveLink(person, jobs) {
    const addresses = jobs.map(scheduleAddress).filter(Boolean);
    if (!addresses.length) return "";
    const current = liveLocationRecord(person);
    const origin = current ? `${current.latitude},${current.longitude}` : String(person?.approvedEndAddress || addresses[0]);
    const destination = addresses.at(-1);
    const waypoints = addresses.length > 1 ? addresses.slice(0, -1).join("|") : "";
    return `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}`;
  }

  const PLAN_COLORS = ["#11186a", "#2775b9", "#28765e", "#9b3838", "#8a5b16", "#6a3aa8"];

  function allSchedulePlansForDate(selectedDate) {
    return liveLocationPeople().map((person, personIndex) => {
      const day = scheduleDayFor(person, selectedDate);
      const jobs = (Array.isArray(day?.jobs) ? day.jobs : [])
        .filter(job => scheduleAddress(job))
        .sort((left, right) => (asDate(left.scheduledStart)?.getTime() || 0) - (asDate(right.scheduledStart)?.getTime() || 0));
      return { person, personIndex, day, jobs };
    }).filter(plan => plan.jobs.length);
  }

  function nextScheduleDateOnOrAfter(selectedDate = dateKey()) {
    const minimum = String(selectedDate || dateKey());
    return liveLocationPeople()
      .flatMap(person => (Array.isArray(person?.spectoraScheduleDays) ? person.spectoraScheduleDays : [])
        .filter(day => String(day?.date || "") >= minimum && (Array.isArray(day?.jobs) ? day.jobs : []).some(job => !/cancel|delete/i.test(String(job?.status || "")) && scheduleAddress(job)))
        .map(day => String(day.date)))
      .sort()[0] || "";
  }

  function distanceMiles(left, right) {
    const radians = value => Number(value) * Math.PI / 180;
    const earthRadiusMiles = 3958.8;
    const latitudeDelta = radians(Number(right.latitude) - Number(left.latitude));
    const longitudeDelta = radians(Number(right.longitude) - Number(left.longitude));
    const startLatitude = radians(left.latitude);
    const endLatitude = radians(right.latitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
    return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  async function loadAllPlannedScheduleRoutes({ force = false } = {}) {
    if (liveLocationRouteLoading) return false;
    if (liveLocationAllPlansVisible && !force) {
      hideHistoricalRoute({ keepSelection: true });
      return false;
    }
    const requestedDate = liveRouteDate?.value || dateKey();
    let selectedDate = requestedDate;
    let plans = allSchedulePlansForDate(selectedDate);
    if (!plans.length) {
      const nextDate = nextScheduleDateOnOrAfter(selectedDate);
      if (nextDate) {
        selectedDate = nextDate;
        if (liveRouteDate) liveRouteDate.value = nextDate;
        plans = allSchedulePlansForDate(selectedDate);
      }
    }
    if (!plans.length) {
      liveLocationRouteStatus.innerHTML = `<strong>No synchronized future appointments</strong> are available on or after ${escapeHtml(formatDate(requestedDate))}. This view is read-only and can only show dates already supplied by the schedule sync.`;
      return false;
    }
    const map = ensureLiveLocationMap();
    if (!map || !liveLocationRouteLayer) return false;
    liveLocationRouteLoading = true;
    liveLocationPlanVisible = true;
    liveLocationAllPlansVisible = true;
    liveLocationRouteVisible = false;
    liveLocationCandidate = null;
    updateLiveLocationControls();
    liveLocationRouteStatus.textContent = `Mapping ${plans.reduce((total, plan) => total + plan.jobs.length, 0)} synchronized appointments across the field team…`;
    delete liveLocationRouteStatus.dataset.result;
    try {
      const locatedPlans = await Promise.all(plans.map(async plan => ({
        ...plan,
        located: (await Promise.all(plan.jobs.map(async (job, jobIndex) => ({
          job,
          jobIndex,
          coordinates: await geocodeScheduleAddress(job).catch(() => null)
        })))).filter(item => item.coordinates)
      })));
      liveLocationRouteLayer.clearLayers();
      liveLocationPlannedStops = [];
      locatedPlans.forEach(plan => {
        const name = canonicalTeamName(plan.person);
        const color = PLAN_COLORS[plan.personIndex % PLAN_COLORS.length];
        const latLngs = plan.located.map(item => [item.coordinates.latitude, item.coordinates.longitude]);
        if (latLngs.length > 1) liveLocationRouteLayer.addLayer(window.L.polyline(latLngs, { color, weight: 4, opacity: .76, dashArray: "8 8", lineJoin: "round" }));
        plan.located.forEach(item => {
          const stop = { ...item, person: plan.person, name, color };
          liveLocationPlannedStops.push(stop);
          const label = `${initials(name)}${item.jobIndex + 1}`;
          const icon = window.L.divIcon({ className: "", html: `<span class="mpi-plan-marker" style="background:${escapeHtml(color)}">${escapeHtml(label)}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
          liveLocationRouteLayer.addLayer(window.L.marker([item.coordinates.latitude, item.coordinates.longitude], { icon }).bindPopup(`<strong>${escapeHtml(name)} · Job ${item.jobIndex + 1}</strong><br>${escapeHtml(scheduleAddress(item.job))}<br>${escapeHtml(formatTime(item.job.scheduledStart))}<br>${escapeHtml(scheduleServices(item.job).join(" · ") || "Inspection")}`));
        });
      });
      if (!liveLocationPlannedStops.length) throw new Error("The synchronized addresses could not be placed on the map.");
      const latLngs = liveLocationPlannedStops.map(item => [item.coordinates.latitude, item.coordinates.longitude]);
      liveLocationRouteVisible = true;
      liveLocationMapMode = "all-plans";
      if (latLngs.length === 1) map.setView(latLngs[0], 13);
      else map.fitBounds(latLngs, { padding: [42, 42], maxZoom: 11 });
      const unmapped = locatedPlans.reduce((total, plan) => total + plan.jobs.length - plan.located.length, 0);
      const advanced = selectedDate !== requestedDate ? ` No jobs were scheduled for ${escapeHtml(formatDate(requestedDate))}, so the next scheduled date is shown.` : "";
      liveLocationRouteStatus.innerHTML = `<strong>${escapeHtml(formatDate(selectedDate))}</strong> · ${escapeHtml(liveLocationPlannedStops.length)} mapped appointment${liveLocationPlannedStops.length === 1 ? "" : "s"} for ${escapeHtml(locatedPlans.filter(plan => plan.located.length).length)} inspector${locatedPlans.filter(plan => plan.located.length).length === 1 ? "" : "s"}.${unmapped ? ` ${escapeHtml(unmapped)} address${unmapped === 1 ? " was" : "es were"} not recognized.` : ""}${advanced} Read-only planning view; Spectora data is unchanged.`;
      liveLocationRouteStatus.dataset.result = "success";
      return true;
    } catch (error) {
      liveLocationRouteVisible = false;
      liveLocationPlanVisible = false;
      liveLocationAllPlansVisible = false;
      liveLocationPlannedStops = [];
      liveLocationRouteStatus.textContent = error?.message || "The field-team job plan could not be loaded.";
      liveLocationRouteStatus.dataset.result = "error";
      console.warn("MPI schedule map could not be rendered", error);
      return false;
    } finally {
      liveLocationRouteLoading = false;
      updateLiveLocationControls();
    }
  }

  async function dropPlanningCandidatePin() {
    const address = String(liveCandidateAddress?.value || "").trim();
    if (!address || !liveCandidatePin) {
      if (liveLocationRouteStatus) liveLocationRouteStatus.textContent = "Enter the possible new job address first.";
      liveCandidateAddress?.focus();
      return;
    }
    liveCandidatePin.disabled = true;
    liveCandidatePin.textContent = "LOCATING…";
    try {
      if (!liveLocationAllPlansVisible) await loadAllPlannedScheduleRoutes({ force: true });
      const coordinates = await geocodeScheduleAddress(address);
      if (!coordinates) throw new Error("That address could not be located. Include the street, city, state and ZIP code.");
      if (!liveLocationRouteLayer) throw new Error("The planning map is not available.");
      const icon = window.L.divIcon({ className: "", html: '<span class="mpi-candidate-marker"><span>+</span></span>', iconSize: [40, 40], iconAnchor: [12, 36] });
      if (liveLocationCandidate?.marker) liveLocationRouteLayer.removeLayer(liveLocationCandidate.marker);
      const marker = window.L.marker([coordinates.latitude, coordinates.longitude], { icon, zIndexOffset: 1000 }).bindPopup(`<strong>Possible new job</strong><br>${escapeHtml(address)}<br>Planning pin only · not sent to Spectora`);
      liveLocationRouteLayer.addLayer(marker);
      marker.openPopup();
      liveLocationCandidate = { address, coordinates, marker };
      const finalStops = [...new Map(liveLocationPlannedStops.map(stop => [stop.person.id, stop])).values()]
        .map(stop => ({ name: stop.name, miles: distanceMiles(stop.coordinates, coordinates) }))
        .sort((left, right) => left.miles - right.miles);
      const bounds = [...liveLocationPlannedStops.map(stop => [stop.coordinates.latitude, stop.coordinates.longitude]), [coordinates.latitude, coordinates.longitude]];
      if (bounds.length > 1) liveLocationMap.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
      else liveLocationMap.setView(bounds[0], 13);
      const comparison = finalStops.slice(0, 4).map(item => `${item.name} ~${item.miles.toFixed(1)} mi`).join(" · ");
      liveLocationRouteStatus.innerHTML = `<strong>Possible job:</strong> ${escapeHtml(address)}.${comparison ? ` Straight-line distance from each operative's final mapped appointment: ${escapeHtml(comparison)}.` : ""} This planning pin is temporary and does not change Spectora.`;
    } catch (error) {
      liveLocationRouteStatus.textContent = error?.message || "The possible job could not be placed on the map.";
    } finally {
      liveCandidatePin.disabled = false;
      liveCandidatePin.textContent = "DROP PLANNING PIN";
    }
  }

  async function loadPlannedScheduleRoute() {
    if (liveLocationRouteLoading) return;
    if (liveLocationPlanVisible && !liveLocationAllPlansVisible) {
      hideHistoricalRoute({ keepSelection: true });
      return;
    }
    if (liveLocationRouteVisible) {
      liveLocationRouteVisible = false;
      liveLocationAllPlansVisible = false;
      liveLocationPlannedStops = [];
      liveLocationCandidate = null;
      liveLocationRouteLayer?.clearLayers();
    }
    const person = routePerson({ preferSchedule: true });
    if (!person || !liveLocationMap || !liveLocationRouteLayer) return;
    const selectedDate = liveRouteDate?.value || dateKey();
    const day = scheduleDayFor(person, selectedDate);
    const jobs = (Array.isArray(day?.jobs) ? day.jobs : []).filter(job => scheduleAddress(job)).sort((left, right) => (asDate(left.scheduledStart)?.getTime() || 0) - (asDate(right.scheduledStart)?.getTime() || 0));
    if (!jobs.length) {
      liveLocationRouteStatus.innerHTML = `<strong>${escapeHtml(canonicalTeamName(person))}</strong> has no synchronized Spectora appointments for ${escapeHtml(formatDate(selectedDate))}. The Spectora connector must supply that date before a planned route can be shown.`;
      return;
    }
    liveLocationRouteLoading = true;
    updateLiveLocationControls();
    liveLocationRouteStatus.textContent = `Mapping ${jobs.length} scheduled job${jobs.length === 1 ? "" : "s"}…`;
    try {
      const located = (await Promise.all(jobs.map(async (job, index) => ({ job, index, coordinates: await geocodeScheduleAddress(job).catch(() => null) })))).filter(item => item.coordinates);
      liveLocationRouteLayer.clearLayers();
      if (!located.length) throw new Error("The scheduled addresses could not be placed on the map.");
      const latLngs = located.map(item => [item.coordinates.latitude, item.coordinates.longitude]);
      if (latLngs.length > 1) liveLocationRouteLayer.addLayer(window.L.polyline(latLngs, { color: "#11186a", weight: 4, opacity: .72, dashArray: "8 8", lineJoin: "round" }));
      located.forEach(item => {
        const number = item.index + 1;
        const icon = window.L.divIcon({ className: "", html: `<span class="mpi-plan-marker">${number}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
        liveLocationRouteLayer.addLayer(window.L.marker([item.coordinates.latitude, item.coordinates.longitude], { icon }).bindPopup(`<strong>${number}. ${escapeHtml(scheduleAddress(item.job))}</strong><br>${escapeHtml(formatTime(item.job.scheduledStart))}<br>${escapeHtml(scheduleServices(item.job).join(" · ") || "Inspection")}`));
      });
      liveLocationPlanVisible = true;
      liveLocationAllPlansVisible = false;
      liveLocationPlannedStops = located.map(item => ({ ...item, person, name: canonicalTeamName(person), color: PLAN_COLORS[0] }));
      liveLocationCandidate = null;
      liveLocationRouteVisible = true;
      liveLocationMapMode = "plan";
      if (latLngs.length === 1) liveLocationMap.setView(latLngs[0], 13);
      else liveLocationMap.fitBounds(latLngs, { padding: [42, 42], maxZoom: 12 });
      const directions = plannedDriveLink(person, jobs);
      liveLocationRouteStatus.innerHTML = `<strong>${escapeHtml(canonicalTeamName(person))}</strong> · ${escapeHtml(day?.source || "Spectora")} · ${jobs.length} appointment${jobs.length === 1 ? "" : "s"} in scheduled-time order.${directions ? `<a class="route-plan-link" href="${escapeHtml(directions)}" target="_blank" rel="noopener">OPEN DRIVING ROUTE</a>` : ""}`;
    } catch (error) {
      liveLocationRouteVisible = false;
      liveLocationPlanVisible = false;
      liveLocationAllPlansVisible = false;
      liveLocationPlannedStops = [];
      liveLocationRouteStatus.textContent = error?.message || "The planned route could not be loaded.";
    } finally {
      liveLocationRouteLoading = false;
      updateLiveLocationControls();
    }
  }

  function showAllLiveLocations() {
    liveLocationRouteLayer?.clearLayers();
    liveLocationRouteVisible = false;
    liveLocationPlanVisible = false;
    liveLocationAllPlansVisible = false;
    liveLocationPlannedStops = [];
    liveLocationCandidate = null;
    selectedLiveLocationPersonId = "";
    liveLocationMapSignature = "";
    const map = ensureLiveLocationMap();
    frameAllLiveLocations(map);
    renderLiveLocationMap();
  }

  async function requestLiveLocationRefresh() {
    if (!currentUser || !shared.isAdminRole(currentProfile) || !liveLocationRefresh) return;
    const targets = liveLocationPeople().filter(person => liveWorkState(person).active);
    liveLocationRefresh.disabled = true;
    liveLocationRefresh.textContent = "REQUESTING…";
    const request = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requestedAtClient: new Date().toISOString(),
      requestedById: currentUser.uid,
      requestedByName: currentProfile?.name || currentUser.displayName || "MPI Office"
    };
    try {
      await shared.requestSpectoraScheduleRefresh?.();
      if (!targets.length) {
        liveLocationStatus.textContent = "Schedule refresh requested. No inspectors currently have an active workday location.";
        return;
      }
      const batch = shared.db.batch();
      targets.forEach(person => batch.set(shared.db.collection("users").doc(person.id), { liveLocationRequest: request }, { merge: true }));
      await batch.commit();
      liveLocationStatus.textContent = `Update requested from ${targets.length} active field device${targets.length === 1 ? "" : "s"}. Open phones respond immediately.`;
    } catch (error) {
      liveLocationStatus.textContent = error?.message || "The location update request could not be sent.";
    } finally {
      liveLocationRefresh.disabled = false;
      liveLocationRefresh.textContent = "UPDATE NOW";
    }
  }

  function overviewEntry(id) {
    return teamOverviewEntries().find(entry => entry.id === id) || null;
  }

  function unreadDirectFor(person) {
    return messagesFor(person).filter(message => message.senderUid !== currentUser?.uid && !(Array.isArray(message.readBy) && message.readBy.includes(currentUser?.uid))).length;
  }

  function operationDays(person) {
    const daysByDate = new Map();
    (Array.isArray(person?.operationsDays) ? person.operationsDays : []).forEach(day => {
      if (day?.date) daysByDate.set(day.date, mergeAdminOperationDay(daysByDate.get(day.date), day));
    });
    if (person?.operationsCurrent?.date) daysByDate.set(person.operationsCurrent.date, mergeAdminOperationDay(daysByDate.get(person.operationsCurrent.date), person.operationsCurrent));
    return [...daysByDate.values()];
  }

  function mergeAdminOperationDay(previous = null, incoming = null) {
    if (!previous) return incoming || {};
    if (!incoming) return previous;
    const mergeRows = (left, right, keyFn) => {
      const rows = new Map();
      [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])].forEach((item, index) => {
        const key = keyFn(item) || `row-${index}`;
        const existing = rows.get(key);
        if (!existing || JSON.stringify(item || {}).length >= JSON.stringify(existing || {}).length) rows.set(key, item);
      });
      return [...rows.values()];
    };
    const jobs = mergeRows(previous.jobs, incoming.jobs, item => String(item?.id || `${item?.property || ""}|${item?.scheduledStart || ""}`));
    const activity = mergeRows(previous.activity, incoming.activity, item => String(item?.id || `${item?.timestamp || ""}|${item?.action || ""}|${eventJobId(item)}`))
      .sort((left, right) => (asDate(left?.timestamp)?.getTime() || 0) - (asDate(right?.timestamp)?.getTime() || 0));
    const previousClock = previous.timeClock || null;
    const incomingClock = incoming.timeClock || null;
    const clockScore = clock => (Array.isArray(clock?.sessions) ? clock.sessions.length * 100000 : 0) + Number(clock?.workedMinutes || 0);
    const timeClock = clockScore(incomingClock) >= clockScore(previousClock) ? (incomingClock || previousClock) : (previousClock || incomingClock);
    const driveTime = Number(incoming.driveTime?.totalMinutes || 0) >= Number(previous.driveTime?.totalMinutes || 0)
      ? (incoming.driveTime || previous.driveTime) : (previous.driveTime || incoming.driveTime);
    const latest = (asDate(incoming.updatedAtClient)?.getTime() || 0) >= (asDate(previous.updatedAtClient)?.getTime() || 0) ? incoming : previous;
    return {
      ...previous,
      ...incoming,
      liveStatus: latest.liveStatus || incoming.liveStatus || previous.liveStatus,
      updatedAtClient: latest.updatedAtClient || incoming.updatedAtClient || previous.updatedAtClient,
      jobs,
      activity,
      timeClock,
      driveTime,
      readiness: incoming.readiness || previous.readiness || null,
      labStop: incoming.labStop || previous.labStop || null,
      dayComplete: incoming.dayComplete || previous.dayComplete || null,
      nachiTraining: incoming.nachiTraining || previous.nachiTraining || null,
      currentJob: incoming.currentJob || previous.currentJob || null,
      nextJob: incoming.nextJob || previous.nextJob || null
    };
  }

  function selectedDays(person) {
    const keys = new Set(rangeDateKeys());
    return operationDays(person).filter(day => keys.has(day.date)).sort((left, right) => String(left.date).localeCompare(String(right.date)));
  }

  function latestDay(person) {
    return selectedDays(person).at(-1) || null;
  }

  function selectedOperationDay(person, days = selectedDays(person)) {
    return days.find(day => day.date === selectedOperationDate) || days.at(-1) || null;
  }

  function correctionsFor(person, day) {
    return (Array.isArray(person?.adminCorrections) ? person.adminCorrections : [])
      .filter(item => item?.date === day?.date)
      .sort((left, right) => String(left.correctedAt || "").localeCompare(String(right.correctedAt || "")));
  }

  function eventJobId(item) {
    return String(item?.calendarEventId || item?.jobId || "");
  }

  function latestActionCorrection(person, day, action, jobId = "") {
    const wantedJob = String(jobId || "");
    return correctionsFor(person, day).filter(item => {
      if (item?.targetAction !== action) return false;
      if (!wantedJob) return true;
      return String(item.jobId || "") === wantedJob;
    }).at(-1) || null;
  }

  function rawActionTime(day, action, jobId = "") {
    const wantedJob = String(jobId || "");
    const event = (day?.activity || []).filter(item => item?.action === action && (!wantedJob || eventJobId(item) === wantedJob)).at(-1);
    if (event?.timestamp) return event.timestamp;
    if (action === "Morning readiness completed") return day?.readiness?.completedAt || day?.timeClock?.activityStartedAt || "";
    const job = (day?.jobs || []).find(item => String(item.id || "") === wantedJob);
    if (!job) return "";
    return ({
      "On My Way selected": job.onMyWayAt,
      Arrived: job.arrivedAt,
      "Inspection started": job.inspectionStartedAt,
      "Final job completion": job.completedAt
    })[action] || "";
  }

  function effectiveActionTime(person, day, action, jobId = "") {
    return latestActionCorrection(person, day, action, jobId)?.correctedValue || rawActionTime(day, action, jobId);
  }

  function effectiveActivityForDay(person, day) {
    const activity = (Array.isArray(day?.activity) ? day.activity : []).map(item => ({ ...item, data: item?.data ? { ...item.data } : {} }));
    const corrections = correctionsFor(person, day).filter(item => item?.targetAction && item?.correctedValue);
    corrections.forEach(correction => {
      const jobId = String(correction.jobId || "");
      const matching = activity.filter(item => item.action === correction.targetAction && (!jobId || eventJobId(item) === jobId));
      const target = correction.targetEventId
        ? activity.find(item => item.id === correction.targetEventId) || matching.at(-1)
        : matching.at(-1);
      if (target) {
        target.timestamp = correction.correctedValue;
        target.managementAdjusted = true;
        return;
      }
      activity.push({
        id: `admin-${correction.id}`,
        timestamp: correction.correctedValue,
        action: correction.targetAction,
        calendarEventId: jobId,
        jobId,
        property: correction.property || "",
        data: { reason: correction.reason || "", managementAdjusted: true },
        managementAdjusted: true
      });
    });
    return activity.sort((left, right) => (asDate(left.timestamp)?.getTime() || 0) - (asDate(right.timestamp)?.getTime() || 0));
  }

  function effectiveTimeClockFor(person, day) {
    if (!day?.timeClock) return null;
    const effective = shared.effectiveTimeClock
      ? shared.effectiveTimeClock(day.timeClock, day.date, person?.adminCorrections || [])
      : day.timeClock;
    if (!effective?.sessions?.length) return effective;
    const firstArrivedJob = (day?.jobs || [])
      .slice()
      .sort((left, right) => (asDate(left.scheduledStart)?.getTime() || 0) - (asDate(right.scheduledStart)?.getTime() || 0))
      .find(job => effectiveActionTime(person, day, "Arrived", job.id));
    const arrivalAdjustment = firstArrivedJob ? latestActionCorrection(person, day, "Arrived", firstArrivedJob.id) : null;
    const explicitStart = effective.startAdjustment;
    if (!arrivalAdjustment?.correctedValue || (explicitStart && String(explicitStart.correctedAt || "") >= String(arrivalAdjustment.correctedAt || ""))) return effective;
    const sessions = effective.sessions.map(session => ({ ...session }));
    const firstPaid = Number.isInteger(effective.paidSessionIndexes?.[0])
      ? effective.paidSessionIndexes[0]
      : sessions.findIndex(session => session?.clockedInAt && !["morning-readiness", "activity-only"].includes(String(session.startSource || "legacy-manual-clock")));
    if (firstPaid < 0) return effective;
    if (String(sessions[firstPaid]?.startSource || "").toLowerCase() === "nachi-training") return effective;
    sessions[firstPaid].clockedInAt = arrivalAdjustment.correctedValue;
    return { ...effective, sessions, hoursWorkedStartedAt: arrivalAdjustment.correctedValue, effectiveHoursWorkedStartedAt: arrivalAdjustment.correctedValue, startAdjustment: arrivalAdjustment };
  }

  function effectiveClockOut(person, day) {
    const effective = effectiveTimeClockFor(person, day);
    if (effective?.effectiveClockedOutAt) return effective.effectiveClockedOutAt;
    const sessions = day?.timeClock?.sessions || [];
    const savedClockOut = sessions.at(-1)?.clockedOutAt;
    if (savedClockOut) return savedClockOut;
    const activityClockOut = (day?.activity || []).filter(item => item.action === "Clocked off").at(-1);
    return activityClockOut?.data?.clockedOutAt || activityClockOut?.timestamp || day?.dayComplete?.completedAt || "";
  }

  function workedTimeAuditForDay(person, day) {
    if (!day?.timeClock || !shared.workedTimeAudit) return { milliseconds: 0, intervals: [], issues: [] };
    const allowOpen = day.date === dateKey()
      && day.liveStatus !== "CLOCKED OUT"
      && !day.dayComplete?.completedAt;
    return shared.workedTimeAudit(day.timeClock, day.date, person?.adminCorrections || [], Date.now(), {
      allowOpen,
      fallbackEnd: effectiveClockOut(person, day)
    });
  }

  function workedMinutes(person, day) {
    if (!day?.timeClock) return 0;
    const effective = effectiveTimeClockFor(person, day);
    if (!effective?.sessions?.length) {
      const fallback = Math.max(0, Number(day.timeClock.workedMinutes) || 0);
      return fallback <= 18 * 60 ? Math.floor(fallback) : 0;
    }
    if (shared.workedTimeAudit) return Math.floor(workedTimeAuditForDay(person, day).milliseconds / 60000);
    return 0;
  }

  function weeklyMinutes(person) {
    return operationDays(person).filter(day => rangeDateKeys("week").includes(day.date)).reduce((total, day) => total + workedMinutes(person, day), 0);
  }

  function weeklyDayBreakdownHtml(person, metric = "hours") {
    const week = operationDays(person).filter(day => rangeDateKeys("week").includes(day.date)).sort((left, right) => String(left.date).localeCompare(String(right.date)));
    return `<details class="ops-breakdown"><summary>View daily breakdown</summary><div class="fact-list">${week.length ? week.map(day => {
      const minutes = metric === "drive" ? Number(driveTimeForDay(day, person)?.totalMinutes) || 0 : workedMinutes(person, day);
      const issues = metric === "hours" ? workedTimeAuditForDay(person, day).issues : [];
      return `<button class="fact daily-breakdown-row${day.date === selectedOperationDate ? " selected" : ""}" type="button" data-open-operation-day="${escapeHtml(day.date)}"><span>${escapeHtml(new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }))}${issues.length ? `<small>Needs time correction</small>` : ""}</span><strong>${issues.length ? "REVIEW" : formatMinutes(minutes)}</strong></button>`;
    }).join("") : '<div class="empty">No recorded days this week.</div>'}</div></details>`;
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

  function operationalDuration(milliseconds) {
    const minutes = Math.max(0, Math.floor(Number(milliseconds || 0) / 60000));
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
  }

  function estimatedArrivalFor(day, job) {
    const direct = asDate(job?.estimatedArrivalAt || job?.etaAt);
    if (direct) return { date: direct, source: "recorded ETA" };
    const jobId = String(job?.id || "");
    const etaEvent = (day?.activity || []).filter(item => {
      const matchesJob = !jobId || !eventJobId(item) || eventJobId(item) === jobId;
      return matchesJob && /^\d{2}:\d{2}$/.test(String(item?.data?.etaTime || ""));
    }).at(-1);
    if (etaEvent?.data?.etaTime) {
      const [hours, minutes] = etaEvent.data.etaTime.split(":").map(Number);
      const base = asDate(etaEvent.timestamp) || asDate(job?.onMyWayAt) || new Date(`${day?.date || dateKey()}T12:00:00`);
      const eta = new Date(base);
      eta.setHours(hours, minutes, 0, 0);
      return { date: eta, source: "inspector ETA" };
    }
    const departed = asDate(job?.onMyWayAt);
    const driveMinutes = Math.max(0, Number(job?.estimatedDriveMinutes) || 0);
    if (departed && driveMinutes) return { date: new Date(departed.getTime() + driveMinutes * 60000), source: "estimated drive" };
    return null;
  }

  function operationalStatusContext(person, suppliedDay = null) {
    const day = suppliedDay || (person?.operationsCurrent?.date === dateKey() ? person.operationsCurrent : latestDay(person));
    const status = String(day?.liveStatus || "").toUpperCase();
    const current = day?.currentJob || nextAppointment(day);
    if (/INSPECTION IN PROGRESS/.test(status)) {
      const started = asDate(current?.inspectionStartedAt) || asDate(rawActionTime(day, "Inspection started", current?.id));
      if (started) return { type: "elapsed", timestamp: started.toISOString(), prefix: "Inspection running", text: `Inspection running ${operationalDuration(Date.now() - started.getTime())}` };
    }
    if (/ARRIVED AT JOB/.test(status)) {
      const arrived = asDate(current?.arrivedAt) || asDate(rawActionTime(day, "Arrived", current?.id));
      if (arrived) return { type: "elapsed", timestamp: arrived.toISOString(), prefix: "At property", text: `At property ${operationalDuration(Date.now() - arrived.getTime())}` };
    }
    if (/DRIVING TO (?:JOB|NEXT JOB)/.test(status)) {
      const eta = estimatedArrivalFor(day, current);
      if (eta?.date) {
        const remaining = Math.max(0, eta.date.getTime() - Date.now());
        return { type: "eta", timestamp: eta.date.toISOString(), prefix: "ETA", text: `ETA ${formatTime(eta.date)} · ${remaining ? `${operationalDuration(remaining)} remaining` : "due now"}` };
      }
      const appointment = asDate(current?.scheduledStart);
      if (appointment) return { type: "static", text: `ETA not recorded · appointment ${formatTime(appointment)}` };
    }
    return null;
  }

  function operationalContextHtml(person, day, tag = "small") {
    const context = operationalStatusContext(person, day);
    if (!context) return "";
    const dynamic = context.type === "elapsed"
      ? ` data-operational-elapsed="${escapeHtml(context.timestamp)}" data-operational-prefix="${escapeHtml(context.prefix)}"`
      : context.type === "eta"
        ? ` data-operational-eta="${escapeHtml(context.timestamp)}"`
        : "";
    return `<${tag} class="operational-context"${dynamic}>${escapeHtml(context.text)}</${tag}>`;
  }

  function updateOperationalClocks() {
    document.querySelectorAll("[data-operational-elapsed]").forEach(element => {
      const started = asDate(element.dataset.operationalElapsed);
      if (started) element.textContent = `${element.dataset.operationalPrefix || "In progress"} ${operationalDuration(Date.now() - started.getTime())}`;
    });
    document.querySelectorAll("[data-operational-eta]").forEach(element => {
      const eta = asDate(element.dataset.operationalEta);
      if (!eta) return;
      const remaining = Math.max(0, eta.getTime() - Date.now());
      element.textContent = `ETA ${formatTime(eta)} · ${remaining ? `${operationalDuration(remaining)} remaining` : "due now"}`;
    });
  }

  function meaningfulAlerts(person, day) {
    const alerts = Array.isArray(day?.alerts) ? day.alerts.slice() : [];
    (day?.jobs || []).forEach(job => {
      const evidence = job.arrivalLocation;
      if (evidence?.verificationStatus !== "arrival-location-review-required") return;
      const reviewed = arrivalReviewHistory(person, String(evidence.arrivalEventId || `${job.id}|${job.arrivedAt || ""}`)).at(-1);
      if (!reviewed) alerts.push(`${job.property || "Inspection appointment"}: arrival location requires management review.`);
    });
    if (day?.readiness && ["denied", "default"].includes(day.readiness.notificationPermission)) alerts.push("Important notification permissions are not fully enabled.");
    operationDays(person).filter(item => rangeDateKeys("week").includes(item.date)).forEach(item => {
      workedTimeAuditForDay(person, item).issues.forEach(issue => alerts.push(`${formatDate(item.date)}: ${issue.message}`));
    });
    if (weeklyMinutes(person) >= 38 * 60) alerts.push("Weekly hours are approaching the configured 40-hour review point.");
    return [...new Set(alerts)].slice(0, 10);
  }

  function showView(name) {
    currentAdminView = name;
    tabButtons.forEach(button => button.classList.toggle("active", button.dataset.adminView === name));
    panels.forEach(panel => panel.classList.toggle("active", panel.dataset.adminPanel === name));
    if (operationsSummary) operationsSummary.hidden = name !== "operations";
    if (commentUsagePanel) commentUsagePanel.hidden = name !== "operations" || !isPrimaryOwner();
    if (name === "operations") renderCommentUsageAllowance();
    if (name === "requests") markNewRequestsReviewed();
  }

  function correctionDraftIsActive() {
    const correctionForm = document.getElementById("adminCorrectionForm");
    if (!correctionForm) return false;
    if (correctionForm.contains(document.activeElement)) return true;
    return Boolean(
      correctionForm.querySelector("#adminCorrectionValue")?.value
      || correctionForm.querySelector("#adminCorrectionReason")?.value.trim()
      || correctionForm.querySelector("#adminCorrectionJob")?.value
      || correctionForm.querySelector("#adminCorrectionAction")?.selectedIndex > 0
    );
  }

  function renderTargetOptions() {
    const selected = targetInput.value;
    const fieldPeople = [
      ...people.filter(person => person.active !== false && person.role === "inspector"),
      ...preferredSubcontractors(people.filter(person => person.active !== false && person.role === "subcontractor"))
    ];
    targetInput.innerHTML = '<option value="">Choose field user</option>' + fieldPeople.map(person => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.name || person.email || "MPI Field User")} — ${escapeHtml(person.role === "subcontractor" ? "Subcontractor" : "Inspector")}</option>`).join("");
    if (fieldPeople.some(person => person.id === selected)) targetInput.value = selected;
  }

  function renderInspectorSelector() {
    const selected = selectedInspectorId;
    const entries = teamOverviewEntries().filter(entry => entry.kind !== "office" && !entry.test);
    inspectorSelector.innerHTML = '<option value="all">All inspectors</option>' + entries.map(entry => `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.kind === "subcontractor" ? `${entry.state?.subcontractorName || entry.person.name || entry.person.email} — Subcontractor` : entry.person.name || entry.person.email)}</option>`).join("");
    selectedInspectorId = entries.some(entry => entry.id === selected) ? selected : "all";
    inspectorSelector.value = selectedInspectorId;
  }

  function teamRoleLabel(roleValue) {
    return ({ owner: "Owner", admin: "Office admin", inspector: "Inspector", subcontractor: "Subcontractor" })[String(roleValue || "inspector").toLowerCase()] || "Team member";
  }

  function renderTrainingProfiles() {
    if (!trainingList) return;
    const records = people.filter(person => person.active !== false);
    trainingList.innerHTML = records.length ? records.map(person => {
      const recordUrl = /^https:\/\//i.test(String(person.nachiTranscriptUrl || "")) ? person.nachiTranscriptUrl : "";
      const memberNumber = String(person.inspectorId || "").trim();
      return `<article class="training-admin-card"><div class="inspector-identity">${avatarHtml(person)}<div><strong>${escapeHtml(canonicalTeamName(person))}</strong><span>${escapeHtml(teamRoleLabel(person.role))}</span></div></div><div><small>InterNACHI / inspector number</small><strong>${escapeHtml(memberNumber || "Not supplied")}</strong></div><div><small>Official education record</small><strong>${recordUrl ? "Connected by team member" : "Awaiting profile connection"}</strong><span>MPI stores the link only — never their InterNACHI password.</span></div>${recordUrl ? `<a href="${escapeHtml(recordUrl)}" target="_blank" rel="noopener">OPEN OFFICIAL RECORD</a>` : '<small>Team member can add this from My Profile.</small>'}</article>`;
    }).join("") : '<div class="empty">No active team profiles are available.</div>';
  }

  function renderPeople() {
    renderTargetOptions();
    renderInspectorSelector();
    if (inboxComposeRecipient) {
      const selectedRecipient = inboxComposeRecipient.value;
      const recipients = people.filter(person => person.active !== false && person.id !== currentUser?.uid);
      inboxComposeRecipient.innerHTML = '<option value="">Choose team member</option>' + recipients.map(person => `<option value="${escapeHtml(person.id)}">${escapeHtml(canonicalTeamName(person))} · ${escapeHtml(teamRoleLabel(person.role))}</option>`).join("");
      if (recipients.some(person => person.id === selectedRecipient)) inboxComposeRecipient.value = selectedRecipient;
    }
    const accountPeople = [...people.filter(person => person.role !== "subcontractor"), ...preferredSubcontractors()];
    peopleList.innerHTML = accountPeople.length ? accountPeople.map(person => `
      <article class="person-card" data-person-id="${escapeHtml(person.id)}">
        <div class="person-main inspector-identity">${avatarHtml(person)}<div><span class="person-role-badge ${escapeHtml(String(person.role || "inspector").toLowerCase())}">${escapeHtml(teamRoleLabel(person.role))}</span><strong>${escapeHtml(person.name || "MPI Team Member")}</strong><small>${escapeHtml(person.email || "Secure company phone access")}</small><small>${person.role === "subcontractor" ? "External field partner" : person.inspectorId ? `Inspector number: ${escapeHtml(person.inspectorId)}` : "Inspector number not assigned"}</small></div></div>
        <div class="person-controls">
          <input data-person-inspector-id aria-label="Inspector number for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.inspectorId || "")}" maxlength="40" placeholder="Inspector number" ${person.role === "owner" ? "disabled" : ""}>
          <input data-person-phone aria-label="Phone number for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.phone || "")}" maxlength="30" placeholder="Phone number" ${person.role === "owner" ? "disabled" : ""}>
          <input data-person-end-address aria-label="Approved home or end location for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.approvedEndAddress || "")}" maxlength="180" placeholder="Approved home / end location" ${person.role === "owner" ? "disabled" : ""}>
          <select data-person-role aria-label="Role for ${escapeHtml(person.name || person.email)}" ${person.role === "owner" ? "disabled" : ""}>
            <option value="inspector" ${person.role === "inspector" ? "selected" : ""}>Inspector</option>
            <option value="subcontractor" ${person.role === "subcontractor" ? "selected" : ""}>Subcontractor</option>
            <option value="admin" ${person.role === "admin" ? "selected" : ""}>Office admin</option>
            ${shared.isOwnerEmail(currentUser?.email) ? `<option value="owner" ${person.role === "owner" ? "selected" : ""}>Owner</option>` : ""}
          </select>
          <label class="check" style="padding:8px"><input data-person-active type="checkbox" ${person.active !== false ? "checked" : ""} ${person.role === "owner" ? "disabled" : ""}><span>Active</span></label>
        </div>
        <details class="person-profile-details"><summary>Contact, emergency &amp; professional profile</summary><div class="person-controls"><input data-person-job-title aria-label="Job title for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.jobTitle || "")}" maxlength="80" placeholder="Job title" ${person.role === "owner" ? "disabled" : ""}><input data-person-personal-address aria-label="Personal address for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.personalAddress || "")}" maxlength="180" placeholder="Personal address" ${person.role === "owner" ? "disabled" : ""}><input data-person-emergency-name aria-label="Emergency contact for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.emergencyContactName || "")}" maxlength="80" placeholder="Emergency contact" ${person.role === "owner" ? "disabled" : ""}><input data-person-emergency-phone aria-label="Emergency phone for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.emergencyContactPhone || "")}" maxlength="30" placeholder="Emergency phone" ${person.role === "owner" ? "disabled" : ""}><input data-person-transcript-url aria-label="InterNACHI record link for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.nachiTranscriptUrl || "")}" maxlength="500" placeholder="InterNACHI transcript / education URL" ${person.role === "owner" ? "disabled" : ""}>${person.nachiTranscriptUrl ? `<a class="secondary" href="${escapeHtml(person.nachiTranscriptUrl)}" target="_blank" rel="noopener">OPEN TRAINING RECORD</a>` : ""}</div></details>
        ${person.role === "subcontractor" ? `<div class="subcontractor-access-actions"><button class="secondary" type="button" data-copy-subcontractor-link="${escapeHtml(person.id)}">COPY APP ACTIVATION LINK</button><button class="danger" type="button" data-revoke-subcontractor="${escapeHtml(person.id)}">REVOKE SUBCONTRACTOR ACCESS</button><span class="status" data-subcontractor-access-status></span></div>` : ""}
      </article>`).join("") : '<div class="empty">No company accounts have signed in yet.</div>';
    renderTrainingProfiles();
    renderOperations();
    renderSubcontractors();
    renderRequestTodos();
    renderDiagnostics();
  }

  function allDiagnosticReports() {
    return people.flatMap(person => (Array.isArray(person.appDiagnostics) ? person.appDiagnostics : []).map(report => ({
      person,
      report: { ...report, status: String(report?.status || "NEW").toUpperCase() }
    }))).filter(item => item.report?.id).sort((left, right) => {
      const leftTime = asDate(left.report.submittedAtClient || left.report.createdAtClient)?.getTime() || 0;
      const rightTime = asDate(right.report.submittedAtClient || right.report.createdAtClient)?.getTime() || 0;
      return rightTime - leftTime;
    });
  }

  function diagnosticTechnicalDetail(report) {
    return {
      build: report.build,
      availableBuild: report.availableBuild,
      device: report.device || {},
      connectivity: report.connectivity || {},
      authentication: report.authentication || "unknown",
      synchronization: report.sync || {},
      workflow: report.workflow || {},
      permissions: report.permissions || {},
      gps: report.gps || {},
      safeRepairs: report.repairs || [],
      recentCommentBuilderFailures: report.commentFailures || [],
      recentApplicationErrors: report.recentAppErrors || []
    };
  }

  function renderDiagnostics() {
    if (!diagnosticList) return;
    const all = allDiagnosticReports();
    const active = all.filter(item => item.report.status !== "RESOLVED");
    const newCount = all.filter(item => item.report.status === "NEW").length;
    if (diagnosticCount) diagnosticCount.textContent = newCount ? String(newCount) : "";
    if (diagnosticSummary) diagnosticSummary.textContent = all.length
      ? `${active.length} active · ${newCount} new · ${all.length} total submitted`
      : "No diagnostic reports have been submitted.";
    const filter = diagnosticStatusFilter?.value || "active";
    const records = all.filter(item => filter === "all" ? true : filter === "active" ? item.report.status !== "RESOLVED" : item.report.status === filter);
    diagnosticList.innerHTML = records.length ? records.map(({ person, report }) => {
      const status = ["NEW", "INVESTIGATING", "RESOLVED"].includes(report.status) ? report.status : "NEW";
      const issues = Array.isArray(report.issues) ? report.issues : [];
      const repairs = Array.isArray(report.repairs) ? report.repairs : [];
      const submitted = report.submittedAtClient || report.createdAtClient;
      return `<article class="diagnostic-card ${escapeHtml(status.toLowerCase())}" data-diagnostic-person="${escapeHtml(person.id)}" data-diagnostic-id="${escapeHtml(report.id)}">
        <div class="diagnostic-head"><div><span class="ops-eyebrow">Field app diagnostic</span><h3>${escapeHtml(person.name || report.inspector?.name || person.email || "MPI Field User")}</h3><p>Submitted ${escapeHtml(formatDateTime(submitted))} · Build ${escapeHtml(report.build || "Unknown")}</p></div><span class="diagnostic-status">${escapeHtml(status)}</span></div>
        <p class="diagnostic-summary">${escapeHtml(report.summary || (issues.length ? `${issues.length} app issue(s) require review.` : "No common app issues detected."))}</p>
        ${issues.length ? `<ul class="diagnostic-issues">${issues.map(issue => `<li><strong>${escapeHtml(issue.label || issue.code || "App issue")}</strong>${issue.detail ? `<br>${escapeHtml(issue.detail)}` : ""}</li>`).join("")}</ul>` : '<p class="diagnostic-summary">✓ No unresolved issue was recorded by this app check.</p>'}
        ${repairs.length ? `<p class="diagnostic-summary"><strong>Safe recovery:</strong> ${escapeHtml(repairs.join(" "))}</p>` : ""}
        <div class="diagnostic-facts">
          <div class="diagnostic-fact"><span>Connection</span><strong>${escapeHtml(report.connectivity?.server || (report.connectivity?.online ? "Connected" : "Offline"))}</strong></div>
          <div class="diagnostic-fact"><span>Workflow</span><strong>${escapeHtml(report.workflow?.status || "Unknown")}</strong></div>
          <div class="diagnostic-fact"><span>Pending sync</span><strong>${escapeHtml(Number(report.sync?.pending || 0))}</strong></div>
          <div class="diagnostic-fact"><span>Location</span><strong>${escapeHtml(report.permissions?.location || report.gps?.status || "Unknown")}</strong></div>
        </div>
        <details class="diagnostic-details"><summary>Technical details</summary><pre>${escapeHtml(JSON.stringify(diagnosticTechnicalDetail(report), null, 2))}</pre></details>
        <div class="diagnostic-controls"><label>Issue status<select data-diagnostic-status><option value="NEW" ${status === "NEW" ? "selected" : ""}>New</option><option value="INVESTIGATING" ${status === "INVESTIGATING" ? "selected" : ""}>Investigating</option><option value="RESOLVED" ${status === "RESOLVED" ? "selected" : ""}>Resolved</option></select></label><span data-diagnostic-save-status>${report.reviewedBy ? `Last updated by ${escapeHtml(report.reviewedBy)} · ${escapeHtml(formatDateTime(report.reviewedAtClient))}` : "Status changes are saved with the administrator and time."}</span></div>
      </article>`;
    }).join("") : '<div class="empty">No app diagnostics match this status.</div>';
  }

  async function updateDiagnosticStatus(select) {
    const card = select.closest("[data-diagnostic-person]");
    const person = people.find(item => item.id === card?.dataset.diagnosticPerson);
    const reportId = String(card?.dataset.diagnosticId || "");
    if (!person || !reportId || !currentUser || !shared.isAdminRole(currentProfile)) return;
    const status = String(select.value || "NEW").toUpperCase();
    if (!["NEW", "INVESTIGATING", "RESOLVED"].includes(status)) return;
    const statusText = card.querySelector("[data-diagnostic-save-status]");
    select.disabled = true;
    if (statusText) statusText.textContent = "Saving status…";
    const reviewedAtClient = new Date().toISOString();
    const reviewedBy = currentProfile?.name || currentUser.displayName || currentUser.email || "MPI Admin";
    const reports = (Array.isArray(person.appDiagnostics) ? person.appDiagnostics : []).map(report => {
      if (report?.id !== reportId) return report;
      const history = Array.isArray(report.statusHistory) ? report.statusHistory.slice(-19) : [];
      history.push({ status, reviewedAtClient, reviewedBy, adminUserId: currentUser.uid });
      return { ...report, status, reviewedAtClient, reviewedBy, statusHistory: history };
    });
    try {
      await shared.db.collection("users").doc(person.id).set({ appDiagnostics: reports, diagnosticsUpdatedAt: shared.serverTimestamp() }, { merge: true });
      person.appDiagnostics = reports;
      renderDiagnostics();
    } catch (error) {
      select.disabled = false;
      if (statusText) statusText.textContent = error?.message || "Status could not be saved.";
    }
  }

  function subcontractorDisplayStatus(state) {
    const job = state?.currentJob || { number: state?.currentJobNumber || 1, status: "ready" };
    if (state?.lab?.status === "on-way") return `ON WAY TO ${String(state.lab.name || "LAB").toUpperCase()}`;
    if (state?.lab?.status === "arrived") return `AT ${String(state.lab.name || "LAB").toUpperCase()}`;
    if (job.status === "on-way") return `ON WAY – JOB ${job.number || 1}`;
    if (job.status === "arrived") return `AT JOB – JOB ${job.number || 1}`;
    if (job.status === "completed") return `JOB ${job.number || 1} COMPLETE / AVAILABLE`;
    if (/LAB COMPLETE/i.test(String(state?.status || ""))) return "LAB COMPLETE / AVAILABLE";
    return state?.status || "AVAILABLE / NO CURRENT JOB";
  }

  function subcontractorStateCard(person, state, isTest = false) {
    const job = state?.currentJob || { number: 1, status: "ready" };
    const events = Array.isArray(state?.events) ? state.events.slice(-8).reverse() : [];
    const status = subcontractorDisplayStatus(state);
    const completedAt = job.completedAt || state?.completedJobs?.at?.(-1)?.completedAt || "";
    const title = isTest ? (state?.subcontractorName || "TEST SUBCONTRACTOR") : (person.name || person.email || "MPI Subcontractor");
    const phone = state?.subcontractorPhone || person.phone || "";
    return `<article class="subcontractor-admin-card${isTest ? " test" : ""}" data-subcontractor-person="${escapeHtml(person.id)}" data-subcontractor-test="${isTest ? "1" : "0"}">
      <div class="subcontractor-admin-head"><div><span class="ops-eyebrow">${isTest ? "Safe test record" : "Subcontractor"}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(isTest ? `${phone || "No phone recorded"} · test data excluded from employee records` : [person.email, phone].filter(Boolean).join(" · "))}</p></div><span class="subcontractor-admin-badge">${escapeHtml(status)}</span></div>
      <div class="subcontractor-admin-facts">
        <div class="subcontractor-admin-fact"><span>Current job</span><strong>Job ${escapeHtml(job.number || state?.currentJobNumber || 1)}</strong></div>
        <div class="subcontractor-admin-fact"><span>On Way</span><strong>${escapeHtml(formatTime(job.onWayAt))}</strong></div>
        <div class="subcontractor-admin-fact"><span>Arrived</span><strong>${escapeHtml(formatTime(job.arrivedAt))}</strong></div>
        <div class="subcontractor-admin-fact"><span>Completed</span><strong>${escapeHtml(formatTime(completedAt))}</strong></div>
      </div>
      <div class="subcontractor-admin-events">${events.length ? events.map(item => `<div><strong>${escapeHtml(item.type || "Status updated")}</strong><span>${escapeHtml(formatTime(item.timestamp))}${item.lab ? ` · ${escapeHtml(item.lab)}` : ""}</span></div>`).join("") : '<div><strong>No actions yet</strong><span>Waiting for phone</span></div>'}</div>
      ${!isTest ? `<div class="subcontractor-access-actions"><button class="secondary" type="button" data-copy-subcontractor-link="${escapeHtml(person.id)}">COPY APP ACTIVATION LINK</button><button class="danger" type="button" data-revoke-subcontractor="${escapeHtml(person.id)}">REVOKE SUBCONTRACTOR ACCESS</button><span class="status" data-subcontractor-access-status></span></div>` : ""}
      ${isTest ? '<button class="danger" type="button" data-reset-admin-test-subcontractor>RESET TEST DAY</button>' : ""}
    </article>`;
  }

  function renderSubcontractors() {
    if (!subcontractorList) return;
    const cards = [];
    people.filter(person => person.active !== false && person.role === "subcontractor").forEach(person => {
      cards.push(subcontractorStateCard(person, person.subcontractorCurrent, false));
    });
    people.filter(person => person.active !== false && person.subcontractorTestCurrent?.test === true).forEach(person => {
      cards.push(subcontractorStateCard(person, person.subcontractorTestCurrent, true));
    });
    subcontractorList.innerHTML = cards.length ? cards.join("") : '<div class="empty">No subcontractor activity has synchronized yet. Assign the Subcontractor role in Team, or open Test Subcontractor from the phone Settings screen.</div>';
  }

  function allInspectorRequests() {
    return people.flatMap(person => (Array.isArray(person.fieldRequests) ? person.fieldRequests : []).map(request => ({ ...request, ownerUserId: person.id, ownerName: person.name || request.inspector || person.email, ownerEmail: person.email || request.inspectorEmail || "" })));
  }

  function requestDueState(request) {
    if (request.status === "completed") return "complete";
    if (request.asap) return "asap";
    if (request.neededBy && request.neededBy < dateKey()) return "overdue";
    return "normal";
  }

  function requestNeedsAttention(request) {
    return String(request?.status || "new") === "new" && !request?.reviewedAt;
  }

  async function markNewRequestsReviewed() {
    if (reviewingRequests || !currentUser || !shared.isAdminRole(currentProfile)) return;
    const groups = people.map(person => ({
      person,
      ids: (Array.isArray(person.fieldRequests) ? person.fieldRequests : []).filter(requestNeedsAttention).map(item => item.id)
    })).filter(group => group.ids.length);
    if (!groups.length) return;
    reviewingRequests = true;
    const reviewedAt = new Date().toISOString();
    groups.forEach(({ person, ids }) => {
      person.fieldRequests.forEach(item => {
        if (!ids.includes(item.id)) return;
        item.reviewedAt = reviewedAt;
        item.reviewedBy = currentProfile.name || currentUser.displayName || currentUser.email;
      });
    });
    renderRequestTodos();
    try {
      await Promise.all(groups.map(({ person, ids }) => {
        const ref = shared.db.collection("users").doc(person.id);
        return shared.db.runTransaction(async transaction => {
          const snapshot = await transaction.get(ref);
          const requests = Array.isArray(snapshot.data()?.fieldRequests) ? snapshot.data().fieldRequests.map(item => ({ ...item })) : [];
          requests.forEach(request => {
            if (!ids.includes(request.id) || !requestNeedsAttention(request)) return;
            request.reviewedAt = reviewedAt;
            request.reviewedBy = currentProfile.name || currentUser.displayName || currentUser.email;
            request.updatedAt = reviewedAt;
          });
          transaction.set(ref, { fieldRequests: requests, requestsUpdatedAt: shared.serverTimestamp() }, { merge: true });
        });
      }));
    } finally {
      reviewingRequests = false;
    }
  }

  async function progressAssignedRequests(person) {
    const candidates = (Array.isArray(person?.fieldRequests) ? person.fieldRequests : [])
      .filter(item => item?.id && item.assignedAdmin && item.status === "new" && !assignedRequestMigrations.has(`${person.id}/${item.id}`));
    if (!candidates.length) return;
    candidates.forEach(item => assignedRequestMigrations.add(`${person.id}/${item.id}`));
    try {
      const ref = shared.db.collection("users").doc(person.id);
      await shared.db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const requests = Array.isArray(snapshot.data()?.fieldRequests) ? snapshot.data().fieldRequests.map(item => ({ ...item })) : [];
        let changed = false;
        requests.forEach(request => {
          if (!request.assignedAdmin || request.status !== "new") return;
          const assignee = people.find(item => shared.normalizeEmail(item.email) === shared.normalizeEmail(request.assignedAdmin));
          request.status = "in-progress";
          request.assignedAdminName = request.assignedAdminName || assignee?.name || request.assignedAdmin;
          request.assignedAt = request.assignedAt || new Date().toISOString();
          request.assignedBy = request.assignedBy || "MPI Office";
          request.updatedAt = new Date().toISOString();
          changed = true;
        });
        if (changed) transaction.set(ref, { fieldRequests: requests, requestsUpdatedAt: shared.serverTimestamp() }, { merge: true });
      });
    } catch (_) {
      candidates.forEach(item => assignedRequestMigrations.delete(`${person.id}/${item.id}`));
    }
  }

  function renderRequestTodos() {
    if (!requestList) return;
    const all = allInspectorRequests();
    const attention = all.filter(requestNeedsAttention);
    requestCount.textContent = attention.length ? String(attention.length) : "";
    const inspectors = [...new Map(all.map(item => [item.ownerUserId, item.ownerName])).entries()];
    const selectedInspector = requestInspectorFilter.value || "all";
    requestInspectorFilter.innerHTML = '<option value="all">All inspectors</option>' + inspectors.map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join("");
    requestInspectorFilter.value = inspectors.some(([id]) => id === selectedInspector) ? selectedInspector : "all";
    const types = [...new Set(all.map(item => item.type).filter(Boolean))].sort();
    const selectedType = requestTypeFilter.value || "all";
    requestTypeFilter.innerHTML = '<option value="all">All types</option>' + types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("");
    requestTypeFilter.value = types.includes(selectedType) ? selectedType : "all";
    const admins = people.filter(person => ["owner", "admin"].includes(person.role) && person.active !== false);
    const selectedAssignee = requestAssigneeFilter.value || "all";
    requestAssigneeFilter.innerHTML = '<option value="all">All admins</option><option value="unassigned">Unassigned</option>' + admins.map(admin => `<option value="${escapeHtml(admin.email)}">${escapeHtml(admin.name || admin.email)}</option>`).join("");
    requestAssigneeFilter.value = selectedAssignee === "unassigned" || admins.some(admin => admin.email === selectedAssignee) ? selectedAssignee : "all";
    let filtered = all.filter(item => {
      const statusMatch = requestStatusFilter.value === "all" || (requestStatusFilter.value === "active" ? item.status !== "completed" : item.status === requestStatusFilter.value);
      const assigneeMatch = requestAssigneeFilter.value === "all" || (requestAssigneeFilter.value === "unassigned" ? !item.assignedAdmin : item.assignedAdmin === requestAssigneeFilter.value);
      const requestedDate = String(item.requestedAt || "").slice(0, 10);
      return statusMatch && (requestInspectorFilter.value === "all" || item.ownerUserId === requestInspectorFilter.value) && (requestTypeFilter.value === "all" || item.type === requestTypeFilter.value) && assigneeMatch && (!requestDateFilter.value || requestedDate === requestDateFilter.value);
    });
    filtered.sort((left, right) => {
      if (requestSort.value === "oldest") return String(left.requestedAt || "").localeCompare(String(right.requestedAt || ""));
      if (requestSort.value === "newest") return String(right.requestedAt || "").localeCompare(String(left.requestedAt || ""));
      const rank = { overdue: 0, asap: 1, normal: 2, complete: 3 };
      return rank[requestDueState(left)] - rank[requestDueState(right)] || String(right.requestedAt || "").localeCompare(String(left.requestedAt || ""));
    });
    const requestCard = item => {
      const dueState = requestDueState(item);
      const assignee = admins.find(admin => shared.normalizeEmail(admin.email) === shared.normalizeEmail(item.assignedAdmin));
      const progress = item.status === "completed"
        ? `Completed by ${item.completedBy || assignee?.name || "MPI Office"}`
        : assignee
          ? `With ${assignee.name || assignee.email} · ${String(item.status || "in-progress").replace("-", " ")}`
          : "Unassigned · waiting for office action";
      return `<article class="request-admin-card ${escapeHtml(item.status || "new")}" data-request-owner="${escapeHtml(item.ownerUserId)}" data-request-id="${escapeHtml(item.id)}"><div class="request-admin-top"><div><span class="type-badge">${escapeHtml(item.type || "Request")}</span>${dueState === "asap" ? '<span class="priority-badge">ASAP</span>' : dueState === "overdue" ? '<span class="priority-badge">OVERDUE</span>' : ""}<h3>${escapeHtml(item.item || "Inspector request")}</h3></div><span class="role-badge">${escapeHtml(String(item.status || "new").replace("-", " "))}</span></div><p><strong>${escapeHtml(item.ownerName)}</strong> · Requested ${escapeHtml(formatDateTime(item.requestedAt))}${item.neededBy ? ` · Needed ${escapeHtml(formatDate(item.neededBy))}` : ""}</p><p><strong>Progress:</strong> ${escapeHtml(progress)}</p><p>${escapeHtml(item.details || "No detail supplied.")}</p>${item.suggestion ? `<p><strong>Suggested solution:</strong> ${escapeHtml(item.suggestion)}</p>` : ""}${item.managementNote ? `<div class="request-progress-note"><strong>Latest office progress</strong><span>${escapeHtml(item.managementNote)}</span></div>` : ""}<form class="request-admin-form" data-request-admin-form><div class="field"><label>Status</label><select data-request-status><option value="new" ${item.status === "new" ? "selected" : ""}>New</option><option value="in-progress" ${item.status === "in-progress" ? "selected" : ""}>In progress</option><option value="waiting" ${item.status === "waiting" ? "selected" : ""}>Waiting</option><option value="completed" ${item.status === "completed" ? "selected" : ""}>Completed</option></select></div><div class="field"><label>Assigned admin</label><select data-request-admin><option value="">Unassigned</option>${admins.map(admin => `<option value="${escapeHtml(admin.email)}" ${item.assignedAdmin === admin.email ? "selected" : ""}>${escapeHtml(admin.name || admin.email)}</option>`).join("")}</select></div><div class="field" data-request-completed-field ${item.status === "completed" ? "" : "hidden"}><label>Completed date</label><input data-request-completed type="date" value="${escapeHtml(item.completedAt ? String(item.completedAt).slice(0, 10) : "")}"></div><div class="field wide"><label>Internal management note</label><textarea data-request-note maxlength="1000" placeholder="Example: Order placed; awaiting delivery">${escapeHtml(item.managementNote || "")}</textarea></div><button class="primary" type="submit">SAVE PROGRESS</button><span class="status" data-request-save-status></span></form></article>`;
    };
    const groupDefinitions = [
      { status: "new", label: "New requests" },
      { status: "in-progress", label: "In progress" },
      { status: "waiting", label: "Waiting" },
      { status: "completed", label: "Completed" }
    ];
    requestList.innerHTML = filtered.length ? groupDefinitions.map(group => {
      const items = filtered.filter(item => String(item.status || "new") === group.status);
      return items.length ? `<section class="request-admin-group" data-request-group="${group.status}"><div class="request-admin-group-head"><h3>${group.label}</h3><span>${items.length}</span></div>${items.map(requestCard).join("")}</section>` : "";
    }).join("") : '<div class="empty">No requests match these filters.</div>';

    const newItems = all.filter(item => requestNeedsAttention(item) && !knownRequestIds.has(`${item.ownerUserId}/${item.id}`));
    if (knownRequestIds.size && newItems.length && "Notification" in window && Notification.permission === "granted") {
      const first = newItems[0];
      const notification = new Notification("New MPI Inspector Request", { body: `${first.ownerName}: ${first.item}`, icon: "./icon-192.png", tag: `mpi-request-${first.id}` });
      notification.onclick = () => { window.focus(); showView("requests"); };
    }
    knownRequestIds = new Set(all.map(item => `${item.ownerUserId}/${item.id}`));
  }

  async function saveRequestTodo(formElement) {
    const card = formElement.closest("[data-request-owner][data-request-id]");
    const person = people.find(item => item.id === card?.dataset.requestOwner);
    const requestId = card?.dataset.requestId;
    const previewRequest = (Array.isArray(person?.fieldRequests) ? person.fieldRequests : []).find(item => item.id === requestId);
    const status = formElement.querySelector("[data-request-save-status]");
    if (!person || !previewRequest) return;
    let nextStatus = formElement.querySelector("[data-request-status]").value;
    const assignedAdmin = formElement.querySelector("[data-request-admin]").value;
    const assignedAdminPerson = people.find(person => shared.normalizeEmail(person.email) === shared.normalizeEmail(assignedAdmin));
    if (assignedAdmin && nextStatus === "new") nextStatus = "in-progress";
    const managementNote = formElement.querySelector("[data-request-note]").value.trim();
    const completedDate = formElement.querySelector("[data-request-completed]").value;
    const changedAt = new Date().toISOString();
    const completedAt = nextStatus === "completed"
      ? (completedDate ? new Date(`${completedDate}T12:00:00`).toISOString() : previewRequest.completedAt || changedAt)
      : "";
    const completedBy = nextStatus === "completed" ? (currentProfile.name || currentUser.displayName || currentUser.email) : "";
    status.textContent = "Saving…";
    try {
      const ref = shared.db.collection("users").doc(person.id);
      await shared.db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const requests = Array.isArray(snapshot.data()?.fieldRequests) ? snapshot.data().fieldRequests.map(item => ({ ...item })) : [];
        const request = requests.find(item => item.id === requestId);
        if (!request) throw new Error("This request is no longer available.");
        request.status = nextStatus;
        const assignmentChanged = request.assignedAdmin !== assignedAdmin;
        request.assignedAdmin = assignedAdmin;
        request.assignedAdminName = assignedAdmin ? (assignedAdminPerson?.name || assignedAdmin) : "";
        if (assignmentChanged) {
          request.assignedAt = assignedAdmin ? new Date().toISOString() : "";
          request.assignedBy = assignedAdmin ? (currentProfile.name || currentUser.displayName || currentUser.email) : "";
        }
        request.managementNote = managementNote;
        request.completedAt = completedAt;
        request.completedBy = completedBy;
        request.reviewedAt = request.reviewedAt || changedAt;
        request.reviewedBy = request.reviewedBy || currentProfile.name || currentUser.displayName || currentUser.email;
        request.updatedAt = changedAt;
        transaction.set(ref, { fieldRequests: requests, requestsUpdatedAt: shared.serverTimestamp() }, { merge: true });
      });
      Object.assign(previewRequest, {
        status: nextStatus,
        assignedAdmin,
        assignedAdminName: assignedAdmin ? (assignedAdminPerson?.name || assignedAdmin) : "",
        managementNote,
        completedAt,
        completedBy,
        reviewedAt: previewRequest.reviewedAt || changedAt,
        reviewedBy: previewRequest.reviewedBy || currentProfile.name || currentUser.displayName || currentUser.email,
        updatedAt: changedAt
      });
      renderRequestTodos();
      const savedCard = [...requestList.querySelectorAll("[data-request-owner][data-request-id]")].find(item => item.dataset.requestOwner === person.id && item.dataset.requestId === requestId);
      const savedStatus = savedCard?.querySelector("[data-request-save-status]");
      if (savedStatus) {
        savedStatus.textContent = "Progress saved.";
        savedStatus.className = "status success";
      }
    } catch (error) {
      status.textContent = error.message || "Could not save this to-do.";
      status.className = "status error";
    }
  }

  function overviewRow(person) {
    const day = latestDay(person);
    const counts = jobCounts(day);
    const alerts = meaningfulAlerts(person, day);
    const next = nextAppointment(day);
    const hours = selectedDays(person).reduce((total, item) => total + workedMinutes(person, item), 0);
    const drive = selectedDays(person).reduce((total, item) => total + (Number(driveTimeForDay(item, person)?.totalMinutes) || 0), 0);
    const status = day?.liveStatus || "NOT STARTED";
    const latestSync = latestSyncDate(person, day);
    const stale = !["NOT STARTED", "CLOCKED OUT"].includes(status) && latestSync && Date.now() - latestSync.getTime() > 20 * 60 * 1000;
    const punctuality = day?.currentJob?.arrivalPerformance || next?.arrivalPerformance || (alerts.some(item => /late/i.test(item)) ? "Needs review" : "On schedule");
    return `<button class="inspector-row${alerts.length ? " has-alert" : ""}" type="button" data-open-inspector="${escapeHtml(person.id)}">
      <div class="inspector-identity">${avatarHtml(person)}<div><strong>${escapeHtml(person.name || person.email)}</strong><small>${escapeHtml(day?.currentJob?.property || (next ? `Next: ${next.property}` : "No current appointment"))}</small><small class="inspector-sync${stale ? " stale" : ""}">${escapeHtml(syncAgeLabel(person, day))}${stale ? " · confirm status" : ""}</small></div></div>
      <div><span class="status-badge ${statusClass(status, alerts)}${stale ? " stale" : ""}">${escapeHtml(status)}</span>${operationalContextHtml(person, day) || `<small>${alerts[0] ? escapeHtml(alerts[0]) : escapeHtml(punctuality)}</small>`}</div>
      <div class="row-metric"><span>Jobs</span><b>${counts.complete} / ${counts.total}</b></div>
      <div class="row-metric"><span>Hours worked</span><b>${formatMinutes(hours)}</b></div>
      <div class="row-metric"><span>Drive time</span><b>${formatMinutes(drive)}</b></div>
      <div class="row-metric"><span>Next appointment</span><b>${next ? formatTime(next.scheduledStart) : "—"}</b></div>
      <span class="row-open">›</span>
    </button>`;
  }

  function subcontractorOverviewRow(entry) {
    const { person, state, test } = entry;
    const hasCurrentJob = Boolean(state?.currentJob || state?.currentJobNumber);
    const job = state?.currentJob || (hasCurrentJob ? { number: state.currentJobNumber, status: "ready" } : null);
    const title = test ? (state?.subcontractorName || "Test Subcontractor") : (person.name || person.email || "MPI Subcontractor");
    const status = subcontractorDisplayStatus(state);
    const completed = Array.isArray(state?.completedJobs) ? state.completedJobs.length : 0;
    const lastEvent = Array.isArray(state?.events) ? state.events.at(-1) : null;
    return `<button class="inspector-row subcontractor-row${test ? " test" : ""}" type="button" data-open-subcontractor="${escapeHtml(entry.id)}">
      <div class="inspector-identity">${avatarHtml(person)}<div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(test ? "Test subcontractor · excluded from payroll" : "Subcontractor")}</small><small class="inspector-sync">${escapeHtml(state?.updatedAtClient ? `Updated ${formatDateTime(state.updatedAtClient)}` : "Waiting for phone sync")}</small></div></div>
      <div><span class="status-badge">${escapeHtml(status)}</span><small>${escapeHtml(lastEvent?.type || "No action recorded yet")}</small></div>
      <div class="row-metric"><span>Current job</span><b>${escapeHtml(job ? `Job ${job.number || 1}` : "—")}</b></div>
      <div class="row-metric"><span>Completed</span><b>${completed}</b></div>
      <div class="row-metric"><span>Arrived</span><b>${escapeHtml(formatTime(job?.arrivedAt))}</b></div>
      <div class="row-metric"><span>Last action</span><b>${escapeHtml(formatTime(lastEvent?.timestamp))}</b></div>
      <span class="row-open">›</span>
    </button>`;
  }

  function officeOverviewRow(entry) {
    const person = entry.person;
    const unread = unreadDirectFor(person);
    return `<button class="inspector-row office-row${unread ? " has-alert" : ""}" type="button" data-open-office="${escapeHtml(entry.id)}">
      <div class="inspector-identity">${avatarHtml(person)}<div><strong>${escapeHtml(person.name || person.email || "MPI Office")}</strong><small>Office Team</small><small class="inspector-sync">${escapeHtml(person.lastSeenAt ? `Last active ${formatDateTime(person.lastSeenAt)}` : "Approved office account")}</small></div></div>
      <div><span class="status-badge neutral">OFFICE</span><small>Tap to open conversation</small></div>
      <div class="row-metric"><span>Role</span><b>${escapeHtml(person.role === "owner" ? "Owner" : "Office admin")}</b></div>
      <div class="row-metric"><span>Messages</span><b>${unread ? `${unread} unread` : messagesFor(person).length}</b></div>
      <div class="row-metric"><span>Availability</span><b>Office</b></div>
      <div class="row-metric"><span>Contact</span><b>Message</b></div>
      <span class="row-open">›</span>
    </button>`;
  }

  function renderOperationsStats() {
    const inspectors = operativePeople();
    const days = inspectors.map(person => ({ person, day: latestDay(person) })).filter(item => item.day);
    stats.working.textContent = String(days.filter(item => !["NOT STARTED", "CLOCKED OUT"].includes(item.day.liveStatus)).length);
    stats.jobs.textContent = String(days.reduce((total, item) => total + jobCounts(item.day).complete, 0));
    const totalMinutes = days.reduce((total, item) => total + selectedDays(item.person).reduce((sum, day) => sum + workedMinutes(item.person, day), 0), 0);
    statHoursLabel.textContent = currentRange === "week" ? "Hours this week" : currentRange === "yesterday" ? "Hours yesterday" : "Hours today";
    stats.hours.textContent = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, "0")}`;
    stats.alerts.textContent = String(days.reduce((total, item) => total + meaningfulAlerts(item.person, item.day).length, 0) + unreadSafetyAlerts().length + allDiagnosticReports().filter(item => item.report.status !== "RESOLVED").length);
    renderCommentUsageAllowance();
  }

  function renderCommentUsageAllowance() {
    if (!commentUsageUsed || !isPrimaryOwner() || currentAdminView !== "operations") {
      if (commentUsagePanel) commentUsagePanel.hidden = true;
      return;
    }
    commentUsagePanel.hidden = false;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const used = people.filter(person => person.active !== false).reduce((companyTotal, person) => {
      const snapshots = [person.operationsCurrent, ...(Array.isArray(person.operationsDays) ? person.operationsDays : [])]
        .map(item => item?.commentUsage)
        .filter(item => item?.month === month);
      const deviceEstimate = snapshots.reduce((highest, item) => Math.max(highest, Number(item.monthlyUsed) || 0), 0);
      return companyTotal + deviceEstimate;
    }, 0);
    const remaining = Math.max(0, COMMENT_MONTHLY_PLANNING_ALLOWANCE - used);
    const percent = Math.min(100, Math.round((used / COMMENT_MONTHLY_PLANNING_ALLOWANCE) * 100));
    commentUsageUsed.textContent = String(used);
    commentUsageRemaining.textContent = String(remaining);
    commentUsageStatus.textContent = percent >= 100 ? "Review now" : percent >= 80 ? "Running low" : "Healthy";
    commentUsageProgress.style.width = `${percent}%`;
    commentUsageNote.textContent = `${percent}% of the MPI 400-comment monthly planning allowance is recorded. This is an approximate device count; Google’s exact no-cost quota is dynamic and this panel never enables billing.`;
  }

  function renderTeamOverview() {
    const entries = teamOverviewEntries();
    const fieldEntries = entries.filter(entry => entry.kind !== "office");
    const cory = operativePeople().find(person => /^cory\b/i.test(String(person.name || "")) || shared.normalizeEmail(person.email) === "cory@michiganpropertyinspections.com");
    const coryMinutes = cory ? weeklyMinutes(cory) : 0;
    const coryOvertime = Math.max(0, coryMinutes - 40 * 60);
    const coryStatus = coryMinutes >= 40 * 60 ? "red" : coryMinutes >= 35 * 60 ? "amber" : "green";
    const canSeeCoryHours = ["owner", "admin"].includes(String(currentProfile?.role || "").toLowerCase());
    const coryCounter = canSeeCoryHours && cory
      ? `<section class="cory-hours-card ${coryStatus}" aria-label="Cory weekly hours"><div><span>CORY · WEEKLY HOURS WORKED</span><strong>${formatMinutes(coryMinutes)}</strong><small>Uses the same effective payroll time and Admin corrections as the workweek report.</small></div><div class="cory-overtime"><span>OVERTIME HOURS WORKED</span><strong>${formatMinutes(coryOvertime)}</strong><small>${coryOvertime ? "40-hour threshold exceeded" : "No overtime recorded"}</small></div></section>`
      : "";
    teamOverview.hidden = false;
    inspectorDetail.hidden = true;
    teamOverview.innerHTML = fieldEntries.length
      ? `${coryCounter}<div class="team-group-title">Field Team <span>${fieldEntries.length} member${fieldEntries.length === 1 ? "" : "s"}</span></div>${fieldEntries.map(entry => entry.kind === "subcontractor" ? subcontractorOverviewRow(entry) : overviewRow(entry.person)).join("")}`
      : '<div class="empty">No field operations have synchronized yet.</div>';
  }

  function renderSubcontractorDetail(entry) {
    const person = entry.person;
    inspectorDetail.innerHTML = `<div class="detail-hero"><div class="detail-person">${avatarHtml(person, "large")}<div><p class="ops-eyebrow">Subcontractor operations</p><h2>${escapeHtml(entry.test ? (entry.state?.subcontractorName || "Test Subcontractor") : (person.name || person.email || "MPI Subcontractor"))}</h2><p>Job and lab status · excluded from employee payroll and hours</p></div></div><button class="detail-back" type="button" data-back-overview>← All field users</button></div>${subcontractorStateCard(person, entry.state, entry.test)}`;
    teamOverview.hidden = true;
    inspectorDetail.hidden = false;
  }

  function jobTimeEditButton(action, job, value) {
    return `<button type="button" data-prefill-job-correction="${escapeHtml(action)}" data-job-id="${escapeHtml(job.id || "")}" data-current-time="${escapeHtml(value || "")}">EDIT</button>`;
  }

  function jobCard(person, day, job, index) {
    const status = String(job.status || "scheduled").replace(/-/g, " ");
    const values = {
      "On My Way selected": effectiveActionTime(person, day, "On My Way selected", job.id),
      Arrived: effectiveActionTime(person, day, "Arrived", job.id),
      "Inspection started": effectiveActionTime(person, day, "Inspection started", job.id),
      "Final job completion": effectiveActionTime(person, day, "Final job completion", job.id)
    };
    const adjusted = Object.keys(values).some(action => latestActionCorrection(person, day, action, job.id));
    const arrivalPerformance = values.Arrived && job.scheduledStart
      ? (() => {
          const difference = Math.round(((asDate(values.Arrived)?.getTime() || 0) - (asDate(job.scheduledStart)?.getTime() || 0)) / 60000);
          if (!Number.isFinite(difference)) return job.arrivalPerformance || "Arrival recorded";
          if (difference === 0) return "On time";
          return `${Math.abs(difference)} minute${Math.abs(difference) === 1 ? "" : "s"} ${difference > 0 ? "late" : "early"}`;
        })()
      : job.arrivalPerformance || "Arrival not recorded";
    return `<details class="job-line" ${index === 0 ? "open" : ""}>
      <summary class="job-line-summary"><time>${escapeHtml(formatTime(job.scheduledStart))}</time><div><strong>${escapeHtml(job.property || "Inspection appointment")}</strong><small>${escapeHtml(scheduleServices(job).join(" + ") || "Inspection")} · ${escapeHtml(arrivalPerformance)}${adjusted ? " · Management adjusted" : ""}</small></div><span class="status-badge ${job.status === "completed" ? "neutral" : ""}">${escapeHtml(status)}</span><span class="job-line-chevron">›</span></summary>
      <div class="job-time-panel">
        <div class="job-time-item"><span>Scheduled</span><strong>${escapeHtml(formatTime(job.scheduledStart))}</strong></div>
        <div class="job-time-item"><span>On My Way</span><strong>${escapeHtml(formatTime(values["On My Way selected"]))}</strong>${jobTimeEditButton("On My Way selected", job, values["On My Way selected"])}</div>
        <div class="job-time-item"><span>Arrived</span><strong>${escapeHtml(formatTime(values.Arrived))}</strong>${jobTimeEditButton("Arrived", job, values.Arrived)}</div>
        <div class="job-time-item"><span>Inspection Started</span><strong>${escapeHtml(formatTime(values["Inspection started"]))}</strong>${jobTimeEditButton("Inspection started", job, values["Inspection started"])}</div>
        <div class="job-time-item"><span>Job Complete</span><strong>${escapeHtml(formatTime(values["Final job completion"]))}</strong>${jobTimeEditButton("Final job completion", job, values["Final job completion"])}</div>
        <p class="job-time-note">Corrections preserve the original phone record and immediately recalculate Hours Worked and Drive Time where the changed time affects those totals.</p>
      </div>
    </details>`;
  }

  function activityDetail(item) {
    if (item.action === "Arrival performance calculated") return item.data?.performance || "Compared with scheduled time";
    if (item.action === "Arrival location verified") return item.data?.distanceFeet !== "" ? `${item.data.distanceFeet} ft from scheduled property` : "Location verified";
    if (item.action === "Arrival location review required") return item.data?.reviewReason || "Management review required";
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

  function labCocMessages(person, day) {
    return fieldMessages.filter(message => {
      if (message.kind !== "lab-coc") return false;
      const sameInspector = message.senderUid === person?.id || shared.normalizeEmail(message.senderEmail) === shared.normalizeEmail(person?.email);
      const messageDate = String(message.context?.date || "");
      const created = asDate(message.createdAtClient || message.createdAt);
      return sameInspector && (messageDate === day?.date || (!messageDate && created && dateKey(created) === day?.date));
    });
  }

  function labHtml(person, day) {
    const lab = day?.labStop;
    const labEvents = effectiveActivityForDay(person, day).filter(item => ["Lab selected", "Arrived at lab", "Lab visit completed", "Lab route departure / continuation"].includes(item.action));
    const cocMessages = labCocMessages(person, day);
    if (!lab && !labEvents.length && !cocMessages.length) return '<p class="ops-sub">No lab stop or Chain of Custody upload recorded.</p>';
    const names = new Set();
    labEvents.forEach(item => {
      const values = Array.isArray(item.data?.labs) ? item.data.labs : [item.data?.lab];
      values.filter(Boolean).forEach(value => names.add(value));
    });
    cocMessages.forEach(message => names.add(message.context?.labName || "Laboratory"));
    if (!names.size && Array.isArray(lab?.labs)) lab.labs.forEach(value => names.add(String(value || "Laboratory")));
    const visits = [...names].map(name => {
      const arrivals = labEvents.filter(item => item.action === "Arrived at lab" && (!item.data?.lab || item.data.lab === name));
      const completions = labEvents.filter(item => item.action === "Lab visit completed" && (!item.data?.lab || item.data.lab === name));
      const arrival = arrivals.at(-1);
      const completion = completions.at(-1);
      const documents = cocMessages.filter(message => (message.context?.labName || "Laboratory") === name);
      const sourceJobId = eventJobId(arrival || completion) || documents[0]?.context?.jobId || "";
      return `<article class="lab-visit-card"><div class="lab-visit-head"><div><strong>${escapeHtml(name)}</strong><small>${documents.length ? `${documents.reduce((total, item) => total + (item.attachments?.length || 0), 0)} Chain of Custody photo(s) synchronized` : "No synchronized COC photo is available"}</small></div><span class="status-badge ${completion ? "neutral" : "waiting"}">${completion ? "COMPLETE" : arrival ? "AT LAB" : "RECORDED"}</span></div><div class="lab-time-row"><div><span>Arrived</span><strong>${escapeHtml(formatTime(arrival?.timestamp))}</strong><button class="lab-time-edit" type="button" data-prefill-job-correction="Arrived at lab" data-job-id="${escapeHtml(sourceJobId)}" data-current-time="${escapeHtml(arrival?.timestamp || "")}">EDIT</button></div><div><span>Visit complete</span><strong>${escapeHtml(formatTime(completion?.timestamp))}</strong><button class="lab-time-edit" type="button" data-prefill-job-correction="Lab visit completed" data-job-id="${escapeHtml(sourceJobId)}" data-current-time="${escapeHtml(completion?.timestamp || "")}">EDIT</button></div></div>${documents.map(message => `<div class="lab-document-card"><strong>CHAIN OF CUSTODY · ${escapeHtml(formatDateTime(message.createdAtClient || message.createdAt))}</strong><small>${escapeHtml(message.message || `${message.attachments?.length || 0} photo(s) from the inspector phone`)}</small>${fieldAttachmentsHtml(message)}</div>`).join("")}</article>`;
    }).join("");
    return `<div class="fact-list" style="margin-bottom:12px"><div class="fact"><span>Lab drive</span><strong>${formatMinutes(driveTimeForDay(day, person)?.labMinutes)}</strong></div><div class="fact"><span>COC photos</span><strong>${cocMessages.reduce((total, item) => total + (item.attachments?.length || 0), 0)}</strong></div></div><div class="lab-visit-list">${visits}</div>`;
  }

  function messagesFor(person) {
    const conversationId = shared.directConversationId?.(currentUser?.uid, person?.id) || "";
    return directMessages.filter(message => message.conversationId === conversationId);
  }

  function messageHistoryHtml(person) {
    const privateMessages = messagesFor(person).map(message => ({ direction: message.senderUid === currentUser?.uid ? "office" : "field", timestamp: message.createdAt || message.createdAtClient, message, direct: true }));
    const legacyOffice = updates.filter(update => update.type === "message" && update.createdBy === currentUser?.uid && (String(update.targetUid || "") === String(person.id || "") || (person.email && shared.normalizeEmail(update.targetEmail) === shared.normalizeEmail(person.email)))).map(message => ({ direction: "office", timestamp: message.createdAt, message }));
    const legacyField = fieldMessages.filter(message => message.senderUid === person.id || shared.normalizeEmail(message.senderEmail) === shared.normalizeEmail(person.email)).map(message => ({ direction: "field", timestamp: message.createdAt || message.createdAtClient, message }));
    const mirroredReceipts = new Set(fieldMessages.filter(message => message.replyToUpdateId).map(message => `${message.replyToUpdateId}:${message.senderUid || shared.normalizeEmail(message.senderEmail)}`));
    const receiptReplies = inspectorReplies.filter(reply => {
      const belongsToPerson = reply.userId === person.id || shared.normalizeEmail(reply.userEmail) === shared.normalizeEmail(person.email);
      const mirrorKey = `${reply.updateId}:${reply.userId || shared.normalizeEmail(reply.userEmail)}`;
      return belongsToPerson && !mirroredReceipts.has(mirrorKey);
    }).map(reply => ({ direction: "field", receipt: true, timestamp: reply.repliedAt || reply.updatedAt, message: { ...reply, message: reply.replyText, senderName: reply.userName || person.name, attachments: reply.attachments || [] } }));
    const messages = [...privateMessages, ...legacyOffice, ...legacyField, ...receiptReplies].sort((left, right) => (asDate(right.timestamp)?.getTime() || 0) - (asDate(left.timestamp)?.getTime() || 0));
    return messages.length ? messages.slice(0, 30).map(item => {
      const message = item.message;
      if (item.direct) {
        const delivery = item.direction === "office" ? deliveryStateHtml(directDeliveryState(message)) : "";
        return `<article class="${item.direction}"><strong>${escapeHtml(formatDateTime(item.timestamp))} · ${escapeHtml(message.senderName || "MPI Team Member")}</strong><p>${escapeHtml(message.message || "Attachment sent")}</p>${delivery}${directAttachmentsHtml(message)}${item.direction === "field" ? `<button class="message-todo" type="button" data-create-message-todo="${escapeHtml(message.id || "")}" data-message-person="${escapeHtml(person.id)}" data-direct-message="true">CREATE TO-DO</button>` : ""}</article>`;
      }
      if (item.receipt) return `<article><strong>${escapeHtml(formatDateTime(item.timestamp))} · ${escapeHtml(message.senderName || person.name || "MPI Field User")} → Office</strong><p>${escapeHtml(message.message || "Inspector replied")}</p>${fieldAttachmentsHtml(message)}</article>`;
      if (item.direction === "field") return `<article><strong>${escapeHtml(formatDateTime(item.timestamp))} · ${escapeHtml(message.senderName || person.name || "MPI Field User")} → Office</strong><p>${escapeHtml(message.message || "Photos sent to MPI Office")}</p>${fieldAttachmentsHtml(message)}${message.kind === "lab-coc" ? "" : `<button class="message-todo" type="button" data-create-message-todo="${escapeHtml(message.id || "")}" data-message-person="${escapeHtml(person.id)}">CREATE TO-DO</button>`}</article>`;
      const receipt = messageReceiptCache.get(`${message.id}:${person.id}`);
      const state = receipt?.status ? receipt.status.replace(/-/g, " ") : "Sent to app";
      return `<article><strong>${escapeHtml(formatDateTime(message.createdAt))} · MPI Office → ${escapeHtml(person.name || "field user")}</strong><p>${escapeHtml(message.message)}</p><p><b>Status:</b> ${escapeHtml(state)}</p>${adminAttachmentsHtml(message)}</article>`;
    }).join("") : '<div class="empty">No messages in this conversation yet.</div>';
  }

  function renderAdminInboxConversation(personId = activeInboxPersonId) {
    if (!inboxMailbox || !inboxConversation) return;
    const person = people.find(item => item.id === personId && item.active !== false);
    if (!person) {
      activeInboxPersonId = "";
      inboxMailbox.hidden = false;
      inboxConversation.hidden = true;
      inboxConversation.innerHTML = "";
      return;
    }
    activeInboxPersonId = person.id;
    const canReply = person.id !== currentUser?.uid;
    inboxMailbox.hidden = true;
    inboxConversation.hidden = false;
    inboxConversation.innerHTML = `
      <header class="admin-conversation-head">
        <div class="admin-conversation-person">${avatarHtml(person)}<div><strong>${escapeHtml(canonicalTeamName(person))}</strong><span>${canReply ? `${escapeHtml(teamRoleLabel(person.role))} · Private MPI conversation` : "Your field submissions to the office"}</span></div></div>
        <button class="admin-conversation-back" type="button" data-close-admin-conversation>← BACK TO INBOX</button>
      </header>
      <div class="admin-conversation-body">
        <div class="message-history admin-conversation-thread" id="adminInboxConversationHistory">${messageHistoryHtml(person)}</div>
        ${canReply ? `<form class="compact-form admin-conversation-compose" data-admin-conversation-form data-person-id="${escapeHtml(person.id)}">
          <h3>Message ${escapeHtml(canonicalTeamName(person))}</h3>
          <p>The recipient is fixed. This message will only be delivered to this private conversation.</p>
          <div class="field"><label>Message</label><textarea data-message-text maxlength="1200" required placeholder="Write a private message"></textarea></div>
          ${chatAttachmentHtml()}
          <button class="primary" type="submit"><svg class="app-icon"><use href="#icon-send"></use></svg><span>SEND MESSAGE</span></button>
          <span class="status" data-message-status aria-live="polite"></span>
        </form>` : '<aside class="admin-conversation-compose"><h3>Field submissions</h3><p>Attachments and activity sent from your inspector app are shown in this message history. Private messages to other team members can be started from Compose message.</p></aside>'}
      </div>`;
    hydrateMessageReceipts(person);
  }

  function refreshAdminInboxConversation() {
    if (!activeInboxPersonId || !inboxConversation || inboxConversation.hidden) return;
    const person = people.find(item => item.id === activeInboxPersonId);
    const history = document.getElementById("adminInboxConversationHistory");
    if (person && history) history.innerHTML = messageHistoryHtml(person);
  }

  function openAdminInboxConversation(personId) {
    if (!personId || !people.some(person => person.id === personId && person.active !== false)) return;
    showView("updates");
    renderAdminInboxConversation(personId);
    shared.markDirectConversationRead?.(currentUser, personId).catch(() => false);
  }

  function closeAdminInboxConversation() {
    activeInboxPersonId = "";
    if (inboxMailbox) inboxMailbox.hidden = false;
    if (inboxConversation) {
      inboxConversation.hidden = true;
      inboxConversation.innerHTML = "";
    }
    renderAdminUnifiedInbox();
  }

  async function hydrateMessageReceipts(person) {
    const hasUnreadDirectMessage = messagesFor(person).some(message =>
      message.targetUid === currentUser?.uid
      && !(Array.isArray(message.readBy) && message.readBy.includes(currentUser.uid))
    );
    if (hasUnreadDirectMessage) shared.markDirectConversationRead?.(currentUser, person.id).catch(() => false);
    if (activeInboxPersonId === person.id) refreshAdminInboxConversation();
  }

  async function createTodoFromMessage(button) {
    const person = people.find(item => item.id === button.dataset.messagePerson);
    const message = button.dataset.directMessage === "true"
      ? directMessages.find(item => item.id === button.dataset.createMessageTodo)
      : fieldMessages.find(item => item.id === button.dataset.createMessageTodo);
    if (!person || !message || !shared.isAdminRole(currentProfile)) return;
    button.disabled = true;
    button.textContent = "CREATING…";
    const sourceText = String(message.message || "Field message requires office action").trim();
    const createdAt = new Date().toISOString();
    const request = {
      id: `message-${message.id}`,
      type: "Office follow-up",
      item: sourceText.slice(0, 90) || "Field message follow-up",
      details: sourceText.slice(0, 1200),
      suggestion: "",
      neededBy: "",
      asap: false,
      status: "in-progress",
      requestedAt: message.createdAtClient || createdAt,
      inspector: message.senderName || person.name || person.email,
      inspectorEmail: message.senderEmail || person.email || "",
      sourceMessageId: message.id,
      assignedAdmin: shared.normalizeEmail(currentUser.email),
      assignedAdminName: currentProfile.name || currentUser.displayName || currentUser.email,
      assignedAt: createdAt,
      assignedBy: currentProfile.name || currentUser.displayName || currentUser.email,
      reviewedAt: createdAt,
      reviewedBy: currentProfile.name || currentUser.displayName || currentUser.email,
      updatedAt: createdAt
    };
    try {
      const ref = shared.db.collection("users").doc(person.id);
      await shared.db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const requests = Array.isArray(snapshot.data()?.fieldRequests) ? snapshot.data().fieldRequests.slice() : [];
        if (!requests.some(item => item.sourceMessageId === message.id)) requests.push(request);
        transaction.set(ref, { fieldRequests: requests.slice(-300), requestsUpdatedAt: shared.serverTimestamp() }, { merge: true });
      });
      showView("requests");
    } catch (error) {
      button.disabled = false;
      button.textContent = "TRY CREATE TO-DO AGAIN";
      button.title = error.message || "The to-do could not be created.";
    }
  }

  function correctionHistoryHtml(person, day) {
    const corrections = correctionsFor(person, day).slice().reverse();
    const reversedIds = new Set(corrections.map(item => item.reversesCorrectionId).filter(Boolean));
    return corrections.length ? corrections.map(item => `<article><strong>${escapeHtml(item.targetAction)} · ${escapeHtml(formatTime(item.correctedValue))}${item.reversesCorrectionId ? " · Reversal" : ""}</strong><p>Original: ${escapeHtml(item.originalValue ? formatTime(item.originalValue) : "Not recorded")} · Corrected by ${escapeHtml(item.correctedByName || "MPI Admin")} on ${escapeHtml(formatDateTime(item.correctedAt))}</p><p>Reason: ${escapeHtml(item.reason)}</p>${item.originalValue && !item.reversesCorrectionId && !reversedIds.has(item.id) ? `<button type="button" class="secondary" data-reverse-correction="${escapeHtml(item.id)}">REVERSE THIS CORRECTION</button>` : ""}</article>`).join("") : '<div class="empty">No admin corrections for this day.</div>';
  }

  async function reverseAdminCorrection(correctionId) {
    const person = people.find(item => item.id === selectedInspectorId);
    const day = selectedOperationDay(person);
    const original = correctionsFor(person, day).find(item => item.id === correctionId);
    if (!person || !day || !original?.originalValue) return;
    const reversal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: day.date,
      targetAction: original.targetAction,
      targetEventId: original.targetEventId || "",
      jobId: original.jobId || "",
      property: original.property || "",
      originalValue: original.correctedValue,
      correctedValue: original.originalValue,
      reason: `Reversal of correction: ${original.reason}`.slice(0, 500),
      reversesCorrectionId: original.id,
      correctedAt: new Date().toISOString(),
      correctedById: currentUser.uid,
      correctedByEmail: shared.normalizeEmail(currentUser.email),
      correctedByName: currentProfile.name || currentUser.displayName || "MPI Admin"
    };
    await shared.db.collection("users").doc(person.id).update({ adminCorrections: shared.arrayUnion(reversal), operationsUpdatedAt: shared.serverTimestamp() });
  }

  function arrivalReviewHistory(person, arrivalEventId) {
    return (Array.isArray(person?.arrivalLocationReviews) ? person.arrivalLocationReviews : [])
      .filter(item => item?.arrivalEventId === arrivalEventId)
      .sort((left, right) => String(left.reviewedAt || "").localeCompare(String(right.reviewedAt || "")));
  }

  function arrivalReviewHtml(person, day) {
    const arrivals = (day?.jobs || []).map(job => ({ job, evidence: job.arrivalLocation }))
      .filter(item => item.evidence?.recordedArrivalAt || item.job?.arrivedAt);
    if (!arrivals.length) return '<div class="empty">No arrival location evidence is recorded for this period.</div>';
    return arrivals.map(({ job, evidence: recordedEvidence }) => {
      const evidence = recordedEvidence || {};
      const eventId = String(evidence.arrivalEventId || `${job.id}|${job.arrivedAt || ""}`);
      const history = arrivalReviewHistory(person, eventId);
      const latest = history.at(-1);
      const needsReview = evidence.verificationStatus === "arrival-location-review-required";
      const reviewLabel = latest?.decision === "approved" ? "APPROVED BY MANAGEMENT" : latest?.decision === "flagged" ? "FLAGGED / DENIED" : needsReview ? "REVIEW REQUIRED" : "LOCATION VERIFIED";
      const actualLat = Number(evidence.actualLatitude);
      const actualLng = Number(evidence.actualLongitude);
      const scheduledLat = Number(evidence.scheduledLatitude);
      const scheduledLng = Number(evidence.scheduledLongitude);
      const hasActual = evidence.actualLatitude !== "" && evidence.actualLongitude !== "" && Number.isFinite(actualLat) && Number.isFinite(actualLng);
      const hasScheduled = evidence.scheduledLatitude !== "" && evidence.scheduledLongitude !== "" && Number.isFinite(scheduledLat) && Number.isFinite(scheduledLng);
      const mapUrl = hasActual && hasScheduled
        ? `https://www.google.com/maps/dir/?api=1&origin=${scheduledLat},${scheduledLng}&destination=${actualLat},${actualLng}`
        : hasActual
          ? `https://maps.apple.com/?q=${actualLat},${actualLng}`
          : "";
      return `<article class="arrival-review" data-arrival-event-id="${escapeHtml(eventId)}" data-arrival-job-id="${escapeHtml(job.id || "")}" data-arrival-time="${escapeHtml(evidence.recordedArrivalAt || job.arrivedAt || "")}">
        <div><span class="status-badge ${needsReview && !latest ? "alert" : latest?.decision === "flagged" ? "alert" : ""}">${escapeHtml(reviewLabel)}</span><strong>${escapeHtml(job.property || evidence.scheduledAddress || "Inspection appointment")}</strong><small>Arrival ${escapeHtml(formatTime(evidence.recordedArrivalAt || job.arrivedAt))} · ${evidence.distanceFeet !== "" ? `${escapeHtml(evidence.distanceFeet)} ft from scheduled point` : "Distance unavailable"}${evidence.gpsAccuracyFeet ? ` · GPS accuracy about ${escapeHtml(evidence.gpsAccuracyFeet)} ft` : ""}</small></div>
        <div class="arrival-evidence"><div><span>Scheduled property location</span><strong>${hasScheduled ? `${escapeHtml(scheduledLat.toFixed(6))}, ${escapeHtml(scheduledLng.toFixed(6))}` : escapeHtml(evidence.scheduledAddress || job.property || "Unavailable")}</strong></div><div><span>Actual check-in location</span><strong>${hasActual ? `${escapeHtml(actualLat.toFixed(6))}, ${escapeHtml(actualLng.toFixed(6))}` : `GPS ${escapeHtml(evidence.gpsStatus || "unavailable")}`}</strong></div></div>
        ${mapUrl ? `<a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener">VIEW MAP ↗</a>` : '<span class="ops-sub">Map unavailable</span>'}
        ${needsReview ? `<label class="field">Management review note<textarea data-arrival-review-note maxlength="500" placeholder="Add context for this review"></textarea></label><div class="quick-messages"><button type="button" data-arrival-review="approved">APPROVE LOCATION</button><button type="button" data-arrival-adjust>ADJUST HOURS START</button><button type="button" data-arrival-review="flagged">FLAG / DENY</button></div><span class="status" data-arrival-review-status>${latest ? `${escapeHtml(reviewLabel)} · ${escapeHtml(latest.reviewedByName || "MPI Admin")} · ${escapeHtml(formatDateTime(latest.reviewedAt))}` : "Original arrival record is preserved."}</span>` : `<span class="status success">Automatically verified. Original evidence is preserved.</span>`}
      </article>`;
    }).join("");
  }

  async function saveArrivalLocationReview(button) {
    const person = people.find(item => item.id === selectedInspectorId);
    const card = button.closest("[data-arrival-event-id]");
    const status = card?.querySelector("[data-arrival-review-status]");
    const note = card?.querySelector("[data-arrival-review-note]")?.value.trim().slice(0, 500) || "";
    const decision = button.dataset.arrivalReview;
    if (!person || !card || !["approved", "flagged"].includes(decision)) return;
    if (decision === "flagged" && !note) {
      status.textContent = "Add a reason before flagging this arrival.";
      status.className = "status error";
      return;
    }
    button.disabled = true;
    const review = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: selectedOperationDay(person)?.date || dateKey(),
      arrivalEventId: card.dataset.arrivalEventId,
      jobId: card.dataset.arrivalJobId || "",
      originalArrivalAt: card.dataset.arrivalTime || "",
      decision,
      note,
      reviewedAt: new Date().toISOString(),
      reviewedById: currentUser.uid,
      reviewedByEmail: shared.normalizeEmail(currentUser.email),
      reviewedByName: currentProfile.name || currentUser.displayName || "MPI Admin"
    };
    try {
      await shared.db.collection("users").doc(person.id).update({ arrivalLocationReviews: shared.arrayUnion(review), operationsUpdatedAt: shared.serverTimestamp() });
      status.textContent = decision === "approved" ? "Location approved. The original evidence remains in the audit history." : "Arrival flagged for management follow-up.";
      status.className = decision === "approved" ? "status success" : "status error";
    } catch (error) {
      button.disabled = false;
      status.textContent = error.message || "The review could not be saved.";
      status.className = "status error";
    }
  }

  function prefillArrivalTimeAdjustment(button) {
    const card = button.closest("[data-arrival-event-id]");
    const form = document.getElementById("adminCorrectionForm");
    const date = asDate(card?.dataset.arrivalTime);
    if (!card || !form || !date) return;
    form.querySelector("#adminCorrectionAction").value = "Hours Worked start";
    form.querySelector("#adminCorrectionJob").value = card.dataset.arrivalJobId || "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    form.querySelector("#adminCorrectionValue").value = local;
    form.querySelector("#adminCorrectionReason").focus();
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function localDateTimeValue(value, fallback = new Date()) {
    const date = asDate(value) || fallback;
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function prefillJobTimeAdjustment(button) {
    const form = document.getElementById("adminCorrectionForm");
    if (!form) return;
    form.querySelector("#adminCorrectionAction").value = button.dataset.prefillJobCorrection || "Arrived";
    form.querySelector("#adminCorrectionJob").value = button.dataset.jobId || "";
    form.querySelector("#adminCorrectionValue").value = localDateTimeValue(button.dataset.currentTime);
    form.querySelector("#adminCorrectionReason").value = "";
    form.querySelector("#adminCorrectionReason").focus();
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderInspectorDetail(person) {
    const days = selectedDays(person);
    const day = selectedOperationDay(person, days);
    const counts = jobCounts(day);
    const hours = days.reduce((total, item) => total + workedMinutes(person, item), 0);
    const weekly = weeklyMinutes(person);
    const drive = days.reduce((summary, item) => {
      const dayDrive = driveTimeForDay(item, person);
      Object.keys(summary).forEach(key => { summary[key] += Number(dayDrive?.[key]) || 0; });
      return summary;
    }, { morningMinutes: 0, betweenJobMinutes: 0, labMinutes: 0, finalMinutes: 0, totalMinutes: 0 });
    const current = day?.currentJob;
    const currentArrivedAt = current ? effectiveActionTime(person, day, "Arrived", current.id) : "";
    const currentStartedAt = current ? effectiveActionTime(person, day, "Inspection started", current.id) : "";
    const next = nextAppointment(day);
    const alerts = meaningfulAlerts(person, day);
    const clockOut = effectiveClockOut(person, day);
    const effectiveClock = effectiveTimeClockFor(person, day);
    const effectiveHoursStart = effectiveClock?.effectiveHoursWorkedStartedAt || day?.timeClock?.hoursWorkedStartedAt || "";
    const timeAdjusted = Boolean(effectiveClock?.startAdjustment || effectiveClock?.endAdjustment);
    const originalReadiness = day?.readiness?.completedAt || day?.timeClock?.activityStartedAt || "";
    const readinessCorrection = latestActionCorrection(person, day, "Morning readiness completed");
    const effectiveReadiness = readinessCorrection?.correctedValue || originalReadiness;
    const activityStart = effectiveReadiness;
    const activityStartMs = asDate(activityStart)?.getTime() || 0;
    const lastActivityTime = (day?.activity || []).map(item => asDate(item?.timestamp)?.getTime() || 0).reduce((latest, value) => Math.max(latest, value), 0);
    const activityCanRun = day?.date === dateKey() && day?.liveStatus !== "CLOCKED OUT" && !day?.dayComplete?.completedAt;
    const activityEndMs = asDate(clockOut)?.getTime() || (activityCanRun ? Date.now() : lastActivityTime);
    const activityMinutes = activityStartMs && activityEndMs > activityStartMs && activityEndMs - activityStartMs <= 18 * 60 * 60 * 1000
      ? Math.floor((activityEndMs - activityStartMs) / 60000)
      : 0;
    const timeAudit = workedTimeAuditForDay(person, day);
    const eodStatus = day?.dayComplete?.completedAt ? "CLOCKED OUT" : counts.total && counts.complete === counts.total ? "END-OF-DAY CHECKS" : "DAY IN PROGRESS";
    const correctionActions = ["Morning readiness completed", "Hours Worked start", "Hours Worked end", "On My Way selected", "Arrived", "Inspection started", "Final job completion", "Arrived at lab", "Lab visit completed", "Arrived home / end location", "Clocked off"];
    const jobOptions = (day?.jobs || []).map(job => `<option value="${escapeHtml(job.id)}">${escapeHtml(job.property)}</option>`).join("");
    const timeAtProperty = currentArrivedAt && asDate(currentArrivedAt) ? formatMinutes(Math.floor((Date.now() - asDate(currentArrivedAt).getTime()) / 60000)) : "—";
    const lastLocation = lastLocationForDay(day);
    const locationLink = lastLocation && Number.isFinite(lastLocation.latitude) && Number.isFinite(lastLocation.longitude)
      ? `<a href="https://maps.apple.com/?q=${encodeURIComponent(`${lastLocation.latitude},${lastLocation.longitude}`)}" target="_blank" rel="noopener">Open last recorded location ↗</a> · ${escapeHtml(formatTime(lastLocation.timestamp))}`
      : "Not available";
    inspectorDetail.innerHTML = `
      <div class="detail-hero"><div class="detail-person">${avatarHtml(person, "large")}<div><p class="ops-eyebrow">Inspector operations</p><h2>${escapeHtml(person.name || person.email)}</h2><p>${escapeHtml(person.email || "")} · Viewing ${escapeHtml(day?.date ? formatDate(day.date) : "no recorded day")} · ${escapeHtml(syncAgeLabel(person, day))}</p></div></div><div><span class="status-badge ${statusClass(day?.liveStatus, alerts)}">${escapeHtml(day?.liveStatus || "NOT STARTED")}</span>${operationalContextHtml(person, day)}<button class="detail-back" type="button" data-back-overview>← All inspectors</button></div></div>
      <div class="ops-grid">
        <article class="ops-card span-6"><p class="ops-eyebrow">Current job</p><strong class="ops-primary">${escapeHtml(current?.property || "No job currently open")}</strong><p class="ops-sub">${current ? `Scheduled ${formatTime(current.scheduledStart)} · ${escapeHtml(current.arrivalPerformance || "Arrival not recorded")} · ${escapeHtml(String(current.status || "scheduled").replace(/-/g, " "))}` : "The inspector is not inside an active job workflow."}</p><div class="fact-list" style="margin-top:13px"><div class="fact"><span>Arrived</span><strong>${escapeHtml(formatTime(currentArrivedAt))}</strong></div><div class="fact"><span>Inspection started</span><strong>${escapeHtml(formatTime(currentStartedAt))}</strong></div><div class="fact"><span>Time at property</span><strong>${timeAtProperty}</strong></div></div></article>
        <article class="ops-card span-6"><p class="ops-eyebrow">Next appointment</p><strong class="ops-primary">${escapeHtml(next?.property || "No remaining appointment")}</strong><p class="ops-sub">${next ? `${formatTime(next.scheduledStart)} · ${escapeHtml(next.arrivalPerformance || "On schedule")}` : "The scheduled job list is complete."}</p><div class="fact-list" style="margin-top:13px"><div class="fact"><span>Estimated drive</span><strong>${current?.departurePlan?.estimatedDriveMinutes ? `${current.departurePlan.estimatedDriveMinutes} min` : "—"}</strong></div><div class="fact"><span>Required departure</span><strong>${escapeHtml(formatTime(current?.departurePlan?.leaveBy))}</strong></div><div class="fact"><span>Schedule status</span><strong>${alerts.some(item => /late|affect next/i.test(item)) ? "ATTENTION REQUIRED" : "ON SCHEDULE"}</strong></div></div></article>
        <article class="ops-card"><p class="ops-eyebrow">${currentRange === "week" ? "Hours worked this week" : currentRange === "yesterday" ? "Hours worked yesterday" : "Hours worked today"}</p><strong class="ops-primary">${formatMinutes(hours)}</strong><p class="ops-sub">${currentRange === "week" ? `${days.length} recorded day${days.length === 1 ? "" : "s"} included · selected day ${formatDate(day?.date)}` : `Started ${formatTime(effectiveHoursStart)} · ${clockOut ? `Frozen at ${formatTime(clockOut)}` : activityCanRun ? "Running now" : "Not started"}${timeAdjusted ? " · Management adjusted" : ""}`}</p>${timeAudit.issues.length ? `<div class="alert-item" style="margin-top:12px">${escapeHtml(timeAudit.issues.map(item => item.message).join(" "))}</div>` : ""}</article>
        <article class="ops-card"><p class="ops-eyebrow">Activity window</p><strong class="ops-primary">${formatMinutes(activityMinutes)}</strong><p class="ops-sub">Morning readiness ${formatTime(activityStart)} · End ${formatTime(clockOut)}</p></article>
        <article class="ops-card"><p class="ops-eyebrow">Weekly hours</p><strong class="ops-primary">${formatMinutes(weekly)}</strong><p class="ops-sub">Current Monday-to-today total${weekly >= 38 * 60 ? " · Review threshold approaching" : ""}. Open a day below to inspect or correct its source times.</p>${weeklyDayBreakdownHtml(person, "hours")}</article>
        ${day?.nachiTraining ? `<article class="ops-card"><p class="ops-eyebrow">NACHI Training Time</p><strong class="ops-primary">${formatMinutes(day.nachiTraining.totalMinutes)}</strong><p class="ops-sub">${day.nachiTraining.active ? "Training is active now and is included in Hours Worked." : "Recorded separately and included in the same effective payroll hours."}</p></article>` : ""}
        <article class="ops-card span-6"><h3>${currentRange === "week" ? "Total Drive Time This Week" : "Drive Time"}</h3><div class="fact-list"><div class="fact"><span>Morning drive</span><strong>${formatMinutes(drive.morningMinutes)}</strong></div><div class="fact"><span>Between jobs</span><strong>${formatMinutes(drive.betweenJobMinutes)}</strong></div><div class="fact"><span>Lab travel</span><strong>${formatMinutes(drive.labMinutes)}</strong></div><div class="fact"><span>Final drive</span><strong>${driveTimeForDay(day, person)?.finalPending ? "Pending" : formatMinutes(drive.finalMinutes)}</strong></div><div class="fact"><span>Total drive ${currentRange === "week" ? "this week" : "today"}</span><strong>${formatMinutes(drive.totalMinutes)}</strong></div></div>${currentRange === "week" ? weeklyDayBreakdownHtml(person, "drive") : ""}</article>
        <article class="ops-card span-6"><h3>Day Progress</h3><strong class="ops-primary">${counts.complete} / ${counts.total} complete</strong><p class="ops-sub">Completed jobs remain visible for the full calendar day.</p><div class="fact-list" style="margin-top:13px"><div class="fact"><span>Completed</span><strong>${counts.complete}</strong></div><div class="fact"><span>Remaining</span><strong>${Math.max(0, counts.total - counts.complete)}</strong></div><div class="fact"><span>Total jobs</span><strong>${counts.total}</strong></div></div></article>
        <article class="ops-card full"><h3>Job Breakdown</h3><p class="ops-sub">Open any job to review its operational timestamps. Use Edit to add an auditable correction.</p><div class="job-list" style="margin-top:12px">${(day?.jobs || []).length ? day.jobs.map((job, index) => jobCard(person, day, job, index)).join("") : '<div class="empty">No scheduled jobs are available for this period.</div>'}</div></article>
        <article class="ops-card span-8"><h3>Activity Timeline</h3><div class="timeline">${timelineHtml(person, day)}</div></article>
        <article class="ops-card"><h3>Alerts / Exceptions</h3><div class="alert-list">${alerts.length ? alerts.map(item => `<div class="alert-item">${escapeHtml(item)}</div>`).join("") : '<div class="clear-item">✓ No meaningful workflow issues recorded.</div>'}</div></article>
        <article class="ops-card full"><h3>Arrival Location Review</h3><p class="ops-sub">Inspectors are never blocked. Any unusual location is recorded here for management review, while the original time and GPS evidence remain unchanged.</p>${arrivalReviewHtml(person, day)}</article>
        ${(day?.commentFailures || []).length ? `<article class="ops-card full"><h3>Comment Builder Technical Log</h3><div class="timeline">${day.commentFailures.slice().reverse().map(item => `<div class="timeline-row"><time>${escapeHtml(formatTime(item.timestamp))}</time><span class="timeline-dot"></span><div><strong>${escapeHtml(item.category || "service-error")} · attempt ${escapeHtml(item.attempt || "—")}</strong><small>Request ${escapeHtml(item.requestId || "—")} · ${escapeHtml(item.connectivity || "unknown")} · ${escapeHtml(item.code || item.httpStatus || "no status")} · ${escapeHtml(item.message || "No technical message")}</small></div></div>`).join("")}</div></article>` : ""}
        <article class="ops-card"><h3>Morning Readiness</h3><div class="fact-list"><div class="fact"><span>Status</span><strong>${day?.readiness ? "Complete" : "Not recorded"}</strong></div><div class="fact"><span>Original time</span><strong>${formatTime(originalReadiness)}</strong></div>${readinessCorrection ? `<div class="fact"><span>Admin-adjusted time</span><strong>${formatTime(readinessCorrection.correctedValue)}</strong></div><div class="fact"><span>Effective activity start</span><strong>${formatTime(effectiveReadiness)}</strong></div><div class="fact"><span>Changed by</span><strong>${escapeHtml(readinessCorrection.correctedByName || readinessCorrection.correctedByEmail || "MPI Admin")}</strong></div><div class="fact"><span>Changed</span><strong>${escapeHtml(formatDateTime(readinessCorrection.correctedAt))}</strong></div><div class="fact"><span>Reason</span><strong>${escapeHtml(readinessCorrection.reason || "—")}</strong></div>` : `<div class="fact"><span>Effective activity start</span><strong>${formatTime(effectiveReadiness)}</strong></div>`}<div class="fact"><span>Important notifications</span><strong>${escapeHtml(day?.readiness?.notificationPermission === "granted" ? "Enabled" : day?.readiness?.notificationPermission || "Unknown")}</strong></div></div></article>
        <article class="ops-card span-6"><h3>Lab Activity &amp; Chain of Custody</h3>${labHtml(person, day)}</article>
        <article class="ops-card"><h3>End-of-Day Status</h3><div class="fact-list"><div class="fact"><span>Status</span><strong>${escapeHtml(eodStatus)}</strong></div><div class="fact"><span>Clock out</span><strong>${formatTime(clockOut)}</strong></div><div class="fact"><span>Last recorded location</span><strong>${locationLink}</strong></div><div class="fact"><span>Equipment check</span><strong>${day?.dayComplete?.equipment?.length ? "Complete" : "Pending"}</strong></div></div><p class="ops-sub">Location is event-based, not continuous. Never treat a stale location as live.</p></article>
        <article class="ops-card span-6"><h3>Admin Corrections</h3><p class="ops-sub">Corrections are appended to the audit trail. Original records are never deleted or overwritten.</p><form class="compact-form" id="adminCorrectionForm" data-person-id="${escapeHtml(person.id)}"><div class="two-col"><div class="field"><label for="adminCorrectionAction">Missed / incorrect action</label><select id="adminCorrectionAction" required>${correctionActions.map(action => `<option value="${escapeHtml(action)}">${escapeHtml(action)}</option>`).join("")}</select></div><div class="field"><label for="adminCorrectionJob">Job</label><select id="adminCorrectionJob"><option value="">No specific job</option>${jobOptions}</select></div></div><div class="field"><label for="adminCorrectionValue">Correct date and time</label><input id="adminCorrectionValue" type="datetime-local" required></div><div class="field"><label for="adminCorrectionReason">Reason for correction</label><textarea id="adminCorrectionReason" maxlength="500" required placeholder="Explain why management is adding this correction."></textarea></div><button class="primary" type="submit">ADD AUDITABLE CORRECTION</button><span class="status" id="adminCorrectionStatus"></span></form><h3 style="margin-top:20px">Correction History</h3><div class="correction-history">${correctionHistoryHtml(person, day)}</div></article>
      </div>`;
    teamOverview.hidden = true;
    inspectorDetail.hidden = false;
    updateOperationalClocks();
  }

  function renderOperations() {
    const preserveCorrectionDraft = selectedInspectorId !== "all" && correctionDraftIsActive();
    renderOperationsStats();
    rangePicker.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.range === currentRange));
    const syncDates = operativePeople().map(person => asDate(person.operationsUpdatedAt)).filter(Boolean);
    const latest = syncDates.sort((a, b) => b - a)[0];
    operationsSync.textContent = latest ? `Latest device sync ${formatDateTime(latest)}` : "Waiting for inspector devices to sync.";
    if (selectedInspectorId === "all") renderTeamOverview();
    else {
      const entry = overviewEntry(selectedInspectorId);
      if (!entry) renderTeamOverview();
      else if (entry.kind === "subcontractor") renderSubcontractorDetail(entry);
      else if (!preserveCorrectionDraft) renderInspectorDetail(entry.person);
    }
    renderSafetyAlerts();
    renderLiveLocationMap();
    updateOperationalClocks();
  }

  function receiptSummary(updateId) {
    const values = updateReceiptRecords.filter(item => item.updateId === updateId);
    return {
      total: values.length,
      delivered: values.filter(item => ["delivered", "acknowledged", "completed", "read", "replied"].includes(item.status)).length,
      acknowledged: values.filter(item => ["acknowledged", "completed", "read", "replied"].includes(item.status)).length,
      completed: values.filter(item => item.status === "completed").length,
      replies: values.filter(item => item.replyText)
    };
  }

  function renderUpdates() {
    const summaries = updates.map(update => receiptSummary(update.id));
    const summaryReplies = summaries.flatMap((summary, index) => summary.replies.map(reply => ({
      ...reply,
      updateId: updates[index]?.id || "",
      updateTitle: updates[index]?.title || "Office update"
    })));
    if (summaryReplies.length) {
      const merged = new Map(inspectorReplies.map(reply => [`${reply.updateId}:${reply.userId || reply.userEmail || "unknown"}`, reply]));
      summaryReplies.forEach(reply => merged.set(`${reply.updateId}:${reply.userId || reply.userEmail || "unknown"}`, reply));
      inspectorReplies = [...merged.values()].sort((a, b) => (asDate(b.repliedAt)?.getTime() || 0) - (asDate(a.repliedAt)?.getTime() || 0));
    }
    updatesList.innerHTML = updates.length ? updates.map((update, index) => {
      const summary = summaries[index];
      const recipient = update.audience === "all" ? "All inspectors" : update.targetName || update.targetEmail || "One inspector";
      const replies = summary.replies.length ? `<div class="admin-update-replies"><strong>Inspector replies</strong>${summary.replies.map(reply => `<p><b>${escapeHtml(reply.userName || reply.userEmail || "Inspector")}:</b> ${escapeHtml(reply.replyText)}</p>`).join("")}</div>` : "";
      const readState = summary.acknowledged > 0 ? "read" : summary.delivered > 0 ? "delivered" : "sent";
      return `<article class="update-card"><div class="update-top"><div><span class="type-badge">${escapeHtml(String(update.type || "update").replace("-", " "))}</span>${update.priority !== "normal" ? `<span class="priority-badge">${escapeHtml(update.priority)}</span>` : ""}<h3>${escapeHtml(update.title)}</h3></div><span class="role-badge">${escapeHtml(recipient)}</span></div><p>${escapeHtml(update.message)}</p>${adminAttachmentsHtml(update)}<div class="update-meta"><span>Sent by ${escapeHtml(update.createdByName || update.createdByEmail || "MPI Office")}</span><span>Published ${escapeHtml(formatDateTime(update.createdAt))}</span>${update.dueDate ? `<span>Due ${escapeHtml(formatDate(update.dueDate))}</span>` : ""}${deliveryStateHtml(readState)}<span>${summary.delivered} delivered</span><span>${summary.acknowledged} read / acknowledged</span></div>${replies}</article>`;
    }).join("") : '<div class="empty">No office updates have been published.</div>';
    renderAdminSentMessages();
    refreshAdminInboxConversation();
  }

  function canonicalTeamName(person) {
    const email = shared.normalizeEmail(person?.email);
    if (email === "admin@michiganpropertyinspections.com") return "Brooke";
    if (/^corey leese$/i.test(String(person?.name || "").trim())) return "Cory Leese";
    return String(person?.name || person?.email || "MPI Team Member");
  }

  function syncTeamDirectory() {
    if (!currentUser || !shared.isAdminRole(currentProfile) || !people.length) return;
    const batch = shared.db.batch();
    const directoryPeople = [
      ...people.filter(person => person.active !== false && person.role !== "subcontractor"),
      ...preferredSubcontractors(people.filter(person => person.active !== false && person.role === "subcontractor"))
    ];
    directoryPeople.forEach(person => {
      const correctedName = canonicalTeamName(person);
      batch.set(shared.db.collection("teamDirectory").doc(person.id), {
        userId: person.id,
        name: correctedName.slice(0, 80),
        email: shared.normalizeEmail(person.email),
        role: String(person.role || "inspector").toLowerCase(),
        photoURL: String(person.photoURL || "").slice(0, 1000),
        profilePhoto: String(person.profilePhoto || "").slice(0, 220000),
        notificationToken: String(person.notificationDevice?.token || person.officeNotificationDevice?.token || "").slice(0, 500),
        active: true,
        updatedAt: shared.serverTimestamp()
      }, { merge: true });
    });
    batch.commit().catch(() => false);
  }

  function startAdminData() {
    unsubscribePeople?.();
    unsubscribeUpdates?.();
    unsubscribeReplies?.();
    unsubscribeFieldMessages?.();
    unsubscribeDirectMessages?.();
    updateReceiptRecords = [];
    messageReceiptCache.clear();
    if (!liveLocationAgeTimer) liveLocationAgeTimer = window.setInterval(() => {
      renderLiveLocationMap();
      updateOperationalClocks();
    }, 60000);
    unsubscribePeople = shared.db.collection("users").orderBy("name").onSnapshot(snapshot => {
      people = snapshot.docs.map(doc => {
        const value = { id: doc.id, ...doc.data() };
        if (/^corey leese$/i.test(String(value.name || "").trim())) value.name = "Cory Leese";
        if (shared.normalizeEmail(value.email) === "admin@michiganpropertyinspections.com") value.name = "Brooke";
        return value;
      });
      people.forEach(person => progressAssignedRequests(person));
      if (!legacyRequestChecked) {
        legacyRequestChecked = true;
        const kevin = people.find(person => shared.normalizeEmail(person.email) === "kev@michiganpropertyinspections.com");
        const exists = kevin?.fieldRequests?.some(item => item.id === "legacy-safety-glasses-20260903-1152");
        if (kevin && !exists) {
          const request = {
            id: "legacy-safety-glasses-20260903-1152",
            type: "PPE or safety equipment",
            item: "Safety Glasses",
            inspector: kevin.name || "Kevin Cave",
            inspectorId: kevin.inspectorId || "",
            inspectorEmail: kevin.email,
            requestedAt: "2026-09-03T11:52:00-04:00",
            neededBy: "",
            asap: true,
            details: "Safety glasses requested by the inspector.",
            suggestion: "",
            status: "new",
            assignedAdmin: "",
            completedAt: "",
            completedBy: "",
            backfilled: true
          };
          shared.db.collection("users").doc(kevin.id).set({ fieldRequests: shared.arrayUnion(request), requestsUpdatedAt: shared.serverTimestamp() }, { merge: true }).catch(() => { legacyRequestChecked = false; });
        }
      }
      people.forEach(person => {
        const inspectorId = String(shared.knownInspectorNumber?.(person) || person.inspectorId || "").trim();
        if (inspectorId && inspectorId !== person.inspectorId) {
          shared.db.collection("users").doc(person.id).set({ inspectorId, updatedAt: shared.serverTimestamp(), updatedBy: currentUser?.uid || "system" }, { merge: true }).catch(() => {});
        }
      });
      syncTeamDirectory();
      if (!teamDeepLinkApplied) {
        const targetUid = new URL(window.location.href).searchParams.get("team") || "";
        const targetEntry = teamOverviewEntries().find(entry => entry.person?.id === targetUid);
        if (targetEntry) {
          activeInboxPersonId = targetEntry.person.id;
          showView("updates");
          renderAdminInboxConversation(activeInboxPersonId);
        }
        teamDeepLinkApplied = true;
      }
      renderPeople();
    }, error => { authStatus.textContent = error.message; });
    officeUpdateListenerReady = false;
    knownOfficeUpdateIds = new Set();
    unsubscribeUpdates = shared.db.collection("officeUpdates").orderBy("createdAt", "desc").limit(200).onSnapshot(snapshot => {
      const values = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(update => !update.hidden);
      if (officeUpdateListenerReady) {
        const myEmail = shared.normalizeEmail(currentUser?.email);
        const direct = values.find(update => !knownOfficeUpdateIds.has(update.id) && update.type === "message" && shared.normalizeEmail(update.targetEmail) === myEmail && update.createdBy !== currentUser?.uid);
        if (direct) showOfficeAlert(`Message from ${direct.createdByName || "MPI Office"}`, direct.message || "A new internal message is available.", `mpi-office-team-${direct.id}`);
      }
      updates = values;
      knownOfficeUpdateIds = new Set(values.map(update => update.id));
      officeUpdateListenerReady = true;
      renderUpdates();
    }, error => { publishStatus.textContent = error.message; publishStatus.className = "status error"; });
    replyListenerReady = false;
    knownReplyKeys = new Set();
    unsubscribeReplies = shared.db.collectionGroup("receipts").onSnapshot(processReplySnapshot, () => {
    });
    fieldMessageListenerReady = false;
    knownFieldMessageIds = new Set();
    unsubscribeFieldMessages = shared.db.collection("fieldMessages").orderBy("createdAt", "desc").limit(200).onSnapshot(processFieldMessages, () => {
      fieldMessages = [];
      renderAdminUnifiedInbox();
    });
    directMessageListenerReady = false;
    unsubscribeDirectMessages = shared.watchDirectMessages(currentUser, (values, error) => {
      if (error) return;
      const previousIds = new Set(directMessages.map(item => item.id));
      const fresh = directMessageListenerReady ? values.filter(item => !previousIds.has(item.id) && item.senderUid !== currentUser.uid) : [];
      directMessages = values;
      if (fresh.length) {
        const latest = fresh[0];
        showOfficeAlert(
          `Message from ${latest.senderName || "MPI Team Member"}`,
          latest.message || "A team attachment is available.",
          `mpi-team-${latest.id}`,
          `./admin.html?view=inbox&team=${encodeURIComponent(latest.senderUid || "")}`
        );
      }
      directMessageListenerReady = true;
      renderAdminUnifiedInbox();
      renderAdminSentMessages();
      refreshAdminInboxConversation();
    });
  }

  async function publishUpdate(event) {
    event.preventDefault();
    if (!currentUser || !shared.isAdminRole(currentProfile)) return;
    const audience = audienceInput.value;
    const targetPerson = audience === "inspector" ? people.find(person => person.id === targetInput.value) : null;
    const targetUid = targetPerson?.id || "";
    const targetEmail = targetPerson ? shared.normalizeEmail(targetPerson.email) : "";
    if (audience === "inspector" && !targetPerson) {
      publishStatus.textContent = "Choose the inspector who should receive this item.";
      publishStatus.className = "status error";
      targetInput.focus();
      return;
    }
    const filesToUpload = [...selectedFiles];
    const notificationTitle = titleInput.value.trim();
    const notificationBody = messageInput.value.trim();
    publishButton.disabled = true;
    publishStatus.textContent = "Publishing…";
    publishStatus.className = "status";
    let updateRef = null;
    try {
      updateRef = shared.db.collection("officeUpdates").doc();
      await updateRef.set({
        type: typeInput.value,
        priority: priorityInput.value,
        audience: audience === "all" ? "all" : "inspector",
        targetUid,
        targetEmail,
        targetName: targetPerson?.name || "",
        title: notificationTitle,
        message: notificationBody,
        link: linkInput.value.trim(),
        dueDate: dueInput.value,
        requiresAcknowledgement: ackInput.checked,
        active: filesToUpload.length === 0,
        attachmentUploadStatus: filesToUpload.length ? "uploading" : "complete",
        attachmentCount: filesToUpload.length,
        attachments: [],
        replyNotificationToken: officeReplyToken(),
        createdAt: shared.serverTimestamp(),
        createdBy: currentUser.uid,
        createdByEmail: shared.normalizeEmail(currentUser.email),
        createdByName: currentProfile.name || currentUser.displayName || "MPI Management"
      });
      if (filesToUpload.length) {
        const attachments = await uploadAttachments(updateRef, filesToUpload, audience === "all" ? "all" : "inspector", targetEmail, publishStatus, targetUid);
        await updateRef.update({ attachments, attachmentUploadStatus: "complete", active: true, publishedAt: shared.serverTimestamp() });
      }
      form.reset();
      selectedFiles = [];
      renderSelectedFiles();
      ackInput.checked = true;
      audienceInput.value = "all";
      targetField.hidden = true;
      publishStatus.textContent = "Published to MPI Field Tools.";
      publishStatus.className = "status success";
      const pushRequested = await shared.sendPushNotification({
        kind: "office-update",
        audience: audience === "all" ? "all" : "inspector",
        targetTokens: notificationTokensForUpdate(audience === "all" ? "all" : "inspector", targetEmail, targetUid),
        title: notificationTitle || "New message from MPI Office",
        body: notificationBody || "Open MPI Field Tools to review the new information.",
        link: "./#inbox",
        tag: `mpi-office-${updateRef.id}`
      }).catch(() => false);
      publishStatus.textContent = pushRequested
        ? "Published to MPI Field Tools and push alert requested."
        : "Published to MPI Field Tools. The recipient has not enabled push alerts on this phone yet.";
      showView("updates");
    } catch (error) {
      if (updateRef) updateRef.set({ active: false, attachmentUploadStatus: "failed", attachmentUploadError: String(error?.message || "Upload failed").slice(0, 240) }, { merge: true }).catch(() => {});
      publishStatus.textContent = error.message || "The update could not be published.";
      publishStatus.className = "status error";
    } finally {
      publishButton.disabled = false;
    }
  }

  async function sendInspectorMessage(formElement) {
    const person = people.find(item => item.id === formElement.dataset.personId) || (formElement.dataset.targetEmail ? {
      id: formElement.dataset.personId || "",
      email: formElement.dataset.targetEmail,
      name: formElement.dataset.targetName || "MPI Inspector",
      role: "inspector"
    } : null);
    const text = formElement.querySelector("[data-message-text], #adminMessageText")?.value.trim();
    const status = formElement.querySelector("[data-message-status], #adminMessageStatus");
    if (!person || !text) return;
    const safetyAlertId = String(formElement.dataset.safetyAlertId || "").trim();
    const isSafetyReply = Boolean(safetyAlertId);
    const files = [...(formElement._mpiFiles || [])];
    status.textContent = "Sending…";
    let messageRef = null;
    try {
      if (!isSafetyReply) {
        await shared.sendDirectMessage(currentUser, currentProfile, person, text, files);
        formElement.reset();
        formElement._mpiFiles = [];
        renderChatFiles(formElement);
        status.textContent = `Private message sent only to ${person.name || "this team member"}.`;
        status.className = "status success";
        return;
      }
      messageRef = shared.db.collection("officeUpdates").doc();
      await messageRef.set({
        type: "message", priority: isSafetyReply ? "critical" : "important", audience: "inspector",
        targetUid: person.id || "", targetEmail: shared.normalizeEmail(person.email), targetName: person.name || "",
        title: isSafetyReply ? "Safety follow-up from MPI Office" : "Message from MPI Office", message: text, link: "", dueDate: "", requiresAcknowledgement: isSafetyReply, active: files.length === 0, attachments: [],
        replyToSafetyAlertId: safetyAlertId,
        replyNotificationToken: officeReplyToken(),
        createdAt: shared.serverTimestamp(), createdBy: currentUser.uid,
        createdByEmail: shared.normalizeEmail(currentUser.email), createdByName: currentProfile.name || currentUser.displayName || "MPI Management"
      });
      if (files.length) {
        const attachments = await uploadAttachments(messageRef, files, "inspector", shared.normalizeEmail(person.email), status, person.id || "");
        await messageRef.update({ attachments, active: true, attachmentUploadStatus: "complete", publishedAt: shared.serverTimestamp() });
      }
      const pushRequested = await shared.sendPushNotification({
        kind: "office-message",
        audience: "inspector",
        targetTokens: notificationTokensForUpdate("inspector", person.email, person.id),
        title: isSafetyReply ? "SAFETY FOLLOW-UP FROM MPI OFFICE" : "Message from MPI Office",
        body: text,
        link: ["owner", "admin"].includes(String(person.role || "").toLowerCase()) ? "./admin.html" : person.role === "subcontractor" ? "./?subcontractor=jason#subcontractor-home" : "./#team-messages",
        tag: `mpi-office-${messageRef.id}`
      }).catch(() => false);
      formElement.reset();
      formElement._mpiFiles = [];
      renderChatFiles(formElement);
      status.textContent = pushRequested
        ? `${isSafetyReply ? "Safety reply" : "Message"} sent to ${person.name || "field user"}; push alert requested.`
        : `${isSafetyReply ? "Safety reply" : "Message"} sent to ${person.name || "field user"}. Push alerts are not enabled on that phone yet.`;
      status.className = "status success";
    } catch (error) {
      if (messageRef) messageRef.set({ active: false, attachmentUploadStatus: "failed" }, { merge: true }).catch(() => {});
      status.textContent = error.message || "The message could not be sent.";
      status.className = "status error";
    }
  }

  async function sendAdminInboxMessage(event) {
    event.preventDefault();
    const person = people.find(item => item.id === inboxComposeRecipient?.value);
    if (!person || !currentUser || !currentProfile) {
      inboxComposeStatus.textContent = "Choose one MPI team member.";
      inboxComposeStatus.className = "status error";
      return;
    }
    inboxComposeSend.disabled = true;
    inboxComposeStatus.textContent = `Sending only to ${canonicalTeamName(person)}…`;
    inboxComposeStatus.className = "status";
    try {
      await shared.sendDirectMessage(currentUser, currentProfile, person, inboxComposeText.value, [...(inboxComposeFiles.files || [])]);
      inboxComposeForm.reset();
      inboxComposeStatus.textContent = `Private message sent only to ${canonicalTeamName(person)}.`;
      inboxComposeStatus.className = "status success";
      openAdminInboxConversation(person.id);
    } catch (error) {
      inboxComposeStatus.textContent = error?.message || "The private message could not be sent.";
      inboxComposeStatus.className = "status error";
    } finally {
      inboxComposeSend.disabled = false;
    }
  }

  async function resetAdminTestSubcontractor(button) {
    const card = button.closest("[data-subcontractor-person]");
    const person = people.find(item => item.id === card?.dataset.subcontractorPerson);
    if (!person || !shared.isAdminRole(currentProfile)) return;
    button.disabled = true;
    const timestamp = new Date().toISOString();
    const reset = {
      date: dateKey(), test: true, currentJobNumber: 1,
      subcontractorName: "Jason Chamarro", subcontractorPhone: "",
      currentJob: { number: 1, status: "ready", onWayAt: "", arrivedAt: "", completedAt: "" },
      completedJobs: [], lab: null, resumeAfterLab: null,
      status: "READY FOR JOB 1", events: [], updatedAtClient: timestamp
    };
    try {
      await shared.db.collection("users").doc(person.id).set({ subcontractorTestCurrent: reset, subcontractorUpdatedAt: shared.serverTimestamp() }, { merge: true });
    } catch (error) {
      button.disabled = false;
      button.textContent = error.message || "RESET FAILED — TRY AGAIN";
    }
  }

  function subcontractorKey(person) {
    return String(person?.subcontractorKey || person?.name || "subcontractor").trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9-]/g, "") || "subcontractor";
  }

  function newSubcontractorAccessId() {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function subcontractorProductionLink(person, accessId) {
    const base = window.location.pathname.replace(/admin\.html.*$/i, "");
    return `${window.location.origin}${base}?subcontractor=${encodeURIComponent(subcontractorKey(person))}&access=${encodeURIComponent(accessId)}&handoff=app#subcontractor-home`;
  }

  async function activeSubcontractorAccess(person) {
    const existingId = String(person?.subcontractorAccessId || "").trim();
    if (existingId) {
      const snapshot = await shared.db.collection("subcontractorAccess").doc(existingId).get();
      if (snapshot.exists && snapshot.data()?.active === true) {
        if (snapshot.data()?.deviceUid) throw new Error("This subcontractor phone is already activated. Revoke access first only when replacing the phone.");
        return { id: existingId, ...snapshot.data() };
      }
    }
    const accessId = newSubcontractorAccessId();
    const access = {
      targetKey: subcontractorKey(person),
      targetName: String(person?.name || "MPI Subcontractor").slice(0, 80),
      phone: String(person?.phone || "").slice(0, 30),
      sourceProfileId: String(person?.sourceProfileId || person?.id || "").slice(0, 120),
      active: true,
      deviceUid: "",
      createdAt: shared.serverTimestamp(),
      createdBy: currentUser.uid,
      createdByEmail: shared.normalizeEmail(currentUser.email)
    };
    await shared.db.collection("subcontractorAccess").doc(accessId).set(access);
    await shared.db.collection("users").doc(person.id).set({
      active: true,
      subcontractorKey: access.targetKey,
      subcontractorAccessId: accessId,
      subcontractorAccessIssuedAt: shared.serverTimestamp(),
      subcontractorAccessIssuedBy: currentUser.uid
    }, { merge: true });
    return { id: accessId, ...access };
  }

  async function copySubcontractorLink(button) {
    const person = people.find(item => item.id === button.dataset.copySubcontractorLink);
    const status = button.closest("[data-person-id], [data-subcontractor-person]")?.querySelector("[data-subcontractor-access-status]");
    if (!person) return;
    button.disabled = true;
    let link = "";
    try {
      if (!shared.isAdminRole(currentProfile)) throw new Error("Office access is required.");
      const access = await activeSubcontractorAccess(person);
      link = subcontractorProductionLink(person, access.id);
      await navigator.clipboard.writeText(link);
      if (status) status.textContent = `Private app-activation link copied for ${person.name || "subcontractor"}. Send it after MPI Field Tools is installed; it can activate one phone only.`;
    } catch (error) {
      if (status) status.textContent = link ? `Copy this private activation link: ${link}` : error?.message || "The private activation link could not be created.";
    } finally {
      button.disabled = false;
    }
  }

  async function revokeSubcontractorAccess(button) {
    const person = people.find(item => item.id === button.dataset.revokeSubcontractor);
    const status = button.closest("[data-person-id], [data-subcontractor-person]")?.querySelector("[data-subcontractor-access-status]");
    if (!person || person.role !== "subcontractor" || !shared.isAdminRole(currentProfile)) return;
    button.disabled = true;
    if (status) status.textContent = `Revoking ${person.name || "subcontractor"}…`;
    try {
      const accessId = String(person.subcontractorAccessId || "").trim();
      const related = people.filter(item => item.role === "subcontractor" && (item.id === person.id || (accessId && item.subcontractorAccessId === accessId) || (person.sourceProfileId && item.id === person.sourceProfileId) || (item.sourceProfileId && item.sourceProfileId === person.id)));
      const batch = shared.db.batch();
      related.forEach(item => batch.set(shared.db.collection("users").doc(item.id), {
          active: false,
          notificationDevice: null,
          subcontractorAccessRevokedAt: shared.serverTimestamp(),
          subcontractorAccessRevokedBy: currentUser.uid,
          subcontractorAccessRevision: Number(item.subcontractorAccessRevision || 0) + 1
        }, { merge: true }));
      if (accessId) batch.set(shared.db.collection("subcontractorAccess").doc(accessId), { active: false, revokedAt: shared.serverTimestamp(), revokedBy: currentUser.uid }, { merge: true });
      await batch.commit();
      if (status) status.textContent = "Old-phone access revoked. Copy a new app-activation link when the replacement phone is ready.";
    } catch (error) {
      button.disabled = false;
      if (status) status.textContent = error.message || "Access could not be revoked.";
    }
  }

  async function addAdminCorrection(formElement) {
    const person = people.find(item => item.id === formElement.dataset.personId);
    const day = selectedOperationDay(person);
    const action = formElement.querySelector("#adminCorrectionAction").value;
    const jobId = formElement.querySelector("#adminCorrectionJob").value;
    const correctedValue = formElement.querySelector("#adminCorrectionValue").value;
    const reason = formElement.querySelector("#adminCorrectionReason").value.trim();
    const status = formElement.querySelector("#adminCorrectionStatus");
    if (!person || !day || !action || !correctedValue || !reason) return;
    const original = (day.activity || []).find(item => item.action === action && (!jobId || String(item.calendarEventId || item.jobId || "") === jobId));
    const job = (day.jobs || []).find(item => item.id === jobId);
    const rawSessions = Array.isArray(day.timeClock?.sessions) ? day.timeClock.sessions : [];
    const originalValue = action === "Hours Worked start"
      ? rawSessions.find(item => item.clockedInAt)?.clockedInAt || day.timeClock?.hoursWorkedStartedAt || ""
      : action === "Hours Worked end"
        ? rawSessions.slice().reverse().find(item => item.clockedOutAt)?.clockedOutAt || ""
        : original?.timestamp || rawActionTime(day, action, jobId) || "";
    const correction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: day.date, targetAction: action, targetEventId: original?.id || "", jobId,
      property: job?.property || original?.property || "", originalValue,
      correctedValue: new Date(correctedValue).toISOString(), reason, correctedAt: new Date().toISOString(),
      correctedById: currentUser.uid, correctedByEmail: shared.normalizeEmail(currentUser.email),
      correctedByName: currentProfile.name || currentUser.displayName || "MPI Admin"
    };
    const corrections = [correction];
    const firstScheduledJob = (day.jobs || []).slice().sort((left, right) => (asDate(left.scheduledStart)?.getTime() || 0) - (asDate(right.scheduledStart)?.getTime() || 0))[0];
    const firstPaidSession = rawSessions.find(item => item.clockedInAt && !["morning-readiness", "activity-only"].includes(String(item.startSource || "legacy-manual-clock")));
    if (action === "Arrived" && jobId && String(firstScheduledJob?.id || "") === String(jobId) && String(firstPaidSession?.startSource || "").toLowerCase() !== "nachi-training") {
      const originalHoursStart = firstPaidSession?.clockedInAt
        || day.timeClock?.hoursWorkedStartedAt
        || originalValue;
      corrections.push({
        ...correction,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-hours`,
        targetAction: "Hours Worked start",
        targetEventId: "",
        originalValue: originalHoursStart,
        reason: `First-job arrival correction: ${reason}`
      });
    }
    status.textContent = "Adding correction and recalculating totals…";
    try {
      await shared.db.collection("users").doc(person.id).update({ adminCorrections: shared.arrayUnion(...corrections), operationsUpdatedAt: shared.serverTimestamp() });
      formElement.reset();
      status.textContent = "Correction added. Hours Worked and Drive Time have been recalculated.";
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
    if (role === "owner" && !shared.isOwnerEmail(currentUser?.email)) return;
    const active = card.querySelector("[data-person-active]").checked;
    const inspectorId = card.querySelector("[data-person-inspector-id]").value.trim().slice(0, 40);
    const phone = card.querySelector("[data-person-phone]").value.trim().slice(0, 30);
    const approvedEndAddress = card.querySelector("[data-person-end-address]").value.trim().slice(0, 180);
    const jobTitle = card.querySelector("[data-person-job-title]")?.value.trim().slice(0, 80) || "";
    const personalAddress = card.querySelector("[data-person-personal-address]")?.value.trim().slice(0, 180) || "";
    const emergencyContactName = card.querySelector("[data-person-emergency-name]")?.value.trim().slice(0, 80) || "";
    const emergencyContactPhone = card.querySelector("[data-person-emergency-phone]")?.value.trim().slice(0, 30) || "";
    const rawTranscriptUrl = card.querySelector("[data-person-transcript-url]")?.value.trim() || "";
    const nachiTranscriptUrl = /^https:\/\//i.test(rawTranscriptUrl) ? rawTranscriptUrl.slice(0, 500) : "";
    try {
      await shared.db.collection("users").doc(person.id).set({ role, active, inspectorId, phone, approvedEndAddress, jobTitle, personalAddress, emergencyContactName, emergencyContactPhone, nachiTranscriptUrl, updatedAt: shared.serverTimestamp(), updatedBy: currentUser.uid }, { merge: true });
    } catch (error) {
      authStatus.textContent = error.message || "The account change could not be saved.";
    }
  }

  adminOnboardingBack?.addEventListener("click", () => {
    if (adminOnboardingStep <= 0) return;
    adminOnboardingStep -= 1;
    renderAdminOnboarding();
  });
  adminOnboardingNext?.addEventListener("click", () => {
    if (adminOnboardingStep < adminOnboardingSteps.length - 1) {
      adminOnboardingStep += 1;
      renderAdminOnboarding();
      return;
    }
    completeAdminOnboarding();
  });
  adminOnboardingBody?.addEventListener("click", async event => {
    const button = event.target.closest("[data-onboarding-enable-alerts]");
    if (!button) return;
    const status = adminOnboardingBody.querySelector("[data-onboarding-alert-status]");
    button.disabled = true;
    if (status) status.textContent = "Opening notification permission…";
    const enabled = await enableOfficeAlerts(button, true);
    button.disabled = enabled;
    button.textContent = enabled ? "OFFICE ALERTS ENABLED" : "TRY OFFICE ALERTS AGAIN";
    if (status) status.textContent = enabled ? "Alerts are enabled on this device." : "Alerts were not enabled. Check the device notification settings, then try again.";
  });

  tabButtons.forEach(button => button.addEventListener("click", () => showView(button.dataset.adminView)));
  dashboard.addEventListener("change", event => {
    const input = event.target.closest("[data-chat-files]");
    if (!input) return;
    addChatFiles(input.closest("form"), input.files || []);
    input.value = "";
  });
  dashboard.addEventListener("dragover", event => {
    const drop = event.target.closest("[data-chat-drop]");
    if (!drop) return;
    event.preventDefault();
    drop.classList.add("dragging");
  });
  dashboard.addEventListener("dragleave", event => event.target.closest("[data-chat-drop]")?.classList.remove("dragging"));
  dashboard.addEventListener("drop", event => {
    const drop = event.target.closest("[data-chat-drop]");
    if (!drop) return;
    event.preventDefault();
    drop.classList.remove("dragging");
    addChatFiles(drop.closest("form"), event.dataTransfer?.files || []);
  });
  dashboard.addEventListener("keydown", event => {
    const drop = event.target.closest("[data-chat-drop]");
    if (!drop || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    drop.querySelector("[data-chat-files]")?.click();
  });
  dashboard.addEventListener("click", event => {
    const remove = event.target.closest("[data-remove-chat-file]");
    if (!remove) return;
    const formElement = remove.closest("form");
    formElement._mpiFiles?.splice(Number(remove.dataset.removeChatFile), 1);
    renderChatFiles(formElement);
  });
  subcontractorList?.addEventListener("click", event => {
    const button = event.target.closest("[data-reset-admin-test-subcontractor]");
    if (button) resetAdminTestSubcontractor(button);
  });
  audienceInput.addEventListener("change", () => { targetField.hidden = audienceInput.value !== "inspector"; });
  attachmentInput.addEventListener("change", () => addSelectedFiles(attachmentInput.files || []));
  attachmentDrop.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      attachmentInput.click();
    }
  });
  ["dragenter", "dragover"].forEach(name => attachmentDrop.addEventListener(name, event => { event.preventDefault(); attachmentDrop.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach(name => attachmentDrop.addEventListener(name, event => { event.preventDefault(); attachmentDrop.classList.remove("dragging"); }));
  attachmentDrop.addEventListener("drop", event => addSelectedFiles(event.dataTransfer?.files || []));
  attachmentList.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-attachment]");
    if (!button) return;
    selectedFiles.splice(Number(button.dataset.removeAttachment), 1);
    renderSelectedFiles();
  });
  form.addEventListener("submit", publishUpdate);
  inboxComposeForm?.addEventListener("submit", sendAdminInboxMessage);
  updatesList.addEventListener("click", event => {
    const button = event.target.closest("[data-open-admin-attachment]");
    if (button) openAdminAttachment(button);
  });
  [requestStatusFilter, requestInspectorFilter, requestTypeFilter, requestAssigneeFilter, requestDateFilter, requestSort].forEach(control => control?.addEventListener("change", renderRequestTodos));
  diagnosticStatusFilter?.addEventListener("change", renderDiagnostics);
  diagnosticList?.addEventListener("change", event => {
    const select = event.target.closest("[data-diagnostic-status]");
    if (select) updateDiagnosticStatus(select);
  });
  requestList?.addEventListener("submit", event => {
    const requestForm = event.target.closest("[data-request-admin-form]");
    if (!requestForm) return;
    event.preventDefault();
    saveRequestTodo(requestForm);
  });
  requestList?.addEventListener("change", event => {
    const formElement = event.target.closest("[data-request-admin-form]");
    if (!formElement) return;
    const statusControl = formElement.querySelector("[data-request-status]");
    if (event.target.matches("[data-request-admin]") && event.target.value && statusControl.value === "new") statusControl.value = "in-progress";
    const completedField = formElement.querySelector("[data-request-completed-field]");
    if (completedField) completedField.hidden = statusControl.value !== "completed";
  });
  officeAlertButtons.forEach(button => button.addEventListener("click", () => enableOfficeAlerts(button, true)));
  unifiedInboxList?.addEventListener("click", event => {
    const button = event.target.closest("[data-admin-inbox-kind]");
    if (!button) return;
    const kind = button.dataset.adminInboxKind;
    const personId = button.dataset.adminInboxPerson || "";
    if (kind === "field") {
      const message = fieldMessages.find(item => item.id === button.dataset.adminInboxMessage);
      if (message?.kind !== "safety-alert") {
        message.readBy = [...new Set([...(Array.isArray(message.readBy) ? message.readBy : []), currentUser.uid])];
        markReplyRead(`field:${message.id}`);
        shared.markFieldMessageRead?.(currentUser, message.id).catch(() => false);
      }
    } else if (kind === "direct") {
      directMessages.forEach(message => {
        if (message.senderUid === personId && message.targetUid === currentUser.uid) {
          message.readBy = [...new Set([...(Array.isArray(message.readBy) ? message.readBy : []), currentUser.uid])];
        }
      });
      shared.markDirectConversationRead?.(currentUser, personId).catch(() => false);
      renderAdminUnifiedInbox();
    } else if (kind === "receipt") {
      markReplyRead(button.dataset.adminInboxKey || "");
    }
    if (personId) openAdminInboxConversation(personId);
  });
  sentMessagesList?.addEventListener("click", event => {
    const button = event.target.closest("[data-admin-sent-person]");
    const personId = button?.dataset.adminSentPerson || "";
    if (personId) openAdminInboxConversation(personId);
  });
  safetyAlertCenter?.addEventListener("click", event => {
    const button = event.target.closest("[data-acknowledge-safety]");
    if (!button) return;
    button.disabled = true;
    button.textContent = "ACKNOWLEDGED";
    acknowledgeSafetyAlert(button.dataset.acknowledgeSafety);
  });
  inboxConversation?.addEventListener("click", event => {
    if (event.target.closest("[data-close-admin-conversation]")) {
      closeAdminInboxConversation();
      return;
    }
    const messageTodo = event.target.closest("[data-create-message-todo]");
    if (messageTodo) {
      createTodoFromMessage(messageTodo);
      return;
    }
    const fieldAttachment = event.target.closest("[data-open-field-attachment]");
    if (fieldAttachment) {
      openFieldAttachment(fieldAttachment);
      return;
    }
    const directAttachment = event.target.closest("[data-open-direct-attachment]");
    if (directAttachment) {
      openDirectAttachment(directAttachment);
      return;
    }
    const officeAttachment = event.target.closest("[data-open-admin-attachment]");
    if (officeAttachment) openAdminAttachment(officeAttachment);
  });
  inboxConversation?.addEventListener("submit", event => {
    const formElement = event.target.closest("[data-admin-conversation-form]");
    if (!formElement) return;
    event.preventDefault();
    sendInspectorMessage(formElement);
  });
  peopleList.addEventListener("change", updatePerson);
  peopleList.addEventListener("click", event => {
    const copy = event.target.closest("[data-copy-subcontractor-link]");
    if (copy) copySubcontractorLink(copy);
    const revoke = event.target.closest("[data-revoke-subcontractor]");
    if (revoke) revokeSubcontractorAccess(revoke);
  });
  inspectorSelector.addEventListener("change", () => {
    selectedInspectorId = inspectorSelector.value;
    selectedOperationDate = "";
    if (selectedInspectorId === "all") {
      selectedLiveLocationPersonId = "";
      hideHistoricalRoute({ keepSelection: false });
    } else {
      const entry = overviewEntry(selectedInspectorId);
      if (entry?.person?.id && liveLocationPeople().some(person => person.id === entry.person.id)) focusLiveLocationPerson(entry.person.id);
    }
    renderOperations();
  });
  rangePicker.addEventListener("click", event => {
    const button = event.target.closest("[data-range]");
    if (!button) return;
    currentRange = button.dataset.range;
    selectedOperationDate = "";
    renderOperations();
  });
  if (liveRouteDate) {
    liveRouteDate.value = dateKey();
    const routeDateMinimum = new Date();
    routeDateMinimum.setDate(routeDateMinimum.getDate() - 90);
    const routeDateMaximum = new Date();
    routeDateMaximum.setDate(routeDateMaximum.getDate() + 120);
    liveRouteDate.min = dateKey(routeDateMinimum);
    liveRouteDate.max = dateKey(routeDateMaximum);
    liveRouteDate.addEventListener("change", () => {
      if (liveLocationRouteVisible) {
        const showingPlan = liveLocationPlanVisible;
        const showingAllPlans = liveLocationAllPlansVisible;
        liveLocationRouteVisible = false;
        liveLocationPlanVisible = false;
        liveLocationAllPlansVisible = false;
        liveLocationRouteLayer?.clearLayers();
        (showingAllPlans ? loadAllPlannedScheduleRoutes({ force: true }) : showingPlan ? loadPlannedScheduleRoute() : loadHistoricalRoute()).catch(() => false);
      }
    });
  }
  liveLocationRefresh?.addEventListener("click", requestLiveLocationRefresh);
  liveLocationHistory?.addEventListener("click", () => loadHistoricalRoute().catch(() => false));
  liveLocationPlan?.addEventListener("click", () => loadPlannedScheduleRoute().catch(() => false));
  liveLocationAllPlans?.addEventListener("click", () => loadAllPlannedScheduleRoutes().catch(() => false));
  liveCandidatePin?.addEventListener("click", () => dropPlanningCandidatePin().catch(() => false));
  liveCandidateAddress?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    dropPlanningCandidatePin().catch(() => false);
  });
  liveLocationShowAll?.addEventListener("click", showAllLiveLocations);
  liveLocationList?.addEventListener("click", event => {
    const person = event.target.closest("[data-live-location-person]");
    if (person) focusLiveLocationPerson(person.dataset.liveLocationPerson);
  });
  teamOverview.addEventListener("click", event => {
    const office = event.target.closest("[data-open-office]");
    if (office) {
      selectedInspectorId = office.dataset.openOffice;
      selectedOperationDate = "";
      inspectorSelector.value = selectedInspectorId;
      renderOperations();
      return;
    }
    const subcontractor = event.target.closest("[data-open-subcontractor]");
    if (subcontractor) {
      selectedInspectorId = subcontractor.dataset.openSubcontractor;
      selectedOperationDate = "";
      inspectorSelector.value = selectedInspectorId;
      renderOperations();
      return;
    }
    const row = event.target.closest("[data-open-inspector]");
    if (!row) return;
    selectedInspectorId = row.dataset.openInspector;
    selectedOperationDate = "";
    inspectorSelector.value = selectedInspectorId;
    renderOperations();
  });
  inspectorDetail.addEventListener("click", event => {
    const messageTodo = event.target.closest("[data-create-message-todo]");
    if (messageTodo) {
      createTodoFromMessage(messageTodo);
      return;
    }
    const copyAccess = event.target.closest("[data-copy-subcontractor-link]");
    if (copyAccess) {
      copySubcontractorLink(copyAccess);
      return;
    }
    const revokeAccess = event.target.closest("[data-revoke-subcontractor]");
    if (revokeAccess) {
      revokeSubcontractorAccess(revokeAccess);
      return;
    }
    const fieldAttachment = event.target.closest("[data-open-field-attachment]");
    if (fieldAttachment) {
      openFieldAttachment(fieldAttachment);
      return;
    }
    const directAttachment = event.target.closest("[data-open-direct-attachment]");
    if (directAttachment) {
      openDirectAttachment(directAttachment);
      return;
    }
    const officeAttachment = event.target.closest("[data-open-admin-attachment]");
    if (officeAttachment) {
      openAdminAttachment(officeAttachment);
      return;
    }
    if (event.target.closest("[data-back-overview]")) {
      selectedInspectorId = "all";
      selectedOperationDate = "";
      inspectorSelector.value = "all";
      renderOperations();
      return;
    }
    const operationDay = event.target.closest("[data-open-operation-day]");
    if (operationDay) {
      selectedOperationDate = operationDay.dataset.openOperationDay || "";
      const person = people.find(item => item.id === selectedInspectorId);
      if (person) renderInspectorDetail(person);
      return;
    }
    const arrivalReview = event.target.closest("[data-arrival-review]");
    if (arrivalReview) {
      saveArrivalLocationReview(arrivalReview);
      return;
    }
    const arrivalAdjust = event.target.closest("[data-arrival-adjust]");
    if (arrivalAdjust) {
      prefillArrivalTimeAdjustment(arrivalAdjust);
      return;
    }
    const jobCorrection = event.target.closest("[data-prefill-job-correction]");
    if (jobCorrection) {
      prefillJobTimeAdjustment(jobCorrection);
      return;
    }
    const reverseCorrection = event.target.closest("[data-reverse-correction]");
    if (reverseCorrection) {
      reverseCorrection.disabled = true;
      reverseAdminCorrection(reverseCorrection.dataset.reverseCorrection).catch(error => {
        reverseCorrection.disabled = false;
        authStatus.textContent = error.message || "The correction could not be reversed.";
      });
      return;
    }
  });
  inspectorDetail.addEventListener("submit", event => {
    event.preventDefault();
    if (event.target.id === "adminCorrectionForm") addAdminCorrection(event.target);
  });
  signInButton.addEventListener("click", async () => {
    signInButton.disabled = true;
    authStatus.textContent = "Opening company sign-in…";
    try {
      const result = await shared.signIn();
      if (result?.user) {
        const profile = await shared.ensureProfile(result.user);
        if (!shared.isAdminRole(profile)) throw new Error(`${result.user.email || "This account"} has inspector access only.`);
        authStatus.textContent = "Signed in. Loading the office dashboard…";
      }
    } catch (error) {
      authStatus.textContent = error.message || "Sign-in did not finish.";
    }
    signInButton.disabled = false;
  });
  signOutButton.addEventListener("click", () => shared.signOut());

  const localPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname) && new URLSearchParams(window.location.search).get("preview") === "operations";
  if (localPreview) {
    const now = new Date();
    const at = (hours, minutes) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).toISOString();
    const futureDate = offset => {
      const value = new Date(now);
      value.setDate(value.getDate() + offset);
      return dateKey(value);
    };
    const futureAt = (offset, hours, minutes) => new Date(`${futureDate(offset)}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`).toISOString();
    const previewCoordinates = [
      { latitude: 42.28148, longitude: -83.74841 },
      { latitude: 42.52948, longitude: -83.78022 },
      { latitude: 42.30817, longitude: -83.48687 }
    ];
    const previewSchedule = (name, prefix, offset, addresses) => [{
      date: futureDate(offset),
      jobs: addresses.map((address, index) => ({
        id: `${prefix}-future-${index + 1}`,
        spectoraJobId: `${prefix}-future-${index + 1}`,
        propertyAddress: address,
        scheduledStart: futureAt(offset, 9 + index * 3, 0),
        scheduledEnd: futureAt(offset, 11 + index * 3, 0),
        inspectorName: name,
        status: "confirmed",
        latitude: previewCoordinates[index % previewCoordinates.length].latitude,
        longitude: previewCoordinates[index % previewCoordinates.length].longitude,
        services: ["Residential Inspection"]
      }))
    }];
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
        { id: `${id}-b`, timestamp: at(7, 14 + offset), action: "On My Way selected", calendarEventId: `${id}-1`, property: "123 First Street, Ann Arbor, MI", data: {} },
        { id: `${id}-c`, timestamp: at(8, 2 + offset), action: "Arrived", calendarEventId: `${id}-1`, property: "123 First Street, Ann Arbor, MI", data: {} },
        { id: `${id}-d`, timestamp: at(8, 2 + offset), action: "Hours worked started", calendarEventId: `${id}-1`, property: "123 First Street, Ann Arbor, MI", data: {} },
        { id: `${id}-d2`, timestamp: at(8, 5 + offset), action: "Inspection started", calendarEventId: `${id}-1`, property: "123 First Street, Ann Arbor, MI", data: {} },
        { id: `${id}-e`, timestamp: at(10, 38 + offset), action: "Final job completion", calendarEventId: `${id}-1`, property: "123 First Street, Ann Arbor, MI", data: {} },
        { id: `${id}-lab1`, timestamp: at(10, 39 + offset), action: "Lab selected", calendarEventId: `${id}-1`, property: "123 First Street, Ann Arbor, MI", data: { labs: ["Water Tech"] } },
        { id: `${id}-lab2`, timestamp: at(11, 2 + offset), action: "Arrived at lab", calendarEventId: `${id}-1`, property: "Water Tech", data: { lab: "Water Tech" } },
        { id: `${id}-lab3`, timestamp: at(11, 14 + offset), action: "Lab visit completed", calendarEventId: `${id}-1`, property: "Water Tech", data: { lab: "Water Tech" } },
        { id: `${id}-f`, timestamp: at(11, 54 + offset), action: "Arrived", calendarEventId: `${id}-2`, property: "456 Oak Street, Brighton, MI", data: {} },
        { id: `${id}-g`, timestamp: at(11, 58 + offset), action: "Inspection started", calendarEventId: `${id}-2`, property: "456 Oak Street, Brighton, MI", data: {} }
      ]
    });
    people = [
      { id: "preview-kevin", name: "Kevin Cave", email: "kev@michiganpropertyinspections.com", role: "owner", active: true, operationsCurrent: makeDay("Kevin Cave", "KC", "INSPECTION IN PROGRESS"), operationsUpdatedAt: new Date(), spectoraScheduleDays: previewSchedule("Kevin Cave", "KC", 1, ["100 N Main St, Ann Arbor, MI 48104", "200 W Main St, Brighton, MI 48116"]), liveLocation: { latitude: 42.5295, longitude: -83.7802, accuracyFeet: 36, recordedAtClient: new Date().toISOString(), workStatus: "INSPECTION IN PROGRESS" }, liveLocationStatus: { status: "recorded" } },
      { id: "preview-cory", name: "Cory Leese", email: "cory@michiganpropertyinspections.com", inspectorId: "NACHI26090138", approvedEndAddress: "38948 Koppernick Road, Westland, MI 48185", role: "inspector", active: true, operationsCurrent: makeDay("Cory Leese", "NACHI26090138", "DRIVING TO JOB", 6), operationsUpdatedAt: new Date(), spectoraScheduleDays: previewSchedule("Cory Leese", "CL", 1, ["2200 N Canton Center Rd, Canton, MI 48187"]), liveLocation: { latitude: 42.3314, longitude: -83.0458, accuracyFeet: 52, recordedAtClient: new Date(Date.now() - 4 * 60000).toISOString(), workStatus: "DRIVING TO JOB" }, liveLocationStatus: { status: "recorded" } },
      { id: "preview-adrienne", name: "Adrienne Cave", email: "adrienne@michiganpropertyinspections.com", role: "admin", active: true },
      { id: "preview-sub", name: "Jason Chamarro", email: "test-subcontractor@mpi.local", phone: "", role: "subcontractor", active: true, notificationDevice: { token: "preview" }, liveLocation: { latitude: 42.2808, longitude: -83.743, accuracyFeet: 70, recordedAtClient: new Date(Date.now() - 9 * 60000).toISOString(), workStatus: "AT JOB – JOB 2" }, liveLocationStatus: { status: "recorded" }, subcontractorCurrent: { date: dateKey(), test: false, subcontractorName: "Jason Chamarro", subcontractorPhone: "", currentJobNumber: 2, currentJob: { number: 2, status: "arrived", onWayAt: at(12, 48), arrivedAt: at(13, 14), completedAt: "" }, completedJobs: [{ number: 1, status: "completed", completedAt: at(11, 32) }], status: "AT JOB – JOB 2", events: [{ id: "sub-a", type: "ON WAY", timestamp: at(12, 48), jobNumber: 2 }, { id: "sub-b", type: "ARRIVED", timestamp: at(13, 14), jobNumber: 2 }], updatedAtClient: new Date().toISOString() } }
    ];
    currentUser = { uid: "preview", email: "kev@michiganpropertyinspections.com", displayName: "Kevin Cave" };
    currentProfile = { name: "Kevin Cave", role: "owner", active: true };
    fieldMessages = [{ id: "preview-coc", kind: "lab-coc", senderUid: "preview-kevin", senderEmail: "kev@michiganpropertyinspections.com", senderName: "Kevin Cave", message: "2 Chain of Custody photos recorded at Water Tech.", createdAtClient: at(11, 5), context: { date: dateKey(), labName: "Water Tech", jobId: "KC-1" }, attachments: [{ id: "coc-1", name: "Water-Tech-COC-1.jpg", type: "image/jpeg", size: 142000 }, { id: "coc-2", name: "Water-Tech-COC-2.jpg", type: "image/jpeg", size: 151000 }] }];
    authCard.hidden = true;
    dashboard.hidden = false;
    accountPill.hidden = false;
    accountName.textContent = "Kevin Cave";
    accountEmail.textContent = currentUser.email;
    renderPeople();
    renderAdminUnifiedInbox();
    showView("operations");
    return;
  }

  if (!shared?.available) {
    authStatus.textContent = "The secure company connection is unavailable. Reconnect and reload.";
    signInButton.disabled = true;
    return;
  }

  shared.completeRedirectSignIn?.().catch(error => {
    authStatus.textContent = error.message || "Google sign-in returned without completing. Please try again.";
  });

  shared.watchSession(({ user, profile, error }) => {
    currentUser = user;
    currentProfile = profile;
    if (user && profile?.active !== false) shared.requestSpectoraScheduleRefresh?.().catch(() => false);
    readReplyKeys = new Set(Array.isArray(profile?.officeReplyReadKeys) ? profile.officeReplyReadKeys : []);
    authStatus.textContent = error?.message || "";
    if (!user || !profile || !shared.isAdminRole(profile)) {
      dashboard.hidden = true;
      accountPill.hidden = true;
      signOutButton.hidden = !user;
      authCard.hidden = false;
      if (user && profile && !shared.isAdminRole(profile)) authStatus.textContent = `${user.email || "This account"} has inspector access only. An owner can change the account role from Team Accounts.`;
      unsubscribePeople?.();
      unsubscribeUpdates?.();
      unsubscribeReplies?.();
      unsubscribeReplies = null;
      unsubscribeFieldMessages?.();
      unsubscribeFieldMessages = null;
      return;
    }
    commentUsagePanel.hidden = !isPrimaryOwner();
    authCard.hidden = true;
    dashboard.hidden = false;
    accountPill.hidden = false;
    signOutButton.hidden = false;
    accountName.textContent = profile.name || user.displayName || "MPI Owner";
    accountEmail.textContent = user.email || "";
    accountInitial.textContent = (profile.name || user.displayName || "K").trim().charAt(0).toUpperCase();
    startAdminData();
    if (!initialAdminViewApplied) {
      showView(new URL(window.location.href).searchParams.get("view") === "inbox" ? "updates" : "operations");
      initialAdminViewApplied = true;
    }
    maybeStartAdminOnboarding();
    if (window.Notification?.permission === "granted") enableOfficeAlerts(null, false);
  });
})();
