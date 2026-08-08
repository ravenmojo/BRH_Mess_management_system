'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, KeyRound, Loader2, X, ShieldCheck, RefreshCw, MailCheck, AlertTriangle, Inbox, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const VERIFICATION_CACHE_KEY = 'bros_verified_email';
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isEmailVerifiedRecently(email: string): boolean {
  try {
    const raw = localStorage.getItem(VERIFICATION_CACHE_KEY);
    if (!raw) return false;
    const { email: cachedEmail, verifiedAt } = JSON.parse(raw);
    if (cachedEmail !== email.trim().toLowerCase()) return false;
    return Date.now() - verifiedAt < VERIFICATION_TTL_MS;
  } catch {
    return false;
  }
}

function cacheEmailVerification(email: string) {
  localStorage.setItem(
    VERIFICATION_CACHE_KEY,
    JSON.stringify({ email: email.trim().toLowerCase(), verifiedAt: Date.now() })
  );
}

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail: string;
  onVerified: (verifiedEmail: string) => Promise<void> | void;
}

export function OtpVerificationModal({
  isOpen,
  onClose,
  initialEmail,
  onVerified,
}: OtpVerificationModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Resend Cooldown & Attempt tracking
  const [attempts, setAttempts] = useState(1);
  const [cooldown, setCooldown] = useState(60);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      const savedEmail = localStorage.getItem('bros_last_email') || initialEmail;
      setEmail(savedEmail);
      setOtp('');
      setStep('email');
      setError(null);
      setAttempts(1);
      setCooldown(60);

      // Check 24hr verification cache — skip OTP entirely if valid
      if (savedEmail && isEmailVerifiedRecently(savedEmail)) {
        // Auto-submit without OTP
        const trimmed = savedEmail.trim().toLowerCase();
        localStorage.setItem('bros_last_email', trimmed);
        onVerified(trimmed);
        onClose();
      }
    }
  }, [isOpen, initialEmail]);

  // 60 seconds countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail.endsWith('.iitkgp.ac.in') && trimmedEmail !== 'soura7@gmail.com' && trimmedEmail !== 'souradeep.satpathy@gmail.com') {
      setError('Only .iitkgp.ac.in institute email addresses are allowed.');
      return;
    }

    // Check 24hr cache before sending OTP
    if (isEmailVerifiedRecently(trimmedEmail)) {
      localStorage.setItem('bros_last_email', trimmedEmail);
      await onVerified(trimmedEmail);
      onClose();
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message || 'Failed to send OTP. Please check your email address.');
    } else {
      localStorage.setItem('bros_last_email', trimmedEmail);
      setStep('otp');
      setAttempts(1);
      setCooldown(60);
    }
  };

  const handleResendOtp = async () => {
    if (attempts >= 3) {
      setError('Maximum 3 OTP attempts reached. Please change email address or wait a few minutes.');
      return;
    }
    if (cooldown > 0 || resendLoading) return;

    setError(null);
    setResendLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    setResendLoading(false);
    if (error) {
      setError(error.message || 'Failed to resend OTP. Please try again.');
    } else {
      setAttempts((prev) => prev + 1);
      setCooldown(60);
      setOtp('');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: otp.trim(),
      type: 'email',
    });

    setLoading(false);
    if (error) {
      setError(error.message || 'Invalid or expired OTP. Please try again.');
    } else {
      // Cache successful verification for 24 hours
      cacheEmailVerification(trimmedEmail);
      localStorage.setItem('bros_last_email', trimmedEmail);
      await onVerified(trimmedEmail);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
            <span>Email OTP Verification</span>
          </h3>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Institute Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@iitkgp.ac.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Send OTP Code</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3.5">
            {/* Sent Status Badge */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs">
              <div className="flex items-center space-x-2 overflow-hidden">
                <MailCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white truncate">{email}</span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0 ml-2">
                Try {attempts}/3
              </span>
            </div>

            {/* Spam Folder Alert Banner */}
            <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-start space-x-2.5 shadow-sm">
              <Inbox className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-tight space-y-0.5">
                <p className="font-extrabold text-[11px] flex items-center space-x-1 text-amber-900 dark:text-amber-100">
                  <span>📁 Check Spam / Junk Folder!</span>
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                  If OTP does not appear in Primary Inbox in about 30s, check your Spam or Junk folder and report it{' '} <span className="text-amber-900 dark:text-amber-100">'Not Spam'</span>.
                </p>
              </div>
            </div>

            {/* OTP Input - 8-Dot Numeric PIN Visualization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enter 8-Digit OTP</span>
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  {otp.length}/8 digits
                </span>
              </div>

              <div className="relative">
                {/* Hidden input capturing numeric keypad on iOS & Android */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                  maxLength={8}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                  required
                  autoFocus
                />

                {/* 8-Dot / Box PIN Visualization */}
                <div className="grid grid-cols-8 gap-1 sm:gap-1.5 pointer-events-none">
                  {Array.from({ length: 8 }).map((_, index) => {
                    const char = otp[index];
                    const isFilled = char !== undefined;
                    const isCurrent = otp.length === index;

                    return (
                      <div
                        key={index}
                        className={`h-11 rounded-xl border flex items-center justify-center font-black text-sm transition-all ${isFilled
                          ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/20'
                          : isCurrent
                            ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/30 bg-white dark:bg-slate-900 animate-pulse'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-300 dark:text-slate-600'
                          }`}
                      >
                        {isFilled ? (
                          char
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length < 6}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Verify & Complete Submission</span>
            </button>

            {/* Resend & Change Email Actions */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || attempts >= 3 || resendLoading}
                className="text-blue-600 dark:text-blue-400 hover:underline font-bold disabled:opacity-50 disabled:no-underline flex items-center space-x-1"
              >
                {resendLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 inline" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 mr-1 inline" />
                )}
                <span>
                  {attempts >= 3
                    ? 'Max tries (3/3)'
                    : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : `Resend OTP (${3 - attempts} left)`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setAttempts(1);
                  setCooldown(0);
                }}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold transition-colors"
              >
                Change Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
