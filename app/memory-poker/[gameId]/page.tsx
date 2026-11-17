'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  dealMemoryPokerRound,
  evaluateFiveCardHand,
} from '@/lib/memory-poker';
import { playSound } from '@/lib/sounds';
import {
  MemoryPokerArena,
  ArenaGameState,
  ArenaPlayer,
} from '@/components/memory-poker/MemoryPokerArena';

interface FirestoreMemoryPokerDoc {
  creatorId: string;
  state: 'waiting' | 'playing' | 'finished';
  phase: 'memorize' | 'select' | 'showdown';
  round: number;
  totalRounds: number;
  memorizeSeconds: number;
  selectSeconds: number;
  maxPlayers: number;
  phaseEndsAt: number;
  gridCards: string[];
  communityCards: string[];
  roundWinnerUids?: string[];
  matchWinnerUids?: string[];
  players: ArenaPlayer[];
}

function MultiMemoryPokerContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = (params.gameId as string).toUpperCase();

  const initialName = (searchParams.get('name') || '').slice(0, 20);
  const initialCrest = (searchParams.get('crest') || '♦').slice(0, 4);

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [gameDoc, setGameDoc] = useState<FirestoreMemoryPokerDoc | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [localSelection, setLocalSelection] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const autoJoinedRef = useRef(false);
  const lastPhaseKeyRef = useRef('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUid(u.uid);
      } else {
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
    if (!uid || !gameId) return;
    const path = `memory_poker_games/${gameId}`;
    const unsub = onSnapshot(
      doc(db, 'memory_poker_games', gameId),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setGameDoc(snap.data() as FirestoreMemoryPokerDoc);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return () => unsub();
  }, [gameId, uid]);

  const joinRoomWithNickname = useCallback(
    async (nickname: string) => {
      if (!uid || busy) return;
      setBusy(true);
      const path = `memory_poker_games/${gameId}`;
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'memory_poker_games', gameId);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() as FirestoreMemoryPokerDoc;
          if (data.state !== 'waiting') return;
          if (data.players.some((p) => p.uid === uid)) return;
          if (data.players.length >= data.maxPlayers) return;

          const newPlayer: ArenaPlayer = {
            uid,
            nickname: nickname.slice(0, 24),
            crest: initialCrest,
            score: 0,
            readyMemorize: false,
            selectedIndices: [],
            lockedIn: false,
          };
          tx.update(ref, { players: [...data.players, newPlayer] });
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } finally {
        setBusy(false);
      }
    },
    [busy, gameId, initialCrest, uid]
  );

  useEffect(() => {
    if (
      !autoJoinedRef.current &&
      uid &&
      gameDoc &&
      gameDoc.state === 'waiting' &&
      initialName &&
      !gameDoc.players.some((p) => p.uid === uid) &&
      gameDoc.players.length < gameDoc.maxPlayers
    ) {
      autoJoinedRef.current = true;
      joinRoomWithNickname(initialName);
    }
  }, [gameDoc, initialName, joinRoomWithNickname, uid]);

  useEffect(() => {
    if (!gameDoc) return;
    const phaseKey = `${gameDoc.round}-${gameDoc.phase}`;
    if (lastPhaseKeyRef.current !== phaseKey) {
      lastPhaseKeyRef.current = phaseKey;
      setLocalSelection([]);
      if (soundEnabled) {
        if (gameDoc.phase === 'showdown') {
          const winners = gameDoc.roundWinnerUids || [];
          playSound(uid && winners.includes(uid) ? 'win' : 'fold');
        } else if (gameDoc.phase === 'select') {
          playSound('flip');
        } else if (gameDoc.state === 'playing') {
          playSound('deal');
        }
      }
      if (
        gameDoc.state === 'finished' &&
        uid &&
        (gameDoc.matchWinnerUids || []).includes(uid)
      ) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
    }
  }, [gameDoc, soundEnabled, uid]);

  const shouldTickTimer = Boolean(
    gameDoc && gameDoc.state === 'playing' && gameDoc.phase !== 'showdown'
  );
  useEffect(() => {
    if (!shouldTickTimer) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, [shouldTickTimer]);

  const secondsLeft =
    shouldTickTimer && gameDoc
      ? Math.max(0, Math.ceil((gameDoc.phaseEndsAt - nowMs) / 1000))
      : 0;

  const computeShowdownUpdate = useCallback((data: FirestoreMemoryPokerDoc) => {
    const finalizedPlayers = data.players.map((p) => {
      const picks = [...p.selectedIndices];
      while (picks.length < 2) {
        const candidate = Math.floor(Math.random() * 16);
        if (!picks.includes(candidate)) picks.push(candidate);
      }
      const ev = evaluateFiveCardHand([
        ...data.communityCards,
        data.gridCards[picks[0]],
        data.gridCards[picks[1]],
      ]);
      return {
        ...p,
        selectedIndices: picks,
        lockedIn: true,
        lastHandName: ev.name,
        lastHandDetail: ev.detail,
        lastHandScore: ev.score,
      };
    });

    const maxScore = Math.max(...finalizedPlayers.map((p) => p.lastHandScore || 0));
    const winners = finalizedPlayers
      .filter((p) => (p.lastHandScore || 0) === maxScore)
      .map((p) => p.uid);

    const scoredPlayers = finalizedPlayers.map((p) => ({
      ...p,
      score: p.score + (winners.includes(p.uid) ? 1 : 0),
    }));

    return {
      phase: 'showdown' as const,
      players: scoredPlayers,
      roundWinnerUids: winners,
      phaseEndsAt: 0,
    };
  }, []);

  useEffect(() => {
    if (!gameDoc || !uid || gameDoc.creatorId !== uid || gameDoc.state !== 'playing') return;

    const checkProgression = async () => {
      const now = Date.now();
      const path = `memory_poker_games/${gameId}`;

      if (gameDoc.phase === 'memorize') {
        const allReady = gameDoc.players.every((p) => p.readyMemorize);
        const expired = gameDoc.phaseEndsAt > 0 && now >= gameDoc.phaseEndsAt;
        if (allReady || expired) {
          try {
            await runTransaction(db, async (tx) => {
              const ref = doc(db, 'memory_poker_games', gameId);
              const snap = await tx.get(ref);
              if (!snap.exists()) return;
              const data = snap.data() as FirestoreMemoryPokerDoc;
              if (data.phase !== 'memorize') return;
              tx.update(ref, {
                phase: 'select',
                phaseEndsAt: Date.now() + data.selectSeconds * 1000,
                players: data.players.map((p) => ({
                  ...p,
                  readyMemorize: true,
                  selectedIndices: [],
                  lockedIn: false,
                })),
              });
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, path);
          }
        }
      } else if (gameDoc.phase === 'select') {
        const allLocked = gameDoc.players.every((p) => p.lockedIn);
        const expired = gameDoc.phaseEndsAt > 0 && now >= gameDoc.phaseEndsAt;
        if (allLocked || expired) {
          try {
            await runTransaction(db, async (tx) => {
              const ref = doc(db, 'memory_poker_games', gameId);
              const snap = await tx.get(ref);
              if (!snap.exists()) return;
              const data = snap.data() as FirestoreMemoryPokerDoc;
              if (data.phase !== 'select') return;
              const updatePayload = computeShowdownUpdate(data);
              tx.update(ref, updatePayload);
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, path);
          }
        }
      }
    };

    checkProgression();
    const timer = setInterval(checkProgression, 500);
    return () => clearInterval(timer);
  }, [computeShowdownUpdate, gameDoc, gameId, uid]);

  const handleStartMatch = async () => {
    if (!gameDoc || !uid || gameDoc.creatorId !== uid || busy) return;
    setBusy(true);
    const path = `memory_poker_games/${gameId}`;
    try {
      const { gridCards, communityCards } = dealMemoryPokerRound();
      await updateDoc(doc(db, 'memory_poker_games', gameId), {
        state: 'playing',
        phase: 'memorize',
        round: 1,
        gridCards,
        communityCards,
        roundWinnerUids: [],
        matchWinnerUids: [],
        phaseEndsAt: Date.now() + gameDoc.memorizeSeconds * 1000,
        players: gameDoc.players.map((p) => ({
          ...p,
          score: 0,
          readyMemorize: false,
          selectedIndices: [],
          lockedIn: false,
        })),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setBusy(false);
    }
  };

  const handleReadyMemorize = async () => {
    if (!uid || !gameDoc || busy) return;
    setBusy(true);
    const path = `memory_poker_games/${gameId}`;
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'memory_poker_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreMemoryPokerDoc;
        if (data.phase !== 'memorize') return;
        tx.update(ref, {
          players: data.players.map((p) =>
            p.uid === uid ? { ...p, readyMemorize: true } : p
          ),
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleGridCard = (idx: number) => {
    if (!gameDoc || gameDoc.phase !== 'select') return;
    setLocalSelection((prev) => {
      if (prev.includes(idx)) {
        if (soundEnabled) playSound('card_remove');
        return prev.filter((item) => item !== idx);
      }
      if (soundEnabled) playSound('card_pick');
      if (prev.length >= 2) return [prev[1], idx];
      return [...prev, idx];
    });
  };

  const handleLockInSelection = async () => {
    if (!uid || !gameDoc || gameDoc.phase !== 'select' || localSelection.length !== 2 || busy)
      return;
    setBusy(true);
    if (soundEnabled) playSound('reaction');
    const path = `memory_poker_games/${gameId}`;
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'memory_poker_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreMemoryPokerDoc;
        if (data.phase !== 'select') return;
        tx.update(ref, {
          players: data.players.map((p) =>
            p.uid === uid
              ? { ...p, selectedIndices: localSelection, lockedIn: true }
              : p
          ),
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setBusy(false);
    }
  };

  const handleNextRound = async () => {
    if (!gameDoc || !uid || gameDoc.creatorId !== uid || busy) return;
    setBusy(true);
    const path = `memory_poker_games/${gameId}`;
    try {
      if (gameDoc.round >= gameDoc.totalRounds) {
        const maxScore = Math.max(...gameDoc.players.map((p) => p.score));
        const winners = gameDoc.players
          .filter((p) => p.score === maxScore)
          .map((p) => p.uid);
        await updateDoc(doc(db, 'memory_poker_games', gameId), {
          state: 'finished',
          matchWinnerUids: winners,
        });
      } else {
        const { gridCards, communityCards } = dealMemoryPokerRound();
        await updateDoc(doc(db, 'memory_poker_games', gameId), {
          phase: 'memorize',
          round: gameDoc.round + 1,
          gridCards,
          communityCards,
          roundWinnerUids: [],
          phaseEndsAt: Date.now() + gameDoc.memorizeSeconds * 1000,
          players: gameDoc.players.map((p) => ({
            ...p,
            readyMemorize: false,
            selectedIndices: [],
            lockedIn: false,
          })),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setBusy(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!gameDoc || !uid || gameDoc.creatorId !== uid || busy) return;
    await handleStartMatch();
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#050a08] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black uppercase text-white">Room Not Found</h1>
        <p className="text-sm text-stone-400">
          This Memory Poker table does not exist or has closed.
        </p>
        <button
          type="button"
          onClick={() => router.push('/memory-poker')}
          className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-black uppercase tracking-wider text-xs"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  if (!gameDoc) {
    return (
      <div className="min-h-screen bg-[#050a08] flex items-center justify-center text-stone-400 font-mono text-xs uppercase tracking-widest">
        Connecting to table...
      </div>
    );
  }

  const arenaGame: ArenaGameState = {
    gameId,
    mode: 'multi',
    state: gameDoc.state,
    phase: gameDoc.phase,
    round: gameDoc.round,
    totalRounds: gameDoc.totalRounds,
    memorizeSeconds: gameDoc.memorizeSeconds,
    selectSeconds: gameDoc.selectSeconds,
    maxPlayers: gameDoc.maxPlayers,
    gridCards: gameDoc.gridCards,
    communityCards: gameDoc.communityCards,
    players: gameDoc.players,
    roundWinnerUids: gameDoc.roundWinnerUids || [],
    matchWinnerUids: gameDoc.matchWinnerUids || [],
    creatorId: gameDoc.creatorId,
  };

  return (
    <MemoryPokerArena
      game={arenaGame}
      meUid={uid}
      secondsLeft={secondsLeft}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/memory-poker')}
      onJoinRoom={joinRoomWithNickname}
      onStartMatch={handleStartMatch}
      localSelection={localSelection}
      onToggleGridCard={handleToggleGridCard}
      onReadyMemorize={handleReadyMemorize}
      onLockInSelection={handleLockInSelection}
      onNextRound={handleNextRound}
      onPlayAgain={handlePlayAgain}
      busy={busy}
    />
  );
}

export default function MultiMemoryPokerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050a08] flex items-center justify-center text-stone-400 font-mono text-xs uppercase tracking-widest">
          Loading table...
        </div>
      }
    >
      <MultiMemoryPokerContent />
    </Suspense>
  );
}
