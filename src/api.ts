import {
  LmsCourse,
  LmsStudent,
  Question,
  Exam,
  StudentExamAttempt,
  OverviewAnalytics,
  StudentAnalytics,
  NocoDBConfig,
  NocoDBSyncLog,
} from './types';

export const api = {
  // Auth
  async login(username: string, credential: string): Promise<{
    success: boolean;
    role: 'student' | 'admin';
    student?: LmsStudent;
    user?: { name_surname: string; email: string; role: 'admin' };
  }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, credential }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Giriş başarısız');
    return json;
  },

  // Courses
  async getCourses(): Promise<LmsCourse[]> {
    const res = await fetch('/api/courses');
    const json = await res.json();
    return json.courses || [];
  },

  // Students
  async getStudents(): Promise<LmsStudent[]> {
    const res = await fetch('/api/students');
    const json = await res.json();
    return json.students || [];
  },

  // Questions
  async getQuestions(courseId?: string, difficulty?: string): Promise<Question[]> {
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId);
    if (difficulty) params.append('difficulty', difficulty);
    const res = await fetch(`/api/questions?${params.toString()}`);
    const json = await res.json();
    return json.questions || [];
  },

  async saveQuestion(question: Partial<Question>): Promise<Question> {
    const url = question.id && !question.id.startsWith('new_') ? `/api/questions/${question.id}` : '/api/questions';
    const method = question.id && !question.id.startsWith('new_') ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Soru kaydedilemedi');
    return json.question;
  },

  async deleteQuestion(id: string): Promise<boolean> {
    const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  },

  async importQuestions(questions: unknown[]): Promise<{ added: number; errors: string[] }> {
    const res = await fetch('/api/questions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questions),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Soru yükleme başarısız');
    return { added: json.added || 0, errors: json.errors || [] };
  },

  // Exams
  async getExams(courseId?: string): Promise<Exam[]> {
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId);
    const res = await fetch(`/api/exams?${params.toString()}`);
    const json = await res.json();
    return json.exams || [];
  },

  async saveExam(exam: Partial<Exam>): Promise<Exam> {
    const url = exam.id ? `/api/exams/${exam.id}` : '/api/exams';
    const method = exam.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Sınav kaydedilemedi');
    return json.exam;
  },

  async deleteExam(id: string): Promise<boolean> {
    const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  },

  // Attempts
  async startExam(examId: string, studentId: string): Promise<{ attempt: StudentExamAttempt; isNew: boolean }> {
    const res = await fetch(`/api/exams/${examId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Sınav başlatılamadı');
    return { attempt: json.attempt, isNew: json.isNew };
  },

  async getAttempt(id: string): Promise<StudentExamAttempt> {
    const res = await fetch(`/api/attempts/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Sınav oturumu bulunamadı');
    return json.attempt;
  },

  async getAttempts(examId?: string, studentId?: string): Promise<StudentExamAttempt[]> {
    const params = new URLSearchParams();
    if (examId) params.append('exam_id', examId);
    if (studentId) params.append('student_id', studentId);
    const res = await fetch(`/api/attempts?${params.toString()}`);
    const json = await res.json();
    return json.attempts || [];
  },

  async saveAnswer(attemptId: string, questionId: string, optionId: string): Promise<StudentExamAttempt> {
    const res = await fetch(`/api/attempts/${attemptId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, option_id: optionId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Yanıt kaydedilemedi');
    return json.attempt;
  },

  async submitAttempt(attemptId: string, answers: Record<string, string>): Promise<StudentExamAttempt> {
    const res = await fetch(`/api/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Sınav teslim edilemedi');
    return json.attempt;
  },

  // Analytics
  async getOverviewAnalytics(): Promise<OverviewAnalytics> {
    const res = await fetch('/api/analytics/overview');
    const json = await res.json();
    return json.data;
  },

  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    const res = await fetch(`/api/analytics/student/${studentId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Öğrenci analizi alınamadı');
    return json.data;
  },

  // NocoDB
  async getNocoDBConfig(): Promise<{ config: NocoDBConfig; logs: NocoDBSyncLog[] }> {
    const res = await fetch('/api/nocodb/config');
    const json = await res.json();
    return { config: json.config, logs: json.logs || [] };
  },

  async saveNocoDBConfig(cfg: Partial<NocoDBConfig>): Promise<NocoDBConfig> {
    const res = await fetch('/api/nocodb/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'NocoDB ayarı kaydedilemedi');
    return json.config;
  },

  async syncCourses(): Promise<{ count: number; message: string; courses: LmsCourse[] }> {
    const res = await fetch('/api/nocodb/sync-courses', { method: 'POST' });
    const json = await res.json();
    return json;
  },

  async syncStudents(): Promise<{ count: number; message: string; students: LmsStudent[] }> {
    const res = await fetch('/api/nocodb/sync-students', { method: 'POST' });
    const json = await res.json();
    return json;
  },
};
