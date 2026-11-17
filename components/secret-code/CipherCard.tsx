'use client';

import React from 'react';
import { Circle, Triangle, Diamond, Square, Star, X } from 'lucide-react';
import {
  SecretCard,
  CardColor,
  CardShape,
  COLOR_LABELS,
  SHAPE_LABELS,
} from '@/lib/secret-code';

export const COLOR_STYLE_MAP: Record<
  CardColor,
  {
    text: string;
    border: string;
    innerBorder: string;
    glow: string;
    bg: string;
    cardGradient: string;
    medallion: string;
    badgeBg: string;
    short: string;
    dot: string;
  }
> = {
  yellow: {
    text: 'text-amber-300',
    border: 'border-amber-400/45 hover:border-amber-300',
    innerBorder: 'border-amber-400/20',
    glow: 'hover:shadow-[0_8px_24px_rgba(251,191,36,0.28)]',
    bg: 'bg-amber-400/10',
    cardGradient: 'from-[#241b08] via-[#121521] to-[#0a0d14]',
    medallion: 'bg-amber-400/15 border-amber-400/35 shadow-[0_0_20px_rgba(251,191,36,0.25)]',
    badgeBg: 'bg-amber-400/15 text-amber-200 border-amber-400/30',
    short: 'YLW',
    dot: 'bg-amber-400',
  },
  green: {
    text: 'text-emerald-300',
    border: 'border-emerald-400/45 hover:border-emerald-300',
    innerBorder: 'border-emerald-400/20',
    glow: 'hover:shadow-[0_8px_24px_rgba(52,211,153,0.28)]',
    bg: 'bg-emerald-400/10',
    cardGradient: 'from-[#072418] via-[#121521] to-[#0a0d14]',
    medallion: 'bg-emerald-400/15 border-emerald-400/35 shadow-[0_0_20px_rgba(52,211,153,0.25)]',
    badgeBg: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/30',
    short: 'GRN',
    dot: 'bg-emerald-400',
  },
  blue: {
    text: 'text-sky-300',
    border: 'border-sky-400/45 hover:border-sky-300',
    innerBorder: 'border-sky-400/20',
    glow: 'hover:shadow-[0_8px_24px_rgba(56,189,248,0.28)]',
    bg: 'bg-sky-400/10',
    cardGradient: 'from-[#081d2c] via-[#121521] to-[#0a0d14]',
    medallion: 'bg-sky-400/15 border-sky-400/35 shadow-[0_0_20px_rgba(56,189,248,0.25)]',
    badgeBg: 'bg-sky-400/15 text-sky-200 border-sky-400/30',
    short: 'BLU',
    dot: 'bg-sky-400',
  },
  purple: {
    text: 'text-purple-300',
    border: 'border-purple-400/45 hover:border-purple-300',
    innerBorder: 'border-purple-400/20',
    glow: 'hover:shadow-[0_8px_24px_rgba(192,132,252,0.28)]',
    bg: 'bg-purple-400/10',
    cardGradient: 'from-[#1f0d2e] via-[#121521] to-[#0a0d14]',
    medallion: 'bg-purple-400/15 border-purple-400/35 shadow-[0_0_20px_rgba(192,132,252,0.25)]',
    badgeBg: 'bg-purple-400/15 text-purple-200 border-purple-400/30',
    short: 'PRP',
    dot: 'bg-purple-400',
  },
  offwhite: {
    text: 'text-stone-100',
    border: 'border-stone-300/45 hover:border-stone-100',
    innerBorder: 'border-stone-300/20',
    glow: 'hover:shadow-[0_8px_24px_rgba(245,245,244,0.22)]',
    bg: 'bg-stone-200/10',
    cardGradient: 'from-[#222120] via-[#121521] to-[#0a0d14]',
    medallion: 'bg-stone-200/15 border-stone-300/35 shadow-[0_0_20px_rgba(245,245,244,0.2)]',
    badgeBg: 'bg-stone-200/15 text-stone-100 border-stone-300/30',
    short: 'WHT',
    dot: 'bg-stone-100',
  },
};

export function ShapeGlyph({
  shape,
  color,
  size = 24,
}: {
  shape: CardShape;
  color: CardColor;
  size?: number;
}) {
  const colorClass = COLOR_STYLE_MAP[color].text;
  const props = {
    size,
    className: `${colorClass} shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]`,
    fill: 'currentColor',
    strokeWidth: 1.75,
  };

  switch (shape) {
    case 'circle':
      return <Circle {...props} />;
    case 'triangle':
      return <Triangle {...props} />;
    case 'diamond':
      return <Diamond {...props} />;
    case 'square':
      return <Square {...props} />;
    case 'star':
      return <Star {...props} />;
  }
}

interface CipherCardProps {
  card: SecretCard;
  slotPosition?: number | null;
  secretPosition?: number | null;
  crossedOut?: boolean;
  pinned?: boolean;
  dimmed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function CipherCard({
  card,
  slotPosition = null,
  secretPosition = null,
  crossedOut = false,
  pinned = false,
  dimmed = false,
  disabled = false,
  onClick,
  onContextMenu,
}: CipherCardProps) {
  const style = COLOR_STYLE_MAP[card.color];
  const paddedNum = String(card.number).padStart(2, '0');

  const stateBorder = secretPosition
    ? 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_24px_rgba(16,185,129,0.4)] -translate-y-1'
    : slotPosition
    ? 'border-amber-400 ring-2 ring-amber-400/90 shadow-[0_0_24px_rgba(245,158,11,0.4)] -translate-y-1'
    : pinned
    ? 'border-cyan-400 ring-2 ring-cyan-400/70 shadow-[0_0_18px_rgba(34,211,238,0.3)]'
    : `${style.border} ${style.glow}`;

  const opacityClass = crossedOut
    ? 'opacity-25 grayscale-[65%]'
    : dimmed
    ? 'opacity-20 scale-[0.97]'
    : 'opacity-100';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onContextMenu={onContextMenu}
      aria-label={`Card ${card.number} ${card.letter}, ${COLOR_LABELS[card.color]} ${SHAPE_LABELS[card.shape]}`}
      className={`group relative w-full aspect-[5/7] min-h-[112px] sm:min-h-[126px] rounded-2xl border-2 bg-gradient-to-b ${style.cardGradient} p-2 flex flex-col justify-between text-left transition-all duration-150 select-none overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shadow-lg ${stateBorder} ${opacityClass} ${
        disabled ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1 active:scale-[0.96]'
      }`}
    >
      {/* Inner Playing-Card Frame Border */}
      <div
        className={`pointer-events-none absolute inset-1.5 rounded-xl border ${style.innerBorder}`}
      />

      {/* Top Playing-Card Corner Index */}
      <div className="relative z-10 w-full flex items-start justify-between leading-none px-0.5">
        <div className="flex flex-col items-start">
          <span className="font-mono text-xs sm:text-sm font-black text-white tabular-nums tracking-tight">
            {paddedNum}
          </span>
          <span className={`font-mono text-[9px] font-bold ${style.text} mt-0.5`}>
            {style.short}
          </span>
        </div>
        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 border border-white/15 font-mono text-xs sm:text-sm font-black text-white shadow-sm">
          {card.letter}
        </span>
      </div>

      {/* Center Medallion & Shape Glyph */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center my-auto gap-1">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-transform duration-150 group-hover:scale-110 ${style.medallion}`}
        >
          <ShapeGlyph shape={card.shape} color={card.color} size={22} />
        </div>
      </div>

      {/* Bottom Bar: Shape Label + Rotated Corner Index */}
      <div className="relative z-10 w-full flex items-end justify-between leading-none px-0.5">
        <span
          className={`px-1.5 py-0.5 rounded border text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider ${style.badgeBg}`}
        >
          {SHAPE_LABELS[card.shape]}
        </span>
        <span className="font-mono text-[10px] font-black text-zinc-400 rotate-180 tabular-nums">
          {paddedNum}
        </span>
      </div>

      {/* Crossed Out Stamp */}
      {crossedOut && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/55"
        >
          <X className="w-10 h-10 text-rose-500/90 stroke-[2.5]" />
        </div>
      )}

      {/* Selected Slot Badge */}
      {slotPosition && !secretPosition && (
        <span className="absolute -top-2.5 -right-2 z-30 px-2 py-0.5 rounded-lg bg-amber-400 text-black font-mono text-[10px] font-black leading-none shadow-[0_4px_12px_rgba(245,158,11,0.65)] border border-amber-200">
          SLOT #{slotPosition}
        </span>
      )}

      {/* Revealed Secret Code Slot Badge */}
      {secretPosition && (
        <span className="absolute -top-2.5 -right-2 z-30 px-2 py-0.5 rounded-lg bg-emerald-400 text-black font-mono text-[10px] font-black leading-none shadow-[0_4px_12px_rgba(16,185,129,0.65)] border border-emerald-200">
          CODE #{secretPosition}
        </span>
      )}
    </button>
  );
}
