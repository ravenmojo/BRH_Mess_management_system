import React from 'react';

export function Footer() {
  return (
    <div className="mt-8 pt-8 pb-2 border-t border-gray-200 dark:border-gray-800 text-center space-y-1.5 flex flex-col items-center justify-center font-serif">
      <p className="text-sm text-red-600 dark:text-red-500">
        OpenSourced codebase at <a href="https://github.com/ravenmojo/BRH_Mess_management_system" className="text-gray-900 dark:text-white hover:underline">GitHub</a>
      </p>
      <p className="text-sm text-red-600 dark:text-red-500 flex items-center space-x-1 justify-center">
        <span>Made with</span>
        <span className="text-gray-900 dark:text-white text-xs">🫶</span>
        <span>by <span className="text-gray-900 dark:text-white">Souradeep Satpathy</span></span>
      </p>
      <p className="text-sm text-gray-900 dark:text-white pt-0.5">TeNSoRE Lab, IIT Kharagpur</p>
    </div>
  );
}
