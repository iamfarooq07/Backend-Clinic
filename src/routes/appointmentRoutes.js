import { Router } from "express";
import auth from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/auth.js";
import { validateAppointment } from "../middlewares/validate.js";
import * as ctrl from "../controllers/appointmentController.js";

const router = Router();

router.use(auth);
router.use(restrictTo("admin", "doctor", "receptionist", "patient"));

router.get("/", ctrl.list);
router.post("/", validateAppointment, ctrl.create);
router.get("/:id", ctrl.getOne);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
