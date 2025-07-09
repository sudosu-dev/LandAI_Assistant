import { Router } from "express";
import { handleGetMarketData } from "#api/market-data/market-data.controller";
import { handleScrapeOcc } from "#api/scraping/occ.controller";
import { authenticateToken } from "#middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/:county", handleGetMarketData);
router.get("/occ-permits/:district", handleScrapeOcc);

export default router;
