'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
}

const THRESHOLD = 55; // Distance in px required to trigger refresh
const MAX_PULL = 85; // Maximum pull distance in px

export function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    valid: boolean;
  }>({
    x: 0,
    y: 0,
    time: 0,
    valid: false,
  });

  const isRefreshingRef = useRef(false);
  isRefreshingRef.current = isRefreshing;

  // Returns true if an interactive element currently has focus (keyboard open)
  const isInteractiveActive = (): boolean => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      (el as HTMLElement).isContentEditable
    );
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(52); // Keep indicator held visible during refresh

    try {
      // Revalidate Next.js server components and routes
      router.refresh();

      // Dispatch client custom event so any active data views can immediately re-fetch
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-pull-refresh'));
      }

      // Guarantee smooth visual feedback duration
      await new Promise((resolve) => setTimeout(resolve, 750));
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setHasTriggered(false);
      setIsPulling(false);
    }
  }, [router]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (e.touches.length !== 1) return;

      // Only allow pull-to-refresh when user is at the absolute top of the page
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop > 2) {
        touchStartRef.current.valid = false;
        return;
      }

      // Block if interactive input has keyboard focus
      if (isInteractiveActive()) {
        touchStartRef.current.valid = false;
        return;
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = target.closest(
          'input, textarea, select, button, [role="dialog"], [data-no-pull="true"]'
        );
        if (isInteractive) {
          touchStartRef.current.valid = false;
          return;
        }
      }

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        valid: true,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current.valid || isRefreshingRef.current) return;
      if (e.touches.length !== 1) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop > 2) {
        if (pullDistance > 0) {
          setPullDistance(0);
          setIsPulling(false);
        }
        return;
      }

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Only process vertical downward movement
      if (deltaY > 5 && deltaY > Math.abs(deltaX) * 1.1) {
        // Prevent default only when actively performing a downward pull at scroll top
        if (e.cancelable) {
          e.preventDefault();
        }

        setIsPulling(true);
        // Damping formula for smooth logarithmic resistance
        const damped = Math.min(MAX_PULL, deltaY * 0.42);
        setPullDistance(damped);

        if (damped >= THRESHOLD && !hasTriggered) {
          setHasTriggered(true);
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(12);
            }
          } catch {}
        } else if (damped < THRESHOLD && hasTriggered) {
          setHasTriggered(false);
        }
      } else if (deltaY <= 0) {
        if (pullDistance > 0) {
          setPullDistance(0);
          setIsPulling(false);
        }
      }
    };

    const onTouchEnd = () => {
      if (!touchStartRef.current.valid || isRefreshingRef.current) return;
      touchStartRef.current.valid = false;

      if (pullDistance >= THRESHOLD) {
        handleRefresh();
      } else {
        setIsPulling(false);
        setPullDistance(0);
        setHasTriggered(false);
      }
    };

    // Desktop mouse drag support for testing / emulation
    let isMouseDown = false;
    let mouseStartY = 0;
    let mouseStartX = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (isRefreshingRef.current) return;
      if (e.button !== 0) return; // Left click only

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop > 2) return;
      if (isInteractiveActive()) return;

      const target = e.target as HTMLElement | null;
      if (target && target.closest('input, textarea, select, button, a, [role="dialog"], [data-no-pull="true"]')) {
        return;
      }

      isMouseDown = true;
      mouseStartY = e.clientY;
      mouseStartX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || isRefreshingRef.current) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop > 2) {
        if (pullDistance > 0) {
          setPullDistance(0);
          setIsPulling(false);
        }
        isMouseDown = false;
        return;
      }

      const deltaY = e.clientY - mouseStartY;
      const deltaX = e.clientX - mouseStartX;

      if (deltaY > 5 && deltaY > Math.abs(deltaX) * 1.1) {
        setIsPulling(true);
        const damped = Math.min(MAX_PULL, deltaY * 0.42);
        setPullDistance(damped);

        if (damped >= THRESHOLD && !hasTriggered) {
          setHasTriggered(true);
        } else if (damped < THRESHOLD && hasTriggered) {
          setHasTriggered(false);
        }
      } else if (deltaY <= 0) {
        if (pullDistance > 0) {
          setPullDistance(0);
          setIsPulling(false);
        }
      }
    };

    const onMouseUp = () => {
      if (!isMouseDown || isRefreshingRef.current) return;
      isMouseDown = false;

      if (pullDistance >= THRESHOLD) {
        handleRefresh();
      } else {
        setIsPulling(false);
        setPullDistance(0);
        setHasTriggered(false);
      }
    };

    // Attach non-passive touch listeners to support smooth pull-to-refresh without scroll-chain lag
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);

      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [pullDistance, hasTriggered, handleRefresh]);

  // Visual opacity & progress calculation
  const progress = Math.min(1, pullDistance / THRESHOLD);
  const showIndicator = pullDistance > 8 || isRefreshing;
  const rotationDegrees = Math.min(180, (pullDistance / THRESHOLD) * 180);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Floating Glassmorphic Pull-to-Refresh Indicator */}
      <div
        className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 ${
          showIndicator ? 'opacity-100' : 'opacity-0 -translate-y-4'
        }`}
        style={{
          transform: showIndicator
            ? `translate(-50%, ${Math.min(pullDistance * 0.7, 48)}px) scale(${
                isRefreshing ? 1 : 0.75 + progress * 0.25
              })`
            : 'translate(-50%, -16px) scale(0.7)',
        }}
        aria-hidden={!showIndicator}
      >
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-xl shadow-slate-900/10 dark:shadow-black/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08]">
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                Refreshing...
              </span>
            </>
          ) : hasTriggered ? (
            <>
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center shrink-0">
                <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400 rotate-180 transition-transform duration-200" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                Release to refresh
              </span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <ArrowDown
                  className="w-3 h-3 text-slate-600 dark:text-slate-300 transition-transform duration-100"
                  style={{ transform: `rotate(${rotationDegrees}deg)` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 tracking-tight">
                Pull to refresh
              </span>
            </>
          )}
        </div>
      </div>

      {/* Page Content with Spring Rubber-Band Translation */}
      <div
        style={{
          transform:
            pullDistance > 0 ? `translateY(${pullDistance * 0.35}px)` : 'none',
          transition: isPulling
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className="w-full"
      >
        {children}
      </div>
    </div>
  );
}
