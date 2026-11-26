"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { ArrowLeft, Spade, Users } from 'lucide-react';
import { motion } from 'motion/react';
import GameArtwork from '@/components/GameArtwork';

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
      <div
        className="min-h-screen bg-[#0c0b0e] atelier-bg flex items-center justify-center"
        style={{ backgroundImage: 'radial-gradient(ellipse at top, rgba(16, 100, 72, 0.16), transparent 60%)' }}
      >
        <div className="h-9 w-9 rounded-full border-2 border-[#e6c27a]/25 border-t-[#e6c27a] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0c0b0e] atelier-bg text-[#f5efe2] relative overflow-x-hidden flex flex-col"
      style={{
        backgroundImage: 'radial-gradient(ellipse at top, rgba(16, 100, 72, 0.16), transparent 60%)',
      }}
    >
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />

      <Link
        href="/card-games"
        className="relative z-20 m-5 inline-flex items-center gap-2 rounded-xl border border-[#e6c27a]/25 bg-[#0f1714]/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-[#d6cbb8] hover:text-[#faf4e8] hover:border-[#e6c27a]/50 transition-colors w-fit shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      >
        <ArrowLeft size={14} className="text-[#e6c27a]" /> Card Games
      </Link>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-lg space-y-4"
        >
          {/* Framed Parlor Key-Art Banner */}
          <div className="atelier-card rounded-2xl overflow-hidden border border-[#e6c27a]/25 shadow-[0_24px_64px_rgba(0,0,0,0.75)]">
            <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-[#0c1613]">
              <GameArtwork id="death-parade" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1211] via-[#0d1211]/45 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e6c27a]/55 to-transparent" />

              <div className="absolute top-3 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#e6c27a]/30 bg-[#0b1210]/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
                <Spade size={11} className="text-emerald-400" />
                <span>Head-to-Head</span>
              </div>

              <div className="absolute bottom-3 left-4 right-4">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#faf4e8] leading-none">
                  Death <span className="font-serif italic font-normal text-[#e6c27a]">Parade</span>
                </h1>
                <p className="mt-1.5 text-xs text-[#cbbda8] flex items-center gap-1.5">
                  <Users size={13} className="text-[#e6c27a]" /> 2 players · secret bets · deduction
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-[#dc2626]/40 bg-[#450a0a]/60 px-4 py-3 text-sm text-[#fecaca] text-center">
              {error}
            </div>
          )}

          <div className="atelier-card rounded-2xl p-6 space-y-4">
            <button
              type="button"
              onClick={createGame}
              disabled={busy}
              className="btn-brass w-full rounded-xl py-3.5 text-sm font-display font-bold tracking-wide disabled:opacity-50"
            >
              {busy ? 'Creating...' : 'Create Table'}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#e6c27a]/15" />
              <span className="mx-4 text-[11px] font-mono uppercase tracking-[0.2em] text-[#8e8271] font-medium">or join</span>
              <div className="flex-grow border-t border-[#e6c27a]/15" />
            </div>

            <input
              type="text"
              placeholder="INVITE CODE"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="w-full rounded-xl border border-[#e6c27a]/20 bg-[#090d0c] px-4 py-3 font-mono text-sm text-center uppercase tracking-[0.24em] text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 transition-colors"
            />
            <button
              type="button"
              onClick={joinGame}
              disabled={!inviteCode.trim()}
              className="btn-obsidian w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
            >
              Join Table
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
