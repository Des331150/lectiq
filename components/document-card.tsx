import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types/database";

interface DocumentCardProps {
  document: Document;
  topicCount: number;
  quizCount: number;
}

export function DocumentCard({ document, topicCount, quizCount }: DocumentCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{document.title}</p>
          <p className="text-sm text-muted-foreground">
            {topicCount} topic{topicCount !== 1 ? "s" : ""} &middot; {quizCount} quiz{quizCount !== 1 ? "zes" : ""}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={`/documents/${document.id}/topics`}>
          <Button variant="secondary" size="sm">Topics</Button>
        </Link>
        <Link href={`/documents/${document.id}/quiz/new`}>
          <Button size="sm">Quiz</Button>
        </Link>
      </div>
    </div>
  );
}
