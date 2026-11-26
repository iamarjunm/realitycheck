'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
  Crosshair,
  X,
  Watch,
  Ghost,
  UserRound,
  Info,
  Clock,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Zap,
  Sparkles,
  Play,
  Lock,
  Cpu,
} from 'lucide-react';
import {
  Action,
  ARENA_MAPS,
  BOARD_SIZE,
  ChronosGameState,
  MAX_SHIELDS_PER_LOOP,
  MAX_TICKS,
  P0_START,
  P1_START,
  Pos,
  countParadoxDiffs,
  countShields,
  isObstacle,
  mirrorActionForPerspective,
  simulateTicks,
} from '@/lib/chronos';
import { playSound } from '@/lib/sounds';

interface ChronosArenaProps {
  game: ChronosGameState;
  meIdx: number;
  currentTick: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onJoinRoom?: (nickname: string) => void;
  onLockIn: (actions: Action[]) => void;
  onNextRound?: () => void;
  onPlayAgain?: () => void;
  busy?: boolean;
}

const ACTION_STYLE: Record<Action, { cls: string; label: string }> = {
  U: {
    cls: 'bg-gradient-to-b from-[#172436] to-[#101824] text-[#b9d7f7] border-[#7aaee6]/35 hover:border-[#b9d7f7]/70 hover:from-[#1f314a]',
    label: 'Move Up',
  },
  D: {
    cls: 'bg-gradient-to-b from-[#172436] to-[#101824] text-[#b9d7f7] border-[#7aaee6]/35 hover:border-[#b9d7f7]/70 hover:from-[#1f314a]',
    label: 'Move Down',
  },
  L: {
    cls: 'bg-gradient-to-b from-[#172436] to-[#101824] text-[#b9d7f7] border-[#7aaee6]/35 hover:border-[#b9d7f7]/70 hover:from-[#1f314a]',
    label: 'Move Left',
  },
  R: {
    cls: 'bg-gradient-to-b from-[#172436] to-[#101824] text-[#b9d7f7] border-[#7aaee6]/35 hover:border-[#b9d7f7]/70 hover:from-[#1f314a]',
    label: 'Move Right',
  },
  SU: {
    cls: 'bg-gradient-to-b from-[#2b1217] to-[#1a0b0e] text-[#fca5a5] border-[#dc2626]/40 hover:border-[#f87171]/75 hover:from-[#3a171e]',
    label: 'Shoot Up',
  },
  SD: {
    cls: 'bg-gradient-to-b from-[#2b1217] to-[#1a0b0e] text-[#fca5a5] border-[#dc2626]/40 hover:border-[#f87171]/75 hover:from-[#3a171e]',
    label: 'Shoot Down',
  },
  SL: {
    cls: 'bg-gradient-to-b from-[#2b1217] to-[#1a0b0e] text-[#fca5a5] border-[#dc2626]/40 hover:border-[#f87171]/75 hover:from-[#3a171e]',
    label: 'Shoot Left',
  },
  SR: {
    cls: 'bg-gradient-to-b from-[#2b1217] to-[#1a0b0e] text-[#fca5a5] border-[#dc2626]/40 hover:border-[#f87171]/75 hover:from-[#3a171e]',
    label: 'Shoot Right',
  },
  SH: {
    cls: 'bg-gradient-to-b from-[#2a2114] to-[#18120a] text-[#f3d99d] border-[#e6c27a]/45 hover:border-[#e6c27a]/80 hover:from-[#362a19]',
    label: 'Shield',
  },
  W: {
    cls: 'bg-gradient-to-b from-[#1a181d] to-[#110f14] text-[#b5a996] border-[#e6c27a]/15 hover:border-[#e6c27a]/40 hover:text-[#f5efe2]',
    label: 'Wait',
  },
};

export function ActionIcon({
  a,
  size = 16,
  flipHorizontal = false,
}: {
  a: Action;
  size?: number;
  flipHorizontal?: boolean;
}) {
  const iconAction = mirrorActionForPerspective(a, flipHorizontal);

  switch (iconAction) {
    case 'U':
      return <ArrowUp size={size} />;
    case 'D':
      return <ArrowDown size={size} />;
    case 'L':
      return <ArrowLeft size={size} />;
    case 'R':
      return <ArrowRight size={size} />;
    case 'SU':
      return (
        <span className="relative inline-flex items-center justify-center">
          <Crosshair size={size + 2} className="opacity-35 absolute" />
          <ArrowUp size={size - 2} className="relative z-10" />
        </span>
      );
    case 'SD':
      return (
        <span className="relative inline-flex items-center justify-center">
          <Crosshair size={size + 2} className="opacity-35 absolute" />
          <ArrowDown size={size - 2} className="relative z-10" />
        </span>
      );
    case 'SL':
      return (
        <span className="relative inline-flex items-center justify-center">
          <Crosshair size={size + 2} className="opacity-35 absolute" />
          <ArrowLeft size={size - 2} className="relative z-10" />
        </span>
      );
    case 'SR':
      return (
        <span className="relative inline-flex items-center justify-center">
          <Crosshair size={size + 2} className="opacity-35 absolute" />
          <ArrowRight size={size - 2} className="relative z-10" />
        </span>
      );
    case 'SH':
      return <Shield size={size} />;
    case 'W':
      return <span className="text-[10px] font-mono font-black tracking-tighter">WAIT</span>;
  }
}

export function ChronosArena({
  game,
  meIdx,
  currentTick,
  soundEnabled,
  onToggleSound,
  onExit,
  onJoinRoom,
  onLockIn,
  onNextRound,
  onPlayAgain,
  busy = false,
}: ChronosArenaProps) {
  const [myActions, setMyActions] = useState<Action[]>(['W', 'W', 'W', 'W', 'W']);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [previewTick, setPreviewTick] = useState<number>(4);
  const [showHowTo, setShowHowTo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinNickname, setJoinNickname] = useState('');
  const [paradoxNotice, setParadoxNotice] = useState<string | null>(null);

  const sfx = useCallback(
    (type: Parameters<typeof playSound>[0]) => {
      if (soundEnabled) playSound(type);
    },
    [soundEnabled]
  );

  const me = meIdx !== -1 ? game.players[meIdx] : null;
  const opp = meIdx !== -1 && game.players.length === 2 ? game.players[meIdx === 0 ? 1 : 0] : null;
  const isFlipped = meIdx === 1;
  const isHost = meIdx === 0 || game.mode === 'solo';

  // Sync local action editor when entering programming phase or new loop
  useEffect(() => {
    if (game.state === 'programming' && me && !me.ready) {
      if (me.pastActions.length === MAX_TICKS) {
        setMyActions([...me.pastActions]);
      } else {
        setMyActions(['W', 'W', 'W', 'W', 'W']);
      }
      setActiveSlot(0);
      setPreviewTick(4);
      setParadoxNotice(null);
    }
  }, [game.state, game.turn, game.round, me?.ready, me?.pastActions.length]);

  const isLoopRewind = Boolean(me && me.pastActions.length === MAX_TICKS);
  const paradoxDiffs = me ? countParadoxDiffs(myActions, me.pastActions) : 0;
  const shieldsUsed = countShields(myActions);

  // Live Ghost & Self Path Preview during Programming!
  const previewSim = useMemo(() => {
    if (game.state !== 'programming' || !me) return null;
    const p0Seq = meIdx === 0 ? myActions : opp?.pastActions?.length === 5 ? opp.pastActions : (['W', 'W', 'W', 'W', 'W'] as Action[]);
    const p1Seq = meIdx === 1 ? myActions : opp?.pastActions?.length === 5 ? opp.pastActions : (['W', 'W', 'W', 'W', 'W'] as Action[]);
    return simulateTicks(p0Seq, p1Seq, game.obstacles);
  }, [game.state, game.obstacles, me, meIdx, myActions, opp?.pastActions]);

  const handleActionSelect = useCallback(
    (rawAction: Action) => {
      if (game.state !== 'programming' || !me || me.ready) return;

      // Convert visual left/right into canonical board coordinates if player is on right side (meIdx === 1)
      const a = mirrorActionForPerspective(rawAction, isFlipped);

      // Enforce max 1 Shield per 5-tick loop
      const wouldHaveShields = myActions.reduce(
        (cnt, act, idx) => cnt + ((idx === activeSlot ? a : act) === 'SH' ? 1 : 0),
        0
      );
      if (wouldHaveShields > MAX_SHIELDS_PER_LOOP) {
        sfx('error');
        setParadoxNotice('Max 1 Shield per 5-tick loop!');
        setTimeout(() => setParadoxNotice(null), 1800);
        return;
      }

      if (isLoopRewind) {
        // Allowed to alter at most 1 slot compared to pastActions; picking a new slot snaps other slots back cleanly
        const candidate = [...myActions];
        candidate[activeSlot] = a;
        const diffs = countParadoxDiffs(candidate, me.pastActions);
        if (diffs > 1) {
          const snapped = [...me.pastActions];
          snapped[activeSlot] = a;
          if (countShields(snapped) > MAX_SHIELDS_PER_LOOP) {
            sfx('error');
            setParadoxNotice('Max 1 Shield per loop!');
            setTimeout(() => setParadoxNotice(null), 1800);
            return;
          }
          setMyActions(snapped);
          sfx('paradox');
          setParadoxNotice(`Paradox edit moved to Tick ${activeSlot + 1}`);
          setTimeout(() => setParadoxNotice(null), 1600);
        } else {
          setMyActions(candidate);
          sfx(a === 'SH' ? 'shield' : a.startsWith('S') ? 'laser' : 'move');
        }
      } else {
        const next = [...myActions];
        next[activeSlot] = a;
        setMyActions(next);
        sfx(a === 'SH' ? 'shield' : a.startsWith('S') ? 'laser' : 'move');
        if (activeSlot < MAX_TICKS - 1) setActiveSlot(activeSlot + 1);
      }
      setPreviewTick(activeSlot);
    },
    [activeSlot, game.state, isFlipped, isLoopRewind, me, myActions, sfx]
  );

  // Keyboard shortcuts during programming
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (game.state !== 'programming' || !me || me.ready) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      const k = e.key.toLowerCase();
      if (['1', '2', '3', '4', '5'].includes(k)) {
        const idx = Number(k) - 1;
        setActiveSlot(idx);
        setPreviewTick(idx);
        sfx('chip');
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        sfx('reaction');
        onLockIn(myActions);
        return;
      }
      // Shift+WASD or IJKL shoots; WASD moves
      if (e.shiftKey) {
        if (k === 'w' || e.key === 'ArrowUp') { e.preventDefault(); handleActionSelect('SU'); }
        else if (k === 's' || e.key === 'ArrowDown') { e.preventDefault(); handleActionSelect('SD'); }
        else if (k === 'a' || e.key === 'ArrowLeft') { e.preventDefault(); handleActionSelect('SL'); }
        else if (k === 'd' || e.key === 'ArrowRight') { e.preventDefault(); handleActionSelect('SR'); }
      } else {
        if (k === 'w' || e.key === 'ArrowUp') { e.preventDefault(); handleActionSelect('U'); }
        else if (k === 's' || e.key === 'ArrowDown') { e.preventDefault(); handleActionSelect('D'); }
        else if (k === 'a' || e.key === 'ArrowLeft') { e.preventDefault(); handleActionSelect('L'); }
        else if (k === 'd' || e.key === 'ArrowRight') { e.preventDefault(); handleActionSelect('R'); }
        else if (k === 'i') handleActionSelect('SU');
        else if (k === 'k') handleActionSelect('SD');
        else if (k === 'j') handleActionSelect('SL');
        else if (k === 'l') handleActionSelect('SR');
        else if (k === 'e' || k === ' ') { e.preventDefault(); handleActionSelect('SH'); }
        else if (k === 'q') handleActionSelect('W');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game.state, handleActionSelect, me, myActions, onLockIn, sfx]);

  const handleCopyCode = () => {
    if (!game.gameId) return;
    navigator.clipboard.writeText(game.gameId);
    sfx('chip');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const p0 = game.players[0];
  const p1 = game.players[1];
  const mapInfo = ARENA_MAPS[game.mapId] || ARENA_MAPS.pillars;

  // Visual palette is always in player's own perspective (Left = You, Right = Enemy)
  const moveActions: Action[] = ['U', 'D', 'L', 'R'];
  const shootActions: Action[] = ['SU', 'SD', 'SL', 'SR'];

  return (
    <div
      className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0c0b0e] atelier-bg text-[#f5efe2] font-sans flex flex-col relative"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 75% 45% at 50% 0%, rgba(212, 168, 83, 0.12), rgba(59, 110, 165, 0.08) 46%, transparent 74%)',
      }}
    >
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />

      {/* COMPACT 48px TOP HUD */}
      <header className="relative z-20 w-full border-b border-[#e6c27a]/15 bg-[#0e0d11]/90 backdrop-blur-md shrink-0">
        <div className="max-w-[1380px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                sfx('chip');
                onExit();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#b8aa95] hover:text-[#faf4e8] transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#e6c27a]" />
              <span>Lobby</span>
            </button>
            <span className="text-[#e6c27a]/25 hidden sm:inline">|</span>
            <div className="flex items-center gap-2 text-xs truncate">
              <Clock className="w-3.5 h-3.5 text-[#e6c27a] shrink-0 hidden sm:inline" />
              <span className="font-display font-bold tracking-tight text-[#faf4e8] whitespace-nowrap">
                Chronos <span className="font-serif italic font-normal text-[#e6c27a]">Assassin</span>
              </span>
              <span className="hidden md:inline-flex items-center rounded-full border border-[#e6c27a]/25 bg-[#161318] px-2.5 py-0.5 font-mono text-[10px] text-[#e6c27a] font-medium">
                R{game.round} · Loop {game.turn}
              </span>
            </div>
          </div>

          {/* Center Scoreboard with Win Pips */}
          {game.players.length === 2 && (
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-2">
                <span className="font-display text-xs font-bold text-[#c4ddf7] hidden sm:inline truncate max-w-[90px]">
                  {meIdx === 0 ? p0.nickname : meIdx === 1 ? p1.nickname : p0.nickname}
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: game.winScore }).map((_, i) => {
                    const myScore = meIdx === 1 ? p1.score : p0.score;
                    return (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full border transition-all ${
                          i < myScore
                            ? 'bg-gradient-to-br from-[#f4ecd8] to-[#5d96d6] border-[#f4ecd8] shadow-[0_0_8px_rgba(122,174,230,0.65)]'
                            : 'bg-[#121015] border-[#e6c27a]/25'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <span className="font-serif italic text-xs text-[#e6c27a]">vs</span>

              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  {Array.from({ length: game.winScore }).map((_, i) => {
                    const oppScore = meIdx === 1 ? p0.score : p1.score;
                    return (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full border transition-all ${
                          i < oppScore
                            ? 'bg-gradient-to-br from-[#f87171] to-[#991b1b] border-[#fca5a5] shadow-[0_0_8px_rgba(220,38,38,0.65)]'
                            : 'bg-[#121015] border-[#e6c27a]/25'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="font-display text-xs font-bold text-[#f06e76] hidden sm:inline truncate max-w-[90px]">
                  {meIdx === 1 ? p0.nickname : p1.nickname}
                </span>
              </div>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-md border border-[#e6c27a]/20 bg-[#141217] font-mono text-[10px] text-[#c7b9a2]">
              {mapInfo.name}
            </span>
            <button
              type="button"
              onClick={() => {
                sfx('rule_check');
                setShowHowTo(true);
              }}
              className="btn-obsidian inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
            >
              <Info className="w-3.5 h-3.5 text-[#e6c27a]" />
              <span className="hidden sm:inline">Rules</span>
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              className="btn-obsidian p-1.5 rounded-lg"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#e6c27a]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-[#7a6f61]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1380px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center">
        {/* WAITING / JOIN OVERLAY */}
        {game.state === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full mx-auto atelier-card rounded-2xl p-6 space-y-4 text-center border border-[#e6c27a]/25"
          >
            <div className="mx-auto w-12 h-12 rounded-2xl border border-[#e6c27a]/35 bg-[#151218] flex items-center justify-center shadow-inner">
              <Clock className="w-5 h-5 text-[#e6c27a] animate-pulse" />
            </div>

            {meIdx === -1 && onJoinRoom ? (
              <>
                <h1 className="font-display text-xl font-bold tracking-tight text-[#faf4e8]">
                  Sync Into <span className="font-serif italic font-normal text-[#e6c27a]">Timeline</span>
                </h1>
                <p className="text-xs text-[#b5a996]">
                  Enter your operative codename to face the host on {mapInfo.name}.
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={joinNickname}
                    onChange={(e) => setJoinNickname(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && joinNickname.trim() && onJoinRoom(joinNickname.trim())}
                    placeholder="CODENAME"
                    maxLength={14}
                    className="flex-1 bg-[#0a090c] border border-[#e6c27a]/20 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 transition-colors"
                  />
                  <button
                    type="button"
                    disabled={busy || !joinNickname.trim()}
                    onClick={() => onJoinRoom(joinNickname.trim())}
                    className="btn-brass px-5 py-2.5 rounded-xl font-display font-bold text-xs disabled:opacity-50"
                  >
                    Sync
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-display text-xl font-bold tracking-tight text-[#faf4e8]">
                  Waiting for <span className="font-serif italic font-normal text-[#e6c27a]">Rival Assassin</span>
                </h1>
                <p className="text-xs text-[#b5a996]">
                  Share this Timeline Code so your opponent can sync in.
                </p>
                {game.gameId && (
                  <div className="flex items-center justify-between gap-3 bg-[#0a090c] border border-[#e6c27a]/25 rounded-xl px-4 py-3 text-left shadow-inner">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#9c8f7e]">
                        Timeline Code
                      </div>
                      <div className="font-mono text-2xl font-bold tracking-[0.22em] text-[#e6c27a]">
                        {game.gameId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="btn-obsidian inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#e6c27a]" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ACTIVE TWO-COLUMN ARENA */}
        {game.state !== 'waiting' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* LEFT 6 COLS: 5x5 HOROLOGICAL TACTICAL GRID + TICK SCRUBBER */}
            <section className="lg:col-span-6 flex flex-col items-center justify-center gap-3">
              {/* Arena Board — Brushed Brass & Obsidian Frame */}
              <div className="relative aspect-square w-full max-w-[390px] sm:max-w-[420px] rounded-2xl border border-[#e6c27a]/35 bg-gradient-to-b from-[#1a171c] via-[#121016] to-[#0c0a0f] overflow-hidden p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(230,194,122,0.28)]">
                {/* Brass Corner Pins */}
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#e6c27a]/55" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#e6c27a]/55" />
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#e6c27a]/55" />
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#e6c27a]/55" />

                <div className="relative w-full h-full">
                  {/* 5x5 Grid Cells + Beveled Stone Cover Tiles */}
                  <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-1.5">
                    {Array.from({ length: 25 }).map((_, i) => {
                      const gx = i % BOARD_SIZE;
                      const gy = Math.floor(i / BOARD_SIZE);
                      const canonicalX = isFlipped ? BOARD_SIZE - 1 - gx : gx;
                      const blocked = isObstacle({ x: canonicalX, y: gy }, game.obstacles);

                      return (
                        <div
                          key={i}
                          className={`rounded-lg border transition-colors flex items-center justify-center ${
                            blocked
                              ? 'bg-gradient-to-br from-[#3a343b] via-[#252128] to-[#151218] border-t-[#e6c27a]/40 border-l-[#e6c27a]/20 border-b-[#08070a] border-r-[#08070a] shadow-[inset_0_2px_4px_rgba(255,245,220,0.12),0_4px_10px_rgba(0,0,0,0.65)]'
                              : 'bg-gradient-to-b from-[#17151c] to-[#110f15] border-[#e6c27a]/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
                          }`}
                        >
                          {blocked && (
                            <div className="w-[66%] h-[66%] rounded-md border border-[#e6c27a]/30 bg-gradient-to-br from-[#2c272e] to-[#19161c] shadow-inner flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rotate-45 border border-[#e6c27a]/40 bg-[#e6c27a]/10" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Entities & Lasers (Live Execution OR Programming Scrubber Preview) */}
                  <BoardEntities
                    game={game}
                    meIdx={meIdx}
                    currentTick={currentTick}
                    previewSim={previewSim}
                    previewTick={previewTick}
                  />
                </div>
              </div>

              {/* Execution Tick Bar OR Programming Timeline Scrubber */}
              {game.state === 'executing' && game.executionResults ? (
                <div className="w-full max-w-[420px] atelier-card rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#e6c27a] mb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Play className="w-3 h-3 fill-[#e6c27a]" /> Timeline Playback
                    </span>
                    <span className="text-[#a89b86]">
                      Tick {Math.max(1, currentTick + 1)} / {game.executionResults.length}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: MAX_TICKS }).map((_, i) => {
                      const tickData = game.executionResults?.[i];
                      const active = currentTick === i;
                      const myAct = tickData ? (meIdx === 1 ? tickData.p1Action : tickData.p0Action) : null;
                      const oppAct = tickData ? (meIdx === 1 ? tickData.p0Action : tickData.p1Action) : null;
                      const hasHit = Boolean(tickData?.p0Hit || tickData?.p1Hit);

                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-lg border py-1.5 px-1 flex flex-col items-center justify-center gap-1 transition-all ${
                            active
                              ? hasHit
                                ? 'border-[#dc2626] bg-[#7f1d1d]/30 scale-[1.04] shadow-[0_0_16px_rgba(220,38,38,0.35)]'
                                : 'border-[#e6c27a] bg-[#e6c27a]/15 scale-[1.04] shadow-[0_0_16px_rgba(230,194,122,0.25)]'
                              : tickData
                              ? 'border-[#e6c27a]/15 bg-[#0e0c11] opacity-80'
                              : 'border-[#e6c27a]/10 bg-[#0b0a0e]/50 opacity-35'
                          }`}
                        >
                          <span className="font-mono text-[9px] font-semibold text-[#b8aa95]">T{i + 1}</span>
                          {myAct && oppAct ? (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-[#9ec5ef]">
                                <ActionIcon a={myAct} size={12} flipHorizontal={isFlipped} />
                              </span>
                              <span className="text-[#6f6559] text-[9px]">/</span>
                              <span className="text-[#f06e76]">
                                <ActionIcon a={oppAct} size={12} flipHorizontal={isFlipped} />
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-[#6f6559]">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : game.state === 'programming' ? (
                <div className="w-full max-w-[420px] atelier-card rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#e6c27a]/90 whitespace-nowrap">
                    Sim Preview:
                  </span>
                  <div className="flex gap-1.5 flex-1">
                    {Array.from({ length: MAX_TICKS }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          sfx('chip');
                          setPreviewTick(i);
                        }}
                        className={`flex-1 py-1 rounded-md font-mono text-[10px] font-bold border transition-all ${
                          previewTick === i
                            ? 'bg-gradient-to-b from-[#e6c27a] to-[#b5893a] text-[#171108] border-[#f5dfa9]/70 shadow-[0_2px_10px_rgba(230,194,122,0.3)]'
                            : 'bg-[#0b0a0e] text-[#a89b86] border-[#e6c27a]/15 hover:text-[#f5efe2] hover:border-[#e6c27a]/40'
                        }`}
                      >
                        T{i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {/* RIGHT 6 COLS: PROGRAMMING DOCK / ROUND OVER */}
            <aside className="lg:col-span-6 w-full max-w-xl mx-auto">
              {/* PROGRAMMING PANEL */}
              {game.state === 'programming' && me && (
                <div className="atelier-card rounded-2xl p-4 sm:p-5 space-y-3.5">
                  {me.ready ? (
                    <div className="py-12 text-center space-y-3">
                      <Watch className="w-9 h-9 mx-auto text-[#e6c27a] animate-spin" style={{ animationDuration: '4s' }} />
                      <div className="font-display text-sm font-bold tracking-tight text-[#faf4e8]">
                        Timeline <span className="font-serif italic font-normal text-[#e6c27a]">Locked</span>
                      </div>
                      <p className="text-xs text-[#b5a996]">
                        Waiting for {opp?.nickname || 'opponent'} to lock their 5-tick sequence...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Header & Paradox Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="font-display text-sm font-bold tracking-tight text-[#faf4e8] flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#e6c27a]" />
                            <span>
                              Program <span className="font-serif italic font-normal text-[#e6c27a]">5-Tick Timeline</span>
                            </span>
                          </h2>
                          <p className="text-[11px] text-[#aba08f] mt-0.5">
                            {isLoopRewind
                              ? 'Time-Loop Rewind: You may alter at most 1 tick from your last loop!'
                              : 'Loop 1: Program all 5 moves freely. Keys: WASD move · IJKL shoot · E shield.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isLoopRewind && (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold ${
                                paradoxDiffs === 1
                                  ? 'border-[#e6c27a]/65 bg-[#e6c27a]/18 text-[#f3d99d]'
                                  : 'border-[#e6c27a]/25 bg-[#151218] text-[#cbbda8]'
                              }`}
                            >
                              <Ghost className="w-3 h-3 text-[#e6c27a]" />
                              {paradoxDiffs}/1 Edit
                            </span>
                          )}
                          {isLoopRewind && paradoxDiffs > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                sfx('paradox');
                                setMyActions([...me.pastActions]);
                              }}
                              className="btn-obsidian px-2.5 py-1 rounded-lg text-[10px] font-mono"
                            >
                              Revert
                            </button>
                          )}
                        </div>
                      </div>

                      {paradoxNotice && (
                        <div className="rounded-lg border border-[#e6c27a]/45 bg-[#e6c27a]/12 px-3 py-1.5 text-[11px] font-mono text-[#f3d99d] text-center">
                          {paradoxNotice}
                        </div>
                      )}

                      {/* Opponent's Previous Loop Ghost Strip */}
                      {isLoopRewind && opp && opp.pastActions.length === MAX_TICKS && (
                        <div className="rounded-xl border border-[#e6c27a]/35 bg-gradient-to-b from-[#1a1510] to-[#110e0c] px-3 py-2.5 shadow-inner">
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#e6c27a] mb-1.5">
                            <span className="inline-flex items-center gap-1">
                              <Ghost className="w-3 h-3" /> {opp.nickname}&apos;s Last Loop (Ghost)
                            </span>
                            <span className="text-[#9e907c]">Can change 1 tick</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {opp.pastActions.map((a, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  sfx('chip');
                                  setActiveSlot(i);
                                  setPreviewTick(i);
                                }}
                                className="h-9 rounded-lg border border-[#e6c27a]/20 bg-[#141013] flex items-center justify-center text-[#f06e76] hover:border-[#e6c27a]/60 transition-colors"
                              >
                                <ActionIcon a={a} size={14} flipHorizontal={isFlipped} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Your 5 Program Slots */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#b5a996] mb-1.5">
                          <span>Your Sequence (Click slot or press 1–5)</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#e6c27a]/35 bg-[#e6c27a]/10 text-[#f3d99d]">
                            <Shield className="w-2.5 h-2.5" />
                            Shields: {shieldsUsed}/{MAX_SHIELDS_PER_LOOP}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {myActions.map((a, i) => {
                            const isChangedFromPast =
                              isLoopRewind && a !== me.pastActions[i];
                            const isTarget = activeSlot === i;

                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  sfx('chip');
                                  setActiveSlot(i);
                                  setPreviewTick(i);
                                }}
                                className={`relative h-14 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all shadow-inner ${
                                  isTarget
                                    ? 'border-[#9ec5ef] bg-[#162233] shadow-[0_0_16px_rgba(122,174,230,0.22)]'
                                    : isChangedFromPast
                                    ? 'border-[#e6c27a] bg-[#241c11]'
                                    : 'border-[#e6c27a]/18 bg-[#0b0a0e] hover:border-[#e6c27a]/45'
                                }`}
                              >
                                <span className="font-mono text-[9px] font-semibold text-[#9c8f7e]">
                                  T{i + 1}
                                </span>
                                <span
                                  className={
                                    a.startsWith('S') && a !== 'SH'
                                      ? 'text-[#f06e76]'
                                      : a === 'SH'
                                      ? 'text-[#e6c27a]'
                                      : a === 'W'
                                      ? 'text-[#9c8f7e]'
                                      : 'text-[#b9d7f7]'
                                  }
                                >
                                  <ActionIcon a={a} size={18} flipHorizontal={isFlipped} />
                                </span>
                                {isChangedFromPast && (
                                  <span className="absolute -top-1.5 -right-1.5 px-1 rounded bg-gradient-to-b from-[#e6c27a] to-[#b5893a] text-[#171108] font-mono text-[8px] font-bold">
                                    EDIT
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Grouped Action Palette */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                        {/* MOVE */}
                        <div className="sm:col-span-4 rounded-xl border border-[#e6c27a]/15 bg-[#0b0a0e] p-2.5 shadow-inner">
                          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#9ec5ef] mb-2 text-center">
                            Move (WASD)
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-2 gap-1.5">
                            {moveActions.map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => handleActionSelect(a)}
                                title={ACTION_STYLE[a].label}
                                className={`h-10 rounded-lg border flex items-center justify-center transition-all active:scale-95 ${ACTION_STYLE[a].cls}`}
                              >
                                <ActionIcon a={a} size={16} />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* LASER */}
                        <div className="sm:col-span-4 rounded-xl border border-[#e6c27a]/15 bg-[#0b0a0e] p-2.5 shadow-inner">
                          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#f06e76] mb-2 text-center">
                            Laser (IJKL)
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-2 gap-1.5">
                            {shootActions.map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => handleActionSelect(a)}
                                title={ACTION_STYLE[a].label}
                                className={`h-10 rounded-lg border flex items-center justify-center transition-all active:scale-95 ${ACTION_STYLE[a].cls}`}
                              >
                                <ActionIcon a={a} size={16} />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* TACTICAL */}
                        <div className="sm:col-span-4 rounded-xl border border-[#e6c27a]/15 bg-[#0b0a0e] p-2.5 flex flex-col justify-between shadow-inner">
                          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#e6c27a] mb-2 text-center">
                            Tactical
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 flex-1">
                            <button
                              type="button"
                              onClick={() => handleActionSelect('SH')}
                              className={`h-10 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${ACTION_STYLE.SH.cls}`}
                            >
                              <Shield size={14} />
                              <span>Shield (E)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleActionSelect('W')}
                              className={`h-10 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-medium transition-all active:scale-95 ${ACTION_STYLE.W.cls}`}
                            >
                              <span>Wait (Q)</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          sfx('reaction');
                          onLockIn(myActions);
                        }}
                        className="btn-brass w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-45"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Lock Timeline (Enter)</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* EXECUTION STATUS PANEL */}
              {game.state === 'executing' && (
                <div className="atelier-card rounded-2xl p-6 text-center space-y-3 border border-[#e6c27a]/25">
                  <Zap className="w-8 h-8 text-[#e6c27a] mx-auto animate-pulse" />
                  <h2 className="font-display text-lg font-bold tracking-tight text-[#faf4e8]">
                    Simulating <span className="font-serif italic font-normal text-[#e6c27a]">Timeline...</span>
                  </h2>
                  <p className="text-xs text-[#b5a996]">
                    {opp?.isBot ? 'Chronos AI' : opp?.nickname} and {me?.nickname || 'Player'} are executing ticks simultaneously.
                  </p>
                </div>
              )}

              {/* ROUND OVER BANNER */}
              {game.state === 'round_over' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="atelier-card rounded-2xl p-6 text-center space-y-4 border border-[#e6c27a]/25"
                >
                  {game.roundWinnerIdx === meIdx ? (
                    <>
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-[#162233] border border-[#9ec5ef]/40 flex items-center justify-center">
                        <Crosshair className="w-6 h-6 text-[#9ec5ef]" />
                      </div>
                      <h2 className="font-display text-2xl font-bold tracking-tight text-[#faf4e8]">
                        Target <span className="font-serif italic font-normal text-[#e6c27a]">Eliminated</span>
                      </h2>
                      <p className="text-xs text-[#b5a996]">
                        You neutralized {opp?.nickname} and secured Round {game.round}.
                      </p>
                    </>
                  ) : game.roundWinnerIdx === -1 ? (
                    <>
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-[#e6c27a]/15 border border-[#e6c27a]/40 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-[#e6c27a]" />
                      </div>
                      <h2 className="font-display text-2xl font-bold tracking-tight text-[#e6c27a]">
                        Mutual <span className="font-serif italic font-normal">Paradox</span>
                      </h2>
                      <p className="text-xs text-[#b5a996]">
                        Both assassins eliminated each other on the same tick. Zero points awarded.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-[#7f1d1d]/30 border border-[#dc2626]/45 flex items-center justify-center">
                        <X className="w-6 h-6 text-[#f06e76]" />
                      </div>
                      <h2 className="font-display text-2xl font-bold tracking-tight text-[#f06e76]">
                        Assassinated
                      </h2>
                      <p className="text-xs text-[#b5a996]">
                        {opp?.nickname} caught you in their firing line.
                      </p>
                    </>
                  )}

                  {isHost && onNextRound ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        sfx('deal');
                        onNextRound();
                      }}
                      className="btn-brass w-full py-3 rounded-xl font-display font-bold text-xs"
                    >
                      Continue to Round {game.round + 1}
                    </button>
                  ) : (
                    <p className="text-xs font-mono text-[#8e8271]">
                      Waiting for host to initiate Round {game.round + 1}...
                    </p>
                  )}
                </motion.div>
              )}
            </aside>
          </div>
        )}
      </main>

      {/* MATCH OVER MODAL */}
      {game.state === 'finished' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md atelier-card rounded-2xl p-6 text-center space-y-5 border border-[#e6c27a]/30"
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#161318] border border-[#e6c27a]/35 flex items-center justify-center shadow-inner">
              <Trophy className="w-7 h-7 text-[#e6c27a]" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#faf4e8]">
                {game.matchWinner === me?.uid ? (
                  <>
                    Timeline <span className="font-serif italic font-normal text-[#e6c27a]">Dominated</span>
                  </>
                ) : (
                  <>
                    Timeline <span className="font-serif italic font-normal text-[#f06e76]">Collapsed</span>
                  </>
                )}
              </h2>
              <p className="text-xs font-mono text-[#b5a996] mt-1.5">
                Final Score: {p0?.nickname} {p0?.score} — {p1?.score} {p1?.nickname}
              </p>
            </div>

            <div className="flex gap-2.5">
              {isHost && onPlayAgain && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    sfx('deal');
                    onPlayAgain();
                  }}
                  className="btn-brass flex-1 py-3 rounded-xl font-display font-bold text-xs inline-flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>
              )}
              <button
                type="button"
                onClick={onExit}
                className="btn-obsidian flex-1 py-3 rounded-xl font-medium text-xs"
              >
                Back to Lobby
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {showHowTo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowHowTo(false)}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md atelier-card rounded-2xl p-5 text-[#f5efe2] space-y-3.5 border border-[#e6c27a]/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#e6c27a]/15">
              <h2 className="font-display text-base font-bold tracking-tight text-[#faf4e8]">
                Chronos <span className="font-serif italic font-normal text-[#e6c27a]">Assassin Rules</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowHowTo(false)}
                className="p-1 rounded-lg text-[#a89b86] hover:text-[#faf4e8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2.5 text-xs text-[#cfc4b2] leading-relaxed">
              <li>
                <strong className="text-[#faf4e8]">5-Tick Programming:</strong> Each loop, program 5 simultaneous
                actions (Move, Laser, Shield, or Wait). Both assassins act at the same time.
              </li>
              <li>
                <strong className="text-[#faf4e8]">Time-Loop Paradox:</strong> If both survive all 5 ticks, the loop
                rewinds! You see your rival&apos;s <span className="text-[#f06e76] font-semibold">Ghost</span> from the
                previous loop, and each player may alter <strong className="text-[#e6c27a]">at most 1 tick</strong>.
              </li>
              <li>
                <strong className="text-[#faf4e8]">Shield Limit &amp; Cover:</strong> You get{' '}
                <strong className="text-[#e6c27a]">1 Shield per loop</strong> (blocks lasers on that tick).
                Chrono-Pillars block both movement and lasers.
              </li>
              <li>
                <strong className="text-[#faf4e8]">Sim Preview:</strong> Use the{' '}
                <code className="text-[#9ec5ef]">T1–T5</code> scrubber under the board during programming to preview
                your path against your opponent&apos;s Ghost!
              </li>
            </ul>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function BoardEntities({
  game,
  meIdx,
  currentTick,
  previewSim,
  previewTick,
}: {
  game: ChronosGameState;
  meIdx: number;
  currentTick: number;
  previewSim: ReturnType<typeof simulateTicks> | null;
  previewTick: number;
}) {
  if (!game || game.players.length < 2) return null;

  const isExec = game.state === 'executing' && game.executionResults && currentTick >= 0;
  const isProgPreview = game.state === 'programming' && previewSim && previewSim.length > 0;

  let p0pos: Pos = P0_START;
  let p1pos: Pos = P1_START;
  let p0Shield = false;
  let p1Shield = false;
  let p0Hit = false;
  let p1Hit = false;
  let lasers: { pIndex: 0 | 1; direction: Action; path: Pos[]; blockedByShield: boolean }[] = [];

  if (isExec && game.executionResults) {
    const tNum = Math.min(currentTick, game.executionResults.length - 1);
    const tick = game.executionResults[tNum];
    p0pos = tick.p0Pos;
    p1pos = tick.p1Pos;
    p0Shield = tick.p0Shield;
    p1Shield = tick.p1Shield;
    p0Hit = tick.p0Hit;
    p1Hit = tick.p1Hit;
    lasers = tick.lasers;
  } else if (isProgPreview && previewSim) {
    const tNum = Math.min(previewTick, previewSim.length - 1);
    const tick = previewSim[tNum];
    p0pos = tick.p0Pos;
    p1pos = tick.p1Pos;
    p0Shield = tick.p0Shield;
    p1Shield = tick.p1Shield;
    lasers = tick.lasers;
  }

  const getVisualX = (x: number) => (meIdx === 1 ? BOARD_SIZE - 1 - x : x);

  const getPosStyle = (p: Pos) => ({
    top: `${(p.y / BOARD_SIZE) * 100}%`,
    left: `${(getVisualX(p.x) / BOARD_SIZE) * 100}%`,
    width: `${100 / BOARD_SIZE}%`,
    height: `${100 / BOARD_SIZE}%`,
  });

  const oppHasGhost =
    isProgPreview &&
    ((meIdx === 0 && game.players[1]?.pastActions?.length === MAX_TICKS) ||
      (meIdx === 1 && game.players[0]?.pastActions?.length === MAX_TICKS));

  return (
    <>
      {/* Laser Beams */}
      <AnimatePresence>
        {lasers.map((l, i) => {
          const isMyLaser = l.pIndex === meIdx;
          const isGhostLaser = isProgPreview && !isMyLaser;
          if (isProgPreview && isGhostLaser && !oppHasGhost) return null;

          return (
            <motion.div
              key={`laser-${i}-${isExec ? currentTick : previewTick}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: isProgPreview ? 0.6 : 0.95 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10"
            >
              {l.path.map((pos, j) => {
                const vX = getVisualX(pos.x);
                const isHorizontal = l.direction === 'SL' || l.direction === 'SR';
                return (
                  <div
                    key={j}
                    className={`absolute rounded-full ${
                      isMyLaser
                        ? 'bg-[#8ec1f5] shadow-[0_0_12px_rgba(142,193,245,0.75)]'
                        : 'bg-[#e0424c] shadow-[0_0_12px_rgba(224,66,76,0.75)]'
                    } ${isExec ? 'animate-pulse' : ''}`}
                    style={
                      isHorizontal
                        ? {
                            top: `calc(${(pos.y / BOARD_SIZE) * 100}% + ${100 / BOARD_SIZE / 2}% - 3px)`,
                            left: `${(vX / BOARD_SIZE) * 100}%`,
                            width: `${100 / BOARD_SIZE}%`,
                            height: '6px',
                          }
                        : {
                            top: `${(pos.y / BOARD_SIZE) * 100}%`,
                            left: `calc(${(vX / BOARD_SIZE) * 100}% + ${100 / BOARD_SIZE / 2}% - 3px)`,
                            width: '6px',
                            height: `${100 / BOARD_SIZE}%`,
                          }
                    }
                  />
                );
              })}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Player 0 */}
      <motion.div
        animate={getPosStyle(p0pos)}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="absolute flex items-center justify-center p-2 z-20"
      >
        <div
          className={`relative w-full h-full rounded-xl flex items-center justify-center transition-colors ${
            meIdx === 0
              ? 'bg-gradient-to-br from-[#f4ecd8] via-[#a7c7e8] to-[#3f6fa5] text-[#0c121c] border border-[#faf4e8]/75 shadow-[0_6px_18px_rgba(63,111,165,0.5),inset_0_1px_1px_rgba(255,255,255,0.65)]'
              : isProgPreview && !oppHasGhost
              ? 'border-2 border-dashed border-[#dc2626]/45 bg-[#450a0a]/25 text-[#f06e76]/70'
              : isProgPreview && oppHasGhost
              ? 'border-2 border-dashed border-[#e6c27a]/85 bg-[#e6c27a]/15 text-[#f3d99d] shadow-[0_0_16px_rgba(230,194,122,0.2)]'
              : 'bg-gradient-to-br from-[#dc2626] via-[#9f1d24] to-[#5e0d12] text-[#fff5f5] border border-[#fca5a5]/45 shadow-[0_6px_18px_rgba(185,28,28,0.55)]'
          } ${p0Hit ? '!bg-[#140e12] border-2 border-[#dc2626]' : ''}`}
        >
          {p0Shield && (
            <div className="absolute -inset-1.5 rounded-2xl border-2 border-[#e6c27a] bg-[#e6c27a]/18 shadow-[0_0_16px_rgba(230,194,122,0.45)]" />
          )}
          {p0Hit ? (
            <X className="text-[#ef4444] w-7 h-7 stroke-[3]" />
          ) : isProgPreview && meIdx !== 0 ? (
            <Ghost size={20} />
          ) : game.players[0]?.isBot ? (
            <Cpu size={22} />
          ) : (
            <UserRound size={22} />
          )}
        </div>
      </motion.div>

      {/* Player 1 */}
      <motion.div
        animate={getPosStyle(p1pos)}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="absolute flex items-center justify-center p-2 z-20"
      >
        <div
          className={`relative w-full h-full rounded-xl flex items-center justify-center transition-colors ${
            meIdx === 1
              ? 'bg-gradient-to-br from-[#f4ecd8] via-[#a7c7e8] to-[#3f6fa5] text-[#0c121c] border border-[#faf4e8]/75 shadow-[0_6px_18px_rgba(63,111,165,0.5),inset_0_1px_1px_rgba(255,255,255,0.65)]'
              : isProgPreview && !oppHasGhost
              ? 'border-2 border-dashed border-[#dc2626]/45 bg-[#450a0a]/25 text-[#f06e76]/70'
              : isProgPreview && oppHasGhost
              ? 'border-2 border-dashed border-[#e6c27a]/85 bg-[#e6c27a]/15 text-[#f3d99d] shadow-[0_0_16px_rgba(230,194,122,0.2)]'
              : 'bg-gradient-to-br from-[#dc2626] via-[#9f1d24] to-[#5e0d12] text-[#fff5f5] border border-[#fca5a5]/45 shadow-[0_6px_18px_rgba(185,28,28,0.55)]'
          } ${p1Hit ? '!bg-[#140e12] border-2 border-[#dc2626]' : ''}`}
        >
          {p1Shield && (
            <div className="absolute -inset-1.5 rounded-2xl border-2 border-[#e6c27a] bg-[#e6c27a]/18 shadow-[0_0_16px_rgba(230,194,122,0.45)]" />
          )}
          {p1Hit ? (
            <X className="text-[#ef4444] w-7 h-7 stroke-[3]" />
          ) : isProgPreview && meIdx !== 1 ? (
            <Ghost size={20} />
          ) : game.players[1]?.isBot ? (
            <Cpu size={22} />
          ) : (
            <UserRound size={22} />
          )}
        </div>
      </motion.div>
    </>
  );
}
