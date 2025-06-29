import { Router } from "express";
import {
  handleGetConversationsByUserId,
  handleCreateConversation,
  handleGetConversationById,
  handleDeleteConversationById,
} from "#api/conversations/conversation.controller";
import { authenticateToken } from "#middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/", handleGetConversationsByUserId);
router.post("/", handleCreateConversation);

router.get("/:id", handleGetConversationById);
router.delete("/:id", handleDeleteConversationById);

export default router;
