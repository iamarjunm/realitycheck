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
  Link as LinkIcon,
  Keyboard,
  Zap,
  ArrowLeft,
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  Music,
  ChevronRight,
  Activity,
  MousePointer2,
} from 'lucide-react';
import { playBGM, stopBGM } from '@/app/components/rage-games/AudioSystem';
import GlobalNav from '@/components/GlobalNav';

const GAMES = [
  {
    id: 'flip',
    title: 'Flip Rage',
    subtitle: 'Gravity inversion',
    description: 'One button. Gravity inverts on tap. Endless obstacles that only accelerate.',
    icon: Activity,
    iconTint: 'text-indigo-400',
    badge: 'One Button',
  },
  {
    id: 'tap',
    title: 'Mad Tap',
    subtitle: 'Reaction precision',
    description: 'Click the blue orbs before they shrink. Ignore the red decoys.',
    icon: MousePointer2,
    iconTint: 'text-rose-400',
    badge: 'Precision',
  },
  {
    id: 'brain',
    title: 'Brain Lag',
    subtitle: 'Muscle memory scramble',
    description: 'Keyboard only. Lane bindings scramble periodically to break your reflexes.',
    icon: Keyboard,
    iconTint: 'text-amber-400',
    badge: 'Confusion',
  },
  {
    id: 'tether',
    title: 'Tether Rage',
    subtitle: 'Elastic physics',
    description: 'You are tethered to the ball by a bungee cord. Overcorrecting makes it worse.',
    icon: LinkIcon,
    iconTint: 'text-rose-400',
    badge: 'Mouse Only',
  },
  {
    id: 'type',
    title: 'Typo Terror',
    subtitle: 'Zero-error speed typing',
    description: 'Keyboard only. A single typo or expired timer ends the run immediately.',
    icon: Keyboard,
    iconTint: 'text-emerald-400',
    badge: 'Perfection',
  },
  {
    id: 'chaos',
    title: 'Chaos Core',
    subtitle: 'Multi-phase bullet hell',
    description: 'Keyboard only. Survive escalating projectile patterns for as long as possible.',
    icon: Zap,
    iconTint: 'text-amber-400',
    badge: 'Bullet Hell',
  },
] as const;

type RageGameId = 'menu' | 'flip' | 'tap' | 'brain' | 'tether' | 'type' | 'chaos';

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
    <main className="min-h-screen bg-[#09090b] text-zinc-50 relative overflow-hidden font-sans flex flex-col">
      {/* Show GlobalNav ONLY on the Menu */}
      {game === 'menu' && <GlobalNav activePortal="rage" />}

      {/* Floating Controls ONLY when playing a rage game */}
      {game !== 'menu' && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="p-2 bg-[#111113]/95 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4 text-zinc-200" />
          </button>
          <button
            type="button"
            onClick={toggleBGM}
            className="p-2 bg-[#111113]/95 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
            title="Toggle Music"
          >
            <Music className={`w-4 h-4 ${bgmMuted ? 'text-rose-400' : 'text-zinc-200'}`} />
          </button>
          <button
            type="button"
            onClick={toggleSFX}
            className="p-2 bg-[#111113]/95 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
            title="Toggle Sound Effects"
          >
            {sfxMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-zinc-200" />
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
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111113] border border-zinc-800 p-6 rounded-2xl max-w-md w-full relative"
            >
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                aria-label="Close help"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs text-rose-400 mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Briefing</span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-50 mb-3">
                How to Play
              </h2>
              <p className="text-zinc-300 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
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
            transition={{ duration: 0.2 }}
            className="w-full flex-1 flex flex-col"
          >
            <div className="w-full max-w-6xl mx-auto px-5 sm:px-6 pt-10 pb-16 flex-1 flex flex-col">
              {/* Header Bar with Integrated Audio & Help Controls */}
              <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-8 border-b border-zinc-800/80">
                <div>
                  <div className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 mb-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span>6 Precision Challenges</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50">
                    Rage Suite
                  </h1>
                  <p className="text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
                    Six unforgiving reflex, physics, and typing gauntlets engineered to test your composure.
                  </p>
                </div>

                {/* Inline Controls Bar */}
                <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-zinc-800 bg-[#111113] self-start lg:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowHelp(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
                    title="How to Play"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Help</span>
                  </button>
                  <div className="w-px h-4 bg-zinc-800" />
                  <button
                    type="button"
                    onClick={toggleBGM}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      bgmMuted
                        ? 'bg-zinc-900 text-rose-400'
                        : 'text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800'
                    }`}
                    title="Toggle Music"
                  >
                    <Music className={`w-3.5 h-3.5 ${bgmMuted ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span>BGM {bgmMuted ? 'Off' : 'On'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleSFX}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      sfxMuted
                        ? 'bg-zinc-900 text-rose-400'
                        : 'text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800'
                    }`}
                    title="Toggle Sound Effects"
                  >
                    {sfxMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>SFX {sfxMuted ? 'Off' : 'On'}</span>
                  </button>
                </div>
              </header>

              {/* 6 Gauntlets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GAMES.map((g, i) => {
                  const Icon = g.icon;
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="h-full"
                    >
                      <button
                        type="button"
                        onClick={() => setGame(g.id)}
                        className="w-full text-left group flex flex-col justify-between h-full min-h-[212px] rounded-xl bg-[#111113] border border-zinc-800/90 hover:border-zinc-700 hover:bg-[#151518] p-5 transition-all"
                      >
                        <div className="w-full">
                          <div className="flex items-start justify-between gap-2 mb-4 w-full">
                            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                              <Icon className={`w-4 h-4 ${g.iconTint}`} />
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-400">
                              {g.badge}
                            </span>
                          </div>
                          <h2 className="text-base font-semibold tracking-tight text-zinc-50 mb-0.5">
                            {g.title}
                          </h2>
                          <p className="text-xs text-zinc-500 mb-3">
                            {g.subtitle}
                          </p>
                          <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                            {g.description}
                          </p>
                        </div>
                        <div className="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-zinc-50 transition-colors w-full">
                          <span>Start challenge</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
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
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#111113]/95 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200 hover:text-zinc-50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-xs font-medium pointer-events-auto"
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
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#111113]/95 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200 hover:text-zinc-50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-xs font-medium pointer-events-auto"
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
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#111113]/95 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200 hover:text-zinc-50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-xs font-medium pointer-events-auto"
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
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#111113]/95 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200 hover:text-zinc-50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-xs font-medium pointer-events-auto"
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
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#111113]/95 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200 hover:text-zinc-50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-xs font-medium pointer-events-auto"
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
              className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-[#111113]/95 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200 hover:text-zinc-50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-xs font-medium pointer-events-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
