'use client';

import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowLeft, LogOut, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { PublicDashboardPreview } from '@/components/public-dashboard-preview';

const SESSION_KEY = 'bros_admin_auth';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface AdminSession {
  authenticated: boolean;
  expiresAt: number;
}

function getStoredSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.authenticated && data.expiresAt) {
      return data;
    }
    if (raw === 'true') {
      const legacySession = { authenticated: true, expiresAt: Date.now() + SESSION_DURATION_MS };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(legacySession));
      return legacySession;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  const checkSession = () => {
    const session = getStoredSession();
    if (session && session.authenticated) {
      const remaining = session.expiresAt - Date.now();
      if (remaining > 0) {
        setIsAuthenticated(true);
        setTimeLeftMs(remaining);
        return true;
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        setIsAuthenticated(false);
        setError('Admin session expired (30 min limit). Re-enter password to continue.');
        setTimeLeftMs(0);
        return false;
      }
    } else {
      setIsAuthenticated(false);
      setTimeLeftMs(0);
      return false;
    }
  };

  useEffect(() => {
    checkSession();
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (password === 'adminBRH') {
        const session: AdminSession = {
          authenticated: true,
          expiresAt: Date.now() + SESSION_DURATION_MS,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setIsAuthenticated(true);
        setTimeLeftMs(SESSION_DURATION_MS);
        setPassword('');
      } else {
        setError('Incorrect Admin Password. Access Denied.');
      }
      setLoading(false);
    }, 300);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setPassword('');
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

  // When unauthenticated: DO NOT load admin section at all. Render public dashboard blurred in background.
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex items-center justify-center">
        {/* Render Public Dashboard blurred in background */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none filter blur-md opacity-35 overflow-hidden">
          <PublicDashboardPreview />
        </div>

        {/* Dark Overlay Mask */}
        <div className="absolute inset-0 z-10 bg-slate-950/70 pointer-events-none" />

        {/* Centered Auth Popup Card (No page scroll) */}
        <div className="relative z-20 w-full max-w-md p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 mx-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Authorized admin access required. Enter admin password to enter.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Admin Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none z-10" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all relative z-0"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Authenticate & Enter Admin Portal</span>
            </button>
          </form>

          <Link href="/" className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors pt-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // When authenticated, render the admin page children with the session banner
  return (
    <div className="relative space-y-4">
      <div className="flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 px-4 py-2 rounded-2xl text-xs">
        <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>Admin Authenticated (`adminBRH`)</span>
          <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full text-blue-800 dark:text-blue-200 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>{formatRemainingTime(timeLeftMs)}</span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 rounded-lg font-bold transition-colors shrink-0 ml-2"
        >
          <LogOut className="w-3 h-3" />
          <span>Lock Session</span>
        </button>
      </div>

      <div>{children}</div>
    </div>
  );
}
