# MPI Field Tools — Native iOS Build

This branch contains the native iPhone conversion of the existing MPI inspector workflow. The Office Console remains a hosted web application. The iPhone target reuses the released field interface and the existing Firebase data model while replacing browser-limited functions with native iOS services.

All source preparation, validation and release documentation stays in this repository and runs from Codex. There is no paid no-code app builder, separate app database or second operational workflow.

## App identity

- App name: `MPI Field Tools`
- Bundle identifier: `com.michiganpropertyinspections.fieldtools`
- Minimum platform: iOS 15 through Capacitor 8
- Native Firebase app ID: `1:574980684703:ios:019e78ea668087ce729baa`
- Current native version: `0.1.0 (181)`
- Distribution plan: TestFlight pilot, followed by a private or unlisted production release

## Native responsibilities

- Core Location tracking begins with Morning Ready and stops at Clock Out.
- Background route points are written to the same Firebase user/day records used by the Office live map and historical routes.
- Local notifications use the bundled MPI alarm for well-test, mold-sample, departure-warning and leave-now alerts.
- Firebase Cloud Messaging registers the installed phone against the existing user profile so field and team messages use the current notification service.
- Google sign-in uses the existing MPI Firebase users and requests the Calendar scopes still required by the current workflow.
- Firebase JavaScript libraries are bundled locally so the installed application shell does not rely on remote CDN scripts to start.
- Camera/photo selection, uploads, job data, messages, timestamps and management records continue using the production schema.
- Browser service-worker update banners are disabled in the installed application. Native releases arrive through TestFlight or the App Store.

The native location service continues while the app is in the background during an active workday. iOS does not allow any ordinary app to keep executing after the user force-quits it; inspectors must leave MPI Field Tools running until Clock Out.

## Development commands

Use the bundled Codex Node runtime when the normal shell has no Node installation:

```sh
export PATH='/Users/kevincave/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/kevincave/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:'"$PATH"
pnpm install
pnpm native:sync
pnpm native:doctor
pnpm native:verify
pnpm native:simulator
pnpm native:device:compile
```

`pnpm native:prepare` copies the released field app into an ignored `native-web/` bundle. It deliberately omits the web service worker because App Store updates replace the native bundle.

`pnpm native:verify` rebuilds that bundle and checks JavaScript syntax, inline application scripts, Apple property lists, privacy declarations, Swift syntax, package graphs, notification forwarding, Firebase resources and the custom alarm resource. It opens no browser or desktop application.

`pnpm native:simulator` selects an installed iPhone Simulator, builds outside the iCloud-synchronized workspace, installs the app, launches it without opening the Simulator window, confirms that the process remains running and saves a launch screenshot named `mpi-field-tools-simulator.png` in the Mac's temporary directory. The command prints the exact path.

`pnpm native:device:compile` compiles the real iPhone/arm64 target without signing. It catches device-only compiler failures but cannot install the result until Xcode has an Apple development team and signing certificate.

## Project layout

- `mpi-native-bridge.js` adapts authentication, notifications, haptics, app lifecycle and background location for the installed app.
- `native-plugins/mpi-background-location/` is the MPI-owned iOS location plugin and its privacy declaration.
- `ios/App/App/` contains the AppDelegate, iOS permissions, entitlements, Firebase plist, branded icon/splash assets and alarm sound.
- `scripts/prepare-native-web.mjs` prepares the self-contained field bundle.
- `scripts/native-doctor.mjs` reports prerequisites without opening Xcode.
- `scripts/verify-native.mjs` performs the repeatable source/project validation suite.
- `scripts/simulator-smoke.mjs` performs the repeatable headless Simulator build and launch test.

## Apple prerequisites

Xcode 26.6 and the iOS 26.5 Simulator runtime are installed on this Mac. Source validation, a signed Simulator compile/launch test and an unsigned real-iPhone architecture compile passed on September 11, 2026. Generated Xcode build data must stay outside this Documents workspace because iCloud/File Provider metadata can make Apple code signing reject generated package bundles; the native commands handle that automatically.

Apple Developer membership is not needed for Simulator work. An Apple Developer Program membership is required for TestFlight/App Store distribution and production push-notification signing. The Firebase project also needs the Apple APNs key uploaded before production remote notifications can be accepted by an iPhone.

The Debug configuration uses Kevin Cave's free Personal Team, the separate `com.michiganpropertyinspections.fieldtools.dev` identifier and no push entitlement. This allows direct no-cost installation on registered test iPhones. Release keeps the production identifier and push entitlement for eventual paid distribution.

The application uses the strongest ordinary notification behavior permitted by iOS. Bypassing Silent Mode or Focus with Critical Alerts is a separate Apple-controlled entitlement and is not part of this build.

## First device test gate

Before the first physical-device pilot:

1. Run `pnpm native:verify`.
2. Run `pnpm native:simulator` and inspect the screenshot path printed by the command.
3. Sign into Xcode with the MPI Apple Account and choose its development team for the App target. This is the remaining prerequisite for installing the build on a physical iPhone.
4. Run a physical-iPhone test for Google sign-in, Always Location permission, background route updates, alarms, push token registration, camera uploads and notification deep links.
5. Verify every new record appears once in the existing Office Console and no web production data is reset.
6. Archive a TestFlight pilot only after the physical-device checks pass.

No Apple signing credentials, certificates, or provisioning profiles belong in Git.
