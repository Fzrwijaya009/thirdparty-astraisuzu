/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserRole, 
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
  approveClaim: (claimId: string, notes?: string) => { success: boolean; message?: string };
  deleteClaim: (claimId: string) => { success: boolean; message?: string };

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

const STORAGE_USERS_KEY = 'astra_isuzu_users_v4_cloud';
const STORAGE_ITEMS_KEY = 'astra_isuzu_items_v4_cloud';
const STORAGE_CLAIMS_KEY = 'astra_isuzu_claims_v4_cloud';
const STORAGE_AUTH_KEY = 'astra_isuzu_auth_v4_cloud';
const STORAGE_PASSWORDS_KEY = 'astra_isuzu_pwds_v4_cloud';

// Helper to create deterministic, safe doc IDs for user accounts
function makeUserDocId(email: string): string {
  return 'usr_' + email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
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

        // If current user is logged in, refresh their status in real-time (e.g. when approved)
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

  // Multi-tenancy isolation check for Admin
  const canAccessItem = (itemCustomerName: string): boolean => {
    if (!currentUser) return false;
    // Master System and Owner can see all companies/customers
    if (currentUser.role === 'master' || currentUser.role === 'owner') return true;

    // Admin can ONLY see items matching their registered "Nama Customer"
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

    // Role rules:
    // If user selects Master System or email is fajrisani12@gmail.com, auto-approve
    const isMaster = data.role === 'master' || trimmedEmail === 'fajrisani12@gmail.com';
    const effectiveRole: UserRole = isMaster ? 'master' : data.role;
    const effectiveStatus = isMaster ? 'approved' : 'pending';

    const newUser: UserProfile = {
      uid: docId,
      email: trimmedEmail,
      displayName: data.displayName.trim() || (isMaster ? 'Fajri Sani (Master)' : 'Pengguna TP-SYNCS'),
      role: effectiveRole,
      customerName: data.customerName.trim() || (isMaster ? 'PT Astra International Tbk - Isuzu (Head Office)' : 'Customer Astra Isuzu'),
      status: effectiveStatus,
      createdAt: new Date().toISOString(),
      approvedAt: isMaster ? new Date().toISOString() : undefined,
      approvedBy: isMaster ? 'SYSTEM_BOOTSTRAP' : undefined,
      password: data.password // Stored in Firestore so any device / browser can verify
    };

    // Save locally
    setUserPasswords(prev => ({ ...prev, [trimmedEmail]: data.password }));

    // Save to Firestore so it instantly appears on all browsers and devices
    try {
      await setDoc(doc(db, 'users', docId), newUser);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${docId}`);
      return { 
        success: false, 
        message: 'Gagal menghubungkan ke Firebase Firestore. Periksa koneksi internet Anda.' 
      };
    }

    setAllUsers(prev => [newUser, ...prev.filter(u => u.email.toLowerCase() !== trimmedEmail)]);

    if (newUser.status === 'approved') {
      setCurrentUser(newUser);
      return {
        success: true,
        message: `Pendaftaran berhasil! Akun Anda langsung aktif sebagai ${newUser.role === 'master' ? 'Master System' : newUser.role.toUpperCase()}.`
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
        await setDoc(doc(db, 'users', docId), masterUser);
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

  const approveUser = async (uid: string) => {
    if (currentUser?.role !== 'master') {
      alert('Hanya Master System yang dapat menyetujui akun.');
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
      alert('Hanya Master System yang dapat menolak akun.');
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

  // Shipments: Add items to database from preview staging
  const addItemsToDatabase = async (newItems: SuratJalanItem[]) => {
    // Set status to 'checking'
    const readyItems = newItems.map(item => ({
      ...item,
      status: 'checking' as const
    }));

    // Save each row to Firestore so all connected devices see it immediately
    for (const item of readyItems) {
      try {
        await setDoc(doc(db, 'shipments', item.id), item);
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
        const hasDiscrepancy = safeQty < item.quantity;
        const discrepancyQty = hasDiscrepancy ? item.quantity - safeQty : 0;
        const updated = {
          ...item,
          qtyAktual: safeQty,
          hasDiscrepancy,
          discrepancyQty
        };
        // Background sync to Firestore
        setDoc(doc(db, 'shipments', id), updated).catch(() => {});
        return updated;
      }
      return item;
    }));
  };

  const toggleItemCheck = (id: string, checked?: boolean) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, isChecked: checked !== undefined ? checked : !item.isChecked };
        setDoc(doc(db, 'shipments', id), updated).catch(() => {});
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
      setDoc(doc(db, 'shipments', item.id), updated).catch(() => {});
      return updated;
    }));
  };

  const submitCheckItems = (itemIds: string[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const completedItemsList: SuratJalanItem[] = [];
    const shortageItemsList: SuratJalanItem[] = [];
    const newClaimsList: ReturnSalesClaim[] = [];

    setItems(prev => prev.map(item => {
      if (itemIds.includes(item.id)) {
        const actualQty = item.qtyAktual !== undefined ? item.qtyAktual : item.quantity;
        const isShortage = actualQty < item.quantity;
        const diff = isShortage ? item.quantity - actualQty : 0;

        const updatedItem: SuratJalanItem = {
          ...item,
          status: 'completed',
          isChecked: true,
          qtyAktual: actualQty,
          hasDiscrepancy: isShortage,
          discrepancyQty: diff,
          checkedBy: currentUser?.displayName || 'Checker Gudang',
          completedDate: todayStr
        };

        completedItemsList.push(updatedItem);

        // Firestore sync for shipment item
        setDoc(doc(db, 'shipments', item.id), updatedItem).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `shipments/${item.id}`);
        });

        if (isShortage) {
          shortageItemsList.push(updatedItem);

          const claimRecord: ReturnSalesClaim = {
            id: `CLM-${todayStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
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
            jenisClaim: 'Claim Kurang',
            createdDate: todayStr,
            documents: {}
          };
          newClaimsList.push(claimRecord);

          setDoc(doc(db, 'return_sales', claimRecord.id), claimRecord).catch(e => {
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

    return { completedItems: completedItemsList, shortages: shortageItemsList };
  };

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
    setDoc(doc(db, 'shipments', id), updated).catch(e => {
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

    const updatedItem = {
      ...targetItem,
      hasDiscrepancy: true,
      discrepancyQty: diff
    };

    setDoc(doc(db, 'shipments', targetItem.id), updatedItem).catch(e => {
      handleFirestoreError(e, OperationType.UPDATE, `shipments/${targetItem.id}`);
    });

    setItems(prev => prev.map(i => i.id === targetItem.id ? updatedItem : i));

    // Check if claim already exists for this item
    const existingClaim = claims.find(c => c.shipmentItemId === data.shipmentItemId);
    const claimId = existingClaim ? existingClaim.id : `CLM-${todayStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

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
      submittedDate: nowStr,
      documents: {
        ...data.documents,
        keterangan: data.penjelasanClaim
      }
    };

    setDoc(doc(db, 'return_sales', claimId), newClaim).catch(e => {
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
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const updated = {
          ...claim,
          status: 'inprogress' as const,
          submittedDate: nowStr,
          documents: { ...claim.documents, ...docs }
        };
        setDoc(doc(db, 'return_sales', claimId), updated).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `return_sales/${claimId}`);
        });
        return updated;
      }
      return claim;
    }));
  };

  const approveClaim = (claimId: string, notes?: string): { success: boolean; message?: string } => {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'master')) {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya akun Owner atau Master System yang dapat menyetujui klaim.'
      };
    }

    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const updated = {
          ...claim,
          status: 'completed' as const,
          approvedBy: currentUser.displayName || currentUser.role.toUpperCase(),
          approvedAt: nowStr,
          approvalNotes: notes || 'Disetujui oleh Owner departemen Retail & Part Services.'
        };
        setDoc(doc(db, 'return_sales', claimId), updated).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `return_sales/${claimId}`);
        });
        return updated;
      }
      return claim;
    }));

    return { success: true };
  };

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

  // Requirement 4: Features to clean/delete all data in Pengaturan System
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
        approveClaim,
        deleteClaim,
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
