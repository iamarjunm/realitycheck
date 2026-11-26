'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ArrowRight, Sparkles } from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import GameArtwork, { type GameArtworkId } from '@/components/GameArtwork';
import { playSound } from '@/lib/sounds';

type Category = 'all' | 'surreal' | 'mindgame' | 'math' | 'grid';

const FILTERS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All (9)' },
  { id: 'surreal', label: 'Surreal & Wild' },
  { id: 'mindgame', label: 'Mindgames' },
  { id: 'math', label: 'Math & IQ' },
  { id: 'grid', label: 'Grid Warfare' },
];

interface TacticalGameItem {
  artworkId: GameArtworkId;
  href: string;
  title: string;
  category: Exclude<Category, 'all'>;
  categoryLabel: string;
  categoryBadge: string;
  tagline: string;
  description: string;
  players: string;
  mode: string;
  isNew: boolean;
  highlights: readonly string[];
}

const TACTICAL_GAMES: readonly TacticalGameItem[] = [
  {
    artworkId: 'mind-heist',
    href: '/mind-heist',
    title: 'Mind Heist',
    category: 'surreal',
    categoryLabel: 'Surreal & Wild',
    categoryBadge: 'border-[#e6c27a]/45 bg-[#1b1410]/85 text-[#e6c27a]',
    tagline: 'Rotating 3-ring astral vault duel',
    description:
      'Split 12 Energy across 3 rotating Mind Chambers, plant hidden Phantom Traps, Mind-Read counter-call rival ambushes, and trigger 6 Surreal Relics.',
    players: '1v1 + Solo AI',
    mode: 'Surreal',
    isNew: true,
    highlights: ['3-Ring Vault', 'Phantom Traps', '6 Relics'],
  },
  {
    artworkId: 'reality-draft',
    href: '/reality-draft',
    title: 'Reality Draft',
    category: 'surreal',
    categoryLabel: 'Surreal & Wild',
    categoryBadge: 'border-[#e6c27a]/45 bg-[#1b1410]/85 text-[#e6c27a]',
    tagline: 'Holographic anomaly card dueler',
    description:
      'Draft 12 reality-warping Anomaly Cards across rotating World Distortions with Double Stakes bluffs and Ward Shields.',
    players: '1v1 + Solo AI',
    mode: 'Surreal',
    isNew: true,
    highlights: ['12 Anomaly Cards', 'World Distortions', 'Double Stakes'],
  },
  {
    artworkId: 'equilibrium',
    href: '/equilibrium',
    title: 'Equilibrium',
    category: 'math',
    categoryLabel: 'Math & IQ',
    categoryBadge: 'border-[#c4a77d]/45 bg-[#181412]/85 text-[#e8dac2]',
    tagline: 'Keynesian Nash number duel',
    description:
      'Dynamic Nash equations and 0–100 psychological showdowns. Spring the 100-crushes-0 trap, land Prime strikes, and beat 3 IQ Protocols.',
    players: '1v1 + Solo AI',
    mode: 'IQ / Math',
    isNew: false,
    highlights: ['Dynamic Nash Eq.', '0–100 Showdown', '3 IQ Protocols'],
  },
  {
    artworkId: 'quantum-matrix',
    href: '/quantum-matrix',
    title: 'Quantum Matrix',
    category: 'math',
    categoryLabel: 'Math & IQ',
    categoryBadge: 'border-[#c4a77d]/45 bg-[#181412]/85 text-[#e8dac2]',
    tagline: '4×4 spatial math warfare',
    description:
      'Battle for control of 4×4 Power Cores. Trigger Exact-10 Hijack combos to steal opponent nodes, deploy 2× Amplifiers, and face Minimax AI.',
    players: '1v1 + Minimax AI',
    mode: 'Math Grid',
    isNew: false,
    highlights: ['Exact-10 Hijack', '2× Amplifiers', 'Polarity Invert'],
  },
  {
    artworkId: 'chronos',
    href: '/chronos',
    title: 'Chronos Assassin',
    category: 'grid',
    categoryLabel: 'Grid Warfare',
    categoryBadge: 'border-[#7ec4a8]/40 bg-[#0d1c18]/85 text-[#9ee0c6]',
    tagline: 'Time-loop 5×5 tactical duel',
    description:
      "Program 5 simultaneous ticks on a 5×5 cover arena. Survive, rewind time, and outsmart your rival's Ghost across 4 Cover Maps with 1 paradox edit.",
    players: '1v1 + Solo AI',
    mode: 'Time Loop',
    isNew: false,
    highlights: ['4 Cover Maps', 'T1–T5 Sim', 'Ghost Rewind'],
  },
  {
    artworkId: 'glitch-roulette',
    href: '/glitch-roulette',
    title: 'Glitch Roulette',
    category: 'mindgame',
    categoryLabel: 'Mindgames',
    categoryBadge: 'border-[#d9383a]/45 bg-[#231013]/85 text-[#f48b8d]',
    tagline: 'Mod-chip buckshot PvP',
    description:
      'Loaded revolver 1v1 PvP or 3-Boss gauntlet. Deploy 6 Reality Mod Chips, peek shells with Private X-Ray, flip polarity, or blank-shoot for extra turns.',
    players: '1v1 + 3 Bosses',
    mode: 'Buckshot PvP',
    isNew: false,
    highlights: ['6 Mod Chips', 'Private X-Ray', '3 Boss Gauntlet'],
  },
  {
    artworkId: 'blind-vault',
    href: '/blind-vault',
    title: 'Blind Vault',
    category: 'mindgame',
    categoryLabel: 'Mindgames',
    categoryBadge: 'border-[#d9383a]/45 bg-[#231013]/85 text-[#f48b8d]',
    tagline: 'All-pay sabotage auction',
    description:
      'Bid hidden credits across 7 vaults (+2 to +7 & a -3 Trap). Losers still pay their bid. Trigger 2× Surge or Invert Sabotage to hijack the pot.',
    players: '1v1 + Solo AI',
    mode: 'All-Pay Bluff',
    isNew: false,
    highlights: ['All-Pay Bidding', '2× Surge & Invert', '-3 Trap Vault'],
  },
  {
    artworkId: 'void-step',
    href: '/void-step',
    title: 'Void Step',
    category: 'grid',
    categoryLabel: 'Grid Warfare',
    categoryBadge: 'border-[#7ec4a8]/40 bg-[#0d1c18]/85 text-[#9ee0c6]',
    tagline: 'Collapsing territory duel',
    description:
      'Step across a 7×7 grid and shatter any tile into the void. Leap over gaps with 2 Blink Jumps and isolate your rival with zero legal moves.',
    players: '1v1 + Solo AI',
    mode: 'Best of 3',
    isNew: false,
    highlights: ['7×7 Collapsing Grid', '2× Blink Jumps', 'Best of 3'],
  },
  {
    artworkId: 'shadow-strike',
    href: '/shadow-strike',
    title: 'Shadow Strike',
    category: 'grid',
    categoryLabel: 'Grid Warfare',
    categoryBadge: 'border-[#7ec4a8]/40 bg-[#0d1c18]/85 text-[#9ee0c6]',
    tagline: 'Stealth radar warfare',
    description:
      'Cloak 6 stealth nodes on a 6×6 grid. Land Chain-Hit streaks for bonus turns, sweep 3×3 sectors with Sonar, and fire a 6-cell Orbital Beam.',
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
    <div className="min-h-dvh bg-[#0c0b0e] atelier-bg text-[#f5f0e6] flex flex-col relative overflow-x-hidden">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <div className="relative z-40">
        <GlobalNav activePortal="tactical" />
      </div>

      <main className="relative z-10 max-w-6xl w-full mx-auto px-5 sm:px-6 pt-10 pb-16 flex-1 flex flex-col">
        {/* Dramatic Editorial Header + Gold-Trimmed Filter Bar */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-9 border-b border-[#e6c27a]/15">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#e6c27a] mb-3">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#e6c27a]" />
              <span>House of Strategy · 9 Live 1v1 Arenas</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#f5f0e6] leading-[1.05]">
              Tactical{' '}
              <span className="font-serif italic font-normal text-[#e6c27a]">Arenas</span>
            </h1>
            <p className="text-sm text-[#b4a99a] mt-3 max-w-xl leading-relaxed">
              Every arena pairs instant 1v1 multiplayer room codes with brutal solo AI sparring
              protocols. Pick your battleground and lock in your first move.
            </p>
          </div>

          {/* Tactile Gold-Trimmed Filter Bar */}
          <div className="inline-flex flex-wrap items-center gap-1 bg-[#141219]/95 border border-[#e6c27a]/25 p-1.5 rounded-xl self-start lg:self-auto shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
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
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-[#0c0b0e] font-bold'
                      : 'text-[#b4a99a] hover:text-[#f5f0e6]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tacticalFilterPill"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#e6c27a] to-[#c99b49] shadow-[0_2px_10px_rgba(230,194,122,0.3)]"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* 3-Column Illustrated Showroom Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game) => (
              <motion.div
                key={game.href}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                className="h-full"
              >
                <Link
                  href={game.href}
                  onClick={() => playSound('card_pick')}
                  className="atelier-card group flex flex-col justify-between h-full rounded-2xl bg-[#141219] border border-[#e6c27a]/20 hover:border-[#e6c27a]/55 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_16px_38px_rgba(0,0,0,0.5)]"
                >
                  <div>
                    {/* Top Half: Bespoke Key-Art Window */}
                    <div className="relative h-40 w-full overflow-hidden bg-[#0c0b0e]">
                      <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                        <GameArtwork id={game.artworkId} />
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141219] via-[#141219]/25 to-transparent" />

                      {/* Floating Top-Left Category Pill */}
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-md border backdrop-blur-md font-mono text-[10px] uppercase tracking-wider font-medium ${game.categoryBadge}`}
                      >
                        {game.categoryLabel}
                      </span>

                      {/* Floating Top-Right Status Pill */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {game.isNew && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d9383a] text-[#fff6ec] font-mono text-[10px] uppercase tracking-wider font-bold shadow">
                            <Sparkles className="w-2.5 h-2.5" />
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Half: Editorial Card Body */}
                    <div className="px-5 pt-3.5 pb-4">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <h2 className="font-display text-lg font-extrabold tracking-tight text-[#f5f0e6] group-hover:text-[#e6c27a] transition-colors">
                          {game.title}
                        </h2>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#9c9183] shrink-0">
                          {game.mode}
                        </span>
                      </div>

                      <p className="font-serif italic text-xs text-[#e6c27a]/90 mb-3">
                        {game.tagline}
                      </p>

                      <p className="text-xs sm:text-[13px] text-[#b4a99a] leading-relaxed line-clamp-2 mb-4">
                        {game.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {game.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-[#1c1923] border border-[#e6c27a]/15 font-mono text-[11px] text-[#d5c8b2]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Brass / Crimson Action Footer */}
                  <div className="px-5 py-3.5 border-t border-[#e6c27a]/12 bg-[#100e14]/80 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#9c9183]">
                      <Users className="w-3.5 h-3.5 text-[#c9a96e]" />
                      {game.players}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-display font-bold tracking-wide text-[#e6c27a] group-hover:text-[#fbe3b0] transition-colors">
                      <span>Enter Arena</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      <footer className="relative z-10 max-w-6xl w-full mx-auto px-5 sm:px-6 pb-8">
        <div className="pt-5 border-t border-[#e6c27a]/15 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-[#8f8476]">
          <span>Real-time 1v1 lobbies &amp; tactical AI</span>
          <span>6-char room sync · Instant rematch · Zero sign-up</span>
        </div>
      </footer>
    </div>
  );
}
