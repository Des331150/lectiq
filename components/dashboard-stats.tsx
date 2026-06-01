interface DashboardStatsProps {
  documentsUsed: number;
  documentsLimit: number;
  quizzesUsed: number;
  quizzesLimit: number;
  averageScore: number | null;
  isPro: boolean;
}

export function DashboardStats({
  documentsUsed,
  documentsLimit,
  quizzesUsed,
  quizzesLimit,
  averageScore,
  isPro,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Documents</p>
        <p className="text-2xl font-bold">
          {documentsUsed}
          {!isPro && <span className="text-base font-normal text-muted-foreground"> / {documentsLimit}</span>}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Quizzes This Month</p>
        <p className="text-2xl font-bold">
          {quizzesUsed}
          {!isPro && <span className="text-base font-normal text-muted-foreground"> / {quizzesLimit}</span>}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Average Score</p>
        <p className="text-2xl font-bold">
          {averageScore !== null ? `${Math.round(averageScore)}%` : "\u2014"}
        </p>
      </div>
    </div>
  );
}
