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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative">
      {/* 48px HUD */}
      <header className="relative z-20 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md shrink-0">
        <div className="max-w-[1340px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { sfx('chip'); onExit(); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-zinc-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby
            </button>
            <span className="text-zinc-800">|</span>
            <span className="font-semibold tracking-tight text-sm text-zinc-50">
              Blind Vault
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 font-mono text-[11px] font-medium text-amber-400">
              Vault {Math.min(7, game.round)} / 7
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1340px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center gap-3">
        {/* WAITING */}
        {game.state === 'waiting' && (
          <div className="max-w-md w-full mx-auto bg-[#111113] border border-zinc-800/90 rounded-2xl p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950">
              <Coins className="w-6 h-6 text-amber-400" />
            </div>
            {meIdx === -1 && onJoinRoom ? (
              <>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Enter Blind Vault</h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="CODENAME"
                    maxLength={14}
                    className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-zinc-400 focus:outline-none rounded-xl px-3 py-2 text-xs font-mono uppercase text-zinc-100 placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    disabled={busy || !joinName.trim()}
                    onClick={() => onJoinRoom(joinName.trim())}
                    className="px-5 py-2 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Waiting for Rival Bidder</h1>
                {game.gameId && (
                  <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-left">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Vault Code</div>
                      <div className="font-mono text-2xl font-semibold tracking-[0.22em] text-amber-400">{game.gameId}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(game.gameId!);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1600);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
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
              <div className="rounded-2xl border border-amber-500/35 bg-[#111113] p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-amber-400">{me.nickname} (You)</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-zinc-300">
                    <span className="inline-flex items-center gap-1 text-zinc-100"><Coins size={12} className="text-amber-400" /> {me.credits} CR</span>
                    <span className="text-zinc-700">|</span>
                    <span className={me.hasDouble ? 'text-sky-400' : 'text-zinc-600 line-through'}>2×</span>
                    <span className={me.hasInvert ? 'text-rose-400' : 'text-zinc-600 line-through'}>INV</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Score</div>
                  <div className="font-mono text-2xl font-semibold text-zinc-50">{me.score}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-200">{opp.nickname}</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-zinc-400">
                    <span className="inline-flex items-center gap-1"><Coins size={12} className="text-zinc-500" /> {opp.credits} CR</span>
                    <span className="text-zinc-700">|</span>
                    <span className={opp.hasDouble ? 'text-sky-400/80' : 'text-zinc-700 line-through'}>2×</span>
                    <span className={opp.hasInvert ? 'text-rose-400/80' : 'text-zinc-700 line-through'}>INV</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Score</div>
                  <div className="font-mono text-2xl font-semibold text-zinc-300">{opp.score}</div>
                </div>
              </div>
            </div>

            {/* Center Workspace */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* LEFT 5 COLS: CURRENT VAULT CARD + REMAINING DECK */}
              <section className="lg:col-span-5 bg-[#111113] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  <span>Active Auction</span>
                  <span>All-Pay Blind Bid</span>
                </div>

                <motion.div
                  key={`vault-${game.round}`}
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`mx-auto w-full max-w-[260px] rounded-2xl border p-6 text-center my-auto ${
                    isTrap
                      ? 'border-rose-500/60 bg-rose-950/20'
                      : 'border-amber-400/50 bg-zinc-950'
                  }`}
                >
                  <div className="mx-auto w-11 h-11 rounded-xl bg-[#111113] border border-zinc-800 flex items-center justify-center mb-3">
                    {isTrap ? <Skull className="w-5 h-5 text-rose-400" /> : <Sparkles className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div className={`text-[10px] font-mono uppercase tracking-[0.22em] ${isTrap ? 'text-rose-400' : 'text-zinc-400'}`}>
                    {isTrap ? 'Cursed Trap Vault' : 'High-Value Vault'}
                  </div>
                  <div className={`text-5xl font-semibold font-mono mt-1.5 tracking-tight ${isTrap ? 'text-rose-400' : 'text-amber-400'}`}>
                    {currentVault > 0 ? `+${currentVault}` : currentVault}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    {isTrap
                      ? 'Lowest bid eats -3 pts (unless inverted)'
                      : 'Highest bid claims pts (unless inverted)'}
                  </p>
                </motion.div>

                {/* Upcoming Vaults */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Vault Schedule
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {game.vaultDeck.map((v, i) => {
                      const done = i < game.round - 1;
                      const curr = i === game.round - 1;
                      return (
                        <div
                          key={i}
                          className={`py-1.5 rounded-lg border text-center font-mono text-xs font-semibold ${
                            curr
                              ? v < 0
                                ? 'border-rose-400/70 bg-rose-500/15 text-rose-400'
                                : 'border-amber-400/70 bg-amber-500/15 text-amber-400'
                              : done
                              ? 'border-zinc-900 bg-zinc-950/60 text-zinc-700 line-through'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-400'
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
              <section className="lg:col-span-7 bg-[#111113] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
                {game.state === 'bidding' && (
                  me.locked ? (
                    <div className="my-auto text-center space-y-2 py-10">
                      <Lock className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                      <div className="text-sm font-semibold text-zinc-100">
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
                          <span className="text-xs font-semibold text-zinc-200">
                            Secret Bid Amount
                          </span>
                          <span className="font-mono text-xl font-semibold text-amber-400">
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
                        <div className="flex gap-1.5 mt-2.5">
                          {[0, 5, 10, 20, 35, me.credits].map((preset, idx) => {
                            const val = Math.min(me.credits, preset);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => { sfx('chip'); setBid(val); }}
                                className="flex-1 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-600 font-mono text-[11px] font-medium text-zinc-300 transition-colors cursor-pointer"
                              >
                                {idx === 5 ? 'ALL' : val}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Protocol Sabotage Selector */}
                      <div>
                        <div className="text-[11px] font-medium text-zinc-400 mb-2">
                          Optional Protocol (1 use each per match)
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => { sfx('chip'); setProtocol('none'); }}
                            className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                              protocol === 'none'
                                ? 'border-zinc-400 bg-zinc-900 text-zinc-50'
                                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div className="text-xs font-semibold flex items-center gap-1.5"><ShieldCheck size={13} /> Standard</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">No sabotage</div>
                          </button>

                          <button
                            type="button"
                            disabled={!me.hasDouble}
                            onClick={() => { sfx('laser'); setProtocol('double'); }}
                            className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                              protocol === 'double'
                                ? 'border-sky-400 bg-sky-500/15 text-sky-300'
                                : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            <div className="text-xs font-semibold flex items-center gap-1.5 text-sky-400"><Zap size={13} /> 2× Surge</div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">Effective: {bid * 2}</div>
                          </button>

                          <button
                            type="button"
                            disabled={!me.hasInvert}
                            onClick={() => { sfx('paradox'); setProtocol('invert'); }}
                            className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                              protocol === 'invert'
                                ? 'border-rose-400 bg-rose-500/15 text-rose-300'
                                : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            <div className="text-xs font-semibold flex items-center gap-1.5 text-rose-400"><RefreshCw size={13} /> Invert</div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">Lowest wins!</div>
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
                        className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Seal Blind Bid ({bid} CR{protocol !== 'none' ? ` + ${protocol.toUpperCase()}` : ''})
                      </button>
                    </div>
                  )
                )}

                {game.state === 'reveal' && latestLog && (
                  <div className="space-y-3.5 my-auto">
                    <div className="text-center">
                      <span className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900 font-mono text-[11px] font-medium text-amber-400">
                        Vault {latestLog.round} Showdown
                      </span>
                      <h2 className="text-lg font-semibold text-zinc-50 mt-2">
                        {latestLog.summary}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-amber-500/35 bg-zinc-950 p-3.5 text-center">
                        <div className="text-[11px] font-medium text-zinc-400">{game.players[0].nickname}</div>
                        <div className="font-mono text-2xl font-semibold text-amber-400 mt-0.5">{latestLog.p0Eff}</div>
                        <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          Bid {latestLog.p0Bid} CR {latestLog.p0Proto !== 'none' ? `· ${latestLog.p0Proto.toUpperCase()}` : ''}
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-center">
                        <div className="text-[11px] font-medium text-zinc-400">{game.players[1].nickname}</div>
                        <div className="font-mono text-2xl font-semibold text-zinc-100 mt-0.5">{latestLog.p1Eff}</div>
                        <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          Bid {latestLog.p1Bid} CR {latestLog.p1Proto !== 'none' ? `· ${latestLog.p1Proto.toUpperCase()}` : ''}
                        </div>
                      </div>
                    </div>

                    {isHost && onNextRound ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { sfx('deal'); onNextRound(); }}
                        className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
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
                <div className="pt-2.5 border-t border-zinc-800/80">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                    Auction Ledger
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto text-[11px] font-mono">
                    {game.history.length === 0 ? (
                      <div className="text-zinc-600">No vaults resolved yet.</div>
                    ) : (
                      [...game.history].reverse().map((h) => (
                        <div key={h.round} className="flex items-center justify-between text-zinc-300 bg-zinc-950 border border-zinc-800/60 px-2.5 py-1.5 rounded-lg">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              {game.winnerUid === 'TIE'
                ? 'Auction Tied'
                : game.winnerUid === me?.uid
                ? 'Vault Master'
                : 'Outbid'}
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              {game.players[0]?.nickname}: {game.players[0]?.score} pts · {game.players[1]?.nickname}: {game.players[1]?.score} pts
            </p>
            <div className="flex gap-2.5">
              {isHost && onPlayAgain && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPlayAgain}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Play Again
                </button>
              )}
              <button
                type="button"
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
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
