'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sigma,
  Cpu,
  Clock,
  Skull,
  Vault,
  Grid2x2X,
  Radar,
  Users,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import { playSound } from '@/lib/sounds';

type Category = 'all' | 'math' | 'mindgame' | 'grid';

const FILTERS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All (7)' },
  { id: 'math', label: 'Math & IQ' },
  { id: 'mindgame', label: 'Mindgames' },
  { id: 'grid', label: 'Grid Warfare' },
];

const TACTICAL_GAMES = [
  {
    href: '/equilibrium',
    title: 'Equilibrium',
    category: 'math' as const,
    tagline: 'Keynesian Nash number duel',
    description:
      'Dynamic Nash equations and 0–100 psychological showdowns. Spring the 100-crushes-0 trap, land Prime strikes, test Live Nash Sandbox theories, and beat 3 IQ Protocols.',
    icon: Sigma,
    gradient: 'from-cyan-500/20 via-indigo-950/30 to-transparent',
    border: 'border-cyan-400/35 hover:border-cyan-300/80',
    glow: 'hover:shadow-[0_0_34px_rgba(34,211,238,0.22)]',
    accent: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200',
    players: '1v1 + Solo AI',
    mode: 'NEW · IQ/Math',
    isNew: true,
    highlights: ['Dynamic Nash Eq.', '0–100 Showdown', '3 IQ Protocols'],
  },
  {
    href: '/quantum-matrix',
    title: 'Quantum Matrix',
    category: 'math' as const,
    tagline: '4×4 spatial math warfare',
    description:
      'Battle for control of 4×4 Power Cores. Trigger Exact-10 Hijack combos to steal opponent nodes, deploy 2× Amplifiers, flip sectors with Polarity Invert, and face Minimax AI.',
    icon: Cpu,
    gradient: 'from-violet-500/20 via-fuchsia-950/30 to-transparent',
    border: 'border-violet-400/35 hover:border-violet-300/80',
    glow: 'hover:shadow-[0_0_34px_rgba(167,139,250,0.22)]',
    accent: 'text-violet-300',
    badgeBg: 'bg-violet-500/15 border-violet-400/40 text-violet-200',
    players: '1v1 + Minimax AI',
    mode: 'NEW · Math Grid',
    isNew: true,
    highlights: ['Exact-10 Hijack', '2× Amplifiers', 'Polarity Invert'],
  },
  {
    href: '/chronos',
    title: 'Chronos Assassin',
    category: 'grid' as const,
    tagline: 'Time-loop 5×5 tactical duel',
    description:
      "Program 5 simultaneous ticks on a 5×5 cover arena. Survive, rewind time, and outsmart your rival's Ghost across 4 Cover Maps with 1 surgical paradox edit.",
    icon: Clock,
    gradient: 'from-sky-500/20 via-sky-950/25 to-transparent',
    border: 'border-sky-500/30 hover:border-sky-400/75',
    glow: 'hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]',
    accent: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
    players: '1v1 + Solo AI',
    mode: 'Time Loop',
    isNew: false,
    highlights: ['4 Cover Maps', 'T1–T5 Sim', 'Ghost Rewind'],
  },
  {
    href: '/glitch-roulette',
    title: 'Glitch Roulette',
    category: 'mindgame' as const,
    tagline: 'Mod-chip buckshot PvP',
    description:
      'Loaded cyber-revolver 1v1 PvP or 3-Boss gauntlet. Deploy 6 Reality Mod Chips, peek shells with Private X-Ray, flip polarity, or blank-shoot yourself for extra turns.',
    icon: Skull,
    gradient: 'from-rose-500/20 via-rose-950/25 to-transparent',
    border: 'border-rose-500/30 hover:border-rose-400/75',
    glow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]',
    accent: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    players: '1v1 + 3 Bosses',
    mode: 'Buckshot PvP',
    isNew: false,
    highlights: ['6 Mod Chips', 'Private X-Ray', '3 Boss Gauntlet'],
  },
  {
    href: '/blind-vault',
    title: 'Blind Vault',
    category: 'mindgame' as const,
    tagline: 'All-pay sabotage auction',
    description:
      'Bid hidden credits across 7 vaults (+2 to +7 & a -3 TRAP). Losers still pay their bid! Trigger 2× Surge or Invert Sabotage to hijack the pot at the last second.',
    icon: Vault,
    gradient: 'from-amber-500/20 via-orange-950/25 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-400/75',
    glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    accent: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    players: '1v1 + Solo AI',
    mode: 'All-Pay Bluff',
    isNew: false,
    highlights: ['All-Pay Bidding', '2× Surge & Invert', '-3 Trap Vault'],
  },
  {
    href: '/void-step',
    title: 'Void Step',
    category: 'grid' as const,
    tagline: 'Collapsing territory duel',
    description:
      'Step across a 7×7 neon grid, then shatter any tile into the abyss. Leap over voids with 2 Blink Jumps and isolate your rival with zero legal moves in a Best of 3.',
    icon: Grid2x2X,
    gradient: 'from-fuchsia-500/20 via-purple-950/25 to-transparent',
    border: 'border-fuchsia-500/30 hover:border-fuchsia-400/75',
    glow: 'hover:shadow-[0_0_30px_rgba(217,70,239,0.2)]',
    accent: 'text-fuchsia-400',
    badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
    players: '1v1 + Solo AI',
    mode: 'Best of 3',
    isNew: false,
    highlights: ['7×7 Collapsing Grid', '2× Blink Jumps', 'Best of 3'],
  },
  {
    href: '/shadow-strike',
    title: 'Shadow Strike',
    category: 'grid' as const,
    tagline: 'Stealth radar warfare',
    description:
      'Cloak 6 stealth nodes on a 6×6 grid. Land Chain-Hit streaks for bonus turns, sweep 3×3 sectors with Sonar, and erase an entire line with a 6-cell Orbital Beam.',
    icon: Radar,
    gradient: 'from-emerald-500/20 via-teal-950/25 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-400/75',
    glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    accent: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    players: '1v1 + Solo AI',
    mode: 'Stealth Radar',
    isNew: false,
    highlights: ['Chain-Hit Turns', '3×3 Sonar ×2', 'Orbital Beam ×1'],
  },
];

export default function TacticalGamesHub() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filteredGames =
    activeCategory === 'all'
      ? TACTICAL_GAMES
      : TACTICAL_GAMES.filter((g) => g.category === activeCategory);

  return (
    <div className="min-h-dvh bg-[#04050a] text-white relative flex flex-col overflow-x-hidden">
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[700px] h-[420px] bg-cyan-500/[0.07] rounded-full blur-[135px]" />
        <div className="absolute bottom-0 right-1/4 w-[650px] h-[420px] bg-violet-500/[0.07] rounded-full blur-[135px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      <GlobalNav activePortal="tactical" />

      <main className="relative z-10 max-w-7xl w-full mx-auto px-5 sm:px-6 pt-8 pb-14 flex-1 flex flex-col">
        {/* Header + Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-300 mb-3">
              <Layers className="w-3 h-3" />
              7 Live 1v1 Tactical Arenas
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none">
              Tactical{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-400 to-amber-300">
                Arenas
              </span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Every arena supports instant <span className="text-white font-semibold">1v1 Live Multiplayer</span> via 6-char room codes plus Solo AI sparring protocols.
            </p>
          </div>

          {/* Interactive Category Filter Tabs */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-2xl border border-white/10 bg-[#070912]/90 backdrop-blur-xl self-start lg:self-auto">
            {FILTERS.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playSound('chip');
                    setActiveCategory(tab.id);
                  }}
                  className={`relative px-3.5 py-2 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-colors ${
                    isActive ? 'text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tacticalFilterPill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-300 to-violet-300 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Arena Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game) => {
              const Icon = game.icon;
              return (
                <motion.div
                  key={game.href}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.22 }}
                >
                  <Link
                    href={game.href}
                    onClick={() => playSound('card_pick')}
                    className={`group relative flex flex-col justify-between h-full rounded-2xl border bg-[#070912]/88 backdrop-blur-xl p-5 overflow-hidden transition-all duration-250 hover:-translate-y-1 ${game.border} ${game.glow}`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none`}
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className={`p-2.5 rounded-xl border border-white/15 bg-black/60 ${game.accent}`}>
                          <Icon size={19} />
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase tracking-wider ${game.badgeBg}`}
                          >
                            {game.isNew && <Sparkles size={9} />}
                            {game.mode}
                          </span>
                          <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-300 bg-black/60 border border-white/10 px-2 py-0.5 rounded-full">
                            <Users size={10} />
                            {game.players}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-xl font-black uppercase tracking-tight text-white mb-0.5">
                        {game.title}
                      </h2>
                      <p className={`text-[10px] font-mono uppercase tracking-[0.2em] mb-2.5 ${game.accent}`}>
                        {game.tagline}
                      </p>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                        {game.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {game.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md border border-white/10 bg-black/55 text-[10px] font-mono text-zinc-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-black uppercase tracking-widest ${game.accent}`}
                    >
                      <span>Launch 1v1 Arena</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </main>

      <footer className="relative z-10 max-w-7xl w-full mx-auto px-5 sm:px-6 pb-6">
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          <span>Real-Time 1v1 Lobbies &amp; Tactical AI Protocols</span>
          <span>Room Sync · Instant Rematch · Zero Sign-Up</span>
        </div>
      </footer>
    </div>
  );
}
