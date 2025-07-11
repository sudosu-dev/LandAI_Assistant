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

  return `
    You are LandAI, a sharp and strategic analyst for a land acquisition company (the Lessee).
    Your goal is to evaluate oil and gas leases from a business perspective to maximize profit and operational flexibility for YOUR COMPANY.
    Analyze the lease document below and generate a professional four-part report advising your company on the deal's quality.

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

    First, create a "KEY METRICS" summary table using Markdown. This table should summarize the most important numbers and classifications from your analysis.

    Then, generate the complete four-part report with the following sections in this exact order. Your analysis must be from the perspective of the ACQUISITION COMPANY (Lessee).

    **1. 📋 MARKET ANALYSIS:**
    From the Lessee's perspective, compare the lease's bonus and royalty terms to the provided market context. Is the bonus a cost-effective entry point for us? Is the royalty rate a significant long-term liability? Classify the terms as Favorable, Average, or Unfavorable for our company.

    **2. 💰 FINANCIAL PROJECTION:**
    From the Lessee's perspective, analyze the financial viability. Explain how the royalty rate impacts OUR potential profit margin. Calculate a simple break-even oil price for a new well, framing it as the hurdle WE need to overcome.

    **3. ⚠️ RISK & OPPORTUNITY ASSESSMENT:**
    From the Lessee's perspective, rate our company's overall risk level (Low/Medium/High). Analyze the full lease text for:
    - **RISKS:** Clauses that create operational burdens, strict deadlines, or high costs for US (e.g., strong continuous drilling obligations, high shut-in payments, depth clauses).
    - **OPPORTUNITIES:** Vague or favorable clauses that benefit US (e.g., broad rights for post-production cost deductions, low shut-in payments, lack of a Pugh clause).
    
    **IMPORTANT: Only identify risks and opportunities that can be inferred from the provided "Full Lease Document Text". Do not invent clauses that are not present.** Explain the potential financial impact of these items on OUR bottom line.

    **4. 🎯 RECOMMENDATION & NEGOTIATION STRATEGY:**
    Provide a clear, actionable recommendation for our company with a confidence level. Choose one: "ACCEPT & EXECUTE", "NEGOTIATE TO IMPROVE", or "REJECT". Justify your choice based on our company's goals of profitability and operational control. If negotiation is recommended, list the top 2-3 specific clauses to revise TO OUR ADVANTAGE (e.g., "Attempt to lower the royalty to 3/16 by offering a slightly higher bonus").
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
