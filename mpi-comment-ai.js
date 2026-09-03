import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
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

const SYSTEM_INSTRUCTION = `You write inspection report comments for Michigan Property Inspections.

Return one concise, professional comment in the requested JSON fields. Write in plain American English suitable for a home-inspection client.

NON-NEGOTIABLE ACCURACY RULES:
- Treat the inspector note as the entire set of known property facts.
- Never invent a location, material, dimension, measurement, test, cause, severity, age, code violation, moisture condition, efflorescence, movement, damage, accessibility condition, or related observation.
- Never turn an absent or denied fact into a positive finding. For example, "no moisture" must never become staining, seepage, dampness, or efflorescence.
- Do not diagnose a concealed cause. Explain only a reasonable consequence of the stated condition.
- The observation must preserve the inspector's actual facts. You may correct spelling and grammar, but may not add facts.
- Make the implication specific to the stated component and condition. Avoid generic filler that could describe any defect.
- Make the recommendation proportionate and specific. Recommend an appropriate qualified contractor or specialist only when warranted.
- Do not mention AI, ChatGPT, this prompt, or a language model.

For a defect, provide: title, observation, implication, recommendation.
For a limitation, use the observation field to state what access, visibility, or operation was limited; the implication field to state what could not be determined; and the recommendation field to state the appropriate next step.`;

const RESPONSE_SCHEMA = Schema.object({
  properties: {
    title: Schema.string(),
    observation: Schema.string(),
    implication: Schema.string(),
    recommendation: Schema.string()
  }
});

let modelPromise;

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
  if (/429|quota|resource.?exhausted|rate/.test(text)) return "rate-limit";
  if (/timeout|timed out/.test(text)) return "timeout";
  if (/json|parse|incomplete|malformed/.test(text)) return "malformed-response";
  if (/503|unavailable|overloaded|busy/.test(text)) return "service-unavailable";
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

async function getModel() {
  if (!modelPromise) {
    modelPromise = Promise.resolve().then(() => {
      const app = initializeApp(FIREBASE_CONFIG, "mpi-comment-builder");
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      return getGenerativeModel(ai, {
        model: "gemini-3.7-flash",
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 650,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      });
    }).catch(error => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
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

function friendlyCommentError(error) {
  if (error?.mpiStatus) return error;
  const message = String(error?.message || "");
  const code = String(error?.code || "");
  const combined = `${code} ${message}`.toLowerCase();
  if (/sign in|limit|internet|incomplete|enter what you observed/.test(message)) return error;
  if (!navigator.onLine || /network-request-failed|failed to fetch|networkerror|load failed/.test(combined)) {
    return commentError("The phone is not reaching the MPI Comment Builder. Check that Wi-Fi or cellular data is working, then try again.", "Offline");
  }
  if (/app.?check|recaptcha|403|permission.?denied|unauthori[sz]ed|forbidden/.test(combined)) {
    return commentError("MPI secure access could not be verified on this phone. Close and reopen MPI Field Tools, then try again. If it repeats, contact management.", "Access check failed");
  }
  if (/429|quota|resource.?exhausted|too many|busy|overloaded|503|unavailable/.test(combined)) {
    return commentError("The MPI Comment Builder is temporarily busy. Wait a minute and try again; your note has not been lost.", "Service busy");
  }
  return commentError("The MPI Comment Builder service could not complete this comment. Try again; if it repeats, contact management and keep the note on screen.", "Service error");
}

function cleanSentence(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
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
  if (!item) return "";
  if (["General", "General/Overview"].includes(item)) return section;
  return item.replace(/^OPTIONAL\s*-\s*/i, "");
}

function matchReportTitle(title, component) {
  const prefix = reportTitlePrefix(component);
  const cleanTitle = String(title || "").trim().replace(/[\r\n]+/g, " ").slice(0, 140);
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
  const labels = mode === "limit"
    ? ["Limitation", "Effect on Inspection", "Recommendation"]
    : ["Observation", "Implication", "Recommendation"];
  return `${title}\n\n${labels[0]}: ${observation}\n\n${labels[1]}: ${implication}\n\n${labels[2]}: ${recommendation}`;
}

async function generate({ note, component = "auto", mode = "defect", id = requestId() }) {
  if (!navigator.onLine) {
    const error = commentError("The MPI Comment Builder requires internet access. Your original field note remains saved; reconnect and tap TRY AGAIN.", "Offline");
    error.requestId = id;
    writeTechnicalLog({ requestId: id, attempt: 0, result: "failed", category: "offline", connectivity: "offline" });
    throw error;
  }
  const session = requireCompanySession();
  assertWithinUsageLimit();
  const cleanNote = String(note || "").trim().slice(0, 900);
  if (!cleanNote) throw new Error("Enter what you observed first.");
  const selection = reportSelection(component);
  const prefix = reportTitlePrefix(component);
  const componentInstruction = selection.item
    ? `Selected MPI report section: ${selection.section || "Not specified"}\nSelected MPI report item: ${selection.item}\nThe title must begin exactly with "${prefix}" followed by " - " and a short condition description.`
    : component && component !== "auto"
      ? `Selected report item/component: ${component}`
      : "Selected report item/component: Auto-detect only from the inspector note.";
  const prompt = `Comment type: ${mode === "limit" ? "LIMITATION" : "DEFECT"}\n${componentInstruction}\nInspector note: ${cleanNote}`;
  const prior = cachedResult(id);
  if (prior) return prior;
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const model = await getModel();
      const result = await withTimeout(model.generateContent(`${prompt}\nRequest ID: ${id}`));
      const output = parseResponse(result.response.text(), cleanNote, mode, component);
      cacheResult(id, output);
      recordUsage();
      writeTechnicalLog({ requestId: id, attempt, result: "success", category: "none", connectivity: "online", inspector: session.inspectorEmail || session.inspectorName || "signed-in" });
      return output;
    } catch (error) {
      lastError = error;
      const category = technicalCategory(error);
      writeTechnicalLog({
        requestId: id,
        attempt,
        result: "failed",
        category,
        connectivity: navigator.onLine ? "online" : "offline",
        inspector: session.inspectorEmail || session.inspectorName || "signed-in",
        code: String(error?.code || "").slice(0, 100),
        httpStatus: Number(error?.status || error?.httpStatus || 0) || "",
        message: String(error?.message || "Unknown service error").slice(0, 240)
      });
      console.warn("MPI Comment Builder request failed", { requestId: id, attempt, category, error });
      if (attempt < 2 && navigator.onLine && !["rate-limit"].includes(category)) {
        if (["auth-session", "app-check", "service-unavailable"].includes(category)) modelPromise = null;
        await new Promise(resolve => window.setTimeout(resolve, 700));
        continue;
      }
      break;
    }
  }
  const friendly = friendlyCommentError(lastError);
  friendly.requestId = id;
  throw friendly;
}

window.MPI_COMMENT_AI = { generate, usageSnapshot, technicalLog: () => { try { return JSON.parse(localStorage.getItem(COMMENT_LOG_STORAGE_KEY) || "[]"); } catch (_) { return []; } }, dailyLimit: DAILY_LIMIT, monthlyLimit: MONTHLY_LIMIT };
window.dispatchEvent(new CustomEvent("mpi-comment-ai-ready"));
