import pool from "#db/client";
import fs from "fs/promises";
import path from "path";
import { toCamelCase } from "#utils/object.utils";
import { processDocument } from "#api/documents/document-processing.service";
import * as messageService from "#api/messages/message.service";

/**
 * Saves a new document's metadata to the database.
 * @param {number} userId - The ID of the user uploading the document.
 * @param {object} documentData - Object containing the document's metadata.
 * @returns {object} The newly created document record from the database.
 */
export const createDocument = async (userId, documentData) => {
  const { filename, filePath, fileType, fileSize, conversationId } =
    documentData;

  const query = `
    INSERT INTO documents (user_id, conversation_id, filename, file_path, file_type, file_size)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    userId,
    conversationId,
    filename,
    filePath,
    fileType,
    fileSize,
  ];

  const {
    rows: [newDocument],
  } = await pool.query(query, values);

  if (!newDocument) {
    throw new Error("Failed to save document metadata to the database.");
  }

  // Process the document and post analysis to chat
  processDocumentAndNotify(
    userId,
    conversationId,
    filename,
    filePath,
    fileType
  );

  return toCamelCase(newDocument);
};

/**
 * Process document and post analysis results to chat
 */
async function processDocumentAndNotify(
  userId,
  conversationId,
  filename,
  filePath,
  fileType
) {
  try {
    console.log(`Starting document processing for: ${filename}`);

    const processedData = await processDocument(filePath, fileType);

    console.log("Document processed successfully:", {
      filename,
      textLength: processedData.text.length,
      leaseTerms: processedData.leaseTerms,
    });

    // Get assistant role ID
    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = 'assistant'"
    );
    if (roleResult.rows.length === 0) {
      throw new Error("Assistant role not found in database");
    }
    const assistantRoleId = roleResult.rows[0].id;

    // Create analysis message content
    let analysisContent = `📄 **Document Analysis: ${filename}**\n\n`;

    if (processedData.summary) {
      analysisContent += processedData.summary;
    } else {
      analysisContent += `✅ Successfully processed ${filename}\n`;
      analysisContent += `📊 Extracted ${processedData.text.length} characters of text\n\n`;

      if (fileType === "application/pdf") {
        analysisContent += `This appears to be a general document. If this is a lease document, I can help analyze specific terms if you ask me questions about it.`;
      }
    }

    // Post analysis message to chat
    const messageData = {
      conversationId,
      roleId: assistantRoleId,
      content: analysisContent,
      agentType: "lease_analyzer",
    };

    await messageService.createMessage(userId, messageData);
    console.log(`Analysis posted to chat for: ${filename}`);
  } catch (error) {
    console.error("Document processing failed:", error);

    // Post error message to chat
    try {
      const roleResult = await pool.query(
        "SELECT id FROM roles WHERE name = 'assistant'"
      );
      if (roleResult.rows.length > 0) {
        const assistantRoleId = roleResult.rows[0].id;

        const errorMessage = {
          conversationId,
          roleId: assistantRoleId,
          content: `❌ Failed to process ${filename}. ${error.message}`,
          agentType: "coordinator",
        };

        await messageService.createMessage(userId, errorMessage);
      }
    } catch (notificationError) {
      console.error("Failed to post error notification:", notificationError);
    }
  }
}

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
