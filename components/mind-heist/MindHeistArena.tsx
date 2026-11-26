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
    hex: '#e5484d',
    text: 'text-[#f06b70]',
    badgeBg: 'bg-[#e5484d]/12',
    badgeBorder: 'border-[#e5484d]/45',
  },
  BETA: {
    hex: '#8b7cf6',
    text: 'text-[#b4a7ff]',
    badgeBg: 'bg-[#7c6ae8]/14',
    badgeBorder: 'border-[#8b7cf6]/45',
  },
  OMEGA: {
    hex: '#e6c27a',
    text: 'text-[#e6c27a]',
    badgeBg: 'bg-[#e6c27a]/12',
    badgeBorder: 'border-[#e6c27a]/45',
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
            <stop offset="0%" stopColor="#e6c27a" stopOpacity="0.34" />
            <stop offset="48%" stopColor="#8b7cf6" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#0c0b0e" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mhRingGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3d89b" />
            <stop offset="48%" stopColor="#e5484d" />
            <stop offset="100%" stopColor="#8b7cf6" />
          </linearGradient>
          <linearGradient id="mhRingSlate" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b7cf6" />
            <stop offset="50%" stopColor="#e6c27a" />
            <stop offset="100%" stopColor="#e5484d" />
          </linearGradient>
          <filter id="mhVaultEdge" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle Velvet Dial Backing Halo */}
        <circle cx="210" cy="210" r="190" fill="#14101c" fillOpacity="0.48" stroke="#e6c27a" strokeOpacity="0.12" strokeWidth="1" />

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
            strokeWidth="1.6"
            strokeOpacity="0.72"
            strokeDasharray="18 10 4 10"
          />
          <circle
            cx="210"
            cy="210"
            r="174"
            fill="none"
            stroke="#e6c27a"
            strokeWidth="0.9"
            strokeOpacity="0.32"
            strokeDasharray="2 8"
          />
          {Array.from({ length: 12 }).map((_, idx) => {
            const angle = (idx * 30 * Math.PI) / 180;
            const x1 = 210 + Math.cos(angle) * 175;
            const y1 = 210 + Math.sin(angle) * 175;
            const x2 = 210 + Math.cos(angle) * 189;
            const y2 = 210 + Math.sin(angle) * 189;
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={idx % 3 === 0 ? '#e6c27a' : '#7b6f63'}
                strokeWidth={idx % 3 === 0 ? '2.2' : '1.1'}
                strokeOpacity={idx % 3 === 0 ? '0.9' : '0.6'}
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
            strokeWidth="1.7"
            strokeOpacity="0.65"
            strokeDasharray="46 16 12 16"
          />
          {/* Hexagram / Astral Diamond Shards */}
          <polygon
            points="210,74 328,282 92,282"
            fill="none"
            stroke="#e6c27a"
            strokeOpacity="0.28"
            strokeWidth="1.1"
          />
          <polygon
            points="210,346 92,138 328,138"
            fill="none"
            stroke="#e5484d"
            strokeOpacity="0.25"
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
            stroke="#e6c27a"
            strokeWidth="1.5"
            strokeOpacity="0.6"
            strokeDasharray="8 6"
          />
          <circle
            cx="210"
            cy="210"
            r="58"
            fill="none"
            stroke="#8b7cf6"
            strokeWidth="1.2"
            strokeOpacity="0.48"
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
            stroke="#e5484d"
            strokeWidth="1.8"
            strokeDasharray="14 24"
            animate={{ opacity: [0.15, 0.78, 0.1, 0.6], rotate: [0, 8, -6, 0] }}
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
              stroke="#e6c27a"
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
              stroke="#e5484d"
              strokeWidth="1.8"
              initial={{ r: 24, opacity: 0.8 }}
              animate={{ r: 185, opacity: 0 }}
              transition={{ duration: 1.4, delay: 0.45, repeat: Infinity, ease: 'easeOut' }}
            />
          </>
        )}

        {/* Neural Energy Conduit Lines between Chambers */}
        <line x1="210" y1="74" x2="92" y2="282" stroke="#e6c27a" strokeOpacity="0.22" strokeWidth="1.2" />
        <line x1="92" y1="282" x2="328" y2="282" stroke="#e6c27a" strokeOpacity="0.22" strokeWidth="1.2" />
        <line x1="328" y1="282" x2="210" y2="74" stroke="#e6c27a" strokeOpacity="0.22" strokeWidth="1.2" />

        {/* Active Targeting Laser in Planning Mode */}
        {mode === 'planning' && (
          <motion.line
            x1="210"
            y1="210"
            x2={CHAMBER_META[plan.targetChamber].svgX}
            y2={CHAMBER_META[plan.targetChamber].svgY}
            stroke="#e5484d"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="10 6"
            filter="url(#mhVaultEdge)"
            animate={{ strokeDashoffset: [0, -32], opacity: [0.68, 1, 0.68] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Clash Reveal Laser Breach Arcs */}
        {isClash && myBreakdown && (
          <motion.path
            d={`M 210 210 Q ${(210 + myHitMeta.svgX) / 2 + 24} ${(210 + myHitMeta.svgY) / 2 - 22} ${myHitMeta.svgX} ${myHitMeta.svgY}`}
            fill="none"
            stroke={myBreakdown.breached ? '#e6c27a' : '#7b6f63'}
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
            stroke={oppBreakdown.breached ? '#e5484d' : '#5f564d'}
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
        <circle cx="210" cy="210" r="48" fill="url(#mhCoreGlow)" />
        <motion.circle
          cx="210"
          cy="210"
          r="35"
          fill="#15111c"
          stroke={isClash ? '#e6c27a' : locked ? '#8b7cf6' : '#e5484d'}
          strokeWidth="2.3"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="210" cy="210" r="29" fill="none" stroke="#e6c27a" strokeOpacity="0.22" strokeWidth="0.9" />
        <text
          x="210"
          y="204"
          textAnchor="middle"
          fill="#e6c27a"
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
          fill="#faf5eb"
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
                  stroke={myHitHere ? '#e6c27a' : '#e5484d'}
                  strokeWidth="1.9"
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
                fill="#16121e"
                stroke={isTarget || myHitHere ? '#e6c27a' : strokeMeta.hex}
                strokeWidth={isTarget || myHitHere ? '2.6' : '1.9'}
              />

              {/* Inner subtle ring */}
              <circle
                cx={meta.svgX}
                cy={meta.svgY}
                r="26"
                fill={strokeMeta.hex}
                fillOpacity={isTarget ? '0.18' : '0.09'}
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
                fill="#faf5eb"
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
                  <rect width="26" height="15" rx="4" fill="#b91c2c" stroke="#fda4af" strokeWidth="0.8" />
                  <text x="13" y="10.5" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="800">
                    TRAP
                  </text>
                </g>
              )}

              {/* Mind-Read Badge (top-right of orb in planning) */}
              {isRead && (
                <g transform={`translate(${meta.svgX + 6}, ${meta.svgY - 26})`}>
                  <rect width="28" height="15" rx="4" fill="#5b46c4" stroke="#d8d0ff" strokeWidth="0.8" />
                  <text x="14" y="10.5" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="800">
                    READ
                  </text>
                </g>
              )}

              {/* Target Tag (bottom of orb in planning) */}
              {isTarget && (
                <g transform={`translate(${meta.svgX - 26}, ${meta.svgY + 25})`}>
                  <rect width="52" height="15" rx="4" fill="#e6c27a" />
                  <text x="26" y="10.5" textAnchor="middle" fill="#140f08" fontSize="7.5" fontWeight="800">
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
                    fill={myCounterHere ? '#059669' : '#b91c2c'}
                    stroke="#faf5eb"
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
  const borderColor = accent === 'gold' ? 'border-[#e6c27a]/38' : 'border-[#e5484d]/40';
  const badgeBg =
    accent === 'gold'
      ? 'bg-[#e6c27a]/12 text-[#e6c27a] border-[#e6c27a]/35'
      : 'bg-[#e5484d]/12 text-[#f79da0] border-[#e5484d]/35';

  return (
    <div
      className={`atelier-card hover:transform-none rounded-2xl bg-gradient-to-b from-[#191521] to-[#110e16] border ${borderColor} p-3.5 flex flex-col gap-2.5`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeBg}`}>
            {isMe ? 'YOUR ASSAULT' : 'RIVAL ASSAULT'}
          </span>
          <span className="font-display text-xs font-semibold text-[#faf5eb] truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-bold font-mono text-[#e6c27a] tabular-nums">
            {breakdown.totalDamageDealt} DMG
          </span>
          <span
            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded tabular-nums ${
              breakdown.netSanityChange >= 0
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-[#e5484d]/15 text-[#f79da0] border border-[#e5484d]/30'
            }`}
          >
            {breakdown.netSanityChange >= 0 ? `+${breakdown.netSanityChange}` : breakdown.netSanityChange} HP
          </span>
        </div>
      </div>

      {/* Tactical Grid */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
        <div className="rounded-xl bg-[#0c0a10] border border-[#e6c27a]/14 p-2">
          <div className="text-[#8e8374] uppercase font-mono tracking-wider">Target</div>
          <div className={`font-semibold text-xs mt-0.5 ${VAULT_CHAMBER_STROKE[breakdown.hitChamber].text}`}>
            {breakdown.hitChamber}
            {breakdown.mirageSplashUsed && <span className="text-[9px] text-[#b4a7ff] ml-1">(SPLASH)</span>}
          </div>
          <div className="text-[10px] font-mono text-[#b5aa99] mt-0.5 tabular-nums">
            STR {breakdown.effectiveStrike} vs SH {breakdown.effectiveShield}
          </div>
        </div>

        <div className="rounded-xl bg-[#0c0a10] border border-[#e6c27a]/14 p-2">
          <div className="text-[#8e8374] uppercase font-mono tracking-wider">Mind-Read</div>
          <div className="font-semibold text-xs mt-0.5 text-[#b4a7ff]">{breakdown.plan.mindReadCall}</div>
          <div
            className={`text-[10px] font-mono font-semibold mt-0.5 ${
              breakdown.counterReadHit ? 'text-emerald-400' : 'text-[#8e8374]'
            }`}
          >
            {breakdown.counterReadHit ? `✓ READ! +${breakdown.counterReadDamage}` : `✗ Trap: ${defenderTrap}`}
          </div>
        </div>

        <div className="rounded-xl bg-[#0c0a10] border border-[#e6c27a]/14 p-2">
          <div className="text-[#8e8374] uppercase font-mono tracking-wider">Shield Split</div>
          <div className="font-mono text-[11px] font-semibold text-[#faf5eb] mt-0.5 tabular-nums">
            {breakdown.plan.shields.ALPHA}/{breakdown.plan.shields.BETA}/{breakdown.plan.shields.OMEGA}
          </div>
          <div className="text-[10px] text-[#f06b70] font-medium mt-0.5">
            Trap: {breakdown.plan.trapChamber}
          </div>
        </div>
      </div>

      {/* Armed Relic Banner */}
      {breakdown.armedRelic && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#0c0a10] border border-[#e6c27a]/35">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#faf5eb]">
            <RelicIcon relic={breakdown.armedRelic} className="w-3.5 h-3.5 text-[#e6c27a]" />
            <span>{RELIC_DEFS[breakdown.armedRelic].name}</span>
          </div>
          <span className="text-[10px] font-mono text-[#e6c27a]">
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
                  ? 'bg-[#e5484d]/12 border-[#e5484d]/40 text-[#f79da0]'
                  : isGood
                  ? 'bg-[#e6c27a]/12 border-[#e6c27a]/40 text-[#e6c27a]'
                  : 'bg-[#8b7cf6]/14 border-[#8b7cf6]/40 text-[#c4b5fd]'
              }`}
            >
              {tag}
            </span>
          );
        })}
      </div>

      {/* Defender Shield Reference */}
      <div className="text-[10px] font-mono text-[#8e8374] flex items-center justify-between border-t border-[#e6c27a]/14 pt-1.5 tabular-nums">
        <span>
          Target Shields: A:{defenderShields.ALPHA} · B:{defenderShields.BETA} · O:{defenderShields.OMEGA}
        </span>
        {breakdown.trapRecoilTaken > 0 && (
          <span className="text-[#f06b70] font-semibold">-{breakdown.trapRecoilTaken} TRAP RECOIL</span>
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
          colors: ['#e6c27a', '#e5484d', '#8b7cf6', '#10b981'],
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
      className="min-h-dvh lg:h-dvh lg:overflow-hidden atelier-bg bg-[#0c0b0e] text-[#f4efe6] flex flex-col relative selection:bg-[#e6c27a]/25"
    >
      {/* Warm Plum-Charcoal & Crimson Vault Atmospheric Stage Lighting */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 48%, rgba(230, 194, 122, 0.08), transparent 62%), radial-gradient(ellipse 52% 45% at 12% 18%, rgba(217, 56, 58, 0.12), transparent 62%), radial-gradient(ellipse 50% 45% at 88% 82%, rgba(111, 76, 209, 0.12), transparent 64%)',
        }}
      />

      {/* Clash Flash Burst */}
      <AnimatePresence>
        {flashBurst && (
          <motion.div
            initial={{ opacity: 0.34 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none fixed inset-0 z-50 bg-[#e6c27a]/25"
          />
        )}
      </AnimatePresence>

      {/* Top HUD Bar */}
      <header className="relative z-20 shrink-0 border-b border-[#e6c27a]/18 bg-[#0c0b0e]/92 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Nav & Title */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                sfx('chip');
                onBack();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-[#b5aa99] hover:text-[#faf5eb] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#e6c27a]" />
              <span className="hidden sm:inline">Lobby</span>
            </button>
            <span className="text-[#e6c27a]/25">|</span>
            <div className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-[#e6c27a]" />
              <span className="font-display font-semibold tracking-tight text-xs sm:text-sm text-[#faf5eb]">
                Mind Heist
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md border border-[#e6c27a]/30 bg-[#171320] font-mono text-[10px] font-semibold text-[#e6c27a] tabular-nums">
              R{String(state.round).padStart(2, '0')}
            </span>
            {roomCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#e6c27a]/25 bg-[#171320] hover:border-[#e6c27a]/55 font-mono text-[10px] font-semibold text-[#f4efe6] transition-colors cursor-pointer"
                title="Copy Room Code"
              >
                {roomCode}
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#e6c27a]" />}
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
                    <span className="text-[#e6c27a] font-semibold truncate flex items-center gap-1">
                      {me.nickname}
                      {me.readStreak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1 rounded bg-[#8b7cf6]/20 text-[#c4b5fd] border border-[#8b7cf6]/40">
                          <Flame className="w-2.5 h-2.5 text-[#e6c27a]" />
                          {me.readStreak}×
                        </span>
                      )}
                      {me.paranoiaActive && (
                        <span className="text-[9px] px-1 rounded bg-[#e5484d]/20 text-[#f79da0] border border-[#e5484d]/45 animate-pulse">
                          GLITCH
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[#faf5eb] tabular-nums shrink-0">
                      {me.sanity}/{me.maxSanity}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#15111c] border border-[#e6c27a]/20 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#c99b49] to-[#f1d596]"
                      initial={false}
                      animate={{ width: `${Math.max(0, (me.sanity / me.maxSanity) * 100)}%` }}
                      transition={{ duration: 0.55 }}
                    />
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono font-semibold text-[#e6c27a]/60 tracking-widest">VS</span>

              {/* RIVAL */}
              <div className="flex items-center gap-2 flex-1 lg:flex-initial lg:w-52">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
                    <span className="font-mono text-[#faf5eb] tabular-nums shrink-0">
                      {opp.sanity}/{opp.maxSanity}
                    </span>
                    <span className="text-[#f06b70] font-semibold truncate flex items-center gap-1">
                      {opp.paranoiaActive && (
                        <span className="text-[9px] px-1 rounded bg-[#e5484d]/20 text-[#f79da0] border border-[#e5484d]/45">
                          GLITCHED
                        </span>
                      )}
                      {opp.readStreak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1 rounded bg-[#e5484d]/15 text-[#f79da0] border border-[#e5484d]/35">
                          <Flame className="w-2.5 h-2.5 text-[#e6c27a]" />
                          {opp.readStreak}×
                        </span>
                      )}
                      {opp.nickname}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#15111c] border border-[#e5484d]/22 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-l from-[#c92a35] to-[#f06b70] ml-auto"
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#e6c27a]/20 bg-[#16121d] hover:border-[#e6c27a]/45 text-[10px] font-mono uppercase tracking-wider text-[#e4dac9] transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-[#b4a7ff]" />
                <span className="hidden sm:inline">Log ({state.history.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sfx('chip');
                setShowCodex(true);
              }}
              className="p-1.5 rounded-lg border border-[#e6c27a]/20 bg-[#16121d] hover:border-[#e6c27a]/45 text-[#e6c27a] transition-colors cursor-pointer"
              title="Tactical Codex"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="p-1.5 rounded-lg border border-[#e6c27a]/20 bg-[#16121d] hover:border-[#e6c27a]/45 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#f4efe6]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#6c6358]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-3 sm:px-5 py-2.5 flex flex-col justify-center">
        {/* ================= ROOM FULL FALLBACK ================= */}
        {state.status !== 'waiting' && meIdx === -1 && (
          <div className="atelier-card hover:transform-none max-w-md w-full mx-auto bg-gradient-to-b from-[#191521] to-[#110e16] border border-[#e6c27a]/25 rounded-2xl p-6 text-center space-y-4">
            <Lock className="w-8 h-8 text-[#f06b70] mx-auto" />
            <h1 className="font-display text-xl font-semibold tracking-tight text-[#faf5eb]">
              Astral Vault Occupied
            </h1>
            <p className="text-xs text-[#b5aa99]">
              This 1v1 Mind Heist duel already has two active intruders locked in combat.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="btn-brass w-full py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider cursor-pointer"
            >
              Return to Mind Heist Lobby
            </button>
          </div>
        )}

        {/* ================= WAITING ROOM ================= */}
        {state.status === 'waiting' && (
          <div className="atelier-card hover:transform-none max-w-lg w-full mx-auto bg-gradient-to-b from-[#191521] to-[#110e16] border border-[#e6c27a]/28 rounded-2xl p-6 text-center space-y-5 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-[#e6c27a]/12" />
            <div className="w-44 mx-auto relative z-10">
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
              <div className="space-y-3 relative z-10">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-[#faf5eb]">
                  Infiltrate <span className="font-serif italic font-normal text-[#e6c27a]">Mind Heist</span>
                </h1>
                <p className="text-xs text-[#b5aa99]">
                  Enter your Phantom Callsign to breach Room{' '}
                  <span className="font-mono text-[#e6c27a] font-semibold">{roomCode}</span>.
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0c0a10] border border-[#e6c27a]/22 focus:border-[#e6c27a]/70 focus:outline-none text-sm font-medium text-[#faf5eb] placeholder:text-[#665e53]"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-brass px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    Enter
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0c0a10] border border-[#e6c27a]/28 text-[#e4dac9] text-[10px] font-mono uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-[#e6c27a] animate-pulse" />
                  Awaiting Rival Intruder
                </div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-[#faf5eb]">
                  Share Your Vault Frequency
                </h1>
                {roomCode && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="w-full py-4 rounded-xl bg-[#0c0a10] border border-dashed border-[#e6c27a]/45 hover:border-[#e6c27a] flex items-center justify-center gap-3 transition-colors cursor-pointer group"
                  >
                    <span className="font-mono text-3xl font-bold tracking-[0.28em] text-[#e6c27a]">
                      {roomCode}
                    </span>
                    {copied ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-[#b5aa99] group-hover:text-[#faf5eb]" />
                    )}
                  </button>
                )}
                <p className="text-xs font-mono text-[#94897a]">
                  Max Sanity: <span className="text-[#e6c27a] font-semibold">{state.maxSanity} HP</span> · 3 Random Astral Relics Dealt on Entry
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= PLANNING STAGE ================= */}
        {state.status === 'planning' && me && opp && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[325px_1fr_340px] gap-3 items-stretch">
            {/* LEFT COLUMN: DEFENSE MATRIX */}
            <section className="atelier-card hover:transform-none rounded-2xl bg-gradient-to-b from-[#171320] to-[#110e17] border border-[#e6c27a]/18 p-3.5 flex flex-col justify-between gap-2.5 min-h-0 overflow-y-auto">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#e6c27a]" />
                    <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-[#faf5eb]">
                      Defense Matrix
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#0c0a10] border border-[#e6c27a]/28 text-[#e6c27a] tabular-nums">
                    {spentEnergy}/{NEURAL_ENERGY} ENERGY
                  </span>
                </div>

                {/* Paranoia Glitch Telemetry Alert */}
                {isParanoia && (
                  <motion.div
                    animate={{ opacity: [0.75, 1, 0.75] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#e5484d]/12 border border-[#e5484d]/45 flex items-center gap-2 text-[10px] font-mono font-semibold text-[#f79da0] uppercase tracking-wider"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#f06b70] shrink-0" />
                    <span>PARANOIA GLITCH: Chamber telemetry destabilized!</span>
                  </motion.div>
                )}

                {/* 3 One-Click Tactical Presets */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#94897a] mb-1.5">
                    Tactical Presets
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TACTICAL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={me.locked || busy}
                        onClick={() => applyPreset(preset)}
                        className="px-2 py-1.5 rounded-xl bg-[#0d0a12] border border-[#e6c27a]/18 hover:border-[#e6c27a]/50 text-left transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <div className="text-[10px] font-semibold text-[#faf5eb] leading-tight">{preset.name}</div>
                        <div className="text-[8.5px] text-[#94897a] leading-tight mt-0.5 truncate">
                          {preset.tagline}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Neural Energy Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
                    <span className="text-[#b5aa99]">
                      Shields: <strong className="text-[#e6c27a]">{totalShields}</strong> · Strike:{' '}
                      <strong className="text-[#f06b70]">{plan.strikePower}</strong>
                    </span>
                    {unspentEnergy > 0 && (
                      <span className="text-[#e6c27a] font-semibold">+{unspentEnergy} Free</span>
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
                              ? 'bg-[#e6c27a] shadow-[0_0_6px_rgba(230,194,122,0.45)]'
                              : isStrikePip
                              ? 'bg-[#e5484d] shadow-[0_0_6px_rgba(229,72,77,0.45)]'
                              : 'bg-[#221d2b]'
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
                            ? 'bg-[#e5484d]/[0.09] border-[#e5484d]/50'
                            : 'bg-[#0d0a12] border-[#e6c27a]/15'
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
                              <div className="text-[9.5px] text-[#8d8273] truncate">
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
                                ? 'bg-[#d9383a] text-[#fff8f6] border-[#f06b70] shadow-[0_2px_10px_rgba(217,56,58,0.4)]'
                                : 'bg-[#171320] text-[#b5aa99] border-[#e6c27a]/18 hover:text-[#f79da0] hover:border-[#e5484d]/45'
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
                            className="w-7 h-7 rounded-lg bg-[#191423] hover:bg-[#231c30] border border-[#e6c27a]/20 flex items-center justify-center text-[#f4efe6] disabled:opacity-30 cursor-pointer transition-colors"
                            aria-label={`Decrease ${chamber} shield`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1">
                            <div className="h-1.5 rounded-full bg-[#1c1726] overflow-hidden">
                              <div
                                className="h-full transition-all duration-200 rounded-full"
                                style={{
                                  width: `${(sh / MAX_CHAMBER_SHIELD) * 100}%`,
                                  backgroundColor: strokeMeta.hex,
                                }}
                              />
                            </div>
                          </div>
                          <span className="w-12 text-center font-mono text-xs font-semibold text-[#faf5eb] tabular-nums">
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
                            className="w-7 h-7 rounded-lg bg-[#191423] hover:bg-[#231c30] border border-[#e6c27a]/20 flex items-center justify-center text-[#f4efe6] disabled:opacity-30 cursor-pointer transition-colors"
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
              <div className="text-[10px] text-[#b5aa99] bg-[#0d0a12] border border-[#e6c27a]/15 rounded-xl px-2.5 py-2 leading-snug">
                <strong className="text-[#f06b70] font-semibold">Phantom Trap:</strong> Un-read attackers deal half Strike &amp; suffer{' '}
                <strong className="text-[#faf5eb]">14 Recoil</strong>.
              </div>
            </section>

            {/* CENTER COLUMN: ANIMATED 3-RING ASTRAL MIND VAULT + LOCK CONTROL */}
            <section className="atelier-card hover:transform-none rounded-2xl bg-gradient-to-b from-[#1a1424] via-[#130f1a] to-[#0e0b13] border border-[#e6c27a]/24 p-3.5 flex flex-col items-center justify-between gap-2 relative overflow-hidden shadow-[inset_0_1px_0_rgba(230,194,122,0.16)]">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 48%, rgba(230, 194, 122, 0.1), rgba(139, 124, 246, 0.05) 38%, transparent 72%)',
                }}
              />

              {/* Top Telemetry Pill */}
              <div className="relative z-10 w-full flex items-center justify-between gap-2 text-[10px]">
                <span className="px-2.5 py-1 rounded-md bg-[#0c0a10]/90 border border-[#e6c27a]/20 font-mono text-[#b5aa99]">
                  CLICK AN ORB TO TARGET
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md font-mono font-semibold uppercase tracking-wider border ${
                    opp.locked
                      ? 'bg-[#e5484d]/15 border-[#e5484d]/45 text-[#f79da0] animate-pulse'
                      : 'bg-[#0c0a10]/90 border-[#e6c27a]/20 text-[#e4dac9]'
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
              <div className="relative z-10 flex-1 flex items-center justify-center w-full min-h-[240px]">
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
              <div className="relative z-10 w-full max-w-md space-y-2">
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0c0a10]/90 border border-[#e6c27a]/22 text-[11px]">
                  <span className="text-[#b5aa99]">
                    Targeting{' '}
                    <strong className={VAULT_CHAMBER_STROKE[plan.targetChamber].text}>
                      {plan.targetChamber}
                    </strong>{' '}
                    · Call{' '}
                    <strong className="text-[#b4a7ff]">{plan.mindReadCall}</strong>
                  </span>
                  <span className="font-mono font-semibold text-[#e6c27a] tabular-nums">
                    MAX {previewMaxDmg} DMG
                    {plan.relic === 'time_freeze' ? ' (SH→0)' : ''}
                  </span>
                </div>

                {me.locked ? (
                  <div className="w-full py-3 rounded-xl bg-[#181322] border border-[#e6c27a]/35 text-[#f4efe6] font-semibold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 animate-pulse text-[#e6c27a]" />
                    {isSolo ? 'Resolving Astral Clash…' : `Locked In — Waiting for ${opp.nickname}…`}
                  </div>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={busy}
                    onClick={handleConfirmLock}
                    className="btn-brass w-full py-3 rounded-xl font-semibold tracking-wide text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Swords className="w-4 h-4" />
                    Lock Neural Breach
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </section>

            {/* RIGHT COLUMN: OFFENSE, MIND-READ CALL & TAROT RELICS */}
            <section className="atelier-card hover:transform-none rounded-2xl bg-gradient-to-b from-[#171320] to-[#110e17] border border-[#e6c27a]/18 p-3.5 flex flex-col justify-between gap-2.5 min-h-0 overflow-y-auto">
              {/* Target & Strike Power */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-[#f06b70]" />
                    <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-[#faf5eb]">
                      Offense &amp; Breach
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-[#f06b70] font-semibold tabular-nums">
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
                        className={`py-2 rounded-xl border text-xs font-mono font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${
                          active
                            ? 'bg-[#e6c27a]/15 border-[#e6c27a]/75 text-[#faf5eb] shadow-[0_0_12px_rgba(230,194,122,0.16)]'
                            : 'bg-[#0d0a12] border-[#e6c27a]/15 text-[#9c9180] hover:border-[#e6c27a]/40 hover:text-[#faf5eb]'
                        }`}
                      >
                        <span className={strokeMeta.text}>{meta.greek}</span> {ch}
                      </button>
                    );
                  })}
                </div>

                {/* Strike Power Stepper */}
                <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-[#0d0a12] border border-[#e6c27a]/16">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#b5aa99]">
                    Strike Power
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={me.locked || busy || plan.strikePower <= 0}
                      onClick={() => adjustStrike(-1)}
                      className="w-7 h-7 rounded-lg bg-[#191423] hover:bg-[#231c30] border border-[#e6c27a]/20 flex items-center justify-center text-[#faf5eb] disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono text-base font-bold text-[#f06b70] tabular-nums">
                      {plan.strikePower}
                    </span>
                    <button
                      type="button"
                      disabled={me.locked || busy || plan.strikePower >= NEURAL_ENERGY}
                      onClick={() => adjustStrike(1)}
                      className="w-7 h-7 rounded-lg bg-[#191423] hover:bg-[#231c30] border border-[#e6c27a]/20 flex items-center justify-center text-[#faf5eb] disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mind-Read Call */}
              <div className="space-y-1.5 pt-2 border-t border-[#e6c27a]/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#b4a7ff]" />
                    <span className="font-display text-xs font-semibold uppercase tracking-widest text-[#faf5eb]">
                      Mind-Read Call
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-[#b4a7ff] tabular-nums">
                    +{nextCounterReadDmg} PSYCHIC
                  </span>
                </div>
                <p className="text-[10px] text-[#b5aa99] leading-tight">
                  Where did <strong className="text-[#faf5eb]">{opp.nickname}</strong> hide their Phantom Trap?
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
                        className={`py-2 rounded-xl border text-[11px] font-mono font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${
                          active
                            ? 'bg-[#8b7cf6]/20 border-[#8b7cf6]/75 text-[#faf5eb] shadow-[0_0_12px_rgba(139,124,246,0.2)]'
                            : 'bg-[#0d0a12] border-[#e6c27a]/15 text-[#9c9180] hover:border-[#8b7cf6]/45 hover:text-[#faf5eb]'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Gilded Tarot-Style Astral Relics */}
              <div className="space-y-1.5 pt-2 border-t border-[#e6c27a]/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#e6c27a]" />
                    <span className="font-display text-xs font-semibold uppercase tracking-widest text-[#faf5eb]">
                      Astral Relics
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#94897a] tabular-nums">
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
                        className={`relative overflow-hidden text-left p-2.5 rounded-xl border transition-all ${
                          spent
                            ? 'bg-[#0c0a10]/60 border-[#e6c27a]/10 opacity-40 cursor-not-allowed'
                            : armed
                            ? 'bg-gradient-to-r from-[#282015] via-[#1c151f] to-[#14101a] border-[#e6c27a]/80 shadow-[0_4px_18px_rgba(230,194,122,0.2)] cursor-pointer'
                            : 'bg-gradient-to-r from-[#15111e] to-[#0e0b14] border-[#e6c27a]/22 hover:border-[#e6c27a]/55 cursor-pointer'
                        }`}
                      >
                        <div className="pointer-events-none absolute inset-1 rounded-lg border border-[#e6c27a]/10" />
                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg bg-[#0c0a10] border flex items-center justify-center shrink-0 ${
                                armed ? 'border-[#e6c27a]/80 text-[#e6c27a]' : 'border-[#e6c27a]/25 text-[#d9ceb9]'
                              }`}
                            >
                              <RelicIcon relic={relicId} className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8.5px] font-mono tracking-widest text-[#e6c27a]/85">
                                  {def.arcana}
                                </span>
                              </div>
                              <div className="font-display text-xs font-semibold text-[#faf5eb] leading-tight">
                                {def.name}
                              </div>
                              <div className="text-[10px] text-[#b5aa99] leading-tight truncate">
                                {def.shortEffect}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-mono font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0 border ${
                              spent
                                ? 'bg-[#14101c] border-[#e6c27a]/10 text-[#685f54]'
                                : armed
                                ? 'bg-[#e6c27a] text-[#140f08] border-[#f6dfa8]'
                                : 'bg-[#171320] border-[#e6c27a]/22 text-[#c9beac]'
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
              className="atelier-card hover:transform-none text-center px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#17121e] via-[#1c1522] to-[#17121e] border border-[#e6c27a]/28"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#e6c27a]">
                ROUND {latestLog.round} CLASH RESOLUTION
              </div>
              <h2 className="font-display text-base sm:text-xl font-semibold tracking-tight text-[#faf5eb] mt-0.5">
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
            <div className="atelier-card hover:transform-none shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-[#15111d] border border-[#e6c27a]/22">
              <div className="text-xs text-[#e4dac9] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e6c27a] shrink-0" />
                <span>
                  {me.paranoiaActive
                    ? 'WARNING: Rival inflicted PARANOIA GLITCH on you for next round!'
                    : opp.paranoiaActive
                    ? `Your PARANOIA GLITCH is distorting ${opp.nickname}’s telemetry next round!`
                    : `Sanity Standing: ${me.nickname} (${me.sanity}) vs ${opp.nickname} (${opp.sanity})`}
                </span>
              </div>

              {me.nextReady && !isSolo ? (
                <div className="px-5 py-2.5 rounded-xl bg-[#1b1625] border border-[#e6c27a]/28 text-[#f4efe6] text-xs font-mono uppercase tracking-wider flex items-center gap-2">
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
                  className="btn-brass w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              className={`atelier-card hover:transform-none rounded-2xl p-5 border text-center relative overflow-hidden bg-gradient-to-b from-[#1a1524] to-[#110e16] ${
                state.winnerIdx === meIdx
                  ? 'border-[#e6c27a]/60'
                  : state.winnerIdx === -1
                  ? 'border-[#8b7cf6]/55'
                  : 'border-[#e5484d]/55'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0c0a10] border border-[#e6c27a]/28 text-[10px] font-mono uppercase tracking-[0.22em] text-[#e6c27a] mb-2">
                {state.winnerIdx === meIdx ? (
                  <>
                    <Trophy className="w-3.5 h-3.5 text-[#e6c27a]" /> HEIST COMPLETE
                  </>
                ) : state.winnerIdx === -1 ? (
                  <>
                    <Brain className="w-3.5 h-3.5 text-[#b4a7ff]" /> NEURAL SINGULARITY
                  </>
                ) : (
                  <>
                    <Skull className="w-3.5 h-3.5 text-[#f06b70]" /> MIND SHATTERED
                  </>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#faf5eb]">
                {state.winnerIdx === meIdx
                  ? `Victory — ${opp.nickname}’s Vault Collapsed`
                  : state.winnerIdx === -1
                  ? 'Mutual Collapse — Double Knockout'
                  : `Defeat — ${opp.nickname} Breached Your Mind`}
              </h1>

              <p className="text-xs font-mono text-[#b5aa99] mt-1.5">
                Decided on Round {latestLog.round} · Final Sanity: <strong className="text-[#e6c27a]">{me.sanity}</strong> vs{' '}
                <strong className="text-[#f06b70]">{opp.sanity}</strong> · Relics Spent:{' '}
                <strong className="text-[#b4a7ff]">{me.usedRelics.length}/3</strong>
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    sfx('deal');
                    onRematch();
                  }}
                  className="btn-brass px-6 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                  className="btn-obsidian px-5 py-2.5 rounded-xl font-medium text-xs uppercase tracking-wider cursor-pointer"
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
            className="fixed inset-0 z-50 bg-black/82 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCodex(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="atelier-card hover:transform-none max-w-2xl w-full max-h-[85dvh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#191522] to-[#110e16] border border-[#e6c27a]/30 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#e6c27a]/18 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#e6c27a]" />
                  <h3 className="font-display text-base font-semibold tracking-tight text-[#faf5eb]">
                    Mind Heist — <span className="font-serif italic font-normal text-[#e6c27a]">Tactical Codex</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodex(false)}
                  className="p-1.5 rounded-lg bg-[#0d0a12] hover:bg-[#1d1727] border border-[#e6c27a]/20 text-[#b5aa99] hover:text-[#faf5eb] cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#d6ccbc]">
                <div className="p-3 rounded-xl bg-[#0d0a12] border border-[#e6c27a]/16 space-y-1">
                  <div className="font-mono font-semibold text-[#e6c27a] uppercase text-[11px]">1. Allocate 12 Energy</div>
                  <p>
                    Split 12 Neural Energy across 3 Chamber Shields (ALPHA, BETA, OMEGA, max 10 each) and your Strike Power.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0d0a12] border border-[#e6c27a]/16 space-y-1">
                  <div className="font-mono font-semibold text-[#f06b70] uppercase text-[11px]">2. Breach Formula</div>
                  <p>
                    If <strong>Strike &gt; Rival Shield</strong> on the targeted chamber, you deal{' '}
                    <code className="text-[#e6c27a]">(Strike − Shield) × 4 + 8</code> damage!
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0d0a12] border border-[#e6c27a]/16 space-y-1">
                  <div className="font-mono font-semibold text-[#f06b70] uppercase text-[11px]">3. Phantom Trap Ambush</div>
                  <p>
                    Attacking your rival’s trapped chamber (without calling it) <strong>halves your Strike</strong> and deals{' '}
                    <strong>14 Trap Recoil</strong> to you!
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0d0a12] border border-[#e6c27a]/16 space-y-1">
                  <div className="font-mono font-semibold text-[#b4a7ff] uppercase text-[11px]">4. Psychic Counter-Read</div>
                  <p>
                    Correctly calling your rival’s Trap shatters it, deals <strong>+14 Bonus Damage</strong>, and builds a{' '}
                    <strong>+4/streak</strong> Read Combo!
                  </p>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#e6c27a] mb-2">
                  The 6 Astral Relics (3 Random Dealt · 1-Use Each)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(RELIC_DEFS) as RelicId[]).map((id) => {
                    const r = RELIC_DEFS[id];
                    return (
                      <div key={id} className="p-2.5 rounded-xl bg-[#0d0a12] border border-[#e6c27a]/18">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#faf5eb]">
                          <RelicIcon relic={id} className="w-3.5 h-3.5 text-[#e6c27a]" />
                          {r.name}
                        </div>
                        <p className="text-[11px] text-[#b5aa99] mt-0.5 leading-snug">{r.description}</p>
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
            className="fixed inset-0 z-50 bg-black/82 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="atelier-card hover:transform-none max-w-xl w-full max-h-[82dvh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#191522] to-[#110e16] border border-[#e6c27a]/30 p-5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#e6c27a]/18 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#b4a7ff]" />
                  <h3 className="font-display text-base font-semibold tracking-tight text-[#faf5eb]">
                    Neural Clash Log
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg bg-[#0d0a12] hover:bg-[#1d1727] border border-[#e6c27a]/20 text-[#b5aa99] hover:text-[#faf5eb] cursor-pointer transition-colors"
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
                      className="p-3 rounded-xl bg-[#0d0a12] border border-[#e6c27a]/16 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
                        <span className="text-[#e6c27a] font-semibold">ROUND {entry.round}</span>
                        <span className="text-[#b5aa99]">
                          HP: {meIdx === 0 ? entry.p0SanityAfter : entry.p1SanityAfter} vs{' '}
                          {meIdx === 0 ? entry.p1SanityAfter : entry.p0SanityAfter}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-[#faf5eb]">{entry.headline}</div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#b5aa99]">
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
