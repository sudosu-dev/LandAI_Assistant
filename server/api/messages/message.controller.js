import {
  getMessagesByConversationId,
  createMessage,
} from "#api/messages/message.service";
import { authenticateToken } from "#middleware/auth.middleware";

export const handleGetMessagesByConversationId = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: conversationId } = req.params;
    const messages = await getMessagesByConversationId(userId, conversationId);
    res.status(200).json(messages);
  } catch (error) {
    console.error(
      "[MessageController - getMessagesByConversationId] Error:",
      error
    );
    next(error);
  }
};

export const handleCreateMessage = async (req, res, next) => {
  try {
    // --- DEBUGGING STEP ---
    // Let's log the exact data we're receiving right before we use it.
    console.log("--- DEBUGGING handleCreateMessage ---");
    console.log("req.user (from token):", req.user);
    console.log("req.params (from URL):", req.params);
    console.log("------------------------------------");
    // --- END DEBUGGING STEP ---
    const { userId, roleId } = req.user;
    const { id: conversationId } = req.params;
    const { content } = req.body;
    const messageData = {
      conversationId,
      roleId,
      content,
      agentType: null,
    };
    const message = await createMessage(userId, messageData);
    res.status(201).json(message);
  } catch (error) {
    console.error(
      "[MessageController - getMessagesByConversationId] Error:",
      error
    );
    next(error);
  }
};
