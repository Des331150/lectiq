import { aiComplete } from "./client";

interface GradedAnswer {
  score: number;
  feedback: string;
}

export async function gradeFreeResponse(
  questionText: string,
  userAnswer: string,
  documentContext: string
): Promise<GradedAnswer> {
  const systemPrompt = `You are an academic grader. Grade the student's answer against the source material.
Provide:
- score: a number between 0 and 100
- feedback: brief, constructive feedback (1-3 sentences)

Consider accuracy, completeness, and clarity. Return ONLY JSON: { "score": number, "feedback": "..." }`;

  const userPrompt = `SOURCE MATERIAL: ${documentContext}

QUESTION: ${questionText}

STUDENT ANSWER: ${userAnswer}

Grade this answer against the source material.`;

  const result = await aiComplete(systemPrompt, userPrompt, "json_object");

  try {
    return JSON.parse(result) as GradedAnswer;
  } catch {
    throw new Error("Failed to parse AI grading response");
  }
}
