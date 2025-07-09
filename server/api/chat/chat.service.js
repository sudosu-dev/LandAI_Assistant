// Import the other services you need to call
import * as messageService from "#api/messages/message.service";
import * as aiService from "#api/ai/ai.service";
import pool from "#db/client"; // We'll need this to get the assistant's role ID

/**
 * Performs a complete simple chat interaction:
 * @param {object} chatData - The data for the chat interaction.
 * @returns {object} The newly created AI message object.
 */
export const createChat = async (chatData) => {
  const { userId, userRoleId, conversationId, prompt } = chatData;

  // --- Step 1: Create and save the user's message ---
  const userMessageData = {
    conversationId,
    roleId: userRoleId,
    content: prompt,
    agentType: null, // User messages don't have an agent type
  };
  // Capture the full user message object after it's created
  const savedUserMessage = await messageService.createMessage(
    userId,
    userMessageData
  );

  // --- Step 2: Get the AI's response ---
  const aiResponseContent = await aiService.getSimpleChatResponse(prompt);

  // --- Step 3: Create and save the AI's message ---
  const roleResult = await pool.query(
    "SELECT id FROM roles WHERE name = 'assistant'"
  );
  if (roleResult.rows.length === 0) {
    throw new Error(
      "'assistant' role not found in database. Please seed roles."
    );
  }
  const assistantRoleId = roleResult.rows[0].id;

  const aiMessageData = {
    conversationId,
    roleId: assistantRoleId,
    content: aiResponseContent,
    agentType: "coordinator", // Or your default AI agent type
  };
  const savedAiMessage = await messageService.createMessage(
    userId,
    aiMessageData
  );

  // --- Step 4: Return an object containing BOTH messages ---
  return {
    userMessage: savedUserMessage,
    aiMessage: savedAiMessage,
  };
};
