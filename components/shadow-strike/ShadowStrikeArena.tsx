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
        colors: ['#34d399', '#38bdf8', '#fbbf24', '#f4f4f5'],
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative select-none">
      {/* Subtle screen flash on hit/orbital/sonar */}
      <AnimatePresence>
        {impactFlash && (
          <motion.div
            initial={{ opacity: 0.25 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className={`pointer-events-none fixed inset-0 z-40 ${
              impactFlash === 'orbital'
                ? 'bg-amber-400/15'
                : impactFlash === 'sonar'
                ? 'bg-sky-400/15'
                : 'bg-rose-400/15'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Top HUD Bar */}
      <header className="relative z-10 shrink-0 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 transition-colors cursor-pointer"
            title="Leave Arena"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-emerald-400 shrink-0" />
              <h1 className="font-semibold tracking-tight text-sm sm:text-base text-zinc-50 truncate">
                Shadow Strike
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                {isSolo ? 'Solo vs AI' : '1v1 Live PvP'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden sm:block">
              6×6 Stealth Fleet · Chain-Hit Extra Turns · 3×3 Sonar &amp; Orbital Beam
            </p>
          </div>
        </div>

        {/* Center Score Strip */}
        <div className="flex items-center gap-2 sm:gap-4 bg-[#111113] border border-zinc-800/90 rounded-xl px-3.5 py-1.5">
          <div className="text-right">
            <div className="text-[10px] font-medium text-emerald-400 truncate max-w-[90px] sm:max-w-[120px]">
              {me?.nickname ?? 'You'}
            </div>
            <div className="text-sm sm:text-base font-semibold font-mono text-zinc-50 leading-none">
              {myHitsLanded}
              <span className="text-zinc-500 text-xs">/{SHADOW_FLEET_SIZE}</span>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-medium text-zinc-400">
            VS
          </div>

          <div className="text-left">
            <div className="text-[10px] font-medium text-rose-400 truncate max-w-[90px] sm:max-w-[120px]">
              {opp?.nickname ?? 'Waiting…'}
            </div>
            <div className="text-sm sm:text-base font-semibold font-mono text-zinc-50 leading-none">
              {oppHitsLanded}
              <span className="text-zinc-500 text-xs">/{SHADOW_FLEET_SIZE}</span>
            </div>
          </div>
        </div>

        {/* Right Room Code */}
        <div className="flex items-center gap-2">
          {roomCode && (
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-mono text-xs font-medium transition-colors cursor-pointer"
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
          <div className="max-w-md w-full mx-auto bg-[#111113] border border-zinc-800/90 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
              <Radar className="w-6 h-6 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 mb-1">
              Awaiting Rival Commander
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-5">
              Share this frequency code with a friend to start the 1v1 Shadow Strike duel.
            </p>
            {roomCode && (
              <button
                onClick={copyCode}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 flex items-center justify-center gap-3 font-mono text-2xl font-semibold tracking-[0.25em] text-zinc-100 transition-colors cursor-pointer mb-3"
              >
                <span>{roomCode}</span>
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-zinc-400" />}
              </button>
            )}
            <p className="text-xs text-zinc-500">
              Both players hide 6 stealth nodes, then hunt with Chain-Hit Strikes, 3×3 Sonar &amp; Orbital Beams.
            </p>
          </div>
        )}

        {/* SETUP PHASE */}
        {state.status === 'setup' && me && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center min-h-0">
            {/* Left: Interactive Fleet Placement Grid */}
            <div className="lg:col-span-7 bg-[#111113] border border-zinc-800/90 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Phase 1 · Stealth Deployment
                  </span>
                  <h2 className="text-lg font-semibold text-zinc-50">
                    Hide Your {SHADOW_FLEET_SIZE} Stealth Nodes
                  </h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono font-medium text-emerald-400">
                  {me.ready ? SHADOW_FLEET_SIZE : draftFleet.length} / {SHADOW_FLEET_SIZE} Placed
                </div>
              </div>

              <div className="max-w-[360px] mx-auto">
                {/* Column headers */}
                <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[10px] font-mono text-zinc-500">
                  <div />
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <div key={c}>{c}</div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {ROW_LABELS.map((rowLabel, r) => (
                    <div key={rowLabel} className="grid grid-cols-7 gap-1.5 items-center">
                      <div className="text-[10px] font-mono text-zinc-500 text-center">{rowLabel}</div>
                      {Array.from({ length: SHADOW_GRID_SIZE }).map((_, c) => {
                        const idx = r * SHADOW_GRID_SIZE + c;
                        const placed = myFleetSet.has(idx);
                        return (
                          <button
                            key={idx}
                            disabled={me.ready}
                            onClick={() => toggleDraftCell(idx)}
                            className={`aspect-square rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors ${
                              placed
                                ? 'bg-emerald-500/15 border-emerald-400/75 text-emerald-400'
                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 text-zinc-600'
                            } ${me.ready ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                          >
                            {placed ? <Shield className="w-4 h-4 fill-emerald-400/20" /> : null}
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
              <div className="bg-[#111113] border border-zinc-800/90 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Arsenal Briefing
                </h3>
                <div className="space-y-2 text-xs text-zinc-400">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <Crosshair className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-100">Chain-Hit Laser:</span> Hitting a stealth node grants an immediate <span className="text-rose-400 font-medium">extra turn</span>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <Radar className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-100">3×3 Sonar Ping (×2):</span> Reveals the exact count of enemy nodes inside a 3×3 square.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-100">Orbital Beam (×1):</span> Obliterates an entire Row or Column (6 cells) in one strike.
                    </div>
                  </div>
                </div>
              </div>

              {!me.ready ? (
                <div className="bg-[#111113] border border-zinc-800/90 rounded-2xl p-4 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleAutoDeploy}
                      className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                      Auto-Deploy
                    </button>
                    <button
                      onClick={handleClearFleet}
                      className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      Clear Grid
                    </button>
                  </div>
                  <button
                    onClick={handleLockFleet}
                    disabled={draftFleet.length !== SHADOW_FLEET_SIZE}
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                      draftFleet.length === SHADOW_FLEET_SIZE
                        ? 'bg-zinc-50 hover:bg-white text-zinc-950 cursor-pointer'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Lock Stealth Fleet ({draftFleet.length}/{SHADOW_FLEET_SIZE})
                  </button>
                </div>
              ) : (
                <div className="bg-[#111113] border border-emerald-500/40 rounded-2xl p-5 text-center">
                  <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-2 animate-pulse" />
                  <p className="font-semibold text-emerald-400 text-sm">
                    Fleet Locked &amp; Cloaked
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
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
            <div className="shrink-0 bg-[#111113] border border-zinc-800/90 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
              {/* Turn indicator */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                    state.status === 'finished'
                      ? state.winnerIdx === meIdx
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                        : 'bg-rose-500/15 border-rose-500/50 text-rose-400'
                      : isMyTurn
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {state.status === 'finished' ? (
                    state.winnerIdx === meIdx ? (
                      <>
                        <Trophy className="w-3.5 h-3.5" /> Victory
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
                  <p className="text-xs text-zinc-400 hidden md:block truncate max-w-[360px]">
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
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                    selectedWeapon === 'strike'
                      ? 'bg-rose-500/15 border-rose-400/70 text-rose-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-100'
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
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                    selectedWeapon === 'sonar'
                      ? 'bg-sky-500/15 border-sky-400/70 text-sky-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-100'
                  } ${
                    isMyTurn && me.sonarLeft > 0 ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Radar className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sonar 3×3</span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 font-mono text-[10px]">
                    ×{me.sonarLeft}
                  </span>
                </button>

                <button
                  disabled={!isMyTurn || me.orbitalLeft <= 0}
                  onClick={() => {
                    playSound('tick');
                    setSelectedWeapon(selectedWeapon === 'orbital_row' ? 'orbital_col' : 'orbital_row');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                    selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col'
                      ? 'bg-amber-500/15 border-amber-400/70 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-100'
                  } ${
                    isMyTurn && me.orbitalLeft > 0 ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                  title="Click again to toggle Row vs Column beam"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Orbital {selectedWeapon === 'orbital_col' ? 'COL' : 'ROW'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono text-[10px]">
                    ×{me.orbitalLeft}
                  </span>
                </button>
              </div>
            </div>

            {/* Dual Grids Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch min-h-0">
              {/* LEFT: ENEMY RADAR (Offensive Board) */}
              <div className="lg:col-span-6 bg-[#111113] border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-rose-400" />
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Enemy Radar · {opp.nickname}
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-rose-400">
                    {SHADOW_FLEET_SIZE - myHitsLanded} Hidden Left
                  </span>
                </div>

                <div
                  className="max-w-[330px] w-full mx-auto my-auto"
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-mono text-zinc-500">
                    <div />
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <div key={c}>{c}</div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {ROW_LABELS.map((rowLabel, r) => (
                      <div key={rowLabel} className="grid grid-cols-7 gap-1 items-center">
                        <div className="text-[10px] font-mono text-zinc-500 text-center">{rowLabel}</div>
                        {Array.from({ length: SHADOW_GRID_SIZE }).map((_, c) => {
                          const idx = r * SHADOW_GRID_SIZE + c;
                          const shot = myShotSet.has(idx);
                          const isHit = shot && oppFleetSet.has(idx);
                          const isMiss = shot && !oppFleetSet.has(idx);
                          const revealUnshot = state.status === 'finished' && !shot && oppFleetSet.has(idx);
                          const inPreview = previewCells.has(idx);
                          const sonarCount = mySonarMap.get(idx);

                          let cellClass =
                            'bg-zinc-950 border-zinc-800/90 text-zinc-600 hover:border-zinc-600';
                          if (isHit) {
                            cellClass = 'bg-rose-500/20 border-rose-400/75 text-rose-400';
                          } else if (isMiss) {
                            cellClass = 'bg-zinc-900/60 border-zinc-800/60 text-zinc-600';
                          } else if (revealUnshot) {
                            cellClass = 'bg-amber-500/15 border-amber-400/70 text-amber-400';
                          }

                          if (inPreview && isMyTurn) {
                            if (selectedWeapon === 'sonar') {
                              cellClass += ' ring-2 ring-sky-400/80 bg-sky-500/15';
                            } else if (selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col') {
                              cellClass += ' ring-2 ring-amber-400/80 bg-amber-500/15';
                            } else if (!shot) {
                              cellClass += ' ring-2 ring-rose-400/80 bg-rose-500/15';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              disabled={!isMyTurn || (selectedWeapon === 'strike' && shot)}
                              onMouseEnter={() => setHoveredCell(idx)}
                              onClick={() => handleEnemyCellClick(idx)}
                              className={`relative aspect-square rounded-lg border flex items-center justify-center transition-colors ${cellClass} ${
                                isMyTurn && !(selectedWeapon === 'strike' && shot)
                                  ? 'cursor-crosshair'
                                  : 'cursor-default'
                              }`}
                              title={`${formatCoord(idx)}`}
                            >
                              {isHit && <Flame className="w-4 h-4 text-rose-400 fill-rose-400/30" />}
                              {isMiss && <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />}
                              {revealUnshot && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                              {sonarCount !== undefined && (
                                <span
                                  className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center border ${
                                    sonarCount > 0
                                      ? 'bg-sky-400 text-zinc-950 border-sky-300'
                                      : 'bg-zinc-900 text-zinc-400 border-zinc-700'
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

                <p className="text-[11px] text-zinc-500 text-center mt-2">
                  {selectedWeapon === 'strike' && 'Click any unshot sector. Hits grant a chain extra turn.'}
                  {selectedWeapon === 'sonar' && 'Click center tile to scan a 3×3 zone for hidden nodes.'}
                  {(selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col') &&
                    'Click any tile to fire a 6-cell Orbital Beam (tap Orbital button again to rotate).'}
                </p>
              </div>

              {/* RIGHT: YOUR FLEET + COMBAT FEED */}
              <div className="lg:col-span-6 grid grid-rows-[auto_1fr] gap-3 min-h-0">
                <div className="bg-[#111113] border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-semibold text-zinc-100">
                        Your Stealth Grid
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-emerald-400">
                      {SHADOW_FLEET_SIZE - oppHitsLanded}/{SHADOW_FLEET_SIZE} Intact
                    </span>
                  </div>

                  <div className="max-w-[260px] w-full mx-auto">
                    <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[9px] font-mono text-zinc-500">
                      <div />
                      {[1, 2, 3, 4, 5, 6].map((c) => (
                        <div key={c}>{c}</div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {ROW_LABELS.map((rowLabel, r) => (
                        <div key={rowLabel} className="grid grid-cols-7 gap-1 items-center">
                          <div className="text-[9px] font-mono text-zinc-500 text-center">{rowLabel}</div>
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
                                    ? 'bg-rose-500/20 border-rose-500/75 text-rose-400'
                                    : hasNode
                                    ? 'bg-emerald-500/15 border-emerald-400/65 text-emerald-400'
                                    : oppShot
                                    ? 'bg-zinc-900/60 border-zinc-800/60 text-zinc-600'
                                    : 'bg-zinc-950 border-zinc-800/80'
                                }`}
                              >
                                {destroyed && <Flame className="w-3 h-3 text-rose-400" />}
                                {hasNode && !destroyed && <Shield className="w-3 h-3 fill-emerald-400/20" />}
                                {!hasNode && oppShot && <span className="w-1 h-1 rounded-full bg-zinc-700" />}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Compact Combat Log */}
                <div className="bg-[#111113] border border-zinc-800/90 rounded-2xl p-3.5 flex flex-col min-h-[110px] overflow-hidden">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Tactical Feed
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
                    {state.logs.length === 0 ? (
                      <p className="text-zinc-500 italic">Awaiting first strike…</p>
                    ) : (
                      state.logs.map((entry) => (
                        <div
                          key={entry.id}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${
                            entry.hits > 0
                              ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                              : entry.weapon === 'sonar'
                              ? 'bg-sky-500/10 border-sky-500/25 text-sky-300'
                              : 'bg-zinc-950 border-zinc-800/80 text-zinc-400'
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 12 }}
              className="max-w-sm w-full bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center"
            >
              <div
                className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center border ${
                  state.winnerIdx === meIdx
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                }`}
              >
                {state.winnerIdx === meIdx ? (
                  <Trophy className="w-7 h-7" />
                ) : (
                  <Skull className="w-7 h-7" />
                )}
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1">
                {state.winnerIdx === meIdx ? 'Sector Cleared' : 'Fleet Destroyed'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mb-5">
                {state.winnerIdx === meIdx
                  ? `You eliminated all ${SHADOW_FLEET_SIZE} of ${opp?.nickname}'s stealth nodes.`
                  : `${opp?.nickname} located all ${SHADOW_FLEET_SIZE} of your stealth nodes first.`}
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">Your Hits</div>
                  <div className="text-xl font-semibold font-mono text-emerald-400">
                    {myHitsLanded}/{SHADOW_FLEET_SIZE}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">Enemy Hits</div>
                  <div className="text-xl font-semibold font-mono text-rose-400">
                    {oppHitsLanded}/{SHADOW_FLEET_SIZE}
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={onBack}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-sm transition-colors cursor-pointer"
                >
                  Lobby
                </button>
                <button
                  onClick={onRematch}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
