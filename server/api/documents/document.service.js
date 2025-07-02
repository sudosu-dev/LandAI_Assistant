import pool from "#db/client";
import fs from "fs/promises";
import path from "path";
import { toCamelCase } from "#utils/object.utils";
import { extractTextFromPDF } from "#api/documents/document-processing.service";
import { extractLeaseDataWithAI } from "#api/documents/lease-extractor.service";
import * as messageService from "#api/messages/message.service";

/**
 * Creates a document record, processes it with AI, and saves the extracted data.
 * @param {number} userId - The ID of the user uploading the document.
 * @param {object} documentData - Object containing the document's metadata.
 * @returns {Promise<object>} The created document record and the analysis message.
 */
export const createDocument = async (userId, documentData) => {
  const { filename, filePath, fileType, fileSize, conversationId } =
    documentData;

  const insertQuery = `
    INSERT INTO documents (user_id, conversation_id, filename, file_path, file_type, file_size)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const insertValues = [
    userId,
    conversationId,
    filename,
    filePath,
    fileType,
    fileSize,
  ];
  const {
    rows: [newDocument],
  } = await pool.query(insertQuery, insertValues);

  if (!newDocument) {
    throw new Error("Failed to save document metadata to the database.");
  }

  let analysisMessage;

  try {
    const leaseText = await extractTextFromPDF(filePath);

    const extractedJSON = await extractLeaseDataWithAI(leaseText);

    const updateQuery = `
      UPDATE documents
      SET extracted_data = $1
      WHERE id = $2;
    `;
    await pool.query(updateQuery, [extractedJSON, newDocument.id]);

    let analysisContent = `📄 **AI Analysis: ${filename}**\n\nI've analyzed the document and extracted the following key terms:\n\n`;

    for (const [key, value] of Object.entries(extractedJSON)) {
      if (key !== "notes") {
        const formattedKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
        analysisContent += `• **${formattedKey}**: ${value || "Not Found"}\n`;
      }
    }

    if (extractedJSON.notes && extractedJSON.notes.length > 0) {
      analysisContent += `\n**Notes from AI:**\n`;
      extractedJSON.notes.forEach((note) => (analysisContent += `• ${note}\n`));
    }

    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = 'assistant'"
    );
    const assistantRoleId = roleResult.rows[0].id;
    const messageData = {
      conversationId,
      roleId: assistantRoleId,
      content: analysisContent,
      agentType: "lease_analyzer",
    };
    analysisMessage = await messageService.createMessage(userId, messageData);
  } catch (error) {
    console.error("Document processing failed:", error);
    analysisMessage = {
      content: `❌ AI analysis failed for ${filename}. The document was saved, but analysis could not be completed.`,
      role_id: null,
      agent_type: "coordinator",
    };
  }

  return {
    document: toCamelCase(newDocument),
    analysisMessage: analysisMessage,
  };
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
