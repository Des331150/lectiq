export type QuestionFormat = "mcq" | "free_response" | "both";

export interface TopicSelection {
  id: string;
  title: string;
  selected: boolean;
}

export interface McqOption {
  label: string;
  text: string;
}

export interface GeneratedQuestion {
  type: "mcq" | "free_response";
  question_text: string;
  options?: McqOption[];
  correct_answer?: string;
  model_answer?: string;
  topic_id: string;
}

export interface GradedAnswer {
  score: number;
  feedback: string;
}
