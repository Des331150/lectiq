"use client";

import { Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDocument } from "@/app/dashboard/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Document } from "@/types/database";
import { TRUNCATION_REASON, type TruncationReason } from "@/lib/ai/limits";

const TRUNCATION_MESSAGES: Record<TruncationReason, string> = {
  [TRUNCATION_REASON.PDF_PAGES_CAPPED]: "PDF was long; only the first pages were analyzed.",
  [TRUNCATION_REASON.TOPICS_TRUNCATED]: "Document was large; some content may have been skipped during topic extraction.",
  [TRUNCATION_REASON.DEADLINE_HIT]: "Processing stopped early; some content may be missing.",
};

interface DocumentCardProps {
  document: Document;
  topicCount: number;
  quizCount: number;
}

export function DocumentCard({ document, topicCount, quizCount }: DocumentCardProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this document and all its quizzes?")) return;
    const result = await deleteDocument(document.id);
    if (result.success) router.refresh();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border bg-card p-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{document.title}</p>
          {document.processing_warnings?.map((code) => (
            <p key={code} className="text-xs text-amber-600 dark:text-amber-400">
              {TRUNCATION_MESSAGES[code as TruncationReason] ?? code}
            </p>
          ))}
          <p className="text-xs text-muted-foreground">
            {topicCount} topic{topicCount !== 1 ? "s" : ""} &middot; {quizCount} quiz{quizCount !== 1 ? "zes" : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
        <Link href={`/documents/${document.id}/topics`}>
          <Button variant="outline" size="sm">Topics</Button>
        </Link>
        <Link href={`/documents/${document.id}/quiz/new`}>
          <Button size="sm">Quiz</Button>
        </Link>
        <button
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md"
          title="Delete document"
          aria-label="Delete document"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
