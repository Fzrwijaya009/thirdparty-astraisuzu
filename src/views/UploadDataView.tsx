/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Calendar, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ShieldAlert,
  ArrowRight,
  Database,
  Send
} from 'lucide-react';
import { parseSuratJalanFile, exportSuratJalanToExcel, downloadSuratJalanTemplate } from '../utils/excel';
import { SuratJalanItem } from '../types';

export const UploadDataView: React.FC<{ onNavigate: (menu: string) => void }> = ({ onNavigate }) => {
  const { addItemsToDatabase, currentUser, items } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staging preview state for newly uploaded rows before submitting to database
  const [stagedItems, setStagedItems] = useState<SuratJalanItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);

  // Filter states for staging preview
  const [searchQuery, setSearchQuery] = useState('');

  // Requirement 1: Only Owner has access (tidak admin)
  const isOwner = currentUser?.role === 'owner' || currentUser?.role === 'master';

  if (!isOwner) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-3 bg-amber-100 rounded-full text-amber-700">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="max-w-md">
          <h2 className="text-lg font-bold text-slate-900">Akses Terbatas: Khusus Akun Owner</h2>
          <p className="text-xs text-slate-600 mt-1">
            Menu Upload Surat Jalan hanya dapat diakses oleh akun dengan otorisasi <strong>Owner</strong> (Kepala Bagian Part Services). Akun Admin tidak memiliki izin untuk mengunggah data Surat Jalan.
          </p>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadErrorMsg('');
    setUploadSuccessMsg('');
    setSubmittedCount(null);
    setIsUploading(true);

    try {
      const parsed = await parseSuratJalanFile(file, currentUser?.displayName || 'Owner');
      setStagedItems(parsed);
      setUploadSuccessMsg(`File "${file.name}" berhasil dibaca (${parsed.length} item). Silakan periksa preview di bawah, hapus baris jika perlu, lalu klik 'Submit Data ke Database Check'.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      setUploadErrorMsg(err.message || 'Gagal memproses file. Pastikan format Excel (.xlsx) atau TSV valid.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = () => {
    const nowStr = new Date().toISOString().split('T')[0];
    const sampleItems: SuratJalanItem[] = [
      {
        id: `SJ-${Date.now()}-1`,
        nomorSuratJalan: '2026138322',
        shipmentNumber: '13597018',
        delivery: '2353206362',
        handlingUnit: '1011785539',
        material: 'I8-97017 382-A',
        materialDescription: 'HOSE FILLER NECK,PT',
        quantity: 10,
        handlingUnitUom: 'PC',
        salesDocumentType: 'I3SG',
        plant: 'I300',
        documentDate: '22.10.2026',
        customerReference: '5402201638',
        customerRefDate: '22.10.2026',
        collie: 1,
        totalWeight: 1.640,
        weightUnit: 'KG',
        totalVolume: 15769,
        volumeUnit: 'CCM',
        name: 'AI - PT. RAJAWALI OTOMATIF TIRTAIN',
        uploadDate: nowStr,
        uploadTimestamp: Date.now(),
        uploadedBy: currentUser?.displayName || 'Owner',
        status: 'uploaded',
        qtyAktual: 10,
        isChecked: false,
        hasDiscrepancy: false,
        discrepancyQty: 0
      },
      {
        id: `SJ-${Date.now()}-2`,
        nomorSuratJalan: '2026138322',
        shipmentNumber: '13597018',
        delivery: '2353206362',
        handlingUnit: '1011785540',
        material: '8-97100 344-0',
        materialDescription: 'OIL FILTER CARTRIDGE ELF',
        quantity: 24,
        handlingUnitUom: 'PC',
        salesDocumentType: 'I3SG',
        plant: 'I300',
        documentDate: '22.10.2026',
        customerReference: '5402201638',
        customerRefDate: '22.10.2026',
        collie: 2,
        totalWeight: 4.800,
        weightUnit: 'KG',
        totalVolume: 32000,
        volumeUnit: 'CCM',
        name: 'AI - PT. RAJAWALI OTOMATIF TIRTAIN',
        uploadDate: nowStr,
        uploadTimestamp: Date.now(),
        uploadedBy: currentUser?.displayName || 'Owner',
        status: 'uploaded',
        qtyAktual: 24,
        isChecked: false,
        hasDiscrepancy: false,
        discrepancyQty: 0
      },
      {
        id: `SJ-${Date.now()}-3`,
        nomorSuratJalan: '2026138322',
        shipmentNumber: '13597018',
        delivery: '2353206362',
        handlingUnit: '1011785541',
        material: '8-94437 988-0',
        materialDescription: 'BRAKE SHOE SET REAR GIGA',
        quantity: 15,
        handlingUnitUom: 'SET',
        salesDocumentType: 'I3SG',
        plant: 'I300',
        documentDate: '22.10.2026',
        customerReference: '5402201638',
        customerRefDate: '22.10.2026',
        collie: 3,
        totalWeight: 18.200,
        weightUnit: 'KG',
        totalVolume: 48900,
        volumeUnit: 'CCM',
        name: 'AI - PT. RAJAWALI OTOMATIF TIRTAIN',
        uploadDate: nowStr,
        uploadTimestamp: Date.now(),
        uploadedBy: currentUser?.displayName || 'Owner',
        status: 'uploaded',
        qtyAktual: 15,
        isChecked: false,
        hasDiscrepancy: false,
        discrepancyQty: 0
      }
    ];

    setStagedItems(sampleItems);
    setUploadSuccessMsg('3 Baris Contoh Surat Jalan Astra Isuzu (No: 2026138322) siap di-preview.');
  };

  // Requirement 2: Fitur Delete Row pada Preview
  const handleDeleteStagedRow = (index: number) => {
    setStagedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Requirement 2: Submit data maka data akan masuk ke database check
  const handleSubmitToDatabase = () => {
    if (stagedItems.length === 0) {
      alert('Tidak ada data pada preview untuk disubmit.');
      return;
    }

    const count = stagedItems.length;
    addItemsToDatabase(stagedItems);
    setStagedItems([]);
    setSubmittedCount(count);
    setUploadSuccessMsg(`Berhasil mengirimkan ${count} item Surat Jalan ke Database Check! Data kini aktif di Menu Check Sparepart.`);
  };

  const handleExportPreview = () => {
    exportSuratJalanToExcel(stagedItems, 'Preview_Upload_Surat_Jalan');
  };

  const filteredPreview = stagedItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nomorSuratJalan.toLowerCase().includes(q) ||
      item.material.toLowerCase().includes(q) ||
      item.materialDescription.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-[#005BAC]">
              Otorisasi Khusus Akun Owner
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Menu Upload Surat Jalan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Unggah file Excel/TSV Surat Jalan, periksa data pada tabel pratinjau, hapus baris yang tidak sesuai, lalu submit data ke Database Check.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadSuratJalanTemplate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition"
          >
            <Download className="w-4 h-4 text-[#005BAC]" />
            Template Excel
          </button>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-[#005BAC]" />
          Form Upload File Surat Jalan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <label 
              htmlFor="file-upload"
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center group"
            >
              <div className="p-3 bg-blue-50 text-[#005BAC] group-hover:scale-110 rounded-2xl transition mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Klik untuk unggah file Excel (.xlsx, .xls) atau TSV
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Data akan dimuat ke tabel preview di bawah sebelum dimasukkan ke database check.
              </p>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Contoh Data Referensi
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Muat data uji coba Surat Jalan Astra Isuzu No. 2026138322 untuk simulasi preview dan submit database.
            </p>
            <button
              type="button"
              onClick={handleLoadSample}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              Muat Contoh Surat Jalan
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {uploadSuccessMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
            {submittedCount !== null && (
              <button
                onClick={() => onNavigate('check')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center gap-1 shrink-0 ml-2"
              >
                Buka Menu Check Sparepart <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {uploadErrorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{uploadErrorMsg}</span>
          </div>
        )}
      </div>

      {/* Requirement 2: FITUR PREVIEW & DELETE ROW & SUBMIT DATA KE DATABASE CHECK */}
      {stagedItems.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-blue-400 shadow-md overflow-hidden animate-in fade-in">
          {/* Header of Preview */}
          <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                <h3 className="text-sm font-black text-blue-900 uppercase tracking-wide">
                  Tabel Pratinjau (Preview) Surat Jalan ({stagedItems.length} Baris Siap Submit)
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Periksa data. Anda dapat menghapus baris individual dengan ikon tong sampah merah, lalu tekan tombol Submit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportPreview}
                className="flex-1 sm:flex-none px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Excel Preview
              </button>

              <button
                onClick={handleSubmitToDatabase}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Data ({stagedItems.length})
              </button>
            </div>
          </div>

          {/* Search box for preview */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari dalam preview..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredPreview.length} dari {stagedItems.length} item
            </span>
          </div>

          {/* Preview Table with Delete Row Feature */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12 text-red-600">Hapus</th>
                  <th className="py-2.5 px-3">Upload Date</th>
                  <th className="py-2.5 px-3">No. Surat Jalan</th>
                  <th className="py-2.5 px-3">Shipment No</th>
                  <th className="py-2.5 px-3">Material (Part No)</th>
                  <th className="py-2.5 px-3">Deskripsi Sparepart</th>
                  <th className="py-2.5 px-3 text-center">Qty SJ</th>
                  <th className="py-2.5 px-3">UoM</th>
                  <th className="py-2.5 px-3">Plant</th>
                  <th className="py-2.5 px-3">Collie</th>
                  <th className="py-2.5 px-3">Nama Customer / Cabang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredPreview.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition">
                    {/* Delete Row Button */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteStagedRow(idx)}
                        title="Hapus baris ini dari upload"
                        className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                    <td className="py-2 px-3 font-mono text-slate-900 whitespace-nowrap">
                      {item.uploadDate}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {item.nomorSuratJalan}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.shipmentNumber}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.material}
                    </td>
                    <td className="py-2 px-3 max-w-xs truncate" title={item.materialDescription}>
                      {item.materialDescription}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      {item.handlingUnitUom}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.plant}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-center whitespace-nowrap">
                      {item.collie}
                    </td>
                    <td className="py-2 px-3 max-w-xs truncate" title={item.name}>
                      {item.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Submit Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-600 text-center sm:text-left">
              Perubahan baris di atas belum disimpan ke database sampai Anda menekan tombol Submit.
            </span>
            <button
              onClick={handleSubmitToDatabase}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4" />
              Submit Data ke Database Check
            </button>
          </div>
        </div>
      )}

      {/* Existing Database Count */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span>
          Total data yang telah tersimpan di Database: <strong>{items.length}</strong> item Surat Jalan.
        </span>
        <button
          onClick={() => onNavigate('check')}
          className="text-blue-600 hover:underline font-bold flex items-center gap-1"
        >
          Lihat Menu Check Sparepart →
        </button>
      </div>
    </div>
  );
};
