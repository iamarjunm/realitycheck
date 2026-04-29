'use client';

import React from 'react';
import { motion } from 'motion/react';
import type { Question } from '../../../lib/quizzes';

export function RapidFireQuizScreen({ question, progress, onAnswer }: { question: Question, progress: number, onAnswer: (p: any) => void }) {
  const [timeLeft, setTimeLeft] = React.useState(3000);
  const answeredRef = React.useRef(false);
  
  React.useEffect(() => {
    answeredRef.current = false;
    setTimeLeft(3000);
    let startTime = Date.now();
    const interval = setInterval(() => {
      if (answeredRef.current) {
        clearInterval(interval);
        return;
      }
      const remaining = 3000 - (Date.now() - startTime);
      if (remaining <= 0) {
        clearInterval(interval);
        answeredRef.current = true;
        onAnswer({ THE_HESITANT: 2 }); // Unlocks Hesitant if out of time
      } else {
        setTimeLeft(remaining);
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [question, onAnswer]);

  // keyboard capture A/D
  React.useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if (answeredRef.current) return;
        if(e.key === 'a' || e.key === 'A') {
           if(question?.answers[0]) {
               answeredRef.current = true;
               onAnswer(question.answers[0].points);
           }
        } else if (e.key === 'd' || e.key === 'D') {
           if(question?.answers[1]) {
               answeredRef.current = true;
               onAnswer(question.answers[1].points);
           }
        }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, onAnswer]);

  if (!question) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="z-10 w-full max-w-2xl px-4 my-auto pt-16 sm:pt-0 relative"
    >
      <div 
        className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(250,204,21,0.05)_20px,rgba(250,204,21,0.05)_40px)] pointer-events-none -z-10 blur-[1px] rounded-3xl"
      ></div>

      <div className="w-full h-3 bg-zinc-900 mb-8 overflow-hidden border-2 border-yellow-500/50 skew-x-12 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
        <motion.div 
          className="h-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]"
          style={{ width: `${(timeLeft / 3000) * 100}%` }}
        />
      </div>

      <div 
        className={`space-y-8 text-center drop-shadow-2xl ${timeLeft < 1000 ? 'animate-[shake_0.5s_infinite]' : ''}`} 
        style={{ touchAction: 'none' }}
      >
        <div className="text-yellow-500 text-xs uppercase tracking-widest font-black animate-pulse">
          WARNING: CRITICAL COGNITIVE LOAD
        </div>
        
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-yellow-50 uppercase tracking-tighter drop-shadow-[0_2px_20px_rgba(250,204,21,0.6)] mix-blend-add">
          {question.text}
        </h2>
        
        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragSnapToOrigin={true}
          onDragEnd={(e, { offset }) => {
            if (answeredRef.current) return;
            const swipe = offset.x;
            if (swipe < -80 && question.answers[0]) {
               answeredRef.current = true;
               onAnswer(question.answers[0].points);
            } else if (swipe > 80 && question.answers[1]) {
               answeredRef.current = true;
               onAnswer(question.answers[1].points);
            }
          }}
          className="grid grid-cols-2 gap-4 mt-12 cursor-grab active:cursor-grabbing"
        >
          {question.answers.map((ans, i) => (
             <button 
               key={i} 
               onClick={() => {
                 if (answeredRef.current) return;
                 answeredRef.current = true;
                 onAnswer(ans.points);
               }}
               className={`h-40 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black uppercase tracking-tight transition-all active:scale-95 border-4 ${
                  i === 0 ? 'bg-black hover:bg-yellow-500 hover:text-black border-yellow-500 text-yellow-500 shadow-[inset_0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_30px_rgba(250,204,21,0.8)]' : 
                            'bg-yellow-500 hover:bg-black hover:text-yellow-500 border-black text-black shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(250,204,21,0.8)]'
               }`}
             >
                <div className="flex flex-col items-center pointer-events-none">
                   <span className="text-xs font-mono opacity-50 mb-2">PRESS {i === 0 ? 'A' : 'D'} OR SWIPE</span>
                   {ans.text}
                </div>
             </button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
