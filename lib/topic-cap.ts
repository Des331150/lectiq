/**
 * The two limits that bound how many topics a quiz can be built from.
 *
 * They live together because the relationship between them is the thing worth
 * protecting. Extraction produces at most EXTRACTION_TOPIC_CAP topics for a
 * document, and a single generate request accepts at most MAX_TOPIC_IDS. While
 * extraction stays below the request cap, the selector can never assemble a
 * request the server will refuse, which is why the over-cap UI it used to carry
 * was unreachable.
 *
 * Raising the extraction cap above the request cap would make every document
 * over MAX_TOPIC_IDS open in a state that can only fail. A test asserts the
 * ordering so that change cannot land silently.
 */
export const MAX_TOPIC_IDS = 100;

/** Most topics extraction will return for a single document. */
export const EXTRACTION_TOPIC_CAP = 60;