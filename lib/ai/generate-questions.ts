import { aiComplete } from "./client";

interface GeneratedQuestion {
  type: "mcq" | "free_response";
  question_text: string;
  options?: { label: string; text: string }[];
  correct_answer?: string;
  model_answer?: string;
  topic_id: string | null;
}

interface ParsedQuestion {
  type?: string;
  topic?: string;
  question_text?: string;
  options?: Array<string | { label?: string; text?: string }>;
  correct_answer?: string;
  model_answer?: string;
}

interface TopicInput {
  id: string;
  title: string;
  content: string;
  source_content?: string | null;
}

const MAX_CHARS_PER_CALL = 30000;
const TIME_BUDGET_MS = 90_000;

export async function generateQuestions(
  topicContents: TopicInput[],
  format: "mcq" | "free_response" | "both"
): Promise<GeneratedQuestion[]> {
  const batches = groupTopicBatches(topicContents);
  const all: GeneratedQuestion[] = [];
  const deadline = Date.now() + TIME_BUDGET_MS;

  for (const batch of batches) {
    if (Date.now() >= deadline) break;
    all.push(...(await generateBatch(batch, format)));
  }

  return all;
}

function materialFor(topic: TopicInput): string {
  return (topic.source_content || topic.content || "").trim();
}

function topicText(topic: TopicInput): string {
  return `TOPIC: ${topic.title}\nSOURCE CONTENT: ${materialFor(topic)}\n`;
}

function groupTopicBatches(topicContents: TopicInput[]): TopicInput[][] {
  const batches: TopicInput[][] = [];
  let current: TopicInput[] = [];
  let currentChars = 0;

  for (const topic of topicContents) {
    const chars = topicText(topic).length;
    if (current.length > 0 && currentChars + chars > MAX_CHARS_PER_CALL) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(topic);
    currentChars += chars;
  }

  if (current.length > 0) batches.push(current);
  return batches;
}

async function generateBatch(
  batch: TopicInput[],
  format: "mcq" | "free_response" | "both"
): Promise<GeneratedQuestion[]> {
  let topicsText = batch.map(topicText).join("\n");

  if (topicsText.length > MAX_CHARS_PER_CALL) {
    topicsText = topicsText.slice(0, MAX_CHARS_PER_CALL) + "\n\n[Content truncated due to length.]";
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

For EVERY question, include a "topic" field set to the EXACT title of the topic it is based on (one of the TOPIC: labels above).

Return ONLY a JSON object with this structure:
{ "questions": [{ "type": "mcq"|"free_response", "topic": "...", "question_text": "...", "options"?: [...], "correct_answer"?: "...", "model_answer"?: "..." }] }`;

  const userPrompt = `Generate questions based on these topics:\n\n${topicsText}\n\nGenerate as many distinct, high-quality questions as the source content warrants — do not undershoot. Cover all the material provided.`;

  try {
    const result = await aiComplete(systemPrompt, userPrompt, "json_object");
    const cleaned = result.replace(/```json\s*/g, "").replace(/\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned) as { questions?: ParsedQuestion[] };
    const rawQuestions: ParsedQuestion[] = Array.isArray(parsed.questions) ? parsed.questions : [];

    const toOption = (opt: string | { label?: string; text?: string }, i: number): { label: string; text: string } =>
      typeof opt === "string"
        ? { label: String.fromCharCode(65 + i), text: opt }
        : { label: opt.label ?? "", text: opt.text ?? "" };

    let questions: GeneratedQuestion[] = rawQuestions.map((q) => ({
      type: q.type === "free_response" ? "free_response" : "mcq",
      question_text: q.question_text ?? "",
      options: q.options ? q.options.map(toOption) : undefined,
      correct_answer: q.correct_answer,
      model_answer: q.model_answer,
      topic_id: matchTopicId(q.topic, batch),
    }));

    if (format === "mcq") {
      questions = questions.filter(
        (q) => q.type === "mcq" && q.options && q.options.length >= 2 && q.options.every((o) => o.label)
      );
    } else if (format === "free_response") {
      questions = questions.filter((q) => q.type === "free_response");
    }

    return questions;
  } catch (err) {
    console.error("Failed to generate questions for a batch; returning none:", err);
    return [];
  }
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchTopicId(topicTitle: string | undefined, batch: TopicInput[]): string | null {
  if (!topicTitle) return null;
  const target = normalize(String(topicTitle));
  if (!target) return null;

  const exact = batch.find((t) => normalize(t.title) === target);
  if (exact) return exact.id;

  const loose = batch.find(
    (t) => normalize(t.title).includes(target) || target.includes(normalize(t.title))
  );
  return loose ? loose.id : null;
}
