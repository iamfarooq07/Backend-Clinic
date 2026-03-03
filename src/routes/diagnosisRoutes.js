import { Router } from "express";
import auth from "../middlewares/auth.js";
import { restrictTo, requirePro } from "../middlewares/auth.js";
import { validateDiagnosisInput } from "../middlewares/validate.js";
import * as ctrl from "../controllers/diagnosisController.js";

const router = Router();

router.use(auth);

// AI status (any authenticated doctor/admin can check)
router.get("/ai-status", restrictTo("admin", "doctor"), ctrl.aiStatus);

// Pro-only AI endpoints
router.post("/symptom-check", restrictTo("admin", "doctor"), requirePro, validateDiagnosisInput, ctrl.symptomCheck);
router.post("/prescription-explain", restrictTo("admin", "doctor"), requirePro, ctrl.prescriptionExplain);
router.post("/risk-flag", restrictTo("admin", "doctor"), requirePro, ctrl.riskFlag);

// Diagnosis logs (doctor/admin)
router.get("/logs", restrictTo("admin", "doctor"), ctrl.listLogs);

export default router;
