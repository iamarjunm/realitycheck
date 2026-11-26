'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, AlertTriangle, ArrowLeft } from 'lucide-react';
import { QUIZZES } from '../../lib/quizzes';
import { clearLorSession } from '../../lib/lor-session';
import GlobalNav from '@/components/GlobalNav';
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
  LorNegotiatorScreen,
} from '../components/quiz-screens';

export default function QuizzesPage() {
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

  const selectQuiz = (id: string, options?: { force?: boolean }) => {
    let finalId = id;
    if (!options?.force && Math.random() < 0.15 && id !== 'trick') {
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('quiz');
    if (!quizId || gameState !== 'select') return;
    const directQuiz = QUIZZES.find((quiz) => quiz.id === quizId);
    if (!directQuiz) return;
    selectQuiz(quizId, { force: true });
  }, [gameState]);

  const handleStart = () => {
    if (!userName.trim()) return;
    if (activeQuizId === 'lor') clearLorSession();
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
        if (role.startsWith('__')) continue;
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

  const handleStopDescending = () => setGameState('calculating');

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
    if (activeQuiz.id === 'lor') clearLorSession();
    const initialScores: Record<string, number> = {};
    Object.keys(activeQuiz.roles).forEach((key) => { initialScores[key] = 0; });
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
    <main
      className={`min-h-[100dvh] w-full relative flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto bg-[#09090b] text-zinc-50 ${
        gameState === 'select' ? 'p-0' : 'p-4 pt-16 sm:pt-4'
      }`}
    >
      {gameState !== 'select' && (
        <QuizVibeBackground quizId={activeQuizId} gameState={gameState} abyssDepth={currentDepth} />
      )}

      {gameState === 'select' ? (
        <div className="w-full relative z-[60]">
          <GlobalNav activePortal="quizzes" />
        </div>
      ) : (
        <button
          type="button"
          onClick={backToSelect}
          className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-zinc-50 px-3.5 py-2 rounded-lg text-xs font-medium backdrop-blur-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quiz Menu</span>
          <span className="sm:hidden">Menu</span>
        </button>
      )}

      <AnimatePresence mode="wait">
        {gameState === 'select' && (
          <div key="select" className="relative flex-1 w-full min-h-[calc(100dvh-60px)] [transform:translateZ(0)]">
            <QuizSelectScreen
              onSelect={selectQuiz}
              onViewCollection={() => setGameState('collection')}
            />
          </div>
        )}

        {gameState === 'collection' && <CollectionScreen key="collection" />}

        {gameState === 'intro' && activeQuiz && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="z-10 w-full max-w-lg my-auto"
          >
            <div className="rounded-2xl bg-[#111113]/95 border border-zinc-800/90 p-6 sm:p-8 backdrop-blur-md">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-xs mb-5">
                <AlertTriangle
                  className={`w-3.5 h-3.5 ${
                    activeQuiz.id === 'lor' ? 'text-amber-400' : 'text-rose-400'
                  }`}
                />
                <span className={activeQuiz.id === 'lor' ? 'text-amber-400' : 'text-zinc-300'}>
                  {activeQuiz.id === 'lor' ? 'LOR Evaluation Pipeline' : 'Diagnostic Protocol'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 mb-1.5">
                {activeQuiz.title}
              </h1>
              <p className="font-mono text-xs text-zinc-500 mb-5">
                {activeQuiz.subtitle}
              </p>

              <p className="text-sm text-zinc-400 leading-relaxed mb-5 pb-5 border-b border-zinc-800/80">
                {activeQuiz.description}
              </p>

              {activeQuiz.id === 'lor' && (
                <div className="font-mono text-xs text-amber-400/90 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3.5 py-2.5 mb-5">
                  1. Tap dossier · 2. Founder DM · 3. Collectible card
                </div>
              )}

              <div className="space-y-3">
                <label className="block font-mono text-xs text-zinc-400" htmlFor="quiz-entity-name">
                  {activeQuiz.id === 'lor' ? 'Legal name for LOR' : 'Enter your name or handle'}
                </label>
                <input
                  id="quiz-entity-name"
                  type="text"
                  maxLength={20}
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  placeholder={activeQuiz.id === 'lor' ? 'e.g. Alex Chen' : 'e.g. Operator_01'}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 focus:border-zinc-500 px-3.5 py-3 text-sm text-zinc-50 placeholder:text-zinc-600 focus:outline-none transition-colors"
                  onKeyDown={(event) => { if (event.key === 'Enter' && userName.trim()) handleStart(); }}
                  suppressHydrationWarning
                  autoComplete="off"
                  data-1p-ignore
                />
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!userName.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>{activeQuiz.id === 'lor' ? 'Begin Evaluation' : 'Start Diagnostic'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'quiz' && activeQuiz && (
          activeQuiz.id === 'lor' ? (
            <LorNegotiatorScreen key="lor-negotiator" userName={userName} onAnswer={handleAnswer} />
          ) : activeQuiz.type === 'rapid-fire' ? (
            <RapidFireQuizScreen key={`rapid-fire-quiz-${currentQuestionIdx}`} question={activeQuiz.questions[currentQuestionIdx]} progress={(currentQuestionIdx / activeQuiz.questions.length) * 100} onAnswer={handleAnswer} />
          ) : activeQuiz.type === 'infinite' ? (
            <InfiniteQuizScreen key="infinite-quiz" questions={activeQuiz.questions} currentDepth={currentDepth} progress={Math.min(((currentDepth % 4) / 4) * 100, 100)} questionSeed={abyssQuestionSeed} onAnswer={handleAnswer} onStopDescending={handleStopDescending} />
          ) : activeQuiz.type === 'trick' ? (
            <TrickQuizScreen key={`trick-quiz-${currentQuestionIdx}`} question={activeQuiz.questions[currentQuestionIdx]} progress={(currentQuestionIdx / activeQuiz.questions.length) * 100} onAnswer={handleAnswer} />
          ) : (
            <QuizScreen key={`quiz-${currentQuestionIdx}`} quizId={activeQuiz.id} question={activeQuiz.questions[currentQuestionIdx]} progress={(currentQuestionIdx / activeQuiz.questions.length) * 100} onAnswer={handleAnswer} />
          )
        )}

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
