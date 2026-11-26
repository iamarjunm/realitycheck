'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  Cpu,
  Crown,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  GRID_SIZE,
  INITIAL_HAND,
  LINE_CONTROL_BONUS,
  PlayerIndex,
  QuantumMatrixGame,
  TOTAL_CELLS,
  computeScores,
  coordLabel,
  previewPlacement,
} from '@/lib/quantum-matrix';
import { playSound } from '@/lib/sounds';

export interface QuantumMatrixArenaProps {
  game: QuantumMatrixGame;
  meIdx: number; // 0, 1, or -1 (spectator / not yet joined)
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onPlaceCore: (cellIdx: number, value: number, useInvert: boolean) => void;
  onJoinRoom?: (nickname: string) => void;
  onRematch?: () => void;
  busy?: boolean;
  defaultNickname?: string;
}

export function QuantumMatrixArena({
  game,
  meIdx,
  soundEnabled,
  onToggleSound,
  onExit,
  onPlaceCore,
  onJoinRoom,
  onRematch,
  busy = false,
  defaultNickname = '',
}: QuantumMatrixArenaProps) {
  const [selectedCore, setSelectedCore] = useState<number | null>(null);
  const [invertArmed, setInvertArmed] = useState(false);
  const [hoverCell, setHoverCell] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [joinName, setJoinName] = useState(defaultNickname);
  const celebratedTurnRef = useRef<number>(-1);
  const prevTurnCountRef = useRef<number>(game.turnCount);

  const isMyTurn =
    game.state === 'playing' && meIdx !== -1 && game.turnIdx === meIdx && !busy;
  const mePlayer = meIdx === 0 || meIdx === 1 ? game.players[meIdx] : null;
  const ampSet = useMemo(() => new Set(game.ampCells), [game.ampCells]);
  const scores = useMemo(
    () => computeScores(game.board, game.ampCells),
    [game.board, game.ampCells]
  );

  // Sync default joinName if it arrives from localStorage
  useEffect(() => {
    if (defaultNickname && !joinName) {
      setJoinName(defaultNickname);
    }
  }, [defaultNickname, joinName]);

  // Clear selection / invert if selected core is no longer in hand or turn changes
  useEffect(() => {
    if (!mePlayer) {
      setSelectedCore(null);
      setInvertArmed(false);
      return;
    }
    if (selectedCore !== null && !mePlayer.hand.includes(selectedCore)) {
      setSelectedCore(null);
    }
    if (mePlayer.invertLeft <= 0 && invertArmed) {
      setInvertArmed(false);
    }
  }, [mePlayer, selectedCore, invertArmed]);

  // Reset invert toggle after a turn completes
  useEffect(() => {
    if (game.turnCount !== prevTurnCountRef.current) {
      prevTurnCountRef.current = game.turnCount;
      setInvertArmed(false);
      setHoverCell(null);
    }
  }, [game.turnCount]);

  // Confetti & victory audio once per finished game
  useEffect(() => {
    if (game.state !== 'finished') {
      celebratedTurnRef.current = -1;
      return;
    }
    if (celebratedTurnRef.current === game.turnCount) return;
    celebratedTurnRef.current = game.turnCount;

    const iWon = meIdx !== -1 && game.winnerIdx === meIdx;
    const isTie = game.winnerIdx === 'tie';
    if (iWon) {
      if (soundEnabled) playSound('win');
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.58 },
        colors: ['#818cf8', '#fb7185', '#fbbf24', '#f4f4f5'],
      });
    } else if (isTie) {
      if (soundEnabled) playSound('rule_check');
    } else if (meIdx !== -1) {
      if (soundEnabled) playSound('fold');
    }
  }, [game.state, game.turnCount, game.winnerIdx, meIdx, soundEnabled]);

  // Keyboard shortcuts: 1-8 to select core, I to toggle Polarity Invert, Esc to clear
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isMyTurn || !mePlayer) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key >= '1' && e.key <= '8') {
        const val = Number(e.key);
        if (mePlayer.hand.includes(val)) {
          setSelectedCore(val);
          if (soundEnabled) playSound('card_pick');
        }
      } else if (e.key.toLowerCase() === 'i' && mePlayer.invertLeft > 0) {
        setInvertArmed((prev) => {
          const next = !prev;
          if (soundEnabled) playSound(next ? 'paradox' : 'tick');
          return next;
        });
      } else if (e.key === 'Escape') {
        setSelectedCore(null);
        setInvertArmed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMyTurn, mePlayer, soundEnabled]);

  // Live hover capture preview
  const hoverPreview = useMemo(() => {
    if (
      !isMyTurn ||
      selectedCore === null ||
      hoverCell === null ||
      (meIdx !== 0 && meIdx !== 1)
    ) {
      return null;
    }
    const prev = previewPlacement(
      game.board,
      hoverCell,
      selectedCore,
      meIdx as PlayerIndex,
      invertArmed,
      game.ampCells
    );
    return prev.valid ? prev : null;
  }, [isMyTurn, selectedCore, hoverCell, meIdx, game.board, invertArmed, game.ampCells]);

  const previewFlipMap = useMemo(() => {
    const map = new Map<number, 'outflank' | 'hijack'>();
    if (hoverPreview) {
      for (const f of hoverPreview.flips) {
        map.set(f.cellIdx, f.type);
      }
    }
    return map;
  }, [hoverPreview]);

  const lastFlippedSet = useMemo(() => {
    const set = new Set<number>();
    if (game.lastMove) {
      for (const idx of game.lastMove.outflanked) set.add(idx);
      for (const idx of game.lastMove.hijacked) set.add(idx);
    }
    return set;
  }, [game.lastMove]);

  const lastHijackSet = useMemo(() => {
    const set = new Set<number>();
    if (game.lastMove) {
      for (const idx of game.lastMove.hijacked) set.add(idx);
    }
    return set;
  }, [game.lastMove]);

  const handleCopyCode = async () => {
    if (!game.gameId) return;
    try {
      await navigator.clipboard.writeText(game.gameId);
      setCopiedCode(true);
      if (soundEnabled) playSound('chip');
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleCellClick = (idx: number) => {
    if (!isMyTurn || game.board[idx] !== null) return;
    if (selectedCore === null) {
      if (soundEnabled) playSound('error');
      return;
    }
    const preview = previewPlacement(
      game.board,
      idx,
      selectedCore,
      meIdx as PlayerIndex,
      invertArmed,
      game.ampCells
    );
    if (!preview.valid) return;

    if (soundEnabled) {
      if (preview.hijacked.length > 0 || invertArmed) {
        playSound('paradox');
      } else if (preview.outflanked.length > 0) {
        playSound('flip');
      } else {
        playSound('deal');
      }
    }

    onPlaceCore(idx, selectedCore, invertArmed);
    setSelectedCore(null);
    setInvertArmed(false);
    setHoverCell(null);
  };

  const p0 = game.players[0];
  const p1 = game.players[1];
  const totalScoreSum = scores.p0.total + scores.p1.total;
  const p0BarPct = totalScoreSum === 0 ? 50 : Math.round((scores.p0.total / totalScoreSum) * 100);

  // WAITING ROOM / JOIN SCREEN (Multiplayer before P2 enters)
  if (game.state === 'waiting') {
    const canJoin = meIdx === -1 && game.players.length < 2 && Boolean(onJoinRoom);
    return (
      <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative">
        <header className="shrink-0 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md px-5 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Lobby
          </button>
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-300">
            Quantum Matrix · 1v1 Link
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-zinc-800/90 bg-[#111113] p-6 space-y-5"
          >
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950">
                <Cpu className="text-indigo-400" size={22} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
                {canJoin ? 'Join Quantum Matrix' : 'Awaiting Challenger'}
              </h1>
            </div>

            {game.gameId && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                  Room Code
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-semibold tracking-[0.28em] text-zinc-100 pl-2">
                    {game.gameId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedCode ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  Host: <span className="text-indigo-400 font-medium">{p0?.nickname || 'Host'}</span> · 2× Amp
                  Cells Locked ({game.ampCells.map(coordLabel).join(' & ')})
                </p>
              </div>
            )}

            {canJoin ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onJoinRoom) onJoinRoom(joinName.trim() || 'Challenger');
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                    Your Callsign
                  </label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Enter callsign..."
                    maxLength={14}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-zinc-50 hover:bg-white py-3 text-sm font-semibold text-zinc-950 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Syncing Matrix...' : 'Lock In & Start Duel'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                  Share code with a rival or open in a second tab to test locally
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative select-none">
      {/* Top HUD Bar */}
      <header className="relative z-20 flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} /> Exit
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-[#111113]">
              <Cpu size={14} className="text-indigo-400" />
            </div>
            <div className="leading-tight truncate">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-50">
                Quantum Matrix
              </h1>
              <p className="text-[10px] font-mono text-zinc-500 hidden sm:block">
                4×4 Math-Tactical Grid
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {game.gameId && (
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copy Room Code"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1.5 text-xs font-mono font-medium tracking-widest text-zinc-200 transition-colors cursor-pointer"
            >
              <span>{game.gameId}</span>
              {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-mono text-zinc-300">
            Turn <span className="font-semibold text-amber-400">{Math.min(game.turnCount + (game.state === 'playing' ? 1 : 0), TOTAL_CELLS)}</span>
            <span className="text-zinc-500">/{TOTAL_CELLS}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowRules((s) => !s)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 transition-colors cursor-pointer"
            title="Tactical Rules"
          >
            <HelpCircle size={15} />
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </header>

      {/* Main 3-Column Single-Screen Arena */}
      <main className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[270px_1fr_285px] gap-3 p-3 max-w-[1440px] w-full mx-auto">
        {/* LEFT COLUMN: Players & Rules Quick-Ref */}
        <section className="flex flex-col gap-2.5 min-h-0 order-2 lg:order-1">
          {[p0, p1].map((player, idx) => {
            if (!player) return null;
            const pIdx = idx as PlayerIndex;
            const detail = pIdx === 0 ? scores.p0 : scores.p1;
            const isActiveTurn = game.state === 'playing' && game.turnIdx === pIdx;
            const isMe = meIdx === pIdx;
            const accentRing =
              pIdx === 0
                ? isActiveTurn
                  ? 'border-indigo-400/80'
                  : 'border-zinc-800/90'
                : isActiveTurn
                  ? 'border-rose-400/80'
                  : 'border-zinc-800/90';
            const badgeBg =
              pIdx === 0
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/35';

            return (
              <div
                key={player.sessionId || pIdx}
                className={`rounded-2xl border bg-[#111113] p-3.5 transition-colors ${accentRing}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${badgeBg}`}
                    >
                      {player.isBot ? <Bot size={14} /> : `P${pIdx + 1}`}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {player.nickname}
                        </span>
                        {isMe && (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                        {isActiveTurn ? (
                          <span className={pIdx === 0 ? 'text-indigo-400 font-semibold' : 'text-rose-400 font-semibold'}>
                            ● Active Turn
                          </span>
                        ) : (
                          <span>{detail.cellCount} cells</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.div
                      key={detail.total}
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      className={`text-2xl font-semibold font-mono leading-none ${
                        pIdx === 0 ? 'text-indigo-400' : 'text-rose-400'
                      }`}
                    >
                      {detail.total}
                    </motion.div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                      PTS
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Strip */}
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-zinc-950 border border-zinc-800/80 p-1.5 text-center mb-2.5">
                  <div>
                    <div className="text-[11px] font-mono font-semibold text-zinc-100">
                      {detail.basePoints}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500">Cores</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-semibold text-amber-400">
                      +{detail.ampBonus}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500">2× Amp</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-semibold text-zinc-200">
                      +{detail.lineBonus}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500">
                      {detail.linesWon} Lines
                    </div>
                  </div>
                </div>

                {/* Invert Status + Remaining Cores Intel */}
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 border ${
                      player.invertLeft > 0
                        ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                        : 'border-zinc-800/80 bg-zinc-950 text-zinc-600 line-through'
                    }`}
                  >
                    <RefreshCw size={10} />
                    Invert {player.invertLeft > 0 ? 'Ready' : 'Used'}
                  </span>

                  <div className="flex items-center gap-0.5">
                    {INITIAL_HAND.map((v) => {
                      const has = player.hand.includes(v);
                      return (
                        <span
                          key={v}
                          className={`w-4 h-4 rounded text-[9px] font-semibold flex items-center justify-center ${
                            has
                              ? pIdx === 0
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/35'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
                              : 'bg-zinc-950 text-zinc-700'
                          }`}
                        >
                          {v}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Compact Combat Rules Reference */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-3.5 space-y-2 text-[11px] leading-snug text-zinc-400 mt-auto">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-300">
              <Sparkles size={12} className="text-amber-400" /> Capture Protocol
            </div>
            <div className="space-y-1.5 text-[11px]">
              <p>
                <span className="text-indigo-400 font-medium">Outflank:</span> Flip adjacent enemy cores
                with value <span className="font-mono text-zinc-100">&lt; V</span>.
              </p>
              <p>
                <span className="text-amber-400 font-medium">Exact-10 Hijack:</span> If{' '}
                <span className="font-mono text-amber-300">V + Enemy = 10</span>, steal it anyway &amp;
                boost your core <span className="font-mono text-amber-300">+1</span> (max 9).
              </p>
              <p>
                <span className="text-zinc-200 font-medium">Polarity Invert (1×):</span> Flip
                enemies <span className="font-mono text-zinc-100">&gt; V</span> for 1 move.
              </p>
              <p>
                <span className="text-zinc-200 font-medium">Line Control:</span> Strict lead in any
                row or column grants <span className="font-mono text-zinc-100">+{LINE_CONTROL_BONUS}</span>.
              </p>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: Turn Status + 4x4 Grid with Row/Col Pills + Hand Dock */}
        <section className="flex flex-col items-center justify-between gap-2.5 min-h-0 order-1 lg:order-2">
          {/* Dynamic Status / Hover Telemetry Strip */}
          <div className="w-full max-w-[540px] rounded-xl border border-zinc-800/90 bg-[#111113] px-3.5 py-2 flex items-center justify-between gap-3">
            {hoverPreview ? (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-200">
                    {coordLabel(hoverPreview.cellIdx)}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                    {hoverPreview.hijacked.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-400/50 px-1.5 py-0.5 text-amber-400">
                        <Zap size={11} /> =10 Hijack ×{hoverPreview.hijacked.length}
                        {hoverPreview.overloaded ? ' (+1)' : ''}
                      </span>
                    )}
                    {hoverPreview.outflanked.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 border border-indigo-400/50 px-1.5 py-0.5 text-indigo-300">
                        Flip ×{hoverPreview.outflanked.length}
                      </span>
                    )}
                    {hoverPreview.flips.length === 0 && (
                      <span className="text-zinc-400 font-normal">
                        Deploy Core {hoverPreview.playedValue}
                        {hoverPreview.isAmpCell ? ' on 2× Amp' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono text-xs font-semibold px-2 py-0.5 rounded-lg border ${
                    hoverPreview.netSwing >= 10
                      ? 'bg-amber-500/15 text-amber-400 border-amber-400/40'
                      : 'bg-zinc-900 text-zinc-200 border-zinc-700'
                  }`}
                >
                  Swing {hoverPreview.netSwing >= 0 ? `+${hoverPreview.netSwing}` : hoverPreview.netSwing}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Swords
                    size={15}
                    className={
                      game.turnIdx === 0 ? 'text-indigo-400 shrink-0' : 'text-rose-400 shrink-0'
                    }
                  />
                  <span className="text-xs font-medium text-zinc-200 truncate">
                    {game.state === 'finished'
                      ? game.winnerIdx === 'tie'
                        ? 'Matrix Equilibrium — Match Tied'
                        : `${game.players[game.winnerIdx as PlayerIndex]?.nickname} wins the matrix`
                      : isMyTurn
                        ? selectedCore === null
                          ? 'Your turn — select a Power Core (1–8) below'
                          : invertArmed
                            ? `Invert Armed · Place Core ${selectedCore} (flips enemies > ${selectedCore})`
                            : `Core ${selectedCore} armed · hover grid to preview captures`
                        : game.players[game.turnIdx]?.isBot
                          ? 'MINIMAX-AI calculating optimal matrix play...'
                          : `Waiting for ${game.players[game.turnIdx]?.nickname}...`}
                  </span>
                </div>
                {isMyTurn && (
                  <span className="shrink-0 rounded-full bg-zinc-900 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-mono font-medium text-zinc-200">
                    Your Move
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 4×4 Grid + Live Row/Col Control Pills (5×5 Layout) */}
          <div className="w-full max-w-[495px] flex-1 min-h-0 flex items-center justify-center">
            <div className="w-full grid grid-cols-[repeat(4,minmax(0,1fr))_58px] gap-1.5 sm:gap-2 items-stretch">
              {Array.from({ length: GRID_SIZE }, (_, rowIdx) => {
                const rowScore = scores.rows[rowIdx];
                return (
                  <React.Fragment key={`row-${rowIdx}`}>
                    {Array.from({ length: GRID_SIZE }, (_, colIdx) => {
                      const idx = rowIdx * GRID_SIZE + colIdx;
                      const cell = game.board[idx];
                      const isAmp = ampSet.has(idx);
                      const isHovered = hoverCell === idx && hoverPreview !== null;
                      const flipPreviewType = previewFlipMap.get(idx) ?? null;
                      const wasLastPlaced = game.lastMove?.cellIdx === idx;
                      const wasLastFlipped = lastFlippedSet.has(idx);
                      const wasLastHijacked = lastHijackSet.has(idx);

                      const emptyClickable = isMyTurn && cell === null && selectedCore !== null;

                      let cellBorder = 'border-zinc-800/90 bg-[#111113]';
                      if (cell) {
                        cellBorder =
                          cell.owner === 0
                            ? 'border-indigo-500/50 bg-indigo-950/35'
                            : 'border-rose-500/50 bg-rose-950/30';
                      } else if (isAmp) {
                        cellBorder = 'border-amber-500/45 bg-[#111113]';
                      }

                      if (flipPreviewType === 'hijack') {
                        cellBorder =
                          'border-amber-400 ring-2 ring-amber-400/75 bg-amber-950/40';
                      } else if (flipPreviewType === 'outflank') {
                        cellBorder =
                          meIdx === 1
                            ? 'border-rose-400 ring-2 ring-rose-400/75 bg-rose-950/40'
                            : 'border-indigo-400 ring-2 ring-indigo-400/75 bg-indigo-950/45';
                      } else if (isHovered) {
                        cellBorder = invertArmed
                          ? 'border-amber-400 ring-2 ring-amber-400/60 bg-zinc-900'
                          : meIdx === 1
                            ? 'border-rose-400 ring-2 ring-rose-400/60 bg-rose-950/25'
                            : 'border-indigo-400 ring-2 ring-indigo-400/60 bg-indigo-950/25';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={cell !== null || !isMyTurn}
                          onMouseEnter={() => {
                            if (cell === null && isMyTurn) setHoverCell(idx);
                          }}
                          onMouseLeave={() => {
                            if (hoverCell === idx) setHoverCell(null);
                          }}
                          onClick={() => handleCellClick(idx)}
                          className={`group relative aspect-square rounded-2xl border transition-all duration-150 flex flex-col items-center justify-center overflow-hidden ${cellBorder} ${
                            emptyClickable
                              ? 'cursor-pointer hover:border-zinc-600'
                              : cell === null && isMyTurn
                                ? 'cursor-pointer hover:border-zinc-700'
                                : 'cursor-default'
                          }`}
                        >
                          {/* Coordinate Label */}
                          <span className="absolute top-1.5 left-2 text-[9px] font-mono font-medium text-zinc-600">
                            {coordLabel(idx)}
                          </span>

                          {/* 2x Amplifier Badge */}
                          {isAmp && (
                            <span className="absolute top-1.5 right-1.5 rounded-md bg-amber-500/15 border border-amber-400/40 px-1 py-0.5 text-[8px] font-mono font-semibold tracking-tight text-amber-400">
                              2×
                            </span>
                          )}

                          {/* Occupied Cell Core */}
                          {cell ? (
                            <motion.div
                              key={`${idx}-${cell.owner}-${cell.value}`}
                              initial={{ scale: 0.65, rotateY: 90, opacity: 0.3 }}
                              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                              className="flex flex-col items-center justify-center"
                            >
                              <span
                                className={`text-3xl sm:text-4xl font-bold font-mono leading-none tracking-tighter ${
                                  cell.owner === 0 ? 'text-indigo-300' : 'text-rose-300'
                                }`}
                              >
                                {cell.value}
                              </span>
                              <div className="mt-1 flex items-center gap-1">
                                {cell.overloaded && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 border border-amber-400/40 px-1 py-0.5 text-[8px] font-mono font-semibold text-amber-300 leading-none">
                                    <Zap size={8} /> +1
                                  </span>
                                )}
                                {isAmp && (
                                  <span className="rounded bg-zinc-950/80 border border-zinc-800 px-1 text-[8px] font-mono font-medium text-amber-400">
                                    ={cell.value * 2}
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          ) : isHovered && hoverPreview ? (
                            /* Ghost Preview on Hovered Empty Cell */
                            <div className="flex flex-col items-center justify-center">
                              <span
                                className={`text-3xl sm:text-4xl font-bold font-mono leading-none ${
                                  hoverPreview.overloaded
                                    ? 'text-amber-400'
                                    : invertArmed
                                      ? 'text-amber-300'
                                      : meIdx === 1
                                        ? 'text-rose-300'
                                        : 'text-indigo-300'
                                }`}
                              >
                                {hoverPreview.finalValue}
                              </span>
                              <span
                                className={`mt-1 rounded px-1.5 py-0.5 text-[8px] font-mono font-semibold ${
                                  hoverPreview.overloaded
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                                }`}
                              >
                                {hoverPreview.netSwing >= 0
                                  ? `+${hoverPreview.netSwing} SWING`
                                  : `${hoverPreview.netSwing}`}
                              </span>
                            </div>
                          ) : isAmp ? (
                            <div className="flex flex-col items-center text-amber-400/75">
                              <Sparkles size={15} />
                              <span className="text-[9px] font-mono font-semibold uppercase tracking-wider mt-0.5">
                                2× AMP
                              </span>
                            </div>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-800 group-hover:bg-zinc-500 transition-colors" />
                          )}

                          {/* Hover Preview Overlay Badge on Adjacent Enemy Cells */}
                          {flipPreviewType === 'hijack' && (
                            <motion.div
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute bottom-1 inset-x-1 rounded-md bg-amber-400 text-zinc-950 px-1 py-0.5 text-[8px] font-mono font-bold tracking-tight flex items-center justify-center gap-0.5"
                            >
                              <Zap size={9} /> =10 HIJACK
                            </motion.div>
                          )}
                          {flipPreviewType === 'outflank' && (
                            <motion.div
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={`absolute bottom-1 inset-x-1 rounded-md px-1 py-0.5 text-[8px] font-mono font-bold tracking-tight text-center ${
                                meIdx === 1 ? 'bg-rose-400 text-zinc-950' : 'bg-indigo-400 text-zinc-950'
                              }`}
                            >
                              FLIP
                            </motion.div>
                          )}

                          {/* Subtle Last-Move Indicator */}
                          {!flipPreviewType && (wasLastPlaced || wasLastFlipped) && (
                            <span
                              className={`absolute bottom-1 right-1.5 text-[8px] font-mono font-semibold uppercase ${
                                wasLastHijacked
                                  ? 'text-amber-400'
                                  : wasLastPlaced
                                    ? 'text-zinc-300'
                                    : 'text-indigo-300'
                              }`}
                            >
                              {wasLastPlaced ? 'NEW' : wasLastHijacked ? 'HIJACK' : 'FLIP'}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Live Row Control Pill */}
                    <div
                      className={`rounded-xl border px-1 py-1 flex flex-col items-center justify-center text-center font-mono transition-colors ${
                        rowScore.leader === 0
                          ? 'border-indigo-500/45 bg-indigo-950/30 text-indigo-300'
                          : rowScore.leader === 1
                            ? 'border-rose-500/45 bg-rose-950/30 text-rose-300'
                            : 'border-zinc-800/80 bg-[#111113] text-zinc-500'
                      }`}
                    >
                      <span className="text-[8px] uppercase text-zinc-500">R{rowIdx + 1}</span>
                      <div className="text-[11px] font-semibold leading-tight">
                        <span className="text-indigo-400">{rowScore.p0}</span>
                        <span className="text-zinc-600 mx-0.5">:</span>
                        <span className="text-rose-400">{rowScore.p1}</span>
                      </div>
                      <span
                        className={`text-[8px] font-semibold ${
                          rowScore.leader === 0
                            ? 'text-indigo-400'
                            : rowScore.leader === 1
                              ? 'text-rose-400'
                              : 'text-zinc-600'
                        }`}
                      >
                        {rowScore.leader === null ? 'TIE' : `+${LINE_CONTROL_BONUS}`}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Bottom Row: 4 Live Column Control Pills + Corner Legend */}
              {scores.cols.map((colScore, colIdx) => (
                <div
                  key={`col-${colIdx}`}
                  className={`rounded-xl border px-1.5 py-1 flex items-center justify-between font-mono text-[10px] transition-colors ${
                    colScore.leader === 0
                      ? 'border-indigo-500/45 bg-indigo-950/30 text-indigo-300'
                      : colScore.leader === 1
                        ? 'border-rose-500/45 bg-rose-950/30 text-rose-300'
                        : 'border-zinc-800/80 bg-[#111113] text-zinc-500'
                  }`}
                >
                  <span className="text-[9px] font-medium text-zinc-500">
                    {['A', 'B', 'C', 'D'][colIdx]}
                  </span>
                  <span className="font-semibold">
                    <span className="text-indigo-400">{colScore.p0}</span>
                    <span className="text-zinc-600 mx-0.5">:</span>
                    <span className="text-rose-400">{colScore.p1}</span>
                  </span>
                  <span className="text-[8px] font-semibold">
                    {colScore.leader === null ? '—' : `+${LINE_CONTROL_BONUS}`}
                  </span>
                </div>
              ))}

              <div className="rounded-xl border border-zinc-800/90 bg-[#111113] flex flex-col items-center justify-center text-[8px] font-mono font-semibold uppercase text-zinc-400 leading-tight py-1">
                <span>LINE</span>
                <span>+{LINE_CONTROL_BONUS}</span>
              </div>
            </div>
          </div>

          {/* Bottom Power Core Hand & Polarity Invert Dock */}
          <div className="w-full max-w-[560px] rounded-2xl border border-zinc-800/90 bg-[#111113] p-2.5 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            {/* Polarity Invert Toggle */}
            <button
              type="button"
              disabled={!isMyTurn || !mePlayer || mePlayer.invertLeft <= 0}
              onClick={() => {
                setInvertArmed((prev) => {
                  const next = !prev;
                  if (soundEnabled) playSound(next ? 'paradox' : 'tick');
                  return next;
                });
              }}
              className={`w-full sm:w-auto shrink-0 rounded-xl border px-3 py-2 flex sm:flex-col items-center justify-center gap-1.5 sm:gap-0.5 transition-colors ${
                invertArmed
                  ? 'border-amber-400 bg-amber-400 text-zinc-950'
                  : mePlayer && mePlayer.invertLeft > 0 && isMyTurn
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 cursor-pointer'
                    : 'border-zinc-800/80 bg-zinc-950 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider">
                <RefreshCw size={12} className={invertArmed ? 'animate-spin' : ''} />
                <span>Invert</span>
              </div>
              <span className="text-[9px] font-mono opacity-80">
                {!mePlayer
                  ? 'SPEC'
                  : mePlayer.invertLeft <= 0
                    ? 'USED'
                    : invertArmed
                      ? 'ARMED (>V)'
                      : '1 USE [I]'}
              </span>
            </button>

            {/* 8 Power Core Slots */}
            <div className="grid grid-cols-8 gap-1.5 flex-1 w-full">
              {INITIAL_HAND.map((val) => {
                const available = mePlayer ? mePlayer.hand.includes(val) : false;
                const isSelected = selectedCore === val;
                const canPick = isMyTurn && available;
                const myColor =
                  meIdx === 1
                    ? 'border-zinc-800 bg-zinc-950 text-rose-300 hover:border-rose-400/60'
                    : 'border-zinc-800 bg-zinc-950 text-indigo-300 hover:border-indigo-400/60';
                const selectedColor =
                  invertArmed
                    ? 'border-amber-400 bg-amber-400 text-zinc-950 -translate-y-0.5'
                    : meIdx === 1
                      ? 'border-rose-400 bg-rose-400 text-zinc-950 -translate-y-0.5'
                      : 'border-indigo-400 bg-indigo-400 text-zinc-950 -translate-y-0.5';

                return (
                  <button
                    key={val}
                    type="button"
                    disabled={!canPick}
                    onClick={() => {
                      if (!canPick) return;
                      setSelectedCore((prev) => (prev === val ? null : val));
                      if (soundEnabled) playSound('card_pick');
                    }}
                    className={`relative h-12 rounded-xl border font-mono text-lg font-semibold transition-all flex flex-col items-center justify-center ${
                      !available
                        ? 'border-zinc-900 bg-zinc-950/60 text-zinc-700 cursor-not-allowed'
                        : isSelected
                          ? selectedColor
                          : canPick
                            ? `${myColor} cursor-pointer`
                            : 'border-zinc-800/80 bg-zinc-950 text-zinc-500 cursor-not-allowed opacity-70'
                    }`}
                  >
                    <span>{val}</span>
                    {!available && (
                      <span className="text-[7px] uppercase tracking-wider text-zinc-700">
                        USED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Live Tug-of-War & Tactical Feed */}
        <section className="flex flex-col gap-2.5 min-h-0 order-3">
          {/* Score Tug-of-War */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-3.5 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
              <span className="text-indigo-400 font-semibold">
                {p0?.nickname || 'P1'} · {scores.p0.total}
              </span>
              <span className="text-zinc-500">Δ {Math.abs(scores.p0.total - scores.p1.total)}</span>
              <span className="text-rose-400 font-semibold">
                {scores.p1.total} · {p1?.nickname || 'P2'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-rose-500/35 overflow-hidden flex">
              <motion.div
                className="h-full bg-indigo-400"
                animate={{ width: `${p0BarPct}%` }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>2× Amps: {game.ampCells.map(coordLabel).join(', ')}</span>
              <span>{TOTAL_CELLS - game.turnCount} left</span>
            </div>
          </div>

          {/* Tactical Feed */}
          <div className="flex-1 min-h-[180px] lg:min-h-0 rounded-2xl border border-zinc-800/90 bg-[#111113] p-3.5 flex flex-col">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-300">
                Tactical Feed
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{game.logs.length} ops</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {game.logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-500 px-4 gap-1.5">
                  <ShieldAlert size={18} className="text-zinc-600" />
                  <p>Select a Power Core (1–8) and hover any cell to preview live captures &amp; Exact-10 Hijacks.</p>
                </div>
              ) : (
                [...game.logs].reverse().map((entry) => (
                  <motion.div
                    key={entry.turn}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl border px-2.5 py-2 text-[11px] ${
                      entry.hijacked.length > 0
                        ? 'border-amber-500/35 bg-amber-950/20'
                        : 'border-zinc-800/80 bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5 font-mono text-[10px]">
                      <span
                        className={`font-semibold ${
                          entry.actor === 0 ? 'text-indigo-400' : 'text-rose-400'
                        }`}
                      >
                        #{String(entry.turn).padStart(2, '0')} {entry.actorName}
                      </span>
                      <span className="text-zinc-400">
                        {entry.playedValue}
                        {entry.overloaded ? `→${entry.finalValue}` : ''} @ {coordLabel(entry.cellIdx)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {entry.usedInvert && (
                        <span className="rounded bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-[9px] font-mono font-medium text-zinc-200">
                          INVERT
                        </span>
                      )}
                      {entry.hijacked.length > 0 && (
                        <span className="rounded bg-amber-500/15 border border-amber-400/40 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-amber-400">
                          =10 HIJACK ×{entry.hijacked.length}
                        </span>
                      )}
                      {entry.outflanked.length > 0 && (
                        <span className="rounded bg-indigo-500/15 border border-indigo-400/40 px-1.5 py-0.5 text-[9px] font-mono font-medium text-indigo-300">
                          FLIP ×{entry.outflanked.length}
                        </span>
                      )}
                      {entry.hijacked.length === 0 && entry.outflanked.length === 0 && (
                        <span className="text-[10px] text-zinc-500">Clean placement</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111113] p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
                  Quantum Matrix Manual
                </h2>
                <button
                  type="button"
                  onClick={() => setShowRules(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <li>
                  <strong className="text-zinc-100">8 Unique Power Cores (1–8):</strong> Both players
                  share the exact same hand and alternate placing 1 core per turn until all 16 cells
                  are filled.
                </li>
                <li>
                  <strong className="text-indigo-400">Outflank Capture:</strong> Placing value{' '}
                  <code>V</code> flips any orthogonally adjacent enemy core with value{' '}
                  <code>&lt; V</code>.
                </li>
                <li>
                  <strong className="text-amber-400">Exact-10 Hijack:</strong> If{' '}
                  <code>V + Adjacent Enemy = 10</code> (like 2+8, 3+7, 4+6, 5+5), you hijack that
                  enemy even if you are weaker — and your placed core gets a{' '}
                  <strong>+1 Overload Boost</strong> (max 9).
                </li>
                <li>
                  <strong className="text-zinc-100">1-Use Polarity Invert:</strong> Arm before
                  placing to invert Outflank to <code>&gt; V</code> for one turn (so a 1 can flip an
                  adjacent 8).
                </li>
                <li>
                  <strong className="text-zinc-100">Amplifiers &amp; Line Control:</strong> Two
                  tiles grant <strong>2× cell points</strong>. Strictly leading any row or column
                  (by sum of core values) awards <strong>+{LINE_CONTROL_BONUS} bonus points</strong>.
                </li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Over Modal */}
      <AnimatePresence>
        {game.state === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111113] p-6 space-y-5 text-center"
            >
              <div className="space-y-1.5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950">
                  <Crown className="text-amber-400" size={24} />
                </div>
                <p className="text-[11px] font-mono text-zinc-500">
                  Matrix Complete · 16/16 Cores Locked
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
                  {game.winnerIdx === 'tie'
                    ? 'Quantum Equilibrium (Tie)'
                    : meIdx !== -1 && game.winnerIdx === meIdx
                      ? 'Victory Secured'
                      : `${game.players[game.winnerIdx as PlayerIndex]?.nickname} Wins`}
                </h2>
              </div>

              {/* Final Score Comparison Table */}
              <div className="grid grid-cols-2 gap-3 text-left">
                {[0, 1].map((idx) => {
                  const pIdx = idx as PlayerIndex;
                  const player = game.players[pIdx];
                  const detail = pIdx === 0 ? scores.p0 : scores.p1;
                  const isWinner = game.winnerIdx === pIdx;
                  return (
                    <div
                      key={pIdx}
                      className={`rounded-xl border p-3.5 space-y-1.5 bg-zinc-950 ${
                        isWinner
                          ? pIdx === 0
                            ? 'border-indigo-400/60'
                            : 'border-rose-400/60'
                          : 'border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {player?.nickname}
                        </span>
                        {isWinner && <Crown size={13} className="text-amber-400 shrink-0" />}
                      </div>
                      <div
                        className={`text-3xl font-semibold font-mono ${
                          pIdx === 0 ? 'text-indigo-400' : 'text-rose-400'
                        }`}
                      >
                        {detail.total}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 space-y-0.5 pt-1.5 border-t border-zinc-800">
                        <div className="flex justify-between">
                          <span>Core Values</span>
                          <span className="text-zinc-100">{detail.basePoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2× Amp Bonus</span>
                          <span className="text-amber-400">+{detail.ampBonus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lines ({detail.linesWon}×5)</span>
                          <span className="text-zinc-200">+{detail.lineBonus}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2.5">
                {onRematch && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onRematch}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-50 hover:bg-white py-3 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> Rematch
                  </button>
                )}
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 py-3 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                >
                  Lobby
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
