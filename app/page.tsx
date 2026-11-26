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
  Sparkles,
  Users,
  ChevronRight,
  Zap,
  Layers,
  Trophy,
} from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import { playSound } from '@/lib/sounds';

const SPOTLIGHT_GAMES = [
  {
    href: '/mind-heist',
    title: 'Mind Heist',
    badge: 'SURREAL FLAGSHIP · 1V1',
    subtitle: 'Rotating 3-Ring Astral Vault Duel',
    description:
      'Split 12 Energy across 3 rotating Mind Chambers, plant hidden Phantom Traps, Mind-Read counter-call rival ambushes, and slam 6 Surreal Relics including Mirage Split, Paranoia Glitch, Time Freeze & Doppelganger.',
    icon: Orbit,
    accentText: 'text-rose-300',
    accentBorder: 'border-rose-400/45 hover:border-fuchsia-300/90',
    accentGlow: 'shadow-[0_0_40px_rgba(244,63,94,0.14)] hover:shadow-[0_0_65px_rgba(217,70,239,0.3)]',
    bgGrad: 'from-rose-600/25 via-violet-950/45 to-[#070512]',
    topSheen: 'from-transparent via-rose-400/75 to-violet-400/75',
    orbOne: 'bg-rose-500/25',
    orbTwo: 'bg-violet-500/25',
    badgeStyle: 'bg-gradient-to-r from-rose-500/20 to-violet-500/20 border-rose-400/50 text-rose-200',
    ctaStyle: 'bg-gradient-to-r from-rose-500/20 to-violet-500/20 border-rose-400/50 text-rose-100 group-hover:from-rose-400 group-hover:to-violet-400 group-hover:text-black',
    chips: ['3-Ring Astral Vault', '12 Energy Split', 'Phantom Traps', 'Mind-Read Counter', '6 Surreal Relics'],
    formulaPreview: '3 RINGS · 12 ENERGY · 6 RELICS',
  },
  {
    href: '/reality-draft',
    title: 'Reality Draft',
    badge: 'SURREAL FLAGSHIP · 1V1',
    subtitle: 'Cosmic 3D Holographic Anomaly Dueler',
    description:
      'Wield 12 reality-warping 3D Anomaly Cards — Glass Titan, Zero Void, Bluff Phantom, Chaos Dice & Vampire Sigil — across rotating World Distortions with Double Stakes bluffs and Ward Shields.',
    icon: Gem,
    accentText: 'text-amber-300',
    accentBorder: 'border-fuchsia-400/45 hover:border-amber-300/90',
    accentGlow: 'shadow-[0_0_40px_rgba(217,70,239,0.14)] hover:shadow-[0_0_65px_rgba(251,191,36,0.28)]',
    bgGrad: 'from-fuchsia-600/25 via-purple-950/40 to-amber-950/25',
    topSheen: 'from-transparent via-fuchsia-400/75 to-amber-300/80',
    orbOne: 'bg-fuchsia-500/25',
    orbTwo: 'bg-amber-400/20',
    badgeStyle: 'bg-gradient-to-r from-fuchsia-500/20 to-amber-500/20 border-amber-400/50 text-amber-200',
    ctaStyle: 'bg-gradient-to-r from-fuchsia-500/20 to-amber-500/20 border-amber-400/50 text-amber-100 group-hover:from-fuchsia-400 group-hover:to-amber-300 group-hover:text-black',
    chips: ['12 Anomaly Cards', 'World Distortions', 'Double Stakes', 'Ward Shields', '3D Holographic'],
    formulaPreview: '12 ANOMALIES · 2× STAKES',
  },
] as const;

const PORTALS = [
  {
    href: '/tactical-games',
    title: 'Tactical Arenas',
    count: '9 1v1 Games',
    subtitle: 'Live PvP & Tactical AI',
    description:
      'Mind Heist, Reality Draft, Equilibrium, Quantum Matrix, Chronos Assassin, Glitch Roulette, Blind Vault, Void Step & Shadow Strike. Instant 6-char 1v1 rooms + solo AI sparring.',
    icon: Layers,
    span: 'md:col-span-3',
    gradient: 'from-cyan-500/18 via-sky-950/20 to-transparent',
    border: 'border-cyan-500/25 hover:border-cyan-400/65',
    glow: 'hover:shadow-[0_0_40px_rgba(34,211,238,0.16)]',
    text: 'text-cyan-400',
    pill: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    featured: true,
  },
  {
    href: '/card-games',
    title: 'Card Tables',
    count: '5 Tables',
    subtitle: 'High-Stakes Deduction',
    description:
      'Death Parade, Sniper Hold\'em, Doubt & Bet, Secret Order, and Memory Poker. Read tells, call bluffs, and break bankrolls solo or with friends.',
    icon: Spade,
    span: 'md:col-span-3',
    gradient: 'from-amber-500/18 via-emerald-950/20 to-transparent',
    border: 'border-amber-500/25 hover:border-amber-400/65',
    glow: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    text: 'text-amber-400',
    pill: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    featured: true,
  },
  {
    href: '/quizzes',
    title: 'Quizzes',
    count: 'Stat Cards & Roasts',
    subtitle: 'Diagnose Your Chaos',
    description:
      'NPC stat cards, savage personality roasts, restricted LOR evaluations, and infinite abyss protocols.',
    icon: LayoutGrid,
    span: 'md:col-span-2',
    gradient: 'from-sky-500/15 via-blue-950/20 to-transparent',
    border: 'border-sky-500/25 hover:border-sky-400/60',
    glow: 'hover:shadow-[0_0_36px_rgba(56,189,248,0.14)]',
    text: 'text-sky-400',
    pill: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
    featured: false,
  },
  {
    href: '/experiences',
    title: 'Weird Lab',
    count: '4 Experiments',
    subtitle: 'Interactive Side Quests',
    description:
      'Behavioral Profiler, Precision Typing Test, 3 AM Brain spiral, and the Situationship Simulator.',
    icon: FlaskConical,
    span: 'md:col-span-2',
    gradient: 'from-fuchsia-500/15 via-purple-950/20 to-transparent',
    border: 'border-fuchsia-500/25 hover:border-fuchsia-400/60',
    glow: 'hover:shadow-[0_0_36px_rgba(217,70,239,0.14)]',
    text: 'text-fuchsia-400',
    pill: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
    featured: false,
  },
  {
    href: '/rage-games',
    title: 'Rage Suite',
    count: '6 Gauntlets',
    subtitle: 'Keyboard Breakers',
    description:
      'Flip Rage, Mad Tap, Brain Lag, Tether Rage, Typo Terror, and Chaos Core bullet hell.',
    icon: Bomb,
    span: 'md:col-span-2',
    gradient: 'from-rose-500/18 via-red-950/20 to-transparent',
    border: 'border-rose-500/25 hover:border-rose-400/60',
    glow: 'hover:shadow-[0_0_36px_rgba(244,63,94,0.15)]',
    text: 'text-rose-400',
    pill: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    featured: false,
  },
] as const;

const QUICK_LAUNCH_TACTICAL = [
  { href: '/mind-heist', label: 'Mind Heist', icon: Orbit, style: 'border-rose-400/50 bg-gradient-to-r from-rose-500/20 to-violet-500/20 text-rose-100 hover:border-fuchsia-300 hover:from-rose-500/30 hover:to-violet-500/30', isNew: true },
  { href: '/reality-draft', label: 'Reality Draft', icon: Gem, style: 'border-amber-400/50 bg-gradient-to-r from-fuchsia-500/20 to-amber-500/20 text-amber-100 hover:border-amber-300 hover:from-fuchsia-500/30 hover:to-amber-500/30', isNew: true },
  { href: '/equilibrium', label: 'Equilibrium', icon: Sigma, style: 'border-cyan-400/35 bg-cyan-500/12 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-500/25', isNew: false },
  { href: '/quantum-matrix', label: 'Quantum Matrix', icon: Cpu, style: 'border-violet-400/35 bg-violet-500/12 text-violet-200 hover:border-violet-300 hover:bg-violet-500/25', isNew: false },
  { href: '/chronos', label: 'Chronos Assassin', icon: Clock, style: 'border-sky-500/30 bg-sky-500/10 text-sky-300 hover:border-sky-400 hover:bg-sky-500/20', isNew: false },
  { href: '/glitch-roulette', label: 'Glitch Roulette 1v1', icon: Skull, style: 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:border-rose-400 hover:bg-rose-500/20', isNew: false },
  { href: '/blind-vault', label: 'Blind Vault', icon: Vault, style: 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20', isNew: false },
  { href: '/void-step', label: 'Void Step', icon: Grid2x2X, style: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300 hover:border-fuchsia-400 hover:bg-fuchsia-500/20', isNew: false },
  { href: '/shadow-strike', label: 'Shadow Strike', icon: Radar, style: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20', isNew: false },
] as const;

const QUICK_LAUNCH_CARDS = [
  { href: '/card-game', label: 'Death Parade', icon: Spade, style: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20' },
  { href: '/sniper-holdem', label: "Sniper Hold'em", icon: Crosshair, style: 'border-red-500/25 bg-red-500/10 text-red-300 hover:border-red-400 hover:bg-red-500/20' },
  { href: '/doubt-and-bet', label: 'Doubt & Bet', icon: Flame, style: 'border-purple-500/25 bg-purple-500/10 text-purple-300 hover:border-purple-400 hover:bg-purple-500/20' },
  { href: '/secret-code', label: 'Secret Order', icon: KeyRound, style: 'border-amber-500/25 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20' },
  { href: '/memory-poker', label: 'Memory Poker', icon: Brain, style: 'border-teal-500/25 bg-teal-500/10 text-teal-300 hover:border-teal-400 hover:bg-teal-500/20' },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#04050a] text-white relative overflow-x-hidden flex flex-col">
      {/* Layered Obsidian Ambient Backdrops */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1100px] h-[540px] bg-cyan-500/[0.08] rounded-full blur-[140px]" />
        <div className="absolute top-[22%] -left-24 w-[620px] h-[520px] bg-violet-600/[0.08] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] -right-24 w-[640px] h-[480px] bg-amber-500/[0.07] rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-grid-white opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#04050a]/30 to-[#04050a]" />
      </div>

      <GlobalNav activePortal="home" />

      <main className="relative z-10 max-w-7xl w-full mx-auto px-5 sm:px-6 pt-10 pb-16 sm:pt-14 sm:pb-20 flex-1">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-4xl mx-auto mb-12 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/25 bg-cyan-500/[0.08] backdrop-blur-md px-4 py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.26em] text-cyan-200 mb-6 shadow-[0_0_25px_rgba(34,211,238,0.12)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            20+ PLAYABLE MODULES · LIVE 1V1 ROOMS
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-[5.25rem] font-black uppercase tracking-tighter leading-[0.92] text-white mb-5">
            REALITY{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-400 to-amber-300">
              CHECK
            </span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            An interactive arcade OS of <span className="text-white font-medium">real-time 1v1 strategy duels</span>, high-stakes deduction tables, diagnostic roast quizzes, behavioral lab experiments, and keyboard-shattering gauntlets.
          </p>

          {/* Dual Primary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/mind-heist"
              onClick={() => playSound('card_pick')}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-400 via-fuchsia-400 to-amber-300 px-6 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[0_0_36px_rgba(244,63,94,0.38)] hover:shadow-[0_0_52px_rgba(217,70,239,0.55)] hover:-translate-y-0.5 transition-all"
            >
              <Orbit className="w-4 h-4" />
              Play Mind Heist 1v1
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/tactical-games"
              onClick={() => playSound('chip')}
              className="group inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] hover:border-fuchsia-400/50 backdrop-blur-md px-6 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:-translate-y-0.5 transition-all"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              Explore 9 Live 1v1 Arenas
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.section>

        {/* Surreal Flagship Spotlight Row (Mind Heist + Reality Draft) */}
        <section className="mb-12 sm:mb-14">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Surreal Flagship Spotlight · New 1v1 Releases</span>
            </div>
            <Link
              href="/tactical-games"
              onClick={() => playSound('chip')}
              className="text-[11px] font-mono uppercase tracking-widest text-fuchsia-300 hover:text-amber-200 inline-flex items-center gap-1 transition-colors"
            >
              All 9 Arenas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {SPOTLIGHT_GAMES.map((game, i) => {
              const Icon = game.icon;
              return (
                <motion.div
                  key={game.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <Link
                    href={game.href}
                    onClick={() => playSound('card_pick')}
                    className={`group relative flex flex-col justify-between h-full rounded-3xl border bg-[#070612]/92 backdrop-blur-xl p-6 sm:p-7 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${game.accentBorder} ${game.accentGlow}`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${game.topSheen} opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.bgGrad} opacity-85 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                    <div className={`absolute -right-12 -top-12 w-52 h-52 rounded-full blur-3xl animate-pulse pointer-events-none ${game.orbOne}`} />
                    <div className={`absolute -left-14 -bottom-16 w-48 h-48 rounded-full blur-3xl opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none ${game.orbTwo}`} />

                    <div className="relative z-10">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-2xl border border-white/15 bg-black/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${game.accentText}`}>
                            <Icon className="w-6 h-6 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                          </div>
                          <div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-widest ${game.badgeStyle}`}>
                              <Sparkles className="w-3 h-3" />
                              {game.badge}
                            </span>
                            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-300/80 mt-1">
                              {game.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/15 bg-black/65 font-mono text-[11px] text-zinc-200">
                          {game.formulaPreview}
                        </div>
                      </div>

                      <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2.5">
                        {game.title}
                      </h2>

                      <p className="text-sm text-zinc-200/90 leading-relaxed mb-5">
                        {game.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {game.chips.map((chip) => (
                          <span
                            key={chip}
                            className="px-2.5 py-1 rounded-lg border border-white/12 bg-black/60 text-[10px] font-mono uppercase tracking-wider text-zinc-200"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                        <Users className="w-3.5 h-3.5 text-zinc-200" />
                        Live 1v1 PvP + Solo AI
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${game.ctaStyle}`}>
                        Launch Duel
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 5 Portal Bento Grid */}
        <section className="mb-12 sm:mb-14">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-400">
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>Choose Your Portal · 5 Domains</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {PORTALS.map((portal, i) => {
              const Icon = portal.icon;
              return (
                <motion.div
                  key={portal.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.06 }}
                  className={portal.span}
                >
                  <Link
                    href={portal.href}
                    onClick={() => playSound('card_pick')}
                    className={`group relative flex flex-col justify-between h-full ${
                      portal.featured ? 'min-h-[245px]' : 'min-h-[225px]'
                    } rounded-2xl border bg-[#070912]/85 backdrop-blur-xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${portal.border} ${portal.glow}`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${portal.gradient} opacity-55 group-hover:opacity-100 transition-opacity pointer-events-none`}
                    />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className={`p-2.5 rounded-xl border border-white/10 bg-black/55 ${portal.text}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${portal.pill}`}>
                          {portal.count}
                        </span>
                      </div>

                      <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
                        {portal.title}
                      </h3>
                      <p className={`text-[10px] font-mono uppercase tracking-[0.22em] mb-3 ${portal.text}`}>
                        {portal.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                        {portal.description}
                      </p>
                    </div>

                    <div className={`relative z-10 mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-black uppercase tracking-widest ${portal.text}`}>
                      <span>Enter Portal</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* All-Games Quick-Launch Strip */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="rounded-2xl border border-white/10 bg-[#070912]/80 backdrop-blur-xl p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-zinc-300">
                Direct Quick-Launch · 14 Live Multiplayer Rooms
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              9 Tactical Arenas · 5 Card Tables
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {QUICK_LAUNCH_TACTICAL.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => playSound('chip')}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-all hover:-translate-y-0.5 ${item.style}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.isNew && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded bg-white/15 text-[8px] font-black tracking-widest text-white">
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              {QUICK_LAUNCH_CARDS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => playSound('chip')}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-all hover:-translate-y-0.5 ${item.style}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
