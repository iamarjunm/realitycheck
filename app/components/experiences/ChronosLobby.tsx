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
      <div className="h-dvh bg-[#09090b] flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-50 flex flex-col items-center justify-center p-4 relative">
      <Link
        href="/tactical-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
      >
        <ArrowLeft size={14} /> Tactical Arenas
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#111113]">
            <Clock className="text-sky-400" size={22} />
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-sky-400/90 mb-1.5">
            Time-Loop Grid Deathmatch
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Chronos Assassin
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Program 5 simultaneous ticks. Survive a loop, rewind time, and outsmart your rival&apos;s Ghost with 1 paradox edit.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-5 space-y-4">
            {/* Mode Switch */}
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
                <span>Solo vs AI</span>
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

            {/* Codename + First-to-N */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                  Operative
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Codename..."
                  maxLength={14}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 mb-1.5">
                  <Sparkles size={11} className="text-sky-400" /> First To
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
                      className={`flex-1 py-2 rounded-xl font-mono font-semibold text-xs border transition-colors ${
                        winScore === num
                          ? 'border-sky-400/50 bg-sky-400/10 text-sky-300'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
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
              <label className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 mb-1.5">
                <MapPin size={11} className="text-sky-400" /> Arena Layout
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playSound('chip');
                    setMapChoice('random');
                  }}
                  className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium transition-colors ${
                    mapChoice === 'random'
                      ? 'border-sky-400/50 bg-sky-400/10 text-sky-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
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
                    className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium truncate transition-colors ${
                      mapChoice === id
                        ? 'border-sky-400/50 bg-sky-400/10 text-sky-300'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {ARENA_MAPS[id].name.split(' ')[1] || ARENA_MAPS[id].name}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'solo' && (
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 mb-1.5">
                  <ShieldCheck size={12} className="text-sky-400" /> AI Difficulty
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
                      className={`py-2 px-2 rounded-xl border text-center transition-colors ${
                        difficulty === d.id
                          ? 'border-sky-400/50 bg-sky-400/10 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-semibold">{d.label}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{d.sub}</div>
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
                Initiate Solo Loop
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateGame}
                className="w-full bg-zinc-50 hover:bg-white text-zinc-950 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
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
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-center font-mono text-xs uppercase tracking-[0.22em] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium px-5 py-2.5 rounded-xl text-xs disabled:opacity-40 transition-colors"
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
