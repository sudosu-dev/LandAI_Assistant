import { getAdvancedChatResponse } from "#api/ai/ai.service";

/**
 * Builds the master prompt for a comprehensive lease analysis.
 * @param {string} leaseText - The full text extracted from the lease PDF.
 * @param {object} extractedData - The structured JSON data from the extraction step.
 * @param {object} marketContext - The market context data (user-provided or default).
 * @returns {string} The complete, detailed prompt for the AI.
 */
function buildAnalysisPrompt(leaseText, extractedData, marketContext) {
  const jsonDataString = JSON.stringify(extractedData, null, 2);

  const context = {
    standardBonus: marketContext.standardBonus || "$400 - $800 per acre",
    standardRoyalty: marketContext.standardRoyalty || "3/16 to 1/5",
    oilPrice: marketContext.oilPrice || 75,
    gasPrice: marketContext.gasPrice || 2.75,
    drillingCost: marketContext.drillingCost || 10000000,
  };

  const marketContextString = `
- Current WTI Oil Price: $${context.oilPrice}/barrel
- Current Henry Hub Gas Price: $${context.gasPrice}/MMBtu
- Estimated Drilling & Completion Cost: $${(
    context.drillingCost / 1000000
  ).toFixed(1)} million
  `;

  return `
    You are LandAI, an expert land acquisition analyst specializing in oil and gas leases in the Oklahoma SCOOP/STACK plays.
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
    ${marketContextString}
    ---

    Generate a complete report with the following four sections in this exact order. Keep each section concise but thorough (2-4 paragraphs each). Use Markdown for formatting.


    **1. 📋 MARKET ANALYSIS:**
    Compare the lease's bonus and royalty terms to the following standards: Standard Bonus of ${context.standardBonus}, Standard Royalty of ${context.standardRoyalty}. Classify the terms as strong, average, or weak.

    **2. 💰 FINANCIAL PROJECTION:**
    Calculate a simple break-even oil price required for a new well to be profitable, using the provided context. Crucially, explain how the lease's specific royalty rate financially impacts this break-even point compared to a standard royalty.

    **3. ⚠️ RISK ASSESSMENT:**
    Rate the overall risk level (Low/Medium/High) and analyze the full lease text for unfavorable clauses ("red flags"). Only refer to risks explicitly found in the lease text. Do not infer or invent clauses. Look specifically for language related to post-production costs, shut-in provisions, continuous drilling obligations, and depth clauses. Explain their possible financial impact.

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
    // We can request more tokens for this complex analysis
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
