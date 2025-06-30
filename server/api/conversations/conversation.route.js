import { Router } from "express";
import {
  handleGetConversationsByUserId,
  handleCreateConversation,
  handleGetConversationById,
  handleDeleteConversationById,
} from "#api/conversations/conversation.controller";
import { authenticateToken } from "#middleware/auth.middleware";
import messageRouter from "#api/messages/message.route";

const router = Router();

router.use(authenticateToken);

router.get("/", handleGetConversationsByUserId);
router.post("/", handleCreateConversation);

router.get("/:id", handleGetConversationById);
router.delete("/:id", handleDeleteConversationById);

router.use("/:id/messages", messageRouter);

export default router;
