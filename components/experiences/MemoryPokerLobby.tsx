'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Brain, Bot, Users, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { BotDifficulty } from '@/lib/memory-poker';
import { playSound } from '@/lib/sounds';

const CRESTS = ['♠', '♥', '♦', '♣', '★', '♛', '♜', '⚡'];

export default function MemoryPokerLobby() {
  const router = useRouter();
  const [mode, setMode] = useState<'solo' | 'multi'>('solo');
  const [nickname, setNickname] = useState('');
  const [crest, setCrest] = useState('♠');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('sharp');
  const [totalRounds, setTotalRounds] = useState(5);
  const [memorizeSeconds, setMemorizeSeconds] = useState(20);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth init failed:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleStartSolo = () => {
    playSound('deal');
    const cleanName = nickname.trim() || 'Player';
    const params = new URLSearchParams({
      name: cleanName,
      crest,
      rounds: String(totalRounds),
      memTime: String(memorizeSeconds),
      difficulty,
    });
    router.push(`/memory-poker/solo?${params.toString()}`);
  };

  const handleCreateTable = async () => {
    if (!auth.currentUser || busy) return;
    playSound('deal');
    setBusy(true);
    setError(null);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cleanName = nickname.trim() || 'Host';

    try {
      await setDoc(doc(db, 'memory_poker_games', code), {
        creatorId: auth.currentUser.uid,
        state: 'waiting',
        phase: 'memorize',
        round: 0,
        totalRounds,
        memorizeSeconds,
        selectSeconds: 25,
        maxPlayers,
        phaseEndsAt: 0,
        gridCards: [],
        communityCards: [],
        roundWinnerUids: [],
        matchWinnerUids: [],
        createdAt: serverTimestamp(),
        players: [
          {
            uid: auth.currentUser.uid,
            nickname: cleanName,
            crest,
            score: 0,
            readyMemorize: false,
            selectedIndices: [],
            lockedIn: false,
          },
        ],
      });
      router.push(`/memory-poker/${code}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create table. Check Firebase permissions and try again.');
      setBusy(false);
    }
  };

  const handleJoinTable = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code || busy) return;
    playSound('chip');
    setBusy(true);
    setError(null);

    try {
      const snap = await getDoc(doc(db, 'memory_poker_games', code));
      if (!snap.exists()) {
        setError('No Memory Poker table found with that code.');
        setBusy(false);
        return;
      }
      const params = new URLSearchParams();
      if (nickname.trim()) params.set('name', nickname.trim());
      params.set('crest', crest);
      router.push(`/memory-poker/${code}?${params.toString()}`);
    } catch (err) {
      console.error(err);
      setError('Could not join table. Check the code and try again.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="h-dvh bg-[#09090b] flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-50 flex flex-col items-center justify-center p-4 relative">
      <Link
        href="/card-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
      >
        <ArrowLeft size={14} /> Card Games
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Compact Header */}
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#111113]">
            <Brain className="text-emerald-400" size={20} />
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400/90 mb-1.5">
            3 + 2 Recall Hold&apos;em
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Memory Poker
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Memorize the 16-card grid, flip them face-down, and pick 2 positions for the best 5-card hand.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-5 space-y-4">
            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('solo');
                }}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'solo'
                    ? 'bg-zinc-50 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Solo vs Bot</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('multi');
                }}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'multi'
                    ? 'bg-zinc-50 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Multiplayer</span>
              </button>
            </div>

            {/* Identity + Crest */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Player nickname..."
                  maxLength={18}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                />
                <div className="flex gap-1">
                  {CRESTS.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        playSound('chip');
                        setCrest(c);
                      }}
                      className={`w-8 h-8 rounded-lg font-semibold text-sm flex items-center justify-center border transition-colors ${
                        crest === c
                          ? 'bg-amber-400/10 border-amber-400/50 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rounds & Memorize Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 mb-1.5">
                  <Sparkles size={11} className="text-amber-400" /> Rounds
                </label>
                <div className="flex gap-1">
                  {[3, 5, 7, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        playSound('chip');
                        setTotalRounds(num);
                      }}
                      className={`flex-1 py-1.5 rounded-lg font-mono font-semibold text-xs border transition-colors ${
                        totalRounds === num
                          ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 mb-1.5">
                  <Clock size={11} className="text-emerald-400" /> Memorize
                </label>
                <div className="flex gap-1">
                  {[10, 15, 20, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        playSound('chip');
                        setMemorizeSeconds(sec);
                      }}
                      className={`flex-1 py-1.5 rounded-lg font-mono font-semibold text-xs border transition-colors ${
                        memorizeSeconds === sec
                          ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {mode === 'solo' ? (
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 mb-1.5">
                  <ShieldCheck size={12} className="text-emerald-400" /> Bot Recall Skill
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'casual', label: 'Casual', sub: '6/16 cards' },
                      { id: 'sharp', label: 'Sharp', sub: '10/16 cards' },
                      { id: 'master', label: 'Master', sub: '14/16 cards' },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        playSound('chip');
                        setDifficulty(d.id);
                      }}
                      className={`py-2 px-2 rounded-xl border text-center transition-colors ${
                        difficulty === d.id
                          ? 'border-emerald-400/50 bg-emerald-400/10 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-semibold">{d.label}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{d.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 mb-1.5">
                  <Users size={12} className="text-emerald-400" /> Max Players
                </label>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        playSound('chip');
                        setMaxPlayers(num);
                      }}
                      className={`flex-1 py-2 rounded-xl font-mono font-semibold text-xs border transition-colors ${
                        maxPlayers === num
                          ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'solo' ? (
              <button
                type="button"
                onClick={handleStartSolo}
                className="w-full bg-zinc-50 hover:bg-white text-zinc-950 font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Deal Solo Table
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateTable}
                className="w-full bg-zinc-50 hover:bg-white text-zinc-950 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {busy ? 'Creating Table...' : 'Create Poker Table'}
              </button>
            )}
          </div>

          {mode === 'multi' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinTable()}
                placeholder="TABLE CODE"
                maxLength={6}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-center uppercase text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 tracking-[0.22em] transition-colors"
              />
              <button
                type="button"
                disabled={busy || !inviteCode.trim()}
                onClick={handleJoinTable}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium px-5 py-2.5 rounded-xl text-xs disabled:opacity-40 transition-colors"
              >
                Join
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
