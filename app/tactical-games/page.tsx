'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Clock, Skull, Users, Cpu } from 'lucide-react';
import { playSound } from '@/lib/sounds';

const TACTICAL_GAMES = [
  {
    href: '/chronos',
    title: 'Chronos Assassin',
    tagline: 'Time-loop grid duel',
    description:
      'Program 5 simultaneous ticks on a 5×5 cover arena. Survive a loop, rewind time, and outsmart your rival\'s Ghost with 1 paradox edit.',
    icon: Clock,
    gradient: 'from-cyan-500/20 via-sky-950/20 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-400/70',
    glow: 'hover:shadow-[0_0_32px_rgba(34,211,238,0.18)]',
    accent: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    players: '1–2 Players',
    mode: 'Solo AI + Multi',
    highlights: ['4 Cover Maps', 'Tick 1–5 Sim Preview', 'Ghost Rewind'],
  },
  {
    href: '/glitch-roulette',
    title: 'Glitch Roulette',
    tagline: 'Mod-chip buckshot',
    description:
      'Loaded cyber-revolver vs 3 escalating AI bosses. X-Ray shells, flip polarity, overclock 2× damage, or shoot yourself for extra turns.',
    icon: Skull,
    gradient: 'from-rose-500/20 via-rose-950/20 to-transparent',
    border: 'border-rose-500/30 hover:border-rose-400/70',
    glow: 'hover:shadow-[0_0_32px_rgba(244,63,94,0.18)]',
    accent: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    players: '1 Player',
    mode: '3-Stage Boss',
    highlights: ['6 Reality Mod Chips', '3 AI Boss Tiers', 'Extra-Turn Gamble'],
  },
] as const;

export default function TacticalGamesHub() {
  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#050508] text-white relative flex flex-col justify-between">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-[650px] h-[400px] bg-cyan-500/[0.06] rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[650px] h-[400px] bg-rose-500/[0.06] rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 max-w-5xl w-full mx-auto px-5 pt-5 pb-2 flex items-center justify-between">
        <Link
          href="/"
          onClick={() => playSound('chip')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/25 transition-colors"
        >
          <ArrowLeft size={13} /> Reality Check
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-300">
          Tactical Mindgames
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-5 py-4 flex-1 flex flex-col justify-center">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-none">
            Tactical <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-rose-400">Arenas</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-xl">
            High-tension mindgames, time-loop prediction, and rigged probability duels. Out-think the AI or challenge a rival live.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TACTICAL_GAMES.map((game, i) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={game.href}
                  onClick={() => playSound('card_pick')}
                  className={`group relative flex flex-col justify-between h-full rounded-[1.5rem] border bg-zinc-950/85 backdrop-blur-xl p-6 overflow-hidden transition-all duration-200 hover:-translate-y-1 ${game.border} ${game.glow}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-75 pointer-events-none`} />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className={`p-3 rounded-xl border border-white/10 bg-black/60 ${game.accent}`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider ${game.badgeBg}`}>
                          {game.mode}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-black/50 border border-white/10 px-2.5 py-0.5 rounded-full">
                          {game.players === '1 Player' ? <Cpu size={10} /> : <Users size={10} />}
                          {game.players}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                      {game.title}
                    </h2>
                    <p className={`text-[10px] font-mono uppercase tracking-widest mb-3 ${game.accent}`}>
                      {game.tagline}
                    </p>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                      {game.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-5">
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

                  <div className={`relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-black uppercase tracking-widest ${game.accent}`}>
                    <span>Launch Arena</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="relative z-10 max-w-5xl w-full mx-auto px-5 pb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Solo AI &amp; Multiplayer Mindgame Protocols
        </p>
      </footer>
    </div>
  );
}
