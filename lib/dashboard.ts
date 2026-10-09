import type { Document } from "@/types/database";
import { TRUNCATION_REASON, type TruncationReason } from "@/lib/ai/limits";

/**
 * Where a document sits relative to the study loop:
 * upload -> topics extracted -> quiz built -> quiz taken.
 *
 * Derived from `documents.status`, the topic count, and `quizzes.status`.
 * Never stored, so it cannot drift out of sync with the underlying rows.
 */
export type DocumentStage = "working" | "not_started" | "ready" | "blocked" | "completed";

/** Rendered top to bottom. `working` leads because it is live activity. */
export const STAGE_ORDER: DocumentStage[] = [
  "working",
  "not_started",
  "ready",
  "blocked",
  "completed",
];

export const STAGE_COPY: Record<DocumentStage, string> = {
  working: "Working on it",
  not_started: "Quiz not started",
  ready: "Ready for a quiz",
  blocked: "Needs attention",
  completed: "Completed",
};

/** What the dashboard promotes to the top: the most nearly-finished work. */
const NEXT_UP_ORDER: DocumentStage[] = ["not_started", "ready", "blocked", "completed"];

export interface QuizLite {
  status: "generating" | "ready" | "completed" | "error";
  score: number | null;
}

export function deriveStage(doc: Document, topicCount: number, quizzes: QuizLite[]): DocumentStage {
  if (doc.status === "processing") return "working";
  // Extraction failed outright (scanned or image-only PDF).
  if (doc.status === "error") return "blocked";
  // Ready, but nothing came out of it - nothing can be studied from this.
  if (topicCount === 0) return "blocked";
  if (quizzes.some((q) => q.status === "generating")) return "working";
  if (quizzes.some((q) => q.status === "error")) return "blocked";
  if (quizzes.some((q) => q.status === "completed")) return "completed";
  if (quizzes.length === 0) return "ready";
  return "not_started";
}

export function workLabel(doc: Document, quizzes: QuizLite[]): string {
  if (doc.status === "processing") return "Extracting topics";
  if (quizzes.some((q) => q.status === "generating")) return "Building quiz";
  return "Working";
}

/**
 * Why a document is blocked. Null when it is not, so the row only spends
 * vertical space on the explanation when there is one to give.
 */
export function blockedReason(
  doc: Document,
  topicCount: number,
  quizzes: QuizLite[]
): string | null {
  if (doc.status === "error") {
    return "We could not read this file. It may be scanned or image-based.";
  }
  if (topicCount === 0) {
    return "No topics were extracted, so there is nothing to quiz yet.";
  }
  if (quizzes.some((q) => q.status === "error")) {
    return "The last quiz failed to generate. Try again, or pick different topics.";
  }
  return null;
}

interface StageAction {
  label: string;
  /** null means the row offers no primary action (transient state). */
  href: string | null;
}

export function stageAction(
  stage: DocumentStage,
  doc: Document,
  topicCount: number,
  quizzes: QuizLite[]
): StageAction {
  switch (stage) {
    case "working":
      return { label: "", href: null };
    case "not_started":
      return { label: "Start quiz", href: `/documents/${doc.id}/quiz/new` };
    case "ready":
      return { label: "Build quiz", href: `/documents/${doc.id}/quiz/new` };
    case "blocked":
      // A failed generation is worth retrying; a failed extraction is not,
      // because the source file itself is the problem.
      return quizzes.some((q) => q.status === "error") && topicCount > 0
        ? { label: "Try again", href: `/documents/${doc.id}/quiz/new` }
        : { label: "Re-upload", href: "/upload" };
    case "completed":
      return { label: "Retake", href: `/documents/${doc.id}/quiz/new` };
  }
}

export function nextUpStage<T extends { stage: DocumentStage }>(items: T[]): T | null {
  for (const stage of NEXT_UP_ORDER) {
    const hit = items.find((i) => i.stage === stage);
    if (hit) return hit;
  }
  return null;
}

export const TRUNCATION_COPY: Record<TruncationReason, string> = {
  [TRUNCATION_REASON.PDF_PAGES_CAPPED]: "Long PDF - only the first pages were analysed.",
  [TRUNCATION_REASON.TOPICS_TRUNCATED]:
    "Large document - some content was skipped during extraction.",
  [TRUNCATION_REASON.DEADLINE_HIT]: "Processing stopped early - some content may be missing.",
};

export function documentWarnings(doc: Document): TruncationReason[] {
  return (doc.processing_warnings ?? []).filter(
    (code): code is TruncationReason =>
      code === TRUNCATION_REASON.PDF_PAGES_CAPPED ||
      code === TRUNCATION_REASON.TOPICS_TRUNCATED ||
      code === TRUNCATION_REASON.DEADLINE_HIT
  );
}

/** Naive but correct English pluralisation for the counts in a row. */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Coarse "time ago" for a row. Computed on the server and passed down: doing it
 * in a client effect forces a cascading render to avoid a hydration mismatch,
 * which is more machinery than a label this approximate deserves.
 */
export function timeAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((now - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.round(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}
