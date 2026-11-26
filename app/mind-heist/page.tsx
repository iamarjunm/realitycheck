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
import GameArtwork from '@/components/GameArtwork';
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden atelier-bg bg-[#0c0b0e] text-[#f4efe6] flex flex-col relative selection:bg-[#e6c27a]/25">
      {/* Theatrical Noir Atelier Ambient Lighting */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 46% at 22% 8%, rgba(217, 56, 58, 0.14), transparent 62%), radial-gradient(ellipse 62% 48% at 84% 16%, rgba(230, 194, 122, 0.11), transparent 60%), radial-gradient(ellipse 55% 40% at 50% 100%, rgba(108, 63, 184, 0.12), transparent 65%)',
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 shrink-0 px-5 py-3 border-b border-[#e6c27a]/18 bg-[#0c0b0e]/88 backdrop-blur-md flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#b5aa99] hover:text-[#f4efe6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#e6c27a]" />
          Tactical Arenas
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e6c27a]/25 bg-[#16131c]/90">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e5484d] shadow-[0_0_8px_rgba(229,72,77,0.85)]" />
          <span className="text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
            Astral Psychological 1v1
          </span>
        </div>
      </header>

      {/* Main Lobby */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3.5 sm:p-5 max-w-5xl w-full mx-auto overflow-y-auto">
        <div className="w-full space-y-4">
          {/* Framed Key-Art Hero Banner */}
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="atelier-card hover:transform-none relative rounded-2xl border border-[#e6c27a]/28 bg-gradient-to-br from-[#191521] via-[#131019] to-[#0d0b11] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
          >
            {/* Subtle inner brass trim */}
            <div className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-[#e6c27a]/12 z-20" />

            <div className="grid lg:grid-cols-12 items-stretch">
              {/* Left Editorial Copy */}
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-center gap-2.5 relative z-10">
                <div className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-[#0c0b0e]/85 border border-[#e6c27a]/35 text-[#e6c27a] text-[10.5px] font-mono uppercase tracking-[0.22em]">
                  <Brain className="w-3.5 h-3.5 text-[#e5484d]" />
                  Mind Heist · Astral Vault
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-[1.03] text-[#faf5eb]">
                  Shield. Trap.{' '}
                  <span className="font-serif italic font-normal text-[#e6c27a] drop-shadow-[0_2px_18px_rgba(230,194,122,0.28)]">
                    Read Their Soul.
                  </span>
                </h1>
                <p className="text-xs sm:text-[13px] text-[#c4b9a8] max-w-xl leading-relaxed">
                  Split 12 Neural Energy across 3 Astral Chambers, arm 1 Secret Phantom Trap, call your rival’s Trap for{' '}
                  <span className="text-[#f4efe6] font-medium">Psychic Counter-Read</span> streaks, and deploy 3 gilded Astral Relics.
                </p>
              </div>

              {/* Right Framed Bespoke Key Art */}
              <div className="lg:col-span-5 relative min-h-[148px] sm:min-h-[172px] lg:min-h-[192px] overflow-hidden border-t lg:border-t-0 lg:border-l border-[#e6c27a]/20 bg-[#0d0a12]">
                <div className="absolute inset-0">
                  <GameArtwork id="mind-heist" />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#14111b]/80 via-transparent to-transparent hidden lg:block" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d0a12]/80 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 right-3 z-10 px-2.5 py-0.5 rounded-md bg-[#0c0b0e]/80 border border-[#e6c27a]/30 backdrop-blur-sm text-[9.5px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
                  3-Ring Vault · 6 Relics
                </div>
              </div>
            </div>
          </motion.section>

          {/* Callsign + Sanity Mode Row */}
          <div className="atelier-card hover:transform-none rounded-2xl border border-[#e6c27a]/18 bg-[#14111a]/90 px-4 py-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#b5aa99] mb-1.5">
                Phantom Callsign
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={18}
                placeholder="e.g. JokerVex"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b090f] border border-[#e6c27a]/22 focus:border-[#e6c27a]/70 focus:outline-none text-sm font-medium text-[#f8f3ea] placeholder:text-[#685f54] transition-colors"
              />
            </div>

            <div>
              <span className="block text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#b5aa99] mb-1.5">
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
                      className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer ${
                        active
                          ? 'bg-gradient-to-b from-[#f0d394] to-[#c99b49] border-[#f6dfa8] text-[#140f08] shadow-[0_3px_14px_rgba(230,194,122,0.28)]'
                          : 'bg-[#0b090f] border-[#e6c27a]/18 text-[#b5aa99] hover:border-[#e6c27a]/45 hover:text-[#f8f3ea]'
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
            <div className="max-w-md mx-auto p-3 rounded-xl bg-[#d9383a]/15 border border-[#e5484d]/45 text-[#ffb4b6] text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* 2 Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1v1 Live Multiplayer */}
            <div className="atelier-card relative rounded-2xl border border-[#e6c27a]/24 bg-gradient-to-b from-[#181420] to-[#110e16] p-5 flex flex-col justify-between gap-4 overflow-hidden">
              <div className="pointer-events-none absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-[#e6c27a]/50 to-transparent" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 font-display text-base font-semibold text-[#faf5eb]">
                    <Users className="w-4 h-4 text-[#e6c27a]" /> 1v1 Multiplayer
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#e6c27a]/12 text-[#e6c27a] border border-[#e6c27a]/30">
                    Simultaneous PvP
                  </span>
                </div>
                <p className="text-xs text-[#b8ae9e] leading-relaxed">
                  Open a private 6-character Astral Vault or breach a rival’s frequency. Both players lock secretly and clash simultaneously.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={busy}
                  className="btn-brass w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Create 1v1 Heist ({maxSanity} HP)
                </button>

                <form onSubmit={handleJoinRoom} className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="VAULT CODE"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0b090f] border border-[#e6c27a]/22 focus:border-[#e6c27a]/70 focus:outline-none font-mono text-sm font-semibold tracking-widest text-[#e6c27a] placeholder:text-[#665e53] uppercase transition-colors"
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

            {/* Solo vs PHANTOM-AI */}
            <div className="atelier-card relative rounded-2xl border border-[#e5484d]/28 bg-gradient-to-b from-[#1b131d] to-[#110d15] p-5 flex flex-col justify-between gap-4 overflow-hidden">
              <div className="pointer-events-none absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-[#e5484d]/55 to-transparent" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 font-display text-base font-semibold text-[#faf5eb]">
                    <Bot className="w-4 h-4 text-[#f06b70]" /> Solo vs PHANTOM-AI
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#e5484d]/12 text-[#f79da0] border border-[#e5484d]/35">
                    Adaptive AI
                  </span>
                </div>
                <p className="text-xs text-[#b8ae9e] leading-relaxed mb-3.5">
                  Duel an adaptive psychological AI that tracks your favorite target chamber, baits it with Phantom Traps, and times Astral Relics against you.
                </p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-[#e2d8c7]">
                  <div className="p-2 rounded-xl bg-[#0b090f]/90 border border-[#e6c27a]/18 flex flex-col items-center gap-1 text-center">
                    <Shield className="w-3.5 h-3.5 text-[#e6c27a]" />
                    <span>12 Energy Split</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0b090f]/90 border border-[#e5484d]/22 flex flex-col items-center gap-1 text-center">
                    <Skull className="w-3.5 h-3.5 text-[#f06b70]" />
                    <span>Phantom Traps</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0b090f]/90 border border-[#8b7cf6]/25 flex flex-col items-center gap-1 text-center">
                    <Eye className="w-3.5 h-3.5 text-[#b4a7ff]" />
                    <span>Read Streaks</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={startSolo}
                className="btn-crimson w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                Challenge PHANTOM-AI ({maxSanity} HP)
              </button>
            </div>
          </div>

          {/* 6 Astral Relics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { icon: Layers, name: 'Mirage Split', sub: '50% All-Chamber Splash', iconColor: 'text-[#b4a7ff]' },
              { icon: Heart, name: 'Soul Siphon', sub: 'Heal 50% Dmg Dealt', iconColor: 'text-emerald-400' },
              { icon: AlertTriangle, name: 'Paranoia Glitch', sub: '+10 Burn + Glitch UI', iconColor: 'text-[#f06b70]' },
              { icon: Snowflake, name: 'Time Freeze', sub: 'Target Shield → 0', iconColor: 'text-[#f4efe6]' },
              { icon: Ghost, name: 'Doppelganger', sub: 'Copy Relic or +4 Str', iconColor: 'text-[#c4b5fd]' },
              { icon: Zap, name: 'Overdrive Core', sub: '2× Strike · 2× Risk', iconColor: 'text-[#e6c27a]' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="atelier-card p-2.5 rounded-xl bg-[#14111b]/90 border border-[#e6c27a]/18 hover:border-[#e6c27a]/40 transition-colors flex flex-col gap-0.5"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f4efe6]">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="text-[10px] text-[#9b9080] truncate">{item.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
