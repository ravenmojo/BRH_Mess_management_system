'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { OtpVerificationModal } from '@/components/otp-modal';
import { Loader2, ShieldCheck, CheckCircle2, Lock, Unlock, BarChart3, AlertCircle } from 'lucide-react';

export default function PublicPollPage() {
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const loadPoll = () => {
    fetch('/api/poll')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const active = data.find((p: any) => p.isActive);
          setPoll(active || data[0]);
        } else {
          setPoll(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPoll();
  }, []);

  const handleVoteClick = (optionId: string) => {
    setSelectedOptionId(optionId);
    setStatusMessage(null);
    setShowOtpModal(true);
  };

  const handleOtpVerified = async (verifiedEmail: string) => {
    if (!selectedOptionId || !poll) return;

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/poll/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          pollOptionId: selectedOptionId,
          email: verifiedEmail,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage({ text: 'Vote cast successfully!', type: 'success' });
        loadPoll(); // Refresh poll data to show updated counts
      } else {
        setStatusMessage({ text: data.error || 'Failed to submit vote.', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Network error occurred.', type: 'error' });
    } finally {
      setSubmitting(false);
      setShowOtpModal(false);
      setSelectedOptionId(null);
      // Student verification does NOT remain active once vote is casted!
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="space-y-5 pb-8 text-center pt-10">
        <div className="text-4xl mb-2">📊</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Active Polls</h2>
        <p className="text-sm text-slate-500">There are currently no polls running for the upcoming month.</p>
        <Footer />
      </div>
    );
  }

  const currentDate = new Date();
  const isAfter15th = currentDate.getDate() > 15;
  const isPollLocked = !poll.isActive || isAfter15th;

  // Calculate total votes for percentages
  const totalVotes = poll.options.reduce((acc: number, opt: any) => acc + (opt._count?.votes || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-800 to-purple-900 p-5 text-white shadow-lg">
        <div className="relative z-10 space-y-1">
          <h2 className="text-xl font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
            <span className="text-xl">📊</span>
            <span>Monthly Mess Poll</span>
          </h2>
          <p className="text-xs text-indigo-200 font-medium max-w-sm">
            Vote for the Seasonal Veg Curries for Month {poll.month} / {poll.year}. 
            Polls lock automatically after the 15th.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          {isPollLocked ? (
            <span className="flex items-center space-x-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800/50">
              <Lock className="w-3.5 h-3.5" />
              <span>Poll Locked</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
              <Unlock className="w-3.5 h-3.5" />
              <span>Poll Active</span>
            </span>
          )}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Total Votes: <strong className="text-slate-900 dark:text-white">{totalVotes}</strong>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center space-x-2 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        {poll.options.sort((a: any, b: any) => (b._count?.votes || 0) - (a._count?.votes || 0)).map((opt: any) => {
          const votes = opt._count?.votes || 0;
          const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

          return (
            <div key={opt.id} className="relative p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-center">
              {/* Progress Bar Background */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-indigo-50 dark:bg-indigo-950/30 transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {opt.itemName}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {votes} votes ({percentage}%)
                  </div>
                </div>

                {!isPollLocked && (
                  <button
                    onClick={() => handleVoteClick(opt.id)}
                    disabled={submitting}
                    className="ml-3 shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    Vote
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <OtpVerificationModal
          isOpen={showOtpModal}
          initialEmail=""
          onVerified={handleOtpVerified}
          onClose={() => {
            setShowOtpModal(false);
            setSelectedOptionId(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
