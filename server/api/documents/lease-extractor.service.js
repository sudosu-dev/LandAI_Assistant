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
    - "bonusPerAcre" (number | null): The bonus payment per acre as a plain number. If only a total bonus is given, calculate it by dividing the total by the acreage. If not found, return null.
    - "royaltyRate" (string | null): The royalty rate as a fraction (e.g., "1/5", "3/16").
    - "primaryTermInYears" (number | null): The length of the primary lease term in years.
    - "acreage" (number | null): The total number of acres.
    - "effectiveDate" (string | null): The effective date in "YYYY-MM-DD" format.
    - "county" (string | null): The county name mentioned in the lease. Find phrases like "situated in [County Name] County, State of Oklahoma".
    - "notes" (string[]): An array of short notes for ambiguities or important context.

    The JSON object must contain exactly these 7 keys in this order.

    ---
    EXAMPLE:
    Lease Text:
    "This lease, dated January 1st 2025, covers 80 acres in Kingfisher County, Oklahoma, for a bonus of $40,000. Lessor shall receive a one-fourth (1/4) royalty for a term of three (3) years."
    JSON Output:
    {
      "bonusPerAcre": 500,
      "royaltyRate": "1/4",
      "primaryTermInYears": 3,
      "acreage": 80,
      "effectiveDate": "2025-01-01",
      "county": "Kingfisher",
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
    // You could add validation here to ensure the AI output matches the schema
    return extractedData;
  } catch (error) {
    console.error("AI extraction failed in extractLeaseDataWithAI:", error);
    throw error;
  }
};
