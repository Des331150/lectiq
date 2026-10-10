/**
 * Canonical display names for quiz formats.
 *
 * Three screens were formatting this enum independently and all three got it
 * wrong in a different way: the topic selector's select trigger showed the raw
 * value "mcq" because SelectValue fell back to `value` when no children were
 * passed, the quiz confirmation page rendered "free response" via a string
 * replace, and the history page rendered "Mcq" via CSS capitalize. One table,
 * so the next screen cannot invent a fourth spelling.
 */
export const QUIZ_FORMATS = ["mcq", "free_response", "both"] as const;

export type QuizFormat = (typeof QUIZ_FORMATS)[number];

interface FormatMeta {
  label: string;
  description: string;
}

export const QUIZ_FORMAT_META: Record<QuizFormat, FormatMeta> = {
  mcq: {
    label: "Multiple choice",
    description: "Pick one of four options per question. Fastest to mark.",
  },
  free_response: {
    label: "Free response",
    description: "Write an answer in your own words. Marked by AI against your document.",
  },
  both: {
    label: "Mixed",
    description: "A blend of multiple choice and free response questions.",
  },
};

export function isQuizFormat(value: unknown): value is QuizFormat {
  return (
    typeof value === "string" &&
    (QUIZ_FORMATS as readonly string[]).includes(value)
  );
}

export function formatLabel(format: QuizFormat): string {
  return QUIZ_FORMAT_META[format].label;
}