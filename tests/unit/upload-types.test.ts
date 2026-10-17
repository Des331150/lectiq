import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { detectFileType, formatBytes, MAX_SIZE_MB } from "../../lib/upload-types.ts";

/**
 * The upload path used to infer the type with
 * `file.name.endsWith(".pptx") ? "pptx" : "pdf"`, which labelled every other
 * file as a PDF. A .docx was stored with a .pdf extension and then failed
 * inside pdfjs with a complaint about PDF internals rather than the real
 * problem, which is that the file was never a PDF.
 */
describe("detectFileType", () => {
  test("accepts a PDF by extension and MIME", () => {
    assert.equal(detectFileType({ name: "lecture.pdf", type: "application/pdf" }), "pdf");
  });

  test("accepts a PDF with no MIME, from the extension alone", () => {
    assert.equal(detectFileType({ name: "lecture.pdf", type: "" }), "pdf");
  });

  test("accepts an uppercase extension", () => {
    assert.equal(detectFileType({ name: "LECTURE.PDF", type: "application/pdf" }), "pdf");
  });

  test("accepts a pptx", () => {
    assert.equal(
      detectFileType({
        name: "deck.pptx",
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      }),
      "pptx"
    );
  });

  test("rejects a docx", () => {
    assert.equal(
      detectFileType({
        name: "notes.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      null
    );
  });

  // This is the case that made the first version of the check wrong: a browser
  // reports the MIME it believes the file has, and a renamed .docx can arrive
  // claiming application/pdf. Matching on MIME alone let it through.
  test("rejects a docx renamed to .pdf but reported as a PDF", () => {
    assert.equal(detectFileType({ name: "notes.docx", type: "application/pdf" }), null);
  });

  test("rejects a pptx renamed to .pdf", () => {
    assert.equal(
      detectFileType({
        name: "renamed.pdf",
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      }),
      null
    );
  });

  test("rejects a PNG renamed to .pdf", () => {
    assert.equal(detectFileType({ name: "photo.png", type: "image/pdf" }), null);
  });

  test("rejects an image", () => {
    assert.equal(detectFileType({ name: "photo.png", type: "image/png" }), null);
  });

  test("rejects an archive", () => {
    assert.equal(detectFileType({ name: "archive.zip", type: "application/zip" }), null);
  });

  test("rejects an empty input", () => {
    assert.equal(detectFileType({ name: "", type: "" }), null);
  });
});

describe("formatBytes", () => {
  test("reports megabytes to one decimal", () => {
    assert.equal(formatBytes(45 * 1024 * 1024), "45.0MB");
  });

  test("does not round a small file up to a misleading size", () => {
    assert.equal(formatBytes(1024), "0.0MB");
  });
});

describe("MAX_SIZE_MB", () => {
  // The upload zone and the page both read this, and the proxy caps request
  // bodies at 40mb, so the three must not drift apart.
  test("matches the proxy body size limit", () => {
    assert.equal(MAX_SIZE_MB, 40);
  });
});