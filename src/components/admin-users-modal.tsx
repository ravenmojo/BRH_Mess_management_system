'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  UserCheck,
  AlertCircle,
  Mail,
  Briefcase,
  History,
  Users,
  Search,
  RefreshCw,
  Clock,
  Shield,
  Activity,
} from 'lucide-react';
import { getAdminHeaders } from '@/components/admin-auth-gate';
import { formatAdminDisplayName } from '@/lib/admin-display';

interface AdminUserRecord {
  id: string;
  email: string;
  designation?: string | null;
  canOverride?: boolean;
  createdAt: string;
}

interface AuditLogRecord {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  targetId?: string | null;
  createdAt: string;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminUsersModal({ isOpen, onClose }: AdminUsersModalProps) {
  const [mounted, setMounted] = useState(false);
  const [modalTab, setModalTab] = useState<'ADMINS' | 'LOGS'>('ADMINS');

  // Admins state
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New admin form state
  const [newEmail, setNewEmail] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newCanOverride, setNewCanOverride] = useState(false);
  const [adding, setAdding] = useState(false);

  // Edit designation state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDesignation, setEditingDesignation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Audit logs state
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scroll & listen for Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { ...getAdminHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      } else {
        setError('Failed to load administrator records.');
      }
    } catch {
      setError('Network error while fetching administrator list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const query = logSearch.trim() ? `?search=${encodeURIComponent(logSearch.trim())}` : '';
      const res = await fetch(`/api/admin/logs${query}`, {
        headers: { ...getAdminHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      // silent fallback
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (modalTab === 'ADMINS') {
        fetchAdmins();
      } else {
        fetchLogs();
      }
      setError(null);
      setSuccess(null);
      setNewEmail('');
      setNewDesignation('');
      setNewCanOverride(false);
      setEditingId(null);
    }
  }, [isOpen, modalTab]);

  // Debounced search for logs
  useEffect(() => {
    if (isOpen && modalTab === 'LOGS') {
      const timer = setTimeout(() => {
        fetchLogs();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [logSearch]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailTrimmed = newEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setError('Please enter a valid email address.');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify({
          email: emailTrimmed,
          designation: newDesignation.trim(),
          canOverride: newCanOverride,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Administrator ${emailTrimmed} registered successfully.`);
        setNewEmail('');
        setNewDesignation('');
        setNewCanOverride(false);
        fetchAdmins();
      } else {
        setError(data.error || 'Failed to add administrator.');
      }
    } catch {
      setError('Request failed. Please check network connection.');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateDesignation = async (id: string) => {
    setError(null);
    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify({
          id,
          designation: editingDesignation.trim(),
        }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchAdmins();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update designation.');
      }
    } catch {
      setError('Network error updating designation.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleOverride = async (id: string, currentOverride: boolean) => {
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify({
          id,
          canOverride: !currentOverride,
        }),
      });

      if (res.ok) {
        fetchAdmins();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update override permissions.');
      }
    } catch {
      setError('Network error updating permissions.');
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke admin access for ${email}?`)) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        headers: { ...getAdminHeaders() },
      });

      if (res.ok) {
        setSuccess(`Admin access for ${email} revoked.`);
        fetchAdmins();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete administrator.');
      }
    } catch {
      setError('Network error deleting administrator.');
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('REGISTER') || action.includes('APPROVE') || action.includes('RESOLVE')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
    }
    if (action.includes('REVOKE') || action.includes('DELETE') || action.includes('REJECT') || action.includes('ESCALATE')) {
      return 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-700';
    }
    if (action.includes('PENDING') || action.includes('OVERRIDE')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
    }
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700';
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-6 min-h-[100dvh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 max-h-[90vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-2 sm:p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl sm:rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Admin Control & Audit Panel
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Manage administrator privileges & monitor master activity logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shrink-0">
          <button
            type="button"
            onClick={() => setModalTab('ADMINS')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              modalTab === 'ADMINS'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-400/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admins & Permissions ({admins.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('LOGS')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              modalTab === 'LOGS'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-400/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity Audit Logs</span>
          </button>
        </div>

        {/* Feedback Notifications */}
        {error && modalTab === 'ADMINS' && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && modalTab === 'ADMINS' && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 shrink-0">
            <UserCheck className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* TAB 1: ADMIN USERS MANAGEMENT */}
        {modalTab === 'ADMINS' && (
          <>
            {/* Add Administrator Form */}
            <form
              onSubmit={handleAddAdmin}
              className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5 sm:space-y-3 shrink-0"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Register New Administrator</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Admin Email *"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Designation (e.g. Mess Secretary)"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCanOverride}
                    onChange={(e) => setNewCanOverride(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Grant Resolution Override Permission</span>
                </label>

                <button
                  type="submit"
                  disabled={adding || !newEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 touch-spring"
                >
                  {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Add Administrator</span>
                </button>
              </div>
            </form>

            {/* Registered Administrators List */}
            <div className="space-y-2 flex-1 overflow-y-auto min-h-[140px] pr-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>Authorized Accounts ({admins.length})</span>
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
              </div>

              {admins.length === 0 && !loading ? (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  No registered administrators found.
                </div>
              ) : (
                <div className="space-y-2">
                  {admins.map((admin) => {
                    const isEditing = editingId === admin.id;

                    return (
                      <div
                        key={admin.id}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start sm:items-center justify-between gap-2 text-xs flex-col sm:flex-row"
                      >
                        <div className="space-y-1 min-w-0 w-full sm:w-auto flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {admin.designation || admin.email}
                            </span>
                            {admin.designation && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({admin.email})
                              </span>
                            )}
                            <button
                              onClick={() => handleToggleOverride(admin.id, Boolean(admin.canOverride))}
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                                admin.canOverride
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                              title="Click to toggle status override rights"
                            >
                              {admin.canOverride ? '✓ Can Override Status' : 'Standard Rights'}
                            </button>
                          </div>

                          {/* Edit Designation Field */}
                          {isEditing && (
                            <div className="flex items-center space-x-1.5 pt-1.5 w-full max-w-sm">
                              <input
                                type="text"
                                value={editingDesignation}
                                onChange={(e) => setEditingDesignation(e.target.value)}
                                placeholder="Enter designation..."
                                className="px-2 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-0"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateDesignation(admin.id)}
                                disabled={savingEdit}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors shrink-0"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1 shrink-0 self-end sm:self-center">
                          {!isEditing && (
                            <button
                              onClick={() => {
                                setEditingId(admin.id);
                                setEditingDesignation(admin.designation || '');
                              }}
                              className="p-2 sm:p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors touch-spring"
                              title="Edit Designation"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                            className="p-2 sm:p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors border border-rose-200 dark:border-rose-800 touch-spring"
                            title="Revoke Admin Access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: MASTER ADMIN AUDIT LOGS */}
        {modalTab === 'LOGS' && (
          <div className="space-y-3 flex-1 flex flex-col min-h-[300px] overflow-hidden">
            {/* Search & Refresh Toolbar */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search logs by action, admin, or details..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Refresh Audit Logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Audit Logs List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {logsLoading && logs.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
                  <span>Loading audit trail...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 font-medium space-y-1">
                  <Activity className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p>No audit action logs recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => {
                    const matchedAdmin = admins.find((a) => a.email.toLowerCase() === log.adminEmail.toLowerCase());
                    const displayName = formatAdminDisplayName(matchedAdmin?.designation, log.adminEmail);

                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 text-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                            <span
                              className={`text-[9.5px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${getActionBadgeColor(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </span>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                              {displayName}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(log.createdAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11.5px] text-slate-800 dark:text-slate-200 leading-relaxed break-words pl-0.5">
                          {log.details}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-500 shrink-0">
          <span className="text-center sm:text-left">
            {modalTab === 'ADMINS'
              ? 'OTP email authentication is required for all admin accounts.'
              : 'All administrative state changes are cryptographically attributed & stored.'}
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
