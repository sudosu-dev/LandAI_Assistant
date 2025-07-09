import { Router } from "express";
import { handleGetMarketData } from "#api/market-data/market-data.controller";
import { authenticateToken } from "#middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/:county", handleGetMarketData);

export default router;
