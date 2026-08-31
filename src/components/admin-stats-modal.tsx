'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, X, Loader2, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Check, Sparkles, TrendingUp } from 'lucide-react';

interface AdminStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getCategoryDisplay(cat: string) {
  switch (cat) {
    case 'REGULAR_MESS':
      return 'Regular Mess';
    case 'NIGHT_CANTEEN':
      return 'Night Canteen';
    case 'MAINTENANCE_WASHROOM':
      return 'Washrooms';
    case 'MAINTENANCE_WATER':
      return 'Water & Purifiers';
    case 'MAINTENANCE_ELECTRICAL':
      return 'Electrical';
    case 'MAINTENANCE_CIVIL':
      return 'Civil & Structural';
    case 'MAINTENANCE_CLEANING':
      return 'Cleaning & Hygiene';
    case 'MAINTENANCE_OUTDOOR':
      return 'Gym & Outdoors';
    default:
      return cat.replace('MAINTENANCE_', '');
  }
}

export function AdminStatsModal({ isOpen, onClose }: AdminStatsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/feedback/stats')
        .then((res) => res.json())
        .then((d) => setStats(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-card-elevated rounded-3xl p-5 sm:p-6 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/80 pb-3.5">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>Grievance Analytics & Resolution Stats</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">All-time performance & category breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Computing analytics...</span>
          </div>
        ) : !stats ? (
          <div className="text-center py-8 text-xs text-slate-400">Failed to load statistics.</div>
        ) : (
          <div className="space-y-4">
            {/* Overview Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Filed</div>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{stats.overall?.totalSubmitted || 0}</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Resolution Rate</div>
                <div className="text-lg font-black text-emerald-800 dark:text-emerald-200 font-mono">{stats.overall?.resolutionRatePercent || 0}%</div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 space-y-1">
                <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Avg Resolve Time</div>
                <div className="text-lg font-black text-blue-800 dark:text-blue-200 font-mono">{stats.overall?.avgResolutionHours || '0.0'} hrs</div>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 space-y-1">
                <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Two-Way Verified</div>
                <div className="text-lg font-black text-purple-800 dark:text-purple-200 font-mono">{stats.overall?.totalTwoWayVerified || 0}</div>
              </div>
              <div className="p-3 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/60 space-y-1">
                <div className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Escalated Items</div>
                <div className="text-lg font-black text-red-800 dark:text-red-200 font-mono">{stats.overall?.totalEscalated || 0}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Resolved</div>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{stats.overall?.totalResolved || 0}</div>
              </div>
            </div>

            {/* Category Performance Breakdown */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <span>Category Performance & Averages</span>
              </h4>

              <div className="space-y-2">
                {stats.categoryStats?.map((c: any) => (
                  <div key={c.category} className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{getCategoryDisplay(c.category)}</span>
                      <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {c.totalResolved} / {c.totalSubmitted} Resolved ({c.resolutionRatePercent}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Avg Time: <strong className="text-slate-800 dark:text-slate-200 font-mono">{c.avgResolutionHours} hrs</strong></span>
                      </span>
                      {c.category.startsWith('MAINTENANCE_') && (
                        <span className="flex items-center space-x-1">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Two-Way: <strong className="text-slate-800 dark:text-slate-200 font-mono">{c.twoWayRatePercent}%</strong></span>
                        </span>
                      )}
                      {c.totalEscalated > 0 && (
                        <span className="text-red-600 dark:text-red-400 font-bold font-mono">
                          {c.totalEscalated} Escalated
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all touch-spring shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
