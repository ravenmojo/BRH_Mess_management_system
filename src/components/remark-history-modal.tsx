'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { History, X, MessageSquare, Clock, ShieldCheck, User } from 'lucide-react';
import { formatAdminDisplayName } from '@/lib/admin-display';

export interface RemarkHistoryItem {
  remark: string;
  author: string;
  authorRole?: string;
  createdAt: string;
}

interface RemarkHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber?: string | null;
  studentName?: string | null;
  currentRemark?: string | null;
  history?: string | RemarkHistoryItem[] | null;
}

export function RemarkHistoryModal({
  isOpen,
  onClose,
  ticketNumber,
  studentName,
  currentRemark,
  history,
}: RemarkHistoryModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Parse history items safely
  let items: RemarkHistoryItem[] = [];
  try {
    if (Array.isArray(history)) {
      items = history;
    } else if (typeof history === 'string' && history.trim() !== '') {
      items = JSON.parse(history);
    }
  } catch (e) {
    items = [];
  }

  // If no history array exists yet, but there's a currentRemark, show it as the single entry
  if (items.length === 0 && currentRemark && currentRemark.trim() !== '') {
    items = [
      {
        remark: currentRemark.trim(),
        author: 'Administrator',
        authorRole: 'Admin',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 min-h-[100dvh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 max-h-[85vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>Remark Update History</span>
                {ticketNumber && (
                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    {ticketNumber}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {studentName ? `Grievance by ${studentName}` : 'Chronological remarks (latest to oldest)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Remark History Timeline (Latest to Oldest) */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[55vh]">
          {items.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 font-medium space-y-1">
              <MessageSquare className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
              <p>No remark update history recorded yet.</p>
            </div>
          ) : (
            items.map((entry, idx) => {
              const displayName = formatAdminDisplayName(entry.authorRole || entry.author, entry.author);
              const formattedDate = entry.createdAt
                ? new Date(entry.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Kolkata',
                  }) + ' IST'
                : 'Just now';

              const isLatest = idx === 0;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                    isLatest
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/60 shadow-xs'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center space-x-1.5">
                      <div className={`p-1 rounded-lg ${isLatest ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {displayName}
                      </span>
                      {isLatest && (
                        <span className="text-[9.5px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded-full border border-blue-300 dark:border-blue-700">
                          Latest
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-[11.5px] break-words">
                    "{entry.remark}"
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
