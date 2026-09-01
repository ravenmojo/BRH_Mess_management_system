'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const HOME_PAGES = ['/', '/maintenance', '/hub'];

interface SwipeNavContextType {
  slideDirection: 'left' | 'right' | 'none';
  currentPageIndex: number;
}

const SwipeNavContext = createContext<SwipeNavContextType>({
  slideDirection: 'none',
  currentPageIndex: -1,
});

export const useSwipeNav = () => useContext(SwipeNavContext);

export function SwipeNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const prevPathRef = useRef<string>(pathname);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none');

  const currentIndex = HOME_PAGES.indexOf(pathname);

  // Pre-fetch all 3 home routes on load for instant navigation
  useEffect(() => {
    HOME_PAGES.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {}
    });
  }, [router]);

  // Compute slide animation direction whenever pathname changes
  useEffect(() => {
    const prevPath = prevPathRef.current;
    if (prevPath !== pathname) {
      const prevIdx = HOME_PAGES.indexOf(prevPath);
      const currIdx = HOME_PAGES.indexOf(pathname);

      if (prevIdx !== -1 && currIdx !== -1) {
        if (currIdx > prevIdx) {
          setSlideDirection('left'); // Moving forward: new page slides in from right
        } else if (currIdx < prevIdx) {
          setSlideDirection('right'); // Moving backward: new page slides in from left
        }
      } else {
        setSlideDirection('none');
      }
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  // Touch Gesture Handling
  const touchStartRef = useRef<{ x: number; y: number; time: number; valid: boolean }>({
    x: 0,
    y: 0,
    time: 0,
    valid: false,
  });

  // Returns true if an interactive text element currently has focus (keyboard open)
  const isInputFocused = (): boolean => {
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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (currentIndex === -1) return; // Only active on the 3 primary home pages
    if (e.touches.length !== 1) return;

    // Block swipe when any text input currently has keyboard focus
    if (isInputFocused()) {
      touchStartRef.current.valid = false;
      return;
    }

    const touch = e.touches[0];
    const target = e.target as HTMLElement | null;

    // Ignore swipe that starts directly on an interactive / form element
    if (target) {
      const isInteractive = target.closest(
        'input, textarea, select, button, [role="dialog"], [data-no-swipe="true"], .overflow-x-auto'
      );
      if (isInteractive) {
        touchStartRef.current.valid = false;
        return;
      }
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      valid: true,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current.valid || currentIndex === -1) return;
    if (e.changedTouches.length !== 1) return;

    // Also suppress at lift-time in case focus moved during the gesture
    if (isInputFocused()) {
      touchStartRef.current.valid = false;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    touchStartRef.current.valid = false;

    // Require distinct horizontal gesture:
    // 1. Min horizontal distance of 45px
    // 2. Horizontal movement must dominate vertical scrolling by 1.25x
    // 3. Must be completed within 650ms
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX >= 45 && absX > absY * 1.25 && duration <= 650) {
      if (deltaX < 0) {
        // Swiped Left -> Move to Next Home Page
        if (currentIndex < HOME_PAGES.length - 1) {
          const nextRoute = HOME_PAGES[currentIndex + 1];
          setSlideDirection('left');
          router.push(nextRoute);
        }
      } else if (deltaX > 0) {
        // Swiped Right -> Move to Previous Home Page
        if (currentIndex > 0) {
          const prevRoute = HOME_PAGES[currentIndex - 1];
          setSlideDirection('right');
          router.push(prevRoute);
        }
      }
    }
  };

  // Keyboard navigation support (Desktop Left/Right Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex === -1) return;

      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === 'ArrowRight' && currentIndex < HOME_PAGES.length - 1) {
        setSlideDirection('left');
        router.push(HOME_PAGES[currentIndex + 1]);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setSlideDirection('right');
        router.push(HOME_PAGES[currentIndex - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, router]);

  // Determine container animation class
  const animationClass =
    currentIndex !== -1
      ? slideDirection === 'left'
        ? 'slide-in-right'
        : slideDirection === 'right'
          ? 'slide-in-left'
          : 'page-transition'
      : 'page-transition';

  return (
    <SwipeNavContext.Provider value={{ slideDirection, currentPageIndex: currentIndex }}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full min-h-[calc(100vh-8rem)] touch-pan-y"
      >
        <div key={pathname} className={`${animationClass} w-full`}>
          {children}
        </div>
      </div>
    </SwipeNavContext.Provider>
  );
}
