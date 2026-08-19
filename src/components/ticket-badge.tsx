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
      className={`inline-flex items-center space-x-1.5 font-mono font-bold rounded-lg transition-all duration-200 group select-all ${
        isSmall
          ? 'text-[10px] px-2 py-0.5'
          : 'text-xs px-2.5 py-1'
      } bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm ${className}`}
    >
      <Ticket className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-indigo-500 shrink-0`} />
      <span className="tracking-wide">{ticketNumber}</span>
      <span className="text-indigo-400 group-hover:text-indigo-600 dark:text-indigo-400 dark:group-hover:text-indigo-200 shrink-0">
        {copied ? (
          <Check className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-emerald-600 dark:text-emerald-400 animate-scale-in`} />
        ) : (
          <Copy className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} opacity-70 group-hover:opacity-100`} />
        )}
      </span>
    </button>
  );
}
