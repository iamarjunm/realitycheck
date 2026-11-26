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
    color: 'brass',
  },
  {
    id: 'mirror_flip',
    name: 'MIRROR LOCK',
    short: 'Flip if >50',
    desc: 'If rival plays > 50, your number flips to (100 − N).',
    icon: FlipHorizontal2,
    color: 'crimson',
  },
  {
    id: 'noise_shield',
    name: 'NOISE SHIELD',
    short: 'Block Loss',
    desc: 'Cancels normal round damage if you lose (bypassed by Bullseye).',
    icon: Shield,
    color: 'emerald',
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
          colors: ['#e6c27a', '#10b981', '#e5484d', '#faf5eb'],
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden atelier-bg bg-[#0c0b0e] text-[#f4efe6] flex flex-col relative select-none selection:bg-[#e6c27a]/25">
      {/* Brushed Brass Observatory Ambient Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 44% at 50% 0%, rgba(230, 194, 122, 0.11), transparent 62%), radial-gradient(ellipse 48% 42% at 12% 85%, rgba(16, 185, 129, 0.08), transparent 60%), radial-gradient(ellipse 48% 42% at 88% 85%, rgba(217, 56, 58, 0.08), transparent 60%)',
        }}
      />

      {/* Top HUD */}
      <header className="relative z-10 shrink-0 border-b border-[#e6c27a]/18 bg-[#0c0b0e]/92 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#15131a] border border-[#e6c27a]/20 hover:border-[#e6c27a]/50 text-[#d6ccbc] hover:text-[#faf5eb] transition-colors cursor-pointer"
            title="Leave Arena"
          >
            <ArrowLeft className="w-4 h-4 text-[#e6c27a]" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sigma className="w-4 h-4 text-[#e6c27a] shrink-0" />
              <h1 className="font-display font-semibold tracking-tight text-sm sm:text-base text-[#faf5eb] truncate">
                Equilibrium
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-[#15131a] text-[#e6c27a] border border-[#e6c27a]/25">
                {isSolo ? 'Solo vs EULER-AI' : '1v1 Game Theory'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#94897a] hidden sm:block">
              Round {state.round} · Dynamic Nash Equations · Exact-Match Paradox
            </p>
          </div>
        </div>

        {/* Center HP Scoreboard */}
        <div className="atelier-card hover:transform-none flex items-center gap-3 sm:gap-5 bg-[#15131a] border border-[#e6c27a]/24 rounded-xl px-3.5 py-1.5 shadow-[inset_0_1px_0_rgba(230,194,122,0.14)]">
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
                        : 'text-[#282430]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-md bg-[#0c0b10] border border-[#e6c27a]/28 text-[10px] font-mono font-semibold text-[#e6c27a] tabular-nums">
            R{state.round}
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-2">
            <div className="text-left">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#f06b70] font-semibold max-w-[90px] truncate">
                {opp?.nickname ?? 'Awaiting…'}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: opp?.maxHp ?? 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 transition-colors ${
                      i < (opp?.hp ?? 0)
                        ? 'text-[#e5484d] fill-[#e5484d]'
                        : 'text-[#282430]'
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#15131a] border border-[#e6c27a]/24 hover:border-[#e6c27a]/55 text-[#e6c27a] font-mono text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#b5aa99]" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-center p-3 sm:p-4 max-w-6xl w-full mx-auto">
        {/* WAITING */}
        {state.status === 'waiting' && (
          <div className="atelier-card hover:transform-none max-w-md w-full mx-auto rounded-2xl border border-[#e6c27a]/28 bg-gradient-to-b from-[#17151f] to-[#110f16] p-7 text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-[#e6c27a]/12" />
            <div className="relative z-10 w-14 h-14 mx-auto mb-4 rounded-xl bg-[#0c0b10] border border-[#e6c27a]/35 flex items-center justify-center">
              <Sigma className="w-7 h-7 text-[#e6c27a] animate-pulse" />
            </div>
            <h2 className="relative z-10 font-display text-xl font-semibold tracking-tight text-[#faf5eb] mb-1">
              Awaiting Rival Mind
            </h2>
            <p className="relative z-10 text-xs sm:text-sm text-[#b5aa99] mb-5">
              Share this room code for a 1v1 Equilibrium game-theory showdown.
            </p>
            {roomCode && (
              <button
                onClick={copyCode}
                className="relative z-10 w-full py-3.5 px-4 rounded-xl bg-[#0c0b10] border border-dashed border-[#e6c27a]/45 hover:border-[#e6c27a] flex items-center justify-center gap-3 font-mono text-2xl font-bold tracking-[0.25em] text-[#e6c27a] transition-colors cursor-pointer mb-3"
              >
                <span>{roomCode}</span>
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-[#b5aa99]" />}
              </button>
            )}
            <p className="relative z-10 text-xs font-mono text-[#94897a]">
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
              <div className="atelier-card hover:transform-none relative rounded-2xl border border-[#e6c27a]/26 bg-[#15131a] p-4 shadow-[inset_0_1px_0_rgba(230,194,122,0.18)]">
                <div className="pointer-events-none absolute inset-1.5 rounded-[12px] border border-[#e6c27a]/10" />
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#0c0b10] border border-[#e6c27a]/25 text-[10px] font-mono uppercase tracking-widest text-[#d9ceb9]">
                      <Sparkles className="w-3 h-3 text-[#e6c27a]" /> Active Law · Round {state.round}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-[#f0d599] bg-[#e6c27a]/12 border border-[#e6c27a]/35 px-2.5 py-0.5 rounded-md">
                      {law.twistLabel}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#faf5eb]">
                      {law.name}
                    </h2>
                    <div className="font-mono text-base sm:text-lg font-semibold text-[#e6c27a] bg-[#0c0b10] border border-[#e6c27a]/32 px-3 py-1 rounded-xl tabular-nums shadow-[inset_0_1px_8px_rgba(230,194,122,0.08)]">
                      {law.formulaLabel}
                    </div>
                  </div>
                  <p className="text-xs text-[#d6ccbc] mt-2">
                    {law.shortRule} <span className="text-[#94897a]">· Bullseye (±1 of Target) deals -2 HP · Same number = Paradox (-1 HP both).</span>
                  </p>
                </div>
              </div>

              {/* Precision Brass Number Dial Panel */}
              <div className="atelier-card hover:transform-none relative rounded-2xl border border-[#e6c27a]/22 bg-[#15131a] p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5 shadow-[inset_0_1px_0_rgba(230,194,122,0.16)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9c9180]">
                      Observatory Integer Dial (0 – 100)
                    </div>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span className="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-[#faf5eb] tabular-nums drop-shadow-[0_2px_14px_rgba(230,194,122,0.18)]">
                        {isLocked ? me.lockedNumber : selectedNum}
                      </span>
                      {isPrimeNumber(isLocked ? (me.lockedNumber ?? 0) : selectedNum) && (
                        <span className="px-2 py-0.5 rounded-md bg-[#e6c27a]/14 border border-[#e6c27a]/45 text-[#e6c27a] text-[10px] font-mono font-semibold uppercase tracking-wider">
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
                        className="w-10 h-10 rounded-xl bg-[#1e1b26] hover:bg-[#272331] border border-[#e6c27a]/22 font-mono font-bold text-lg text-[#faf5eb] transition-colors cursor-pointer"
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
                        className="w-16 h-10 text-center rounded-xl bg-[#0c0b10] border border-[#e6c27a]/28 focus:border-[#e6c27a] font-mono font-bold text-lg text-[#e6c27a] tabular-nums focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => {
                          playSound('tick');
                          setSelectedNum((n) => Math.min(100, n + 1));
                        }}
                        className="w-10 h-10 rounded-xl bg-[#1e1b26] hover:bg-[#272331] border border-[#e6c27a]/22 font-mono font-bold text-lg text-[#faf5eb] transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Brass Slider + Graduated Scale + Quick Picks */}
                {!isLocked ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={selectedNum}
                        onChange={(e) => setSelectedNum(Number(e.target.value))}
                        className="w-full accent-[#e6c27a] h-2 bg-[#0c0b10] rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between px-0.5 text-[9px] font-mono text-[#7c7264] tabular-nums">
                        <span>0</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PICKS.map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            playSound('tick');
                            setSelectedNum(q);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer tabular-nums ${
                            selectedNum === q
                              ? 'bg-gradient-to-b from-[#f0d394] to-[#c99b49] text-[#140f08] border-[#f6dfa8]'
                              : 'bg-[#0c0b10] border-[#e6c27a]/18 text-[#c9beac] hover:border-[#e6c27a]/50 hover:text-[#faf5eb]'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-emerald-500/12 border border-emerald-500/35 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                      <Lock className="w-4 h-4" />
                      Number &amp; Protocol Locked In
                    </div>
                    <span className="text-xs font-mono text-[#b5aa99]">
                      {oppLocked ? 'Resolving equation…' : `Waiting for ${opp.nickname}…`}
                    </span>
                  </div>
                )}

                {/* 1-Use IQ Protocols */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9c9180] mb-1.5">
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
                              ? 'bg-[#0c0b10]/60 border-[#e6c27a]/10 opacity-40 cursor-not-allowed'
                              : active
                              ? 'bg-[#e6c27a]/14 border-[#e6c27a]/75 shadow-[0_0_14px_rgba(230,194,122,0.16)] cursor-pointer'
                              : 'bg-[#0c0b10] border-[#e6c27a]/18 hover:border-[#e6c27a]/45 cursor-pointer'
                          }`}
                          title={p.desc}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#e6c27a]' : 'text-[#b5aa99]'}`} />
                            <span className={`text-[9px] font-mono uppercase ${active ? 'text-[#e6c27a] font-semibold' : 'text-[#8e8374]'}`}>
                              {alreadyUsed ? 'USED' : active ? 'ARMED' : '1×'}
                            </span>
                          </div>
                          <div className="font-display text-xs font-semibold text-[#faf5eb]">{p.name}</div>
                          <div className="text-[10px] text-[#9c9180] leading-tight mt-0.5">{p.short}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lock CTA */}
                {!isLocked && (
                  <button
                    onClick={handleConfirmLock}
                    className="btn-brass w-full py-3 rounded-xl font-semibold tracking-wide text-sm flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="atelier-card hover:transform-none rounded-2xl border border-[#e6c27a]/22 bg-[#15131a] p-4 space-y-3 shadow-[inset_0_1px_0_rgba(230,194,122,0.15)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#faf5eb]">
                    <Calculator className="w-3.5 h-3.5 text-[#e6c27a]" /> Nash Sandbox
                  </span>
                  <span className="text-[10px] font-mono text-[#94897a]">Test Rival Pick</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#b5aa99]">If {opp.nickname} picks:</span>
                    <span className="font-mono font-bold text-[#f06b70] tabular-nums">{simOppNum}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={simOppNum}
                    onChange={(e) => setSimOppNum(Number(e.target.value))}
                    className="w-full accent-[#e5484d] h-2 bg-[#0c0b10] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#0c0b10] border border-[#e6c27a]/25">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-[#94897a]">Target</div>
                    <div className="text-2xl font-bold font-mono text-[#e6c27a] tabular-nums mt-0.5">
                      {simResult.finalTarget}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0c0b10] border border-[#e6c27a]/18">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-[#94897a]">Outcome</div>
                    <div
                      className={`text-xs font-mono font-bold uppercase mt-2 ${
                        simResult.winnerIdx === 0
                          ? 'text-emerald-400'
                          : simResult.winnerIdx === 1
                          ? 'text-[#f06b70]'
                          : 'text-[#e6c27a]'
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
                <p className="text-[11px] font-mono text-[#b5aa99] leading-snug">{simResult.specialNote}</p>
              </div>

              {/* Rival Status + History Log */}
              <div className="atelier-card hover:transform-none rounded-2xl border border-[#e6c27a]/20 bg-[#15131a] p-4 flex-1 flex flex-col min-h-[150px] overflow-hidden">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#9c9180]">
                    Round Ledger
                  </span>
                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${
                      oppLocked
                        ? 'bg-emerald-500/12 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#0c0b10] border-[#e6c27a]/18 text-[#b5aa99]'
                    }`}
                  >
                    {oppLocked ? `${opp.nickname}: LOCKED` : `${opp.nickname}: THINKING`}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {state.history.length === 0 ? (
                    <p className="text-xs text-[#8e8374]">
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
                              ? 'bg-emerald-500/[0.09] border-emerald-500/35 text-emerald-200'
                              : h.winnerIdx === 'paradox'
                              ? 'bg-[#e6c27a]/[0.1] border-[#e6c27a]/35 text-[#f3da9f]'
                              : h.winnerIdx === 'draw'
                              ? 'bg-[#0c0b10] border-[#e6c27a]/16 text-[#d6ccbc]'
                              : 'bg-[#e5484d]/[0.1] border-[#e5484d]/35 text-[#ffb4b6]'
                          }`}
                        >
                          <span>
                            R{h.round}: You <b className="text-[#faf5eb]">{myN}</b> vs <b className="text-[#faf5eb]">{oppN}</b>
                          </span>
                          <span className="text-[#e6c27a] font-semibold">T={h.finalTarget}</span>
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
            className="atelier-card hover:transform-none relative max-w-3xl w-full mx-auto rounded-2xl border border-[#e6c27a]/28 bg-[#15131a] p-5 sm:p-7 space-y-5 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
          >
            <div className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-[#e6c27a]/12" />

            <div className="relative z-10 text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0c0b10] border border-[#e6c27a]/28 text-[10px] font-mono uppercase tracking-widest text-[#e6c27a]">
                Round {summary.round} · {EQUATION_LAWS[summary.lawId].name}
              </div>
              <h2
                className={`font-display text-2xl sm:text-4xl font-bold tracking-tight ${
                  summary.winnerIdx === meIdx
                    ? 'text-emerald-400'
                    : summary.winnerIdx === 'paradox'
                    ? 'text-[#e6c27a]'
                    : summary.winnerIdx === 'draw'
                    ? 'text-[#faf5eb]'
                    : 'text-[#f06b70]'
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
              <p className="text-xs sm:text-sm text-[#c4b9a8] font-mono">{summary.specialNote}</p>
            </div>

            {/* 3 Stat Reveal Boxes */}
            <div className="relative z-10 grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-xl bg-[#0c0b10] border border-emerald-500/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">{me.nickname}</div>
                <div className="text-4xl font-bold font-mono text-[#faf5eb] tabular-nums mt-1">{myRevealNum}</div>
                <div className="text-[11px] font-mono text-[#94897a] tabular-nums mt-1">
                  Δ {Math.abs(myRevealNum - summary.finalTarget)} from T
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-b from-[#282012] to-[#13100d] border border-[#e6c27a]/65 shadow-[0_0_24px_rgba(230,194,122,0.16)]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#e6c27a]">Equilibrium Target</div>
                <div className="text-4xl font-bold font-mono text-[#f3da9f] tabular-nums mt-1">
                  {summary.finalTarget}
                </div>
                <div className="text-[10px] font-mono text-[#e6c27a]/80 mt-1">
                  {EQUATION_LAWS[summary.lawId].formulaLabel}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0c0b10] border border-[#e5484d]/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#f06b70]">{opp.nickname}</div>
                <div className="text-4xl font-bold font-mono text-[#faf5eb] tabular-nums mt-1">{oppRevealNum}</div>
                <div className="text-[11px] font-mono text-[#94897a] tabular-nums mt-1">
                  Δ {Math.abs(oppRevealNum - summary.finalTarget)} from T
                </div>
              </div>
            </div>

            {/* Precision Brushed-Brass 0–100 Number Line Dial */}
            <div className="relative z-10 pt-6 pb-2 px-3 rounded-xl bg-[#0c0b10]/90 border border-[#e6c27a]/18">
              <div className="relative h-3 rounded-full bg-[#1a1721] border border-[#e6c27a]/30">
                {/* Brass Tick Marks */}
                {[0, 25, 50, 75, 100].map((tick) => (
                  <span
                    key={tick}
                    style={{ left: `${tick}%` }}
                    className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#e6c27a]/35"
                  />
                ))}
                {/* Target needle marker */}
                <motion.div
                  initial={{ left: '50%', scale: 0 }}
                  animate={{ left: `${summary.finalTarget}%`, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#e6c27a] border-2 border-[#0c0b10] ring-2 ring-[#e6c27a]/55 shadow-[0_0_14px_rgba(230,194,122,0.75)] z-30"
                  title={`Target: ${summary.finalTarget}`}
                />
                {/* My marker */}
                <motion.div
                  initial={{ left: '0%' }}
                  animate={{ left: `${myRevealNum}%` }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-7 -translate-x-1/2 flex flex-col items-center z-20"
                >
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-[#09120e] font-mono text-[10px] font-bold tabular-nums shadow">
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
                  <span className="px-1.5 py-0.5 rounded bg-[#d9383a] text-[#fff6f6] font-mono text-[10px] font-bold tabular-nums shadow">
                    RIVAL {oppRevealNum}
                  </span>
                </motion.div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#94897a] tabular-nums mt-8">
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
              className="btn-brass relative z-10 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            className="fixed inset-0 z-50 bg-black/82 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              className="atelier-card hover:transform-none relative max-w-sm w-full rounded-2xl border border-[#e6c27a]/35 bg-gradient-to-b from-[#181620] to-[#110f16] p-6 text-center overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-[#e6c27a]/12" />
              <div
                className={`relative z-10 w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center border ${
                  state.winnerIdx === meIdx
                    ? 'bg-emerald-500/12 border-emerald-500/45 text-emerald-400'
                    : state.winnerIdx === null
                    ? 'bg-[#e6c27a]/12 border-[#e6c27a]/45 text-[#e6c27a]'
                    : 'bg-[#e5484d]/12 border-[#e5484d]/45 text-[#f06b70]'
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

              <h2 className="relative z-10 font-display text-2xl font-bold tracking-tight text-[#faf5eb] mb-1">
                {state.winnerIdx === meIdx
                  ? 'Grandmaster Victory'
                  : state.winnerIdx === null
                  ? 'Mutual Annihilation'
                  : 'Out-Solved'}
              </h2>
              <p className="relative z-10 text-xs sm:text-sm text-[#b5aa99] mb-5">
                {state.winnerIdx === meIdx
                  ? `You broke ${opp?.nickname}'s equilibrium in ${state.round} rounds.`
                  : state.winnerIdx === null
                  ? 'Both minds collapsed simultaneously on the final paradox.'
                  : `${opp?.nickname} reached 0-error dominance first.`}
              </p>

              <div className="relative z-10 flex gap-2.5">
                <button
                  onClick={onBack}
                  className="btn-obsidian flex-1 py-2.5 rounded-xl font-medium text-sm cursor-pointer"
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
