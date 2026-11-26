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
  Bomb,
} from 'lucide-react';
import { playBGM, stopBGM } from '@/app/components/rage-games/AudioSystem';
import GlobalNav from '@/components/GlobalNav';

const GAMES = [
  {
    id: 'flip',
    title: 'Flip Rage',
    subtitle: 'Gravity Inversion',
    description: 'One button. Gravity inverts on tap. Endless red obstacles. It only gets faster.',
    icon: Activity,
    accent: 'cyan',
    gradient: 'from-cyan-500/20 via-cyan-950/25 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-400/70',
    glow: 'hover:shadow-[0_0_34px_rgba(34,211,238,0.18)]',
    text: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/12 border-cyan-500/30 text-cyan-300',
    badge: 'One Button',
  },
  {
    id: 'tap',
    title: 'Mad Tap',
    subtitle: 'Reaction Test',
    description: 'Click the blue orbs before they shrink. Ignore the red ones.',
    icon: MousePointer2,
    accent: 'red',
    gradient: 'from-red-500/20 via-red-950/25 to-transparent',
    border: 'border-red-500/30 hover:border-red-400/70',
    glow: 'hover:shadow-[0_0_34px_rgba(239,68,68,0.18)]',
    text: 'text-red-400',
    badgeBg: 'bg-red-500/12 border-red-500/30 text-red-300',
    badge: 'Precision',
  },
  {
    id: 'brain',
    title: 'Brain Lag',
    subtitle: 'Muscle Memory',
    description: 'Keyboard only. The controls randomly scramble to destroy your muscle memory.',
    icon: Keyboard,
    accent: 'amber',
    gradient: 'from-amber-500/18 via-amber-950/25 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-400/70',
    glow: 'hover:shadow-[0_0_34px_rgba(245,158,11,0.16)]',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/12 border-amber-500/30 text-amber-300',
    badge: 'Confusion',
  },
  {
    id: 'tether',
    title: 'Tether Rage',
    subtitle: 'Elastic Physics',
    description: 'You are tethered to the ball by a bungee cord. Panicking makes it worse.',
    icon: LinkIcon,
    accent: 'fuchsia',
    gradient: 'from-fuchsia-500/20 via-fuchsia-950/25 to-transparent',
    border: 'border-fuchsia-500/30 hover:border-fuchsia-400/70',
    glow: 'hover:shadow-[0_0_34px_rgba(217,70,239,0.18)]',
    text: 'text-fuchsia-400',
    badgeBg: 'bg-fuchsia-500/12 border-fuchsia-500/30 text-fuchsia-300',
    badge: 'Mouse Only',
  },
  {
    id: 'type',
    title: 'Typo Terror',
    subtitle: 'Speed Typing',
    description: 'Keyboard only. A single typo or missed timer equals instant death.',
    icon: Keyboard,
    accent: 'emerald',
    gradient: 'from-emerald-500/20 via-emerald-950/25 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-400/70',
    glow: 'hover:shadow-[0_0_34px_rgba(16,185,129,0.18)]',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300',
    badge: 'Perfection',
  },
  {
    id: 'chaos',
    title: 'Chaos Core',
    subtitle: 'Sensory Overload',
    description: 'Keyboard only. Pure sensory overload. The ultimate bullet hell wow moment.',
    icon: Zap,
    accent: 'purple',
    gradient: 'from-purple-500/20 via-purple-950/25 to-transparent',
    border: 'border-purple-500/30 hover:border-purple-400/70',
    glow: 'hover:shadow-[0_0_34px_rgba(168,85,247,0.18)]',
    text: 'text-purple-400',
    badgeBg: 'bg-purple-500/12 border-purple-500/30 text-purple-300',
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
    <main className="min-h-screen bg-[#04050a] text-white relative overflow-hidden font-sans selection:bg-rose-500/30 flex flex-col">
      {/* Background Effect */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[540px] bg-red-500/[0.09] rounded-full blur-[135px]" />
        <div className="absolute bottom-0 left-0 w-[520px] h-[420px] bg-orange-600/[0.08] rounded-full blur-[110px]" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[420px] bg-rose-600/[0.08] rounded-full blur-[110px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      {/* Show GlobalNav ONLY on the Menu */}
      {game === 'menu' && <GlobalNav activePortal="rage" />}

      {/* Floating Controls ONLY when playing a rage game */}
      {game !== 'menu' && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2.5 bg-[#070912]/85 border border-white/15 rounded-xl hover:bg-white/10 hover:border-white/30 transition-colors backdrop-blur-xl"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4 text-zinc-200" />
          </button>
          <button
            onClick={toggleBGM}
            className="p-2.5 bg-[#070912]/85 border border-white/15 rounded-xl hover:bg-white/10 hover:border-white/30 transition-colors backdrop-blur-xl"
            title="Toggle Music"
          >
            <Music className={`w-4 h-4 ${bgmMuted ? 'text-red-400' : 'text-zinc-200'}`} />
          </button>
          <button
            onClick={toggleSFX}
            className="p-2.5 bg-[#070912]/85 border border-white/15 rounded-xl hover:bg-white/10 hover:border-white/30 transition-colors backdrop-blur-xl"
            title="Toggle Sound Effects"
          >
            {sfxMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              className="bg-[#090b14] border border-white/15 p-7 rounded-2xl max-w-md w-full relative shadow-[0_0_50px_rgba(0,0,0,0.85)]"
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-rose-400 mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                Briefing
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-white">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            className="w-full flex-1 relative z-10 flex flex-col"
          >
            <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 pt-8 pb-14 flex-1 flex flex-col justify-center">
              {/* Header Bar with Integrated Audio & Help Controls */}
              <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-rose-300 mb-3">
                    <Bomb className="w-3 h-3" />
                    6 Precision Gauntlets
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white leading-none">
                    Rage{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-orange-400">
                      Suite
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
                    Meticulously designed experiences engineered to ruin your day. Pick your poison and keep your keyboard intact.
                  </p>
                </div>

                {/* Clean Inline Controls Bar (No Overlapping Floating Buttons) */}
                <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl border border-white/10 bg-[#070912]/90 backdrop-blur-xl self-start lg:self-auto">
                  <button
                    onClick={() => setShowHelp(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                    title="How to Play"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Help</span>
                  </button>
                  <div className="w-px h-5 bg-white/10" />
                  <button
                    onClick={toggleBGM}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      bgmMuted
                        ? 'bg-red-500/15 text-red-300'
                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                    title="Toggle Music"
                  >
                    <Music className={`w-3.5 h-3.5 ${bgmMuted ? 'text-red-400' : 'text-emerald-400'}`} />
                    <span>BGM {bgmMuted ? 'Off' : 'On'}</span>
                  </button>
                  <button
                    onClick={toggleSFX}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      sfxMuted
                        ? 'bg-red-500/15 text-red-300'
                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                    title="Toggle Sound Effects"
                  >
                    {sfxMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
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
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="h-full"
                    >
                      <button
                        onClick={() => setGame(g.id)}
                        className={`w-full text-left group relative flex flex-col justify-between h-full min-h-[220px] rounded-2xl border bg-[#070912]/88 backdrop-blur-xl p-5 overflow-hidden transition-all duration-250 hover:-translate-y-1 ${g.border} ${g.glow}`}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${g.gradient} opacity-65 group-hover:opacity-100 transition-opacity pointer-events-none`}
                        />
                        <div className="relative z-10 w-full">
                          <div className="flex items-center justify-between mb-4 w-full">
                            <div className={`p-2.5 rounded-xl border border-white/15 bg-black/60 ${g.text}`}>
                              <Icon size={19} />
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase tracking-wider ${g.badgeBg}`}>
                              {g.badge}
                            </span>
                          </div>
                          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-0.5">
                            {g.title}
                          </h2>
                          <p className={`text-[10px] font-mono uppercase tracking-[0.2em] mb-2.5 ${g.text}`}>
                            {g.subtitle}
                          </p>
                          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                            {g.description}
                          </p>
                        </div>
                        <div className={`relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-black uppercase tracking-widest ${g.text} w-full`}>
                          <span>Enter Gauntlet</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
              onClick={() => setGame('menu')}
              className="fixed top-5 left-5 z-50 flex items-center gap-2 bg-[#070912]/85 border border-white/15 px-3.5 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-xl transition-colors font-mono text-xs uppercase tracking-wider font-bold pointer-events-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'tap' && (
          <motion.div key="tap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <MadTap muted={sfxMuted} />
            <button
              onClick={() => setGame('menu')}
              className="fixed top-5 left-5 z-50 flex items-center gap-2 bg-[#070912]/85 border border-white/15 px-3.5 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-xl transition-colors font-mono text-xs uppercase tracking-wider font-bold pointer-events-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'brain' && (
          <motion.div key="brain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <BrainLag muted={sfxMuted} />
            <button
              onClick={() => setGame('menu')}
              className="fixed top-5 left-5 z-50 flex items-center gap-2 bg-[#070912]/85 border border-white/15 px-3.5 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-xl transition-colors font-mono text-xs uppercase tracking-wider font-bold pointer-events-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'tether' && (
          <motion.div key="tether" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <TetherRage muted={sfxMuted} />
            <button
              onClick={() => setGame('menu')}
              className="fixed top-5 left-5 z-50 flex items-center gap-2 bg-[#070912]/85 border border-white/15 px-3.5 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-xl transition-colors font-mono text-xs uppercase tracking-wider font-bold pointer-events-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'type' && (
          <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <TypeRage muted={sfxMuted} />
            <button
              onClick={() => setGame('menu')}
              className="fixed top-5 left-5 z-50 flex items-center gap-2 bg-[#070912]/85 border border-white/15 px-3.5 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-xl transition-colors font-mono text-xs uppercase tracking-wider font-bold pointer-events-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'chaos' && (
          <motion.div key="chaos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full min-h-screen flex-1">
            <ChaosCore muted={sfxMuted} />
            <button
              onClick={() => setGame('menu')}
              className="fixed top-5 left-5 z-50 flex items-center gap-2 bg-[#070912]/85 border border-white/15 px-3.5 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-xl transition-colors font-mono text-xs uppercase tracking-wider font-bold pointer-events-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
