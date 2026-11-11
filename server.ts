import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command-line arguments (e.g. --port 3000 --host 0.0.0.0)
function getArg(name: string): string | undefined {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === `--${name}` && args[i + 1]) {
      return args[i + 1];
    }
    if (args[i].startsWith(`--${name}=`)) {
      return args[i].split('=')[1];
    }
  }
  return undefined;
}

const app = express();
const PORT = Number(getArg('port') || process.env.PORT) || 3000;
const HOST = getArg('host') || '0.0.0.0';

app.use(express.json({ limit: '10mb' }));

// --- API ROUTES ---

// Authentication (Students: student_no + phone, Admin: kemalsahin@gmail.com + password)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, credential } = req.body;
    const authResult = await db.authenticateUser(username, credential);
    res.json({ success: true, ...authResult });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(401).json({ success: false, error: msg });
  }
});

// Courses (lms_courses - m935015e01psf34)
app.get('/api/courses', (_req: Request, res: Response) => {
  res.json({ success: true, courses: db.getCourses() });
});

app.post('/api/courses', (req: Request, res: Response) => {
  try {
    const course = db.saveCourse(req.body);
    res.json({ success: true, course });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

// Students (lms_students - muuofbvrmpm5e5b)
app.get('/api/students', (_req: Request, res: Response) => {
  res.json({ success: true, students: db.getStudents() });
});

app.post('/api/students', (req: Request, res: Response) => {
  try {
    const student = db.saveStudent(req.body);
    res.json({ success: true, student });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

// Questions Bank
app.get('/api/questions', (req: Request, res: Response) => {
  const courseId = req.query.course_id as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const questions = db.getQuestions(courseId, difficulty);
  res.json({ success: true, questions });
});

app.post('/api/questions', (req: Request, res: Response) => {
  try {
    const question = db.saveQuestion(req.body);
    res.json({ success: true, question });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

app.put('/api/questions/:id', (req: Request, res: Response) => {
  try {
    const question = db.saveQuestion({ ...req.body, id: req.params.id });
    res.json({ success: true, question });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

app.delete('/api/questions/:id', (req: Request, res: Response) => {
  const success = db.deleteQuestion(req.params.id);
  res.json({ success });
});

// Questions Bulk Import & Export
app.post('/api/questions/import', (req: Request, res: Response) => {
  try {
    const result = db.importQuestions(req.body);
    res.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

app.get('/api/questions/export', (req: Request, res: Response) => {
  const courseId = req.query.course_id as string | undefined;
  const questions = db.getQuestions(courseId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="soru_havuzu_export.json"');
  res.send(JSON.stringify(questions, null, 2));
});

// Exams Management
app.get('/api/exams', (req: Request, res: Response) => {
  const courseId = req.query.course_id as string | undefined;
  const exams = db.getExams(courseId);
  res.json({ success: true, exams });
});

app.post('/api/exams', (req: Request, res: Response) => {
  try {
    const exam = db.saveExam(req.body);
    res.json({ success: true, exam });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

app.put('/api/exams/:id', (req: Request, res: Response) => {
  try {
    const exam = db.saveExam({ ...req.body, id: req.params.id });
    res.json({ success: true, exam });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

app.delete('/api/exams/:id', (req: Request, res: Response) => {
  const success = db.deleteExam(req.params.id);
  res.json({ success });
});

// Student Exam Start (Per-student unique question and choice shuffle)
app.post('/api/exams/:id/start', (req: Request, res: Response) => {
  try {
    const { student_id } = req.body;
    if (!student_id) {
      res.status(400).json({ success: false, error: 'student_id parametresi zorunludur' });
      return;
    }
    const result = db.startExamAttempt(req.params.id, student_id);
    res.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

// Attempt Operations
app.get('/api/attempts', (req: Request, res: Response) => {
  const examId = req.query.exam_id as string | undefined;
  const studentId = req.query.student_id as string | undefined;
  const attempts = db.getAttempts(examId, studentId);
  res.json({ success: true, attempts });
});

app.get('/api/attempts/:id', (req: Request, res: Response) => {
  const attempt = db.getAttempt(req.params.id);
  if (!attempt) {
    res.status(404).json({ success: false, error: 'Oturum bulunamadı' });
    return;
  }
  res.json({ success: true, attempt });
});

app.post('/api/attempts/:id/answer', (req: Request, res: Response) => {
  try {
    const { question_id, option_id } = req.body;
    const attempt = db.saveAnswer(req.params.id, question_id, option_id);
    res.json({ success: true, attempt });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

app.post('/api/attempts/:id/submit', async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    const attempt = await db.submitExamAttempt(req.params.id, answers);
    res.json({ success: true, attempt });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

// Analytics
app.get('/api/analytics/overview', (_req: Request, res: Response) => {
  const data = db.getOverviewAnalytics();
  res.json({ success: true, data });
});

app.get('/api/analytics/student/:studentId', (req: Request, res: Response) => {
  const data = db.getStudentAnalytics(req.params.studentId);
  if (!data) {
    res.status(404).json({ success: false, error: 'Öğrenci bulunamadı' });
    return;
  }
  res.json({ success: true, data });
});

// NocoDB Config & Sync
app.get('/api/nocodb/config', (_req: Request, res: Response) => {
  res.json({ success: true, config: db.getNocoDBConfig(), logs: db.getNocoDBLogs() });
});

app.post('/api/nocodb/config', (req: Request, res: Response) => {
  try {
    const config = db.saveNocoDBConfig(req.body);
    res.json({ success: true, config });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

app.post('/api/nocodb/sync-courses', async (_req: Request, res: Response) => {
  const result = await db.syncCoursesFromNocoDB();
  res.json({ success: true, ...result, courses: db.getCourses() });
});

app.post('/api/nocodb/sync-students', async (_req: Request, res: Response) => {
  const result = await db.syncStudentsFromNocoDB();
  res.json({ success: true, ...result, students: db.getStudents() });
});

// Server boot with Vite middleware integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Akademik Online Sınav Sistemi http://${HOST}:${PORT} adresinde çalışıyor`);
  });
}

startServer().catch((err) => {
  console.error('Sunucu başlatılırken hata oluştu:', err);
  process.exit(1);
});
