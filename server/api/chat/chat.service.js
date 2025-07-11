import * as messageService from "#api/messages/message.service";
import * as aiService from "#api/ai/ai.service";
import pool from "#db/client";

/**
 * Performs a complete chat interaction with hybrid conversational history.
 * @param {object} chatData - The data for the chat interaction.
 * @returns {object} The user's saved message and the newly created AI message.
 */
export const createChat = async (chatData) => {
  const { userId, userRoleId, conversationId, prompt, history } = chatData;

  // 1. Save the user's new message to the database.
  const userMessageData = {
    conversationId,
    roleId: userRoleId,
    content: prompt,
  };
  const savedUserMessage = await messageService.createMessage(
    userId,
    userMessageData
  );

  // 2. Build a smarter history for the AI prompt.
  let referenceAnalysis = null;
  const recentChat = [];

  // Separate the most recent analysis from recent chatter.
  for (let i = history.length - 1; i >= 0; i--) {
    const message = history[i];
    if (message.agentType === "land_analyzer_pro" && !referenceAnalysis) {
      referenceAnalysis = message.content; // Grab the full content of the last analysis
    } else if (recentChat.length < 4) {
      // Grab the last 4 non-analysis messages
      const prefix = message.roleId === 2 ? "[USER]:" : "[ASSISTANT]:";
      recentChat.unshift(`${prefix} ${message.content}`); // Add to the beginning to maintain order
    }
  }

  // 3. Construct the final prompt with the hybrid memory.
  let historySection = "";
  if (referenceAnalysis) {
    historySection += `--- REFERENCE: MOST RECENT ANALYSIS REPORT ---\n${referenceAnalysis}\n\n`;
  }
  if (recentChat.length > 0) {
    historySection += `--- RECENT CONVERSATION ---\n${recentChat.join("\n")}\n`;
  }

  const finalPrompt = `
You are LandAI, a helpful oil and gas analysis assistant.

Use the provided reference material and conversation history to answer the user's new question.

${historySection}
Answer the user's new question directly and naturally.
- If the question relates to the analysis report, use the reference report.
- If the question is a follow-up, use the recent conversation.
- If it is a new topic, answer it directly.
- **IMPORTANT: Do not mention the conversation history or reference report in your response.**

NEW QUESTION: ${prompt}
  `;

  // 4. Get and save the AI's response.
  const aiResponseContent = await aiService.getSimpleChatResponse(finalPrompt);
  const roleResult = await pool.query(
    "SELECT id FROM roles WHERE name = 'assistant'"
  );
  if (roleResult.rows.length === 0)
    throw new Error("'assistant' role not found.");
  const assistantRoleId = roleResult.rows[0].id;

  const aiMessageData = {
    conversationId,
    roleId: assistantRoleId,
    content: aiResponseContent,
    agentType: "coordinator",
  };
  const savedAiMessage = await messageService.createMessage(
    userId,
    aiMessageData
  );

  // 5. Return both messages.
  return {
    userMessage: savedUserMessage,
    aiMessage: savedAiMessage,
  };
};
