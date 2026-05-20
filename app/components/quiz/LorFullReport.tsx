'use client';

import React from 'react';
import type { RoleDef } from '../../../lib/quizzes';
import type { LorSession } from '../../../lib/lor-session';
import { getIntakeAnswerLabel } from '../../../lib/lor-intake-steps';
import { LorResultCard } from './LorResultCard';

export function LorFullReport({
  roleDef,
  userName,
  cardId,
  session,
  quizName,
}: {
  roleDef: RoleDef;
  userName: string;
  cardId: string;
  session: LorSession;
  quizName: string;
}) {
  const isApproved = roleDef.title === 'THE LITERAL SAVIOR' || roleDef.title === 'THE PHANTOM DEV';
  const peerHighlights = [
    { label: 'Biggest contribution', value: getIntakeAnswerLabel('biggestContribution', session.intake.biggestContribution) },
    { label: 'Deserves LOR most', value: getIntakeAnswerLabel('deservesMost', session.intake.deservesMost) },
    { label: 'Does NOT deserve LOR', value: getIntakeAnswerLabel('doesNotDeserve', session.intake.doesNotDeserve) },
    { label: 'Rough moment', value: getIntakeAnswerLabel('sadMoment', session.intake.sadMoment) },
  ];

  return (
    <div className="lor-full-report w-[720px] bg-zinc-950 text-white font-sans p-8 pb-12">
      <div className="text-center border-b border-zinc-700 pb-4 mb-6">
        <p className="font-black tracking-[0.2em] text-[#e5c158] text-sm uppercase">Thriftz Marketplace LLP</p>
        <h1 className="font-black text-2xl uppercase tracking-tight mt-2">LOR Evaluation Report</h1>
        <p className="font-mono text-xs text-zinc-500 mt-1">
          REF {cardId} · {new Date(session.completedAt).toLocaleDateString()}
        </p>
      </div>

      <section className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Candidate</h2>
        <p className="text-lg font-bold">{userName}</p>
        <p className="text-sm font-mono mt-1">
          <span className={isApproved ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {isApproved ? 'LOR GRANTED' : 'LOR DENIED'}
          </span>
          {' — '}
          {roleDef.title}
        </p>
        <p className="text-xs text-zinc-400 mt-2">{roleDef.resultText}</p>
        <div className="flex gap-4 mt-3 text-[10px] font-mono uppercase text-zinc-500">
          <span>Founder vibe: {session.founderVibe}%</span>
          <span>Hubris: {session.hubris}%</span>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Collectible card</h2>
        <div className="w-[300px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden border-2 border-zinc-700 bg-gradient-to-b from-zinc-900 to-black">
          <LorResultCard roleDef={roleDef} userName={userName} cardId={cardId} quizName={quizName} compact />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 border-b border-zinc-800 pb-1">
          Team & contribution (your picks)
        </h2>
        <div className="grid grid-cols-1 gap-2">
          {peerHighlights.map((row) => (
            <div key={row.label} className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{row.label}</p>
              <p className="text-xs text-zinc-200">{row.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 border-b border-zinc-800 pb-1">
          Full intake dossier
        </h2>
        <div className="space-y-2">
          {session.intakeQA.map((row, i) => (
            <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded p-2.5">
              <p className="text-[9px] font-bold uppercase text-zinc-500">{row.question}</p>
              <p className="text-[11px] text-zinc-300 mt-0.5">{row.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 border-b border-zinc-800 pb-1">
          Founder negotiation transcript
        </h2>
        <div className="space-y-2 font-mono text-[10px]">
          {session.messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded border ${
                msg.sender === 'user'
                  ? 'bg-cyan-950/50 border-cyan-900/50 ml-6'
                  : 'bg-zinc-900 border-zinc-800 mr-6'
              }`}
            >
              <div className="text-zinc-500 mb-0.5">
                {msg.sender === 'user' ? userName : 'Arjun'}
                {msg.stageLabel ? ` · ${msg.stageLabel}` : ''}
              </div>
              <div className="text-zinc-200 whitespace-pre-wrap">{msg.text}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-10 pt-4 border-t border-zinc-800 text-center font-mono text-[9px] text-zinc-600 uppercase">
        Thriftz LOR Audit v3 · Collectible + dossier export
      </footer>
    </div>
  );
}
