'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Hexagon, Bot, Users, Footprints, Flame, Zap } from 'lucide-react';
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
import GameArtwork from '@/components/GameArtwork';
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0c0b0e] atelier-bg text-[#f5f0e6] flex flex-col relative">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(230,194,122,0.11), transparent 65%), radial-gradient(ellipse 40% 35% at 82% 85%, rgba(162,38,56,0.10), transparent 60%)',
        }}
      />

      <header className="relative z-20 shrink-0 border-b border-[#d4a853]/18 bg-[#0c0b0e]/85 backdrop-blur-md px-5 h-14 flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="btn-obsidian inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium text-[#e7decb]"
        >
          <ArrowLeft size={14} className="text-[#e6c27a]" /> Tactical Arenas
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d4a853]/28 bg-[#16141a]/90 px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[#e6c27a]">
          <Hexagon size={12} /> Grandmaster Obsidian Board
        </span>
      </header>

      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* LEFT 7 COLS: Key-Art Fractured Board Showcase */}
          <div className="lg:col-span-7 atelier-card rounded-2xl overflow-hidden flex flex-col justify-between border-[#d4a853]/25">
            <div className="relative h-44 sm:h-52 w-full overflow-hidden border-b border-[#d4a853]/22 bg-[#09080c]">
              <GameArtwork id="void-step" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141218] via-[#141218]/25 to-transparent" />
              <div className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-[#e6c27a]/35 bg-[#0c0b0e]/85 backdrop-blur-md px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
                <Hexagon size={11} /> First to 2 Rounds · 7×7
              </div>
            </div>

            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f7f2e8] uppercase">
                    Void
                  </h1>
                  <span className="font-serif italic text-3xl sm:text-4xl text-[#e6c27a]">
                    Step
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#b9b09f] leading-relaxed">
                  Command marble-and-obsidian tiles as the board collapses beneath every stride.
                  Step 1 tile, <span className="text-[#f07687] font-medium">shatter</span> any
                  stone across the arena, and burn 2 gilded{' '}
                  <span className="text-[#e6c27a] font-medium">Blink Jumps</span> to maroon your
                  rival.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl border border-[#d4a853]/25 bg-gradient-to-b from-[#1d1a22] to-[#110f15] px-2.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]">
                  <Footprints size={15} className="mx-auto text-[#f2e2be] mb-1" />
                  <div className="text-xs font-mono font-semibold text-[#f7f2e8]">Step &amp; Drop</div>
                  <div className="text-[10px] text-[#9e9484] mt-0.5">Origin Falls</div>
                </div>
                <div className="rounded-xl border border-[#d44a5e]/30 bg-gradient-to-b from-[#241319] to-[#130b0e] px-2.5 py-3 shadow-[inset_0_1px_0_rgba(253,164,175,0.12)]">
                  <Flame size={15} className="mx-auto text-[#f07687] mb-1" />
                  <div className="text-xs font-mono font-semibold text-[#f7f2e8]">Shatter 1</div>
                  <div className="text-[10px] text-[#9e9484] mt-0.5">Carve Abyss</div>
                </div>
                <div className="rounded-xl border border-[#d4a853]/35 bg-gradient-to-b from-[#221b12] to-[#130f0a] px-2.5 py-3 shadow-[inset_0_1px_0_rgba(230,194,122,0.18)]">
                  <Zap size={15} className="mx-auto text-[#e6c27a] mb-1" />
                  <div className="text-xs font-mono font-semibold text-[#f7f2e8]">2× Blink</div>
                  <div className="text-[10px] text-[#9e9484] mt-0.5">2-Tile Vault</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Match Commissioning Console */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-3.5">
            {error && (
              <div className="rounded-xl border border-[#d44a5e]/45 bg-[#36111a]/80 px-3.5 py-2.5 text-xs text-[#fda4af] text-center">
                {error}
              </div>
            )}

            <div className="atelier-card rounded-2xl p-5 sm:p-6 space-y-4 border-[#d4a853]/25">
              <div className="flex items-center justify-between border-b border-[#d4a853]/18 pb-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#b9ae9a]">
                  Arena Commissioning
                </span>
                <span className="font-serif italic text-xs text-[#e6c27a]">Grandmaster VII</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0a090d] border border-[#d4a853]/22">
                <button
                  type="button"
                  onClick={() => setMode('multi')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'multi'
                      ? 'bg-gradient-to-b from-[#e8c67c] to-[#b98a36] text-[#141008] shadow-[inset_0_1px_0_rgba(255,250,235,0.6)]'
                      : 'text-[#9e9484] hover:text-[#f5f0e6]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> 1v1 Live PvP
                </button>
                <button
                  type="button"
                  onClick={() => setMode('solo')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'solo'
                      ? 'bg-gradient-to-b from-[#e8c67c] to-[#b98a36] text-[#141008] shadow-[inset_0_1px_0_rgba(255,250,235,0.6)]'
                      : 'text-[#9e9484] hover:text-[#f5f0e6]'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" /> Solo vs AI
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#b9ae9a] mb-1.5">
                  Walker Codename
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your codename..."
                  maxLength={14}
                  className="w-full bg-[#0a090d] border border-[#d4a853]/22 focus:border-[#e6c27a]/75 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#f7f2e8] placeholder:text-[#5d564c] focus:outline-none transition-colors shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]"
                />
              </div>

              {mode === 'multi' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreateMulti}
                  className="btn-brass w-full py-3 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Opening Grid...' : 'Create 1v1 Void Arena'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startSolo}
                  className="btn-brass w-full py-3 rounded-xl font-semibold text-sm cursor-pointer"
                >
                  Challenge Void AI
                </button>
              )}

              {mode === 'multi' && (
                <div className="pt-3 border-t border-[#d4a853]/18 space-y-2">
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8d8475]">
                    Join Private Board
                  </label>
                  <form onSubmit={handleJoinMulti} className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ARENA CODE"
                      maxLength={8}
                      className="flex-1 bg-[#0a090d] border border-[#d4a853]/22 focus:border-[#e6c27a]/75 rounded-xl px-3.5 py-2.5 text-center font-mono text-xs uppercase tracking-[0.25em] text-[#f7f2e8] placeholder:text-[#5d564c] focus:outline-none transition-colors shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]"
                    />
                    <button
                      type="submit"
                      disabled={!joinCode.trim() || busy}
                      className="btn-obsidian text-[#e6c27a] font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer disabled:opacity-40"
                    >
                      Join
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
