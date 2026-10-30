/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Download, 
  FileText, 
  Truck, 
  Package, 
  User, 
  Building, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { ReturnSalesClaim } from '../types';
import { useApp } from '../context/AppContext';
import { jsPDF } from 'jspdf';
import { AstraIsuzuLogo } from './AstraIsuzuLogo';
import { ASTRA_ISUZU_LOGO_DATA_URI } from '../assets/logoDataUri';
import { formatDateTimeIndo } from '../utils/leadtime';

interface SuratPengantarGantiPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: ReturnSalesClaim | null;
}

export const SuratPengantarGantiPartModal: React.FC<SuratPengantarGantiPartModalProps> = ({
  isOpen,
  onClose,
  claim
}) => {
  const { completeReplacement, currentUser } = useApp();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  
  // Custom Doc number and notes
  const initialDocNumber = claim?.replacementDocNumber || `SPP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
  const [docNumber] = useState(initialDocNumber);
  const [notes, setNotes] = useState(claim?.replacementNotes || 'Barang klaim telah diganti sesuai fisik shortage dan telah diserahterimakan kepada pihak penerima.');

  if (!isOpen || !claim) return null;

  const isCompleted = claim.replacementStatus === 'completed';
  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Method 1: Robust Iframe-based Print Trigger (Google Print view without breaking iframe sandbox)
  const handlePrintView = () => {
    const printableElement = document.getElementById('printable-surat-pengantar');
    if (!printableElement) {
      window.print();
      return;
    }

    try {
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
            <title>Surat Pengantar Pergantian Part - ${claim.id}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 12mm 15mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #0f172a;
                background: #ffffff;
                margin: 0;
                padding: 0;
                font-size: 11px;
                line-height: 1.4;
              }
              .header-table {
                width: 100%;
                border-bottom: 2px solid #005BAC;
                padding-bottom: 8px;
                margin-bottom: 14px;
              }
              .header-logo {
                height: 38px;
                width: auto;
              }
              .header-title {
                text-align: right;
              }
              .header-title h1 {
                margin: 0;
                font-size: 16px;
                font-weight: 800;
                color: #005BAC;
                letter-spacing: -0.3px;
                text-transform: uppercase;
              }
              .header-title p {
                margin: 2px 0 0 0;
                font-size: 10px;
                font-weight: 600;
                color: #ED1B24;
              }
              .doc-title-box {
                text-align: center;
                background-color: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 8px;
                margin-bottom: 14px;
              }
              .doc-title-box h2 {
                margin: 0;
                font-size: 14px;
                font-weight: 800;
                color: #0f172a;
                letter-spacing: 0.5px;
              }
              .doc-title-box .doc-no {
                margin-top: 3px;
                font-size: 11px;
                font-weight: 700;
                color: #005BAC;
                font-family: monospace;
              }
              .meta-grid {
                width: 100%;
                margin-bottom: 14px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                border-collapse: collapse;
              }
              .meta-grid td {
                padding: 6px 10px;
                border: 1px solid #e2e8f0;
                font-size: 10.5px;
              }
              .meta-label {
                color: #64748b;
                width: 22%;
                font-weight: 600;
              }
              .meta-value {
                color: #0f172a;
                font-weight: 700;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 14px;
              }
              .items-table th {
                background-color: #005BAC;
                color: #ffffff;
                font-size: 10.5px;
                font-weight: 700;
                padding: 7px 8px;
                text-align: left;
                border: 1px solid #005BAC;
              }
              .items-table td {
                padding: 8px;
                border: 1px solid #cbd5e1;
                font-size: 10.5px;
              }
              .badge-shortage {
                display: inline-block;
                background-color: #ecfdf5;
                color: #047857;
                font-weight: 800;
                padding: 3px 8px;
                border-radius: 4px;
                border: 1px solid #a7f3d0;
              }
              .notes-box {
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 8px 12px;
                margin-bottom: 20px;
                font-size: 10.5px;
              }
              .signatures {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              .signatures td {
                width: 33.33%;
                text-align: center;
                vertical-align: top;
                padding: 6px;
              }
              .sign-box {
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 10px 8px;
                min-height: 105px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .sign-role {
                font-weight: 700;
                font-size: 10px;
                color: #475569;
                text-transform: uppercase;
                margin-bottom: 45px;
              }
              .sign-name {
                font-weight: 700;
                font-size: 10.5px;
                color: #0f172a;
                border-top: 1px solid #94a3b8;
                padding-top: 4px;
              }
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
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 350);
    } catch {
      window.print();
    }
  };

  // Method 2: Download official PDF via jsPDF
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Top corporate stripe
      pdf.setFillColor(0, 91, 172); // Astra Blue
      pdf.rect(0, 0, 160, 4, 'F');
      pdf.setFillColor(237, 27, 36); // Isuzu Red
      pdf.rect(160, 0, 50, 4, 'F');

      // Corporate Logo
      try {
        pdf.addImage(ASTRA_ISUZU_LOGO_DATA_URI, 'PNG', 14, 10, 48, 14);
      } catch {}

      // Header Text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(0, 91, 172);
      pdf.text('THIRD PARTY SYNCHRONIZE SYSTEM', 200, 16, { align: 'right' });
      pdf.setFontSize(9);
      pdf.setTextColor(237, 27, 36);
      pdf.text('Departemen Retail & Part Services • PT Astra International Tbk - Isuzu', 200, 21, { align: 'right' });

      // Title Banner
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(14, 28, 182, 14, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text('SURAT PENGANTAR PERGANTIAN PART', 105, 35, { align: 'center' });

      pdf.setFontSize(8.5);
      pdf.setTextColor(0, 91, 172);
      pdf.text(`No. Dokumen: ${docNumber}  |  Tanggal: ${currentDateStr}`, 105, 40, { align: 'center' });

      // Metadata Table
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(14, 46, 182, 28, 'D');

      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'bold');
      pdf.text('No. Claim ID:', 18, 52);
      pdf.text('No. Surat Jalan:', 18, 59);
      pdf.text('Delivery (No):', 18, 66);
      pdf.text('Customer Tujuan:', 105, 52);
      pdf.text('Shipment SAP:', 105, 59);
      pdf.text('Status Otorisasi:', 105, 66);

      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'normal');
      pdf.text(claim.id, 46, 52);
      pdf.text(claim.nomorSuratJalan, 46, 59);
      pdf.text(claim.delivery || '-', 46, 66);
      pdf.text(claim.customerName, 138, 52);
      pdf.text(claim.shipmentNumber || '-', 138, 59);
      pdf.setTextColor(4, 120, 87);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CLAIM APPROVED / COMPLETE', 138, 66);

      // Parts Table Header
      pdf.setFillColor(0, 91, 172);
      pdf.rect(14, 78, 182, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('NO', 17, 83);
      pdf.text('PART NUMBER', 26, 83);
      pdf.text('NAMA / DESKRIPSI PART', 66, 83);
      pdf.text('QTY PERGANTIAN', 128, 83);
      pdf.text('UOM', 158, 83);
      pdf.text('JENIS KLAIM', 172, 83);

      // Parts Row
      pdf.setFillColor(248, 250, 252);
      pdf.rect(14, 86, 182, 12, 'FD');
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1', 18, 93);
      pdf.text(claim.material, 26, 93);
      pdf.setFont('helvetica', 'normal');
      pdf.text(claim.materialDescription.length > 32 ? claim.materialDescription.substring(0, 32) + '...' : claim.materialDescription, 66, 93);
      
      pdf.setTextColor(4, 120, 87);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${claim.qtyShortage}`, 138, 93);
      
      pdf.setTextColor(15, 23, 42);
      pdf.text(claim.uom, 160, 93);
      pdf.setFont('helvetica', 'normal');
      pdf.text(claim.jenisClaim || 'Claim Kurang', 172, 93);

      // Notes Box
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(14, 103, 182, 20, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Catatan & Keterangan Pergantian:', 18, 108);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(8);
      pdf.text(notes || 'Barang klaim diserahkan sebagai pengganti fisik sesuai persetujuan klaim shortage.', 18, 114);
      if (claim.analisaNotes) {
        pdf.setTextColor(79, 70, 229);
        pdf.text(`Hasil Analisa Owner: ${claim.analisaNotes}`, 18, 119);
      }

      // Signature Blocks
      const signY = 130;
      const colWidth = 56;

      // Col 1: Part Head / Gudang
      pdf.rect(14, signY, colWidth, 34, 'D');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('DISERAHKAN OLEH (PART HEAD)', 14 + colWidth / 2, signY + 6, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.text(claim.replacedBy || currentUser?.displayName || 'Petugas Gudang / Part Head', 14 + colWidth / 2, signY + 30, { align: 'center' });

      // Col 2: Ekspedisi / Kurir
      pdf.rect(14 + colWidth + 7, signY, colWidth, 34, 'D');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('PENGIRIM / EKSPEDISI', 14 + colWidth + 7 + colWidth / 2, signY + 6, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text('(....................................)', 14 + colWidth + 7 + colWidth / 2, signY + 30, { align: 'center' });

      // Col 3: Penerima Customer
      pdf.rect(14 + (colWidth + 7) * 2, signY, colWidth, 34, 'D');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('DITERIMA OLEH (CUSTOMER)', 14 + (colWidth + 7) * 2 + colWidth / 2, signY + 6, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(claim.customerName.length > 22 ? claim.customerName.substring(0, 22) + '...' : claim.customerName, 14 + (colWidth + 7) * 2 + colWidth / 2, signY + 30, { align: 'center' });

      pdf.save(`Surat_Pengantar_Ganti_Part_${claim.material}_${claim.id}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleMarkComplete = () => {
    const res = completeReplacement(claim.id, docNumber, notes);
    if (res.success) {
      setSuccessNotice('Barang klaim berhasil ditandai Selesai Pergantian!');
      setTimeout(() => setSuccessNotice(''), 4000);
    } else {
      alert(res.message || 'Gagal menandai selesai pergantian.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Surat Pengantar Pergantian Part
                {isCompleted && (
                  <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Sudah Diganti
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Claim: {claim.id} • Part: {claim.material} • SJ: {claim.nomorSuratJalan}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successNotice}
          </div>
        )}

        {/* Scrollable Document Preview Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60">
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200">
            
            {/* The printable element content */}
            <div id="printable-surat-pengantar">
              
              {/* Letterhead */}
              <table style={{ width: '100%', borderBottom: '2px solid #005BAC', paddingBottom: '10px', marginBottom: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'middle', width: '50%' }}>
                      <AstraIsuzuLogo className="h-10 sm:h-12 w-auto object-contain" />
                    </td>
                    <td style={{ verticalAlign: 'middle', textAlign: 'right', width: '50%' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#005BAC', textTransform: 'uppercase', letterSpacing: '-0.2px' }}>
                        THIRD PARTY SYNCHRONIZE SYSTEM
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#ED1B24', marginTop: '2px' }}>
                        Departemen Retail & Part Services • PT Astra International Tbk - Isuzu
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Document Title Banner */}
              <div style={{
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '16px'
              }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
                  SURAT PENGANTAR PERGANTIAN PART
                </h2>
                <div style={{ marginTop: '4px', fontSize: '11px', fontWeight: 700, color: '#005BAC', fontFamily: 'monospace' }}>
                  Nomor: {docNumber} &nbsp;•&nbsp; Tanggal: {currentDateStr}
                </div>
              </div>

              {/* Information Meta Grid */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', width: '22%', color: '#64748b', fontWeight: 600 }}>
                      No. Claim ID
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', width: '28%', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {claim.id}
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', width: '22%', color: '#64748b', fontWeight: 600 }}>
                      Customer / Penerima
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', width: '28%', fontWeight: 700, color: '#0f172a' }}>
                      {claim.customerName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                      No. Surat Jalan Asal
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {claim.nomorSuratJalan}
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                      Delivery (No)
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {claim.delivery || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                      No. Shipment SAP
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {claim.shipmentNumber || '-'}
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                      Status Rekonsiliasi
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#047857' }}>
                      APPROVED / REPLACEMENT
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#005BAC', color: '#ffffff' }}>
                    <th style={{ padding: '8px', border: '1px solid #005BAC', width: '5%', textAlign: 'center' }}>No</th>
                    <th style={{ padding: '8px', border: '1px solid #005BAC', width: '25%', textAlign: 'left' }}>Part Number</th>
                    <th style={{ padding: '8px', border: '1px solid #005BAC', width: '35%', textAlign: 'left' }}>Deskripsi Part</th>
                    <th style={{ padding: '8px', border: '1px solid #005BAC', width: '15%', textAlign: 'center' }}>Qty Ganti</th>
                    <th style={{ padding: '8px', border: '1px solid #005BAC', width: '10%', textAlign: 'center' }}>Satuan</th>
                    <th style={{ padding: '8px', border: '1px solid #005BAC', width: '10%', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '9px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>1</td>
                    <td style={{ padding: '9px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#005BAC', fontFamily: 'monospace' }}>
                      {claim.material}
                    </td>
                    <td style={{ padding: '9px 8px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>
                      {claim.materialDescription}
                    </td>
                    <td style={{ padding: '9px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '4px',
                        border: '1px solid #a7f3d0'
                      }}>
                        {claim.qtyShortage}
                      </span>
                    </td>
                    <td style={{ padding: '9px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}>
                      {claim.uom}
                    </td>
                    <td style={{ padding: '9px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700, color: '#047857' }}>
                      {isCompleted ? 'DIGANTI ✓' : 'PROSES GANTI'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Notes & Owner Analysis Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '11px',
                lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '2px' }}>
                  Catatan / Keterangan Serah Terima Part:
                </div>
                <div style={{ color: '#0f172a' }}>
                  {notes || 'Barang klaim diserahkan sebagai pengganti fisik sesuai persetujuan klaim shortage.'}
                </div>
                {claim.analisaNotes && (
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', color: '#4338ca', fontSize: '10.5px' }}>
                    <strong>Hasil Analisa Owner:</strong> {claim.analisaNotes}
                  </div>
                )}
                {isCompleted && claim.replacedAt && (
                  <div style={{ marginTop: '6px', color: '#047857', fontWeight: 700, fontSize: '10.5px' }}>
                    ✓ Selesai diganti pada: {formatDateTimeIndo(claim.replacedAt)} oleh {claim.replacedBy || 'Petugas Gudang'}
                  </div>
                )}
              </div>

              {/* Signatures */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '33.33%', padding: '6px', verticalAlign: 'top', textAlign: 'center' }}>
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 8px', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '10px', color: '#475569', textTransform: 'uppercase', marginBottom: '45px' }}>
                          Diserahkan Oleh<br /><span style={{ fontSize: '9px', fontWeight: 600 }}>(Part Head / Gudang)</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '10.5px', color: '#0f172a', borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
                          {claim.replacedBy || currentUser?.displayName || 'Petugas Gudang'}
                        </div>
                      </div>
                    </td>

                    <td style={{ width: '33.33%', padding: '6px', verticalAlign: 'top', textAlign: 'center' }}>
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 8px', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '10px', color: '#475569', textTransform: 'uppercase', marginBottom: '45px' }}>
                          Pengirim / Ekspedisi<br /><span style={{ fontSize: '9px', fontWeight: 600 }}>(Driver / Kurir)</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '10.5px', color: '#0f172a', borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
                          (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                        </div>
                      </div>
                    </td>

                    <td style={{ width: '33.33%', padding: '6px', verticalAlign: 'top', textAlign: 'center' }}>
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 8px', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '10px', color: '#475569', textTransform: 'uppercase', marginBottom: '45px' }}>
                          Diterima Oleh<br /><span style={{ fontSize: '9px', fontWeight: 600 }}>(Customer / Cabang)</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '10.5px', color: '#0f172a', borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
                          {claim.customerName.length > 25 ? claim.customerName.substring(0, 25) + '...' : claim.customerName}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>

            {/* Editable Notes Section when not yet completed */}
            {!isCompleted && (
              <div className="mt-6 pt-5 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Serah Terima Tambahan:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Barang diserahkan melalui ekspedisi kurir Astra, nomor resi EXP-0921, kondisi fisik mulus dan segel baru."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintView}
              className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#005BAC]" />
              Cetak (Google Print)
            </button>
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-[#ED1B24]" />
              {isGeneratingPdf ? 'Membuat PDF...' : 'Download PDF'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted ? (
              <button
                type="button"
                onClick={handleMarkComplete}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Selesai Pergantian (Mark Complete)
              </button>
            ) : (
              <div className="py-2 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Barang Sudah Selesai Diganti
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
