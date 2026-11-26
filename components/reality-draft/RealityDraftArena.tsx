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
  { label: string; ring: string; badge: string; pulse: string; text: string }
> = {
  LOW: {
    label: 'LOW AURA',
    ring: 'border-cyan-400/75 shadow-[0_0_28px_rgba(34,211,238,0.45)]',
    badge: 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200',
    pulse: 'bg-cyan-400/25',
    text: 'text-cyan-300',
  },
  MID: {
    label: 'MID AURA',
    ring: 'border-amber-400/75 shadow-[0_0_28px_rgba(251,191,36,0.45)]',
    badge: 'bg-amber-500/20 border-amber-400/60 text-amber-200',
    pulse: 'bg-amber-400/25',
    text: 'text-amber-300',
  },
  HIGH: {
    label: 'HIGH AURA',
    ring: 'border-fuchsia-400/80 shadow-[0_0_32px_rgba(232,121,249,0.55)]',
    badge: 'bg-fuchsia-500/25 border-fuchsia-400/70 text-fuchsia-200',
    pulse: 'bg-fuchsia-500/30',
    text: 'text-fuchsia-300',
  },
};

const RARITY_BADGE: Record<string, string> = {
  common: 'text-teal-300 border-teal-400/40 bg-teal-950/60',
  rare: 'text-cyan-300 border-cyan-400/40 bg-cyan-950/60',
  epic: 'text-fuchsia-300 border-fuchsia-400/45 bg-fuchsia-950/60',
  mythic: 'text-amber-200 border-amber-400/55 bg-amber-950/60',
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
  const powerDisplay = finalPower !== undefined ? finalPower : projectedPower ?? def.basePower;
  const hasBonus = finalPower !== undefined ? finalPower !== def.basePower : projectedBonus !== 0;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={`relative select-none rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 bg-gradient-to-b from-[#131024] via-[#0b0918] to-[#06050e] ${
        selected
          ? 'border-white ring-2 ring-fuchsia-400/80 shadow-[0_0_32px_rgba(232,121,249,0.55)]'
          : `${def.borderClass} ${def.glowClass}`
      } ${compact ? 'w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] p-2.5' : 'w-[134px] sm:w-[152px] xl:w-[164px] h-[196px] sm:h-[214px] xl:h-[224px] p-2.5'} ${
        disabled ? 'opacity-60 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Holographic Foil Layer */}
      <div className={`absolute inset-0 opacity-35 ${def.foilClass}`} />
      <div
        className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-35"
        style={{ backgroundColor: def.accentHex }}
      />

      {/* Top Row: Tarot Roman + Power Orb */}
      <div className="relative z-10 flex items-start justify-between gap-1">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-400 uppercase leading-none">
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
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 font-black text-base sm:text-lg shadow-lg"
            style={{
              borderColor: def.accentHex,
              background: `radial-gradient(circle at 30% 30%, ${def.accentHex}44, #090614 85%)`,
              color: hasBonus && powerDisplay > def.basePower ? '#a3e635' : hasBonus && powerDisplay < def.basePower ? '#fb7185' : '#ffffff',
            }}
          >
            {powerDisplay}
          </div>
          {hasBonus && (
            <span
              className={`-mt-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-mono font-bold border ${
                powerDisplay > def.basePower
                  ? 'bg-lime-950/90 border-lime-400/60 text-lime-300'
                  : 'bg-rose-950/90 border-rose-400/60 text-rose-300'
              }`}
            >
              {powerDisplay > def.basePower ? `+${powerDisplay - def.basePower}` : powerDisplay - def.basePower}
            </span>
          )}
        </div>
      </div>

      {/* Center Emblem */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-0.5">
        <div
          className="relative flex items-center justify-center rounded-full p-2 border border-white/10 bg-black/45"
          style={{ boxShadow: `inset 0 0 18px ${def.accentHex}33` }}
        >
          <CardArtworkEmblem cardId={cardId} color={def.accentHex} />
        </div>
        <h3 className="mt-1.5 text-center text-[11px] sm:text-xs font-black tracking-tight text-white uppercase leading-tight">
          {def.name}
        </h3>
      </div>

      {/* Ability Box */}
      <div className="relative z-10 rounded-lg border border-white/10 bg-black/65 px-2 py-1.5">
        <p className="text-[9px] sm:text-[9.5px] leading-[1.25] text-zinc-200 line-clamp-3">
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
            className={`px-1.5 py-0.5 rounded font-bold ${
              stanceBadge === 'double'
                ? 'bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/60'
                : 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/60'
            }`}
          >
            {stanceBadge === 'double' ? '×2 STAKES' : 'WARD +1'}
          </span>
        ) : (
          <span className="text-zinc-500">BASE {def.basePower}</span>
        )}
      </div>

      {/* Nullified / Shattered Stamps */}
      {nullified && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-fuchsia-950/40 backdrop-blur-[1px]">
          <span className="-rotate-12 rounded-md border-2 border-fuchsia-400 bg-black/85 px-2.5 py-1 text-[10px] font-black tracking-[0.2em] text-fuchsia-300 shadow-lg">
            NULLIFIED
          </span>
        </div>
      )}
      {shattered && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-sky-950/45 backdrop-blur-[1px]">
          <span className="rotate-12 rounded-md border-2 border-rose-400 bg-black/85 px-2.5 py-1 text-[10px] font-black tracking-[0.2em] text-rose-300 shadow-lg">
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
      className={`relative w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] rounded-2xl border-2 bg-gradient-to-b from-[#150c28] via-[#0a0717] to-[#04030a] p-3 flex flex-col items-center justify-between overflow-hidden ${style.ring}`}
    >
      <div className="absolute inset-0 bg-dot-matrix opacity-35" />
      <motion.div
        animate={pulsing ? { opacity: [0.25, 0.75, 0.25], scale: [0.92, 1.08, 0.92] } : undefined}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className={`pointer-events-none absolute inset-6 rounded-full blur-2xl ${style.pulse}`}
      />

      <span className="relative z-10 text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-400">
        {label}
      </span>

      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center bg-black/60 ${style.ring}`}>
          <Sparkles className={`w-7 h-7 ${style.text}`} />
        </div>
        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-black tracking-widest ${style.badge}`}>
          {style.label} ({getAuraRangeLabel(aura)})
        </span>
      </div>

      <div className="relative z-10 h-5 flex items-center justify-center">
        {stance && stance !== 'hold' ? (
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider border ${
              stance === 'double'
                ? 'bg-fuchsia-500/30 border-fuchsia-400 text-fuchsia-200'
                : 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
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
        ? 'from-cyan-400 to-fuchsia-400'
        : 'from-rose-400 to-amber-400'
      : hpPct > 25
        ? 'from-amber-400 to-orange-500'
        : 'from-rose-500 to-red-600';

  return (
    <div
      className={`relative flex items-center gap-2.5 rounded-xl border px-3 py-1.5 backdrop-blur-md ${
        isMe
          ? 'border-cyan-400/30 bg-cyan-950/25'
          : 'border-fuchsia-400/30 bg-fuchsia-950/25'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isMe ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-fuchsia-400 shadow-[0_0_8px_#e879f9]'
              }`}
            />
            <span className="truncate text-xs font-black uppercase tracking-wide text-white">
              {player.nickname}
            </span>
            {isMe && (
              <span className="text-[9px] font-mono uppercase text-cyan-300/80">(YOU)</span>
            )}
            {player.nextRoundCurse < 0 && (
              <span className="inline-flex items-center gap-0.5 rounded border border-teal-400/60 bg-teal-950/80 px-1 py-0.5 text-[8px] font-mono font-bold text-teal-200 animate-pulse">
                <Skull className="w-2.5 h-2.5" /> {player.nextRoundCurse} PWR
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400/40" />
            <span className="font-mono text-xs font-black text-white">
              {player.hp}
              <span className="text-zinc-500 font-normal">/{MAX_HP}</span>
            </span>
          </div>
        </div>

        {/* HP Bar */}
        <div className="mt-1 h-2 w-full rounded-full bg-black/70 border border-white/10 overflow-hidden">
          <motion.div
            animate={{ width: `${hpPct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className={`h-full rounded-full bg-gradient-to-r ${hpBarColor}`}
          />
        </div>

        {/* Crowns + Charges + Void */}
        <div className="mt-1 flex items-center justify-between gap-2 text-[9px] font-mono text-zinc-400">
          <div className="flex items-center gap-0.5" title={`Crowns: ${player.crowns}/${CROWNS_TO_WIN}`}>
            {Array.from({ length: CROWNS_TO_WIN }).map((_, idx) => (
              <Crown
                key={idx}
                className={`w-3 h-3 transition-all ${
                  idx < player.crowns
                    ? 'text-amber-300 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                    : 'text-zinc-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-fuchsia-300/90" title="Double Stakes Remaining">
              ×2:{player.doubleUsesLeft}
            </span>
            <span className="text-cyan-300/90" title="Ward Shields Remaining">
              🛡:{player.wardUsesLeft}
            </span>
            <span className="hidden sm:inline text-zinc-400" title="Deck / Discard Void">
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
            className="pointer-events-none absolute -bottom-3 right-3 z-30 rounded-full border border-rose-400 bg-rose-950/95 px-2 py-0.5 text-[11px] font-mono font-black text-rose-200 shadow-lg"
          >
            -{deltaDmg} HP
          </motion.div>
        )}
        {showDeltas && deltaHeal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: -14, scale: 1.05 }}
            exit={{ opacity: 0, y: -26 }}
            className="pointer-events-none absolute -bottom-3 left-3 z-30 rounded-full border border-emerald-400 bg-emerald-950/95 px-2 py-0.5 text-[11px] font-mono font-black text-emerald-200 shadow-lg"
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
      <div className="min-h-dvh bg-[#05030c] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className={`pointer-events-none fixed inset-0 bg-gradient-to-b ${distortionDef.auraGradient}`} />
        <div className="pointer-events-none fixed inset-0 bg-grid-white opacity-30" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-fuchsia-400/30 bg-black/75 backdrop-blur-xl p-6 shadow-2xl space-y-4 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-400/40 bg-fuchsia-950/60">
            <Swords className="text-fuchsia-300" size={22} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-fuchsia-400">
              REALITY DRAFT • ROOM {game.gameId}
            </p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-tight">
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
              className="w-full rounded-xl border border-white/15 bg-zinc-950 px-3.5 py-2.5 text-center text-sm font-bold text-white focus:border-fuchsia-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 py-3 text-xs font-black uppercase tracking-widest text-black shadow-lg disabled:opacity-50"
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
      <div className="min-h-dvh bg-[#05030c] text-white flex flex-col items-center justify-center p-6 text-center gap-4">
        <h1 className="text-2xl font-black uppercase">Reality Rift Already Sealed</h1>
        <p className="text-xs text-zinc-400">This 1v1 duel already has two duelists locked in.</p>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-fuchsia-500 px-5 py-2.5 text-xs font-black uppercase text-black"
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
      className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#05030c] text-white flex flex-col justify-between relative selection:bg-fuchsia-500/30"
    >
      {/* Dynamic Cosmic Distortion Atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-b transition-colors duration-700 ${distortionDef.auraGradient}`}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full blur-[160px] opacity-25 transition-colors duration-700"
          style={{ backgroundColor: distortionDef.accentHex }}
        />
        <div className="absolute inset-0 bg-grid-white opacity-25" />
      </div>

      {/* ─── TOP HUD BAR ─── */}
      <header className="relative z-20 shrink-0 px-3 sm:px-5 pt-2.5 pb-1.5">
        <div className="mx-auto max-w-6xl flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/55 px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-300 hover:border-white/25 hover:text-white"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Exit</span>
            </button>

            <div className="flex items-center gap-1.5 rounded-xl border border-fuchsia-400/30 bg-black/55 px-2.5 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
              <span className="text-[11px] font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-cyan-300">
                Reality Draft
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300">
                R{game.round}
              </span>
            </div>

            {game.mode === 'multi' && game.gameId && (
              <button
                type="button"
                onClick={handleCopyRoomCode}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/55 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-cyan-300 hover:border-cyan-400/40"
                title="Copy Room Code"
              >
                {copiedCode ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}
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
              <div className="flex items-center justify-center rounded-xl border border-dashed border-fuchsia-400/30 bg-black/40 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-fuchsia-300/75">
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
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/55 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:border-fuchsia-400/40 hover:text-white"
              title="Anomaly Codex & Rules"
            >
              <BookOpen size={13} />
              <span className="hidden sm:inline">Codex</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              className="rounded-xl border border-white/10 bg-black/55 p-1.5 text-zinc-300 hover:border-white/25 hover:text-white"
              aria-label="Toggle Audio"
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── CENTER REALITY DISTORTION ALTAR + CLASH STAGE ─── */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-3 sm:px-5 py-1.5 gap-2.5">
        {game.state === 'waiting' ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border border-fuchsia-400/35 bg-black/70 backdrop-blur-xl p-6 text-center shadow-[0_0_50px_rgba(217,70,239,0.2)] space-y-4"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-400/50 bg-fuchsia-950/60">
              <Sparkles className="w-7 h-7 text-fuchsia-300 animate-spin" style={{ animationDuration: '9s' }} />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-fuchsia-400">
                DIMENSIONAL RIFT OPEN
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">
                Share Your Room Code
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                First duelist to drop rival to 0 HP or win {CROWNS_TO_WIN} Clashes claims reality.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="rounded-2xl border border-cyan-400/40 bg-zinc-950 px-6 py-3 font-mono text-2xl font-black tracking-[0.3em] text-cyan-200">
                {game.gameId}
              </div>
              <button
                type="button"
                onClick={handleCopyRoomCode}
                className="rounded-2xl border border-white/15 bg-white/10 p-3.5 text-white hover:bg-white/20"
                title="Copy Code"
              >
                {copiedCode ? <Check className="text-lime-400" size={20} /> : <Copy size={20} />}
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
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`w-full max-w-3xl rounded-2xl border bg-black/65 backdrop-blur-xl px-4 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 ${distortionDef.borderGlow}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-black/70"
                  style={{ borderColor: distortionDef.accentHex }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0.5 rounded-full border border-dashed opacity-55"
                    style={{ borderColor: distortionDef.accentHex }}
                  />
                  <Flame className="w-4 h-4" style={{ color: distortionDef.accentHex }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-zinc-400">
                      WORLD DISTORTION
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${distortionDef.badgeClass}`}
                    >
                      {distortionDef.shortRule}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-black uppercase tracking-tight text-white truncate">
                    {distortionDef.name}{' '}
                    <span className="text-xs font-normal text-zinc-300 hidden md:inline">
                      — {distortionDef.rule}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 shrink-0 hidden sm:block">
                {game.state === 'clash'
                  ? lastClash?.lowestWins
                    ? '⚡ LOWEST WINS'
                    : '⚔ HIGHEST WINS'
                  : game.distortion === 'INVERTED_GRAVITY'
                    ? '⚡ LOWEST WINS'
                    : '⚔ HIGHEST WINS'}
              </div>
            </motion.div>

            {/* CLASH ARENA TABLE */}
            <div className="w-full max-w-4xl flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
              {game.state === 'selecting' && me && (
                <div className="w-full flex items-center justify-center gap-4 sm:gap-10">
                  {/* YOUR SUMMON SLOT */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-cyan-300">
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
                      <div className="w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] rounded-2xl border-2 border-dashed border-cyan-400/35 bg-black/40 flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Swords className="w-7 h-7 text-cyan-400/50" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                          Pick an Anomaly Card Below
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CENTER VS VORTEX */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/15 bg-black/70 shadow-[0_0_30px_rgba(217,70,239,0.28)]">
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-1 rounded-full border border-dashed border-fuchsia-400/50"
                      />
                      <span className="font-black text-lg sm:text-xl italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-fuchsia-400">
                        VS
                      </span>
                    </div>
                    {previewCalc && !me.locked && (
                      <div className="rounded-lg border border-white/10 bg-black/65 px-2.5 py-1 text-center font-mono text-[10px]">
                        <span className="text-zinc-400">EST </span>
                        <span className="font-black text-cyan-300">{previewCalc.total} PWR</span>
                      </div>
                    )}
                  </div>

                  {/* RIVAL SUMMON SLOT */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-fuchsia-300">
                      {opp?.nickname ?? 'RIVAL'}
                    </span>

                    {opp?.locked ? (
                      <motion.div
                        initial={{ scale: 1.15, y: -26, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        className="w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] rounded-2xl border-2 border-fuchsia-400/75 bg-gradient-to-b from-[#1a0b2e] to-[#07040f] flex flex-col items-center justify-center gap-2.5 p-4 text-center shadow-[0_0_30px_rgba(232,121,249,0.4)]"
                      >
                        <Lock className="w-8 h-8 text-fuchsia-300 animate-pulse" />
                        <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-fuchsia-200">
                          ANOMALY SEALED
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          Lock yours to clash!
                        </span>
                      </motion.div>
                    ) : (
                      <div className="w-[150px] sm:w-[172px] h-[206px] sm:h-[224px] rounded-2xl border-2 border-dashed border-fuchsia-400/30 bg-black/40 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                          className="h-10 w-10 rounded-full border border-dashed border-fuchsia-400/60 flex items-center justify-center"
                        >
                          <Sparkles className="w-4 h-4 text-fuchsia-300" />
                        </motion.div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
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
                      <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-cyan-300">
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
                              className={`rounded-md border px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                                step.tone === 'paradox'
                                  ? 'border-fuchsia-400 bg-fuchsia-950/80 text-fuchsia-200'
                                  : step.tone === 'distortion'
                                    ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200'
                                    : step.tone === 'buff'
                                      ? 'border-lime-400/70 bg-lime-950/80 text-lime-200'
                                      : step.tone === 'debuff'
                                        ? 'border-rose-400/70 bg-rose-950/80 text-rose-200'
                                        : 'border-white/20 bg-zinc-900/90 text-zinc-200'
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
                          className="rounded-2xl border border-fuchsia-400/40 bg-black/75 px-3.5 py-2.5"
                        >
                          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-fuchsia-300 animate-pulse">
                            SCANNING AURAS...
                          </p>
                        </motion.div>
                      )}

                      {revealStage === 'flip' && (
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="rounded-2xl border border-cyan-400/45 bg-black/75 px-3.5 py-2.5"
                        >
                          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-300">
                            ANOMALIES REVEALED
                          </p>
                        </motion.div>
                      )}

                      {revealStage === 'math' && (
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="rounded-2xl border border-amber-400/50 bg-black/80 px-3.5 py-2.5 space-y-1"
                        >
                          <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-amber-300">
                            COMPUTING REALITY
                          </p>
                          <p className="text-xl font-black font-mono text-white">
                            {lastClash.finalPowers[myIndex]}{' '}
                            <span className="text-xs text-zinc-500">VS</span>{' '}
                            {lastClash.finalPowers[oppIndex]}
                          </p>
                          {lastClash.lowestWins && (
                            <span className="inline-block rounded bg-lime-500/20 border border-lime-400/50 px-1.5 py-0.5 text-[9px] font-mono text-lime-300">
                              LOWEST WINS!
                            </span>
                          )}
                        </motion.div>
                      )}

                      {revealStage === 'impact' && (
                        <motion.div
                          initial={{ scale: 1.25, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`rounded-2xl border-2 bg-black/85 px-4 py-3 shadow-2xl space-y-1.5 ${
                            lastClash.winnerIdx === myIndex
                              ? 'border-lime-400/80 shadow-[0_0_32px_rgba(163,230,53,0.35)]'
                              : lastClash.winnerIdx === oppIndex
                                ? 'border-rose-500/80 shadow-[0_0_32px_rgba(244,63,94,0.35)]'
                                : 'border-fuchsia-400/75 shadow-[0_0_32px_rgba(232,121,249,0.35)]'
                          }`}
                        >
                          <p
                            className={`text-sm sm:text-base font-black uppercase tracking-tight ${
                              lastClash.winnerIdx === myIndex
                                ? 'text-lime-300'
                                : lastClash.winnerIdx === oppIndex
                                  ? 'text-rose-300'
                                  : 'text-fuchsia-300'
                            }`}
                          >
                            {lastClash.winnerIdx === myIndex
                              ? 'CLASH VICTORY'
                              : lastClash.winnerIdx === oppIndex
                                ? 'CLASH DEFEAT'
                                : 'PARADOX TIE'}
                          </p>

                          <div className="flex items-center justify-center gap-2 font-mono text-lg font-black text-white">
                            <span className="text-cyan-300">{lastClash.finalPowers[myIndex]}</span>
                            <span className="text-[10px] text-zinc-500">
                              {lastClash.lowestWins ? '(<)' : '(>)'}
                            </span>
                            <span className="text-fuchsia-300">{lastClash.finalPowers[oppIndex]}</span>
                          </div>

                          {lastClash.damageMultiplier > 1 && (
                            <span className="inline-block rounded-full border border-fuchsia-400/60 bg-fuchsia-500/20 px-2 py-0.5 text-[9px] font-mono font-black text-fuchsia-200">
                              ×{lastClash.damageMultiplier} DAMAGE MULTIPLIER
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={busy}
                            onClick={onNextRound}
                            className="mt-1 w-full rounded-xl bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-black shadow-lg hover:brightness-110 disabled:opacity-50"
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
                      <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-fuchsia-300">
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
                              className={`rounded-md border px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                                step.tone === 'paradox'
                                  ? 'border-fuchsia-400 bg-fuchsia-950/80 text-fuchsia-200'
                                  : step.tone === 'distortion'
                                    ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200'
                                    : step.tone === 'buff'
                                      ? 'border-lime-400/70 bg-lime-950/80 text-lime-200'
                                      : step.tone === 'debuff'
                                        ? 'border-rose-400/70 bg-rose-950/80 text-rose-200'
                                        : 'border-white/20 bg-zinc-900/90 text-zinc-200'
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
                        className="w-full max-w-3xl rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-mono text-zinc-200"
                      >
                        {lastClash.events.slice(0, 3).map((evt: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1">
                            <Zap className="w-3 h-3 text-fuchsia-400 shrink-0" />
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

      {/* ─── BOTTOM STANCE CONTROLS + FANNED 3D HOLOGRAPHIC HAND ─── */}
      {me && game.state !== 'waiting' && (
        <section className="relative z-20 shrink-0 px-3 sm:px-5 pb-3 pt-1">
          <div className="mx-auto max-w-5xl flex flex-col items-center gap-2">
            {/* Tactical Stance Bar + Lock In CTA */}
            <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl px-3 py-1.5">
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
                  className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition ${
                    selectedStance === 'hold'
                      ? 'border-white/60 bg-white/15 text-white'
                      : 'border-white/10 bg-zinc-950/70 text-zinc-400 hover:text-white'
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
                  className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition ${
                    selectedStance === 'double'
                      ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100 shadow-[0_0_16px_rgba(232,121,249,0.4)]'
                      : 'border-fuchsia-400/25 bg-zinc-950/70 text-fuchsia-300/80 hover:border-fuchsia-400/60'
                  } disabled:opacity-35`}
                >
                  <Flame size={12} />
                  DOUBLE ×2
                  <span className="rounded bg-black/60 px-1 text-[9px]">{me.doubleUsesLeft}</span>
                </button>

                <button
                  type="button"
                  disabled={me.locked || game.state !== 'selecting' || me.wardUsesLeft <= 0}
                  onClick={() => {
                    setSelectedStance('ward');
                    if (soundEnabled) playSound('shield');
                  }}
                  className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition ${
                    selectedStance === 'ward'
                      ? 'border-cyan-400 bg-cyan-500/25 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                      : 'border-cyan-400/25 bg-zinc-950/70 text-cyan-300/80 hover:border-cyan-400/60'
                  } disabled:opacity-35`}
                >
                  <Shield size={12} />
                  WARD +1
                  <span className="rounded bg-black/60 px-1 text-[9px]">{me.wardUsesLeft}</span>
                </button>
              </div>

              <button
                type="button"
                disabled={!selectedCard || me.locked || game.state !== 'selecting' || busy}
                onClick={() => handleConfirmLock()}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(217,70,239,0.4)] transition hover:brightness-110 disabled:opacity-35 disabled:shadow-none"
              >
                <Swords size={13} />
                {me.locked
                  ? 'Waiting Rival...'
                  : selectedCard
                    ? `Lock ${ANOMALY_CARDS[selectedCard].name}`
                    : 'Select Card'}
              </button>
            </div>

            {/* Fanned 5-Card Holographic Hand */}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md rounded-3xl border border-fuchsia-400/40 bg-[#0b0718] p-6 text-center shadow-[0_0_60px_rgba(217,70,239,0.3)] space-y-4"
            >
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 ${
                  isVictory
                    ? 'border-amber-300 bg-amber-950/60 text-amber-300'
                    : isTie
                      ? 'border-fuchsia-400 bg-fuchsia-950/60 text-fuchsia-300'
                      : 'border-rose-400 bg-rose-950/60 text-rose-300'
                }`}
              >
                {isVictory ? <Crown size={30} /> : isTie ? <Sparkles size={28} /> : <Skull size={28} />}
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-fuchsia-400">
                  REALITY COLLAPSED • {game.history.length} CLASHES
                </p>
                <h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-white">
                  {isVictory ? 'Reality Claimed!' : isTie ? 'Paradox Draw' : 'Shattered'}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {isVictory
                    ? `You outplayed ${opp.nickname} across the tarot rift.`
                    : isTie
                      ? 'Both duelists fell into the singularity simultaneously.'
                      : `${opp.nickname} warped reality in their favor.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-white/10 bg-black/50 p-3 font-mono text-xs">
                <div className="space-y-1">
                  <p className="text-[10px] text-cyan-300 uppercase">{me.nickname}</p>
                  <p className="text-lg font-black text-white">{me.hp} HP</p>
                  <p className="text-[10px] text-amber-300">
                    {me.crowns}/{CROWNS_TO_WIN} Crowns
                  </p>
                </div>
                <div className="space-y-1 border-l border-white/10">
                  <p className="text-[10px] text-fuchsia-300 uppercase">{opp.nickname}</p>
                  <p className="text-lg font-black text-white">{opp.hp} HP</p>
                  <p className="text-[10px] text-amber-300">
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
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 py-3 text-xs font-black uppercase tracking-widest text-black disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> Rematch
                  </button>
                ) : (
                  <div className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    Host Can Start Rematch
                  </div>
                )}
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-white/15"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[86dvh] overflow-y-auto rounded-3xl border border-fuchsia-400/35 bg-[#090614] p-5 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-fuchsia-400">
                    TAROT ARCHIVE
                  </p>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Reality Draft Codex
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodex(false)}
                  className="rounded-xl border border-white/15 p-2 text-zinc-300 hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                  <p className="font-mono text-[10px] uppercase text-cyan-300 mb-1">Win Condition</p>
                  <p className="text-zinc-300">
                    Start at 30 HP. First to drop rival to 0 HP OR win 4 Clashes claims victory.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                  <p className="font-mono text-[10px] uppercase text-fuchsia-300 mb-1">Clash Damage</p>
                  <p className="text-zinc-300">
                    HOLD deals Power Diff + 4 (min 5). DOUBLE STAKES (×2) doubles all clash damage!
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                  <p className="font-mono text-[10px] uppercase text-amber-300 mb-1">Ward & Auras</p>
                  <p className="text-zinc-300">
                    WARD gives +1 Power & halves damage taken. Face-down cards pulse LOW (0–3), MID (4–6), or HIGH (7–9).
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-amber-300 mb-2">
                  5 World Distortions
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ALL_DISTORTION_IDS.map((id) => {
                    const d = WORLD_DISTORTIONS[id];
                    return (
                      <div key={id} className="rounded-xl border border-white/10 bg-black/55 p-2.5">
                        <p className="text-xs font-black uppercase" style={{ color: d.accentHex }}>
                          {d.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-300">{d.rule}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-fuchsia-300 mb-2">
                  12 Anomaly Cards
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ALL_CARD_IDS.map((id) => {
                    const c = ANOMALY_CARDS[id];
                    return (
                      <div key={id} className="rounded-xl border border-white/10 bg-black/55 p-2.5 flex items-start gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-black text-sm"
                          style={{ borderColor: c.accentHex, color: c.accentHex }}
                        >
                          {c.basePower}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase text-white">
                            {c.name}{' '}
                            <span className="text-[9px] font-mono text-zinc-400">({c.roman})</span>
                          </p>
                          <p className="mt-0.5 text-[10.5px] leading-snug text-zinc-300">{c.ability}</p>
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
