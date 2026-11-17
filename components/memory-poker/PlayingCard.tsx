'use client';

import React from 'react';
import { Bookmark } from 'lucide-react';
import { parseCard } from '@/lib/memory-poker';

export interface CardBadge {
  label: string;
  tone: 'you' | 'opp' | 'optimal';
}

interface PlayingCardProps {
  cardId?: string;
  faceUp: boolean;
  positionLabel?: string;
  selectedOrder?: 1 | 2 | null;
  bookmarked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  badges?: CardBadge[];
  highlightWinner?: boolean;
}

export function PlayingCard({
  cardId,
  faceUp,
  positionLabel,
  selectedOrder = null,
  bookmarked = false,
  disabled = false,
  onClick,
  size = 'md',
  badges = [],
  highlightWinner = false,
}: PlayingCardProps) {
  const parsed = cardId ? parseCard(cardId) : null;

  const sizeClasses =
    size === 'xs'
      ? 'w-11 aspect-[5/7] rounded-lg text-xs'
      : size === 'sm'
      ? 'w-[66px] sm:w-[74px] aspect-[5/7] rounded-xl text-xs'
      : size === 'lg'
      ? 'w-24 sm:w-28 aspect-[5/7] rounded-2xl text-base'
      : 'w-full aspect-[5/7] min-h-[112px] sm:min-h-[130px] rounded-2xl text-sm';

  const interactiveClasses =
    onClick && !disabled
      ? 'cursor-pointer hover:-translate-y-1 active:scale-[0.96]'
      : 'cursor-default';

  const ringClass = selectedOrder
    ? 'ring-3 ring-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.45)] -translate-y-1'
    : highlightWinner
    ? 'ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
    : bookmarked
    ? 'ring-2 ring-cyan-400/85 shadow-[0_0_16px_rgba(34,211,238,0.3)]'
    : '';

  const ariaLabel = positionLabel
    ? faceUp && parsed
      ? `Position ${positionLabel}, ${parsed.rankStr} of ${parsed.suit}`
      : `Position ${positionLabel}, face down`
    : parsed
    ? `${parsed.rankStr} of ${parsed.suit}`
    : 'Face down card';

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick, disabled } : {})}
      aria-label={ariaLabel}
      aria-pressed={onClick ? Boolean(selectedOrder || bookmarked) : undefined}
      className={`relative select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${sizeClasses} ${interactiveClasses} ${ringClass}`}
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-300"
        style={{
          transformStyle: 'preserve-3d',
          transform: faceUp ? 'rotateY(0deg)' : 'rotateY(180deg)',
        }}
      >
        {/* CARD FRONT */}
        <div
          className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br from-[#FAF8F5] via-[#F5F2EB] to-[#E6E0D4] border-2 ${
            selectedOrder
              ? 'border-amber-400'
              : highlightWinner
              ? 'border-emerald-400'
              : bookmarked
              ? 'border-cyan-400'
              : 'border-stone-300'
          } shadow-[0_8px_20px_rgba(0,0,0,0.35)] flex flex-col justify-between p-2 overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Inner Playing-Card Trim */}
          <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-stone-300/70" />

          {parsed ? (
            <>
              {/* Top Corner Index + Position Badge */}
              <div className="relative z-10 flex items-start justify-between leading-none">
                <div
                  className={`flex flex-col items-center font-black tracking-tight ${
                    parsed.isRed ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  <span
                    className={
                      size === 'xs'
                        ? 'text-[11px]'
                        : size === 'sm'
                        ? 'text-xs sm:text-sm'
                        : 'text-sm sm:text-base'
                    }
                  >
                    {parsed.rankStr}
                  </span>
                  <span
                    className={
                      size === 'xs'
                        ? 'text-[10px]'
                        : size === 'sm'
                        ? 'text-[11px]'
                        : 'text-xs sm:text-sm'
                    }
                  >
                    {parsed.suit}
                  </span>
                </div>

                {positionLabel && (
                  <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-900 text-amber-300 font-mono text-[11px] sm:text-xs font-black shadow-sm">
                    {positionLabel}
                  </span>
                )}
              </div>

              {/* Center Suit Pip */}
              <div
                className={`relative z-10 flex items-center justify-center leading-none my-auto ${
                  parsed.isRed ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                <span
                  className={
                    size === 'xs'
                      ? 'text-lg'
                      : size === 'sm'
                      ? 'text-2xl sm:text-3xl'
                      : 'text-3xl sm:text-4xl drop-shadow-xs'
                  }
                >
                  {parsed.suit}
                </span>
              </div>

              {/* Bottom Rotated Corner Index */}
              <div className="relative z-10 flex items-end justify-between leading-none">
                {bookmarked ? (
                  <Bookmark className="w-3.5 h-3.5 text-cyan-600 fill-cyan-500" />
                ) : (
                  <span className="text-[8px] text-transparent">.</span>
                )}
                <div
                  className={`flex flex-col items-center font-black tracking-tight rotate-180 ${
                    parsed.isRed ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  <span
                    className={
                      size === 'xs'
                        ? 'text-[10px]'
                        : size === 'sm'
                        ? 'text-xs'
                        : 'text-xs sm:text-sm'
                    }
                  >
                    {parsed.rankStr}
                  </span>
                  <span className="text-[10px]">{parsed.suit}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* CARD BACK (HIDDEN) */}
        <div
          className={`absolute inset-0 rounded-[inherit] border-2 ${
            selectedOrder
              ? 'border-amber-400 bg-gradient-to-br from-[#165C3E] via-[#0F422C] to-[#082418]'
              : bookmarked
              ? 'border-cyan-400/80 bg-gradient-to-br from-[#104638] to-[#061D17]'
              : 'border-emerald-600/60 bg-gradient-to-br from-[#124731] via-[#0B2E1F] to-[#051810]'
          } shadow-[0_8px_20px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center overflow-hidden p-2`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Ornate Casino Back Inner Frame */}
          <div
            className="absolute inset-1.5 rounded-xl border border-amber-400/30 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.07) 0px, rgba(245, 158, 11, 0.07) 2px, transparent 2px, transparent 8px)',
            }}
          />

          {bookmarked && (
            <span
              title="Bookmarked during Memorize"
              className="absolute top-2 right-2 z-10 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]"
            />
          )}

          {positionLabel ? (
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center ${
                  selectedOrder
                    ? 'border-amber-300 bg-amber-400/20 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.35)]'
                    : 'border-amber-400/30 bg-black/35 text-amber-100'
                }`}
              >
                <span className="font-mono font-black text-xl sm:text-2xl leading-none">
                  {positionLabel}
                </span>
              </div>
              {selectedOrder && (
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider leading-none shadow">
                  Pick #{selectedOrder}
                </span>
              )}
            </div>
          ) : (
            <span className="relative z-10 text-amber-300/70 text-xl font-serif">♠</span>
          )}
        </div>
      </div>

      {/* Showdown / Selection Badges */}
      {badges.length > 0 && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 whitespace-nowrap">
          {badges.map((b, idx) => (
            <span
              key={`${b.label}-${idx}`}
              className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight shadow border leading-none ${
                b.tone === 'you'
                  ? 'bg-amber-400 text-black border-amber-300'
                  : b.tone === 'optimal'
                  ? 'bg-emerald-500 text-black border-emerald-300'
                  : 'bg-sky-400 text-black border-sky-300'
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </Tag>
  );
}
