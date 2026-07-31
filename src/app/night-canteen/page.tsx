'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Utensils, MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';

export default function NightCanteenPage() {
  // CRITICAL REQUIREMENT: Strictly TWO tabs ONLY
  const [activeTab, setActiveTab] = useState<'menu' | 'feedback'>('menu');

  // Canteen Menu Items (Independent Entity - No ₹826 constraint)
  const canteenMenuItems = [
    { id: 'nc-1', name: 'Paneer Butter Masala Roll', price: 60, category: 'Rolls & Wraps', available: true },
    { id: 'nc-2', name: 'Chicken Egg Roll', price: 70, category: 'Rolls & Wraps', available: true },
    { id: 'nc-3', name: 'Veg Chowmein (Full)', price: 50, category: 'Chinese & Noodles', available: true },
    { id: 'nc-4', name: 'Chicken Fried Rice', price: 90, category: 'Chinese & Noodles', available: true },
    { id: 'nc-5', name: 'Alu Paratha with Butter', price: 30, category: 'Parathas', available: true },
    { id: 'nc-6', name: 'Cheese Maggi', price: 35, category: 'Quick Bites', available: true },
    { id: 'nc-7', name: 'Cold Coffee with Ice Cream', price: 45, category: 'Beverages', available: true },
    { id: 'nc-8', name: 'Masala Chai', price: 10, category: 'Beverages', available: true },
  ];

  // Feedback State
  const [studentName, setStudentName] = useState('');
  const [hallRoll, setHallRoll] = useState('');
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCanteenFeedbacks = () => {
    fetch('/api/feedback?facility=NIGHT_CANTEEN')
      .then((res) => res.json())
      .then((data) => setFeedbacks(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCanteenFeedbacks();
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !comment) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          hallRoll,
          comment,
          facilityType: 'NIGHT_CANTEEN',
        }),
      });

      if (res.ok) {
        setMessage('Feedback submitted successfully!');
        setStudentName('');
        setHallRoll('');
        setComment('');
        fetchCanteenFeedbacks();
      }
    } catch (err) {
      setMessage('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 p-4 text-white shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-indigo-300 font-semibold mb-1">
            <Moon className="w-3.5 h-3.5" />
            <span>BRH NIGHT CANTEEN</span>
          </div>
          <h2 className="text-base font-bold">Independent Canteen Services</h2>
          <p className="text-[11px] text-slate-300">Open 09:30 PM - 02:00 AM Daily</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-2 py-1 rounded bg-indigo-600/50 text-[10px] font-mono border border-indigo-400/30">
            No Budget Cap
          </span>
        </div>
      </div>

      {/* STRICT 2-TAB SWITCHER (Menu & Feedback/Complaint ONLY) */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'menu'
              ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Menu</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'feedback'
              ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedback/Complaint</span>
        </button>
      </div>

      {/* TAB 1: MENU */}
      {activeTab === 'menu' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-gray-500">
            <span>Item Name & Category</span>
            <span>Price</span>
          </div>

          <div className="space-y-2">
            {canteenMenuItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">{item.name}</h4>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                    ₹{item.price}
                  </span>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-0.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>Available</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FEEDBACK / COMPLAINT */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {/* Canteen Specific Feedback Form */}
          <form
            onSubmit={handleSubmitFeedback}
            className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm"
          >
            <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Submit Night Canteen Feedback / Complaint</span>
            </h3>

            {message && (
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Your Name *"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Roll No. (Optional)"
                value={hallRoll}
                onChange={(e) => setHallRoll(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <textarea
              placeholder="Describe your complaint, food quality issue, or suggestion..."
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
              <span>{submitting ? 'Submitting...' : 'Submit Canteen Feedback'}</span>
            </button>
          </form>

          {/* Canteen Feedbacks Timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 px-1">
              Canteen Feedback History ({feedbacks.length})
            </h4>

            {feedbacks.length === 0 ? (
              <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border text-center text-xs text-gray-500">
                No canteen complaints submitted yet.
              </div>
            ) : (
              feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5 text-xs shadow-sm"
                >
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {fb.studentName} ({fb.hallRoll})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        fb.status === 'RESOLVED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {fb.status}
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300">{fb.comment}</p>

                  {fb.remark && (
                    <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-[11px] text-indigo-900 dark:text-indigo-200">
                      <strong>Admin Remark:</strong> {fb.remark}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
