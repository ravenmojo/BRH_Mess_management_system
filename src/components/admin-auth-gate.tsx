'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Mail, ShieldAlert, ArrowLeft, LogOut, Loader2, Clock, Users, ShieldCheck, Shield, RefreshCw, MailCheck, KeyRound, BarChart3, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { AdminUsersModal } from './admin-users-modal';
import { AdminStatsModal } from './admin-stats-modal';

const SESSION_KEY = 'bros_admin_auth';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes of idle time
const INACTIVITY_POPUP_COUNTDOWN_SEC = 60; // 1 minute (60 seconds) warning before auto-logout
const MAX_SESSION_EXTENSIONS = 4; // Up to 4 extensions of 30 mins each (2.5 hours total)

interface AdminSession {
  authenticated: boolean;
  expiresAt: number;
  extensionCount?: number;
  isMasterAdmin?: boolean;
  adminEmail?: string;
  adminDesignation?: string;
  adminToken?: string;
  canOverride?: boolean;
  tier?: string;
  canManageMess?: boolean;
  canManageMaintenance?: boolean;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isMasterAdmin: boolean;
  adminEmail?: string;
  adminDesignation?: string;
  adminToken?: string;
  canOverride?: boolean;
  tier?: string;
  canManageMess?: boolean;
  canManageMaintenance?: boolean;
}

export const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  isMasterAdmin: false,
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function getAdminHeaders(
  adminEmail?: string,
  adminToken?: string
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (adminEmail) headers['x-admin-email'] = adminEmail;
  if (adminToken) headers['x-admin-token'] = adminToken;

  if (!adminEmail && !adminToken && typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.adminEmail) headers['x-admin-email'] = data.adminEmail;
        if (data.adminToken) headers['x-admin-token'] = data.adminToken;
      }
    } catch {}
  }
  return headers;
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
  const [adminToken, setAdminToken] = useState<string | undefined>(undefined);
  const [canOverride, setCanOverride] = useState(false);
  const [tier, setTier] = useState<string | undefined>(undefined);
  const [canManageMess, setCanManageMess] = useState<boolean>(false);
  const [canManageMaintenance, setCanManageMaintenance] = useState<boolean>(false);

  // Login flow state
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [pendingAdminInfo, setPendingAdminInfo] = useState<{ 
    email: string; 
    designation?: string; 
    canOverride?: boolean; 
    token?: string;
    tier?: string;
    isMaster?: boolean;
    isMasterAdmin?: boolean;
    canManageMess?: boolean;
    canManageMaintenance?: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [cooldown, setCooldown] = useState(60);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  // Inactivity tracking state (10 min idle)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState(INACTIVITY_POPUP_COUNTDOWN_SEC);
  const lastActivityTimeRef = useRef<number>(Date.now());

  // 30-min session extension state (up to 4 extensions)
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionSecondsLeft, setExtensionSecondsLeft] = useState(INACTIVITY_POPUP_COUNTDOWN_SEC);
  const [extensionCount, setExtensionCount] = useState<number>(0);

  const supabase = createClient();

  const handleContinueSession = () => {
    setShowInactivityWarning(false);
    lastActivityTimeRef.current = Date.now();
  };

  const handleExtendSession = () => {
    setShowExtensionModal(false);
    lastActivityTimeRef.current = Date.now();

    const session = getStoredSession();
    if (session && session.authenticated) {
      const currentCount = session.extensionCount || 0;
      const newCount = Math.min(currentCount + 1, MAX_SESSION_EXTENSIONS);
      const newExpiresAt = Date.now() + SESSION_DURATION_MS;

      session.expiresAt = newExpiresAt;
      session.extensionCount = newCount;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

      setExtensionCount(newCount);
      setTimeLeftMs(SESSION_DURATION_MS);
    }
  };

  const handleAutoLogout = (reasonMessage?: string) => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setIsMasterAdmin(false);
    setAdminEmail(undefined);
    setAdminDesignation(undefined);
    setAdminToken(undefined);
    setCanOverride(false);
    setTier(undefined);
    setCanManageMess(false);
    setCanManageMaintenance(false);
    setShowInactivityWarning(false);
    setShowExtensionModal(false);
    setExtensionCount(0);
    setError(reasonMessage || 'Admin session locked. Please authenticate again.');
    setTimeLeftMs(0);
  };

  const checkSession = () => {
    const session = getStoredSession();
    if (session && session.authenticated) {
      const remaining = session.expiresAt - Date.now();
      const currentExtensions = session.extensionCount || 0;
      setExtensionCount(currentExtensions);

      if (remaining > 0) {
        setIsAuthenticated(true);
        setIsMasterAdmin(Boolean(session.isMasterAdmin));
        setAdminEmail(session.adminEmail);
        setAdminDesignation(session.adminDesignation);
        setAdminToken(session.adminToken);
        setCanOverride(Boolean(session.canOverride || session.isMasterAdmin));
        setTier(session.isMasterAdmin ? 'HIGH' : session.tier);
        setCanManageMess(session.isMasterAdmin ? true : Boolean(session.canManageMess));
        setCanManageMaintenance(session.isMasterAdmin ? true : Boolean(session.canManageMaintenance));
        setTimeLeftMs(remaining);
        return true;
      } else {
        // If extension popup is already showing, keep displaying modal
        if (showExtensionModal) {
          setTimeLeftMs(0);
          return true;
        }

        // Check if admin was active/interacting recently (not idle > 10 min)
        const isInteracting = Date.now() - lastActivityTimeRef.current < INACTIVITY_TIMEOUT_MS;

        if (isInteracting && currentExtensions < MAX_SESSION_EXTENSIONS) {
          // Admin is actively interacting and has remaining extensions -> trigger extension popup!
          setShowExtensionModal(true);
          setExtensionSecondsLeft(INACTIVITY_POPUP_COUNTDOWN_SEC);
          setShowInactivityWarning(false);
          setTimeLeftMs(0);
          return true;
        } else if (isInteracting && currentExtensions >= MAX_SESSION_EXTENSIONS) {
          handleAutoLogout('Maximum session duration reached (4 extensions used, 2.5 hours total). For security, please authenticate again.');
          return false;
        } else {
          handleAutoLogout('Admin session expired (30 min limit). Please authenticate again.');
          return false;
        }
      }
    } else {
      setIsAuthenticated(false);
      setIsMasterAdmin(false);
      setAdminEmail(undefined);
      setAdminDesignation(undefined);
      setAdminToken(undefined);
      setCanOverride(false);
      setTier(undefined);
      setCanManageMess(false);
      setCanManageMaintenance(false);
      setShowInactivityWarning(false);
      setShowExtensionModal(false);
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

  // Lock body scrolling when unauthenticated or showing modal popups
  useEffect(() => {
    if (isAuthenticated === false || showInactivityWarning || showExtensionModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthenticated, showInactivityWarning, showExtensionModal]);

  // Countdown timer for session duration
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const isValid = checkSession();
      if (!isValid) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, showExtensionModal]);

  // Inactivity tracking & warning popup trigger (10 min idle limit)
  useEffect(() => {
    if (!isAuthenticated) {
      setShowInactivityWarning(false);
      return;
    }

    lastActivityTimeRef.current = Date.now();

    const handleUserActivity = () => {
      // Only track idle time when warning/extension popups are NOT currently visible
      if (!showInactivityWarning && !showExtensionModal) {
        lastActivityTimeRef.current = Date.now();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    const idleCheckInterval = setInterval(() => {
      if (showInactivityWarning || showExtensionModal) return;

      const idleTime = Date.now() - lastActivityTimeRef.current;
      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        setShowInactivityWarning(true);
        setInactivitySecondsLeft(INACTIVITY_POPUP_COUNTDOWN_SEC);
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(idleCheckInterval);
    };
  }, [isAuthenticated, showInactivityWarning, showExtensionModal]);

  // Inactivity warning popup countdown (60s countdown to auto-logout)
  useEffect(() => {
    if (!showInactivityWarning) return;

    const timer = setInterval(() => {
      setInactivitySecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoLogout('Admin session locked due to inactivity (10 min idle). Please authenticate again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInactivityWarning]);

  // 30-min session extension popup countdown (60s countdown to auto-logout if no response)
  useEffect(() => {
    if (!showExtensionModal) return;

    const timer = setInterval(() => {
      setExtensionSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoLogout('Admin session ended due to no response on session extension prompt.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showExtensionModal]);

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

      // Case 1: Primary admin credential matched
      if (res.ok && data.isMasterAdmin) {
        const session: AdminSession = {
          authenticated: true,
          expiresAt: Date.now() + SESSION_DURATION_MS,
          isMasterAdmin: true,
          adminEmail: data.adminEmail,
          adminDesignation: data.adminDesignation,
          adminToken: data.token,
          canOverride: true,
          tier: 'HIGH',
          canManageMess: true,
          canManageMaintenance: true,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setIsAuthenticated(true);
        setIsMasterAdmin(true);
        setAdminEmail(data.adminEmail);
        setAdminDesignation(data.adminDesignation);
        setAdminToken(data.token);
        setCanOverride(true);
        setTier('HIGH');
        setCanManageMess(true);
        setCanManageMaintenance(true);
        setTimeLeftMs(SESSION_DURATION_MS);
        // Retain previous non-master email in state / storage
        setLoading(false);
        return;
      }

      // Case 2: Registered admin email -> trigger OTP
      if (res.ok && data.isRegisteredAdmin) {
        const targetEmail = data.email;
        setPendingAdminInfo({
          email: targetEmail,
          designation: data.designation,
          canOverride: data.canOverride,
          token: data.token,
          tier: data.tier,
          isMaster: Boolean(data.isMaster || data.isMasterAdmin),
          canManageMess: data.canManageMess,
          canManageMaintenance: data.canManageMaintenance,
        });

        // Send OTP via Supabase (allows sign up OTPs for newly added admins)
        const { error: otpSendError } = await supabase.auth.signInWithOtp({
          email: targetEmail,
          options: { shouldCreateUser: true },
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
      let { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: pendingAdminInfo.email,
        token: otp.trim(),
        type: 'email',
      });

      // If verifying as email token fails, also try signup token type
      if (verifyErr || !data.user) {
        const signupRes = await supabase.auth.verifyOtp({
          email: pendingAdminInfo.email,
          token: otp.trim(),
          type: 'signup',
        });
        if (!signupRes.error && signupRes.data.user) {
          data = signupRes.data;
          verifyErr = null;
        }
      }

      if (verifyErr || !data.user) {
        setError(verifyErr?.message || 'Invalid or expired OTP code. Please try again.');
        setLoading(false);
        return;
      }

      // Save non-master email to memory
      localStorage.setItem('bros_last_admin_email', pendingAdminInfo.email);

      // Successful OTP verification for registered admin
      const isMaster = Boolean(pendingAdminInfo.isMaster);
      const session: AdminSession = {
        authenticated: true,
        expiresAt: Date.now() + SESSION_DURATION_MS,
        isMasterAdmin: isMaster,
        adminEmail: pendingAdminInfo.email,
        adminDesignation: pendingAdminInfo.designation || '',
        adminToken: pendingAdminInfo.token,
        canOverride: Boolean(pendingAdminInfo.canOverride || isMaster),
        tier: isMaster ? 'HIGH' : pendingAdminInfo.tier,
        canManageMess: isMaster ? true : Boolean(pendingAdminInfo.canManageMess),
        canManageMaintenance: isMaster ? true : Boolean(pendingAdminInfo.canManageMaintenance),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      setIsMasterAdmin(isMaster);
      setAdminEmail(pendingAdminInfo.email);
      setAdminDesignation(pendingAdminInfo.designation);
      setAdminToken(pendingAdminInfo.token);
      setCanOverride(Boolean(pendingAdminInfo.canOverride || isMaster));
      setTier(isMaster ? 'HIGH' : pendingAdminInfo.tier);
      setCanManageMess(isMaster ? true : Boolean(pendingAdminInfo.canManageMess));
      setCanManageMaintenance(isMaster ? true : Boolean(pendingAdminInfo.canManageMaintenance));
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
        options: { shouldCreateUser: true },
      });

      if (resendErr) {
        setError(resendErr.message || 'Failed to resend OTP.');
      } else {
        setCooldown(60);
      }
    } catch (err: any) {
      setError('Failed to resend OTP code.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogout = () => {
    setShowInactivityWarning(false);
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setIsMasterAdmin(false);
    setAdminEmail(undefined);
    setAdminDesignation(undefined);
    setAdminToken(undefined);
    setTier(undefined);
    setCanManageMess(false);
    setCanManageMaintenance(false);
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isAuth = isAuthenticated === true;

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: isAuth,
        isMasterAdmin,
        adminEmail,
        adminDesignation,
        adminToken,
        canOverride,
        tier,
        canManageMess,
        canManageMaintenance,
      }}
    >
      <div className="relative space-y-4">
        {/* Top Session Banner (visible when authenticated) */}
        {isAuth && (
          <div className="flex items-center justify-between flex-wrap gap-2.5 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl text-xs shadow-xs">
            <div className="flex items-center space-x-2 flex-wrap gap-2 text-blue-800 dark:text-blue-200 font-bold min-w-0">
              {isMasterAdmin ? (
                <div className="flex items-center space-x-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] sm:text-xs">System Administrator</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 min-w-0">
                  <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-bold text-[11px] sm:text-xs truncate max-w-[180px] sm:max-w-xs text-blue-900 dark:text-blue-100">
                    {adminDesignation || adminEmail}
                  </span>
                </div>
              )}

              <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center space-x-1.5 shrink-0">
                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{formatRemainingTime(timeLeftMs)}</span>
                {extensionCount > 0 && (
                  <span className="text-[9px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100/90 dark:bg-amber-950/80 px-1.5 py-0.2 rounded-full border border-amber-300 dark:border-amber-700">
                    Ext {extensionCount}/{MAX_SESSION_EXTENSIONS}
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* Analytics & Stats Button visible to all Admins */}
              <button
                onClick={() => setStatsModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs touch-spring"
                title="View Grievance Analytics & Stats"
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Stats</span>
              </button>

              {/* Manage Admins & Audit Logs button */}
              {isMasterAdmin && (
                <button
                  onClick={() => setManageModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 touch-spring"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Manage Admins</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Analytics & Resolution Stats Modal */}
        <AdminStatsModal
          isOpen={statsModalOpen}
          onClose={() => setStatsModalOpen(false)}
        />

        {/* Admin Management & Audit Logs Modal */}
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

        {/* Bottom Admin Session Info & Logout Bar */}
        {isAuth && (
          <div className="pt-6 pb-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Authenticated as{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-bold">
                  {isMasterAdmin ? 'System Administrator' : (adminDesignation || adminEmail)}
                </strong>
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl font-bold transition-all text-xs flex items-center space-x-2 shadow-xs touch-spring"
              title="End Session and Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Inactivity Warning Modal Portal (10 min idle warning popup with 1 min auto-logout countdown) */}
        {isAuth &&
          showInactivityWarning &&
          mounted &&
          createPortal(
            <div className="fixed inset-0 z-[100000] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 min-h-[100dvh]">
              <div className="relative z-20 w-full max-w-md p-6 sm:p-7 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-300/90 dark:border-amber-500/50 space-y-5 text-center animate-in fade-in zoom-in-95 duration-200 my-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-inner">
                  <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse text-amber-600 dark:text-amber-400" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Are You Still Working?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    No activity has been detected for 10 minutes. For security, your session will automatically lock in:
                  </p>
                </div>

                <div className="py-2.5 px-5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 inline-flex items-center space-x-2 text-amber-700 dark:text-amber-300 shadow-xs">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-mono text-xl font-black tracking-wider">
                    {inactivitySecondsLeft}s
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleContinueSession}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 touch-spring"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Continue Session</span>
                  </button>

                  <button
                    onClick={() => handleAutoLogout('Admin session ended manually.')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 touch-spring"
                  >
                    <LogOut className="w-4 h-4 text-slate-400" />
                    <span>Log Out Now</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* 30-Min Session Extension Modal Portal (30 min reached while admin is active, offering up to 4 extensions) */}
        {isAuth &&
          showExtensionModal &&
          mounted &&
          createPortal(
            <div className="fixed inset-0 z-[100000] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 min-h-[100dvh]">
              <div className="relative z-20 w-full max-w-md p-6 sm:p-7 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-300/90 dark:border-blue-500/50 space-y-5 text-center animate-in fade-in zoom-in-95 duration-200 my-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/15 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-inner">
                  <Clock className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse text-blue-600 dark:text-blue-400" />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-1">
                    <span>Extension {extensionCount + 1} of {MAX_SESSION_EXTENSIONS}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Continue Your Admin Session?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Your 30-minute session has ended, but interaction was detected. You can extend this session by <strong>30 minutes</strong> ({MAX_SESSION_EXTENSIONS - extensionCount} extension{MAX_SESSION_EXTENSIONS - extensionCount > 1 ? 's' : ''} remaining).
                  </p>
                </div>

                <div className="py-2.5 px-5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 inline-flex items-center space-x-2 text-blue-700 dark:text-blue-300 shadow-xs">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-mono text-xl font-black tracking-wider">
                    {extensionSecondsLeft}s
                  </span>
                  <span className="text-[10px] text-blue-500 font-medium ml-1">remaining to confirm</span>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleExtendSession}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 touch-spring"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Continue Session (+30 Mins)</span>
                  </button>

                  <button
                    onClick={() => handleAutoLogout('Admin session ended manually.')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 touch-spring"
                  >
                    <LogOut className="w-4 h-4 text-slate-400" />
                    <span>Log Out Now</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

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
