import puppeteer from "puppeteer-extra"; // 👈 Import puppeteer-extra
import StealthPlugin from "puppeteer-extra-plugin-stealth"; // 👈 Import the stealth plugin
import pdf from "pdf-parse";
import axios from "axios";

puppeteer.use(StealthPlugin()); // 👈 Apply the stealth plugin

export const scrapeOccPermits = async (district) => {
  console.log(`Starting STEALTH scrape for District ${district}...`);
  const landingPageUrl =
    "https://public.occ.ok.gov/OGCDWellRecords/Welcome.aspx?dbid=0&repo=OCC";
  let browser = null;
  let page;

  try {
    // Launch Puppeteer with the stealth plugin active
    browser = await puppeteer.launch({ headless: "new" });
    page = await browser.newPage();
    await page.goto(landingPageUrl, { waitUntil: "networkidle2" });

    console.log("On landing page, clicking search link...");
    await page.click("#Bookmarks a");

    const searchButtonSelector = ".CustomSearchSubmitButton";
    await page.waitForSelector(searchButtonSelector);
    console.log("On search form page.");

    console.log("Filling out search form...");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);

    const formattedStartDate = `${(startDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${startDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${startDate.getFullYear()}`;
    const formattedEndDate = `${(endDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${endDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${endDate.getFullYear()}`;

    await page.type("#OilandGasWellRecordsSearch_Input5", formattedStartDate);
    await page.type("#OilandGasWellRecordsSearch_Input5_end", formattedEndDate);

    await page.select("#OilandGasWellRecordsSearch_Input0", "6: '1002A'");
    await page.select(
      "#OilandGasWellRecordsSearch_Input7",
      `${district}: '${district}'`
    );
    await page.click(searchButtonSelector);

    const tableBodySelector = "tbody.p-datatable-tbody";
    console.log(`Waiting for rows to appear...`);
    await page.waitForFunction(
      (selector) => document.querySelector(selector)?.childElementCount > 0,
      { timeout: 60000 },
      tableBodySelector
    );
    console.log("✅ Table rows have rendered.");

    const initialResults = await page.evaluate(() => {
      const results = [];
      const rows = document.querySelectorAll(
        "tbody.p-datatable-tbody tr.p-selectable-row"
      );
      rows.forEach((row) => {
        const detailLink = row.querySelector("td:nth-of-type(2) a")?.href;
        if (detailLink) results.push({ detailLink });
      });
      return results;
    });

    console.log(`Found ${initialResults.length} permit links to process.`);
    const finalPermitData = [];

    for (const item of initialResults.slice(0, 3)) {
      console.log(`Processing: ${item.detailLink}`);
      await page.goto(item.detailLink, { waitUntil: "networkidle2" });
      await page.waitForSelector(".fieldsPane");

      const details = await page.evaluate(() => {
        let county, effectiveDate, apiNumber, wellName, pdfUrl;
        pdfUrl = document.querySelector(".DocViewerViewer a")?.href;
        const rows = document.querySelectorAll(".fieldsPane tr");
        rows.forEach((row) => {
          const label = row.querySelector("td:first-child")?.innerText?.trim();
          const value = row.querySelector("td:last-child")?.innerText?.trim();

          switch (label) {
            case "County:":
              county = value;
              break;
            case "Effective Date:":
              effectiveDate = value;
              break;
            case "API Number:":
              apiNumber = value;
              break;
            case "Well Name:":
              wellName = value;
              break;
          }
        });
        return { county, effectiveDate, apiNumber, wellName, pdfUrl };
      });

      let operatorName = "N/A";
      if (details.pdfUrl) {
        try {
          const pdfResponse = await axios.get(details.pdfUrl, {
            responseType: "arraybuffer",
          });
          const pdfData = await pdf(pdfResponse.data);
          const match = pdfData.text.match(
            /(?:OPERATOR|Operator)'s\s*Name\s*and\s*Address\s*:\s*([^\n]+)/
          );
          if (match && match[1]) {
            operatorName = match[1].trim();
          }
        } catch (pdfError) {
          console.error(
            `Could not parse PDF for ${item.detailLink}: ${pdfError.message}`
          );
        }
      }
      finalPermitData.push({ operatorName, ...details });
    }

    console.log(
      `Successfully scraped details for ${finalPermitData.length} permits.`
    );
    return finalPermitData;
  } catch (error) {
    if (page)
      await page.screenshot({ path: "error_screenshot.png", fullPage: true });
    console.error(`Error scraping OCC for District ${district}:`, error);
    return [];
  } finally {
    if (browser) await browser.close();
  }
};
