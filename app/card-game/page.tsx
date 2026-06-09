"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { ArrowLeft, Spade, Users } from 'lucide-react';
import { motion } from 'motion/react';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['H', 'C', 'D', 'S'];

const buildOrderedDeck = () => {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck;
};

export default function CardGameLobby() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error(e);
        setError('Could not connect.');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const createGame = async () => {
    if (!auth.currentUser || busy) return;
    setBusy(true);
    setError(null);
    const deck = buildOrderedDeck();

    try {
      const docRef = await addDoc(collection(db, 'games'), {
        state: 'waiting',
        player1: auth.currentUser.uid,
        player2: null,
        player1Cards: [],
        player2Cards: [],
        deck,
        player1Tokens: 10,
        player2Tokens: 10,
        player1Bet: null,
        player2Bet: null,
        roundWinner: null,
        currentTurn: 'betting',
        winner: null,
        player1Ready: false,
        player2Ready: false,
        createdAt: serverTimestamp(),
        logs: ['Game created. Waiting for opponent...'],
      });
      router.push(`/card-game/${docRef.id}`);
    } catch (e) {
      console.error(e);
      setError('Failed to create game. Check Firebase permissions.');
      setBusy(false);
    }
  };

  const joinGame = () => {
    if (inviteCode.trim()) {
      router.push(`/card-game/${inviteCode.trim()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a08] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a08] text-white relative overflow-hidden flex flex-col">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px]" />
      </div>

      <Link href="/card-games" className="relative z-20 m-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-white w-fit">
        <ArrowLeft size={14} /> Card Games
      </Link>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/50">
              <Spade className="text-emerald-400" size={26} />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-emerald-500/80 mb-2">Head-to-head</p>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Death Parade</h1>
            <p className="mt-3 text-sm text-zinc-500 flex items-center justify-center gap-2">
              <Users size={14} /> 2 players · secret bets · deduction
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200 text-center">{error}</div>
          )}

          <div className="rounded-[1.75rem] border border-white/10 bg-black/50 backdrop-blur-xl p-6 space-y-4 shadow-2xl">
            <button
              type="button"
              onClick={createGame}
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 font-black uppercase tracking-widest text-black hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[0_0_30px_rgba(52,211,153,0.25)]"
            >
              {busy ? 'Creating...' : 'Create Table'}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-white/10" />
              <span className="mx-4 text-[10px] uppercase tracking-widest text-zinc-600">or join</span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            <input
              type="text"
              placeholder="INVITE CODE"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-mono text-center uppercase tracking-widest focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={joinGame}
              disabled={!inviteCode.trim()}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 font-bold uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              Join Table
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
