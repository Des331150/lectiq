"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Upload,
  TriangleAlert,
  FileText,
  FileCheck2,
  ArrowRight,
  X,
  Loader2,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectFileType, formatBytes, MAX_SIZE_BYTES, MAX_SIZE_MB } from "@/lib/upload-types";

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

/**
 * Turn react-dropzone's error codes into actionable user advice.
 */
function describeRejection(file: File, rejection: FileRejection): string {
  const codes = rejection.errors.map((e) => e.code);
  const sizeMb = (file.size / 1024 / 1024).toFixed(1);
  const isPptx = file.name.toLowerCase().endsWith(".pptx");

  if (codes.includes("file-too-large")) {
    return `"${file.name}" is ${sizeMb}MB. The limit is ${MAX_SIZE_MB}MB — try splitting it or exporting fewer slides.`;
  }
  if (codes.includes("file-invalid-type")) {
    return isPptx
      ? `"${file.name}" is not a readable PowerPoint file. Please export it as .pptx and try again.`
      : `"${file.name}" is not a PDF or PowerPoint file. Only .pdf and .pptx files can be processed.`;
  }
  if (codes.includes("too-many-files")) {
    return "Please upload one file at a time.";
  }
  return `"${file.name}" could not be accepted. Only PDF and PowerPoint files under ${MAX_SIZE_MB}MB are supported.`;
}

export function UploadZone({ onUpload, disabled }: UploadZoneProps) {
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rejection, setRejection] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setRejection(null);
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate type using domain logic
    const ext = detectFileType(file);
    if (!ext) {
      setRejection(`"${file.name}" isn't a PDF or PowerPoint file. Only .pdf and .pptx can be read.`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setRejection(`"${file.name}" is ${formatBytes(file.size)}. The limit is ${MAX_SIZE_MB}MB.`);
      return;
    }

    setStagedFile(file);
  }, []);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const first = rejections[0];
    if (!first) return;
    setStagedFile(null);
    setRejection(describeRejection(first.file, first));
  }, []);

  const handleConfirmUpload = async () => {
    if (!stagedFile || uploading) return;
    setUploading(true);
    setRejection(null);
    try {
      await onUpload(stagedFile);
    } catch {
      setUploading(false);
    }
  };

  const handleClearStaged = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStagedFile(null);
    setRejection(null);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
    disabled: uploading || disabled,
    noClick: !!stagedFile, // Click to browse only when no file is staged
  });

  const fileType = stagedFile ? detectFileType(stagedFile) : null;

  return (
    <div className="w-full">
      {/* Upload Dropzone Container */}
      <div
        {...getRootProps()}
        className={`relative rounded-lg border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
          uploading
            ? "pointer-events-none opacity-60 border-primary/40 bg-card/60"
            : isDragReject
            ? "cursor-not-allowed border-destructive bg-destructive/5"
            : isDragActive
            ? "cursor-pointer border-accent bg-accent/5 ring-4 ring-accent/15"
            : stagedFile
            ? "border-primary/40 bg-card"
            : "cursor-pointer border-border hover:border-primary/60 hover:bg-card/40 bg-card/20"
        }`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="py-2">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-accent" aria-hidden="true" />
            <p className="text-base font-semibold text-foreground mb-1">
              Uploading &amp; preparing document&hellip;
            </p>
            <p className="text-sm text-muted-foreground">
              Transferring file to storage and initializing topic extractor
            </p>
          </div>
        ) : stagedFile ? (
          /* Staged File Preview Card inside Zone */
          <div className="max-w-md mx-auto text-left">
            <div className="flex items-start justify-between p-4 rounded-lg bg-background border border-border shadow-sm mb-4">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                    fileType === "pptx"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {fileType === "pptx" ? (
                    <Presentation className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate" title={stagedFile.name}>
                    {stagedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(stagedFile.size)} &middot; {fileType?.toUpperCase()} Document
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearStaged}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
                title="Remove file"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
              <p className="text-xs text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                Drop another file to replace
              </p>
              <Button
                type="button"
                onClick={handleConfirmUpload}
                disabled={disabled}
                className="w-full sm:w-auto order-1 sm:order-2 font-medium"
              >
                Extract Topics
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        ) : isDragReject ? (
          <div>
            <TriangleAlert className="mx-auto mb-3 h-10 w-10 text-destructive" aria-hidden="true" />
            <p className="font-semibold text-destructive text-base">This file cannot be accepted</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please release to view the error details below.
            </p>
          </div>
        ) : isDragActive ? (
          <div>
            <FileCheck2 className="mx-auto mb-3 h-10 w-10 text-accent transition-transform duration-200 scale-105" aria-hidden="true" />
            <p className="text-base font-semibold text-foreground">Drop your lecture file here</p>
            <p className="text-sm text-muted-foreground">We&apos;ll prepare it for topic extraction</p>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-4 text-primary shadow-xs">
              <Upload className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mb-1 text-base font-semibold text-foreground">
              Drag &amp; drop lecture slides or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Maximum file size: {MAX_SIZE_MB}MB &middot; Text-based files only
            </p>
            <div className="inline-flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-muted text-foreground tracking-wide">
                PDF
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-muted text-foreground tracking-wide">
                PPTX
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Accessible Rejection Announcement & Banner */}
      <div aria-live="polite" role="status">
        {rejection && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-left">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-destructive">Upload Error</p>
              <p className="text-sm text-destructive/90 mt-0.5">{rejection}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
