'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Bot, Crown, Flame, Shield, Sparkles, Swords, Users } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  ANOMALY_CARDS,
  AnomalyCardId,
  CROWNS_TO_WIN,
  RealityDraftState,
  RealityStance,
  STARTING_HP,
  createInitialPlayer,
  pickOracleMove,
  resolveRealityClash,
  rollNextDistortion,
} from '@/lib/reality-draft';
import { RealityDraftArena } from '@/components/reality-draft/RealityDraftArena';
import { playSound } from '@/lib/sounds';

const SHOWCASE_CARDS: AnomalyCardId[] = ['zero_void', 'bluff_phantom', 'apex_singularity'];

export default function RealityDraftLobbyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soloGame, setSoloGame] = useState<RealityDraftState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(console.error);
    }
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('realityCheckNick') || '';
      if (saved) setNickname(saved.slice(0, 14));
    }
  }, []);

  const persistNickname = (value: string) => {
    const trimmed = value.slice(0, 14);
    setNickname(trimmed);
    if (typeof window !== 'undefined' && trimmed.trim()) {
      window.localStorage.setItem('realityCheckNick', trimmed.trim());
    }
  };

  const startSolo = () => {
    const cleanName = nickname.trim() || 'Drifter';
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('realityCheckNick', cleanName);
    }
    if (soundEnabled) playSound('deal');

    setSoloGame({
      mode: 'solo',
      creatorId: 'human',
      state: 'selecting',
      round: 1,
      distortion: rollNextDistortion(),
      players: [
        createInitialPlayer({
          uid: 'human',
          sessionId: 'human',
          nickname: cleanName,
          isBot: false,
        }),
        createInitialPlayer({
          uid: 'oracle-ai',
          sessionId: 'oracle-ai',
          nickname: 'ORACLE-AI',
          isBot: true,
        }),
      ],
      lastClash: null,
      history: [],
      winnerUid: null,
    });
  };

  const handleSoloLockMove = (card: AnomalyCardId, stance: RealityStance) => {
    if (!soloGame || soloGame.state !== 'selecting') return;
    const human = soloGame.players[0];
    const ai = soloGame.players[1];
    const aiMove = pickOracleMove(ai, human, soloGame.distortion);

    const lockedHuman = {
      ...human,
      lockedCard: card,
      lockedStance: stance,
      locked: true,
    };
    const lockedAi = {
      ...ai,
      lockedCard: aiMove.card,
      lockedStance: aiMove.stance,
      locked: true,
    };

    const { nextP0, nextP1, log } = resolveRealityClash(
      soloGame.round,
      soloGame.distortion,
      lockedHuman,
      lockedAi
    );

    setSoloGame({
      ...soloGame,
      state: 'clash',
      players: [nextP0, nextP1],
      lastClash: log,
      history: [...soloGame.history, log],
    });
  };

  const handleSoloNextRound = () => {
    if (!soloGame || soloGame.state !== 'clash') return;
    const pendingWinner = soloGame.lastClash?.pendingMatchWinnerUid ?? null;

    if (pendingWinner) {
      if (pendingWinner === 'human') {
        if (soundEnabled) playSound('win');
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
      } else if (soundEnabled) {
        playSound('fold');
      }
      setSoloGame({
        ...soloGame,
        state: 'finished',
        winnerUid: pendingWinner,
      });
      return;
    }

    if (soundEnabled) playSound('deal');
    setSoloGame({
      ...soloGame,
      state: 'selecting',
      round: soloGame.round + 1,
      distortion: rollNextDistortion(soloGame.distortion),
      lastClash: null,
    });
  };

  const handleCreateMulti = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    if (soundEnabled) playSound('deal');

    try {
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      const cleanName = nickname.trim() || 'Host';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('realityCheckNick', cleanName);
      }

      let sid = sessionStorage.getItem('realityDraftTabSid');
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('realityDraftTabSid', sid);
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hostPlayer = createInitialPlayer({
        uid: user.uid,
        sessionId: sid,
        nickname: cleanName,
        isBot: false,
      });

      await setDoc(doc(db, 'reality_draft_games', code), {
        creatorId: user.uid,
        state: 'waiting',
        round: 1,
        distortion: rollNextDistortion(),
        players: [hostPlayer],
        lastClash: null,
        history: [],
        winnerUid: null,
        createdAt: Date.now(),
      });

      router.push(`/reality-draft/${code}`);
    } catch (err) {
      console.error(err);
      if (soundEnabled) playSound('error');
      setError('Failed to open Reality Draft rift. Please retry.');
      setBusy(false);
    }
  };

  const handleJoinMulti = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || busy) return;
    setBusy(true);
    setError(null);

    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const snap = await getDoc(doc(db, 'reality_draft_games', code));
      if (!snap.exists()) {
        if (soundEnabled) playSound('error');
        setError('No Reality Draft room found with that code.');
        setBusy(false);
        return;
      }

      const cleanName = nickname.trim();
      if (cleanName && typeof window !== 'undefined') {
        window.localStorage.setItem('realityCheckNick', cleanName);
      }
      const query = cleanName ? `?name=${encodeURIComponent(cleanName)}` : '';
      router.push(`/reality-draft/${code}${query}`);
    } catch (err) {
      console.error(err);
      if (soundEnabled) playSound('error');
      setError('Could not connect to room.');
      setBusy(false);
    }
  };

  if (soloGame) {
    return (
      <RealityDraftArena
        game={soloGame}
        meIdx={0}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onExit={() => setSoloGame(null)}
        onLockMove={handleSoloLockMove}
        onNextRound={handleSoloNextRound}
        onPlayAgain={startSolo}
      />
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative selection:bg-amber-500/20">
      {/* Top Bar */}
      <header className="relative z-10 shrink-0 px-5 py-3.5 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/card-games"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={14} />
          Card Tables
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-400/90">
          1v1 Anomaly Tarot Dueler
        </span>
      </header>

      {/* Main Lobby */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 max-w-4xl w-full mx-auto overflow-y-auto">
        <div className="w-full space-y-5">
          {/* Hero + Floating Matte Tarot Trio */}
          <div className="grid lg:grid-cols-12 gap-5 items-center">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-6 space-y-2.5 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#111113] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400">
                <Sparkles size={12} /> Reality Draft
              </div>
              <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.04] text-zinc-50">
                Draft the{' '}
                <span className="text-amber-400">Arcana.</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto lg:mx-0 leading-relaxed">
                12 Anomaly Cards, 5 rotating World Distortions, and lethal Double Stakes mindgames. Drop your rival from{' '}
                <span className="text-zinc-100 font-medium">{STARTING_HP} HP</span> to 0 or claim{' '}
                <span className="text-amber-400 font-medium">{CROWNS_TO_WIN} Crowns</span>.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 max-w-md mx-auto lg:mx-0">
                <div className="rounded-xl border border-zinc-800 bg-[#111113] px-2.5 py-2 text-left">
                  <Flame className="w-3.5 h-3.5 text-rose-400 mb-1" />
                  <p className="text-[11px] font-semibold text-zinc-100">Distortions</p>
                  <p className="text-[10px] text-zinc-500">Rules shift each turn</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-[#111113] px-2.5 py-2 text-left">
                  <Crown className="w-3.5 h-3.5 text-amber-400 mb-1" />
                  <p className="text-[11px] font-semibold text-zinc-100">Double ×2</p>
                  <p className="text-[10px] text-zinc-500">Bluff for 2× stakes</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-[#111113] px-2.5 py-2 text-left">
                  <Shield className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                  <p className="text-[11px] font-semibold text-zinc-100">Aura Reads</p>
                  <p className="text-[10px] text-zinc-500">Low / Mid / High</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Preview Matte Tarot Trio */}
            <div className="lg:col-span-6 flex items-center justify-center lg:justify-end gap-2.5 sm:gap-3 pt-1">
              {SHOWCASE_CARDS.map((id, i) => {
                const card = ANOMALY_CARDS[id];
                const rot = i === 0 ? -4 : i === 2 ? 4 : 0;
                const tarotAccent =
                  i === 0
                    ? { border: 'border-rose-500/45', badge: 'text-rose-300', ring: '#f43f5e' }
                    : i === 1
                      ? { border: 'border-amber-400/55', badge: 'text-amber-300', ring: '#fbbf24' }
                      : { border: 'border-emerald-500/45', badge: 'text-emerald-300', ring: '#34d399' };
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 14, rotateZ: rot }}
                    animate={{ opacity: 1, y: i === 1 ? -6 : 0, rotateZ: rot }}
                    whileHover={{ y: -12, rotateZ: 0, scale: 1.04 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className={`relative w-[116px] sm:w-[132px] h-[160px] sm:h-[176px] rounded-2xl border p-2.5 flex flex-col justify-between bg-gradient-to-b from-[#17171a] via-[#111113] to-[#0b0b0d] overflow-hidden cursor-default ${tarotAccent.border}`}
                  >
                    <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-white/[0.04]" />
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-zinc-400">{card.roman}</span>
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full border font-mono font-bold text-xs text-zinc-50 bg-zinc-950"
                        style={{ borderColor: tarotAccent.ring }}
                      >
                        {card.basePower}
                      </span>
                    </div>
                    <div className="relative z-10 text-center">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-zinc-100">
                        {card.name}
                      </p>
                      <p className={`mt-0.5 text-[8px] font-mono uppercase tracking-wider ${tarotAccent.badge}`}>
                        {card.shortTag}
                      </p>
                    </div>
                    <p className="relative z-10 rounded-lg bg-zinc-950/90 border border-zinc-800/90 p-1.5 text-[8px] leading-snug text-zinc-400 line-clamp-3">
                      {card.ability}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Shared Callsign Input */}
          <div className="max-w-md mx-auto">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
              Duelist Callsign
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => persistNickname(e.target.value)}
              placeholder="Enter your callsign..."
              maxLength={14}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="max-w-md mx-auto rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 text-center font-medium">
              {error}
            </div>
          )}

          {/* Balanced 2-Card Mode Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 Multiplayer */}
            <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <Users className="w-4 h-4 text-amber-400" /> 1v1 Multiplayer
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                    Live PvP
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Open a private 6-character Tarot Rift or join a rival’s table for simultaneous card clashes.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreateMulti}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-50 hover:bg-white py-2.5 px-4 text-sm font-semibold text-zinc-950 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Swords size={15} />
                  {busy ? 'Opening Rift...' : 'Create 1v1 Room'}
                </button>

                <form onSubmit={handleJoinMulti} className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE"
                    maxLength={8}
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-center font-mono text-sm font-semibold uppercase tracking-[0.22em] text-amber-300 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!joinCode.trim() || busy}
                    className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-100 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Solo vs ORACLE-AI */}
            <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <Bot className="w-4 h-4 text-rose-400" /> Solo vs ORACLE-AI
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                    Instant Match
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Face an AI strategist that reads active World Distortions, times Double Stakes bluffs, and plays around Zero Void.
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                  <span className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300">
                    {STARTING_HP} HP
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800/80 text-amber-300">
                    {CROWNS_TO_WIN} Crowns
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800/80 text-emerald-300">
                    12 Arcana
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={startSolo}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 py-2.5 px-4 text-sm font-semibold text-zinc-100 transition-colors cursor-pointer"
              >
                <Bot size={15} />
                Challenge ORACLE-AI
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
