(function () {
  "use strict";
  // Local native navigation preserves the Firebase session and never opens Safari.
  document.addEventListener("click", event => {
    const link = event.target.closest("#mpiAdminReturn, #officeConsoleCard, #mpiSettingsAdminLink, a[aria-label='Return to Inspector App']");
    if (!link || !window.MPI_NATIVE?.isNative) return;
    event.preventDefault();
    const office = link.id !== "";
    const destination = new URL(office ? "./admin.html" : "./index.html?office=1#home", window.location.href);
    // URL.origin can be "null" for capacitor: while WKWebView reports the
    // custom app origin. Compare the actual scheme and host instead.
    const current = new URL(window.location.href);
    if (destination.protocol !== current.protocol || destination.host !== current.host) return;
    const notice = document.createElement("div");
    notice.setAttribute("role", "status");
    notice.style.cssText = "position:fixed;inset:auto 12px 100px;padding:18px;z-index:100000;border-radius:16px;background:#11186a;color:white;box-shadow:0 6px 30px #0003";
    notice.textContent = office ? "Opening Office Dashboard…" : "Returning to Inspector App…";
    document.body.append(notice);
    const timer = setTimeout(() => {
      notice.textContent = "This screen could not open. Your workday is unchanged. ";
      const back = document.createElement("button");
      back.textContent = "Stay here";
      back.onclick = () => notice.remove();
      notice.append(back);
    }, 8000);
    window.addEventListener("pagehide", () => clearTimeout(timer), { once: true });
    window.location.assign(destination.href);
  });

  if (!document.getElementById("adminDashboard")) return;
  if (new URLSearchParams(location.search).get("field") === "1") return;
  // Maps are optional enhancements, not prerequisites for opening the console.
  async function loadMaps() {
    const native = Boolean(window.MPI_NATIVE?.isNative);
    const urls = native ? ["./vendor/leaflet.js", "./vendor/maplibre-gl.js", "./vendor/leaflet-maplibre-gl.js"] : [
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
      "https://unpkg.com/maplibre-gl@5.15.0/dist/maplibre-gl.js",
      "https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js"
    ];
    try {
      for (const url of urls) await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const timeout = setTimeout(() => { script.remove(); reject(new Error("Map unavailable")); }, 10000);
        script.onload = () => { clearTimeout(timeout); resolve(); };
        script.onerror = () => { clearTimeout(timeout); reject(new Error("Map unavailable")); };
        script.src = url;
        document.head.append(script);
      });
      window.dispatchEvent(new CustomEvent("mpi-office-map-ready"));
    } catch (_) {
      const status = document.getElementById("adminLiveLocationStatus");
      if (status) status.textContent = "Map temporarily unavailable. Team status and the rest of Office Console remain available.";
      window.dispatchEvent(new CustomEvent("mpi-office-map-ready"));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadMaps, { once: true });
  else loadMaps();
})();
