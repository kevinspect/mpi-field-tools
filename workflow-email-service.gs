var MPI_EMAIL = Object.freeze({
  RECIPIENT: "kev@michiganpropertyinspections.com",
  REPLY_TO: "kev@michiganpropertyinspections.com",
  SOURCE: "mpi-field-tools-daily-closeout",
  LOGO_URL: "https://kevinspect.github.io/mpi-field-tools/mpi-logo.png",
  MAX_DAILY_SENDS: 50,
  MAX_REQUEST_BYTES: 12500000,
  MAX_ATTACHMENTS: 12,
  MAX_ATTACHMENT_BYTES: 650000,
  STATUS_SECONDS: 21600
});

function doGet(event) {
  var parameters = event && event.parameter ? event.parameter : {};
  if (parameters.action === "status") {
    var requestId = safeText_(parameters.requestId, 120);
    var status = requestId ? readStatus_(requestId) : null;
    return response_(status || { ok: true, status: "pending" }, parameters.callback);
  }
  return response_({ ok: true, service: "MPI Workflow Email Service" }, parameters.callback);
}

function doPost(event) {
  var requestId = "";
  try {
    var contents = event && event.postData ? String(event.postData.contents || "") : "";
    if (!contents || contents.length > MPI_EMAIL.MAX_REQUEST_BYTES) throw new Error("Request was empty or too large");
    var input = JSON.parse(contents);
    requestId = safeText_(input.requestId, 120);
    if (!requestId || safeText_(input.source, 80) !== MPI_EMAIL.SOURCE) throw new Error("Request was not accepted");

    var existing = readStatus_(requestId);
    if (existing && (existing.status === "sent" || existing.status === "duplicate")) {
      return response_({ ok: true, status: "duplicate", requestId: requestId });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      existing = readStatus_(requestId);
      if (existing && existing.status === "sent") return response_({ ok: true, status: "duplicate", requestId: requestId });
      enforceDailyLimit_();
      var payload = cleanPayload_(input);
      var attachments = attachmentBlobs_(input.labCocPhotos);
      MailApp.sendEmail({
        to: MPI_EMAIL.RECIPIENT,
        replyTo: MPI_EMAIL.REPLY_TO,
        name: "Michigan Property Inspections",
        subject: "Daily Inspector Closeout | " + payload.inspectorName + " | " + payload.date,
        body: plainText_(payload, attachments.length),
        htmlBody: renderEmail_(payload, attachments.length),
        attachments: attachments
      });
      incrementDailyCount_();
      writeStatus_(requestId, { ok: true, status: "sent", requestId: requestId, attachmentCount: attachments.length });
      return response_({ ok: true, status: "sent", requestId: requestId, attachmentCount: attachments.length });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    var message = safeText_(error && error.message ? error.message : "Email delivery failed", 180);
    if (requestId) writeStatus_(requestId, { ok: false, status: "failed", requestId: requestId, message: message });
    return response_({ ok: false, status: "failed", requestId: requestId, message: message });
  }
}

function cleanPayload_(input) {
  var equipment = cleanStringArray_(input.equipment, 20, 80);
  var activity = cleanObjectArray_(input.activity, 100, function (item) {
    return {
      time: safeText_(item.time, 30),
      label: safeText_(item.label, 130),
      address: safeText_(item.address, 220),
      detail: safeText_(item.detail, 240)
    };
  });
  var jobs = cleanObjectArray_(input.jobs, 30, function (item) {
    return {
      address: safeText_(item.address, 240) || "Address not available",
      scheduledTime: safeText_(item.scheduledTime, 40),
      services: cleanStringArray_(item.services, 15, 100),
      status: safeText_(item.status, 40) || "Completed"
    };
  });
  return {
    inspectorName: safeText_(input.inspectorName, 80) || "MPI Inspector",
    date: safeText_(input.date, 80) || "Date not available",
    status: safeText_(input.status, 40) || "Day Completed",
    closeoutLabel: safeText_(input.closeoutLabel, 80) || "Daily Inspector Closeout",
    preheader: safeText_(input.preheader, 180),
    equipment: equipment,
    timeClock: cleanTimeClock_(input.timeClock),
    driveTime: cleanDriveTime_(input.driveTime),
    activity: activity,
    jobs: jobs,
    exceptions: cleanStringArray_(input.exceptions, 20, 280),
    cocPhotos: cleanObjectArray_(input.labCocPhotos, MPI_EMAIL.MAX_ATTACHMENTS, function (item) {
      return { labName: safeText_(item.labName, 80), name: safeText_(item.name, 80), capturedAt: safeText_(item.capturedAt, 50) };
    })
  };
}

function cleanTimeClock_(value) {
  if (!value || typeof value !== "object") return null;
  return {
    activityStartTime: safeText_(value.activityStartTime, 40),
    hoursWorkedStartTime: safeText_(value.hoursWorkedStartTime, 40),
    clockOffTime: safeText_(value.clockOffTime, 40),
    totalWorked: safeText_(value.totalWorked, 40),
    managementActivityWindow: safeText_(value.managementActivityWindow, 50),
    shiftCount: Math.max(0, Number(value.shiftCount) || 0)
  };
}

function cleanDriveTime_(value) {
  if (!value || typeof value !== "object") return null;
  return {
    total: safeText_(value.total || value.totalDriveTime, 50),
    count: Math.max(0, Number(value.count || value.driveCount) || 0)
  };
}

function attachmentBlobs_(items) {
  if (!Array.isArray(items)) return [];
  var blobs = [];
  items.slice(0, MPI_EMAIL.MAX_ATTACHMENTS).forEach(function (item, index) {
    var base64 = item && typeof item.base64 === "string" ? item.base64.replace(/\s/g, "") : "";
    if (!base64 || base64.length > Math.ceil(MPI_EMAIL.MAX_ATTACHMENT_BYTES * 4 / 3) + 16) throw new Error("A Chain of Custody photo was too large");
    var bytes = Utilities.base64Decode(base64);
    if (bytes.length > MPI_EMAIL.MAX_ATTACHMENT_BYTES) throw new Error("A Chain of Custody photo was too large");
    var labName = safeFilename_(item.labName || "Lab");
    var suppliedName = safeFilename_(item.name || "COC-" + (index + 1) + ".jpg");
    var name = (labName + "-" + suppliedName).slice(0, 100);
    blobs.push(Utilities.newBlob(bytes, "image/jpeg", name));
  });
  return blobs;
}

function renderEmail_(payload, attachmentCount) {
  var equipment = payload.equipment.length
    ? payload.equipment.map(function (item) { return '<span style="display:inline-block;margin:0 7px 8px 0;padding:9px 12px;border:1px solid #cbd9e8;border-radius:999px;background:#edf5fb;color:#11186a;font-size:13px;font-weight:700;">&#10003; ' + html_(item) + '</span>'; }).join("")
    : '<span style="color:#66708c;">No equipment list was included.</span>';

  var timeClock = payload.timeClock ? cardRows_([
    ["Inspector activity started", payload.timeClock.activityStartTime],
    ["Hours Worked started", payload.timeClock.hoursWorkedStartTime],
    ["Clocked out", payload.timeClock.clockOffTime],
    ["Hours Worked", payload.timeClock.totalWorked],
    ["Management activity window", payload.timeClock.managementActivityWindow]
  ]) : '<p style="margin:0;color:#66708c;">Timekeeping was not available.</p>';

  var activity = payload.activity.length
    ? payload.activity.map(function (item) {
        var second = [item.address, item.detail].filter(Boolean).map(html_).join(" &middot; ");
        return '<tr><td style="width:88px;padding:12px 12px 12px 0;border-bottom:1px solid #e4e9f0;color:#3475a8;font-weight:800;vertical-align:top;white-space:nowrap;">' + html_(item.time) + '</td><td style="padding:12px 0;border-bottom:1px solid #e4e9f0;color:#11186a;vertical-align:top;"><strong>' + html_(item.label) + '</strong>' + (second ? '<div style="margin-top:4px;color:#66708c;font-size:13px;line-height:19px;">' + second + '</div>' : '') + '</td></tr>';
      }).join("")
    : '<tr><td style="padding:16px;color:#66708c;">No daily activity was included.</td></tr>';

  var jobs = payload.jobs.length
    ? payload.jobs.map(function (job) {
        var services = job.services.length ? job.services.map(function (service) { return '<span style="display:inline-block;margin:5px 5px 0 0;padding:6px 9px;border-radius:999px;background:#eef3fa;color:#293767;font-size:12px;font-weight:700;">' + html_(service) + '</span>'; }).join("") : '<span style="color:#66708c;">Services not listed</span>';
        return '<div style="margin-top:12px;padding:16px;border:1px solid #d8e0eb;border-radius:14px;background:#ffffff;"><div style="font-size:17px;line-height:23px;color:#11186a;font-weight:800;">' + html_(job.address) + '</div><div style="margin-top:8px;color:#66708c;font-size:13px;">Inspection time: <strong style="color:#293767;">' + html_(job.scheduledTime || "Not listed") + '</strong></div><div style="margin-top:5px;color:#167044;font-size:13px;font-weight:800;">&#10003; ' + html_(job.status) + '</div><div style="margin-top:6px;">' + services + '</div></div>';
      }).join("")
    : '<div style="padding:16px;color:#66708c;">No completed jobs were included.</div>';

  var coc = attachmentCount
    ? '<div style="padding:16px;border:1px solid #cbd9e8;border-radius:14px;background:#edf5fb;color:#11186a;"><strong>&#10003; ' + attachmentCount + ' Chain of Custody photo' + (attachmentCount === 1 ? '' : 's') + ' attached</strong><div style="margin-top:7px;color:#66708c;font-size:13px;line-height:19px;">' + payload.cocPhotos.map(function (photo, index) { return html_((photo.labName || "Laboratory") + " — COC photo " + (index + 1)); }).join("<br>") + '</div></div>'
    : '';

  var exceptions = payload.exceptions.length
    ? '<div style="padding:16px;border:1px solid #d3a52e;border-radius:14px;background:#fff8e1;color:#5d4600;">' + payload.exceptions.map(function (item) { return '<div style="margin:5px 0;">&#9888; ' + html_(item) + '</div>'; }).join("") + '</div>'
    : '<div style="padding:16px;border:1px solid #b9dfcb;border-radius:14px;background:#eaf8ef;color:#167044;font-weight:700;">&#10003; No outstanding workflow issues recorded.</div>';

  return '<!doctype html><html><body style="margin:0;padding:0;background:#eef2f8;font-family:Arial,Helvetica,sans-serif;color:#11186a;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + html_(payload.preheader) + '</div>' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f8;"><tr><td align="center" style="padding:20px 10px;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #d8e0eb;border-radius:22px;overflow:hidden;">' +
    '<tr><td align="center" style="padding:28px 22px;background:#11186a;"><img src="' + MPI_EMAIL.LOGO_URL + '" width="90" alt="Michigan Property Inspections" style="display:block;width:90px;height:auto;margin:0 auto 13px;"><div style="color:#d8b655;font-size:12px;line-height:18px;letter-spacing:2px;font-weight:800;">MICHIGAN PROPERTY INSPECTIONS</div><h1 style="margin:8px 0 0;color:#ffffff;font-size:27px;line-height:34px;">' + html_(payload.closeoutLabel.toUpperCase()) + '</h1></td></tr>' +
    '<tr><td style="padding:22px;">' +
      section_("INSPECTOR", cardRows_([["Inspector Name", payload.inspectorName], ["Date", payload.date], ["Status", payload.status]])) +
      section_("HOURS & ACTIVITY WINDOW", timeClock) +
      section_("EQUIPMENT RETURNED / CONFIRMED", equipment) +
      section_("DAILY ACTIVITY", '<table role="presentation" width="100%" cellspacing="0" cellpadding="0">' + activity + '</table>') +
      section_("COMPLETED JOBS", jobs) +
      (attachmentCount ? section_("LAB CHAIN OF CUSTODY", coc) : '') +
      section_("EXCEPTIONS / ACTION REQUIRED", exceptions) +
    '</td></tr>' +
    '<tr><td align="center" style="padding:24px;background:#f4f7fb;border-top:1px solid #d8e0eb;"><div style="width:48px;height:3px;background:#b48720;margin:0 auto 13px;"></div><strong style="color:#11186a;">Michigan Property Inspections</strong><div style="margin-top:5px;color:#66708c;font-size:12px;line-height:18px;">Workflow Management System<br>(810) 243-4773 &middot; kev@michiganpropertyinspections.com</div><div style="margin-top:10px;color:#8b93a7;font-size:11px;">Automatically generated from the inspector workflow app.</div></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function section_(title, body) {
  return '<div style="margin-bottom:22px;"><div style="margin:0 0 9px;color:#b48720;font-size:12px;line-height:18px;letter-spacing:1.8px;font-weight:800;">' + title + '</div><div style="padding:17px;border:1px solid #d8e0eb;border-radius:16px;background:#ffffff;">' + body + '</div></div>';
}

function cardRows_(rows) {
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0">' + rows.filter(function (row) { return row[1]; }).map(function (row) { return '<tr><td style="padding:7px 10px 7px 0;color:#66708c;font-size:13px;vertical-align:top;width:45%;">' + html_(row[0]) + '</td><td style="padding:7px 0;color:#11186a;font-size:14px;font-weight:800;vertical-align:top;">' + html_(row[1]) + '</td></tr>'; }).join("") + '</table>';
}

function plainText_(payload, attachmentCount) {
  var lines = ["MICHIGAN PROPERTY INSPECTIONS", payload.closeoutLabel, "", "Inspector: " + payload.inspectorName, "Date: " + payload.date, "Status: " + payload.status, ""];
  if (payload.timeClock) lines.push("Hours Worked: " + payload.timeClock.totalWorked, "Clocked out: " + payload.timeClock.clockOffTime, "");
  lines.push("Completed Jobs:");
  payload.jobs.forEach(function (job) { lines.push("- " + job.address + " — " + job.status); });
  if (attachmentCount) lines.push("", "Chain of Custody photos attached: " + attachmentCount);
  lines.push("", "Michigan Property Inspections Workflow Management System");
  return lines.join("\n");
}

function enforceDailyLimit_() {
  var count = Number(PropertiesService.getScriptProperties().getProperty(dailyKey_()) || 0);
  if (count >= MPI_EMAIL.MAX_DAILY_SENDS) throw new Error("Daily email safety limit reached");
}

function incrementDailyCount_() {
  var properties = PropertiesService.getScriptProperties();
  var key = dailyKey_();
  properties.setProperty(key, String(Number(properties.getProperty(key) || 0) + 1));
}

function dailyKey_() {
  return "sent-" + Utilities.formatDate(new Date(), "America/Detroit", "yyyy-MM-dd");
}

function readStatus_(requestId) {
  var raw = CacheService.getScriptCache().get("mpi-status:" + requestId);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function writeStatus_(requestId, status) {
  CacheService.getScriptCache().put("mpi-status:" + requestId, JSON.stringify(status), MPI_EMAIL.STATUS_SECONDS);
}

function response_(value, callback) {
  var json = JSON.stringify(value);
  var safeCallback = /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(String(callback || "")) ? String(callback) : "";
  return ContentService.createTextOutput(safeCallback ? safeCallback + "(" + json + ");" : json)
    .setMimeType(safeCallback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function cleanStringArray_(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map(function (item) { return safeText_(item, maxLength); }).filter(Boolean);
}

function cleanObjectArray_(value, maxItems, mapper) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).filter(function (item) { return item && typeof item === "object"; }).map(mapper);
}

function safeText_(value, maxLength) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength || 200);
}

function safeFilename_(value) {
  return safeText_(value, 80).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "MPI-COC.jpg";
}

function html_(value) {
  return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
