import { Router } from "express";
import auth from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/auth.js";
import { validatePrescription } from "../middlewares/validate.js";
import * as ctrl from "../controllers/prescriptionController.js";

const router = Router();

router.use(auth);
router.use(restrictTo("admin", "doctor", "receptionist"));

router.get("/", ctrl.list);
router.post("/", validatePrescription, ctrl.create);
router.get("/:id/pdf", ctrl.generatePdf);
router.get("/:id", ctrl.getOne);

export default router;
