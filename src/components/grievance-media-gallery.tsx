'use client';

import React, { useState } from 'react';
import { Video, ImageIcon, Download, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export function parseMediaUrls(mediaUrl: string | null | undefined | any): string[] {
  if (!mediaUrl) return [];
  if (Array.isArray(mediaUrl)) {
    return mediaUrl.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  }
  if (typeof mediaUrl !== 'string') return [];
  const trimmed = mediaUrl.trim();
  if (!trimmed || trimmed === '[]' || trimmed === 'null' || trimmed === 'undefined') return [];

  // Try JSON parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((url) => url.length > 0);
    } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
      return [parsed.trim()];
    }
  } catch (e) {}

  // Clean JSON square brackets if unparsed
  let cleaned = trimmed.replace(/^\[|\]$/g, '').trim();

  // Split by comma
  if (cleaned.includes(',')) {
    return cleaned
      .split(',')
      .map((s) => s.replace(/^["']|["']$/g, '').trim())
      .filter((s) => s.length > 0);
  }

  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  if (cleaned.length > 0) {
    return [cleaned];
  }

  return [];
}

interface GrievanceMediaGalleryProps {
  mediaUrl: string | null | undefined;
  capturedAt?: string | null;
  createdAt?: string;
}

export function GrievanceMediaGallery({ mediaUrl, capturedAt, createdAt }: GrievanceMediaGalleryProps) {
  const [expanded, setExpanded] = useState(false);
  const urls = parseMediaUrls(mediaUrl);

  if (urls.length === 0) return null;

  const hasMultiple = urls.length > 1;
  const displayUrls = expanded ? urls : urls.slice(0, 1);
  const remainingCount = urls.length - 1;

  const formattedTimestamp = capturedAt || (createdAt ? new Date(createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' IST' : null);

  return (
    <div className="space-y-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px]">
      {/* Thumbnail Row */}
      <div className="flex flex-wrap items-center gap-2">
        {displayUrls.map((url, idx) => {
          const isVideo = Boolean(url.match(/\.(mp4|webm|ogg)$/i));
          return (
            <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden bg-black/90 border border-slate-200 dark:border-slate-700 shrink-0">
              {isVideo ? (
                <video src={url} className="w-full h-full object-cover" controls preload="metadata" />
              ) : (
                <a href={url} target="_blank" rel="noreferrer" className="w-full h-full block">
                  <img src={url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                </a>
              )}
              <div className="absolute top-1 right-1 flex items-center space-x-1 z-10 pointer-events-auto">
                <a
                  href={url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 bg-black/70 hover:bg-black text-white rounded-md transition-colors shadow"
                  title="Download File"
                >
                  <Download className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          );
        })}

        {/* Expand +N Slot if collapsed */}
        {hasMultiple && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-20 h-20 rounded-lg overflow-hidden relative bg-slate-900/90 text-white flex flex-col items-center justify-center border border-slate-700 shrink-0 hover:bg-slate-950 transition-colors shadow-sm"
            title="Click to view all media files"
          >
            {urls[1] && (
              <img src={urls[1]} alt="More media" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}
            <span className="relative z-10 font-black text-base drop-shadow-md text-amber-300">+{remainingCount}</span>
            <span className="relative z-10 text-[9px] font-bold opacity-90 drop-shadow">More</span>
          </button>
        )}
      </div>

      {/* Footer Controls & Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center space-x-2">
          {hasMultiple && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center space-x-1 font-bold text-purple-600 dark:text-purple-400 hover:underline bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{expanded ? 'Collapse Media' : `View All ${urls.length} Media`}</span>
            </button>
          )}
        </div>

        {formattedTimestamp && (
          <span className="text-slate-500 font-mono text-[9.5px] flex items-center space-x-1 ml-auto">
            <Clock className="w-3 h-3 text-slate-400 inline" />
            <span>Captured: {formattedTimestamp}</span>
          </span>
        )}
      </div>
    </div>
  );
}
