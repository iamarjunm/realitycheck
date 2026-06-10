'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Clock, Plus, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ChronosLobby() {
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const router = useRouter();

  const handleCreateGame = async () => {
    try {
      setIsCreating(true);
      if (!auth.currentUser) await signInAnonymously(auth);
      
      const gameRef = await addDoc(collection(db, 'chronos_assassin_games'), {
        creatorId: auth.currentUser!.uid,
        state: 'waiting',
        players: [],
        turn: 1,
        ticks: 0,
        winner: null,
        matchWinner: null,
        createdAt: Date.now()
      });

      router.push(`/chronos/${gameRef.id}`);
    } catch (e) {
      console.error(e);
      setIsCreating(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      router.push(`/chronos/${joinCode.trim()}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"
    >
      <div className="w-full max-w-md bg-black/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)] relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-4 bg-cyan-950/50 rounded-full border border-cyan-500/30 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-cyan-400 text-shadow-sm shadow-cyan-500">Chronos Assassin</h1>
            <p className="text-sm font-mono text-cyan-500/60 uppercase tracking-widest">Time-Loop Grid Deathmatch</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateGame}
              disabled={isCreating}
              className="w-full bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-50 font-mono py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
            >
              <Plus className="w-5 h-5 text-cyan-400" />
              {isCreating ? 'Initializing...' : 'Create Timeline'}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-cyan-900"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-mono text-cyan-800 uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-cyan-900"></div>
            </div>

            <form onSubmit={handleJoinGame} className="space-y-2">
              <input
                type="text"
                placeholder="ENTER TIMELINE ID"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-cyan-950/20 border border-cyan-500/20 rounded-xl px-4 py-4 text-center font-mono text-sm uppercase tracking-widest text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-mono py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
              >
                <LogIn className="w-5 h-5" />
                Join Match
              </button>
            </form>
          </div>

          <div className="text-center pt-8 border-t border-cyan-900">
            <p className="text-[10px] font-mono text-cyan-600/50 leading-relaxed uppercase tracking-widest">
              4D Chess meets a retro-arcade shooter. Move, shoot, rewind.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
