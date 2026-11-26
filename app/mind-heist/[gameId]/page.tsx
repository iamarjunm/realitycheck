'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import MindHeistArena from '@/components/mind-heist/MindHeistArena';
import {
  DEFAULT_MAX_SANITY,
  MindHeistPlan,
  MindHeistState,
  createMindHeistPlayer,
  dealRandomRelics,
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

export default function MindHeistRoomPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const code = gameId.toUpperCase();
  const router = useRouter();

  const [state, setState] = useState<MindHeistState | null>(null);
  const [meIdx, setMeIdx] = useState<number>(-1);
  const [uid, setUid] = useState<string | null>(null);
  const [sid, setSid] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    const init = async () => {
      try {
        const cred = auth.currentUser ? { user: auth.currentUser } : await signInAnonymously(auth);
        if (cancelled) return;

        const userUid = cred.user.uid;
        const tabSid = getOrCreateMindHeistSid();
        setUid(userUid);
        setSid(tabSid);

        const savedNick =
          (typeof window !== 'undefined' && localStorage.getItem('realityCheckNick')) ||
          `Phantom-${Math.floor(100 + Math.random() * 900)}`;

        const gameRef = doc(db, 'mind_heist_games', code);

        // Transactional auto-join for Seat 2 if open and not already seated
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(gameRef);
          if (!snap.exists()) {
            throw new Error('NOT_FOUND');
          }
          const data = snap.data() as MindHeistState;
          const alreadySeated = data.players.some((p) => p.sessionId === tabSid);
          if (alreadySeated) return;

          if (data.players.length < 2) {
            const p2 = createMindHeistPlayer(
              userUid,
              tabSid,
              savedNick,
              data.maxSanity || DEFAULT_MAX_SANITY,
              false
            );
            tx.update(gameRef, {
              players: [...data.players, p2],
              status: 'planning',
              updatedAt: Date.now(),
            });
          }
        });

        if (cancelled) return;

        unsub = onSnapshot(gameRef, (snap) => {
          if (!snap.exists()) {
            setError('This Mind Heist vault no longer exists.');
            return;
          }
          const data = snap.data() as MindHeistState;
          setState(data);

          let idx = data.players.findIndex((p) => p.sessionId === tabSid);
          if (idx < 0) idx = data.players.findIndex((p) => p.uid === userUid);
          setMeIdx(idx);
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NOT_FOUND') {
          setError(`Vault "${code}" does not exist.`);
        } else {
          console.error(err);
          setError('Failed to link to Mind Heist vault.');
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [code]);

  const handleJoinRoom = useCallback(
    async (nickname: string) => {
      if (!uid || !sid || busy) return;
      setBusy(true);
      try {
        localStorage.setItem('realityCheckNick', nickname);
        const gameRef = doc(db, 'mind_heist_games', code);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(gameRef);
          if (!snap.exists()) return;
          const data = snap.data() as MindHeistState;
          if (data.players.length >= 2 || data.players.some((p) => p.sessionId === sid)) return;
          const p2 = createMindHeistPlayer(
            uid,
            sid,
            nickname,
            data.maxSanity || DEFAULT_MAX_SANITY,
            false
          );
          tx.update(gameRef, {
            players: [...data.players, p2],
            status: 'planning',
            updatedAt: Date.now(),
          });
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, code, sid, uid]
  );

  const handleLockPlan = useCallback(
    async (plan: MindHeistPlan) => {
      if (meIdx < 0 || busy) return;
      setBusy(true);
      try {
        const gameRef = doc(db, 'mind_heist_games', code);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(gameRef);
          if (!snap.exists()) return;
          const data = snap.data() as MindHeistState;
          if (data.status !== 'planning' || !data.players[meIdx]) return;

          const players = data.players.map((p, idx) => {
            if (idx !== meIdx) return p;
            const safePlan = sanitizePlan(plan, p);
            return {
              ...p,
              currentPlan: safePlan,
              locked: true,
            };
          });

          if (players.length === 2 && players[0].locked && players[1].locked) {
            const resolved = resolveMindHeistRound({
              ...data,
              players,
            });
            tx.set(gameRef, resolved);
          } else {
            tx.update(gameRef, {
              players,
              updatedAt: Date.now(),
            });
          }
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, code, meIdx]
  );

  const handleNextRound = useCallback(async () => {
    if (meIdx < 0 || busy) return;
    setBusy(true);
    try {
      const gameRef = doc(db, 'mind_heist_games', code);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(gameRef);
        if (!snap.exists()) return;
        const data = snap.data() as MindHeistState;
        if (data.status !== 'reveal' || !data.players[meIdx]) return;

        const players = data.players.map((p, idx) =>
          idx === meIdx ? { ...p, nextReady: true } : p
        );

        const bothReady = players.length === 2 && players.every((p) => p.nextReady);
        if (bothReady) {
          tx.update(gameRef, {
            status: 'planning',
            round: data.round + 1,
            players: players.map((p) => ({
              ...p,
              locked: false,
              nextReady: false,
              currentPlan: null,
            })),
            updatedAt: Date.now(),
          });
        } else {
          tx.update(gameRef, {
            players,
            updatedAt: Date.now(),
          });
        }
      });
    } finally {
      setBusy(false);
    }
  }, [busy, code, meIdx]);

  const handleRematch = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const gameRef = doc(db, 'mind_heist_games', code);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(gameRef);
        if (!snap.exists()) return;
        const data = snap.data() as MindHeistState;
        const maxHp = data.maxSanity || DEFAULT_MAX_SANITY;

        const resetPlayers = data.players.map((p) => ({
          ...p,
          sanity: maxHp,
          maxSanity: maxHp,
          relics: dealRandomRelics(3),
          usedRelics: [],
          readStreak: 0,
          paranoiaActive: false,
          locked: false,
          nextReady: false,
          currentPlan: null,
          attackHistory: [],
          trapHistory: [],
        }));

        const nextState: MindHeistState = {
          status: resetPlayers.length === 2 ? 'planning' : 'waiting',
          round: 1,
          maxSanity: maxHp,
          players: resetPlayers,
          history: [],
          winnerIdx: null,
          updatedAt: Date.now(),
        };

        tx.set(gameRef, nextState);
      });
    } finally {
      setBusy(false);
    }
  }, [busy, code]);

  if (error) {
    return (
      <div className="min-h-dvh bg-[#05030d] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-[#0b0718] border border-rose-500/45 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <p className="text-sm font-bold text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/mind-heist')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black uppercase tracking-wider text-xs cursor-pointer"
          >
            Back to Mind Heist Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-dvh bg-[#05030d] text-slate-300 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            Synchronizing Astral Vault {code}…
          </p>
        </div>
      </div>
    );
  }

  return (
    <MindHeistArena
      state={state}
      meIdx={meIdx}
      roomCode={code}
      busy={busy}
      onBack={() => router.push('/mind-heist')}
      onJoinRoom={handleJoinRoom}
      onLockPlan={handleLockPlan}
      onNextRound={handleNextRound}
      onRematch={handleRematch}
    />
  );
}
