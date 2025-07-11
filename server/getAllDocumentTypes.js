import axios from "axios";
import "dotenv/config";

async function testWithIndexedDate() {
  const apiKey = process.env.OKCOUNTYRECORDS_API_KEY;
  if (!apiKey) {
    console.error("API key not found in .env file.");
    return;
  }

  const apiUrl = "https://okcountyrecords.com/api/v1/search";

  try {
    console.log("Testing with indexed date instead of instrument date...");

    const response = await axios.get(apiUrl, {
      params: {
        county: "STEPHENS",
        indexed_date_start: "2025-06-01",
        results_per_page: 15,
      },
      auth: {
        username: apiKey,
        password: "x",
      },
    });

    const results = response.data || [];
    console.log(`Found ${results.length} total documents`);

    console.log("\nPagination info:");
    console.log("Total results:", response.headers["api-total-result-count"]);
    console.log("Total pages:", response.headers["api-result-page-count"]);
    console.log("Current page:", response.headers["api-result-page"]);

    const withStamps = results.filter(
      (r) => r.document_stamp_fees_in_cents > 0
    );
    console.log(`\n${withStamps.length} documents have doc stamps > 0`);

    console.log("\n💰 Documents with doc stamps:");
    withStamps.forEach((r) => {
      console.log(`Type: ${r.type}`);
      console.log(`  Doc stamps: $${r.document_stamp_fees_in_cents / 100}`);
      console.log(`  Instrument: ${r.series}-${r.number}`);
      console.log(`  Legal: ${r.legal_descriptions?.[0]?.legal || "N/A"}`);
      console.log(`  Instrument Date: ${r.instrument_date}`);
      console.log(`  Indexed Date: ${r.indexed_date}`);
      console.log(`---`);
    });

    console.log("\n🔍 Searching for specific document I-2025-005632...");

    const specificResponse = await axios.get(apiUrl, {
      params: {
        county: "STEPHENS",
        series: "2025",
        number: "005632",
      },
      auth: {
        username: apiKey,
        password: "x",
      },
    });

    const specificResults = specificResponse.data || [];
    if (specificResults.length > 0) {
      const doc = specificResults[0];
      console.log("✅ Found the specific document:");
      console.log(`Type: ${doc.type}`);
      console.log(`Doc stamps: $${doc.document_stamp_fees_in_cents / 100}`);
      console.log(`Legal: ${doc.legal_descriptions?.[0]?.legal || "N/A"}`);
      console.log(`Indexed: ${doc.indexed_date}`);
    } else {
      console.log("❌ Could not find the specific document via API");
    }
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testWithIndexedDate();
