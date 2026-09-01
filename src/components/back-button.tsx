'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const HOME_ROUTES = ['/', '/maintenance', '/hub'];

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Do not show back button on the 3 primary home pages
  if (HOME_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <div className="pb-3 -mt-1 animate-in fade-in slide-in-from-left-2 duration-200">
      <button
        onClick={() => router.back()}
        className="group inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold tracking-tight shadow-xs backdrop-blur-md transition-all duration-200 active:scale-95 touch-spring"
        aria-label="Go back to previous page"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:-translate-x-0.5 transition-all duration-200" />
        <span>Back</span>
      </button>
    </div>
  );
}
