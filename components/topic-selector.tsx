"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import type { Topic } from "@/types/database";
import type { QuestionFormat } from "@/types";

interface TopicSelectorProps {
  topics: Topic[];
  documentId: string;
}

export function TopicSelector({ topics, documentId }: TopicSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(topics.map((t) => t.id)));
  const [format, setFormat] = useState<QuestionFormat>("mcq");

  const toggleTopic = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(topics.map((t) => t.id)));
  const deselectAll = () => setSelected(new Set());

  const handleGenerate = () => {
    const params = new URLSearchParams();
    params.set("topics", Array.from(selected).join(","));
    params.set("format", format);
    router.push(`/documents/${documentId}/quiz/new?${params.toString()}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Deselect All
          </Button>
        </div>
        <Select value={format} onValueChange={(v) => setFormat(v as QuestionFormat)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Question format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mcq">Multiple Choice</SelectItem>
            <SelectItem value="free_response">Free Response</SelectItem>
            <SelectItem value="both">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 mb-6">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
              selected.has(topic.id) ? "border-primary/50 bg-primary/5" : ""
            }`}
            onClick={() => toggleTopic(topic.id)}
          >
            <Checkbox
              checked={selected.has(topic.id)}
              onCheckedChange={() => toggleTopic(topic.id)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label className="font-medium cursor-pointer">{topic.title}</Label>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{topic.content}</p>
            </div>
          </div>
        ))}
      </div>

      <Button
        className="w-full"
        disabled={selected.size === 0}
        onClick={handleGenerate}
      >
        Generate Quiz ({selected.size} topic{selected.size !== 1 ? "s" : ""})
      </Button>
    </div>
  );
}
