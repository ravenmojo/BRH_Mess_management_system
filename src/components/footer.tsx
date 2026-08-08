import React from 'react';

export function Footer() {
  return (
    <div className="mt-8 pt-6 pb-2 border-t border-slate-200/80 dark:border-slate-800/80 text-center space-y-1.5 flex flex-col items-center justify-center font-sans">
      <p className="text-xs text-red-600 dark:text-red-500 font-medium">
        OpenSourced codebase at <a href="https://github.com/ravenmojo/BRH_Mess_management_system" target="_blank" rel="noreferrer" className="text-slate-900 dark:text-white hover:underline font-semibold">GitHub</a>
      </p>
      <p className="text-xs text-red-600 dark:text-red-500 flex items-center space-x-1 justify-center font-medium">
        <span>Made with</span>
        <span className="text-slate-900 dark:text-white text-xs">🫶</span>
        <span>by <span className="text-slate-900 dark:text-white font-semibold">Souradeep Satpathy</span></span>
      </p>
      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">TeNSoRE Lab, IIT Kharagpur</p>
      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-wider uppercase font-bold pt-1">
        BROS v0.9
      </p>
    </div>
  );
}
