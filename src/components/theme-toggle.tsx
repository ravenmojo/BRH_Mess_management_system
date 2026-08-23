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
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        if (!document.startViewTransition) {
          setTheme(nextTheme);
        } else {
          document.startViewTransition(() => {
            setTheme(nextTheme);
          });
        }
      }}
      className="p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 border border-slate-200/80 dark:border-slate-700/80 hover:scale-105 active:scale-95 shadow-sm"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
      )}
    </button>
  );
}

