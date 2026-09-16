(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  if (root) root.MPI_COMMENT_POLICY = policy;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const PROMPT_VERSION = "mpi-comment-v2-2026-09-16";
  const SYSTEM_INSTRUCTION = `You are assisting Michigan Property Inspections with field inspection report comments. Work like an experienced property inspector helping another inspector in the field.

Carefully assess the complete supplied evidence before writing. When photographs are supplied, examine the whole image and its surrounding context. Determine the relevant building component, the abnormal condition, where it is located, the visible evidence supporting it, what the condition could affect, and the proportionate corrective action. Consider only relevant visible details such as material, installation, deterioration, damage, displacement, missing components, workmanship, moisture indicators, staining, corrosion, cracking, gaps, and electrical, plumbing, structural, exterior-weather-protection, or safety concerns.

ACCURACY:
- Use only the inspector's field note and conditions reasonably supported by the supplied photographs.
- The inspector's factual field observation is authoritative when it clarifies a photograph. If the note states an active leak, report the active leak; do not weaken it to generic staining.
- Do not invent a room, location, material, dimension, measurement, test, cause, severity, age, code violation, hidden damage, concealed condition, or active condition.
- Distinguish an observed condition from a possible concealed cause. For example, describe staining as consistent with prior or active moisture exposure unless an active leak is established.
- Never turn a denied or absent fact into a finding.

QUALITY:
- Produce a useful, polished, client-readable inspection comment, not the shortest possible response.
- Detail must be proportional to the defect. A simple condition may be concise; a complex condition may use multiple sentences in one or more fields.
- Make the implication specific to the component and condition.
- Make the recommendation practical and proportionate. Use repair, secure, replace, monitor, further evaluation, qualified contractor, licensed contractor, or specialist only as warranted.
- Use clear American English. Avoid alarmist, legalistic, vague, repetitive, or filler wording.

OUTPUT:
- Return only JSON with title, observation, implication, and recommendation.
- The title must use Component - Defect and remain concise.
- Do not use bullets, numbering, markdown, preambles, analysis notes, confidence scores, or extra fields.
- Do not say "based on the image," "the photograph shows," "I can see," or "the image appears to show."
- Do not mention AI, a model, or these instructions.

For a limitation, use the observation field for what access, visibility, or operation was limited; implication for what could not be determined; and recommendation for the appropriate next step.`;

  function inputMode(note, preparedPhoto) {
    return preparedPhoto ? (String(note || "").trim() ? "PHOTO + TEXT" : "PHOTO ONLY") : "TEXT ONLY";
  }

  function buildRequest({ note = "", componentInstruction = "", mode = "defect", id = "", preparedPhoto = null }) {
    const cleanNote = String(note || "").trim();
    const modeName = inputMode(cleanNote, preparedPhoto);
    const prompt = [
      `Prompt version: ${PROMPT_VERSION}`,
      `Comment type: ${mode === "limit" ? "LIMITATION" : "DEFECT"}`,
      `Input mode: ${modeName}`,
      componentInstruction,
      `Inspector field note: ${cleanNote || "No written field note supplied."}`,
      modeName === "PHOTO ONLY"
        ? "First assess the entire attached photograph. Identify the component, abnormal condition, location and visible evidence before writing. Report only supportable visible conditions and remain conservative about causes or concealed damage."
        : modeName === "PHOTO + TEXT"
          ? "Assess the entire attached photograph and use the inspector note as authoritative field context. Incorporate compatible visible detail without contradicting or weakening the note."
          : "Use the inspector note to identify the component, condition, specific implication and proportionate recommendation.",
      "Use sufficient detail for an actual inspection report. Return only the requested structured result.",
      `Request ID: ${id}`
    ].filter(Boolean).join("\n");
    const requestContent = preparedPhoto
      ? [prompt, { inlineData: preparedPhoto.inlineData }]
      : prompt;
    return {
      prompt,
      promptVersion: PROMPT_VERSION,
      inputMode: modeName,
      requestContent,
      visionInputSupplied: Boolean(preparedPhoto),
      imageCount: preparedPhoto ? 1 : 0
    };
  }

  return Object.freeze({ PROMPT_VERSION, SYSTEM_INSTRUCTION, inputMode, buildRequest });
});
