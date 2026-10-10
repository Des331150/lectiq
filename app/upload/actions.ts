"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTopics } from "@/lib/ai/extract-topics";
import { TRUNCATION_REASON, type TruncationReason } from "@/lib/ai/limits";
import { claimQuota, releaseQuota, QUOTA_EXCEEDED_MESSAGE } from "@/lib/quota";
import { revalidatePath } from "next/cache";

const MAX_PDF_PAGES = 200;

/**
 * The uploaded object's type is decided by its magic bytes, not by the caller's
 * claim or the storage path. A file that claims "pdf" but is a .docx would
 * otherwise reach pdfjs, fail with a message about PDF internals, and leave the
 * user with an error that never mentions the real problem.
 */
function sniffType(buffer: ArrayBuffer): "pdf" | "pptx" | null {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  // %PDF-
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "pdf";
  }
  // ZIP container: OOXML files (.pptx, .docx, .xlsx) all begin "PK\x03\x04".
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    return "pptx";
  }
  return null;
}

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

  if (fileType !== "pdf" && fileType !== "pptx") {
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

    // The caller sends a type derived from the filename; the bytes are the
    // authority. ZIP alone is ambiguous (docx and xlsx are also ZIP), so a
    // claimed-pdf file that sniffs as a ZIP is refused here with a message that
    // names the actual problem.
    const actual = sniffType(buffer);
    if (!actual) {
      await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
      await releaseQuota(user.id, "document");
      await supabase.storage.from("Documents").remove([filePath]);
      return {
        error: `"${fileName}" is not a readable PDF or PowerPoint file. If it opens in another program, export it as PDF or .pptx and try again.`,
      };
    }
    if (actual !== fileType) {
      await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
      await releaseQuota(user.id, "document");
      await supabase.storage.from("Documents").remove([filePath]);
      return {
        error:
          actual === "pptx" && fileType === "pdf"
            ? `"${fileName}" is a PowerPoint file, not a PDF. Export it as PDF, or upload the .pptx directly.`
            : `"${fileName}" is a PDF, not a PowerPoint file.`,
      };
    }

    const { text, pageCount, reasons: extractReasons } =
      actual === "pdf" ? await extractTextFromPdf(buffer) : await extractTextFromPptx(buffer);

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

    // Correct the stored type now that the bytes have confirmed it, so the
    // column reflects what was actually processed rather than the claim.
    await supabase.from("documents").update({ file_type: actual }).eq("id", doc.id);
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