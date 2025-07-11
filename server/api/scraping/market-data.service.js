import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs/promises";

const COUNTY_ID_MAP = {
  CANADIAN: "10",
  KINGFISHER: "37",
  BLAINE: "05",
  GRADY: "27",
  STEPHENS: "68",
  CARTER: "11",
  OKLAHOMA: "55",
};

export const scrapeCountyRecords = async (county) => {
  console.log(`Starting Puppeteer scrape for ${county} County...`);

  const countyId = COUNTY_ID_MAP[county.toUpperCase()];

  if (!countyId) {
    throw new Error(
      `County '${county}' is not supported or spelled incorrectly.`
    );
  }

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = getPastDate(90);

  const searchURL = `https://okcountyrecords.com/search/advanced?utf8=%E2%9C%93&search%5Bcounty_id%5D=${countyId}&search%5Bdocument_type_id%5D=14&search%5Bstart_date%5D=${startDate}&search%5Bend_date%5D=${endDate}&search%5Bmatch%5D=all&commit=Search`;

  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log(`Navigating to URL with corrected County ID ${countyId}`);
    await page.goto(searchURL, { waitUntil: "networkidle2" });

    const html = await page.content();
    console.log("✅ Page content loaded successfully.");

    const $ = cheerio.load(html);
    const results = [];

    $("div.search-result").each((index, element) => {
      const resultDiv = $(element);
      const detailsContainer = resultDiv.find(".result-details-container");

      const recDate = findDetail(detailsContainer, "Rec. Date:");
      const docStampsText = findDetail(detailsContainer, "Doc Stamps:");
      const legalText = findDetail(detailsContainer, "Legal:");

      const acresMatch = legalText.match(/(\d+\.?\d*)\s*AC/i);
      const netMineralAcres = acresMatch ? parseFloat(acresMatch[1]) : null;

      const docStamps = docStampsText
        ? parseFloat(docStampsText.replace(/[^0-9.]/g, ""))
        : 0;

      let pricePerAcre = null;
      if (docStamps > 0 && netMineralAcres > 0) {
        pricePerAcre = ((docStamps / 1.5) * 1000) / netMineralAcres;
      }

      if (pricePerAcre) {
        results.push({
          county,
          transactionDate: recDate,
          docStamps,
          netMineralAcres,
          pricePerAcre: parseFloat(pricePerAcre.toFixed(2)),
          source: "okcountyrecords.com",
        });
      }
    });

    console.log(
      `Scrape complete. Found ${results.length} valid records with price/acre.`
    );
    return results;
  } catch (error) {
    console.error(`Error scraping ${county} County with Puppeteer:`, error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed.");
    }
  }
};

function findDetail(container, label) {
  let detail = "";
  container.find("strong").each(function () {
    if ($(this).text().trim() === label) {
      detail = $(this).parent().text().replace(label, "").trim();
      return false;
    }
  });
  return detail;
}

function getPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
