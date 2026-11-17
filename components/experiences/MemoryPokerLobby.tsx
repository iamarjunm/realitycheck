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
      <div className="h-dvh bg-[#050a08] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh lg:h-dvh lg:overflow-hidden text-white flex flex-col items-center justify-center p-4 relative"
      style={{
        background:
          'radial-gradient(circle at 50% 15%, #0F3D29 0%, #05160E 45%, #040706 100%)',
      }}
    >
      <div className="pointer-events-none fixed inset-0 bg-grid-white opacity-25" />

      <Link
        href="/card-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-stone-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={13} /> Card Games
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Compact Header */}
        <div className="text-center mb-4">
          <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/60 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
            <Brain className="text-emerald-400" size={20} />
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-emerald-400 mb-1">
            3 + 2 Recall Hold&apos;em
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-teal-200 to-amber-300">
            Memory Poker
          </h1>
          <p className="mt-1 text-xs text-stone-400 max-w-xs mx-auto">
            Memorize the 16-card grid, flip them face-down, and pick 2 positions for the best 5-card hand.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-black/60 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-3.5">
            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('solo');
                }}
                className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'solo'
                    ? 'bg-emerald-500 text-black shadow'
                    : 'text-stone-400 hover:text-white'
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
                className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'multi'
                    ? 'bg-emerald-500 text-black shadow'
                    : 'text-stone-400 hover:text-white'
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
                  className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
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
                      className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                        crest === c
                          ? 'bg-emerald-500/25 border border-emerald-400 text-amber-300'
                          : 'bg-zinc-950 border border-white/10 text-stone-400 hover:text-white'
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
                <label className="flex items-center gap-1 text-[9px] font-mono uppercase text-stone-400 font-bold tracking-widest mb-1">
                  <Sparkles size={10} className="text-amber-300" /> Rounds
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
                      className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-xs transition-all ${
                        totalRounds === num
                          ? 'bg-amber-400 text-black'
                          : 'bg-zinc-950 text-stone-400 border border-white/10 hover:border-white/25'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[9px] font-mono uppercase text-stone-400 font-bold tracking-widest mb-1">
                  <Clock size={10} className="text-emerald-400" /> Memorize
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
                      className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-xs transition-all ${
                        memorizeSeconds === sec
                          ? 'bg-emerald-500 text-black'
                          : 'bg-zinc-950 text-stone-400 border border-white/10 hover:border-white/25'
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
                <label className="flex items-center gap-1 text-[9px] font-mono uppercase text-stone-400 font-bold tracking-widest mb-1.5">
                  <ShieldCheck size={11} className="text-emerald-400" /> Bot Recall Skill
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
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        difficulty === d.id
                          ? 'border-emerald-400 bg-emerald-500/15 text-white'
                          : 'border-white/10 bg-zinc-950 text-stone-400 hover:border-white/25'
                      }`}
                    >
                      <div className="text-[11px] font-black uppercase">{d.label}</div>
                      <div className="text-[9px] font-mono text-stone-500">{d.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-1 text-[9px] font-mono uppercase text-stone-400 font-bold tracking-widest mb-1.5">
                  <Users size={11} className="text-emerald-400" /> Max Players
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
                      className={`flex-1 py-2 rounded-xl font-mono font-bold text-xs transition-all ${
                        maxPlayers === num
                          ? 'bg-white text-black'
                          : 'bg-zinc-950 text-stone-400 border border-white/10 hover:border-white/25'
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
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:opacity-95 transition-opacity shadow-[0_0_24px_rgba(16,185,129,0.3)]"
              >
                Deal Solo Table
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateTable}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:opacity-95 transition-opacity shadow-[0_0_24px_rgba(16,185,129,0.3)] disabled:opacity-50"
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
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-xs text-center uppercase text-white focus:outline-none focus:border-emerald-400 tracking-[0.25em]"
              />
              <button
                type="button"
                disabled={busy || !inviteCode.trim()}
                onClick={handleJoinTable}
                className="bg-white text-black font-black px-5 py-2.5 rounded-xl uppercase tracking-widest text-xs hover:bg-stone-200 disabled:opacity-40 transition-colors"
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
