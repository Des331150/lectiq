/**
 * Re-exported for compatibility.
 *
 * The quiz format enum, its display names and its guard now live in
 * lib/quiz-formats.ts, because three screens were each formatting the same
 * three values differently and none of them agreed. This file previously held
 * an unused duplicate of the union type.
 */
export { QUIZ_FORMATS, QUIZ_FORMAT_META, formatLabel, isQuizFormat } from "@/lib/quiz-formats";
export type { QuizFormat } from "@/lib/quiz-formats";

export interface TopicSelection {
  id: string;
  title: string;
  selected: boolean;
}

export interface McqOption {
  label: string;
  text: string;
}

export interface GeneratedQuestion {
  type: "mcq" | "free_response";
  question_text: string;
  options?: McqOption[];
  correct_answer?: string;
  model_answer?: string;
  topic_id: string;
}