/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Shield, Lock, Mail, User, Building, X, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, allUsers } = useApp();
  // If there are no users at all, default to register
  const [mode, setMode] = useState<'login' | 'register'>(allUsers.length === 0 ? 'register' : initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('master');
  const [customerName, setCustomerName] = useState('PT Astra International Tbk - Isuzu');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto detect fajrisani12@gmail.com or first user
  useEffect(() => {
    if (email.trim().toLowerCase() === 'fajrisani12@gmail.com') {
      setRole('master');
      if (!customerName || customerName === 'PT Astra International Tbk - Isuzu') {
        setCustomerName('PT Astra International Tbk - Isuzu (Head Office)');
      }
    }
  }, [email]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.message || 'Login gagal.');
        }
      } else {
        if (!displayName.trim()) {
          setErrorMsg('Nama Lengkap wajib diisi.');
          setLoading(false);
          return;
        }
        if (!customerName.trim()) {
          setErrorMsg('Nama Customer / Cabang wajib diisi.');
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
          setTimeout(() => onClose(), 1500);
        } else {
          setErrorMsg(res.message || 'Registrasi gagal.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Astra Isuzu Colors */}
        <div className="bg-linear-to-r from-[#005BAC] to-[#003B70] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white rounded-xl shadow">
              <Shield className="w-6 h-6 text-[#ED1B24]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Portal Rekonsiliasi Astra Isuzu</h3>
              <p className="text-xs text-blue-100">Departemen Retail & Part Services</p>
            </div>
          </div>

          <div className="flex border-b border-blue-400/40 mt-4">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`pb-2 px-4 text-sm font-semibold transition border-b-2 ${
                mode === 'login'
                  ? 'border-white text-white'
                  : 'border-transparent text-blue-200 hover:text-white'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`pb-2 px-4 text-sm font-semibold transition border-b-2 ${
                mode === 'register'
                  ? 'border-white text-white'
                  : 'border-transparent text-blue-200 hover:text-white'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fajri Sani / Budi Santoso"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Dropdown Pilihan Otorisasi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Otorisasi (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="master">Master System (Full Akses & Approval Akun)</option>
                    <option value="owner">Owner (Part Dept Head / Upload Surat Jalan & Approval Klaim)</option>
                    <option value="admin">Admin (Checker Gudang / Input Selisih Part Customer)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    {role === 'master' && '• Akses penuh: upload, edit, hapus seluruh data & approval akun baru.'}
                    {role === 'owner' && '• Akses upload Surat Jalan, edit/hapus data & approval klaim Return Sales.'}
                    {role === 'admin' && '• Hanya bisa melihat & memproses data sesuai Nama Customer yang didaftarkan.'}
                  </p>
                </div>

                {/* Field Nama Customer (Free text) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Customer / Cabang / Perusahaan (Free text)
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI - PT. RAJAWALI OTOMATIF TIRTAIN"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  {role === 'admin' && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      Catatan: Admin hanya dapat mengakses data sparepart yang nama perusahaannya sesuai field ini.
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="fajrisani12@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi aman"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#005BAC] hover:bg-[#00488a] text-white font-semibold text-sm rounded-xl transition shadow-md shadow-blue-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Memproses...'
              ) : mode === 'login' ? (
                'Masuk ke Portal'
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Daftar & Simpan Akun
                </>
              )}
            </button>
          </form>

          {allUsers.length === 0 && mode === 'login' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 text-center">
              Belum ada akun di database. Silakan klik tab <strong>Daftar Akun Baru</strong> di atas untuk mendaftarkan akun Master Anda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
