// One Step GPS is a read-only source of Cory's vehicle trip evidence. Keep the
// scoped device.read credential in Script Properties, never in this source or
// a browser-delivered file. This check returns no coordinates or key material.
var MPI_ONE_STEP_GPS = Object.freeze({
  API_ROOT: "https://track.onestepgps.com/v3/api/public",
  API_KEY_PROPERTY: "MPI_ONE_STEP_GPS_API_KEY",
  LIVE_HOURLY_LIMIT_PROPERTY: "MPI_ONE_STEP_GPS_HOURLY_LIMIT",
  CORY_DEVICE_ID: "6ljQwIubNfqQJk81f07-0F",
  CORY_VEHICLE_NAME: "2026 Ford Maverick XLT Hybrid",
  LABS: [
    { id: "water-tech", name: "Water Tech", latitude: 42.60173855226, longitude: -83.933302726036 },
    { id: "ims", name: "IMS Laboratory", latitude: 42.568062566443, longitude: -83.442830516886 }
  ]
});

function checkOneStepGpsConnection() {
  var devices = oneStepGpsFetch_("/device-info?device_id=1&display_name=1");
  var matches = oneStepGpsCoryDevices_(devices);
  return { ok: true, matchingVehicleCount: matches.length, accessibleVehicleCount: devices.length };
}

// Safe live-point diagnostic: verifies the real tracker and API allowance
// without disclosing the key or coordinates in logs.
function checkOneStepGpsCoryLivePoint() {
  var devices = oneStepGpsFetch_("/device-info?device_id=1&display_name=1");
  var deviceId = String(oneStepGpsCoryDevices_(devices)[0].device_id);
  var key = PropertiesService.getScriptProperties().getProperty(MPI_ONE_STEP_GPS.API_KEY_PROPERTY);
  if (!key) throw new Error("One Step GPS key is not configured");
  var response = UrlFetchApp.fetch(MPI_ONE_STEP_GPS.API_ROOT + "/device/" + encodeURIComponent(deviceId) + "?latest_point=true", {
    method: "get",
    headers: { Authorization: "Bearer " + key, Accept: "application/json" },
    muteHttpExceptions: true
  });
  var headers = response.getAllHeaders();
  var limits = {};
  Object.keys(headers).forEach(function (name) {
    if (/^(x-)?(rate-?limit|ratelimit)[-_]/i.test(name)) limits[name] = String(headers[name]).slice(0, 80);
  });
  var device = response.getResponseCode() === 200 ? JSON.parse(response.getContentText() || "null") : null;
  var point = device && (device.latest_device_point || device.latest_accurate_device_point);
  var summary = {
    httpStatus: response.getResponseCode(),
    deviceId: deviceId,
    deviceIdMatches: Boolean(device && String(device.device_id) === deviceId),
    hasPoint: Boolean(point),
    hasValidPosition: Boolean(point && typeof point.lat === "number" && isFinite(point.lat) && typeof point.lng === "number" && isFinite(point.lng)),
    trackerTime: point && point.dt_tracker || null,
    pointFields: point ? Object.keys(point).filter(function (field) { return ["dt_tracker", "dt_server", "lat", "lng", "speed", "device_state", "device_point_detail"].indexOf(field) >= 0; }) : [],
    driveStatus: point && point.device_state && point.device_state.drive_status || null,
    rateLimitHeaders: limits
  };
  console.log(JSON.stringify(summary));
  return summary;
}

function oneStepGpsFetch_(pathAndQuery) {
  var key = PropertiesService.getScriptProperties().getProperty(MPI_ONE_STEP_GPS.API_KEY_PROPERTY);
  if (!key) throw new Error("One Step GPS key is not configured");
  var response = UrlFetchApp.fetch(MPI_ONE_STEP_GPS.API_ROOT + pathAndQuery, {
    method: "get",
    headers: { Authorization: "Bearer " + key, Accept: "application/json" },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error("One Step GPS read failed with status " + response.getResponseCode());
  return JSON.parse(response.getContentText() || "null");
}

function oneStepGpsCoryDevices_(devices) {
  if (!Array.isArray(devices)) throw new Error("One Step GPS returned an unexpected device list");
  var matches = devices.filter(function (device) {
    return String(device.display_name || "").trim().toLowerCase() === MPI_ONE_STEP_GPS.CORY_VEHICLE_NAME.toLowerCase() && Boolean(device.device_id);
  });
  if (matches.length !== 1) throw new Error("Cory's tracked vehicle could not be identified unambiguously");
  return matches;
}

// This is invoked only by the authenticated office-only POST route. The shared
// Firestore record and script lock prevent a provider request per dashboard.
// No automatic provider reads occur until MPI's actual key allowance is set.
function refreshOneStepGpsCoryLive_() {
  var limitText = PropertiesService.getScriptProperties().getProperty(MPI_ONE_STEP_GPS.LIVE_HOURLY_LIMIT_PROPERTY);
  if (!/^(0|[1-9][0-9]*)$/.test(String(limitText || "").trim())) throw new Error("One Step GPS hourly key allowance has not been verified");
  var configuredLimit = Number(limitText);
  if (!Number.isSafeInteger(configuredLimit) || (configuredLimit !== 0 && configuredLimit < 24)) throw new Error("One Step GPS hourly key allowance has not been verified");
  var availablePerHour = configuredLimit === 0 ? Infinity : configuredLimit - 12; // provider uses 0 for unlimited; otherwise reserve 12 calls/hour
  var movingIntervalMs = Math.max(30000, Math.ceil(3600000 / availablePerHour));
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var current = oneStepGpsLiveDocument_();
    var intervalMs = current && current.vehicleStatus === "Stationary" ? Math.max(movingIntervalMs, 120000) :
      current && current.vehicleStatus === "Moving" ? movingIntervalMs : Math.max(movingIntervalMs, 120000);
    if (current && current.lastErrorAt) intervalMs = Math.max(intervalMs, 120000);
    var now = Date.now();
    var lastAttempt = Date.parse(current && current.lastAttemptAt || "");
    if (Number.isFinite(lastAttempt) && now - lastAttempt < intervalMs) return { cached: true, refreshSeconds: Math.ceil(intervalMs / 1000) };
    var key = PropertiesService.getScriptProperties().getProperty(MPI_ONE_STEP_GPS.API_KEY_PROPERTY);
    if (!key) throw new Error("One Step GPS key is not configured");
    try {
      var response = UrlFetchApp.fetch(MPI_ONE_STEP_GPS.API_ROOT + "/device/" + encodeURIComponent(MPI_ONE_STEP_GPS.CORY_DEVICE_ID) + "?latest_point=true", {
        method: "get", headers: { Authorization: "Bearer " + key, Accept: "application/json" }, muteHttpExceptions: true
      });
      if (response.getResponseCode() !== 200) throw new Error("One Step GPS live read failed with status " + response.getResponseCode());
      var device = JSON.parse(response.getContentText() || "null");
      if (!device || String(device.device_id) !== MPI_ONE_STEP_GPS.CORY_DEVICE_ID) throw new Error("One Step GPS device identity mismatch");
      var point = device.latest_device_point;
      if (!oneStepGpsValidLivePoint_(point)) point = device.latest_accurate_device_point;
      var update = { lastAttemptAt: new Date(now).toISOString(), lastErrorAt: null };
      if (oneStepGpsValidLivePoint_(point)) {
        var speed = point.device_point_detail && point.device_point_detail.speed;
        var speedValue = speed && Number(speed.value);
        var speedUnit = String(speed && speed.unit || "").toLowerCase();
        var status = point.device_state && point.device_state.drive_status === "off" ? "Stationary" :
          (speedUnit === "km/h" || speedUnit === "mph") && Number.isFinite(speedValue) && speedValue > 1 ? "Moving" : "Unknown";
        update.latitude = point.lat;
        update.longitude = point.lng;
        update.gpsAt = new Date(point.dt_tracker).toISOString();
        update.vehicleStatus = status;
        update.deviceId = MPI_ONE_STEP_GPS.CORY_DEVICE_ID;
        update.source = "One Step GPS";
        // Keep only Cory's current-day job-presence evidence in the office-only
        // truck document. Repeated/stale tracker points never advance a visit.
        try {
          var monitor = oneStepGpsCoryJobMonitor_(current && current.jobMonitor, update);
          if (monitor) update.jobMonitor = monitor;
        } catch (_) {
          // A schedule lookup must never prevent the live truck point updating.
        }
      }
      oneStepGpsWriteLive_(update);
      return { cached: false, hasValidPoint: Boolean(update.gpsAt), refreshSeconds: Math.ceil(intervalMs / 1000) };
    } catch (error) {
      try { oneStepGpsWriteLive_({ lastAttemptAt: new Date(now).toISOString(), lastErrorAt: new Date(now).toISOString() }); } catch (_) {}
      throw error;
    }
  } finally {
    lock.releaseLock();
  }
}

// One shared background tick preserves job-presence evidence when no office
// browser is open. The same lock/cache and verified provider quota apply.
function monitorOneStepGpsCoryLive() {
  var result = refreshOneStepGpsCoryLive_();
  console.log(JSON.stringify({ ok: true, cached: Boolean(result.cached), hasValidPoint: Boolean(result.hasValidPoint) }));
  return result;
}

function oneStepGpsCoryJobMonitor_(previous, point) {
  var sampleAt = Date.parse(point && point.gpsAt || "");
  if (!Number.isFinite(sampleAt) || Date.now() - sampleAt > 5 * 60000) return null;
  var date = Utilities.formatDate(new Date(sampleAt), "America/Detroit", "yyyy-MM-dd");
  var profile = oneStepGpsCoryProfile_().fields;
  var day = (Array.isArray(profile.spectoraScheduleDays) ? profile.spectoraScheduleDays : [])
    .filter(function (item) { return item && item.date === date; })[0];
  var jobs = (Array.isArray(day && day.jobs) ? day.jobs : []).filter(function (job) {
    return job && !/cancel|delete/i.test(String(job.status || "")) &&
      oneStepGpsValidCoordinate_(job.latitude, 90) && oneStepGpsValidCoordinate_(job.longitude, 180) &&
      Boolean(job.id || job.spectoraJobId);
  });
  var old = previous && previous.date === date ? previous : {};
  var last = Date.parse(old.lastProcessedAt || "");
  if (Number.isFinite(last) && sampleAt <= last) return null;
  var distances = jobs.map(function (job) {
    return { id: String(job.id || job.spectoraJobId), meters: oneStepGpsDistanceMeters_(
      { lat: point.latitude, lng: point.longitude }, { lat: job.latitude, lng: job.longitude }) };
  }).sort(function (left, right) { return left.meters - right.meters; });
  // Do not attribute a single tracker location to two nearby job properties.
  var nearest = distances[0] && distances[0].meters <= 150 &&
    (!distances[1] || distances[1].meters - distances[0].meters >= 75) ? distances[0].id : "";
  var previousVisits = Array.isArray(old.jobs) ? old.jobs : [];
  var visits = jobs.map(function (job) {
    var id = String(job.id || job.spectoraJobId);
    var before = previousVisits.filter(function (visit) { return visit && visit.id === id; })[0] || {};
    var visit = { id: id, arrivedAt: before.arrivedAt || null, departedAt: before.departedAt || null,
      insideSince: before.insideSince || null, outsideSince: before.outsideSince || null,
      lastInsideAt: before.lastInsideAt || null };
    var distance = distances.filter(function (item) { return item.id === id; })[0].meters;
    if (nearest === id) {
      visit.lastInsideAt = point.gpsAt;
      visit.outsideSince = null;
      if (!visit.insideSince) visit.insideSince = point.gpsAt;
      if (!visit.arrivedAt && sampleAt - Date.parse(visit.insideSince) >= 30000) visit.arrivedAt = visit.insideSince;
    } else if (visit.arrivedAt && !visit.departedAt && distance > 250) {
      if (!visit.outsideSince) visit.outsideSince = point.gpsAt;
      if (sampleAt - Date.parse(visit.outsideSince) >= 30000) visit.departedAt = visit.outsideSince;
    } else if (distance <= 250) {
      visit.outsideSince = null;
    } else {
      visit.insideSince = null;
    }
    return visit;
  });
  return { date: date, lastProcessedAt: point.gpsAt, jobs: visits };
}

function oneStepGpsValidLivePoint_(point) {
  var trackerMs = Date.parse(point && point.dt_tracker || "");
  return Boolean(point && typeof point.lat === "number" && isFinite(point.lat) && Math.abs(point.lat) <= 90 &&
    typeof point.lng === "number" && isFinite(point.lng) && Math.abs(point.lng) <= 180 &&
    Number.isFinite(trackerMs) && trackerMs <= Date.now() + 120000);
}

function oneStepGpsLiveDocument_() {
  var url = "https://firestore.googleapis.com/v1/projects/" + MPI_PUSH.PROJECT_ID + "/databases/(default)/documents/adminTruckLocations/cory";
  var response = UrlFetchApp.fetch(url, { method: "get", headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  if (response.getResponseCode() === 404) return null;
  if (response.getResponseCode() !== 200) throw new Error("Truck cache read failed with status " + response.getResponseCode());
  return oneStepGpsDecodeFirestoreValue_({ mapValue: { fields: JSON.parse(response.getContentText() || "{}").fields || {} } });
}

function oneStepGpsWriteLive_(fields) {
  var url = "https://firestore.googleapis.com/v1/projects/" + MPI_PUSH.PROJECT_ID + "/databases/(default)/documents/adminTruckLocations/cory";
  var paths = Object.keys(fields).map(function (name) { return "updateMask.fieldPaths=" + encodeURIComponent(name); }).join("&");
  var encoded = {};
  Object.keys(fields).forEach(function (name) { encoded[name] = firestoreValue_(fields[name]); });
  var response = UrlFetchApp.fetch(url + "?" + paths, {
    method: "patch", contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ fields: encoded }), muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error("Truck cache write failed with status " + response.getResponseCode());
}

// Read-only diagnostic for a single Michigan workday. It deliberately returns
// no coordinates, timestamps, routes, or employee/payroll changes.
function checkOneStepGpsCoryTripHistory() {
  var day = Utilities.formatDate(new Date(), "America/Detroit", "yyyy-MM-dd");
  var parts = day.split("-").map(Number);
  var dayUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  // The three-day UTC window covers the entire Michigan day across DST shifts.
  var from = new Date(dayUtc - 86400000).toISOString();
  var to = new Date(dayUtc + 172800000).toISOString();
  var devices = oneStepGpsFetch_("/device-info?device_id=1&display_name=1");
  var deviceId = oneStepGpsCoryDevices_(devices)[0].device_id;
  var query = "?device_id=" + encodeURIComponent(deviceId)
    + "&dt_tracker_from=" + encodeURIComponent(from)
    + "&dt_tracker_to=" + encodeURIComponent(to)
    + "&stop_duration=5m0s&return_points=false";
  var route = oneStepGpsFetch_("/route/drive-stop" + query);
  if (!route || !Array.isArray(route.drive_stop_list)) throw new Error("One Step GPS returned an unexpected trip history");
  var items = route.drive_stop_list.filter(function (item) {
    return item && item.time_from && item.time_to &&
      (Utilities.formatDate(new Date(item.time_from), "America/Detroit", "yyyy-MM-dd") === day ||
       Utilities.formatDate(new Date(item.time_to), "America/Detroit", "yyyy-MM-dd") === day);
  });
  var firstStop = items.filter(function (item) { return item.type === "stop"; })[0] || {};
  var firstDrive = items.filter(function (item) { return item.type === "drive"; })[0] || {};
  var summary = {
    ok: true,
    day: day,
    driveCount: items.filter(function (item) { return item.type === "drive"; }).length,
    stopCount: items.filter(function (item) { return item.type === "stop"; }).length,
    hasStopCoordinates: items.some(function (item) {
      return item.type === "stop" && item.lat_lng_from &&
        typeof item.lat_lng_from.lat === "number" && isFinite(item.lat_lng_from.lat) &&
        typeof item.lat_lng_from.lng === "number" && isFinite(item.lat_lng_from.lng);
    }),
    stopLocationFields: Object.keys(firstStop.lat_lng_from || {}),
    driveLocationFields: Object.keys(firstDrive.lat_lng_to || {})
  };
  console.log(JSON.stringify(summary));
  return summary;
}
// Reads the current Sunday-to-today period in one request. These counts are
// evidence of vehicle activity only; they are not calculated work hours.
function checkOneStepGpsCoryWeekTripHistory() {
  var bounds = oneStepGpsWeekBounds_();
  var todayUtc = bounds.todayUtc;
  var from = new Date(bounds.sundayUtc - 86400000).toISOString();
  var to = new Date(todayUtc + 172800000).toISOString();
  var devices = oneStepGpsFetch_("/device-info?device_id=1&display_name=1");
  var deviceId = oneStepGpsCoryDevices_(devices)[0].device_id;
  var query = "?device_id=" + encodeURIComponent(deviceId)
    + "&dt_tracker_from=" + encodeURIComponent(from)
    + "&dt_tracker_to=" + encodeURIComponent(to)
    + "&stop_duration=5m0s&return_points=false";
  var route = oneStepGpsFetch_("/route/drive-stop" + query);
  if (!route || !Array.isArray(route.drive_stop_list)) throw new Error("One Step GPS returned an unexpected trip history");
  var result = [];
  for (var utc = bounds.sundayUtc; utc <= todayUtc; utc += 86400000) {
    var date = new Date(utc).toISOString().slice(0, 10);
    var items = route.drive_stop_list.filter(function (item) {
      return item && item.time_from &&
        Utilities.formatDate(new Date(item.time_from), "America/Detroit", "yyyy-MM-dd") === date;
    });
    result.push({
      day: date,
      driveCount: items.filter(function (item) { return item.type === "drive"; }).length,
      stopCount: items.filter(function (item) { return item.type === "stop"; }).length,
      hasStopCoordinates: items.some(function (item) {
        return item.type === "stop" && item.lat_lng_from &&
          typeof item.lat_lng_from.lat === "number" && isFinite(item.lat_lng_from.lat) &&
          typeof item.lat_lng_from.lng === "number" && isFinite(item.lat_lng_from.lng);
      })
    });
  }
  console.log(JSON.stringify(result));
  return result;
}

function oneStepGpsDecodeFirestoreValue_(value) {
  if (!value || Object.prototype.hasOwnProperty.call(value, "nullValue")) return null;
  if (Object.prototype.hasOwnProperty.call(value, "stringValue")) return value.stringValue;
  if (Object.prototype.hasOwnProperty.call(value, "timestampValue")) return value.timestampValue;
  if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) return value.booleanValue;
  if (Object.prototype.hasOwnProperty.call(value, "integerValue")) return Number(value.integerValue);
  if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) return Number(value.doubleValue);
  if (value.arrayValue) return (value.arrayValue.values || []).map(oneStepGpsDecodeFirestoreValue_);
  if (value.mapValue) {
    var decoded = {};
    Object.keys(value.mapValue.fields || {}).forEach(function (key) {
      decoded[key] = oneStepGpsDecodeFirestoreValue_(value.mapValue.fields[key]);
    });
    return decoded;
  }
  throw new Error("Unexpected Firestore value type");
}

function oneStepGpsCoryProfile_() {
  var documents = listFirestoreUserDocuments_();
  var matches = documents.filter(function (document) {
    var fields = document.fields || {};
    return String(firestoreString_(fields, "name")).trim().toLowerCase() === "cory leese";
  });
  if (matches.length !== 1) throw new Error("Cory's MPI profile could not be identified unambiguously");
  return {
    documentName: matches[0].name,
    fields: oneStepGpsDecodeFirestoreValue_({ mapValue: { fields: matches[0].fields || {} } })
  };
}

// Confirms this week's schedule has usable geocoded job positions without
// logging customer addresses, route coordinates, or employee identifiers.
function checkOneStepGpsCoryScheduleCoverage() {
  var profile = oneStepGpsCoryProfile_().fields;
  var bounds = oneStepGpsWeekBounds_();
  var todayUtc = bounds.todayUtc;
  var scheduledDays = Array.isArray(profile.spectoraScheduleDays) ? profile.spectoraScheduleDays : [];
  var operationDays = Array.isArray(profile.operationsDays) ? profile.operationsDays : [];
  if (profile.operationsCurrent && profile.operationsCurrent.date) operationDays.push(profile.operationsCurrent);
  var summary = [];
  for (var utc = bounds.sundayUtc; utc <= todayUtc; utc += 86400000) {
    var date = new Date(utc).toISOString().slice(0, 10);
    var schedule = scheduledDays.filter(function (day) { return day && day.date === date; })[0] || {};
    var operation = operationDays.filter(function (day) { return day && day.date === date; })[0] || {};
    var jobs = Array.isArray(schedule.jobs) ? schedule.jobs : [];
    summary.push({
      day: date,
      scheduledJobs: jobs.length,
      geocodedJobs: jobs.filter(function (job) {
        return typeof job.latitude === "number" && isFinite(job.latitude) &&
          typeof job.longitude === "number" && isFinite(job.longitude);
      }).length,
      hasWorkdayRecord: Boolean(operation.date),
      hasClockRecord: Boolean(operation.timeClock),
      hasFinalTaskChoice: Boolean(operation.labStop && operation.labStop.finalStop)
    });
  }
  console.log(JSON.stringify(summary));
  return summary;
}

// Reads Spectora through MPI's existing GET-only connector. Only counts and
// address availability are logged; client names and addresses stay private.
function checkOneStepGpsCorySpectoraCoverage() {
  var bounds = oneStepGpsWeekBounds_();
  var todayUtc = bounds.todayUtc;
  var records = fetchSpectoraInspections_();
  var summary = [];
  for (var utc = bounds.sundayUtc; utc <= todayUtc; utc += 86400000) {
    var date = new Date(utc).toISOString().slice(0, 10);
    var datedJobs = records.filter(function (record) {
      var attributes = record && record.attributes || {};
      return String(attributes.datetime || "").slice(0, 10) === date &&
        !attributes.deleted_at && !attributes.canceled_at;
    });
    var jobs = datedJobs.filter(function (record) {
      return oneStepGpsInspectionHasInspector_(record, "cory leese");
    });
    var kevinJobs = datedJobs.filter(function (record) {
      return oneStepGpsInspectionHasInspector_(record, "kevin cave");
    });
    summary.push({
      day: date,
      inspectionCount: jobs.length,
      kevinInspectionCount: kevinJobs.length,
      otherInspectionCount: datedJobs.filter(function (record) {
        return !oneStepGpsInspectionHasInspector_(record, "cory leese") &&
          !oneStepGpsInspectionHasInspector_(record, "kevin cave");
      }).length,
      addressCount: jobs.filter(function (job) {
        var attributes = job.attributes || {};
        return Boolean(attributes.full_address || attributes.property_address);
      }).length
    });
  }
  console.log(JSON.stringify(summary));
  return summary;
}

// Spectora may list multiple assigned inspectors in one inspector_name field.
// Treat each comma-separated name as an assignee, without treating a partial
// name or an unrelated inspector as Cory.
function oneStepGpsInspectionHasInspector_(record, personName) {
  var names = String(record && record.attributes && record.attributes.inspector_name || "")
    .split(",")
    .map(function (name) { return normalizedPersonName_(name); });
  return names.indexOf(normalizedPersonName_(personName)) >= 0;
}

function oneStepGpsWeekBounds_(date) {
  var today = Utilities.formatDate(date || new Date(), "America/Detroit", "yyyy-MM-dd");
  var parts = today.split("-").map(Number);
  var todayUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  var sundayUtc = todayUtc - new Date(todayUtc).getUTCDay() * 86400000;
  return { todayUtc: todayUtc, sundayUtc: sundayUtc };
}

function oneStepGpsValidCoordinate_(value, limit) {
  return value !== null && value !== undefined && value !== "" &&
    isFinite(Number(value)) && Math.abs(Number(value)) <= limit && Number(value) !== 0;
}

function oneStepGpsDistanceMeters_(a, b) {
  var lat1 = Number(a.lat) * Math.PI / 180;
  var lat2 = Number(b.lat) * Math.PI / 180;
  var dLat = lat2 - lat1;
  var dLng = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// A sustained stop at a known lab after the last matched inspection can
// propose a final-task departure. Vehicle movement alone cannot verify that
// Cory finished all work, so this never changes a clock or payroll record.
function oneStepGpsCoryFinalLabStop_(stops, date, lastJobDeparture) {
  if (lastJobDeparture === null || !isFinite(lastJobDeparture)) return null;
  var candidates = (stops || []).filter(function (stop) {
    return stop && isFinite(stop.start) && isFinite(stop.end) &&
      stop.start >= lastJobDeparture && stop.end - stop.start >= 5 * 60000 &&
      stop.end - lastJobDeparture <= 12 * 60 * 60000 &&
      Utilities.formatDate(new Date(stop.start), "America/Detroit", "yyyy-MM-dd") === date &&
      Utilities.formatDate(new Date(stop.end), "America/Detroit", "yyyy-MM-dd") === date;
  }).map(function (stop) {
    var lab = MPI_ONE_STEP_GPS.LABS.map(function (place) {
      return { place: place, meters: oneStepGpsDistanceMeters_(stop.coordinates, { lat: place.latitude, lng: place.longitude }) };
    }).filter(function (match) { return match.meters <= 200; })
      .sort(function (a, b) { return a.meters - b.meters; })[0];
    return lab ? { labId: lab.place.id, labName: lab.place.name, start: stop.start, end: stop.end } : null;
  }).filter(Boolean).sort(function (a, b) { return b.end - a.end; });
  return candidates[0] || null;
}

// Compare Cory's assigned Spectora inspection properties with sustained
// vehicle stops. No customer address, coordinate or key leaves this function.
function oneStepGpsCoryJobStopCoverage_() {
  var bounds = oneStepGpsWeekBounds_();
  var from = new Date(bounds.sundayUtc - 86400000).toISOString();
  var to = new Date(bounds.todayUtc + 172800000).toISOString();
  var spectoraQuery = "?filter[datetime_greater_than]=" + encodeURIComponent(from)
    + "&filter[datetime_less_than]=" + encodeURIComponent(to)
    + "&page[size]=200&sort=datetime&include=property";
  var spectora = spectoraGet_("/inspections" + spectoraQuery);
  var properties = {};
  (spectora.included || []).forEach(function (entry) {
    if (entry && entry.type === "property") properties[String(entry.id)] = entry.attributes || {};
  });
  var jobs = (spectora.data || []).filter(function (record) {
    var attrs = record && record.attributes || {};
    return oneStepGpsInspectionHasInspector_(record, "cory leese") &&
      !attrs.deleted_at && !attrs.canceled_at;
  }).map(function (record) {
    var propertyRef = record.relationships && record.relationships.property &&
      record.relationships.property.data;
    var property = propertyRef && properties[String(propertyRef.id)] || {};
    var attrs = record.attributes || {};
    return {
      date: String(attrs.datetime || "").slice(0, 10),
      start: Date.parse(attrs.datetime || ""),
      durationMinutes: Math.max(0, Number(attrs.duration) || 0) * 60,
      coordinates: oneStepGpsValidCoordinate_(property.lat, 90) &&
        oneStepGpsValidCoordinate_(property.lng, 180)
        ? { lat: Number(property.lat), lng: Number(property.lng) } : null
    };
  });
  var devices = oneStepGpsFetch_("/device-info?device_id=1&display_name=1");
  var deviceId = oneStepGpsCoryDevices_(devices)[0].device_id;
  var gpsQuery = "?device_id=" + encodeURIComponent(deviceId)
    + "&dt_tracker_from=" + encodeURIComponent(from)
    + "&dt_tracker_to=" + encodeURIComponent(to)
    + "&stop_duration=5m0s&return_points=false";
  var route = oneStepGpsFetch_("/route/drive-stop" + gpsQuery);
  if (!route || !Array.isArray(route.drive_stop_list)) throw new Error("One Step GPS returned an unexpected trip history");
  var stops = route.drive_stop_list.filter(function (item) {
    return item && item.type === "stop" && item.time_from && item.time_to &&
      item.lat_lng_from && oneStepGpsValidCoordinate_(item.lat_lng_from.lat, 90) &&
      oneStepGpsValidCoordinate_(item.lat_lng_from.lng, 180);
  }).map(function (item) {
    return {
      start: Date.parse(item.time_from), end: Date.parse(item.time_to),
      coordinates: { lat: Number(item.lat_lng_from.lat), lng: Number(item.lat_lng_from.lng) }
    };
  }).filter(function (item) { return isFinite(item.start) && isFinite(item.end) && item.end > item.start; });
  var result = [];
  for (var utc = bounds.sundayUtc; utc <= bounds.todayUtc; utc += 86400000) {
    var date = new Date(utc).toISOString().slice(0, 10);
    var dayJobs = jobs.filter(function (job) { return job.date === date; });
    var matched = dayJobs.map(function (job) {
      if (!job.coordinates || !isFinite(job.start)) return null;
      var windowStart = job.start - 90 * 60000;
      var windowEnd = job.start + (job.durationMinutes + 120) * 60000;
      var candidates = stops.filter(function (stop) {
        return stop.start <= windowEnd && stop.end >= windowStart &&
          oneStepGpsDistanceMeters_(stop.coordinates, job.coordinates) <= 200;
      }).sort(function (a, b) {
        return Math.abs(a.start - job.start) - Math.abs(b.start - job.start);
      });
      return candidates[0] || null;
    }).filter(Boolean);
    var firstArrival = matched.length ? Math.min.apply(null, matched.map(function (stop) { return stop.start; })) : null;
    var lastJobDeparture = matched.length ? Math.max.apply(null, matched.map(function (stop) { return stop.end; })) : null;
    var allJobsMatched = dayJobs.length > 0 && matched.length === dayJobs.length;
    var finalLab = allJobsMatched ? oneStepGpsCoryFinalLabStop_(stops, date, lastJobDeparture) : null;
    result.push({
      day: date,
      assignedJobs: dayJobs.length,
      jobsWithCoordinates: dayJobs.filter(function (job) { return Boolean(job.coordinates); }).length,
      matchedJobStops: matched.length,
      vehicleStopCount: stops.filter(function (stop) {
        return Utilities.formatDate(new Date(stop.start), "America/Detroit", "yyyy-MM-dd") === date;
      }).length,
      firstJobArrivalCandidate: firstArrival !== null ? new Date(firstArrival).toISOString() : null,
      lastJobDepartureCandidate: lastJobDeparture !== null ? new Date(lastJobDeparture).toISOString() : null,
      candidateJobWindowMinutes: allJobsMatched &&
        firstArrival !== null && lastJobDeparture !== null
        ? Math.max(0, Math.round((lastJobDeparture - firstArrival) / 60000)) : null,
      candidateLabName: finalLab ? finalLab.labName : null,
      candidateLabArrival: finalLab ? new Date(finalLab.start).toISOString() : null,
      candidateLabDeparture: finalLab ? new Date(finalLab.end).toISOString() : null,
      candidateFinalTaskWindowMinutes: finalLab && firstArrival !== null
        ? Math.max(0, Math.round((finalLab.end - firstArrival) / 60000)) : null,
      workdayEndVerified: false
    });
  }
  return result;
}

// Manually runnable read-only check. The times are only candidates for the
// first-to-last *inspection* window, never a paid-hours or workday-end record.
function checkOneStepGpsCoryJobStopCoverage() {
  var result = oneStepGpsCoryJobStopCoverage_();
  console.log(JSON.stringify(result));
  return result;
}

// Store only minimal proposed comparison data in Cory's protected MPI profile.
// This cannot edit Spectora, app clock events, approved hours, or payroll.
function syncOneStepGpsCoryReview() {
  var profile = oneStepGpsCoryProfile_();
  var generatedAt = new Date().toISOString();
  var currentWeek = oneStepGpsCoryJobStopCoverage_().map(function (day) {
    return {
      day: day.day,
      assignedJobs: day.assignedJobs,
      matchedJobStops: day.matchedJobStops,
      vehicleStopCount: day.vehicleStopCount,
      firstJobArrivalCandidate: day.firstJobArrivalCandidate,
      lastJobDepartureCandidate: day.lastJobDepartureCandidate,
      candidateJobWindowMinutes: day.candidateJobWindowMinutes,
      candidateLabName: day.candidateLabName,
      candidateLabArrival: day.candidateLabArrival,
      candidateLabDeparture: day.candidateLabDeparture,
      candidateFinalTaskWindowMinutes: day.candidateFinalTaskWindowMinutes,
      workdayEndVerified: false,
      generatedAt: generatedAt
    };
  });
  var currentDates = {};
  currentWeek.forEach(function (day) { currentDates[day.day] = true; });
  var earliestRetained = new Date(Date.now() - 56 * 86400000).toISOString().slice(0, 10);
  var previous = Array.isArray(profile.fields.oneStepGpsReviewDays)
    ? profile.fields.oneStepGpsReviewDays : [];
  var days = previous.filter(function (day) {
    return day && typeof day.day === "string" && day.day >= earliestRetained &&
      !currentDates[day.day];
  }).concat(currentWeek).sort(function (a, b) { return a.day.localeCompare(b.day); });
  var resourcePath = String(profile.documentName || "")
    .replace(/^projects\/[\w-]+\/databases\/\(default\)\/documents\//, "");
  if (!/^users\/[^/]+$/.test(resourcePath)) throw new Error("Cory profile path was not allowed");
  var url = "https://firestore.googleapis.com/v1/projects/" + MPI_SPECTORA.PROJECT_ID +
    "/databases/(default)/documents/" + resourcePath +
    "?updateMask.fieldPaths=oneStepGpsReviewDays" +
    "&updateMask.fieldPaths=oneStepGpsReviewUpdatedAt" +
    "&updateMask.fieldPaths=oneStepGpsReviewSource";
  firestoreFetchWithRetry_(url, {
    method: "patch",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ fields: {
      oneStepGpsReviewDays: firestoreValue_(days),
      oneStepGpsReviewUpdatedAt: { timestampValue: generatedAt },
      oneStepGpsReviewSource: { stringValue: "One Step GPS + Spectora planning comparison" }
    }}),
    muteHttpExceptions: true
  }, "Cory GPS planning review write");
  var summary = {
    ok: true,
    daysUpdated: currentWeek.length,
    assignedJobs: currentWeek.reduce(function (total, day) { return total + day.assignedJobs; }, 0),
    matchedJobStops: currentWeek.reduce(function (total, day) { return total + day.matchedJobStops; }, 0),
    changedPayrollOrClockRecords: false
  };
  console.log(JSON.stringify(summary));
  return summary;
}

function checkOneStepGpsCorySavedReview() {
  var profile = oneStepGpsCoryProfile_().fields;
  var days = Array.isArray(profile.oneStepGpsReviewDays) ? profile.oneStepGpsReviewDays : [];
  var thisWeek = oneStepGpsWeekBounds_();
  var sunday = new Date(thisWeek.sundayUtc).toISOString().slice(0, 10);
  var current = days.filter(function (day) { return day && day.day >= sunday; });
  var summary = {
    ok: true,
    savedCurrentWeekDays: current.length,
    matchedJobStops: current.reduce(function (total, day) { return total + (Number(day.matchedJobStops) || 0); }, 0),
    hasRawCoordinates: current.some(function (day) { return day.coordinates || day.latitude || day.longitude; }),
    changedPayrollOrClockRecords: false
  };
  console.log(JSON.stringify(summary));
  return summary;
}
