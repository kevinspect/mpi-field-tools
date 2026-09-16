(function () {
  "use strict";
  const OWNER = "kev@michiganpropertyinspections.com";
  let user = null, profile = null, data = null, sources = null, loading = false, generation = 0;
  const button = document.createElement("button");
  button.type = "button"; button.textContent = "View as"; button.hidden = true;
  button.id = "mpiOwnerViewButton";
  button.style.cssText = "min-height:44px;border:1px solid #b89948;border-radius:14px;padding:8px 14px;background:#fff;color:#11186a;font:700 13px system-ui";
  document.querySelector(".topbar-actions, .top-actions")?.prepend(button);
  const style = document.createElement("style");
  // Safari otherwise gives the iframe a full viewport plus the toolbar height,
  // placing the app's fixed bottom navigation outside the visible preview.
  style.textContent = ".owner-view-dialog{position:fixed;inset:0;height:100%;height:100dvh;z-index:100001;display:grid;grid-template-rows:auto minmax(0,1fr);min-height:0;overflow:hidden;background:#f4f6fa}.owner-view-dialog[hidden]{display:none}.owner-view-toolbar{padding:calc(12px + env(safe-area-inset-top)) 16px 12px;background:#11186a;color:white;display:flex;gap:12px;align-items:center;flex-wrap:wrap}.owner-view-toolbar strong{margin-right:auto}.owner-view-toolbar select,.owner-view-toolbar button{min-height:44px;border-radius:10px;padding:8px 12px;font:600 14px system-ui;max-width:100%}.owner-view-toolbar p{width:100%;margin:0;font:13px system-ui;color:#e2e9fa}.owner-view-frame{display:block;width:100%;height:100%;min-height:0;min-width:0;border:0;background:#f4f6fa}.owner-view-toolbar label{display:grid;gap:4px;font:12px system-ui}";
  document.head.append(style);
  const dialog = document.createElement("section");
  dialog.className = "owner-view-dialog"; dialog.hidden = true;
  dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-label", "Read-only user preview");
  dialog.innerHTML = '<header class="owner-view-toolbar"><strong>VIEW AS USER · READ ONLY</strong><label>User<select id="ownerViewUser"></select></label><label>Screen<select id="ownerViewSurface"><option value="app">Inspector app</option><option value="office">Office dashboard</option></select></label><button type="button" id="ownerViewExit">Exit preview</button><p id="ownerViewStatus">Last-synced records. Actions are disabled. Your real account stays Kevin.</p></header><iframe class="owner-view-frame" title="Read-only user app preview" sandbox="allow-scripts"></iframe>';
  document.body.append(dialog);
  const selector = dialog.querySelector("#ownerViewUser"), surface = dialog.querySelector("#ownerViewSurface"), status = dialog.querySelector("#ownerViewStatus");
  let frame = dialog.querySelector("iframe");
  function authorized() {
    return Boolean(user?.uid && String(user.email || "").toLowerCase() === OWNER && profile?.active !== false && ["owner", "admin"].includes(profile?.role) && window.MPI_SHARED?.auth.currentUser?.uid === user.uid && String(window.MPI_SHARED.auth.currentUser.email || "").toLowerCase() === OWNER);
  }
  function exit() {
    generation += 1; dialog.hidden = true;
    frame.removeAttribute("srcdoc"); frame.removeAttribute("src");
    button.focus();
  }
  function teamPeople(records) {
    const active = records.filter(person => person.active !== false && !person.test && !person.subcontractorCurrent?.test && !/test|trial/i.test(String(person.email || "")));
    return active.filter(person => person.role !== "subcontractor" || !active.some(other => other.id !== person.id && other.role === "subcontractor" && other.sourceProfileId === person.id))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }
  // No credentials, notification tokens or private activation links enter the preview.
  function clean(value) {
    if (value?.toDate) return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !/token|password|secret|accessId|activation/i.test(key)).map(([key, item]) => [key, clean(item)]));
    return value;
  }
  function serialize(value) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
  function script(source) { return `<script>${source.replace(/<\/script/gi, "<\\/script")}<\/script>`; }
  async function getSources() {
    if (sources) return sources;
    const names = ["index.html", "admin.html", "mpi-app-theme.css", "mpi-office-workbench.css", "mpi-office-diagnostics.js", "mpi-shared.js", "mpi-planning.js", "mpi-equipment.js", "mpi-equipment-admin.js", "mpi-tool-bag.js", "mpi-field-sync.js", "mpi-subcontractor.js", "admin.js"];
    sources = Promise.all(names.map(async name => {
      const response = await fetch(new URL(name, location.href), { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("Preview files could not load.");
      return [name, await response.text()];
    })).then(Object.fromEntries).catch(error => { sources = null; throw error; });
    return sources;
  }
  // The opaque sandbox has only an in-memory Firebase-shaped read adapter. It has
  // no real SDK, real authentication, parent access, network, GPS or disk storage.
  function sandboxRuntime(seed) {
    const memory = new Map(Object.entries(seed.storage).map(([key, value]) => [key, JSON.stringify(value)]));
    const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key), clear: () => memory.clear(), key: index => [...memory.keys()][index] || null, get length() { return memory.size; } };
    Object.defineProperty(window, "localStorage", { value: storage });
    Object.defineProperty(window, "sessionStorage", { value: storage });
    const blocked = () => Promise.reject(new Error("Read-only preview: action unavailable."));
    window.fetch = blocked;
    window.open = () => null;
    // srcdoc has an opaque origin; app hash navigation must stay in that document.
    const navigateHash = (_, __, url) => { const hash = String(url || "").split("#")[1]; if (hash && location.hash !== `#${hash}`) location.hash = hash; };
    history.replaceState = navigateHash; history.pushState = navigateHash;
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (_, fail) => fail?.({ code: 1 }), watchPosition: () => 0, clearWatch() {} } });
    const registration = { update: async () => false, addEventListener() {}, showNotification: async () => false, active: null, waiting: null };
    Object.defineProperty(navigator, "serviceWorker", { value: { controller: null, ready: Promise.resolve(registration), register: async () => registration, getRegistration: async () => registration, getRegistrations: async () => [], addEventListener() {} } });
    const selected = seed.person;
    const fakeUser = { uid: selected.id, email: selected.email || "", displayName: selected.name, isAnonymous: selected.role === "subcontractor", getIdToken: blocked };
    const noop = () => Promise.resolve(false);
    const record = (id, value) => ({ id, exists: Boolean(value), data: () => value, metadata: { fromCache: true, hasPendingWrites: false }, ref: { path: `users/${id}` } });
    function values(path) {
      if (path === "users") return seed.people;
      if (path === "teamDirectory") return seed.people.map(person => ({ ...person, userId: person.id }));
      if (path === "teamPresence") return seed.people.map(person => ({ ...person, status: person.operationsCurrent?.liveStatus || person.subcontractorCurrent?.status || "NOT STARTED" }));
      if (path === "officeUpdates") return seed.updates;
      if (path === "fieldMessages") return seed.fieldMessages;
      if (path === "teamMessages") return seed.directMessages;
      if (path === "equipmentAssignments") return seed.assignments;
      if (path === "equipmentAcknowledgments") return seed.acknowledgments;
      return [];
    }
    function query(path, filters = []) {
      const result = () => {
        const docs = values(path).filter(item => filters.every(([field, op, value]) => op === "array-contains" ? item[field]?.includes(value) : op === "in" ? value.includes(item[field]) : item[field] === value)).map(item => record(item.id, item));
        return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: true, hasPendingWrites: false }, forEach: callback => docs.forEach(callback), docChanges: () => docs.map(doc => ({ type: "added", doc })) };
      };
      return { doc: id => {
        const item = values(path).find(value => value.id === id);
        return { id, path: `${path}/${id}`, get: async () => record(id, item), onSnapshot: callback => { queueMicrotask(() => callback(record(id, item))); return () => {}; }, set: blocked, update: blocked, delete: blocked, collection: name => query(`${path}/${id}/${name}`) };
      }, where: (field, op, value) => query(path, [...filters, [field, op, value]]), orderBy: () => query(path, filters), limit: () => query(path, filters), get: async () => result(), onSnapshot: (options, callback) => { if (typeof options === "function") callback = options; queueMicrotask(() => callback(result())); return () => {}; } };
    }
    const db = { collection: query, collectionGroup: query, enablePersistence: noop, runTransaction: blocked, batch: () => ({ set() {}, update() {}, delete() {}, commit: blocked }) };
    const auth = { currentUser: fakeUser, setPersistence: noop, onAuthStateChanged: callback => { queueMicrotask(() => callback(fakeUser)); return () => {}; }, signOut: blocked };
    const authFactory = () => auth; authFactory.Auth = { Persistence: { LOCAL: "local" } };
    const firestore = () => db; firestore.FieldValue = { serverTimestamp: () => new Date().toISOString(), arrayUnion: (...value) => value };
    window.firebase = { apps: [{}], app: () => ({ auth: authFactory, firestore }), initializeApp() {}, auth: authFactory, firestore };
    window.MPI_OWNER_PREVIEW = true;
    window.MPI_COMPANY_SESSION = { userId: selected.id, role: selected.role, active: true, inspectorName: selected.name, inspectorEmail: selected.email || "", inspectorId: selected.inspectorId || "", phone: selected.phone || "", assignedVehicle: selected.assignedVehicle || "", approvedEndAddress: selected.approvedEndAddress || "", nachiCredentialLevel: selected.nachiCredentialLevel || "", nachiCredentialStatus: selected.nachiCredentialStatus || "", nachiCredentialVerifiedAt: selected.nachiCredentialVerifiedAt || "", nachiCredentialVerifiedByName: selected.nachiCredentialVerifiedByName || "", trainingAssignments: Array.isArray(selected.trainingAssignments) ? selected.trainingAssignments.map(item => ({ ...item })) : [], adminCorrections: selected.adminCorrections || [], subcontractorOnly: selected.role === "subcontractor" };
    window.MPI_SPECTORA_SCHEDULE_DAYS = selected.spectoraScheduleDays || [];
    // Navigation is available; workflow mutations and external navigation are not.
    const canBrowse = target => target.closest("#adminBrandHome, #adminAccountPill, [data-connect-training-profile], [data-admin-view], [data-office-team-tab], [data-open-inspector], [data-open-office], [data-inbox-open-thread], [data-admin-inbox-kind], [data-close-admin-conversation], #fieldInboxThreadBack, [data-open-team-profile], [data-bag-guide], [data-bag-list], [data-bag-back], .app-bottom-nav a, a[href^='#'], [data-owner-preview-browse]");
    document.addEventListener("click", event => {
      const anchor = event.target.closest("a[href^='#']");
      if (anchor) { event.preventDefault(); location.hash = anchor.getAttribute("href"); }
      const action = event.target.closest("button,a,input[type=checkbox],input[type=radio]");
      if (action && !canBrowse(action)) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    document.addEventListener("submit", event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
    const disable = () => document.querySelectorAll("input,textarea,button").forEach(control => { if (!canBrowse(control)) { control.disabled = true; control.title = "Read-only preview"; } });
    document.addEventListener("DOMContentLoaded", () => {
      disable();
      new MutationObserver(disable).observe(document.body, { childList: true, subtree: true });
      document.querySelectorAll("#mpiAdminReturn,#officeConsoleCard,#mpiSettingsAdminLink,#adminOnboarding,#mpiAccessChoice").forEach(node => { node.hidden = true; });
    });
  }
  function seedFor(person) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" });
    const shared = window.MPI_SHARED;
    const days = [...(person.operationsDays || []), ...(person.operationsCurrent ? [person.operationsCurrent] : [])];
    const day = days.filter(item => item.date === today).reduce((current, item) => shared.mergeOperationsDay(current, item), {});
    const identity = { name: person.name, id: person.inspectorId || person.id, phone: person.phone || "", vehicle: person.assignedVehicle || "", approvedEndAddress: person.approvedEndAddress || "" };
    const jobs = day.jobs || [];
    const storage = {
      mpiWorkflowProfileV1: identity,
      mpiWorkflowActivityV1: days.flatMap(item => (item.activity || []).map(event => ({ ...event, date: item.date }))),
      mpiWorkflowTimeClockV1: day.timeClock ? { ...day.timeClock, date: today, inspector: person.name, inspectorId: identity.id } : null,
      mpiDailyReadinessV1: day.readiness ? { ...day.readiness, date: today, completed: true } : null,
      mpiWorkflowDayCompleteV1: day.dayComplete || null,
      mpiWorkflowNachiTrainingV1: day.nachiTraining || null,
      mpiWorkflowLabStopV1: day.labStop || null,
      mpiWorkflowCompletedJobsV1: jobs.filter(job => job.status === "completed").map(job => ({ date: today, ids: [job.id, job.id?.replace(/^spectora:/, "")].filter(Boolean), completedAt: job.completedAt || day.dayComplete?.completedAt || new Date().toISOString() })),
      mpiTodayJobsCacheV1: { date: today, source: "spectora-read-only", calendarName: "Spectora · read only", jobs: jobs.map(job => ({ ...job, location: job.property, summary: job.property, start: { dateTime: job.scheduledStart }, end: { dateTime: job.scheduledEnd }, serviceNames: job.services || [] })) }
    };
    storage[`mpiSubcontractorDayV1:${person.id}:live`] = person.subcontractorCurrent || null;
    return clean({ person, people: data.people, storage, assignments: data.assignments || [], acknowledgments: data.acknowledgments || [], updates: data.updates || [], fieldMessages: ["owner", "admin"].includes(person.role) ? data.fieldMessages || [] : (data.fieldMessages || []).filter(message => message.senderUid === person.id), directMessages: (data.directMessages || []).filter(message => message.participantIds?.includes(person.id)) });
  }
  function buildDocument(page, seed, files) {
    const parsed = new DOMParser().parseFromString(files[page === "office" ? "admin.html" : "index.html"], "text/html");
    const inline = [...parsed.querySelectorAll("script:not([src])")].map(node => node.textContent);
    parsed.querySelectorAll("script,link[rel=manifest],meta[http-equiv='Content-Security-Policy']").forEach(node => node.remove());
    // The preview uses the same theme without permitting network access inside
    // its opaque read-only sandbox.
    parsed.querySelectorAll('link[href*="mpi-app-theme.css"],link[href*="mpi-office-workbench.css"]').forEach(node => node.remove());
    const theme = parsed.createElement("style"); theme.textContent = files["mpi-app-theme.css"] + (page === "office" ? files["mpi-office-workbench.css"] : "");
    parsed.head.append(theme);
    const base = parsed.createElement("base"); base.href = new URL("./", location.href).href; parsed.head.prepend(base);
    const csp = parsed.createElement("meta"); csp.httpEquiv = "Content-Security-Policy";
    csp.content = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: https: capacitor:; connect-src 'none'; frame-src 'none'; form-action 'none'; font-src data:; worker-src 'none'"; parsed.head.prepend(csp);
    parsed.body.insertAdjacentHTML("afterbegin", script(`(${sandboxRuntime.toString()})(${serialize(seed)});`) + script(files["mpi-shared.js"]) + script(`window.MPI_SHARED.watchSession = callback => { queueMicrotask(() => callback({ user: window.MPI_SHARED.auth.currentUser, profile: ${serialize(seed.person)}, error: null })); return () => {}; }; window.MPI_SHARED.requestSpectoraScheduleRefresh = async () => false; window.MPI_SHARED.watchDirectMessages = (_, callback) => { queueMicrotask(() => callback(${serialize(seed.directMessages)}, null)); return () => {}; }; window.MPI_SHARED.watchUpdates = (_, __, callback) => { queueMicrotask(() => callback(${serialize(seed.updates.filter(update => update.audience === "all" || update.targetUid === seed.person.id))})); return () => {}; };`));
    const js = [files["mpi-equipment.js"], files["mpi-planning.js"], ...(page === "office" ? [files["mpi-office-diagnostics.js"]] : [files["mpi-tool-bag.js"]]), ...inline, files[page === "office" ? "admin.js" : "mpi-field-sync.js"]];
    if (page === "office") js.push(files["mpi-equipment-admin.js"]);
    if (page !== "office" && seed.person.role === "subcontractor") js.push(files["mpi-subcontractor.js"]);
    parsed.body.insertAdjacentHTML("beforeend", js.map(script).join(""));
    return "<!doctype html>" + parsed.documentElement.outerHTML;
  }
  async function render() {
    if (!authorized() || dialog.hidden) return;
    const person = teamPeople(data?.people || []).find(item => item.id === selector.value);
    if (!person) return;
    const canOffice = ["owner", "admin"].includes(person.role);
    surface.querySelector("option[value=office]").disabled = !canOffice;
    if (!canOffice) surface.value = "app";
    const request = ++generation;
    status.textContent = `Loading ${person.name}…`;
    try {
      const files = await getSources();
      if (request !== generation || !authorized() || dialog.hidden) return;
      // Destroy the previous preview's timers/listeners before changing users.
      // A fresh opaque frame also avoids overlapping in-flight navigations.
      const nextFrame = frame.cloneNode(false);
      nextFrame.removeAttribute("src"); nextFrame.srcdoc = buildDocument(surface.value, seedFor(person), files);
      frame.replaceWith(nextFrame); frame = nextFrame;
      status.textContent = `${person.name} · ${person.role === "subcontractor" ? "Subcontractor" : person.role === "inspector" ? "Inspector" : "Office"} · last-synced data. No changes, sends, receipt updates or GPS. Private conversations not shared with you are unavailable.`;
    } catch (error) { status.textContent = error.message || "Preview unavailable. Exit and try again."; }
  }
  async function open() {
    if (!authorized() || loading) return;
    loading = true;
    try {
      if (!data?.people?.length) {
        let timeout;
        const snapshot = await Promise.race([
          window.MPI_SHARED.db.collection("users").orderBy("name").get(),
          new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Preview connection timed out.")), 12000); })
        ]).finally(() => clearTimeout(timeout));
        if (!authorized()) return;
        data = { people: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
      }
      selector.replaceChildren(...teamPeople(data.people).map(person => {
        const option = document.createElement("option"); option.value = person.id; option.textContent = `${/^corey/i.test(person.name) ? person.name.replace(/^corey/i, "Cory") : person.name} · ${person.role === "subcontractor" ? "Subcontractor" : person.role === "inspector" ? "Inspector" : "Office"}`; return option;
      }));
      selector.value = teamPeople(data.people).some(person => person.id === user.uid) ? user.uid : selector.options[0]?.value || "";
      surface.value = document.getElementById("adminDashboard") ? "office" : "app";
      dialog.hidden = false;
      render();
    } catch (_) { button.textContent = "Preview unavailable — retry"; } finally { loading = false; }
  }
  button.addEventListener("click", open); selector.addEventListener("change", render); surface.addEventListener("change", render);
  dialog.querySelector("#ownerViewExit").addEventListener("click", exit);
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !dialog.hidden) exit(); });
  window.MPI_OWNER_VIEW = Object.freeze({
    setContext(nextUser, nextProfile) { user = nextUser; profile = nextProfile; button.hidden = !authorized(); if (!authorized()) { data = null; exit(); } },
    setData(nextData) { if (authorized()) data = { ...data, ...nextData }; },
    setEquipmentData(nextData) { if (authorized()) data = { ...data, ...nextData }; }
  });
})();
