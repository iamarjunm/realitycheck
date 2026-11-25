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
      <div className="h-dvh bg-[#06040a] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#06040a] text-white flex flex-col items-center justify-center p-4 relative">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-rose-600/12 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[450px] h-[350px] bg-amber-500/10 rounded-full blur-[110px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      <Link
        href="/tactical-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={13} /> Tactical Arenas
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-4">
          <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/35 bg-rose-950/50 shadow-[0_0_28px_rgba(244,63,94,0.25)]">
            <Skull className="text-rose-400" size={22} />
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-rose-400 mb-1">
            Mod-Chip Buckshot Duel
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-rose-300 via-rose-500 to-amber-400">
            Glitch Roulette
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-xs mx-auto">
            X-Ray shells, flip polarity, overclock 2× damage, or shoot yourself on a blank for an extra turn.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-rose-500/20 bg-black/65 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-3.5">
            {/* Mode Switch */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('multi');
                }}
                className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'multi'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
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
                className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'solo'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
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
                    <label className="block text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1">
                      Your Codename
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Operative..."
                      maxLength={14}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[9px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-1">
                      <Heart size={10} className="text-rose-400" /> Starting HP
                    </label>
                    <div className="flex gap-1">
                      {([3, 4, 5] as const).map((hp) => (
                        <button
                          key={hp}
                          type="button"
                          onClick={() => {
                            playSound('chip');
                            setMaxHp(hp);
                          }}
                          className={`flex-1 py-2 rounded-xl font-mono font-bold text-xs transition-all ${
                            maxHp === hp
                              ? 'bg-rose-500 text-white'
                              : 'bg-zinc-950 text-zinc-400 border border-white/10 hover:border-white/25'
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
                  className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:opacity-95 transition-opacity shadow-[0_0_24px_rgba(244,63,94,0.3)] disabled:opacity-50"
                >
                  {busy ? 'Loading Chamber...' : 'Create 1v1 Chamber'}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-3 text-xs text-zinc-300 space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> 3 Escalating AI Bosses
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Defeat Script Kiddie (3 HP), Sys-Admin (4 HP), and The Architect (5 HP) in a single run.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound('chamber_spin');
                    router.push('/glitch-roulette/solo');
                  }}
                  className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:opacity-95 transition-opacity shadow-[0_0_24px_rgba(244,63,94,0.3)]"
                >
                  Start Boss Gauntlet
                </button>
              </div>
            )}
          </div>

          {mode === 'multi' && (
            <form onSubmit={handleJoinPvP} className="flex gap-2">
              <input
                type="text"
                placeholder="CHAMBER CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-center font-mono text-xs uppercase tracking-[0.25em] text-rose-100 focus:outline-none focus:border-rose-400"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="bg-white text-black font-black px-5 py-2.5 rounded-xl uppercase tracking-widest text-xs hover:bg-zinc-200 disabled:opacity-40 transition-colors"
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
