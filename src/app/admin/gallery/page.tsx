'use client';

import React, { useState, useEffect } from 'react';
import { Camera, UploadCloud, Loader2, Trash2, Video, ImageIcon, Settings } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';

const CATEGORIES = [
  { id: 'GENERAL', label: 'General' },
  { id: 'CLEANING', label: 'Cleaning & Hygiene' },
  { id: 'RAW_MATERIALS', label: 'Raw Materials' },
  { id: 'WEIGHT_CHECK', label: 'Weight Checking' },
  { id: 'PACKAGING', label: 'Packaging' },
];

import { AdminAuthGate } from '@/components/admin-auth-gate';

export default function AdminGalleryPage() {
  return (
    <AdminAuthGate title="Gallery Admin Portal">
      <AdminGalleryContent />
    </AdminAuthGate>
  );
}

function AdminGalleryContent() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('GENERAL');
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = () => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => setImages(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // Limit to 25MB as requested
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

    try {
      // 1. Upload to Cloudinary directly
      const url = await uploadToCloudinary(file, (pct) => setProgress(pct));

      // 2. Save URL to Database
      await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, caption, category })
      });

      // Reset
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
    await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' });
    loadImages();
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 flex flex-col">
      <div>
        <h1 className="text-2xl font-black flex items-center space-x-2 text-gray-900 dark:text-white mb-2">
          <Camera className="w-6 h-6 text-blue-600" />
          <span>Mess Duty Gallery Admin</span>
        </h1>
        <p className="text-sm text-gray-500">Upload photos and videos of mess operations for transparency.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Upload New Media</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 block">Category</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 block">Caption (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g., Morning vegetable sorting..." 
              value={caption} 
              onChange={e => setCaption(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          <span>{uploading ? 'Uploading...' : 'Publish to Gallery'}</span>
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Published Media</h2>
        <div className="grid grid-cols-2 gap-4">
          {images.map(img => {
            const isVideo = img.url.match(/\.(mp4|webm|ogg)$/i);
            return (
              <div key={img.id} className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 group">
                <div className="aspect-square relative flex items-center justify-center bg-black">
                  {isVideo ? (
                    <video src={img.url} className="w-full h-full object-cover" muted loop playsInline />
                  ) : (
                    <img src={img.url} alt={img.caption || 'Gallery Image'} className="w-full h-full object-cover" />
                  )}
                  {isVideo && <Video className="absolute top-2 right-2 w-4 h-4 text-white drop-shadow-md" />}
                </div>
                
                <div className="p-3">
                  <div className="text-[10px] font-bold text-blue-600 mb-1">{img.category}</div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{img.caption || 'No caption'}</p>
                </div>

                <button 
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 left-2 p-1.5 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
