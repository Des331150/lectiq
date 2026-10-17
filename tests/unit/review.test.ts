import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { needsReview, buildReviewItems, WEAK_SCORE } from "../../lib/review.ts";
import type { QuizQuestion, QuizAnswer } from "../../types/database.ts";

const mcq = (id: string): QuizQuestion => ({
  id,
  quiz_id: "quiz",
  type: "mcq",
  question_text: "Which molecule carries electrons?",
  options: [
    { label: "A", text: "Ubiquinone" },
    { label: "B", text: "Cytochrome c" },
  ],
  correct_answer: "A",
  model_answer: null,
  explanation: null,
  topic_id: "t",
  position: 0,
});

const freeResponse = (id: string): QuizQuestion => ({
  ...mcq(id),
  type: "free_response",
  options: null,
  correct_answer: null,
  model_answer: "An answer",
});

const answer = (
  questionId: string,
  over: Partial<QuizAnswer> = {}
): QuizAnswer => ({
  id: `a-${questionId}`,
  question_id: questionId,
  user_answer: "something",
  is_correct: null,
  ai_score: null,
  ai_feedback: null,
  source_quote: null,
  what_was_right: null,
  what_was_missing: null,
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

/**
 * The threshold used to be 60, which filed a 68% answer under "correct" and
 * never surfaced it. It lived inline in the results page, so nothing could
 * reach it.
 */
describe("WEAK_SCORE", () => {
  test("sits above the midpoint so the filter means something", () => {
    assert.ok(WEAK_SCORE > 50, "a threshold at or below 50 makes the review list meaningless");
  });

  test("catches a thin answer that the old threshold missed", () => {
    // The specific regression: 68% was filed under correct at 60.
    assert.equal(
      needsReview(freeResponse("q1"), answer("q1", { ai_score: 68 })),
      true,
      "a 68% answer must be flagged for review"
    );
  });

  test("does not flag a strong answer", () => {
    assert.equal(needsReview(freeResponse("q1"), answer("q1", { ai_score: 85 })), false);
  });

  test("flags the boundary itself", () => {
    assert.equal(needsReview(freeResponse("q1"), answer("q1", { ai_score: WEAK_SCORE })), false);
    assert.equal(needsReview(freeResponse("q1"), answer("q1", { ai_score: WEAK_SCORE - 1 })), true);
  });
});

describe("needsReview", () => {
  test("flags an incorrect multiple choice answer", () => {
    assert.equal(needsReview(mcq("q1"), answer("q1", { is_correct: false })), true);
  });

  test("does not flag a correct multiple choice answer", () => {
    assert.equal(needsReview(mcq("q1"), answer("q1", { is_correct: true })), false);
  });

  test("does not count an unanswered question", () => {
    // There is nothing to review, and counting it inflates the summary.
    assert.equal(needsReview(mcq("q1"), undefined), false);
    assert.equal(needsReview(freeResponse("q1"), undefined), false);
  });

  test("does not flag an ungraded free response answer", () => {
    assert.equal(needsReview(freeResponse("q1"), answer("q1", { ai_score: null })), false);
  });

  test("ignores an ai_score on a multiple choice question", () => {
    // A grading score must not decide whether a right-or-wrong answer needs review.
    assert.equal(needsReview(mcq("q1"), answer("q1", { is_correct: true, ai_score: 20 })), false);
  });
});

describe("buildReviewItems", () => {
  test("pairs each question with its own answer", () => {
    const questions = [mcq("q1"), mcq("q2")];
    const answers = [answer("q1", { is_correct: true }), answer("q2", { is_correct: false })];

    const items = buildReviewItems(questions, answers);
    assert.equal(items.length, 2);
    assert.equal(items[0].answer?.question_id, "q1");
    assert.equal(items[1].answer?.question_id, "q2");
  });

  test("counts only the answers that need review", () => {
    const questions = [mcq("q1"), mcq("q2"), freeResponse("q3"), freeResponse("q4")];
    const answers = [
      answer("q1", { is_correct: true }),
      answer("q2", { is_correct: false }),
      answer("q3", { ai_score: 40 }),
      answer("q4", { ai_score: 95 }),
    ];

    const items = buildReviewItems(questions, answers);
    assert.equal(items.filter((i) => i.needsReview).length, 2);
  });

  test("preserves question order regardless of answer order", () => {
    const questions = [mcq("q1"), mcq("q2"), mcq("q3")];
    const answers = [answer("q3"), answer("q1"), answer("q2")];
    const items = buildReviewItems(questions, answers);
    assert.deepEqual(items.map((i) => i.question.id), ["q1", "q2", "q3"]);
  });

  test("handles a question with no answer row", () => {
    const items = buildReviewItems([mcq("q1"), mcq("q2")], [answer("q1", { is_correct: false })]);
    assert.equal(items[1].answer, undefined);
    assert.equal(items[1].needsReview, false);
  });
});