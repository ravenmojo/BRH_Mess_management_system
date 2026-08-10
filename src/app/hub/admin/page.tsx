'use client';

import React, { useState, useEffect } from 'react';
import { Film, Trophy, Users, Phone, ShieldCheck, Plus, Trash2, Sparkles, Loader2, ArrowLeft, CheckCircle2, UploadCloud, Upload, Image as ImageIcon, Video } from 'lucide-react';
import Link from 'next/link';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { AdminAuthGate } from '@/components/admin-auth-gate';

export default function HubAdminPage() {
  return (
    <AdminAuthGate title="Hall Info Admin Portal">
      <HubAdminContent />
    </AdminAuthGate>
  );
}

function HubAdminContent() {
  const [activeTab, setActiveTab] = useState<'MOVIES' | 'ACTIVITIES' | 'ACHIEVEMENTS' | 'CONTACTS'>('MOVIES');
  const [data, setData] = useState<any>({ movies: [], activities: [], achievements: [], emergencyContacts: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form States
  // 1. Movie Form
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
    loadData();
  }, []);

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

  // Submit Handlers
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
              <span>Hall Info Portal Admin</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage all sub-sections of the BROS Info Hub.</p>
          </div>
        </div>

        {/* Quick Seed Button */}
        <button
          onClick={handleSeedAll}
          disabled={submitting}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shrink-0"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Populate All Sub-sections</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
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
          <span>Achievements</span>
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
              <form onSubmit={handleAddMovie} className="p-5 rounded-2xl glass-card space-y-3.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  <span>Add Movie Screening</span>
                </h3>
                <div className="space-y-2">
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
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <input
                      type="url"
                      placeholder="Poster Image URL (Optional)"
                      value={moviePosterUrl}
                      onChange={(e) => setMoviePosterUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  {/* Direct Poster File Upload */}
                  <div className="border border-dashed border-purple-300 dark:border-purple-800/70 rounded-xl p-3 bg-purple-50/40 dark:bg-purple-950/20 text-center">
                    <input
                      type="file"
                      id="poster-file-input"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPosterFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="poster-file-input" className="cursor-pointer flex items-center justify-center space-x-2 text-xs text-purple-700 dark:text-purple-300 font-bold">
                      <UploadCloud className="w-4 h-4 text-purple-600" />
                      <span>{posterFile ? `Selected Poster: ${posterFile.name}` : 'Click to Upload Movie Poster / Video File'}</span>
                    </label>
                    {uploadingPoster && (
                      <div className="mt-2 w-full h-1.5 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${posterProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !movieTitle.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                  <span>{submitting ? 'Publishing Movie...' : 'Publish Movie Screening'}</span>
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 px-1">Screenings ({data.movies.length})</h4>
                {data.movies.map((movie: any) => (
                  <div key={movie.id} className="p-4 rounded-2xl glass-card flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{movie.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {movie.venue} • {new Date(movie.showTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete('MOVIE', movie.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Delete Screening"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                    <button
                      onClick={() => handleDelete('ACTIVITY', act.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Delete Activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                    <button
                      onClick={() => handleDelete('ACHIEVEMENT', ach.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Delete Achievement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                    <button
                      onClick={() => handleDelete('EMERGENCY_CONTACT', contact.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
