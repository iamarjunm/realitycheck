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
import GameArtwork from '@/components/GameArtwork';
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden atelier-bg bg-[#0c0b0e] text-[#f4efe6] flex flex-col relative selection:bg-[#e6c27a]/25">
      {/* Brushed Brass & Emerald Observatory Ambient Lighting */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 44% at 50% 0%, rgba(230, 194, 122, 0.12), transparent 62%), radial-gradient(ellipse 55% 45% at 15% 85%, rgba(16, 185, 129, 0.09), transparent 62%), radial-gradient(ellipse 55% 45% at 88% 85%, rgba(217, 56, 58, 0.08), transparent 62%)',
        }}
      />

      <header className="relative z-10 shrink-0 px-5 py-3 border-b border-[#e6c27a]/18 bg-[#0c0b0e]/88 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#b5aa99] hover:text-[#f4efe6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#e6c27a]" />
          Tactical Arenas
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e6c27a]/25 bg-[#15131a]/90">
          <Sigma className="w-3.5 h-3.5 text-[#e6c27a]" />
          <span className="text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
            IQ · Game Theory · 1v1
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-3.5 sm:p-5 max-w-5xl w-full mx-auto overflow-y-auto">
        <div className="w-full space-y-4">
          {/* Framed Brass Observatory Key-Art Hero Banner */}
          <section className="atelier-card hover:transform-none relative rounded-2xl border border-[#e6c27a]/28 bg-gradient-to-br from-[#17151f] via-[#131118] to-[#0d0c11] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
            <div className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-[#e6c27a]/14 z-20" />

            <div className="grid lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-center gap-2.5 relative z-10">
                <div className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-[#0c0b0e]/85 border border-[#e6c27a]/35 text-[#e6c27a] text-[10.5px] font-mono uppercase tracking-[0.22em]">
                  <Sigma className="w-3.5 h-3.5" />
                  Equilibrium · Brass Observatory
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-[1.03] text-[#faf5eb]">
                  Outthink.{' '}
                  <span className="font-serif italic font-normal text-[#e6c27a] drop-shadow-[0_2px_18px_rgba(230,194,122,0.28)]">
                    Outcalculate.
                  </span>
                </h1>
                <p className="text-xs sm:text-[13px] text-[#c4b9a8] max-w-xl leading-relaxed">
                  Pick 0–100 under rotating Nash equations. Snipe 0 with 100, land Prime strikes, trigger Shift +15 &amp; Mirror Lock protocols, and shatter your rival&apos;s Integrity HP.
                </p>
              </div>

              <div className="lg:col-span-5 relative min-h-[148px] sm:min-h-[172px] lg:min-h-[192px] overflow-hidden border-t lg:border-t-0 lg:border-l border-[#e6c27a]/20 bg-[#0d0c11]">
                <div className="absolute inset-0">
                  <GameArtwork id="equilibrium" />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#131118]/80 via-transparent to-transparent hidden lg:block" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d0c11]/80 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 right-3 z-10 px-2.5 py-0.5 rounded-md bg-[#0c0b0e]/80 border border-[#e6c27a]/30 backdrop-blur-sm text-[9.5px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
                  5 Nash Laws · 0–100 Dial
                </div>
              </div>
            </div>
          </section>

          {/* Callsign + Integrity HP Row */}
          <div className="atelier-card hover:transform-none rounded-2xl border border-[#e6c27a]/18 bg-[#15131a]/90 px-4 py-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <label className="block text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#b5aa99] mb-1.5">
                Player Callsign
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={18}
                placeholder="e.g. NashZero"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0b10] border border-[#e6c27a]/22 focus:border-[#e6c27a]/70 focus:outline-none text-sm font-medium text-[#faf5eb] placeholder:text-[#665e53] transition-colors"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#b5aa99] mb-1.5">
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
                    className={`py-2.5 rounded-xl font-mono text-xs font-semibold border cursor-pointer transition-all ${
                      maxHp === hp
                        ? 'bg-gradient-to-b from-[#f0d394] to-[#c99b49] border-[#f6dfa8] text-[#140f08] shadow-[0_3px_14px_rgba(230,194,122,0.28)]'
                        : 'bg-[#0c0b10] border-[#e6c27a]/18 text-[#b5aa99] hover:border-[#e6c27a]/45 hover:text-[#faf5eb]'
                    }`}
                  >
                    {hp} HP
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-[#d9383a]/15 border border-[#e5484d]/45 text-[#ffb4b6] text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* 2 Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 PvP */}
            <div className="atelier-card relative rounded-2xl border border-[#e6c27a]/24 bg-gradient-to-b from-[#17151e] to-[#110f16] p-5 flex flex-col justify-between gap-4 overflow-hidden">
              <div className="pointer-events-none absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-[#e6c27a]/55 to-transparent" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 font-display text-base font-semibold text-[#faf5eb]">
                    <Users className="w-4 h-4 text-emerald-400" /> 1v1 Multiplayer
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/12 text-emerald-300 border border-emerald-500/30">
                    Real-Time PvP
                  </span>
                </div>
                <p className="text-xs text-[#b8ae9e] leading-relaxed">
                  Host a private 6-character observatory room or join a rival&apos;s mindgame equation table.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleCreateRoom}
                  disabled={busy}
                  className="btn-brass w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0c0b10] border border-[#e6c27a]/22 focus:border-[#e6c27a]/70 focus:outline-none font-mono text-sm font-semibold tracking-widest text-[#e6c27a] placeholder:text-[#665e53] uppercase transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-obsidian px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#e6c27a]" />
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Solo vs EULER-AI */}
            <div className="atelier-card relative rounded-2xl border border-[#e6c27a]/22 bg-gradient-to-b from-[#17151d] to-[#100e15] p-5 flex flex-col justify-between gap-4 overflow-hidden">
              <div className="pointer-events-none absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-emerald-400/45 to-transparent" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 font-display text-base font-semibold text-[#faf5eb]">
                    <Bot className="w-4 h-4 text-[#e6c27a]" /> Solo vs EULER-AI
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#e6c27a]/12 text-[#e6c27a] border border-[#e6c27a]/30">
                    Adaptive Nash AI
                  </span>
                </div>
                <p className="text-xs text-[#b8ae9e] leading-relaxed mb-3.5">
                  Battle an adaptive game-theory engine that reads your number history and sets precision Nash traps.
                </p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-[#e2d8c7]">
                  <div className="p-2 rounded-xl bg-[#0c0b10] border border-[#e6c27a]/18 flex flex-col items-center gap-1 text-center">
                    <Sigma className="w-3.5 h-3.5 text-emerald-400" />
                    <span>5 Laws</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0c0b10] border border-[#e6c27a]/18 flex flex-col items-center gap-1 text-center">
                    <Calculator className="w-3.5 h-3.5 text-[#f4efe6]" />
                    <span>Live Sim</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0c0b10] border border-[#e6c27a]/18 flex flex-col items-center gap-1 text-center">
                    <Zap className="w-3.5 h-3.5 text-[#e6c27a]" />
                    <span>3 Protocols</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startSolo}
                className="btn-obsidian w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-[#e6c27a]" />
                Challenge EULER-AI
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
