import { aiComplete } from "./client";

interface GeneratedQuestion {
  type: "mcq" | "free_response";
  question_text: string;
  options?: { label: string; text: string }[];
  correct_answer?: string;
  model_answer?: string;
  topic_id: string;
}

export async function generateQuestions(
  topicContents: { id: string; title: string; content: string }[],
  format: "mcq" | "free_response" | "both"
): Promise<GeneratedQuestion[]> {
  const topicsText = topicContents
    .map((t) => `TOPIC: ${t.title}\nCONTENT: ${t.content}\n`)
    .join("\n");

  const formatInstruction =
    format === "mcq"
      ? "multiple choice questions (4 options each, one correct)"
      : format === "free_response"
      ? "free response questions (include a model answer)"
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
    const parsed = JSON.parse(result);
    return (parsed.questions || []).map((q: any, i: number) => ({
      ...q,
      topic_id: topicContents[0]?.id || "",
    }));
  } catch {
    throw new Error("Failed to parse AI question generation response");
  }
}
