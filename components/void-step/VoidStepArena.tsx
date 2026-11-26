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
              Void Step
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 font-mono text-[11px] font-medium text-zinc-300">
              Round {game.round} · First to {game.winScore}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-zinc-200" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1340px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center">
        {/* WAITING */}
        {game.state === 'waiting' && (
          <div className="max-w-md w-full mx-auto bg-[#111113] border border-zinc-800/90 rounded-2xl p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950">
              <Hexagon className="w-6 h-6 text-indigo-400" />
            </div>
            {meIdx === -1 && onJoinRoom ? (
              <>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Enter Void Arena</h1>
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
                <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Waiting for Rival</h1>
                {game.gameId && (
                  <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-left">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Arena Code</div>
                      <div className="font-mono text-2xl font-semibold tracking-[0.22em] text-zinc-100">{game.gameId}</div>
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

        {/* ACTIVE TWO-COLUMN ARENA */}
        {game.state !== 'waiting' && me && opp && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* LEFT 7 COLS: 7x7 SHATTERING GRID */}
            <section className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="aspect-square w-full max-w-[440px] rounded-2xl border border-zinc-800/90 bg-[#111113] p-2.5">
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
                            ? 'bg-[#09090b] border-zinc-900/70 opacity-45 scale-90 cursor-default'
                            : isP0
                            ? 'bg-indigo-500 border-indigo-300 text-zinc-50'
                            : isP1
                            ? 'bg-rose-500 border-rose-300 text-zinc-50'
                            : isMoveTarget
                            ? blinkMode
                              ? 'bg-amber-500/20 border-amber-400 hover:bg-amber-500/30 cursor-pointer'
                              : 'bg-indigo-500/15 border-indigo-400/75 hover:bg-indigo-500/25 cursor-pointer'
                            : isShatterTarget
                            ? 'bg-[#18181b] border-zinc-700 hover:border-rose-400/80 hover:bg-rose-500/15 cursor-crosshair'
                            : 'bg-[#18181b] border-zinc-800 cursor-default'
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
                  const isP1Color = idx === 0;
                  return (
                    <div
                      key={p.sessionId}
                      className={`rounded-xl border p-3.5 transition-colors bg-[#111113] ${
                        active
                          ? isP1Color
                            ? 'border-indigo-400/75'
                            : 'border-rose-400/75'
                          : 'border-zinc-800/90'
                      }`}
                    >
                      <div className={`text-xs font-semibold truncate ${isP1Color ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {p.nickname} {idx === meIdx ? '(You)' : ''}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 font-mono text-xs">
                        <span className="text-zinc-400">Wins: <strong className="text-zinc-50">{p.score}</strong></span>
                        <span className="text-amber-400">⚡ {p.blinksLeft}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Phase Instruction Card */}
              <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-5 space-y-4">
                {game.state === 'playing' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-50 flex items-center gap-2">
                        {game.subPhase === 'move' ? (
                          <Footprints className="w-4 h-4 text-indigo-400" />
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
                          ? 'Click a highlighted tile to step (your old tile collapses). Or activate Blink to jump 2 tiles over the void.'
                          : 'Click any intact tile on the 7×7 grid to destroy it permanently and trap your opponent.'
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
                        className={`w-full py-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                          blinkMode
                            ? 'border-amber-400 bg-amber-400 text-zinc-950'
                            : 'border-amber-500/40 bg-zinc-900 hover:bg-zinc-800 text-amber-400'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        <span>
                          {blinkMode ? 'Blink Active (2-Tile Jump)' : `Use Blink Jump (${me.blinksLeft} left)`}
                        </span>
                      </button>
                    )}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-300 text-center">
                      {game.lastEvent}
                    </div>
                  </>
                ) : game.state === 'round_over' ? (
                  <div className="text-center space-y-3">
                    <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
                      {game.roundWinnerIdx === meIdx ? 'Rival Trapped' : 'You Fell Into the Void'}
                    </h2>
                    <p className="text-xs text-zinc-400">{game.lastEvent}</p>
                    {isHost && onNextRound ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { sfx('deal'); onNextRound(); }}
                        className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              {game.winnerUid === me?.uid ? 'Void Sovereign' : 'Consumed by Void'}
            </h2>
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
