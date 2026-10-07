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
  Calculator,
  Gamepad2,
  Dices,
  Target,
  ArrowRightLeft,
  HandCoins
} from 'lucide-react';

// Secured access hash for "poker@brh"
const ACCESS_PASS_HASH = '0417301e2cf799166eed8cd914a6e5ccead1bbfdbc5e5df1b74d6f12abf64ee3';
const STORAGE_KEY = 'brh_games_ledger_v1';
const LEGACY_STORAGE_KEY = typeof atob !== 'undefined' ? atob('YnJoX3Bva2VyX3NoZWV0X3Yx') : '';
const AUTH_KEY = 'brh_games_auth';
const LEGACY_AUTH_KEY = typeof atob !== 'undefined' ? atob('YnJoX3Bva2VyX2F1dGg=') : '';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return '';
}

export interface GamePlayer {
  id: string;
  name: string;
  initialBuyIn: number;
  rebuys: number; // can be positive (top-up) or negative (cashed-out)
}

export interface GameRound {
  id: string;
  roundNumber: number;
  timestamp: number;
  diffs: Record<string, number>; // playerId -> +/- amount
}

export interface GameLoan {
  id: string;
  lenderId: string;   // player giving chips
  lenderName: string;
  borrowerId: string; // player receiving chips
  borrowerName: string;
  amount: number;     // ₹
  timestamp: number;
  settled: boolean;   // whether debt has been settled/repaid
  transferChips: boolean; // whether chips transferred between table balances
}

export interface GameScoresheet {
  id: string;
  createdAt: number;
  updatedAt: number;
  players: GamePlayer[];
  rounds: GameRound[];
  loans?: GameLoan[];
}

export function GameNightLedger() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Scoresheet State
  const [sheet, setSheet] = useState<GameScoresheet | null>(null);
  const [hasExpiredNotice, setHasExpiredNotice] = useState<boolean>(false);

  // Setup Form State (for creating a new session)
  const [setupPlayers, setSetupPlayers] = useState<Array<{ id: string; name: string; buyIn: number }>>([
    { id: '1', name: 'Player 1', buyIn: 500 },
    { id: '2', name: 'Player 2', buyIn: 500 },
    { id: '3', name: 'Player 3', buyIn: 500 },
    { id: '4', name: 'Player 4', buyIn: 500 },
  ]);
  const [defaultBuyIn, setDefaultBuyIn] = useState<number>(500);

  // Active Round Recording Modal / Section
  const [isRecordingRound, setIsRecordingRound] = useState<boolean>(false);
  const [roundInputs, setRoundInputs] = useState<Record<string, { sign: '+' | '-'; val: string }>>({});

  // Top-up (Re-buy / Cash-out) modal
  const [topupPlayerId, setTopupPlayerId] = useState<string | null>(null);
  const [topupType, setTopupType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [topupAmount, setTopupAmount] = useState<string>('500');

  // Loan Modal State
  const [isLoanModalOpen, setIsLoanModalOpen] = useState<boolean>(false);
  const [loanLenderId, setLoanLenderId] = useState<string>('');
  const [loanBorrowerId, setLoanBorrowerId] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('200');
  const [loanTransferChips, setLoanTransferChips] = useState<boolean>(true);
  const [loanError, setLoanError] = useState<string>('');

  // Late Player Joining modal (during active session)
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerBuyIn, setNewPlayerBuyIn] = useState<number>(500);

  // Edit Player Name State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerNameInput, setEditPlayerNameInput] = useState<string>('');

  // UI Toggles
  const [showRoundHistory, setShowRoundHistory] = useState<boolean>(false);
  const [showLoansSection, setShowLoansSection] = useState<boolean>(false);
  const [showConfirmNewSheet, setShowConfirmNewSheet] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');

  // 1. Initial Load & Auth check
  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem(AUTH_KEY) || sessionStorage.getItem(LEGACY_AUTH_KEY);
      if (savedAuth === 'unlocked' || savedAuth === ACCESS_PASS_HASH) {
        setIsAuthenticated(true);
      }

      // Check saved scoresheet
      const savedRaw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedRaw) {
        const parsed: GameScoresheet = JSON.parse(savedRaw);
        if (parsed && parsed.createdAt) {
          const age = Date.now() - parsed.createdAt;
          if (age > TWENTY_FOUR_HOURS_MS) {
            // Expired after 24 hours
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            setSheet(null);
            setHasExpiredNotice(true);
          } else {
            // Ensure loans array exists
            if (!parsed.loans) parsed.loans = [];
            setSheet(parsed);
          }
        }
      }
    } catch (e) {
      console.error('Error loading game ledger data', e);
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
        localStorage.removeItem(LEGACY_STORAGE_KEY);
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
    const interval = setInterval(updateRemaining, 60000);
    return () => clearInterval(interval);
  }, [sheet]);

  // Save sheet helper
  const saveSheet = (newSheet: GameScoresheet | null) => {
    setSheet(newSheet);
    try {
      if (newSheet) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSheet));
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  };

  // Auth Submit
  const handleAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = passwordInput.trim();
    if (!cleanInput) {
      setAuthError('Please enter the access passcode.');
      return;
    }

    try {
      const hash = await sha256Hex(cleanInput);
      if (hash === ACCESS_PASS_HASH) {
        setIsAuthenticated(true);
        setAuthError('');
        sessionStorage.setItem(AUTH_KEY, 'unlocked');
        return;
      }
    } catch { }

    setAuthError('Incorrect passcode. Access is restricted to authorized boarders.');
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(LEGACY_AUTH_KEY);
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
    const newSheet: GameScoresheet = {
      id: 'session_' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      players: setupPlayers.map((p, idx) => ({
        id: p.id || `p_${idx}`,
        name: p.name.trim() || `Player ${idx + 1}`,
        initialBuyIn: Number(p.buyIn) || 0,
        rebuys: 0,
      })),
      rounds: [],
      loans: [],
    };
    saveSheet(newSheet);
    setHasExpiredNotice(false);
    setShowConfirmNewSheet(false);
  };

  // =========================================================================
  // Computed Player Stats - KEPT IN FIXED SEAT ORDER (DO NOT SORT EVERY ROUND!)
  // =========================================================================
  const playerStats = useMemo(() => {
    if (!sheet) return [];
    const loansList = sheet.loans || [];

    return sheet.players.map((player) => {
      // 1. Round profits and losses
      let netProfitLoss = 0;
      sheet.rounds.forEach((round) => {
        const diff = round.diffs[player.id] || 0;
        netProfitLoss += diff;
      });

      // 2. Loans chip transfers
      // If player borrowed chips (transferChips = true), their table balance increases
      // If player lent chips (transferChips = true), their table balance decreases
      let loanChipDelta = 0;
      let totalDebtOwed = 0; // how much this player owes others
      let totalLentPending = 0; // how much others owe this player

      loansList.forEach((loan) => {
        if (loan.borrowerId === player.id) {
          if (loan.transferChips) {
            loanChipDelta += loan.amount;
          }
          if (!loan.settled) {
            totalDebtOwed += loan.amount;
          }
        }
        if (loan.lenderId === player.id) {
          if (loan.transferChips) {
            loanChipDelta -= loan.amount;
          }
          if (!loan.settled) {
            totalLentPending += loan.amount;
          }
        }
      });

      const totalBuyIn = player.initialBuyIn + (player.rebuys || 0);
      const currentBalance = totalBuyIn + netProfitLoss + loanChipDelta;

      return {
        ...player,
        totalBuyIn,
        netProfitLoss,
        loanChipDelta,
        totalDebtOwed,
        totalLentPending,
        currentBalance,
      };
    });
    // NOTE: Order is 100% FIXED to sheet.players (No jumping rows after rounds!)
  }, [sheet]);

  // Highest balance to identify chip leader without rearranging rows
  const highestBalance = useMemo(() => {
    if (playerStats.length === 0) return -Infinity;
    const maxVal = Math.max(...playerStats.map((p) => p.currentBalance));
    return maxVal;
  }, [playerStats]);

  // Total Pot / Points in play
  const totalChipsInPlay = useMemo(() => {
    if (!sheet) return 0;
    return sheet.players.reduce((sum, p) => sum + p.initialBuyIn + (p.rebuys || 0), 0);
  }, [sheet]);

  // Active unsettled loans
  const activeLoans = useMemo(() => {
    if (!sheet || !sheet.loans) return [];
    return sheet.loans;
  }, [sheet]);

  const unsettledLoansCount = useMemo(() => {
    return activeLoans.filter((l) => !l.settled).length;
  }, [activeLoans]);

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

    const newRound: GameRound = {
      id: 'round_' + Date.now(),
      roundNumber: sheet.rounds.length + 1,
      timestamp: Date.now(),
      diffs,
    };

    const updatedSheet: GameScoresheet = {
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

  // =========================================================================
  // Top-up (Rebuy / Cash-Out) Handler - SUPPORTS NEGATIVE TOP-UP
  // =========================================================================
  const handleOpenTopup = (playerId: string) => {
    setTopupPlayerId(playerId);
    setTopupType('ADD');
    setTopupAmount('500');
  };

  const handleExecuteTopup = () => {
    if (!sheet || !topupPlayerId) return;
    const num = Math.abs(parseFloat(topupAmount) || 0);
    if (num === 0) return;

    // Positive or negative top-up
    const signedDelta = topupType === 'DEDUCT' ? -num : num;

    const updatedPlayers = sheet.players.map((p) => {
      if (p.id === topupPlayerId) {
        return { ...p, rebuys: (p.rebuys || 0) + signedDelta };
      }
      return p;
    });

    const updatedSheet: GameScoresheet = {
      ...sheet,
      updatedAt: Date.now(),
      players: updatedPlayers,
    };

    saveSheet(updatedSheet);
    setTopupPlayerId(null);
  };

  // =========================================================================
  // Loan / Debt Handler (Player to Player)
  // =========================================================================
  const handleOpenLoanModal = (defaultBorrowerOrLenderId?: string) => {
    if (!sheet || sheet.players.length < 2) return;
    setLoanError('');
    setLoanAmount('200');
    setLoanTransferChips(true);

    if (defaultBorrowerOrLenderId) {
      setLoanBorrowerId(defaultBorrowerOrLenderId);
      const other = sheet.players.find((p) => p.id !== defaultBorrowerOrLenderId);
      setLoanLenderId(other?.id || '');
    } else {
      setLoanLenderId(sheet.players[0]?.id || '');
      setLoanBorrowerId(sheet.players[1]?.id || '');
    }
    setIsLoanModalOpen(true);
  };

  const handleCreateLoan = () => {
    if (!sheet) return;
    if (!loanLenderId || !loanBorrowerId) {
      setLoanError('Please select both a lender and borrower.');
      return;
    }
    if (loanLenderId === loanBorrowerId) {
      setLoanError('Lender and borrower cannot be the same person.');
      return;
    }
    const amt = parseFloat(loanAmount);
    if (!amt || amt <= 0) {
      setLoanError('Please enter a valid loan amount greater than ₹0.');
      return;
    }

    const lender = sheet.players.find((p) => p.id === loanLenderId);
    const borrower = sheet.players.find((p) => p.id === loanBorrowerId);

    const newLoan: GameLoan = {
      id: 'loan_' + Date.now(),
      lenderId: loanLenderId,
      lenderName: lender?.name || 'Lender',
      borrowerId: loanBorrowerId,
      borrowerName: borrower?.name || 'Borrower',
      amount: amt,
      timestamp: Date.now(),
      settled: false,
      transferChips: loanTransferChips,
    };

    const existingLoans = sheet.loans || [];
    const updatedSheet: GameScoresheet = {
      ...sheet,
      updatedAt: Date.now(),
      loans: [...existingLoans, newLoan],
    };

    saveSheet(updatedSheet);
    setIsLoanModalOpen(false);
  };

  const handleToggleSettleLoan = (loanId: string) => {
    if (!sheet || !sheet.loans) return;
    const updatedLoans = sheet.loans.map((l) => {
      if (l.id === loanId) {
        return { ...l, settled: !l.settled };
      }
      return l;
    });

    saveSheet({
      ...sheet,
      updatedAt: Date.now(),
      loans: updatedLoans,
    });
  };

  const handleDeleteLoan = (loanId: string) => {
    if (!sheet || !sheet.loans) return;
    const updatedLoans = sheet.loans.filter((l) => l.id !== loanId);
    saveSheet({
      ...sheet,
      updatedAt: Date.now(),
      loans: updatedLoans,
    });
  };

  // Add Late Player (mid-game join)
  const handleAddLatePlayer = () => {
    if (!sheet || sheet.players.length >= 10) return;
    const name = newPlayerName.trim() || `Player ${sheet.players.length + 1}`;
    const buyIn = Number(newPlayerBuyIn) || 500;

    const newPlayer: GamePlayer = {
      id: 'player_' + Date.now(),
      name,
      initialBuyIn: buyIn,
      rebuys: 0,
    };

    const updatedSheet: GameScoresheet = {
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
    const updatedSheet: GameScoresheet = {
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
    const activeUnsettled = (sheet.loans || []).filter((l) => !l.settled);

    const lines = [
      `🎯 BRH GAME NIGHT - SESSION SCORES 🎯`,
      `Rounds: ${sheet.rounds.length} | Total Pool: ₹${totalChipsInPlay}`,
      `---------------------------------`,
      ...playerStats.map((p, idx) => {
        const signStr = p.netProfitLoss >= 0 ? `+₹${p.netProfitLoss}` : `-₹${Math.abs(p.netProfitLoss)}`;
        let extra = '';
        if (p.totalDebtOwed > 0) extra += ` (Owes ₹${p.totalDebtOwed})`;
        if (p.totalLentPending > 0) extra += ` (Lent ₹${p.totalLentPending})`;
        return `${idx + 1}. ${p.name}: ₹${p.currentBalance} [P/L: ${signStr}] (Buy-in: ₹${p.totalBuyIn})${extra}`;
      }),
      `---------------------------------`,
      ...(activeUnsettled.length > 0
        ? [
            `🤝 Active Debts to Settle:`,
            ...activeUnsettled.map((l) => `• ${l.borrowerName} owes ${l.lenderName}: ₹${l.amount}`),
            `---------------------------------`,
          ]
        : []),
      `Recorded via BRH Hall Info Hub`,
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
  // VIEW A: LOCKED GATE
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-indigo-500/30 dark:border-indigo-500/20 shadow-lg relative overflow-hidden bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-purple-950/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Recreation Mini-App
                </span>
                <span className="text-xs">🎯 🎲 🎮</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                BRH Indoor Games Ledger
              </h3>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          Session tally, round points ledger and automated profit/loss balance tracker for hall recreation games.
        </p>

        {/* Password Unlock Box */}
        <form onSubmit={handleAuthSubmit} className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                id="games-ledger-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter passcode to unlock..."
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
              id="games-ledger-unlock-btn"
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
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                New Game Session Ledger
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure participants (up to 10) & starting buy-ins / points
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
            <span>Previous session survived 24 hours and has expired. Ready for a new game!</span>
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
              Default Buy-in / Stack (₹):
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

        {/* Players List Inputs - SPACIOUS & DECLUTTERED */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>Seat & Full Player Name</span>
            <span>Starting Stack (₹)</span>
          </div>

          {setupPlayers.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center space-x-2.5 p-2.5 bg-white/80 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/70 shadow-xs"
            >
              <span className="w-6 text-center text-xs font-bold text-slate-400 shrink-0">
                #{idx + 1}
              </span>
              <input
                type="text"
                placeholder={`Player ${idx + 1} Name`}
                value={player.name}
                maxLength={30}
                onChange={(e) => {
                  const updated = [...setupPlayers];
                  updated[idx].name = e.target.value;
                  setSetupPlayers(updated);
                }}
                className="flex-1 min-w-0 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center space-x-1 shrink-0">
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
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
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
            id="games-ledger-start-game-btn"
            type="button"
            onClick={handleStartGame}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-1.5 transition-all touch-spring"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Game Ledger</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW C: ACTIVE SCORESHEET IN PROGRESS
  // ==========================================
  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-indigo-500/30 dark:border-indigo-500/20 shadow-xl space-y-4 bg-gradient-to-br from-slate-900/10 via-white/50 dark:via-slate-900/50 to-indigo-950/20">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                BRH Game Room Ledger
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
            onClick={() => handleOpenLoanModal()}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all touch-spring border border-amber-200 dark:border-amber-800 flex items-center space-x-1"
            title="Record player-to-player loan"
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Loan</span>
            {unsettledLoansCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold ml-0.5">
                {unsettledLoansCount}
              </span>
            )}
          </button>

          <button
            onClick={handleCopySummary}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all touch-spring border border-slate-200/80 dark:border-slate-700"
            title="Copy scores to clipboard"
          >
            {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
          <button
            id="games-ledger-new-sheet-btn"
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
          Scores & debts copied to clipboard! Ready to paste in WhatsApp group 🎯
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-center shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Total Pool In Play
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
            👑 {playerStats.find((p) => p.currentBalance === highestBalance && p.netProfitLoss > 0)?.name || 'N/A'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Main Players Balance Cards - SPACIOUS & DECLUTTERED (FIXED SEAT ORDER)     */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
          <span>Seat & Player</span>
          <span>Current Balance</span>
        </div>

        <div className="space-y-2">
          {playerStats.map((player, seatIdx) => {
            const isLeader = highestBalance > player.totalBuyIn && player.currentBalance === highestBalance;
            const isProfit = player.netProfitLoss > 0;
            const isLoss = player.netProfitLoss < 0;
            const isEditing = editingPlayerId === player.id;

            return (
              <div
                key={player.id}
                className={`p-3 rounded-2xl border transition-all space-y-2 shadow-xs ${
                  isLeader
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/70'
                    : 'bg-white/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/70'
                }`}
              >
                {/* Row 1: Full-width Player Name and Prominent Balance */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                      #{seatIdx + 1}
                    </span>

                    {/* Generous breathing room for player names */}
                    {isEditing ? (
                      <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editPlayerNameInput}
                          maxLength={30}
                          onChange={(e) => setEditPlayerNameInput(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 bg-white dark:bg-slate-900 border border-indigo-400 rounded-md text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(player.id);
                            if (e.key === 'Escape') setEditingPlayerId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(player.id)}
                          className="p-1 text-emerald-600 hover:text-emerald-700 shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPlayerId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 min-w-0 flex-1 group">
                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base break-words">
                          {player.name}
                        </span>
                        {isLeader && (
                          <span title="Table Chip Leader" className="text-sm shrink-0">
                            👑
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlayerId(player.id);
                            setEditPlayerNameInput(player.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-indigo-600 shrink-0"
                          title="Rename player"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bold, prominent total balance */}
                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      ₹{player.currentBalance}
                    </div>
                  </div>
                </div>

                {/* Row 2: Secondary Metadata, Profit/Loss Pill, Loans, & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                  {/* Left: Investment, P/L, and Loan Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Buy-in: ₹{player.initialBuyIn}
                      {player.rebuys > 0 && <span className="text-indigo-500 ml-1">(+₹{player.rebuys} top-up)</span>}
                      {player.rebuys < 0 && <span className="text-amber-500 ml-1">(-₹{Math.abs(player.rebuys)} out)</span>}
                    </span>

                    {/* Net P/L Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold flex items-center space-x-0.5 ${
                        isProfit
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : isLoss
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isProfit && <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
                      {isLoss && <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                      {!isProfit && !isLoss && <Equal className="w-2.5 h-2.5 mr-0.5" />}
                      <span>
                        {isProfit ? `+₹${player.netProfitLoss}` : isLoss ? `-₹${Math.abs(player.netProfitLoss)}` : '₹0'}
                      </span>
                    </span>

                    {/* Loan Tags */}
                    {player.totalDebtOwed > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[10px]">
                        Owes ₹{player.totalDebtOwed}
                      </span>
                    )}
                    {player.totalLentPending > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-[10px]">
                        Lent ₹{player.totalLentPending}
                      </span>
                    )}
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenLoanModal(player.id)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-700/70 hover:bg-amber-50 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1"
                      title="Loan chips to/from this player"
                    >
                      <HandCoins className="w-3 h-3" />
                      <span>Loan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenTopup(player.id)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-700/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg font-bold text-[11px] transition-colors"
                      title="Add top-up chips or cash out"
                    >
                      ±Top-up
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Record Round Action Button */}
      <div className="pt-2">
        <button
          id="games-ledger-record-round-btn"
          type="button"
          onClick={handleOpenRoundModal}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all touch-spring"
        >
          <Plus className="w-4 h-4" />
          <span>Record Round {sheet.rounds.length + 1}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: PLAYER-TO-PLAYER LOANS & DEBTS DRAWER                            */}
      {/* ========================================================================= */}
      {activeLoans.length > 0 && (
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/70">
          <button
            type="button"
            onClick={() => setShowLoansSection(!showLoansSection)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
          >
            <div className="flex items-center space-x-1.5">
              <HandCoins className="w-3.5 h-3.5 text-amber-500" />
              <span>Player Loans & Debts ({activeLoans.length})</span>
              {unsettledLoansCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {unsettledLoansCount} pending
                </span>
              )}
            </div>
            {showLoansSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLoansSection && (
            <div className="mt-2 space-y-2 animate-in fade-in">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    loan.settled
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1 flex-wrap">
                      <span className="text-rose-600 dark:text-rose-400">{loan.borrowerName}</span>
                      <span className="text-slate-400 font-normal">owes</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{loan.lenderName}</span>
                      <span className="font-black text-amber-700 dark:text-amber-300 ml-1">₹{loan.amount}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>{new Date(loan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {loan.transferChips && <span className="text-indigo-500 font-semibold">• Chips transferred</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSettleLoan(loan.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        loan.settled
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      {loan.settled ? 'Settled ✓' : 'Mark Repaid'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLoan(loan.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Delete / cancel loan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                <Target className="w-4 h-4 text-indigo-500" />
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

            {/* Players Round Input List - SPACIOUS NAME AREA */}
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
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white break-words">
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
                id="games-ledger-submit-round-btn"
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
      {/* MODAL 2: TOP-UP / CASH-OUT MODAL (SUPPORTS NEGATIVE TOP-UP) */}
      {/* ========================================================= */}
      {topupPlayerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                Stack Adjustment / Top-up
              </h4>
              <button onClick={() => setTopupPlayerId(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Player: <strong className="text-slate-900 dark:text-white">{sheet.players.find((p) => p.id === topupPlayerId)?.name}</strong>
            </p>

            {/* Positive vs Negative toggle */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setTopupType('ADD')}
                className={`py-1.5 rounded-lg transition-all ${
                  topupType === 'ADD'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                + Top-up (Add)
              </button>
              <button
                type="button"
                onClick={() => setTopupType('DEDUCT')}
                className={`py-1.5 rounded-lg transition-all ${
                  topupType === 'DEDUCT'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                – Cash-out (Deduct)
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Amount (₹):
              </label>
              <input
                type="number"
                min="10"
                step="50"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {topupType === 'ADD'
                  ? 'Adds chips to player stack and total buy-in.'
                  : 'Deducts chips from player stack (e.g. early cash out or correction).'}
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setTopupPlayerId(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTopup}
                className={`flex-1 py-2 text-white rounded-xl text-xs font-bold shadow-md transition-all ${
                  topupType === 'ADD' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {topupType === 'ADD' ? 'Confirm Top-up' : 'Confirm Cash-out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: PLAYER-TO-PLAYER LOAN MODAL                      */}
      {/* ========================================================= */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HandCoins className="w-4 h-4 text-amber-500" />
                <h4 className="font-black text-slate-900 dark:text-white text-sm">
                  Record Player Loan
                </h4>
              </div>
              <button onClick={() => setIsLoanModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Record chips loaned from one player to another. Chips move between table balances and debts are tracked.
            </p>

            <div className="space-y-3">
              {/* Lender */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Lender (Giving chips):
                </label>
                <select
                  value={loanLenderId}
                  onChange={(e) => setLoanLenderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  {sheet.players.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === loanBorrowerId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Borrower */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Borrower (Receiving chips):
                </label>
                <select
                  value={loanBorrowerId}
                  onChange={(e) => setLoanBorrowerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  {sheet.players.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === loanLenderId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Loan Amount (₹):
                </label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Transfer chips option */}
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={loanTransferChips}
                  onChange={(e) => setLoanTransferChips(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Transfer chips between table balances now</span>
              </label>

              {loanError && (
                <div className="text-rose-500 text-xs font-bold animate-in fade-in">
                  {loanError}
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLoanModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateLoan}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30"
              >
                Confirm Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD LATE PLAYER MODAL                            */}
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
                  maxLength={30}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Starting Buy-in / Stack (₹):
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
      {/* MODAL 5: CONFIRM NEW SHEET (RESET)                        */}
      {/* ========================================================= */}
      {showConfirmNewSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-500">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                Start New Session?
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure? Current player balances, round history, and loan records will be permanently reset.
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
                id="games-ledger-confirm-new-sheet-btn"
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
