import pool from "#db/client";

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
  return rows;
};

export const createMessage = async (userId, messageData) => {
  const { conversationId, roleId, content, agentType } = messageData;

  const conversationCheckQuery = `
        SELECT id FROM conversations WHERE user_id = $1 AND id = $2
    `;
  const conversationCheckValues = [userId, conversationId];
  const conversationCheckResult = await pool.query(
    conversationCheckQuery,
    conversationCheckValues
  );

  if (conversationCheckResult.rows.length === 0) {
    throw new Error(
      "Unauthorized: You do not have permission to post in this conversation."
    );
  }

  const insertQuery = `
        INSERT INTO 
            messages (conversation_id, role_id, content, agent_type)
        VALUES
            ($1, $2, $3, $4)
        RETURNING
            conversation_id, content, created_at;
    `;
  const insertValues = [conversationId, roleId, content, agentType];

  const {
    rows: [newMessage],
  } = await pool.query(insertQuery, insertValues);

  if (!newMessage) {
    throw new Error("Failed to create message in the database.");
  }

  return newMessage;
};
