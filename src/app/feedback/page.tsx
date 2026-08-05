'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, ShieldCheck, AlertTriangle, Paperclip, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import Link from 'next/link';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { useRouter } from 'next/navigation';
import { OtpVerificationModal } from '@/components/otp-modal';

export default function StudentFeedbackPage() {
  const [facilityType, setFacilityType] = useState<'REGULAR_MESS' | 'NIGHT_CANTEEN'>('REGULAR_MESS');
  const [studentName, setStudentName] = useState('');
  const [hallRoll, setHallRoll] = useState('');
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
    fetch('/api/feedback')
      .then((res) => res.json())
      .then((data) => setFeedbacks(data))
      .catch(() => { });
  };

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !hallRoll || !email || !comment) {
      alert("Please fill in all required fields including your email address.");
      return;
    }
    setIsOtpModalOpen(true);
  };

  const handleExecuteSubmit = async (verifiedEmail: string) => {
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
          email: verifiedEmail,
          comment,
          facilityType,
          mediaUrl,
        }),
      });

      if (res.ok) {
        setStatusMessage('Feedback submitted successfully!');
        setStudentName('');
        setHallRoll('');
        setRoomNo('');
        setComment('');
        setFile(null);
        setMediaUrl('');
        setUploadProgress(0);
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
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mess Feedback Center</h2>
        <p className="text-xs text-gray-500">
          Report food quality or issues related to the regular mess and night canteen.
        </p>
      </div>

      {/* Responsibility Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl flex items-start space-x-2 shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-tight">
          <strong>Use this system responsibly.</strong> Please ensure your complaints are rational, constructive, and factual. Frivolous or abusive feedback delays resolutions for genuine issues.
        </p>
      </div>

      {/* Submission Form */}
      <form
        onSubmit={handleFormSubmit}
        className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm relative overflow-hidden"
      >
        <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>New Feedback Request</span>
        </h3>

        {statusMessage && (
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-medium">
            {statusMessage}
          </div>
        )}

        {/* Facility Selector */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {['REGULAR_MESS', 'NIGHT_CANTEEN'].map((type) => (
             <button
             key={type}
             type="button"
             onClick={() => setFacilityType(type as any)}
             className={`py-1.5 px-1 rounded-lg font-medium border transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${facilityType === type
                 ? 'bg-blue-600 text-white border-blue-600'
                 : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
               }`}
           >
             {type.replace('MAINTENANCE_', '').replace('_', ' ')}
           </button>
          ))}
        </div>

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
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <textarea
          placeholder="Details of complaint (e.g. food quality, exact location of plumbing issue)..."
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
          <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
        </button>
      </form>

      {/* Submitted Complaints & Admin Resolution Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400">
            Recent Requests ({feedbacks.length})
          </h3>
          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            {feedbacks.filter(f => f.status === 'RESOLVED').length} Resolved
          </span>
        </div>

        <div className="space-y-2">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2 text-xs shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-gray-900 dark:text-white">{item.studentName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${
                    item.facilityType.includes('MAINTENANCE')
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                      : item.facilityType === 'NIGHT_CANTEEN'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
                      : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                    }`}>
                    {item.facilityType.replace('MAINTENANCE_', '').replace('_', ' ')}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300`}
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
                <a href={item.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-[10px] font-medium transition-colors text-blue-600">
                  {item.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  <span>View Attached Media</span>
                </a>
              )}

              {item.remark && (
                <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] text-blue-900 dark:text-blue-200 flex items-start space-x-1.5">
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

