"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QuizQuestionDisplay } from "@/components/quiz-question";
import { AppShell } from "@/components/app-shell";
import { QuizDeadEnd } from "@/components/quiz-dead-end";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Quiz, QuizQuestion } from "@/types/database";

type Phase =
  | { kind: "loading" }
  | { kind: "generating" }
  | { kind: "ready"; quiz: Quiz; questions: QuizQuestion[] }
  | { kind: "error"; title: string; message: string };

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [quizId, setQuizId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  // Refocusing the heading on every question change would also fire on mount,
  // stealing focus from the page on arrival.
  const mounted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function load(quizId: string) {
      const supabase = createClient();
      const { data: q } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (cancelled) return;
      if (!q) {
        setPhase({
          kind: "error",
          title: "We couldn't find that quiz",
          message: "It may have been removed, or the link may be wrong.",
        });
        return;
      }

      if (q.status === "generating") {
        setPhase({ kind: "generating" });
        interval = setInterval(async () => {
          const { data: updated } = await supabase
            .from("quizzes")
            .select("status")
            .eq("id", quizId)
            .single();
          // Stop on any terminal state. Previously only "ready" cleared the
          // interval, so a generation that ended in "error" polled forever and
          // the spinner never resolved.
          if (updated?.status && updated.status !== "generating") {
            if (interval) clearInterval(interval);
            load(quizId);
          }
        }, 2000);
        return;
      }

      if (q.status === "error") {
        setPhase({
          kind: "error",
          title: "We couldn't build this quiz",
          message:
            "Something went wrong while generating the questions. Your document is safe — you can try the quiz again.",
        });
        return;
      }

      if (q.status !== "ready" && q.status !== "completed") {
        setPhase({
          kind: "error",
          title: "This quiz isn't ready yet",
          message: "It hasn't finished generating. Try again in a moment.",
        });
        return;
      }

      const { data: qs } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("position");

      if (cancelled) return;
      const questions = qs ?? [];
      if (questions.length === 0) {
        setPhase({
          kind: "error",
          title: "This quiz has no questions",
          message: "Nothing was generated from the selected topics.",
        });
        return;
      }
      setPhase({ kind: "ready", quiz: q, questions });
    }

    params.then((p) => {
      setQuizId(p.id);
      load(p.id);
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [params]);

  // Announce the new question to screen readers. Without this, moving to the
  // next question in a one-question-per-screen layout is silent: the focus
  // stays on the Next button and nothing in the DOM tells the user what changed.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [current]);

  const questions = phase.kind === "ready" ? phase.questions : [];

  const answeredIds = useMemo(
    () => new Set(Object.entries(answers).filter(([, v]) => v.trim().length > 0).map(([k]) => k)),
    [answers]
  );

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleSubmit = async () => {
    if (!quizId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });
      // A network drop or 5xx returns HTML, and res.json() would throw, leaving
      // the button stuck on "Submitting..." with no feedback.
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSubmitError(data?.error || `Failed to submit (${res.status})`);
        setSubmitting(false);
        return;
      }
      router.push(`/quizzes/${quizId}/results`);
    } catch {
      setSubmitError("Could not reach the server. Your answers were not saved.");
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[current];
  const isLast = current === questions.length - 1;
  const allAnswered = questions.length > 0 && questions.every((q) => answeredIds.has(q.id));
  const unansweredCount = questions.length - answeredIds.size;

  return (
    <AppShell title="Quiz">
      {phase.kind === "loading" && (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Loading quiz</span>
        </div>
      )}

      {phase.kind === "generating" && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <Loader2 className="mb-4 h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Building your quiz</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This usually takes under a minute. You can stay on this page.
          </p>
        </div>
      )}

      {phase.kind === "error" && (
        <div className="py-4">
          <QuizDeadEnd
            title={phase.title}
            message={phase.message}
            primaryAction={{ label: "Back to dashboard", href: "/dashboard" }}
            secondaryAction={{ label: "Upload a document", href: "/upload" }}
          />
        </div>
      )}

      {phase.kind === "ready" && currentQuestion && (
        <>
          <header className="mb-4">
            {/* Visually hidden so the question itself is the page's focal
                point, but present so screen readers announce the move between
                questions — focus lands here on every change. */}
            <h1 ref={headingRef} tabIndex={-1} className="sr-only">
              Question {current + 1} of {questions.length}
            </h1>

            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                Question {current + 1}{" "}
                <span className="text-muted-foreground">of {questions.length}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {answeredIds.size} of {questions.length} answered
              </p>
            </div>

            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={answeredIds.size}
              aria-label="Questions answered"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{
                  width: `${
                    questions.length > 0 ? (answeredIds.size / questions.length) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </header>

          <div className="mb-5 flex justify-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              />
              Skip to next after answering
            </label>
          </div>

          <QuizQuestionDisplay
            key={currentQuestion.id}
            question={currentQuestion}
            index={current}
            total={questions.length}
            answer={answers[currentQuestion.id] ?? ""}
            onAnswer={(a) => handleAnswer(currentQuestion.id, a)}
            autoAdvance={autoAdvance}
            onAdvance={() => setCurrent((i) => Math.min(i + 1, questions.length - 1))}
            nextButtonRef={nextButtonRef}
          />

          {submitError && (
            <div className="mt-4 rounded-lg border border-destructive bg-card p-4">
              <p className="text-sm font-medium">{submitError}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your answers are still here — try submitting again.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
            {isLast ? (
              <Button
                ref={nextButtonRef}
                onClick={handleSubmit}
                disabled={submitting || !allAnswered}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                    Submit quiz
                  </>
                )}
              </Button>
            ) : (
              <Button
                ref={nextButtonRef}
                onClick={() => setCurrent((i) => Math.min(i + 1, questions.length - 1))}
                className="w-full sm:w-auto"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setCurrent((i) => Math.max(i - 1, 0))}
              disabled={current === 0}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Button>

            <div className="sm:ml-auto sm:w-auto">
              <LinkButton
                href="/dashboard"
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                Leave quiz
              </LinkButton>
            </div>
          </div>

          {!allAnswered && (
            <p className="mt-4 text-sm text-muted-foreground">
              {unansweredCount} {unansweredCount === 1 ? "question" : "questions"} left.{" "}
              {unansweredCount === 1
                ? "You can jump back with the Back button."
                : "You can move between questions with the arrows below."}
            </p>
          )}

          {unansweredCount > 0 && (
            <nav aria-label="Jump to question" className="mt-4">
              <ul className="flex flex-wrap gap-2">
                {questions.map((q, i) => {
                  const answered = answeredIds.has(q.id);
                  const isCurrent = i === current;
                  return (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => setCurrent(i)}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`h-9 w-9 rounded-md border text-sm font-medium transition-colors ${
                          isCurrent
                            ? "border-primary bg-primary text-primary-foreground"
                            : answered
                              ? "border-success bg-success-surface text-success"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {i + 1}
                        <span className="sr-only">
                          {answered ? " (answered)" : " (not answered)"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </>
      )}
    </AppShell>
  );
}