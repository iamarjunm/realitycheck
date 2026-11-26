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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0c0b0e] atelier-bg text-[#f5f0e6] flex flex-col relative">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(230,194,122,0.11), transparent 65%), radial-gradient(ellipse 40% 35% at 85% 85%, rgba(162,38,56,0.10), transparent 60%)',
        }}
      />

      {/* 48px Grandmaster HUD */}
      <header className="relative z-20 w-full border-b border-[#d4a853]/18 bg-[#0c0b0e]/85 backdrop-blur-md shrink-0">
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
              Void <span className="font-serif italic font-normal capitalize text-[#e6c27a]">Step</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-[#d4a853]/30 bg-[#17141b] font-mono text-[11px] font-medium text-[#e6c27a]">
              Round {game.round} · First to {game.winScore}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            className="btn-obsidian p-1.5 rounded-xl cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#e6c27a]" /> : <VolumeX className="w-3.5 h-3.5 text-[#786f62]" />}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1340px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center">
        {/* WAITING */}
        {game.state === 'waiting' && (
          <div className="atelier-card max-w-md w-full mx-auto rounded-2xl border-[#d4a853]/30 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4a853]/35 bg-gradient-to-b from-[#231e16] to-[#131117]">
              <Hexagon className="w-6 h-6 text-[#e6c27a]" />
            </div>
            {meIdx === -1 && onJoinRoom ? (
              <>
                <h1 className="font-display text-xl font-bold tracking-tight text-[#faf4e8]">
                  Enter <span className="font-serif italic font-normal text-[#e6c27a]">Void Arena</span>
                </h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="CODENAME"
                    maxLength={14}
                    className="flex-1 bg-[#0a090d] border border-[#d4a853]/22 focus:border-[#e6c27a]/75 focus:outline-none rounded-xl px-3 py-2 text-xs font-mono uppercase text-[#faf4e8] placeholder:text-[#5d564c]"
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
                  Waiting for <span className="font-serif italic font-normal text-[#e6c27a]">Rival</span>
                </h1>
                {game.gameId && (
                  <div className="flex items-center justify-between bg-[#0a090d] border border-[#d4a853]/28 rounded-xl px-4 py-3 text-left shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#9e9484]">Arena Code</div>
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

        {/* ACTIVE TWO-COLUMN GRANDMASTER ARENA */}
        {game.state !== 'waiting' && me && opp && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* LEFT 7 COLS: 7x7 SCULPTURAL MARBLE & OBSIDIAN BOARD */}
            <section className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="aspect-square w-full max-w-[460px] rounded-2xl border border-[#d4a853]/35 bg-gradient-to-b from-[#1e1b24] via-[#141219] to-[#0d0b10] p-3 shadow-[0_28px_70px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(230,194,122,0.24)]">
                <div className="grid grid-cols-7 grid-rows-7 gap-1.5 w-full h-full">
                  {Array.from({ length: VOID_GRID_SIZE * VOID_GRID_SIZE }).map((_, i) => {
                    const x = i % VOID_GRID_SIZE;
                    const y = Math.floor(i / VOID_GRID_SIZE);
                    const isLightStone = (x + y) % 2 === 0;
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
                        className={`relative rounded-lg border transition-all duration-150 flex items-center justify-center overflow-hidden ${
                          isVoid
                            ? 'bg-[#050407] border-[#261f24]/80 scale-[0.91] shadow-[inset_0_4px_12px_rgba(0,0,0,0.95)] cursor-default'
                            : isP0
                            ? 'bg-gradient-to-b from-[#f9efd8] via-[#e2c280] to-[#a9813a] border-[#fff7e3] text-[#171209] shadow-[0_6px_18px_rgba(230,194,122,0.42),inset_0_1px_0_rgba(255,255,255,0.85)]'
                            : isP1
                            ? 'bg-gradient-to-b from-[#e04f63] via-[#a31d33] to-[#630d1c] border-[#fda4af]/85 text-[#fff5f6] shadow-[0_6px_18px_rgba(225,29,72,0.4),inset_0_1px_0_rgba(255,220,225,0.5)]'
                            : isMoveTarget
                            ? blinkMode
                              ? 'bg-gradient-to-b from-[#3f2f13] to-[#21180a] border-[#f2d48f] hover:from-[#523d18] shadow-[inset_0_0_14px_rgba(230,194,122,0.4),0_0_14px_rgba(230,194,122,0.28)] cursor-pointer'
                              : 'bg-gradient-to-b from-[#332c24] to-[#1e1a18] border-[#e6c27a]/80 hover:border-[#f8e3b0] shadow-[inset_0_1px_0_rgba(245,222,168,0.28),0_0_12px_rgba(230,194,122,0.18)] cursor-pointer'
                            : isShatterTarget
                            ? isLightStone
                              ? 'bg-gradient-to-b from-[#2f2b36] to-[#1e1b23] border-[#d4a853]/25 hover:border-[#f06b7c]/85 hover:from-[#471622] hover:to-[#280b13] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-3px_0_rgba(0,0,0,0.65)] cursor-crosshair'
                              : 'bg-gradient-to-b from-[#25222b] to-[#17151b] border-[#d4a853]/18 hover:border-[#f06b7c]/85 hover:from-[#471622] hover:to-[#280b13] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-3px_0_rgba(0,0,0,0.65)] cursor-crosshair'
                            : isLightStone
                            ? 'bg-gradient-to-b from-[#2e2a35] to-[#1d1a22] border-[#d4a853]/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-3px_0_rgba(0,0,0,0.65),0_4px_8px_rgba(0,0,0,0.4)] cursor-default'
                            : 'bg-gradient-to-b from-[#232029] to-[#16141a] border-[#d4a853]/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-3px_0_rgba(0,0,0,0.65),0_4px_8px_rgba(0,0,0,0.4)] cursor-default'
                        }`}
                      >
                        {/* Cracked Void Fracture Overlay */}
                        {isVoid && (
                          <svg
                            viewBox="0 0 40 40"
                            className="pointer-events-none absolute inset-0 w-full h-full opacity-45"
                            aria-hidden="true"
                          >
                            <path
                              d="M6 10 L17 19 L13 31 M29 7 L21 20 L34 29"
                              stroke="#5c463d"
                              strokeWidth="1.2"
                              fill="none"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}

                        {/* Blink Jump Gold Arc Indicator */}
                        {isMoveTarget && blinkMode && (
                          <span className="pointer-events-none flex items-center justify-center">
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#f2d48f] bg-[#e6c27a]/30 animate-pulse" />
                          </span>
                        )}

                        {/* Standard Step Gold Dot Indicator */}
                        {isMoveTarget && !blinkMode && (
                          <span className="pointer-events-none w-2 h-2 rounded-full bg-[#e6c27a]/85 shadow-[0_0_8px_rgba(230,194,122,0.8)]" />
                        )}

                        {/* Grandmaster Pieces */}
                        {isP0 && (
                          <motion.span
                            layoutId="void-p0-piece"
                            className="flex items-center justify-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                          >
                            {game.players[0].isBot ? <Cpu size={19} /> : <UserRound size={19} />}
                          </motion.span>
                        )}
                        {isP1 && (
                          <motion.span
                            layoutId="void-p1-piece"
                            className="flex items-center justify-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                          >
                            {game.players[1].isBot ? <Cpu size={19} /> : <UserRound size={19} />}
                          </motion.span>
                        )}
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
                      className={`atelier-card rounded-xl p-3.5 transition-all ${
                        active
                          ? isP1Color
                            ? 'border-[#e6c27a]/80 shadow-[0_0_20px_rgba(230,194,122,0.16)]'
                            : 'border-[#e05263]/80 shadow-[0_0_20px_rgba(224,82,99,0.16)]'
                          : 'border-[#d4a853]/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
                            isP1Color
                              ? 'bg-[#e6c27a] border-[#fff5db]'
                              : 'bg-[#d4445a] border-[#fda4af]'
                          }`}
                        />
                        <div className={`text-xs font-semibold truncate ${isP1Color ? 'text-[#f2d48f]' : 'text-[#f58a9b]'}`}>
                          {p.nickname} {idx === meIdx ? '(You)' : ''}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 font-mono text-xs">
                        <span className="text-[#9e9484]">
                          Wins: <strong className="text-[#faf4e8]">{p.score}</strong>
                        </span>
                        <span className="text-[#e6c27a] font-semibold">⚡ {p.blinksLeft}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Phase Instruction Card */}
              <div className="atelier-card rounded-2xl border-[#d4a853]/25 p-5 space-y-4">
                {game.state === 'playing' ? (
                  <>
                    <div className="flex items-center justify-between border-b border-[#d4a853]/15 pb-3">
                      <span className="font-display text-sm font-bold text-[#faf4e8] flex items-center gap-2">
                        {game.subPhase === 'move' ? (
                          <Footprints className="w-4 h-4 text-[#e6c27a]" />
                        ) : (
                          <Flame className="w-4 h-4 text-[#f06b7c]" />
                        )}
                        {isMyTurn
                          ? game.subPhase === 'move'
                            ? 'Step 1: Move Your Piece'
                            : 'Step 2: Shatter Any Tile'
                          : `${opp.nickname}'s Turn...`}
                      </span>
                    </div>

                    <p className="text-xs text-[#b9b09f] leading-relaxed">
                      {isMyTurn
                        ? game.subPhase === 'move'
                          ? 'Click a gilded stone to step (your origin collapses into the abyss). Or arm Blink to vault 2 tiles over the void.'
                          : 'Click any intact marble or obsidian tile on the 7×7 grid to shatter it permanently and trap your rival.'
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
                        className={`w-full py-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                          blinkMode
                            ? 'border-[#faebbf] bg-gradient-to-b from-[#f2d48f] to-[#b98a36] text-[#141008] shadow-[0_0_20px_rgba(230,194,122,0.4),inset_0_1px_0_rgba(255,255,255,0.65)]'
                            : 'border-[#d4a853]/45 bg-gradient-to-b from-[#231d14] to-[#14110c] hover:border-[#e6c27a]/80 text-[#e6c27a]'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        <span>
                          {blinkMode ? 'Blink Active (2-Tile Arc Jump)' : `Use Blink Jump (${me.blinksLeft} left)`}
                        </span>
                      </button>
                    )}

                    <div className="rounded-xl border border-[#d4a853]/18 bg-[#0a090d] px-3 py-2 font-mono text-[11px] text-[#cfc6b6] text-center shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]">
                      {game.lastEvent}
                    </div>
                  </>
                ) : game.state === 'round_over' ? (
                  <div className="text-center space-y-3">
                    <h2 className="font-display text-xl font-bold tracking-tight text-[#faf4e8]">
                      {game.roundWinnerIdx === meIdx ? (
                        <>
                          Rival <span className="font-serif italic font-normal text-[#e6c27a]">Trapped</span>
                        </>
                      ) : (
                        <>
                          Consumed by <span className="font-serif italic font-normal text-[#f07687]">the Void</span>
                        </>
                      )}
                    </h2>
                    <p className="text-xs text-[#b9b09f]">{game.lastEvent}</p>
                    {isHost && onNextRound ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { sfx('deal'); onNextRound(); }}
                        className="btn-brass w-full py-3 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50"
                      >
                        Start Round {game.round + 1}
                      </button>
                    ) : (
                      <p className="text-xs font-mono text-[#948a7a]">Waiting for host...</p>
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
          <div className="atelier-card w-full max-w-sm rounded-2xl border-[#d4a853]/38 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e6c27a]/45 bg-gradient-to-b from-[#2b2213] to-[#14100a]">
              <Trophy className="w-6 h-6 text-[#e6c27a]" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#faf4e8]">
              {game.winnerUid === me?.uid ? (
                <>
                  Void <span className="font-serif italic font-normal text-[#e6c27a]">Sovereign</span>
                </>
              ) : (
                <>
                  Consumed by <span className="font-serif italic font-normal text-[#f07687]">Void</span>
                </>
              )}
            </h2>
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
