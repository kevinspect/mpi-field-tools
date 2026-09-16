import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { resolve, extname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { chromium, webkit } = require("/Users/kevincave/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root = fileURLToPath(new URL("../", import.meta.url));
let nativeClick, assigned = "";
vm.runInNewContext(await readFile(new URL("../mpi-office-navigation.js", import.meta.url), "utf8"), {
  URL, setTimeout: () => 1, clearTimeout() {},
  document: { addEventListener: (_, callback) => { nativeClick = callback; }, getElementById: () => null, createElement: () => ({ setAttribute() {}, style: {} }), body: { append() {} } },
  window: { MPI_NATIVE: { isNative: true }, location: { href: "capacitor://localhost/index.html#home", origin: "capacitor://localhost", assign: value => { assigned = value; } }, addEventListener() {} }
});
nativeClick({ target: { closest: () => ({ id: "mpiAdminReturn" }) }, preventDefault() {} });
assert.equal(assigned, "capacitor://localhost/admin.html");
console.log("PASS Native custom-scheme navigation does not confuse URL.origin with WKWebView's app origin.");
const server = createServer(async (request, response) => {
  try {
    const path = resolve(root, "." + new URL(request.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
    if (!path.startsWith(root)) throw new Error("Invalid path");
    response.setHeader("Content-Type", ({ ".js": "text/javascript", ".html": "text/html", ".json": "application/json", ".css": "text/css" })[extname(path)] || "application/octet-stream");
    response.end(await readFile(path));
  } catch (_) { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const browser = process.env.MPI_TEST_WEBKIT
  ? await webkit.launch({ headless: true })
  : await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const errors = [], external = [];
async function auditControls(surface, label) {
  const clipped = await surface.evaluate(() => [...document.querySelectorAll("button,a[role=button],.app-bottom-nav a")].filter(button => {
    const box = button.getBoundingClientRect(), style = getComputedStyle(button);
    return box.width && box.height && style.visibility !== "hidden" && (button.scrollWidth > button.clientWidth + 2 || button.scrollHeight > button.clientHeight + 2);
  }).map(button => ({ id: button.id, text: button.textContent.trim().slice(0, 80), width: button.clientWidth, contentWidth: button.scrollWidth, height: button.clientHeight, contentHeight: button.scrollHeight })));
  assert.deepEqual(clipped, [], `${label}: button labels must stay inside their controls`);
  const overflow = await surface.evaluate(() => ({ width: innerWidth, pageWidth: document.documentElement.scrollWidth, items: [...document.querySelectorAll("body *")].filter(node => {
    const box = node.getBoundingClientRect(); return box.width && box.right > innerWidth + 1;
  }).slice(0, 8).map(node => ({ tag: node.tagName, id: node.id, class: node.className, right: node.getBoundingClientRect().right })) }));
  assert.ok(overflow.pageWidth <= overflow.width + 1, `${label}: no horizontal page overflow: ${JSON.stringify(overflow)}`);
}
page.on("pageerror", error => errors.push(error.message));
const sdk = `(() => {const q={where(){return this},orderBy(){return this},limit(){return this},onSnapshot(){return()=>{}},get:async()=>({docs:[]}),doc:()=>({get:async()=>({exists:false}),onSnapshot:()=>()=>{},set:async()=>{throw Error('Unexpected write')}})};const db={collection:()=>q,collectionGroup:()=>q,enablePersistence:async()=>{}};const auth={currentUser:null,setPersistence:async()=>{},onAuthStateChanged:cb=>{queueMicrotask(()=>cb(null));return()=>{}}};const af=()=>auth;af.Auth={Persistence:{LOCAL:'local'}};const ff=()=>db;ff.FieldValue={serverTimestamp:()=>new Date().toISOString(),arrayUnion:(...x)=>x};window.firebase={apps:[{}],app:()=>({auth:af,firestore:ff}),initializeApp(){},auth:af,firestore:ff};})();`;
await page.route("https://**/*", route => {
  if (route.request().url().includes("firebase-app-compat")) return route.fulfill({ contentType: "text/javascript", body: sdk });
  external.push(route.request().url());
  return route.abort();
});
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/admin.html?preview=1`);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" });
  const profiles = [
    { id: "kevin", email: "kev@michiganpropertyinspections.com", name: "Kevin Cave", role: "owner", active: true, inspectorId: "NACHI24060423" },
    { id: "brooke", email: "admin@michiganpropertyinspections.com", name: "Brooke", role: "admin", active: true },
    { id: "adrienne", email: "adrienne@michiganpropertyinspections.com", name: "Adrienne Cave", role: "owner", active: true },
    { id: "cory", email: "cory@michiganpropertyinspections.com", name: "Cory Leese", role: "inspector", active: true, inspectorId: "NACHI26090138", notificationDevice: { token: "DO-NOT-COPY" }, operationsCurrent: { date: today, liveStatus: "CLOCKED OUT", jobs: [], timeClock: { hoursWorkedStartedAt: `${today}T09:00:00-04:00`, sessions: [{ clockedInAt: `${today}T09:00:00-04:00`, clockedOutAt: `${today}T12:00:00-04:00`, startSource: "nachi-training" }] } } },
    { id: "jason", email: "", name: "Jason Chamarro", role: "subcontractor", active: true }
  ];
  profiles[0].fieldRequests = [{ id: "safety-glasses", type: "PPE or safety equipment", item: "Replacement safety glasses", details: "Please replace my scratched safety glasses.", status: "in-progress", requestedAt: `${today}T09:00:00-04:00`, assignedAdmin: profiles[1].email, managementNote: "Order placed; awaiting delivery.", reviewedAt: `${today}T10:00:00-04:00` }];
  profiles[1].fieldRequests = [{ id: "client-credit", type: "Office follow-up", item: "Sewer scope credit", details: "Confirm the client credit following the cancelled sewer scope.", status: "waiting", requestedAt: `${today}T11:00:00-04:00`, assignedAdmin: profiles[0].email, managementNote: "Waiting for confirmation from accounting.", reviewedAt: `${today}T11:05:00-04:00` }];
  profiles[3].appDiagnostics = [{ id: "preserved-diagnostic", status: "INVESTIGATING", createdAt: `${today}T10:00:00-04:00`, summary: "Existing connection report" }];
  const messages = {
    directMessages: [{ id: "private-message", conversationId: "brooke__kevin", participantIds: ["brooke", "kevin"], senderUid: "kevin", senderName: "Kevin Cave", targetUid: "brooke", targetName: "Brooke", message: "Thank you. Please confirm when the replacement arrives.", createdAtClient: `${today}T14:00:00-04:00`, active: true, readBy: ["kevin", "brooke"] }],
    fieldMessages: [
      { id: "coc-message", kind: "lab-coc", senderUid: "cory", senderName: "Cory Leese", message: "Chain of Custody photo recorded at IMS Laboratory.", createdAtClient: `${today}T13:00:00-04:00`, readBy: ["brooke"], attachments: [] },
      { id: "safety-message", kind: "safety-alert", senderUid: "jason", senderName: "Jason Chamarro", message: "Near miss reported. Please review the safety follow-up.", createdAtClient: `${today}T12:00:00-04:00`, readBy: ["brooke"], attachments: [] }
    ]
  };
  await page.evaluate(({ profiles, messages }) => {
    window.testProfiles = profiles;
    window.MPI_SHARED.auth = { currentUser: { uid: "kevin", email: profiles[0].email } };
    window.MPI_OWNER_VIEW.setContext(window.MPI_SHARED.auth.currentUser, profiles[0]);
    window.MPI_OWNER_VIEW.setData({ people: profiles, ...messages });
  }, { profiles, messages });
  assert.equal(await page.locator("#mpiOwnerViewButton").isVisible(), true);
  await page.click("#mpiOwnerViewButton");
  await page.selectOption("#ownerViewUser", "cory");
  await page.waitForFunction(() => document.querySelector("#ownerViewStatus").textContent.startsWith("Cory Leese · "));
  await page.frameLocator(".owner-view-frame").locator(".app-bottom-nav").waitFor();
  const frame = await (await page.locator(".owner-view-frame").elementHandle()).contentFrame();
  await frame.waitForFunction(() => window.MPI_COMPANY_SESSION?.userId === "cory");
  await frame.waitForSelector(".app-bottom-nav");
  for (const viewport of [{ width: 1280, height: 800 }, { width: 393, height: 852 }, { width: 430, height: 932 }]) {
    await page.setViewportSize(viewport);
    const dock = await frame.locator(".app-bottom-nav").boundingBox();
    const toolbar = await page.locator(".owner-view-toolbar").boundingBox();
    assert.ok(dock && dock.y >= toolbar.y + toolbar.height - 1 && dock.y + dock.height <= viewport.height + 1,
      `Cory's menu must fit below the preview toolbar and inside ${viewport.width} × ${viewport.height}: ${JSON.stringify({ dock, toolbar })}`);
    for (const route of ["home", "job-companion", "inbox", "field-tools", "training-center"]) {
      await frame.locator(`.app-bottom-nav a[href='#${route}']`).click();
      await frame.waitForFunction(route => location.hash === `#${route}`, route);
      await auditControls(frame, `Cory ${viewport.width} ${route}`);
      if (process.env.MPI_VISUAL_QA && [393, 1280].includes(viewport.width)) {
        await mkdir("/tmp/mpi-build200-visuals", { recursive: true });
        await page.screenshot({ path: `/tmp/mpi-build200-visuals/cory-${viewport.width}-${route}.png` });
      }
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  assert.equal(await frame.evaluate(() => window.MPI_COMPANY_SESSION.userId), "cory");
  assert.equal(await frame.evaluate(() => window.MPI_SHARED.auth.currentUser.uid), "cory");
  assert.equal(await page.evaluate(() => window.MPI_SHARED.auth.currentUser.uid), "kevin");
  assert.equal(await frame.evaluate(() => { try { return Boolean(parent.MPI_SHARED); } catch (_) { return false; } }), false);
  assert.equal(await frame.evaluate(() => document.documentElement.outerHTML.includes("DO-NOT-COPY")), false);
  assert.equal(await frame.evaluate(() => origin), "null", "The preview must retain its opaque sandbox origin");
  assert.equal(await frame.evaluate(() => document.querySelector("#workflowClockOffBtn")?.disabled ?? true), true);
  assert.equal(await frame.evaluate(async () => { try { await window.MPI_SHARED.db.collection("users").doc("cory").set({ name: "Changed" }); return false; } catch (_) { return true; } }), true);
  await page.selectOption("#ownerViewUser", "brooke");
  await page.selectOption("#ownerViewSurface", "office");
  await page.waitForFunction(() => document.querySelector("#ownerViewStatus").textContent.startsWith("Brooke · "));
  await page.frameLocator(".owner-view-frame").locator("#adminAccountName").filter({ hasText: "Brooke" }).waitFor();
  const office = await (await page.locator(".owner-view-frame").elementHandle()).contentFrame();
  await office.waitForFunction(() => window.MPI_COMPANY_SESSION?.userId === "brooke" && document.body.classList.contains("mpi-office-ui"));
  await office.waitForSelector("#adminDashboard:not([hidden])");
  assert.equal(await office.locator("main").evaluate(node => [...node.childNodes].filter(child => child.nodeType === 3).every(child => !child.textContent.trim())), true, "No stray markup is rendered as page text");
  assert.equal(await office.locator("#commentUsagePanel").isVisible(), false);
  assert.equal(await office.locator("#adminAccountName").textContent(), "Brooke");
  assert.equal(await office.locator("#adminPublishButton").isDisabled(), true);
  for (const viewport of [{ width: 1280, height: 800 }, { width: 820, height: 900 }, { width: 393, height: 852 }]) {
    await page.setViewportSize(viewport);
    const views = await office.locator(".tabbar [data-admin-view]").evaluateAll(buttons => [...new Set(buttons.map(button => button.dataset.adminView))]);
    assert.equal(views.length, 6, "App issues no longer occupies a main workspace section");
    assert.equal(await office.locator("[data-admin-view='diagnostics']").count(), 0);
    for (const view of views) {
      await office.locator(`.tabbar [data-admin-view='${view}']`).click();
      assert.equal(await office.locator(".tabbar [aria-current='page']").count(), 1, "Exactly one current app section is announced");
      const sectionName = (await office.locator(`.tabbar [data-admin-view='${view}'] > span`).first().textContent()).trim();
      assert.equal((await office.locator("#adminWorkspaceTitle").textContent()).toLowerCase(), sectionName.toLowerCase(), "The app navigation title follows the active section");
      assert.equal(await office.locator("body").evaluate(node => getComputedStyle(node).getPropertyValue("--ui-navy").trim()), "#11186a", "The native-inspired finish preserves MPI navy");
      assert.equal(await office.locator("body").evaluate(node => getComputedStyle(node).getPropertyValue("--ui-gold").trim()), "#c89b27", "The native-inspired finish preserves MPI gold");
      if (view === "operations") {
        assert.equal(await office.locator("#adminRangePicker [aria-pressed='true']").count(), 1, "Reporting period has one selected segment");
        assert.equal(await office.locator(".office-welcome").isVisible(), true);
        assert.equal(await office.locator(".office-welcome h2").textContent(), "Full Service Home Inspections & Commercial Inspections");
        assert.equal(await office.locator(".office-welcome p").textContent(), "Everything You Need Under One Roof!");
        const brand = await office.locator(".office-welcome").evaluate(node => {
          const photo = node.querySelector('img'), copy = node.querySelector('div'), box = node.getBoundingClientRect(), picture = photo.getBoundingClientRect(), text = copy.getBoundingClientRect(), style = getComputedStyle(photo);
          return { width: box.width, imageWidth: picture.width, mask: style.maskImage, opacity: style.opacity, fits: text.top >= box.top && text.bottom <= box.bottom && text.left >= box.left && text.right <= box.right, alignment: getComputedStyle(node).textAlign, background: getComputedStyle(node).backgroundColor };
        });
        assert.ok(Math.abs(brand.imageWidth - brand.width * (viewport.width < 761 ? .48 : .58)) < 1, "House photograph uses the established compact MPI banner layout");
        assert.ok(brand.mask.includes("14%"), "The lighter Build 207 photo fade is preserved");
        assert.equal(brand.opacity, viewport.width < 761 ? "0.65" : "1", "Restoring the navy blend does not darken the photo beyond its previous transparency");
        assert.equal(brand.background, "rgb(17, 24, 106)");
        assert.equal(brand.alignment, "left");
        assert.ok(brand.fits, "Updated service copy fits inside the compact banner at every supported viewport");
        assert.equal(await office.locator(".office-planning-drawer[open]").count(), 0, "Planning controls are available without cluttering the live view");
        assert.equal(await office.locator("a[aria-label='Return to Inspector App']").isVisible(), viewport.width < 761, "Inspector app link is removed from desktop admins, retained for phone return navigation");
        if (viewport.width >= 1100) {
          const map = await office.locator("#adminLiveLocationPanel").boundingBox();
          const team = await office.locator("#adminTeamOverview").boundingBox();
          assert.ok(map.x + map.width <= team.x + 1, "Map and live team share a row in the desktop workbench");
        }
      }
      if (view === "people") {
        assert.equal(await office.locator(".person-card").count(), 5, "One profile per team member");
        assert.equal(await office.locator(".office-people-group").count(), 2, "Separate field and office groups");
        assert.equal(await office.locator("#adminTrainingList").isVisible(), false, "Qualifications no longer duplicate profiles on the main Team screen");
        await office.locator("[data-person-id='brooke'] > summary").click();
        await office.locator("[data-person-id='cory'] > summary").click();
        await office.waitForFunction(() => document.querySelectorAll('.person-card[open]').length === 1);
        assert.equal(await office.locator("[data-person-id='cory'][open]").count(), 1);
        await auditControls(office, `Office ${viewport.width} opened Team profile`);
        await office.locator("[data-person-id='cory'] > summary").click();
        await office.locator("[data-office-team-tab='qualifications']").click();
        assert.equal(await office.locator("#adminPeopleList").isVisible(), false);
        assert.equal(await office.locator(".training-admin-card").count(), 2, "Only relevant inspector training records appear");
        await auditControls(office, `Office ${viewport.width} Qualifications`);
        await office.locator("[data-office-team-tab='accounts']").click();
      }
      if (view === "requests") {
        assert.equal(await office.locator(".request-admin-card").count(), 2);
        assert.equal(await office.locator(".request-editor[open]").count(), 0, "Request queue opens with summaries, not a wall of editors");
        const height = await office.locator("#adminRequestStatusFilter").evaluate(node => node.getBoundingClientRect().height);
        assert.ok(height >= 44, "Safari and Chrome selects use the same full-height controls");
        await office.locator(".request-editor > summary").first().click();
        await office.evaluate(() => {
          const note = document.querySelector("[data-request-note]");
          note.value = "Typing must survive a queue refresh";
          note.dispatchEvent(new Event("input", { bubbles: true }));
          document.querySelector("#adminRequestSort").dispatchEvent(new Event("change", { bubbles: true }));
        });
        assert.equal(await office.locator("[data-request-note]").first().inputValue(), "Typing must survive a queue refresh");
        assert.equal(await office.locator(".request-editor[open]").count(), 1);
        await auditControls(office, `Office ${viewport.width} open request editor`);
        await office.locator(".request-editor > summary").first().click();
      }
      if (view === "updates") {
        assert.equal(await office.locator(".admin-message-avatar").count(), 3);
        const avatars = await office.locator(".admin-message-avatar").evaluateAll(nodes => nodes.map(node => {
          const box = node.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(node);
          const text = range.getBoundingClientRect();
          return { display: getComputedStyle(node).display, dx: Math.abs(text.x + text.width/2 - box.x - box.width/2), dy: Math.abs(text.y + text.height/2 - box.y - box.height/2) };
        }));
        assert.ok(avatars.every(avatar => avatar.display === "grid" && avatar.dx < 3 && avatar.dy < 4), `Message initials are centered, not clipped: ${JSON.stringify(avatars)}`);
        await office.locator("[data-admin-inbox-kind='direct']").click();
        await office.waitForSelector("#adminInboxConversation:not([hidden])");
        await auditControls(office, `Office ${viewport.width} focused private thread`);
        if (process.env.MPI_VISUAL_QA) await page.screenshot({ path: `/tmp/mpi-build200-visuals/office-${viewport.width}-private-thread.png` });
        await office.locator(".admin-conversation-back").click();
      }
      await auditControls(office, `Office ${viewport.width} ${view}`);
      if (process.env.MPI_VISUAL_QA) {
        await office.evaluate(() => scrollTo(0,0));
        await page.screenshot({ path: `/tmp/mpi-build200-visuals/office-${viewport.width}-${view}.png` });
        if (viewport.width === 1280) await office.locator("body").screenshot({ path: `/tmp/mpi-build200-visuals/desktop-${view}.png` });
        if (viewport.width === 1280) {
          // Inspect the actual rendered layout outside the preview's shorter iframe.
          // This static fixture cannot run scripts, authenticate, or access production.
          const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 1000 } });
          await staticContext.route("**/*", async route => {
            const url = new URL(route.request().url());
            if (url.hostname !== "mpi-layout.test") return route.abort();
            const path = resolve(root, "." + url.pathname);
            if (!path.startsWith(root + "/")) return route.abort();
            try { await route.fulfill({ body: await readFile(path), contentType: ({ ".png": "image/png", ".jpg": "image/jpeg", ".css": "text/css" })[extname(path)] || "application/octet-stream" }); }
            catch (_) { await route.abort(); }
          });
          const staticPage = await staticContext.newPage();
          let snapshot = await office.evaluate(() => {
            const copy = document.documentElement.cloneNode(true);
            const originals = [...document.querySelectorAll('input,textarea,select')];
            [...copy.querySelectorAll('input,textarea,select')].forEach((node,index) => {
              const original = originals[index];
              if (node.tagName === 'INPUT') { node.setAttribute('value',original.value); node.toggleAttribute('checked',original.checked); }
              if (node.tagName === 'TEXTAREA') node.textContent = original.value;
              if (node.tagName === 'SELECT') [...node.options].forEach((option,i) => option.toggleAttribute('selected',original.options[i].selected));
            });
            return '<!doctype html>' + copy.outerHTML;
          });
          snapshot = snapshot.replace(/<base[^>]*>/i, '<base href="https://mpi-layout.test/">');
          // Embed the unchanged local brand assets for this isolated visual capture.
          snapshot = snapshot.replaceAll("url('./brand-assets/mpi-website-header.jpg')", `url('data:image/jpeg;base64,${(await readFile(resolve(root,'brand-assets/mpi-website-header.jpg'))).toString('base64')}')`)
            .replaceAll('src="./brand-assets/mpi-website-header.jpg"', `src="data:image/jpeg;base64,${(await readFile(resolve(root,'brand-assets/mpi-website-header.jpg'))).toString('base64')}"`)
            .replaceAll('src="./mpi-logo.png"', `src="data:image/png;base64,${(await readFile(resolve(root,'mpi-logo.png'))).toString('base64')}"`);
          await staticPage.setContent(snapshot);
          await staticPage.screenshot({ path: `/tmp/mpi-build200-visuals/workbench-${view}.png`, fullPage: true });
          await staticContext.close();
        }
      }
    }
    assert.equal(await office.locator("#adminOpenSettings").isVisible(), true, `Settings must remain accessible at ${viewport.width}px`);
    await office.locator("#adminOpenSettings").click();
    assert.equal(await office.locator("[data-admin-panel='settings']").isVisible(), true);
    assert.equal(await office.locator("#adminOpenSettings").getAttribute("aria-current"), "page");
    assert.equal(await office.locator(".tabbar [aria-current='page']").count(), 0);
    assert.equal(await office.locator("#adminRunSelfDiagnosis").isDisabled(), true, "View As is read-only and cannot start live service checks");
    assert.equal(await office.locator("#adminDiagnosticHistory[open]").count(), 0, "Diagnostic history is initially tucked away");
    await office.locator("#adminDiagnosticHistory > summary").click();
    assert.equal(await office.locator("[data-diagnostic-status]").count(), 1, "Existing saved reports remain reviewable");
    await auditControls(office, `Office ${viewport.width} Settings`);
    if (process.env.MPI_VISUAL_QA) await page.screenshot({ path: `/tmp/mpi-build200-visuals/office-${viewport.width}-settings.png` });
    await office.locator("#adminDiagnosticHistory > summary").click();
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.selectOption("#ownerViewUser", "jason");
  await page.waitForFunction(() => document.querySelector("#ownerViewStatus").textContent.startsWith("Jason Chamarro · "));
  await page.frameLocator(".owner-view-frame").locator("#subcontractorOnWayBtn").waitFor();
  const subcontractor = await (await page.locator(".owner-view-frame").elementHandle()).contentFrame();
  await subcontractor.waitForFunction(() => window.MPI_COMPANY_SESSION?.userId === "jason");
  assert.equal(await page.locator("#ownerViewSurface").inputValue(), "app");
  assert.equal(await subcontractor.locator("#subcontractorOnWayBtn").isDisabled(), true);
  await page.click("#ownerViewExit");
  assert.equal(await page.locator(".owner-view-dialog").isVisible(), false);
  assert.equal(await page.locator(".owner-view-frame").getAttribute("src"), null, "Exiting releases the preview document");
  assert.equal(await page.locator(".owner-view-frame").getAttribute("srcdoc"), null);
  for (const index of [1, 2, 3, 4]) {
    await page.evaluate(index => { const p = window.testProfiles[index]; window.MPI_SHARED.auth.currentUser = { uid: p.id, email: p.email }; window.MPI_OWNER_VIEW.setContext(window.MPI_SHARED.auth.currentUser, p); }, index);
    assert.equal(await page.locator("#mpiOwnerViewButton").isVisible(), false);
  }
  assert.deepEqual(errors, []);
  console.log("PASS Owner-only selector; isolated real-layout app/office previews; no credentials, writes or parent access; Brooke allowance hidden; exit restores owner.");
  errors.length = 0;
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html#home`);
  await page.evaluate(profiles => {
    window.testProfiles = profiles;
    window.MPI_SHARED.auth.currentUser = { uid: "kevin", email: profiles[0].email };
    const fixtures = { users: profiles, equipmentAssignments: [
      { id: "kevin_gfci", employeeId: "kevin", toolId: "gfci-tester", toolName: "Digital GFCI receptacle tester", status: "Issued", active: true },
      { id: "kevin_pending", employeeId: "kevin", toolId: "inspection-tote", toolName: "Pending tote", status: "Not Issued", active: true },
      ...window.MPI_EQUIPMENT.tools.map(tool => ({ id: `cory_${tool.id}`, employeeId: "cory", toolId: tool.id, toolName: tool.title, brandModel: tool.model, status: "Not Issued", active: true }))
    ], equipmentAcknowledgments: [] };
    window.testProfileReads = 0;
    const query = name => {
      const q = { where: () => q, orderBy: () => q, onSnapshot: (options, callback) => {
        if (typeof options === "function") callback = options;
        const snapshot = { docs: (fixtures[name] || []).map(item => ({ id: item.id, data: () => item })), metadata: { fromCache: false, hasPendingWrites: false } };
        if (name === "equipmentAssignments") { window.testEquipmentNext = callback; window.testEquipmentSnapshot = snapshot; }
        queueMicrotask(() => callback(snapshot));
        return () => {};
      }, doc: () => ({ get: () => { window.testProfileReads++; throw Error("A second office profile read must not be required"); } }) };
      return q;
    };
    window.MPI_SHARED.db = { collection: query };
    window.MPI_TOOL_BAG.setContext(window.MPI_SHARED.auth.currentUser, profiles[0]);
    location.hash = "#tool-bag";
  }, profiles);
  await page.waitForSelector(".tool-bag-overlay:not([hidden]) .tool-bag-card");
  assert.equal(await page.locator(".tool-bag-card").count(), 1);
  assert.equal(await page.locator("#fieldIssueEquipment").isVisible(), true);
  await page.click("[data-bag-guide]");
  assert.equal(await page.locator(".tool-bag-guide").isVisible(), true);
  assert.match(await page.locator(".tool-bag-guide").textContent(), /Milwaukee|GFCI/);
  await page.click("[data-bag-list]");
  await page.click("#fieldIssueEquipment");
  await page.waitForSelector(".tool-bag-issue-frame");
  assert.match(await page.locator(".tool-bag-issue-frame").getAttribute("src"), /view=equipment&field=1/);
  const handover = await page.locator(".tool-bag-issue-frame").contentFrame().locator("body").elementHandle().then(handle => handle.ownerFrame());
  await handover.waitForSelector("#adminDashboard:not([hidden]) [data-admin-panel='equipment'].active");
  assert.equal(await handover.locator("#adminAuthCard").isVisible(), false);
  assert.equal(await handover.evaluate(() => window.MPI_SHARED.auth === parent.MPI_SHARED.auth && window.MPI_SHARED.db === parent.MPI_SHARED.db), true);
  assert.equal(await page.evaluate(() => window.testProfileReads), 0);
  assert.equal(await page.evaluate(() => window.MPI_TOOL_BAG.officeSession({})), null);
  await handover.selectOption("#adminEquipmentEmployee", "cory");
  for (const viewport of [{ width: 1280, height: 800 }, { width: 393, height: 852 }]) {
    await page.setViewportSize(viewport);
    await auditControls(handover, `Field equipment ${viewport.width}`);
    const frameBox = await page.locator(".tool-bag-issue-frame").boundingBox();
    const dockBox = await page.locator(".app-bottom-nav").boundingBox();
    assert.ok(frameBox.y + frameBox.height < dockBox.y, "The entire handover viewport must fit above the phone menu, including modal submission controls");
    if (process.env.MPI_VISUAL_QA) await page.screenshot({ path: `/tmp/mpi-build200-visuals/equipment-${viewport.width}.png` });
  }
  await handover.locator("[data-select-equipment-issue]").first().check();
  await page.evaluate(() => window.testEquipmentNext({ ...window.testEquipmentSnapshot, metadata: { fromCache: true, hasPendingWrites: false } }));
  assert.equal(await handover.locator("#adminCreateEquipmentAcknowledgment").isDisabled(), true);
  await page.evaluate(() => window.testEquipmentNext(window.testEquipmentSnapshot));
  assert.equal(await handover.locator("#adminCreateEquipmentAcknowledgment").isDisabled(), false, "Server metadata confirmation must unlock the handover without another sign-in or lost selection");
  await handover.click("#adminCreateEquipmentAcknowledgment");
  await handover.waitForSelector("#equipmentAcknowledgmentDialog[open]");
  assert.equal(await handover.locator("[data-ack-item]").count(), 1);
  assert.equal(await handover.locator("input[name='employeeName']").inputValue(), "Cory Leese");
  assert.equal(await handover.locator("input[name='witnessName']").inputValue(), "Kevin Cave");
  await auditControls(handover, "Phone handover acknowledgment");
  await handover.locator("[data-ack-item] input[type=radio]").first().check();
  await handover.click("#submitEquipmentAcknowledgment");
  assert.match(await handover.locator("#equipmentAcknowledgmentStatus").textContent(), /employee signature is required/i);
  await handover.locator("[data-close-equipment-dialog]").click();
  await page.evaluate(() => {
    const child = document.querySelector(".tool-bag-issue-frame").contentWindow;
    window.testOfficeStop = window.MPI_TOOL_BAG.officeSession(child).watchSession(session => { window.testOfficeUid = session.user?.uid || ""; });
  });
  await page.waitForFunction(() => window.testOfficeUid === "kevin");
  await page.evaluate(profiles => { window.MPI_SHARED.auth.currentUser = { uid: "cory", email: profiles[3].email }; window.MPI_TOOL_BAG.setContext(window.MPI_SHARED.auth.currentUser, profiles[3]); location.hash = "#tool-bag"; }, profiles);
  assert.equal(await page.evaluate(() => window.testOfficeUid), "");
  await page.evaluate(() => window.testOfficeStop());
  assert.equal(await page.locator("#fieldIssueEquipment").isVisible(), false);
  assert.equal(await page.locator("a.home-tool-card[href='#issue-equipment']").isVisible(), false);
  await page.evaluate(() => { const toast = document.getElementById("toast"); toast.textContent = "Equipment saved. Your handover records are ready."; toast.classList.add("show"); });
  const toastBox = await page.locator("#toast").boundingBox();
  const dockBox = await page.locator(".app-bottom-nav").boundingBox();
  assert.ok(toastBox.y + toastBox.height < dockBox.y, "Status messages must not cover the bottom navigation");
  console.log("PASS User-bound Tool Bag filters unissued/other employees' items, opens model-specific guides, and owner field handover reuses Office equipment workflow.");
  await page.evaluate(() => { window.MPI_NATIVE = { isNative: true }; document.getElementById("mpiAdminReturn").hidden = false; localStorage.setItem("mpiTestWorkday", "preserved"); });
  await page.click("#mpiAdminReturn");
  await page.waitForURL("**/admin.html");
  assert.equal(await page.evaluate(() => localStorage.getItem("mpiTestWorkday")), "preserved");
  await page.setViewportSize({ width: 1280, height: 800 });
  assert.equal(await page.locator("a[aria-label='Return to Inspector App']").isVisible(), false);
  await page.setViewportSize({ width: 393, height: 852 });
  assert.equal(await page.locator("a[aria-label='Return to Inspector App']").isVisible(), true);
  await page.evaluate(() => { window.MPI_NATIVE = { isNative: true }; });
  await page.click("a[aria-label='Return to Inspector App']");
  await page.waitForURL("**/index.html?office=1#home");
  assert.equal(await page.evaluate(() => localStorage.getItem("mpiTestWorkday")), "preserved");
  console.log("PASS Native-style Office/Inspector navigation responds with external maps blocked and preserves local workday data.");
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
