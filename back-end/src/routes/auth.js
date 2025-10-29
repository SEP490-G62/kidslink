import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  registerValidators,
  loginValidators,
  register,
  login,
  forgotPassword,
  forgotPasswordValidators
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerValidators, register);
router.post("/login", loginValidators, login);
router.post("/forgot-password", forgotPasswordValidators, forgotPassword);

export default router;
