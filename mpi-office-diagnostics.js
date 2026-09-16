/* On-demand office checks. Reuse shared messaging diagnostics; never send a
   test message, modify workflow records, clear storage, or add a polling loop. */
(() => {
  const button = document.getElementById("adminRunSelfDiagnosis");
  const output = document.getElementById("adminSelfDiagnosisResult");
  if (!button || !output) return;
  let user, profile, identity = "", revision = 0, running = false;
  const shared = () => window.MPI_SHARED;
  const authorized = () => Boolean(user?.uid && profile?.active !== false
    && shared()?.auth?.currentUser?.uid === user.uid && shared()?.isAdminRole?.(profile));
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  function setContext(nextUser, nextProfile) {
    user = nextUser; profile = nextProfile;
    const nextIdentity = `${user?.uid || ""}:${profile?.role || ""}:${profile?.active !== false}`;
    if (identity !== nextIdentity) {
      identity = nextIdentity; revision++;
      output.hidden = true; output.innerHTML = "";
    }
    button.disabled = running || !authorized() || Boolean(window.MPI_OWNER_PREVIEW);
  }
  function bounded(task, milliseconds) {
    let timer;
    return Promise.race([task, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("check-timeout")), milliseconds); })]).finally(() => clearTimeout(timer));
  }
  async function run() {
    if (running || !authorized() || window.MPI_OWNER_PREVIEW) return;
    const startedRevision = revision;
    const stillCurrent = () => startedRevision === revision && authorized();
    running = true; button.disabled = true; button.textContent = "Checking…";
    output.hidden = false; output.textContent = "Checking this device. Your saved work remains unchanged.";
    const checks = [];
    const add = (name, state, detail) => checks.push({ name, state, detail });
    try {
      add("Office sign-in", "passed", "This account has office access.");
      const online = navigator.onLine !== false;
      const notice = document.getElementById("adminSyncNotice");
      const delayed = Boolean(shared()?.syncCoolingDown?.(user.uid) || (notice && !notice.hidden));
      if (!online) add("Connection and app version", "deferred", "This device is offline. Saved work is retained; server checks were skipped.");
      else {
        const controller = new AbortController();
        try {
          const response = await bounded(fetch(`./version.json?diagnostic=${Date.now()}`, { cache: "no-store", signal: controller.signal }), 8000);
          if (!response.ok) throw new Error("version-unavailable");
          const version = await bounded(response.json(), 3000);
          const installed = Number(document.querySelector('meta[name="app-build"]')?.content);
          if (!Number.isInteger(version.build) || version.build < 1) throw new Error("invalid-version");
          add("Connection and app version", version.build > installed ? "attention" : "passed",
            window.MPI_NATIVE?.isNative ? `Bundled app files are available (Build ${version.build}). Messaging checks server access separately.`
              : version.build > installed ? `Build ${version.build} is available. Load the update after finishing unsent work.` : `App files are reachable. Build ${installed || version.build}.`);
        } catch (_) { add("Connection and app version", "attention", "App version could not be checked. Wi-Fi alone does not confirm access to every service."); }
        finally { controller.abort(); }
      }
      if (!stillCurrent()) return;
      if (!online || delayed) add("Private messaging", "deferred", delayed ? "Server updates are delayed. Extra messaging requests were skipped to protect usage; saved messages remain intact." : "Messaging server checks will be available when this device reconnects.");
      else if (!shared()?.messagingHealth) add("Private messaging", "attention", "The shared messaging service is unavailable. Reload after saving unsent work.");
      else {
        try {
          const health = await bounded(shared().messagingHealth(), 31000);
          if (!stillCurrent()) return;
          const healthy = health?.status === "healthy" && health?.authentication === "verified" && health?.backend === "connected";
          add("Private messaging", healthy ? "passed" : "attention", healthy ? "Account and messaging connection verified. No test message was sent."
            : health?.pending ? `${health.pending} saved message(s) are still waiting to send. Do not retype or delete them.` : `Messaging could not be verified.${health?.referenceId ? ` Diagnostic reference: ${health.referenceId}.` : ""}`);
        } catch (_) { add("Private messaging", "attention", "Messaging did not respond in time. Saved messages have not been cleared."); }
      }
      if (!stillCurrent()) return;
      try {
        const permission = window.MPI_NATIVE?.isNative ? (await bounded(window.MPI_NATIVE.pushPermission(), 5000))?.receive : window.Notification?.permission || "unavailable";
        add("Notifications", permission === "granted" ? "passed" : "attention", permission === "granted" ? "Permission is enabled on this device. Actual alert delivery was not tested." : "Use Enable office alerts below, or check this app’s notification permissions in device settings.");
      } catch (_) { add("Notifications", "attention", "Notification permission could not be checked on this device."); }
      add("Synchronization", online && !delayed ? "passed" : "deferred", delayed ? "Updates are delayed. Current dashboard values may be last-known data; existing recovery remains in place." : online ? "No service-recovery hold is reported. This check does not verify every inspector’s upload." : "Offline work is preserved until reconnection.");
      try { localStorage.getItem("mpiMessagingDiagnosticsV1"); add("Saved data access", "passed", "Existing local storage can be read. No records were changed or cleared."); }
      catch (_) { add("Saved data access", "attention", "This browser is blocking local storage access. Keep unsent work safe before changing browser settings."); }
      if (!stillCurrent()) return;
      const incomplete = checks.some(check => check.state !== "passed");
      output.innerHTML = `<h3>${incomplete ? "Check complete — review the items below" : "Device checks complete"}</h3><p>Checked ${escape(new Date().toLocaleString())}. This is a device check, not a full test of Comment Builder, payroll or every field device.</p><ul class="office-diagnosis-list">${checks.map(check => `<li><strong>${escape(check.name)}</strong><span class="office-check-status" data-state="${check.state}">${({ passed: "Checked", attention: "Attention", deferred: "Deferred" })[check.state]}</span><p>${escape(check.detail)}</p></li>`).join("")}</ul>`;
    } catch (_) {
      if (stillCurrent()) output.textContent = "This device check could not finish. Your recorded work is unchanged; try the check again or review diagnostic history below.";
    } finally {
      running = false; button.textContent = "Run self-diagnosis again";
      button.disabled = !authorized() || Boolean(window.MPI_OWNER_PREVIEW);
    }
  }
  button.addEventListener("click", run);
  window.MPI_OFFICE_DIAGNOSTICS = { setContext };
  setContext(null, null);
})();
