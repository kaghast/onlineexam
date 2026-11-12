import React, { useState, useEffect, useCallback } from 'react';
import { Exam, StudentExamAttempt, LmsCourse } from '../types';
import { api } from '../api';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ExamRoomProps {
  attempt: StudentExamAttempt;
  exam: Exam;
  course?: LmsCourse;
  onFinish: (completedAttempt: StudentExamAttempt) => void;
  onExit: (finalAnswers?: Record<string, string>) => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  attempt: initialAttempt,
  exam,
  course,
  onFinish,
  onExit,
}) => {
  const [attempt, setAttempt] = useState<StudentExamAttempt>(initialAttempt);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const startMs = new Date(attempt.started_at).getTime();
    const durationMs = exam.duration_minutes * 60 * 1000;
    const elapsedMs = Date.now() - startMs;
    const remainingSec = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
    return remainingSec;
  });

  const totalQuestions = attempt.shuffled_questions.length;
  const currentQuestion = attempt.shuffled_questions[currentIndex];

  // Auto-submit handler
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const completed = await api.submitAttempt(attempt.id, attempt.answers);
      setAttempt(completed);
      setShowSubmitModal(false);
      onFinish(completed);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Sınav gönderilirken bir hata oluştu: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt.id, attempt.answers, isSubmitting, onFinish]);

  // Early exit handler: "Sınavı başlatırsa öğrenci sınavdan çıkarsa sınavı tamamlandı say."
  const handleExitExam = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const completed = await api.exitExam(attempt.id, attempt.answers);
      setAttempt(completed);
      setShowExitModal(false);
      onFinish(completed);
    } catch (err) {
      console.error('Exit exam error:', err);
      onExit(attempt.answers);
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt.id, attempt.answers, isSubmitting, onFinish, onExit]);

  // Window close / tab navigate away listener (marks exam completed upon exit)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Sınavdan çıkarsanız sınavınız tamamlandı sayılacaktır.';
      return e.returnValue;
    };

    const handlePageHide = () => {
      try {
        fetch(`/api/attempts/${attempt.id}/exit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: attempt.answers }),
          keepalive: true,
        });
      } catch (err) {
        console.error('Pagehide exit request error:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [attempt.id, attempt.answers]);

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, handleFinalSubmit]);

  // Answer selection
  const handleSelectOption = async (optionId: string) => {
    if (!currentQuestion) return;
    const newAnswers = { ...attempt.answers, [currentQuestion.id]: optionId };
    setAttempt((prev) => ({ ...prev, answers: newAnswers }));

    // Persist answer to server asynchronously
    try {
      await api.saveAnswer(attempt.id, currentQuestion.id, optionId);
    } catch (err) {
      console.error('Failed to sync answer:', err);
    }
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(attempt.answers).filter(
    (k) => attempt.shuffled_questions.some((sq) => sq.id === k) && attempt.answers[k]
  ).length;

  const emptyCount = totalQuestions - answeredCount;

  const isLowTime = secondsRemaining < 300; // less than 5 minutes

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Exam Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded shrink-0">
              {exam.exam_type.toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {exam.title}
              </h1>
              <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
                <span>{course?.course_code || exam.course_id}</span>
                <span aria-hidden="true">·</span>
                <span>{course?.course_name || 'Ders'}</span>
              </div>
            </div>
          </div>

          {/* Timer and Submit Action */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs sm:text-sm font-semibold tabular-nums border transition-colors ${
                isLowTime
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sınavı Bitir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination View - Bento Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Bento: Current Question Canvas (Cols 1 to 8) */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs min-h-[520px]">
          <div>
            {/* Question Progress Bar & Metadata */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span>Soru {currentIndex + 1} / {totalQuestions}</span>
                <span aria-hidden="true">·</span>
                <span>Tekil Karıştırılmış Form</span>
              </div>

              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                  flaggedQuestions[currentQuestion.id]
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {flaggedQuestions[currentQuestion.id] ? 'İşaretlendi' : 'Gözden Geçir'}
                </span>
              </button>
            </div>

            {/* Question Text */}
            <div className="mb-8">
              <MarkdownRenderer
                content={currentQuestion.text}
                className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed"
              />
            </div>

            {/* Options List (A, B, C, D, E) */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = attempt.answers[currentQuestion.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50/80 text-slate-950 ring-1 ring-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {option.id}
                    </div>
                    <span className="text-sm font-normal text-slate-800 pt-0.5 leading-relaxed">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-100">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Önceki Soru</span>
            </button>

            <span className="text-xs text-slate-400 font-mono">
              {answeredCount}/{totalQuestions} Yanıtlandı
            </span>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <span>Sonraki Soru</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <span>Sonuçları Gönder</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* Right Bento: Question Matrix & Overview (Cols 9 to 12) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Question Navigator Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Soru Listesi ve Geçiş
              </h2>
              <span className="text-xs font-mono text-slate-500">
                %{Math.round((answeredCount / totalQuestions) * 100)}
              </span>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2 mb-5">
              {attempt.shuffled_questions.map((sq, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!attempt.answers[sq.id];
                const isFlagged = !!flaggedQuestions[sq.id];

                let btnStyle = 'bg-slate-50 text-slate-600 border-slate-200';
                if (isAnswered) {
                  btnStyle = 'bg-slate-900 text-white border-slate-900 font-bold';
                }
                if (isFlagged) {
                  btnStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                }
                if (isCurrent) {
                  btnStyle += ' ring-2 ring-offset-1 ring-slate-900';
                }

                return (
                  <button
                    key={sq.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-md border text-xs font-mono transition-all flex flex-col items-center justify-center relative ${btnStyle}`}
                    title={`Soru ${idx + 1}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-slate-900 rounded-xs" />
                <span>Yanıtlandı ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-slate-100 border border-slate-300 rounded-xs" />
                <span>Boş ({emptyCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-xs" />
                <span>İşaretli ({Object.values(flaggedQuestions).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-slate-900 rounded-xs" />
                <span>Aktif Soru</span>
              </div>
            </div>
          </div>

          {/* Student & Security Info Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-xs text-slate-600 space-y-2.5">
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Oturum Bilgileri</span>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Öğrenci:</span>
                <span className="font-medium text-slate-900">{attempt.student_name}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Öğrenci No:</span>
                <span className="font-mono text-slate-900">{attempt.student_no}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Sınav Türü:</span>
                <span className="font-medium text-slate-900 uppercase">{exam.exam_type}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Geçme Notu:</span>
                <span className="font-mono text-slate-900">{exam.passing_grade} / 100</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Sınavı Tamamlamak İstediğinizden Emin Misiniz?
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Sınavı teslim ettiğinizde yanıtlarınız otomatik puanlanacak ve sınav oturumunuz sonlandırılacaktır.
            </p>

            {/* Answer Status Summary */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Toplam Soru:</span>
                <span className="font-mono font-bold text-slate-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Yanıtlanan Soru:</span>
                <span className="font-mono font-bold text-emerald-700">{answeredCount}</span>
              </div>
              {emptyCount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Boş Bırakılan Soru:
                  </span>
                  <span className="font-mono font-bold">{emptyCount}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sınava Geri Dön
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Puanlanıyor...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Evet, Sınavı Bitir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
