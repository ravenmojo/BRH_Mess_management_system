'use client';

import React, { useEffect, useState } from 'react';
import { Utensils, CheckCircle, ShieldAlert, DollarSign, Salad } from 'lucide-react';

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
    <div className="space-y-4 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Regular Mess Weekly Schedule</h2>
          <p className="text-xs text-gray-500">Official BRH Hall Comprehensive Menu</p>
        </div>
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
          <Utensils className="w-5 h-5" />
        </div>
      </div>

      {/* Rules & Compliance Summary Banner */}
      {validation && (
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
            validation.isValid
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold">
            {validation.isValid ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>All BRH Mess Rules Satisfied</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span>Mess Rule Violations Detected ({validation.errors.length})</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-current/10">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>
                Cost: <strong>₹{validation.metrics.totalWeeklyCost}</strong> / ₹826
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Salad className="w-3.5 h-3.5" />
              <span>
                Salad: <strong>{validation.metrics.saladCount}</strong> / 12 min
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7 Day Menu Breakdown */}
      {loading ? (
        <div className="p-8 text-center text-xs text-gray-500">Loading weekly menu...</div>
      ) : (
        <div className="space-y-4">
          {menuData?.menu?.map((day: any) => {
            const dayCost = day.meals.reduce(
              (sum: number, m: any) =>
                sum + m.items.reduce((itemSum: number, i: any) => itemSum + (Number(i.price) || 0), 0),
              0
            );

            return (
              <div
                key={day.dayOfWeek}
                className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
              >
                <div className="bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {day.dayOfWeek}
                  </span>
                  <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    Day Total: ₹{Math.round(dayCost * 100) / 100}
                  </span>
                </div>

                <div className="p-3 space-y-3">
                  {day.meals.map((meal: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {meal.mealType}
                      </div>
                      <ul className="divide-y divide-gray-100 dark:divide-gray-800/50">
                        {meal.items.map((item: any, iIdx: number) => (
                          <li
                            key={iIdx}
                            className="py-1 flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                            <span className="text-gray-500 font-mono text-[11px]">
                              ₹{item.price}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
