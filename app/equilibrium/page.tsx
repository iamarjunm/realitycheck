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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative selection:bg-amber-500/20">
      <header className="relative z-10 shrink-0 px-5 py-3.5 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tactical Arenas
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-400/90">
          IQ · Game Theory · 1v1
        </span>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 max-w-4xl w-full mx-auto overflow-y-auto">
        <div className="w-full space-y-6">
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111113] border border-zinc-800 text-amber-400 text-[11px] font-mono uppercase tracking-[0.2em]">
              <Sigma className="w-3.5 h-3.5" />
              Equilibrium
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
              Outthink.{' '}
              <span className="text-amber-400">Outcalculate.</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Pick 0–100 under rotating Nash equations. Snipe 0 with 100, land Prime strikes, trigger Shift +15 &amp; Mirror Lock protocols, and shatter your rival&apos;s HP.
            </p>
          </div>

          <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                Player Callsign
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={18}
                placeholder="e.g. NashZero"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-400 focus:outline-none text-sm font-medium text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
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
                    className={`py-2.5 rounded-xl font-mono text-xs font-semibold border cursor-pointer transition-colors ${
                      maxHp === hp
                        ? 'bg-zinc-50 border-zinc-50 text-zinc-950'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
                    }`}
                  >
                    {hp} HP
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 PvP */}
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <Users className="w-4 h-4 text-emerald-400" /> 1v1 Multiplayer
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                    Real-Time PvP
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Host a private 6-character room or join a rival&apos;s mindgame equation table.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleCreateRoom}
                  disabled={busy}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-400 focus:outline-none font-mono text-sm font-semibold tracking-widest text-amber-300 placeholder:text-zinc-600 uppercase transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Solo vs EULER-AI */}
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <Bot className="w-4 h-4 text-amber-400" /> Solo vs EULER-AI
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                    Adaptive Nash AI
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3.5">
                  Battle an adaptive game-theory engine that reads your number history and sets traps.
                </p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-300">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center gap-1 text-center">
                    <Sigma className="w-3.5 h-3.5 text-emerald-400" />
                    <span>5 Laws</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center gap-1 text-center">
                    <Calculator className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Live Sim</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center gap-1 text-center">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>3 Protocols</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startSolo}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold text-sm transition-colors cursor-pointer"
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
