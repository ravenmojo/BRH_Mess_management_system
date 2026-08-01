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
      className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors duration-300 hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0 mr-1"
      aria-label="Go back"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );
}
