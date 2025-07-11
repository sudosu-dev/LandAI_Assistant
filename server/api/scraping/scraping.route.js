import { Router } from "express";
import { handleScrapeCounty } from "#api/scraping/scraping.controller";
import { authenticateToken } from "#middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/market-data/:county", handleScrapeCounty);

export default router;
