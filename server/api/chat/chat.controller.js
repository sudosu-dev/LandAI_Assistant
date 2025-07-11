import * as chatService from "#api/chat/chat.service";

export const handleCreateChat = async (req, res, next) => {
  try {
    const { userId, roleId: userRoleId } = req.user;
    const { id: conversationId } = req.params;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({
        message: "Prompt is required and must be a non-empty string.",
        error: "INVALID_PROMPT",
      });
    }

    const chatData = {
      userId,
      userRoleId,
      conversationId,
      prompt: prompt.trim(),
    };

    const aiMessage = await chatService.createChat(chatData);
    res.status(200).json(aiMessage);
  } catch (error) {
    console.error("[ChatController - createChat] Error:", error);
    next(error);
  }
};
