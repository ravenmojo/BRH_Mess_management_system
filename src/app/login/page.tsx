'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <Link href="/" className="absolute top-6 left-6 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center space-x-2 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="w-full max-w-md p-8 glass-card rounded-3xl shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">No Login Required</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            You can browse all BROS features freely! Email OTP verification takes place inline whenever you submit a complaint or suggestion.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-left space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>How Verification Works:</span>
          </div>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 pl-6 list-disc text-[11px] font-medium">
            <li>Fill out any complaint or feedback form across the app.</li>
            <li>An inline modal will send an 8-digit OTP to your institute email.</li>
            <li>Enter the OTP to verify and submit your complaint immediately.</li>
            <li>Your last used email address is saved locally for auto-filling next time.</li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-flex w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all items-center justify-center space-x-2"
        >
          <span>Return to App</span>
        </Link>
      </div>
    </div>
  );
}

