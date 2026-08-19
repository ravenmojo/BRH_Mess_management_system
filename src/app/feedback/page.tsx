'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, ShieldCheck, AlertTriangle, Paperclip, Loader2, Image as ImageIcon, Video, Download } from 'lucide-react';
import Link from 'next/link';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { useRouter } from 'next/navigation';
import { OtpVerificationModal } from '@/components/otp-modal';
import { GrievanceMediaGallery } from '@/components/grievance-media-gallery';
import { TicketBadge } from '@/components/ticket-badge';

// Smart room number formatter: auto-capitalize wing, auto-insert dash
function formatRoomNo(value: string): string {
  let v = value.toUpperCase().replace(/[^A-D0-9-]/g, '');
  // If first char is a valid wing letter and second char isn't a dash, insert dash
  if (v.length >= 1 && /^[A-D]$/.test(v[0])) {
    if (v.length >= 2 && v[1] !== '-') {
      v = v[0] + '-' + v.slice(1);
    }
  }
  // Limit to wing + dash + 3 digits (max 5 chars: A-515)
  if (v.length > 5) v = v.slice(0, 5);
  return v;
}

export default function StudentFeedbackPage() {
  const [studentName, setStudentName] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
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

  useEffect(() => {
    const savedEmail = localStorage.getItem('bros_last_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }

    loadFeedbacks();
  }, []);

  const loadFeedbacks = () => {
    fetch('/api/feedback?facility=REGULAR_MESS')
      .then((res) => res.json())
      .then((data) => setFeedbacks(data))
      .catch(() => { });
  };

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
          facilityType: 'REGULAR_MESS',
          mediaUrl: finalMediaPayload,
          capturedAt: finalMediaPayload ? capturedAt : null,
        }),
      });

      if (res.ok) {
        const createdData = await res.json();
        setSubmittedTicket(createdData.ticketNumber || null);
        setStatusMessage('Grievance submitted successfully!');
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

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mess Grievance Center</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Report food quality or issues related to the regular mess.
        </p>
      </div>

      {/* Responsibility Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl flex items-start space-x-2 shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-tight">
          <strong>Use this system responsibly.</strong> Please ensure your grievances are rational, constructive, and factual. Frivolous or abusive submissions delay resolutions for genuine issues.
        </p>
      </div>

      {/* Submission Form */}
      <form
        onSubmit={handleFormSubmit}
        className="p-4 rounded-2xl glass-card space-y-3"
      >
        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>New Grievance</span>
        </h3>

        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs font-medium space-y-1.5 ${statusMessage.includes('success') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
            <div className="flex items-center justify-between">
              <span>{statusMessage}</span>
            </div>
            {submittedTicket && (
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">Your Ticket Number:</span>
                <TicketBadge ticketNumber={submittedTicket} size="md" />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Name (optional)"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="text"
            placeholder="Room No. *  e.g. A-515"
            value={roomNo}
            onChange={(e) => setRoomNo(formatRoomNo(e.target.value))}
            maxLength={5}
            required
            className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
          />
        </div>
        <input
          type="email"
          placeholder="Institute Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />

        <textarea
          placeholder="Describe the issue (e.g. food quality, hygiene concern)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          required
          className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />

        {/* Media Upload */}
        <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/50">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Paperclip className="w-4 h-4" />
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
            {isUploading && (
              <span className="text-[10px] font-bold text-blue-600">
                {uploadProgress}%
              </span>
            )}
            {files.length > 0 && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </label>
        </div>

        {isUploading && (
          <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {submitting && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
              <span className="flex items-center space-x-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>{isUploading ? `Uploading Media Proof (${uploadProgress}%)...` : 'Submitting Grievance...'}</span>
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
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-md shadow-blue-500/20"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{submitting ? (isUploading ? `Uploading Media (${uploadProgress}%)...` : 'Submitting...') : 'Submit Grievance'}</span>
        </button>
      </form>

      {/* Submitted Grievances & Admin Resolution Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Recent Grievances ({feedbacks.length})
          </h3>
          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            {feedbacks.filter(f => f.status === 'RESOLVED').length} Resolved
          </span>
        </div>

        <div className="space-y-2">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl glass-card space-y-2 text-xs"
            >
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                  <span className="font-bold text-slate-900 dark:text-white">{item.studentName || 'Anonymous'}</span>
                  {item.roomNo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">{item.roomNo}</span>
                  )}
                  {item.ticketNumber && (
                    <TicketBadge ticketNumber={item.ticketNumber} size="sm" />
                  )}
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 shrink-0 ${item.status === 'RESOLVED'
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

              <p className="text-slate-700 dark:text-slate-300">{item.comment}</p>
              
              <GrievanceMediaGallery mediaUrl={item.mediaUrl} capturedAt={item.capturedAt} createdAt={item.createdAt} />

              {/* Resolution Attribution */}
              {item.status === 'RESOLVED' && (
                <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Resolved by <strong className="font-semibold">{item.resolvedBy || item.resolvedByRole || 'Admin'}</strong>
                    {item.resolvedAt && ` • ${new Date(item.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST`}
                  </span>
                </div>
              )}

              {item.remark && (
                <div className="mt-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] text-blue-900 dark:text-blue-200 flex items-start space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Admin Remark:</strong> {item.remark}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
