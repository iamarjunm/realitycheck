'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Skull,
  Users,
  Vault,
  Grid2x2X,
  Radar,
} from 'lucide-react';
import { playSound } from '@/lib/sounds';

const TACTICAL_GAMES = [
  {
    href: '/chronos',
    title: 'Chronos Assassin',
    tagline: 'Time-loop grid duel',
    description:
      'Program 5 simultaneous ticks on a 5×5 cover arena. Survive, rewind time, and outsmart your rival\'s Ghost with 1 paradox edit.',
    icon: Clock,
    gradient: 'from-cyan-500/20 via-sky-950/20 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-400/75',
    glow: 'hover:shadow-[0_0_28px_rgba(34,211,238,0.2)]',
    accent: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    players: '1v1 + Solo AI',
    mode: 'Time Loop',
    highlights: ['4 Cover Maps', 'T1–T5 Sim', 'Ghost Rewind'],
  },
  {
    href: '/glitch-roulette',
    title: 'Glitch Roulette',
    tagline: 'Mod-chip buckshot PvP',
    description:
      'Loaded cyber-revolver 1v1 PvP or 3-Stage Boss run. X-Ray shells, flip polarity, overclock 2× damage, or blank-shoot yourself for extra turns.',
    icon: Skull,
    gradient: 'from-rose-500/20 via-rose-950/20 to-transparent',
    border: 'border-rose-500/30 hover:border-rose-400/75',
    glow: 'hover:shadow-[0_0_28px_rgba(244,63,94,0.2)]',
    accent: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    players: '1v1 + 3 Bosses',
    mode: 'NEW 1v1 PvP',
    highlights: ['6 Mod Chips', 'Private X-Ray', 'Extra-Turn Gamble'],
  },
  {
    href: '/blind-vault',
    title: 'Blind Vault',
    tagline: 'All-pay sabotage auction',
    description:
      'Bid hidden credits across 7 vaults (+2 to +7 & a -3 TRAP). Losers still pay their bid! Trigger 2× Surge or Invert to hijack the pot.',
    icon: Vault,
    gradient: 'from-amber-500/20 via-orange-950/20 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-400/75',
    glow: 'hover:shadow-[0_0_28px_rgba(245,158,11,0.2)]',
    accent: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    players: '1v1 + Solo AI',
    mode: 'Mindgame',
    highlights: ['All-Pay Bluffing', '2× Surge & Invert', '-3 Trap Vault'],
  },
  {
    href: '/void-step',
    title: 'Void Step',
    tagline: 'Shattering territory duel',
    description:
      'Move on a 7×7 neon board, then shatter any tile into the abyss. Leap over voids with 2 Blink Jumps and trap your rival with zero moves.',
    icon: Grid2x2X,
    gradient: 'from-fuchsia-500/20 via-purple-950/20 to-transparent',
    border: 'border-fuchsia-500/30 hover:border-fuchsia-400/75',
    glow: 'hover:shadow-[0_0_28px_rgba(217,70,239,0.2)]',
    accent: 'text-fuchsia-400',
    badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
    players: '1v1 + Solo AI',
    mode: 'Best of 3',
    highlights: ['7×7 Collapsing Grid', '2× Blink Jumps', 'Move + Shatter'],
  },
  {
    href: '/shadow-strike',
    title: 'Shadow Strike',
    tagline: 'Stealth radar warfare',
    description:
      'Cloak 6 stealth nodes on a 6×6 grid. Land Chain-Hit streaks for extra turns, scan 3×3 sectors with Sonar, and fire a 6-cell Orbital Beam.',
    icon: Radar,
    gradient: 'from-emerald-500/20 via-teal-950/20 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-400/75',
    glow: 'hover:shadow-[0_0_28px_rgba(16,185,129,0.2)]',
    accent: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    players: '1v1 + Solo AI',
    mode: 'Stealth Duel',
    highlights: ['Chain-Hit Turns', '3×3 Sonar ×2', 'Orbital Beam ×1'],
  },
] as const;

export default function TacticalGamesHub() {
  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#050508] text-white relative flex flex-col justify-between">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[380px] bg-cyan-500/[0.06] rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[380px] bg-fuchsia-500/[0.06] rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
        <Link
          href="/"
          onClick={() => playSound('chip')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/25 transition-colors"
        >
          <ArrowLeft size={13} /> Reality Check
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-300">
          5 Live 1v1 Tactical Arenas
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-5 py-2 flex-1 flex flex-col justify-center min-h-0">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none">
              Tactical{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300">
                Arenas
              </span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 max-w-2xl">
              Every arena supports instant <span className="text-white font-semibold">1v1 Live Multiplayer</span> via 6-char room codes plus Solo AI sparring.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {TACTICAL_GAMES.map((game, i) => {
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
                  className={`group relative flex flex-col justify-between h-full rounded-2xl border bg-zinc-950/85 backdrop-blur-xl p-4 sm:p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${game.border} ${game.glow}`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-75 pointer-events-none`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`p-2.5 rounded-xl border border-white/10 bg-black/60 ${game.accent}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-wider ${game.badgeBg}`}
                        >
                          {game.mode}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-300 bg-black/60 border border-white/10 px-2 py-0.5 rounded-full">
                          <Users size={10} />
                          {game.players}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-xl font-black uppercase tracking-tight text-white">
                      {game.title}
                    </h2>
                    <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${game.accent}`}>
                      {game.tagline}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3.5">
                      {game.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {game.highlights.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md border border-white/10 bg-black/50 text-[10px] font-mono text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`relative z-10 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-black uppercase tracking-widest ${game.accent}`}
                  >
                    <span>Launch 1v1 Arena</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="relative z-10 max-w-6xl w-full mx-auto px-5 pb-3 shrink-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Real-Time 1v1 Lobbies &amp; Tactical AI Protocols
        </p>
      </footer>
    </div>
  );
}
