'use client';

import React, { useEffect, useState } from 'react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [lettersReady, setLettersReady] = useState(false);
  const [glowActive, setGlowActive] = useState(false);
  const [taglineReady, setTaglineReady] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only show once per session
    const hasSeenSplash = sessionStorage.getItem('bros_splash_seen');
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    // Phase timeline (~3.5s total)
    const t0 = setTimeout(() => setLettersReady(true), 50);
    const t1 = setTimeout(() => setGlowActive(true), 850);
    const t2 = setTimeout(() => setTaglineReady(true), 1200);
    const t3 = setTimeout(() => setExiting(true), 2800);
    const t4 = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('bros_splash_seen', 'true');
    }, 3500);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (!isVisible) return null;

  const letters = ['B', 'R', 'O', 'S'];

  return (
    <>
      <style jsx>{`
        @keyframes letterDrop {
          0% {
            opacity: 0;
            transform: translateY(-60px) scale(0.6);
            filter: blur(12px);
          }
          60% {
            opacity: 1;
            transform: translateY(6px) scale(1.05);
            filter: blur(0px);
          }
          80% {
            opacity: 1;
            transform: translateY(-2px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes glowPulse {
          0% {
            text-shadow: 0 0 20px rgba(96, 165, 250, 0), 0 0 40px rgba(96, 165, 250, 0);
          }
          50% {
            text-shadow: 0 0 30px rgba(96, 165, 250, 0.4), 0 0 60px rgba(96, 165, 250, 0.2), 0 0 100px rgba(59, 130, 246, 0.1);
          }
          100% {
            text-shadow: 0 0 10px rgba(96, 165, 250, 0.15), 0 0 25px rgba(96, 165, 250, 0.08);
          }
        }

        @keyframes shimmerLine {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0.6; }
        }

        .letter-animate {
          animation: letterDrop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .glow-active {
          animation: glowPulse 1s ease-out forwards;
        }

        .shimmer-line {
          animation: shimmerLine 0.6s ease-out forwards;
          transform-origin: center;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 transition-all duration-700 ease-in-out ${
          exiting
            ? 'opacity-0 scale-[1.02] pointer-events-none'
            : 'opacity-100 scale-100'
        }`}
      >
        {/* Ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-blue-600/8 blur-[100px] pointer-events-none" />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-all duration-1000 ${
            glowActive ? 'bg-blue-500/15 scale-125' : 'bg-blue-500/5 scale-100'
          }`}
        />

        {/* Content — dead center */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* BROS Letters */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
            {letters.map((letter, i) => (
              <span
                key={i}
                className={`text-7xl sm:text-8xl md:text-9xl font-black tracking-[0.15em] bg-gradient-to-b from-white via-blue-100 to-blue-400 bg-clip-text text-transparent select-none ${
                  lettersReady ? 'letter-animate' : 'opacity-0'
                } ${glowActive ? 'glow-active' : ''}`}
                style={{
                  animationDelay: lettersReady ? `${i * 120}ms` : '0ms',
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Shimmer underline */}
          <div
            className={`mt-3 h-[1.5px] w-36 bg-gradient-to-r from-transparent via-blue-400/70 to-transparent ${
              glowActive ? 'shimmer-line' : 'opacity-0'
            }`}
          />

          {/* Taglines — single block, pure opacity fade, no layout shift */}
          <div
            className={`mt-6 flex flex-col items-center space-y-2 transition-opacity duration-700 ease-out ${
              taglineReady ? 'opacity-100' : 'opacity-0'
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
            <p className="text-[10px] sm:text-[11px] font-black tracking-[0.25em] uppercase text-indigo-400 pt-2">
              IIT Kharagpur
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
