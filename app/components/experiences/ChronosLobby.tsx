'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import {
  Clock,
  Bot,
  Users,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ARENA_MAPS, ArenaMapId, BotDifficulty, pickRoundMap } from '@/lib/chronos';
import { playSound } from '@/lib/sounds';

export function ChronosLobby() {
  const router = useRouter();
  const [mode, setMode] = useState<'solo' | 'multi'>('solo');
  const [nickname, setNickname] = useState('');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('sharp');
  const [winScore, setWinScore] = useState<3 | 5>(3);
  const [mapChoice, setMapChoice] = useState<ArenaMapId | 'random'>('random');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleStartSolo = () => {
    playSound('deal');
    const cleanName = nickname.trim() || 'Assassin';
    const params = new URLSearchParams({
      name: cleanName,
      difficulty,
      winScore: String(winScore),
      map: mapChoice,
    });
    router.push(`/chronos/solo?${params.toString()}`);
  };

  const handleCreateGame = async () => {
    if (!auth.currentUser || busy) return;
    playSound('deal');
    setBusy(true);
    setError(null);

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { mapId, obstacles } = pickRoundMap(mapChoice);
    const cleanName = nickname.trim() || 'Host';

    let sid = sessionStorage.getItem('chronosTabSid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2);
      sessionStorage.setItem('chronosTabSid', sid);
    }

    try {
      await setDoc(doc(db, 'chronos_assassin_games', code), {
        creatorId: auth.currentUser.uid,
        state: 'waiting',
        turn: 1,
        round: 1,
        winScore,
        mapId,
        obstacles,
        roundWinnerIdx: null,
        matchWinner: null,
        executionResults: null,
        executionId: null,
        createdAt: Date.now(),
        players: [
          {
            uid: auth.currentUser.uid,
            sessionId: sid,
            nickname: cleanName,
            color: 'cyan',
            score: 0,
            ready: false,
            readyForNext: false,
            actions: ['W', 'W', 'W', 'W', 'W'],
            pastActions: [],
          },
        ],
      });
      router.push(`/chronos/${code}`);
    } catch (e) {
      console.error(e);
      setError('Failed to create timeline. Check Firebase permissions.');
      setBusy(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || busy) return;
    playSound('chip');
    setBusy(true);
    setError(null);

    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      const snap = await getDoc(doc(db, 'chronos_assassin_games', code));
      if (!snap.exists()) {
        setError('No Chronos timeline found with that ID.');
        setBusy(false);
        return;
      }
      const query = nickname.trim() ? `?name=${encodeURIComponent(nickname.trim())}` : '';
      router.push(`/chronos/${code}${query}`);
    } catch (e) {
      console.error(e);
      setError('Could not join timeline.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="h-dvh bg-[#04060c] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#04060c] text-white flex flex-col items-center justify-center p-4 relative">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[450px] h-[350px] bg-rose-500/10 rounded-full blur-[110px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      <Link
        href="/tactical-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={13} /> Tactical Arenas
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-4">
          <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/50 shadow-[0_0_28px_rgba(6,182,212,0.22)]">
            <Clock className="text-cyan-400" size={22} />
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-cyan-400 mb-1">
            Time-Loop Grid Deathmatch
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-200 via-cyan-400 to-sky-500">
            Chronos Assassin
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-xs mx-auto">
            Program 5 simultaneous ticks. Survive a loop, rewind time, and outsmart your rival&apos;s Ghost with 1 paradox edit.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-cyan-500/20 bg-black/65 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-3.5">
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
                    ? 'bg-cyan-400 text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Solo vs AI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('multi');
                }}
                className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'multi'
                    ? 'bg-cyan-400 text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Multiplayer</span>
              </button>
            </div>

            {/* Codename + First-to-N */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1">
                  Operative
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Codename..."
                  maxLength={14}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1">
                  <Sparkles size={10} className="text-cyan-400" /> First To
                </label>
                <div className="flex gap-1.5">
                  {([3, 5] as const).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        playSound('chip');
                        setWinScore(num);
                      }}
                      className={`flex-1 py-2 rounded-xl font-mono font-bold text-xs transition-all ${
                        winScore === num
                          ? 'bg-cyan-400 text-black'
                          : 'bg-zinc-950 text-zinc-400 border border-white/10 hover:border-white/25'
                      }`}
                    >
                      {num} Kills
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Selector */}
            <div>
              <label className="flex items-center gap-1 text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1">
                <MapPin size={10} className="text-cyan-400" /> Arena Layout
              </label>
              <div className="grid grid-cols-5 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    playSound('chip');
                    setMapChoice('random');
                  }}
                  className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold transition-all ${
                    mapChoice === 'random'
                      ? 'border-cyan-400 bg-cyan-400/15 text-white'
                      : 'border-white/10 bg-zinc-950 text-zinc-400 hover:border-white/25'
                  }`}
                >
                  Random
                </button>
                {(Object.keys(ARENA_MAPS) as ArenaMapId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      playSound('chip');
                      setMapChoice(id);
                    }}
                    title={ARENA_MAPS[id].tagline}
                    className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold truncate transition-all ${
                      mapChoice === id
                        ? 'border-cyan-400 bg-cyan-400/15 text-white'
                        : 'border-white/10 bg-zinc-950 text-zinc-400 hover:border-white/25'
                    }`}
                  >
                    {ARENA_MAPS[id].name.split(' ')[1] || ARENA_MAPS[id].name}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'solo' && (
              <div>
                <label className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1.5">
                  <ShieldCheck size={11} className="text-cyan-400" /> AI Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'casual', label: 'Casual', sub: 'Erratic' },
                      { id: 'sharp', label: 'Sharp', sub: 'Tactical' },
                      { id: 'master', label: 'Paradox', sub: 'Predictive' },
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
                          ? 'border-cyan-400 bg-cyan-400/15 text-white'
                          : 'border-white/10 bg-zinc-950 text-zinc-400 hover:border-white/25'
                      }`}
                    >
                      <div className="text-[11px] font-black uppercase">{d.label}</div>
                      <div className="text-[9px] font-mono text-zinc-500">{d.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'solo' ? (
              <button
                type="button"
                onClick={handleStartSolo}
                className="w-full bg-gradient-to-r from-cyan-400 to-sky-500 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:opacity-95 transition-opacity shadow-[0_0_24px_rgba(34,211,238,0.3)]"
              >
                Initiate Solo Loop
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateGame}
                className="w-full bg-gradient-to-r from-cyan-400 to-sky-500 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:opacity-95 transition-opacity shadow-[0_0_24px_rgba(34,211,238,0.3)] disabled:opacity-50"
              >
                {busy ? 'Initializing...' : 'Create Timeline Room'}
              </button>
            )}
          </div>

          {mode === 'multi' && (
            <form onSubmit={handleJoinGame} className="flex gap-2">
              <input
                type="text"
                placeholder="TIMELINE ID"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-center font-mono text-xs uppercase tracking-[0.25em] text-cyan-100 focus:outline-none focus:border-cyan-400"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="bg-white text-black font-black px-5 py-2.5 rounded-xl uppercase tracking-widest text-xs hover:bg-zinc-200 disabled:opacity-40 transition-colors"
              >
                Sync
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
