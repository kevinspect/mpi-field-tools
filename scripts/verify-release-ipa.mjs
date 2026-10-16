import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ipa = process.argv[2] && resolve(process.argv[2]);
if (!ipa || !existsSync(ipa)) {
  console.error("Usage: pnpm native:verify:ipa /absolute/path/to/App.ipa");
  process.exit(2);
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "mpi-ipa-verify-"));
const run = (program, args) => execFileSync(program, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const plistValue = (path, key) => run("/usr/bin/plutil", ["-extract", key, "raw", "-o", "-", path]).trim();

try {
  const entries = run("/usr/bin/unzip", ["-Z1", ipa]).split("\n");
  const appDirectories = [...new Set(entries.map(entry => entry.match(/^Payload\/([^/]+\.app)\/Info\.plist$/)?.[1]).filter(Boolean))];
  if (appDirectories.length !== 1) throw new Error("IPA must contain exactly one iPhone app");

  run("/usr/bin/unzip", ["-q", ipa, "-d", temporaryDirectory]);
  const app = join(temporaryDirectory, "Payload", appDirectories[0]);
  const bundleIdentifier = plistValue(join(app, "Info.plist"), "CFBundleIdentifier");
  if (bundleIdentifier !== "com.michiganpropertyinspections.fieldtools") {
    throw new Error(`Unexpected bundle identifier: ${bundleIdentifier}`);
  }
  const repository = dirname(dirname(fileURLToPath(import.meta.url)));
  const expectedBuild = String(JSON.parse(await readFile(join(repository, "version.json"), "utf8")).build);
  const actualBuild = plistValue(join(app, "Info.plist"), "CFBundleVersion");
  if (actualBuild !== expectedBuild) throw new Error(`IPA build ${actualBuild} does not match source build ${expectedBuild}`);
  if (plistValue(join(app, "Info.plist"), "UIDeviceFamily.0") !== "1") {
    throw new Error("IPA is not configured for iPhone");
  }
  const firebaseBundle = plistValue(join(app, "GoogleService-Info.plist"), "BUNDLE_ID");
  if (firebaseBundle !== bundleIdentifier) throw new Error("Bundled Firebase app does not match the signed app");

  // An entitlements source file and an APNs-enabled profile do not prove that
  // the uploaded app's actual code signature contains the push entitlement.
  run("/usr/bin/codesign", ["--verify", "--deep", "--strict", app]);
  const signature = spawnSync("/usr/bin/codesign", ["-dv", "--verbose=4", app], { encoding: "utf8" });
  if (signature.status !== 0 || !signature.stderr.includes("Authority=Apple Distribution:")
    || !signature.stderr.includes("TeamIdentifier=UBC4JMZKA5")) {
    throw new Error("App is not signed by MPI's Apple Distribution team");
  }
  const signedEntitlements = join(temporaryDirectory, "signed-entitlements.plist");
  await writeFile(signedEntitlements, run("/usr/bin/codesign", ["-d", "--entitlements", ":-", app]));
  let signedPushEnvironment;
  try {
    signedPushEnvironment = plistValue(signedEntitlements, "aps-environment");
  } catch {
    throw new Error("Signed app has no aps-environment entitlement; remote iPhone push cannot work");
  }
  if (signedPushEnvironment !== "production") {
    throw new Error(`Signed app has ${signedPushEnvironment} push entitlement; TestFlight needs production`);
  }

  const profile = join(temporaryDirectory, "profile.plist");
  await writeFile(profile, run("/usr/bin/security", ["cms", "-D", "-i", join(app, "embedded.mobileprovision")]));
  const profilePushEnvironment = plistValue(profile, "Entitlements.aps-environment");
  if (profilePushEnvironment !== signedPushEnvironment) {
    throw new Error(`Provisioning profile push entitlement ${profilePushEnvironment} does not match signed app ${signedPushEnvironment}`);
  }

  console.log(`PASS  Signed ${bundleIdentifier} IPA has production APNs entitlement matching its provisioning profile`);
} catch (error) {
  console.error(`FAIL  Release IPA: ${error.message}`);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
