(function () {
  "use strict";

  const shared = window.MPI_SHARED;
  const homeCard = document.getElementById("mpiHomeUpdates");
  const homeCount = document.getElementById("mpiHomeUpdatesCount");
  const homeTitle = document.getElementById("mpiHomeUpdatesTitle");
  const homeDetail = document.getElementById("mpiHomeUpdatesDetail");
  const officeConsoleCard = document.getElementById("officeConsoleCard");
  const settingsAdminLink = document.getElementById("mpiSettingsAdminLink");
  const adminReturnLink = document.getElementById("mpiAdminReturn");
  const openedFromOfficeDashboard = new URLSearchParams(window.location.search).get("office") === "1";
  const accountCard = document.getElementById("mpiAccountCard");
  const accountStatus = document.getElementById("mpiAccountStatus");
  const accountName = document.getElementById("mpiAccountName");
  const accountRole = document.getElementById("mpiAccountRole");
  const signInButtons = [...document.querySelectorAll("[data-mpi-sign-in]")];
  const signOutButtons = [...document.querySelectorAll("[data-mpi-sign-out]")];
  const updatesGate = document.getElementById("mpiUpdatesGate");
  const updatesContent = document.getElementById("mpiUpdatesContent");
  const updatesList = document.getElementById("mpiUpdatesList");
  const updatesSummary = document.getElementById("mpiUpdatesSummary");
  const teamStatusCard = document.getElementById("workflowTeamStatusCard");
  const teamStatusList = document.getElementById("workflowTeamStatusList");
  const teamStatusUpdated = document.getElementById("workflowTeamStatusUpdated");
  let currentUser = null;
  let currentProfile = null;
  let currentUpdates = [];
  let unsubscribeUpdates = null;
  let unsubscribeTeamPresence = null;
  let registeredPushToken = "";
  const NOTIFIED_UPDATE_STORAGE_KEY = "mpiNotifiedOfficeUpdatesV2";

  function notifiedUpdateIds() {
    try {
      const values = JSON.parse(localStorage.getItem(NOTIFIED_UPDATE_STORAGE_KEY) || "[]");
      return new Set(Array.isArray(values) ? values.map(String) : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveNotifiedUpdateIds(values) {
    try { localStorage.setItem(NOTIFIED_UPDATE_STORAGE_KEY, JSON.stringify([...values].slice(-100))); }
    catch (_) {}
  }

  function playOfficeMessageTone() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const start = context.currentTime;
      [784, 988, 1175].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + index * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.22, start + index * 0.16 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.16 + 0.13);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start + index * 0.16);
        oscillator.stop(start + index * 0.16 + 0.14);
      });
      window.setTimeout(() => context.close().catch(() => {}), 900);
    } catch (_) {}
  }

  async function showIncomingOfficeAlert(update) {
    const title = update.title || "New message from MPI Office";
    const body = update.message || "Open MPI Field Tools to review the new message.";
    try { navigator.vibrate?.([250, 100, 250, 100, 450]); } catch (_) {}
    playOfficeMessageTone();
    if (typeof window.showToast === "function") window.showToast(title);
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: "./icon-192.png",
          badge: "./icon-192.png",
          tag: `mpi-office-${update.id}`,
          renotify: true,
          requireInteraction: true,
          silent: false,
          vibrate: [250, 100, 250, 100, 450],
          data: { url: "./#team-messages" }
        });
      } else {
        new Notification(title, { body, icon: "./icon-192.png", tag: `mpi-office-${update.id}` });
      }
    } catch (_) {}
  }

  function alertForNewUpdates(updates) {
    const seen = notifiedUpdateIds();
    const now = Date.now();
    const fresh = updates.filter(update => {
      if (!update?.id || update.receipt || seen.has(update.id)) return false;
      const created = update.createdAt?.toMillis?.() || 0;
      return !created || now - created < 24 * 60 * 60 * 1000;
    });
    updates.forEach(update => { if (update?.id) seen.add(update.id); });
    saveNotifiedUpdateIds(seen);
    if (fresh.length) showIncomingOfficeAlert(fresh[0]);
  }

  document.querySelector("[data-team-status-shortcut]")?.addEventListener("click", () => {
    window.setTimeout(() => teamStatusCard?.scrollIntoView({ behavior: "smooth", block: "start" }), 180);
  });

  function savedPushToken() {
    try { return String(localStorage.getItem("mpiPushTokenV1") || "").trim(); }
    catch (_) { return ""; }
  }

  async function registerPushDevice(user, profile, suppliedToken = "") {
    const token = String(suppliedToken || savedPushToken()).trim();
    if (!user || !profile || !token || token === registeredPushToken) return;
    await shared.db.collection("users").doc(user.uid).set({
      notificationDevice: {
        token,
        enabled: true,
        app: "MPI Field Tools",
        updatedAt: shared.serverTimestamp()
      }
    }, { merge: true });
    registeredPushToken = token;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function typeLabel(value) {
    return ({ message: "Office message", announcement: "Company update", instruction: "Instruction", training: "Training", "job-note": "Job note", procedure: "Procedure", equipment: "Equipment" })[value] || "Office update";
  }

  function teamStatusLabel(value) {
    return ({
      "NOT STARTED": "Not started",
      "READY / WAITING TO DEPART": "Ready / waiting",
      "DRIVING TO JOB": "On route to job",
      "ARRIVED AT JOB": "Arrived",
      "INSPECTION IN PROGRESS": "Inspection started",
      "FINAL JOB COMPLETE": "Job complete",
      "LAB STOP": "Choosing lab stop",
      "DRIVING TO LAB": "On route to lab",
      "AT LAB": "At lab",
      "DRIVING TO NEXT JOB": "On route to next job",
      "READY TO DRIVE HOME": "Ready to head home",
      "DRIVING HOME": "On route home",
      "DRIVING HOME / FINAL DESTINATION": "On route home",
      "END-OF-DAY CHECKS": "End-of-day check",
      "CLOCKED OUT": "Clocked out"
    })[String(value || "").toUpperCase()] || "Status unavailable";
  }

  function teamStatusTone(value) {
    const status = String(value || "").toUpperCase();
    if (/DRIVING|ROUTE/.test(status)) return "travel";
    if (/ARRIVED|IN PROGRESS|AT LAB/.test(status)) return "active";
    if (/READY|WAITING|CHECK|COMPLETE/.test(status) && status !== "CLOCKED OUT") return "waiting";
    return "neutral";
  }

  function teamPresenceDate(item) {
    const date = item?.updatedAt?.toDate?.() || new Date(item?.updatedAtClient || "");
    return date && !Number.isNaN(date.getTime()) ? date : null;
  }

  function teamPresenceAge(item) {
    const date = teamPresenceDate(item);
    if (!date) return "Waiting for first sync";
    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return "Updated just now";
    if (minutes < 60) return `Updated ${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Updated ${hours} hr${hours === 1 ? "" : "s"} ago`;
    return `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function teamInitials(name) {
    return String(name || "MPI").trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase() || "MPI";
  }

  function renderTeamPresence(records, error = null) {
    if (!teamStatusCard || !teamStatusList) return;
    const inspectorView = currentUser && currentProfile && ["owner", "inspector"].includes(String(currentProfile.role || "").toLowerCase());
    teamStatusCard.hidden = !inspectorView;
    if (!inspectorView) return;
    if (error) {
      teamStatusList.innerHTML = '<div class="workflow-team-empty">Team status could not refresh. Your own workflow is unaffected.</div>';
      teamStatusUpdated.textContent = "Reconnect to refresh";
      return;
    }
    const values = [...records].sort((left, right) => {
      if (left.id === currentUser.uid) return -1;
      if (right.id === currentUser.uid) return 1;
      return String(left.name || "").localeCompare(String(right.name || ""));
    });
    teamStatusList.innerHTML = values.length ? values.map(item => {
      const sameDay = item.date === localDateKey();
      const rawStatus = sameDay ? item.status : "NOT STARTED";
      const age = teamPresenceAge(item);
      const updated = teamPresenceDate(item);
      const stale = sameDay && rawStatus !== "CLOCKED OUT" && updated && Date.now() - updated.getTime() > 20 * 60 * 1000;
      const photo = item.photoURL ? `<img src="${escapeHtml(item.photoURL)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : "";
      return `<article class="workflow-team-person${item.id === currentUser.uid ? " is-you" : ""}"><span class="workflow-team-avatar">${photo}<b>${escapeHtml(teamInitials(item.name))}</b></span><div class="workflow-team-copy"><strong>${escapeHtml(item.name || "MPI Inspector")}${item.id === currentUser.uid ? " <small>YOU</small>" : ""}</strong><span>${escapeHtml(stale ? `${age} · confirm status if needed` : age)}</span></div><span class="workflow-team-pill ${teamStatusTone(rawStatus)}${stale ? " stale" : ""}">${escapeHtml(sameDay ? teamStatusLabel(rawStatus) : "Not updated today")}</span></article>`;
    }).join("") : '<div class="workflow-team-empty">Team members will appear after their company phones load this update.</div>';
    teamStatusUpdated.textContent = values.length ? `${values.length} field ${values.length === 1 ? "user" : "users"}` : "Waiting for phones";
  }

  function formatDate(value) {
    if (!value) return "";
    const date = value?.toDate?.() || new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function formatFileSize(value) {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function attachmentKind(file) {
    return String(file?.type || "").includes("pdf") || /\.pdf$/i.test(file?.name || "") ? "PDF" : "IMG";
  }

  function updateAttachmentsHtml(update) {
    const attachments = Array.isArray(update?.attachments) ? update.attachments : [];
    if (!attachments.length) return "";
    return `<div class="mpi-update-attachments"><strong>Files from MPI Office</strong>${attachments.map(file => `<button class="mpi-update-attachment" type="button" data-office-attachment="${escapeHtml(file.id)}"><span class="mpi-update-attachment-kind">${escapeHtml(attachmentKind(file))}</span><span class="mpi-update-attachment-copy"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(formatFileSize(file.size))}</small></span><span class="mpi-update-attachment-open">OPEN ↗</span></button>`).join("")}<small>Open each file once while connected so the phone can retain it for later use.</small></div>`;
  }

  function updateAction(update) {
    if (["completed", "acknowledged", "read", "replied"].includes(update.receipt?.status)) return { label: "CLEAR FROM MY APP", status: "clear", disabled: false, clear: true };
    if (update.type === "training") return { label: "Mark training complete", status: "completed", disabled: false };
    if (update.requiresAcknowledgement) return { label: "Acknowledge", status: "acknowledged", disabled: false };
    return { label: "Mark as read", status: "read", disabled: false };
  }

  function renderUpdates(updates) {
    currentUpdates = updates;
    alertForNewUpdates(updates);
    const unread = updates.filter(item => !item.receipt).length;
    homeCard.hidden = !updates.length;
    if (updates.length) {
      homeCount.textContent = unread ? `${unread} new` : `${updates.length} current`;
      homeTitle.textContent = updates[0].title || "New office information";
      homeDetail.textContent = updates[0].message || "Open Updates to review the latest information from MPI.";
    }
    updatesSummary.textContent = updates.length
      ? `${updates.length} current item${updates.length === 1 ? "" : "s"}${unread ? ` · ${unread} new` : ""}`
      : "No current office updates";
    updatesList.innerHTML = updates.length ? updates.map(update => {
      const action = updateAction(update);
      const due = update.dueDate ? `<span>Due ${escapeHtml(formatDate(update.dueDate))}</span>` : "";
      const link = update.link ? `<a class="mpi-update-link" href="${escapeHtml(update.link)}" target="_blank" rel="noopener noreferrer">Open supporting information ↗</a>` : "";
      const reply = update.receipt?.replyText
        ? `<div class="mpi-update-reply-sent"><strong>Your reply was sent to the office</strong><span>${escapeHtml(update.receipt.replyText)}</span></div>`
        : `<details class="mpi-update-reply"><summary>Reply to office</summary><form data-update-reply-form><label>Message for management<textarea maxlength="1000" required placeholder="Type your reply here"></textarea></label><button type="submit">SEND REPLY</button><span role="status"></span></form></details>`;
      return `<article class="mpi-update-card ${escapeHtml(update.priority || "normal")}" data-update-id="${escapeHtml(update.id)}"><div class="mpi-update-top"><span>${escapeHtml(typeLabel(update.type))}</span>${update.priority && update.priority !== "normal" ? `<strong>${escapeHtml(update.priority)}</strong>` : ""}</div><h3>${escapeHtml(update.title)}</h3><p>${escapeHtml(update.message)}</p><div class="mpi-update-meta">${due}<span>From ${escapeHtml(update.createdByName || "MPI Management")}</span></div>${link}${updateAttachmentsHtml(update)}${reply}<button class="mpi-update-action${action.clear ? " clear" : ""}" type="button" data-update-status="${action.status}" ${action.disabled ? "disabled" : ""}>${escapeHtml(action.label)}</button></article>`;
    }).join("") : '<div class="mpi-updates-empty"><strong>You are up to date.</strong><span>No current office messages, instructions, or training assignments are waiting.</span></div>';
  }

  function renderSession(user, profile, error) {
    currentUser = user;
    currentProfile = profile;
    accountCard.hidden = false;
    if (!user || !profile) {
      accountName.textContent = "Not signed in";
      accountRole.textContent = "Sign in once on this company phone to receive individual instructions and training assignments.";
      accountStatus.textContent = error?.message || "Company account required";
      signInButtons.forEach(button => { button.hidden = false; });
      signOutButtons.forEach(button => { button.hidden = true; });
      officeConsoleCard.hidden = true;
      settingsAdminLink.hidden = true;
      if (adminReturnLink) adminReturnLink.hidden = !openedFromOfficeDashboard;
      updatesGate.hidden = false;
      updatesContent.hidden = true;
      homeCard.hidden = true;
      unsubscribeUpdates?.();
      unsubscribeTeamPresence?.();
      unsubscribeTeamPresence = null;
      if (teamStatusCard) teamStatusCard.hidden = true;
      return;
    }
    accountName.textContent = profile.name || user.displayName || "MPI Team Member";
    accountRole.textContent = shared.isAdminRole(profile) ? "Owner / office administrator" : "Inspector";
    accountStatus.textContent = user.email || "Signed in";
    signInButtons.forEach(button => { button.hidden = true; });
    signOutButtons.forEach(button => { button.hidden = false; });
    officeConsoleCard.hidden = !shared.isAdminRole(profile);
    settingsAdminLink.hidden = !shared.isAdminRole(profile);
    if (adminReturnLink) adminReturnLink.hidden = !(openedFromOfficeDashboard || shared.isAdminRole(profile));
    updatesGate.hidden = true;
    updatesContent.hidden = false;
    registerPushDevice(user, profile).catch(() => {});
    const sessionDetail = {
      userId: user.uid,
      role: profile.role || "inspector",
      inspectorId: String(profile.inspectorId || "").trim(),
      inspectorName: String(profile.name || user.displayName || "").trim(),
      inspectorEmail: String(user.email || profile.email || "").trim()
    };
    window.MPI_COMPANY_SESSION = sessionDetail;
    window.dispatchEvent(new CustomEvent("mpi-company-session-ready", { detail: sessionDetail }));
    unsubscribeUpdates?.();
    unsubscribeUpdates = shared.watchUpdates(user, profile, renderUpdates);
    unsubscribeTeamPresence?.();
    unsubscribeTeamPresence = null;
    if (["owner", "inspector"].includes(String(profile.role || "").toLowerCase()) && shared.watchTeamPresence) {
      unsubscribeTeamPresence = shared.watchTeamPresence(renderTeamPresence);
    } else if (teamStatusCard) {
      teamStatusCard.hidden = true;
    }
  }

  async function signIn(button) {
    button.disabled = true;
    accountStatus.textContent = "Opening company sign-in…";
    try {
      await shared.signIn();
    } catch (error) {
      const messages = {
        "auth/popup-closed-by-user": "Sign-in was closed before it finished. Tap Sign In and complete the Google window.",
        "auth/cancelled-popup-request": "Sign-in was interrupted. Tap Sign In once and complete the Google window.",
        "auth/unauthorized-domain": "This app address is not approved for company sign-in. Contact MPI management.",
        "auth/account-exists-with-different-credential": "Use the MPI Google account already assigned to this email address."
      };
      accountStatus.textContent = messages[error?.code] || error.message || "Sign-in did not finish. Please try again.";
    }
    button.disabled = false;
  }

  async function handleUpdateAction(event) {
    const button = event.target.closest("[data-update-status]");
    if (!button || !currentUser) return;
    const card = button.closest("[data-update-id]");
    button.disabled = true;
    try {
      if (button.dataset.updateStatus === "clear") await shared.clearUpdate(card.dataset.updateId, currentUser, currentProfile);
      else await shared.setUpdateStatus(card.dataset.updateId, currentUser, currentProfile, button.dataset.updateStatus);
    } catch (_) {
      button.disabled = false;
      button.textContent = "Try again";
    }
  }

  async function handleAttachmentOpen(event) {
    const button = event.target.closest("[data-office-attachment]");
    if (!button) return;
    const card = button.closest("[data-update-id]");
    const update = currentUpdates.find(item => item.id === card?.dataset.updateId);
    const attachment = update?.attachments?.find(item => item.id === button.dataset.officeAttachment);
    if (!update || !attachment) return;
    const viewer = window.open("about:blank", "_blank");
    const label = button.querySelector(".mpi-update-attachment-open");
    button.disabled = true;
    if (label) label.textContent = "LOADING…";
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
      if (label) label.textContent = "TRY AGAIN";
      button.title = error?.message || "The file could not be opened.";
      button.disabled = false;
      return;
    }
    if (label) label.textContent = "OPEN ↗";
    button.disabled = false;
  }

  async function handleUpdateReply(event) {
    const form = event.target.closest("[data-update-reply-form]");
    if (!form || !currentUser) return;
    event.preventDefault();
    const card = form.closest("[data-update-id]");
    const textarea = form.querySelector("textarea");
    const button = form.querySelector("button");
    const status = form.querySelector("[role=status]");
    const message = textarea.value.trim();
    if (!message) return;
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const update = currentUpdates.find(item => item.id === card.dataset.updateId) || null;
      await shared.replyToUpdate(card.dataset.updateId, currentUser, currentProfile, message, update);
      status.textContent = "Reply sent to MPI management.";
    } catch (error) {
      button.disabled = false;
      status.textContent = error?.message || "Reply could not be sent. Try again.";
    }
  }

  if (!shared?.available) {
    renderSession(null, null, new Error("Reconnect to load the secure company connection."));
    signInButtons.forEach(button => { button.disabled = true; });
    return;
  }

  signInButtons.forEach(button => button.addEventListener("click", () => signIn(button)));
  signOutButtons.forEach(button => button.addEventListener("click", () => shared.signOut()));
  updatesList.addEventListener("click", handleUpdateAction);
  updatesList.addEventListener("click", handleAttachmentOpen);
  updatesList.addEventListener("submit", handleUpdateReply);
  window.addEventListener("mpi-push-token-ready", event => {
    if (currentUser && currentProfile) registerPushDevice(currentUser, currentProfile, event.detail?.token).catch(() => {});
  });
  shared.watchSession(({ user, profile, error }) => renderSession(user, profile, error));
})();
