"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResearchUploaderProps {
  projectId: string;
  onUploadComplete: (item: any) => void;
}

export function ResearchUploader({
  projectId,
  onUploadComplete,
}: ResearchUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "text/markdown": [".md"],
      "application/pdf": [".pdf"],
      "application/json": [".json"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const item = await res.json();
          onUploadComplete(item);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    setFiles([]);
    setUploading(false);
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-amber bg-amber/5"
            : "border-border/50 hover:border-amber/30 hover:bg-amber/5"
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            "w-8 h-8 mx-auto mb-3",
            isDragActive ? "text-amber" : "text-muted-foreground"
          )}
        />
        <p className="text-sm font-medium">
          {isDragActive ? "Drop files here" : "Drag & drop research files"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports TXT, CSV, MD, PDF, JSON (max 10MB)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/30"
            >
              <File className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 rounded hover:bg-accent text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-amber text-amber-foreground hover:bg-amber/90 gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {files.length} file{files.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
