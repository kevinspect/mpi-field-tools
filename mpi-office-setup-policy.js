(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  if (root) root.MPI_OFFICE_SETUP_POLICY = policy;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const VERSION = 2;
  const STORAGE_PREFIX = "mpiOfficeMacSetupV2:";
  const HEALTH_INTERVAL_MS = 12 * 60 * 60 * 1000;
  const eligible = profile => ["owner", "admin"].includes(String(profile?.role || "").toLowerCase()) && profile?.active !== false;
  const storageKey = uid => `${STORAGE_PREFIX}${String(uid || "unknown")}`;
  const isMac = (platform = "", userAgent = "", touchPoints = 0) => /mac/i.test(`${platform} ${userAgent}`) && Number(touchPoints || 0) < 2;
  const isInstalled = (standalone = false, displayModeStandalone = false) => Boolean(standalone || displayModeStandalone);
  const ready = checks => ["installed", "version", "notifications", "messaging", "liveUpdates", "adminServices"].every(key => checks?.[key] === true);
  return Object.freeze({ VERSION, STORAGE_PREFIX, HEALTH_INTERVAL_MS, eligible, storageKey, isMac, isInstalled, ready });
});
