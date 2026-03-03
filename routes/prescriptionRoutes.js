import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  getPrescription,
  getPrescriptionExplanation,
  deletePrescription,
} from '../controllers/prescriptionController.js';
import { protect, authorize, requireProPlan } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getPrescriptions)
  .post(protect, authorize('doctor'), createPrescription);

router
  .route('/:id')
  .get(protect, getPrescription)
  .delete(protect, authorize('doctor', 'admin'), deletePrescription);

router.get(
  '/:id/explanation',
  protect,
  requireProPlan,
  getPrescriptionExplanation
);

export default router;
