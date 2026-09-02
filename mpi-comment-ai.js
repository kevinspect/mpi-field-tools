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
    });
  }
  return modelPromise;
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

function parseResponse(text, note, mode) {
  let data;
  try {
    data = JSON.parse(String(text || "").replace(/^```json\s*|\s*```$/g, ""));
  } catch (_) {
    throw new Error("The MPI Comment Builder returned an incomplete result. Please try again.");
  }
  const title = String(data.title || "").trim().replace(/[\r\n]+/g, " ").slice(0, 140);
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

async function generate({ note, component = "auto", mode = "defect" }) {
  if (!navigator.onLine) throw new Error("The MPI Comment Builder requires an internet connection. Reconnect and try again.");
  requireCompanySession();
  assertWithinUsageLimit();
  const cleanNote = String(note || "").trim().slice(0, 900);
  if (!cleanNote) throw new Error("Enter what you observed first.");
  const componentInstruction = component && component !== "auto"
    ? `Selected report item/component: ${component}`
    : "Selected report item/component: Auto-detect only from the inspector note.";
  const prompt = `Comment type: ${mode === "limit" ? "LIMITATION" : "DEFECT"}\n${componentInstruction}\nInspector note: ${cleanNote}`;
  try {
    const model = await getModel();
    const result = await model.generateContent(prompt);
    const output = parseResponse(result.response.text(), cleanNote, mode);
    recordUsage();
    return output;
  } catch (error) {
    if (/sign in|limit|internet|incomplete/i.test(error?.message || "")) throw error;
    console.warn("MPI Comment Builder request failed", error);
    throw new Error("The secure MPI Comment Builder could not connect. Check the signal and try again.");
  }
}

window.MPI_COMMENT_AI = { generate, dailyLimit: DAILY_LIMIT, monthlyLimit: MONTHLY_LIMIT };
window.dispatchEvent(new CustomEvent("mpi-comment-ai-ready"));
