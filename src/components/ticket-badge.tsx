'use client';

import React, { useState } from 'react';
import { Ticket, Copy, Check } from 'lucide-react';

interface TicketBadgeProps {
  ticketNumber?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export function TicketBadge({ ticketNumber, className = '', size = 'sm' }: TicketBadgeProps) {
  const [copied, setCopied] = useState(false);

  if (!ticketNumber) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy Ticket #"
      className={`inline-flex items-center space-x-1.5 font-mono font-bold rounded-lg transition-all duration-200 group touch-spring select-all ${
        isSmall
          ? 'text-[10px] px-2 py-0.5'
          : 'text-xs px-2.5 py-1'
      } ${
        copied
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/30'
          : 'bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm'
      } ${className}`}
    >
      <Ticket className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${copied ? 'text-emerald-500' : 'text-indigo-500'} shrink-0`} />
      <span className="tracking-wide">{ticketNumber}</span>
      <span className="shrink-0">
        {copied ? (
          <Check className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-200`} />
        ) : (
          <Copy className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} opacity-70 group-hover:opacity-100 text-indigo-400 dark:text-indigo-300`} />
        )}
      </span>
    </button>
  );
}
