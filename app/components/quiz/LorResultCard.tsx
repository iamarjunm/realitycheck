'use client';

import React from 'react';
import { motion } from 'motion/react';
import type { RoleDef } from '../../../lib/quizzes';

export function LorResultCard({
  roleDef,
  userName,
  cardId,
  quizName,
  compact = false,
}: {
  roleDef: RoleDef;
  userName: string;
  cardId: string;
  quizName?: string;
  compact?: boolean;
}) {
  const isApproved = roleDef.title === 'THE LITERAL SAVIOR' || roleDef.title === 'THE PHANTOM DEV';
  const lorVerdict = isApproved ? 'LOR GRANTED' : 'LOR DENIED';

  return (
    <div
      className={`relative z-30 h-full flex flex-col ${compact ? 'p-2' : 'p-3 sm:p-4'}`}
      style={{ transform: 'translateZ(35px)' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <div
          className={`rounded-lg bg-black/40 border border-white/10 shadow-lg ${roleDef.textClass} ${
            compact ? 'p-1.5' : 'p-2 sm:p-3'
          }`}
        >
          {roleDef.icon}
        </div>
        <div className="text-right">
          <div
            className={`font-mono text-white/50 tracking-widest uppercase ${
              compact ? 'text-[7px]' : 'text-[9px] sm:text-[10px]'
            }`}
          >
            Intern: {userName.substring(0, 12)}
          </div>
          <div className={`font-mono font-bold ${roleDef.textClass} ${compact ? 'text-[8px]' : 'text-xs'}`}>
            {roleDef.subtitle}
          </div>
          {quizName && (
            <div className={`font-mono text-white/30 uppercase mt-0.5 ${compact ? 'text-[7px]' : 'text-[8px]'}`}>
              {quizName}
            </div>
          )}
        </div>
      </div>

      {/* Title block */}
      <div className="mb-2 sm:mb-3">
        <h2
          className={`font-black uppercase tracking-tighter leading-none ${roleDef.textClass} ${
            compact ? 'text-lg' : 'text-2xl sm:text-3xl'
          }`}
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
        >
          {roleDef.title}
        </h2>
        <p
          className={`text-white/85 leading-snug font-sans bg-black/30 rounded border border-white/10 mt-1.5 ${
            compact ? 'text-[8px] p-1.5' : 'text-xs sm:text-sm p-2'
          }`}
        >
          {roleDef.description}
        </p>
      </div>

      {/* LOR verdict badge */}
      <div
        className={`mb-2 sm:mb-3 text-center font-black uppercase tracking-widest border-2 rounded ${
          isApproved
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
            : 'bg-red-950/60 border-red-500/50 text-red-400'
        } ${compact ? 'py-1 text-[9px]' : 'py-2 text-xs sm:text-sm'}`}
      >
        {lorVerdict}
      </div>

      <div className="flex-grow" />

      {/* Stats */}
      <div
        className={`space-y-1.5 sm:space-y-2 bg-black/60 rounded-xl border border-white/10 backdrop-blur-md ${
          compact ? 'p-2' : 'p-3 sm:p-4'
        }`}
      >
        {roleDef.stats.map((stat, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="flex justify-between font-mono uppercase tracking-wider">
              <span className={`text-white/75 ${compact ? 'text-[7px]' : 'text-[9px] sm:text-[10px]'}`}>
                {stat.label}
              </span>
              <span className={`text-white font-bold ${compact ? 'text-[7px]' : 'text-[9px] sm:text-[10px]'}`}>
                {stat.val}
              </span>
            </div>
            <div className="h-1 w-full bg-zinc-800/80 rounded-full overflow-hidden border border-black/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stat.val, 100)}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.35)]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Passive */}
      <div
        className={`mt-2 bg-black/40 rounded-lg border border-white/10 ${compact ? 'p-1.5' : 'p-2 sm:p-3'}`}
      >
        <span
          className={`text-white/45 uppercase font-mono tracking-widest block mb-0.5 ${
            compact ? 'text-[6px]' : 'text-[8px]'
          }`}
        >
          Passive
        </span>
        <span className={`font-bold ${roleDef.textClass} ${compact ? 'text-[8px]' : 'text-xs sm:text-sm'}`}>
          {roleDef.passive}
        </span>
      </div>

      {/* Footer */}
      <div
        className={`mt-2 pt-2 border-t border-white/15 flex justify-between items-end font-mono text-white/45 ${
          compact ? 'text-[6px]' : 'text-[8px] sm:text-[9px]'
        }`}
      >
        <div>
          <span className="block uppercase">{roleDef.rarity}</span>
          <span>ID:{cardId}</span>
        </div>
        <span className="uppercase tracking-tighter opacity-60">Collectible · 1/1</span>
      </div>
    </div>
  );
}
