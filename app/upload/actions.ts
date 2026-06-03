"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTopics } from "@/lib/ai/extract-topics";
import { checkUploadQuota } from "@/lib/quota";
import { getCurrentMonth } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const path = await import("path");
  const { pathToFileURL } = await import("url");
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
  const workerPath = path.resolve(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texts.push(content.items.map((item: any) => item.str).join(" "));
  }

  return texts.join("\n\n");
}

async function extractTextFromPptx(buffer: ArrayBuffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const slides: string[] = [];

  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"))
    .sort();

  for (const file of slideFiles) {
    const content = await zip.files[file].async("text");
    const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
    const slideText = textMatches
      .map((m: string) => m.replace(/<[^>]+>/g, ""))
      .join(" ");
    if (slideText.trim()) {
      slides.push(slideText.trim());
    }
  }

  return slides.join("\n\n---\n\n");
}

export async function uploadDocument(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const quota = await checkUploadQuota(user.id);
  if (!quota.allowed) return { error: quota.reason };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const ext = file.name.endsWith(".pptx") ? "pptx" : "pdf";
  if (!["pdf", "pptx"].includes(ext)) return { error: "Only PDF and PPTX files are supported" };
  if (file.size > 20 * 1024 * 1024) return { error: "File must be under 20MB" };

  const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("Documents")
    .upload(filePath, file);

  if (uploadError) return { error: `Failed to upload file: ${uploadError.message}` };

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      title: file.name,
      file_path: filePath,
      file_type: ext,
      status: "processing",
    })
    .select()
    .single();

  if (docError || !doc) return { error: `Failed to create document record: ${docError?.message}` };

  try {
    const buffer = await file.arrayBuffer();
    const text = ext === "pdf" ? await extractTextFromPdf(buffer) : await extractTextFromPptx(buffer);

    if (!text.trim()) {
      await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
      return { error: "Could not extract text from this document. Scanned PDFs are not supported yet." };
    }

    const topics = await extractTopics(text);
    const topicRows = topics.map((t, i) => ({
      document_id: doc.id,
      title: t.title,
      content: t.content,
      position: i,
    }));

    await supabase.from("topics").insert(topicRows);
    await supabase.from("documents").update({ status: "ready", page_count: text.split("\n\n").length }).eq("id", doc.id);

    await supabase.storage.from("Documents").remove([filePath]);

    const month = getCurrentMonth();
    const { data: existing } = await supabase
      .from("usage_records")
      .select("documents_uploaded")
      .eq("user_id", user.id)
      .eq("month", month)
      .single();

    if (existing) {
      await supabase
        .from("usage_records")
        .update({ documents_uploaded: (existing.documents_uploaded || 0) + 1 })
        .eq("user_id", user.id)
        .eq("month", month);
    } else {
      await supabase
        .from("usage_records")
        .insert({ user_id: user.id, month, documents_uploaded: 1 });
    }

  } catch (err) {
    await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: `Failed to process document: ${message}` };
  }

  revalidatePath("/dashboard");
  return { documentId: doc.id };
}
