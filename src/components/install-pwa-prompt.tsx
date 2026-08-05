'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare } from 'lucide-react';

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // Custom event listener to open prompt manually anytime (e.g. from header '+' button)
    const handleManualOpen = () => {
      setShowPrompt(true);
    };
    window.addEventListener('open-pwa-install-prompt', handleManualOpen);

    // Check if already running in standalone (installed) mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      return () => window.removeEventListener('open-pwa-install-prompt', handleManualOpen);
    }

    // Auto-show ONLY ONCE per user AND ONLY on Landing Page ('/')
    const hasBeenShownOnce = localStorage.getItem('bros_pwa_shown_once');
    const isLandingPage = window.location.pathname === '/';

    // Android / Chrome / Chromium event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!hasBeenShownOnce && isLandingPage) {
        setShowPrompt(true);
        localStorage.setItem('bros_pwa_shown_once', 'true');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIosDevice && !hasBeenShownOnce && isLandingPage) {
      setShowPrompt(true);
      localStorage.setItem('bros_pwa_shown_once', 'true');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install-prompt', handleManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem('bros_pwa_dismissed', 'true');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('bros_pwa_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 max-w-md mx-auto animate-in slide-in-from-top duration-300">
      <div className="p-4 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 text-white rounded-2xl shadow-2xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-3 pr-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold tracking-tight flex items-center space-x-1.5 text-white">
              <span>Add BROS to Home Screen</span>
            </h3>
            <p className="text-[11px] text-slate-300 leading-tight font-medium">
              Access mess menus, complaint forms & hub updates instantly with 1 tap on your phone!
            </p>
          </div>
        </div>

        {isIos ? (
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center space-x-1.5 text-blue-400 font-bold">
              <Share className="w-3.5 h-3.5" />
              <span>For iPhone / iPad Safari:</span>
            </div>
            <p className="leading-tight text-[10.5px]">
              Tap the <strong>Share</strong> icon at the bottom of Safari, then select <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-blue-400" />.
            </p>
          </div>
        ) : (
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/30 transition-all flex items-center justify-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Add Shortcut</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
