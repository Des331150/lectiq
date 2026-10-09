import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Upload } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardStats } from "@/components/dashboard-stats";
import { DocumentRow } from "@/components/document-row";
import { AppShell } from "@/components/app-shell";
import { getCurrentMonth } from "@/lib/utils";
import { getQuotaLimits } from "@/lib/quota";
import {
  documentWarnings,
  deriveStage,
  nextUpStage,
  plural,
  stageAction,
  STAGE_COPY,
  STAGE_ORDER,
  timeAgo,
  TRUNCATION_COPY,
  type DocumentStage,
  type QuizLite,
} from "@/lib/dashboard";
import type { Document } from "@/types/database";

interface Row {
  document: Document;
  stage: DocumentStage;
  topicCount: number;
  quizzes: QuizLite[];
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const documentIds = (documents ?? []).map((d) => d.id);

  const [{ data: topics }, { data: quizzes }] = await Promise.all([
    supabase.from("topics").select("document_id").in("document_id", documentIds),
    supabase
      .from("quizzes")
      .select("document_id, status, score")
      .in("document_id", documentIds),
  ]);

  const topicCounts = new Map<string, number>();
  topics?.forEach((t) => topicCounts.set(t.document_id, (topicCounts.get(t.document_id) ?? 0) + 1));

  const quizzesByDocument = new Map<string, QuizLite[]>();
  let scored = 0;
  let scoreTotal = 0;
  quizzes?.forEach((q) => {
    const list = quizzesByDocument.get(q.document_id) ?? [];
    list.push({ status: q.status, score: q.score });
    quizzesByDocument.set(q.document_id, list);
    if (typeof q.score === "number") {
      scored += 1;
      scoreTotal += q.score;
    }
  });

  const rows: Row[] = (documents ?? []).map((document) => {
    const docQuizzes = quizzesByDocument.get(document.id) ?? [];
    const topicCount = topicCounts.get(document.id) ?? 0;
    return { document, topicCount, quizzes: docQuizzes, stage: deriveStage(document, topicCount, docQuizzes) };
  });

  const month = getCurrentMonth();
  const { data: usage } = await supabase
    .from("usage_records")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", month)
    .single();

  // Limits come from the database so the displayed cap is the same one the
  // claim_quota function enforces. Documents are counted from this month's usage
  // record rather than the total document list, since the cap is monthly.
  const limits = await getQuotaLimits();
  const documentsUsed = usage?.documents_uploaded ?? 0;

  // A document mid-extraction has nothing to resume yet, so it is never promoted.
  const resumable = rows.filter((r) => r.stage !== "working");
  const resume = nextUpStage(resumable);

  return (
    <AppShell title="Dashboard" email={user.email}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Study queue</h1>
        <Link href="/upload" className="shrink-0">
          <Button>
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Upload document
          </Button>
        </Link>
      </header>

      <div className="mt-4">
        <DashboardStats
          documentsUsed={documentsUsed}
          documentsLimit={limits.document}
          quizzesUsed={usage?.quizzes_used ?? 0}
          quizzesLimit={limits.quiz}
          averageScore={scored > 0 ? scoreTotal / scored : null}
          topicsExtracted={topics?.length ?? 0}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {resume && <ResumeCard row={resume} />}

          <div className="mt-8 space-y-8">
            {STAGE_ORDER.map((stage) => {
              const group = rows.filter(
                (r) => r.stage === stage && r.document.id !== resume?.document.id
              );
              if (group.length === 0) return null;
              return (
                <section key={stage}>
                  <div className="mb-2 flex items-baseline gap-2">
                    <h2 className="text-sm font-semibold tracking-tight">{STAGE_COPY[stage]}</h2>
                    <span className="tabular-nums text-xs text-muted-foreground">{group.length}</span>
                  </div>
                  <ul className="divide-y divide-border border-y border-border">
                    {group.map((row) => (
                      <DocumentRow
                        key={row.document.id}
                        document={row.document}
                        stage={row.stage}
                        topicCount={row.topicCount}
                        quizzes={row.quizzes}
                        relativeTime={timeAgo(row.document.created_at)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}

/**
 * The single most nearly-finished thing, promoted so the page answers "what do
 * I do next?" before anything else. Its own group is suppressed below, because
 * offering the same action twice on one screen is what makes a hero card go
 * stale.
 */
function ResumeCard({ row }: { row: Row }) {
  const { document, topicCount, quizzes, stage } = row;
  const action = stageAction(stage, document, topicCount, quizzes);
  const warnings = documentWarnings(document);

  return (
    <Card className="mt-6">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-[1.05rem] font-semibold leading-tight tracking-tight">
              {document.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="tabular-nums">{plural(topicCount, "topic", "topics")}</span>
              {" \u00b7 "}
              <span className="tabular-nums">{plural(quizzes.length, "quiz", "quizzes")}</span>
            </p>
            {warnings.map((code) => (
              <p key={code} className="mt-1.5 text-xs text-muted-foreground">
                {TRUNCATION_COPY[code]}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {action.href && (
            <Link href={action.href}>
              <Button size="sm" className="min-h-[44px]">
                {action.label}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          )}
          <Link href={`/documents/${document.id}/topics`}>
            <Button size="sm" variant="outline" className="min-h-[44px]">
              Review topics
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

/**
 * An empty dashboard is a first-run teaching moment, not a dead end. It names
 * the two file types the product accepts and the one sentence that explains why
 * it is worth uploading.
 */
function EmptyState() {
  return (
    <div className="mt-10 border border-border bg-card px-6 py-14 text-center">
      <h2 className="text-lg font-semibold tracking-tight">Nothing uploaded yet</h2>
      <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        Upload a lecture PDF or PowerPoint and Lectiq pulls the topics out for you, then
        builds a quiz from the ones you pick.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Upload your first document
          </Button>
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">PDF and PowerPoint &middot; nothing is shared with anyone</p>
    </div>
  );
}
