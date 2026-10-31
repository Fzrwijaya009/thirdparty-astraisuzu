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

  // Method 1: Robust Iframe-based Print Trigger (Google Print view formatted strictly for A4 Landscape)
  const handlePrintView = () => {
    // Automatically synchronize replacement status to completed upon printing
    if (!isCompleted) {
      completeReplacement(claim.id, docNumber, notes);
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
                size: A4 landscape;
                margin: 8mm 10mm;
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
                line-height: 1.35;
              }
              .header-table {
                width: 100%;
                border-bottom: 2.5px solid #005BAC;
                padding-bottom: 6px;
                margin-bottom: 10px;
              }
              .header-logo {
                height: 36px;
                width: auto;
              }
              .header-title {
                text-align: right;
              }
              .header-title h1 {
                margin: 0;
                font-size: 16px;
                font-weight: 900;
                color: #005BAC;
                letter-spacing: -0.2px;
                text-transform: uppercase;
              }
              .header-title p {
                margin: 2px 0 0 0;
                font-size: 10px;
                font-weight: 700;
                color: #ED1B24;
              }
              .doc-title-box {
                text-align: center;
                background-color: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 6px;
                margin-bottom: 10px;
              }
              .doc-title-box h2 {
                margin: 0;
                font-size: 14px;
                font-weight: 900;
                color: #0f172a;
                letter-spacing: 0.5px;
              }
              .doc-title-box .doc-no {
                margin-top: 2px;
                font-size: 11px;
                font-weight: 700;
                color: #005BAC;
                font-family: monospace;
              }
              .meta-grid {
                width: 100%;
                margin-bottom: 10px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                border-collapse: collapse;
              }
              .meta-grid td {
                padding: 5px 8px;
                border: 1px solid #e2e8f0;
                font-size: 10.5px;
              }
              .meta-label {
                color: #64748b;
                width: 15%;
                font-weight: 600;
                background-color: #f8fafc;
              }
              .meta-value {
                color: #0f172a;
                width: 35%;
                font-weight: 700;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
              }
              .items-table th {
                background-color: #005BAC;
                color: #ffffff;
                font-size: 10.5px;
                font-weight: 700;
                padding: 6px 8px;
                text-align: left;
                border: 1px solid #005BAC;
              }
              .items-table td {
                padding: 6px 8px;
                border: 1px solid #cbd5e1;
                font-size: 10.5px;
              }
              .badge-shortage {
                display: inline-block;
                background-color: #ecfdf5;
                color: #047857;
                font-weight: 900;
                padding: 2px 8px;
                border-radius: 4px;
                border: 1px solid #a7f3d0;
                font-size: 11px;
              }
              .notes-box {
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 6px 10px;
                margin-bottom: 12px;
                font-size: 10.5px;
              }
              .signatures {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              .signatures td {
                width: 33.33%;
                text-align: center;
                vertical-align: top;
                padding: 4px;
              }
              .sign-box {
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 8px 6px;
                min-height: 85px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .sign-role {
                font-weight: 700;
                font-size: 10px;
                color: #475569;
                text-transform: uppercase;
                margin-bottom: 40px;
              }
              .sign-name {
                font-weight: 700;
                font-size: 10.5px;
                color: #0f172a;
                border-top: 1px solid #94a3b8;
                padding-top: 3px;
              }
            </style>
          </head>
          <body>
            <!-- Landscape Header -->
            <table class="header-table">
              <tr>
                <td style="width: 45%; vertical-align: middle;">
                  <img src="${ASTRA_ISUZU_LOGO_DATA_URI}" class="header-logo" alt="Astra Isuzu" />
                </td>
                <td class="header-title" style="width: 55%; vertical-align: middle;">
                  <h1>THIRD PARTY SYNCHRONIZE SYSTEM</h1>
                  <p>Departemen Retail & Part Services • PT Astra International Tbk - Isuzu</p>
                </td>
              </tr>
            </table>

            <!-- Document Title -->
            <div class="doc-title-box">
              <h2>SURAT PENGANTAR PERGANTIAN PART</h2>
              <div class="doc-no">
                Nomor: ${docNumber} &nbsp;•&nbsp; Tanggal: ${currentDateStr} &nbsp;•&nbsp; Status: DISERAHKAN (APPROVED)
              </div>
            </div>

            <!-- Landscape Metadata Grid (4 Columns) -->
            <table class="meta-grid">
              <tr>
                <td class="meta-label">No. Claim ID:</td>
                <td class="meta-value" style="font-family: monospace;">${claim.id}</td>
                <td class="meta-label">Customer / Penerima:</td>
                <td class="meta-value">${claim.customerName}</td>
              </tr>
              <tr>
                <td class="meta-label">No. Surat Jalan Asal:</td>
                <td class="meta-value" style="font-family: monospace;">${claim.nomorSuratJalan}</td>
                <td class="meta-label">Delivery (No):</td>
                <td class="meta-value" style="font-family: monospace;">${claim.delivery || '-'}</td>
              </tr>
              <tr>
                <td class="meta-label">No. Shipment SAP:</td>
                <td class="meta-value" style="font-family: monospace;">${claim.shipmentNumber || '-'}</td>
                <td class="meta-label">Plant Logistik:</td>
                <td class="meta-value">${claim.plant || 'Plant I300 Sunter'}</td>
              </tr>
              <tr>
                <td class="meta-label">Jenis Klaim / Status:</td>
                <td class="meta-value">${claim.jenisClaim || 'Claim Kurang'} (Disetujui)</td>
                <td class="meta-label">Status Pergantian:</td>
                <td class="meta-value" style="color: #047857;">PART SUDAH DI GANTI ✓</td>
              </tr>
            </table>

            <!-- Landscape Parts Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 4%; text-align: center;">No</th>
                  <th style="width: 18%;">Part Number</th>
                  <th style="width: 32%;">Deskripsi Sparepart</th>
                  <th style="width: 14%;">No. Surat Jalan</th>
                  <th style="width: 10%;">Delivery (No)</th>
                  <th style="width: 10%; text-align: center;">Qty Ganti</th>
                  <th style="width: 6%; text-align: center;">Satuan</th>
                  <th style="width: 6%; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: center; font-weight: 700;">1</td>
                  <td style="font-weight: 900; font-family: monospace; color: #005BAC;">${claim.material}</td>
                  <td style="font-weight: 600; color: #1e293b;">${claim.materialDescription}</td>
                  <td style="font-family: monospace; font-weight: 700;">${claim.nomorSuratJalan}</td>
                  <td style="font-family: monospace;">${claim.delivery || '-'}</td>
                  <td style="text-align: center;">
                    <span class="badge-shortage">${claim.qtyShortage}</span>
                  </td>
                  <td style="text-align: center; font-weight: 600;">${claim.uom}</td>
                  <td style="text-align: center; font-weight: 700; color: #047857;">DIGANTI ✓</td>
                </tr>
              </tbody>
            </table>

            <!-- Notes & Owner Analysis -->
            <div class="notes-box">
              <div style="font-weight: 700; color: #334155; margin-bottom: 2px;">
                Catatan Serah Terima Fisik Barang:
              </div>
              <div style="color: #0f172a;">
                ${notes || 'Barang klaim diserahkan sebagai pengganti fisik sesuai persetujuan klaim shortage.'}
              </div>
              ${claim.analisaNotes ? `
                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1; color: #4338ca; font-size: 10px;">
                  <strong>Hasil Analisa Owner:</strong> ${claim.analisaNotes}
                </div>
              ` : ''}
              <div style="margin-top: 4px; color: #047857; font-weight: 700; font-size: 10px;">
                ✓ Part telah diserahterimakan penggantiannya pada: ${currentDateStr} oleh ${claim.replacedBy || currentUser?.displayName || 'Part Head'}
              </div>
            </div>

            <!-- Landscape Signatures (3 Columns) -->
            <table class="signatures">
              <tr>
                <td>
                  <div class="sign-box">
                    <div class="sign-role">
                      Diserahkan Oleh<br /><span style="font-size: 9px; font-weight: 600;">(Part Head / Gudang)</span>
                    </div>
                    <div class="sign-name">
                      ${claim.replacedBy || currentUser?.displayName || 'Petugas Gudang / Part Head'}
                    </div>
                  </div>
                </td>
                <td>
                  <div class="sign-box">
                    <div class="sign-role">
                      Pengirim / Ekspedisi<br /><span style="font-size: 9px; font-weight: 600;">(Driver / Kurir)</span>
                    </div>
                    <div class="sign-name">
                      (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                    </div>
                  </div>
                </td>
                <td>
                  <div class="sign-box">
                    <div class="sign-role">
                      Diterima Oleh<br /><span style="font-size: 9px; font-weight: 600;">(Customer / Cabang)</span>
                    </div>
                    <div class="sign-name">
                      ${claim.customerName.length > 30 ? claim.customerName.substring(0, 30) + '...' : claim.customerName}
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1200);
      }, 400);
    } catch {
      window.print();
    }
  };

  // Method 2: Download official PDF via jsPDF in Landscape A4
  const handleDownloadPdf = () => {
    // Automatically synchronize replacement status to completed upon PDF generation
    if (!isCompleted) {
      completeReplacement(claim.id, docNumber, notes);
    }

    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Top corporate stripe in Landscape (297mm width)
      pdf.setFillColor(0, 91, 172); // Astra Blue
      pdf.rect(0, 0, 230, 4, 'F');
      pdf.setFillColor(237, 27, 36); // Isuzu Red
      pdf.rect(230, 0, 67, 4, 'F');

      // Corporate Logo
      try {
        pdf.addImage(ASTRA_ISUZU_LOGO_DATA_URI, 'PNG', 12, 8, 48, 14);
      } catch {}

      // Header Text in Landscape
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(0, 91, 172);
      pdf.text('THIRD PARTY SYNCHRONIZE SYSTEM', 285, 14, { align: 'right' });
      pdf.setFontSize(9.5);
      pdf.setTextColor(237, 27, 36);
      pdf.text('Departemen Retail & Part Services • PT Astra International Tbk - Isuzu', 285, 20, { align: 'right' });

      // Title Banner
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(12, 26, 273, 13, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('SURAT PENGANTAR PERGANTIAN PART', 148, 32.5, { align: 'center' });

      pdf.setFontSize(9);
      pdf.setTextColor(0, 91, 172);
      pdf.text(`Nomor: ${docNumber}   |   Tanggal: ${currentDateStr}   |   Status: PART SUDAH DI GANTI`, 148, 37, { align: 'center' });

      // Metadata Table (4 Columns in Landscape)
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(12, 42, 273, 24, 'D');

      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'bold');
      // Col 1 & 2
      pdf.text('No. Claim ID:', 16, 48);
      pdf.text('No. Surat Jalan Asal:', 16, 54);
      pdf.text('No. Shipment SAP:', 16, 60);

      // Col 3 & 4
      pdf.text('Customer Tujuan:', 150, 48);
      pdf.text('Delivery (No):', 150, 54);
      pdf.text('Status Pergantian:', 150, 60);

      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'normal');
      pdf.text(claim.id, 56, 48);
      pdf.text(claim.nomorSuratJalan, 56, 54);
      pdf.text(claim.shipmentNumber || '-', 56, 60);

      pdf.text(claim.customerName, 185, 48);
      pdf.text(claim.delivery || '-', 185, 54);
      pdf.setTextColor(4, 120, 87);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PART SUDAH DI GANTI ✓', 185, 60);

      // Parts Table Header
      pdf.setFillColor(0, 91, 172);
      pdf.rect(12, 70, 273, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('NO', 15, 75);
      pdf.text('PART NUMBER', 26, 75);
      pdf.text('DESKRIPSI SPAREPART', 75, 75);
      pdf.text('NO. SURAT JALAN', 160, 75);
      pdf.text('DELIVERY', 200, 75);
      pdf.text('QTY GANTI', 228, 75);
      pdf.text('UOM', 252, 75);
      pdf.text('STATUS', 265, 75);

      // Parts Row
      pdf.setFillColor(248, 250, 252);
      pdf.rect(12, 78, 273, 11, 'FD');
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1', 16, 85);
      pdf.text(claim.material, 26, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.text(claim.materialDescription.length > 45 ? claim.materialDescription.substring(0, 45) + '...' : claim.materialDescription, 75, 85);
      pdf.text(claim.nomorSuratJalan, 160, 85);
      pdf.text(claim.delivery || '-', 200, 85);

      pdf.setTextColor(4, 120, 87);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${claim.qtyShortage}`, 235, 85);

      pdf.setTextColor(15, 23, 42);
      pdf.text(claim.uom, 254, 85);
      pdf.text('DIGANTI ✓', 265, 85);

      // Notes Box
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(12, 93, 273, 18, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Catatan & Keterangan Pergantian:', 16, 98);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(8);
      pdf.text(notes || 'Barang klaim diserahkan sebagai pengganti fisik sesuai persetujuan klaim shortage.', 16, 104);
      if (claim.analisaNotes) {
        pdf.setTextColor(79, 70, 229);
        pdf.text(`Hasil Analisa Owner: ${claim.analisaNotes}`, 16, 108);
      }

      // Signature Blocks (3 wide columns in Landscape)
      const signY = 116;
      const colWidth = 86;
      const gap = 7.5;

      // Col 1: Part Head / Gudang
      pdf.rect(12, signY, colWidth, 32, 'D');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('DISERAHKAN OLEH (PART HEAD / GUDANG)', 12 + colWidth / 2, signY + 6, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.text(claim.replacedBy || currentUser?.displayName || 'Petugas Gudang / Part Head', 12 + colWidth / 2, signY + 28, { align: 'center' });

      // Col 2: Ekspedisi / Kurir
      pdf.rect(12 + colWidth + gap, signY, colWidth, 32, 'D');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('PENGIRIM / EKSPEDISI (DRIVER)', 12 + colWidth + gap + colWidth / 2, signY + 6, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text('(..................................................)', 12 + colWidth + gap + colWidth / 2, signY + 28, { align: 'center' });

      // Col 3: Penerima Customer
      pdf.rect(12 + (colWidth + gap) * 2, signY, colWidth, 32, 'D');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('DITERIMA OLEH (CUSTOMER / CABANG)', 12 + (colWidth + gap) * 2 + colWidth / 2, signY + 6, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(claim.customerName.length > 35 ? claim.customerName.substring(0, 35) + '...' : claim.customerName, 12 + (colWidth + gap) * 2 + colWidth / 2, signY + 28, { align: 'center' });

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
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Surat Pengantar Pergantian Part
                <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded">
                  Format A4 Landscape
                </span>
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
          <div className="max-w-5xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200">
            
            {/* The printable element content */}
            <div id="printable-surat-pengantar">
              
              {/* Letterhead */}
              <table style={{ width: '100%', borderBottom: '2.5px solid #005BAC', paddingBottom: '8px', marginBottom: '12px' }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'middle', width: '45%' }}>
                      <AstraIsuzuLogo className="h-10 sm:h-12 w-auto object-contain" />
                    </td>
                    <td style={{ verticalAlign: 'middle', textAlign: 'right', width: '55%' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#005BAC', textTransform: 'uppercase', letterSpacing: '-0.2px' }}>
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
                padding: '8px',
                marginBottom: '12px'
              }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>
                  SURAT PENGANTAR PERGANTIAN PART
                </h2>
                <div style={{ marginTop: '3px', fontSize: '11px', fontWeight: 700, color: '#005BAC', fontFamily: 'monospace' }}>
                  Nomor: {docNumber} &nbsp;•&nbsp; Tanggal: {currentDateStr} &nbsp;•&nbsp; Format Cetak: A4 Landscape
                </div>
              </div>

              {/* Information Meta Grid (4 Columns Landscape Layout) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', width: '15%', color: '#64748b', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      No. Claim ID
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', width: '35%', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {claim.id}
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', width: '15%', color: '#64748b', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      Customer / Penerima
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', width: '35%', fontWeight: 700, color: '#0f172a' }}>
                      {claim.customerName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      No. Surat Jalan Asal
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {claim.nomorSuratJalan}
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      Delivery (No)
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {claim.delivery || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      No. Shipment SAP
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {claim.shipmentNumber || '-'}
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      Plant Logistik
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                      {claim.plant || 'Plant I300 Sunter'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      Jenis Klaim
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                      {claim.jenisClaim || 'Claim Kurang'} (Approved)
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                      Status Pergantian
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#047857' }}>
                      PART SUDAH DI GANTI ✓
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Items Table in Landscape */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#005BAC', color: '#ffffff' }}>
                    <th style={{ padding: '7px 8px', border: '1px solid #005BAC', width: '4%', textAlign: 'center' }}>No</th>
                    <th style={{ padding: '7px 8px', border: '1px solid #005BAC', width: '18%', textAlign: 'left' }}>Part Number</th>
                    <th style={{ padding: '7px 8px', border: '1px solid #005BAC', width: '32%', textAlign: 'left' }}>Deskripsi Part</th>
                    <th style={{ padding: '7px 8px', border: '1px solid #005BAC', width: '14%', textAlign: 'left' }}>No. Surat Jalan</th>
                    <th style={{ padding: '7px 8px', border: '1px solid #005BAC', width: '10%', textAlign: 'left' }}>Delivery (No)</th>
                    <th style={{ padding: '7px 8px', border: '1px solid #005BAC', width: '10%', textAlign: 'center' }}>Qty Ganti</th>
                    <th style={{ padding: '7px 8px', border: '1px solid #005BAC', width: '6%', textAlign: 'center' }}>Satuan</th>
                    <th style={{ padding: '7px 8px', border: '1px solid #005BAC', width: '6%', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>1</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 900, color: '#005BAC', fontFamily: 'monospace' }}>
                      {claim.material}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>
                      {claim.materialDescription}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontWeight: 700 }}>
                      {claim.nomorSuratJalan}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                      {claim.delivery || '-'}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #a7f3d0'
                      }}>
                        {claim.qtyShortage}
                      </span>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}>
                      {claim.uom}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700, color: '#047857' }}>
                      DIGANTI ✓
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Notes & Owner Analysis Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 12px',
                marginBottom: '14px',
                fontSize: '11px',
                lineHeight: '1.4'
              }}>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '2px' }}>
                  Catatan / Keterangan Serah Terima Part:
                </div>
                <div style={{ color: '#0f172a' }}>
                  {notes || 'Barang klaim diserahkan sebagai pengganti fisik sesuai persetujuan klaim shortage.'}
                </div>
                {claim.analisaNotes && (
                  <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1', color: '#4338ca', fontSize: '10.5px' }}>
                    <strong>Hasil Analisa Owner:</strong> {claim.analisaNotes}
                  </div>
                )}
                <div style={{ marginTop: '4px', color: '#047857', fontWeight: 700, fontSize: '10.5px' }}>
                  ✓ Status: Part Sudah di Ganti (Tersinkronisasi ke Complete Proses & Return Sales)
                </div>
              </div>

              {/* Signatures in Landscape (3 Columns) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '33.33%', padding: '4px', verticalAlign: 'top', textAlign: 'center' }}>
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 6px', minHeight: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '10px', color: '#475569', textTransform: 'uppercase', marginBottom: '40px' }}>
                          Diserahkan Oleh<br /><span style={{ fontSize: '9px', fontWeight: 600 }}>(Part Head / Gudang)</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '10.5px', color: '#0f172a', borderTop: '1px solid #94a3b8', paddingTop: '3px' }}>
                          {claim.replacedBy || currentUser?.displayName || 'Petugas Gudang / Part Head'}
                        </div>
                      </div>
                    </td>

                    <td style={{ width: '33.33%', padding: '4px', verticalAlign: 'top', textAlign: 'center' }}>
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 6px', minHeight: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '10px', color: '#475569', textTransform: 'uppercase', marginBottom: '40px' }}>
                          Pengirim / Ekspedisi<br /><span style={{ fontSize: '9px', fontWeight: 600 }}>(Driver / Kurir)</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '10.5px', color: '#0f172a', borderTop: '1px solid #94a3b8', paddingTop: '3px' }}>
                          (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                        </div>
                      </div>
                    </td>

                    <td style={{ width: '33.33%', padding: '4px', verticalAlign: 'top', textAlign: 'center' }}>
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 6px', minHeight: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '10px', color: '#475569', textTransform: 'uppercase', marginBottom: '40px' }}>
                          Diterima Oleh<br /><span style={{ fontSize: '9px', fontWeight: 600 }}>(Customer / Cabang)</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '10.5px', color: '#0f172a', borderTop: '1px solid #94a3b8', paddingTop: '3px' }}>
                          {claim.customerName.length > 30 ? claim.customerName.substring(0, 30) + '...' : claim.customerName}
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
