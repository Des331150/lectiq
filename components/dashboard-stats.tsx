import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  documentsUsed: number;
  documentsLimit: number;
  quizzesUsed: number;
  quizzesLimit: number;
  averageScore: number | null;
  topicsExtracted: number;
}

/**
 * Monthly usage as a quiet ruled strip rather than a grid of stat tiles.
 *
 * The old four tiles gave equal weight to quota counters and to numbers the
 * student cannot act on. Two of them were the hero-metric template - big
 * number, small label - which says nothing about what to do next. These are
 * constraints on the month, so they read as constraints.
 */
export function DashboardStats({
  documentsUsed,
  documentsLimit,
  quizzesUsed,
  quizzesLimit,
  averageScore,
  topicsExtracted,
}: DashboardStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-5">
      <Meter label="Documents" used={documentsUsed} limit={documentsLimit} />
      <Meter label="Quizzes" used={quizzesUsed} limit={quizzesLimit} />
      <span className="text-xs text-muted-foreground">
        <span className="tabular-nums">{topicsExtracted}</span> topics extracted &middot;{" "}
        <span className="tabular-nums">
          {averageScore !== null ? `${Math.round(averageScore)}% avg score` : "no scores yet"}
        </span>
      </span>
    </div>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  // Near the cap the month is about to stop, so the bar says so.
  const nearLimit = limit > 0 && used / limit >= 0.8;

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 w-20 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className={cn("h-full rounded-full", nearLimit ? "bg-destructive" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums text-xs text-muted-foreground">
        {label} {used}/{limit}
      </span>
    </div>
  );
}
