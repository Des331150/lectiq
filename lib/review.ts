import type { QuizAnswer, QuizQuestion } from "@/types/database";

/**
 * A free-response answer scoring below this counts as needing review.
 *
 * Set at 70 rather than 60 because the review list is meant to be short and
 * actionable. At 60 an answer the model rated 68% was filed under "correct"
 * and never surfaced, which is the opposite of what the filter is for. That
 * value lived inline in the results page, so it was not reachable from a test
 * and nothing caught it.
 */
export const WEAK_SCORE = 70;

export interface ReviewItem {
  question: QuizQuestion;
  answer: QuizAnswer | undefined;
  needsReview: boolean;
}

/**
 * Whether one question belongs in the "needs review" list.
 *
 * Multiple choice is a right-or-wrong comparison against stored data, so any
 * incorrect answer qualifies. Free response is graded on a curve, and the
 * threshold has to sit above the midpoint or the filter is pointless.
 *
 * An unanswered question does not count: there is nothing to review, and
 * counting it would inflate the count the results summary shows.
 */
export function needsReview(
  question: Pick<QuizQuestion, "type">,
  answer: Pick<QuizAnswer, "is_correct" | "ai_score"> | undefined
): boolean {
  if (!answer) return false;
  if (question.type === "mcq") return answer.is_correct === false;
  return typeof answer.ai_score === "number" && answer.ai_score < WEAK_SCORE;
}

/** Builds the review list from questions and their answers, in question order. */
export function buildReviewItems(
  questions: QuizQuestion[],
  answers: QuizAnswer[]
): ReviewItem[] {
  const byQuestion = new Map(answers.map((a) => [a.question_id, a]));
  return questions.map((question) => {
    const answer = byQuestion.get(question.id);
    return { question, answer, needsReview: needsReview(question, answer) };
  });
}