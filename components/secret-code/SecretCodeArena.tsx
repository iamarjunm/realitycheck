'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Check,
  X,
  Trophy,
  RotateCcw,
  Copy,
  Users,
  Crown,
  Eraser,
  ShieldAlert,
  HelpCircle,
  Send,
  Crosshair,
  Clock,
  Sparkles,
  KeyRound,
  Lightbulb,
  Wand2,
  ArrowLeftRight,
} from 'lucide-react';
import {
  SecretCard,
  CipherRule,
  CardColor,
  CardShape,
  CARD_COLORS,
  CARD_SHAPES,
  COLOR_LABELS,
  SHAPE_LABELS,
  PRIMES,
  computeDeckStats,
  verifySecretCodeGuess,
} from '@/lib/secret-code';
import { playSound } from '@/lib/sounds';
import { CipherCard, COLOR_STYLE_MAP, ShapeGlyph } from './CipherCard';

export interface SecretCodePlayer {
  uid: string;
  nickname: string;
  isBot?: boolean;
  score: number;
  eliminatedThisRound: boolean;
  lastGuess: number[];
}

export interface SecretCodeArenaGame {
  gameId?: string;
  mode: 'solo' | 'multi';
  creatorId: string;
  state: 'waiting' | 'playing' | 'finished';
  phase: 'deducing' | 'round_over';
  round: number;
  totalRounds: number;
  maxPlayers: number;
  cards: SecretCard[];
  rules: CipherRule[];
  secretIndices: number[];
  roundWinnerUid: string | null;
  matchWinnerUids: string[];
  players: SecretCodePlayer[];
}

interface SecretCodeArenaProps {
  game: SecretCodeArenaGame;
  meUid: string | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onJoinRoom?: (nickname: string) => void;
  onStartMatch?: () => void;
  onSubmitGuess: (guessIndices: number[]) => void;
  onNextRound: () => void;
  onPlayAgain: () => void;
  busy?: boolean;
}

const CATEGORY_BADGE: Record<CipherRule['category'], { label: string; cls: string }> = {
  math: { label: 'MATH', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/25' },
  colors_shapes: { label: 'PATTERN', cls: 'text-purple-300 bg-purple-500/10 border-purple-500/25' },
  frequency: { label: 'FREQ', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' },
  position: { label: 'POS', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/25' },
};

export function SecretCodeArena({
  game,
  meUid,
  soundEnabled,
  onToggleSound,
  onExit,
  onJoinRoom,
  onStartMatch,
  onSubmitGuess,
  onNextRound,
  onPlayAgain,
  busy = false,
}: SecretCodeArenaProps) {
  const [slots, setSlots] = useState<(number | null)[]>([null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [crossedIndices, setCrossedIndices] = useState<number[]>([]);
  const [pinnedIndices, setPinnedIndices] = useState<number[]>([]);
  const [checkedRules, setCheckedRules] = useState<string[]>([]);
  const [interactionMode, setInteractionMode] = useState<'pick' | 'cross' | 'pin'>('pick');
  const [filterColor, setFilterColor] = useState<CardColor | null>(null);
  const [filterShape, setFilterShape] = useState<CardShape | null>(null);
  const [hintUsedThisRound, setHintUsedThisRound] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinNickname, setJoinNickname] = useState('');
  const [roundElapsedSec, setRoundElapsedSec] = useState(0);

  const sfx = useCallback(
    (type: Parameters<typeof playSound>[0]) => {
      if (soundEnabled) playSound(type);
    },
    [soundEnabled]
  );

  useEffect(() => {
    setSlots([null, null, null, null]);
    setActiveSlot(0);
    setCrossedIndices([]);
    setPinnedIndices([]);
    setCheckedRules([]);
    setFilterColor(null);
    setFilterShape(null);
    setHintUsedThisRound(false);
    setRoundElapsedSec(0);
  }, [game.round, game.state]);

  useEffect(() => {
    if (game.state !== 'playing' || game.phase !== 'deducing') return;
    const interval = setInterval(() => {
      setRoundElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [game.state, game.phase]);

  const me = game.players.find((p) => p.uid === meUid) || null;
  const isHost = Boolean(meUid && game.creatorId === meUid);

  const deckStats = useMemo(() => computeDeckStats(game.cards), [game.cards]);

  const myGuessVerification = useMemo(() => {
    if (!me || me.lastGuess.length !== 4 || game.cards.length !== 26) return null;
    return verifySecretCodeGuess(me.lastGuess, game.secretIndices, game.cards, game.rules);
  }, [game.cards, game.rules, game.secretIndices, me]);

  const liveTelemetry = useMemo(() => {
    const picked = slots
      .filter((idx): idx is number => idx !== null)
      .map((idx) => game.cards[idx])
      .filter(Boolean);
    if (picked.length === 0) return null;
    const nums = picked.map((c) => c.number);
    const sum = nums.reduce((a, b) => a + b, 0);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const evens = nums.filter((n) => n % 2 === 0).length;
    const primes = nums.filter((n) => PRIMES.has(n)).length;
    const colors = new Set(picked.map((c) => c.color)).size;
    const shapes = new Set(picked.map((c) => c.shape)).size;
    const c1 = slots[0] !== null ? game.cards[slots[0]] : null;
    const c2 = slots[1] !== null ? game.cards[slots[1]] : null;
    const c3 = slots[2] !== null ? game.cards[slots[2]] : null;
    const c4 = slots[3] !== null ? game.cards[slots[3]] : null;
    const prod14 = c1 && c4 ? c1.number * c4.number : null;
    const prod23 = c2 && c3 ? c2.number * c3.number : null;
    return {
      count: picked.length,
      sum,
      minMaxSum: min + max,
      diff: max - min,
      evens,
      primes,
      colors,
      shapes,
      prod14,
      prod23,
    };
  }, [slots, game.cards]);

  const handleCopyCode = () => {
    if (!game.gameId) return;
    navigator.clipboard.writeText(game.gameId);
    sfx('chip');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const toggleCrossOut = (idx: number) => {
    sfx('cross_out');
    setCrossedIndices((prev) =>
      prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
    );
  };

  const togglePin = (idx: number) => {
    sfx('rule_check');
    setPinnedIndices((prev) =>
      prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
    );
  };

  const handleCardClick = (idx: number) => {
    if (game.state !== 'playing' || game.phase !== 'deducing' || !me || me.eliminatedThisRound) {
      return;
    }

    if (interactionMode === 'cross') {
      toggleCrossOut(idx);
      return;
    }

    if (interactionMode === 'pin') {
      togglePin(idx);
      return;
    }

    const existingSlot = slots.indexOf(idx);
    if (existingSlot !== -1) {
      sfx('card_remove');
      const updated = [...slots];
      updated[existingSlot] = null;
      setSlots(updated);
      setActiveSlot(existingSlot);
      return;
    }

    sfx('card_pick');
    const targetSlot = slots[activeSlot] === null ? activeSlot : slots.indexOf(null);
    if (targetSlot !== -1) {
      const updated = [...slots];
      updated[targetSlot] = idx;
      setSlots(updated);
      const nextEmpty = updated.indexOf(null);
      if (nextEmpty !== -1) setActiveSlot(nextEmpty);
    } else {
      const updated = [...slots];
      updated[activeSlot] = idx;
      setSlots(updated);
    }
  };

  const handleClearSlot = (slotIdx: number) => {
    if (game.phase !== 'deducing' || me?.eliminatedThisRound) return;
    setActiveSlot(slotIdx);
    if (slots[slotIdx] !== null) {
      sfx('card_remove');
      const updated = [...slots];
      updated[slotIdx] = null;
      setSlots(updated);
    } else {
      sfx('chip');
    }
  };

  const handleSwapSlots = (slotA: number, slotB: number) => {
    if (game.phase !== 'deducing' || me?.eliminatedThisRound) return;
    sfx('flip');
    setSlots((prev) => {
      const next = [...prev];
      [next[slotA], next[slotB]] = [next[slotB], next[slotA]];
      return next;
    });
  };

  const handleUseHint = () => {
    if (
      game.mode !== 'solo' ||
      hintUsedThisRound ||
      game.phase !== 'deducing' ||
      me?.eliminatedThisRound
    )
      return;

    sfx('hint');
    setHintUsedThisRound(true);
    let targetSlot = 0;
    for (let i = 0; i < 4; i++) {
      if (slots[i] !== game.secretIndices[i]) {
        targetSlot = i;
        break;
      }
    }
    const trueCardIdx = game.secretIndices[targetSlot];
    setSlots((prev) => {
      const cleaned = prev.map((val) => (val === trueCardIdx ? null : val));
      cleaned[targetSlot] = trueCardIdx;
      return cleaned;
    });
    setCrossedIndices((prev) => prev.filter((idx) => idx !== trueCardIdx));
  };

  const handleAutoHighlightSlot = () => {
    sfx('hint');
    const slotShapeRule = game.rules.find(
      (r) => r.type === 'SLOT_SHAPE' && Number(r.params.slot) === activeSlot
    );
    const slotColorRule = game.rules.find(
      (r) => r.type === 'SLOT_COLOR' && Number(r.params.slot) === activeSlot
    );
    if (slotColorRule) {
      setFilterColor(slotColorRule.params.color as CardColor);
    }
    if (slotShapeRule) {
      setFilterShape(slotShapeRule.params.shape as CardShape);
    }
    if (!slotColorRule && !slotShapeRule) {
      setFilterColor(null);
      setFilterShape(null);
    }
  };

  const allSlotsFilled = slots.every((s) => s !== null);

  const handleSubmit = useCallback(() => {
    if (!allSlotsFilled || busy || me?.eliminatedThisRound || game.phase !== 'deducing') return;
    const guess = slots as number[];
    onSubmitGuess(guess);
  }, [allSlotsFilled, busy, game.phase, me?.eliminatedThisRound, onSubmitGuess, slots]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (game.state !== 'playing' || game.phase !== 'deducing' || me?.eliminatedThisRound) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Backspace') {
        for (let i = 3; i >= 0; i--) {
          if (slots[i] !== null) {
            sfx('card_remove');
            const next = [...slots];
            next[i] = null;
            setSlots(next);
            setActiveSlot(i);
            break;
          }
        }
      } else if (e.key === 'Enter' && allSlotsFilled) {
        e.preventDefault();
        handleSubmit();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        setActiveSlot(Number(e.key) - 1);
        sfx('chip');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [allSlotsFilled, game.phase, game.state, handleSubmit, me?.eliminatedThisRound, sfx, slots]);

  const sortedStandings = [...game.players].sort((a, b) => b.score - a.score);
  const roundWinner = game.roundWinnerUid
    ? game.players.find((p) => p.uid === game.roundWinnerUid) || null
    : null;

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#050508] text-white flex flex-col relative">
      {/* Ambient Cyber-Cipher Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-sky-500/[0.05] rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      {/* COMPACT TOP HUD BAR (48px) WITH INLINE PLAYER SCORES */}
      <header className="relative z-20 w-full border-b border-white/10 bg-black/75 backdrop-blur-xl shrink-0">
        <div className="max-w-[1540px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                sfx('chip');
                onExit();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lobby</span>
            </button>
            <span className="text-white/15 hidden sm:inline">|</span>
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="font-black uppercase tracking-tight text-white whitespace-nowrap">
                Secret Order
              </span>
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-300 font-bold tabular-nums whitespace-nowrap">
                R{Math.max(1, game.round)}/{game.totalRounds}
              </span>
            </div>
          </div>

          {game.state !== 'waiting' && (
            <div className="hidden md:flex items-center gap-2 overflow-x-auto">
              {game.players.map((p) => {
                const isMe = p.uid === meUid;
                const isWinner =
                  game.phase === 'round_over' && game.roundWinnerUid === p.uid;
                return (
                  <div
                    key={p.uid}
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                      isWinner
                        ? 'border-emerald-400 bg-emerald-950/60 text-emerald-200'
                        : p.eliminatedThisRound
                        ? 'border-rose-500/40 bg-rose-950/30 text-rose-300 opacity-75'
                        : isMe
                        ? 'border-amber-400/40 bg-amber-500/10 text-white'
                        : 'border-white/10 bg-zinc-900/80 text-zinc-300'
                    }`}
                  >
                    {isWinner ? (
                      <Trophy className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : p.eliminatedThisRound ? (
                      <X className="w-3 h-3 text-rose-400 shrink-0" />
                    ) : (
                      <Crosshair className="w-3 h-3 text-sky-400 shrink-0" />
                    )}
                    <span className="font-bold truncate max-w-[96px]">
                      {p.nickname}
                    </span>
                    <span className="font-mono font-black text-amber-300 tabular-nums px-1.5 py-0.2 rounded bg-black/50">
                      {p.score}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {game.state === 'playing' && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-zinc-950 font-mono text-[11px] text-zinc-300 tabular-nums">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{formatClock(roundElapsedSec)}</span>
              </div>
            )}
            {game.mode === 'solo' && game.state === 'playing' && game.phase === 'deducing' && (
              <button
                type="button"
                disabled={hintUsedThisRound || Boolean(me?.eliminatedThisRound)}
                onClick={handleUseHint}
                title="Reveal 1 secret slot (1 per round)"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 disabled:opacity-35 text-[11px] font-bold text-amber-300 transition-colors whitespace-nowrap"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{hintUsedThisRound ? 'Hint Used' : 'Hint'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sfx('rule_check');
                setShowHowTo(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-200 transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1540px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center">
        {/* WAITING ROOM */}
        {game.state === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full mx-auto bg-black/75 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-xl border border-amber-500/30 bg-amber-950/40 flex items-center justify-center mb-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
              </div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white">
                Waiting for Agents
              </h1>
              <p className="text-xs text-zinc-400">
                Share the room code so friends can join this cipher match.
              </p>
            </div>

            {game.gameId && (
              <div className="flex items-center justify-between gap-3 bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5">
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                    Room Code
                  </div>
                  <div className="font-mono text-xl font-black tracking-[0.25em] text-amber-300">
                    {game.gameId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                <span className="inline-flex items-center gap-1 font-bold">
                  <Users className="w-3 h-3" /> Seated Players
                </span>
                <span>
                  {game.players.length} / {game.maxPlayers}
                </span>
              </div>
              <div className="divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden bg-zinc-950/70 max-h-36 overflow-y-auto">
                {game.players.map((p) => (
                  <div key={p.uid} className="px-3.5 py-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{p.nickname}</span>
                    <span className="text-[10px] font-mono uppercase text-zinc-400">
                      {p.uid === game.creatorId ? 'Host' : 'Agent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {!me && onJoinRoom && game.players.length < game.maxPlayers && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={joinNickname}
                  onChange={(e) => setJoinNickname(e.target.value)}
                  placeholder="Your codename..."
                  maxLength={18}
                  className="flex-1 bg-zinc-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  disabled={busy || !joinNickname.trim()}
                  onClick={() => onJoinRoom(joinNickname.trim())}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider text-xs disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            )}

            {isHost && onStartMatch && (
              <button
                type="button"
                disabled={busy || game.players.length < 2}
                onClick={onStartMatch}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-40"
              >
                {game.players.length < 2 ? 'Waiting for at least 2 players' : 'Start Match'}
              </button>
            )}
          </motion.div>
        )}

        {/* ACTIVE GAMEPLAY — 8 COLS CARDS (9x3 VERTICAL PLAYING CARDS) + 4 COLS DOCK */}
        {game.state !== 'waiting' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* LEFT 8 COLS: 26 VERTICAL CIPHER CARDS IN A 9x3 SPREAD */}
            <section className="lg:col-span-8 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-2xl">
              {/* Top Compact Toolbar: Mode + Attribute Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-1 p-0.5 bg-zinc-950 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      sfx('chip');
                      setInteractionMode('pick');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                      interactionMode === 'pick'
                        ? 'bg-amber-400 text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Pick (Slot #{activeSlot + 1})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sfx('chip');
                      setInteractionMode('pin');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                      interactionMode === 'pin'
                        ? 'bg-cyan-400 text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Pin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sfx('chip');
                      setInteractionMode('cross');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                      interactionMode === 'cross'
                        ? 'bg-rose-500 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Cross Out
                  </button>
                </div>

                {/* Color & Shape Quick Filter Pills */}
                <div className="flex flex-wrap items-center gap-1">
                  {CARD_COLORS.map((c) => {
                    const active = filterColor === c;
                    const st = COLOR_STYLE_MAP[c];
                    const isRare = deckStats.rarestColors.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          sfx('rule_check');
                          setFilterColor(active ? null : c);
                        }}
                        title={`${COLOR_LABELS[c]}: ${deckStats.colorCounts[c]} cards${isRare ? ' (Rarest)' : ''}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono transition-all ${
                          active
                            ? 'border-amber-400 bg-amber-400/20 text-white font-bold'
                            : 'border-white/10 bg-zinc-950 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <span>{st.short}</span>
                        <span className="text-white font-bold">{deckStats.colorCounts[c]}</span>
                      </button>
                    );
                  })}

                  <span className="text-white/15 mx-0.5">|</span>

                  {CARD_SHAPES.map((s) => {
                    const active = filterShape === s;
                    const isCommon = deckStats.mostCommonShapes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          sfx('rule_check');
                          setFilterShape(active ? null : s);
                        }}
                        title={`${SHAPE_LABELS[s]}: ${deckStats.shapeCounts[s]} cards${isCommon ? ' (Most Common)' : ''}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono transition-all ${
                          active
                            ? 'border-amber-400 bg-amber-400/20 text-white font-bold'
                            : 'border-white/10 bg-zinc-950 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <ShapeGlyph shape={s} color="offwhite" size={11} />
                        <span className="text-white font-bold">{deckStats.shapeCounts[s]}</span>
                      </button>
                    );
                  })}

                  {(crossedIndices.length > 0 || pinnedIndices.length > 0 || filterColor || filterShape) && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx('card_remove');
                        setCrossedIndices([]);
                        setPinnedIndices([]);
                        setFilterColor(null);
                        setFilterShape(null);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-[10px] text-zinc-300"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 9x3 PLAYING-CARD GRID (26 Vertical Playing Cards + 1 Deck Intel Joker Card = 27 Slots) */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 xl:grid-cols-9 gap-2 sm:gap-2.5 my-auto">
                {game.cards.map((card) => {
                  const slotIdx = slots.indexOf(card.index);
                  const slotPosition = slotIdx !== -1 ? slotIdx + 1 : null;

                  const secretIdx =
                    game.phase === 'round_over'
                      ? game.secretIndices.indexOf(card.index)
                      : -1;
                  const secretPosition = secretIdx !== -1 ? secretIdx + 1 : null;

                  const dimmed =
                    (filterColor !== null && card.color !== filterColor) ||
                    (filterShape !== null && card.shape !== filterShape);

                  const canInteract =
                    game.state === 'playing' &&
                    game.phase === 'deducing' &&
                    Boolean(me) &&
                    !me?.eliminatedThisRound;

                  return (
                    <CipherCard
                      key={card.index}
                      card={card}
                      slotPosition={slotPosition}
                      secretPosition={secretPosition}
                      crossedOut={crossedIndices.includes(card.index)}
                      pinned={pinnedIndices.includes(card.index)}
                      dimmed={dimmed}
                      disabled={!canInteract}
                      onClick={() => handleCardClick(card.index)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (canInteract) toggleCrossOut(card.index);
                      }}
                    />
                  );
                })}

                {/* 27th Card Slot: Deck Intel Summary Card matching 5:7 playing-card proportions */}
                <div className="hidden xl:flex w-full aspect-[5/7] min-h-[112px] sm:min-h-[126px] rounded-2xl border-2 border-dashed border-amber-400/25 bg-zinc-950/80 p-2 flex-col justify-between text-[10px] font-mono">
                  <div className="text-amber-300 font-black uppercase tracking-wider text-center border-b border-white/10 pb-1">
                    Deck Intel
                  </div>
                  <div className="space-y-1.5 my-auto text-center">
                    <div>
                      <div className="text-[8px] uppercase text-zinc-500">Rarest Color</div>
                      <div className="font-bold text-white">
                        {deckStats.rarestColors.map((c) => COLOR_STYLE_MAP[c].short).join('/')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase text-zinc-500">Most Common</div>
                      <div className="font-bold text-white">
                        {deckStats.mostCommonShapes.map((s) => SHAPE_LABELS[s]).join('/')}
                      </div>
                    </div>
                  </div>
                  <div className="text-[8px] text-zinc-500 text-center">Right-Click: ✕</div>
                </div>
              </div>
            </section>

            {/* RIGHT 4 COLS: RULES + 4-SLOT CODE DOCK */}
            <aside className="lg:col-span-4 flex flex-col justify-between gap-3">
              {/* 5-6 LOGIC CLUES PANEL */}
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2 shadow-2xl min-h-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cipher Rules ({game.rules.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoHighlightSlot}
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Filter Slot #{activeSlot + 1}</span>
                    </button>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {checkedRules.length}/{game.rules.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 overflow-y-auto pr-0.5 my-auto">
                  {game.rules.map((rule, idx) => {
                    const isChecked = checkedRules.includes(rule.id);
                    const verifyEntry = myGuessVerification?.ruleResults.find(
                      (r) => r.rule.id === rule.id
                    );
                    const cat = CATEGORY_BADGE[rule.category];

                    return (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => {
                          sfx('rule_check');
                          setCheckedRules((prev) =>
                            prev.includes(rule.id)
                              ? prev.filter((id) => id !== rule.id)
                              : [...prev, rule.id]
                          );
                        }}
                        className={`w-full text-left rounded-xl border px-3 py-2 flex items-center gap-2 transition-all ${
                          verifyEntry
                            ? verifyEntry.passed
                              ? 'border-emerald-500/45 bg-emerald-950/35'
                              : 'border-rose-500/45 bg-rose-950/35'
                            : isChecked
                            ? 'border-emerald-500/35 bg-emerald-950/20 opacity-70'
                            : 'border-white/10 bg-zinc-950/80 hover:border-white/25'
                        }`}
                      >
                        <span className="font-mono text-[11px] font-black text-amber-300 tabular-nums shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="flex-1 text-xs text-zinc-100 leading-snug">
                          {rule.text}
                        </span>
                        <span
                          className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${cat.cls}`}
                        >
                          {cat.label}
                        </span>
                        {verifyEntry ? (
                          verifyEntry.passed ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )
                        ) : isChecked ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4-SLOT CODE DOCK WITH VERTICAL PLAYING CARDS */}
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-2xl shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-white">
                      4-Card Secret Code
                    </h2>
                    <span className="text-[10px] font-mono text-amber-300">
                      Slot #{activeSlot + 1}
                    </span>
                  </div>
                  {game.phase === 'deducing' && !me?.eliminatedThisRound && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx('card_remove');
                        setSlots([null, null, null, null]);
                        setActiveSlot(0);
                      }}
                      className="text-[11px] font-mono text-zinc-400 hover:text-white transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* 4 Ordered Vertical Playing-Card Slots */}
                <div className="grid grid-cols-4 gap-2.5">
                  {slots.map((cardIdx, slotPos) => {
                    const displayIdx =
                      game.phase === 'round_over'
                        ? game.secretIndices[slotPos]
                        : me?.eliminatedThisRound && me.lastGuess[slotPos] !== undefined
                        ? me.lastGuess[slotPos]
                        : cardIdx;

                    const card =
                      typeof displayIdx === 'number' ? game.cards[displayIdx] : null;
                    const isTargeted =
                      game.phase === 'deducing' &&
                      !me?.eliminatedThisRound &&
                      activeSlot === slotPos;

                    if (card) {
                      const style = COLOR_STYLE_MAP[card.color];
                      return (
                        <div key={`slot-wrap-${slotPos}`} className="relative">
                          <button
                            type="button"
                            disabled={game.phase !== 'deducing' || Boolean(me?.eliminatedThisRound)}
                            onClick={() => handleClearSlot(slotPos)}
                            className={`w-full aspect-[5/7] min-h-[104px] rounded-2xl border-2 bg-gradient-to-b ${style.cardGradient} p-2 flex flex-col justify-between text-left transition-all ${
                              game.phase === 'round_over'
                                ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                : me?.eliminatedThisRound
                                ? 'border-rose-500/50'
                                : isTargeted
                                ? 'border-amber-300 ring-2 ring-amber-400/70 shadow-[0_0_18px_rgba(245,158,11,0.3)]'
                                : 'border-amber-400/65 hover:border-amber-300'
                            }`}
                          >
                            <div className="w-full flex items-center justify-between text-[10px] font-mono">
                              <span className="text-amber-300 font-black">#{slotPos + 1}</span>
                              <span className="font-black text-white">
                                {String(card.number).padStart(2, '0')}{card.letter}
                              </span>
                            </div>
                            <div className="w-full flex items-center justify-center my-auto">
                              <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${style.medallion}`}>
                                <ShapeGlyph shape={card.shape} color={card.color} size={18} />
                              </div>
                            </div>
                            <div className="w-full flex items-center justify-between font-mono text-[9px]">
                              <span className={`font-black ${style.text}`}>{style.short}</span>
                              <span className="text-zinc-300">{SHAPE_LABELS[card.shape].slice(0, 4)}</span>
                            </div>
                          </button>
                          {slotPos < 3 &&
                            game.phase === 'deducing' &&
                            !me?.eliminatedThisRound && (
                              <button
                                type="button"
                                onClick={() => handleSwapSlots(slotPos, slotPos + 1)}
                                title={`Swap Slot ${slotPos + 1} & ${slotPos + 2}`}
                                className="absolute top-1/2 -right-3 -translate-y-1/2 z-20 w-5 h-5 rounded-full bg-zinc-900 border border-white/25 hover:border-amber-400 flex items-center justify-center text-zinc-300 hover:text-amber-300 shadow"
                              >
                                <ArrowLeftRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={`slot-empty-${slotPos}`}
                        type="button"
                        disabled={game.phase !== 'deducing' || Boolean(me?.eliminatedThisRound)}
                        onClick={() => {
                          sfx('chip');
                          setActiveSlot(slotPos);
                        }}
                        className={`w-full aspect-[5/7] min-h-[104px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                          isTargeted
                            ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                            : 'border-white/15 bg-zinc-950/60 text-zinc-500 hover:border-white/30'
                        }`}
                      >
                        <span className="font-mono text-xs font-black">Slot {slotPos + 1}</span>
                        <span className="text-[9px] font-mono uppercase mt-1">
                          {isTargeted ? 'Target' : 'Empty'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Live Slot Telemetry Strip */}
                {liveTelemetry && game.phase === 'deducing' && !me?.eliminatedThisRound && (
                  <div className="rounded-lg border border-white/10 bg-zinc-950/90 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] font-mono">
                    <span className="text-zinc-400">
                      Sum:<strong className="text-amber-300 ml-0.5">{liveTelemetry.sum}</strong>
                    </span>
                    <span className="text-zinc-400">
                      Min+Max:<strong className="text-white ml-0.5">{liveTelemetry.minMaxSum}</strong>
                    </span>
                    <span className="text-zinc-400">
                      Diff:<strong className="text-white ml-0.5">{liveTelemetry.diff}</strong>
                    </span>
                    {liveTelemetry.prod14 !== null && (
                      <span className="text-zinc-400">
                        1×4:<strong className="text-sky-300 ml-0.5">{liveTelemetry.prod14}</strong>
                      </span>
                    )}
                    {liveTelemetry.prod23 !== null && (
                      <span className="text-zinc-400">
                        2×3:<strong className="text-purple-300 ml-0.5">{liveTelemetry.prod23}</strong>
                      </span>
                    )}
                    <span className="text-zinc-400">
                      Even:<strong className="text-emerald-300 ml-0.5">{liveTelemetry.evens}</strong>
                    </span>
                    <span className="text-zinc-400">
                      Prime:<strong className="text-amber-300 ml-0.5">{liveTelemetry.primes}</strong>
                    </span>
                  </div>
                )}

                {game.phase === 'deducing' && me?.eliminatedThisRound && (
                  <div className="rounded-xl border border-rose-500/35 bg-rose-950/35 px-3 py-2 flex items-center gap-2.5 text-xs text-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      <strong className="text-white">Incorrect Guess</strong> — Check red ✕ clues above.
                    </span>
                  </div>
                )}

                {game.phase === 'deducing' && me && !me.eliminatedThisRound && (
                  <button
                    type="button"
                    disabled={!allSlotsFilled || busy}
                    onClick={handleSubmit}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-95 text-black font-black uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2 transition-all disabled:opacity-35 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Secret Code</span>
                  </button>
                )}

                <AnimatePresence>
                  {game.phase === 'round_over' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between gap-2 pt-1"
                    >
                      <div
                        className={`flex-1 rounded-xl border px-3 py-2 text-xs ${
                          roundWinner
                            ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-100'
                            : 'border-amber-500/40 bg-amber-950/35 text-amber-100'
                        }`}
                      >
                        {roundWinner ? (
                          <span>
                            <strong className="text-white">
                              {roundWinner.nickname}
                              {roundWinner.uid === meUid ? ' (You)' : ''}
                            </strong>{' '}
                            cracked Round {game.round}!
                          </span>
                        ) : (
                          <span>No one cracked it. True code revealed above.</span>
                        )}
                      </div>

                      {(game.mode === 'solo' || isHost) ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={onNextRound}
                          className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs transition-colors shrink-0"
                        >
                          {game.round >= game.totalRounds ? 'Results' : 'Next Round'}
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                          Host advancing...
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* MATCH OVER MODAL */}
      {game.state === 'finished' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-2xl p-6 text-center shadow-2xl space-y-5"
          >
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-300" />
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">
                {meUid && game.matchWinnerUids.includes(meUid)
                  ? game.matchWinnerUids.length > 1
                    ? 'Match Tied!'
                    : 'You Won the Match!'
                  : 'Match Complete'}
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Final Standings after {game.totalRounds} rounds
              </p>
            </div>

            <div className="divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden bg-black/50 text-left">
              {sortedStandings.map((p, idx) => {
                const isWinner = game.matchWinnerUids.includes(p.uid);
                return (
                  <div
                    key={p.uid}
                    className={`px-4 py-2.5 flex items-center justify-between ${
                      isWinner ? 'bg-amber-400/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500 tabular-nums w-4">
                        {idx + 1}.
                      </span>
                      {isWinner && <Crown className="w-4 h-4 text-amber-300" />}
                      <span className="font-bold text-xs text-white">
                        {p.nickname} {p.uid === meUid ? '(You)' : ''}
                      </span>
                    </div>
                    <span className="font-mono font-black text-xs text-amber-300 tabular-nums">
                      {p.score} {p.score === 1 ? 'win' : 'wins'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2.5">
              {(game.mode === 'solo' || isHost) && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPlayAgain}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider text-xs inline-flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>
              )}
              <button
                type="button"
                onClick={onExit}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs"
              >
                Lobby
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {showHowTo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowHowTo(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-2xl p-5 text-zinc-100 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-base font-black uppercase tracking-tight text-white">
                How to Play Secret Order
              </h2>
              <button
                type="button"
                onClick={() => setShowHowTo(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
              <li>
                <strong className="text-white">26 Cipher Cards (01/A–26/Z):</strong> Numbers & letters are sequential; shapes & colors have unequal frequencies shown in the filter bar.
              </li>
              <li>
                <strong className="text-white">Target & Swap Slots:</strong> Click any Slot 1–4 (or press <code className="text-amber-300">1–4</code>) to target it, and use the swap arrows between slots to reorder your 4-card code.
              </li>
              <li>
                <strong className="text-white">Live Telemetry & Hint:</strong> Watch live Sum, Range, and Products in the dock. In Solo mode, use <strong className="text-amber-300">Hint</strong> once per round to reveal 1 true slot.
              </li>
              <li>
                <strong className="text-white">One-Strike Knockout:</strong> Submitting a wrong 4-card code eliminates you for that round. First player to submit the valid code wins!
              </li>
            </ul>
          </motion.div>
        </div>
      )}
    </div>
  );
}
