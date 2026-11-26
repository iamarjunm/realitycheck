'use client';

import React, { useId } from 'react';

export type GameArtworkId =
  | 'mind-heist'
  | 'reality-draft'
  | 'equilibrium'
  | 'quantum-matrix'
  | 'chronos'
  | 'glitch-roulette'
  | 'blind-vault'
  | 'void-step'
  | 'shadow-strike'
  | 'death-parade'
  | 'sniper-holdem'
  | 'doubt-and-bet'
  | 'secret-code'
  | 'memory-poker'
  | 'flip'
  | 'tap'
  | 'brain'
  | 'tether'
  | 'type'
  | 'chaos';

export default function GameArtwork({
  id,
  className = '',
}: {
  id: GameArtworkId;
  className?: string;
}) {
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');

  const svgProps = {
    viewBox: '0 0 400 180',
    preserveAspectRatio: 'xMidYMid slice' as const,
    className: `block h-full w-full select-none ${className}`,
    'aria-hidden': true as const,
  };

  switch (id) {
    /* ───────────────────────── 1. MIND HEIST ───────────────────────── */
    case 'mind-heist':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="48%" r="72%">
              <stop offset="0%" stopColor="#35193f" />
              <stop offset="52%" stopColor="#190e22" />
              <stop offset="100%" stopColor="#0a080f" />
            </radialGradient>
            <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff2c6" />
              <stop offset="45%" stopColor="#e6c27a" />
              <stop offset="100%" stopColor="#9c6e26" />
            </linearGradient>
            <linearGradient id={`${uid}-laser`} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#e6c27a" stopOpacity="0" />
              <stop offset="35%" stopColor="#ffdf94" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#fff6d6" stopOpacity="1" />
              <stop offset="100%" stopColor="#d9383a" stopOpacity="0" />
            </linearGradient>
            <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Architectural corner filigree */}
          <path d="M16 32 V16 H32 M368 16 H384 V32 M16 148 V164 H32 M368 164 H384 V148" stroke="#e6c27a" strokeOpacity="0.28" strokeWidth="1" fill="none" />
          <line x1="0" y1="90" x2="400" y2="90" stroke="#e6c27a" strokeOpacity="0.09" strokeDasharray="3 5" />
          <line x1="200" y1="0" x2="200" y2="180" stroke="#e6c27a" strokeOpacity="0.09" strokeDasharray="3 5" />

          {/* Outer rotating Astral Vault ring */}
          <g className="artwork-spin-slow">
            <circle cx="200" cy="90" r="70" fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="1.4" strokeOpacity="0.55" strokeDasharray="24 7 6 7" />
            <circle cx="200" cy="90" r="64" fill="none" stroke="#e6c27a" strokeOpacity="0.2" strokeWidth="0.8" />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              const x1 = 200 + Math.cos(a) * 65;
              const y1 = 90 + Math.sin(a) * 65;
              const x2 = 200 + Math.cos(a) * 73;
              const y2 = 90 + Math.sin(a) * 73;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e6c27a" strokeOpacity="0.5" strokeWidth="1.2" />;
            })}
          </g>

          {/* Middle counter-rotating crimson & gold ring */}
          <g className="artwork-spin-reverse">
            <circle cx="200" cy="90" r="47" fill="none" stroke="#d9383a" strokeWidth="2.2" strokeOpacity="0.82" strokeDasharray="48 16 20 16" />
            <circle cx="200" cy="90" r="42" fill="none" stroke="#e6c27a" strokeOpacity="0.35" strokeWidth="0.9" />
          </g>

          {/* Inner core vault ring */}
          <circle cx="200" cy="90" r="24" fill="#140b1c" stroke={`url(#${uid}-gold)`} strokeWidth="1.8" />
          <polygon points="200,72 214,90 200,108 186,90" fill="#e6c27a" fillOpacity="0.18" stroke="#f0d28e" strokeWidth="1.2" />
          <circle cx="200" cy="90" r="5" fill="#fff3cf" filter={`url(#${uid}-glow)`} className="artwork-pulse" />

          {/* Piercing golden laser arc */}
          <path d="M 46 138 Q 160 72 356 44" fill="none" stroke={`url(#${uid}-laser)`} strokeWidth="3.2" filter={`url(#${uid}-glow)`} />
          <path d="M 46 138 Q 160 72 356 44" fill="none" stroke="#fff9e6" strokeWidth="1" strokeDasharray="8 6" className="artwork-dash" />

          {/* ALPHA / BETA / OMEGA glowing nodes */}
          {[
            { x: 112, y: 54, label: 'ALPHA', color: '#e6c27a' },
            { x: 294, y: 66, label: 'BETA', color: '#e5484d' },
            { x: 256, y: 146, label: 'OMEGA', color: '#e6c27a' },
          ].map((node) => (
            <g key={node.label}>
              <line x1="200" y1="90" x2={node.x} y2={node.y} stroke={node.color} strokeOpacity="0.35" strokeWidth="0.9" strokeDasharray="3 3" />
              <circle cx={node.x} cy={node.y} r="10" fill={node.color} fillOpacity="0.14" className="artwork-pulse" />
              <circle cx={node.x} cy={node.y} r="4.2" fill="#0d0912" stroke={node.color} strokeWidth="1.6" />
              <circle cx={node.x} cy={node.y} r="1.8" fill="#fff7df" />
              <text
                x={node.x}
                y={node.y - 12}
                textAnchor="middle"
                fill="#f5e6c4"
                fontSize="7.5"
                fontFamily="monospace"
                letterSpacing="1.6"
                opacity="0.88"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      );

    /* ───────────────────────── 2. REALITY DRAFT ───────────────────────── */
    case 'reality-draft':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="40%" r="72%">
              <stop offset="0%" stopColor="#261c40" />
              <stop offset="58%" stopColor="#130f22" />
              <stop offset="100%" stopColor="#09080f" />
            </radialGradient>
            <linearGradient id={`${uid}-foil`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff1c2" />
              <stop offset="50%" stopColor="#e6c27a" />
              <stop offset="100%" stopColor="#9d702a" />
            </linearGradient>
            <linearGradient id={`${uid}-card`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#201a2e" />
              <stop offset="100%" stopColor="#100d18" />
            </linearGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Starfield & subtle celestial halo */}
          <circle cx="200" cy="96" r="76" fill="none" stroke="#e6c27a" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="2 6" />
          {[
            [52, 34, 1.5], [88, 128, 1], [318, 36, 1.6], [352, 118, 1.2], [72, 74, 1], [336, 78, 1],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#f4d999" opacity="0.65" className="artwork-pulse" />
          ))}

          {/* Left Tarot Card: 0 — The All-Seeing Eye */}
          <g transform="translate(132 96) rotate(-15)">
            <rect x="-36" y="-56" width="72" height="112" rx="6" fill={`url(#${uid}-card)`} stroke={`url(#${uid}-foil)`} strokeWidth="1.4" />
            <rect x="-31" y="-51" width="62" height="102" rx="3.5" fill="none" stroke="#e6c27a" strokeOpacity="0.35" strokeWidth="0.7" />
            <text x="0" y="-36" textAnchor="middle" fill="#e6c27a" fontSize="10" fontFamily="serif" fontWeight="700">0</text>
            {/* Eye emblem */}
            <path d="M-21 0 Q0 -16 21 0 Q0 16 -21 0 Z" fill="#e6c27a" fillOpacity="0.12" stroke="#e6c27a" strokeWidth="1.3" />
            <circle cx="0" cy="0" r="6.5" fill="#d9383a" fillOpacity="0.85" stroke="#ffdf94" strokeWidth="1" />
            <circle cx="0" cy="0" r="2.2" fill="#0d0a12" />
            <line x1="0" y1="-22" x2="0" y2="-13" stroke="#e6c27a" strokeOpacity="0.6" strokeWidth="0.9" />
            <line x1="0" y1="13" x2="0" y2="22" stroke="#e6c27a" strokeOpacity="0.6" strokeWidth="0.9" />
            <text x="0" y="42" textAnchor="middle" fill="#d7c49e" fontSize="6.2" fontFamily="monospace" letterSpacing="1.4">ORACLE</text>
          </g>

          {/* Right Tarot Card: XIII — Twin Crescents */}
          <g transform="translate(268 96) rotate(15)">
            <rect x="-36" y="-56" width="72" height="112" rx="6" fill={`url(#${uid}-card)`} stroke={`url(#${uid}-foil)`} strokeWidth="1.4" />
            <rect x="-31" y="-51" width="62" height="102" rx="3.5" fill="none" stroke="#e6c27a" strokeOpacity="0.35" strokeWidth="0.7" />
            <text x="0" y="-36" textAnchor="middle" fill="#e6c27a" fontSize="9.5" fontFamily="serif" fontWeight="700">XIII</text>
            <circle cx="0" cy="0" r="16" fill="none" stroke="#e6c27a" strokeOpacity="0.4" strokeWidth="1" />
            <path d="M-4 -12 A12 12 0 1 0 -4 12 A9 9 0 1 1 -4 -12 Z" fill="#e6c27a" />
            <polygon points="9,-6 13,0 9,6 5,0" fill="#d9383a" />
            <text x="0" y="42" textAnchor="middle" fill="#d7c49e" fontSize="6.2" fontFamily="monospace" letterSpacing="1.4">ECLIPSE</text>
          </g>

          {/* Center Hero Tarot Card: IX — Shattered Crown */}
          <g transform="translate(200 88)">
            <rect x="-40" y="-62" width="80" height="124" rx="7" fill="#171226" stroke={`url(#${uid}-foil)`} strokeWidth="1.9" />
            <rect x="-34" y="-56" width="68" height="112" rx="4" fill="none" stroke="#e6c27a" strokeOpacity="0.45" strokeWidth="0.8" />
            {/* Filigree corners */}
            <circle cx="-28" cy="-50" r="1.8" fill="#e6c27a" />
            <circle cx="28" cy="-50" r="1.8" fill="#e6c27a" />
            <circle cx="-28" cy="50" r="1.8" fill="#e6c27a" />
            <circle cx="28" cy="50" r="1.8" fill="#e6c27a" />
            <text x="0" y="-39" textAnchor="middle" fill="#fff0c2" fontSize="11" fontFamily="serif" fontWeight="700" letterSpacing="1.5">IX</text>
            {/* Radiant sun halo */}
            <circle cx="0" cy="2" r="22" fill="#e6c27a" fillOpacity="0.09" />
            {/* Shattered Crown */}
            <path d="M-20 14 L-23 -8 L-10 3 L-2 -14 L-1 14 Z" fill={`url(#${uid}-foil)`} />
            <path d="M4 14 L5 -14 L12 2 L24 -9 L20 14 Z" fill={`url(#${uid}-foil)`} />
            {/* Crimson fracture bolt */}
            <path d="M2 -20 L-1 -5 L4 4 L0 21" stroke="#e5484d" strokeWidth="1.8" fill="none" />
            <rect x="-20" y="17" width="40" height="3" rx="1.5" fill="#e6c27a" />
            <text x="0" y="45" textAnchor="middle" fill="#f5e6c4" fontSize="6.6" fontFamily="monospace" letterSpacing="1.6">ANOMALY</text>
          </g>
        </svg>
      );

    /* ───────────────────────── 3. EQUILIBRIUM ───────────────────────── */
    case 'equilibrium':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="55%" r="72%">
              <stop offset="0%" stopColor="#2c2419" />
              <stop offset="56%" stopColor="#161311" />
              <stop offset="100%" stopColor="#0b0a0d" />
            </radialGradient>
            <linearGradient id={`${uid}-brass`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9d702a" />
              <stop offset="50%" stopColor="#f5d996" />
              <stop offset="100%" stopColor="#9d702a" />
            </linearGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Sweeping 0 - 50 - 100 precision dial arc */}
          <path d="M 88 142 A 118 118 0 0 1 312 142" fill="none" stroke="#e6c27a" strokeOpacity="0.22" strokeWidth="1.2" />
          <path d="M 96 142 A 110 110 0 0 1 304 142" fill="none" stroke={`url(#${uid}-brass)`} strokeWidth="2" strokeDasharray="3 5" strokeOpacity="0.65" />
          {/* Dial ticks & numerals */}
          <text x="76" y="148" fill="#c7b28a" fontSize="9.5" fontFamily="monospace">0</text>
          <text x="200" y="25" textAnchor="middle" fill="#f5d996" fontSize="10" fontFamily="monospace" fontWeight="700">50</text>
          <text x="318" y="148" fill="#c7b28a" fontSize="9.5" fontFamily="monospace">100</text>

          {/* Scale pillar */}
          <line x1="200" y1="42" x2="200" y2="152" stroke={`url(#${uid}-brass)`} strokeWidth="3.2" />
          <path d="M168 158 L184 146 H216 L232 158 Z" fill="#1d1814" stroke="#e6c27a" strokeWidth="1.3" />

          {/* Ornate balanced beam */}
          <g transform="rotate(-4 200 66)">
            <path d="M110 66 Q200 54 290 66" fill="none" stroke={`url(#${uid}-brass)`} strokeWidth="3.2" strokeLinecap="round" />
            {/* Left pan */}
            <line x1="118" y1="66" x2="100" y2="112" stroke="#e6c27a" strokeOpacity="0.65" strokeWidth="1" />
            <line x1="118" y1="66" x2="136" y2="112" stroke="#e6c27a" strokeOpacity="0.65" strokeWidth="1" />
            <path d="M94 112 Q118 128 142 112 Z" fill="#231c15" stroke="#e6c27a" strokeWidth="1.5" />
            <circle cx="118" cy="107" r="6" fill="#d9383a" />

            {/* Right pan */}
            <line x1="282" y1="66" x2="264" y2="112" stroke="#e6c27a" strokeOpacity="0.65" strokeWidth="1" />
            <line x1="282" y1="66" x2="300" y2="112" stroke="#e6c27a" strokeOpacity="0.65" strokeWidth="1" />
            <path d="M258 112 Q282 128 306 112 Z" fill="#231c15" stroke="#e6c27a" strokeWidth="1.5" />
            <polygon points="282,98 289,109 275,109" fill="#e6c27a" />
          </g>

          {/* Glowing amber fulcrum target */}
          <circle cx="200" cy="64" r="15" fill="#e6c27a" fillOpacity="0.16" className="artwork-pulse" />
          <polygon points="200,52 211,64 200,76 189,64" fill="#1a140f" stroke="#f5d996" strokeWidth="1.6" />
          <circle cx="200" cy="64" r="3.5" fill="#fff2c2" />
          {/* Precision needle */}
          <line x1="200" y1="52" x2="206" y2="32" stroke="#e5484d" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    /* ───────────────────────── 4. QUANTUM MATRIX ───────────────────────── */
    case 'quantum-matrix':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="74%">
              <stop offset="0%" stopColor="#1b1c36" />
              <stop offset="60%" stopColor="#10101e" />
              <stop offset="100%" stopColor="#09090f" />
            </radialGradient>
            <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Perspective 4x4 Obsidian Tile Matrix */}
          <g transform="translate(200 94)">
            {[
              { r: 0, c: 0, type: 'normal' },
              { r: 0, c: 1, type: 'x2' },
              { r: 0, c: 2, type: 'normal' },
              { r: 0, c: 3, type: 'normal' },
              { r: 1, c: 0, type: 'core8' },
              { r: 1, c: 1, type: 'normal' },
              { r: 1, c: 2, type: 'x2' },
              { r: 1, c: 3, type: 'normal' },
              { r: 2, c: 0, type: 'normal' },
              { r: 2, c: 1, type: 'normal' },
              { r: 2, c: 2, type: 'core2' },
              { r: 2, c: 3, type: 'normal' },
              { r: 3, c: 0, type: 'normal' },
              { r: 3, c: 1, type: 'normal' },
              { r: 3, c: 2, type: 'normal' },
              { r: 3, c: 3, type: 'x2' },
            ].map((cell) => {
              const isoX = (cell.c - cell.r) * 34;
              const isoY = (cell.c + cell.r) * 16 - 48;
              const fill =
                cell.type === 'core8'
                  ? '#312e81'
                  : cell.type === 'core2'
                  ? '#7f1d1d'
                  : cell.type === 'x2'
                  ? '#2b2214'
                  : '#151420';
              const stroke =
                cell.type === 'core8'
                  ? '#818cf8'
                  : cell.type === 'core2'
                  ? '#f87171'
                  : cell.type === 'x2'
                  ? '#e6c27a'
                  : 'rgba(230,194,122,0.22)';
              return (
                <g key={`${cell.r}-${cell.c}`} transform={`translate(${isoX} ${isoY})`}>
                  <polygon
                    points="0,-13 29,0 0,13 -29,0"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={cell.type === 'normal' ? '0.9' : '1.5'}
                  />
                  {cell.type === 'x2' && (
                    <text x="0" y="3.5" textAnchor="middle" fill="#f5d996" fontSize="9" fontFamily="monospace" fontWeight="700">
                      ×2
                    </text>
                  )}
                  {cell.type === 'core8' && (
                    <text x="0" y="4.5" textAnchor="middle" fill="#e0e7ff" fontSize="13" fontFamily="monospace" fontWeight="800">
                      8
                    </text>
                  )}
                  {cell.type === 'core2' && (
                    <text x="0" y="4.5" textAnchor="middle" fill="#fee2e2" fontSize="13" fontFamily="monospace" fontWeight="800">
                      2
                    </text>
                  )}
                </g>
              );
            })}

            {/* Golden =10 lightning arc linking core 8 (-34, -32) to core 2 (0, 16) */}
            <path
              d="M -34 -32 L -14 -24 L -20 -6 L 4 -10 L 0 16"
              fill="none"
              stroke="#ffdf8a"
              strokeWidth="2.4"
              strokeLinejoin="round"
              filter={`url(#${uid}-glow)`}
            />
            <g transform="translate(82 -26)">
              <rect x="-26" y="-12" width="52" height="24" rx="12" fill="#17141f" stroke="#e6c27a" strokeWidth="1.4" />
              <text x="0" y="4" textAnchor="middle" fill="#ffdf8a" fontSize="11" fontFamily="monospace" fontWeight="800">
                =10
              </text>
            </g>
          </g>
        </svg>
      );

    /* ───────────────────────── 5. CHRONOS ASSASSIN ───────────────────────── */
    case 'chronos':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="55%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#17242a" />
              <stop offset="60%" stopColor="#0e1318" />
              <stop offset="100%" stopColor="#090a0e" />
            </radialGradient>
            <filter id={`${uid}-beam`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Tactical 5x5 Blueprint Grid */}
          <g transform="translate(80 18)">
            {Array.from({ length: 6 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * 48} y1="0" x2={i * 48} y2="144" stroke="#e6c27a" strokeOpacity="0.16" strokeWidth="1" />
                <line x1="0" y1={i * 28.8} x2="240" y2={i * 28.8} stroke="#e6c27a" strokeOpacity="0.16" strokeWidth="1" />
              </React.Fragment>
            ))}

            {/* Dark Cover Monoliths with brass rim */}
            {[
              { x: 48, y: 28.8 },
              { x: 144, y: 86.4 },
              { x: 144, y: 28.8 },
            ].map((m, idx) => (
              <g key={idx}>
                <rect x={m.x + 5} y={m.y + 4} width="38" height="21" rx="2" fill="#0b0c10" stroke="#e6c27a" strokeOpacity="0.55" strokeWidth="1.2" />
                <line x1={m.x + 9} y1={m.y + 8} x2={m.x + 39} y2={m.y + 8} stroke="#e6c27a" strokeOpacity="0.25" strokeWidth="1" />
              </g>
            ))}

            {/* Dotted Golden Rewind Ghost Path */}
            <path
              d="M 24 128 L 24 72 L 120 72 L 120 15"
              fill="none"
              stroke="#e6c27a"
              strokeWidth="2"
              strokeDasharray="5 5"
              className="artwork-dash"
            />
            <circle cx="24" cy="128" r="7" fill="none" stroke="#e6c27a" strokeOpacity="0.45" strokeWidth="1.2" />
            <circle cx="24" cy="72" r="5" fill="#e6c27a" fillOpacity="0.25" stroke="#e6c27a" strokeWidth="1.2" />
            <circle cx="120" cy="72" r="6" fill="#e6c27a" fillOpacity="0.35" stroke="#f5d996" strokeWidth="1.5" />

            {/* Sharp Crimson Trajectory Beam */}
            <line x1="220" y1="130" x2="120" y2="15" stroke="#e5484d" strokeWidth="2.8" filter={`url(#${uid}-beam)`} />
            <line x1="220" y1="130" x2="120" y2="15" stroke="#ffd4d4" strokeWidth="0.9" />

            {/* Impact Reticle */}
            <g transform="translate(120 15)">
              <circle cx="0" cy="0" r="11" fill="#d9383a" fillOpacity="0.22" stroke="#e5484d" strokeWidth="1.4" className="artwork-pulse" />
              <line x1="-16" y1="0" x2="16" y2="0" stroke="#f5d996" strokeWidth="1" />
              <line x1="0" y1="-16" x2="0" y2="16" stroke="#f5d996" strokeWidth="1" />
              <circle cx="0" cy="0" r="2.8" fill="#fff1c2" />
            </g>
          </g>

          {/* Blueprint telemetry corners */}
          <text x="18" y="24" fill="#e6c27a" fillOpacity="0.55" fontSize="8" fontFamily="monospace">T-03.00s</text>
          <text x="382" y="166" textAnchor="end" fill="#e5484d" fillOpacity="0.75" fontSize="8" fontFamily="monospace">LOCKED</text>
        </svg>
      );

    /* ───────────────────────── 6. GLITCH ROULETTE ───────────────────────── */
    case 'glitch-roulette':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="72%">
              <stop offset="0%" stopColor="#2b1418" />
              <stop offset="58%" stopColor="#140c10" />
              <stop offset="100%" stopColor="#0a090d" />
            </radialGradient>
            <radialGradient id={`${uid}-metal`} cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#3c3742" />
              <stop offset="55%" stopColor="#1d1a22" />
              <stop offset="100%" stopColor="#100e14" />
            </radialGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Glowing Mod-Chips flanking the cylinder */}
          <g transform="translate(42 64)">
            <rect width="62" height="24" rx="4" fill="#181520" stroke="#e6c27a" strokeOpacity="0.65" strokeWidth="1.2" />
            <text x="31" y="15" textAnchor="middle" fill="#f5d996" fontSize="7.5" fontFamily="monospace" fontWeight="700">SCANNER</text>
            <line x1="62" y1="12" x2="94" y2="26" stroke="#e6c27a" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 3" />
          </g>
          <g transform="translate(296 92)">
            <rect width="64" height="24" rx="4" fill="#211216" stroke="#e5484d" strokeOpacity="0.75" strokeWidth="1.2" />
            <text x="32" y="15" textAnchor="middle" fill="#ffb8ba" fontSize="7.5" fontFamily="monospace" fontWeight="700">INVERT</text>
            <line x1="0" y1="12" x2="-32" y2="-2" stroke="#e5484d" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 3" />
          </g>

          {/* Overhead Machined Gunmetal & Brass 6-Chamber Revolver Cylinder */}
          <g transform="translate(200 90)">
            <circle cx="0" cy="0" r="68" fill="none" stroke="#e6c27a" strokeOpacity="0.22" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="0" cy="0" r="60" fill={`url(#${uid}-metal)`} stroke="#e6c27a" strokeOpacity="0.65" strokeWidth="2" />
            <circle cx="0" cy="0" r="54" fill="none" stroke="#0b0a0e" strokeWidth="1.5" />

            {/* 6 Chambers: 2 Crimson Live Shells, 4 Dark Brass Blanks */}
            {[0, 60, 120, 180, 240, 300].map((deg, idx) => {
              const rad = ((deg - 90) * Math.PI) / 180;
              const cx = Math.cos(rad) * 33;
              const cy = Math.sin(rad) * 33;
              const isLive = idx === 0 || idx === 3;
              return (
                <g key={deg} transform={`translate(${cx} ${cy})`}>
                  <circle cx="0" cy="0" r="14.5" fill="#0b0a0e" stroke="#e6c27a" strokeOpacity="0.42" strokeWidth="1.2" />
                  {isLive ? (
                    <>
                      <circle cx="0" cy="0" r="11" fill="#c92a2e" stroke="#f0d28e" strokeWidth="1.6" />
                      <circle cx="0" cy="0" r="4.2" fill="#e6c27a" />
                    </>
                  ) : (
                    <>
                      <circle cx="0" cy="0" r="9.5" fill="#18151d" stroke="#574a35" strokeWidth="1" />
                      <circle cx="0" cy="0" r="3" fill="#2c2633" />
                    </>
                  )}
                </g>
              );
            })}

            {/* Center extractor spindle */}
            <circle cx="0" cy="0" r="12" fill="#16141b" stroke="#e6c27a" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="4.5" fill="#e6c27a" />
          </g>
        </svg>
      );

    /* ───────────────────────── 7. BLIND VAULT ───────────────────────── */
    case 'blind-vault':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="46%" cy="50%" r="72%">
              <stop offset="0%" stopColor="#262530" />
              <stop offset="58%" stopColor="#131218" />
              <stop offset="100%" stopColor="#0a090d" />
            </radialGradient>
            <linearGradient id={`${uid}-bullion`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff0bd" />
              <stop offset="50%" stopColor="#dfb35c" />
              <stop offset="100%" stopColor="#8d621f" />
            </linearGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Heavy Circular Brushed-Steel & Gold Bank Vault Door */}
          <g transform="translate(154 90)">
            <circle cx="0" cy="0" r="66" fill="#181720" stroke="#e6c27a" strokeOpacity="0.65" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="57" fill="#121118" stroke="#e6c27a" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="5 4" />
            {/* Radial locking spokes */}
            <g className="artwork-spin-slow">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <g key={deg} transform={`rotate(${deg})`}>
                  <rect x="-3" y="-54" width="6" height="22" rx="1.5" fill="#e6c27a" fillOpacity="0.72" />
                </g>
              ))}
              <circle cx="0" cy="0" r="34" fill="none" stroke="#e6c27a" strokeWidth="3" />
            </g>
            {/* Central combination hub */}
            <circle cx="0" cy="0" r="19" fill="#1e1c26" stroke="#f5d996" strokeWidth="2" />
            <circle cx="0" cy="0" r="7" fill="#e6c27a" />
          </g>

          {/* Stacked Gold Bullion Bars */}
          <g transform="translate(254 98)">
            {/* Bottom row */}
            <polygon points="0,34 10,16 58,16 68,34" fill={`url(#${uid}-bullion)`} stroke="#5e4012" strokeWidth="1" />
            <polygon points="44,34 54,16 102,16 112,34" fill={`url(#${uid}-bullion)`} stroke="#5e4012" strokeWidth="1" />
            {/* Top bar */}
            <polygon points="22,16 32,-2 80,-2 90,16" fill={`url(#${uid}-bullion)`} stroke="#fff2c2" strokeWidth="1" />
            <text x="56" y="10" textAnchor="middle" fill="#3a2507" fontSize="6.5" fontFamily="monospace" fontWeight="800">999.9</text>
          </g>

          {/* Subtle Crimson Laser Tripwire */}
          <line x1="20" y1="26" x2="380" y2="152" stroke="#e5484d" strokeWidth="1.6" strokeOpacity="0.82" />
          <circle cx="20" cy="26" r="3.2" fill="#e5484d" className="artwork-pulse" />
          <circle cx="380" cy="152" r="3.2" fill="#e5484d" className="artwork-pulse" />
        </svg>
      );

    /* ───────────────────────── 8. VOID STEP ───────────────────────── */
    case 'void-step':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="62%" r="72%">
              <stop offset="0%" stopColor="#261938" />
              <stop offset="58%" stopColor="#120d1c" />
              <stop offset="100%" stopColor="#08070d" />
            </radialGradient>
            <linearGradient id={`${uid}-arc`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f5f0e6" />
              <stop offset="50%" stopColor="#f5d996" />
              <stop offset="100%" stopColor="#e5484d" />
            </linearGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Fracturing Perspective Checkerboard */}
          <g transform="translate(200 112)">
            {[
              [-2, -1], [-1, -1], [0, -1], [1, -1],
              [-2, 0], [-1, 0], [0, 0], [1, 0],
              [-1, 1], [0, 1], [1, 1],
            ].map(([c, r], idx) => {
              const x = (c - r) * 32;
              const y = (c + r) * 14;
              const light = (c + r) % 2 === 0;
              return (
                <polygon
                  key={idx}
                  points={`${x},${y - 12} ${x + 28},${y} ${x},${y + 12} ${x - 28},${y}`}
                  fill={light ? '#252034' : '#13101d'}
                  stroke="#e6c27a"
                  strokeOpacity={light ? '0.4' : '0.18'}
                  strokeWidth="1"
                />
              );
            })}

            {/* Broken tumbling tiles drifting into the abyss */}
            <g transform="translate(-118 32) rotate(-24)">
              <polygon points="0,-10 22,0 0,10 -22,0" fill="#181326" stroke="#e6c27a" strokeOpacity="0.3" strokeWidth="1" />
            </g>
            <g transform="translate(114 26) rotate(28)">
              <polygon points="0,-10 22,0 0,10 -22,0" fill="#1e172e" stroke="#e5484d" strokeOpacity="0.45" strokeWidth="1" />
            </g>

            {/* Ivory Piece */}
            <g transform="translate(-64 -2)">
              <ellipse cx="0" cy="4" rx="11" ry="5" fill="#000" fillOpacity="0.45" />
              <path d="M-8 3 L-5 -20 H5 L8 3 Z" fill="#f5f0e6" stroke="#c8b89a" strokeWidth="1" />
              <circle cx="0" cy="-24" r="6.5" fill="#fffaf0" stroke="#e6c27a" strokeWidth="1.2" />
            </g>

            {/* Crimson Piece */}
            <g transform="translate(64 -2)">
              <ellipse cx="0" cy="4" rx="11" ry="5" fill="#000" fillOpacity="0.45" />
              <path d="M-8 3 L-5 -20 H5 L8 3 Z" fill="#c92a2e" stroke="#f0a0a2" strokeWidth="1" />
              <polygon points="0,-32 7,-22 0,-15 -7,-22" fill="#e5484d" stroke="#f5d996" strokeWidth="1.1" />
            </g>

            {/* Golden Parabolic Blink Jump Arc */}
            <path
              d="M -64 -32 Q 0 -106 64 -34"
              fill="none"
              stroke={`url(#${uid}-arc)`}
              strokeWidth="2.4"
              strokeDasharray="6 4"
              className="artwork-dash"
            />
            <ellipse cx="64" cy="0" rx="20" ry="9" fill="none" stroke="#e6c27a" strokeOpacity="0.55" strokeWidth="1.2" className="artwork-pulse" />
          </g>
        </svg>
      );

    /* ───────────────────────── 9. SHADOW STRIKE ───────────────────────── */
    case 'shadow-strike':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="74%">
              <stop offset="0%" stopColor="#122b23" />
              <stop offset="56%" stopColor="#0b1714" />
              <stop offset="100%" stopColor="#070b0a" />
            </radialGradient>
            <linearGradient id={`${uid}-sweep`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#e6c27a" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Concentric Gold-Emerald Radar Scope */}
          <circle cx="200" cy="92" r="74" fill="#091612" stroke="#e6c27a" strokeOpacity="0.45" strokeWidth="1.5" />
          <circle cx="200" cy="92" r="52" fill="none" stroke="#10b981" strokeOpacity="0.32" strokeWidth="1" />
          <circle cx="200" cy="92" r="28" fill="none" stroke="#10b981" strokeOpacity="0.28" strokeWidth="1" />
          <line x1="120" y1="92" x2="280" y2="92" stroke="#10b981" strokeOpacity="0.24" strokeWidth="1" />
          <line x1="200" y1="12" x2="200" y2="172" stroke="#10b981" strokeOpacity="0.24" strokeWidth="1" />

          {/* Sweeping Radar Wedge */}
          <g className="artwork-radar-sweep">
            <path d="M 200 92 L 200 18 A 74 74 0 0 1 258 46 Z" fill={`url(#${uid}-sweep)`} />
            <line x1="200" y1="92" x2="200" y2="18" stroke="#6ee7b7" strokeWidth="1.6" />
          </g>

          {/* Glowing Target Blips */}
          <circle cx="164" cy="64" r="4" fill="#34d399" className="artwork-pulse" />
          <circle cx="238" cy="116" r="3.5" fill="#e6c27a" className="artwork-pulse" />

          {/* Crosshair Orbital Lock */}
          <g transform="translate(232 62)">
            <circle cx="0" cy="0" r="14" fill="#d9383a" fillOpacity="0.16" stroke="#e5484d" strokeWidth="1.4" />
            <line x1="-20" y1="0" x2="-8" y2="0" stroke="#f5d996" strokeWidth="1.3" />
            <line x1="8" y1="0" x2="20" y2="0" stroke="#f5d996" strokeWidth="1.3" />
            <line x1="0" y1="-20" x2="0" y2="-8" stroke="#f5d996" strokeWidth="1.3" />
            <line x1="0" y1="8" x2="0" y2="20" stroke="#f5d996" strokeWidth="1.3" />
            <circle cx="0" cy="0" r="3" fill="#ffdf8a" />
          </g>

          <text x="20" y="24" fill="#6ee7b7" fillOpacity="0.65" fontSize="8" fontFamily="monospace">SONAR · 04</text>
          <text x="380" y="164" textAnchor="end" fill="#e6c27a" fillOpacity="0.65" fontSize="8" fontFamily="monospace">BEARING 047°</text>
        </svg>
      );

    /* ───────────────────────── 10. DEATH PARADE ───────────────────────── */
    case 'death-parade':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="48%" r="74%">
              <stop offset="0%" stopColor="#12362a" />
              <stop offset="56%" stopColor="#0a1c16" />
              <stop offset="100%" stopColor="#070b0a" />
            </radialGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Gold parlor table arc */}
          <ellipse cx="200" cy="172" rx="188" ry="62" fill="none" stroke="#e6c27a" strokeOpacity="0.28" strokeWidth="1.5" />

          {/* 4 Ascending Ivory/Gold Spade & Crimson Diamond Cards */}
          {[
            { x: 118, y: 102, rot: -14, rank: 'J', suit: '♠', red: false },
            { x: 168, y: 90, rot: -5, rank: 'Q', suit: '♦', red: true },
            { x: 220, y: 82, rot: 5, rank: 'K', suit: '♠', red: false },
            { x: 272, y: 74, rot: 14, rank: 'A', suit: '♦', red: true },
          ].map((c) => (
            <g key={c.rank} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
              <rect x="-28" y="-42" width="56" height="84" rx="6" fill="#faf4e6" stroke="#e6c27a" strokeWidth="1.5" />
              <rect x="-24" y="-38" width="48" height="76" rx="4" fill="none" stroke="#d4b472" strokeOpacity="0.45" strokeWidth="0.7" />
              <text x="-17" y="-23" fill={c.red ? '#c92a2e' : '#141218'} fontSize="12" fontFamily="serif" fontWeight="700">
                {c.rank}
              </text>
              <text x="0" y="12" textAnchor="middle" fill={c.red ? '#c92a2e' : '#141218'} fontSize="26" fontFamily="serif">
                {c.suit}
              </text>
            </g>
          ))}

          {/* Stacked Casino Chips */}
          <g transform="translate(68 134)">
            {[16, 10, 4, -2].map((dy, i) => (
              <g key={i} transform={`translate(0 ${dy})`}>
                <ellipse cx="0" cy="0" rx="20" ry="7.5" fill={i % 2 === 0 ? '#c92a2e' : '#e6c27a'} stroke="#120f14" strokeWidth="1.2" />
                <ellipse cx="0" cy="0" rx="12" ry="4.2" fill="none" stroke="#faf4e6" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="4 3" />
              </g>
            ))}
          </g>
          <g transform="translate(332 138)">
            {[12, 6, 0].map((dy, i) => (
              <g key={i} transform={`translate(0 ${dy})`}>
                <ellipse cx="0" cy="0" rx="18" ry="6.8" fill={i === 2 ? '#e6c27a' : '#1d1a24'} stroke="#e6c27a" strokeWidth="1.1" />
              </g>
            ))}
          </g>
        </svg>
      );

    /* ───────────────────────── 11. SNIPER HOLD'EM ───────────────────────── */
    case 'sniper-holdem':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="72%">
              <stop offset="0%" stopColor="#381219" />
              <stop offset="58%" stopColor="#190a0e" />
              <stop offset="100%" stopColor="#0a080c" />
            </radialGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Twin Ace / King Hole Cards */}
          <g transform="translate(178 96) rotate(-10)">
            <rect x="-31" y="-46" width="62" height="92" rx="6" fill="#fbf5e8" stroke="#e6c27a" strokeWidth="1.5" />
            <text x="-20" y="-27" fill="#151218" fontSize="14" fontFamily="serif" fontWeight="700">A</text>
            <text x="0" y="13" textAnchor="middle" fill="#151218" fontSize="30" fontFamily="serif">♠</text>
          </g>
          <g transform="translate(222 92) rotate(10)">
            <rect x="-31" y="-46" width="62" height="92" rx="6" fill="#fbf5e8" stroke="#e6c27a" strokeWidth="1.5" />
            <text x="-20" y="-27" fill="#c92a2e" fontSize="14" fontFamily="serif" fontWeight="700">K</text>
            <text x="0" y="13" textAnchor="middle" fill="#c92a2e" fontSize="30" fontFamily="serif">♥</text>
          </g>

          {/* Crisp Golden Sniper Scope Reticle */}
          <g transform="translate(200 90)">
            <circle cx="0" cy="0" r="68" fill="none" stroke="#e6c27a" strokeWidth="2.2" />
            <circle cx="0" cy="0" r="56" fill="none" stroke="#e6c27a" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="4 6" />
            <line x1="-110" y1="0" x2="-16" y2="0" stroke="#f5d996" strokeWidth="1.4" />
            <line x1="16" y1="0" x2="110" y2="0" stroke="#f5d996" strokeWidth="1.4" />
            <line x1="0" y1="-84" x2="0" y2="-16" stroke="#f5d996" strokeWidth="1.4" />
            <line x1="0" y1="16" x2="0" y2="84" stroke="#f5d996" strokeWidth="1.4" />
            {/* Mil-dots */}
            {[-40, -28, 28, 40].map((p) => (
              <React.Fragment key={p}>
                <line x1={p} y1="-4" x2={p} y2="4" stroke="#e6c27a" strokeWidth="1.2" />
                <line x1="-4" y1={p} x2="4" y2={p} stroke="#e6c27a" strokeWidth="1.2" />
              </React.Fragment>
            ))}
            <circle cx="0" cy="0" r="4.5" fill="#e5484d" className="artwork-pulse" />
          </g>
        </svg>
      );

    /* ───────────────────────── 12. DOUBT & BET ───────────────────────── */
    case 'doubt-and-bet':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="22%" r="78%">
              <stop offset="0%" stopColor="#35241a" />
              <stop offset="56%" stopColor="#171113" />
              <stop offset="100%" stopColor="#0a090d" />
            </radialGradient>
            <linearGradient id={`${uid}-cone`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#e6c27a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#e6c27a" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />
          <polygon points="150,0 250,0 340,180 60,180" fill={`url(#${uid}-cone)`} />

          {/* Stylized Golden Eye Emblem */}
          <g transform="translate(200 48)">
            <path d="M-44 0 Q0 -24 44 0 Q0 24 -44 0 Z" fill="#181216" stroke="#e6c27a" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="10.5" fill="#c92a2e" stroke="#f5d996" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="4" fill="#0d0a0f" />
            <circle cx="3" cy="-3" r="1.6" fill="#fff4d2" />
          </g>

          {/* Tilted Red / Black / Gold Cards */}
          <g transform="translate(132 126) rotate(-14)">
            <rect x="-24" y="-34" width="48" height="68" rx="5" fill="#b8242a" stroke="#e6c27a" strokeWidth="1.4" />
            <polygon points="0,-16 12,0 0,16 -12,0" fill="none" stroke="#f5d996" strokeWidth="1.3" />
          </g>
          <g transform="translate(182 128) rotate(6)">
            <rect x="-24" y="-34" width="48" height="68" rx="5" fill="#17141d" stroke="#e6c27a" strokeWidth="1.5" />
            <text x="0" y="7" textAnchor="middle" fill="#e6c27a" fontSize="20" fontFamily="serif" fontWeight="700">?</text>
          </g>

          {/* Rising Golden Chip Stacks */}
          <g transform="translate(262 146)">
            {[0, -8, -16, -24, -32].map((y, i) => (
              <ellipse key={i} cx="0" cy={y} rx="22" ry="7.5" fill={i === 4 ? '#f5d996' : '#c99b44'} stroke="#4a320d" strokeWidth="1.2" />
            ))}
          </g>
          <g transform="translate(306 150)">
            {[0, -8, -16].map((y, i) => (
              <ellipse key={i} cx="0" cy={y} rx="20" ry="7" fill={i === 2 ? '#e5484d' : '#8f1b20'} stroke="#f5d996" strokeWidth="1" />
            ))}
          </g>
        </svg>
      );

    /* ───────────────────────── 13. SECRET CODE ───────────────────────── */
    case 'secret-code':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="74%">
              <stop offset="0%" stopColor="#261d30" />
              <stop offset="56%" stopColor="#130f1a" />
              <stop offset="100%" stopColor="#09080d" />
            </radialGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Antique Keyhole Filigree Backdrop */}
          <g opacity="0.22" transform="translate(200 90)">
            <circle cx="0" cy="-18" r="24" fill="none" stroke="#e6c27a" strokeWidth="2" />
            <path d="M-12 2 L-22 52 H22 L12 2" fill="none" stroke="#e6c27a" strokeWidth="2" />
          </g>

          {/* Golden seal connector line */}
          <line x1="36" y1="90" x2="364" y2="90" stroke="#e6c27a" strokeOpacity="0.4" strokeWidth="1.2" strokeDasharray="4 4" />

          {/* 4 Ornate Black-and-Gold Tarot Cipher Cards */}
          {[
            { x: 76, top: '07', bot: 'G', mystery: false },
            { x: 158, top: '14', bot: 'N', mystery: false },
            { x: 240, top: '21', bot: 'U', mystery: false },
            { x: 322, top: '??', bot: '?', mystery: true },
          ].map((card) => (
            <g key={card.x} transform={`translate(${card.x} 90)`}>
              <rect
                x="-31"
                y="-48"
                width="62"
                height="96"
                rx="6"
                fill={card.mystery ? '#241219' : '#13111a'}
                stroke={card.mystery ? '#e5484d' : '#e6c27a'}
                strokeWidth="1.6"
              />
              <rect
                x="-26"
                y="-43"
                width="52"
                height="86"
                rx="3.5"
                fill="none"
                stroke={card.mystery ? '#e5484d' : '#e6c27a'}
                strokeOpacity="0.4"
                strokeWidth="0.8"
              />
              <text x="0" y="-12" textAnchor="middle" fill="#e6c27a" fontSize="13" fontFamily="monospace" fontWeight="700">
                {card.top}
              </text>
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#e6c27a" strokeOpacity="0.5" strokeWidth="1" />
              <text
                x="0"
                y="26"
                textAnchor="middle"
                fill={card.mystery ? '#ff9ea0' : '#fff2cf'}
                fontSize="22"
                fontFamily="serif"
                fontWeight="700"
              >
                {card.bot}
              </text>
            </g>
          ))}
        </svg>
      );

    /* ───────────────────────── 14. MEMORY POKER ───────────────────────── */
    case 'memory-poker':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="74%">
              <stop offset="0%" stopColor="#2c1d24" />
              <stop offset="56%" stopColor="#140f15" />
              <stop offset="100%" stopColor="#0a090d" />
            </radialGradient>
            <radialGradient id={`${uid}-spot`} cx="50%" cy="46%" r="48%">
              <stop offset="0%" stopColor="#e6c27a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#e6c27a" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />
          <rect width="400" height="180" fill={`url(#${uid}-spot)`} />

          {/* 4x4 Brass-Backed Card Grid with 3 Flipped Ivory Royal Cards (A♠ K♠ Q♠) */}
          <g transform="translate(88 18)">
            {[
              { r: 0, c: 0 }, { r: 0, c: 1, rank: 'A' }, { r: 0, c: 2 }, { r: 0, c: 3 },
              { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2, rank: 'K' }, { r: 1, c: 3 },
              { r: 2, c: 0, rank: 'Q' }, { r: 2, c: 1 }, { r: 2, c: 2 }, { r: 2, c: 3 },
              { r: 3, c: 0 }, { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 },
            ].map((cell) => {
              const x = cell.c * 58;
              const y = cell.r * 37;
              if (cell.rank) {
                return (
                  <g key={`${cell.r}-${cell.c}`} transform={`translate(${x} ${y})`}>
                    <rect width="46" height="31" rx="4" fill="#faf3e3" stroke="#f5d996" strokeWidth="1.6" />
                    <text x="14" y="21" textAnchor="middle" fill="#141218" fontSize="14" fontFamily="serif" fontWeight="700">
                      {cell.rank}
                    </text>
                    <text x="32" y="21" textAnchor="middle" fill="#141218" fontSize="14" fontFamily="serif">
                      ♠
                    </text>
                  </g>
                );
              }
              return (
                <g key={`${cell.r}-${cell.c}`} transform={`translate(${x} ${y})`}>
                  <rect width="46" height="31" rx="4" fill="#18141e" stroke="#e6c27a" strokeOpacity="0.34" strokeWidth="1" />
                  <polygon points="23,7 33,15.5 23,24 13,15.5" fill="none" stroke="#e6c27a" strokeOpacity="0.32" strokeWidth="0.9" />
                </g>
              );
            })}
            {/* Golden royal connection thread */}
            <path d="M 81 16 L 139 52 L 23 89" fill="none" stroke="#f5d996" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
          </g>
        </svg>
      );

    /* ───────────────────────── 15. FLIP (RAGE) ───────────────────────── */
    case 'flip':
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a0f14" />
              <stop offset="50%" stopColor="#140c12" />
              <stop offset="100%" stopColor="#261310" />
            </linearGradient>
          </defs>
          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Split gravity horizon */}
          <line x1="0" y1="90" x2="400" y2="90" stroke="#e6c27a" strokeOpacity="0.32" strokeDasharray="8 6" />

          {/* Top & Bottom Vermilion / Brass Gravity Spikes */}
          <path d="M0 0 H400 V24 L375 50 L350 24 L325 54 L300 24 H210 L185 52 L160 24 H70 L45 48 L20 24 H0 Z" fill="#c92a2e" stroke="#f5d996" strokeWidth="1.2" />
          <path d="M0 180 H400 V156 L360 128 L332 156 H248 L220 124 L192 156 H112 L84 128 L56 156 H0 Z" fill="#1b151e" stroke="#e6c27a" strokeWidth="1.4" />

          {/* Mid-flip ivory geometric runner + golden motion chevrons */}
          <path d="M 118 118 Q 168 90 218 62" fill="none" stroke="#f5d996" strokeWidth="2.4" strokeDasharray="5 5" className="artwork-dash" />
          <g transform="translate(226 60) rotate(22)">
            <rect x="-16" y="-16" width="32" height="32" rx="4" fill="#faf3e3" stroke="#e6c27a" strokeWidth="2" />
            <polygon points="-4,-6 8,0 -4,6" fill="#c92a2e" />
          </g>
        </svg>
      );

    /* ───────────────────────── 16. TAP (RAGE) ───────────────────────── */
    case 'tap':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="72%">
              <stop offset="0%" stopColor="#321218" />
              <stop offset="60%" stopColor="#140c11" />
              <stop offset="100%" stopColor="#0a080d" />
            </radialGradient>
          </defs>
          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Concentric Target Rings */}
          <circle cx="200" cy="90" r="66" fill="none" stroke="#e6c27a" strokeOpacity="0.22" strokeWidth="1.2" />
          <circle cx="200" cy="90" r="44" fill="none" stroke="#e5484d" strokeOpacity="0.45" strokeWidth="1.6" />
          <circle cx="200" cy="90" r="22" fill="#e5484d" fillOpacity="0.18" stroke="#f5d996" strokeWidth="2" className="artwork-pulse" />
          <circle cx="200" cy="90" r="7" fill="#fff5d6" />

          {/* Secondary Target Orbs */}
          {[
            { x: 96, y: 54, r: 15, c: '#e6c27a' },
            { x: 306, y: 122, r: 18, c: '#e5484d' },
            { x: 312, y: 48, r: 10, c: '#f5f0e6' },
            { x: 108, y: 132, r: 11, c: '#e5484d' },
          ].map((o, i) => (
            <g key={i} transform={`translate(${o.x} ${o.y})`}>
              <circle cx="0" cy="0" r={o.r} fill={o.c} fillOpacity="0.14" stroke={o.c} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="3" fill={o.c} />
            </g>
          ))}
        </svg>
      );

    /* ───────────────────────── 17. BRAIN (RAGE) ───────────────────────── */
    case 'brain':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="74%">
              <stop offset="0%" stopColor="#2c1623" />
              <stop offset="58%" stopColor="#140d16" />
              <stop offset="100%" stopColor="#0a090d" />
            </radialGradient>
          </defs>
          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Scrambled Tactile Keycaps */}
          {[
            { x: 112, y: 66, k: 'W', rot: -12, red: false },
            { x: 174, y: 104, k: 'A', rot: 9, red: true },
            { x: 234, y: 64, k: 'S', rot: 14, red: false },
            { x: 294, y: 108, k: 'D', rot: -10, red: false },
          ].map((cap) => (
            <g key={cap.k} transform={`translate(${cap.x} ${cap.y}) rotate(${cap.rot})`}>
              <rect x="-22" y="-19" width="44" height="44" rx="8" fill="#09080c" />
              <rect
                x="-22"
                y="-23"
                width="44"
                height="44"
                rx="8"
                fill={cap.red ? '#c92a2e' : '#faf3e3'}
                stroke="#e6c27a"
                strokeWidth="1.6"
              />
              <text
                x="0"
                y="6"
                textAnchor="middle"
                fill={cap.red ? '#fff7f5' : '#141218'}
                fontSize="19"
                fontFamily="monospace"
                fontWeight="800"
              >
                {cap.k}
              </text>
            </g>
          ))}

          {/* Brass Swap Arrows */}
          <path d="M 134 52 Q 174 28 212 52" fill="none" stroke="#f5d996" strokeWidth="1.8" strokeDasharray="4 4" />
          <path d="M 196 124 Q 236 148 272 124" fill="none" stroke="#e5484d" strokeWidth="1.8" strokeDasharray="4 4" />
        </svg>
      );

    /* ───────────────────────── 18. TETHER (RAGE) ───────────────────────── */
    case 'tether':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="35%" r="74%">
              <stop offset="0%" stopColor="#2c1a16" />
              <stop offset="58%" stopColor="#140e12" />
              <stop offset="100%" stopColor="#0a090d" />
            </radialGradient>
          </defs>
          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Pendulum Swing Arc */}
          <path d="M 96 122 A 126 126 0 0 0 304 122" fill="none" stroke="#e6c27a" strokeOpacity="0.34" strokeWidth="1.5" strokeDasharray="6 5" />

          {/* Brass Gate Posts */}
          <rect x="132" y="138" width="8" height="32" rx="2" fill="#e6c27a" fillOpacity="0.7" />
          <rect x="260" y="138" width="8" height="32" rx="2" fill="#e6c27a" fillOpacity="0.7" />

          {/* Pivot Anchor */}
          <circle cx="200" cy="30" r="10" fill="#18141c" stroke="#f5d996" strokeWidth="2.2" />
          <circle cx="200" cy="30" r="3.5" fill="#e6c27a" />

          {/* Elastic Crimson-Gold Tether & Weighted Orb */}
          <line x1="200" y1="30" x2="278" y2="122" stroke="#e5484d" strokeWidth="2.6" />
          <line x1="200" y1="30" x2="278" y2="122" stroke="#f5d996" strokeWidth="0.9" strokeDasharray="5 5" />
          <circle cx="278" cy="122" r="16" fill="#faf3e3" stroke="#e6c27a" strokeWidth="2.2" />
          <circle cx="278" cy="122" r="6" fill="#c92a2e" />
        </svg>
      );

    /* ───────────────────────── 19. TYPE (RAGE) ───────────────────────── */
    case 'type':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="74%">
              <stop offset="0%" stopColor="#2d1c14" />
              <stop offset="58%" stopColor="#140f12" />
              <stop offset="100%" stopColor="#0a090d" />
            </radialGradient>
          </defs>
          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Typewriter carriage baseline & speed lines */}
          <line x1="36" y1="126" x2="364" y2="126" stroke="#e6c27a" strokeOpacity="0.45" strokeWidth="1.5" />
          <line x1="36" y1="54" x2="364" y2="54" stroke="#e6c27a" strokeOpacity="0.2" strokeWidth="1" />
          <line x1="18" y1="26" x2="80" y2="48" stroke="#e5484d" strokeOpacity="0.45" strokeWidth="1.2" />
          <line x1="382" y1="26" x2="320" y2="48" stroke="#e5484d" strokeOpacity="0.45" strokeWidth="1.2" />

          {/* Bold Editorial Typewriter Flash */}
          <text x="190" y="106" textAnchor="middle" fill="#faf3e3" fontSize="34" fontFamily="serif" fontWeight="700" letterSpacing="8">
            STRIKE
          </text>
          {/* Flashing Gold Cursor Block */}
          <rect x="302" y="72" width="14" height="40" rx="2" fill="#e6c27a" className="artwork-pulse" />
          <text x="200" y="148" textAnchor="middle" fill="#e5484d" fontSize="9" fontFamily="monospace" letterSpacing="3">
            140 WPM · ZERO MERCY
          </text>
        </svg>
      );

    /* ───────────────────────── 20. CHAOS (RAGE) ───────────────────────── */
    case 'chaos':
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="74%">
              <stop offset="0%" stopColor="#381018" />
              <stop offset="58%" stopColor="#160a10" />
              <stop offset="100%" stopColor="#09070b" />
            </radialGradient>
          </defs>
          <rect width="400" height="180" fill={`url(#${uid}-bg)`} />

          {/* Radial Bullet-Hell Mandala */}
          <g transform="translate(200 90)">
            <g className="artwork-spin-slow">
              {Array.from({ length: 16 }).map((_, i) => {
                const deg = i * 22.5;
                return (
                  <g key={deg} transform={`rotate(${deg})`}>
                    <polygon points="0,-64 4,-56 0,-48 -4,-56" fill={i % 2 === 0 ? '#e5484d' : '#f5d996'} />
                    <circle cx="0" cy="-36" r="2.8" fill={i % 2 === 0 ? '#f5d996' : '#ff8c8f'} />
                  </g>
                );
              })}
            </g>
            <circle cx="0" cy="0" r="22" fill="#120a10" stroke="#e6c27a" strokeOpacity="0.5" strokeWidth="1.2" />
            {/* Serene Ivory Chevron Ship in the Eye of the Storm */}
            <polygon points="0,-10 8,8 0,4 -8,8" fill="#fff8eb" stroke="#e6c27a" strokeWidth="1.2" />
          </g>
        </svg>
      );
  }
}
