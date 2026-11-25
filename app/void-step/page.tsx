'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Hexagon, Bot, Users } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  VOID_P0_START,
  VOID_P1_START,
  VoidStepState,
  cellIdx,
  hasAnyLegalMove,
  pickBotVoidMove,
} from '@/lib/void-step';
import { VoidStepArena } from '@/components/void-step/VoidStepArena';
import { playSound } from '@/lib/sounds';

export default function VoidStepPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'multi' | 'solo'>('multi');
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soloGame, setSoloGame] = useState<VoidStepState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) signInAnonymously(auth).catch(console.error);
  }, []);

  const createSoloState = (): VoidStepState => ({
    mode: 'solo',
    creatorId: 'human',
    state: 'playing',
    subPhase: 'move',
    turnIdx: 0,
    round: 1,
    winScore: 2,
    voidCells: [],
    roundWinnerIdx: null,
    winnerUid: null,
    lastEvent: 'Move 1 tile, then shatter any tile to trap Void AI.',
    players: [
      { uid: 'human', sessionId: 'human', nickname: nickname.trim() || 'Walker', pos: { ...VOID_P0_START }, blinksLeft: 2, score: 0 },
      { uid: 'bot', sessionId: 'bot', nickname: 'Void AI', isBot: true, pos: { ...VOID_P1_START }, blinksLeft: 2, score: 0 },
    ],
  });

  const startSolo = () => {
    playSound('deal');
    setSoloGame(createSoloState());
  };

  // Bot turn in Solo
  useEffect(() => {
    if (!soloGame || soloGame.state !== 'playing' || soloGame.turnIdx !== 1) return;
    const timer = setTimeout(() => {
      setSoloGame((prev) => {
        if (!prev || prev.state !== 'playing' || prev.turnIdx !== 1) return prev;
        const bot = prev.players[1];
        const human = prev.players[0];
        const move = pickBotVoidMove(bot, human, prev.voidCells);
        if (!move) {
          const p0Score = human.score + 1;
          const finished = p0Score >= prev.winScore;
          if (soundEnabled) playSound('win');
          if (finished) confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
          return {
            ...prev,
            state: finished ? 'finished' : 'round_over',
            roundWinnerIdx: 0,
            winnerUid: finished ? human.uid : null,
            lastEvent: 'Void AI had zero legal moves!',
            players: [{ ...human, score: p0Score }, bot],
          };
        }

        const nextVoid = [...prev.voidCells, cellIdx(bot.pos.x, bot.pos.y), move.shatterCell];
        const nextBot = {
          ...bot,
          pos: move.movePos,
          blinksLeft: move.usedBlink ? bot.blinksLeft - 1 : bot.blinksLeft,
        };
        if (soundEnabled) playSound('hit');

        if (!hasAnyLegalMove(human, nextBot, nextVoid)) {
          const p1Score = nextBot.score + 1;
          const finished = p1Score >= prev.winScore;
          if (soundEnabled) playSound('fold');
          return {
            ...prev,
            voidCells: nextVoid,
            state: finished ? 'finished' : 'round_over',
            roundWinnerIdx: 1,
            winnerUid: finished ? nextBot.uid : null,
            lastEvent: 'Void AI boxed you in!',
            players: [human, { ...nextBot, score: p1Score }],
          };
        }

        return {
          ...prev,
          voidCells: nextVoid,
          turnIdx: 0,
          subPhase: 'move',
          lastEvent: `Void AI ${move.usedBlink ? 'BLINKED' : 'stepped'} & shattered a tile.`,
          players: [human, nextBot],
        };
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [soloGame, soundEnabled]);

  const handleSoloMove = (x: number, y: number, useBlink: boolean) => {
    if (!soloGame || soloGame.state !== 'playing' || soloGame.turnIdx !== 0 || soloGame.subPhase !== 'move') return;
    const me = soloGame.players[0];
    const nextVoid = [...soloGame.voidCells, cellIdx(me.pos.x, me.pos.y)];
    setSoloGame({
      ...soloGame,
      voidCells: nextVoid,
      subPhase: 'shatter',
      lastEvent: 'Now click any intact tile to shatter it!',
      players: [
        { ...me, pos: { x, y }, blinksLeft: useBlink ? me.blinksLeft - 1 : me.blinksLeft },
        soloGame.players[1],
      ],
    });
  };

  const handleSoloShatter = (x: number, y: number) => {
    if (!soloGame || soloGame.state !== 'playing' || soloGame.turnIdx !== 0 || soloGame.subPhase !== 'shatter') return;
    const nextVoid = [...soloGame.voidCells, cellIdx(x, y)];
    const me = soloGame.players[0];
    const bot = soloGame.players[1];

    if (!hasAnyLegalMove(bot, me, nextVoid)) {
      const p0Score = me.score + 1;
      const finished = p0Score >= soloGame.winScore;
      if (soundEnabled) playSound('win');
      if (finished) confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
      setSoloGame({
        ...soloGame,
        voidCells: nextVoid,
        state: finished ? 'finished' : 'round_over',
        roundWinnerIdx: 0,
        winnerUid: finished ? me.uid : null,
        lastEvent: 'Void AI trapped with 0 legal moves!',
        players: [{ ...me, score: p0Score }, bot],
      });
      return;
    }

    setSoloGame({
      ...soloGame,
      voidCells: nextVoid,
      turnIdx: 1,
      subPhase: 'move',
      lastEvent: 'Void AI calculating...',
    });
  };

  const handleSoloNextRound = () => {
    if (!soloGame) return;
    setSoloGame({
      ...soloGame,
      state: 'playing',
      subPhase: 'move',
      turnIdx: soloGame.round % 2 === 0 ? 0 : 1,
      round: soloGame.round + 1,
      voidCells: [],
      roundWinnerIdx: null,
      lastEvent: 'Fresh 7×7 grid deployed!',
      players: [
        { ...soloGame.players[0], pos: { ...VOID_P0_START }, blinksLeft: 2 },
        { ...soloGame.players[1], pos: { ...VOID_P1_START }, blinksLeft: 2 },
      ],
    });
  };

  const handleCreateMulti = async () => {
    if (!auth.currentUser || busy) return;
    playSound('deal');
    setBusy(true);
    setError(null);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    let sid = sessionStorage.getItem('voidTabSid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2);
      sessionStorage.setItem('voidTabSid', sid);
    }
    try {
      await setDoc(doc(db, 'void_step_games', code), {
        creatorId: auth.currentUser.uid,
        state: 'waiting',
        subPhase: 'move',
        turnIdx: 0,
        round: 1,
        winScore: 2,
        voidCells: [],
        roundWinnerIdx: null,
        winnerUid: null,
        lastEvent: 'Move 1 tile, then shatter any tile.',
        createdAt: Date.now(),
        players: [
          { uid: auth.currentUser.uid, sessionId: sid, nickname: nickname.trim() || 'Host', pos: { ...VOID_P0_START }, blinksLeft: 2, score: 0 },
        ],
      });
      router.push(`/void-step/${code}`);
    } catch {
      setError('Failed to create Void Arena.');
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
      if (!auth.currentUser) await signInAnonymously(auth);
      const snap = await getDoc(doc(db, 'void_step_games', code));
      if (!snap.exists()) {
        setError('No Void Step arena found with that code.');
        setBusy(false);
        return;
      }
      const query = nickname.trim() ? `?name=${encodeURIComponent(nickname.trim())}` : '';
      router.push(`/void-step/${code}${query}`);
    } catch {
      setError('Could not join arena.');
      setBusy(false);
    }
  };

  if (soloGame) {
    return (
      <VoidStepArena
        game={soloGame}
        meIdx={0}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onExit={() => setSoloGame(null)}
        onMove={handleSoloMove}
        onShatter={handleSoloShatter}
        onNextRound={handleSoloNextRound}
        onPlayAgain={startSolo}
      />
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#04060b] text-white flex flex-col items-center justify-center p-4 relative">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-violet-600/12 rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      <Link
        href="/tactical-games"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white"
      >
        <ArrowLeft size={13} /> Tactical Arenas
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-4">
          <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/35 bg-violet-950/50">
            <Hexagon className="text-violet-400" size={22} />
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-violet-400 mb-1">
            Shattering Grid Duel
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-violet-300 via-fuchsia-400 to-cyan-300">
            Void Step
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-xs mx-auto">
            Step 1 tile (your old tile collapses), shatter another tile anywhere, and use 2 Blink jumps to trap your rival in the Void.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-violet-500/20 bg-black/65 backdrop-blur-xl p-5 shadow-2xl space-y-3.5">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-white/10">
              <button
                type="button"
                onClick={() => setMode('multi')}
                className={`py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 ${
                  mode === 'multi' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> 1v1 Live PvP
              </button>
              <button
                type="button"
                onClick={() => setMode('solo')}
                className={`py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 ${
                  mode === 'solo' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> Solo vs AI
              </button>
            </div>

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your codename..."
              maxLength={14}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-violet-400"
            />

            {mode === 'multi' ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateMulti}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 text-black font-black uppercase tracking-widest text-xs"
              >
                {busy ? 'Opening Grid...' : 'Create 1v1 Void Arena'}
              </button>
            ) : (
              <button
                type="button"
                onClick={startSolo}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 text-black font-black uppercase tracking-widest text-xs"
              >
                Challenge Void AI
              </button>
            )}
          </div>

          {mode === 'multi' && (
            <form onSubmit={handleJoinMulti} className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ARENA CODE"
                maxLength={8}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-center font-mono text-xs uppercase tracking-[0.25em] text-violet-100"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="bg-white text-black font-black px-5 py-2.5 rounded-xl uppercase text-xs disabled:opacity-40"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
