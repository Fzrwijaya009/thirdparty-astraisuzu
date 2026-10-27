/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClaimStatus, ReturnSalesClaim, ClaimDocuments } from '../types';
import { 
  AlertOctagon, 
  Upload, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Search, 
  Eye, 
  Check, 
  X, 
  ShieldCheck, 
  Camera, 
  Package, 
  Image as ImageIcon,
  ExternalLink,
  Timer,
  FileCheck2,
  Calendar,
  AlertCircle,
  ZoomIn
} from 'lucide-react';
import { exportClaimsToExcel } from '../utils/excel';
import { calculateLeadTime, formatDateTimeIndo } from '../utils/leadtime';

export const ReturnSalesView: React.FC<{ onNavigate: (menu: string) => void }> = () => {
  const { 
    claims, 
    submitClaimDocs, 
    analyzeClaim, 
    approveClaim, 
    currentUser, 
    canAccessItem 
  } = useApp();

  // Tab filter: 'opened' | 'inprogress' | 'completed'
  const [activeTab, setActiveTab] = useState<ClaimStatus>('opened');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected claim for modal
  const [activeModalClaim, setActiveModalClaim] = useState<ReturnSalesClaim | null>(null);
  const [modalMode, setModalMode] = useState<'upload' | 'view' | 'analyze' | 'approve'>('upload');

  // Form state for document upload (Admin/Submitter)
  const [fotoSuratJalanUrl, setFotoSuratJalanUrl] = useState('');
  const [fotoSuratJalanName, setFotoSuratJalanName] = useState('');
  const [fotoDnDusUrl, setFotoDnDusUrl] = useState('');
  const [fotoDnDusName, setFotoDnDusName] = useState('');
  const [fotoDetailItemUrl, setFotoDetailItemUrl] = useState('');
  const [fotoDetailItemName, setFotoDetailItemName] = useState('');
  const [notes, setNotes] = useState('');

  // Form state for Owner Analisa & Approval
  const [analisaNotesInput, setAnalisaNotesInput] = useState('');
  const [approvalNotesInput, setApprovalNotesInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Image zoom lightbox
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  const isOwnerOrMaster = currentUser?.role === 'owner' || currentUser?.role === 'master';
  const isAdmin = currentUser?.role === 'admin';

  // Filter accessible claims (Admin customer isolation)
  const accessibleClaims = claims.filter(c => canAccessItem(c.customerName));

  // Tab counts
  const countOpened = accessibleClaims.filter(c => c.status === 'opened').length;
  const countInprogress = accessibleClaims.filter(c => c.status === 'inprogress').length;
  const countCompleted = accessibleClaims.filter(c => c.status === 'completed').length;

  const filteredClaims = accessibleClaims.filter(claim => {
    if (claim.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSJ = claim.nomorSuratJalan.toLowerCase().includes(q);
      const matchMat = claim.material.toLowerCase().includes(q);
      const matchDesc = claim.materialDescription.toLowerCase().includes(q);
      const matchCust = claim.customerName.toLowerCase().includes(q);
      const matchId = claim.id.toLowerCase().includes(q);
      return matchSJ || matchMat || matchDesc || matchCust || matchId;
    }
    return true;
  });

  const handleOpenModal = (claim: ReturnSalesClaim, mode: 'upload' | 'view' | 'analyze' | 'approve') => {
    setActiveModalClaim(claim);
    setModalMode(mode);
    setFotoSuratJalanUrl(claim.documents?.fotoSuratJalanUrl || '');
    setFotoSuratJalanName(claim.documents?.fotoSuratJalanName || '');
    setFotoDnDusUrl(claim.documents?.fotoDnDusUrl || '');
    setFotoDnDusName(claim.documents?.fotoDnDusName || '');
    setFotoDetailItemUrl(claim.documents?.fotoDetailItemUrl || '');
    setFotoDetailItemName(claim.documents?.fotoDetailItemName || '');
    setNotes(claim.documents?.keterangan || claim.penjelasanClaim || '');
    setAnalisaNotesInput(claim.analisaNotes || '');
    setApprovalNotesInput(claim.approvalNotes || '');
    setActionSuccessMsg('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'sj' | 'dn' | 'item') => {
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
      } else if (type === 'item') {
        setFotoDetailItemUrl(resultUrl);
        setFotoDetailItemName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseSamplePhotos = () => {
    setFotoSuratJalanUrl('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60');
    setFotoSuratJalanName('Foto_Surat_Jalan_Astra_Ttd.jpg');
    setFotoDnDusUrl('https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop&q=60');
    setFotoDnDusName('Label_DN_Dus_Kemasan.jpg');
    setFotoDetailItemUrl('https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=60');
    setFotoDetailItemName('Fisik_Sparepart_Shortage.jpg');
    if (!notes) {
      setNotes('Koli diterima dalam keadaan utuh, namun setelah dus dibuka jumlah fisik kurang dari Surat Jalan.');
    }
  };

  const handleSubmitDocuments = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalClaim) return;

    if (!fotoSuratJalanUrl || !fotoDnDusUrl || !fotoDetailItemUrl) {
      alert('Mohon lengkapi ketiga foto dokumen bukti: Foto Surat Jalan, Foto DN Pada Dus, dan Foto Detail Item.');
      return;
    }

    submitClaimDocs(activeModalClaim.id, {
      fotoSuratJalanUrl,
      fotoSuratJalanName: fotoSuratJalanName || 'Surat_Jalan.jpg',
      fotoDnDusUrl,
      fotoDnDusName: fotoDnDusName || 'DN_Dus.jpg',
      fotoDetailItemUrl,
      fotoDetailItemName: fotoDetailItemName || 'Detail_Item.jpg',
      keterangan: notes
    });

    setActiveModalClaim(null);
    setActiveTab('inprogress');
  };

  // Requirement 5: Owner melakukan Analisa
  const handleSaveAnalisa = () => {
    if (!activeModalClaim) return;
    if (!analisaNotesInput.trim()) {
      alert('Mohon masukkan catatan hasil analisa Owner terlebih dahulu.');
      return;
    }

    const res = analyzeClaim(activeModalClaim.id, analisaNotesInput.trim());
    if (!res.success) {
      alert(res.message);
    } else {
      setActionSuccessMsg('Analisa Owner berhasil disimpan dan tersinkronisasi.');
      // Update local active claim reference
      setActiveModalClaim(prev => prev ? {
        ...prev,
        analyzedAt: new Date().toISOString(),
        analyzedBy: currentUser?.displayName || 'Owner Part Services',
        analisaNotes: analisaNotesInput.trim()
      } : null);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    }
  };

  // Requirement 5: Owner melakukan Approval
  const handleApprove = () => {
    if (!activeModalClaim) return;
    const res = approveClaim(activeModalClaim.id, approvalNotesInput.trim());
    if (!res.success) {
      alert(res.message);
    } else {
      setActiveModalClaim(null);
      setActiveTab('completed');
    }
  };

  const handleExport = () => {
    exportClaimsToExcel(filteredClaims, `Astra_Isuzu_Return_Sales_${activeTab.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-[#ED1B24]">
              Departemen Retail & Part Services
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Siklus Alur Klaim & Rekonsiliasi (Submit → Analisa Owner → Approval Owner)
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Menu Return Sales
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar klaim kekurangan kuantitas fisik sparepart. Unggah 3 dokumen bukti, tracking lead time, proses analisa Owner, dan approval akhir.
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

      {/* 3 Main Filter Buttons / Tabs (Claim Opened, Claim Inprogress, Claim Completed) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tab 1: Claim Opened */}
        <button
          onClick={() => setActiveTab('opened')}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
            activeTab === 'opened'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeTab === 'opened' ? 'bg-amber-600 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                1. Claim Opened
              </span>
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{countOpened}</div>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
              Upload Foto SJ, DN Dus, & Fisik
            </p>
          </div>
          <Upload className="w-6 h-6 text-amber-600" />
        </button>

        {/* Tab 2: Claim Inprogress */}
        <button
          onClick={() => setActiveTab('inprogress')}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
            activeTab === 'inprogress'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeTab === 'inprogress' ? 'bg-blue-600' : 'bg-blue-400'}`} />
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                2. Claim Inprogress
              </span>
            </div>
            <div className="text-2xl font-black text-blue-900 mt-1">{countInprogress}</div>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">
              Analisa Owner & Approval
            </p>
          </div>
          <Clock className="w-6 h-6 text-blue-600" />
        </button>

        {/* Tab 3: Claim Completed */}
        <button
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
            activeTab === 'completed'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeTab === 'completed' ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                3. Claim Completed
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{countCompleted}</div>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
              Telah Disetujui (Approved)
            </p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4">
          <div className="relative min-w-[280px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari Claim ID, No Surat Jalan, Material, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Menampilkan <strong>{filteredClaims.length}</strong> klaim</span>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Download Excel
            </button>
          </div>
        </div>

        {/* Mobile View: Handphone-Friendly Cards (block md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-200">
          {filteredClaims.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Tidak ada klaim di tab{' '}
              <strong className="text-slate-700">
                {activeTab === 'opened' ? 'Claim Opened' : activeTab === 'inprogress' ? 'Claim Inprogress' : 'Claim Completed'}
              </strong>
            </div>
          ) : (
            filteredClaims.map((claim) => {
              const leadTimeTotal = calculateLeadTime(claim.submittedDate, claim.approvedAt);
              return (
                <div key={claim.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-500">
                          {claim.id}
                        </span>
                        <span className="font-mono font-bold text-sm text-[#005BAC]">
                          {claim.material}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">
                        {claim.materialDescription}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        SJ: <span className="font-mono font-bold text-slate-700">{claim.nomorSuratJalan}</span> • Cust: {claim.customerName}
                      </div>
                    </div>

                    <span className="shrink-0 font-bold text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                      -{claim.qtyShortage} {claim.uom}
                    </span>
                  </div>

                  {/* Lead Time & Status Info */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1 font-medium">
                        <Timer className="w-3.5 h-3.5 text-blue-600" />
                        Lead Time Total:
                      </span>
                      <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {leadTimeTotal}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-200 text-[10px]">
                      <div>
                        <span className="text-slate-400 block">1. Submit:</span>
                        <span className="font-semibold text-slate-700 truncate block">
                          {claim.submittedDate ? formatDateTimeIndo(claim.submittedDate).split(',')[0] : 'Belum'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">2. Analisa:</span>
                        <span className={`font-semibold truncate block ${claim.analyzedAt ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>
                          {claim.analyzedAt ? 'Selesai ✓' : 'Menunggu'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">3. Approve:</span>
                        <span className={`font-semibold truncate block ${claim.approvedAt ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                          {claim.approvedAt ? 'Approved ✓' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="pt-1">
                    {claim.status === 'opened' && (
                      isAdmin ? (
                        <button
                          onClick={() => handleOpenModal(claim, 'upload')}
                          className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-4 h-4" />
                          Upload 3 Bukti Dokumen
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenModal(claim, 'view')}
                          className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          Preview Detail Klaim
                        </button>
                      )
                    )}

                    {claim.status === 'inprogress' && (
                      <div className="grid grid-cols-2 gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleOpenModal(claim, 'upload')}
                              className="py-2 px-3 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-semibold text-xs transition text-center"
                            >
                              Edit Bukti
                            </button>
                            <button
                              onClick={() => handleOpenModal(claim, 'view')}
                              className="py-2 px-3 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Status
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenModal(claim, 'analyze')}
                              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              {claim.analyzedAt ? 'Edit Analisa' : 'Analisa Owner'}
                            </button>
                            <button
                              onClick={() => handleOpenModal(claim, 'approve')}
                              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {claim.status === 'completed' && (
                      <button
                        onClick={() => handleOpenModal(claim, 'view')}
                        className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat Rincian & Riwayat Lead Time
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Claims Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Claim ID</th>
                <th className="py-3 px-3">No. Surat Jalan</th>
                <th className="py-3 px-3">Material (Part No)</th>
                <th className="py-3 px-3">Deskripsi Sparepart</th>
                <th className="py-3 px-3 text-center">Qty SJ / Aktual</th>
                <th className="py-3 px-3 text-center text-red-600">Shortage</th>
                <th className="py-3 px-3">Customer</th>
                {/* Requirement 6: Leadtime Status */}
                <th className="py-3 px-3">Alur & Lead Time</th>
                <th className="py-3 px-3">Status Klaim</th>
                <th className="py-3 px-3 text-center">Aksi Alur Kerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Tidak ada klaim di tab{' '}
                    <strong className="text-slate-700">
                      {activeTab === 'opened' ? 'Claim Opened' : activeTab === 'inprogress' ? 'Claim Inprogress' : 'Claim Completed'}
                    </strong>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const leadTimeTotal = calculateLeadTime(claim.submittedDate, claim.approvedAt);
                  const leadTimeSubmitToAnalisa = calculateLeadTime(claim.submittedDate, claim.analyzedAt);

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {claim.id}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {claim.nomorSuratJalan}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {claim.material}
                      </td>

                      <td className="py-2.5 px-3 max-w-xs truncate" title={claim.materialDescription}>
                        {claim.materialDescription}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-medium">
                        <span className="text-slate-900">{claim.qtySuratJalan}</span> / <span className="text-blue-700 font-bold">{claim.qtyAktual}</span> {claim.uom}
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold whitespace-nowrap">
                        <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                          -{claim.qtyShortage} {claim.uom}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 max-w-[140px] truncate" title={claim.customerName}>
                        {claim.customerName}
                      </td>

                      {/* Requirement 6: Leadtime Display */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              <Timer className="w-3 h-3 text-blue-600" />
                              {leadTimeTotal}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {claim.analyzedAt ? (
                              <span className="text-emerald-700 font-medium">
                                Analisa: {leadTimeSubmitToAnalisa}
                              </span>
                            ) : (
                              <span>Menunggu analisa</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {claim.status === 'opened' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            1. Menunggu Bukti
                          </span>
                        )}
                        {claim.status === 'inprogress' && (
                          <div className="space-y-0.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              claim.analyzedAt
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}>
                              {claim.analyzedAt ? '2. Dianalisa • Siap Approve' : '2. Inprogress (Menunggu Analisa)'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Submit: {formatDateTimeIndo(claim.submittedDate)}
                            </span>
                          </div>
                        )}
                        {claim.status === 'completed' && (
                          <div>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              3. Approved ✓
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {formatDateTimeIndo(claim.approvedAt)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Workflow Action Buttons */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {claim.status === 'opened' && (
                          isAdmin ? (
                            <button
                              onClick={() => handleOpenModal(claim, 'upload')}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1.5 mx-auto"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Upload Bukti
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenModal(claim, 'view')}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1 mx-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview
                            </button>
                          )
                        )}

                        {claim.status === 'inprogress' && (
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Requirement 5: Owner can preview documents, and perform Analisa + Approval */}
                            {isOwnerOrMaster ? (
                              <>
                                <button
                                  onClick={() => handleOpenModal(claim, 'analyze')}
                                  title="Analisa Dokumen Klaim"
                                  className={`px-2.5 py-1 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 ${
                                    claim.analyzedAt 
                                      ? 'bg-indigo-700 hover:bg-indigo-800' 
                                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-2xs'
                                  }`}
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  {claim.analyzedAt ? 'Review Analisa' : 'Analisa Owner'}
                                </button>

                                <button
                                  onClick={() => handleOpenModal(claim, 'approve')}
                                  title="Approve Dokumen Klaim"
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                              </>
                            ) : (
                              // Admin View
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenModal(claim, 'upload')}
                                  title="Edit Dokumen Bukti"
                                  className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg font-semibold text-xs transition"
                                >
                                  Edit Bukti
                                </button>
                                <button
                                  onClick={() => handleOpenModal(claim, 'view')}
                                  title="Lihat Status & Bukti"
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-semibold text-xs transition flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Status
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {claim.status === 'completed' && (
                          <button
                            onClick={() => handleOpenModal(claim, 'view')}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail & Lead Time
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Workflow & Document Modal */}
      {activeModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-red-500" />
                  {modalMode === 'analyze'
                    ? 'Proses Analisa Owner - Rekonsiliasi Shortage'
                    : modalMode === 'approve'
                    ? 'Verifikasi & Approval Klaim Shortage (Owner)'
                    : modalMode === 'view'
                    ? 'Rincian Dokumen & Tracking Lead Time Klaim'
                    : 'Unggah Bukti Dokumen Klaim Shortage'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Claim ID: {activeModalClaim.id} • Part: {activeModalClaim.material} • Surat Jalan: {activeModalClaim.nomorSuratJalan}
                </p>
              </div>
              <button
                onClick={() => setActiveModalClaim(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Action Success Message */}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {actionSuccessMsg}
                </div>
              )}

              {/* Requirement 6: Visual Lead Time Stepper */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-blue-600" />
                    Tracking Lead Time Alur Klaim
                  </h4>
                  <span className="text-xs font-bold text-blue-800 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    Total: {calculateLeadTime(activeModalClaim.submittedDate, activeModalClaim.approvedAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Step 1: Submit */}
                  <div className={`p-3 rounded-lg border text-xs ${
                    activeModalClaim.submittedDate 
                      ? 'bg-blue-50/50 border-blue-200 text-blue-900' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">1. Submit Dokumen</span>
                      {activeModalClaim.submittedDate ? (
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <span className="text-[10px] text-amber-600 font-semibold">Pending</span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px]">
                      {activeModalClaim.submittedDate ? (
                        <>
                          <div className="font-medium">{formatDateTimeIndo(activeModalClaim.submittedDate)}</div>
                          <div className="text-[10px] text-slate-500">Oleh: {activeModalClaim.submittedBy || 'Admin'}</div>
                        </>
                      ) : (
                        <span>Menunggu upload bukti</span>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Analisa Owner */}
                  <div className={`p-3 rounded-lg border text-xs ${
                    activeModalClaim.analyzedAt 
                      ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' 
                      : activeModalClaim.submittedDate 
                      ? 'bg-amber-50/50 border-amber-200 text-amber-900' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">2. Analisa Owner</span>
                      {activeModalClaim.analyzedAt ? (
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-600">
                          {activeModalClaim.submittedDate ? 'Dalam Antrian' : '-'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px]">
                      {activeModalClaim.analyzedAt ? (
                        <>
                          <div className="font-medium">{formatDateTimeIndo(activeModalClaim.analyzedAt)}</div>
                          <div className="text-[10px] text-slate-500">
                            Durasi: {calculateLeadTime(activeModalClaim.submittedDate, activeModalClaim.analyzedAt)}
                          </div>
                        </>
                      ) : (
                        <span>Belum dianalisa</span>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Approval Owner */}
                  <div className={`p-3 rounded-lg border text-xs ${
                    activeModalClaim.approvedAt 
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">3. Approval Owner</span>
                      {activeModalClaim.approvedAt ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          {activeModalClaim.analyzedAt ? 'Siap Approval' : '-'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px]">
                      {activeModalClaim.approvedAt ? (
                        <>
                          <div className="font-medium">{formatDateTimeIndo(activeModalClaim.approvedAt)}</div>
                          <div className="text-[10px] text-slate-500">Oleh: {activeModalClaim.approvedBy}</div>
                        </>
                      ) : (
                        <span>Menunggu verifikasi</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Claim Summary Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Surat Jalan:</span>
                  <span className="font-bold font-mono text-slate-900">{activeModalClaim.nomorSuratJalan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Customer:</span>
                  <span className="font-semibold text-slate-800 truncate block">{activeModalClaim.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Qty SJ / Aktual:</span>
                  <span className="font-semibold text-slate-800">
                    {activeModalClaim.qtySuratJalan} / {activeModalClaim.qtyAktual} {activeModalClaim.uom}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Selisih Shortage:</span>
                  <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    -{activeModalClaim.qtyShortage} {activeModalClaim.uom}
                  </span>
                </div>
              </div>

              {/* Requirement 5: 3 Dokumen Bukti (Owner preview without edit, Admin can upload) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      3 Dokumen Bukti Fisik
                    </h4>
                    {isOwnerOrMaster && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mode Preview Owner: Anda dapat melihat dan memperbesar gambar untuk verifikasi dokumen (dokumen tidak dapat diubah oleh Owner).
                      </p>
                    )}
                  </div>
                  {modalMode === 'upload' && isAdmin && (
                    <button
                      type="button"
                      onClick={handleUseSamplePhotos}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      + Pakai Contoh Foto
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Dokumen 1: Foto Surat Jalan */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1">
                        1. Foto Surat Jalan
                      </span>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Lembar tanda terima fisik ditandatangani checker & supir.
                      </p>
                    </div>

                    {fotoSuratJalanUrl ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200 mb-2">
                        <img
                          src={fotoSuratJalanUrl}
                          alt="Foto Surat Jalan"
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setZoomedImage({ url: fotoSuratJalanUrl, title: 'Foto Surat Jalan' })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition"
                        >
                          <ZoomIn className="w-4 h-4 mr-1" /> Perbesar
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 mb-2">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Belum diunggah</span>
                      </div>
                    )}

                    {modalMode === 'upload' && isAdmin && (
                      <label className="w-full text-center py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition block">
                        Pilih Foto SJ
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'sj')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Dokumen 2: Foto DN Pada Dus */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1">
                        2. Foto DN Pada Dus
                      </span>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Label barcode / Delivery Note yang menempel pada kemasan karton.
                      </p>
                    </div>

                    {fotoDnDusUrl ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200 mb-2">
                        <img
                          src={fotoDnDusUrl}
                          alt="Foto DN Pada Dus"
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setZoomedImage({ url: fotoDnDusUrl, title: 'Foto DN Pada Dus' })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition"
                        >
                          <ZoomIn className="w-4 h-4 mr-1" /> Perbesar
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 mb-2">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Belum diunggah</span>
                      </div>
                    )}

                    {modalMode === 'upload' && isAdmin && (
                      <label className="w-full text-center py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition block">
                        Pilih Foto DN Dus
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'dn')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Dokumen 3: Foto Detail Item */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1">
                        3. Foto Detail Item
                      </span>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Kondisi fisik sparepart di dalam dus / segel saat dibuka.
                      </p>
                    </div>

                    {fotoDetailItemUrl ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200 mb-2">
                        <img
                          src={fotoDetailItemUrl}
                          alt="Foto Detail Item"
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setZoomedImage({ url: fotoDetailItemUrl, title: 'Foto Detail Fisik Item' })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition"
                        >
                          <ZoomIn className="w-4 h-4 mr-1" /> Perbesar
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 mb-2">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Belum diunggah</span>
                      </div>
                    )}

                    {modalMode === 'upload' && isAdmin && (
                      <label className="w-full text-center py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition block">
                        Pilih Foto Detail
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'item')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes / Keterangan dari Pengunggah / Admin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Kronologi dari Checker/Admin:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  disabled={!isAdmin || modalMode !== 'upload'}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Dus dalam keadaan baik, namun isi di dalam hanya 8 pcs dari 10 pcs sesuai SJ..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-700"
                />
              </div>

              {/* Requirement 5: FIELD & BUTTON ANALISA DARI OWNER */}
              {isOwnerOrMaster && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                      <FileCheck2 className="w-4 h-4 text-indigo-600" />
                      Hasil Analisa Owner
                    </div>
                    {activeModalClaim.analyzedAt && (
                      <span className="text-[11px] font-semibold text-indigo-700">
                        Dianalisa pada: {formatDateTimeIndo(activeModalClaim.analyzedAt)} ({activeModalClaim.analyzedBy})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-indigo-800">
                    Lakukan analisa terhadap kesesuaian fisik, kemasan, nomor part, dan bukti dokumen sebelum menyetujui klaim.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Analisa Owner:
                    </label>
                    <textarea
                      rows={2}
                      value={analisaNotesInput}
                      onChange={(e) => setAnalisaNotesInput(e.target.value)}
                      placeholder="e.g. Bukti foto valid, segel dus tidak rusak, kekurangan 2 pcs dikonfirmasi akan diterbitkan Credit Memo SAP..."
                      className="w-full p-2.5 text-xs bg-white border border-indigo-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveAnalisa}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Simpan Hasil Analisa Owner
                    </button>
                  </div>
                </div>
              )}

              {/* If user is Admin and Analisa exists, display it read-only */}
              {isAdmin && activeModalClaim.analyzedAt && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    Catatan Analisa Owner ({activeModalClaim.analyzedBy})
                  </div>
                  <p className="text-slate-700 italic">"{activeModalClaim.analisaNotes}"</p>
                  <span className="text-[10px] text-indigo-600 block mt-1">
                    Waktu: {formatDateTimeIndo(activeModalClaim.analyzedAt)}
                  </span>
                </div>
              )}

              {/* Requirement 5: APPROVAL SECTION FOR OWNER */}
              {isOwnerOrMaster && (modalMode === 'approve' || modalMode === 'analyze') && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Persetujuan Klaim (Owner Approval)
                  </div>
                  <p className="text-xs text-emerald-800">
                    Menyetujui klaim ini akan mengubah status menjadi <strong>Claim Completed</strong> dan menandai rekonsiliasi selesai di portal Admin & Master System.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Approval Owner (Opsional):
                    </label>
                    <input
                      type="text"
                      value={approvalNotesInput}
                      onChange={(e) => setApprovalNotesInput(e.target.value)}
                      placeholder="e.g. Disetujui untuk adjustment invoice & re-shipping..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Display if already completed */}
              {activeModalClaim.status === 'completed' && activeModalClaim.approvedBy && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Disetujui Oleh: {activeModalClaim.approvedBy}
                    </div>
                    <span className="text-[11px] text-emerald-700 block mt-0.5">
                      Waktu Approval: {formatDateTimeIndo(activeModalClaim.approvedAt)}
                    </span>
                    {activeModalClaim.approvalNotes && (
                      <p className="mt-1 text-slate-700 italic font-normal">
                        "{activeModalClaim.approvalNotes}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveModalClaim(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {modalMode === 'upload' && isAdmin && (
                  <button
                    type="button"
                    onClick={handleSubmitDocuments}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    Submit Dokumen Bukti → Inprogress
                  </button>
                )}

                {isOwnerOrMaster && activeModalClaim.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Approve Klaim (Selesai)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal for Proof Photos */}
      {zoomedImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between text-white border-b border-slate-800">
              <span className="font-bold text-sm">{zoomedImage.title}</span>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
