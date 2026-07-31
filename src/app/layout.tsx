import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { BottomNav } from '@/components/bottom-nav';
import { UtensilsCrossed } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BRH Mess Management System',
  description: 'BRH Hostel Mess & Night Canteen Management System (IIT Kharagpur)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} pb-20`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">BRH Mess System</h1>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide">IIT KHARAGPUR</span>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </header>
          <main className="max-w-md mx-auto px-4 pt-4">{children}</main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
