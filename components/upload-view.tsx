"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/app/upload/actions";
import { createClient } from "@/lib/supabase/client";
import { UploadZone } from "@/components/upload-zone";
import { detectFileType, formatBytes, MAX_SIZE_BYTES, MAX_SIZE_MB } from "@/lib/upload-types";
import { Check, Lightbulb, AlertTriangle } from "lucide-react";

interface UploadViewProps {
  docsUsed?: number;
  docLimit?: number;
}

export function UploadView({ docsUsed = 0, docLimit = 10 }: UploadViewProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const isAtQuota = docsUsed >= docLimit;

  const handleUpload = async (file: File) => {
    setError(null);

    const ext = detectFileType(file);
    if (!ext) {
      setError(`"${file.name}" isn't a PDF or PowerPoint file. Only .pdf and .pptx can be read.`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`"${file.name}" is ${formatBytes(file.size)}. The limit is ${MAX_SIZE_MB}MB.`);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated. Please log in again.");
      return;
    }

    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("Documents")
      .upload(filePath, file);

    if (uploadError) {
      setError(`Failed to upload to storage: ${uploadError.message}`);
      return;
    }

    const result = await uploadDocument(filePath, file.name, ext).catch(() => null);

    if (!result) {
      setError("Upload failed. The file may be too large or processing timed out.");
      return;
    }

    if (result.error) {
      setError(result.error);
      return;
    }

    if (!result.documentId) {
      setError("Upload failed. Please try again.");
      return;
    }

    router.push(`/documents/${result.documentId}/topics`);
  };

  return (
    <div className="max-w-3xl mx-auto py-2">
      {/* Header with Title and Quota Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Upload Lecture Material
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload course slides or notes. We&apos;ll extract the topics so you can generate custom quizzes.
          </p>
        </div>

        {/* Quota Badge */}
        <div className="shrink-0 self-start sm:self-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground shadow-xs">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>
              Documents: <strong className="text-foreground">{docsUsed}</strong> / {docLimit}
            </span>
          </div>
        </div>
      </div>

      {/* Quota Exceeded Warning */}
      {isAtQuota && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Monthly document limit reached ({docLimit}/{docLimit})</p>
            <p className="text-amber-800 text-xs mt-0.5">
              You have reached your limit of {docLimit} documents for this month. You can delete older documents or wait until next month to upload more.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <UploadZone onUpload={handleUpload} disabled={isAtQuota} />

      {/* Error Banner */}
      {error && (
        <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-left">
          <p className="text-sm font-semibold text-destructive">Upload Failed</p>
          <p className="text-sm text-destructive/90 mt-0.5">{error}</p>
        </div>
      )}

      {/* Academic Best Practices Card */}
      <div className="mt-8 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Lightbulb className="w-4 h-4 text-accent" />
          <span>Tips for Best Quiz Generation</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <span>
              <strong>Text-based slides:</strong> Lectures with structured bullet points, definitions, and outlines generate the most accurate questions.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <span>
              <strong>Selectable text:</strong> Ensure text can be highlighted in your PDF viewer. Scanned images without OCR cannot be processed.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <span>
              <strong>Size &amp; Format:</strong> Supports .pdf and .pptx files up to 40MB. For massive decks, export just the relevant lecture chapters.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <span>
              <strong>Frictionless review:</strong> Topics are extracted first so you can pick exactly which concepts to be tested on.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
