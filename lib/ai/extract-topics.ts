import { aiComplete } from "./client";

interface ExtractedTopic {
  title: string;
  content: string;
}

const MAX_CHARS = 15000;

export async function extractTopics(documentText: string): Promise<ExtractedTopic[]> {
  const systemPrompt = `You are an academic assistant. Extract distinct, comprehensive topics from the provided document.

If the content is divided into slides or sections (marked as [Slide 1], [Slide 2], etc.), GROUP related slides into topics and use the slide titles as topic names.

For each topic, return:
- title: a concise, descriptive topic name
- content: a comprehensive summary of everything covered in that topic (2-5 sentences)

Cover ALL material in the document. Do not skip sections. Extract every distinct topic.
Return ONLY a JSON object with this structure: { "topics": [{ "title": "...", "content": "..." }] }`;

  const truncatedText = documentText.length > MAX_CHARS
    ? documentText.slice(0, MAX_CHARS) + "\n\n[Document truncated due to length. Only the first portion was analyzed.]"
    : documentText;

  const result = await aiComplete(systemPrompt, truncatedText, "json_object");

  try {
    const cleaned = result.replace(/```json\s*/g, "").replace(/\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed.topics || [];
  } catch {
    throw new Error(`Failed to parse AI topic extraction response: ${result.slice(0, 200)}`);
  }
}
