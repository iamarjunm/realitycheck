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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#04060d] text-slate-100 flex flex-col relative select-none">
      {/* Ambient math-cyber glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[520px] h-[380px] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute -bottom-36 right-1/4 w-[520px] h-[380px] rounded-full bg-violet-500/12 blur-[140px]" />
        <div className="absolute inset-0 bg-grid-white opacity-25" />
      </div>

      {/* Top HUD */}
      <header className="relative z-10 shrink-0 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Leave Arena"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sigma className="w-4 h-4 text-cyan-400 shrink-0" />
              <h1 className="font-black uppercase tracking-wider text-sm sm:text-base text-white truncate">
                Equilibrium
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {isSolo ? 'Solo vs EULER-AI' : '1v1 Game Theory'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Round {state.round} · Dynamic Nash Equations · Exact-Match Paradox
            </p>
          </div>
        </div>

        {/* Center HP Scoreboard */}
        <div className="flex items-center gap-3 sm:gap-5 bg-black/60 border border-white/10 rounded-2xl px-3.5 py-1.5">
          {/* Me */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold max-w-[90px] truncate">
                {me?.nickname ?? 'You'}
              </div>
              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                {Array.from({ length: me?.maxHp ?? 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 transition-all ${
                      i < (me?.hp ?? 0)
                        ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono font-black text-slate-400">
            R{state.round}
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-2">
            <div className="text-left">
              <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold max-w-[90px] truncate">
                {opp?.nickname ?? 'Awaiting…'}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: opp?.maxHp ?? 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 transition-all ${
                      i < (opp?.hp ?? 0)
                        ? 'text-rose-400 fill-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                        : 'text-slate-700'
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              <span>{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-center p-3 sm:p-4 max-w-6xl w-full mx-auto">
        {/* WAITING */}
        {state.status === 'waiting' && (
          <div className="max-w-md w-full mx-auto rounded-3xl border border-cyan-500/30 bg-slate-950/85 backdrop-blur-xl p-7 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
              <Sigma className="w-8 h-8 text-cyan-300 animate-pulse" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-1">
              Awaiting Rival Mind
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              Share this room frequency for a 1v1 Equilibrium game-theory showdown.
            </p>
            {roomCode && (
              <button
                onClick={copyCode}
                className="w-full py-3.5 px-4 rounded-2xl bg-black/70 border-2 border-cyan-400/40 hover:border-cyan-300 flex items-center justify-center gap-3 font-mono text-2xl font-black tracking-[0.25em] text-cyan-300 transition-all cursor-pointer mb-3"
              >
                <span>{roomCode}</span>
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            )}
            <p className="text-xs text-slate-500">
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
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-950/90 to-violet-950/30 p-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300">
                    <Sparkles className="w-3 h-3" /> Active Law · Round {state.round}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    {law.twistLabel}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                    {law.name}
                  </h2>
                  <div className="font-mono text-lg sm:text-xl font-black text-cyan-300 bg-black/60 border border-cyan-500/30 px-3 py-1 rounded-xl">
                    {law.formulaLabel}
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1.5">
                  {law.shortRule} <span className="text-slate-400">· Bullseye (±1 of Target) deals -2 HP · Same number = Paradox (-1 HP both).</span>
                </p>
              </div>

              {/* Number Dial Panel */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-xl p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                      Select Integer (0 – 100)
                    </div>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
                        {isLocked ? me.lockedNumber : selectedNum}
                      </span>
                      {isPrimeNumber(isLocked ? (me.lockedNumber ?? 0) : selectedNum) && (
                        <span className="px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-400/40 text-violet-300 text-[10px] font-mono font-bold uppercase">
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
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 font-black text-lg cursor-pointer"
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
                        className="w-16 h-10 text-center rounded-xl bg-black border border-cyan-500/40 font-mono font-black text-lg text-cyan-300 focus:outline-none focus:border-cyan-300"
                      />
                      <button
                        onClick={() => {
                          playSound('tick');
                          setSelectedNum((n) => Math.min(100, n + 1));
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 font-black text-lg cursor-pointer"
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
                      className="w-full accent-cyan-400 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PICKS.map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            playSound('tick');
                            setSelectedNum(q);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                            selectedNum === q
                              ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                              : 'bg-black/60 border-white/10 text-slate-300 hover:border-cyan-400/50'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-cyan-500/10 border border-cyan-400/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 text-sm font-bold">
                      <Lock className="w-4 h-4" />
                      Number & Protocol Locked In
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {oppLocked ? 'Resolving equation…' : `Waiting for ${opp.nickname}…`}
                    </span>
                  </div>
                )}

                {/* 1-Use IQ Protocols */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
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
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            alreadyUsed
                              ? 'bg-black/30 border-white/5 opacity-35 cursor-not-allowed'
                              : active
                              ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.25)] cursor-pointer'
                              : 'bg-black/50 border-white/10 hover:border-white/30 cursor-pointer'
                          }`}
                          title={p.desc}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Icon className="w-3.5 h-3.5 text-cyan-300" />
                            <span className="text-[9px] font-mono uppercase text-slate-400">
                              {alreadyUsed ? 'USED' : active ? 'ARMED' : '1×'}
                            </span>
                          </div>
                          <div className="text-xs font-black text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.short}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lock CTA */}
                {!isLocked && (
                  <button
                    onClick={handleConfirmLock}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 hover:brightness-110 text-slate-950 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-all cursor-pointer"
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
              <div className="rounded-2xl border border-violet-500/30 bg-slate-950/85 backdrop-blur-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-violet-300">
                    <Calculator className="w-3.5 h-3.5" /> Nash Sandbox
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Test Rival Pick</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">If {opp.nickname} picks:</span>
                    <span className="font-mono font-black text-rose-300">{simOppNum}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={simOppNum}
                    onChange={(e) => setSimOppNum(Number(e.target.value))}
                    className="w-full accent-rose-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                    <div className="text-[9px] font-mono uppercase text-slate-400">Target</div>
                    <div className="text-2xl font-black font-mono text-amber-300">
                      {simResult.finalTarget}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                    <div className="text-[9px] font-mono uppercase text-slate-400">Outcome</div>
                    <div
                      className={`text-sm font-black uppercase mt-1 ${
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
                <p className="text-[11px] text-slate-400 leading-snug">{simResult.specialNote}</p>
              </div>

              {/* Rival Status + History Log */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/85 p-4 flex-1 flex flex-col min-h-[150px] overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    Round Ledger
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      oppLocked
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                        : 'bg-slate-800 border-white/10 text-slate-400'
                    }`}
                  >
                    {oppLocked ? `${opp.nickname}: LOCKED` : `${opp.nickname}: THINKING`}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {state.history.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No rounds resolved yet. Read your rival&apos;s psychology.
                    </p>
                  ) : (
                    state.history.map((h) => {
                      const myN = meIdx === 0 ? h.effP0 : h.effP1;
                      const oppN = meIdx === 0 ? h.effP1 : h.effP0;
                      const iWon = h.winnerIdx === meIdx;
                      return (
                        <div
                          key={h.round}
                          className={`p-2 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
                            iWon
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                              : h.winnerIdx === 'paradox'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                              : h.winnerIdx === 'draw'
                              ? 'bg-white/5 border-white/10 text-slate-300'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                          }`}
                        >
                          <span>
                            R{h.round}: You <b>{myN}</b> vs <b>{oppN}</b>
                          </span>
                          <span className="text-amber-300 font-bold">T={h.finalTarget}</span>
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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl w-full mx-auto rounded-3xl border border-cyan-500/35 bg-slate-950/90 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-5"
          >
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                Round {summary.round} · {EQUATION_LAWS[summary.lawId].name}
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-black uppercase tracking-tight ${
                  summary.winnerIdx === meIdx
                    ? 'text-emerald-400'
                    : summary.winnerIdx === 'paradox'
                    ? 'text-amber-400'
                    : summary.winnerIdx === 'draw'
                    ? 'text-slate-300'
                    : 'text-rose-400'
                }`}
              >
                {summary.winnerIdx === meIdx
                  ? 'You Solved The Rival!'
                  : summary.winnerIdx === 'paradox'
                  ? 'Exact-Match Paradox!'
                  : summary.winnerIdx === 'draw'
                  ? 'Perfect Stalemate'
                  : `${opp.nickname} Outcalculated You`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-mono">{summary.specialNote}</p>
            </div>

            {/* 3 Stat Reveal Boxes */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/35">
                <div className="text-[10px] font-mono uppercase text-cyan-300">{me.nickname}</div>
                <div className="text-4xl font-black font-mono text-white mt-1">{myRevealNum}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  Δ {Math.abs(myRevealNum - summary.finalTarget)} from T
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.18)]">
                <div className="text-[10px] font-mono uppercase text-amber-300">Equilibrium Target</div>
                <div className="text-4xl font-black font-mono text-amber-300 mt-1">
                  {summary.finalTarget}
                </div>
                <div className="text-[10px] font-mono text-amber-200/70 mt-1">
                  {EQUATION_LAWS[summary.lawId].formulaLabel}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-400/35">
                <div className="text-[10px] font-mono uppercase text-rose-300">{opp.nickname}</div>
                <div className="text-4xl font-black font-mono text-white mt-1">{oppRevealNum}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  Δ {Math.abs(oppRevealNum - summary.finalTarget)} from T
                </div>
              </div>
            </div>

            {/* Visual 0–100 Number Line */}
            <div className="pt-4 pb-2 px-2">
              <div className="relative h-3 rounded-full bg-slate-900 border border-white/10">
                {/* Target marker */}
                <motion.div
                  initial={{ left: '50%', scale: 0 }}
                  animate={{ left: `${summary.finalTarget}%`, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_16px_rgba(251,191,36,0.9)] z-30"
                  title={`Target: ${summary.finalTarget}`}
                />
                {/* My marker */}
                <motion.div
                  initial={{ left: '0%' }}
                  animate={{ left: `${myRevealNum}%` }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-6 -translate-x-1/2 flex flex-col items-center z-20"
                >
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-mono text-[10px] font-black">
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
                  <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px] font-black">
                    RIVAL {oppRevealNum}
                  </span>
                </motion.div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-7">
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-400 hover:brightness-110 text-slate-950 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-sm w-full rounded-3xl border border-cyan-500/40 bg-slate-950 p-6 text-center shadow-2xl"
            >
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border ${
                  state.winnerIdx === meIdx
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : state.winnerIdx === null
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-rose-500/20 border-rose-400 text-rose-300'
                }`}
              >
                {state.winnerIdx === meIdx ? (
                  <Trophy className="w-8 h-8" />
                ) : state.winnerIdx === null ? (
                  <Brain className="w-8 h-8" />
                ) : (
                  <Skull className="w-8 h-8" />
                )}
              </div>

              <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-1">
                {state.winnerIdx === meIdx
                  ? 'Grandmaster Victory'
                  : state.winnerIdx === null
                  ? 'Mutual Annihilation'
                  : 'Out-Solved'}
              </h2>
              <p className="text-sm text-slate-400 mb-5">
                {state.winnerIdx === meIdx
                  ? `You broke ${opp?.nickname}'s equilibrium in ${state.round} rounds.`
                  : state.winnerIdx === null
                  ? 'Both minds collapsed simultaneously on the final paradox.'
                  : `${opp?.nickname} reached 0-error dominance first.`}
              </p>

              <div className="flex gap-2.5">
                <button
                  onClick={onBack}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm cursor-pointer"
                >
                  Lobby
                </button>
                <button
                  onClick={onRematch}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer"
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
