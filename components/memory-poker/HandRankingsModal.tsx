'use client';

import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { HAND_RANKINGS_GUIDE } from '@/lib/memory-poker';
import { PlayingCard } from './PlayingCard';

interface HandRankingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function HandRankingsModal({ open, onClose }: HandRankingsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hand-rankings-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-950 border border-white/15 rounded-[1.5rem] p-6 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 id="hand-rankings-title" className="text-xl font-black uppercase tracking-tight text-white">
              Poker Hand Rankings
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Highest 5-card hand (3 Community + 2 Selected) wins the round
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hand rankings"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-white/10 mt-2">
          {HAND_RANKINGS_GUIDE.map((item, idx) => (
            <div
              key={item.name}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 tabular-nums w-5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-bold text-white">{item.name}</span>
                </div>
                <p className="text-xs text-zinc-400 pl-7 mt-0.5">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1 pl-7 sm:pl-0 shrink-0">
                {item.example.map((cardId) => (
                  <PlayingCard key={cardId} cardId={cardId} faceUp size="xs" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
