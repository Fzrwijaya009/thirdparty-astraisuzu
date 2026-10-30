/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserRole, 
  UserStatus,
  SuratJalanItem, 
  ReturnSalesClaim, 
  ClaimDocuments,
  JenisClaim
} from '../types';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';

interface AppContextType {
  // Auth
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    customerName: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  approveUser: (uid: string) => Promise<void>;
  rejectUser: (uid: string) => Promise<void>;
  deleteUser: (uid: string) => Promise<{ success: boolean; message?: string }>;

  // Shipments / Surat Jalan
  items: SuratJalanItem[];
  addItemsToDatabase: (newItems: SuratJalanItem[]) => Promise<void>;
  updateQtyAktual: (id: string, qtyAktual: number) => void;
  toggleItemCheck: (id: string, checked?: boolean) => void;
  toggleAllChecks: (checked: boolean, filterMaterial?: string) => void;
  submitCheckItems: (itemIds: string[]) => { completedItems: SuratJalanItem[]; shortages: SuratJalanItem[] };
  deleteItem: (id: string) => { success: boolean; message?: string };
  editItemDetails: (id: string, updates: Partial<SuratJalanItem>) => { success: boolean; message?: string };

  // Return Sales Claims
  claims: ReturnSalesClaim[];
  submitClaimFromComplete: (data: {
    shipmentItemId: string;
    jenisClaim: JenisClaim;
    penjelasanClaim: string;
    documents: ClaimDocuments;
  }) => { success: boolean; message?: string };
  submitClaimDocs: (claimId: string, docs: ClaimDocuments) => void;
  analyzeClaim: (claimId: string, notes: string) => { success: boolean; message?: string };
  approveClaim: (claimId: string, notes?: string) => { success: boolean; message?: string };
  rejectClaim: (claimId: string, reason: string) => { success: boolean; message?: string };
  deleteClaim: (claimId: string) => { success: boolean; message?: string };
  // Replacement / Ganti Part Management
  completeReplacement: (claimId: string, docNumber?: string, notes?: string) => { success: boolean; message?: string };

  // Invoice Management (Owner & Master System only)
  createInvoice: (itemIds: string[], invoiceNumber: string, notes?: string) => { success: boolean; message?: string };

  // System Data Management
  clearShipmentsData: () => Promise<void>;
  clearClaimsData: () => Promise<void>;
  clearAllData: () => Promise<void>;

  // Data isolation helper for Admin
  canAccessItem: (itemCustomerName: string) => boolean;

  // Print Modal
  activePrintData: {
    title: string;
    items: SuratJalanItem[];
    nomorSuratJalan: string;
    customerName: string;
    completedDate: string;
    checkerName: string;
  } | null;
  setActivePrintData: (data: any) => void;
}

const STORAGE_USERS_KEY = 'astra_isuzu_users_v5_cloud';
const STORAGE_ITEMS_KEY = 'astra_isuzu_items_v5_cloud';
const STORAGE_CLAIMS_KEY = 'astra_isuzu_claims_v5_cloud';
const STORAGE_AUTH_KEY = 'astra_isuzu_auth_v5_cloud';
const STORAGE_PASSWORDS_KEY = 'astra_isuzu_pwds_v5_cloud';

// Helper to create deterministic, safe doc IDs for user accounts
function makeUserDocId(email: string): string {
  return 'usr_' + email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
}

// CRITICAL: Firestore rejects objects containing 'undefined' as a value.
// This utility recursively cleans any undefined properties so Firestore writes never fail.
function cleanFirestoreData<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = cleanFirestoreData(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Password store for fallback / local cache
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PASSWORDS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // State for all users loaded from Firestore in real time
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Currently logged-in user profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Shipments (Surat Jalan items)
  const [items, setItems] = useState<SuratJalanItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ITEMS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Return Sales Claims
  const [claims, setClaims] = useState<ReturnSalesClaim[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CLAIMS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePrintData, setActivePrintData] = useState<any>(null);

  // Sync to LocalStorage for instant warm-start / offline resilience
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(allUsers));
    } catch (e) {
      console.error(e);
    }
  }, [allUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PASSWORDS_KEY, JSON.stringify(userPasswords));
    } catch (e) {
      console.error(e);
    }
  }, [userPasswords]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_AUTH_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CLAIMS_KEY, JSON.stringify(claims));
    } catch (e) {
      console.error(e);
    }
  }, [claims]);

  // 1. Real-time Synchronization from Firestore: USERS
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const loaded: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          loaded.push({ ...data, uid: docSnap.id });
        });
        setAllUsers(loaded);

        // If current user is logged in, refresh their status in real-time (e.g. when approved by Master)
        if (currentUser) {
          const fresh = loaded.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
          if (fresh && (fresh.status !== currentUser.status || fresh.role !== currentUser.role)) {
            setCurrentUser(fresh);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 2. Real-time Synchronization from Firestore: SHIPMENTS
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'shipments'),
      (snapshot) => {
        const loaded: SuratJalanItem[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as SuratJalanItem);
        });
        // Sort newest first
        loaded.sort((a, b) => (b.uploadTimestamp || 0) - (a.uploadTimestamp || 0));
        setItems(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'shipments');
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Real-time Synchronization from Firestore: RETURN_SALES
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'return_sales'),
      (snapshot) => {
        const loaded: ReturnSalesClaim[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as ReturnSalesClaim);
        });
        setClaims(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'return_sales');
      }
    );

    return () => unsubscribe();
  }, []);

  // Multi-tenancy isolation check for Admin:
  // Requirement 3: Otorisasi Owner sama seperti Master System (bisa akses semua customer),
  // sedangkan Admin hanya dibatasi ke customer yang didaftarkannya.
  const canAccessItem = (itemCustomerName: string): boolean => {
    if (!currentUser) return false;
    // Master System dan Owner dapat melihat seluruh data semua customer / cabang
    if (currentUser.role === 'master' || currentUser.role === 'owner') return true;

    // Admin hanya dapat melihat data sesuai "Nama Customer" yang terdaftar
    const userCust = (currentUser.customerName || '').trim().toLowerCase();
    const itemCust = (itemCustomerName || '').trim().toLowerCase();
    if (!userCust) return false;

    return itemCust.includes(userCust) || userCust.includes(itemCust);
  };

  // Auth Methods: Register
  const register = async (data: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    customerName: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const docId = makeUserDocId(trimmedEmail);

    // Check if user already exists in allUsers or directly in Firestore
    const existingLocal = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);
    if (existingLocal) {
      return { success: false, message: 'Email sudah terdaftar. Silakan langsung login.' };
    }

    try {
      const snap = await getDoc(doc(db, 'users', docId));
      if (snap.exists()) {
        return { success: false, message: 'Email sudah terdaftar. Silakan langsung login.' };
      }
    } catch {
      // Continue
    }

    // Requirement 1: Daftar akun Master System TIDAK DIPERKENANKAN untuk user gmail siapapun.
    // Master System HANYA ADA SATU akun dengan email fajrisani12@gmail.com
    const isMaster = trimmedEmail === 'fajrisani12@gmail.com';
    // User lain yang mendaftar secara ketat dipaksa menjadi 'owner' atau 'admin', tidak bisa 'master'
    const effectiveRole: UserRole = isMaster ? 'master' : (data.role === 'admin' ? 'admin' : 'owner');
    const effectiveStatus: UserStatus = isMaster ? 'approved' : 'pending';

    const newUser: UserProfile = {
      uid: docId,
      email: trimmedEmail,
      displayName: data.displayName.trim() || (isMaster ? 'Fajri Sani (Master)' : 'Pengguna TP-SYNCS'),
      role: effectiveRole,
      customerName: data.customerName.trim() || (isMaster ? 'PT Astra International Tbk - Isuzu (Head Office)' : 'Customer Astra Isuzu'),
      status: effectiveStatus,
      createdAt: new Date().toISOString(),
      password: data.password // Stored in Firestore so any device / browser can authenticate
    };

    if (isMaster) {
      newUser.approvedAt = new Date().toISOString();
      newUser.approvedBy = 'SYSTEM_BOOTSTRAP';
    }

    // Save locally
    setUserPasswords(prev => ({ ...prev, [trimmedEmail]: data.password }));

    // Clean any undefined properties before writing to Firestore to prevent SDK error
    const firestoreData = cleanFirestoreData(newUser);

    try {
      await setDoc(doc(db, 'users', docId), firestoreData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${docId}`);
      console.error('Registration Firestore write error:', err);
      return { 
        success: false, 
        message: 'Gagal menyimpan pendaftaran ke Firebase Firestore. Silakan coba sesaat lagi.' 
      };
    }

    setAllUsers(prev => [newUser, ...prev.filter(u => u.email.toLowerCase() !== trimmedEmail)]);

    if (newUser.status === 'approved') {
      setCurrentUser(newUser);
      return {
        success: true,
        message: `Pendaftaran berhasil! Akun Anda aktif sebagai ${newUser.role === 'master' ? 'Master System' : newUser.role.toUpperCase()}.`
      };
    } else {
      return {
        success: true,
        message: 'Pendaftaran berhasil! Akun Anda berstatus PENDING dan menunggu persetujuan (approval) dari Master System.'
      };
    }
  };

  // Auth Methods: Login
  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const docId = makeUserDocId(trimmedEmail);

    let user: UserProfile | undefined = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    // If not found in local memory, query Firestore directly (handles new browser / fresh device)
    if (!user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', docId));
        if (userDoc.exists()) {
          user = { ...(userDoc.data() as UserProfile), uid: userDoc.id };
        } else {
          // Check query by email field
          const q = query(collection(db, 'users'), where('email', '==', trimmedEmail));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            user = { ...(qSnap.docs[0].data() as UserProfile), uid: qSnap.docs[0].id };
          }
        }
      } catch (err) {
        console.warn('Direct Firestore user lookup failed:', err);
      }
    }

    // Special auto-bootstrap for Master System: fajrisani12@gmail.com
    // If fajrisani12@gmail.com logs in from a new browser/phone and has never been registered in Firestore yet:
    if (!user && trimmedEmail === 'fajrisani12@gmail.com') {
      const masterUser: UserProfile = {
        uid: docId,
        email: 'fajrisani12@gmail.com',
        displayName: 'Fajri Sani (Master)',
        role: 'master',
        customerName: 'PT Astra International Tbk - Isuzu (Head Office)',
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: 'SYSTEM_BOOTSTRAP',
        password: pass
      };

      try {
        await setDoc(doc(db, 'users', docId), cleanFirestoreData(masterUser));
        user = masterUser;
      } catch (e) {
        console.error('Failed to auto-seed master user to Firestore:', e);
      }
    }

    if (!user) {
      return { 
        success: false, 
        message: 'Akun dengan email ini belum terdaftar. Silakan pilih tab "Daftar Akun Baru" terlebih dahulu.' 
      };
    }

    // Password validation:
    // 1. Check user.password saved in Firestore
    // 2. Check local userPasswords
    // 3. If password wasn't saved yet on existing account, update and sync it to Firestore
    const validPass = user.password || userPasswords[trimmedEmail];
    if (validPass && validPass !== pass) {
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
    }

    // If Firestore doc lacked password, save it now
    if (!user.password && pass) {
      user.password = pass;
      updateDoc(doc(db, 'users', user.uid), { password: pass }).catch(() => {});
      setUserPasswords(prev => ({ ...prev, [trimmedEmail]: pass }));
    }

    // Approval status validation
    if (user.status === 'pending') {
      return {
        success: false,
        message: 'Akun Anda sedang menunggu persetujuan (Approval) dari Master System. Silakan hubungi akun Master System untuk aktivasi.'
      };
    }

    if (user.status === 'rejected') {
      return { success: false, message: 'Akun Anda telah ditolak oleh Master System.' };
    }

    setCurrentUser(user);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Requirement 3: Approval akun baru HANYA ada di otorisasi Master System
  const approveUser = async (uid: string) => {
    if (currentUser?.role !== 'master') {
      alert('Akses Ditolak: Hanya akun Master System (fajrisani12@gmail.com) yang berwenang menyetujui akun baru.');
      return;
    }
    const nowStr = new Date().toISOString();
    const approver = currentUser.displayName || 'Master System';

    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'approved',
        approvedAt: nowStr,
        approvedBy: approver
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
    }

    // Local optimistic update
    setAllUsers(prev => prev.map(u => {
      if (u.uid === uid) {
        return { ...u, status: 'approved', approvedAt: nowStr, approvedBy: approver };
      }
      return u;
    }));
  };

  const rejectUser = async (uid: string) => {
    if (currentUser?.role !== 'master') {
      alert('Akses Ditolak: Hanya akun Master System (fajrisani12@gmail.com) yang berwenang menolak akun.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
    }

    // Local optimistic update
    setAllUsers(prev => prev.map(u => (u.uid === uid ? { ...u, status: 'rejected' } : u)));
  };

  // Requirement 3: Otorisasi Hapus Akun pada akun Master System fajrisani12@gmail.com
  const deleteUser = async (uid: string): Promise<{ success: boolean; message?: string }> => {
    if (currentUser?.role !== 'master' || currentUser?.email.toLowerCase() !== 'fajrisani12@gmail.com') {
      return { 
        success: false, 
        message: 'Akses Ditolak: Hanya akun Master System (fajrisani12@gmail.com) yang berwenang menghapus akun.' 
      };
    }

    const targetUser = allUsers.find(u => u.uid === uid);
    if (!targetUser) return { success: false, message: 'Akun pengguna tidak ditemukan.' };

    if (targetUser.email.toLowerCase() === 'fajrisani12@gmail.com') {
      return { success: false, message: 'Akun Master Utama fajrisani12@gmail.com tidak dapat dihapus.' };
    }

    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${uid}`);
    }

    setAllUsers(prev => prev.filter(u => u.uid !== uid));
    setUserPasswords(prev => {
      const copy = { ...prev };
      delete copy[targetUser.email.toLowerCase()];
      return copy;
    });

    return { 
      success: true, 
      message: `Akun ${targetUser.displayName} (${targetUser.email}) berhasil dihapus. Pengguna harus mendaftar ulang jika ingin mengakses kembali.` 
    };
  };

  // Shipments: Add items to database from preview staging
  // Requirement 3: Owner & Master memiliki wewenang upload Surat Jalan
  const addItemsToDatabase = async (newItems: SuratJalanItem[]) => {
    // Set status to 'checking'
    const readyItems = newItems.map(item => ({
      ...item,
      status: 'checking' as const
    }));

    // Save each row to Firestore so all connected devices see it immediately
    for (const item of readyItems) {
      try {
        await setDoc(doc(db, 'shipments', item.id), cleanFirestoreData(item));
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `shipments/${item.id}`);
      }
    }

    setItems(prev => [...readyItems, ...prev]);
  };

  const updateQtyAktual = (id: string, qtyAktual: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const safeQty = Math.max(0, isNaN(qtyAktual) ? 0 : qtyAktual);
        const hasDiscrepancy = safeQty !== item.quantity;
        const discrepancyQty = Math.abs(safeQty - item.quantity);
        const updated = {
          ...item,
          qtyAktual: safeQty,
          hasDiscrepancy,
          discrepancyQty
        };
        // Background sync to Firestore
        setDoc(doc(db, 'shipments', id), cleanFirestoreData(updated)).catch(() => {});
        return updated;
      }
      return item;
    }));
  };

  const toggleItemCheck = (id: string, checked?: boolean) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, isChecked: checked !== undefined ? checked : !item.isChecked };
        setDoc(doc(db, 'shipments', id), cleanFirestoreData(updated)).catch(() => {});
        return updated;
      }
      return item;
    }));
  };

  const toggleAllChecks = (checked: boolean, filterMaterial?: string) => {
    setItems(prev => prev.map(item => {
      if (item.status === 'completed') return item;
      if (!canAccessItem(item.name)) return item;
      if (filterMaterial && !item.material.toLowerCase().includes(filterMaterial.toLowerCase())) {
        return item;
      }
      const updated = { ...item, isChecked: checked };
      setDoc(doc(db, 'shipments', item.id), cleanFirestoreData(updated)).catch(() => {});
      return updated;
    }));
  };

  const submitCheckItems = (itemIds: string[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const completedItemsList: SuratJalanItem[] = [];
    const discrepancyItemsList: SuratJalanItem[] = [];
    const newClaimsList: ReturnSalesClaim[] = [];

    setItems(prev => prev.map(item => {
      if (itemIds.includes(item.id)) {
        const actualQty = item.qtyAktual !== undefined ? item.qtyAktual : item.quantity;
        const isShortage = actualQty < item.quantity;
        const isOverage = actualQty > item.quantity;
        const hasDiscrepancy = isShortage || isOverage;
        const diff = Math.abs(actualQty - item.quantity);

        const claimId = hasDiscrepancy ? `CLM-${todayStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}` : undefined;

        const updatedItem: SuratJalanItem = {
          ...item,
          status: 'completed',
          isChecked: true,
          qtyAktual: actualQty,
          hasDiscrepancy,
          discrepancyQty: diff,
          checkedBy: currentUser?.displayName || 'Checker Gudang',
          completedDate: todayStr,
          claimStatus: hasDiscrepancy ? 'claimed' : 'unclaimed',
          claimId
        };

        completedItemsList.push(updatedItem);

        // Firestore sync for shipment item
        setDoc(doc(db, 'shipments', item.id), cleanFirestoreData(updatedItem)).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `shipments/${item.id}`);
        });

        // Requirement 3: Item problem shortage (-) maupun overage (+) otomatis ter-create ke Return Sales
        if (hasDiscrepancy && claimId) {
          discrepancyItemsList.push(updatedItem);

          const jenisClaim: JenisClaim = isOverage ? 'Claim Lebih' : 'Claim Kurang';
          const claimRecord: ReturnSalesClaim = {
            id: claimId,
            shipmentItemId: item.id,
            nomorSuratJalan: item.nomorSuratJalan,
            shipmentNumber: item.shipmentNumber,
            delivery: item.delivery,
            material: item.material,
            materialDescription: item.materialDescription,
            customerName: item.name,
            qtySuratJalan: item.quantity,
            qtyAktual: actualQty,
            qtyShortage: diff,
            uom: item.handlingUnitUom,
            plant: item.plant,
            documentDate: item.documentDate,
            status: 'opened',
            jenisClaim,
            penjelasanClaim: isOverage 
              ? `Fisik diterima ${actualQty} ${item.handlingUnitUom}, melebihi Surat Jalan (${item.quantity} ${item.handlingUnitUom}) dengan selisih +${diff} ${item.handlingUnitUom}.`
              : `Fisik diterima ${actualQty} ${item.handlingUnitUom}, kurang dari Surat Jalan (${item.quantity} ${item.handlingUnitUom}) dengan selisih -${diff} ${item.handlingUnitUom}.`,
            createdDate: todayStr,
            documents: {}
          };
          newClaimsList.push(claimRecord);

          setDoc(doc(db, 'return_sales', claimRecord.id), cleanFirestoreData(claimRecord)).catch(e => {
            handleFirestoreError(e, OperationType.CREATE, `return_sales/${claimRecord.id}`);
          });
        }

        return updatedItem;
      }
      return item;
    }));

    if (newClaimsList.length > 0) {
      setClaims(prev => [...newClaimsList, ...prev]);
    }

    return { completedItems: completedItemsList, shortages: discrepancyItemsList };
  };

  // Requirement 3: Owner & Master memiliki wewenang penuh menghapus data
  const deleteItem = (id: string): { success: boolean; message?: string } => {
    const item = items.find(i => i.id === id);
    if (!item) return { success: false, message: 'Item tidak ditemukan.' };

    if (currentUser?.role === 'admin' && item.status === 'completed') {
      return {
        success: false,
        message: 'Akses Ditolak: Admin hanya dapat menghapus data yang BELUM selesai/approved oleh Owner.'
      };
    }

    deleteDoc(doc(db, 'shipments', id)).catch(e => {
      handleFirestoreError(e, OperationType.DELETE, `shipments/${id}`);
    });

    setItems(prev => prev.filter(i => i.id !== id));
    return { success: true };
  };

  // Requirement 3: Owner & Master memiliki wewenang penuh mengubah data
  const editItemDetails = (id: string, updates: Partial<SuratJalanItem>): { success: boolean; message?: string } => {
    const item = items.find(i => i.id === id);
    if (!item) return { success: false, message: 'Item tidak ditemukan.' };

    if (currentUser?.role === 'admin' && item.status === 'completed') {
      return {
        success: false,
        message: 'Akses Ditolak: Admin hanya dapat mengubah data yang BELUM disetujui Owner.'
      };
    }

    const updated = { ...item, ...updates };
    setDoc(doc(db, 'shipments', id), cleanFirestoreData(updated)).catch(e => {
      handleFirestoreError(e, OperationType.UPDATE, `shipments/${id}`);
    });

    setItems(prev => prev.map(i => i.id === id ? updated : i));
    return { success: true };
  };

  // Submit Claim directly from Complete Proses popup
  const submitClaimFromComplete = (data: {
    shipmentItemId: string;
    jenisClaim: JenisClaim;
    penjelasanClaim: string;
    documents: ClaimDocuments;
  }): { success: boolean; message?: string } => {
    const targetItem = items.find(i => i.id === data.shipmentItemId);
    if (!targetItem) return { success: false, message: 'Item tidak ditemukan.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

    // Mark item as problem
    const diff = (targetItem.qtyAktual !== undefined && targetItem.qtyAktual < targetItem.quantity)
      ? targetItem.quantity - targetItem.qtyAktual
      : 1;

    // Check if claim already exists for this item
    const existingClaim = claims.find(c => c.shipmentItemId === data.shipmentItemId);
    const claimId = existingClaim ? existingClaim.id : `CLM-${todayStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const updatedItem: SuratJalanItem = {
      ...targetItem,
      hasDiscrepancy: true,
      discrepancyQty: diff,
      claimStatus: 'claimed',
      claimId: claimId
    };

    setDoc(doc(db, 'shipments', targetItem.id), cleanFirestoreData(updatedItem)).catch(e => {
      handleFirestoreError(e, OperationType.UPDATE, `shipments/${targetItem.id}`);
    });

    setItems(prev => prev.map(i => i.id === targetItem.id ? updatedItem : i));

    const nowIso = new Date().toISOString();
    const submitter = currentUser?.displayName || (currentUser?.role === 'admin' ? `Admin (${currentUser.customerName})` : 'User');

    const newClaim: ReturnSalesClaim = {
      id: claimId,
      shipmentItemId: targetItem.id,
      nomorSuratJalan: targetItem.nomorSuratJalan,
      shipmentNumber: targetItem.shipmentNumber,
      delivery: targetItem.delivery,
      material: targetItem.material,
      materialDescription: targetItem.materialDescription,
      customerName: targetItem.name,
      qtySuratJalan: targetItem.quantity,
      qtyAktual: targetItem.qtyAktual ?? targetItem.quantity,
      qtyShortage: diff,
      uom: targetItem.handlingUnitUom,
      plant: targetItem.plant,
      documentDate: targetItem.documentDate,
      status: 'inprogress', // Automatically moves to Inprogress as documents are provided
      jenisClaim: data.jenisClaim,
      penjelasanClaim: data.penjelasanClaim,
      createdDate: existingClaim ? existingClaim.createdDate : todayStr,
      submittedDate: nowIso,
      submittedBy: submitter,
      documents: {
        ...data.documents,
        keterangan: data.penjelasanClaim
      }
    };

    setDoc(doc(db, 'return_sales', claimId), cleanFirestoreData(newClaim)).catch(e => {
      handleFirestoreError(e, OperationType.WRITE, `return_sales/${claimId}`);
    });

    setClaims(prev => {
      const idx = prev.findIndex(c => c.id === claimId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newClaim;
        return copy;
      }
      return [newClaim, ...prev];
    });

    return { success: true };
  };

  const submitClaimDocs = (claimId: string, docs: ClaimDocuments) => {
    const nowIso = new Date().toISOString();
    const submitterName = currentUser?.displayName || 'Admin Checker';
    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const isReupload = Boolean(claim.analyzedAt);
        const updated: ReturnSalesClaim = {
          ...claim,
          status: 'inprogress' as const,
          submittedDate: claim.submittedDate || nowIso,
          submittedBy: claim.submittedBy || submitterName,
          reSubmittedAt: isReupload ? nowIso : claim.reSubmittedAt,
          hasAdminReupload: isReupload,
          documents: { ...claim.documents, ...docs }
        };
        setDoc(doc(db, 'return_sales', claimId), cleanFirestoreData(updated)).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `return_sales/${claimId}`);
        });
        return updated;
      }
      return claim;
    }));
  };

  // Requirement 5: Tangkapan waktu analisa dari Owner
  const analyzeClaim = (claimId: string, notes: string): { success: boolean; message?: string } => {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'master')) {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya akun Owner atau Master System yang berwenang melakukan analisa klaim.'
      };
    }

    const nowIso = new Date().toISOString();
    const analyst = currentUser.displayName || (currentUser.role === 'owner' ? 'Owner Part Services' : 'Master System');

    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const updated: ReturnSalesClaim = {
          ...claim,
          analyzedAt: nowIso,
          analyzedBy: analyst,
          analisaNotes: notes,
          hasAdminReupload: false // Reset flag once analyzed
        };
        setDoc(doc(db, 'return_sales', claimId), cleanFirestoreData(updated)).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `return_sales/${claimId}`);
        });
        return updated;
      }
      return claim;
    }));

    return { success: true, message: 'Analisa klaim berhasil disimpan.' };
  };

  // Requirement 3 & 5: Approval klaim dengan tangkapan waktu selesai
  const approveClaim = (claimId: string, notes?: string): { success: boolean; message?: string } => {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'master')) {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya akun Owner atau Master System yang dapat menyetujui klaim.'
      };
    }

    const nowIso = new Date().toISOString();
    const approver = currentUser.displayName || (currentUser.role === 'owner' ? 'Owner Part Services' : 'Master System');

    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const updated: ReturnSalesClaim = {
          ...claim,
          status: 'completed' as const,
          approvedBy: approver,
          approvedAt: nowIso,
          approvalNotes: notes || claim.approvalNotes || 'Disetujui oleh Owner departemen Retail & Part Services.'
        };
        setDoc(doc(db, 'return_sales', claimId), cleanFirestoreData(updated)).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `return_sales/${claimId}`);
        });
        return updated;
      }
      return claim;
    }));

    return { success: true };
  };

  // Requirement 4: Reject Claim oleh Owner & Master System
  const rejectClaim = (claimId: string, reason: string): { success: boolean; message?: string } => {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'master')) {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya akun Owner atau Master System yang dapat menolak klaim.'
      };
    }
    if (!reason.trim()) {
      return { success: false, message: 'Alasan penolakan klaim wajib diisi.' };
    }

    const nowIso = new Date().toISOString();
    const rejecter = currentUser.displayName || (currentUser.role === 'owner' ? 'Owner Part Services' : 'Master System');

    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const updated: ReturnSalesClaim = {
          ...claim,
          status: 'rejected' as const,
          rejectedBy: rejecter,
          rejectedAt: nowIso,
          rejectionReason: reason.trim()
        };
        setDoc(doc(db, 'return_sales', claimId), cleanFirestoreData(updated)).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `return_sales/${claimId}`);
        });
        return updated;
      }
      return claim;
    }));

    return { success: true, message: 'Klaim berhasil ditolak.' };
  };

  // Requirement 6: Create Invoice oleh Owner & Master System
  const createInvoice = (itemIds: string[], invoiceNumber: string, notes?: string): { success: boolean; message?: string } => {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'master')) {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya akun Owner atau Master System yang berwenang memproses invoice.'
      };
    }
    if (!invoiceNumber.trim()) {
      return { success: false, message: 'Nomor invoice wajib diisi.' };
    }

    const nowIso = new Date().toISOString();
    const invBy = currentUser.displayName || (currentUser.role === 'owner' ? 'Owner Part Services' : 'Master System');

    setItems(prev => prev.map(item => {
      if (itemIds.includes(item.id)) {
        const updated: SuratJalanItem = {
          ...item,
          invoiceStatus: 'invoiced',
          invoiceNumber: invoiceNumber.trim(),
          invoicedAt: nowIso,
          invoicedBy: invBy,
          invoiceNotes: notes || ''
        };
        setDoc(doc(db, 'shipments', item.id), cleanFirestoreData(updated)).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `shipments/${item.id}`);
        });
        return updated;
      }
      return item;
    }));

    return { success: true, message: `Berhasil membuat invoice ${invoiceNumber} untuk ${itemIds.length} item.` };
  };

  // Requirement 3: Owner & Master memiliki wewenang menghapus klaim
  const deleteClaim = (claimId: string): { success: boolean; message?: string } => {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'master')) {
      return { success: false, message: 'Akses Ditolak: Hanya Owner dan Master System yang dapat menghapus klaim.' };
    }
    deleteDoc(doc(db, 'return_sales', claimId)).catch(e => {
      handleFirestoreError(e, OperationType.DELETE, `return_sales/${claimId}`);
    });
    setClaims(prev => prev.filter(c => c.id !== claimId));
    return { success: true };
  };

  // Requirement 5: Fitur Ganti Part untuk Claim Completed
  const completeReplacement = (claimId: string, docNumber?: string, notes?: string): { success: boolean; message?: string } => {
    const nowIso = new Date().toISOString();
    const officer = currentUser?.displayName || (currentUser?.role === 'owner' ? 'Owner Part Services' : currentUser?.role === 'master' ? 'Master System' : 'Petugas Part Gudang');
    const autoDocNumber = docNumber || `SPP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const updated: ReturnSalesClaim = {
          ...claim,
          replacementStatus: 'completed',
          replacedAt: nowIso,
          replacedBy: officer,
          replacementDocNumber: autoDocNumber,
          replacementNotes: notes || claim.replacementNotes || 'Barang klaim telah dilakukan serah terima pergantian sparepart fisik.'
        };
        setDoc(doc(db, 'return_sales', claimId), cleanFirestoreData(updated)).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `return_sales/${claimId}`);
        });
        return updated;
      }
      return claim;
    }));

    return { success: true, message: 'Status pergantian part berhasil ditandai Selesai (Completed).' };
  };

  // Requirement 3 & 4: Master System dan Owner berwenang membersihkan / reset data
  const clearShipmentsData = async () => {
    if (currentUser?.role !== 'owner' && currentUser?.role !== 'master') {
      alert('Hanya Master System dan Owner yang berwenang membersihkan data.');
      return;
    }
    // Delete from Firestore
    for (const item of items) {
      deleteDoc(doc(db, 'shipments', item.id)).catch(() => {});
    }
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_ITEMS_KEY);
    } catch {}
  };

  const clearClaimsData = async () => {
    if (currentUser?.role !== 'owner' && currentUser?.role !== 'master') {
      alert('Hanya Master System dan Owner yang berwenang membersihkan data.');
      return;
    }
    for (const claim of claims) {
      deleteDoc(doc(db, 'return_sales', claim.id)).catch(() => {});
    }
    setClaims([]);
    try {
      localStorage.removeItem(STORAGE_CLAIMS_KEY);
    } catch {}
  };

  const clearAllData = async () => {
    if (currentUser?.role !== 'owner' && currentUser?.role !== 'master') {
      alert('Hanya Master System dan Owner yang berwenang membersihkan seluruh data.');
      return;
    }
    await clearShipmentsData();
    await clearClaimsData();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        login,
        register,
        logout,
        approveUser,
        rejectUser,
        deleteUser,
        items,
        addItemsToDatabase,
        updateQtyAktual,
        toggleItemCheck,
        toggleAllChecks,
        submitCheckItems,
        deleteItem,
        editItemDetails,
        claims,
        submitClaimFromComplete,
        submitClaimDocs,
        analyzeClaim,
        approveClaim,
        rejectClaim,
        deleteClaim,
        completeReplacement,
        createInvoice,
        clearShipmentsData,
        clearClaimsData,
        clearAllData,
        canAccessItem,
        activePrintData,
        setActivePrintData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
