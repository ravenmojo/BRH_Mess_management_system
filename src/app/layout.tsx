import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { BottomNav } from '@/components/bottom-nav';
import { BackButton } from '@/components/back-button';
import { InstallPwaPrompt } from '@/components/install-pwa-prompt';
import { SwipeNavigationProvider } from '@/components/swipe-navigation-provider';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: 'BR Ambedkar Hall Operations and Services (BROS)',
  description: 'BROS - BR Ambedkar Hall Operations and Services System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BROS',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${plusJakartaSans.className} pb-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased relative selection:bg-blue-500 selection:text-white`}>
        {/* Ambient Luminous Mesh Gradient Orbs - Prismatic Jewel Tones */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/10 blur-[130px] dark:from-indigo-600/30 dark:via-violet-600/25 dark:to-cyan-600/20" />
          <div className="absolute top-[35%] -right-[15%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-cyan-400/20 via-teal-400/15 to-emerald-400/10 blur-[110px] dark:from-cyan-500/20 dark:via-blue-600/15 dark:to-transparent" />
          <div className="absolute bottom-[5%] -left-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-400/20 via-rose-400/15 to-indigo-500/15 blur-[120px] dark:from-violet-800/25 dark:via-fuchsia-700/20 dark:to-indigo-900/20" />
        </div>

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <InstallPwaPrompt />
          <header className="sticky top-0 z-40 glass-header">
            <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <BackButton />
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-sm shadow-blue-500/20 overflow-hidden ring-1 ring-white/20">
                  <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1ee-1f1f3.svg" alt="India" className="w-5 h-5 object-contain" />
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent leading-none">BROS</h1>
                  <span className="text-[9px] sm:text-[10px] tracking-wider sm:tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                    BR Ambedkar Hall <span className="text-fuchsia-600 dark:text-fuchsia-400">Online Services portal</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <PwaInstallButton />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="max-w-md mx-auto px-4 pt-4 pb-8 relative z-10">
            <SwipeNavigationProvider>
              {children}
            </SwipeNavigationProvider>
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}

