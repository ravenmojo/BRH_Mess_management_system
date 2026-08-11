'use client';

import React, { useState, useEffect } from 'react';
import { Camera, UploadCloud, Loader2, Trash2, Video, ImageIcon, Download, Clock, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { AdminAuthGate, useAdminAuth } from '@/components/admin-auth-gate';

const CATEGORIES = [
  { id: 'GENERAL', label: 'General' },
  { id: 'CLEANING', label: 'Cleaning & Hygiene' },
  { id: 'RAW_MATERIALS', label: 'Raw Materials' },
  { id: 'WEIGHT_CHECK', label: 'Weight Checking' },
  { id: 'PACKAGING', label: 'Packaging' },
];

export default function AdminGalleryPage() {
  return (
    <AdminAuthGate title="Gallery Admin Portal">
      <AdminGalleryContent />
    </AdminAuthGate>
  );
}

function AdminGalleryContent() {
  const { isAuthenticated } = useAdminAuth();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('GENERAL');
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadImages();
    }
  }, [isAuthenticated]);

  const loadImages = () => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 25 * 1024 * 1024) {
        alert("File size exceeds 25MB limit.");
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setNoticeMessage(null);

    try {
      const url = await uploadToCloudinary(file, (pct) => setProgress(pct));

      await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, caption, category, uploaderName: 'Mess Secretary', uploaderRollNo: 'ADMIN' })
      });

      setFile(null);
      setCaption('');
      setCategory('GENERAL');
      loadImages();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    setNoticeMessage(null);
    try {
      const res = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.cloudinaryNotice) {
        setNoticeMessage(data.cloudinaryNotice);
      } else {
        setNoticeMessage('Media removed successfully!');
      }
      loadImages();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) {
      alert('No gallery media available to download.');
      return;
    }

    setDownloadingAll(true);
    setDownloadProgress(`Preparing download for ${images.length} files...`);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      setDownloadProgress(`Downloading file ${i + 1} of ${images.length}...`);
      try {
        const response = await fetch(img.url);
        const blob = await response.blob();
        const ext = img.url.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `BROS_Gallery_${img.category || 'media'}_${i + 1}.${ext}`;

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        await new Promise((resolve) => setTimeout(resolve, 400));
      } catch (err) {
        console.error(`Failed to download ${img.url}:`, err);
      }
    }

    setDownloadProgress('All available media downloads completed!');
    setTimeout(() => {
      setDownloadingAll(false);
      setDownloadProgress('');
    }, 3000);
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 flex flex-col">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center space-x-2 text-gray-900 dark:text-white mb-1">
            <Camera className="w-6 h-6 text-blue-600" />
            <span>Mess Duty Gallery Admin</span>
          </h1>
          <p className="text-xs text-gray-500">Upload, manage, and download media records of mess operations.</p>
        </div>

        {/* Admin Bulk Download Button */}
        <button
          onClick={handleDownloadAll}
          disabled={downloadingAll || images.length === 0}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
        >
          {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{downloadingAll ? downloadProgress : `Download All Media (${images.length})`}</span>
        </button>
      </div>

      {/* 30-Day Retention Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-start space-x-2">
        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong>30-Day Auto-Purge Policy:</strong> All Mess Duty Gallery media items automatically auto-purge 30 days after creation.
        </div>
      </div>

      {/* Cloudinary Notice Banner */}
      {noticeMessage && (
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-medium text-blue-800 dark:text-blue-200 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Upload New Media</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 block">Category</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 block">Caption (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g., Morning vegetable sorting..." 
              value={caption} 
              onChange={e => setCaption(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileChange} 
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center space-y-2">
            <UploadCloud className="w-8 h-8 text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {file ? file.name : 'Click to select Image or Video (Max 25MB)'}
            </span>
          </label>
          
          {uploading && (
            <div className="mt-4 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>

        <button 
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          <span>{uploading ? 'Uploading...' : 'Publish to Gallery'}</span>
        </button>
      </div>

      {/* Published Media Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Published Gallery Media ({images.length})
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Auto-Purges in 30 Days
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {images.map(img => {
            const isVideo = img.url.match(/\.(mp4|webm|ogg)$/i);
            return (
              <div key={img.id} className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 group">
                <div className="aspect-square relative flex items-center justify-center bg-black">
                  {isVideo ? (
                    <video src={img.url} className="w-full h-full object-cover" muted loop playsInline />
                  ) : (
                    <img src={img.url} alt={img.caption || 'Gallery Image'} className="w-full h-full object-cover" />
                  )}
                  {isVideo && <Video className="absolute top-2 right-2 w-4 h-4 text-white drop-shadow-md" />}
                </div>
                
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-blue-600">
                    <span>{img.category}</span>
                    <span className="text-slate-400 font-mono text-[9px]">{new Date(img.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })} IST</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{img.caption || 'No caption'}</p>
                </div>

                <div className="absolute top-2 left-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDelete(img.id)}
                    className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-md"
                    title="Delete Media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-1.5 bg-slate-800/80 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-md"
                    title="Download Media File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
