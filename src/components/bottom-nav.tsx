'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, Wrench, Info } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Mess',
      href: '/',
      icon: Utensils,
      activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
      iconGlow: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Maintenance',
      href: '/maintenance',
      icon: Wrench,
      activeClass: 'bg-sky-600 text-white shadow-md shadow-sky-600/25',
      iconGlow: 'text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Hall Info Hub',
      href: '/hub',
      icon: Info,
      activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25',
      iconGlow: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  return (
    <nav className="fixed bottom-3.5 left-0 right-0 z-50 px-3 flex justify-center pointer-events-none">
      <div className="max-w-[360px] sm:max-w-sm w-full mx-auto pointer-events-auto rounded-full p-1.5 glass-dock flex items-center justify-around relative border border-white/40 dark:border-slate-700/60 shadow-2xl backdrop-blur-3xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-center space-x-1.5 px-4 py-2 rounded-full text-xs font-black transition-all duration-300 touch-spring ${
                isActive
                  ? `${item.activeClass} scale-[1.04]`
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform duration-300 ${
                  isActive ? 'scale-110' : item.iconGlow
                }`}
              />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

