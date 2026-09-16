(function () {
  "use strict";

  // Field handover must retain the parent's already verified owner identity.
  // WKWebView may not restore a second Firebase sign-in inside an iframe.
  // No persisted role, query parameter or preview identity grants this access:
  // the parent checks the exact live equipment frame and actual authenticated UID.
  try {
    if (!window.MPI_OWNER_PREVIEW && window.parent !== window && new URLSearchParams(window.location.search).get("field") === "1") {
      const session = window.parent.MPI_TOOL_BAG?.officeSession(window);
      if (session?.shared?.available) {
        window.MPI_SHARED = Object.assign(Object.create(session.shared), {
          watchSession: session.watchSession,
          completeRedirectSignIn: async () => null
        });
        return;
      }
    }
  } catch (_) { /* A standalone or untrusted frame must verify its own sign-in. */ }

  const MPI_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBH37lEcQdExd0JRTRWCYlZHWNevIJrmPk",
    authDomain: "mpi-field-notifications.firebaseapp.com",
    projectId: "mpi-field-notifications",
    storageBucket: "mpi-field-notifications.firebasestorage.app",
    messagingSenderId: "574980684703",
    appId: "1:574980684703:web:b0d2e4491fd09b78729baa"
  };
  const MPI_OWNER_EMAILS = ["kev@michiganpropertyinspections.com"];
  const MPI_APPROVED_END_LOCATIONS = Object.freeze({
    "cory@michiganpropertyinspections.com": "38948 Koppernick Road, Westland, MI 48185"
  });
  const MPI_COMPANY_DOMAIN = "michiganpropertyinspections.com";
  const MPI_PUSH_ENDPOINT = "https://script.google.com/macros/s/AKfycbzd701WKgQIzWP24pmjL3gaTFIjH2iHxjMYzirArFoYq8nup57p8h1VMmJPx9MVYOqL/exec";
  const MPI_PUSH_SOURCE = "mpi-field-tools-push";
  const MPI_FIREBASE_VAPID_KEY = "BFk0G1S4lILqk9x_sIDPRCUmPgzTOwyHocHWXG_SDgw6WOrlxiMB-eS4mPBEAPhI93I2mMB3zFxzoZaHKsudR6k";
  const MPI_INSPECTOR_NUMBERS = {
    "kev@michiganpropertyinspections.com": "NACHI24060423",
    "cory@michiganpropertyinspections.com": "NACHI26090138"
  };
  const MAX_PAID_SESSION_MS = 18 * 60 * 60 * 1000;

  if (!window.firebase?.initializeApp || !window.firebase?.auth || !window.firebase?.firestore) {
    window.MPI_SHARED = { available: false };
    return;
  }

  const app = window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(MPI_FIREBASE_CONFIG);
  const auth = app.auth();
  const db = app.firestore();
  const serverTimestamp = window.firebase.firestore.FieldValue.serverTimestamp;
  const arrayUnion = window.firebase.firestore.FieldValue.arrayUnion;
  const TEAM_STATUS_VALUES = new Set([
    "NOT STARTED",
    "READY / WAITING TO DEPART",
    "DRIVING TO JOB",
    "ARRIVED AT JOB",
    "INSPECTION IN PROGRESS",
    "FINAL JOB COMPLETE",
    "LAB STOP",
    "DRIVING TO LAB",
    "AT LAB",
    "DRIVING TO NEXT JOB",
    "READY TO DRIVE HOME",
    "DRIVING HOME",
    "DRIVING HOME / FINAL DESTINATION",
    "END-OF-DAY CHECKS",
    "NACHI TRAINING",
    "CLOCKED OUT"
  ]);

  const authPersistenceReady = auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch(() => false);
  // WKWebView/iOS can invalidate IndexedDB cursors when an app is suspended.
  // Keep the SDK's default memory cache there. Drafts, retry identities and a
  // last-known conversation cache remain durable without deleting old databases.
  const mobileMemoryCache = Boolean(window.Capacitor?.isNativePlatform?.()
    || /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  if (!mobileMemoryCache) db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  const directSubscriptions = new Map();
  const receiptWrites = new Set();
  const directSends = new Map();
  const messagingState = { status: "not-started", listener: "not-started", backend: "not-tested", lastError: null, lastServerAt: "", cache: mobileMemoryCache ? "memory" : "persistent" };

  function readMessageStore(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch (_) { return fallback; }
  }

  function writeMessageStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  // Only pending work is retried. Local clocks never cause a network write.
  const syncFlights = new Map();
  const syncRetryTimers = new Map();
  function syncStoreKey(uid) { return `mpiEventSyncV1:${uid}`; }
  function syncQueue(uid) { return readMessageStore(syncStoreKey(uid), { operations: {}, receipts: {}, acknowledged: {}, failures: 0, retryAt: 0 }); }
  function saveSyncQueue(uid, value) { writeMessageStore(syncStoreKey(uid), value); }
  function syncPayloadSignature(value) {
    const text = JSON.stringify(value, (key, item) => ["updatedAtClient", "syncStatus", "syncedAt", "receiptPending"].includes(key) ? undefined : item);
    let first = 2166136261, second = 5381;
    for (let index = 0; index < text.length; index += 1) { first = Math.imul(first ^ text.charCodeAt(index), 16777619); second = Math.imul(second, 33) ^ text.charCodeAt(index); }
    return `${text.length}:${first >>> 0}:${second >>> 0}`;
  }
  function syncCoolingDown(uid = auth.currentUser?.uid) { return Boolean(uid && Number(syncQueue(uid).retryAt || 0) > Date.now()); }
  function resumeSyncAfterServerSuccess(uid = auth.currentUser?.uid) {
    if (!uid || auth.currentUser?.uid !== uid) return;
    const queue = syncQueue(uid);
    if (!queue.retryAt && !queue.failures) return;
    // A successful read alone does not prove that a write quota recovered.
    // Never allow metadata/rollback snapshots to defeat the quota cooldown.
    if (queue.lastError?.quota && Date.now() - new Date(queue.lastError.at).getTime() < 30 * 60 * 1000) return;
    queue.retryAt = 0; queue.failures = 0;
    saveSyncQueue(uid, queue);
    schedulePendingSync(uid);
  }
  function schedulePendingSync(uid) {
    clearTimeout(syncRetryTimers.get(uid));
    const queue = syncQueue(uid);
    if (!Object.keys(queue.operations || {}).length && !Object.keys(queue.receipts || {}).length) return;
    if (!navigator.onLine || auth.currentUser?.uid !== uid) return;
    syncRetryTimers.set(uid, setTimeout(() => flushPendingSync(uid).catch(() => false), Math.max(1000, Number(queue.retryAt || 0) - Date.now())));
  }
  function deferPendingSync(uid, error) {
    const queue = syncQueue(uid);
    const quota = /resource-exhausted|quota|429/i.test(`${error?.code || ""} ${error?.message || ""}`);
    queue.failures = Number(queue.failures || 0) + 1;
    queue.retryAt = Date.now() + Math.min(quota ? 3 * 60 * 60 * 1000 : 15 * 60 * 1000, (quota ? 30 * 60 * 1000 : 60000) * 2 ** Math.min(queue.failures - 1, 4));
    queue.lastError = { code: String(error?.code || "unavailable"), at: new Date().toISOString(), quota };
    saveSyncQueue(uid, queue);
    schedulePendingSync(uid);
  }
  function pendingReceipt(uid, kind, id) { return syncQueue(uid).receipts?.[`${kind}:${id}`]; }
  function queueReadReceipt(user, kind, id, values = {}) {
    if (!user?.uid || !id || auth.currentUser?.uid !== user.uid) return Promise.resolve(false);
    const queue = syncQueue(user.uid);
    queue.receipts ||= {};
    const key = `${kind}:${id}`;
    const previous = queue.receipts[key];
    queue.receipts[key] = { ...previous, ...values, kind, id, readAtClient: previous?.readAtClient || new Date().toISOString() };
    saveSyncQueue(user.uid, queue);
    return flushPendingSync(user.uid);
  }
  async function flushPendingSync(uid = auth.currentUser?.uid) {
    if (!uid || auth.currentUser?.uid !== uid || !navigator.onLine || syncCoolingDown(uid)) return false;
    if (syncFlights.has(uid)) return syncFlights.get(uid);
    const flight = (async () => {
      try {
        while (auth.currentUser?.uid === uid && navigator.onLine) {
          const queue = syncQueue(uid);
          const receipts = Object.entries(queue.receipts || {}).slice(0, 200);
          if (receipts.length) {
            const batch = db.batch();
            receipts.forEach(([, receipt]) => {
              if (receipt.kind === "update") batch.set(db.collection("officeUpdates").doc(receipt.id).collection("receipts").doc(uid), {
                userId: uid, userEmail: receipt.userEmail || "", userName: receipt.userName || "MPI Team Member",
                ...(receipt.status === "read" ? {} : { status: receipt.status }), [receipt.timeField || "readAt"]: serverTimestamp(),
                readAtClient: receipt.readAtClient, updatedAt: serverTimestamp()
              }, { merge: true });
              else batch.set(db.collection(receipt.kind === "field" ? "fieldMessages" : "teamMessages").doc(receipt.id), {
                readBy: arrayUnion(uid), readAt: serverTimestamp()
              }, { merge: true });
            });
            await boundedMessageRequest(batch.commit());
            const fresh = syncQueue(uid);
            receipts.forEach(([key, value]) => { if (JSON.stringify(fresh.receipts?.[key]) === JSON.stringify(value)) delete fresh.receipts[key]; });
            fresh.failures = 0; fresh.retryAt = 0;
            saveSyncQueue(uid, fresh);
            continue;
          }
          const entry = Object.entries(queue.operations || {}).sort(([left], [right]) => left.localeCompare(right))[0];
          if (!entry) return true;
          const [date, record] = entry;
          await commitOperationsSnapshot(record.snapshot, uid);
          const fresh = syncQueue(uid);
          if (fresh.operations?.[date]?.signature === record.signature) delete fresh.operations[date];
          fresh.acknowledged ||= {};
          fresh.acknowledged[date] = record.signature;
          fresh.failures = 0; fresh.retryAt = 0;
          saveSyncQueue(uid, fresh);
          window.dispatchEvent?.(new CustomEvent("mpi-operations-sync-acknowledged", { detail: { userId: uid, snapshot: record.snapshot } }));
        }
        return false;
      } catch (error) { deferPendingSync(uid, error); return false; }
    })().finally(() => { syncFlights.delete(uid); schedulePendingSync(uid); });
    syncFlights.set(uid, flight);
    return flight;
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState !== "hidden") flushPendingSync().catch(() => false); });
  window.addEventListener("online", () => flushPendingSync().catch(() => false));
  window.addEventListener("mpi-company-session-ready", () => flushPendingSync().catch(() => false));
  window.addEventListener("mpi-native-app-state", event => { if (event.detail?.active) flushPendingSync().catch(() => false); });

  function messageFailure(error, context = "send") {
    if (error?.mpiMessageFailure) return error.mpiMessageFailure;
    const referenceId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const diagnostic = { referenceId, timestamp: new Date().toISOString(), context, inspector: auth.currentUser?.uid || "", code: String(error?.code || "unknown"), detail: String(error?.message || error || "Unknown messaging error").slice(0, 1800), online: navigator.onLine, cache: messagingState.cache };
    writeMessageStore("mpiMessagingDiagnosticsV1", [...readMessageStore("mpiMessagingDiagnosticsV1", []), diagnostic].slice(-30));
    messagingState.lastError = diagnostic;
    messagingState.status = "failed";
    const failure = { referenceId, message: `MESSAGE NOT SENT — Your message has been preserved. Please try again. Reference: ${referenceId}` };
    if (error && typeof error === "object") error.mpiMessageFailure = failure;
    return failure;
  }

  function boundedMessageRequest(promise, milliseconds = 18000) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => { const error = new Error("Messaging request timed out; acceptance will be checked on retry."); error.code = "messaging/timeout"; reject(error); }, milliseconds); })]).finally(() => clearTimeout(timer));
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function timeAdjustmentsForDate(adjustments, date) {
    return (Array.isArray(adjustments) ? adjustments : [])
      .filter(item => item?.date === date && item?.correctedValue)
      .sort((left, right) => String(left.correctedAt || "").localeCompare(String(right.correctedAt || "")));
  }

  function latestTimeAdjustment(adjustments, date, actions) {
    const accepted = new Set(Array.isArray(actions) ? actions : [actions]);
    return timeAdjustmentsForDate(adjustments, date).filter(item => accepted.has(item.targetAction)).at(-1) || null;
  }

  function isPaidHoursSession(session, index, sessions, timeClock) {
    if (!session?.clockedInAt || session?.excludedFromPayroll === true) return false;
    const source = String(session.startSource || "").trim();
    if (["morning-readiness", "activity-only"].includes(source)) return false;
    if (source && source !== "legacy-manual-clock") return true;

    // Early workflow builds created an unlabelled open session when Morning
    // Readiness was completed, followed by the real paid session at first-job
    // arrival. Retain that source record, but never count it as paid time.
    const sessionStart = timestampMilliseconds(session.clockedInAt);
    const activityStart = timestampMilliseconds(timeClock?.activityStartedAt || "");
    return !(Number.isFinite(sessionStart)
      && Number.isFinite(activityStart)
      && Math.abs(sessionStart - activityStart) <= 90 * 1000);
  }

  function effectiveTimeClock(timeClock, date, adjustments = []) {
    if (!timeClock || !Array.isArray(timeClock.sessions)) return null;
    const sessions = timeClock.sessions.map(session => ({ ...session }));
    const paidIndexes = sessions.map((session, index) => isPaidHoursSession(session, index, sessions, timeClock) ? index : -1).filter(index => index >= 0);
    const startAdjustment = latestTimeAdjustment(adjustments, date, "Hours Worked start");
    const endAdjustment = latestTimeAdjustment(adjustments, date, ["Hours Worked end", "Clocked off"]);
    if (paidIndexes.length && startAdjustment?.correctedValue) sessions[paidIndexes[0]].clockedInAt = startAdjustment.correctedValue;
    if (paidIndexes.length && endAdjustment?.correctedValue) sessions[paidIndexes.at(-1)].clockedOutAt = endAdjustment.correctedValue;
    return {
      ...timeClock,
      sessions,
      hoursWorkedStartedAt: sessions[paidIndexes[0]]?.clockedInAt || timeClock.hoursWorkedStartedAt || "",
      effectiveHoursWorkedStartedAt: sessions[paidIndexes[0]]?.clockedInAt || "",
      effectiveClockedOutAt: sessions[paidIndexes.at(-1)]?.clockedOutAt || "",
      paidSessionIndexes: [...paidIndexes],
      startAdjustment,
      endAdjustment
    };
  }

  function timestampMilliseconds(value) {
    const converted = value?.toDate?.();
    if (converted instanceof Date && Number.isFinite(converted.getTime())) return converted.getTime();
    if (Number.isFinite(Number(value?.seconds))) return Number(value.seconds) * 1000 + Math.floor(Number(value.nanoseconds || 0) / 1000000);
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.getTime() : NaN;
  }

  function repairPrematureClockOff(timeClock, jobs = [], date = "") {
    if (!timeClock || !Array.isArray(timeClock.sessions)) return { record: timeClock, repaired: false };
    const record = { ...timeClock, sessions: timeClock.sessions.map(session => ({ ...session })) };
    const repairs = Array.isArray(timeClock.prematureClockOffRepairs) ? timeClock.prematureClockOffRepairs.map(item => ({ ...item })) : [];
    const repairedEnds = new Set(repairs.map(item => String(item.originalClockedOutAt || "")));
    const paidIndexes = record.sessions.map((session, index) => isPaidHoursSession(session, index, record.sessions, record) ? index : -1).filter(index => index >= 0);
    const scheduledStarts = (Array.isArray(jobs) ? jobs : [])
      .filter(job => !/cancel|delete/i.test(String(job?.status || job?.completionStatus || "")))
      .map(job => timestampMilliseconds(job?.scheduledStart || job?.start?.dateTime || job?.start?.date || ""))
      .filter(value => Number.isFinite(value) && (!date || localDateKeyForTimestamp(value) === String(date)));
    const candidateIndex = paidIndexes.find((index, paidPosition) => {
      const session = record.sessions[index];
      const clockedOut = timestampMilliseconds(session.clockedOutAt);
      if (!Number.isFinite(clockedOut) || repairedEnds.has(String(session.clockedOutAt || ""))) return false;
      const laterSession = paidIndexes.slice(paidPosition + 1).some(laterIndex => timestampMilliseconds(record.sessions[laterIndex].clockedInAt) > clockedOut);
      const laterScheduledJob = scheduledStarts.some(start => start > clockedOut + 60 * 1000);
      return laterSession || laterScheduledJob;
    });
    if (!Number.isInteger(candidateIndex)) return { record: timeClock, repaired: false };
    const originalSession = { ...record.sessions[candidateIndex] };
    const followingIndexes = paidIndexes.filter(index => index > candidateIndex);
    const finalIndex = followingIndexes.at(-1);
    const finalSession = Number.isInteger(finalIndex) ? record.sessions[finalIndex] : null;
    const repair = {
      id: `premature-clock-off-${String(originalSession.clockedOutAt || "").replace(/[^0-9]/g, "")}`,
      correctedAt: new Date().toISOString(),
      originalClockedOutAt: String(originalSession.clockedOutAt || ""),
      originalClockOutLocation: originalSession.clockOutLocation || null,
      reason: "Clock Off was selected while a later scheduled job remained",
      mergedSessionStarts: followingIndexes.map(index => String(record.sessions[index]?.clockedInAt || "")).filter(Boolean)
    };
    record.sessions[candidateIndex].prematureClockOut = { ...repair };
    record.sessions[candidateIndex].clockedOutAt = String(finalSession?.clockedOutAt || "");
    record.sessions[candidateIndex].clockOutLocation = finalSession?.clockOutLocation || null;
    followingIndexes.forEach(index => {
      record.sessions[index].excludedFromPayroll = true;
      record.sessions[index].excludedReason = "Merged into the continuous session restored after a premature Clock Off";
      record.sessions[index].originalStartSource ||= String(record.sessions[index].startSource || "");
    });
    repairs.push(repair);
    record.prematureClockOffRepairs = repairs.slice(-20);
    return { record, repaired: true, repair };
  }

  function localDateKeyForTimestamp(value) {
    const parsed = new Date(timestampMilliseconds(value));
    if (!Number.isFinite(parsed.getTime())) return "";
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }

  function workedTimeAudit(timeClock, date, adjustments = [], endTime = Date.now(), options = {}) {
    const effective = effectiveTimeClock(timeClock, date, adjustments);
    if (!effective) return { milliseconds: 0, intervals: [], issues: [] };
    const now = Number(endTime);
    const currentDate = localDateKeyForTimestamp(now);
    const allowOpen = options.allowOpen !== undefined ? Boolean(options.allowOpen) : String(date || "") === currentDate;
    const fallbackEnd = timestampMilliseconds(options.fallbackEnd || "");
    const issues = [];
    const paidSessionIndexes = effective.sessions.map((session, index) => isPaidHoursSession(session, index, effective.sessions, effective) ? index : -1).filter(index => index >= 0);
    const finalPaidSessionIndex = paidSessionIndexes.at(-1);
    const hasClosedPaidSession = paidSessionIndexes.some(index => Boolean(effective.sessions[index]?.clockedOutAt));
    const intervals = effective.sessions.map((session, index) => {
      if (!isPaidHoursSession(session, index, effective.sessions, effective)) return null;
      const start = timestampMilliseconds(session.clockedInAt);
      if (!Number.isFinite(start)) {
        issues.push({ code: "invalid-start", sessionIndex: index, message: "A paid-hours session has an invalid start time." });
        return null;
      }
      if (date && localDateKeyForTimestamp(start) !== String(date)) {
        issues.push({ code: "wrong-day", sessionIndex: index, message: "A paid-hours session starts outside its recorded calendar day." });
        return null;
      }
      const recoveredEnd = !session.clockedOutAt && index === finalPaidSessionIndex && Number.isFinite(fallbackEnd) && fallbackEnd > start
        ? fallbackEnd
        : 0;
      if (!session.clockedOutAt && !recoveredEnd && !allowOpen) {
        const supersededByClosedSession = hasClosedPaidSession && paidSessionIndexes.some(paidIndex => paidIndex > index);
        if (supersededByClosedSession) return null;
        issues.push({ code: "historical-open-session", sessionIndex: index, message: "An older paid-hours session was never clocked out and has been excluded from totals." });
        return null;
      }
      const end = session.clockedOutAt ? timestampMilliseconds(session.clockedOutAt) : recoveredEnd || now;
      if (!Number.isFinite(end) || end <= start) {
        issues.push({ code: "invalid-end", sessionIndex: index, message: "A paid-hours session ends before it starts and has been excluded from totals." });
        return null;
      }
      if (end - start > MAX_PAID_SESSION_MS) {
        issues.push({ code: "overlong-session", sessionIndex: index, message: "A paid-hours session exceeds 18 hours and has been excluded pending management correction." });
        return null;
      }
      return { start, end, sessionIndex: index, recoveredEnd: Boolean(recoveredEnd) };
    }).filter(Boolean).sort((left, right) => left.start - right.start || left.end - right.end);
    const merged = [];
    intervals.forEach(interval => {
      const previous = merged[merged.length - 1];
      if (previous && interval.start <= previous.end) previous.end = Math.max(previous.end, interval.end);
      else merged.push({ ...interval });
    });
    return {
      milliseconds: merged.reduce((total, interval) => total + interval.end - interval.start, 0),
      intervals: merged,
      issues
    };
  }

  function workedMilliseconds(timeClock, date, adjustments = [], endTime = Date.now(), options = {}) {
    return workedTimeAudit(timeClock, date, adjustments, endTime, options).milliseconds;
  }

  function isCompanyEmail(value) {
    const email = normalizeEmail(value);
    return MPI_OWNER_EMAILS.includes(email) || email.endsWith(`@${MPI_COMPANY_DOMAIN}`);
  }

  function isOwnerEmail(value) {
    return MPI_OWNER_EMAILS.includes(normalizeEmail(value));
  }

  function isAdminRole(profile) {
    return ["owner", "admin"].includes(String(profile?.role || "").toLowerCase()) && profile?.active !== false;
  }

  function knownInspectorNumber(profile) {
    const email = normalizeEmail(profile?.email);
    if (MPI_INSPECTOR_NUMBERS[email]) return MPI_INSPECTOR_NUMBERS[email];
    const name = String(profile?.name || "").trim().toLowerCase();
    return /\bcory\b/.test(name) ? "NACHI26090138" : "";
  }

  function knownApprovedEndAddress(profile) {
    const email = normalizeEmail(profile?.email);
    if (MPI_APPROVED_END_LOCATIONS[email]) return MPI_APPROVED_END_LOCATIONS[email];
    const name = String(profile?.name || "").trim().toLowerCase();
    return /\bcory\b/.test(name) ? "38948 Koppernick Road, Westland, MI 48185" : "";
  }

  async function signIn() {
    await authPersistenceReady;
    if (window.MPI_NATIVE?.isNative) {
      const nativeResult = await window.MPI_NATIVE.signInWithGoogle([
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.calendarlist.readonly"
      ]);
      const nativeCredential = nativeResult?.credential || {};
      const idToken = String(nativeCredential.idToken || "").trim();
      const accessToken = String(nativeCredential.accessToken || "").trim();
      if (!idToken && !accessToken) throw new Error("Google sign-in completed without a usable credential.");
      if (accessToken) {
        try {
          localStorage.setItem("mpiCalendarAccessTokenV1", accessToken);
          localStorage.setItem("mpiCalendarAccessTokenExpiryV1", String(Date.now() + 50 * 60 * 1000));
          localStorage.setItem("mpiCalendarAuthorizedV1", "yes");
        } catch (_) {}
      }
      const providerCredential = window.firebase.auth.GoogleAuthProvider.credential(idToken || null, accessToken || null);
      return auth.signInWithCredential(providerCredential);
    }
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      return await auth.signInWithPopup(provider);
    } catch (error) {
      const redirectFallbackCodes = new Set([
        "auth/popup-blocked",
        "auth/operation-not-supported-in-this-environment",
        "auth/web-storage-unsupported"
      ]);
      if (!redirectFallbackCodes.has(error?.code)) throw error;
      await auth.signInWithRedirect(provider);
      return null;
    }
  }

  async function completeRedirectSignIn() {
    await authPersistenceReady;
    if (window.MPI_NATIVE?.isNative) return null;
    const result = await auth.getRedirectResult();
    if (result?.user) await ensureProfile(result.user);
    return result;
  }

  async function signOut() {
    await Promise.allSettled([auth.signOut(), window.MPI_NATIVE?.signOut?.()]);
  }

  function safeAccessId(value) {
    const accessId = String(value || "").trim();
    return /^[A-Za-z0-9_-]{32,120}$/.test(accessId) ? accessId : "";
  }

  async function activateSubcontractorDevice(accessValue, expectedKey = "") {
    await authPersistenceReady;
    const accessId = safeAccessId(accessValue);
    const targetKey = String(expectedKey || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!accessId) throw new Error("This activation link is incomplete. Ask MPI Office for a new private link.");

    let user = auth.currentUser;
    if (!user?.isAnonymous) {
      if (user) await auth.signOut();
      const credential = await auth.signInAnonymously();
      user = credential.user;
    }
    if (!user?.isAnonymous) throw new Error("This phone could not create its secure subcontractor session.");

    const accessRef = db.collection("subcontractorAccess").doc(accessId);
    const userRef = db.collection("users").doc(user.uid);
    await db.runTransaction(async transaction => {
      const accessSnapshot = await transaction.get(accessRef);
      const userSnapshot = await transaction.get(userRef);
      if (!accessSnapshot.exists) throw new Error("This activation link is not recognized. Ask MPI Office for a new private link.");
      const access = accessSnapshot.data() || {};
      if (access.active !== true) throw new Error("MPI Office has revoked this activation link.");
      if (targetKey && String(access.targetKey || "").toLowerCase() !== targetKey) throw new Error("This link was issued for a different subcontractor.");
      if (access.deviceUid && access.deviceUid !== user.uid) throw new Error("This link is already registered to another phone. MPI Office can revoke it and issue a replacement.");

      transaction.set(accessRef, {
        deviceUid: user.uid,
        activatedAt: access.activatedAt || serverTimestamp(),
        lastSeenAt: serverTimestamp()
      }, { merge: true });
      const profile = {
        name: String(access.targetName || "MPI Subcontractor").slice(0, 80),
        email: "",
        phone: String(access.phone || "").slice(0, 30),
        role: "subcontractor",
        active: true,
        subcontractorOnly: true,
        subcontractorKey: String(access.targetKey || targetKey || "subcontractor").slice(0, 60),
        subcontractorAccessId: accessId,
        sourceProfileId: String(access.sourceProfileId || "").slice(0, 120),
        lastSeenAt: serverTimestamp()
      };
      if (!userSnapshot.exists) profile.createdAt = serverTimestamp();
      transaction.set(userRef, profile, { merge: true });
    });
    const snapshot = await userRef.get();
    return { user, profile: { id: snapshot.id, ...snapshot.data() } };
  }

  async function ensureProfile(user) {
    if (!user || !isCompanyEmail(user.email)) throw new Error("Use an approved MPI company account.");
    const ref = db.collection("users").doc(user.uid);
    // Opening another local page must not wait indefinitely for an offline read
    // or a last-seen write. Access still comes from the real authenticated account.
    let profileReadTimer;
    const snapshot = await Promise.race([
      ref.get(),
      new Promise((_, reject) => {
        profileReadTimer = setTimeout(() => reject(Object.assign(new Error("The company connection is taking too long. Retry when connected."), { code: "unavailable" })), 12000);
      })
    ]).finally(() => clearTimeout(profileReadTimer));
    const inspectorNumber = knownInspectorNumber({ email: user.email, name: user.displayName });
    const approvedEndAddress = knownApprovedEndAddress({ email: user.email, name: snapshot.exists ? snapshot.data()?.name : user.displayName });
    if (!snapshot.exists) {
      const owner = isOwnerEmail(user.email);
      const created = {
        name: user.displayName || normalizeEmail(user.email).split("@")[0],
        email: normalizeEmail(user.email),
        photoURL: String(user.photoURL || "").slice(0, 1000),
        ...(inspectorNumber ? { inspectorId: inspectorNumber } : {}),
        ...(approvedEndAddress ? { approvedEndAddress: approvedEndAddress } : {}),
        ...(teamQualification({ email: user.email }) ? { qualification: teamQualification({ email: user.email }) } : {}),
        role: owner ? "owner" : "inspector",
        active: true,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp()
      };
      await ref.set(created);
      return { id: user.uid, ...created };
    } else {
      const saved = snapshot.data();
      const savedInspectorNumber = String(snapshot.data().inspectorId || inspectorNumber || "").trim();
      const savedApprovedEndAddress = String(snapshot.data().approvedEndAddress || approvedEndAddress || "").trim();
      const missing = {
        ...(!saved.name ? { name: user.displayName || "MPI Team Member" } : {}),
        ...(!saved.email ? { email: normalizeEmail(user.email) } : {}),
        ...(!saved.photoURL && user.photoURL ? { photoURL: String(user.photoURL).slice(0, 1000) } : {}),
        ...(!saved.inspectorId && savedInspectorNumber ? { inspectorId: savedInspectorNumber } : {}),
        ...(!saved.approvedEndAddress && savedApprovedEndAddress ? { approvedEndAddress: savedApprovedEndAddress } : {}),
        ...(!saved.qualification && teamQualification({ email: user.email }) ? { qualification: teamQualification({ email: user.email }) } : {})
      };
      if (Object.keys(missing).length && saved.active !== false) ref.set(missing, { merge: true }).catch(() => false);
      return { id: snapshot.id || user.uid, ...saved, ...missing };
    }
  }

  function watchSession(callback) {
    return auth.onAuthStateChanged(async user => {
      if (!user) {
        callback({ user: null, profile: null, error: null });
        return;
      }
      try {
        if (user.isAnonymous) {
          const ref = db.collection("users").doc(user.uid);
          const snapshot = await ref.get();
          if (snapshot.exists) {
            const profile = { id: snapshot.id, ...snapshot.data() };
            if (profile.active === false) {
              await auth.signOut();
              callback({ user: null, profile: null, error: new Error("MPI Office has revoked access for this device.") });
              return;
            }
            callback({ user, profile, error: null });
            return;
          }
          const stop = ref.onSnapshot(live => {
            if (!live.exists) return;
            stop();
            callback({ user, profile: { id: live.id, ...live.data() }, error: null });
          }, error => callback({ user: null, profile: null, error }));
          callback({ user: null, profile: null, error: new Error("Complete this phone's private subcontractor activation link.") });
          return;
        }
        const profile = await ensureProfile(user);
        if (profile.active === false) throw new Error("This MPI account is inactive.");
        callback({ user, profile, error: null });
      } catch (error) {
        if (/inactive|revoked/i.test(String(error?.message || ""))) await auth.signOut().catch(() => false);
        callback({ user, profile: null, error });
      }
    });
  }

  function watchUpdates(user, profile, callback) {
    if (!user || !profile) return () => {};
    const records = new Map();
    const receipts = new Map();
    const receiptUnsubscribers = new Map();
    const notify = () => callback(
      [...records.values()]
        .filter(item => item.active !== false)
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        .map(item => {
          const stored = receipts.get(item.id);
          const pending = pendingReceipt(user.uid, "update", item.id);
          const receipt = pending ? { ...stored, status: pending.status || "read", readAtClient: pending.readAtClient, receiptPending: true } : stored;
          return { ...item, receipt: receipt && (receipt.readAt || receipt.readAtClient) && (!receipt.status || receipt.status === "delivered") ? { ...receipt, status: "read" } : receipt || null };
        })
        .filter(item => !item.receipt?.clearedAt)
    );
    const syncReceiptListeners = () => {
      receiptUnsubscribers.forEach((unsubscribe, updateId) => {
        if (!records.has(updateId)) {
          unsubscribe?.();
          receiptUnsubscribers.delete(updateId);
          receipts.delete(updateId);
        }
      });
      records.forEach((_, updateId) => {
        if (receiptUnsubscribers.has(updateId)) return;
        const unsubscribe = db.collection("officeUpdates").doc(updateId).collection("receipts").doc(user.uid)
          .onSnapshot(snapshot => {
            if (snapshot.exists) receipts.set(updateId, { id: snapshot.id, ...snapshot.data() });
            else if (!snapshot.metadata?.fromCache && !pendingReceipt(user.uid, "update", updateId)) {
              receipts.delete(updateId);
              if (!syncCoolingDown(user.uid)) db.runTransaction(async transaction => {
                const ref = db.collection("officeUpdates").doc(updateId).collection("receipts").doc(user.uid);
                const existing = await transaction.get(ref);
                // Another handset may already have read this update.
                if (!existing.exists) transaction.set(ref, {
                  userId: user.uid, userEmail: normalizeEmail(user.email), userName: profile?.name || user.displayName || "MPI Team Member",
                  status: "delivered", deliveredAt: serverTimestamp(), updatedAt: serverTimestamp()
                }, { merge: true });
              }).catch(error => deferPendingSync(user.uid, error));
            }
            notify();
          }, () => notify());
        receiptUnsubscribers.set(updateId, unsubscribe);
      });
    };
    const loadQuery = query => query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "removed") records.delete(change.doc.id);
        else records.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
      });
      syncReceiptListeners();
      notify();
    }, () => notify());
    const unsubscribers = [
      loadQuery(db.collection("officeUpdates").where("active", "==", true).where("audience", "==", "all")),
      loadQuery(db.collection("officeUpdates").where("active", "==", true).where("targetEmail", "==", normalizeEmail(user.email))),
      loadQuery(db.collection("officeUpdates").where("active", "==", true).where("targetUid", "==", user.uid))
    ];
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe?.());
      receiptUnsubscribers.forEach(unsubscribe => unsubscribe?.());
      receiptUnsubscribers.clear();
    };
  }

  function setUpdateStatus(updateId, user, profile, status) {
    if (!updateId || !user) return Promise.reject(new Error("Sign in first."));
    const nowField = status === "completed" ? "completedAt" : status === "acknowledged" ? "acknowledgedAt" : "readAt";
    return queueReadReceipt(user, "update", updateId, {
      userEmail: normalizeEmail(user.email), userName: profile?.name || user.displayName || "MPI Team Member", status, timeField: nowField
    }).then(success => { if (!success) throw new Error("Receipt saved on this device; synchronization is pending."); return true; });
  }

  function clearUpdate(updateId, user, profile) {
    if (!updateId || !user) return Promise.reject(new Error("Sign in first."));
    return db.collection("officeUpdates").doc(updateId).collection("receipts").doc(user.uid).set({
      userId: user.uid,
      userEmail: normalizeEmail(user.email),
      userName: profile?.name || user.displayName || "MPI Team Member",
      clearedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  async function sendPushNotification(options = {}) {
    const user = auth.currentUser;
    if (!user || !MPI_PUSH_ENDPOINT) return false;
    const targetTokens = [...new Set((Array.isArray(options.targetTokens) ? options.targetTokens : [])
      .map(value => String(value || "").trim())
      .filter(Boolean))].slice(0, 30);
    if (!targetTokens.length && options.audience !== "office") return false;
    const idToken = await user.getIdToken();
    const requestId = `push-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await fetch(MPI_PUSH_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      cache: "no-store",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        source: MPI_PUSH_SOURCE,
        requestId,
        idToken,
        kind: String(options.kind || "office-update").slice(0, 40),
        audience: String(options.audience || "inspector").slice(0, 20),
        targetEmail: normalizeEmail(options.targetEmail),
        targetTokens,
        title: String(options.title || "MPI Field Tools").trim().slice(0, 90),
        body: String(options.body || "A new MPI message is available.").trim().slice(0, 220),
        link: String(options.link || "./#team-messages").trim().slice(0, 500),
        tag: String(options.tag || requestId).trim().slice(0, 100)
      })
    });
    return true;
  }

  async function requestSpectoraScheduleRefresh() {
    const user = auth.currentUser;
    if (!user || !MPI_PUSH_ENDPOINT) return false;
    const lastAttempt = Number(sessionStorage.getItem("mpiSpectoraRefreshAttempt") || 0);
    if (Date.now() - lastAttempt < 2 * 60 * 1000) return true;
    sessionStorage.setItem("mpiSpectoraRefreshAttempt", String(Date.now()));
    const idToken = await user.getIdToken();
    const requestId = `spectora-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await fetch(MPI_PUSH_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      cache: "no-store",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        source: "mpi-spectora-refresh",
        requestId,
        idToken
      })
    });
    return true;
  }

  function replyToUpdate(updateId, user, profile, message, update = null, files = []) {
    const replyText = String(message || "").trim().slice(0, 1000);
    if (!updateId || !user || (!replyText && !files.length)) return Promise.reject(new Error("Write a reply or attach a photo first."));
    const receiptPromise = db.collection("officeUpdates").doc(updateId).collection("receipts").doc(user.uid).set({
      userId: user.uid,
      userEmail: normalizeEmail(user.email),
      userName: profile?.name || user.displayName || "MPI Team Member",
      updateId,
      updateTitle: String(update?.title || "Message from MPI Office").slice(0, 100),
      replyToUserId: String(update?.createdBy || "").slice(0, 160),
      replyToEmail: normalizeEmail(update?.createdByEmail),
      replyToName: String(update?.createdByName || "MPI Office").slice(0, 100),
      status: "replied",
      replyText,
      repliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return receiptPromise.then(async () => {
      return sendFieldMessage(user, profile, replyText, files, { replyToUpdateId: updateId });
    });
  }

  function fileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",").pop() || "");
      reader.onerror = () => reject(new Error(`${file.name || "Photo"} could not be read.`));
      reader.readAsDataURL(file);
    });
  }

  async function prepareFieldImage(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/i.test(file.type || "") || file.size < 900000) return file;
    const source = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error(`${file.name || "Photo"} could not be prepared.`));
        element.src = source;
      });
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.78));
      return blob ? new File([blob], String(file.name || "field-photo").replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
    } finally {
      URL.revokeObjectURL(source);
    }
  }

  async function sendFieldMessage(user, profile, message, files = [], options = {}) {
    const text = String(message || "").trim().slice(0, 1200);
    const selected = [...files].filter(file => /^image\//i.test(file?.type || "") || /\.(jpe?g|png|webp|heic|heif)$/i.test(file?.name || "")).slice(0, 3);
    if (!user || (!text && !selected.length)) throw new Error("Write a message or attach a photo first.");
    if (selected.some(file => Number(file.size) > 6 * 1024 * 1024)) throw new Error("Each photo must be smaller than 6 MB.");
    const messageRef = db.collection("fieldMessages").doc();
    const senderName = String(options.senderName || profile?.name || user.displayName || "MPI Field User").trim().slice(0, 100);
    const sourceContext = options.context && typeof options.context === "object" ? options.context : {};
    const context = Object.fromEntries(Object.entries(sourceContext).slice(0, 12).map(([key, value]) => [
      String(key || "detail").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "detail",
      String(value ?? "").slice(0, 240)
    ]));
    const base = {
      senderUid: user.uid,
      senderEmail: normalizeEmail(user.email),
      senderName,
      senderRole: String(options.senderRole || profile?.role || "inspector").toLowerCase().slice(0, 30),
      message: text,
      kind: String(options.kind || "field-message").toLowerCase().slice(0, 40),
      context,
      replyToUpdateId: String(options.replyToUpdateId || "").slice(0, 160),
      test: Boolean(options.test),
      targetRole: "office",
      attachments: [],
      readBy: [user.uid],
      deliveredBy: [],
      active: selected.length === 0,
      createdAt: serverTimestamp(),
      createdAtClient: new Date().toISOString()
    };
    await messageRef.set(base);
    const attachments = [];
    try {
      for (const original of selected) {
        const file = await prepareFieldImage(original);
        const encoded = await fileAsBase64(file);
        const pieces = [];
        for (let offset = 0; offset < encoded.length; offset += 600000) pieces.push(encoded.slice(offset, offset + 600000));
        const attachmentRef = messageRef.collection("attachments").doc();
        const metadata = {
          id: attachmentRef.id,
          name: String(file.name || "field-photo.jpg").slice(0, 160),
          type: file.type || "image/jpeg",
          size: Number(file.size) || 0,
          chunkCount: pieces.length
        };
        await attachmentRef.set({ ...metadata, senderUid: user.uid, active: true, createdAt: serverTimestamp() });
        for (let start = 0; start < pieces.length; start += 6) {
          await Promise.all(pieces.slice(start, start + 6).map((data, part) => attachmentRef.collection("chunks").doc(String(start + part).padStart(4, "0")).set({ index: start + part, data, senderUid: user.uid, active: true })));
        }
        attachments.push(metadata);
      }
      await messageRef.update({ attachments, active: true, uploadedAt: serverTimestamp() });
    } catch (error) {
      await messageRef.set({ active: false, uploadError: String(error?.message || "Photo upload failed").slice(0, 200) }, { merge: true }).catch(() => {});
      throw error;
    }
    if (options.notifyOffice !== false) {
      await sendPushNotification({
        kind: String(options.kind || "field-message").toLowerCase().slice(0, 40),
        audience: "office",
        title: String(options.title || `Message from ${senderName}`).slice(0, 120),
        body: text || `${attachments.length} field photo${attachments.length === 1 ? "" : "s"} attached.`,
        link: "./admin.html?view=inbox",
        tag: `mpi-field-message-${messageRef.id}`
      }).catch(() => false);
    }
    return { id: messageRef.id, ...base, attachments, active: true };
  }

  function directConversationId(firstUid, secondUid) {
    return [String(firstUid || "").trim(), String(secondUid || "").trim()].filter(Boolean).sort().join("__");
  }

  async function sendDirectMessage(user, profile, target, message, files = []) {
    const signature = JSON.stringify([user?.uid, target?.id || target?.userId, String(message || "").trim(), [...files].map(file => [file.name, file.size, file.lastModified])]);
    if (directSends.has(signature)) return directSends.get(signature);
    const operation = sendDirectMessageAttempt(user, profile, target, message, files, signature)
      .catch(error => {
        const key = `mpiPendingDirectMessagesV1:${user?.uid || ""}`;
        const pending = readMessageStore(key, {});
        if (pending[signature]) writeMessageStore(key, { ...pending, [signature]: { ...pending[signature], state: "failed" } });
        messageFailure(error);
        throw error;
      })
      .finally(() => directSends.delete(signature));
    directSends.set(signature, operation);
    return operation;
  }

  async function sendDirectMessageAttempt(user, profile, target, message, files, signature) {
    const targetUid = String(target?.id || target?.userId || "").trim();
    const text = String(message || "").trim().slice(0, 1200);
    const selected = [...files].filter(file => /^image\//i.test(file?.type || "") || /application\/pdf/i.test(file?.type || "") || /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file?.name || "")).slice(0, 3);
    if (!user || !targetUid || targetUid === user.uid) throw new Error("Choose another MPI team member.");
    if (!text && !selected.length) throw new Error("Write a message or attach a file first.");
    if (selected.some(file => Number(file.size) > 8 * 1024 * 1024)) throw new Error("Each attachment must be smaller than 8 MB.");
    if (!navigator.onLine) throw new Error("Messaging is offline. The draft is retained for retry.");
    await boundedMessageRequest(user.getIdToken());
    const pendingKey = `mpiPendingDirectMessagesV1:${user.uid}`;
    const pending = readMessageStore(pendingKey, {});
    const isRetry = Boolean(pending[signature]);
    const attempt = pending[signature] || { id: db.collection("teamMessages").doc().id, createdAtClient: new Date().toISOString() };
    pending[signature] = { ...attempt, state: "sending", lastAttemptAt: new Date().toISOString() };
    writeMessageStore(pendingKey, pending);
    const messageRef = db.collection("teamMessages").doc(attempt.id);
    const conversationId = directConversationId(user.uid, targetUid);
    const senderName = String(profile?.name || user.displayName || "MPI Team Member").trim().slice(0, 100);
    const targetName = String(target?.name || "MPI Team Member").trim().slice(0, 100);
    const base = {
      conversationId,
      participantIds: [user.uid, targetUid].sort(),
      senderUid: user.uid,
      senderEmail: normalizeEmail(user.email),
      senderName,
      senderRole: String(profile?.role || "inspector").toLowerCase().slice(0, 30),
      targetUid,
      targetEmail: normalizeEmail(target?.email),
      targetName,
      targetRole: String(target?.role || "inspector").toLowerCase().slice(0, 30),
      message: text,
      attachments: [],
      readBy: [user.uid],
      deliveredTo: [],
      active: selected.length === 0,
      createdAt: serverTimestamp(),
      createdAtClient: attempt.createdAtClient
    };
    // A previous call may have committed even if its acknowledgement was lost.
    // Never overwrite an existing message or create a second ID on retry.
    const existing = isRetry ? await boundedMessageRequest(messageRef.get({ source: "server" })).catch(error => {
      // Participant-only rules reject reads of a nonexistent document. A create
      // is still safe: the rules reject a full rewrite of an existing message.
      if (String(error?.code || "").includes("permission-denied")) return { exists: false };
      throw error;
    }) : { exists: false };
    if (existing.exists && existing.data()?.active !== false) {
      const remaining = readMessageStore(pendingKey, {});
      delete remaining[signature];
      writeMessageStore(pendingKey, remaining);
      messagingState.status = "healthy";
      await notifyDirectMessage(user, { id: messageRef.id, ...existing.data() }, target);
      return { id: messageRef.id, ...existing.data() };
    }
    if (!existing.exists) await boundedMessageRequest(messageRef.set(base));
    const attachments = [];
    try {
      for (const [fileIndex, original] of selected.entries()) {
        const file = /^image\//i.test(original.type || "") ? await prepareFieldImage(original) : original;
        const encoded = await fileAsBase64(file);
        const pieces = [];
        for (let offset = 0; offset < encoded.length; offset += 600000) pieces.push(encoded.slice(offset, offset + 600000));
        const attachmentRef = messageRef.collection("attachments").doc(`file-${fileIndex}`);
        const metadata = { id: attachmentRef.id, name: String(file.name || "team-file").slice(0, 160), type: file.type || "application/octet-stream", size: Number(file.size) || 0, chunkCount: pieces.length };
        const savedAttachment = await boundedMessageRequest(attachmentRef.get({ source: "server" }));
        if (!savedAttachment.exists) await boundedMessageRequest(attachmentRef.set({ ...metadata, senderUid: user.uid, active: true, createdAt: serverTimestamp() }));
        for (let start = 0; start < pieces.length; start += 6) {
          await Promise.all(pieces.slice(start, start + 6).map(async (data, part) => {
            const chunkRef = attachmentRef.collection("chunks").doc(String(start + part).padStart(4, "0"));
            const savedChunk = await boundedMessageRequest(chunkRef.get({ source: "server" }));
            if (!savedChunk.exists) await boundedMessageRequest(chunkRef.set({ index: start + part, data, senderUid: user.uid, active: true }));
          }));
        }
        attachments.push(metadata);
      }
      if (selected.length) await boundedMessageRequest(messageRef.update({ attachments, active: true, uploadedAt: serverTimestamp(), uploadError: "" }));
    } catch (error) {
      // Do not deactivate a message after an uncertain final commit. Retry checks
      // the server's active state before resuming immutable attachment chunks.
      writeMessageStore(pendingKey, { ...readMessageStore(pendingKey, {}), [signature]: { ...attempt, state: "failed", lastAttemptAt: new Date().toISOString() } });
      throw error;
    }
    const remaining = readMessageStore(pendingKey, {});
    delete remaining[signature];
    writeMessageStore(pendingKey, remaining);
    messagingState.status = "healthy";
    const sent = { id: messageRef.id, ...base, attachments, active: true };
    await notifyDirectMessage(user, sent, target);
    return sent;
  }

  async function notifyDirectMessage(user, sent, target) {
    // Notification transport cannot leave an already accepted message stuck in
    // Sending. Retrying an uncertain commit still requests the same tagged alert.
    const targetTokens = [target?.notificationDevice?.token, target?.officeNotificationDevice?.token, target?.notificationToken].filter(Boolean);
    return boundedMessageRequest(sendPushNotification({
      kind: "team-message",
      audience: ["owner", "admin"].includes(String(target?.role || "").toLowerCase()) ? "office" : "inspector",
      targetEmail: target?.email || "",
      targetTokens,
      title: `Message from ${sent.senderName}`,
      body: sent.message || `${sent.attachments?.length || 1} attachment${sent.attachments?.length === 1 ? "" : "s"}`,
      link: ["owner", "admin"].includes(String(target?.role || "").toLowerCase())
        ? `./admin.html?team=${encodeURIComponent(user.uid)}`
        : `./?team=${encodeURIComponent(user.uid)}#inbox`,
      tag: `mpi-team-${sent.id}`
    }), 5000).catch(() => false);
  }

  function watchDirectMessages(user, callback) {
    if (!user || typeof callback !== "function") return () => {};
    let subscription = directSubscriptions.get(user.uid);
    if (!subscription) {
      subscription = { user, callbacks: new Set(), records: readMessageStore(`mpiDirectMessageCacheV1:${user.uid}`, []), unsubscribe: null, generation: 0 };
      directSubscriptions.set(user.uid, subscription);
    }
    subscription.callbacks.add(callback);
    if (subscription.records.length) callback(subscription.records, null);
    startDirectSubscription(subscription);
    return () => {
      subscription.callbacks.delete(callback);
      if (subscription.callbacks.size) return;
      stopDirectSubscription(subscription);
      directSubscriptions.delete(user.uid);
      if (!directSubscriptions.size) messagingState.listener = "not-started";
    };
  }

  function stopDirectSubscription(subscription) {
    subscription.generation += 1;
    clearTimeout(subscription.retryTimer);
    subscription.retryTimer = null;
    subscription.unsubscribe?.();
    subscription.unsubscribe = null;
  }

  function startDirectSubscription(subscription) {
    if (subscription.unsubscribe || !subscription.callbacks.size || document.visibilityState === "hidden") return;
    const generation = ++subscription.generation;
    messagingState.listener = "connecting";
    subscription.unsubscribe = db.collection("teamMessages").where("participantIds", "array-contains", subscription.user.uid).onSnapshot({ includeMetadataChanges: true }, snapshot => {
      if (generation !== subscription.generation) return;
      // Capture server receipts BEFORE views apply their optimistic read state.
      if (!snapshot.metadata?.fromCache && !snapshot.metadata?.hasPendingWrites) subscription.confirmedReadIds = new Set(snapshot.docs.filter(doc => doc.data().readBy?.includes(subscription.user.uid)).map(doc => doc.id));
      const records = snapshot.docs.map(doc => {
        const message = { id: doc.id, ...doc.data() };
        const pending = pendingReceipt(subscription.user.uid, "direct", message.id);
        return pending && message.targetUid === subscription.user.uid ? { ...message, readBy: [...new Set([...(message.readBy || []), subscription.user.uid])], receiptPending: true } : message;
      })
        .filter(item => item.active !== false)
        .sort((left, right) => timestampMilliseconds(right.createdAtClient) - timestampMilliseconds(left.createdAtClient));
      if (snapshot.metadata?.fromCache && !records.length && subscription.records.length) {
        messagingState.listener = "cached";
        subscription.callbacks.forEach(listener => listener(subscription.records, null));
        return;
      }
      subscription.records = records;
      // Persist timestamps as ISO strings, not SDK Timestamp instances.
      writeMessageStore(`mpiDirectMessageCacheV1:${subscription.user.uid}`, records.map(item => ({ ...item, createdAt: item.createdAtClient })).slice(0, 500));
      messagingState.listener = snapshot.metadata?.fromCache ? "cached" : "connected";
      if (!snapshot.metadata?.fromCache) {
        messagingState.lastServerAt = new Date().toISOString();
        messagingState.backend = "connected";
        messagingState.status = "healthy";
        if (!snapshot.metadata?.hasPendingWrites) resumeSyncAfterServerSuccess(subscription.user.uid);
      }
      subscription.callbacks.forEach(listener => listener(records, null));
      markDirectMessagesDelivered(subscription.user, records).catch(error => messageFailure(error, "delivery-receipt"));
      flushPendingSync(subscription.user.uid).catch(() => false);
    }, error => {
      if (generation !== subscription.generation) return;
      messagingState.listener = "failed";
      messageFailure(error, "conversation-listener");
      subscription.callbacks.forEach(listener => listener(subscription.records, error));
      stopDirectSubscription(subscription);
      deferPendingSync(subscription.user.uid, error);
      subscription.retryTimer = setTimeout(() => {
        subscription.retryTimer = null;
        if (auth.currentUser?.uid === subscription.user.uid) startDirectSubscription(subscription);
      }, Math.max(60000, Number(syncQueue(subscription.user.uid).retryAt || 0) - Date.now()));
    });
  }

  document.addEventListener("visibilitychange", () => {
    directSubscriptions.forEach(subscription => {
      if (document.visibilityState === "hidden") stopDirectSubscription(subscription);
      else startDirectSubscription(subscription);
    });
    if (document.visibilityState === "hidden" && directSubscriptions.size) messagingState.listener = "suspended";
  });
  window.addEventListener("online", () => directSubscriptions.forEach(subscription => { stopDirectSubscription(subscription); startDirectSubscription(subscription); }));
  window.addEventListener("mpi-native-app-state", event => directSubscriptions.forEach(subscription => {
    stopDirectSubscription(subscription);
    if (event.detail?.active) startDirectSubscription(subscription);
    else messagingState.listener = "suspended";
  }));

  async function messagingHealth() {
    const user = auth.currentUser;
    const pending = Object.values(readMessageStore(`mpiPendingDirectMessagesV1:${user?.uid || ""}`, {}));
    const result = { ...messagingState, authentication: user ? "signed-in" : "not-signed-in", pending: pending.length, failed: pending.filter(item => item.state === "failed").length, subscriptions: directSubscriptions.size, sendCapability: "not-tested" };
    if (!user || !navigator.onLine) return { ...result, status: "failed", backend: user ? "offline" : "not-authenticated" };
    try {
      await boundedMessageRequest(user.getIdToken(true), 10000);
      await boundedMessageRequest(db.collection("teamMessages").where("participantIds", "array-contains", user.uid).limit(1).get({ source: "server" }), 10000);
      let temporarySubscription;
      if (!directSubscriptions.has(user.uid)) temporarySubscription = watchDirectMessages(user, () => {});
      else directSubscriptions.forEach(subscription => { if (!subscription.unsubscribe) startDirectSubscription(subscription); });
      try {
        const startedAt = Date.now();
        while (messagingState.listener !== "connected" && Date.now() - startedAt < 8000) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (messagingState.listener !== "connected") throw new Error("Private-message real-time subscription is not connected.");
        return { ...result, backend: "connected", listener: "connected", authentication: "verified", status: pending.length ? "failed" : "healthy", sendCapability: "authenticated-participant-rules", lastServerAt: messagingState.lastServerAt };
      } finally { temporarySubscription?.(); }
    } catch (error) {
      const failure = messageFailure(error, "health-check");
      return { ...result, status: "failed", backend: "failed", referenceId: failure.referenceId, lastError: messagingState.lastError };
    }
  }

  async function markDirectMessagesDelivered(user, records = []) {
    if (!user || !navigator.onLine || syncCoolingDown(user.uid)) return false;
    const pending = records.filter(message =>
      message?.id
      && message.targetUid === user.uid
      && !(Array.isArray(message.deliveredTo) && message.deliveredTo.includes(user.uid))
      && !receiptWrites.has(`delivered:${user.uid}:${message.id}`)
    );
    for (let start = 0; start < pending.length; start += 400) {
      const group = pending.slice(start, start + 400);
      const batch = db.batch();
      group.forEach(message => { receiptWrites.add(`delivered:${user.uid}:${message.id}`); batch.set(db.collection("teamMessages").doc(message.id), {
        deliveredTo: arrayUnion(user.uid),
        deliveredAt: serverTimestamp()
      }, { merge: true }); });
      try { await boundedMessageRequest(batch.commit()); }
      finally { group.forEach(message => receiptWrites.delete(`delivered:${user.uid}:${message.id}`)); }
    }
    return true;
  }

  async function markDirectConversationRead(user, otherUid, openedIds = []) {
    if (!user || !otherUid) return false;
    const conversationId = directConversationId(user.uid, otherUid);
    const subscription = directSubscriptions.get(user.uid);
    const messages = subscription ? subscription.records : (await boundedMessageRequest(db.collection("teamMessages").where("conversationId", "==", conversationId).get())).docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const unread = messages.filter(message => {
      return message.targetUid === user.uid
        && message.senderUid !== user.uid
        && message.conversationId === conversationId
        && ((openedIds.includes(message.id) || message.receiptPending) && !subscription?.confirmedReadIds?.has(message.id)
          || !Array.isArray(message.readBy) || !message.readBy.includes(user.uid));
    });
    const queue = syncQueue(user.uid);
    queue.receipts ||= {};
    unread.forEach(message => {
      const key = `direct:${message.id}`;
      queue.receipts[key] ||= { kind: "direct", id: message.id, readAtClient: new Date().toISOString() };
    });
    saveSyncQueue(user.uid, queue);
    const success = await flushPendingSync(user.uid);
    if (!success && unread.length) throw new Error("Read receipt retained until synchronization is available.");
    return success;
  }

  async function markFieldMessageRead(user, messageId) {
    const messageKey = String(messageId || "").trim();
    if (!user || !messageKey) return false;
    return queueReadReceipt(user, "field", messageKey);
  }

  function watchSentFieldMessages(user, callback) {
    if (!user || typeof callback !== "function") return () => {};
    return db.collection("fieldMessages").where("senderUid", "==", user.uid).onSnapshot(snapshot => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.active !== false)
        .sort((left, right) => timestampMilliseconds(right.createdAt || right.createdAtClient) - timestampMilliseconds(left.createdAt || left.createdAtClient));
      callback(records, null);
    }, error => callback([], error));
  }

  async function markFieldMessagesDelivered(user, records = []) {
    if (!user || !navigator.onLine || syncCoolingDown(user.uid)) return false;
    const pending = records.filter(message =>
      message?.id
      && message.senderUid !== user.uid
      && !(Array.isArray(message.deliveredBy) && message.deliveredBy.includes(user.uid))
    );
    for (let start = 0; start < pending.length; start += 400) {
      const batch = db.batch();
      pending.slice(start, start + 400).forEach(message => batch.set(db.collection("fieldMessages").doc(message.id), {
        deliveredBy: arrayUnion(user.uid),
        deliveredAt: serverTimestamp()
      }, { merge: true }));
      await batch.commit();
    }
    return true;
  }

  async function loadDirectAttachment(messageId, attachment) {
    const messageKey = String(messageId || "").trim();
    const attachmentKey = String(attachment?.id || "").trim();
    if (!messageKey || !attachmentKey) throw new Error("This attachment is missing its secure file reference.");
    const snapshot = await db.collection("teamMessages").doc(messageKey).collection("attachments").doc(attachmentKey).collection("chunks").orderBy("index", "asc").get();
    const chunks = snapshot.docs.map(doc => doc.data()).sort((left, right) => Number(left.index) - Number(right.index));
    if (!chunks.length || (attachment.chunkCount && chunks.length !== Number(attachment.chunkCount))) throw new Error("The complete attachment has not synchronized yet.");
    const encoded = chunks.map(chunk => String(chunk.data || "")).join("");
    const binary = window.atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: attachment.type || "application/octet-stream" });
  }

  async function sendSafetyAlert(user, profile, report = {}) {
    if (!user) throw new Error("Sign in with the inspector’s MPI company account before submitting a safety notice.");
    const senderName = String(report.inspector || profile?.name || user.displayName || "MPI Inspector").trim().slice(0, 100);
    const senderEmail = normalizeEmail(user.email);
    const reportId = String(report.reportId || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)
      .replace(/[^a-z0-9_-]+/gi, "-")
      .slice(0, 120);
    const noticeType = String(report.noticeType || "Safety event").trim().slice(0, 100);
    const property = String(report.property || "Location not supplied").trim().slice(0, 220);
    const facts = String(report.facts || "Safety notice submitted.").trim().slice(0, 1400);
    const immediateAction = String(report.immediateAction || "").trim().slice(0, 900);
    const decision = String(report.decision || "").trim().slice(0, 180);
    const followUp = String(report.followUp || "").trim().slice(0, 700);
    const occurredAt = String(report.occurredAt || new Date().toISOString()).trim().slice(0, 60);
    const peopleInformed = [...new Set((Array.isArray(report.peopleInformed) ? report.peopleInformed : [])
      .map(value => String(value || "").trim().slice(0, 120))
      .filter(Boolean))].slice(0, 12);
    const alertRef = db.collection("fieldMessages").doc(`safety-${reportId}`);
    const title = `URGENT SAFETY · ${noticeType}`.slice(0, 100);
    const body = `${senderName} · ${property}${facts ? ` · ${facts}` : ""}`.slice(0, 220);
    const record = {
      senderUid: user.uid,
      senderEmail,
      senderName,
      senderRole: String(profile?.role || "inspector").toLowerCase().slice(0, 30),
      kind: "safety-alert",
      priority: "critical",
      title,
      message: facts,
      safety: { noticeType, property, occurredAt, facts, immediateAction, decision, followUp, peopleInformed },
      targetRole: "office",
      attachments: [],
      active: true,
      createdAt: serverTimestamp(),
      createdAtClient: new Date().toISOString()
    };
    await alertRef.set(record, { merge: true });
    await sendPushNotification({
      kind: "safety-alert",
      audience: "office",
      title,
      body,
      link: "./admin.html#safety-alerts",
      tag: `mpi-safety-${reportId}`
    });
    return { id: alertRef.id, ...record };
  }

  async function loadFieldAttachment(messageId, attachment) {
    const messageKey = String(messageId || "").trim();
    const attachmentKey = String(attachment?.id || "").trim();
    if (!messageKey || !attachmentKey) throw new Error("This photo is missing its secure file reference.");
    const snapshot = await db.collection("fieldMessages").doc(messageKey)
      .collection("attachments").doc(attachmentKey).collection("chunks")
      .orderBy("index", "asc").get();
    const chunks = snapshot.docs.map(doc => doc.data()).sort((left, right) => Number(left.index) - Number(right.index));
    if (!chunks.length || (attachment.chunkCount && chunks.length !== Number(attachment.chunkCount))) throw new Error("The complete photo has not synchronized yet.");
    const encoded = chunks.map(chunk => String(chunk.data || "")).join("");
    const binary = window.atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: attachment.type || "image/jpeg" });
  }

  async function loadOfficeAttachment(updateId, attachment) {
    const updateKey = String(updateId || "").trim();
    const attachmentKey = String(attachment?.id || "").trim();
    if (!updateKey || !attachmentKey) throw new Error("This attachment is missing its secure file reference.");
    const snapshot = await db.collection("officeUpdates").doc(updateKey)
      .collection("attachments").doc(attachmentKey).collection("chunks")
      .orderBy("index", "asc").get();
    const chunks = snapshot.docs.map(doc => doc.data()).sort((left, right) => Number(left.index) - Number(right.index));
    if (!chunks.length || (attachment.chunkCount && chunks.length !== Number(attachment.chunkCount))) {
      throw new Error("The complete file has not synchronized yet. Reconnect and try again.");
    }
    const encoded = chunks.map(chunk => String(chunk.data || "")).join("");
    const binary = window.atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: attachment.type || "application/octet-stream" });
  }

  function cleanOperationsValue(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => item === undefined ? null : item));
  }

  function operationsValuePresent(value) {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }

  function mergeOperationsObject(previous = {}, incoming = {}) {
    const merged = { ...(previous || {}) };
    Object.entries(incoming || {}).forEach(([key, value]) => {
      if (operationsValuePresent(value)) merged[key] = value;
    });
    return merged;
  }

  function operationsJobKey(job = {}) {
    return String(job.id || `${job.property || "job"}|${job.scheduledStart || ""}`);
  }

  function mergeOperationsJobs(previous = [], incoming = []) {
    const jobs = new Map();
    [...(Array.isArray(previous) ? previous : []), ...(Array.isArray(incoming) ? incoming : [])].forEach(job => {
      if (!job || typeof job !== "object") return;
      const key = operationsJobKey(job);
      const existing = jobs.get(key);
      if (!existing) {
        jobs.set(key, { ...job });
        return;
      }
      const merged = mergeOperationsObject(existing, job);
      const rank = status => ({ scheduled: 1, "on my way": 2, arrived: 3, started: 4, "in progress": 4, completed: 5 }[String(status || "").toLowerCase()] || 0);
      if (rank(existing.status) > rank(job.status)) merged.status = existing.status;
      ["onMyWayAt", "arrivedAt", "inspectionStartedAt", "completedAt"].forEach(field => {
        merged[field] = String(job[field] || existing[field] || "");
      });
      jobs.set(key, merged);
    });
    return [...jobs.values()].sort((left, right) => String(left.scheduledStart || "").localeCompare(String(right.scheduledStart || "")));
  }

  function operationsEventKey(event = {}) {
    return String(event.id || `${event.timestamp || ""}|${event.action || ""}|${event.calendarEventId || event.jobId || ""}`);
  }

  function mergeOperationsActivity(previous = [], incoming = []) {
    const events = new Map();
    [...(Array.isArray(previous) ? previous : []), ...(Array.isArray(incoming) ? incoming : [])].forEach(event => {
      if (!event || typeof event !== "object") return;
      const key = operationsEventKey(event);
      events.set(key, mergeOperationsObject(events.get(key), event));
    });
    return [...events.values()].sort((left, right) => String(left.timestamp || "").localeCompare(String(right.timestamp || ""))).slice(-500);
  }

  function operationsDayStrength(day = {}) {
    const jobs = Array.isArray(day.jobs) ? day.jobs : [];
    const activity = (Array.isArray(day.activity) ? day.activity : []).filter(item => item?.action !== "Company-phone profile synchronized");
    const completedJobs = jobs.filter(job => String(job?.status || "").toLowerCase() === "completed").length;
    const sessions = Array.isArray(day.timeClock?.sessions) ? day.timeClock.sessions.length : 0;
    return jobs.length * 30 + completedJobs * 30 + activity.length * 4 + sessions * 20
      + (day.readiness ? 10 : 0) + (day.labStop ? 10 : 0) + (day.dayComplete ? 20 : 0);
  }

  function timeClockStrength(clock = {}) {
    const sessions = Array.isArray(clock?.sessions) ? clock.sessions.length : 0;
    return sessions * 10000 + Number(clock?.workedMinutes || 0) + (clock?.effectiveClockedOutAt ? 1000 : 0);
  }

  function teamDirectoryName(profile = {}, user = {}) {
    const email = normalizeEmail(profile.email || user.email);
    if (email === "admin@michiganpropertyinspections.com") return "Brooke";
    const name = String(profile.name || user.displayName || "MPI Team Member").trim();
    return /^corey leese$/i.test(name) ? "Cory Leese" : name;
  }

  function teamQualification(person = {}) {
    return normalizeEmail(person.email) === "cory@michiganpropertyinspections.com"
      || String(person.inspectorId || person.id || "").toUpperCase() === "NACHI26090138"
      ? "CPI – Certified Professional Inspector" : String(person.qualification || "");
  }

  function canonicalWorkflowStatus(value) {
    const status = String(value || "NOT STARTED").toUpperCase().replace(/\bIMS LABORATORY\b/g, "IMS");
    return ({ "DRIVING TO JOB": "ON WAY TO JOB", "DRIVING TO NEXT JOB": "ON WAY TO JOB", "INSPECTION IN PROGRESS": "INSPECTION STARTED", "FINAL JOB COMPLETE": "JOB COMPLETE", "DRIVING HOME / FINAL DESTINATION": "DRIVING HOME", "END-OF-DAY CHECKS": "ARRIVED HOME / END LOCATION" })[status] || status;
  }

  // The only workflow-to-status resolver. Persist its result with the actual
  // transition timestamp; all app, Team, profile and map surfaces consume it.
  function currentWorkflowStatus(day = {}) {
    const candidates = [];
    const add = (value, updatedAt, source = "workflow", eventId = "") => {
      if (!updatedAt) return;
      const milliseconds = timestampMilliseconds(updatedAt);
      if (value && Number.isFinite(milliseconds)) candidates.push({ value: canonicalWorkflowStatus(value), updatedAt: new Date(milliseconds).toISOString(), source, eventId, milliseconds });
    };
    const stored = day.currentWorkflowStatus;
    if (stored?.value) add(stored.value, stored.updatedAt, stored.source, stored.eventId);
    const labName = value => /ims/i.test(String(value || "")) ? "IMS" : /water/i.test(String(value || "")) ? "WATER TECH" : "LAB";
    const actions = { "Morning readiness completed": "READY / WAITING TO DEPART", "On My Way selected": "ON WAY TO JOB", "Arrived": "ARRIVED AT JOB", "Inspection started": "INSPECTION STARTED", "Job Complete selected": "JOB COMPLETE", "Final job completion": "JOB COMPLETE", "Lab visit completed": "LAB COMPLETE", "Lab route departure / continuation": "ON WAY TO JOB", "Proceed home selected": "DRIVING HOME", "Arrived home / end location": "ARRIVED HOME / END LOCATION", "Clocked off": "CLOCKED OUT", "NACHI training started": "NACHI TRAINING", "NACHI training ended": "READY / WAITING TO DEPART", "No final lab stop required": "READY TO DRIVE HOME" };
    (Array.isArray(day.activity) ? day.activity : []).forEach(event => {
      let value = actions[event.action];
      if (event.action === "Lab selected") value = `ON WAY TO ${labName(event.data?.labs?.[0] || event.data?.lab)}`;
      if (event.action === "Arrived at lab") value = `AT ${labName(event.data?.lab)}`;
      add(value, event.timestamp, "workflow-event", event.id || "");
    });
    (Array.isArray(day.events) ? day.events : []).forEach(event => add(event.status, event.timestamp, "workflow-event", event.id || ""));
    const lab = day.labStop;
    if (lab?.stage === "travel") add(`ON WAY TO ${labName(lab.labs?.[lab.currentIndex || 0])}`, lab.travelStartedAt || lab.selectedAt);
    if (lab?.stage === "arrived") add(`AT ${labName(lab.labs?.[lab.currentIndex || 0])}`, lab.arrivals?.[lab.labs?.[lab.currentIndex || 0]]);
    if (lab?.stage === "driving-home") add("DRIVING HOME", lab.homeDepartureAt);
    if (lab?.stage === "home-arrived") add("ARRIVED HOME / END LOCATION", lab.homeArrivedAt);
    if (["done", "proceed-home"].includes(lab?.stage) && lab.completedAt) add("LAB COMPLETE", lab.completedAt);
    const current = day.currentJob;
    if (!Array.isArray(day.events)) {
      add("ON WAY TO JOB", current?.onMyWayAt);
      add("ARRIVED AT JOB", current?.arrivedAt);
      add("INSPECTION STARTED", current?.inspectionStartedAt);
      add("JOB COMPLETE", current?.completedAt);
    }
    if (day.readiness?.completedAt) add("READY / WAITING TO DEPART", day.readiness.completedAt);
    const sessions = day.timeClock?.sessions || [];
    if (day.dayComplete?.completedAt && !sessions.some(session => !session.clockedOutAt)) add("CLOCKED OUT", day.dayComplete.completedAt);
    if (day.timeClock?.effectiveClockedOutAt && day.timeClock?.active === false) add("CLOCKED OUT", day.timeClock.effectiveClockedOutAt);
    const latest = candidates.sort((left, right) => left.milliseconds - right.milliseconds).at(-1);
    if (latest) { const { milliseconds, ...state } = latest; return state; }
    return { value: canonicalWorkflowStatus(day.status || day.liveStatus), updatedAt: String(day.statusUpdatedAt || day.updatedAtClient || ""), source: "legacy", eventId: "" };
  }

  function mergeOperationsDay(previous = {}, incoming = {}) {
    if (!previous?.date || !incoming?.date) {
      const initial = previous?.date ? previous : incoming;
      const state = currentWorkflowStatus(initial || {});
      return { ...(initial || {}), currentWorkflowStatus: state, liveStatus: state.value };
    }
    const previousStrength = operationsDayStrength(previous);
    const incomingStrength = operationsDayStrength(incoming);
    const dominant = incomingStrength >= previousStrength ? incoming : previous;
    const secondary = dominant === incoming ? previous : incoming;
    const merged = mergeOperationsObject(secondary, dominant);
    const latestData = (timestampMilliseconds(incoming.updatedAtClient) || 0) >= (timestampMilliseconds(previous.updatedAtClient) || 0) ? incoming : previous;
    const earlierData = latestData === incoming ? previous : incoming;
    merged.jobs = mergeOperationsJobs(previous.jobs, incoming.jobs);
    merged.activity = mergeOperationsActivity(previous.activity, incoming.activity);
    merged.readiness = incoming.readiness || previous.readiness || null;
    merged.labStop = Object.prototype.hasOwnProperty.call(latestData, "labStop")
      ? (latestData.labStop || null)
      : (earlierData.labStop || null);
    merged.dayComplete = Object.prototype.hasOwnProperty.call(latestData, "dayComplete")
      ? (latestData.dayComplete || null)
      : (earlierData.dayComplete || null);
    // A field snapshot deliberately sends null after a job/day is closed. Respect
    // that explicit clear instead of reviving an older appointment from Firestore.
    merged.currentJob = Object.prototype.hasOwnProperty.call(latestData, "currentJob")
      ? (latestData.currentJob || null)
      : (earlierData.currentJob || null);
    merged.nextJob = Object.prototype.hasOwnProperty.call(latestData, "nextJob")
      ? (latestData.nextJob || null)
      : (earlierData.nextJob || null);
    merged.timeClock = timeClockStrength(incoming.timeClock) >= timeClockStrength(previous.timeClock)
      ? (incoming.timeClock || previous.timeClock || null)
      : (previous.timeClock || incoming.timeClock || null);
    merged.driveTime = Number(incoming.driveTime?.totalMinutes || 0) >= Number(previous.driveTime?.totalMinutes || 0)
      ? (incoming.driveTime || previous.driveTime || null)
      : (previous.driveTime || incoming.driveTime || null);
    const states = [currentWorkflowStatus(previous), currentWorkflowStatus(incoming), currentWorkflowStatus(merged)];
    const meaningfulStates = states.some(state => state.source !== "legacy") ? states.filter(state => state.source !== "legacy") : states;
    merged.currentWorkflowStatus = meaningfulStates.sort((left, right) => (timestampMilliseconds(left.updatedAt) || 0) - (timestampMilliseconds(right.updatedAt) || 0)).at(-1);
    merged.liveStatus = merged.currentWorkflowStatus.value;
    merged.updatedAtClient = [previous.updatedAtClient, incoming.updatedAtClient].filter(Boolean).sort().at(-1) || "";
    return merged;
  }

  async function syncOperationsSnapshot(snapshot, options = {}) {
    const user = auth.currentUser;
    if (!user || !snapshot?.date) return false;
    const clean = cleanOperationsValue(snapshot);
    const queue = syncQueue(user.uid);
    queue.operations ||= {};
    queue.acknowledged ||= {};
    const signature = syncPayloadSignature(clean);
    if (!options.force && queue.acknowledged[clean.date] === signature && !queue.operations[clean.date]) return true;
    const pending = queue.operations[clean.date]?.snapshot;
    const saved = pending ? mergeOperationsDay(pending, clean) : clean;
    queue.operations[clean.date] = { snapshot: saved, signature: syncPayloadSignature(saved) };
    saveSyncQueue(user.uid, queue);
    return flushPendingSync(user.uid).then(() => {
      const latest = syncQueue(user.uid);
      return !latest.operations?.[clean.date] && latest.acknowledged?.[clean.date] === syncPayloadSignature(saved);
    });
  }

  async function commitOperationsSnapshot(clean, uid) {
    if (auth.currentUser?.uid !== uid) throw new Error("Account changed; pending work remains with its original inspector.");
    const user = auth.currentUser;
    const ref = db.collection("users").doc(uid);
    let profile = {};
    await db.runTransaction(async transaction => {
      const current = await transaction.get(ref);
      profile = current.data() || {};
      const existingDays = Array.isArray(profile.operationsDays) ? profile.operationsDays : [];
      const sameDateDays = existingDays.filter(day => day?.date === clean.date);
      if (profile.operationsCurrent?.date === clean.date) sameDateDays.push(profile.operationsCurrent);
      const merged = sameDateDays.reduce((result, day) => mergeOperationsDay(result, day), {});
      const saved = mergeOperationsDay(merged, clean);
      saved.currentWorkflowStatus = currentWorkflowStatus(saved);
      saved.liveStatus = saved.currentWorkflowStatus.value;
      const days = existingDays
        .filter(day => day?.date && day.date !== clean.date)
        .concat(saved)
        .sort((left, right) => String(left.date).localeCompare(String(right.date)));
      const currentDay = String(profile.operationsCurrent?.date || "") > String(saved.date)
        ? profile.operationsCurrent : saved;
      transaction.set(ref, {
        operationsCurrent: currentDay,
        operationsDays: days,
        operationsUpdatedAt: serverTimestamp()
      }, { merge: true });
      const role = String(profile.role || "inspector").toLowerCase();
      if (profile.active !== false && ["owner", "inspector", "subcontractor"].includes(role)) transaction.set(db.collection("teamPresence").doc(user.uid), {
        userId: user.uid, name: teamDirectoryName(profile, user).slice(0, 80), role,
        photoURL: String(profile.photoURL || user.photoURL || "").slice(0, 1000),
        profilePhoto: String(profile.profilePhoto || "").slice(0, 220000),
        status: currentDay.liveStatus, currentWorkflowStatus: currentWorkflowStatus(currentDay),
        statusUpdatedAt: currentWorkflowStatus(currentDay).updatedAt,
        date: String(currentDay.date || ""), active: profile.active !== false && ["owner", "inspector", "subcontractor"].includes(role),
        updatedAtClient: currentDay.updatedAtClient, updatedAt: serverTimestamp()
      }, { merge: true });
    });
    const role = String(profile.role || "inspector").toLowerCase();
    const teamVisible = profile.active !== false && ["owner", "inspector", "subcontractor"].includes(role);
    await syncTeamDirectoryRecords([{
      id: user.uid,
      userId: user.uid,
      name: teamDirectoryName(profile, user).slice(0, 80),
      email: normalizeEmail(profile.email || user.email),
      role,
      photoURL: String(user.photoURL || profile.photoURL || "").slice(0, 1000),
      profilePhoto: String(profile.profilePhoto || "").slice(0, 220000),
      notificationToken: String(profile.notificationDevice?.token || profile.officeNotificationDevice?.token || "").slice(0, 500),
      active: teamVisible || (["owner", "admin"].includes(role) && profile.active !== false)
    }]).catch(() => false);
    return true;
  }

  const directoryFlights = new Map();
  async function syncTeamDirectoryRecords(records = []) {
    const uid = auth.currentUser?.uid;
    if (!uid || !navigator.onLine || syncCoolingDown(uid)) return false;
    const key = `mpiDirectorySignaturesV1:${uid}`;
    const acknowledged = readMessageStore(key, {});
    const changed = records.map(({ id, ...value }) => ({ id, value, signature: syncPayloadSignature(value) }))
      .filter(record => record.id && acknowledged[record.id] !== record.signature && directoryFlights.get(record.id) !== record.signature);
    if (!changed.length) return true;
    try {
      for (let start = 0; start < changed.length; start += 400) {
        const group = changed.slice(start, start + 400);
        const batch = db.batch();
        group.forEach(record => {
          directoryFlights.set(record.id, record.signature);
          batch.set(db.collection("teamDirectory").doc(record.id), { ...record.value, updatedAt: serverTimestamp() }, { merge: true });
        });
        await boundedMessageRequest(batch.commit());
        const fresh = readMessageStore(key, {});
        group.forEach(record => { fresh[record.id] = record.signature; });
        writeMessageStore(key, fresh);
      }
      return true;
    } catch (error) { deferPendingSync(uid, error); return false; }
    finally { changed.forEach(record => { if (directoryFlights.get(record.id) === record.signature) directoryFlights.delete(record.id); }); }
  }

  async function loadOwnOperationsDay(date) {
    const user = auth.currentUser;
    const requestedDate = String(date || "").trim();
    if (!user || !requestedDate) return null;
    const snapshot = await db.collection("users").doc(user.uid).get();
    const profile = snapshot.data() || {};
    const candidates = (Array.isArray(profile.operationsDays) ? profile.operationsDays : [])
      .filter(day => String(day?.date || "") === requestedDate);
    if (String(profile.operationsCurrent?.date || "") === requestedDate) candidates.push(profile.operationsCurrent);
    if (!candidates.length) return null;
    return candidates.reduce((result, day) => mergeOperationsDay(result, day), {});
  }

  function watchTeamPresence(callback) {
    if (typeof callback !== "function") return () => {};
    return db.collection("teamPresence").where("active", "==", true).onSnapshot(snapshot => {
      const records = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => ["owner", "inspector", "subcontractor"].includes(String(item.role || "").toLowerCase()))
        .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
      callback(records, null);
    }, error => callback([], error));
  }

  function watchTeamDirectory(callback) {
    if (typeof callback !== "function") return () => {};
    return db.collection("teamDirectory").where("active", "==", true).onSnapshot(snapshot => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
      callback(records, null);
    }, error => callback([], error));
  }

  window.MPI_SHARED = {
    available: true,
    app,
    auth,
    db,
    serverTimestamp,
    arrayUnion,
    ownerEmail: MPI_OWNER_EMAILS[0],
    ownerEmails: [...MPI_OWNER_EMAILS],
    companyDomain: MPI_COMPANY_DOMAIN,
    pushEndpoint: MPI_PUSH_ENDPOINT,
    pushSource: MPI_PUSH_SOURCE,
    vapidKey: MPI_FIREBASE_VAPID_KEY,
    normalizeEmail,
    timeAdjustmentsForDate,
    latestTimeAdjustment,
    effectiveTimeClock,
    repairPrematureClockOff,
    workedTimeAudit,
    workedMilliseconds,
    isCompanyEmail,
    isOwnerEmail,
    isAdminRole,
    knownInspectorNumber,
    knownApprovedEndAddress,
    signIn,
    completeRedirectSignIn,
    signOut,
    activateSubcontractorDevice,
    ensureProfile,
    watchSession,
    watchUpdates,
    setUpdateStatus,
    clearUpdate,
    replyToUpdate,
    sendFieldMessage,
    sendDirectMessage,
    messageFailure,
    messagingHealth,
    watchDirectMessages,
    markDirectMessagesDelivered,
    markDirectConversationRead,
    markFieldMessageRead,
    watchSentFieldMessages,
    markFieldMessagesDelivered,
    sendSafetyAlert,
    sendPushNotification,
    requestSpectoraScheduleRefresh,
    loadOfficeAttachment,
    loadFieldAttachment,
    loadDirectAttachment,
    syncOperationsSnapshot,
    syncTeamDirectoryRecords,
    syncPayloadSignature,
    syncCoolingDown,
    resumeSyncAfterServerSuccess,
    deferPendingSync,
    flushPendingSync,
    loadOwnOperationsDay,
    watchTeamPresence,
    watchTeamDirectory,
    directConversationId,
    currentWorkflowStatus,
    canonicalWorkflowStatus,
    teamQualification,
    mergeOperationsDay
  };
})();
