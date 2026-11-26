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
  Gem,
  HelpCircle,
  Home,
  KeyRound,
  Layers,
  Orbit,
  Search,
  Shield,
  Spade,
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
  href: string;
  icon: LucideIcon;
}

const PORTALS: PortalNavItem[] = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'tactical', label: 'Arenas', href: '/tactical-games', icon: Crosshair },
  { key: 'cards', label: 'Cards', href: '/card-games', icon: Spade },
  { key: 'quizzes', label: 'Quizzes', href: '/quizzes', icon: Brain },
  { key: 'experiences', label: 'Lab', href: '/experiences', icon: FlaskConical },
  { key: 'rage', label: 'Rage', href: '/rage-games', icon: Flame },
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
  isNew?: boolean;
  icon: LucideIcon;
  keywords: string[];
}

const LAUNCH_ITEMS: LaunchItem[] = [
  // Tactical 1v1 Arenas
  {
    id: 'mind-heist',
    title: 'Mind Heist',
    subtitle: '3-Ring Astral Vault duel, Phantom Traps & 6 Surreal Relics',
    href: '/mind-heist',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: 'NEW · 1v1',
    isNew: true,
    icon: Orbit,
    keywords: [
      'mind',
      'heist',
      'astral',
      'vault',
      'rings',
      'phantom',
      'traps',
      'relics',
      'surreal',
      'mirage',
      'paranoia',
      'tactical',
      '1v1',
      'duel',
    ],
  },
  {
    id: 'reality-draft',
    title: 'Reality Draft',
    subtitle: 'Cosmic 3D Anomaly Cards, World Distortions & Double Stakes',
    href: '/reality-draft',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: 'NEW · 1v1',
    isNew: true,
    icon: Gem,
    keywords: [
      'reality',
      'draft',
      'cosmic',
      'anomaly',
      'cards',
      'holographic',
      'distortions',
      'double',
      'stakes',
      'ward',
      'surreal',
      'tactical',
      '1v1',
      'duel',
    ],
  },
  {
    id: 'equilibrium',
    title: 'Equilibrium',
    subtitle: 'Simultaneous energy allocation & counter-read duel',
    href: '/equilibrium',
    category: 'tactical',
    categoryLabel: 'Tactical 1v1',
    tag: '1v1',
    icon: Shield,
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
    keywords: ['death', 'parade', 'cards', 'poker', 'multiplayer'],
  },
  {
    id: 'sniper-holdem',
    title: "Sniper Hold'em",
    subtitle: "Texas Hold'em mutated with lethal sniper callouts",
    href: '/sniper-holdem',
    category: 'cards',
    categoryLabel: 'Card Table',
    tag: 'TABLE',
    icon: Target,
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
    keywords: ['quiz', 'npc', 'stat', 'card', 'personality', 'hub'],
  },
  {
    id: 'experiences',
    title: 'Weird Lab',
    subtitle: 'Experimental curiosities & interactive oddities',
    href: '/experiences',
    category: 'hubs',
    categoryLabel: 'Hub',
    tag: 'HUB',
    icon: FlaskConical,
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
    keywords: ['rage', 'suite', 'hard', 'tilt', 'arcade', 'hub'],
  },
];

const CATEGORY_TABS: { key: PaletteCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'tactical', label: 'Arenas' },
  { key: 'cards', label: 'Cards' },
  { key: 'hubs', label: 'Hubs' },
];

const CATEGORY_SECTIONS: {
  key: Exclude<PaletteCategory, 'all'>;
  heading: string;
}[] = [
  { key: 'tactical', heading: 'Tactical 1v1 Arenas' },
  { key: 'cards', heading: 'Card Tables' },
  { key: 'hubs', heading: 'Hubs & Experiments' },
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

  const groupedSections = useMemo(() => {
    let runningIndex = 0;
    return CATEGORY_SECTIONS.map((section) => {
      const items = filteredItems
        .filter((item) => item.category === section.key)
        .map((item) => ({ item, flatIndex: runningIndex++ }));
      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [filteredItems]);

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
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: Brand Mark */}
          <Link
            href="/"
            onClick={() => playSound('tick')}
            className="flex shrink-0 items-center gap-2.5 rounded-md py-1 transition-opacity hover:opacity-90"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 font-display text-[11px] font-black tracking-tighter text-zinc-950">
              RC
            </span>
            <span className="font-display text-sm font-semibold tracking-tight text-zinc-100">
              Reality Check
            </span>
          </Link>

          {/* Center: Desktop Navigation */}
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const isActive = activePortal === portal.key;
              return (
                <Link
                  key={portal.key}
                  href={portal.href}
                  onClick={() => playSound('tick')}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="globalNavActive"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute inset-0 rounded-lg bg-zinc-800/80 ring-1 ring-inset ring-zinc-700/60"
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-3.5 w-3.5 ${
                      isActive ? 'text-zinc-100' : 'text-zinc-500'
                    }`}
                  />
                  <span className="relative z-10 whitespace-nowrap">{portal.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Search & Callsign */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playSound('tick');
                setCallsignOpen(false);
                setPaletteOpen(true);
              }}
              aria-label="Search games and hubs"
              className="flex h-8 items-center gap-2 rounded-lg border border-zinc-800 bg-[#111113] px-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200 sm:w-44 sm:justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-zinc-500" />
                <span className="hidden sm:inline">Search...</span>
              </span>
              <kbd className="inline-flex items-center rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                ⌘K
              </kbd>
            </button>

            {/* Editable Callsign Button & Popover */}
            <div ref={callsignContainerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  playSound('tick');
                  setCallsignOpen((prev) => !prev);
                }}
                aria-expanded={callsignOpen}
                aria-label="Edit multiplayer callsign"
                className="flex h-8 max-w-[140px] items-center gap-2 rounded-lg border border-zinc-800 bg-[#111113] px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100 sm:max-w-[172px]"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    callsign ? 'bg-amber-500' : 'bg-zinc-600'
                  }`}
                />
                <User className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="truncate font-mono text-[11px] text-zinc-200">
                  {callsign || 'Callsign'}
                </span>
              </button>

              <AnimatePresence>
                {callsignOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-800 bg-[#111113] p-4 shadow-2xl"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-100">
                        Player Callsign
                      </span>
                      <button
                        type="button"
                        onClick={() => setCallsignOpen(false)}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                        aria-label="Close callsign editor"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="mb-3 text-xs leading-relaxed text-zinc-400">
                      Synced across all 1v1 arenas and multiplayer card lobbies.
                    </p>

                    <form onSubmit={saveCallsign} className="space-y-3">
                      <input
                        ref={callsignInputRef}
                        type="text"
                        maxLength={20}
                        value={draftCallsign}
                        onChange={(e) => setDraftCallsign(e.target.value)}
                        placeholder="e.g. GHOST_07"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-zinc-600 focus:outline-none"
                      />
                      <div className="flex items-center justify-between gap-2">
                        {callsign ? (
                          <button
                            type="button"
                            onClick={clearCallsign}
                            className="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200"
                          >
                            Clear
                          </button>
                        ) : (
                          <span className="font-mono text-[11px] text-zinc-500">
                            Max 20 chars
                          </span>
                        )}
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-white active:scale-[0.98]"
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

        {/* Mobile & Tablet Horizontal Scrollable Nav Strip */}
        <nav
          aria-label="Mobile navigation"
          className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-zinc-800/70 bg-[#09090b]/95 px-4 py-1.5 lg:hidden"
        >
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isActive = activePortal === portal.key;
            return (
              <Link
                key={portal.key}
                href={portal.href}
                onClick={() => playSound('tick')}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="globalNavActiveMobile"
                    transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    className="absolute inset-0 rounded-lg bg-zinc-800/80 ring-1 ring-inset ring-zinc-700/60"
                  />
                )}
                <Icon
                  className={`relative z-10 h-3.5 w-3.5 ${
                    isActive ? 'text-zinc-100' : 'text-zinc-500'
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
            transition={{ duration: 0.14 }}
            onClick={() => setPaletteOpen(false)}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[8vh] backdrop-blur-sm sm:pt-[12vh]"
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-[#111113] shadow-2xl"
            >
              {/* Search Bar */}
              <div className="flex items-center gap-3 border-b border-zinc-800/90 px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handlePaletteKeyDown}
                  placeholder="Jump to any arena, card table, or hub..."
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPaletteOpen(false)}
                  className="hidden rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:text-zinc-200 sm:inline-flex"
                >
                  ESC
                </button>
              </div>

              {/* Category Filter Strip */}
              <div className="flex items-center gap-1 border-b border-zinc-800/80 bg-[#0d0d0f] px-4 py-2">
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
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-zinc-800 text-zinc-50'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
                <span className="ml-auto font-mono text-[11px] text-zinc-500">
                  {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
                </span>
              </div>

              {/* Grouped Results List */}
              <div className="max-h-[55vh] overflow-y-auto p-2">
                {groupedSections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="mb-2.5 h-5 w-5 text-zinc-600" />
                    <p className="text-sm font-medium text-zinc-300">No matching games or hubs</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Try Mind Heist, Reality Draft, Equilibrium, Poker, or Quizzes.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/70">
                    {groupedSections.map((section) => (
                      <div key={section.key} className="py-1.5 first:pt-0.5 last:pb-0.5">
                        <div className="px-2.5 py-1.5 text-[11px] font-medium tracking-wide text-zinc-500">
                          {section.heading}
                        </div>
                        <ul className="space-y-0.5">
                          {section.items.map(({ item, flatIndex }) => {
                            const Icon = item.icon;
                            const isSelected = flatIndex === selectedIndex;
                            return (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  onMouseEnter={() => setSelectedIndex(flatIndex)}
                                  onClick={() => launchRoute(item.href)}
                                  className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                                    isSelected ? 'bg-zinc-800/80' : 'hover:bg-zinc-900/70'
                                  }`}
                                >
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                      isSelected
                                        ? 'border-zinc-700 bg-zinc-900 text-zinc-100'
                                        : 'border-zinc-800/90 bg-zinc-950 text-zinc-400'
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate text-sm font-medium text-zinc-100">
                                        {item.title}
                                      </span>
                                      <span
                                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide ${
                                          item.isNew
                                            ? 'border-amber-500/25 bg-amber-500/10 text-amber-400'
                                            : 'border-zinc-800 bg-zinc-900/90 text-zinc-400'
                                        }`}
                                      >
                                        {item.tag}
                                      </span>
                                    </div>
                                    <p className="truncate text-xs text-zinc-400">
                                      {item.subtitle}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-2">
                                    <span className="hidden font-mono text-[11px] text-zinc-500 sm:inline">
                                      {item.href}
                                    </span>
                                    <ArrowRight
                                      className={`h-3.5 w-3.5 transition-transform ${
                                        isSelected
                                          ? 'translate-x-0.5 text-zinc-200'
                                          : 'text-zinc-600 group-hover:text-zinc-400'
                                      }`}
                                    />
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Hints */}
              <div className="flex items-center justify-between border-t border-zinc-800/80 bg-[#0d0d0f] px-4 py-2 font-mono text-[11px] text-zinc-500">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 text-zinc-400">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CornerDownLeft className="h-3 w-3 text-zinc-400" />
                    open
                  </span>
                </div>
                <span className="text-zinc-500">Reality Check</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
