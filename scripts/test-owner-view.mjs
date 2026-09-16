import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { resolve, extname } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/kevincave/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root = fileURLToPath(new URL("../", import.meta.url));
const server = createServer(async (request, response) => {
  try {
    const path = resolve(root, "." + new URL(request.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
    if (!path.startsWith(root)) throw new Error("Invalid path");
    response.setHeader("Content-Type", ({ ".js": "text/javascript", ".html": "text/html", ".json": "application/json", ".css": "text/css" })[extname(path)] || "application/octet-stream");
    response.end(await readFile(path));
  } catch (_) { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const errors = [], external = [];
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
  await page.evaluate(profiles => {
    window.testProfiles = profiles;
    window.MPI_SHARED.auth = { currentUser: { uid: "kevin", email: profiles[0].email } };
    window.MPI_OWNER_VIEW.setContext(window.MPI_SHARED.auth.currentUser, profiles[0]);
    window.MPI_OWNER_VIEW.setData({ people: profiles });
  }, profiles);
  assert.equal(await page.locator("#mpiOwnerViewButton").isVisible(), true);
  await page.click("#mpiOwnerViewButton");
  await page.selectOption("#ownerViewUser", "cory");
  await page.waitForFunction(() => document.querySelector(".owner-view-frame").srcdoc.includes("Cory Leese"));
  const frame = page.frames().find(frame => frame.parentFrame());
  await frame.waitForSelector(".app-bottom-nav");
  assert.equal(await frame.evaluate(() => window.MPI_COMPANY_SESSION.userId), "cory");
  assert.equal(await frame.evaluate(() => window.MPI_SHARED.auth.currentUser.uid), "cory");
  assert.equal(await page.evaluate(() => window.MPI_SHARED.auth.currentUser.uid), "kevin");
  assert.equal(await frame.evaluate(() => { try { return Boolean(parent.MPI_SHARED); } catch (_) { return false; } }), false);
  assert.equal((await page.locator(".owner-view-frame").getAttribute("srcdoc")).includes("DO-NOT-COPY"), false);
  assert.equal(await frame.evaluate(() => document.querySelector("#workflowClockOffBtn")?.disabled ?? true), true);
  assert.equal(await frame.evaluate(async () => { try { await window.MPI_SHARED.db.collection("users").doc("cory").set({ name: "Changed" }); return false; } catch (_) { return true; } }), true);
  await page.selectOption("#ownerViewUser", "brooke");
  await page.selectOption("#ownerViewSurface", "office");
  await page.waitForFunction(() => document.querySelector(".owner-view-frame").srcdoc.includes('"id":"brooke"'));
  const office = page.frames().find(frame => frame.parentFrame());
  await office.waitForSelector("#adminDashboard:not([hidden])");
  assert.equal(await office.locator("#commentUsagePanel").isVisible(), false);
  assert.equal(await office.locator("#adminAccountName").textContent(), "Brooke");
  assert.equal(await office.locator("#adminPublishButton").isDisabled(), true);
  await page.selectOption("#ownerViewUser", "jason");
  await page.waitForFunction(() => document.querySelector(".owner-view-frame").srcdoc.includes('"id":"jason"'));
  const subcontractor = page.frames().find(frame => frame.parentFrame());
  await subcontractor.waitForFunction(() => window.MPI_COMPANY_SESSION?.userId === "jason");
  assert.equal(await page.locator("#ownerViewSurface").inputValue(), "app");
  assert.equal(await subcontractor.locator("#subcontractorOnWayBtn").isDisabled(), true);
  await page.click("#ownerViewExit");
  assert.equal(await page.locator(".owner-view-dialog").isVisible(), false);
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
    const q = { where: () => q, onSnapshot: callback => { queueMicrotask(() => callback({ docs: [
      { id: "kevin_gfci", data: () => ({ employeeId: "kevin", toolId: "gfci-tester", toolName: "Digital GFCI receptacle tester", status: "Issued", active: true }) },
      { id: "kevin_pending", data: () => ({ employeeId: "kevin", toolId: "inspection-tote", toolName: "Pending tote", status: "Not Issued", active: true }) },
      { id: "cory_gfci", data: () => ({ employeeId: "cory", toolId: "gfci-tester", toolName: "Cory's tool", status: "Issued", active: true }) }
    ] })); return () => {}; } };
    window.MPI_SHARED.db = { collection: () => q };
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
  await page.evaluate(profiles => { window.MPI_SHARED.auth.currentUser = { uid: "cory", email: profiles[3].email }; window.MPI_TOOL_BAG.setContext(window.MPI_SHARED.auth.currentUser, profiles[3]); location.hash = "#tool-bag"; }, profiles);
  assert.equal(await page.locator("#fieldIssueEquipment").isVisible(), false);
  assert.equal(await page.locator("a.home-tool-card[href='#issue-equipment']").isVisible(), false);
  console.log("PASS User-bound Tool Bag filters unissued/other employees' items, opens model-specific guides, and owner field handover reuses Office equipment workflow.");
  await page.evaluate(() => { window.MPI_NATIVE = { isNative: true }; document.getElementById("mpiAdminReturn").hidden = false; localStorage.setItem("mpiTestWorkday", "preserved"); });
  await page.click("#mpiAdminReturn");
  await page.waitForURL("**/admin.html");
  assert.equal(await page.evaluate(() => localStorage.getItem("mpiTestWorkday")), "preserved");
  assert.equal(await page.locator("a[aria-label='Return to Inspector App']").isVisible(), true);
  await page.evaluate(() => { window.MPI_NATIVE = { isNative: true }; });
  await page.click("a[aria-label='Return to Inspector App']");
  await page.waitForURL("**/index.html?office=1#home");
  assert.equal(await page.evaluate(() => localStorage.getItem("mpiTestWorkday")), "preserved");
  console.log("PASS Native-style Office/Inspector navigation responds with external maps blocked and preserves local workday data.");
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
