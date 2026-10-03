"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTopics } from "@/lib/ai/extract-topics";
import { TRUNCATION_REASON, type TruncationReason } from "@/lib/ai/limits";
import { claimQuota, releaseQuota, QUOTA_EXCEEDED_MESSAGE } from "@/lib/quota";
import { revalidatePath } from "next/cache";

export const maxDuration = 300;

const MAX_PDF_PAGES = 200;
const SUPPORTED_TYPES = ["pdf", "pptx"] as const;

function slideNumber(fileName: string): number {
  const match = fileName.match(/slide(\d+)\.xml$/);
  return match ? Number(match[1]) : 0;
}

interface ExtractionOutput {
  text: string;
  pageCount: number;
  reasons: TruncationReason[];
}

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<ExtractionOutput> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
  const workerModule = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  (globalThis as unknown as { pdfjsWorker: unknown }).pdfjsWorker = workerModule;
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pagesToRead = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const texts: string[] = [];

  for (let i = 1; i <= pagesToRead; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texts.push(content.items.map((item: { str: string }) => item.str).join(" "));
  }

  return {
    text: texts.join("\n\n"),
    pageCount: pdf.numPages,
    reasons: pdf.numPages > MAX_PDF_PAGES ? [TRUNCATION_REASON.PDF_PAGES_CAPPED] : [],
  };
}

async function extractTextFromPptx(buffer: ArrayBuffer): Promise<ExtractionOutput> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const slides: string[] = [];

  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"))
    .sort((a, b) => slideNumber(a) - slideNumber(b));

  for (const file of slideFiles) {
    const content = await zip.files[file].async("text");
    const text = content
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      const slideNum = slideFiles.indexOf(file) + 1;
      slides.push(`[Slide ${slideNum}]\n${text}`);
    }
  }

  return { text: slides.join("\n\n"), pageCount: slides.length, reasons: [] };
}

export async function uploadDocument(filePath: string, fileName: string, fileType: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!SUPPORTED_TYPES.includes(fileType as (typeof SUPPORTED_TYPES)[number])) {
    return { error: "Only PDF and PPTX files are supported" };
  }

  // Storage RLS already scopes reads and deletes to the caller's own folder,
  // but the action also refuses paths outside it rather than relying on that
  // policy alone.
  const expectedPrefix = `${user.id}/`;
  if (typeof filePath !== "string" || !filePath.startsWith(expectedPrefix)) {
    return { error: "Invalid file path" };
  }
  if (filePath.includes("..")) {
    return { error: "Invalid file path" };
  }

  const claimed = await claimQuota(user.id, "document");
  if (!claimed) {
    return { error: QUOTA_EXCEEDED_MESSAGE.document };
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      title: fileName,
      file_path: filePath,
      file_type: fileType,
      status: "processing",
    })
    .select()
    .single();

  if (docError || !doc) {
    await releaseQuota(user.id, "document");
    return { error: `Failed to create document record: ${docError?.message}` };
  }

  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("Documents")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to read uploaded file: ${downloadError?.message}`);
    }

    const buffer = await fileData.arrayBuffer();
    const { text, pageCount, reasons: extractReasons } =
      fileType === "pdf" ? await extractTextFromPdf(buffer) : await extractTextFromPptx(buffer);

    if (!text.trim()) {
      await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
      await releaseQuota(user.id, "document");
      const reason =
        fileType === "pdf"
          ? "Scanned PDFs or image-based PDFs are not supported yet."
          : "Could not extract text from this PowerPoint file. It may be image-only or password-protected.";
      return { error: reason };
    }

    const { topics, reasons: topicReasons } = await extractTopics(text);
    const warnings = Array.from(new Set([...extractReasons, ...topicReasons]));

    if (topics.length === 0) {
      await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
      await releaseQuota(user.id, "document");
      return { error: "No topics could be extracted from this document." };
    }

    const topicRows = topics.map((t, i) => ({
      document_id: doc.id,
      title: t.title,
      content: t.content,
      source_content: t.source,
      position: i,
    }));

    const { error: topicsError } = await supabase.from("topics").insert(topicRows);
    if (topicsError) throw new Error(`Failed to save topics: ${topicsError.message}`);

    const { error: readyError } = await supabase
      .from("documents")
      .update({
        status: "ready",
        page_count: pageCount,
        processing_warnings: warnings.length > 0 ? warnings : null,
      })
      .eq("id", doc.id);
    if (readyError) throw new Error(`Failed to mark document ready: ${readyError.message}`);

    await supabase.storage.from("Documents").remove([filePath]);
  } catch (err) {
    await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
    await releaseQuota(user.id, "document");
    // The extracted text lives only in this request, so the uploaded object is
    // dead weight. Clean it up so failed uploads don't accumulate in storage.
    await supabase.storage.from("Documents").remove([filePath]);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: `Failed to process document: ${message}` };
  }

  revalidatePath("/dashboard");
  return { documentId: doc.id };
}