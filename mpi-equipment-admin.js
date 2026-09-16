(function () {
  "use strict";

  const shared = window.MPI_SHARED;
  const equipment = window.MPI_EQUIPMENT;
  const panel = document.getElementById("adminEquipmentDashboard");
  if (!shared?.available || !equipment || !panel) return;

  const summary = document.getElementById("adminEquipmentSummary");
  const employeeSelect = document.getElementById("adminEquipmentEmployee");
  const list = document.getElementById("adminEquipmentList");
  const history = document.getElementById("adminEquipmentHistory");
  const createAcknowledgment = document.getElementById("adminCreateEquipmentAcknowledgment");
  const selectionStatus = document.getElementById("adminEquipmentSelectionStatus");
  const addForm = document.getElementById("adminAddEquipmentForm");
  const addEmployee = document.getElementById("adminAddEquipmentEmployee");
  const addStatus = document.getElementById("adminAddEquipmentStatus");
  const addMessage = document.getElementById("adminAddEquipmentMessage");
  const acknowledgmentDialog = document.getElementById("equipmentAcknowledgmentDialog");
  const acknowledgmentContent = document.getElementById("equipmentAcknowledgmentContent");
  const documentDialog = document.getElementById("equipmentDocumentDialog");
  const documentContent = document.getElementById("equipmentDocumentContent");
  const EMAIL_ENDPOINT = "https://script.google.com/macros/s/AKfycbzd701WKgQIzWP24pmjL3gaTFIjH2iHxjMYzirArFoYq8nup57p8h1VMmJPx9MVYOqL/exec";
  const DRAFT_PREFIX = "mpiEquipmentAcknowledgmentDraftV1:";

  let currentUser = null;
  let currentProfile = null;
  let people = [];
  let assignments = [];
  let acknowledgments = [];
  let selectedEmployeeId = "";
  let unsubscribePeople = null;
  let unsubscribeAssignments = null;
  let unsubscribeAcknowledgments = null;
  let bootstrapInFlight = false;
  let assignmentSnapshotReady = false;
  let equipmentLoadTimer = null;
  const selectedAssignmentIds = new Set();

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function cleanId(value) {
    return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 180);
  }

  function friendlyDate(value, includeTime = false) {
    const date = value?.toDate ? value.toDate() : new Date(value || "");
    if (!Number.isFinite(date.getTime())) return "Not recorded";
    return date.toLocaleString("en-US", includeTime
      ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric", year: "numeric" });
  }

  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function employeeName(id) {
    return people.find(person => person.id === id)?.name || assignments.find(item => item.employeeId === id)?.employeeName || "MPI Team Member";
  }

  function currentEmployeeAssignments() {
    return assignments
      .filter(item => item.employeeId === selectedEmployeeId && item.active !== false)
      .sort((left, right) => String(left.category || "").localeCompare(String(right.category || "")) || String(left.toolName || "").localeCompare(String(right.toolName || "")));
  }

  function statusTone(status) {
    if (status === "Not Issued") return "pending";
    if (status === "Issued") return "issued";
    if (status === "Returned") return "returned";
    if (status === "Damaged" || status === "Missing" || status === "Replacement Required") return "attention";
    return "neutral";
  }

  function selectedPendingAssignments() {
    const pending = currentEmployeeAssignments().filter(item => item.status === "Not Issued");
    const available = new Set(pending.map(item => item.id));
    [...selectedAssignmentIds].forEach(id => { if (!available.has(id)) selectedAssignmentIds.delete(id); });
    return pending.filter(item => selectedAssignmentIds.has(item.id));
  }

  function renderEquipmentSelectionState() {
    const selected = selectedPendingAssignments();
    createAcknowledgment.disabled = !assignmentSnapshotReady || selected.length === 0;
    createAcknowledgment.textContent = selected.length ? `Create acknowledgment (${selected.length})` : "Create acknowledgment";
    if (selectionStatus) selectionStatus.textContent = selected.length
      ? `${selected.length} tool${selected.length === 1 ? "" : "s"} selected. The form will include only these items.`
      : "Select the tools being handed over today.";
  }

  function renderSelectors() {
    const eligible = people.filter(person => person.active !== false && ["owner", "inspector", "subcontractor"].includes(String(person.role || "").toLowerCase()));
    const previous = selectedEmployeeId || employeeSelect.value;
    const cory = eligible.find(person => /^cory leese$/i.test(String(person.name || "").trim()));
    selectedEmployeeId = eligible.some(person => person.id === previous) ? previous : cory?.id || eligible[0]?.id || "";
    const options = eligible.map(person => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.name || person.email || "MPI Team Member")}</option>`).join("");
    employeeSelect.innerHTML = options || '<option value="">No field employees</option>';
    employeeSelect.value = selectedEmployeeId;
    addEmployee.innerHTML = options || '<option value="">No field employees</option>';
    if (eligible.some(person => person.id === selectedEmployeeId)) addEmployee.value = selectedEmployeeId;
    addStatus.innerHTML = equipment.statuses.map(status => `<option>${escapeHtml(status)}</option>`).join("");
  }

  function renderSummary() {
    const employeeIds = [...new Set(assignments.filter(item => item.active !== false).map(item => item.employeeId))];
    const employeeCards = employeeIds.map(id => {
      const records = assignments.filter(item => item.employeeId === id && item.active !== false);
      const signed = acknowledgments.filter(item => item.employeeId === id).sort((a, b) => String(b.submittedAtClient || "").localeCompare(String(a.submittedAtClient || "")))[0];
      const count = status => records.filter(item => item.status === status).length;
      const issuedDates = records.map(item => item.dateIssued).filter(Boolean).sort();
      const issueDate = issuedDates.length ? friendlyDate(`${issuedDates[0]}T12:00:00`) : "No handover recorded";
      return `<button type="button" class="equipment-summary-card${id === selectedEmployeeId ? " active" : ""}" data-equipment-employee="${escapeHtml(id)}">
        <span>${escapeHtml(employeeName(id))}</span><strong>${count("Issued")}</strong><small>tools issued</small>
        <div><b>${signed ? `Signed ${escapeHtml(friendlyDate(signed.submittedAtClient || signed.submittedAt))}` : "No signed handover yet"}</b><i>${count("Not Issued")} awaiting handover · ${escapeHtml(issueDate)}</i><i>${count("Damaged")} damaged · ${count("Missing")} missing · ${count("Replacement Required")} replacement</i></div>
      </button>`;
    }).join("");
    summary.innerHTML = employeeCards || '<div class="empty">Equipment records are being prepared.</div>';
  }

  function renderAssignments() {
    const records = currentEmployeeAssignments();
    selectedPendingAssignments();
    list.innerHTML = records.length ? records.map(record => {
      const guide = equipment.byId(record.toolId);
      return `<article class="equipment-record-card" data-equipment-assignment="${escapeHtml(record.id)}">
        <header><div class="equipment-record-identification"><img class="equipment-product-photo" src="${escapeHtml(guide?.image || `./equipment-images/${record.toolId}.jpg`)}" alt="${escapeHtml(record.brandModel || guide?.model || record.toolName || "MPI equipment")} product reference" loading="lazy"><div><span>${escapeHtml(record.category || "Company equipment")} · Product photo</span><h3>${escapeHtml(record.toolName || guide?.title || "MPI equipment")}</h3><p>${escapeHtml(record.brandModel || guide?.model || "Brand/model not recorded")}</p></div></div><b class="equipment-status ${statusTone(record.status)}">${escapeHtml(record.status || "Not Issued")}</b></header>
        <div class="equipment-record-fields">
          <label>Status<select data-equipment-status>${equipment.statuses.map(status => `<option ${status === record.status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select></label>
          <label>Date issued<input data-equipment-date type="date" value="${escapeHtml(record.dateIssued || "")}"></label>
          <label>Serial / asset number<input data-equipment-serial maxlength="120" value="${escapeHtml(record.serialNumber || "")}" placeholder="Optional"></label>
          <label class="wide">Notes<textarea data-equipment-notes maxlength="700" placeholder="Optional assignment, condition, accessory or service note">${escapeHtml(record.notes || "")}</textarea></label>
        </div>
        <footer>${record.status === "Not Issued" ? `<label class="equipment-issue-select"><input type="checkbox" data-select-equipment-issue="${escapeHtml(record.id)}" ${selectedAssignmentIds.has(record.id) ? "checked" : ""}><span>INCLUDE IN THIS HANDOVER</span></label>` : ""}<button class="primary" type="button" data-save-equipment="${escapeHtml(record.id)}">SAVE TOOL</button>${guide ? `<a class="secondary" href="./?tool=${encodeURIComponent(guide.id)}#tool-guides">USER GUIDE</a>` : ""}<span class="status" data-equipment-save-status></span></footer>
      </article>`;
    }).join("") : '<div class="empty">No equipment has been assigned to this employee.</div>';
    renderEquipmentSelectionState();
  }

  function renderHistory() {
    const records = acknowledgments.filter(item => item.employeeId === selectedEmployeeId).sort((a, b) => String(b.submittedAtClient || "").localeCompare(String(a.submittedAtClient || "")));
    history.innerHTML = records.length ? records.map(record => {
      const damaged = (record.items || []).filter(item => item.receiptStatus === "Damaged / Issue Noted").length;
      const missing = (record.items || []).filter(item => item.receiptStatus === "Not Received").length;
      return `<article class="equipment-history-card"><div><span>${escapeHtml(record.reference || "MPI acknowledgment")}</span><strong>${escapeHtml(record.employeeName || employeeName(record.employeeId))}</strong><small>${escapeHtml(friendlyDate(record.submittedAtClient || record.submittedAt, true))} · ${(record.items || []).length} tools · ${damaged} issue noted · ${missing} not received</small></div><div><button class="secondary" type="button" data-view-equipment-ack="${escapeHtml(record.id)}">VIEW SIGNED ACKNOWLEDGMENT</button><button class="secondary" type="button" data-resend-equipment-ack="${escapeHtml(record.id)}">RE-SEND EMAIL</button><span class="status" data-ack-history-status></span></div></article>`;
    }).join("") : '<div class="empty">No signed acknowledgment has been recorded for this employee.</div>';
  }

  function renderAll() {
    renderSelectors();
    renderSummary();
    renderAssignments();
    renderHistory();
  }

  async function ensureCoryAssignments() {
    if (bootstrapInFlight || !assignmentSnapshotReady || !currentUser || !shared.isAdminRole(currentProfile)) return;
    const cory = people.find(person => person.active !== false && /^cory leese$/i.test(String(person.name || "").trim()));
    if (!cory) return;
    const coryRecords = assignments.filter(item => item.employeeId === cory.id);
    const existing = new Set(coryRecords.map(item => item.toolId));
    const missing = equipment.tools.filter(item => !existing.has(item.id));
    const prematureIssued = coryRecords.filter(item => item.status === "Issued"
      && !item.dateIssued
      && !item.acknowledgmentReference
      && !item.acknowledgedAtClient);
    if (!missing.length && !prematureIssued.length) return;
    bootstrapInFlight = true;
    try {
      const batch = shared.db.batch();
      missing.forEach(item => {
        const id = cleanId(`${cory.id}_${item.id}`);
        batch.set(shared.db.collection("equipmentAssignments").doc(id), {
          employeeId: cory.id,
          employeeName: "Cory Leese",
          toolId: item.id,
          toolName: item.title,
          brandModel: item.model,
          category: item.category,
          status: "Not Issued",
          dateIssued: "",
          serialNumber: "",
          notes: "",
          active: true,
          catalogVersion: equipment.version,
          createdBy: currentUser.uid,
          createdByName: currentProfile?.name || currentUser.displayName || "MPI Admin",
          createdAt: shared.serverTimestamp(),
          updatedAt: shared.serverTimestamp()
        });
      });
      prematureIssued.forEach(item => {
        batch.set(shared.db.collection("equipmentAssignments").doc(item.id), {
          status: "Not Issued",
          setupCorrection: "Initial catalog record corrected before equipment handover",
          updatedBy: currentUser.uid,
          updatedByName: currentProfile?.name || currentUser.displayName || "MPI Admin",
          updatedAt: shared.serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      if (addMessage) addMessage.textContent = error?.message || "Cory's issued-tool list could not be initialized.";
    } finally {
      bootstrapInFlight = false;
    }
  }

  async function saveAssignment(card, id) {
    const record = assignments.find(item => item.id === id);
    if (!record) return;
    const status = card.querySelector("[data-equipment-save-status]");
    const button = card.querySelector("[data-save-equipment]");
    button.disabled = true;
    status.textContent = "Saving…";
    try {
      await shared.db.collection("equipmentAssignments").doc(id).set({
        status: card.querySelector("[data-equipment-status]").value,
        dateIssued: card.querySelector("[data-equipment-date]").value,
        serialNumber: card.querySelector("[data-equipment-serial]").value.trim().slice(0, 120),
        notes: card.querySelector("[data-equipment-notes]").value.trim().slice(0, 700),
        updatedBy: currentUser.uid,
        updatedByName: currentProfile?.name || currentUser.displayName || "MPI Admin",
        updatedAt: shared.serverTimestamp()
      }, { merge: true });
      status.textContent = "Saved";
    } catch (error) {
      status.textContent = error?.message || "Could not save this tool.";
    } finally {
      button.disabled = false;
    }
  }

  function newReference() {
    const suffix = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).replace(/-/g, "").slice(0, 8).toUpperCase();
    return `MPI-EQUIP-${localDateKey().replace(/-/g, "")}-${suffix}`;
  }

  function draftKey(employeeId) { return `${DRAFT_PREFIX}${employeeId}`; }
  function loadDraft(employeeId) {
    try { return JSON.parse(localStorage.getItem(draftKey(employeeId)) || "null") || {}; } catch (_) { return {}; }
  }
  function saveDraft(employeeId, value) {
    try { localStorage.setItem(draftKey(employeeId), JSON.stringify(value)); } catch (_) {}
  }
  function clearDraft(employeeId) {
    try { localStorage.removeItem(draftKey(employeeId)); } catch (_) {}
  }

  function signatureController(canvas, clearButton, initialValue, changed) {
    let drawing = false;
    let hasInk = Boolean(initialValue);
    let savedImage = initialValue || "";
    const context = canvas.getContext("2d");

    function prepare() {
      const retained = hasInk ? (savedImage || canvas.toDataURL("image/png")) : "";
      const box = canvas.getBoundingClientRect();
      const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.max(320, Math.round(box.width * ratio));
      canvas.height = Math.max(130, Math.round(box.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.4;
      context.strokeStyle = "#11186a";
      context.fillStyle = "#fff";
      context.fillRect(0, 0, box.width, box.height);
      if (retained) {
        const image = new Image();
        image.onload = () => context.drawImage(image, 0, 0, box.width, box.height);
        image.src = retained;
      }
    }

    function point(event) {
      const box = canvas.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    }
    canvas.addEventListener("pointerdown", event => {
      drawing = true;
      hasInk = true;
      canvas.setPointerCapture?.(event.pointerId);
      const value = point(event);
      context.beginPath();
      context.moveTo(value.x, value.y);
    });
    canvas.addEventListener("pointermove", event => {
      if (!drawing) return;
      const value = point(event);
      context.lineTo(value.x, value.y);
      context.stroke();
    });
    const finish = () => {
      if (!drawing) return;
      drawing = false;
      savedImage = hasInk ? canvas.toDataURL("image/png") : "";
      changed(savedImage);
    };
    canvas.addEventListener("pointerup", finish);
    canvas.addEventListener("pointercancel", finish);
    clearButton.addEventListener("click", () => {
      hasInk = false;
      savedImage = "";
      prepare();
      changed("");
    });
    prepare();
    return { value: () => hasInk ? (savedImage || canvas.toDataURL("image/png")) : "", resize: prepare };
  }

  function collectAcknowledgmentDraft(form, employeeSignature = "", witnessSignature = "") {
    const items = [...form.querySelectorAll("[data-ack-item]")].map(card => ({
      assignmentId: card.dataset.ackItem,
      receiptStatus: card.querySelector("input[type=radio]:checked")?.value || "",
      notes: card.querySelector("textarea").value.trim().slice(0, 500)
    }));
    return {
      employeeName: form.elements.employeeName.value.trim().slice(0, 100),
      witnessName: form.elements.witnessName.value.trim().slice(0, 100),
      items,
      employeeSignature,
      witnessSignature,
      savedAt: new Date().toISOString()
    };
  }

  function openAcknowledgment() {
    const records = selectedPendingAssignments();
    if (!records.length) return;
    const personId = selectedEmployeeId;
    const draft = loadDraft(personId);
    acknowledgmentContent.innerHTML = `<form class="equipment-ack-form" id="equipmentAcknowledgmentForm">
      <header class="equipment-ack-head"><img src="./mpi-logo.png" alt=""><div><span>Michigan Property Inspections, LLC</span><h2>Issued Tool Acknowledgment</h2><p>${escapeHtml(records.length)} selected item${records.length === 1 ? "" : "s"} for this handover · saved while you complete it</p></div><button type="button" class="equipment-dialog-close" data-close-equipment-dialog aria-label="Close">×</button></header>
      <div class="equipment-ack-party"><label>Employee name<input name="employeeName" required maxlength="100" value="${escapeHtml(draft.employeeName || employeeName(personId))}"></label><label>Admin / witness name<input name="witnessName" required maxlength="100" value="${escapeHtml(draft.witnessName || currentProfile?.name || currentUser?.displayName || "")}"></label><div><span>Date and time</span><strong>${escapeHtml(friendlyDate(new Date(), true))}</strong></div></div>
      <div class="equipment-ack-items">${records.map(record => {
        const saved = (draft.items || []).find(item => item.assignmentId === record.id) || {};
        return `<fieldset data-ack-item="${escapeHtml(record.id)}"><legend><strong>${escapeHtml(record.toolName)}</strong><span>${escapeHtml(record.brandModel || record.category || "MPI equipment")}</span></legend><div class="equipment-ack-options">${equipment.receiptStatuses.map(status => `<label><input type="radio" name="receipt-${escapeHtml(record.id)}" value="${escapeHtml(status)}" required ${saved.receiptStatus === status ? "checked" : ""}><span>${escapeHtml(status)}</span></label>`).join("")}</div><textarea maxlength="500" placeholder="Optional notes for this item">${escapeHtml(saved.notes || "")}</textarea></fieldset>`;
      }).join("")}</div>
      <blockquote>I acknowledge that I have received the MPI equipment identified above. I understand that this equipment remains the property of Michigan Property Inspections, LLC and is provided for company inspection work. I agree to take reasonable care of the equipment, report loss, damage or malfunction promptly, and return company equipment when requested or upon the end of my employment or assignment.</blockquote>
      <div class="equipment-signature-grid"><section><h3>Employee signature <b>Required</b></h3><canvas id="equipmentEmployeeSignature" aria-label="Employee signature pad"></canvas><button type="button" class="secondary" id="clearEquipmentEmployeeSignature">CLEAR SIGNATURE</button></section><section><h3>Admin / witness signature <span>Optional</span></h3><canvas id="equipmentWitnessSignature" aria-label="Admin or witness signature pad"></canvas><button type="button" class="secondary" id="clearEquipmentWitnessSignature">CLEAR SIGNATURE</button></section></div>
      <footer><button type="submit" class="primary" id="submitEquipmentAcknowledgment">SUBMIT SIGNED ACKNOWLEDGMENT</button><span class="status" id="equipmentAcknowledgmentStatus">A signature is required before submission.</span></footer>
    </form>`;
    acknowledgmentDialog.showModal();
    const form = document.getElementById("equipmentAcknowledgmentForm");
    let employeeSignature = draft.employeeSignature || "";
    let witnessSignature = draft.witnessSignature || "";
    const persist = () => saveDraft(personId, collectAcknowledgmentDraft(form, employeeSignature, witnessSignature));
    const employeePad = signatureController(document.getElementById("equipmentEmployeeSignature"), document.getElementById("clearEquipmentEmployeeSignature"), employeeSignature, value => { employeeSignature = value; persist(); });
    const witnessPad = signatureController(document.getElementById("equipmentWitnessSignature"), document.getElementById("clearEquipmentWitnessSignature"), witnessSignature, value => { witnessSignature = value; persist(); });
    form.addEventListener("input", persist);
    form.addEventListener("change", persist);
    const resize = () => { employeePad.resize(); witnessPad.resize(); };
    window.addEventListener("orientationchange", resize, { once: true });
    form.addEventListener("submit", event => submitAcknowledgment(event, personId, records, employeePad, witnessPad));
  }

  function acknowledgmentDocument(record) {
    const rows = (record.items || []).map(item => `<tr><td>${escapeHtml(item.toolName)}</td><td>${escapeHtml(item.brandModel || "")}</td><td>${escapeHtml(item.receiptStatus)}</td><td>${escapeHtml(item.notes || "")}</td></tr>`).join("");
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(record.reference)}</title><style>body{margin:0;background:#eef2f8;color:#11186a;font:14px Arial,sans-serif}.document{max-width:820px;margin:24px auto;background:#fff;border:1px solid #d8e0eb}.head{padding:28px;text-align:center;color:#fff;background:#11186a}.head img{width:82px}.head span{display:block;margin-top:10px;color:#dfc264;font-weight:800;letter-spacing:1.6px}.head h1{margin:7px 0 0;font-size:26px}.body{padding:25px}.facts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}.facts div{padding:12px;background:#f4f7fb;border:1px solid #d8e0eb}.facts span{display:block;color:#68728c;font-size:11px}.facts strong{display:block;margin-top:4px}table{width:100%;border-collapse:collapse}th,td{padding:9px;border:1px solid #d8e0eb;text-align:left;vertical-align:top}th{background:#eef3fa}.statement{margin:20px 0;padding:16px;border-left:4px solid #d3aa3f;background:#fff9e8;line-height:1.55}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:18px}.signatures section{padding:14px;border:1px solid #d8e0eb}.signatures img{display:block;width:100%;height:100px;object-fit:contain;border-bottom:1px solid #11186a}.signatures span{display:block;margin-top:8px;font-weight:700}.foot{padding:18px;text-align:center;color:#68728c;background:#f4f7fb}@media print{body{background:#fff}.document{margin:0;border:0}}</style></head><body><main class="document"><header class="head"><img src="https://kevinspect.github.io/mpi-field-tools/mpi-logo.png" alt="MPI"><span>MICHIGAN PROPERTY INSPECTIONS, LLC</span><h1>Issued Tool Acknowledgment</h1></header><div class="body"><div class="facts"><div><span>Employee</span><strong>${escapeHtml(record.employeeName)}</strong></div><div><span>Date / time</span><strong>${escapeHtml(friendlyDate(record.submittedAtClient || record.submittedAt, true))}</strong></div><div><span>Admin / witness</span><strong>${escapeHtml(record.witnessName)}</strong></div><div><span>Reference</span><strong>${escapeHtml(record.reference)}</strong></div></div><table><thead><tr><th>Tool</th><th>Brand / model</th><th>Status</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table><p class="statement">${escapeHtml(record.statement)}</p><div class="signatures"><section>${record.employeeSignature ? `<img src="${record.employeeSignature}" alt="Employee signature">` : ""}<span>${escapeHtml(record.employeeName)} · Employee</span></section><section>${record.witnessSignature ? `<img src="${record.witnessSignature}" alt="Witness signature">` : ""}<span>${escapeHtml(record.witnessName)} · Admin / witness</span></section></div></div><footer class="foot">Michigan Property Inspections, LLC · Workflow Management System</footer></main></body></html>`;
  }

  function base64Utf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  async function sendAcknowledgmentEmail(record) {
    const subject = `MPI - ${record.employeeName.split(/\s+/)[0] || record.employeeName} Issued Tool Acknowledgment - ${friendlyDate(record.submittedAtClient || record.submittedAt)}`;
    const itemGroups = [];
    for (let index = 0; index < (record.items || []).length; index += 6) {
      itemGroups.push((record.items || []).slice(index, index + 6).map((item, offset) => `${index + offset + 1}. ${item.toolName} — ${item.receiptStatus}${item.notes ? ` — ${item.notes}` : ""}`).join("\n"));
    }
    const payload = {
      source: "mpi-field-tools-form-email",
      requestId: `${record.reference}-email-${Date.now()}`,
      formType: "Issued Tool Acknowledgment",
      title: `Issued Tool Acknowledgment — ${record.employeeName}`,
      inspectorName: record.employeeName,
      submittedAt: record.submittedAtClient,
      status: "Signed and recorded",
      subject,
      fields: [
        { label: "Reference", value: record.reference },
        { label: "Admin / witness", value: record.witnessName },
        { label: "Employee signature", value: "Captured" },
        { label: "Admin / witness signature", value: record.witnessSignature ? "Captured" : "Not provided" },
        ...itemGroups.map((value, index) => ({ label: `Issued tools ${index + 1}`, value }))
      ],
      formAttachments: [{ name: `${record.reference}.html`, mimeType: "text/html", base64: base64Utf8(acknowledgmentDocument(record)) }]
    };
    await fetch(EMAIL_ENDPOINT, { method: "POST", mode: "no-cors", cache: "no-store", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify(payload) });
    return true;
  }

  async function submitAcknowledgment(event, personId, records, employeePad, witnessPad) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.getElementById("equipmentAcknowledgmentStatus");
    const button = document.getElementById("submitEquipmentAcknowledgment");
    if (!form.reportValidity()) {
      status.textContent = "Confirm every tool and complete the required names.";
      return;
    }
    const employeeSignature = employeePad.value();
    if (!employeeSignature) {
      status.textContent = "The employee signature is required before submission.";
      document.getElementById("equipmentEmployeeSignature").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    button.disabled = true;
    status.textContent = "Saving the signed acknowledgment…";
    const now = new Date();
    const draft = collectAcknowledgmentDraft(form, employeeSignature, witnessPad.value());
    const reference = newReference();
    const record = {
      reference,
      employeeId: personId,
      employeeName: draft.employeeName,
      witnessName: draft.witnessName,
      employeeSignature: draft.employeeSignature,
      witnessSignature: draft.witnessSignature,
      statement: "I acknowledge that I have received the MPI equipment identified above. I understand that this equipment remains the property of Michigan Property Inspections, LLC and is provided for company inspection work. I agree to take reasonable care of the equipment, report loss, damage or malfunction promptly, and return company equipment when requested or upon the end of my employment or assignment.",
      items: draft.items.map(item => {
        const assignment = records.find(record => record.id === item.assignmentId);
        return { assignmentId: item.assignmentId, toolId: assignment?.toolId || "", toolName: assignment?.toolName || "MPI tool", brandModel: assignment?.brandModel || "", category: assignment?.category || "", assignmentStatus: assignment?.status || "Not Issued", receiptStatus: item.receiptStatus, notes: item.notes };
      }),
      catalogVersion: equipment.version,
      submittedAtClient: now.toISOString(),
      submittedBy: currentUser.uid,
      submittedByName: currentProfile?.name || currentUser.displayName || "MPI Admin",
      immutable: true
    };
    try {
      const acknowledgmentRef = shared.db.collection("equipmentAcknowledgments").doc(cleanId(reference));
      const batch = shared.db.batch();
      batch.set(acknowledgmentRef, { ...record, submittedAt: shared.serverTimestamp() });
      record.items.forEach(item => {
        const assignment = records.find(value => value.id === item.assignmentId);
        const received = item.receiptStatus !== "Not Received";
        const nextStatus = !received ? "Not Issued" : item.receiptStatus === "Damaged / Issue Noted" ? "Damaged" : "Issued";
        const update = { status: nextStatus, acknowledgmentReference: reference, acknowledgedAtClient: record.submittedAtClient, updatedBy: currentUser.uid, updatedByName: record.submittedByName, updatedAt: shared.serverTimestamp() };
        if (received && !assignment?.dateIssued) update.dateIssued = localDateKey(now);
        batch.set(shared.db.collection("equipmentAssignments").doc(item.assignmentId), update, { merge: true });
      });
      await batch.commit();
      record.items.forEach(item => selectedAssignmentIds.delete(item.assignmentId));
      renderEquipmentSelectionState();
      clearDraft(personId);
      status.textContent = "Signed document saved. Sending the MPI email…";
      await sendAcknowledgmentEmail({ id: acknowledgmentRef.id, ...record });
      status.textContent = "Saved and emailed to MPI administration.";
      window.setTimeout(() => acknowledgmentDialog.close(), 850);
    } catch (error) {
      status.textContent = error?.message || "The signed acknowledgment could not be saved.";
      button.disabled = false;
    }
  }

  function openDocument(record) {
    documentContent.innerHTML = `${acknowledgmentDocument(record).match(/<main class="document">([\s\S]*)<\/main>/)?.[1] || ""}<div class="equipment-document-actions"><button class="secondary" type="button" data-close-equipment-document>CLOSE</button><button class="primary" type="button" data-download-equipment-ack="${escapeHtml(record.id)}">DOWNLOAD SIGNED DOCUMENT</button></div>`;
    documentDialog.showModal();
  }

  function downloadDocument(record) {
    const url = URL.createObjectURL(new Blob([acknowledgmentDocument(record)], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.reference || "MPI-Issued-Tool-Acknowledgment"}.html`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function addTool(event) {
    event.preventDefault();
    const values = new FormData(addForm);
    const personId = String(values.get("employeeId") || "");
    const person = people.find(item => item.id === personId);
    if (!person) return;
    const id = `custom-${window.crypto?.randomUUID?.() || Date.now()}`;
    addMessage.textContent = "Adding equipment…";
    try {
      await shared.db.collection("equipmentAssignments").doc(cleanId(`${personId}_${id}`)).set({
        employeeId: personId,
        employeeName: person.name || person.email || "MPI Team Member",
        toolId: id,
        toolName: String(values.get("toolName") || "").trim().slice(0, 140),
        brandModel: String(values.get("brandModel") || "").trim().slice(0, 180),
        category: String(values.get("category") || "Company equipment").trim().slice(0, 100),
        status: equipment.statuses.includes(String(values.get("status"))) ? String(values.get("status")) : "Not Issued",
        dateIssued: String(values.get("dateIssued") || ""),
        serialNumber: String(values.get("serialNumber") || "").trim().slice(0, 120),
        notes: String(values.get("notes") || "").trim().slice(0, 700),
        active: true,
        custom: true,
        createdBy: currentUser.uid,
        createdByName: currentProfile?.name || currentUser.displayName || "MPI Admin",
        createdAt: shared.serverTimestamp(),
        updatedAt: shared.serverTimestamp()
      });
      addForm.reset();
      renderSelectors();
      addMessage.textContent = "Tool added. It will appear in the employee's next acknowledgment.";
    } catch (error) {
      addMessage.textContent = error?.message || "The tool could not be added.";
    }
  }

  function startData() {
    unsubscribePeople?.(); unsubscribeAssignments?.(); unsubscribeAcknowledgments?.();
    clearTimeout(equipmentLoadTimer);
    assignmentSnapshotReady = false;
    renderEquipmentSelectionState();
    const delayed = () => {
      clearTimeout(equipmentLoadTimer);
      if (selectionStatus) selectionStatus.textContent = "Equipment sync is delayed. Existing handovers are unchanged. Reopen Equipment when the company connection returns.";
      if (!assignments.length) list.innerHTML = '<div class="empty">Equipment could not finish syncing. You can return to My Tool Bag without changing any records.</div>';
    };
    equipmentLoadTimer = setTimeout(delayed, 12000);
    unsubscribePeople = shared.db.collection("users").orderBy("name").onSnapshot(snapshot => {
      people = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderAll();
      ensureCoryAssignments();
    }, delayed);
    unsubscribeAssignments = shared.db.collection("equipmentAssignments").onSnapshot({ includeMetadataChanges: true }, snapshot => {
      assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      window.MPI_OWNER_VIEW?.setEquipmentData({ assignments, acknowledgments });
      // A partial/offline cache must not initialize or correct the stock list,
      // or authorize a new handover as if every server record had been loaded.
      assignmentSnapshotReady = !snapshot.metadata?.fromCache && !snapshot.metadata?.hasPendingWrites;
      if (assignmentSnapshotReady) clearTimeout(equipmentLoadTimer);
      renderAll();
      ensureCoryAssignments();
    }, () => { assignmentSnapshotReady = false; renderEquipmentSelectionState(); delayed(); });
    unsubscribeAcknowledgments = shared.db.collection("equipmentAcknowledgments").onSnapshot(snapshot => {
      acknowledgments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      window.MPI_OWNER_VIEW?.setEquipmentData({ assignments, acknowledgments });
      renderAll();
    }, delayed);
  }

  summary.addEventListener("click", event => {
    const button = event.target.closest("[data-equipment-employee]");
    if (!button) return;
    selectedEmployeeId = button.dataset.equipmentEmployee;
    selectedAssignmentIds.clear();
    renderAll();
  });
  employeeSelect.addEventListener("change", () => { selectedEmployeeId = employeeSelect.value; selectedAssignmentIds.clear(); renderAll(); });
  list.addEventListener("change", event => {
    const input = event.target.closest("[data-select-equipment-issue]");
    if (!input) return;
    if (input.checked) selectedAssignmentIds.add(input.dataset.selectEquipmentIssue);
    else selectedAssignmentIds.delete(input.dataset.selectEquipmentIssue);
    renderEquipmentSelectionState();
  });
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-save-equipment]");
    if (button) saveAssignment(button.closest("[data-equipment-assignment]"), button.dataset.saveEquipment);
  });
  createAcknowledgment.addEventListener("click", openAcknowledgment);
  addForm.addEventListener("submit", addTool);
  acknowledgmentDialog.addEventListener("click", event => { if (event.target.closest("[data-close-equipment-dialog]")) acknowledgmentDialog.close(); });
  history.addEventListener("click", async event => {
    const view = event.target.closest("[data-view-equipment-ack]");
    const resend = event.target.closest("[data-resend-equipment-ack]");
    if (view) {
      const record = acknowledgments.find(item => item.id === view.dataset.viewEquipmentAck);
      if (record) openDocument(record);
    }
    if (resend) {
      const record = acknowledgments.find(item => item.id === resend.dataset.resendEquipmentAck);
      const status = resend.parentElement.querySelector("[data-ack-history-status]");
      resend.disabled = true;
      status.textContent = "Sending…";
      try { await sendAcknowledgmentEmail(record); status.textContent = "Email sent"; }
      catch (error) { status.textContent = error?.message || "Email could not be sent"; }
      resend.disabled = false;
    }
  });
  documentDialog.addEventListener("click", event => {
    if (event.target.closest("[data-close-equipment-document]")) documentDialog.close();
    const download = event.target.closest("[data-download-equipment-ack]");
    if (download) {
      const record = acknowledgments.find(item => item.id === download.dataset.downloadEquipmentAck);
      if (record) downloadDocument(record);
    }
  });

  shared.watchSession(({ user, profile }) => {
    currentUser = user;
    currentProfile = profile;
    if (!user || !profile || !shared.isAdminRole(profile)) {
      clearTimeout(equipmentLoadTimer);
      unsubscribePeople?.(); unsubscribeAssignments?.(); unsubscribeAcknowledgments?.();
      people = []; assignments = []; acknowledgments = [];
      return;
    }
    startData();
  });
})();
