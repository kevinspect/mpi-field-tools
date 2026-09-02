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
  const MPI_INSPECTOR_NUMBERS = {
    "corey@michiganpropertyinspections.com": "NACHI26090138",
    "correy@michiganpropertyinspections.com": "NACHI26090138"
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
    return /\bcor+ey\b/.test(name) ? "NACHI26090138" : "";
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

  function replyToUpdate(updateId, user, profile, message) {
    const replyText = String(message || "").trim().slice(0, 1000);
    if (!updateId || !user || !replyText) return Promise.reject(new Error("Write a reply first."));
    return db.collection("officeUpdates").doc(updateId).collection("receipts").doc(user.uid).set({
      userId: user.uid,
      userEmail: normalizeEmail(user.email),
      userName: profile?.name || user.displayName || "MPI Team Member",
      status: "replied",
      replyText,
      repliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  function cleanOperationsValue(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => item === undefined ? null : item));
  }

  async function syncOperationsSnapshot(snapshot) {
    const user = auth.currentUser;
    if (!user || !snapshot?.date) return false;
    const ref = db.collection("users").doc(user.uid);
    const current = await ref.get();
    const existingDays = Array.isArray(current.data()?.operationsDays) ? current.data().operationsDays : [];
    const clean = cleanOperationsValue(snapshot);
    const days = existingDays
      .filter(day => day?.date && day.date !== clean.date)
      .concat(clean)
      .sort((left, right) => String(left.date).localeCompare(String(right.date)))
      .slice(-8);
    await ref.set({
      operationsCurrent: clean,
      operationsDays: days,
      operationsUpdatedAt: serverTimestamp()
    }, { merge: true });
    return true;
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
    syncOperationsSnapshot
  };
})();
