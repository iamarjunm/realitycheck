'use client';

import React from 'react';
import { motion } from 'motion/react';

const RoastBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[150vw] h-[150vw] bg-[radial-gradient(ellipse_at_bottom,rgba(220,38,38,0.4)_0%,rgba(0,0,0,1)_80%)] blur-[50px] opacity-70 translate-y-1/3"
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: `${100 + Math.random() * 100}vh`, opacity: 0, left: `${Math.random() * 100}%` }}
            animate={{
              y: `-${20 + Math.random() * 50}vh`,
              opacity: [0, Math.random() * 0.8 + 0.2, 0],
              x: `${Math.random() * 60 - 30}vw`,
            }}
            transition={{
              duration: 4 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'linear',
            }}
            className="absolute top-0 w-1.5 h-1.5 bg-orange-500 rounded-full blur-[1px]"
            style={{ boxShadow: '0 0 10px 2px rgba(249, 115, 22, 0.8)' }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.03)_10px,rgba(239,68,68,0.03)_20px)] mix-blend-overlay z-10" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] mix-blend-overlay opacity-20" />
    </div>
  );
};

const AbyssBackground = ({ depth }: { depth: number }) => {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex items-center justify-center transition-colors duration-1000"
      style={{
        backgroundColor: depth > 30 ? '#110000' : depth > 15 ? '#050011' : '#000',
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1 + depth * 0.05, 1],
          opacity: [0.1 + depth * 0.01, 0.3 + depth * 0.02, 0.1 + depth * 0.01],
        }}
        transition={{ duration: Math.max(1, 10 - depth * 0.2), repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[150vw] h-[150vw] bg-[radial-gradient(circle_at_center,rgba(50,0,100,0.2)_0%,rgba(0,0,0,1)_80%)] blur-[50px] mix-blend-screen"
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 + Math.min(depth * 2, 80) }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: '-10vh', opacity: 0, left: `${Math.random() * 100}%` }}
            animate={{ y: '110vh', opacity: [0, 0.5, 0] }}
            transition={{
              duration: Math.max(0.5, 5 - depth * 0.1) + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear',
            }}
            className="absolute top-0 w-[2px] h-[10px] bg-indigo-500/50 rounded-full blur-[1px]"
          />
        ))}
      </div>

      {depth > 10 && (
        <div
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] mix-blend-overlay"
          style={{ opacity: Math.min(0.8, depth * 0.02) }}
        />
      )}
    </div>
  );
};

const TrueRealityBackground = () => {
  const codeBlocks = React.useMemo(() => Array.from({ length: 200 }).map(() => (Math.random() > 0.5 ? 'FATAL_ERR ' : 'NULL_VOID ')), []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex flex-col items-center justify-center">
      <motion.div
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'mirror' }}
        className="absolute inset-0 bg-red-950"
      />
      <div className="relative font-mono text-red-600 text-sm opacity-50 whitespace-pre-wrap break-words w-full h-full overflow-hidden leading-tight tracking-tighter">
        {codeBlocks.map((block, i) => (
          <span key={i} className="inline-block p-1 animate-pulse" style={{ animationDelay: `${i * 0.05}s` }}>
            {block}
          </span>
        ))}
      </div>
      <motion.div
        animate={{ translateY: ['-100%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-gradient-to-b from-transparent via-red-600/10 to-transparent h-[20%] w-full"
      />
    </div>
  );
};

export const QuizVibeBackground = ({
  quizId,
  gameState,
  abyssDepth = 0,
}: {
  quizId: string | null;
  gameState: string;
  abyssDepth?: number;
}) => {
  if (gameState === 'select' || !quizId) return null;

  switch (quizId) {
    case 'npc':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px] animate-[pulse_2s_infinite]" />
          <div className="matrix-rain-container opacity-40">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="matrix-drop"
                style={{
                  left: `${i * 5}%`,
                  animationDelay: `${((i * 13) % 50) / 10}s`,
                  animationDuration: `${2 + ((i * 7) % 30) / 10}s`,
                }}
              >
                10101011010<br />
                010101001<br />
                10111101<br />
                01010101
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        </div>
      );
    case 'liability':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex">
          <motion.div animate={{ opacity: [0.1, 0.9, 0.1], x: [0, 50, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} className="w-1/2 h-full bg-red-600 blur-[80px] mix-blend-screen" />
          <motion.div animate={{ opacity: [0.9, 0.1, 0.9], x: [0, -50, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} className="w-1/2 h-full bg-blue-600 blur-[80px] mix-blend-screen" />
          <div className="absolute inset-0 bg-white/5 opacity-0 animate-[flash_0.1s_infinite]" />
        </div>
      );
    case 'brainrot':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-zinc-950 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 0.9, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute w-[200vw] h-[200vw] bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] blur-[80px] rounded-full mix-blend-color-dodge opacity-20"
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] mix-blend-overlay rotate-45 scale-150 animate-pulse opacity-40" />
        </div>
      );
    case 'corp':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-zinc-950 flex items-center justify-center perspective-[1000px]">
          <motion.div
            animate={{ backgroundPosition: ['0px 0px', '0px 100px'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-0 w-[200vw] h-[100vh] bg-[linear-gradient(#444_2px,transparent_2px),linear-gradient(90deg,#444_2px,transparent_2px)] bg-[size:100px_100px] origin-bottom shadow-[inset_0_100px_100px_rgba(9,9,11,1)]"
            style={{ transform: 'rotateX(75deg) translateY(50%)' }}
          />
          <div className="absolute top-0 w-full h-[30vh] bg-zinc-600 opacity-20 blur-3xl animate-[flicker_3s_infinite]" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent flex items-center justify-center">
            <div className="text-[15vw] font-bold text-zinc-800/40 tracking-tighter uppercase blur-sm whitespace-nowrap rotate-[-10deg]">SYNERGY </div>
          </div>
        </div>
      );
    case 'aesthetic':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex items-center justify-center">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} className="w-[150vw] h-[150vw] bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 blur-[150px] rounded-full opacity-20" />
          <div className="absolute inset-0 backdrop-blur-[50px] bg-white/5 mix-blend-overlay" />
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent opacity-80" />
        </div>
      );
    case 'cosmic':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 0.9, 1], rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full border-[20px] border-purple-900/40 border-t-fuchsia-500/80 border-r-fuchsia-500/20 blur-[10px]"
          />
          <motion.div animate={{ scale: [0.9, 1.2, 0.9] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="absolute w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] rounded-full bg-black shadow-[0_0_150px_100px_rgba(120,0,255,0.4)] z-10" />
          <motion.div animate={{ scale: [1, 1.5], opacity: [0, 1, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMzAwIiBjeT0iMjAwIiByPSIxIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMzUwIiByPSIxLjUiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-50 bg-[length:200px_200px]" />
          <motion.div animate={{ scale: [1, 1.5], opacity: [0, 1, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'linear', delay: 2.5 }} className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48Y2lyY2xlIGN4PSIyMDAiIGN4PSI1MCIgY3k9IjI1MCIgcj0iMiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMSIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjM1MCIgY3k9IjE1MCIgcj0iMS41IiBmaWxsPSIjZmZmIi8+PC9zdmc+')] opacity-30 bg-[length:300px_300px] rotate-45" />
        </div>
      );
    case 'rapid_fire':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-zinc-950 pointer-events-none flex items-center justify-center">
          <motion.div animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.05, 1] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear', repeatType: 'mirror' }} className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.3)_0%,rgba(0,0,0,1)_80%)] mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] mix-blend-overlay scale-150 animate-[pulse_0.5s_infinite] opacity-30" />
          <motion.div animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(202,138,4,0.15)_40px,rgba(202,138,4,0.15)_80px)] opacity-60 z-10" />
        </div>
      );
    case 'trick':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
          <motion.div animate={{ height: ['0vh', '5vh', '0vh'], opacity: [0, 0.8, 0], y: ['0vh', '100vh'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="w-full bg-green-500/30 mix-blend-screen shadow-[0_0_30px_rgba(34,197,94,0.8)] z-20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,50,0,0.5)_0%,rgba(0,0,0,1)_100%)] z-0" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-green-900/20 to-transparent blur-2xl animate-[pulse_4s_infinite]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15)_0px,rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)] bg-[size:100%_2px] z-10" />
        </div>
      );
    case 'true_reality':
      return <TrueRealityBackground />;
    case 'roast':
      return <RoastBackground />;
    case 'abyss':
      return <AbyssBackground depth={abyssDepth} />;
    default:
      return null;
  }
};
