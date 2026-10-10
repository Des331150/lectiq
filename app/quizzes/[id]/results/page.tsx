"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { QuizResultsSummary } from "@/components/quiz-results";
import { AnswerReview } from "@/components/answer-review";
import { AppShell } from "@/components/app-shell";
import { QuizDeadEnd } from "@/components/quiz-dead-end";
import { LinkButton } from "@/components/ui/link-button";
import { createClient } from "@/lib/supabase/client";
import type { Quiz, QuizQuestion, QuizAnswer } from "@/types/database";

type Filter = "review" | "all" | "correct";

const FILTERS: { id: Filter; label: (count: number | null) => string }[] = [
  { id: "review", label: (n) => (n === null ? "Needs review" : `Needs review · ${n}`) },
  { id: "all", label: () => "All" },
  { id: "correct", label: () => "Correct only" },
];

/** A free-response answer scoring below this counts as needing review. */
const WEAK_SCORE = 60;

type ReviewItem = {
  question: QuizQuestion;
  answer: QuizAnswer | undefined;
  needsReview: boolean;
};

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [filter, setFilter] = useState<Filter>("review");
  const [deadEnd, setDeadEnd] = useState<{ title: string; message: string } | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(id: string) {
      const supabase = createClient();
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", id).single();

      if (cancelled) return;
      if (!q) {
        setDeadEnd({
          title: "We couldn't find that quiz",
          message: "It may have been removed, or the link may be wrong.",
        });
        setLoading(false);
        return;
      }
      if (q.status !== "completed") {
        setDeadEnd({
          title: "Results aren't available yet",
          message:
            q.status === "generating"
              ? "This quiz is still being built. Results appear once you submit your answers."
              : "This quiz hasn't been submitted yet.",
        });
        setLoading(false);
        return;
      }

      setQuiz(q);
      const { data: qs } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", id)
        .order("position");
      const rows = qs ?? [];

      const questionIds = rows.map((row) => row.id);
      const { data: ans } = questionIds.length
        ? await supabase.from("quiz_answers").select("*").in("question_id", questionIds)
        : { data: [] };

      if (cancelled) return;
      setQuestions(rows);
      setAnswers(ans ?? []);
      setLoading(false);
    }

    params.then((p) => {
      setQuizId(p.id);
      load(p.id);
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  const answersByQuestion = useMemo(() => {
    const map = new Map<string, QuizAnswer>();
    answers.forEach((a) => map.set(a.question_id, a));
    return map;
  }, [answers]);

  const reviewItems: ReviewItem[] = useMemo(() => {
    return questions.map((question) => {
      const answer = answersByQuestion.get(question.id);
      const needsReview =
        question.type === "mcq"
          ? answer?.is_correct === false
          : typeof answer?.ai_score === "number" && answer.ai_score < WEAK_SCORE;
      return { question, answer, needsReview };
    });
  }, [questions, answersByQuestion]);

  const reviewCount = reviewItems.filter((item) => item.needsReview).length;

  const visible = useMemo(() => {
    const base =
      filter === "review"
        ? reviewItems.filter((item) => item.needsReview)
        : filter === "correct"
          ? reviewItems.filter((item) => !item.needsReview)
          : reviewItems;
    // Wrong answers first under the "needs review" filter — the whole point of
    // that default is that the top of the page is where the learning happens.
    return [...base].sort((a, b) => Number(b.needsReview) - Number(a.needsReview));
  }, [filter, reviewItems]);

  const mcqItems = reviewItems.filter((item) => item.question.type === "mcq");
  const mcqCorrect = mcqItems.filter((item) => item.answer?.is_correct).length;
  const frItems = reviewItems.filter((item) => item.question.type === "free_response");
  const frScored = frItems.filter((item) => typeof item.answer?.ai_score === "number");
  const frAverage =
    frScored.length > 0
      ? Math.round(
          frScored.reduce((total, item) => total + (item.answer?.ai_score ?? 0), 0) /
            frScored.length
        )
      : null;

  return (
    <AppShell title="Results">
      {loading && (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Loading results</span>
        </div>
      )}

      {!loading && deadEnd && (
        <div className="py-4">
          <QuizDeadEnd
            title={deadEnd.title}
            message={deadEnd.message}
            primaryAction={{ label: "Back to dashboard", href: "/dashboard" }}
            secondaryAction={{ label: "Upload a document", href: "/upload" }}
          />
        </div>
      )}

      {!loading && !deadEnd && quiz && (
        <>
          <QuizResultsSummary
            score={quiz.score ?? 0}
            totalQuestions={questions.length}
            mcqCorrect={mcqCorrect}
            mcqTotal={mcqItems.length}
            frAverage={frAverage}
            needsReview={reviewCount}
          />

          <div className="mt-8" role="group" aria-label="Filter questions">
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={filter === f.id}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    filter === f.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-card-foreground hover:bg-muted"
                  }`}
                >
                  {f.label(f.id === "review" ? reviewCount : null)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {visible.length === 0 && (
              <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
                {filter === "review"
                  ? "Nothing to review — you got everything right."
                  : "No questions match this filter."}
              </p>
            )}
            {visible.map((item, index) => (
              <AnswerReview
                key={item.question.id}
                item={item}
                position={
                  questions.findIndex((q) => q.id === item.question.id) + 1
                }
                // Under "needs review" every card is expanded by default, so an
                // explanation can't be missed behind a collapsed row.
                defaultOpen={filter === "review"}
                ordinal={index}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/dashboard" variant="outline" className="w-full sm:w-auto">
              Back to dashboard
            </LinkButton>
            {quiz.document_id && (
              <LinkButton
                href={`/documents/${quiz.document_id}/topics`}
                className="w-full sm:w-auto"
              >
                Take another quiz
              </LinkButton>
            )}
          </div>

          {quizId && (
            <p className="mt-6 text-sm text-muted-foreground">
              Scoring is generated — treat the feedback as a study aid, not a verdict.
            </p>
          )}
        </>
      )}
    </AppShell>
  );
}