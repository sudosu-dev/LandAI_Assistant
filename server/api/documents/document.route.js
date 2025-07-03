import { Router } from "express";
import {
  handleUploadDocument,
  handleGetDocuments,
  handleDeleteDocument,
  handleGetDocumentById,
  handleAnalyzeDocument,
} from "#api/documents/document.controller";
import { authenticateToken } from "#middleware/auth.middleware";
import upload from "#middleware/upload.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/", handleGetDocuments);
router.post("/upload", upload.single("document"), handleUploadDocument);
router.get("/:id", handleGetDocumentById);
router.delete("/:id", handleDeleteDocument);
router.post(":id/analyze", handleAnalyzeDocument);

export default router;
