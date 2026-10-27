export type UserRole = 'master' | 'owner' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  customerName: string; // Nama Customer (Free text)
  status: UserStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type ItemProcessStatus = 'uploaded' | 'checking' | 'completed';

export interface SuratJalanItem {
  id: string;
  nomorSuratJalan: string;
  shipmentNumber: string;
  delivery: string;
  handlingUnit: string;
  material: string;
  materialDescription: string;
  quantity: number; // Qty upload
  handlingUnitUom: string;
  salesDocumentType: string;
  plant: string;
  documentDate: string;
  customerReference: string;
  customerRefDate: string;
  collie: number;
  totalWeight: number;
  weightUnit: string;
  totalVolume: number;
  volumeUnit: string;
  name: string; // Customer / Branch Name
  
  // Workflow fields
  uploadDate: string; // YYYY-MM-DD
  uploadTimestamp: number;
  uploadedBy: string;
  status: ItemProcessStatus;
  
  // Physical check fields
  qtyAktual?: number;
  isChecked?: boolean;
  hasDiscrepancy?: boolean; // qtyAktual < quantity
  discrepancyQty?: number;  // quantity - qtyAktual
  checkedBy?: string;
  completedDate?: string;
  notes?: string;
}

export type ClaimStatus = 'opened' | 'inprogress' | 'completed';
export type JenisClaim = 'Claim Kurang' | 'Claim Lebih' | 'Claim Rusak' | 'Claim Salah Fisik';

export interface ClaimDocuments {
  fotoSuratJalanUrl?: string;
  fotoSuratJalanName?: string;
  fotoDnDusUrl?: string;
  fotoDnDusName?: string;
  fotoDetailItemUrl?: string;
  fotoDetailItemName?: string;
  keterangan?: string;
}

export interface ReturnSalesClaim {
  id: string;
  shipmentItemId: string;
  nomorSuratJalan: string;
  shipmentNumber: string;
  delivery: string;
  material: string;
  materialDescription: string;
  customerName: string;
  qtySuratJalan: number;
  qtyAktual: number;
  qtyShortage: number;
  uom: string;
  plant: string;
  documentDate: string;
  status: ClaimStatus; // 'opened' | 'inprogress' | 'completed'
  jenisClaim?: JenisClaim;
  penjelasanClaim?: string;
  createdDate: string;
  submittedDate?: string;
  documents: ClaimDocuments;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
}

export interface CheckSummaryModalData {
  nomorSuratJalan: string;
  documentDate: string;
  customerName: string;
  totalItems: number;
  totalMatched: number;
  totalDiscrepancy: number;
  items: SuratJalanItem[];
}
