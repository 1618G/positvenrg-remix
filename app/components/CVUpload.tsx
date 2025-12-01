import { useState, useRef } from "react";
import { Form } from "@remix-run/react";

interface CVUploadProps {
  companionId: string;
  companionName: string;
  userId: string;
  existingCV?: {
    id: string;
    originalName: string;
    fileType: string;
    createdAt: string;
  } | null;
}

export default function CVUpload({ companionId, companionName, userId, existingCV }: CVUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (companionName !== "Jobe") {
    return null; // Only show for Jobe
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a PDF, DOC, or DOCX file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("cv", file);

      const response = await fetch("/api/upload-cv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadSuccess(true);
      setTimeout(() => {
        window.location.reload(); // Reload to show updated CV in chat
      }, 1500);
    } catch (error: any) {
      setUploadError(error.message || "Failed to upload CV");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your uploaded CV?")) {
      return;
    }

    if (!existingCV) return;

    try {
      const response = await fetch(`/api/upload-cv?delete=${existingCV.id}`);

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        setUploadError(data.error || "Failed to delete CV");
      }
    } catch (error) {
      // Error deleting CV (client-side, no logger needed)
      setUploadError("Failed to delete CV");
    }
  };

  return (
    <div className="mb-4 p-4 bg-electric-50 border border-electric-200 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-electric-900 mb-1">
            💼 Upload Your CV
          </h3>
          <p className="text-xs text-electric-700">
            {existingCV
              ? `Uploaded: ${existingCV.originalName}`
              : "Help Jobe provide personalized career advice by uploading your CV"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {existingCV && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-electric-600 hover:text-electric-800 px-2 py-1"
            >
              Delete
            </button>
          )}
          <label
            htmlFor="cv-upload"
            className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              uploading
                ? "bg-electric-300 text-electric-700 cursor-not-allowed"
                : "bg-electric-500 text-white hover:bg-electric-600"
            }`}
          >
            {uploading ? "Uploading..." : existingCV ? "Replace" : "Upload CV"}
          </label>
          <input
            ref={fileInputRef}
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </div>
      </div>
      
      {uploadError && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          {uploadError}
        </div>
      )}
      
      {uploadSuccess && (
        <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
          CV uploaded successfully! Reloading...
        </div>
      )}
      
      {existingCV && (
        <div className="mt-2 text-xs text-electric-600">
          ✓ Jobe can now reference your CV in conversations
        </div>
      )}
    </div>
  );
}

