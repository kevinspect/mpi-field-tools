(function () {
  "use strict";

  const shared = window.MPI_SHARED;
  const homeCard = document.getElementById("mpiHomeUpdates");
  const homeCount = document.getElementById("mpiHomeUpdatesCount");
  const homeTitle = document.getElementById("mpiHomeUpdatesTitle");
  const homeDetail = document.getElementById("mpiHomeUpdatesDetail");
  const officeConsoleCard = document.getElementById("officeConsoleCard");
  const settingsAdminLink = document.getElementById("mpiSettingsAdminLink");
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
  let currentUser = null;
  let currentProfile = null;
  let currentUpdates = [];
  let unsubscribeUpdates = null;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function typeLabel(value) {
    return ({ announcement: "Company update", instruction: "Instruction", training: "Training", "job-note": "Job note", procedure: "Procedure", equipment: "Equipment" })[value] || "Office update";
  }

  function formatDate(value) {
    if (!value) return "";
    const date = value?.toDate?.() || new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function updateAction(update) {
    if (update.receipt?.status === "completed") return { label: "Completed ✓", status: "completed", disabled: true };
    if (update.receipt?.status === "acknowledged") return { label: "Acknowledged ✓", status: "acknowledged", disabled: true };
    if (update.type === "training") return { label: "Mark training complete", status: "completed", disabled: false };
    if (update.requiresAcknowledgement) return { label: "Acknowledge", status: "acknowledged", disabled: false };
    return { label: update.receipt?.status === "read" ? "Read ✓" : "Mark as read", status: "read", disabled: update.receipt?.status === "read" };
  }

  function renderUpdates(updates) {
    currentUpdates = updates;
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
      return `<article class="mpi-update-card ${escapeHtml(update.priority || "normal")}" data-update-id="${escapeHtml(update.id)}"><div class="mpi-update-top"><span>${escapeHtml(typeLabel(update.type))}</span>${update.priority && update.priority !== "normal" ? `<strong>${escapeHtml(update.priority)}</strong>` : ""}</div><h3>${escapeHtml(update.title)}</h3><p>${escapeHtml(update.message)}</p><div class="mpi-update-meta">${due}<span>From ${escapeHtml(update.createdByName || "MPI Management")}</span></div>${link}<button class="mpi-update-action" type="button" data-update-status="${action.status}" ${action.disabled ? "disabled" : ""}>${escapeHtml(action.label)}</button></article>`;
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
      updatesGate.hidden = false;
      updatesContent.hidden = true;
      homeCard.hidden = true;
      unsubscribeUpdates?.();
      return;
    }
    accountName.textContent = profile.name || user.displayName || "MPI Team Member";
    accountRole.textContent = shared.isAdminRole(profile) ? "Owner / office administrator" : "Inspector";
    accountStatus.textContent = user.email || "Signed in";
    signInButtons.forEach(button => { button.hidden = true; });
    signOutButtons.forEach(button => { button.hidden = false; });
    officeConsoleCard.hidden = !shared.isAdminRole(profile);
    settingsAdminLink.hidden = !shared.isAdminRole(profile);
    updatesGate.hidden = true;
    updatesContent.hidden = false;
    unsubscribeUpdates?.();
    unsubscribeUpdates = shared.watchUpdates(user, profile, renderUpdates);
  }

  async function signIn(button) {
    button.disabled = true;
    accountStatus.textContent = "Opening company sign-in…";
    try { await shared.signIn(); } catch (error) { accountStatus.textContent = error.message || "Sign-in did not finish."; }
    button.disabled = false;
  }

  async function handleUpdateAction(event) {
    const button = event.target.closest("[data-update-status]");
    if (!button || !currentUser) return;
    const card = button.closest("[data-update-id]");
    button.disabled = true;
    try {
      await shared.setUpdateStatus(card.dataset.updateId, currentUser, currentProfile, button.dataset.updateStatus);
    } catch (_) {
      button.disabled = false;
      button.textContent = "Try again";
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
  shared.watchSession(({ user, profile, error }) => renderSession(user, profile, error));
})();
