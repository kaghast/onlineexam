import React, { useState, useEffect } from 'react';
import {
  LmsCourse,
  LmsStudent,
  Question,
  Exam,
  StudentExamAttempt,
  OverviewAnalytics,
  NocoDBConfig,
  NocoDBSyncLog,
  QuestionDifficulty,
  ExamType,
} from '../types';
import { api } from '../api';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MarkdownEditor } from './MarkdownEditor';
import {
  Layers,
  FileQuestion,
  Calendar,
  BarChart3,
  Database,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Users,
  Award,
  Clock,
  Sparkles,
  Shuffle,
} from 'lucide-react';

interface AdminPanelProps {
  courses: LmsCourse[];
  students: LmsStudent[];
  questions: Question[];
  exams: Exam[];
  attempts: StudentExamAttempt[];
  onRefreshData: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  courses,
  students,
  questions,
  exams,
  attempts,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'exams' | 'reports' | 'nocodb'>('overview');

  // Overview analytics
  const [analytics, setAnalytics] = useState<OverviewAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Question Filters & Modals
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('all');
  const [questionSearch, setQuestionSearch] = useState<string>('');

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  // JSON Import/Export Modal
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonErrors, setJsonErrors] = useState<string[]>([]);
  const [jsonSuccessMessage, setJsonSuccessMessage] = useState('');

  // Exam Creator Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);

  // NocoDB Config state
  const [nocodbConfig, setNocodbConfig] = useState<NocoDBConfig | null>(null);
  const [nocodbLogs, setNocodbLogs] = useState<NocoDBSyncLog[]>([]);
  const [syncingCourses, setSyncingCourses] = useState(false);
  const [syncingStudents, setSyncingStudents] = useState(false);
  const [syncingEnrollments, setSyncingEnrollments] = useState(false);
  const [enrollmentsCount, setEnrollmentsCount] = useState<number>(0);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // Student Report Search
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>(students[0]?.id || '');

  // Load analytics and nocodb config
  useEffect(() => {
    loadOverview();
    loadNocoDB();
  }, []);

  const loadOverview = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await api.getOverviewAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadNocoDB = async () => {
    try {
      const { config, logs } = await api.getNocoDBConfig();
      setNocodbConfig(config);
      setNocodbLogs(logs);
      const enr = await api.getCoursesStudents();
      setEnrollmentsCount(enr.length);
    } catch (err) {
      console.error(err);
    }
  };

  // --- QUESTION HANDLERS ---
  const handleOpenNewQuestion = () => {
    if (courses.length === 0) {
      alert('Soru ekleyebilmek için önce NocoDB sekmesinden dersleri senkronize ediniz veya bir ders tanımlayınız.');
      return;
    }
    setEditingQuestion({
      course_id: courses[0]?.course_id || '',
      text: '',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correct_answer: 'A',
      explanation: '',
      difficulty: 'normal',
      topic: '',
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.text) return;

    try {
      await api.saveQuestion(editingQuestion);
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
      await onRefreshData();
      loadOverview();
    } catch (err) {
      alert('Soru kaydedilemedi: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Bu soruyu soru havuzundan silmek istediğinizden emin misiniz?')) return;
    try {
      await api.deleteQuestion(id);
      await onRefreshData();
      loadOverview();
    } catch (err) {
      alert('Soru silinemedi');
    }
  };

  // --- JSON IMPORT / EXPORT ---
  const handleExportJson = () => {
    const filteredQuestions = questions.filter(
      (q) => selectedCourseFilter === 'all' || q.course_id === selectedCourseFilter
    );
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredQuestions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `soru_havuzu_${selectedCourseFilter}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleGenerateSampleJson = () => {
    const sample = [
      {
        course_id: courses[0]?.course_id || 'BLG201',
        topic: 'Veri Yapıları & Ağaçlar',
        text: 'İkili arama ağacında (BST) bir düğümün sol alt ağacındaki tüm değerler o düğümden nasıldır?',
        options: [
          { id: 'A', text: 'Her zaman küçüktür' },
          { id: 'B', text: 'Her zaman büyüktür' },
          { id: 'C', text: 'Eşittir' },
          { id: 'D', text: 'Rastgeledir' }
        ],
        correct_answer: 'A',
        explanation: 'BST özelliğine göre kökten küçük değerler sol alt ağaca yerleştirilir.',
        difficulty: 'kolay'
      }
    ];
    setJsonInput(JSON.stringify(sample, null, 2));
  };

  const handleProcessImportJson = async () => {
    setJsonErrors([]);
    setJsonSuccessMessage('');
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await api.importQuestions(parsed);
      if (res.errors && res.errors.length > 0) {
        setJsonErrors(res.errors);
      }
      if (res.added > 0) {
        setJsonSuccessMessage(`${res.added} adet soru başarıyla soru havuzuna eklendi.`);
        await onRefreshData();
        loadOverview();
      }
    } catch (err) {
      setJsonErrors(['Geçersiz JSON formatı: ' + (err instanceof Error ? err.message : String(err))]);
    }
  };

  // --- EXAM HANDLERS ---
  const handleOpenNewExam = () => {
    if (courses.length === 0) {
      alert('Sınav oluşturabilmek için önce NocoDB sekmesinden dersleri senkronize ediniz veya bir ders tanımlayınız.');
      return;
    }
    const defaultCourse = courses[0]?.course_id || '';
    const courseQuestions = questions.filter((q) => q.course_id === defaultCourse);

    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const initialPoolIds = courseQuestions.map((q) => q.id);
    const initialQuestionCount = courseQuestions.length > 0 ? Math.min(courseQuestions.length, 20) : 10;

    setEditingExam({
      title: 'Yeni Akademik Değerlendirme Sınavı',
      course_id: defaultCourse,
      exam_type: 'vize',
      duration_minutes: 30,
      start_time: now.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
      assigned_student_ids: [], // Automatically enrolled from lms_courses_students
      passing_grade: 50,
      question_ids: initialPoolIds,
      question_count: initialQuestionCount,
      difficulty_ratio: { kolay: 30, normal: 50, zor: 20 },
      is_active: true,
    });
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editingExam.title || !editingExam.course_id) return;

    if (!editingExam.question_ids || editingExam.question_ids.length === 0) {
      alert('Lütfen sınava en az 1 soru ekleyin.');
      return;
    }

    try {
      await api.saveExam({
        ...editingExam,
        start_time: new Date(editingExam.start_time!).toISOString(),
        end_time: new Date(editingExam.end_time!).toISOString(),
      });
      setIsExamModalOpen(false);
      setEditingExam(null);
      await onRefreshData();
      loadOverview();
    } catch (err) {
      alert('Sınav kaydedilemedi: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Bu sınavı silmek istediğinizden emin misiniz?')) return;
    try {
      await api.deleteExam(id);
      await onRefreshData();
      loadOverview();
    } catch (err) {
      alert('Sınav silinemedi');
    }
  };

  // --- NOCODB SYNC ACTIONS ---
  const handleSaveNocoDBConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nocodbConfig) return;
    try {
      const updated = await api.saveNocoDBConfig(nocodbConfig);
      setNocodbConfig(updated);
      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 3000);
      loadNocoDB();
    } catch (err) {
      alert('NocoDB ayarları kaydedilemedi');
    }
  };

  const handleSyncCourses = async () => {
    setSyncingCourses(true);
    try {
      const res = await api.syncCourses();
      alert(res.message);
      await onRefreshData();
      loadNocoDB();
    } catch (err) {
      alert('Dersler senkronize edilemedi: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSyncingCourses(false);
    }
  };

  const handleSyncStudents = async () => {
    setSyncingStudents(true);
    try {
      const res = await api.syncStudents();
      alert(res.message);
      await onRefreshData();
      loadNocoDB();
    } catch (err) {
      alert('Öğrenciler senkronize edilemedi: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSyncingStudents(false);
    }
  };

  const handleSyncEnrollments = async () => {
    setSyncingEnrollments(true);
    try {
      const res = await api.syncCoursesStudents();
      alert(res.message);
      setEnrollmentsCount(res.count);
      loadNocoDB();
    } catch (err) {
      alert('Ders-öğrenci kayıtları senkronize edilemedi: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSyncingEnrollments(false);
    }
  };

  // Filtered Questions list
  const filteredQuestions = questions.filter((q) => {
    const matchCourse = selectedCourseFilter === 'all' || q.course_id === selectedCourseFilter;
    const matchDiff = selectedDifficultyFilter === 'all' || q.difficulty === selectedDifficultyFilter;
    const matchText =
      !questionSearch ||
      q.text.toLowerCase().includes(questionSearch.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(questionSearch.toLowerCase()));
    return matchCourse && matchDiff && matchText;
  });

  return (
    <div className="space-y-6">
      {/* Sub Header & Segmented Tab Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Eğitmen & Yönetici Yönetim Merkezi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Soru havuzu, dinamik zorluk derecelendirme, sınav atama ve NocoDB LMS entegrasyonu
          </p>
        </div>

        {/* Segmented Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Genel Bakış</span>
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'questions' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Soru Havuzu ({questions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'exams' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sınav Yönetimi ({exams.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reports' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Öğrenci Raporları</span>
          </button>
          <button
            onClick={() => setActiveTab('nocodb')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'nocodb' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>NocoDB LMS</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW DASHBOARD --- */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Bento Grid KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Havuzdaki Soru Sayısı</span>
              <div className="text-3xl font-extrabold font-mono text-slate-900">{analytics.totalQuestions}</div>
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span>Dinamik Derecelendirmeli</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Aktif & Atanan Sınav</span>
              <div className="text-3xl font-extrabold font-mono text-slate-900">{analytics.totalExams}</div>
              <div className="text-xs text-slate-500 mt-2">
                {analytics.totalStudents} Kayıtlı Öğrenci
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Tamamlanan Oturum</span>
              <div className="text-3xl font-extrabold font-mono text-slate-900">{analytics.totalAttempts}</div>
              <div className="text-xs text-slate-500 mt-2">
                Tekil Karıştırılmış Formlar
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Genel Başarı Ortalaması</span>
              <div className="text-3xl font-extrabold font-mono text-emerald-700">
                {analytics.avgScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                %{analytics.passRate} Geçme Oranı
              </div>
            </div>
          </div>

          {/* Bento Row 2: Dynamic Difficulty & Course Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Dynamic Question Difficulty Distribution (Cols 1 to 5) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                    Dinamik Soru Zorluk Dağılımı
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Otomatik Güncellenir</span>
                </div>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Öğrencilerin sınavdaki doğru ve yanlış yanıt oranlarına göre soruların zorluk dereceleri otomatik olarak kolay, normal veya zor olarak yeniden hesaplanır.
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700">Kolay Sorular (&gt;%75 Başarı)</span>
                      <span className="font-mono font-bold text-slate-900">{analytics.difficultyCounts.kolay} Soru</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{
                          width: `${(analytics.difficultyCounts.kolay / (analytics.totalQuestions || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700">Normal Sorular (%40 - %75 Başarı)</span>
                      <span className="font-mono font-bold text-slate-900">{analytics.difficultyCounts.normal} Soru</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{
                          width: `${(analytics.difficultyCounts.normal / (analytics.totalQuestions || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700">Zor Sorular (&lt;%40 Başarı)</span>
                      <span className="font-mono font-bold text-slate-900">{analytics.difficultyCounts.zor} Soru</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-600 h-full rounded-full transition-all"
                        style={{
                          width: `${(analytics.difficultyCounts.zor / (analytics.totalQuestions || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Algoritma: Başarı Oranına Dayalı Bayesyen Kalibrasyon</span>
              </div>
            </div>

            {/* Course-based Performance Grid (Cols 6 to 12) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ders Bazında Başarı & Soru Raporu (NocoDB lms_courses)
                </h3>
                <span className="text-xs text-slate-500 font-mono">{courses.length} Ders</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-semibold">Ders Kodu</th>
                      <th className="pb-3 font-semibold">Ders Adı</th>
                      <th className="pb-3 font-semibold">Havuzdaki Soru</th>
                      <th className="pb-3 font-semibold">Giren Öğrenci</th>
                      <th className="pb-3 font-semibold">Ort. Not</th>
                      <th className="pb-3 font-semibold">Geçme Oranı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.courseStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Henüz kayıtlı ders bulunmuyor. NocoDB sekmesinden senkronize edebilirsiniz.
                        </td>
                      </tr>
                    ) : (
                      analytics.courseStats.map((cs) => (
                        <tr key={cs.course_id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-mono font-bold text-slate-900">{cs.course_code}</td>
                          <td className="py-3 text-slate-800 font-medium">{cs.course_name}</td>
                          <td className="py-3 font-mono text-slate-600">{cs.total_questions} Soru</td>
                          <td className="py-3 font-mono text-slate-600">{cs.attempts_count}</td>
                          <td className="py-3 font-mono font-bold text-slate-900">
                            {cs.average_score > 0 ? `${cs.average_score} / 100` : '—'}
                          </td>
                          <td className="py-3 font-mono text-emerald-700 font-semibold">
                            {cs.attempts_count > 0 ? `%${cs.pass_rate}` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: QUESTION BANK (GELİŞMİŞ SORU HAVUZU) --- */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Question Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-3 py-1.5 font-medium pr-8 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="all">Tüm Dersler ({questions.length})</option>
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_code} - {c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  value={selectedDifficultyFilter}
                  onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-3 py-1.5 font-medium pr-8 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="all">Tüm Zorluklar</option>
                  <option value="kolay">Kolay</option>
                  <option value="normal">Normal</option>
                  <option value="zor">Zor</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Soru metni veya konu ara..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md pl-8 pr-3 py-1.5 w-48 sm:w-64 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsJsonModalOpen(true)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="JSON formatında toplu soru yükle"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>JSON İçe Aktar</span>
              </button>

              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="JSON olarak dışa aktar"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON Dışa Aktar</span>
              </button>

              <button
                onClick={handleOpenNewQuestion}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Soru Ekle</span>
              </button>
            </div>
          </div>

          {/* Questions Grid List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-800">Soru havuzunda henüz soru bulunmuyor.</p>
                <p className="text-xs text-slate-500 mt-1">"Yeni Soru Ekle" veya "JSON İçe Aktar" butonlarını kullanarak soru ekleyebilirsiniz.</p>
              </div>
            )}
            {filteredQuestions.map((q, idx) => {
              const course = courses.find((c) => c.course_id === q.course_id);

              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {course?.course_code || q.course_id}
                      </span>
                      {q.topic && (
                        <span className="text-slate-600 font-medium">· {q.topic}</span>
                      )}
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] uppercase ${
                          q.difficulty === 'kolay'
                            ? 'bg-emerald-50 text-emerald-800'
                            : q.difficulty === 'zor'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      {/* Dynamic stats badge */}
                      <span className="text-slate-500 font-mono text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                        Soruldu: {q.stats?.times_asked || 0} kez · Başarı: %{q.stats?.success_rate || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setIsQuestionModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <MarkdownRenderer
                      content={q.text}
                      className="text-sm font-medium text-slate-900 leading-relaxed"
                    />
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {q.options.map((opt) => {
                      const isCorrect = opt.id === q.correct_answer;
                      return (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-md border text-xs flex items-start gap-2 ${
                            isCorrect
                              ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 font-medium'
                              : 'border-slate-100 bg-slate-50/50 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded font-mono font-bold flex items-center justify-center text-[10px] shrink-0 ${
                              isCorrect ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="leading-snug pt-0.5">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100">
                      <strong className="text-slate-700 block mb-1">Çözüm / Açıklama:</strong>
                      <MarkdownRenderer content={q.explanation} className="text-xs text-slate-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: EXAM MANAGEMENT & ASSIGNMENT --- */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Sınav Takvimi ve Atamalar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Öğrencilere sınav ata, süre ve geçerlilik tarih aralığı belirle (Vize sınavları NocoDB değerlendirme tablosuna aktarılır)
              </p>
            </div>

            <button
              onClick={handleOpenNewExam}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Sınav Oluştur</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.length === 0 && (
              <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-800">Henüz oluşturulmuş bir sınav bulunmuyor.</p>
                <p className="text-xs text-slate-500 mt-1">"Yeni Sınav Oluştur" butonuna tıklayarak ilk sınavınızı tanımlayabilirsiniz.</p>
              </div>
            )}
            {exams.map((exam) => {
              const course = courses.find((c) => c.course_id === exam.course_id);
              const examAttempts = attempts.filter((a) => a.exam_id === exam.id && a.completed_at);
              const avgScore =
                examAttempts.length > 0
                  ? Math.round(examAttempts.reduce((s, a) => s + (a.score || 0), 0) / examAttempts.length)
                  : 0;

              return (
                <div
                  key={exam.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {course?.course_code || exam.course_id}
                        </span>
                        <span className="uppercase text-[11px] font-semibold text-slate-700">
                          {exam.exam_type}
                        </span>
                        {exam.exam_type === 'vize' && (
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            · NocoDB Entegre
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingExam(exam);
                            setIsExamModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-800"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {exam.title}
                    </h3>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600 my-4">
                      <div className="flex justify-between">
                        <span>Sınav Süresi:</span>
                        <span className="font-mono font-semibold text-slate-800">{exam.duration_minutes} Dakika</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Soru Sayısı:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {exam.question_count && exam.question_count < exam.question_ids.length
                            ? `${exam.question_count} / ${exam.question_ids.length} (Dengeli Seçim)`
                            : `${exam.question_ids.length} Soru`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Geçerlilik Aralığı:</span>
                        <span className="font-mono text-slate-700">
                          {new Date(exam.start_time).toLocaleDateString('tr-TR')} - {new Date(exam.end_time).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Öğrenci Kapsamı:</span>
                        <span className="font-semibold text-slate-800">
                          {exam.assigned_student_ids && exam.assigned_student_ids.length > 0
                            ? `${exam.assigned_student_ids.length} Özel Seçilen Öğrenci`
                            : 'Dersi Alan Öğrenciler (lms_courses_students)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono">
                      {examAttempts.length} Öğrenci Tamamladı
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      Ort. Not: {avgScore > 0 ? `${avgScore} / 100` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 4: STUDENT PERFORMANCE & SUCCESS REPORTS --- */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Student Selector Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Kişisel Öğrenci Performans İncelemesi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Öğrencinin tüm sınav geçmişi, başarı grafiği ve NocoDB lms_students eşleşmesi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Öğrenci Seç:</span>
                <select
                  value={selectedStudentForReport}
                  onChange={(e) => setSelectedStudentForReport(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-3 py-1.5 font-medium pr-8 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name_surname} ({st.student_no}) - {st.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student Detailed Performance View */}
          {(() => {
            const currentStudent = students.find((s) => s.id === selectedStudentForReport);
            const studentAttempts = attempts.filter((a) => a.student_id === selectedStudentForReport && a.completed_at);
            const avg =
              studentAttempts.length > 0
                ? Math.round(studentAttempts.reduce((s, a) => s + (a.score || 0), 0) / studentAttempts.length)
                : 0;

            if (!currentStudent) {
              return (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                  <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-800">Kayıtlı öğrenci bulunmuyor.</p>
                  <p className="text-xs text-slate-500 mt-1">NocoDB LMS sekmesinden öğrencileri senkronize edebilirsiniz.</p>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Bento Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <span className="text-xs text-slate-500 block mb-1">Girdiği Sınav Sayısı</span>
                    <div className="text-3xl font-extrabold font-mono text-slate-900">{studentAttempts.length}</div>
                    <div className="text-xs text-slate-500 mt-2">
                      {currentStudent.department}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <span className="text-xs text-slate-500 block mb-1">Kişisel Başarı Ortalaması</span>
                    <div className="text-3xl font-extrabold font-mono text-emerald-700">
                      {avg} <span className="text-sm font-normal text-slate-400">/ 100</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Tüm Sınavlar Ağırlıklı
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <span className="text-xs text-slate-500 block mb-1">NocoDB Öğrenci No</span>
                    <div className="text-2xl font-extrabold font-mono text-slate-900">{currentStudent.student_no}</div>
                    <div className="text-xs text-slate-500 mt-2 truncate">
                      {currentStudent.email}
                    </div>
                  </div>
                </div>

                {/* Attempt History */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                    Sınav Karnesi & Sonuç Detayları
                  </h3>

                  {studentAttempts.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">
                      Bu öğrenci henüz bir sınavı tamamlamamıştır.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-3 font-semibold">Sınav Adı</th>
                            <th className="pb-3 font-semibold">Ders</th>
                            <th className="pb-3 font-semibold">Tarih</th>
                            <th className="pb-3 font-semibold">Süre</th>
                            <th className="pb-3 font-semibold">Doğru / Yanlış</th>
                            <th className="pb-3 font-semibold">Puan</th>
                            <th className="pb-3 font-semibold">Durum</th>
                            <th className="pb-3 font-semibold">NocoDB Vize Durumu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentAttempts.map((att) => {
                            const exam = exams.find((e) => e.id === att.exam_id);
                            const course = courses.find((c) => c.course_id === att.course_id);

                            return (
                              <tr key={att.id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-medium text-slate-900">{exam?.title || att.exam_id}</td>
                                <td className="py-3 font-mono text-slate-700">{course?.course_code}</td>
                                <td className="py-3 text-slate-500">
                                  {new Date(att.completed_at || '').toLocaleDateString('tr-TR')}
                                </td>
                                <td className="py-3 font-mono text-slate-600">
                                  {Math.round((att.duration_seconds_taken || 0) / 60)} dk
                                </td>
                                <td className="py-3 font-mono">
                                  <span className="text-emerald-700 font-bold">{att.correct_count}D</span> /{' '}
                                  <span className="text-rose-700">{att.wrong_count}Y</span>
                                </td>
                                <td className="py-3 font-mono font-bold text-slate-900">{att.score} / 100</td>
                                <td className="py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                      att.passed ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                    }`}
                                  >
                                    {att.passed ? 'Geçti' : 'Kaldı'}
                                  </span>
                                </td>
                                <td className="py-3">
                                  {exam?.exam_type === 'vize' ? (
                                    <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> lms_evaluation_results Senkronize
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">Vize Değil (Yerel)</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* --- TAB 5: NOCODB LMS ENTEGRASYONU --- */}
      {activeTab === 'nocodb' && nocodbConfig && (
        <div className="space-y-6">
          {/* NocoDB Setup Bento Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-700" />
                  NocoDB LMS Entegrasyon Ayarları
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dersler (lms_courses), Öğrenciler (lms_students) ve Vize Sınav Değerlendirmeleri (lms_evaluation_results)
                </p>
              </div>

              {configSaveSuccess && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  ✓ Ayarlar Kaydedildi
                </span>
              )}
            </div>

            <form onSubmit={handleSaveNocoDBConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NocoDB Sunucu URL (Base URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://nocodb.yourdomain.com"
                    value={nocodbConfig.base_url}
                    onChange={(e) => setNocodbConfig({ ...nocodbConfig, base_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Coolify veya Docker üzerinde kurulu NocoDB adresiniz
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NocoDB API Token (xc-token)
                  </label>
                  <input
                    type="password"
                    placeholder="NocoDB API token..."
                    value={nocodbConfig.api_token}
                    onChange={(e) => setNocodbConfig({ ...nocodbConfig, api_token: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    NocoDB Kullanıcı Ayarları &gt; API Tokens sekmesinden alınır
                  </span>
                </div>
              </div>

              {/* Mapped Table IDs (Pre-configured as requested) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Dersler Tablosu (lms_courses)</span>
                  <span className="font-mono text-xs font-bold text-slate-800">{nocodbConfig.courses_table_id}</span>
                  <p className="text-[10px] text-slate-400 mt-1">m935015e01psf34</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Öğrenciler (lms_students)</span>
                  <span className="font-mono text-xs font-bold text-slate-800">{nocodbConfig.students_table_id}</span>
                  <p className="text-[10px] text-slate-400 mt-1">muuofbvrmpm5e5b</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Ders-Öğrenci (lms_courses_students)</span>
                  <span className="font-mono text-xs font-bold text-slate-800">{nocodbConfig.courses_students_table_id}</span>
                  <p className="text-[10px] text-slate-400 mt-1">mfqru4rs0jp87fn ({enrollmentsCount} Kayıt)</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Değerlendirme (lms_evaluation_results)</span>
                  <span className="font-mono text-xs font-bold text-slate-800">{nocodbConfig.evaluation_table_id}</span>
                  <p className="text-[10px] text-slate-400 mt-1">md50zxh2syamk2i (Vize Notları)</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncCourses}
                    disabled={syncingCourses}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingCourses ? 'animate-spin' : ''}`} />
                    <span>Dersleri Çek (lms_courses)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncStudents}
                    disabled={syncingStudents}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingStudents ? 'animate-spin' : ''}`} />
                    <span>Öğrencileri Çek (lms_students)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncEnrollments}
                    disabled={syncingEnrollments}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingEnrollments ? 'animate-spin' : ''}`} />
                    <span>Ders-Öğrenci Kayıtlarını Çek (lms_courses_students)</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  Ayarları Kaydet
                </button>
              </div>
            </form>
          </div>

          {/* Sync Audit Logs */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                NocoDB Senkronizasyon & Vize İletim Günlüğü
              </h3>
              <span className="text-xs font-mono text-slate-400">Son İşlemler</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {nocodbLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Henüz bir işlem kaydedilmedi.</p>
              ) : (
                nocodbLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                      log.status === 'success'
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : log.status === 'error'
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="uppercase text-[10px] tracking-wider text-slate-500 font-mono">
                          {log.type}
                        </span>
                        <span>·</span>
                        <span>{log.message}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: QUESTION CREATE / EDIT --- */}
      {isQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingQuestion.id ? 'Soruyu Düzenle' : 'Soru Havuzuna Yeni Soru Ekle'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ders Seçimi</label>
                  <select
                    value={editingQuestion.course_id}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, course_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.course_code} - {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Konu / Kategori</label>
                  <input
                    type="text"
                    placeholder="Örn: Ağaçlar, Sıralama, ACID..."
                    value={editingQuestion.topic || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zorluk Derecesi</label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        difficulty: e.target.value as QuestionDifficulty,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="kolay">Kolay</option>
                    <option value="normal">Normal</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
              </div>

              <MarkdownEditor
                value={editingQuestion.text || ''}
                onChange={(val) => setEditingQuestion({ ...editingQuestion, text: val })}
                label="Soru Metni (Markdown & Resim Destekli)"
                placeholder="Soru metnini yazınız. Panodan kopyaladığınız resmi veya ekran görüntüsünü doğrudan Ctrl+V ile buraya yapıştırabilirsiniz..."
                required
                rows={4}
              />

              {/* Options A, B, C, D */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Seçenekler (Çoktan Seçmeli) & Doğru Şık
                </label>
                <div className="space-y-2">
                  {(editingQuestion.options || []).map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-slate-100 rounded font-mono font-bold flex items-center justify-center text-xs text-slate-700 shrink-0">
                        {opt.id}
                      </div>
                      <input
                        type="text"
                        placeholder={`Şık ${opt.id} içeriği...`}
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...(editingQuestion.options || [])];
                          newOpts[i].text = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: newOpts });
                        }}
                        required
                        className="flex-1 bg-slate-50 border border-slate-200 rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 shrink-0">
                        <input
                          type="radio"
                          name="correct_answer_radio"
                          checked={editingQuestion.correct_answer === opt.id}
                          onChange={() => setEditingQuestion({ ...editingQuestion, correct_answer: opt.id })}
                          className="accent-slate-900"
                        />
                        <span>Doğru</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <MarkdownEditor
                value={editingQuestion.explanation || ''}
                onChange={(val) => setEditingQuestion({ ...editingQuestion, explanation: val })}
                label="Çözüm Açıklaması (Markdown Destekli - Sınav Sonrası Gösterilir)"
                placeholder="Doğru cevabın gerekçesini, formüllerini ve çözüm adımlarını açıklayınız..."
                rows={2}
                helpText="💡 Çözüm adımlarına da formül, kod veya görsel ekleyebilirsiniz."
              />

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
                >
                  Soruyu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: JSON IMPORT --- */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                JSON Formatında Toplu Soru Yükleme
              </h3>
              <button
                onClick={handleGenerateSampleJson}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
              >
                Örnek Şablon Getir
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Sorularınızı aşağıdaki JSON formatında giriniz. Her sorunun ders kodu (<code className="font-mono">course_id</code>), soru metni, şıkları ve doğru cevabı belirtilmelidir.
            </p>

            <textarea
              rows={12}
              placeholder="JSON verisini buraya yapıştırınız..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-slate-900 focus:outline-none leading-relaxed"
            />

            {jsonErrors.length > 0 && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 space-y-1">
                {jsonErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            {jsonSuccessMessage && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-semibold">
                ✓ {jsonSuccessMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50"
              >
                Kapat
              </button>
              <button
                onClick={handleProcessImportJson}
                className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
              >
                Doğrula ve Yükle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: EXAM CREATOR --- */}
      {isExamModalOpen && editingExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingExam.id ? 'Sınavı Düzenle' : 'Yeni Sınav Oluştur & Öğrencilere Ata'}
            </h3>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sınav Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: 2025-2026 Güz Dönemi Vize Sınavı"
                  value={editingExam.title}
                  onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ders Seçimi</label>
                  <select
                    value={editingExam.course_id}
                    onChange={(e) => {
                      const newCourse = e.target.value;
                      const courseQs = questions.filter((q) => q.course_id === newCourse);
                      setEditingExam({
                        ...editingExam,
                        course_id: newCourse,
                        question_ids: courseQs.slice(0, 5).map((q) => q.id),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.course_code} - {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sınav Türü</label>
                  <select
                    value={editingExam.exam_type}
                    onChange={(e) => setEditingExam({ ...editingExam, exam_type: e.target.value as ExamType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="vize">Vize (NocoDB Değerlendirme Entegre)</option>
                    <option value="final">Final Sınavı</option>
                    <option value="quiz">Kısa Sınav (Quiz)</option>
                    <option value="deneme">Deneme Sınavı</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sınav Süresi (Dakika)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={editingExam.duration_minutes}
                    onChange={(e) => setEditingExam({ ...editingExam, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Geçerlilik Başlangıcı</label>
                  <input
                    type="datetime-local"
                    value={editingExam.start_time?.slice(0, 16)}
                    onChange={(e) => setEditingExam({ ...editingExam, start_time: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Geçerlilik Bitişi</label>
                  <input
                    type="datetime-local"
                    value={editingExam.end_time?.slice(0, 16)}
                    onChange={(e) => setEditingExam({ ...editingExam, end_time: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Automatic Enrollment Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-start gap-3">
                <Users className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 block text-xs">
                      Otomatik Öğrenci İlişkisi (lms_courses_students)
                    </span>
                    <span className="font-mono text-[11px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                      mfqru4rs0jp87fn
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Bu dersi alan öğrenciler NocoDB <code className="font-mono text-slate-700">lms_courses_students</code> tablosundaki <code className="font-mono text-slate-700">course_id</code> ve <code className="font-mono text-slate-700">student_id</code> eşleştirmelerine göre otomatik olarak bu sınava atanır. Manuel öğrenci seçimi yapmanıza gerek yoktur.
                  </p>
                </div>
              </div>

              {/* Exam Question Count & Difficulty Proportions */}
              {(() => {
                const courseQuestions = questions.filter((q) => q.course_id === editingExam.course_id);
                const selectedPool = courseQuestions.filter((q) => editingExam.question_ids?.includes(q.id));
                const poolKolay = selectedPool.filter((q) => q.difficulty === 'kolay').length;
                const poolNormal = selectedPool.filter((q) => q.difficulty === 'normal').length;
                const poolZor = selectedPool.filter((q) => q.difficulty === 'zor').length;

                const currentCount = editingExam.question_count || selectedPool.length || 10;

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-slate-700" />
                        <span className="font-semibold text-slate-900 text-xs">
                          Sınavda Sorulacak Soru Adeti & Zorluk Dağılımı
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Havuz: {selectedPool.length} Soru (Kolay: {poolKolay}, Normal: {poolNormal}, Zor: {poolZor})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Sınavda Sorulacak Soru Sayısı
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, selectedPool.length)}
                          value={currentCount}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setEditingExam({ ...editingExam, question_count: val });
                          }}
                          className="w-full bg-white border border-slate-200 rounded p-2 font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                        />
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1">
                        <div className="font-medium text-slate-800">Hedef Zorluk Derecesi Oranı:</div>
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">%30 Kolay</span>
                          <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">%50 Normal</span>
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">%20 Zor</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-white border border-slate-200 rounded p-2.5">
                      ✓ Havuzda <strong>{selectedPool.length}</strong> soru tanımlıdır. Sınavda öğrenciye <strong>{Math.min(currentCount, selectedPool.length)}</strong> soru atanacaktır.
                      Her öğrenci sınava girdiğinde sorular ve şıklar <strong>tekil olarak karıştırılır</strong> (shuffle).
                    </div>
                  </div>
                );
              })()}

              {/* Question Selection for Pool */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Soru Havuzu ({editingExam.question_ids?.length || 0} / {questions.filter((q) => q.course_id === editingExam.course_id).length} Soru Seçildi)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        const allCourseQIds = questions
                          .filter((q) => q.course_id === editingExam.course_id)
                          .map((q) => q.id);
                        setEditingExam({
                          ...editingExam,
                          question_ids: allCourseQIds,
                          question_count: editingExam.question_count || allCourseQIds.length,
                        });
                      }}
                      className="text-slate-700 hover:text-slate-900 font-medium underline"
                    >
                      Tümünü Havuza Ekle
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExam({ ...editingExam, question_ids: [] });
                      }}
                      className="text-slate-500 hover:text-slate-700 underline"
                    >
                      Temizle
                    </button>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {questions
                    .filter((q) => q.course_id === editingExam.course_id)
                    .map((q) => {
                      const isSelected = editingExam.question_ids?.includes(q.id);
                      return (
                        <label key={q.id} className="flex items-start gap-2.5 text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const cur = editingExam.question_ids || [];
                              const next = e.target.checked ? [...cur, q.id] : cur.filter((id) => id !== q.id);
                              setEditingExam({ ...editingExam, question_ids: next });
                            }}
                            className="mt-0.5 accent-slate-900"
                          />
                          <div className="leading-snug">
                            <span className="font-medium text-slate-900">{q.text}</span>
                            <span className="text-[10px] text-slate-500 block">
                              {q.topic || 'Genel'} · Zorluk: <strong className="uppercase">{q.difficulty}</strong> · Başarı: %{q.stats?.success_rate || 0}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
                >
                  Sınavı Kaydet & Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
