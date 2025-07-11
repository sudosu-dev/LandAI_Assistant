import axios from "axios";
import "dotenv/config";

async function fetchSupportedCounties() {
  const apiKey = process.env.OKCOUNTYRECORDS_API_KEY;
  if (!apiKey) {
    console.error("API key not found in .env file.");
    return;
  }

  const apiUrl = "https://okcountyrecords.com/api/v1/counties";

  try {
    console.log("Fetching list of supported counties...");
    const response = await axios.get(apiUrl, {
      auth: {
        username: apiKey,
        password: "x",
      },
    });

    const counties = response.data;
    const countyNames = counties.map((county) => county.name.toUpperCase());

    console.log("\n✅ Supported Counties Found:");
    console.log(countyNames);
    console.log(`\nTotal: ${countyNames.length} counties.`);
  } catch (error) {
    console.error(
      "Error fetching counties:",
      error.response?.data || error.message
    );
  }
}

fetchSupportedCounties();
