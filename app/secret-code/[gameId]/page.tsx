'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  SecretCard,
  CipherRule,
  generateUniqueSecretCodePuzzle,
  verifySecretCodeGuess,
} from '@/lib/secret-code';
import { playSound } from '@/lib/sounds';
import {
  SecretCodeArena,
  SecretCodeArenaGame,
  SecretCodePlayer,
} from '@/components/secret-code/SecretCodeArena';

interface FirestoreSecretCodeDoc {
  creatorId: string;
  state: 'waiting' | 'playing' | 'finished';
  phase: 'deducing' | 'round_over';
  round: number;
  totalRounds: number;
  maxPlayers: number;
  cards: SecretCard[];
  rules: CipherRule[];
  secretIndices: number[];
  roundWinnerUid?: string;
  matchWinnerUids?: string[];
  players: SecretCodePlayer[];
}

function MultiSecretCodeContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = (params.gameId as string).toUpperCase();

  const initialName = (searchParams.get('name') || '').slice(0, 24);

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [gameDoc, setGameDoc] = useState<FirestoreSecretCodeDoc | null>(null);
  const [notFound, setNotFound] = useState(false);
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
    const path = `secret_code_games/${gameId}`;
    const unsub = onSnapshot(
      doc(db, 'secret_code_games', gameId),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setGameDoc(snap.data() as FirestoreSecretCodeDoc);
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
      const path = `secret_code_games/${gameId}`;
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'secret_code_games', gameId);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() as FirestoreSecretCodeDoc;
          if (data.state !== 'waiting') return;
          if (data.players.some((p) => p.uid === uid)) return;
          if (data.players.length >= data.maxPlayers) return;

          const newPlayer: SecretCodePlayer = {
            uid,
            nickname: nickname.slice(0, 24),
            score: 0,
            eliminatedThisRound: false,
            lastGuess: [],
          };
          tx.update(ref, { players: [...data.players, newPlayer] });
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } finally {
        setBusy(false);
      }
    },
    [busy, gameId, uid]
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
    const phaseKey = `${gameDoc.state}-${gameDoc.round}-${gameDoc.phase}`;
    if (lastPhaseKeyRef.current !== phaseKey) {
      lastPhaseKeyRef.current = phaseKey;
      if (soundEnabled) {
        if (gameDoc.phase === 'round_over') {
          playSound(gameDoc.roundWinnerUid === uid ? 'win' : 'fold');
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

  const handleStartMatch = async () => {
    if (!gameDoc || !uid || gameDoc.creatorId !== uid || busy) return;
    setBusy(true);
    const path = `secret_code_games/${gameId}`;
    try {
      const puzzle = generateUniqueSecretCodePuzzle();
      await updateDoc(doc(db, 'secret_code_games', gameId), {
        state: 'playing',
        phase: 'deducing',
        round: 1,
        cards: puzzle.cards,
        rules: puzzle.rules,
        secretIndices: puzzle.secretIndices,
        roundWinnerUid: '',
        matchWinnerUids: [],
        players: gameDoc.players.map((p) => ({
          ...p,
          score: 0,
          eliminatedThisRound: false,
          lastGuess: [],
        })),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitGuess = async (guessIndices: number[]) => {
    if (!uid || !gameDoc || gameDoc.phase !== 'deducing' || busy) return;
    setBusy(true);
    const path = `secret_code_games/${gameId}`;

    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'secret_code_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreSecretCodeDoc;
        if (data.state !== 'playing' || data.phase !== 'deducing') return;

        const me = data.players.find((p) => p.uid === uid);
        if (!me || me.eliminatedThisRound) return;

        const { isCorrect } = verifySecretCodeGuess(
          guessIndices,
          data.secretIndices,
          data.cards,
          data.rules
        );

        if (isCorrect) {
          if (soundEnabled) playSound('win');
          tx.update(ref, {
            phase: 'round_over',
            roundWinnerUid: uid,
            players: data.players.map((p) =>
              p.uid === uid
                ? { ...p, score: p.score + 1, lastGuess: guessIndices }
                : p
            ),
          });
        } else {
          if (soundEnabled) playSound('fold');
          const updatedPlayers = data.players.map((p) =>
            p.uid === uid
              ? { ...p, eliminatedThisRound: true, lastGuess: guessIndices }
              : p
          );
          const allEliminated = updatedPlayers.every((p) => p.eliminatedThisRound);
          tx.update(ref, {
            phase: allEliminated ? 'round_over' : 'deducing',
            roundWinnerUid: '',
            players: updatedPlayers,
          });
        }
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
    const path = `secret_code_games/${gameId}`;
    try {
      if (gameDoc.round >= gameDoc.totalRounds) {
        const maxScore = Math.max(...gameDoc.players.map((p) => p.score));
        const winners = gameDoc.players
          .filter((p) => p.score === maxScore)
          .map((p) => p.uid);
        await updateDoc(doc(db, 'secret_code_games', gameId), {
          state: 'finished',
          matchWinnerUids: winners,
        });
      } else {
        const nextPuzzle = generateUniqueSecretCodePuzzle();
        await updateDoc(doc(db, 'secret_code_games', gameId), {
          phase: 'deducing',
          round: gameDoc.round + 1,
          cards: nextPuzzle.cards,
          rules: nextPuzzle.rules,
          secretIndices: nextPuzzle.secretIndices,
          roundWinnerUid: '',
          players: gameDoc.players.map((p) => ({
            ...p,
            eliminatedThisRound: false,
            lastGuess: [],
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
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black uppercase text-white">Room Not Found</h1>
        <p className="text-sm text-zinc-400">
          This Secret Order room does not exist or has closed.
        </p>
        <button
          type="button"
          onClick={() => router.push('/secret-code')}
          className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-black uppercase tracking-wider text-xs"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  if (!gameDoc) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center text-zinc-400 font-mono text-xs uppercase tracking-widest">
        Connecting to cipher room...
      </div>
    );
  }

  const arenaGame: SecretCodeArenaGame = {
    gameId,
    mode: 'multi',
    creatorId: gameDoc.creatorId,
    state: gameDoc.state,
    phase: gameDoc.phase,
    round: gameDoc.round,
    totalRounds: gameDoc.totalRounds,
    maxPlayers: gameDoc.maxPlayers,
    cards: gameDoc.cards,
    rules: gameDoc.rules,
    secretIndices: gameDoc.secretIndices,
    roundWinnerUid: gameDoc.roundWinnerUid || null,
    matchWinnerUids: gameDoc.matchWinnerUids || [],
    players: gameDoc.players,
  };

  return (
    <SecretCodeArena
      game={arenaGame}
      meUid={uid}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/secret-code')}
      onJoinRoom={joinRoomWithNickname}
      onStartMatch={handleStartMatch}
      onSubmitGuess={handleSubmitGuess}
      onNextRound={handleNextRound}
      onPlayAgain={handlePlayAgain}
      busy={busy}
    />
  );
}

export default function MultiSecretCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050508] flex items-center justify-center text-zinc-400 font-mono text-xs uppercase tracking-widest">
          Loading room...
        </div>
      }
    >
      <MultiSecretCodeContent />
    </Suspense>
  );
}
