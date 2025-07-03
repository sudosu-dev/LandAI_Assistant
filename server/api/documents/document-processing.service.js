import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extract text content from a PDF buffer using PDF.js
 * @param {Buffer} fileBuffer - The PDF file data as a buffer.
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromPDF = async (fileBuffer) => {
  try {
    // Convert buffer to Uint8Array (required by PDF.js)
    const pdfData = new Uint8Array(fileBuffer);

    // Load the PDF document from the data buffer
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
    console.error("PDF extraction error with pdfjs-dist:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};
