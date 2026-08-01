'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wrench } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Mess', href: '/', icon: Home },
    { label: 'Maintenance', href: '/maintenance', icon: Wrench },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
