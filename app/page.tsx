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
                <div key={i} className="matrix-drop" style={{ left: `${i * 5}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${2 + Math.random() * 3}s` }}>
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
    default:
      return null;
  }
};

export default function NPCStatCardApp() {
  const [gameState, setGameState] = useState<'select' | 'intro' | 'quiz' | 'calculating' | 'result'>('select');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userName, setUserName] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finalRole, setFinalRole] = useState<string | null>(null);
  const [secondaryRole, setSecondaryRole] = useState<string | null>(null);

  const activeQuiz = QUIZZES.find(q => q.id === activeQuizId);

  const selectQuiz = (id: string) => {
    setActiveQuizId(id);
    const quiz = QUIZZES.find(q => q.id === id);
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

  const handleAnswer = (points: Record<string, number>) => {
    setScores(prev => {
      const newScores = { ...prev };
      for (const [role, pts] of Object.entries(points)) {
        if(newScores[role] !== undefined) newScores[role] += pts;
      }
      return newScores;
    });

    if (activeQuiz && currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    setGameState('calculating');
    setTimeout(() => {
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      let winningRole = sorted[0]?.[0] || 'BACKGROUND_EXTRA';
      let secRole = null;
      
      if (sorted.length > 1 && sorted[0][1] - sorted[1][1] <= 2 && sorted[1][1] > 0) {
        secRole = sorted[1][0];
      }
      
      setFinalRole(winningRole);
      setSecondaryRole(secRole);
      setGameState('result');
    }, 3000);
  };

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
    <main className="h-[100dvh] w-screen bg-grid-white relative flex flex-col items-center justify-center p-4 overflow-hidden">
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
          <QuizSelectScreen key="select" onSelect={selectQuiz} />
        )}

        {gameState === 'intro' && activeQuiz && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            className="z-10 flex flex-col items-center max-w-xl text-center space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 border border-cyan-500/50 bg-cyan-500/10 px-3 py-1 rounded-full text-cyan-400 font-mono text-sm mb-4">
                <AlertTriangle className="w-4 h-4" />
                <span>WARNING: TRUTH PROTOCOL INITIATED</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-glow-cyan uppercase">
                {activeQuiz.title}
              </h1>
              <p className="text-xl md:text-2xl font-mono text-cyan-200/70 tracking-widest uppercase">
                {activeQuiz.subtitle}
              </p>
            </div>
            
            <p className="text-zinc-400 text-lg max-w-md">
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
          <QuizScreen 
            key="quiz"
            question={activeQuiz.questions[currentQuestionIdx]} 
            progress={(currentQuestionIdx / activeQuiz.questions.length) * 100}
            onAnswer={handleAnswer} 
          />
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

function QuizSelectScreen({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="z-10 flex flex-col items-center w-full max-w-5xl py-8"
    >
      <div className="text-center mb-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full point-events-none"></div>
        <h1 className="relative text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-glow-cyan uppercase mb-3 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          REALITY CHECK
        </h1>
        <p className="relative text-cyan-200/50 text-xs md:text-sm font-mono tracking-[0.3em] uppercase">
          Select Evaluation Module
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full px-4">
        {QUIZZES.map((quiz, i) => (
          <motion.button
            key={quiz.id}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(quiz.id)}
            className="group relative flex flex-col items-start text-left p-6 bg-black/40 border border-cyan-500/20 hover:border-cyan-400 rounded-xl overflow-hidden backdrop-blur-xl shadow-md transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
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
              <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight group-hover:text-glow-cyan transition-all">{quiz.title}</h3>
              <p className="text-cyan-400/80 text-[10px] font-mono uppercase tracking-widest mb-3 border-b border-white/10 pb-2 w-full">{quiz.subtitle}</p>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed line-clamp-2">{quiz.description}</p>
              
              <div className="mt-4 flex items-center text-[10px] font-mono text-cyan-500/70 group-hover:text-cyan-400 transition-colors uppercase">
                <span className="mr-2">Initialize Sequence</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function QuizScreen({ question, progress, onAnswer }: { question: Question, progress: number, onAnswer: (p: any) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="z-10 w-full max-w-2xl px-4"
    >
      <div className="w-full h-1 bg-zinc-800 mb-12 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-white mb-8">
          {question.text}
        </h2>
        <div className="space-y-4">
          {question.answers.map((ans, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAnswer(ans.points)}
              className="w-full text-left p-6 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-cyan-500/50 rounded-lg text-lg text-zinc-300 hover:text-white transition-all font-mono"
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
      className="z-10 flex flex-col items-start w-full max-w-lg font-mono bg-black/60 p-6 rounded-lg border border-cyan-500/30 mx-4"
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
      className="z-10 flex flex-col items-center w-full max-w-sm px-4 relative"
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
            className={`w-full h-full relative rounded-2xl border-2 bg-gradient-to-b ${roleDef.theme} p-6 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-md ${roleDef.rarity === 'glitched' ? 'glitch-anim' : ''}`}
          >
            {roleDef.rarity === 'legendary' && <div className="bg-starburst z-0"></div>}

          <motion.div 
            className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-60"
            style={{ background: useTransform([glareX, glareY], ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.8) 0%, transparent 60%)`) }}
          />

          <div className={`absolute inset-0 ${getFoilClass(roleDef.rarity)} z-10`}></div>
          
          <div className="relative z-30 h-full flex flex-col" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg bg-black/40 border border-white/10 shadow-lg ${roleDef.textClass}`}>
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

            <div className="mb-4">
              <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none mb-2 ${roleDef.textClass}`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {roleDef.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans drop-shadow-md bg-black/20 p-2 rounded-md border border-white/5">
                {roleDef.description}
              </p>
            </div>
            
            {secondaryRoleDef && (
              <div className="mb-3">
                <div className="text-[9px] text-white/50 uppercase font-mono mb-1 tracking-widest">Detected Anomalies:</div>
                <div className={`text-[10px] sm:text-xs font-bold ${secondaryRoleDef.textClass} bg-black/40 p-2 rounded border border-white/10 shadow-inner`}>
                  Traces of [{secondaryRoleDef.title}]: {secondaryRoleDef.passive}
                </div>
              </div>
            )}

            <div className="flex-grow"></div>

            <div className="space-y-3 bg-black/60 p-4 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
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
