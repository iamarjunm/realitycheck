'use client';

import React from 'react';
import { motion } from 'motion/react';
import type { Question } from '../../../lib/quizzes';

type ProfileRole = 'THE_SHOWER_ARGUER' | 'THE_NOTIFICATION_HUNTER' | 'THE_PANIC_FLINCH' | 'THE_SCREEN_WARDEN';

const telemetryHints = [
  'Heats up when you hesitate.',
  'Keeps track of your mouse drift.',
  'Counts every tab switch you make.',
  'Reads the tiny pauses between your answers.',
];

function buildTelemetryPoints(hesitationMs: number, mouseMoves: number, tabSwitches: number) {
  const points: Record<ProfileRole, number> = {
    THE_SHOWER_ARGUER: 0,
    THE_NOTIFICATION_HUNTER: 0,
    THE_PANIC_FLINCH: 0,
    THE_SCREEN_WARDEN: 0,
  };

  if (hesitationMs > 3500) points.THE_SHOWER_ARGUER += 3;
  else if (hesitationMs > 2200) points.THE_SHOWER_ARGUER += 2;
  else if (hesitationMs > 1200) points.THE_SHOWER_ARGUER += 1;

  if (mouseMoves > 120) points.THE_SCREEN_WARDEN += 3;
  else if (mouseMoves > 70) points.THE_SCREEN_WARDEN += 2;
  else if (mouseMoves > 30) points.THE_SCREEN_WARDEN += 1;

  if (tabSwitches > 2) points.THE_NOTIFICATION_HUNTER += 3;
  else if (tabSwitches > 0) points.THE_NOTIFICATION_HUNTER += 2;

  if (hesitationMs > 1800 && mouseMoves > 55) points.THE_PANIC_FLINCH += 2;
  if (hesitationMs < 1000 && tabSwitches === 0 && mouseMoves < 20) points.THE_SCREEN_WARDEN += 1;

  return points;
}

export function WebsiteKnowsTooMuchScreen({
  question,
  progress,
  onAnswer,
}: {
  question: Question;
  progress: number;
  onAnswer: (points: Record<string, number>) => void;
}) {
  const answeredRef = React.useRef(false);
  const questionStartRef = React.useRef(Date.now());
  const mouseMovesRef = React.useRef(0);
  const tabSwitchesRef = React.useRef(0);

  React.useEffect(() => {
    answeredRef.current = false;
    questionStartRef.current = Date.now();
    mouseMovesRef.current = 0;
    tabSwitchesRef.current = 0;

    const onVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchesRef.current += 1;
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [question]);

  if (!question) return null;

  const handleAnswer = (points: Record<string, number>) => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    const hesitationMs = Date.now() - questionStartRef.current;
    const telemetryPoints = buildTelemetryPoints(hesitationMs, mouseMovesRef.current, tabSwitchesRef.current);
    onAnswer({
      ...points,
      __hesitationMs: hesitationMs,
      __mouseMoves: mouseMovesRef.current,
      __tabSwitches: tabSwitchesRef.current,
      ...telemetryPoints,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      onMouseMove={() => {
        mouseMovesRef.current += 1;
      }}
      className="relative z-10 w-full max-w-2xl px-4 my-auto pt-16 sm:pt-0"
    >
      <div className="w-full h-1 bg-zinc-800 mb-6 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-orange-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
      </div>

      <div className="mb-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-cyan-200/80 font-mono">
        {telemetryHints.map((hint, index) => (
          <span key={hint} className={index === 0 ? '' : 'ml-3'}>
            {hint}
          </span>
        ))}
      </div>

      <div className="space-y-8">
        <div className="rounded-2xl border border-white/10 bg-black/35 p-4 sm:p-5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
          Live signals: hesitation, mouse drift, tab switching
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-8 text-white">
          {question.text}
        </h2>

        <div className="space-y-4">
          {question.answers.map((answer, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(answer.points)}
              className="w-full text-left p-4 sm:p-6 border rounded-2xl text-sm sm:text-lg transition-all font-mono border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-cyan-400/50 text-zinc-200 hover:text-white"
            >
              <span className="text-cyan-400/60 font-black mr-4">[{String.fromCharCode(65 + index)}]</span>
              {answer.text}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}