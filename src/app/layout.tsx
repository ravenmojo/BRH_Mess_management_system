import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { BottomNav } from '@/components/bottom-nav';
import { BackButton } from '@/components/back-button';
import { UtensilsCrossed } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BR Ambedkar hall Operations and Services (BROS)',
  description: 'BROS - BR Ambedkar hall Operations and Services System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} pb-20 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="sticky top-0 z-40 glass-header">
            <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <BackButton />
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-sm shadow-blue-500/20 overflow-hidden ring-1 ring-white/20">
                  <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1ee-1f1f3.svg" alt="India" className="w-5 h-5 object-contain" />
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent leading-none">BROS</h1>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                    BR Ambedkar Hall <span className="text-fuchsia-600 dark:text-fuchsia-400">Operations & Services</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="max-w-md mx-auto px-4 pt-4 pb-8 page-transition">{children}</main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}

