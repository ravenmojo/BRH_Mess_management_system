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
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 p-4 sm:p-5 text-white shadow-xl shadow-blue-500/20 group ring-1 ring-white/20">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/15 blur-2xl group-hover:scale-125 transition-transform duration-700 ease-out pointer-events-none" />
        <div className="absolute right-4 -bottom-6 w-28 h-28 rounded-full bg-sky-400/25 blur-xl group-hover:bg-sky-400/40 transition-all duration-700 ease-out pointer-events-none" />

        <div className="relative z-10 space-y-1">
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
        <div className="flex items-center px-1">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Today's menu</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
          {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(
            (day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`py-2 rounded-xl text-[11px] font-bold text-center transition-all duration-200 touch-spring ${selectedDay === day
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.03]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50'
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
        <div className="p-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400 glass-card rounded-2xl animate-pulse">
          Loading today's menu...
        </div>
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

            // Check if current IST time falls in this meal window
            const now = new Date();
            const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
            const istMins = (now.getUTCMinutes() + 30) % 60;
            const istTimeVal = istHours * 60 + istMins;

            const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
            const todayDay = days[now.getDay()];
            const isToday = selectedDay === todayDay;

            const isServingNow = isToday && (
              (isBreakfast && istTimeVal >= 7 * 60 + 15 && istTimeVal <= 9 * 60 + 30) ||
              (isLunch && istTimeVal >= 12 * 60 && istTimeVal <= 14 * 60 + 15) ||
              (isDinner && istTimeVal >= 19 * 60 && istTimeVal <= 21 * 60 + 15)
            );

            const isOpen = openMeal === idx;

            return (
              <div
                key={idx}
                className={`group rounded-2xl glass-card overflow-hidden transition-all duration-300 ${
                  isServingNow ? 'ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/10' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenMeal(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 outline-none cursor-pointer list-none text-left touch-spring"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl border backdrop-blur-md transition-all duration-200 ${
                        isServingNow
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : isBreakfast
                            ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                            : isLunch
                              ? 'bg-orange-500/10 dark:bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400'
                              : 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isBreakfast ? (
                        <Coffee className="w-4 h-4" />
                      ) : isLunch ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-tight">
                          {meal.mealType.toLowerCase()}
                        </span>
                        {isServingNow && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-halo-emerald" />
                            <span>Serving Now</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
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

                        const isVegGroup = group === 'Veg';
                        const isNonVegGroup = group === 'Non-Veg';
                        const isOptGroup = group.startsWith('Option');

                        return (
                          <div 
                            key={group} 
                            className={`p-2.5 rounded-xl border transition-all ${
                              isVegGroup 
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40' 
                                : isNonVegGroup 
                                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40' 
                                  : isOptGroup
                                    ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-800/40'
                                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/40'
                            }`}
                          >
                            {group !== 'Common' && (
                              <div className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${
                                isVegGroup ? 'text-emerald-700 dark:text-emerald-400' : isNonVegGroup ? 'text-rose-700 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'
                              }`}>
                                {group}
                              </div>
                            )}
                            <ul className="space-y-1.5">
                              {groupItems.map((item: any, itemIdx: number) => (
                                <li key={itemIdx} className="flex items-center text-xs text-slate-800 dark:text-slate-200 font-medium">
                                  <span className="flex items-center space-x-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      isVegGroup ? 'bg-emerald-500' : isNonVegGroup ? 'bg-rose-500' : 'bg-blue-500 dark:bg-blue-400'
                                    }`} />
                                    <span>{item.name}</span>
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

      {/* Quick Access Navigation Grid with Distinct, Classy Badges */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <Link
          href="/menu"
          className="p-3.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all flex flex-col justify-center items-center space-y-1.5 h-20 text-center group touch-spring shadow-xs"
        >
          <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Full Menu</span>
        </Link>

        <Link
          href="/night-canteen"
          className="p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-900 text-white shadow-md shadow-slate-950/20 border border-purple-500/30 hover:border-purple-400/60 hover:shadow-purple-500/5 transition-all flex flex-col justify-center items-center space-y-1.5 h-20 text-center group touch-spring"
        >
          <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 group-hover:scale-110 transition-transform">
            <Moon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold leading-tight">Canteen</span>
        </Link>

        <Link
          href="/feedback"
          className="p-3.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 hover:border-rose-400/60 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-all flex flex-col justify-center items-center space-y-1.5 h-20 text-center group touch-spring shadow-xs"
        >
          <div className="p-1.5 rounded-lg bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Grievances</span>
        </Link>

        <Link
          href="/poll"
          className="p-3.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-400/60 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all flex flex-col justify-center items-center space-y-1.5 h-20 text-center group touch-spring shadow-xs"
        >
          <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <Vote className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Mess Poll</span>
        </Link>

        <Link
          href="/gallery"
          className="p-3.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-400/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-center space-x-2.5 h-14 text-center col-span-2 group touch-spring shadow-xs"
        >
          <div className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Mess Duty Gallery</span>
        </Link>
      </div>

      {/* Admin Link */}
      <div className="pt-2 flex justify-center">
        <Link href="/admin" className="px-4 py-2 rounded-full border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm touch-spring">
          <ShieldCheck className="w-4 h-4" />
          <span>Access Mess Admin Panel</span>
        </Link>
      </div>

      <Footer />
    </div>
  );
}

