'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, ArrowLeft, Loader2, Mail, Check, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { TicketBadge } from '@/components/ticket-badge';
import { GrievanceMediaGallery } from '@/components/grievance-media-gallery';
import { OtpVerificationModal } from '@/components/otp-modal';
import { CompactGrievanceCard } from '@/components/compact-grievance-card';

interface MyGrievancesViewProps {
  onBackToSubmit?: () => void;
}

function getFacilityLabel(type: string) {
  switch (type) {
    case 'REGULAR_MESS':
      return 'Regular Mess';
    case 'NIGHT_CANTEEN':
      return 'Night Canteen';
    case 'MAINTENANCE_WASHROOM':
      return 'Washrooms';
    case 'MAINTENANCE_WATER':
      return 'Water & Purifiers';
    case 'MAINTENANCE_ELECTRICAL':
      return 'Electrical';
    case 'MAINTENANCE_CIVIL':
      return 'Civil & Structural';
    case 'MAINTENANCE_CLEANING':
      return 'Cleaning & Hygiene';
    case 'MAINTENANCE_OUTDOOR':
      return 'Gym & Outdoors';
    default:
      return type.replace('MAINTENANCE_', '');
  }
}

export function MyGrievancesView({ onBackToSubmit }: MyGrievancesViewProps) {
  const [email, setEmail] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [managerPassword, setManagerPassword] = useState('');
  const [approvingGrievanceId, setApprovingGrievanceId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  useEffect(() => {
    const justSubmitted = sessionStorage.getItem('just_submitted_email');
    if (justSubmitted) {
      setEmail(justSubmitted);
      setVerifiedEmail(justSubmitted);
      return;
    }

    const saved = localStorage.getItem('bros_last_email');
    if (saved) {
      setEmail(saved);
      // Auto-verify if student recently used this device
      const isVerifiedSession = sessionStorage.getItem(`bros_verified_${saved.toLowerCase()}`);
      if (isVerifiedSession === 'true') {
        setVerifiedEmail(saved);
      }
    }
  }, []);

  const fetchMyFeedbacks = (targetEmail: string) => {
    setLoading(true);
    fetch(`/api/feedback?authorEmail=${encodeURIComponent(targetEmail.toLowerCase())}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFeedbacks(data);
        } else {
          setFeedbacks([]);
        }
      })
      .catch(() => setFeedbacks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (verifiedEmail) {
      fetchMyFeedbacks(verifiedEmail);
    }
  }, [verifiedEmail]);

  const handleStartVerification = () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid institute email (@kgpian.iitkgp.ac.in or @iitkgp.ac.in).');
      return;
    }
    setIsOtpModalOpen(true);
  };

  const handleOtpVerified = (verified: string) => {
    setIsOtpModalOpen(false);
    setVerifiedEmail(verified);
    localStorage.setItem('bros_last_email', verified);
    sessionStorage.setItem(`bros_verified_${verified.toLowerCase()}`, 'true');
    fetchMyFeedbacks(verified);
  };

  const handleMarkResolved = async (feedbackId: string) => {
    if (!verifiedEmail) return;
    setSuccessToast(null);

    // ⚡ Instant Optimistic Update
    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === feedbackId
          ? {
              ...fb,
              userResolved: true,
              status: fb.facilityType?.startsWith('MAINTENANCE_')
                ? (fb.adminResolved ? 'RESOLVED' : fb.status)
                : 'RESOLVED',
              resolvedAt: fb.resolvedAt || new Date().toISOString(),
            }
          : fb
      )
    );
    setSuccessToast('Grievance marked as resolved! Thank you for confirming.');
    setTimeout(() => setSuccessToast(null), 3500);

    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: feedbackId,
          isStudentAuthor: true,
          authorEmail: verifiedEmail,
        }),
      });

      if (!res.ok) {
        fetchMyFeedbacks(verifiedEmail);
        const err = await res.json();
        alert(err.error || 'Failed to update grievance.');
      }
    } catch (e) {
      fetchMyFeedbacks(verifiedEmail);
      alert('Network error occurred.');
    }
  };

  const handleApproveManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingGrievanceId || !managerPassword) return;
    setLoading(true);
    setApproveError(null);
    try {
      const res = await fetch('/api/feedback/approve-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: approvingGrievanceId, password: managerPassword }),
      });
      if (res.ok) {
        setApprovingGrievanceId(null);
        setManagerPassword('');
        setSuccessToast('Grievance formally registered!');
        if (verifiedEmail) fetchMyFeedbacks(verifiedEmail);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        const data = await res.json();
        setApproveError(data.error || 'Failed to approve. Incorrect password?');
      }
    } catch (err) {
      setApproveError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchEmail = () => {
    if (verifiedEmail) {
      sessionStorage.removeItem(`bros_verified_${verifiedEmail.toLowerCase()}`);
    }
    setVerifiedEmail(null);
    setFeedbacks([]);
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (filter === 'PENDING') return fb.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return fb.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Top Bar with Navigation */}
      <div className="flex items-center justify-between">
        {onBackToSubmit && (
          <button
            onClick={onBackToSubmit}
            className="flex items-center space-x-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all touch-spring shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Submit Grievance</span>
          </button>
        )}
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 ml-auto flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>My Grievances Portal</span>
        </h3>
      </div>

      {/* Email Verification Card if Not Verified */}
      {!verifiedEmail ? (
        <div className="glass-card p-5 rounded-2xl sm:rounded-3xl space-y-4 shadow-sm border border-slate-200/80 dark:border-slate-800/80">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
              <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Verify Your Institute Email</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter your email to view all grievances submitted by you across Mess, Maintenance, and Night Canteen, and confirm issue resolutions.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="e.g. rollno@kgpian.iitkgp.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
            <button
              onClick={handleStartVerification}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-1.5 touch-spring"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify via 6-Digit OTP</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Profile Header */}
          <div className="flex items-center justify-between p-3.5 glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="min-w-0 flex-1 pr-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Viewing Grievances For</div>
              <div className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 truncate">{verifiedEmail}</div>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => fetchMyFeedbacks(verifiedEmail)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors touch-spring"
                title="Refresh My Grievances"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleSwitchEmail}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors touch-spring"
              >
                Switch
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1.5">
              {(['ALL', 'PENDING', 'RESOLVED'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all touch-spring ${
                    filter === t
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {t === 'ALL' ? `All (${feedbacks.length})` : t === 'PENDING' ? `Pending (${feedbacks.filter(f => f.status !== 'RESOLVED').length})` : `Resolved (${feedbacks.filter(f => f.status === 'RESOLVED').length})`}
                </button>
              ))}
            </div>
          </div>

          {successToast && (
            <div className="p-3 rounded-2xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center space-x-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Feedbacks List */}
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Fetching your grievances...</span>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-2xl text-slate-500 text-xs font-medium space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} grievances found under this email.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFeedbacks.map((fb) => (
                <CompactGrievanceCard
                  key={fb.id}
                  item={fb}
                  showFacilityBadge={true}
                  onMarkResolved={handleMarkResolved}
                  onApproveManager={(id) => { setApprovingGrievanceId(id); setApproveError(null); setManagerPassword(''); }}
                  isActionLoading={actionLoadingId === fb.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        initialEmail={email}
        onVerified={handleOtpVerified}
        onClose={() => setIsOtpModalOpen(false)}
      />

      {/* Mess Manager Approval Modal */}
      {approvingGrievanceId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-card rounded-3xl p-5 shadow-2xl shadow-indigo-900/20 border border-slate-200/80 dark:border-slate-700 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">Mess Manager Signature</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                  Ask the Mess Manager to enter their password to officially register this grievance.
                </p>
              </div>
            </div>

            <form onSubmit={handleApproveManager} className="space-y-3 pt-2">
              <input
                type="password"
                placeholder="Manager Password"
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
              {approveError && (
                <p className="text-[11px] font-bold text-rose-500 text-center">{approveError}</p>
              )}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingGrievanceId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all touch-spring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !managerPassword}
                  className="flex-[2] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-1.5 touch-spring disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Sign & Register</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
