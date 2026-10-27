/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  PackageCheck, 
  AlertOctagon, 
  UploadCloud, 
  TrendingUp, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { exportSuratJalanToExcel, exportClaimsToExcel } from '../utils/excel';

export const DashboardView: React.FC<{ onNavigate: (menu: string) => void }> = ({ onNavigate }) => {
  const { items, claims, currentUser, canAccessItem } = useApp();

  // Accessible items & claims based on Admin tenancy isolation
  const accessibleItems = items.filter(i => canAccessItem(i.name));
  const accessibleClaims = claims.filter(c => canAccessItem(c.customerName));

  // Metrics
  const totalUpload = accessibleItems.length;
  const totalComplete = accessibleItems.length > 0 ? accessibleItems.filter(i => i.status === 'completed').length : 0;
  const totalReturnProblem = accessibleClaims.length;
  const totalCompletedMatch = accessibleItems.filter(i => i.status === 'completed' && !i.hasDiscrepancy).length;
  const totalCompletedShortage = accessibleItems.filter(i => i.status === 'completed' && i.hasDiscrepancy).length;
  const totalPendingCheck = accessibleItems.filter(i => i.status !== 'completed').length;

  const totalQuantityExpected = accessibleItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalQuantityActual = accessibleItems.reduce((acc, i) => acc + (i.qtyAktual ?? (i.status === 'completed' ? i.quantity : 0)), 0);
  const totalQuantityShortage = accessibleClaims.reduce((acc, c) => acc + c.qtyShortage, 0);

  const matchRate = totalComplete > 0 
    ? Math.round((totalCompletedMatch / totalComplete) * 100) 
    : 100;

  // Unique Surat Jalan count
  const uniqueSuratJalan = Array.from(new Set(accessibleItems.map(i => i.nomorSuratJalan)));

  // Claims summary
  const claimsOpened = accessibleClaims.filter(c => c.status === 'opened').length;
  const claimsInprogress = accessibleClaims.filter(c => c.status === 'inprogress').length;
  const claimsCompleted = accessibleClaims.filter(c => c.status === 'completed').length;

  const handleExportDashboard = () => {
    exportSuratJalanToExcel(accessibleItems, 'Astra_Isuzu_Rekonsiliasi_Dashboard');
  };

  const isOwnerOrMaster = currentUser?.role === 'owner' || currentUser?.role === 'master';

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-[#005BAC]">
              TP-SYNCS • Third Party Synchronize System
            </span>
            {currentUser?.role === 'admin' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Customer: {currentUser.customerName}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Performance Rekonsiliasi Sparepart
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitoring fisik barang tiba di cabang/warehouse dibandingkan Surat Jalan pengiriman Astra Isuzu.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleExportDashboard}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download to Excel
          </button>
          
          {/* Requirement 1: Upload Surat Jalan hanya ada pada akun Owner (tidak admin) */}
          {isOwnerOrMaster && (
            <button
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#00488a] rounded-xl transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Surat Jalan Baru
            </button>
          )}
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Upload */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-blue-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Upload</span>
            <div className="p-2.5 bg-blue-50 text-[#005BAC] rounded-xl">
              <UploadCloud className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{totalUpload}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{uniqueSuratJalan.length}</span> Dokumen Surat Jalan
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Qty: {totalQuantityExpected.toLocaleString()} PC</span>
            <button onClick={() => onNavigate('upload')} className="text-blue-600 font-semibold hover:underline flex items-center">
              Detail <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Total Complete */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Complete</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-600">{totalComplete}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-emerald-700">{totalCompletedMatch}</span> Item Match 100% Sesuai
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Terselesaikan: {Math.round((totalComplete / (totalUpload || 1)) * 100)}%</span>
            <button onClick={() => onNavigate('complete')} className="text-emerald-700 font-semibold hover:underline flex items-center">
              Lihat Data <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Total Return / Problem */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-red-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Return / Problem</span>
            <div className="p-2.5 bg-red-50 text-[#ED1B24] rounded-xl">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-[#ED1B24]">{totalReturnProblem}</div>
            <p className="text-xs text-slate-500 mt-1">
              Selisih Fisik Kurang (<span className="font-semibold text-red-600">{totalQuantityShortage}</span> PC Shortage)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-red-600 font-medium">{claimsOpened} Klaim Baru (Opened)</span>
            <button onClick={() => onNavigate('returns')} className="text-red-700 font-semibold hover:underline flex items-center">
              Investigasi <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-purple-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Akurasi Penerimaan</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-purple-700">{matchRate}%</div>
            <p className="text-xs text-slate-500 mt-1">
              Tingkat kesesuaian fisik vs data SAP
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">{totalPendingCheck} item pending pengecekan</span>
            <button onClick={() => onNavigate('check')} className="text-purple-700 font-semibold hover:underline flex items-center">
              Mulai Cek <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Workflow Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Rekonsiliasi Flow Diagram & Status Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#005BAC]" />
                Pipeline Rekonsiliasi Pengiriman Astra Isuzu
              </h3>
              <p className="text-xs text-slate-500">
                Alur perpindahan data antar status dari saat upload hingga penyelesaian klaim
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-bold">
              Plant I300 / RPS
            </span>
          </div>

          {/* Interactive Visual Stages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div 
              onClick={() => onNavigate('check')}
              className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900">1. Cek Fisik Barang</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-200 text-blue-800">
                  {totalPendingCheck}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Pencocokan kuantitas aktual fisik sparepart di gudang dengan checklist barcode/material.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('complete')}
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900">2. Complete Proses</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-200 text-emerald-800">
                  {totalComplete}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Barang yang sudah divalidasi. Item dengan selisih ditandai highlight merah.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('returns')}
              className="p-4 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-red-900">3. Return Sales Claim</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-200 text-red-800">
                  {claims.length}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Klaim otomatis atas shortage item. Upload bukti foto surat jalan, DN, dan verifikasi Owner.
              </p>
            </div>
          </div>

          {/* Progress bar comparison */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Komposisi Hasil Pemeriksaan Fisik</span>
              <span className="text-slate-500">{totalComplete} dari {totalUpload} item telah dicek</span>
            </div>
            
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${totalUpload > 0 ? (totalCompletedMatch / totalUpload) * 100 : 0}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Sesuai: ${totalCompletedMatch} item`}
              />
              <div 
                style={{ width: `${totalUpload > 0 ? (totalCompletedShortage / totalUpload) * 100 : 0}%` }}
                className="bg-red-500 h-full transition-all duration-500"
                title={`Shortage/Problem: ${totalCompletedShortage} item`}
              />
              <div 
                style={{ width: `${totalUpload > 0 ? (totalPendingCheck / totalUpload) * 100 : 0}%` }}
                className="bg-slate-300 h-full transition-all duration-500"
                title={`Pending Cek: ${totalPendingCheck} item`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-emerald-500" />
                <span className="text-slate-600">Sesuai (Match): <strong>{totalCompletedMatch}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-red-500" />
                <span className="text-slate-600">Shortage (Return): <strong>{totalCompletedShortage}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-slate-300" />
                <span className="text-slate-600">Belum Dicek: <strong>{totalPendingCheck}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Return Sales Claims Funnel Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#ED1B24]" />
                Status Klaim Return Sales
              </h3>
              <button
                onClick={() => onNavigate('returns')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3">
              {/* Claim Opened */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900">Claim Opened</div>
                  <div className="text-[11px] text-amber-700">Perlu upload 3 foto bukti dokumen</div>
                </div>
                <span className="text-lg font-black text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                  {claimsOpened}
                </span>
              </div>

              {/* Claim Inprogress */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900">Claim Inprogress</div>
                  <div className="text-[11px] text-blue-700">Menunggu verifikasi & Approval Owner</div>
                </div>
                <span className="text-lg font-black text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                  {claimsInprogress}
                </span>
              </div>

              {/* Claim Completed */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">Claim Completed</div>
                  <div className="text-[11px] text-emerald-700">Telah disetujui Owner & diterbitkan Credit Note</div>
                </div>
                <span className="text-lg font-black text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  {claimsCompleted}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Otorisasi Approval Klaim
            </div>
            Klaim pada status Inprogress diverifikasi langsung oleh <strong>Owner</strong> (Part Dept Head). Admin tidak dapat memanipulasi klaim yang telah selesai.
          </div>
        </div>
      </div>
    </div>
  );
};
