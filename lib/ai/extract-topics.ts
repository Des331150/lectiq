import { aiComplete } from "./client";
import { TRUNCATION_REASON, type TruncationReason } from "./limits";

interface ExtractedTopic {
  title: string;
  content: string;
  source: string;
}

const CHUNK_CHARS = 10000;
const MAX_TOPICS = 60;
const MAX_TOTAL_CHUNKS = 30;
const TIME_BUDGET_MS = 90_000;
const MIN_SLIDE_MARKERS = 2;
const MAP_TEMPERATURE = 0.2;
const REDUCE_TEMPERATURE = 0.2;
const SLIDE_MARKER = /^\[Slide (\d+)\]/;

const MAP_PROMPT = `You are an academic assistant. Extract the distinct, substantive topics from the provided section of a lecture document.

The section may be from a slide deck (marked with [Slide N]) or a PDF (paragraph-separated). Group related slides or paragraphs that cover the same subject into a single topic, and use a descriptive topic name.

For each topic, return:
- title: a concise, descriptive topic name
- content: a comprehensive summary of everything covered in that topic (2-5 sentences)
- source: the VERBATIM raw text from the section that this topic covers. Copy the exact original wording of the relevant slides/paragraphs word for word — do NOT paraphrase, summarize, rewrite, or edit. Include all detail that could be quizzed on: definitions, formulas, examples, bullet points, names, dates. This field is used to generate quiz questions, so the more original detail it retains, the better.

STRICT RULES:
- Only extract REAL study topics — actual subject matter a student could be quizzed on.
- DO NOT create topics for front matter or administrative content such as: learning objectives, "what you will learn" lists, agendas, outlines, tables of contents, schedules, course overviews, introductions, welcome slides, grading/rubrics/policies, contact info, thank-you slides, or reference/bibliography/review-question slides.
- If a group of slides/paragraphs is only front matter or a divider, skip it entirely — do not emit a topic for it.
- Cover ALL real subject material in the section. Do not skip genuine topics.
- Use consistent topic granularity: group closely-related concepts into one topic rather than fragmenting into many small ones.

Return ONLY a JSON object with this structure: { "topics": [{ "title": "...", "content": "...", "source": "..." }] }`;

const REDUCE_PROMPT = `You are an academic assistant. Below are topics extracted from separate chunks of a single lecture document.

Merge and clean this list:
- Combine near-duplicate topics that refer to the same subject into a single topic (keep the best title, merge the content).
- REMOVE any topics that are NOT real study topics, especially: learning objectives, agendas, outlines, tables of contents, course overviews, introductions, welcome content, grading/policies/administrative content, thank-you slides, references/bibliographies, or review-question lists.
- Keep every genuine, distinct topic. Do not drop real subject matter.
- Preserve the original document order as much as possible.

For each topic, return:
- title: a concise, descriptive topic name
- content: a comprehensive summary of everything covered in that topic (2-5 sentences)
- source: the combined VERBATIM raw text from all topics being merged (concatenate their source text exactly, do NOT paraphrase, summarize, rewrite, or edit). Keep every original detail.

Return ONLY a JSON object with this structure: { "topics": [{ "title": "...", "content": "...", "source": "..." }] }`;

function parseTopics(jsonText: string): ExtractedTopic[] {
  const cleaned = jsonText.replace(/```json\s*/g, "").replace(/\s*```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  const raw: unknown[] = Array.isArray(parsed?.topics) ? parsed.topics : [];
  return raw
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => ({
      title: String(t.title ?? "").trim(),
      content: String(t.content ?? "").trim(),
      source: String(t.source ?? t.content ?? "").trim(),
    }))
    .filter((t) => t.title.length > 0 && t.content.length > 0);
}

function splitBySlides(documentText: string): string[] {
  const slides: string[] = [];
  let current = "";

  for (const line of documentText.split("\n")) {
    const match = line.match(SLIDE_MARKER);
    if (match) {
      if (current.trim()) slides.push(current);
      current = `${line}\n`;
    } else {
      current += `${line}\n`;
    }
  }
  if (current.trim()) slides.push(current);
  return slides;
}

function isSlideDeck(documentText: string): boolean {
  const numbers = Array.from(documentText.matchAll(SLIDE_MARKER), (m) => Number(m[1]));
  if (numbers.length < MIN_SLIDE_MARKERS) return false;
  return numbers.every((n, i) => i === 0 || n > numbers[i - 1]);
}

function groupIntoChunks(segments: string[], maxChars: number): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const segment of segments) {
    if (current.length > 0 && current.length + segment.length > maxChars) {
      chunks.push(current);
      current = segment;
    } else {
      current += current ? `\n${segment}` : segment;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

const JUNK_TITLE_TOKENS = new Set([
  "introduction",
  "introduction to",
  "overview",
  "learning objectives",
  "objectives",
  "agenda",
  "outline",
  "table of contents",
  "contents",
  "schedule",
  "welcome",
  "welcome to",
  "about this course",
  "course overview",
  "this course",
  "course information",
  "course logistics",
  "grading",
  "syllabus",
  "references",
  "references and further reading",
  "further reading",
  "bibliography",
  "thank you",
  "questions",
  "review questions",
  "homework",
  "assignment",
  "contact",
  "administrative details",
]);

function isJunkTopic(topic: ExtractedTopic): boolean {
  const norm = normalizeTitle(topic.title);
  if (JUNK_TITLE_TOKENS.has(norm)) return true;
  const low = topic.content.toLowerCase();
  if (
    low.length < 40 &&
    (low.startsWith("this slide") || low.startsWith("this section") || low.startsWith("this document"))
  ) {
    return true;
  }
  return false;
}

export interface ExtractionResult {
  topics: ExtractedTopic[];
  reasons: TruncationReason[];
}

export async function extractTopics(documentText: string): Promise<ExtractionResult> {
  const slideSegments = isSlideDeck(documentText) ? splitBySlides(documentText) : [];
  const sections =
    slideSegments.length > 0 ? slideSegments : documentText.split(/\n{2,}/).filter((s) => s.trim());
  const chunks = groupIntoChunks(sections, CHUNK_CHARS);
  const reasons: TruncationReason[] = [];
  if (chunks.length > MAX_TOTAL_CHUNKS) reasons.push(TRUNCATION_REASON.TOPICS_TRUNCATED);
  const deadline = Date.now() + TIME_BUDGET_MS;

  const mapResults: ExtractedTopic[][] = [];
  for (const chunk of chunks.slice(0, MAX_TOTAL_CHUNKS)) {
    if (Date.now() >= deadline) {
      reasons.push(TRUNCATION_REASON.DEADLINE_HIT);
      break;
    }
    try {
      const result = await aiComplete(MAP_PROMPT, chunk, "json_object", MAP_TEMPERATURE);
      mapResults.push(parseTopics(result));
    } catch (err) {
      console.error("Failed to extract topics for a chunk; skipping it:", err);
    }
  }

  const mergedTopics = mapResults.flat();
  if (mergedTopics.length === 0) return { topics: [], reasons };

  let final: ExtractedTopic[];
  try {
    final =
      mergedTopics.length === 1
        ? mergedTopics
        : parseTopics(await aiComplete(REDUCE_PROMPT, JSON.stringify(mergedTopics), "json_object", REDUCE_TEMPERATURE));
  } catch (err) {
    console.error("Failed to reduce topics; returning merged chunk output:", err);
    final = mergedTopics;
  }

  final = final.filter((t) => !isJunkTopic(t));
  if (final.length > MAX_TOPICS) reasons.push(TRUNCATION_REASON.TOPICS_TRUNCATED);
  return { topics: final.slice(0, MAX_TOPICS), reasons };
}
