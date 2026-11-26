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
import GameArtwork from '@/components/GameArtwork';
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#080d0b] atelier-bg text-[#f1ece1] flex flex-col relative">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 48% at 50% 0%, rgba(16,120,84,0.16), transparent 65%), radial-gradient(ellipse 40% 35% at 85% 85%, rgba(212,168,83,0.10), transparent 60%)',
        }}
      />

      {/* Top bar */}
      <header className="relative z-20 shrink-0 px-5 h-14 border-b border-[#c9a55a]/18 bg-[#080d0b]/85 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="btn-obsidian inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium text-[#e5dec9]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#d4a853]" />
          Tactical Arenas
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-[#0e1915]/90 px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-emerald-300">
          <Radar className="w-3.5 h-3.5 text-[#e6c27a]" />
          Submarine War Room · 6×6
        </span>
      </header>

      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-4 sm:p-5 max-w-5xl w-full mx-auto">
        <div className="w-full space-y-4">
          {/* Framed Radar Key-Art Banner + Command Title + Callsign */}
          <div className="atelier-card rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border-[#c9a55a]/25">
            <div className="lg:col-span-5 relative h-40 lg:h-auto min-h-[168px] overflow-hidden border-b lg:border-b-0 lg:border-r border-[#c9a55a]/20 bg-[#07100c]">
              <GameArtwork id="shadow-strike" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0d1411]/90 via-transparent to-transparent" />
              <div className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#07100c]/85 border border-emerald-400/35 text-emerald-300 text-[10px] font-mono uppercase tracking-[0.18em]">
                <Radar className="w-3 h-3 text-[#e6c27a]" />
                Deep Sonar Active
              </div>
            </div>

            <div className="lg:col-span-7 p-5 flex flex-col justify-between gap-3.5 bg-gradient-to-br from-[#101915]/80 to-[#0c110f]/95">
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f6f1e6] uppercase">
                    Shadow
                  </h1>
                  <span className="font-serif italic text-3xl sm:text-4xl text-[#e6c27a]">
                    Strike
                  </span>
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400/90 ml-auto hidden sm:inline">
                    Hunt · Ping · Vaporize
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#aeb9b2] leading-relaxed">
                  Cloak 6 stealth vessels on an olive-brass 6×6 sonar table. Chain direct hits for
                  extra turns, sweep 3×3 Sonar Pings, and unleash a 6-cell Orbital Beam.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1">
                <div className="flex-1">
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9a55a] mb-1.5">
                    Commander Callsign
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={18}
                    placeholder="e.g. GhostZero"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070c0a] border border-[#c9a55a]/25 focus:border-[#e6c27a]/75 focus:outline-none text-sm font-medium text-[#f5f0e4] placeholder:text-[#55615a] transition-colors shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-[#38121b]/85 border border-[#e05263]/45 text-[#fda4af] text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* 2 Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 Live PvP */}
            <div className="atelier-card rounded-2xl p-5 flex flex-col justify-between gap-4 border-[#c9a55a]/22 bg-gradient-to-b from-[#111916]/95 to-[#0b100e]/95">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 font-display text-sm font-semibold text-[#f6f1e6]">
                    <Users className="w-4 h-4 text-emerald-400" /> 1v1 Live Multiplayer
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    Real-Time PvP
                  </span>
                </div>
                <p className="text-xs text-[#9ea9a2] leading-relaxed">
                  Open an encrypted 6-character frequency room or lock onto a rival commander&apos;s
                  war table.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleCreateRoom}
                  disabled={busy}
                  className="btn-brass w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#070c0a] border border-[#c9a55a]/22 focus:border-[#e6c27a]/70 focus:outline-none font-mono text-sm font-medium tracking-widest text-[#f5f0e4] placeholder:text-[#55615a] uppercase transition-colors shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-obsidian px-4 py-2.5 rounded-xl text-[#e6c27a] font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Solo vs Spectre AI */}
            <div className="atelier-card rounded-2xl p-5 flex flex-col justify-between gap-4 border-[#c9a55a]/22 bg-gradient-to-b from-[#111916]/95 to-[#0b100e]/95">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 font-display text-sm font-semibold text-[#f6f1e6]">
                    <Bot className="w-4 h-4 text-[#e6c27a]" /> Solo vs SPECTRE-AI
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1f1910] text-[#e6c27a] border border-[#d4a853]/30">
                    Instant Play
                  </span>
                </div>
                <p className="text-xs text-[#9ea9a2] leading-relaxed mb-3.5">
                  Engage a Hunt-and-Target submarine AI that triangulates Sonar Pings and sweeps
                  lanes with Orbital Beams.
                </p>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-[#d6dfd9]">
                  <div className="p-2.5 rounded-xl bg-[#09100d] border border-[#e05263]/30 flex flex-col items-center gap-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Crosshair className="w-3.5 h-3.5 text-[#f06b7c]" />
                    <span className="font-mono text-[10px]">Chain Hits</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#09100d] border border-emerald-500/30 flex flex-col items-center gap-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Radar className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-[10px]">2× Sonar</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#09100d] border border-[#d4a853]/35 flex flex-col items-center gap-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Zap className="w-3.5 h-3.5 text-[#e6c27a]" />
                    <span className="font-mono text-[10px]">1× Orbital</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startSolo}
                className="btn-obsidian w-full py-3 rounded-xl text-[#f5efe2] font-semibold text-sm cursor-pointer border-[#c9a55a]/30 hover:text-[#e6c27a]"
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
