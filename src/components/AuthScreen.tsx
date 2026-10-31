/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  LogIn, 
  UserPlus,
  ShieldCheck,
  Check
} from 'lucide-react';
import { AstraIsuzuLogo } from './AstraIsuzuLogo';

export const AuthScreen: React.FC = () => {
  const { login, register, allUsers } = useApp();
  
  // Default to login tab
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [customerName, setCustomerName] = useState('PT Astra International Tbk - Isuzu');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isMasterCandidate = email.trim().toLowerCase() === 'fajrisani12@gmail.com';

  // Master System is exclusively reserved for fajrisani12@gmail.com
  useEffect(() => {
    if (isMasterCandidate) {
      setRole('master');
      if (!customerName || customerName === 'PT Astra International Tbk - Isuzu') {
        setCustomerName('PT Astra International Tbk - Isuzu (Head Office)');
      }
    } else if (role === 'master') {
      setRole('owner');
    }
  }, [email, isMasterCandidate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.message || 'Login gagal. Periksa email dan kata sandi Anda.');
        }
      } else {
        if (!displayName.trim()) {
          setErrorMsg('Nama Lengkap wajib diisi.');
          setLoading(false);
          return;
        }
        if (!customerName.trim()) {
          setErrorMsg('Nama Customer / Perusahaan wajib diisi.');
          setLoading(false);
          return;
        }

        const res = await register({
          email,
          password,
          displayName,
          role,
          customerName
        });

        if (res.success) {
          setSuccessMsg(res.message || 'Pendaftaran berhasil!');
        } else {
          setErrorMsg(res.message || 'Pendaftaran gagal.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#030712] via-[#09152b] to-[#1a050d] flex flex-col justify-between relative overflow-hidden selection:bg-blue-200 selection:text-blue-900">
      {/* Dynamic Glassmorphism Atmospheric Lighting: Astra Blue (#005BAC) & Isuzu Red (#ED1B24) */}
      <div className="absolute -top-36 -left-36 w-[580px] h-[580px] bg-gradient-to-br from-[#005BAC]/50 via-[#0284c7]/40 to-transparent rounded-full blur-[130px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-gradient-to-bl from-[#ED1B24]/45 via-[#f43f5e]/35 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-36 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#005BAC]/35 via-[#ED1B24]/30 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-sky-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Glass Geometry Accents */}
      <div className="absolute top-20 right-16 w-32 h-32 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl rotate-12 pointer-events-none shadow-2xl hidden md:block" />
      <div className="absolute bottom-24 left-16 w-40 h-40 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl -rotate-12 pointer-events-none shadow-2xl hidden md:block" />

      {/* High-tech Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.9)_1px,transparent_0)]" 
        style={{ backgroundSize: '32px 32px' }} 
      />

      {/* Top Corporate Glass Strip */}
      <div className="h-1.5 w-full bg-linear-to-r from-[#005BAC] via-[#38bdf8] to-[#ED1B24] shadow-[0_0_20px_rgba(56,189,248,0.7)] z-20" />

      {/* Main Authentication Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10">
        <div className="max-w-md w-full bg-white/88 backdrop-blur-2xl rounded-3xl shadow-[0_20px_70px_-15px_rgba(0,0,0,0.6),0_0_50px_rgba(0,91,172,0.3),0_0_50px_rgba(237,27,36,0.22)] overflow-hidden border border-white/60 ring-1 ring-white/40 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Logo & Header Section with Frosted Glass Finish */}
          <div className="p-8 text-center border-b border-slate-200/60 bg-linear-to-b from-white/80 via-white/50 to-slate-50/60 backdrop-blur-md">
            <div className="flex justify-center mb-5">
              <AstraIsuzuLogo className="h-13 sm:h-14 w-auto object-contain drop-shadow-xs" />
            </div>

            <div className="space-y-0.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                TP-SYNCS
              </h1>
              <p className="text-xs font-bold text-[#005BAC] tracking-wider uppercase">
                Third Party Synchronize System
              </p>
              <p className="text-[11px] text-slate-500 font-medium pt-1">
                Departemen Retail & Part Services • PT Astra International Tbk - Isuzu
              </p>
            </div>

            {/* Mode Switcher Tabs with Glass Style */}
            <div className="grid grid-cols-2 p-1 bg-slate-200/60 backdrop-blur-md rounded-2xl mt-6 text-xs font-bold border border-white/60 shadow-inner">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm border border-white/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Masuk (Login)
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-linear-to-r from-[#005BAC] to-[#0284c7] text-white shadow-sm font-bold border border-blue-400/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Daftar Akun Baru
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 pt-6">
            {errorMsg && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="leading-relaxed">{successMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fajri Sani / Budi Santoso"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Dropdown Tingkat Otorisasi (Hanya Owner & Admin untuk pendaftaran umum) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tingkat Otorisasi (Role) *
                    </label>
                    {isMasterCandidate ? (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-purple-900 block">Master System (Otoritas Tunggal)</span>
                          <span className="text-[11px] text-purple-700">Khusus akun utama fajrisani12@gmail.com</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-purple-600 text-white uppercase tracking-wider">
                          Master
                        </span>
                      </div>
                    ) : (
                      <>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                        >
                          <option value="owner">Owner (Full Akses Data, Upload Surat Jalan & Approval Klaim)</option>
                          <option value="admin">Admin (Checker Gudang / Input Qty Fisik Perusahaan Anda)</option>
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                          {role === 'owner' && '• Otorisasi Owner: Hak akses data setara Master System (Upload SJ, Full Data, Approval Klaim), kecuali Approval Akun Baru.'}
                          {role === 'admin' && '• Otorisasi Admin: Pemeriksaan fisik part & pelaporan selisih khusus perusahaan Anda terdaftar.'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Nama Customer / Perusahaan (Free text) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Customer / Cabang / Perusahaan *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. AI - PT. RAJAWALI OTOMATIF TIRTAIN"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="fajrisani12@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi (Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Masukkan kata sandi akun Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button with Blue-Red Gradient Glass Glow */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 bg-linear-to-r from-[#005BAC] via-[#0284c7] to-[#ED1B24] hover:shadow-[0_0_25px_rgba(0,91,172,0.5)] text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-900/25 border border-white/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Memproses...'
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Masuk ke Sistem TP-SYNCS
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Daftar & Aktivasi Akun TP-SYNCS
                  </>
                )}
              </button>
            </form>

            {/* Helper Notes */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Firebase Auth & Security Active
              </span>
              <span>v2.4 Enterprise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Footer */}
      <footer className="text-center py-4 text-slate-500 text-xs z-10 border-t border-slate-800">
        © {new Date().getFullYear()} PT Astra International Tbk - Isuzu. All Rights Reserved.
      </footer>
    </div>
  );
};
