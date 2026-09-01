'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

export function PwaInstallButton() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  const handleOpenPrompt = () => {
    window.dispatchEvent(new CustomEvent('open-pwa-install-prompt'));
  };

  if (isStandalone) {
    return null;
  }

  return (
    <button
      onClick={handleOpenPrompt}
      className="group flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-extrabold shadow-md shadow-blue-500/25 border border-blue-400/40 transition-all duration-200 hover:scale-105 active:scale-95 touch-spring shrink-0 mr-1.5"
      title="Install BROS App / Add to Home Screen"
      aria-label="Add BROS to Home Screen"
    >
      <Smartphone className="w-3.5 h-3.5 text-blue-100 group-hover:scale-110 transition-transform" />
      <span className="leading-none">Install</span>
    </button>
  );
}
