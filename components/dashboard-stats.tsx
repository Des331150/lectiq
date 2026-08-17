interface DashboardStatsProps {
  documentsUsed: number;
  documentsLimit: number;
  quizzesUsed: number;
  quizzesLimit: number;
  averageScore: number | null;
  topicsExtracted: number;
}

export function DashboardStats({
  documentsUsed,
  documentsLimit,
  quizzesUsed,
  quizzesLimit,
  averageScore,
  topicsExtracted,
}: DashboardStatsProps) {
  const quizPct = Math.min((quizzesUsed / quizzesLimit) * 100, 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-[1px] text-muted-foreground mb-0.5">Documents</p>
        <p className="text-[28px] font-bold text-primary">
          {documentsUsed}
          <span className="text-base font-normal text-muted-foreground"> / {documentsLimit}</span>
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-[1px] text-muted-foreground mb-0.5">Quizzes Taken</p>
        <p className="text-[28px] font-bold text-primary">
          {quizzesUsed}
          <span className="text-base font-normal text-muted-foreground"> / {quizzesLimit}</span>
        </p>
        <div className="w-full h-1 bg-muted rounded-full mt-1.5">
          <div className="h-full bg-accent rounded-full" style={{ width: `${quizPct}%` }} />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-[1px] text-muted-foreground mb-0.5">Avg Score</p>
        <p className="text-[28px] font-bold text-primary">
          {averageScore !== null ? `${Math.round(averageScore)}%` : "\u2014"}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-[1px] text-muted-foreground mb-0.5">Topics Extracted</p>
        <p className="text-[28px] font-bold text-primary">{topicsExtracted}</p>
      </div>
    </div>
  );
}
