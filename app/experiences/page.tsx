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
  { id: 'profiler', label: 'Profiler', icon: Ghost },
  { id: 'typing', label: 'Typing Test', icon: Keyboard },
  { id: 'brain', label: '3 AM Brain', icon: Brain },
  { id: 'situationship', label: 'Situationship', icon: MessageCircleHeart },
] as const;

type LabTab = (typeof TABS)[number]['id'];

export default function ExperiencesPage() {
  const [activeTab, setActiveTab] = useState<LabTab>('profiler');

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans flex flex-col">
      <GlobalNav activePortal="experiences" />

      {/* Refined Segmented Sub-Navigation Bar */}
      <div className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-zinc-200 font-semibold">Interactive Lab</span>
            <span className="font-mono text-[11px] text-zinc-500">· 4 modules</span>
          </div>

          <nav
            aria-label="Interactive lab modules"
            className="inline-flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl overflow-x-auto max-w-full"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 rounded-lg bg-zinc-50"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                    />
                  )}
                  <Icon className={`relative z-10 w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-500'}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="flex-grow flex flex-col w-full h-full">
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
