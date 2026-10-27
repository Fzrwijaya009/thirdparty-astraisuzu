/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  CheckSquare, 
  PackageCheck, 
  AlertOctagon, 
  Users, 
  Settings, 
  LogOut, 
  LogIn, 
  UserPlus, 
  ChevronDown, 
  Building,
  Menu,
  X
} from 'lucide-react';
import { AstraIsuzuLogo } from './AstraIsuzuLogo';

interface NavbarProps {
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeMenu, onSelectMenu, onOpenAuth }) => {
  const { currentUser, logout, claims, allUsers } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const pendingClaimsCount = claims.filter(c => c.status === 'opened' || c.status === 'inprogress').length;
  const pendingUsersCount = allUsers.filter(u => u.status === 'pending').length;

  // Requirement 1 & 4: Menu Navigation
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'upload', 
      label: 'Upload Surat Jalan', 
      icon: UploadCloud, 
      ownerOnly: true 
    },
    { id: 'check', label: 'Check Sparepart', icon: CheckSquare },
    { id: 'complete', label: 'Complete Proses', icon: PackageCheck },
    { id: 'returns', label: 'Return Sales', icon: AlertOctagon, count: pendingClaimsCount },
    { id: 'users', label: 'Approval Akun', icon: Users, count: pendingUsersCount, masterOnly: true },
    { 
      id: 'settings', 
      label: 'Pengaturan System', 
      icon: Settings, 
      ownerOrMasterOnly: true 
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs no-print">
      {/* Top Corporate Strip with Astra Blue & Isuzu Red Accent */}
      <div className="h-1.5 w-full bg-linear-to-r from-[#005BAC] via-[#005BAC] to-[#ED1B24]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Corporate Tagline - Requirement 1: TP-SYNCS with Third Party Synchronize System */}
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer" onClick={() => onSelectMenu('dashboard')}>
            <AstraIsuzuLogo className="h-8 sm:h-11 w-auto object-contain shrink-0" />
            <div className="border-l pl-2 sm:pl-3.5 border-slate-200">
              <span className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 block leading-none">
                TP-SYNCS
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#005BAC] tracking-wide uppercase block mt-0.5 sm:mt-1 truncate max-w-[160px] sm:max-w-none">
                Third Party Synchronize System
              </span>
            </div>
          </div>

          {/* User Account Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="font-bold text-slate-800 truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[130px]">
                          {currentUser.displayName}
                        </span>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                          currentUser.role === 'master'
                            ? 'bg-purple-100 text-purple-800'
                            : currentUser.role === 'owner'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {currentUser.role === 'master' ? 'Master' : currentUser.role === 'owner' ? 'Owner' : 'Admin'}
                        </span>
                      </div>
                      <span className="hidden sm:block text-[10px] text-slate-500 truncate max-w-[180px]">
                        {currentUser.customerName}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                  </button>

                  {roleDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                      <div className="px-3 py-1.5 border-b border-slate-100">
                        <div className="font-bold text-slate-900">{currentUser.displayName}</div>
                        <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                        <div className="mt-1 text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          <span className="truncate">{currentUser.customerName}</span>
                        </div>
                      </div>

                      <div className="p-2 text-[11px] text-slate-600 bg-slate-50 mx-2 my-1 rounded-lg">
                        <strong>Otorisasi: </strong>
                        {currentUser.role === 'master' && 'Master System (Full Akses & Approval Akun)'}
                        {currentUser.role === 'owner' && 'Owner (Upload Surat Jalan & Approval Klaim)'}
                        {currentUser.role === 'admin' && 'Admin (Pemeriksaan Part Perusahaan Anda)'}
                      </div>

                      <button
                        onClick={() => {
                          logout();
                          setRoleDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 transition text-xs font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar Akun (Logout)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-1 border border-slate-200"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden xs:inline">Masuk</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#00488a] rounded-xl shadow-xs transition flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger with badge indicator */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition relative"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {(pendingClaimsCount > 0 || pendingUsersCount > 0) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 border-t border-slate-100 py-1.5">
          {navItems.map((item) => {
            // Upload Surat Jalan hanya akun Owner/Master
            if (item.ownerOnly && currentUser?.role !== 'owner' && currentUser?.role !== 'master') {
              return null;
            }
            // Approval Akun hanya Master System
            if (item.masterOnly && currentUser?.role !== 'master') {
              return null;
            }
            // Pengaturan System hanya Master & Owner
            if (item.ownerOrMasterOnly && currentUser?.role !== 'master' && currentUser?.role !== 'owner') {
              return null;
            }

            const Icon = item.icon;
            const isActive = activeMenu === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectMenu(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#005BAC] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>

                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-blue-900' : 'bg-red-500 text-white'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 space-y-1">
            {navItems.map((item) => {
              if (item.ownerOnly && currentUser?.role !== 'owner' && currentUser?.role !== 'master') {
                return null;
              }
              if (item.masterOnly && currentUser?.role !== 'master') {
                return null;
              }
              if (item.ownerOrMasterOnly && currentUser?.role !== 'master' && currentUser?.role !== 'owner') {
                return null;
              }

              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectMenu(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#005BAC] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Bottom Quick Dock for Handphone view */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 py-1.5 px-1 flex items-center justify-around shadow-lg no-print">
        <button
          onClick={() => onSelectMenu('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeMenu === 'dashboard' ? 'text-[#005BAC] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        {(currentUser?.role === 'owner' || currentUser?.role === 'master') && (
          <button
            onClick={() => onSelectMenu('upload')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
              activeMenu === 'upload' ? 'text-[#005BAC] font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <UploadCloud className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Upload</span>
          </button>
        )}

        <button
          onClick={() => onSelectMenu('check')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeMenu === 'check' ? 'text-[#005BAC] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Check Part</span>
        </button>

        <button
          onClick={() => onSelectMenu('complete')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeMenu === 'complete' ? 'text-[#005BAC] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <PackageCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Complete</span>
        </button>

        <button
          onClick={() => onSelectMenu('returns')}
          className={`relative flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeMenu === 'returns' ? 'text-[#ED1B24] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <AlertOctagon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Return</span>
          {pendingClaimsCount > 0 && (
            <span className="absolute top-0 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-red-600 text-white">
              {pendingClaimsCount}
            </span>
          )}
        </button>

        {currentUser?.role === 'master' && (
          <button
            onClick={() => onSelectMenu('users')}
            className={`relative flex flex-col items-center py-1 px-2 rounded-lg transition ${
              activeMenu === 'users' ? 'text-purple-700 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Approval</span>
            {pendingUsersCount > 0 && (
              <span className="absolute top-0 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white animate-pulse">
                {pendingUsersCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
