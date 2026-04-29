'use client';

import React from 'react';
import { motion } from 'motion/react';
import type { Question } from '../../../lib/quizzes';

export function QuizScreen({ question, progress, onAnswer, quizId }: { question: Question, progress: number, onAnswer: (p: any) => void, quizId?: string }) {
  const answeredRef = React.useRef(false);

  React.useEffect(() => {
    answeredRef.current = false;
  }, [question]);

  if (!question) return null;

  const isTrueReality = quizId === 'true_reality';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className={`relative z-10 w-full max-w-2xl px-4 my-auto pt-16 sm:pt-0 ${isTrueReality ? 'drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]' : ''}`}
    >
      <div className="w-full h-1 bg-zinc-800 mb-12 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-8">
        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-8 ${isTrueReality ? 'text-white font-mono tracking-tighter' : 'text-white'}`}>
          {question.text}
        </h2>
        <div className="space-y-4">
          {question.answers.map((ans, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (answeredRef.current) return;
                answeredRef.current = true;
                onAnswer(ans.points);
              }}
              className={`w-full text-left p-4 sm:p-6 border rounded-lg text-sm sm:text-lg transition-all font-mono ${
                isTrueReality 
                  ? 'bg-transparent border-white text-white hover:bg-white hover:text-black font-bold uppercase' 
                  : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-cyan-500/50 text-zinc-300 hover:text-white'
              }`}
            >
              <span className={`${isTrueReality ? 'text-white' : 'text-cyan-500/50'} mr-4`}>[{String.fromCharCode(65 + i)}]</span>
              {ans.text}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
