'use client';

import React, { use, useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  QuantumMatrixGame,
  applyMove,
  createEmptyBoard,
  createInitialPlayer,
  generateAmpCells,
} from '@/lib/quantum-matrix';
import { QuantumMatrixArena } from '@/components/quantum-matrix/QuantumMatrixArena';
import { playSound } from '@/lib/sounds';

const NICK_STORAGE_KEY = 'realityCheckNick';
const TAB_SID_KEY = 'quantumMatrixTabSid';

type FirestoreMatrixDoc = Omit<QuantumMatrixGame, 'gameId' | 'mode'>;

function QuantumMatrixRoomContent({ gameId }: { gameId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = gameId.toUpperCase();
  const urlName = (searchParams.get('name') || '').slice(0, 14);

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [sid, setSid] = useState('');
  const [defaultNick, setDefaultNick] = useState(urlName);
  const [gameDoc, setGameDoc] = useState<FirestoreMatrixDoc | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  const autoJoinedRef = useRef(false);
  const lastSoundTurnRef = useRef<number>(-1);

  // Per-tab session ID for seamless 2-tab local PvP testing + cached callsign
  useEffect(() => {
    let localSid = sessionStorage.getItem(TAB_SID_KEY);
    if (!localSid) {
      localSid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(TAB_SID_KEY, localSid);
    }
    setSid(localSid);

    if (!urlName) {
      try {
        const saved = localStorage.getItem(NICK_STORAGE_KEY);
        if (saved) setDefaultNick(saved.slice(0, 14));
      } catch {
        // Ignore storage errors
      }
    }
  }, [urlName]);

  // Anonymous Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
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

  // Live Firestore Subscription
  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(
      doc(db, 'quantum_matrix_games', roomCode),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setGameDoc(snap.data() as FirestoreMatrixDoc);
      },
      (err) => {
        console.error('Quantum Matrix snapshot error:', err);
      }
    );
    return () => unsub();
  }, [roomCode]);

  const meIdx = useMemo(() => {
    if (!gameDoc) return -1;
    if (sid) {
      const bySid = gameDoc.players.findIndex((p) => p.sessionId === sid);
      if (bySid !== -1) return bySid;
    }
    // Only fall back to uid if there is a single player not matched by another tab's sid
    // Wait: to support 2-tab local testing where both tabs share Firebase uid, never match
    // a different tab's sessionId by uid while waiting for player 2 to join!
    if (uid && gameDoc.state !== 'waiting') {
      const byUid = gameDoc.players.findIndex((p) => p.uid === uid);
      if (byUid !== -1) return byUid;
    }
    return -1;
  }, [gameDoc, sid, uid]);

  // Play SFX when opponent makes a move
  useEffect(() => {
    if (!gameDoc || !soundEnabled) return;
    if (lastSoundTurnRef.current === -1) {
      lastSoundTurnRef.current = gameDoc.turnCount;
      return;
    }
    if (gameDoc.turnCount > lastSoundTurnRef.current) {
      lastSoundTurnRef.current = gameDoc.turnCount;
      const mv = gameDoc.lastMove;
      if (mv && mv.actor !== meIdx) {
        if (mv.hijacked.length > 0 || mv.usedInvert) {
          playSound('paradox');
        } else if (mv.outflanked.length > 0) {
          playSound('flip');
        } else {
          playSound('deal');
        }
      }
    } else if (gameDoc.turnCount < lastSoundTurnRef.current) {
      // Rematch reset
      lastSoundTurnRef.current = gameDoc.turnCount;
      playSound('deal');
    }
  }, [gameDoc, meIdx, soundEnabled]);

  const handleJoinRoom = useCallback(
    async (nickname: string) => {
      if (!uid || !sid || busy) return;
      setBusy(true);
      const cleanName = nickname.trim().slice(0, 14) || 'Challenger';
      try {
        try {
          localStorage.setItem(NICK_STORAGE_KEY, cleanName);
        } catch {
          // Ignore
        }
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'quantum_matrix_games', roomCode);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() as FirestoreMatrixDoc;
          if (data.players.length >= 2 || data.players.some((p) => p.sessionId === sid)) return;

          const p2 = createInitialPlayer({
            uid,
            sessionId: sid,
            nickname: cleanName,
            isBot: false,
          });
          tx.update(ref, {
            players: [...data.players, p2],
            state: 'playing',
          });
        });
        if (soundEnabled) playSound('deal');
      } catch (err) {
        console.error('Failed to join Quantum Matrix room:', err);
      } finally {
        setBusy(false);
      }
    },
    [busy, roomCode, sid, soundEnabled, uid]
  );

  // Auto-join if redirected from Lobby with ?name=...
  useEffect(() => {
    if (
      !autoJoinedRef.current &&
      uid &&
      sid &&
      gameDoc &&
      gameDoc.state === 'waiting' &&
      urlName &&
      meIdx === -1 &&
      gameDoc.players.length < 2
    ) {
      autoJoinedRef.current = true;
      handleJoinRoom(urlName);
    }
  }, [gameDoc, handleJoinRoom, meIdx, sid, uid, urlName]);

  const handlePlaceCore = async (cellIdx: number, value: number, useInvert: boolean) => {
    if (meIdx === -1 || busy) return;
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'quantum_matrix_games', roomCode);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreMatrixDoc;
        if (data.state !== 'playing' || data.turnIdx !== meIdx) return;

        const fullState: QuantumMatrixGame = {
          ...data,
          gameId: roomCode,
          mode: 'multi',
        };
        const nextState = applyMove(fullState, cellIdx, value, useInvert);
        if (!nextState) return;

        tx.update(ref, {
          state: nextState.state,
          turnIdx: nextState.turnIdx,
          turnCount: nextState.turnCount,
          board: nextState.board,
          players: nextState.players,
          lastMove: nextState.lastMove,
          logs: nextState.logs,
          winnerIdx: nextState.winnerIdx,
          winnerUid: nextState.winnerUid,
        });
      });
    } catch (err) {
      console.error('Move transaction failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleRematch = async () => {
    if (meIdx === -1 || busy) return;
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'quantum_matrix_games', roomCode);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as FirestoreMatrixDoc;
        if (data.players.length < 2) return;

        const prevStarter = data.logs[0]?.actor ?? 0;
        const nextStarter = prevStarter === 0 ? 1 : 0;

        tx.update(ref, {
          state: 'playing',
          turnIdx: nextStarter,
          turnCount: 0,
          board: createEmptyBoard(),
          ampCells: generateAmpCells(),
          players: data.players.map((p) =>
            createInitialPlayer({
              uid: p.uid,
              sessionId: p.sessionId,
              nickname: p.nickname,
              isBot: p.isBot,
            })
          ),
          lastMove: null,
          logs: [],
          winnerIdx: null,
          winnerUid: null,
        });
      });
    } catch (err) {
      console.error('Rematch transaction failed:', err);
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-dvh bg-[#04060d] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black uppercase text-white">Matrix Room Not Found</h1>
        <p className="text-xs font-mono text-zinc-400">
          Code <span className="text-cyan-300">{roomCode}</span> does not exist or has expired.
        </p>
        <button
          type="button"
          onClick={() => router.push('/quantum-matrix')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-400 text-black font-black uppercase text-xs"
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  if (!gameDoc) {
    return (
      <div className="min-h-dvh bg-[#04060d] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-cyan-300">
        Syncing Quantum Matrix [{roomCode}]...
      </div>
    );
  }

  return (
    <QuantumMatrixArena
      game={{ ...gameDoc, gameId: roomCode, mode: 'multi' }}
      meIdx={meIdx}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/quantum-matrix')}
      onPlaceCore={handlePlaceCore}
      onJoinRoom={handleJoinRoom}
      onRematch={handleRematch}
      busy={busy}
      defaultNickname={defaultNick}
    />
  );
}

export default function QuantumMatrixRoomPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#04060d] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-cyan-300">
          Loading Quantum Matrix...
        </div>
      }
    >
      <QuantumMatrixRoomContent gameId={gameId} />
    </Suspense>
  );
}
