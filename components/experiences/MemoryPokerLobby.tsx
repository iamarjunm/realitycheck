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
import GameArtwork from '@/components/GameArtwork';

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
      <div
        className="h-dvh bg-[#0c0b0e] atelier-bg flex items-center justify-center"
        style={{ backgroundImage: 'radial-gradient(ellipse at top, rgba(16, 100, 72, 0.16), transparent 60%)' }}
      >
        <div className="h-9 w-9 rounded-full border-2 border-[#e6c27a]/25 border-t-[#e6c27a] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-[#0c0b0e] atelier-bg text-[#f5efe2] flex flex-col items-center justify-center px-4 py-14 sm:py-6 relative overflow-x-hidden"
      style={{
        backgroundImage: 'radial-gradient(ellipse at top, rgba(16, 100, 72, 0.16), transparent 60%)',
      }}
    >
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />

      <Link
        href="/card-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-xl border border-[#e6c27a]/25 bg-[#0f1714]/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-[#d6cbb8] hover:text-[#faf4e8] hover:border-[#e6c27a]/50 transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      >
        <ArrowLeft size={14} className="text-[#e6c27a]" /> Card Games
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-lg space-y-3.5"
      >
        {/* Framed Parlor Key-Art Banner */}
        <div className="atelier-card rounded-2xl overflow-hidden border border-[#e6c27a]/25 shadow-[0_24px_64px_rgba(0,0,0,0.75)]">
          <div className="relative h-32 sm:h-40 w-full overflow-hidden bg-[#0c1613]">
            <GameArtwork id="memory-poker" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1211] via-[#0d1211]/45 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e6c27a]/55 to-transparent" />

            <div className="absolute top-3 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#e6c27a]/30 bg-[#0b1210]/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
              <Brain size={11} className="text-emerald-400" />
              <span>3 + 2 Recall Hold&apos;em</span>
            </div>

            <div className="absolute bottom-3 left-4 right-4">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#faf4e8] leading-none">
                Memory <span className="font-serif italic font-normal text-[#e6c27a]">Poker</span>
              </h1>
              <p className="mt-1 text-xs text-[#cbbda8] max-w-md leading-relaxed">
                Memorize the 16-card grid, flip them face-down, and pick 2 positions for the best 5-card hand.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#dc2626]/40 bg-[#450a0a]/60 px-3.5 py-2.5 text-xs text-[#fecaca] text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="atelier-card rounded-2xl p-5 space-y-4">
            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#090d0c] border border-[#e6c27a]/15 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('solo');
                }}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'solo'
                    ? 'bg-gradient-to-b from-[#e6c27a] to-[#b5893a] text-[#171108] border border-[#f5dfa9]/50 shadow-[0_4px_14px_rgba(230,194,122,0.28)]'
                    : 'text-[#9e9282] hover:text-[#ede4d3]'
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
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'multi'
                    ? 'bg-gradient-to-b from-[#e6c27a] to-[#b5893a] text-[#171108] border border-[#f5dfa9]/50 shadow-[0_4px_14px_rgba(230,194,122,0.28)]'
                    : 'text-[#9e9282] hover:text-[#ede4d3]'
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
                  className="flex-1 bg-[#090d0c] border border-[#e6c27a]/20 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 transition-colors"
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
                      className={`w-9 h-9 rounded-xl font-semibold text-sm flex items-center justify-center border transition-all ${
                        crest === c
                          ? 'bg-[#e6c27a]/15 border-[#e6c27a]/65 text-[#f3d99d] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                          : 'bg-[#090d0c] border-[#e6c27a]/15 text-[#9e9282] hover:text-[#f5efe2] hover:border-[#e6c27a]/35'
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
                <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
                  <Sparkles size={11} className="text-[#e6c27a]" /> Rounds
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
                      className={`flex-1 py-2 rounded-lg font-mono font-semibold text-xs border transition-all ${
                        totalRounds === num
                          ? 'border-[#e6c27a]/65 bg-[#e6c27a]/15 text-[#f3d99d]'
                          : 'bg-[#090d0c] text-[#9e9282] border-[#e6c27a]/15 hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
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
                      className={`flex-1 py-2 rounded-lg font-mono font-semibold text-xs border transition-all ${
                        memorizeSeconds === sec
                          ? 'border-emerald-400/55 bg-emerald-950/45 text-emerald-200'
                          : 'bg-[#090d0c] text-[#9e9282] border-[#e6c27a]/15 hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
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
                <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
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
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        difficulty === d.id
                          ? 'border-emerald-400/55 bg-emerald-950/45 text-[#faf4e8]'
                          : 'border-[#e6c27a]/15 bg-[#090d0c] text-[#9e9282] hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{d.label}</div>
                      <div className="text-[10px] font-mono text-[#a39480]">{d.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
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
                      className={`flex-1 py-2 rounded-xl font-mono font-semibold text-xs border transition-all ${
                        maxPlayers === num
                          ? 'border-emerald-400/55 bg-emerald-950/45 text-emerald-200'
                          : 'bg-[#090d0c] text-[#9e9282] border-[#e6c27a]/15 hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
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
                className="btn-brass w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide"
              >
                Deal Solo Table
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateTable}
                className="btn-brass w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide disabled:opacity-50"
              >
                {busy ? 'Creating Table...' : 'Create Poker Table'}
              </button>
            )}
          </div>

          {mode === 'multi' && (
            <div className="atelier-card rounded-2xl p-3 flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinTable()}
                placeholder="TABLE CODE"
                maxLength={6}
                className="flex-1 bg-[#090d0c] border border-[#e6c27a]/20 rounded-xl px-3.5 py-2.5 font-mono text-xs text-center uppercase text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 tracking-[0.24em] transition-colors"
              />
              <button
                type="button"
                disabled={busy || !inviteCode.trim()}
                onClick={handleJoinTable}
                className="btn-obsidian font-semibold px-5 py-2.5 rounded-xl text-xs disabled:opacity-40"
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
