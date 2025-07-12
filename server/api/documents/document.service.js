import pool from "#db/client";
import { toCamelCase } from "#utils/object.utils";
import { extractTextFromPDF } from "#api/documents/document-processing.service";
import { extractLeaseDataWithAI } from "#api/documents/lease-extractor.service";
import { generateComprehensiveAnalysis } from "#api/documents/lease-analyzer.service";
import * as messageService from "#api/messages/message.service";
import * as marketDataService from "#api/market-data/market-data.service";

/**
 * Creates a document record, processes it with AI, and saves the extracted data.
 * @param {number} userId - The ID of the user uploading the document.
 * @param {object} documentData - Object containing the document's metadata.
 * @returns {Promise<object>} The created document record and the analysis message.
 */
export const createDocument = async (userId, file, conversationId) => {
  const {
    originalname: filename,
    mimetype: fileType,
    size: fileSize,
    buffer: fileBuffer,
  } = file;

  const client = await pool.connect();
  let docInProgress = null;

  try {
    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO documents (user_id, conversation_id, filename, file_path, file_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const insertValues = [
      userId,
      conversationId,
      filename,
      "in-memory",
      fileType,
      fileSize,
    ];
    const {
      rows: [newDocument],
    } = await client.query(insertQuery, insertValues);
    if (!newDocument) throw new Error("Failed to save document metadata.");
    docInProgress = newDocument;

    const leaseText = await extractTextFromPDF(fileBuffer);

    const extractedJSON = await extractLeaseDataWithAI(leaseText);

    const updateQuery = `
      UPDATE documents 
      SET extracted_data = $1, full_text = $2 
      WHERE id = $3;
    `;
    await client.query(updateQuery, [extractedJSON, leaseText, newDocument.id]);

    let marketContext = {};
    try {
      const county = extractedJSON?.county;
      if (county) {
        const marketData = await marketDataService.fetchMarketDataFromApi(
          county
        );
        if (marketData.length > 0) {
          marketContext.recentSales = marketData;
        }
      }
    } catch (marketError) {
      console.warn(
        `Market data fetch failed, proceeding without it: ${marketError.message}`
      );
    }

    const analysisReport = await generateComprehensiveAnalysis(
      leaseText,
      extractedJSON,
      marketContext
    );

    const roleResult = await client.query(
      "SELECT id FROM roles WHERE name = 'assistant'"
    );
    if (roleResult.rows.length === 0)
      throw new Error("Configuration error: 'assistant' role not found.");
    const assistantRoleId = roleResult.rows[0].id;

    const messageData = {
      conversationId,
      roleId: assistantRoleId,
      content: analysisReport,
      agentType: "land_analyzer_pro",
      documentId: newDocument.id,
      contextData: { oilPrice: 75, gasPrice: 2.75, drillingCost: 10000000 },
    };
    const analysisMessage = await messageService.createMessage(
      userId,
      messageData,
      client
    );

    await client.query("COMMIT");

    return [
      {
        roleId: null,
        content: `📎 Uploaded: ${filename}`,
        agentType: "system_confirmation",
      },
      analysisMessage,
    ];
  } catch (error) {
    console.error(
      "An error occurred in the document processing pipeline:",
      error.message
    );

    if (docInProgress) {
      let fallbackContent = "";
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
        fallbackContent = `⚠️ **Analysis Failed: Usage Limit Reached.**\n\nYour daily free token limit has been reached. I was able to process **${filename}**, but I cannot perform the AI analysis at this time.\n\nPlease try again tomorrow, or use the "Re-analyze" button on this message then.`;
      } else {
        fallbackContent = `⚠️ **Analysis Incomplete:** The AI service is currently experiencing high demand or a connection issue.\n\nI was able to process your document, **${filename}**, but could not complete the full analysis.\n\nPlease use the "Re-analyze" button on this message in a few minutes to try again.`;
      }

      const roleResult = await client.query(
        "SELECT id FROM roles WHERE name = 'assistant'"
      );
      const assistantRoleId = roleResult.rows[0].id;

      const fallbackMessageData = {
        conversationId,
        roleId: assistantRoleId,
        content: fallbackContent,
        agentType: "system_fallback",
        documentId: docInProgress.id,
      };
      const fallbackMessage = await messageService.createMessage(
        userId,
        fallbackMessageData,
        client
      );

      await client.query("COMMIT");
      return [fallbackMessage];
    } else {
      await client.query("ROLLBACK");
      const errorMessage = {
        content: `A critical error occurred while uploading ${filename}. The file could not be saved. Please try again.`,
        roleId: null,
        agentType: "system_error",
      };
      return [errorMessage];
    }
  } finally {
    client.release();
  }
};
/**
 * Retrieves a list of all documents for a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {Array<object>} An array of document objects.
 */
export const getDocumentsByUserId = async (userId) => {
  const query = `
    SELECT id, filename, file_type, file_size, upload_date
    FROM documents
    WHERE user_id = $1
    ORDER BY upload_date DESC;
  `;
  const values = [userId];

  const { rows } = await pool.query(query, values);
  return toCamelCase(rows);
};

/**
 * Retrieves a specific document by ID for a user
 */
export const getDocumentById = async (userId, documentId) => {
  const query = `
    SELECT id, filename, file_type, file_size, upload_date, file_path
    FROM documents
    WHERE user_id = $1 AND id = $2
  `;
  const values = [userId, documentId];

  const { rows } = await pool.query(query, values);

  if (rows.length === 0) {
    return null;
  }

  return toCamelCase(rows[0]);
};

/**
 * Deletes a document from the database and the file system.
 * @param {number} userId - The ID of the user requesting the deletion.
 * @param {number} documentId - The ID of the document to delete.
 * @returns {boolean} True if the deletion was successful.
 */
export const deleteDocumentById = async (userId, documentId) => {
  const findQuery = `
    SELECT file_path FROM documents WHERE id = $1 AND user_id = $2;
  `;
  const findValues = [documentId, userId];
  const {
    rows: [document],
  } = await pool.query(findQuery, findValues);

  if (!document) {
    throw new Error("Document not found or user unauthorized.");
  }

  try {
    const fullPath = path.resolve("uploads", path.basename(document.file_path));
    await fs.unlink(fullPath);
    console.log(`Successfully deleted file: ${fullPath}`);
  } catch (error) {
    console.error(
      `Failed to delete file from filesystem: ${document.file_path}`,
      error
    );
  }

  const deleteQuery = `
    DELETE FROM documents WHERE id = $1 AND user_id = $2;
  `;
  const deleteValues = [documentId, userId];
  const { rowCount } = await pool.query(deleteQuery, deleteValues);

  if (rowCount === 0) {
    throw new Error("Failed to delete document record from database.");
  }

  return true;
};

/**
 * Triggers a comprehensive analysis on a document and saves it as a message.
 * @param {number} userId - The ID of the user requesting the analysis.
 * @param {number} documentId - The ID of the document to analyze.
 * @param {object} marketContext - User-provided market parameters for the analysis.
 * @returns {Promise<object>} The newly created analysis message.
 */
export const analyzeDocument = async (
  userId,
  documentId,
  marketContext = {}
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const docQuery = `
      SELECT id, conversation_id, full_text, extracted_data
      FROM documents
      WHERE id = $1 AND user_id = $2;
    `;
    const {
      rows: [document],
    } = await client.query(docQuery, [documentId, userId]);

    if (!document) {
      throw new Error("Document not found or user unauthorized.");
    }
    if (!document.extracted_data || !document.full_text) {
      throw new Error(
        "Document is missing extracted data or full text for analysis."
      );
    }

    let liveMarketContext = {};
    try {
      const county = document.extracted_data?.county;
      if (county) {
        const marketData = await marketDataService.fetchMarketDataFromApi(
          county
        );
        if (marketData.length > 0) {
          liveMarketContext.recentSales = marketData;
        }
      }
    } catch (error) {
      console.warn(
        `Could not fetch market data for re-analysis: ${error.message}. Proceeding without it.`
      );
    }

    const analysisReport = await generateComprehensiveAnalysis(
      document.full_text,
      document.extracted_data,
      liveMarketContext
    );

    const roleResult = await client.query(
      "SELECT id FROM roles WHERE name = 'assistant'"
    );
    if (roleResult.rows.length === 0)
      throw new Error("Config error: 'assistant' role not found.");
    const assistantRoleId = roleResult.rows[0].id;

    const finalContext = {
      oilPrice: 75,
      gasPrice: 2.75,
      drillingCost: 10000000,
      ...marketContext,
    };

    const messageData = {
      conversationId: document.conversation_id,
      roleId: assistantRoleId,
      content: analysisReport,
      agentType: "land_analyzer_pro",
      documentId: document.id,
      contextData: finalContext,
    };
    const analysisMessage = await messageService.createMessage(
      userId,
      messageData,
      client
    );

    await client.query("COMMIT");
    return analysisMessage;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
