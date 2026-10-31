/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  CheckSquare, 
  Square, 
  Send, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Package, 
  Layers, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { exportSuratJalanToExcel } from '../utils/excel';

export const CheckSparepartView: React.FC<{ onNavigate: (menu: string) => void }> = ({ onNavigate }) => {
  const { 
    items, 
    updateQtyAktual, 
    toggleItemCheck, 
    toggleAllChecks, 
    submitCheckItems, 
    setActivePrintData, 
    currentUser,
    canAccessItem
  } = useApp();

  // Search bar khusus untuk mencari "Material" (nomor sparepart)
  const [materialSearch, setMaterialSearch] = useState('');

  // Dropdown filter states for Owner and Master System
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedSuratJalan, setSelectedSuratJalan] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'shortage' | 'match'>('all');
  // Requirement 3: Filter bulan sesuai upload date (format YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Notice after submission
  const [submitNotice, setSubmitNotice] = useState<{ completedCount: number; shortageCount: number } | null>(null);

  const isOwnerOrMaster = currentUser?.role === 'owner' || currentUser?.role === 'master';

  // Filter items that are pending check AND accessible to current user (Admin isolation)
  const pendingItems = items.filter(item => item.status !== 'completed' && canAccessItem(item.name));

  // Unique lists for dropdown filters
  const customerList = Array.from(new Set(pendingItems.map(i => i.name).filter(Boolean))).sort();
  const suratJalanList = Array.from(new Set(pendingItems.map(i => i.nomorSuratJalan).filter(Boolean))).sort();

  // Extract unique months based on uploadDate / documentDate
  const monthList = Array.from(new Set(
    pendingItems.map(i => {
      const d = i.uploadDate || i.documentDate;
      if (d && d.length >= 7) {
        return d.slice(0, 7);
      }
      return '';
    }).filter(Boolean)
  )).sort().reverse();

  const formatMonthLabel = (ym: string) => {
    try {
      const [year, month] = ym.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch {
      return ym;
    }
  };

  // Apply filters: Customer, Surat Jalan, Bulan Upload, Status Selisih, & Search Material
  const displayItems = pendingItems.filter(item => {
    if (selectedCustomer !== 'all' && item.name !== selectedCustomer) {
      return false;
    }
    if (selectedSuratJalan !== 'all' && item.nomorSuratJalan !== selectedSuratJalan) {
      return false;
    }
    if (selectedMonth !== 'all') {
      const itemYm = (item.uploadDate || item.documentDate)?.slice(0, 7);
      if (itemYm !== selectedMonth) {
        return false;
      }
    }
    if (selectedStatusFilter === 'shortage') {
      const act = item.qtyAktual !== undefined ? item.qtyAktual : item.quantity;
      if (act === item.quantity) return false;
    } else if (selectedStatusFilter === 'match') {
      const act = item.qtyAktual !== undefined ? item.qtyAktual : item.quantity;
      if (act !== item.quantity) return false;
    }

    if (materialSearch.trim()) {
      const q = materialSearch.trim().toLowerCase();
      const matchMaterial = item.material.toLowerCase().includes(q);
      const matchDesc = item.materialDescription.toLowerCase().includes(q);
      return matchMaterial || matchDesc;
    }
    return true;
  });

  const checkedItems = displayItems.filter(i => i.isChecked);
  const allCurrentChecked = displayItems.length > 0 && checkedItems.length === displayItems.length;

  const handleToggleAll = () => {
    toggleAllChecks(!allCurrentChecked, materialSearch);
  };

  const handleQtyChange = (id: string, val: string) => {
    const parsed = parseInt(val, 10);
    updateQtyAktual(id, isNaN(parsed) ? 0 : parsed);
  };

  const handleSubmit = () => {
    if (checkedItems.length === 0) {
      alert('Pilih/ceklis setidaknya satu item yang sudah diverifikasi fisik barangnya.');
      return;
    }

    const idsToSubmit = checkedItems.map(i => i.id);
    const { completedItems, shortages } = submitCheckItems(idsToSubmit);

    setSubmitNotice({
      completedCount: completedItems.length,
      shortageCount: shortages.length
    });

    // Auto trigger Google Print View Modal
    setActivePrintData({
      title: 'Berita Acara Pengecekan Fisik Sparepart',
      items: completedItems,
      nomorSuratJalan: completedItems[0]?.nomorSuratJalan || 'Surat Jalan',
      customerName: completedItems[0]?.name || 'Astra Isuzu Customer',
      completedDate: new Date().toISOString().split('T')[0],
      checkerName: currentUser?.displayName || 'Petugas Checker'
    });
  };

  const handleExport = () => {
    exportSuratJalanToExcel(displayItems, 'Astra_Isuzu_Pengecekan_Sparepart');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800">
              Verifikasi Fisik vs Dokumen
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Sistem Ceklis & Input Qty Aktual
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Menu Check Sparepart
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Lakukan verifikasi fisik sparepart yang tiba di gudang. Masukkan Qty Aktual dan ceklis item.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download to Excel
          </button>
        </div>
      </div>

      {/* Logic Guideline Card */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-sm">Logika Otomatisasi Rekonsiliasi:</h4>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              1. Jika <strong>Qty Aktual &lt; Quantity Dokumen</strong>, selisih kurang otomatis ter-create ke <strong>Menu Return Sales</strong>.<br />
              2. Setelah item di-ceklis dan klik <strong>Submit Pengecekan</strong>, data berpindah ke <strong>Menu Complete Proses</strong> dan membuka <strong>Google Print View</strong> untuk mencetak Berita Acara.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('returns')}
            className="text-blue-700 font-bold hover:underline bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs"
          >
            Cek Menu Return Sales →
          </button>
        </div>
      </div>

      {/* Submit Success Notification */}
      {submitNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">Pengecekan Berhasil di-Submit!</span>
              <p className="mt-0.5">
                {submitNotice.completedCount} item dipindahkan ke <strong>Complete Proses</strong>.{' '}
                {submitNotice.shortageCount > 0 ? (
                  <span className="text-red-700 font-bold">
                    Terdapat {submitNotice.shortageCount} item shortage yang otomatis dibuatkan klaim di Return Sales.
                  </span>
                ) : (
                  'Seluruh item fisik sesuai 100%.'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('complete')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition"
            >
              Buka Complete Proses
            </button>
          </div>
        </div>
      )}

      {/* Control & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Dedicated Material Search Bar */}
          <div className="relative min-w-[280px] flex-1">
            <Search className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Material / Part Number (e.g. I8-97017, 8-97100)..."
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
            />
            {materialSearch && (
              <button
                onClick={() => setMaterialSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown Filter: Nama Customer / Perusahaan (Khusus Owner & Master atau multi-customer) */}
          {(isOwnerOrMaster || customerList.length > 1) && (
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-800 max-w-[220px] truncate"
              title="Filter Berdasarkan Customer"
            >
              <option value="all">🏢 Semua Customer ({customerList.length})</option>
              {customerList.map(cust => (
                <option key={cust} value={cust}>{cust}</option>
              ))}
            </select>
          )}

          {/* Filter Surat Jalan */}
          <select
            value={selectedSuratJalan}
            onChange={(e) => setSelectedSuratJalan(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-800"
            title="Filter Berdasarkan Nomor Surat Jalan"
          >
            <option value="all">📄 Semua Surat Jalan ({suratJalanList.length})</option>
            {suratJalanList.map(sj => (
              <option key={sj} value={sj}>SJ: {sj}</option>
            ))}
          </select>

          {/* Requirement 3: Filter Bulan Upload */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-800"
            title="Filter Berdasarkan Bulan Upload Surat Jalan"
          >
            <option value="all">📅 Semua Bulan Upload ({monthList.length})</option>
            {monthList.map(ym => (
              <option key={ym} value={ym}>📅 {formatMonthLabel(ym)}</option>
            ))}
          </select>

          {/* Filter Status Fisik */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-800"
            title="Filter Berdasarkan Status Fisik Barang"
          >
            <option value="all">🔍 Semua Status Fisik</option>
            <option value="shortage">⚠️ Ada Selisih (- / +)</option>
            <option value="match">✅ Kuantitas Sesuai</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAll}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition"
          >
            {allCurrentChecked ? (
              <>
                <CheckSquare className="w-4 h-4 text-blue-600" />
                Batal Ceklis Semua
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-slate-500" />
                Ceklis Semua Item
              </>
            )}
          </button>

          <button
            onClick={handleSubmit}
            disabled={checkedItems.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#00488a] rounded-xl transition shadow-md shadow-blue-900/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Submit Pengecekan ({checkedItems.length})
          </button>
        </div>
      </div>

      {/* Main Checklist & Physical Count Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Mobile View: Handphone-Friendly Cards (block md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-200">
          {displayItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              {materialSearch ? (
                <p className="text-xs">Tidak ditemukan Material dengan nomor part "{materialSearch}".</p>
              ) : (
                <p className="text-xs">Semua item telah selesai dicek atau belum ada data Surat Jalan diupload.</p>
              )}
            </div>
          ) : (
            displayItems.map((item) => {
              const actual = item.qtyAktual !== undefined ? item.qtyAktual : item.quantity;
              const diffNum = actual - item.quantity;
              const isShortage = diffNum < 0;
              const isOverage = diffNum > 0;
              const isDiscrepancy = isShortage || isOverage;
              const diffAbs = Math.abs(diffNum);

              return (
                <div 
                  key={item.id} 
                  className={`p-4 space-y-3 transition ${
                    isDiscrepancy ? 'bg-amber-50/60' : item.isChecked ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!item.isChecked}
                        onChange={() => toggleItemCheck(item.id)}
                        className="w-5 h-5 mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-mono font-bold text-sm text-[#005BAC]">
                          {item.material}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5">
                          {item.materialDescription}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          SJ: <span className="font-mono font-bold text-slate-700">{item.nomorSuratJalan}</span> • Deliv: <span className="font-mono font-bold text-slate-700">{item.delivery || '-'}</span> • Cust: {item.name}
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      {isShortage ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">
                          <AlertTriangle className="w-3 h-3" />
                          Kurang (-)
                        </span>
                      ) : isOverage ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">
                          <AlertTriangle className="w-3 h-3" />
                          Lebih (+)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Match
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Comparison on Mobile */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px] font-medium">Qty Surat Jalan:</span>
                      <span className="font-bold text-slate-900 text-sm">{item.quantity} {item.handlingUnitUom}</span>
                    </div>

                    {/* Stepper for Qty Aktual */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.id, String(Math.max(0, actual - 1)))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold flex items-center justify-center text-sm shadow-2xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={actual}
                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                        className={`w-14 h-8 text-center font-mono font-black text-sm rounded-lg border outline-none ${
                          isDiscrepancy
                            ? 'border-red-400 bg-red-50 text-red-700 font-bold'
                            : 'border-blue-400 bg-white text-blue-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.id, String(actual + 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold flex items-center justify-center text-sm shadow-2xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-slate-400 block text-[10px] font-medium">Selisih:</span>
                      {isShortage ? (
                        <span className="font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded text-xs">
                          -{diffAbs}
                        </span>
                      ) : isOverage ? (
                        <span className="font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded text-xs">
                          +{diffAbs}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-600 text-xs">0 (Pas)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Data Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allCurrentChecked}
                    onChange={handleToggleAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Material (Part No)</th>
                <th className="py-3 px-3">Deskripsi Sparepart</th>
                <th className="py-3 px-3 text-center">Qty Dokumen (Upload)</th>
                <th className="py-3 px-3 text-center bg-blue-50/70 border-x border-blue-200 text-blue-950">
                  Qty Aktual (Fisik Diterima)
                </th>
                <th className="py-3 px-3 text-center">Selisih</th>
                <th className="py-3 px-3">UoM</th>
                <th className="py-3 px-3">No. Surat Jalan</th>
                <th className="py-3 px-3">Delivery (No)</th>
                <th className="py-3 px-3">Customer / Cabang</th>
                <th className="py-3 px-3 text-center">Status Rekonsiliasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    {materialSearch ? (
                      <p>Tidak ditemukan Material dengan nomor part "{materialSearch}".</p>
                    ) : (
                      <p>Semua item telah selesai dicek atau belum ada data Surat Jalan diupload.</p>
                    )}
                  </td>
                </tr>
              ) : (
                displayItems.map((item) => {
                  const actual = item.qtyAktual !== undefined ? item.qtyAktual : item.quantity;
                  const diffNum = actual - item.quantity;
                  const isShortage = diffNum < 0;
                  const isOverage = diffNum > 0;
                  const isDiscrepancy = isShortage || isOverage;
                  const diffAbs = Math.abs(diffNum);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/30 transition ${
                        isDiscrepancy ? 'bg-amber-50/40' : item.isChecked ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!item.isChecked}
                          onChange={() => toggleItemCheck(item.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Material (Part Number) */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-blue-800">
                          {item.material}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs truncate" title={item.materialDescription}>
                        {item.materialDescription}
                      </td>

                      {/* Qty Dokumen Upload */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 whitespace-nowrap text-sm">
                        {item.quantity}
                      </td>

                      {/* Qty Aktual (Editable Input Field) */}
                      <td className="py-2 px-3 text-center bg-blue-50/40 border-x border-blue-200">
                        <div className="inline-flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={item.qtyAktual ?? item.quantity}
                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                            className={`w-20 px-2.5 py-1.5 text-center font-mono font-black text-sm rounded-lg border focus:ring-2 outline-none transition ${
                              isDiscrepancy
                                ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-400 font-bold'
                                : 'border-blue-400 bg-white text-blue-900 focus:ring-blue-500'
                            }`}
                          />
                          <span className="text-[11px] font-semibold text-slate-500">
                            {item.handlingUnitUom}
                          </span>
                        </div>
                      </td>

                      {/* Selisih */}
                      <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap font-bold">
                        {isShortage ? (
                          <span className="text-red-600 bg-red-100/80 px-2 py-0.5 rounded border border-red-300">
                            -{diffAbs}
                          </span>
                        ) : isOverage ? (
                          <span className="text-red-600 bg-red-100/80 px-2 py-0.5 rounded border border-red-300">
                            +{diffAbs}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">0 (Pas)</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {item.handlingUnitUom}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {item.nomorSuratJalan}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {item.delivery}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={item.name}>
                        {item.name}
                      </td>

                      {/* Status indicator */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isShortage ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300">
                            <AlertTriangle className="w-3 h-3" />
                            Auto-Claim Return (-)
                          </span>
                        ) : isOverage ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300">
                            <AlertTriangle className="w-3 h-3" />
                            Auto-Claim Return (+)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Match Sesuai
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom submit toolbar */}
        {displayItems.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-600">
              <span className="font-bold text-slate-800">{checkedItems.length}</span> dari {displayItems.length} item ter-ceklis.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Download to Excel
              </button>

              <button
                onClick={handleSubmit}
                disabled={checkedItems.length === 0}
                className="px-5 py-2 bg-[#005BAC] hover:bg-[#00488a] text-white font-bold rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                Submit & Buka Print Berita Acara
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
