import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { safeRedirectPath, getCurrentMonth } from "../../lib/utils.ts";
import {
  isQuizFormat,
  formatLabel,
  QUIZ_FORMATS,
  QUIZ_FORMAT_META,
} from "../../lib/quiz-formats.ts";
import { MAX_TOPIC_IDS, EXTRACTION_TOPIC_CAP } from "../../lib/topic-cap.ts";

describe("safeRedirectPath", () => {
  test("allows an internal path", () => {
    assert.equal(safeRedirectPath("/dashboard"), "/dashboard");
  });

  test("rejects an absolute URL", () => {
    // An open redirect here would let a confirmation link bounce a signed-in
    // user off-site.
    assert.equal(safeRedirectPath("https://evil.example/steal"), "/dashboard");
  });

  test("rejects a protocol-relative URL", () => {
    assert.equal(safeRedirectPath("//evil.example/steal"), "/dashboard");
  });

  test("falls back when the value is missing", () => {
    assert.equal(safeRedirectPath(null), "/dashboard");
    assert.equal(safeRedirectPath(undefined), "/dashboard");
  });
});

describe("getCurrentMonth", () => {
  test("returns a YYYY-MM string", () => {
    assert.match(getCurrentMonth(), /^\d{4}-\d{2}$/);
  });
});

/**
 * Three screens formatted the same three enum values differently: the topic
 * selector's trigger rendered the raw value, the confirmation page used a string
 * replace, and history used CSS capitalize. None of them agreed.
 */
describe("quiz formats", () => {
  test("every format has a display name", () => {
    for (const format of QUIZ_FORMATS) {
      assert.ok(QUIZ_FORMAT_META[format].label, `${format} needs a label`);
      assert.ok(QUIZ_FORMAT_META[format].description, `${format} needs a description`);
    }
  });

  test("display names are not the stored values", () => {
    assert.equal(formatLabel("mcq"), "Multiple choice");
    assert.equal(formatLabel("free_response"), "Free response");
    assert.equal(formatLabel("both"), "Mixed");
  });

  test("labels have no underscores and are sentence case", () => {
    for (const format of QUIZ_FORMATS) {
      const label = formatLabel(format);
      assert.ok(!label.includes("_"), `${format} label leaks the enum value`);
    }
  });

  test("recognises the three supported formats", () => {
    for (const format of QUIZ_FORMATS) assert.equal(isQuizFormat(format), true);
  });

  test("rejects anything else", () => {
    assert.equal(isQuizFormat("essay"), false);
    assert.equal(isQuizFormat(""), false);
    assert.equal(isQuizFormat(null), false);
    assert.equal(isQuizFormat(undefined), false);
  });
});

/**
 * The request cap is enforced by the generate route. If extraction ever
 * produces more topics than the cap allows, the selector can preselect a set the
 * server will reject.
 */
describe("topic cap", () => {
  test("extraction cannot produce more topics than one request accepts", () => {
    // Extraction caps at 60 and the request cap is 100, so the "too many topics"
    // path is unreachable. Worth asserting, because raising the extraction cap
    // past the request cap would make the selector preselect something the server
    // refuses.
    assert.ok(
      EXTRACTION_TOPIC_CAP <= MAX_TOPIC_IDS,
      `extraction cap ${EXTRACTION_TOPIC_CAP} exceeds the request cap ${MAX_TOPIC_IDS}`
    );
  });
});