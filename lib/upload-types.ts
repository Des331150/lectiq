/**
 * Single source of truth for accepted upload types.
 *
 * The upload path previously inferred the type with
 * `file.name.endsWith(".pptx") ? "pptx" : "pdf"`, which labelled every other
 * file as a PDF. A .docx was stored with a .pdf extension and then failed deep
 * inside text extraction, reporting a problem with PDF internals rather than
 * the fact that the file was never a PDF.
 *
 * Both the extension and the MIME type are checked, because either alone is
 * forgeable: renaming notes.docx to notes.pdf passes an extension check, and
 * some browsers report an empty or generic type for a valid file.
 */

export const MAX_SIZE_MB = 40;
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export type SupportedType = "pdf" | "pptx";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const EXTENSION_TYPES: Record<string, SupportedType> = {
  pdf: "pdf",
  pptx: "pptx",
};

const MIME_TYPES: Record<string, SupportedType> = {
  "application/pdf": "pdf",
  [PPTX_MIME]: "pptx",
  // Sent by some browsers and by older Office export paths for a .pptx.
  "application/pptx": "pptx",
  "application/vnd.ms-powerpoint": "pptx",
  "application/x-pdf": "pdf",
  "text/pdf": "pdf",
};

/**
 * Extensions we recognise as "definitely not a PDF or PowerPoint". A browser
 * reports the type it believes the file has, and a renamed .docx can arrive
 * claiming application/pdf, so the extension has the final say when it names
 * something we cannot read. Without this, notes.docx renamed to notes.pdf is
 * accepted on the strength of its MIME alone and then fails inside the
 * extractor with a message about a file that was never a PDF.
 */
const REJECTED_EXTENSIONS = new Set([
  "doc", "docx", "xls", "xlsx", "ppt", "odt", "odp", "ods",
  "txt", "rtf", "pages", "key", "numbers", "csv", "md",
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "heic",
  "zip", "rar", "7z", "gz", "tar",
  "mp3", "mp4", "wav", "avi", "mov", "mkv", "webm",
  "html", "htm", "json", "xml", "epub",
]);

/**
 * Resolve a File to a supported type, or null if it isn't one.
 *
 * Returns null rather than guessing, so an unrecognised file is refused at the
 * boundary instead of reaching the extractor.
 */
export function detectFileType(file: Pick<File, "name" | "type">): SupportedType | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (REJECTED_EXTENSIONS.has(ext)) return null;

  const byExtension = EXTENSION_TYPES[ext];
  const mime = (file.type || "").toLowerCase();
  const byMime = MIME_TYPES[mime];

  // Both signals agree, or only one is present and it is recognised.
  if (byExtension && byMime) return byExtension === byMime ? byExtension : null;
  return byExtension ?? byMime ?? null;
}

export function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}