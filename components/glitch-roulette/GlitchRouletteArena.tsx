'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Skull,
  Zap,
  Eye,
  RefreshCw,
  ArrowUpRight,
  Lock,
  Heart,
  Crosshair,
  ShieldAlert,
  RotateCcw,
  Trophy,
  Info,
  X,
  Flame,
  Cpu,
} from 'lucide-react';
import { playSound } from '@/lib/sounds';

type ShellType = 'live' | 'blank';
type ModChipType = 'xray' | 'overclock' | 'invert' | 'eject' | 'cuff' | 'siphon';

interface ModChipMeta {
  id: ModChipType;
  name: string;
  shortDesc: string;
  accent: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const MOD_CHIPS: Record<ModChipType, ModChipMeta> = {
  xray: {
    id: 'xray',
    name: 'X-Ray Scan',
    shortDesc: 'Reveal next shell',
    accent: 'border-zinc-800 bg-zinc-950 text-zinc-100 hover:border-amber-400/50 hover:bg-zinc-900',
    icon: Eye,
  },
  overclock: {
    id: 'overclock',
    name: 'Overclock',
    shortDesc: 'Next LIVE = 2 DMG',
    accent: 'border-rose-500/30 bg-zinc-950 text-zinc-100 hover:border-rose-500/60 hover:bg-rose-950/20',
    icon: Flame,
  },
  invert: {
    id: 'invert',
    name: 'Polarity Flip',
    shortDesc: 'Flip LIVE ↔ BLANK',
    accent: 'border-amber-400/30 bg-zinc-950 text-zinc-100 hover:border-amber-400/60 hover:bg-amber-950/20',
    icon: RefreshCw,
  },
  eject: {
    id: 'eject',
    name: 'Pump Eject',
    shortDesc: 'Discard next shell',
    accent: 'border-zinc-800 bg-zinc-950 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900',
    icon: ArrowUpRight,
  },
  cuff: {
    id: 'cuff',
    name: 'Cuff Lock',
    shortDesc: 'Skip Dealer turn',
    accent: 'border-amber-400/30 bg-zinc-950 text-zinc-100 hover:border-amber-400/60 hover:bg-amber-950/20',
    icon: Lock,
  },
  siphon: {
    id: 'siphon',
    name: 'Siphon +1',
    shortDesc: 'Heal 1 HP',
    accent: 'border-emerald-500/30 bg-zinc-950 text-zinc-100 hover:border-emerald-400/60 hover:bg-emerald-950/20',
    icon: Heart,
  },
};

const ALL_CHIP_TYPES: ModChipType[] = ['xray', 'overclock', 'invert', 'eject', 'cuff', 'siphon'];

const STAGES = [
  { stage: 1, name: 'SCRIPT KIDDIE', maxHp: 3, chipsPerLoad: 2, accent: 'text-emerald-400' },
  { stage: 2, name: 'SYS-ADMIN', maxHp: 4, chipsPerLoad: 3, accent: 'text-amber-400' },
  { stage: 3, name: 'THE ARCHITECT', maxHp: 5, chipsPerLoad: 4, accent: 'text-rose-400' },
] as const;

function buildMagazine(stage: number): { chamber: ShellType[]; liveTotal: number; blankTotal: number } {
  const size = Math.min(8, 3 + stage + Math.floor(Math.random() * 3));
  const liveCount = Math.max(1, Math.min(size - 1, Math.floor(size / 2) + (Math.random() < 0.4 ? 1 : 0)));
  const blankCount = size - liveCount;
  const arr: ShellType[] = [
    ...Array(liveCount).fill('live'),
    ...Array(blankCount).fill('blank'),
  ];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { chamber: arr, liveTotal: liveCount, blankTotal: blankCount };
}

function drawChips(count: number, current: ModChipType[]): ModChipType[] {
  const next = [...current];
  for (let i = 0; i < count; i++) {
    if (next.length >= 6) break;
    next.push(ALL_CHIP_TYPES[Math.floor(Math.random() * ALL_CHIP_TYPES.length)]);
  }
  return next;
}

export function GlitchRouletteArena() {
  const [stageIdx, setStageIdx] = useState(0);
  const stageCfg = STAGES[stageIdx];

  const [playerHp, setPlayerHp] = useState<number>(stageCfg.maxHp);
  const [dealerHp, setDealerHp] = useState<number>(stageCfg.maxHp);
  const [chamber, setChamber] = useState<ShellType[]>([]);
  const [chamberMeta, setChamberMeta] = useState({ liveTotal: 0, blankTotal: 0 });
  const [playerChips, setPlayerChips] = useState<ModChipType[]>([]);
  const [dealerChips, setDealerChips] = useState<ModChipType[]>([]);

  const [turn, setTurn] = useState<'loading' | 'player' | 'dealer' | 'stage_clear' | 'victory' | 'gameover'>('loading');
  const [overclocked, setOverclocked] = useState(false);
  const [dealerCuffed, setDealerCuffed] = useState(false);
  const [playerCuffed, setPlayerCuffed] = useState(false);
  const [scannedNext, setScannedNext] = useState<ShellType | null>(null);
  const [dealerKnownNext, setDealerKnownNext] = useState<ShellType | null>(null);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [shake, setShake] = useState(false);
  const [flashTone, setFlashTone] = useState<'live' | 'blank' | 'glitch' | null>(null);
  const [cylinderAngle, setCylinderAngle] = useState(0);
  const [eventLog, setEventLog] = useState<string>('Initializing Chamber Zero...');
  const [showRules, setShowRules] = useState(false);
  const busyRef = useRef(false);

  const sfx = useCallback(
    (type: Parameters<typeof playSound>[0]) => {
      if (soundEnabled) playSound(type);
    },
    [soundEnabled]
  );

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem('glitchRouletteBest') || '0');
      if (saved > 0) setBestScore(saved);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      try {
        localStorage.setItem('glitchRouletteBest', String(score));
      } catch {
        // ignore
      }
    }
  }, [score, bestScore]);

  const loadNewMagazine = useCallback(
    (sIdx: number, pChips: ModChipType[], dChips: ModChipType[], starter: 'player' | 'dealer' = 'player') => {
      const cfg = STAGES[sIdx];
      const mag = buildMagazine(cfg.stage);
      setChamber(mag.chamber);
      setChamberMeta({ liveTotal: mag.liveTotal, blankTotal: mag.blankTotal });
      setPlayerChips(drawChips(cfg.chipsPerLoad, pChips));
      setDealerChips(drawChips(cfg.chipsPerLoad, dChips));
      setOverclocked(false);
      setScannedNext(null);
      setDealerKnownNext(null);
      setTurn('loading');
      setCylinderAngle((a) => a + 360);
      sfx('chamber_spin');
      setEventLog(`MAGAZINE LOADED: ${mag.liveTotal} LIVE · ${mag.blankTotal} BLANK`);

      setTimeout(() => {
        setTurn(starter);
      }, 1500);
    },
    [sfx]
  );

  // Start Stage 1 on mount
  useEffect(() => {
    loadNewMagazine(0, [], [], 'player');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerFlash = (tone: 'live' | 'blank' | 'glitch', withShake = false) => {
    setFlashTone(tone);
    if (withShake) setShake(true);
    setTimeout(() => {
      setFlashTone(null);
      setShake(false);
    }, 340);
  };

  const resolveShot = useCallback(
    (shooter: 'player' | 'dealer', target: 'player' | 'dealer') => {
      if (chamber.length === 0) return;

      const shell = chamber[0];
      const remaining = chamber.slice(1);
      const dmg = shell === 'live' ? (overclocked ? 2 : 1) : 0;

      setChamber(remaining);
      setCylinderAngle((a) => a + 60);
      setOverclocked(false);
      setScannedNext(null);
      setDealerKnownNext(null);

      let nextPlayerHp = playerHp;
      let nextDealerHp = dealerHp;

      if (shell === 'live') {
        sfx('gunshot');
        triggerFlash('live', true);
        if (target === 'dealer') {
          nextDealerHp = Math.max(0, dealerHp - dmg);
          setDealerHp(nextDealerHp);
          setScore((s) => s + (shooter === 'player' ? dmg * 150 : 0));
          setEventLog(
            `${shooter === 'player' ? 'YOU' : 'DEALER'} FIRED LIVE! ${dmg} DMG TO ${
              target === 'dealer' ? 'DEALER' : 'YOU'
            }.`
          );
        } else {
          nextPlayerHp = Math.max(0, playerHp - dmg);
          setPlayerHp(nextPlayerHp);
          setEventLog(
            `${shooter === 'player' ? 'YOU' : 'DEALER'} FIRED LIVE! ${dmg} DMG TO YOU.`
          );
        }
      } else {
        sfx('blank_click');
        triggerFlash('blank', false);
        if (shooter === target) {
          setScore((s) => s + (shooter === 'player' ? 100 : 0));
          setEventLog(
            `${shooter === 'player' ? 'CLICK! BLANK ON SELF — EXTRA TURN!' : 'CLICK! DEALER SHOT BLANK ON SELF — DEALER KEEPS TURN!'}`
          );
        } else {
          setEventLog(
            `${shooter === 'player' ? 'CLICK! BLANK AT DEALER.' : 'CLICK! DEALER SHOT A BLANK AT YOU.'}`
          );
        }
      }

      // Check stage death
      if (nextDealerHp <= 0) {
        if (stageIdx >= STAGES.length - 1) {
          sfx('win');
          confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
          setScore((s) => s + 500);
          setTurn('victory');
          setEventLog('THE ARCHITECT TERMINATED. SYSTEM LIBERATED.');
        } else {
          sfx('win');
          setScore((s) => s + 300);
          setTurn('stage_clear');
          setEventLog(`${stageCfg.name} DEFEATED! ADVANCE TO NEXT TIER.`);
        }
        return;
      }

      if (nextPlayerHp <= 0) {
        sfx('hit');
        setTurn('gameover');
        setEventLog('CRITICAL FAILURE — INTEGRITY DEPLETED.');
        return;
      }

      // Determine who goes next
      let nextActor: 'player' | 'dealer';
      if (shell === 'blank' && shooter === target) {
        nextActor = shooter;
      } else {
        nextActor = shooter === 'player' ? 'dealer' : 'player';
      }

      // Check Cuff Lock skip
      if (nextActor === 'dealer' && dealerCuffed) {
        setDealerCuffed(false);
        nextActor = 'player';
        setEventLog((prev) => `${prev} (DEALER CUFFED — YOUR TURN!)`);
      } else if (nextActor === 'player' && playerCuffed) {
        setPlayerCuffed(false);
        nextActor = 'dealer';
        setEventLog((prev) => `${prev} (YOU ARE CUFFED — DEALER TURN!)`);
      }

      // If chamber empty -> reload new magazine
      if (remaining.length === 0) {
        setTimeout(() => {
          loadNewMagazine(stageIdx, playerChips, dealerChips, nextActor);
        }, 700);
      } else {
        setTurn(nextActor);
      }
    },
    [
      chamber,
      dealerChips,
      dealerCuffed,
      dealerHp,
      loadNewMagazine,
      overclocked,
      playerChips,
      playerCuffed,
      playerHp,
      sfx,
      stageCfg.name,
      stageIdx,
    ]
  );

  // Player uses Mod Chip
  const handleUsePlayerChip = (chipIdx: number) => {
    if (turn !== 'player' || busyRef.current || chamber.length === 0) return;
    const chip = playerChips[chipIdx];
    if (!chip) return;

    if (chip === 'overclock' && overclocked) {
      sfx('error');
      setEventLog('OVERCLOCK ALREADY ARMED FOR THIS SHOT.');
      return;
    }
    if (chip === 'cuff' && dealerCuffed) {
      sfx('error');
      setEventLog('DEALER IS ALREADY CUFFED.');
      return;
    }
    if (chip === 'siphon' && playerHp >= stageCfg.maxHp) {
      sfx('error');
      setEventLog('INTEGRITY ALREADY AT MAXIMUM.');
      return;
    }

    const updated = playerChips.filter((_, idx) => idx !== chipIdx);
    setPlayerChips(updated);

    switch (chip) {
      case 'xray': {
        sfx('hint');
        triggerFlash('glitch');
        const nextShell = chamber[0];
        setScannedNext(nextShell);
        setEventLog(`X-RAY SCAN: NEXT SHELL IS ${nextShell.toUpperCase()}!`);
        break;
      }
      case 'overclock': {
        sfx('laser');
        triggerFlash('glitch');
        setOverclocked(true);
        setEventLog('OVERCLOCK ARMED: NEXT LIVE SHELL DEALS 2× DAMAGE!');
        break;
      }
      case 'invert': {
        sfx('paradox');
        triggerFlash('glitch');
        const flipped: ShellType = chamber[0] === 'live' ? 'blank' : 'live';
        setChamber([flipped, ...chamber.slice(1)]);
        if (scannedNext !== null) setScannedNext(flipped);
        setEventLog('POLARITY INVERTED ON CURRENT SHELL!');
        break;
      }
      case 'eject': {
        sfx('flip');
        const ejected = chamber[0];
        const rem = chamber.slice(1);
        setChamber(rem);
        setScannedNext(null);
        setCylinderAngle((a) => a + 60);
        setEventLog(`EJECTED SHELL: IT WAS ${ejected.toUpperCase()}!`);
        if (rem.length === 0) {
          setTimeout(() => {
            loadNewMagazine(stageIdx, updated, dealerChips, 'player');
          }, 700);
        }
        break;
      }
      case 'cuff': {
        sfx('shield');
        setDealerCuffed(true);
        setEventLog('CUFF LOCK APPLIED: DEALER NEXT TURN SKIPPED!');
        break;
      }
      case 'siphon': {
        sfx('rule_check');
        setPlayerHp((hp) => Math.min(stageCfg.maxHp, hp + 1));
        setEventLog('SIPHON COMPLETE: +1 INTEGRITY RESTORED.');
        break;
      }
    }
  };

  // Dealer AI Turn
  useEffect(() => {
    if (turn !== 'dealer' || chamber.length === 0) return;

    const timer = setTimeout(() => {
      // Dealer checks if it wants to use a chip first
      const liveLeft = chamber.filter((s) => s === 'live').length;
      const probLive = liveLeft / chamber.length;

      // Smart AI chip usage
      if (dealerChips.length > 0 && stageIdx >= 1) {
        if (dealerHp < stageCfg.maxHp && dealerChips.includes('siphon')) {
          const idx = dealerChips.indexOf('siphon');
          setDealerChips((prev) => prev.filter((_, i) => i !== idx));
          setDealerHp((hp) => Math.min(stageCfg.maxHp, hp + 1));
          sfx('rule_check');
          setEventLog('DEALER USED SIPHON (+1 HP).');
          return;
        }
        if (!dealerKnownNext && dealerChips.includes('xray') && probLive > 0.25 && probLive < 0.85) {
          const idx = dealerChips.indexOf('xray');
          setDealerChips((prev) => prev.filter((_, i) => i !== idx));
          setDealerKnownNext(chamber[0]);
          sfx('hint');
          setEventLog('DEALER SCANNED THE CHAMBER...');
          return;
        }
        if (!playerCuffed && dealerChips.includes('cuff') && chamber.length >= 2) {
          const idx = dealerChips.indexOf('cuff');
          setDealerChips((prev) => prev.filter((_, i) => i !== idx));
          setPlayerCuffed(true);
          sfx('shield');
          setEventLog('DEALER APPLIED CUFF LOCK TO YOU!');
          return;
        }
        if (!overclocked && dealerChips.includes('overclock') && (dealerKnownNext === 'live' || probLive >= 0.6)) {
          const idx = dealerChips.indexOf('overclock');
          setDealerChips((prev) => prev.filter((_, i) => i !== idx));
          setOverclocked(true);
          sfx('laser');
          setEventLog('DEALER OVERCLOCKED THE CHAMBER (2× DMG)!');
          return;
        }
        if (dealerKnownNext === 'blank' && dealerChips.includes('invert')) {
          const idx = dealerChips.indexOf('invert');
          setDealerChips((prev) => prev.filter((_, i) => i !== idx));
          setChamber(['live', ...chamber.slice(1)]);
          setDealerKnownNext('live');
          sfx('paradox');
          setEventLog('DEALER FLIPPED SHELL POLARITY!');
          return;
        }
      }

      // Decide target
      let target: 'player' | 'dealer';
      if (dealerKnownNext === 'live') target = 'player';
      else if (dealerKnownNext === 'blank') target = 'dealer';
      else if (probLive >= 0.5) target = 'player';
      else if (stageIdx === 0 && Math.random() < 0.45) target = 'player';
      else target = 'dealer';

      resolveShot('dealer', target);
    }, 950);

    return () => clearTimeout(timer);
  }, [
    chamber,
    dealerChips,
    dealerHp,
    dealerKnownNext,
    overclocked,
    playerCuffed,
    resolveShot,
    sfx,
    stageCfg.maxHp,
    stageIdx,
    turn,
  ]);

  const handleNextStage = () => {
    const nextIdx = stageIdx + 1;
    const cfg = STAGES[nextIdx];
    setStageIdx(nextIdx);
    setPlayerHp(cfg.maxHp);
    setDealerHp(cfg.maxHp);
    setDealerCuffed(false);
    setPlayerCuffed(false);
    loadNewMagazine(nextIdx, playerChips, [], 'player');
  };

  const handleRestartMatch = () => {
    const cfg = STAGES[0];
    setStageIdx(0);
    setPlayerHp(cfg.maxHp);
    setDealerHp(cfg.maxHp);
    setScore(0);
    setDealerCuffed(false);
    setPlayerCuffed(false);
    loadNewMagazine(0, [], [], 'player');
  };

  const liveRemaining = chamber.filter((s) => s === 'live').length;
  const blankRemaining = chamber.length - liveRemaining;
  const liveOdds = chamber.length > 0 ? Math.round((liveRemaining / chamber.length) * 100) : 0;

  return (
    <motion.div
      animate={shake ? { x: [-6, 6, -4, 4, -2, 2, 0], y: [3, -3, 2, -2, 0] } : { x: 0, y: 0 }}
      transition={{ duration: 0.28 }}
      className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-50 flex flex-col relative"
    >
      {/* Screen Flash Effect */}
      <AnimatePresence>
        {flashTone && (
          <motion.div
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26 }}
            className={`pointer-events-none fixed inset-0 z-50 ${
              flashTone === 'live'
                ? 'bg-rose-600/35'
                : flashTone === 'glitch'
                ? 'bg-amber-400/15'
                : 'bg-zinc-200/10'
            }`}
          />
        )}
      </AnimatePresence>

      {/* COMPACT 48px HUD */}
      <header className="relative z-20 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md shrink-0">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/tactical-games"
              onClick={() => sfx('chip')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Arenas</span>
            </Link>
            <span className="text-zinc-800 hidden sm:inline">|</span>
            <div className="flex items-center gap-2 text-xs truncate">
              <Skull className="w-3.5 h-3.5 text-rose-500 shrink-0 hidden sm:inline" />
              <span className="font-semibold tracking-tight text-zinc-50 whitespace-nowrap">
                Glitch Roulette
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] font-medium text-zinc-300">
                Stage {stageCfg.stage}/3 · {stageCfg.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1 rounded-lg border border-zinc-800 bg-zinc-900 font-mono text-[11px]">
              <span className="text-zinc-400">
                Score <strong className="text-amber-400">{score}</strong>
              </span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-400">
                Best <strong className="text-zinc-100">{bestScore}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx('rule_check');
                setShowRules(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Rules</span>
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN SINGLE-SCREEN ARENA */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1360px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-between gap-3">
        {/* TOP ROW: DEALER VS PLAYER INTEGRITY BARS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          {/* Player Bar */}
          <div
            className={`rounded-2xl border p-4 flex items-center justify-between gap-3 transition-colors ${
              turn === 'player'
                ? 'border-zinc-500 bg-[#111113]'
                : 'border-zinc-800/90 bg-[#111113]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-tight text-zinc-100">
                  Operative (You)
                </span>
                {turn === 'player' && (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-50 text-zinc-950 font-mono text-[10px] font-semibold">
                    YOUR TURN
                  </span>
                )}
                {playerCuffed && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-semibold">
                    CUFFED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {Array.from({ length: stageCfg.maxHp }).map((_, i) => (
                  <Zap
                    key={i}
                    size={16}
                    className={
                      i < playerHp
                        ? 'text-zinc-100 fill-zinc-100'
                        : 'text-zinc-800'
                    }
                  />
                ))}
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold text-zinc-100 tabular-nums">
              {playerHp}/{stageCfg.maxHp}
            </div>
          </div>

          {/* Dealer Bar */}
          <div
            className={`rounded-2xl border p-4 flex items-center justify-between gap-3 transition-colors ${
              turn === 'dealer'
                ? 'border-rose-500/60 bg-[#111113]'
                : 'border-zinc-800/90 bg-[#111113]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs font-semibold tracking-tight text-zinc-100">
                  {stageCfg.name}
                </span>
                {turn === 'dealer' && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono text-[10px] font-semibold animate-pulse">
                    ACTING
                  </span>
                )}
                {dealerCuffed && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-semibold">
                    SKIPPED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {Array.from({ length: stageCfg.maxHp }).map((_, i) => (
                  <Zap
                    key={i}
                    size={16}
                    className={
                      i < dealerHp
                        ? 'text-rose-500 fill-rose-500'
                        : 'text-zinc-800'
                    }
                  />
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-semibold text-rose-500 tabular-nums">
                {dealerHp}/{stageCfg.maxHp}
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                {dealerChips.length} mods held
              </div>
            </div>
          </div>
        </div>

        {/* CENTER CHAMBER & ACTION STAGE */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* LEFT 5 COLS: SPINNING CYLINDER + LIVE ODDS + EVENT LOG */}
          <section className="lg:col-span-5 bg-[#111113] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between gap-3 h-full max-h-[430px]">
            <div className="w-full flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 uppercase tracking-wider">Chamber Telemetry</span>
              <span className="text-amber-400 font-semibold">
                {chamber.length} Shells Left
              </span>
            </div>

            {/* Revolving Cylinder Visual */}
            <div className="relative flex items-center justify-center my-auto">
              <motion.div
                animate={{ rotate: cylinderAngle }}
                transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 flex items-center justify-center ${
                  overclocked
                    ? 'border-rose-500 bg-rose-950/20'
                    : 'border-zinc-700 bg-zinc-950'
                }`}
              >
                <div className="w-8 h-8 rounded-full border border-zinc-700 bg-[#09090b] flex items-center justify-center">
                  <Crosshair className={`w-4 h-4 ${overclocked ? 'text-rose-400 animate-spin' : 'text-zinc-500'}`} />
                </div>
                {Array.from({ length: 6 }).map((_, idx) => {
                  const angle = (idx * 60 * Math.PI) / 180;
                  const r = 48;
                  const x = Math.cos(angle) * r;
                  const y = Math.sin(angle) * r;
                  const hasShell = idx < chamber.length;
                  return (
                    <div
                      key={idx}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className={`absolute w-6 h-6 rounded-full border-2 transition-colors ${
                        hasShell
                          ? idx === 0 && scannedNext
                            ? scannedNext === 'live'
                              ? 'bg-rose-500 border-rose-300'
                              : 'bg-zinc-300 border-zinc-100'
                            : 'bg-amber-400/80 border-amber-300/90'
                          : 'bg-zinc-900 border-zinc-800'
                      }`}
                    />
                  );
                })}
              </motion.div>

              {overclocked && (
                <span className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-semibold tracking-wider">
                  2× OVERCLOCK ARMED
                </span>
              )}
              {scannedNext && !overclocked && (
                <span
                  className={`absolute -bottom-2.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold tracking-wider ${
                    scannedNext === 'live'
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-200 text-zinc-950'
                  }`}
                >
                  NEXT = {scannedNext.toUpperCase()}
                </span>
              )}
            </div>

            {/* Shell Breakdown & Live Odds */}
            <div className="w-full space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-xl border border-rose-500/25 bg-rose-950/20 py-1.5">
                  <div className="text-[10px] text-rose-400/80">LIVE</div>
                  <div className="font-semibold text-rose-400 text-sm">{liveRemaining}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 py-1.5">
                  <div className="text-[10px] text-zinc-400">BLANK</div>
                  <div className="font-semibold text-zinc-200 text-sm">{blankRemaining}</div>
                </div>
                <div className="rounded-xl border border-amber-400/25 bg-amber-950/15 py-1.5">
                  <div className="text-[10px] text-amber-400/80">LIVE ODDS</div>
                  <div className="font-semibold text-amber-400 text-sm">{liveOdds}%</div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-center font-mono text-xs text-zinc-300 truncate">
                {eventLog}
              </div>
            </div>
          </section>

          {/* RIGHT 7 COLS: MOD CHIPS TRAY + FIRE TARGETS */}
          <section className="lg:col-span-7 bg-[#111113] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 h-full max-h-[430px]">
            {/* Mod Chips Inventory */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-tight text-zinc-100">
                  Reality Mod Chips ({playerChips.length}/6)
                </h2>
                <span className="text-[11px] font-mono text-zinc-400">
                  +{stageCfg.chipsPerLoad} chips per magazine
                </span>
              </div>

              {playerChips.length === 0 ? (
                <div className="h-28 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 flex items-center justify-center text-xs font-mono text-zinc-500">
                  No Mod Chips held — draw on next magazine load
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {playerChips.map((chipId, idx) => {
                    const meta = MOD_CHIPS[chipId];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={`${chipId}-${idx}`}
                        type="button"
                        disabled={turn !== 'player' || chamber.length === 0}
                        onClick={() => handleUsePlayerChip(idx)}
                        className={`rounded-xl border p-2.5 text-left transition-colors flex items-start gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${meta.accent}`}
                      >
                        <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 shrink-0">
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold leading-tight truncate text-zinc-100">
                            {meta.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                            {meta.shortDesc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Firing Triggers */}
            <div className="space-y-2.5 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>PULL THE TRIGGER</span>
                <span>BLANK ON SELF = EXTRA TURN</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={turn !== 'player' || chamber.length === 0}
                  onClick={() => resolveShot('player', 'dealer')}
                  className="group relative py-4 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-left transition-colors disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-tight">
                      Shoot Dealer
                    </span>
                    <Crosshair className="w-5 h-5 text-rose-100 group-hover:scale-105 transition-transform" />
                  </div>
                  <p className="text-[11px] font-mono text-rose-100/85 mt-1">
                    Deal {overclocked ? '2 DMG' : '1 DMG'} if LIVE · Ends your turn
                  </p>
                </button>

                <button
                  type="button"
                  disabled={turn !== 'player' || chamber.length === 0}
                  onClick={() => resolveShot('player', 'player')}
                  className="group relative py-4 px-5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-left transition-colors disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-tight">
                      Shoot Self
                    </span>
                    <ShieldAlert className="w-5 h-5 text-zinc-300 group-hover:scale-105 transition-transform" />
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
                    Keep turn +100 pts if BLANK · Take {overclocked ? '2 DMG' : '1 DMG'} if LIVE
                  </p>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* STAGE CLEAR / VICTORY / GAME OVER MODAL */}
      {(turn === 'stage_clear' || turn === 'victory' || turn === 'gameover') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center space-y-5"
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              {turn === 'gameover' ? (
                <Skull className="w-7 h-7 text-rose-500" />
              ) : (
                <Trophy className="w-7 h-7 text-amber-400" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
                {turn === 'victory'
                  ? 'System Overthrown!'
                  : turn === 'stage_clear'
                  ? `${stageCfg.name} Cleared`
                  : 'Flatlined'}
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1.5">
                Score: <strong className="text-amber-400">{score}</strong> · Best: {bestScore}
              </p>
            </div>

            <div className="flex gap-2.5">
              {turn === 'stage_clear' ? (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="flex-1 py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors"
                >
                  Enter Stage {stageIdx + 2}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRestartMatch}
                  className="flex-1 py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Run Again</span>
                </button>
              )}
              <Link
                href="/tactical-games"
                className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs flex items-center justify-center transition-colors"
              >
                Arenas
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* RULES MODAL */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowRules(false)}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl p-5 text-zinc-100 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
              <h2 className="text-base font-semibold tracking-tight text-zinc-50">
                How to Play Glitch Roulette
              </h2>
              <button type="button" onClick={() => setShowRules(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
              <li>
                <strong className="text-zinc-50">Loaded Cylinder:</strong> Each magazine loads a random mix of <span className="text-rose-400 font-semibold">LIVE</span> and <span className="text-zinc-200 font-semibold">BLANK</span> shells. Track remaining counts in Telemetry.
              </li>
              <li>
                <strong className="text-zinc-50">Russian Gamble:</strong> Shooting the Dealer passes the turn. Shooting yourself with a <span className="text-zinc-200 font-semibold">BLANK</span> gives you an <strong className="text-amber-400">Extra Turn</strong>!
              </li>
              <li>
                <strong className="text-zinc-50">Reality Mod Chips:</strong> Combine X-Ray, Overclock (2× DMG), Polarity Flip, Pump Eject, Cuff Lock, and Siphon (+1 HP) to rig the odds and defeat all 3 AI bosses.
              </li>
            </ul>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
