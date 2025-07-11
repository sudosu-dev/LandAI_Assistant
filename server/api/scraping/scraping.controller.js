import * as marketDataService from "#api/scraping/market-data.service";

/**
 * Handles the request to scrape county market data.
 */
export const handleScrapeCounty = async (req, res, next) => {
  try {
    const { county } = req.params;

    if (!county) {
      return res.status(400).json({ message: "County parameter is required." });
    }

    const scrapedData = await marketDataService.scrapeCountyRecords(county);

    if (scrapedData.length === 0) {
      return res.status(200).json({
        message: `Scraping complete for ${county} County. No valid records found matching the criteria.`,
        data: [],
      });
    }

    res.status(200).json({
      message: `Successfully scraped ${scrapedData.length} records for ${county} County.`,
      data: scrapedData,
    });
  } catch (error) {
    console.error(`[ScrapingController] Error:`, error);
    next(error);
  }
};
