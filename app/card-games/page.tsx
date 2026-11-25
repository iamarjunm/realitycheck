'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Brain, ChevronRight, Crosshair, Flame, KeyRound, Spade, Users } from 'lucide-react';
import { playSound } from '@/lib/sounds';

const GAMES = [
  {
    href: '/card-game',
    title: 'Death Parade',
    tagline: '2-player deduction',
    description: 'Pick 8 ascending suit cards, wager tokens in secret, interrogate or snipe your rival\'s exact hand.',
    icon: Spade,
    gradient: 'from-emerald-500/15 via-emerald-950/20 to-transparent',
    border: 'border-emerald-500/25 hover:border-emerald-400/60',
    glow: 'hover:shadow-[0_0_28px_rgba(52,211,153,0.14)]',
    accent: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
    players: '2 Players',
    mode: 'Multiplayer',
  },
  {
    href: '/sniper-holdem',
    title: 'Sniper Hold\'em',
    tagline: 'Poker with a twist',
    description: 'Texas Hold\'em where calling out an opponent\'s exact hand rank eliminates them at showdown.',
    icon: Crosshair,
    gradient: 'from-red-500/15 via-red-950/20 to-transparent',
    border: 'border-red-500/25 hover:border-red-400/60',
    glow: 'hover:shadow-[0_0_28px_rgba(239,68,68,0.14)]',
    accent: 'text-red-400',
    badgeBg: 'bg-red-500/10 border-red-500/25 text-red-300',
    players: '2–8 Players',
    mode: 'Multiplayer',
  },
  {
    href: '/doubt-and-bet',
    title: 'Doubt & Bet',
    tagline: 'The devil\'s bluff',
    description: 'Claim color counts, escalate chip wagers, and call the bluff before your bankroll runs dry.',
    icon: Flame,
    gradient: 'from-purple-500/15 via-purple-950/20 to-transparent',
    border: 'border-purple-500/25 hover:border-purple-400/60',
    glow: 'hover:shadow-[0_0_28px_rgba(168,85,247,0.14)]',
    accent: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
    players: '2–6 Players',
    mode: 'Multiplayer',
  },
  {
    href: '/secret-code',
    title: 'Secret Order',
    tagline: 'Tactical cipher',
    description: '26 tarot-cipher cards (01/A–26/Z) & 6 logic constraints. Deduce the ordered 4-card code first.',
    icon: KeyRound,
    gradient: 'from-amber-500/15 via-amber-950/20 to-transparent',
    border: 'border-amber-500/25 hover:border-amber-400/60',
    glow: 'hover:shadow-[0_0_28px_rgba(245,158,11,0.16)]',
    accent: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    players: '1–6 Players',
    mode: 'Solo Bot + Multi',
  },
  {
    href: '/memory-poker',
    title: 'Memory Poker',
    tagline: '3 + 2 recall hold\'em',
    description: 'Memorize a 16-card A–P grid before it flips face-down, then pair 2 hidden cards with 3 community cards.',
    icon: Brain,
    gradient: 'from-teal-500/15 via-teal-950/20 to-transparent',
    border: 'border-teal-500/25 hover:border-teal-400/60',
    glow: 'hover:shadow-[0_0_28px_rgba(20,184,166,0.16)]',
    accent: 'text-teal-400',
    badgeBg: 'bg-teal-500/10 border-teal-500/25 text-teal-300',
    players: '1–6 Players',
    mode: 'Solo Bot + Multi',
  },
] as const;

export default function CardGamesHub() {
  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#050508] text-white relative flex flex-col justify-between">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-5 pt-5 pb-2 flex items-center justify-between">
        <Link
          href="/"
          onClick={() => playSound('chip')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/25 transition-colors"
        >
          <ArrowLeft size={13} /> Reality Check
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300">
          5 High-Stakes Tables
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-5 py-3 flex-1 flex flex-col justify-center">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-400">Tables</span>
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1">
              Deduction, bluffing, and memory showdowns. Play solo against bots or host live multiplayer rooms.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {GAMES.map((game, i) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.href}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={game.href}
                  onClick={() => playSound('card_pick')}
                  className={`group relative flex flex-col justify-between h-full rounded-2xl border bg-zinc-950/85 backdrop-blur-md p-4 sm:p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${game.border} ${game.glow}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-75 pointer-events-none`} />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`p-2 rounded-xl border border-white/10 bg-black/60 ${game.accent}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-wider ${game.badgeBg}`}>
                          {game.mode}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-black/40 border border-white/5 px-2 py-0.5 rounded-full">
                          <Users size={10} /> {game.players}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-lg font-black uppercase tracking-tight text-white leading-snug">
                      {game.title}
                    </h2>
                    <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${game.accent}`}>
                      {game.tagline}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {game.description}
                    </p>
                  </div>

                  <div className={`relative z-10 mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-black uppercase tracking-widest ${game.accent}`}>
                    <span>Enter Table</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="relative z-10 max-w-6xl w-full mx-auto px-5 pb-4 text-center sm:text-left">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Select a table to configure rounds, difficulty, or room codes
        </p>
      </footer>
    </div>
  );
}
