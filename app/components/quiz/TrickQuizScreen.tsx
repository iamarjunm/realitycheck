'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import type { Question } from '../../../lib/quizzes';

export function TrickQuizScreen({ question, progress, onAnswer }: { question: Question; progress: number; onAnswer: (p: Record<string, number>, forceEnd?: boolean) => void }) {
  const answeredRef = React.useRef(false);
  const [glitch, setGlitch] = React.useState(false);
  const [ticker, setTicker] = React.useState('0000');
  const [dangerHover, setDangerHover] = React.useState(false);

  React.useEffect(() => {
    answeredRef.current = false;
    const interval = setInterval(() => {
      const num = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      setTicker(num);

      if (Math.random() > 0.8) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }
    }, 400);

    return () => {
      clearInterval(interval);
    };
  }, [question]);

  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="z-10 w-full max-w-3xl px-4 my-auto pt-16 sm:pt-0 font-mono relative min-h-[60vh] flex flex-col justify-center"
    >
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
          backgroundSize: '100% 2px',
        }}
      />

      {dangerHover && <div className="fixed inset-0 pointer-events-none z-40 bg-red-900/10 animate-pulse" />}

      <div className="absolute -top-16 md:-top-32 right-0 md:-right-10 z-50">
        <motion.button
          onMouseEnter={() => setDangerHover(true)}
          onMouseLeave={() => setDangerHover(false)}
          animate={{ scale: dangerHover ? [1, 1.1, 1] : [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: dangerHover ? 0.2 : 1.5 }}
          onClick={() => {
            if (answeredRef.current) return;
            answeredRef.current = true;
            onAnswer({ THE_DEFECTOR: 100 }, true);
          }}
          className="bg-red-700 text-white font-black p-4 md:p-6 rounded-full shadow-[0_0_30px_rgba(255,0,0,0.8)] border-4 border-red-900 uppercase active:scale-95 transition-transform"
        >
          <div className="flex flex-col items-center">
            <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 mb-1" />
            <span className="text-[10px] md:text-xs tracking-tighter">DO NOT PRESS<br />THIS BUTTON</span>
          </div>
        </motion.button>
        {dangerHover && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-red-500 text-[10px] uppercase font-black tracking-widest animate-pulse">
            Violation of Protocol!
          </div>
        )}
      </div>

      <div className="w-full h-1 bg-zinc-800 mb-8 rounded-none overflow-hidden relative">
        <motion.div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
        <div className="absolute right-0 top-0 text-[8px] text-green-500 leading-none">SYS_MEM_{ticker}</div>
      </div>

      <div className={`space-y-8 relative z-10 ${glitch ? 'translate-x-1 -translate-y-0.5 skew-x-2 drop-shadow-[2px_0_0_rgba(255,0,0,0.5)]' : ''} transition-all duration-75`}>
        <div className="flex justify-between items-end border-b border-green-900/50 pb-2 mb-6">
          <div className="text-green-500 text-xs uppercase tracking-widest opacity-70">
            Terminal_Interface v2.4 <br />
            <span className="opacity-50 text-[10px]">Active Calibration: DO_NOT_DEVIATE</span>
          </div>
          <div className="text-green-500 text-xs opacity-50 text-right">
            PID: {ticker} <br />
            VOLTAGE: NORMAL
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-2xl font-normal leading-relaxed text-green-400 mb-8 lowercase max-w-2xl">
          {'> '} {question.text}
          <span className="animate-pulse bg-green-400 w-2 h-4 inline-block ml-1 align-middle" />
        </h2>
        <div className="space-y-3">
          {question.answers.map((answer, index) => (
            <motion.button
              key={index}
              whileHover={{ x: 10, backgroundColor: 'rgba(20,83,45, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (answeredRef.current) return;
                answeredRef.current = true;
                onAnswer(answer.points);
              }}
              className="w-full text-left p-3 sm:p-4 border border-green-900/30 bg-black/60 backdrop-blur-sm rounded-none text-green-500 hover:text-green-300 hover:border-green-500 transition-all uppercase tracking-widest text-xs sm:text-sm grid grid-cols-[auto_1fr] items-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-green-500/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              <span className="text-green-700 group-hover:text-green-400 mr-4 self-start opacity-70">[{index + 1}]</span>
              <span className="relative z-10">{answer.text}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
