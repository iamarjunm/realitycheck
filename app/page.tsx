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
  Sparkles,
  Crown,
} from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import GameArtwork, { type GameArtworkId } from '@/components/GameArtwork';
import { playSound } from '@/lib/sounds';

interface SpotlightGame {
  id: GameArtworkId;
  href: string;
  title: string;
  shortTitle: string;
  italicSubtitle: string;
  badge: string;
  mode: string;
  pitch: string;
  callouts: readonly string[];
  accentText: string;
  glow: string;
}

const SPOTLIGHT_GAMES: readonly SpotlightGame[] = [
  {
    id: 'mind-heist',
    href: '/mind-heist',
    title: 'Mind Heist',
    shortTitle: 'Mind Heist',
    italicSubtitle: 'Rotating 3-ring astral vault duel',
    badge: 'Flagship · New',
    mode: '1v1 PvP + Solo AI',
    pitch:
      'Split 12 Energy across 3 rotating Mind Chambers, plant Phantom Traps, counter-call rival ambushes, and unleash 6 surreal relics.',
    callouts: ['3-Ring Vault', 'Phantom Traps', '6 Tactical Relics'],
    accentText: 'text-[#e6c27a]',
    glow: 'from-[#d9383a]/20 via-[#e6c27a]/10 to-transparent',
  },
  {
    id: 'reality-draft',
    href: '/reality-draft',
    title: 'Reality Draft',
    shortTitle: 'Reality Draft',
    italicSubtitle: 'Holographic anomaly card dueler',
    badge: 'Flagship · New',
    mode: '1v1 PvP + Solo AI',
    pitch:
      'Wield 12 reality-warping Anomaly Cards under shifting World Distortions with Double Stakes bluffs and timed Ward Shields.',
    callouts: ['12 Anomaly Cards', 'World Distortions', 'Double Stakes'],
    accentText: 'text-[#e6c27a]',
    glow: 'from-[#e6c27a]/20 via-[#c2783a]/10 to-transparent',
  },
  {
    id: 'glitch-roulette',
    href: '/glitch-roulette',
    title: 'Glitch Roulette',
    shortTitle: 'Glitch Roulette',
    italicSubtitle: 'Mod-chip buckshot chamber duel',
    badge: 'High Voltage',
    mode: '1v1 + 3 Bosses',
    pitch:
      'Loaded revolver 1v1 PvP or 3-Boss gauntlet. Deploy 6 Reality Mod Chips, peek chambers with Private X-Ray, and flip shell polarity.',
    callouts: ['6 Mod Chips', 'Private X-Ray', '3 Boss Gauntlet'],
    accentText: 'text-[#e85d5f]',
    glow: 'from-[#d9383a]/25 via-[#8c1d23]/10 to-transparent',
  },
  {
    id: 'chronos',
    href: '/chronos',
    title: 'Chronos Assassin',
    shortTitle: 'Chronos Assassin',
    italicSubtitle: 'Time-loop 5×5 tactical ambush',
    badge: 'Time Loop',
    mode: '1v1 PvP + Solo AI',
    pitch:
      'Program 5 simultaneous ticks across 4 cover arenas, survive the crossfire, rewind time, and outmaneuver your rival’s Ghost.',
    callouts: ['4 Cover Maps', 'T1–T5 Timeline', 'Ghost Rewind'],
    accentText: 'text-[#d9c498]',
    glow: 'from-[#8f7b56]/22 via-[#e6c27a]/8 to-transparent',
  },
] as const;

interface SignatureDuel {
  artworkId: GameArtworkId;
  href: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  tagTone: string;
  meta: string;
}

const SIGNATURE_DUELS: readonly SignatureDuel[] = [
  {
    artworkId: 'mind-heist',
    href: '/mind-heist',
    title: 'Mind Heist',
    subtitle: 'Astral vault mindgame',
    description:
      'Allocate 12 Energy across 3 rotating rings, lay Phantom Traps, and counter-read your rival.',
    tag: 'Surreal · New',
    tagTone: 'border-[#e6c27a]/45 bg-[#1b1410]/85 text-[#e6c27a]',
    meta: '1v1 + AI',
  },
  {
    artworkId: 'reality-draft',
    href: '/reality-draft',
    title: 'Reality Draft',
    subtitle: 'Anomaly card dueler',
    description:
      'Draft 12 cosmic anomalies under shifting World Distortions and call Double Stakes.',
    tag: 'Draft · New',
    tagTone: 'border-[#d99242]/45 bg-[#1c140e]/85 text-[#f0b468]',
    meta: '1v1 + AI',
  },
  {
    artworkId: 'equilibrium',
    href: '/equilibrium',
    title: 'Equilibrium',
    subtitle: 'Keynesian Nash duel',
    description:
      'Outthink 0–100 psychological equations, spring the 100-crushes-0 trap, and land Prime strikes.',
    tag: 'Pure IQ',
    tagTone: 'border-[#c4a77d]/40 bg-[#171412]/85 text-[#dfd0b8]',
    meta: '1v1 + AI',
  },
  {
    artworkId: 'quantum-matrix',
    href: '/quantum-matrix',
    title: 'Quantum Matrix',
    subtitle: '4×4 spatial math war',
    description:
      'Capture power cores with Exact-10 Hijacks, 2× Amplifiers, and Polarity Inversions.',
    tag: 'Math Grid',
    tagTone: 'border-[#d9383a]/45 bg-[#1d1012]/85 text-[#f28587]',
    meta: 'Minimax AI',
  },
];

const FIVE_HOUSES = [
  {
    href: '/tactical-games',
    title: 'Tactical Arenas',
    serifWord: 'Grandmaster',
    count: '9 Arenas',
    subtitle: 'Live 1v1 PvP & Tactical AI',
    description:
      'Mind Heist, Reality Draft, Equilibrium, Quantum Matrix, Chronos Assassin, Glitch Roulette, Blind Vault, Void Step, and Shadow Strike.',
    icon: Layers,
    watermark: Crown,
    span: 'md:col-span-3',
    surface:
      'bg-gradient-to-br from-[#231215] via-[#171216] to-[#110f14] border-[#e6c27a]/25 hover:border-[#e6c27a]/60',
    accentLine: 'from-[#e6c27a] via-[#d9383a] to-transparent',
    badgeClass: 'border-[#e6c27a]/30 bg-[#e6c27a]/10 text-[#e6c27a]',
    iconBox: 'border-[#e6c27a]/30 bg-[#1e1514] text-[#e6c27a]',
    ctaColor: 'text-[#e6c27a] group-hover:text-[#f7dfb0]',
    watermarkColor: 'text-[#e6c27a]/[0.06] group-hover:text-[#e6c27a]/[0.11]',
  },
  {
    href: '/card-games',
    title: 'Card Tables',
    serifWord: 'Velvet Parlor',
    count: '5 Tables',
    subtitle: 'High-stakes deduction & bluffs',
    description:
      "Death Parade, Sniper Hold'em, Doubt & Bet, Secret Order, and Memory Poker. Read tells, call bluffs, and break bankrolls.",
    icon: Spade,
    watermark: Spade,
    span: 'md:col-span-3',
    surface:
      'bg-gradient-to-br from-[#07261d] via-[#0d1916] to-[#101214] border-[#3da37d]/30 hover:border-[#e6c27a]/55',
    accentLine: 'from-[#4fc499] via-[#e6c27a] to-transparent',
    badgeClass: 'border-[#4fc499]/30 bg-[#0b2e23]/80 text-[#7ee0ba]',
    iconBox: 'border-[#e6c27a]/30 bg-[#092119] text-[#e6c27a]',
    ctaColor: 'text-[#7ee0ba] group-hover:text-[#e6c27a]',
    watermarkColor: 'text-[#4fc499]/[0.07] group-hover:text-[#4fc499]/[0.13]',
  },
  {
    href: '/quizzes',
    title: 'Quizzes & Stat Cards',
    serifWord: 'The Dossier',
    count: 'Diagnostics',
    subtitle: 'Personality verdicts & collectibles',
    description:
      'NPC stat cards, razor-sharp personality roasts, LOR negotiations, and infinite abyss protocols.',
    icon: LayoutGrid,
    watermark: Sparkles,
    span: 'md:col-span-2',
    surface:
      'bg-gradient-to-br from-[#201229] via-[#16111c] to-[#110f15] border-[#c49be6]/25 hover:border-[#e6c27a]/55',
    accentLine: 'from-[#c49be6] via-[#e6c27a] to-transparent',
    badgeClass: 'border-[#c49be6]/30 bg-[#2a1736]/80 text-[#dfc2f7]',
    iconBox: 'border-[#c49be6]/30 bg-[#1e1226] text-[#dfc2f7]',
    ctaColor: 'text-[#dfc2f7] group-hover:text-[#e6c27a]',
    watermarkColor: 'text-[#c49be6]/[0.06] group-hover:text-[#c49be6]/[0.12]',
  },
  {
    href: '/experiences',
    title: 'The Weird Lab',
    serifWord: 'Curated Studio',
    count: '4 Modules',
    subtitle: 'Behavioral experiments',
    description:
      'Behavioral Profiler, Precision Typing Test, 3 AM Brain spiral, and the Situationship Simulator.',
    icon: FlaskConical,
    watermark: FlaskConical,
    span: 'md:col-span-2',
    surface:
      'bg-gradient-to-br from-[#24180d] via-[#18130f] to-[#110f12] border-[#d99242]/30 hover:border-[#e6c27a]/60',
    accentLine: 'from-[#e5a352] via-[#e6c27a] to-transparent',
    badgeClass: 'border-[#e5a352]/30 bg-[#2b1c0e]/80 text-[#f3be7a]',
    iconBox: 'border-[#e5a352]/30 bg-[#22160c] text-[#f3be7a]',
    ctaColor: 'text-[#f3be7a] group-hover:text-[#fde0b0]',
    watermarkColor: 'text-[#e5a352]/[0.06] group-hover:text-[#e5a352]/[0.12]',
  },
  {
    href: '/rage-games',
    title: 'Rage Suite',
    serifWord: 'Vermilion Trial',
    count: '6 Gauntlets',
    subtitle: 'Unforgiving reflex arcade',
    description:
      'Flip Rage, Mad Tap, Brain Lag, Tether Rage, Typo Terror, and Chaos Core bullet hell.',
    icon: Bomb,
    watermark: Flame,
    span: 'md:col-span-2',
    surface:
      'bg-gradient-to-br from-[#2a1013] via-[#180f12] to-[#110d10] border-[#d9383a]/35 hover:border-[#e85d5f]/70',
    accentLine: 'from-[#d9383a] via-[#e6c27a] to-transparent',
    badgeClass: 'border-[#d9383a]/40 bg-[#321216]/85 text-[#f48284]',
    iconBox: 'border-[#d9383a]/40 bg-[#261013] text-[#f48284]',
    ctaColor: 'text-[#f48284] group-hover:text-[#ffb4b5]',
    watermarkColor: 'text-[#d9383a]/[0.08] group-hover:text-[#d9383a]/[0.14]',
  },
] as const;

const QUICK_LAUNCH_TACTICAL = [
  { href: '/mind-heist', label: 'Mind Heist', icon: Orbit, isNew: true },
  { href: '/reality-draft', label: 'Reality Draft', icon: Gem, isNew: true },
  { href: '/equilibrium', label: 'Equilibrium', icon: Sigma, isNew: false },
  { href: '/quantum-matrix', label: 'Quantum Matrix', icon: Cpu, isNew: false },
  { href: '/chronos', label: 'Chronos Assassin', icon: Clock, isNew: false },
  { href: '/glitch-roulette', label: 'Glitch Roulette', icon: Skull, isNew: false },
  { href: '/blind-vault', label: 'Blind Vault', icon: Vault, isNew: false },
  { href: '/void-step', label: 'Void Step', icon: Grid2x2X, isNew: false },
  { href: '/shadow-strike', label: 'Shadow Strike', icon: Radar, isNew: false },
] as const;

const QUICK_LAUNCH_CARDS = [
  { href: '/card-game', label: 'Death Parade', icon: Spade },
  { href: '/sniper-holdem', label: "Sniper Hold'em", icon: Crosshair },
  { href: '/doubt-and-bet', label: 'Doubt & Bet', icon: Flame },
  { href: '/secret-code', label: 'Secret Order', icon: KeyRound },
  { href: '/memory-poker', label: 'Memory Poker', icon: Brain },
] as const;

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = SPOTLIGHT_GAMES[activeIndex];

  return (
    <div className="min-h-screen bg-[#0c0b0e] atelier-bg text-[#f5f0e6] flex flex-col relative overflow-x-hidden">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <div className="relative z-40">
        <GlobalNav activePortal="home" />
      </div>

      <main className="relative z-10 max-w-6xl w-full mx-auto px-5 sm:px-6 pt-10 pb-20 sm:pt-14 sm:pb-24 flex-1">
        {/* HERO SPLIT-STAGE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center pb-14 mb-16 border-b border-[#e6c27a]/15">
          {/* Left: Editorial Manifesto */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-6 flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#e6c27a]/30 bg-[#17131a]/90 px-3.5 py-1.5 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#e6c27a]" />
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#e6c27a]">
                The House of High-Stakes Mindgames
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl xl:text-[3.5rem] font-extrabold tracking-tight text-[#f5f0e6] leading-[1.02] mb-5">
              OUTSMART.
              <br />
              OUTBLUFF.
              <span className="block font-serif italic font-normal text-[#e6c27a] tracking-normal mt-1">
                Outplay.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#b9ae9f] leading-relaxed max-w-lg mb-8">
              Real-time 1v1 tactical arenas, velvet-parlor card tables, sharp psychological dossiers,
              and unforgiving reflex gauntlets — instant 6-character room codes, zero sign-up.
            </p>

            {/* Primary & Secondary Tactile Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-10">
              <Link
                href="/tactical-games"
                onClick={() => playSound('card_pick')}
                className="btn-brass group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-display text-sm font-bold tracking-wide"
              >
                <span>Enter 1v1 Arenas</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/mind-heist"
                onClick={() => playSound('chip')}
                className="btn-obsidian group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-[#f5f0e6]"
              >
                <Orbit className="w-4 h-4 text-[#e6c27a]" />
                <span>Play Mind Heist</span>
                <ChevronRight className="w-4 h-4 text-[#b4a99a] group-hover:text-[#e6c27a] transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* 3-Stat Architectural Bar */}
            <div className="w-full max-w-md grid grid-cols-3 divide-x divide-[#e6c27a]/15 rounded-xl border border-[#e6c27a]/15 bg-[#131117]/80 px-2 py-3.5 backdrop-blur-sm">
              <div className="px-3">
                <div className="font-display text-xl sm:text-2xl font-extrabold text-[#e6c27a] tabular-nums leading-none">
                  9
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#9c9183] mt-1.5">
                  1v1 Arenas
                </div>
              </div>
              <div className="px-3">
                <div className="font-display text-xl sm:text-2xl font-extrabold text-[#f5f0e6] tabular-nums leading-none">
                  5
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#9c9183] mt-1.5">
                  Card Tables
                </div>
              </div>
              <div className="px-3">
                <div className="font-display text-xl sm:text-2xl font-extrabold text-[#e85d5f] tabular-nums leading-none">
                  6
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#9c9183] mt-1.5">
                  Rage Trials
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Interactive Live Showcase Deck */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="lg:col-span-6"
          >
            <div className="atelier-card relative rounded-2xl border border-[#e6c27a]/25 bg-[#141219]/95 p-3 sm:p-4 shadow-[0_24px_70px_rgba(0,0,0,0.65)] overflow-hidden">
              {/* Ambient accent aura for active game */}
              <div
                className={`pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br ${active.glow} blur-3xl transition-all duration-500`}
              />

              {/* Spotlight Tab Strip */}
              <div className="relative z-10 flex items-center gap-1 p-1 rounded-xl bg-[#0d0c11]/90 border border-[#e6c27a]/15 mb-3 overflow-x-auto no-scrollbar">
                {SPOTLIGHT_GAMES.map((item, idx) => {
                  const isSelected = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        playSound('tick');
                        setActiveIndex(idx);
                      }}
                      className={`relative flex-1 min-w-max px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? 'text-[#0c0b0e] font-bold'
                          : 'text-[#a79c8d] hover:text-[#f5f0e6]'
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="heroSpotlightTab"
                          transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#e6c27a] to-[#c99b49] shadow-[0_2px_10px_rgba(230,194,122,0.28)]"
                        />
                      )}
                      <span className="relative z-10">{item.shortTitle}</span>
                    </button>
                  );
                })}
              </div>

              {/* Animated Key-Art Stage */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  className="relative z-10"
                >
                  {/* Artwork Viewport */}
                  <div className="relative h-52 sm:h-60 w-full rounded-xl overflow-hidden border border-[#e6c27a]/20 bg-[#0d0c10] mb-4 group">
                    <div className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-105">
                      <GameArtwork id={active.id} />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141219] via-[#141219]/20 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#e6c27a]/15 rounded-xl" />

                    {/* Top Floating Pills */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0c0b0e]/85 border border-[#e6c27a]/30 backdrop-blur-md font-mono text-[11px] text-[#e6c27a]">
                        <Users className="w-3 h-3" />
                        {active.mode}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-[#1e1214]/90 border border-[#d9383a]/40 backdrop-blur-md font-mono text-[10px] uppercase tracking-wider text-[#f7c896]">
                        {active.badge}
                      </span>
                    </div>

                    {/* Title overlay tucked into bottom scrim */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                      <div>
                        <h2 className="font-display text-2xl sm:text-[1.65rem] font-extrabold tracking-tight text-[#f5f0e6] leading-tight drop-shadow">
                          {active.title}
                        </h2>
                        <p className={`font-serif italic text-sm ${active.accentText}`}>
                          {active.italicSubtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stage Details & Instant Launch */}
                  <div className="px-1">
                    <p className="text-xs sm:text-sm text-[#bfb5a6] leading-relaxed mb-4">
                      {active.pitch}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e6c27a]/15">
                      <div className="flex flex-wrap gap-1.5">
                        {active.callouts.map((callout) => (
                          <span
                            key={callout}
                            className="px-2.5 py-1 rounded-md bg-[#1c1922] border border-[#e6c27a]/15 font-mono text-[11px] text-[#d7ccb8]"
                          >
                            {callout}
                          </span>
                        ))}
                      </div>

                      <Link
                        href={active.href}
                        onClick={() => playSound('card_pick')}
                        className="btn-brass group inline-flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs font-bold tracking-wide shrink-0"
                      >
                        <span>Launch Duel</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* SIGNATURE 1V1 SHOWCASE ROW */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#c9a96e] mb-1.5">
                Featured Floor · Flagship Duels
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f5f0e6]">
                Signature{' '}
                <span className="font-serif italic font-normal text-[#e6c27a]">1v1 Arenas</span>
              </h2>
            </div>

            <Link
              href="/tactical-games"
              onClick={() => playSound('chip')}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#d4b67d] hover:text-[#f5f0e6] transition-colors shrink-0"
            >
              <span>Inspect all 9 arenas</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SIGNATURE_DUELS.map((game, i) => (
              <motion.div
                key={game.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                className="h-full"
              >
                <Link
                  href={game.href}
                  onClick={() => playSound('card_pick')}
                  className="atelier-card group flex flex-col justify-between h-full rounded-2xl bg-[#141219] border border-[#e6c27a]/20 hover:border-[#e6c27a]/55 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_14px_34px_rgba(0,0,0,0.45)]"
                >
                  <div>
                    {/* Key-Art Window */}
                    <div className="relative h-40 w-full overflow-hidden bg-[#0c0b0e]">
                      <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                        <GameArtwork id={game.artworkId} />
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141219] via-[#141219]/25 to-transparent" />
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-md border backdrop-blur-md font-mono text-[10px] uppercase tracking-wider font-medium ${game.tagTone}`}
                      >
                        {game.tag}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="px-4 pt-3 pb-4">
                      <h3 className="font-display text-lg font-bold tracking-tight text-[#f5f0e6] group-hover:text-[#e6c27a] transition-colors">
                        {game.title}
                      </h3>
                      <p className="font-serif italic text-xs text-[#cbb893] mb-2.5">
                        {game.subtitle}
                      </p>
                      <p className="text-xs text-[#a89e90] leading-relaxed line-clamp-2">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-[#e6c27a]/12 bg-[#100e14]/70 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[#9c9183]">{game.meta}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#e6c27a] group-hover:text-[#fae1aa] transition-colors">
                      <span>Duel</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* THE FIVE HOUSES — Distinct Material Showrooms */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#c9a96e] mb-1.5">
                Curated Wings · 5 Distinct Floors
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f5f0e6]">
                The Five{' '}
                <span className="font-serif italic font-normal text-[#e6c27a]">Houses</span>
              </h2>
            </div>
            <span className="font-mono text-xs text-[#9c9183]">
              Strategy · Velvet Cards · Dossiers · Lab · Gauntlets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
            {FIVE_HOUSES.map((house, i) => {
              const Icon = house.icon;
              const Watermark = house.watermark;
              return (
                <motion.div
                  key={house.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.3 }}
                  className={house.span}
                >
                  <Link
                    href={house.href}
                    onClick={() => playSound('card_pick')}
                    className={`group relative flex flex-col justify-between h-full min-h-[232px] rounded-2xl border p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_16px_40px_rgba(0,0,0,0.48)] ${house.surface}`}
                  >
                    {/* Top Metallic Accent Rule */}
                    <div
                      className={`pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${house.accentLine} opacity-80`}
                    />

                    {/* Stylized Watermark Background Art */}
                    <Watermark
                      aria-hidden="true"
                      className={`pointer-events-none absolute -bottom-7 -right-7 w-40 h-40 rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${house.watermarkColor}`}
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-2 mb-5">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner ${house.iconBox}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md border font-mono text-[11px] font-medium tabular-nums ${house.badgeClass}`}
                        >
                          {house.count}
                        </span>
                      </div>

                      <div className="font-serif italic text-xs text-[#d6c29c]/85 mb-0.5">
                        {house.serifWord}
                      </div>
                      <h3 className="font-display text-xl font-extrabold tracking-tight text-[#f5f0e6] mb-1">
                        {house.title}
                      </h3>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#9f9486] mb-3">
                        {house.subtitle}
                      </p>
                      <p className="text-sm text-[#bfb5a6] leading-relaxed max-w-md">
                        {house.description}
                      </p>
                    </div>

                    <div className="relative z-10 mt-6 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                      <span className={`transition-colors ${house.ctaColor}`}>Enter House</span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${house.ctaColor}`}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* FULL GAME DIRECTORY STRIP */}
        <section className="atelier-card rounded-2xl bg-[#131118]/95 border border-[#e6c27a]/20 p-5 sm:p-7 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-5 mb-6 border-b border-[#e6c27a]/15">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] mb-1">
                House Ledger · Instant Rooms
              </div>
              <h2 className="font-display text-lg font-bold text-[#f5f0e6]">
                Full Game Directory
              </h2>
            </div>
            <span className="font-mono text-xs text-[#9c9183] tabular-nums">
              9 Tactical Arenas · 5 Card Tables
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#e6c27a]">
                  Tactical Arenas (9)
                </span>
                <Link
                  href="/tactical-games"
                  onClick={() => playSound('chip')}
                  className="text-xs font-medium text-[#b4a99a] hover:text-[#e6c27a] transition-colors"
                >
                  Open showroom →
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
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1a1721] hover:bg-[#231e2a] border border-[#e6c27a]/15 hover:border-[#e6c27a]/45 px-3 py-2 text-xs font-medium text-[#e5dccb] hover:text-[#f5f0e6] transition-all"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#e6c27a]" />
                      <span>{item.label}</span>
                      {item.isNew && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[#d9383a] ring-2 ring-[#d9383a]/30"
                          aria-label="New"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-5 border-t border-[#e6c27a]/12">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#7ee0ba]">
                  Card Tables (5)
                </span>
                <Link
                  href="/card-games"
                  onClick={() => playSound('chip')}
                  className="text-xs font-medium text-[#b4a99a] hover:text-[#7ee0ba] transition-colors"
                >
                  Enter parlor →
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
                      className="inline-flex items-center gap-2 rounded-lg bg-[#111c19] hover:bg-[#152722] border border-[#4fc499]/20 hover:border-[#e6c27a]/45 px-3 py-2 text-xs font-medium text-[#dce8e2] hover:text-[#f5f0e6] transition-all"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#e6c27a]" />
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
