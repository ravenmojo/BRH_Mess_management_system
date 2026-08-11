'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Utensils, MessageSquare, Send, CheckCircle, Clock, ShieldCheck, Video, ImageIcon, Download, Camera, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { OtpVerificationModal } from '@/components/otp-modal';
import { GrievanceMediaGallery } from '@/components/grievance-media-gallery';

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
  const [activeTab, setActiveTab] = useState<'menu' | 'grievance'>('menu');

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
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const fetchCanteenFeedbacks = () => {
    fetch('/api/feedback?facility=NIGHT_CANTEEN')
      .then((res) => res.json())
      .then((data) => setFeedbacks(data))
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
          const finalPayload = uploadedUrls.length > 1 ? JSON.stringify(uploadedUrls) : (uploadedUrls[0] || '');
          setMediaUrl(finalPayload);
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
        setMessage('Grievance submitted successfully!');
        setRoomNo('');
        setComment('');
        setFiles([]);
        setMediaUrl('');
        setUploadProgress(0);
        fetchCanteenFeedbacks();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to submit grievance.');
      }
    } catch (err) {
      setMessage('Failed to submit grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-5 text-white shadow-xl shadow-indigo-950/20 flex items-center justify-between ring-1 ring-white/10">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-bold mb-1 tracking-wider uppercase">
            <Moon className="w-3.5 h-3.5" />
            <span>BROS NIGHT CANTEEN</span>
          </div>
          <h2 className="text-base font-black">Independent Canteen Services</h2>
          <p className="text-[11px] text-slate-300 font-medium">Open 09:30 PM - 02:00 AM Daily</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-2.5 py-1 rounded-full bg-blue-600/30 text-[10px] font-bold font-mono border border-blue-400/30 text-blue-200">
            No Budget Cap
          </span>
        </div>
      </div>

      {/* 2-TAB SWITCHER */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-800/80 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'menu'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Menu</span>
        </button>

        <button
          onClick={() => setActiveTab('grievance')}
          className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'grievance'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Grievances</span>
        </button>
      </div>

      {/* TAB 1: MENU */}
      {activeTab === 'menu' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500">
            <span>Item Name & Category</span>
            <span>Price</span>
          </div>

          <div className="space-y-2">
            {canteenMenuItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl glass-card flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                    ₹{item.price}
                  </span>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end space-x-0.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>Available</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GRIEVANCES */}
      {activeTab === 'grievance' && (
        <div className="space-y-4">
          <form
            onSubmit={handleFormSubmit}
            className="p-5 rounded-2xl glass-card space-y-3.5"
          >
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Submit Night Canteen Grievance</span>
            </h3>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-medium border ${message.includes('success') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'}`}>
                {message}
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
                className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
              />
              <input
                type="email"
                placeholder="Institute Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <textarea
              placeholder="Describe your grievance, food quality issue, or suggestion..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />

            {/* Media Upload (Optional) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {files.length > 0 ? `${files.length} File(s) Selected` : 'Attach Photos/Videos (Multiple, Max 20MB each)'}
                  </span>
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

            {submitting && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                  <span className="flex items-center space-x-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>{isUploading ? `Uploading Media Proof (${uploadProgress}%)...` : 'Submitting Canteen Grievance...'}</span>
                  </span>
                  {isUploading && <span className="font-mono text-[11px]">{uploadProgress}%</span>}
                </div>
                {isUploading && (
                  <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isUploading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{submitting ? (isUploading ? `Uploading Media (${uploadProgress}%)...` : 'Submitting...') : 'Submit Canteen Grievance'}</span>
            </button>
          </form>

          {/* Canteen Grievances Timeline */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
              Canteen Grievance History ({feedbacks.length})
            </h4>

            {feedbacks.length === 0 ? (
              <div className="p-5 rounded-2xl glass-card text-center text-xs font-semibold text-slate-500">
                No canteen grievances submitted yet.
              </div>
            ) : (
              feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-2xl glass-card space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {fb.studentName || 'Anonymous'}
                      </span>
                      {fb.roomNo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">{fb.roomNo}</span>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        fb.status === 'RESOLVED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {fb.status}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 font-medium">{fb.comment}</p>

                  <GrievanceMediaGallery mediaUrl={fb.mediaUrl} capturedAt={fb.capturedAt} createdAt={fb.createdAt} />

                  {fb.remark && (
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] text-blue-900 dark:text-blue-200">
                      <strong>Admin Remark:</strong> {fb.remark}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Admin Link */}
      <div className="pt-2 flex justify-center">
        <Link href="/night-canteen/admin" className="px-4 py-2 rounded-full border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm">
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
