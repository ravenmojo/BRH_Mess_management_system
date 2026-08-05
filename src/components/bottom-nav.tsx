'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, Wrench, Info } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Mess', href: '/', icon: Utensils },
    { label: 'Maintenance', href: '/maintenance', icon: Wrench },
    { label: 'Hall Info Hub', href: '/hub', icon: Info },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav shadow-lg shadow-slate-900/10 dark:shadow-black/40">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-3 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 scale-105'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm shadow-blue-500/50" />
              )}
              <Icon className={`w-5 h-5 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

