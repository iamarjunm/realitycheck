'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Coins,
  Zap,
  RefreshCw,
  Lock,
  Copy,
  Check,
  Trophy,
  RotateCcw,
  Skull,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { BlindVaultState, VaultProtocol } from '@/lib/blind-vault';
import { playSound } from '@/lib/sounds';

interface BlindVaultArenaProps {
  game: BlindVaultState;
  meIdx: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onJoinRoom?: (nickname: string) => void;
  onLockBid: (bid: number, protocol: VaultProtocol) => void;
  onNextRound?: () => void;
  onPlayAgain?: () => void;
  busy?: boolean;
}

export function BlindVaultArena({
  game,
  meIdx,
  soundEnabled,
  onToggleSound,
  onExit,
  onJoinRoom,
  onLockBid,
  onNextRound,
  onPlayAgain,
  busy = false,
}: BlindVaultArenaProps) {
  const [bid, setBid] = useState(0);
  const [protocol, setProtocol] = useState<VaultProtocol>('none');
  const [copied, setCopied] = useState(false);
  const [joinName, setJoinName] = useState('');

  const sfx = (t: Parameters<typeof playSound>[0]) => {
    if (soundEnabled) playSound(t);
  };

  const me = meIdx !== -1 ? game.players[meIdx] : null;
  const opp = meIdx !== -1 && game.players.length === 2 ? game.players[meIdx === 0 ? 1 : 0] : null;
  const isHost = meIdx === 0 || game.mode === 'solo';

  useEffect(() => {
    if (game.state === 'bidding' && me && !me.locked) {
      setBid(Math.min(10, me.credits));
      setProtocol('none');
    }
  }, [game.state, game.round, me?.locked, me?.credits]);

  const currentVault = game.vaultDeck[game.round - 1] ?? 0;
  const isTrap = currentVault < 0;
  const latestLog = game.history[game.history.length - 1] ?? null;

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#06050b] text-white flex flex-col relative">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-amber-500/[0.08] rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-fuchsia-600/[0.08] rounded-full blur-[110px]" />
        <div className="absolute inset-0 bg-grid-white opacity-30" />
      </div>

      {/* 48px HUD */}
      <header className="relative z-20 w-full border-b border-amber-500/20 bg-black/75 backdrop-blur-xl shrink-0">
        <div className="max-w-[1340px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { sfx('chip'); onExit(); }}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby
            </button>
            <span className="text-white/15">|</span>
            <span className="font-black uppercase tracking-tight text-xs sm:text-sm text-white">
              Blind Vault
            </span>
            <span className="px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-500/10 font-mono text-[10px] font-bold text-amber-300">
              Vault {Math.min(7, game.round)} / 7
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1340px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center gap-3">
        {/* WAITING */}
        {game.state === 'waiting' && (
          <div className="max-w-md w-full mx-auto bg-black/75 border border-amber-500/25 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <Coins className="w-10 h-10 text-amber-400 mx-auto" />
            {meIdx === -1 && onJoinRoom ? (
              <>
                <h1 className="text-xl font-black uppercase">Enter Blind Vault</h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="CODENAME"
                    maxLength={14}
                    className="flex-1 bg-zinc-950 border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white"
                  />
                  <button
                    type="button"
                    disabled={busy || !joinName.trim()}
                    onClick={() => onJoinRoom(joinName.trim())}
                    className="px-5 py-2 rounded-xl bg-amber-400 text-black font-black uppercase text-xs disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-black uppercase">Waiting for Rival Bidder</h1>
                {game.gameId && (
                  <div className="flex items-center justify-between bg-zinc-950 border border-amber-500/25 rounded-xl px-4 py-3 text-left">
                    <div>
                      <div className="text-[9px] font-mono uppercase text-zinc-500">Vault Code</div>
                      <div className="font-mono text-2xl font-black tracking-[0.22em] text-amber-300">{game.gameId}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(game.gameId!);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1600);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ACTIVE GAME */}
        {game.state !== 'waiting' && me && opp && (
          <>
            {/* Player Score & Credits Strip */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="rounded-2xl border border-amber-400/35 bg-amber-950/15 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-amber-300">{me.nickname} (You)</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-zinc-300">
                    <span className="inline-flex items-center gap-1 text-amber-200"><Coins size={12} /> {me.credits} CR</span>
                    <span className="text-zinc-600">|</span>
                    <span className={me.hasDouble ? 'text-cyan-300' : 'text-zinc-600 line-through'}>2×</span>
                    <span className={me.hasInvert ? 'text-fuchsia-300' : 'text-zinc-600 line-through'}>INV</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono uppercase text-zinc-400">Score</div>
                  <div className="font-mono text-2xl font-black text-white">{me.score}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/55 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-fuchsia-300">{opp.nickname}</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-zinc-400">
                    <span className="inline-flex items-center gap-1"><Coins size={12} /> {opp.credits} CR</span>
                    <span className="text-zinc-600">|</span>
                    <span className={opp.hasDouble ? 'text-cyan-300/70' : 'text-zinc-700 line-through'}>2×</span>
                    <span className={opp.hasInvert ? 'text-fuchsia-300/70' : 'text-zinc-700 line-through'}>INV</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono uppercase text-zinc-400">Score</div>
                  <div className="font-mono text-2xl font-black text-fuchsia-300">{opp.score}</div>
                </div>
              </div>
            </div>

            {/* Center Workspace */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* LEFT 5 COLS: CURRENT VAULT CARD + REMAINING DECK */}
              <section className="lg:col-span-5 bg-black/60 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  <span>Active Auction</span>
                  <span>All-Pay Blind Bid</span>
                </div>

                <motion.div
                  key={`vault-${game.round}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`mx-auto w-full max-w-[260px] rounded-2xl border-2 p-6 text-center my-auto shadow-2xl ${
                    isTrap
                      ? 'border-rose-500 bg-gradient-to-b from-rose-950/60 to-black shadow-[0_0_40px_rgba(244,63,94,0.25)]'
                      : 'border-amber-400 bg-gradient-to-b from-amber-950/50 to-black shadow-[0_0_40px_rgba(245,158,11,0.22)]'
                  }`}
                >
                  <div className="mx-auto w-12 h-12 rounded-xl bg-black/50 border border-white/15 flex items-center justify-center mb-3">
                    {isTrap ? <Skull className="w-6 h-6 text-rose-400" /> : <Sparkles className="w-6 h-6 text-amber-300" />}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400">
                    {isTrap ? 'CURSED TRAP VAULT' : 'HIGH-VALUE VAULT'}
                  </div>
                  <div className={`text-5xl font-black font-mono mt-1 ${isTrap ? 'text-rose-400' : 'text-amber-300'}`}>
                    {currentVault > 0 ? `+${currentVault}` : currentVault}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 mt-2">
                    {isTrap
                      ? 'Lowest bid eats -3 pts (unless INVERTED!)'
                      : 'Highest bid claims pts (unless INVERTED!)'}
                  </p>
                </motion.div>

                {/* Upcoming Vaults */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                    Vault Schedule
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {game.vaultDeck.map((v, i) => {
                      const done = i < game.round - 1;
                      const curr = i === game.round - 1;
                      return (
                        <div
                          key={i}
                          className={`py-1.5 rounded-lg border text-center font-mono text-xs font-black ${
                            curr
                              ? v < 0
                                ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                                : 'border-amber-400 bg-amber-400/20 text-amber-200'
                              : done
                              ? 'border-white/5 bg-zinc-950/50 text-zinc-600 line-through'
                              : 'border-white/10 bg-zinc-950 text-zinc-400'
                          }`}
                        >
                          {v > 0 ? `+${v}` : v}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* RIGHT 7 COLS: BID CONSOLE OR REVEAL + HISTORY */}
              <section className="lg:col-span-7 bg-black/60 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
                {game.state === 'bidding' && (
                  me.locked ? (
                    <div className="my-auto text-center space-y-2 py-10">
                      <Lock className="w-9 h-9 text-amber-400 mx-auto animate-pulse" />
                      <div className="text-sm font-black uppercase tracking-widest text-amber-300">
                        Bid Sealed ({me.currentBid} CR)
                      </div>
                      <p className="text-xs text-zinc-400">
                        Waiting for {opp.nickname} to submit their blind bid...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            Secret Bid Amount
                          </span>
                          <span className="font-mono text-xl font-black text-amber-300">
                            {bid} <span className="text-xs text-zinc-500">/ {me.credits} CR</span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={me.credits}
                          value={bid}
                          onChange={(e) => setBid(Number(e.target.value))}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                        <div className="flex gap-1.5 mt-2">
                          {[0, 5, 10, 20, 35, me.credits].map((preset, idx) => {
                            const val = Math.min(me.credits, preset);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => { sfx('chip'); setBid(val); }}
                                className="flex-1 py-1.5 rounded-lg border border-white/10 bg-zinc-950 hover:border-amber-400/50 font-mono text-[11px] font-bold text-zinc-300"
                              >
                                {idx === 5 ? 'ALL' : val}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Protocol Sabotage Selector */}
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
                          Optional Protocol (1 use each per match)
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => { sfx('chip'); setProtocol('none'); }}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              protocol === 'none'
                                ? 'border-white/50 bg-white/10 text-white'
                                : 'border-white/10 bg-zinc-950 text-zinc-400'
                            }`}
                          >
                            <div className="text-xs font-black flex items-center gap-1"><ShieldCheck size={13} /> Standard</div>
                            <div className="text-[10px] opacity-70 mt-0.5">No sabotage</div>
                          </button>

                          <button
                            type="button"
                            disabled={!me.hasDouble}
                            onClick={() => { sfx('laser'); setProtocol('double'); }}
                            className={`p-2.5 rounded-xl border text-left transition-all disabled:opacity-30 ${
                              protocol === 'double'
                                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                                : 'border-cyan-500/25 bg-zinc-950 text-cyan-300/80'
                            }`}
                          >
                            <div className="text-xs font-black flex items-center gap-1"><Zap size={13} /> 2× Surge</div>
                            <div className="text-[10px] opacity-75 mt-0.5">Effective: {bid * 2}</div>
                          </button>

                          <button
                            type="button"
                            disabled={!me.hasInvert}
                            onClick={() => { sfx('paradox'); setProtocol('invert'); }}
                            className={`p-2.5 rounded-xl border text-left transition-all disabled:opacity-30 ${
                              protocol === 'invert'
                                ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200'
                                : 'border-fuchsia-500/25 bg-zinc-950 text-fuchsia-300/80'
                            }`}
                          >
                            <div className="text-xs font-black flex items-center gap-1"><RefreshCw size={13} /> Invert</div>
                            <div className="text-[10px] opacity-75 mt-0.5">Lowest wins!</div>
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          sfx('reaction');
                          onLockBid(bid, protocol);
                        }}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-fuchsia-500 text-black font-black uppercase tracking-widest text-xs hover:opacity-95 transition-opacity shadow-[0_0_25px_rgba(245,158,11,0.28)]"
                      >
                        Seal Blind Bid ({bid} CR{protocol !== 'none' ? ` + ${protocol.toUpperCase()}` : ''})
                      </button>
                    </div>
                  )
                )}

                {game.state === 'reveal' && latestLog && (
                  <div className="space-y-3 my-auto">
                    <div className="text-center">
                      <span className="px-3 py-1 rounded-full border border-amber-400/35 bg-amber-400/15 font-mono text-[10px] font-black uppercase text-amber-300">
                        Vault {latestLog.round} Showdown
                      </span>
                      <h2 className="text-lg font-black uppercase text-white mt-2">
                        {latestLog.summary}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-amber-400/30 bg-zinc-950 p-3 text-center">
                        <div className="text-[10px] font-mono text-zinc-400">{game.players[0].nickname}</div>
                        <div className="font-mono text-2xl font-black text-amber-300">{latestLog.p0Eff}</div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          Bid {latestLog.p0Bid} CR {latestLog.p0Proto !== 'none' ? `· ${latestLog.p0Proto.toUpperCase()}` : ''}
                        </div>
                      </div>
                      <div className="rounded-xl border border-fuchsia-400/30 bg-zinc-950 p-3 text-center">
                        <div className="text-[10px] font-mono text-zinc-400">{game.players[1].nickname}</div>
                        <div className="font-mono text-2xl font-black text-fuchsia-300">{latestLog.p1Eff}</div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          Bid {latestLog.p1Bid} CR {latestLog.p1Proto !== 'none' ? `· ${latestLog.p1Proto.toUpperCase()}` : ''}
                        </div>
                      </div>
                    </div>

                    {isHost && onNextRound ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { sfx('deal'); onNextRound(); }}
                        className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-widest text-xs"
                      >
                        {game.round >= 7 ? 'View Final Results' : `Open Vault ${game.round + 1}`}
                      </button>
                    ) : (
                      <p className="text-center text-xs font-mono text-zinc-500">
                        Waiting for host to open next vault...
                      </p>
                    )}
                  </div>
                )}

                {/* Compact Round History */}
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">
                    Auction Ledger
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto text-[11px] font-mono">
                    {game.history.length === 0 ? (
                      <div className="text-zinc-600">No vaults resolved yet.</div>
                    ) : (
                      [...game.history].reverse().map((h) => (
                        <div key={h.round} className="flex items-center justify-between text-zinc-300 bg-zinc-950/70 px-2.5 py-1 rounded-md">
                          <span className="truncate">{h.summary}</span>
                          <span className="text-zinc-500 shrink-0 ml-2">{h.p0Eff} vs {h.p1Eff}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {game.state === 'finished' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-amber-400/30 rounded-2xl p-6 text-center space-y-4">
            <Trophy className="w-10 h-10 text-amber-300 mx-auto" />
            <h2 className="text-2xl font-black uppercase">
              {game.winnerUid === 'TIE'
                ? 'Auction Tied!'
                : game.winnerUid === me?.uid
                ? 'Vault Master!'
                : 'Outbid!'}
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              {game.players[0]?.nickname}: {game.players[0]?.score} pts · {game.players[1]?.nickname}: {game.players[1]?.score} pts
            </p>
            <div className="flex gap-2">
              {isHost && onPlayAgain && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPlayAgain}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 text-black font-black uppercase text-xs flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Play Again
                </button>
              )}
              <button
                type="button"
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white font-bold uppercase text-xs"
              >
                Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
