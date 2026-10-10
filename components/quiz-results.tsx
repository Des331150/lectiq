interface QuizResultsSummaryProps {
  score: number;
  totalQuestions: number;
  mcqCorrect: number;
  mcqTotal: number;
  frAverage: number | null;
  needsReview: number;
}

/**
 * Thresholds for the score headline. Below 60 the student has a real gap to
 * close, so the number is not dressed up in a warm colour.
 */
function scoreTone(score: number) {
  if (score >= 80) return { text: "text-success", surface: "bg-success-surface", label: "Strong" };
  if (score >= 60) return { text: "text-warning", surface: "bg-warning-surface", label: "Passable" };
  return { text: "text-destructive", surface: "bg-destructive/10", label: "Needs work" };
}

export function QuizResultsSummary({
  score,
  totalQuestions,
  mcqCorrect,
  mcqTotal,
  frAverage,
  needsReview,
}: QuizResultsSummaryProps) {
  const tone = scoreTone(score);

  return (
    <section aria-label="Quiz score">
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Your score
        </p>
        <p className={`mt-1 text-5xl font-bold tracking-tight ${tone.text}`}>
          {Math.round(score)}%
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalQuestions} {totalQuestions === 1 ? "question" : "questions"} · {tone.label}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {mcqTotal > 0 && (
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Multiple choice
              </p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">
                {mcqCorrect}/{mcqTotal}
              </p>
            </div>
          )}
          {frAverage !== null && (
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Free response
              </p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">{Math.round(frAverage)}%</p>
            </div>
          )}
          <div className={`rounded-lg border border-border p-4 ${tone.surface}`}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Needs review
            </p>
            <p className={`mt-0.5 text-2xl font-bold tracking-tight ${needsReview > 0 ? tone.text : ""}`}>
              {needsReview}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}