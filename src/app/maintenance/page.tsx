'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, Clock, ShieldCheck, ShowerHead, Droplet, Zap, Hammer, Sparkles, Wrench, AlertTriangle, Paperclip, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { Footer } from '@/components/footer';
import { createClient } from '@/utils/supabase/client';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { useRouter } from 'next/navigation';

type MaintenanceCategory =
  | 'MAINTENANCE_WASHROOM'
  | 'MAINTENANCE_WATER'
  | 'MAINTENANCE_ELECTRICAL'
  | 'MAINTENANCE_CIVIL'
  | 'MAINTENANCE_CLEANING';

const CATEGORIES = [
  { id: 'MAINTENANCE_WASHROOM', label: 'Washroom', icon: ShowerHead },
  { id: 'MAINTENANCE_WATER', label: 'Drinking Water', icon: Droplet },
  { id: 'MAINTENANCE_ELECTRICAL', label: 'Electrical', icon: Zap },
  { id: 'MAINTENANCE_CIVIL', label: 'Civil', icon: Hammer },
  { id: 'MAINTENANCE_CLEANING', label: 'Cleaning', icon: Sparkles },
] as const;

export default function MaintenancePage() {
  const [facilityType, setFacilityType] = useState<MaintenanceCategory>('MAINTENANCE_WASHROOM');
  const [studentName, setStudentName] = useState('');
  const [hallRoll, setHallRoll] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Auth state
  const [user, setUser] = useState<any>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string>('');

  const router = useRouter();
  const supabase = createClient();

  const loadFeedbacks = () => {
    fetch('/api/feedback')
      .then((res) => res.json())
      .then((data) => {
        // Filter only maintenance feedbacks
        const maintenanceFb = data.filter((f: any) => f.facilityType.startsWith('MAINTENANCE_'));
        setFeedbacks(maintenanceFb);
      })
      .catch(() => { });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.email) {
        setEmail(user.email);
      }
    });

    loadFeedbacks();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check 20MB limit
      if (selectedFile.size > 20 * 1024 * 1024) {
        alert("File size exceeds 20MB limit.");
        return;
      }
      setFile(selectedFile);

      // Auto-upload to Cloudinary
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const url = await uploadToCloudinary(selectedFile, (percent) => {
          setUploadProgress(percent);
        });
        setMediaUrl(url);
      } catch (err: any) {
        alert("Upload failed: " + err.message);
        setFile(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?next=/maintenance');
      return;
    }
    if (!studentName || !hallRoll || !comment) return;

    setSubmitting(true);
    setStatusMessage('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          hallRoll,
          roomNo,
          email,
          comment,
          facilityType,
          mediaUrl,
        }),
      });

      if (res.ok) {
        setStatusMessage('Complaint submitted successfully to Maintenance Secretary!');
        setStudentName('');
        setHallRoll('');
        setRoomNo('');
        setComment('');
        setFile(null);
        setMediaUrl('');
        setUploadProgress(0);
        loadFeedbacks();
      } else {
        setStatusMessage('Failed to submit complaint. Please try again.');
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white shadow-lg">
        <div className="relative z-10 space-y-0.5">
          <h2 className="text-lg font-black tracking-tight drop-shadow-sm flex items-center space-x-1.5">
            <Wrench className="w-4 h-4 text-blue-300" />
            <span>BROS Maintenance</span>
          </h2>
          <p className="text-[11px] text-slate-300 font-medium max-w-[280px]">
            Log complaints for washrooms, electrical faults, civil issues, and cleaning.
          </p>
        </div>
      </div>

      {/* Responsibility Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl flex items-start space-x-2 shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-tight">
          <strong>Use this system responsibly.</strong> Please ensure your complaints are rational, constructive, and factual. Frivolous or abusive feedback delays resolutions for genuine issues.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = facilityType === cat.id;
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => setFacilityType(cat.id as MaintenanceCategory)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              <span className="text-[11px] font-bold text-center leading-tight">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm relative overflow-hidden"
      >
        <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
          <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>New Complaint Details</span>
        </h3>

        {statusMessage && (
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-medium">
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Student Name *"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Roll No *"
            value={hallRoll}
            onChange={(e) => setHallRoll(e.target.value)}
            required
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Room No"
            value={roomNo}
            onChange={(e) => setRoomNo(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email *"
            value={email}
            readOnly
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none cursor-not-allowed"
          />
        </div>

        <textarea
          placeholder="Describe the exact location and issue (e.g., C-Block ground floor right side washroom sink is broken)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          required
          className="w-full px-3 py-2 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Media Upload */}
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/50">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
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
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </label>
          {isUploading && (
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
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
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{submitting ? 'Submitting...' : 'Submit Complaint'}</span>
        </button>
      </form>

      {/* Submitted Complaints & Admin Resolution Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400">
            Recent Maintenance Complaints ({feedbacks.length})
          </h3>
          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            {feedbacks.filter(f => f.status === 'RESOLVED').length} Resolved
          </span>
        </div>

        <div className="space-y-2">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5 text-xs shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-gray-900 dark:text-white">{item.studentName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${item.facilityType === 'MAINTENANCE_WASHROOM' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                      item.facilityType === 'MAINTENANCE_WATER' ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800' :
                        item.facilityType === 'MAINTENANCE_ELECTRICAL' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                          item.facilityType === 'MAINTENANCE_CIVIL' ? 'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-900/30 dark:text-stone-400 dark:border-stone-800' :
                            'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800'
                    }`}>
                    {getCategoryLabel(item.facilityType)}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 ${item.status === 'RESOLVED'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
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

              {item.mediaUrl && (
                <a href={item.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-[10px] font-medium transition-colors text-blue-600 mt-1">
                  {item.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  <span>View Attached Media</span>
                </a>
              )}

              {item.remark && (
                <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] text-blue-900 dark:text-blue-200 flex items-start space-x-1.5">
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
        <Link href="/maintenance/admin" className="px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
          <ShieldCheck className="w-4 h-4" />
          <span>Access Maintenance Admin Panel</span>
        </Link>
      </div>

      <Footer />
    </div>
  );
}
