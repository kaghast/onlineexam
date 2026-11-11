import React, { useState } from 'react';
import { api } from '../api';
import { LmsStudent } from '../types';
import {
  Lock,
  User,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Phone,
  HelpCircle,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (authData: {
    role: 'student' | 'admin';
    student?: LmsStudent;
    user?: { name_surname: string; email: string; role: 'admin' };
  }) => void;
  students: LmsStudent[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, students }) => {
  const [username, setUsername] = useState('');
  const [credential, setCredential] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(username, credential);
      onLoginSuccess(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setCredential(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-slate-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Lockup */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-base shadow-xs">
            ÖS
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Akademik Sınav & Ölçme
          </span>
        </div>

        <p className="text-center text-xs text-slate-500 max-w-xs mx-auto">
          T.C. Üniversite & LMS Sınav Yönetim Sistemi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="pb-4 mb-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Sisteme Giriş Yapın
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sınavlarınıza erişmek için öğrenci veya yönetici bilgilerinizi giriniz.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Öğrenci Numarası <span className="font-normal text-slate-400">(veya Yönetici E-postası)</span>
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="Örn: 20240101 veya kemalsahin@gmail.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label
                htmlFor="credential"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Cep Telefonu Numarası <span className="font-normal text-slate-400">(veya Yönetici Şifresi)</span>
              </label>
              <div className="relative">
                <input
                  id="credential"
                  type="password"
                  required
                  placeholder="Örn: 0532 100 20 30 veya Şifreniz"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <span>Giriş Yapılıyor...</span>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Helper / Demo Credentials Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
              Hızlı Test Girişleri (Tek Tıkla Doldur)
            </span>

            <div className="space-y-2">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleQuickFill('kemalsahin@gmail.com', 'admin123')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-semibold text-slate-900">Yönetici / Eğitmen</span>
                    <span className="text-[11px] text-slate-500 block">kemalsahin@gmail.com (Şifre: admin123)</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Seç →</span>
              </button>

              {/* Student 1 */}
              <button
                type="button"
                onClick={() => handleQuickFill('20240101', '05321002030')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-semibold text-slate-900">Kemal Şahin (Öğrenci)</span>
                    <span className="text-[11px] text-slate-500 block">No: 20240101 · Tel: 0532 100 2030</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Seç →</span>
              </button>

              {/* Student 2 */}
              <button
                type="button"
                onClick={() => handleQuickFill('20240102', '05332113040')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-semibold text-slate-900">Zeynep Kaya (Öğrenci)</span>
                    <span className="text-[11px] text-slate-500 block">No: 20240102 · Tel: 0533 211 3040</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Seç →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <span>NocoDB LMS: lms_students (muuofbvrmpm5e5b) tablosu ile eşleşir</span>
        </div>
      </div>
    </div>
  );
};
