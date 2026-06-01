interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  correctMcq: number;
  totalMcq: number;
  averageFrScore: number | null;
}

export function QuizResults({
  score,
  totalQuestions,
  correctMcq,
  totalMcq,
  averageFrScore,
}: QuizResultsProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-600";
    if (s >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground mb-2">Your Score</p>
      <p className={`text-5xl font-bold mb-2 ${getScoreColor(score)}`}>
        {Math.round(score)}%
      </p>
      <p className="text-muted-foreground mb-8">
        {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        {totalMcq > 0 && (
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Multiple Choice
            </p>
            <p className="text-2xl font-bold">
              {correctMcq}/{totalMcq}
            </p>
          </div>
        )}
        {averageFrScore !== null && (
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Free Response
            </p>
            <p className="text-2xl font-bold">{Math.round(averageFrScore)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
