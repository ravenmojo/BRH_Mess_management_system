'use client';

import React, { useState, useEffect } from 'react';
import { Film, Lightbulb, Users, Phone, Trophy, Send, Loader2, Star, Plus } from 'lucide-react';
import { Footer } from '@/components/footer';
import { createClient } from '@/utils/supabase/client';

const EMERGENCY_CONTACTS = [
  { role: 'Hall President', name: 'Rahul Sharma', phone: '+91 9876543210' },
  { role: 'Mess Secretary', name: 'Amit Kumar', phone: '+91 8765432109' },
  { role: 'Maintenance Secy', name: 'Sanjay Singh', phone: '+91 7654321098' },
  { role: 'Warden', name: 'Prof. A. K. Das', phone: '+91 6543210987' },
  { role: 'Ambulance', name: 'BC Roy Hospital', phone: '03222-282222' },
  { role: 'Security', name: 'Main Gate', phone: '03222-281001' },
];

export default function HubPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('MOVIE');
  const [data, setData] = useState<any>({ movies: [], activities: [], achievements: [] });
  const [loading, setLoading] = useState(true);

  // Suggestion Form
  const [suggestion, setSuggestion] = useState('');
  const [category, setCategory] = useState('MESS');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/hub')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleSuggestionSubmit = async () => {
    if (!suggestion) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("You must be logged in to submit a suggestion.");
        setSubmitting(false);
        return;
      }

      await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SUGGESTION',
          payload: { category, content: suggestion, studentName: 'Anonymous Student' }
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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-800 p-5 text-white shadow-lg">
        <div className="relative z-10 space-y-1">
          <h2 className="text-xl font-black tracking-tight drop-shadow-sm flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-purple-300" />
            <span>Hall Info Hub</span>
          </h2>
          <p className="text-xs text-purple-100 font-medium max-w-sm">
            Whatever you all need, bros...
          </p>
          <p className="text-[10px] text-purple-100 max-w-sm">
            (not really, we cannot give you the stuff you really need 😉)
          </p>

        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 px-1">
        {[
          { id: 'MOVIE', icon: Film, label: 'Movies' },
          { id: 'SUGGESTION', icon: Lightbulb, label: 'Suggestions' },
          { id: 'CONTACTS', icon: Phone, label: 'Emergency' },
          { id: 'ACHIEVEMENTS', icon: Star, label: 'Achievements' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === tab.id
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
              }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
        ) : (
          <>
            {/* MOVIES TAB */}
            {activeTab === 'MOVIE' && (
              <div className="space-y-4">
                {data.movies.length > 0 ? (
                  data.movies.map((movie: any) => (
                    <div key={movie.id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                      {movie.posterUrl && (
                        <div className="w-full aspect-[2/3] bg-gray-100 relative">
                          <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">{movie.title}</h3>
                        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                          <span>{new Date(movie.showTime).toLocaleString()}</span>
                          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">{movie.venue}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 text-gray-500 text-sm">
                    No movie scheduled for this weekend yet.
                  </div>
                )}
              </div>
            )}

            {/* SUGGESTIONS TAB */}
            {activeTab === 'SUGGESTION' && (
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Boarder Suggestion Portal</h3>
                <p className="text-xs text-gray-500">Submit your ideas for hall improvement, events, or mess menus directly to the council.</p>

                <div className="space-y-3 pt-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />

                  <button
                    onClick={handleSuggestionSubmit}
                    disabled={submitting || !suggestion.trim()}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Submit Suggestion</span>
                  </button>
                </div>
              </div>
            )}

            {/* CONTACTS TAB */}
            {activeTab === 'CONTACTS' && (
              <div className="space-y-3">
                {EMERGENCY_CONTACTS.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div>
                      <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{contact.role}</div>
                      <div className="font-bold text-gray-900 dark:text-white">{contact.name}</div>
                    </div>
                    <a href={`tel:${contact.phone}`} className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'ACHIEVEMENTS' && (
              <div className="space-y-4">
                {data.achievements.length > 0 ? (
                  data.achievements.map((ach: any) => (
                    <div key={ach.id} className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex space-x-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{ach.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{ach.description}</p>
                        <div className="text-[10px] font-bold text-gray-400 mt-2">{new Date(ach.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 text-gray-500 text-sm">
                    No achievements recorded yet.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
