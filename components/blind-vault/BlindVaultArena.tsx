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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0e0b0a] atelier-bg text-[#f5efe4] flex flex-col relative">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(218,175,88,0.14), transparent 65%), radial-gradient(ellipse 40% 35% at 15% 85%, rgba(155,38,54,0.11), transparent 60%)',
        }}
      />

      {/* 48px Auction House HUD */}
      <header className="relative z-20 w-full border-b border-[#d4a853]/18 bg-[#0e0b0a]/85 backdrop-blur-md shrink-0">
        <div className="max-w-[1340px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { sfx('chip'); onExit(); }}
              className="btn-obsidian inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium text-[#e7decb] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#e6c27a]" /> Lobby
            </button>
            <span className="text-[#d4a853]/30">|</span>
            <span className="font-display font-bold tracking-tight text-sm text-[#faf4e8] uppercase">
              Blind <span className="font-serif italic font-normal capitalize text-[#e6c27a]">Vault</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-[#d4a853]/35 bg-[#1d160e] font-mono text-[11px] font-semibold text-[#e6c27a]">
              Lot {Math.min(7, game.round)} / 7
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            className="btn-obsidian p-1.5 rounded-xl cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#e6c27a]" /> : <VolumeX className="w-3.5 h-3.5 text-[#7c7163]" />}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1340px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center gap-3">
        {/* WAITING */}
        {game.state === 'waiting' && (
          <div className="atelier-card max-w-md w-full mx-auto rounded-2xl border-[#d4a853]/30 bg-gradient-to-b from-[#17120e]/95 to-[#100c0a]/95 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4a853]/40 bg-gradient-to-b from-[#292012] to-[#140f09]">
              <Coins className="w-6 h-6 text-[#e6c27a]" />
            </div>
            {meIdx === -1 && onJoinRoom ? (
              <>
                <h1 className="font-display text-xl font-bold tracking-tight text-[#faf4e8]">
                  Enter <span className="font-serif italic font-normal text-[#e6c27a]">Blind Vault</span>
                </h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="CODENAME"
                    maxLength={14}
                    className="flex-1 bg-[#0a0807] border border-[#d4a853]/25 focus:border-[#e6c27a]/75 focus:outline-none rounded-xl px-3 py-2 text-xs font-mono uppercase text-[#faf4e8] placeholder:text-[#5d5346]"
                  />
                  <button
                    type="button"
                    disabled={busy || !joinName.trim()}
                    onClick={() => onJoinRoom(joinName.trim())}
                    className="btn-brass px-5 py-2 rounded-xl font-semibold text-xs cursor-pointer disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-display text-xl font-bold tracking-tight text-[#faf4e8]">
                  Waiting for <span className="font-serif italic font-normal text-[#e6c27a]">Rival Bidder</span>
                </h1>
                {game.gameId && (
                  <div className="flex items-center justify-between bg-[#0a0807] border border-[#d4a853]/28 rounded-xl px-4 py-3 text-left shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#9c8f7c]">Vault Code</div>
                      <div className="font-mono text-2xl font-semibold tracking-[0.22em] text-[#e6c27a]">{game.gameId}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(game.gameId!);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1600);
                      }}
                      className="btn-obsidian px-3 py-1.5 rounded-xl text-[#e6c27a] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
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
              <div className="atelier-card rounded-2xl border-[#e6c27a]/40 bg-gradient-to-r from-[#1d160f]/95 to-[#120e0b]/95 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#e6c27a]">{me.nickname} <span className="font-serif italic font-normal text-[#c5b59b]">(You)</span></div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#d8ccb8]">
                    <span className="inline-flex items-center gap-1 text-[#faf4e8] font-semibold">
                      <Coins size={12} className="text-[#e6c27a]" /> {me.credits} CR
                    </span>
                    <span className="text-[#594e3f]">|</span>
                    <span className={me.hasDouble ? 'text-[#f2d48f]' : 'text-[#5d5346] line-through'}>2×</span>
                    <span className={me.hasInvert ? 'text-[#f07687]' : 'text-[#5d5346] line-through'}>INV</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#9c8f7c]">Points</div>
                  <div className="font-serif italic text-3xl font-bold leading-none text-[#f5dc9f]">{me.score}</div>
                </div>
              </div>

              <div className="atelier-card rounded-2xl border-[#d4a853]/20 bg-gradient-to-r from-[#14100d]/95 to-[#100d0b]/95 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#e6dccb]">{opp.nickname}</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#a39683]">
                    <span className="inline-flex items-center gap-1">
                      <Coins size={12} className="text-[#a38b5d]" /> {opp.credits} CR
                    </span>
                    <span className="text-[#594e3f]">|</span>
                    <span className={opp.hasDouble ? 'text-[#e6c27a]/80' : 'text-[#4e453b] line-through'}>2×</span>
                    <span className={opp.hasInvert ? 'text-[#f07687]/80' : 'text-[#4e453b] line-through'}>INV</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8d806e]">Points</div>
                  <div className="font-serif italic text-3xl font-bold leading-none text-[#d8ccb8]">{opp.score}</div>
                </div>
              </div>
            </div>

            {/* Center Workspace */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* LEFT 5 COLS: CURRENT BULLION VAULT PEDESTAL + SCHEDULE */}
              <section className="lg:col-span-5 atelier-card rounded-2xl border-[#d4a853]/25 bg-gradient-to-b from-[#17120e]/95 to-[#0f0c0a]/95 p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-[#a39683]">
                  <span>Active Lot</span>
                  <span className="text-[#e6c27a]">All-Pay Sealed Bid</span>
                </div>

                <motion.div
                  key={`vault-${game.round}`}
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`relative mx-auto w-full max-w-[270px] rounded-2xl border p-6 text-center my-auto overflow-hidden ${
                    isTrap
                      ? 'border-[#e05263]/65 bg-gradient-to-b from-[#3d111b] via-[#240a11] to-[#14060a] shadow-[0_22px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(253,164,175,0.28)]'
                      : 'border-[#e6c27a]/65 bg-gradient-to-b from-[#2d2211] via-[#1c150c] to-[#110d08] shadow-[0_22px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(250,235,191,0.35)]'
                  }`}
                >
                  {/* Decorative corner hairlines */}
                  <span className={`pointer-events-none absolute top-2.5 left-2.5 w-3 h-3 border-t border-l ${isTrap ? 'border-[#f07687]/60' : 'border-[#e6c27a]/60'}`} />
                  <span className={`pointer-events-none absolute top-2.5 right-2.5 w-3 h-3 border-t border-r ${isTrap ? 'border-[#f07687]/60' : 'border-[#e6c27a]/60'}`} />
                  <span className={`pointer-events-none absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l ${isTrap ? 'border-[#f07687]/60' : 'border-[#e6c27a]/60'}`} />
                  <span className={`pointer-events-none absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r ${isTrap ? 'border-[#f07687]/60' : 'border-[#e6c27a]/60'}`} />

                  <div
                    className={`mx-auto w-11 h-11 rounded-xl border flex items-center justify-center mb-3 ${
                      isTrap
                        ? 'bg-[#2a0b13] border-[#e05263]/45'
                        : 'bg-[#21190c] border-[#e6c27a]/45'
                    }`}
                  >
                    {isTrap ? <Skull className="w-5 h-5 text-[#fda4af]" /> : <Sparkles className="w-5 h-5 text-[#f2d48f]" />}
                  </div>
                  <div
                    className={`text-[10px] font-mono uppercase tracking-[0.22em] ${
                      isTrap ? 'text-[#fda4af]' : 'text-[#e6c27a]'
                    }`}
                  >
                    {isTrap ? 'Velvet Trap Vault' : 'Bullion Reserve Lot'}
                  </div>
                  <div
                    className={`font-serif italic text-6xl font-bold mt-1 leading-none tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] ${
                      isTrap ? 'text-[#ff9aa8]' : 'text-[#f6dfa4]'
                    }`}
                  >
                    {currentVault > 0 ? `+${currentVault}` : currentVault}
                  </div>
                  <p className="text-xs text-[#c7b9a3] mt-3 leading-relaxed">
                    {isTrap
                      ? 'Lowest bid eats -3 pts (unless inverted)'
                      : 'Highest bid claims pts (unless inverted)'}
                  </p>
                </motion.div>

                {/* Upcoming Vaults */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#9c8f7c]">
                    Vault Schedule
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {game.vaultDeck.map((v, i) => {
                      const done = i < game.round - 1;
                      const curr = i === game.round - 1;
                      return (
                        <div
                          key={i}
                          className={`py-1.5 rounded-lg border text-center font-mono text-xs font-semibold transition-all ${
                            curr
                              ? v < 0
                                ? 'border-[#f06b7c]/80 bg-[#3d111b] text-[#fda4af] shadow-[0_0_12px_rgba(224,82,99,0.28)]'
                                : 'border-[#e6c27a]/85 bg-gradient-to-b from-[#332612] to-[#1e160a] text-[#f5dc9f] shadow-[0_0_12px_rgba(230,194,122,0.25)]'
                              : done
                              ? 'border-[#1d1814] bg-[#0a0807] text-[#4c443a] line-through'
                              : 'border-[#d4a853]/18 bg-[#120e0b] text-[#b9aa94]'
                          }`}
                        >
                          {v > 0 ? `+${v}` : v}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* RIGHT 7 COLS: BID CONSOLE OR REVEAL + LEDGER */}
              <section style={{ transform: 'none' }} className="lg:col-span-7 atelier-card rounded-2xl border-[#d4a853]/25 bg-gradient-to-b from-[#17120e]/95 to-[#0f0c0a]/95 p-4 sm:p-5 flex flex-col justify-between gap-3">
                {game.state === 'bidding' && (
                  me.locked ? (
                    <div className="my-auto text-center space-y-2.5 py-10">
                      <div className="mx-auto w-12 h-12 rounded-2xl border border-[#e6c27a]/40 bg-[#241c10] flex items-center justify-center">
                        <Lock className="w-6 h-6 text-[#e6c27a] animate-pulse" />
                      </div>
                      <div className="font-display text-base font-bold text-[#faf4e8]">
                        Bid Sealed <span className="font-serif italic font-normal text-[#e6c27a]">({me.currentBid} CR)</span>
                      </div>
                      <p className="text-xs text-[#b5a792]">
                        Waiting for {opp.nickname} to submit their blind bid...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Champagne-Gold Credit Bid Bar */}
                      <div className="rounded-xl border border-[#d4a853]/22 bg-[#0b0908] p-3.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.65)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#b9aa94]">
                            Secret Bullion Bid
                          </span>
                          <span className="font-mono text-2xl font-bold text-[#f2d48f]">
                            {bid} <span className="text-xs font-normal text-[#8d806e]">/ {me.credits} CR</span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={me.credits}
                          value={bid}
                          onChange={(e) => setBid(Number(e.target.value))}
                          className="w-full accent-[#e6c27a] cursor-pointer"
                        />
                        <div className="flex gap-1.5 mt-2.5">
                          {[0, 5, 10, 20, 35, me.credits].map((preset, idx) => {
                            const val = Math.min(me.credits, preset);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => { sfx('chip'); setBid(val); }}
                                className="flex-1 py-1.5 rounded-lg border border-[#d4a853]/22 bg-gradient-to-b from-[#1e1812] to-[#120e0b] hover:border-[#e6c27a]/65 hover:text-[#f5dc9f] font-mono text-[11px] font-semibold text-[#d4c6b0] transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                              >
                                {idx === 5 ? 'ALL' : val}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tactile Engraved Protocol Plaques */}
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a39683] mb-2">
                          Optional Protocol (1 use each per match)
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => { sfx('chip'); setProtocol('none'); }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              protocol === 'none'
                                ? 'border-[#e6c27a]/65 bg-gradient-to-b from-[#231c14] to-[#14100c] text-[#faf4e8] shadow-[inset_0_1px_0_rgba(245,222,168,0.2)]'
                                : 'border-[#d4a853]/18 bg-[#0c0a08] text-[#9e917e] hover:border-[#d4a853]/40'
                            }`}
                          >
                            <div className="text-xs font-semibold flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#e6c27a]" /> Standard</div>
                            <div className="text-[11px] text-[#8d806e] mt-0.5">No sabotage</div>
                          </button>

                          <button
                            type="button"
                            disabled={!me.hasDouble}
                            onClick={() => { sfx('laser'); setProtocol('double'); }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                              protocol === 'double'
                                ? 'border-[#f2d48f] bg-gradient-to-b from-[#3b2c13] to-[#1f170a] text-[#fae6b4] shadow-[0_0_16px_rgba(230,194,122,0.22),inset_0_1px_0_rgba(255,245,214,0.3)]'
                                : 'border-[#d4a853]/22 bg-[#0c0a08] text-[#d4c6b0] hover:border-[#e6c27a]/55'
                            }`}
                          >
                            <div className="text-xs font-semibold flex items-center gap-1.5 text-[#f2d48f]"><Zap size={13} /> 2× Surge</div>
                            <div className="text-[11px] text-[#b9aa94] mt-0.5">Effective: {bid * 2}</div>
                          </button>

                          <button
                            type="button"
                            disabled={!me.hasInvert}
                            onClick={() => { sfx('paradox'); setProtocol('invert'); }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                              protocol === 'invert'
                                ? 'border-[#f06b7c] bg-gradient-to-b from-[#4d1321] to-[#290911] text-[#ffdce1] shadow-[0_0_16px_rgba(224,82,99,0.25),inset_0_1px_0_rgba(255,220,225,0.25)]'
                                : 'border-[#d44a5e]/25 bg-[#0c0a08] text-[#d4c6b0] hover:border-[#e05263]/55'
                            }`}
                          >
                            <div className="text-xs font-semibold flex items-center gap-1.5 text-[#f07687]"><RefreshCw size={13} /> Invert</div>
                            <div className="text-[11px] text-[#b9aa94] mt-0.5">Lowest wins!</div>
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
                        className="btn-brass w-full py-3 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50"
                      >
                        Seal Blind Bid ({bid} CR{protocol !== 'none' ? ` + ${protocol.toUpperCase()}` : ''})
                      </button>
                    </div>
                  )
                )}

                {game.state === 'reveal' && latestLog && (
                  <div className="space-y-3.5 my-auto">
                    <div className="text-center">
                      <span className="px-3 py-1 rounded-full border border-[#d4a853]/35 bg-[#1e170e] font-mono text-[11px] font-semibold text-[#e6c27a]">
                        Vault {latestLog.round} Showdown
                      </span>
                      <h2 className="font-display text-lg font-bold text-[#faf4e8] mt-2">
                        {latestLog.summary}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#e6c27a]/40 bg-[#0b0908] p-3.5 text-center shadow-[inset_0_1px_0_rgba(245,222,168,0.16)]">
                        <div className="text-[11px] font-medium text-[#b9aa94]">{game.players[0].nickname}</div>
                        <div className="font-serif italic text-3xl font-bold text-[#f2d48f] mt-0.5">{latestLog.p0Eff}</div>
                        <div className="text-[11px] font-mono text-[#8d806e] mt-0.5">
                          Bid {latestLog.p0Bid} CR {latestLog.p0Proto !== 'none' ? `· ${latestLog.p0Proto.toUpperCase()}` : ''}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#d4a853]/22 bg-[#0b0908] p-3.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <div className="text-[11px] font-medium text-[#b9aa94]">{game.players[1].nickname}</div>
                        <div className="font-serif italic text-3xl font-bold text-[#e7decb] mt-0.5">{latestLog.p1Eff}</div>
                        <div className="text-[11px] font-mono text-[#8d806e] mt-0.5">
                          Bid {latestLog.p1Bid} CR {latestLog.p1Proto !== 'none' ? `· ${latestLog.p1Proto.toUpperCase()}` : ''}
                        </div>
                      </div>
                    </div>

                    {isHost && onNextRound ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { sfx('deal'); onNextRound(); }}
                        className="btn-brass w-full py-3 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50"
                      >
                        {game.round >= 7 ? 'View Final Results' : `Open Vault ${game.round + 1}`}
                      </button>
                    ) : (
                      <p className="text-center text-xs font-mono text-[#9c8f7c]">
                        Waiting for host to open next vault...
                      </p>
                    )}
                  </div>
                )}

                {/* Compact Round History */}
                <div className="pt-2.5 border-t border-[#d4a853]/18">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a39683] mb-1.5">
                    Auction Ledger
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto text-[11px] font-mono">
                    {game.history.length === 0 ? (
                      <div className="text-[#6e6456]">No vaults resolved yet.</div>
                    ) : (
                      [...game.history].reverse().map((h) => (
                        <div key={h.round} className="flex items-center justify-between text-[#ded2be] bg-[#0b0908] border border-[#d4a853]/16 px-2.5 py-1.5 rounded-lg">
                          <span className="truncate">{h.summary}</span>
                          <span className="text-[#e6c27a] shrink-0 ml-2">{h.p0Eff} vs {h.p1Eff}</span>
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
          <div className="atelier-card w-full max-w-sm rounded-2xl border-[#d4a853]/40 bg-gradient-to-b from-[#1a140f] to-[#0f0c09] p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e6c27a]/45 bg-gradient-to-b from-[#2e2312] to-[#161009]">
              <Trophy className="w-6 h-6 text-[#e6c27a]" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#faf4e8]">
              {game.winnerUid === 'TIE' ? (
                <>
                  Auction <span className="font-serif italic font-normal text-[#e6c27a]">Tied</span>
                </>
              ) : game.winnerUid === me?.uid ? (
                <>
                  Vault <span className="font-serif italic font-normal text-[#e6c27a]">Master</span>
                </>
              ) : (
                <span className="font-serif italic font-normal text-[#f07687]">Outbid</span>
              )}
            </h2>
            <p className="text-xs font-mono text-[#b9aa94]">
              {game.players[0]?.nickname}: <span className="text-[#e6c27a]">{game.players[0]?.score} pts</span> · {game.players[1]?.nickname}: <span className="text-[#e6c27a]">{game.players[1]?.score} pts</span>
            </p>
            <div className="flex gap-2.5">
              {isHost && onPlayAgain && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPlayAgain}
                  className="btn-brass flex-1 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Play Again
                </button>
              )}
              <button
                type="button"
                onClick={onExit}
                className="btn-obsidian flex-1 py-2.5 rounded-xl text-[#e7decb] font-medium text-xs cursor-pointer"
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
