'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, AlertTriangle, List, Flame } from 'lucide-react';
import { QUIZZES } from '../../../lib/quizzes';

export function QuizSelectScreen({ onSelect, onViewCollection }: { onSelect: (id: string) => void; onViewCollection: () => void }) {
  const [unlockedCount, setUnlockedCount] = React.useState(0);
  const [glitchVisible, setGlitchVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      const unlocked = JSON.parse(localStorage.getItem('unlockedCards') || '[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnlockedCount(unlocked.length);
    } catch {
      setUnlockedCount(0);
    }
  }, []);

  React.useEffect(() => {
    if (unlockedCount >= 10) {
      const timeoutRandom = () => Math.random() * 60_000 + 120_000;
      let timerId: ReturnType<typeof setTimeout>;

      const triggerGlitch = () => {
        setGlitchVisible(true);
        setTimeout(() => setGlitchVisible(false), 6_000 + Math.random() * 4_000);
        timerId = setTimeout(triggerGlitch, timeoutRandom());
      };

      timerId = setTimeout(triggerGlitch, timeoutRandom());
      return () => clearTimeout(timerId);
    }
  }, [unlockedCount]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-10 flex flex-col items-center w-full max-w-5xl py-4 sm:py-8 pt-10 sm:pt-8 my-auto">
      <div className="text-center mb-8 sm:mb-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-cyan-500/20 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none" />
        <h1 className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-glow-cyan uppercase mb-2 sm:mb-3 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] px-4">
          REALITY CHECK
        </h1>
        <p className="relative text-cyan-200/50 text-[10px] sm:text-xs md:text-sm font-mono tracking-[0.2em] sm:tracking-[0.3em] uppercase">
          Select Evaluation Module
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full px-4 sm:px-6">
        {QUIZZES.filter((quiz) => !quiz.hidden).map((quiz, i) => {
          const isRoast = quiz.id === 'roast';

          return (
            <motion.button
              key={quiz.id}
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(quiz.id)}
              className={`group relative flex flex-col items-start text-left p-5 sm:p-6 bg-black/40 border rounded-xl overflow-hidden backdrop-blur-xl shadow-md transition-all ${
                isRoast
                  ? 'border-orange-600/30 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(234,88,12,0.2)]'
                  : 'border-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]'
              }`}
            >
              <div className={`absolute -inset-24 bg-gradient-to-tr ${isRoast ? 'from-orange-500/10' : 'from-cyan-500/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl z-0`} />
              <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${isRoast ? 'via-orange-500/50' : 'via-cyan-400/50'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 w-full transform -translate-x-full group-hover:translate-x-full duration-1000 ease-in-out`} />

              <div className="relative z-10 w-full">
                <div className="flex justify-between items-center mb-3">
                  <div className={`${isRoast ? 'text-orange-500 border-orange-500/30' : 'text-cyan-500 border-cyan-500/30'} font-mono text-[10px] sm:text-xs tracking-widest border px-2 py-0.5 rounded`}>
                    Mod // 0{i + 1}
                  </div>
                  <div className={`w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500 transition-colors ${isRoast ? 'group-hover:border-orange-500/50 group-hover:text-orange-400' : 'group-hover:border-cyan-500/50 group-hover:text-cyan-400'}`}>
                    {isRoast ? <Flame className="w-3 h-3" /> : <List className="w-3 h-3" />}
                  </div>
                </div>
                <h3 className={`text-lg sm:text-xl font-black mb-1 uppercase tracking-tight transition-all ${isRoast ? 'text-orange-100 group-hover:text-orange-300 drop-shadow-[0_0_8px_rgba(234,88,12,0.3)]' : 'text-white group-hover:text-glow-cyan'}`}>
                  {quiz.title}
                </h3>
                <p className={`${isRoast ? 'text-orange-400/80 border-orange-900/30' : 'text-cyan-400/80 border-white/10'} text-[9px] sm:text-[10px] font-mono uppercase tracking-widest mb-2 sm:mb-3 border-b pb-2 w-full`}>
                  {quiz.subtitle}
                </p>
                <p className="text-zinc-400 text-[11px] sm:text-xs leading-relaxed line-clamp-2">{quiz.description}</p>

                <div className={`mt-3 sm:mt-4 flex items-center text-[10px] font-mono transition-colors uppercase ${isRoast ? 'text-orange-500/70 group-hover:text-orange-400' : 'text-cyan-500/70 group-hover:text-cyan-400'}`}>
                  <span className="mr-2">Initialize Sequence</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>
          );
        })}

        <AnimatePresence>
          {glitchVisible && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, rotate: [-1, 1, -1] }}
              transition={{ rotate: { repeat: Infinity, duration: 0.1 } }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onSelect('true_reality')}
              className="group relative flex flex-col items-start text-left p-5 sm:p-6 bg-red-950 border-2 border-red-600/80 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,0,0,0.4)] hover:shadow-[0_0_30px_rgba(255,0,0,0.8)] cursor-pointer"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] mix-blend-overlay opacity-30 animate-pulse z-0" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-600 animate-[pulse_0.1s_infinite] w-full z-10" />

              <div className="relative z-10 w-full text-red-100">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-red-400 font-mono text-[10px] sm:text-xs tracking-widest border border-red-500/50 px-2 py-0.5 rounded bg-red-900/50 font-bold">
                    ERR // 0xDEAD
                  </div>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>
                <h3 className="text-lg sm:text-xl font-black mb-1 uppercase tracking-tight text-white">THE TRUE REALITY</h3>
                <p className="text-red-400 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest mb-2 sm:mb-3 border-b border-red-500/50 pb-2">SYSTEM_BREACH</p>
                <p className="text-red-200/80 text-[11px] sm:text-xs leading-relaxed line-clamp-2 font-mono">YOU WERE NOT MEANT TO SEE THIS. THE SIMULATION IS FAILING. CLOSE THE APPLET.</p>

                <div className="mt-3 sm:mt-4 flex items-center text-[10px] font-mono text-red-400 group-hover:text-red-300 font-bold uppercase transition-transform group-hover:translate-x-2">
                  <span className="mr-2">WAKE UP</span>
                  <AlertTriangle className="w-3 h-3 animate-bounce" />
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
        onClick={onViewCollection}
        className="mt-8 sm:mt-12 px-6 sm:px-8 py-3 bg-zinc-900/50 border border-zinc-700 hover:border-fuchsia-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-fuchsia-400 font-mono text-xs sm:text-sm uppercase tracking-widest rounded-lg flex items-center gap-3 transition-all group shadow-md z-20 relative"
      >
        <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-fuchsia-500 group-hover:animate-pulse" />
        View Card Collection
      </motion.button>
    </motion.div>
  );
}
