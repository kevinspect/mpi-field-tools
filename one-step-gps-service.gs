// One Step GPS is a read-only source of Cory's vehicle trip evidence. Keep the
// scoped device.read credential in Script Properties, never in this source or
// a browser-delivered file. This check returns no coordinates or key material.
var MPI_ONE_STEP_GPS = Object.freeze({
  API_ROOT: "https://track.onestepgps.com/v3/api/public",
  API_KEY_PROPERTY: "MPI_ONE_STEP_GPS_API_KEY",
  CORY_VEHICLE_NAME: "2026 Ford Maverick XLT Hybrid"
});

function checkOneStepGpsConnection() {
  var devices = oneStepGpsFetch_("/device-info?device_id=1&display_name=1");
  var matches = oneStepGpsCoryDevices_(devices);
  return { ok: true, matchingVehicleCount: matches.length, accessibleVehicleCount: devices.length };
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
// Reads the current Monday-to-today period in one request. These counts are
// evidence of vehicle activity only; they are not calculated work hours.
function checkOneStepGpsCoryWeekTripHistory() {
  var today = Utilities.formatDate(new Date(), "America/Detroit", "yyyy-MM-dd");
  var parts = today.split("-").map(Number);
  var todayUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  var mondayUtc = todayUtc - ((new Date(todayUtc).getUTCDay() + 6) % 7) * 86400000;
  var from = new Date(mondayUtc - 86400000).toISOString();
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
  for (var utc = mondayUtc; utc <= todayUtc; utc += 86400000) {
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
  var today = Utilities.formatDate(new Date(), "America/Detroit", "yyyy-MM-dd");
  var parts = today.split("-").map(Number);
  var todayUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  var weekday = new Date(todayUtc).getUTCDay();
  var mondayUtc = todayUtc - ((weekday + 6) % 7) * 86400000;
  var scheduledDays = Array.isArray(profile.spectoraScheduleDays) ? profile.spectoraScheduleDays : [];
  var operationDays = Array.isArray(profile.operationsDays) ? profile.operationsDays : [];
  if (profile.operationsCurrent && profile.operationsCurrent.date) operationDays.push(profile.operationsCurrent);
  var summary = [];
  for (var utc = mondayUtc; utc <= todayUtc; utc += 86400000) {
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
  var today = Utilities.formatDate(new Date(), "America/Detroit", "yyyy-MM-dd");
  var parts = today.split("-").map(Number);
  var todayUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  var mondayUtc = todayUtc - ((new Date(todayUtc).getUTCDay() + 6) % 7) * 86400000;
  var records = fetchSpectoraInspections_();
  var summary = [];
  for (var utc = mondayUtc; utc <= todayUtc; utc += 86400000) {
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

function oneStepGpsWeekBounds_() {
  var today = Utilities.formatDate(new Date(), "America/Detroit", "yyyy-MM-dd");
  var parts = today.split("-").map(Number);
  var todayUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  var mondayUtc = todayUtc - ((new Date(todayUtc).getUTCDay() + 6) % 7) * 86400000;
  return { todayUtc: todayUtc, mondayUtc: mondayUtc };
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

// Compare Cory's assigned Spectora inspection properties with sustained
// vehicle stops. No customer address, coordinate or key leaves this function.
function oneStepGpsCoryJobStopCoverage_() {
  var bounds = oneStepGpsWeekBounds_();
  var from = new Date(bounds.mondayUtc - 86400000).toISOString();
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
  for (var utc = bounds.mondayUtc; utc <= bounds.todayUtc; utc += 86400000) {
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
      candidateJobWindowMinutes: dayJobs.length > 0 && matched.length === dayJobs.length &&
        firstArrival !== null && lastJobDeparture !== null
        ? Math.max(0, Math.round((lastJobDeparture - firstArrival) / 60000)) : null,
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
  var monday = new Date(thisWeek.mondayUtc).toISOString().slice(0, 10);
  var current = days.filter(function (day) { return day && day.day >= monday; });
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
