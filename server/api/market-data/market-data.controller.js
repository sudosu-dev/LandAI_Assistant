import { fetchMarketDataFromApi } from "#api/market-data/market-data.service";

/**
 * Handles the request to get county market data via API.
 */
export const handleGetMarketData = async (req, res, next) => {
  try {
    const { county } = req.params;

    if (!county) {
      return res.status(400).json({ message: "County parameter is required." });
    }

    const apiData = await fetchMarketDataFromApi(county);

    res.status(200).json({
      message: `Successfully fetched ${apiData.length} records for ${county} County from API.`,
      data: apiData,
    });
  } catch (error) {
    console.error(`[MarketDataController] Error:`, error.message);
    // Pass to the global error handler, which will send a 500 response
    next(error);
  }
};
