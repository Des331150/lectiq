"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicsParam = searchParams.get("topics") || "";
  const formatParam = searchParams.get("format") || "mcq";
  const topicIds = topicsParam.split(",").filter(Boolean);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docId = typeof window !== "undefined"
    ? window.location.pathname.split("/")[2]
    : "";

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    const res = await fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: docId,
        topicIds,
        format: formatParam,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setGenerating(false);
      return;
    }
    router.push(`/quizzes/${data.quizId}`);
  };

  if (topicIds.length === 0) {
    return (
      <div className="min-h-screen p-6 max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground mb-4">No topics selected</p>
        <Link href={`/documents/${docId}/topics`}>
          <Button variant="outline">Go back and select topics</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/documents/${docId}/topics`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Topics
          </Button>
        </Link>
      </div>

      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Ready to generate your quiz</h1>
        <p className="text-muted-foreground mb-2">
          {topicIds.length} topic{topicIds.length !== 1 ? "s" : ""} selected
        </p>
        <p className="text-muted-foreground mb-8 capitalize">
          Format: {formatParam.replace("_", " ")}
        </p>
        <Button size="lg" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating questions...
            </>
          ) : (
            "Generate Quiz"
          )}
        </Button>
        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
