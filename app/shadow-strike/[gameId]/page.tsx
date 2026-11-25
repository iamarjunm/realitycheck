'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import ShadowStrikeArena from '@/components/shadow-strike/ShadowStrikeArena';
import {
  ShadowStrikeState,
  ShadowWeapon,
  SHADOW_SONAR_CHARGES,
  SHADOW_ORBITAL_CHARGES,
  createShadowPlayer,
  applyShadowWeapon,
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

export default function ShadowStrikeRoomPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const code = gameId.toUpperCase();
  const router = useRouter();

  const [state, setState] = useState<ShadowStrikeState | null>(null);
  const [meIdx, setMeIdx] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    const init = async () => {
      try {
        const cred = auth.currentUser ? { user: auth.currentUser } : await signInAnonymously(auth);
        if (cancelled) return;

        const uid = cred.user.uid;
        const sid = getOrCreateSessionId();
        const savedNick =
          (typeof window !== 'undefined' && localStorage.getItem('realityCheckNick')) ||
          `Agent-${Math.floor(100 + Math.random() * 900)}`;

        const gameRef = doc(db, 'shadow_strike_games', code);

        // Attempt to join seat 2 if open and not already seated
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(gameRef);
          if (!snap.exists()) {
            throw new Error('NOT_FOUND');
          }
          const data = snap.data() as ShadowStrikeState;
          const existingBySid = data.players.findIndex((p) => p.sessionId === sid);
          if (existingBySid >= 0) return;

          if (data.players.length < 2) {
            const p2 = createShadowPlayer(uid, sid, savedNick, false);
            tx.update(gameRef, {
              players: [...data.players, p2],
              status: 'setup',
              updatedAt: Date.now(),
            });
          }
        });

        unsub = onSnapshot(gameRef, (snap) => {
          if (!snap.exists()) {
            setError('This Shadow Strike room no longer exists.');
            return;
          }
          const data = snap.data() as ShadowStrikeState;
          setState(data);

          let idx = data.players.findIndex((p) => p.sessionId === sid);
          if (idx < 0) idx = data.players.findIndex((p) => p.uid === uid);
          setMeIdx(idx);
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NOT_FOUND') {
          setError(`Room "${code}" does not exist.`);
        } else {
          console.error(err);
          setError('Failed to connect to Shadow Strike room.');
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [code]);

  const handleLockFleet = useCallback(
    async (fleet: number[]) => {
      if (meIdx < 0) return;
      const gameRef = doc(db, 'shadow_strike_games', code);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(gameRef);
        if (!snap.exists()) return;
        const data = snap.data() as ShadowStrikeState;
        if (data.status !== 'setup') return;

        const players = data.players.map((p, i) =>
          i === meIdx ? { ...p, fleet: [...fleet], ready: true } : p
        );
        const bothReady = players.length === 2 && players.every((p) => p.ready);

        tx.update(gameRef, {
          players,
          status: bothReady ? 'playing' : 'setup',
          turnIndex: bothReady ? Math.floor(Math.random() * 2) : data.turnIndex,
          updatedAt: Date.now(),
        });
      });
    },
    [code, meIdx]
  );

  const handleFireWeapon = useCallback(
    async (weapon: ShadowWeapon, targetIdx: number) => {
      if (meIdx < 0) return;
      const gameRef = doc(db, 'shadow_strike_games', code);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(gameRef);
        if (!snap.exists()) return;
        const data = snap.data() as ShadowStrikeState;
        const next = applyShadowWeapon(data, meIdx, weapon, targetIdx);
        if (next === data) return;
        tx.set(gameRef, next);
      });
    },
    [code, meIdx]
  );

  const handleRematch = useCallback(async () => {
    const gameRef = doc(db, 'shadow_strike_games', code);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      if (!snap.exists()) return;
      const data = snap.data() as ShadowStrikeState;
      const resetPlayers = data.players.map((p) => ({
        ...p,
        fleet: [],
        ready: false,
        shotsFired: [],
        sonarResults: [],
        sonarLeft: SHADOW_SONAR_CHARGES,
        orbitalLeft: SHADOW_ORBITAL_CHARGES,
      }));
      tx.set(gameRef, {
        status: resetPlayers.length === 2 ? 'setup' : 'waiting',
        players: resetPlayers,
        turnIndex: 0,
        turnNumber: 1,
        winnerIdx: null,
        lastAction: null,
        logs: [],
        updatedAt: Date.now(),
      } satisfies ShadowStrikeState);
    });
  }, [code]);

  if (error) {
    return (
      <div className="min-h-dvh bg-[#06090f] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 text-center space-y-4">
          <p className="text-sm font-bold text-rose-300">{error}</p>
          <button
            onClick={() => router.push('/shadow-strike')}
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm cursor-pointer"
          >
            Back to Shadow Strike Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!state || meIdx < 0) {
    return (
      <div className="min-h-dvh bg-[#06090f] text-slate-300 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Syncing Radar Frequency {code}…
          </p>
        </div>
      </div>
    );
  }

  return (
    <ShadowStrikeArena
      state={state}
      meIdx={meIdx}
      roomCode={code}
      onBack={() => router.push('/shadow-strike')}
      onLockFleet={handleLockFleet}
      onFireWeapon={handleFireWeapon}
      onRematch={handleRematch}
    />
  );
}
