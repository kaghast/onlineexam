export interface LmsCourse {
  id: string; // Internal / NocoDB row ID
  course_name: string;
  course_id: string; // e.g. "BLG201"
  level: string; // e.g. "Lisans", "Ön Lisans", "Yüksek Lisans"
  akts: number;
  course_code: string;
  university: string;
  season: string; // e.g. "2025-2026 Güz", "2025-2026 Bahar"
  location: string;
  week_program: string;
  scope: string;
  evaluation: string;
}

export interface LmsStudent {
  id: string;
  name_surname: string;
  student_no: string;
  phone: string;
  email: string;
  university: string;
  department: string;
}

export interface LmsEvaluationResult {
  id?: string;
  student_id: string;
  course_id: string;
  evaluation_title: string;
  score: number;
  answers_json: string;
  file?: string | null;
  completed_at: string;
}

export type QuestionDifficulty = 'kolay' | 'normal' | 'zor';

export interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface QuestionStats {
  times_asked: number;
  times_correct: number;
  times_wrong: number;
  success_rate: number; // 0 to 100 percentage
}

export interface Question {
  id: string;
  course_id: string; // Matches LmsCourse.course_id or id
  text: string;
  options: QuestionOption[];
  correct_answer: string; // Option id: 'A', 'B', etc.
  explanation?: string;
  difficulty: QuestionDifficulty;
  stats: QuestionStats;
  created_at: string;
  topic?: string;
}

export type ExamType = 'vize' | 'final' | 'quiz' | 'deneme';

export interface Exam {
  id: string;
  title: string;
  course_id: string;
  exam_type: ExamType;
  duration_minutes: number;
  start_time: string; // ISO string
  end_time: string; // ISO string
  assigned_student_ids: string[]; // empty array means all enrolled students
  passing_grade: number; // default 50
  question_ids: string[];
  is_active: boolean;
  created_at: string;
}

export interface ShuffledQuestionForStudent {
  id: string;
  original_question_id: string;
  text: string;
  options: { id: string; text: string }[];
}

export interface StudentExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  student_name: string;
  student_no: string;
  course_id: string;
  started_at: string;
  completed_at?: string;
  duration_seconds_taken?: number;
  answers: Record<string, string>; // questionId -> selectedOptionId
  score?: number;
  max_score?: number;
  percentage?: number;
  passed?: boolean;
  total_questions: number;
  correct_count?: number;
  wrong_count?: number;
  empty_count?: number;
  shuffled_questions: ShuffledQuestionForStudent[];
  nocodb_synced?: boolean;
  nocodb_sync_at?: string;
  nocodb_sync_error?: string;
}

export interface NocoDBConfig {
  base_url: string; // e.g. "https://nocodb.yourdomain.com"
  api_token: string;
  project_id?: string;
  courses_table_id: string; // "m935015e01psf34"
  students_table_id: string; // "muuofbvrmpm5e5b"
  evaluation_table_id: string; // "md50zxh2syamk2i"
  auto_sync_vize: boolean;
  last_sync_time?: string;
}

export interface NocoDBSyncLog {
  id: string;
  timestamp: string;
  type: 'courses_fetch' | 'students_fetch' | 'vize_result_push' | 'test_connection';
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
}
