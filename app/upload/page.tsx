"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "./actions";
import { UploadZone } from "@/components/upload-zone";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadDocument(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/documents/${result.documentId}/topics`);
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">Upload Document</h1>
      <p className="text-muted-foreground mb-8">
        Upload a PDF or PowerPoint file. We&apos;ll extract the topics so you can start quizzing.
      </p>
      <UploadZone onUpload={handleUpload} />
      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
