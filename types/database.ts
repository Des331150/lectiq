export interface User {
  id: string;
  email: string | null;
  quiz_quota_reset_at: string;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_type: "pdf" | "pptx";
  status: "processing" | "ready" | "error";
  page_count: number | null;
  processing_warnings: string[] | null;
  created_at: string;
}

export interface Topic {
  id: string;
  document_id: string;
  title: string;
  content: string;
  source_content: string | null;
  position: number;
  created_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  document_id: string;
  format: "mcq" | "free_response" | "both";
  status: "generating" | "ready" | "completed" | "error";
  question_count: number;
  score: number | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  type: "mcq" | "free_response";
  question_text: string;
  options: { label: string; text: string }[] | null;
  correct_answer: string | null;
  model_answer: string | null;
  /** Why the correct answer is correct. Null on questions generated before
   *  migration 00009, so the UI must handle its absence. */
  explanation: string | null;
  topic_id: string | null;
  position: number;
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean | null;
  ai_score: number | null;
  ai_feedback: string | null;
  /** The sentence from the source that justifies the grade, when the grader
   *  returned one. Best-effort: grading succeeds without it. */
  source_quote: string | null;
  /** Grade split into credit and gap so the UI can label them separately
   *  rather than parsing the prose blob in ai_feedback. */
  what_was_right: string | null;
  what_was_missing: string | null;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  month: string;
  quizzes_used: number;
  documents_uploaded: number;
  questions_generated: number;
}
