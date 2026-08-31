'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MessageSquare,
  CheckCircle,
  ChevronDown,
  Trash2,
  Clock,
  Search,
  Flame,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { AdminAuthGate, useAdminAuth, getAdminHeaders } from '@/components/admin-auth-gate';
import { GrievanceMediaGallery } from '@/components/grievance-media-gallery';
import { TicketBadge } from '@/components/ticket-badge';
import { formatResolvedByAttribution } from '@/lib/admin-display';
import { RemarkHistoryModal } from '@/components/remark-history-modal';
import { History, Loader2, Save } from 'lucide-react';

export default function CanteenAdminDashboard() {
  return (
    <AdminAuthGate title="Night Canteen Admin Portal">
      <CanteenAdminContent />
    </AdminAuthGate>
  );
}

type GrievanceTab = 'ESCALATED' | 'PENDING' | 'RESOLVED' | 'ALL';

function CanteenAdminContent() {
  const { isAuthenticated, adminEmail, adminDesignation, isMasterAdmin, adminToken } = useAdminAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<GrievanceTab>('ESCALATED');
  const [tabManuallySet, setTabManuallySet] = useState(false);
  const [remarkInputs, setRemarkInputs] = useState<{ [id: string]: string }>({});
  const [savingRemarkId, setSavingRemarkId] = useState<string | null>(null);
  const [selectedHistoryFb, setSelectedHistoryFb] = useState<any | null>(null);
  const [escalateRemarkInputs, setEscalateRemarkInputs] = useState<{ [id: string]: string }>({});
  const [activeEscalateId, setActiveEscalateId] = useState<string | null>(null);

  const authHeaders = getAdminHeaders(adminEmail, adminToken);

  useEffect(() => {
    if (!tabManuallySet && feedbacks.length > 0) {
      const escCount = feedbacks.filter((fb) => fb.isEscalated).length;
      if (escCount === 0) {
        setActiveTab('PENDING');
      } else {
        setActiveTab('ESCALATED');
      }
    }
  }, [feedbacks, tabManuallySet]);

  const fetchFeedbacks = () => {
    fetch('/api/feedback?facility=NIGHT_CANTEEN&isAdmin=true', {
      headers: {
        ...authHeaders,
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
    const isResolving = newStatus === 'RESOLVED';
    const isPending = newStatus === 'PENDING';
    const resolvedByRole = adminDesignation || (isMasterAdmin ? 'System Administrator' : 'Administrator');
    const resolvedBy = adminDesignation || (isMasterAdmin ? 'System Administrator' : adminEmail || 'Administrator');
    const now = new Date().toISOString();

    // ⚡ Instant Optimistic Update
    setFeedbacks((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              remark: isResolving ? (remark !== undefined && remark !== '' ? remark : item.remark) : item.remark,
              resolvedBy: isResolving ? resolvedBy : (isPending ? null : item.resolvedBy),
              resolvedByEmail: isResolving ? (isMasterAdmin ? 'admin@kgp' : adminEmail) : (isPending ? null : item.resolvedByEmail),
              resolvedByRole: isResolving ? resolvedByRole : (isPending ? null : item.resolvedByRole),
              resolvedAt: isResolving ? now : (isPending ? null : item.resolvedAt),
              adminResolved: isResolving ? true : (isPending ? false : item.adminResolved),
              userResolved: isPending ? false : item.userResolved,
            }
          : item
      )
    );

    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          id,
          status: newStatus,
          remark: isResolving ? remark : undefined,
          resolvedBy: isResolving ? resolvedBy : (isPending ? null : undefined),
          resolvedByEmail: isResolving ? (isMasterAdmin ? 'admin@kgp' : adminEmail) : (isPending ? null : undefined),
          resolvedByRole: isResolving ? resolvedByRole : (isPending ? null : undefined),
          adminResolved: isResolving ? true : (isPending ? false : undefined),
          userResolved: isPending ? false : undefined,
        }),
      });

      if (!res.ok) {
        fetchFeedbacks(); // Revert on failure
      }
    } catch (err) {
      fetchFeedbacks();
    }
  };

  // Save remark independently without changing grievance status
  const handleSaveRemarkOnly = async (id: string) => {
    const remark = remarkInputs[id];
    if (remark === undefined || remark.trim() === '') return;
    setSavingRemarkId(id);

    const resolvedByRole = adminDesignation || (isMasterAdmin ? 'System Administrator' : 'Administrator');
    const resolvedBy = adminDesignation || (isMasterAdmin ? 'System Administrator' : adminEmail || 'Administrator');

    // ⚡ Instant Optimistic Update with updated history
    setFeedbacks((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let prevHistory: any[] = [];
        try {
          if (Array.isArray(item.remarkHistory)) prevHistory = item.remarkHistory;
          else if (typeof item.remarkHistory === 'string') prevHistory = JSON.parse(item.remarkHistory);
        } catch (e) {}

        const newEntry = {
          remark: remark.trim(),
          author: resolvedBy,
          authorRole: resolvedByRole,
          createdAt: new Date().toISOString(),
        };
        const updatedHistory = [newEntry, ...prevHistory];

        return {
          ...item,
          remark: remark.trim(),
          remarkHistory: JSON.stringify(updatedHistory),
        };
      })
    );

    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          id,
          remark: remark.trim(),
          resolvedBy,
          resolvedByEmail: isMasterAdmin ? 'admin@kgp' : adminEmail,
          resolvedByRole,
        }),
      });

      if (!res.ok) {
        fetchFeedbacks();
      }
    } catch (e) {
      fetchFeedbacks();
    } finally {
      setSavingRemarkId(null);
    }
  };

  const handleToggleEscalate = async (fb: any) => {
    const willEscalate = !fb.isEscalated;
    const remark = escalateRemarkInputs[fb.id] || '';
    const now = new Date().toISOString();
    const escalatedBy = isMasterAdmin ? 'System Administrator' : (adminDesignation || adminEmail || 'Administrator');

    // ⚡ Instant Optimistic Update
    setFeedbacks((prev) =>
      prev.map((item) =>
        item.id === fb.id
          ? {
              ...item,
              isEscalated: willEscalate,
              escalatedBy: willEscalate ? escalatedBy : null,
              escalatedRemark: willEscalate ? remark : null,
              escalatedAt: willEscalate ? now : null,
            }
          : item
      )
    );
    setActiveEscalateId(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          id: fb.id,
          isEscalated: willEscalate,
          escalatedBy: willEscalate ? escalatedBy : null,
          escalatedRemark: willEscalate ? remark : null,
        }),
      });

      if (!res.ok) {
        fetchFeedbacks(); // Revert on failure
      }
    } catch (err) {
      fetchFeedbacks();
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this complaint?')) return;
    
    // ⚡ Instant Optimistic Update
    setFeedbacks((prev) => prev.filter((item) => item.id !== id));

    try {
      const res = await fetch(`/api/feedback?id=${id}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders,
        },
      });
      if (!res.ok) {
        fetchFeedbacks();
      }
    } catch (err) {
      fetchFeedbacks();
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (fb.ticketNumber && fb.ticketNumber.toLowerCase().includes(q)) ||
      (fb.roomNo && fb.roomNo.toLowerCase().includes(q)) ||
      (fb.studentName && fb.studentName.toLowerCase().includes(q)) ||
      (fb.comment && fb.comment.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Canteen Admin Portal</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage Night Canteen Issues & Escalations</p>
        </div>
      </div>

      {/* GRIEVANCES & COMPLAINTS MANAGEMENT */}
      <details className="group space-y-2" open>
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Night Canteen Grievances ({feedbacks.length})</span>
          </h3>
          <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="pt-2 space-y-3">
          {/* 4 Category Tabs: Escalated, Pending, Resolved, All */}
          <div className="w-full grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ESCALATED');
                setTabManuallySet(true);
              }}
              className={`w-full py-1.5 px-0.5 rounded-xl transition-all flex flex-col items-center justify-center touch-spring ${
                activeTab === 'ESCALATED'
                  ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs ring-1 ring-red-500/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Flame className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'ESCALATED' ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
                <span className={`text-[11px] font-mono font-black ${activeTab === 'ESCALATED' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {feedbacks.filter((fb) => fb.isEscalated).length}
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                Escalated
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('PENDING');
                setTabManuallySet(true);
              }}
              className={`w-full py-1.5 px-0.5 rounded-xl transition-all flex flex-col items-center justify-center touch-spring ${
                activeTab === 'PENDING'
                  ? 'bg-white dark:bg-slate-900 text-yellow-700 dark:text-yellow-400 shadow-xs ring-1 ring-yellow-400/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Clock className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'PENDING' ? 'text-yellow-500' : 'text-slate-400'}`} />
                <span className={`text-[11px] font-mono font-black ${activeTab === 'PENDING' ? 'text-yellow-700 dark:text-yellow-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {feedbacks.filter((fb) => fb.status !== 'RESOLVED').length}
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                Pending
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('RESOLVED');
                setTabManuallySet(true);
              }}
              className={`w-full py-1.5 px-0.5 rounded-xl transition-all flex flex-col items-center justify-center touch-spring ${
                activeTab === 'RESOLVED'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-400/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'RESOLVED' ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className={`text-[11px] font-mono font-black ${activeTab === 'RESOLVED' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {feedbacks.filter((fb) => fb.status === 'RESOLVED').length}
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                Resolved
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ALL');
                setTabManuallySet(true);
              }}
              className={`w-full py-1.5 px-0.5 rounded-xl transition-all flex flex-col items-center justify-center touch-spring ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-400/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Layers className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'ALL' ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className={`text-[11px] font-mono font-black ${activeTab === 'ALL' ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {feedbacks.length}
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                All
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ticket #, Room No., name, or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Grievance Scroll Box with natural parent scroll-chaining */}
          <div className="max-h-[580px] sm:max-h-[640px] grievance-scroll-box pr-1 sm:pr-1.5 space-y-3">
            {(() => {
              const tabFiltered = feedbacks.filter((fb) => {
                if (activeTab === 'ESCALATED') return fb.isEscalated;
                if (activeTab === 'PENDING') return fb.status !== 'RESOLVED';
                if (activeTab === 'RESOLVED') return fb.status === 'RESOLVED';
                return true;
              });

              const searchFiltered = tabFiltered.filter((fb) => {
                if (!searchTerm.trim()) return true;
                const q = searchTerm.toLowerCase();
                return (
                  (fb.ticketNumber && fb.ticketNumber.toLowerCase().includes(q)) ||
                  (fb.roomNo && fb.roomNo.toLowerCase().includes(q)) ||
                  (fb.studentName && fb.studentName.toLowerCase().includes(q)) ||
                  (fb.comment && fb.comment.toLowerCase().includes(q)) ||
                  (fb.remark && fb.remark.toLowerCase().includes(q))
                );
              });

              if (searchFiltered.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p className="font-bold">No grievances found in {activeTab.toLowerCase()}</p>
                    <p className="text-[11px] text-slate-400">Try selecting another category tab or clearing your search.</p>
                  </div>
                );
              }

              return searchFiltered.map((fb) => {
                const isEscalated = Boolean(fb.isEscalated);

                return (
                  <div
                    key={fb.id}
                    className={`p-4 rounded-2xl space-y-3 text-xs shadow-sm border transition-all ${
                      isEscalated
                        ? 'border-red-400/90 dark:border-red-500/90 bg-red-50/20 dark:bg-red-950/25 ring-1 ring-red-500/30'
                        : fb.status === 'RESOLVED'
                          ? 'border-emerald-200/80 dark:border-emerald-800/60 bg-white dark:bg-slate-900'
                          : 'bg-white dark:bg-slate-900 border-yellow-200 dark:border-yellow-900/60'
                    }`}
                  >
                    {/* Escalation Highlight Banner */}
                    {isEscalated && (
                      <div className="p-2.5 rounded-xl bg-red-100/90 dark:bg-red-950/70 border border-red-300 dark:border-red-700 text-red-900 dark:text-red-200 flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2 min-w-0">
                          <Flame className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5 animate-pulse" />
                          <div className="text-[11px] leading-tight">
                            <span className="font-black uppercase tracking-wider text-red-700 dark:text-red-400 mr-1.5">
                              ⚡ Priority Escalated:
                            </span>
                            <span>Escalated by <strong className="font-semibold font-mono">{fb.escalatedBy || 'Admin'}</strong></span>
                            {fb.escalatedAt && (
                              <span className="text-red-600/80 dark:text-red-400/80 ml-1">
                                • {new Date(fb.escalatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST
                              </span>
                            )}
                            {fb.escalatedRemark && (
                              <div className="text-[11px] text-red-800 dark:text-red-300 font-medium italic mt-0.5">
                                "{fb.escalatedRemark}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        {fb.ticketNumber && <TicketBadge ticketNumber={fb.ticketNumber} size="sm" />}
                        <span className="font-bold text-slate-900 dark:text-white">{fb.studentName || 'Anonymous'}</span>
                        {fb.roomNo && (
                          <span className="text-slate-500 text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {fb.roomNo}
                          </span>
                        )}
                        {fb.email && <span className="text-slate-400 text-[10px] font-mono truncate max-w-[140px] sm:max-w-none">{fb.email}</span>}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          fb.status === 'RESOLVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                            : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/80'
                        }`}
                      >
                        {fb.status}
                      </span>
                    </div>

                    <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 leading-relaxed font-normal">
                      "{fb.comment}"
                    </p>

                    <GrievanceMediaGallery mediaUrl={fb.mediaUrl} capturedAt={fb.capturedAt} createdAt={fb.createdAt} />

                    {/* Resolution Attribution */}
                    {fb.status === 'RESOLVED' && (
                      <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Resolved by <strong className="font-semibold">{formatResolvedByAttribution(fb.resolvedByRole, fb.resolvedBy, fb.resolvedByEmail)}</strong>
                          {fb.resolvedAt && ` • ${new Date(fb.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST`}
                        </span>
                      </div>
                    )}

                    {/* Admin Remark Input with Update Option and History Trigger */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <span>Admin Remark:</span>
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryFb(fb)}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-[10.5px] font-semibold touch-spring"
                          title="View chronological remark update history"
                        >
                          <History className="w-3 h-3 text-indigo-500" />
                          <span>
                            History{' '}
                            {(() => {
                              try {
                                if (Array.isArray(fb.remarkHistory)) return `(${fb.remarkHistory.length})`;
                                if (typeof fb.remarkHistory === 'string' && fb.remarkHistory.trim()) {
                                  const parsed = JSON.parse(fb.remarkHistory);
                                  if (Array.isArray(parsed) && parsed.length > 0) return `(${parsed.length})`;
                                }
                              } catch (e) {}
                              return fb.remark ? '(1)' : '(0)';
                            })()}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          placeholder="Enter official Admin Remark / Action Taken..."
                          value={remarkInputs[fb.id] ?? fb.remark ?? ''}
                          onChange={(e) => setRemarkInputs({ ...remarkInputs, [fb.id]: e.target.value })}
                          className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRemarkOnly(fb.id)}
                          disabled={savingRemarkId === fb.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-1 touch-spring shrink-0"
                          title="Save Remark without altering grievance status"
                        >
                          {savingRemarkId === fb.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          ) : (
                            <Save className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          <span>Save</span>
                        </button>
                      </div>

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
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
                            >
                              Confirm Escalation
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
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
                              ? 'bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                          title={isEscalated ? 'De-escalate this grievance' : 'Escalate to top priority'}
                        >
                          <Flame className={`w-3.5 h-3.5 ${isEscalated ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
                          <span>{isEscalated ? 'De-escalate' : 'Escalate'}</span>
                        </button>

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
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/50 dark:hover:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 transition-colors touch-spring"
                          >
                            Mark Pending
                          </button>
                          <button
                            onClick={() => handleUpdateFeedback(fb.id, 'RESOLVED')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm shadow-indigo-500/20 flex items-center space-x-1 touch-spring"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </details>

      {/* Administrative Remark Update History Modal */}
      {selectedHistoryFb && (
        <RemarkHistoryModal
          isOpen={Boolean(selectedHistoryFb)}
          onClose={() => setSelectedHistoryFb(null)}
          ticketNumber={selectedHistoryFb.ticketNumber}
          studentName={selectedHistoryFb.studentName}
          currentRemark={selectedHistoryFb.remark}
          history={selectedHistoryFb.remarkHistory}
        />
      )}
    </div>
  );
}
