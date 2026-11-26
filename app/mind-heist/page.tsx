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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#05030d] text-slate-100 flex flex-col relative">
      {/* Surreal Nebula Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-28 -left-24 w-[480px] h-[480px] rounded-full bg-violet-600/18 blur-[135px]" />
        <div className="absolute -bottom-28 -right-24 w-[480px] h-[480px] rounded-full bg-rose-600/18 blur-[135px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] rounded-full bg-amber-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-grid-white opacity-25" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 shrink-0 px-5 py-3 border-b border-violet-500/25 bg-[#070414]/85 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tactical Arenas
        </Link>
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
          Astral Psychological 1v1
        </span>
      </header>

      {/* Main Lobby */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 max-w-5xl w-full mx-auto overflow-y-auto">
        <div className="w-full space-y-5">
          {/* Hero */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-400/40 text-rose-300 text-[11px] font-black uppercase tracking-[0.22em]"
            >
              <Brain className="w-3.5 h-3.5 text-amber-300" />
              MIND HEIST
            </motion.div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Shield. Trap.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400">
                Read Their Soul.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Split 12 Neural Energy across 3 Astral Chambers, arm 1 Secret Phantom Trap, call your rival’s Trap for{' '}
              <span className="text-violet-300 font-bold">Psychic Counter-Read</span> streaks, and shatter reality with 3 holographic Astral Relics.
            </p>
          </div>

          {/* Callsign + Sanity Mode Row */}
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Phantom Callsign
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={18}
                placeholder="e.g. JokerVex"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c081a]/90 border border-violet-500/35 focus:border-amber-400 focus:outline-none text-sm font-bold text-white"
              />
            </div>

            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
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
                      className={`px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.25)]'
                          : 'bg-[#0c081a]/80 border-white/10 text-slate-400 hover:text-white'
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
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/15 border border-rose-500/45 text-rose-200 text-xs text-center font-semibold">
              {error}
            </div>
          )}

          {/* 2 Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 Live Multiplayer */}
            <div className="bg-[#0b0718]/90 border border-rose-500/35 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-[0_0_40px_rgba(244,63,94,0.12)]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-400">
                    <Users className="w-4 h-4" /> 1v1 Live Mind Duel
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-400/35">
                    Simultaneous PvP
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Open a private 6-character Astral Vault or breach a rival’s frequency. Both players lock secretly and clash simultaneously!
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-amber-400 to-violet-500 hover:brightness-110 text-slate-950 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-[0_0_26px_rgba(244,63,94,0.35)] transition-all cursor-pointer disabled:opacity-50"
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-violet-500/35 focus:border-amber-400 focus:outline-none font-mono text-sm font-bold tracking-widest text-amber-300 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2.5 rounded-xl bg-violet-600/30 hover:bg-violet-500/45 border border-violet-400/40 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Solo vs PHANTOM-AI */}
            <div className="bg-[#0b0718]/90 border border-violet-500/35 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-[0_0_40px_rgba(139,92,246,0.14)]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-violet-300">
                    <Bot className="w-4 h-4 text-amber-300" /> Solo vs PHANTOM-AI
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-200 border border-violet-400/35">
                    Adaptive Mindreader
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Duel an adaptive psychological AI that tracks your favorite target chamber, baits it with Phantom Traps, and times Astral Relics against you.
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300">
                  <div className="p-2 rounded-lg bg-black/50 border border-white/10 flex flex-col items-center gap-1 text-center">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>12 Energy Split</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/50 border border-white/10 flex flex-col items-center gap-1 text-center">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    <span>Phantom Traps</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/50 border border-white/10 flex flex-col items-center gap-1 text-center">
                    <Eye className="w-3.5 h-3.5 text-violet-400" />
                    <span>Read Streaks</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={startSolo}
                className="w-full py-3 rounded-xl bg-violet-600/25 hover:bg-amber-400 hover:text-slate-950 border border-violet-400/50 text-amber-200 font-black uppercase tracking-wider text-sm transition-all cursor-pointer"
              >
                Enter Solo Heist ({maxSanity} HP)
              </button>
            </div>
          </div>

          {/* 6 Astral Relics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { icon: Layers, name: 'Mirage Split', sub: '50% All-Chamber Splash', color: 'text-fuchsia-300 border-fuchsia-500/30' },
              { icon: Heart, name: 'Soul Siphon', sub: 'Heal 50% Dmg Dealt', color: 'text-emerald-300 border-emerald-500/30' },
              { icon: AlertTriangle, name: 'Paranoia Glitch', sub: '+10 Burn + Glitch UI', color: 'text-rose-300 border-rose-500/30' },
              { icon: Snowflake, name: 'Time Freeze', sub: 'Target Shield → 0', color: 'text-cyan-300 border-cyan-500/30' },
              { icon: Ghost, name: 'Doppelganger', sub: 'Copy Relic or +4 Str', color: 'text-violet-300 border-violet-500/30' },
              { icon: Zap, name: 'Overdrive Core', sub: '2× Strike · 2× Risk', color: 'text-amber-300 border-amber-500/30' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className={`p-2.5 rounded-xl bg-[#0a0617]/80 border ${item.color} flex flex-col gap-0.5`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-black">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">{item.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
