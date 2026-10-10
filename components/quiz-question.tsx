"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { QuizQuestion } from "@/types/database";

interface QuizQuestionProps {
  question: QuizQuestion;
  index: number;
  total: number;
  answer: string;
  onAnswer: (answer: string) => void;
  /** Whether selecting an option should advance to the next question. */
  autoAdvance: boolean;
  onAdvance: () => void;
  /**
   * The runner's Next button, so a selection can move focus onto it. Without
   * this, a keyboard user who answers with the arrow keys is left focused on a
   * radio they can still change, with no cue about how to move on.
   */
  nextButtonRef: RefObject<HTMLButtonElement | null>;
}

const TYPE_LABEL: Record<QuizQuestion["type"], string> = {
  mcq: "Multiple choice",
  free_response: "Free response",
};

/**
 * One question, fully operable by keyboard.
 *
 * This previously rendered each option as a `<div onClick>` with no role, no
 * tabIndex and no key handler. There is no other focusable element inside an
 * option, so a keyboard or screen-reader user could not answer a multiple-choice
 * question at all — the app's core interaction was unreachable without a mouse.
 *
 * The options are now a real radio group: Tab moves into the group, the arrow
 * keys move between options and select as they go (native radiogroup
 * behaviour), and the number keys 1-9 select directly. On selecting by mouse or
 * arrow key, focus moves to the Next button so a keyboard user is never left
 * focused on a control that has nothing left to do.
 */
export function QuizQuestionDisplay({
  question,
  index,
  total,
  answer,
  onAnswer,
  autoAdvance,
  onAdvance,
  nextButtonRef,
}: QuizQuestionProps) {
  const shouldFocusNext = useRef(false);

  const isMcq = question.type === "mcq" && question.options && question.options.length > 0;

  // Moving focus to Next is correct for a click or arrow-key selection, but
  // wrong for a number-key selection on the last question, where the user
  // probably wants to read the feedback before continuing.
  useEffect(() => {
    if (!shouldFocusNext.current) return;
    shouldFocusNext.current = false;
    if (autoAdvance && index < total - 1) {
      onAdvance();
      return;
    }
    nextButtonRef.current?.focus();
  }, [autoAdvance, index, total, onAdvance, nextButtonRef]);

  const handleSelect = (label: string) => {
    onAnswer(label);
    shouldFocusNext.current = true;
  };

  return (
    <div className="rounded-lg border bg-card p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Question {index + 1} of {total}
        </p>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {TYPE_LABEL[question.type]}
        </p>
      </div>

      <h2 className="mb-5 text-lg font-semibold leading-snug tracking-tight break-words">
        {question.question_text}
      </h2>

      {isMcq ? (
        <div
          role="radiogroup"
          aria-label={`Options for question ${index + 1}`}
          className="space-y-2"
          onKeyDown={(event) => {
            const option = question.options ?? [];
            // 1-9 selects an option directly. Guard against modifier combos so
            // Ctrl+3 and friends don't hijack the browser shortcut.
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const digit = Number(event.key);
            if (Number.isInteger(digit) && digit >= 1 && digit <= Math.min(9, option.length)) {
              event.preventDefault();
              handleSelect(option[digit - 1].label);
            }
          }}
        >
          {(question.options ?? []).map((opt, i) => {
            const selected = answer === opt.label;
            return (
              <label
                key={opt.label}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={opt.label}
                  checked={selected}
                  onChange={() => handleSelect(opt.label)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="min-w-0 flex-1 pt-1 break-words">{opt.text}</span>
                {i < 9 && (
                  <kbd
                    aria-hidden="true"
                    className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block"
                  >
                    {i + 1}
                  </kbd>
                )}
              </label>
            );
          })}
        </div>
      ) : (
        <div>
          <label htmlFor={`answer-${question.id}`} className="sr-only">
            Your answer to question {index + 1}
          </label>
          <Textarea
            id={`answer-${question.id}`}
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            rows={6}
          />
        </div>
      )}

      {/* The runner owns Next; this component only receives its ref so a
          selection can move focus onto it. */}
    </div>
  );
}