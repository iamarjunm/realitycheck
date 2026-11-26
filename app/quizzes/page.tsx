'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
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
      className={`min-h-[100dvh] w-full relative flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto bg-[#0c0b0e] atelier-bg text-[#f5f0e6] ${
        gameState === 'select' ? 'p-0' : 'p-4 pt-16 sm:pt-4'
      }`}
    >
      {(gameState === 'select' || gameState === 'intro') && (
        <div className="atelier-grain pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      )}

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
          className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 bg-[#141219]/92 hover:bg-[#1e1a26] border border-[#e6c27a]/35 hover:border-[#e6c27a]/70 text-[#f5f0e6] hover:text-[#e6c27a] px-3.5 py-2 rounded-lg text-xs font-semibold backdrop-blur-md transition-all shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#e6c27a]" />
          <span className="hidden sm:inline">Quiz Menu</span>
          <span className="sm:hidden">Menu</span>
        </button>
      )}

      <AnimatePresence mode="wait">
        {gameState === 'select' && (
          <div key="select" className="relative z-10 flex-1 w-full min-h-[calc(100dvh-60px)] [transform:translateZ(0)]">
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="z-10 w-full max-w-lg my-auto"
          >
            <div className="atelier-card relative rounded-2xl bg-[#141219]/95 border border-[#e6c27a]/30 p-6 sm:p-8 backdrop-blur-md shadow-[0_28px_75px_rgba(0,0,0,0.72)] overflow-hidden">
              {/* Top Burnished Gold / Crimson Lacquer Rule */}
              <div
                className={`pointer-events-none absolute top-0 left-0 right-0 h-[2px] ${
                  activeQuiz.id === 'lor'
                    ? 'bg-gradient-to-r from-[#e6c27a] via-[#d99242] to-transparent'
                    : 'bg-gradient-to-r from-[#d9383a] via-[#e6c27a] to-transparent'
                }`}
              />

              {/* Subtle Decorative Brass Corner Brackets */}
              <span className="pointer-events-none absolute top-3 left-3 w-3 h-3 border-t border-l border-[#e6c27a]/45" />
              <span className="pointer-events-none absolute top-3 right-3 w-3 h-3 border-t border-r border-[#e6c27a]/45" />
              <span className="pointer-events-none absolute bottom-3 left-3 w-3 h-3 border-b border-l border-[#e6c27a]/45" />
              <span className="pointer-events-none absolute bottom-3 right-3 w-3 h-3 border-b border-r border-[#e6c27a]/45" />

              {/* Dossier Header & Wax Seal Crest */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1d1720] border border-[#e6c27a]/25 font-mono text-[11px] uppercase tracking-wider">
                  <AlertTriangle
                    className={`w-3.5 h-3.5 ${
                      activeQuiz.id === 'lor' ? 'text-[#e6c27a]' : 'text-[#d9383a]'
                    }`}
                  />
                  <span className={activeQuiz.id === 'lor' ? 'text-[#e6c27a]' : 'text-[#f29d9e]'}>
                    {activeQuiz.id === 'lor' ? 'LOR Evaluation Pipeline' : 'Classified Dossier'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-br from-[#8c2023] to-[#561114] border border-[#e6c27a]/35 text-[#f7e1b5] font-mono text-[10px] uppercase tracking-wider shadow">
                  <ShieldCheck className="w-3 h-3 text-[#e6c27a]" />
                  <span>Sealed</span>
                </div>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f5f0e6] mb-1">
                {activeQuiz.title}
              </h1>
              <p className="font-serif italic text-sm text-[#e6c27a] mb-5">
                {activeQuiz.subtitle}
              </p>

              <p className="text-sm text-[#bfb5a6] leading-relaxed mb-5 pb-5 border-b border-[#e6c27a]/15">
                {activeQuiz.description}
              </p>

              {activeQuiz.id === 'lor' && (
                <div className="font-mono text-xs text-[#e6c27a] bg-[#211910]/85 border border-[#e6c27a]/30 rounded-lg px-3.5 py-2.5 mb-5">
                  1. Tap dossier · 2. Founder DM · 3. Collectible card
                </div>
              )}

              <div className="space-y-3.5">
                <label
                  className="block font-mono text-[11px] uppercase tracking-[0.14em] text-[#c7b9a4]"
                  htmlFor="quiz-entity-name"
                >
                  {activeQuiz.id === 'lor' ? 'Legal name for LOR' : 'Subject name or callsign'}
                </label>
                <input
                  id="quiz-entity-name"
                  type="text"
                  maxLength={20}
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  placeholder={activeQuiz.id === 'lor' ? 'e.g. Alex Chen' : 'e.g. Operator_01'}
                  className="w-full rounded-xl bg-[#0d0c11] border border-[#e6c27a]/25 focus:border-[#e6c27a] px-4 py-3 text-sm text-[#f5f0e6] placeholder:text-[#6f665c] focus:outline-none transition-colors shadow-inner"
                  onKeyDown={(event) => { if (event.key === 'Enter' && userName.trim()) handleStart(); }}
                  suppressHydrationWarning
                  autoComplete="off"
                  data-1p-ignore
                />
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!userName.trim()}
                  className="btn-brass w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-display font-bold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>{activeQuiz.id === 'lor' ? 'Begin Evaluation' : 'Execute Diagnostic'}</span>
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
