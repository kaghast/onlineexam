import React from 'react';
import { LmsStudent } from '../types';
import { GraduationCap, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

interface NavbarProps {
  currentTab: 'student_exams' | 'student_performance' | 'admin';
  onSelectTab: (tab: 'student_exams' | 'student_performance' | 'admin') => void;
  currentUser: {
    role: 'student' | 'admin';
    student?: LmsStudent;
    user?: { name_surname: string; email: string; role: 'admin' };
  } | null;
  onLogout: () => void;
  onSyncNocoDB?: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  onSyncNocoDB,
  isSyncing = false,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const student = currentUser?.student;

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
            ÖS
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Akademik Sınav & Ölçme
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 shrink-0 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('student_exams')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'student_exams'
                ? 'bg-white text-slate-950 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Sınavlarım
          </button>
          <button
            onClick={() => onSelectTab('student_performance')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'student_performance'
                ? 'bg-white text-slate-950 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Karnem & Analiz
          </button>

          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'hover:text-slate-900 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Yönetici Paneli
            </button>
          )}
        </nav>

        {/* Zone 3: User Info & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin ? (
            <div className="flex items-center gap-2.5">
              {onSyncNocoDB && (
                <button
                  onClick={onSyncNocoDB}
                  disabled={isSyncing}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
                  title="NocoDB Verilerini Senkronize Et"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>NocoDB Senkron</span>
                </button>
              )}
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">Kemal Şahin</span>
                <span className="text-[11px] text-slate-500 font-mono">Yönetici</span>
              </div>
            </div>
          ) : student ? (
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">{student.name_surname}</span>
              <span className="text-[11px] text-slate-500 font-mono">No: {student.student_no}</span>
            </div>
          ) : null}

          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 px-2 py-1.5 bg-slate-50 text-xs">
        <button
          onClick={() => onSelectTab('student_exams')}
          className={`px-2 py-1 rounded ${currentTab === 'student_exams' ? 'font-bold text-slate-900 bg-white' : 'text-slate-600'}`}
        >
          Sınavlarım
        </button>
        <button
          onClick={() => onSelectTab('student_performance')}
          className={`px-2 py-1 rounded ${currentTab === 'student_performance' ? 'font-bold text-slate-900 bg-white' : 'text-slate-600'}`}
        >
          Karnem
        </button>
        {isAdmin && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`px-2 py-1 rounded ${currentTab === 'admin' ? 'font-bold text-white bg-slate-900' : 'text-slate-600'}`}
          >
            Yönetici
          </button>
        )}
      </div>
    </header>
  );
};
