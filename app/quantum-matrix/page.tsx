'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Bot, Cpu, RefreshCw, Sparkles, Users, Zap } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  QuantumMatrixGame,
  applyMove,
  createEmptyBoard,
  createInitialPlayer,
  generateAmpCells,
  pickBestAIMove,
} from '@/lib/quantum-matrix';
import { QuantumMatrixArena } from '@/components/quantum-matrix/QuantumMatrixArena';
import GameArtwork from '@/components/GameArtwork';
import { playSound } from '@/lib/sounds';

const NICK_STORAGE_KEY = 'realityCheckNick';
const TAB_SID_KEY = 'quantumMatrixTabSid';

function getOrCreateTabSid(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem(TAB_SID_KEY);
  if (!sid) {
    sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(TAB_SID_KEY, sid);
  }
  return sid;
}

export default function QuantumMatrixLobbyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'multi' | 'solo'>('multi');
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soloGame, setSoloGame] = useState<QuantumMatrixGame | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NICK_STORAGE_KEY);
      if (saved) setNickname(saved.slice(0, 14));
    } catch {
      // Ignore storage access errors
    }
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(console.error);
    }
  }, []);

  const handleNicknameChange = (value: string) => {
    const cleaned = value.slice(0, 14);
    setNickname(cleaned);
    try {
      localStorage.setItem(NICK_STORAGE_KEY, cleaned);
    } catch {
      // Ignore storage access errors
    }
  };

  const createSoloMatch = useCallback(
    (aiStarts = false): QuantumMatrixGame => ({
      mode: 'solo',
      creatorId: 'human',
      state: 'playing',
      turnIdx: aiStarts ? 1 : 0,
      turnCount: 0,
      board: createEmptyBoard(),
      ampCells: generateAmpCells(),
      players: [
        createInitialPlayer({
          uid: 'human',
          sessionId: 'human',
          nickname: nickname.trim() || 'Operator',
          isBot: false,
        }),
        createInitialPlayer({
          uid: 'minimax-ai',
          sessionId: 'minimax-ai',
          nickname: 'MINIMAX-AI',
          isBot: true,
        }),
      ],
      lastMove: null,
      logs: [],
      winnerIdx: null,
      winnerUid: null,
      createdAt: Date.now(),
    }),
    [nickname]
  );

  const handleStartSolo = () => {
    if (soundEnabled) playSound('deal');
    setSoloGame(createSoloMatch(false));
  };

  const handleSoloRematch = () => {
    if (soundEnabled) playSound('deal');
    setSoloGame((prev) => {
      const prevStarter = prev?.logs[0]?.actor ?? 0;
      return createSoloMatch(prevStarter === 0);
    });
  };

  // Solo AI turn execution with natural tactical cadence
  useEffect(() => {
    if (!soloGame || soloGame.state !== 'playing' || soloGame.turnIdx !== 1) return;
    const timer = setTimeout(() => {
      setSoloGame((prev) => {
        if (!prev || prev.state !== 'playing' || prev.turnIdx !== 1) return prev;
        const aiMove = pickBestAIMove(prev);
        if (!aiMove) return prev;
        const next = applyMove(prev, aiMove.cellIdx, aiMove.value, aiMove.useInvert);
        if (!next) return prev;

        if (soundEnabled && next.lastMove) {
          if (next.lastMove.hijacked.length > 0 || next.lastMove.usedInvert) {
            playSound('paradox');
          } else if (next.lastMove.outflanked.length > 0) {
            playSound('flip');
          } else {
            playSound('deal');
          }
        }
        return next;
      });
    }, 680);
    return () => clearTimeout(timer);
  }, [soloGame, soundEnabled]);

  const handleSoloPlace = (cellIdx: number, value: number, useInvert: boolean) => {
    setSoloGame((prev) => {
      if (!prev || prev.state !== 'playing' || prev.turnIdx !== 0) return prev;
      return applyMove(prev, cellIdx, value, useInvert) ?? prev;
    });
  };

  const handleCreateRoom = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    if (soundEnabled) playSound('deal');
    try {
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      const sid = getOrCreateTabSid();
      const code = Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, 'X');

      const docData: Omit<QuantumMatrixGame, 'gameId' | 'mode'> = {
        creatorId: user.uid,
        state: 'waiting',
        turnIdx: 0,
        turnCount: 0,
        board: createEmptyBoard(),
        ampCells: generateAmpCells(),
        players: [
          createInitialPlayer({
            uid: user.uid,
            sessionId: sid,
            nickname: nickname.trim() || 'Host',
            isBot: false,
          }),
        ],
        lastMove: null,
        logs: [],
        winnerIdx: null,
        winnerUid: null,
        createdAt: Date.now(),
      };

      await setDoc(doc(db, 'quantum_matrix_games', code), docData);
      router.push(`/quantum-matrix/${code}`);
    } catch (err) {
      console.error('Failed to create Quantum Matrix room:', err);
      setError('Could not initialize Quantum Matrix room. Check connection and retry.');
      setBusy(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const snap = await getDoc(doc(db, 'quantum_matrix_games', code));
      if (!snap.exists()) {
        setError(`No Quantum Matrix arena found for code "${code}".`);
        setBusy(false);
        return;
      }
      if (soundEnabled) playSound('chip');
      const query = nickname.trim() ? `?name=${encodeURIComponent(nickname.trim())}` : '';
      router.push(`/quantum-matrix/${code}${query}`);
    } catch (err) {
      console.error('Failed to join Quantum Matrix room:', err);
      setError('Failed to connect to room.');
      setBusy(false);
    }
  };

  if (soloGame) {
    return (
      <QuantumMatrixArena
        game={soloGame}
        meIdx={0}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onExit={() => setSoloGame(null)}
        onPlaceCore={handleSoloPlace}
        onRematch={handleSoloRematch}
        defaultNickname={nickname}
      />
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0c0b0e] atelier-bg text-[#f3eee4] flex flex-col relative">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(212,168,83,0.10), transparent 65%), radial-gradient(ellipse 40% 35% at 15% 85%, rgba(45,90,175,0.10), transparent 60%), radial-gradient(ellipse 40% 35% at 88% 82%, rgba(168,42,64,0.09), transparent 60%)',
        }}
      />

      {/* Top Header */}
      <header className="relative z-20 shrink-0 border-b border-[#d4a853]/15 bg-[#0c0b0e]/85 backdrop-blur-md px-5 h-14 flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="btn-obsidian inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium text-[#e7decb]"
        >
          <ArrowLeft size={14} className="text-[#d4a853]" /> Tactical Arenas
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-[#d4a853]/25 bg-[#16141a]/90 px-3.5 py-1 text-[11px] font-mono tracking-wider uppercase text-[#e6c27a]">
          <Cpu size={12} className="text-[#d4a853]" />
          <span>1v1 Math &amp; Spatial Board</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* LEFT 7 COLS: Key-Art Showcase + Signature Rules */}
          <div className="lg:col-span-7 atelier-card rounded-2xl overflow-hidden flex flex-col justify-between">
            {/* Bespoke Key-Art Banner */}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden border-b border-[#d4a853]/20 bg-[#0a090d]">
              <GameArtwork id="quantum-matrix" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#131117] via-[#131117]/30 to-transparent" />
              <div className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-[#e6c27a]/35 bg-[#0c0b0e]/80 backdrop-blur-md px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
                <Sparkles size={11} /> Salon Strategy · 4×4
              </div>
            </div>

            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f7f2e8] uppercase">
                    Quantum
                  </h1>
                  <span className="font-serif italic text-3xl sm:text-4xl font-normal text-[#e6c27a]">
                    Matrix
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#b9b09f] leading-relaxed">
                  Deploy weighted Power Cores <span className="font-mono text-[#f7f2e8]">1–8</span>{' '}
                  across a brass-inlaid 4×4 board. Spring{' '}
                  <span className="text-[#e6c27a] font-medium">Exact-10 Hijacks</span>, arm your
                  single-use <span className="text-[#8cb4ff] font-medium">Polarity Invert</span>,
                  and dominate 2× Amplifiers &amp; +5 line controls.
                </p>
              </div>

              {/* Inlaid Brass Mechanic Plaques */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl border border-[#d4a853]/25 bg-gradient-to-b from-[#1b181f] to-[#110f14] px-2.5 py-3 shadow-[inset_0_1px_0_rgba(230,194,122,0.16)]">
                  <Zap size={15} className="mx-auto text-[#e6c27a] mb-1" />
                  <div className="text-xs font-mono font-semibold text-[#f7f2e8]">V + E = 10</div>
                  <div className="text-[10px] text-[#9e9484] mt-0.5">Hijack &amp; +1</div>
                </div>
                <div className="rounded-xl border border-[#5b8def]/25 bg-gradient-to-b from-[#171d2c] to-[#101219] px-2.5 py-3 shadow-[inset_0_1px_0_rgba(140,180,255,0.14)]">
                  <RefreshCw size={15} className="mx-auto text-[#8cb4ff] mb-1" />
                  <div className="text-xs font-mono font-semibold text-[#f7f2e8]">Invert ×1</div>
                  <div className="text-[10px] text-[#9e9484] mt-0.5">Flip &gt; V</div>
                </div>
                <div className="rounded-xl border border-[#d4566a]/25 bg-gradient-to-b from-[#23141a] to-[#130d10] px-2.5 py-3 shadow-[inset_0_1px_0_rgba(244,114,132,0.14)]">
                  <Sparkles size={15} className="mx-auto text-[#e6c27a] mb-1" />
                  <div className="text-xs font-mono font-semibold text-[#f7f2e8]">2× &amp; +5</div>
                  <div className="text-[10px] text-[#9e9484] mt-0.5">Amps &amp; Lines</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Command Console */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-3.5">
            {error && (
              <div className="rounded-xl border border-[#d4566a]/45 bg-[#36111a]/80 px-3.5 py-2.5 text-xs text-[#fda4af] text-center">
                {error}
              </div>
            )}

            <div className="atelier-card rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#d4a853]/15 pb-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#b9ae9a]">
                  Match Commissioning
                </span>
                <span className="font-serif italic text-xs text-[#e6c27a]">Table IV</span>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0a090d] border border-[#d4a853]/20">
                <button
                  type="button"
                  onClick={() => setMode('multi')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'multi'
                      ? 'bg-gradient-to-b from-[#e8c67c] to-[#b98a36] text-[#141008] shadow-[inset_0_1px_0_rgba(255,250,235,0.6),0_2px_8px_rgba(212,168,83,0.25)]'
                      : 'text-[#9e9484] hover:text-[#f3eee4]'
                  }`}
                >
                  <Users size={14} /> 1v1 Live PvP
                </button>
                <button
                  type="button"
                  onClick={() => setMode('solo')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'solo'
                      ? 'bg-gradient-to-b from-[#e8c67c] to-[#b98a36] text-[#141008] shadow-[inset_0_1px_0_rgba(255,250,235,0.6),0_2px_8px_rgba(212,168,83,0.25)]'
                      : 'text-[#9e9484] hover:text-[#f3eee4]'
                  }`}
                >
                  <Bot size={14} /> Solo vs AI
                </button>
              </div>

              {/* Callsign */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#b9ae9a] mb-1.5">
                  Operator Callsign
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => handleNicknameChange(e.target.value)}
                  placeholder="Enter callsign..."
                  maxLength={14}
                  className="w-full rounded-xl border border-[#d4a853]/20 bg-[#0a090d] px-3.5 py-2.5 text-sm font-medium text-[#f7f2e8] placeholder:text-[#5d564c] focus:border-[#e6c27a]/70 focus:outline-none transition-colors shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]"
                />
              </div>

              {mode === 'multi' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreateRoom}
                  className="btn-brass w-full py-3 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Initializing Matrix...' : 'Create 1v1 Room'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartSolo}
                  className="btn-brass w-full py-3 rounded-xl font-semibold text-sm cursor-pointer"
                >
                  Challenge MINIMAX-AI
                </button>
              )}

              {/* Join Existing Room */}
              {mode === 'multi' && (
                <div className="pt-3 border-t border-[#d4a853]/15 space-y-2">
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8d8475]">
                    Join Private Table
                  </label>
                  <form onSubmit={handleJoinRoom} className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="6-CHAR CODE"
                      maxLength={8}
                      className="flex-1 rounded-xl border border-[#d4a853]/20 bg-[#0a090d] px-3.5 py-2.5 text-center font-mono text-xs uppercase tracking-[0.25em] text-[#f7f2e8] placeholder:text-[#5d564c] focus:border-[#e6c27a]/70 focus:outline-none transition-colors shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]"
                    />
                    <button
                      type="submit"
                      disabled={!joinCode.trim() || busy}
                      className="btn-obsidian rounded-xl font-semibold px-5 py-2.5 text-xs text-[#e6c27a] cursor-pointer disabled:opacity-40"
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
