'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Brain,
  ChevronRight,
  Crosshair,
  Flame,
  KeyRound,
  Spade,
  Users,
  Sparkles,
} from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import { playSound } from '@/lib/sounds';

const GAMES = [
  {
    href: '/card-game',
    title: 'Death Parade',
    tagline: '2-player deduction',
    description:
      "Pick 8 ascending suit cards, wager tokens in secret, interrogate or snipe your rival's exact hand.",
    icon: Spade,
    gradient: 'from-emerald-500/20 via-emerald-950/25 to-transparent',
    border: 'border-emerald-500/25 hover:border-emerald-400/70',
    glow: 'hover:shadow-[0_0_32px_rgba(52,211,153,0.18)]',
    accent: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300',
    players: '2 Players',
    mode: 'Multiplayer',
    highlights: ['8-Card Draft', 'Secret Wagers', 'Hand Snipe'],
  },
  {
    href: '/sniper-holdem',
    title: "Sniper Hold'em",
    tagline: 'Poker with a twist',
    description:
      "Texas Hold'em where calling out an opponent's exact hand rank eliminates them instantly at showdown.",
    icon: Crosshair,
    gradient: 'from-red-500/20 via-red-950/25 to-transparent',
    border: 'border-red-500/25 hover:border-red-400/70',
    glow: 'hover:shadow-[0_0_32px_rgba(239,68,68,0.18)]',
    accent: 'text-red-400',
    badgeBg: 'bg-red-500/12 border-red-500/30 text-red-300',
    players: '2–8 Players',
    mode: 'Multiplayer',
    highlights: ['Texas Hold\'em', 'Rank Sniping', 'Instant KO'],
  },
  {
    href: '/doubt-and-bet',
    title: 'Doubt & Bet',
    tagline: "The devil's bluff",
    description:
      'Claim color counts across hidden hands, escalate chip wagers, and call the bluff before your bankroll runs dry.',
    icon: Flame,
    gradient: 'from-purple-500/20 via-purple-950/25 to-transparent',
    border: 'border-purple-500/25 hover:border-purple-400/70',
    glow: 'hover:shadow-[0_0_32px_rgba(168,85,247,0.18)]',
    accent: 'text-purple-400',
    badgeBg: 'bg-purple-500/12 border-purple-500/30 text-purple-300',
    players: '2–6 Players',
    mode: 'Multiplayer',
    highlights: ['Color Claims', 'Escalating Pots', 'Bluff Calls'],
  },
  {
    href: '/secret-code',
    title: 'Secret Order',
    tagline: 'Tactical cipher',
    description:
      '26 tarot-cipher cards (01/A–26/Z) & 6 logic constraints. Deduce the ordered 4-card code before anyone else.',
    icon: KeyRound,
    gradient: 'from-amber-500/20 via-amber-950/25 to-transparent',
    border: 'border-amber-500/25 hover:border-amber-400/70',
    glow: 'hover:shadow-[0_0_32px_rgba(245,158,11,0.18)]',
    accent: 'text-amber-400',
    badgeBg: 'bg-amber-500/12 border-amber-500/30 text-amber-300',
    players: '1–6 Players',
    mode: 'Solo Bot + Multi',
    highlights: ['26 Cipher Cards', '6 Logic Clues', 'Ordered Code'],
  },
  {
    href: '/memory-poker',
    title: 'Memory Poker',
    tagline: "3 + 2 recall hold'em",
    description:
      'Memorize a 16-card A–P grid before it flips face-down, then pair 2 hidden cards with 3 community cards.',
    icon: Brain,
    gradient: 'from-teal-500/20 via-teal-950/25 to-transparent',
    border: 'border-teal-500/25 hover:border-teal-400/70',
    glow: 'hover:shadow-[0_0_32px_rgba(20,184,166,0.18)]',
    accent: 'text-teal-400',
    badgeBg: 'bg-teal-500/12 border-teal-500/30 text-teal-300',
    players: '1–6 Players',
    mode: 'Solo Bot + Multi',
    highlights: ['16-Card A–P Grid', 'Blind Recall', '3+2 Showdown'],
  },
] as const;

export default function CardGamesHub() {
  return (
    <div className="min-h-dvh bg-[#04050a] text-white relative flex flex-col overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[440px] bg-amber-500/[0.07] rounded-full blur-[135px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[380px] bg-emerald-500/[0.06] rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      <GlobalNav activePortal="cards" />

      <main className="relative z-10 max-w-7xl w-full mx-auto px-5 sm:px-6 pt-8 pb-14 flex-1 flex flex-col justify-center">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300 mb-3">
              <Sparkles className="w-3 h-3" />
              5 High-Stakes Tables
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none">
              Card{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-300">
                Tables
              </span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Deduction, bluffing, and memory showdowns. Play solo against ruthless bots or host live multiplayer tables with instant room codes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((game, i) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
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
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase tracking-wider ${game.badgeBg}`}>
                          {game.mode}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-300 bg-black/60 border border-white/10 px-2 py-0.5 rounded-full">
                          <Users size={10} /> {game.players}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-xl font-black uppercase tracking-tight text-white leading-snug mb-0.5">
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

                  <div className={`relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-black uppercase tracking-widest ${game.accent}`}>
                    <span>Enter Table</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="relative z-10 max-w-7xl w-full mx-auto px-5 sm:px-6 pb-6">
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          <span>Select a table to configure rounds, difficulty, or live room codes</span>
          <span>Solo Bots · Party Tables · Instant Showdowns</span>
        </div>
      </footer>
    </div>
  );
}
