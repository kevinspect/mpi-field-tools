import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const imageDirectory = join(root, "equipment-images");
const files = (await readdir(imageDirectory))
  .filter(file => extname(file).toLowerCase() === ".jpg")
  .sort();

const entries = [];
for (const file of files) {
  const data = await readFile(join(imageDirectory, file));
  entries.push(`  ${JSON.stringify(parse(file).name)}: ${JSON.stringify(`data:image/jpeg;base64,${data.toString("base64")}`)}`);
}

const output = `(function () {\n  "use strict";\n  window.MPI_EQUIPMENT_IMAGE_DATA = Object.freeze({\n${entries.join(",\n")}\n  });\n})();\n`;
await writeFile(join(root, "mpi-equipment-images.js"), output);
