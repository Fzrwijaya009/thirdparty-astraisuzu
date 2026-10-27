/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Trash2, 
  AlertTriangle, 
  Database, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw, 
  Layers, 
  FileSpreadsheet, 
  HardDrive,
  Users,
  ShieldCheck
} from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  const { 
    currentUser, 
    items, 
    claims, 
    allUsers, 
    clearShipmentsData, 
    clearClaimsData, 
    clearAllData 
  } = useApp();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'shipments' | 'claims' | 'all';
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'all',
    title: '',
    description: ''
  });

  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Requirement 4: Accessible by Master System and Owner
  const isAuthorized = currentUser?.role === 'master' || currentUser?.role === 'owner';

  if (!isAuthorized) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-600" />
        <h2 className="text-lg font-bold text-slate-900">Akses Ditolak: Khusus Master System & Owner</h2>
        <p className="text-xs text-slate-600 max-w-md">
          Halaman Pengaturan System hanya dapat diakses oleh akun berotorisasi <strong>Master System</strong> atau <strong>Owner</strong> untuk menjaga integritas database transaksi TP-SYNCS.
        </p>
      </div>
    );
  }

  const handleOpenConfirm = (type: 'shipments' | 'claims' | 'all') => {
    if (type === 'shipments') {
      setConfirmModal({
        isOpen: true,
        type: 'shipments',
        title: 'Hapus Semua Data Surat Jalan & Pengecekan?',
        description: `Tindakan ini akan menghapus permanen seluruh ${items.length} item Surat Jalan dan hasil verifikasi fisik dari database.`
      });
    } else if (type === 'claims') {
      setConfirmModal({
        isOpen: true,
        type: 'claims',
        title: 'Hapus Semua Data Return Sales Claim?',
        description: `Tindakan ini akan menghapus permanen seluruh ${claims.length} klaim dan dokumen bukti shortage dari database.`
      });
    } else {
      setConfirmModal({
        isOpen: true,
        type: 'all',
        title: 'BERSIHKAN SEMUA DATA TRANSAKSI SISTEM?',
        description: `PERINGATAN: Tindakan ini akan mengosongkan seluruh data Surat Jalan (${items.length} item) dan seluruh klaim Return Sales (${claims.length} klaim) di database Firestore. Akun pengguna akan tetap aman.`
      });
    }
  };

  const handleExecuteClear = async () => {
    setIsProcessing(true);
    setActionSuccessMsg('');

    try {
      if (confirmModal.type === 'shipments') {
        await clearShipmentsData();
        setActionSuccessMsg('Seluruh data Surat Jalan & Pengecekan berhasil dibersihkan.');
      } else if (confirmModal.type === 'claims') {
        await clearClaimsData();
        setActionSuccessMsg('Seluruh data Return Sales Claim berhasil dibersihkan.');
      } else {
        await clearAllData();
        setActionSuccessMsg('Seluruh data transaksi sistem (Surat Jalan & Return Sales) berhasil dibersihkan!');
      }
    } finally {
      setIsProcessing(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-[#005BAC]">
              TP-SYNCS Management
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Third Party Synchronize System
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pengaturan System
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pusat konfigurasi, pemeliharaan database, dan utilitas pembersihan data untuk Master System dan Owner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Otoritas: {currentUser?.role === 'master' ? 'Master System' : 'Owner'}
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold text-sm">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Database Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Surat Jalan</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{items.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Database Check & Complete</p>
          </div>
          <div className="p-3 bg-blue-50 text-[#005BAC] rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Klaim Return Sales</span>
            <div className="text-2xl font-black text-red-600 mt-1">{claims.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Opened / Inprogress / Completed</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengguna Terdaftar</span>
            <div className="text-2xl font-black text-purple-700 mt-1">{allUsers.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Master, Owner & Admin</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Requirement 4: FITUR MEMBERSIHKAN SEMUA DATA ATAU HAPUS SEMUA DATA */}
      <div className="bg-white rounded-2xl p-6 border-2 border-red-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 rounded-xl text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900">
              Pembersihan & Penghapusan Data Transaksi
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Gunakan fitur ini untuk membersihkan data uji coba atau menghapus riwayat Surat Jalan dan Klaim.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Hapus Surat Jalan */}
          <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                1. Bersihkan Data Surat Jalan
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Menghapus semua data Surat Jalan di Menu Check Sparepart dan Complete Proses ({items.length} item).
              </p>
            </div>
            <button
              onClick={() => handleOpenConfirm('shipments')}
              disabled={items.length === 0}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 font-bold border border-red-300 rounded-lg text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Data Surat Jalan
            </button>
          </div>

          {/* Card 2: Hapus Klaim Return Sales */}
          <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                2. Bersihkan Data Return Sales
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Menghapus semua klaim shortage di Tab Opened, Inprogress, dan Completed ({claims.length} klaim).
              </p>
            </div>
            <button
              onClick={() => handleOpenConfirm('claims')}
              disabled={claims.length === 0}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 font-bold border border-red-300 rounded-lg text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Data Klaim
            </button>
          </div>

          {/* Card 3: Hapus SEMUA Data Transaksi */}
          <div className="border border-red-300 p-4 rounded-xl bg-red-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="animate-pulse w-2 h-2 rounded-full bg-red-600" />
                <h4 className="text-xs font-black text-red-900">
                  3. Hapus Seluruh Data Transaksi
                </h4>
              </div>
              <p className="text-[11px] text-red-800 mt-1 leading-relaxed">
                Mengosongkan seluruh riwayat Surat Jalan, rekonsiliasi, dan klaim problem sekaligus.
              </p>
            </div>
            <button
              onClick={() => handleOpenConfirm('all')}
              disabled={items.length === 0 && claims.length === 0}
              className="w-full py-2.5 px-3 bg-[#ED1B24] hover:bg-[#c9141c] text-white font-black rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bersihkan Semua Data
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{confirmModal.title}</h3>
                <span className="text-xs text-red-600 font-semibold uppercase tracking-wider">
                  Konfirmasi Otorisasi {currentUser?.role.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                disabled={isProcessing}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition flex items-center gap-2"
              >
                {isProcessing ? 'Menghapus Data...' : 'Ya, Bersihkan Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
