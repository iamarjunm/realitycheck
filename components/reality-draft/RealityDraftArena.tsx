'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Crown,
  Flame,
  Heart,
  Layers,
  Lock,
  RotateCcw,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  ALL_CARD_IDS,
  ALL_DISTORTION_IDS,
  ANOMALY_CARDS,
  AnomalyCardId,
  AuraTier,
  CROWNS_TO_WIN,
  ClashResultLog,
  MAX_HP,
  PowerMathStep,
  RealityDraftState,
  RealityPlayer,
  RealityStance,
  WORLD_DISTORTIONS,
  getAuraRangeLabel,
  getDisplayedAuraTier,
  getProjectedSelfPower,
} from '@/lib/reality-draft';
import { playSound } from '@/lib/sounds';

interface RealityDraftArenaProps {
  game: RealityDraftState;
  meIdx: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onJoinRoom?: (nickname: string) => void;
  onLockMove: (card: AnomalyCardId, stance: RealityStance) => void;
  onNextRound: () => void;
  onPlayAgain: () => void;
  busy?: boolean;
}

const AURA_STYLES: Record<
  AuraTier,
  { label: string; ring: string; badge: string; text: string }
> = {
  LOW: {
    label: 'LOW AURA',
    ring: 'border-emerald-500/55',
    badge: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
    text: 'text-emerald-400',
  },
  MID: {
    label: 'MID AURA',
    ring: 'border-amber-400/60',
    badge: 'bg-amber-500/10 border-amber-400/45 text-amber-300',
    text: 'text-amber-400',
  },
  HIGH: {
    label: 'HIGH AURA',
    ring: 'border-rose-500/65',
    badge: 'bg-rose-500/10 border-rose-500/45 text-rose-300',
    text: 'text-rose-400',
  },
};

const RARITY_BADGE: Record<string, string> = {
  common: 'text-zinc-300 border-zinc-700 bg-zinc-900',
  rare: 'text-emerald-300 border-emerald-500/35 bg-emerald-950/40',
  epic: 'text-rose-300 border-rose-500/35 bg-rose-950/40',
  mythic: 'text-amber-300 border-amber-400/45 bg-amber-950/40',
};

const LUXURY_CARD_ACCENT: Record<string, { border: string; hex: string }> = {
  common: { border: 'border-zinc-700/90', hex: '#d4d4d8' },
  rare: { border: 'border-emerald-500/45', hex: '#34d399' },
  epic: { border: 'border-rose-500/45', hex: '#f43f5e' },
  mythic: { border: 'border-amber-400/60', hex: '#fbbf24' },
};

function CardArtworkEmblem({ cardId, color }: { cardId: AnomalyCardId; color: string }) {
  switch (cardId) {
    case 'zero_void':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <circle cx="32" cy="32" r="22" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />
          <circle cx="32" cy="32" r="14" fill="#05020b" stroke={color} strokeWidth="2.5" />
          <path d="M10 32C18 22 46 22 54 32C46 42 18 42 10 32Z" stroke="#fff" strokeWidth="1.3" opacity="0.7" />
          <circle cx="32" cy="32" r="5" fill={color} opacity="0.9" />
        </svg>
      );
    case 'glass_titan':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <polygon points="32,6 54,24 46,56 18,56 10,24" stroke={color} strokeWidth="2" fill="rgba(56,189,248,0.12)" />
          <polyline points="32,6 28,28 46,56" stroke="#e0f2fe" strokeWidth="1.5" opacity="0.85" />
          <polyline points="10,24 28,28 54,24" stroke={color} strokeWidth="1.3" opacity="0.8" />
          <line x1="28" y1="28" x2="18" y2="56" stroke="#fff" strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case 'bluff_phantom':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <path d="M14 18C22 10 42 10 50 18L46 44C41 52 23 52 18 44L14 18Z" stroke={color} strokeWidth="2" fill="rgba(192,132,252,0.14)" />
          <path d="M21 28L28 31L21 34" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M43 28L36 31L43 34" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 42C28 38 36 38 40 42" stroke="#f0abfc" strokeWidth="2" strokeLinecap="round" />
          <line x1="32" y1="12" x2="32" y2="50" stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
        </svg>
      );
    case 'echo_mirror':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <rect x="12" y="12" width="24" height="36" rx="4" stroke={color} strokeWidth="2" fill="rgba(34,211,238,0.1)" />
          <rect x="28" y="16" width="24" height="36" rx="4" stroke="#fff" strokeWidth="1.8" strokeDasharray="3 2" fill="rgba(34,211,238,0.18)" />
          <path d="M19 24L29 34M35 28L45 38" stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'chrono_thief':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <path d="M18 10H46L35 32L46 54H18L29 32L18 10Z" stroke={color} strokeWidth="2" fill="rgba(251,191,36,0.12)" />
          <line x1="15" y1="10" x2="49" y2="10" stroke="#fef3c7" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="15" y1="54" x2="49" y2="54" stroke="#fef3c7" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="44" r="4" fill={color} />
          <circle cx="32" cy="20" r="2.5" fill="#fff" opacity="0.85" />
        </svg>
      );
    case 'chaos_dice':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <polygon points="32,8 54,20 54,44 32,56 10,44 10,20" stroke={color} strokeWidth="2" fill="rgba(163,230,53,0.12)" />
          <polyline points="10,20 32,32 54,20" stroke={color} strokeWidth="1.5" />
          <line x1="32" y1="32" x2="32" y2="56" stroke={color} strokeWidth="1.5" />
          <circle cx="32" cy="20" r="2.6" fill="#fff" />
          <circle cx="21" cy="39" r="2.4" fill={color} />
          <circle cx="43" cy="39" r="2.4" fill={color} />
        </svg>
      );
    case 'vampire_sigil':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <path d="M32 10C32 10 50 28 50 40C50 50 42 56 32 56C22 56 14 50 14 40C14 28 32 10 32 10Z" stroke={color} strokeWidth="2" fill="rgba(251,113,133,0.16)" />
          <path d="M23 30L27 44L31 33M33 33L37 44L41 30" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'quantum_bomb':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <ellipse cx="32" cy="32" rx="24" ry="10" transform="rotate(30 32 32)" stroke={color} strokeWidth="1.6" />
          <ellipse cx="32" cy="32" rx="24" ry="10" transform="rotate(-30 32 32)" stroke={color} strokeWidth="1.6" />
          <ellipse cx="32" cy="32" rx="24" ry="10" transform="rotate(90 32 32)" stroke="#fed7aa" strokeWidth="1.3" opacity="0.7" />
          <circle cx="32" cy="32" r="7" fill={color} />
          <circle cx="32" cy="32" r="3" fill="#fff" />
        </svg>
      );
    case 'siphon_witch':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <path d="M39 12A20 20 0 1 0 51 44A15 15 0 1 1 39 12Z" stroke={color} strokeWidth="2" fill="rgba(52,211,153,0.16)" />
          <polygon points="44,18 46,24 52,26 46,28 44,34 42,28 36,26 42,24" fill="#fff" />
        </svg>
      );
    case 'gravity_anchor':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <circle cx="32" cy="16" r="6" stroke="#fff" strokeWidth="2" />
          <line x1="32" y1="22" x2="32" y2="52" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="20" y1="30" x2="44" y2="30" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M14 38C14 48 22 54 32 54C42 54 50 48 50 38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="52" r="3" fill="#fff" />
        </svg>
      );
    case 'mind_parasite':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <path d="M8 32C15 18 49 18 56 32C49 46 15 46 8 32Z" stroke={color} strokeWidth="2" fill="rgba(45,212,191,0.13)" />
          <circle cx="32" cy="32" r="9" stroke="#fff" strokeWidth="1.8" />
          <ellipse cx="32" cy="32" rx="3" ry="7" fill={color} />
          <path d="M24 14L28 20M40 14L36 20M32 10V17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'apex_singularity':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10 lg:w-12 lg:h-12" fill="none">
          <polygon points="32,6 39,24 58,24 43,35 48,54 32,43 16,54 21,35 6,24 25,24" stroke={color} strokeWidth="1.8" fill="rgba(250,204,21,0.16)" />
          <circle cx="32" cy="32" r="7" fill="#fff" stroke={color} strokeWidth="2" />
        </svg>
      );
  }
}

interface AnomalyCardViewProps {
  cardId: AnomalyCardId;
  projectedPower?: number;
  projectedBonus?: number;
  selected?: boolean;
  compact?: boolean;
  disabled?: boolean;
  nullified?: boolean;
  shattered?: boolean;
  finalPower?: number;
  stanceBadge?: RealityStance;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

function AnomalyCardView({
  cardId,
  projectedPower,
  projectedBonus = 0,
  selected = false,
  compact = false,
  disabled = false,
  nullified = false,
  shattered = false,
  finalPower,
  stanceBadge,
  onClick,
  onDoubleClick,
  onHover,
}: AnomalyCardViewProps) {
  const def = ANOMALY_CARDS[cardId];
  const aura = getDisplayedAuraTier(cardId);
  const auraStyle = AURA_STYLES[aura];
  const luxuryAccent = LUXURY_CARD_ACCENT[def.rarity] ?? LUXURY_CARD_ACCENT.common;
  const powerDisplay = finalPower !== undefined ? finalPower : projectedPower ?? def.basePower;
  const hasBonus = finalPower !== undefined ? finalPower !== def.basePower : projectedBonus !== 0;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={`relative select-none rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 bg-gradient-to-b from-[#17171a] via-[#111113] to-[#0b0b0d] ${
        selected
          ? 'border-amber-400 ring-1 ring-amber-400/70'
          : `${luxuryAccent.border} hover:border-zinc-500`
      } ${compact ? 'w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] p-2.5' : 'w-[134px] sm:w-[152px] xl:w-[164px] h-[196px] sm:h-[214px] xl:h-[224px] p-2.5'} ${
        disabled ? 'opacity-60 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Luxury Matte Tarot Inner Hairline Frame */}
      <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-white/[0.05]" />

      {/* Top Row: Tarot Roman + Power Orb */}
      <div className="relative z-10 flex items-start justify-between gap-1">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono tracking-[0.18em] text-zinc-400 uppercase leading-none">
            {def.roman} • {def.archetype}
          </span>
          <span
            className={`mt-1 inline-flex w-fit items-center rounded border px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${RARITY_BADGE[def.rarity]}`}
          >
            {def.rarity}
          </span>
        </div>

        <div className="relative flex flex-col items-end">
          <div
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 font-mono font-bold text-base sm:text-lg bg-zinc-950 tabular-nums"
            style={{
              borderColor: luxuryAccent.hex,
              color: hasBonus && powerDisplay > def.basePower ? '#34d399' : hasBonus && powerDisplay < def.basePower ? '#fb7185' : '#fafafa',
            }}
          >
            {powerDisplay}
          </div>
          {hasBonus && (
            <span
              className={`-mt-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-mono font-bold border tabular-nums ${
                powerDisplay > def.basePower
                  ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-300'
                  : 'bg-rose-950/95 border-rose-500/60 text-rose-300'
              }`}
            >
              {powerDisplay > def.basePower ? `+${powerDisplay - def.basePower}` : powerDisplay - def.basePower}
            </span>
          )}
        </div>
      </div>

      {/* Center Emblem */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-0.5">
        <div className="relative flex items-center justify-center rounded-full p-2 border border-zinc-800 bg-zinc-950/85">
          <CardArtworkEmblem cardId={cardId} color={luxuryAccent.hex} />
        </div>
        <h3 className="mt-1.5 text-center text-[11px] sm:text-xs font-semibold tracking-wide text-zinc-50 uppercase leading-tight">
          {def.name}
        </h3>
      </div>

      {/* Ability Box */}
      <div className="relative z-10 rounded-lg border border-zinc-800/90 bg-zinc-950/85 px-2 py-1.5">
        <p className="text-[9px] sm:text-[9.5px] leading-[1.28] text-zinc-300 line-clamp-3">
          {def.ability}
        </p>
      </div>

      {/* Bottom Aura Micro-Row */}
      <div className="relative z-10 mt-1 flex items-center justify-between text-[8px] font-mono uppercase tracking-wider">
        <span className={`px-1.5 py-0.5 rounded border ${auraStyle.badge}`}>
          {cardId === 'bluff_phantom' ? 'AURA: HIGH*' : `AURA: ${aura}`}
        </span>
        {stanceBadge && stanceBadge !== 'hold' ? (
          <span
            className={`px-1.5 py-0.5 rounded font-semibold ${
              stanceBadge === 'double'
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/50'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/50'
            }`}
          >
            {stanceBadge === 'double' ? '×2 STAKES' : 'WARD +1'}
          </span>
        ) : (
          <span className="text-zinc-500 tabular-nums">BASE {def.basePower}</span>
        )}
      </div>

      {/* Nullified / Shattered Stamps */}
      {nullified && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/65 backdrop-blur-[1px]">
          <span className="-rotate-12 rounded-md border border-amber-400 bg-zinc-950 px-2.5 py-1 text-[10px] font-mono font-bold tracking-[0.2em] text-amber-300">
            NULLIFIED
          </span>
        </div>
      )}
      {shattered && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/65 backdrop-blur-[1px]">
          <span className="rotate-12 rounded-md border border-rose-500 bg-zinc-950 px-2.5 py-1 text-[10px] font-mono font-bold tracking-[0.2em] text-rose-300">
            SHATTERED!
          </span>
        </div>
      )}
    </div>
  );
}

function FaceDownAuraCard({
  aura,
  stance,
  label,
  pulsing = true,
}: {
  aura: AuraTier;
  stance?: RealityStance;
  label: string;
  pulsing?: boolean;
}) {
  const style = AURA_STYLES[aura];
  return (
    <div
      className={`relative w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] rounded-2xl border bg-gradient-to-b from-[#17171a] via-[#111113] to-[#0b0b0d] p-3 flex flex-col items-center justify-between overflow-hidden ${style.ring}`}
    >
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-white/[0.06]" />

      <span className="relative z-10 text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-400">
        {label}
      </span>

      <div className="relative z-10 flex flex-col items-center gap-2.5">
        <motion.div
          animate={pulsing ? { scale: [0.96, 1.04, 0.96] } : undefined}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className={`w-16 h-16 rounded-full border flex items-center justify-center bg-zinc-950 ${style.ring}`}
        >
          <Sparkles className={`w-6 h-6 ${style.text}`} />
        </motion.div>
        <span className={`px-2.5 py-1 rounded-md border text-[10px] font-mono font-semibold tracking-wider ${style.badge}`}>
          {style.label} ({getAuraRangeLabel(aura)})
        </span>
      </div>

      <div className="relative z-10 h-5 flex items-center justify-center">
        {stance && stance !== 'hold' ? (
          <span
            className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold uppercase tracking-wider border ${
              stance === 'double'
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
            }`}
          >
            {stance === 'double' ? 'DOUBLE STAKES ×2' : 'WARD SHIELD'}
          </span>
        ) : (
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500">
            SEALED ANOMALY
          </span>
        )}
      </div>
    </div>
  );
}

function PlayerHudStrip({
  player,
  isMe,
  deltaDmg,
  deltaHeal,
  showDeltas,
}: {
  player: RealityPlayer;
  isMe: boolean;
  deltaDmg: number;
  deltaHeal: number;
  showDeltas: boolean;
}) {
  const hpPct = Math.max(0, Math.min(100, (player.hp / MAX_HP) * 100));
  const hpBarColor =
    hpPct > 55
      ? isMe
        ? 'bg-emerald-500'
        : 'bg-rose-500'
      : hpPct > 25
        ? 'bg-amber-400'
        : 'bg-rose-600';

  return (
    <div
      className={`relative flex items-center gap-2.5 rounded-xl border px-3 py-1.5 bg-[#111113] ${
        isMe ? 'border-zinc-800' : 'border-zinc-800'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isMe ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
            <span className="truncate text-xs font-semibold tracking-wide text-zinc-100">
              {player.nickname}
            </span>
            {isMe && (
              <span className="text-[9px] font-mono uppercase text-zinc-500">(YOU)</span>
            )}
            {player.nextRoundCurse < 0 && (
              <span className="inline-flex items-center gap-0.5 rounded border border-rose-500/45 bg-rose-500/10 px-1 py-0.5 text-[8px] font-mono font-semibold text-rose-300 animate-pulse">
                <Skull className="w-2.5 h-2.5" /> {player.nextRoundCurse} PWR
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400/30" />
            <span className="font-mono text-xs font-semibold text-zinc-100 tabular-nums">
              {player.hp}
              <span className="text-zinc-500 font-normal">/{MAX_HP}</span>
            </span>
          </div>
        </div>

        {/* HP Bar */}
        <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
          <motion.div
            animate={{ width: `${hpPct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className={`h-full rounded-full ${hpBarColor}`}
          />
        </div>

        {/* Crowns + Charges + Void */}
        <div className="mt-1 flex items-center justify-between gap-2 text-[9px] font-mono text-zinc-400 tabular-nums">
          <div className="flex items-center gap-0.5" title={`Crowns: ${player.crowns}/${CROWNS_TO_WIN}`}>
            {Array.from({ length: CROWNS_TO_WIN }).map((_, idx) => (
              <Crown
                key={idx}
                className={`w-3 h-3 transition-colors ${
                  idx < player.crowns
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-800'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-rose-400" title="Double Stakes Remaining">
              ×2:{player.doubleUsesLeft}
            </span>
            <span className="text-emerald-400" title="Ward Shields Remaining">
              🛡:{player.wardUsesLeft}
            </span>
            <span className="hidden sm:inline text-zinc-500" title="Deck / Discard Void">
              <Layers className="inline w-2.5 h-2.5 mr-0.5" />
              {player.deck.length}/{player.discard.length}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Damage / Heal Popups */}
      <AnimatePresence>
        {showDeltas && deltaDmg > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: -14, scale: 1.05 }}
            exit={{ opacity: 0, y: -26 }}
            className="pointer-events-none absolute -bottom-3 right-3 z-30 rounded-full border border-rose-500/60 bg-rose-950 px-2 py-0.5 text-[11px] font-mono font-bold text-rose-200 tabular-nums"
          >
            -{deltaDmg} HP
          </motion.div>
        )}
        {showDeltas && deltaHeal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: -14, scale: 1.05 }}
            exit={{ opacity: 0, y: -26 }}
            className="pointer-events-none absolute -bottom-3 left-3 z-30 rounded-full border border-emerald-500/60 bg-emerald-950 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-200 tabular-nums"
          >
            +{deltaHeal} HP
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RealityDraftArena({
  game,
  meIdx,
  soundEnabled,
  onToggleSound,
  onExit,
  onJoinRoom,
  onLockMove,
  onNextRound,
  onPlayAgain,
  busy = false,
}: RealityDraftArenaProps) {
  const [selectedCard, setSelectedCard] = useState<AnomalyCardId | null>(null);
  const [hoveredCard, setHoveredCard] = useState<AnomalyCardId | null>(null);
  const [selectedStance, setSelectedStance] = useState<RealityStance>('hold');
  const [revealStage, setRevealStage] = useState<'slam' | 'flip' | 'math' | 'impact'>('slam');
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [joinName, setJoinName] = useState('');

  const myIndex: 0 | 1 = meIdx === 1 ? 1 : 0;
  const oppIndex: 0 | 1 = myIndex === 0 ? 1 : 0;
  const me: RealityPlayer | undefined = game.players[myIndex];
  const opp: RealityPlayer | undefined = game.players[oppIndex];

  const distortionDef = WORLD_DISTORTIONS[game.distortion];
  const lastClash: ClashResultLog | null = game.lastClash;

  // Reset local selection each new selecting round
  useEffect(() => {
    if (game.state === 'selecting') {
      setSelectedCard(null);
      setHoveredCard(null);
      setSelectedStance('hold');
    }
  }, [game.state, game.round]);

  // Pre-fill guest join nickname from localStorage
  useEffect(() => {
    if (meIdx === -1 && typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('realityCheckNick') || '';
      if (saved) setJoinName(saved);
    }
  }, [meIdx]);

  // 4-Stage Choreographed Clash Animation
  useEffect(() => {
    if (game.state !== 'clash' || !lastClash) return;

    setRevealStage('slam');
    if (soundEnabled) playSound('deal');

    const t1 = window.setTimeout(() => {
      setRevealStage('flip');
      if (soundEnabled) playSound('flip');
    }, 780);

    const t2 = window.setTimeout(() => {
      setRevealStage('math');
      if (soundEnabled) {
        if (lastClash.swapped || lastClash.lowestWins || lastClash.nullifiedIdx !== null) {
          playSound('paradox');
        } else {
          playSound('laser');
        }
      }
    }, 1520);

    const t3 = window.setTimeout(() => {
      setRevealStage('impact');
      setShakeTrigger((n) => n + 1);
      if (soundEnabled) {
        if (lastClash.quantumDetonated || lastClash.shatteredIdx !== null) {
          playSound('hit');
        } else if (lastClash.winnerIdx === myIndex) {
          playSound('win');
        } else if (lastClash.winnerIdx === oppIndex) {
          playSound('hit');
        } else {
          playSound('paradox');
        }
      }
    }, 2280);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [game.state, lastClash, myIndex, oppIndex, soundEnabled]);

  const activePreviewCard = hoveredCard ?? selectedCard;
  const previewCalc = useMemo(() => {
    if (!activePreviewCard || !me) return null;
    return getProjectedSelfPower(
      activePreviewCard,
      game.distortion,
      selectedStance,
      me.discard.length,
      me.nextRoundCurse
    );
  }, [activePreviewCard, game.distortion, me, selectedStance]);

  const handleCopyRoomCode = () => {
    if (!game.gameId) return;
    navigator.clipboard?.writeText(game.gameId).catch(() => {});
    setCopiedCode(true);
    if (soundEnabled) playSound('tick');
    window.setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleConfirmLock = (cardOverride?: AnomalyCardId) => {
    const cardToLock = cardOverride ?? selectedCard;
    if (!cardToLock || !me || me.locked || game.state !== 'selecting' || busy) return;
    if (soundEnabled) {
      playSound(selectedStance === 'ward' ? 'shield' : selectedStance === 'double' ? 'chip' : 'card_pick');
    }
    onLockMove(cardToLock, selectedStance);
  };

  // Guest Join Gate (when arriving at a waiting PvP room via link)
  if (meIdx === -1 && game.state === 'waiting' && onJoinRoom) {
    return (
      <div className="min-h-dvh bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111113] p-6 space-y-4 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950">
            <Swords className="text-amber-400" size={22} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400">
              REALITY DRAFT • ROOM {game.gameId}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
              Enter The Anomaly Duel
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              {game.players[0]?.nickname ?? 'Host'} awaits your tarot deck.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const clean = joinName.trim() || 'Challenger';
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('realityCheckNick', clean);
              }
              onJoinRoom(clean);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Your Callsign..."
              maxLength={14}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-center text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-zinc-50 hover:bg-white py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-950 transition-colors cursor-pointer disabled:opacity-50"
            >
              {busy ? 'Summoning Deck...' : 'Join 1v1 Reality Draft'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Spectator guard if room already full
  if (meIdx === -1) {
    return (
      <div className="min-h-dvh bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-6 text-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Reality Rift Already Sealed</h1>
        <p className="text-xs text-zinc-400">This 1v1 duel already has two duelists locked in.</p>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-zinc-50 hover:bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-950 transition-colors cursor-pointer"
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  const showMyDeltaDmg = game.state === 'clash' && revealStage === 'impact' && lastClash ? lastClash.damageTaken[myIndex] : 0;
  const showMyDeltaHeal = game.state === 'clash' && revealStage === 'impact' && lastClash ? lastClash.healed[myIndex] : 0;
  const showOppDeltaDmg = game.state === 'clash' && revealStage === 'impact' && lastClash ? lastClash.damageTaken[oppIndex] : 0;
  const showOppDeltaHeal = game.state === 'clash' && revealStage === 'impact' && lastClash ? lastClash.healed[oppIndex] : 0;

  const isVictory = game.winnerUid !== null && game.winnerUid === me?.uid;
  const isTie = game.winnerUid === 'TIE';

  return (
    <motion.div
      key={`arena-shake-${shakeTrigger}`}
      animate={
        shakeTrigger > 0
          ? { x: [0, -10, 10, -7, 7, -3, 0], y: [0, 4, -4, 3, -2, 0] }
          : { x: 0, y: 0 }
      }
      transition={{ duration: 0.42, ease: 'easeOut' }}
      className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col justify-between relative selection:bg-amber-500/20"
    >
      {/* ─── TOP HUD BAR ─── */}
      <header className="relative z-20 shrink-0 px-3 sm:px-5 pt-2.5 pb-2 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-[#111113] px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Exit</span>
            </button>

            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-[#111113] px-2.5 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold tracking-tight text-zinc-50">
                Reality Draft
              </span>
              <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-amber-400 tabular-nums">
                R{game.round}
              </span>
            </div>

            {game.mode === 'multi' && game.gameId && (
              <button
                type="button"
                onClick={handleCopyRoomCode}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-[#111113] px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-300 hover:border-zinc-700 transition-colors cursor-pointer"
                title="Copy Room Code"
              >
                {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-zinc-400" />}
                {game.gameId}
              </button>
            )}
          </div>

          {/* Center-Right Dual Player HUD */}
          <div className="order-3 lg:order-2 w-full lg:w-auto lg:flex-1 max-w-2xl grid grid-cols-2 gap-2">
            {me && (
              <PlayerHudStrip
                player={me}
                isMe={true}
                deltaDmg={showMyDeltaDmg}
                deltaHeal={showMyDeltaHeal}
                showDeltas={game.state === 'clash' && revealStage === 'impact'}
              />
            )}
            {opp ? (
              <PlayerHudStrip
                player={opp}
                isMe={false}
                deltaDmg={showOppDeltaDmg}
                deltaHeal={showOppDeltaHeal}
                showDeltas={game.state === 'clash' && revealStage === 'impact'}
              />
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-[#111113] px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Awaiting Challenger...
              </div>
            )}
          </div>

          {/* Right Utility Buttons */}
          <div className="order-2 lg:order-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playSound('rule_check');
                setShowCodex(true);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-[#111113] px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Anomaly Codex & Rules"
            >
              <BookOpen size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Codex</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              className="rounded-xl border border-zinc-800 bg-[#111113] p-1.5 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors cursor-pointer"
              aria-label="Toggle Audio"
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-zinc-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── CENTER REALITY DISTORTION ALTAR + CLASH STAGE ─── */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-3 sm:px-5 py-1.5 gap-2.5">
        {game.state === 'waiting' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111113] p-6 text-center space-y-4"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/40 bg-zinc-950">
              <Sparkles className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '9s' }} />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-400">
                DIMENSIONAL RIFT OPEN
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
                Share Your Room Code
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                First duelist to drop rival to 0 HP or win {CROWNS_TO_WIN} Clashes claims reality.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-6 py-3 font-mono text-2xl font-bold tracking-[0.28em] text-amber-400">
                {game.gameId}
              </div>
              <button
                type="button"
                onClick={handleCopyRoomCode}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Copy Code"
              >
                {copiedCode ? <Check className="text-emerald-400" size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 animate-pulse">
              Listening for Challenger Signal...
            </p>
          </motion.div>
        ) : (
          <>
            {/* REALITY DISTORTION ALTAR BANNER */}
            <motion.div
              key={game.distortion}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-[#111113] px-4 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-400/45 bg-zinc-950">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0.5 rounded-full border border-dashed border-amber-400/45"
                  />
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500">
                      WORLD DISTORTION
                    </span>
                    <span className="rounded-md border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono font-semibold uppercase text-amber-300">
                      {distortionDef.shortRule}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold tracking-tight text-zinc-50 truncate">
                    {distortionDef.name}{' '}
                    <span className="text-xs font-normal text-zinc-400 hidden md:inline">
                      — {distortionDef.rule}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 shrink-0 hidden sm:block">
                {game.state === 'clash'
                  ? lastClash?.lowestWins
                    ? 'LOWEST WINS'
                    : 'HIGHEST WINS'
                  : game.distortion === 'INVERTED_GRAVITY'
                    ? 'LOWEST WINS'
                    : 'HIGHEST WINS'}
              </div>
            </motion.div>

            {/* CLASH ARENA TABLE */}
            <div className="w-full max-w-4xl flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
              {game.state === 'selecting' && me && (
                <div className="w-full flex items-center justify-center gap-4 sm:gap-10">
                  {/* YOUR SUMMON SLOT */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-[0.24em] text-emerald-400">
                      {me.locked ? 'SEALED ON ALTAR' : 'YOUR SUMMON'}
                    </span>

                    {me.locked && me.lockedCard ? (
                      <motion.div
                        initial={{ scale: 1.15, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      >
                        <FaceDownAuraCard
                          aura={getDisplayedAuraTier(me.lockedCard)}
                          stance={me.lockedStance}
                          label="LOCKED"
                        />
                      </motion.div>
                    ) : activePreviewCard ? (
                      <motion.div
                        key={activePreviewCard}
                        initial={{ opacity: 0.6, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                      >
                        <AnomalyCardView
                          cardId={activePreviewCard}
                          projectedPower={previewCalc?.total}
                          projectedBonus={previewCalc?.bonus}
                          stanceBadge={selectedStance}
                          compact
                        />
                      </motion.div>
                    ) : (
                      <div className="w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] rounded-2xl border border-dashed border-zinc-800 bg-[#111113]/60 flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Swords className="w-6 h-6 text-zinc-600" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                          Pick an Anomaly Card Below
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CENTER VS VORTEX */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-zinc-800 bg-[#111113]">
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-1 rounded-full border border-dashed border-amber-400/45"
                      />
                      <span className="font-mono font-bold text-base sm:text-lg tracking-wider text-amber-400">
                        VS
                      </span>
                    </div>
                    {previewCalc && !me.locked && (
                      <div className="rounded-lg border border-zinc-800 bg-[#111113] px-2.5 py-1 text-center font-mono text-[10px] tabular-nums">
                        <span className="text-zinc-500">EST </span>
                        <span className="font-semibold text-amber-300">{previewCalc.total} PWR</span>
                      </div>
                    )}
                  </div>

                  {/* RIVAL SUMMON SLOT */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-[0.24em] text-rose-400">
                      {opp?.nickname ?? 'RIVAL'}
                    </span>

                    {opp?.locked ? (
                      <motion.div
                        initial={{ scale: 1.15, y: -26, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        className="w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] rounded-2xl border border-rose-500/50 bg-[#111113] flex flex-col items-center justify-center gap-2.5 p-4 text-center"
                      >
                        <Lock className="w-7 h-7 text-rose-400 animate-pulse" />
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-rose-300">
                          ANOMALY SEALED
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          Lock yours to clash!
                        </span>
                      </motion.div>
                    ) : (
                      <div className="w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] rounded-2xl border border-dashed border-zinc-800 bg-[#111113]/60 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                          className="h-10 w-10 rounded-full border border-dashed border-zinc-700 flex items-center justify-center"
                        >
                          <Sparkles className="w-4 h-4 text-amber-400/70" />
                        </motion.div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                          {opp?.isBot ? 'Oracle Calculating...' : 'Rival Choosing...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CLASH REVEAL SEQUENCE */}
              {game.state === 'clash' && lastClash && (
                <div className="w-full flex flex-col items-center gap-2">
                  <div className="w-full flex items-start justify-center gap-3 sm:gap-8">
                    {/* MY CLASH CARD + MATH */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-[0.24em] text-emerald-400">
                        {me?.nickname}
                      </span>

                      <div className="relative" style={{ perspective: '1000px' }}>
                        <motion.div
                          initial={{ y: 36, scale: 1.12, rotateY: 180 }}
                          animate={{
                            y: 0,
                            scale:
                              revealStage === 'impact' && lastClash.winnerIdx === myIndex
                                ? 1.05
                                : 1,
                            rotateY: revealStage === 'slam' ? 180 : 0,
                          }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {revealStage === 'slam' ? (
                            <div style={{ transform: 'rotateY(180deg)' }}>
                              <FaceDownAuraCard
                                aura={lastClash.displayedAuras[myIndex]}
                                stance={lastClash.stances[myIndex]}
                                label="YOUR AURA"
                              />
                            </div>
                          ) : (
                            <AnomalyCardView
                              cardId={lastClash.cards[myIndex]}
                              finalPower={
                                revealStage === 'math' || revealStage === 'impact'
                                  ? lastClash.finalPowers[myIndex]
                                  : lastClash.basePowers[myIndex]
                              }
                              stanceBadge={lastClash.stances[myIndex]}
                              nullified={
                                (revealStage === 'math' || revealStage === 'impact') &&
                                lastClash.nullifiedIdx === myIndex
                              }
                              shattered={
                                (revealStage === 'math' || revealStage === 'impact') &&
                                lastClash.shatteredIdx === myIndex
                              }
                              compact
                            />
                          )}
                        </motion.div>
                      </div>

                      {/* Step-by-step Power Math Chips */}
                      <div className="min-h-[42px] max-w-[185px] flex flex-wrap items-center justify-center gap-1">
                        {(revealStage === 'math' || revealStage === 'impact') &&
                          lastClash.mathSteps[myIndex].map((step: PowerMathStep, i: number) => (
                            <motion.span
                              key={`${step.label}-${i}`}
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.14 }}
                              className={`rounded-md border px-1.5 py-0.5 text-[9px] font-mono font-semibold tabular-nums ${
                                step.tone === 'paradox'
                                  ? 'border-amber-400/55 bg-amber-500/10 text-amber-200'
                                  : step.tone === 'distortion'
                                    ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                                    : step.tone === 'buff'
                                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                      : step.tone === 'debuff'
                                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                                        : 'border-zinc-800 bg-zinc-950 text-zinc-300'
                              }`}
                            >
                              {i === 0
                                ? `Base ${step.value}`
                                : `${step.label} ${step.delta >= 0 ? `+${step.delta}` : step.delta} → ${step.value}`}
                            </motion.span>
                          ))}
                      </div>
                    </div>

                    {/* CENTER CLASH VERDICT CORE */}
                    <div className="flex flex-col items-center justify-center self-center gap-2 max-w-[200px] sm:max-w-[240px] text-center">
                      {revealStage === 'slam' && (
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="rounded-xl border border-zinc-800 bg-[#111113] px-3.5 py-2.5"
                        >
                          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-400 animate-pulse">
                            SCANNING AURAS...
                          </p>
                        </motion.div>
                      )}

                      {revealStage === 'flip' && (
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="rounded-xl border border-zinc-800 bg-[#111113] px-3.5 py-2.5"
                        >
                          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-200">
                            ANOMALIES REVEALED
                          </p>
                        </motion.div>
                      )}

                      {revealStage === 'math' && (
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="rounded-xl border border-amber-400/45 bg-[#111113] px-3.5 py-2.5 space-y-1"
                        >
                          <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-amber-400">
                            COMPUTING REALITY
                          </p>
                          <p className="text-xl font-bold font-mono text-zinc-50 tabular-nums">
                            {lastClash.finalPowers[myIndex]}{' '}
                            <span className="text-xs text-zinc-500">VS</span>{' '}
                            {lastClash.finalPowers[oppIndex]}
                          </p>
                          {lastClash.lowestWins && (
                            <span className="inline-block rounded bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
                              LOWEST WINS!
                            </span>
                          )}
                        </motion.div>
                      )}

                      {revealStage === 'impact' && (
                        <motion.div
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`rounded-2xl border bg-[#111113] px-4 py-3 space-y-1.5 ${
                            lastClash.winnerIdx === myIndex
                              ? 'border-emerald-500/60'
                              : lastClash.winnerIdx === oppIndex
                                ? 'border-rose-500/60'
                                : 'border-amber-400/60'
                          }`}
                        >
                          <p
                            className={`text-sm sm:text-base font-semibold uppercase tracking-wide ${
                              lastClash.winnerIdx === myIndex
                                ? 'text-emerald-400'
                                : lastClash.winnerIdx === oppIndex
                                  ? 'text-rose-400'
                                  : 'text-amber-300'
                            }`}
                          >
                            {lastClash.winnerIdx === myIndex
                              ? 'CLASH VICTORY'
                              : lastClash.winnerIdx === oppIndex
                                ? 'CLASH DEFEAT'
                                : 'PARADOX TIE'}
                          </p>

                          <div className="flex items-center justify-center gap-2 font-mono text-lg font-bold text-zinc-50 tabular-nums">
                            <span className="text-emerald-400">{lastClash.finalPowers[myIndex]}</span>
                            <span className="text-[10px] text-zinc-500">
                              {lastClash.lowestWins ? '(<)' : '(>)'}
                            </span>
                            <span className="text-rose-400">{lastClash.finalPowers[oppIndex]}</span>
                          </div>

                          {lastClash.damageMultiplier > 1 && (
                            <span className="inline-block rounded-md border border-rose-500/45 bg-rose-500/10 px-2 py-0.5 text-[9px] font-mono font-semibold text-rose-300">
                              ×{lastClash.damageMultiplier} DAMAGE MULTIPLIER
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={busy}
                            onClick={onNextRound}
                            className="mt-1 w-full rounded-xl bg-zinc-50 hover:bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-950 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {lastClash.pendingMatchWinnerUid
                              ? 'Claim Final Verdict'
                              : 'Next Round →'}
                          </button>
                        </motion.div>
                      )}
                    </div>

                    {/* RIVAL CLASH CARD + MATH */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-[0.24em] text-rose-400">
                        {opp?.nickname}
                      </span>

                      <div className="relative" style={{ perspective: '1000px' }}>
                        <motion.div
                          initial={{ y: -36, scale: 1.12, rotateY: 180 }}
                          animate={{
                            y: 0,
                            scale:
                              revealStage === 'impact' && lastClash.winnerIdx === oppIndex
                                ? 1.05
                                : 1,
                            rotateY: revealStage === 'slam' ? 180 : 0,
                          }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {revealStage === 'slam' ? (
                            <div style={{ transform: 'rotateY(180deg)' }}>
                              <FaceDownAuraCard
                                aura={lastClash.displayedAuras[oppIndex]}
                                stance={lastClash.stances[oppIndex]}
                                label="RIVAL AURA"
                              />
                            </div>
                          ) : (
                            <AnomalyCardView
                              cardId={lastClash.cards[oppIndex]}
                              finalPower={
                                revealStage === 'math' || revealStage === 'impact'
                                  ? lastClash.finalPowers[oppIndex]
                                  : lastClash.basePowers[oppIndex]
                              }
                              stanceBadge={lastClash.stances[oppIndex]}
                              nullified={
                                (revealStage === 'math' || revealStage === 'impact') &&
                                lastClash.nullifiedIdx === oppIndex
                              }
                              shattered={
                                (revealStage === 'math' || revealStage === 'impact') &&
                                lastClash.shatteredIdx === oppIndex
                              }
                              compact
                            />
                          )}
                        </motion.div>
                      </div>

                      {/* Step-by-step Power Math Chips */}
                      <div className="min-h-[42px] max-w-[185px] flex flex-wrap items-center justify-center gap-1">
                        {(revealStage === 'math' || revealStage === 'impact') &&
                          lastClash.mathSteps[oppIndex].map((step: PowerMathStep, i: number) => (
                            <motion.span
                              key={`${step.label}-${i}`}
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.14 }}
                              className={`rounded-md border px-1.5 py-0.5 text-[9px] font-mono font-semibold tabular-nums ${
                                step.tone === 'paradox'
                                  ? 'border-amber-400/55 bg-amber-500/10 text-amber-200'
                                  : step.tone === 'distortion'
                                    ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                                    : step.tone === 'buff'
                                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                      : step.tone === 'debuff'
                                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                                        : 'border-zinc-800 bg-zinc-950 text-zinc-300'
                              }`}
                            >
                              {i === 0
                                ? `Base ${step.value}`
                                : `${step.label} ${step.delta >= 0 ? `+${step.delta}` : step.delta} → ${step.value}`}
                            </motion.span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Clash Event Feed Strip */}
                  {(revealStage === 'math' || revealStage === 'impact') &&
                    lastClash.events.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-3xl rounded-xl border border-zinc-800 bg-[#111113] px-3 py-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-mono text-zinc-300"
                      >
                        {lastClash.events.slice(0, 3).map((evt: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                            {evt}
                          </span>
                        ))}
                      </motion.div>
                    )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ─── BOTTOM STANCE CONTROLS + FANNED 3D TAROT HAND ─── */}
      {me && game.state !== 'waiting' && (
        <section className="relative z-20 shrink-0 px-3 sm:px-5 pb-3 pt-1">
          <div className="mx-auto max-w-5xl flex flex-col items-center gap-2">
            {/* Tactical Stance Bar + Lock In CTA */}
            <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-800 bg-[#111113] px-3 py-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-zinc-500 mr-1 hidden sm:inline">
                  STANCE
                </span>

                <button
                  type="button"
                  disabled={me.locked || game.state !== 'selecting'}
                  onClick={() => {
                    setSelectedStance('hold');
                    if (soundEnabled) playSound('tick');
                  }}
                  className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    selectedStance === 'hold'
                      ? 'border-zinc-50 bg-zinc-50 text-zinc-950'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
                  } disabled:opacity-45`}
                >
                  HOLD
                </button>

                <button
                  type="button"
                  disabled={me.locked || game.state !== 'selecting' || me.doubleUsesLeft <= 0}
                  onClick={() => {
                    setSelectedStance('double');
                    if (soundEnabled) playSound('chip');
                  }}
                  className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    selectedStance === 'double'
                      ? 'border-rose-500 bg-rose-500/15 text-rose-200'
                      : 'border-zinc-800 bg-zinc-950 text-rose-300/80 hover:border-rose-500/45'
                  } disabled:opacity-35`}
                >
                  <Flame size={12} />
                  DOUBLE ×2
                  <span className="rounded bg-zinc-900 px-1 text-[9px] tabular-nums">{me.doubleUsesLeft}</span>
                </button>

                <button
                  type="button"
                  disabled={me.locked || game.state !== 'selecting' || me.wardUsesLeft <= 0}
                  onClick={() => {
                    setSelectedStance('ward');
                    if (soundEnabled) playSound('shield');
                  }}
                  className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    selectedStance === 'ward'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200'
                      : 'border-zinc-800 bg-zinc-950 text-emerald-300/80 hover:border-emerald-500/45'
                  } disabled:opacity-35`}
                >
                  <Shield size={12} />
                  WARD +1
                  <span className="rounded bg-zinc-900 px-1 text-[9px] tabular-nums">{me.wardUsesLeft}</span>
                </button>
              </div>

              <button
                type="button"
                disabled={!selectedCard || me.locked || game.state !== 'selecting' || busy}
                onClick={() => handleConfirmLock()}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-zinc-50 hover:bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-950 transition-colors cursor-pointer disabled:opacity-35"
              >
                <Swords size={13} />
                {me.locked
                  ? 'Waiting Rival...'
                  : selectedCard
                    ? `Lock ${ANOMALY_CARDS[selectedCard].name}`
                    : 'Select Card'}
              </button>
            </div>

            {/* Fanned 5-Card Matte Tarot Hand */}
            <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar pt-4 pb-1 px-2">
              {me.hand.map((cardId, idx) => {
                const count = me.hand.length;
                const center = (count - 1) / 2;
                const offset = idx - center;
                const fanAngle = offset * 2.8;
                const fanLiftY = Math.abs(offset) * 5;
                const isSelected = selectedCard === cardId;
                const canPick = game.state === 'selecting' && !me.locked && !busy;
                const calc = getProjectedSelfPower(
                  cardId,
                  game.distortion,
                  selectedStance,
                  me.discard.length,
                  me.nextRoundCurse
                );

                return (
                  <motion.div
                    key={`${cardId}-${idx}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{
                      opacity: 1,
                      y: isSelected ? -14 : fanLiftY,
                      rotateZ: isSelected ? 0 : fanAngle,
                      scale: isSelected ? 1.05 : 1,
                    }}
                    whileHover={
                      canPick ? { y: -14, rotateZ: 0, scale: 1.06 } : undefined
                    }
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className={`shrink-0 ${isSelected ? 'z-30' : 'hover:z-30'}`}
                  >
                    <AnomalyCardView
                      cardId={cardId}
                      projectedPower={calc.total}
                      projectedBonus={calc.bonus}
                      selected={isSelected}
                      disabled={!canPick}
                      onClick={() => {
                        setSelectedCard(cardId);
                        if (soundEnabled) playSound('card_pick');
                      }}
                      onDoubleClick={() => handleConfirmLock(cardId)}
                      onHover={(h) => setHoveredCard(h ? cardId : null)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── MATCH FINISHED OVERLAY ─── */}
      <AnimatePresence>
        {game.state === 'finished' && me && opp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111113] p-6 text-center space-y-4"
            >
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${
                  isVictory
                    ? 'border-amber-400/50 bg-amber-500/10 text-amber-400'
                    : isTie
                      ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                      : 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                }`}
              >
                {isVictory ? <Crown size={28} /> : isTie ? <Sparkles size={26} /> : <Skull size={26} />}
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-400">
                  REALITY COLLAPSED • {game.history.length} CLASHES
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
                  {isVictory ? 'Reality Claimed' : isTie ? 'Paradox Draw' : 'Shattered'}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {isVictory
                    ? `You outplayed ${opp.nickname} across the tarot rift.`
                    : isTie
                      ? 'Both duelists fell into the singularity simultaneously.'
                      : `${opp.nickname} warped reality in their favor.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs tabular-nums">
                <div className="space-y-1">
                  <p className="text-[10px] text-emerald-400 uppercase">{me.nickname}</p>
                  <p className="text-lg font-bold text-zinc-50">{me.hp} HP</p>
                  <p className="text-[10px] text-amber-400">
                    {me.crowns}/{CROWNS_TO_WIN} Crowns
                  </p>
                </div>
                <div className="space-y-1 border-l border-zinc-800">
                  <p className="text-[10px] text-rose-400 uppercase">{opp.nickname}</p>
                  <p className="text-lg font-bold text-zinc-50">{opp.hp} HP</p>
                  <p className="text-[10px] text-amber-400">
                    {opp.crowns}/{CROWNS_TO_WIN} Crowns
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {(game.mode === 'solo' || myIndex === 0) ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onPlayAgain}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-50 hover:bg-white py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-950 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> Rematch
                  </button>
                ) : (
                  <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    Host Can Start Rematch
                  </div>
                )}
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-100 transition-colors cursor-pointer"
                >
                  Lobby
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ANOMALY CODEX MODAL ─── */}
      <AnimatePresence>
        {showCodex && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCodex(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[86dvh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#111113] p-5 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400">
                    TAROT ARCHIVE
                  </p>
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
                    Reality Draft Codex
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodex(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 p-2 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="font-mono text-[10px] uppercase text-emerald-400 mb-1">Win Condition</p>
                  <p className="text-zinc-300">
                    Start at 30 HP. First to drop rival to 0 HP OR win 4 Clashes claims victory.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="font-mono text-[10px] uppercase text-rose-400 mb-1">Clash Damage</p>
                  <p className="text-zinc-300">
                    HOLD deals Power Diff + 4 (min 5). DOUBLE STAKES (×2) doubles all clash damage!
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="font-mono text-[10px] uppercase text-amber-400 mb-1">Ward &amp; Auras</p>
                  <p className="text-zinc-300">
                    WARD gives +1 Power &amp; halves damage taken. Face-down cards pulse LOW (0–3), MID (4–6), or HIGH (7–9).
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
                  5 World Distortions
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ALL_DISTORTION_IDS.map((id) => {
                    const d = WORLD_DISTORTIONS[id];
                    return (
                      <div key={id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5">
                        <p className="text-xs font-semibold uppercase text-amber-300">
                          {d.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-400">{d.rule}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
                  12 Anomaly Cards
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ALL_CARD_IDS.map((id) => {
                    const c = ANOMALY_CARDS[id];
                    const accent = LUXURY_CARD_ACCENT[c.rarity] ?? LUXURY_CARD_ACCENT.common;
                    return (
                      <div key={id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 flex items-start gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono font-bold text-sm bg-[#111113]"
                          style={{ borderColor: accent.hex, color: accent.hex }}
                        >
                          {c.basePower}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase text-zinc-100">
                            {c.name}{' '}
                            <span className="text-[9px] font-mono text-zinc-500">({c.roman})</span>
                          </p>
                          <p className="mt-0.5 text-[10.5px] leading-snug text-zinc-400">{c.ability}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
