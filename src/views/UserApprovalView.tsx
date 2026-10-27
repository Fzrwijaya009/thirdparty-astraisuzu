/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Check, 
  X, 
  ShieldCheck, 
  Clock, 
  Search, 
  Building, 
  Mail, 
  ShieldAlert,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { exportToExcel } from '../utils/excel';

export const UserApprovalView: React.FC = () => {
  const { allUsers, approveUser, rejectUser, deleteUser, currentUser } = useApp();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isMaster = currentUser?.role === 'master';

  const filteredUsers = allUsers.filter(u => {
    if (filterStatus === 'pending' && u.status !== 'pending') return false;
    if (filterStatus === 'approved' && u.status !== 'approved') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.displayName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchCust = u.customerName.toLowerCase().includes(q);
      const matchRole = u.role.toLowerCase().includes(q);
      return matchName || matchEmail || matchCust || matchRole;
    }
    return true;
  });

  const pendingCount = allUsers.filter(u => u.status === 'pending').length;

  const handleExport = () => {
    const rows = filteredUsers.map((u, idx) => ({
      'No': idx + 1,
      'Nama Pengguna': u.displayName,
      'Email': u.email,
      'Role Otorisasi': u.role === 'master' ? 'Master System' : u.role === 'owner' ? 'Owner' : 'Admin',
      'Nama Customer / Cabang': u.customerName,
      'Status': u.status,
      'Tanggal Registrasi': u.createdAt,
      'Disetujui Oleh': u.approvedBy || '-',
      'Tanggal Approval': u.approvedAt || '-'
    }));
    exportToExcel(rows, 'Astra_Isuzu_Daftar_Pengguna');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-800">
              Otoritas Khusus Master System
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingCount} Akun Menunggu Approval
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Approval & Manajemen Akun Pengguna
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verifikasi pendaftaran pengguna baru, penetapan hak akses, dan pengelolaan entitas customer Astra Isuzu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download to Excel
          </button>
        </div>
      </div>

      {!isMaster && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-purple-600 shrink-0" />
          <div>
            <h3 className="font-bold text-purple-900 text-sm">Hak Akses Terbatas</h3>
            <p className="text-xs text-purple-700 mt-0.5">
              Halaman approval akun pengguna baru hanya dapat dikelola oleh otorisasi <strong>Master System</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Semua ({allUsers.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              Approved
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, email, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Users Table for Desktop / Tablet */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Nama Pengguna</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Otorisasi (Role)</th>
                <th className="py-3 px-3">Nama Customer (Free Text)</th>
                <th className="py-3 px-3">Tgl Daftar</th>
                <th className="py-3 px-3 text-center">Status Akun</th>
                <th className="py-3 px-3 text-center">Aksi Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ada akun dalam daftar ini.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {u.displayName}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 font-mono whitespace-nowrap">
                      {u.email}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {u.role === 'master' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          Master System
                        </span>
                      )}
                      {u.role === 'owner' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Owner
                        </span>
                      )}
                      {u.role === 'admin' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          Admin
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs truncate" title={u.customerName}>
                      {u.customerName}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('id-ID')}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {u.status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          Pending Approval
                        </span>
                      )}
                      {u.status === 'approved' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Approved
                        </span>
                      )}
                      {u.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                          Rejected
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {u.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveUser(u.uid)}
                              disabled={!isMaster}
                              title="Setujui Akun (Approve)"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-40"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => rejectUser(u.uid)}
                              disabled={!isMaster}
                              title="Tolak Akun"
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition disabled:opacity-40"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {isMaster && u.email.toLowerCase() !== 'fajrisani12@gmail.com' && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Hapus akun ${u.displayName} (${u.email})? Pengguna yang dihapus harus mendaftar ulang untuk dapat mengakses sistem.`)) {
                                const res = await deleteUser(u.uid);
                                if (res.message) alert(res.message);
                              }
                            }}
                            title="Hapus Akun Pengguna"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {u.status !== 'pending' && (!isMaster || u.email.toLowerCase() === 'fajrisani12@gmail.com') && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {u.approvedBy ? `by ${u.approvedBy}` : '-'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Users Card View for Mobile Handphones */}
        <div className="md:hidden divide-y divide-slate-200">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Tidak ada akun dalam daftar ini.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.uid} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{u.displayName}</h3>
                    <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                  </div>
                  {u.status === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                      Pending
                    </span>
                  )}
                  {u.status === 'approved' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Approved
                    </span>
                  )}
                  {u.status === 'rejected' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                      Rejected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Otorisasi</span>
                    <span className="font-bold text-slate-800">
                      {u.role === 'master' ? 'Master System' : u.role === 'owner' ? 'Owner' : 'Admin'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Tgl Daftar</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(u.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-medium">Nama Customer</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {u.customerName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {u.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveUser(u.uid)}
                        disabled={!isMaster}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-4 h-4" /> Setujui Akun
                      </button>
                      <button
                        onClick={() => rejectUser(u.uid)}
                        disabled={!isMaster}
                        className="px-3 py-2 text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center"
                      >
                        <X className="w-4 h-4" /> Tolak
                      </button>
                    </>
                  )}

                  {isMaster && u.email.toLowerCase() !== 'fajrisani12@gmail.com' && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`Hapus akun ${u.displayName} (${u.email})? Pengguna yang dihapus harus mendaftar ulang untuk dapat mengakses sistem.`)) {
                          const res = await deleteUser(u.uid);
                          if (res.message) alert(res.message);
                        }
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
