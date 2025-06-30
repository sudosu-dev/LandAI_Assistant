import { Router } from "express";
import { handleCreateChat } from "#api/chat/chat.controller";
import { authenticateToken } from "#middleware/auth.middleware";
import requireBody from "#middleware/requireBody";

const router = Router({ mergeParams: true });

router.use(authenticateToken);

router.post("/", requireBody(["prompt"]), handleCreateChat);

export default router;
