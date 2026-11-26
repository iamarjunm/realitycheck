'use client';

import React, {
  use,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  AnomalyCardId,
  RealityDraftState,
  RealityStance,
  createInitialPlayer,
  resolveRealityClash,
  rollNextDistortion,
} from '@/lib/reality-draft';
import { RealityDraftArena } from '@/components/reality-draft/RealityDraftArena';
import { playSound } from '@/lib/sounds';

type FirestoreRealityDoc = Omit<RealityDraftState, 'mode' | 'gameId'>;

function RealityDraftRoomContent({ gameId }: { gameId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialName = (searchParams.get('name') || '').slice(0, 14);

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [sid, setSid] = useState('');
  const [gameDoc, setGameDoc] = useState<FirestoreRealityDoc | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const autoJoinedRef = useRef(false);
  const celebratedRef = useRef<string | null>(null);

  useEffect(() => {
    let local = sessionStorage.getItem('realityDraftTabSid');
    if (!local) {
      local = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('realityDraftTabSid', local);
    }
    setSid(local);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUid(u.uid);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setUid(cred.user.uid);
        } catch (err) {
          console.error(err);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, 'reality_draft_games', gameId), (snap) => {
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      setGameDoc(snap.data() as FirestoreRealityDoc);
    });
    return () => unsub();
  }, [gameId]);

  const meIdx = useMemo(() => {
    if (!gameDoc) return -1;
    if (sid) {
      const bySid = gameDoc.players.findIndex((p) => p.sessionId === sid);
      if (bySid !== -1) return bySid;
    }
    if (uid) {
      return gameDoc.players.findIndex((p) => p.uid === uid);
    }
    return -1;
  }, [gameDoc, sid, uid]);

  const joinRoom = useCallback(
    async (nickname: string) => {
      if (!uid || !sid || busy) return;
      setBusy(true);
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'reality_draft_games', gameId);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() as FirestoreRealityDoc;
          if (data.players.length >= 2 || data.players.some((p) => p.sessionId === sid)) {
            return;
          }
          const challenger = createInitialPlayer({
            uid,
            sessionId: sid,
            nickname: nickname.trim() || 'Challenger',
            isBot: false,
          });
          tx.update(ref, {
            players: [...data.players, challenger],
            state: 'selecting',
          });
        });
      } catch (err) {
        console.error(err);
      } finally {
        setBusy(false);
      }
    },
    [busy, gameId, sid, uid]
  );

  // Auto-join if challenger arrived from lobby with ?name=...
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

  // Victory celebration confetti + sound
  useEffect(() => {
    if (!gameDoc || gameDoc.state !== 'finished' || meIdx === -1) {
      celebratedRef.current = null;
      return;
    }
    const myUid = gameDoc.players[meIdx]?.uid;
    const key = `${gameDoc.round}-${gameDoc.winnerUid}`;
    if (myUid && gameDoc.winnerUid === myUid && celebratedRef.current !== key) {
      celebratedRef.current = key;
      if (soundEnabled) playSound('win');
      confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
    }
  }, [gameDoc, meIdx, soundEnabled]);

  const handleLockMove = async (card: AnomalyCardId, stance: RealityStance) => {
    if (meIdx === -1 || busy) return;
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'reality_draft_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreRealityDoc;
        if (data.state !== 'selecting' || !data.players[meIdx] || data.players[meIdx].locked) {
          return;
        }

        const players = data.players.map((p) => ({ ...p }));
        const me = players[meIdx];
        if (!me.hand.includes(card)) return;

        const safeStance: RealityStance =
          stance === 'double' && me.doubleUsesLeft <= 0
            ? 'hold'
            : stance === 'ward' && me.wardUsesLeft <= 0
              ? 'hold'
              : stance;

        players[meIdx] = {
          ...me,
          lockedCard: card,
          lockedStance: safeStance,
          locked: true,
        };

        if (players.length === 2 && players[0].locked && players[1].locked) {
          const { nextP0, nextP1, log } = resolveRealityClash(
            data.round,
            data.distortion,
            players[0],
            players[1]
          );
          tx.update(ref, {
            state: 'clash',
            players: [nextP0, nextP1],
            lastClash: log,
            history: [...data.history, log],
          });
        } else {
          tx.update(ref, { players });
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleNextRound = async () => {
    if (!gameDoc || meIdx === -1 || busy) return;
    const expectedRound = gameDoc.round;
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'reality_draft_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreRealityDoc;
        if (data.state !== 'clash' || data.round !== expectedRound) return;

        const pendingWinner = data.lastClash?.pendingMatchWinnerUid ?? null;
        if (pendingWinner) {
          tx.update(ref, {
            state: 'finished',
            winnerUid: pendingWinner,
          });
        } else {
          tx.update(ref, {
            state: 'selecting',
            round: data.round + 1,
            distortion: rollNextDistortion(data.distortion),
            lastClash: null,
          });
        }
      });
      if (soundEnabled) playSound('deal');
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!gameDoc || meIdx !== 0 || busy) return;
    setBusy(true);
    try {
      const resetPlayers = gameDoc.players.map((p) =>
        createInitialPlayer({
          uid: p.uid,
          sessionId: p.sessionId,
          nickname: p.nickname,
          isBot: p.isBot,
        })
      );
      await updateDoc(doc(db, 'reality_draft_games', gameId), {
        state: 'selecting',
        round: 1,
        distortion: rollNextDistortion(gameDoc.distortion),
        players: resetPlayers,
        lastClash: null,
        history: [],
        winnerUid: null,
      });
      if (soundEnabled) playSound('deal');
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-dvh bg-[#05030c] flex flex-col items-center justify-center p-6 text-center space-y-4 text-white">
        <h1 className="text-2xl font-black uppercase">Reality Rift Not Found</h1>
        <p className="text-xs text-zinc-400">Check the room code or conjure a fresh 1v1 duel.</p>
        <button
          type="button"
          onClick={() => router.push('/reality-draft')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-black font-black uppercase text-xs"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  if (!gameDoc) {
    return (
      <div className="min-h-dvh bg-[#05030c] flex items-center justify-center font-mono text-xs uppercase tracking-[0.3em] text-fuchsia-300 animate-pulse">
        Stabilizing Reality Rift...
      </div>
    );
  }

  return (
    <RealityDraftArena
      game={{ ...gameDoc, gameId, mode: 'multi' }}
      meIdx={meIdx}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/reality-draft')}
      onJoinRoom={joinRoom}
      onLockMove={handleLockMove}
      onNextRound={handleNextRound}
      onPlayAgain={handlePlayAgain}
      busy={busy}
    />
  );
}

export default function RealityDraftRoomPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId: rawGameId } = use(params);
  const gameId = rawGameId.toUpperCase();

  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#05030c] flex items-center justify-center font-mono text-xs uppercase tracking-[0.3em] text-fuchsia-300">
          Loading Anomaly Arena...
        </div>
      }
    >
      <RealityDraftRoomContent gameId={gameId} />
    </Suspense>
  );
}
