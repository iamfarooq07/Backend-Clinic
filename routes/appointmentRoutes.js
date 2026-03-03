import express from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getDoctorSchedule,
  getDoctors,
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { appointmentValidation, validate } from '../middleware/validator.js';

const router = express.Router();

// Get all doctors - must be before /:id route
router.get('/doctors', protect, getDoctors);

router
  .route('/')
  .get(protect, getAppointments)
  .post(
    protect,
    appointmentValidation,
    validate,
    createAppointment
  );

router
  .route('/:id')
  .get(protect, getAppointment)
  .put(protect, updateAppointment)
  .delete(protect, authorize('doctor', 'receptionist', 'admin'), deleteAppointment);

router.get('/doctor/:doctorId/schedule', protect, getDoctorSchedule);

export default router;
