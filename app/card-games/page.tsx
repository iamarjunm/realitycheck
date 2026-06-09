'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Crosshair, Flame, Spade, Users } from 'lucide-react';

const GAMES = [
  {
    href: '/card-game',
    title: 'Death Parade',
    tagline: '2-player deduction',
    description: 'Pick 8 cards, bet tokens in secret, ask questions or guess your opponent\'s exact hand.',
    icon: Spade,
    gradient: 'from-emerald-500/15 to-transparent',
    border: 'border-emerald-500/25 hover:border-emerald-400/50',
    glow: 'hover:shadow-[0_0_35px_rgba(52,211,153,0.12)]',
    accent: 'text-emerald-400',
    players: '2',
    vibe: 'emerald',
  },
  {
    href: '/sniper-holdem',
    title: 'Sniper Hold\'em',
    tagline: 'Poker with a twist',
    description: 'Texas Hold\'em where correct snipes eliminate players. Multiplayer lobbies, blinds, showdowns.',
    icon: Crosshair,
    gradient: 'from-red-500/15 to-transparent',
    border: 'border-red-500/25 hover:border-red-400/50',
    glow: 'hover:shadow-[0_0_35px_rgba(239,68,68,0.12)]',
    accent: 'text-red-400',
    players: '2–8',
    vibe: 'crimson',
  },
  {
    href: '/doubt-and-bet',
    title: 'Doubt & Bet',
    tagline: 'The devil\'s deduction',
    description: 'Claim colors, wager chips, doubt your rivals. Last player standing takes it all.',
    icon: Flame,
    gradient: 'from-purple-500/15 to-transparent',
    border: 'border-purple-500/25 hover:border-purple-400/50',
    glow: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.12)]',
    accent: 'text-purple-400',
    players: '2–6',
    vibe: 'violet',
  },
] as const;

export default function CardGamesHub() {
  return (
    <div className="min-h-screen bg-[#050508] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04),transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-white mb-10 transition-colors"
        >
          <ArrowLeft size={14} /> Reality Check
        </Link>

        <header className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-amber-300 mb-4">
            Card Games
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-3">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-emerald-400">Tables</span>
          </h1>
          <p className="text-zinc-500 max-w-xl text-sm leading-relaxed">
            Live multiplayer rooms. Create a lobby, share the code, and play.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GAMES.map((game, i) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={game.href}
                  className={`group relative flex flex-col h-full min-h-[300px] rounded-2xl border bg-zinc-950/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ${game.border} ${game.glow}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-60`} />
                  <div className="poker-table-scene !min-h-[120px] !p-4 opacity-40 group-hover:opacity-60 transition-opacity scale-75 -mt-4">
                    <div className={`poker-rail w-full max-w-[200px] !min-h-[80px] !aspect-auto !p-2`}>
                      <div className="poker-rail-inner !p-1">
                        <div className={`poker-felt bg-gradient-to-br ${game.vibe === 'crimson' ? 'from-[#1a5c34] via-[#0f4a28] to-[#0a3520]' : game.vibe === 'violet' ? 'from-[#1a4a3a] via-[#123d30] to-[#0c2d24]' : 'from-[#1e6b42] via-[#155a36] to-[#0e4528]'}`} />
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col flex-1 p-6 pt-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-xl border border-white/10 bg-black/50 ${game.accent}`}>
                        <Icon size={20} />
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 uppercase">
                        <Users size={11} /> {game.players}
                      </span>
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight mb-1">{game.title}</h2>
                    <p className={`text-[10px] font-mono uppercase tracking-widest mb-3 ${game.accent}`}>{game.tagline}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed flex-1 mb-5">{game.description}</p>
                    <div className={`flex items-center justify-between text-xs font-black uppercase tracking-widest ${game.accent}`}>
                      <span>Open Table</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
