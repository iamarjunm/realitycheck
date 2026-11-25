'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { LayoutGrid, FlaskConical, Spade, ChevronRight, Crosshair, Flame, Bomb, KeyRound, Brain, Clock, Skull, Vault, Grid2x2X, Radar } from 'lucide-react';
const PORTALS = [
  {
    href: '/quizzes',
    title: 'Quizzes',
    subtitle: 'Diagnose your chaos',
    description: 'Stat cards, roasts, LOR evaluations, and reality checks. Pick a module and get your collectible result.',
    icon: LayoutGrid,
    accent: 'cyan',
    gradient: 'from-cyan-500/20 via-cyan-900/10 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]',
    text: 'text-cyan-400',
    badge: 'NPC Stat Cards',
  },
  {
    href: '/experiences',
    title: 'Experiences',
    subtitle: 'The weird lab',
    description: 'Profiler, typing test, 3 AM brain, situationship simulator — experimental side quests.',
    icon: FlaskConical,
    accent: 'fuchsia',
    gradient: 'from-fuchsia-500/20 via-fuchsia-900/10 to-transparent',
    border: 'border-fuchsia-500/30 hover:border-fuchsia-400/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(217,70,239,0.15)]',
    text: 'text-fuchsia-400',
    badge: 'Experiments',
  },
  {
    href: '/card-games',
    title: 'Card Games',
    subtitle: 'High-stakes tables',
    description: 'Death Parade, Sniper Hold\'em, Doubt & Bet, Secret Order, and Memory Poker. Solo bots or live multiplayer.',
    icon: Spade,
    accent: 'amber',
    gradient: 'from-amber-500/15 via-emerald-900/10 to-transparent',
    border: 'border-amber-500/25 hover:border-amber-400/50',
    glow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.12)]',
    text: 'text-amber-400',
    badge: 'Multiplayer',
  },
  {
    href: '/tactical-games',
    title: 'Tactical Arenas',
    subtitle: '5 Live 1v1 Duels',
    description: 'Chronos Assassin, Glitch Roulette 1v1, Blind Vault, Void Step & Shadow Strike. Live PvP rooms + AI.',
    icon: Clock,
    accent: 'sky',
    gradient: 'from-sky-500/20 via-rose-900/10 to-transparent',
    border: 'border-sky-500/30 hover:border-sky-400/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(56,189,248,0.15)]',
    text: 'text-sky-400',
    badge: '1v1 PvP',
  },
  {
    href: '/rage-games',
    title: 'Rage Games',
    subtitle: 'Test your patience',
    description: 'Meticulously designed experiences engineered to ruin your day. Try not to break your keyboard.',
    icon: Bomb,
    accent: 'red',
    gradient: 'from-red-500/20 via-red-900/10 to-transparent',
    border: 'border-red-500/30 hover:border-red-400/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(239,68,68,0.15)]',
    text: 'text-red-400',
    badge: 'Arcade',
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-fuchsia-600/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-amber-600/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-grid-white opacity-40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 sm:py-20">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-400 mb-6">
            Welcome to
          </div>
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter text-white mb-4">
            Reality <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400">Check</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto leading-relaxed">
            Five doors. Quizzes to roast yourself, experiments to break your brain, card tables, tactical mindgames, and rage gauntlets.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">          {PORTALS.map((portal, i) => {
            const Icon = portal.icon;
            return (
              <motion.div
                key={portal.href}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={portal.href}
                  className={`group relative flex flex-col h-full min-h-[280px] rounded-2xl border bg-zinc-950/80 backdrop-blur-sm p-6 transition-all duration-300 ${portal.border} ${portal.glow}`}
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${portal.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-5">
                      <div className={`p-3 rounded-xl border border-white/10 bg-black/40 ${portal.text}`}>
                        <Icon size={22} />
                      </div>
                      <span className={`text-[9px] font-mono uppercase tracking-widest ${portal.text} opacity-70`}>
                        {portal.badge}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1 group-hover:text-white">
                      {portal.title}
                    </h2>
                    <p className={`text-xs font-mono uppercase tracking-widest mb-4 ${portal.text}`}>
                      {portal.subtitle}
                    </p>
                    <p className="text-sm text-zinc-400 leading-relaxed flex-1 mb-6">
                      {portal.description}
                    </p>

                    <div className={`flex items-center justify-between text-xs font-black uppercase tracking-widest ${portal.text} opacity-80 group-hover:opacity-100`}>
                      <span>Enter</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-wrap justify-center gap-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500"
        >
          <Link href="/chronos" className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-cyan-300 hover:border-cyan-400 transition-colors">
            <Clock size={12} /> Chronos Assassin
          </Link>
          <Link href="/glitch-roulette" className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-rose-300 hover:border-rose-400 transition-colors">
            <Skull size={12} /> Glitch Roulette 1v1
          </Link>
          <Link href="/blind-vault" className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300 hover:border-amber-400 transition-colors">
            <Vault size={12} /> Blind Vault
          </Link>
          <Link href="/void-step" className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-fuchsia-300 hover:border-fuchsia-400 transition-colors">
            <Grid2x2X size={12} /> Void Step
          </Link>
          <Link href="/shadow-strike" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-300 hover:border-emerald-400 transition-colors">
            <Radar size={12} /> Shadow Strike
          </Link>
          <Link href="/secret-code" className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-amber-300 hover:border-amber-400 transition-colors">
            <KeyRound size={12} /> Secret Order
          </Link>
          <Link href="/memory-poker" className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1.5 text-teal-300 hover:border-teal-400 transition-colors">
            <Brain size={12} /> Memory Poker
          </Link>
          <Link href="/sniper-holdem" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-400 hover:text-white transition-colors">
            <Crosshair size={12} className="text-red-400" /> Sniper Hold&apos;em
          </Link>
          <Link href="/doubt-and-bet" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-400 hover:text-white transition-colors">
            <Flame size={12} className="text-purple-400" /> Doubt &amp; Bet
          </Link>
          <Link href="/card-game" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-400 hover:text-white transition-colors">
            <Spade size={12} className="text-emerald-400" /> Death Parade
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
