'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Orbit,
  Gem,
  Sigma,
  Cpu,
  Clock,
  Skull,
  Vault,
  Grid2x2X,
  Radar,
  Users,
  ChevronRight,
} from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import { playSound } from '@/lib/sounds';

type Category = 'all' | 'surreal' | 'mindgame' | 'math' | 'grid';

const FILTERS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All (9)' },
  { id: 'surreal', label: 'Surreal & Wild' },
  { id: 'mindgame', label: 'Mindgames' },
  { id: 'math', label: 'Math & IQ' },
  { id: 'grid', label: 'Grid Warfare' },
];

const TACTICAL_GAMES = [
  {
    href: '/mind-heist',
    title: 'Mind Heist',
    category: 'surreal' as const,
    tagline: 'Rotating 3-ring astral vault duel',
    description:
      'Split 12 Energy across 3 rotating Mind Chambers, plant hidden Phantom Traps, Mind-Read counter-call rival ambushes, and trigger 6 Surreal Relics.',
    icon: Orbit,
    iconTint: 'text-rose-400',
    players: '1v1 + Solo AI',
    mode: 'Surreal',
    isNew: true,
    highlights: ['3-Ring Vault', 'Phantom Traps', '6 Relics'],
  },
  {
    href: '/reality-draft',
    title: 'Reality Draft',
    category: 'surreal' as const,
    tagline: 'Holographic anomaly card dueler',
    description:
      'Draft 12 reality-warping Anomaly Cards across rotating World Distortions with Double Stakes bluffs and Ward Shields.',
    icon: Gem,
    iconTint: 'text-amber-400',
    players: '1v1 + Solo AI',
    mode: 'Surreal',
    isNew: true,
    highlights: ['12 Anomaly Cards', 'World Distortions', 'Double Stakes'],
  },
  {
    href: '/equilibrium',
    title: 'Equilibrium',
    category: 'math' as const,
    tagline: 'Keynesian Nash number duel',
    description:
      'Dynamic Nash equations and 0–100 psychological showdowns. Spring the 100-crushes-0 trap, land Prime strikes, and beat 3 IQ Protocols.',
    icon: Sigma,
    iconTint: 'text-indigo-400',
    players: '1v1 + Solo AI',
    mode: 'IQ / Math',
    isNew: false,
    highlights: ['Dynamic Nash Eq.', '0–100 Showdown', '3 IQ Protocols'],
  },
  {
    href: '/quantum-matrix',
    title: 'Quantum Matrix',
    category: 'math' as const,
    tagline: '4×4 spatial math warfare',
    description:
      'Battle for control of 4×4 Power Cores. Trigger Exact-10 Hijack combos to steal opponent nodes, deploy 2× Amplifiers, and face Minimax AI.',
    icon: Cpu,
    iconTint: 'text-indigo-400',
    players: '1v1 + Minimax AI',
    mode: 'Math Grid',
    isNew: false,
    highlights: ['Exact-10 Hijack', '2× Amplifiers', 'Polarity Invert'],
  },
  {
    href: '/chronos',
    title: 'Chronos Assassin',
    category: 'grid' as const,
    tagline: 'Time-loop 5×5 tactical duel',
    description:
      "Program 5 simultaneous ticks on a 5×5 cover arena. Survive, rewind time, and outsmart your rival's Ghost across 4 Cover Maps with 1 paradox edit.",
    icon: Clock,
    iconTint: 'text-zinc-300',
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
      'Loaded revolver 1v1 PvP or 3-Boss gauntlet. Deploy 6 Reality Mod Chips, peek shells with Private X-Ray, flip polarity, or blank-shoot for extra turns.',
    icon: Skull,
    iconTint: 'text-rose-400',
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
      'Bid hidden credits across 7 vaults (+2 to +7 & a -3 Trap). Losers still pay their bid. Trigger 2× Surge or Invert Sabotage to hijack the pot.',
    icon: Vault,
    iconTint: 'text-amber-400',
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
      'Step across a 7×7 grid and shatter any tile into the void. Leap over gaps with 2 Blink Jumps and isolate your rival with zero legal moves.',
    icon: Grid2x2X,
    iconTint: 'text-zinc-300',
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
      'Cloak 6 stealth nodes on a 6×6 grid. Land Chain-Hit streaks for bonus turns, sweep 3×3 sectors with Sonar, and fire a 6-cell Orbital Beam.',
    icon: Radar,
    iconTint: 'text-emerald-400',
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
    <div className="min-h-dvh bg-[#09090b] text-zinc-50 flex flex-col">
      <GlobalNav activePortal="tactical" />

      <main className="max-w-6xl w-full mx-auto px-5 sm:px-6 pt-10 pb-16 flex-1 flex flex-col">
        {/* Header + Segmented Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-8 border-b border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 mb-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span>9 Live 1v1 Arenas</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50">
              Tactical Arenas
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
              Every arena supports instant 1v1 multiplayer via 6-character room codes alongside solo AI sparring protocols.
            </p>
          </div>

          {/* Segmented Control */}
          <div className="inline-flex flex-wrap items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl self-start lg:self-auto">
            {FILTERS.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playSound('chip');
                    setActiveCategory(tab.id);
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tacticalFilterPill"
                      className="absolute inset-0 rounded-lg bg-zinc-50"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Arena Grid */}
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={game.href}
                    onClick={() => playSound('card_pick')}
                    className="group flex flex-col justify-between h-full rounded-xl bg-[#111113] border border-zinc-800/90 hover:border-zinc-700 hover:bg-[#151518] p-5 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          <Icon className={`w-4 h-4 ${game.iconTint}`} />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {game.isNew && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400 font-mono text-[11px] font-medium">
                              New
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-400">
                            {game.mode}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-base font-semibold tracking-tight text-zinc-50 mb-0.5">
                        {game.title}
                      </h2>
                      <p className="text-xs text-zinc-500 mb-3">
                        {game.tagline}
                      </p>
                      <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                        {game.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {game.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800/90 font-mono text-[11px] text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-mono text-zinc-500">
                        <Users className="w-3.5 h-3.5" />
                        {game.players}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-300 group-hover:text-zinc-50 transition-colors">
                        <span>Play</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </main>

      <footer className="max-w-6xl w-full mx-auto px-5 sm:px-6 pb-8">
        <div className="pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-zinc-500">
          <span>Real-time 1v1 lobbies &amp; tactical AI</span>
          <span>6-char room sync · Instant rematch · Zero sign-up</span>
        </div>
      </footer>
    </div>
  );
}
