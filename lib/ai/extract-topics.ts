import { aiComplete } from "./client";

interface ExtractedTopic {
  title: string;
  content: string;
}

export async function extractTopics(documentText: string): Promise<ExtractedTopic[]> {
  const systemPrompt = `You are an academic assistant. Extract distinct topics from the provided document text. 
For each topic, return:
- title: a concise topic name
- content: the key excerpt from the document that covers this topic (2-5 sentences)

If the document has clear section headings or slide titles, use those as topic titles.
Return ONLY a JSON object with this structure: { "topics": [{ "title": "...", "content": "..." }] }`;

  const result = await aiComplete(systemPrompt, documentText, "json_object");

  try {
    const parsed = JSON.parse(result);
    return parsed.topics || [];
  } catch {
    throw new Error("Failed to parse AI topic extraction response");
  }
}
