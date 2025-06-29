import { Router } from "express";
import {
  handleUserRegistration,
  handleUserLogin,
  handleUserLogout,
  handleRequestPasswordReset,
  handleResetPassword,
} from "#api/auth/auth.controller";

import { authenticateToken } from "#middleware/auth.middleware";

// import * as AuthController from '../components/auth/auth.controller';

const router = Router();

// --- Public Routes ---
router.post("/register", handleUserRegistration);
router.post("/login", handleUserLogin);
router.post("/request-password-reset", handleRequestPasswordReset);
router.post("/reset-password", handleResetPassword);

// --- Protected Routes ---
router.post("/logout", authenticateToken, handleUserLogout); // << USE authenticateToken here

export default router;
