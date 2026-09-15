import Foundation
import UIKit
import CoreLocation
import Capacitor
import FirebaseAuth
import FirebaseFirestore

private struct MPIQueuedLocation: Codable {
    let id: String
    let userId: String
    let workDate: String
    let workStatus: String
    let latitude: Double
    let longitude: Double
    let accuracyMeters: Double
    let altitude: Double
    let verticalAccuracy: Double
    let heading: Double
    let speedMetersPerSecond: Double
    let timestamp: String

    var dictionary: [String: Any] {
        [
            "id": id,
            "userId": userId,
            "workDate": workDate,
            "workStatus": workStatus,
            "latitude": latitude,
            "longitude": longitude,
            "accuracyMeters": accuracyMeters,
            "altitude": altitude,
            "verticalAccuracy": verticalAccuracy,
            "heading": heading,
            "speedMetersPerSecond": speedMetersPerSecond,
            "timestamp": timestamp
        ]
    }
}

@objc(MPIBackgroundLocationPlugin)
public final class MPIBackgroundLocationPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "MPIBackgroundLocationPlugin"
    public let jsName = "MPIBackgroundLocation"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setContext", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPendingLocations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "acknowledgeLocations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestCurrentLocation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSpectoraApp", returnType: CAPPluginReturnPromise)
    ]

    private let manager = CLLocationManager()

    @objc public func openSpectoraApp(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Only launch a scheme the installed app actually registers. Never
            // fall back to Safari, the web report editor, or an App Store page.
            // V10 10.34.1's registered scheme was verified from the installed
            // com.spectora.mobile bundle. Use only its bare URL for an app
            // launch: no OAuth response, credentials or report-writing data.
            let schemes = ["com.googleusercontent.apps.258663854283-ea5jom5101rdnbj3cfb54rtaihn66bc9"]
            guard let destination = schemes.compactMap({ URL(string: "\($0)://") })
                .first(where: { UIApplication.shared.canOpenURL($0) }) else {
                call.resolve(["opened": false])
                return
            }
            UIApplication.shared.open(destination, options: [:]) { opened in
                call.resolve(["opened": opened, "scheme": destination.scheme ?? ""])
            }
        }
    }
    private let defaults = UserDefaults.standard
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private let isoFormatter = ISO8601DateFormatter()
    private var permissionCallId: String?
    private var currentLocationCallId: String?
    private var lastRecordedLocation: CLLocation?
    private var lastRecordedAt: Date?

    private enum Key {
        static let active = "mpi.native.location.active"
        static let userId = "mpi.native.location.userId"
        static let workDate = "mpi.native.location.workDate"
        static let workStatus = "mpi.native.location.workStatus"
        static let queue = "mpi.native.location.queue.v1"
        static let startedAt = "mpi.native.location.startedAt"
        static let lastLocationAt = "mpi.native.location.lastLocationAt"
        static let lastError = "mpi.native.location.lastError"
    }

    override public func load() {
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        // Let Core Location continue producing fixes while the phone is stationary.
        // shouldRecord(_:) performs the actual three-minute / movement throttling.
        manager.distanceFilter = kCLDistanceFilterNone
        manager.activityType = .automotiveNavigation
        manager.pausesLocationUpdatesAutomatically = false
        manager.allowsBackgroundLocationUpdates = true
        manager.showsBackgroundLocationIndicator = true
        if defaults.bool(forKey: Key.active), isUsableAuthorization(manager.authorizationStatus) {
            beginLocationUpdates()
        }
    }

    @objc public func start(_ call: CAPPluginCall) {
        guard let userId = call.getString("userId"), !userId.isEmpty,
              let workDate = call.getString("workDate"), !workDate.isEmpty else {
            call.reject("A signed-in user and work date are required.")
            return
        }
        defaults.set(userId, forKey: Key.userId)
        defaults.set(workDate, forKey: Key.workDate)
        defaults.set(call.getString("workStatus") ?? "READY / WAITING TO DEPART", forKey: Key.workStatus)
        defaults.set(true, forKey: Key.active)
        defaults.set(isoFormatter.string(from: Date()), forKey: Key.startedAt)
        defaults.removeObject(forKey: Key.lastError)

        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestAlwaysAuthorization()
        case .restricted, .denied:
            call.reject("Location permission is disabled. Allow Always location access in iPhone Settings.", "LOCATION_DENIED")
            return
        case .authorizedWhenInUse:
            manager.requestAlwaysAuthorization()
            beginLocationUpdates()
        case .authorizedAlways:
            beginLocationUpdates()
        @unknown default:
            call.reject("Location authorization could not be determined.")
            return
        }
        call.resolve(statusPayload())
    }

    @objc public func stop(_ call: CAPPluginCall) {
        defaults.set(false, forKey: Key.active)
        defaults.removeObject(forKey: Key.workStatus)
        manager.stopUpdatingLocation()
        if CLLocationManager.significantLocationChangeMonitoringAvailable() {
            manager.stopMonitoringSignificantLocationChanges()
        }
        lastRecordedLocation = nil
        lastRecordedAt = nil
        call.resolve(statusPayload())
    }

    @objc public func setContext(_ call: CAPPluginCall) {
        if let userId = call.getString("userId"), !userId.isEmpty { defaults.set(userId, forKey: Key.userId) }
        if let workDate = call.getString("workDate"), !workDate.isEmpty { defaults.set(workDate, forKey: Key.workDate) }
        if let workStatus = call.getString("workStatus"), !workStatus.isEmpty { defaults.set(workStatus, forKey: Key.workStatus) }
        call.resolve(statusPayload())
    }

    @objc public func getStatus(_ call: CAPPluginCall) {
        call.resolve(statusPayload())
    }

    @objc public func getPendingLocations(_ call: CAPPluginCall) {
        call.resolve(["locations": loadQueue().map(\.dictionary)])
    }

    @objc public func acknowledgeLocations(_ call: CAPPluginCall) {
        let ids = Set(call.getArray("ids", String.self) ?? [])
        guard !ids.isEmpty else {
            call.resolve(["removed": 0, "remaining": loadQueue().count])
            return
        }
        let current = loadQueue()
        let remaining = current.filter { !ids.contains($0.id) }
        saveQueue(remaining)
        call.resolve(["removed": current.count - remaining.count, "remaining": remaining.count])
    }

    @objc public func requestCurrentLocation(_ call: CAPPluginCall) {
        guard isUsableAuthorization(manager.authorizationStatus) else {
            call.reject("Location permission is required.", "LOCATION_DENIED")
            return
        }
        if let existing = currentLocationCallId, let previous = bridge?.savedCall(withID: existing) {
            previous.reject("A newer location request replaced this request.")
            bridge?.releaseCall(previous)
        }
        bridge?.saveCall(call)
        currentLocationCallId = call.callbackId
        manager.requestLocation()
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(permissionPayload())
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        switch manager.authorizationStatus {
        case .notDetermined, .authorizedWhenInUse:
            bridge?.saveCall(call)
            permissionCallId = call.callbackId
            manager.requestAlwaysAuthorization()
        default:
            call.resolve(permissionPayload())
        }
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if defaults.bool(forKey: Key.active), isUsableAuthorization(manager.authorizationStatus) {
            beginLocationUpdates()
        }
        guard let id = permissionCallId, let call = bridge?.savedCall(withID: id) else { return }
        permissionCallId = nil
        call.resolve(permissionPayload())
        bridge?.releaseCall(call)
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let newest = locations.last, newest.horizontalAccuracy >= 0 else { return }
        var requestedPoint: MPIQueuedLocation?
        if let id = currentLocationCallId, let call = bridge?.savedCall(withID: id) {
            currentLocationCallId = nil
            let point = makePoint(newest)
            requestedPoint = point
            call.resolve(point.dictionary)
            bridge?.releaseCall(call)
        }
        guard defaults.bool(forKey: Key.active), requestedPoint != nil || shouldRecord(newest) else { return }
        let point = requestedPoint ?? makePoint(newest)
        var queue = loadQueue()
        queue.append(point)
        if queue.count > 4000 { queue.removeFirst(queue.count - 4000) }
        saveQueue(queue)
        defaults.set(point.timestamp, forKey: Key.lastLocationAt)
        defaults.removeObject(forKey: Key.lastError)
        lastRecordedLocation = newest
        lastRecordedAt = newest.timestamp
        syncPoint(point)
        notifyListeners("locationUpdate", data: point.dictionary)
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        defaults.set(error.localizedDescription, forKey: Key.lastError)
        guard let id = currentLocationCallId, let call = bridge?.savedCall(withID: id) else { return }
        currentLocationCallId = nil
        call.reject(error.localizedDescription, "LOCATION_UNAVAILABLE", error)
        bridge?.releaseCall(call)
    }

    private func shouldRecord(_ location: CLLocation) -> Bool {
        guard location.horizontalAccuracy <= 1000 else { return false }
        guard let previous = lastRecordedLocation, let previousDate = lastRecordedAt else { return true }
        let elapsed = location.timestamp.timeIntervalSince(previousDate)
        let distance = location.distance(from: previous)
        // Preserve route shape without writing a point every few seconds at
        // highway speed. Record at least every three minutes, or after both a
        // meaningful move and a short minimum interval.
        return elapsed >= 165 || (elapsed >= 45 && distance >= 500)
    }

    private func beginLocationUpdates() {
        manager.startUpdatingLocation()
        // This gives the app a recovery path after iOS terminates it and the
        // device subsequently moves a meaningful distance.
        if manager.authorizationStatus == .authorizedAlways,
           CLLocationManager.significantLocationChangeMonitoringAvailable() {
            manager.startMonitoringSignificantLocationChanges()
        }
        // Do not wait for the distance filter or a route movement before the
        // Office Console receives the first position for the workday.
        manager.requestLocation()
    }

    private func makePoint(_ location: CLLocation) -> MPIQueuedLocation {
        MPIQueuedLocation(
            id: UUID().uuidString.lowercased(),
            userId: defaults.string(forKey: Key.userId) ?? "",
            workDate: defaults.string(forKey: Key.workDate) ?? "",
            workStatus: defaults.string(forKey: Key.workStatus) ?? "ACTIVE WORKDAY",
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            accuracyMeters: location.horizontalAccuracy,
            altitude: location.altitude,
            verticalAccuracy: location.verticalAccuracy,
            heading: location.course,
            speedMetersPerSecond: location.speed,
            timestamp: isoFormatter.string(from: location.timestamp)
        )
    }

    private func loadQueue() -> [MPIQueuedLocation] {
        guard let data = defaults.data(forKey: Key.queue), let queue = try? decoder.decode([MPIQueuedLocation].self, from: data) else { return [] }
        return queue
    }

    private func saveQueue(_ queue: [MPIQueuedLocation]) {
        if queue.isEmpty {
            defaults.removeObject(forKey: Key.queue)
        } else if let data = try? encoder.encode(queue) {
            defaults.set(data, forKey: Key.queue)
        }
    }

    private func syncPoint(_ point: MPIQueuedLocation) {
        guard let user = Auth.auth().currentUser, !point.userId.isEmpty, user.uid == point.userId, !point.workDate.isEmpty else { return }
        let database = Firestore.firestore()
        let userReference = database.collection("users").document(user.uid)
        let routeReference = userReference.collection("locationRouteDays").document(point.workDate)
            .collection("points").document("native-\(point.id)")
        let recordedAtClient = point.timestamp
        let accuracyFeet = max(0, Int((point.accuracyMeters * 3.28084).rounded()))
        let heading: Any = point.heading >= 0 ? Int(point.heading.rounded()) : NSNull()
        let speedMph: Any = point.speedMetersPerSecond >= 0 ? (point.speedMetersPerSecond * 2.23694) : NSNull()
        let liveLocation: [String: Any] = [
            "latitude": point.latitude,
            "longitude": point.longitude,
            "accuracyFeet": accuracyFeet,
            "heading": heading,
            "speedMph": speedMph,
            "recordedAtClient": recordedAtClient,
            "workStatus": point.workStatus,
            "workDate": point.workDate,
            "source": "native-background",
            "requestId": "",
            "nativePointId": point.id,
            "status": "recorded"
        ]
        let routePoint: [String: Any] = [
            "userId": user.uid,
            "date": point.workDate,
            "latitude": point.latitude,
            "longitude": point.longitude,
            "accuracyFeet": accuracyFeet,
            "heading": heading,
            "speedMph": speedMph,
            "recordedAtClient": recordedAtClient,
            "workStatus": point.workStatus,
            "source": "native-background",
            "nativePointId": point.id,
            "recordedAt": FieldValue.serverTimestamp()
        ]
        let batch = database.batch()
        batch.setData([
            "liveLocation": liveLocation,
            "liveLocationStatus": ["status": "recorded", "recordedAtClient": recordedAtClient, "requestId": ""],
            "liveLocationUpdatedAt": FieldValue.serverTimestamp()
        ], forDocument: userReference, merge: true)
        batch.setData(routePoint, forDocument: routeReference)
        batch.commit { [weak self] error in
            guard error == nil else { return }
            DispatchQueue.main.async {
                guard let self else { return }
                self.saveQueue(self.loadQueue().filter { $0.id != point.id })
            }
        }
    }

    private func isUsableAuthorization(_ status: CLAuthorizationStatus) -> Bool {
        status == .authorizedAlways || status == .authorizedWhenInUse
    }

    private func authorizationName(_ status: CLAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "prompt"
        case .restricted, .denied: return "denied"
        case .authorizedWhenInUse: return "when-in-use"
        case .authorizedAlways: return "always"
        @unknown default: return "prompt"
        }
    }

    private func permissionPayload() -> [String: Any] {
        let status = manager.authorizationStatus
        return [
            "location": isUsableAuthorization(status) ? "granted" : authorizationName(status),
            "level": authorizationName(status)
        ]
    }

    private func statusPayload() -> [String: Any] {
        [
            "active": defaults.bool(forKey: Key.active),
            "permission": authorizationName(manager.authorizationStatus),
            "pending": loadQueue().count,
            "workDate": defaults.string(forKey: Key.workDate) ?? "",
            "workStatus": defaults.string(forKey: Key.workStatus) ?? "",
            "startedAt": defaults.string(forKey: Key.startedAt) ?? "",
            "lastLocationAt": defaults.string(forKey: Key.lastLocationAt) ?? "",
            "lastError": defaults.string(forKey: Key.lastError) ?? ""
        ]
    }
}
