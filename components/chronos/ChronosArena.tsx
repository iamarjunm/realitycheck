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
  U: { cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:border-cyan-400', label: 'Move Up' },
  D: { cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:border-cyan-400', label: 'Move Down' },
  L: { cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:border-cyan-400', label: 'Move Left' },
  R: { cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:border-cyan-400', label: 'Move Right' },
  SU: { cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:border-rose-400', label: 'Shoot Up' },
  SD: { cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:border-rose-400', label: 'Shoot Down' },
  SL: { cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:border-rose-400', label: 'Shoot Left' },
  SR: { cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:border-rose-400', label: 'Shoot Right' },
  SH: { cls: 'bg-purple-500/15 text-purple-300 border-purple-500/40 hover:border-purple-400', label: 'Shield' },
  W: { cls: 'bg-zinc-800/70 text-zinc-400 border-white/15 hover:border-white/30', label: 'Wait' },
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
    const p0Seq = meIdx === 0 ? myActions : opp?.pastActions?.length === 5 ? opp.pastActions : ['W', 'W', 'W', 'W', 'W'] as Action[];
    const p1Seq = meIdx === 1 ? myActions : opp?.pastActions?.length === 5 ? opp.pastActions : ['W', 'W', 'W', 'W', 'W'] as Action[];
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#04060c] text-cyan-50 font-sans flex flex-col relative">
      {/* Ambient Cyber Grid & Radial Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-cyan-500/[0.08] rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-rose-500/[0.06] rounded-full blur-[110px]" />
        <div className="absolute inset-0 bg-grid-white opacity-25" />
      </div>

      {/* COMPACT 48px TOP HUD */}
      <header className="relative z-20 w-full border-b border-cyan-500/20 bg-black/75 backdrop-blur-xl shrink-0">
        <div className="max-w-[1380px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-3">
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
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 hidden sm:inline" />
              <span className="font-black uppercase tracking-tight text-white whitespace-nowrap">
                Chronos Assassin
              </span>
              <span className="hidden md:inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300 font-bold">
                R{game.round} · Loop {game.turn}
              </span>
            </div>
          </div>

          {/* Center Scoreboard with Win Pips */}
          {game.players.length === 2 && (
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-300 hidden sm:inline truncate max-w-[90px]">
                  {meIdx === 0 ? p0.nickname : meIdx === 1 ? p1.nickname : p0.nickname}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: game.winScore }).map((_, i) => {
                    const myScore = meIdx === 1 ? p1.score : p0.score;
                    return (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full border transition-all ${
                          i < myScore
                            ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                            : 'bg-zinc-900 border-white/20'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <span className="font-mono text-[10px] font-black text-zinc-500">VS</span>

              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: game.winScore }).map((_, i) => {
                    const oppScore = meIdx === 1 ? p0.score : p1.score;
                    return (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full border transition-all ${
                          i < oppScore
                            ? 'bg-rose-500 border-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                            : 'bg-zinc-900 border-white/20'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-rose-300 hidden sm:inline truncate max-w-[90px]">
                  {meIdx === 1 ? p0.nickname : p1.nickname}
                </span>
              </div>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md border border-white/10 bg-zinc-950 font-mono text-[10px] text-zinc-400">
              {mapInfo.name}
            </span>
            <button
              type="button"
              onClick={() => {
                sfx('rule_check');
                setShowHowTo(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-200 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Rules</span>
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
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
            className="max-w-md w-full mx-auto bg-black/75 backdrop-blur-xl border border-cyan-500/25 rounded-2xl p-6 shadow-2xl space-y-4 text-center"
          >
            <div className="mx-auto w-11 h-11 rounded-xl border border-cyan-500/30 bg-cyan-950/50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>

            {meIdx === -1 && onJoinRoom ? (
              <>
                <h1 className="text-xl font-black uppercase tracking-tight text-white">
                  Sync Into Timeline
                </h1>
                <p className="text-xs text-zinc-400">
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
                    className="flex-1 bg-zinc-950 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    disabled={busy || !joinNickname.trim()}
                    onClick={() => onJoinRoom(joinNickname.trim())}
                    className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-wider text-xs disabled:opacity-50"
                  >
                    Sync
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-black uppercase tracking-tight text-white">
                  Waiting for Rival Assassin
                </h1>
                <p className="text-xs text-zinc-400">
                  Share this Timeline Code so your opponent can sync in.
                </p>
                {game.gameId && (
                  <div className="flex items-center justify-between gap-3 bg-zinc-950 border border-cyan-500/25 rounded-xl px-4 py-3 text-left">
                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                        Timeline Code
                      </div>
                      <div className="font-mono text-2xl font-black tracking-[0.22em] text-cyan-300">
                        {game.gameId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-bold uppercase text-cyan-200"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
            {/* LEFT 6 COLS: 5x5 TACTICAL GRID + TICK SCRUBBER */}
            <section className="lg:col-span-6 flex flex-col items-center justify-center gap-3">
              {/* Arena Board */}
              <div className="relative aspect-square w-full max-w-[390px] sm:max-w-[420px] rounded-2xl border-2 border-cyan-500/30 bg-black/85 shadow-[0_0_50px_rgba(6,182,212,0.12)] overflow-hidden p-1.5">
                <div className="relative w-full h-full">
                  {/* 5x5 Grid Cells + Pillars */}
                  <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-1">
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
                              ? 'bg-zinc-900/95 border-cyan-500/30 shadow-inner'
                              : 'bg-cyan-950/[0.12] border-cyan-500/15'
                          }`}
                        >
                          {blocked && (
                            <div className="w-3/5 h-3/5 rounded border border-cyan-400/25 bg-[repeating-linear-gradient(45deg,rgba(34,211,238,0.1)_0px,rgba(34,211,238,0.1)_2px,transparent_2px,transparent_6px)]" />
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
                <div className="w-full max-w-[420px] bg-black/70 border border-cyan-500/25 rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Play className="w-3 h-3 fill-cyan-400" /> Timeline Playback
                    </span>
                    <span>
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
                                ? 'border-rose-400 bg-rose-500/25 scale-105 shadow-[0_0_16px_rgba(244,63,94,0.4)]'
                                : 'border-cyan-400 bg-cyan-500/20 scale-105 shadow-[0_0_14px_rgba(34,211,238,0.35)]'
                              : tickData
                              ? 'border-white/10 bg-zinc-950/70 opacity-60'
                              : 'border-white/5 bg-black/40 opacity-25'
                          }`}
                        >
                          <span className="font-mono text-[9px] font-bold text-zinc-400">T{i + 1}</span>
                          {myAct && oppAct ? (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-cyan-300">
                                <ActionIcon a={myAct} size={12} flipHorizontal={isFlipped} />
                              </span>
                              <span className="text-zinc-600 text-[9px]">/</span>
                              <span className="text-rose-300">
                                <ActionIcon a={oppAct} size={12} flipHorizontal={isFlipped} />
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-zinc-600">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : game.state === 'programming' ? (
                <div className="w-full max-w-[420px] bg-black/65 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                    Sim Preview:
                  </span>
                  <div className="flex gap-1 flex-1">
                    {Array.from({ length: MAX_TICKS }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          sfx('chip');
                          setPreviewTick(i);
                        }}
                        className={`flex-1 py-1 rounded-md font-mono text-[10px] font-bold transition-all ${
                          previewTick === i
                            ? 'bg-cyan-400 text-black'
                            : 'bg-zinc-950 text-zinc-400 border border-white/10 hover:text-white'
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
                <div className="bg-black/65 backdrop-blur-xl border border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5">
                  {me.ready ? (
                    <div className="py-12 text-center space-y-3">
                      <Watch className="w-10 h-10 mx-auto text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                      <div className="text-sm font-black uppercase tracking-widest text-cyan-300">
                        Timeline Locked
                      </div>
                      <p className="text-xs text-zinc-400">
                        Waiting for {opp?.nickname || 'opponent'} to lock their 5-tick sequence...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Header & Paradox Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>Program 5-Tick Timeline</span>
                          </h2>
                          <p className="text-[11px] text-zinc-400">
                            {isLoopRewind
                              ? 'Time-Loop Rewind: You may alter at most 1 tick from your last loop!'
                              : 'Loop 1: Program all 5 moves freely. Keys: WASD move · IJKL shoot · E shield.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isLoopRewind && (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold ${
                                paradoxDiffs === 1
                                  ? 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                                  : 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                              }`}
                            >
                              <Ghost className="w-3 h-3" />
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
                              className="px-2 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-[10px] font-mono text-zinc-300"
                            >
                              Revert
                            </button>
                          )}
                        </div>
                      </div>

                      {paradoxNotice && (
                        <div className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-[11px] font-mono text-amber-200 text-center">
                          {paradoxNotice}
                        </div>
                      )}

                      {/* Opponent's Previous Loop Ghost Strip */}
                      {isLoopRewind && opp && opp.pastActions.length === MAX_TICKS && (
                        <div className="rounded-xl border border-rose-500/25 bg-rose-950/20 px-3 py-2">
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-rose-300/80 mb-1.5">
                            <span className="inline-flex items-center gap-1">
                              <Ghost className="w-3 h-3" /> {opp.nickname}&apos;s Last Loop (Ghost)
                            </span>
                            <span className="text-rose-400/60">Can change 1 tick</span>
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
                                className="h-9 rounded-lg border border-rose-500/25 bg-black/40 flex items-center justify-center text-rose-300/80 hover:border-rose-400/50 transition-colors"
                              >
                                <ActionIcon a={a} size={14} flipHorizontal={isFlipped} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Your 5 Program Slots */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                          <span>Your Sequence (Click slot or press 1–5)</span>
                          <span className="text-purple-300">
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
                                className={`relative h-14 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                                  isTarget
                                    ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_16px_rgba(34,211,238,0.28)] scale-[1.03]'
                                    : isChangedFromPast
                                    ? 'border-amber-400 bg-amber-500/15'
                                    : 'border-white/15 bg-zinc-950/90 hover:border-white/30'
                                }`}
                              >
                                <span className="font-mono text-[9px] font-bold text-zinc-400">
                                  T{i + 1}
                                </span>
                                <span
                                  className={
                                    a.startsWith('S') && a !== 'SH'
                                      ? 'text-rose-300'
                                      : a === 'SH'
                                      ? 'text-purple-300'
                                      : a === 'W'
                                      ? 'text-zinc-400'
                                      : 'text-cyan-300'
                                  }
                                >
                                  <ActionIcon a={a} size={18} flipHorizontal={isFlipped} />
                                </span>
                                {isChangedFromPast && (
                                  <span className="absolute -top-1.5 -right-1.5 px-1 rounded bg-amber-400 text-black font-mono text-[8px] font-black">
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
                        <div className="sm:col-span-4 rounded-xl border border-cyan-500/20 bg-zinc-950/80 p-2.5">
                          <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-cyan-400 mb-2 text-center">
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
                        <div className="sm:col-span-4 rounded-xl border border-rose-500/20 bg-zinc-950/80 p-2.5">
                          <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-rose-400 mb-2 text-center">
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
                        <div className="sm:col-span-4 rounded-xl border border-purple-500/20 bg-zinc-950/80 p-2.5 flex flex-col justify-between">
                          <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-purple-300 mb-2 text-center">
                            Tactical
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 flex-1">
                            <button
                              type="button"
                              onClick={() => handleActionSelect('SH')}
                              className={`h-10 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 ${ACTION_STYLE.SH.cls}`}
                            >
                              <Shield size={14} />
                              <span>Shield (E)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleActionSelect('W')}
                              className={`h-10 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 ${ACTION_STYLE.W.cls}`}
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
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:opacity-95 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-opacity shadow-[0_0_25px_rgba(34,211,238,0.28)] disabled:opacity-45"
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
                <div className="bg-black/65 backdrop-blur-xl border border-cyan-500/25 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
                  <Zap className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                  <h2 className="text-lg font-black uppercase tracking-tight text-white">
                    Simulating Timeline...
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {opp?.isBot ? 'Chronos AI' : opp?.nickname} and {me?.nickname || 'Player'} are executing ticks simultaneously.
                  </p>
                </div>
              )}

              {/* ROUND OVER BANNER */}
              {game.state === 'round_over' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black/75 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl"
                >
                  {game.roundWinnerIdx === meIdx ? (
                    <>
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
                        <Crosshair className="w-6 h-6 text-cyan-300" />
                      </div>
                      <h2 className="text-2xl font-black uppercase text-cyan-300">
                        Target Eliminated!
                      </h2>
                      <p className="text-xs text-zinc-300">
                        You neutralized {opp?.nickname} and secured Round {game.round}.
                      </p>
                    </>
                  ) : game.roundWinnerIdx === -1 ? (
                    <>
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-amber-300" />
                      </div>
                      <h2 className="text-2xl font-black uppercase text-amber-300">
                        Mutual Paradox!
                      </h2>
                      <p className="text-xs text-zinc-300">
                        Both assassins eliminated each other on the same tick. Zero points awarded.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-400/40 flex items-center justify-center">
                        <X className="w-6 h-6 text-rose-400" />
                      </div>
                      <h2 className="text-2xl font-black uppercase text-rose-400">
                        Assassinated!
                      </h2>
                      <p className="text-xs text-zinc-300">
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
                      className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-widest text-xs transition-colors"
                    >
                      Continue to Round {game.round + 1}
                    </button>
                  ) : (
                    <p className="text-xs font-mono text-zinc-500">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-zinc-950 border border-cyan-500/30 rounded-2xl p-6 text-center shadow-2xl space-y-5"
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-cyan-300" />
            </div>

            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                {game.matchWinner === me?.uid ? 'Timeline Dominated' : 'Timeline Collapsed'}
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1">
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
                  className="flex-1 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-wider text-xs inline-flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>
              )}
              <button
                type="button"
                onClick={onExit}
                className="flex-1 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs"
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-zinc-950 border border-cyan-500/30 rounded-2xl p-5 text-zinc-100 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-base font-black uppercase tracking-tight text-cyan-300">
                Chronos Assassin Rules
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
                <strong className="text-white">5-Tick Programming:</strong> Each loop, program 5 simultaneous actions (Move, Laser, Shield, or Wait). Both assassins act at the same time.
              </li>
              <li>
                <strong className="text-white">Time-Loop Paradox:</strong> If both survive all 5 ticks, the loop rewinds! You see your rival&apos;s <span className="text-rose-300 font-bold">Ghost</span> from the previous loop, and each player may alter <strong className="text-amber-300">at most 1 tick</strong>.
              </li>
              <li>
                <strong className="text-white">Shield Limit & Cover:</strong> You get <strong className="text-purple-300">1 Shield per loop</strong> (blocks lasers on that tick). Chrono-Pillars block both movement and lasers.
              </li>
              <li>
                <strong className="text-white">Sim Preview:</strong> Use the <code className="text-cyan-300">T1–T5</code> scrubber under the board during programming to preview your path against your opponent&apos;s Ghost!
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
              animate={{ opacity: isProgPreview ? 0.55 : 1 }}
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
                        ? 'bg-cyan-400 shadow-[0_0_16px_#22d3ee]'
                        : 'bg-rose-500 shadow-[0_0_16px_#f43f5e]'
                    } ${isExec ? 'animate-pulse' : ''}`}
                    style={
                      isHorizontal
                        ? {
                            top: `calc(${(pos.y / BOARD_SIZE) * 100}% + ${100 / BOARD_SIZE / 2}% - 4px)`,
                            left: `${(vX / BOARD_SIZE) * 100}%`,
                            width: `${100 / BOARD_SIZE}%`,
                            height: '8px',
                          }
                        : {
                            top: `${(pos.y / BOARD_SIZE) * 100}%`,
                            left: `calc(${(vX / BOARD_SIZE) * 100}% + ${100 / BOARD_SIZE / 2}% - 4px)`,
                            width: '8px',
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
          className={`relative w-full h-full rounded-xl flex items-center justify-center transition-all ${
            meIdx === 0
              ? 'bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_24px_rgba(34,211,238,0.55)] text-black'
              : isProgPreview && !oppHasGhost
              ? 'border-2 border-dashed border-rose-500/40 bg-rose-950/20 text-rose-400/50'
              : isProgPreview && oppHasGhost
              ? 'border-2 border-dashed border-rose-400 bg-rose-500/25 text-rose-200 opacity-70'
              : 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_0_24px_rgba(244,63,94,0.55)] text-black'
          } ${p0Hit ? '!bg-zinc-900 border-2 border-rose-500' : ''}`}
        >
          {p0Shield && (
            <div className="absolute -inset-1.5 rounded-2xl border-2 border-purple-400 bg-purple-500/25 shadow-[0_0_18px_rgba(168,85,247,0.6)]" />
          )}
          {p0Hit ? (
            <X className="text-rose-500 w-7 h-7 stroke-[3]" />
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
          className={`relative w-full h-full rounded-xl flex items-center justify-center transition-all ${
            meIdx === 1
              ? 'bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_24px_rgba(34,211,238,0.55)] text-black'
              : isProgPreview && !oppHasGhost
              ? 'border-2 border-dashed border-rose-500/40 bg-rose-950/20 text-rose-400/50'
              : isProgPreview && oppHasGhost
              ? 'border-2 border-dashed border-rose-400 bg-rose-500/25 text-rose-200 opacity-70'
              : 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_0_24px_rgba(244,63,94,0.55)] text-black'
          } ${p1Hit ? '!bg-zinc-900 border-2 border-rose-500' : ''}`}
        >
          {p1Shield && (
            <div className="absolute -inset-1.5 rounded-2xl border-2 border-purple-400 bg-purple-500/25 shadow-[0_0_18px_rgba(168,85,247,0.6)]" />
          )}
          {p1Hit ? (
            <X className="text-rose-500 w-7 h-7 stroke-[3]" />
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
