'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, MessageSquare, CheckCircle, ChevronDown, Trash2, Video, ImageIcon, Clock, Download, Search } from 'lucide-react';
import { AdminAuthGate, useAdminAuth } from '@/components/admin-auth-gate';
import { GrievanceMediaGallery } from '@/components/grievance-media-gallery';
import { TicketBadge } from '@/components/ticket-badge';

export default function MaintenanceAdminDashboard() {
  return (
    <AdminAuthGate title="Maintenance Admin Portal">
      <MaintenanceAdminContent />
    </AdminAuthGate>
  );
}

function MaintenanceAdminContent() {
  const { isAuthenticated, adminEmail, adminDesignation, isMasterAdmin, adminPassword } = useAdminAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [remarkInputs, setRemarkInputs] = useState<{ [id: string]: string }>({});

  const fetchFeedbacks = () => {
    fetch('/api/feedback')
      .then((res) => res.json())
      .then((data) => {
        const maintenanceFb = data.filter((f: any) => f.facilityType.startsWith('MAINTENANCE_'));
        setFeedbacks(maintenanceFb);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedbacks();
    }
  }, [isAuthenticated]);

  const handleUpdateFeedback = async (id: string, newStatus: string) => {
    const remark = remarkInputs[id];
    const resolvedByRole = adminDesignation || (isMasterAdmin ? 'Master Admin' : 'Admin');
    const resolvedBy = isMasterAdmin
      ? 'Master Admin'
      : (adminDesignation ? `${adminEmail} (${adminDesignation})` : adminEmail || 'Admin');

    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
        body: JSON.stringify({
          id,
          status: newStatus,
          remark,
          resolvedBy,
          resolvedByEmail: isMasterAdmin ? 'master.admin@kgp' : adminEmail,
          resolvedByRole,
        }),
      });

      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (err) {}
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this complaint?')) return;
    try {
      const res = await fetch(`/api/feedback?id=${id}`, {
        method: 'DELETE',
        headers: {
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
      });
      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (err) {}
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (fb.ticketNumber && fb.ticketNumber.toLowerCase().includes(q)) ||
      (fb.roomNo && fb.roomNo.toLowerCase().includes(q)) ||
      (fb.studentName && fb.studentName.toLowerCase().includes(q)) ||
      (fb.comment && fb.comment.toLowerCase().includes(q)) ||
      (fb.facilityType && fb.facilityType.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Maintenance Admin Panel</span>
          </h2>
          <p className="text-xs text-gray-500">Manage Hall Infrastructure Issues</p>
        </div>
      </div>

      {/* GRIEVANCES MANAGEMENT */}
      <details className="group space-y-2" open>
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Maintenance Grievances & Remarks ({feedbacks.length})</span>
          </h3>
          <ChevronDown className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" />
        </summary>

        <div className="pt-2 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ticket #, Room No., category, or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2 text-xs shadow-sm"
            >
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                  <span className="font-bold text-gray-900 dark:text-white">{fb.studentName || 'Anonymous'}</span>
                  {fb.roomNo && (
                    <span className="text-gray-500 text-[11px] font-mono">
                      Room: {fb.roomNo}
                    </span>
                  )}
                  {fb.ticketNumber && (
                    <TicketBadge ticketNumber={fb.ticketNumber} size="sm" />
                  )}
                  <span className="text-[10px] font-mono font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {fb.facilityType.replace('MAINTENANCE_', '')}
                  </span>
                  {fb.email && <span className="text-gray-400 text-[10px] block sm:inline">{fb.email}</span>}
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    fb.status === 'RESOLVED'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {fb.status}
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                "{fb.comment}"
              </p>

              <GrievanceMediaGallery mediaUrl={fb.mediaUrl} capturedAt={fb.capturedAt} createdAt={fb.createdAt} />

              {/* Resolution Attribution */}
              {fb.status === 'RESOLVED' && (
                <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Resolved by <strong className="font-semibold">{fb.resolvedBy || fb.resolvedByRole || 'Admin'}</strong>
                    {fb.resolvedAt && ` • ${new Date(fb.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST`}
                  </span>
                </div>
              )}

              {/* Admin Remark Input */}
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Enter official Admin Remark / Resolution..."
                  value={remarkInputs[fb.id] ?? fb.remark ?? ''}
                  onChange={(e) => setRemarkInputs({ ...remarkInputs, [fb.id]: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="flex space-x-2 justify-end">
                  <button
                    onClick={() => handleDeleteFeedback(fb.id)}
                    className="px-2.5 py-1 rounded text-[11px] font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors flex items-center space-x-1 border border-rose-200 dark:border-rose-800"
                    title="Remove Complaint"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span>Remove</span>
                  </button>
                  <button
                    onClick={() => handleUpdateFeedback(fb.id, 'PENDING')}
                    className="px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Mark Pending
                  </button>
                  <button
                    onClick={() => handleUpdateFeedback(fb.id, 'RESOLVED')}
                    className="px-2.5 py-1 rounded text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Mark Resolved</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
