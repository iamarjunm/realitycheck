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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative">
      <header className="shrink-0 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md px-5 h-14 flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-50 transition-colors"
        >
          <ArrowLeft size={14} /> Tactical Arenas
        </Link>
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-300">
          All-Pay Blind Auction
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-5"
        >
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#111113]">
              <Coins className="text-amber-400" size={22} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
              Blind Vault
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
              100 Credits, 7 Vaults, 1 Trap. Secretly bid and deploy 2× Surge or Invert sabotage to steal vaults for 0 credits.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-5 space-y-4">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setMode('multi')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    mode === 'multi' ? 'bg-zinc-50 text-zinc-950' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> 1v1 Live PvP
                </button>
                <button
                  type="button"
                  onClick={() => setMode('solo')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    mode === 'solo' ? 'bg-zinc-50 text-zinc-950' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" /> Solo vs AI
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                  Bidder Codename
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your codename..."
                  maxLength={14}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-400 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              {mode === 'multi' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreateMulti}
                  className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Opening Vault...' : 'Create 1v1 Auction'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startSolo}
                  className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors cursor-pointer"
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
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-zinc-400 rounded-xl px-3.5 py-2.5 text-center font-mono text-xs uppercase tracking-[0.25em] text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!joinCode.trim() || busy}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-40"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
