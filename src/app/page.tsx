'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Moon,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Salad,
  Clock,
  ChevronDown,
  ShieldCheck,
  Coffee,
  Sun,
  BookOpen,
  Camera,
  Trophy,
  Vote,
} from 'lucide-react';

import { SplashScreen } from '@/components/splash-screen';

export default function StudentDashboard() {
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openMeal, setOpenMeal] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');

  useEffect(() => {
    // Determine current day of week
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = days[new Date().getDay()];
    setSelectedDay(currentDay);

    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        setWeeklyData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentDayMenu = weeklyData?.menu?.find((m: any) => m.dayOfWeek === selectedDay);
  const metrics = weeklyData?.validation?.metrics;

  return (
    <div className="space-y-6 pb-8">
      <SplashScreen />
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 p-3.5 text-white shadow-md shadow-blue-500/15 group">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-700 ease-out pointer-events-none" />
        <div className="absolute right-4 -bottom-6 w-24 h-24 rounded-full bg-blue-400/20 blur-xl group-hover:bg-sky-400/35 transition-all duration-700 ease-out pointer-events-none" />

        <div className="relative z-10 space-y-0.5">
          <h2 className="text-base sm:text-lg font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
            <span>BROS Mess Management</span>
          </h2>
          <p className="text-xs text-blue-100 font-medium leading-snug">
            Who are we to Mess with you, bros! 🗿
          </p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Today's menu</span>
          </div>
          <Link
            href="/menu"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1 transition-colors"
          >
            <span>Full Week</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
          {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(
            (day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`py-2 rounded-xl text-[11px] font-bold text-center transition-all duration-200 ${selectedDay === day
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                {day.substring(0, 3)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Selected Day Meal Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400 glass-card rounded-2xl">Loading today's menu...</div>
      ) : currentDayMenu ? (
        <div className="space-y-3">
          {currentDayMenu.meals.map((meal: any, idx: number) => {
            const isBreakfast = meal.mealType === 'BREAKFAST';
            const isLunch = meal.mealType === 'LUNCH';
            const isDinner = meal.mealType === 'DINNER';

            const mealTime = isBreakfast
              ? '07:15 AM - 09:30 AM'
              : isLunch
                ? '12:00 PM - 02:15 PM'
                : '07:00 PM - 09:15 PM';

            const isOpen = openMeal === idx;

            return (
              <div
                key={idx}
                className="group rounded-2xl glass-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenMeal(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 outline-none cursor-pointer list-none text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40">
                      {isBreakfast ? (
                        <Coffee className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : isLunch ? (
                        <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {meal.mealType.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{mealTime}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ml-1 text-slate-400 ${isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
                  </div>
                </button>

                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="space-y-2 p-4 pt-0 mt-0 border-t border-slate-100 dark:border-slate-800/80">
                      {['Common', 'Option 1', 'Option 2', 'Veg', 'Non-Veg'].map((group) => {
                        const groupItems = meal.items.filter((i: any) => (i.optionGroup || 'Common') === group);
                        if (groupItems.length === 0) return null;
                        return (
                          <div key={group} className="bg-slate-100/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-700/30">
                            {group !== 'Common' && (
                              <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">{group}</div>
                            )}
                            <ul className="space-y-1.5">
                              {groupItems.map((item: any, itemIdx: number) => (
                                <li key={itemIdx} className="flex items-center text-xs text-slate-700 dark:text-slate-300">
                                  <span className="flex items-center space-x-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                                    <span className="font-semibold">{item.name}</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-2xl glass-card text-center text-xs font-semibold text-slate-500">
          No menu items listed for {selectedDay}.
        </div>
      )}

      {/* Quick Access Navigation Grid */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <Link
          href="/menu"
          className="p-3.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex flex-col justify-center items-center space-y-1.5 h-20 text-center group"
        >
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Full Menu</span>
        </Link>

        <Link
          href="/night-canteen"
          className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white shadow-md shadow-indigo-950/20 hover:opacity-95 transition-all flex flex-col justify-center items-center space-y-1.5 h-20 text-center group ring-1 ring-white/10"
        >
          <Moon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold leading-tight">Canteen</span>
        </Link>

        <Link
          href="/feedback"
          className="p-3.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex flex-col justify-center items-center space-y-1.5 h-20 text-center group"
        >
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Grievances</span>
        </Link>

        <Link
          href="/poll"
          className="p-3.5 rounded-2xl glass-card border border-indigo-200/80 dark:border-indigo-800/80 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all flex flex-col justify-center items-center space-y-1.5 h-20 text-center group"
        >
          <Vote className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Mess Poll</span>
        </Link>

        <Link
          href="/gallery"
          className="p-3.5 rounded-2xl glass-card border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all flex flex-col justify-center items-center space-y-1.5 h-20 text-center col-span-2 group"
        >
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Mess Duty Gallery</span>
          </div>
        </Link>
      </div>

      {/* Admin Link */}
      <div className="pt-2 flex justify-center">
        <Link href="/admin" className="px-4 py-2 rounded-full border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Access Mess Admin Panel</span>
        </Link>
      </div>

      <Footer />
    </div>
  );
}

