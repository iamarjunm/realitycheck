'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  BlindVaultState,
  STARTING_CREDITS,
  VaultPlayer,
  VaultProtocol,
  buildVaultDeck,
  resolveVaultRound,
} from '@/lib/blind-vault';
import { BlindVaultArena } from '@/components/blind-vault/BlindVaultArena';
import { playSound } from '@/lib/sounds';

function MultiBlindVaultContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = (params.gameId as string).toUpperCase();
  const initialName = (searchParams.get('name') || '').slice(0, 14);

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [sid, setSid] = useState('');
  const [gameDoc, setGameDoc] = useState<Omit<BlindVaultState, 'mode'> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const autoJoinedRef = useRef(false);

  useEffect(() => {
    let local = sessionStorage.getItem('vaultTabSid');
    if (!local) {
      local = Math.random().toString(36).slice(2);
      sessionStorage.setItem('vaultTabSid', local);
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
    const unsub = onSnapshot(doc(db, 'blind_vault_games', gameId), (snap) => {
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      setGameDoc(snap.data() as Omit<BlindVaultState, 'mode'>);
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
          const ref = doc(db, 'blind_vault_games', gameId);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() as Omit<BlindVaultState, 'mode'>;
          if (data.players.length >= 2 || data.players.some((p) => p.sessionId === sid)) return;
          const p: VaultPlayer = {
            uid,
            sessionId: sid,
            nickname: nickname.slice(0, 14),
            credits: STARTING_CREDITS,
            score: 0,
            hasDouble: true,
            hasInvert: true,
            currentBid: null,
            currentProtocol: 'none',
            locked: false,
          };
          tx.update(ref, { players: [...data.players, p], state: 'bidding' });
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

  const handleLockBid = async (bid: number, protocol: VaultProtocol) => {
    if (meIdx === -1 || busy) return;
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'blind_vault_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as Omit<BlindVaultState, 'mode'>;
        if (data.state !== 'bidding' || !data.players[meIdx]) return;

        const players = data.players.map((p) => ({ ...p }));
        players[meIdx] = {
          ...players[meIdx],
          currentBid: Math.max(0, Math.min(players[meIdx].credits, bid)),
          currentProtocol: protocol,
          locked: true,
        };

        if (players.length === 2 && players[0].locked && players[1].locked) {
          const vaultVal = data.vaultDeck[data.round - 1];
          const { nextP0, nextP1, log } = resolveVaultRound(data.round, vaultVal, players[0], players[1]);
          tx.update(ref, {
            state: 'reveal',
            players: [nextP0, nextP1],
            history: [...data.history, log],
          });
        } else {
          tx.update(ref, { players });
        }
      });
    } finally {
      setBusy(false);
    }
  };

  const handleNextRound = async () => {
    if (!gameDoc || meIdx !== 0 || busy) return;
    setBusy(true);
    try {
      if (gameDoc.round >= 7) {
        const [p0, p1] = gameDoc.players;
        const winnerUid = p0.score > p1.score ? p0.uid : p1.score > p0.score ? p1.uid : 'TIE';
        await updateDoc(doc(db, 'blind_vault_games', gameId), { state: 'finished', winnerUid });
      } else {
        await updateDoc(doc(db, 'blind_vault_games', gameId), {
          state: 'bidding',
          round: gameDoc.round + 1,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!gameDoc || meIdx !== 0 || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'blind_vault_games', gameId), {
        state: 'bidding',
        round: 1,
        vaultDeck: buildVaultDeck(),
        history: [],
        winnerUid: null,
        players: gameDoc.players.map((p) => ({
          ...p,
          credits: STARTING_CREDITS,
          score: 0,
          hasDouble: true,
          hasInvert: true,
          currentBid: null,
          currentProtocol: 'none',
          locked: false,
        })),
      });
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#06050b] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black uppercase text-white">Vault Not Found</h1>
        <button type="button" onClick={() => router.push('/blind-vault')} className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-black uppercase text-xs">
          Back to Lobby
        </button>
      </div>
    );
  }

  if (!gameDoc) {
    return (
      <div className="min-h-screen bg-[#06050b] flex items-center justify-center font-mono text-xs text-amber-400">
        Connecting to Vault...
      </div>
    );
  }

  return (
    <BlindVaultArena
      game={{ ...gameDoc, gameId, mode: 'multi' }}
      meIdx={meIdx}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/blind-vault')}
      onJoinRoom={joinRoom}
      onLockBid={handleLockBid}
      onNextRound={handleNextRound}
      onPlayAgain={handlePlayAgain}
      busy={busy}
    />
  );
}

export default function MultiBlindVaultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06050b] flex items-center justify-center font-mono text-xs text-amber-400">Loading Vault...</div>}>
      <MultiBlindVaultContent />
    </Suspense>
  );
}
