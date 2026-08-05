'use client';

import React, { useState, useEffect } from 'react';
import { Film, Lightbulb, Users, Phone, Trophy, Send, Loader2, Star, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { OtpVerificationModal } from '@/components/otp-modal';

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
  const [category, setCategory] = useState('MESS');
  const [submitting, setSubmitting] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('bros_last_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }

    fetch('/api/hub')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleFormSubmit = () => {
    if (!suggestion.trim() || !email.trim()) {
      alert("Please enter your institute email address and suggestion details.");
      return;
    }
    setIsOtpModalOpen(true);
  };

  const handleExecuteSubmit = async (verifiedEmail: string) => {
    setSubmitting(true);
    try {
      await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SUGGESTION',
          payload: { category, content: suggestion, email: verifiedEmail, studentName: 'Boarder' }
        })
      });
      alert('Suggestion submitted successfully!');
      setSuggestion('');
    } catch (err) {
      alert('Error submitting suggestion');
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-slate-900 p-6 text-white shadow-xl shadow-purple-500/10">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold border border-white/15">
            <Star className="w-3.5 h-3.5 text-amber-300" />
            <span>BRH Information Hub</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Hall Info & Community</h1>
          <p className="text-xs text-purple-100/80 max-w-sm font-medium">
            Stay updated with movie screenings, hall activities, council contacts, and hall achievements.
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
              <div className="space-y-3">
                {data.movies.length > 0 ? (
                  data.movies.map((movie: any) => (
                    <div key={movie.id} className="p-4 glass-card rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {movie.venue}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(movie.showTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{movie.title}</h3>
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Submit your ideas for hall improvement, events, or mess menus directly to the council.</p>

                <div className="space-y-3 pt-2">
                  <input
                    type="email"
                    placeholder="Institute Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />

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
                    disabled={submitting || !suggestion.trim() || !email.trim()}
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
