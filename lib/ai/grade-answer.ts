import { aiComplete } from "./client";

interface GradedAnswer {
  score: number;
  feedback: string;
  /** Credit: what the student actually got right. */
  whatWasRight: string | null;
  /** Gap: the specific thing that cost marks. Null for a full-credit answer. */
  whatWasMissing: string | null;
  /** The sentence from the source that justifies the grade, verbatim. */
  sourceQuote: string | null;
}

/**
 * Grade a free-response answer against the source material.
 *
 * Every field except score is best-effort. The prompt asks for a structured
 * response, but a model that returns prose or omits the citation still yields a
 * usable grade — a missing citation must never cost the student their score,
 * since grading runs per question inside a fixed submit-time budget.
 */
export async function gradeFreeResponse(
  questionText: string,
  userAnswer: string,
  documentContext: string
): Promise<GradedAnswer> {
  const systemPrompt = `You are an academic grader. Grade the student's answer against the source material.

Return ONLY a JSON object with these keys:
- "score": a number between 0 and 100
- "feedback": brief, constructive feedback (1-3 sentences)
- "what_was_right": what the student got right. One short sentence. Empty string if nothing.
- "what_was_missing": the specific thing that cost marks, naming the missing idea. One short sentence. Empty string for a full-credit answer.
- "source_quote": the single most relevant sentence COPIED VERBATIM from the source material that justifies your grade. Copy it exactly; do not paraphrase, and do not invent text that is not present.

Consider accuracy, completeness, and clarity.`;

  const truncatedContext = documentContext.length > 30000
    ? documentContext.slice(0, 30000) + "\n\n[Context truncated due to length.]"
    : documentContext;

  const userPrompt = `SOURCE MATERIAL: ${truncatedContext}

QUESTION: ${questionText}

STUDENT ANSWER: ${userAnswer}

Grade this answer against the source material.`;

  const result = await aiComplete(systemPrompt, userPrompt, "json_object");

  let parsed: Record<string, unknown>;
  try {
    const cleaned = result.replace(/```json\s*/g, "").replace(/\s*```/g, "").trim();
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error("Failed to parse AI grading response");
  }

  // Only score is mandatory. A missing or unquoted citation degrades to null and
  // the results page simply omits the source block.
  const text = (value: unknown, max: number): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, max) : null;
  };

  const quote = text(parsed.source_quote, 1000);
  const normalizedContext = truncatedContext.replace(/\s+/g, " ").trim();
  const normalizedQuote = quote?.replace(/\s+/g, " ").trim();
  // Drop a "quote" the model paraphrased rather than copied — showing invented
  // text next to the student's own document is worse than showing nothing.
  const verifiedQuote =
    quote && normalizedContext.includes(normalizedQuote ?? "") ? quote : null;

  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    feedback: text(parsed.feedback, 2000) ?? "",
    whatWasRight: text(parsed.what_was_right, 600),
    whatWasMissing: text(parsed.what_was_missing, 600),
    sourceQuote: verifiedQuote,
  };
}