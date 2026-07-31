'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  DollarSign,
  Salad,
  CheckCircle,
  AlertTriangle,
  Save,
  MessageSquare,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';
import { validateWeeklyMenu, DailyMenuInput } from '@/lib/mess-rules';

export default function AdminDashboard() {
  const [weeklyMenu, setWeeklyMenu] = useState<DailyMenuInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Feedback Management State
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [remarkInputs, setRemarkInputs] = useState<{ [id: string]: string }>({});

  const fetchMenu = () => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        if (data.menu) setWeeklyMenu(data.menu);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchFeedbacks = () => {
    fetch('/api/feedback')
      .then((res) => res.json())
      .then((data) => setFeedbacks(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchMenu();
    fetchFeedbacks();
  }, []);

  // Live Real-Time Validation Engine
  const validation = validateWeeklyMenu(weeklyMenu);
  const { metrics } = validation;

  // Menu Builder Handler: Update Item Price
  const handleItemPriceChange = (dayIndex: number, mealIndex: number, itemIndex: number, newPrice: number) => {
    const updated = JSON.parse(JSON.stringify(weeklyMenu));
    updated[dayIndex].meals[mealIndex].items[itemIndex].price = Number(newPrice) || 0;
    setWeeklyMenu(updated);
  };

  // Menu Builder Handler: Update Item Name
  const handleItemNameChange = (dayIndex: number, mealIndex: number, itemIndex: number, newName: string) => {
    const updated = JSON.parse(JSON.stringify(weeklyMenu));
    updated[dayIndex].meals[mealIndex].items[itemIndex].name = newName;
    setWeeklyMenu(updated);
  };

  // Add Item to Meal
  const handleAddItem = (dayIndex: number, mealIndex: number) => {
    const updated = JSON.parse(JSON.stringify(weeklyMenu));
    updated[dayIndex].meals[mealIndex].items.push({ name: 'New Item', price: 10 });
    setWeeklyMenu(updated);
  };

  // Remove Item from Meal
  const handleRemoveItem = (dayIndex: number, mealIndex: number, itemIndex: number) => {
    const updated = JSON.parse(JSON.stringify(weeklyMenu));
    updated[dayIndex].meals[mealIndex].items.splice(itemIndex, 1);
    setWeeklyMenu(updated);
  };

  // Save Weekly Menu POST to /api/menu
  const handleSaveMenu = async () => {
    setSaving(true);
    setSaveStatus(null);

    // Frontend pre-check
    if (!validation.isValid) {
      setSaveStatus({
        type: 'error',
        message: 'Publication blocked: Fix constraint errors listed below before saving.',
      });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyMenu }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveStatus({ type: 'success', message: 'Weekly Menu successfully published!' });
      } else {
        setSaveStatus({
          type: 'error',
          message: data.error || 'Server validation failed.',
        });
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: 'Network error while saving.' });
    } finally {
      setSaving(false);
    }
  };

  // Update Feedback Remark / Resolution
  const handleUpdateFeedback = async (id: string, newStatus: string) => {
    const remark = remarkInputs[id];
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, remark }),
      });

      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Admin Management Panel</span>
          </h2>
          <p className="text-xs text-gray-500">Live Rule Validation & Menu Editor</p>
        </div>
      </div>

      {/* LIVE VALIDATION WIDGETS SECTION */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Live Compliance Widgets
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {/* Widget 1: Budget Cap (₹826 limit) */}
          <div
            className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
              metrics.totalWeeklyCost <= 826
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/50 border-red-400 dark:border-red-800 text-red-900 dark:text-red-300 animate-pulse'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Weekly Cost</div>
            <div className="text-base font-extrabold font-mono">₹{metrics.totalWeeklyCost}</div>
            <div className="text-[9px] opacity-80">Limit: ₹826</div>
          </div>

          {/* Widget 2: Salad Count (Min 12/14) */}
          <div
            className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
              metrics.saladCount >= 12
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/50 border-red-400 dark:border-red-800 text-red-900 dark:text-red-300 animate-pulse'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Salad Count</div>
            <div className="text-base font-extrabold font-mono">{metrics.saladCount}/14</div>
            <div className="text-[9px] opacity-80">Min: 12 meals</div>
          </div>

          {/* Widget 3: Mandatory Items Check */}
          <div
            className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
              metrics.mandatoryItemsValid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/50 border-red-400 dark:border-red-800 text-red-900 dark:text-red-300 animate-pulse'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Mandatory Items</div>
            <div className="text-xs font-bold pt-1">
              {metrics.mandatoryItemsValid ? 'PASSED' : 'VIOLATION'}
            </div>
            <div className="text-[9px] opacity-80">Rice/Dal/Roti</div>
          </div>
        </div>

        {/* Error Warnings Banner */}
        {validation.errors.length > 0 && (
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Publication Blocked - Business Rule Violations:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {validation.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Save Action Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Weekly Menu Builder
        </h3>

        <button
          onClick={handleSaveMenu}
          disabled={saving || !validation.isValid}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm ${
            validation.isValid
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
              : 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Publishing...' : 'Publish Weekly Menu'}</span>
        </button>
      </div>

      {saveStatus && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950 border-red-200 text-red-800 dark:text-red-200'
          }`}
        >
          {saveStatus.message}
        </div>
      )}

      {/* MENU BUILDER FORM */}
      {loading ? (
        <div className="p-8 text-center text-xs text-gray-500">Loading menu builder...</div>
      ) : (
        <div className="space-y-4">
          {weeklyMenu.map((day, dIdx) => (
            <div
              key={day.dayOfWeek}
              className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {day.dayOfWeek}
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  Day Total: ₹
                  {day.meals.reduce(
                    (s, m) => s + m.items.reduce((is, i) => is + (Number(i.price) || 0), 0),
                    0
                  )}
                </span>
              </div>

              {day.meals.map((meal, mIdx) => (
                <div key={mIdx} className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                      {meal.mealType}
                    </span>
                    <button
                      onClick={() => handleAddItem(dIdx, mIdx)}
                      className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center space-x-0.5 hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {meal.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemNameChange(dIdx, mIdx, iIdx, e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-400 font-mono">₹</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              handleItemPriceChange(dIdx, mIdx, iIdx, Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-right font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveItem(dIdx, mIdx, iIdx)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* FEEDBACK & COMPLAINTS MANAGEMENT */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>Complaints & Remarks Management ({feedbacks.length})</span>
        </h3>

        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2 text-xs shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 dark:text-white">{fb.studentName}</span>
                  <span className="text-gray-500 text-[11px] ml-1">({fb.hallRoll})</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    fb.status === 'RESOLVED'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {fb.status}
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                "{fb.comment}"
              </p>

              {/* Admin Remark Input */}
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Enter official Admin Remark / Resolution..."
                  value={remarkInputs[fb.id] ?? fb.remark ?? ''}
                  onChange={(e) => setRemarkInputs({ ...remarkInputs, [fb.id]: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <div className="flex space-x-2 justify-end">
                  <button
                    onClick={() => handleUpdateFeedback(fb.id, 'PENDING')}
                    className="px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Mark Pending
                  </button>
                  <button
                    onClick={() => handleUpdateFeedback(fb.id, 'RESOLVED')}
                    className="px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Mark Resolved</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
