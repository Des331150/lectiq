"use client";

import { Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDocument } from "@/app/dashboard/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Document } from "@/types/database";

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
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{document.title}</p>
          <p className="text-xs text-muted-foreground">
            {topicCount} topic{topicCount !== 1 ? "s" : ""} &middot; {quizCount} quiz{quizCount !== 1 ? "zes" : ""}
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <Link href={`/documents/${document.id}/topics`}>
          <Button variant="outline" size="sm" className="text-xs h-7 px-3">Topics</Button>
        </Link>
        <Link href={`/documents/${document.id}/quiz/new`}>
          <Button size="sm" className="text-xs h-7 px-3">Quiz</Button>
        </Link>
        <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Delete document">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
