'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => {
        const nextTheme = isDark ? 'light' : 'dark';
        if (!document.startViewTransition) {
          setTheme(nextTheme);
        } else {
          document.startViewTransition(() => {
            setTheme(nextTheme);
          });
        }
      }}
      className={`p-2 rounded-xl transition-all duration-200 border shadow-sm hover:scale-105 active:scale-95 touch-spring flex items-center justify-center shrink-0 ${
        isDark
          ? 'bg-slate-900/95 text-amber-300 border-amber-500/40 hover:bg-slate-800 hover:border-amber-400 shadow-amber-950/30'
          : 'bg-white/95 text-indigo-600 border-indigo-200/90 hover:bg-indigo-50/80 hover:border-indigo-400 shadow-indigo-500/10'
      }`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)] transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 drop-shadow-[0_0_8px_rgba(99,102,241,0.65)] transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
