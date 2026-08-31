'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, MessageSquare, CheckCircle, ChevronDown, Trash2, Clock, Search, Flame, AlertCircle, Check, RotateCcw, AlertTriangle, ShieldAlert, ArrowUpRight } from 'lucide-react';
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
  const { isAuthenticated, adminEmail, adminDesignation, isMasterAdmin, adminPassword, canOverride } = useAdminAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [remarkInputs, setRemarkInputs] = useState<{ [id: string]: string }>({});
  const [escalateRemarkInputs, setEscalateRemarkInputs] = useState<{ [id: string]: string }>({});
  const [activeEscalateId, setActiveEscalateId] = useState<string | null>(null);

  const fetchFeedbacks = () => {
    fetch('/api/feedback?facility=MAINTENANCE', {
      headers: {
        ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFeedbacks(Array.isArray(data) ? data : []);
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
    const resolvedByRole = adminDesignation || (isMasterAdmin ? 'System Admin' : 'Admin');
    const resolvedBy = isMasterAdmin
      ? 'System Admin'
      : (adminDesignation ? `${adminEmail} (${adminDesignation})` : adminEmail || 'Admin');

    const updatePayload: any = {
      id,
      status: newStatus,
      remark,
      resolvedBy,
      resolvedByEmail: isMasterAdmin ? 'admin@kgp' : adminEmail,
      resolvedByRole,
      adminResolved: newStatus === 'RESOLVED',
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (err) {}
  };

  const handleToggleEscalate = async (fb: any) => {
    const willEscalate = !fb.isEscalated;
    const remark = escalateRemarkInputs[fb.id] || '';

    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
        body: JSON.stringify({
          id: fb.id,
          isEscalated: willEscalate,
          escalatedBy: willEscalate ? (isMasterAdmin ? 'System Admin' : adminEmail) : null,
          escalatedRemark: willEscalate ? remark : null,
        }),
      });

      if (res.ok) {
        setActiveEscalateId(null);
        fetchFeedbacks();
      }
    } catch (err) {}
  };

  const handleOverrideUserResolution = async (fb: any) => {
    if (!canOverride && !isMasterAdmin) {
      alert('You do not have delegated permissions to override student resolution status.');
      return;
    }

    const currentStatus = Boolean(fb.userResolved);
    const targetStatus = !currentStatus;
    const reason = prompt(`Reason for overriding student resolution status to ${targetStatus ? 'RESOLVED' : 'UNRESOLVED'}:`);
    if (reason === null) return;

    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
        body: JSON.stringify({
          id: fb.id,
          userResolved: targetStatus,
          status: targetStatus && fb.adminResolved ? 'RESOLVED' : (targetStatus ? 'RESOLVED' : (fb.adminResolved ? 'RESOLVED' : 'PENDING')),
          overriddenBy: isMasterAdmin ? 'System Admin' : adminEmail,
          overriddenReason: reason.trim() || 'Admin Discretion',
        }),
      });

      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (err) {}
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this grievance record?')) return;
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Maintenance Admin Portal</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage Hall Infrastructure Issues & Escalations</p>
        </div>
      </div>

      {/* GRIEVANCES MANAGEMENT */}
      <details className="group space-y-2" open>
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-sky-600" />
            <span>Maintenance Grievances ({feedbacks.length})</span>
          </h3>
          <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
        </summary>

        <div className="pt-2 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ticket #, Room No., category, or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {filteredFeedbacks.map((fb) => {
            const isEscalated = Boolean(fb.isEscalated);
            const isTwoWay = fb.adminResolved && fb.userResolved;

            return (
              <div
                key={fb.id}
                className={`p-4 rounded-2xl space-y-3 text-xs shadow-sm border transition-all ${
                  isEscalated
                    ? 'border-amber-400/80 dark:border-amber-500/80 bg-amber-50/20 dark:bg-amber-950/25 ring-1 ring-amber-400/30'
                    : isTwoWay
                      ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/15 dark:bg-emerald-950/15'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Escalation Highlight Banner */}
                {isEscalated && (
                  <div className="p-2.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2 min-w-0">
                      <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-[11px] leading-tight">
                        <span className="font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 mr-1.5">
                          ⚡ Priority Escalated:
                        </span>
                        <span>Escalated by <strong className="font-semibold font-mono">{fb.escalatedBy || 'Admin'}</strong></span>
                        {fb.escalatedAt && (
                          <span className="text-amber-600/80 dark:text-amber-400/80 ml-1">
                            • {new Date(fb.escalatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST
                          </span>
                        )}
                        {fb.escalatedRemark && (
                          <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium italic mt-0.5">
                            "{fb.escalatedRemark}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Info Row */}
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                    {fb.ticketNumber && <TicketBadge ticketNumber={fb.ticketNumber} size="sm" />}
                    <span className="font-bold text-slate-900 dark:text-white">{fb.studentName || 'Anonymous'}</span>
                    {fb.roomNo && (
                      <span className="text-slate-500 text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {fb.roomNo}
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                      {fb.facilityType.replace('MAINTENANCE_', '')}
                    </span>
                    {fb.email && <span className="text-slate-400 text-[10px] font-mono truncate max-w-[140px] sm:max-w-none">{fb.email}</span>}
                  </div>

                  {/* Two-Way Verifiable Badges */}
                  <div className="flex items-center space-x-1.5">
                    {isTwoWay ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center space-x-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <Check className="w-3 h-3 text-emerald-600 -ml-2" />
                        <span>Two-Way Verified</span>
                      </span>
                    ) : fb.status === 'RESOLVED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Resolved (Admin Only)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 leading-relaxed font-normal">
                  "{fb.comment}"
                </p>

                <GrievanceMediaGallery mediaUrl={fb.mediaUrl} capturedAt={fb.capturedAt} createdAt={fb.createdAt} />

                {/* Resolution & Private Override Audit Trail (Visible ONLY to Admins) */}
                <div className="space-y-1">
                  {fb.status === 'RESOLVED' && (
                    <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Resolved by <strong className="font-semibold">{fb.resolvedBy || fb.resolvedByRole || 'Admin'}</strong>
                        {fb.resolvedAt && ` • ${new Date(fb.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST`}
                      </span>
                    </div>
                  )}

                  {/* Private Audit Info on User Override */}
                  {fb.overriddenBy && (
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-800">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>
                        [Private Admin Audit] User resolution overridden by <strong>{fb.overriddenBy}</strong>: "{fb.overriddenReason || 'Overridden'}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Admin Remark Input */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <input
                    type="text"
                    placeholder="Enter official Admin Remark / Resolution..."
                    value={remarkInputs[fb.id] ?? fb.remark ?? ''}
                    onChange={(e) => setRemarkInputs({ ...remarkInputs, [fb.id]: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />

                  {/* Optional Escalation Remark Drawer */}
                  {activeEscalateId === fb.id && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 animate-in fade-in duration-150">
                      <input
                        type="text"
                        placeholder="Reason for escalation (optional)..."
                        value={escalateRemarkInputs[fb.id] || ''}
                        onChange={(e) => setEscalateRemarkInputs({ ...escalateRemarkInputs, [fb.id]: e.target.value })}
                        className="w-full px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-1.5">
                        <button
                          onClick={() => setActiveEscalateId(null)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleToggleEscalate(fb)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                        >
                          Confirm Escalation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clean Uncluttered Button Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="flex items-center space-x-1.5">
                      {/* Escalate Toggle Button */}
                      <button
                        onClick={() => {
                          if (isEscalated) {
                            handleToggleEscalate(fb);
                          } else {
                            setActiveEscalateId(activeEscalateId === fb.id ? null : fb.id);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 touch-spring ${
                          isEscalated
                            ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                        title={isEscalated ? 'De-escalate this grievance' : 'Escalate to top priority'}
                      >
                        <Flame className={`w-3.5 h-3.5 ${isEscalated ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
                        <span>{isEscalated ? 'De-escalate' : 'Escalate'}</span>
                      </button>

                      {/* Override User Resolution (Authorized admins) */}
                      {(canOverride || isMasterAdmin) && (
                        <button
                          onClick={() => handleOverrideUserResolution(fb)}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors touch-spring"
                          title="Override Boarder Resolution Status"
                        >
                          <span>{fb.userResolved ? 'Revoke Boarder Status' : 'Override Boarder Status'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleDeleteFeedback(fb.id)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors border border-rose-200 dark:border-rose-800 touch-spring"
                        title="Remove Complaint"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                      <button
                        onClick={() => handleUpdateFeedback(fb.id, 'PENDING')}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors touch-spring"
                      >
                        Mark Pending
                      </button>
                      <button
                        onClick={() => handleUpdateFeedback(fb.id, 'RESOLVED')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-sm shadow-sky-500/20 flex items-center space-x-1 touch-spring"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
