'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  VOID_P0_START,
  VOID_P1_START,
  VoidStepPlayer,
  VoidStepState,
  cellIdx,
  hasAnyLegalMove,
} from '@/lib/void-step';
import { VoidStepArena } from '@/components/void-step/VoidStepArena';
import { playSound } from '@/lib/sounds';

function MultiVoidStepContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = (params.gameId as string).toUpperCase();
  const initialName = (searchParams.get('name') || '').slice(0, 14);

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [sid, setSid] = useState('');
  const [gameDoc, setGameDoc] = useState<Omit<VoidStepState, 'mode'> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const autoJoinedRef = useRef(false);

  useEffect(() => {
    let local = sessionStorage.getItem('voidTabSid');
    if (!local) {
      local = Math.random().toString(36).slice(2);
      sessionStorage.setItem('voidTabSid', local);
    }
    setSid(local);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) setUid(u.uid);
      else {
        const cred = await signInAnonymously(auth);
        setUid(cred.user.uid);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, 'void_step_games', gameId), (snap) => {
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      setGameDoc(snap.data() as Omit<VoidStepState, 'mode'>);
    });
    return () => unsub();
  }, [gameId]);

  const meIdx = useMemo(() => {
    if (!gameDoc) return -1;
    if (sid) {
      const i = gameDoc.players.findIndex((p) => p.sessionId === sid);
      if (i !== -1) return i;
    }
    if (uid) return gameDoc.players.findIndex((p) => p.uid === uid);
    return -1;
  }, [gameDoc, sid, uid]);

  const joinRoom = useCallback(
    async (nickname: string) => {
      if (!uid || !sid || busy) return;
      setBusy(true);
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'void_step_games', gameId);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() as Omit<VoidStepState, 'mode'>;
          if (data.players.length >= 2 || data.players.some((p) => p.sessionId === sid)) return;
          const p: VoidStepPlayer = {
            uid,
            sessionId: sid,
            nickname: nickname.slice(0, 14),
            pos: { ...VOID_P1_START },
            blinksLeft: 2,
            score: 0,
          };
          tx.update(ref, { players: [...data.players, p], state: 'playing' });
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, gameId, sid, uid]
  );

  useEffect(() => {
    if (
      !autoJoinedRef.current &&
      uid &&
      sid &&
      gameDoc &&
      gameDoc.state === 'waiting' &&
      initialName &&
      meIdx === -1 &&
      gameDoc.players.length < 2
    ) {
      autoJoinedRef.current = true;
      joinRoom(initialName);
    }
  }, [gameDoc, initialName, joinRoom, meIdx, sid, uid]);

  useEffect(() => {
    if (gameDoc?.state === 'finished' && meIdx !== -1 && gameDoc.winnerUid === gameDoc.players[meIdx]?.uid) {
      if (soundEnabled) playSound('win');
      confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
    }
  }, [gameDoc?.state, gameDoc?.winnerUid, gameDoc?.players, meIdx, soundEnabled]);

  const handleMove = async (x: number, y: number, useBlink: boolean) => {
    if (meIdx === -1 || busy) return;
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'void_step_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as Omit<VoidStepState, 'mode'>;
        if (data.state !== 'playing' || data.turnIdx !== meIdx || data.subPhase !== 'move') return;

        const players = data.players.map((p) => ({ ...p }));
        const me = players[meIdx];
        const nextVoid = [...data.voidCells, cellIdx(me.pos.x, me.pos.y)];
        players[meIdx] = {
          ...me,
          pos: { x, y },
          blinksLeft: useBlink ? Math.max(0, me.blinksLeft - 1) : me.blinksLeft,
        };
        tx.update(ref, {
          voidCells: nextVoid,
          subPhase: 'shatter',
          players,
          lastEvent: `${me.nickname} ${useBlink ? 'BLINKED' : 'moved'} — selecting tile to shatter...`,
        });
      });
    } finally {
      setBusy(false);
    }
  };

  const handleShatter = async (x: number, y: number) => {
    if (meIdx === -1 || busy) return;
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'void_step_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as Omit<VoidStepState, 'mode'>;
        if (data.state !== 'playing' || data.turnIdx !== meIdx || data.subPhase !== 'shatter') return;

        const players = data.players.map((p) => ({ ...p }));
        const nextVoid = [...data.voidCells, cellIdx(x, y)];
        const oppIdx = (meIdx === 0 ? 1 : 0) as 0 | 1;

        if (!hasAnyLegalMove(players[oppIdx], players[meIdx], nextVoid)) {
          players[meIdx].score += 1;
          const finished = players[meIdx].score >= data.winScore;
          tx.update(ref, {
            voidCells: nextVoid,
            players,
            state: finished ? 'finished' : 'round_over',
            roundWinnerIdx: meIdx,
            winnerUid: finished ? players[meIdx].uid : null,
            lastEvent: `${players[oppIdx].nickname} trapped with 0 moves!`,
          });
          return;
        }

        tx.update(ref, {
          voidCells: nextVoid,
          turnIdx: oppIdx,
          subPhase: 'move',
          lastEvent: `${players[meIdx].nickname} shattered a tile.`,
        });
      });
    } finally {
      setBusy(false);
    }
  };

  const handleNextRound = async () => {
    if (!gameDoc || meIdx !== 0 || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'void_step_games', gameId), {
        state: 'playing',
        subPhase: 'move',
        turnIdx: gameDoc.round % 2 === 0 ? 0 : 1,
        round: gameDoc.round + 1,
        voidCells: [],
        roundWinnerIdx: null,
        lastEvent: 'Fresh 7×7 grid deployed!',
        players: [
          { ...gameDoc.players[0], pos: { ...VOID_P0_START }, blinksLeft: 2 },
          { ...gameDoc.players[1], pos: { ...VOID_P1_START }, blinksLeft: 2 },
        ],
      });
    } finally {
      setBusy(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!gameDoc || meIdx !== 0 || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'void_step_games', gameId), {
        state: 'playing',
        subPhase: 'move',
        turnIdx: 0,
        round: 1,
        voidCells: [],
        roundWinnerIdx: null,
        winnerUid: null,
        lastEvent: 'Rematch started!',
        players: [
          { ...gameDoc.players[0], pos: { ...VOID_P0_START }, blinksLeft: 2, score: 0 },
          { ...gameDoc.players[1], pos: { ...VOID_P1_START }, blinksLeft: 2, score: 0 },
        ],
      });
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#04060b] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black uppercase text-white">Arena Not Found</h1>
        <button type="button" onClick={() => router.push('/void-step')} className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-black uppercase text-xs">
          Back to Lobby
        </button>
      </div>
    );
  }

  if (!gameDoc) {
    return (
      <div className="min-h-screen bg-[#04060b] flex items-center justify-center font-mono text-xs text-violet-400">
        Connecting to Void Arena...
      </div>
    );
  }

  return (
    <VoidStepArena
      game={{ ...gameDoc, gameId, mode: 'multi' }}
      meIdx={meIdx}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/void-step')}
      onJoinRoom={joinRoom}
      onMove={handleMove}
      onShatter={handleShatter}
      onNextRound={handleNextRound}
      onPlayAgain={handlePlayAgain}
      busy={busy}
    />
  );
}

export default function MultiVoidStepPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#04060b] flex items-center justify-center font-mono text-xs text-violet-400">Loading Arena...</div>}>
      <MultiVoidStepContent />
    </Suspense>
  );
}
