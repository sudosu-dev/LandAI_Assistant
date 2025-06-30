import { Router } from "express";
import {
  handleGetMessagesByConversationId,
  handleCreateMessage,
} from "#api/messages/message.controller";
import { authenticateToken } from "#middleware/auth.middleware";
import requireBody from "#middleware/requireBody";

const router = Router({ mergeParams: true });

router.use(authenticateToken);

router.get("/", handleGetMessagesByConversationId);
router.post("/", requireBody(["content"]), handleCreateMessage);

export default router;
