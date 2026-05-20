'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Archive, Briefcase, Flame, List, LayoutGrid, Terminal, Lock, FileText, Shield, MessageSquare } from 'lucide-react';
import { QUIZZES } from '../../../lib/quizzes';

const LOR_UNLOCK_KEY = 'thriftz_lor_unlocked';

export function QuizSelectScreen({ onSelect, onViewCollection }: { onSelect: (id: string) => void; onViewCollection: () => void }) {
  const visibleQuizzes = QUIZZES.filter((quiz) => !quiz.hidden);
  const [lorPasswordOpen, setLorPasswordOpen] = useState(false);
  const [lorPasswordInput, setLorPasswordInput] = useState('');
  const [lorPasswordError, setLorPasswordError] = useState(false);

  const lorQuiz = QUIZZES.find((quiz) => quiz.id === 'lor');

  const isLorUnlocked = () => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(LOR_UNLOCK_KEY) === '1';
  };

  const handleQuizClick = (quizId: string) => {
    const quiz = QUIZZES.find((entry) => entry.id === quizId);
    if (quiz?.password && !isLorUnlocked()) {
      setLorPasswordInput('');
      setLorPasswordError(false);
      setLorPasswordOpen(true);
      return;
    }
    onSelect(quizId);
  };

  const submitLorPassword = () => {
    if (lorPasswordInput === lorQuiz?.password) {
      sessionStorage.setItem(LOR_UNLOCK_KEY, '1');
      setLorPasswordOpen(false);
      setLorPasswordError(false);
      onSelect('lor');
      return;
    }
    setLorPasswordError(true);
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-zinc-950 z-10 w-screen h-screen">
      
      {/* Navbar / Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-cyan-500" />
            THRIFTZ MARKETPLACE LLP
          </h1>
          <p className="text-zinc-500 font-mono text-[10px] sm:text-xs mt-1 uppercase tracking-widest">
            Internal Associate Portal // System Diagnostic
          </p>
        </div>
        <button
          onClick={onViewCollection}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-400 text-zinc-400 text-xs font-mono font-bold uppercase transition-colors rounded-sm"
        >
          <Archive className="w-4 h-4" />
          Access Locked Vault
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Available Modules</h2>
          <p className="text-zinc-400 font-mono text-sm max-w-2xl mx-auto sm:mx-0">
            Select an assessment or diagnostic module below to begin evaluation. All responses are recorded for performance review purposes.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleQuizzes.map((quiz, i) => {
            const isRoast = quiz.id === 'roast';
            const isLor = quiz.id === 'lor';

            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`group relative flex flex-col border p-6 rounded-lg transition-all cursor-pointer overflow-hidden ${
                  isLor ? 'lor-select-card border-[#8b5a2b]/50 hover:border-[#e5c158] hover:shadow-[0_0_30px_rgba(139,90,43,0.25)] min-h-[280px]' :
                  isRoast ? 'bg-zinc-900/50 border-orange-500/30 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(234,88,12,0.15)]' : 
                  'bg-zinc-900/50 border-zinc-800 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                }`}
                onClick={() => handleQuizClick(quiz.id)}
              >
                {/* Background Glow */}
                <div className={`absolute -inset-24 bg-gradient-to-tr ${
                  isLor ? 'from-[#8b5a2b]/20' :
                  isRoast ? 'from-orange-500/10' : 
                  'from-cyan-500/10'
                } to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl z-0 pointer-events-none`} />

                {isLor && (
                  <>
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none lor-memo-watermark z-0" />
                    <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full border-4 border-double border-[#8b5a2b]/30 opacity-40 rotate-[-15deg] pointer-events-none" />
                  </>
                )}

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-md transition-colors ${
                      isLor ? 'bg-[#8b5a2b]/10 text-[#8b5a2b] group-hover:bg-[#8b5a2b]/20' :
                      isRoast ? 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20' : 
                      'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20'
                    }`}>
                      {isLor ? <Briefcase className="w-5 h-5" /> : isRoast ? <Flame className="w-5 h-5" /> : <List className="w-5 h-5" />}
                    </div>
                    <span className="font-mono text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors uppercase tracking-widest">
                      ID: {quiz.id.substring(0,6)}
                    </span>
                  </div>

                  <h3 className={`text-xl font-black mb-1 uppercase tracking-tight transition-colors ${
                    isLor ? 'text-[#e5c158] group-hover:text-amber-400' :
                    isRoast ? 'text-orange-200 group-hover:text-orange-300' : 
                    'text-zinc-100 group-hover:text-cyan-400'
                  }`}>
                    {quiz.title}
                  </h3>
                  
                  <p className={`text-xs font-mono uppercase tracking-widest mb-4 border-b pb-3 ${
                    isLor ? 'text-[#a27b5c] border-[#8b5a2b]/20' :
                    isRoast ? 'text-orange-400/80 border-orange-900/30' : 
                    'text-cyan-600 border-zinc-800'
                  }`}>
                    {quiz.subtitle}
                  </p>
                  
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4 flex-1">
                    {quiz.description}
                  </p>

                  {isLor && (
                    <div className="grid grid-cols-3 gap-2 mb-4 font-mono text-[9px] uppercase">
                      <div className="bg-black/40 border border-[#8b5a2b]/30 rounded p-2 text-center">
                        <FileText className="w-3 h-3 mx-auto text-[#8b5a2b] mb-1" />
                        <span className="text-[#a27b5c]">Dossier</span>
                      </div>
                      <div className="bg-black/40 border border-[#8b5a2b]/30 rounded p-2 text-center">
                        <MessageSquare className="w-3 h-3 mx-auto text-[#8b5a2b] mb-1" />
                        <span className="text-[#a27b5c]">Negotiate</span>
                      </div>
                      <div className="bg-black/40 border border-[#8b5a2b]/30 rounded p-2 text-center">
                        <Shield className="w-3 h-3 mx-auto text-[#8b5a2b] mb-1" />
                        <span className="text-[#a27b5c]">Audit</span>
                      </div>
                    </div>
                  )}

                  <div className={`mt-auto pt-4 border-t flex items-center justify-between text-xs font-black uppercase transition-colors ${
                    isLor ? 'border-[#8b5a2b]/20 text-[#a27b5c] group-hover:text-[#8b5a2b]' :
                    isRoast ? 'border-orange-500/20 text-orange-500/70 group-hover:text-orange-400' : 
                    'border-zinc-800 text-zinc-500 group-hover:text-cyan-400'
                  }`}>
                    <span>Launch Module</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {/* True Reality (Hardcoded hidden module) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: visibleQuizzes.length * 0.1 }}
            className="group relative flex flex-col bg-red-950/20 border border-red-900/30 hover:border-red-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] p-6 rounded-lg transition-all cursor-pointer overflow-hidden"
            onClick={() => onSelect('true_reality')}
          >
            <div className="absolute -inset-24 bg-gradient-to-tr from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl z-0 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-md bg-red-900/20 text-red-500 group-hover:bg-red-900/40 transition-colors">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-red-900/50 group-hover:text-red-500 transition-colors uppercase tracking-widest">
                  SYS.ERR
                </span>
              </div>
              
              <h3 className="text-xl font-black mb-1 uppercase tracking-tight text-red-500 group-hover:text-red-400 transition-colors">
                CRITICAL_ERROR.SYS
              </h3>
              <p className="text-xs font-mono uppercase tracking-widest mb-4 border-b border-red-900/30 pb-3 text-red-700">
                WAKE UP
              </p>
              
              <p className="text-red-400/70 text-sm leading-relaxed mb-6 flex-1">
                SIMULATION FAILING. YOU ARE BEING WATCHED.
              </p>
              
              <div className="mt-auto pt-4 border-t border-red-900/30 flex items-center justify-between text-xs font-black uppercase text-red-700 group-hover:text-red-500 transition-colors">
                <span>EXECUTE OVERRIDE</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {lorPasswordOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setLorPasswordOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-[#8b5a2b]/50 rounded-lg p-6 shadow-[0_0_40px_rgba(139,90,43,0.2)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#8b5a2b]/20 text-[#e5c158] rounded-md">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#e5c158] uppercase tracking-tight">Restricted Module</h3>
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">LOR clearance required</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-4 font-mono">
                Enter the intern access code to open the LOR evaluation pipeline.
              </p>
              <input
                type="password"
                value={lorPasswordInput}
                onChange={(event) => {
                  setLorPasswordInput(event.target.value);
                  setLorPasswordError(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitLorPassword();
                }}
                placeholder="ACCESS_CODE_"
                className="w-full bg-black border-2 border-zinc-700 text-center text-white text-lg py-3 mb-3 focus:outline-none focus:border-[#8b5a2b] font-mono uppercase tracking-widest"
                autoFocus
              />
              {lorPasswordError && (
                <p className="text-red-500 text-xs font-mono uppercase mb-3 text-center">Invalid access code</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setLorPasswordOpen(false)}
                  className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase text-xs rounded hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitLorPassword}
                  disabled={!lorPasswordInput.trim()}
                  className="flex-1 py-3 bg-[#8b5a2b] text-black font-black uppercase text-xs rounded hover:bg-[#a27b5c] transition-colors disabled:opacity-50"
                >
                  Unlock
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
