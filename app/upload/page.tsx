"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { UploadZone } from "@/components/upload-zone";
import { Sidebar } from "@/components/sidebar";

export default function UploadPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);

    const ext = file.name.endsWith(".pptx") ? "pptx" : "pdf";
    if (!["pdf", "pptx"].includes(ext)) {
      setError("Only PDF and PPTX files are supported");
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      setError("File must be under 40MB");
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); return; }

    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("Documents")
      .upload(filePath, file);

    if (uploadError) {
      setError(`Failed to upload: ${uploadError.message}`);
      return;
    }

    const result = await uploadDocument(filePath, file.name, ext);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(`/documents/${result.documentId}/topics`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex justify-center">
        <div className="w-full py-6 px-6 max-w-2xl">
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
        </div>
      </div>
    </div>
  );
}
