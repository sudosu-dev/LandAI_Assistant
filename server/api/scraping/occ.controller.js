import { scrapeOccPermits } from "#api/scraping/occ.service";

/**
 * Handles the request to scrape OCC drilling permits.
 */
export const handleScrapeOcc = async (req, res, next) => {
  try {
    const { district } = req.params;

    if (!district || !["1", "2", "3", "4"].includes(district)) {
      return res
        .status(400)
        .json({ message: "A valid district (1-4) is required." });
    }

    const permitData = await scrapeOccPermits(parseInt(district));

    res.status(200).json({
      message: `Successfully scraped ${permitData.length} permit records for District ${district}.`,
      data: permitData,
    });
  } catch (error) {
    console.error(`[OccController] Error:`, error);
    next(error);
  }
};
