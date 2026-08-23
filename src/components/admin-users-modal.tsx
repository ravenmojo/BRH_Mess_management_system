'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Plus, Trash2, Edit2, Check, X, Loader2, UserCheck, AlertCircle, Mail, Briefcase } from 'lucide-react';

interface AdminUserRecord {
  id: string;
  email: string;
  designation?: string | null;
  canOverride?: boolean;
  createdAt: string;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SESSION_KEY = 'bros_admin_auth';

function getAdminPassword(): string {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return '';
    const data = JSON.parse(raw);
    return data?.adminPassword || '';
  } catch {
    return '';
  }
}

export function AdminUsersModal({ isOpen, onClose }: AdminUsersModalProps) {
  const [mounted, setMounted] = useState(false);
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
        headers: { 'x-admin-password': getAdminPassword() },
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

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
      setError(null);
      setSuccess(null);
      setNewEmail('');
      setNewDesignation('');
      setNewCanOverride(false);
      setEditingId(null);
    }
  }, [isOpen]);

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
          'x-admin-password': getAdminPassword(),
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
          'x-admin-password': getAdminPassword(),
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
          'x-admin-password': getAdminPassword(),
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
        headers: { 'x-admin-password': getAdminPassword() },
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
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-2 sm:p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl sm:rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Admin User Management
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Add, manage designations & override rights (Master Admin)
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

        {/* Feedback Notifications */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 shrink-0">
            <UserCheck className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

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

          <div className="flex items-center justify-between pt-1">
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
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px] break-all">
                          {admin.email}
                        </span>
                        {admin.designation ? (
                          <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 shrink-0">
                            {admin.designation}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic shrink-0">
                            (No designation set)
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

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-500">
          <span className="text-center sm:text-left">
            OTP email authentication is required for all admin accounts.
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
