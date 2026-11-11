import React, { useState, useEffect } from 'react';
import {
  LmsCourse,
  LmsStudent,
  Exam,
  StudentExamAttempt,
  StudentAnalytics,
  Question,
} from '../types';
import { api } from '../api';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
} from 'lucide-react';

interface StudentPortalProps {
  student: LmsStudent;
  courses: LmsCourse[];
  exams: Exam[];
  attempts: StudentExamAttempt[];
  questions: Question[];
  onStartExam: (exam: Exam) => void;
  onViewResult: (attempt: StudentExamAttempt) => void;
  activeView: 'exams' | 'performance';
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  courses,
  exams,
  attempts,
  questions,
  onStartExam,
  onViewResult,
  activeView,
}) => {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (activeView === 'performance') {
      setLoadingAnalytics(true);
      api.getStudentAnalytics(student.id)
        .then(setAnalytics)
        .catch(console.error)
        .finally(() => setLoadingAnalytics(false));
    }
  }, [activeView, student.id]);

  // Filter exams assigned to this student (assigned_student_ids empty means all enrolled)
  const studentExams = exams.filter(
    (e) => e.assigned_student_ids.length === 0 || e.assigned_student_ids.includes(student.id)
  );

  const getCourseForExam = (exam: Exam) => {
    return courses.find((c) => c.course_id === exam.course_id || c.id === exam.course_id);
  };

  const getAttemptForExam = (examId: string) => {
    return attempts.find((a) => a.exam_id === examId && a.student_id === student.id);
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Student Welcome & Profile Bento Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Öğrenci Sınav Portalı</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-700">{student.university}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {student.name_surname}
            </h1>
            <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Öğrenci No: <strong className="font-mono text-slate-900">{student.student_no}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Bölüm: <strong>{student.department}</strong></span>
              <span aria-hidden="true">·</span>
              <span>E-posta: {student.email}</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-center">
              <span className="text-[11px] text-slate-500 block">Kayıtlı Sınav</span>
              <span className="text-lg font-bold font-mono text-slate-900">{studentExams.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-center">
              <span className="text-[11px] text-slate-500 block">Tamamlanan</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {attempts.filter((a) => a.student_id === student.id && a.completed_at).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Router */}
      {activeView === 'exams' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Atanan ve Aktif Sınavlar ({studentExams.length})
            </h2>
            <span className="text-xs text-slate-500">
              Soru ve şıklar her oturumda tekil karıştırılır
            </span>
          </div>

          {studentExams.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-800">Henüz adınıza atanmış bir sınav bulunmuyor.</p>
              <p className="text-xs text-slate-500 mt-1">Eğitmeniniz yeni bir sınav atadığında burada listelenecektir.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentExams.map((exam) => {
                const course = getCourseForExam(exam);
                const attempt = getAttemptForExam(exam.id);
                const isCompleted = attempt && !!attempt.completed_at;
                const isOngoing = attempt && !attempt.completed_at;

                const startDt = new Date(exam.start_time);
                const endDt = new Date(exam.end_time);
                const isNotStartedYet = now < startDt;
                const isExpired = now > endDt;

                return (
                  <div
                    key={exam.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div>
                      {/* Top metadata strip */}
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {course?.course_code || exam.course_id}
                          </span>
                          <span className="uppercase text-[11px] font-semibold text-slate-600">
                            {exam.exam_type}
                            {exam.exam_type === 'vize' && ' · NocoDB LMS'}
                          </span>
                        </div>

                        {isCompleted ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {attempt?.score} / 100
                          </span>
                        ) : isOngoing ? (
                          <span className="text-amber-700 font-medium">Devam Ediyor</span>
                        ) : isExpired ? (
                          <span className="text-slate-400">Süresi Doldu</span>
                        ) : isNotStartedYet ? (
                          <span className="text-slate-500">Gelecek Sınav</span>
                        ) : (
                          <span className="text-slate-700 font-medium">Katılıma Açık</span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                        {exam.title}
                      </h3>

                      <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                        {course?.course_name} · AKTS: {course?.akts || 5}
                      </p>

                      {/* Info grid */}
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5" /> Süre:
                          </span>
                          <span className="font-mono font-semibold text-slate-800">
                            {exam.duration_minutes} Dakika
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <BookOpen className="w-3.5 h-3.5" /> Soru Sayısı:
                          </span>
                          <span className="font-mono font-semibold text-slate-800">
                            {exam.question_ids.length} Soru (Çoktan Seçmeli)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3.5 h-3.5" /> Geçerlilik:
                          </span>
                          <span className="font-mono text-slate-700">
                            {startDt.toLocaleDateString('tr-TR')} - {endDt.toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2">
                      {isCompleted ? (
                        <button
                          onClick={() => onViewResult(attempt)}
                          className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>Sınav Sonucunu ve Çözümleri Gör</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : isOngoing ? (
                        <button
                          onClick={() => onStartExam(exam)}
                          className="w-full py-2 px-3 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>Sınava Devam Et</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : isNotStartedYet ? (
                        <button
                          disabled
                          className="w-full py-2 px-3 bg-slate-100 text-slate-400 rounded-md text-xs font-medium cursor-not-allowed"
                        >
                          Başlama Zamanı: {startDt.toLocaleDateString('tr-TR')} {startDt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ) : isExpired ? (
                        <button
                          disabled
                          className="w-full py-2 px-3 bg-slate-100 text-slate-400 rounded-md text-xs font-medium cursor-not-allowed"
                        >
                          Sınav Süresi Geçti
                        </button>
                      ) : (
                        <button
                          onClick={() => onStartExam(exam)}
                          className="w-full py-2 px-3 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>Sınava Başla</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Performance & Karnem View */
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Performans verileri hesaplanıyor...
            </div>
          ) : analytics ? (
            <>
              {/* Bento Analytics Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="text-xs text-slate-500 mb-1">Genel Not Ortalaması</div>
                  <div className="text-3xl font-extrabold font-mono text-slate-900">
                    {analytics.avgScore}
                    <span className="text-sm font-normal text-slate-400"> / 100</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                    <span>{analytics.totalExamsTaken} Sınav Değerlendirildi</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="text-xs text-slate-500 mb-1">Başarı Oranı</div>
                  <div className="text-3xl font-extrabold font-mono text-emerald-700">
                    %{analytics.totalExamsTaken > 0 ? Math.round((analytics.totalPassed / analytics.totalExamsTaken) * 100) : 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {analytics.totalPassed} Geçti · {analytics.totalFailed} Kaldı
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="text-xs text-slate-500 mb-1">Doğru Yanıtlar</div>
                  <div className="text-3xl font-extrabold font-mono text-slate-900">
                    {analytics.totalCorrect}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {analytics.totalWrong} Yanlış · {analytics.totalEmpty} Boş
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="text-xs text-slate-500 mb-1">Kazanılan AKTS Kredisi</div>
                  <div className="text-3xl font-extrabold font-mono text-slate-900">
                    {courses.slice(0, 2).reduce((s, c) => s + c.akts, 0)}
                    <span className="text-sm font-normal text-slate-400"> AKTS</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    LMS NocoDB Ders Eşleşmeli
                  </div>
                </div>
              </div>

              {/* Past Exam Attempts Table */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Geçmiş Sınav Performans Listesi
                </h3>

                {analytics.attempts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Henüz tamamlanmış bir sınavınız bulunmuyor.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-3 font-semibold">Sınav Adı</th>
                          <th className="pb-3 font-semibold">Ders Kodu</th>
                          <th className="pb-3 font-semibold">Tarih</th>
                          <th className="pb-3 font-semibold">Süre</th>
                          <th className="pb-3 font-semibold">Doğru / Yanlış</th>
                          <th className="pb-3 font-semibold">Puan</th>
                          <th className="pb-3 font-semibold">Durum</th>
                          <th className="pb-3 text-right font-semibold">Aksiyon</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics.attempts.map((att) => {
                          const exam = exams.find((e) => e.id === att.exam_id);
                          const course = courses.find((c) => c.course_id === att.course_id);

                          return (
                            <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 font-medium text-slate-900 max-w-xs truncate">
                                {exam?.title || att.exam_id}
                              </td>
                              <td className="py-3 font-mono text-slate-600">
                                {course?.course_code || att.course_id}
                              </td>
                              <td className="py-3 text-slate-500">
                                {new Date(att.completed_at || '').toLocaleDateString('tr-TR')}
                              </td>
                              <td className="py-3 font-mono text-slate-600">
                                {Math.round((att.duration_seconds_taken || 0) / 60)} dk
                              </td>
                              <td className="py-3 font-mono">
                                <span className="text-emerald-700 font-bold">{att.correct_count}D</span>
                                <span className="text-slate-400 mx-1">/</span>
                                <span className="text-rose-700">{att.wrong_count}Y</span>
                              </td>
                              <td className="py-3 font-mono font-bold text-slate-900">
                                {att.score} / 100
                              </td>
                              <td className="py-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    att.passed
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : 'bg-rose-50 text-rose-800'
                                  }`}
                                >
                                  {att.passed ? 'Geçti' : 'Kaldı'}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => onViewResult(att)}
                                  className="text-xs font-semibold text-slate-900 hover:underline"
                                >
                                  İncele →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
