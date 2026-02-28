import { Router } from "express";
import auth from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/auth.js";
import * as ctrl from "../controllers/analyticsController.js";

const router = Router();

router.use(auth);

router.get("/admin", restrictTo("admin"), ctrl.adminDashboard);
router.get("/doctor", restrictTo("doctor"), ctrl.doctorDashboard);
router.get("/monthly-appointments", restrictTo("admin", "doctor"), ctrl.monthlyAppointmentsChart);

export default router;
