'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Download, Share2, Terminal, ChevronRight, AlertTriangle, RotateCcw, List } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { QUIZZES, QuizDef, RoleDef, Question } from '../lib/quizzes';

const QuizVibeBackground = ({ quizId, gameState }: { quizId: string | null, gameState: string }) => {
  if (gameState === 'select' || !quizId) return null;

  switch (quizId) {
    case 'npc':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px] animate-[pulse_2s_infinite]"></div>
          {/* Matrix rain effect via CSS */}
          <div className="matrix-rain-container opacity-40">
             {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="matrix-drop" style={{ left: `${i * 5}%`, animationDelay: `${((i * 13) % 50) / 10}s`, animationDuration: `${2 + ((i * 7) % 30) / 10}s` }}>
                  10101011010<br/>010101001<br/>10111101<br/>01010101
                </div>
             ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        </div>
      );
    case 'liability':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex">
          <motion.div animate={{ opacity: [0.1, 0.9, 0.1], x: [0, 50, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} className="w-1/2 h-full bg-red-600 blur-[80px] mix-blend-screen" />
          <motion.div animate={{ opacity: [0.9, 0.1, 0.9], x: [0, -50, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} className="w-1/2 h-full bg-blue-600 blur-[80px] mix-blend-screen" />
          <div className="absolute inset-0 bg-white/5 opacity-0 animate-[flash_0.1s_infinite]" />
        </div>
      );
    case 'brainrot':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-zinc-950 pointer-events-none flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.2, 0.9, 1.5, 1] }} 
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             className="absolute w-[200vw] h-[200vw] bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] blur-[80px] rounded-full mix-blend-color-dodge opacity-20" 
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] mix-blend-overlay rotate-45 scale-150 animate-pulse opacity-40"></div>
        </div>
      );
    case 'corp':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-zinc-950 flex items-center justify-center perspective-[1000px]">
          {/* Bleak infinite scrolling floor */}
          <motion.div 
            animate={{ backgroundPosition: ['0px 0px', '0px 100px'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 w-[200vw] h-[100vh] bg-[linear-gradient(#444_2px,transparent_2px),linear-gradient(90deg,#444_2px,transparent_2px)] bg-[size:100px_100px] origin-bottom shadow-[inset_0_100px_100px_rgba(9,9,11,1)]"
            style={{ transform: 'rotateX(75deg) translateY(50%)' }}
          />
          {/* Flickering fluorescent light */}
          <div className="absolute top-0 w-full h-[30vh] bg-zinc-600 opacity-20 blur-3xl animate-[flicker_3s_infinite]" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent flex items-center justify-center">
             <div className="text-[15vw] font-bold text-zinc-800/40 tracking-tighter uppercase blur-sm whitespace-nowrap rotate-[-10deg]">SYNERGY </div>
          </div>
        </div>
      );
    case 'aesthetic':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }} 
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} 
            className="w-[150vw] h-[150vw] bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 blur-[150px] rounded-full opacity-20" 
          />
          <div className="absolute inset-0 backdrop-blur-[50px] bg-white/5 mix-blend-overlay" />
          <motion.div 
            animate={{ y: [0, -20, 0] }} 
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent opacity-80" 
          />
        </div>
      );
    case 'cosmic':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex items-center justify-center">
          {/* Black hole singularity */}
          <motion.div 
            animate={{ scale: [1, 1.1, 0.9, 1], rotate: 360 }} 
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }} 
            className="absolute w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full border-[20px] border-purple-900/40 border-t-fuchsia-500/80 border-r-fuchsia-500/20 blur-[10px]"
          />
          <motion.div 
            animate={{ scale: [0.9, 1.2, 0.9] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
            className="absolute w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] rounded-full bg-black shadow-[0_0_150px_100px_rgba(120,0,255,0.4)] z-10"
          />
          {/* Moving starfield */}
          <motion.div 
            animate={{ scale: [1, 1.5], opacity: [0, 1, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMzAwIiBjeT0iMjAwIiByPSIxIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMzUwIiByPSIxLjUiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-50 bg-[length:200px_200px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.5], opacity: [0, 1, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 2.5 }}
            className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48Y2lyY2xlIGN4PSIyMDAiIGN4PSI1MCIgY3k9IjI1MCIgcj0iMiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMSIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjM1MCIgY3k9IjE1MCIgcj0iMS41IiBmaWxsPSIjZmZmIi8+PC9zdmc+')] opacity-30 bg-[length:300px_300px] rotate-45" 
          />
        </div>
      );
    case 'rapid_fire':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none flex items-center justify-center">
          <motion.div 
            animate={{ opacity: [0, 0.4, 0] }} 
            transition={{ duration: 0.2, repeat: Infinity, ease: "linear", repeatType: "mirror" }} 
            className="absolute inset-0 bg-yellow-500 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] mix-blend-overlay scale-150 animate-pulse opacity-20"></div>
          {/* Warning chevrons */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(202,138,4,0.1)_40px,rgba(202,138,4,0.1)_80px)] opacity-50 z-10" />
        </div>
      );
    case 'trick':
      return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
          <motion.div 
             animate={{ height: ["0vh", "3vh", "0vh"], opacity: [0, 0.8, 0], y: ["0vh", "100vh"] }} 
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
             className="w-full bg-green-500/20 mix-blend-screen shadow-[0_0_20px_rgba(34,197,94,0.5)] z-20"
          />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15)_0px,rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)] bg-[size:100%_2px] z-10" />
        </div>
      );
    default:
      return null;
  }
};

export default function NPCStatCardApp() {
  const [gameState, setGameState] = useState<'select' | 'intro' | 'quiz' | 'calculating' | 'result' | 'collection'>('select');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userName, setUserName] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finalRole, setFinalRole] = useState<string | null>(null);
  const [secondaryRole, setSecondaryRole] = useState<string | null>(null);

  const activeQuiz = QUIZZES.find(q => q.id === activeQuizId);

  const selectQuiz = (id: string) => {
    let finalId = id;
    if (Math.random() < 0.15 && id !== 'trick') {
      finalId = 'trick'; // 15% chance to hijack with routine calibration
    }
    setActiveQuizId(finalId);
    const quiz = QUIZZES.find(q => q.id === finalId);
    if(quiz) {
      const initialScores: Record<string, number> = {};
      Object.keys(quiz.roles).forEach(key => initialScores[key] = 0);
      setScores(initialScores);
    }
    setGameState('intro');
  };

  const handleStart = () => {
    if (!userName.trim()) return;
    setGameState('quiz');
  };

  const handleAnswer = (points: Record<string, number>, forceEnd?: boolean) => {
    setScores(prev => {
      const newScores = { ...prev };
      for (const [role, pts] of Object.entries(points)) {
        if(newScores[role] !== undefined) newScores[role] += pts;
        else newScores[role] = pts;
      }
      return newScores;
    });

    setCurrentQuestionIdx(prev => {
      if (forceEnd) {
        setGameState('calculating');
        return prev;
      }
      if (activeQuiz && prev < activeQuiz.questions.length - 1) {
        return prev + 1;
      } else {
        setGameState('calculating');
        return prev;
      }
    });
  };

  // Process calculating state
  React.useEffect(() => {
    if (gameState === 'calculating' && activeQuiz) {
      const timeoutId = setTimeout(() => {
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        let winningRole = sorted[0]?.[0] || 'BACKGROUND_EXTRA';
        let secRole = null;
        
        if (sorted.length > 1 && sorted[0][1] - sorted[1][1] <= 2 && sorted[1][1] > 0) {
          secRole = sorted[1][0];
        }
        
        setFinalRole(winningRole);
        setSecondaryRole(secRole);
        setGameState('result');
        
        try {
          const unlockedStr = localStorage.getItem('unlockedCards');
          const unlocked = unlockedStr ? JSON.parse(unlockedStr) : [];
          let updated = false;
          
          if (!unlocked.includes(winningRole)) {
            unlocked.push(winningRole);
            updated = true;
          }
          
          if (updated) {
            localStorage.setItem('unlockedCards', JSON.stringify(unlocked));
          }
        } catch (e) {
          console.error('Could not access localStorage', e);
        }
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [gameState, activeQuiz, scores]);

  const restartQuiz = () => {
    if(!activeQuiz) return;
    const initialScores: Record<string, number> = {};
    Object.keys(activeQuiz.roles).forEach(key => initialScores[key] = 0);
    setScores(initialScores);
    setCurrentQuestionIdx(0);
    setFinalRole(null);
    setSecondaryRole(null);
    setUserName('');
    setGameState('intro');
  };

  const backToSelect = () => {
    setActiveQuizId(null);
    setFinalRole(null);
    setSecondaryRole(null);
    setUserName('');
    setGameState('select');
  };

  return (
    <main className="min-h-[100dvh] w-screen bg-grid-white relative flex flex-col items-center justify-start p-4 overflow-x-hidden overflow-y-auto pt-16 sm:pt-4">
      <QuizVibeBackground quizId={activeQuizId} gameState={gameState} />
      <div className="absolute inset-0 noise-bg pointer-events-none"></div>

      {gameState !== 'select' && (
        <button 
          onClick={backToSelect}
          className="absolute top-4 left-4 z-50 text-cyan-500 hover:text-cyan-400 font-mono text-sm flex items-center bg-black/40 px-3 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-md transition-all"
        >
          <List className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">CHANGE MODULE</span>
          <span className="sm:hidden">MENU</span>
        </button>
      )}

      <AnimatePresence mode="wait">
        {gameState === 'select' && (
          <QuizSelectScreen key="select" onSelect={selectQuiz} onViewCollection={() => setGameState('collection')} />
        )}

        {gameState === 'collection' && (
          <CollectionScreen key="collection" />
        )}

        {gameState === 'intro' && activeQuiz && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            className="z-10 flex flex-col items-center max-w-xl text-center space-y-8 my-auto"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 border border-cyan-500/50 bg-cyan-500/10 px-3 py-1 rounded-full text-cyan-400 font-mono text-xs sm:text-sm mb-2 sm:mb-4">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>WARNING: TRUTH PROTOCOL INITIATED</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-glow-cyan uppercase">
                {activeQuiz.title}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl font-mono text-cyan-200/70 tracking-widest uppercase">
                {activeQuiz.subtitle}
              </p>
            </div>
            
            <p className="text-zinc-400 text-sm sm:text-lg max-w-md px-4">
              {activeQuiz.description}
            </p>

            <div className="flex flex-col items-center w-full max-w-sm space-y-6 pt-4">
              <input
                type="text"
                maxLength={20}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter Entity Name..."
                className="w-full bg-transparent border-b-2 border-cyan-500/30 text-center text-white text-2xl pb-2 focus:outline-none focus:border-cyan-400 transition-colors font-mono placeholder:text-zinc-700 uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userName.trim()) handleStart();
                }}
                suppressHydrationWarning
                autoComplete="off"
                data-1p-ignore
              />
              <button 
                onClick={handleStart}
                disabled={!userName.trim()}
                className="group relative w-full py-4 bg-cyan-500 text-black font-bold font-mono text-xl uppercase tracking-wider overflow-hidden rounded-sm hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:not-disabled:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center justify-center">
                  Initialize Connect <ChevronRight className="ml-2 w-5 h-5 group-hover:not-disabled:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'quiz' && activeQuiz && (
          activeQuiz.type === 'rapid-fire' ? (
            <RapidFireQuizScreen
              key={`rapid-fire-quiz-${currentQuestionIdx}`}
              question={activeQuiz.questions[currentQuestionIdx]}
              progress={(currentQuestionIdx / activeQuiz.questions.length) * 100}
              onAnswer={handleAnswer}
            />
          ) : activeQuiz.type === 'trick' ? (
            <TrickQuizScreen
              key={`trick-quiz-${currentQuestionIdx}`}
              question={activeQuiz.questions[currentQuestionIdx]}
              progress={(currentQuestionIdx / activeQuiz.questions.length) * 100}
              onAnswer={handleAnswer}
            />
          ) : (
            <QuizScreen 
              key={`quiz-${currentQuestionIdx}`}
              question={activeQuiz.questions[currentQuestionIdx]} 
              progress={(currentQuestionIdx / activeQuiz.questions.length) * 100}
              onAnswer={handleAnswer} 
            />
          )
        )}

        {gameState === 'calculating' && (
          <TerminalCalculationScreen key="calc" />
        )}

        {gameState === 'result' && finalRole && activeQuiz && (
          <ResultScreen 
            key="result" 
            roleDef={activeQuiz.roles[finalRole]} 
            secondaryRoleDef={secondaryRole ? activeQuiz.roles[secondaryRole] : null}
            quizName={activeQuiz.title}
            quizId={activeQuiz.id}
            userName={userName} 
            onRestart={restartQuiz} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function QuizSelectScreen({ onSelect, onViewCollection }: { onSelect: (id: string) => void, onViewCollection: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="z-10 flex flex-col items-center w-full max-w-5xl py-4 sm:py-8 pt-10 sm:pt-8 my-auto"
    >
      <div className="text-center mb-8 sm:mb-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-cyan-500/20 blur-[80px] sm:blur-[100px] rounded-full point-events-none"></div>
        <h1 className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-glow-cyan uppercase mb-2 sm:mb-3 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] px-4">
          REALITY CHECK
        </h1>
        <p className="relative text-cyan-200/50 text-[10px] sm:text-xs md:text-sm font-mono tracking-[0.2em] sm:tracking-[0.3em] uppercase">
          Select Evaluation Module
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full px-4 sm:px-6">
        {QUIZZES.filter(q => !q.hidden).map((quiz, i) => (
          <motion.button
            key={quiz.id}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(quiz.id)}
            className="group relative flex flex-col items-start text-left p-5 sm:p-6 bg-black/40 border border-cyan-500/20 hover:border-cyan-400 rounded-xl overflow-hidden backdrop-blur-xl shadow-md transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
          >
            {/* Hover light effect */}
            <div className="absolute -inset-24 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl z-0"></div>
            
            {/* Subtle animated border line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 w-full transform -translate-x-full group-hover:translate-x-full duration-1000 ease-in-out"></div>
            
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-center mb-3">
                <div className="text-cyan-500 font-mono text-[10px] sm:text-xs tracking-widest border border-cyan-500/30 px-2 py-0.5 rounded">
                  Mod // 0{i+1}
                </div>
                <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                  <List className="w-3 h-3" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mb-1 uppercase tracking-tight group-hover:text-glow-cyan transition-all">{quiz.title}</h3>
              <p className="text-cyan-400/80 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest mb-2 sm:mb-3 border-b border-white/10 pb-2 w-full">{quiz.subtitle}</p>
              <p className="text-zinc-400 text-[11px] sm:text-xs leading-relaxed line-clamp-2">{quiz.description}</p>
              
              <div className="mt-3 sm:mt-4 flex items-center text-[10px] font-mono text-cyan-500/70 group-hover:text-cyan-400 transition-colors uppercase">
                <span className="mr-2">Initialize Sequence</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
        onClick={onViewCollection}
        className="mt-8 sm:mt-12 px-6 sm:px-8 py-3 bg-zinc-900/50 border border-zinc-700 hover:border-fuchsia-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-fuchsia-400 font-mono text-xs sm:text-sm uppercase tracking-widest rounded-lg flex items-center gap-3 transition-all group shadow-md"
      >
        <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-fuchsia-500 group-hover:animate-pulse"></span>
        View Card Collection
      </motion.button>
    </motion.div>
  );
}

function RapidFireQuizScreen({ question, progress, onAnswer }: { question: Question, progress: number, onAnswer: (p: any) => void }) {
  const [timeLeft, setTimeLeft] = React.useState(3000);
  const answeredRef = React.useRef(false);
  
  React.useEffect(() => {
    answeredRef.current = false;
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

function TrickQuizScreen({ question, progress, onAnswer }: { question: Question, progress: number, onAnswer: (p: any, forceEnd?: boolean) => void }) {
  const answeredRef = React.useRef(false);
  const [glitch, setGlitch] = React.useState(false);
  const [ticker, setTicker] = React.useState("0000");

  const [dangerHover, setDangerHover] = React.useState(false);
  
  React.useEffect(() => {
    answeredRef.current = false;
    const interval = setInterval(() => {
      // safe random number string (use local var, not React state during render)
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
      
      {/* Dynamic tracking lines to cursor if hovering near button */}
      {dangerHover && (
         <div className="fixed inset-0 pointer-events-none z-40 bg-red-900/10 animate-pulse"></div>
      )}

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
              <span className="text-[10px] md:text-xs tracking-tighter">DO NOT PRESS<br/>THIS BUTTON</span>
            </div>
         </motion.button>
         {dangerHover && (
             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-red-500 text-[10px] uppercase font-black tracking-widest animate-pulse">
                Violation of Protocol!
             </div>
         )}
      </div>

      <div className="w-full h-1 bg-zinc-800 mb-8 rounded-none overflow-hidden relative">
        <motion.div 
          className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
        <div className="absolute right-0 top-0 text-[8px] text-green-500 leading-none">SYS_MEM_{ticker}</div>
      </div>

      <div className={`space-y-8 relative z-10 ${glitch ? 'translate-x-1 -translate-y-0.5 skew-x-2 drop-shadow-[2px_0_0_rgba(255,0,0,0.5)]' : ''} transition-all duration-75`}>
        <div className="flex justify-between items-end border-b border-green-900/50 pb-2 mb-6">
           <div className="text-green-500 text-xs uppercase tracking-widest opacity-70">
             Terminal_Interface v2.4 <br/>
             <span className="opacity-50 text-[10px]">Active Calibration: DO_NOT_DEVIATE</span>
           </div>
           <div className="text-green-500 text-xs opacity-50 text-right">
             PID: {ticker} <br/>
             VOLTAGE: NORMAL
           </div>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-2xl font-normal leading-relaxed text-green-400 mb-8 lowercase max-w-2xl">
          {'> '} {question.text}
          <span className="animate-pulse bg-green-400 w-2 h-4 inline-block ml-1 align-middle"></span>
        </h2>
        <div className="space-y-3">
          {question.answers.map((ans, i) => (
            <motion.button
              key={i}
              whileHover={{ x: 10, backgroundColor: "rgba(20,83,45, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (answeredRef.current) return;
                answeredRef.current = true;
                onAnswer(ans.points);
              }}
              className="w-full text-left p-3 sm:p-4 border border-green-900/30 bg-black/60 backdrop-blur-sm rounded-none text-green-500 hover:text-green-300 hover:border-green-500 transition-all uppercase tracking-widest text-xs sm:text-sm grid grid-cols-[auto_1fr] items-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-green-500/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              <span className="text-green-700 group-hover:text-green-400 mr-4 self-start opacity-70">[{i + 1}]</span>
              <span className="relative z-10">{ans.text}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function QuizScreen({ question, progress, onAnswer }: { question: Question, progress: number, onAnswer: (p: any) => void }) {
  const answeredRef = React.useRef(false);

  React.useEffect(() => {
    answeredRef.current = false;
  }, [question]);

  if (!question) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="z-10 w-full max-w-2xl px-4 my-auto pt-16 sm:pt-0"
    >
      <div className="w-full h-1 bg-zinc-800 mb-12 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-white mb-8">
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
              className="w-full text-left p-4 sm:p-6 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-cyan-500/50 rounded-lg text-sm sm:text-lg text-zinc-300 hover:text-white transition-all font-mono"
            >
              <span className="text-cyan-500/50 mr-4">[{String.fromCharCode(65 + i)}]</span>
              {ans.text}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TerminalCalculationScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const messages = [
      "INITIALIZING DEEP SCAN...",
      "FETCHING SOCIAL MEDIA FOOTPRINT...",
      "ANALYZING AWKWARD ENCOUNTERS...",
      "CALCULATING AURA POINTS...",
      "WARNING: CRINGE LEVELS DETECTED...",
      "CROSS-REFERENCING GLOBAL NPC DATABASE...",
      "ASSIGNING SIMULATION ROLE..."
    ];
    
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < messages.length) {
        setLogs(prev => [...prev, messages[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 400);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="z-10 flex flex-col items-start w-full max-w-lg font-mono bg-black/60 p-6 rounded-lg border border-cyan-500/30 mx-4 my-auto"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <div className="text-cyan-400 tracking-widest animate-pulse font-bold">
          SYSTEM_PROCESSING
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-zinc-400 w-full min-h-[200px]">
        {logs.map((log, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start ${index === logs.length - 1 ? 'text-cyan-300' : ''}`}
          >
            <span className="text-zinc-600 mr-2">{`>`}</span>
            <span>{log}</span>
          </motion.div>
        ))}
        {logs.length < 7 && (
          <motion.div 
            animate={{ opacity: [1, 0, 1] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-3 h-4 bg-cyan-400 inline-block ml-3 mt-1"
          />
        )}
      </div>
    </motion.div>
  );
}

function ResultScreen({ roleDef, secondaryRoleDef, quizName, quizId, userName, onRestart }: { roleDef: RoleDef, secondaryRoleDef: RoleDef | null, quizName: string, quizId: string, userName: string, onRestart: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardId] = useState(() => Math.random().toString(36).substring(7).toUpperCase());

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { damping: 30, stiffness: 200 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { damping: 30, stiffness: 200 });
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [100, 0]), { damping: 30, stiffness: 200 });
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [100, 0]), { damping: 30, stiffness: 200 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  let containerAnim: any = { opacity: 1, x: 0, y: 0 };
  let cardInitial: any = { y: 0, scale: 1, rotateZ: 0, rotateX: 0, opacity: 0 };
  let cardAnim: any = { y: 0, scale: 1, rotateZ: 0, rotateX: 0, opacity: 1 };
  let cardTransition: any = { duration: 0.5, ease: "easeOut" };

  switch (quizId) {
    case 'npc':
      containerAnim = { opacity: 1 };
      cardInitial = { opacity: 0, scale: 0.9, filter: 'blur(10px)' };
      cardAnim = { opacity: 1, scale: 1, filter: 'blur(0px)' };
      cardTransition = { duration: 0.5, ease: "easeOut", delay: 0.2 };
      break;
    case 'liability':
      containerAnim = { 
        opacity: 1,
        x: [0, -20, 20, -10, 10, -5, 5, 0],
        y: [0, 20, -20, 10, -10, 5, -5, 0]
      };
      cardInitial = { y: -1000, rotateZ: -15, scale: 1.5, opacity: 1 };
      cardAnim = { y: 0, rotateZ: 0, scale: 1, opacity: 1 };
      cardTransition = { type: "spring", stiffness: 150, damping: 12, mass: 2, delay: 0.2 };
      break;
    case 'brainrot':
      containerAnim = { opacity: 1 };
      cardInitial = { scale: 0.1, rotateZ: 1080, opacity: 1 };
      cardAnim = { scale: 1, rotateZ: 0, opacity: 1 };
      cardTransition = { type: "spring", stiffness: 60, damping: 20, mass: 0.5, delay: 0.1 };
      break;
    case 'corp':
      containerAnim = { opacity: 1 };
      cardInitial = { y: 500, opacity: 0 };
      cardAnim = { y: 0, opacity: 1 };
      cardTransition = { duration: 1.5, ease: "easeOut", delay: 0.2 };
      break;
    case 'aesthetic':
      containerAnim = { opacity: 1 };
      cardInitial = { y: 20, opacity: 0, scale: 0.95 };
      cardAnim = { y: 0, opacity: 1, scale: 1 };
      cardTransition = { duration: 1.5, ease: "easeOut", delay: 0.5 };
      break;
    case 'cosmic':
    default:
      containerAnim = { 
        opacity: 1,
        x: [0, -15, 15, -10, 10, -5, 5, 0],
        y: [0, 15, -15, 10, -10, 5, -5, 0]
      };
      cardInitial = { y: -1000, rotateZ: 75, rotateX: 45, scale: 0.2, opacity: 1 };
      cardAnim = { y: 0, rotateZ: 0, rotateX: 0, scale: 1, opacity: 1 };
      cardTransition = { type: "spring", stiffness: 80, damping: 10, mass: 1.2, delay: 0.3 };
      break;
  }

  const captureCard = async () => {
    if (!cardRef.current) return;
    try {
      const currentTransform = cardRef.current.style.transform;
      cardRef.current.style.transform = 'none';
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1, pixelRatio: 2, style: { transform: 'none' } });
      cardRef.current.style.transform = currentTransform;

      const link = document.createElement('a');
      link.download = `stat-card-${userName.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to export image', e);
      alert("Failed to export image.");
    }
  };

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Stat Card',
          text: `Module: ${quizName} | Result: ${roleDef.title}. What's yours?`,
          url: window.location.href,
        });
      } catch (err) {
        console.warn('Share failed', err);
      }
    } else {
      captureCard();
    }
  };

  const getFoilClass = (rarity: string) => {
    switch(rarity) {
      case 'mythic': return 'mythic-foil';
      case 'abyssal': return 'abyssal-foil';
      case 'legendary': return 'gold-foil';
      case 'epic': return 'epic-foil';
      case 'rare': return 'rare-foil';
      case 'glitched': return 'glitch-foil';
      case 'common':
      default: return 'common-foil';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={containerAnim}
      transition={{ 
        duration: 0.6, 
        delay: 0.25, 
        ease: "easeInOut" 
      }}
      className="z-10 flex flex-col items-center w-full max-w-sm px-4 relative my-auto mt-16 sm:mt-auto"
    >
      <div className="mb-6 text-center z-10">
        <motion.h3 
          initial={{ opacity: 0, y: -20, scale: 2 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="text-zinc-500 font-mono text-sm uppercase tracking-widest mb-2 shadow-black drop-shadow-md"
        >
          Analysis Complete
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-white font-medium drop-shadow-lg"
        >
          {roleDef.resultText}
        </motion.p>
      </div>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        {(quizId === 'cosmic' || quizId === 'liability') && (
          <>
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 4, 8], opacity: [1, 0.8, 0] }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              className={`w-[300px] h-[300px] rounded-full blur-[60px] bg-gradient-to-t ${roleDef.theme}`}
            />
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 2, 4], opacity: [1, 0.5, 0] }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.25 }}
              className="absolute w-[200px] h-[200px] rounded-full blur-[40px] bg-white mix-blend-overlay"
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute inset-0 bg-white z-50 mix-blend-overlay"
            />
          </>
        )}
        {quizId === 'npc' && (
           <motion.div 
             initial={{ opacity: 1 }}
             animate={{ opacity: 0 }}
             transition={{ duration: 0.5, delay: 0.5 }}
             className="absolute inset-0 bg-green-500/20 z-50 mix-blend-color-dodge"
           />
        )}
        {quizId === 'brainrot' && (
           <motion.div 
             initial={{ opacity: 1, scale: 0 }}
             animate={{ opacity: 0, scale: 10 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="absolute w-20 h-20 bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] rounded-full blur-[20px]"
           />
        )}
      </div>

      <div className="w-full aspect-[3/4] perspective-[1000px] mb-8 relative z-20">        
        {/* Card wrapper */}
        <motion.div 
          initial={cardInitial}
          animate={cardAnim}
          transition={cardTransition}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            id="stat-card"
            ref={cardRef}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className={`w-full h-full relative rounded-2xl border-2 bg-gradient-to-b ${roleDef.theme} p-4 sm:p-6 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-md ${roleDef.rarity === 'glitched' ? 'glitch-anim' : ''}`}
          >
            {roleDef.rarity === 'legendary' && <div className="bg-starburst z-0"></div>}

          <motion.div 
            className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-60"
            style={{ background: useTransform([glareX, glareY], ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.8) 0%, transparent 60%)`) }}
          />

          <div className="absolute inset-0 card-noise z-10" />
          <div className={`absolute inset-0 ${getFoilClass(roleDef.rarity)} z-10`} />
          
          <div className="relative z-30 h-full flex flex-col" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className={`p-2 sm:p-3 rounded-lg bg-black/40 border border-white/10 shadow-lg ${roleDef.textClass}`}>
                {roleDef.icon}
              </div>
              <div className="text-right">
                <div className="text-[10px] sm:text-xs font-mono text-white/50 tracking-widest uppercase">Entity: {userName.substring(0, 15)}</div>
                <div className={`text-xs font-mono font-bold ${roleDef.textClass}`}>
                  {roleDef.subtitle}
                  {secondaryRoleDef && <><br/>Hybrid: {secondaryRoleDef.title}</>}
                </div>
                <div className="text-[8px] sm:text-[9px] font-mono text-white/30 uppercase tracking-widest mt-0.5">{quizName}</div>
              </div>
            </div>

            <div className="mb-3 sm:mb-4">
              <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none mb-2 ${roleDef.textClass}`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {roleDef.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans drop-shadow-md bg-black/20 p-2 rounded-md border border-white/5">
                {roleDef.description}
              </p>
            </div>
            
            {secondaryRoleDef && (
              <div className="mb-2 sm:mb-3">
                <div className="text-[9px] text-white/50 uppercase font-mono mb-1 tracking-widest">Detected Anomalies:</div>
                <div className={`text-[9px] sm:text-[10px] font-bold ${secondaryRoleDef.textClass} bg-black/40 p-1.5 sm:p-2 rounded border border-white/10 shadow-inner`}>
                  Traces of [{secondaryRoleDef.title}]: {secondaryRoleDef.passive}
                </div>
              </div>
            )}

            <div className="flex-grow"></div>

            <div className="space-y-2 sm:space-y-3 bg-black/60 p-3 sm:p-4 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
              {roleDef.stats.map((stat, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] sm:text-xs font-mono uppercase tracking-widest">
                    <span className="text-white/80">{stat.label}</span>
                    <span className="text-white font-bold">{stat.val}/100</span>
                  </div>
                  {/* Progress bar container */}
                  <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden border border-black shadow-inner">
                    {/* The fill bar */}
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.val}%` }}
                      transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: "easeOut" }}
                      className={`h-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)] rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 bg-black/40 rounded-lg border border-white/10 flex flex-col shadow-md">
              <span className="text-[9px] text-white/50 uppercase font-mono mb-1 tracking-widest">Passive Ability</span>
              <span className={`text-xs sm:text-sm font-bold ${roleDef.textClass} drop-shadow-md`}>{roleDef.passive}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-end text-[8px] sm:text-[9px] font-mono text-white/50">
              <div className="flex flex-col gap-1">
                <span>SYSTEM v3.0 // {roleDef.rarity.toUpperCase()}</span>
                <span>ID: {cardId}</span>
              </div>
              <div className="tracking-tighter text-sm opacity-60 flex right-0">
                █║▌│█│║▌║││█║▌
              </div>
            </div>
            
          </div>
        </motion.div>
      </motion.div>
    </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="flex w-full gap-2 mt-2 z-10"
      >
        <button 
          onClick={captureCard}
          className="flex-1 py-3 bg-white text-black font-bold uppercase rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          <Download className="w-4 h-4" /> Save
        </button>
        <button 
          onClick={shareCard}
          className="flex-1 py-3 bg-cyan-500 text-black font-bold uppercase rounded-lg hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(34,211,238,0.2)]"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button 
          onClick={onRestart}
          className="py-3 px-4 bg-zinc-800 text-white font-bold uppercase rounded-lg hover:bg-zinc-700 transition-colors text-sm border border-zinc-600 shadow-md"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}

function CollectionScreen() {
  const [unlockedCards, setUnlockedCards] = React.useState<string[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const unlocked = JSON.parse(localStorage.getItem('unlockedCards') || '[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnlockedCards(unlocked);
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
    
    const timeoutId = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const allCards = React.useMemo(() => {
    let cards: { quizId: string, quizTitle: string, roleId: string, role: RoleDef }[] = [];
    QUIZZES.forEach(quiz => {
      Object.entries(quiz.roles).forEach(([roleId, role]) => {
        cards.push({ quizId: quiz.id, quizTitle: quiz.title, roleId, role });
      });
    });
    
    // Rarity map for sorting and styling
    const rarityOrder: Record<string, number> = { 
      'common': 1, 
      'rare': 2, 
      'epic': 3, 
      'legendary': 4, 
      'mythic': 5, 
      'abyssal': 6, 
      'glitched': 7 
    };
    
    return cards.sort((a, b) => rarityOrder[b.role.rarity as keyof typeof rarityOrder] - rarityOrder[a.role.rarity as keyof typeof rarityOrder]);
  }, []);

  const getFoilClass = (rarity: string) => {
    switch(rarity) {
      case 'mythic': return 'mythic-foil';
      case 'abyssal': return 'abyssal-foil';
      case 'legendary': return 'gold-foil';
      case 'epic': return 'epic-foil';
      case 'rare': return 'rare-foil';
      case 'glitched': return 'glitch-foil';
      case 'common':
      default: return 'common-foil';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10';
      case 'rare': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'epic': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'legendary': return 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]';
      case 'mythic': return 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse';
      case 'abyssal': return 'text-red-600 border-red-600 bg-red-900/20 shadow-[0_0_30px_rgba(220,38,38,0.5)]';
      case 'glitched': return 'text-green-400 border-green-500/50 bg-green-500/10 shadow-[0_0_25px_rgba(34,197,94,0.4)] mix-blend-screen';
      default: return 'text-white border-white/20 bg-white/5';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="z-10 w-full max-w-6xl w-full pb-10 pt-16 sm:pt-20 flex flex-col items-center px-2 sm:px-4 flex-1"
    >
      <div className="text-center mb-0 mt-4 sm:mt-8 shrink-0">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-glow-cyan uppercase mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          Card Codex
        </h1>
        <p className="text-zinc-400 font-mono text-xs sm:text-sm uppercase tracking-widest mb-4">
          Unlocked: {isMounted ? unlockedCards.length : 0} / {allCards.length}
        </p>
      </div>

      <div className="flex-1 w-full p-2 sm:p-4 rounded-xl border border-white/5 bg-black/40 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {allCards.map((card, i) => {
            const isUnlocked = unlockedCards.includes(card.roleId);
            const displayTitle = isUnlocked ? card.role.title : '???';
            const displayDescription = isUnlocked ? card.role.description : 'Undiscovered anomaly. Take more tests to unlock this entity.';
            const displayPassive = isUnlocked ? card.role.passive : '???';
            
            return (
              <motion.div
                key={`${card.quizId}-${card.roleId}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
                className={`relative flex flex-col p-4 rounded-xl border ${
                  isUnlocked 
                    ? `bg-gradient-to-b ${card.role.theme.split(' ')[0]} ${card.role.theme.split(' ')[1] || 'to-zinc-900/80'} ${getRarityColor(card.role.rarity)}`
                    : 'bg-black border-white/5 text-zinc-600'
                } backdrop-blur-xl overflow-hidden transition-all duration-300 ${isUnlocked ? 'cursor-pointer group shadow-lg' : 'opacity-70 grayscale'}`}
              >
                {isUnlocked && <div className="absolute inset-0 card-noise z-0"></div>}
                {isUnlocked && <div className={`absolute inset-0 ${getFoilClass(card.role.rarity)} opacity-50 z-0`}></div>}
                {isUnlocked && <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-0"></div>}
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg border ${isUnlocked ? 'bg-black/50 border-white/10' : 'bg-black border-white/5'}`}>
                      {isUnlocked ? card.role.icon : <div className="w-8 h-8 flex items-center justify-center text-zinc-700 font-black">?</div>}
                    </div>
                    <div className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${isUnlocked ? `bg-black/60 border ${getRarityColor(card.role.rarity)}` : 'bg-white/5 text-zinc-500 border-white/10'}`}>
                      {card.role.rarity}
                    </div>
                  </div>
                  
                  <h3 className={`text-lg font-black uppercase tracking-tight mb-1 ${isUnlocked ? card.role.textClass : 'text-zinc-500'} drop-shadow-md`}>
                    {displayTitle}
                  </h3>
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
                    Origin: {card.quizTitle}
                  </div>
                  
                  <p className={`text-xs line-clamp-4 mb-4 flex-1 drop-shadow ${isUnlocked ? 'text-white/80' : 'text-zinc-600 italic font-mono'}`}>
                    {displayDescription}
                  </p>
  
                  <div className="mt-auto bg-black/40 p-2 rounded border border-white/5">
                    <div className="text-[8px] text-white/30 uppercase font-mono mb-1 tracking-widest">Passive Ability</div>
                    <div className={`text-[10px] font-bold ${isUnlocked ? card.role.textClass : 'text-zinc-500'}`}>{displayPassive}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Required style for valid rendering, no imports needed */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.2);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
          }
        }
        @media (max-width: 767px) {
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .custom-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}} />
    </motion.div>
  );
}
