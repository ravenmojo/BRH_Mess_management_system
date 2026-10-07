'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Unlock,
  Coins,
  Users,
  Plus,
  Minus,
  RotateCcw,
  Trophy,
  Clock,
  Trash2,
  Share2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UserPlus,
  Pencil,
  X,
  TrendingUp,
  TrendingDown,
  Equal,
  Calculator
} from 'lucide-react';

const POKER_PASSWORD = 'poker@brh';
const STORAGE_KEY = 'brh_poker_sheet_v1';
const AUTH_KEY = 'brh_poker_auth';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface PokerPlayer {
  id: string;
  name: string;
  initialBuyIn: number;
  rebuys: number;
}

export interface PokerRound {
  id: string;
  roundNumber: number;
  timestamp: number;
  diffs: Record<string, number>; // playerId -> +/- amount
}

export interface PokerScoresheet {
  id: string;
  createdAt: number;
  updatedAt: number;
  players: PokerPlayer[];
  rounds: PokerRound[];
}

export function PokerScoreKeeper() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Scoresheet State
  const [sheet, setSheet] = useState<PokerScoresheet | null>(null);
  const [hasExpiredNotice, setHasExpiredNotice] = useState<boolean>(false);

  // Setup Form State (for creating a new sheet)
  const [setupPlayers, setSetupPlayers] = useState<Array<{ id: string; name: string; buyIn: number }>>([
    { id: '1', name: 'Player 1', buyIn: 500 },
    { id: '2', name: 'Player 2', buyIn: 500 },
    { id: '3', name: 'Player 3', buyIn: 500 },
    { id: '4', name: 'Player 4', buyIn: 500 },
  ]);
  const [defaultBuyIn, setDefaultBuyIn] = useState<number>(500);

  // Active Round Recording Modal / Section
  const [isRecordingRound, setIsRecordingRound] = useState<boolean>(false);
  // map of playerId -> { sign: '+' | '-', val: string }
  const [roundInputs, setRoundInputs] = useState<Record<string, { sign: '+' | '-'; val: string }>>({});

  // Re-buy modal
  const [rebuyPlayerId, setRebuyPlayerId] = useState<string | null>(null);
  const [rebuyAmount, setRebuyAmount] = useState<number>(500);

  // Late Player Joining modal (during active game)
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerBuyIn, setNewPlayerBuyIn] = useState<number>(500);

  // Edit Player Name State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerNameInput, setEditPlayerNameInput] = useState<string>('');

  // UI Toggles
  const [showRoundHistory, setShowRoundHistory] = useState<boolean>(false);
  const [showConfirmNewSheet, setShowConfirmNewSheet] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');

  // 1. Initial Load & Auth check
  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem(AUTH_KEY);
      if (savedAuth === POKER_PASSWORD) {
        setIsAuthenticated(true);
      }

      // Check saved scoresheet
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const parsed: PokerScoresheet = JSON.parse(savedRaw);
        if (parsed && parsed.createdAt) {
          const age = Date.now() - parsed.createdAt;
          if (age > TWENTY_FOUR_HOURS_MS) {
            // Expired after 24 hours
            localStorage.removeItem(STORAGE_KEY);
            setSheet(null);
            setHasExpiredNotice(true);
          } else {
            setSheet(parsed);
          }
        }
      }
    } catch (e) {
      console.error('Error loading poker data', e);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  // 2. 24-Hour Expiry Timer Updater
  useEffect(() => {
    if (!sheet) return;

    const updateRemaining = () => {
      const elapsed = Date.now() - sheet.createdAt;
      const left = TWENTY_FOUR_HOURS_MS - elapsed;
      if (left <= 0) {
        // Expire sheet
        localStorage.removeItem(STORAGE_KEY);
        setSheet(null);
        setHasExpiredNotice(true);
        setTimeRemainingText('Expired');
      } else {
        const hours = Math.floor(left / (1000 * 60 * 60));
        const minutes = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemainingText(`${hours}h ${minutes}m left`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000); // every minute
    return () => clearInterval(interval);
  }, [sheet]);

  // Save sheet helper
  const saveSheet = (newSheet: PokerScoresheet | null) => {
    setSheet(newSheet);
    try {
      if (newSheet) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSheet));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  };

  // Auth Submit
  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput.trim() === POKER_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      sessionStorage.setItem(AUTH_KEY, POKER_PASSWORD);
    } else {
      setAuthError('Incorrect passcode. Access is restricted to BRH Poker room.');
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    sessionStorage.removeItem(AUTH_KEY);
  };

  // Setup Actions
  const handleAddSetupPlayer = () => {
    if (setupPlayers.length >= 10) return;
    const nextIdx = setupPlayers.length + 1;
    setSetupPlayers([
      ...setupPlayers,
      { id: String(Date.now() + Math.random()), name: `Player ${nextIdx}`, buyIn: defaultBuyIn }
    ]);
  };

  const handleRemoveSetupPlayer = (id: string) => {
    if (setupPlayers.length <= 2) return;
    setSetupPlayers(setupPlayers.filter((p) => p.id !== id));
  };

  const handleSetPlayerCount = (count: number) => {
    const safeCount = Math.max(2, Math.min(10, count));
    const current = [...setupPlayers];
    if (safeCount > current.length) {
      for (let i = current.length + 1; i <= safeCount; i++) {
        current.push({ id: String(Date.now() + i), name: `Player ${i}`, buyIn: defaultBuyIn });
      }
    } else if (safeCount < current.length) {
      current.splice(safeCount);
    }
    setSetupPlayers(current);
  };

  const handleApplyDefaultBuyIn = () => {
    setSetupPlayers(setupPlayers.map((p) => ({ ...p, buyIn: defaultBuyIn })));
  };

  const handleStartGame = () => {
    if (setupPlayers.length < 2) return;
    const newSheet: PokerScoresheet = {
      id: 'sheet_' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      players: setupPlayers.map((p, idx) => ({
        id: p.id || `p_${idx}`,
        name: p.name.trim() || `Player ${idx + 1}`,
        initialBuyIn: Number(p.buyIn) || 0,
        rebuys: 0,
      })),
      rounds: [],
    };
    saveSheet(newSheet);
    setHasExpiredNotice(false);
    setShowConfirmNewSheet(false);
  };

  // Computed Player Stats
  const playerStats = useMemo(() => {
    if (!sheet) return [];
    return sheet.players.map((player) => {
      let netProfitLoss = 0;
      sheet.rounds.forEach((round) => {
        const diff = round.diffs[player.id] || 0;
        netProfitLoss += diff;
      });
      const totalBuyIn = player.initialBuyIn + (player.rebuys || 0);
      const currentBalance = totalBuyIn + netProfitLoss;
      return {
        ...player,
        totalBuyIn,
        netProfitLoss,
        currentBalance,
      };
    }).sort((a, b) => b.currentBalance - a.currentBalance); // ranked from top chip leader
  }, [sheet]);

  // Total Pot / Chips in play
  const totalChipsInPlay = useMemo(() => {
    if (!sheet) return 0;
    return sheet.players.reduce((sum, p) => sum + p.initialBuyIn + (p.rebuys || 0), 0);
  }, [sheet]);

  // Round Input Handling
  const handleOpenRoundModal = () => {
    if (!sheet) return;
    const initialInputs: Record<string, { sign: '+' | '-'; val: string }> = {};
    sheet.players.forEach((p) => {
      initialInputs[p.id] = { sign: '+', val: '' };
    });
    setRoundInputs(initialInputs);
    setIsRecordingRound(true);
  };

  const handleInputChange = (playerId: string, rawVal: string) => {
    let clean = rawVal.trim();
    let currentSign = roundInputs[playerId]?.sign || '+';

    if (clean.startsWith('-')) {
      currentSign = '-';
      clean = clean.replace(/^-+/, '');
    } else if (clean.startsWith('+')) {
      currentSign = '+';
      clean = clean.replace(/^\++/, '');
    }

    // Keep numbers and single decimal
    clean = clean.replace(/[^0-9.]/g, '');

    setRoundInputs((prev) => ({
      ...prev,
      [playerId]: { sign: currentSign, val: clean },
    }));
  };

  const toggleSign = (playerId: string) => {
    setRoundInputs((prev) => ({
      ...prev,
      [playerId]: {
        sign: prev[playerId]?.sign === '-' ? '+' : '-',
        val: prev[playerId]?.val || '',
      },
    }));
  };

  // Compute table round net sum for zero-sum check
  const roundNetSum = useMemo(() => {
    if (!sheet || !isRecordingRound) return 0;
    let sum = 0;
    sheet.players.forEach((p) => {
      const item = roundInputs[p.id];
      if (item && item.val) {
        const num = parseFloat(item.val) || 0;
        sum += item.sign === '-' ? -num : num;
      }
    });
    return Math.round(sum * 100) / 100;
  }, [sheet, isRecordingRound, roundInputs]);

  // Auto-balance button: sets this player's value so that total table round net sum becomes 0
  const handleAutoBalance = (targetPlayerId: string) => {
    if (!sheet) return;
    let othersSum = 0;
    sheet.players.forEach((p) => {
      if (p.id !== targetPlayerId) {
        const item = roundInputs[p.id];
        if (item && item.val) {
          const num = parseFloat(item.val) || 0;
          othersSum += item.sign === '-' ? -num : num;
        }
      }
    });

    const needed = -othersSum;
    const targetSign: '+' | '-' = needed >= 0 ? '+' : '-';
    const targetVal = String(Math.abs(Math.round(needed * 100) / 100));

    setRoundInputs((prev) => ({
      ...prev,
      [targetPlayerId]: { sign: targetSign, val: targetVal === '0' ? '' : targetVal },
    }));
  };

  const handleClearAllRoundInputs = () => {
    if (!sheet) return;
    const resetInputs: Record<string, { sign: '+' | '-'; val: string }> = {};
    sheet.players.forEach((p) => {
      resetInputs[p.id] = { sign: '+', val: '' };
    });
    setRoundInputs(resetInputs);
  };

  const handleSaveRound = () => {
    if (!sheet) return;
    const diffs: Record<string, number> = {};
    sheet.players.forEach((p) => {
      const item = roundInputs[p.id];
      if (item && item.val) {
        const num = parseFloat(item.val) || 0;
        diffs[p.id] = item.sign === '-' ? -num : num;
      } else {
        diffs[p.id] = 0;
      }
    });

    const newRound: PokerRound = {
      id: 'round_' + Date.now(),
      roundNumber: sheet.rounds.length + 1,
      timestamp: Date.now(),
      diffs,
    };

    const updatedSheet: PokerScoresheet = {
      ...sheet,
      updatedAt: Date.now(),
      rounds: [...sheet.rounds, newRound],
    };

    saveSheet(updatedSheet);
    setIsRecordingRound(false);
  };

  const handleDeleteLastRound = () => {
    if (!sheet || sheet.rounds.length === 0) return;
    const updated = {
      ...sheet,
      updatedAt: Date.now(),
      rounds: sheet.rounds.slice(0, -1),
    };
    saveSheet(updated);
  };

  // Re-buy handler
  const handleExecuteRebuy = () => {
    if (!sheet || !rebuyPlayerId) return;
    const amt = Number(rebuyAmount) || 0;
    if (amt <= 0) return;

    const updatedPlayers = sheet.players.map((p) => {
      if (p.id === rebuyPlayerId) {
        return { ...p, rebuys: (p.rebuys || 0) + amt };
      }
      return p;
    });

    const updatedSheet: PokerScoresheet = {
      ...sheet,
      updatedAt: Date.now(),
      players: updatedPlayers,
    };

    saveSheet(updatedSheet);
    setRebuyPlayerId(null);
  };

  // Add Late Player (mid-game join)
  const handleAddLatePlayer = () => {
    if (!sheet || sheet.players.length >= 10) return;
    const name = newPlayerName.trim() || `Player ${sheet.players.length + 1}`;
    const buyIn = Number(newPlayerBuyIn) || 500;

    const newPlayer: PokerPlayer = {
      id: 'player_' + Date.now(),
      name,
      initialBuyIn: buyIn,
      rebuys: 0,
    };

    const updatedSheet: PokerScoresheet = {
      ...sheet,
      updatedAt: Date.now(),
      players: [...sheet.players, newPlayer],
    };

    saveSheet(updatedSheet);
    setIsAddPlayerModalOpen(false);
    setNewPlayerName('');
  };

  // Rename Player
  const handleSaveRename = (playerId: string) => {
    if (!sheet) return;
    const trimmed = editPlayerNameInput.trim();
    if (!trimmed) {
      setEditingPlayerId(null);
      return;
    }

    const updatedPlayers = sheet.players.map((p) => (p.id === playerId ? { ...p, name: trimmed } : p));
    const updatedSheet: PokerScoresheet = {
      ...sheet,
      updatedAt: Date.now(),
      players: updatedPlayers,
    };

    saveSheet(updatedSheet);
    setEditingPlayerId(null);
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    if (!sheet) return;
    const lines = [
      `♠️ BRH POKER NIGHT - SCORESHEET ♠️`,
      `Rounds: ${sheet.rounds.length} | Total Pot: ₹${totalChipsInPlay}`,
      `---------------------------------`,
      ...playerStats.map((p, idx) => {
        const signStr = p.netProfitLoss >= 0 ? `+₹${p.netProfitLoss}` : `-₹${Math.abs(p.netProfitLoss)}`;
        return `${idx + 1}. ${p.name}: ₹${p.currentBalance} (${signStr}) [Buy-in: ₹${p.totalBuyIn}]`;
      }),
      `---------------------------------`,
      `Tracked via BRH Hall Info Hub`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // New Sheet Reset
  const handleResetToNewSheet = () => {
    saveSheet(null);
    setShowConfirmNewSheet(false);
  };

  if (isAuthChecking) {
    return null;
  }

  // ==========================================
  // VIEW A: LOCKED GATE (Password: poker@brh)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-indigo-500/30 dark:border-indigo-500/20 shadow-lg relative overflow-hidden bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-purple-950/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Hall Boarder Mini-App
                </span>
                <span className="text-xs">♠️ ♥️ ♦️ ♣️</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                BRH Poker Ledger
              </h3>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          Lightweight round scorekeeper, chip manager and automated profit/loss balance tracker for hall game nights.
        </p>

        {/* Password Unlock Box */}
        <form onSubmit={handleAuthSubmit} className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                id="poker-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (poker@brh)..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError('');
                }}
                className="w-full px-3.5 py-2.5 bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              id="poker-unlock-btn"
              type="submit"
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 touch-spring shrink-0"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock</span>
            </button>
          </div>

          {authError && (
            <div className="text-rose-500 dark:text-rose-400 text-[11px] font-semibold flex items-center space-x-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // VIEW B: SETUP FORM (No Active Scoresheet)
  // ==========================================
  if (!sheet) {
    return (
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-indigo-500/30 dark:border-indigo-500/20 shadow-xl space-y-4 bg-gradient-to-br from-slate-900/10 via-white/40 dark:via-slate-900/40 to-indigo-900/10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
              ♠️
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                New Poker Scoresheet
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure players (up to 10) & starting buy-ins
              </p>
            </div>
          </div>
          <button
            onClick={handleLock}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Lock Ledger"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>

        {hasExpiredNotice && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
            <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Previous scoresheet survived 24 hours and has expired. Ready for a new game!</span>
          </div>
        )}

        {/* Quick Player Count & Default Buy-in */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Number of Players (2 to 10):
            </label>
            <div className="flex flex-wrap gap-1">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSetPlayerCount(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    setupPlayers.length === num
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Default Buy-in (₹ / chips):
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                step="50"
                value={defaultBuyIn}
                onChange={(e) => setDefaultBuyIn(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold"
              />
              <button
                type="button"
                onClick={handleApplyDefaultBuyIn}
                className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold"
              >
                Apply All
              </button>
            </div>
          </div>
        </div>

        {/* Players List Inputs */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>Seat & Player Name</span>
            <span>Starting Amount (₹)</span>
          </div>

          {setupPlayers.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center space-x-2 p-2 bg-white/80 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/70 shadow-xs"
            >
              <span className="w-6 text-center text-xs font-bold text-slate-400">
                #{idx + 1}
              </span>
              <input
                type="text"
                placeholder={`Player ${idx + 1}`}
                value={player.name}
                maxLength={20}
                onChange={(e) => {
                  const updated = [...setupPlayers];
                  updated[idx].name = e.target.value;
                  setSetupPlayers(updated);
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={player.buyIn}
                  onChange={(e) => {
                    const updated = [...setupPlayers];
                    updated[idx].buyIn = Math.max(0, parseInt(e.target.value) || 0);
                    setSetupPlayers(updated);
                  }}
                  className="w-20 px-2 py-1.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {setupPlayers.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSetupPlayer(player.id)}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  title="Remove player"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Player & Launch Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {setupPlayers.length < 10 && (
            <button
              type="button"
              onClick={handleAddSetupPlayer}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all touch-spring"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Player ({setupPlayers.length}/10)</span>
            </button>
          )}

          <button
            id="poker-start-game-btn"
            type="button"
            onClick={handleStartGame}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-1.5 transition-all touch-spring"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Poker Sheet</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW C: ACTIVE SCORESHEET IN PROGRESS
  // ==========================================
  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-indigo-500/30 dark:border-indigo-500/20 shadow-xl space-y-4 bg-gradient-to-br from-slate-900/10 via-white/50 dark:via-slate-900/50 to-indigo-950/20">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
            ♠️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                BRH Poker Ledger
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Round {sheet.rounds.length}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>Survives 24 hrs ({timeRemainingText || 'active'})</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5">
          {sheet.players.length < 10 && (
            <button
              onClick={() => {
                setNewPlayerName(`Player ${sheet.players.length + 1}`);
                setNewPlayerBuyIn(sheet.players[0]?.initialBuyIn || 500);
                setIsAddPlayerModalOpen(true);
              }}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all touch-spring border border-indigo-200 dark:border-indigo-800"
              title="Add late player (up to 10)"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCopySummary}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all touch-spring border border-slate-200/80 dark:border-slate-700"
            title="Copy scores to clipboard"
          >
            {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
          <button
            id="poker-new-sheet-btn"
            onClick={() => setShowConfirmNewSheet(true)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all touch-spring"
          >
            New Sheet
          </button>
          <button
            onClick={handleLock}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Lock Ledger"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {copiedToast && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center animate-in fade-in">
          Scores copied to clipboard! Ready to paste in WhatsApp group ♠️
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-center shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Total Pot In Play
          </div>
          <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
            ₹{totalChipsInPlay}
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-center shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Active Players
          </div>
          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            {sheet.players.length} / 10
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-center shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Chip Leader
          </div>
          <div className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 truncate">
            👑 {playerStats[0]?.name || 'N/A'}
          </div>
        </div>
      </div>

      {/* Main Players Balance Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
          <span>Rank & Player</span>
          <div className="flex items-center space-x-6">
            <span className="hidden sm:inline">P / L</span>
            <span>Total Balance</span>
          </div>
        </div>

        <div className="space-y-1.5">
          {playerStats.map((player, rankIdx) => {
            const isLeader = rankIdx === 0 && player.netProfitLoss > 0;
            const isProfit = player.netProfitLoss > 0;
            const isLoss = player.netProfitLoss < 0;
            const isEditing = editingPlayerId === player.id;

            return (
              <div
                key={player.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                  isLeader
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/70 shadow-xs'
                    : 'bg-white/80 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/70'
                }`}
              >
                {/* Left: Player Info */}
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isLeader
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isLeader ? '👑' : rankIdx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          value={editPlayerNameInput}
                          maxLength={20}
                          onChange={(e) => setEditPlayerNameInput(e.target.value)}
                          className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-indigo-400 rounded-md text-xs font-bold text-slate-900 dark:text-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(player.id);
                            if (e.key === 'Escape') setEditingPlayerId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(player.id)}
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPlayerId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 group">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {player.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlayerId(player.id);
                            setEditPlayerNameInput(player.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-indigo-600"
                          title="Rename player"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Invested: ₹{player.totalBuyIn}
                      {player.rebuys > 0 && <span className="text-indigo-500 ml-1">(+₹{player.rebuys} rebuy)</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Profit/Loss & Total Balance */}
                <div className="flex items-center space-x-3 text-right shrink-0">
                  {/* P/L Badge */}
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-0.5 ${
                        isProfit
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : isLoss
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isProfit && <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
                      {isLoss && <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                      {!isProfit && !isLoss && <Equal className="w-2.5 h-2.5 mr-0.5" />}
                      <span>
                        {isProfit ? `+₹${player.netProfitLoss}` : isLoss ? `-₹${Math.abs(player.netProfitLoss)}` : '₹0'}
                      </span>
                    </span>
                  </div>

                  {/* Current Balance (Automated Total) */}
                  <div className="min-w-[70px] text-right">
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                      ₹{player.currentBalance}
                    </div>
                  </div>

                  {/* Rebuy Quick Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setRebuyPlayerId(player.id);
                      setRebuyAmount(player.initialBuyIn || 500);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-[10px] font-bold"
                    title="Add Re-buy chips"
                  >
                    +Rebuy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Record Round Action Button */}
      <div className="pt-2">
        <button
          id="poker-record-round-btn"
          type="button"
          onClick={handleOpenRoundModal}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all touch-spring"
        >
          <Plus className="w-4 h-4" />
          <span>Record Round {sheet.rounds.length + 1}</span>
        </button>
      </div>

      {/* Round History Accordion */}
      {sheet.rounds.length > 0 && (
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/70">
          <button
            type="button"
            onClick={() => setShowRoundHistory(!showRoundHistory)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
          >
            <span>Round History ({sheet.rounds.length} rounds recorded)</span>
            {showRoundHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRoundHistory && (
            <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1 animate-in fade-in">
              {sheet.rounds.slice().reverse().map((round) => (
                <div
                  key={round.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>Round #{round.roundNumber}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(round.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sheet.players.map((p) => {
                      const diff = round.diffs[p.id] || 0;
                      return (
                        <span
                          key={p.id}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            diff > 0
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : diff < 0
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {p.name}: {diff > 0 ? `+${diff}` : diff}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleDeleteLastRound}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo Last Round #{sheet.rounds.length}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: RECORD ROUND INPUT MODAL                         */}
      {/* ========================================================= */}
      {isRecordingRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-base">♠️</span>
                <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                  Record Round #{sheet.rounds.length + 1}
                </h4>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleClearAllRoundInputs}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecordingRound(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enter profit (+) or loss (-) for each player. Unchanged players can be left blank (0).
            </p>

            {/* Players Round Input List */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {sheet.players.map((player) => {
                const item = roundInputs[player.id] || { sign: '+', val: '' };
                const isPositive = item.sign === '+';

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {player.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Current Bal: ₹{playerStats.find((s) => s.id === player.id)?.currentBalance ?? player.initialBuyIn}
                      </div>
                    </div>

                    {/* Auto-balance & Sign Toggle & Value Input */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAutoBalance(player.id)}
                        className="px-1.5 py-1 text-[10px] font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                        title="Auto-fill balance so round total sums to 0"
                      >
                        Auto
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSign(player.id)}
                        className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                          isPositive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                        }`}
                        title="Toggle Profit (+) or Loss (-)"
                      >
                        {isPositive ? '+' : '–'}
                      </button>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={item.val}
                          onChange={(e) => handleInputChange(player.id, e.target.value)}
                          className={`w-24 px-2.5 py-1.5 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 text-right ${
                            isPositive
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 focus:ring-emerald-500'
                              : 'bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 focus:ring-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Zero-Sum Indicator */}
            <div
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border ${
                roundNetSum === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Calculator className="w-3.5 h-3.5" />
                <span>Round Table Net:</span>
              </span>
              <span>
                {roundNetSum === 0 ? '₹0 (Zero-Sum Balanced ✅)' : `${roundNetSum > 0 ? '+' : ''}₹${roundNetSum} (⚠️ Unbalanced)`}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRecordingRound(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                id="poker-submit-round-btn"
                type="button"
                onClick={handleSaveRound}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/30 transition-all touch-spring"
              >
                Submit Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REBUY MODAL                                      */}
      {/* ========================================================= */}
      {rebuyPlayerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                Add Chips / Re-buy
              </h4>
              <button onClick={() => setRebuyPlayerId(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Player: <strong className="text-slate-900 dark:text-white">{sheet.players.find((p) => p.id === rebuyPlayerId)?.name}</strong>
            </p>
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Re-buy Amount (₹):
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={rebuyAmount}
                onChange={(e) => setRebuyAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRebuyPlayerId(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRebuy}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Confirm Re-buy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD LATE PLAYER MODAL                            */}
      {/* ========================================================= */}
      {isAddPlayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                Add Late Player ({sheet.players.length}/10)
              </h4>
              <button onClick={() => setIsAddPlayerModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Player Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Siddharth"
                  value={newPlayerName}
                  maxLength={20}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Starting Buy-in (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={newPlayerBuyIn}
                  onChange={(e) => setNewPlayerBuyIn(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddPlayerModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddLatePlayer}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Add Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CONFIRM NEW SHEET (RESET)                        */}
      {/* ========================================================= */}
      {showConfirmNewSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-500">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                Start New Scoresheet?
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure? Current player balances and round history will be permanently reset.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmNewSheet(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Keep Current
              </button>
              <button
                id="poker-confirm-new-sheet-btn"
                type="button"
                onClick={handleResetToNewSheet}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Yes, Start New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
