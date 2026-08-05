'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Loader2, Video, Upload, X, AlertTriangle } from 'lucide-react';
import { Footer } from '@/components/footer';

const CATEGORIES = [
  { id: 'ALL', label: 'All Media' },
  { id: 'GENERAL', label: 'General' },
  { id: 'CLEANING', label: 'Cleaning & Hygiene' },
  { id: 'RAW_MATERIALS', label: 'Raw Materials' },
  { id: 'WEIGHT_CHECK', label: 'Weight Checking' },
  { id: 'PACKAGING', label: 'Packaging' },
];

export default function PublicGalleryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Upload Modal State
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderRollNo, setUploaderRollNo] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [caption, setCaption] = useState('');

  const fetchImages = () => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setImages(data);
        } else {
          console.error('API Error:', data);
          setImages([]);
        }
      })
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5 MB limit.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
      
      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const cloudinaryData = await cloudinaryRes.json();
      
      if (!cloudinaryRes.ok) {
        throw new Error(cloudinaryData.error?.message || 'Failed to upload to Cloudinary');
      }

      // 2. Save to our database
      const dbRes = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cloudinaryData.secure_url,
          caption,
          category,
          uploaderName,
          uploaderRollNo,
        })
      });

      if (!dbRes.ok) {
        const errorData = await dbRes.json();
        throw new Error(errorData.error || 'Failed to save to database');
      }

      setUploadSuccess(true);
      setFile(null);
      setCaption('');
      // Reset form but keep name/rollno for convenience if they upload multiple
      setTimeout(() => {
        setShowUpload(false);
        setUploadSuccess(false);
        // We don't fetchImages() here because it's pending approval anyway!
      }, 3000);
      
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredImages = activeTab === 'ALL' 
    ? images 
    : images.filter(img => img.category === activeTab);

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-800 p-5 text-white shadow-lg">
        <div className="relative z-10 space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-300" />
                <span>Mess Duty Gallery</span>
              </h2>
              <p className="text-xs text-emerald-100 font-medium max-w-xs mt-1">
                Transparent records of cleaning, raw materials, weight checking, and operations.
              </p>
            </div>
            <button 
              onClick={() => setShowUpload(true)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl backdrop-blur-sm transition-all"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeTab === cat.id 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          No media found for this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-1">
          {filteredImages.map(img => {
            const isVideo = img.url.match(/\.(mp4|webm|ogg)$/i);
            return (
              <div key={img.id} className="relative rounded-xl overflow-hidden bg-black shadow-sm group">
                <div className="aspect-square relative">
                  {isVideo ? (
                    <video 
                      src={img.url} 
                      className="w-full h-full object-cover" 
                      controls 
                      preload="metadata" 
                    />
                  ) : (
                    <a href={img.url} target="_blank" rel="noreferrer">
                      <img src={img.url} alt={img.caption || 'Gallery Image'} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </a>
                  )}
                  {isVideo && !img.url.includes('controls') && (
                    <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-md pointer-events-none">
                      <Video className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6">
                  {img.caption && (
                    <p className="text-[10px] text-white font-medium line-clamp-2 drop-shadow-md leading-tight mb-1">
                      {img.caption}
                    </p>
                  )}
                  {img.uploaderName && (
                    <p className="text-[9px] text-gray-300 flex justify-between items-center opacity-80">
                      <span>{img.uploaderName}</span>
                      <span className="font-mono">{img.uploaderRollNo}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Footer />

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Upload Media</span>
              </h3>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto scrollbar-none">
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                <div className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                  <strong>Notice:</strong> This gallery is for Mess Duty records. If you want to submit a complaint regarding the mess, please use the Feedback portal instead.
                </div>
              </div>

              {uploadSuccess ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Upload Submitted!</h4>
                  <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Your media is pending approval from the Mess Admin and will appear here shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input type="text" required value={uploaderName} onChange={e => setUploaderName(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Aarav Sharma" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Roll No</label>
                    <input type="text" required value={uploaderRollNo} onChange={e => setUploaderRollNo(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="21XX12345" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                      {CATEGORIES.filter(c => c.id !== 'ALL').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">File (Max 5MB)</label>
                    <input type="file" required accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Caption (Optional)</label>
                    <input type="text" value={caption} onChange={e => setCaption(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Short description..." />
                  </div>

                  {uploadError && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800">
                      {uploadError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button type="submit" disabled={uploading || !file} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center space-x-2">
                      {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{uploading ? 'Uploading...' : 'Submit to Gallery'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
