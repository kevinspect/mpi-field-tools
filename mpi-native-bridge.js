(function () {
  "use strict";

  const capacitor = window.Capacitor;
  const platform = capacitor?.getPlatform?.() || "web";
  const isNative = Boolean(capacitor?.isNativePlatform?.() && platform !== "web");
  const plugins = capacitor?.Plugins || {};
  const registerPlugin = name => plugins[name] || capacitor?.registerPlugin?.(name) || null;
  const backgroundLocation = isNative ? registerPlugin("MPIBackgroundLocation") : null;
  const localNotifications = isNative ? registerPlugin("LocalNotifications") : null;
  const firebaseAuthentication = isNative ? registerPlugin("FirebaseAuthentication") : null;
  const firebaseMessaging = isNative ? registerPlugin("FirebaseMessaging") : null;
  const haptics = isNative ? registerPlugin("Haptics") : null;
  const app = isNative ? registerPlugin("App") : null;
  const browser = isNative ? registerPlugin("Browser") : null;

  function nativePosition(point) {
    const latitude = Number(point?.latitude);
    const longitude = Number(point?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const timestamp = Date.parse(point?.timestamp || "") || Date.now();
    return {
      coords: {
        latitude,
        longitude,
        accuracy: Math.max(0, Number(point?.accuracyMeters || 0)),
        altitude: Number.isFinite(Number(point?.altitude)) ? Number(point.altitude) : null,
        altitudeAccuracy: Number.isFinite(Number(point?.verticalAccuracy)) ? Number(point.verticalAccuracy) : null,
        heading: Number.isFinite(Number(point?.heading)) && Number(point.heading) >= 0 ? Number(point.heading) : null,
        speed: Number.isFinite(Number(point?.speedMetersPerSecond)) && Number(point.speedMetersPerSecond) >= 0
          ? Number(point.speedMetersPerSecond)
          : null
      },
      timestamp,
      nativeId: String(point?.id || ""),
      nativeContext: {
        userId: String(point?.userId || ""),
        workDate: String(point?.workDate || ""),
        workStatus: String(point?.workStatus || "")
      }
    };
  }

  async function locationPermission() {
    if (!backgroundLocation?.checkPermissions) return { location: "unavailable" };
    return backgroundLocation.checkPermissions();
  }

  async function requestLocationPermission() {
    if (!backgroundLocation?.requestPermissions) return { location: "unavailable" };
    return backgroundLocation.requestPermissions();
  }

  async function startWorkdayLocation(context) {
    if (!backgroundLocation?.start) return { active: false, native: false };
    return backgroundLocation.start({
      userId: String(context?.userId || ""),
      workDate: String(context?.workDate || ""),
      workStatus: String(context?.workStatus || "READY / WAITING TO DEPART")
    });
  }

  async function updateWorkdayLocationContext(context) {
    if (!backgroundLocation?.setContext) return { active: false, native: false };
    return backgroundLocation.setContext({
      userId: String(context?.userId || ""),
      workDate: String(context?.workDate || ""),
      workStatus: String(context?.workStatus || "")
    });
  }

  async function stopWorkdayLocation() {
    if (!backgroundLocation?.stop) return { active: false, native: false };
    return backgroundLocation.stop();
  }

  async function pendingLocations() {
    if (!backgroundLocation?.getPendingLocations) return [];
    const result = await backgroundLocation.getPendingLocations();
    return (Array.isArray(result?.locations) ? result.locations : []).map(nativePosition).filter(Boolean);
  }

  async function acknowledgeLocations(ids) {
    const values = (Array.isArray(ids) ? ids : []).map(String).filter(Boolean);
    if (!values.length || !backgroundLocation?.acknowledgeLocations) return { removed: 0 };
    return backgroundLocation.acknowledgeLocations({ ids: values });
  }

  function notificationId(value) {
    const numeric = Number(value);
    if (Number.isInteger(numeric) && numeric > 0 && numeric < 2147483647) return numeric;
    const input = String(value || Date.now());
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return Math.max(1, Math.abs(hash | 0));
  }

  async function scheduleAlarm(options) {
    if (!localNotifications?.schedule) return false;
    const permission = await localNotifications.checkPermissions?.();
    if (permission?.display !== "granted") await localNotifications.requestPermissions?.();
    await localNotifications.schedule({
      notifications: [{
        id: notificationId(options?.id),
        title: String(options?.title || "MPI Field Tools"),
        body: String(options?.body || "Open MPI Field Tools."),
        schedule: options?.at ? { at: new Date(options.at), allowWhileIdle: true } : undefined,
        sound: String(options?.sound || "mpi_alarm.wav"),
        extra: options?.extra || {}
      }]
    });
    return notificationId(options?.id);
  }

  async function cancelAlarms(ids) {
    const notifications = (Array.isArray(ids) ? ids : [ids])
      .map(id => ({ id: notificationId(id) }))
      .filter(item => Number.isInteger(item.id) && item.id > 0);
    if (!notifications.length || !localNotifications?.cancel) return false;
    await localNotifications.cancel({ notifications });
    return true;
  }

  async function signInWithGoogle(scopes = []) {
    if (!firebaseAuthentication?.signInWithGoogle) throw new Error("Native Google sign-in is unavailable.");
    return firebaseAuthentication.signInWithGoogle({
      skipNativeAuth: false,
      scopes: (Array.isArray(scopes) ? scopes : []).map(String).filter(Boolean)
    });
  }

  async function signOut() {
    if (!firebaseAuthentication?.signOut) return false;
    await firebaseAuthentication.signOut();
    return true;
  }

  async function openWebPage(url) {
    const target = new URL(String(url || ""), window.location.href);
    if (!/^https?:$/.test(target.protocol)) throw new Error("That web address cannot be opened.");
    if (!browser?.open) {
      window.location.assign(target.href);
      return true;
    }
    await browser.open({ url: target.href, presentationStyle: "fullscreen" });
    return true;
  }

  async function pushPermission() {
    if (!firebaseMessaging?.checkPermissions) return { receive: "unavailable" };
    return firebaseMessaging.checkPermissions();
  }

  async function enablePushNotifications() {
    if (!firebaseMessaging?.getToken) throw new Error("Native MPI notifications are unavailable.");
    let permission = await pushPermission();
    if (permission?.receive === "prompt") permission = await firebaseMessaging.requestPermissions();
    if (permission?.receive !== "granted") throw new Error("Notifications are blocked in iPhone Settings.");
    const result = await firebaseMessaging.getToken();
    const token = String(result?.token || "").trim();
    if (!token) throw new Error("The phone did not return an MPI notification token.");
    try { localStorage.setItem("mpiPushTokenV1", token); } catch (_) {}
    window.dispatchEvent(new CustomEvent("mpi-push-token-ready", { detail: { token, native: true } }));
    return { token, permission: "granted" };
  }

  function notificationRoute(event) {
    const notification = event?.notification || event || {};
    const data = notification?.data && typeof notification.data === "object" ? notification.data : {};
    return String(data.link || data.url || notification.link || "").trim();
  }

  function openNotificationRoute(event) {
    const route = notificationRoute(event);
    if (!route) return;
    try {
      const url = new URL(route, location.href);
      if (url.searchParams.has("team")) {
        const team = url.searchParams.get("team");
        const current = new URL(location.href);
        if (team) current.searchParams.set("team", team);
        current.hash = url.hash || "#team-messages";
        history.replaceState(null, "", current.toString());
        window.dispatchEvent(new PopStateEvent("popstate"));
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        return;
      }
      if (url.hash) location.hash = url.hash;
    } catch (_) {}
  }

  function openExternalAppRoute(event) {
    const supplied = String(event?.url || "").trim();
    if (!supplied) return false;
    try {
      const incoming = new URL(supplied);
      if (incoming.protocol !== "mpifieldtools:" || incoming.hostname !== "activate") return false;
      const subcontractor = String(incoming.searchParams.get("subcontractor") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      const access = String(incoming.searchParams.get("access") || "").trim();
      if (!subcontractor || !/^[A-Za-z0-9_-]{32,120}$/.test(access)) return false;
      const destination = new URL(window.location.href);
      destination.search = "";
      destination.searchParams.set("subcontractor", subcontractor);
      destination.searchParams.set("access", access);
      destination.hash = "#subcontractor-home";
      window.location.replace(destination.toString());
      return true;
    } catch (_) {
      return false;
    }
  }

  async function addAppLinkListeners() {
    if (!app) return;
    if (app.addListener) await app.addListener("appUrlOpen", openExternalAppRoute);
    if (app.getLaunchUrl) {
      const launch = await app.getLaunchUrl();
      if (launch?.url) openExternalAppRoute(launch);
    }
  }

  async function prominentHaptic() {
    try { await haptics?.vibrate?.({ duration: 900 }); }
    catch (_) {}
  }

  async function addLocationListener(handler) {
    if (!backgroundLocation?.addListener || typeof handler !== "function") return { remove() {} };
    return backgroundLocation.addListener("locationUpdate", event => {
      const position = nativePosition(event);
      if (position) handler(position);
    });
  }

  async function addResumeListener(handler) {
    if (!app?.addListener || typeof handler !== "function") return { remove() {} };
    return app.addListener("appStateChange", state => {
      if (state?.isActive) handler();
    });
  }

  async function addNotificationListeners() {
    if (!firebaseMessaging?.addListener) return;
    await firebaseMessaging.addListener("tokenReceived", event => {
      const token = String(event?.token || "").trim();
      if (!token) return;
      try { localStorage.setItem("mpiPushTokenV1", token); } catch (_) {}
      window.dispatchEvent(new CustomEvent("mpi-push-token-ready", { detail: { token, native: true } }));
    });
    await firebaseMessaging.addListener("notificationReceived", event => {
      window.dispatchEvent(new CustomEvent("mpi-native-notification", { detail: event }));
    });
    await firebaseMessaging.addListener("notificationActionPerformed", event => {
      openNotificationRoute(event);
      window.dispatchEvent(new CustomEvent("mpi-native-notification-opened", { detail: event }));
    });
    if (localNotifications?.addListener) {
      await localNotifications.addListener("localNotificationActionPerformed", event => {
        openNotificationRoute(event);
        window.dispatchEvent(new CustomEvent("mpi-native-notification-opened", { detail: event }));
      });
    }
  }

  window.MPI_NATIVE = Object.freeze({
    isNative,
    platform,
    locationPermission,
    requestLocationPermission,
    startWorkdayLocation,
    updateWorkdayLocationContext,
    stopWorkdayLocation,
    pendingLocations,
    acknowledgeLocations,
    notificationId,
    scheduleAlarm,
    cancelAlarms,
    signInWithGoogle,
    signOut,
    openWebPage,
    pushPermission,
    enablePushNotifications,
    prominentHaptic,
    addLocationListener,
    addResumeListener
  });

  document.documentElement.classList.toggle("mpi-native-app", isNative);
  if (isNative) {
    addNotificationListeners().catch(() => {});
    addAppLinkListeners().catch(() => {});
  }
  window.dispatchEvent(new CustomEvent("mpi-native-ready", { detail: { isNative, platform } }));
})();
