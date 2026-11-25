'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Coins, Bot, Users } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  BlindVaultState,
  STARTING_CREDITS,
  VaultProtocol,
  buildVaultDeck,
  pickBotVaultMove,
  resolveVaultRound,
} from '@/lib/blind-vault';
import { BlindVaultArena } from '@/components/blind-vault/BlindVaultArena';
import { playSound } from '@/lib/sounds';

export default function BlindVaultPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'multi' | 'solo'>('multi');
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soloGame, setSoloGame] = useState<BlindVaultState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) signInAnonymously(auth).catch(console.error);
  }, []);

  const startSolo = () => {
    playSound('deal');
    setSoloGame({
      mode: 'solo',
      creatorId: 'human',
      state: 'bidding',
      round: 1,
      vaultDeck: buildVaultDeck(),
      history: [],
      winnerUid: null,
      players: [
        {
          uid: 'human',
          sessionId: 'human',
          nickname: nickname.trim() || 'Bidder',
          credits: STARTING_CREDITS,
          score: 0,
          hasDouble: true,
          hasInvert: true,
          currentBid: null,
          currentProtocol: 'none',
          locked: false,
        },
        {
          uid: 'bot',
          sessionId: 'bot',
          nickname: 'Syndicate AI',
          isBot: true,
          credits: STARTING_CREDITS,
          score: 0,
          hasDouble: true,
          hasInvert: true,
          currentBid: null,
          currentProtocol: 'none',
          locked: false,
        },
      ],
    });
  };

  const handleSoloLockBid = (bid: number, protocol: VaultProtocol) => {
    if (!soloGame || soloGame.state !== 'bidding') return;
    const vaultVal = soloGame.vaultDeck[soloGame.round - 1];
    const botMove = pickBotVaultMove(soloGame.players[1], vaultVal, 8 - soloGame.round);
    const p0 = { ...soloGame.players[0], currentBid: bid, currentProtocol: protocol };
    const p1 = { ...soloGame.players[1], currentBid: botMove.bid, currentProtocol: botMove.protocol };
    const { nextP0, nextP1, log } = resolveVaultRound(soloGame.round, vaultVal, p0, p1);

    if (soundEnabled) {
      playSound(log.winnerIdx === 0 && vaultVal > 0 ? 'win' : log.inverted ? 'paradox' : 'chip');
    }

    setSoloGame({
      ...soloGame,
      state: 'reveal',
      players: [nextP0, nextP1],
      history: [...soloGame.history, log],
    });
  };

  const handleSoloNextRound = () => {
    if (!soloGame) return;
    if (soloGame.round >= 7) {
      const [p0, p1] = soloGame.players;
      const winnerUid = p0.score > p1.score ? p0.uid : p1.score > p0.score ? p1.uid : 'TIE';
      if (winnerUid === 'human') {
        if (soundEnabled) playSound('win');
        confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
      }
      setSoloGame({ ...soloGame, state: 'finished', winnerUid });
      return;
    }
    setSoloGame({ ...soloGame, state: 'bidding', round: soloGame.round + 1 });
  };

  const handleCreateMulti = async () => {
    if (!auth.currentUser || busy) return;
    playSound('deal');
    setBusy(true);
    setError(null);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    let sid = sessionStorage.getItem('vaultTabSid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2);
      sessionStorage.setItem('vaultTabSid', sid);
    }
    try {
      await setDoc(doc(db, 'blind_vault_games', code), {
        creatorId: auth.currentUser.uid,
        state: 'waiting',
        round: 1,
        vaultDeck: buildVaultDeck(),
        history: [],
        winnerUid: null,
        createdAt: Date.now(),
        players: [
          {
            uid: auth.currentUser.uid,
            sessionId: sid,
            nickname: nickname.trim() || 'Host',
            credits: STARTING_CREDITS,
            score: 0,
            hasDouble: true,
            hasInvert: true,
            currentBid: null,
            currentProtocol: 'none',
            locked: false,
          },
        ],
      });
      router.push(`/blind-vault/${code}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create vault room.');
      setBusy(false);
    }
  };

  const handleJoinMulti = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      const snap = await getDoc(doc(db, 'blind_vault_games', code));
      if (!snap.exists()) {
        setError('No Blind Vault room found with that code.');
        setBusy(false);
        return;
      }
      const query = nickname.trim() ? `?name=${encodeURIComponent(nickname.trim())}` : '';
      router.push(`/blind-vault/${code}${query}`);
    } catch {
      setError('Could not join room.');
      setBusy(false);
    }
  };

  if (soloGame) {
    return (
      <BlindVaultArena
        game={soloGame}
        meIdx={0}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onExit={() => setSoloGame(null)}
        onLockBid={handleSoloLockBid}
        onNextRound={handleSoloNextRound}
        onPlayAgain={startSolo}
      />
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#06050b] text-white flex flex-col items-center justify-center p-4 relative">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-amber-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[450px] h-[350px] bg-fuchsia-600/10 rounded-full blur-[110px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      <Link
        href="/tactical-games"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white"
      >
        <ArrowLeft size={13} /> Tactical Arenas
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-4">
          <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/35 bg-amber-950/50">
            <Coins className="text-amber-300" size={22} />
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-amber-400 mb-1">
            All-Pay Blind Auction
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-fuchsia-400">
            Blind Vault
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-xs mx-auto">
            100 Credits, 7 Vaults, 1 Trap. Secretly bid and deploy 2× Surge or Invert sabotage to steal vaults for 0 credits.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-400/20 bg-black/65 backdrop-blur-xl p-5 shadow-2xl space-y-3.5">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-white/10">
              <button
                type="button"
                onClick={() => setMode('multi')}
                className={`py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 ${
                  mode === 'multi' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> 1v1 Live PvP
              </button>
              <button
                type="button"
                onClick={() => setMode('solo')}
                className={`py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 ${
                  mode === 'solo' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> Solo vs AI
              </button>
            </div>

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your codename..."
              maxLength={14}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
            />

            {mode === 'multi' ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateMulti}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-fuchsia-500 text-black font-black uppercase tracking-widest text-xs"
              >
                {busy ? 'Opening Vault...' : 'Create 1v1 Auction'}
              </button>
            ) : (
              <button
                type="button"
                onClick={startSolo}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-fuchsia-500 text-black font-black uppercase tracking-widest text-xs"
              >
                Challenge Syndicate AI
              </button>
            )}
          </div>

          {mode === 'multi' && (
            <form onSubmit={handleJoinMulti} className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="VAULT CODE"
                maxLength={8}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-center font-mono text-xs uppercase tracking-[0.25em] text-amber-100"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || busy}
                className="bg-white text-black font-black px-5 py-2.5 rounded-xl uppercase text-xs disabled:opacity-40"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
