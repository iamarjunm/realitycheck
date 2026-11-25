'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crosshair,
  Radar,
  Zap,
  Shield,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Trophy,
  Skull,
  RotateCcw,
  Shuffle,
  Trash2,
  Flame,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sounds';
import {
  SHADOW_GRID_SIZE,
  SHADOW_TOTAL_CELLS,
  SHADOW_FLEET_SIZE,
  ShadowStrikeState,
  ShadowWeapon,
  idxToRC,
  formatCoord,
  get3x3Cells,
  getOrbitalCells,
  countHits,
  generateAutoFleet,
} from '@/lib/shadow-strike';

interface ShadowStrikeArenaProps {
  state: ShadowStrikeState;
  meIdx: number;
  roomCode?: string;
  isSolo?: boolean;
  isBotThinking?: boolean;
  onBack: () => void;
  onLockFleet: (fleet: number[]) => void;
  onFireWeapon: (weapon: ShadowWeapon, targetIdx: number) => void;
  onRematch: () => void;
}

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ShadowStrikeArena({
  state,
  meIdx,
  roomCode,
  isSolo = false,
  isBotThinking = false,
  onBack,
  onLockFleet,
  onFireWeapon,
  onRematch,
}: ShadowStrikeArenaProps) {
  const [copied, setCopied] = useState(false);
  const [draftFleet, setDraftFleet] = useState<number[]>(() => generateAutoFleet());
  const [selectedWeapon, setSelectedWeapon] = useState<ShadowWeapon>('strike');
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [impactFlash, setImpactFlash] = useState<'hit' | 'orbital' | 'sonar' | null>(null);

  const lastActionIdRef = useRef<number>(state.lastAction?.id ?? 0);
  const prevStatusRef = useRef<string>(state.status);

  const me = state.players[meIdx];
  const oppIdx = meIdx === 0 ? 1 : 0;
  const opp = state.players[oppIdx];

  const isMyTurn = state.status === 'playing' && state.turnIndex === meIdx && !isBotThinking;

  // Reset weapon to strike if charges depleted
  useEffect(() => {
    if (!me) return;
    if (selectedWeapon === 'sonar' && me.sonarLeft <= 0) {
      setSelectedWeapon('strike');
    }
    if ((selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col') && me.orbitalLeft <= 0) {
      setSelectedWeapon('strike');
    }
  }, [me?.sonarLeft, me?.orbitalLeft, selectedWeapon]);

  // Reset draft fleet when entering setup phase on rematch
  useEffect(() => {
    if (state.status === 'setup' && prevStatusRef.current !== 'setup' && me && !me.ready) {
      setDraftFleet(generateAutoFleet());
      setSelectedWeapon('strike');
    }
    prevStatusRef.current = state.status;
  }, [state.status, me]);

  // SFX + impact flash on new actions
  useEffect(() => {
    const act = state.lastAction;
    if (!act || act.id === lastActionIdRef.current) return;
    lastActionIdRef.current = act.id;

    if (act.weapon === 'sonar') {
      playSound('hint');
      setImpactFlash('sonar');
    } else if (act.weapon === 'orbital_row' || act.weapon === 'orbital_col') {
      playSound('paradox');
      setImpactFlash('orbital');
    } else if (act.hits > 0) {
      playSound('hit');
      setImpactFlash('hit');
    } else {
      playSound('blank_click');
    }

    const t = setTimeout(() => setImpactFlash(null), 420);
    return () => clearTimeout(t);
  }, [state.lastAction]);

  // Victory confetti
  useEffect(() => {
    if (state.status === 'finished' && state.winnerIdx === meIdx) {
      playSound('win');
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
    } else if (state.status === 'finished' && state.winnerIdx !== null && state.winnerIdx !== meIdx) {
      playSound('fold');
    }
  }, [state.status, state.winnerIdx, meIdx]);

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    playSound('tick');
    setTimeout(() => setCopied(false), 1800);
  };

  // Setup helpers
  const toggleDraftCell = (idx: number) => {
    if (!me || me.ready) return;
    setDraftFleet((prev) => {
      if (prev.includes(idx)) {
        playSound('card_remove');
        return prev.filter((c) => c !== idx);
      }
      if (prev.length >= SHADOW_FLEET_SIZE) {
        playSound('error');
        return prev;
      }
      playSound('card_pick');
      return [...prev, idx].sort((a, b) => a - b);
    });
  };

  const handleAutoDeploy = () => {
    if (!me || me.ready) return;
    playSound('flip');
    setDraftFleet(generateAutoFleet());
  };

  const handleClearFleet = () => {
    if (!me || me.ready) return;
    playSound('card_remove');
    setDraftFleet([]);
  };

  const handleLockFleet = () => {
    if (!me || me.ready || draftFleet.length !== SHADOW_FLEET_SIZE) {
      playSound('error');
      return;
    }
    playSound('shield');
    onLockFleet(draftFleet);
  };

  // Hover preview set for Enemy Radar
  const previewCells = useMemo(() => {
    if (!isMyTurn || hoveredCell === null) return new Set<number>();
    if (selectedWeapon === 'strike') return new Set([hoveredCell]);
    if (selectedWeapon === 'sonar') return new Set(get3x3Cells(hoveredCell));
    return new Set(getOrbitalCells(hoveredCell, selectedWeapon));
  }, [isMyTurn, hoveredCell, selectedWeapon]);

  const myShotSet = useMemo(() => new Set(me?.shotsFired ?? []), [me?.shotsFired]);
  const oppFleetSet = useMemo(() => new Set(opp?.fleet ?? []), [opp?.fleet]);
  const oppShotSet = useMemo(() => new Set(opp?.shotsFired ?? []), [opp?.shotsFired]);
  const myFleetSet = useMemo(
    () => new Set(state.status === 'setup' && !me?.ready ? draftFleet : me?.fleet ?? []),
    [state.status, me?.ready, me?.fleet, draftFleet]
  );

  const mySonarMap = useMemo(() => {
    const map = new Map<number, number>();
    (me?.sonarResults ?? []).forEach((s) => map.set(s.center, s.count));
    return map;
  }, [me?.sonarResults]);

  const myHitsLanded = me && opp ? countHits(me.shotsFired, opp.fleet) : 0;
  const oppHitsLanded = me && opp ? countHits(opp.shotsFired, me.fleet) : 0;

  const handleEnemyCellClick = (idx: number) => {
    if (!isMyTurn || !me) return;
    if (selectedWeapon === 'strike' && myShotSet.has(idx)) {
      playSound('error');
      return;
    }
    if (selectedWeapon === 'sonar' && me.sonarLeft <= 0) {
      playSound('error');
      return;
    }
    if ((selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col') && me.orbitalLeft <= 0) {
      playSound('error');
      return;
    }
    playSound('laser');
    onFireWeapon(selectedWeapon, idx);
    if (selectedWeapon !== 'strike') {
      setSelectedWeapon('strike');
    }
  };

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#06090f] text-slate-100 flex flex-col relative select-none">
      {/* Ambient tactical glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-24 w-[420px] h-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* Screen flash on hit/orbital/sonar */}
      <AnimatePresence>
        {impactFlash && (
          <motion.div
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`pointer-events-none fixed inset-0 z-40 ${
              impactFlash === 'orbital'
                ? 'bg-amber-500/25'
                : impactFlash === 'sonar'
                ? 'bg-cyan-400/20'
                : 'bg-rose-500/20'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Top HUD Bar */}
      <header className="relative z-10 shrink-0 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-md px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
            title="Leave Arena"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-emerald-400 shrink-0" />
              <h1 className="font-black tracking-wider text-sm sm:text-base uppercase text-white truncate">
                Shadow Strike
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {isSolo ? 'Solo vs AI' : '1v1 Live PvP'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              6×6 Stealth Fleet · Chain-Hit Extra Turns · 3×3 Sonar & Orbital Beam
            </p>
          </div>
        </div>

        {/* Center Score Strip */}
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold truncate max-w-[90px] sm:max-w-[120px]">
              {me?.nickname ?? 'You'}
            </div>
            <div className="text-sm sm:text-base font-black text-white leading-none">
              {myHitsLanded}
              <span className="text-slate-500 text-xs">/{SHADOW_FLEET_SIZE}</span>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
            VS
          </div>

          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-rose-400 font-bold truncate max-w-[90px] sm:max-w-[120px]">
              {opp?.nickname ?? 'Waiting…'}
            </div>
            <div className="text-sm sm:text-base font-black text-white leading-none">
              {oppHitsLanded}
              <span className="text-slate-500 text-xs">/{SHADOW_FLEET_SIZE}</span>
            </div>
          </div>
        </div>

        {/* Right Room Code */}
        <div className="flex items-center gap-2">
          {roomCode && (
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold transition-colors cursor-pointer"
              title="Copy Room Code"
            >
              <span>{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-center p-3 sm:p-4 max-w-6xl w-full mx-auto">
        {/* WAITING PHASE */}
        {state.status === 'waiting' && (
          <div className="max-w-md w-full mx-auto bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <Radar className="w-7 h-7 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-1">
              Awaiting Rival Commander
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              Share this tactical frequency code with a friend to start the 1v1 Shadow Strike duel.
            </p>
            {roomCode && (
              <button
                onClick={copyCode}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-950 border-2 border-emerald-500/40 hover:border-emerald-400 flex items-center justify-center gap-3 font-mono text-2xl font-black tracking-[0.25em] text-emerald-300 transition-all cursor-pointer mb-3"
              >
                <span>{roomCode}</span>
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            )}
            <p className="text-xs text-slate-500">
              Both players hide 6 stealth nodes, then hunt with Chain-Hit Strikes, 3×3 Sonar & Orbital Beams.
            </p>
          </div>
        )}

        {/* SETUP PHASE */}
        {state.status === 'setup' && me && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center min-h-0">
            {/* Left: Interactive Fleet Placement Grid */}
            <div className="lg:col-span-7 bg-slate-900/75 border border-emerald-500/25 rounded-2xl p-4 sm:p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Phase 1 · Stealth Deployment
                  </span>
                  <h2 className="text-lg font-black text-white">
                    Hide Your {SHADOW_FLEET_SIZE} Stealth Nodes
                  </h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-950 border border-emerald-500/30 text-xs font-black text-emerald-300">
                  {me.ready ? SHADOW_FLEET_SIZE : draftFleet.length} / {SHADOW_FLEET_SIZE} Placed
                </div>
              </div>

              <div className="max-w-[360px] mx-auto">
                {/* Column headers */}
                <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[10px] font-mono text-slate-500">
                  <div />
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <div key={c}>{c}</div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {ROW_LABELS.map((rowLabel, r) => (
                    <div key={rowLabel} className="grid grid-cols-7 gap-1.5 items-center">
                      <div className="text-[10px] font-mono text-slate-500 text-center">{rowLabel}</div>
                      {Array.from({ length: SHADOW_GRID_SIZE }).map((_, c) => {
                        const idx = r * SHADOW_GRID_SIZE + c;
                        const placed = myFleetSet.has(idx);
                        return (
                          <button
                            key={idx}
                            disabled={me.ready}
                            onClick={() => toggleDraftCell(idx)}
                            className={`aspect-square rounded-lg border text-xs font-bold flex items-center justify-center transition-all ${
                              placed
                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.35)] scale-[1.02]'
                                : 'bg-slate-950/90 border-slate-800 hover:border-emerald-500/50 text-slate-600'
                            } ${me.ready ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                          >
                            {placed ? <Shield className="w-4 h-4 fill-emerald-400/25" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Controls & Rules */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">
                  Arsenal Briefing
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <Crosshair className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Chain-Hit Laser:</span> Hitting a stealth node grants an immediate <span className="text-rose-300 font-bold">EXTRA TURN</span>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <Radar className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">3×3 Sonar Ping (×2):</span> Reveals the exact count of enemy nodes inside a 3×3 square.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Orbital Beam (×1):</span> Obliterates an entire Row or Column (6 cells) in one strike.
                    </div>
                  </div>
                </div>
              </div>

              {!me.ready ? (
                <div className="bg-slate-900/75 border border-emerald-500/25 rounded-2xl p-4 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleAutoDeploy}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                      Auto-Deploy
                    </button>
                    <button
                      onClick={handleClearFleet}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      Clear Grid
                    </button>
                  </div>
                  <button
                    onClick={handleLockFleet}
                    disabled={draftFleet.length !== SHADOW_FLEET_SIZE}
                    className={`w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
                      draftFleet.length === SHADOW_FLEET_SIZE
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.4)] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Lock Stealth Fleet ({draftFleet.length}/{SHADOW_FLEET_SIZE})
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-5 text-center">
                  <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-2 animate-pulse" />
                  <p className="font-black text-emerald-300 uppercase tracking-wider text-sm">
                    Fleet Locked & Cloaked
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Waiting for {opp?.nickname ?? 'opponent'} to finish deploying…
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLAYING & FINISHED PHASE */}
        {(state.status === 'playing' || state.status === 'finished') && me && opp && (
          <div className="flex flex-col gap-3 min-h-0 flex-1 justify-center">
            {/* Turn Banner + Weapon Selector */}
            <div className="shrink-0 bg-slate-900/80 border border-slate-800 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
              {/* Turn indicator */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                    state.status === 'finished'
                      ? state.winnerIdx === meIdx
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : isMyTurn
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {state.status === 'finished' ? (
                    state.winnerIdx === meIdx ? (
                      <>
                        <Trophy className="w-3.5 h-3.5" /> Victory!
                      </>
                    ) : (
                      <>
                        <Skull className="w-3.5 h-3.5" /> Defeated
                      </>
                    )
                  ) : isMyTurn ? (
                    <>
                      <Flame className="w-3.5 h-3.5" /> Your Strike
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> {opp.nickname}&apos;s Turn…
                    </>
                  )}
                </div>

                {state.lastAction && (
                  <p className="text-xs text-slate-300 hidden md:block truncate max-w-[360px]">
                    {state.lastAction.summary}
                  </p>
                )}
              </div>

              {/* Weapon Bar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  disabled={!isMyTurn}
                  onClick={() => {
                    playSound('tick');
                    setSelectedWeapon('strike');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    selectedWeapon === 'strike'
                      ? 'bg-rose-500/20 border-rose-400 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  } ${isMyTurn ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                  <span>Laser</span>
                </button>

                <button
                  disabled={!isMyTurn || me.sonarLeft <= 0}
                  onClick={() => {
                    playSound('tick');
                    setSelectedWeapon('sonar');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    selectedWeapon === 'sonar'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  } ${
                    isMyTurn && me.sonarLeft > 0 ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Radar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sonar 3×3</span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                    ×{me.sonarLeft}
                  </span>
                </button>

                <button
                  disabled={!isMyTurn || me.orbitalLeft <= 0}
                  onClick={() => {
                    playSound('tick');
                    setSelectedWeapon(selectedWeapon === 'orbital_row' ? 'orbital_col' : 'orbital_row');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  } ${
                    isMyTurn && me.orbitalLeft > 0 ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                  title="Click again to toggle Row vs Column beam"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Orbital {selectedWeapon === 'orbital_col' ? 'COL' : 'ROW'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                    ×{me.orbitalLeft}
                  </span>
                </button>
              </div>
            </div>

            {/* Dual Grids Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch min-h-0">
              {/* LEFT: ENEMY RADAR (Offensive Board) */}
              <div className="lg:col-span-6 bg-slate-900/80 border border-rose-500/25 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-rose-400" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      Enemy Radar · {opp.nickname}
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-rose-300">
                    {SHADOW_FLEET_SIZE - myHitsLanded} Hidden Left
                  </span>
                </div>

                <div
                  className="max-w-[330px] w-full mx-auto my-auto"
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-mono text-slate-500">
                    <div />
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <div key={c}>{c}</div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {ROW_LABELS.map((rowLabel, r) => (
                      <div key={rowLabel} className="grid grid-cols-7 gap-1 items-center">
                        <div className="text-[10px] font-mono text-slate-500 text-center">{rowLabel}</div>
                        {Array.from({ length: SHADOW_GRID_SIZE }).map((_, c) => {
                          const idx = r * SHADOW_GRID_SIZE + c;
                          const shot = myShotSet.has(idx);
                          const isHit = shot && oppFleetSet.has(idx);
                          const isMiss = shot && !oppFleetSet.has(idx);
                          const revealUnshot = state.status === 'finished' && !shot && oppFleetSet.has(idx);
                          const inPreview = previewCells.has(idx);
                          const sonarCount = mySonarMap.get(idx);

                          let cellClass =
                            'bg-slate-950/90 border-slate-800/90 text-slate-600 hover:border-slate-600';
                          if (isHit) {
                            cellClass =
                              'bg-rose-500/30 border-rose-400 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.45)]';
                          } else if (isMiss) {
                            cellClass = 'bg-slate-900/60 border-slate-800/70 text-slate-600';
                          } else if (revealUnshot) {
                            cellClass = 'bg-amber-500/20 border-amber-400/70 text-amber-300';
                          }

                          if (inPreview && isMyTurn) {
                            if (selectedWeapon === 'sonar') {
                              cellClass += ' ring-2 ring-cyan-400/80 bg-cyan-500/20';
                            } else if (selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col') {
                              cellClass += ' ring-2 ring-amber-400/90 bg-amber-500/25';
                            } else if (!shot) {
                              cellClass += ' ring-2 ring-rose-400/90 bg-rose-500/15';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              disabled={!isMyTurn || (selectedWeapon === 'strike' && shot)}
                              onMouseEnter={() => setHoveredCell(idx)}
                              onClick={() => handleEnemyCellClick(idx)}
                              className={`relative aspect-square rounded-lg border flex items-center justify-center transition-all ${cellClass} ${
                                isMyTurn && !(selectedWeapon === 'strike' && shot)
                                  ? 'cursor-crosshair'
                                  : 'cursor-default'
                              }`}
                              title={`${formatCoord(idx)}`}
                            >
                              {isHit && <Flame className="w-4 h-4 text-rose-400 fill-rose-400/40" />}
                              {isMiss && <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                              {revealUnshot && <Shield className="w-3.5 h-3.5 text-amber-300" />}
                              {sonarCount !== undefined && (
                                <span
                                  className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center border ${
                                    sonarCount > 0
                                      ? 'bg-cyan-500 text-slate-950 border-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                      : 'bg-slate-800 text-slate-400 border-slate-600'
                                  }`}
                                  title={`3×3 Sonar around ${formatCoord(idx)}: ${sonarCount} node(s)`}
                                >
                                  {sonarCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center mt-2">
                  {selectedWeapon === 'strike' && 'Click any unshot sector. Hits grant a CHAIN EXTRA TURN!'}
                  {selectedWeapon === 'sonar' && 'Click center tile to scan a 3×3 zone for hidden nodes.'}
                  {(selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col') &&
                    'Click any tile to fire a 6-cell Orbital Beam (tap Orbital button again to rotate).'}
                </p>
              </div>

              {/* RIGHT: YOUR FLEET + COMBAT FEED */}
              <div className="lg:col-span-6 grid grid-rows-[auto_1fr] gap-3 min-h-0">
                <div className="bg-slate-900/80 border border-emerald-500/25 rounded-2xl p-3.5 sm:p-4 shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">
                        Your Stealth Grid
                      </h2>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-300">
                      {SHADOW_FLEET_SIZE - oppHitsLanded}/{SHADOW_FLEET_SIZE} Intact
                    </span>
                  </div>

                  <div className="max-w-[260px] w-full mx-auto">
                    <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[9px] font-mono text-slate-500">
                      <div />
                      {[1, 2, 3, 4, 5, 6].map((c) => (
                        <div key={c}>{c}</div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {ROW_LABELS.map((rowLabel, r) => (
                        <div key={rowLabel} className="grid grid-cols-7 gap-1 items-center">
                          <div className="text-[9px] font-mono text-slate-500 text-center">{rowLabel}</div>
                          {Array.from({ length: SHADOW_GRID_SIZE }).map((_, c) => {
                            const idx = r * SHADOW_GRID_SIZE + c;
                            const hasNode = myFleetSet.has(idx);
                            const oppShot = oppShotSet.has(idx);
                            const destroyed = hasNode && oppShot;

                            return (
                              <div
                                key={idx}
                                className={`aspect-square rounded-md border flex items-center justify-center ${
                                  destroyed
                                    ? 'bg-rose-500/30 border-rose-500 text-rose-300'
                                    : hasNode
                                    ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-300'
                                    : oppShot
                                    ? 'bg-slate-900/60 border-slate-800 text-slate-600'
                                    : 'bg-slate-950/90 border-slate-800/80'
                                }`}
                              >
                                {destroyed && <Flame className="w-3 h-3 text-rose-400" />}
                                {hasNode && !destroyed && <Shield className="w-3 h-3 fill-emerald-400/20" />}
                                {!hasNode && oppShot && <span className="w-1 h-1 rounded-full bg-slate-600" />}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Compact Combat Log */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col min-h-[110px] overflow-hidden">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Tactical Feed
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
                    {state.logs.length === 0 ? (
                      <p className="text-slate-500 italic">Awaiting first strike…</p>
                    ) : (
                      state.logs.map((entry) => (
                        <div
                          key={entry.id}
                          className={`px-2 py-1 rounded-lg border text-[11px] ${
                            entry.hits > 0
                              ? 'bg-rose-500/10 border-rose-500/25 text-rose-200'
                              : entry.weapon === 'sonar'
                              ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-200'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                          }`}
                        >
                          {entry.summary}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MATCH OVER MODAL */}
      <AnimatePresence>
        {state.status === 'finished' && state.winnerIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 12 }}
              className="max-w-sm w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center shadow-2xl"
            >
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border ${
                  state.winnerIdx === meIdx
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-400 text-rose-300'
                }`}
              >
                {state.winnerIdx === meIdx ? (
                  <Trophy className="w-8 h-8" />
                ) : (
                  <Skull className="w-8 h-8" />
                )}
              </div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-1">
                {state.winnerIdx === meIdx ? 'Sector Cleared!' : 'Fleet Destroyed'}
              </h2>
              <p className="text-sm text-slate-400 mb-5">
                {state.winnerIdx === meIdx
                  ? `You eliminated all ${SHADOW_FLEET_SIZE} of ${opp?.nickname}'s stealth nodes.`
                  : `${opp?.nickname} located all ${SHADOW_FLEET_SIZE} of your stealth nodes first.`}
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Your Hits</div>
                  <div className="text-xl font-black text-emerald-400">
                    {myHitsLanded}/{SHADOW_FLEET_SIZE}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Enemy Hits</div>
                  <div className="text-xl font-black text-rose-400">
                    {oppHitsLanded}/{SHADOW_FLEET_SIZE}
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={onBack}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors cursor-pointer"
                >
                  Lobby
                </button>
                <button
                  onClick={onRematch}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Rematch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
