// Shared domain types mirroring the Postgres schema in supabase/schema.sql.

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "failed";

export interface Document {
  id: string;
  user_id: string;
  title: string;
  storage_path: string;
  page_count: number | null;
  char_count: number | null;
  status: DocumentStatus;
  error: string | null;
  folder_id: string | null;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Summary {
  id: string;
  document_id: string;
  user_id: string;
  overview: string;
  key_points: string[];
  key_terms: { term: string; definition: string }[];
  created_at: string;
}

export type QuestionKind = "mcq" | "tf" | "short" | "match" | "order" | "flashcard" | "multi";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  quiz_id: string;
  position: number;
  kind: QuestionKind;
  model: string | null;
  prompt: string;
  options: string[] | null;
  answer: string;
  explanation: string | null;
}

export interface Quiz {
  id: string;
  document_id: string | null;
  user_id: string;
  title: string;
  difficulty: Difficulty;
  created_at: string;
  questions?: Question[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total: number;
  answers: Record<string, string>;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  detail: string | null;
  done: boolean;
  starred: boolean;
  due_at: string | null;
  document_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}
