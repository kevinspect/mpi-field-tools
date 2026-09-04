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
  const inspectorSelector = document.getElementById("adminInspectorSelector");
  const rangePicker = document.getElementById("adminRangePicker");
  const teamOverview = document.getElementById("adminTeamOverview");
  const inspectorDetail = document.getElementById("adminInspectorDetail");
  const subcontractorList = document.getElementById("adminSubcontractorList");
  const operationsSync = document.getElementById("adminOperationsSync");
  const safetyAlertCenter = document.getElementById("adminSafetyAlerts");
  const safetyAlertCount = document.getElementById("adminSafetyAlertCount");
  const safetyAlertList = document.getElementById("adminSafetyAlertList");
  const commentUsageUsed = document.getElementById("commentUsageUsed");
  const commentUsagePanel = document.getElementById("commentUsagePanel");
  const commentUsageRemaining = document.getElementById("commentUsageRemaining");
  const commentUsageStatus = document.getElementById("commentUsageStatus");
  const commentUsageProgress = document.getElementById("commentUsageProgress");
  const commentUsageNote = document.getElementById("commentUsageNote");
  const requestCount = document.getElementById("adminRequestCount");
  const requestList = document.getElementById("adminRequestList");
  const requestStatusFilter = document.getElementById("adminRequestStatusFilter");
  const requestInspectorFilter = document.getElementById("adminRequestInspectorFilter");
  const requestTypeFilter = document.getElementById("adminRequestTypeFilter");
  const requestAssigneeFilter = document.getElementById("adminRequestAssigneeFilter");
  const requestDateFilter = document.getElementById("adminRequestDateFilter");
  const requestSort = document.getElementById("adminRequestSort");
  const officeAlertButtons = [...document.querySelectorAll("[data-enable-office-alerts]")];
  const replyInbox = document.getElementById("adminReplyInbox");
  const replyCount = document.getElementById("adminReplyCount");
  const tabButtons = [...document.querySelectorAll("[data-admin-view]")];
  const panels = [...document.querySelectorAll("[data-admin-panel]")];
  const stats = {
    working: document.getElementById("statWorking"),
    jobs: document.getElementById("statJobs"),
    hours: document.getElementById("statHours"),
    alerts: document.getElementById("statAlerts")
  };
  const statHoursLabel = document.getElementById("statHoursLabel");
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
  const COMMENT_MONTHLY_PLANNING_ALLOWANCE = 400;
  let selectedInspectorId = "all";
  let unsubscribePeople = null;
  let unsubscribeUpdates = null;
  let unsubscribeReplies = null;
  let unsubscribeFieldMessages = null;
  let replyRefreshTimer = 0;
  let repliesRefreshing = false;
  let selectedFiles = [];
  let inspectorReplies = [];
  let fieldMessages = [];
  let fieldMessageListenerReady = false;
  let knownFieldMessageIds = new Set();
  let knownReplyKeys = new Set();
  let readReplyKeys = new Set();
  let unreadReplyCount = 0;
  let unreadSafetyCount = 0;
  let replyListenerReady = false;
  let officeMessaging = null;
  const OFFICE_PUSH_TOKEN_KEY = "mpiOfficePushTokenV1";
  let knownRequestIds = new Set();
  let reviewingRequests = false;
  const assignedRequestMigrations = new Set();
  let legacyRequestChecked = false;
  const messageReceiptCache = new Map();
  const MAX_ATTACHMENT_FILES = 5;
  const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
  const MAX_ATTACHMENT_TOTAL_BYTES = 12 * 1024 * 1024;
  const ATTACHMENT_CHUNK_LENGTH = 560000;

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

  async function showOfficeAlert(title, body, tag = "mpi-office-alert") {
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
          data: { url: "./admin.html" }
        });
      } else {
        const notification = new Notification(title, { body, icon: "./icon-192.png", tag });
        notification.onclick = () => window.focus();
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

  function markReplyRead(key) {
    if (!key || readReplyKeys.has(key)) return;
    readReplyKeys.add(key);
    const savedKeys = [...readReplyKeys].slice(-200);
    currentProfile.officeReplyReadKeys = savedKeys;
    renderReplyInbox();
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

  function updateOperationsNotificationBadge() {
    const total = unreadReplyCount + unreadSafetyCount;
    if (replyCount) replyCount.textContent = total ? String(total) : "";
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
      return `<article class="safety-alert-card" data-safety-alert-id="${escapeHtml(alert.id)}"><header><div><span class="safety-critical-badge">Immediate review required</span><h4>${escapeHtml(details.noticeType || alert.title || "Safety event")}</h4></div><time>${escapeHtml(formatDateTime(alert.createdAt || alert.createdAtClient))}</time></header><div class="safety-alert-meta"><span><strong>Inspector:</strong> ${escapeHtml(alert.senderName || alert.senderEmail || "MPI Inspector")}</span><span><strong>Location:</strong> ${escapeHtml(details.property || "Not supplied")}</span><span><strong>Occurred:</strong> ${escapeHtml(formatDateTime(details.occurredAt))}</span></div><div class="safety-alert-facts">${escapeHtml(details.facts || alert.message || "Safety notice submitted.")}</div>${details.immediateAction ? `<p class="safety-alert-detail"><strong>Immediate action:</strong> ${escapeHtml(details.immediateAction)}</p>` : ""}${details.decision ? `<p class="safety-alert-detail"><strong>Inspection decision:</strong> ${escapeHtml(details.decision)}</p>` : ""}<p class="safety-alert-detail"><strong>People informed:</strong> ${escapeHtml(informed)}</p>${details.followUp ? `<p class="safety-alert-detail"><strong>Follow-up requested:</strong> ${escapeHtml(details.followUp)}</p>` : ""}<button class="primary" type="button" data-acknowledge-safety="${escapeHtml(alert.id)}">ACKNOWLEDGE SAFETY ALERT</button></article>`;
    }).join("");
    updateOperationsNotificationBadge();
  }

  function renderReplyInbox() {
    if (!replyInbox) return;
    const fieldReplies = fieldMessages.filter(item => item.kind !== "safety-alert").map(item => ({
      fieldMessageId: item.id,
      userId: item.senderUid,
      userEmail: item.senderEmail,
      userName: item.senderName,
      updateId: item.replyToUpdateId || "",
      updateTitle: item.replyToUpdateId ? "Reply to office message" : "Message to MPI Office",
      replyText: item.message || (item.attachments?.length ? `${item.attachments.length} photo${item.attachments.length === 1 ? "" : "s"} attached` : "Field message"),
      repliedAt: item.createdAt || item.createdAtClient,
      attachments: item.attachments || []
    }));
    const mirrored = new Set(fieldReplies.filter(item => item.updateId).map(item => `${item.updateId}:${item.userId}`));
    const values = [...fieldReplies, ...inspectorReplies.filter(item => !mirrored.has(`${item.updateId}:${item.userId}`))]
      .filter(item => item.replyText)
      .sort((left, right) => (asDate(right.repliedAt)?.getTime() || 0) - (asDate(left.repliedAt)?.getTime() || 0))
      .slice(0, 12);
    const unread = values.filter(item => replyIsForCurrentAdmin(item) && !readReplyKeys.has(replyKey(item)));
    unreadReplyCount = unread.length;
    updateOperationsNotificationBadge();
    const count = replyInbox.querySelector(".office-reply-head span");
    if (count) count.textContent = unread.length ? `${unread.length} new` : "0 new";
    const list = replyInbox.querySelector(".office-reply-list");
    if (!list) return;
    list.innerHTML = values.length ? values.map(reply => {
      const update = updateForReply(reply);
      const isUnread = replyIsForCurrentAdmin(reply) && !readReplyKeys.has(replyKey(reply));
      const photos = reply.attachments?.length ? `<span class="office-reply-files">${reply.attachments.length} photo${reply.attachments.length === 1 ? "" : "s"}</span>` : "";
      return `<button class="office-reply-card${isUnread ? " unread" : ""}" type="button" data-open-reply-inspector="${escapeHtml(reply.userId || "")}" data-reply-key="${escapeHtml(replyKey(reply))}"><div><strong>${escapeHtml(reply.userName || reply.userEmail || "MPI Field User")}</strong><small>${escapeHtml(reply.updateTitle || update?.title || "Message to MPI Office")}</small>${isUnread ? '<span class="office-reply-new">New message</span>' : ""}</div><div><span>${escapeHtml(reply.replyText)}</span>${photos}</div><time>${escapeHtml(formatDateTime(reply.repliedAt || reply.updatedAt))}</time></button>`;
    }).join("") : '<div class="empty">No inspector replies yet. New replies will appear here automatically.</div>';
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
    knownFieldMessageIds = ids;
    fieldMessageListenerReady = true;
    renderSafetyAlerts();
    renderReplyInbox();
    renderOperationsStats();
    const selected = overviewEntry(selectedInspectorId);
    const history = document.getElementById("adminMessageHistory");
    if (selected?.person && history) history.innerHTML = messageHistoryHtml(selected.person);
  }

  function processReplySnapshot(snapshot) {
    const values = snapshot.docs.map(doc => ({
      id: doc.id,
      path: doc.ref.path,
      updateId: doc.ref.parent.parent?.id || doc.data().updateId || "",
      ...doc.data()
    }));
    const nextKeys = new Set(values.map(replyKey));
    if (replyListenerReady) {
      const newReplies = values.filter(reply => !knownReplyKeys.has(replyKey(reply)) && replyIsForCurrentAdmin(reply));
      if (newReplies.length) {
        const latest = newReplies.sort((left, right) => (asDate(right.repliedAt)?.getTime() || 0) - (asDate(left.repliedAt)?.getTime() || 0))[0];
        showOfficeAlert(`Reply from ${latest.userName || "MPI Inspector"}`, latest.replyText || "A new inspector reply is available.", `mpi-reply-${latest.updateId}-${latest.userId}`);
      }
    }
    inspectorReplies = values;
    knownReplyKeys = nextKeys;
    replyListenerReady = true;
    renderReplyInbox();
    values.forEach(reply => { if (reply.updateId) messageReceiptCache.set(reply.updateId, reply); });
    const selected = people.find(item => item.id === selectedInspectorId);
    if (selected) hydrateMessageReceipts(selected);
  }

  function notificationTokensForUpdate(audience, targetEmail = "") {
    return [...new Set(people.filter(person => {
      if (person.active === false || !["owner", "inspector", "subcontractor"].includes(String(person.role || "").toLowerCase())) return false;
      return audience === "all" || shared.normalizeEmail(person.email) === shared.normalizeEmail(targetEmail);
    }).map(person => person.notificationDevice?.token).filter(Boolean))];
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

  async function uploadAttachments(updateRef, files, audience, targetEmail, statusElement = publishStatus) {
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
      await attachmentRef.set({ ...metadata, audience, targetEmail, active: true, createdAt: shared.serverTimestamp(), createdBy: currentUser.uid });
      for (let start = 0; start < pieces.length; start += 6) {
        await Promise.all(pieces.slice(start, start + 6).map((data, part) => attachmentRef.collection("chunks").doc(String(start + part).padStart(4, "0")).set({ index: start + part, data, audience, targetEmail, active: true })));
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
      ? `<img src="${escapeHtml(photoSource)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">`
      : "";
    return `<span class="inspector-avatar ${escapeHtml(extraClass)}">${photo}<b>${escapeHtml(initials(name))}</b></span>`;
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

  function driveTimeForDay(day) {
    const saved = day?.driveTime || {};
    const events = (Array.isArray(day?.activity) ? day.activity : [])
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
    return Number(calculated.totalMinutes) >= Number(saved.totalMinutes || 0) ? calculated : saved;
  }

  function operativePeople() {
    return people.filter(person => person.active !== false && person.role !== "subcontractor" && (person.role === "inspector" || person.operationsCurrent || person.operationsDays?.length));
  }

  function subcontractorEntries() {
    const entries = people.filter(person => person.active !== false && person.role === "subcontractor").map(person => ({ id: `sub:${person.id}`, person, state: person.subcontractorCurrent, test: false }));
    people.filter(person => person.active !== false && person.subcontractorTestCurrent?.test === true).forEach(person => entries.push({ id: `subtest:${person.id}`, person, state: person.subcontractorTestCurrent, test: true }));
    return entries;
  }

  function teamOverviewEntries() {
    return [
      ...operativePeople().map(person => ({ id: person.id, person, kind: "inspector" })),
      ...subcontractorEntries().map(entry => ({ ...entry, kind: "subcontractor" }))
    ];
  }

  function overviewEntry(id) {
    return teamOverviewEntries().find(entry => entry.id === id) || null;
  }

  function operationDays(person) {
    const daysByDate = new Map();
    (Array.isArray(person?.operationsDays) ? person.operationsDays : []).forEach(day => {
      if (day?.date) daysByDate.set(day.date, day);
    });
    if (person?.operationsCurrent?.date) daysByDate.set(person.operationsCurrent.date, person.operationsCurrent);
    return [...daysByDate.values()];
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
    const savedClockOut = sessions.at(-1)?.clockedOutAt;
    if (savedClockOut) return savedClockOut;
    const activityClockOut = (day?.activity || []).filter(item => item.action === "Clocked off").at(-1);
    return activityClockOut?.data?.clockedOutAt || activityClockOut?.timestamp || day?.dayComplete?.completedAt || "";
  }

  function workedMinutes(person, day) {
    if (!day?.timeClock) return 0;
    const correction = effectiveClockOut(person, day);
    const isToday = day.date === dateKey();
    const intervals = (day.timeClock.sessions || []).map((session, index, sessions) => {
      const start = asDate(session.clockedInAt)?.getTime();
      const isLast = index === sessions.length - 1;
      const end = asDate(session.clockedOutAt || (isLast ? correction : ""))?.getTime() || (isToday && day.timeClock.active && isLast ? Date.now() : 0);
      return { start, end };
    }).filter(item => item.start && item.end > item.start).sort((left, right) => left.start - right.start || left.end - right.end);
    const merged = [];
    intervals.forEach(interval => {
      const previous = merged[merged.length - 1];
      if (previous && interval.start <= previous.end) previous.end = Math.max(previous.end, interval.end);
      else merged.push({ ...interval });
    });
    const calculated = merged.reduce((total, interval) => total + Math.floor((interval.end - interval.start) / 60000), 0);
    return calculated || Number(day.timeClock.workedMinutes) || 0;
  }

  function weeklyMinutes(person) {
    return operationDays(person).filter(day => rangeDateKeys("week").includes(day.date)).reduce((total, day) => total + workedMinutes(person, day), 0);
  }

  function weeklyDayBreakdownHtml(person, metric = "hours") {
    const week = operationDays(person).filter(day => rangeDateKeys("week").includes(day.date)).sort((left, right) => String(left.date).localeCompare(String(right.date)));
    return `<details class="ops-breakdown"><summary>View daily breakdown</summary><div class="fact-list">${week.length ? week.map(day => {
      const minutes = metric === "drive" ? Number(driveTimeForDay(day)?.totalMinutes) || 0 : workedMinutes(person, day);
      return `<div class="fact"><span>${escapeHtml(new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }))}</span><strong>${formatMinutes(minutes)}</strong></div>`;
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

  function meaningfulAlerts(person, day) {
    const alerts = Array.isArray(day?.alerts) ? day.alerts.slice() : [];
    if (day?.readiness && ["denied", "default"].includes(day.readiness.notificationPermission)) alerts.push("Important notification permissions are not fully enabled.");
    if (weeklyMinutes(person) >= 38 * 60) alerts.push("Weekly hours are approaching the configured 40-hour review point.");
    return [...new Set(alerts)].slice(0, 10);
  }

  function showView(name) {
    tabButtons.forEach(button => button.classList.toggle("active", button.dataset.adminView === name));
    panels.forEach(panel => panel.classList.toggle("active", panel.dataset.adminPanel === name));
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
    const fieldPeople = people.filter(person => person.active !== false && ["inspector", "subcontractor"].includes(String(person.role || "").toLowerCase()));
    targetInput.innerHTML = '<option value="">Choose field user</option>' + fieldPeople.map(person => `<option value="${escapeHtml(person.email)}">${escapeHtml(person.name || person.email)} — ${escapeHtml(person.role === "subcontractor" ? "Subcontractor" : "Inspector")}</option>`).join("");
    if (fieldPeople.some(person => person.email === selected)) targetInput.value = selected;
  }

  function renderInspectorSelector() {
    const selected = selectedInspectorId;
    const entries = teamOverviewEntries();
    inspectorSelector.innerHTML = '<option value="all">All field users</option>' + entries.map(entry => `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.kind === "subcontractor" ? `${entry.test ? "TEST · " : ""}${entry.state?.subcontractorName || entry.person.name || entry.person.email} — Subcontractor` : entry.person.name || entry.person.email)}</option>`).join("");
    selectedInspectorId = entries.some(entry => entry.id === selected) ? selected : "all";
    inspectorSelector.value = selectedInspectorId;
  }

  function renderPeople() {
    renderTargetOptions();
    renderInspectorSelector();
    peopleList.innerHTML = people.length ? people.map(person => `
      <article class="person-card" data-person-id="${escapeHtml(person.id)}">
        <div class="person-main inspector-identity">${avatarHtml(person)}<div><strong>${escapeHtml(person.name || "MPI Team Member")}</strong><small>${escapeHtml(person.email)}</small><small>${person.inspectorId ? `Inspector number: ${escapeHtml(person.inspectorId)}` : "Inspector number not assigned"}</small></div></div>
        <div class="person-controls">
          <input data-person-inspector-id aria-label="Inspector number for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.inspectorId || "")}" maxlength="40" placeholder="Inspector number" ${person.role === "owner" ? "disabled" : ""}>
          <input data-person-phone aria-label="Phone number for ${escapeHtml(person.name || person.email)}" value="${escapeHtml(person.phone || "")}" maxlength="30" placeholder="Phone number" ${person.role === "owner" ? "disabled" : ""}>
          <select data-person-role aria-label="Role for ${escapeHtml(person.name || person.email)}" ${person.role === "owner" ? "disabled" : ""}>
            <option value="inspector" ${person.role === "inspector" ? "selected" : ""}>Inspector</option>
            <option value="subcontractor" ${person.role === "subcontractor" ? "selected" : ""}>Subcontractor</option>
            <option value="admin" ${person.role === "admin" ? "selected" : ""}>Office admin</option>
            ${shared.isOwnerEmail(currentUser?.email) ? `<option value="owner" ${person.role === "owner" ? "selected" : ""}>Owner</option>` : ""}
          </select>
          <label class="check" style="padding:8px"><input data-person-active type="checkbox" ${person.active !== false ? "checked" : ""} ${person.role === "owner" ? "disabled" : ""}><span>Active</span></label>
        </div>
      </article>`).join("") : '<div class="empty">No company accounts have signed in yet.</div>';
    renderOperations();
    renderSubcontractors();
    renderRequestTodos();
  }

  function subcontractorStateCard(person, state, isTest = false) {
    const job = state?.currentJob || { number: 1, status: "ready" };
    const events = Array.isArray(state?.events) ? state.events.slice(-8).reverse() : [];
    const messages = (Array.isArray(person.subcontractorMessages) ? person.subcontractorMessages : [])
      .filter(item => Boolean(item.test) === Boolean(isTest)).slice(-5).reverse();
    const status = state?.status || `READY FOR JOB ${job.number || 1}`;
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
      <h3 style="margin-top:16px">Conversation</h3><div class="message-history" id="adminMessageHistory">${messageHistoryHtml(person)}${messages.length ? messages.map(item => `<article><strong>${escapeHtml(formatDateTime(item.createdAt))} · ${escapeHtml(item.senderName || title)} → Office</strong><p>${escapeHtml(item.message || "")}</p></article>`).join("") : ""}</div>
      <form class="subcontractor-admin-message" data-subcontractor-message-form data-person-id="${escapeHtml(person.id)}"><label class="field">Message subcontractor<textarea data-message-text maxlength="1000" required placeholder="Write a message for ${escapeHtml(title)}"></textarea></label>${chatAttachmentHtml()}<button class="primary" type="submit">MESSAGE SUBCONTRACTOR</button><span class="status" data-message-status></span></form>
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
    const drive = selectedDays(person).reduce((total, item) => total + (Number(driveTimeForDay(item)?.totalMinutes) || 0), 0);
    const status = day?.liveStatus || "NOT STARTED";
    const latestSync = latestSyncDate(person, day);
    const stale = !["NOT STARTED", "CLOCKED OUT"].includes(status) && latestSync && Date.now() - latestSync.getTime() > 20 * 60 * 1000;
    const punctuality = day?.currentJob?.arrivalPerformance || next?.arrivalPerformance || (alerts.some(item => /late/i.test(item)) ? "Needs review" : "On schedule");
    return `<button class="inspector-row${alerts.length ? " has-alert" : ""}" type="button" data-open-inspector="${escapeHtml(person.id)}">
      <div class="inspector-identity">${avatarHtml(person)}<div><strong>${escapeHtml(person.name || person.email)}</strong><small>${escapeHtml(day?.currentJob?.property || (next ? `Next: ${next.property}` : "No current appointment"))}</small><small class="inspector-sync${stale ? " stale" : ""}">${escapeHtml(syncAgeLabel(person, day))}${stale ? " · confirm status" : ""}</small></div></div>
      <div><span class="status-badge ${statusClass(status, alerts)}${stale ? " stale" : ""}">${escapeHtml(status)}</span><small>${alerts[0] ? escapeHtml(alerts[0]) : escapeHtml(punctuality)}</small></div>
      <div class="row-metric"><span>Jobs</span><b>${counts.complete} / ${counts.total}</b></div>
      <div class="row-metric"><span>Hours worked</span><b>${formatMinutes(hours)}</b></div>
      <div class="row-metric"><span>Drive time</span><b>${formatMinutes(drive)}</b></div>
      <div class="row-metric"><span>Next appointment</span><b>${next ? formatTime(next.scheduledStart) : "—"}</b></div>
      <span class="row-open">›</span>
    </button>`;
  }

  function subcontractorOverviewRow(entry) {
    const { person, state, test } = entry;
    const job = state?.currentJob || { number: state?.currentJobNumber || 1, status: "ready" };
    const title = test ? (state?.subcontractorName || "Test Subcontractor") : (person.name || person.email || "MPI Subcontractor");
    const status = state?.status || `READY FOR JOB ${job.number || 1}`;
    const completed = Array.isArray(state?.completedJobs) ? state.completedJobs.length : 0;
    const lastEvent = Array.isArray(state?.events) ? state.events.at(-1) : null;
    return `<button class="inspector-row subcontractor-row${test ? " test" : ""}" type="button" data-open-subcontractor="${escapeHtml(entry.id)}">
      <div class="inspector-identity">${avatarHtml(person)}<div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(test ? "Test subcontractor · excluded from payroll" : "Subcontractor")}</small><small class="inspector-sync">${escapeHtml(state?.updatedAtClient ? `Updated ${formatDateTime(state.updatedAtClient)}` : "Waiting for phone sync")}</small></div></div>
      <div><span class="status-badge">${escapeHtml(status)}</span><small>${escapeHtml(lastEvent?.type || "No action recorded yet")}</small></div>
      <div class="row-metric"><span>Current job</span><b>${escapeHtml(`Job ${job.number || 1}`)}</b></div>
      <div class="row-metric"><span>Completed</span><b>${completed}</b></div>
      <div class="row-metric"><span>Arrived</span><b>${escapeHtml(formatTime(job.arrivedAt))}</b></div>
      <div class="row-metric"><span>Last action</span><b>${escapeHtml(formatTime(lastEvent?.timestamp))}</b></div>
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
    stats.alerts.textContent = String(days.reduce((total, item) => total + meaningfulAlerts(item.person, item.day).length, 0) + unreadSafetyAlerts().length);
    renderCommentUsageAllowance();
  }

  function renderCommentUsageAllowance() {
    if (!commentUsageUsed || !shared.isOwnerEmail(currentUser?.email)) {
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
    teamOverview.hidden = false;
    inspectorDetail.hidden = true;
    teamOverview.innerHTML = entries.length ? entries.map(entry => entry.kind === "subcontractor" ? subcontractorOverviewRow(entry) : overviewRow(entry.person)).join("") : '<div class="empty">No field devices have synced yet. Ask each user to open MPI Field Tools while signed in.</div>';
  }

  function renderSubcontractorDetail(entry) {
    inspectorDetail.innerHTML = `<div class="detail-hero"><div class="detail-person">${avatarHtml(entry.person, "large")}<div><p class="ops-eyebrow">Subcontractor operations</p><h2>${escapeHtml(entry.test ? (entry.state?.subcontractorName || "Test Subcontractor") : (entry.person.name || entry.person.email || "MPI Subcontractor"))}</h2><p>Job and lab status · excluded from employee payroll and hours</p></div></div><button class="detail-back" type="button" data-back-overview>← All field users</button></div>${subcontractorStateCard(entry.person, entry.state, entry.test)}`;
    teamOverview.hidden = true;
    inspectorDetail.hidden = false;
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
    return `<div class="fact-list"><div class="fact"><span>Lab selected</span><strong>${escapeHtml(names.join(" + ") || "Recorded")}</strong></div><div class="fact"><span>Arrival</span><strong>${escapeHtml(arrivals.map(item => `${item.data?.lab || "Lab"} ${formatTime(item.timestamp)}`).join(" · ") || "—")}</strong></div><div class="fact"><span>Complete</span><strong>${escapeHtml(completions.map(item => `${item.data?.lab || "Lab"} ${formatTime(item.timestamp)}`).join(" · ") || "—")}</strong></div><div class="fact"><span>Lab drive</span><strong>${formatMinutes(driveTimeForDay(day)?.labMinutes)}</strong></div></div>`;
  }

  function messagesFor(person) {
    return updates.filter(update => update.type === "message" && shared.normalizeEmail(update.targetEmail) === shared.normalizeEmail(person.email));
  }

  function messageHistoryHtml(person) {
    const officeMessages = messagesFor(person).map(message => ({ direction: "office", timestamp: message.createdAt, message }));
    const fromField = fieldMessages.filter(message => message.senderUid === person.id || shared.normalizeEmail(message.senderEmail) === shared.normalizeEmail(person.email)).map(message => ({ direction: "field", timestamp: message.createdAt || message.createdAtClient, message }));
    const messages = [...officeMessages, ...fromField].sort((left, right) => (asDate(right.timestamp)?.getTime() || 0) - (asDate(left.timestamp)?.getTime() || 0));
    return messages.length ? messages.slice(0, 30).map(item => {
      const message = item.message;
      if (item.direction === "field") return `<article><strong>${escapeHtml(formatDateTime(item.timestamp))} · ${escapeHtml(message.senderName || person.name || "MPI Field User")} → Office</strong><p>${escapeHtml(message.message || "Photos sent to MPI Office")}</p>${fieldAttachmentsHtml(message)}</article>`;
      const receipt = messageReceiptCache.get(message.id);
      const state = receipt?.status ? receipt.status.replace(/-/g, " ") : "Sent to app";
      return `<article><strong>${escapeHtml(formatDateTime(message.createdAt))} · MPI Office → ${escapeHtml(person.name || "field user")}</strong><p>${escapeHtml(message.message)}</p><p><b>Status:</b> ${escapeHtml(state)}</p>${adminAttachmentsHtml(message)}</article>`;
    }).join("") : '<div class="empty">No messages in this conversation yet.</div>';
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
      const dayDrive = driveTimeForDay(item);
      Object.keys(summary).forEach(key => { summary[key] += Number(dayDrive?.[key]) || 0; });
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
    const lastLocation = lastLocationForDay(day);
    const locationLink = lastLocation && Number.isFinite(lastLocation.latitude) && Number.isFinite(lastLocation.longitude)
      ? `<a href="https://maps.apple.com/?q=${encodeURIComponent(`${lastLocation.latitude},${lastLocation.longitude}`)}" target="_blank" rel="noopener">Open last recorded location ↗</a> · ${escapeHtml(formatTime(lastLocation.timestamp))}`
      : "Not available";
    inspectorDetail.innerHTML = `
      <div class="detail-hero"><div class="detail-person">${avatarHtml(person, "large")}<div><p class="ops-eyebrow">Inspector operations</p><h2>${escapeHtml(person.name || person.email)}</h2><p>${escapeHtml(person.email || "")} · ${escapeHtml(day?.date ? formatDate(day.date) : "No activity synced for this period")} · ${escapeHtml(syncAgeLabel(person, day))}</p></div></div><div><span class="status-badge ${statusClass(day?.liveStatus, alerts)}">${escapeHtml(day?.liveStatus || "NOT STARTED")}</span><button class="detail-back" type="button" data-back-overview>← All inspectors</button></div></div>
      <div class="ops-grid">
        <article class="ops-card span-6"><p class="ops-eyebrow">Current job</p><strong class="ops-primary">${escapeHtml(current?.property || "No job currently open")}</strong><p class="ops-sub">${current ? `Scheduled ${formatTime(current.scheduledStart)} · ${escapeHtml(current.arrivalPerformance || "Arrival not recorded")} · ${escapeHtml(String(current.status || "scheduled").replace(/-/g, " "))}` : "The inspector is not inside an active job workflow."}</p><div class="fact-list" style="margin-top:13px"><div class="fact"><span>Arrived</span><strong>${escapeHtml(formatTime(current?.arrivedAt))}</strong></div><div class="fact"><span>Inspection started</span><strong>${escapeHtml(formatTime(current?.inspectionStartedAt))}</strong></div><div class="fact"><span>Time at property</span><strong>${timeAtProperty}</strong></div></div></article>
        <article class="ops-card span-6"><p class="ops-eyebrow">Next appointment</p><strong class="ops-primary">${escapeHtml(next?.property || "No remaining appointment")}</strong><p class="ops-sub">${next ? `${formatTime(next.scheduledStart)} · ${escapeHtml(next.arrivalPerformance || "On schedule")}` : "The scheduled job list is complete."}</p><div class="fact-list" style="margin-top:13px"><div class="fact"><span>Estimated drive</span><strong>${current?.departurePlan?.estimatedDriveMinutes ? `${current.departurePlan.estimatedDriveMinutes} min` : "—"}</strong></div><div class="fact"><span>Required departure</span><strong>${escapeHtml(formatTime(current?.departurePlan?.leaveBy))}</strong></div><div class="fact"><span>Schedule status</span><strong>${alerts.some(item => /late|affect next/i.test(item)) ? "ATTENTION REQUIRED" : "ON SCHEDULE"}</strong></div></div></article>
        <article class="ops-card"><p class="ops-eyebrow">${currentRange === "week" ? "Hours worked this week" : currentRange === "yesterday" ? "Hours worked yesterday" : "Hours worked today"}</p><strong class="ops-primary">${formatMinutes(hours)}</strong><p class="ops-sub">${currentRange === "week" ? `${days.length} recorded day${days.length === 1 ? "" : "s"} included` : `Started ${formatTime(day?.timeClock?.hoursWorkedStartedAt)} · ${clockOut ? `Frozen at ${formatTime(clockOut)}` : day?.timeClock?.active ? "Running now" : "Not started"}`}</p></article>
        <article class="ops-card"><p class="ops-eyebrow">Activity window</p><strong class="ops-primary">${formatMinutes(activityMinutes)}</strong><p class="ops-sub">Morning readiness ${formatTime(activityStart)} · End ${formatTime(clockOut)}</p></article>
        <article class="ops-card"><p class="ops-eyebrow">Weekly hours</p><strong class="ops-primary">${formatMinutes(weekly)}</strong><p class="ops-sub">Current Monday-to-today total${weekly >= 38 * 60 ? " · Review threshold approaching" : ""}</p>${weeklyDayBreakdownHtml(person, "hours")}</article>
        <article class="ops-card span-6"><h3>${currentRange === "week" ? "Total Drive Time This Week" : "Drive Time"}</h3><div class="fact-list"><div class="fact"><span>Morning drive</span><strong>${formatMinutes(drive.morningMinutes)}</strong></div><div class="fact"><span>Between jobs</span><strong>${formatMinutes(drive.betweenJobMinutes)}</strong></div><div class="fact"><span>Lab travel</span><strong>${formatMinutes(drive.labMinutes)}</strong></div><div class="fact"><span>Final drive</span><strong>${driveTimeForDay(day)?.finalPending ? "Pending" : formatMinutes(drive.finalMinutes)}</strong></div><div class="fact"><span>Total drive ${currentRange === "week" ? "this week" : "today"}</span><strong>${formatMinutes(drive.totalMinutes)}</strong></div></div>${currentRange === "week" ? weeklyDayBreakdownHtml(person, "drive") : ""}</article>
        <article class="ops-card span-6"><h3>Day Progress</h3><strong class="ops-primary">${counts.complete} / ${counts.total} complete</strong><p class="ops-sub">Completed jobs remain visible for the full calendar day.</p><div class="fact-list" style="margin-top:13px"><div class="fact"><span>Completed</span><strong>${counts.complete}</strong></div><div class="fact"><span>Remaining</span><strong>${Math.max(0, counts.total - counts.complete)}</strong></div><div class="fact"><span>Total jobs</span><strong>${counts.total}</strong></div></div></article>
        <article class="ops-card full"><h3>Today’s Jobs</h3><div class="job-list">${(day?.jobs || []).length ? day.jobs.map(jobCard).join("") : '<div class="empty">No scheduled jobs are available for this period.</div>'}</div></article>
        <article class="ops-card span-8"><h3>Activity Timeline</h3><div class="timeline">${timelineHtml(person, day)}</div></article>
        <article class="ops-card"><h3>Alerts / Exceptions</h3><div class="alert-list">${alerts.length ? alerts.map(item => `<div class="alert-item">${escapeHtml(item)}</div>`).join("") : '<div class="clear-item">✓ No meaningful workflow issues recorded.</div>'}</div></article>
        ${(day?.commentFailures || []).length ? `<article class="ops-card full"><h3>Comment Builder Technical Log</h3><div class="timeline">${day.commentFailures.slice().reverse().map(item => `<div class="timeline-row"><time>${escapeHtml(formatTime(item.timestamp))}</time><span class="timeline-dot"></span><div><strong>${escapeHtml(item.category || "service-error")} · attempt ${escapeHtml(item.attempt || "—")}</strong><small>Request ${escapeHtml(item.requestId || "—")} · ${escapeHtml(item.connectivity || "unknown")} · ${escapeHtml(item.code || item.httpStatus || "no status")} · ${escapeHtml(item.message || "No technical message")}</small></div></div>`).join("")}</div></article>` : ""}
        <article class="ops-card"><h3>Morning Readiness</h3><div class="fact-list"><div class="fact"><span>Status</span><strong>${day?.readiness ? "Complete" : "Not recorded"}</strong></div><div class="fact"><span>Completed</span><strong>${formatTime(day?.readiness?.completedAt)}</strong></div><div class="fact"><span>Important notifications</span><strong>${escapeHtml(day?.readiness?.notificationPermission === "granted" ? "Enabled" : day?.readiness?.notificationPermission || "Unknown")}</strong></div></div></article>
        <article class="ops-card"><h3>Lab Activity</h3>${labHtml(day)}</article>
        <article class="ops-card"><h3>End-of-Day Status</h3><div class="fact-list"><div class="fact"><span>Status</span><strong>${escapeHtml(eodStatus)}</strong></div><div class="fact"><span>Clock out</span><strong>${formatTime(clockOut)}</strong></div><div class="fact"><span>Last recorded location</span><strong>${locationLink}</strong></div><div class="fact"><span>Equipment check</span><strong>${day?.dayComplete?.equipment?.length ? "Complete" : "Pending"}</strong></div></div><p class="ops-sub">Location is event-based, not continuous. Never treat a stale location as live.</p></article>
        <article class="ops-card span-6"><h3>Message Inspector</h3><div class="quick-messages" id="adminQuickMessages">${["CALL OFFICE", "PLEASE CHECK APP", "RUNNING LATE – UPDATE OFFICE", "REMEMBER LAB DROP", "PLEASE CONFIRM STATUS", "CONTACT CLIENT"].map(value => `<button type="button" data-quick-message="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join("")}</div><form class="compact-form" id="adminMessageForm" data-person-id="${escapeHtml(person.id)}"><div class="field"><label for="adminMessageText">Review or write the message</label><textarea id="adminMessageText" maxlength="1000" required placeholder="Type a clear operational message for ${escapeHtml(person.name || "the inspector")}"></textarea></div>${chatAttachmentHtml()}<button class="primary" type="submit">SEND TO INSPECTOR APP</button><span class="status" id="adminMessageStatus"></span></form><h3 style="margin-top:20px">Conversation</h3><div class="message-history" id="adminMessageHistory">${messageHistoryHtml(person)}</div></article>
        <article class="ops-card span-6"><h3>Admin Corrections</h3><p class="ops-sub">Corrections are appended to the audit trail. Original records are never deleted or overwritten.</p><form class="compact-form" id="adminCorrectionForm" data-person-id="${escapeHtml(person.id)}"><div class="two-col"><div class="field"><label for="adminCorrectionAction">Missed / incorrect action</label><select id="adminCorrectionAction" required>${correctionActions.map(action => `<option value="${escapeHtml(action)}">${escapeHtml(action)}</option>`).join("")}</select></div><div class="field"><label for="adminCorrectionJob">Job</label><select id="adminCorrectionJob"><option value="">No specific job</option>${jobOptions}</select></div></div><div class="field"><label for="adminCorrectionValue">Correct date and time</label><input id="adminCorrectionValue" type="datetime-local" required></div><div class="field"><label for="adminCorrectionReason">Reason for correction</label><textarea id="adminCorrectionReason" maxlength="500" required placeholder="Explain why management is adding this correction."></textarea></div><button class="primary" type="submit">ADD AUDITABLE CORRECTION</button><span class="status" id="adminCorrectionStatus"></span></form><h3 style="margin-top:20px">Correction History</h3><div class="correction-history">${correctionHistoryHtml(person, day)}</div></article>
      </div>`;
    teamOverview.hidden = true;
    inspectorDetail.hidden = false;
    hydrateMessageReceipts(person);
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
    renderReplyInbox();
    renderSafetyAlerts();
  }

  async function receiptSummary(updateId) {
    try {
      const snapshot = await shared.db.collection("officeUpdates").doc(updateId).collection("receipts").get();
      const values = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
      return { total: values.length, acknowledged: values.filter(item => ["acknowledged", "completed", "read", "replied"].includes(item.status)).length, completed: values.filter(item => item.status === "completed").length, replies: values.filter(item => item.replyText) };
    } catch (_) {
      return { total: 0, acknowledged: 0, completed: 0, replies: [] };
    }
  }

  async function renderUpdates() {
    const summaries = await Promise.all(updates.map(update => receiptSummary(update.id)));
    const summaryReplies = summaries.flatMap((summary, index) => summary.replies.map(reply => ({
      ...reply,
      updateId: updates[index]?.id || "",
      updateTitle: updates[index]?.title || "Office update"
    })));
    if (summaryReplies.length) {
      const merged = new Map(inspectorReplies.map(reply => [`${reply.updateId}:${reply.userId || reply.userEmail || "unknown"}`, reply]));
      summaryReplies.forEach(reply => merged.set(`${reply.updateId}:${reply.userId || reply.userEmail || "unknown"}`, reply));
      inspectorReplies = [...merged.values()].sort((a, b) => (asDate(b.repliedAt)?.getTime() || 0) - (asDate(a.repliedAt)?.getTime() || 0));
      renderReplyInbox();
    }
    updatesList.innerHTML = updates.length ? updates.map((update, index) => {
      const summary = summaries[index];
      const recipient = update.audience === "all" ? "All inspectors" : update.targetName || update.targetEmail || "One inspector";
      const replies = summary.replies.length ? `<div class="admin-update-replies"><strong>Inspector replies</strong>${summary.replies.map(reply => `<p><b>${escapeHtml(reply.userName || reply.userEmail || "Inspector")}:</b> ${escapeHtml(reply.replyText)}</p>`).join("")}</div>` : "";
      return `<article class="update-card"><div class="update-top"><div><span class="type-badge">${escapeHtml(String(update.type || "update").replace("-", " "))}</span>${update.priority !== "normal" ? `<span class="priority-badge">${escapeHtml(update.priority)}</span>` : ""}<h3>${escapeHtml(update.title)}</h3></div><span class="role-badge">${escapeHtml(recipient)}</span></div><p>${escapeHtml(update.message)}</p>${adminAttachmentsHtml(update)}<div class="update-meta"><span>Published ${escapeHtml(formatDateTime(update.createdAt))}</span><span>Due ${escapeHtml(formatDate(update.dueDate))}</span><span>${summary.total} response${summary.total === 1 ? "" : "s"}</span><span>${summary.acknowledged} read / acknowledged</span></div>${replies}</article>`;
    }).join("") : '<div class="empty">No office updates have been published.</div>';
    if (selectedInspectorId !== "all") renderOperations();
  }

  function startAdminData() {
    unsubscribePeople?.();
    unsubscribeUpdates?.();
    unsubscribeReplies?.();
    unsubscribeFieldMessages?.();
    unsubscribePeople = shared.db.collection("users").orderBy("name").onSnapshot(snapshot => {
      people = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      renderPeople();
    }, error => { authStatus.textContent = error.message; });
    unsubscribeUpdates = shared.db.collection("officeUpdates").orderBy("createdAt", "desc").limit(200).onSnapshot(snapshot => {
      updates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(update => !update.hidden);
      renderUpdates();
    }, error => { publishStatus.textContent = error.message; publishStatus.className = "status error"; });
    replyListenerReady = false;
    knownReplyKeys = new Set();
    unsubscribeReplies = shared.db.collectionGroup("receipts").where("status", "==", "replied").onSnapshot(processReplySnapshot, () => {
      renderReplyInbox();
    });
    fieldMessageListenerReady = false;
    knownFieldMessageIds = new Set();
    unsubscribeFieldMessages = shared.db.collection("fieldMessages").orderBy("createdAt", "desc").limit(200).onSnapshot(processFieldMessages, () => {
      fieldMessages = [];
      renderReplyInbox();
    });
    if (!replyRefreshTimer) {
      replyRefreshTimer = window.setInterval(async () => {
        if (dashboard.hidden || repliesRefreshing || !updates.length) return;
        repliesRefreshing = true;
        try {
          await renderUpdates();
          const person = people.find(item => item.id === selectedInspectorId);
          if (person) await hydrateMessageReceipts(person);
        } finally {
          repliesRefreshing = false;
        }
      }, 12000);
    }
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
        const attachments = await uploadAttachments(updateRef, filesToUpload, audience === "all" ? "all" : "inspector", targetEmail);
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
        targetTokens: notificationTokensForUpdate(audience === "all" ? "all" : "inspector", targetEmail),
        title: notificationTitle || "New message from MPI Office",
        body: notificationBody || "Open MPI Field Tools to review the new information.",
        link: "./#team-messages",
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
    const person = people.find(item => item.id === formElement.dataset.personId);
    const text = formElement.querySelector("[data-message-text], #adminMessageText")?.value.trim();
    const status = formElement.querySelector("[data-message-status], #adminMessageStatus");
    if (!person || !text) return;
    const files = [...(formElement._mpiFiles || [])];
    status.textContent = "Sending…";
    let messageRef = null;
    try {
      messageRef = shared.db.collection("officeUpdates").doc();
      await messageRef.set({
        type: "message", priority: "important", audience: "inspector",
        targetEmail: shared.normalizeEmail(person.email), targetName: person.name || "",
        title: "Message from MPI Office", message: text, link: "", dueDate: "", requiresAcknowledgement: false, active: files.length === 0, attachments: [],
        replyNotificationToken: officeReplyToken(),
        createdAt: shared.serverTimestamp(), createdBy: currentUser.uid,
        createdByEmail: shared.normalizeEmail(currentUser.email), createdByName: currentProfile.name || currentUser.displayName || "MPI Management"
      });
      if (files.length) {
        const attachments = await uploadAttachments(messageRef, files, "inspector", shared.normalizeEmail(person.email), status);
        await messageRef.update({ attachments, active: true, attachmentUploadStatus: "complete", publishedAt: shared.serverTimestamp() });
      }
      const pushRequested = await shared.sendPushNotification({
        kind: "office-message",
        audience: "inspector",
        targetTokens: notificationTokensForUpdate("inspector", person.email),
        title: "Message from MPI Office",
        body: text,
        link: person.role === "subcontractor" ? "./#office-updates" : "./#team-messages",
        tag: `mpi-office-${messageRef.id}`
      }).catch(() => false);
      formElement.reset();
      formElement._mpiFiles = [];
      renderChatFiles(formElement);
      status.textContent = pushRequested
        ? `Sent to ${person.name || "field user"}; push alert requested.`
        : `Sent to ${person.name || "field user"}. Push alerts are not enabled on that phone yet.`;
      status.className = "status success";
    } catch (error) {
      if (messageRef) messageRef.set({ active: false, attachmentUploadStatus: "failed" }, { merge: true }).catch(() => {});
      status.textContent = error.message || "The message could not be sent.";
      status.className = "status error";
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
    if (role === "owner" && !shared.isOwnerEmail(currentUser?.email)) return;
    const active = card.querySelector("[data-person-active]").checked;
    const inspectorId = card.querySelector("[data-person-inspector-id]").value.trim().slice(0, 40);
    const phone = card.querySelector("[data-person-phone]").value.trim().slice(0, 30);
    try {
      await shared.db.collection("users").doc(person.id).set({ role, active, inspectorId, phone, updatedAt: shared.serverTimestamp(), updatedBy: currentUser.uid }, { merge: true });
    } catch (error) {
      authStatus.textContent = error.message || "The account change could not be saved.";
    }
  }

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
  subcontractorList?.addEventListener("submit", event => {
    const formElement = event.target.closest("[data-subcontractor-message-form]");
    if (!formElement) return;
    event.preventDefault();
    sendInspectorMessage(formElement);
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
  updatesList.addEventListener("click", event => {
    const button = event.target.closest("[data-open-admin-attachment]");
    if (button) openAdminAttachment(button);
  });
  [requestStatusFilter, requestInspectorFilter, requestTypeFilter, requestAssigneeFilter, requestDateFilter, requestSort].forEach(control => control?.addEventListener("change", renderRequestTodos));
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
  replyInbox?.addEventListener("click", event => {
    const attachment = event.target.closest("[data-open-field-attachment]");
    if (attachment) {
      event.preventDefault();
      event.stopPropagation();
      openFieldAttachment(attachment);
      return;
    }
    const button = event.target.closest("[data-open-reply-inspector]");
    if (!button?.dataset.openReplyInspector) return;
    markReplyRead(button.dataset.replyKey || "");
    selectedInspectorId = button.dataset.openReplyInspector;
    inspectorSelector.value = selectedInspectorId;
    renderOperations();
  });
  safetyAlertCenter?.addEventListener("click", event => {
    const button = event.target.closest("[data-acknowledge-safety]");
    if (!button) return;
    button.disabled = true;
    button.textContent = "ACKNOWLEDGED";
    markReplyRead(`field:${button.dataset.acknowledgeSafety}`);
  });
  peopleList.addEventListener("change", updatePerson);
  inspectorSelector.addEventListener("change", () => { selectedInspectorId = inspectorSelector.value; renderOperations(); });
  rangePicker.addEventListener("click", event => {
    const button = event.target.closest("[data-range]");
    if (!button) return;
    currentRange = button.dataset.range;
    renderOperations();
  });
  teamOverview.addEventListener("click", event => {
    const subcontractor = event.target.closest("[data-open-subcontractor]");
    if (subcontractor) {
      selectedInspectorId = subcontractor.dataset.openSubcontractor;
      inspectorSelector.value = selectedInspectorId;
      renderOperations();
      return;
    }
    const row = event.target.closest("[data-open-inspector]");
    if (!row) return;
    selectedInspectorId = row.dataset.openInspector;
    inspectorSelector.value = selectedInspectorId;
    renderOperations();
  });
  inspectorDetail.addEventListener("click", event => {
    const fieldAttachment = event.target.closest("[data-open-field-attachment]");
    if (fieldAttachment) {
      openFieldAttachment(fieldAttachment);
      return;
    }
    const officeAttachment = event.target.closest("[data-open-admin-attachment]");
    if (officeAttachment) {
      openAdminAttachment(officeAttachment);
      return;
    }
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
    if (event.target.matches("[data-subcontractor-message-form]")) sendInspectorMessage(event.target);
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
      { id: "preview-cory", name: "Cory Leese", email: "cory@michiganpropertyinspections.com", inspectorId: "NACHI26090138", role: "inspector", active: true, operationsCurrent: makeDay("Cory Leese", "NACHI26090138", "DRIVING TO JOB", 6), operationsUpdatedAt: new Date() },
      { id: "preview-sub", name: "Jason Chamarro", email: "test-subcontractor@mpi.local", phone: "", role: "subcontractor", active: true, notificationDevice: { token: "preview" }, subcontractorCurrent: { date: dateKey(), test: false, subcontractorName: "Jason Chamarro", subcontractorPhone: "", currentJobNumber: 2, currentJob: { number: 2, status: "arrived", onWayAt: at(12, 48), arrivedAt: at(13, 14), completedAt: "" }, completedJobs: [{ number: 1, status: "completed", completedAt: at(11, 32) }], status: "AT JOB – JOB 2", events: [{ id: "sub-a", type: "ON WAY", timestamp: at(12, 48), jobNumber: 2 }, { id: "sub-b", type: "ARRIVED", timestamp: at(13, 14), jobNumber: 2 }], updatedAtClient: new Date().toISOString() } }
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

  shared.completeRedirectSignIn?.().catch(error => {
    authStatus.textContent = error.message || "Google sign-in returned without completing. Please try again.";
  });

  shared.watchSession(({ user, profile, error }) => {
    currentUser = user;
    currentProfile = profile;
    readReplyKeys = new Set(Array.isArray(profile?.officeReplyReadKeys) ? profile.officeReplyReadKeys : []);
    authStatus.textContent = error?.message || "";
    if (!user || !profile || !shared.isAdminRole(profile)) {
      dashboard.hidden = true;
      accountPill.hidden = true;
      signOutButton.hidden = !user;
      authCard.hidden = false;
      if (user && profile && !shared.isAdminRole(profile)) authStatus.textContent = `${user.email || "This account"} has inspector access only. Sign out and use kev@michiganpropertyinspections.com.`;
      unsubscribePeople?.();
      unsubscribeUpdates?.();
      unsubscribeReplies?.();
      unsubscribeReplies = null;
      unsubscribeFieldMessages?.();
      unsubscribeFieldMessages = null;
      if (replyRefreshTimer) {
        window.clearInterval(replyRefreshTimer);
        replyRefreshTimer = 0;
      }
      return;
    }
    commentUsagePanel.hidden = !shared.isOwnerEmail(user.email);
    authCard.hidden = true;
    dashboard.hidden = false;
    accountPill.hidden = false;
    signOutButton.hidden = false;
    accountName.textContent = profile.name || user.displayName || "MPI Owner";
    accountEmail.textContent = user.email || "";
    accountInitial.textContent = (profile.name || user.displayName || "K").trim().charAt(0).toUpperCase();
    startAdminData();
    if (window.Notification?.permission === "granted") enableOfficeAlerts(null, false);
  });
})();
