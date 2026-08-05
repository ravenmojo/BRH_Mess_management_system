'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/') {
    return null;
  }

  return (
    <button
      onClick={() => router.back()}
      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 shrink-0 mr-1 border border-slate-200/60 dark:border-slate-700/60"
      aria-label="Go back"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );
}

