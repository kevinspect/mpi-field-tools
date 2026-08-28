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
  const tabButtons = [...document.querySelectorAll("[data-admin-view]")];
  const panels = [...document.querySelectorAll("[data-admin-panel]")];
  const stats = {
    inspectors: document.getElementById("statInspectors"),
    updates: document.getElementById("statUpdates"),
    acknowledged: document.getElementById("statAcknowledged"),
    dueSoon: document.getElementById("statDueSoon")
  };
  let currentUser = null;
  let currentProfile = null;
  let people = [];
  let updates = [];
  let unsubscribePeople = null;
  let unsubscribeUpdates = null;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function formatDate(value) {
    if (!value) return "No due date";
    const date = value?.toDate?.() || new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function formatDateTime(value) {
    const date = value?.toDate?.() || (value ? new Date(value) : null);
    if (!date || Number.isNaN(date.getTime())) return "Just now";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
  }

  function showView(name) {
    tabButtons.forEach(button => button.classList.toggle("active", button.dataset.adminView === name));
    panels.forEach(panel => panel.classList.toggle("active", panel.dataset.adminPanel === name));
  }

  function renderTargetOptions() {
    const selected = targetInput.value;
    const inspectorPeople = people.filter(person => person.active !== false && person.role === "inspector");
    targetInput.innerHTML = '<option value="">Choose inspector</option>' + inspectorPeople.map(person => `<option value="${escapeHtml(person.email)}">${escapeHtml(person.name || person.email)} — ${escapeHtml(person.email)}</option>`).join("");
    if (inspectorPeople.some(person => person.email === selected)) targetInput.value = selected;
  }

  function renderPeople() {
    const activeInspectors = people.filter(person => person.active !== false && person.role === "inspector");
    stats.inspectors.textContent = String(activeInspectors.length);
    renderTargetOptions();
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
  }

  async function receiptSummary(updateId) {
    try {
      const snapshot = await shared.db.collection("officeUpdates").doc(updateId).collection("receipts").get();
      const values = snapshot.docs.map(doc => doc.data());
      return {
        total: values.length,
        acknowledged: values.filter(item => ["acknowledged", "completed"].includes(item.status)).length,
        completed: values.filter(item => item.status === "completed").length
      };
    } catch (_) {
      return { total: 0, acknowledged: 0, completed: 0 };
    }
  }

  async function renderUpdates() {
    const summaries = await Promise.all(updates.map(update => receiptSummary(update.id)));
    const acknowledged = summaries.reduce((sum, item) => sum + item.acknowledged, 0);
    const now = Date.now();
    const sevenDays = now + 7 * 86400000;
    const dueSoon = updates.filter(item => {
      if (!item.dueDate) return false;
      const due = new Date(`${item.dueDate}T23:59:59`).getTime();
      return due >= now && due <= sevenDays;
    }).length;
    stats.updates.textContent = String(updates.filter(item => item.active !== false).length);
    stats.acknowledged.textContent = String(acknowledged);
    stats.dueSoon.textContent = String(dueSoon);
    updatesList.innerHTML = updates.length ? updates.map((update, index) => {
      const summary = summaries[index];
      const recipient = update.audience === "all" ? "All inspectors" : update.targetName || update.targetEmail || "One inspector";
      return `<article class="update-card"><div class="update-top"><div><span class="type-badge">${escapeHtml(String(update.type || "update").replace("-", " "))}</span>${update.priority !== "normal" ? `<span class="priority-badge">${escapeHtml(update.priority)}</span>` : ""}<h3>${escapeHtml(update.title)}</h3></div><span class="role-badge">${escapeHtml(recipient)}</span></div><p>${escapeHtml(update.message)}</p><div class="update-meta"><span>Published ${escapeHtml(formatDateTime(update.createdAt))}</span><span>Due ${escapeHtml(formatDate(update.dueDate))}</span><span>${summary.total} response${summary.total === 1 ? "" : "s"}</span><span>${summary.acknowledged} acknowledged</span></div></article>`;
    }).join("") : '<div class="empty">No office updates have been published.</div>';
  }

  function startAdminData() {
    unsubscribePeople?.();
    unsubscribeUpdates?.();
    unsubscribePeople = shared.db.collection("users").orderBy("name").onSnapshot(snapshot => {
      people = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeople();
    }, error => { authStatus.textContent = error.message; });
    unsubscribeUpdates = shared.db.collection("officeUpdates").orderBy("createdAt", "desc").limit(100).onSnapshot(snapshot => {
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
  signInButton.addEventListener("click", async () => {
    signInButton.disabled = true;
    authStatus.textContent = "Opening company sign-in…";
    try { await shared.signIn(); } catch (error) { authStatus.textContent = error.message || "Sign-in did not finish."; }
    signInButton.disabled = false;
  });
  signOutButton.addEventListener("click", () => shared.signOut());

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
