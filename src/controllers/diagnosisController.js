import DiagnosisLog from "../models/DiagnosisLog.js";
import { getSymptomAnalysis, getPrescriptionExplanation, getRiskFlagging, isAiConfigured } from "../utils/aiService.js";

/**
 * Smart symptom checker (Pro only). Saves to DiagnosisLog.
 */
export const symptomCheck = async (req, res) => {
  try {
    const { patientId, symptoms, age, gender, history } = req.body;
    const result = await getSymptomAnalysis(symptoms, age, gender, history);
    const riskLevel = (result.riskLevel || "medium").toLowerCase();
    const validRisk = ["low", "medium", "high"].includes(riskLevel)
      ? riskLevel
      : "medium";

    if (patientId) {
      await DiagnosisLog.create({
        patientId,
        symptoms,
        aiResponse: result.raw || JSON.stringify(result),
        riskLevel: validRisk,
      });
    }

    res.json({
      possibleConditions: result.possibleConditions,
      riskLevel: validRisk,
      suggestedTests: result.suggestedTests,
      raw: result.raw,
      aiUsed: result.aiUsed ?? false,
      provider: result.provider || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Prescription explanation (Pro only). No DB save.
 */
export const prescriptionExplain = async (req, res) => {
  try {
    const { medicines, instructions } = req.body;
    const result = await getPrescriptionExplanation(
      medicines || [],
      instructions || ""
    );
    res.json({
      explanation: result.explanation,
      lifestyleAdvice: result.lifestyleAdvice,
      preventiveTips: result.preventiveTips,
      raw: result.raw,
      aiUsed: result.aiUsed ?? false,
      provider: result.provider || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Risk flagging (Pro only). Uses recent diagnosis logs or provided summary.
 */
export const riskFlag = async (req, res) => {
  try {
    const { patientId, summary } = req.body;
    let patientHistorySummary = summary;
    if (!patientHistorySummary && patientId) {
      const logs = await DiagnosisLog.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      patientHistorySummary = logs.map((l) => l.symptoms + " -> " + l.riskLevel).join("; ");
    }
    const result = await getRiskFlagging(patientHistorySummary);
    res.json({
      flagged: result.flagged,
      message: result.message,
      aiUsed: result.aiUsed ?? false,
      provider: result.provider || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Check if AI is configured (for frontend status) */
export const aiStatus = async (_req, res) => {
  try {
    res.json({ aiConfigured: isAiConfigured() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** List diagnosis logs for a patient */
export const listLogs = async (req, res) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ message: "patientId is required" });
    }
    const logs = await DiagnosisLog.find({ patientId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
