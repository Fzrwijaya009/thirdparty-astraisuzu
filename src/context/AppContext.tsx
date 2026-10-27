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
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc 
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
  approveUser: (uid: string) => void;
  rejectUser: (uid: string) => void;

  // Shipments / Surat Jalan
  items: SuratJalanItem[];
  addItemsToDatabase: (newItems: SuratJalanItem[]) => void;
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

const STORAGE_USERS_KEY = 'astra_isuzu_users_v3_clean';
const STORAGE_ITEMS_KEY = 'astra_isuzu_items_v3_clean';
const STORAGE_CLAIMS_KEY = 'astra_isuzu_claims_v3_clean';
const STORAGE_AUTH_KEY = 'astra_isuzu_auth_v3_clean';
const STORAGE_PASSWORDS_KEY = 'astra_isuzu_pwds_v3_clean';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear any old mock demo keys from previous test runs so database starts completely clean
  useEffect(() => {
    try {
      localStorage.removeItem('astra_isuzu_users_v2');
      localStorage.removeItem('astra_isuzu_items_v2');
      localStorage.removeItem('astra_isuzu_claims_v2');
      localStorage.removeItem('astra_isuzu_auth_user_v2');
    } catch {
      // ignore
    }
  }, []);

  // Password store for email/password authentication
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PASSWORDS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Clean initial states (empty, no demo records)
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [items, setItems] = useState<SuratJalanItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ITEMS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [claims, setClaims] = useState<ReturnSalesClaim[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CLAIMS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePrintData, setActivePrintData] = useState<any>(null);

  // Sync to LocalStorage
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

  // Load from Firestore on mount if available
  useEffect(() => {
    async function syncFromFirestore() {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (!usersSnap.empty) {
          const loadedUsers: UserProfile[] = [];
          usersSnap.forEach(d => loadedUsers.push(d.data() as UserProfile));
          if (loadedUsers.length > 0) setAllUsers(loadedUsers);
        }

        const itemsSnap = await getDocs(collection(db, 'shipments'));
        if (!itemsSnap.empty) {
          const loadedItems: SuratJalanItem[] = [];
          itemsSnap.forEach(d => loadedItems.push(d.data() as SuratJalanItem));
          if (loadedItems.length > 0) setItems(loadedItems);
        }

        const claimsSnap = await getDocs(collection(db, 'return_sales'));
        if (!claimsSnap.empty) {
          const loadedClaims: ReturnSalesClaim[] = [];
          claimsSnap.forEach(d => loadedClaims.push(d.data() as ReturnSalesClaim));
          if (loadedClaims.length > 0) setClaims(loadedClaims);
        }
      } catch (err) {
        // Fallback to local storage
        console.warn('Firestore initial fetch fallback to offline cache:', err);
      }
    }
    syncFromFirestore();
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

  // Auth Methods
  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!user) {
      return { 
        success: false, 
        message: 'Akun dengan email ini belum terdaftar. Silakan lakukan pendaftaran akun baru terlebih dahulu.' 
      };
    }

    // Password validation
    const savedPassword = userPasswords[trimmedEmail];
    if (savedPassword && savedPassword !== pass) {
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
    }

    if (user.status === 'pending') {
      return {
        success: false,
        message: 'Akun Anda sedang menunggu persetujuan (Approval) dari Master System. Hubungi Administrator.'
      };
    }

    if (user.status === 'rejected') {
      return { success: false, message: 'Akun Anda telah ditolak oleh Master System.' };
    }

    setCurrentUser(user);
    return { success: true };
  };

  const register = async (data: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    customerName: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const existing = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, message: 'Email sudah terdaftar. Silakan langsung login.' };
    }

    // Role rules:
    // If user selects Master System or if email is fajrisani12@gmail.com, auto-approve
    const isMaster = data.role === 'master' || trimmedEmail === 'fajrisani12@gmail.com';
    const effectiveRole: UserRole = isMaster ? 'master' : data.role;
    const effectiveStatus = isMaster ? 'approved' : 'pending';

    const newUser: UserProfile = {
      uid: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: trimmedEmail,
      displayName: data.displayName.trim(),
      role: effectiveRole,
      customerName: data.customerName.trim(),
      status: effectiveStatus,
      createdAt: new Date().toISOString(),
      approvedAt: isMaster ? new Date().toISOString() : undefined,
      approvedBy: isMaster ? 'SYSTEM_BOOTSTRAP' : undefined
    };

    // Save password
    setUserPasswords(prev => ({ ...prev, [trimmedEmail]: data.password }));

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', newUser.uid), newUser);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${newUser.uid}`);
    }

    setAllUsers(prev => [newUser, ...prev]);

    if (newUser.status === 'approved') {
      setCurrentUser(newUser);
      return {
        success: true,
        message: `Pendaftaran berhasil! Akun Anda aktif sebagai ${newUser.role === 'master' ? 'Master System' : newUser.role.toUpperCase()}.`
      };
    } else {
      return {
        success: true,
        message: 'Pendaftaran berhasil! Akun Anda berstatus PENDING dan menunggu persetujuan dari Master System.'
      };
    }
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

    setAllUsers(prev => prev.map(u => (u.uid === uid ? { ...u, status: 'rejected' } : u)));
  };

  // Shipments: Add items to database from preview staging
  const addItemsToDatabase = async (newItems: SuratJalanItem[]) => {
    // Set status to 'checking'
    const readyItems = newItems.map(item => ({
      ...item,
      status: 'checking' as const
    }));

    // Save to Firestore in background
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
        return {
          ...item,
          qtyAktual: safeQty,
          hasDiscrepancy,
          discrepancyQty
        };
      }
      return item;
    }));
  };

  const toggleItemCheck = (id: string, checked?: boolean) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isChecked: checked !== undefined ? checked : !item.isChecked };
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
      return { ...item, isChecked: checked };
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

        // Firestore sync
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
