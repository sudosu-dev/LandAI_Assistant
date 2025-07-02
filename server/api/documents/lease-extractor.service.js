import { getJsonResponseFromAi } from "#api/ai/ai.service";

/**
 * Builds the prompt for extracting structured data from lease text.
 * @param {string} leaseText - The raw text from the lease document.
 * @returns {string} The formatted prompt to be sent to the AI.
 */
function buildExtractionPrompt(leaseText) {
  return `
You are a highly accurate data extraction bot for oil and gas leases.  
Your sole purpose is to analyze the provided lease text and extract the specified fields.  
Return ONLY a single, valid JSON object with exactly these keys in this exact order. Do not include any other text, explanation, or markdown formatting.

Here is the exact JSON schema to follow:
- "bonusPerAcre" (number | null): The bonus payment per acre as a plain number without currency symbols or commas. If only a total bonus amount is provided, calculate per-acre by dividing total by acreage. If this calculation isn't possible, return null.
- "royaltyRate" (string | null): The royalty rate as a fraction (e.g., "1/5", "3/16"). If given as a percentage, convert it (e.g., 20% → "1/5").
- "primaryTermInYears" (number | null): The length of the primary lease term in years as a plain number.
- "acreage" (number | null): The total number of acres as a plain number without commas.
- "effectiveDate" (string | null): The effective date of the lease in "YYYY-MM-DD" format. Look for phrases like "effective date", "commencement date", "lease date", or "dated".
- "notes" (string[]): An array of short notes for ambiguities, calculations, or anything important (e.g., lump-sum bonus with no acreage, unclear date format, etc.).

The JSON object must contain exactly these 6 keys in this order, with no additional properties.

---
EXAMPLE:
Lease Text:  
"This lease, dated January 1st 2025, covers 80 acres for a bonus of $40,000. Lessor shall receive a one-fourth (1/4) royalty for a term of three (3) years."
JSON Output:
{
  "bonusPerAcre": 500,
  "royaltyRate": "1/4",
  "primaryTermInYears": 3,
  "acreage": 80,
  "effectiveDate": "2025-01-01",
  "notes": ["Calculated bonusPerAcre from total bonus ($40,000 ÷ 80 acres)."]
}
---

Lease Text to Analyze:
---
${leaseText}
---
  `;
}

/**
 * Extracts key lease terms from document text using an AI model.
 * @param {string} leaseText - The raw text from the lease document.
 * @returns {Promise<object>} A structured object with the extracted lease data.
 */
export const extractLeaseDataWithAI = async (leaseText) => {
  const prompt = buildExtractionPrompt(leaseText);

  try {
    const extractedData = await getJsonResponseFromAi(prompt);
    // Add validation here before going to production so object from AI matches schema
    return extractedData;
  } catch (error) {
    console.error("AI extraction failed in extractLeaseDataWithAI:", error);
    throw error;
  }
};
