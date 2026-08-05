'use client';

import React from 'react';
import { Plus } from 'lucide-react';

export function PwaInstallButton() {
  const handleOpenPrompt = () => {
    window.dispatchEvent(new CustomEvent('open-pwa-install-prompt'));
  };

  return (
    <button
      onClick={handleOpenPrompt}
      className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1 border border-slate-200/60 dark:border-slate-800"
      title="Add BROS Shortcut to Home Screen"
      aria-label="Add to Home Screen"
    >
      <Plus className="w-4 h-4 font-black" />
    </button>
  );
}
