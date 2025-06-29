import { Router } from "express";
import authRoutes from "#api/auth/auth.route";

const router = Router();

// API V1 root route
router.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "API V1 is alive and main router is working!" });
});

// Resource specific routes
router.use("/auth", authRoutes);

export default router;
