"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { UploadZone } from "@/components/upload-zone";
import { AppShell } from "@/components/app-shell";
import { detectFileType, formatBytes, MAX_SIZE_BYTES, MAX_SIZE_MB } from "@/lib/upload-types";

export default function UploadPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);

    // Derive the type from the file's own name and MIME type, and refuse
    // anything unrecognised. This previously read
    // `file.name.endsWith(".pptx") ? "pptx" : "pdf"`, which relabelled every
    // other file as a PDF: a .docx arrived in storage named .pdf and then failed
    // deep inside text extraction with a message about PDF internals.
    const ext = detectFileType(file);
    if (!ext) {
      setError(
        `"${file.name}" isn't a PDF or PowerPoint file. Only .pdf and .pptx can be read.`
      );
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(
        `"${file.name}" is ${formatBytes(file.size)}. The limit is ${MAX_SIZE_MB}MB.`
      );
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); return; }

    // The stored path keeps the real extension so the server never has to infer
    // the type from the name.
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("Documents")
      .upload(filePath, file);

    if (uploadError) {
      setError(`Failed to upload: ${uploadError.message}`);
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
    <AppShell title="Upload">
      <h1 className="text-2xl font-bold mb-2">Upload Document</h1>
      <p className="text-muted-foreground mb-8">
        Upload a PDF or PowerPoint file. We&apos;ll extract the topics so you can start quizzing.
      </p>
      <UploadZone onUpload={handleUpload} />
      {error && (
        <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}
    </AppShell>
  );
}
