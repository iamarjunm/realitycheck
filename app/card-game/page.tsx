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
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 relative overflow-hidden flex flex-col">
      <Link
        href="/card-games"
        className="relative z-20 m-5 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors w-fit"
      >
        <ArrowLeft size={14} /> Card Games
      </Link>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-[#111113]">
              <Spade className="text-emerald-400" size={24} />
            </div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400/90 mb-1.5">Head-to-Head</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">Death Parade</h1>
            <p className="mt-2.5 text-sm text-zinc-400 flex items-center justify-center gap-2">
              <Users size={14} className="text-zinc-500" /> 2 players · secret bets · deduction
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 text-center">{error}</div>
          )}

          <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-6 space-y-4">
            <button
              type="button"
              onClick={createGame}
              disabled={busy}
              className="w-full rounded-xl bg-zinc-50 hover:bg-white py-3.5 text-sm font-semibold text-zinc-950 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Creating...' : 'Create Table'}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-zinc-800" />
              <span className="mx-4 text-[11px] uppercase tracking-widest text-zinc-500 font-medium">or join</span>
              <div className="flex-grow border-t border-zinc-800" />
            </div>

            <input
              type="text"
              placeholder="INVITE CODE"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm text-center uppercase tracking-[0.22em] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
            />
            <button
              type="button"
              onClick={joinGame}
              disabled={!inviteCode.trim()}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 py-3 text-sm font-medium text-zinc-200 disabled:opacity-40 transition-colors"
            >
              Join Table
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
