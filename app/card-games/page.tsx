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
} from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import { playSound } from '@/lib/sounds';

const GAMES = [
  {
    href: '/card-game',
    title: 'Death Parade',
    tagline: '2-player hidden hand deduction',
    description:
      "Pick 8 ascending suit cards, wager tokens in secret, and interrogate or snipe your rival's exact hand.",
    icon: Spade,
    iconTint: 'text-emerald-400',
    players: '2 Players',
    mode: 'Multiplayer',
    highlights: ['8-Card Draft', 'Secret Wagers', 'Hand Snipe'],
  },
  {
    href: '/sniper-holdem',
    title: "Sniper Hold'em",
    tagline: 'Poker with lethal rank callouts',
    description:
      "Texas Hold'em where calling out an opponent's exact hand rank eliminates them instantly at showdown.",
    icon: Crosshair,
    iconTint: 'text-rose-400',
    players: '2–8 Players',
    mode: 'Multiplayer',
    highlights: ["Texas Hold'em", 'Rank Sniping', 'Instant KO'],
  },
  {
    href: '/doubt-and-bet',
    title: 'Doubt & Bet',
    tagline: "The devil's color bluff",
    description:
      'Claim color counts across hidden hands, escalate chip wagers, and call the bluff before your bankroll runs dry.',
    icon: Flame,
    iconTint: 'text-indigo-400',
    players: '2–6 Players',
    mode: 'Multiplayer',
    highlights: ['Color Claims', 'Escalating Pots', 'Bluff Calls'],
  },
  {
    href: '/secret-code',
    title: 'Secret Order',
    tagline: 'Tactical cipher deduction',
    description:
      '26 cipher cards (01/A–26/Z) and 6 logic constraints. Deduce the ordered 4-card code before anyone else.',
    icon: KeyRound,
    iconTint: 'text-amber-400',
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
    iconTint: 'text-emerald-400',
    players: '1–6 Players',
    mode: 'Solo Bot + Multi',
    highlights: ['16-Card A–P Grid', 'Blind Recall', '3+2 Showdown'],
  },
] as const;

export default function CardGamesHub() {
  return (
    <div className="min-h-dvh bg-[#09090b] text-zinc-50 flex flex-col">
      <GlobalNav activePortal="cards" />

      <main className="max-w-6xl w-full mx-auto px-5 sm:px-6 pt-10 pb-16 flex-1 flex flex-col">
        <div className="pb-8 mb-8 border-b border-zinc-800/80">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 mb-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>5 High-Stakes Tables</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50">
            Card Tables
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Deduction, bluffing, and recall showdowns. Play solo against bots or host live multiplayer tables with instant room codes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((game, i) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <Link
                  href={game.href}
                  onClick={() => playSound('card_pick')}
                  className="group flex flex-col justify-between h-full rounded-xl bg-[#111113] border border-zinc-800/90 hover:border-zinc-700 hover:bg-[#151518] p-5 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        <Icon className={`w-4 h-4 ${game.iconTint}`} />
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-400">
                        {game.mode}
                      </span>
                    </div>

                    <h2 className="text-base font-semibold tracking-tight text-zinc-50 mb-0.5">
                      {game.title}
                    </h2>
                    <p className="text-xs text-zinc-500 mb-3">
                      {game.tagline}
                    </p>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                      {game.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {game.highlights.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800/90 font-mono text-[11px] text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-mono text-zinc-500">
                      <Users className="w-3.5 h-3.5" />
                      {game.players}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-zinc-300 group-hover:text-zinc-50 transition-colors">
                      <span>Enter table</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto px-5 sm:px-6 pb-8">
        <div className="pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-zinc-500">
          <span>Select a table to configure rounds, bots, or live room codes</span>
          <span>Solo Bots · Party Tables · Instant Showdowns</span>
        </div>
      </footer>
    </div>
  );
}
