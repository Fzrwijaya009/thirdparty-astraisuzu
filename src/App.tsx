/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { PrintSlipModal } from './components/PrintSlipModal';

import { DashboardView } from './views/DashboardView';
import { UploadDataView } from './views/UploadDataView';
import { CheckSparepartView } from './views/CheckSparepartView';
import { CompleteProsesView } from './views/CompleteProsesView';
import { ReturnSalesView } from './views/ReturnSalesView';
import { UserApprovalView } from './views/UserApprovalView';
import { SystemSettingsView } from './views/SystemSettingsView';

function AppContent() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const { activePrintData, setActivePrintData, currentUser } = useApp();

  // Requirement 2: Pada saat awal akses TP-SYNCS langsung disajikan field Masuk atau Daftar Akun
  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar with TP-SYNCS branding */}
      <Navbar
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        onOpenAuth={() => {}}
      />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 lg:pb-8">
        {activeMenu === 'dashboard' && <DashboardView onNavigate={setActiveMenu} />}
        {activeMenu === 'upload' && <UploadDataView onNavigate={setActiveMenu} />}
        {activeMenu === 'check' && <CheckSparepartView onNavigate={setActiveMenu} />}
        {activeMenu === 'complete' && <CompleteProsesView onNavigate={setActiveMenu} />}
        {activeMenu === 'returns' && <ReturnSalesView onNavigate={setActiveMenu} />}
        {activeMenu === 'users' && <UserApprovalView />}
        {/* Requirement 4: Pengaturan System replacing Arsitektur */}
        {activeMenu === 'settings' && <SystemSettingsView />}
      </main>

      {/* Corporate Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/public/assets/aistudio/Astra_Isuzu_Logo_Vector.svg__220102f2.png"
              alt="Astra Isuzu"
              className="h-6 w-auto object-contain opacity-80"
            />
            <span>
              © {new Date().getFullYear()} PT Astra International Tbk - Isuzu. Departemen Retail & Part Services.
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="font-bold text-slate-700">TP-SYNCS</span>
            <span>•</span>
            <span>Third Party Synchronize System</span>
            <span>•</span>
            <span>Plant I300 Sunter</span>
          </div>
        </div>
      </footer>

      {/* Printable Berita Acara Modal */}
      <PrintSlipModal
        isOpen={!!activePrintData}
        onClose={() => setActivePrintData(null)}
        data={activePrintData}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
