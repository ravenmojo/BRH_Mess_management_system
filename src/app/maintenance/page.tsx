'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, Clock, ShieldCheck, ShowerHead, Droplet, Zap, Hammer, Sparkles, Wrench, AlertTriangle, Paperclip, Loader2, Image as ImageIcon, Video, TreePine, Download } from 'lucide-react';
import { Footer } from '@/components/footer';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { useRouter } from 'next/navigation';
import { OtpVerificationModal } from '@/components/otp-modal';

type MaintenanceCategory =
  | 'MAINTENANCE_WASHROOM'
  | 'MAINTENANCE_WATER'
  | 'MAINTENANCE_ELECTRICAL'
  | 'MAINTENANCE_CIVIL'
  | 'MAINTENANCE_CLEANING'
  | 'MAINTENANCE_OUTDOOR';

const CATEGORIES = [
  { id: 'MAINTENANCE_WASHROOM', label: 'Washroom', icon: ShowerHead },
  { id: 'MAINTENANCE_WATER', label: 'Water', icon: Droplet },
  { id: 'MAINTENANCE_ELECTRICAL', label: 'Electrical', icon: Zap },
  { id: 'MAINTENANCE_CIVIL', label: 'Civil', icon: Hammer },
  { id: 'MAINTENANCE_CLEANING', label: 'Cleaning', icon: Sparkles },
  { id: 'MAINTENANCE_OUTDOOR', label: 'Outdoor', icon: TreePine },
] as const;

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

export default function MaintenancePage() {
  const [facilityType, setFacilityType] = useState<MaintenanceCategory>('MAINTENANCE_WASHROOM');
  const [studentName, setStudentName] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // OTP Modal state
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
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
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 20 * 1024 * 1024) {
        alert("File size exceeds 20MB limit.");
        return;
      }
      setFile(selectedFile);
      const lastMod = selectedFile.lastModified ? new Date(selectedFile.lastModified) : new Date();
      const capturedStr = lastMod.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
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

    try {
      let uploadedMediaUrl = '';

      if (file) {
        setIsUploading(true);
        setUploadProgress(0);
        try {
          uploadedMediaUrl = await uploadToCloudinary(file, (percent) => {
            setUploadProgress(percent);
          });
          setMediaUrl(uploadedMediaUrl);
        } catch (err: any) {
          alert('Media upload failed: ' + (err.message || 'Error uploading file'));
          setSubmitting(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName.trim() || 'Anonymous',
          roomNo,
          email: verifiedEmail,
          comment,
          facilityType,
          mediaUrl: uploadedMediaUrl,
          capturedAt: uploadedMediaUrl ? capturedAt : null,
        }),
      });

      if (res.ok) {
        setStatusMessage('Grievance submitted successfully to Maintenance Secretary!');
        setStudentName('');
        setRoomNo('');
        setComment('');
        setFile(null);
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-indigo-950 to-slate-900 p-5 text-white shadow-xl shadow-slate-950/20">
        <div className="relative z-10 space-y-1">
          <h2 className="text-xl font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-blue-400" />
            <span>BROS Maintenance</span>
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-[280px]">
            Log grievances for washrooms, electrical faults, civil issues, cleaning, and outdoor areas.
          </p>
        </div>
      </div>

      {/* Responsibility Disclaimer */}
      <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-3.5 rounded-2xl flex items-start space-x-2.5 shadow-sm">
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
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all duration-200 ${isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'glass-card text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              <span className="text-xs font-bold text-center leading-tight">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Submission Form */}
      <form
        onSubmit={handleFormSubmit}
        className="p-5 rounded-2xl glass-card space-y-3.5 relative overflow-hidden"
      >
        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>New Grievance Details</span>
        </h3>

        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs font-medium border ${statusMessage.includes('success') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'}`}>
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <input
            type="text"
            placeholder="Name (optional)"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="text"
            placeholder="Room No. *  e.g. A-515"
            value={roomNo}
            onChange={(e) => setRoomNo(formatRoomNo(e.target.value))}
            maxLength={5}
            required
            className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
          />
        </div>
        <input
          type="email"
          placeholder="Institute Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />

        <textarea
          placeholder="Describe the exact location and issue (e.g., C-Block ground floor right side washroom sink is broken)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          required
          className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />

        {/* Media Upload */}
        <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/50">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Paperclip className="w-4 h-4" />
              <span>{file ? file.name : 'Attach a photo/video (Max 20MB)'}</span>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {isUploading && (
              <span className="text-[10px] font-bold text-blue-600">
                {uploadProgress}%
              </span>
            )}
            {mediaUrl && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </label>
          {isUploading && (
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || isUploading}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{submitting ? 'Submitting...' : 'Submit Grievance'}</span>
        </button>
      </form>

      {/* Submitted Grievances & Admin Resolution Timeline */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Recent Maintenance Grievances ({feedbacks.length})
          </h3>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            {feedbacks.filter(f => f.status === 'RESOLVED').length} Resolved
          </span>
        </div>

        <div className="space-y-2.5">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl glass-card space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white truncate">{item.studentName || 'Anonymous'}</span>
                  {item.roomNo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono shrink-0">{item.roomNo}</span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider shrink-0 ${item.facilityType === 'MAINTENANCE_WASHROOM' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800' :
                      item.facilityType === 'MAINTENANCE_WATER' ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-400 dark:border-cyan-800' :
                        item.facilityType === 'MAINTENANCE_ELECTRICAL' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' :
                          item.facilityType === 'MAINTENANCE_CIVIL' ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' :
                            item.facilityType === 'MAINTENANCE_OUTDOOR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' :
                              'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800'
                    }`}>
                    {getCategoryLabel(item.facilityType)}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 shrink-0 ml-2 ${item.status === 'RESOLVED'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
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

              <p className="text-slate-700 dark:text-slate-300 font-medium">{item.comment}</p>

              {item.mediaUrl && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px]">
                  <div className="flex items-center space-x-2">
                    <a href={item.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      {item.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      <span>View Media</span>
                    </a>
                    <a
                      href={item.mediaUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-200/70 dark:bg-slate-700/70 px-2 py-0.5 rounded-md transition-colors"
                      title="Download Media File"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                  <span className="text-slate-500 font-mono text-[9.5px] flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400 inline" />
                    <span>Captured: {item.capturedAt || new Date(item.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  </span>
                </div>
              )}

              {item.remark && (
                <div className="mt-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] text-blue-900 dark:text-blue-200 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Maintenance Secretary:</strong> {item.remark}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Link */}
      <div className="pt-2 flex justify-center">
        <Link href="/maintenance/admin" className="px-4 py-2 rounded-full border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm">
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
