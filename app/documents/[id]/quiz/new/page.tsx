"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { QuizDeadEnd } from "@/components/quiz-dead-end";
import { formatLabel, isQuizFormat } from "@/lib/quiz-formats";

function NewQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const docId = params.id as string;
  const topicsParam = searchParams.get("topics") || "";
  const rawFormat = searchParams.get("format") ?? "mcq";
  const formatParam = isQuizFormat(rawFormat) ? rawFormat : "mcq";
  const topicIds = topicsParam.split(",").filter(Boolean);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: docId,
          topicIds,
          format: formatParam,
        }),
      });
      // A network drop or 5xx returns HTML, and res.json() would throw.
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || `Generation failed (${res.status})`);
        setGenerating(false);
        return;
      }
      router.push(`/quizzes/${data.quizId}`);
    } catch {
      setError("Could not reach the server. Please try again.");
      setGenerating(false);
    }
  };

  if (topicIds.length === 0) {
    return (
      <AppShell title="New Quiz">
        <div className="py-8">
          <QuizDeadEnd
            title="No topics selected"
            message="A quiz needs at least one topic to draw questions from."
            primaryAction={{
              label: "Choose topics",
              href: `/documents/${docId}/topics`,
            }}
            secondaryAction={{ label: "Back to dashboard", href: "/dashboard" }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="New Quiz">
      <div className="py-8 text-center">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Ready to generate your quiz</h1>
        <p className="text-muted-foreground">
          {topicIds.length} {topicIds.length === 1 ? "topic" : "topics"} selected
        </p>
        <p className="mt-1 text-muted-foreground">
          Format: {formatLabel(formatParam)}
        </p>

        <Button size="lg" onClick={handleGenerate} disabled={generating} className="mt-8">
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Generating questions…
            </>
          ) : (
            "Generate quiz"
          )}
        </Button>

        {error && (
          <div className="mx-auto mt-6 max-w-md rounded-md border border-destructive bg-card px-4 py-3 text-left">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No quota was used. You can adjust your selection and try again.
            </p>
          </div>
        )}

        <p className="mt-6">
          <LinkButton
            href={`/documents/${docId}/topics`}
            variant="ghost"
            className="text-muted-foreground"
          >
            Change selection
          </LinkButton>
        </p>
      </div>
    </AppShell>
  );
}

export default function NewQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewQuizContent />
    </Suspense>
  );
}