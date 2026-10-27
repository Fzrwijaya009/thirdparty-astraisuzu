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
  FileCheck2, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Search, 
  Eye, 
  Check, 
  X, 
  ShieldCheck, 
  Camera, 
  FileText, 
  Package, 
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { exportClaimsToExcel } from '../utils/excel';

export const ReturnSalesView: React.FC<{ onNavigate: (menu: string) => void }> = ({ onNavigate }) => {
  const { claims, submitClaimDocs, approveClaim, deleteClaim, currentUser, canAccessItem } = useApp();

  // Tab filter: 'opened' | 'inprogress' | 'completed'
  const [activeTab, setActiveTab] = useState<ClaimStatus>('opened');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected claim for viewing or uploading documents
  const [activeModalClaim, setActiveModalClaim] = useState<ReturnSalesClaim | null>(null);
  const [modalMode, setModalMode] = useState<'upload' | 'view' | 'approve'>('upload');

  // Form state for document upload
  const [fotoSuratJalanUrl, setFotoSuratJalanUrl] = useState('');
  const [fotoSuratJalanName, setFotoSuratJalanName] = useState('');
  const [fotoDnDusUrl, setFotoDnDusUrl] = useState('');
  const [fotoDnDusName, setFotoDnDusName] = useState('');
  const [fotoDetailItemUrl, setFotoDetailItemUrl] = useState('');
  const [fotoDetailItemName, setFotoDetailItemName] = useState('');
  const [notes, setNotes] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Accessible claims (Admin customer isolation)
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

  const handleOpenUploadModal = (claim: ReturnSalesClaim, mode: 'upload' | 'view' | 'approve') => {
    setActiveModalClaim(claim);
    setModalMode(mode);
    setFotoSuratJalanUrl(claim.documents?.fotoSuratJalanUrl || '');
    setFotoSuratJalanName(claim.documents?.fotoSuratJalanName || '');
    setFotoDnDusUrl(claim.documents?.fotoDnDusUrl || '');
    setFotoDnDusName(claim.documents?.fotoDnDusName || '');
    setFotoDetailItemUrl(claim.documents?.fotoDetailItemUrl || '');
    setFotoDetailItemName(claim.documents?.fotoDetailItemName || '');
    setNotes(claim.documents?.keterangan || '');
    setApprovalNotes(claim.approvalNotes || '');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'sj' | 'dn' | 'item') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to Data URL (base64) for instantaneous preview & storage simulation
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

  // Quick helper to insert realistic Astra sample photos if user doesn't have camera/photos on hand
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

  const handleApprove = () => {
    if (!activeModalClaim) return;
    const res = approveClaim(activeModalClaim.id, approvalNotes);
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

  const isOwnerOrMaster = currentUser?.role === 'owner' || currentUser?.role === 'master';

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
              Manajemen Selisih Fisik (Shortage Claims)
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Menu Return Sales
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar klaim kekurangan kuantitas fisik sparepart. Unggah 3 dokumen bukti dan proses approval Owner.
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
              Pending Verifikasi / Approval Owner
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
            filteredClaims.map((claim) => (
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

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Qty SJ:</span>
                    <span className="font-bold text-slate-800">{claim.qtySuratJalan} {claim.uom}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Qty Fisik:</span>
                    <span className="font-bold text-blue-700">{claim.qtyAktual} {claim.uom}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status:</span>
                    <span className="font-bold text-slate-700">
                      {claim.status === 'opened' ? 'Opened' : claim.status === 'inprogress' ? 'Inprogress' : 'Approved ✓'}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="pt-1">
                  {claim.status === 'opened' && (
                    <button
                      onClick={() => handleOpenUploadModal(claim, 'upload')}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-4 h-4" />
                      Upload 3 Bukti Dokumen
                    </button>
                  )}

                  {claim.status === 'inprogress' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenUploadModal(claim, 'upload')}
                        className="py-2 px-3 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-semibold text-xs transition text-center"
                      >
                        Edit Bukti
                      </button>

                      {isOwnerOrMaster ? (
                        <button
                          onClick={() => handleOpenUploadModal(claim, 'approve')}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Approve Klaim
                        </button>
                      ) : (
                        <div className="py-2 px-3 bg-slate-50 text-slate-400 text-center text-xs rounded-xl">
                          Pending Owner
                        </div>
                      )}
                    </div>
                  )}

                  {claim.status === 'completed' && (
                    <button
                      onClick={() => handleOpenUploadModal(claim, 'view')}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      Lihat Rincian Klaim & Bukti
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Claims Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Claim ID</th>
                <th className="py-3 px-3">No. Surat Jalan</th>
                <th className="py-3 px-3">Shipment No</th>
                <th className="py-3 px-3">Material (Part No)</th>
                <th className="py-3 px-3">Deskripsi Sparepart</th>
                <th className="py-3 px-3 text-center">Qty SJ</th>
                <th className="py-3 px-3 text-center">Qty Fisik</th>
                <th className="py-3 px-3 text-center text-red-600">Shortage</th>
                <th className="py-3 px-3">UoM</th>
                <th className="py-3 px-3">Customer / Cabang</th>
                <th className="py-3 px-3">Status Dokumen</th>
                <th className="py-3 px-3 text-center">Aksi Alur Kerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Tidak ada klaim di tab{' '}
                    <strong className="text-slate-700">
                      {activeTab === 'opened' ? 'Claim Opened' : activeTab === 'inprogress' ? 'Claim Inprogress' : 'Claim Completed'}
                    </strong>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {claim.id}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {claim.nomorSuratJalan}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {claim.shipmentNumber}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {claim.material}
                    </td>

                    <td className="py-2.5 px-3 max-w-xs truncate" title={claim.materialDescription}>
                      {claim.materialDescription}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold whitespace-nowrap">
                      {claim.qtySuratJalan}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold text-blue-700 whitespace-nowrap">
                      {claim.qtyAktual}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold whitespace-nowrap">
                      <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                        -{claim.qtyShortage}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {claim.uom}
                    </td>

                    <td className="py-2.5 px-3 max-w-xs truncate" title={claim.customerName}>
                      {claim.customerName}
                    </td>

                    {/* Document status info */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {claim.status === 'opened' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Menunggu Upload Bukti
                        </span>
                      )}
                      {claim.status === 'inprogress' && (
                        <div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            3 Dokumen Terupload
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Submit: {claim.submittedDate || '-'}
                          </span>
                        </div>
                      )}
                      {claim.status === 'completed' && (
                        <div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Claim Approved ✓
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Oleh: {claim.approvedBy}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Workflow Action Buttons */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {claim.status === 'opened' && (
                        <button
                          onClick={() => handleOpenUploadModal(claim, 'upload')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1.5 mx-auto"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Bukti Dokumen
                        </button>
                      )}

                      {claim.status === 'inprogress' && (
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Re-edit / re-submit documents */}
                          <button
                            onClick={() => handleOpenUploadModal(claim, 'upload')}
                            title="Edit / Re-submit Dokumen Bukti"
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg font-semibold text-xs transition"
                          >
                            Edit Bukti
                          </button>

                          {/* Approval button for Owner/Master */}
                          {isOwnerOrMaster ? (
                            <button
                              onClick={() => handleOpenUploadModal(claim, 'approve')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Approval Claim
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Pending Owner
                            </span>
                          )}
                        </div>
                      )}

                      {claim.status === 'completed' && (
                        <button
                          onClick={() => handleOpenUploadModal(claim, 'view')}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Detail
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Upload & Approval Modal */}
      {activeModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-red-500" />
                  {modalMode === 'approve'
                    ? 'Verifikasi & Approval Klaim Shortage (Owner)'
                    : modalMode === 'view'
                    ? 'Rincian Dokumen Klaim Return Sales'
                    : 'Unggah Bukti Dokumen Klaim Shortage'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Claim ID: {activeModalClaim.id} • Part: {activeModalClaim.material}
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

              {/* Requirement: 3 Dokumen Bukti
                  1. Foto Surat Jalan
                  2. Foto DN Pada Dus
                  3. Foto Detail Item
              */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    3 Dokumen Bukti Wajib (Firebase Storage)
                  </h4>
                  {modalMode === 'upload' && (
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
                        <a
                          href={fotoSuratJalanUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> Perbesar
                        </a>
                      </div>
                    ) : (
                      <div className="h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 mb-2">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Belum diunggah</span>
                      </div>
                    )}

                    {modalMode === 'upload' && (
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
                        <a
                          href={fotoDnDusUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> Perbesar
                        </a>
                      </div>
                    ) : (
                      <div className="h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 mb-2">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Belum diunggah</span>
                      </div>
                    )}

                    {modalMode === 'upload' && (
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
                        <a
                          href={fotoDetailItemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> Perbesar
                        </a>
                      </div>
                    ) : (
                      <div className="h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 mb-2">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Belum diunggah</span>
                      </div>
                    )}

                    {modalMode === 'upload' && (
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

              {/* Notes / Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Kronologi Shortage
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  disabled={modalMode !== 'upload'}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Dus dalam keadaan baik, namun isi di dalam hanya 8 pcs dari 10 pcs sesuai SJ..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                />
              </div>

              {/* Approval Section for Owner/Master */}
              {modalMode === 'approve' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Persetujuan Dokumen Klaim (Owner Verification)
                  </div>
                  <p className="text-xs text-emerald-800">
                    Dengan menyetujui, Anda menyatakan bahwa seluruh 3 dokumen bukti telah diverifikasi valid dan proses rekonsiliasi shortage diteruskan untuk penerbitan Credit Memo SAP.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Approval Owner (Opsional)
                    </label>
                    <input
                      type="text"
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="e.g. Disetujui untuk penyesuaian invoice / re-shipping"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Approval Info Display if already completed */}
              {activeModalClaim.status === 'completed' && activeModalClaim.approvedBy && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Disetujui Oleh: {activeModalClaim.approvedBy}</span>
                    <span className="text-[11px] text-emerald-700 block">
                      Tanggal Approval: {activeModalClaim.approvedAt}
                    </span>
                    {activeModalClaim.approvalNotes && (
                      <p className="mt-1 text-slate-600 italic font-normal">
                        "{activeModalClaim.approvalNotes}"
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
                {modalMode === 'upload' && (
                  <button
                    type="button"
                    onClick={handleSubmitDocuments}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    Submit Dokumen Bukti → Inprogress
                  </button>
                )}

                {modalMode === 'approve' && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Approval Claim (Selesai)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
