'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, AlertTriangle, List } from 'lucide-react';
import { QUIZZES } from '../lib/quizzes';
import {
  QuizVibeBackground,
  QuizSelectScreen,
  RapidFireQuizScreen,
  TrickQuizScreen,
  QuizScreen,
  TerminalCalculationScreen,
  ResultScreen,
  CollectionScreen,
} from './components/quiz-screens';

export default function NPCStatCardApp() {
  const [gameState, setGameState] = useState<'select' | 'intro' | 'quiz' | 'calculating' | 'result' | 'collection'>('select');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userName, setUserName] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finalRole, setFinalRole] = useState<string | null>(null);
  const [secondaryRole, setSecondaryRole] = useState<string | null>(null);

  const activeQuiz = QUIZZES.find((q) => q.id === activeQuizId);

  const selectQuiz = (id: string) => {
    let finalId = id;
    if (Math.random() < 0.15 && id !== 'trick') {
      finalId = 'trick';
    }
    setActiveQuizId(finalId);
    setCurrentQuestionIdx(0);
    setFinalRole(null);
    setSecondaryRole(null);
    setUserName('');

    const quiz = QUIZZES.find((q) => q.id === finalId);
    if (quiz) {
      const initialScores: Record<string, number> = {};
      Object.keys(quiz.roles).forEach((key) => {
        initialScores[key] = 0;
      });
      setScores(initialScores);
    }
    setGameState('intro');
  };

  const handleStart = () => {
    if (!userName.trim()) return;
    setGameState('quiz');
  };

  const handleAnswer = (points: Record<string, number>, forceEnd?: boolean) => {
    setScores((prev) => {
      const newScores = { ...prev };
      for (const [role, pts] of Object.entries(points)) {
        if (newScores[role] !== undefined) newScores[role] += pts;
        else newScores[role] = pts;
      }
      return newScores;
    });

    setCurrentQuestionIdx((prev) => {
      if (forceEnd) {
        setGameState('calculating');
        return prev;
      }
      if (activeQuiz && prev < activeQuiz.questions.length - 1) {
        return prev + 1;
      }
      setGameState('calculating');
      return prev;
    });
  };

  React.useEffect(() => {
    if (gameState === 'calculating' && activeQuiz) {
      const timeoutId = setTimeout(() => {
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const winningRole = sorted[0]?.[0] || 'BACKGROUND_EXTRA';
        let secRole: string | null = null;

        if (sorted.length > 1 && sorted[0][1] - sorted[1][1] <= 2 && sorted[1][1] > 0) {
          secRole = sorted[1][0];
        }

        setFinalRole(winningRole);
        setSecondaryRole(secRole);
        setGameState('result');

        try {
          const unlockedStr = localStorage.getItem('unlockedCards');
          const unlocked = unlockedStr ? JSON.parse(unlockedStr) : [];
          if (!unlocked.includes(winningRole)) {
            unlocked.push(winningRole);
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
    if (!activeQuiz) return;
    const initialScores: Record<string, number> = {};
    Object.keys(activeQuiz.roles).forEach((key) => {
      initialScores[key] = 0;
    });
    setScores(initialScores);
    setCurrentQuestionIdx(0);
    setFinalRole(null);
    setSecondaryRole(null);
    setUserName('');
    setGameState('intro');
  };

  const backToSelect = () => {
    setActiveQuizId(null);
    setCurrentQuestionIdx(0);
    setScores({});
    setFinalRole(null);
    setSecondaryRole(null);
    setUserName('');
    setGameState('select');
  };

  return (
    <main className="min-h-[100dvh] w-screen bg-grid-white relative flex flex-col items-center justify-start p-4 overflow-x-hidden overflow-y-auto pt-16 sm:pt-4">
      <QuizVibeBackground quizId={activeQuizId} gameState={gameState} />
      <div className="absolute inset-0 noise-bg pointer-events-none" />

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
        {gameState === 'select' && <QuizSelectScreen key="select" onSelect={selectQuiz} onViewCollection={() => setGameState('collection')} />}

        {gameState === 'collection' && <CollectionScreen key="collection" />}

        {gameState === 'intro' && activeQuiz && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            className="z-10 flex flex-col items-center max-w-xl text-center space-y-8 my-auto"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 border border-cyan-500/50 bg-cyan-500/10 px-3 py-1 rounded-full text-cyan-400 font-mono text-xs sm:text-sm mb-2 sm:mb-4">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>WARNING: TRUTH PROTOCOL INITIATED</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-glow-cyan uppercase">{activeQuiz.title}</h1>
              <p className="text-lg sm:text-xl md:text-2xl font-mono text-cyan-200/70 tracking-widest uppercase">{activeQuiz.subtitle}</p>
            </div>

            <p className="text-zinc-400 text-sm sm:text-lg max-w-md px-4">{activeQuiz.description}</p>

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
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:not-disabled:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center justify-center">
                  Initialize Connect <ChevronRight className="ml-2 w-5 h-5 group-hover:not-disabled:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'quiz' &&
          activeQuiz &&
          (activeQuiz.type === 'rapid-fire' ? (
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
              quizId={activeQuiz.id}
              question={activeQuiz.questions[currentQuestionIdx]}
              progress={(currentQuestionIdx / activeQuiz.questions.length) * 100}
              onAnswer={handleAnswer}
            />
          ))}

        {gameState === 'calculating' && <TerminalCalculationScreen key="calc" />}

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
