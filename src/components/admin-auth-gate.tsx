'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Mail, ShieldAlert, ArrowLeft, LogOut, Loader2, Clock, Users, ShieldCheck, RefreshCw, MailCheck, KeyRound, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { AdminUsersModal } from './admin-users-modal';
import { AdminStatsModal } from './admin-stats-modal';

const SESSION_KEY = 'bros_admin_auth';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface AdminSession {
  authenticated: boolean;
  expiresAt: number;
  isMasterAdmin?: boolean;
  adminEmail?: string;
  adminDesignation?: string;
  adminPassword?: string;
  canOverride?: boolean;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isMasterAdmin: boolean;
  adminEmail?: string;
  adminDesignation?: string;
  adminPassword?: string;
  canOverride?: boolean;
}

export const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  isMasterAdmin: false,
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

function getStoredSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.authenticated && data.expiresAt) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

interface AdminAuthGateProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminAuthGate({ children, title = 'Admin Portal Access' }: AdminAuthGateProps) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | undefined>(undefined);
  const [adminDesignation, setAdminDesignation] = useState<string | undefined>(undefined);
  const [adminPassword, setAdminPassword] = useState<string | undefined>(undefined);
  const [canOverride, setCanOverride] = useState(false);

  // Login flow state
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [pendingAdminInfo, setPendingAdminInfo] = useState<{ email: string; designation?: string; canOverride?: boolean } | null>(null);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [cooldown, setCooldown] = useState(60);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  const supabase = createClient();

  const checkSession = () => {
    const session = getStoredSession();
    if (session && session.authenticated) {
      const remaining = session.expiresAt - Date.now();
      if (remaining > 0) {
        setIsAuthenticated(true);
        setIsMasterAdmin(Boolean(session.isMasterAdmin));
        setAdminEmail(session.adminEmail);
        setAdminDesignation(session.adminDesignation);
        setAdminPassword(session.adminPassword);
        setCanOverride(Boolean(session.canOverride || session.isMasterAdmin));
        setTimeLeftMs(remaining);
        return true;
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        setIsAuthenticated(false);
        setIsMasterAdmin(false);
        setAdminEmail(undefined);
        setAdminDesignation(undefined);
        setAdminPassword(undefined);
        setCanOverride(false);
        setError('Admin session expired (30 min limit). Please authenticate again.');
        setTimeLeftMs(0);
        return false;
      }
    } else {
      setIsAuthenticated(false);
      setIsMasterAdmin(false);
      setAdminEmail(undefined);
      setAdminDesignation(undefined);
      setAdminPassword(undefined);
      setCanOverride(false);
      setTimeLeftMs(0);
      return false;
    }
  };

  useEffect(() => {
    setMounted(true);
    checkSession();
    const savedAdminEmail = localStorage.getItem('bros_last_admin_email');
    if (savedAdminEmail) {
      setIdentifier(savedAdminEmail);
    }
  }, []);

  // Lock body scrolling when unauthenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthenticated]);

  // Countdown timer for 30 min session
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const isValid = checkSession();
      if (!isValid) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Cooldown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const inputVal = identifier.trim();

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: inputVal }),
      });

      const data = await res.json();

      // Case 1: Master Admin password matched (stealth)
      if (res.ok && data.isMasterAdmin) {
        const session: AdminSession = {
          authenticated: true,
          expiresAt: Date.now() + SESSION_DURATION_MS,
          isMasterAdmin: true,
          adminEmail: data.adminEmail,
          adminDesignation: data.adminDesignation,
          adminPassword: inputVal,
          canOverride: true,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setIsAuthenticated(true);
        setIsMasterAdmin(true);
        setAdminEmail(data.adminEmail);
        setAdminDesignation(data.adminDesignation);
        setAdminPassword(inputVal);
        setCanOverride(true);
        setTimeLeftMs(SESSION_DURATION_MS);
        // Retain previous non-master email in state / storage
        setLoading(false);
        return;
      }

      // Case 2: Registered admin email -> trigger OTP
      if (res.ok && data.isRegisteredAdmin) {
        const targetEmail = data.email;
        setPendingAdminInfo({ email: targetEmail, designation: data.designation, canOverride: data.canOverride });

        // Send OTP via Supabase
        const { error: otpSendError } = await supabase.auth.signInWithOtp({
          email: targetEmail,
          options: { shouldCreateUser: false },
        });

        if (otpSendError) {
          setError(otpSendError.message || 'Failed to dispatch OTP to your email.');
        } else {
          setStep('otp');
          setCooldown(60);
          setOtp('');
        }
        setLoading(false);
        return;
      }

      // Case 3: Error (unregistered email / invalid input)
      setError(data.error || 'Access Denied: You are not authorized to access the admin portal.');
      setLoading(false);
    } catch (err: any) {
      setError('Authentication request failed. Please check network connection.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAdminInfo) return;

    setError(null);
    setLoading(true);

    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: pendingAdminInfo.email,
        token: otp.trim(),
        type: 'email',
      });

      if (verifyErr || !data.user) {
        setError(verifyErr?.message || 'Invalid or expired OTP code. Please try again.');
        setLoading(false);
        return;
      }

      // Save non-master email to memory
      localStorage.setItem('bros_last_admin_email', pendingAdminInfo.email);

      // Successful OTP verification for registered admin
      const session: AdminSession = {
        authenticated: true,
        expiresAt: Date.now() + SESSION_DURATION_MS,
        isMasterAdmin: false,
        adminEmail: pendingAdminInfo.email,
        adminDesignation: pendingAdminInfo.designation || '',
        canOverride: Boolean(pendingAdminInfo.canOverride),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      setIsMasterAdmin(false);
      setAdminEmail(pendingAdminInfo.email);
      setAdminDesignation(pendingAdminInfo.designation);
      setCanOverride(Boolean(pendingAdminInfo.canOverride));
      setTimeLeftMs(SESSION_DURATION_MS);
      setOtp('');
      setStep('identifier');
    } catch (err: any) {
      setError('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingAdminInfo || cooldown > 0 || resendLoading) return;

    setError(null);
    setResendLoading(true);

    try {
      const { error: resendErr } = await supabase.auth.signInWithOtp({
        email: pendingAdminInfo.email,
        options: { shouldCreateUser: false },
      });

      if (resendErr) {
        setError(resendErr.message || 'Failed to resend OTP.');
      } else {
        setCooldown(60);
        setOtp('');
      }
    } catch {
      setError('Failed to resend OTP code.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setIsMasterAdmin(false);
    setAdminEmail(undefined);
    setAdminDesignation(undefined);
    setAdminPassword(undefined);
    setIdentifier('');
    setOtp('');
    setStep('identifier');
    setTimeLeftMs(0);
  };

  const formatRemainingTime = (ms: number): string => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  const isAuth = Boolean(isAuthenticated);

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: isAuth,
        isMasterAdmin,
        adminEmail,
        adminDesignation,
        adminPassword,
        canOverride,
      }}
    >
      <div className="relative space-y-4">
        {/* Top Session Banner (visible when authenticated) */}
        {isAuth && (
          <div className="flex items-center justify-between flex-wrap gap-2 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 p-3 sm:px-4 sm:py-2.5 rounded-2xl text-xs shadow-sm">
            <div className="flex items-center space-x-2 flex-wrap gap-1.5 text-blue-800 dark:text-blue-200 font-bold min-w-0 flex-1">
              {isMasterAdmin ? (
                <div className="flex items-center space-x-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] sm:text-xs">Master Administrator</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 min-w-0">
                  <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-mono text-[11px] sm:text-xs truncate max-w-[160px] sm:max-w-xs">{adminEmail}</span>
                  {adminDesignation && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold shrink-0">
                      {adminDesignation}
                    </span>
                  )}
                </div>
              )}

              <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center space-x-1 shrink-0">
                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{formatRemainingTime(timeLeftMs)}</span>
              </span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Analytics & Stats Button visible to all Admins */}
              <button
                onClick={() => setStatsModalOpen(true)}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs touch-spring"
                title="View Grievance Analytics & Stats"
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Stats</span>
              </button>

              {/* Manage Admins button visible ONLY to Master Admin */}
              {isMasterAdmin && (
                <button
                  onClick={() => setManageModalOpen(true)}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 touch-spring"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Manage Admins</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 rounded-xl font-bold transition-colors text-xs touch-spring"
                title="End Admin Session"
              >
                <LogOut className="w-3 h-3" />
                <span>Lock</span>
              </button>
            </div>
          </div>
        )}

        {/* Analytics & Resolution Stats Modal */}
        <AdminStatsModal
          isOpen={statsModalOpen}
          onClose={() => setStatsModalOpen(false)}
        />

        {/* Master Admin Management Modal */}
        {isMasterAdmin && (
          <AdminUsersModal
            isOpen={manageModalOpen}
            onClose={() => setManageModalOpen(false)}
          />
        )}

        {/* Render Admin Page Layout & Visual Resources (blurred when unauthenticated) */}
        <div
          className={
            !isAuth
              ? 'pointer-events-none select-none filter blur-md opacity-35 transition-all duration-300'
              : 'transition-all duration-300'
          }
        >
          {children}
        </div>

        {/* Auth Modal Popup Portal (overlaid on top when unauthenticated) */}
        {!isAuth &&
          mounted &&
          createPortal(
            <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 min-h-[100dvh]">
              <div className="relative z-20 w-full max-w-md p-5 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 sm:space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 my-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-500/30">
                  <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {step === 'identifier'
                      ? 'Authorized admin access required. Enter your admin email to proceed.'
                      : `Enter the 6-digit OTP sent to ${pendingAdminInfo?.email}`}
                  </p>
                </div>

                {error && (
                  <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center space-x-1.5 text-left">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                {/* Step 1: Identifier Input (Clean "Admin Email" input) */}
                {step === 'identifier' && (
                  <form onSubmit={handleIdentifierSubmit} className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                        Admin Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none z-10" />
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="Enter your admin email"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all relative z-0"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !identifier.trim()}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Access Admin Portal</span>
                    </button>
                  </form>
                )}

                {/* Step 2: OTP Verification (6-Digit OTP) */}
                {step === 'otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          6-Digit OTP Code
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">
                          {otp.length}/6 digits
                        </span>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none z-10" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit code"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm tracking-widest font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all relative z-0"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('identifier');
                          setError(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition-colors"
                      >
                        ← Change Email
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={cooldown > 0 || resendLoading}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold disabled:text-slate-400 disabled:no-underline flex items-center space-x-1"
                      >
                        {resendLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        <span>{cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend Code'}</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.trim().length < 6}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MailCheck className="w-4 h-4" />
                      )}
                      <span>Verify & Enter Portal</span>
                    </button>
                  </form>
                )}

                <Link href="/" className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors pt-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Public Dashboard</span>
                </Link>
              </div>
            </div>,
            document.body
          )}
      </div>
    </AdminAuthContext.Provider>
  );
}
