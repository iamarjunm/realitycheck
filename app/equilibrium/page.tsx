'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import {
  ArrowLeft,
  Bot,
  Calculator,
  LogIn,
  Sigma,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { playSound } from '@/lib/sounds';
import EquilibriumArena from '@/components/equilibrium/EquilibriumArena';
import {
  EquilibriumProtocol,
  EquilibriumState,
  createEquilibriumPlayer,
  evaluateEquilibriumRound,
  generateLawQueue,
  pickEulerBotMove,
} from '@/lib/equilibrium';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sid = sessionStorage.getItem('equilibriumTabSid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('equilibriumTabSid', sid);
  }
  return sid;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function EquilibriumLobbyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxHp, setMaxHp] = useState<5 | 7>(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soloState, setSoloState] = useState<EquilibriumState | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('realityCheckNick');
    if (saved) setNickname(saved);
  }, []);

  const ensureNick = () => {
    const clean = nickname.trim() || `Thinker-${Math.floor(100 + Math.random() * 900)}`;
    localStorage.setItem('realityCheckNick', clean);
    return clean;
  };

  const startSolo = () => {
    playSound('deal');
    const clean = ensureNick();
    const sid = getOrCreateSessionId();
    const queue = generateLawQueue();
    setSoloState({
      status: 'picking',
      round: 1,
      currentLawId: queue[0],
      lawQueue: queue,
      players: [
        createEquilibriumPlayer('local-human', sid, clean, maxHp, false),
        createEquilibriumPlayer('local-bot', 'bot-sid', 'EULER-AI', maxHp, true),
      ],
      winnerIdx: null,
      lastSummary: null,
      history: [],
      readyForNext: [false, false],
      updatedAt: Date.now(),
    });
  };

  const handleSoloLock = (num: number, protocol: EquilibriumProtocol) => {
    setSoloState((prev) => {
      if (!prev || prev.status !== 'picking') return prev;
      const botMove = pickEulerBotMove(prev, 1);
      const summary = evaluateEquilibriumRound(
        prev.round,
        prev.currentLawId,
        num,
        botMove.num,
        protocol,
        botMove.protocol
      );

      const players = prev.players.map((p, i) => {
        const chosenNum = i === 0 ? num : botMove.num;
        const chosenProto = i === 0 ? protocol : botMove.protocol;
        const dmg = i === 0 ? summary.dmgToP0 : summary.dmgToP1;
        const usedProtocols =
          chosenProto !== 'none' && !p.usedProtocols.includes(chosenProto)
            ? [...p.usedProtocols, chosenProto]
            : p.usedProtocols;
        return {
          ...p,
          hp: Math.max(0, p.hp - dmg),
          lockedNumber: chosenNum,
          lockedProtocol: chosenProto,
          usedProtocols,
        };
      });

      const p0Dead = players[0].hp <= 0;
      const p1Dead = players[1].hp <= 0;
      const finished = p0Dead || p1Dead;
      const winnerIdx = p0Dead && p1Dead ? null : p1Dead ? 0 : p0Dead ? 1 : null;

      return {
        ...prev,
        players,
        status: finished ? 'finished' : 'reveal',
        winnerIdx,
        lastSummary: summary,
        history: [summary, ...prev.history],
        readyForNext: [false, false],
        updatedAt: Date.now(),
      };
    });
  };

  const handleSoloNextRound = () => {
    setSoloState((prev) => {
      if (!prev) return prev;
      const nextRound = prev.round + 1;
      const nextLaw = prev.lawQueue[(nextRound - 1) % prev.lawQueue.length];
      return {
        ...prev,
        status: 'picking',
        round: nextRound,
        currentLawId: nextLaw,
        players: prev.players.map((p) => ({
          ...p,
          lockedNumber: null,
          lockedProtocol: 'none',
        })),
        readyForNext: [false, false],
        updatedAt: Date.now(),
      };
    });
  };

  const handleCreateRoom = async () => {
    setError(null);
    setBusy(true);
    try {
      const cred = auth.currentUser ? { user: auth.currentUser } : await signInAnonymously(auth);
      const clean = ensureNick();
      const sid = getOrCreateSessionId();
      const code = generateRoomCode();
      const queue = generateLawQueue();

      const initial: EquilibriumState = {
        status: 'waiting',
        round: 1,
        currentLawId: queue[0],
        lawQueue: queue,
        players: [createEquilibriumPlayer(cred.user.uid, sid, clean, maxHp, false)],
        winnerIdx: null,
        lastSummary: null,
        history: [],
        readyForNext: [false, false],
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, 'equilibrium_games', code), initial);
      playSound('deal');
      router.push(`/equilibrium/${code}`);
    } catch (err) {
      console.error(err);
      setError('Could not create room. Check connection and try again.');
      playSound('error');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('Enter a valid 6-character room code.');
      playSound('error');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      ensureNick();
      const snap = await getDoc(doc(db, 'equilibrium_games', code));
      if (!snap.exists()) {
        setError(`Room "${code}" not found.`);
        playSound('error');
        setBusy(false);
        return;
      }
      playSound('deal');
      router.push(`/equilibrium/${code}`);
    } catch (err) {
      console.error(err);
      setError('Failed to join room.');
      playSound('error');
    } finally {
      setBusy(false);
    }
  };

  if (soloState) {
    return (
      <EquilibriumArena
        state={soloState}
        meIdx={0}
        isSolo
        onBack={() => setSoloState(null)}
        onLockChoice={handleSoloLock}
        onNextRound={handleSoloNextRound}
        onRematch={startSolo}
      />
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#04060d] text-slate-100 flex flex-col relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-[480px] h-[380px] rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute -bottom-24 right-1/4 w-[480px] h-[380px] rounded-full bg-violet-500/12 blur-[140px]" />
        <div className="absolute inset-0 bg-grid-white opacity-25" />
      </div>

      <header className="relative z-10 shrink-0 px-5 py-3.5 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tactical Arenas
        </Link>
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400">
          IQ · Game Theory · 1v1
        </span>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 max-w-4xl w-full mx-auto">
        <div className="w-full space-y-5">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-widest">
              <Sigma className="w-3.5 h-3.5" />
              Equilibrium
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Outthink.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">
                Outcalculate.
              </span>
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Pick 0–100 under rotating Nash equations. Snipe 0 with 100, land Prime strikes, trigger Shift +15 & Mirror Lock protocols, and shatter your rival&apos;s HP.
            </p>
          </div>

          <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Player Callsign
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={18}
                placeholder="e.g. NashZero"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 focus:outline-none text-sm font-bold text-white"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Integrity HP
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {([5, 7] as const).map((hp) => (
                  <button
                    key={hp}
                    onClick={() => {
                      playSound('tick');
                      setMaxHp(hp);
                    }}
                    className={`py-2.5 rounded-xl font-mono text-xs font-black border cursor-pointer transition-all ${
                      maxHp === hp
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {hp} HP
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs text-center font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 PvP */}
            <div className="bg-slate-950/85 border border-cyan-500/30 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400">
                    <Users className="w-4 h-4" /> 1v1 Live Multiplayer
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Real-Time PvP
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Host a private 6-character room or join a rival&apos;s mindgame equation table.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleCreateRoom}
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-400 hover:brightness-110 text-slate-950 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(34,211,238,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Create 1v1 Room
                </button>

                <form onSubmit={handleJoinRoom} className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="ROOM CODE"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black border border-white/15 focus:border-cyan-400 focus:outline-none font-mono text-sm font-bold tracking-widest text-cyan-300 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Solo vs EULER-AI */}
            <div className="bg-slate-950/85 border border-violet-500/30 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-violet-400">
                    <Bot className="w-4 h-4" /> Solo vs EULER-AI
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                    Adaptive Nash AI
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Battle an adaptive game-theory engine that reads your number history and sets traps.
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300">
                  <div className="p-2 rounded-lg bg-black/60 border border-white/10 flex flex-col items-center gap-1 text-center">
                    <Sigma className="w-3.5 h-3.5 text-cyan-400" />
                    <span>5 Laws</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/60 border border-white/10 flex flex-col items-center gap-1 text-center">
                    <Calculator className="w-3.5 h-3.5 text-violet-400" />
                    <span>Live Sim</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/60 border border-white/10 flex flex-col items-center gap-1 text-center">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>3 Protocols</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startSolo}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-violet-500 hover:text-slate-950 border border-violet-400/40 text-violet-300 font-black uppercase tracking-wider text-sm transition-all cursor-pointer"
              >
                Challenge EULER-AI
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
