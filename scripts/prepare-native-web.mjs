import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "native-web");
const assets = [
  "index.html",
  "admin.html",
  "admin.js",
  "mpi-planning.js",
  "mpi-shared.js",
  "mpi-field-sync.js",
  "mpi-subcontractor.js",
  "mpi-comment-ai.js",
  "mpi-equipment.js",
  "mpi-equipment-images.js",
  "mpi-equipment-admin.js",
  "mpi-native-bridge.js",
  "mpi-logo.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "og.png",
  "tool-thumbnails.png",
  "site.webmanifest",
  "version.json"
];
const firebaseAssets = [
  "firebase-app-compat.js",
  "firebase-auth-compat.js",
  "firebase-firestore-compat.js",
  "firebase-messaging-compat.js"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const asset of assets) {
  await cp(join(root, asset), join(output, asset));
}
await cp(join(root, "equipment-images"), join(output, "equipment-images"), { recursive: true });
await mkdir(join(output, "vendor"), { recursive: true });
for (const asset of firebaseAssets) {
  await cp(join(root, "node_modules", "firebase", asset), join(output, "vendor", asset));
}

const indexPath = join(output, "index.html");
let html = await readFile(indexPath, "utf8");
html = html
  .replace(/<link rel="manifest"[^>]*>\s*/i, "")
  .replace(/<script src="https:\/\/accounts\.google\.com\/gsi\/client" async defer><\/script>/i, "")
  .replace(/https:\/\/www\.gstatic\.com\/firebasejs\/12\.2\.1\/firebase-(app|auth|firestore|messaging)-compat\.js/g, "./vendor/firebase-$1-compat.js")
  .replace("</head>", "  <meta name=\"mpi-native-bundle\" content=\"ios\">\n</head>");
await writeFile(indexPath, html);

const adminPath = join(output, "admin.html");
let adminHtml = await readFile(adminPath, "utf8");
adminHtml = adminHtml
  .replace(/https:\/\/www\.gstatic\.com\/firebasejs\/12\.2\.1\/firebase-(app|auth|firestore|messaging)-compat\.js/g, "./vendor/firebase-$1-compat.js")
  .replace("<script src=\"./mpi-shared.js", "<script src=\"./mpi-native-bridge.js?build=native\"></script>\n  <script src=\"./mpi-shared.js");
await writeFile(adminPath, adminHtml);

console.log(`Prepared ${assets.length + firebaseAssets.length} native web assets and equipment product photos in ${output}`);
