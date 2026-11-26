'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import EquilibriumArena from '@/components/equilibrium/EquilibriumArena';
import {
  EquilibriumProtocol,
  EquilibriumState,
  createEquilibriumPlayer,
  evaluateEquilibriumRound,
  generateLawQueue,
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

export default function EquilibriumRoomPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const code = gameId.toUpperCase();
  const router = useRouter();

  const [state, setState] = useState<EquilibriumState | null>(null);
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
          `Thinker-${Math.floor(100 + Math.random() * 900)}`;

        const gameRef = doc(db, 'equilibrium_games', code);

        await runTransaction(db, async (tx) => {
          const snap = await tx.get(gameRef);
          if (!snap.exists()) throw new Error('NOT_FOUND');
          const data = snap.data() as EquilibriumState;
          if (data.players.some((p) => p.sessionId === sid)) return;

          if (data.players.length < 2) {
            const maxHp = data.players[0]?.maxHp ?? 5;
            const p2 = createEquilibriumPlayer(uid, sid, savedNick, maxHp, false);
            tx.update(gameRef, {
              players: [...data.players, p2],
              status: 'picking',
              updatedAt: Date.now(),
            });
          }
        });

        unsub = onSnapshot(gameRef, (snap) => {
          if (!snap.exists()) {
            setError('This Equilibrium room no longer exists.');
            return;
          }
          const data = snap.data() as EquilibriumState;
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
          setError('Failed to connect to Equilibrium room.');
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [code]);

  const handleLockChoice = useCallback(
    async (num: number, protocol: EquilibriumProtocol) => {
      if (meIdx < 0) return;
      const gameRef = doc(db, 'equilibrium_games', code);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(gameRef);
        if (!snap.exists()) return;
        const data = snap.data() as EquilibriumState;
        if (data.status !== 'picking' || data.players.length < 2) return;
        if (data.players[meIdx].lockedNumber !== null) return;

        const cleanProto: EquilibriumProtocol =
          protocol !== 'none' && !data.players[meIdx].usedProtocols.includes(protocol)
            ? protocol
            : 'none';

        const updatedPlayers = data.players.map((p, i) =>
          i === meIdx ? { ...p, lockedNumber: num, lockedProtocol: cleanProto } : p
        );

        const bothLocked = updatedPlayers.every((p) => p.lockedNumber !== null);
        if (!bothLocked) {
          tx.update(gameRef, { players: updatedPlayers, updatedAt: Date.now() });
          return;
        }

        const p0 = updatedPlayers[0];
        const p1 = updatedPlayers[1];
        const summary = evaluateEquilibriumRound(
          data.round,
          data.currentLawId,
          p0.lockedNumber!,
          p1.lockedNumber!,
          p0.lockedProtocol,
          p1.lockedProtocol
        );

        const resolvedPlayers = updatedPlayers.map((p, i) => {
          const dmg = i === 0 ? summary.dmgToP0 : summary.dmgToP1;
          const usedProtocols =
            p.lockedProtocol !== 'none' && !p.usedProtocols.includes(p.lockedProtocol)
              ? [...p.usedProtocols, p.lockedProtocol]
              : p.usedProtocols;
          return {
            ...p,
            hp: Math.max(0, p.hp - dmg),
            usedProtocols,
          };
        });

        const p0Dead = resolvedPlayers[0].hp <= 0;
        const p1Dead = resolvedPlayers[1].hp <= 0;
        const finished = p0Dead || p1Dead;
        const winnerIdx = p0Dead && p1Dead ? null : p1Dead ? 0 : p0Dead ? 1 : null;

        tx.update(gameRef, {
          players: resolvedPlayers,
          status: finished ? 'finished' : 'reveal',
          winnerIdx,
          lastSummary: summary,
          history: [summary, ...data.history],
          readyForNext: [false, false],
          updatedAt: Date.now(),
        });
      });
    },
    [code, meIdx]
  );

  const handleNextRound = useCallback(async () => {
    if (meIdx < 0) return;
    const gameRef = doc(db, 'equilibrium_games', code);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      if (!snap.exists()) return;
      const data = snap.data() as EquilibriumState;
      if (data.status !== 'reveal') return;

      const ready = [...(data.readyForNext ?? [false, false])];
      ready[meIdx] = true;

      if (ready[0] && ready[1]) {
        const nextRound = data.round + 1;
        const nextLaw = data.lawQueue[(nextRound - 1) % data.lawQueue.length];
        tx.update(gameRef, {
          status: 'picking',
          round: nextRound,
          currentLawId: nextLaw,
          players: data.players.map((p) => ({
            ...p,
            lockedNumber: null,
            lockedProtocol: 'none',
          })),
          readyForNext: [false, false],
          updatedAt: Date.now(),
        });
      } else {
        tx.update(gameRef, { readyForNext: ready, updatedAt: Date.now() });
      }
    });
  }, [code, meIdx]);

  const handleRematch = useCallback(async () => {
    const gameRef = doc(db, 'equilibrium_games', code);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      if (!snap.exists()) return;
      const data = snap.data() as EquilibriumState;
      const queue = generateLawQueue();
      const resetPlayers = data.players.map((p) => ({
        ...p,
        hp: p.maxHp,
        lockedNumber: null,
        lockedProtocol: 'none' as EquilibriumProtocol,
        usedProtocols: [],
      }));
      tx.set(gameRef, {
        status: resetPlayers.length === 2 ? 'picking' : 'waiting',
        round: 1,
        currentLawId: queue[0],
        lawQueue: queue,
        players: resetPlayers,
        winnerIdx: null,
        lastSummary: null,
        history: [],
        readyForNext: [false, false],
        updatedAt: Date.now(),
      } satisfies EquilibriumState);
    });
  }, [code]);

  if (error) {
    return (
      <div className="min-h-dvh bg-[#04060d] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-950 border border-rose-500/40 rounded-2xl p-6 text-center space-y-4">
          <p className="text-sm font-bold text-rose-300">{error}</p>
          <button
            onClick={() => router.push('/equilibrium')}
            className="w-full py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-black text-sm cursor-pointer"
          >
            Back to Equilibrium Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!state || meIdx < 0) {
    return (
      <div className="min-h-dvh bg-[#04060d] text-slate-300 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
            Syncing Equilibrium Room {code}…
          </p>
        </div>
      </div>
    );
  }

  return (
    <EquilibriumArena
      state={state}
      meIdx={meIdx}
      roomCode={code}
      onBack={() => router.push('/equilibrium')}
      onLockChoice={handleLockChoice}
      onNextRound={handleNextRound}
      onRematch={handleRematch}
    />
  );
}
