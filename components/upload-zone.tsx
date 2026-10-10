"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, TriangleAlert } from "lucide-react";

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

/** Kept in step with SUPPORTED_TYPES in app/upload/actions.ts and the proxy's
 *  body size limit. */
const MAX_SIZE_MB = 40;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Turn react-dropzone's error codes into something a person can act on.
 *
 * Codes come from the library, so the strings are asserted against the union
 * rather than trusted blindly.
 */
function describeRejection(file: File, rejection: FileRejection): string {
  const codes = rejection.errors.map((e) => e.code);
  const sizeMb = (file.size / 1024 / 1024).toFixed(1);
  const isPptx = file.name.toLowerCase().endsWith(".pptx");

  if (codes.includes("file-too-large")) {
    return `"${file.name}" is ${sizeMb}MB. The limit is ${MAX_SIZE_MB}MB — try splitting it, or upload the slides in smaller sections.`;
  }
  if (codes.includes("file-invalid-type")) {
    return isPptx
      ? `"${file.name}" is not a readable PowerPoint file. Export it as .pptx and try again.`
      : `"${file.name}" isn't a PDF or PowerPoint file. Only .pdf and .pptx can be read.`;
  }
  if (codes.includes("too-many-files")) {
    return "Drop one file at a time.";
  }
  return `"${file.name}" could not be accepted. Only PDF and PowerPoint files under ${MAX_SIZE_MB}MB are supported.`;
}

export function UploadZone({ onUpload, disabled }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [rejection, setRejection] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setRejection(null);
      const file = acceptedFiles[0];
      // react-dropzone calls onDrop even when every file was rejected, with an
      // empty array. Bailing silently here is what previously left a user
      // staring at an upload zone that had just eaten their file.
      if (!file) return;
      setUploading(true);
      try {
        await onUpload(file);
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const first = rejections[0];
    if (!first) return;
    setRejection(describeRejection(first.file, first));
  }, []);

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
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          uploading
            ? "pointer-events-none opacity-50"
            : isDragReject
              ? "cursor-not-allowed border-destructive bg-destructive/5"
              : isDragActive
                ? "cursor-pointer border-primary bg-primary/5"
                : "cursor-pointer border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Upload className="mx-auto mb-4 h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">Uploading and processing…</p>
          </>
        ) : isDragReject ? (
          <>
            <TriangleAlert className="mx-auto mb-4 h-8 w-8 text-destructive" aria-hidden="true" />
            <p className="font-medium text-destructive">That file can&apos;t be used</p>
            <p className="mt-1 text-sm text-muted-foreground">Drop it to see why.</p>
          </>
        ) : isDragActive ? (
          <p className="text-muted-foreground">Drop your file here</p>
        ) : (
          <div>
            <Upload className="mx-auto mb-4 h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mb-1 font-medium">Drop a PDF or PPTX here, or click to browse</p>
            <p className="text-sm text-muted-foreground">
              Max {MAX_SIZE_MB}MB &middot; PDF or PPTX only
            </p>
          </div>
        )}
      </div>

      {/* Announced as well as shown: a rejection is often only discovered by
          dropping the file, so a screen reader user who never receives focus
          would otherwise get no feedback at all. */}
      <div aria-live="polite" role="status">
        {rejection && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive bg-card p-4">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-destructive">{rejection}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}