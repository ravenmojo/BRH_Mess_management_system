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
  X,
  ArrowUp,
  ArrowDown,
  Equal,
  Calculator,
  Gamepad2,
  Dices,
  Target,
  ArrowRightLeft,
  HandCoins
} from 'lucide-react';

// Secured access hash for passcode
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

export interface GameLoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  timestamp: number;
  transferChips: boolean;
}

export interface GameLoan {
  id: string;
  lenderId: string;   // player giving chips
  lenderName: string;
  borrowerId: string; // player receiving chips
  borrowerName: string;
  amount: number;     // points originally borrowed
  timestamp: number;
  settled: boolean;   // whether debt has been settled/repaid
  transferChips: boolean; // whether chips transferred between table balances
  repaidAmount?: number; // total points repaid so far
  repayments?: GameLoanRepayment[]; // log of all return loan transactions
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
    { id: '1', name: 'Player 1', buyIn: 5000 },
    { id: '2', name: 'Player 2', buyIn: 5000 },
    { id: '3', name: 'Player 3', buyIn: 5000 },
    { id: '4', name: 'Player 4', buyIn: 5000 },
  ]);
  const [defaultBuyIn, setDefaultBuyIn] = useState<number>(5000);
  const [applyAllSuccess, setApplyAllSuccess] = useState<boolean>(false);

  // Active Round Recording Modal / Section
  const [isRecordingRound, setIsRecordingRound] = useState<boolean>(false);
  const [roundInputs, setRoundInputs] = useState<Record<string, { sign: '+' | '-'; val: string; isAuto?: boolean }>>({});

  // Top-up (Re-buy / Cash-out) modal
  const [topupPlayerId, setTopupPlayerId] = useState<string | null>(null);
  const [topupType, setTopupType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [topupAmount, setTopupAmount] = useState<string>('500');

  // Loan Modal State (Giving / taking loan)
  const [isLoanModalOpen, setIsLoanModalOpen] = useState<boolean>(false);
  const [loanActivePlayerCardId, setLoanActivePlayerCardId] = useState<string | null>(null);
  const [loanLenderId, setLoanLenderId] = useState<string>('');
  const [loanBorrowerId, setLoanBorrowerId] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('200');
  const [loanTransferChips, setLoanTransferChips] = useState<boolean>(true);
  const [loanError, setLoanError] = useState<string>('');

  // Return Loan State (Repaying borrowed chips)
  const [returnLoanPlayerId, setReturnLoanPlayerId] = useState<string | null>(null);
  const [returnLoanSelectedLoanId, setReturnLoanSelectedLoanId] = useState<string>('');
  const [returnLoanAmount, setReturnLoanAmount] = useState<string>('');
  const [returnLoanTransferChips, setReturnLoanTransferChips] = useState<boolean>(true);
  const [returnLoanError, setReturnLoanError] = useState<string>('');

  // Late Player Joining modal (during active session)
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerBuyIn, setNewPlayerBuyIn] = useState<number>(5000);

  // Edit Player Name State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerNameInput, setEditPlayerNameInput] = useState<string>('');

  // UI Toggles
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showRoundHistory, setShowRoundHistory] = useState<boolean>(false);
  const [showLoansSection, setShowLoansSection] = useState<boolean>(false);
  const [expandedSettledLoanId, setExpandedSettledLoanId] = useState<string | null>(null);
  const [showConfirmNewSheet, setShowConfirmNewSheet] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');

  // Dropdown Popover on Player Balance (Last 5 Records)
  const [activeDropdownPlayerId, setActiveDropdownPlayerId] = useState<string | null>(null);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = React.useRef<boolean>(false);
  const ledgerContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Participating players for adding a new record (initial state is ALWAYS ALL for all players)
  const [participatingPlayerIds, setParticipatingPlayerIds] = useState<Set<string>>(new Set());
  const [roundModalError, setRoundModalError] = useState<string>('');
  const [exceededLossPlayerIds, setExceededLossPlayerIds] = useState<Set<string>>(new Set());

  // Expand ledger if collapsed when any action is initiated
  useEffect(() => {
    if (isRecordingRound || topupPlayerId || returnLoanPlayerId || returnLoanSelectedLoanId || isLoanModalOpen || isAddPlayerModalOpen) {
      setIsCollapsed(false);
    }
  }, [isRecordingRound, topupPlayerId, returnLoanPlayerId, returnLoanSelectedLoanId, isLoanModalOpen, isAddPlayerModalOpen]);

  // Close dropdown on outside click / tap anywhere
  useEffect(() => {
    if (!activeDropdownPlayerId) return;
    const handleOutside = () => setActiveDropdownPlayerId(null);
    window.addEventListener('click', handleOutside);
    window.addEventListener('touchstart', handleOutside);
    return () => {
      window.removeEventListener('click', handleOutside);
      window.removeEventListener('touchstart', handleOutside);
    };
  }, [activeDropdownPlayerId]);

  const startLongPress = (playerId: string) => {
    isLongPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      setActiveDropdownPlayerId(playerId);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (_) { }
      }
    }, 400);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

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
    if (setupPlayers.length >= 20) return;
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
    const safeCount = Math.max(2, Math.min(20, count));
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

      // 2. Loans chip transfers and debt obligations
      // If player borrowed chips (transferChips = true), table balance increased
      // When borrower returns chips (transferChips = true in repayment), table balance decreases
      // If player lent chips (transferChips = true), table balance decreased
      // When lender receives chips back (transferChips = true in repayment), table balance increases
      let loanChipDelta = 0;
      let totalDebtOwed = 0; // how much this player owes others (remaining unsettled debt)
      let totalLentPending = 0; // how much others owe this player (remaining unsettled debt)

      loansList.forEach((loan) => {
        const totalRepaid = loan.repaidAmount ?? (loan.repayments ? loan.repayments.reduce((s, r) => s + r.amount, 0) : 0);
        const remainingDebt = loan.settled ? 0 : Math.max(0, loan.amount - totalRepaid);

        const repaidChips = (loan.repayments || [])
          .filter((r) => r.transferChips)
          .reduce((s, r) => s + r.amount, 0);

        if (loan.borrowerId === player.id) {
          if (loan.transferChips) {
            loanChipDelta += Math.max(0, loan.amount - repaidChips);
          }
          totalDebtOwed += remainingDebt;
        }

        if (loan.lenderId === player.id) {
          if (loan.transferChips) {
            loanChipDelta -= Math.max(0, loan.amount - repaidChips);
          }
          totalLentPending += remainingDebt;
        }
      });

      const totalBuyIn = player.initialBuyIn + (player.rebuys || 0);
      const currentBalance = Math.max(0, totalBuyIn + netProfitLoss + loanChipDelta);

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

  // Active loans
  const activeLoans = useMemo(() => {
    if (!sheet || !sheet.loans) return [];
    return sheet.loans;
  }, [sheet]);

  const unsettledLoansCount = useMemo(() => {
    return activeLoans.filter((l) => {
      const totalRepaid = l.repaidAmount ?? (l.repayments ? l.repayments.reduce((s, r) => s + r.amount, 0) : 0);
      const remainingDebt = l.settled ? 0 : Math.max(0, l.amount - totalRepaid);
      return !l.settled && remainingDebt > 0;
    }).length;
  }, [activeLoans]);

  // Sorted loans: active/unsettled debts first, followed by settled loans
  const sortedLoans = useMemo(() => {
    return [...activeLoans].sort((a, b) => {
      if (a.settled !== b.settled) return a.settled ? 1 : -1;
      return b.timestamp - a.timestamp;
    });
  }, [activeLoans]);

  // Helper to automatically calculate the last unfilled player's value so round sums to 0
  const recomputeAutoLast = (
    currentInputs: Record<string, { sign: '+' | '-'; val: string; isAuto?: boolean }>,
    players: GamePlayer[],
    activeIds?: Set<string>
  ): Record<string, { sign: '+' | '-'; val: string; isAuto?: boolean }> => {
    const nextInputs: Record<string, { sign: '+' | '-'; val: string; isAuto?: boolean }> = { ...currentInputs };
    const eligiblePlayers = activeIds ? players.filter((p) => activeIds.has(p.id)) : players;

    // Players with a manually entered non-empty value
    const manualPlayers = eligiblePlayers.filter((p) => {
      const item = nextInputs[p.id];
      return item && !item.isAuto && item.val !== undefined && item.val.trim() !== '';
    });

    // Players that are either empty or currently marked as auto-calculated
    const unfilledPlayers = eligiblePlayers.filter((p) => {
      const item = nextInputs[p.id];
      return !item || item.isAuto || !item.val || item.val.trim() === '';
    });

    // If exactly 1 player is left unfilled and at least 1 other player has a value
    if (eligiblePlayers.length >= 2 && manualPlayers.length === eligiblePlayers.length - 1 && unfilledPlayers.length === 1) {
      const lastPlayer = unfilledPlayers[0];

      let sum = 0;
      manualPlayers.forEach((p) => {
        const item = nextInputs[p.id];
        const num = parseFloat(item?.val || '0') || 0;
        sum += item?.sign === '-' ? -num : num;
      });

      const needed = -sum;
      const targetSign: '+' | '-' = needed >= 0 ? '+' : '-';
      let absVal = Math.round(Math.abs(needed) * 100) / 100;

      const lastPlayerStat = playerStats.find((s) => s.id === lastPlayer.id);
      const lastMaxLoss = Math.max(0, lastPlayerStat ? lastPlayerStat.currentBalance : (lastPlayer.initialBuyIn || 0));

      // Auto-calculate cannot take balance negative
      if (targetSign === '-' && absVal > lastMaxLoss) {
        absVal = lastMaxLoss;
      }

      nextInputs[lastPlayer.id] = {
        sign: targetSign,
        val: String(absVal),
        isAuto: true,
      };
    } else {
      // If not in the single unfilled player state, clear any previously auto-calculated player
      players.forEach((p) => {
        if (nextInputs[p.id]?.isAuto) {
          nextInputs[p.id] = {
            sign: nextInputs[p.id]?.sign || '+',
            val: '',
            isAuto: false,
          };
        }
      });
    }

    return nextInputs;
  };

  // Round Input Handling
  const handleOpenRoundModal = () => {
    if (!sheet) return;
    const initialInputs: Record<string, { sign: '+' | '-'; val: string; isAuto?: boolean }> = {};
    const allPlayerIds = new Set(sheet.players.map((p) => p.id));
    sheet.players.forEach((p) => {
      // Default sign is '-' for losses
      initialInputs[p.id] = { sign: '-', val: '', isAuto: false };
    });
    // Requirement: initial selected state while adding new record is always all for all players
    setParticipatingPlayerIds(allPlayerIds);
    setRoundModalError('');
    setExceededLossPlayerIds(new Set());
    setRoundInputs(initialInputs);
    setIsRecordingRound(true);
  };

  const togglePlayerParticipation = (playerId: string) => {
    const nextActive = new Set(participatingPlayerIds);
    if (nextActive.has(playerId)) {
      nextActive.delete(playerId);
    } else {
      nextActive.add(playerId);
    }
    setParticipatingPlayerIds(nextActive);
    setRoundInputs((prev) => recomputeAutoLast(prev, sheet?.players || [], nextActive));
  };

  const handleToggleSelectAll = () => {
    if (!sheet) return;
    if (participatingPlayerIds.size === sheet.players.length) {
      setParticipatingPlayerIds(new Set());
    } else {
      const all = new Set(sheet.players.map((p) => p.id));
      setParticipatingPlayerIds(all);
      setRoundInputs((prev) => recomputeAutoLast(prev, sheet.players, all));
    }
  };

  const handleInputChange = (playerId: string, rawVal: string) => {
    let clean = rawVal.trim();
    let currentSign = roundInputs[playerId]?.sign || '-';

    if (clean.startsWith('-')) {
      currentSign = '-';
      clean = clean.replace(/^-+/, '');
    } else if (clean.startsWith('+')) {
      currentSign = '+';
      clean = clean.replace(/^\++/, '');
    }

    clean = clean.replace(/[^0-9.]/g, '');

    const playerStat = playerStats.find((s) => s.id === playerId);
    const maxAllowedLoss = Math.max(0, playerStat ? playerStat.currentBalance : (sheet?.players.find(p => p.id === playerId)?.initialBuyIn || 0));

    // Enforcement: No player can go into negative balance! Remind max limit if higher value is entered
    let numVal = parseFloat(clean) || 0;
    if (currentSign === '-' && numVal > maxAllowedLoss) {
      clean = String(maxAllowedLoss);
      setExceededLossPlayerIds((prev) => new Set(prev).add(playerId));
      setRoundModalError(`⚠️ ${playerStat?.name || 'Player'} cannot lose more than balance (${maxAllowedLoss}). Max loss applied.`);
    } else {
      setExceededLossPlayerIds((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
      setRoundModalError('');
    }

    setRoundInputs((prev) => {
      const updated = {
        ...prev,
        [playerId]: {
          sign: currentSign,
          val: clean,
          isAuto: false, // User typed manually
        },
      };
      return recomputeAutoLast(updated, sheet?.players || [], participatingPlayerIds);
    });
  };

  // Open number pad immediately on clicking + or -
  const handleSetSignAndFocus = (playerId: string, sign: '+' | '-') => {
    const playerStat = playerStats.find((s) => s.id === playerId);
    const maxAllowedLoss = Math.max(0, playerStat ? playerStat.currentBalance : (sheet?.players.find(p => p.id === playerId)?.initialBuyIn || 0));

    let currentVal = roundInputs[playerId]?.val || '';
    let numVal = parseFloat(currentVal) || 0;
    if (sign === '-' && numVal > maxAllowedLoss) {
      currentVal = String(maxAllowedLoss);
      setExceededLossPlayerIds((prev) => new Set(prev).add(playerId));
      setRoundModalError(`⚠️ ${playerStat?.name || 'Player'} cannot lose more than balance (${maxAllowedLoss}). Max loss applied.`);
    } else {
      setExceededLossPlayerIds((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }

    setRoundInputs((prev) => {
      const updated = {
        ...prev,
        [playerId]: {
          sign,
          val: currentVal,
          isAuto: false,
        },
      };
      return recomputeAutoLast(updated, sheet?.players || [], participatingPlayerIds);
    });

    // Programmatically focus input so mobile virtual numeric keyboard appears instantly
    setTimeout(() => {
      const el = document.getElementById(`round-input-${playerId}`) as HTMLInputElement | null;
      if (el) {
        el.focus();
        if (el.value) {
          el.setSelectionRange(el.value.length, el.value.length);
        }
      }
    }, 20);
  };

  const toggleSign = (playerId: string) => {
    const nextSign = roundInputs[playerId]?.sign === '-' ? '+' : '-';
    handleSetSignAndFocus(playerId, nextSign);
  };

  // Auto-balance button: sets this player's value so that total table round net sum becomes 0
  const handleAutoBalance = (targetPlayerId: string) => {
    if (!sheet) return;
    let othersSum = 0;
    sheet.players.forEach((p) => {
      if (p.id !== targetPlayerId && participatingPlayerIds.has(p.id)) {
        const item = roundInputs[p.id];
        if (item && item.val) {
          const num = parseFloat(item.val) || 0;
          othersSum += item.sign === '-' ? -num : num;
        }
      }
    });

    let needed = -othersSum;
    let targetSign: '+' | '-' = needed >= 0 ? '+' : '-';
    let targetValNum = Math.abs(Math.round(needed * 100) / 100);

    const targetStat = playerStats.find((s) => s.id === targetPlayerId);
    const maxLoss = Math.max(0, targetStat ? targetStat.currentBalance : 0);
    if (targetSign === '-' && targetValNum > maxLoss) {
      targetValNum = maxLoss;
      setRoundModalError(`⚠️ ${targetStat?.name || 'Player'} cannot lose more than their balance (${maxLoss}).`);
    }

    setRoundInputs((prev) => ({
      ...prev,
      [targetPlayerId]: { sign: targetSign, val: targetValNum === 0 ? '' : String(targetValNum), isAuto: true },
    }));
  };

  const handleClearAllRoundInputs = () => {
    if (!sheet) return;
    const resetInputs: Record<string, { sign: '+' | '-'; val: string; isAuto?: boolean }> = {};
    sheet.players.forEach((p) => {
      resetInputs[p.id] = { sign: '-', val: '', isAuto: false };
    });
    setRoundModalError('');
    setExceededLossPlayerIds(new Set());
    setRoundInputs(resetInputs);
  };

  // Compute table round net sum for zero-sum check
  const roundNetSum = useMemo(() => {
    if (!sheet || !isRecordingRound) return 0;
    let sum = 0;
    sheet.players.forEach((p) => {
      if (participatingPlayerIds.has(p.id)) {
        const item = roundInputs[p.id];
        if (item && item.val) {
          const num = parseFloat(item.val) || 0;
          sum += item.sign === '-' ? -num : num;
        }
      }
    });
    return Math.round(sum * 100) / 100;
  }, [sheet, isRecordingRound, roundInputs, participatingPlayerIds]);

  const handleSaveRound = () => {
    if (!sheet) return;

    // Strict zero-sum enforcement: submit round not possible without net sum balance 0
    if (roundNetSum !== 0) {
      return;
    }

    // Validation: make sure no player goes into negative balance
    for (const p of sheet.players) {
      if (participatingPlayerIds.has(p.id)) {
        const item = roundInputs[p.id];
        if (item && item.val && item.sign === '-') {
          const loss = parseFloat(item.val) || 0;
          const currentBal = playerStats.find((s) => s.id === p.id)?.currentBalance ?? p.initialBuyIn;
          if (loss > currentBal) {
            setRoundModalError(`Cannot submit: ${p.name} cannot lose ${loss}. Current balance is ${currentBal}. Balance cannot be negative.`);
            return;
          }
        }
      }
    }

    const diffs: Record<string, number> = {};
    sheet.players.forEach((p) => {
      if (participatingPlayerIds.has(p.id)) {
        const item = roundInputs[p.id];
        if (item && item.val) {
          const num = parseFloat(item.val) || 0;
          diffs[p.id] = item.sign === '-' ? -num : num;
        } else {
          diffs[p.id] = 0;
        }
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
      setLoanActivePlayerCardId(defaultBorrowerOrLenderId);
    } else {
      setLoanLenderId(sheet.players[0]?.id || '');
      setLoanBorrowerId(sheet.players[1]?.id || '');
      setLoanActivePlayerCardId(null);
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
      setLoanError('Please enter a valid loan amount greater than 0.');
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
      repaidAmount: 0,
      repayments: [],
    };

    const existingLoans = sheet.loans || [];
    const updatedSheet: GameScoresheet = {
      ...sheet,
      updatedAt: Date.now(),
      loans: [...existingLoans, newLoan],
    };

    saveSheet(updatedSheet);
    setIsLoanModalOpen(false);
    setLoanActivePlayerCardId(null);
  };

  // Open Return Loan modal for a player who took a loan
  const handleOpenReturnLoan = (playerId: string, defaultLoanId?: string) => {
    if (!sheet) return;
    if (defaultLoanId && returnLoanSelectedLoanId === defaultLoanId) {
      setReturnLoanSelectedLoanId('');
      setReturnLoanPlayerId(null);
      setReturnLoanError('');
      return;
    }
    const playerDebts = (sheet.loans || []).filter((l) => {
      const rem = l.settled ? 0 : Math.max(0, l.amount - (l.repaidAmount || 0));
      return l.borrowerId === playerId && rem > 0;
    });

    if (playerDebts.length === 0) return;

    const chosenLoan = (defaultLoanId ? playerDebts.find((l) => l.id === defaultLoanId) : null) || playerDebts[0];
    const remaining = Math.max(0, chosenLoan.amount - (chosenLoan.repaidAmount || 0));

    setShowLoansSection(true);
    setReturnLoanPlayerId(playerId);
    setReturnLoanSelectedLoanId(chosenLoan.id);
    setReturnLoanAmount(String(remaining));
    setReturnLoanTransferChips(chosenLoan.transferChips);
    setReturnLoanError('');
  };

  // Execute Return Loan transaction
  const handleExecuteReturnLoan = () => {
    if (!sheet || !returnLoanSelectedLoanId) return;

    const loan = (sheet.loans || []).find((l) => l.id === returnLoanSelectedLoanId);
    if (!loan) {
      setReturnLoanError('Selected loan not found.');
      return;
    }

    const currentRepaid = loan.repaidAmount || 0;
    const remainingDebt = Math.max(0, loan.amount - currentRepaid);
    const amt = parseFloat(returnLoanAmount);

    if (!amt || amt <= 0) {
      setReturnLoanError('Please enter a valid return amount greater than 0.');
      return;
    }

    if (amt > remainingDebt) {
      setReturnLoanError(`Cannot return more than remaining debt (${remainingDebt} pts).`);
      return;
    }

    // If transferring chips back, ensure borrower has enough balance on table
    if (returnLoanTransferChips) {
      const borrowerStat = playerStats.find((s) => s.id === loan.borrowerId);
      if (borrowerStat && amt > borrowerStat.currentBalance) {
        setReturnLoanError(`Borrower only has ${borrowerStat.currentBalance} chips on table. Adjust return amount or uncheck table transfer.`);
        return;
      }
    }

    const newRepayment: GameLoanRepayment = {
      id: 'repay_' + Date.now(),
      loanId: loan.id,
      amount: amt,
      timestamp: Date.now(),
      transferChips: returnLoanTransferChips,
    };

    const nextRepaidAmount = currentRepaid + amt;
    const isNowSettled = nextRepaidAmount >= loan.amount;

    const updatedLoans = (sheet.loans || []).map((l) => {
      if (l.id === loan.id) {
        return {
          ...l,
          repaidAmount: nextRepaidAmount,
          settled: isNowSettled,
          repayments: [...(l.repayments || []), newRepayment],
        };
      }
      return l;
    });

    const updatedSheet: GameScoresheet = {
      ...sheet,
      updatedAt: Date.now(),
      loans: updatedLoans,
    };

    saveSheet(updatedSheet);
    setReturnLoanPlayerId(null);
    setReturnLoanSelectedLoanId('');
    setReturnLoanAmount('');
    setReturnLoanError('');
  };

  const handleToggleSettleLoan = (loanId: string) => {
    if (!sheet || !sheet.loans) return;
    const updatedLoans = sheet.loans.map((l) => {
      if (l.id === loanId) {
        const nextSettled = !l.settled;
        const currentRepaid = l.repaidAmount || 0;
        const remaining = Math.max(0, l.amount - currentRepaid);
        let updatedRepayments = l.repayments || [];

        // If manually marking settled while debt remained, log the closing repayment transaction
        if (nextSettled && remaining > 0) {
          updatedRepayments = [
            ...updatedRepayments,
            {
              id: 'repay_' + Date.now(),
              loanId: l.id,
              amount: remaining,
              timestamp: Date.now(),
              transferChips: l.transferChips,
            },
          ];
        }

        return {
          ...l,
          settled: nextSettled,
          repaidAmount: nextSettled ? l.amount : currentRepaid,
          repayments: updatedRepayments,
        };
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
    if (!sheet || sheet.players.length >= 20) return;
    const name = newPlayerName.trim() || `Player ${sheet.players.length + 1}`;
    const buyIn = Number(newPlayerBuyIn) || 5000;

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
    const activeUnsettled = (sheet.loans || []).filter((l) => {
      const rem = l.settled ? 0 : Math.max(0, l.amount - (l.repaidAmount || 0));
      return rem > 0;
    });

    const lines = [
      `🎯 BRH GAME NIGHT - SESSION SCORES 🎯`,
      `Rounds: ${sheet.rounds.length} | Total Pool: ${totalChipsInPlay} pts`,
      `---------------------------------`,
      ...playerStats.map((p, idx) => {
        const signStr = p.netProfitLoss >= 0 ? `+${p.netProfitLoss}` : `-${Math.abs(p.netProfitLoss)}`;
        let extra = '';
        if (p.totalDebtOwed > 0) extra += ` (Owes ${p.totalDebtOwed} pts)`;
        if (p.totalLentPending > 0) extra += ` (Lent ${p.totalLentPending} pts)`;
        return `${idx + 1}. ${p.name}: ${p.currentBalance} pts [P/L: ${signStr}] (Base: ${p.totalBuyIn} pts)${extra}`;
      }),
      `---------------------------------`,
      ...(activeUnsettled.length > 0
        ? [
          `🤝 Active Debts to Settle:`,
          ...activeUnsettled.map((l) => {
            const rem = Math.max(0, l.amount - (l.repaidAmount || 0));
            const part = l.repaidAmount && l.repaidAmount > 0 ? ` (${l.repaidAmount}/${l.amount} pts returned)` : '';
            return `• ${l.borrowerName} owes ${l.lenderName}: ${rem} pts${part}`;
          }),
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
  // ==========================================
  // ==========================================
  // VIEW A: LOCKED GATE (Inconspicuous & Minimal)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="rounded-xl p-2.5 sm:p-3 border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/40 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Recreation Ledger
              </span>
              <span className="text-[11px] text-slate-400 ml-1.5 hidden sm:inline">
                • Passcode required
              </span>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex items-center space-x-1.5">
            <div className="relative">
              <input
                id="games-ledger-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Passcode..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError('');
                }}
                className="w-32 sm:w-36 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-7"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            <button
              id="games-ledger-unlock-btn"
              type="submit"
              className="px-3 py-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1 shrink-0 cursor-pointer transition-colors"
            >
              <Unlock className="w-3 h-3" />
              <span>Unlock</span>
            </button>
          </form>
        </div>

        {authError && (
          <div className="mt-1.5 text-rose-500 text-xs font-medium flex items-center space-x-1 animate-in fade-in">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{authError}</span>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW B: SETUP FORM (No Active Scoresheet)
  // ==========================================
  if (!sheet) {
    const totalSetupPot = setupPlayers.reduce((sum, p) => sum + (Number(p.buyIn) || 0), 0);

    return (
      <div className="rounded-2xl p-3 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 shadow-lg backdrop-blur-sm space-y-3.5 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight">
                  Recreation Ledger
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                  Setup
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure table seats, starting chip stacks & roster
              </p>
            </div>
          </div>
          <button
            onClick={handleLock}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Lock Ledger"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        {hasExpiredNotice && (
          <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center space-x-2 shadow-xs">
            <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Previous session expired after 24 hrs. Ready for a new game!</span>
          </div>
        )}

        {/* Quick Configuration Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          {/* Table Seats Selector */}
          <div className="space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>Seats at Table</span>
              </label>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {setupPlayers.length} Seats
              </span>
            </div>

            {/* Stepper & Range Bar */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900/60 px-2 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSetPlayerCount(setupPlayers.length - 1)}
                disabled={setupPlayers.length <= 2}
                className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-black flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Decrease seats"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1 flex items-center px-1">
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={setupPlayers.length}
                  onChange={(e) => handleSetPlayerCount(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                  title="Adjust seats from 2 to 20"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSetPlayerCount(setupPlayers.length + 1)}
                disabled={setupPlayers.length >= 20}
                className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-black flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Increase seats"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Common Presets: Single Row */}
            <div className="grid grid-cols-8 gap-1">
              {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSetPlayerCount(num)}
                  className={`py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer text-center ${setupPlayers.length === num
                    ? 'bg-indigo-600 text-white shadow-xs font-black ring-1 ring-indigo-400'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  title={`${num} Seats`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Starting Stack & Quick Presets */}
          <div className="space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>Default Stack</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                Starting Chips (pts)
              </span>
            </div>

            {/* Presets in a clean single row: 4 columns */}
            <div className="grid grid-cols-4 gap-1">
              {[2000, 3000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setDefaultBuyIn(preset);
                    setSetupPlayers(setupPlayers.map((p) => ({ ...p, buyIn: preset })));
                  }}
                  className={`py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer text-center ${defaultBuyIn === preset
                    ? 'bg-amber-500 text-white shadow-xs font-black ring-1 ring-amber-400'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                    }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom Stack Input + Sync All Button */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <input
                type="number"
                min="0"
                step="50"
                value={defaultBuyIn}
                onChange={(e) => setDefaultBuyIn(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 min-w-0 px-2 py-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white text-right focus:outline-none"
                placeholder="5000"
              />
              <span className="text-[11px] font-bold text-slate-400 pr-1 shrink-0">pts</span>
              <button
                type="button"
                onClick={() => {
                  handleApplyDefaultBuyIn();
                  setApplyAllSuccess(true);
                  setTimeout(() => setApplyAllSuccess(false), 1500);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 ${applyAllSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                title="Apply default stack to all players"
              >
                {applyAllSuccess ? 'Synced ✓' : 'Sync All'}
              </button>
            </div>
          </div>
        </div>

        {/* Player Roster Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Player Roster ({setupPlayers.length} Seats)</span>
            <span className="text-slate-400">Starting Chips</span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {setupPlayers.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center space-x-2.5 p-2 sm:p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0">
                  #{idx + 1}
                </div>
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
                  className="flex-1 min-w-0 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center space-x-1.5 shrink-0">
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
                    className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-slate-900 dark:text-white text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-bold text-slate-400">pts</span>
                </div>
                {setupPlayers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSetupPlayer(player.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0 cursor-pointer"
                    title="Remove seat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions & Pool Preview */}
        <div className="pt-1.5 space-y-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400 font-semibold">
            <span>Pool Preview:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {setupPlayers.length} Seats • <strong className="text-indigo-600 dark:text-indigo-400 font-black">{totalSetupPot} pts</strong> Total
            </span>
          </div>

          <div className="flex items-center gap-2">
            {setupPlayers.length < 20 && (
              <button
                type="button"
                onClick={handleAddSetupPlayer}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Seat ({setupPlayers.length})</span>
              </button>
            )}

            <button
              id="games-ledger-start-game-btn"
              type="button"
              onClick={handleStartGame}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer touch-spring"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Table ({totalSetupPot} pts)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW C: ACTIVE SCORESHEET IN PROGRESS
  // ==========================================
  return (
    <div
      ref={ledgerContainerRef}
      className="relative rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs space-y-2.5 overflow-hidden"
    >
      {/* Invisible backdrop to dismiss balance record popover on tap anywhere */}
      {activeDropdownPlayerId && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setActiveDropdownPlayerId(null)}
        />
      )}

      {/* Top Banner & Compact Action Controls - TWO LINES, COMPACT VERTICALLY */}
      <div className="space-y-1.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Line 1: Title & Session Info */}
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Dices className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight truncate">
              Recreation Ledger
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
              R{sheet.rounds.length}
            </span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? 'Expand Scoresheet' : 'Minimize Scoresheet'}
            aria-label={isCollapsed ? 'Expand Scoresheet' : 'Minimize Scoresheet'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Line 2: Action Controls Toolbar */}
        <div className="flex items-center justify-between gap-1 min-w-0">
          <div className="flex items-center space-x-1 shrink-0">
            {sheet.players.length < 20 && (
              <button
                onClick={() => {
                  setNewPlayerName(`Player ${sheet.players.length + 1}`);
                  setNewPlayerBuyIn(sheet.players[0]?.initialBuyIn || 5000);
                  setIsAddPlayerModalOpen(!isAddPlayerModalOpen);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${isAddPlayerModalOpen
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                title="Add Player (up to 20)"
                aria-label="Add Player"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Add Player</span>
              </button>
            )}

            <button
              onClick={() => handleOpenLoanModal()}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors relative flex items-center space-x-1 cursor-pointer ${isLoanModalOpen && !loanActivePlayerCardId
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                : 'text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60'
                }`}
              title="Record Player Loan"
              aria-label="Record Player Loan"
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Loan</span>
              {unsettledLoansCount > 0 && (
                <span className="ml-0.5 px-1 py-0.1 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                  {unsettledLoansCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handleCopySummary}
              className="p-1 sm:px-1.5 sm:py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center space-x-1"
              title="Copy Scores to Clipboard"
              aria-label="Copy Scores"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[11px] font-medium">Share</span>
            </button>

            {/* STAND-OUT NEW GAME / RESET BUTTON */}
            <button
              id="games-ledger-new-sheet-btn"
              onClick={() => setShowConfirmNewSheet(!showConfirmNewSheet)}
              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer shadow-xs"
              title="Reset / Start New Session"
              aria-label="Start New Session"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="text-[11px]">Reset</span>
            </button>

            <button
              onClick={handleLock}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Lock Ledger"
              aria-label="Lock Ledger"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {copiedToast && (
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center animate-in fade-in">
          Scores copied to clipboard! Ready to share 🎯
        </div>
      )}

      {/* In-Place Reset Warning: directly over the ledger UI under the toolbar */}
      {showConfirmNewSheet && (
        <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 space-y-1.5 animate-in fade-in slide-in-from-top-1 shadow-sm">
          <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <h4 className="font-bold text-xs sm:text-sm">Start New Session?</h4>
          </div>
          <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-tight">
            Current player balances, round history, and loan records will be permanently reset.
          </p>
          <div className="flex items-center space-x-2 pt-0.5">
            <button
              type="button"
              onClick={() => setShowConfirmNewSheet(false)}
              className="flex-1 py-1 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Keep Current
            </button>
            <button
              id="games-ledger-confirm-new-sheet-btn"
              type="button"
              onClick={handleResetToNewSheet}
              className="flex-1 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Yes, Start New
            </button>
          </div>
        </div>
      )}

      {/* In-Place Add Late Player Panel: directly under toolbar */}
      {isAddPlayerModalOpen && (
        <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white space-y-2 animate-in fade-in slide-in-from-top-1 shadow-sm">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center space-x-1.5">
              <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-xs sm:text-sm">Add Late Player ({sheet.players.length})</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsAddPlayerModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Player Name:</label>
              <input
                type="text"
                placeholder="e.g. Siddharth"
                value={newPlayerName}
                maxLength={30}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Starting Stack (pts):</label>
              <input
                type="number"
                min="0"
                step="50"
                value={newPlayerBuyIn}
                onChange={(e) => setNewPlayerBuyIn(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-0.5">
            <button
              type="button"
              onClick={() => setIsAddPlayerModalOpen(false)}
              className="flex-1 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddLatePlayer}
              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Add Player
            </button>
          </div>
        </div>
      )}

      {/* In-Place Player Loan Panel: directly under toolbar when triggered from top toolbar */}
      {isLoanModalOpen && !loanActivePlayerCardId && (
        <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50/70 dark:bg-slate-900/90 border border-amber-300 dark:border-amber-700/70 space-y-2 animate-in fade-in slide-in-from-top-1 shadow-sm">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-1.5">
              <HandCoins className="w-3.5 h-3.5 text-amber-500" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Record Player Loan
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLoanModalOpen(false);
                setLoanActivePlayerCardId(null);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                Lender (Giving):
              </label>
              <select
                value={loanLenderId}
                onChange={(e) => setLoanLenderId(e.target.value)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
              >
                {sheet.players.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === loanBorrowerId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                Borrower (Receiving):
              </label>
              <select
                value={loanBorrowerId}
                onChange={(e) => setLoanBorrowerId(e.target.value)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
              >
                {sheet.players.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === loanLenderId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
              Points:
            </label>
            <input
              type="number"
              min="10"
              step="50"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-slate-900 dark:text-white"
            />
          </div>

          <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={loanTransferChips}
              onChange={(e) => setLoanTransferChips(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span className="text-[11px]">Transfer chips between table balances</span>
          </label>

          {loanError && (
            <div className="text-rose-500 text-xs font-bold animate-in fade-in">
              {loanError}
            </div>
          )}

          <div className="flex space-x-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setIsLoanModalOpen(false);
                setLoanActivePlayerCardId(null);
              }}
              className="flex-1 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleCreateLoan();
                setLoanActivePlayerCardId(null);
              }}
              className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Confirm Loan
            </button>
          </div>
        </div>
      )}

      {/* When Collapsed: Minimal Inconspicuous 1-line Summary */}
      {isCollapsed ? (
        <div className="flex items-center justify-between text-xs py-1 px-1 text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2.5">
            <span>Pool: <strong className="text-slate-800 dark:text-slate-200">{totalChipsInPlay} pts</strong></span>
            <span>•</span>
            <span>Players: <strong className="text-slate-800 dark:text-slate-200">{sheet.players.length}</strong></span>
            <span>•</span>
            <span>Rounds: <strong className="text-slate-800 dark:text-slate-200">{sheet.rounds.length}</strong></span>
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline text-xs flex items-center space-x-1 cursor-pointer"
          >
            <span>View Board</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <>
          {/* Summary KPI Strip - Minimal Strip */}
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-center">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pool
              </div>
              <div className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                {totalChipsInPlay} pts
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Players
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                {sheet.players.length}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Leader
              </div>
              <div className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 truncate mt-0.5">
                👑 {playerStats.find((p) => p.currentBalance === highestBalance && p.netProfitLoss > 0)?.name || 'N/A'}
              </div>
            </div>
          </div>

          {/* COMPACT RECORD ROUND BUTTON & IN-PLACE ROUND RECORDING */}
          {isRecordingRound ? (
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-indigo-300 dark:border-indigo-700/60 shadow-sm space-y-2 animate-in fade-in slide-in-from-top-1">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Record Round #{sheet.rounds.length + 1}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleClearAllRoundInputs}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecordingRound(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Enter profit (+) or loss (-) per player. Blank defaults to 0.
              </p>

              {/* Participating Players Control Bar (All selected by default) */}
              <div className="flex items-center justify-between text-[11px] px-0.5">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  Participating ({participatingPlayerIds.size}/{sheet.players.length} players)
                </span>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {participatingPlayerIds.size === sheet.players.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Players Round Input List - COMPACT SINGLE-ROW PREVENTS TEXT WRAPPING */}
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {sheet.players.map((player) => {
                  const isParticipating = participatingPlayerIds.has(player.id);
                  // Default sign is '-'
                  const item = roundInputs[player.id] || { sign: '-', val: '', isAuto: false };
                  const isPositive = item.sign === '+';
                  const playerStat = playerStats.find((s) => s.id === player.id);
                  const currentBal = playerStat?.currentBalance ?? player.initialBuyIn;
                  const maxAllowedLoss = Math.max(0, currentBal);
                  const isExceeded = exceededLossPlayerIds.has(player.id);

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all gap-2 ${!isParticipating
                        ? 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/50 opacity-50'
                        : item.isAuto
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60'
                        }`}
                    >
                      {/* Left: Participation Checkbox + Name & Balance in single line */}
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => togglePlayerParticipation(player.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer ${isParticipating
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-transparent border border-slate-300 dark:border-slate-600'
                            }`}
                          title={isParticipating ? 'Participating (tap to sit out)' : 'Sitting out (tap to participate)'}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5 flex-nowrap truncate">
                            <span
                              className={`font-bold text-xs sm:text-sm whitespace-nowrap truncate ${isParticipating ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 line-through'
                                }`}
                            >
                              {player.name}
                            </span>
                            {item.isAuto && isParticipating && (
                              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded shrink-0 animate-pulse">
                                Auto
                              </span>
                            )}
                          </div>
                          {/* Show ONLY balance normally. Show max loss ONLY if entered loss exceeds max */}
                          <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1.5 whitespace-nowrap mt-0.5">
                            <span>Bal: {currentBal}</span>
                            {isExceeded && isParticipating && (
                              <span className="text-rose-600 dark:text-rose-400 font-bold text-[10px] whitespace-nowrap animate-in fade-in">
                                ⚠️ Max loss: {maxAllowedLoss}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Compact +/- and numeric input */}
                      {isParticipating ? (
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {/* Compact Sign Selection Pill */}
                          <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetSignAndFocus(player.id, '+')}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md font-black text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${isPositive
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400'
                                }`}
                              title="Profit (+)"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetSignAndFocus(player.id, '-')}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md font-black text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${!isPositive
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400'
                                }`}
                              title="Loss (-)"
                            >
                              –
                            </button>
                          </div>

                          {/* Compact Input */}
                          <div className="relative shrink-0">
                            <input
                              id={`round-input-${player.id}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              autoComplete="off"
                              placeholder={item.isAuto ? 'Auto' : '0'}
                              value={item.val}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleInputChange(player.id, e.target.value)}
                              className={`w-16 sm:w-20 h-7 sm:h-8 px-2 text-xs sm:text-sm font-bold rounded-lg border focus:outline-none focus:ring-1 text-right transition-colors ${isPositive
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 focus:ring-emerald-500'
                                : 'bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 focus:ring-rose-500'
                                }`}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 italic px-2 py-1 shrink-0">
                          Sit out (0)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Table Zero-Sum Indicator */}
              <div
                className={`p-2 sm:p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${roundNetSum === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
              >
                <span className="flex items-center space-x-1.5 shrink-0">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Round Net:</span>
                </span>
                <span className="truncate ml-1 font-black">
                  {roundNetSum === 0
                    ? '0 (Zero-Sum Balanced ✓)'
                    : `${roundNetSum > 0 ? '+' : ''}${roundNetSum} pts (Must be 0 to submit)`}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsRecordingRound(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="games-ledger-submit-round-btn"
                  type="button"
                  disabled={roundNetSum !== 0}
                  onClick={handleSaveRound}
                  title={roundNetSum === 0 ? 'Submit Round' : 'Table round net must equal 0 before submitting'}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${roundNetSum === 0
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm cursor-pointer touch-spring'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                    }`}
                >
                  {roundNetSum === 0 ? 'Submit Round' : `Unbalanced (${roundNetSum > 0 ? '+' : ''}${roundNetSum})`}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* COMPACT RECORD ROUND BUTTON */}
              <div className="pt-0.5">
                <button
                  id="games-ledger-record-round-btn"
                  type="button"
                  onClick={handleOpenRoundModal}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center space-x-1.5 transition-all touch-spring cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Round #{sheet.rounds.length + 1}</span>
                </button>
              </div>

              {/* ========================================================================= */}
              {/* Main Players Balance Cards - CLEAN SCORECARD (WITHOUT 'PTS')               */}
              {/* ========================================================================= */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Seat & Player Name</span>
                  <span>Balance</span>
                </div>

                <div className="space-y-1.5">
                  {playerStats.map((player, seatIdx) => {
                    const isLeader = highestBalance > player.totalBuyIn && player.currentBalance === highestBalance;
                    const isProfit = player.netProfitLoss > 0;
                    const isLoss = player.netProfitLoss < 0;
                    const isEditing = editingPlayerId === player.id;
                    const isDropdownOpen = activeDropdownPlayerId === player.id;

                    // Last 5 recorded rounds for this player
                    const last5Rounds = sheet.rounds.slice(-5).reverse();

                    return (
                      <div
                        key={player.id}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all space-y-1.5 shadow-sm ${isLeader
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/70'
                          : 'bg-white/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/70'
                          }`}
                      >
                        {/* Row 1: Player Name & Balance (NO 'PTS' ON SCORECARD) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                              #{seatIdx + 1}
                            </span>

                            {/* Interactive Player Name - Tap to enter edit mode */}
                            {isEditing ? (
                              <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                                <input
                                  type="text"
                                  ref={(input) => {
                                    if (input) {
                                      input.focus();
                                      input.select();
                                    }
                                  }}
                                  value={editPlayerNameInput}
                                  maxLength={30}
                                  onChange={(e) => setEditPlayerNameInput(e.target.value)}
                                  className="flex-1 min-w-0 px-2 py-1 bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg text-sm font-bold text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                  autoFocus
                                  onFocus={(e) => e.target.select()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(player.id);
                                    if (e.key === 'Escape') setEditingPlayerId(null);
                                  }}
                                  onBlur={() => handleSaveRename(player.id)}
                                />
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSaveRename(player.id);
                                  }}
                                  onTouchStart={(e) => {
                                    e.preventDefault();
                                    handleSaveRename(player.id);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                                  title="Save Name"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setEditingPlayerId(null);
                                  }}
                                  onTouchStart={(e) => {
                                    e.preventDefault();
                                    setEditingPlayerId(null);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center shrink-0 cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPlayerId(player.id);
                                  setEditPlayerNameInput(player.name);
                                }}
                                className="group/name inline-flex items-center gap-1.5 px-1 py-0.5 -ml-1 rounded-md hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors text-left cursor-pointer max-w-[200px] sm:max-w-xs"
                                title="Tap to rename player"
                              >
                                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight group-hover/name:text-indigo-600 dark:group-hover/name:text-indigo-400 transition-colors underline decoration-dotted decoration-slate-400 dark:decoration-slate-500 underline-offset-4 whitespace-nowrap truncate">
                                  {player.name}
                                </span>
                                {isLeader && (
                                  <span title="Table Chip Leader" className="text-xs shrink-0">
                                    👑
                                  </span>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Clean balance without 'pts' + LONG PRESS LAST 5 RECORDS DROPDOWN */}
                          <div className="relative text-right shrink-0">
                            <div
                              role="button"
                              tabIndex={0}
                              title="Long press or tap to view last 5 rounds"
                              onMouseDown={() => startLongPress(player.id)}
                              onMouseUp={cancelLongPress}
                              onMouseLeave={cancelLongPress}
                              onTouchStart={() => startLongPress(player.id)}
                              onTouchEnd={cancelLongPress}
                              onTouchMove={cancelLongPress}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownPlayerId((prev) => (prev === player.id ? null : player.id));
                              }}
                              className="inline-block px-2 py-0.5 -mr-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 active:scale-95 transition-all cursor-pointer select-none"
                            >
                              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                {player.currentBalance}
                              </div>
                            </div>

                            {/* Last 5 Records Dropdown Popover */}
                            {isDropdownOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 z-50 w-52 sm:w-56 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl space-y-1.5 animate-in fade-in zoom-in-95 text-left"
                              >
                                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Last 5 Records
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                                    {player.name}
                                  </span>
                                </div>

                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {sheet.rounds.length === 0 ? (
                                    <div className="py-2 text-center text-xs text-slate-400 font-medium">
                                      No rounds recorded yet
                                    </div>
                                  ) : (
                                    last5Rounds.map((round) => {
                                      const diff = round.diffs[player.id] || 0;
                                      const isPos = diff > 0;
                                      const isNeg = diff < 0;

                                      return (
                                        <div
                                          key={round.id}
                                          className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs"
                                        >
                                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                                            Round #{round.roundNumber}
                                          </span>
                                          <span
                                            className={`font-black flex items-center space-x-0.5 ${isPos
                                              ? 'text-emerald-600 dark:text-emerald-400'
                                              : isNeg
                                                ? 'text-rose-600 dark:text-rose-400'
                                                : 'text-slate-400'
                                              }`}
                                          >
                                            {isPos && <ArrowUp className="w-3 h-3 mr-0.5 inline" />}
                                            {isNeg && <ArrowDown className="w-3 h-3 mr-0.5 inline" />}
                                            {!isPos && !isNeg && <Equal className="w-3 h-3 mr-0.5 inline" />}
                                            <span>{isPos ? `+${diff}` : isNeg ? `-${Math.abs(diff)}` : '0'}</span>
                                          </span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="pt-1 text-[10px] text-center text-slate-400 border-t border-slate-100 dark:border-slate-800">
                                  Tap anywhere to close
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Secondary info & actions */}
                        <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px]">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] whitespace-nowrap">
                              Base: {player.currentBalance}
                              {player.rebuys > 0 && <span className="text-indigo-500 ml-1 text-[9px] sm:text-[10px]">(+{player.rebuys} top-up)</span>}
                              {player.rebuys < 0 && <span className="text-amber-500 ml-1 text-[9px] sm:text-[10px]">(-{Math.abs(player.rebuys)} out)</span>}
                            </span>

                            {/* Net P/L Badge with straight arrows */}
                            <span
                              className={`px-1.5 py-0.5 rounded-full font-bold flex items-center space-x-0.5 text-[10px] sm:text-[11px] whitespace-nowrap ${isProfit
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : isLoss
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                            >
                              {isProfit && <ArrowUp className="w-2.5 h-2.5 mr-0.5" />}
                              {isLoss && <ArrowDown className="w-2.5 h-2.5 mr-0.5" />}
                              {!isProfit && !isLoss && <Equal className="w-2.5 h-2.5 mr-0.5" />}
                              <span>
                                {isProfit ? `+${player.netProfitLoss}` : isLoss ? `-${Math.abs(player.netProfitLoss)}` : '0'}
                              </span>
                            </span>

                            {player.totalDebtOwed > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[9px] sm:text-[10px] whitespace-nowrap">
                                Owes {player.totalDebtOwed}
                              </span>
                            )}
                            {player.totalLentPending > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-[9px] sm:text-[10px] whitespace-nowrap">
                                Lent {player.totalLentPending}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenLoanModal(player.id)}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60 rounded-md font-bold text-[10px] sm:text-[11px] transition-colors flex items-center space-x-1 border cursor-pointer shadow-2xs"
                              title="Loan chips"
                            >
                              <HandCoins className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>Loan</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenTopup(player.id)}
                              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700/60 rounded-md font-bold text-[10px] sm:text-[11px] transition-colors border cursor-pointer shadow-2xs"
                              title="Add top-up chips or cash out"
                            >
                              ±Top-up
                            </button>
                          </div>
                        </div>

                        {/* IN-PLACE TOP-UP / CASH-OUT FORM */}
                        {topupPlayerId === player.id && (
                          <div className="mt-2 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700/70 space-y-2 animate-in fade-in slide-in-from-top-1 shadow-sm">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                Stack Adjustment: {player.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setTopupPlayerId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Toggle Add vs Deduct */}
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => setTopupType('ADD')}
                                className={`py-1 rounded-md transition-all cursor-pointer ${topupType === 'ADD'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                  }`}
                              >
                                + Top-up (Add)
                              </button>
                              <button
                                type="button"
                                onClick={() => setTopupType('DEDUCT')}
                                className={`py-1 rounded-md transition-all cursor-pointer ${topupType === 'DEDUCT'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                  }`}
                              >
                                – Cash-out (Deduct)
                              </button>
                            </div>

                            <div className="flex items-center space-x-2">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">Points:</label>
                              <input
                                type="number"
                                min="10"
                                step="50"
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="flex space-x-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => setTopupPlayerId(null)}
                                className="flex-1 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleExecuteTopup}
                                className={`flex-1 py-1.5 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer ${topupType === 'ADD' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                  }`}
                              >
                                {topupType === 'ADD' ? 'Confirm Top-up' : 'Confirm Cash-out'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* IN-PLACE PLAYER LOAN FORM (when opened from this card) */}
                        {isLoanModalOpen && loanActivePlayerCardId === player.id && (
                          <div className="mt-2 p-2.5 sm:p-3 rounded-xl bg-amber-50/70 dark:bg-slate-900 border border-amber-300 dark:border-amber-700/70 space-y-2 animate-in fade-in slide-in-from-top-1 shadow-sm">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                              <div className="flex items-center space-x-1.5">
                                <HandCoins className="w-3.5 h-3.5 text-amber-500" />
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                  Record Loan for {player.name}
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsLoanModalOpen(false);
                                  setLoanActivePlayerCardId(null);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                                  Lender (Giving):
                                </label>
                                <select
                                  value={loanLenderId}
                                  onChange={(e) => setLoanLenderId(e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                                >
                                  {sheet.players.map((p) => (
                                    <option key={p.id} value={p.id} disabled={p.id === loanBorrowerId}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                                  Borrower (Receiving):
                                </label>
                                <select
                                  value={loanBorrowerId}
                                  onChange={(e) => setLoanBorrowerId(e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                                >
                                  {sheet.players.map((p) => (
                                    <option key={p.id} value={p.id} disabled={p.id === loanLenderId}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                                Points:
                              </label>
                              <input
                                type="number"
                                min="10"
                                step="50"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(e.target.value)}
                                className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-slate-900 dark:text-white"
                              />
                            </div>

                            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={loanTransferChips}
                                onChange={(e) => setLoanTransferChips(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                              />
                              <span className="text-[11px]">Transfer chips between table balances</span>
                            </label>

                            {loanError && (
                              <div className="text-rose-500 text-xs font-bold animate-in fade-in">
                                {loanError}
                              </div>
                            )}

                            <div className="flex space-x-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsLoanModalOpen(false);
                                  setLoanActivePlayerCardId(null);
                                }}
                                className="flex-1 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleCreateLoan();
                                  setLoanActivePlayerCardId(null);
                                }}
                                className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                              >
                                Confirm Loan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

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
              {sortedLoans.map((loan) => {
                const totalRepaid = loan.repaidAmount ?? (loan.repayments ? loan.repayments.reduce((s, r) => s + r.amount, 0) : 0);
                const repaymentsList = loan.repayments || [];

                // COMPACT ROW FOR SETTLED LOANS (MINIMAL VERTICAL SPACE)
                if (loan.settled) {
                  const isExpanded = expandedSettledLoanId === loan.id;
                  return (
                    <div
                      key={loan.id}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/40 text-xs transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-900/70"
                    >
                      <div className="flex items-center justify-between gap-1.5 min-h-[22px]">
                        <div className="flex items-center space-x-1.5 min-w-0 truncate text-[11px] sm:text-xs">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{loan.borrowerName}</span>
                          <span className="text-slate-400 shrink-0 text-[10px]">repaid</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{loan.lenderName}</span>
                          <span className="font-black text-emerald-700 dark:text-emerald-400 shrink-0 font-mono text-[11px]">
                            {loan.amount} pts
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[9px] shrink-0 uppercase tracking-wider">
                            Settled ✓
                          </span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline shrink-0">
                            {new Date(loan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {repaymentsList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedSettledLoanId(isExpanded ? null : loan.id)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                              title="Toggle repayment history"
                            >
                              {repaymentsList.length} tx {isExpanded ? '▲' : '▼'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleSettleLoan(loan.id)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Reopen / unmark settled"
                          >
                            Reopen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLoan(loan.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title="Delete loan record"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && repaymentsList.length > 0 && (
                        <div className="pt-1.5 mt-1 border-t border-slate-200/50 dark:border-slate-800/60 space-y-1 animate-in fade-in">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Repayment History ({repaymentsList.length}):
                          </div>
                          <div className="space-y-0.5 pl-1">
                            {repaymentsList.map((rep) => (
                              <div
                                key={rep.id}
                                className="flex items-center justify-between text-[11px] py-0.5 px-1 rounded bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300"
                              >
                                <span className="flex items-center space-x-1">
                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  <span>Returned <strong className="text-emerald-600 dark:text-emerald-400">{rep.amount} pts</strong></span>
                                  {rep.transferChips && <span className="text-indigo-500 text-[10px]">• Chips transferred</span>}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // ACTIVE / UNSETTLED LOAN CARD
                const remainingDebt = Math.max(0, loan.amount - totalRepaid);
                const isReturnOpen = returnLoanSelectedLoanId === loan.id && remainingDebt > 0;

                // Smart quick repayment options based on remaining loan debt (multiples of 100 or 1000)
                const quickOptions: Array<{ label: string; value: number }> = (() => {
                  if (remainingDebt <= 0) return [];
                  const opts = new Map<number, string>();

                  // Determine base step: 1000 for larger debts (>= 1000), 100 for debts (>= 100)
                  if (remainingDebt >= 1000) {
                    for (let v = 1000; v < remainingDebt; v += 1000) {
                      opts.set(v, String(v));
                    }
                    if (remainingDebt <= 3000 && 500 < remainingDebt) {
                      opts.set(500, '500');
                    }
                  } else if (remainingDebt >= 100) {
                    for (let v = 100; v < remainingDebt; v += 100) {
                      opts.set(v, String(v));
                    }
                  } else {
                    [25, 50].forEach((v) => {
                      if (v < remainingDebt) opts.set(v, String(v));
                    });
                  }

                  if (remainingDebt >= 50) {
                    const half = Math.round(remainingDebt / 2);
                    if (half > 0 && half < remainingDebt) {
                      opts.set(half, `Half (${half})`);
                    }
                  }

                  let list = Array.from(opts.entries())
                    .map(([value, label]) => ({ value, label }))
                    .sort((a, b) => a.value - b.value);

                  if (list.length > 5) {
                    const sampled: typeof list = [];
                    const stepSize = Math.ceil(list.length / 5);
                    for (let i = 0; i < list.length; i += stepSize) {
                      sampled.push(list[i]);
                    }
                    const halfOpt = list.find((o) => o.label.startsWith('Half'));
                    if (halfOpt && !sampled.some((o) => o.value === halfOpt.value)) {
                      sampled.push(halfOpt);
                      sampled.sort((a, b) => a.value - b.value);
                    }
                    list = sampled;
                  }

                  return list;
                })();

                return (
                  <div
                    key={loan.id}
                    className="p-2.5 rounded-xl border text-xs space-y-2 bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1 flex-wrap">
                          <span className="text-rose-600 dark:text-rose-400">{loan.borrowerName}</span>
                          <span className="text-slate-400 font-normal">owes</span>
                          <span className="text-emerald-600 dark:text-emerald-400">{loan.lenderName}</span>
                          <span className="font-black text-amber-700 dark:text-amber-300 ml-1">
                            {remainingDebt} pts remaining
                          </span>
                          {totalRepaid > 0 && (
                            <span className="text-[10px] font-bold text-slate-400">
                              ({totalRepaid}/{loan.amount} returned)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2">
                          <span>{new Date(loan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {loan.transferChips && <span className="text-indigo-500 font-semibold">• Chips transferred</span>}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {remainingDebt > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isReturnOpen) {
                                setReturnLoanSelectedLoanId('');
                                setReturnLoanPlayerId(null);
                                setReturnLoanError('');
                              } else {
                                handleOpenReturnLoan(loan.borrowerId, loan.id);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs cursor-pointer flex items-center space-x-1 transition-all ${isReturnOpen
                              ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            title={isReturnOpen ? 'Close return form' : 'Return this loan'}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{isReturnOpen ? 'Close' : 'Return'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleSettleLoan(loan.id)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer bg-slate-800 hover:bg-slate-900 text-white shadow-xs"
                        >
                          Mark Settled
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Delete / cancel loan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* IN-PLACE RETURN LOAN POPUP FORM (within the Player Loans & Debts menu) */}
                    {isReturnOpen && (
                      <div className="mt-2 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/80 shadow-md space-y-2.5 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100 dark:border-slate-800">
                          <div className="flex items-center space-x-1.5">
                            <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              Return Loan to {loan.lenderName}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReturnLoanSelectedLoanId('');
                              setReturnLoanPlayerId(null);
                              setReturnLoanError('');
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
                          <span>Borrower: <strong className="text-slate-900 dark:text-white font-bold">{loan.borrowerName}</strong></span>
                          <span className="font-black text-amber-700 dark:text-amber-300">
                            {remainingDebt} pts remaining
                          </span>
                        </div>

                        {/* Return Amount Input + Full Button */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-bold text-slate-700 dark:text-slate-300">
                              Return Amount (pts):
                            </label>
                            <span className="text-[11px] text-slate-400">
                              Max: {remainingDebt} pts
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <input
                              type="number"
                              min="1"
                              max={remainingDebt}
                              step={remainingDebt >= 1000 ? '100' : '10'}
                              value={returnLoanAmount}
                              onChange={(e) => setReturnLoanAmount(e.target.value)}
                              className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/80 rounded-lg text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="Enter amount..."
                            />
                            <button
                              type="button"
                              onClick={() => setReturnLoanAmount(String(remainingDebt))}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer shadow-xs"
                              title={`Pay full remaining ${remainingDebt} pts`}
                            >
                              Full ({remainingDebt})
                            </button>
                          </div>

                          {/* Quick Repayment Presets (multiples of 100 or 1000) */}
                          {quickOptions.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick:</span>
                              {quickOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setReturnLoanAmount(String(opt.value))}
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${returnLoanAmount === String(opt.value)
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                                    }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Table Chip Transfer Option */}
                        <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer pt-0.5">
                          <input
                            type="checkbox"
                            checked={returnLoanTransferChips}
                            onChange={(e) => setReturnLoanTransferChips(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                          <span className="text-xs">
                            Transfer chips from table balance back to {loan.lenderName}
                          </span>
                        </label>

                        {/* Error Message */}
                        {returnLoanError && (
                          <div className="p-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg animate-in fade-in">
                            {returnLoanError}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setReturnLoanSelectedLoanId('');
                              setReturnLoanPlayerId(null);
                              setReturnLoanError('');
                            }}
                            className="flex-1 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteReturnLoan}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm Return</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Repayment Transaction History Log */}
                    {repaymentsList.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                          <span>Repayment Transactions ({repaymentsList.length}):</span>
                        </div>
                        <div className="space-y-1 pl-1">
                          {repaymentsList.map((rep) => (
                            <div
                              key={rep.id}
                              className="flex items-center justify-between text-[11px] p-1 rounded bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300"
                            >
                              <span className="flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Returned <strong className="text-emerald-600 dark:text-emerald-400">{rep.amount} pts</strong></span>
                                {rep.transferChips && <span className="text-indigo-500 text-[10px]">• Chips transferred</span>}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${diff > 0
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

      {/* End of ledger */}
    </div>
  );
}

