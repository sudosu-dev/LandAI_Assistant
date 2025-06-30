import * as conversationService from "#api/conversations/conversation.service";

export const handleGetConversationsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const convesation = await conversationService.getConversationsByUserId(
      userId
    );
    res.status(200).json(convesation);
  } catch (error) {
    console.error(
      "[ConversationController - GetConversationByUserId] Error:",
      error
    );
    next(error);
  }
};

export const handleCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    const conversation = await conversationService.createConversation(
      userId,
      title
    );
    res.status(201).json(conversation);
  } catch (error) {
    console.error(
      "[ConversationController - createConversation] Error:",
      error
    );
    next(error);
  }
};

export const handleGetConversationById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const conversation = await conversationService.getConversationById(
      userId,
      id
    );
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    res.status(200).json(conversation);
  } catch (error) {
    console.error(
      "[ConversationController - GetConversationById] Error:",
      error
    );
    next(error);
  }
};

export const handleDeleteConversationById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const conversation = await conversationService.deleteConversationById(
      userId,
      id
    );
    res.sendStatus(204);
  } catch (error) {
    console.error(
      "[ConversationController - DeleteConversationById] Error:",
      error
    );

    if (error.message === "Conversation not found or user unauthorized.") {
      return res.status(404).json({ message: "Conversation not found." });
    }

    next(error);
  }
};
