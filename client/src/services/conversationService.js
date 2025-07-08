import api from "./api";

/**
 * Gets all conversations for the logged-in user.
 */
export const getConversations = async () => {
  const response = await api.get("/conversations");
  return response.data;
};

/**
 * Gets all messages for a specific conversation.
 * @param {string} conversationId - The ID of the conversation.
 */
export const getMessagesForConversation = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}/messages`);
  return response.data;
};

/**
 * Posts a new message to a conversation and gets the AI's response.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} prompt - The user's message.
 */
export const postMessage = async (conversationId, prompt) => {
  const response = await api.post(`/conversations/${conversationId}/chat`, {
    prompt,
  });
  return response.data;
};

/**
 * Creates a new conversation.
 * @param {string} title - The title for the new conversation.
 */
export const createConversation = async (title) => {
  const response = await api.post("/conversations", { title });
  return response.data;
};

/**
 * Triggers a re-analysis of a document with custom market context.
 * @param {string} documentId - The ID of the document to re-analyze.
 * @param {object} marketContext - The custom market data from the user.
 * @returns {Promise<object>} The new analysis message from the API.
 */
export const reanalyzeDocument = async (documentId, marketContext) => {
  const response = await api.post(`/documents/${documentId}/analyze`, {
    marketContext,
  });
  return response.data;
};
