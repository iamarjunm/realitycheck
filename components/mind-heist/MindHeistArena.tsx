'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Brain,
  Shield,
  Crosshair,
  Eye,
  Flame,
  Sparkles,
  Zap,
  Snowflake,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trophy,
  Skull,
  RotateCcw,
  Lock,
  HelpCircle,
  History,
  X,
  AlertTriangle,
  Heart,
  Swords,
  ChevronRight,
  Minus,
  Plus,
  Layers,
  Ghost,
} from 'lucide-react';
import {
  AttackBreakdown,
  CHAMBERS,
  CHAMBER_META,
  COUNTER_READ_BASE,
  COUNTER_READ_STREAK_STEP,
  ChamberId,
  MAX_CHAMBER_SHIELD,
  MindHeistPlan,
  MindHeistRoundLog,
  MindHeistState,
  NEURAL_ENERGY,
  RELIC_DEFS,
  RelicId,
  TACTICAL_PRESETS,
  TacticalPreset,
  computeBreachDamage,
  createDefaultPlan,
} from '@/lib/mind-heist';
import { SoundEffectType, playSound } from '@/lib/sounds';

export interface MindHeistArenaProps {
  state: MindHeistState;
  meIdx: number;
  roomCode?: string;
  isSolo?: boolean;
  isBotThinking?: boolean;
  busy?: boolean;
  onBack: () => void;
  onJoinRoom?: (nickname: string) => void;
  onLockPlan: (plan: MindHeistPlan) => void;
  onNextRound: () => void;
  onRematch: () => void;
}

function RelicIcon({ relic, className }: { relic: RelicId; className?: string }) {
  switch (relic) {
    case 'mirage_split':
      return <Layers className={className} />;
    case 'soul_siphon':
      return <Heart className={className} />;
    case 'paranoia_glitch':
      return <AlertTriangle className={className} />;
    case 'time_freeze':
      return <Snowflake className={className} />;
    case 'doppelganger':
      return <Ghost className={className} />;
    case 'overdrive':
      return <Zap className={className} />;
  }
}

interface AstralVaultSvgProps {
  mode: 'waiting' | 'planning' | 'reveal' | 'finished';
  plan: MindHeistPlan;
  paranoiaActive: boolean;
  locked: boolean;
  myBreakdown: AttackBreakdown | null;
  oppBreakdown: AttackBreakdown | null;
  onSelectTarget?: (chamber: ChamberId) => void;
}

const VAULT_CHAMBER_STROKE: Record<ChamberId, { hex: string; text: string; badgeBg: string; badgeBorder: string }> = {
  ALPHA: {
    hex: '#f43f5e',
    text: 'text-rose-400',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/40',
  },
  BETA: {
    hex: '#818cf8',
    text: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-400/40',
  },
  OMEGA: {
    hex: '#f59e0b',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/40',
  },
};

function AstralMindVaultSvg({
  mode,
  plan,
  paranoiaActive,
  locked,
  myBreakdown,
  oppBreakdown,
  onSelectTarget,
}: AstralVaultSvgProps) {
  const isClash = mode === 'reveal' || mode === 'finished';
  const myHitMeta = myBreakdown ? CHAMBER_META[myBreakdown.hitChamber] : CHAMBER_META[plan.targetChamber];
  const oppHitMeta = oppBreakdown ? CHAMBER_META[oppBreakdown.hitChamber] : null;
  const spinSpeed = locked ? 8 : isClash ? 12 : 42;
  const innerSpinSpeed = locked ? 5 : isClash ? 8 : 26;

  return (
    <motion.div
      className="relative w-full max-w-[330px] lg:max-w-[360px] aspect-square mx-auto select-none"
      animate={
        paranoiaActive && mode === 'planning'
          ? {
              x: [0, -2.5, 2, -1.5, 0, 1.5, 0],
              y: [0, 1.5, -1, 1, 0, -1.5, 0],
              skewX: [0, 1.2, -1.2, 0.5, 0],
            }
          : { x: 0, y: 0, skewX: 0 }
      }
      transition={
        paranoiaActive && mode === 'planning'
          ? { duration: 2.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
          : { duration: 0.2 }
      }
    >
      <svg viewBox="0 0 420 420" className="w-full h-full relative z-10 overflow-visible">
        <defs>
          <radialGradient id="mhCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#818cf8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mhRingGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="mhRingSlate" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#d4d4d8" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="mhVaultEdge" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Precision Horology Ring (Ring 1) */}
        <motion.g
          style={{ originX: '210px', originY: '210px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: spinSpeed, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="210"
            cy="210"
            r="186"
            fill="none"
            stroke="url(#mhRingGold)"
            strokeWidth="1.4"
            strokeOpacity="0.6"
            strokeDasharray="18 10 4 10"
          />
          <circle
            cx="210"
            cy="210"
            r="174"
            fill="none"
            stroke="#52525b"
            strokeWidth="0.9"
            strokeOpacity="0.5"
            strokeDasharray="2 8"
          />
          {Array.from({ length: 12 }).map((_, idx) => {
            const angle = (idx * 30 * Math.PI) / 180;
            const x1 = 210 + Math.cos(angle) * 176;
            const y1 = 210 + Math.sin(angle) * 176;
            const x2 = 210 + Math.cos(angle) * 188;
            const y2 = 210 + Math.sin(angle) * 188;
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={idx % 3 === 0 ? '#fbbf24' : '#71717a'}
                strokeWidth={idx % 3 === 0 ? '2' : '1'}
                strokeOpacity="0.75"
              />
            );
          })}
        </motion.g>

        {/* Middle Counter-Rotating Geometric Ring (Ring 2) */}
        <motion.g
          style={{ originX: '210px', originY: '210px' }}
          animate={{ rotate: -360 }}
          transition={{ duration: innerSpinSpeed, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="210"
            cy="210"
            r="138"
            fill="none"
            stroke="url(#mhRingSlate)"
            strokeWidth="1.6"
            strokeOpacity="0.55"
            strokeDasharray="46 16 12 16"
          />
          {/* Hexagram / Astral Diamond Shards */}
          <polygon
            points="210,74 328,282 92,282"
            fill="none"
            stroke="#fbbf24"
            strokeOpacity="0.22"
            strokeWidth="1.1"
          />
          <polygon
            points="210,346 92,138 328,138"
            fill="none"
            stroke="#f43f5e"
            strokeOpacity="0.2"
            strokeWidth="1.1"
          />
        </motion.g>

        {/* Inner Ring (Ring 3) */}
        <motion.g
          style={{ originX: '210px', originY: '210px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="210"
            cy="210"
            r="74"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.4"
            strokeOpacity="0.5"
            strokeDasharray="8 6"
          />
          <circle
            cx="210"
            cy="210"
            r="58"
            fill="none"
            stroke="#818cf8"
            strokeWidth="1.1"
            strokeOpacity="0.4"
            strokeDasharray="20 8"
          />
        </motion.g>

        {/* Paranoia Ghost Chromatic Ring */}
        {paranoiaActive && mode === 'planning' && (
          <motion.circle
            cx="214"
            cy="208"
            r="142"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.8"
            strokeDasharray="14 24"
            animate={{ opacity: [0.15, 0.75, 0.1, 0.6], rotate: [0, 8, -6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}

        {/* Expanding Shockwave Pulses during Clash Reveal */}
        {isClash && (
          <>
            <motion.circle
              cx="210"
              cy="210"
              r="40"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.4"
              initial={{ r: 32, opacity: 0.9 }}
              animate={{ r: 196, opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.circle
              cx="210"
              cy="210"
              r="40"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1.8"
              initial={{ r: 24, opacity: 0.8 }}
              animate={{ r: 185, opacity: 0 }}
              transition={{ duration: 1.4, delay: 0.45, repeat: Infinity, ease: 'easeOut' }}
            />
          </>
        )}

        {/* Neural Energy Conduit Lines between Chambers */}
        <line x1="210" y1="74" x2="92" y2="282" stroke="#3f3f46" strokeOpacity="0.65" strokeWidth="1.2" />
        <line x1="92" y1="282" x2="328" y2="282" stroke="#3f3f46" strokeOpacity="0.65" strokeWidth="1.2" />
        <line x1="328" y1="282" x2="210" y2="74" stroke="#3f3f46" strokeOpacity="0.65" strokeWidth="1.2" />

        {/* Active Targeting Laser in Planning Mode */}
        {mode === 'planning' && (
          <motion.line
            x1="210"
            y1="210"
            x2={CHAMBER_META[plan.targetChamber].svgX}
            y2={CHAMBER_META[plan.targetChamber].svgY}
            stroke="#f43f5e"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeDasharray="10 6"
            filter="url(#mhVaultEdge)"
            animate={{ strokeDashoffset: [0, -32], opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Clash Reveal Laser Breach Arcs */}
        {isClash && myBreakdown && (
          <motion.path
            d={`M 210 210 Q ${(210 + myHitMeta.svgX) / 2 + 24} ${(210 + myHitMeta.svgY) / 2 - 22} ${myHitMeta.svgX} ${myHitMeta.svgY}`}
            fill="none"
            stroke={myBreakdown.breached ? '#fbbf24' : '#71717a'}
            strokeWidth={myBreakdown.breached ? '3.8' : '2'}
            strokeLinecap="round"
            filter="url(#mhVaultEdge)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
        {isClash && oppBreakdown && oppHitMeta && (
          <motion.path
            d={`M 210 210 Q ${(210 + oppHitMeta.svgX) / 2 - 26} ${(210 + oppHitMeta.svgY) / 2 + 24} ${oppHitMeta.svgX} ${oppHitMeta.svgY}`}
            fill="none"
            stroke={oppBreakdown.breached ? '#f43f5e' : '#52525b'}
            strokeWidth={oppBreakdown.breached ? '3.4' : '1.8'}
            strokeDasharray="8 5"
            strokeLinecap="round"
            filter="url(#mhVaultEdge)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          />
        )}

        {/* Central Astral Eye / Mind Core */}
        <circle cx="210" cy="210" r="46" fill="url(#mhCoreGlow)" />
        <motion.circle
          cx="210"
          cy="210"
          r="34"
          fill="#111113"
          stroke={isClash ? '#fbbf24' : locked ? '#818cf8' : '#f43f5e'}
          strokeWidth="2.2"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <text
          x="210"
          y="204"
          textAnchor="middle"
          fill="#fbbf24"
          fontSize="9"
          fontWeight="700"
          letterSpacing="2"
        >
          {isClash ? 'CLASH' : locked ? 'LOCKED' : 'STRIKE'}
        </text>
        <text
          x="210"
          y="224"
          textAnchor="middle"
          fill="#fafafa"
          fontSize="20"
          fontWeight="800"
          fontFamily="monospace"
        >
          {isClash && myBreakdown
            ? `${myBreakdown.totalDamageDealt}`
            : plan.relic === 'overdrive'
            ? `${plan.strikePower * 2}`
            : `${plan.strikePower}`}
        </text>

        {/* 3 Chamber Nodes: ALPHA, BETA, OMEGA */}
        {CHAMBERS.map((chamber) => {
          const meta = CHAMBER_META[chamber];
          const strokeMeta = VAULT_CHAMBER_STROKE[chamber];
          const isTarget = mode === 'planning' && plan.targetChamber === chamber;
          const isTrap = mode === 'planning' && plan.trapChamber === chamber;
          const isRead = mode === 'planning' && plan.mindReadCall === chamber;
          const shieldVal = plan.shields[chamber];

          const myHitHere = isClash && myBreakdown?.hitChamber === chamber;
          const oppTrapHere = isClash && oppBreakdown?.plan.trapChamber === chamber;
          const myCounterHere = isClash && myBreakdown?.counterReadHit && oppTrapHere;

          return (
            <g
              key={chamber}
              className={mode === 'planning' && !locked ? 'cursor-pointer' : undefined}
              onClick={() => {
                if (mode === 'planning' && !locked && onSelectTarget) {
                  onSelectTarget(chamber);
                }
              }}
            >
              {/* Outer pulse ring if targeted or breached */}
              {(isTarget || myHitHere) && (
                <motion.circle
                  cx={meta.svgX}
                  cy={meta.svgY}
                  r="42"
                  fill="none"
                  stroke={myHitHere ? '#fbbf24' : '#f43f5e'}
                  strokeWidth="1.8"
                  strokeDasharray="6 4"
                  animate={{ r: [38, 45, 38], opacity: [0.9, 0.3, 0.9] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {/* Chamber Orb */}
              <circle
                cx={meta.svgX}
                cy={meta.svgY}
                r="34"
                fill="#111113"
                stroke={isTarget || myHitHere ? '#fbbf24' : strokeMeta.hex}
                strokeWidth={isTarget || myHitHere ? '2.6' : '1.8'}
              />

              {/* Inner subtle ring */}
              <circle
                cx={meta.svgX}
                cy={meta.svgY}
                r="26"
                fill={strokeMeta.hex}
                fillOpacity={isTarget ? '0.16' : '0.07'}
              />

              {/* Chamber Name */}
              <text
                x={meta.svgX}
                y={meta.svgY - 6}
                textAnchor="middle"
                fill={strokeMeta.hex}
                fontSize="10"
                fontWeight="700"
                letterSpacing="1.2"
              >
                {paranoiaActive && mode === 'planning' ? meta.glitchLabel : meta.label}
              </text>

              {/* Shield Readout or Clash Damage */}
              <text
                x={meta.svgX}
                y={meta.svgY + 12}
                textAnchor="middle"
                fill="#fafafa"
                fontSize="13"
                fontWeight="700"
                fontFamily="monospace"
              >
                {isClash && myBreakdown && oppBreakdown
                  ? `SH ${oppBreakdown.plan.shields[chamber]}`
                  : `SH ${shieldVal}`}
              </text>

              {/* Trap Badge (top-left of orb in planning) */}
              {isTrap && (
                <g transform={`translate(${meta.svgX - 30}, ${meta.svgY - 26})`}>
                  <rect width="26" height="15" rx="4" fill="#be123c" stroke="#fda4af" strokeWidth="0.8" />
                  <text x="13" y="10.5" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="800">
                    TRAP
                  </text>
                </g>
              )}

              {/* Mind-Read Badge (top-right of orb in planning) */}
              {isRead && (
                <g transform={`translate(${meta.svgX + 6}, ${meta.svgY - 26})`}>
                  <rect width="28" height="15" rx="4" fill="#4f46e5" stroke="#c7d2fe" strokeWidth="0.8" />
                  <text x="14" y="10.5" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="800">
                    READ
                  </text>
                </g>
              )}

              {/* Target Tag (bottom of orb in planning) */}
              {isTarget && (
                <g transform={`translate(${meta.svgX - 26}, ${meta.svgY + 25})`}>
                  <rect width="52" height="15" rx="4" fill="#fbbf24" />
                  <text x="26" y="10.5" textAnchor="middle" fill="#09090b" fontSize="7.5" fontWeight="800">
                    TARGET
                  </text>
                </g>
              )}

              {/* Rival Trap Reveal in Clash Mode */}
              {isClash && oppTrapHere && (
                <g transform={`translate(${meta.svgX - 32}, ${meta.svgY + 24})`}>
                  <rect
                    width="64"
                    height="16"
                    rx="4"
                    fill={myCounterHere ? '#059669' : '#be123c'}
                    stroke="#fafafa"
                    strokeWidth="0.6"
                  />
                  <text x="32" y="11" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="800">
                    {myCounterHere ? 'SHATTERED!' : 'RIVAL TRAP'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

function ClashBreakdownCard({
  title,
  accent,
  breakdown,
  defenderShields,
  defenderTrap,
  isMe,
}: {
  title: string;
  accent: 'gold' | 'crimson';
  breakdown: AttackBreakdown;
  defenderShields: Record<ChamberId, number>;
  defenderTrap: ChamberId;
  isMe: boolean;
}) {
  const borderColor = accent === 'gold' ? 'border-amber-500/35' : 'border-rose-500/35';
  const badgeBg =
    accent === 'gold'
      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      : 'bg-rose-500/10 text-rose-300 border-rose-500/30';

  return (
    <div
      className={`rounded-2xl bg-[#111113] border ${borderColor} p-3.5 flex flex-col gap-2.5`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeBg}`}>
            {isMe ? 'YOUR ASSAULT' : 'RIVAL ASSAULT'}
          </span>
          <span className="text-xs font-semibold text-zinc-100 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-bold font-mono text-amber-300 tabular-nums">
            {breakdown.totalDamageDealt} DMG
          </span>
          <span
            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded tabular-nums ${
              breakdown.netSanityChange >= 0
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-rose-500/15 text-rose-300'
            }`}
          >
            {breakdown.netSanityChange >= 0 ? `+${breakdown.netSanityChange}` : breakdown.netSanityChange} HP
          </span>
        </div>
      </div>

      {/* Tactical Grid */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
        <div className="rounded-xl bg-zinc-950 border border-zinc-800/90 p-2">
          <div className="text-zinc-500 uppercase font-mono tracking-wider">Target</div>
          <div className={`font-semibold text-xs mt-0.5 ${VAULT_CHAMBER_STROKE[breakdown.hitChamber].text}`}>
            {breakdown.hitChamber}
            {breakdown.mirageSplashUsed && <span className="text-[9px] text-indigo-300 ml-1">(SPLASH)</span>}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-0.5 tabular-nums">
            STR {breakdown.effectiveStrike} vs SH {breakdown.effectiveShield}
          </div>
        </div>

        <div className="rounded-xl bg-zinc-950 border border-zinc-800/90 p-2">
          <div className="text-zinc-500 uppercase font-mono tracking-wider">Mind-Read</div>
          <div className="font-semibold text-xs mt-0.5 text-indigo-300">{breakdown.plan.mindReadCall}</div>
          <div
            className={`text-[10px] font-mono font-semibold mt-0.5 ${
              breakdown.counterReadHit ? 'text-emerald-400' : 'text-zinc-500'
            }`}
          >
            {breakdown.counterReadHit ? `✓ READ! +${breakdown.counterReadDamage}` : `✗ Trap: ${defenderTrap}`}
          </div>
        </div>

        <div className="rounded-xl bg-zinc-950 border border-zinc-800/90 p-2">
          <div className="text-zinc-500 uppercase font-mono tracking-wider">Shield Split</div>
          <div className="font-mono text-[11px] font-semibold text-zinc-100 mt-0.5 tabular-nums">
            {breakdown.plan.shields.ALPHA}/{breakdown.plan.shields.BETA}/{breakdown.plan.shields.OMEGA}
          </div>
          <div className="text-[10px] text-rose-400 font-medium mt-0.5">
            Trap: {breakdown.plan.trapChamber}
          </div>
        </div>
      </div>

      {/* Armed Relic Banner */}
      {breakdown.armedRelic && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-amber-500/35">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-100">
            <RelicIcon relic={breakdown.armedRelic} className="w-3.5 h-3.5 text-amber-400" />
            <span>{RELIC_DEFS[breakdown.armedRelic].name}</span>
          </div>
          <span className="text-[10px] font-mono text-amber-300">
            {breakdown.doppelgangerCopied
              ? `Copied ${RELIC_DEFS[breakdown.doppelgangerCopied].name}`
              : breakdown.doppelgangerFallbackBonus
              ? '+4 Bonus Strike'
              : RELIC_DEFS[breakdown.armedRelic].shortEffect}
          </span>
        </div>
      )}

      {/* Event Highlights */}
      <div className="flex flex-wrap gap-1">
        {breakdown.highlights.map((tag, i) => {
          const isBad = tag.includes('AMBUSHED') || tag.includes('BLOCKED');
          const isGood =
            tag.includes('COUNTER-READ') || tag.includes('BREACH') || tag.includes('SIPHON');
          return (
            <span
              key={i}
              className={`text-[9.5px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isBad
                  ? 'bg-rose-500/10 border-rose-500/35 text-rose-300'
                  : isGood
                  ? 'bg-amber-500/10 border-amber-500/35 text-amber-300'
                  : 'bg-indigo-500/10 border-indigo-400/35 text-indigo-300'
              }`}
            >
              {tag}
            </span>
          );
        })}
      </div>

      {/* Defender Shield Reference */}
      <div className="text-[10px] font-mono text-zinc-500 flex items-center justify-between border-t border-zinc-800/80 pt-1.5 tabular-nums">
        <span>
          Target Shields: A:{defenderShields.ALPHA} · B:{defenderShields.BETA} · O:{defenderShields.OMEGA}
        </span>
        {breakdown.trapRecoilTaken > 0 && (
          <span className="text-rose-400 font-semibold">-{breakdown.trapRecoilTaken} TRAP RECOIL</span>
        )}
      </div>
    </div>
  );
}

export default function MindHeistArena({
  state,
  meIdx,
  roomCode,
  isSolo = false,
  isBotThinking = false,
  busy = false,
  onBack,
  onJoinRoom,
  onLockPlan,
  onNextRound,
  onRematch,
}: MindHeistArenaProps) {
  const [plan, setPlan] = useState<MindHeistPlan>(() => createDefaultPlan());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [showCodex, setShowCodex] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [flashBurst, setFlashBurst] = useState(false);

  const lastRevealedRoundRef = useRef<number>(0);
  const celebratedWinnerRef = useRef<boolean>(false);

  const sfx = (type: SoundEffectType) => {
    if (soundEnabled) playSound(type);
  };

  const me = meIdx >= 0 ? state.players[meIdx] ?? null : null;
  const opp = meIdx >= 0 && state.players.length === 2 ? state.players[meIdx === 0 ? 1 : 0] : null;
  const latestLog: MindHeistRoundLog | null =
    state.history.length > 0 ? state.history[state.history.length - 1] : null;

  const myBreakdown = useMemo(() => {
    if (!latestLog || meIdx < 0) return null;
    return meIdx === 0 ? latestLog.p0 : latestLog.p1;
  }, [latestLog, meIdx]);

  const oppBreakdown = useMemo(() => {
    if (!latestLog || meIdx < 0) return null;
    return meIdx === 0 ? latestLog.p1 : latestLog.p0;
  }, [latestLog, meIdx]);

  // Reset armed relic / refresh local plan cleanly on new round start
  useEffect(() => {
    if (state.status === 'planning' && me && !me.locked) {
      setPlan((prev) => ({
        ...prev,
        relic: null,
      }));
      celebratedWinnerRef.current = false;
    }
  }, [state.status, state.round, me?.locked]);

  // Trigger reveal FX + SFX when a new round resolves
  useEffect(() => {
    if (
      (state.status === 'reveal' || state.status === 'finished') &&
      latestLog &&
      latestLog.round !== lastRevealedRoundRef.current
    ) {
      lastRevealedRoundRef.current = latestLog.round;
      setShakeKey((k) => k + 1);
      setFlashBurst(true);
      const tFlash = setTimeout(() => setFlashBurst(false), 450);

      if (soundEnabled) {
        playSound('laser');
        const t2 = setTimeout(() => {
          if (myBreakdown?.counterReadHit || oppBreakdown?.counterReadHit) {
            playSound('paradox');
          } else if (myBreakdown?.breached || oppBreakdown?.breached) {
            playSound('hit');
          } else {
            playSound('shield');
          }
        }, 180);
        return () => {
          clearTimeout(tFlash);
          clearTimeout(t2);
        };
      }
      return () => clearTimeout(tFlash);
    }
  }, [state.status, latestLog, myBreakdown, oppBreakdown, soundEnabled]);

  // Confetti + Verdict audio on match finish
  useEffect(() => {
    if (state.status === 'finished' && !celebratedWinnerRef.current && meIdx >= 0) {
      celebratedWinnerRef.current = true;
      if (state.winnerIdx === meIdx) {
        if (soundEnabled) playSound('win');
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.58 },
          colors: ['#fbbf24', '#f43f5e', '#a855f7', '#22d3ee'],
        });
      } else if (state.winnerIdx === -1) {
        if (soundEnabled) playSound('paradox');
      } else {
        if (soundEnabled) playSound('fold');
      }
    }
  }, [state.status, state.winnerIdx, meIdx, soundEnabled]);

  const totalShields = plan.shields.ALPHA + plan.shields.BETA + plan.shields.OMEGA;
  const spentEnergy = totalShields + plan.strikePower;
  const unspentEnergy = Math.max(0, NEURAL_ENERGY - spentEnergy);

  const adjustShield = (chamber: ChamberId, delta: number) => {
    if (!me || me.locked || busy) return;
    setPlan((prev) => {
      const current = prev.shields[chamber];
      const nextVal = Math.max(0, Math.min(MAX_CHAMBER_SHIELD, current + delta));
      if (nextVal === current) return prev;

      const diff = nextVal - current;
      const curTotalShields = prev.shields.ALPHA + prev.shields.BETA + prev.shields.OMEGA;
      const curRem = NEURAL_ENERGY - curTotalShields - prev.strikePower;

      let nextStrike = prev.strikePower;
      if (diff > 0) {
        const deficit = diff - curRem;
        if (deficit > 0) {
          if (prev.strikePower >= deficit) {
            nextStrike = prev.strikePower - deficit;
          } else {
            return prev; // Cannot exceed 12 total energy
          }
        }
      } else {
        // Reclaiming shield energy immediately empowers Strike so 12/12 stays ready!
        nextStrike = Math.min(NEURAL_ENERGY, prev.strikePower + Math.abs(diff));
      }

      sfx('tick');
      return {
        ...prev,
        shields: { ...prev.shields, [chamber]: nextVal },
        strikePower: nextStrike,
      };
    });
  };

  const adjustStrike = (delta: number) => {
    if (!me || me.locked || busy) return;
    setPlan((prev) => {
      const nextStrike = Math.max(0, Math.min(NEURAL_ENERGY, prev.strikePower + delta));
      if (nextStrike === prev.strikePower) return prev;

      const nextShields = { ...prev.shields };
      if (delta > 0) {
        const curTotalShields = nextShields.ALPHA + nextShields.BETA + nextShields.OMEGA;
        const curRem = NEURAL_ENERGY - curTotalShields - prev.strikePower;
        if (curRem < delta) {
          // Smoothly trim 1 from the highest shield chamber
          const highest = [...CHAMBERS].sort((a, b) => nextShields[b] - nextShields[a])[0];
          if (nextShields[highest] <= 0) return prev;
          nextShields[highest] -= 1;
        }
      }

      sfx('tick');
      return {
        ...prev,
        shields: nextShields,
        strikePower: nextStrike,
      };
    });
  };

  const applyPreset = (preset: TacticalPreset) => {
    if (!me || me.locked || busy) return;
    sfx('deal');
    setPlan((prev) => ({
      ...prev,
      shields: { ...preset.shields },
      strikePower: preset.strikePower,
      trapChamber: preset.trapChamber,
      targetChamber: preset.targetChamber,
      mindReadCall: preset.mindReadCall,
    }));
  };

  const toggleRelic = (relicId: RelicId) => {
    if (!me || me.locked || busy) return;
    if (me.usedRelics.includes(relicId)) {
      sfx('error');
      return;
    }
    sfx('flip');
    setPlan((prev) => ({
      ...prev,
      relic: prev.relic === relicId ? null : relicId,
    }));
  };

  const handleConfirmLock = () => {
    if (!me || me.locked || busy) return;
    // Auto-channel any unspent energy into Strike so players never waste power
    const finalPlan: MindHeistPlan = {
      ...plan,
      strikePower: plan.strikePower + unspentEnergy,
    };
    setPlan(finalPlan);
    sfx('rule_check');
    onLockPlan(finalPlan);
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopied(true);
    sfx('chip');
    setTimeout(() => setCopied(false), 1800);
  };

  const previewStrike = plan.relic === 'overdrive' ? plan.strikePower * 2 : plan.strikePower;
  const previewMaxDmg = computeBreachDamage(previewStrike, 0);
  const nextCounterReadDmg =
    COUNTER_READ_BASE + (me ? me.readStreak : 0) * COUNTER_READ_STREAK_STEP;

  const isParanoia = Boolean(me?.paranoiaActive && state.status === 'planning');

  return (
    <motion.div
      key={`shake-${shakeKey}`}
      animate={
        shakeKey > 0 && (state.status === 'reveal' || state.status === 'finished')
          ? { x: [0, -7, 7, -5, 4, -2, 0], y: [0, 3, -4, 3, -2, 0] }
          : { x: 0, y: 0 }
      }
      transition={{ duration: 0.42 }}
      className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col relative selection:bg-amber-500/20"
    >
      {/* Clash Flash Burst */}
      <AnimatePresence>
        {flashBurst && (
          <motion.div
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none fixed inset-0 z-50 bg-amber-400/20"
          />
        )}
      </AnimatePresence>

      {/* Top HUD Bar */}
      <header className="relative z-20 shrink-0 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Nav & Title */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                sfx('chip');
                onBack();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lobby</span>
            </button>
            <span className="text-zinc-800">|</span>
            <div className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-amber-400" />
              <span className="font-semibold tracking-tight text-xs sm:text-sm text-zinc-50">
                Mind Heist
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md border border-zinc-800 bg-[#111113] font-mono text-[10px] font-semibold text-amber-400 tabular-nums">
              R{String(state.round).padStart(2, '0')}
            </span>
            {roomCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-zinc-800 bg-[#111113] hover:border-zinc-700 font-mono text-[10px] font-semibold text-zinc-200 transition-colors cursor-pointer"
                title="Copy Room Code"
              >
                {roomCode}
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
              </button>
            )}
          </div>

          {/* Center: Dual Sanity HUD Bars */}
          {me && opp && (
            <div className="flex items-center gap-3 sm:gap-5 order-3 lg:order-2 w-full lg:w-auto justify-center">
              {/* YOU */}
              <div className="flex items-center gap-2 flex-1 lg:flex-initial lg:w-52">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
                    <span className="text-amber-300 font-semibold truncate flex items-center gap-1">
                      {me.nickname}
                      {me.readStreak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                          <Flame className="w-2.5 h-2.5 text-amber-400" />
                          {me.readStreak}×
                        </span>
                      )}
                      {me.paranoiaActive && (
                        <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          GLITCH
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-zinc-100 tabular-nums shrink-0">
                      {me.sanity}/{me.maxSanity}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-amber-400"
                      initial={false}
                      animate={{ width: `${Math.max(0, (me.sanity / me.maxSanity) * 100)}%` }}
                      transition={{ duration: 0.55 }}
                    />
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono font-semibold text-zinc-500 tracking-widest">VS</span>

              {/* RIVAL */}
              <div className="flex items-center gap-2 flex-1 lg:flex-initial lg:w-52">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
                    <span className="font-mono text-zinc-100 tabular-nums shrink-0">
                      {opp.sanity}/{opp.maxSanity}
                    </span>
                    <span className="text-rose-400 font-semibold truncate flex items-center gap-1">
                      {opp.paranoiaActive && (
                        <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          GLITCHED
                        </span>
                      )}
                      {opp.readStreak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <Flame className="w-2.5 h-2.5 text-amber-400" />
                          {opp.readStreak}×
                        </span>
                      )}
                      {opp.nickname}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-rose-500 ml-auto"
                      initial={false}
                      animate={{ width: `${Math.max(0, (opp.sanity / opp.maxSanity) * 100)}%` }}
                      transition={{ duration: 0.55 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right: Utility Buttons */}
          <div className="flex items-center gap-1.5 order-2 lg:order-3">
            {state.history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sfx('chip');
                  setShowHistory(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-[#111113] hover:bg-zinc-900 text-[10px] font-mono uppercase tracking-wider text-zinc-300 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Log ({state.history.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sfx('chip');
                setShowCodex(true);
              }}
              className="p-1.5 rounded-lg border border-zinc-800 bg-[#111113] hover:bg-zinc-900 text-amber-400 transition-colors cursor-pointer"
              title="Tactical Codex"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="p-1.5 rounded-lg border border-zinc-800 bg-[#111113] hover:bg-zinc-900 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-zinc-200" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-3 sm:px-5 py-2.5 flex flex-col justify-center">
        {/* ================= ROOM FULL FALLBACK ================= */}
        {state.status !== 'waiting' && meIdx === -1 && (
          <div className="max-w-md w-full mx-auto bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
            <Lock className="w-8 h-8 text-rose-400 mx-auto" />
            <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
              Astral Vault Occupied
            </h1>
            <p className="text-xs text-zinc-400">
              This 1v1 Mind Heist duel already has two active intruders locked in combat.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Return to Mind Heist Lobby
            </button>
          </div>
        )}

        {/* ================= WAITING ROOM ================= */}
        {state.status === 'waiting' && (
          <div className="max-w-lg w-full mx-auto bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center space-y-5">
            <div className="w-44 mx-auto">
              <AstralMindVaultSvg
                mode="waiting"
                plan={plan}
                paranoiaActive={false}
                locked={false}
                myBreakdown={null}
                oppBreakdown={null}
              />
            </div>

            {meIdx === -1 && onJoinRoom ? (
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
                  Infiltrate Mind Heist
                </h1>
                <p className="text-xs text-zinc-400">
                  Enter your Phantom Callsign to breach Room{' '}
                  <span className="font-mono text-amber-400 font-semibold">{roomCode}</span>.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const clean = joinName.trim() || `Phantom-${Math.floor(100 + Math.random() * 900)}`;
                    onJoinRoom(clean);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    maxLength={18}
                    placeholder="Your Callsign"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-400 focus:outline-none text-sm font-medium text-zinc-100 placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2.5 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Enter
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  Awaiting Rival Intruder
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
                  Share Your Vault Frequency
                </h1>
                {roomCode && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="w-full py-4 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 hover:border-amber-400/60 flex items-center justify-center gap-3 transition-colors cursor-pointer group"
                  >
                    <span className="font-mono text-3xl font-bold tracking-[0.28em] text-amber-400">
                      {roomCode}
                    </span>
                    {copied ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-zinc-400 group-hover:text-zinc-100" />
                    )}
                  </button>
                )}
                <p className="text-xs font-mono text-zinc-500">
                  Max Sanity: <span className="text-amber-300 font-semibold">{state.maxSanity} HP</span> · 3 Random Astral Relics Dealt on Entry
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= PLANNING STAGE ================= */}
        {state.status === 'planning' && me && opp && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[325px_1fr_340px] gap-3 items-stretch">
            {/* LEFT COLUMN: DEFENSE MATRIX */}
            <section className="rounded-2xl bg-[#111113] border border-zinc-800 p-3.5 flex flex-col justify-between gap-2.5 min-h-0 overflow-y-auto">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-100">
                      Defense Matrix
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-amber-400 tabular-nums">
                    {spentEnergy}/{NEURAL_ENERGY} ENERGY
                  </span>
                </div>

                {/* Paranoia Glitch Telemetry Alert */}
                {isParanoia && (
                  <motion.div
                    animate={{ opacity: [0.75, 1, 0.75] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center gap-2 text-[10px] font-mono font-semibold text-rose-300 uppercase tracking-wider"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>PARANOIA GLITCH: Chamber telemetry destabilized!</span>
                  </motion.div>
                )}

                {/* 3 One-Click Tactical Presets */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">
                    Tactical Presets
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TACTICAL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={me.locked || busy}
                        onClick={() => applyPreset(preset)}
                        className="px-2 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-left transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <div className="text-[10px] font-semibold text-zinc-100 leading-tight">{preset.name}</div>
                        <div className="text-[8.5px] text-zinc-500 leading-tight mt-0.5 truncate">
                          {preset.tagline}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Neural Energy Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
                    <span className="text-zinc-400">
                      Shields: <strong className="text-amber-300">{totalShields}</strong> · Strike:{' '}
                      <strong className="text-rose-400">{plan.strikePower}</strong>
                    </span>
                    {unspentEnergy > 0 && (
                      <span className="text-amber-400 font-semibold">+{unspentEnergy} Free</span>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    {Array.from({ length: NEURAL_ENERGY }).map((_, idx) => {
                      const isShieldPip = idx < totalShields;
                      const isStrikePip = idx >= totalShields && idx < spentEnergy;
                      return (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-sm transition-colors ${
                            isShieldPip
                              ? 'bg-amber-400'
                              : isStrikePip
                              ? 'bg-rose-500'
                              : 'bg-zinc-800'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 3 Chamber Shield & Trap Allocators */}
                <div className="space-y-2">
                  {CHAMBERS.map((chamber) => {
                    const meta = CHAMBER_META[chamber];
                    const strokeMeta = VAULT_CHAMBER_STROKE[chamber];
                    const sh = plan.shields[chamber];
                    const hasTrap = plan.trapChamber === chamber;
                    return (
                      <div
                        key={chamber}
                        className={`rounded-xl p-2.5 border transition-colors ${
                          hasTrap
                            ? 'bg-rose-500/[0.06] border-rose-500/45'
                            : 'bg-zinc-950 border-zinc-800/90'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-semibold text-xs border ${strokeMeta.badgeBg} ${strokeMeta.badgeBorder} ${strokeMeta.text}`}
                            >
                              {meta.greek}
                            </span>
                            <div className="min-w-0">
                              <div
                                className={`text-xs font-semibold tracking-wider ${strokeMeta.text} ${
                                  isParanoia ? 'animate-pulse' : ''
                                }`}
                              >
                                {isParanoia ? meta.glitchLabel : meta.label}
                              </div>
                              <div className="text-[9.5px] text-zinc-500 truncate">
                                {isParanoia ? 'ERR::MEM_CORRUPT' : meta.codename}
                              </div>
                            </div>
                          </div>

                          {/* Plant Phantom Trap Toggle */}
                          <button
                            type="button"
                            disabled={me.locked || busy}
                            onClick={() => {
                              sfx('card_pick');
                              setPlan((prev) => ({ ...prev, trapChamber: chamber }));
                            }}
                            className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1 border transition-colors cursor-pointer disabled:opacity-40 ${
                              hasTrap
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-rose-300 hover:border-rose-500/40'
                            }`}
                          >
                            <Skull className="w-3 h-3" />
                            {hasTrap ? 'Trap Armed' : 'Plant Trap'}
                          </button>
                        </div>

                        {/* Shield +/- controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={me.locked || busy || sh <= 0}
                            onClick={() => adjustShield(chamber, -1)}
                            className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-200 disabled:opacity-30 cursor-pointer transition-colors"
                            aria-label={`Decrease ${chamber} shield`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1">
                            <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                              <div
                                className="h-full transition-all duration-200 rounded-full"
                                style={{
                                  width: `${(sh / MAX_CHAMBER_SHIELD) * 100}%`,
                                  backgroundColor: strokeMeta.hex,
                                }}
                              />
                            </div>
                          </div>
                          <span className="w-12 text-center font-mono text-xs font-semibold text-zinc-100 tabular-nums">
                            SH {sh}
                          </span>
                          <button
                            type="button"
                            disabled={
                              me.locked ||
                              busy ||
                              sh >= MAX_CHAMBER_SHIELD ||
                              (unspentEnergy <= 0 && plan.strikePower <= 0)
                            }
                            onClick={() => adjustShield(chamber, 1)}
                            className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-200 disabled:opacity-30 cursor-pointer transition-colors"
                            aria-label={`Increase ${chamber} shield`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subtle Defense Tip */}
              <div className="text-[10px] text-zinc-400 bg-zinc-950 border border-zinc-800/80 rounded-xl px-2.5 py-2 leading-snug">
                <strong className="text-rose-400 font-semibold">Phantom Trap:</strong> Un-read attackers deal half Strike &amp; suffer{' '}
                <strong className="text-zinc-100">14 Recoil</strong>.
              </div>
            </section>

            {/* CENTER COLUMN: ANIMATED 3-RING ASTRAL MIND VAULT + LOCK CONTROL */}
            <section className="rounded-2xl bg-[#111113] border border-zinc-800 p-3.5 flex flex-col items-center justify-between gap-2 relative overflow-hidden">
              {/* Top Telemetry Pill */}
              <div className="w-full flex items-center justify-between gap-2 text-[10px]">
                <span className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 font-mono text-zinc-400">
                  CLICK AN ORB TO TARGET
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md font-mono font-semibold uppercase tracking-wider border ${
                    opp.locked
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 animate-pulse'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  }`}
                >
                  {isSolo
                    ? isBotThinking
                      ? 'PHANTOM-AI CALCULATING…'
                      : 'PHANTOM-AI WATCHING'
                    : opp.locked
                    ? `${opp.nickname} LOCKED IN`
                    : `${opp.nickname} THINKING…`}
                </span>
              </div>

              {/* Rotating 3-Ring Astral Mind Vault SVG */}
              <div className="flex-1 flex items-center justify-center w-full min-h-[240px]">
                <AstralMindVaultSvg
                  mode="planning"
                  plan={plan}
                  paranoiaActive={isParanoia}
                  locked={me.locked}
                  myBreakdown={null}
                  oppBreakdown={null}
                  onSelectTarget={(ch) => {
                    sfx('card_pick');
                    setPlan((prev) => ({ ...prev, targetChamber: ch }));
                  }}
                />
              </div>

              {/* Live Strike Readout & Lock Button */}
              <div className="w-full max-w-md space-y-2">
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px]">
                  <span className="text-zinc-400">
                    Targeting{' '}
                    <strong className={VAULT_CHAMBER_STROKE[plan.targetChamber].text}>
                      {plan.targetChamber}
                    </strong>{' '}
                    · Call{' '}
                    <strong className="text-indigo-300">{plan.mindReadCall}</strong>
                  </span>
                  <span className="font-mono font-semibold text-amber-400 tabular-nums">
                    MAX {previewMaxDmg} DMG
                    {plan.relic === 'time_freeze' ? ' (SH→0)' : ''}
                  </span>
                </div>

                {me.locked ? (
                  <div className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 font-semibold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 animate-pulse text-amber-400" />
                    {isSolo ? 'Resolving Astral Clash…' : `Locked In — Waiting for ${opp.nickname}…`}
                  </div>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={busy}
                    onClick={handleConfirmLock}
                    className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold tracking-wide text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Swords className="w-4 h-4" />
                    Lock Neural Breach
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </section>

            {/* RIGHT COLUMN: OFFENSE, MIND-READ CALL & TAROT RELICS */}
            <section className="rounded-2xl bg-[#111113] border border-zinc-800 p-3.5 flex flex-col justify-between gap-2.5 min-h-0 overflow-y-auto">
              {/* Target & Strike Power */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-rose-400" />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-100">
                      Offense &amp; Breach
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 font-semibold tabular-nums">
                    {plan.relic === 'overdrive' ? `${plan.strikePower}×2 = ${previewStrike}` : `${plan.strikePower} PWR`}
                  </span>
                </div>

                {/* Target Chamber Pills */}
                <div className="grid grid-cols-3 gap-1.5">
                  {CHAMBERS.map((ch) => {
                    const active = plan.targetChamber === ch;
                    const meta = CHAMBER_META[ch];
                    const strokeMeta = VAULT_CHAMBER_STROKE[ch];
                    return (
                      <button
                        key={ch}
                        type="button"
                        disabled={me.locked || busy}
                        onClick={() => {
                          sfx('card_pick');
                          setPlan((prev) => ({ ...prev, targetChamber: ch }));
                        }}
                        className={`py-2 rounded-xl border text-xs font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 ${
                          active
                            ? 'bg-amber-500/12 border-amber-400/70 text-zinc-50'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
                        }`}
                      >
                        <span className={strokeMeta.text}>{meta.greek}</span> {ch}
                      </button>
                    );
                  })}
                </div>

                {/* Strike Power Stepper */}
                <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Strike Power
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={me.locked || busy || plan.strikePower <= 0}
                      onClick={() => adjustStrike(-1)}
                      className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-100 disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono text-base font-bold text-rose-400 tabular-nums">
                      {plan.strikePower}
                    </span>
                    <button
                      type="button"
                      disabled={me.locked || busy || plan.strikePower >= NEURAL_ENERGY}
                      onClick={() => adjustStrike(1)}
                      className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-100 disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mind-Read Call */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-zinc-100">
                      Mind-Read Call
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-indigo-300 tabular-nums">
                    +{nextCounterReadDmg} PSYCHIC
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Where did <strong className="text-zinc-200">{opp.nickname}</strong> hide their Phantom Trap?
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {CHAMBERS.map((ch) => {
                    const active = plan.mindReadCall === ch;
                    return (
                      <button
                        key={ch}
                        type="button"
                        disabled={me.locked || busy}
                        onClick={() => {
                          sfx('chip');
                          setPlan((prev) => ({ ...prev, mindReadCall: ch }));
                        }}
                        className={`py-2 rounded-xl border text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 ${
                          active
                            ? 'bg-indigo-500/15 border-indigo-400/70 text-zinc-50'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Astral Relics */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-zinc-100">
                      Astral Relics
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                    Rival: {opp.relics.length - opp.usedRelics.length}/{opp.relics.length} left
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {me.relics.map((relicId) => {
                    const def = RELIC_DEFS[relicId];
                    const spent = me.usedRelics.includes(relicId);
                    const armed = plan.relic === relicId && !spent;
                    return (
                      <motion.button
                        key={relicId}
                        type="button"
                        whileHover={!spent && !me.locked ? { scale: 1.01 } : undefined}
                        whileTap={!spent && !me.locked ? { scale: 0.99 } : undefined}
                        disabled={spent || me.locked || busy}
                        onClick={() => toggleRelic(relicId)}
                        className={`relative overflow-hidden text-left p-2.5 rounded-xl border transition-colors ${
                          spent
                            ? 'bg-zinc-950/60 border-zinc-900 opacity-40 cursor-not-allowed'
                            : armed
                            ? 'bg-amber-500/[0.08] border-amber-400/75 cursor-pointer'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 cursor-pointer'
                        }`}
                      >
                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg bg-[#111113] border flex items-center justify-center shrink-0 ${
                                armed ? 'border-amber-400/70 text-amber-400' : 'border-zinc-800 text-zinc-300'
                              }`}
                            >
                              <RelicIcon relic={relicId} className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8.5px] font-mono tracking-widest text-amber-400/80">
                                  {def.arcana}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-zinc-100 leading-tight">
                                {def.name}
                              </div>
                              <div className="text-[10px] text-zinc-400 leading-tight truncate">
                                {def.shortEffect}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-mono font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0 border ${
                              spent
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-600'
                                : armed
                                ? 'bg-amber-400 text-zinc-950 border-amber-300'
                                : 'bg-[#111113] border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {spent ? 'SPENT' : armed ? 'ARMED' : '1-USE'}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= DRAMATIC CLASH REVEAL STAGE ================= */}
        {state.status === 'reveal' && me && opp && latestLog && myBreakdown && oppBreakdown && (
          <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 py-1">
            {/* Headline Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="text-center px-4 py-2.5 rounded-2xl bg-[#111113] border border-zinc-800"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-400">
                ROUND {latestLog.round} CLASH RESOLUTION
              </div>
              <h2 className="text-base sm:text-xl font-semibold tracking-tight text-zinc-50 mt-0.5">
                {latestLog.headline}
              </h2>
            </motion.div>

            {/* Center 3-Column Clash Visualization */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_320px_1fr] gap-3 items-center overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
              >
                <ClashBreakdownCard
                  title={me.nickname}
                  accent="gold"
                  breakdown={myBreakdown}
                  defenderShields={oppBreakdown.plan.shields}
                  defenderTrap={oppBreakdown.plan.trapChamber}
                  isMe
                />
              </motion.div>

              <div className="flex flex-col items-center justify-center">
                <AstralMindVaultSvg
                  mode="reveal"
                  plan={myBreakdown.plan}
                  paranoiaActive={false}
                  locked={false}
                  myBreakdown={myBreakdown}
                  oppBreakdown={oppBreakdown}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
              >
                <ClashBreakdownCard
                  title={opp.nickname}
                  accent="crimson"
                  breakdown={oppBreakdown}
                  defenderShields={myBreakdown.plan.shields}
                  defenderTrap={myBreakdown.plan.trapChamber}
                  isMe={false}
                />
              </motion.div>
            </div>

            {/* Next Round Sync Footer */}
            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-[#111113] border border-zinc-800">
              <div className="text-xs text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {me.paranoiaActive
                    ? 'WARNING: Rival inflicted PARANOIA GLITCH on you for next round!'
                    : opp.paranoiaActive
                    ? `Your PARANOIA GLITCH is distorting ${opp.nickname}’s telemetry next round!`
                    : `Sanity Standing: ${me.nickname} (${me.sanity}) vs ${opp.nickname} (${opp.sanity})`}
                </span>
              </div>

              {me.nextReady && !isSolo ? (
                <div className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Synced — Waiting for {opp.nickname}…
                </div>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={busy}
                  onClick={() => {
                    sfx('deal');
                    onNextRound();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Next Round (R{state.round + 1})
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* ================= VICTORY / DEFEAT VERDICT ================= */}
        {state.status === 'finished' && me && opp && latestLog && myBreakdown && oppBreakdown && (
          <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 py-1 overflow-y-auto">
            {/* Verdict Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl p-5 border text-center relative overflow-hidden bg-[#111113] ${
                state.winnerIdx === meIdx
                  ? 'border-amber-400/50'
                  : state.winnerIdx === -1
                  ? 'border-indigo-400/50'
                  : 'border-rose-500/50'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] font-mono uppercase tracking-[0.22em] text-amber-400 mb-2">
                {state.winnerIdx === meIdx ? (
                  <>
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> HEIST COMPLETE
                  </>
                ) : state.winnerIdx === -1 ? (
                  <>
                    <Brain className="w-3.5 h-3.5 text-indigo-400" /> NEURAL SINGULARITY
                  </>
                ) : (
                  <>
                    <Skull className="w-3.5 h-3.5 text-rose-400" /> MIND SHATTERED
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
                {state.winnerIdx === meIdx
                  ? `Victory — ${opp.nickname}’s Vault Collapsed`
                  : state.winnerIdx === -1
                  ? 'Mutual Collapse — Double Knockout'
                  : `Defeat — ${opp.nickname} Breached Your Mind`}
              </h1>

              <p className="text-xs font-mono text-zinc-400 mt-1.5">
                Decided on Round {latestLog.round} · Final Sanity: <strong className="text-amber-300">{me.sanity}</strong> vs{' '}
                <strong className="text-rose-400">{opp.sanity}</strong> · Relics Spent:{' '}
                <strong className="text-indigo-300">{me.usedRelics.length}/3</strong>
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    sfx('deal');
                    onRematch();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Run Rematch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx('chip');
                    onBack();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-medium text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Return to Lobby
                </button>
              </div>
            </motion.div>

            {/* Final Round Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <ClashBreakdownCard
                title={me.nickname}
                accent="gold"
                breakdown={myBreakdown}
                defenderShields={oppBreakdown.plan.shields}
                defenderTrap={oppBreakdown.plan.trapChamber}
                isMe
              />
              <ClashBreakdownCard
                title={opp.nickname}
                accent="crimson"
                breakdown={oppBreakdown}
                defenderShields={myBreakdown.plan.shields}
                defenderTrap={myBreakdown.plan.trapChamber}
                isMe={false}
              />
            </div>
          </div>
        )}
      </main>

      {/* ================= TACTICAL CODEX MODAL ================= */}
      <AnimatePresence>
        {showCodex && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCodex(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full max-h-[85dvh] overflow-y-auto rounded-2xl bg-[#111113] border border-zinc-800 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50">
                    Mind Heist — Tactical Codex
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodex(false)}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="font-mono font-semibold text-amber-400 uppercase text-[11px]">1. Allocate 12 Energy</div>
                  <p>
                    Split 12 Neural Energy across 3 Chamber Shields (ALPHA, BETA, OMEGA, max 10 each) and your Strike Power.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="font-mono font-semibold text-rose-400 uppercase text-[11px]">2. Breach Formula</div>
                  <p>
                    If <strong>Strike &gt; Rival Shield</strong> on the targeted chamber, you deal{' '}
                    <code className="text-amber-300">(Strike − Shield) × 4 + 8</code> damage!
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="font-mono font-semibold text-rose-400 uppercase text-[11px]">3. Phantom Trap Ambush</div>
                  <p>
                    Attacking your rival’s trapped chamber (without calling it) <strong>halves your Strike</strong> and deals{' '}
                    <strong>14 Trap Recoil</strong> to you!
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="font-mono font-semibold text-indigo-400 uppercase text-[11px]">4. Psychic Counter-Read</div>
                  <p>
                    Correctly calling your rival’s Trap shatters it, deals <strong>+14 Bonus Damage</strong>, and builds a{' '}
                    <strong>+4/streak</strong> Read Combo!
                  </p>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400 mb-2">
                  The 6 Astral Relics (3 Random Dealt · 1-Use Each)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(RELIC_DEFS) as RelicId[]).map((id) => {
                    const r = RELIC_DEFS[id];
                    return (
                      <div key={id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
                          <RelicIcon relic={id} className="w-3.5 h-3.5 text-amber-400" />
                          {r.name}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{r.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= ROUND HISTORY MODAL ================= */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-xl w-full max-h-[82dvh] overflow-y-auto rounded-2xl bg-[#111113] border border-zinc-800 p-5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50">
                    Neural Clash Log
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {[...state.history].reverse().map((entry) => {
                  const mine = meIdx === 0 ? entry.p0 : entry.p1;
                  const theirs = meIdx === 0 ? entry.p1 : entry.p0;
                  return (
                    <div
                      key={entry.round}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
                        <span className="text-amber-400 font-semibold">ROUND {entry.round}</span>
                        <span className="text-zinc-400">
                          HP: {meIdx === 0 ? entry.p0SanityAfter : entry.p1SanityAfter} vs{' '}
                          {meIdx === 0 ? entry.p1SanityAfter : entry.p0SanityAfter}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-zinc-100">{entry.headline}</div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
                        <div>
                          You → {mine.hitChamber} ({mine.totalDamageDealt} dmg
                          {mine.counterReadHit ? ', READ!' : ''}
                          {mine.ambushed ? ', AMBUSHED' : ''})
                        </div>
                        <div>
                          Rival → {theirs.hitChamber} ({theirs.totalDamageDealt} dmg
                          {theirs.counterReadHit ? ', READ!' : ''}
                          {theirs.ambushed ? ', AMBUSHED' : ''})
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
