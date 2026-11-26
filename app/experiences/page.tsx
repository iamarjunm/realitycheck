'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Profiler } from '../components/experiences/Profiler';
import { TypingTest } from '../components/experiences/TypingTest';
import { BrainAt3AM } from '../components/experiences/BrainAt3AM';
import Situationship from '../components/experiences/Situationship';
import { Ghost, Keyboard, Brain, MessageCircleHeart, FlaskConical } from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';

const TABS = [
  { id: 'profiler', label: 'Profiler', icon: Ghost, accent: 'text-fuchsia-300' },
  { id: 'typing', label: 'Typing Test', icon: Keyboard, accent: 'text-cyan-300' },
  { id: 'brain', label: '3 AM Brain', icon: Brain, accent: 'text-violet-300' },
  { id: 'situationship', label: 'Situationship', icon: MessageCircleHeart, accent: 'text-rose-300' },
] as const;

type LabTab = (typeof TABS)[number]['id'];

export default function ExperiencesPage() {
  const [activeTab, setActiveTab] = useState<LabTab>('profiler');

  return (
    <div className="min-h-screen bg-[#04050a] text-white font-sans selection:bg-fuchsia-500/30 selection:text-white flex flex-col relative">
      {/* Subtle Ambient Lab Glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-fuchsia-500/[0.06] rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-grid-white opacity-25" />
      </div>

      <GlobalNav activePortal="experiences" />

      {/* Sleek Floating Glass Sub-Navigation Bar */}
      <div className="sticky top-0 z-40 w-full px-4 pt-3 pb-2 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#070912]/85 backdrop-blur-xl px-3 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
            <div className="hidden sm:flex items-center gap-2 pl-2 text-[10px] font-mono uppercase tracking-[0.22em] text-fuchsia-300/90 shrink-0">
              <FlaskConical className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Weird Lab</span>
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                      isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? tab.accent : 'text-zinc-500'}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-violet-400 shadow-[0_0_12px_rgba(217,70,239,0.75)]"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <main className="relative z-10 flex-grow flex flex-col w-full h-full">
        <AnimatePresence mode="wait">
          {activeTab === 'profiler' && <Profiler key="profiler" setActiveTab={setActiveTab} />}
          {activeTab === 'typing' && <TypingTest key="typing" />}
          {activeTab === 'brain' && <BrainAt3AM key="brain" />}
          {activeTab === 'situationship' && <Situationship key="situationship" />}
        </AnimatePresence>
      </main>
    </div>
  );
}
