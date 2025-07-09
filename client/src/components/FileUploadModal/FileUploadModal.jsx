import { useState, useRef } from "react";
import api from "../../services/api";
import Button from "../Button/Button";
import styles from "./FileUploadModal.module.css";

export default function FileUploadModal({
  isOpen,
  onClose,
  conversationId,
  onUploadSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) {
    return null;
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setError(null);
    } else {
      setError("Please select a valid PDF file.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("conversationId", conversationId);

      const response = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onUploadSuccess?.(response.data);
      handleClose();
    } catch (error) {
      console.error("Upload failed:", error);
      setError(
        error.response?.data?.message ||
          "Failed to upload file. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Upload Lease Document</h3>
        <p className={styles.modalSubtitle}>Select a PDF file to analyze.</p>

        <div className={styles.uploadArea} onClick={triggerFileSelect}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf"
            style={{ display: "none" }}
          />
          {selectedFile ? (
            <p className={styles.fileName}>{selectedFile.name}</p>
          ) : (
            <p>Click here to select a file</p>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.buttonGroup}>
          <Button type="button" onClick={handleClose} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? "Uploading..." : "Upload & Analyze"}
          </Button>
        </div>
      </div>
    </div>
  );
}
