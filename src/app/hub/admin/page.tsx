'use client';

import React, { useState, useEffect } from 'react';
import { Film, Trophy, Users, Phone, ShieldCheck, Plus, Trash2, Sparkles, Loader2, ArrowLeft, CheckCircle2, UploadCloud, Upload, Image as ImageIcon, Video, Download, Pencil, Clipboard, X, Save } from 'lucide-react';
import Link from 'next/link';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { AdminAuthGate, useAdminAuth } from '@/components/admin-auth-gate';

export default function HubAdminPage() {
  return (
    <AdminAuthGate title="Hall Info Admin Portal">
      <HubAdminContent />
    </AdminAuthGate>
  );
}

interface PosterUploadZoneProps {
  posterFile: File | null;
  setPosterFile: (file: File | null) => void;
  posterUrl: string;
  setPosterUrl: (url: string) => void;
  uploading: boolean;
  progress: number;
}

function PosterUploadZone({
  posterFile,
  setPosterFile,
  posterUrl,
  setPosterUrl,
  uploading,
  progress,
}: PosterUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (posterFile) {
      const url = URL.createObjectURL(posterFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (posterUrl) {
      setPreviewUrl(posterUrl);
    } else {
      setPreviewUrl('');
    }
  }, [posterFile, posterUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPosterFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPosterFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasteEvent = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/') || items[i].type.startsWith('video/')) {
        const blob = items[i].getAsFile();
        if (blob) {
          const ext = blob.type.split('/')[1] || 'png';
          const file = new File([blob], `pasted_poster_${Date.now()}.${ext}`, { type: blob.type });
          setPosterFile(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const triggerClipboardRead = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const ext = imageType.split('/')[1] || 'png';
            const file = new File([blob], `pasted_poster_${Date.now()}.${ext}`, { type: imageType });
            setPosterFile(file);
            return;
          }
        }
      }

      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith('http') || text.startsWith('data:image'))) {
          setPosterUrl(text.trim());
          setPosterFile(null);
          return;
        }
      }

      alert('No image found in clipboard. Copy an image or screenshot to your clipboard and press "Paste Image from Clipboard" or Ctrl+V!');
    } catch (err) {
      alert('Clipboard permission denied. Press Ctrl+V or Cmd+V directly over this box to paste your image!');
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePasteEvent}
      tabIndex={0}
      className={`relative border-2 border-dashed rounded-3xl p-5 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
        isDragging
          ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
          : 'border-purple-300 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/20 hover:border-purple-400 dark:hover:border-purple-700'
      }`}
    >
      <input
        type="file"
        id="poster-zone-file-input"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative w-full max-w-xs mx-auto aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-purple-300 dark:border-purple-800 shadow-md group">
            {posterFile?.type.startsWith('video/') || previewUrl.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={previewUrl} className="w-full h-full object-contain" controls />
            ) : (
              <img src={previewUrl} alt="Poster preview" className="w-full h-full object-contain" />
            )}
            <button
              type="button"
              onClick={() => {
                setPosterFile(null);
                setPosterUrl('');
              }}
              className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              title="Remove poster"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{posterFile ? `Attached: ${posterFile.name}` : 'Poster URL attached'}</span>
          </p>
        </div>
      ) : (
        <div className="space-y-3 py-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
              Drop your poster image here or browse
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Supports PNG, JPG, WebP, GIF, MP4 • Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold">Ctrl+V</kbd> to paste image from clipboard
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <label
              htmlFor="poster-zone-file-input"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-md shadow-purple-600/25 flex items-center space-x-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Select Image</span>
            </label>

            <button
              type="button"
              onClick={triggerClipboardRead}
              className="px-4 py-2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-extrabold hover:bg-purple-200 dark:hover:bg-purple-900 transition-all flex items-center space-x-1.5"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste Image from Clipboard</span>
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="mt-3 w-full h-1.5 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
          <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
}

function HubAdminContent() {
  const { isAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'MOVIES' | 'ACTIVITIES' | 'ACHIEVEMENTS' | 'CONTACTS'>('MOVIES');
  const [data, setData] = useState<any>({ movies: [], activities: [], achievements: [], emergencyContacts: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form States - Add New Movie
  const [movieTitle, setMovieTitle] = useState('');
  const [moviePosterUrl, setMoviePosterUrl] = useState('');
  const [movieShowTime, setMovieShowTime] = useState('');
  const [movieVenue, setMovieVenue] = useState('BRH Common Room');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterProgress, setPosterProgress] = useState(0);

  // 2. Activity Form
  const [activityStudentName, setActivityStudentName] = useState('');
  const [activityRollNo, setActivityRollNo] = useState('');
  const [activityName, setActivityName] = useState('');

  // 3. Achievement Form
  const [achievementTitle, setAchievementTitle] = useState('');
  const [achievementStudentName, setAchievementStudentName] = useState('');
  const [achievementRollNo, setAchievementRollNo] = useState('');
  const [achievementCategory, setAchievementCategory] = useState('SPORTS_TECH');
  const [achievementDescription, setAchievementDescription] = useState('');

  // 4. Emergency Contact Form
  const [contactRole, setContactRole] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Universal Edit State across all sections
  const [editingItem, setEditingItem] = useState<{
    type: 'MOVIE' | 'ACTIVITY' | 'ACHIEVEMENT' | 'EMERGENCY_CONTACT';
    id: string;
    payload: any;
  } | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editUploadingPoster, setEditUploadingPoster] = useState(false);
  const [editPosterProgress, setEditPosterProgress] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch('/api/hub');
      const d = await res.json();
      setData({
        movies: d.movies || [],
        activities: d.activities || [],
        achievements: d.achievements || [],
        emergencyContacts: d.emergencyContacts || [],
      });
    } catch (err) {
      console.error('Failed to load hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleSeedAll = async () => {
    if (!confirm('Are you sure you want to populate all sub-sections with clean dummy data? This will seed sample movies, activities, achievements, and emergency contacts.')) return;

    setSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SEED_ALL' }),
      });
      const resData = await res.json();
      if (res.ok) {
        setStatusMessage(resData.message || 'Populated all sub-sections successfully!');
        loadData();
      } else {
        alert(resData.error || 'Failed to populate data.');
      }
    } catch (err) {
      alert('Network error while populating dummy data.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await fetch(`/api/hub?type=${type}&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  // Open Edit Modals for each section
  const openEditMovie = (movie: any) => {
    setEditFile(null);
    setEditingItem({
      type: 'MOVIE',
      id: movie.id,
      payload: {
        title: movie.title || '',
        posterUrl: movie.posterUrl || '',
        showTime: movie.showTime ? new Date(movie.showTime).toISOString().slice(0, 16) : '',
        venue: movie.venue || 'BRH Common Room',
      },
    });
  };

  const openEditActivity = (act: any) => {
    setEditingItem({
      type: 'ACTIVITY',
      id: act.id,
      payload: {
        studentName: act.studentName || '',
        hallRoll: act.hallRoll || '',
        activity: act.activity || '',
      },
    });
  };

  const openEditAchievement = (ach: any) => {
    setEditingItem({
      type: 'ACHIEVEMENT',
      id: ach.id,
      payload: {
        title: ach.title || '',
        studentName: ach.studentName || '',
        hallRoll: ach.hallRoll || '',
        category: ach.category || 'SPORTS_TECH',
        description: ach.description || '',
      },
    });
  };

  const openEditContact = (contact: any) => {
    setEditingItem({
      type: 'EMERGENCY_CONTACT',
      id: contact.id,
      payload: {
        role: contact.role || '',
        name: contact.name || '',
        phone: contact.phone || '',
        order: contact.order || 0,
      },
    });
  };

  // Submit Handlers - Add New
  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle) return;
    setSubmitting(true);
    let finalPosterUrl = moviePosterUrl;

    try {
      if (posterFile) {
        setUploadingPoster(true);
        setPosterProgress(0);
        try {
          finalPosterUrl = await uploadToCloudinary(posterFile, (pct) => setPosterProgress(pct));
        } catch (err: any) {
          alert('Movie poster upload failed: ' + (err.message || 'Error uploading poster file'));
          setSubmitting(false);
          setUploadingPoster(false);
          return;
        } finally {
          setUploadingPoster(false);
        }
      }

      await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MOVIE',
          payload: {
            title: movieTitle,
            posterUrl: finalPosterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
            showTime: movieShowTime || new Date().toISOString(),
            venue: movieVenue,
          },
        }),
      });
      setMovieTitle('');
      setMoviePosterUrl('');
      setMovieShowTime('');
      setPosterFile(null);
      setPosterProgress(0);
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityStudentName || !activityName) return;
    setSubmitting(true);
    try {
      await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ACTIVITY',
          payload: {
            studentName: activityStudentName,
            hallRoll: activityRollNo || '21CS10001',
            activity: activityName,
          },
        }),
      });
      setActivityStudentName('');
      setActivityRollNo('');
      setActivityName('');
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementTitle || !achievementStudentName || !achievementDescription) return;
    setSubmitting(true);
    try {
      await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ACHIEVEMENT',
          payload: {
            title: achievementTitle,
            studentName: achievementStudentName,
            hallRoll: achievementRollNo,
            category: achievementCategory,
            description: achievementDescription,
          },
        }),
      });
      setAchievementTitle('');
      setAchievementStudentName('');
      setAchievementRollNo('');
      setAchievementDescription('');
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactRole || !contactName || !contactPhone) return;
    setSubmitting(true);
    try {
      await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EMERGENCY_CONTACT',
          payload: {
            role: contactRole,
            name: contactName,
            phone: contactPhone,
          },
        }),
      });
      setContactRole('');
      setContactName('');
      setContactPhone('');
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  // Save Edit Handler via PATCH /api/hub
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);

    let finalPosterUrl = editingItem.payload.posterUrl;

    try {
      if (editingItem.type === 'MOVIE' && editFile) {
        setEditUploadingPoster(true);
        setEditPosterProgress(0);
        try {
          finalPosterUrl = await uploadToCloudinary(editFile, (pct) => setEditPosterProgress(pct));
        } catch (err: any) {
          alert('Upload failed: ' + (err.message || 'Error uploading file'));
          setSavingEdit(false);
          setEditUploadingPoster(false);
          return;
        } finally {
          setEditUploadingPoster(false);
        }
      }

      const payloadToSend = {
        ...editingItem.payload,
        ...(editingItem.type === 'MOVIE' ? { posterUrl: finalPosterUrl } : {}),
      };

      const res = await fetch('/api/hub', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editingItem.type,
          id: editingItem.id,
          payload: payloadToSend,
        }),
      });

      if (res.ok) {
        setStatusMessage(`Updated ${editingItem.type.toLowerCase()} record successfully!`);
        setEditingItem(null);
        setEditFile(null);
        loadData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update record.');
      }
    } catch (err) {
      alert('Network error while saving changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Link href="/hub" className="p-2 rounded-xl glass-card text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Hall Info Admin Portal</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Manage and edit movies, activities, achievements & emergency contacts.
            </p>
          </div>
        </div>

        <button
          onClick={handleSeedAll}
          disabled={submitting}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Populate Clean Sample Data</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('MOVIES')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'MOVIES' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Movies</span>
        </button>
        <button
          onClick={() => setActiveTab('ACTIVITIES')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'ACTIVITIES' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Activities</span>
        </button>
        <button
          onClick={() => setActiveTab('ACHIEVEMENTS')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'ACHIEVEMENTS' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Awards</span>
        </button>
        <button
          onClick={() => setActiveTab('CONTACTS')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'CONTACTS' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Emergency</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: MOVIES */}
          {activeTab === 'MOVIES' && (
            <div className="space-y-6">
              <form onSubmit={handleAddMovie} className="p-5 rounded-2xl glass-card space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  <span>Add Movie Screening</span>
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Movie Title *"
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Venue (e.g. BRH Common Room)"
                    value={movieVenue}
                    onChange={(e) => setMovieVenue(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="datetime-local"
                    value={movieShowTime}
                    onChange={(e) => setMovieShowTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 col-span-2 sm:col-span-1"
                  />
                </div>

                {/* Drop Zone & Direct Clipboard Image Paste Container */}
                <PosterUploadZone
                  posterFile={posterFile}
                  setPosterFile={setPosterFile}
                  posterUrl={moviePosterUrl}
                  setPosterUrl={setMoviePosterUrl}
                  uploading={uploadingPoster}
                  progress={posterProgress}
                />

                <button
                  type="submit"
                  disabled={submitting || !movieTitle.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md shadow-purple-600/30"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                  <span>{submitting ? 'Publishing Movie...' : 'Publish Movie Screening'}</span>
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 px-1">Screenings ({data.movies.length})</h4>
                {data.movies.map((movie: any) => (
                  <div key={movie.id} className="rounded-2xl glass-card overflow-hidden border border-slate-200 dark:border-slate-800 space-y-0 shadow-sm">
                    {movie.posterUrl && (
                      <div className="w-full aspect-video relative bg-slate-950 flex items-center justify-center overflow-hidden">
                        {movie.posterUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video src={movie.posterUrl} className="w-full h-full object-contain" controls preload="metadata" />
                        ) : (
                          <a href={movie.posterUrl} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center p-1">
                            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-contain" />
                          </a>
                        )}
                        <a
                          href={movie.posterUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors shadow-md backdrop-blur-sm z-10"
                          title="Download Movie Poster"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{movie.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          {movie.venue} • {new Date(movie.showTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST
                        </p>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => openEditMovie(movie)}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors font-bold text-xs flex items-center space-x-1"
                          title="Edit Details / Replace Poster"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit Poster</span>
                        </button>
                        <button
                          onClick={() => handleDelete('MOVIE', movie.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                          title="Delete Screening"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVITIES */}
          {activeTab === 'ACTIVITIES' && (
            <div className="space-y-6">
              <form onSubmit={handleAddActivity} className="p-5 rounded-2xl glass-card space-y-3.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  <span>Add Hall Activity Participant</span>
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Student Name *"
                    value={activityStudentName}
                    onChange={(e) => setActivityStudentName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Roll Number"
                    value={activityRollNo}
                    onChange={(e) => setActivityRollNo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Activity Title (e.g. Inter-Hall Music Jam Vocalist) *"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button
                  type="submit"
                  disabled={submitting || !activityStudentName.trim() || !activityName.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Add Activity Participant
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 px-1">Participants ({data.activities.length})</h4>
                {data.activities.map((act: any) => (
                  <div key={act.id} className="p-4 rounded-2xl glass-card flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{act.studentName} ({act.hallRoll})</h4>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-0.5">{act.activity}</p>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => openEditActivity(act)}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors font-bold text-xs flex items-center space-x-1"
                        title="Edit Activity Info"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('ACTIVITY', act.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Delete Activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ACHIEVEMENTS */}
          {activeTab === 'ACHIEVEMENTS' && (
            <div className="space-y-6">
              <form onSubmit={handleAddAchievement} className="p-5 rounded-2xl glass-card space-y-3.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  <span>Add Hall Achievement</span>
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Achievement Title *"
                    value={achievementTitle}
                    onChange={(e) => setAchievementTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <select
                    value={achievementCategory}
                    onChange={(e) => setAchievementCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="SPORTS_TECH">Sports / Tech</option>
                    <option value="CULTURAL">Cultural & Arts</option>
                    <option value="ACADEMICS">Academics & Research</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Student / Team Name *"
                    value={achievementStudentName}
                    onChange={(e) => setAchievementStudentName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Roll No. / Team Code"
                    value={achievementRollNo}
                    onChange={(e) => setAchievementRollNo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <textarea
                  placeholder="Achievement Description *"
                  value={achievementDescription}
                  onChange={(e) => setAchievementDescription(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button
                  type="submit"
                  disabled={submitting || !achievementTitle.trim() || !achievementStudentName.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Add Achievement
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 px-1">Achievements ({data.achievements.length})</h4>
                {data.achievements.map((ach: any) => (
                  <div key={ach.id} className="p-4 rounded-2xl glass-card flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ach.title}</h4>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{ach.studentName} ({ach.category})</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ach.description}</p>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => openEditAchievement(ach)}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors font-bold text-xs flex items-center space-x-1"
                        title="Edit Achievement Info"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('ACHIEVEMENT', ach.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Delete Achievement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EMERGENCY CONTACTS */}
          {activeTab === 'CONTACTS' && (
            <div className="space-y-6">
              <form onSubmit={handleAddContact} className="p-5 rounded-2xl glass-card space-y-3.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  <span>Add Emergency / Council Contact</span>
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="Role (e.g. Hall President) *"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Name *"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Phone (e.g. +91 99999 00001) *"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !contactRole.trim() || !contactName.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Add Emergency Contact
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 px-1">Emergency Contacts ({data.emergencyContacts.length})</h4>
                {data.emergencyContacts.map((contact: any) => (
                  <div key={contact.id} className="p-4 rounded-2xl glass-card flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">{contact.role}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{contact.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{contact.phone}</p>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => openEditContact(contact)}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors font-bold text-xs flex items-center space-x-1"
                        title="Edit Contact Details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('EMERGENCY_CONTACT', contact.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* UNIVERSAL EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-purple-400" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  Edit {editingItem.type === 'MOVIE' ? 'Movie Screening & Poster' : editingItem.type === 'ACTIVITY' ? 'Activity Participant' : editingItem.type === 'ACHIEVEMENT' ? 'Hall Achievement' : 'Emergency Contact'}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* EDIT MOVIE FIELDS */}
              {editingItem.type === 'MOVIE' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Movie Title *</label>
                    <input
                      type="text"
                      value={editingItem.payload.title}
                      onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, title: e.target.value } })}
                      required
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Venue</label>
                      <input
                        type="text"
                        value={editingItem.payload.venue}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, venue: e.target.value } })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Show Date & Time</label>
                      <input
                        type="datetime-local"
                        value={editingItem.payload.showTime}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, showTime: e.target.value } })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Replace Poster Image / Video</label>
                    <PosterUploadZone
                      posterFile={editFile}
                      setPosterFile={setEditFile}
                      posterUrl={editingItem.payload.posterUrl}
                      setPosterUrl={(url) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, posterUrl: url } })}
                      uploading={editUploadingPoster}
                      progress={editPosterProgress}
                    />
                  </div>
                </div>
              )}

              {/* EDIT ACTIVITY FIELDS */}
              {editingItem.type === 'ACTIVITY' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Student Name *</label>
                      <input
                        type="text"
                        value={editingItem.payload.studentName}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, studentName: e.target.value } })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={editingItem.payload.hallRoll}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, hallRoll: e.target.value } })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Activity Title *</label>
                    <input
                      type="text"
                      value={editingItem.payload.activity}
                      onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, activity: e.target.value } })}
                      required
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* EDIT ACHIEVEMENT FIELDS */}
              {editingItem.type === 'ACHIEVEMENT' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Title *</label>
                      <input
                        type="text"
                        value={editingItem.payload.title}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, title: e.target.value } })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Category</label>
                      <select
                        value={editingItem.payload.category}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, category: e.target.value } })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="SPORTS_TECH">Sports / Tech</option>
                        <option value="CULTURAL">Cultural & Arts</option>
                        <option value="ACADEMICS">Academics & Research</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Student / Team Name *</label>
                      <input
                        type="text"
                        value={editingItem.payload.studentName}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, studentName: e.target.value } })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Roll / Team Code</label>
                      <input
                        type="text"
                        value={editingItem.payload.hallRoll}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, hallRoll: e.target.value } })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Description *</label>
                    <textarea
                      value={editingItem.payload.description}
                      onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, description: e.target.value } })}
                      rows={2}
                      required
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* EDIT EMERGENCY CONTACT FIELDS */}
              {editingItem.type === 'EMERGENCY_CONTACT' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Role *</label>
                      <input
                        type="text"
                        value={editingItem.payload.role}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, role: e.target.value } })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Name *</label>
                      <input
                        type="text"
                        value={editingItem.payload.name}
                        onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, name: e.target.value } })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Phone *</label>
                    <input
                      type="text"
                      value={editingItem.payload.phone}
                      onChange={(e) => setEditingItem({ ...editingItem, payload: { ...editingItem.payload, phone: e.target.value } })}
                      required
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-md shadow-purple-600/30"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
