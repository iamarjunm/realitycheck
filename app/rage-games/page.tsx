'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FlipRage from '@/app/components/rage-games/FlipRage';
import MadTap from '@/app/components/rage-games/MadTap';
import BrainLag from '@/app/components/rage-games/BrainLag';
import TetherRage from '@/app/components/rage-games/TetherRage';
import TypeRage from '@/app/components/rage-games/TypeRage';
import ChaosCore from '@/app/components/rage-games/ChaosCore';
import { Link as LinkIcon, Keyboard, Zap, ArrowLeft, Volume2, VolumeX, HelpCircle, X, Music, ChevronRight, Activity, MousePointer2 } from 'lucide-react';
import { playBGM, stopBGM } from '@/app/components/rage-games/AudioSystem';
import Link from 'next/link';

const GAMES = [
  {
    id: 'flip',
    title: 'Flip Rage',
    subtitle: 'Gravity Inversion',
    description: 'One button. Gravity inverts on tap. Endless red obstacles. It only gets faster.',
    icon: Activity,
    accent: 'cyan',
    gradient: 'from-cyan-500/20 via-cyan-900/10 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]',
    text: 'text-cyan-400',
    badge: 'One Button',
  },
  {
    id: 'tap',
    title: 'Mad Tap',
    subtitle: 'Reaction Test',
    description: 'Click the blue orbs before they shrink. Ignore the red ones.',
    icon: MousePointer2,
    accent: 'red',
    gradient: 'from-red-500/20 via-red-900/10 to-transparent',
    border: 'border-red-500/30 hover:border-red-400/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(239,68,68,0.15)]',
    text: 'text-red-400',
    badge: 'Precision',
  },
  {
    id: 'brain',
    title: 'Brain Lag',
    subtitle: 'Muscle Memory',
    description: 'Keyboard only. The controls randomly scramble to destroy your muscle memory.',
    icon: Keyboard,
    accent: 'amber',
    gradient: 'from-amber-500/15 via-emerald-900/10 to-transparent',
    border: 'border-amber-500/25 hover:border-amber-400/50',
    glow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.12)]',
    text: 'text-amber-400',
    badge: 'Confusion',
  },
  {
    id: 'tether',
    title: 'Tether Rage',
    subtitle: 'Elastic Physics',
    description: 'You are tethered to the ball by a bungee cord. Panicking makes it worse.',
    icon: LinkIcon,
    accent: 'fuchsia',
    gradient: 'from-fuchsia-500/20 via-fuchsia-900/10 to-transparent',
    border: 'border-fuchsia-500/30 hover:border-fuchsia-400/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(217,70,239,0.15)]',
    text: 'text-fuchsia-400',
    badge: 'Mouse Only',
  },
  {
    id: 'type',
    title: 'Typo Terror',
    subtitle: 'Speed Typing',
    description: 'Keyboard only. A single typo or missed timer equals instant death.',
    icon: Keyboard,
    accent: 'emerald',
    gradient: 'from-emerald-500/20 via-emerald-900/10 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]',
    text: 'text-emerald-400',
    badge: 'Perfection',
  },
  {
    id: 'chaos',
    title: 'Chaos Core',
    subtitle: 'Sensory Overload',
    description: 'Keyboard only. Pure sensory overload. The ultimate bullet hell wow moment.',
    icon: Zap,
    accent: 'purple',
    gradient: 'from-purple-500/20 via-purple-900/10 to-transparent',
    border: 'border-purple-500/30 hover:border-purple-400/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]',
    text: 'text-purple-400',
    badge: 'Bullet Hell',
  }
] as const;

const HELP_TEXT: Record<string, string> = {
  menu: "Welcome to Rage Suite. Select a game to begin.",
  flip: "FLIP RAGE:\nTap or press Space to flip gravity. Avoid the pink obstacles. The game gets progressively faster.",
  tap: "MAD TAP:\nClick the blue Orbs before they expire. Do not click the red Orbs.",
  brain: "BRAIN LAG:\nPress the keys shown at the bottom of the screen to move to that lane. Periodically, the keys will scramble!",
  tether: "TETHER RAGE:\nMove your mouse to drag the ball via a bungee cord. The springy physics make it hard to control. Avoid obstacles.",
  type: "TYPO TERROR:\nType the word on the screen exactly as shown before the time runs out. One typo equals instant death.",
  chaos: "CHAOS CORE:\nUse WASD or Arrow Keys to move. Avoid EVERYTHING. Survive as long as you can through multiple phases of bullet hell."
};

export default function Page() {
  const [game, setGame] = useState<'menu' | 'flip' | 'tap' | 'brain' | 'tether' | 'type' | 'chaos'>('menu');
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
    <main className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Background Effect */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-orange-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-rose-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-grid-white opacity-40" />
      </div>

      {/* Home Back Button */}
      <div className="absolute top-6 left-6 z-50 pointer-events-auto">
        <AnimatePresence>
          {game === 'menu' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Link href="/" className="flex items-center gap-2 bg-zinc-950/80 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur transition-colors font-bold text-sm">
                <ArrowLeft className="w-4 h-4" /> Home
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Controls */}
      <div className="absolute top-6 right-6 z-50 flex gap-4 pointer-events-auto">
        <button onClick={() => setShowHelp(true)} className="p-2 bg-zinc-950/80 border border-white/10 rounded-xl hover:bg-white/10 transition-colors backdrop-blur">
          <HelpCircle className="w-5 h-5 text-zinc-300" />
        </button>
        <button onClick={toggleBGM} className="p-2 bg-zinc-950/80 border border-white/10 rounded-xl hover:bg-white/10 transition-colors backdrop-blur flex items-center gap-2" title="Toggle Music">
          <Music className={`w-5 h-5 ${bgmMuted ? 'text-red-400' : 'text-zinc-300'}`} />
        </button>
        <button onClick={toggleSFX} className="p-2 bg-zinc-950/80 border border-white/10 rounded-xl hover:bg-white/10 transition-colors backdrop-blur flex items-center gap-2" title="Toggle Sound Effects">
          {sfxMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-zinc-300" />}
        </button>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 p-8 rounded-2xl max-w-md w-full relative shadow-2xl"
            >
              <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-white">How to Play</h2>
              <p className="text-zinc-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full relative z-10 flex flex-col items-center p-6 overflow-hidden"
          >
            <div className="w-full max-w-6xl mx-auto h-full flex flex-col justify-center py-6">
              <header className="text-center mb-8 shrink-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-400 mb-4">
                  Test your patience
                </div>
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-3">
                  Rage <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-orange-400">Suite</span>
                </h1>
                <p className="text-zinc-500 font-mono text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                  Meticulously designed experiences engineered to ruin your day. Pick your poison.
                </p>
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                {GAMES.map((g, i) => {
                  const Icon = g.icon;
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="h-full"
                    >
                      <button
                        onClick={() => setGame(g.id as any)}
                        className={`w-full text-left group relative flex flex-col h-full rounded-2xl border bg-zinc-950/80 backdrop-blur-sm p-4 transition-all duration-300 ${g.border} ${g.glow}`}
                      >
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${g.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className="relative z-10 flex flex-col h-full w-full">
                          <div className="flex items-center justify-between mb-3 w-full">
                            <div className={`p-2 rounded-xl border border-white/10 bg-black/40 ${g.text}`}>
                              <Icon size={18} />
                            </div>
                            <span className={`text-[9px] font-mono uppercase tracking-widest ${g.text} opacity-70`}>
                              {g.badge}
                            </span>
                          </div>
                          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1 group-hover:text-white">
                            {g.title}
                          </h2>
                          <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${g.text}`}>
                            {g.subtitle}
                          </p>
                          <p className="text-xs text-zinc-400 leading-relaxed flex-1 mb-4 hidden sm:block">
                            {g.description}
                          </p>
                          <div className={`flex items-center justify-between text-[10px] font-black uppercase tracking-widest ${g.text} opacity-80 group-hover:opacity-100 w-full mt-auto`}>
                            <span>Play</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Renderers */}
        {game === 'flip' && (
          <motion.div key="flip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full h-full">
            <FlipRage muted={sfxMuted} />
            <button onClick={() => setGame('menu')} className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-zinc-950/80 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur transition-colors font-bold pointer-events-auto">
              <ArrowLeft className="w-5 h-5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'tap' && (
          <motion.div key="tap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full h-full">
            <MadTap muted={sfxMuted} />
            <button onClick={() => setGame('menu')} className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-zinc-950/80 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur transition-colors font-bold pointer-events-auto">
              <ArrowLeft className="w-5 h-5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'brain' && (
          <motion.div key="brain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full h-full">
            <BrainLag muted={sfxMuted} />
            <button onClick={() => setGame('menu')} className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-zinc-950/80 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur transition-colors font-bold pointer-events-auto">
              <ArrowLeft className="w-5 h-5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'tether' && (
          <motion.div key="tether" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full h-full">
            <TetherRage muted={sfxMuted} />
            <button onClick={() => setGame('menu')} className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-zinc-950/80 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur transition-colors font-bold pointer-events-auto">
              <ArrowLeft className="w-5 h-5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'type' && (
          <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full h-full">
            <TypeRage muted={sfxMuted} />
            <button onClick={() => setGame('menu')} className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-zinc-950/80 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur transition-colors font-bold pointer-events-auto">
              <ArrowLeft className="w-5 h-5" /> Menu
            </button>
          </motion.div>
        )}
        {game === 'chaos' && (
          <motion.div key="chaos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full h-full">
            <ChaosCore muted={sfxMuted} />
            <button onClick={() => setGame('menu')} className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-zinc-950/80 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur transition-colors font-bold pointer-events-auto">
              <ArrowLeft className="w-5 h-5" /> Menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
