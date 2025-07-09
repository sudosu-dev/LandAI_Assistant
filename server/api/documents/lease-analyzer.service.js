import { getAdvancedChatResponse } from "#api/ai/ai.service";

/**
 * Builds the master prompt for a comprehensive lease analysis.
 * @param {string} leaseText - The full text extracted from the lease PDF.
 * @param {object} extractedData - The structured JSON data from the extraction step.
 * @param {object} marketContext - Contains live market data (e.g., recentSales).
 * @returns {string} The complete, detailed prompt for the AI.
 */
function buildAnalysisPrompt(leaseText, extractedData, marketContext) {
  const jsonDataString = JSON.stringify(extractedData, null, 2);

  // --- DYNAMIC MARKET DATA SECTION ---
  // This section is only added to the prompt if there is live data from ok county records.
  let liveMarketDataSection = `
- Standard Bonus: $400 - $800 per acre
- Standard Royalty: 3/16 to 1/5`;

  if (marketContext.recentSales && marketContext.recentSales.length > 0) {
    const avgPricePerAcre =
      marketContext.recentSales.reduce(
        (acc, sale) => acc + parseFloat(sale.pricePerAcre),
        0
      ) / marketContext.recentSales.length;

    liveMarketDataSection = `
- Live County Average Price/Acre: $${avgPricePerAcre.toFixed(2)} (based on ${
      marketContext.recentSales.length
    } recent sales)
- Standard Royalty: 3/16 to 1/5`;
  }
  // --- END DYNAMIC SECTION ---

  return `
    You are LandAI, an expert land acquisition analyst specializing in oil and gas leases in Oklahoma.
    Your task is to analyze the lease document below using the provided extracted key terms and current market context. Based on these inputs, generate a professional four-part report to guide decision-making.

    **Extracted Key Terms (JSON format):**
    ---
    ${jsonDataString}
    ---

    **Full Lease Document Text (for context and risk analysis):**
    ---
    ${leaseText}
    ---

    **Current Market Context for Oklahoma:**
    ---
    ${liveMarketDataSection}
    ---

    Generate a complete report with the following four sections in this exact order. Keep each section concise but thorough (2-4 paragraphs each). Use Markdown for formatting.

    **1. 📋 MARKET ANALYSIS:**
    Compare the lease's bonus and royalty terms to the provided market context. If live data is available, state whether the bonus is above, below, or in line with the live average. If not, use the standard rates. Classify the terms as strong, average, or weak based on this comparison.

    **2. 💰 FINANCIAL PROJECTION:**
    Calculate a simple break-even oil price required for a new well to be profitable. Crucially, explain how the lease's specific royalty rate financially impacts this break-even point compared to a standard royalty.

    **3. ⚠️ RISK ASSESSMENT:**
    Rate the overall risk level (Low/Medium/High) and analyze the full lease text for unfavorable clauses ("red flags"). Only refer to risks explicitly found in the lease text. Look specifically for language related to post-production costs, shut-in provisions, continuous drilling obligations, and depth clauses. Explain their possible financial impact.

    **4. 🎯 RECOMMENDATION:**
    Provide a clear, actionable recommendation with a confidence level (High/Medium/Low). Choose one: "ACCEPT AS-IS", "NEGOTIATE BEFORE SIGNING", or "REJECT". Justify your choice. If negotiation is recommended, list the top 2-3 specific clauses to revise and suggest improved language or terms for each.
  `;
}

/**
 * Generates a comprehensive analysis for a given document.
 * @param {string} leaseText - The full text from the lease document.
 * @param {object} extractedData - The structured JSON data from the extraction step.
 * @param {object} marketContext - The market context data.
 * @returns {Promise<string>} The AI-generated comprehensive analysis report.
 */
export const generateComprehensiveAnalysis = async (
  leaseText,
  extractedData,
  marketContext
) => {
  if (!leaseText || !extractedData || !marketContext) {
    throw new Error(
      "Lease text, extracted data, and market context are required for analysis."
    );
  }

  const prompt = buildAnalysisPrompt(leaseText, extractedData, marketContext);

  try {
    const analysisReport = await getAdvancedChatResponse(prompt, {
      maxTokens: 2048,
    });
    return analysisReport;
  } catch (error) {
    console.error("AI analysis generation failed:", error);
    throw new Error(
      "Failed to generate comprehensive analysis from AI service."
    );
  }
};
