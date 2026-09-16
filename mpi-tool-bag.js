(function () {
  "use strict";
  let user = null, profile = null, stop = null, loadedUid = "", records = [], returnHash = "#tools";
  const officeSubscribers = new Set();
  const escape = value => String(value || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const css = document.createElement("style");
  css.textContent = '.tool-bag-overlay{position:fixed;inset:80px 0 88px;z-index:500;background:#f5f7fb;overflow:auto;padding:16px}.tool-bag-overlay[hidden]{display:none}.tool-bag-head{display:flex;gap:12px;align-items:center;position:sticky;top:-16px;background:#f5f7fb;padding:12px 0;z-index:1}.tool-bag-head h2{margin:0;flex:1;font:700 22px system-ui;color:#11186a}.tool-bag-overlay button,.tool-bag-overlay a{min-height:44px;padding:10px 14px;border-radius:12px;font:600 14px system-ui}.tool-bag-overlay button{background:#11186a;color:#fff;border:0}.tool-bag-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}.tool-bag-card,.tool-bag-guide{background:white;border:1px solid #dbe3ee;border-radius:18px;padding:18px;color:#11186a}.tool-bag-card img{width:100%;height:130px;object-fit:contain}.tool-bag-card h3{font:700 17px system-ui}.tool-bag-card p,.tool-bag-guide li,.tool-bag-guide p{font:14px/1.6 system-ui;color:#586681}.tool-bag-card button{width:100%}.tool-bag-guide h3{font:700 20px system-ui}.tool-bag-guide h4{margin:22px 0 8px}.tool-bag-guide a{display:inline-block;color:#2768a9}.tool-bag-issue-frame{width:100%;height:calc(100dvh - 245px);border:0;border-radius:16px;background:white}';
  document.head.append(css);
  const screen = document.createElement("section"); screen.className = "tool-bag-overlay"; screen.hidden = true; screen.setAttribute("aria-label", "My tool bag");
  screen.innerHTML = '<header class="tool-bag-head"><button type="button" data-bag-back>Back</button><h2>My Tool Bag</h2><button type="button" id="fieldIssueEquipment" hidden>Issue equipment</button></header><p id="toolBagStatus"></p><div id="toolBagContent"></div>';
  document.body.append(screen);
  const content = screen.querySelector("#toolBagContent"), status = screen.querySelector("#toolBagStatus"), issue = screen.querySelector("#fieldIssueEquipment");
  const existingCard = document.querySelector('a.home-tool-card[href="#tool-guides"]');
  const issueShortcut = existingCard?.cloneNode(true);
  if (issueShortcut) {
    issueShortcut.href = "#issue-equipment"; issueShortcut.hidden = true;
    issueShortcut.querySelector("strong").textContent = "Equipment";
    issueShortcut.querySelector("small").textContent = "Issue tools in the field and create the signed handover.";
    existingCard.before(issueShortcut);
  }
  function canIssue() { return !window.MPI_OWNER_PREVIEW && profile?.active !== false && ["owner", "admin"].includes(profile?.role) && String(user?.email || "").toLowerCase() === "kev@michiganpropertyinspections.com" && window.MPI_SHARED?.auth.currentUser?.uid === user?.uid; }
  function guideFor(record) { return window.MPI_EQUIPMENT?.byId(record.toolId || record.catalogId || record.id?.split("_").slice(1).join("_")) || window.MPI_EQUIPMENT?.tools.find(tool => tool.name === record.toolName); }
  function render() {
    if (screen.hidden) return;
    const bag = records.filter(record => record.employeeId === user?.uid && record.active !== false && !["Not Issued", "Returned"].includes(record.status));
    status.textContent = `${bag.length} issued tool${bag.length === 1 ? "" : "s"} · guides stay with each tool. Equipment not yet handed over is not shown as issued.`;
    content.innerHTML = bag.length ? '<div class="tool-bag-grid">' + bag.map(record => {
      const guide = guideFor(record);
      return `<article class="tool-bag-card">${guide?.image ? `<img src="${escape(guide.image)}" alt="${escape(record.toolName)}">` : ""}<h3>${escape(record.toolName)}</h3><p>${escape(record.status)}${record.serialNumber ? ` · ${escape(record.serialNumber)}` : ""}</p><p>${escape(record.brand || guide?.brand)} ${escape(record.model || guide?.model)}</p><button type="button" data-bag-guide="${escape(record.id)}" ${guide ? "" : "disabled"}>${guide ? "USER GUIDE" : "Guide not added yet"}</button></article>`;
    }).join("") + '</div>' : '<article class="tool-bag-card"><h3>No issued tools yet</h3><p>Your issued items and their operating guides will appear here after the equipment handover is recorded.</p></article>';
  }
  function openGuide(id) {
    const record = records.find(item => item.id === id && item.employeeId === user?.uid);
    const guide = record && guideFor(record);
    if (!guide) return;
    const sections = [["Purpose", [guide.purpose]], ["When to use", guide.when], ["Setup", guide.setup], ["Operating steps", guide.steps], ["What to record", guide.record], ["Limitations", guide.limitations], ["Safety", guide.safety], ["Cleaning and storage", guide.care], ["Battery / charging", guide.battery], ["Troubleshooting", guide.troubleshooting], ["Stop work", guide.stop]];
    content.innerHTML = `<article class="tool-bag-guide"><button type="button" data-bag-list>Back to Tool Bag</button><h3>${escape(record.toolName)}</h3>${sections.filter(([, items]) => items?.length).map(([title, items]) => `<h4>${title}</h4><ul>${items.map(item => `<li>${escape(item)}</li>`).join("")}</ul>`).join("")}${(guide.links || []).filter(link => /^https:\/\//i.test(link.url)).map(link => `<a href="${escape(link.url)}" data-native-browser>${escape(link.label)}</a>`).join("")}</article>`;
    screen.scrollTop = 0;
  }
  function load() {
    if (!user || loadedUid === user.uid) { render(); return; }
    stop?.(); loadedUid = user.uid;
    status.textContent = "Loading your issued equipment…";
    const uid = user.uid;
    try { records = JSON.parse(localStorage.getItem(`mpiToolBagCacheV1:${uid}`) || "[]"); if (records.length) { render(); status.textContent += " · Last-synced equipment"; } } catch (_) {}
    stop = window.MPI_SHARED.db.collection("equipmentAssignments").where("employeeId", "==", uid).onSnapshot(snapshot => {
      if (user?.uid !== uid) return;
      records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      try { localStorage.setItem(`mpiToolBagCacheV1:${uid}`, JSON.stringify(records)); } catch (_) {}
      if (!content.querySelector("iframe,.tool-bag-guide")) render();
    }, () => { loadedUid = ""; status.textContent = "Equipment sync is delayed. Your records are unchanged. Reopen Tool Bag when the connection returns."; });
  }
  function route() {
    if (location.hash === "#tool-guides" && !new URLSearchParams(location.search).has("tool")) { location.hash = "#tool-bag"; return; }
    const showing = location.hash === "#tool-bag" || location.hash === "#issue-equipment";
    screen.hidden = !showing;
    if (!showing) { stop?.(); stop = null; loadedUid = ""; content.replaceChildren(); returnHash = location.hash || "#home"; return; }
    issue.hidden = !canIssue();
    if (location.hash === "#issue-equipment" && canIssue()) {
      status.textContent = "Company equipment handover · uses the same issue records and signed acknowledgement as Office Console.";
      if (!content.querySelector("iframe")) {
        const frame = document.createElement("iframe"); frame.className = "tool-bag-issue-frame"; frame.title = "Issue company equipment"; frame.src = "./admin.html?view=equipment&field=1"; content.replaceChildren(frame);
      }
      return;
    }
    load();
  }
  issue.addEventListener("click", () => { location.hash = "#issue-equipment"; });
  screen.addEventListener("click", event => {
    if (event.target.closest("[data-bag-back]")) location.hash = location.hash === "#issue-equipment" ? "#tool-bag" : returnHash;
    if (event.target.closest("[data-bag-list]")) render();
    const id = event.target.closest("[data-bag-guide]")?.dataset.bagGuide; if (id) openGuide(id);
  });
  window.addEventListener("hashchange", route);
  window.MPI_TOOL_BAG = Object.freeze({ setContext(nextUser, nextProfile) {
    const changed = user?.uid !== nextUser?.uid;
    user = nextUser; profile = nextProfile;
    officeSubscribers.forEach(notify => notify());
    if (changed) { stop?.(); stop = null; records = []; loadedUid = ""; content.replaceChildren(); }
    issue.hidden = !canIssue(); if (issueShortcut) issueShortcut.hidden = !canIssue();
    route();
  }, officeSession(childWindow) {
    const trusted = () => canIssue() && location.hash === "#issue-equipment" && content.querySelector(".tool-bag-issue-frame")?.contentWindow === childWindow;
    if (!trusted()) return null;
    // The handover is another view of the SAME verified owner session, not an
    // account switch. Do not start another Firebase instance or profile read.
    return { shared: window.MPI_SHARED, watchSession(callback) {
      const notify = () => callback(trusted() ? { user, profile, error: null } : { user: null, profile: null, error: null });
      officeSubscribers.add(notify);
      const stopAuth = window.MPI_SHARED.auth.onAuthStateChanged(notify);
      const unsubscribe = () => { officeSubscribers.delete(notify); stopAuth(); };
      childWindow.addEventListener("pagehide", unsubscribe, { once: true });
      queueMicrotask(notify);
      return unsubscribe;
    } };
  } });
  document.querySelectorAll('a[href="#tool-guides"]').forEach(link => { link.href = "#tool-bag"; const label = link.querySelector("strong"); if (label) label.textContent = "My Tool Bag"; else link.textContent = "My Tool Bag & User Guides"; });
  route();
})();
