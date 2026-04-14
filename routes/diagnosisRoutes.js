import express from 'express';
import {
  createDiagnosis,
  getDiagnosisLogs,
  getDiagnosisLog,
  getRiskFlags,
} from '../controllers/diagnosisController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getDiagnosisLogs)
  .post(protect, authorize('doctor'), createDiagnosis);

router.get('/risk-flags', protect, authorize('doctor', 'admin'), getRiskFlags);

router.route('/:id').get(protect, getDiagnosisLog);

export default router;
