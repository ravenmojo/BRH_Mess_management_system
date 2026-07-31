'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Moon,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Salad,
  Clock,
} from 'lucide-react';

export default function StudentDashboard() {
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-5 text-white shadow-lg">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>BRH Hall of Residence</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Regular Mess & Canteen Hub</h2>
          <p className="text-xs text-indigo-100 max-w-[280px]">
            Track your daily menu, weekly budget status, and night canteen offerings in real-time.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Budget & Compliance Metrics Bar */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1: Budget Tracker */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Weekly Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ₹{metrics?.totalWeeklyCost ?? 826}
            </span>
            <span className="text-[11px] text-gray-500">/ ₹826</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (metrics?.totalWeeklyCost ?? 826) <= 826 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min(100, ((metrics?.totalWeeklyCost ?? 826) / 826) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-500">Max ₹118 / day budget cap</p>
        </div>

        {/* Metric 2: Salad Count Tracker */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Weekly Salad</span>
            <Salad className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {metrics?.saladCount ?? 14}
            </span>
            <span className="text-[11px] text-gray-500">/ 14 meals</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (metrics?.saladCount ?? 14) >= 12 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{
                width: `${Math.min(100, ((metrics?.saladCount ?? 14) / 14) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-500">Min 12 required per week</p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5 text-sm font-semibold text-gray-900 dark:text-white">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Daily Menu Breakdown</span>
          </div>
          <Link
            href="/menu"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white shadow-sm'
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

            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                      {meal.mealType.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{mealTime}</span>
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {meal.items.map((item: any, itemIdx: number) => (
                    <li
                      key={itemIdx}
                      className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 font-mono">₹{item.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 text-center text-xs text-gray-500">
          No menu items listed for {selectedDay}.
        </div>
      )}

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/night-canteen"
          className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md hover:opacity-95 transition-opacity flex flex-col justify-between h-28"
        >
          <Moon className="w-6 h-6 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold">Night Canteen</h3>
            <p className="text-[11px] text-slate-300">Independent Menu & Feedback</p>
          </div>
        </Link>

        <Link
          href="/feedback"
          className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-indigo-500 transition-colors flex flex-col justify-between h-28"
        >
          <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Submit Feedback</h3>
            <p className="text-[11px] text-gray-500">Mess & Canteen Complaints</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
