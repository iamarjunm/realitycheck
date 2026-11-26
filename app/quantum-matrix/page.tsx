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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#04060d] text-white flex flex-col items-center justify-center p-4 relative">
      {/* Cyber Ambient Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[820px] h-[440px] rounded-full bg-indigo-600/18 blur-[135px]" />
        <div className="absolute bottom-0 left-1/4 w-[420px] h-[300px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[300px] rounded-full bg-amber-500/12 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)',
            backgroundSize: '38px 38px',
          }}
        />
      </div>

      <Link
        href="/tactical-games"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition"
      >
        <ArrowLeft size={13} /> Tactical Arenas
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md space-y-4"
      >
        {/* Title Hero */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-950/60 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
            <Cpu className="text-cyan-300" size={24} />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-400">
            1v1 Math + Spatial Strategy
          </p>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-200 to-amber-300">
            Quantum Matrix
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Deploy Power Cores <span className="font-mono text-white">1–8</span> on a 4×4 grid.
            Trigger <span className="text-amber-300 font-semibold">Exact-10 Hijacks</span>, arm your
            1-use <span className="text-fuchsia-300 font-semibold">Polarity Invert</span>, and claim
            2× Amplifiers &amp; +5 line bonuses.
          </p>
        </div>

        {/* Mechanic Highlights Pills */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-amber-400/25 bg-amber-950/25 px-2 py-2">
            <Zap size={13} className="mx-auto text-amber-300 mb-0.5" />
            <div className="text-[10px] font-mono font-black text-amber-200">V + E = 10</div>
            <div className="text-[9px] text-zinc-400">Hijack &amp; +1</div>
          </div>
          <div className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-950/25 px-2 py-2">
            <RefreshCw size={13} className="mx-auto text-fuchsia-300 mb-0.5" />
            <div className="text-[10px] font-mono font-black text-fuchsia-200">INVERT ×1</div>
            <div className="text-[9px] text-zinc-400">Flip &gt; V</div>
          </div>
          <div className="rounded-xl border border-cyan-400/25 bg-cyan-950/25 px-2 py-2">
            <Sparkles size={13} className="mx-auto text-cyan-300 mb-0.5" />
            <div className="text-[10px] font-mono font-black text-cyan-200">2× &amp; +5</div>
            <div className="text-[9px] text-zinc-400">Amps &amp; Lines</div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/35 bg-rose-950/45 px-3 py-2 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-2xl border border-indigo-500/25 bg-[#090d1b]/90 backdrop-blur-xl p-5 shadow-2xl space-y-3.5">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/60 border border-white/10">
            <button
              type="button"
              onClick={() => setMode('multi')}
              className={`py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                mode === 'multi'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users size={14} /> 1v1 Live PvP
            </button>
            <button
              type="button"
              onClick={() => setMode('solo')}
              className={`py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 transition ${
                mode === 'solo'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Bot size={14} /> Solo vs AI
            </button>
          </div>

          {/* Callsign */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
              Operator Callsign
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder="Your callsign..."
              maxLength={14}
              className="w-full rounded-xl border border-white/10 bg-black/65 px-3.5 py-2.5 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {mode === 'multi' ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleCreateRoom}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-amber-400 text-black font-black uppercase tracking-widest text-xs hover:brightness-110 transition disabled:opacity-50"
            >
              {busy ? 'Initializing Matrix...' : 'Create 1v1 Room'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSolo}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-300 text-black font-black uppercase tracking-widest text-xs hover:brightness-110 transition"
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
              className="flex-1 rounded-xl border border-white/10 bg-[#090d1b]/90 px-3 py-2.5 text-center font-mono text-xs uppercase tracking-[0.26em] text-cyan-100 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!joinCode.trim() || busy}
              className="rounded-xl bg-white text-black font-black px-5 py-2.5 uppercase text-xs hover:bg-cyan-200 transition disabled:opacity-40"
            >
              Join
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
