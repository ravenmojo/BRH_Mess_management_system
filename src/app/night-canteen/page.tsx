'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Utensils, MessageSquare, Send, CheckCircle, Clock, ShieldCheck, Video, ImageIcon, Download, Camera, Upload, CheckCircle2, Loader2, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { OtpVerificationModal } from '@/components/otp-modal';
import { GrievanceMediaGallery } from '@/components/grievance-media-gallery';
import { TicketBadge } from '@/components/ticket-badge';
import { MyGrievancesView } from '@/components/my-grievances-view';
import { CompactGrievanceCard } from '@/components/compact-grievance-card';

// Smart room number formatter
function formatRoomNo(value: string): string {
  let v = value.toUpperCase().replace(/[^A-D0-9-]/g, '');
  if (v.length >= 1 && /^[A-D]$/.test(v[0])) {
    if (v.length >= 2 && v[1] !== '-') {
      v = v[0] + '-' + v.slice(1);
    }
  }
  if (v.length > 5) v = v.slice(0, 5);
  return v;
}

export default function NightCanteenPage() {
  const [activeTab, setActiveTab] = useState<'menu' | 'grievance' | 'my_grievances'>('menu');

  // Hardcoded Canteen Menu Data
  const canteenMenuItems = [
    { id: 'nc-1', name: 'Egg Bhurji + 2 Parathas', price: 60, category: 'Main Meals', available: true },
    { id: 'nc-2', name: 'Paneer Butter Masala', price: 90, category: 'Main Meals', available: true },
    { id: 'nc-3', name: 'Chicken Roll', price: 70, category: 'Snacks', available: true },
    { id: 'nc-4', name: 'Veg Sandwich', price: 30, category: 'Snacks', available: true },
    { id: 'nc-5', name: 'Plain Maggi', price: 25, category: 'Quick Bites', available: true },
    { id: 'nc-6', name: 'Cheese Maggi', price: 35, category: 'Quick Bites', available: true },
    { id: 'nc-7', name: 'Cold Coffee with Ice Cream', price: 45, category: 'Beverages', available: true },
    { id: 'nc-8', name: 'Masala Chai', price: 10, category: 'Beverages', available: true },
  ];

  // Grievance State
  const [roomNo, setRoomNo] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const fetchCanteenFeedbacks = () => {
    fetch('/api/feedback?facility=NIGHT_CANTEEN')
      .then((res) => res.json())
      .then((data) => setFeedbacks(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('bros_last_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
    fetchCanteenFeedbacks();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const invalid = selectedFiles.find(f => f.size > 20 * 1024 * 1024);
      if (invalid) {
        alert(`File "${invalid.name}" exceeds 20MB limit.`);
        return;
      }
      setFiles(selectedFiles);
      const firstFile = selectedFiles[0];
      const fileDate = firstFile.lastModified ? new Date(firstFile.lastModified) : new Date();
      setCapturedAt(fileDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNo || !/^[A-D]-\d{3}$/.test(roomNo)) {
      alert("Please enter a valid Room No. (e.g. A-515)");
      return;
    }
    if (!email || !comment) {
      alert("Please fill in your email address and grievance details.");
      return;
    }
    setIsOtpModalOpen(true);
  };

  const handleExecuteSubmit = async (verifiedEmail: string) => {
    setSubmitting(true);
    setMessage('');
    try {
      let uploadedUrls: string[] = [];

      if (files.length > 0) {
        setIsUploading(true);
        setUploadProgress(0);
        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const url = await uploadToCloudinary(file, (percent) => {
              const overall = Math.round(((i + percent / 100) / files.length) * 100);
              setUploadProgress(overall);
            });
            uploadedUrls.push(url);
          }
          setUploadProgress(100);
        } catch (err: any) {
          alert('Media upload failed: ' + (err.message || 'Error uploading file'));
          setSubmitting(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const finalMediaPayload = uploadedUrls.length > 1 ? JSON.stringify(uploadedUrls) : (uploadedUrls[0] || '');

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'Anonymous',
          roomNo,
          email: verifiedEmail,
          comment,
          facilityType: 'NIGHT_CANTEEN',
          mediaUrl: finalMediaPayload,
          capturedAt: finalMediaPayload ? capturedAt : null,
        }),
      });

      if (res.ok) {
        const createdData = await res.json();
        setSubmittedTicket(createdData.ticketNumber || null);
        setMessage('Canteen grievance submitted successfully!');
        setRoomNo('');
        setComment('');
        setFiles([]);
        setMediaUrl('');
        setUploadProgress(0);
        fetchCanteenFeedbacks();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to submit grievance. Please try again.');
      }
    } catch (err) {
      setMessage('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header Banner with Tabs */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white shadow-xl shadow-slate-950/30 group ring-1 ring-white/15">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-indigo-500/20 blur-2xl group-hover:scale-125 transition-transform duration-700 ease-out pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
              <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>BROS Night Canteen</span>
            </h2>
            <p className="text-xs text-indigo-200/90 font-medium leading-snug">
              Late night cravings & grievance desk 🌙
            </p>
          </div>

          {/* Navigation Tab Selector */}
          <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-indigo-500/30 shadow-inner">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-spring ${
                activeTab === 'menu'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab('grievance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-spring ${
                activeTab === 'grievance'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Grievance
            </button>
            <button
              onClick={() => setActiveTab('my_grievances')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-spring ${
                activeTab === 'my_grievances'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Issues
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'my_grievances' ? (
        <MyGrievancesView onBackToSubmit={() => setActiveTab('grievance')} />
      ) : activeTab === 'menu' ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canteenMenuItems.map((item) => {
              const catStyles: Record<string, { bg: string; shadow: string }> = {
                'Main Meals': { bg: 'from-amber-500 to-orange-500', shadow: 'shadow-orange-500/25' },
                'Snacks': { bg: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/25' },
                'Quick Bites': { bg: 'from-amber-400 to-yellow-500', shadow: 'shadow-yellow-500/25' },
                'Beverages': { bg: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/25' },
              };
              const style = catStyles[item.category] || { bg: 'from-indigo-500 to-purple-500', shadow: 'shadow-indigo-500/25' };

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shadow-xs hover:border-indigo-400/50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${style.bg} text-white shadow-md ${style.shadow} shrink-0`}>
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-black text-xs text-slate-900 dark:text-white leading-tight">{item.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">₹{item.price}</div>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">Available</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
          {/* Grievance Submission Form */}
          <form
            onSubmit={handleFormSubmit}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl glass-card space-y-3.5 relative overflow-hidden shadow-sm"
          >
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Log Canteen Grievance</span>
            </h3>

            {message && (
              <div className={`p-3 rounded-2xl text-xs font-medium border space-y-1.5 animate-in fade-in duration-200 ${message.includes('success') ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80'}`}>
                <div className="font-semibold">{message}</div>
                {submittedTicket && (
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">Your Ticket Number:</span>
                    <TicketBadge ticketNumber={submittedTicket} size="md" />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Room No. *  e.g. A-515"
                value={roomNo}
                onChange={(e) => setRoomNo(formatRoomNo(e.target.value))}
                maxLength={5}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all uppercase"
              />
              <input
                type="email"
                placeholder="Institute Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>

            <textarea
              placeholder="Describe your grievance, food quality issue, or suggestion..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />

            {/* Media Upload (Optional) */}
            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Paperclip className="w-4 h-4 text-indigo-500" />
                  <span>{files.length > 0 ? `${files.length} File(s) Selected` : 'Attach Photos/Videos (Multiple, Max 20MB each)'}</span>
                </div>
                <input 
                  type="file" 
                  multiple
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {files.length > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </label>
            </div>

            {isUploading && (
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300 shadow-sm shadow-indigo-500/50"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {submitting && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-1.5 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <span className="flex items-center space-x-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>{isUploading ? `Uploading Media Proof (${uploadProgress}%)...` : 'Submitting Canteen Grievance...'}</span>
                  </span>
                  {isUploading && <span className="font-mono text-[11px]">{uploadProgress}%</span>}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isUploading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 touch-spring"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{submitting ? (isUploading ? `Uploading Media (${uploadProgress}%)...` : 'Submitting...') : 'Submit Canteen Grievance'}</span>
            </button>
          </form>

          {/* Canteen Grievances Timeline */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
              Recent Canteen Grievances {feedbacks.length > 0 && `(Showing ${Math.min(feedbacks.length, 5)} of ${feedbacks.length})`}
            </h4>

            {feedbacks.length === 0 ? (
              <div className="p-5 rounded-2xl glass-card text-center text-xs font-semibold text-slate-500">
                No canteen grievances submitted yet.
              </div>
            ) : (
              <div className="space-y-2">
                {feedbacks.slice(0, 5).map((fb) => (
                  <CompactGrievanceCard
                    key={fb.id}
                    item={fb}
                    showFacilityBadge={false}
                    accentColor="indigo"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Link */}
      <div className="pt-2 flex justify-center">
        <Link href="/night-canteen/admin" className="px-4 py-2 rounded-full border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm touch-spring">
          <ShieldCheck className="w-4 h-4" />
          <span>Access Canteen Admin Panel</span>
        </Link>
      </div>

      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        initialEmail={email}
        onVerified={handleExecuteSubmit}
      />
    </div>
  );
}
