import axios from "axios";

const SUPPORTED_COUNTIES = [
  "ADAIR",
  "ALFALFA",
  "ATOKA",
  "BEAVER",
  "BECKHAM",
  "BLAINE",
  "BRYAN",
  "CARTER",
  "CHEROKEE",
  "CHOCTAW",
  "CIMARRON",
  "COAL",
  "COMANCHE",
  "COTTON",
  "CRAIG",
  "CREEK",
  "CUSTER",
  "DELAWARE",
  "DEWEY",
  "ELLIS",
  "GARVIN",
  "GRADY",
  "GRANT",
  "GREER",
  "HARMON",
  "HARPER",
  "HASKELL",
  "HUGHES",
  "JACKSON",
  "JEFFERSON",
  "JOHNSTON",
  "KAY",
  "KINGFISHER",
  "KIOWA",
  "LATIMER",
  "LEFLORE",
  "LINCOLN",
  "LOGAN",
  "LOVE",
  "MCCLAIN",
  "MCCURTAIN",
  "MCINTOSH",
  "MAJOR",
  "MARSHALL",
  "MAYES",
  "MURRAY",
  "MUSKOGEE",
  "NOBLE",
  "NOWATA",
  "OKFUSKEE",
  "OKMULGEE",
  "OSAGE",
  "OTTAWA",
  "PAWNEE",
  "PITTSBURG",
  "PONTOTOC",
  "POTTAWATOMIE",
  "PUSHMATAHA",
  "ROGER MILLS",
  "SEMINOLE",
  "SEQUOYAH",
  "STEPHENS",
  "TEXAS",
  "TILLMAN",
  "WASHINGTON",
  "WASHITA",
  "WOODWARD",
];

function calculateAcresFromSections(legalDescriptions) {
  if (!legalDescriptions || legalDescriptions.length === 0) return null;
  const uniqueSections = new Set();
  legalDescriptions.forEach((desc) => {
    if (desc.section && desc.township && desc.range) {
      uniqueSections.add(`S${desc.section}-T${desc.township}-R${desc.range}`);
    }
  });
  const numberOfSections = uniqueSections.size;
  return numberOfSections > 0 ? numberOfSections * 640 : null;
}

export const fetchMarketDataFromApi = async (county) => {
  const upperCounty = county.toUpperCase();
  if (!SUPPORTED_COUNTIES.includes(upperCounty)) {
    throw new Error(`County '${county}' is not supported.`);
  }

  const apiKey = process.env.OKCOUNTYRECORDS_API_KEY;
  if (!apiKey) {
    throw new Error("OKCountyRecords API key is not configured on the server.");
  }

  const startDate = getPastDate(365);
  const relevantDeedTypes =
    "DEED|WARRANTY DEED|MINERAL DEED|JOINT TENANT WARRANTY DEED";

  const apiUrl = `https://okcountyrecords.com/api/v1/search`;
  const params = {
    county: upperCounty,
    type: relevantDeedTypes,
    indexed_date_start: startDate,
  };

  try {
    console.log(`Fetching relevant deeds from API for ${county} County...`);
    const response = await axios.get(apiUrl, {
      params,
      auth: { username: apiKey, password: "x" },
    });

    const apiResults = response.data || [];
    const processedResults = [];

    for (const record of apiResults) {
      const docStampsInDollars =
        (record.document_stamp_fees_in_cents || 0) / 100;
      const netMineralAcres = calculateAcresFromSections(
        record.legal_descriptions
      );

      let pricePerAcre = null;
      if (docStampsInDollars > 0 && netMineralAcres > 0) {
        pricePerAcre = ((docStampsInDollars / 1.5) * 1000) / netMineralAcres;
      }

      if (pricePerAcre) {
        processedResults.push({
          county,
          transactionDate: record.indexed_date,
          docStamps: docStampsInDollars,
          netMineralAcres,
          pricePerAcre: parseFloat(pricePerAcre.toFixed(2)),
          source: "OKCountyRecords API",
        });
      }
    }

    console.log(
      `API call complete. Found ${processedResults.length} valid deed records with pricing.`
    );
    return processedResults;
  } catch (error) {
    console.error(
      "Error fetching data from OKCountyRecords API:",
      error.response?.data?.error || error.message
    );
    throw new Error("Failed to retrieve data from the external API.");
  }
};

function getPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
