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
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 text-white transition-all duration-700 ease-in-out ${
        phase === 'fade-out' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-80 h-80 rounded-full bg-indigo-500/15 blur-[80px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-[45%] -translate-y-[50%] w-40 h-40 rounded-full bg-sky-400/10 blur-[60px] pointer-events-none" />

      {/* Content container — true center using flex on parent */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Main BROS Logo */}
        <div
          className={`transition-all duration-1000 ease-out transform ${
            phase === 'enter'
              ? 'opacity-0 scale-75 translate-y-4 blur-sm'
              : 'opacity-100 scale-100 translate-y-0 blur-0'
          }`}
        >
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-[0.2em] bg-gradient-to-b from-white via-blue-200 to-blue-400 bg-clip-text text-transparent leading-none" style={{ WebkitTextStroke: '0.5px rgba(147,197,253,0.15)' }}>
            BROS
          </h1>
          {/* Reflection glow under the text */}
          <div className="mx-auto mt-2 h-px w-32 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
        </div>

        {/* Taglines — stacked with subtle stagger delay */}
        <div
          className={`mt-6 flex flex-col items-center space-y-2 transition-all duration-1000 delay-300 ease-out transform ${
            phase === 'enter'
              ? 'opacity-0 translate-y-3'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-blue-300/90">
            for the bros by the bros
          </p>
          <div className="flex items-center space-x-2.5 text-[10px] sm:text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-400">
            <span>Responsibility</span>
            <span className="w-1 h-1 rounded-full bg-blue-500/70" />
            <span>Accountability</span>
            <span className="w-1 h-1 rounded-full bg-blue-500/70" />
            <span>Transparency</span>
          </div>
        </div>
      </div>
    </div>
  );
}
