import React from 'react';

export function Footer() {
  return (
    <footer className="mt-10 pt-6 pb-20 border-t border-slate-200/80 dark:border-slate-800/80 text-center space-y-2 flex flex-col items-center justify-center font-sans">
      <p className="text-xs text-red-600 dark:text-red-500 font-medium">
        Codebase at <a href="https://github.com/ravenmojo/BRH_Mess_management_system" target="_blank" rel="noreferrer" className="text-slate-900 dark:text-white hover:underline font-semibold">GitHub</a>
      </p>
      <p className="text-xs text-red-600 dark:text-red-500 flex items-center space-x-1 justify-center font-medium">
        <span>Made with</span>
        <span className="text-slate-900 dark:text-white text-xs">🫶</span>
        <span>by <span className="text-slate-900 dark:text-white font-semibold">Souradeep Satpathy</span></span>
      </p>
      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">TeNSoRE Lab, IIT Kharagpur</p>
      <div className="pt-1.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          BROS 1.0.0
        </span>
      </div>
    </footer>
  );
}
