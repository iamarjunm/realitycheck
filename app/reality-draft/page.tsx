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
import GameArtwork from '@/components/GameArtwork';
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
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e6c27a', '#e5484d', '#10b981', '#f6efe4'],
        });
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden atelier-bg bg-[#0c0b0e] text-[#f4efe6] flex flex-col relative selection:bg-[#e6c27a]/25">
      {/* Velvet Burgundy & Gold Foil Ambient Salon Lighting */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 45% at 24% 10%, rgba(164, 34, 54, 0.16), transparent 62%), radial-gradient(ellipse 65% 45% at 80% 18%, rgba(230, 194, 122, 0.12), transparent 60%), radial-gradient(ellipse 58% 45% at 50% 100%, rgba(16, 125, 92, 0.1), transparent 65%)',
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 shrink-0 px-5 py-3 border-b border-[#e6c27a]/18 bg-[#0c0b0e]/88 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/card-games"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#b5aa99] hover:text-[#f4efe6] transition-colors"
        >
          <ArrowLeft size={14} className="text-[#e6c27a]" />
          Card Tables
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e6c27a]/25 bg-[#18121a]/90">
          <Crown className="w-3 h-3 text-[#e6c27a]" />
          <span className="text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
            1v1 Anomaly Tarot Dueler
          </span>
        </div>
      </header>

      {/* Main Lobby */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3.5 sm:p-5 max-w-5xl w-full mx-auto overflow-y-auto">
        <div className="w-full space-y-4">
          {/* Framed Key-Art Banner + Floating Gold-Trimmed Tarot Trio */}
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="atelier-card hover:transform-none relative rounded-2xl border border-[#e6c27a]/28 bg-gradient-to-br from-[#1d141d] via-[#130f17] to-[#0d0a10] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.68)]"
          >
            {/* Background Key-Art Banner Layer */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <GameArtwork id="reality-draft" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0e0b11]/95 via-[#130e17]/82 to-[#140e16]/55" />
            <div className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-[#e6c27a]/15" />

            <div className="relative z-10 p-5 sm:p-6 grid lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-6 space-y-2.5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e6c27a]/35 bg-[#0c0b0e]/80 px-3 py-1 text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#e6c27a]">
                  <Sparkles size={12} /> Reality Draft · Arcana Salon
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight leading-[1.03] text-[#faf5eb]">
                  Draft the{' '}
                  <span className="font-serif italic font-normal text-[#e6c27a] drop-shadow-[0_2px_18px_rgba(230,194,122,0.3)]">
                    Arcana.
                  </span>
                </h1>
                <p className="text-xs sm:text-[13px] text-[#c7bca9] max-w-md mx-auto lg:mx-0 leading-relaxed">
                  12 Anomaly Cards, 5 rotating World Distortions, and lethal Double Stakes mindgames. Drop your rival from{' '}
                  <span className="text-[#faf5eb] font-medium">{STARTING_HP} HP</span> to 0 or claim{' '}
                  <span className="text-[#e6c27a] font-medium">{CROWNS_TO_WIN} Crowns</span>.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1 max-w-md mx-auto lg:mx-0">
                  <div className="rounded-xl border border-[#e6c27a]/20 bg-[#0d0a11]/85 px-2.5 py-2 text-left">
                    <Flame className="w-3.5 h-3.5 text-[#f06b70] mb-1" />
                    <p className="text-[11px] font-semibold text-[#faf5eb]">Distortions</p>
                    <p className="text-[9.5px] text-[#9b9080]">Rules shift each turn</p>
                  </div>
                  <div className="rounded-xl border border-[#e6c27a]/20 bg-[#0d0a11]/85 px-2.5 py-2 text-left">
                    <Crown className="w-3.5 h-3.5 text-[#e6c27a] mb-1" />
                    <p className="text-[11px] font-semibold text-[#faf5eb]">Double ×2</p>
                    <p className="text-[9.5px] text-[#9b9080]">Bluff for 2× stakes</p>
                  </div>
                  <div className="rounded-xl border border-[#e6c27a]/20 bg-[#0d0a11]/85 px-2.5 py-2 text-left">
                    <Shield className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                    <p className="text-[11px] font-semibold text-[#faf5eb]">Aura Reads</p>
                    <p className="text-[9.5px] text-[#9b9080]">Low / Mid / High</p>
                  </div>
                </div>
              </div>

              {/* Floating Gold-Trimmed Luxury Tarot Preview Trio */}
              <div className="lg:col-span-6 flex items-center justify-center lg:justify-end gap-2.5 sm:gap-3 pt-1">
                {SHOWCASE_CARDS.map((id, i) => {
                  const card = ANOMALY_CARDS[id];
                  const rot = i === 0 ? -5 : i === 2 ? 5 : 0;
                  const tarotAccent =
                    i === 0
                      ? {
                          border: 'border-[#e5484d]/55',
                          badge: 'text-[#f79da0]',
                          ring: '#e5484d',
                          bg: 'from-[#24131c] via-[#150e15] to-[#0c090f]',
                        }
                      : i === 1
                        ? {
                            border: 'border-[#e6c27a]/75',
                            badge: 'text-[#e6c27a]',
                            ring: '#e6c27a',
                            bg: 'from-[#241c13] via-[#171216] to-[#0d0a0f]',
                          }
                        : {
                            border: 'border-emerald-500/55',
                            badge: 'text-emerald-300',
                            ring: '#10b981',
                            bg: 'from-[#11221d] via-[#111618] to-[#0b0d10]',
                          };
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 14, rotateZ: rot }}
                      animate={{ opacity: 1, y: i === 1 ? -8 : 0, rotateZ: rot }}
                      whileHover={{ y: -14, rotateZ: 0, scale: 1.06 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                      className={`relative w-[112px] sm:w-[130px] h-[156px] sm:h-[176px] rounded-2xl border p-2.5 flex flex-col justify-between bg-gradient-to-b ${tarotAccent.bg} overflow-hidden cursor-default shadow-[0_14px_32px_rgba(0,0,0,0.65)] ${tarotAccent.border}`}
                    >
                      <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#e6c27a]/20" />
                      {i === 1 && <div className="gold-foil absolute inset-0 opacity-25" />}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-[#c5b9a5]">{card.roman}</span>
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full border font-mono font-bold text-xs text-[#faf5eb] bg-[#0b090f]"
                          style={{ borderColor: tarotAccent.ring }}
                        >
                          {card.basePower}
                        </span>
                      </div>
                      <div className="relative z-10 text-center">
                        <p className="font-display text-[10.5px] font-semibold uppercase tracking-wide text-[#faf5eb]">
                          {card.name}
                        </p>
                        <p className={`mt-0.5 text-[8px] font-mono uppercase tracking-wider ${tarotAccent.badge}`}>
                          {card.shortTag}
                        </p>
                      </div>
                      <p className="relative z-10 rounded-lg bg-[#0b090f]/90 border border-[#e6c27a]/15 p-1.5 text-[8px] leading-snug text-[#b9ae9d] line-clamp-3">
                        {card.ability}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* Shared Callsign Input */}
          <div className="max-w-md mx-auto">
            <label className="block text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#b5aa99] mb-1.5">
              Duelist Callsign
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => persistNickname(e.target.value)}
              placeholder="Enter your callsign..."
              maxLength={14}
              className="w-full rounded-xl border border-[#e6c27a]/22 bg-[#110e15] px-3.5 py-2.5 text-sm font-medium text-[#faf5eb] placeholder:text-[#685f54] focus:border-[#e6c27a]/70 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="max-w-md mx-auto rounded-xl border border-[#e5484d]/45 bg-[#d9383a]/15 px-3.5 py-2.5 text-xs text-[#ffb4b6] text-center font-medium">
              {error}
            </div>
          )}

          {/* Balanced 2-Card Mode Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 Multiplayer */}
            <div className="atelier-card relative rounded-2xl border border-[#e6c27a]/24 bg-gradient-to-b from-[#19141f] to-[#110d15] p-5 flex flex-col justify-between gap-4 overflow-hidden">
              <div className="pointer-events-none absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-[#e6c27a]/55 to-transparent" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 font-display text-base font-semibold text-[#faf5eb]">
                    <Users className="w-4 h-4 text-[#e6c27a]" /> 1v1 Multiplayer
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#e6c27a]/12 text-[#e6c27a] border border-[#e6c27a]/30">
                    Live PvP
                  </span>
                </div>
                <p className="text-xs text-[#b8ae9e] leading-relaxed">
                  Open a private 6-character Tarot Rift or join a rival’s velvet table for simultaneous anomaly clashes.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreateMulti}
                  className="btn-brass w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold cursor-pointer disabled:opacity-50"
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
                    className="flex-1 rounded-xl border border-[#e6c27a]/22 bg-[#0b090f] px-3.5 py-2.5 text-center font-mono text-sm font-semibold uppercase tracking-[0.22em] text-[#e6c27a] placeholder:text-[#665e53] focus:border-[#e6c27a]/70 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!joinCode.trim() || busy}
                    className="btn-obsidian rounded-xl px-5 py-2.5 text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-40"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Solo vs ORACLE-AI */}
            <div className="atelier-card relative rounded-2xl border border-[#e5484d]/26 bg-gradient-to-b from-[#1c131b] to-[#110d14] p-5 flex flex-col justify-between gap-4 overflow-hidden">
              <div className="pointer-events-none absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-[#e5484d]/55 to-transparent" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 font-display text-base font-semibold text-[#faf5eb]">
                    <Bot className="w-4 h-4 text-[#f06b70]" /> Solo vs ORACLE-AI
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#e5484d]/12 text-[#f79da0] border border-[#e5484d]/35">
                    Instant Match
                  </span>
                </div>
                <p className="text-xs text-[#b8ae9e] leading-relaxed mb-3">
                  Face an AI strategist that reads active World Distortions, times Double Stakes bluffs, and plays around Zero Void.
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#c9beac]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0b090f] border border-[#e6c27a]/18 text-[#faf5eb]">
                    {STARTING_HP} HP
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0b090f] border border-[#e6c27a]/25 text-[#e6c27a]">
                    {CROWNS_TO_WIN} Crowns
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0b090f] border border-emerald-500/25 text-emerald-300">
                    12 Arcana
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={startSolo}
                className="btn-obsidian w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold cursor-pointer"
              >
                <Bot size={15} className="text-[#e6c27a]" />
                Challenge ORACLE-AI
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
