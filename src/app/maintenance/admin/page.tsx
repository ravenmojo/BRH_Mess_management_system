'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, MessageSquare, CheckCircle, ChevronDown, Trash2, Video, ImageIcon, Clock, Download } from 'lucide-react';
import { AdminAuthGate } from '@/components/admin-auth-gate';

export default function MaintenanceAdminDashboard() {
  return (
    <AdminAuthGate title="Maintenance Admin Portal">
      <MaintenanceAdminContent />
    </AdminAuthGate>
  );
}

function MaintenanceAdminContent() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
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
    fetchFeedbacks();
  }, []);

  const handleUpdateFeedback = async (id: string, newStatus: string) => {
    const remark = remarkInputs[id];
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, remark }),
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
      });
      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (err) {}
  };

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
      <details className="group space-y-2">
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Maintenance Grievances & Remarks ({feedbacks.length})</span>
          </h3>
          <ChevronDown className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" />
        </summary>

        <div className="pt-2 space-y-3">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2 text-xs shadow-sm"
            >
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div>
                  <span className="font-bold text-gray-900 dark:text-white">{fb.studentName || 'Anonymous'}</span>
                  <span className="text-gray-500 text-[11px] ml-1.5 font-mono">
                    {fb.roomNo ? `Room: ${fb.roomNo}` : fb.hallRoll ? `(${fb.hallRoll})` : ''}
                  </span>
                  <span className="ml-2 text-[10px] font-mono font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {fb.facilityType.replace('MAINTENANCE_', '')}
                  </span>
                  {fb.email && <span className="text-gray-400 text-[10px] ml-2 block sm:inline">{fb.email}</span>}
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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

              {fb.mediaUrl && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 text-[10px]">
                  <div className="flex items-center space-x-2">
                    <a href={fb.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      {fb.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      <span>View Media</span>
                    </a>
                    <a
                      href={fb.mediaUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-200/70 dark:bg-slate-700/70 px-2 py-0.5 rounded-md transition-colors"
                      title="Download Media File"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                  <span className="text-gray-500 font-mono text-[9.5px]">
                    Captured: {fb.capturedAt || new Date(fb.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
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
