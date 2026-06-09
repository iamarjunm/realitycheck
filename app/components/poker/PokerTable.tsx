import React from 'react';
import { motion } from 'motion/react';

interface PokerTableProps {
  variant?: 'crimson' | 'violet' | 'emerald';
  potLabel?: React.ReactNode;
  phaseLabel?: string;
  className?: string;
  center?: React.ReactNode;
  children?: React.ReactNode;
}

export function PokerTable({
  variant = 'crimson',
  potLabel,
  phaseLabel,
  className = '',
  center,
  children
}: PokerTableProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'violet':
        return {
          tableBg: 'bg-indigo-950/80',
          tableBorder: 'border-indigo-500/30 shadow-[0_0_80px_rgba(79,70,229,0.2)]',
          innerDecals: 'border-indigo-400/20 text-indigo-500/50',
          gradientBg: 'from-indigo-900/40 via-purple-900/10 to-transparent'
        };
      case 'emerald':
        return {
          tableBg: 'bg-emerald-950/80',
          tableBorder: 'border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.2)]',
          innerDecals: 'border-emerald-400/20 text-emerald-500/50',
          gradientBg: 'from-emerald-900/40 via-teal-900/10 to-transparent'
        };
      case 'crimson':
      default:
        return {
          tableBg: 'bg-red-950/80',
          tableBorder: 'border-red-500/30 shadow-[0_0_80px_rgba(220,38,38,0.2)]',
          innerDecals: 'border-red-400/20 text-red-500/50',
          gradientBg: 'from-red-900/40 via-rose-900/10 to-transparent'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer Table Shape */}
      <div className={`absolute inset-4 rounded-[100px] border-8 sm:inset-8 xl:inset-12 2xl:inset-16 shrink-0 ${styles.tableBorder} ${styles.tableBg} flex flex-col items-center justify-center overflow-hidden`}>
        {/* Soft Inner Gradient */}
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${styles.gradientBg} pointer-events-none opacity-60`} />
        
        {/* Play Area Decal */}
        <div className={`absolute inset-8 rounded-[80px] border-2 border-dashed ${styles.innerDecals} pointer-events-none opacity-40`} />
        
        {/* Labels Region */}
        {potLabel || phaseLabel ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-0 opacity-20 pointer-events-none">
            {potLabel && (
              <div className="text-xl sm:text-2xl font-black uppercase tracking-[0.3em] whitespace-nowrap mb-2">
                {potLabel}
              </div>
            )}
            {phaseLabel && (
              <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.4em] whitespace-nowrap">
                {phaseLabel}
              </div>
            )}
          </div>
        ) : null}

        {/* Center Contents (e.g. Community Cards) */}
        {center && (
          <div className="relative z-10 w-full flex justify-center">
            {center}
          </div>
        )}
      </div>

      {/* Overlapping Content Box (Players around the table) */}
      <div className="relative z-20 w-full h-full pointer-events-none">
        {/* Re-enable pointer events for specific children if needed, handled inside players logic */}
        {children}
      </div>
    </div>
  );
}
