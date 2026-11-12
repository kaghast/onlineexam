import fs from 'fs';
import path from 'path';
import {
  LmsCourse,
  LmsStudent,
  LmsCourseStudent,
  LmsEvaluationResult,
  Question,
  Exam,
  StudentExamAttempt,
  NocoDBConfig,
  NocoDBSyncLog,
  ShuffledQuestionForStudent,
} from './types.ts';

interface DatabaseSchema {
  courses: LmsCourse[];
  students: LmsStudent[];
  courses_students: LmsCourseStudent[];
  questions: Question[];
  exams: Exam[];
  attempts: StudentExamAttempt[];
  evaluations: LmsEvaluationResult[];
  nocodb_config: NocoDBConfig;
  nocodb_logs: NocoDBSyncLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Select a subset of questions respecting difficulty proportions and balance
function selectBalancedQuestions(
  pool: Question[],
  targetCount: number,
  customRatios?: { kolay?: number; normal?: number; zor?: number }
): Question[] {
  if (pool.length <= targetCount) {
    return shuffleArray(pool);
  }

  const kolayPool = shuffleArray(pool.filter((q) => q.difficulty === 'kolay'));
  const normalPool = shuffleArray(pool.filter((q) => q.difficulty === 'normal'));
  const zorPool = shuffleArray(pool.filter((q) => q.difficulty === 'zor'));

  // Default difficulty distribution: 30% kolay, 50% normal, 20% zor
  const rKolay = (customRatios?.kolay ?? 30) / 100;
  const rNormal = (customRatios?.normal ?? 50) / 100;

  let wantKolay = Math.round(targetCount * rKolay);
  let wantNormal = Math.round(targetCount * rNormal);
  let wantZor = targetCount - wantKolay - wantNormal;
  if (wantZor < 0) wantZor = 0;

  const selected: Question[] = [];
  const take = (bucket: Question[], count: number) => {
    const taken = bucket.splice(0, count);
    selected.push(...taken);
  };

  take(kolayPool, wantKolay);
  take(normalPool, wantNormal);
  take(zorPool, wantZor);

  // If some buckets had fewer questions than desired, fill the deficit from remaining
  const deficit = targetCount - selected.length;
  if (deficit > 0) {
    const remaining = [...normalPool, ...kolayPool, ...zorPool];
    selected.push(...remaining.slice(0, deficit));
  }

  return shuffleArray(selected);
}

// Initial seed data (All dummy data removed - real data originates from NocoDB or admin creation)
const initialCourses: LmsCourse[] = [];

const initialStudents: LmsStudent[] = [
  {
    id: "muuofbvrmpm5e5b_student_20262025100",
    name_surname: "Öğrenci (20262025100)",
    student_no: "20262025100",
    phone: "5326820717",
    email: "20262025100@ogr.uni.edu.tr",
    university: "İstanbul Teknik Üniversitesi",
    department: "Mühendislik Fakültesi",
  },
];

const initialQuestions: Question[] = [];

const initialExams: Exam[] = [];

const initialAttempts: StudentExamAttempt[] = [];

const initialEvaluations: LmsEvaluationResult[] = [];

const initialNocoDBConfig: NocoDBConfig = {
  base_url: process.env.NOCODB_URL || 'https://nocodb.app',
  api_token: process.env.NOCODB_API_TOKEN || 'GxfVYtB9acDdVyjrOklF8jEz6bHXt1x0gXN-n3bJ',
  courses_table_id: 'm935015e01psf34',
  students_table_id: 'muuofbvrmpm5e5b',
  courses_students_table_id: 'mfqru4rs0jp87fn',
  evaluation_table_id: 'md50zxh2syamk2i',
  auto_sync_vize: true,
};

function normalizePhone(p: string): string {
  const digits = (p || '').replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length === 12) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
  return digits;
}

class AcademicDatabase {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    let rawContent: string | null = null;
    try {
      if (fs.existsSync(DB_FILE)) {
        rawContent = fs.readFileSync(DB_FILE, 'utf-8');
      } else if (fs.existsSync(`${DB_FILE}.bak`)) {
        rawContent = fs.readFileSync(`${DB_FILE}.bak`, 'utf-8');
      }
    } catch (err) {
      console.error('Error reading database file:', err);
    }

    if (rawContent) {
      try {
        const parsed = JSON.parse(rawContent);
        const loadedStudents: LmsStudent[] = Array.isArray(parsed.students) ? [...parsed.students] : [...initialStudents];
        // Ensure default test student (20262025100) is always available
        for (const s of initialStudents) {
          if (!loadedStudents.some((item) => item.student_no === s.student_no)) {
            loadedStudents.push(s);
          }
        }

        return {
          courses: Array.isArray(parsed.courses) ? parsed.courses : initialCourses,
          students: loadedStudents,
          courses_students: Array.isArray(parsed.courses_students) ? parsed.courses_students : [],
          questions: Array.isArray(parsed.questions) ? parsed.questions : initialQuestions,
          exams: Array.isArray(parsed.exams) ? parsed.exams : initialExams,
          attempts: Array.isArray(parsed.attempts) ? parsed.attempts : initialAttempts,
          evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : initialEvaluations,
          nocodb_config: {
            ...initialNocoDBConfig,
            ...(parsed.nocodb_config || {}),
            courses_students_table_id:
              parsed.nocodb_config?.courses_students_table_id || initialNocoDBConfig.courses_students_table_id,
            api_token: parsed.nocodb_config?.api_token || initialNocoDBConfig.api_token,
          },
          nocodb_logs: Array.isArray(parsed.nocodb_logs) ? parsed.nocodb_logs : [],
        };
      } catch (err) {
        console.error('Error parsing db.json, initializing fresh store:', err);
      }
    }

    const fresh: DatabaseSchema = {
      courses: initialCourses,
      students: initialStudents,
      courses_students: [],
      questions: initialQuestions,
      exams: initialExams,
      attempts: initialAttempts,
      evaluations: initialEvaluations,
      nocodb_config: initialNocoDBConfig,
      nocodb_logs: [
        {
          id: 'log_init',
          timestamp: new Date().toISOString(),
          type: 'test_connection',
          status: 'success',
          message: 'Sistem başlatıldı. NocoDB lms_courses, lms_students, lms_courses_students ve lms_evaluation_results tabloları bağlandı.',
        },
      ],
    };

    this.saveDatabase(fresh);
    return fresh;
  }

  private saveDatabase(data: DatabaseSchema = this.db) {
    try {
      this.ensureDataDir();
      const tmpFile = `${DB_FILE}.tmp`;
      const bakFile = `${DB_FILE}.bak`;
      const jsonStr = JSON.stringify(data, null, 2);

      fs.writeFileSync(tmpFile, jsonStr, 'utf-8');

      // Preserve a backup copy of previous valid db file
      if (fs.existsSync(DB_FILE)) {
        try {
          fs.copyFileSync(DB_FILE, bakFile);
        } catch {
          // Ignore copy error
        }
      }

      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  // --- COURSES ---
  getCourses(): LmsCourse[] {
    return this.db.courses;
  }

  getCourse(idOrCode: unknown): LmsCourse | undefined {
    if (idOrCode === null || idOrCode === undefined) return undefined;
    const raw = String(idOrCode).trim();
    const target = raw.toLowerCase();

    return this.db.courses.find((c) => {
      const cId = String(c.id ?? '').trim();
      const cCourseId = String(c.course_id ?? '').trim();
      const cCode = String(c.course_code ?? '').trim();

      return (
        cId === raw ||
        cCourseId === raw ||
        cCode === raw ||
        cId.toLowerCase() === target ||
        cCourseId.toLowerCase() === target ||
        cCode.toLowerCase() === target
      );
    });
  }

  saveCourse(course: LmsCourse): LmsCourse {
    const existingIndex = this.db.courses.findIndex((c) => c.id === course.id || c.course_id === course.course_id);
    if (existingIndex >= 0) {
      this.db.courses[existingIndex] = { ...this.db.courses[existingIndex], ...course };
    } else {
      this.db.courses.push(course);
    }
    this.saveDatabase();
    return course;
  }

  // --- STUDENTS ---
  getStudents(): LmsStudent[] {
    return this.db.students;
  }

  getStudent(idOrNo: unknown): LmsStudent | undefined {
    if (idOrNo === null || idOrNo === undefined) return undefined;
    const raw = String(idOrNo).trim();
    const target = raw.toLowerCase();
    const targetTr = raw.toLocaleLowerCase('tr-TR');

    return this.db.students.find((s) => {
      const sId = String(s.id ?? '').trim();
      const sNo = String(s.student_no ?? '').trim();
      const sEmail = String(s.email ?? '').trim();

      return (
        sId === raw ||
        sNo === raw ||
        sId.toLowerCase() === target ||
        sNo.toLowerCase() === target ||
        sNo.toLocaleLowerCase('tr-TR') === targetTr ||
        (sEmail && sEmail.toLowerCase() === target)
      );
    });
  }

  saveStudent(student: LmsStudent): LmsStudent {
    const sId = String(student.id ?? '').trim();
    const sNo = String(student.student_no ?? '').trim();

    const normalizedStudent: LmsStudent = {
      ...student,
      id: sId || `student_${Date.now()}`,
      student_no: sNo,
      name_surname: String(student.name_surname ?? '').trim(),
      phone: String(student.phone ?? '').trim(),
      email: String(student.email ?? '').trim(),
      university: String(student.university ?? '').trim(),
      department: String(student.department ?? '').trim(),
    };

    const idx = this.db.students.findIndex(
      (s) =>
        (sId && String(s.id).trim() === sId) ||
        (sNo && String(s.student_no).trim() === sNo)
    );

    if (idx >= 0) {
      this.db.students[idx] = { ...this.db.students[idx], ...normalizedStudent };
    } else {
      this.db.students.push(normalizedStudent);
    }
    this.saveDatabase();
    return normalizedStudent;
  }

  // --- COURSE - STUDENT ENROLLMENTS (lms_courses_students - mfqru4rs0jp87fn) ---
  getCoursesStudents(): LmsCourseStudent[] {
    return this.db.courses_students || [];
  }

  saveCourseStudent(cs: LmsCourseStudent): LmsCourseStudent {
    if (!this.db.courses_students) this.db.courses_students = [];
    const idx = this.db.courses_students.findIndex((item) => item.id === cs.id);
    if (idx >= 0) {
      this.db.courses_students[idx] = cs;
    } else {
      this.db.courses_students.push(cs);
    }
    this.saveDatabase();
    return cs;
  }

  isStudentEnrolledInCourse(student: LmsStudent, courseIdOrCode: unknown): boolean {
    const enrollments = this.db.courses_students || [];
    // If no enrollments exist in db yet, allow access so offline/initial mode is functional
    if (enrollments.length === 0) return true;
    if (!student) return false;

    const course = this.getCourse(courseIdOrCode);
    const validCourseIdentifiers = new Set<string>();
    const cRaw = String(courseIdOrCode ?? '').trim();
    if (cRaw) {
      validCourseIdentifiers.add(cRaw);
      validCourseIdentifiers.add(cRaw.toLowerCase());
      validCourseIdentifiers.add(cRaw.toLocaleLowerCase('tr-TR'));
    }
    if (course) {
      if (course.id) {
        const idStr = String(course.id).trim();
        validCourseIdentifiers.add(idStr);
        validCourseIdentifiers.add(idStr.toLowerCase());
      }
      if (course.course_id) {
        const cidStr = String(course.course_id).trim();
        validCourseIdentifiers.add(cidStr);
        validCourseIdentifiers.add(cidStr.toLowerCase());
      }
      if (course.course_code) {
        const codeStr = String(course.course_code).trim();
        validCourseIdentifiers.add(codeStr);
        validCourseIdentifiers.add(codeStr.toLowerCase());
      }
    }

    const validStudentIdentifiers = new Set<string>();
    if (student.id !== undefined && student.id !== null) {
      const sid = String(student.id).trim();
      validStudentIdentifiers.add(sid);
      validStudentIdentifiers.add(sid.toLowerCase());
    }
    if (student.student_no) {
      const sno = String(student.student_no).trim();
      validStudentIdentifiers.add(sno);
      validStudentIdentifiers.add(sno.toLowerCase());
      validStudentIdentifiers.add(sno.toLocaleLowerCase('tr-TR'));
    }
    if (student.email) {
      const semail = String(student.email).trim();
      validStudentIdentifiers.add(semail);
      validStudentIdentifiers.add(semail.toLowerCase());
    }

    return enrollments.some((enr) => {
      const enrCourse = String(enr.course_id || '').trim();
      const enrStudent = String(enr.student_id || '').trim();

      const courseMatch =
        validCourseIdentifiers.has(enrCourse) ||
        validCourseIdentifiers.has(enrCourse.toLowerCase()) ||
        validCourseIdentifiers.has(enrCourse.toLocaleLowerCase('tr-TR'));

      const studentMatch =
        validStudentIdentifiers.has(enrStudent) ||
        validStudentIdentifiers.has(enrStudent.toLowerCase()) ||
        validStudentIdentifiers.has(enrStudent.toLocaleLowerCase('tr-TR'));

      return courseMatch && studentMatch;
    });
  }

  // --- QUESTIONS ---
  getQuestions(courseId?: string, difficulty?: string): Question[] {
    let list = this.db.questions;
    if (courseId && courseId !== 'all') {
      list = list.filter((q) => q.course_id === courseId);
    }
    if (difficulty && difficulty !== 'all') {
      list = list.filter((q) => q.difficulty === difficulty);
    }
    return list;
  }

  getQuestion(id: string): Question | undefined {
    return this.db.questions.find((q) => q.id === id);
  }

  saveQuestion(question: Partial<Question>): Question {
    const id = question.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const existingIdx = this.db.questions.findIndex((q) => q.id === id);

    const fullQuestion: Question = {
      id,
      course_id: question.course_id || 'BLG201',
      text: question.text || '',
      options: question.options && question.options.length ? question.options : [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correct_answer: question.correct_answer || 'A',
      explanation: question.explanation || '',
      difficulty: question.difficulty || 'normal',
      stats: question.stats || {
        times_asked: 0,
        times_correct: 0,
        times_wrong: 0,
        success_rate: 0,
      },
      created_at: question.created_at || new Date().toISOString(),
      topic: question.topic || '',
    };

    if (existingIdx >= 0) {
      this.db.questions[existingIdx] = {
        ...this.db.questions[existingIdx],
        ...fullQuestion,
      };
    } else {
      this.db.questions.push(fullQuestion);
    }
    this.saveDatabase();
    return fullQuestion;
  }

  deleteQuestion(id: string): boolean {
    const prevLen = this.db.questions.length;
    this.db.questions = this.db.questions.filter((q) => q.id !== id);
    if (this.db.questions.length !== prevLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- IMAGE UPLOADS FOR QUESTIONS ---
  saveUploadImage(base64Data: string, originalName?: string): string {
    const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    let ext = 'png';
    let rawBase64 = base64Data;
    const match = base64Data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      const mime = match[1].toLowerCase();
      ext = mime === 'jpeg' ? 'jpg' : mime === 'svg+xml' ? 'svg' : mime;
      rawBase64 = match[2];
    } else if (originalName && originalName.includes('.')) {
      ext = originalName.split('.').pop() || 'png';
    }

    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(rawBase64, 'base64'));
    return `/api/uploads/${filename}`;
  }

  importQuestions(importedQuestions: unknown[]): { added: number; errors: string[] } {
    const errors: string[] = [];
    let added = 0;

    if (!Array.isArray(importedQuestions)) {
      return { added: 0, errors: ['Girdi verisi bir JSON dizisi olmalıdır'] };
    }

    for (let i = 0; i < importedQuestions.length; i++) {
      const item = importedQuestions[i] as Record<string, unknown>;
      if (!item.text || typeof item.text !== 'string') {
        errors.push(`Satır ${i + 1}: Soru metni (text) eksik.`);
        continue;
      }
      if (!item.options || !Array.isArray(item.options) || item.options.length < 2) {
        errors.push(`Satır ${i + 1}: En az 2 şık (options) gereklidir.`);
        continue;
      }
      if (!item.correct_answer || typeof item.correct_answer !== 'string') {
        errors.push(`Satır ${i + 1}: Doğru cevap (correct_answer) eksik.`);
        continue;
      }

      const qCourseId = (item.course_id as string) || 'BLG201';
      const qDifficulty = (['kolay', 'normal', 'zor'].includes(item.difficulty as string)
        ? item.difficulty
        : 'normal') as Question['difficulty'];

      this.saveQuestion({
        course_id: qCourseId,
        text: item.text,
        options: item.options as { id: string; text: string }[],
        correct_answer: item.correct_answer,
        explanation: (item.explanation as string) || '',
        difficulty: qDifficulty,
        topic: (item.topic as string) || '',
      });
      added++;
    }

    return { added, errors };
  }

  // --- EXAMS ---
  getExams(courseId?: string, student?: LmsStudent): Exam[] {
    let list = this.db.exams;
    if (courseId && courseId !== 'all') {
      list = list.filter((e) => e.course_id === courseId);
    }
    if (student) {
      list = list.filter((e) => this.isStudentEnrolledInCourse(student, e.course_id));
    }
    return list;
  }

  getExam(id: string): Exam | undefined {
    return this.db.exams.find((e) => e.id === id);
  }

  saveExam(exam: Partial<Exam>): Exam {
    const id = exam.id || `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existingIdx = this.db.exams.findIndex((e) => e.id === id);

    const fullExam: Exam = {
      id,
      title: exam.title || 'Yeni Sınav',
      course_id: exam.course_id || 'BLG201',
      exam_type: exam.exam_type || 'quiz',
      duration_minutes: exam.duration_minutes || 30,
      start_time: exam.start_time || new Date().toISOString(),
      end_time: exam.end_time || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assigned_student_ids: exam.assigned_student_ids || [],
      passing_grade: exam.passing_grade || 50,
      question_ids: exam.question_ids || [],
      question_count: exam.question_count && exam.question_count > 0 ? exam.question_count : undefined,
      difficulty_ratio: exam.difficulty_ratio || { kolay: 30, normal: 50, zor: 20 },
      is_active: exam.is_active !== undefined ? exam.is_active : true,
      created_at: exam.created_at || new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      this.db.exams[existingIdx] = fullExam;
    } else {
      this.db.exams.push(fullExam);
    }
    this.saveDatabase();
    return fullExam;
  }

  deleteExam(id: string): boolean {
    const len = this.db.exams.length;
    this.db.exams = this.db.exams.filter((e) => e.id !== id);
    if (this.db.exams.length !== len) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- ATTEMPTS & EXAM RUNTIME (UNIQUE PER STUDENT SHUFFLE) ---
  getAttempts(examId?: string, studentId?: string): StudentExamAttempt[] {
    let list = this.db.attempts;
    if (examId) list = list.filter((a) => a.exam_id === examId);
    if (studentId) list = list.filter((a) => a.student_id === studentId);
    return list;
  }

  getAttempt(id: string): StudentExamAttempt | undefined {
    return this.db.attempts.find((a) => a.id === id);
  }

  /**
   * Start an exam for a student.
   * Crucial rule: Questions AND choices (options) must be SHUFFLED uniquely per student!
   * Automatically verifies enrollment in lms_courses_students (mfqru4rs0jp87fn).
   * Automatically samples exam.question_count questions with balanced difficulty proportions.
   * "Sınavı başlatırsa öğrenci sınavdan çıkarsa sınavı tamamlandı say."
   * If student previously started this exam, it is considered completed and cannot be re-taken.
   */
  async startExamAttempt(examId: string, studentId: string): Promise<{ attempt: StudentExamAttempt; isNew: boolean }> {
    const exam = this.getExam(examId);
    if (!exam) throw new Error('Sınav bulunamadı');

    const student = this.getStudent(studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    // Check if within time window
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    if (now < startTime) {
      throw new Error(`Sınav henüz başlamamıştır. Başlangıç zamanı: ${startTime.toLocaleString('tr-TR')}`);
    }
    if (now > endTime) {
      throw new Error(`Sınavın süresi dolmuştur. Bitiş zamanı: ${endTime.toLocaleString('tr-TR')}`);
    }

    // Check enrollment from lms_courses_students (mfqru4rs0jp87fn)
    if (!this.isStudentEnrolledInCourse(student, exam.course_id)) {
      throw new Error(`Bu dersi (${exam.course_id}) almadığınız için sınava giriş yetkiniz bulunmamaktadır (lms_courses_students eşleşmesi bulunamadı).`);
    }

    // Check if legacy manual assigned_student_ids was set
    if (
      exam.assigned_student_ids &&
      exam.assigned_student_ids.length > 0 &&
      !exam.assigned_student_ids.map((id) => String(id).trim()).includes(String(student.id).trim())
    ) {
      throw new Error('Bu sınav size atanmamıştır.');
    }

    // Check for existing attempt: if started once and exited, the exam is completed!
    const existingAttempt = this.db.attempts.find(
      (a) =>
        a.exam_id === examId &&
        (String(a.student_id).trim() === String(student.id).trim() ||
          (student.student_no && String(a.student_no).trim() === String(student.student_no).trim()))
    );
    if (existingAttempt) {
      if (!existingAttempt.completed_at) {
        await this.submitExamAttempt(existingAttempt.id);
      }
      throw new Error('Bu sınava daha önce başlanmıştır. Sınavdan çıkış yapıldığı için oturumunuz tamamlanmıştır ve tekrar sınava girilemez.');
    }

    // Gather question pool
    const pool = exam.question_ids
      .map((qid) => this.getQuestion(qid))
      .filter((q): q is Question => q !== undefined);

    if (pool.length === 0) {
      throw new Error('Bu sınavda soru bulunmamaktadır.');
    }

    // Sample question_count questions respecting difficulty ratios if specified
    const targetQCount =
      exam.question_count && exam.question_count > 0 && exam.question_count < pool.length
        ? exam.question_count
        : pool.length;

    const sampledQuestions = selectBalancedQuestions(pool, targetQCount, exam.difficulty_ratio);

    // 1. Shuffle question order uniquely for this student
    const shuffledQList = shuffleArray(sampledQuestions);

    // 2. Shuffle options for each question uniquely for this student
    const studentShuffledQuestions: ShuffledQuestionForStudent[] = shuffledQList.map((q) => {
      const shuffledOptions = shuffleArray(q.options).map((opt, idx) => {
        const optionLabel = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D', 'E'
        return {
          id: optionLabel, // Client sees A, B, C, D
          original_id: opt.id,
          text: opt.text,
        };
      });

      return {
        id: q.id,
        original_question_id: q.id,
        text: q.text,
        options: shuffledOptions,
      };
    });

    const newAttempt: StudentExamAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      exam_id: exam.id,
      student_id: student.id,
      student_name: student.name_surname,
      student_no: student.student_no,
      course_id: exam.course_id,
      started_at: new Date().toISOString(),
      answers: {},
      total_questions: studentShuffledQuestions.length,
      shuffled_questions: studentShuffledQuestions,
      nocodb_synced: false,
    };

    this.db.attempts.push(newAttempt);
    this.saveDatabase();
    return { attempt: newAttempt, isNew: true };
  }

  /**
   * Save partial answer during exam
   */
  saveAnswer(attemptId: string, questionId: string, selectedOptionId: string): StudentExamAttempt {
    const attempt = this.getAttempt(attemptId);
    if (!attempt) throw new Error('Oturum bulunamadı');
    if (attempt.completed_at) throw new Error('Tamamlanmış sınav yanıtlanamaz');

    attempt.answers[questionId] = selectedOptionId;
    this.saveDatabase();
    return attempt;
  }

  /**
   * Submit attempt, calculate grade, dynamically recalculate question difficulties,
   * and if exam is 'vize', sync to NocoDB lms_evaluation_results.
   */
  async submitExamAttempt(attemptId: string, finalAnswers?: Record<string, string>): Promise<StudentExamAttempt> {
    const attempt = this.getAttempt(attemptId);
    if (!attempt) throw new Error('Oturum bulunamadı');
    if (attempt.completed_at) return attempt; // already submitted

    const exam = this.getExam(attempt.exam_id);
    if (!exam) throw new Error('Sınav bulunamadı');

    const answers = finalAnswers || attempt.answers;
    attempt.answers = answers;
    attempt.completed_at = new Date().toISOString();

    const startTime = new Date(attempt.started_at).getTime();
    const endTime = new Date(attempt.completed_at).getTime();
    attempt.duration_seconds_taken = Math.max(1, Math.round((endTime - startTime) / 1000));

    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;

    // Grade each question
    for (const sq of attempt.shuffled_questions) {
      const originalQ = this.getQuestion(sq.original_question_id);
      if (!originalQ) continue;

      const studentChosenLabel = answers[sq.id]; // e.g. 'A', 'B'

      if (!studentChosenLabel) {
        emptyCount++;
        // Stat update: answered empty
        continue;
      }

      // Map studentChosenLabel back to original option id
      const chosenOptionObj = sq.options.find((o) => o.id === studentChosenLabel) as
        | { id: string; original_id?: string; text: string }
        | undefined;

      const originalChosenId = chosenOptionObj?.original_id || studentChosenLabel;
      const isCorrect = originalChosenId === originalQ.correct_answer;

      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      // Dynamic difficulty adjustment on question!
      // Update statistics
      if (!originalQ.stats) {
        originalQ.stats = { times_asked: 0, times_correct: 0, times_wrong: 0, success_rate: 0 };
      }
      originalQ.stats.times_asked += 1;
      if (isCorrect) {
        originalQ.stats.times_correct += 1;
      } else {
        originalQ.stats.times_wrong += 1;
      }
      originalQ.stats.success_rate = Math.round(
        (originalQ.stats.times_correct / originalQ.stats.times_asked) * 100
      );

      // Recalibrate difficulty based on user responses:
      // > 75% -> kolay, 40% - 75% -> normal, < 40% -> zor
      if (originalQ.stats.times_asked >= 2) {
        if (originalQ.stats.success_rate > 75) {
          originalQ.difficulty = 'kolay';
        } else if (originalQ.stats.success_rate >= 40) {
          originalQ.difficulty = 'normal';
        } else {
          originalQ.difficulty = 'zor';
        }
      }
    }

    const totalQuestions = attempt.shuffled_questions.length;
    const scorePerQuestion = totalQuestions > 0 ? 100 / totalQuestions : 0;
    const rawScore = Math.round(correctCount * scorePerQuestion);

    attempt.total_questions = totalQuestions;
    attempt.correct_count = correctCount;
    attempt.wrong_count = wrongCount;
    attempt.empty_count = emptyCount;
    attempt.max_score = 100;
    attempt.score = rawScore;
    attempt.percentage = rawScore;
    attempt.passed = rawScore >= exam.passing_grade;

    // Record evaluation
    const evaluationEntry: LmsEvaluationResult = {
      id: `eval_${Date.now()}`,
      student_id: attempt.student_id,
      course_id: exam.course_id,
      evaluation_title: exam.title,
      score: rawScore,
      answers_json: JSON.stringify(answers),
      file: null,
      completed_at: attempt.completed_at,
    };
    this.db.evaluations.push(evaluationEntry);

    // Check if exam is Vize and NocoDB sync is requested:
    // "Sınav vize olarak işaretlendiyse vize sınavının sonucu nobodb'deki değerlendirme tablosuna
    // öğrencinin sınav notu olarak yazılacak. Tablonun adı: lms_evaluation_results ID'si: md50zxh2syamk2i"
    if (exam.exam_type === 'vize') {
      try {
        const syncResult = await this.pushEvaluationToNocoDB(evaluationEntry);
        attempt.nocodb_synced = syncResult.success;
        attempt.nocodb_sync_at = new Date().toISOString();
        if (!syncResult.success) {
          attempt.nocodb_sync_error = syncResult.message;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        attempt.nocodb_synced = false;
        attempt.nocodb_sync_error = errMsg;
      }
    }

    this.saveDatabase();
    return attempt;
  }

  // --- NOCODB SYNC ENGINE ---
  getNocoDBConfig(): NocoDBConfig {
    return this.db.nocodb_config;
  }

  saveNocoDBConfig(cfg: Partial<NocoDBConfig>): NocoDBConfig {
    this.db.nocodb_config = {
      ...this.db.nocodb_config,
      ...cfg,
    };
    this.saveDatabase();
    return this.db.nocodb_config;
  }

  getNocoDBLogs(): NocoDBSyncLog[] {
    return this.db.nocodb_logs.slice(-50).reverse();
  }

  addNocoDBLog(log: Omit<NocoDBSyncLog, 'id' | 'timestamp'>) {
    const newLog: NocoDBSyncLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.db.nocodb_logs.push(newLog);
    if (this.db.nocodb_logs.length > 200) {
      this.db.nocodb_logs = this.db.nocodb_logs.slice(-200);
    }
    this.saveDatabase();
  }

  /**
   * Pushes single evaluation result to NocoDB table `lms_evaluation_results` (ID: `md50zxh2syamk2i`)
   */
  async pushEvaluationToNocoDB(evalData: LmsEvaluationResult): Promise<{ success: boolean; message: string }> {
    const cfg = this.db.nocodb_config;
    if (!cfg.base_url || !cfg.api_token) {
      const msg = 'NocoDB API Token veya URL yapılandırılmamış. Sonuç yerel veritabanında saklandı ve senkronizasyon kuyruğuna alındı.';
      this.addNocoDBLog({
        type: 'vize_result_push',
        status: 'warning',
        message: msg,
        details: { evalData },
      });
      return { success: false, message: msg };
    }

    try {
      const tableId = cfg.evaluation_table_id || 'md50zxh2syamk2i';
      const endpoint = `${cfg.base_url.replace(/\/$/, '')}/api/v2/tables/${tableId}/records`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'xc-token': cfg.api_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: evalData.student_id,
          course_id: evalData.course_id,
          evaluation_title: evalData.evaluation_title,
          score: evalData.score,
          answers_json: evalData.answers_json,
          file: evalData.file,
          completed_at: evalData.completed_at,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`NocoDB API Hatası (${response.status}): ${errText}`);
      }

      this.addNocoDBLog({
        type: 'vize_result_push',
        status: 'success',
        message: `Vize sonucu NocoDB (${tableId}) tablosuna başarıyla yazıldı. Öğrenci: ${evalData.student_id}, Not: ${evalData.score}`,
        details: { evalData },
      });

      return { success: true, message: 'NocoDB ile senkronize edildi' };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.addNocoDBLog({
        type: 'vize_result_push',
        status: 'error',
        message: `NocoDB Vize senkronizasyon hatası: ${errMsg}`,
        details: { error: errMsg, evalData },
      });
      return { success: false, message: errMsg };
    }
  }

  /**
   * Syncs courses from NocoDB table `lms_courses` (`m935015e01psf34`)
   */
  async syncCoursesFromNocoDB(): Promise<{ count: number; message: string }> {
    const cfg = this.db.nocodb_config;
    if (!cfg.base_url || !cfg.api_token) {
      return {
        count: this.db.courses.length,
        message: 'NocoDB API bilgileri girilmediği için yerel ders havuzu (4 ders) kullanılıyor.',
      };
    }

    try {
      const tableId = cfg.courses_table_id || 'm935015e01psf34';
      const endpoint = `${cfg.base_url.replace(/\/$/, '')}/api/v2/tables/${tableId}/records?limit=100`;

      const response = await fetch(endpoint, {
        headers: { 'xc-token': cfg.api_token },
      });

      if (!response.ok) {
        throw new Error(`Dersler çekilemedi (${response.status}): ${await response.text()}`);
      }

      const data = await response.json();
      const records = data.list || data.records || [];
      let updated = 0;

      for (const r of records) {
        const course: LmsCourse = {
          id: r.Id || r.id || `course_${Date.now()}`,
          course_name: r.course_name || 'İsimsiz Ders',
          course_id: r.course_id || r.course_code || 'CRS00',
          level: r.level || 'Lisans',
          akts: Number(r.akts) || 5,
          course_code: r.course_code || r.course_id || '',
          university: r.university || '',
          season: r.season || '2025-2026 Güz',
          location: r.location || '',
          week_program: r.week_program || '',
          scope: r.scope || '',
          evaluation: r.evaluation || '',
        };
        this.saveCourse(course);
        updated++;
      }

      this.addNocoDBLog({
        type: 'courses_fetch',
        status: 'success',
        message: `NocoDB (${tableId}) tablosundan ${updated} ders başarıyla çekildi/güncellendi.`,
      });

      return { count: updated, message: `${updated} ders başarıyla NocoDB'den güncellendi.` };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.addNocoDBLog({
        type: 'courses_fetch',
        status: 'error',
        message: `NocoDB ders çekme hatası: ${errMsg}`,
      });
      return { count: 0, message: errMsg };
    }
  }

  /**
   * Syncs students from NocoDB table `lms_students` (`muuofbvrmpm5e5b`)
   */
  async syncStudentsFromNocoDB(): Promise<{ count: number; message: string }> {
    const cfg = this.db.nocodb_config;
    if (!cfg.base_url || !cfg.api_token) {
      return {
        count: this.db.students.length,
        message: 'NocoDB API bilgileri girilmediği için yerel öğrenci veritabanı kullanılıyor.',
      };
    }

    try {
      const tableId = cfg.students_table_id || 'muuofbvrmpm5e5b';
      const endpoint = `${cfg.base_url.replace(/\/$/, '')}/api/v2/tables/${tableId}/records?limit=100`;

      const response = await fetch(endpoint, {
        headers: { 'xc-token': cfg.api_token },
      });

      if (!response.ok) {
        throw new Error(`Öğrenciler çekilemedi (${response.status}): ${await response.text()}`);
      }

      const data = await response.json();
      const records = data.list || data.records || [];
      let updated = 0;

      for (const r of records) {
        const student: LmsStudent = {
          id: r.Id || r.id || `student_${Date.now()}`,
          name_surname: r.name_surname || 'İsimsiz Öğrenci',
          student_no: r.student_no || '',
          phone: r.phone || '',
          email: r.email || '',
          university: r.university || '',
          department: r.department || '',
        };
        this.saveStudent(student);
        updated++;
      }

      this.addNocoDBLog({
        type: 'students_fetch',
        status: 'success',
        message: `NocoDB (${tableId}) tablosundan ${updated} öğrenci başarıyla çekildi.`,
      });

      return { count: updated, message: `${updated} öğrenci başarıyla senkronize edildi.` };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.addNocoDBLog({
        type: 'students_fetch',
        status: 'error',
        message: `NocoDB öğrenci çekme hatası: ${errMsg}`,
      });
      return { count: 0, message: errMsg };
    }
  }

  /**
   * Syncs course-student enrollments from NocoDB table `lms_courses_students` (`mfqru4rs0jp87fn`)
   */
  async syncCoursesStudentsFromNocoDB(): Promise<{ count: number; message: string }> {
    const cfg = this.db.nocodb_config;
    if (!cfg.base_url || !cfg.api_token) {
      return {
        count: (this.db.courses_students || []).length,
        message: 'NocoDB API bilgileri girilmediği için yerel kayıtlar kullanılıyor.',
      };
    }

    try {
      const tableId = cfg.courses_students_table_id || 'mfqru4rs0jp87fn';
      const endpoint = `${cfg.base_url.replace(/\/$/, '')}/api/v2/tables/${tableId}/records?limit=500`;

      const response = await fetch(endpoint, {
        headers: { 'xc-token': cfg.api_token },
      });

      if (!response.ok) {
        throw new Error(`Ders-öğrenci kayıtları çekilemedi (${response.status}): ${await response.text()}`);
      }

      const data = await response.json();
      const records = data.list || data.records || [];
      const synced: LmsCourseStudent[] = [];

      for (const r of records) {
        const enr: LmsCourseStudent = {
          id: String(r.Id || r.id || `cs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
          course_id: String(r.course_id || r.course_code || r.CourseId || '').trim(),
          student_id: String(r.student_id || r.student_no || r.StudentId || '').trim(),
        };
        if (enr.course_id && enr.student_id) {
          synced.push(enr);
        }
      }

      this.db.courses_students = synced;
      this.saveDatabase();

      this.addNocoDBLog({
        type: 'enrollments_fetch',
        status: 'success',
        message: `NocoDB (${tableId}) tablosundan ${synced.length} ders-öğrenci eşleşmesi başarıyla çekildi.`,
      });

      return { count: synced.length, message: `${synced.length} ders-öğrenci kaydı başarıyla NocoDB'den güncellendi.` };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.addNocoDBLog({
        type: 'enrollments_fetch',
        status: 'error',
        message: `NocoDB ders-öğrenci çekme hatası: ${errMsg}`,
      });
      return { count: 0, message: errMsg };
    }
  }

  // --- ANALYTICS CALCULATIONS ---
  getOverviewAnalytics() {
    const totalQuestions = this.db.questions.length;
    const totalExams = this.db.exams.length;
    const totalStudents = this.db.students.length;
    const totalAttempts = this.db.attempts.filter((a) => a.completed_at).length;

    const completedAttempts = this.db.attempts.filter((a) => a.completed_at && a.score !== undefined);
    const avgScore =
      completedAttempts.length > 0
        ? Math.round(completedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedAttempts.length)
        : 0;

    const passCount = completedAttempts.filter((a) => a.passed).length;
    const passRate = completedAttempts.length > 0 ? Math.round((passCount / completedAttempts.length) * 100) : 0;

    // Difficulty counts
    const difficultyCounts = {
      kolay: this.db.questions.filter((q) => q.difficulty === 'kolay').length,
      normal: this.db.questions.filter((q) => q.difficulty === 'normal').length,
      zor: this.db.questions.filter((q) => q.difficulty === 'zor').length,
    };

    // Course performance breakdown
    const courseStats = this.db.courses.map((course) => {
      const courseAttempts = completedAttempts.filter((a) => a.course_id === course.course_id);
      const courseAvg =
        courseAttempts.length > 0
          ? Math.round(courseAttempts.reduce((s, a) => s + (a.score || 0), 0) / courseAttempts.length)
          : 0;
      const coursePassCount = courseAttempts.filter((a) => a.passed).length;
      const coursePassRate =
        courseAttempts.length > 0 ? Math.round((coursePassCount / courseAttempts.length) * 100) : 0;
      const questionCount = this.db.questions.filter((q) => q.course_id === course.course_id).length;

      return {
        course_id: course.course_id,
        course_code: course.course_code,
        course_name: course.course_name,
        total_questions: questionCount,
        attempts_count: courseAttempts.length,
        average_score: courseAvg,
        pass_rate: coursePassRate,
      };
    });

    return {
      totalQuestions,
      totalExams,
      totalStudents,
      totalAttempts,
      avgScore,
      passRate,
      difficultyCounts,
      courseStats,
      recentAttempts: completedAttempts.slice(-8).reverse(),
    };
  }

  getStudentAnalytics(studentId: string) {
    const student = this.getStudent(studentId);
    if (!student) return null;

    const attempts = this.db.attempts
      .filter((a) => a.student_id === student.id && a.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

    const totalExamsTaken = attempts.length;
    const avgScore =
      totalExamsTaken > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalExamsTaken)
        : 0;
    const totalPassed = attempts.filter((a) => a.passed).length;
    const totalFailed = totalExamsTaken - totalPassed;

    let totalCorrect = 0;
    let totalWrong = 0;
    let totalEmpty = 0;
    attempts.forEach((a) => {
      totalCorrect += a.correct_count || 0;
      totalWrong += a.wrong_count || 0;
      totalEmpty += a.empty_count || 0;
    });

    return {
      student,
      totalExamsTaken,
      avgScore,
      totalPassed,
      totalFailed,
      totalCorrect,
      totalWrong,
      totalEmpty,
      attempts,
    };
  }

  async authenticateUser(usernameOrNo: string, credentialOrPhone: string) {
    const trimmedUser = (usernameOrNo || '').trim();
    const trimmedCred = (credentialOrPhone || '').trim();

    if (!trimmedUser) {
      throw new Error('Lütfen öğrenci numaranızı veya e-posta adresinizi giriniz.');
    }
    if (!trimmedCred) {
      throw new Error('Lütfen cep telefonu numaranızı veya şifrenizi giriniz.');
    }

    // 1. Admin login check
    // "Admin'de aynı giriş formuna öğrenci numarası yerine kemalsahin@gmail.com mail adresini yazarsa ve senin belirlediğin bir şifreyi de cep numarası kutusuna yazarsa admin olarak girsin."
    const ADMIN_EMAIL = 'kemalsahin@gmail.com';
    const VALID_ADMIN_PASSWORDS = ['admin123', 'Admin2025!', '123456', 'admin', 'kemal123'];

    if (trimmedUser.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (VALID_ADMIN_PASSWORDS.includes(trimmedCred)) {
        return {
          role: 'admin' as const,
          user: {
            id: 'admin_kemal',
            name_surname: 'Kemal Şahin',
            email: ADMIN_EMAIL,
            role: 'admin' as const,
          },
        };
      } else {
        throw new Error('Geçersiz yönetici şifresi.');
      }
    }

    // 2. Student login check
    // Check local database first using getStudent (handles student_no, id, email, and Turkish case-insensitivity)
    let student = this.getStudent(trimmedUser);

    // If not found in local db, attempt to lookup in NocoDB in real-time
    if (!student && this.db.nocodb_config.base_url && this.db.nocodb_config.api_token) {
      try {
        const cfg = this.db.nocodb_config;
        const tableId = cfg.students_table_id || 'muuofbvrmpm5e5b';
        const nocoUrl = `${cfg.base_url.replace(/\/$/, '')}/api/v2/tables/${tableId}/records?where=(student_no,eq,${encodeURIComponent(trimmedUser)})&limit=1`;
        const nocoRes = await fetch(nocoUrl, {
          headers: { 'xc-token': cfg.api_token },
          signal: AbortSignal.timeout(3500),
        });

        if (nocoRes.ok) {
          const data = await nocoRes.json();
          const records = data.list || data.records || [];
          if (records.length > 0) {
            const r = records[0];
            const fetchedStudent: LmsStudent = {
              id: r.Id || r.id || `student_${Date.now()}`,
              name_surname: r.name_surname || r.NameSurname || r.name || 'Öğrenci',
              student_no: String(r.student_no || trimmedUser).trim(),
              phone: String(r.phone || r.phone_number || '').trim(),
              email: String(r.email || '').trim(),
              university: r.university || '',
              department: r.department || '',
            };
            this.saveStudent(fetchedStudent);
            student = fetchedStudent;
          }
        }
      } catch (err) {
        console.warn('NocoDB real-time student lookup error:', err);
      }
    }

    if (!student) {
      throw new Error(`'${trimmedUser}' numaralı kayıtlı öğrenci bulunamadı. Lütfen öğrenci numaranızı kontrol ediniz.`);
    }

    // Compare phone number
    const inputDigits = normalizePhone(trimmedCred);
    const studentDigits = normalizePhone(student.phone);

    const isPhoneMatch =
      inputDigits === studentDigits ||
      (inputDigits.length >= 7 && studentDigits.endsWith(inputDigits)) ||
      (studentDigits.length >= 7 && inputDigits.endsWith(studentDigits));

    if (!isPhoneMatch) {
      throw new Error('Girdiğiniz cep telefonu numarası bu öğrenci kaydıyla uyuşmuyor.');
    }

    return {
      role: 'student' as const,
      student,
    };
  }
}

export const db = new AcademicDatabase();
