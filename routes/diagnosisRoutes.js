import express from 'express';
import {
  createDiagnosis,
  getDiagnosisLogs,
  getDiagnosisLog,
  getRiskFlags,
} from '../controllers/diagnosisController.js';
import { protect, authorize, requireProPlan } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getDiagnosisLogs)
  .post(protect, authorize('doctor'), requireProPlan, createDiagnosis);

router.get('/risk-flags', protect, authorize('doctor', 'admin'), requireProPlan, getRiskFlags);

router.route('/:id').get(protect, getDiagnosisLog);

export default router;
