'use client';

import React from 'react';
import {
  Utensils,
  Moon,
  MessageSquare,
  Sparkles,
  Salad,
  Coffee,
  Camera,
  Trophy,
  Vote,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export function PublicDashboardPreview() {
  return (
    <div className="space-y-4 p-4 max-w-md mx-auto pointer-events-none select-none filter blur-sm opacity-35 h-screen overflow-hidden">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 p-5 text-white shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-md">
              IIT Kharagpur
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/25 text-emerald-200 backdrop-blur-md">
              Operational
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            B.R. Ambedkar Hall
          </h2>
          <p className="text-xs text-blue-100 font-medium">
            Operations & Services Management Portal
          </p>
        </div>
      </div>

      {/* Grid Quick Action Shortcuts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-900 dark:text-white">Mess Menu</div>
          <div className="text-[10px] text-slate-500">Today's Meal Schedule</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-900 dark:text-white">Grievances</div>
          <div className="text-[10px] text-slate-500">Register Issues & Complaints</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-900 dark:text-white">Maintenance</div>
          <div className="text-[10px] text-slate-500">Hall Maintenance Log</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Moon className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-900 dark:text-white">Night Canteen</div>
          <div className="text-[10px] text-slate-500">Late Night Ordering</div>
        </div>
      </div>

      {/* Hall Info Hub & Gallery Preview */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Hall Info Hub & Mess Duty Gallery</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Access announcements, movie screenings, poll voting, and duty inspection records.
        </div>
      </div>
    </div>
  );
}
