import { Router } from "express";
import { handleScrapeCounty } from "#api/scraping/scraping.controller";
import { authenticateToken } from "#middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

// e.g., GET /api/v1/scrape/market-data/Canadian
router.get("/market-data/:county", handleScrapeCounty);

export default router;
