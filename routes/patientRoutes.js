import express from 'express';
import {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientHistory,
} from '../controllers/patientController.js';
import { protect, authorize, checkPatientLimit } from '../middleware/auth.js';
import { patientValidation, validate } from '../middleware/validator.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getPatients)
  .post(
    protect,
    authorize('doctor', 'receptionist', 'admin'),
    checkPatientLimit,
    patientValidation,
    validate,
    createPatient
  );

router
  .route('/:id')
  .get(protect, getPatient)
  .put(protect, authorize('doctor', 'receptionist', 'admin'), updatePatient)
  .delete(protect, authorize('doctor', 'admin'), deletePatient);

router.get('/:id/history', protect, getPatientHistory);

export default router;
