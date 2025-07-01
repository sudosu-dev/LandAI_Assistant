import { useState } from "react";
import api from "../../services/api";
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
  const [isDragging, setIsDragging] = useState(false);
  console.log("Modal props:", {
    isOpen,
    onClose,
    conversationId,
    onUploadSuccess,
  }); // debug log

  if (!isOpen) {
    return null;
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("conversationId", conversationId);

      const response = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Upload Successful:", response.data);
      console.log("About to call onUploadSuccess with:", response.data); //debug log
      console.log("onUploadSuccess exists?", !!onUploadSuccess); //debug log
      onUploadSuccess?.(response.data);
      console.log("Called onUploadSuccess"); //debug log
      onClose();
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload failed:", error);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    console.log("Drop event triggered", e);
    console.log("DataTransfer:", e.dataTransfer);
    console.log("Files:", e.dataTransfer?.files);
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      console.log("Setting file:", droppedFile);
      setSelectedFile(droppedFile);
    } else {
      console.log("No files found in drop event");
    }
  };
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles["modal-content"]} ${
          isDragging ? styles.dragging : ""
        }`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h3>Upload a file</h3>
        <label htmlFor="file">
          <input
            type="file"
            name="file"
            id="file"
            accept=".pdf"
            onChange={handleFileSelect}
          />
        </label>
        <button onClick={onClose}>X</button>
        {selectedFile && <p>Selected: {selectedFile.name}</p>}
        {selectedFile && (
          <button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
