"use client";

import { useState } from "react";
import { ChevronDown, Quote } from "lucide-react";
import type { QuizQuestion, QuizAnswer } from "@/types/database";

export interface ReviewItem {
  question: QuizQuestion;
  answer: QuizAnswer | undefined;
  needsReview: boolean;
}

interface AnswerReviewProps {
  item: ReviewItem;
  /** 1-based position in the original question order. */
  position: number;
  defaultOpen: boolean;
  ordinal: number;
}

function Verdict({ item }: { item: ReviewItem }) {
  const { question, answer } = item;

  if (question.type === "mcq") {
    if (!answer) return <span className="text-muted-foreground">Not answered</span>;
    return answer.is_correct ? (
      <span className="font-medium text-success">Correct</span>
    ) : (
      <span className="font-medium text-destructive">Incorrect</span>
    );
  }

  if (typeof answer?.ai_score !== "number") {
    return <span className="text-muted-foreground">Not graded</span>;
  }
  if (answer.ai_score >= 80) {
    return <span className="font-medium text-success">{answer.ai_score}%</span>;
  }
  if (answer.ai_score >= 60) {
    return <span className="font-medium text-warning">{answer.ai_score}%</span>;
  }
  return <span className="font-medium text-destructive">{answer.ai_score}%</span>;
}

/**
 * One question in the results review: what you picked, what was right, why, and
 * the line of your own document that settles it.
 *
 * The multiple-choice case previously had nothing to show beyond "you picked B,
 * it was A" — quiz_questions stored no explanation, so a wrong answer was a
 * verdict with no reasoning behind it. quiz_questions.explanation (migration
 * 00009) supplies that, and quiz_answers.source_quote supplies the citation.
 *
 * Both are nullable: questions generated before 00009 have no explanation, and
 * the grader treats the citation as best-effort. A missing explanation therefore
 * omits the Why block rather than rendering an empty section, which is why the
 * explanation text is checked before it is rendered at all.
 */
export function AnswerReview({ item, position, defaultOpen }: AnswerReviewProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { question, answer } = item;

  const isMcq = question.type === "mcq" && question.options && question.options.length > 0;
  const chosenLabel = question.type === "mcq" ? answer?.user_answer : undefined;
  const options = question.options ?? [];

  // Map label -> option text so the review can show what the student actually
  // chose, not just its letter. user_answer stores the label for MCQ.
  const chosenText =
    chosenLabel != null
      ? options.find((o) => o.label === chosenLabel)?.text ?? chosenLabel
      : undefined;
  const correctText =
    question.correct_answer != null
      ? options.find((o) => o.label === question.correct_answer)?.text ?? question.correct_answer
      : undefined;

  const hasFreeTextFeedback =
    Boolean(answer?.what_was_right) || Boolean(answer?.what_was_missing);

  const panelId = `answer-review-${question.id}`;

  return (
    <div
      className={`rounded-lg border bg-card ${
        item.needsReview ? "border-destructive/40" : "border-border"
      }`}
    >
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Question {position} ·{" "}
              {question.type === "mcq" ? "Multiple choice" : "Free response"}
            </span>
            <span className="mt-1 block font-medium break-words">
              {question.question_text}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2 pt-0.5">
            <span className="text-sm">
              <Verdict item={item} />
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </span>
        </button>
      </h3>

      {open && (
        <div id={panelId} className="space-y-4 border-t border-border px-4 pb-5 pt-4 sm:px-5">
          {isMcq && question.type === "mcq" && (
            <div>
              {answer?.is_correct ? (
                <p className="rounded-md border border-success bg-success-surface px-3 py-2 text-sm text-success">
                  You chose {chosenText ? `"${chosenText}"` : chosenLabel} — that&apos;s right.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {chosenText && (
                      <div className="rounded-md border border-destructive bg-background px-3 py-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-destructive">
                          Your answer
                        </p>
                        <p className="mt-0.5 text-sm break-words">{chosenText}</p>
                      </div>
                    )}
                    {correctText && (
                      <div className="rounded-md border border-success bg-background px-3 py-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-success">
                          Correct answer
                        </p>
                        <p className="mt-0.5 text-sm break-words">{correctText}</p>
                      </div>
                    )}
                  </div>
                  {question.explanation ? (
                    <div className="mt-3 border-l-[3px] border-destructive pl-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Why
                      </p>
                      <p className="mt-1 text-sm break-words">{question.explanation}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      This question was generated before explanations were stored, so there&apos;s
                      no reasoning attached. Check the topic in your document to review it.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {question.type === "free_response" && (
            <div className="space-y-3">
              {answer?.user_answer && (
                <div className="rounded-md border border-border bg-background px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your answer
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm break-words">
                    {answer.user_answer}
                  </p>
                </div>
              )}

              {question.model_answer && (
                <div className="rounded-md border border-success bg-success-surface px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-success">
                    Model answer
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm break-words">
                    {question.model_answer}
                  </p>
                </div>
              )}

              {hasFreeTextFeedback && (
                <div
                  className={`border-l-[3px] pl-3 ${
                    item.needsReview ? "border-destructive" : "border-success"
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Feedback
                  </p>
                  {answer?.what_was_right && (
                    <p className="mt-1 text-sm break-words">
                      <span className="font-medium text-success">Right: </span>
                      {answer.what_was_right}
                    </p>
                  )}
                  {answer?.what_was_missing && (
                    <p className="mt-1 text-sm break-words">
                      <span className="font-medium text-destructive">Missing: </span>
                      {answer.what_was_missing}
                    </p>
                  )}
                </div>
              )}

              {!hasFreeTextFeedback && answer?.ai_feedback && (
                <div className="border-l-[3px] border-border pl-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Feedback
                  </p>
                  <p className="mt-1 text-sm break-words">{answer.ai_feedback}</p>
                </div>
              )}

              {answer?.ai_feedback === "Grading failed. Please review manually." && (
                <p className="text-sm text-destructive">
                  Grading didn&apos;t complete for this answer, so the score above may not reflect
                  your work. Compare it against the model answer.
                </p>
              )}
            </div>
          )}

          {answer?.source_quote && (
            <div className="rounded-md border border-dashed border-border bg-background px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Quote className="h-3 w-3" aria-hidden="true" />
                From your document
              </p>
              <p className="mt-1 text-sm italic break-words">{answer.source_quote}</p>
            </div>
          )}

          {!answer && (
            <p className="text-sm text-muted-foreground">
              You didn&apos;t answer this question, so it wasn&apos;t graded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}