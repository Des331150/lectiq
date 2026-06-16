export interface User {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  subscription_status: "basic" | "pro";
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
  created_at: string;
}

export interface Topic {
  id: string;
  document_id: string;
  title: string;
  content: string;
  position: number;
  created_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  document_id: string;
  format: "mcq" | "free_response" | "both";
  status: "generating" | "ready" | "completed";
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
