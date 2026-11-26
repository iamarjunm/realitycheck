'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Coins, Bot, Users, Sparkles, RefreshCw, Skull } from 'lucide-react';
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
import GameArtwork from '@/components/GameArtwork';
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0e0b0a] atelier-bg text-[#f5efe4] flex flex-col relative">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(218,175,88,0.14), transparent 65%), radial-gradient(ellipse 40% 35% at 15% 85%, rgba(155,38,54,0.12), transparent 60%)',
        }}
      />

      <header className="relative z-20 shrink-0 border-b border-[#d4a853]/18 bg-[#0e0b0a]/85 backdrop-blur-md px-5 h-14 flex items-center justify-between">
        <Link
          href="/tactical-games"
          className="btn-obsidian inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium text-[#e7decb]"
        >
          <ArrowLeft size={14} className="text-[#e6c27a]" /> Tactical Arenas
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d4a853]/30 bg-[#1a140f]/90 px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[#e6c27a]">
          <Coins size={12} /> Private Bullion Auction
        </span>
      </header>

      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* LEFT 7 COLS: Key-Art Vault Banner & Lot Brief */}
          <div className="lg:col-span-7 atelier-card rounded-2xl overflow-hidden flex flex-col justify-between border-[#d4a853]/25">
            <div className="relative h-44 sm:h-52 w-full overflow-hidden border-b border-[#d4a853]/22 bg-[#0c0907]">
              <GameArtwork id="blind-vault" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#16110e] via-[#16110e]/30 to-transparent" />
              <div className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-[#e6c27a]/40 bg-[#120d09]/85 backdrop-blur-md px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
                <Sparkles size={11} /> All-Pay Sealed Bids
              </div>
            </div>

            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4 bg-gradient-to-b from-[#17120e]/80 to-[#100d0b]/95">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#faf4e8] uppercase">
                    Blind
                  </h1>
                  <span className="font-serif italic text-3xl sm:text-4xl text-[#e6c27a]">
                    Vault
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#bdb19e] leading-relaxed">
                  100 Bullion Credits, 7 Sealed Lots, 1 Cursed Trap. Outbid your rival in the dark,
                  deploy <span className="text-[#e6c27a] font-medium">2× Surge</span> or{' '}
                  <span className="text-[#f07687] font-medium">Invert</span> sabotage to steal high
                  vaults for zero credits.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl border border-[#d4a853]/30 bg-gradient-to-b from-[#211910] to-[#130f0a] px-2.5 py-3 shadow-[inset_0_1px_0_rgba(245,222,168,0.18)]">
                  <Coins size={15} className="mx-auto text-[#e6c27a] mb-1" />
                  <div className="text-xs font-mono font-semibold text-[#faf4e8]">100 CR</div>
                  <div className="text-[10px] text-[#a39683] mt-0.5">All-Pay Purse</div>
                </div>
                <div className="rounded-xl border border-[#d4a853]/25 bg-gradient-to-b from-[#1e1712] to-[#120e0b] px-2.5 py-3 shadow-[inset_0_1px_0_rgba(245,222,168,0.14)]">
                  <RefreshCw size={15} className="mx-auto text-[#e6c27a] mb-1" />
                  <div className="text-xs font-mono font-semibold text-[#faf4e8]">2× / Invert</div>
                  <div className="text-[10px] text-[#a39683] mt-0.5">1-Use Protocols</div>
                </div>
                <div className="rounded-xl border border-[#d44a5e]/35 bg-gradient-to-b from-[#281116] to-[#14090c] px-2.5 py-3 shadow-[inset_0_1px_0_rgba(253,164,175,0.14)]">
                  <Skull size={15} className="mx-auto text-[#f07687] mb-1" />
                  <div className="text-xs font-mono font-semibold text-[#fda4af]">-3 Trap</div>
                  <div className="text-[10px] text-[#a39683] mt-0.5">Cursed Lot</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Auction Entry Console */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-3.5">
            {error && (
              <div className="rounded-xl border border-[#d44a5e]/45 bg-[#36111a]/80 px-3.5 py-2.5 text-xs text-[#fda4af] text-center">
                {error}
              </div>
            )}

            <div className="atelier-card rounded-2xl p-5 sm:p-6 space-y-4 border-[#d4a853]/25 bg-gradient-to-b from-[#17120e]/95 to-[#100d0b]/95">
              <div className="flex items-center justify-between border-b border-[#d4a853]/18 pb-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#b9aa94]">
                  Bidder Registration
                </span>
                <span className="font-serif italic text-xs text-[#e6c27a]">Lot No. I–VII</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0a0807] border border-[#d4a853]/22">
                <button
                  type="button"
                  onClick={() => setMode('multi')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'multi'
                      ? 'bg-gradient-to-b from-[#e8c67c] to-[#b98a36] text-[#141008] shadow-[inset_0_1px_0_rgba(255,250,235,0.6)]'
                      : 'text-[#9e917e] hover:text-[#f5efe4]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> 1v1 Live PvP
                </button>
                <button
                  type="button"
                  onClick={() => setMode('solo')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'solo'
                      ? 'bg-gradient-to-b from-[#e8c67c] to-[#b98a36] text-[#141008] shadow-[inset_0_1px_0_rgba(255,250,235,0.6)]'
                      : 'text-[#9e917e] hover:text-[#f5efe4]'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" /> Solo vs AI
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#b9aa94] mb-1.5">
                  Bidder Codename
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your codename..."
                  maxLength={14}
                  className="w-full bg-[#0a0807] border border-[#d4a853]/22 focus:border-[#e6c27a]/75 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#faf4e8] placeholder:text-[#5d5346] focus:outline-none transition-colors shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]"
                />
              </div>

              {mode === 'multi' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreateMulti}
                  className="btn-brass w-full py-3 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Opening Vault...' : 'Create 1v1 Auction'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startSolo}
                  className="btn-brass w-full py-3 rounded-xl font-semibold text-sm cursor-pointer"
                >
                  Challenge Syndicate AI
                </button>
              )}

              {mode === 'multi' && (
                <div className="pt-3 border-t border-[#d4a853]/18 space-y-2">
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8d8170]">
                    Enter Private Vault
                  </label>
                  <form onSubmit={handleJoinMulti} className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="VAULT CODE"
                      maxLength={8}
                      className="flex-1 bg-[#0a0807] border border-[#d4a853]/22 focus:border-[#e6c27a]/75 rounded-xl px-3.5 py-2.5 text-center font-mono text-xs uppercase tracking-[0.25em] text-[#faf4e8] placeholder:text-[#5d5346] focus:outline-none transition-colors shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]"
                    />
                    <button
                      type="submit"
                      disabled={!joinCode.trim() || busy}
                      className="btn-obsidian text-[#e6c27a] font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer disabled:opacity-40"
                    >
                      Join
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
