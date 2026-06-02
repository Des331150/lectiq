"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

function NewQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const docId = params.id as string;
  const topicsParam = searchParams.get("topics") || "";
  const formatParam = searchParams.get("format") || "mcq";
  const topicIds = topicsParam.split(",").filter(Boolean);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex justify-center">
          <div className="w-full px-6 max-w-2xl text-center py-12">
            <p className="text-muted-foreground mb-4">No topics selected</p>
            <Link href={`/documents/${docId}/topics`}>
              <Button variant="outline">Go back and select topics</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex justify-center">
        <div className="w-full py-6 px-6 max-w-2xl">
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
      </div>
    </div>
  );
}

export default function NewQuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <NewQuizContent />
    </Suspense>
  );
}
