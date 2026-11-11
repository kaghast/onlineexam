export interface LmsCourse {
  id: string;
  course_name: string;
  course_id: string;
  level: string;
  akts: number;
  course_code: string;
  university: string;
  season: string;
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

export type QuestionDifficulty = 'kolay' | 'normal' | 'zor';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionStats {
  times_asked: number;
  times_correct: number;
  times_wrong: number;
  success_rate: number;
}

export interface Question {
  id: string;
  course_id: string;
  text: string;
  options: QuestionOption[];
  correct_answer: string;
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
  start_time: string;
  end_time: string;
  assigned_student_ids: string[];
  passing_grade: number;
  question_ids: string[];
  is_active: boolean;
  created_at: string;
}

export interface ShuffledQuestionForStudent {
  id: string;
  original_question_id: string;
  text: string;
  options: { id: string; text: string; original_id?: string }[];
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
  answers: Record<string, string>;
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

export interface OverviewAnalytics {
  totalQuestions: number;
  totalExams: number;
  totalStudents: number;
  totalAttempts: number;
  avgScore: number;
  passRate: number;
  difficultyCounts: {
    kolay: number;
    normal: number;
    zor: number;
  };
  courseStats: {
    course_id: string;
    course_code: string;
    course_name: string;
    total_questions: number;
    attempts_count: number;
    average_score: number;
    pass_rate: number;
  }[];
  recentAttempts: StudentExamAttempt[];
}

export interface StudentAnalytics {
  student: LmsStudent;
  totalExamsTaken: number;
  avgScore: number;
  totalPassed: number;
  totalFailed: number;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  attempts: StudentExamAttempt[];
}

export interface NocoDBConfig {
  base_url: string;
  api_token: string;
  project_id?: string;
  courses_table_id: string;
  students_table_id: string;
  evaluation_table_id: string;
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
