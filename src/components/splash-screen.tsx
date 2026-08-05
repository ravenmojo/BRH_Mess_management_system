'use client';

import React, { useEffect, useState } from 'react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<'enter' | 'active' | 'fade-out'>('enter');

  useEffect(() => {
    // Only show once per session
    const hasSeenSplash = sessionStorage.getItem('bros_splash_seen');
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    const t1 = setTimeout(() => setPhase('active'), 100);
    const t2 = setTimeout(() => setPhase('fade-out'), 2200);
    const t3 = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('bros_splash_seen', 'true');
    }, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-all duration-700 ease-in-out ${phase === 'fade-out' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
    >
      {/* Subtle background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-blue-600/20 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute w-56 h-56 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Main BROS Logo */}
        <div
          className={`transition-all duration-1000 ease-out transform ${phase === 'enter'
            ? 'opacity-0 scale-75 translate-y-4 filter blur-sm'
            : 'opacity-100 scale-100 translate-y-0 filter-none'
            }`}
        >
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-widest bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_10px_25px_rgba(59,130,246,0.3)]">
            BROS
          </h1>
        </div>

        {/* Tagline */}
        <div
          className={`mt-3 transition-all duration-1000 delay-300 ease-out transform ${phase === 'enter'
            ? 'opacity-0 translate-y-2'
            : 'opacity-100 translate-y-0'
            }`}
        >
          <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-blue-200/90 bg-blue-950/60 px-4 py-1.5 rounded-full border border-blue-500/30 backdrop-blur-md shadow-lg shadow-blue-950/50">
            for the bros by the bros
          </p>
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-blue-200/90 bg-blue-950/60 px-4 py-1.5 rounded-full border border-blue-500/30 backdrop-blur-md shadow-lg shadow-blue-950/50">
            Responsibility, Accountability, Transparency
          </p>
        </div>
      </div>
    </div>
  );
}

