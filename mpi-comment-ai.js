import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-check.js";
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-ai.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBH37lEcQdExd0JRTRWCYlZHWNevIJrmPk",
  authDomain: "mpi-field-notifications.firebaseapp.com",
  projectId: "mpi-field-notifications",
  storageBucket: "mpi-field-notifications.firebasestorage.app",
  messagingSenderId: "574980684703",
  appId: "1:574980684703:web:b0d2e4491fd09b78729baa"
};

const APP_CHECK_SITE_KEY = "6Lcw5aMtAAAAABAnHYjZ4xAyWVPiIDfy2622_Z-b";
const DAILY_LIMIT = 40;
const MONTHLY_LIMIT = 400;
const USAGE_STORAGE_KEY = "mpiCommentBuilderUsageV1";
const COMMENT_TIMEOUT_MS = 35000;
const COMMENT_LOG_STORAGE_KEY = "mpiCommentBuilderTechnicalLogV1";
const COMMENT_RESULT_CACHE_KEY = "mpiCommentBuilderResultCacheV1";
const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.7-flash";
const commentPolicy = window.MPI_COMMENT_POLICY;
if (!commentPolicy) throw new Error("MPI Comment Builder policy did not load.");

const RESPONSE_SCHEMA = Schema.object({
  properties: {
    title: Schema.string(),
    observation: Schema.string(),
    implication: Schema.string(),
    recommendation: Schema.string()
  }
});

const modelPromises = new Map();
let aiPromise;

function usageRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || "{}");
    return record && typeof record === "object" ? record : {};
  } catch (_) {
    return {};
  }
}

function usageKeys(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return { day: `${year}-${month}-${day}`, month: `${year}-${month}` };
}

function assertWithinUsageLimit() {
  const record = usageRecord();
  const keys = usageKeys();
  if (Number(record.days?.[keys.day] || 0) >= DAILY_LIMIT) {
    throw new Error("This phone has reached today’s MPI Comment Builder limit. Contact management if more comments are required.");
  }
  if (Number(record.months?.[keys.month] || 0) >= MONTHLY_LIMIT) {
    throw new Error("This phone has reached this month’s MPI Comment Builder limit. Contact management before continuing.");
  }
}

function recordUsage() {
  const record = usageRecord();
  const keys = usageKeys();
  record.days = record.days && typeof record.days === "object" ? record.days : {};
  record.months = record.months && typeof record.months === "object" ? record.months : {};
  record.days[keys.day] = Number(record.days[keys.day] || 0) + 1;
  record.months[keys.month] = Number(record.months[keys.month] || 0) + 1;
  record.lastUsedAt = new Date().toISOString();
  try { localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(record)); } catch (_) {}
  window.dispatchEvent(new CustomEvent("mpi-comment-usage-updated", {
    detail: {
      month: keys.month,
      monthlyUsed: record.months[keys.month],
      usedToday: record.days[keys.day],
      monthlyLimit: MONTHLY_LIMIT,
      approximateRemaining: Math.max(0, MONTHLY_LIMIT - record.months[keys.month])
    }
  }));
}

function usageSnapshot() {
  const record = usageRecord();
  const keys = usageKeys();
  const monthlyUsed = Math.max(0, Number(record.months?.[keys.month] || 0));
  return {
    month: keys.month,
    usedToday: Math.max(0, Number(record.days?.[keys.day] || 0)),
    monthlyUsed,
    dailyLimit: DAILY_LIMIT,
    monthlyLimit: MONTHLY_LIMIT,
    approximateRemaining: Math.max(0, MONTHLY_LIMIT - monthlyUsed),
    lastUsedAt: String(record.lastUsedAt || "")
  };
}

function requestId() {
  try { return crypto.randomUUID(); }
  catch (_) { return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`; }
}

function technicalCategory(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  if (!navigator.onLine || /network|failed to fetch|load failed/.test(text)) return "network";
  if (/app.?check|recaptcha/.test(text)) return "app-check";
  if (/auth|unauthor|forbidden|permission|401|403/.test(text)) return "auth-session";
  if (/429|quota|resource.?exhausted|rate.?limit/.test(text)) return "rate-limit";
  if (/timeout|timed out/.test(text)) return "timeout";
  if (/json|parse|incomplete|malformed/.test(text)) return "malformed-response";
  if (/500|502|503|504|unavailable|overloaded|high demand|busy|fetch-error/.test(text)) return "service-unavailable";
  return "unknown";
}

function writeTechnicalLog(entry) {
  let records = [];
  try { records = JSON.parse(localStorage.getItem(COMMENT_LOG_STORAGE_KEY) || "[]"); } catch (_) {}
  if (!Array.isArray(records)) records = [];
  records.push({ timestamp: new Date().toISOString(), ...entry });
  try { localStorage.setItem(COMMENT_LOG_STORAGE_KEY, JSON.stringify(records.slice(-100))); } catch (_) {}
}

function cachedResult(id) {
  try { return JSON.parse(sessionStorage.getItem(COMMENT_RESULT_CACHE_KEY) || "{}")[id] || ""; }
  catch (_) { return ""; }
}

function cacheResult(id, output) {
  let values = {};
  try { values = JSON.parse(sessionStorage.getItem(COMMENT_RESULT_CACHE_KEY) || "{}"); } catch (_) {}
  values[id] = output;
  const entries = Object.entries(values).slice(-20);
  try { sessionStorage.setItem(COMMENT_RESULT_CACHE_KEY, JSON.stringify(Object.fromEntries(entries))); } catch (_) {}
}

function requireCompanySession() {
  const session = window.MPI_COMPANY_SESSION;
  if (!session?.inspectorEmail || !/@michiganpropertyinspections\.com$/i.test(session.inspectorEmail)) {
    throw new Error("Sign in with the MPI company account in Settings, then return to the Comment Builder.");
  }
  return session;
}

function getAIClient() {
  if (!aiPromise) {
    aiPromise = Promise.resolve().then(() => {
      const app = getApps().find(candidate => candidate.name === "mpi-comment-builder")
        || initializeApp(FIREBASE_CONFIG, "mpi-comment-builder");
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
          isTokenAutoRefreshEnabled: true
        });
      } catch (error) {
        if (!/already exists|already been initialized/i.test(String(error?.message || ""))) throw error;
      }
      return getAI(app, { backend: new GoogleAIBackend() });
    }).catch(error => {
      aiPromise = null;
      throw error;
    });
  }
  return aiPromise;
}

async function getModel(modelName) {
  if (!modelPromises.has(modelName)) {
    const promise = getAIClient().then(ai => {
      return getGenerativeModel(ai, {
        model: modelName,
        systemInstruction: commentPolicy.SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      });
    }).catch(error => {
      modelPromises.delete(modelName);
      throw error;
    });
    modelPromises.set(modelName, promise);
  }
  return modelPromises.get(modelName);
}

function commentError(message, status = "Unavailable") {
  const error = new Error(message);
  error.mpiStatus = status;
  return error;
}

function withTimeout(promise, milliseconds = COMMENT_TIMEOUT_MS) {
  let timeout;
  const expired = new Promise((_, reject) => {
    timeout = window.setTimeout(() => reject(commentError(
      "The MPI Comment Builder did not respond within 35 seconds. Your Wi-Fi may still be connected; try once more. If it repeats, tell management the comment service timed out.",
      "Timed out"
    )), milliseconds);
  });
  return Promise.race([promise, expired]).finally(() => window.clearTimeout(timeout));
}

function blobAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",").pop() || "");
    reader.onerror = () => reject(new Error("The supporting photo could not be read."));
    reader.readAsDataURL(blob);
  });
}

async function prepareCommentPhoto(file) {
  if (!file) return null;
  if (!/^image\//i.test(file.type || "") && !/\.(jpe?g|png|heic|heif)$/i.test(file.name || "")) {
    throw new Error("Choose a photo for the Comment Builder.");
  }
  if (Number(file.size) > 12 * 1024 * 1024) throw new Error("Choose a photo smaller than 12 MB.");
  let source;
  let revoke = "";
  try {
    if (typeof createImageBitmap === "function") {
      try { source = await createImageBitmap(file); } catch (_) {}
    }
    if (!source) {
      revoke = URL.createObjectURL(file);
      source = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The supporting photo could not be opened."));
        image.src = revoke;
      });
    }
    const width = source.width || source.naturalWidth || 1;
    const height = source.height || source.naturalHeight || 1;
    const scale = Math.min(1, 1600 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    let processedWidth = canvas.width;
    let processedHeight = canvas.height;
    let blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) throw new Error("The supporting photo could not be reduced for upload.");
    if (blob.size > 1800 * 1024) {
      const smaller = document.createElement("canvas");
      const smallerScale = Math.min(1, 1280 / Math.max(canvas.width, canvas.height));
      smaller.width = Math.max(1, Math.round(canvas.width * smallerScale));
      smaller.height = Math.max(1, Math.round(canvas.height * smallerScale));
      const smallerContext = smaller.getContext("2d");
      smallerContext.fillStyle = "#fff";
      smallerContext.fillRect(0, 0, smaller.width, smaller.height);
      smallerContext.drawImage(canvas, 0, 0, smaller.width, smaller.height);
      blob = await new Promise(resolve => smaller.toBlob(resolve, "image/jpeg", 0.7));
      processedWidth = smaller.width;
      processedHeight = smaller.height;
    }
    if (!blob || blob.size > 2300 * 1024) throw new Error("This photo remains too large after preparation. Take a closer JPEG photo and try again.");
    return {
      inlineData: {
        data: await blobAsBase64(blob),
        mimeType: "image/jpeg"
      },
      byteSize: blob.size,
      originalByteSize: Number(file.size) || 0,
      originalWidth: width,
      originalHeight: height,
      processedWidth,
      processedHeight,
      uploadPrepared: true
    };
  } finally {
    source?.close?.();
    if (revoke) URL.revokeObjectURL(revoke);
  }
}

function friendlyCommentError(error) {
  if (error?.mpiStatus) return error;
  const message = String(error?.message || "");
  const code = String(error?.code || "");
  const combined = `${code} ${message}`.toLowerCase();
  if (/sign in|limit|internet|incomplete|add a photo|field note|supporting photo|photo remains too large|choose a photo/i.test(message)) return error;
  if (!navigator.onLine || /network-request-failed|failed to fetch|networkerror|load failed/.test(combined)) {
    return commentError("The phone is not reaching the MPI Comment Builder. Check that Wi-Fi or cellular data is working, then try again.", "Offline");
  }
  if (/firebase ai logic has been deactivated|marked as inactive/.test(combined)) {
    return commentError("The online MPI Comment Builder service is temporarily unavailable. Your original note is still saved.", "Service unavailable");
  }
  if (/app.?check|recaptcha|403|permission.?denied|unauthori[sz]ed|forbidden/.test(combined)) {
    return commentError("MPI secure access could not be verified on this phone. Close and reopen MPI Field Tools, then try again. If it repeats, contact management.", "Access check failed");
  }
  if (/429|500|502|503|504|quota|resource.?exhausted|too many|busy|overloaded|high demand|unavailable/.test(combined)) {
    return commentError("The MPI Comment Builder is temporarily busy. Wait a minute and try again; your note has not been lost.", "Service busy");
  }
  return commentError("The MPI Comment Builder service could not complete this comment. Try again; if it repeats, contact management and keep the note on screen.", "Service error");
}

function cleanSentence(value) {
  const text = String(value || "")
    .replace(/^[\s>*_`#-]+/, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s[–—]\s/g, " - ")
    .replace(/[*_`#]+/g, "")
    .trim()
    .replace(/\s+/g, " ");
  if (!text) return "";
  const sentence = text[0].toUpperCase() + text.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function cleanResponse(value, fallback = "") {
  return cleanSentence(String(value || fallback).replace(/^(?:Observation|Implication|Recommendation|Limitation|Effect on Inspection):\s*/i, ""));
}

function reportSelection(component) {
  const value = String(component || "");
  if (value.startsWith("report:")) {
    const [section = "", item = ""] = value.slice(7).split("::");
    return { section: decodeURIComponent(section), item: decodeURIComponent(item) };
  }
  if (value.startsWith("item:")) return { section: "", item: decodeURIComponent(value.slice(5)) };
  return { section: "", item: "" };
}

function reportTitlePrefix(component) {
  const { section, item } = reportSelection(component);
  if (!item) {
    const selectedComponent = String(component || "").trim();
    return selectedComponent && selectedComponent !== "auto" ? selectedComponent : "";
  }
  if (["General", "General/Overview"].includes(item)) return section;
  return item.replace(/^OPTIONAL\s*-\s*/i, "");
}

function matchReportTitle(title, component) {
  const prefix = reportTitlePrefix(component);
  const cleanTitle = String(title || "")
    .replace(/^[\s>*_`#-]+/, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s[–—]\s/g, " - ")
    .replace(/[*_`#]+/g, "")
    .trim()
    .slice(0, 140);
  if (!prefix) return cleanTitle;
  const normalizedTitle = cleanTitle.toLowerCase();
  const normalizedPrefix = prefix.toLowerCase();
  if (normalizedTitle === normalizedPrefix || normalizedTitle.startsWith(`${normalizedPrefix} - `)) return cleanTitle;
  return `${prefix} - ${cleanTitle}`.slice(0, 140);
}

function parseResponse(text, note, mode, component) {
  let data;
  try {
    data = JSON.parse(String(text || "").replace(/^```json\s*|\s*```$/g, ""));
  } catch (_) {
    throw new Error("The MPI Comment Builder returned an incomplete result. Please try again.");
  }
  const title = matchReportTitle(data.title, component);
  const observation = cleanResponse(data.observation, note);
  const implication = cleanResponse(data.implication);
  const recommendation = cleanResponse(data.recommendation);
  if (!title || !observation || !implication || !recommendation) {
    throw new Error("The MPI Comment Builder returned an incomplete result. Please try again.");
  }
  if (mode !== "limit" && !/^.+\s-\s.+$/.test(title)) throw new Error("The MPI Comment Builder returned an incomplete component title. Please try again.");
  if ([observation, implication, recommendation].some(value => /\b(?:the photograph shows|based on the image|the image appears to show|i can see|confidence score)\b/i.test(value))) throw new Error("The MPI Comment Builder returned commentary instead of report wording. Please try again.");
  if ([observation, implication, recommendation].some(value => value.replace(/\W/g, "").length < 20)) throw new Error("The MPI Comment Builder returned an incomplete result. Please try again.");
  const labels = mode === "limit"
    ? ["Limitation", "Effect on Inspection", "Recommendation"]
    : ["Observation", "Implication", "Recommendation"];
  return `${title}\n${labels[0]}: ${observation}\n${labels[1]}: ${implication}\n${labels[2]}: ${recommendation}`;
}

async function generate({ note, component = "auto", mode = "defect", photo = null, id = requestId() }) {
  if (!navigator.onLine) {
    const error = commentError("The MPI Comment Builder requires internet access. Your original field note remains saved; reconnect and tap TRY AGAIN.", "Offline");
    error.requestId = id;
    writeTechnicalLog({ requestId: id, attempt: 0, result: "failed", category: "offline", connectivity: "offline" });
    throw error;
  }
  const session = requireCompanySession();
  assertWithinUsageLimit();
  const cleanNote = String(note || "").trim().slice(0, 900);
  if (!cleanNote && !photo) throw new Error("Add a photo, enter a field note, or use both.");
  let preparedPhoto;
  try {
    preparedPhoto = await prepareCommentPhoto(photo);
  } catch (error) {
    error.requestId = id;
    writeTechnicalLog({
      requestId: id,
      attempt: 0,
      result: "failed",
      category: "image-preparation",
      stage: "image-preparation",
      promptVersion: commentPolicy.PROMPT_VERSION,
      inputMode: cleanNote ? "PHOTO + TEXT" : "PHOTO ONLY",
      supportingPhoto: Boolean(photo),
      imageCount: photo ? 1 : 0,
      originalImageBytes: Number(photo?.size) || 0,
      imageUploadSucceeded: false,
      aiRequestContainedImage: false,
      message: String(error?.message || "Image preparation failed").slice(0, 240)
    });
    throw error;
  }
  const inputMode = commentPolicy.inputMode(cleanNote, preparedPhoto);
  const selection = reportSelection(component);
  const prefix = reportTitlePrefix(component);
  const componentInstruction = selection.item
    ? `Selected MPI report section: ${selection.section || "Not specified"}\nSelected MPI report item: ${selection.item}\nThe title must begin exactly with "${prefix}" followed by " - " and a short condition description.`
    : component && component !== "auto"
      ? `Selected MPI component: ${component}\nThe title must begin exactly with "${prefix}" followed by " - " and a short condition description. Do not add a room name to the title.`
      : `Selected report item/component: Auto-detect from the ${inputMode === "PHOTO ONLY" ? "visible photo evidence" : inputMode === "PHOTO + TEXT" ? "field note and visible photo evidence, giving the note priority" : "inspector field note"}. The title must follow the "Component - ${mode === "limit" ? "Limited Inspection" : "Defect"}" convention.`;
  const prior = cachedResult(id);
  if (prior) return prior;
  const request = commentPolicy.buildRequest({ note: cleanNote, componentInstruction, mode, id, preparedPhoto });
  const requestContent = request.requestContent;
  const imageDiagnostics = {
    promptVersion: request.promptVersion,
    supportingPhoto: request.visionInputSupplied,
    imageCount: request.imageCount,
    originalImageWidth: preparedPhoto?.originalWidth || 0,
    originalImageHeight: preparedPhoto?.originalHeight || 0,
    processedImageWidth: preparedPhoto?.processedWidth || 0,
    processedImageHeight: preparedPhoto?.processedHeight || 0,
    originalImageBytes: preparedPhoto?.originalByteSize || 0,
    processedImageBytes: preparedPhoto?.byteSize || 0,
    imageUploadSucceeded: Boolean(preparedPhoto?.uploadPrepared),
    aiRequestContainedImage: Array.isArray(requestContent) && requestContent.some(part => Boolean(part?.inlineData?.data))
  };
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const modelName = attempt === 1 ? PRIMARY_MODEL : FALLBACK_MODEL;
    const startedAt = Date.now();
    let stage = "model-initialization";
    try {
      const model = await getModel(modelName);
      stage = "model-request";
      const result = await withTimeout(model.generateContent(requestContent));
      stage = "response-validation";
      const output = parseResponse(result.response.text(), cleanNote, mode, component);
      cacheResult(id, output);
      recordUsage();
      writeTechnicalLog({
        requestId: id,
        attempt,
        result: "success",
        category: "none",
        connectivity: "online",
        authenticationStatus: "company-session-valid",
        backend: "firebase-ai-logic",
        model: modelName,
        stage,
        durationMs: Date.now() - startedAt,
        inputMode,
        ...imageDiagnostics,
        imageAnalysisCompleted: Boolean(preparedPhoto),
        inspector: session.inspectorEmail || session.inspectorName || "signed-in"
      });
      return output;
    } catch (error) {
      lastError = error;
      const category = technicalCategory(error);
      const errorText = `${error?.code || ""} ${error?.message || ""}`;
      const parsedStatus = errorText.match(/\[(\d{3})\s*\]/)?.[1] || errorText.match(/\b(4\d\d|5\d\d)\b/)?.[1] || "";
      const retryable = navigator.onLine && ["timeout", "network", "service-unavailable", "unknown"].includes(category);
      writeTechnicalLog({
        requestId: id,
        attempt,
        result: "failed",
        category,
        connectivity: navigator.onLine ? "online" : "offline",
        authenticationStatus: "company-session-valid",
        backend: "firebase-ai-logic",
        model: modelName,
        stage,
        durationMs: Date.now() - startedAt,
        inputMode,
        ...imageDiagnostics,
        imageAnalysisCompleted: false,
        retryPlanned: attempt < 2 && retryable,
        inspector: session.inspectorEmail || session.inspectorName || "signed-in",
        code: String(error?.code || "").slice(0, 100),
        httpStatus: Number(error?.status || error?.httpStatus || parsedStatus || 0) || "",
        message: String(error?.message || "Unknown service error").slice(0, 240)
      });
      console.warn("MPI Comment Builder request failed", { requestId: id, attempt, category, model: modelName, stage, error });
      if (attempt < 2 && retryable) {
        modelPromises.delete(modelName);
        await new Promise(resolve => window.setTimeout(resolve, 700));
        continue;
      }
      break;
    }
  }
  const friendly = friendlyCommentError(lastError);
  friendly.requestId = id;
  friendly.mpiCategory = technicalCategory(lastError);
  friendly.mpiFallbackAllowed = Boolean(cleanNote && !preparedPhoto);
  throw friendly;
}

function recordLocalFallback({ id = "", category = "unknown", photo = false } = {}) {
  const session = window.MPI_COMPANY_SESSION || {};
  writeTechnicalLog({
    requestId: id,
    attempt: "local-fallback",
    result: "success",
    category,
    connectivity: navigator.onLine ? "online" : "offline",
    authenticationStatus: session.inspectorEmail ? "company-session-valid" : "unknown",
    backend: "on-device-fallback",
    model: "mpi-rules-v1",
    stage: "local-generation",
    supportingPhoto: Boolean(photo),
    inspector: session.inspectorEmail || session.inspectorName || "signed-in"
  });
}

window.MPI_COMMENT_AI = { generate, usageSnapshot, recordLocalFallback, technicalLog: () => { try { return JSON.parse(localStorage.getItem(COMMENT_LOG_STORAGE_KEY) || "[]"); } catch (_) { return []; } }, dailyLimit: DAILY_LIMIT, monthlyLimit: MONTHLY_LIMIT, primaryModel: PRIMARY_MODEL, fallbackModel: FALLBACK_MODEL, promptVersion: commentPolicy.PROMPT_VERSION };
window.dispatchEvent(new CustomEvent("mpi-comment-ai-ready"));
