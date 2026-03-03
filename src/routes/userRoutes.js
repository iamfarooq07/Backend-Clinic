import { Router } from "express";
import auth from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/auth.js";
import * as ctrl from "../controllers/userController.js";

const router = Router();
router.use(auth);
router.use(restrictTo("admin", "doctor", "receptionist"));
router.get("/doctors", ctrl.listDoctors);
export default router;
