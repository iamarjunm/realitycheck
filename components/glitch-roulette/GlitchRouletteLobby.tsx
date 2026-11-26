'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Skull, Bot, Users, Heart, Zap } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { buildPvPMagazine, drawPvPChips } from '@/lib/glitch-roulette';
import { playSound } from '@/lib/sounds';
import GameArtwork from '@/components/GameArtwork';

export function GlitchRouletteLobby() {
  const router = useRouter();
  const [mode, setMode] = useState<'multi' | 'solo'>('multi');
  const [nickname, setNickname] = useState('');
  const [maxHp, setMaxHp] = useState<3 | 4 | 5>(4);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCreatePvP = async () => {
    if (!auth.currentUser || busy) return;
    playSound('chamber_spin');
    setBusy(true);
    setError(null);

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    let sid = sessionStorage.getItem('rouletteTabSid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2);
      sessionStorage.setItem('rouletteTabSid', sid);
    }

    const mag = buildPvPMagazine();
    const liveCnt = mag.filter((s) => s === 'live').length;
    const blankCnt = mag.length - liveCnt;

    try {
      await setDoc(doc(db, 'glitch_roulette_games', code), {
        creatorId: auth.currentUser.uid,
        state: 'waiting',
        maxHp,
        chipsPerLoad: 3,
        turnIdx: 0,
        chamber: mag,
        overclocked: false,
        cylinderAngle: 0,
        lastEvent: `CHAMBER LOADED: ${liveCnt} LIVE · ${blankCnt} BLANK`,
        lastFlash: null,
        lastFlashId: '',
        winnerUid: null,
        createdAt: Date.now(),
        players: [
          {
            uid: auth.currentUser.uid,
            sessionId: sid,
            nickname: nickname.trim() || 'Operative 1',
            hp: maxHp,
            chips: drawPvPChips(3, []),
            cuffed: false,
            scannedNext: null,
          },
        ],
      });
      router.push(`/glitch-roulette/${code}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create chamber. Check Firebase permissions.');
      setBusy(false);
    }
  };

  const handleJoinPvP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || busy) return;
    playSound('chip');
    setBusy(true);
    setError(null);

    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      const snap = await getDoc(doc(db, 'glitch_roulette_games', code));
      if (!snap.exists()) {
        setError('No Glitch Roulette chamber found with that code.');
        setBusy(false);
        return;
      }
      const query = nickname.trim() ? `?name=${encodeURIComponent(nickname.trim())}` : '';
      router.push(`/glitch-roulette/${code}${query}`);
    } catch (err) {
      console.error(err);
      setError('Could not join chamber.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="h-dvh bg-[#0c0b0e] atelier-bg flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-[#e6c27a]/25 border-t-[#e6c27a] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-[#0c0b0e] atelier-bg text-[#f5efe2] flex flex-col items-center justify-center px-4 py-14 sm:py-8 relative overflow-x-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 75% 50% at 50% 0%, rgba(168, 28, 36, 0.2), rgba(230, 194, 122, 0.05) 45%, transparent 72%)',
      }}
    >
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />

      <Link
        href="/tactical-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-xl border border-[#e6c27a]/20 bg-[#151216]/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-[#d6cbb8] hover:text-[#f8f2e4] hover:border-[#e6c27a]/45 transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      >
        <ArrowLeft size={14} className="text-[#e6c27a]" /> Tactical Arenas
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-lg space-y-4"
      >
        {/* Framed Key-Art Hero Banner */}
        <div className="atelier-card rounded-2xl overflow-hidden border border-[#e6c27a]/25 shadow-[0_24px_64px_rgba(0,0,0,0.75)]">
          <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-[#120e11]">
            <GameArtwork id="glitch-roulette" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d11] via-[#0f0d11]/45 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e6c27a]/55 to-transparent" />

            <div className="absolute top-3 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#e6c27a]/30 bg-[#0d0b0e]/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
              <Skull size={11} className="text-[#e0525c]" />
              <span>Mod-Chip Buckshot Duel</span>
            </div>

            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#faf4e8] leading-none">
                  Glitch <span className="font-serif italic font-normal text-[#e6c27a]">Roulette</span>
                </h1>
                <p className="mt-1.5 text-xs text-[#cbbda8] max-w-sm leading-relaxed">
                  X-Ray shells, flip polarity, overclock 2× damage, or pull on a blank for an extra turn.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#dc2626]/40 bg-[#450a0a]/60 px-3.5 py-2.5 text-xs text-[#fecaca] text-center shadow-inner">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="atelier-card rounded-2xl p-5 space-y-4">
            {/* Mode Switch */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0a090c] border border-[#e6c27a]/15 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('multi');
                }}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'multi'
                    ? 'bg-gradient-to-b from-[#c8323e] to-[#8f1d27] text-[#fff5f5] border border-[#f87171]/35 shadow-[0_4px_14px_rgba(185,28,28,0.4)]'
                    : 'text-[#9e9282] hover:text-[#ede4d3]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1v1 Live PvP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('solo');
                }}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'solo'
                    ? 'bg-gradient-to-b from-[#e6c27a] to-[#b5893a] text-[#171108] border border-[#f5dfa9]/50 shadow-[0_4px_14px_rgba(230,194,122,0.28)]'
                    : 'text-[#9e9282] hover:text-[#ede4d3]'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>3-Boss Solo</span>
              </button>
            </div>

            {mode === 'multi' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
                      Your Codename
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Operative..."
                      maxLength={14}
                      className="w-full bg-[#0a090c] border border-[#e6c27a]/20 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-1.5">
                      <Heart size={11} className="text-[#e0525c]" /> Starting HP
                    </label>
                    <div className="flex gap-1.5">
                      {([3, 4, 5] as const).map((hp) => (
                        <button
                          key={hp}
                          type="button"
                          onClick={() => {
                            playSound('chip');
                            setMaxHp(hp);
                          }}
                          className={`flex-1 py-2.5 rounded-xl font-mono font-semibold text-xs border transition-all ${
                            maxHp === hp
                              ? 'border-[#e0525c]/70 bg-gradient-to-b from-[#7f1d1d]/55 to-[#450a0a]/60 text-[#fecaca] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                              : 'bg-[#0a090c] text-[#9e9282] border-[#e6c27a]/15 hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
                          }`}
                        >
                          {hp} HP
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreatePvP}
                  className="btn-crimson w-full py-3.5 rounded-xl text-sm font-display font-bold tracking-wide disabled:opacity-50"
                >
                  {busy ? 'Loading Chamber...' : 'Create 1v1 Chamber'}
                </button>
              </>
            ) : (
              <div className="space-y-3.5">
                <div className="rounded-xl border border-[#e6c27a]/20 bg-[#0b0a0e] p-4 text-xs text-[#ddd3c2] space-y-1.5 shadow-inner">
                  <div className="font-display font-semibold text-[#e6c27a] flex items-center gap-1.5 tracking-wide">
                    <Zap className="w-3.5 h-3.5" /> 3 Escalating AI Bosses
                  </div>
                  <p className="text-xs text-[#aba08f] leading-relaxed">
                    Defeat Script Kiddie (3 HP), Sys-Admin (4 HP), and The Architect (5 HP) in a single high-stakes run.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound('chamber_spin');
                    router.push('/glitch-roulette/solo');
                  }}
                  className="btn-brass w-full py-3.5 rounded-xl text-sm font-display font-bold tracking-wide"
                >
                  Start Boss Gauntlet
                </button>
              </div>
            )}
          </div>

          {mode === 'multi' && (
            <form onSubmit={handleJoinPvP} className="atelier-card rounded-2xl p-3 flex gap-2">
              <input
                type="text"
                placeholder="CHAMBER CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="flex-1 bg-[#0a090c] border border-[#e6c27a]/20 rounded-xl px-3.5 py-2.5 text-center font-mono text-xs uppercase tracking-[0.24em] text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 transition-colors"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="btn-obsidian px-5 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
