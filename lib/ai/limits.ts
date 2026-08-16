export const TRUNCATION_REASON = {
  PDF_PAGES_CAPPED: "pdf_pages_capped",
  TOPICS_TRUNCATED: "topics_truncated",
  DEADLINE_HIT: "deadline_hit",
} as const;

export type TruncationReason = (typeof TRUNCATION_REASON)[keyof typeof TRUNCATION_REASON];