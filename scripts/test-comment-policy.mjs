import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../mpi-comment-policy.js", import.meta.url), "utf8");
const serviceSource = await readFile(new URL("../mpi-comment-ai.js", import.meta.url), "utf8");
const context = { globalThis: {} };
context.window = context.globalThis;
vm.runInNewContext(source, context);
const policy = context.globalThis.MPI_COMMENT_POLICY;
assert.match(policy.PROMPT_VERSION, /^mpi-comment-v\d/);
assert.match(policy.SYSTEM_INSTRUCTION, /examine the whole image/i);
assert.match(policy.SYSTEM_INSTRUCTION, /multiple sentences/i);
assert.match(policy.SYSTEM_INSTRUCTION, /inspector's factual field observation is authoritative/i);
assert.match(policy.SYSTEM_INSTRUCTION, /one practical action/i);
assert.match(policy.SYSTEM_INSTRUCTION, /do not repeat the observation/i);
assert.match(policy.SYSTEM_INSTRUCTION, /do not infer a test from a photograph/i);
assert.match(policy.SYSTEM_INSTRUCTION, /MPI's report SOP/i);
assert.match(policy.SYSTEM_INSTRUCTION, /template style/i);
assert.match(policy.SYSTEM_INSTRUCTION, /substitute a common template defect/i);
assert.match(policy.SYSTEM_INSTRUCTION, /contact a qualified professional/i);
assert.match(policy.SYSTEM_INSTRUCTION, /do not call an inaccessible component "not present/i);
assert.doesNotMatch(policy.SYSTEM_INSTRUCTION, /\b(?:Warner Rd|Interstate 94 Service Dr|Overton St|Auburndale)\b/i, "No customer address from supplied reports is bundled in the prompt");

const photo = { inlineData: { mimeType: "image/jpeg", data: "REAL-IMAGE-BYTES" } };
const photoOnly = policy.buildRequest({ id: "photo-only", preparedPhoto: photo });
assert.equal(photoOnly.inputMode, "PHOTO ONLY");
assert.equal(photoOnly.imageCount, 1);
assert.equal(photoOnly.requestContent[1].inlineData.data, "REAL-IMAGE-BYTES", "Actual prepared image data reaches the multimodal request");
assert.match(photoOnly.requestContent[0], /assess the entire attached photograph/i);

const textOnly = policy.buildRequest({ id: "text-only", note: "Daylight visible around window frame." });
assert.equal(textOnly.inputMode, "TEXT ONLY");
assert.equal(typeof textOnly.requestContent, "string");
assert.match(textOnly.requestContent, /specific implication and proportionate recommendation/i);

const combined = policy.buildRequest({ id: "combined", note: "Active leak in ceiling utility closet.", preparedPhoto: photo });
assert.equal(combined.inputMode, "PHOTO + TEXT");
assert.match(combined.requestContent[0], /authoritative field context/i);
assert.match(combined.requestContent[0], /Active leak in ceiling utility closet/);

for (const example of ["Loose GFCI", "Active leak in ceiling utility closet", "Daylight visible around window frame"]) {
  const request = policy.buildRequest({ id: example, note: example, componentInstruction: "Use Component - Defect." });
  assert.match(request.prompt, /Write a concise, complete report comment/);
  assert.match(request.prompt, /Component - Defect/);
  assert.doesNotMatch(request.prompt, /Request ID:/, "Request identifiers are kept out of report-writing prompts");
}
for (const defect of ["electrical defect", "exterior siding deterioration", "ceiling moisture staining", "roof flashing defect", "foundation crack"]) {
  const request = policy.buildRequest({ id: defect, preparedPhoto: photo, componentInstruction: `Evaluate this ${defect}.` });
  assert.equal(request.imageCount, 1);
  assert.match(request.prompt, new RegExp(defect));
}
assert.match(serviceSource, /gemini-3\.8-flash/);
assert.match(serviceSource, /maxOutputTokens: 1200/, "Quality changes do not alter the model call's output ceiling");
assert.match(serviceSource, /originalImageWidth/);
assert.match(serviceSource, /aiRequestContainedImage/);
assert.match(serviceSource, /return `\$\{title\}\\n\$\{labels\[0\]\}: \$\{observation\}\\n\$\{labels\[1\]\}: \$\{implication\}\\n\$\{labels\[2\]\}: \$\{recommendation\}`/, "Output fields are consecutive with no blank lines");
console.log("PASS Central versioned MPI Comment Builder policy supports photo-only, text-only and combined evidence without consuming generation allowance.");
