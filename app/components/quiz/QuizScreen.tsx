'use client';

import React from 'react';
import { motion } from 'motion/react';
import type { Question } from '../../../lib/quizzes';

export function QuizScreen({ question, progress, onAnswer, quizId }: { question: Question; progress: number; onAnswer: (p: Record<string, number>) => void; quizId?: string }) {
  const answeredRef = React.useRef(false);

  React.useEffect(() => {
    answeredRef.current = false;
  }, [question]);

  if (!question) return null;

  const isTrueReality = quizId === 'true_reality';
  const isRoast = quizId === 'roast';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className={`relative z-10 w-full max-w-2xl px-4 my-auto pt-16 sm:pt-0 ${isTrueReality ? 'drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]' : isRoast ? 'drop-shadow-[0_0_20px_rgba(239,68,68,0.2)]' : ''}`}
    >
      <div className={`w-full h-1 ${isRoast ? 'bg-red-950 border border-red-900/50' : 'bg-zinc-800'} mb-12 rounded-full overflow-hidden`}>
        <motion.div className={`h-full ${isRoast ? 'bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.8)]' : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'}`} initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-8">
        <h2
          className={`text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-8 ${
            isTrueReality ? 'text-white font-mono tracking-tighter' : isRoast ? 'text-orange-50 font-black tracking-tight drop-shadow-[0_2px_10px_rgba(234,88,12,0.5)]' : 'text-white'
          }`}
        >
          {question.text}
        </h2>
        <div className="space-y-4">
          {question.answers.map((answer, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (answeredRef.current) return;
                answeredRef.current = true;
                onAnswer(answer.points);
              }}
              className={`w-full text-left p-4 sm:p-6 border rounded-lg text-sm sm:text-lg transition-all font-mono ${
                isTrueReality
                  ? 'bg-transparent border-white text-white hover:bg-white hover:text-black font-bold uppercase'
                  : isRoast
                    ? 'border-orange-900/50 bg-zinc-950/80 hover:bg-orange-950 hover:border-orange-500 text-orange-200/80 hover:text-orange-100 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]'
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-cyan-500/50 text-zinc-300 hover:text-white'
              }`}
            >
              <span className={`${isTrueReality ? 'text-white' : isRoast ? 'text-orange-600/60 font-black' : 'text-cyan-500/50'} mr-4`}>[{String.fromCharCode(65 + index)}]</span>
              {answer.text}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
