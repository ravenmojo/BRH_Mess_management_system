'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

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
    <div className="space-y-5 pb-8">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-600 to-blue-800 p-4 text-white shadow-lg group">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl group-hover:scale-[1.2] group-hover:opacity-20 transition-all duration-1000 ease-in-out"></div>
        <div className="absolute right-4 -bottom-6 w-24 h-24 rounded-full bg-blue-400 opacity-30 blur-xl group-hover:bg-sky-400/50 group-hover:-translate-y-2 transition-all duration-1000 ease-in-out"></div>

        <div className="relative z-10 space-y-0.5">
          <h2 className="text-lg font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
            <span className="text-2xl drop-shadow-lg">🗿</span>
            <span>BROS Mess</span>
          </h2>
          <p className="text-[11px] text-indigo-100 font-medium max-w-[280px]">
            View daily menus, lodge complaints, and more.
          </p>
        </div>
      </div>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white pt-2">Mess</h1>



      {/* Day Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5 text-sm font-semibold text-gray-900 dark:text-white">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Today's menu</span>
          </div>
          <Link
            href="/menu"
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-0.5"
          >
            <span>Full Week</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(
            (day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedDay === day
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
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
        <div className="p-8 text-center text-sm text-gray-500">Loading today's menu...</div>
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
                className="group rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenMeal(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 outline-none cursor-pointer list-none"
                >
                  <div className="flex items-center space-x-2">
                    {isBreakfast ? (
                      <Coffee className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : isLunch ? (
                      <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                      {meal.mealType.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{mealTime}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ml-1 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="space-y-1.5 p-4 pt-0 mt-0 border-t border-gray-100 dark:border-gray-800">
                      {['Common', 'Option 1', 'Option 2', 'Veg', 'Non-Veg'].map((group) => {
                        const groupItems = meal.items.filter((i: any) => (i.optionGroup || 'Common') === group);
                        if (groupItems.length === 0) return null;
                        return (
                          <div key={group} className="bg-gray-50 dark:bg-gray-800/40 p-2 rounded-lg">
                            {group !== 'Common' && (
                              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">{group}</div>
                            )}
                            <ul className="space-y-1.5">
                              {groupItems.map((item: any, itemIdx: number) => (
                                <li key={itemIdx} className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                                  <span className="flex items-center space-x-1.5">
                                    <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                                    <span className="font-medium">{item.name}</span>
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
        <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 text-center text-xs text-gray-500">
          No menu items listed for {selectedDay}.
        </div>
      )}

      {/* Quick Access Navigation Grid */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <Link
          href="/menu"
          className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-500 transition-colors flex flex-col justify-center items-center space-y-1.5 h-20 text-center group"
        >
          <Utensils className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">Full Menu</span>
        </Link>

        <Link
          href="/night-canteen"
          className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-md hover:opacity-90 transition-opacity flex flex-col justify-center items-center space-y-1.5 h-20 text-center group"
        >
          <Moon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-bold leading-tight">Canteen</span>
        </Link>

        <Link
          href="/feedback"
          className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-500 transition-colors flex flex-col justify-center items-center space-y-1.5 h-20 text-center group"
        >
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">Complaints & Feedback</span>
        </Link>
      </div>

      {/* Admin Link */}
      <div className="pt-2 flex justify-center">
        <Link href="/admin" className="px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
          <ShieldCheck className="w-4 h-4" />
          <span>Access Mess Admin Panel</span>
        </Link>
      </div>
    </div>
  );
}
