import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "native-web");
const assets = [
  "index.html",
  "admin.html",
  "mpi-app-theme.css",
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
  "mpi-office-navigation.js",
  "mpi-owner-view.js",
  "mpi-tool-bag.js",
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
// Map libraries ship inside the phone app. A stalled CDN must not prevent the
// Office Dashboard from opening when onsite connectivity is poor.
const mapAssets = {
  "leaflet.js": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "leaflet.css": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "maplibre-gl.js": "https://unpkg.com/maplibre-gl@5.15.0/dist/maplibre-gl.js",
  "maplibre-gl.css": "https://unpkg.com/maplibre-gl@5.15.0/dist/maplibre-gl.css",
  "leaflet-maplibre-gl.js": "https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js"
};
await Promise.all(Object.entries(mapAssets).map(async ([name, url]) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Unable to bundle map library ${name}: ${response.status}`);
  await writeFile(join(output, "vendor", name), new Uint8Array(await response.arrayBuffer()));
}));

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
  .replace("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "./vendor/leaflet.css")
  .replace("https://unpkg.com/maplibre-gl@5.15.0/dist/maplibre-gl.css", "./vendor/maplibre-gl.css")
  .replace(/https:\/\/www\.gstatic\.com\/firebasejs\/12\.2\.1\/firebase-(app|auth|firestore|messaging)-compat\.js/g, "./vendor/firebase-$1-compat.js")
  .replace("<script src=\"./mpi-shared.js", "<script src=\"./mpi-native-bridge.js?build=native\"></script>\n  <script src=\"./mpi-shared.js");
await writeFile(adminPath, adminHtml);

console.log(`Prepared ${assets.length + firebaseAssets.length} native web assets and equipment product photos in ${output}`);
