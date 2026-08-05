'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Settings, Plus, Lock, Unlock, Trash2 } from 'lucide-react';

const SEASONAL_CURRIES = [
  "Alu Bhindi", "Palak Paneer", "Lauki Curry",
  "Alu Gobi", "Alu Tomato Fry", "Alu Palak",
  "Green Peas-Alu-Cabbage", "Alu Patal", "Karela-Alu Fry",
  "Palak Matar", "Begun/Brinjal Bharta", "Turnip-Alu-Papaya Curry",
  "Barbati Fry/Sabji", "Begun Masala/Bangachi Bhaji", "Sliced Kumro (Pumpkin) Fry",
  "Alu Mushroom Curry", "Jhinga Posto", "Baby Corn Masala (1/2 plate)",
  "Sukto with Bori", "Alu Bean/Sheem Fry", "Echod (Jackfruit) Curry",
  "Vegetable Kofta", "Mixed Vegetable", "Drumstick-Aloo-Begun Curry",
  "Mocha (Banana Flower) Curry", "Okra/Bhindi Masala", "Alu-Begun Fry",
  "Veg/Gobi Manchurian", "Gawar Bhaji/Sabji", "Raw Banana Kofta",
  "Capsicum Chili Nutriella", "Broccoli Mix-Veg Fry", "Green Peas Fry",
  "Kundri-Alu Curry", "Palak, Gazzar, Alu, Bean Mix Veg", "Veg Do Pyaja",
  "Alu-Papaya Curry", "Sprouts Curry", "Cauliflower Fry",
  "Spring Onion Alu Tomato", "Lauki Kofta", "Red Pumpkin Channa Curry",
  "Sorso (Mustard) Sag", "Patal / Chichinga / Karela Fry", "Palak Tomato",
  "Chickpeas Curry", "Alu Cabbage", "Cauliflower Cur"
];

import { AdminAuthGate } from '@/components/admin-auth-gate';

export default function AdminPollPage() {
  return (
    <AdminAuthGate title="Poll Admin Portal">
      <AdminPollContent />
    </AdminAuthGate>
  );
}

function AdminPollContent() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New poll state
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedCurries, setSelectedCurries] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = () => {
    fetch('/api/poll?active=false') // fetch all
      .then(res => res.json())
      .then(data => setPolls(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleTogglePoll = async (id: string, currentStatus: boolean) => {
    await fetch('/api/poll', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !currentStatus })
    });
    loadPolls();
  };

  const handleCreatePoll = async () => {
    if (selectedCurries.length === 0) return;
    setCreating(true);
    await fetch('/api/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month,
        year,
        options: selectedCurries
      })
    });
    setCreating(false);
    setSelectedCurries([]);
    loadPolls();
  };

  const toggleCurry = (curry: string) => {
    if (selectedCurries.includes(curry)) {
      setSelectedCurries(selectedCurries.filter(c => c !== curry));
    } else {
      setSelectedCurries([...selectedCurries, curry]);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black flex items-center space-x-2 text-gray-900 dark:text-white mb-2">
          <span className="text-2xl">📊</span>
          <span>Mess Poll Admin</span>
        </h1>
        <p className="text-sm text-gray-500">Manage monthly seasonal veg curry polls. The system automatically locks voting after the 15th on the public side, but you can manually override it here.</p>
      </div>

      <div className="flex flex-col space-y-8">
        {/* Create New Poll */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Create New Poll</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Month (1-12)</label>
              <input type="number" min={1} max={12} value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Year</label>
              <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 block">Select Curries for Voting ({selectedCurries.length} selected)</label>
            </div>
            <div className="h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1 bg-gray-50 dark:bg-gray-800/50">
              {SEASONAL_CURRIES.map(curry => (
                <label key={curry} className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedCurries.includes(curry)}
                    onChange={() => toggleCurry(curry)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{curry}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={handleCreatePoll}
            disabled={creating || selectedCurries.length === 0}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Create Poll (Overrides existing active poll)</span>
          </button>
        </div>

        {/* Existing Polls */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Past & Active Polls</h2>
          
          {polls.length === 0 && <p className="text-sm text-gray-500 italic">No polls created yet.</p>}

          {polls.map(poll => (
            <div key={poll.id} className={`p-4 rounded-xl border space-y-3 ${poll.isActive ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Month {poll.month} / {poll.year}</h3>
                  <p className="text-xs text-gray-500">{new Date(poll.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleTogglePoll(poll.id, poll.isActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                    poll.isActive 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-400'
                  }`}
                >
                  {poll.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{poll.isActive ? 'Lock Poll' : 'Unlock Poll'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {poll.options.sort((a: any, b: any) => (b._count?.votes || 0) - (a._count?.votes || 0)).map((opt: any) => (
                  <div key={opt.id} className="flex items-center justify-between text-xs p-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{opt.itemName}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{opt._count?.votes || 0} votes</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
