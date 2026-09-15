import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const checks = [];

async function exists(label, path, { required = true } = {}) {
  try {
    await access(path, constants.R_OK);
    checks.push({ label, ok: true, required, detail: path });
  } catch {
    checks.push({ label, ok: false, required, detail: `Missing: ${path}` });
  }
}

await exists("Capacitor configuration", join(root, "capacitor.config.json"));
await exists("Native web bridge", join(root, "mpi-native-bridge.js"));
await exists("iOS project", join(root, "ios", "App", "App.xcodeproj", "project.pbxproj"));
await exists("Firebase iOS configuration", join(root, "ios", "App", "App", "GoogleService-Info.plist"));
await exists("Push notification entitlement", join(root, "ios", "App", "App", "App.entitlements"));
await exists("App privacy manifest", join(root, "ios", "App", "App", "PrivacyInfo.xcprivacy"));
await exists("Native alarm sound", join(root, "ios", "App", "App", "mpi_alarm.wav"));
await exists("Background location plugin", join(root, "native-plugins", "mpi-background-location", "ios", "Sources", "MPIBackgroundLocationPlugin", "MPIBackgroundLocationPlugin.swift"));

let xcode = "Unavailable";
try {
  xcode = execFileSync("xcodebuild", ["-version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim().replace(/\n/g, " · ");
} catch {}
checks.push({ label: "Full Xcode", ok: /^Xcode\s/.test(xcode), required: false, detail: /^Xcode\s/.test(xcode) ? xcode : `${xcode} (install before Simulator/device build)` });

let simulatorRuntime = "Unavailable";
try {
  simulatorRuntime = execFileSync("xcrun", ["simctl", "list", "runtimes"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).split("\n").find(line => /^iOS\s/.test(line.trim()))?.trim() || "Unavailable";
} catch {}
checks.push({ label: "iOS Simulator runtime", ok: simulatorRuntime !== "Unavailable", required: false, detail: simulatorRuntime !== "Unavailable" ? simulatorRuntime : "Install with: xcodebuild -downloadPlatform iOS" });

let signingIdentities = "";
try {
  signingIdentities = execFileSync("security", ["find-identity", "-v", "-p", "codesigning"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
} catch {}
const signingReady = !/0 valid identities found/.test(signingIdentities) && /Apple Development|iPhone Developer/.test(signingIdentities);
checks.push({ label: "Physical-device signing identity", ok: signingReady, required: false, detail: signingReady ? "Available" : "Sign into Xcode with the MPI Apple Account and select its development team" });

const config = JSON.parse(await readFile(join(root, "capacitor.config.json"), "utf8"));
checks.push({ label: "Bundle identifier", ok: config.appId === "com.michiganpropertyinspections.fieldtools", required: true, detail: config.appId });

for (const check of checks) console.log(`${check.ok ? "PASS" : check.required ? "BLOCKED" : "PREREQUISITE"}  ${check.label}: ${check.detail}`);
if (checks.some(check => check.required && !check.ok)) process.exitCode = 1;
