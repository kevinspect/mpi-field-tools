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
  const profileCard = document.getElementById("mpiProfileCard");
  const profileMount = document.getElementById("mpiProfileMount");
  const profileForm = document.getElementById("mpiProfileForm");
  const profileStatus = document.getElementById("mpiProfileStatus");
  const profileAvatar = document.getElementById("mpiProfileAvatar");
  const profileInitials = document.getElementById("mpiProfileInitials");
  const topProfileLink = document.getElementById("topProfileLink");
  const topProfileAvatar = document.getElementById("topProfileAvatar");
  const topProfileInitials = document.getElementById("topProfileInitials");
  const profilePhotoInput = document.getElementById("mpiProfilePhotoInput");
  const profilePhotoRemove = document.getElementById("mpiProfilePhotoRemove");
  const profileName = document.getElementById("mpiProfileName");
  const profileJobTitle = document.getElementById("mpiProfileJobTitle");
  const profilePhone = document.getElementById("mpiProfilePhone");
  const profileInspectorId = document.getElementById("mpiProfileInspectorId");
  const profileVehicle = document.getElementById("mpiProfileVehicle");
  const profilePersonalAddress = document.getElementById("mpiProfilePersonalAddress");
  const profileEmergencyName = document.getElementById("mpiProfileEmergencyName");
  const profileEmergencyPhone = document.getElementById("mpiProfileEmergencyPhone");
  const profileTranscriptUrl = document.getElementById("mpiProfileTranscriptUrl");
  const profileRole = document.getElementById("mpiProfileRole");
  const profileEmail = document.getElementById("mpiProfileEmail");
  const profileSave = document.getElementById("mpiProfileSave");
  const trainingMemberNumber = document.getElementById("trainingMemberNumber");
  const trainingOfficialStatus = document.getElementById("trainingOfficialStatus");
  const trainingOfficialCredentials = document.getElementById("trainingOfficialCredentials");
  const trainingTranscriptLink = document.getElementById("trainingTranscriptLink");
  const signInButtons = [...document.querySelectorAll("[data-mpi-sign-in]")];
  const signOutButtons = [...document.querySelectorAll("[data-mpi-sign-out]")];
  const accessChoice = document.getElementById("mpiAccessChoice");
  const accessRoleOptions = document.getElementById("mpiAccessRoleOptions");
  const accessInvitationForm = document.getElementById("mpiAccessInvitationForm");
  const accessInvitationInput = document.getElementById("mpiAccessInvitationInput");
  const accessChoiceStatus = document.getElementById("mpiAccessChoiceStatus");
  const employeeAccessChoice = document.getElementById("mpiEmployeeAccessChoice");
  const subcontractorAccessChoice = document.getElementById("mpiSubcontractorAccessChoice");
  const accessChoiceBack = document.getElementById("mpiAccessChoiceBack");
  const updatesGate = document.getElementById("mpiUpdatesGate");
  const updatesContent = document.getElementById("mpiUpdatesContent");
  const updatesList = document.getElementById("mpiUpdatesList");
  const updatesSummary = document.getElementById("mpiUpdatesSummary");
  const teamStatusCard = document.getElementById("workflowTeamStatusCard");
  const teamStatusList = document.getElementById("workflowTeamStatusList");
  const teamStatusUpdated = document.getElementById("workflowTeamStatusUpdated");
  const OFFICE_TEAM = Object.freeze([
    { id: "office:adrienne", name: "Adrienne Cave", email: "adrienne@michiganpropertyinspections.com", role: "admin", status: "OFFICE" },
    { id: "office:brooke", name: "Brooke", email: "admin@michiganpropertyinspections.com", role: "admin", status: "OFFICE" }
  ]);
  let currentUser = null;
  let currentProfile = null;
  let currentUpdates = [];
  let unsubscribeUpdates = null;
  let unsubscribeTeamPresence = null;
  let unsubscribeProfile = null;
  let profileWatchUserId = "";
  let registeredPushToken = "";
  let pendingProfilePhoto = null;
  let lastPublishedSessionSignature = "";
  let lastPublishedSpectoraSignature = "";
  let liveLocationInterval = 0;
  let spectoraRefreshInterval = 0;

  if (profileMount && profileCard) profileMount.appendChild(profileCard);
  let liveLocationWatchId = null;
  let liveLocationInFlight = false;
  let lastLiveLocationAttemptAt = 0;
  let lastLiveLocationRequestId = "";
  let lastObservedLivePosition = null;
  let nativeLocationListener = null;
  let nativeResumeListener = null;
  let nativeLocationContextSignature = "";
  let nativeLocationSyncInFlight = false;
  const NOTIFIED_UPDATE_STORAGE_KEY = "mpiNotifiedOfficeUpdatesV2";
  const ACCESS_PATH_STORAGE_KEY = "mpiSecureAccessPathV1";
  const LIVE_LOCATION_INTERVAL_MS = 3 * 60 * 1000;

  function installedAppExperience() {
    return Boolean(window.MPI_NATIVE?.isNative
      || window.navigator.standalone
      || window.matchMedia?.("(display-mode: standalone)")?.matches);
  }

  function requestedSubcontractorAccess() {
    const parameters = new URLSearchParams(window.location.search);
    return Boolean(String(parameters.get("subcontractor") || "").trim());
  }

  function savedAccessPath() {
    try { return String(localStorage.getItem(ACCESS_PATH_STORAGE_KEY) || ""); }
    catch (_) { return ""; }
  }

  function saveAccessPath(value) {
    try { localStorage.setItem(ACCESS_PATH_STORAGE_KEY, value); }
    catch (_) {}
  }

  function setAccessChoiceVisible(visible) {
    if (!accessChoice) return;
    accessChoice.hidden = !visible;
    document.body.classList.toggle("mpi-access-choice-open", visible);
  }

  function showAccessRoleOptions() {
    if (accessRoleOptions) accessRoleOptions.hidden = false;
    if (accessInvitationForm) accessInvitationForm.hidden = true;
    if (accessChoiceStatus) accessChoiceStatus.textContent = "";
  }

  function synchronizeAccessChoice(user, profile) {
    if (!accessChoice) return;
    if (user && profile) {
      saveAccessPath(String(profile.role || "").toLowerCase() === "subcontractor" || profile.subcontractorOnly === true ? "subcontractor" : "employee");
      setAccessChoiceVisible(false);
      return;
    }
    if (requestedSubcontractorAccess()) {
      setAccessChoiceVisible(false);
      return;
    }
    const shouldChoose = installedAppExperience() && savedAccessPath() !== "employee";
    showAccessRoleOptions();
    setAccessChoiceVisible(shouldChoose);
  }

  function subcontractorInvitation(value) {
    const supplied = String(value || "").trim();
    if (!supplied) throw new Error("Paste the complete private link supplied by MPI Office.");
    let invitation;
    try { invitation = new URL(supplied); }
    catch (_) { throw new Error("That is not a complete MPI activation link."); }
    const trustedWebLink = invitation.protocol === "https:"
      && (invitation.hostname === "kevinspect.github.io" || invitation.origin === window.location.origin)
      && /\/mpi-field-tools\/?$/i.test(invitation.pathname);
    const trustedAppLink = invitation.protocol === "mpifieldtools:" && invitation.hostname === "activate";
    if (!trustedWebLink && !trustedAppLink) throw new Error("Use only the private activation link supplied by MPI Office.");
    const subcontractor = String(invitation.searchParams.get("subcontractor") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    const access = String(invitation.searchParams.get("access") || "").trim();
    if (!subcontractor || !/^[A-Za-z0-9_-]{32,120}$/.test(access)) throw new Error("That invitation is incomplete. Ask MPI Office for a replacement link.");
    return { subcontractor, access };
  }

  function activatePastedSubcontractorInvitation(event) {
    event.preventDefault();
    try {
      const invitation = subcontractorInvitation(accessInvitationInput?.value);
      if (accessChoiceStatus) accessChoiceStatus.textContent = "Opening secure activation…";
      const destination = new URL(window.location.href);
      destination.search = "";
      destination.searchParams.set("subcontractor", invitation.subcontractor);
      destination.searchParams.set("access", invitation.access);
      destination.hash = "#subcontractor-home";
      window.location.replace(destination.toString());
    } catch (error) {
      if (accessChoiceStatus) accessChoiceStatus.textContent = error?.message || "That activation link could not be opened.";
    }
  }

  function chooseEmployeeAccess() {
    saveAccessPath("employee");
    setAccessChoiceVisible(false);
    window.location.hash = "#settings";
    signIn(employeeAccessChoice);
  }

  function chooseSubcontractorAccess() {
    if (accessRoleOptions) accessRoleOptions.hidden = true;
    if (accessInvitationForm) accessInvitationForm.hidden = false;
    if (accessChoiceStatus) accessChoiceStatus.textContent = "";
    window.setTimeout(() => accessInvitationInput?.focus(), 50);
  }

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
          data: { url: String(currentProfile?.role || "").toLowerCase() === "subcontractor" ? "./?subcontractor=jason#subcontractor-home" : "./#team-messages" }
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

  document.addEventListener("click", event => {
    const webLink = event.target.closest("a[data-native-browser], a[href*='nachi.org']");
    if (webLink && window.MPI_NATIVE?.isNative) {
      event.preventDefault();
      window.MPI_NATIVE.openWebPage(webLink.href).catch(() => { window.location.assign(webLink.href); });
      return;
    }
    const recipient = event.target.closest("[data-team-message-recipient]")?.dataset.teamMessageRecipient;
    if (!recipient) return;
    window.setTimeout(() => {
      const message = document.getElementById("teamQuestionText");
      if (message && !message.value.trim()) message.value = `For ${recipient}: `;
      message?.focus();
    }, 120);
  });

  [officeConsoleCard, settingsAdminLink].forEach(link => link?.addEventListener("click", event => {
    if (!window.MPI_NATIVE?.isNative) return;
    event.preventDefault();
    window.location.assign("./admin.html");
  }));

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
      "CLOCKED OUT": "Clocked out",
      OFFICE: "Office"
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

  function activeLiveLocationState(profile = currentProfile) {
    const role = String(profile?.role || "").toLowerCase();
    if (!profile || profile.active === false || !["owner", "inspector", "subcontractor"].includes(role)) return null;
    const today = localDateKey();
    const operation = profile.operationsCurrent;
    if (operation?.date === today) {
      const status = String(operation.liveStatus || "NOT STARTED").toUpperCase();
      if (!["NOT STARTED", "CLOCKED OUT"].includes(status)) return { status, date: today };
    }
    if (role === "subcontractor") {
      const record = profile.subcontractorCurrent || profile.subcontractorTestCurrent;
      const status = String(record?.status || "").toUpperCase();
      const recordDate = String(record?.date || record?.updatedAtClient || "").slice(0, 10);
      if (recordDate === today && status && !/AVAILABLE|NO CURRENT JOB|CLOCKED OUT/.test(status)) return { status, date: today };
    }
    return null;
  }

  function browserLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Location is unavailable on this device."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: options.timeout || 15000,
        maximumAge: options.maximumAge ?? 60000
      });
    });
  }

  function liveLocationValue(position, state, reason, requestId) {
    const recordedAtClient = new Date().toISOString();
    return {
      latitude: Number(position.coords.latitude.toFixed(7)),
      longitude: Number(position.coords.longitude.toFixed(7)),
      accuracyFeet: Math.max(0, Math.round(Number(position.coords.accuracy || 0) * 3.28084)),
      heading: Number.isFinite(Number(position.coords.heading)) ? Math.round(Number(position.coords.heading)) : null,
      speedMph: Number.isFinite(Number(position.coords.speed)) ? Number((Number(position.coords.speed) * 2.23694).toFixed(1)) : null,
      recordedAtClient,
      workStatus: state.status,
      workDate: state.date,
      source: reason,
      requestId: String(requestId || "").slice(0, 100),
      nativePointId: String(position.nativeId || "").slice(0, 100),
      status: "recorded"
    };
  }

  async function storeRoutePoint(location) {
    if (!currentUser || !location?.workDate) return false;
    const nativePointId = String(location.nativePointId || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 100);
    const pointId = nativePointId ? `native-${nativePointId}` : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const point = {
      userId: currentUser.uid,
      date: location.workDate,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyFeet: location.accuracyFeet,
      heading: location.heading,
      speedMph: location.speedMph,
      recordedAtClient: location.recordedAtClient,
      workStatus: location.workStatus,
      source: location.source,
      nativePointId,
      recordedAt: shared.serverTimestamp()
    };
    await shared.db.collection("users").doc(currentUser.uid).collection("locationRouteDays").doc(location.workDate).collection("points").doc(pointId).set(point);
    return true;
  }

  async function publishLiveLocation(reason = "automatic", requestId = "", suppliedPosition = null) {
    const nativeContext = suppliedPosition?.nativeContext;
    const nativeState = nativeContext?.workDate && (!nativeContext.userId || nativeContext.userId === currentUser?.uid)
      ? { status: nativeContext.workStatus || "ACTIVE WORKDAY", date: nativeContext.workDate }
      : null;
    const state = nativeState || activeLiveLocationState();
    if (!currentUser || !currentProfile || !state || liveLocationInFlight || !navigator.onLine) return false;
    const now = Date.now();
    if (reason === "automatic" && now - lastLiveLocationAttemptAt < LIVE_LOCATION_INTERVAL_MS - 15000) return false;
    liveLocationInFlight = true;
    lastLiveLocationAttemptAt = now;
    try {
      const observedPosition = reason === "automatic" && lastObservedLivePosition && Date.now() - Number(lastObservedLivePosition.timestamp || 0) <= 90000
        ? lastObservedLivePosition
        : null;
      const position = suppliedPosition || observedPosition || await browserLocation({ maximumAge: reason === "office-request" ? 0 : 60000 });
      const location = liveLocationValue(position, state, reason, requestId);
      await shared.db.collection("users").doc(currentUser.uid).set({
        liveLocation: location,
        liveLocationStatus: { status: "recorded", recordedAtClient: location.recordedAtClient, requestId: location.requestId },
        liveLocationUpdatedAt: shared.serverTimestamp()
      }, { merge: true });
      const routeStored = await storeRoutePoint(location).catch(() => false);
      if (suppliedPosition?.nativeId && routeStored) {
        await window.MPI_NATIVE?.acknowledgeLocations?.([suppliedPosition.nativeId]).catch(() => false);
      }
      return suppliedPosition?.nativeId ? routeStored : true;
    } catch (error) {
      const status = Number(error?.code) === 1 ? "permission-denied" : Number(error?.code) === 3 ? "timed-out" : "unavailable";
      await shared.db.collection("users").doc(currentUser.uid).set({
        liveLocationStatus: {
          status,
          recordedAtClient: new Date().toISOString(),
          requestId: String(requestId || "").slice(0, 100)
        },
        liveLocationUpdatedAt: shared.serverTimestamp()
      }, { merge: true }).catch(() => false);
      return false;
    } finally {
      liveLocationInFlight = false;
    }
  }

  function handleLiveLocationRequest(profile = currentProfile) {
    const requestId = String(profile?.liveLocationRequest?.id || "");
    if (!requestId || requestId === lastLiveLocationRequestId) return;
    if (!activeLiveLocationState(profile) || !navigator.onLine) return;
    lastLiveLocationRequestId = requestId;
    publishLiveLocation("office-request", requestId, null).then(success => {
      if (!success && lastLiveLocationRequestId === requestId) lastLiveLocationRequestId = "";
    }).catch(() => {
      if (lastLiveLocationRequestId === requestId) lastLiveLocationRequestId = "";
    });
  }

  function stopLiveLocationSharing() {
    if (liveLocationInterval) window.clearInterval(liveLocationInterval);
    liveLocationInterval = 0;
    if (liveLocationWatchId !== null && navigator.geolocation?.clearWatch) navigator.geolocation.clearWatch(liveLocationWatchId);
    liveLocationWatchId = null;
    lastObservedLivePosition = null;
    liveLocationInFlight = false;
    nativeLocationContextSignature = "";
    window.MPI_NATIVE?.stopWorkdayLocation?.().catch(() => false);
  }

  async function flushNativeLocations() {
    if (!window.MPI_NATIVE?.isNative || nativeLocationSyncInFlight || !currentUser || !navigator.onLine) return false;
    nativeLocationSyncInFlight = true;
    try {
      const points = await window.MPI_NATIVE.pendingLocations();
      let synced = false;
      for (const point of points.slice(0, 120)) {
        if (point.nativeContext?.userId && point.nativeContext.userId !== currentUser.uid) continue;
        const result = await publishLiveLocation("native-background", "", point);
        synced = result || synced;
        if (!result) break;
      }
      return synced;
    } catch (_) {
      return false;
    } finally {
      nativeLocationSyncInFlight = false;
    }
  }

  async function ensureNativeLocationSharing(state) {
    if (!window.MPI_NATIVE?.isNative || !currentUser || !state) return false;
    if (!nativeLocationListener) {
      nativeLocationListener = await window.MPI_NATIVE.addLocationListener(position => {
        lastObservedLivePosition = position;
        if (navigator.onLine && Date.now() - lastLiveLocationAttemptAt >= LIVE_LOCATION_INTERVAL_MS - 15000) {
          publishLiveLocation("native-background", "", position).catch(() => false);
        }
      });
    }
    if (!nativeResumeListener) {
      nativeResumeListener = await window.MPI_NATIVE.addResumeListener(() => flushNativeLocations().catch(() => false));
    }
    const context = { userId: currentUser.uid, workDate: state.date, workStatus: state.status };
    const signature = `${context.userId}:${context.workDate}:${context.workStatus}`;
    if (!nativeLocationContextSignature) {
      await window.MPI_NATIVE.startWorkdayLocation(context);
    } else if (nativeLocationContextSignature !== signature) {
      await window.MPI_NATIVE.updateWorkdayLocationContext(context);
    }
    nativeLocationContextSignature = signature;
    await flushNativeLocations();
    return true;
  }

  function ensureLiveLocationWatch() {
    if (!activeLiveLocationState() || liveLocationWatchId !== null || !navigator.geolocation?.watchPosition) return;
    liveLocationWatchId = navigator.geolocation.watchPosition(position => {
      lastObservedLivePosition = position;
      if (Date.now() - lastLiveLocationAttemptAt >= LIVE_LOCATION_INTERVAL_MS - 15000) {
        publishLiveLocation("automatic", "", position).catch(() => false);
      }
    }, () => {}, { enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 });
  }

  function syncLiveLocationSharing() {
    const state = activeLiveLocationState();
    if (state && window.MPI_NATIVE?.isNative) {
      ensureNativeLocationSharing(state).catch(() => false);
      if (liveLocationWatchId !== null && navigator.geolocation?.clearWatch) navigator.geolocation.clearWatch(liveLocationWatchId);
      liveLocationWatchId = null;
      return;
    }
    if (state) ensureLiveLocationWatch();
    else if (liveLocationWatchId !== null && navigator.geolocation?.clearWatch) {
      navigator.geolocation.clearWatch(liveLocationWatchId);
      liveLocationWatchId = null;
      lastObservedLivePosition = null;
    }
    if (!state && nativeLocationContextSignature) {
      nativeLocationContextSignature = "";
      window.MPI_NATIVE?.stopWorkdayLocation?.().catch(() => false);
    }
  }

  function startLiveLocationSharing() {
    if (!currentUser || !currentProfile) {
      stopLiveLocationSharing();
      return;
    }
    syncLiveLocationSharing();
    if (!liveLocationInterval) {
      window.setTimeout(() => {
        if (window.MPI_NATIVE?.isNative) flushNativeLocations().catch(() => false);
        else publishLiveLocation("automatic").catch(() => false);
      }, 1200);
      liveLocationInterval = window.setInterval(() => {
        if (window.MPI_NATIVE?.isNative) flushNativeLocations().catch(() => false);
        else publishLiveLocation("automatic").catch(() => false);
      }, LIVE_LOCATION_INTERVAL_MS);
    }
    handleLiveLocationRequest(currentProfile);
  }

  function teamInitials(name) {
    return String(name || "MPI").trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase() || "MPI";
  }

  function profilePhotoSource(profile = currentProfile, user = currentUser) {
    return String(profile?.profilePhoto || profile?.photoURL || user?.photoURL || "").trim();
  }

  function showProfilePhoto(source, name) {
    [[profileAvatar, profileInitials], [topProfileAvatar, topProfileInitials]].forEach(([avatar, initials]) => {
      if (!avatar || !initials) return;
      avatar.querySelector("img")?.remove();
      initials.textContent = teamInitials(name);
      initials.hidden = Boolean(source);
      if (!source) return;
      const image = document.createElement("img");
      image.alt = "";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => { image.remove(); initials.hidden = false; }, { once: true });
      image.src = source;
      avatar.prepend(image);
    });
  }

  function verifiedInterNachiCredentials(displayName) {
    return String(displayName || "").split(",").map(value => value.trim()).filter(Boolean).slice(1);
  }

  async function renderOfficialInterNachiRecord(profile) {
    if (!trainingOfficialStatus || !trainingOfficialCredentials) return;
    const inspectorId = String(profile?.inspectorId || "").trim().toUpperCase();
    trainingOfficialCredentials.innerHTML = "";
    if (!/^NACHI\d{8}$/.test(inspectorId)) {
      trainingOfficialStatus.textContent = "Add your InterNACHI member number in My Profile to verify your public credentials.";
      return;
    }
    const cacheKey = `mpiInterNachiVerification:${inspectorId}`;
    let payload = null;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached?.savedAt && Date.now() - Number(cached.savedAt) < 12 * 60 * 60 * 1000) payload = cached.payload;
    } catch (_) {}
    try {
      if (!payload) {
        trainingOfficialStatus.textContent = "Checking your official InterNACHI record…";
        const response = await fetch(`https://www.nachi.org/api/verify?public_id=${encodeURIComponent(inspectorId)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Verification unavailable (${response.status})`);
        const result = await response.json();
        if (!result?.ok || !result?.data) throw new Error("InterNACHI did not return a verified record.");
        payload = result.data;
        try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), payload })); } catch (_) {}
      }
      const credentials = verifiedInterNachiCredentials(payload.display_name);
      trainingOfficialStatus.textContent = payload.is_certified
        ? `Verified by InterNACHI · ${payload.display_name || inspectorId}`
        : "InterNACHI record found · certification is not currently shown as active";
      trainingOfficialCredentials.innerHTML = (credentials.length ? credentials : [payload.is_certified ? "Certified Professional Inspector" : "Member record"])
        .map(value => `<span>${escapeHtml(value)}</span>`).join("");
    } catch (error) {
      trainingOfficialStatus.textContent = error?.message || "The official InterNACHI record could not be checked right now.";
    }
  }

  function roleLabel(profile) {
    return ({ owner: "Owner", admin: "Office Admin", inspector: "Inspector", subcontractor: "Subcontractor" })[String(profile?.role || "inspector").toLowerCase()] || "Inspector";
  }

  function companySessionDetail(user = currentUser, profile = currentProfile) {
    if (!user || !profile) return null;
    return {
      userId: user.uid,
      role: profile.role || "inspector",
      active: profile.active !== false,
      subcontractorOnly: profile.subcontractorOnly === true,
      subcontractorKey: String(profile.subcontractorKey || "").trim(),
      subcontractorAccessId: String(profile.subcontractorAccessId || "").trim(),
      inspectorId: String(profile.inspectorId || "").trim(),
      inspectorName: String(profile.name || user.displayName || "").trim(),
      inspectorEmail: String(user.email || profile.email || "").trim(),
      phone: String(profile.phone || "").trim(),
      assignedVehicle: String(profile.assignedVehicle || "").trim(),
      approvedEndAddress: String(profile.approvedEndAddress || "").trim(),
      adminCorrections: Array.isArray(profile.adminCorrections) ? profile.adminCorrections.map(item => ({ ...item })) : []
    };
  }

  function publishCompanySession(user = currentUser, profile = currentProfile) {
    const detail = companySessionDetail(user, profile);
    if (!detail) return;
    window.MPI_COMPANY_SESSION = detail;
    const signature = JSON.stringify(detail);
    if (signature === lastPublishedSessionSignature) return;
    lastPublishedSessionSignature = signature;
    window.dispatchEvent(new CustomEvent("mpi-company-session-ready", { detail }));
  }

  function publishSpectoraSchedule(profile = currentProfile) {
    const days = (Array.isArray(profile?.spectoraScheduleDays) ? profile.spectoraScheduleDays : []).map(day => ({
      date: String(day?.date || ""),
      jobs: (Array.isArray(day?.jobs) ? day.jobs : []).map(job => ({
        id: String(job?.id || job?.spectoraJobId || ""),
        spectoraJobId: String(job?.spectoraJobId || job?.id || ""),
        propertyAddress: String(job?.propertyAddress || job?.address || job?.property || ""),
        scheduledStart: String(job?.scheduledStart || ""),
        scheduledEnd: String(job?.scheduledEnd || ""),
        inspectorId: String(job?.inspectorId || ""),
        inspectorName: String(job?.inspectorName || ""),
        clientName: String(job?.clientName || ""),
        clientPhone: String(job?.clientPhone || ""),
        agentName: String(job?.agentName || ""),
        agentPhone: String(job?.agentPhone || ""),
        notes: String(job?.notes || ""),
        status: String(job?.status || "scheduled"),
        services: Array.isArray(job?.services) ? job.services.map(String) : String(job?.services || "").split(",").map(value => value.trim()).filter(Boolean)
      }))
    })).filter(day => day.date);
    const signature = JSON.stringify(days);
    window.MPI_SPECTORA_SCHEDULE_DAYS = days;
    if (signature === lastPublishedSpectoraSignature) return;
    lastPublishedSpectoraSignature = signature;
    window.dispatchEvent(new CustomEvent("mpi-spectora-schedule-ready", { detail: { days, readOnly: true, source: "Spectora" } }));
  }

  function renderProfile(user, profile) {
    if (!profileCard || !profileForm) return;
    profileCard.hidden = !(user && profile);
    if (!user || !profile) {
      showProfilePhoto("", "MPI");
      return;
    }
    pendingProfilePhoto = null;
    profileName.value = profile.name || user.displayName || "";
    profileJobTitle.value = profile.jobTitle || (profile.role === "inspector" ? "Inspector" : profile.role === "subcontractor" ? "Subcontractor" : "");
    profilePhone.value = profile.phone || "";
    profileInspectorId.value = profile.inspectorId || "";
    profileVehicle.value = profile.assignedVehicle || "";
    profilePersonalAddress.value = profile.personalAddress || "";
    profileEmergencyName.value = profile.emergencyContactName || "";
    profileEmergencyPhone.value = profile.emergencyContactPhone || "";
    profileTranscriptUrl.value = profile.nachiTranscriptUrl || "";
    profileRole.value = roleLabel(profile);
    profileEmail.value = user.email || profile.email || "";
    profileStatus.textContent = "Saved to your MPI account";
    showProfilePhoto(profilePhotoSource(profile, user), profileName.value);
    if (trainingMemberNumber) trainingMemberNumber.textContent = profile.inspectorId ? `MEMBER ${profile.inspectorId}` : "MEMBER NUMBER NOT SAVED";
    if (trainingTranscriptLink) trainingTranscriptLink.href = /^https:\/\//i.test(String(profile.nachiTranscriptUrl || "")) ? profile.nachiTranscriptUrl : "https://www.nachi.org/my/education/transcript";
    renderOfficialInterNachiRecord(profile).catch(() => false);
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("That photo could not be opened."));
      image.src = source;
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("That photo could not be read."));
      reader.readAsDataURL(file);
    });
  }

  async function compressedProfilePhoto(file) {
    if (!file?.type?.startsWith("image/")) throw new Error("Choose an image from the phone's Photo Library.");
    if (file.size > 12 * 1024 * 1024) throw new Error("Choose a photo smaller than 12 MB.");
    const source = await readFileAsDataUrl(file);
    const image = await loadImage(source);
    let size = 360;
    let quality = 0.82;
    let result = "";
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size, size);
      const crop = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
      const sx = ((image.naturalWidth || image.width) - crop) / 2;
      const sy = ((image.naturalHeight || image.height) - crop) / 2;
      context.drawImage(image, sx, sy, crop, crop, 0, 0, size, size);
      result = canvas.toDataURL("image/jpeg", quality);
      if (result.length <= 180000) return result;
      size = Math.max(220, size - 45);
      quality = Math.max(0.62, quality - 0.07);
    }
    if (result.length > 220000) throw new Error("That image could not be made small enough. Try a different photo.");
    return result;
  }

  async function chooseProfilePhoto() {
    const file = profilePhotoInput?.files?.[0];
    if (!file) return;
    profileStatus.textContent = "Preparing photo…";
    try {
      pendingProfilePhoto = await compressedProfilePhoto(file);
      showProfilePhoto(pendingProfilePhoto, profileName.value);
      profileStatus.textContent = "Photo ready — tap Save My Profile";
    } catch (error) {
      pendingProfilePhoto = null;
      profileStatus.textContent = error?.message || "Photo could not be prepared.";
    } finally {
      profilePhotoInput.value = "";
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!currentUser || !currentProfile) return;
    const name = profileName.value.trim().slice(0, 80);
    if (!name) {
      profileStatus.textContent = "Enter your full name.";
      profileName.focus();
      return;
    }
    profileSave.disabled = true;
    profileStatus.textContent = "Saving profile…";
    const updates = {
      name,
      jobTitle: profileJobTitle.value.trim().slice(0, 80),
      phone: profilePhone.value.trim().slice(0, 30),
      inspectorId: profileInspectorId.value.trim().slice(0, 40),
      assignedVehicle: profileVehicle.value.trim().slice(0, 80),
      personalAddress: profilePersonalAddress.value.trim().slice(0, 180),
      emergencyContactName: profileEmergencyName.value.trim().slice(0, 80),
      emergencyContactPhone: profileEmergencyPhone.value.trim().slice(0, 30),
      nachiTranscriptUrl: /^https:\/\//i.test(profileTranscriptUrl.value.trim()) ? profileTranscriptUrl.value.trim().slice(0, 500) : "",
      profileUpdatedAt: shared.serverTimestamp()
    };
    if (pendingProfilePhoto !== null) updates.profilePhoto = pendingProfilePhoto;
    try {
      await shared.db.collection("users").doc(currentUser.uid).set(updates, { merge: true });
      currentProfile = { ...currentProfile, ...updates };
      await shared.db.collection("teamPresence").doc(currentUser.uid).set({
        name,
        profilePhoto: pendingProfilePhoto !== null ? pendingProfilePhoto : String(currentProfile.profilePhoto || ""),
        updatedAt: shared.serverTimestamp()
      }, { merge: true }).catch(() => false);
      pendingProfilePhoto = null;
      accountName.textContent = name;
      showProfilePhoto(profilePhotoSource(currentProfile, currentUser), name);
      profileStatus.textContent = "Profile saved";
      if (trainingMemberNumber) trainingMemberNumber.textContent = updates.inspectorId ? `MEMBER ${updates.inspectorId}` : "MEMBER NUMBER NOT SAVED";
      if (trainingTranscriptLink) trainingTranscriptLink.href = updates.nachiTranscriptUrl || "https://www.nachi.org/my/education/transcript";
      publishCompanySession();
      publishSpectoraSchedule();
    } catch (error) {
      profileStatus.textContent = /permission/i.test(error?.message || "")
        ? "Profile permission needs updating. Please try again shortly."
        : (error?.message || "Profile could not be saved. Try again.");
    } finally {
      profileSave.disabled = false;
    }
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
    const values = [...records, ...OFFICE_TEAM].sort((left, right) => {
      if (left.id === currentUser.uid) return -1;
      if (right.id === currentUser.uid) return 1;
      if (left.role === "admin" && right.role !== "admin") return 1;
      if (right.role === "admin" && left.role !== "admin") return -1;
      return String(left.name || "").localeCompare(String(right.name || ""));
    });
    teamStatusList.innerHTML = values.length ? values.map(item => {
      const office = item.role === "admin";
      const sameDay = office || item.date === localDateKey();
      const rawStatus = office ? "OFFICE" : sameDay ? item.status : "NOT STARTED";
      const age = teamPresenceAge(item);
      const updated = teamPresenceDate(item);
      const stale = !office && sameDay && rawStatus !== "CLOCKED OUT" && updated && Date.now() - updated.getTime() > 20 * 60 * 1000;
      const photoSource = item.profilePhoto || item.photoURL;
      const photo = photoSource ? `<img src="${escapeHtml(photoSource)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : "";
      const detail = office ? "Office team · tap to message office" : stale ? `${age} · confirm status if needed` : age;
      const content = `<span class="workflow-team-avatar">${photo}<b>${escapeHtml(teamInitials(item.name))}</b></span><div class="workflow-team-copy"><strong>${escapeHtml(item.name || "MPI Team Member")}${item.id === currentUser.uid ? " <small>YOU</small>" : ""}</strong><span>${escapeHtml(detail)}</span></div><span class="workflow-team-pill ${teamStatusTone(rawStatus)}${stale ? " stale" : ""}">${escapeHtml(sameDay ? teamStatusLabel(rawStatus) : "Not updated today")}</span>`;
      return office
        ? `<a class="workflow-team-person" href="#team-messages" data-team-message-recipient="${escapeHtml(item.name || "MPI Office")}">${content}</a>`
        : `<article class="workflow-team-person${item.id === currentUser.uid ? " is-you" : ""}">${content}</article>`;
    }).join("") : '<div class="workflow-team-empty">Team members will appear after their company phones load this update.</div>';
    teamStatusUpdated.textContent = values.length ? `${values.length} team ${values.length === 1 ? "member" : "members"}` : "Waiting for phones";
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
    window.dispatchEvent(new CustomEvent("mpi-inbox-updates", { detail: { updates } }));
    alertForNewUpdates(updates);
    const unread = updates.filter(item => !item.receipt || item.receipt.status === "delivered").length;
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
        : `<details class="mpi-update-reply"><summary>Reply to office</summary><form data-update-reply-form><label>Message for management<textarea maxlength="1000" placeholder="Type your reply here"></textarea></label><label class="mpi-reply-photo">ATTACH PHOTOS<input type="file" data-update-reply-files accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" multiple><small>Up to 3 photos. Large phone photos are reduced before sending.</small></label><button type="submit">SEND REPLY</button><span role="status"></span></form></details>`;
      return `<article class="mpi-update-card ${escapeHtml(update.priority || "normal")}" data-update-id="${escapeHtml(update.id)}"><div class="mpi-update-top"><span>${escapeHtml(typeLabel(update.type))}</span>${update.priority && update.priority !== "normal" ? `<strong>${escapeHtml(update.priority)}</strong>` : ""}</div><h3>${escapeHtml(update.title)}</h3><p>${escapeHtml(update.message)}</p><div class="mpi-update-meta">${due}<span>From ${escapeHtml(update.createdByName || "MPI Management")}</span></div>${link}${updateAttachmentsHtml(update)}${reply}<button class="mpi-update-action${action.clear ? " clear" : ""}" type="button" data-update-status="${action.status}" ${action.disabled ? "disabled" : ""}>${escapeHtml(action.label)}</button></article>`;
    }).join("") : '<div class="mpi-updates-empty"><strong>You are up to date.</strong><span>No current office messages, instructions, or training assignments are waiting.</span></div>';
  }

  function renderSession(user, profile, error) {
    currentUser = user;
    currentProfile = profile;
    if (spectoraRefreshInterval) {
      window.clearInterval(spectoraRefreshInterval);
      spectoraRefreshInterval = 0;
    }
    if (user && profile?.active !== false) {
      shared.requestSpectoraScheduleRefresh?.().catch(() => false);
      spectoraRefreshInterval = window.setInterval(() => {
        shared.requestSpectoraScheduleRefresh?.().catch(() => false);
      }, 15 * 60 * 1000);
    }
    synchronizeAccessChoice(user, profile);
    accountCard.hidden = false;
    if (!user || !profile) {
      if (topProfileLink) topProfileLink.href = "#settings";
      stopLiveLocationSharing();
      lastPublishedSessionSignature = "";
      delete window.MPI_COMPANY_SESSION;
      window.dispatchEvent(new CustomEvent("mpi-company-session-ready", { detail: null }));
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
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      profileWatchUserId = "";
      unsubscribeTeamPresence = null;
      if (teamStatusCard) teamStatusCard.hidden = true;
      renderProfile(null, null);
      return;
    }
    accountName.textContent = profile.name || user.displayName || "MPI Team Member";
    if (topProfileLink) topProfileLink.href = "#profile";
    accountRole.textContent = shared.isAdminRole(profile) ? "Owner / office administrator" : roleLabel(profile);
    accountStatus.textContent = profile.subcontractorOnly ? "Secure company phone" : user.email || "Signed in";
    renderProfile(user, profile);
    signInButtons.forEach(button => { button.hidden = true; });
    signOutButtons.forEach(button => { button.hidden = false; });
    officeConsoleCard.hidden = !shared.isAdminRole(profile);
    settingsAdminLink.hidden = !shared.isAdminRole(profile);
    if (adminReturnLink) adminReturnLink.hidden = !(openedFromOfficeDashboard || shared.isAdminRole(profile));
    updatesGate.hidden = true;
    updatesContent.hidden = false;
    registerPushDevice(user, profile).catch(() => {});
    publishCompanySession(user, profile);
    publishSpectoraSchedule(profile);
    startLiveLocationSharing();
    if (profileWatchUserId !== user.uid) {
      unsubscribeProfile?.();
      profileWatchUserId = user.uid;
      unsubscribeProfile = shared.db.collection("users").doc(user.uid).onSnapshot(snapshot => {
        if (!snapshot.exists || currentUser?.uid !== user.uid) return;
        currentProfile = { id: snapshot.id, ...snapshot.data() };
        if (currentProfile.active === false) {
          renderSession(null, null, new Error("MPI Office has revoked access for this device. Contact management to restore it."));
          shared.signOut().catch(() => false);
          return;
        }
        publishCompanySession(currentUser, currentProfile);
        publishSpectoraSchedule(currentProfile);
        syncLiveLocationSharing();
        handleLiveLocationRequest(currentProfile);
        if (activeLiveLocationState(currentProfile) && Date.now() - lastLiveLocationAttemptAt >= LIVE_LOCATION_INTERVAL_MS) {
          publishLiveLocation("automatic").catch(() => false);
        }
      }, () => {});
    }
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
    const filesInput = form.querySelector("[data-update-reply-files]");
    const files = [...(filesInput?.files || [])].slice(0, 3);
    if (!message && !files.length) {
      status.textContent = "Write a reply or attach a photo first.";
      return;
    }
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const update = currentUpdates.find(item => item.id === card.dataset.updateId) || null;
      await shared.replyToUpdate(card.dataset.updateId, currentUser, currentProfile, message, update, files);
      status.textContent = files.length ? `Reply and ${files.length} photo${files.length === 1 ? "" : "s"} sent to MPI management.` : "Reply sent to MPI management.";
    } catch (error) {
      button.disabled = false;
      status.textContent = error?.message || "Reply could not be sent. Try again.";
    }
  }

  employeeAccessChoice?.addEventListener("click", chooseEmployeeAccess);
  subcontractorAccessChoice?.addEventListener("click", chooseSubcontractorAccess);
  accessInvitationForm?.addEventListener("submit", activatePastedSubcontractorInvitation);
  accessChoiceBack?.addEventListener("click", showAccessRoleOptions);

  if (!shared?.available) {
    renderSession(null, null, new Error("Reconnect to load the secure company connection."));
    signInButtons.forEach(button => { button.disabled = true; });
    if (employeeAccessChoice) employeeAccessChoice.disabled = true;
    return;
  }

  signInButtons.forEach(button => button.addEventListener("click", () => signIn(button)));
  signOutButtons.forEach(button => button.addEventListener("click", () => shared.signOut()));
  profileForm?.addEventListener("submit", saveProfile);
  profilePhotoInput?.addEventListener("change", chooseProfilePhoto);
  profileName?.addEventListener("input", () => showProfilePhoto(pendingProfilePhoto !== null ? pendingProfilePhoto : profilePhotoSource(), profileName.value));
  profilePhotoRemove?.addEventListener("click", () => {
    pendingProfilePhoto = "";
    showProfilePhoto("", profileName?.value || currentProfile?.name || "MPI");
    profileStatus.textContent = "Photo removed — tap Save My Profile";
  });
  updatesList.addEventListener("click", handleUpdateAction);
  updatesList.addEventListener("click", handleAttachmentOpen);
  updatesList.addEventListener("submit", handleUpdateReply);
  window.addEventListener("mpi-push-token-ready", event => {
    if (currentUser && currentProfile) registerPushDevice(currentUser, currentProfile, event.detail?.token).catch(() => {});
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && currentUser && currentProfile) {
      syncLiveLocationSharing();
      handleLiveLocationRequest(currentProfile);
      publishLiveLocation("automatic").catch(() => false);
    }
  });
  window.addEventListener("online", () => publishLiveLocation("automatic").catch(() => false));
  window.addEventListener("online", () => flushNativeLocations().catch(() => false));
  shared.watchSession(({ user, profile, error }) => renderSession(user, profile, error));
})();
