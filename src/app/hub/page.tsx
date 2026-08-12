'use client';

import React, { useState, useEffect } from 'react';
import { Film, Lightbulb, Users, Phone, Trophy, Send, Loader2, Star, ShieldCheck, AlertTriangle, Download, Video, Image as ImageIcon, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { OtpVerificationModal } from '@/components/otp-modal';

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

function formatMovieDateIST(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatMovieTimeIST(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

const DUMMY_EMERGENCY_CONTACTS = [
  { role: 'Hall President', name: 'Aarav Sharma', phone: '+91 99999 00001' },
  { role: 'Mess Secretary', name: 'Rohan Verma', phone: '+91 99999 00002' },
  { role: 'Maintenance Secy', name: 'Vikram Singh', phone: '+91 99999 00003' },
  { role: 'Warden Office', name: 'Prof. Rajesh Kumar', phone: '+91 99999 00004' },
  { role: 'BC Roy Hospital', name: 'Emergency Control Desk', phone: '03222-200000' },
  { role: 'Main Gate Security', name: 'Security Control Room', phone: '03222-200001' },
];

export default function HubPage() {
  const [activeTab, setActiveTab] = useState('MOVIE');
  const [data, setData] = useState<any>({ movies: [], activities: [], achievements: [], emergencyContacts: [] });
  const [loading, setLoading] = useState(true);

  // Suggestion Form
  const [suggestion, setSuggestion] = useState('');
  const [email, setEmail] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [category, setCategory] = useState('MESS');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('bros_last_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }

    // Try loading from sessionStorage for instant 0ms rendering
    try {
      const cached = sessionStorage.getItem('bros_hub_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.movies)) {
          setData(parsed);
          setLoading(false);
        }
      }
    } catch {}

    // Fetch latest in background (stale-while-revalidate)
    fetch('/api/hub')
      .then((res) => res.json())
      .then((d) => {
        if (d && Array.isArray(d.movies)) {
          setData(d);
          sessionStorage.setItem('bros_hub_cache', JSON.stringify(d));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFormSubmit = () => {
    if (!roomNo || !/^[A-D]-\d{3}$/.test(roomNo)) {
      alert("Please enter a valid Room No. (e.g. A-515)");
      return;
    }
    if (!suggestion.trim() || !email.trim()) {
      alert("Please enter your institute email address and suggestion details.");
      return;
    }
    setIsOtpModalOpen(true);
  };

  const handleExecuteSubmit = async (verifiedEmail: string) => {
    setSubmitting(true);
    setSubmitMessage('');
    try {
      const res = await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SUGGESTION',
          payload: { category, content: suggestion, email: verifiedEmail, studentName: 'Boarder' }
        })
      });

      if (res.ok) {
        setSubmitMessage('Suggestion submitted successfully!');
        setSuggestion('');
      } else {
        const data = await res.json();
        setSubmitMessage(data.error || 'Error submitting suggestion.');
      }
    } catch (err) {
      setSubmitMessage('Network error submitting suggestion.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactsList = (data.emergencyContacts && data.emergencyContacts.length > 0)
    ? data.emergencyContacts
    : DUMMY_EMERGENCY_CONTACTS;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-slate-900 p-3.5 text-white shadow-md shadow-purple-500/10 group">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-700 ease-out pointer-events-none" />
        <div className="absolute right-4 -bottom-6 w-24 h-24 rounded-full bg-purple-400/20 blur-xl group-hover:bg-indigo-400/35 transition-all duration-700 ease-out pointer-events-none" />

        <div className="relative z-10 space-y-0.5">
          <h2 className="text-base sm:text-lg font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
            <Star className="w-4 h-4 text-amber-300 shrink-0" />
            <span>BROS Hall Info & Community</span>
          </h2>
          <p className="text-xs text-purple-100 font-medium leading-snug">
            Just the chill stuff (if the chill goes sideways,there's also emergency contacts). 🍿
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 gap-1 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
        {[
          { id: 'MOVIE', label: 'Movies', icon: Film },
          { id: 'ACTIVITIES', label: 'Activities', icon: Users },
          { id: 'SUGGESTION', label: 'Ideas', icon: Lightbulb },
          { id: 'CONTACTS', label: 'Contacts', icon: Phone },
          { id: 'ACHIEVEMENTS', label: 'Awards', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 ${isActive
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* MOVIES TAB */}
            {activeTab === 'MOVIE' && (
              <div className="space-y-4">
                {data.movies.length > 0 ? (
                  data.movies.map((movie: any) => (
                    <div key={movie.id} className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 space-y-0 shadow-sm">
                      {movie.posterUrl && (
                        <div className="w-full aspect-video relative bg-slate-950 flex items-center justify-center overflow-hidden">
                          {movie.posterUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={movie.posterUrl} className="w-full h-full object-contain" controls preload="metadata" />
                          ) : (
                            <a href={movie.posterUrl} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center p-1">
                              <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                loading="eager"
                                decoding="async"
                                className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                              />
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
                      <div className="p-4 space-y-3">
                        {/* Title & Venue Header */}
                        <div className="flex items-start justify-between">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                            {movie.title}
                          </h3>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 shrink-0 ml-2 border border-purple-200/60 dark:border-purple-800/60">
                            {movie.venue || 'BRH Common Room'}
                          </span>
                        </div>

                        {/* Prominent High-Contrast Date & Time Card */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/70 dark:to-indigo-950/70 border border-purple-200/80 dark:border-purple-800/80 text-purple-900 dark:text-purple-100 shadow-xs">
                          <div className="flex items-center space-x-1.5 font-bold text-xs">
                            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span className="font-black text-slate-900 dark:text-white">
                              {formatMovieDateIST(movie.showTime)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 font-mono font-bold text-xs text-purple-800 dark:text-purple-200">
                            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>{formatMovieTimeIST(movie.showTime)}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 ml-1">
                              IST
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 glass-card rounded-2xl text-slate-500 text-xs font-semibold">
                    No movie screenings scheduled at the moment.
                  </div>
                )}
              </div>
            )}

            {/* ACTIVITIES TAB */}
            {activeTab === 'ACTIVITIES' && (
              <div className="space-y-2.5">
                {data.activities.length > 0 ? (
                  data.activities.map((act: any) => (
                    <div key={act.id} className="p-4 glass-card rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{act.studentName}</h4>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">{act.activity}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{act.hallRoll}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 glass-card rounded-2xl text-slate-500 text-xs font-semibold">
                    No activity participants recorded yet.
                  </div>
                )}
              </div>
            )}

            {/* SUGGESTIONS TAB */}
            {activeTab === 'SUGGESTION' && (
              <div className="glass-card p-5 rounded-2xl space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Boarder Suggestion Portal</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Submit your ideas for hall improvement, events, or mess menus directly to the council. Limited to 1 suggestion per category per day.</p>

                {submitMessage && (
                  <div className={`p-3 rounded-xl text-xs font-medium border ${submitMessage.includes('success') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'}`}>
                    {submitMessage}
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Room No. *  e.g. A-515"
                      value={roomNo}
                      onChange={(e) => setRoomNo(formatRoomNo(e.target.value))}
                      maxLength={5}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all uppercase"
                    />
                    <input
                      type="email"
                      placeholder="Institute Email *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                  </div>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  >
                    <option value="MESS">Mess & Food</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="EVENTS">Events & Culture</option>
                    <option value="SPORTS">Sports & Equipment</option>
                    <option value="OTHER">Other</option>
                  </select>

                  <textarea
                    rows={4}
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="Describe your idea or suggestion in detail..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />

                  <button
                    onClick={handleFormSubmit}
                    disabled={submitting || !suggestion.trim() || !email.trim() || !roomNo}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Submit Suggestion</span>
                  </button>
                </div>
              </div>
            )}

            {/* CONTACTS TAB */}
            {activeTab === 'CONTACTS' && (
              <div className="space-y-2.5">
                {contactsList.map((contact: any, idx: number) => (
                  <div key={contact.id || idx} className="flex items-center justify-between p-4 glass-card rounded-2xl">
                    <div>
                      <div className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">{contact.role}</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{contact.name}</div>
                    </div>
                    <a href={`tel:${contact.phone}`} className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'ACHIEVEMENTS' && (
              <div className="space-y-3">
                {data.achievements.length > 0 ? (
                  data.achievements.map((ach: any) => (
                    <div key={ach.id} className="p-4 glass-card rounded-2xl flex space-x-4">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ach.title}</h4>
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">{ach.studentName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ach.description}</p>
                        <div className="text-[10px] font-bold text-slate-400 mt-2">{new Date(ach.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 glass-card rounded-2xl text-slate-500 text-xs font-semibold">
                    No achievements recorded yet.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Link */}
      <div className="pt-2 flex justify-center">
        <Link href="/hub/admin" className="px-4 py-2 rounded-full border border-purple-200/80 dark:border-purple-800/80 bg-purple-50/80 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Access Hall Info Admin Panel</span>
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
