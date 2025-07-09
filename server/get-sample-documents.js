import axios from "axios";
import "dotenv/config";

async function fetchSampleDocuments() {
  const apiKey = process.env.OKCOUNTYRECORDS_API_KEY;
  if (!apiKey) {
    console.error("API key not found in .env file.");
    return;
  }

  const apiUrl = "https://okcountyrecords.com/api/v1/search";

  try {
    console.log("Fetching sample documents...");

    // Let's try a few different searches to see what we get
    const searches = [
      {
        name: "Oil and Gas Leases - Stephens",
        params: {
          county: "STEPHENS",
          type: "Oil and Gas Lease",
          results_per_page: 5,
        },
      },
      {
        name: "Mineral Deeds - Stephens",
        params: {
          county: "STEPHENS",
          type: "Mineral Deed",
          results_per_page: 5,
        },
      },
      {
        name: "Any LEASE documents - Stephens",
        params: {
          county: "STEPHENS",
          type: "LEASE",
          results_per_page: 5,
        },
      },
    ];
    for (const search of searches) {
      console.log(`\n🔍 ${search.name}:`);
      console.log("=".repeat(50));

      const response = await axios.get(apiUrl, {
        params: search.params,
        auth: {
          username: apiKey,
          password: "x",
        },
      });

      const results = response.data || [];
      console.log(`Found ${results.length} documents`);

      if (results.length > 0) {
        console.log("\nFirst document structure:");
        console.log(JSON.stringify(results[0], null, 2));

        console.log("\nAll document types found:");
        const types = [...new Set(results.map((r) => r.type))];
        console.log(types);
      } else {
        console.log("No documents found with these parameters");
      }
    }
  } catch (error) {
    console.error(
      "Error fetching sample documents:",
      error.response?.data || error.message
    );
  }
}

fetchSampleDocuments();
