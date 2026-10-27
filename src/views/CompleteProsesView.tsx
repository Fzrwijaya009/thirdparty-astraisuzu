/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Printer, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  PackageCheck,
  FileWarning,
  Camera,
  Upload,
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { exportSuratJalanToExcel } from '../utils/excel';
import { SuratJalanItem, JenisClaim } from '../types';

export const CompleteProsesView: React.FC<{ onNavigate: (menu: string) => void }> = ({ onNavigate }) => {
  const { 
    items, 
    deleteItem, 
    editItemDetails, 
    setActivePrintData, 
    currentUser, 
    canAccessItem,
    submitClaimFromComplete 
  } = useApp();

  // Filter completed items and apply Admin customer isolation
  const completedItems = items.filter(item => item.status === 'completed' && canAccessItem(item.name));

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [completeDateFilter, setCompleteDateFilter] = useState('');
  // Requirement 3: Button renamed to "Item Problem (Claimed)"
  const [problemOnlyFilter, setProblemOnlyFilter] = useState(false);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQtyAktual, setEditQtyAktual] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  // Requirement 4: Popup Form Claim state
  const [claimModalItem, setClaimModalItem] = useState<SuratJalanItem | null>(null);
  const [jenisClaim, setJenisClaim] = useState<JenisClaim>('Claim Kurang');
  const [penjelasanClaim, setPenjelasanClaim] = useState('');
  const [fotoSuratJalanUrl, setFotoSuratJalanUrl] = useState('');
  const [fotoSuratJalanName, setFotoSuratJalanName] = useState('');
  const [fotoDnDusUrl, setFotoDnDusUrl] = useState('');
  const [fotoDnDusName, setFotoDnDusName] = useState('');
  const [fotoDetailItemUrl, setFotoDetailItemUrl] = useState('');
  const [fotoDetailItemName, setFotoDetailItemName] = useState('');

  const filteredItems = completedItems.filter(item => {
    if (completeDateFilter && item.completedDate !== completeDateFilter) {
      return false;
    }
    if (problemOnlyFilter && !item.hasDiscrepancy) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSJ = item.nomorSuratJalan.toLowerCase().includes(q);
      const matchMat = item.material.toLowerCase().includes(q);
      const matchDesc = item.materialDescription.toLowerCase().includes(q);
      const matchCust = item.name.toLowerCase().includes(q);
      const matchShip = item.shipmentNumber.toLowerCase().includes(q);
      return matchSJ || matchMat || matchDesc || matchCust || matchShip;
    }
    return true;
  });

  const totalProblemItems = completedItems.filter(i => i.hasDiscrepancy).length;
  const totalMatchItems = completedItems.filter(i => !i.hasDiscrepancy).length;

  const handleExport = () => {
    exportSuratJalanToExcel(
      filteredItems,
      problemOnlyFilter ? 'Astra_Isuzu_Item_Problem_Claimed' : 'Astra_Isuzu_Complete_Proses'
    );
  };

  const handleStartEdit = (item: SuratJalanItem) => {
    if (currentUser?.role === 'admin') {
      alert('Akses Ditolak: Admin hanya dapat mengubah data yang BELUM selesai/approved oleh Owner.');
      return;
    }
    setEditingId(item.id);
    setEditQtyAktual(item.qtyAktual ?? item.quantity);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = (id: string, originalQuantity: number) => {
    const isProblem = editQtyAktual < originalQuantity;
    const diff = isProblem ? originalQuantity - editQtyAktual : 0;
    const res = editItemDetails(id, {
      qtyAktual: editQtyAktual,
      hasDiscrepancy: isProblem,
      discrepancyQty: diff,
      notes: editNotes
    });
    if (!res.success) {
      alert(res.message);
    } else {
      setEditingId(null);
    }
  };

  const handleReprintSlip = (targetItem: SuratJalanItem) => {
    const shipmentGroup = items.filter(
      i => i.nomorSuratJalan === targetItem.nomorSuratJalan && i.status === 'completed'
    );
    setActivePrintData({
      title: `Berita Acara Rekonsiliasi - SJ ${targetItem.nomorSuratJalan}`,
      items: shipmentGroup.length > 0 ? shipmentGroup : [targetItem],
      nomorSuratJalan: targetItem.nomorSuratJalan,
      customerName: targetItem.name,
      completedDate: targetItem.completedDate || new Date().toISOString().split('T')[0],
      checkerName: targetItem.checkedBy || 'Checker Gudang'
    });
  };

  // Requirement 4: Open Form Claim Popup
  const handleOpenClaimModal = (item: SuratJalanItem) => {
    setClaimModalItem(item);
    setJenisClaim('Claim Kurang');
    setPenjelasanClaim(item.notes || '');
    setFotoSuratJalanUrl('');
    setFotoSuratJalanName('');
    setFotoDnDusUrl('');
    setFotoDnDusName('');
    setFotoDetailItemUrl('');
    setFotoDetailItemName('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'sj' | 'dn' | 'part') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const resultUrl = uploadEvent.target?.result as string;
      if (type === 'sj') {
        setFotoSuratJalanUrl(resultUrl);
        setFotoSuratJalanName(file.name);
      } else if (type === 'dn') {
        setFotoDnDusUrl(resultUrl);
        setFotoDnDusName(file.name);
      } else if (type === 'part') {
        setFotoDetailItemUrl(resultUrl);
        setFotoDetailItemName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleEvidence = () => {
    setFotoSuratJalanUrl('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60');
    setFotoSuratJalanName('Foto_Surat_Jalan_Astra_Ttd.jpg');
    setFotoDnDusUrl('https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop&q=60');
    setFotoDnDusName('Label_DN_Dus_Kemasan.jpg');
    setFotoDetailItemUrl('https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=60');
    setFotoDetailItemName('Fisik_Sparepart_Problem.jpg');
    if (!penjelasanClaim) {
      setPenjelasanClaim('Ditemukan ketidaksesuaian fisik saat pembongkaran koli sparepart di warehouse.');
    }
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimModalItem) return;

    if (!fotoSuratJalanUrl || !fotoDnDusUrl || !fotoDetailItemUrl) {
      alert('Mohon lampirkan ketiga foto dokumen bukti: Foto Surat Jalan, Foto DN Dus, dan Foto Fisik Part.');
      return;
    }

    submitClaimFromComplete({
      shipmentItemId: claimModalItem.id,
      jenisClaim,
      penjelasanClaim,
      documents: {
        fotoSuratJalanUrl,
        fotoSuratJalanName: fotoSuratJalanName || 'Foto_Surat_Jalan.jpg',
        fotoDnDusUrl,
        fotoDnDusName: fotoDnDusName || 'Foto_DN_Dus.jpg',
        fotoDetailItemUrl,
        fotoDetailItemName: fotoDetailItemName || 'Foto_Fisik_Part.jpg',
        keterangan: penjelasanClaim
      }
    });

    setClaimModalItem(null);
    // Requirement 4: "Submit. maka automatis berpindah ke field menu Return Sales"
    onNavigate('returns');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800">
              Hasil Verifikasi & Rekonsiliasi Selesai
            </span>
            {currentUser?.role === 'admin' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#005BAC]">
                Customer: {currentUser.customerName}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Menu Complete Proses
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar data sparepart yang telah melalui proses ceklis fisik. Lakukan proses klaim untuk item problem.
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

      {/* Summary Filter Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setProblemOnlyFilter(false)}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
            !problemOnlyFilter
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semua Item Selesai</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{completedItems.length}</div>
          </div>
          <PackageCheck className="w-6 h-6 text-blue-600" />
        </button>

        {/* Requirement 3: BUTTON GANTI MENJADI Item Problem (Claimed) */}
        <button
          onClick={() => setProblemOnlyFilter(true)}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
            problemOnlyFilter
              ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20'
              : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-red-600 uppercase tracking-wider">
                Item Problem (Claimed)
              </span>
              <span className="animate-pulse w-2 h-2 rounded-full bg-red-600" />
            </div>
            <div className="text-2xl font-black text-red-600 mt-1">{totalProblemItems}</div>
            <p className="text-[11px] text-red-700 font-medium mt-0.5">Siap Proses Klaim</p>
          </div>
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </button>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Item 100% Match Sesuai</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalMatchItems}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Tanpa selisih fisik</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="flex items-center gap-2 text-xs bg-white px-3 py-2 rounded-xl border border-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600">Filter Complete Date:</span>
              <input
                type="date"
                value={completeDateFilter}
                onChange={(e) => setCompleteDateFilter(e.target.value)}
                className="text-xs text-slate-800 outline-none"
              />
              {completeDateFilter && (
                <button
                  onClick={() => setCompleteDateFilter('')}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-1"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="relative min-w-[240px] flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari No SJ, Shipment, Material, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Ditemukan <strong>{filteredItems.length}</strong> item</span>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel
            </button>
          </div>
        </div>

        {/* Table Complete Items */}
        {/* Mobile View: Handphone-Friendly Cards (block md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-200">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              Tidak ada data yang sesuai dengan filter Complete Proses.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isProblem = item.hasDiscrepancy || (item.qtyAktual !== undefined && item.qtyAktual < item.quantity);
              const isEditing = editingId === item.id;

              return (
                <div 
                  key={item.id} 
                  className={`p-4 space-y-3 transition ${
                    isProblem ? 'bg-red-50/80 border-l-4 border-l-red-500' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#005BAC]">
                          {item.material}
                        </span>
                        {isProblem ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white">
                            <AlertTriangle className="w-3 h-3 text-white" />
                            PROBLEM
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            SESUAI
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">
                        {item.materialDescription}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        SJ: <span className="font-mono font-bold text-slate-700">{item.nomorSuratJalan}</span> • Cust: {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tgl Selesai: {item.completedDate || '-'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleReprintSlip(item)}
                      title="Cetak Berita Acara"
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Qty SJ:</span>
                      <span className="font-bold text-slate-800">{item.quantity} {item.handlingUnitUom}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Qty Aktual:</span>
                      <span className={isProblem ? 'font-black text-red-600' : 'font-bold text-slate-800'}>
                        {item.qtyAktual ?? item.quantity} {item.handlingUnitUom}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Selisih:</span>
                      {isProblem ? (
                        <span className="font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                          -{item.discrepancyQty || item.quantity - (item.qtyAktual ?? 0)}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-600">0</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Claim Button */}
                  {isProblem && (
                    <button
                      onClick={() => handleOpenClaimModal(item)}
                      className="w-full py-2 px-3 bg-[#ED1B24] hover:bg-[#c9141c] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <FileWarning className="w-4 h-4" />
                      Claim Proses (Isi Form Klaim)
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Complete Date</th>
                <th className="py-3 px-3">No. Surat Jalan</th>
                <th className="py-3 px-3">Shipment No</th>
                <th className="py-3 px-3">Material (Part No)</th>
                <th className="py-3 px-3">Deskripsi Sparepart</th>
                <th className="py-3 px-3 text-center">Qty SJ</th>
                <th className="py-3 px-3 text-center">Qty Aktual</th>
                <th className="py-3 px-3 text-center">Selisih</th>
                <th className="py-3 px-3">UoM</th>
                <th className="py-3 px-3">Customer / Cabang</th>
                <th className="py-3 px-3 text-center">Field Claim Proses</th>
                <th className="py-3 px-3 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    Tidak ada data yang sesuai dengan filter Complete Proses.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isProblem = item.hasDiscrepancy || (item.qtyAktual !== undefined && item.qtyAktual < item.quantity);
                  const isEditing = editingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        isProblem
                          ? 'bg-red-50/80 hover:bg-red-100/60 font-medium border-l-4 border-l-red-500'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Red Notification Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isProblem ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-600 text-white shadow-xs">
                            <AlertTriangle className="w-3 h-3 text-white" />
                            ITEM PROBLEM
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            SESUAI
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {item.completedDate || '-'}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {item.nomorSuratJalan}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {item.shipmentNumber}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.material}
                      </td>

                      <td className="py-2.5 px-3 max-w-xs truncate" title={item.materialDescription}>
                        {item.materialDescription}
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                        {item.quantity}
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editQtyAktual}
                            onChange={(e) => setEditQtyAktual(parseInt(e.target.value, 10) || 0)}
                            className="w-16 px-1.5 py-0.5 text-center font-mono border border-blue-400 rounded outline-none"
                          />
                        ) : (
                          <span className={isProblem ? 'text-red-700 text-sm font-black' : 'text-slate-800'}>
                            {item.qtyAktual ?? item.quantity}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold whitespace-nowrap">
                        {isProblem ? (
                          <span className="text-red-700 bg-red-200/80 px-2 py-0.5 rounded border border-red-400">
                            -{item.discrepancyQty || item.quantity - (item.qtyAktual ?? 0)}
                          </span>
                        ) : (
                          <span className="text-emerald-700">0</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {item.handlingUnitUom}
                      </td>

                      <td className="py-2.5 px-3 max-w-xs truncate" title={item.name}>
                        {item.name}
                      </td>

                      {/* Requirement 4: Field Claim Proses Button */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isProblem ? (
                          <button
                            onClick={() => handleOpenClaimModal(item)}
                            className="px-3 py-1.5 bg-[#ED1B24] hover:bg-[#c9141c] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 mx-auto"
                          >
                            <FileWarning className="w-3.5 h-3.5" />
                            Claim Proses
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(item.id, item.quantity)}
                                title="Simpan"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                title="Batal"
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleReprintSlip(item)}
                                title="Cetak Berita Acara Rekonsiliasi"
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {(currentUser?.role === 'master' || currentUser?.role === 'owner') && (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(item)}
                                    title="Edit Data (Owner/Master)"
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Hapus item ${item.material}?`)) {
                                        deleteItem(item.id);
                                      }
                                    }}
                                    title="Hapus Data (Owner/Master)"
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requirement 4: POPUP PENGISIAN FORM CLAIM */}
      {claimModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-[#005BAC] to-[#003B70] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FileWarning className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Form Pengisian Klaim Problem Sparepart</h3>
                  <p className="text-xs text-blue-100">
                    Departemen Retail & Part Services Astra Isuzu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClaimModalItem(null)}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Jenis Claim: Dropdown List */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Claim *
                </label>
                <select
                  value={jenisClaim}
                  onChange={(e) => setJenisClaim(e.target.value as JenisClaim)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Claim Kurang">Claim Kurang</option>
                  <option value="Claim Lebih">Claim Lebih</option>
                  <option value="Claim Rusak">Claim Rusak</option>
                  <option value="Claim Salah Fisik">Claim Salah Fisik</option>
                </select>
              </div>

              {/* Nomor Sparepart: Automatis terisi sesuai item problem yang di klik */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Sparepart (Material)
                </label>
                <input
                  type="text"
                  readOnly
                  value={claimModalItem.material}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-xl text-blue-900 cursor-not-allowed"
                />
              </div>

              {/* Sparepart Deskripsi: Automatis terisi sesuai item problem yang di klik */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sparepart Deskripsi
                </label>
                <input
                  type="text"
                  readOnly
                  value={claimModalItem.materialDescription}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-100 border border-slate-300 rounded-xl text-slate-800 cursor-not-allowed"
                />
              </div>

              {/* Detail Kuantitas & Customer */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">No. Surat Jalan:</span>
                  <span className="font-bold font-mono text-slate-800">{claimModalItem.nomorSuratJalan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Customer:</span>
                  <span className="font-bold text-slate-800 truncate block">{claimModalItem.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Qty Surat Jalan:</span>
                  <span className="font-bold text-slate-800">{claimModalItem.quantity} {claimModalItem.handlingUnitUom}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Qty Aktual Fisik:</span>
                  <span className="font-bold text-red-600">
                    {claimModalItem.qtyAktual ?? claimModalItem.quantity} {claimModalItem.handlingUnitUom}
                  </span>
                </div>
              </div>

              {/* Upload Dokumen: Foto Surat Jalan, Foto DN Dus, Foto Fisik Part */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Upload Dokumen Bukti (3 Foto Wajib) *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseSampleEvidence}
                    className="text-xs font-semibold text-[#005BAC] hover:underline"
                  >
                    + Pakai Contoh Foto Bukti
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Foto Surat Jalan */}
                  <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-center flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      1. Foto Surat Jalan
                    </span>
                    {fotoSuratJalanUrl ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200 mb-1.5">
                        <img src={fotoSuratJalanUrl} alt="SJ" className="h-16 w-full object-cover" />
                        <span className="text-[9px] text-emerald-700 font-bold block bg-emerald-50 py-0.5">Terupload ✓</span>
                      </div>
                    ) : (
                      <div className="h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 mb-1.5">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <label className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg cursor-pointer transition block">
                      Pilih Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'sj')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Foto DN Dus */}
                  <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-center flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      2. Foto DN Dus
                    </span>
                    {fotoDnDusUrl ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200 mb-1.5">
                        <img src={fotoDnDusUrl} alt="DN" className="h-16 w-full object-cover" />
                        <span className="text-[9px] text-emerald-700 font-bold block bg-emerald-50 py-0.5">Terupload ✓</span>
                      </div>
                    ) : (
                      <div className="h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 mb-1.5">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <label className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg cursor-pointer transition block">
                      Pilih Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'dn')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Foto Fisik Part */}
                  <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-center flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      3. Foto Fisik Part
                    </span>
                    {fotoDetailItemUrl ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200 mb-1.5">
                        <img src={fotoDetailItemUrl} alt="Part" className="h-16 w-full object-cover" />
                        <span className="text-[9px] text-emerald-700 font-bold block bg-emerald-50 py-0.5">Terupload ✓</span>
                      </div>
                    ) : (
                      <div className="h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 mb-1.5">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <label className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg cursor-pointer transition block">
                      Pilih Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'part')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Penjelasan Claim */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penjelasan Claim
                </label>
                <textarea
                  required
                  rows={2}
                  value={penjelasanClaim}
                  onChange={(e) => setPenjelasanClaim(e.target.value)}
                  placeholder="Jelaskan kondisi fisik part, perbedaan jumlah, segel koli, dll..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setClaimModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#ED1B24] hover:bg-[#c9141c] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  Submit Klaim ke Menu Return Sales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
