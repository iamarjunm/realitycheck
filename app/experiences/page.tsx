'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Profiler } from '../components/experiences/Profiler';
import { TypingTest } from '../components/experiences/TypingTest';
import { BrainAt3AM } from '../components/experiences/BrainAt3AM';
import Situationship from '../components/experiences/Situationship';
import { Ghost, Keyboard, Brain, MessageCircleHeart, FlaskConical } from 'lucide-react';
import GlobalNav from '@/components/GlobalNav';
import { playSound } from '@/lib/sounds';

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
    <div
      className="min-h-screen bg-[#0c0b0e] atelier-bg text-[#f5f0e6] font-sans flex flex-col relative overflow-x-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(217, 146, 66, 0.14) 0%, rgba(36, 24, 13, 0.25) 45%, rgba(12, 11, 14, 1) 88%)',
      }}
    >
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <div className="relative z-40">
        <GlobalNav activePortal="experiences" />
      </div>

      {/* Warm Gold & Espresso Segmented Studio Deck */}
      <div className="sticky top-0 z-30 w-full border-b border-[#e6c27a]/20 bg-[#131015]/92 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2a1d11] to-[#171210] border border-[#e6c27a]/35 flex items-center justify-center shadow-inner">
              <FlaskConical className="w-4 h-4 text-[#e6c27a]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-sm font-extrabold tracking-tight text-[#f5f0e6]">
                  The Curated{' '}
                  <span className="font-serif italic font-normal text-[#e6c27a]">Lab</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#a69884]">
                  · 4 Experiments
                </span>
              </div>
            </div>
          </div>

          <nav
            aria-label="Interactive lab modules"
            className="inline-flex items-center gap-1 bg-[#1b1512]/90 border border-[#e6c27a]/25 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playSound('tick');
                    setActiveTab(tab.id);
                  }}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#0c0b0e] font-bold'
                      : 'text-[#c2b4a0] hover:text-[#f5f0e6]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#e6c27a] to-[#c99642] shadow-[0_2px_12px_rgba(230,194,122,0.32)]"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 w-3.5 h-3.5 ${
                      isActive ? 'text-[#0c0b0e]' : 'text-[#e6c27a]/75'
                    }`}
                  />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>
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
