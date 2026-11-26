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
      {/* Ambient Radial Aura */}
      <div
        className={`absolute inset-4 rounded-full blur-3xl transition-colors duration-700 ${
          isClash
            ? 'bg-gradient-to-tr from-rose-600/35 via-violet-600/30 to-amber-400/35'
            : paranoiaActive
            ? 'bg-gradient-to-tr from-rose-600/35 via-fuchsia-600/30 to-cyan-500/25'
            : locked
            ? 'bg-gradient-to-tr from-amber-500/30 via-violet-600/30 to-rose-500/25'
            : 'bg-gradient-to-tr from-indigo-700/25 via-violet-600/20 to-rose-500/20'
        }`}
      />

      <svg viewBox="0 0 420 420" className="w-full h-full relative z-10 overflow-visible">
        <defs>
          <radialGradient id="mhCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#a855f7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#05030d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mhRingGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="mhRingViolet" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <filter id="mhNeon" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Astral Ring (Ring 1) */}
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
            strokeWidth="1.5"
            strokeOpacity="0.55"
            strokeDasharray="18 10 4 10"
          />
          <circle
            cx="210"
            cy="210"
            r="174"
            fill="none"
            stroke="#a855f7"
            strokeWidth="0.9"
            strokeOpacity="0.35"
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
                stroke={idx % 3 === 0 ? '#fbbf24' : '#f43f5e'}
                strokeWidth={idx % 3 === 0 ? '2.2' : '1'}
                strokeOpacity="0.7"
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
            stroke="url(#mhRingViolet)"
            strokeWidth="2"
            strokeOpacity="0.65"
            strokeDasharray="46 16 12 16"
          />
          {/* Hexagram / Astral Diamond Shards */}
          <polygon
            points="210,74 328,282 92,282"
            fill="none"
            stroke="#fbbf24"
            strokeOpacity="0.24"
            strokeWidth="1.2"
          />
          <polygon
            points="210,346 92,138 328,138"
            fill="none"
            stroke="#f43f5e"
            strokeOpacity="0.22"
            strokeWidth="1.2"
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
            strokeWidth="1.6"
            strokeOpacity="0.55"
            strokeDasharray="8 6"
          />
          <circle
            cx="210"
            cy="210"
            r="58"
            fill="none"
            stroke="#e879f9"
            strokeWidth="1.2"
            strokeOpacity="0.45"
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
            strokeWidth="2"
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
              strokeWidth="3"
              initial={{ r: 32, opacity: 0.95 }}
              animate={{ r: 196, opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.circle
              cx="210"
              cy="210"
              r="40"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              initial={{ r: 24, opacity: 0.85 }}
              animate={{ r: 185, opacity: 0 }}
              transition={{ duration: 1.4, delay: 0.45, repeat: Infinity, ease: 'easeOut' }}
            />
          </>
        )}

        {/* Neural Energy Conduit Lines between Chambers */}
        <line x1="210" y1="74" x2="92" y2="282" stroke="#8b5cf6" strokeOpacity="0.28" strokeWidth="1.5" />
        <line x1="92" y1="282" x2="328" y2="282" stroke="#8b5cf6" strokeOpacity="0.28" strokeWidth="1.5" />
        <line x1="328" y1="282" x2="210" y2="74" stroke="#8b5cf6" strokeOpacity="0.28" strokeWidth="1.5" />

        {/* Active Targeting Laser in Planning Mode */}
        {mode === 'planning' && (
          <motion.line
            x1="210"
            y1="210"
            x2={CHAMBER_META[plan.targetChamber].svgX}
            y2={CHAMBER_META[plan.targetChamber].svgY}
            stroke="#f43f5e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="10 6"
            filter="url(#mhNeon)"
            animate={{ strokeDashoffset: [0, -32], opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Clash Reveal Laser Breach Arcs */}
        {isClash && myBreakdown && (
          <motion.path
            d={`M 210 210 Q ${(210 + myHitMeta.svgX) / 2 + 24} ${(210 + myHitMeta.svgY) / 2 - 22} ${myHitMeta.svgX} ${myHitMeta.svgY}`}
            fill="none"
            stroke={myBreakdown.breached ? '#fbbf24' : '#94a3b8'}
            strokeWidth={myBreakdown.breached ? '4.5' : '2.5'}
            strokeLinecap="round"
            filter="url(#mhNeon)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
        {isClash && oppBreakdown && oppHitMeta && (
          <motion.path
            d={`M 210 210 Q ${(210 + oppHitMeta.svgX) / 2 - 26} ${(210 + oppHitMeta.svgY) / 2 + 24} ${oppHitMeta.svgX} ${oppHitMeta.svgY}`}
            fill="none"
            stroke={oppBreakdown.breached ? '#f43f5e' : '#64748b'}
            strokeWidth={oppBreakdown.breached ? '4' : '2'}
            strokeDasharray="8 5"
            strokeLinecap="round"
            filter="url(#mhNeon)"
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
          fill="#0b0618"
          stroke={isClash ? '#fbbf24' : locked ? '#a855f7' : '#f43f5e'}
          strokeWidth="2.5"
          filter="url(#mhNeon)"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <text
          x="210"
          y="204"
          textAnchor="middle"
          fill="#fbbf24"
          fontSize="9"
          fontWeight="900"
          letterSpacing="2"
        >
          {isClash ? 'CLASH' : locked ? 'LOCKED' : 'STRIKE'}
        </text>
        <text
          x="210"
          y="224"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="20"
          fontWeight="900"
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
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  animate={{ r: [38, 46, 38], opacity: [0.95, 0.35, 0.95] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {/* Chamber Orb */}
              <circle
                cx={meta.svgX}
                cy={meta.svgY}
                r="34"
                fill="#0a0617"
                stroke={isTarget || myHitHere ? '#fbbf24' : meta.hex}
                strokeWidth={isTarget || myHitHere ? '3' : '2'}
                filter="url(#mhNeon)"
              />

              {/* Inner subtle ring */}
              <circle
                cx={meta.svgX}
                cy={meta.svgY}
                r="26"
                fill={meta.hex}
                fillOpacity={isTarget ? '0.24' : '0.12'}
              />

              {/* Chamber Name */}
              <text
                x={meta.svgX}
                y={meta.svgY - 6}
                textAnchor="middle"
                fill={meta.hex}
                fontSize="10"
                fontWeight="900"
                letterSpacing="1.2"
              >
                {paranoiaActive && mode === 'planning' ? meta.glitchLabel : meta.label}
              </text>

              {/* Shield Readout or Clash Damage */}
              <text
                x={meta.svgX}
                y={meta.svgY + 12}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="13"
                fontWeight="900"
                fontFamily="monospace"
              >
                {isClash && myBreakdown && oppBreakdown
                  ? `SH ${oppBreakdown.plan.shields[chamber]}`
                  : `SH ${shieldVal}`}
              </text>

              {/* Trap Badge (top-left of orb in planning) */}
              {isTrap && (
                <g transform={`translate(${meta.svgX - 30}, ${meta.svgY - 26})`}>
                  <rect width="26" height="15" rx="4" fill="#e11d48" stroke="#fda4af" strokeWidth="1" />
                  <text x="13" y="10.5" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="900">
                    TRAP
                  </text>
                </g>
              )}

              {/* Mind-Read Badge (top-right of orb in planning) */}
              {isRead && (
                <g transform={`translate(${meta.svgX + 6}, ${meta.svgY - 26})`}>
                  <rect width="28" height="15" rx="4" fill="#7c3aed" stroke="#ddd6fe" strokeWidth="1" />
                  <text x="14" y="10.5" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="900">
                    READ
                  </text>
                </g>
              )}

              {/* Target Tag (bottom of orb in planning) */}
              {isTarget && (
                <g transform={`translate(${meta.svgX - 26}, ${meta.svgY + 25})`}>
                  <rect width="52" height="15" rx="4" fill="#fbbf24" />
                  <text x="26" y="10.5" textAnchor="middle" fill="#090514" fontSize="7.5" fontWeight="900">
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
                    fill={myCounterHere ? '#10b981' : '#e11d48'}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                  />
                  <text x="32" y="11" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="900">
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
  const borderColor = accent === 'gold' ? 'border-amber-400/40' : 'border-rose-500/40';
  const badgeBg =
    accent === 'gold'
      ? 'bg-amber-500/15 text-amber-300 border-amber-400/35'
      : 'bg-rose-500/15 text-rose-300 border-rose-400/35';

  return (
    <div
      className={`rounded-2xl bg-[#0b0718]/90 border ${borderColor} p-3.5 flex flex-col gap-2.5 shadow-xl backdrop-blur-md`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${badgeBg}`}>
            {isMe ? 'YOUR ASSAULT' : 'RIVAL ASSAULT'}
          </span>
          <span className="text-xs font-black text-white truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-black font-mono text-amber-300">
            {breakdown.totalDamageDealt} DMG
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              breakdown.netSanityChange >= 0
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {breakdown.netSanityChange >= 0 ? `+${breakdown.netSanityChange}` : breakdown.netSanityChange} HP
          </span>
        </div>
      </div>

      {/* Tactical Grid */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
        <div className="rounded-lg bg-black/50 border border-white/10 p-2">
          <div className="text-slate-400 uppercase font-bold tracking-wider">Target</div>
          <div className={`font-black text-xs mt-0.5 ${CHAMBER_META[breakdown.hitChamber].textClass}`}>
            {breakdown.hitChamber}
            {breakdown.mirageSplashUsed && <span className="text-[9px] text-fuchsia-300 ml-1">(SPLASH)</span>}
          </div>
          <div className="text-[10px] font-mono text-slate-300 mt-0.5">
            STR {breakdown.effectiveStrike} vs SH {breakdown.effectiveShield}
          </div>
        </div>

        <div className="rounded-lg bg-black/50 border border-white/10 p-2">
          <div className="text-slate-400 uppercase font-bold tracking-wider">Mind-Read</div>
          <div className="font-black text-xs mt-0.5 text-violet-300">{breakdown.plan.mindReadCall}</div>
          <div
            className={`text-[10px] font-bold mt-0.5 ${
              breakdown.counterReadHit ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {breakdown.counterReadHit ? `✓ READ! +${breakdown.counterReadDamage}` : `✗ Trap: ${defenderTrap}`}
          </div>
        </div>

        <div className="rounded-lg bg-black/50 border border-white/10 p-2">
          <div className="text-slate-400 uppercase font-bold tracking-wider">Shield Split</div>
          <div className="font-mono text-[11px] font-bold text-white mt-0.5">
            {breakdown.plan.shields.ALPHA}/{breakdown.plan.shields.BETA}/{breakdown.plan.shields.OMEGA}
          </div>
          <div className="text-[10px] text-rose-300 font-bold mt-0.5">
            Trap: {breakdown.plan.trapChamber}
          </div>
        </div>
      </div>

      {/* Armed Relic Banner */}
      {breakdown.armedRelic && (
        <div
          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r ${
            RELIC_DEFS[breakdown.armedRelic].gradientClass
          } border ${RELIC_DEFS[breakdown.armedRelic].borderClass}`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-black text-white">
            <RelicIcon relic={breakdown.armedRelic} className="w-3.5 h-3.5 text-amber-300" />
            <span>{RELIC_DEFS[breakdown.armedRelic].name}</span>
          </div>
          <span className="text-[10px] font-mono text-amber-200">
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
              className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isBad
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : isGood
                  ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                  : 'bg-violet-500/15 border-violet-400/35 text-violet-200'
              }`}
            >
              {tag}
            </span>
          );
        })}
      </div>

      {/* Defender Shield Reference */}
      <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-white/5 pt-1.5">
        <span>
          Target Shields: A:{defenderShields.ALPHA} · B:{defenderShields.BETA} · O:{defenderShields.OMEGA}
        </span>
        {breakdown.trapRecoilTaken > 0 && (
          <span className="text-rose-400 font-bold">-{breakdown.trapRecoilTaken} TRAP RECOIL</span>
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
      className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#05030d] text-slate-100 flex flex-col relative selection:bg-rose-500/30"
    >
      {/* Surreal Astral Dreamscape Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[620px] h-[420px] rounded-full bg-violet-700/15 blur-[140px]" />
        <div className="absolute -bottom-32 right-1/6 w-[560px] h-[380px] rounded-full bg-rose-600/15 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-amber-500/[0.06] blur-[120px]" />
        <div className="absolute inset-0 bg-grid-white opacity-25" />
      </div>

      {/* Clash Flash Burst */}
      <AnimatePresence>
        {flashBurst && (
          <motion.div
            initial={{ opacity: 0.65 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42 }}
            className="pointer-events-none fixed inset-0 z-50 bg-gradient-to-tr from-rose-500/40 via-amber-300/35 to-violet-500/40"
          />
        )}
      </AnimatePresence>

      {/* Top HUD Bar */}
      <header className="relative z-20 shrink-0 border-b border-violet-500/25 bg-[#070414]/85 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Nav & Title */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                sfx('chip');
                onBack();
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lobby</span>
            </button>
            <span className="text-white/15">|</span>
            <div className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-rose-400" />
              <span className="font-black uppercase tracking-tight text-xs sm:text-sm bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                MIND HEIST
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full border border-amber-400/35 bg-amber-500/10 font-mono text-[10px] font-black text-amber-300">
              R{String(state.round).padStart(2, '0')}
            </span>
            {roomCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-violet-400/35 bg-violet-500/15 hover:bg-violet-500/25 font-mono text-[10px] font-bold text-violet-200 transition-colors cursor-pointer"
                title="Copy Room Code"
              >
                {roomCode}
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Center: Dual Sanity HUD Bars */}
          {me && opp && (
            <div className="flex items-center gap-3 sm:gap-5 order-3 lg:order-2 w-full lg:w-auto justify-center">
              {/* YOU */}
              <div className="flex items-center gap-2 flex-1 lg:flex-initial lg:w-52">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-0.5">
                    <span className="text-amber-300 truncate flex items-center gap-1">
                      {me.nickname}
                      {me.readStreak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1 rounded bg-violet-500/30 text-violet-200">
                          <Flame className="w-2.5 h-2.5 text-amber-400" />
                          {me.readStreak}×
                        </span>
                      )}
                      {me.paranoiaActive && (
                        <span className="text-[9px] px-1 rounded bg-rose-600/40 text-rose-200 animate-pulse">
                          GLITCH
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-white shrink-0">
                      {me.sanity}/{me.maxSanity}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400"
                      initial={false}
                      animate={{ width: `${Math.max(0, (me.sanity / me.maxSanity) * 100)}%` }}
                      transition={{ duration: 0.55 }}
                    />
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-black text-rose-500 italic tracking-widest">VS</span>

              {/* RIVAL */}
              <div className="flex items-center gap-2 flex-1 lg:flex-initial lg:w-52">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-0.5">
                    <span className="font-mono text-white shrink-0">
                      {opp.sanity}/{opp.maxSanity}
                    </span>
                    <span className="text-rose-300 truncate flex items-center gap-1">
                      {opp.paranoiaActive && (
                        <span className="text-[9px] px-1 rounded bg-rose-600/40 text-rose-200">
                          GLITCHED
                        </span>
                      )}
                      {opp.readStreak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1 rounded bg-rose-500/30 text-rose-200">
                          <Flame className="w-2.5 h-2.5 text-amber-400" />
                          {opp.readStreak}×
                        </span>
                      )}
                      {opp.nickname}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-l from-rose-500 via-fuchsia-500 to-violet-500 ml-auto"
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline">Log ({state.history.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sfx('chip');
                setShowCodex(true);
              }}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-amber-300 cursor-pointer"
              title="Tactical Codex"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer"
              title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-3 sm:px-5 py-2.5 flex flex-col justify-center">
        {/* ================= ROOM FULL FALLBACK ================= */}
        {state.status !== 'waiting' && meIdx === -1 && (
          <div className="max-w-md w-full mx-auto bg-[#0b0718]/90 border border-rose-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <Lock className="w-9 h-9 text-rose-400 mx-auto" />
            <h1 className="text-xl font-black uppercase tracking-tight text-white">
              Astral Vault Occupied
            </h1>
            <p className="text-xs text-slate-400">
              This 1v1 Mind Heist duel already has two active intruders locked in combat.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black uppercase tracking-wider text-xs cursor-pointer"
            >
              Return to Mind Heist Lobby
            </button>
          </div>
        )}

        {/* ================= WAITING ROOM ================= */}
        {state.status === 'waiting' && (
          <div className="max-w-lg w-full mx-auto bg-[#0b0718]/90 border border-violet-500/35 rounded-3xl p-6 text-center space-y-5 shadow-[0_0_60px_rgba(139,92,246,0.2)]">
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
                <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                  Infiltrate Mind Heist
                </h1>
                <p className="text-xs text-slate-400">
                  Enter your Phantom Callsign to breach Room{' '}
                  <span className="font-mono text-amber-300 font-bold">{roomCode}</span>.
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-violet-500/40 focus:border-amber-400 focus:outline-none text-sm font-bold text-white"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black uppercase text-xs tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    Enter
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-400/35 text-violet-200 text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  Awaiting Rival Intruder
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                  Share Your Vault Frequency
                </h1>
                {roomCode && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="w-full py-4 rounded-2xl bg-black/70 border-2 border-dashed border-amber-400/50 hover:border-amber-300 flex items-center justify-center gap-3 transition-colors cursor-pointer group"
                  >
                    <span className="font-mono text-3xl font-black tracking-[0.28em] text-amber-300">
                      {roomCode}
                    </span>
                    {copied ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    )}
                  </button>
                )}
                <p className="text-xs text-slate-400">
                  Max Sanity: <span className="text-amber-300 font-bold">{state.maxSanity} HP</span> · 3 Random Astral Relics Dealt on Entry
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= PLANNING STAGE ================= */}
        {state.status === 'planning' && me && opp && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[325px_1fr_340px] gap-3 items-stretch">
            {/* LEFT COLUMN: DEFENSE MATRIX */}
            <section className="rounded-2xl bg-[#0a0617]/88 border border-violet-500/30 p-3.5 flex flex-col justify-between gap-2.5 shadow-2xl min-h-0 overflow-y-auto">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-white">
                      Defense Matrix
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300">
                    {spentEnergy}/{NEURAL_ENERGY} ENERGY
                  </span>
                </div>

                {/* Paranoia Glitch Telemetry Alert */}
                {isParanoia && (
                  <motion.div
                    animate={{ opacity: [0.75, 1, 0.75] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/55 flex items-center gap-2 text-[10px] font-black text-rose-200 uppercase tracking-wider"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>PARANOIA GLITCH: Chamber telemetry destabilized!</span>
                  </motion.div>
                )}

                {/* 3 One-Click Tactical Presets */}
                <div>
                  <div className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    One-Click Tactical Presets
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TACTICAL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={me.locked || busy}
                        onClick={() => applyPreset(preset)}
                        className={`px-2 py-1.5 rounded-xl bg-black/50 border text-left transition-all cursor-pointer disabled:opacity-40 ${preset.accentClass}`}
                      >
                        <div className="text-[10px] font-black leading-tight">{preset.name}</div>
                        <div className="text-[8.5px] text-slate-400 leading-tight mt-0.5 truncate">
                          {preset.tagline}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Neural Energy Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">
                      Shields: <strong className="text-white">{totalShields}</strong> · Strike:{' '}
                      <strong className="text-rose-300">{plan.strikePower}</strong>
                    </span>
                    {unspentEnergy > 0 && (
                      <span className="text-amber-300 font-bold">+{unspentEnergy} Free</span>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    {Array.from({ length: NEURAL_ENERGY }).map((_, idx) => {
                      const isShieldPip = idx < totalShields;
                      const isStrikePip = idx >= totalShields && idx < spentEnergy;
                      return (
                        <div
                          key={idx}
                          className={`h-2 rounded-sm transition-all ${
                            isShieldPip
                              ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                              : isStrikePip
                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.65)]'
                              : 'bg-slate-800'
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
                    const sh = plan.shields[chamber];
                    const hasTrap = plan.trapChamber === chamber;
                    return (
                      <div
                        key={chamber}
                        className={`rounded-xl p-2.5 border transition-all ${
                          hasTrap
                            ? 'bg-rose-950/35 border-rose-500/55 shadow-[0_0_16px_rgba(244,63,94,0.18)]'
                            : 'bg-black/45 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs border ${meta.bgClass} ${meta.borderClass} ${meta.textClass}`}
                            >
                              {meta.greek}
                            </span>
                            <div className="min-w-0">
                              <div
                                className={`text-xs font-black tracking-wider ${meta.textClass} ${
                                  isParanoia ? 'animate-pulse' : ''
                                }`}
                              >
                                {isParanoia ? meta.glitchLabel : meta.label}
                              </div>
                              <div className="text-[9.5px] text-slate-400 truncate">
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
                            className={`px-2 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all cursor-pointer disabled:opacity-40 ${
                              hasTrap
                                ? 'bg-rose-500 text-white border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-rose-300 hover:border-rose-500/40'
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
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 flex items-center justify-center text-slate-200 disabled:opacity-30 cursor-pointer"
                            aria-label={`Decrease ${chamber} shield`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                              <div
                                className="h-full transition-all duration-200 rounded-full"
                                style={{
                                  width: `${(sh / MAX_CHAMBER_SHIELD) * 100}%`,
                                  backgroundColor: meta.hex,
                                }}
                              />
                            </div>
                          </div>
                          <span className="w-12 text-center font-mono text-xs font-black text-white">
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
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 flex items-center justify-center text-slate-200 disabled:opacity-30 cursor-pointer"
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
              <div className="text-[10px] text-slate-400 bg-black/40 border border-white/5 rounded-xl px-2.5 py-2 leading-snug">
                <strong className="text-rose-300">Phantom Trap:</strong> Un-read attackers deal half Strike &amp; suffer{' '}
                <strong className="text-white">14 Recoil</strong>.
              </div>
            </section>

            {/* CENTER COLUMN: ANIMATED 3-RING ASTRAL MIND VAULT + LOCK CONTROL */}
            <section className="rounded-2xl bg-[#070413]/75 border border-amber-400/25 p-3.5 flex flex-col items-center justify-between gap-2 relative overflow-hidden shadow-2xl">
              {/* Top Telemetry Pill */}
              <div className="w-full flex items-center justify-between gap-2 text-[10px]">
                <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/10 font-mono text-slate-300">
                  CLICK AN ORB TO TARGET
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${
                    opp.locked
                      ? 'bg-rose-500/20 border-rose-400/50 text-rose-300 animate-pulse'
                      : 'bg-violet-500/15 border-violet-400/35 text-violet-300'
                  }`}
                >
                  {isSolo
                    ? isBotThinking
                      ? 'PHANTOM-AI CALCULATING…'
                      : 'PHANTOM-AI WATCHING'
                    : opp.locked
                    ? `${opp.nickname} LOCKED IN ⚡`
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
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[11px]">
                  <span className="text-slate-400">
                    Targeting{' '}
                    <strong className={CHAMBER_META[plan.targetChamber].textClass}>
                      {plan.targetChamber}
                    </strong>{' '}
                    · Call{' '}
                    <strong className="text-violet-300">{plan.mindReadCall}</strong>
                  </span>
                  <span className="font-mono font-black text-amber-300">
                    MAX {previewMaxDmg} DMG
                    {plan.relic === 'time_freeze' ? ' (SH→0)' : ''}
                  </span>
                </div>

                {me.locked ? (
                  <div className="w-full py-3.5 rounded-2xl bg-violet-600/25 border border-violet-400/50 text-violet-200 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 animate-pulse text-amber-300" />
                    {isSolo ? 'Resolving Astral Clash…' : `Locked In — Waiting for ${opp.nickname}…`}
                  </div>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    disabled={busy}
                    onClick={handleConfirmLock}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-violet-600 hover:brightness-110 text-slate-950 font-black uppercase tracking-[0.16em] text-sm flex items-center justify-center gap-2 shadow-[0_0_32px_rgba(244,63,94,0.45)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Swords className="w-4 h-4" />
                    Lock Neural Breach
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </section>

            {/* RIGHT COLUMN: OFFENSE, MIND-READ CALL & TAROT RELICS */}
            <section className="rounded-2xl bg-[#0a0617]/88 border border-rose-500/30 p-3.5 flex flex-col justify-between gap-2.5 shadow-2xl min-h-0 overflow-y-auto">
              {/* Target & Strike Power */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-rose-400" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-white">
                      Offense &amp; Breach
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-rose-300 font-bold">
                    {plan.relic === 'overdrive' ? `${plan.strikePower}×2 = ${previewStrike}` : `${plan.strikePower} PWR`}
                  </span>
                </div>

                {/* Target Chamber Pills */}
                <div className="grid grid-cols-3 gap-1.5">
                  {CHAMBERS.map((ch) => {
                    const active = plan.targetChamber === ch;
                    const meta = CHAMBER_META[ch];
                    return (
                      <button
                        key={ch}
                        type="button"
                        disabled={me.locked || busy}
                        onClick={() => {
                          sfx('card_pick');
                          setPlan((prev) => ({ ...prev, targetChamber: ch }));
                        }}
                        className={`py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${
                          active
                            ? 'bg-rose-500/25 border-amber-400 text-white shadow-[0_0_14px_rgba(244,63,94,0.4)]'
                            : 'bg-black/45 border-white/10 text-slate-400 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span className={meta.textClass}>{meta.greek}</span> {ch}
                      </button>
                    );
                  })}
                </div>

                {/* Strike Power Stepper */}
                <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-black/50 border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Strike Power
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={me.locked || busy || plan.strikePower <= 0}
                      onClick={() => adjustStrike(-1)}
                      className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 flex items-center justify-center text-white disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono text-base font-black text-rose-400">
                      {plan.strikePower}
                    </span>
                    <button
                      type="button"
                      disabled={me.locked || busy || plan.strikePower >= NEURAL_ENERGY}
                      onClick={() => adjustStrike(1)}
                      className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 flex items-center justify-center text-white disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mind-Read Call */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">
                      Mind-Read Call
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-black text-violet-300">
                    +{nextCounterReadDmg} PSYCHIC
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Where did <strong className="text-slate-200">{opp.nickname}</strong> hide their Phantom Trap?
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
                        className={`py-2 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${
                          active
                            ? 'bg-violet-600/35 border-violet-300 text-white shadow-[0_0_14px_rgba(139,92,246,0.5)]'
                            : 'bg-black/45 border-white/10 text-slate-400 hover:border-violet-400/40 hover:text-violet-200'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Holographic Astral Tarot Relics */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">
                      Astral Relics
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
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
                        whileHover={!spent && !me.locked ? { scale: 1.015 } : undefined}
                        whileTap={!spent && !me.locked ? { scale: 0.985 } : undefined}
                        disabled={spent || me.locked || busy}
                        onClick={() => toggleRelic(relicId)}
                        className={`relative overflow-hidden text-left p-2.5 rounded-xl border transition-all ${
                          spent
                            ? 'bg-slate-950/60 border-white/5 opacity-40 cursor-not-allowed'
                            : armed
                            ? `bg-gradient-to-r ${def.gradientClass} border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)] cursor-pointer`
                            : `bg-gradient-to-r ${def.gradientClass} ${def.borderClass} hover:border-amber-300/70 cursor-pointer`
                        }`}
                      >
                        {/* Holographic foil overlay */}
                        {!spent && <div className="absolute inset-0 epic-foil opacity-35" />}

                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg bg-black/55 border flex items-center justify-center shrink-0 ${
                                armed ? 'border-amber-300 text-amber-300' : 'border-white/15 text-white'
                              }`}
                            >
                              <RelicIcon relic={relicId} className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8.5px] font-mono font-bold tracking-widest text-amber-300/80">
                                  {def.arcana}
                                </span>
                              </div>
                              <div className="text-xs font-black text-white leading-tight">
                                {def.name}
                              </div>
                              <div className="text-[10px] text-slate-300 leading-tight truncate">
                                {def.shortEffect}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 border ${
                              spent
                                ? 'bg-slate-900 border-slate-700 text-slate-500'
                                : armed
                                ? 'bg-amber-400 text-slate-950 border-amber-200'
                                : 'bg-black/45 border-white/15 text-slate-300'
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
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="text-center px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-violet-950/80 to-amber-950/60 border border-amber-400/40 shadow-[0_0_30px_rgba(244,63,94,0.25)]"
            >
              <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-amber-300">
                ROUND {latestLog.round} CLASH RESOLUTION
              </div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white mt-0.5">
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
            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-[#0a0617]/90 border border-violet-500/30">
              <div className="text-xs text-slate-300 flex items-center gap-2">
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
                <div className="px-5 py-2.5 rounded-xl bg-violet-600/25 border border-violet-400/50 text-violet-200 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Synced — Waiting for {opp.nickname}…
                </div>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={busy}
                  onClick={() => {
                    sfx('deal');
                    onNextRound();
                  }}
                  className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 text-slate-950 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(251,191,36,0.4)] cursor-pointer disabled:opacity-50"
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
            {/* Dramatic Verdict Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-3xl p-5 border text-center relative overflow-hidden shadow-2xl ${
                state.winnerIdx === meIdx
                  ? 'bg-gradient-to-r from-amber-950/75 via-violet-950/80 to-rose-950/70 border-amber-400/60'
                  : state.winnerIdx === -1
                  ? 'bg-gradient-to-r from-violet-950/80 via-slate-950/90 to-fuchsia-950/80 border-violet-400/60'
                  : 'bg-gradient-to-r from-rose-950/80 via-slate-950/90 to-indigo-950/80 border-rose-500/60'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/45 border border-white/15 text-[10px] font-black uppercase tracking-[0.25em] text-amber-300 mb-2">
                {state.winnerIdx === meIdx ? (
                  <>
                    <Trophy className="w-3.5 h-3.5 text-amber-300" /> HEIST COMPLETE
                  </>
                ) : state.winnerIdx === -1 ? (
                  <>
                    <Brain className="w-3.5 h-3.5 text-violet-300" /> NEURAL SINGULARITY
                  </>
                ) : (
                  <>
                    <Skull className="w-3.5 h-3.5 text-rose-400" /> MIND SHATTERED
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
                {state.winnerIdx === meIdx
                  ? `VICTORY — ${opp.nickname.toUpperCase()}’S VAULT COLLAPSED!`
                  : state.winnerIdx === -1
                  ? 'MUTUAL COLLAPSE — DOUBLE KNOCKOUT!'
                  : `DEFEAT — ${opp.nickname.toUpperCase()} BREACHED YOUR MIND`}
              </h1>

              <p className="text-xs text-slate-300 mt-1.5">
                Decided on Round {latestLog.round} · Final Sanity: <strong className="text-amber-300">{me.sanity}</strong> vs{' '}
                <strong className="text-rose-300">{opp.sanity}</strong> · Relics Spent:{' '}
                <strong className="text-violet-300">{me.usedRelics.length}/3</strong>
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    sfx('deal');
                    onRematch();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_0_24px_rgba(251,191,36,0.45)] cursor-pointer disabled:opacity-50"
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
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-black uppercase tracking-widest text-xs cursor-pointer"
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowCodex(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full max-h-[85dvh] overflow-y-auto rounded-3xl bg-[#0b0718] border border-amber-400/40 p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">
                    Mind Heist — Tactical Codex
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodex(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                  <div className="font-black text-amber-300 uppercase text-[11px]">1. Allocate 12 Energy</div>
                  <p>
                    Split 12 Neural Energy across 3 Chamber Shields (ALPHA, BETA, OMEGA, max 10 each) and your Strike Power.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                  <div className="font-black text-rose-300 uppercase text-[11px]">2. Breach Formula</div>
                  <p>
                    If <strong>Strike &gt; Rival Shield</strong> on the targeted chamber, you deal{' '}
                    <code className="text-amber-300">(Strike − Shield) × 4 + 8</code> damage!
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                  <div className="font-black text-rose-400 uppercase text-[11px]">3. Phantom Trap Ambush</div>
                  <p>
                    Attacking your rival’s trapped chamber (without calling it) <strong>halves your Strike</strong> and deals{' '}
                    <strong>14 Trap Recoil</strong> to you!
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                  <div className="font-black text-violet-300 uppercase text-[11px]">4. Psychic Counter-Read</div>
                  <p>
                    Correctly calling your rival’s Trap shatters it, deals <strong>+14 Bonus Damage</strong>, and builds a{' '}
                    <strong>+4/streak</strong> Read Combo!
                  </p>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-black uppercase tracking-widest text-amber-300 mb-2">
                  The 6 Astral Relics (3 Random Dealt · 1-Use Each)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(RELIC_DEFS) as RelicId[]).map((id) => {
                    const r = RELIC_DEFS[id];
                    return (
                      <div key={id} className={`p-2.5 rounded-xl bg-gradient-to-r ${r.gradientClass} border ${r.borderClass}`}>
                        <div className="flex items-center gap-1.5 text-xs font-black text-white">
                          <RelicIcon relic={id} className="w-3.5 h-3.5 text-amber-300" />
                          {r.name}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{r.description}</p>
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-xl w-full max-h-[82dvh] overflow-y-auto rounded-3xl bg-[#0b0718] border border-violet-400/40 p-5 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">
                    Neural Clash Log
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
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
                      className="p-3 rounded-xl bg-black/55 border border-white/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-amber-300 font-black">ROUND {entry.round}</span>
                        <span className="text-slate-400">
                          HP: {meIdx === 0 ? entry.p0SanityAfter : entry.p1SanityAfter} vs{' '}
                          {meIdx === 0 ? entry.p1SanityAfter : entry.p0SanityAfter}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white">{entry.headline}</div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
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
