'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Sparkles } from 'lucide-react';

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<'init' | 'emblem' | 'letters' | 'tagline' | 'exit'>('init');

  useEffect(() => {
    setMounted(true);

    // Only show once per session to avoid interrupting ongoing navigation
    const hasSeenSplash = sessionStorage.getItem('bros_splash_seen');
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    // Timeline for cinematic, ultra-smooth progression (~2.6s total)
    const t0 = setTimeout(() => setPhase('emblem'), 60);
    const t1 = setTimeout(() => setPhase('letters'), 400);
    const t2 = setTimeout(() => setPhase('tagline'), 950);
    const t3 = setTimeout(() => setPhase('exit'), 2200);
    const t4 = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('bros_splash_seen', 'true');
    }, 2800);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (!mounted || !isVisible) return null;

  const letters = ['B', 'R', 'O', 'S'];

  const splashContent = (
    <div
      className={`fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#030712] select-none overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        phase === 'exit'
          ? 'opacity-0 scale-[1.04] filter blur-sm pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        width: '100vw',
        height: '100dvh',
      }}
      aria-hidden="true"
    >
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Core center indigo/blue bloom */}
        <div
          className={`w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-blue-600/25 via-indigo-500/20 to-cyan-400/15 blur-[120px] transition-all duration-1000 ease-out ${
            phase !== 'init' ? 'scale-110 opacity-100' : 'scale-75 opacity-0'
          }`}
        />
        {/* Top-right subtle violet aura */}
        <div className="absolute -top-24 -right-24 w-[380px] h-[380px] rounded-full bg-violet-600/15 blur-[100px]" />
        {/* Bottom-left subtle cyan aura */}
        <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-cyan-600/15 blur-[100px]" />
      </div>

      {/* Subtle Radial Vignette & Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,18,0.75)_100%)] pointer-events-none" />

      {/* Centered Main Brand Hero */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
        
        {/* 1. Luminous Glowing Crest Icon */}
        <div
          className={`relative mb-5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            phase !== 'init'
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-90'
          }`}
        >
          {/* Pulsing ring aura */}
          <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-blue-500/30 to-cyan-400/30 blur-lg animate-pulse" />
          
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/90 border border-blue-400/40 shadow-2xl shadow-blue-500/30 flex items-center justify-center backdrop-blur-xl group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 via-transparent to-indigo-500/20" />
            <Shield className="w-8 h-8 text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.8)]" />
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 absolute -top-1 -right-1 animate-bounce" />
          </div>
        </div>

        {/* 2. Staggered Cinematic Typography: B R O S */}
        <div className="flex items-center justify-center space-x-1 sm:space-x-2 my-1">
          {letters.map((letter, i) => {
            const isLetterVisible = phase === 'letters' || phase === 'tagline' || phase === 'exit';
            return (
              <span
                key={i}
                className={`text-6xl sm:text-7xl md:text-8xl font-black tracking-[0.14em] bg-gradient-to-b from-white via-slate-100 to-blue-300 bg-clip-text text-transparent select-none drop-shadow-[0_10px_25px_rgba(37,99,235,0.35)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isLetterVisible
                    ? 'opacity-100 translate-y-0 scale-100 blur-0'
                    : 'opacity-0 translate-y-6 scale-90 blur-sm'
                }`}
                style={{
                  transitionDelay: `${i * 90}ms`,
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        {/* 3. Shimmer Line */}
        <div
          className={`h-[1.5px] w-40 bg-gradient-to-r from-transparent via-blue-400/80 to-transparent my-3 transition-all duration-800 ease-out ${
            phase === 'letters' || phase === 'tagline' || phase === 'exit'
              ? 'opacity-100 scale-x-100'
              : 'opacity-0 scale-x-0'
          }`}
        />

        {/* 4. Subtitle & Tagline Block */}
        <div
          className={`flex flex-col items-center space-y-2.5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            phase === 'tagline' || phase === 'exit'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Hall Name & Campus */}
          <div className="space-y-0.5">
            <p className="text-[11px] sm:text-xs font-black tracking-[0.26em] uppercase bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent">
              BR Ambedkar hall
            </p>
            <p className="text-[9.5px] sm:text-[10px] font-bold tracking-[0.3em] uppercase text-cyan-400">
              IIT Kharagpur
            </p>
          </div>

          {/* Three Pillars Badge */}
          <div className="mt-1 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-blue-500/25 backdrop-blur-md shadow-lg shadow-black/50 flex items-center space-x-2 text-[9px] sm:text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
            <span className="text-blue-400">Responsibility</span>
            <span className="w-1 h-1 rounded-full bg-blue-500/60" />
            <span className="text-cyan-400">Accountability</span>
            <span className="w-1 h-1 rounded-full bg-blue-500/60" />
            <span className="text-indigo-400">Transparency</span>
          </div>

          {/* Slogan */}
          <p className="text-[10px] sm:text-[10.5px] font-bold tracking-[0.2em] uppercase text-slate-400 pt-1">
            For the Bros, by the Bros
          </p>
        </div>
      </div>

      {/* Subtle Bottom Ambient Indicator */}
      <div
        className={`absolute bottom-8 flex flex-col items-center space-y-2 transition-all duration-700 ${
          phase === 'tagline' || phase === 'exit' ? 'opacity-80' : 'opacity-0'
        }`}
      >
        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-[shimmer_1.5s_infinite_linear]" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );

  return createPortal(splashContent, document.body);
}
