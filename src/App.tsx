/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LmsCourse,
  LmsStudent,
  Exam,
  StudentExamAttempt,
  Question,
} from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { ExamRoom } from './components/ExamRoom';
import { ExamResultView } from './components/ExamResultView';
import { AdminPanel } from './components/AdminPanel';
import { Loader2 } from 'lucide-react';

export interface AuthSession {
  role: 'student' | 'admin';
  student?: LmsStudent;
  user?: { name_surname: string; email: string; role: 'admin' };
}

export default function App() {
  const [courses, setCourses] = useState<LmsCourse[]>([]);
  const [students, setStudents] = useState<LmsStudent[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<StudentExamAttempt[]>([]);

  // Auth session
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem('academic_exam_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'student_exams' | 'student_performance' | 'admin'>('student_exams');

  // Active full-screen exam or result view
  const [activeExamSession, setActiveExamSession] = useState<{
    attempt: StudentExamAttempt;
    exam: Exam;
  } | null>(null);

  const [viewingResult, setViewingResult] = useState<{
    attempt: StudentExamAttempt;
    exam: Exam;
  } | null>(null);

  const [isSyncingNocoDB, setIsSyncingNocoDB] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Load all initial data from backend API
  const refreshAllData = useCallback(async () => {
    try {
      const [crs, stds, exms, qsts, attmps] = await Promise.all([
        api.getCourses(),
        api.getStudents(),
        api.getExams(),
        api.getQuestions(),
        api.getAttempts(),
      ]);
      setCourses(crs);
      setStudents(stds);
      setExams(exms);
      setQuestions(qsts);
      setAttempts(attmps);

      // If logged in as student, update student object in case it was synced
      setCurrentUser((prev) => {
        if (prev?.role === 'student' && prev.student) {
          const updatedStudent = stds.find((s) => s.id === prev.student?.id || s.student_no === prev.student?.student_no);
          if (updatedStudent) {
            const next = { ...prev, student: updatedStudent };
            localStorage.setItem('academic_exam_auth', JSON.stringify(next));
            return next;
          }
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Login Handler
  const handleLoginSuccess = (authData: AuthSession) => {
    setCurrentUser(authData);
    localStorage.setItem('academic_exam_auth', JSON.stringify(authData));
    if (authData.role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('student_exams');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('academic_exam_auth');
    setActiveExamSession(null);
    setViewingResult(null);
    setCurrentTab('student_exams');
  };

  // Start exam action: calls backend to create unique per-student shuffle
  const handleStartExam = async (exam: Exam) => {
    const studentId = currentUser?.student?.id || students[0]?.id;
    if (!studentId) {
      alert('Sınava girmek için öğrenci girişi yapmalısınız.');
      return;
    }
    try {
      setLoading(true);
      const { attempt } = await api.startExam(exam.id, studentId);
      setActiveExamSession({ attempt, exam });
    } catch (err) {
      alert('Sınav başlatılamadı: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // View exam result action
  const handleViewResult = (attempt: StudentExamAttempt) => {
    const exam = exams.find((e) => e.id === attempt.exam_id);
    if (!exam) return;
    setViewingResult({ attempt, exam });
  };

  // Trigger quick NocoDB sync
  const handleQuickNocoDBSync = async () => {
    setIsSyncingNocoDB(true);
    setSyncFeedback(null);
    try {
      const [courseRes, studentRes] = await Promise.all([
        api.syncCourses(),
        api.syncStudents(),
      ]);
      await refreshAllData();
      setSyncFeedback(
        `NocoDB Senkronizasyonu Tamamlandı: ${courseRes.count} Ders, ${studentRes.count} Öğrenci güncel.`
      );
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err) {
      setSyncFeedback('NocoDB Senkronizasyon hatası: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSyncingNocoDB(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
          <span className="text-xs font-medium tracking-wide">Akademik Ölçme ve Sınav Sistemi Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // If not logged in, show the Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        students={students}
      />
    );
  }

  // Active student object
  const currentStudent = currentUser.student || students[0];

  // 1. Live Exam Room Mode
  if (activeExamSession) {
    const examCourse = courses.find((c) => c.course_id === activeExamSession.exam.course_id);
    return (
      <ExamRoom
        attempt={activeExamSession.attempt}
        exam={activeExamSession.exam}
        course={examCourse}
        onFinish={(completed) => {
          setActiveExamSession(null);
          setViewingResult({ attempt: completed, exam: activeExamSession.exam });
          refreshAllData();
        }}
        onExit={() => {
          setActiveExamSession(null);
          refreshAllData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setViewingResult(null);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSyncNocoDB={handleQuickNocoDBSync}
        isSyncing={isSyncingNocoDB}
      />

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2.5 text-center transition-all animate-fade-in flex items-center justify-center gap-2">
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewingResult ? (
          <ExamResultView
            attempt={viewingResult.attempt}
            exam={viewingResult.exam}
            course={courses.find((c) => c.course_id === viewingResult.exam.course_id)}
            questions={questions}
            onBack={() => {
              setViewingResult(null);
              refreshAllData();
            }}
          />
        ) : currentTab === 'admin' ? (
          <AdminPanel
            courses={courses}
            students={students}
            questions={questions}
            exams={exams}
            attempts={attempts}
            onRefreshData={refreshAllData}
          />
        ) : (
          <StudentPortal
            student={currentStudent}
            courses={courses}
            exams={exams}
            attempts={attempts}
            questions={questions}
            onStartExam={handleStartExam}
            onViewResult={handleViewResult}
            activeView={currentTab === 'student_exams' ? 'exams' : 'performance'}
          />
        )}
      </main>

      {/* Clean Academic Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Akademik Sınav ve Ölçme Modülü</span>
            <span aria-hidden="true">·</span>
            <span>NocoDB LMS Entegre</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>lms_courses (m935015e01psf34)</span>
            <span>·</span>
            <span>lms_students (muuofbvrmpm5e5b)</span>
            <span>·</span>
            <span>lms_evaluation_results (md50zxh2syamk2i)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
