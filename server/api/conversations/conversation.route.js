import { Router } from "express";
import {
  handleGetConversationsByUserId,
  handleCreateConversation,
  handleGetConversationById,
  handleDeleteConversationById,
} from "#api/conversations/conversation.controller";
import { authenticateToken } from "#middleware/auth.middleware";
import messageRouter from "#api/messages/message.route";
import chatRouter from "#api/chat/chat.route";

const router = Router();

router.use(authenticateToken);

router.get("/", handleGetConversationsByUserId);
router.post("/", handleCreateConversation);

router.get("/:id", handleGetConversationById);
router.delete("/:id", handleDeleteConversationById);

router.use("/:id/messages", messageRouter);
router.use("/:id/chat", chatRouter);

export default router;
