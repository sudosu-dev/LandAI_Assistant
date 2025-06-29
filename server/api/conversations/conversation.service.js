import pool from "#db/client";

export const getConversationsByUserId = async (userId) => {
  const query = `
        SELECT id, title, created_at FROM conversations WHERE user_id = $1 
    `;
  const values = [userId];

  const { rows } = await pool.query(query, values);
  return rows;
};

export const createConversation = async (userId, title) => {
  const query = `
        INSERT INTO conversations (user_id, title)
        VALUES ($1, $2)
        RETURNING id, title, created_at;
    `;
  const values = [userId, title];

  const {
    rows: [newConversation],
  } = await pool.query(query, values);

  if (!newConversation) {
    throw new Error("Failed to create conversation in the database.");
  }

  return newConversation;
};

export const getConversationsById = async (userId, id) => {
  const query = `
        SELECT id, title, created_at FROM conversations WHERE user_id = $1 AND id = $2
    `;
  const values = [userId, id];

  const { rows } = await pool.query(query, values);
  return rows;
};

export const deleteConversationById = async (userId, id) => {
  const query = `
    DELETE FROM conversations
    WHERE id = $1 AND user_id = $2
  `;
  const values = [id, userId];

  const { rowCount } = await pool.query(query, values);

  if (rowCount === 0) {
    throw new Error("Conversation not found or user unauthorized.");
  }

  return true;
};
