'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import {
  ArrowLeft,
  Brain,
  Users,
  Bot,
  Sparkles,
  LogIn,
  Shield,
  Eye,
  Skull,
  Zap,
  Layers,
  Heart,
  Snowflake,
  Ghost,
  AlertTriangle,
} from 'lucide-react';
import { playSound } from '@/lib/sounds';
import MindHeistArena from '@/components/mind-heist/MindHeistArena';
import {
  DEFAULT_MAX_SANITY,
  MindHeistPlan,
  MindHeistState,
  SELECTABLE_SANITY_OPTIONS,
  createMindHeistPlayer,
  pickPhantomAiPlan,
  resolveMindHeistRound,
  sanitizePlan,
} from '@/lib/mind-heist';

function getOrCreateMindHeistSid(): string {
  if (typeof window === 'undefined') return 'server';
  let sid = sessionStorage.getItem('mindHeistTabSid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('mindHeistTabSid', sid);
  }
  return sid;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function MindHeistLobbyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxSanity, setMaxSanity] = useState<number>(DEFAULT_MAX_SANITY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo vs PHANTOM-AI inline state
  const [soloState, setSoloState] = useState<MindHeistState | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('realityCheckNick');
    if (saved) setNickname(saved);
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  const ensureNick = (): string => {
    const clean = nickname.trim() || `Phantom-${Math.floor(100 + Math.random() * 900)}`;
    localStorage.setItem('realityCheckNick', clean);
    return clean;
  };

  const startSolo = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setBotThinking(false);
    playSound('deal');
    const clean = ensureNick();
    const sid = getOrCreateMindHeistSid();
    const human = createMindHeistPlayer('local-human', sid, clean, maxSanity, false);
    const bot = createMindHeistPlayer('local-phantom-ai', 'phantom-ai-sid', 'PHANTOM-AI', maxSanity, true);

    setSoloState({
      status: 'planning',
      round: 1,
      maxSanity,
      players: [human, bot],
      history: [],
      winnerIdx: null,
      updatedAt: Date.now(),
    });
  };

  const handleSoloLockPlan = (humanPlan: MindHeistPlan) => {
    setSoloState((prev) => {
      if (!prev || prev.status !== 'planning') return prev;
      const human = prev.players[0];
      const safeHumanPlan = sanitizePlan(humanPlan, human);
      const lockedHuman = {
        ...human,
        currentPlan: safeHumanPlan,
        locked: true,
      };
      return {
        ...prev,
        players: [lockedHuman, prev.players[1]],
        updatedAt: Date.now(),
      };
    });

    setBotThinking(true);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    botTimerRef.current = setTimeout(() => {
      setSoloState((prev) => {
        if (!prev || prev.status !== 'planning') return prev;
        const human = prev.players[0];
        const bot = prev.players[1];
        const aiPlan = pickPhantomAiPlan(bot, human, prev.round);
        const readyState: MindHeistState = {
          ...prev,
          players: [
            human,
            {
              ...bot,
              currentPlan: aiPlan,
              locked: true,
            },
          ],
        };
        return resolveMindHeistRound(readyState);
      });
      setBotThinking(false);
    }, 650);
  };

  const handleSoloNextRound = () => {
    setSoloState((prev) => {
      if (!prev || prev.status !== 'reveal') return prev;
      return {
        ...prev,
        status: 'planning',
        round: prev.round + 1,
        players: prev.players.map((p) => ({
          ...p,
          locked: false,
          nextReady: false,
          currentPlan: null,
        })),
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
      const sid = getOrCreateMindHeistSid();
      const code = generateRoomCode();

      const initial: MindHeistState = {
        status: 'waiting',
        round: 1,
        maxSanity,
        players: [createMindHeistPlayer(cred.user.uid, sid, clean, maxSanity, false)],
        history: [],
        winnerIdx: null,
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, 'mind_heist_games', code), initial);
      playSound('deal');
      router.push(`/mind-heist/${code}`);
    } catch (err) {
      console.error(err);
      setError('Could not open astral room. Check connection and try again.');
      playSound('error');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('Enter a valid 6-character Vault code.');
      playSound('error');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      ensureNick();
      getOrCreateMindHeistSid();
      const snap = await getDoc(doc(db, 'mind_heist_games', code));
      if (!snap.exists()) {
        setError(`Vault "${code}" not found.`);
        playSound('error');
        setBusy(false);
        return;
      }
      playSound('deal');
      router.push(`/mind-heist/${code}`);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to Mind Heist room.');
      playSound('error');
    } finally {
      setBusy(false);
    }
  };

  if (soloState) {
    return (
      <MindHeistArena
        state={soloState}
        meIdx={0}
        isSolo
        isBotThinking={botThinking}
        onBack={() => {
          if (botTimerRef.current) clearTimeout(botTimerRef.current);
          setSoloState(null);
        }}
        onLockPlan={handleSoloLockPlan}
        onNextRound={handleSoloNextRound}
        onRematch={startSolo}
      />
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative selection:bg-amber-500/20">
      {/* Top Bar */}
      <header className="relative z-10 shrink-0 px-5 py-3.5 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tactical Arenas
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-400/90">
          Astral Psychological 1v1
        </span>
      </header>

      {/* Main Lobby */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 max-w-4xl w-full mx-auto overflow-y-auto">
        <div className="w-full space-y-6">
          {/* Hero */}
          <div className="text-center space-y-2.5">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111113] border border-zinc-800 text-amber-400 text-[11px] font-mono uppercase tracking-[0.2em]"
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              Mind Heist
            </motion.div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
              Shield. Trap.{' '}
              <span className="text-amber-400">Read Their Soul.</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Split 12 Neural Energy across 3 Astral Chambers, arm 1 Secret Phantom Trap, call your rival’s Trap for{' '}
              <span className="text-zinc-200 font-medium">Psychic Counter-Read</span> streaks, and deploy 3 Astral Relics.
            </p>
          </div>

          {/* Callsign + Sanity Mode Row */}
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                Phantom Callsign
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={18}
                placeholder="e.g. JokerVex"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-400 focus:outline-none text-sm font-medium text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
            </div>

            <div>
              <span className="block text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                Starting Sanity
              </span>
              <div className="flex gap-1.5">
                {SELECTABLE_SANITY_OPTIONS.map((hp) => {
                  const active = maxSanity === hp;
                  return (
                    <button
                      key={hp}
                      type="button"
                      onClick={() => {
                        playSound('chip');
                        setMaxSanity(hp);
                      }}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-semibold tracking-wider transition-colors cursor-pointer ${
                        active
                          ? 'bg-zinc-50 border-zinc-50 text-zinc-950'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
                      }`}
                    >
                      {hp} HP
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* 2 Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 Live Multiplayer */}
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <Users className="w-4 h-4 text-amber-400" /> 1v1 Multiplayer
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                    Simultaneous PvP
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Open a private 6-character Astral Vault or breach a rival’s frequency. Both players lock secretly and clash simultaneously.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={busy}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Create 1v1 Room ({maxSanity} HP)
                </button>

                <form onSubmit={handleJoinRoom} className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="VAULT CODE"
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

            {/* Solo vs PHANTOM-AI */}
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <Bot className="w-4 h-4 text-indigo-400" /> Solo vs PHANTOM-AI
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                    Adaptive AI
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3.5">
                  Duel an adaptive psychological AI that tracks your favorite target chamber, baits it with Phantom Traps, and times Astral Relics against you.
                </p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-300">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center gap-1 text-center">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>12 Energy Split</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center gap-1 text-center">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    <span>Phantom Traps</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center gap-1 text-center">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Read Streaks</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={startSolo}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold text-sm transition-colors cursor-pointer"
              >
                Enter Solo Heist ({maxSanity} HP)
              </button>
            </div>
          </div>

          {/* 6 Astral Relics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { icon: Layers, name: 'Mirage Split', sub: '50% All-Chamber Splash', iconColor: 'text-indigo-400' },
              { icon: Heart, name: 'Soul Siphon', sub: 'Heal 50% Dmg Dealt', iconColor: 'text-emerald-400' },
              { icon: AlertTriangle, name: 'Paranoia Glitch', sub: '+10 Burn + Glitch UI', iconColor: 'text-rose-400' },
              { icon: Snowflake, name: 'Time Freeze', sub: 'Target Shield → 0', iconColor: 'text-zinc-300' },
              { icon: Ghost, name: 'Doppelganger', sub: 'Copy Relic or +4 Str', iconColor: 'text-indigo-300' },
              { icon: Zap, name: 'Overdrive Core', sub: '2× Strike · 2× Risk', iconColor: 'text-amber-400' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="p-2.5 rounded-xl bg-[#111113] border border-zinc-800 flex flex-col gap-0.5"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-100">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">{item.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
