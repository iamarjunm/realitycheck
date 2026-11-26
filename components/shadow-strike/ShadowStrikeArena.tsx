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
        colors: ['#34d399', '#e6c27a', '#d4a853', '#f5efe2'],
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#080d0b] atelier-bg text-[#f1ece1] flex flex-col relative select-none">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(16,120,84,0.16), transparent 65%), radial-gradient(ellipse 40% 35% at 88% 85%, rgba(212,168,83,0.09), transparent 60%)',
        }}
      />

      {/* Subtle screen flash on hit/orbital/sonar */}
      <AnimatePresence>
        {impactFlash && (
          <motion.div
            initial={{ opacity: 0.28 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className={`pointer-events-none fixed inset-0 z-40 ${
              impactFlash === 'orbital'
                ? 'bg-[#e6c27a]/20'
                : impactFlash === 'sonar'
                ? 'bg-emerald-400/18'
                : 'bg-[#e05263]/20'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Top HUD Bar */}
      <header className="relative z-20 shrink-0 border-b border-[#c9a55a]/18 bg-[#080d0b]/85 backdrop-blur-md px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="btn-obsidian p-2 rounded-xl text-[#e5dec9] cursor-pointer"
            title="Leave Arena"
          >
            <ArrowLeft className="w-4 h-4 text-[#d4a853]" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-emerald-400 shrink-0" />
              <h1 className="font-display font-bold tracking-tight text-sm sm:text-base text-[#f6f1e6] uppercase truncate">
                Shadow <span className="font-serif italic font-normal capitalize text-[#e6c27a]">Strike</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#0f1a16] text-emerald-300 border border-emerald-500/25">
                {isSolo ? 'Solo vs AI' : '1v1 Live PvP'}
              </span>
            </div>
            <p className="text-[11px] text-[#8d9a92] hidden sm:block">
              6×6 Naval War Table · Chain-Hit Extra Turns · 3×3 Sonar &amp; Orbital Beam
            </p>
          </div>
        </div>

        {/* Center Score Strip */}
        <div className="flex items-center gap-2 sm:gap-4 bg-[#0d1512] border border-[#c9a55a]/28 rounded-xl px-3.5 py-1.5 shadow-[inset_0_1px_0_rgba(230,194,122,0.14)]">
          <div className="text-right">
            <div className="text-[10px] font-mono font-medium text-emerald-400 truncate max-w-[90px] sm:max-w-[120px]">
              {me?.nickname ?? 'You'}
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-[#f6f1e6] leading-none">
              {myHitsLanded}
              <span className="text-[#77857d] text-xs">/{SHADOW_FLEET_SIZE}</span>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-md bg-[#080d0b] border border-[#c9a55a]/25 text-[10px] font-mono font-semibold text-[#e6c27a]">
            VS
          </div>

          <div className="text-left">
            <div className="text-[10px] font-mono font-medium text-[#f07687] truncate max-w-[90px] sm:max-w-[120px]">
              {opp?.nickname ?? 'Waiting…'}
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-[#f6f1e6] leading-none">
              {oppHitsLanded}
              <span className="text-[#77857d] text-xs">/{SHADOW_FLEET_SIZE}</span>
            </div>
          </div>
        </div>

        {/* Right Room Code */}
        <div className="flex items-center gap-2">
          {roomCode && (
            <button
              onClick={copyCode}
              className="btn-obsidian flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[#e6c27a] font-mono text-xs font-medium cursor-pointer"
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
          <div className="atelier-card max-w-md w-full mx-auto rounded-2xl border-[#c9a55a]/28 bg-gradient-to-b from-[#111a16]/95 to-[#0b100e]/95 p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#09120e] border border-emerald-500/35 flex items-center justify-center shadow-[inset_0_0_16px_rgba(16,185,129,0.18)]">
              <Radar className="w-6 h-6 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-[#f6f1e6] mb-1">
              Awaiting Rival <span className="font-serif italic font-normal text-[#e6c27a]">Commander</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#9ca8a1] mb-5">
              Share this frequency code with a friend to start the 1v1 Shadow Strike duel.
            </p>
            {roomCode && (
              <button
                onClick={copyCode}
                className="w-full py-3.5 px-4 rounded-xl bg-[#070c0a] border border-[#c9a55a]/30 hover:border-[#e6c27a]/70 flex items-center justify-center gap-3 font-mono text-2xl font-semibold tracking-[0.25em] text-[#e6c27a] transition-colors cursor-pointer mb-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]"
              >
                <span>{roomCode}</span>
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-[#c9a55a]" />}
              </button>
            )}
            <p className="text-xs text-[#808d85]">
              Both players hide 6 stealth nodes, then hunt with Chain-Hit Strikes, 3×3 Sonar &amp; Orbital Beams.
            </p>
          </div>
        )}

        {/* SETUP PHASE */}
        {state.status === 'setup' && me && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center min-h-0">
            {/* Left: Interactive Fleet Placement Grid */}
            <div style={{ transform: 'none' }} className="lg:col-span-7 atelier-card rounded-2xl border-[#c9a55a]/28 bg-gradient-to-b from-[#101815]/95 to-[#0a100d]/95 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
                    Phase 1 · Stealth Deployment
                  </span>
                  <h2 className="font-display text-lg font-bold text-[#f6f1e6]">
                    Hide Your {SHADOW_FLEET_SIZE} <span className="font-serif italic font-normal text-[#e6c27a]">Stealth Nodes</span>
                  </h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#09120e] border border-emerald-500/35 text-xs font-mono font-semibold text-emerald-300">
                  {me.ready ? SHADOW_FLEET_SIZE : draftFleet.length} / {SHADOW_FLEET_SIZE} Placed
                </div>
              </div>

              <div className="max-w-[375px] mx-auto rounded-xl border border-[#c9a55a]/22 bg-[#0a110e] p-3 shadow-[inset_0_2px_14px_rgba(0,0,0,0.7)]">
                {/* Column headers */}
                <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[10px] font-mono font-semibold text-[#c9a55a]/85">
                  <div />
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <div key={c}>{c}</div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {ROW_LABELS.map((rowLabel, r) => (
                    <div key={rowLabel} className="grid grid-cols-7 gap-1.5 items-center">
                      <div className="text-[10px] font-mono font-semibold text-[#c9a55a]/85 text-center">{rowLabel}</div>
                      {Array.from({ length: SHADOW_GRID_SIZE }).map((_, c) => {
                        const idx = r * SHADOW_GRID_SIZE + c;
                        const placed = myFleetSet.has(idx);
                        return (
                          <button
                            key={idx}
                            disabled={me.ready}
                            onClick={() => toggleDraftCell(idx)}
                            className={`aspect-square rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                              placed
                                ? 'bg-gradient-to-b from-[#134231] to-[#0a261c] border-emerald-400/75 text-emerald-300 shadow-[inset_0_1px_0_rgba(167,243,208,0.28),0_0_12px_rgba(16,185,129,0.2)]'
                                : 'bg-[#0d1612] border-[#263830] hover:border-[#c9a55a]/55 text-[#51635a] shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]'
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
              <div className="atelier-card rounded-2xl border-[#c9a55a]/22 bg-gradient-to-b from-[#101815]/95 to-[#0b100e]/95 p-4 space-y-3">
                <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#e6c27a]">
                  Arsenal Briefing
                </h3>
                <div className="space-y-2 text-xs text-[#a5b2aa]">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#080f0c] border border-[#e05263]/28">
                    <Crosshair className="w-4 h-4 text-[#f06b7c] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#f5efe2]">Chain-Hit Laser:</span> Hitting a stealth node grants an immediate <span className="text-[#f07687] font-medium">extra turn</span>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#080f0c] border border-emerald-500/28">
                    <Radar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#f5efe2]">3×3 Sonar Ping (×2):</span> Reveals the exact count of enemy nodes inside a 3×3 square.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#080f0c] border border-[#d4a853]/30">
                    <Zap className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#f5efe2]">Orbital Beam (×1):</span> Obliterates an entire Row or Column (6 cells) in one strike.
                    </div>
                  </div>
                </div>
              </div>

              {!me.ready ? (
                <div className="atelier-card rounded-2xl border-[#c9a55a]/22 bg-gradient-to-b from-[#101815]/95 to-[#0b100e]/95 p-4 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleAutoDeploy}
                      className="btn-obsidian py-2.5 px-3 rounded-xl text-[#e5dec9] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
                      Auto-Deploy
                    </button>
                    <button
                      onClick={handleClearFleet}
                      className="btn-obsidian py-2.5 px-3 rounded-xl text-[#e5dec9] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#f06b7c]" />
                      Clear Grid
                    </button>
                  </div>
                  <button
                    onClick={handleLockFleet}
                    disabled={draftFleet.length !== SHADOW_FLEET_SIZE}
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                      draftFleet.length === SHADOW_FLEET_SIZE
                        ? 'btn-brass cursor-pointer'
                        : 'bg-[#0b110e] border border-[#24302a] text-[#606d66] cursor-not-allowed'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Lock Stealth Fleet ({draftFleet.length}/{SHADOW_FLEET_SIZE})
                  </button>
                </div>
              ) : (
                <div className="atelier-card border-emerald-500/45 rounded-2xl p-5 text-center bg-[#0c1a14]/90">
                  <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-2 animate-pulse" />
                  <p className="font-semibold text-emerald-300 text-sm">
                    Fleet Locked &amp; Cloaked
                  </p>
                  <p className="text-xs text-[#9ca8a1] mt-1">
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
            {/* Turn Banner + Tactile Submarine Fire-Control Switchboard */}
            <div className="shrink-0 atelier-card rounded-2xl border-[#c9a55a]/25 bg-gradient-to-b from-[#101815]/95 to-[#0b100e]/95 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
              {/* Turn indicator */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                    state.status === 'finished'
                      ? state.winnerIdx === meIdx
                        ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300'
                        : 'bg-[#3d111b] border-[#e05263]/60 text-[#fda4af]'
                      : isMyTurn
                      ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.2)]'
                      : 'bg-[#0b110e] border-[#c9a55a]/20 text-[#96a39b]'
                  }`}
                >
                  {state.status === 'finished' ? (
                    state.winnerIdx === meIdx ? (
                      <>
                        <Trophy className="w-3.5 h-3.5 text-[#e6c27a]" /> Victory
                      </>
                    ) : (
                      <>
                        <Skull className="w-3.5 h-3.5" /> Defeated
                      </>
                    )
                  ) : isMyTurn ? (
                    <>
                      <Flame className="w-3.5 h-3.5 text-[#e6c27a]" /> Your Strike
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> {opp.nickname}&apos;s Turn…
                    </>
                  )}
                </div>

                {state.lastAction && (
                  <p className="text-xs text-[#a5b2aa] hidden md:block truncate max-w-[360px]">
                    {state.lastAction.summary}
                  </p>
                )}
              </div>

              {/* Tactile Weapon Switches */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  disabled={!isMyTurn}
                  onClick={() => {
                    playSound('tick');
                    setSelectedWeapon('strike');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    selectedWeapon === 'strike'
                      ? 'bg-gradient-to-b from-[#591625] to-[#340c16] border-[#f06b7c]/80 text-[#ffe4e8] shadow-[inset_0_1px_0_rgba(255,220,225,0.28),0_2px_10px_rgba(224,82,99,0.25)]'
                      : 'bg-[#09100d] border-[#26362e] text-[#97a49c] hover:text-[#f1ece1]'
                  } ${isMyTurn ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <Crosshair className="w-3.5 h-3.5 text-[#f06b7c]" />
                  <span>Laser</span>
                </button>

                <button
                  disabled={!isMyTurn || me.sonarLeft <= 0}
                  onClick={() => {
                    playSound('tick');
                    setSelectedWeapon('sonar');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    selectedWeapon === 'sonar'
                      ? 'bg-gradient-to-b from-[#134231] to-[#0a261c] border-emerald-400/80 text-emerald-200 shadow-[inset_0_1px_0_rgba(167,243,208,0.28),0_2px_10px_rgba(16,185,129,0.25)]'
                      : 'bg-[#09100d] border-[#26362e] text-[#97a49c] hover:text-[#f1ece1]'
                  } ${
                    isMyTurn && me.sonarLeft > 0 ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Radar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sonar 3×3</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                    ×{me.sonarLeft}
                  </span>
                </button>

                <button
                  disabled={!isMyTurn || me.orbitalLeft <= 0}
                  onClick={() => {
                    playSound('tick');
                    setSelectedWeapon(selectedWeapon === 'orbital_row' ? 'orbital_col' : 'orbital_row');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col'
                      ? 'bg-gradient-to-b from-[#f0d088] to-[#b98a36] border-[#f8e3b0] text-[#141008] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_12px_rgba(230,194,122,0.35)]'
                      : 'bg-[#09100d] border-[#26362e] text-[#97a49c] hover:text-[#f1ece1]'
                  } ${
                    isMyTurn && me.orbitalLeft > 0 ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                  title="Click again to toggle Row vs Column beam"
                >
                  <Zap className={`w-3.5 h-3.5 ${selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col' ? 'text-[#141008]' : 'text-[#e6c27a]'}`} />
                  <span>
                    Orbital {selectedWeapon === 'orbital_col' ? 'COL' : 'ROW'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                    selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col'
                      ? 'bg-[#141008]/20 text-[#141008]'
                      : 'bg-[#d4a853]/18 text-[#e6c27a]'
                  }`}>
                    ×{me.orbitalLeft}
                  </span>
                </button>
              </div>
            </div>

            {/* Dual Naval Plotting Tables Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch min-h-0">
              {/* LEFT: ENEMY RADAR (Offensive Board) */}
              <div style={{ transform: 'none' }} className="lg:col-span-6 atelier-card rounded-2xl border-[#c9a55a]/25 bg-gradient-to-b from-[#101815]/95 to-[#0a100d]/95 p-3.5 sm:p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-[#f06b7c]" />
                    <h2 className="font-display text-sm font-bold text-[#f6f1e6]">
                      Enemy Radar · <span className="font-serif italic font-normal text-[#e6c27a]">{opp.nickname}</span>
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#f07687]">
                    {SHADOW_FLEET_SIZE - myHitsLanded} Hidden Left
                  </span>
                </div>

                <div
                  className="max-w-[345px] w-full mx-auto my-auto rounded-xl border border-[#c9a55a]/22 bg-[#09100d] p-2.5 shadow-[inset_0_2px_14px_rgba(0,0,0,0.7)]"
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-mono font-semibold text-[#c9a55a]/85">
                    <div />
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <div key={c}>{c}</div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {ROW_LABELS.map((rowLabel, r) => (
                      <div key={rowLabel} className="grid grid-cols-7 gap-1 items-center">
                        <div className="text-[10px] font-mono font-semibold text-[#c9a55a]/85 text-center">{rowLabel}</div>
                        {Array.from({ length: SHADOW_GRID_SIZE }).map((_, c) => {
                          const idx = r * SHADOW_GRID_SIZE + c;
                          const shot = myShotSet.has(idx);
                          const isHit = shot && oppFleetSet.has(idx);
                          const isMiss = shot && !oppFleetSet.has(idx);
                          const revealUnshot = state.status === 'finished' && !shot && oppFleetSet.has(idx);
                          const inPreview = previewCells.has(idx);
                          const sonarCount = mySonarMap.get(idx);

                          let cellClass =
                            'bg-[#0e1814] border-[#25372f] text-[#52655c] hover:border-[#c9a55a]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
                          if (isHit) {
                            cellClass =
                              'bg-gradient-to-b from-[#541422] to-[#300a13] border-[#e05263]/80 text-[#fda4af] shadow-[inset_0_0_12px_rgba(225,29,72,0.35)]';
                          } else if (isMiss) {
                            cellClass = 'bg-[#080e0c] border-[#19241f] text-[#3f5048]';
                          } else if (revealUnshot) {
                            cellClass = 'bg-[#2a2112] border-[#e6c27a]/75 text-[#e6c27a]';
                          }

                          if (inPreview && isMyTurn) {
                            if (selectedWeapon === 'sonar') {
                              cellClass += ' ring-2 ring-emerald-400/85 bg-emerald-950/60';
                            } else if (selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col') {
                              cellClass += ' ring-2 ring-[#e6c27a]/90 bg-[#362912]/70';
                            } else if (!shot) {
                              cellClass += ' ring-2 ring-[#f06b7c]/85 bg-[#471420]/65';
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
                              {isHit && <Flame className="w-4 h-4 text-[#fda4af] fill-[#e05263]/45" />}
                              {isMiss && <span className="w-1.5 h-1.5 rounded-full bg-[#3e5248]" />}
                              {revealUnshot && <Shield className="w-3.5 h-3.5 text-[#e6c27a]" />}
                              {sonarCount !== undefined && (
                                <span
                                  className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center border shadow-sm ${
                                    sonarCount > 0
                                      ? 'bg-gradient-to-b from-[#f2d48f] to-[#b88936] text-[#141008] border-[#faebbf]'
                                      : 'bg-[#121e19] text-[#8da196] border-[#2c4037]'
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

                <p className="text-[11px] text-[#8d9a92] text-center mt-2">
                  {selectedWeapon === 'strike' && 'Click any unshot sector. Hits grant a chain extra turn.'}
                  {selectedWeapon === 'sonar' && 'Click center tile to scan a 3×3 zone for hidden nodes.'}
                  {(selectedWeapon === 'orbital_row' || selectedWeapon === 'orbital_col') &&
                    'Click any tile to fire a 6-cell Orbital Beam (tap Orbital button again to rotate).'}
                </p>
              </div>

              {/* RIGHT: YOUR FLEET + COMBAT FEED */}
              <div className="lg:col-span-6 grid grid-rows-[auto_1fr] gap-3 min-h-0">
                <div className="atelier-card rounded-2xl border-[#c9a55a]/25 bg-gradient-to-b from-[#101815]/95 to-[#0a100d]/95 p-3.5 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <h2 className="font-display text-sm font-bold text-[#f6f1e6]">
                        Your <span className="font-serif italic font-normal text-[#e6c27a]">Stealth Grid</span>
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-emerald-300">
                      {SHADOW_FLEET_SIZE - oppHitsLanded}/{SHADOW_FLEET_SIZE} Intact
                    </span>
                  </div>

                  <div className="max-w-[270px] w-full mx-auto rounded-xl border border-[#c9a55a]/18 bg-[#09100d] p-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.65)]">
                    <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[9px] font-mono font-semibold text-[#c9a55a]/80">
                      <div />
                      {[1, 2, 3, 4, 5, 6].map((c) => (
                        <div key={c}>{c}</div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {ROW_LABELS.map((rowLabel, r) => (
                        <div key={rowLabel} className="grid grid-cols-7 gap-1 items-center">
                          <div className="text-[9px] font-mono font-semibold text-[#c9a55a]/80 text-center">{rowLabel}</div>
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
                                    ? 'bg-gradient-to-b from-[#541422] to-[#300a13] border-[#e05263]/80 text-[#fda4af]'
                                    : hasNode
                                    ? 'bg-gradient-to-b from-[#134231] to-[#0a261c] border-emerald-400/70 text-emerald-300'
                                    : oppShot
                                    ? 'bg-[#080e0c] border-[#1a2621] text-[#3f5048]'
                                    : 'bg-[#0e1713] border-[#22332b]'
                                }`}
                              >
                                {destroyed && <Flame className="w-3 h-3 text-[#fda4af]" />}
                                {hasNode && !destroyed && <Shield className="w-3 h-3 fill-emerald-400/25" />}
                                {!hasNode && oppShot && <span className="w-1 h-1 rounded-full bg-[#3e5248]" />}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Compact Combat Log */}
                <div className="atelier-card rounded-2xl border-[#c9a55a]/22 bg-gradient-to-b from-[#101815]/95 to-[#0a100d]/95 p-3.5 flex flex-col min-h-[110px] overflow-hidden">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#e6c27a] mb-1.5">
                    Sonar &amp; Strike Log
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
                    {state.logs.length === 0 ? (
                      <p className="text-[#7c8a82] italic">Awaiting first strike…</p>
                    ) : (
                      state.logs.map((entry) => (
                        <div
                          key={entry.id}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${
                            entry.hits > 0
                              ? 'bg-[#3b121c]/65 border-[#e05263]/35 text-[#ffc2cb]'
                              : entry.weapon === 'sonar'
                              ? 'bg-[#102920]/70 border-emerald-500/35 text-emerald-200'
                              : 'bg-[#080e0c] border-[#1f2e27] text-[#97a49c]'
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
              className="atelier-card max-w-sm w-full rounded-2xl border-[#c9a55a]/35 bg-gradient-to-b from-[#121c18] to-[#0a100d] p-6 text-center"
            >
              <div
                className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center border ${
                  state.winnerIdx === meIdx
                    ? 'bg-emerald-950/80 border-emerald-400/55 text-[#e6c27a]'
                    : 'bg-[#3d111b] border-[#e05263]/55 text-[#fda4af]'
                }`}
              >
                {state.winnerIdx === meIdx ? (
                  <Trophy className="w-7 h-7" />
                ) : (
                  <Skull className="w-7 h-7" />
                )}
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#f6f1e6] mb-1">
                {state.winnerIdx === meIdx ? (
                  <>
                    Sector <span className="font-serif italic font-normal text-[#e6c27a]">Cleared</span>
                  </>
                ) : (
                  <>
                    Fleet <span className="font-serif italic font-normal text-[#f07687]">Destroyed</span>
                  </>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-[#9ea9a2] mb-5">
                {state.winnerIdx === meIdx
                  ? `You eliminated all ${SHADOW_FLEET_SIZE} of ${opp?.nickname}'s stealth nodes.`
                  : `${opp?.nickname} located all ${SHADOW_FLEET_SIZE} of your stealth nodes first.`}
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="p-3 rounded-xl bg-[#080e0c] border border-[#c9a55a]/22">
                  <div className="text-[10px] font-mono uppercase text-[#8a9790]">Your Hits</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {myHitsLanded}/{SHADOW_FLEET_SIZE}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#080e0c] border border-[#c9a55a]/22">
                  <div className="text-[10px] font-mono uppercase text-[#8a9790]">Enemy Hits</div>
                  <div className="text-xl font-bold font-mono text-[#f07687]">
                    {oppHitsLanded}/{SHADOW_FLEET_SIZE}
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={onBack}
                  className="btn-obsidian flex-1 py-2.5 rounded-xl text-[#e5dec9] font-medium text-sm cursor-pointer"
                >
                  Lobby
                </button>
                <button
                  onClick={onRematch}
                  className="btn-brass flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
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
