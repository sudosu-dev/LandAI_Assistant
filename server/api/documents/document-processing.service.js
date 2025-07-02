import fs from "fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extract text content from a PDF file using PDF.js
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const pdfBuffer = await fs.readFile(filePath);
    const pdfData = new Uint8Array(pdfBuffer);
    const pdf = await getDocument({ data: pdfData }).promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};
