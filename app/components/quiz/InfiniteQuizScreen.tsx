"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import type { Question } from '../../../lib/quizzes';

type AbyssMemoryEntry = {
  question: string;
  answer: string;
  depth: number;
  tier: number;
};

const endButtonCopies = [
  'Are you really tapping out already?',
  'You can still leave if you want.',
  'The abyss is disappointed in you.',
  'Please do not go yet.',
  'Leaving now will be awkward.',
  'If you stop now, it wins.',
];

export function InfiniteQuizScreen({
  questions,
  currentDepth,
  progress,
  questionSeed = 0,
  onAnswer,
  onStopDescending,
}: {
  questions: Question[];
  currentDepth: number;
  progress: number;
  questionSeed?: number;
  onAnswer: (p: Record<string, number>, forceEnd?: boolean) => void;
  onStopDescending: () => void;
}) {
  const answeredRef = useRef(false);
  const recentQuestionIdsRef = useRef<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [sanity, setSanity] = useState(100);
  const [memoryEntries, setMemoryEntries] = useState<AbyssMemoryEntry[]>([]);
  const [memoryRevision, setMemoryRevision] = useState(0);
  const [echoLine, setEchoLine] = useState<string | null>(null);

  const depthTier = Math.min(Math.floor(currentDepth / 4), 5);
  const endButtonCopy = endButtonCopies[Math.min(depthTier, endButtonCopies.length - 1)] ?? endButtonCopies[0];

  const questionsByTier = useMemo(() => {
    const buckets: Question[][] = Array.from({ length: 6 }, () => [] as Question[]);

    for (const question of questions) {
      const tier = Math.min(Math.max(question.depth ?? 0, 0), 5);
      buckets[tier].push(question);
    }

    return buckets;
  }, [questions]);

  useEffect(() => {
    answeredRef.current = false;

    const tierPool = questionsByTier[depthTier];
    const fallbackPool = questionsByTier.flat();
    const sourcePool = tierPool.length > 0 ? tierPool : fallbackPool.length > 0 ? fallbackPool : questions;
    const filteredPool = sourcePool.filter((question) => !recentQuestionIdsRef.current.includes(question.id));
    const activePool = filteredPool.length > 0 ? filteredPool : sourcePool;
    const nextQuestion = activePool[Math.floor(Math.random() * activePool.length)] ?? null;

    setCurrentQuestion(nextQuestion);
    setPulseKey((value) => value + 1);

    if (nextQuestion) {
      recentQuestionIdsRef.current = [nextQuestion.id, ...recentQuestionIdsRef.current].slice(0, 5);
    }

    if (memoryEntries.length > 0 && Math.random() < Math.min(0.85, 0.25 + depthTier * 0.12)) {
      const latestMemory = memoryEntries[Math.floor(Math.random() * memoryEntries.length)];
      const templates = [
        `Earlier you chose "${latestMemory.answer}". The abyss kept that note.`,
        `It remembers when you said "${latestMemory.answer}". It enjoyed the honesty.`,
        `You already admitted "${latestMemory.answer}" once. It is still thinking about it.`,
        `The last thing it learned from you was "${latestMemory.question}". It has not forgotten.`,
      ];
      setEchoLine(templates[Math.floor(Math.random() * templates.length)]);
    } else {
      setEchoLine(null);
    }
  }, [currentDepth, depthTier, memoryEntries, memoryRevision, questionSeed, questions, questionsByTier]);

  const handleChoice = (answer: Question['answers'][number]) => {
    if (!currentQuestion || answeredRef.current) return;
    answeredRef.current = true;

    const depthGain = Math.max(0, answer.points.depth ?? 0);
    const sanityLoss = Math.max(1, answer.points.sanity ?? Math.max(2, depthGain * 4 + depthTier));

    setSanity((previousSanity) => Math.max(0, previousSanity - sanityLoss));
    setMemoryEntries((previousMemory) => [
      {
        question: currentQuestion.text,
        answer: answer.text,
        depth: currentDepth,
        tier: depthTier,
      },
      ...previousMemory,
    ].slice(0, 6));
    setMemoryRevision((value) => value + 1);
    onAnswer(answer.points);
  };

  if (!currentQuestion) return null;

  const sanityState = sanity > 70 ? 'steady' : sanity > 40 ? 'wobbling' : sanity > 15 ? 'fraying' : 'barely holding together';
  const sanityBarClass = sanity > 70 ? 'from-cyan-400 via-emerald-300 to-cyan-200' : sanity > 40 ? 'from-amber-400 via-orange-300 to-amber-200' : 'from-rose-500 via-fuchsia-500 to-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      className="relative z-10 w-full max-w-2xl px-3 sm:px-4 my-auto pt-10 sm:pt-0"
    >
      <div className="absolute inset-0 -z-10 rounded-[1.75rem] border border-white/10 bg-black/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.28)]" />

      <div className="space-y-4 rounded-[1.75rem] p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/40">
              <span>Sanity Meter</span>
              <span>{sanityState}</span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/50">
              <motion.div
                animate={{ x: sanity < 25 ? [0, -2, 2, -1, 1, 0] : 0 }}
                transition={{ duration: 0.4, repeat: sanity < 25 ? Infinity : 0, repeatType: 'mirror' }}
                className="h-full w-full"
              >
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${sanityBarClass} shadow-[0_0_18px_rgba(248,113,113,0.45)]`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${sanity}%` }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              </motion.div>
            </div>
            <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-white/35">
              {sanity > 70
                ? 'You still seem fine.'
                : sanity > 40
                  ? 'You are starting to feel it.'
                  : sanity > 15
                    ? 'That look is not reassuring.'
                    : 'Something in here is clearly off.'}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/40">
              <span>Memory</span>
              <span>{memoryEntries.length} echoes</span>
            </div>
            <div className="space-y-2 text-[12px] sm:text-sm text-white/75">
              {echoLine && (
                <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2 font-mono text-[11px] text-cyan-100/90 leading-relaxed">
                  {echoLine}
                </div>
              )}
              {memoryEntries.slice(0, 2).map((entry, index) => (
                <div key={`${entry.depth}-${index}`} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 font-mono text-[11px] text-white/70">
                  <div className="mt-1 line-clamp-2">{entry.question}</div>
                  <div className="mt-1 text-cyan-200/80">{entry.answer}</div>
                </div>
              ))}
              {memoryEntries.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 font-mono text-[11px] text-white/40">
                  It has not learned anything yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 text-center sm:text-left">
          <h2 className="text-xl font-black leading-snug tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.12)] sm:text-2xl md:text-3xl">
            {currentQuestion.text}
          </h2>
        </div>

        <div className="grid gap-4">
          {currentQuestion.answers.map((answer, index) => {
            const depthGain = Math.max(0, answer.points.depth ?? 0);
            const sanityLoss = Math.max(1, answer.points.sanity ?? Math.max(2, depthGain * 4 + depthTier));

            return (
              <motion.button
                key={`${currentQuestion.id}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChoice(answer)}
                className="group w-full rounded-2xl border border-white/10 bg-black/35 p-3.5 text-left font-mono text-sm text-white/80 transition-all hover:border-cyan-400/40 hover:bg-black/55 hover:text-white sm:p-4 sm:text-base"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-[10px] font-bold text-cyan-200 transition-colors group-hover:bg-cyan-400/15">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-[9px] uppercase tracking-[0.3em] text-white/30">Choice {index + 1}</div>
                    <div className="leading-snug sm:leading-relaxed">{answer.text}</div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStopDescending}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left font-mono text-sm uppercase tracking-[0.22em] text-white/80 transition-all hover:border-white/25 hover:bg-white/10"
            style={{ opacity: Math.max(0.55, 1 - depthTier * 0.08) }}
          >
            <ChevronUp className="mr-2 inline-block h-4 w-4" />
            <span className="block text-base font-black tracking-[0.2em]">{endButtonCopy}</span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-white/45">
              End Quiz
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
