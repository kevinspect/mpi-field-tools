import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const project = join(root, "ios", "App", "App.xcodeproj");
const derivedData = join(tmpdir(), "mpi-field-tools-deriveddata");
const screenshot = join(tmpdir(), "mpi-field-tools-simulator.png");
const bundleId = "com.michiganpropertyinspections.fieldtools.dev";

function capture(command, args) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

function attempt(command, args) {
  spawnSync(command, args, { cwd: root, stdio: "ignore" });
}

const deviceSets = JSON.parse(capture("xcrun", ["simctl", "list", "devices", "available", "--json"])).devices;
const runtimeIds = Object.keys(deviceSets).filter(id => id.includes("SimRuntime.iOS-")).sort().reverse();
const candidates = runtimeIds.flatMap(runtimeId => deviceSets[runtimeId] || []).filter(device => device.isAvailable && device.name.startsWith("iPhone"));
const device = candidates.find(candidate => candidate.name.includes("Pro")) || candidates[0];

if (!device) {
  throw new Error("No available iPhone Simulator was found. Install an iOS runtime with: xcodebuild -downloadPlatform iOS");
}

if (device.state !== "Booted") run("xcrun", ["simctl", "boot", device.udid]);
run("xcrun", ["simctl", "bootstatus", device.udid, "-b"]);

run("xcodebuild", [
  "-quiet",
  "-project", project,
  "-scheme", "App",
  "-configuration", "Debug",
  "-sdk", "iphonesimulator",
  "-destination", `platform=iOS Simulator,id=${device.udid}`,
  "-derivedDataPath", derivedData,
  "build"
]);

const appPath = join(derivedData, "Build", "Products", "Debug-iphonesimulator", "App.app");
if (!existsSync(appPath)) throw new Error(`Simulator app was not created at ${appPath}`);

attempt("xcrun", ["simctl", "terminate", device.udid, bundleId]);
attempt("xcrun", ["simctl", "uninstall", device.udid, bundleId]);
run("xcrun", ["simctl", "install", device.udid, appPath]);
run("xcrun", ["simctl", "launch", device.udid, bundleId]);
// Allow Capacitor's configured launch splash to finish so the captured evidence
// shows the rendered workflow rather than only the static launch screen.
await new Promise(resolve => setTimeout(resolve, 15_000));
run("xcrun", ["simctl", "io", device.udid, "screenshot", screenshot]);

const process = capture("pgrep", ["-fal", `${device.udid}.*/App.app/App`]);
if (!process) throw new Error("MPI Field Tools did not remain running after launch.");

console.log(`PASS  Simulator build — ${device.name}`);
console.log(`PASS  App installed and remained running — ${bundleId}`);
console.log(`PASS  Launch screenshot — ${screenshot}`);
