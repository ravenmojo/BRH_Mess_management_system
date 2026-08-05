'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/footer';
import { Loader2, PieChart, ShieldCheck, CheckCircle2, Lock, Unlock, ArrowRight } from 'lucide-react';

export default function PublicPollPage() {
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRoll, setUserRoll] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const router = useRouter();
  const supabase = createClient();

  const loadPoll = () => {
    fetch('/api/poll')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Find the active poll, or just the most recent one if none are active
          const active = data.find((p: any) => p.isActive);
          setPoll(active || data[0]);
        } else {
          setPoll(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.email) {
        setUserRoll(user.email.split('@')[0].toUpperCase());
      }
    });
    loadPoll();
  }, []);

  const handleVote = async (optionId: string) => {
    if (!user) {
      router.push('/login?next=/poll');
      return;
    }
    
    setSubmitting(true);
    setStatusMessage('');

    try {
      const res = await fetch('/api/poll/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          pollOptionId: optionId
        }),
      });

      if (res.ok) {
        setStatusMessage('Vote submitted successfully!');
        loadPoll(); // Refresh poll data to show updated counts
      } else {
        const errorData = await res.json();
        setStatusMessage(errorData.error || 'Failed to submit vote.');
      }
    } catch (err) {
      setStatusMessage('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="space-y-5 pb-8 text-center pt-10">
        <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Active Polls</h2>
        <p className="text-sm text-gray-500">There are currently no polls running for the upcoming month.</p>
        <Footer />
      </div>
    );
  }

  const currentDate = new Date();
  const isAfter15th = currentDate.getDate() > 15;
  const isPollLocked = !poll.isActive || isAfter15th;

  // Calculate total votes for percentages
  const totalVotes = poll.options.reduce((acc: number, opt: any) => acc + (opt._count?.votes || 0), 0);

  // Determine if the user has already voted for an option
  // (We don't know for sure unless we check the backend specifically, but we can just show the options. 
  // If they click again, the API handles updating their vote).

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-800 to-purple-900 p-5 text-white shadow-lg">
        <div className="relative z-10 space-y-1">
          <h2 className="text-xl font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-indigo-300" />
            <span>Monthly Mess Poll</span>
          </h2>
          <p className="text-xs text-indigo-200 font-medium max-w-sm">
            Vote for the Seasonal Veg Curries for Month {poll.month} / {poll.year}. 
            Polls lock automatically after the 15th.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          {isPollLocked ? (
            <span className="flex items-center space-x-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800/50">
              <Lock className="w-3.5 h-3.5" />
              <span>Poll Locked</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800/50">
              <Unlock className="w-3.5 h-3.5" />
              <span>Poll Active</span>
            </span>
          )}
        </div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Total Votes: <strong className="text-gray-900 dark:text-white">{totalVotes}</strong>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs font-bold border ${
          statusMessage.includes('successfully') 
            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        {poll.options.sort((a: any, b: any) => (b._count?.votes || 0) - (a._count?.votes || 0)).map((opt: any) => {
          const votes = opt._count?.votes || 0;
          const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
          
          return (
            <div key={opt.id} className="relative p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col justify-center">
              {/* Progress Bar Background */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-indigo-50 dark:bg-indigo-900/20 transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {opt.itemName}
                  </h3>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">
                    {votes} votes ({percentage}%)
                  </div>
                </div>

                {!isPollLocked && (
                  <button
                    onClick={() => handleVote(opt.id)}
                    disabled={submitting}
                    className="ml-3 shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Vote
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auth Prompt if not logged in and poll active */}
      {!user && !isPollLocked && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start space-x-3 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
              You must verify your Institute Email to submit a vote. This ensures one vote per student.
            </p>
            <Link href="/login?next=/poll" className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold transition-colors">
              <span>Verify Email Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
