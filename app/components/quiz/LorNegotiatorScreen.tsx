'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Terminal,
  ShieldAlert,
  AlertTriangle,
  MessageSquare,
  User,
  Heart,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  FileText,
} from 'lucide-react';
import { LOR_INTAKE_STEPS } from '../../../lib/lor-intake-steps';
import { intakeToQA } from '../../../lib/lor-intake-steps';
import type { LorIntakeAnswers, LorMessage } from '../../../lib/lor-session';
import { saveLorSession, clearLorSession } from '../../../lib/lor-session';
import { buildNegotiationStages, type NegotiationOption } from '../../../lib/lor-negotiation';
import { computeLorRoleScores, getPersonalizedOpening } from '../../../lib/lor-scoring';

const EMPTY_INTAKE: LorIntakeAnswers = {
  role: '',
  callsAttended: '',
  missedMeetingsPattern: '',
  peakActivity: '',
  biggestContribution: '',
  commitVolume: '',
  whatsappEngagement: '',
  helpedOthers: '',
  hoursPerWeek: '',
  productionMoment: '',
  biggestMistake: '',
  deservesMost: '',
  doesNotDeserve: '',
  sadMoment: '',
};

type Phase = 'intake' | 'negotiation' | 'audit';

export function LorNegotiatorScreen({
  userName,
  onAnswer,
}: {
  userName: string;
  onAnswer: (points: Record<string, number>, forceEnd?: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>('intake');
  const [intakeStep, setIntakeStep] = useState(0);
  const [intake, setIntake] = useState<LorIntakeAnswers>(EMPTY_INTAKE);
  const [intakeDraft, setIntakeDraft] = useState('');

  const [stage, setStage] = useState(0);
  const [founderVibe, setFounderVibe] = useState(50);
  const [hubris, setHubris] = useState(15);
  const [messages, setMessages] = useState<LorMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const negotiationStages = useMemo(() => buildNegotiationStages(intake), [intake]);
  const currentIntakeStep = LOR_INTAKE_STEPS[intakeStep];
  const intakeProgress = ((intakeStep + 1) / LOR_INTAKE_STEPS.length) * 100;

  useEffect(() => {
    clearLorSession();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, phase]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const startNegotiation = () => {
    const opening = getPersonalizedOpening(intake, userName);
    setPhase('negotiation');
    setStage(0);
    setIsTyping(true);
    setTimeout(() => {
      setMessages([
        {
          sender: 'founder',
          text: opening,
          time: now(),
          stageLabel: 'Opening',
        },
        {
          sender: 'founder',
          text:
            typeof negotiationStages[0].founderPrompt === 'function'
              ? negotiationStages[0].founderPrompt(intake)
              : negotiationStages[0].founderPrompt,
          time: now(),
          stageLabel: negotiationStages[0].label,
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleIntakeNext = () => {
    if (!currentIntakeStep || !intakeDraft) return;
    setIntake((prev) => ({ ...prev, [currentIntakeStep.id]: intakeDraft }));

    if (intakeStep >= LOR_INTAKE_STEPS.length - 1) {
      startNegotiation();
      return;
    }

    setIntakeStep((s) => s + 1);
    const next = LOR_INTAKE_STEPS[intakeStep + 1];
    setIntakeDraft(intake[next.id] ?? '');
  };

  const handleIntakeBack = () => {
    if (intakeStep === 0) return;
    const prev = intakeStep - 1;
    setIntakeStep(prev);
    setIntakeDraft(intake[LOR_INTAKE_STEPS[prev].id] ?? '');
  };

  useEffect(() => {
    if (phase !== 'intake' || !currentIntakeStep) return;
    setIntakeDraft(intake[currentIntakeStep.id] ?? '');
  }, [intakeStep, phase, currentIntakeStep, intake]);

  const appendFounder = (text: string, stageLabel?: string) => {
    setMessages((prev) => [...prev, { sender: 'founder', text, time: now(), stageLabel }]);
  };

  const handleSelectOption = (option: NegotiationOption) => {
    const current = negotiationStages[stage];
    const userMsg: LorMessage = { sender: 'user', text: option.text, time: now(), stageLabel: current?.label };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      return next;
    });

    const newVibe = Math.min(100, Math.max(0, founderVibe + option.vibeDelta));
    const newHubris = Math.min(100, Math.max(0, hubris + option.hubrisDelta));
    setFounderVibe(newVibe);
    setHubris(newHubris);

    setIsTyping(true);
    setTimeout(() => {
      const egoBoom = newHubris >= 90;
      const vibeKilled = newVibe <= 10;
      let reactionText = option.reaction;
      if (egoBoom) reactionText = 'This conversation is over. Your ego exceeded our cloud budget. No LOR.';
      if (vibeKilled) reactionText = "I'm done. You won't cooperate and the intake doesn't save you.";

      setMessages((prev) => {
        const withFounder = [...prev, { sender: 'founder' as const, text: reactionText, time: now(), stageLabel: current?.label }];
        if (egoBoom || vibeKilled) {
          setTimeout(() => runAuditPipeline(newVibe, newHubris, { messages: withFounder }), 1500);
        }
        return withFounder;
      });
      setIsTyping(false);

      if (egoBoom || vibeKilled) return;

      const nextStage = stage + 1;
      if (nextStage >= negotiationStages.length) {
        setMessages((prev) => {
          runAuditPipeline(newVibe, newHubris, { messages: prev });
          return prev;
        });
        return;
      }

      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          const next = negotiationStages[nextStage];
          const prompt =
            typeof next.founderPrompt === 'function' ? next.founderPrompt(intake) : next.founderPrompt;
          appendFounder(prompt, next.label);
          setStage(nextStage);
          setIsTyping(false);
        }, 1000);
      }, 700);
    }, 1200);
  };

  const runAuditPipeline = (
    finalVibe: number,
    finalHubris: number,
    snapshot?: { messages?: LorMessage[] }
  ) => {
    setPhase('audit');
    setShowSummary(true);

    const finalMessages = snapshot?.messages ?? messages;

    saveLorSession({
      userName,
      intake,
      intakeQA: intakeToQA(intake),
      messages: finalMessages,
      founderVibe: finalVibe,
      hubris: finalHubris,
      completedAt: new Date().toISOString(),
    });

    const logs = [
      'LOADING INTERN DOSSIER FROM INTAKE...',
      `CANDIDATE: ${userName.toUpperCase()}`,
      `CALLS ATTENDED: ${intake.callsAttended.toUpperCase()}`,
      `COMMIT VOLUME: ${intake.commitVolume.toUpperCase()}`,
      `WHATSAPP PROFILE: ${intake.whatsappEngagement.toUpperCase()}`,
      'CROSS-REFERENCING NEGOTIATION TRANSCRIPT...',
      `FOUNDER VIBE: ${finalVibe}%`,
      `HUBRIS INDEX: ${finalHubris}%`,
      'WEIGHTING INTAKE + DIALOGUE VECTORS...',
      'GENERATING LOR DECISION...',
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setAuditLog((prev) => [...prev, log]);
        if (index === logs.length - 1) {
          setTimeout(() => {
            const scores = computeLorRoleScores(intake, finalVibe, finalHubris);
            onAnswer(scores, true);
          }, 1400);
        }
      }, (index + 1) * 550);
    });
  };

  const currentStage = negotiationStages[stage];
  const canProceedIntake = !!intakeDraft;

  return (
    <div className="z-10 w-full max-w-3xl flex flex-col gap-3 px-2 sm:px-0">
      {/* Phase tabs */}
      <div className="flex gap-2 font-mono text-[10px] uppercase">
        {(['intake', 'negotiation', 'audit'] as Phase[]).map((p, i) => (
          <div
            key={p}
            className={`flex-1 py-2 px-3 rounded border text-center font-bold ${
              phase === p
                ? 'bg-[#8b5a2b]/30 border-[#8b5a2b] text-[#e5c158]'
                : i < ['intake', 'negotiation', 'audit'].indexOf(phase)
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-500'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600'
            }`}
          >
            {i + 1}. {p}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intake' && (
          <motion.div
            key="intake"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="lor-intake-panel bg-zinc-950 border-4 border-[#8b5a2b]/40 shadow-[8px_8px_0_rgba(139,90,43,0.25)] rounded overflow-hidden"
          >
            <div className="bg-[#1a1208] border-b border-[#8b5a2b]/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#e5c158]">
                <ClipboardList className="w-4 h-4" />
                <span className="font-black text-sm uppercase tracking-tight">Intern dossier — intake</span>
              </div>
              <span className="font-mono text-[10px] text-[#a27b5c]">
                {intakeStep + 1}/{LOR_INTAKE_STEPS.length}
              </span>
            </div>
            <div className="h-1 bg-zinc-900">
              <div className="h-full bg-[#8b5a2b] transition-all" style={{ width: `${intakeProgress}%` }} />
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <p className="text-white font-bold text-sm sm:text-base leading-snug">{currentIntakeStep?.question}</p>
                {currentIntakeStep?.hint && (
                  <p className="text-zinc-500 text-xs mt-1 font-mono">{currentIntakeStep.hint}</p>
                )}
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {currentIntakeStep?.type === 'select' && (
                  currentIntakeStep.options?.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setIntakeDraft(opt.value)}
                      className={`w-full text-left p-3 rounded border text-xs sm:text-sm transition-all ${
                        intakeDraft === opt.value
                          ? 'bg-[#8b5a2b]/20 border-[#8b5a2b] text-[#f5e6b8]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-[#8b5a2b]/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))
                )}

                {currentIntakeStep?.type === 'text' && (
                  <textarea
                    value={intakeDraft}
                    onChange={(e) => setIntakeDraft(e.target.value)}
                    placeholder={(currentIntakeStep?.hint) ?? ''}
                    className="w-full min-h-[120px] p-3 rounded border bg-zinc-900 border-zinc-800 text-sm text-zinc-200 resize-y focus:outline-none"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleIntakeBack}
                  disabled={intakeStep === 0}
                  className="px-4 py-3 bg-zinc-900 border border-zinc-700 rounded text-xs font-bold uppercase disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleIntakeNext}
                  disabled={!canProceedIntake}
                  className="flex-1 py-3 bg-[#8b5a2b] hover:bg-[#a27b5c] text-black font-black uppercase text-xs rounded flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {intakeStep >= LOR_INTAKE_STEPS.length - 1 ? (
                    <>
                      Begin negotiation <MessageSquare className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {(phase === 'negotiation' || phase === 'audit') && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-zinc-950 border-4 border-zinc-800 shadow-[8px_8px_0_rgba(0,0,0,0.5)] rounded flex flex-col h-[70vh] min-h-[480px] overflow-hidden text-zinc-200 font-mono"
          >
            <div className="bg-zinc-900 border-b-2 border-zinc-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm text-white">#lor-review / arjun (founder)</span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase">
                {currentStage?.label ?? 'Audit'}
              </span>
            </div>

            <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-2 grid grid-cols-2 gap-4 text-[10px] uppercase font-bold">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500 fill-red-500" /> Founder vibe
                  </span>
                  <span>{founderVibe}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${founderVibe}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-500" /> Hubris
                  </span>
                  <span>{hubris}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                  <div className="h-full bg-cyan-600 transition-all" style={{ width: `${hubris}%` }} />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 max-w-[90%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                      msg.sender === 'user' ? 'bg-cyan-950 border-cyan-800 text-cyan-400' : 'bg-amber-950 border-amber-800 text-amber-400'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : 'A'}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-zinc-500 flex gap-2">
                      <span>{msg.sender === 'user' ? userName : 'Arjun'}</span>
                      {msg.stageLabel && <span className="text-[#8b5a2b]">• {msg.stageLabel}</span>}
                    </div>
                    <div
                      className={`p-3 rounded border text-xs sm:text-sm whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-cyan-950/40 border-cyan-900 text-cyan-100'
                          : 'bg-zinc-900 border-zinc-800'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="text-[10px] text-zinc-500 italic">Arjun is typing…</div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t-2 border-zinc-800 p-4 min-h-[130px]">
              <AnimatePresence mode="wait">
                {!showSummary && phase === 'negotiation' && (
                  <motion.div key="opts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1 mb-1">
                      <MessageSquare className="w-3 h-3" /> Reply
                    </div>
                    {isTyping || messages.length === 0 ? (
                      <p className="text-zinc-600 text-xs text-center py-4">Waiting for founder…</p>
                    ) : (
                      currentStage?.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectOption(opt)}
                          className="w-full text-left p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-cyan-700/50 rounded text-xs text-zinc-300"
                        >
                          {opt.text}
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
                {showSummary && (
                  <motion.div
                    key="audit"
                    className="bg-black/60 border border-zinc-800 p-3 rounded text-[10px] space-y-1 max-h-[140px] overflow-y-auto"
                  >
                    <div className="text-cyan-400 font-bold flex items-center gap-1 border-b border-zinc-800 pb-1 mb-1">
                      <Terminal className="w-3.5 h-3.5" /> LOR AUDIT PIPELINE
                    </div>
                    {auditLog.map((log, i) => (
                      <div key={i} className="text-zinc-300">
                        [{i + 1}] {log}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[10px] text-zinc-600 font-mono uppercase tracking-widest flex items-center justify-center gap-1">
        <FileText className="w-3 h-3" /> All answers saved to your final report
      </p>
    </div>
  );
}
