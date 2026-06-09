"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

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

const CardGameLobby = () => {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error", error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const createGame = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const deck = buildOrderedDeck();

    try {
      const docRef = await addDoc(collection(db, "games"), {
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
        currentTurn: 'betting', // 'betting' -> 'action' -> 'betting'
        winner: null,
        player1Ready: false,
        player2Ready: false,
        createdAt: serverTimestamp(),
        logs: ["Game created. Waiting for opponent..."]
      });
      router.push(`/card-game/${docRef.id}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const joinGame = () => {
    if (inviteCode.trim()) {
      router.push(`/card-game/${inviteCode.trim()}`);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_34%),linear-gradient(160deg,_#08090f,_#121826_55%,_#090b12)] text-white">
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="relative w-full max-w-5xl rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.45)] p-6 sm:p-8 text-white">
        <div className="mb-8 space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl">♠</div>
          <h1 className="text-3xl font-black tracking-tight">Death Parade Cards</h1>
          <p className="text-sm text-white/70 leading-6">
            Create a match, then both players will get a separate card selection screen before the game starts.
          </p>
        </div>
        
        <button 
          onClick={createGame}
          className="w-full rounded-xl bg-white py-3.5 font-semibold text-zinc-950 shadow-lg shadow-black/20 transition hover:bg-zinc-100 mb-8"
        >
          Create New Game
        </button>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-white/15"></div>
          <span className="flex-shrink-0 mx-4 text-white/55 text-sm tracking-[0.3em]">OR</span>
          <div className="flex-grow border-t border-white/15"></div>
        </div>

        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Enter Invite Code" 
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/15"
          />
          <button 
            onClick={joinGame}
            disabled={!inviteCode.trim()}
            className="w-full rounded-xl bg-emerald-400/90 py-3.5 font-semibold text-zinc-950 hover:bg-emerald-300 transition disabled:opacity-40 disabled:hover:bg-emerald-400/90"
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardGameLobby;
