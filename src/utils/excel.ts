/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { SuratJalanItem, ReturnSalesClaim } from '../types';

/**
 * Robustly resolve the XLSX module instance across various Vite/Rollup/ESM bundler wrapping
 */
function getXLSX() {
  const mod = XLSX as any;
  const win = typeof window !== 'undefined' ? (window as any).XLSX : null;

  const readFn = mod?.read || mod?.default?.read || win?.read;
  const utilsObj = mod?.utils || mod?.default?.utils || win?.utils;
  const writeFileFn = mod?.writeFile || mod?.default?.writeFile || win?.writeFile;

  return {
    read: readFn,
    utils: utilsObj,
    writeFile: writeFileFn
  };
}

/**
 * Fallback parser for plain text CSV / TSV files
 */
function parseDelimitedText(text: string, delimiter: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Export any array of objects to an Excel (.xlsx) file and trigger download
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName = 'Data'
) {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor!');
    return;
  }

  const { utils, writeFile } = getXLSX();

  if (utils && typeof utils.json_to_sheet === 'function' && typeof writeFile === 'function') {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new ? utils.book_new() : { SheetNames: [], Sheets: {} };
    if (typeof utils.book_append_sheet === 'function') {
      utils.book_append_sheet(workbook, worksheet, sheetName);
    }
    
    // Auto-fit column widths
    const keys = Object.keys(data[0] || {});
    const colWidths = keys.map(k => {
      const maxValLen = Math.max(...data.map(d => String(d[k] ?? '').length), k.length);
      return { wch: Math.min(Math.max(maxValLen + 2, 10), 40) };
    });
    worksheet['!cols'] = colWidths;

    const validFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    writeFile(workbook, validFilename);
  } else {
    // CSV fallback download if xlsx library is unavailable
    const keys = Object.keys(data[0]);
    const csvContent = [
      keys.join('\t'),
      ...data.map(row => keys.map(k => String(row[k] ?? '').replace(/\t/g, ' ')).join('\t'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.tsv`;
    link.click();
  }
}

/**
 * Format Surat Jalan Items for clean export
 */
export function exportSuratJalanToExcel(items: SuratJalanItem[], filename = 'Astra_Isuzu_Surat_Jalan') {
  const exportRows = items.map((item, idx) => ({
    'No': idx + 1,
    'Nomor Surat Jalan': item.nomorSuratJalan,
    'Shipment Number': item.shipmentNumber,
    'Delivery': item.delivery,
    'Handling Unit': item.handlingUnit,
    'Material (Part No)': item.material,
    'Material Description': item.materialDescription,
    'Quantity Surat Jalan': item.quantity,
    'Qty Aktual (Diterima)': item.qtyAktual ?? '-',
    'Selisih (Shortage)': item.discrepancyQty && item.discrepancyQty > 0 ? item.discrepancyQty : 0,
    'Status Cek': item.status === 'completed' ? 'Complete' : item.isChecked ? 'Checked' : 'Pending',
    'Handling unit UoM': item.handlingUnitUom,
    'Sales Document Type': item.salesDocumentType,
    'Plant': item.plant,
    'Document Date': item.documentDate,
    'Customer Reference': item.customerReference,
    'Customer Ref. Date': item.customerRefDate,
    'Collie': item.collie,
    'Total Weight': item.totalWeight,
    'Weight unit': item.weightUnit,
    'Total Volume': item.totalVolume,
    'Volume unit': item.volumeUnit,
    'Nama Customer / Cabang': item.name,
    'Upload Date': item.uploadDate,
    'Complete Date': item.completedDate || '-'
  }));

  exportToExcel(exportRows, filename, 'Surat Jalan');
}

/**
 * Format Claims for clean export
 */
export function exportClaimsToExcel(claims: ReturnSalesClaim[], filename = 'Astra_Isuzu_Return_Sales') {
  const exportRows = claims.map((claim, idx) => ({
    'No': idx + 1,
    'Claim ID': claim.id,
    'Status Klaim': claim.status === 'opened' ? 'Claim Opened' : claim.status === 'inprogress' ? 'Claim Inprogress' : 'Claim Completed',
    'Jenis Claim': claim.jenisClaim || 'Claim Kurang',
    'Nomor Surat Jalan': claim.nomorSuratJalan,
    'Shipment Number': claim.shipmentNumber,
    'Material (Part No)': claim.material,
    'Material Description': claim.materialDescription,
    'Customer': claim.customerName,
    'Qty Surat Jalan': claim.qtySuratJalan,
    'Qty Aktual': claim.qtyAktual,
    'Qty Shortage': claim.qtyShortage,
    'Satuan': claim.uom,
    'Tanggal Klaim': claim.createdDate,
    'Tanggal Submit Dokumen': claim.submittedDate || '-',
    'Disetujui Oleh': claim.approvedBy || '-',
    'Tanggal Approval': claim.approvedAt || '-'
  }));

  exportToExcel(exportRows, filename, 'Return Sales Claims');
}

/**
 * Parse uploaded Excel / TSV / CSV file into standardized SuratJalanItem list
 */
export async function parseSuratJalanFile(file: File, uploadedBy: string): Promise<SuratJalanItem[]> {
  return new Promise((resolve, reject) => {
    const isTextFormat = file.name.endsWith('.tsv') || file.name.endsWith('.csv') || file.type.includes('text');

    if (isTextFormat) {
      // Direct text parsing for TSV / CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const delimiter = file.name.endsWith('.tsv') || text.includes('\t') ? '\t' : ',';
          const rawRows = parseDelimitedText(text, delimiter);
          const mapped = transformRawRowsToItems(rawRows, uploadedBy);
          resolve(mapped);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
      return;
    }

    // Binary parsing for Excel files (.xlsx, .xls)
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { read, utils } = getXLSX();
        if (!read || !utils || typeof read !== 'function' || typeof utils.sheet_to_json !== 'function') {
          // Attempt text reading fallback
          throw new Error('Modul parser Excel tidak tersedia.');
        }

        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows: Record<string, any>[] = utils.sheet_to_json(worksheet, { defval: '' });
        
        if (!rawRows || rawRows.length === 0) {
          throw new Error('File Excel kosong atau tidak memiliki baris data.');
        }

        const mapped = transformRawRowsToItems(rawRows, uploadedBy);
        resolve(mapped);
      } catch (err: any) {
        // Fallback: If binary read fails, attempt text read in case it's a TSV/CSV with .xlsx/.xls extension
        const textReader = new FileReader();
        textReader.onload = (textEvt) => {
          try {
            const rawText = textEvt.target?.result as string;
            const delimiter = rawText.includes('\t') ? '\t' : ',';
            const rawRows = parseDelimitedText(rawText, delimiter);
            if (rawRows.length > 0) {
              resolve(transformRawRowsToItems(rawRows, uploadedBy));
              return;
            }
          } catch {}
          reject(new Error(err?.message || 'Gagal membaca format file Excel. Silakan gunakan format file .xlsx, .tsv, atau .csv.'));
        };
        textReader.onerror = () => reject(err);
        textReader.readAsText(file);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function transformRawRowsToItems(rawRows: Record<string, any>[], uploadedBy: string): SuratJalanItem[] {
  const now = new Date();
  const uploadDateStr = now.toISOString().split('T')[0];
  const uploadTimestamp = now.getTime();

  return rawRows.map((row, index) => {
    // Normalize column headers to handle variations, case sensitivity, and spaces
    const getVal = (possibleKeys: string[]): string => {
      for (const key of possibleKeys) {
        const foundKey = Object.keys(row).find(k => 
          k.trim().toLowerCase().replace(/[\s_\-.]/g, '') === key.trim().toLowerCase().replace(/[\s_\-.]/g, '')
        );
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return String(row[foundKey]).trim();
        }
      }
      return '';
    };

    const nomorSuratJalan = getVal(['Nomor Surat Jalan', 'Surat Jalan', 'No Surat Jalan', 'No SJ', 'Delivery Note']);
    const shipmentNumber = getVal(['Shipment Number', 'Shipment', 'No Shipment']);
    const delivery = getVal(['Delivery', 'Delivery Order', 'DO']);
    const handlingUnit = getVal(['Handling Unit', 'HU', 'HandlingUnit']);
    const material = getVal(['Material', 'Part Number', 'No Part', 'Part No', 'Item Code']);
    const materialDescription = getVal(['Material Description', 'Description', 'Nama Barang', 'Nama Part', 'Part Description']);
    const quantityStr = getVal(['Quantity', 'Qty', 'Jumlah']);
    const quantity = parseFloat(quantityStr.replace(/,/g, '')) || 0;
    const handlingUnitUom = getVal(['Handling unit UoM', 'UoM', 'Satuan', 'Unit']) || 'PC';
    const salesDocumentType = getVal(['Sales Document Type', 'Doc Type', 'Sales Type']) || 'I3SG';
    const plant = getVal(['Plant', 'Pabrik', 'Plant Code']) || 'I300';
    const documentDate = getVal(['Document Date', 'Doc Date', 'Tanggal Dokumen']) || uploadDateStr;
    const customerReference = getVal(['Customer Reference', 'Customer PO', 'PO Reference', 'Cust Ref']);
    const customerRefDate = getVal(['Customer Ref. Date', 'Customer Ref Date', 'PO Date']) || documentDate;
    const collie = parseInt(getVal(['Collie', 'Koli', 'Kemasan']) || '1', 10);
    const totalWeight = parseFloat(getVal(['Total Weight', 'Weight', 'Berat']).replace(/,/g, '')) || 0;
    const weightUnit = getVal(['Weight unit', 'Satuan Berat']) || 'KG';
    const totalVolume = parseFloat(getVal(['Total Volume', 'Volume']).replace(/,/g, '')) || 0;
    const volumeUnit = getVal(['Volume unit', 'Satuan Volume']) || 'CCM';
    const name = getVal(['Name', 'Customer Name', 'Nama Customer', 'Customer', 'Cabang']) || 'Astra Isuzu Customer';

    return {
      id: `SJ-${Date.now()}-${index + 1}-${Math.random().toString(36).substring(2, 6)}`,
      nomorSuratJalan: nomorSuratJalan || `SJ-${now.getFullYear()}${String(index + 1).padStart(4, '0')}`,
      shipmentNumber: shipmentNumber || `135${String(index + 1).padStart(5, '0')}`,
      delivery: delivery || `2353${String(index + 1).padStart(6, '0')}`,
      handlingUnit: handlingUnit || `1011${String(index + 1).padStart(6, '0')}`,
      material: material || `I8-97${String(index + 1).padStart(5, '0')}`,
      materialDescription: materialDescription || 'SPAREPART ASTRA ISUZU',
      quantity: quantity > 0 ? quantity : 1,
      handlingUnitUom,
      salesDocumentType,
      plant,
      documentDate,
      customerReference: customerReference || `PO-${now.getFullYear()}-${index + 1}`,
      customerRefDate,
      collie: isNaN(collie) || collie < 1 ? 1 : collie,
      totalWeight: isNaN(totalWeight) ? 0 : totalWeight,
      weightUnit,
      totalVolume: isNaN(totalVolume) ? 0 : totalVolume,
      volumeUnit,
      name,
      uploadDate: uploadDateStr,
      uploadTimestamp,
      uploadedBy,
      status: 'uploaded',
      qtyAktual: quantity > 0 ? quantity : 1,
      isChecked: false,
      hasDiscrepancy: false,
      discrepancyQty: 0
    };
  });
}

/**
 * Generate a ready-to-use template Excel workbook
 */
export function downloadSuratJalanTemplate() {
  const templateRows = [
    {
      'Nomor Surat Jalan': '2026138322',
      'Shipment Number': '13597018',
      'Delivery': '2353206362',
      'Handling Unit': '1011785539',
      'Material': 'I8-97017 382-A',
      'Material Description': 'HOSE FILLER NECK,PT',
      'Quantity': 10,
      'Handling unit UoM': 'PC',
      'Sales Document Type': 'I3SG',
      'Plant': 'I300',
      'Document Date': '22.10.2026',
      'Customer Reference': '5402201638',
      'Customer Ref. Date': '22.10.2026',
      'Collie': 1,
      'Total Weight': 1.640,
      'Weight unit': 'KG',
      'Total Volume': 15769,
      'Volume unit': 'CCM',
      'Name': 'AI - PT. RAJAWALI OTOMATIF TIRTAIN'
    },
    {
      'Nomor Surat Jalan': '2026138322',
      'Shipment Number': '13597018',
      'Delivery': '2353206362',
      'Handling Unit': '1011785540',
      'Material': '8-97100 344-0',
      'Material Description': 'OIL FILTER CARTRIDGE ELF',
      'Quantity': 24,
      'Handling unit UoM': 'PC',
      'Sales Document Type': 'I3SG',
      'Plant': 'I300',
      'Document Date': '22.10.2026',
      'Customer Reference': '5402201638',
      'Customer Ref. Date': '22.10.2026',
      'Collie': 2,
      'Total Weight': 4.800,
      'Weight unit': 'KG',
      'Total Volume': 32000,
      'Volume unit': 'CCM',
      'Name': 'AI - PT. RAJAWALI OTOMATIF TIRTAIN'
    },
    {
      'Nomor Surat Jalan': '2026138322',
      'Shipment Number': '13597018',
      'Delivery': '2353206362',
      'Handling Unit': '1011785541',
      'Material': '8-94437 988-0',
      'Material Description': 'BRAKE SHOE SET REAR GIGA',
      'Quantity': 15,
      'Handling unit UoM': 'SET',
      'Sales Document Type': 'I3SG',
      'Plant': 'I300',
      'Document Date': '22.10.2026',
      'Customer Reference': '5402201638',
      'Customer Ref. Date': '22.10.2026',
      'Collie': 3,
      'Total Weight': 18.200,
      'Weight unit': 'KG',
      'Total Volume': 48900,
      'Volume unit': 'CCM',
      'Name': 'AI - PT. RAJAWALI OTOMATIF TIRTAIN'
    }
  ];

  exportToExcel(templateRows, 'Template_Surat_Jalan_Astra_Isuzu', 'Template Surat Jalan');
}
