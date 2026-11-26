'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import {
  Radar,
  ArrowLeft,
  Users,
  Bot,
  Crosshair,
  Zap,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { playSound } from '@/lib/sounds';
import ShadowStrikeArena from '@/components/shadow-strike/ShadowStrikeArena';
import {
  ShadowStrikeState,
  ShadowWeapon,
  createShadowPlayer,
  applyShadowWeapon,
  pickBotShadowAction,
} from '@/lib/shadow-strike';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sid = sessionStorage.getItem('shadowTabSid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('shadowTabSid', sid);
  }
  return sid;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function ShadowStrikeLobbyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo vs AI inline state
  const [soloState, setSoloState] = useState<ShadowStrikeState | null>(null);
  const [botThinking, setBotThinking] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('realityCheckNick');
    if (saved) setNickname(saved);
  }, []);

  const ensureNick = () => {
    const clean = nickname.trim() || `Agent-${Math.floor(100 + Math.random() * 900)}`;
    localStorage.setItem('realityCheckNick', clean);
    return clean;
  };

  // Bot turn runner for Solo mode
  useEffect(() => {
    if (!soloState || soloState.status !== 'playing' || soloState.turnIndex !== 1) return;
    setBotThinking(true);
    const timer = setTimeout(() => {
      setSoloState((prev) => {
        if (!prev || prev.status !== 'playing' || prev.turnIndex !== 1) return prev;
        const bot = prev.players[1];
        const human = prev.players[0];
        const move = pickBotShadowAction(bot, human);
        return applyShadowWeapon(prev, 1, move.weapon, move.target);
      });
      setBotThinking(false);
    }, 850);
    return () => clearTimeout(timer);
  }, [soloState]);

  const startSolo = () => {
    playSound('deal');
    const clean = ensureNick();
    const sid = getOrCreateSessionId();
    const human = createShadowPlayer('local-human', sid, clean, false);
    const bot = createShadowPlayer('local-bot', 'bot-sid', 'SPECTRE-AI', true);
    setSoloState({
      status: 'setup',
      players: [human, bot],
      turnIndex: 0,
      turnNumber: 1,
      winnerIdx: null,
      lastAction: null,
      logs: [],
      updatedAt: Date.now(),
    });
  };

  const handleSoloLockFleet = (fleet: number[]) => {
    setSoloState((prev) => {
      if (!prev) return prev;
      const players = prev.players.map((p, i) =>
        i === 0 ? { ...p, fleet: [...fleet], ready: true } : p
      );
      return {
        ...prev,
        players,
        status: 'playing',
        turnIndex: 0,
        updatedAt: Date.now(),
      };
    });
  };

  const handleSoloFire = (weapon: ShadowWeapon, targetIdx: number) => {
    setSoloState((prev) => {
      if (!prev) return prev;
      return applyShadowWeapon(prev, 0, weapon, targetIdx);
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

      const initial: ShadowStrikeState = {
        status: 'waiting',
        players: [createShadowPlayer(cred.user.uid, sid, clean, false)],
        turnIndex: 0,
        turnNumber: 1,
        winnerIdx: null,
        lastAction: null,
        logs: [],
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, 'shadow_strike_games', code), initial);
      playSound('deal');
      router.push(`/shadow-strike/${code}`);
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
      const snap = await getDoc(doc(db, 'shadow_strike_games', code));
      if (!snap.exists()) {
        setError(`Room "${code}" not found.`);
        playSound('error');
        setBusy(false);
        return;
      }
      playSound('deal');
      router.push(`/shadow-strike/${code}`);
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
      <ShadowStrikeArena
        state={soloState}
        meIdx={0}
        isSolo
        isBotThinking={botThinking}
        onBack={() => setSoloState(null)}
        onLockFleet={handleSoloLockFleet}
        onFireWeapon={handleSoloFire}
        onRematch={startSolo}
      />
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative">
      {/* Top bar */}
      <header className="shrink-0 px-5 h-14 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Tactical Arenas
        </Link>
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-300">
          1v1 Stealth Grid Warfare
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 max-w-4xl w-full mx-auto">
        <div className="w-full space-y-6">
          {/* Hero */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs font-medium">
              <Radar className="w-3.5 h-3.5" />
              Shadow Strike
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
              Hunt. Ping. Vaporize.
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto">
              Hide 6 stealth nodes on a 6×6 dark grid. Land Chain-Hit streaks for extra turns, pulse 3×3 Sonar Pings, and unleash a 6-cell Orbital Beam.
            </p>
          </div>

          {/* Callsign input */}
          <div className="max-w-md mx-auto">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Commander Callsign
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={18}
              placeholder="e.g. GhostZero"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-400 focus:outline-none text-sm font-medium text-zinc-100 placeholder:text-zinc-600 transition-colors"
            />
          </div>

          {error && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* 2 Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 Live PvP */}
            <div className="bg-[#111113] border border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                    <Users className="w-4 h-4 text-emerald-400" /> 1v1 Live Multiplayer
                  </span>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
                    Real-Time PvP
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Create a private 6-character room or join a rival commander&apos;s radar duel.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleCreateRoom}
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-400 focus:outline-none font-mono text-sm font-medium tracking-widest text-zinc-100 placeholder:text-zinc-600 uppercase transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Solo vs Spectre AI */}
            <div className="bg-[#111113] border border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                    <Bot className="w-4 h-4 text-sky-400" /> Solo vs SPECTRE-AI
                  </span>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
                    Instant Play
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3.5">
                  Duel a Hunt-and-Target tactical AI that triangulates Sonar Pings and unleashes Orbital Beams.
                </p>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-300">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-1 text-center">
                    <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                    <span>Chain Hits</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-1 text-center">
                    <Radar className="w-3.5 h-3.5 text-sky-400" />
                    <span>2× Sonar</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-1 text-center">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>1× Orbital</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startSolo}
                className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-semibold text-sm transition-colors cursor-pointer"
              >
                Launch Solo Skirmish
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
