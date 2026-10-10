"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { QUIZ_FORMATS, QUIZ_FORMAT_META, type QuizFormat } from "@/lib/quiz-formats";
import type { Topic } from "@/types/database";

interface TopicSelectorProps {
  topics: Topic[];
  documentId: string;
}

/**
 * Mirrors MAX_TOPIC_IDS in app/api/quiz/generate/route.ts. The server rejects
 * anything larger, so selecting more here produced a guaranteed failure after
 * the user had already chosen their topics.
 */
const MAX_TOPICS = 100;

export function TopicSelector({ topics, documentId }: TopicSelectorProps) {
  const router = useRouter();
  const listId = useId();

  // Previously every topic was preselected, so any document with more than 100
  // topics opened in a state the server would refuse.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(topics.slice(0, MAX_TOPICS).map((t) => t.id))
  );
  const [format, setFormat] = useState<QuizFormat>("mcq");

  const atCap = selected.size >= MAX_TOPICS;

  const toggleTopic = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Silently ignoring a click past the cap reads as a broken control, so
        // the checkbox is disabled instead and the reason is shown in the row.
        if (next.size >= MAX_TOPICS) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () =>
    setSelected(new Set(topics.slice(0, MAX_TOPICS).map((t) => t.id)));
  const deselectAll = () => setSelected(new Set());

  const handleGenerate = () => {
    const params = new URLSearchParams();
    params.set("topics", Array.from(selected).join(","));
    params.set("format", format);
    router.push(`/documents/${documentId}/quiz/new?${params.toString()}`);
  };

  const meta = QUIZ_FORMAT_META[format];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select all
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Deselect all
          </Button>
        </div>
        {/* The label and hint sit inside the control's own column, so the
            buttons stay aligned with the top of the select rather than being
            stretched against a full-width flex row. */}
        <div className="w-full sm:w-72">
          <Select
            value={format}
            onValueChange={setFormat}
            label="Question format"
            hint={meta.description}
            options={QUIZ_FORMATS.map((f) => ({
              value: f,
              label: QUIZ_FORMAT_META[f].label,
            }))}
          />
        </div>
      </div>

      {topics.length > MAX_TOPICS && (
        <p className="mb-4 rounded-md border border-warning bg-warning-surface px-3 py-2 text-sm text-warning">
          This document has {topics.length} topics. You can build a quiz from up to{" "}
          {MAX_TOPICS} at a time, so the first {MAX_TOPICS} were selected for you.
        </p>
      )}

      <fieldset className="mb-6">
        <legend className="sr-only">Choose the topics to quiz me on</legend>
        <ul className="space-y-2" aria-describedby={`${listId}-count`}>
          {topics.map((topic) => {
            const checkboxId = `${listId}-${topic.id}`;
            const checked = selected.has(topic.id);
            const disabled = !checked && atCap;
            return (
              <li key={topic.id}>
                <div
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    checked ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                  } ${disabled ? "opacity-60" : ""}`}
                >
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={() => toggleTopic(topic.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    {/* The label points at the checkbox by id. It previously had
                        no htmlFor and the checkbox had no id, so clicking the
                        topic name did nothing at all. */}
                    <label
                      htmlFor={checkboxId}
                      className={`block font-medium ${disabled ? "" : "cursor-pointer"}`}
                    >
                      {topic.title}
                    </label>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {topic.content}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <p id={`${listId}-count`} className="mb-2 text-sm text-muted-foreground">
        {selected.size} of {topics.length}{" "}
        {topics.length === 1 ? "topic" : "topics"} selected
      </p>

      <Button
        className="w-full"
        disabled={selected.size === 0}
        onClick={handleGenerate}
      >
        Generate quiz ({selected.size}{" "}
        {selected.size === 1 ? "topic" : "topics"})
      </Button>
    </div>
  );
}