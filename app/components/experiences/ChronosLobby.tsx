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
import GameArtwork from '@/components/GameArtwork';

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
      <div className="h-dvh bg-[#0c0b0e] atelier-bg flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-[#e6c27a]/25 border-t-[#e6c27a] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-[#0c0b0e] atelier-bg text-[#f5efe2] flex flex-col items-center justify-center px-4 py-14 sm:py-6 relative overflow-x-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 75% 50% at 50% 0%, rgba(212, 168, 83, 0.14), rgba(59, 110, 165, 0.09) 46%, transparent 72%)',
      }}
    >
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />

      <Link
        href="/tactical-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-xl border border-[#e6c27a]/20 bg-[#151216]/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-[#d6cbb8] hover:text-[#f8f2e4] hover:border-[#e6c27a]/45 transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      >
        <ArrowLeft size={14} className="text-[#e6c27a]" /> Tactical Arenas
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-lg space-y-3.5"
      >
        {/* Framed Horological Key-Art Banner */}
        <div className="atelier-card rounded-2xl overflow-hidden border border-[#e6c27a]/25 shadow-[0_24px_64px_rgba(0,0,0,0.75)]">
          <div className="relative h-32 sm:h-40 w-full overflow-hidden bg-[#101218]">
            <GameArtwork id="chronos" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e13] via-[#0f0e13]/45 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e6c27a]/55 to-transparent" />

            <div className="absolute top-3 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#e6c27a]/30 bg-[#0d0c11]/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
              <Clock size={11} className="text-[#9ec5ef]" />
              <span>Time-Loop Grid Deathmatch</span>
            </div>

            <div className="absolute bottom-3 left-4 right-4">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#faf4e8] leading-none">
                Chronos <span className="font-serif italic font-normal text-[#e6c27a]">Assassin</span>
              </h1>
              <p className="mt-1 text-xs text-[#cbbda8] max-w-md leading-relaxed">
                Program 5 simultaneous ticks. Rewind the loop and outsmart your rival&apos;s Ghost with 1 paradox edit.
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
            {/* Mode Switch */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0a090c] border border-[#e6c27a]/15 shadow-inner">
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
                <span>Solo vs AI</span>
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

            {/* Codename + First-to-N */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
                  Operative
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Codename..."
                  maxLength={14}
                  className="w-full bg-[#0a090c] border border-[#e6c27a]/20 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
                  <Sparkles size={11} className="text-[#e6c27a]" /> First To
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
                      className={`flex-1 py-2.5 rounded-xl font-mono font-semibold text-xs border transition-all ${
                        winScore === num
                          ? 'border-[#e6c27a]/65 bg-[#e6c27a]/15 text-[#f3d99d] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                          : 'bg-[#0a090c] text-[#9e9282] border-[#e6c27a]/15 hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
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
              <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
                <MapPin size={11} className="text-[#e6c27a]" /> Arena Layout
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playSound('chip');
                    setMapChoice('random');
                  }}
                  className={`py-2 px-1 rounded-lg border text-[11px] font-medium transition-all ${
                    mapChoice === 'random'
                      ? 'border-[#e6c27a]/65 bg-[#e6c27a]/15 text-[#f3d99d]'
                      : 'border-[#e6c27a]/15 bg-[#0a090c] text-[#9e9282] hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
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
                    className={`py-2 px-1 rounded-lg border text-[11px] font-medium truncate transition-all ${
                      mapChoice === id
                        ? 'border-[#e6c27a]/65 bg-[#e6c27a]/15 text-[#f3d99d]'
                        : 'border-[#e6c27a]/15 bg-[#0a090c] text-[#9e9282] hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
                    }`}
                  >
                    {ARENA_MAPS[id].name.split(' ')[1] || ARENA_MAPS[id].name}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'solo' && (
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
                  <ShieldCheck size={12} className="text-[#e6c27a]" /> AI Difficulty
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
                          ? 'border-[#e6c27a]/65 bg-[#e6c27a]/15 text-[#faf4e8]'
                          : 'border-[#e6c27a]/15 bg-[#0a090c] text-[#9e9282] hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{d.label}</div>
                      <div className="text-[10px] font-mono text-[#a39480]">{d.sub}</div>
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
                Initiate Solo Loop
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateGame}
                className="btn-brass w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide disabled:opacity-50"
              >
                {busy ? 'Initializing...' : 'Create Timeline Room'}
              </button>
            )}
          </div>

          {mode === 'multi' && (
            <form onSubmit={handleJoinGame} className="atelier-card rounded-2xl p-3 flex gap-2">
              <input
                type="text"
                placeholder="TIMELINE ID"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 bg-[#0a090c] border border-[#e6c27a]/20 rounded-xl px-3.5 py-2.5 text-center font-mono text-xs uppercase tracking-[0.24em] text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 transition-colors"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="btn-obsidian font-semibold px-5 py-2.5 rounded-xl text-xs disabled:opacity-40"
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
