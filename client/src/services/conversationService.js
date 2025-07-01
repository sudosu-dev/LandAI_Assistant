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
