'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FlipRage from '@/app/components/rage-games/FlipRage';
import MadTap from '@/app/components/rage-games/MadTap';
import BrainLag from '@/app/components/rage-games/BrainLag';
import TetherRage from '@/app/components/rage-games/TetherRage';
import TypeRage from '@/app/components/rage-games/TypeRage';
import ChaosCore from '@/app/components/rage-games/ChaosCore';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  Music,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { playBGM, stopBGM } from '@/app/components/rage-games/AudioSystem';
import GlobalNav from '@/components/GlobalNav';
import GameArtwork, { type GameArtworkId } from '@/components/GameArtwork';

type RagePlayableId = 'flip' | 'tap' | 'brain' | 'tether' | 'type' | 'chaos';
type RageGameId = 'menu' | RagePlayableId;

interface RageGameCard {
  id: RagePlayableId & GameArtworkId;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  trialNo: string;
}

const GAMES: readonly RageGameCard[] = [
  {
    id: 'flip',
    title: 'Flip Rage',
    subtitle: 'Gravity inversion',
    description: 'One button. Gravity inverts on tap. Endless obstacles that only accelerate.',
    badge: 'One Button',
    trialNo: 'Trial 01',
  },
  {
    id: 'tap',
    title: 'Mad Tap',
    subtitle: 'Reaction precision',
    description: 'Click the blue orbs before they shrink. Ignore the red decoys.',
    badge: 'Precision',
    trialNo: 'Trial 02',
  },
  {
    id: 'brain',
    title: 'Brain Lag',
    subtitle: 'Muscle memory scramble',
    description: 'Keyboard only. Lane bindings scramble periodically to break your reflexes.',
    badge: 'Confusion',
    trialNo: 'Trial 03',
  },
  {
    id: 'tether',
    title: 'Tether Rage',
    subtitle: 'Elastic physics',
    description: 'You are tethered to the ball by a bungee cord. Overcorrecting makes it worse.',
    badge: 'Mouse Only',
    trialNo: 'Trial 04',
  },
  {
    id: 'type',
    title: 'Typo Terror',
    subtitle: 'Zero-error speed typing',
    description: 'Keyboard only. A single typo or expired timer ends the run immediately.',
    badge: 'Perfection',
    trialNo: 'Trial 05',
  },
  {
    id: 'chaos',
    title: 'Chaos Core',
    subtitle: 'Multi-phase bullet hell',
    description: 'Keyboard only. Survive escalating projectile patterns for as long as possible.',
    badge: 'Bullet Hell',
    trialNo: 'Trial 06',
  },
];

const HELP_TEXT: Record<string, string> = {
  menu: 'Welcome to Rage Suite. Select a game to begin.',
  flip: 'FLIP RAGE:\nTap or press Space to flip gravity. Avoid the pink obstacles. The game gets progressively faster.',
  tap: 'MAD TAP:\nClick the blue Orbs before they expire. Do not click the red Orbs.',
  brain: 'BRAIN LAG:\nPress the keys shown at the bottom of the screen to move to that lane. Periodically, the keys will scramble!',
  tether: 'TETHER RAGE:\nMove your mouse to drag the ball via a bungee cord. The springy physics make it hard to control. Avoid obstacles.',
  type: 'TYPO TERROR:\nType the word on the screen exactly as shown before the time runs out. One typo equals instant death.',
  chaos: 'CHAOS CORE:\nUse WASD or Arrow Keys to move. Avoid EVERYTHING. Survive as long as you can through multiple phases of bullet hell.',
};

export default function Page() {
  const [game, setGame] = useState<RageGameId>('menu');
  const [bgmMuted, setBgmMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (game !== 'menu') {
      playBGM(bgmMuted);
    } else {
      stopBGM();
    }
    return () => stopBGM();
  }, [game, bgmMuted]);

  const toggleBGM = () => setBgmMuted(!bgmMuted);
  const toggleSFX = () => setSfxMuted(!sfxMuted);

  return (
    <main
      className="min-h-screen bg-[#0c0b0e] text-[#f5f0e6] relative overflow-hidden font-sans flex flex-col"
      style={
        game === 'menu'
          ? {
              backgroundImage:
                'radial-gradient(ellipse 85% 50% at 50% 0%, rgba(217, 56, 58, 0.24) 0%, rgba(48, 14, 16, 0.34) 44%, rgba(12, 11, 14, 1) 88%)',
            }
          : undefined
      }
    >
      {game === 'menu' && (
        <div className="atelier-grain pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      )}

      {/* Show GlobalNav ONLY on the Menu */}
      {game === 'menu' && (
        <div className="relative z-40">
          <GlobalNav activePortal="rage" />
        </div>
      )}

      {/* Floating Obsidian/Brass HUD Controls ONLY when playing a rage game */}
      {game !== 'menu' && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="p-2 bg-[#141118]/95 border border-[#e6c27a]/30 rounded-lg hover:bg-[#1e1923] hover:border-[#e6c27a]/60 transition-colors shadow-lg"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4 text-[#e6c27a]" />
          </button>
          <button
            type="button"
            onClick={toggleBGM}
            className="p-2 bg-[#141118]/95 border border-[#e6c27a]/30 rounded-lg hover:bg-[#1e1923] hover:border-[#e6c27a]/60 transition-colors shadow-lg"
            title="Toggle Music"
          >
            <Music className={`w-4 h-4 ${bgmMuted ? 'text-[#D9383A]' : 'text-[#e6c27a]'}`} />
          </button>
          <button
            type="button"
            onClick={toggleSFX}
            className="p-2 bg-[#141118]/95 border border-[#e6c27a]/30 rounded-lg hover:bg-[#1e1923] hover:border-[#e6c27a]/60 transition-colors shadow-lg"
            title="Toggle Sound Effects"
          >
            {sfxMuted ? (
              <VolumeX className="w-4 h-4 text-[#D9383A]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#e6c27a]" />
            )}
          </button>
        </div>
      )}

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="atelier-card bg-[#141118] border border-[#D9383A]/45 p-6 rounded-2xl max-w-md w-full relative shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
            >
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[#b4a99a] hover:text-[#f5f0e6] hover:bg-white/5 transition-colors"
                aria-label="Close help"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#D9383A] mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Gauntlet Briefing</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#f5f0e6] mb-3">
                How to <span className="font-serif italic font-normal text-[#e6c27a]">Survive</span>
              </h2>
              <p className="text-[#d6ccbe] font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {HELP_TEXT[game]}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {game === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 w-full flex-1 flex flex-col"
          >
            <div className="w-full max-w-6xl mx-auto px-5 sm:px-6 pt-10 pb-16 flex-1 flex flex-col">
              {/* Header Bar with Integrated Tactile Audio & Help Controls */}
              <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-9 border-b border-[#D9383A]/25">
                <div>
                  <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#f27c7e] mb-3">
                    <Flame className="w-3.5 h-3.5 text-[#D9383A]" />
                    <span>Lacquer Arcade · 6 Precision Trials</span>
                  </div>
                  <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#f5f0e6] leading-[1.05]">
                    Rage{' '}
                    <span className="font-serif italic font-normal text-[#e6c27a]">Suite</span>
                  </h1>
                  <p className="text-sm text-[#c4b5b0] mt-3 max-w-xl leading-relaxed">
                    Six unforgiving reflex, elastic-physics, and zero-error typing gauntlets built
                    to fracture your composure.
                  </p>
                </div>

                {/* Inline Tactile Obsidian/Brass Controls Bar */}
                <div className="inline-flex items-center gap-1.5 p-1.5 rounded-xl border border-[#D9383A]/30 bg-[#141015]/95 self-start lg:self-auto shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
                  <button
                    type="button"
                    onClick={() => setShowHelp(true)}
                    className="btn-obsidian inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#e8dfd1] hover:text-[#f5f0e6]"
                    title="How to Play"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#e6c27a]" />
                    <span>Help</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleBGM}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                      bgmMuted
                        ? 'bg-[#261013] border-[#D9383A]/45 text-[#f48284]'
                        : 'bg-[#1c171f] border-[#e6c27a]/25 text-[#e6c27a] hover:border-[#e6c27a]/50'
                    }`}
                    title="Toggle Music"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>BGM {bgmMuted ? 'Off' : 'On'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleSFX}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                      sfxMuted
                        ? 'bg-[#261013] border-[#D9383A]/45 text-[#f48284]'
                        : 'bg-[#1c171f] border-[#e6c27a]/25 text-[#e6c27a] hover:border-[#e6c27a]/50'
                    }`}
                    title="Toggle Sound Effects"
                  >
                    {sfxMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    <span>SFX {sfxMuted ? 'Off' : 'On'}</span>
                  </button>
                </div>
              </header>

              {/* 6 Illustrated Vermilion Gauntlets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GAMES.map((g, i) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.045, duration: 0.28 }}
                    className="h-full"
                  >
                    <button
                      type="button"
                      onClick={() => setGame(g.id)}
                      className="atelier-card w-full text-left group flex flex-col justify-between h-full rounded-2xl bg-[#151116] border border-[#D9383A]/30 hover:border-[#D9383A]/75 overflow-hidden transition-all duration-300 hover:-translate-y-1 active:translate-y-0 shadow-[0_16px_38px_rgba(0,0,0,0.55)]"
                    >
                      <div className="w-full">
                        {/* Bold Graphic Art Banner */}
                        <div className="relative h-36 w-full overflow-hidden bg-[#0e0a0c]">
                          <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                            <GameArtwork id={g.id} />
                          </div>
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#151116] via-[#151116]/25 to-transparent" />
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-[#120b0d]/85 border border-[#e6c27a]/30 backdrop-blur-md font-mono text-[10px] uppercase tracking-[0.16em] text-[#e6c27a]">
                            {g.trialNo}
                          </span>
                          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md bg-[#D9383A]/90 text-[#fff6f2] font-mono text-[10px] uppercase tracking-wider font-bold shadow">
                            {g.badge}
                          </span>
                        </div>

                        <div className="px-5 pt-3.5 pb-4">
                          <h2 className="font-display text-lg font-extrabold tracking-tight text-[#f5f0e6] group-hover:text-[#ff9c9e] transition-colors mb-0.5">
                            {g.title}
                          </h2>
                          <p className="font-serif italic text-xs text-[#e6c27a]/90 mb-2.5">
                            {g.subtitle}
                          </p>
                          <p className="text-xs sm:text-[13px] text-[#bdb0ab] leading-relaxed">
                            {g.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 py-3.5 border-t border-[#D9383A]/20 bg-[#100c0f]/90 flex items-center justify-between w-full">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#9d8d8a]">
                          Instant Death
                        </span>
                        <span className="btn-crimson inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-display text-xs font-bold tracking-wide">
                          <span>Start</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Game Renderers */}
        {game === 'flip' && (
          <motion.div key="flip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <FlipRage muted={sfxMuted} />
            <button
              type="button"
              onClick={() => setGame('menu')}
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#141118]/95 border border-[#e6c27a]/30 px-3.5 py-2 rounded-lg text-[#f5f0e6] hover:text-[#e6c27a] hover:bg-[#1e1923] hover:border-[#e6c27a]/60 transition-colors text-xs font-semibold pointer-events-auto shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'tap' && (
          <motion.div key="tap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <MadTap muted={sfxMuted} />
            <button
              type="button"
              onClick={() => setGame('menu')}
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#141118]/95 border border-[#e6c27a]/30 px-3.5 py-2 rounded-lg text-[#f5f0e6] hover:text-[#e6c27a] hover:bg-[#1e1923] hover:border-[#e6c27a]/60 transition-colors text-xs font-semibold pointer-events-auto shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'brain' && (
          <motion.div key="brain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <BrainLag muted={sfxMuted} />
            <button
              type="button"
              onClick={() => setGame('menu')}
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#141118]/95 border border-[#e6c27a]/30 px-3.5 py-2 rounded-lg text-[#f5f0e6] hover:text-[#e6c27a] hover:bg-[#1e1923] hover:border-[#e6c27a]/60 transition-colors text-xs font-semibold pointer-events-auto shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'tether' && (
          <motion.div key="tether" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <TetherRage muted={sfxMuted} />
            <button
              type="button"
              onClick={() => setGame('menu')}
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#141118]/95 border border-[#e6c27a]/30 px-3.5 py-2 rounded-lg text-[#f5f0e6] hover:text-[#e6c27a] hover:bg-[#1e1923] hover:border-[#e6c27a]/60 transition-colors text-xs font-semibold pointer-events-auto shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'type' && (
          <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <TypeRage muted={sfxMuted} />
            <button
              type="button"
              onClick={() => setGame('menu')}
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#141118]/95 border border-[#e6c27a]/30 px-3.5 py-2 rounded-lg text-[#f5f0e6] hover:text-[#e6c27a] hover:bg-[#1e1923] hover:border-[#e6c27a]/60 transition-colors text-xs font-semibold pointer-events-auto shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'chaos' && (
          <motion.div key="chaos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <ChaosCore muted={sfxMuted} />
            <button
              type="button"
              onClick={() => setGame('menu')}
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#141118]/95 border border-[#e6c27a]/30 px-3.5 py-2 rounded-lg text-[#f5f0e6] hover:text-[#e6c27a] hover:bg-[#1e1923] hover:border-[#e6c27a]/60 transition-colors text-xs font-semibold pointer-events-auto shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
