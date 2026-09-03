(function () {
  "use strict";

  const MPI_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBH37lEcQdExd0JRTRWCYlZHWNevIJrmPk",
    authDomain: "mpi-field-notifications.firebaseapp.com",
    projectId: "mpi-field-notifications",
    storageBucket: "mpi-field-notifications.firebasestorage.app",
    messagingSenderId: "574980684703",
    appId: "1:574980684703:web:b0d2e4491fd09b78729baa"
  };
  const MPI_OWNER_EMAILS = ["kev@michiganpropertyinspections.com"];
  const MPI_COMPANY_DOMAIN = "michiganpropertyinspections.com";
  const MPI_PUSH_ENDPOINT = "https://script.google.com/macros/s/AKfycbzd701WKgQIzWP24pmjL3gaTFIjH2iHxjMYzirArFoYq8nup57p8h1VMmJPx9MVYOqL/exec";
  const MPI_PUSH_SOURCE = "mpi-field-tools-push";
  const MPI_FIREBASE_VAPID_KEY = "BFk0G1S4lILqk9x_sIDPRCUmPgzTOwyHocHWXG_SDgw6WOrlxiMB-eS4mPBEAPhI93I2mMB3zFxzoZaHKsudR6k";
  const MPI_INSPECTOR_NUMBERS = {
    "kev@michiganpropertyinspections.com": "NACHI24060423",
    "cory@michiganpropertyinspections.com": "NACHI26090138"
  };

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
    "CLOCKED OUT"
  ]);

  const authPersistenceReady = auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch(() => false);
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
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

  async function signIn() {
    await authPersistenceReady;
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
    const result = await auth.getRedirectResult();
    if (result?.user) await ensureProfile(result.user);
    return result;
  }

  function signOut() {
    return auth.signOut();
  }

  async function ensureProfile(user) {
    if (!user || !isCompanyEmail(user.email)) throw new Error("Use an approved MPI company account.");
    const ref = db.collection("users").doc(user.uid);
    const snapshot = await ref.get();
    const inspectorNumber = knownInspectorNumber({ email: user.email, name: user.displayName });
    if (!snapshot.exists) {
      const owner = isOwnerEmail(user.email);
      await ref.set({
        name: user.displayName || normalizeEmail(user.email).split("@")[0],
        email: normalizeEmail(user.email),
        photoURL: String(user.photoURL || "").slice(0, 1000),
        ...(inspectorNumber ? { inspectorId: inspectorNumber } : {}),
        role: owner ? "owner" : "inspector",
        active: true,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp()
      });
    } else {
      const savedInspectorNumber = String(snapshot.data().inspectorId || inspectorNumber || "").trim();
      await ref.set({
        name: snapshot.data().name || user.displayName || "MPI Team Member",
        email: normalizeEmail(user.email),
        photoURL: String(user.photoURL || snapshot.data().photoURL || "").slice(0, 1000),
        ...(savedInspectorNumber ? { inspectorId: savedInspectorNumber } : {}),
        lastSeenAt: serverTimestamp()
      }, { merge: true });
    }
    const current = await ref.get();
    return { id: current.id, ...current.data() };
  }

  function watchSession(callback) {
    return auth.onAuthStateChanged(async user => {
      if (!user) {
        callback({ user: null, profile: null, error: null });
        return;
      }
      try {
        const profile = await ensureProfile(user);
        if (profile.active === false) throw new Error("This MPI account is inactive.");
        callback({ user, profile, error: null });
      } catch (error) {
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
        .map(item => ({ ...item, receipt: receipts.get(item.id) || null }))
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
            else receipts.delete(updateId);
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
      loadQuery(db.collection("officeUpdates").where("active", "==", true).where("targetEmail", "==", normalizeEmail(user.email)))
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
    return db.collection("officeUpdates").doc(updateId).collection("receipts").doc(user.uid).set({
      userId: user.uid,
      userEmail: normalizeEmail(user.email),
      userName: profile?.name || user.displayName || "MPI Team Member",
      status,
      [nowField]: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
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

  function replyToUpdate(updateId, user, profile, message, update = null) {
    const replyText = String(message || "").trim().slice(0, 1000);
    if (!updateId || !user || !replyText) return Promise.reject(new Error("Write a reply first."));
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
      await sendPushNotification({
        kind: "inspector-reply",
        audience: "office",
        targetEmail: normalizeEmail(update?.createdByEmail),
        title: `Reply from ${profile?.name || user.displayName || "MPI Inspector"}`,
        body: replyText,
        link: "./admin.html",
        tag: `mpi-reply-${updateId}-${user.uid}`
      }).catch(() => false);
      return true;
    });
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

  async function syncOperationsSnapshot(snapshot) {
    const user = auth.currentUser;
    if (!user || !snapshot?.date) return false;
    const ref = db.collection("users").doc(user.uid);
    const clean = cleanOperationsValue(snapshot);
    let profile = {};
    await db.runTransaction(async transaction => {
      const current = await transaction.get(ref);
      profile = current.data() || {};
      const existingDays = Array.isArray(profile.operationsDays) ? profile.operationsDays : [];
      const days = existingDays
        .filter(day => day?.date && day.date !== clean.date)
        .concat(clean)
        .sort((left, right) => String(left.date).localeCompare(String(right.date)))
        .slice(-14);
      transaction.set(ref, {
        operationsCurrent: clean,
        operationsDays: days,
        operationsUpdatedAt: serverTimestamp()
      }, { merge: true });
    });
    const role = String(profile.role || "inspector").toLowerCase();
    const status = TEAM_STATUS_VALUES.has(String(clean.liveStatus || "")) ? String(clean.liveStatus) : "NOT STARTED";
    const teamVisible = profile.active !== false && ["owner", "inspector"].includes(role);
    await db.collection("teamPresence").doc(user.uid).set({
      userId: user.uid,
      name: String(profile.name || user.displayName || "MPI Team Member").slice(0, 80),
      role,
      photoURL: String(user.photoURL || profile.photoURL || "").slice(0, 1000),
      profilePhoto: String(profile.profilePhoto || "").slice(0, 220000),
      status,
      date: String(clean.date || ""),
      active: teamVisible,
      updatedAtClient: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(() => false);
    return true;
  }

  function watchTeamPresence(callback) {
    if (typeof callback !== "function") return () => {};
    return db.collection("teamPresence").where("active", "==", true).onSnapshot(snapshot => {
      const records = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => ["owner", "inspector"].includes(String(item.role || "").toLowerCase()))
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
    isCompanyEmail,
    isOwnerEmail,
    isAdminRole,
    knownInspectorNumber,
    signIn,
    completeRedirectSignIn,
    signOut,
    ensureProfile,
    watchSession,
    watchUpdates,
    setUpdateStatus,
    clearUpdate,
    replyToUpdate,
    sendPushNotification,
    loadOfficeAttachment,
    syncOperationsSnapshot,
    watchTeamPresence
  };
})();
