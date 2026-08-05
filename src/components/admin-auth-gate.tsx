'use client';

import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AdminAuthGateProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminAuthGate({ children, title = 'Admin Portal Access' }: AdminAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('bros_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (password === 'adminBRH') {
        sessionStorage.setItem('bros_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setError('Incorrect Admin Password. Access Denied.');
      }
      setLoading(false);
    }, 300);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bros_admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 glass-card rounded-3xl shadow-2xl space-y-6 relative overflow-hidden text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enter admin security password to access this management dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Admin Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
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
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          <Link href="/" className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors pt-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 px-4 py-2 rounded-2xl text-xs">
        <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>Admin Authenticated (`adminBRH`)</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 rounded-lg font-bold transition-colors"
        >
          <LogOut className="w-3 h-3" />
          <span>Lock Admin Session</span>
        </button>
      </div>

      {children}
    </div>
  );
}
