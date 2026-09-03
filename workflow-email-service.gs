var MPI_EMAIL = Object.freeze({
  RECIPIENT: "kev@michiganpropertyinspections.com",
  ADMIN_COPY: "admin@michiganpropertyinspections.com",
  REPLY_TO: "kev@michiganpropertyinspections.com",
  SOURCE: "mpi-field-tools-daily-closeout",
  LOGO_URL: "https://kevinspect.github.io/mpi-field-tools/mpi-logo.png",
  MAX_DAILY_SENDS: 50,
  MAX_REQUEST_BYTES: 12500000,
  MAX_ATTACHMENTS: 12,
  MAX_ATTACHMENT_BYTES: 2500000,
  STATUS_SECONDS: 21600
});

var MPI_PUSH = Object.freeze({
  SOURCE: "mpi-field-tools-push",
  PROJECT_ID: "mpi-field-notifications",
  WEB_APP_URL: "https://kevinspect.github.io/mpi-field-tools/",
  FIREBASE_API_KEY: "AIzaSyBH37lEcQdExd0JRTRWCYlZHWNevIJrmPk",
  MAX_TARGETS: 30
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
    var source = safeText_(input.source, 80);
    if (source === MPI_PUSH.SOURCE) return handlePushRequest_(input, requestId);
    if (!requestId || (source !== MPI_EMAIL.SOURCE && source !== "mpi-field-tools-form-email")) throw new Error("Request was not accepted");

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
      var genericForm = source === "mpi-field-tools-form-email";
      var payload = genericForm ? cleanFormPayload_(input) : cleanPayload_(input);
      var attachments = genericForm ? formAttachmentBlobs_(input.formAttachments) : attachmentBlobs_(input.labCocPhotos);
      MailApp.sendEmail({
        to: MPI_EMAIL.RECIPIENT,
        cc: MPI_EMAIL.ADMIN_COPY,
        replyTo: MPI_EMAIL.REPLY_TO,
        name: "Michigan Property Inspections",
        subject: genericForm ? payload.subject : "Daily Inspector Closeout | " + payload.inspectorName + " | " + payload.date,
        body: genericForm ? plainFormText_(payload) : plainText_(payload, attachments.length),
        htmlBody: genericForm ? renderFormEmail_(payload) : renderEmail_(payload, attachments.length),
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

function handlePushRequest_(input, requestId) {
  try {
    if (!requestId) throw new Error("Notification request ID is missing");
    var existing = readStatus_(requestId);
    if (existing && (existing.status === "sent" || existing.status === "partial" || existing.status === "no-target")) {
      return response_({ ok: true, status: "duplicate", requestId: requestId });
    }
    var sender = verifyFirebaseUser_(safeText_(input.idToken, 5000));
    if (!sender || !sender.emailVerified || !isMpiCompanyEmail_(sender.email)) throw new Error("Company sign-in could not be verified");
    var targets = cleanStringArray_(input.targetTokens, MPI_PUSH.MAX_TARGETS, 500);
    if (!targets.length && safeText_(input.audience, 20) === "office") targets = officeNotificationTokens_();
    targets = uniqueStrings_(targets);
    if (!targets.length) {
      writeStatus_(requestId, { ok: true, status: "no-target", requestId: requestId, sent: 0 });
      return response_({ ok: true, status: "no-target", requestId: requestId, sent: 0 });
    }
    var title = safeText_(input.title, 90) || "MPI Field Tools";
    var body = safeText_(input.body, 220) || "A new MPI message is available.";
    var link = absoluteAppLink_(safeText_(input.link, 500));
    var tag = safeText_(input.tag, 100) || requestId;
    var sent = 0;
    var failed = 0;
    targets.forEach(function (token) {
      if (sendFcmWebPush_(token, title, body, link, tag)) sent += 1;
      else failed += 1;
    });
    var status = failed ? (sent ? "partial" : "failed") : "sent";
    writeStatus_(requestId, { ok: sent > 0, status: status, requestId: requestId, sent: sent, failed: failed });
    return response_({ ok: sent > 0, status: status, requestId: requestId, sent: sent, failed: failed });
  } catch (error) {
    var message = safeText_(error && error.message ? error.message : "Notification delivery failed", 180);
    if (requestId) writeStatus_(requestId, { ok: false, status: "failed", requestId: requestId, message: message });
    return response_({ ok: false, status: "failed", requestId: requestId, message: message });
  }
}

function verifyFirebaseUser_(idToken) {
  if (!idToken) return null;
  var response = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(MPI_PUSH.FIREBASE_API_KEY), {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ idToken: idToken }),
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) return null;
  var parsed = JSON.parse(response.getContentText() || "{}");
  var user = parsed.users && parsed.users[0];
  return user ? { uid: user.localId, email: String(user.email || "").toLowerCase(), emailVerified: user.emailVerified === true } : null;
}

function isMpiCompanyEmail_(email) {
  var normalized = String(email || "").toLowerCase();
  return normalized === "kev@michiganpropertyinspections.com" || /@michiganpropertyinspections[.]com$/.test(normalized);
}

function officeNotificationTokens_() {
  try {
    var response = UrlFetchApp.fetch("https://firestore.googleapis.com/v1/projects/" + MPI_PUSH.PROJECT_ID + "/databases/(default)/documents/users?pageSize=100", {
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return [];
    var parsed = JSON.parse(response.getContentText() || "{}");
    return (parsed.documents || []).map(function (document) {
      var fields = document.fields || {};
      var active = fields.active && fields.active.booleanValue;
      var role = fields.role && fields.role.stringValue;
      var device = fields.officeNotificationDevice && fields.officeNotificationDevice.mapValue && fields.officeNotificationDevice.mapValue.fields;
      return active !== false && (role === "owner" || role === "admin") && device && device.enabled && device.enabled.booleanValue !== false
        ? String(device.token && device.token.stringValue || "")
        : "";
    }).filter(Boolean);
  } catch (_) {
    return [];
  }
}

function sendFcmWebPush_(token, title, body, link, tag) {
  var response = UrlFetchApp.fetch("https://fcm.googleapis.com/v1/projects/" + MPI_PUSH.PROJECT_ID + "/messages:send", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({
      message: {
        token: token,
        notification: { title: title, body: body },
        webpush: {
          headers: { Urgency: "high", TTL: "86400" },
          notification: {
            icon: MPI_PUSH.WEB_APP_URL + "icon-192.png",
            badge: MPI_PUSH.WEB_APP_URL + "icon-192.png",
            tag: tag,
            renotify: true,
            requireInteraction: true,
            vibrate: [250, 100, 250, 100, 450]
          },
          fcm_options: { link: link }
        },
        data: { title: title, body: body, link: link, tag: tag }
      }
    }),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  return code >= 200 && code < 300;
}

function absoluteAppLink_(value) {
  var link = String(value || "").trim();
  if (/^https:\/\//i.test(link)) return link;
  return MPI_PUSH.WEB_APP_URL + link.replace(/^\.\//, "").replace(/^\//, "");
}

function uniqueStrings_(values) {
  var seen = {};
  return values.filter(function (value) {
    var key = String(value || "").trim();
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function authorizePushService() {
  var response = UrlFetchApp.fetch(
    "https://firestore.googleapis.com/v1/projects/" + MPI_PUSH.PROJECT_ID + "/databases/(default)/documents/users?pageSize=1",
    {
      method: "get",
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    }
  );
  var code = response.getResponseCode();
  console.log("MPI push service permission check: " + code);
  if (code < 200 || code >= 300) throw new Error("Push service permission check failed: " + code);
  return code;
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
    morningMinutes: Math.max(0, Number(value.morningMinutes) || 0),
    betweenJobMinutes: Math.max(0, Number(value.betweenJobMinutes) || 0),
    labMinutes: Math.max(0, Number(value.labMinutes) || 0),
    finalMinutes: Math.max(0, Number(value.finalMinutes) || 0),
    totalMinutes: Math.max(0, Number(value.totalMinutes) || 0),
    finalPending: value.finalPending === true
  };
}

function cleanFormPayload_(input) {
  var formType = safeText_(input.formType, 80) || "Workflow Notification";
  var title = safeText_(input.title, 160) || formType;
  var inspectorName = safeText_(input.inspectorName, 80) || "MPI Inspector";
  return {
    formType: formType,
    title: title,
    inspectorName: inspectorName,
    submittedAt: friendlyDateTime_(safeText_(input.submittedAt, 80)),
    status: safeText_(input.status, 80) || "Submitted",
    subject: safeText_(input.subject, 220) || formType + " | " + inspectorName + " | " + title,
    preheader: inspectorName + " submitted " + title + " through MPI Field Tools.",
    fields: cleanObjectArray_(input.fields, 30, function (item) { return { label: safeText_(item.label, 100), value: safeText_(item.value, 1600) }; }).filter(function (item) { return item.label && item.value; })
  };
}

function friendlyDateTime_(value) {
  if (!value) return "Not recorded";
  var parsed = new Date(value);
  if (isNaN(parsed.getTime())) return safeText_(value, 80);
  return Utilities.formatDate(parsed, "America/Detroit", "MMMM d, yyyy 'at' h:mm a");
}

function duration_(minutes) {
  var value = Math.max(0, Math.round(Number(minutes) || 0));
  return Math.floor(value / 60) + " hr " + (value % 60) + " min";
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

function formAttachmentBlobs_(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MPI_EMAIL.MAX_ATTACHMENTS).map(function (item, index) {
    var base64 = item && typeof item.base64 === "string" ? item.base64.replace(/\s/g, "") : "";
    if (!base64 || base64.length > Math.ceil(MPI_EMAIL.MAX_ATTACHMENT_BYTES * 4 / 3) + 16) throw new Error("An attached MPI document was too large");
    var bytes = Utilities.base64Decode(base64);
    if (bytes.length > MPI_EMAIL.MAX_ATTACHMENT_BYTES) throw new Error("An attached MPI document was too large");
    return Utilities.newBlob(bytes, safeText_(item.mimeType, 80) || "application/octet-stream", safeFilename_(item.name || "MPI-document-" + (index + 1)));
  });
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

  var driveTime = payload.driveTime ? cardRows_([
    ["Morning drive", duration_(payload.driveTime.morningMinutes)],
    ["Between jobs", duration_(payload.driveTime.betweenJobMinutes)],
    ["Lab travel", duration_(payload.driveTime.labMinutes)],
    ["Final drive", payload.driveTime.finalPending ? "Pending" : duration_(payload.driveTime.finalMinutes)],
    ["Total drive time", duration_(payload.driveTime.totalMinutes)]
  ]) : '<p style="margin:0;color:#66708c;">Drive time was not available.</p>';

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
      section_("DRIVE TIME", driveTime) +
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
  if (payload.driveTime) lines.push("Drive Time: " + duration_(payload.driveTime.totalMinutes), "");
  lines.push("Completed Jobs:");
  payload.jobs.forEach(function (job) { lines.push("- " + job.address + " — " + job.status); });
  if (attachmentCount) lines.push("", "Chain of Custody photos attached: " + attachmentCount);
  lines.push("", "Michigan Property Inspections Workflow Management System");
  return lines.join("\n");
}

function renderFormEmail_(payload) {
  var rows = cardRows_([["Inspector", payload.inspectorName], ["Submitted", payload.submittedAt], ["Status", payload.status]].concat(payload.fields.map(function (field) { return [field.label, field.value]; })));
  return '<!doctype html><html><body style="margin:0;padding:0;background:#eef2f8;font-family:Arial,Helvetica,sans-serif;color:#11186a;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + html_(payload.preheader) + '</div>' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f8;"><tr><td align="center" style="padding:20px 10px;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fff;border:1px solid #d8e0eb;border-radius:22px;overflow:hidden;">' +
    '<tr><td align="center" style="padding:28px 22px;background:#11186a;"><img src="' + MPI_EMAIL.LOGO_URL + '" width="90" alt="Michigan Property Inspections" style="display:block;width:90px;height:auto;margin:0 auto 13px;"><div style="color:#d8b655;font-size:12px;letter-spacing:2px;font-weight:800;">MICHIGAN PROPERTY INSPECTIONS</div><h1 style="margin:8px 0 0;color:#fff;font-size:27px;line-height:34px;">' + html_(payload.formType.toUpperCase()) + '</h1></td></tr>' +
    '<tr><td style="padding:22px;">' + section_("SUBMISSION", '<div style="margin-bottom:14px;color:#11186a;font-size:20px;font-weight:800;">' + html_(payload.title) + '</div>' + rows) + '</td></tr>' +
    '<tr><td align="center" style="padding:24px;background:#f4f7fb;border-top:1px solid #d8e0eb;"><strong style="color:#11186a;">Michigan Property Inspections</strong><div style="margin-top:5px;color:#66708c;font-size:12px;line-height:18px;">Workflow Management System<br>(810) 243-4773 &middot; kev@michiganpropertyinspections.com</div><div style="margin-top:10px;color:#8b93a7;font-size:11px;">Automatically generated from MPI Field Tools.</div></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function plainFormText_(payload) {
  var lines = ["MICHIGAN PROPERTY INSPECTIONS", payload.formType, "", payload.title, "Inspector: " + payload.inspectorName, "Submitted: " + payload.submittedAt, "Status: " + payload.status, ""];
  payload.fields.forEach(function (field) { lines.push(field.label + ": " + field.value); });
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
