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
  const [mode, setMode] = useState<'multi' | 'solo'>('multi');
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#05030c] text-white flex flex-col items-center justify-center p-4 relative selection:bg-fuchsia-500/30">
      {/* Surreal Cosmic Nebula Backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[860px] h-[460px] bg-fuchsia-600/18 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[520px] h-[340px] bg-cyan-500/14 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[480px] h-[320px] bg-amber-500/10 rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      <Link
        href="/card-games"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:border-fuchsia-400/40 hover:text-white transition"
      >
        <ArrowLeft size={13} /> Card Tables
      </Link>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-12 gap-6 items-center">
        {/* Left: Surreal Tarot Pitch + Floating Holo Cards */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-5 text-center lg:text-left"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/35 bg-fuchsia-950/50 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-fuchsia-300">
              <Sparkles size={12} /> 1v1 Anomaly Tarot Dueler
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-[0.95] text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-200 via-cyan-300 to-amber-300">
              Reality Draft
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              12 surreal Anomaly Cards, 5 rotating World Distortions, and lethal Double Stakes mindgames. Drop your rival from{' '}
              <span className="text-cyan-300 font-bold">{STARTING_HP} HP</span> to 0 or claim{' '}
              <span className="text-amber-300 font-bold">{CROWNS_TO_WIN} Crowns</span> to collapse reality.
            </p>
          </div>

          {/* Floating Preview Tarot Trio */}
          <div className="flex items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5 pt-1">
            {SHOWCASE_CARDS.map((id, i) => {
              const card = ANOMALY_CARDS[id];
              const rot = i === 0 ? -5 : i === 2 ? 5 : 0;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 18, rotateZ: rot }}
                  animate={{ opacity: 1, y: i === 1 ? -8 : 0, rotateZ: rot }}
                  whileHover={{ y: -14, rotateZ: 0, scale: 1.06 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className={`relative w-[124px] sm:w-[144px] h-[168px] sm:h-[186px] rounded-2xl border p-2.5 flex flex-col justify-between bg-gradient-to-b from-[#16102b] via-[#0b0818] to-[#05030b] overflow-hidden cursor-default ${card.borderClass} ${card.glowClass}`}
                >
                  <div className={`absolute inset-0 opacity-35 ${card.foilClass}`} />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-400">{card.roman}</span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full border font-black text-sm text-white"
                      style={{ borderColor: card.accentHex, backgroundColor: `${card.accentHex}26` }}
                    >
                      {card.basePower}
                    </span>
                  </div>
                  <div className="relative z-10 text-center">
                    <p className="text-[11px] font-black uppercase tracking-tight text-white">
                      {card.name}
                    </p>
                    <p
                      className="mt-0.5 text-[8px] font-mono uppercase tracking-wider"
                      style={{ color: card.accentHex }}
                    >
                      {card.shortTag}
                    </p>
                  </div>
                  <p className="relative z-10 rounded-lg bg-black/65 border border-white/10 p-1.5 text-[8.5px] leading-tight text-zinc-300 line-clamp-3">
                    {card.ability}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* 3 Quick Pill Highlights */}
          <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto lg:mx-0">
            <div className="rounded-xl border border-white/10 bg-black/50 px-2.5 py-2 text-left">
              <Flame className="w-3.5 h-3.5 text-fuchsia-400 mb-1" />
              <p className="text-[10px] font-black uppercase text-white">Distortions</p>
              <p className="text-[9px] text-zinc-400">Rules mutate every round</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/50 px-2.5 py-2 text-left">
              <Crown className="w-3.5 h-3.5 text-amber-300 mb-1" />
              <p className="text-[10px] font-black uppercase text-white">Double ×2</p>
              <p className="text-[9px] text-zinc-400">Bluff or nuke for 2× dmg</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/50 px-2.5 py-2 text-left">
              <Shield className="w-3.5 h-3.5 text-cyan-300 mb-1" />
              <p className="text-[10px] font-black uppercase text-white">Aura Reads</p>
              <p className="text-[9px] text-zinc-400">Low / Mid / High bluffing</p>
            </div>
          </div>
        </motion.div>

        {/* Right: Matchmaking Console */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 w-full max-w-md mx-auto space-y-3"
        >
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-xs text-rose-200 text-center">
              {error}
            </div>
          )}

          <div className="rounded-3xl border border-fuchsia-400/25 bg-black/70 backdrop-blur-xl p-5 shadow-[0_0_50px_rgba(217,70,239,0.16)] space-y-4">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('multi');
                  if (soundEnabled) playSound('tick');
                }}
                className={`py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                  mode === 'multi'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> 1v1 Live PvP
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('solo');
                  if (soundEnabled) playSound('tick');
                }}
                className={`py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                  mode === 'solo'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> Solo vs ORACLE
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400">
                Duelist Callsign
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => persistNickname(e.target.value)}
                placeholder="Enter your callsign..."
                maxLength={14}
                className="w-full rounded-xl border border-white/15 bg-zinc-950 px-3.5 py-2.5 text-xs font-bold text-white placeholder:text-zinc-600 focus:border-fuchsia-400 focus:outline-none"
              />
            </div>

            {mode === 'multi' ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateMulti}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 py-3 text-xs font-black uppercase tracking-widest text-black shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                <Swords size={15} />
                {busy ? 'Opening Rift...' : 'Create 1v1 Room'}
              </button>
            ) : (
              <button
                type="button"
                onClick={startSolo}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 py-3 text-xs font-black uppercase tracking-widest text-black shadow-lg hover:brightness-110"
              >
                <Bot size={15} />
                Challenge ORACLE-AI
              </button>
            )}
          </div>

          {mode === 'multi' && (
            <form onSubmit={handleJoinMulti} className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={8}
                className="flex-1 rounded-xl border border-white/15 bg-zinc-950/90 px-3 py-2.5 text-center font-mono text-xs uppercase tracking-[0.28em] text-cyan-100 placeholder:text-zinc-600 focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-200 disabled:opacity-40"
              >
                Join
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
