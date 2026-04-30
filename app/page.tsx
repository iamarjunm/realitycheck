'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, AlertTriangle, List } from 'lucide-react';
import { QUIZZES } from '../lib/quizzes';
import {
  QuizVibeBackground,
  QuizSelectScreen,
  RapidFireQuizScreen,
  TrickQuizScreen,
  QuizScreen,
  InfiniteQuizScreen,
  TerminalCalculationScreen,
  ResultScreen,
  CollectionScreen,
} from './components/quiz-screens';

export default function NPCStatCardApp() {
  const [gameState, setGameState] = useState<'select' | 'intro' | 'quiz' | 'calculating' | 'result' | 'collection'>('select');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [abyssQuestionSeed, setAbyssQuestionSeed] = useState(0);
  const [userName, setUserName] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finalRole, setFinalRole] = useState<string | null>(null);
  const [secondaryRole, setSecondaryRole] = useState<string | null>(null);

  const activeQuiz = QUIZZES.find((quiz) => quiz.id === activeQuizId);

  const selectQuiz = (id: string) => {
    let finalId = id;
    if (Math.random() < 0.15 && id !== 'trick') {
      finalId = 'trick';
    }

    const quiz = QUIZZES.find((entry) => entry.id === finalId);
    const initialScores: Record<string, number> = {};

    if (quiz) {
      Object.keys(quiz.roles).forEach((key) => {
        initialScores[key] = 0;
      });
    }

    setActiveQuizId(finalId);
    setCurrentQuestionIdx(0);
    setCurrentDepth(0);
    setAbyssQuestionSeed(0);
    setScores(initialScores);
    setFinalRole(null);
    setSecondaryRole(null);
    setUserName('');
    setGameState('intro');
  };

  const handleStart = () => {
    if (!userName.trim()) return;
    setGameState('quiz');
  };

  const handleAnswer = (points: Record<string, number>, forceEnd?: boolean) => {
    if (activeQuiz?.type === 'infinite') {
      if (forceEnd) {
        setGameState('calculating');
        return;
      }

      const depthGain = Math.max(0, Number(points.depth ?? 1));
      setCurrentDepth((previousDepth) => previousDepth + depthGain);
      setAbyssQuestionSeed((previousSeed) => previousSeed + 1);
      return;
    }

    setScores((previousScores) => {
      const updatedScores = { ...previousScores };
      for (const [role, pointsValue] of Object.entries(points)) {
        if (updatedScores[role] !== undefined) updatedScores[role] += pointsValue;
        else updatedScores[role] = pointsValue;
      }
      return updatedScores;
    });

    setCurrentQuestionIdx((previousIndex) => {
      if (forceEnd) {
        setGameState('calculating');
        return previousIndex;
      }

      if (activeQuiz && previousIndex < activeQuiz.questions.length - 1) {
        return previousIndex + 1;
      }

      setGameState('calculating');
      return previousIndex;
    });
  };

  const handleStopDescending = () => {
    setGameState('calculating');
  };

  const getAbyssRoleForDepth = (depth: number) => {
    const abyssRoles = ['ABYSS_0', 'ABYSS_1', 'ABYSS_2', 'ABYSS_3', 'ABYSS_4', 'ABYSS_5'];
    return abyssRoles[Math.min(Math.floor(depth / 4), abyssRoles.length - 1)] ?? 'ABYSS_0';
  };

  useEffect(() => {
    if (gameState !== 'calculating' || !activeQuiz) return;

    const timeoutId = setTimeout(() => {
      let winningRole = 'BACKGROUND_EXTRA';
      let secondaryWinningRole: string | null = null;

      if (activeQuiz.type === 'infinite') {
        winningRole = getAbyssRoleForDepth(currentDepth);
      } else {
        const sortedScores = Object.entries(scores).sort((left, right) => right[1] - left[1]);
        winningRole = sortedScores[0]?.[0] || 'BACKGROUND_EXTRA';

        if (sortedScores.length > 1 && sortedScores[0][1] - sortedScores[1][1] <= 2 && sortedScores[1][1] > 0) {
          secondaryWinningRole = sortedScores[1][0];
        }
      }

      setFinalRole(winningRole);
      setSecondaryRole(secondaryWinningRole);
      setGameState('result');

      try {
        const unlockedJson = localStorage.getItem('unlockedCards');
        const unlockedCards = unlockedJson ? JSON.parse(unlockedJson) : [];
        if (!unlockedCards.includes(winningRole)) {
          unlockedCards.push(winningRole);
          localStorage.setItem('unlockedCards', JSON.stringify(unlockedCards));
        }
      } catch (error) {
        console.error('Could not access localStorage', error);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [gameState, activeQuiz, scores, currentDepth]);

  const restartQuiz = () => {
    if (!activeQuiz) return;

    const initialScores: Record<string, number> = {};
    Object.keys(activeQuiz.roles).forEach((key) => {
      initialScores[key] = 0;
    });

    setScores(initialScores);
    setCurrentQuestionIdx(0);
    setCurrentDepth(0);
    setAbyssQuestionSeed(0);
    setFinalRole(null);
    setSecondaryRole(null);
    setUserName('');
    setGameState('intro');
  };

  const backToSelect = () => {
    setActiveQuizId(null);
    setCurrentQuestionIdx(0);
    setCurrentDepth(0);
    setAbyssQuestionSeed(0);
    setScores({});
    setFinalRole(null);
    setSecondaryRole(null);
    setUserName('');
    setGameState('select');
  };

  return (
    <main className="min-h-[100dvh] w-screen bg-grid-white relative flex flex-col items-center justify-start p-4 overflow-x-hidden overflow-y-auto pt-16 sm:pt-4">
      <QuizVibeBackground quizId={activeQuizId} gameState={gameState} abyssDepth={currentDepth} />
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
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, filter: 'blur(10px)' }} className="z-10 flex flex-col items-center max-w-xl text-center space-y-8 my-auto">
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
                onChange={(event) => setUserName(event.target.value)}
                placeholder="Enter Entity Name..."
                className="w-full bg-transparent border-b-2 border-cyan-500/30 text-center text-white text-2xl pb-2 focus:outline-none focus:border-cyan-400 transition-colors font-mono placeholder:text-zinc-700 uppercase"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && userName.trim()) handleStart();
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
            <RapidFireQuizScreen key={`rapid-fire-quiz-${currentQuestionIdx}`} question={activeQuiz.questions[currentQuestionIdx]} progress={(currentQuestionIdx / activeQuiz.questions.length) * 100} onAnswer={handleAnswer} />
          ) : activeQuiz.type === 'infinite' ? (
            <InfiniteQuizScreen key="infinite-quiz" questions={activeQuiz.questions} currentDepth={currentDepth} progress={Math.min(((currentDepth % 4) / 4) * 100, 100)} questionSeed={abyssQuestionSeed} onAnswer={handleAnswer} onStopDescending={handleStopDescending} />
          ) : activeQuiz.type === 'trick' ? (
            <TrickQuizScreen key={`trick-quiz-${currentQuestionIdx}`} question={activeQuiz.questions[currentQuestionIdx]} progress={(currentQuestionIdx / activeQuiz.questions.length) * 100} onAnswer={handleAnswer} />
          ) : (
            <QuizScreen key={`quiz-${currentQuestionIdx}`} quizId={activeQuiz.id} question={activeQuiz.questions[currentQuestionIdx]} progress={(currentQuestionIdx / activeQuiz.questions.length) * 100} onAnswer={handleAnswer} />
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
