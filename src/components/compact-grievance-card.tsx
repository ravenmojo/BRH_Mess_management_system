'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check,
  ImageIcon,
  MessageSquare,
  Loader2,
  Calendar,
  Layers,
  Flame,
} from 'lucide-react';
import { TicketBadge } from '@/components/ticket-badge';
import { GrievanceMediaGallery, parseMediaUrls } from '@/components/grievance-media-gallery';
import { formatResolvedByAttribution } from '@/lib/admin-display';

interface CompactGrievanceCardProps {
  item: {
    id: string;
    ticketNumber?: string | null;
    studentName?: string | null;
    roomNo?: string | null;
    email?: string | null;
    comment: string;
    facilityType: string;
    status: string;
    remark?: string | null;
    mediaUrl?: string | null;
    capturedAt?: string | null;
    resolvedBy?: string | null;
    resolvedByEmail?: string | null;
    resolvedByRole?: string | null;
    resolvedAt?: string | Date | null;
    adminResolved?: boolean;
    userResolved?: boolean;
    isEscalated?: boolean;
    escalatedBy?: string | null;
    escalatedRemark?: string | null;
    escalatedAt?: string | Date | null;
    remarkHistory?: string | any[] | null;
    createdAt?: string | Date;
  };
  defaultExpanded?: boolean;
  showFacilityBadge?: boolean;
  accentColor?: 'blue' | 'sky' | 'indigo' | 'emerald';
  onMarkResolved?: (id: string) => void;
  onApproveManager?: (id: string) => void;
  isActionLoading?: boolean;
}

export function getCategoryBadge(facilityType: string) {
  switch (facilityType) {
    case 'REGULAR_MESS':
      return { label: 'Mess', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' };
    case 'NIGHT_CANTEEN':
      return { label: 'Canteen', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800' };
    case 'MAINTENANCE_WASHROOM':
      return { label: 'Washroom', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800' };
    case 'MAINTENANCE_WATER':
      return { label: 'Water', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' };
    case 'MAINTENANCE_ELECTRICAL':
      return { label: 'Electrical', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' };
    case 'MAINTENANCE_CIVIL':
      return { label: 'Civil', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800' };
    case 'MAINTENANCE_CLEANING':
      return { label: 'Cleaning', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800' };
    case 'MAINTENANCE_OUTDOOR':
      return { label: 'Gym & Outdoors', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' };
    default:
      return { label: facilityType.replace('MAINTENANCE_', ''), color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
  }
}

export function CompactGrievanceCard({
  item,
  defaultExpanded = false,
  showFacilityBadge = false,
  accentColor = 'blue',
  onMarkResolved,
  onApproveManager,
  isActionLoading = false,
}: CompactGrievanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isResolved = item.status === 'RESOLVED';
  const isTwoWay = Boolean(item.adminResolved && item.userResolved);
  const mediaList = parseMediaUrls(item.mediaUrl);
  const hasMedia = mediaList.length > 0;
  const categoryInfo = getCategoryBadge(item.facilityType);

  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }) + ' IST'
    : null;

  return (
    <div
      className={`rounded-2xl glass-card transition-all duration-200 border overflow-hidden ${
        item.status === 'PURGED'
          ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-none opacity-80'
          : item.status === 'UNREGISTERED'
            ? 'border-indigo-400/60 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-indigo-500/5'
            : item.isEscalated
              ? 'border-red-400/80 bg-red-50/20 dark:bg-red-950/20 shadow-red-500/10'
              : isTwoWay
                ? 'border-emerald-400/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-emerald-500/5'
                : isResolved
                  ? 'border-emerald-200/80 dark:border-emerald-800/60 shadow-xs'
                  : 'border-yellow-200/80 dark:border-yellow-900/60 shadow-xs'
      } hover:border-slate-300 dark:hover:border-slate-700`}
    >
      {/* Clickable Compact Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-3 sm:p-3.5 flex flex-col space-y-2 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        aria-expanded={isExpanded}
      >
        {/* Top Meta Line: Ticket Badge, Room/Name, Category, Status Badge & Chevron */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center space-x-1.5 flex-wrap gap-1 min-w-0 flex-1">
            {item.ticketNumber && <TicketBadge ticketNumber={item.ticketNumber} size="sm" />}
            
            {item.roomNo && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold shrink-0">
                {item.roomNo}
              </span>
            )}

            <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs">
              {item.studentName || 'Anonymous'}
            </span>

            {showFacilityBadge && (
              <span
                className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${categoryInfo.color}`}
              >
                {categoryInfo.label}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Escalated Priority Flag */}
            {item.isEscalated && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white border border-red-700 flex items-center space-x-1 shadow-sm shadow-red-500/30 animate-pulse">
                <Flame className="w-2.5 h-2.5 text-white" />
                <span>Escalated</span>
              </span>
            )}

            {/* Status Indicator Badge */}
            {item.status === 'PURGED' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center space-x-1">
                <span>Purged</span>
              </span>
            ) : item.status === 'UNREGISTERED' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/80 flex items-center space-x-1">
                <span>Needs Manager Sig</span>
              </span>
            ) : isTwoWay ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center space-x-1 shadow-xs">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
                <Check className="w-2.5 h-2.5 text-emerald-600 -ml-1.5" />
                <span>Verified</span>
              </span>
            ) : isResolved ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5" />
                <span>Resolved</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-yellow-100 dark:bg-yellow-950/70 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700/80 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-0.5" />
                <span>Pending</span>
              </span>
            )}

            {/* Expand / Collapse Chevron */}
            <div
              className={`p-1 rounded-lg text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60' : 'bg-slate-100 dark:bg-slate-800/60'
              }`}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 1-Line Compact Summary Snippet */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <p className={`font-medium line-clamp-1 flex-1 text-[11px] sm:text-xs ${isExpanded ? 'text-slate-400 dark:text-slate-500' : ''}`}>
            {item.comment}
          </p>

          <div className="flex items-center space-x-1.5 shrink-0 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {hasMedia && (
              <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold">
                <ImageIcon className="w-3 h-3" />
                <span>{mediaList.length}</span>
              </span>
            )}
            {item.createdAt && (
              <span className="hidden xs:inline font-mono text-[10px]">
                {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Details Accordion */}
      {isExpanded && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Full Verbatim Comment Box */}
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Issue Description</span>
              {formattedDate && <span>{formattedDate}</span>}
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
              {item.comment}
            </p>
          </div>

          {/* Photo & Video Gallery */}
          {hasMedia && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Attached Media Proof
              </div>
              <GrievanceMediaGallery
                mediaUrl={item.mediaUrl}
                capturedAt={item.capturedAt}
                createdAt={item.createdAt ? (typeof item.createdAt === 'string' ? item.createdAt : item.createdAt.toISOString()) : undefined}
              />
            </div>
          )}

          {/* Official Resolution Attribution */}
          {isResolved && (
            <div className="flex items-center space-x-2 text-[11px] font-medium text-emerald-800 dark:text-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="leading-snug">
                Resolved by <strong className="font-bold">{formatResolvedByAttribution(item.resolvedByRole, item.resolvedBy, item.resolvedByEmail)}</strong>
                {item.resolvedAt && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block sm:inline sm:ml-1">
                    • {new Date(item.resolvedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'Asia/Kolkata',
                    })} IST
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Official Admin Remark */}
          {item.remark && (
            <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-xs text-blue-950 dark:text-blue-200 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Official Administrative Remark
                </div>
                <p className="font-medium text-xs leading-relaxed">{item.remark}</p>
              </div>
            </div>
          )}

          {/* Action button for student author to confirm resolution (if provided in My Grievances view) */}
          {item.status === 'PURGED' ? (
            <div className="pt-1">
              <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold italic text-center p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                Complaint with ticket number {item.ticketNumber} has been removed due to non-approval by mess manager.
              </p>
            </div>
          ) : item.status === 'UNREGISTERED' && onApproveManager ? (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => onApproveManager(item.id)}
                disabled={isActionLoading}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 touch-spring disabled:opacity-50"
              >
                {isActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Sign & Register (Manager Only)</span>
              </button>
            </div>
          ) : !isResolved && onMarkResolved && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => onMarkResolved(item.id)}
                disabled={isActionLoading}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 touch-spring disabled:opacity-50"
              >
                {isActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Issue Resolved</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
