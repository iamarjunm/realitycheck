'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Spade, Users } from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import GameArtwork, { type GameArtworkId } from '@/components/GameArtwork';
import { playSound } from '@/lib/sounds';

interface CardTableItem {
  artworkId: GameArtworkId;
  href: string;
  title: string;
  tagline: string;
  description: string;
  players: string;
  mode: string;
  stakesLabel: string;
  highlights: readonly string[];
}

const GAMES: readonly CardTableItem[] = [
  {
    artworkId: 'death-parade',
    href: '/card-game',
    title: 'Death Parade',
    tagline: '2-player hidden hand deduction',
    description:
      "Pick 8 ascending suit cards, wager tokens in secret, and interrogate or snipe your rival's exact hand.",
    players: '2 Players',
    mode: 'Multiplayer',
    stakesLabel: 'Table I',
    highlights: ['8-Card Draft', 'Secret Wagers', 'Hand Snipe'],
  },
  {
    artworkId: 'sniper-holdem',
    href: '/sniper-holdem',
    title: "Sniper Hold'em",
    tagline: 'Poker with lethal rank callouts',
    description:
      "Texas Hold'em where calling out an opponent's exact hand rank eliminates them instantly at showdown.",
    players: '2–8 Players',
    mode: 'Multiplayer',
    stakesLabel: 'Table II',
    highlights: ["Texas Hold'em", 'Rank Sniping', 'Instant KO'],
  },
  {
    artworkId: 'doubt-and-bet',
    href: '/doubt-and-bet',
    title: 'Doubt & Bet',
    tagline: "The devil's color bluff",
    description:
      'Claim color counts across hidden hands, escalate chip wagers, and call the bluff before your bankroll runs dry.',
    players: '2–6 Players',
    mode: 'Multiplayer',
    stakesLabel: 'Table III',
    highlights: ['Color Claims', 'Escalating Pots', 'Bluff Calls'],
  },
  {
    artworkId: 'secret-code',
    href: '/secret-code',
    title: 'Secret Order',
    tagline: 'Tactical cipher deduction',
    description:
      '26 cipher cards (01/A–26/Z) and 6 logic constraints. Deduce the ordered 4-card code before anyone else.',
    players: '1–6 Players',
    mode: 'Solo Bot + Multi',
    stakesLabel: 'Table IV',
    highlights: ['26 Cipher Cards', '6 Logic Clues', 'Ordered Code'],
  },
  {
    artworkId: 'memory-poker',
    href: '/memory-poker',
    title: 'Memory Poker',
    tagline: "3 + 2 recall hold'em",
    description:
      'Memorize a 16-card A–P grid before it flips face-down, then pair 2 hidden cards with 3 community cards.',
    players: '1–6 Players',
    mode: 'Solo Bot + Multi',
    stakesLabel: 'Table V',
    highlights: ['16-Card A–P Grid', 'Blind Recall', '3+2 Showdown'],
  },
];

export default function CardGamesHub() {
  return (
    <div
      className="min-h-dvh bg-[#0c0b0e] text-[#f5f0e6] flex flex-col relative overflow-x-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(6, 40, 30, 0.94) 0%, rgba(8, 30, 23, 0.52) 42%, rgba(12, 11, 14, 1) 88%), radial-gradient(circle at 82% 18%, rgba(230, 194, 122, 0.08) 0%, transparent 45%)',
      }}
    >
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <div className="relative z-40">
        <GlobalNav activePortal="cards" />
      </div>

      <main className="relative z-10 max-w-6xl w-full mx-auto px-5 sm:px-6 pt-10 pb-16 flex-1 flex flex-col">
        {/* Luxury Parlor Header */}
        <header className="pb-8 mb-9 border-b border-[#e6c27a]/20 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#e6c27a] mb-3">
              <Spade className="w-3.5 h-3.5 text-[#e6c27a]" />
              <span>The Velvet Parlor · 5 High-Stakes Tables</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#f5f0e6] leading-[1.05]">
              The High-Stakes{' '}
              <span className="font-serif italic font-normal text-[#e6c27a]">Tables</span>
            </h1>
            <p className="text-sm text-[#c4d3cc] mt-3 max-w-2xl leading-relaxed">
              Deduction, psychological wagers, and blind-recall showdowns on emerald baize. Play
              solo against sharp bots or host private multiplayer rooms with 6-character codes.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-[#e6c27a]/25 bg-[#081f18]/80 backdrop-blur-md font-mono text-[11px] text-[#e6c27a]">
            <span className="h-2 w-2 rounded-full bg-[#4fc499]" />
            <span>House Open · Zero Rake</span>
          </div>
        </header>

        {/* 5 Luxury Framed Card Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.28 }}
              className="h-full"
            >
              <Link
                href={game.href}
                onClick={() => playSound('card_pick')}
                className="atelier-card group flex flex-col justify-between h-full rounded-2xl bg-[#0e1715]/95 border border-[#e6c27a]/25 hover:border-[#e6c27a]/65 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_18px_42px_rgba(0,0,0,0.55)]"
              >
                <div>
                  {/* Bespoke Tabletop Key-Art */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#061812]">
                    <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                      <GameArtwork id={game.artworkId} />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e1715] via-[#0e1715]/25 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#e6c27a]/15" />

                    {/* Top-left table number & top-right brass mode pill */}
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-[#061c15]/85 border border-[#e6c27a]/35 backdrop-blur-md font-mono text-[10px] uppercase tracking-[0.16em] text-[#e6c27a]">
                      {game.stakesLabel}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md bg-[#0c0b0e]/80 border border-[#4fc499]/35 backdrop-blur-md font-mono text-[10px] text-[#8be4c3]">
                      {game.mode}
                    </span>
                  </div>

                  {/* Table Body */}
                  <div className="px-5 pt-3.5 pb-4">
                    <h2 className="font-display text-xl font-extrabold tracking-tight text-[#f5f0e6] group-hover:text-[#e6c27a] transition-colors mb-0.5">
                      {game.title}
                    </h2>
                    <p className="font-serif italic text-xs text-[#e6c27a]/90 mb-3">
                      {game.tagline}
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#b8c7c0] leading-relaxed mb-4">
                      {game.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {game.highlights.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-md bg-[#0a231b] border border-[#e6c27a]/20 font-mono text-[11px] text-[#dfd2b8]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Brass-Trimmed Footer */}
                <div className="px-5 py-3.5 border-t border-[#e6c27a]/15 bg-[#091210]/90 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#a6bbb2]">
                    <Users className="w-3.5 h-3.5 text-[#e6c27a]" />
                    {game.players}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-display font-bold tracking-wide text-[#e6c27a] group-hover:text-[#fae2b1] transition-colors">
                    <span>Take a Seat</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 max-w-6xl w-full mx-auto px-5 sm:px-6 pb-8">
        <div className="pt-5 border-t border-[#e6c27a]/15 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-[#89a096]">
          <span>Select a table to configure rounds, bots, or live room codes</span>
          <span>Solo Bots · Party Tables · Instant Showdowns</span>
        </div>
      </footer>
    </div>
  );
}
