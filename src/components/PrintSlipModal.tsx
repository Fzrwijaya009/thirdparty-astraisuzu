/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Printer, X, CheckCircle2, AlertTriangle, FileSpreadsheet, Download, FileText } from 'lucide-react';
import { SuratJalanItem } from '../types';
import { exportSuratJalanToExcel } from '../utils/excel';
import { jsPDF } from 'jspdf';
import { AstraIsuzuLogo } from './AstraIsuzuLogo';
import { ASTRA_ISUZU_LOGO_DATA_URI } from '../assets/logoDataUri';

interface PrintSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title?: string;
    items: SuratJalanItem[];
    nomorSuratJalan?: string;
    customerName?: string;
    completedDate?: string;
    checkerName?: string;
  } | null;
}

export const PrintSlipModal: React.FC<PrintSlipModalProps> = ({ isOpen, onClose, data }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !data) return null;

  const items = data.items || [];
  const totalQtySuratJalan = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalQtyAktual = items.reduce((acc, i) => acc + (i.qtyAktual ?? i.quantity), 0);
  const totalShortage = items.reduce((acc, i) => acc + (i.discrepancyQty || 0), 0);
  const hasAnyShortage = totalShortage > 0;

  // Method 1: Robust Iframe-based Print Trigger (Works seamlessly inside sandboxed iframes)
  const handlePrintView = () => {
    const printableElement = document.getElementById('printable-document');
    if (!printableElement) {
      window.print();
      return;
    }

    try {
      // Create hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        return;
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Berita Acara Rekonsiliasi - ${data.nomorSuratJalan || 'SJ'}</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Plus Jakarta Sans', Arial, sans-serif;
                margin: 20px;
                color: #111827;
                background: white;
                font-size: 11px;
              }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .font-mono { font-family: 'JetBrains Mono', monospace; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 15px; }
              .logo { height: 45px; }
              .title-box { text-align: center; margin: 15px 0; }
              .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px; margin-bottom: 15px; }
              .sign-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 35px; text-align: center; }
              .sign-box { border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px; }
              .sign-line { border-bottom: 1px solid #9ca3af; margin: 50px auto 5px auto; width: 80%; }
              .badge-shortage { color: #b91c1c; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px; }
              .badge-match { color: #047857; font-weight: bold; background: #d1fae5; padding: 2px 6px; border-radius: 4px; }
            </style>
          </head>
          <body>
            ${printableElement.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1500);
      }, 400);
    } catch (e) {
      console.warn('Fallback to standard window.print()', e);
      window.print();
    }
  };

  // Method 2: Direct PDF File Download using jsPDF
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Astra Isuzu with official logo
      try {
        doc.addImage(ASTRA_ISUZU_LOGO_DATA_URI, 'PNG', 15, 9, 38, 9);
      } catch (err) {
        console.warn('PDF logo drawing fallback:', err);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(0, 91, 172); // Astra Blue
      doc.text('PT ASTRA INTERNATIONAL TBK - ISUZU', 58, 15);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('DEPARTEMEN RETAIL & PART SERVICES • LOGISTIC & RECONCILIATION', 58, 19);
      doc.text('Jl. Danau Sunter Utara Blok O3 Kav. 30, Sunter II, Jakarta Utara 14350', 58, 23);

      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.6);
      doc.line(15, 27, 195, 27);

      // Title
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text('BERITA ACARA REKONSILIASI PENERIMAAN FISIK SPAREPART', 105, 37, { align: 'center' });

      // Metadata
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 41, 180, 16, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 41, 180, 16, 'S');

      doc.text(`No. Surat Jalan : ${data.nomorSuratJalan || items[0]?.nomorSuratJalan || '-'}`, 18, 46);
      doc.text(`Shipment SAP    : ${items[0]?.shipmentNumber || '-'}`, 18, 51);
      doc.text(`Customer/Plant  : ${(data.customerName || items[0]?.name || '-').substring(0, 35)} (${items[0]?.plant || 'I300'})`, 100, 46);
      doc.text(`Tgl Selesai Cek : ${data.completedDate || new Date().toISOString().split('T')[0]}`, 100, 51);

      // Table Header
      let y = 64;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y - 4, 180, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      doc.text('NO', 17, y);
      doc.text('PART NUMBER', 26, y);
      doc.text('DESKRIPSI SPAREPART', 65, y);
      doc.text('QTY SJ', 128, y, { align: 'center' });
      doc.text('QTY FISIK', 145, y, { align: 'center' });
      doc.text('SELISIH', 162, y, { align: 'center' });
      doc.text('STATUS', 182, y, { align: 'center' });

      doc.line(15, y + 2, 195, y + 2);

      // Table Rows
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      items.forEach((item, index) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        const actual = item.qtyAktual ?? item.quantity;
        const diff = item.discrepancyQty || (actual < item.quantity ? item.quantity - actual : 0);

        doc.text(String(index + 1), 17, y);
        doc.text(item.material, 26, y);
        doc.text(item.materialDescription.substring(0, 36), 65, y);
        doc.text(String(item.quantity), 128, y, { align: 'center' });
        doc.text(String(actual), 145, y, { align: 'center' });
        doc.text(diff > 0 ? `-${diff}` : '0', 162, y, { align: 'center' });
        doc.text(diff > 0 ? 'SHORTAGE' : 'SESUAI', 182, y, { align: 'center' });

        doc.setDrawColor(241, 245, 249);
        doc.line(15, y + 2, 195, y + 2);
        y += 6;
      });

      // Total summary row
      doc.setDrawColor(148, 163, 184);
      doc.line(15, y, 195, y);
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL KUANTITAS:', 65, y);
      doc.text(String(totalQtySuratJalan), 128, y, { align: 'center' });
      doc.text(String(totalQtyAktual), 145, y, { align: 'center' });
      doc.text(totalShortage > 0 ? `-${totalShortage}` : '0', 162, y, { align: 'center' });

      // Signatures
      y += 18;
      if (y > 240) {
        doc.addPage();
        y = 30;
      }

      doc.setFontSize(7.5);
      doc.text('Petugas Checker Gudang', 40, y, { align: 'center' });
      doc.text('Ekspedisi / Pengemudi', 105, y, { align: 'center' });
      doc.text('Kepala Bagian Part Services', 170, y, { align: 'center' });

      doc.line(25, y + 20, 55, y + 20);
      doc.line(90, y + 20, 120, y + 20);
      doc.line(155, y + 20, 185, y + 20);

      doc.text(`(${data.checkerName || 'Checker'})`, 40, y + 24, { align: 'center' });
      doc.text('( ........................... )', 105, y + 24, { align: 'center' });
      doc.text('( Budi Santoso )', 170, y + 24, { align: 'center' });

      doc.save(`Berita_Acara_Rekonsiliasi_${data.nomorSuratJalan || 'SJ'}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Gagal mengunduh PDF. Silakan gunakan tombol Cetak Google Print.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print-overlay">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-200">
        {/* Modal Controls Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Google Print View Berita Acara Rekonsiliasi</h3>
              <p className="text-xs text-slate-300">
                Pilih Cetak langsung atau Download PDF resmi Astra Isuzu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportSuratJalanToExcel(items, `Berita_Acara_${data.nomorSuratJalan || 'SJ'}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Excel
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPdf ? 'Membuat PDF...' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrintView}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#00488a] rounded-lg transition shadow-md shadow-blue-500/20"
            >
              <Printer className="w-4 h-4" />
              Cetak (Google Print)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div id="printable-document" className="p-8 bg-white text-slate-900 max-h-[78vh] overflow-y-auto">
          {/* Header Astra Isuzu */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5 mb-5">
            <div className="flex items-center gap-4">
              <AstraIsuzuLogo className="h-12 w-auto object-contain" />
              <div className="border-l pl-4 border-slate-300">
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  PT Astra International Tbk - Isuzu
                </h1>
                <p className="text-xs font-bold text-[#005BAC] tracking-wide uppercase">
                  TP-SYNCS • Third Party Synchronize System
                </p>
                <p className="text-[11px] text-slate-500">
                  Departemen Retail & Part Services • Jl. Danau Sunter Utara Blok O3 Kav. 30, Sunter II, Jakarta
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1 rounded">
                FORM: AI-RPS-REC-2026
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Tgl Selesai Cek: <span className="font-semibold text-slate-800">{data.completedDate || new Date().toISOString().split('T')[0]}</span>
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-5">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900">
              BERITA ACARA REKONSILIASI PENERIMAAN FISIK SPAREPART
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Lampiran Verifikasi Fisik Barang Datang vs Surat Jalan SAP
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-5 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Nomor Surat Jalan:</span>
              <span className="font-bold font-mono text-sm text-slate-800">
                {data.nomorSuratJalan || items[0]?.nomorSuratJalan || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Shipment SAP:</span>
              <span className="font-semibold text-slate-800">
                {items[0]?.shipmentNumber || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Customer / Plant:</span>
              <span className="font-semibold text-slate-800 truncate block">
                {data.customerName || items[0]?.name || '-'} ({items[0]?.plant || 'I300'})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Petugas Pemeriksa:</span>
              <span className="font-semibold text-[#005BAC]">
                {data.checkerName || 'Checker Gudang Retail & Part Services'}
              </span>
            </div>
          </div>

          {/* Status Banner */}
          {hasAnyShortage ? (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-xs text-red-800">
                <span className="font-bold">STATUS: TERDAPAT DISKREPANSI FISIK ({totalShortage} ITEM SELISIH KURANG).</span>
                <p className="mt-0.5">
                  Item dengan kuantitas aktual kurang otomatis diteruskan ke antrean <strong>Return Sales Claim</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-800">
                <span className="font-bold">STATUS: REKONSILIASI 100% SESUAI (MATCH).</span> Seluruh fisik sparepart telah diterima lengkap sesuai Surat Jalan.
              </div>
            </div>
          )}

          {/* Items Table */}
          <table className="w-full text-xs text-left border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                <th className="py-2 px-3 border-r border-slate-300">Part Number (Material)</th>
                <th className="py-2 px-3 border-r border-slate-300">Deskripsi Sparepart</th>
                <th className="py-2 px-3 border-r border-slate-300 text-center">Qty SJ</th>
                <th className="py-2 px-3 border-r border-slate-300 text-center">Qty Fisik</th>
                <th className="py-2 px-3 border-r border-slate-300 text-center">Selisih</th>
                <th className="py-2 px-3 border-r border-slate-300 text-center">Satuan</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const actual = item.qtyAktual ?? item.quantity;
                const isProblem = actual < item.quantity;
                const diff = isProblem ? item.quantity - actual : 0;

                return (
                  <tr key={item.id} className={isProblem ? 'bg-red-50/70 font-medium' : ''}>
                    <td className="py-2 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-semibold text-slate-900">
                      {item.material}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-800">
                      {item.materialDescription}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-bold">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-[#005BAC]">
                      {actual}
                    </td>
                    <td className={`py-2 px-3 border-r border-slate-200 text-center font-bold ${diff > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {diff > 0 ? `-${diff}` : '0'}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center text-slate-600">
                      {item.handlingUnitUom}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {isProblem ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-300">
                          Shortage
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-300">
                          Sesuai
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <td colSpan={3} className="py-2 px-3 text-right border-r border-slate-300">
                  TOTAL KUANTITAS:
                </td>
                <td className="py-2 px-3 text-center border-r border-slate-300">{totalQtySuratJalan}</td>
                <td className="py-2 px-3 text-center border-r border-slate-300 text-[#005BAC]">{totalQtyAktual}</td>
                <td className={`py-2 px-3 text-center border-r border-slate-300 ${totalShortage > 0 ? 'text-red-600' : ''}`}>
                  {totalShortage > 0 ? `-${totalShortage}` : 0}
                </td>
                <td colSpan={2} className="py-2 px-3 text-center text-slate-500">
                  {items.length} Macam Part
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-4 text-center text-xs mt-6">
            <div className="border border-slate-200 p-3 rounded-xl">
              <p className="text-slate-500 mb-12">Petugas Checker Fisik</p>
              <div className="w-3/4 mx-auto border-b border-slate-400 mb-1"></div>
              <p className="font-semibold text-slate-900">{data.checkerName || 'Pemeriksa Gudang'}</p>
              <p className="text-[10px] text-slate-400">Warehouse Staff</p>
            </div>
            <div className="border border-slate-200 p-3 rounded-xl">
              <p className="text-slate-500 mb-12">Ekspedisi / Pengemudi</p>
              <div className="w-3/4 mx-auto border-b border-slate-400 mb-1"></div>
              <p className="font-semibold text-slate-900">( ........................................ )</p>
              <p className="text-[10px] text-slate-400">Driver / Transporter</p>
            </div>
            <div className="border border-slate-200 p-3 rounded-xl">
              <p className="text-slate-500 mb-12">Kepala Bagian Part Services</p>
              <div className="w-3/4 mx-auto border-b border-slate-400 mb-1"></div>
              <p className="font-semibold text-slate-900">Budi Santoso</p>
              <p className="text-[10px] text-slate-400">Retail & Part Services Head</p>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
            <span>Dicetak secara otomatis dari TP-SYNCS (Third Party Synchronize System) Astra Isuzu</span>
            <span>Tanggal Cetak: {new Date().toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
