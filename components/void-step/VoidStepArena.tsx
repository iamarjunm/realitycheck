'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Hexagon,
  Zap,
  Flame,
  Copy,
  Check,
  Trophy,
  RotateCcw,
  UserRound,
  Cpu,
  Footprints,
} from 'lucide-react';
import {
  VOID_GRID_SIZE,
  VoidStepState,
  cellIdx,
  getValidMoves,
} from '@/lib/void-step';
import { playSound } from '@/lib/sounds';

interface VoidStepArenaProps {
  game: VoidStepState;
  meIdx: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onJoinRoom?: (nickname: string) => void;
  onMove: (x: number, y: number, useBlink: boolean) => void;
  onShatter: (x: number, y: number) => void;
  onNextRound?: () => void;
  onPlayAgain?: () => void;
  busy?: boolean;
}

export function VoidStepArena({
  game,
  meIdx,
  soundEnabled,
  onToggleSound,
  onExit,
  onJoinRoom,
  onMove,
  onShatter,
  onNextRound,
  onPlayAgain,
  busy = false,
}: VoidStepArenaProps) {
  const [blinkMode, setBlinkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinName, setJoinName] = useState('');

  const sfx = (t: Parameters<typeof playSound>[0]) => {
    if (soundEnabled) playSound(t);
  };

  const me = meIdx !== -1 ? game.players[meIdx] : null;
  const opp = meIdx !== -1 && game.players.length === 2 ? game.players[meIdx === 0 ? 1 : 0] : null;
  const isHost = meIdx === 0 || game.mode === 'solo';
  const isMyTurn = game.state === 'playing' && meIdx !== -1 && game.turnIdx === meIdx;

  const voidSet = useMemo(() => new Set(game.voidCells), [game.voidCells]);

  const validMoveSet = useMemo(() => {
    if (!isMyTurn || game.subPhase !== 'move' || !me || !opp) return new Set<number>();
    const activeBlink = blinkMode && me.blinksLeft > 0;
    const moves = getValidMoves(me.pos, opp.pos, game.voidCells, activeBlink);
    return new Set(moves.map((m) => cellIdx(m.x, m.y)));
  }, [blinkMode, game.subPhase, game.voidCells, isMyTurn, me, opp]);

  const handleCellClick = (x: number, y: number) => {
    if (!isMyTurn || busy || !me || !opp) return;
    const idx = cellIdx(x, y);
    if (game.subPhase === 'move') {
      if (!validMoveSet.has(idx)) {
        sfx('error');
        return;
      }
      const useBlink = blinkMode && me.blinksLeft > 0;
      sfx(useBlink ? 'paradox' : 'move');
      setBlinkMode(false);
      onMove(x, y, useBlink);
    } else if (game.subPhase === 'shatter') {
      if (
        voidSet.has(idx) ||
        (x === me.pos.x && y === me.pos.y) ||
        (x === opp.pos.x && y === opp.pos.y)
      ) {
        sfx('error');
        return;
      }
      sfx('hit');
      onShatter(x, y);
    }
  };

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#04060b] text-white flex flex-col relative">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-violet-600/[0.1] rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-cyan-500/[0.08] rounded-full blur-[110px]" />
        <div className="absolute inset-0 bg-grid-white opacity-25" />
      </div>

      {/* 48px HUD */}
      <header className="relative z-20 w-full border-b border-violet-500/20 bg-black/75 backdrop-blur-xl shrink-0">
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
              Void Step
            </span>
            <span className="px-2 py-0.5 rounded-full border border-violet-400/30 bg-violet-500/10 font-mono text-[10px] font-bold text-violet-300">
              Round {game.round} · First to {game.winScore}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-violet-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1340px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center">
        {/* WAITING */}
        {game.state === 'waiting' && (
          <div className="max-w-md w-full mx-auto bg-black/75 border border-violet-500/25 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <Hexagon className="w-10 h-10 text-violet-400 mx-auto" />
            {meIdx === -1 && onJoinRoom ? (
              <>
                <h1 className="text-xl font-black uppercase">Enter Void Arena</h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="CODENAME"
                    maxLength={14}
                    className="flex-1 bg-zinc-950 border border-violet-500/30 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white"
                  />
                  <button
                    type="button"
                    disabled={busy || !joinName.trim()}
                    onClick={() => onJoinRoom(joinName.trim())}
                    className="px-5 py-2 rounded-xl bg-violet-500 text-white font-black uppercase text-xs disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-black uppercase">Waiting for Rival</h1>
                {game.gameId && (
                  <div className="flex items-center justify-between bg-zinc-950 border border-violet-500/25 rounded-xl px-4 py-3 text-left">
                    <div>
                      <div className="text-[9px] font-mono uppercase text-zinc-500">Arena Code</div>
                      <div className="font-mono text-2xl font-black tracking-[0.22em] text-violet-300">{game.gameId}</div>
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

        {/* ACTIVE TWO-COLUMN ARENA */}
        {game.state !== 'waiting' && me && opp && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* LEFT 7 COLS: 7x7 SHATTERING GRID */}
            <section className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="aspect-square w-full max-w-[440px] rounded-2xl border-2 border-violet-500/30 bg-black/80 p-2 shadow-[0_0_50px_rgba(139,92,246,0.14)]">
                <div className="grid grid-cols-7 grid-rows-7 gap-1.5 w-full h-full">
                  {Array.from({ length: VOID_GRID_SIZE * VOID_GRID_SIZE }).map((_, i) => {
                    const x = i % VOID_GRID_SIZE;
                    const y = Math.floor(i / VOID_GRID_SIZE);
                    const isVoid = voidSet.has(i);
                    const isP0 = game.players[0].pos.x === x && game.players[0].pos.y === y;
                    const isP1 = game.players[1].pos.x === x && game.players[1].pos.y === y;
                    const isMoveTarget = validMoveSet.has(i);
                    const isShatterTarget =
                      isMyTurn && game.subPhase === 'shatter' && !isVoid && !isP0 && !isP1;

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!isMoveTarget && !isShatterTarget}
                        onClick={() => handleCellClick(x, y)}
                        className={`relative rounded-lg border transition-all flex items-center justify-center ${
                          isVoid
                            ? 'bg-black/95 border-white/[0.03] opacity-25 scale-90 cursor-default'
                            : isP0
                            ? 'bg-cyan-500 border-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.6)] text-black'
                            : isP1
                            ? 'bg-rose-500 border-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.6)] text-black'
                            : isMoveTarget
                            ? blinkMode
                              ? 'bg-amber-400/25 border-amber-400 hover:bg-amber-400/40 cursor-pointer animate-pulse'
                              : 'bg-cyan-400/20 border-cyan-400/80 hover:bg-cyan-400/35 cursor-pointer'
                            : isShatterTarget
                            ? 'bg-zinc-900/90 border-white/15 hover:border-rose-400 hover:bg-rose-500/25 cursor-crosshair'
                            : 'bg-zinc-900/80 border-white/10 cursor-default'
                        }`}
                      >
                        {isP0 && (game.players[0].isBot ? <Cpu size={18} /> : <UserRound size={18} />)}
                        {isP1 && (game.players[1].isBot ? <Cpu size={18} /> : <UserRound size={18} />)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* RIGHT 5 COLS: STATUS + CONTROLS */}
            <aside className="lg:col-span-5 space-y-3.5 w-full max-w-md mx-auto">
              {/* Players */}
              <div className="grid grid-cols-2 gap-2.5">
                {game.players.map((p, idx) => {
                  const active = game.state === 'playing' && game.turnIdx === idx;
                  const isCyan = idx === 0;
                  return (
                    <div
                      key={p.sessionId}
                      className={`rounded-xl border p-3 transition-all ${
                        active
                          ? isCyan
                            ? 'border-cyan-400 bg-cyan-950/30'
                            : 'border-rose-400 bg-rose-950/30'
                          : 'border-white/10 bg-black/55'
                      }`}
                    >
                      <div className={`text-xs font-black uppercase truncate ${isCyan ? 'text-cyan-300' : 'text-rose-300'}`}>
                        {p.nickname} {idx === meIdx ? '(You)' : ''}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 font-mono text-xs">
                        <span className="text-zinc-400">Wins: <strong className="text-white">{p.score}</strong></span>
                        <span className="text-amber-300">⚡ {p.blinksLeft}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Phase Instruction Card */}
              <div className="rounded-2xl border border-violet-500/25 bg-black/65 p-5 space-y-4 shadow-2xl">
                {game.state === 'playing' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                        {game.subPhase === 'move' ? (
                          <Footprints className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Flame className="w-4 h-4 text-rose-400" />
                        )}
                        {isMyTurn
                          ? game.subPhase === 'move'
                            ? 'Step 1: Move Your Piece'
                            : 'Step 2: Shatter Any Tile'
                          : `${opp.nickname}'s Turn...`}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isMyTurn
                        ? game.subPhase === 'move'
                          ? 'Click a glowing tile to step (your old tile collapses!). Or activate Blink to jump 2 tiles over the void.'
                          : 'Click ANY intact tile on the 7×7 grid to destroy it permanently and trap your opponent.'
                        : 'Wait while your opponent moves and shatters a tile.'}
                    </p>

                    {isMyTurn && game.subPhase === 'move' && (
                      <button
                        type="button"
                        disabled={me.blinksLeft <= 0}
                        onClick={() => {
                          sfx('chip');
                          setBlinkMode((b) => !b);
                        }}
                        className={`w-full py-3 rounded-xl border-2 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-35 ${
                          blinkMode
                            ? 'border-amber-400 bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                            : 'border-amber-400/40 bg-amber-500/10 text-amber-300 hover:border-amber-300'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        <span>
                          {blinkMode ? 'Blink Active (2-Tile Jump)' : `Use Blink Jump (${me.blinksLeft} left)`}
                        </span>
                      </button>
                    )}

                    <div className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-300 text-center">
                      {game.lastEvent}
                    </div>
                  </>
                ) : game.state === 'round_over' ? (
                  <div className="text-center space-y-3">
                    <h2 className="text-xl font-black uppercase text-violet-300">
                      {game.roundWinnerIdx === meIdx ? 'Rival Trapped!' : 'You Fell Into The Void!'}
                    </h2>
                    <p className="text-xs text-zinc-400">{game.lastEvent}</p>
                    {isHost && onNextRound ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { sfx('deal'); onNextRound(); }}
                        className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-black uppercase tracking-widest text-xs"
                      >
                        Start Round {game.round + 1}
                      </button>
                    ) : (
                      <p className="text-xs font-mono text-zinc-500">Waiting for host...</p>
                    )}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        )}
      </main>

      {game.state === 'finished' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-violet-500/30 rounded-2xl p-6 text-center space-y-4">
            <Trophy className="w-10 h-10 text-amber-300 mx-auto" />
            <h2 className="text-2xl font-black uppercase">
              {game.winnerUid === me?.uid ? 'Void Sovereign!' : 'Consumed By Void'}
            </h2>
            <div className="flex gap-2">
              {isHost && onPlayAgain && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPlayAgain}
                  className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white font-black uppercase text-xs flex items-center justify-center gap-1"
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
