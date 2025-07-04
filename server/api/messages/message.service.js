import pool from "#db/client";
import { toCamelCase } from "#utils/object.utils";

export const getMessagesByConversationId = async (userId, conversationId) => {
  const query = `
        SELECT 
            messages.*
        FROM
            messages
        JOIN
            conversations ON messages.conversation_id = conversations.id
        WHERE
            conversations.user_id = $1 AND messages.conversation_id = $2;
    `;
  const values = [userId, conversationId];

  const { rows } = await pool.query(query, values);
  return toCamelCase(rows);
};

export const createMessage = async (userId, messageData, client = pool) => {
  const {
    conversationId,
    roleId,
    content,
    agentType,
    documentId,
    contextData,
  } = messageData;

  const conversationCheckQuery = `
    SELECT id FROM conversations WHERE user_id = $1 AND id = $2
  `;
  const conversationCheckValues = [userId, conversationId];
  const conversationCheckResult = await client.query(
    conversationCheckQuery,
    conversationCheckValues
  );

  if (conversationCheckResult.rows.length === 0) {
    throw new Error(
      "Unauthorized: You do not have permission to post in this conversation."
    );
  }

  const insertQuery = `
    INSERT INTO messages (conversation_id, role_id, content, agent_type, document_id, context_data)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const insertValues = [
    conversationId,
    roleId,
    content,
    agentType,
    documentId,
    contextData,
  ];

  const {
    rows: [newMessage],
  } = await client.query(insertQuery, insertValues);

  if (!newMessage) {
    throw new Error("Failed to create message in the database.");
  }

  return toCamelCase(newMessage);
};
