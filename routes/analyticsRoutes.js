import express from 'express';
import {
  getAdminAnalytics,
  getDoctorAnalytics,
  getReceptionistAnalytics,
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin', protect, authorize('admin'), getAdminAnalytics);
router.get('/doctor', protect, authorize('doctor'), getDoctorAnalytics);
router.get('/receptionist', protect, authorize('receptionist'), getReceptionistAnalytics);

export default router;
