'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback, Suspense } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, runTransaction } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Action,
  ArenaMapId,
  ChronosGameState,
  ChronosPlayer,
  Pos,
  TickResult,
  pickRoundMap,
  simulateTicks,
} from '@/lib/chronos';
import { playSound } from '@/lib/sounds';
import { ChronosArena } from '@/components/chronos/ChronosArena';

interface FirestoreChronosDoc {
  creatorId: string;
  state: 'waiting' | 'programming' | 'executing' | 'round_over' | 'finished';
  players: ChronosPlayer[];
  turn: number;
  round?: number;
  winScore?: number;
  mapId?: ArenaMapId;
  obstacles?: Pos[];
  roundWinnerIdx?: number | null;
  matchWinner: string | null;
  executionResults?: TickResult[] | null;
  executionId?: string | null;
}

function MultiChronosContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = (params.gameId as string).toUpperCase();
  const initialName = (searchParams.get('name') || '').slice(0, 16);

  const [gameDoc, setGameDoc] = useState<FirestoreChronosDoc | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [localSessionId, setLocalSessionId] = useState('');
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [currentTick, setCurrentTick] = useState(-1);

  const autoJoinedRef = useRef(false);
  const lastExecIdRef = useRef<string | null>(null);

  const sfx = useCallback(
    (type: Parameters<typeof playSound>[0]) => {
      if (soundEnabled) playSound(type);
    },
    [soundEnabled]
  );

  // Per-tab session ID so 2 tabs on the same browser can play each other cleanly
  useEffect(() => {
    let sid = sessionStorage.getItem('chronosTabSid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2);
      sessionStorage.setItem('chronosTabSid', sid);
    }
    setLocalSessionId(sid);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) setUid(u.uid);
      else {
        try {
          const cred = await signInAnonymously(auth);
          setUid(cred.user.uid);
        } catch (err) {
          console.error('Auth failed:', err);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!gameId) return;
    const path = `chronos_assassin_games/${gameId}`;
    const unsub = onSnapshot(
      doc(db, 'chronos_assassin_games', gameId),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setGameDoc(snap.data() as FirestoreChronosDoc);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return () => unsub();
  }, [gameId]);

  const meIdx = useMemo(() => {
    if (!gameDoc || !Array.isArray(gameDoc.players)) return -1;
    if (localSessionId) {
      const byTab = gameDoc.players.findIndex((p) => p.sessionId === localSessionId);
      if (byTab !== -1) return byTab;
    }
    if (uid) {
      return gameDoc.players.findIndex((p) => p.uid === uid);
    }
    return -1;
  }, [gameDoc, localSessionId, uid]);

  const meIdxRef = useRef(meIdx);
  useEffect(() => {
    meIdxRef.current = meIdx;
  }, [meIdx]);

  const joinGame = useCallback(
    async (nickname: string) => {
      if (!uid || !localSessionId || busy) return;
      setBusy(true);
      const path = `chronos_assassin_games/${gameId}`;
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'chronos_assassin_games', gameId);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() as FirestoreChronosDoc;
          if (data.players.length >= 2) return;
          if (data.players.some((p) => p.sessionId === localSessionId)) return;

          const p: ChronosPlayer = {
            uid,
            sessionId: localSessionId,
            nickname: nickname.slice(0, 16),
            color: data.players.length === 0 ? 'cyan' : 'rose',
            score: 0,
            ready: false,
            readyForNext: false,
            actions: ['W', 'W', 'W', 'W', 'W'],
            pastActions: [],
          };
          const updated = [...data.players, p];
          tx.update(ref, {
            players: updated,
            state: updated.length === 2 ? 'programming' : 'waiting',
          });
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } finally {
        setBusy(false);
      }
    },
    [busy, gameId, localSessionId, uid]
  );

  // Auto-join if redirected from lobby with ?name=
  useEffect(() => {
    if (
      !autoJoinedRef.current &&
      uid &&
      localSessionId &&
      gameDoc &&
      gameDoc.state === 'waiting' &&
      initialName &&
      meIdx === -1 &&
      gameDoc.players.length < 2
    ) {
      autoJoinedRef.current = true;
      joinGame(initialName);
    }
  }, [gameDoc, initialName, joinGame, localSessionId, meIdx, uid]);

  // Playback tick animation
  useEffect(() => {
    if (
      gameDoc?.state === 'executing' &&
      gameDoc.executionResults &&
      gameDoc.executionId &&
      lastExecIdRef.current !== gameDoc.executionId
    ) {
      lastExecIdRef.current = gameDoc.executionId;
      const results = gameDoc.executionResults;
      setCurrentTick(0);

      const playTickSfx = (tIdx: number) => {
        const tick = results[tIdx];
        if (!tick) return;
        if (tick.p0Hit || tick.p1Hit) sfx('hit');
        else if (tick.lasers.length > 0) sfx('laser');
        else if (tick.p0Shield || tick.p1Shield) sfx('shield');
        else sfx('move');
      };
      playTickSfx(0);

      let tick = 0;
      const interval = setInterval(() => {
        tick++;
        if (tick < results.length) {
          setCurrentTick(tick);
          playTickSfx(tick);
        } else {
          clearInterval(interval);
          const mIdx = meIdxRef.current;
          if (mIdx !== -1) {
            const ref = doc(db, 'chronos_assassin_games', gameId);
            runTransaction(db, async (t) => {
              const s = await t.get(ref);
              if (!s.exists()) return;
              const data = s.data() as FirestoreChronosDoc;
              if (data.state !== 'executing') return;
              if (!data.players?.[mIdx] || data.players[mIdx].readyForNext) return;
              const p = [...data.players];
              p[mIdx] = { ...p[mIdx], readyForNext: true };
              t.update(ref, { players: p });
            }).catch(console.error);
          }
        }
      }, 750);

      return () => clearInterval(interval);
    }
  }, [gameDoc?.executionId, gameDoc?.executionResults, gameDoc?.state, gameId, sfx]);

  // Confetti & sound on match finish / round over
  useEffect(() => {
    if (!gameDoc) return;
    if (gameDoc.state === 'programming') {
      setCurrentTick(-1);
    } else if (gameDoc.state === 'round_over') {
      sfx(gameDoc.roundWinnerIdx === meIdx ? 'win' : gameDoc.roundWinnerIdx === -1 ? 'paradox' : 'fold');
    } else if (gameDoc.state === 'finished' && meIdx !== -1) {
      if (gameDoc.matchWinner === gameDoc.players[meIdx]?.uid) {
        sfx('win');
        confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
      } else {
        sfx('fold');
      }
    }
  }, [gameDoc?.state, gameDoc?.roundWinnerIdx, gameDoc?.matchWinner, meIdx, sfx]);

  // Host state machine (transactional to avoid duplicate writes)
  useEffect(() => {
    if (!gameDoc || !uid || gameDoc.creatorId !== uid) return;
    const ref = doc(db, 'chronos_assassin_games', gameId);

    if (gameDoc.state === 'waiting' && gameDoc.players.length === 2) {
      updateDoc(ref, { state: 'programming' }).catch(console.error);
    } else if (
      gameDoc.state === 'programming' &&
      gameDoc.players.length === 2 &&
      gameDoc.players[0].ready &&
      gameDoc.players[1].ready
    ) {
      runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreChronosDoc;
        if (data.state !== 'programming') return;
        if (!data.players[0]?.ready || !data.players[1]?.ready) return;

        const results = simulateTicks(
          data.players[0].actions,
          data.players[1].actions,
          data.obstacles || []
        );
        tx.update(ref, {
          state: 'executing',
          executionResults: results,
          executionId: Math.random().toString(36).slice(2),
          players: data.players.map((p) => ({ ...p, readyForNext: false })),
        });
      }).catch(console.error);
    } else if (
      gameDoc.state === 'executing' &&
      gameDoc.players.length === 2 &&
      gameDoc.players[0].readyForNext &&
      gameDoc.players[1].readyForNext
    ) {
      runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreChronosDoc;
        if (data.state !== 'executing') return;
        if (!data.players[0]?.readyForNext || !data.players[1]?.readyForNext) return;
        const results = data.executionResults || [];
        const finalTick = results[results.length - 1];
        if (!finalTick) return;

        let p0Score = data.players[0].score;
        let p1Score = data.players[1].score;
        const winTarget = data.winScore || 3;

        if (finalTick.p0Hit || finalTick.p1Hit) {
          let roundWinnerIdx = -1;
          if (finalTick.p1Hit && !finalTick.p0Hit) {
            p0Score++;
            roundWinnerIdx = 0;
          } else if (finalTick.p0Hit && !finalTick.p1Hit) {
            p1Score++;
            roundWinnerIdx = 1;
          }

          let nextState: FirestoreChronosDoc['state'] = 'round_over';
          let matchWinner: string | null = null;
          if (p0Score >= winTarget) {
            matchWinner = data.players[0].uid;
            nextState = 'finished';
          } else if (p1Score >= winTarget) {
            matchWinner = data.players[1].uid;
            nextState = 'finished';
          }

          tx.update(ref, {
            state: nextState,
            roundWinnerIdx,
            matchWinner,
            players: [
              { ...data.players[0], score: p0Score, ready: false, readyForNext: false, pastActions: [] },
              { ...data.players[1], score: p1Score, ready: false, readyForNext: false, pastActions: [] },
            ],
          });
        } else {
          // Time-loop rewind
          tx.update(ref, {
            state: 'programming',
            turn: data.turn + 1,
            executionResults: null,
            executionId: null,
            players: [
              {
                ...data.players[0],
                ready: false,
                readyForNext: false,
                pastActions: [...data.players[0].actions],
              },
              {
                ...data.players[1],
                ready: false,
                readyForNext: false,
                pastActions: [...data.players[1].actions],
              },
            ],
          });
        }
      }).catch(console.error);
    }
  }, [gameDoc, gameId, uid]);

  const handleLockIn = async (actions: Action[]) => {
    if (meIdx === -1 || busy) return;
    setBusy(true);
    const ref = doc(db, 'chronos_assassin_games', gameId);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreChronosDoc;
        if (data.state !== 'programming' || !data.players[meIdx]) return;
        const updated = [...data.players];
        updated[meIdx] = { ...updated[meIdx], actions, ready: true };
        tx.update(ref, { players: updated });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chronos_assassin_games/${gameId}`);
    } finally {
      setBusy(false);
    }
  };

  const handleNextRound = async () => {
    if (!gameDoc || !uid || gameDoc.creatorId !== uid || busy) return;
    setBusy(true);
    const { mapId, obstacles } = pickRoundMap('random');
    try {
      await updateDoc(doc(db, 'chronos_assassin_games', gameId), {
        state: 'programming',
        turn: 1,
        round: (gameDoc.round || 1) + 1,
        mapId,
        obstacles,
        roundWinnerIdx: null,
        executionResults: null,
        executionId: null,
        players: gameDoc.players.map((p) => ({
          ...p,
          ready: false,
          readyForNext: false,
          actions: ['W', 'W', 'W', 'W', 'W'],
          pastActions: [],
        })),
      });
    } finally {
      setBusy(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!gameDoc || !uid || gameDoc.creatorId !== uid || busy) return;
    setBusy(true);
    const { mapId, obstacles } = pickRoundMap('random');
    try {
      await updateDoc(doc(db, 'chronos_assassin_games', gameId), {
        state: 'programming',
        turn: 1,
        round: 1,
        mapId,
        obstacles,
        roundWinnerIdx: null,
        matchWinner: null,
        executionResults: null,
        executionId: null,
        players: gameDoc.players.map((p) => ({
          ...p,
          score: 0,
          ready: false,
          readyForNext: false,
          actions: ['W', 'W', 'W', 'W', 'W'],
          pastActions: [],
        })),
      });
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#04060c] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black uppercase text-white">Timeline Not Found</h1>
        <button
          type="button"
          onClick={() => router.push('/chronos')}
          className="px-5 py-2.5 rounded-xl bg-cyan-400 text-black font-black uppercase text-xs"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  if (!gameDoc) {
    return (
      <div className="min-h-screen bg-[#04060c] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-cyan-400">
        Syncing Timeline...
      </div>
    );
  }

  const arenaState: ChronosGameState = {
    gameId,
    mode: 'multi',
    creatorId: gameDoc.creatorId,
    state: gameDoc.state,
    players: gameDoc.players,
    turn: gameDoc.turn || 1,
    round: gameDoc.round || 1,
    winScore: gameDoc.winScore || 3,
    mapId: gameDoc.mapId || 'void',
    obstacles: gameDoc.obstacles || [],
    roundWinnerIdx: gameDoc.roundWinnerIdx ?? null,
    matchWinner: gameDoc.matchWinner,
    executionResults: gameDoc.executionResults,
    executionId: gameDoc.executionId,
  };

  return (
    <ChronosArena
      game={arenaState}
      meIdx={meIdx}
      currentTick={currentTick}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/chronos')}
      onJoinRoom={joinGame}
      onLockIn={handleLockIn}
      onNextRound={handleNextRound}
      onPlayAgain={handlePlayAgain}
      busy={busy}
    />
  );
}

export default function ChronosRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#04060c] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-cyan-400">
          Loading Timeline...
        </div>
      }
    >
      <MultiChronosContent />
    </Suspense>
  );
}
