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
  ChevronDown,
  Camera,
} from 'lucide-react';
import { validateWeeklyMenu, DailyMenuInput } from '@/lib/mess-rules';
import { AdminAuthGate } from '@/components/admin-auth-gate';

export default function AdminDashboard() {
  return (
    <AdminAuthGate title="Mess Admin Portal">
      <AdminDashboardContent />
    </AdminAuthGate>
  );
}

function AdminDashboardContent() {
  const [weeklyMenu, setWeeklyMenu] = useState<DailyMenuInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Feedback Management State
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [remarkInputs, setRemarkInputs] = useState<{ [id: string]: string }>({});

  // Gallery Management State
  const [pendingGallery, setPendingGallery] = useState<any[]>([]);

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
      .then((data) => {
        const messFb = data.filter((f: any) => !f.facilityType.startsWith('MAINTENANCE_'));
        setFeedbacks(messFb);
      })
      .catch(() => {});
  };

  const fetchPendingGallery = () => {
    fetch('/api/gallery/approve')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPendingGallery(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchMenu();
    fetchFeedbacks();
    fetchPendingGallery();
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
    updated[dayIndex].meals[mealIndex].items.push({ name: 'New Item', price: 10, optionGroup: 'Common' });
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

  const handleUpdateGallery = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/gallery/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchPendingGallery();
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Admin Management Panel</span>
          </h2>
          <p className="text-xs text-gray-500">Live Rule Validation & Menu Editor</p>
        </div>
        <div className="flex items-center space-x-2">
          <a href="/hub/admin" className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold transition-colors hover:bg-purple-100 flex items-center space-x-1">
            <span>Hall Info Admin</span>
          </a>
          <a href="/admin/poll" className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition-colors hover:bg-indigo-100 flex items-center space-x-1">
            <span>Poll Manager</span>
          </a>
        </div>
      </div>

      {/* LIVE VALIDATION WIDGETS SECTION */}
      <details className="group space-y-2">
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Live Compliance Widgets
          </h3>
          <ChevronDown className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" />
        </summary>
        
        <div className="pt-2 grid grid-cols-3 gap-2">
          {/* Widget 1: Budget Cap (₹826 limit) */}
          <div
            className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
              metrics.totalWeeklyCost <= metrics.maxWeeklyCost
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-300'
                : metrics.totalWeeklyCost <= 850
                ? 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-400 dark:border-yellow-800 text-yellow-900 dark:text-yellow-400'
                : 'bg-red-50 dark:bg-red-950/50 border-red-400 dark:border-red-800 text-red-900 dark:text-red-300 animate-pulse'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Weekly Cost</div>
            <div className="text-base font-extrabold font-mono">₹{metrics.totalWeeklyCost}</div>
            <div className="text-[9px] opacity-80">Limit: ₹{metrics.maxWeeklyCost}</div>
          </div>

          {/* Widget 2: Salad Count (Min 12/14) */}
          <div
            className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
              metrics.saladCount >= metrics.minSaladRequired
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-300'
                : 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-400 dark:border-yellow-800 text-yellow-900 dark:text-yellow-400'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Salad Count</div>
            <div className="text-base font-extrabold font-mono">{metrics.saladCount}/14</div>
            <div className="text-[9px] opacity-80">Min: {metrics.minSaladRequired} meals</div>
          </div>

          {/* Widget 3: Mandatory Items Check */}
          <div
            className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
              metrics.mandatoryItemsValid
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-300'
                : 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-400 dark:border-yellow-800 text-yellow-900 dark:text-yellow-400'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Mandatory Items</div>
            <div className="text-xs font-bold pt-1">
              {metrics.mandatoryItemsValid ? 'PASSED' : 'WARNING'}
            </div>
            <div className="text-[9px] opacity-80">Rice/Dal/Roti</div>
          </div>
        </div>

        {/* Error Warnings Banner */}
        {validation.errors.length > 0 && (
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Publication Blocked - Critical Violations:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {validation.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Non-Critical Warnings Banner */}
        {validation.warnings.length > 0 && (
          <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-950/60 border border-yellow-300 dark:border-yellow-800 text-yellow-900 dark:text-yellow-400 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
              <span>Non-Critical Warnings (Publication Allowed):</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {validation.warnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        )}
      </details>

      {/* Save Action Header & Menu Builder */}
      <details className="group space-y-2">
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Weekly Menu Builder
          </h3>
          <ChevronDown className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" />
        </summary>
        
        <div className="pt-2">
          <div className="flex items-center justify-end pb-3">
            <button
              onClick={handleSaveMenu}
              disabled={saving || !validation.isValid}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm ${
                validation.isValid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
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
              ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 text-blue-800 dark:text-blue-200'
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
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {day.dayOfWeek}
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  Day Total: ₹
                  {(() => {
                    let cost = 0;
                    for (const m of day.meals) {
                      let c = 0, o1 = 0, o2 = 0, v = 0, nv = 0;
                      for (const i of m.items) {
                        const p = Number(i.price) || 0;
                        const g = i.optionGroup || 'Common';
                        if (g === 'Option 1') o1 += p;
                        else if (g === 'Option 2') o2 += p;
                        else if (g === 'Veg') v += p;
                        else if (g === 'Non-Veg') nv += p;
                        else c += p;
                      }
                      const avgBreakfastOpt = (o1 > 0 && o2 > 0) ? (o1 + o2) / 2 : (o1 || o2);
                      const avgLunchDinnerOpt = (v > 0 && nv > 0) ? (v + nv) / 2 : (v || nv);
                      cost += c + avgBreakfastOpt + avgLunchDinnerOpt;
                    }
                    return Math.round(cost * 100) / 100;
                  })()}
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
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center space-x-0.5 hover:underline"
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
                          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <select
                          value={item.optionGroup || 'Common'}
                          onChange={(e) => {
                            const updated = JSON.parse(JSON.stringify(weeklyMenu));
                            updated[dIdx].meals[mIdx].items[iIdx].optionGroup = e.target.value;
                            setWeeklyMenu(updated);
                          }}
                          className="w-24 px-1 py-1 text-[10px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Common">Common</option>
                          <option value="Option 1">Option 1</option>
                          <option value="Option 2">Option 2</option>
                          <option value="Veg">Veg</option>
                          <option value="Non-Veg">Non-Veg</option>
                        </select>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-400 font-mono">₹</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              handleItemPriceChange(dIdx, mIdx, iIdx, Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      </div>
      </details>

      {/* FEEDBACK & COMPLAINTS MANAGEMENT */}
      <details className="group space-y-2">
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Complaints & Remarks Management ({feedbacks.length})</span>
          </h3>
          <ChevronDown className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" />
        </summary>

        <div className="pt-2 space-y-3">
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
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
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
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="px-2.5 py-1 rounded text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Mark Resolved</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* PENDING GALLERY UPLOADS */}
      <details className="group space-y-2">
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Pending Gallery Uploads ({pendingGallery.length})</span>
          </h3>
          <ChevronDown className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" />
        </summary>

        <div className="pt-2 grid grid-cols-2 gap-3">
          {pendingGallery.map((img) => (
            <div key={img.id} className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2 text-xs shadow-sm">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-black mb-2">
                {img.url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={img.url} className="w-full h-full object-cover" controls />
                ) : (
                  <a href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} className="w-full h-full object-cover" />
                  </a>
                )}
              </div>
              <div>
                <div className="font-bold">{img.uploaderName} <span className="font-mono text-gray-500">({img.uploaderRollNo})</span></div>
                <div className="text-gray-500 text-[10px] uppercase font-bold">{img.category}</div>
                {img.caption && <div className="text-gray-700 dark:text-gray-300 italic mt-1">"{img.caption}"</div>}
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => handleUpdateGallery(img.id, 'REJECTED')}
                  className="flex-1 py-1.5 rounded text-[11px] font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateGallery(img.id, 'APPROVED')}
                  className="flex-1 py-1.5 rounded text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
          {pendingGallery.length === 0 && (
            <div className="col-span-2 text-center py-6 text-gray-500 text-xs">No pending uploads.</div>
          )}
        </div>
      </details>
    </div>
  );
}
