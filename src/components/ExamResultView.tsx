import React from 'react';
import { StudentExamAttempt, Exam, LmsCourse, Question } from '../types';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  Database,
  Award,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ExamResultViewProps {
  attempt: StudentExamAttempt;
  exam: Exam;
  course?: LmsCourse;
  questions?: Question[];
  onBack: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  attempt,
  exam,
  course,
  questions = [],
  onBack,
}) => {
  const isPassed = attempt.passed;
  const isVize = exam.exam_type === 'vize';

  const formatSeconds = (sec?: number) => {
    if (!sec) return 'Bilinmiyor';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} dakika ${s} saniye`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sınav Listesine Dön</span>
        </button>

        <span className="text-xs font-mono text-slate-500">
          Oturum ID: {attempt.id}
        </span>
      </div>

      {/* Main Bento Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Score & Verdict Card (Cols 1 to 5) */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
              <span className="uppercase font-semibold tracking-wider text-slate-700">
                Sınav Değerlendirmesi
              </span>
              <span className="font-mono">{new Date(attempt.completed_at || '').toLocaleDateString('tr-TR')}</span>
            </div>

            <div className="my-6 text-center">
              <div className="text-5xl sm:text-6xl font-extrabold font-mono text-slate-900 tracking-tight">
                {attempt.score}
                <span className="text-2xl text-slate-400 font-normal"> / 100</span>
              </div>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    isPassed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {isPassed ? 'Başarılı (Geçti)' : 'Başarısız (Kaldı)'}
                </span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500">
              Baraj Notu: <span className="font-mono font-semibold text-slate-700">{exam.passing_grade}</span>
            </div>
          </div>

          {/* NocoDB Vize Notice */}
          {isVize && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                <Database className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900">NocoDB LMS Entegrasyonu</div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {attempt.nocodb_synced ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ Vize notu NocoDB değerlendirme tablosuna (ID: md50zxh2syamk2i) otomatik işlendi.
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        Vize sonucu yerel sistemde arşivlendi (NocoDB tablosu: md50zxh2syamk2i).
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Breakdown Bento Card (Cols 6 to 12) */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">
              {exam.title}
            </h2>
            <div className="text-xs text-slate-500 mb-6 flex items-center gap-2">
              <span>{course?.course_name || exam.course_id}</span>
              <span aria-hidden="true">·</span>
              <span>{course?.course_code}</span>
              <span aria-hidden="true">·</span>
              <span>{attempt.student_name}</span>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Doğru</div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {attempt.correct_count ?? 0}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Yanlış</div>
                <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                  {attempt.wrong_count ?? 0}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Boş</div>
                <div className="text-xl font-bold font-mono text-slate-600 mt-1">
                  {attempt.empty_count ?? 0}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Toplam Soru</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {attempt.total_questions}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Harcanan Süre: </span>
              <span className="font-mono font-semibold text-slate-800">
                {formatSeconds(attempt.duration_seconds_taken)}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Aşağıdaki detaylı soru analizinden verdiğiniz cevapları ve doğru çözümleri inceleyebilirsiniz.
          </div>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Soru Bazlı Ayrıntılı Cevap İncelemesi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sorular ve şıklar sınav anında size özel karıştırılmış sırayla gösterilmektedir.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {attempt.correct_count}/{attempt.total_questions} Doğru
          </span>
        </div>

        <div className="space-y-6">
          {attempt.shuffled_questions.map((sq, index) => {
            const originalQ = questions.find((q) => q.id === sq.original_question_id);
            const studentSelectedLabel = attempt.answers[sq.id];
            
            // Map student selected label to original option id
            const studentChosenObj = sq.options.find((o) => o.id === studentSelectedLabel);
            const studentChosenOriginalId = studentChosenObj?.original_id || studentSelectedLabel;

            const isCorrect = studentChosenOriginalId === originalQ?.correct_answer;
            const isEmpty = !studentSelectedLabel;

            return (
              <div
                key={sq.id}
                className={`p-5 rounded-lg border transition-all ${
                  isEmpty
                    ? 'border-slate-200 bg-slate-50/50'
                    : isCorrect
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      Soru {index + 1}
                    </span>
                    {originalQ?.topic && (
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        · {originalQ.topic}
                      </span>
                    )}
                  </div>

                  <div>
                    {isEmpty ? (
                      <span className="text-xs font-medium text-slate-500">Boş Bırakıldı</span>
                    ) : isCorrect ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Doğru (+{Math.round(100 / attempt.total_questions)} puan)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Yanlış (0 puan)
                      </span>
                    )}
                  </div>
                </div>

                <MarkdownRenderer
                  content={sq.text}
                  className="text-sm font-medium text-slate-900 mb-4 leading-relaxed"
                />

                {/* Options Review */}
                <div className="space-y-2 mb-4">
                  {sq.options.map((opt) => {
                    const isStudentChoice = studentSelectedLabel === opt.id;
                    const isRightAnswer = (opt.original_id || opt.id) === originalQ?.correct_answer;

                    let optClass = 'border-slate-200 bg-white text-slate-700';
                    if (isRightAnswer) {
                      optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-500';
                    } else if (isStudentChoice && !isCorrect) {
                      optClass = 'border-rose-400 bg-rose-50 text-rose-950 font-medium ring-1 ring-rose-400';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-md border text-xs flex items-start gap-2.5 ${optClass}`}
                      >
                        <div
                          className={`w-5 h-5 rounded font-mono font-bold flex items-center justify-center text-[10px] shrink-0 ${
                            isRightAnswer
                              ? 'bg-emerald-700 text-white'
                              : isStudentChoice
                              ? 'bg-rose-700 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.id}
                        </div>
                        <span className="pt-0.5 leading-relaxed">{opt.text}</span>
                        {isRightAnswer && (
                          <span className="ml-auto text-[11px] font-bold text-emerald-700">
                            (Doğru Cevap)
                          </span>
                        )}
                        {isStudentChoice && !isRightAnswer && (
                          <span className="ml-auto text-[11px] font-bold text-rose-700">
                            (Sizin Yanıtınız)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {originalQ?.explanation && (
                  <div className="bg-white border border-slate-200 p-3.5 rounded-md text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900 block mb-1">
                      Çözüm & Açıklama:
                    </span>
                    <MarkdownRenderer
                      content={originalQ.explanation}
                      className="text-xs text-slate-700 leading-relaxed"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
