import { aiComplete } from "./client";

interface GeneratedQuestion {
  type: "mcq" | "free_response";
  question_text: string;
  options?: { label: string; text: string }[];
  correct_answer?: string;
  model_answer?: string;
  topic_id: string;
}

const MAX_CHARS = 40000;

export async function generateQuestions(
  topicContents: { id: string; title: string; content: string }[],
  format: "mcq" | "free_response" | "both"
): Promise<GeneratedQuestion[]> {
  let topicsText = topicContents
    .map((t) => `TOPIC: ${t.title}\nCONTENT: ${t.content}\n`)
    .join("\n");

  if (topicsText.length > MAX_CHARS) {
    topicsText = topicsText.slice(0, MAX_CHARS) + "\n\n[Content truncated due to length.]";
  }

  const formatInstruction =
    format === "mcq"
      ? "ONLY multiple choice questions (4 options each, one correct). Do NOT include any free response questions."
      : format === "free_response"
      ? "ONLY free response questions (include a model answer). Do NOT include any multiple choice questions."
      : "a mix of multiple choice and free response questions";

  const systemPrompt = `You are an academic quiz generator. Generate ${formatInstruction} 
based on the provided topic content. 

For MCQ questions, include: question_text, type ("mcq"), options (array of {label: "A"/"B"/"C"/"D", text: string}), correct_answer (the correct label).
For free response questions, include: question_text, type ("free_response"), model_answer (the expected answer).

Return ONLY a JSON object with this structure:
{ "questions": [{ "type": "mcq"|"free_response", "question_text": "...", "options"?: [...], "correct_answer"?: "...", "model_answer"?: "..." }] }`;

  const userPrompt = `Generate questions based on these topics:\n\n${topicsText}\n\nGenerate an appropriate number of questions based on the depth of content provided.`;

  const result = await aiComplete(systemPrompt, userPrompt, "json_object");

  try {
    const cleaned = result.replace(/```json\s*/g, "").replace(/\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    let questions: GeneratedQuestion[] = (parsed.questions || []).map((q: any, i: number) => ({
      ...q,
      topic_id: topicContents[0]?.id || "",
    }));

    if (format === "mcq") {
      questions = questions.filter(q => q.type === "mcq").map(q => {
        if (!q.options || q.options.length < 2) return q;
        const opts = q.options.map((opt: any, i: number) => {
          if (typeof opt === "string") return { label: String.fromCharCode(65 + i), text: opt };
          return opt;
        });
        return { ...q, options: opts };
      }).filter(q => q.options && q.options.length >= 2 && q.options.every((o: any) => o.label));
    } else if (format === "free_response") {
      questions = questions.filter(q => q.type === "free_response");
    }

    return questions;
  } catch {
    throw new Error("Failed to parse AI question generation response");
  }
}
