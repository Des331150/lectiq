import { aiComplete } from "./client";

interface ExtractedTopic {
  title: string;
  content: string;
}

const MAX_CHARS = 15000;

export async function extractTopics(documentText: string): Promise<ExtractedTopic[]> {
  const systemPrompt = `You are an academic assistant. Extract distinct topics from the provided document text. 
For each topic, return:
- title: a concise topic name
- content: the key excerpt from the document that covers this topic (2-5 sentences)

If the document has clear section headings or slide titles, use those as topic titles.
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
