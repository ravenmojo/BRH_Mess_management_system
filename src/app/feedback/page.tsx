'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export default function StudentFeedbackPage() {
  const [facilityType, setFacilityType] = useState<'REGULAR_MESS' | 'NIGHT_CANTEEN'>('REGULAR_MESS');
  const [studentName, setStudentName] = useState('');
  const [hallRoll, setHallRoll] = useState('');
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadFeedbacks = () => {
    fetch('/api/feedback')
      .then((res) => res.json())
      .then((data) => setFeedbacks(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !comment) return;

    setSubmitting(true);
    setStatusMessage('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          hallRoll,
          comment,
          facilityType,
        }),
      });

      if (res.ok) {
        setStatusMessage('Feedback submitted successfully to Warden & HMC Admin!');
        setStudentName('');
        setHallRoll('');
        setComment('');
        loadFeedbacks();
      } else {
        setStatusMessage('Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      setStatusMessage('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Feedback & Complaint Center</h2>
        <p className="text-xs text-gray-500">
          Directly report food quality, hygiene, or service issues to Mess Wardens & HMC.
        </p>
      </div>

      {/* Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm"
      >
        <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>New Complaint / Suggestion</span>
        </h3>

        {statusMessage && (
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            {statusMessage}
          </div>
        )}

        {/* Facility Selector */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFacilityType('REGULAR_MESS')}
            className={`py-1.5 rounded-lg font-medium border transition-colors ${
              facilityType === 'REGULAR_MESS'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            Regular Mess
          </button>
          <button
            type="button"
            onClick={() => setFacilityType('NIGHT_CANTEEN')}
            className={`py-1.5 rounded-lg font-medium border transition-colors ${
              facilityType === 'NIGHT_CANTEEN'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            Night Canteen
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Student Name *"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Roll No (e.g. 21BRH1002)"
            value={hallRoll}
            onChange={(e) => setHallRoll(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <textarea
          placeholder="Details of complaint (e.g. food quality, missing mandatory items, cleanliness)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          required
          className="w-full px-3 py-2 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
        </button>
      </form>

      {/* Submitted Complaints & Admin Resolution Timeline */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 px-1">
          Submitted Complaints & Status ({feedbacks.length})
        </h3>

        <div className="space-y-2">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5 text-xs shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-gray-900 dark:text-white">{item.studentName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono">
                    {item.facilityType === 'NIGHT_CANTEEN' ? 'Canteen' : 'Mess'}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 ${
                    item.status === 'RESOLVED'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {item.status === 'RESOLVED' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  <span>{item.status}</span>
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300">{item.comment}</p>

              {item.remark && (
                <div className="mt-2 p-2 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Admin Remark:</strong> {item.remark}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
