'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Brain,
  Check,
  Clock,
  CornerDownLeft,
  Cpu,
  Crosshair,
  EyeOff,
  Flame,
  FlaskConical,
  Footprints,
  HelpCircle,
  Home,
  KeyRound,
  Layers,
  Search,
  Shield,
  Spade,
  Sparkles,
  Swords,
  Target,
  User,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { playSound } from '@/lib/sounds';

export type PortalKey = 'home' | 'tactical' | 'cards' | 'quizzes' | 'experiences' | 'rage';

interface PortalNavItem {
  key: PortalKey;
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  accent: string;
}

const PORTALS: PortalNavItem[] = [
  {
    key: 'home',
    label: 'Home',
    shortLabel: 'Home',
    href: '/',
    icon: Home,
    accent: 'from-cyan-400/25 via-sky-400/15 to-fuchsia-500/20',
  },
  {
    key: 'tactical',
    label: '1v1 Arenas',
    shortLabel: 'Arenas',
    href: '/tactical-games',
    icon: Crosshair,
    accent: 'from-cyan-500/25 via-blue-500/15 to-indigo-500/20',
  },
  {
    key: 'cards',
    label: 'Card Tables',
    shortLabel: 'Cards',
    href: '/card-games',
    icon: Spade,
    accent: 'from-emerald-500/25 via-teal-500/15 to-cyan-500/20',
  },
  {
    key: 'quizzes',
    label: 'Quizzes',
    shortLabel: 'Quizzes',
    href: '/quizzes',
    icon: Brain,
    accent: 'from-fuchsia-500/25 via-purple-500/15 to-violet-500/20',
  },
  {
    key: 'experiences',
    label: 'Lab',
    shortLabel: 'Lab',
    href: '/experiences',
    icon: FlaskConical,
    accent: 'from-amber-500/25 via-orange-500/15 to-rose-500/20',
  },
  {
    key: 'rage',
    label: 'Rage',
    shortLabel: 'Rage',
    href: '/rage-games',
    icon: Flame,
    accent: 'from-rose-500/25 via-red-500/15 to-orange-500/20',
  },
];

type PaletteCategory = 'all' | 'tactical' | 'cards' | 'hubs';

interface LaunchItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: Exclude<PaletteCategory, 'all'>;
  categoryLabel: string;
  tag: string;
  icon: LucideIcon;
  accentClass: string;
  keywords: string[];
}

const LAUNCH_ITEMS: LaunchItem[] = [
  // Tactical 1v1 Arenas
  {
    id: 'equilibrium',
    title: 'Equilibrium',
    subtitle: 'Simultaneous energy allocation & counter-read duel',
    href: '/equilibrium',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: '1v1',
    icon: Shield,
    accentClass: 'text-cyan-300 bg-cyan-500/15 border-cyan-400/25',
    keywords: ['tactical', 'arena', 'duel', 'energy', 'shield', 'strike'],
  },
  {
    id: 'quantum-matrix',
    title: 'Quantum Matrix',
    subtitle: '2D grid probability warfare & superposition traps',
    href: '/quantum-matrix',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: '1v1',
    icon: Cpu,
    accentClass: 'text-indigo-300 bg-indigo-500/15 border-indigo-400/25',
    keywords: ['quantum', 'grid', 'matrix', 'tactical', 'arena'],
  },
  {
    id: 'chronos',
    title: 'Chronos Assassin',
    subtitle: 'Timeline prediction & delayed-strike assassination',
    href: '/chronos',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: '1v1',
    icon: Clock,
    accentClass: 'text-violet-300 bg-violet-500/15 border-violet-400/25',
    keywords: ['time', 'chronos', 'assassin', 'paradox', 'tactical'],
  },
  {
    id: 'glitch-roulette',
    title: 'Glitch Roulette 1v1',
    subtitle: 'Live-chamber mindgame with corrupted tactical items',
    href: '/glitch-roulette',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: '1v1',
    icon: Zap,
    accentClass: 'text-rose-300 bg-rose-500/15 border-rose-400/25',
    keywords: ['roulette', 'glitch', 'chamber', 'buckshot', '1v1'],
  },
  {
    id: 'blind-vault',
    title: 'Blind Vault',
    subtitle: 'Hidden bid & heist mindgame under fog of war',
    href: '/blind-vault',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: '1v1',
    icon: EyeOff,
    accentClass: 'text-amber-300 bg-amber-500/15 border-amber-400/25',
    keywords: ['vault', 'blind', 'heist', 'bluff', 'tactical'],
  },
  {
    id: 'void-step',
    title: 'Void Step',
    subtitle: 'Stealth movement & territorial ambush on dark tiles',
    href: '/void-step',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: '1v1',
    icon: Footprints,
    accentClass: 'text-sky-300 bg-sky-500/15 border-sky-400/25',
    keywords: ['void', 'step', 'stealth', 'grid', 'ambush'],
  },
  {
    id: 'shadow-strike',
    title: 'Shadow Strike',
    subtitle: 'High-speed feint, parry, and lethal execution duel',
    href: '/shadow-strike',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: '1v1',
    icon: Swords,
    accentClass: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-400/25',
    keywords: ['shadow', 'strike', 'parry', 'feint', 'duel'],
  },

  // Card Tables
  {
    id: 'card-game',
    title: 'Death Parade',
    subtitle: 'High-stakes psychological showdown & bluff table',
    href: '/card-game',
    category: 'cards',
    categoryLabel: 'Card Table',
    tag: 'TABLE',
    icon: Spade,
    accentClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/25',
    keywords: ['death', 'parade', 'cards', 'poker', 'multiplayer'],
  },
  {
    id: 'sniper-holdem',
    title: 'Sniper Hold\'em',
    subtitle: 'Texas Hold\'em mutated with lethal sniper callouts',
    href: '/sniper-holdem',
    category: 'cards',
    categoryLabel: 'Card Table',
    tag: 'TABLE',
    icon: Target,
    accentClass: 'text-red-300 bg-red-500/15 border-red-400/25',
    keywords: ['sniper', 'holdem', 'poker', 'cards', 'chips'],
  },
  {
    id: 'doubt-and-bet',
    title: 'Doubt & Bet',
    subtitle: 'Deception, calling bluffs, and escalating stakes',
    href: '/doubt-and-bet',
    category: 'cards',
    categoryLabel: 'Card Table',
    tag: 'TABLE',
    icon: HelpCircle,
    accentClass: 'text-amber-300 bg-amber-500/15 border-amber-400/25',
    keywords: ['doubt', 'bet', 'bluff', 'liar', 'cards'],
  },
  {
    id: 'secret-code',
    title: 'Secret Order',
    subtitle: 'Deduction card table of hidden ranks and logic rules',
    href: '/secret-code',
    category: 'cards',
    categoryLabel: 'Card Table',
    tag: 'TABLE',
    icon: KeyRound,
    accentClass: 'text-cyan-300 bg-cyan-500/15 border-cyan-400/25',
    keywords: ['secret', 'order', 'code', 'deduction', 'logic'],
  },
  {
    id: 'memory-poker',
    title: 'Memory Poker',
    subtitle: 'Face-down card recall under rising pot pressure',
    href: '/memory-poker',
    category: 'cards',
    categoryLabel: 'Card Table',
    tag: 'TABLE',
    icon: Layers,
    accentClass: 'text-teal-300 bg-teal-500/15 border-teal-400/25',
    keywords: ['memory', 'poker', 'recall', 'cards', 'bluff'],
  },

  // Hubs
  {
    id: 'quizzes',
    title: 'Quizzes',
    subtitle: 'NPC stat cards, ego diagnostics & personality verdicts',
    href: '/quizzes',
    category: 'hubs',
    categoryLabel: 'Hub',
    tag: 'HUB',
    icon: Brain,
    accentClass: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-400/25',
    keywords: ['quiz', 'npc', 'stat', 'card', 'personality', 'hub'],
  },
  {
    id: 'experiences',
    title: 'Weird Lab',
    subtitle: 'Experimental cyber curiosities & interactive oddities',
    href: '/experiences',
    category: 'hubs',
    categoryLabel: 'Hub',
    tag: 'HUB',
    icon: FlaskConical,
    accentClass: 'text-amber-300 bg-amber-500/15 border-amber-400/25',
    keywords: ['weird', 'lab', 'experiences', 'experiments', 'hub'],
  },
  {
    id: 'rage-games',
    title: 'Rage Suite',
    subtitle: 'Unforgiving reflex gauntlets engineered to tilt you',
    href: '/rage-games',
    category: 'hubs',
    categoryLabel: 'Hub',
    tag: 'HUB',
    icon: Flame,
    accentClass: 'text-rose-300 bg-rose-500/15 border-rose-400/25',
    keywords: ['rage', 'suite', 'hard', 'tilt', 'arcade', 'hub'],
  },
];

const CATEGORY_TABS: { key: PaletteCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'tactical', label: '1v1 Arenas' },
  { key: 'cards', label: 'Card Tables' },
  { key: 'hubs', label: 'Hubs' },
];

const NICK_STORAGE_KEY = 'realityCheckNick';

export default function GlobalNav({ activePortal = 'home' }: { activePortal?: PortalKey }) {
  const router = useRouter();

  // Command palette state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PaletteCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Callsign popover state
  const [callsign, setCallsign] = useState<string>('');
  const [callsignOpen, setCallsignOpen] = useState(false);
  const [draftCallsign, setDraftCallsign] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const callsignContainerRef = useRef<HTMLDivElement>(null);
  const callsignInputRef = useRef<HTMLInputElement>(null);

  // Load persisted callsign on mount & sync across storage changes
  useEffect(() => {
    const readNick = () => {
      try {
        const stored = window.localStorage.getItem(NICK_STORAGE_KEY) ?? '';
        setCallsign(stored.trim());
      } catch {
        // Ignore storage restrictions
      }
    };

    readNick();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === NICK_STORAGE_KEY) {
        readNick();
      }
    };
    const handleCustomSync = () => readNick();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('realityCheckNickChanged', handleCustomSync);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('realityCheckNickChanged', handleCustomSync);
    };
  }, []);

  // Global Cmd+K / Ctrl+K & Escape shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playSound('tick');
        setCallsignOpen(false);
        setPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (paletteOpen) {
          e.preventDefault();
          setPaletteOpen(false);
        } else if (callsignOpen) {
          e.preventDefault();
          setCallsignOpen(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen, callsignOpen]);

  // Focus search input & reset query state when palette opens
  useEffect(() => {
    if (paletteOpen) {
      setSelectedIndex(0);
      const id = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => window.clearTimeout(id);
    }
    setQuery('');
    setCategory('all');
  }, [paletteOpen]);

  // Focus callsign input when popover opens & close on outside click
  useEffect(() => {
    if (!callsignOpen) return;
    setDraftCallsign(callsign);
    const id = window.setTimeout(() => {
      callsignInputRef.current?.focus();
      callsignInputRef.current?.select();
    }, 20);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        callsignContainerRef.current &&
        !callsignContainerRef.current.contains(e.target as Node)
      ) {
        setCallsignOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callsignOpen, callsign]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return LAUNCH_ITEMS.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!normalized) return true;
      return (
        item.title.toLowerCase().includes(normalized) ||
        item.subtitle.toLowerCase().includes(normalized) ||
        item.categoryLabel.toLowerCase().includes(normalized) ||
        item.keywords.some((kw) => kw.includes(normalized))
      );
    });
  }, [query, category]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category]);

  const launchRoute = (href: string) => {
    playSound('chip');
    setPaletteOpen(false);
    router.push(href);
  };

  const handlePaletteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      playSound('tick');
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      playSound('tick');
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredItems[selectedIndex];
      if (target) launchRoute(target.href);
    }
  };

  const saveCallsign = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = draftCallsign.trim().slice(0, 20);
    try {
      if (cleaned) {
        window.localStorage.setItem(NICK_STORAGE_KEY, cleaned);
      } else {
        window.localStorage.removeItem(NICK_STORAGE_KEY);
      }
      window.dispatchEvent(new Event('realityCheckNickChanged'));
    } catch {
      // Ignore storage restrictions
    }
    setCallsign(cleaned);
    playSound('chip');
    setJustSaved(true);
    window.setTimeout(() => {
      setJustSaved(false);
      setCallsignOpen(false);
    }, 350);
  };

  const clearCallsign = () => {
    setDraftCallsign('');
    try {
      window.localStorage.removeItem(NICK_STORAGE_KEY);
      window.dispatchEvent(new Event('realityCheckNickChanged'));
    } catch {
      // Ignore storage restrictions
    }
    setCallsign('');
    playSound('tick');
    setCallsignOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#060812]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#060812]/70">
        {/* Specular top sheen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
        />

        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
          {/* Left: Brand Logo */}
          <Link
            href="/"
            onClick={() => playSound('tick')}
            className="group flex shrink-0 items-center gap-2.5 rounded-lg py-1 pr-1 transition-opacity hover:opacity-95"
          >
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/60 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-fuchsia-400 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
            </span>

            <span className="flex items-center gap-2">
              <span className="font-sans text-sm font-black tracking-[0.14em] text-white uppercase sm:text-[15px]">
                REALITY{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300 bg-clip-text text-transparent">
                  CHECK
                </span>
              </span>
              <span className="hidden rounded border border-cyan-400/25 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-cyan-300/90 sm:inline-flex">
                OS v2
              </span>
            </span>
          </Link>

          {/* Center: Desktop Portal Switcher */}
          <nav
            aria-label="Primary portals"
            className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:flex"
          >
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const isActive = activePortal === portal.key;
              return (
                <Link
                  key={portal.key}
                  href={portal.href}
                  onClick={() => playSound('tick')}
                  className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="globalNavActive"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className={`absolute inset-0 rounded-full border border-white/15 bg-gradient-to-r ${portal.accent} shadow-[0_0_20px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]`}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-3.5 w-3.5 ${
                      isActive ? 'text-cyan-300' : 'text-zinc-400'
                    }`}
                  />
                  <span className="relative z-10 whitespace-nowrap">{portal.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Quick Launch + Callsign Pill */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playSound('tick');
                setCallsignOpen(false);
                setPaletteOpen(true);
              }}
              aria-label="Open Quick Launch Command Palette"
              className="group flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-white"
            >
              <Search className="h-3.5 w-3.5 text-cyan-300/80 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Quick Launch</span>
              <kbd className="inline-flex items-center gap-0.5 rounded border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 group-hover:border-cyan-400/30 group-hover:text-cyan-200">
                ⌘K
              </kbd>
            </button>

            {/* Editable Callsign Pill + Inline Popover */}
            <div ref={callsignContainerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  playSound('tick');
                  setCallsignOpen((prev) => !prev);
                }}
                aria-expanded={callsignOpen}
                aria-label="Edit multiplayer callsign"
                className={`flex h-9 max-w-[140px] items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all sm:max-w-[180px] ${
                  callsign
                    ? 'border-cyan-400/25 bg-cyan-500/[0.08] text-cyan-100 hover:border-cyan-400/50 hover:bg-cyan-500/15'
                    : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 hover:text-white'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    callsign
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                      : 'bg-zinc-500'
                  }`}
                />
                <User className="h-3.5 w-3.5 shrink-0 text-cyan-300/80" />
                <span className="truncate font-mono text-[11px]">
                  {callsign || 'Set Callsign'}
                </span>
              </button>

              <AnimatePresence>
                {callsignOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="glass-panel absolute right-0 mt-2.5 w-72 rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.75)]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-widest text-cyan-300 uppercase">
                        <Sparkles className="h-3 w-3" />
                        Operator Callsign
                      </span>
                      <button
                        type="button"
                        onClick={() => setCallsignOpen(false)}
                        className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Close callsign editor"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="mb-2.5 text-[11px] leading-relaxed text-zinc-400">
                      Synced automatically across all 1v1 arenas and multiplayer card lobbies.
                    </p>

                    <form onSubmit={saveCallsign} className="space-y-2.5">
                      <input
                        ref={callsignInputRef}
                        type="text"
                        maxLength={20}
                        value={draftCallsign}
                        onChange={(e) => setDraftCallsign(e.target.value)}
                        placeholder="e.g. GHOST_07"
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white placeholder-zinc-500 transition-colors focus:border-cyan-400/60 focus:outline-none"
                      />
                      <div className="flex items-center justify-between gap-2">
                        {callsign ? (
                          <button
                            type="button"
                            onClick={clearCallsign}
                            className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-rose-300"
                          >
                            Clear
                          </button>
                        ) : (
                          <span className="font-mono text-[10px] text-zinc-500">
                            Max 20 chars
                          </span>
                        )}
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-transform hover:brightness-110 active:scale-95"
                        >
                          {justSaved ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Saved
                            </>
                          ) : (
                            'Save'
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Horizontal Scrollable Portal Strip */}
        <nav
          aria-label="Mobile portals"
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-white/[0.06] bg-black/25 px-3 py-2 lg:hidden"
        >
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isActive = activePortal === portal.key;
            return (
              <Link
                key={portal.key}
                href={portal.href}
                onClick={() => playSound('tick')}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="globalNavActiveMobile"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className={`absolute inset-0 rounded-full border border-white/15 bg-gradient-to-r ${portal.accent} shadow-[0_0_16px_rgba(34,211,238,0.18)]`}
                  />
                )}
                <Icon
                  className={`relative z-10 h-3.5 w-3.5 ${
                    isActive ? 'text-cyan-300' : 'text-zinc-400'
                  }`}
                />
                <span className="relative z-10 whitespace-nowrap">{portal.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setPaletteOpen(false)}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 pt-[8vh] backdrop-blur-md sm:pt-[12vh]"
            role="dialog"
            aria-modal="true"
            aria-label="Quick Launch Command Palette"
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 440, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-[0_32px_90px_rgba(0,0,0,0.85),0_0_60px_rgba(34,211,238,0.12)]"
            >
              {/* Top Search Bar */}
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
                <Search className="h-4 w-4 shrink-0 text-cyan-300" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handlePaletteKeyDown}
                  placeholder="Jump to any arena, card table, or hub..."
                  className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPaletteOpen(false)}
                  className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:text-white sm:inline-flex"
                >
                  ESC
                </button>
              </div>

              {/* Category Filter Strip */}
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-black/25 px-4 py-2">
                {CATEGORY_TABS.map((tab) => {
                  const active = category === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        playSound('tick');
                        setCategory(tab.key);
                      }}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                        active
                          ? 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.18)]'
                          : 'border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
                <span className="ml-auto font-mono text-[10px] text-zinc-500">
                  {filteredItems.length} {filteredItems.length === 1 ? 'route' : 'routes'}
                </span>
              </div>

              {/* Results List */}
              <div className="max-h-[55vh] overflow-y-auto p-2">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="mb-2 h-6 w-6 text-zinc-600" />
                    <p className="text-sm font-medium text-zinc-300">No matching modules</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Try searching for Equilibrium, Poker, Quizzes, or Rage.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {filteredItems.map((item, idx) => {
                      const Icon = item.icon;
                      const isSelected = idx === selectedIndex;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setSelectedIndex(idx)}
                            onClick={() => launchRoute(item.href)}
                            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                              isSelected
                                ? 'bg-white/[0.08] ring-1 ring-cyan-400/35'
                                : 'hover:bg-white/[0.05]'
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${item.accentClass}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-white">
                                  {item.title}
                                </span>
                                <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-zinc-400 uppercase">
                                  {item.tag}
                                </span>
                              </div>
                              <p className="truncate text-xs text-zinc-400">
                                {item.subtitle}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <span className="hidden font-mono text-[10px] text-zinc-500 sm:inline">
                                {item.href}
                              </span>
                              <ArrowRight
                                className={`h-4 w-4 transition-transform ${
                                  isSelected
                                    ? 'translate-x-0.5 text-cyan-300'
                                    : 'text-zinc-600 group-hover:text-zinc-300'
                                }`}
                              />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Footer Hints */}
              <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/35 px-4 py-2 font-mono text-[10px] text-zinc-500">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="rounded border border-white/10 bg-white/5 px-1 text-zinc-300">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CornerDownLeft className="h-3 w-3 text-zinc-400" />
                    launch
                  </span>
                </div>
                <span className="text-cyan-400/70">REALITY CHECK // OS v2</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
