'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [stage, setStage] = useState<'init' | 'hero' | 'tagline' | 'exit'>('init');

  useEffect(() => {
    // Check if splash has already been shown in this session
    const hasSeenSplash = sessionStorage.getItem('bros_splash_seen');
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    // Choreographed animation sequence
    const t1 = setTimeout(() => setStage('hero'), 300);     // Hero BROS entrance
    const t2 = setTimeout(() => setStage('tagline'), 1200); // Tagline reveal
    const t3 = setTimeout(() => setStage('exit'), 2800);    // Start exit transition
    const t4 = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('bros_splash_seen', 'true');
    }, 3400); // Remove from DOM

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      onClick={() => {
        setIsVisible(false);
        sessionStorage.setItem('bros_splash_seen', 'true');
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-slate-950 text-white select-none cursor-pointer overflow-hidden transition-all duration-700 ease-in-out ${
        stage === 'exit' ? 'opacity-0 scale-105 blur-md pointer-events-none' : 'opacity-100 scale-100 blur-none'
      }`}
    >
      {/* Background Cyber Grid & Glowing Ambient Lights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] animate-glow-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] animate-glow-pulse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 pt-12 flex items-center justify-center">
        <div
          className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-lg transition-all duration-700 ${
            stage !== 'init' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>BR Ambedkar Hall • IIT Kharagpur</span>
        </div>
      </div>

      {/* Main Center Content: BROS ONLY */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 max-w-sm px-6 text-center my-auto">
        
        {/* Main BROS Logo */}
        <div
          className={`transition-all duration-1000 ease-out transform ${
            stage === 'init'
              ? 'opacity-0 scale-75 blur-md'
              : 'opacity-100 scale-100 blur-none'
          }`}
        >
          <div className="relative inline-block">
            {/* Ambient Backlight Glow behind BROS */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-3xl blur-2xl opacity-40 animate-glow-pulse" />
            
            {/* Hero BROS Text */}
            <h1 className="relative text-7xl sm:text-8xl font-black tracking-tighter bg-gradient-to-r from-white via-sky-200 to-cyan-400 bg-clip-text text-transparent text-glow-lg drop-shadow-[0_10px_35px_rgba(56,189,248,0.4)]">
              BROS
            </h1>
          </div>
        </div>

        {/* Divider Line */}
        <div
          className={`h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent transition-all duration-1000 ease-in-out ${
            stage === 'tagline' || stage === 'exit' ? 'w-48 opacity-100' : 'w-0 opacity-0'
          }`}
        />

        {/* Official Tagline */}
        <div
          className={`transition-all duration-700 delay-150 ease-out ${
            stage === 'tagline' || stage === 'exit'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-xs sm:text-sm font-bold tracking-[0.25em] text-transparent bg-gradient-to-r from-sky-200 via-blue-100 to-sky-300 bg-clip-text uppercase flex items-center justify-center space-x-2">
            <span className="text-sky-400">FOR THE BROS,</span>
            <span className="text-indigo-400">BY THE BROS</span>
          </p>
        </div>
      </div>

      {/* Bottom Footer & Progress Bar */}
      <div className="relative z-10 pb-10 flex flex-col items-center space-y-3">
        <div className="w-40 h-1 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50 backdrop-blur-sm">
          <div
            className={`h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-[2400ms] ease-out ${
              stage !== 'init' ? 'w-full' : 'w-0'
            }`}
          />
        </div>
        
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium tracking-widest uppercase">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Tap anywhere to skip</span>
        </div>
      </div>
    </div>
  );
}
