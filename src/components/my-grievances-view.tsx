'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, ArrowLeft, Loader2, Mail, Check, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { TicketBadge } from '@/components/ticket-badge';
import { GrievanceMediaGallery } from '@/components/grievance-media-gallery';
import { OtpVerificationModal } from '@/components/otp-modal';

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

  useEffect(() => {
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
    setActionLoadingId(feedbackId);
    setSuccessToast(null);

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

      if (res.ok) {
        setSuccessToast('Grievance marked as resolved! Thank you for confirming.');
        fetchMyFeedbacks(verifiedEmail);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update grievance.');
      }
    } catch (e) {
      alert('Network error occurred.');
    } finally {
      setActionLoadingId(null);
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
            <div className="space-y-3">
              {filteredFeedbacks.map((fb) => {
                const isTwoWay = fb.adminResolved && fb.userResolved;
                const isMaintenance = fb.facilityType.startsWith('MAINTENANCE_');

                return (
                  <div
                    key={fb.id}
                    className={`p-4 rounded-2xl glass-card space-y-3 text-xs shadow-sm border transition-all ${
                      isTwoWay
                        ? 'border-emerald-400/50 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-emerald-500/5'
                        : fb.status === 'RESOLVED'
                          ? 'border-emerald-200/80 dark:border-emerald-800/60'
                          : 'border-slate-200/80 dark:border-slate-800/80'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        {fb.ticketNumber && <TicketBadge ticketNumber={fb.ticketNumber} size="sm" />}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {getFacilityLabel(fb.facilityType)}
                        </span>
                        {fb.roomNo && (
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {fb.roomNo}
                          </span>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isTwoWay && isMaintenance ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center space-x-1 shadow-xs">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <Check className="w-3 h-3 text-emerald-600 -ml-2" />
                            <span>Two-Way Verified</span>
                          </span>
                        ) : fb.status === 'RESOLVED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-halo-emerald" />
                            <span>Resolved</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-halo-blue" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comment Body */}
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal bg-slate-50/60 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                      "{fb.comment}"
                    </p>

                    {/* Media Proof */}
                    <GrievanceMediaGallery mediaUrl={fb.mediaUrl} capturedAt={fb.capturedAt} createdAt={fb.createdAt} />

                    {/* Resolution Attribution */}
                    {fb.status === 'RESOLVED' && (
                      <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Resolved by <strong className="font-semibold">{fb.resolvedBy || fb.resolvedByRole || 'Admin'}</strong>
                          {fb.resolvedAt && ` • ${new Date(fb.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST`}
                        </span>
                      </div>
                    )}

                    {/* Official Remark if present */}
                    {fb.remark && (
                      <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-slate-900 dark:text-white">Admin Remark:</strong> {fb.remark}
                        </div>
                      </div>
                    )}

                    {/* Self-Resolution Action for Student Author */}
                    {fb.status !== 'RESOLVED' && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleMarkResolved(fb.id)}
                          disabled={actionLoadingId === fb.id}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 touch-spring disabled:opacity-50"
                        >
                          {actionLoadingId === fb.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Issue Resolved</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
    </div>
  );
}
