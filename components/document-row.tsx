"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDocument } from "@/app/dashboard/actions";
import type { Document } from "@/types/database";
import {
  blockedReason,
  documentWarnings,
  plural,
  stageAction,
  TRUNCATION_COPY,
  workLabel,
  type DocumentStage,
  type QuizLite,
} from "@/lib/dashboard";

export interface DocumentRowProps {
  document: Document;
  stage: DocumentStage;
  topicCount: number;
  quizzes: QuizLite[];
  /** Precomputed on the server so the label cannot drift under hydration. */
  relativeTime: string;
  /** The resume card shows no delete affordance. */
  showDelete?: boolean;
}

export function DocumentRow({
  document,
  stage,
  topicCount,
  quizzes,
  relativeTime,
  showDelete = true,
}: DocumentRowProps) {
  const action = stageAction(stage, document, topicCount, quizzes);
  const reason = stage === "blocked" ? blockedReason(document, topicCount, quizzes) : null;
  const warnings = documentWarnings(document);

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <Link
          href={`/documents/${document.id}/topics`}
          className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
        >
          {document.title}
        </Link>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {stage === "working" ? (
            <span className="inline-flex items-center gap-1.5">
              <LoaderCircle className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              {workLabel(document, quizzes)}
            </span>
          ) : stage === "blocked" && reason ? (
            reason
          ) : (
            <>
              <span className="tabular-nums">{plural(topicCount, "topic", "topics")}</span>
              {" \u00b7 "}
              <span className="tabular-nums">{plural(quizzes.length, "quiz", "quizzes")}</span>
              {" \u00b7 "}
              {relativeTime}
            </>
          )}
        </p>

        {warnings.map((code) => (
          <p key={code} className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span>{TRUNCATION_COPY[code]}</span>
          </p>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {stage !== "blocked" && (
          <Link href={`/documents/${document.id}/topics`}>
            <Button size="sm" variant="ghost" className="min-h-[44px]">
              Topics
            </Button>
          </Link>
        )}
        {action.href && (
          <Link href={action.href}>
            <Button
              size="sm"
              variant={stage === "not_started" ? "default" : "outline"}
              className="min-h-[44px]"
            >
              {action.label}
            </Button>
          </Link>
        )}
        {showDelete && <DeleteButton document={document} />}
      </div>
    </li>
  );
}


/**
 * Two-step inline confirmation.
 *
 * This replaces a native window.confirm(), which blocks the whole page and
 * cannot be styled - so it read as a browser dialog dropped into a warm
 * academic interface. Arming auto-disarms so a stray click cannot leave a
 * live "Delete?" sitting on the row indefinitely.
 */
function DeleteButton({ document }: { document: Document }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);

  const confirm = async () => {
    setPending(true);
    setError(null);
    const result = await deleteDocument(document.id);
    if (result.success) {
      router.refresh();
      return;
    }
    setPending(false);
    setArmed(false);
    setError(result.error ?? "Could not delete this document.");
  };

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={`Delete ${document.title}`}
        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs" role="group" aria-label={`Confirm delete ${document.title}`}>
      {error ? (
        <span className="text-destructive">{error}</span>
      ) : (
        <>
          <span className="text-muted-foreground">Delete?</span>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            // foreground, not destructive: text-destructive measures 3.96:1 on
            // this background, under the 4.5:1 needed at this size. The
            // "Delete?" prompt and the auto-disarm carry the danger instead.
            className="font-medium text-foreground disabled:opacity-60"
          >
            {pending ? "Deleting..." : "Yes"}
          </button>
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            No
          </button>
        </>
      )}
    </span>
  );
}
