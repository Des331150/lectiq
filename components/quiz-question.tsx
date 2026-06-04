"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { QuizQuestion } from "@/types/database";

interface QuizQuestionProps {
  question: QuizQuestion;
  index: number;
  answer: string;
  onAnswer: (answer: string) => void;
}

export function QuizQuestionDisplay({ question, index, answer, onAnswer }: QuizQuestionProps) {
  return (
    <div className="rounded-lg border p-6 mb-4">
      <p className="text-sm text-muted-foreground mb-1">
        Question {index + 1}
        <span className="ml-2 uppercase text-xs font-medium">
          {question.type === "mcq" ? "Multiple Choice" : "Free Response"}
        </span>
      </p>
      <p className="text-lg font-medium mb-4">{question.question_text}</p>

      {question.type === "mcq" && question.options && question.options.length > 0 ? (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <div
              key={opt.label}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                answer === opt.label
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => onAnswer(opt.label)}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  answer === opt.label
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.label}
              </div>
              <p>{opt.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <Textarea
          placeholder="Type your answer here..."
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          rows={4}
        />
      )}
    </div>
  );
}
