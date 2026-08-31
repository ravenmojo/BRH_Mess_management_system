'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, Clock, ShieldCheck, ShowerHead, Droplet, Zap, Hammer, Sparkles, Wrench, AlertTriangle, Paperclip, Loader2, Dumbbell, ArrowRight, ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { Footer } from '@/components/footer';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { useRouter } from 'next/navigation';
import { OtpVerificationModal } from '@/components/otp-modal';
import { GrievanceMediaGallery } from '@/components/grievance-media-gallery';
import { TicketBadge } from '@/components/ticket-badge';
import { MyGrievancesView } from '@/components/my-grievances-view';
import { CompactGrievanceCard } from '@/components/compact-grievance-card';

type MaintenanceCategory =
  | 'MAINTENANCE_WASHROOM'
  | 'MAINTENANCE_WATER'
  | 'MAINTENANCE_ELECTRICAL'
  | 'MAINTENANCE_CIVIL'
  | 'MAINTENANCE_CLEANING'
  | 'MAINTENANCE_OUTDOOR';

const CATEGORIES = [
  {
    id: 'MAINTENANCE_WASHROOM',
    label: 'Washroom',
    icon: ShowerHead,
    iconStyle: 'bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400',
    hoverStyle: 'hover:border-cyan-400/60 hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20',
    activeCard: 'border-cyan-500/80 bg-cyan-50/70 dark:bg-cyan-950/50 text-cyan-950 dark:text-cyan-100 ring-1 ring-cyan-500/30',
    activeIcon: 'bg-cyan-600 text-white shadow-xs',
  },
  {
    id: 'MAINTENANCE_WATER',
    label: 'Drinking Water',
    icon: Droplet,
    iconStyle: 'bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400',
    hoverStyle: 'hover:border-blue-400/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20',
    activeCard: 'border-blue-500/80 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500/30',
    activeIcon: 'bg-blue-600 text-white shadow-xs',
  },
  {
    id: 'MAINTENANCE_ELECTRICAL',
    label: 'Electrical',
    icon: Zap,
    iconStyle: 'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400',
    hoverStyle: 'hover:border-amber-400/60 hover:bg-amber-50/30 dark:hover:bg-amber-950/20',
    activeCard: 'border-amber-500/80 bg-amber-50/70 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500/30',
    activeIcon: 'bg-amber-500 text-white shadow-xs',
  },
  {
    id: 'MAINTENANCE_CIVIL',
    label: 'Civil',
    icon: Hammer,
    iconStyle: 'bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400',
    hoverStyle: 'hover:border-orange-400/60 hover:bg-orange-50/30 dark:hover:bg-orange-950/20',
    activeCard: 'border-orange-500/80 bg-orange-50/70 dark:bg-orange-950/50 text-orange-950 dark:text-orange-100 ring-1 ring-orange-500/30',
    activeIcon: 'bg-orange-600 text-white shadow-xs',
  },
  {
    id: 'MAINTENANCE_CLEANING',
    label: 'Cleaning',
    icon: Sparkles,
    iconStyle: 'bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400',
    hoverStyle: 'hover:border-purple-400/60 hover:bg-purple-50/30 dark:hover:bg-purple-950/20',
    activeCard: 'border-purple-500/80 bg-purple-50/70 dark:bg-purple-950/50 text-purple-950 dark:text-purple-100 ring-1 ring-purple-500/30',
    activeIcon: 'bg-purple-600 text-white shadow-xs',
  },
  {
    id: 'MAINTENANCE_OUTDOOR',
    label: 'Gym & Outdoors',
    icon: Dumbbell,
    iconStyle: 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    hoverStyle: 'hover:border-emerald-400/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20',
    activeCard: 'border-emerald-500/80 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30',
    activeIcon: 'bg-emerald-600 text-white shadow-xs',
  },
] as const;

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

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<'SUBMIT' | 'MY_GRIEVANCES'>('SUBMIT');
  const [facilityType, setFacilityType] = useState<MaintenanceCategory>('MAINTENANCE_WASHROOM');
  const [studentName, setStudentName] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // OTP Modal state
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  // Upload state
  const [files, setFiles] = useState<File[]>([]);
  const [capturedAt, setCapturedAt] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string>('');

  const router = useRouter();

  const loadFeedbacks = () => {
    fetch('/api/feedback?facility=MAINTENANCE')
      .then((res) => res.json())
      .then((data) => {
        setFeedbacks(Array.isArray(data) ? data : []);
      })
      .catch(() => { });
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('bros_last_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }

    loadFeedbacks();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const invalid = selectedFiles.find(f => f.size > 20 * 1024 * 1024);
      if (invalid) {
        alert(`File "${invalid.name}" exceeds the 20MB limit.`);
        return;
      }
      setFiles(selectedFiles);
      const firstFile = selectedFiles[0];
      const lastMod = firstFile.lastModified ? new Date(firstFile.lastModified) : new Date();
      const capturedStr = lastMod.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST';
      setCapturedAt(capturedStr);
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
    setStatusMessage('');
    setSubmittedTicket(null);

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
          studentName: studentName.trim() || 'Anonymous',
          roomNo,
          email: verifiedEmail,
          comment,
          facilityType,
          mediaUrl: finalMediaPayload,
          capturedAt: finalMediaPayload ? capturedAt : null,
        }),
      });

      if (res.ok) {
        const createdData = await res.json();
        setSubmittedTicket(createdData.ticketNumber || null);
        setStatusMessage('Maintenance grievance logged successfully!');
        setStudentName('');
        setRoomNo('');
        setComment('');
        setFiles([]);
        setMediaUrl('');
        setUploadProgress(0);
        loadFeedbacks();
      } else {
        const data = await res.json();
        setStatusMessage(data.error || 'Failed to submit grievance. Please try again.');
      }
    } catch (err) {
      setStatusMessage('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (type: string) => {
    return CATEGORIES.find(c => c.id === type)?.label || 'Maintenance';
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-4 sm:p-5 text-white shadow-xl shadow-slate-950/30 group ring-1 ring-white/15">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/15 blur-2xl group-hover:scale-125 transition-transform duration-700 ease-out pointer-events-none" />
        <div className="absolute right-4 -bottom-6 w-28 h-28 rounded-full bg-sky-400/25 blur-xl group-hover:bg-sky-400/40 transition-all duration-700 ease-out pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-sky-400 shrink-0" />
              <span>BROS Maintenance</span>
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-snug">
              Fixing faults before they unfix you... 🛠️
            </p>
          </div>

          {/* Tab Navigation Pill Slider */}
          <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-sky-500/30 shadow-inner">
            <button
              onClick={() => setActiveTab('SUBMIT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-spring ${
                activeTab === 'SUBMIT'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Submit Issue
            </button>
            <button
              onClick={() => setActiveTab('MY_GRIEVANCES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-spring flex items-center space-x-1 ${
                activeTab === 'MY_GRIEVANCES'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>My Grievances</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Page Slider / View Controller */}
      {activeTab === 'MY_GRIEVANCES' ? (
        <MyGrievancesView onBackToSubmit={() => setActiveTab('SUBMIT')} />
      ) : (
        <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
          {/* Responsibility Disclaimer */}
          <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-3.5 rounded-2xl flex items-start space-x-2.5 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
              <strong>Use this system responsibly.</strong> Please ensure your grievances are rational, constructive, and factual. Frivolous or abusive submissions delay resolutions for genuine issues.
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = facilityType === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setFacilityType(cat.id as MaintenanceCategory)}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all duration-200 touch-spring ${
                    isActive
                      ? `${cat.activeCard} scale-[1.02]`
                      : `glass-card border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 ${cat.hoverStyle}`
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl transition-all duration-200 ${
                      isActive ? cat.activeIcon : cat.iconStyle
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-center leading-tight tracking-tight">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cleaning Notice for Common Areas */}
          {facilityType === 'MAINTENANCE_CLEANING' && (
            <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 p-3 rounded-2xl flex items-center space-x-2.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <p className="text-[11px] text-purple-900 dark:text-purple-200 leading-snug font-medium">
                <strong>Common Areas Only:</strong> Cleaning requests are dedicated to hall corridors, lounges, staircases, and shared facilities (not personal room cleaning).
              </p>
            </div>
          )}

          {/* Submission Form */}
          <form
            onSubmit={handleFormSubmit}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl glass-card space-y-3.5 relative overflow-hidden shadow-sm"
          >
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>New Grievance Details</span>
            </h3>

            {statusMessage && (
              <div className={`p-3 rounded-2xl text-xs font-medium border space-y-1.5 animate-in fade-in duration-200 ${statusMessage.includes('success') ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80'}`}>
                <div className="font-semibold">{statusMessage}</div>
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
                placeholder="Name (optional)"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
              />
              <input
                type="text"
                placeholder="Room No. *  e.g. A-515"
                value={roomNo}
                onChange={(e) => setRoomNo(formatRoomNo(e.target.value))}
                maxLength={5}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all uppercase"
              />
            </div>
            <input
              type="email"
              placeholder="Institute Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
            />

            <textarea
              placeholder="Describe the exact location and issue (e.g., C-Block ground floor right side washroom sink is broken)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
            />

            {/* Media Upload */}
            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Paperclip className="w-4 h-4 text-sky-500" />
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
                  className="h-full bg-sky-600 transition-all duration-300 shadow-sm shadow-sky-500/50"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {submitting && (
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 space-y-1.5 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-300">
                  <span className="flex items-center space-x-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    <span>{isUploading ? `Uploading Media Proof (${uploadProgress}%)...` : 'Submitting Maintenance Grievance...'}</span>
                  </span>
                  {isUploading && <span className="font-mono text-[11px]">{uploadProgress}%</span>}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isUploading}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 touch-spring"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{submitting ? (isUploading ? `Uploading Media (${uploadProgress}%)...` : 'Submitting...') : 'Submit Grievance'}</span>
            </button>
          </form>

          {/* Submitted Grievances & Admin Resolution Timeline */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Recent Maintenance Grievances {feedbacks.length > 0 && `(Showing ${Math.min(feedbacks.length, visibleCount)} of ${feedbacks.length})`}
              </h3>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200/80 dark:border-sky-800/80">
                {feedbacks.filter(f => f.status === 'RESOLVED').length} Resolved
              </span>
            </div>

            {feedbacks.length === 0 ? (
              <div className="p-5 rounded-2xl glass-card text-center text-xs font-semibold text-slate-500">
                No maintenance grievances submitted yet.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-[480px] sm:max-h-[520px] grievance-scroll-box pr-1 sm:pr-1.5 space-y-2">
                  {feedbacks.slice(0, visibleCount).map((item) => (
                    <CompactGrievanceCard
                      key={item.id}
                      item={item}
                      showFacilityBadge={true}
                      accentColor="sky"
                    />
                  ))}
                </div>

                {feedbacks.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(feedbacks.length, prev + 10))}
                    className="w-full py-2.5 rounded-xl border border-sky-200/80 dark:border-sky-800/80 bg-sky-50/70 hover:bg-sky-100/80 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs touch-spring"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>
                      Show More Grievances (+{Math.min(10, feedbacks.length - visibleCount)} more)
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Link */}
      <div className="pt-2 flex justify-center">
        <Link href="/maintenance/admin" className="px-4 py-2 rounded-full border border-sky-200/80 dark:border-sky-800/80 bg-sky-50/80 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors shadow-sm touch-spring">
          <ShieldCheck className="w-4 h-4" />
          <span>Access Maintenance Admin Panel</span>
        </Link>
      </div>

      <Footer />

      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        initialEmail={email}
        onVerified={handleExecuteSubmit}
      />
    </div>
  );
}
