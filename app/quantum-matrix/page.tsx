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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative">
      {/* Top Header */}
      <header className="shrink-0 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md px-5 h-14 flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-50 transition-colors"
        >
          <ArrowLeft size={14} /> Tactical Arenas
        </Link>
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-300">
          1v1 Math &amp; Spatial Strategy
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-5"
        >
          {/* Title Hero */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#111113]">
              <Cpu className="text-indigo-400" size={22} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
              Quantum Matrix
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Deploy Power Cores <span className="font-mono text-zinc-100">1–8</span> on a 4×4 grid.
              Trigger <span className="text-amber-400 font-medium">Exact-10 Hijacks</span>, arm your
              1-use <span className="text-indigo-400 font-medium">Polarity Invert</span>, and claim
              2× Amplifiers &amp; +5 line bonuses.
            </p>
          </div>

          {/* Mechanic Highlights Pills */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl border border-zinc-800/90 bg-[#111113] px-2.5 py-2.5">
              <Zap size={14} className="mx-auto text-amber-400 mb-1" />
              <div className="text-[11px] font-mono font-semibold text-zinc-100">V + E = 10</div>
              <div className="text-[10px] text-zinc-400">Hijack &amp; +1</div>
            </div>
            <div className="rounded-xl border border-zinc-800/90 bg-[#111113] px-2.5 py-2.5">
              <RefreshCw size={14} className="mx-auto text-indigo-400 mb-1" />
              <div className="text-[11px] font-mono font-semibold text-zinc-100">Invert ×1</div>
              <div className="text-[10px] text-zinc-400">Flip &gt; V</div>
            </div>
            <div className="rounded-xl border border-zinc-800/90 bg-[#111113] px-2.5 py-2.5">
              <Sparkles size={14} className="mx-auto text-amber-400 mb-1" />
              <div className="text-[11px] font-mono font-semibold text-zinc-100">2× &amp; +5</div>
              <div className="text-[10px] text-zinc-400">Amps &amp; Lines</div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 text-center">
              {error}
            </div>
          )}

          {/* Main Card */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-5 space-y-4">
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => setMode('multi')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mode === 'multi'
                    ? 'bg-zinc-50 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Users size={14} /> 1v1 Live PvP
              </button>
              <button
                type="button"
                onClick={() => setMode('solo')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mode === 'solo'
                    ? 'bg-zinc-50 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Bot size={14} /> Solo vs AI
              </button>
            </div>

            {/* Callsign */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                Operator Callsign
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="Enter callsign..."
                maxLength={14}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none transition-colors"
              />
            </div>

            {mode === 'multi' ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateRoom}
                className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Initializing Matrix...' : 'Create 1v1 Room'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartSolo}
                className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                Challenge MINIMAX-AI
              </button>
            )}
          </div>

          {/* Join Existing Room */}
          {mode === 'multi' && (
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="6-CHAR ROOM CODE"
                maxLength={8}
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-center font-mono text-xs uppercase tracking-[0.25em] text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium px-5 py-2.5 text-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                Join
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
