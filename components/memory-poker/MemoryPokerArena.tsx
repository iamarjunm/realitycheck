'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  VolumeX,
  BookOpen,
  Copy,
  Check,
  Trophy,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  Users,
  Crown,
  Lock,
  Eye,
  EyeOff,
  Spade,
  Bookmark,
} from 'lucide-react';
import {
  POSITIONS,
  evaluateFiveCardHand,
  findBestBoardCombination,
} from '@/lib/memory-poker';
import { playSound } from '@/lib/sounds';
import { PlayingCard, CardBadge } from './PlayingCard';
import { HandRankingsModal } from './HandRankingsModal';

export interface ArenaPlayer {
  uid: string;
  nickname: string;
  crest: string;
  isBot?: boolean;
  score: number;
  readyMemorize: boolean;
  selectedIndices: number[];
  lockedIn: boolean;
  lastHandName?: string;
  lastHandDetail?: string;
  lastHandScore?: number;
}

export interface ArenaGameState {
  gameId?: string;
  mode: 'solo' | 'multi';
  state: 'waiting' | 'playing' | 'finished';
  phase: 'memorize' | 'select' | 'showdown';
  round: number;
  totalRounds: number;
  memorizeSeconds: number;
  selectSeconds: number;
  maxPlayers: number;
  gridCards: string[];
  communityCards: string[];
  players: ArenaPlayer[];
  roundWinnerUids: string[];
  matchWinnerUids: string[];
  creatorId: string;
}

interface MemoryPokerArenaProps {
  game: ArenaGameState;
  meUid: string | null;
  secondsLeft: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onJoinRoom?: (nickname: string) => void;
  onStartMatch?: () => void;
  localSelection: number[];
  onToggleGridCard: (index: number) => void;
  onReadyMemorize: () => void;
  onLockInSelection: () => void;
  onNextRound: () => void;
  onPlayAgain: () => void;
  busy?: boolean;
}

function CircularTimer({
  secondsLeft,
  totalSeconds,
}: {
  secondsLeft: number;
  totalSeconds: number;
}) {
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const ratio = totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0;
  const strokeDashoffset = circumference * (1 - ratio);
  const urgent = secondsLeft <= 5;

  return (
    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2.5"
        />
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke={urgent ? '#ef4444' : '#fbbf24'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300"
        />
      </svg>
      <span
        className={`absolute font-mono text-[10px] font-black tabular-nums ${
          urgent ? 'text-red-400 animate-pulse' : 'text-amber-300'
        }`}
      >
        {secondsLeft}
      </span>
    </div>
  );
}

export function MemoryPokerArena({
  game,
  meUid,
  secondsLeft,
  soundEnabled,
  onToggleSound,
  onExit,
  onJoinRoom,
  onStartMatch,
  localSelection,
  onToggleGridCard,
  onReadyMemorize,
  onLockInSelection,
  onNextRound,
  onPlayAgain,
  busy = false,
}: MemoryPokerArenaProps) {
  const [showRankings, setShowRankings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinNickname, setJoinNickname] = useState('');
  const [bookmarkedIndices, setBookmarkedIndices] = useState<number[]>([]);
  const lastTickSecRef = useRef<number>(-1);

  // Reset bookmarks on new round
  useEffect(() => {
    setBookmarkedIndices([]);
  }, [game.round, game.state]);

  // Play urgent tick sound in final 5 seconds
  useEffect(() => {
    if (
      soundEnabled &&
      game.state === 'playing' &&
      game.phase !== 'showdown' &&
      secondsLeft > 0 &&
      secondsLeft <= 5 &&
      lastTickSecRef.current !== secondsLeft
    ) {
      lastTickSecRef.current = secondsLeft;
      playSound('tick');
    }
  }, [game.phase, game.state, secondsLeft, soundEnabled]);

  const me = game.players.find((p) => p.uid === meUid) || null;
  const isHost = Boolean(meUid && game.creatorId === meUid);

  const handleCopyCode = () => {
    if (!game.gameId) return;
    navigator.clipboard.writeText(game.gameId);
    if (soundEnabled) playSound('chip');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const toggleBookmark = (idx: number) => {
    if (game.phase !== 'memorize') return;
    if (soundEnabled) playSound('rule_check');
    setBookmarkedIndices((prev) => {
      if (prev.includes(idx)) return prev.filter((i) => i !== idx);
      if (prev.length >= 4) return [...prev.slice(1), idx];
      return [...prev, idx];
    });
  };

  const optimalBoard =
    game.phase === 'showdown' && game.communityCards.length === 3 && game.gridCards.length === 16
      ? findBestBoardCombination(game.communityCards, game.gridCards)
      : null;

  const totalPhaseSeconds =
    game.phase === 'memorize' ? game.memorizeSeconds : game.selectSeconds;

  const mySelectedIndices = me?.lockedIn ? me.selectedIndices : localSelection;
  const myShowdownEval =
    game.phase === 'showdown' &&
    me &&
    me.selectedIndices.length === 2 &&
    game.communityCards.length === 3
      ? evaluateFiveCardHand([
          ...game.communityCards,
          game.gridCards[me.selectedIndices[0]],
          game.gridCards[me.selectedIndices[1]],
        ])
      : null;

  const sortedStandings = [...game.players].sort((a, b) => b.score - a.score);

  return (
    <div
      className="min-h-dvh lg:h-dvh lg:overflow-hidden text-stone-100 flex flex-col relative"
      style={{
        background:
          'radial-gradient(circle at 50% 20%, #114B30 0%, #072215 50%, #040B07 100%)',
      }}
    >
      <div className="pointer-events-none fixed inset-0 bg-grid-white opacity-20" />

      {/* COMPACT TOP HUD BAR (48px) */}
      <header className="relative z-20 w-full border-b border-emerald-500/15 bg-black/65 backdrop-blur-xl shrink-0">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playSound('chip');
                onExit();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-stone-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lobby</span>
            </button>
            <span className="text-white/15 hidden sm:inline">|</span>
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="font-black uppercase tracking-tight text-white whitespace-nowrap">
                Memory Poker
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2 py-0.5 font-mono text-[10px] text-amber-300 font-bold tabular-nums whitespace-nowrap">
                R{Math.max(1, game.round)}/{game.totalRounds}
              </span>
            </div>
          </div>

          {/* Center Phase Stepper + Timer */}
          {game.state === 'playing' && (
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="hidden sm:flex items-center gap-1 rounded-full border border-white/10 bg-black/50 p-0.5 text-[10px] font-mono uppercase tracking-wider">
                {(['memorize', 'select', 'showdown'] as const).map((p, i) => {
                  const active = game.phase === p;
                  return (
                    <span
                      key={p}
                      className={`px-2.5 py-0.5 rounded-full transition-colors ${
                        active
                          ? 'bg-amber-400 text-black font-black'
                          : 'text-stone-500'
                      }`}
                    >
                      {i + 1}. {p}
                    </span>
                  );
                })}
              </div>

              {game.phase !== 'showdown' && (
                <CircularTimer
                  secondsLeft={secondsLeft}
                  totalSeconds={totalPhaseSeconds}
                />
              )}
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playSound('rule_check');
                setShowRankings(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold uppercase tracking-wider text-stone-200 transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Hands</span>
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-stone-200 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-stone-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN TABLE CONTENT — FITS IN SINGLE VIEWPORT */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1400px] mx-auto px-3 sm:px-5 py-2.5 flex flex-col justify-center">
        {/* WAITING ROOM */}
        {game.state === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full mx-auto bg-black/75 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-xl border border-emerald-500/30 bg-emerald-950/60 flex items-center justify-center mb-2">
                <Spade className="w-5 h-5 text-emerald-400" />
              </div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white">
                Waiting for Players
              </h1>
              <p className="text-xs text-stone-400">
                Share the room code so friends can join this table.
              </p>
            </div>

            {game.gameId && (
              <div className="flex items-center justify-between gap-3 bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5">
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-stone-500">
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
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-stone-500">
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
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-900/70 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
                        {p.crest}
                      </span>
                      <span className="font-bold text-white">{p.nickname}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-stone-400">
                      {p.uid === game.creatorId ? 'Host' : 'Player'}
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
                  placeholder="Player name..."
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
                {game.players.length < 2 ? 'Waiting for at least 2 players' : 'Deal Cards'}
              </button>
            )}
          </motion.div>
        )}

        {/* ACTIVE GAMEPLAY TABLE */}
        {game.state !== 'waiting' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* LEFT 7 COLS: 4x4 MEMORY BOARD (A-P) */}
            <section className="lg:col-span-7 bg-black/50 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {game.phase === 'memorize' ? (
                    <Eye className="w-4 h-4 text-amber-300 shrink-0" />
                  ) : game.phase === 'select' ? (
                    <EyeOff className="w-4 h-4 text-amber-300 shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">
                      Memory Grid (A–P)
                    </h2>
                    <p className="text-[11px] text-stone-300">
                      {game.phase === 'memorize'
                        ? 'Study all 16 cards. Click up to 4 cards to bookmark their position!'
                        : game.phase === 'select'
                        ? 'Pick 2 hidden positions to combine with the 3 community cards.'
                        : 'Showdown! All 16 positions revealed.'}
                    </p>
                  </div>
                </div>

                {game.phase === 'memorize' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-[10px] font-mono text-cyan-300">
                    <Bookmark className="w-3 h-3" />
                    <span>{bookmarkedIndices.length}/4 pinned</span>
                  </span>
                )}
                {game.phase === 'select' && (
                  <span className="px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-[10px] font-mono font-bold text-amber-300">
                    {mySelectedIndices.length}/2 selected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2.5 sm:gap-3 max-w-[460px] mx-auto w-full my-auto">
                {POSITIONS.map((posLabel, idx) => {
                  const cardId = game.gridCards[idx];
                  const faceUp = game.phase === 'memorize' || game.phase === 'showdown';

                  const selPos = mySelectedIndices.indexOf(idx);
                  const selectedOrder =
                    game.phase === 'select' && selPos !== -1
                      ? ((selPos + 1) as 1 | 2)
                      : null;

                  const badges: CardBadge[] = [];
                  if (game.phase === 'showdown') {
                    for (const p of game.players) {
                      if (p.selectedIndices.includes(idx)) {
                        badges.push({
                          label: p.uid === meUid ? 'You' : p.nickname.slice(0, 8),
                          tone: p.uid === meUid ? 'you' : 'opp',
                        });
                      }
                    }
                    if (
                      optimalBoard &&
                      optimalBoard.indices.includes(idx) &&
                      badges.length === 0
                    ) {
                      badges.push({ label: 'Best', tone: 'optimal' });
                    }
                  }

                  const canSelect =
                    game.state === 'playing' &&
                    game.phase === 'select' &&
                    Boolean(me) &&
                    !me?.lockedIn;

                  const canBookmark =
                    game.state === 'playing' && game.phase === 'memorize';

                  return (
                    <PlayingCard
                      key={posLabel}
                      cardId={cardId}
                      faceUp={faceUp}
                      positionLabel={posLabel}
                      selectedOrder={selectedOrder}
                      bookmarked={bookmarkedIndices.includes(idx)}
                      disabled={!canSelect && !canBookmark}
                      onClick={
                        canSelect
                          ? () => onToggleGridCard(idx)
                          : canBookmark
                          ? () => toggleBookmark(idx)
                          : undefined
                      }
                      badges={badges}
                    />
                  );
                })}
              </div>
            </section>

            {/* RIGHT 5 COLS: COMMUNITY 3 CARDS + HAND BUILDER + PLAYERS */}
            <aside className="lg:col-span-5 flex flex-col justify-between gap-3">
              {/* 3 COMMUNITY CARDS + 2 SELECTED SLOTS */}
              <div className="bg-black/50 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 space-y-3 shadow-2xl shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-white">
                    Community Cards (3) + Your Picks (2)
                  </h2>
                  <span className="text-[10px] font-mono text-stone-400">5-Card Hand</span>
                </div>

                <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-0.5">
                  {[0, 1, 2].map((i) => (
                    <PlayingCard
                      key={`comm-${i}`}
                      cardId={game.communityCards[i]}
                      faceUp={game.phase !== 'memorize'}
                      size="sm"
                    />
                  ))}

                  <span className="text-amber-300 font-black text-base px-0.5">+</span>

                  {[0, 1].map((slotIdx) => {
                    const pickedIdx = mySelectedIndices[slotIdx];
                    const hasPick = typeof pickedIdx === 'number';
                    const posLetter = hasPick ? POSITIONS[pickedIdx] : '?';
                    const showFaceUp = hasPick && game.phase === 'showdown';

                    return (
                      <div key={`pick-slot-${slotIdx}`} className="flex flex-col items-center">
                        {showFaceUp ? (
                          <PlayingCard
                            cardId={game.gridCards[pickedIdx]}
                            faceUp={true}
                            positionLabel={posLetter}
                            size="sm"
                          />
                        ) : (
                          <button
                            type="button"
                            disabled={!hasPick || game.phase !== 'select' || Boolean(me?.lockedIn)}
                            onClick={() => hasPick && onToggleGridCard(pickedIdx)}
                            className={`w-[66px] sm:w-[74px] aspect-[5/7] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                              hasPick
                                ? 'border-amber-400 bg-amber-400/15 text-amber-300 cursor-pointer hover:bg-amber-400/25 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                                : 'border-white/15 bg-black/35 text-stone-500 cursor-default'
                            }`}
                          >
                            <span className="font-mono text-xl font-black">{posLetter}</span>
                            <span className="text-[9px] font-mono uppercase mt-1">
                              {hasPick ? `Pick ${slotIdx + 1}` : 'Empty'}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {game.state === 'playing' && game.phase === 'memorize' && (
                  <button
                    type="button"
                    disabled={busy || Boolean(me?.readyMemorize)}
                    onClick={onReadyMemorize}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-black font-black uppercase tracking-widest text-xs transition-opacity disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                  >
                    {me?.readyMemorize
                      ? 'Ready — Waiting for Opponent'
                      : 'I Memorized It — Flip Cards Now'}
                  </button>
                )}

                {game.state === 'playing' && game.phase === 'select' && (
                  <button
                    type="button"
                    disabled={busy || Boolean(me?.lockedIn) || mySelectedIndices.length !== 2}
                    onClick={onLockInSelection}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-black font-black uppercase tracking-widest text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {me?.lockedIn
                        ? 'Hand Locked In — Waiting'
                        : mySelectedIndices.length === 2
                        ? `Lock In ${POSITIONS[mySelectedIndices[0]]} & ${POSITIONS[mySelectedIndices[1]]}`
                        : `Select ${2 - mySelectedIndices.length} More Position${
                            2 - mySelectedIndices.length === 1 ? '' : 's'
                          }`}
                    </span>
                  </button>
                )}

                {game.state === 'playing' && game.phase === 'showdown' && (
                  <div className="space-y-2 pt-0.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {myShowdownEval && (
                        <div className="rounded-lg bg-black/50 border border-amber-400/25 px-3 py-1.5 flex items-center justify-between">
                          <span className="text-stone-400">Yours:</span>
                          <span className="font-black text-amber-300 truncate ml-1">
                            {myShowdownEval.name}
                          </span>
                        </div>
                      )}
                      {optimalBoard && (
                        <div className="rounded-lg bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 flex items-center justify-between">
                          <span className="text-emerald-200">Best ({POSITIONS[optimalBoard.indices[0]]}+{POSITIONS[optimalBoard.indices[1]]}):</span>
                          <span className="font-bold text-emerald-300 truncate ml-1">
                            {optimalBoard.evaluation.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {(game.mode === 'solo' || isHost) ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onNextRound}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs transition-colors"
                      >
                        {game.round >= game.totalRounds ? 'View Final Results' : 'Next Round'}
                      </button>
                    ) : (
                      <p className="text-center text-[11px] font-mono text-stone-400">
                        Waiting for host to deal next round...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* PLAYERS & SHOWDOWN HANDS */}
              <div className="bg-black/50 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 flex-1 flex flex-col justify-between gap-2 shadow-2xl min-h-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-white">
                    Table Standings
                  </h2>
                  <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                    Round {Math.max(1, game.round)} / {game.totalRounds}
                  </span>
                </div>

                <div className="space-y-2 overflow-y-auto pr-0.5 my-auto">
                  {game.players.map((p) => {
                    const isMe = p.uid === meUid;
                    const isRoundWinner =
                      game.phase === 'showdown' && game.roundWinnerUids.includes(p.uid);

                    const playerEval =
                      game.phase === 'showdown' &&
                      p.selectedIndices.length === 2 &&
                      game.communityCards.length === 3
                        ? evaluateFiveCardHand([
                            ...game.communityCards,
                            game.gridCards[p.selectedIndices[0]],
                            game.gridCards[p.selectedIndices[1]],
                          ])
                        : null;

                    const statusText =
                      game.phase === 'memorize'
                        ? p.readyMemorize
                          ? 'Ready'
                          : 'Memorizing'
                        : game.phase === 'select'
                        ? p.lockedIn
                          ? 'Locked In'
                          : 'Selecting'
                        : isRoundWinner
                        ? 'Won Round'
                        : 'Showdown';

                    return (
                      <div
                        key={p.uid}
                        className={`rounded-xl border px-3 py-2.5 transition-all ${
                          isRoundWinner
                            ? 'border-emerald-400 bg-emerald-950/45'
                            : 'border-white/10 bg-black/45'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-emerald-900/70 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                              {p.crest}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-white truncate">
                                {p.nickname} {isMe ? <span className="text-amber-300">(You)</span> : ''}
                              </div>
                              <div className="text-[10px] font-mono text-stone-400">{statusText}</div>
                            </div>
                          </div>

                          <div className="font-mono text-base font-black text-amber-300 tabular-nums shrink-0">
                            {p.score} <span className="text-[9px] uppercase text-stone-500">{p.score === 1 ? 'win' : 'wins'}</span>
                          </div>
                        </div>

                        {game.phase === 'showdown' && p.selectedIndices.length === 2 && playerEval && (
                          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              {p.selectedIndices.map((idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white"
                                >
                                  <span className="text-amber-300 font-bold">
                                    {POSITIONS[idx]}
                                  </span>
                                  <span>{game.gridCards[idx]}</span>
                                </span>
                              ))}
                            </div>
                            <span className="text-[11px] font-bold text-stone-200 text-right truncate">
                              {playerEval.name} · {playerEval.detail}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
              <p className="text-xs font-mono text-stone-400 mt-1">
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
                      <span className="font-mono text-xs text-stone-500 tabular-nums w-4">
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

      <HandRankingsModal open={showRankings} onClose={() => setShowRankings(false)} />
    </div>
  );
}
