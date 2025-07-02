import fs from "fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extract text content from a PDF file using PDF.js
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    console.log("Extracting text from:", filePath);

    // Read the PDF file as a buffer
    const pdfBuffer = await fs.readFile(filePath);

    // Convert buffer to Uint8Array (required by PDF.js)
    const pdfData = new Uint8Array(pdfBuffer);

    // Load the PDF document
    const pdf = await getDocument({ data: pdfData }).promise;

    console.log(`PDF loaded. Pages: ${pdf.numPages}`);

    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items into a string
      const pageText = textContent.items.map((item) => item.str).join(" ");

      fullText += pageText + "\n";
    }

    console.log("PDF extraction successful. Text length:", fullText.length);
    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Extract basic lease terms from text using pattern matching
 * @param {string} text - Extracted text from document
 * @returns {object} Extracted lease terms
 */
export const extractLeaseTerms = (text) => {
  const terms = {
    bonus: null,
    royalty: null,
    acreage: null,
    primaryTerm: null,
    redFlags: [],
  };

  // Bonus patterns: $500/acre, $500 per acre, etc.
  const bonusPatterns = [
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per acre|\/acre)/i,
    /bonus.*?\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  // Royalty patterns: 1/8, 3/16, 20%, etc.
  const royaltyPatterns = [
    /royalty.*?(\d+\/\d+)/i,
    /royalty.*?(\d+(?:\.\d+)?%)/i,
    /(\d+\/\d+).*?royalty/i,
  ];

  // Acreage patterns: 160 acres, 160.5 acres, etc.
  const acreagePatterns = [
    /(\d+(?:\.\d+)?)\s*acres/i,
    /containing\s*(\d+(?:\.\d+)?)\s*acres/i,
  ];

  // Primary term patterns: 3 years, three (3) years, 5 year term, etc.
  const primaryTermPatterns = [
    /primary term.*?(\d+)\s*years?/i,
    /(\d+)\s*year.*?primary term/i,
    /lease.*?(\d+)\s*years?/i,
    /(?:three|four|five|six|seven|eight|nine|ten)\s*\((\d+)\)\s*years?/i,
    /term of.*?(\d+)\s*years?/i,
  ];

  // Red flag patterns
  const redFlagPatterns = [
    {
      pattern: /post.?production.*cost/i,
      flag: "Broad post-production cost language",
    },
    { pattern: /shut.?in.*royalty/i, flag: "Shut-in royalty provisions" },
    { pattern: /force.*pool/i, flag: "Forced pooling language" },
    { pattern: /depth.*sever/i, flag: "Depth severance clause" },
  ];

  // Extract bonus
  for (const pattern of bonusPatterns) {
    const match = text.match(pattern);
    if (match) {
      terms.bonus = `$${match[1]}/acre`;
      break;
    }
  }

  // Extract royalty
  for (const pattern of royaltyPatterns) {
    const match = text.match(pattern);
    if (match) {
      terms.royalty = match[1];
      break;
    }
  }

  // Extract acreage
  for (const pattern of acreagePatterns) {
    const match = text.match(pattern);
    if (match) {
      terms.acreage = `${match[1]} acres`;
      break;
    }
  }

  // Extract primary term
  for (const pattern of primaryTermPatterns) {
    const match = text.match(pattern);
    if (match) {
      terms.primaryTerm = `${match[1]} years`;
      break;
    }
  }

  // Check for red flags
  for (const { pattern, flag } of redFlagPatterns) {
    if (pattern.test(text)) {
      terms.redFlags.push(flag);
    }
  }

  return terms;
};

/**
 * Processes a document and extracts relevant information
 * @param {string} filePath - Path to the document file
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<object>} Processed document data
 */
export const processDocument = async (filePath, fileType) => {
  try {
    if (fileType === "application/pdf") {
      const extractedText = await extractTextFromPDF(filePath);
      const leaseTerms = extractLeaseTerms(extractedText);

      return {
        text: extractedText,
        leaseTerms,
        type: "pdf",
        processed: true,
        summary: generateLeaseSummary(leaseTerms),
      };
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error("Document processing error:", error);
    throw error;
  }
};

/**
 * Generate a human-readable lease summary
 * @param {object} terms - Extracted lease terms
 * @returns {string} Formatted summary
 */
function generateLeaseSummary(terms) {
  let summary = "📋 **Lease Analysis Summary**\n\n";

  if (terms.bonus) summary += `• **Bonus**: ${terms.bonus}\n`;
  if (terms.royalty) summary += `• **Royalty**: ${terms.royalty}\n`;
  if (terms.acreage) summary += `• **Acreage**: ${terms.acreage}\n`;
  if (terms.primaryTerm)
    summary += `• **Primary Term**: ${terms.primaryTerm}\n`;

  if (terms.redFlags.length > 0) {
    summary += `\n⚠️ **Red Flags**:\n`;
    terms.redFlags.forEach((flag) => (summary += `• ${flag}\n`));
  }

  if (!terms.bonus && !terms.royalty && !terms.acreage && !terms.primaryTerm) {
    summary +=
      "No standard lease terms detected. This may be a complex document requiring manual review.";
  }

  return summary;
}
