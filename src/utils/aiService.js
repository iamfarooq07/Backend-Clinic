/**
 * AI service with graceful fallback.
 * Uses OpenAI if OPENAI_API_KEY is set, else Gemini if GEMINI_API_KEY is set, else static fallback.
 * Never throws; returns fallback content on any failure.
 */

const FALLBACK_SYMPTOM_RESPONSE = {
  possibleConditions: [
    "Consider common causes based on described symptoms. This is not a diagnosis.",
  ],
  riskLevel: "medium",
  suggestedTests: ["General physical examination", "Basic blood work if indicated"],
  raw: "AI is currently unavailable. Please consult a healthcare provider for proper evaluation.",
};

const FALLBACK_PRESCRIPTION_EXPLANATION = {
  explanation: "Take medicines as directed by your doctor. Follow the dosage and frequency strictly. This is general advice; your doctor's instructions override this.",
  lifestyleAdvice: "Maintain a balanced diet, stay hydrated, and get adequate rest. Avoid alcohol if on certain medications.",
  preventiveTips: "Complete the full course of medication. Do not stop early without consulting your doctor.",
};

const FALLBACK_RISK_FLAG = {
  flagged: false,
  message: "Risk assessment is currently unavailable. Review patient history manually.",
};

/**
 * Call OpenAI API (if key present)
 */
async function callOpenAI(systemPrompt, userContent) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 800,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  return text || null;
}

/**
 * Call Gemini API (if key present)
 */
async function callGemini(systemPrompt, userContent) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const fullPrompt = `${systemPrompt}\n\n${userContent}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { maxOutputTokens: 800 },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
}

async function getAiResponse(systemPrompt, userContent) {
  try {
    const openAi = await callOpenAI(systemPrompt, userContent);
    if (openAi) return { text: openAi, provider: "openai" };
    const gemini = await callGemini(systemPrompt, userContent);
    if (gemini) return { text: gemini, provider: "gemini" };
  } catch (e) {
    console.error("AI request error:", e.message);
  }
  return null;
}

/** Check if any AI provider is configured (for status endpoint only) */
export function isAiConfigured() {
  const openai = process.env.OPENAI_API_KEY?.trim();
  const gemini = process.env.GEMINI_API_KEY?.trim();
  return !!(openai || gemini);
}

/**
 * Smart symptom checker: symptoms, age, gender, history -> possible conditions, risk level, suggested tests
 */
export async function getSymptomAnalysis(symptoms, age, gender, history) {
  const systemPrompt = `You are a medical assistant. Do NOT diagnose. Provide only general possibilities and suggest the user see a doctor.
Output a short JSON-like structure with: possibleConditions (array of short strings), riskLevel (low/medium/high), suggestedTests (array of test names). Keep it brief.`;
  const userContent = `Symptoms: ${symptoms}. Age: ${age || "not provided"}. Gender: ${gender || "not provided"}. Brief history: ${history || "none"}.`;

  try {
    const response = await getAiResponse(systemPrompt, userContent);
    const raw = response?.text;
    if (raw) {
      const parsed = tryParseJson(raw);
      if (parsed) {
        return {
          possibleConditions: parsed.possibleConditions || FALLBACK_SYMPTOM_RESPONSE.possibleConditions,
          riskLevel: parsed.riskLevel || "medium",
          suggestedTests: parsed.suggestedTests || FALLBACK_SYMPTOM_RESPONSE.suggestedTests,
          raw,
          aiUsed: true,
          provider: response.provider,
        };
      }
      return { ...FALLBACK_SYMPTOM_RESPONSE, raw, aiUsed: true, provider: response.provider };
    }
  } catch (e) {
    console.error("Symptom analysis error:", e.message);
  }
  return { ...FALLBACK_SYMPTOM_RESPONSE, aiUsed: false };
}

/**
 * Prescription explanation: simple explanation, lifestyle advice, preventive tips
 */
export async function getPrescriptionExplanation(medicines, instructions) {
  const systemPrompt = `You are a medical assistant. In 2-3 short paragraphs provide: (1) simple explanation of taking these medicines, (2) lifestyle advice, (3) preventive tips. Be concise and non-diagnostic.`;
  const userContent = `Medicines: ${JSON.stringify(medicines)}. Instructions: ${instructions || "None"}.`;

  try {
    const response = await getAiResponse(systemPrompt, userContent);
    const raw = response?.text;
    if (raw) {
      return {
        explanation: raw,
        lifestyleAdvice: "",
        preventiveTips: "",
        raw,
        aiUsed: true,
        provider: response.provider,
      };
    }
  } catch (e) {
    console.error("Prescription explanation error:", e.message);
  }
  return { ...FALLBACK_PRESCRIPTION_EXPLANATION, aiUsed: false };
}

/**
 * Risk flagging: repeated infections, chronic symptoms, high-risk combinations
 */
export async function getRiskFlagging(patientHistorySummary) {
  const systemPrompt = `You are a medical assistant. Review the patient history summary. If you see signs of repeated infections, chronic symptoms, or high-risk combinations, respond with a JSON object: { "flagged": true, "message": "brief warning" }. Otherwise { "flagged": false, "message": "No significant risk flags." }. Be very brief.`;
  const userContent = patientHistorySummary || "No history provided.";

  try {
    const response = await getAiResponse(systemPrompt, userContent);
    const raw = response?.text;
    if (raw) {
      const parsed = tryParseJson(raw);
      if (parsed && typeof parsed.flagged === "boolean") {
        return {
          flagged: parsed.flagged,
          message: parsed.message || FALLBACK_RISK_FLAG.message,
          aiUsed: true,
          provider: response.provider,
        };
      }
    }
  } catch (e) {
    console.error("Risk flagging error:", e.message);
  }
  return { ...FALLBACK_RISK_FLAG, aiUsed: false };
}

function tryParseJson(str) {
  try {
    const cleaned = str.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
