'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Profiler } from '../components/experiences/Profiler';
import { TypingTest } from '../components/experiences/TypingTest';
import { BrainAt3AM } from '../components/experiences/BrainAt3AM';
import { Situationship } from '../components/experiences/Situationship';
import { Ghost, Keyboard, Brain, MessageCircleHeart, ArrowLeft } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'profiler' | 'typing' | 'brain' | 'situationship'>('profiler');

  const tabs = [
    { id: 'profiler', label: 'Profiler', icon: Ghost },
    { id: 'typing', label: 'Typing Test', icon: Keyboard },
    { id: 'brain', label: '3 AM Brain', icon: Brain },
    { id: 'situationship', label: 'Situationship', icon: MessageCircleHeart },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black flex flex-col">
      <header className="fixed top-0 w-full border-b border-white/10 bg-black/50 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-zinc-300 hover:text-white border border-white/20 hover:border-white/50 px-2.5 py-1 rounded transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Reality Check
            </Link>
            <div className="text-sm font-mono tracking-widest uppercase text-white/50">
              [ EXPERIMENTS ]
            </div>
          </div>
          <nav className="flex space-x-1 overflow-x-auto scbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                    isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-16 flex flex-col relative w-full h-full">
        <AnimatePresence mode="wait">
          {activeTab === 'profiler' && <Profiler key="profiler" />}
          {activeTab === 'typing' && <TypingTest key="typing" />}
          {activeTab === 'brain' && <BrainAt3AM key="brain" />}
          {activeTab === 'situationship' && <Situationship key="situationship" />}
        </AnimatePresence>
      </main>
    </div>
  );
}
