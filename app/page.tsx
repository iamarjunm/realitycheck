'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
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
  Spade,
  Crosshair,
  Flame,
  KeyRound,
  Brain,
  Bomb,
  FlaskConical,
  LayoutGrid,
  Users,
  ChevronRight,
  ArrowRight,
  Layers,
} from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import { playSound } from '@/lib/sounds';

const FEATURED_DUELS = [
  {
    href: '/mind-heist',
    title: 'Mind Heist',
    subtitle: 'Rotating 3-ring astral vault duel',
    description:
      'Split 12 Energy across 3 rotating chambers, plant Phantom Traps, counter-call rival ambushes, and trigger 6 tactical relics.',
    icon: Orbit,
    iconTint: 'text-rose-400',
    meta: '1v1 PvP + Solo AI',
    chips: ['3-Ring Vault', '12 Energy Split', 'Phantom Traps', '6 Relics'],
  },
  {
    href: '/reality-draft',
    title: 'Reality Draft',
    subtitle: 'Holographic anomaly card dueler',
    description:
      'Wield 12 reality-warping Anomaly Cards across rotating World Distortions with Double Stakes bluffs and Ward Shields.',
    icon: Gem,
    iconTint: 'text-amber-400',
    meta: '1v1 PvP + Solo AI',
    chips: ['12 Anomaly Cards', 'World Distortions', 'Double Stakes', 'Ward Shields'],
  },
] as const;

const PORTALS = [
  {
    href: '/tactical-games',
    title: 'Tactical Arenas',
    count: '9 games',
    subtitle: 'Live 1v1 PvP & Tactical AI',
    description:
      'Mind Heist, Reality Draft, Equilibrium, Quantum Matrix, Chronos Assassin, Glitch Roulette, Blind Vault, Void Step, and Shadow Strike.',
    icon: Layers,
    iconTint: 'text-indigo-400',
    span: 'md:col-span-3',
  },
  {
    href: '/card-games',
    title: 'Card Tables',
    count: '5 games',
    subtitle: 'High-stakes deduction & bluffs',
    description:
      "Death Parade, Sniper Hold'em, Doubt & Bet, Secret Order, and Memory Poker. Read tells, call bluffs, and break bankrolls.",
    icon: Spade,
    iconTint: 'text-amber-400',
    span: 'md:col-span-3',
  },
  {
    href: '/quizzes',
    title: 'Quizzes & Stat Cards',
    count: 'Diagnostics',
    subtitle: 'Personality verdicts & collectibles',
    description:
      'NPC stat cards, sharp personality roasts, LOR evaluations, and infinite abyss protocols.',
    icon: LayoutGrid,
    iconTint: 'text-emerald-400',
    span: 'md:col-span-2',
  },
  {
    href: '/experiences',
    title: 'Interactive Lab',
    count: '4 modules',
    subtitle: 'Behavioral experiments',
    description:
      'Behavioral Profiler, Precision Typing Test, 3 AM Brain spiral, and the Situationship Simulator.',
    icon: FlaskConical,
    iconTint: 'text-indigo-400',
    span: 'md:col-span-2',
  },
  {
    href: '/rage-games',
    title: 'Rage Suite',
    count: '6 challenges',
    subtitle: 'Precision arcade gauntlets',
    description:
      'Flip Rage, Mad Tap, Brain Lag, Tether Rage, Typo Terror, and Chaos Core bullet hell.',
    icon: Bomb,
    iconTint: 'text-rose-400',
    span: 'md:col-span-2',
  },
] as const;

const QUICK_LAUNCH_TACTICAL = [
  { href: '/mind-heist', label: 'Mind Heist', icon: Orbit, iconTint: 'text-rose-400', isNew: true },
  { href: '/reality-draft', label: 'Reality Draft', icon: Gem, iconTint: 'text-amber-400', isNew: true },
  { href: '/equilibrium', label: 'Equilibrium', icon: Sigma, iconTint: 'text-indigo-400', isNew: false },
  { href: '/quantum-matrix', label: 'Quantum Matrix', icon: Cpu, iconTint: 'text-indigo-400', isNew: false },
  { href: '/chronos', label: 'Chronos Assassin', icon: Clock, iconTint: 'text-zinc-400', isNew: false },
  { href: '/glitch-roulette', label: 'Glitch Roulette', icon: Skull, iconTint: 'text-rose-400', isNew: false },
  { href: '/blind-vault', label: 'Blind Vault', icon: Vault, iconTint: 'text-amber-400', isNew: false },
  { href: '/void-step', label: 'Void Step', icon: Grid2x2X, iconTint: 'text-zinc-400', isNew: false },
  { href: '/shadow-strike', label: 'Shadow Strike', icon: Radar, iconTint: 'text-emerald-400', isNew: false },
] as const;

const QUICK_LAUNCH_CARDS = [
  { href: '/card-game', label: 'Death Parade', icon: Spade, iconTint: 'text-emerald-400' },
  { href: '/sniper-holdem', label: "Sniper Hold'em", icon: Crosshair, iconTint: 'text-rose-400' },
  { href: '/doubt-and-bet', label: 'Doubt & Bet', icon: Flame, iconTint: 'text-indigo-400' },
  { href: '/secret-code', label: 'Secret Order', icon: KeyRound, iconTint: 'text-amber-400' },
  { href: '/memory-poker', label: 'Memory Poker', icon: Brain, iconTint: 'text-emerald-400' },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col">
      <GlobalNav activePortal="home" />

      <main className="max-w-6xl w-full mx-auto px-5 sm:px-6 pt-12 pb-16 sm:pt-16 sm:pb-24 flex-1">
        {/* Editorial Hero */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-3xl pb-12 mb-12 border-b border-zinc-800/80"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#111113] px-3 py-1 text-xs font-mono text-zinc-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>14 live multiplayer rooms · Instant 6-char codes</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-50 leading-[1.08] mb-4">
            Strategy, deduction, and psychological duels.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mb-8">
            Real-time 1v1 tactical arenas, high-stakes card tables, diagnostic stat cards, behavioral lab tools, and precision arcade gauntlets with zero sign-up.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/tactical-games"
              onClick={() => playSound('card_pick')}
              className="group inline-flex items-center gap-2 bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <span>Explore 1v1 Arenas</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/mind-heist"
              onClick={() => playSound('chip')}
              className="group inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <Orbit className="w-4 h-4 text-rose-400" />
              <span>Play Mind Heist</span>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.section>

        {/* Featured Duels (2-Column Showcase) */}
        <section className="mb-14">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
                Featured Duels
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Flagship 1v1 releases with live room codes and solo AI sparring.
              </p>
            </div>
            <Link
              href="/tactical-games"
              onClick={() => playSound('chip')}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
            >
              <span>All 9 arenas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {FEATURED_DUELS.map((game, i) => {
              const Icon = game.icon;
              return (
                <motion.div
                  key={game.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.06, duration: 0.3 }}
                >
                  <Link
                    href={game.href}
                    onClick={() => playSound('card_pick')}
                    className="group flex flex-col justify-between h-full rounded-2xl bg-[#111113] border border-zinc-800/90 hover:border-zinc-700 hover:bg-[#151518] p-6 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            <Icon className={`w-4 h-4 ${game.iconTint}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold tracking-tight text-zinc-50">
                                {game.title}
                              </h3>
                              <span className="px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400 font-mono text-[11px] font-medium">
                                New
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {game.subtitle}
                            </p>
                          </div>
                        </div>

                        <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 shrink-0">
                          <Users className="w-3.5 h-3.5" />
                          {game.meta}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-400 leading-relaxed mb-5 line-clamp-2">
                        {game.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {game.chips.map((chip) => (
                          <span
                            key={chip}
                            className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-zinc-50 transition-colors">
                      <span>Launch duel</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Directory / 5 Portals Grid */}
        <section className="mb-14">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
                Portals
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Five self-contained domains across competitive strategy, deduction, and diagnostics.
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              5 domains
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {PORTALS.map((portal, i) => {
              const Icon = portal.icon;
              return (
                <motion.div
                  key={portal.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.28 }}
                  className={portal.span}
                >
                  <Link
                    href={portal.href}
                    onClick={() => playSound('card_pick')}
                    className="group flex flex-col justify-between h-full min-h-[208px] rounded-xl bg-[#111113] border border-zinc-800/90 hover:border-zinc-700 hover:bg-[#151518] p-5 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                          <Icon className={`w-4 h-4 ${portal.iconTint}`} />
                        </div>
                        <span className="font-mono text-xs text-zinc-500 tabular-nums">
                          {portal.count}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold tracking-tight text-zinc-50 mb-0.5">
                        {portal.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mb-2.5">
                        {portal.subtitle}
                      </p>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {portal.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-zinc-50 transition-colors">
                      <span>Open portal</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Compact Quick-Launch Index */}
        <section className="rounded-2xl bg-[#111113] border border-zinc-800/90 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-zinc-800/80">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Quick-Launch Directory
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Jump directly into any live multiplayer room or solo AI match.
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              9 arenas · 5 tables
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-mono text-xs text-zinc-500">
                  Tactical Arenas (9)
                </span>
                <Link
                  href="/tactical-games"
                  onClick={() => playSound('chip')}
                  className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Browse hub
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_LAUNCH_TACTICAL.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => playSound('chip')}
                      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-50 transition-colors"
                    >
                      <Icon className={`w-3.5 h-3.5 ${item.iconTint}`} />
                      <span>{item.label}</span>
                      {item.isNew && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="New" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-mono text-xs text-zinc-500">
                  Card Tables (5)
                </span>
                <Link
                  href="/card-games"
                  onClick={() => playSound('chip')}
                  className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Browse hub
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_LAUNCH_CARDS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => playSound('chip')}
                      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-50 transition-colors"
                    >
                      <Icon className={`w-3.5 h-3.5 ${item.iconTint}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
