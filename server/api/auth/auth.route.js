import { Router } from "express";
import {
  handleUserRegistration,
  handleUserLogin,
  handleUserLogout,
  handleRequestPasswordReset,
  handleResetPassword,
  handleVerifyToken,
} from "#api/auth/auth.controller";

import { authenticateToken } from "#middleware/auth.middleware";

const router = Router();

// --- Public Routes ---
router.post("/register", handleUserRegistration);
router.post("/login", handleUserLogin);
router.post("/request-password-reset", handleRequestPasswordReset);
router.post("/reset-password", handleResetPassword);

// --- Protected Routes ---
router.post("/logout", authenticateToken, handleUserLogout);
router.get("/verify", authenticateToken, handleVerifyToken);

export default router;
