'use client';

import React, { useEffect, useState } from 'react';
import { Utensils, CheckCircle, ShieldAlert, Salad, ShieldCheck, Coffee, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export default function RegularMessMenuPage() {
  const [menuData, setMenuData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        setMenuData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const validation = menuData?.validation;

  return (
    <div className="space-y-5 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 glass-card rounded-2xl sm:rounded-3xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Regular Mess Weekly Schedule</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Official BRH Mess Menu</p>
        </div>
        <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 shadow-xs">
          <Utensils className="w-5 h-5" />
        </div>
      </div>

      {/* 7 Day Menu Breakdown */}
      {loading ? (
        <div className="p-8 text-center text-xs font-semibold text-slate-500 glass-card rounded-2xl animate-pulse">Loading weekly menu...</div>
      ) : (
        <div className="space-y-4">
          {menuData?.menu?.map((day: any) => {
            return (
              <div
                key={day.dayOfWeek}
                className="rounded-2xl sm:rounded-3xl glass-card overflow-hidden shadow-sm"
              >
                <div className="bg-slate-100/90 dark:bg-slate-800/70 px-4 py-3 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/80">
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-wider">
                    {day.dayOfWeek}
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-3.5">
                  {day.meals.map((meal: any, idx: number) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {meal.mealType === 'BREAKFAST' && <Coffee className="w-3.5 h-3.5 text-blue-500" />}
                        {meal.mealType === 'LUNCH' && <Sun className="w-3.5 h-3.5 text-blue-500" />}
                        {meal.mealType === 'DINNER' && <Moon className="w-3.5 h-3.5 text-blue-500" />}
                        <span>{meal.mealType}</span>
                      </div>
                      <div className="space-y-1.5 pt-1">
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
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/40' 
                                  : isNonVegGroup 
                                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/40' 
                                    : isOptGroup
                                      ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-800/40'
                                      : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/40'
                              }`}
                            >
                              {group !== 'Common' && (
                                <div className={`text-[10px] font-black mb-1 uppercase tracking-wider ${
                                  isVegGroup ? 'text-emerald-700 dark:text-emerald-400' : isNonVegGroup ? 'text-rose-700 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                                }`}>
                                  {group}
                                </div>
                              )}
                              <ul className="space-y-1.5">
                                {groupItems.map((item: any, iIdx: number) => (
                                  <li key={iIdx} className="flex items-center text-xs">
                                    <span className="text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        isVegGroup ? 'bg-emerald-500' : isNonVegGroup ? 'bg-rose-500' : 'bg-blue-500 dark:bg-blue-400'
                                      }`} />
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Link */}
      <div className="pt-2 flex justify-center">
        <Link href="/admin" className="px-4 py-2 rounded-full border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm touch-spring">
          <ShieldCheck className="w-4 h-4" />
          <span>Access Mess Admin Panel</span>
        </Link>
      </div>
    </div>
  );
}

