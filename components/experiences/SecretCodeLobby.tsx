'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, KeyRound, Bot, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { BotDifficulty } from '@/lib/secret-code';
import { playSound } from '@/lib/sounds';

export default function SecretCodeLobby() {
  const router = useRouter();
  const [mode, setMode] = useState<'solo' | 'multi'>('solo');
  const [nickname, setNickname] = useState('');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('sharp');
  const [totalRounds, setTotalRounds] = useState(5);
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
    const cleanName = nickname.trim() || 'Agent';
    const params = new URLSearchParams({
      name: cleanName,
      rounds: String(totalRounds),
      difficulty,
    });
    router.push(`/secret-code/solo?${params.toString()}`);
  };

  const handleCreateRoom = async () => {
    if (!auth.currentUser || busy) return;
    playSound('deal');
    setBusy(true);
    setError(null);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cleanName = nickname.trim() || 'Host';

    try {
      await setDoc(doc(db, 'secret_code_games', code), {
        creatorId: auth.currentUser.uid,
        state: 'waiting',
        phase: 'deducing',
        round: 0,
        totalRounds,
        maxPlayers,
        cards: [],
        rules: [],
        secretIndices: [],
        roundWinnerUid: '',
        matchWinnerUids: [],
        createdAt: serverTimestamp(),
        players: [
          {
            uid: auth.currentUser.uid,
            nickname: cleanName,
            score: 0,
            eliminatedThisRound: false,
            lastGuess: [],
          },
        ],
      });
      router.push(`/secret-code/${code}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create room. Check Firebase permissions and try again.');
      setBusy(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code || busy) return;
    playSound('chip');
    setBusy(true);
    setError(null);

    try {
      const snap = await getDoc(doc(db, 'secret_code_games', code));
      if (!snap.exists()) {
        setError('No Secret Order room found with that code.');
        setBusy(false);
        return;
      }
      const cleanName = nickname.trim();
      const query = cleanName ? `?name=${encodeURIComponent(cleanName)}` : '';
      router.push(`/secret-code/${code}${query}`);
    } catch (err) {
      console.error(err);
      setError('Could not join room. Check the code and try again.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="h-dvh bg-[#050508] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#050508] text-white flex flex-col items-center justify-center p-4 relative">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      <Link
        href="/card-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
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
          <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/40 shadow-[0_0_24px_rgba(245,158,11,0.2)]">
            <KeyRound className="text-amber-400" size={20} />
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-amber-400 mb-1">
            Cipher Deduction
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500">
            Secret Order
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-xs mx-auto">
            26 cards, 6 logic rules, 1 unique 4-card code. One wrong guess knocks you out.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-3.5">
            {/* Mode Switch */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('solo');
                }}
                className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'solo'
                    ? 'bg-amber-400 text-black shadow'
                    : 'text-zinc-400 hover:text-white'
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
                    ? 'bg-amber-400 text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Multiplayer</span>
              </button>
            </div>

            {/* Nickname + Rounds row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1">
                  Codename
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Agent..."
                  maxLength={18}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1">
                  <Sparkles size={10} className="text-amber-400" /> Rounds
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
                      className={`flex-1 py-2 rounded-xl font-mono font-bold text-xs transition-all ${
                        totalRounds === num
                          ? 'bg-amber-400 text-black'
                          : 'bg-zinc-950 text-zinc-400 border border-white/10 hover:border-white/25'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {mode === 'solo' ? (
              <div>
                <label className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1.5">
                  <ShieldCheck size={11} className="text-amber-400" /> Bot Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'casual', label: 'Casual', sub: '~38s solve' },
                      { id: 'sharp', label: 'Sharp', sub: '~26s solve' },
                      { id: 'master', label: 'Master', sub: '~16s solve' },
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
                          ? 'border-amber-400 bg-amber-400/15 text-white'
                          : 'border-white/10 bg-zinc-950 text-zinc-400 hover:border-white/25'
                      }`}
                    >
                      <div className="text-[11px] font-black uppercase">{d.label}</div>
                      <div className="text-[9px] font-mono text-zinc-500">{d.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1.5">
                  <Users size={11} className="text-amber-400" /> Max Players
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
                          : 'bg-zinc-950 text-zinc-400 border border-white/10 hover:border-white/25'
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
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:opacity-95 transition-opacity shadow-[0_0_24px_rgba(245,158,11,0.3)]"
              >
                Start Solo Match
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateRoom}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:opacity-95 transition-opacity shadow-[0_0_24px_rgba(245,158,11,0.3)] disabled:opacity-50"
              >
                {busy ? 'Creating Room...' : 'Create Cipher Room'}
              </button>
            )}
          </div>

          {mode === 'multi' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder="ROOM CODE"
                maxLength={6}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-xs text-center uppercase text-white focus:outline-none focus:border-amber-400 tracking-[0.25em]"
              />
              <button
                type="button"
                disabled={busy || !inviteCode.trim()}
                onClick={handleJoinRoom}
                className="bg-white text-black font-black px-5 py-2.5 rounded-xl uppercase tracking-widest text-xs hover:bg-zinc-200 disabled:opacity-40 transition-colors"
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
