import * as documentService from "./document.service.js";

/**
 * Handles the upload of a new document.
 * This controller is intended to be used AFTER the multer upload middleware.
 */
export const handleUploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const { userId } = req.user;
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required." });
    }

    const documentData = {
      filename: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      conversationId: parseInt(conversationId, 10),
    };

    // Wait for document processing to complete
    const result = await documentService.createDocument(userId, documentData);

    // Return both document info and the analysis message
    res.status(201).json({
      document: result.document,
      analysisMessage: result.analysisMessage,
    });
  } catch (error) {
    console.error("[DocumentController - Upload] Error:", error);
    next(error);
  }
};

/**
 * Handles getting all documents for the logged-in user.
 */
export const handleGetDocuments = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const documents = await documentService.getDocumentsByUserId(userId);
    res.status(200).json(documents);
  } catch (error) {
    console.error("[DocumentController - GetDocuments] Error:", error);
    next(error);
  }
};

/**
 * Handles deleting a specific document by its ID.
 */
export const handleDeleteDocument = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: documentId } = req.params;

    await documentService.deleteDocumentById(userId, documentId);

    res.sendStatus(204);
  } catch (error) {
    console.error("[DocumentController - DeleteDocument] Error:", error);

    if (error.message === "Document not found or user unauthorized.") {
      return res.status(404).json({ message: "Document not found." });
    }

    next(error);
  }
};

/**
 * Handles getting a specific document by its ID
 */
export const handleGetDocumentById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: documentId } = req.params;

    const document = await documentService.getDocumentById(userId, documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    res.status(200).json(document);
  } catch (error) {
    console.error("[DocumentController - GetDocumentById] Error:", error);
    next(error);
  }
};

/**
 * Handles a request to perform a comprehensive analysis on a document
 */
export const handleAnalyzeDocument = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: documentId } = req.params;
    const { marketContext } = req.body;

    if (!marketContext || typeof marketContext !== "object") {
      return res
        .status(400)
        .json({ message: "A 'marketContext' object is required." });
    }

    const analysisMessage = await documentService.analyzeDocument(
      userId,
      documentId,
      marketContext
    );

    res.status(200).json(analysisMessage);
  } catch (error) {
    console.error("[DocumentController - Analyze] Error:", error);
    next(error);
  }
};
