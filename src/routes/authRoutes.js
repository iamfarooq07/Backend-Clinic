import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  me,
} from "../controllers/authController.js";
import auth from "../middlewares/auth.js";
import { validateRegister, validateLogin } from "../middlewares/validate.js";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", refresh);
router.post("/logout", auth, logout);
router.get("/me", auth, me);

export default router;
