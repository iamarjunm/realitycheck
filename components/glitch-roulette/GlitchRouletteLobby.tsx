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
      <div className="h-dvh bg-[#09090b] flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-50 flex flex-col items-center justify-center p-4 relative">
      <Link
        href="/tactical-games"
        onClick={() => playSound('chip')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
      >
        <ArrowLeft size={14} /> Tactical Arenas
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#111113]">
            <Skull className="text-rose-500" size={22} />
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-rose-400/90 mb-1.5">
            Mod-Chip Buckshot Duel
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Glitch Roulette
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
            X-Ray shells, flip polarity, overclock 2× damage, or shoot yourself on a blank for an extra turn.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-5 space-y-4">
            {/* Mode Switch */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  playSound('chip');
                  setMode('multi');
                }}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'multi'
                    ? 'bg-zinc-50 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
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
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'solo'
                    ? 'bg-zinc-50 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
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
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                      Your Codename
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Operative..."
                      maxLength={14}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 mb-1.5">
                      <Heart size={11} className="text-rose-500" /> Starting HP
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
                          className={`flex-1 py-2 rounded-xl font-mono font-semibold text-xs border transition-colors ${
                            maxHp === hp
                              ? 'border-rose-500/60 bg-rose-500/15 text-rose-300'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
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
                  className="w-full bg-zinc-50 hover:bg-white text-zinc-950 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {busy ? 'Loading Chamber...' : 'Create 1v1 Chamber'}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs text-zinc-300 space-y-1">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> 3 Escalating AI Bosses
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Defeat Script Kiddie (3 HP), Sys-Admin (4 HP), and The Architect (5 HP) in a single run.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound('chamber_spin');
                    router.push('/glitch-roulette/solo');
                  }}
                  className="w-full bg-zinc-50 hover:bg-white text-zinc-950 font-semibold py-3 rounded-xl text-sm transition-colors"
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
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-center font-mono text-xs uppercase tracking-[0.22em] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium px-5 py-2.5 rounded-xl text-xs disabled:opacity-40 transition-colors"
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
