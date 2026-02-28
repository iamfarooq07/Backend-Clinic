import { Router } from "express";
import auth from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/auth.js";
import { validatePatient } from "../middlewares/validate.js";
import * as ctrl from "../controllers/patientController.js";

const router = Router();

router.use(auth);
router.use(restrictTo("admin", "doctor", "receptionist"));

router.get("/", ctrl.list);
router.post("/", validatePatient, ctrl.create);
router.get("/:id/history", ctrl.getHistory);
router.get("/:id", ctrl.getOne);
router.patch("/:id", validatePatient, ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
