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
        colors: ['#e6c27a', '#5b8def', '#d4566a', '#f7f2e8'],
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
      <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0c0b0e] atelier-bg text-[#f5f0e6] flex flex-col relative">
        <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(212,168,83,0.11), transparent 65%)',
          }}
        />
        <header className="relative z-20 shrink-0 border-b border-[#d4a853]/18 bg-[#0c0b0e]/85 backdrop-blur-md px-5 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onExit}
            className="btn-obsidian inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium text-[#e7decb] cursor-pointer"
          >
            <ArrowLeft size={14} className="text-[#d4a853]" /> Lobby
          </button>
          <span className="rounded-full border border-[#d4a853]/28 bg-[#16141a]/90 px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[#e6c27a]">
            Quantum Matrix · 1v1 Link
          </span>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="atelier-card w-full max-w-md rounded-2xl border-[#d4a853]/25 p-6 space-y-5"
          >
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4a853]/35 bg-gradient-to-b from-[#211c14] to-[#121015] shadow-[inset_0_1px_0_rgba(230,194,122,0.3)]">
                <Cpu className="text-[#e6c27a]" size={22} />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#faf4e8]">
                {canJoin ? 'Join ' : 'Awaiting '}
                <span className="font-serif italic font-normal text-[#e6c27a]">
                  {canJoin ? 'Quantum Matrix' : 'Challenger'}
                </span>
              </h1>
            </div>

            {game.gameId && (
              <div className="rounded-xl border border-[#d4a853]/25 bg-[#0a090d] p-4 text-center space-y-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]">
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#9e9484]">
                  Room Code
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-semibold tracking-[0.28em] text-[#e6c27a] pl-2">
                    {game.gameId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="btn-obsidian inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-[#e7decb] cursor-pointer"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-[#d4a853]" />}
                    {copiedCode ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-[#9e9484]">
                  Host: <span className="text-[#8cb4ff] font-medium">{p0?.nickname || 'Host'}</span> · 2× Amp
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
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#b9ae9a] mb-1.5">
                    Your Callsign
                  </label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Enter callsign..."
                    maxLength={14}
                    className="w-full rounded-xl border border-[#d4a853]/22 bg-[#0a090d] px-3.5 py-2.5 text-sm font-medium text-[#faf4e8] placeholder:text-[#5d564c] focus:border-[#e6c27a]/70 focus:outline-none transition-colors shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-brass w-full rounded-xl py-3 text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Syncing Matrix...' : 'Lock In & Start Duel'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="flex items-center gap-2 text-xs text-[#b9ae9a]">
                  <span className="h-2 w-2 rounded-full bg-[#e6c27a] animate-ping" />
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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0c0b0e] atelier-bg text-[#f5f0e6] flex flex-col relative select-none">
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 42% at 50% 0%, rgba(212,168,83,0.09), transparent 65%), radial-gradient(ellipse 35% 35% at 12% 85%, rgba(45,90,175,0.09), transparent 60%), radial-gradient(ellipse 35% 35% at 88% 85%, rgba(168,42,64,0.09), transparent 60%)',
        }}
      />

      {/* Top HUD Bar */}
      <header className="relative z-20 flex items-center justify-between gap-3 border-b border-[#d4a853]/18 bg-[#0c0b0e]/85 backdrop-blur-md px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="btn-obsidian inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#e7decb] cursor-pointer"
          >
            <ArrowLeft size={13} className="text-[#d4a853]" /> Exit
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg border border-[#d4a853]/30 bg-gradient-to-b from-[#211c14] to-[#121015]">
              <Cpu size={14} className="text-[#e6c27a]" />
            </div>
            <div className="leading-tight truncate">
              <h1 className="font-display text-sm sm:text-base font-bold tracking-tight text-[#faf4e8] uppercase">
                Quantum <span className="font-serif italic font-normal capitalize text-[#e6c27a]">Matrix</span>
              </h1>
              <p className="text-[10px] font-mono text-[#948a7a] hidden sm:block">
                4×4 Brass &amp; Obsidian Strategy Board
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
              className="btn-obsidian inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium tracking-widest text-[#e6c27a] cursor-pointer"
            >
              <span>{game.gameId}</span>
              {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          )}

          <div className="rounded-xl border border-[#d4a853]/25 bg-[#151319] px-3 py-1.5 text-[11px] font-mono text-[#c5bba8] shadow-[inset_0_1px_0_rgba(230,194,122,0.12)]">
            Turn <span className="font-semibold text-[#e6c27a]">{Math.min(game.turnCount + (game.state === 'playing' ? 1 : 0), TOTAL_CELLS)}</span>
            <span className="text-[#786f62]">/{TOTAL_CELLS}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowRules((s) => !s)}
            className="btn-obsidian inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#e7decb] cursor-pointer"
            title="Tactical Rules"
          >
            <HelpCircle size={15} className="text-[#d4a853]" />
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className="btn-obsidian inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#e7decb] cursor-pointer"
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            {soundEnabled ? <Volume2 size={15} className="text-[#e6c27a]" /> : <VolumeX size={15} className="text-[#786f62]" />}
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
                  ? 'border-[#6b9bff]/80 shadow-[0_0_24px_rgba(91,141,239,0.16)]'
                  : 'border-[#d4a853]/20'
                : isActiveTurn
                  ? 'border-[#e05d72]/80 shadow-[0_0_24px_rgba(224,93,114,0.16)]'
                  : 'border-[#d4a853]/20';
            const badgeBg =
              pIdx === 0
                ? 'bg-gradient-to-b from-[#233d70] to-[#142342] text-[#e6efff] border-[#6b9bff]/55'
                : 'bg-gradient-to-b from-[#5e1a2a] to-[#340d17] text-[#ffe4e8] border-[#e05d72]/55';

            return (
              <div
                key={player.sessionId || pIdx}
                className={`atelier-card rounded-2xl p-3.5 transition-all ${accentRing}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ${badgeBg}`}
                    >
                      {player.isBot ? <Bot size={14} /> : `P${pIdx + 1}`}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#faf4e8] truncate">
                          {player.nickname}
                        </span>
                        {isMe && (
                          <span className="rounded border border-[#d4a853]/35 bg-[#211b12] px-1.5 py-0.5 text-[9px] font-mono text-[#e6c27a]">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9e9484]">
                        {isActiveTurn ? (
                          <span className={pIdx === 0 ? 'text-[#8cb4ff] font-semibold' : 'text-[#f48496] font-semibold'}>
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
                      className={`text-2xl font-bold font-mono leading-none ${
                        pIdx === 0 ? 'text-[#a3c4ff]' : 'text-[#f896a6]'
                      }`}
                    >
                      {detail.total}
                    </motion.div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#8c8272]">
                      PTS
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Strip */}
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#0a090d] border border-[#d4a853]/15 p-1.5 text-center mb-2.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]">
                  <div>
                    <div className="text-[11px] font-mono font-semibold text-[#f5f0e6]">
                      {detail.basePoints}
                    </div>
                    <div className="text-[9px] font-mono text-[#867d6e]">Cores</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-semibold text-[#e6c27a]">
                      +{detail.ampBonus}
                    </div>
                    <div className="text-[9px] font-mono text-[#867d6e]">2× Amp</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-semibold text-[#e2d8c5]">
                      +{detail.lineBonus}
                    </div>
                    <div className="text-[9px] font-mono text-[#867d6e]">
                      {detail.linesWon} Lines
                    </div>
                  </div>
                </div>

                {/* Invert Status + Remaining Cores Intel */}
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 border ${
                      player.invertLeft > 0
                        ? 'border-[#d4a853]/35 bg-[#1d1812] text-[#e6c27a]'
                        : 'border-[#2a262f] bg-[#0a090d] text-[#5c554c] line-through'
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
                                ? 'bg-[#192b4f] text-[#b4cfff] border border-[#5b8def]/45'
                                : 'bg-[#451320] text-[#ffb0bc] border border-[#e05d72]/45'
                              : 'bg-[#0b0a0e] text-[#453f39]'
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
          <div className="atelier-card rounded-2xl border-[#d4a853]/20 p-3.5 space-y-2 text-[11px] leading-snug text-[#a99f8e] mt-auto">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-[#e6c27a]">
              <Sparkles size={12} className="text-[#d4a853]" /> Capture Protocol
            </div>
            <div className="space-y-1.5 text-[11px]">
              <p>
                <span className="text-[#8cb4ff] font-medium">Outflank:</span> Flip adjacent enemy cores
                with value <span className="font-mono text-[#f7f2e8]">&lt; V</span>.
              </p>
              <p>
                <span className="text-[#e6c27a] font-medium">Exact-10 Hijack:</span> If{' '}
                <span className="font-mono text-[#f2d48f]">V + Enemy = 10</span>, steal it anyway &amp;
                boost your core <span className="font-mono text-[#f2d48f]">+1</span> (max 9).
              </p>
              <p>
                <span className="text-[#e7decb] font-medium">Polarity Invert (1×):</span> Flip
                enemies <span className="font-mono text-[#f7f2e8]">&gt; V</span> for 1 move.
              </p>
              <p>
                <span className="text-[#e7decb] font-medium">Line Control:</span> Strict lead in any
                row or column grants <span className="font-mono text-[#e6c27a]">+{LINE_CONTROL_BONUS}</span>.
              </p>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: Turn Status + 4x4 Grid with Row/Col Pills + Hand Dock */}
        <section className="flex flex-col items-center justify-between gap-2.5 min-h-0 order-1 lg:order-2">
          {/* Dynamic Status / Hover Telemetry Strip */}
          <div className="w-full max-w-[540px] atelier-card rounded-xl border-[#d4a853]/25 px-3.5 py-2 flex items-center justify-between gap-3">
            {hoverPreview ? (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="rounded-lg bg-[#0b0a0e] border border-[#d4a853]/35 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#e6c27a]">
                    {coordLabel(hoverPreview.cellIdx)}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                    {hoverPreview.hijacked.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#2a200e] border border-[#e6c27a]/60 px-1.5 py-0.5 text-[#f2d48f]">
                        <Zap size={11} /> =10 Hijack ×{hoverPreview.hijacked.length}
                        {hoverPreview.overloaded ? ' (+1)' : ''}
                      </span>
                    )}
                    {hoverPreview.outflanked.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#162646] border border-[#6b9bff]/55 px-1.5 py-0.5 text-[#b4cfff]">
                        Flip ×{hoverPreview.outflanked.length}
                      </span>
                    )}
                    {hoverPreview.flips.length === 0 && (
                      <span className="text-[#a99f8e] font-normal">
                        Deploy Core {hoverPreview.playedValue}
                        {hoverPreview.isAmpCell ? ' on 2× Amp' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono text-xs font-semibold px-2 py-0.5 rounded-lg border ${
                    hoverPreview.netSwing >= 10
                      ? 'bg-[#2a200e] text-[#f2d48f] border-[#e6c27a]/55'
                      : 'bg-[#0b0a0e] text-[#e7decb] border-[#d4a853]/25'
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
                      game.turnIdx === 0 ? 'text-[#8cb4ff] shrink-0' : 'text-[#f07687] shrink-0'
                    }
                  />
                  <span className="text-xs font-medium text-[#ede5d6] truncate">
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
                  <span className="shrink-0 rounded-full bg-gradient-to-b from-[#2b2213] to-[#1a140c] border border-[#d4a853]/45 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[#e6c27a]">
                    Your Move
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 4×4 Brass-Trimmed Tabletop Board + Row/Col Control Pills */}
          <div className="w-full max-w-[515px] flex-1 min-h-0 flex items-center justify-center">
            <div className="w-full rounded-2xl border border-[#d4a853]/30 bg-gradient-to-b from-[#1a171f] via-[#131117] to-[#0e0c11] p-2.5 sm:p-3 shadow-[0_24px_60px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(230,194,122,0.22)]">
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

                        let cellStyle =
                          'border-[#d4a853]/18 bg-gradient-to-b from-[#211e27] to-[#141218] shadow-[inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-3px_0_rgba(0,0,0,0.6),0_4px_10px_rgba(0,0,0,0.4)]';
                        if (cell) {
                          cellStyle =
                            cell.owner === 0
                              ? 'border-[#6b9bff]/65 bg-gradient-to-b from-[#243f75] via-[#192c54] to-[#111e3a] shadow-[inset_0_1px_0_rgba(219,234,254,0.32),inset_0_-3px_0_rgba(8,14,28,0.75),0_6px_14px_rgba(0,0,0,0.48)]'
                              : 'border-[#e05d72]/65 bg-gradient-to-b from-[#661b2d] via-[#47111f] to-[#2e0a13] shadow-[inset_0_1px_0_rgba(255,228,230,0.28),inset_0_-3px_0_rgba(28,5,10,0.8),0_6px_14px_rgba(0,0,0,0.48)]';
                        } else if (isAmp) {
                          cellStyle =
                            'border-[#e6c27a]/55 bg-gradient-to-b from-[#2a2112] via-[#1c160d] to-[#130f0a] shadow-[inset_0_1px_0_rgba(245,222,168,0.28),inset_0_-3px_0_rgba(0,0,0,0.65),0_4px_12px_rgba(212,168,83,0.14)]';
                        }

                        if (flipPreviewType === 'hijack') {
                          cellStyle =
                            'border-[#f2d48f] ring-2 ring-[#e6c27a]/85 bg-gradient-to-b from-[#453314] to-[#241a09] shadow-[0_0_24px_rgba(230,194,122,0.38)]';
                        } else if (flipPreviewType === 'outflank') {
                          cellStyle =
                            meIdx === 1
                              ? 'border-[#f07687] ring-2 ring-[#e05d72]/80 bg-gradient-to-b from-[#5c1929] to-[#340d17]'
                              : 'border-[#8cb4ff] ring-2 ring-[#6b9bff]/80 bg-gradient-to-b from-[#223c70] to-[#142342]';
                        } else if (isHovered) {
                          cellStyle = invertArmed
                            ? 'border-[#f2d48f] ring-2 ring-[#e6c27a]/75 bg-gradient-to-b from-[#332713] to-[#1c160b]'
                            : meIdx === 1
                              ? 'border-[#f07687] ring-2 ring-[#e05d72]/65 bg-gradient-to-b from-[#451420] to-[#260b12]'
                              : 'border-[#8cb4ff] ring-2 ring-[#6b9bff]/65 bg-gradient-to-b from-[#1d325c] to-[#121f3a]';
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
                            className={`group relative aspect-square rounded-xl border transition-all duration-150 flex flex-col items-center justify-center overflow-hidden ${cellStyle} ${
                              emptyClickable
                                ? 'cursor-pointer hover:border-[#e6c27a]/65'
                                : cell === null && isMyTurn
                                  ? 'cursor-pointer hover:border-[#d4a853]/40'
                                  : 'cursor-default'
                            }`}
                          >
                            {/* Coordinate Stamp */}
                            <span className="absolute top-1.5 left-2 text-[9px] font-mono font-medium text-[#9e917d]/80">
                              {coordLabel(idx)}
                            </span>

                            {/* 2x Brushed-Gold Amplifier Medallion */}
                            {isAmp && (
                              <span className="absolute top-1.5 right-1.5 rounded-md bg-gradient-to-b from-[#f0d088] to-[#b88936] px-1.5 py-0.5 text-[8px] font-mono font-bold tracking-tight text-[#151006] shadow-[0_2px_6px_rgba(212,168,83,0.35)]">
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
                                  className={`text-3xl sm:text-4xl font-bold font-mono leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] ${
                                    cell.owner === 0 ? 'text-[#eef4ff]' : 'text-[#ffe6ea]'
                                  }`}
                                >
                                  {cell.value}
                                </span>
                                <div className="mt-1 flex items-center gap-1">
                                  {cell.overloaded && (
                                    <span className="inline-flex items-center gap-0.5 rounded bg-gradient-to-b from-[#f0d088] to-[#b88936] px-1 py-0.5 text-[8px] font-mono font-bold text-[#141008] leading-none">
                                      <Zap size={8} /> +1
                                    </span>
                                  )}
                                  {isAmp && (
                                    <span className="rounded bg-[#0d0b0e]/85 border border-[#e6c27a]/45 px-1 text-[8px] font-mono font-semibold text-[#f2d48f]">
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
                                      ? 'text-[#f2d48f]'
                                      : invertArmed
                                        ? 'text-[#e6c27a]'
                                        : meIdx === 1
                                          ? 'text-[#ffb3bf]'
                                          : 'text-[#bdd5ff]'
                                  }`}
                                >
                                  {hoverPreview.finalValue}
                                </span>
                                <span
                                  className={`mt-1 rounded px-1.5 py-0.5 text-[8px] font-mono font-semibold ${
                                    hoverPreview.overloaded
                                      ? 'bg-[#e6c27a] text-[#141008]'
                                      : 'bg-[#0b0a0e]/90 text-[#e7decb] border border-[#d4a853]/35'
                                  }`}
                                >
                                  {hoverPreview.netSwing >= 0
                                    ? `+${hoverPreview.netSwing} SWING`
                                    : `${hoverPreview.netSwing}`}
                                </span>
                              </div>
                            ) : isAmp ? (
                              <div className="flex flex-col items-center text-[#e6c27a]/90">
                                <Sparkles size={16} />
                                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider mt-0.5">
                                  2× AMP
                                </span>
                              </div>
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#d4a853]/20 group-hover:bg-[#e6c27a]/65 transition-colors" />
                            )}

                            {/* Hover Preview Overlay Badge on Adjacent Enemy Cells */}
                            {flipPreviewType === 'hijack' && (
                              <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute bottom-1 inset-x-1 rounded-md bg-gradient-to-r from-[#f2d48f] via-[#e6c27a] to-[#c7983e] text-[#141008] px-1 py-0.5 text-[8px] font-mono font-bold tracking-tight flex items-center justify-center gap-0.5 shadow-[0_2px_10px_rgba(230,194,122,0.5)]"
                              >
                                <Zap size={9} /> =10 HIJACK
                              </motion.div>
                            )}
                            {flipPreviewType === 'outflank' && (
                              <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`absolute bottom-1 inset-x-1 rounded-md px-1 py-0.5 text-[8px] font-mono font-bold tracking-tight text-center ${
                                  meIdx === 1
                                    ? 'bg-[#f07687] text-[#1a070b]'
                                    : 'bg-[#8cb4ff] text-[#091224]'
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
                                    ? 'text-[#f2d48f]'
                                    : wasLastPlaced
                                      ? 'text-[#e7decb]/85'
                                      : 'text-[#b4cfff]'
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
                            ? 'border-[#6b9bff]/50 bg-[#152444]/75 text-[#b4cfff]'
                            : rowScore.leader === 1
                              ? 'border-[#e05d72]/50 bg-[#40121e]/75 text-[#ffb3bf]'
                              : 'border-[#d4a853]/18 bg-[#121016] text-[#847b6c]'
                        }`}
                      >
                        <span className="text-[8px] uppercase text-[#8f8575]">R{rowIdx + 1}</span>
                        <div className="text-[11px] font-semibold leading-tight">
                          <span className="text-[#9cc0ff]">{rowScore.p0}</span>
                          <span className="text-[#696054] mx-0.5">:</span>
                          <span className="text-[#f58a9b]">{rowScore.p1}</span>
                        </div>
                        <span
                          className={`text-[8px] font-semibold ${
                            rowScore.leader === 0
                              ? 'text-[#9cc0ff]'
                              : rowScore.leader === 1
                                ? 'text-[#f58a9b]'
                                : 'text-[#6c6356]'
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
                        ? 'border-[#6b9bff]/50 bg-[#152444]/75 text-[#b4cfff]'
                        : colScore.leader === 1
                          ? 'border-[#e05d72]/50 bg-[#40121e]/75 text-[#ffb3bf]'
                          : 'border-[#d4a853]/18 bg-[#121016] text-[#847b6c]'
                    }`}
                  >
                    <span className="text-[9px] font-medium text-[#9e917d]">
                      {['A', 'B', 'C', 'D'][colIdx]}
                    </span>
                    <span className="font-semibold">
                      <span className="text-[#9cc0ff]">{colScore.p0}</span>
                      <span className="text-[#696054] mx-0.5">:</span>
                      <span className="text-[#f58a9b]">{colScore.p1}</span>
                    </span>
                    <span className="text-[8px] font-semibold">
                      {colScore.leader === null ? '—' : `+${LINE_CONTROL_BONUS}`}
                    </span>
                  </div>
                ))}

                <div className="rounded-xl border border-[#d4a853]/28 bg-[#1a150e] flex flex-col items-center justify-center text-[8px] font-mono font-semibold uppercase text-[#e6c27a] leading-tight py-1">
                  <span>LINE</span>
                  <span>+{LINE_CONTROL_BONUS}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tactile Power Core Hand & Polarity Invert Dock */}
          <div style={{ transform: 'none' }} className="w-full max-w-[560px] atelier-card rounded-2xl border-[#d4a853]/28 p-2.5 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
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
              className={`w-full sm:w-auto shrink-0 rounded-xl border px-3 py-2 flex sm:flex-col items-center justify-center gap-1.5 sm:gap-0.5 transition-all ${
                invertArmed
                  ? 'border-[#f5dc9f] bg-gradient-to-b from-[#f0d188] to-[#b98a34] text-[#141008] shadow-[0_0_20px_rgba(230,194,122,0.4),inset_0_1px_0_rgba(255,255,255,0.65)]'
                  : mePlayer && mePlayer.invertLeft > 0 && isMyTurn
                    ? 'border-[#d4a853]/40 bg-gradient-to-b from-[#231d15] to-[#14110d] text-[#e6c27a] hover:border-[#e6c27a]/75 cursor-pointer shadow-[inset_0_1px_0_rgba(230,194,122,0.2)]'
                    : 'border-[#28242c] bg-[#0c0b0e] text-[#595249] cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider">
                <RefreshCw size={12} className={invertArmed ? 'animate-spin' : ''} />
                <span>Invert</span>
              </div>
              <span className="text-[9px] font-mono opacity-85">
                {!mePlayer
                  ? 'SPEC'
                  : mePlayer.invertLeft <= 0
                    ? 'USED'
                    : invertArmed
                      ? 'ARMED (>V)'
                      : '1 USE [I]'}
              </span>
            </button>

            {/* 8 Tactile Power Core Tiles */}
            <div className="grid grid-cols-8 gap-1.5 flex-1 w-full">
              {INITIAL_HAND.map((val) => {
                const available = mePlayer ? mePlayer.hand.includes(val) : false;
                const isSelected = selectedCore === val;
                const canPick = isMyTurn && available;
                const myColor =
                  meIdx === 1
                    ? 'border-[#e05d72]/35 bg-gradient-to-b from-[#3b121c] to-[#210910] text-[#ffd4db] hover:border-[#f07687]/80 shadow-[inset_0_1px_0_rgba(255,220,226,0.18),0_3px_0_rgba(0,0,0,0.65)]'
                    : 'border-[#6b9bff]/35 bg-gradient-to-b from-[#1c3059] to-[#101c36] text-[#ddeaff] hover:border-[#8cb4ff]/80 shadow-[inset_0_1px_0_rgba(219,234,254,0.2),0_3px_0_rgba(0,0,0,0.65)]';
                const selectedColor =
                  invertArmed
                    ? 'border-[#f7e2ae] bg-gradient-to-b from-[#f2d48f] to-[#b98a36] text-[#141008] -translate-y-1 shadow-[0_6px_16px_rgba(230,194,122,0.4),inset_0_1px_0_rgba(255,255,255,0.7)]'
                    : meIdx === 1
                      ? 'border-[#fda4af] bg-gradient-to-b from-[#e05268] to-[#9b1b32] text-[#fff5f6] -translate-y-1 shadow-[0_6px_16px_rgba(224,82,104,0.38),inset_0_1px_0_rgba(255,230,234,0.45)]'
                      : 'border-[#bdd5ff] bg-gradient-to-b from-[#4f80e0] to-[#274b94] text-[#ffffff] -translate-y-1 shadow-[0_6px_16px_rgba(91,141,239,0.4),inset_0_1px_0_rgba(255,255,255,0.45)]';

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
                    className={`relative h-12 rounded-xl border font-mono text-lg font-bold transition-all flex flex-col items-center justify-center ${
                      !available
                        ? 'border-[#211e26] bg-[#0b0a0e] text-[#453f39] cursor-not-allowed shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]'
                        : isSelected
                          ? selectedColor
                          : canPick
                            ? `${myColor} cursor-pointer`
                            : 'border-[#2c2732] bg-[#131117] text-[#6d655a] cursor-not-allowed opacity-70'
                    }`}
                  >
                    <span>{val}</span>
                    {!available && (
                      <span className="text-[7px] uppercase tracking-wider text-[#4e473f]">
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
          <div className="atelier-card rounded-2xl border-[#d4a853]/22 p-3.5 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
              <span className="text-[#9cc0ff] font-semibold">
                {p0?.nickname || 'P1'} · {scores.p0.total}
              </span>
              <span className="text-[#e6c27a]">Δ {Math.abs(scores.p0.total - scores.p1.total)}</span>
              <span className="text-[#f58a9b] font-semibold">
                {scores.p1.total} · {p1?.nickname || 'P2'}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#4a1422] border border-[#d4a853]/25 overflow-hidden flex shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]">
              <motion.div
                className="h-full bg-gradient-to-r from-[#3e6cc9] to-[#7aa6ff]"
                animate={{ width: `${p0BarPct}%` }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#948a7a]">
              <span>2× Amps: <strong className="text-[#e6c27a]">{game.ampCells.map(coordLabel).join(', ')}</strong></span>
              <span>{TOTAL_CELLS - game.turnCount} left</span>
            </div>
          </div>

          {/* Tactical Feed */}
          <div className="flex-1 min-h-[180px] lg:min-h-0 atelier-card rounded-2xl border-[#d4a853]/22 p-3.5 flex flex-col">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-[#e6c27a]">
                Tactical Feed
              </span>
              <span className="text-[10px] font-mono text-[#8b8172]">{game.logs.length} ops</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {game.logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#8f8575] px-4 gap-1.5">
                  <ShieldAlert size={18} className="text-[#d4a853]/60" />
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
                        ? 'border-[#e6c27a]/45 bg-[#241c0e]/75'
                        : 'border-[#d4a853]/14 bg-[#0b0a0e]/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5 font-mono text-[10px]">
                      <span
                        className={`font-semibold ${
                          entry.actor === 0 ? 'text-[#9cc0ff]' : 'text-[#f58a9b]'
                        }`}
                      >
                        #{String(entry.turn).padStart(2, '0')} {entry.actorName}
                      </span>
                      <span className="text-[#b5aa97]">
                        {entry.playedValue}
                        {entry.overloaded ? `→${entry.finalValue}` : ''} @ {coordLabel(entry.cellIdx)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {entry.usedInvert && (
                        <span className="rounded bg-[#221c12] border border-[#d4a853]/40 px-1.5 py-0.5 text-[9px] font-mono font-medium text-[#e6c27a]">
                          INVERT
                        </span>
                      )}
                      {entry.hijacked.length > 0 && (
                        <span className="rounded bg-[#e6c27a]/18 border border-[#e6c27a]/50 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-[#f2d48f]">
                          =10 HIJACK ×{entry.hijacked.length}
                        </span>
                      )}
                      {entry.outflanked.length > 0 && (
                        <span className="rounded bg-[#1a2e54] border border-[#6b9bff]/45 px-1.5 py-0.5 text-[9px] font-mono font-medium text-[#b4cfff]">
                          FLIP ×{entry.outflanked.length}
                        </span>
                      )}
                      {entry.hijacked.length === 0 && entry.outflanked.length === 0 && (
                        <span className="text-[10px] text-[#7c7366]">Clean placement</span>
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
              className="atelier-card w-full max-w-md rounded-2xl border-[#d4a853]/30 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#d4a853]/18 pb-3">
                <h2 className="font-display text-lg font-bold tracking-tight text-[#faf4e8]">
                  Quantum Matrix <span className="font-serif italic font-normal text-[#e6c27a]">Manual</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowRules(false)}
                  className="rounded-lg p-1 text-[#9e9484] hover:bg-[#1e1b24] hover:text-[#faf4e8] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <ul className="space-y-2.5 text-xs text-[#cfc6b6] leading-relaxed">
                <li>
                  <strong className="text-[#faf4e8]">8 Unique Power Cores (1–8):</strong> Both players
                  share the exact same hand and alternate placing 1 core per turn until all 16 cells
                  are filled.
                </li>
                <li>
                  <strong className="text-[#8cb4ff]">Outflank Capture:</strong> Placing value{' '}
                  <code>V</code> flips any orthogonally adjacent enemy core with value{' '}
                  <code>&lt; V</code>.
                </li>
                <li>
                  <strong className="text-[#e6c27a]">Exact-10 Hijack:</strong> If{' '}
                  <code>V + Adjacent Enemy = 10</code> (like 2+8, 3+7, 4+6, 5+5), you hijack that
                  enemy even if you are weaker — and your placed core gets a{' '}
                  <strong>+1 Overload Boost</strong> (max 9).
                </li>
                <li>
                  <strong className="text-[#faf4e8]">1-Use Polarity Invert:</strong> Arm before
                  placing to invert Outflank to <code>&gt; V</code> for one turn (so a 1 can flip an
                  adjacent 8).
                </li>
                <li>
                  <strong className="text-[#faf4e8]">Amplifiers &amp; Line Control:</strong> Two
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
              className="atelier-card w-full max-w-md rounded-2xl border-[#d4a853]/35 p-6 space-y-5 text-center"
            >
              <div className="space-y-1.5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4a853]/40 bg-gradient-to-b from-[#2b2213] to-[#15110b] shadow-[inset_0_1px_0_rgba(245,222,168,0.3)]">
                  <Crown className="text-[#e6c27a]" size={24} />
                </div>
                <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9e9484]">
                  Matrix Complete · 16/16 Cores Locked
                </p>
                <h2 className="font-display text-2xl font-bold tracking-tight text-[#faf4e8]">
                  {game.winnerIdx === 'tie' ? (
                    <>
                      Quantum <span className="font-serif italic font-normal text-[#e6c27a]">Equilibrium</span>
                    </>
                  ) : meIdx !== -1 && game.winnerIdx === meIdx ? (
                    <>
                      Victory <span className="font-serif italic font-normal text-[#e6c27a]">Secured</span>
                    </>
                  ) : (
                    <>
                      {game.players[game.winnerIdx as PlayerIndex]?.nickname}{' '}
                      <span className="font-serif italic font-normal text-[#e6c27a]">Wins</span>
                    </>
                  )}
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
                      className={`rounded-xl border p-3.5 space-y-1.5 bg-[#0b0a0e] ${
                        isWinner
                          ? pIdx === 0
                            ? 'border-[#6b9bff]/65'
                            : 'border-[#e05d72]/65'
                          : 'border-[#d4a853]/18'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#faf4e8] truncate">
                          {player?.nickname}
                        </span>
                        {isWinner && <Crown size={13} className="text-[#e6c27a] shrink-0" />}
                      </div>
                      <div
                        className={`text-3xl font-bold font-mono ${
                          pIdx === 0 ? 'text-[#9cc0ff]' : 'text-[#f58a9b]'
                        }`}
                      >
                        {detail.total}
                      </div>
                      <div className="text-[10px] font-mono text-[#9e9484] space-y-0.5 pt-1.5 border-t border-[#d4a853]/15">
                        <div className="flex justify-between">
                          <span>Core Values</span>
                          <span className="text-[#f5f0e6]">{detail.basePoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2× Amp Bonus</span>
                          <span className="text-[#e6c27a]">+{detail.ampBonus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lines ({detail.linesWon}×5)</span>
                          <span className="text-[#e7decb]">+{detail.lineBonus}</span>
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
                    className="btn-brass flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> Rematch
                  </button>
                )}
                <button
                  type="button"
                  onClick={onExit}
                  className="btn-obsidian flex-1 rounded-xl py-3 text-xs font-medium text-[#e7decb] cursor-pointer"
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
