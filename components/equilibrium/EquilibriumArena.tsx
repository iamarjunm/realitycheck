'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Brain,
  Calculator,
  Check,
  Copy,
  Flame,
  Heart,
  Lock,
  RotateCcw,
  Shield,
  Sigma,
  Skull,
  Sparkles,
  Trophy,
  Zap,
  FlipHorizontal2,
  ArrowUpRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sounds';
import {
  EQUATION_LAWS,
  EquilibriumProtocol,
  EquilibriumState,
  evaluateEquilibriumRound,
  isPrimeNumber,
} from '@/lib/equilibrium';

interface EquilibriumArenaProps {
  state: EquilibriumState;
  meIdx: number;
  roomCode?: string;
  isSolo?: boolean;
  onBack: () => void;
  onLockChoice: (num: number, protocol: EquilibriumProtocol) => void;
  onNextRound: () => void;
  onRematch: () => void;
}

const PROTOCOLS: {
  id: Exclude<EquilibriumProtocol, 'none'>;
  name: string;
  short: string;
  desc: string;
  icon: typeof Zap;
  color: string;
}[] = [
  {
    id: 'shift_plus',
    name: 'SHIFT +15',
    short: '+15 Target',
    desc: 'Secretly adds +15 to the computed Equilibrium Target.',
    icon: ArrowUpRight,
    color: 'amber',
  },
  {
    id: 'mirror_flip',
    name: 'MIRROR LOCK',
    short: 'Flip if >50',
    desc: 'If rival plays > 50, your number flips to (100 − N).',
    icon: FlipHorizontal2,
    color: 'fuchsia',
  },
  {
    id: 'noise_shield',
    name: 'NOISE SHIELD',
    short: 'Block Loss',
    desc: 'Cancels normal round damage if you lose (bypassed by Bullseye).',
    icon: Shield,
    color: 'cyan',
  },
];

const QUICK_PICKS = [0, 17, 25, 37, 50, 67, 83, 100];

export default function EquilibriumArena({
  state,
  meIdx,
  roomCode,
  isSolo = false,
  onBack,
  onLockChoice,
  onNextRound,
  onRematch,
}: EquilibriumArenaProps) {
  const [selectedNum, setSelectedNum] = useState<number>(37);
  const [selectedProto, setSelectedProto] = useState<EquilibriumProtocol>('none');
  const [simOppNum, setSimOppNum] = useState<number>(50);
  const [copied, setCopied] = useState(false);

  const prevStatusRef = useRef(state.status);
  const prevRoundRef = useRef(state.round);

  const me = state.players[meIdx];
  const oppIdx = meIdx === 0 ? 1 : 0;
  const opp = state.players[oppIdx];
  const law = EQUATION_LAWS[state.currentLawId];

  const isLocked = me?.lockedNumber !== null;
  const oppLocked = opp?.lockedNumber !== null;

  // Reset local protocol when new round starts
  useEffect(() => {
    if (state.round !== prevRoundRef.current || (state.status === 'picking' && prevStatusRef.current !== 'picking')) {
      setSelectedProto('none');
    }
    prevRoundRef.current = state.round;
  }, [state.round, state.status]);

  // SFX & confetti on phase transitions
  useEffect(() => {
    if (state.status === 'reveal' && prevStatusRef.current !== 'reveal') {
      const s = state.lastSummary;
      if (s) {
        if (s.winnerIdx === meIdx) playSound('rule_check');
        else if (s.winnerIdx === 'paradox') playSound('paradox');
        else if (s.winnerIdx === 'draw') playSound('chip');
        else playSound('hit');
      }
    }
    if (state.status === 'finished' && prevStatusRef.current !== 'finished') {
      if (state.winnerIdx === meIdx) {
        playSound('win');
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#22d3ee', '#a855f7', '#fbbf24'],
        });
      } else {
        playSound('fold');
      }
    }
    prevStatusRef.current = state.status;
  }, [state.status, state.lastSummary, state.winnerIdx, meIdx]);

  // Live "What-If" simulator
  const simResult = useMemo(() => {
    return evaluateEquilibriumRound(
      state.round,
      state.currentLawId,
      selectedNum,
      simOppNum,
      selectedProto,
      'none'
    );
  }, [state.round, state.currentLawId, selectedNum, simOppNum, selectedProto]);

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    playSound('tick');
    setTimeout(() => setCopied(false), 1800);
  };

  const handleConfirmLock = () => {
    if (!me || isLocked) return;
    playSound('shield');
    onLockChoice(selectedNum, selectedProto);
  };

  const summary = state.lastSummary;
  const myRevealNum = summary ? (meIdx === 0 ? summary.effP0 : summary.effP1) : 0;
  const oppRevealNum = summary ? (meIdx === 0 ? summary.effP1 : summary.effP0) : 0;

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative select-none selection:bg-amber-500/20">
      {/* Top HUD */}
      <header className="relative z-10 shrink-0 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Leave Arena"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sigma className="w-4 h-4 text-amber-400 shrink-0" />
              <h1 className="font-semibold tracking-tight text-sm sm:text-base text-zinc-50 truncate">
                Equilibrium
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-[#111113] text-zinc-300 border border-zinc-800">
                {isSolo ? 'Solo vs EULER-AI' : '1v1 Game Theory'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 hidden sm:block">
              Round {state.round} · Dynamic Nash Equations · Exact-Match Paradox
            </p>
          </div>
        </div>

        {/* Center HP Scoreboard */}
        <div className="flex items-center gap-3 sm:gap-5 bg-[#111113] border border-zinc-800 rounded-xl px-3.5 py-1.5">
          {/* Me */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold max-w-[90px] truncate">
                {me?.nickname ?? 'You'}
              </div>
              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                {Array.from({ length: me?.maxHp ?? 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 transition-colors ${
                      i < (me?.hp ?? 0)
                        ? 'text-emerald-400 fill-emerald-400'
                        : 'text-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-semibold text-zinc-400 tabular-nums">
            R{state.round}
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-2">
            <div className="text-left">
              <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold max-w-[90px] truncate">
                {opp?.nickname ?? 'Awaiting…'}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: opp?.maxHp ?? 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 transition-colors ${
                      i < (opp?.hp ?? 0)
                        ? 'text-rose-500 fill-rose-500'
                        : 'text-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Room Code */}
        <div className="flex items-center gap-2">
          {roomCode && (
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#111113] border border-zinc-800 hover:border-zinc-700 text-amber-300 font-mono text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-center p-3 sm:p-4 max-w-6xl w-full mx-auto">
        {/* WAITING */}
        {state.status === 'waiting' && (
          <div className="max-w-md w-full mx-auto rounded-2xl border border-zinc-800 bg-[#111113] p-7 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
              <Sigma className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 mb-1">
              Awaiting Rival Mind
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-5">
              Share this room code for a 1v1 Equilibrium game-theory showdown.
            </p>
            {roomCode && (
              <button
                onClick={copyCode}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 hover:border-amber-400/60 flex items-center justify-center gap-3 font-mono text-2xl font-bold tracking-[0.25em] text-amber-300 transition-colors cursor-pointer mb-3"
              >
                <span>{roomCode}</span>
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-zinc-400" />}
              </button>
            )}
            <p className="text-xs font-mono text-zinc-500">
              5 Dynamic Laws · Bullseye (±1) Deals -2 HP · Exact-Match Paradox Hurts Both
            </p>
          </div>
        )}

        {/* PICKING PHASE */}
        {state.status === 'picking' && me && opp && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch min-h-0">
            {/* LEFT 8 COLS: Active Law + Number Dial + Protocols */}
            <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
              {/* Active Equation Law Banner */}
              <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-zinc-300">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Active Law · Round {state.round}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                    {law.twistLabel}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50">
                    {law.name}
                  </h2>
                  <div className="font-mono text-base sm:text-lg font-semibold text-amber-300 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-xl tabular-nums">
                    {law.formulaLabel}
                  </div>
                </div>
                <p className="text-xs text-zinc-300 mt-2">
                  {law.shortRule} <span className="text-zinc-500">· Bullseye (±1 of Target) deals -2 HP · Same number = Paradox (-1 HP both).</span>
                </p>
              </div>

              {/* Number Dial Panel */}
              <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      Select Integer (0 – 100)
                    </div>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span className="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-zinc-50 tabular-nums">
                        {isLocked ? me.lockedNumber : selectedNum}
                      </span>
                      {isPrimeNumber(isLocked ? (me.lockedNumber ?? 0) : selectedNum) && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/35 text-amber-300 text-[10px] font-mono font-semibold uppercase tracking-wider">
                          PRIME
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direct +/- fine tune & direct input */}
                  {!isLocked && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          playSound('tick');
                          setSelectedNum((n) => Math.max(0, n - 1));
                        }}
                        className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-mono font-bold text-lg text-zinc-100 transition-colors cursor-pointer"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={selectedNum}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (Number.isNaN(v)) setSelectedNum(0);
                          else setSelectedNum(Math.max(0, Math.min(100, v)));
                        }}
                        className="w-16 h-10 text-center rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-400 font-mono font-bold text-lg text-zinc-100 tabular-nums focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => {
                          playSound('tick');
                          setSelectedNum((n) => Math.min(100, n + 1));
                        }}
                        className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-mono font-bold text-lg text-zinc-100 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Slider + Quick Picks */}
                {!isLocked ? (
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={selectedNum}
                      onChange={(e) => setSelectedNum(Number(e.target.value))}
                      className="w-full accent-amber-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PICKS.map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            playSound('tick');
                            setSelectedNum(q);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                            selectedNum === q
                              ? 'bg-zinc-50 text-zinc-950 border-zinc-50'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                      <Lock className="w-4 h-4" />
                      Number &amp; Protocol Locked In
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      {oppLocked ? 'Resolving equation…' : `Waiting for ${opp.nickname}…`}
                    </span>
                  </div>
                )}

                {/* 1-Use IQ Protocols */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">
                    Optional 1-Use IQ Protocol (Once per match)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PROTOCOLS.map((p) => {
                      const Icon = p.icon;
                      const alreadyUsed = me.usedProtocols.includes(p.id);
                      const active = (isLocked ? me.lockedProtocol : selectedProto) === p.id;
                      return (
                        <button
                          key={p.id}
                          disabled={isLocked || alreadyUsed}
                          onClick={() => {
                            playSound('card_pick');
                            setSelectedProto((curr) => (curr === p.id ? 'none' : p.id));
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-colors ${
                            alreadyUsed
                              ? 'bg-zinc-950/60 border-zinc-900 opacity-40 cursor-not-allowed'
                              : active
                              ? 'bg-amber-500/10 border-amber-400/70 cursor-pointer'
                              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 cursor-pointer'
                          }`}
                          title={p.desc}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-400' : 'text-zinc-400'}`} />
                            <span className={`text-[9px] font-mono uppercase ${active ? 'text-amber-300 font-semibold' : 'text-zinc-500'}`}>
                              {alreadyUsed ? 'USED' : active ? 'ARMED' : '1×'}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-zinc-100">{p.name}</div>
                          <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">{p.short}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lock CTA */}
                {!isLocked && (
                  <button
                    onClick={handleConfirmLock}
                    className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold tracking-wide text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    Lock {selectedNum}
                    {selectedProto !== 'none' ? ` + ${selectedProto.replace('_', ' ').toUpperCase()}` : ''}
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT 4 COLS: Live Mental-Math Sandbox + Match History */}
            <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
              {/* Interactive What-If Simulator */}
              <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-200">
                    <Calculator className="w-3.5 h-3.5 text-amber-400" /> Nash Sandbox
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Test Rival Pick</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">If {opp.nickname} picks:</span>
                    <span className="font-mono font-bold text-rose-400 tabular-nums">{simOppNum}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={simOppNum}
                    onChange={(e) => setSimOppNum(Number(e.target.value))}
                    className="w-full accent-rose-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">Target</div>
                    <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-0.5">
                      {simResult.finalTarget}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">Outcome</div>
                    <div
                      className={`text-xs font-mono font-bold uppercase mt-2 ${
                        simResult.winnerIdx === 0
                          ? 'text-emerald-400'
                          : simResult.winnerIdx === 1
                          ? 'text-rose-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {simResult.winnerIdx === 0
                        ? `YOU WIN (-${simResult.dmgToP1})`
                        : simResult.winnerIdx === 1
                        ? `RIVAL (-${simResult.dmgToP0})`
                        : simResult.winnerIdx === 'paradox'
                        ? 'PARADOX (-1)'
                        : 'DRAW'}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-mono text-zinc-400 leading-snug">{simResult.specialNote}</p>
              </div>

              {/* Rival Status + History Log */}
              <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-4 flex-1 flex flex-col min-h-[150px] overflow-hidden">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Round Ledger
                  </span>
                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${
                      oppLocked
                        ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {oppLocked ? `${opp.nickname}: LOCKED` : `${opp.nickname}: THINKING`}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {state.history.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No rounds resolved yet. Read your rival&apos;s pattern.
                    </p>
                  ) : (
                    state.history.map((h) => {
                      const myN = meIdx === 0 ? h.effP0 : h.effP1;
                      const oppN = meIdx === 0 ? h.effP1 : h.effP0;
                      const iWon = h.winnerIdx === meIdx;
                      return (
                        <div
                          key={h.round}
                          className={`p-2 rounded-xl border text-[11px] font-mono tabular-nums flex items-center justify-between ${
                            iWon
                              ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-200'
                              : h.winnerIdx === 'paradox'
                              ? 'bg-amber-500/[0.08] border-amber-500/30 text-amber-200'
                              : h.winnerIdx === 'draw'
                              ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                              : 'bg-rose-500/[0.08] border-rose-500/30 text-rose-200'
                          }`}
                        >
                          <span>
                            R{h.round}: You <b className="text-zinc-50">{myN}</b> vs <b className="text-zinc-50">{oppN}</b>
                          </span>
                          <span className="text-amber-400 font-semibold">T={h.finalTarget}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVEAL PHASE */}
        {state.status === 'reveal' && summary && me && opp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl w-full mx-auto rounded-2xl border border-zinc-800 bg-[#111113] p-5 sm:p-7 space-y-5"
          >
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-zinc-300">
                Round {summary.round} · {EQUATION_LAWS[summary.lawId].name}
              </div>
              <h2
                className={`text-2xl sm:text-4xl font-semibold tracking-tight ${
                  summary.winnerIdx === meIdx
                    ? 'text-emerald-400'
                    : summary.winnerIdx === 'paradox'
                    ? 'text-amber-400'
                    : summary.winnerIdx === 'draw'
                    ? 'text-zinc-200'
                    : 'text-rose-400'
                }`}
              >
                {summary.winnerIdx === meIdx
                  ? 'You Solved The Rival'
                  : summary.winnerIdx === 'paradox'
                  ? 'Exact-Match Paradox'
                  : summary.winnerIdx === 'draw'
                  ? 'Perfect Stalemate'
                  : `${opp.nickname} Outcalculated You`}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">{summary.specialNote}</p>
            </div>

            {/* 3 Stat Reveal Boxes */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/35">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">{me.nickname}</div>
                <div className="text-4xl font-bold font-mono text-zinc-50 tabular-nums mt-1">{myRevealNum}</div>
                <div className="text-[11px] font-mono text-zinc-500 tabular-nums mt-1">
                  Δ {Math.abs(myRevealNum - summary.finalTarget)} from T
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/[0.08] border border-amber-400/50">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Equilibrium Target</div>
                <div className="text-4xl font-bold font-mono text-amber-300 tabular-nums mt-1">
                  {summary.finalTarget}
                </div>
                <div className="text-[10px] font-mono text-amber-300/75 mt-1">
                  {EQUATION_LAWS[summary.lawId].formulaLabel}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-rose-500/35">
                <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400">{opp.nickname}</div>
                <div className="text-4xl font-bold font-mono text-zinc-50 tabular-nums mt-1">{oppRevealNum}</div>
                <div className="text-[11px] font-mono text-zinc-500 tabular-nums mt-1">
                  Δ {Math.abs(oppRevealNum - summary.finalTarget)} from T
                </div>
              </div>
            </div>

            {/* Visual 0–100 Number Line */}
            <div className="pt-5 pb-2 px-2">
              <div className="relative h-2.5 rounded-full bg-zinc-950 border border-zinc-800">
                {/* Target needle marker */}
                <motion.div
                  initial={{ left: '50%', scale: 0 }}
                  animate={{ left: `${summary.finalTarget}%`, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400 border-2 border-zinc-950 ring-2 ring-amber-400/40 z-30"
                  title={`Target: ${summary.finalTarget}`}
                />
                {/* My marker */}
                <motion.div
                  initial={{ left: '0%' }}
                  animate={{ left: `${myRevealNum}%` }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-7 -translate-x-1/2 flex flex-col items-center z-20"
                >
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-zinc-950 font-mono text-[10px] font-bold tabular-nums">
                    YOU {myRevealNum}
                  </span>
                </motion.div>
                {/* Opp marker */}
                <motion.div
                  initial={{ left: '100%' }}
                  animate={{ left: `${oppRevealNum}%` }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-4 -translate-x-1/2 flex flex-col items-center z-20"
                >
                  <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px] font-bold tabular-nums">
                    RIVAL {oppRevealNum}
                  </span>
                </motion.div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 tabular-nums mt-8">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            <button
              onClick={() => {
                playSound('deal');
                onNextRound();
              }}
              disabled={!isSolo && state.readyForNext?.[meIdx]}
              className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-4 h-4" />
              {!isSolo && state.readyForNext?.[meIdx]
                ? `Waiting for ${opp.nickname}…`
                : 'Next Equation Law'}
            </button>
          </motion.div>
        )}
      </main>

      {/* MATCH OVER MODAL */}
      <AnimatePresence>
        {state.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-sm w-full rounded-2xl border border-zinc-800 bg-[#111113] p-6 text-center"
            >
              <div
                className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center border ${
                  state.winnerIdx === meIdx
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : state.winnerIdx === null
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                }`}
              >
                {state.winnerIdx === meIdx ? (
                  <Trophy className="w-7 h-7" />
                ) : state.winnerIdx === null ? (
                  <Brain className="w-7 h-7" />
                ) : (
                  <Skull className="w-7 h-7" />
                )}
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1">
                {state.winnerIdx === meIdx
                  ? 'Grandmaster Victory'
                  : state.winnerIdx === null
                  ? 'Mutual Annihilation'
                  : 'Out-Solved'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mb-5">
                {state.winnerIdx === meIdx
                  ? `You broke ${opp?.nickname}'s equilibrium in ${state.round} rounds.`
                  : state.winnerIdx === null
                  ? 'Both minds collapsed simultaneously on the final paradox.'
                  : `${opp?.nickname} reached 0-error dominance first.`}
              </p>

              <div className="flex gap-2.5">
                <button
                  onClick={onBack}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-medium text-sm transition-colors cursor-pointer"
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
