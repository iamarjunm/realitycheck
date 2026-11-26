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
  { key: 'tactical', label: '1v1 Arenas', href: '/tactical-games', icon: Crosshair },
  { key: 'cards', label: 'Card Tables', href: '/card-games', icon: Spade },
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
  { key: 'tactical', label: '1v1 Arenas' },
  { key: 'cards', label: 'Card Tables' },
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
      <header className="sticky top-0 z-40 w-full border-b border-[#e6c27a]/15 bg-[#0c0b0e]/90 backdrop-blur-xl">
        {/* Warm brass bottom hairline sheen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#e6c27a]/40 to-transparent"
        />

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: Sculptural Noir Atelier Brand Mark */}
          <Link
            href="/"
            onClick={() => playSound('tick')}
            className="group flex shrink-0 items-center gap-2.5 rounded-lg py-1 transition-opacity hover:opacity-95"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6c27a]/40 bg-gradient-to-b from-[#231d15] to-[#120f15] shadow-[inset_0_1px_0_rgba(255,245,215,0.22),0_4px_12px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:scale-[1.03]">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
                <defs>
                  <linearGradient id="rc-crest-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff2c2" />
                    <stop offset="50%" stopColor="#e6c27a" />
                    <stop offset="100%" stopColor="#a6772b" />
                  </linearGradient>
                </defs>
                <polygon
                  points="12,2 21,12 12,22 3,12"
                  fill="url(#rc-crest-gold)"
                  fillOpacity="0.16"
                  stroke="url(#rc-crest-gold)"
                  strokeWidth="1.6"
                />
                <polygon points="12,6.5 16.5,12 12,17.5 7.5,12" fill="url(#rc-crest-gold)" />
                <circle cx="12" cy="12" r="2" fill="#141008" />
              </svg>
            </span>

            <span className="flex items-baseline gap-1.5 leading-none">
              <span className="font-display text-[15px] font-extrabold tracking-tight text-[#f5f0e6]">
                REALITY
              </span>
              <span className="font-serif text-[17px] font-semibold italic text-[#e6c27a]">
                Check
              </span>
            </span>
          </Link>

          {/* Center: Desktop Portal Switcher */}
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const isActive = activePortal === portal.key;
              return (
                <Link
                  key={portal.key}
                  href={portal.href}
                  onClick={() => playSound('tick')}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-[#f5d996]'
                      : 'text-[#a89f91] hover:text-[#f5f0e6]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="globalNavActive"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute inset-0 rounded-lg border border-[#e6c27a]/40 bg-[#e6c27a]/15 shadow-[inset_0_1px_0_rgba(255,245,215,0.16)]"
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-3.5 w-3.5 ${
                      isActive ? 'text-[#e6c27a]' : 'text-[#7c7368]'
                    }`}
                  />
                  <span className="relative z-10 whitespace-nowrap">{portal.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Quick Jump Trigger & Callsign Badge */}
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                playSound('tick');
                setCallsignOpen(false);
                setPaletteOpen(true);
              }}
              aria-label="Quick jump to games and hubs"
              className="flex h-9 items-center gap-2 rounded-lg border border-[#e6c27a]/20 bg-[#16141b] px-3 text-xs font-medium text-[#c7beb0] shadow-[inset_0_1px_0_rgba(255,245,220,0.06)] transition-all hover:border-[#e6c27a]/45 hover:bg-[#1d1a24] hover:text-[#f5f0e6] sm:w-44 sm:justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#e6c27a]/80" />
                <span className="hidden sm:inline">Quick Jump</span>
              </span>
              <kbd className="inline-flex items-center rounded border border-[#e6c27a]/25 bg-[#0e0c12] px-1.5 py-0.5 font-mono text-[10px] text-[#e6c27a]">
                ⌘K
              </kbd>
            </button>

            {/* Editable Callsign Badge & Popover */}
            <div ref={callsignContainerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  playSound('tick');
                  setCallsignOpen((prev) => !prev);
                }}
                aria-expanded={callsignOpen}
                aria-label="Edit multiplayer callsign"
                className="flex h-9 max-w-[144px] items-center gap-2 rounded-lg border border-[#e6c27a]/20 bg-[#16141b] px-3 text-xs font-medium text-[#e9e0d0] shadow-[inset_0_1px_0_rgba(255,245,220,0.06)] transition-all hover:border-[#e6c27a]/45 hover:bg-[#1d1a24] sm:max-w-[176px]"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    callsign
                      ? 'bg-[#e6c27a] shadow-[0_0_8px_rgba(230,194,122,0.75)]'
                      : 'bg-[#e6c27a]/35'
                  }`}
                />
                <User className="h-3.5 w-3.5 shrink-0 text-[#b8ae9e]" />
                <span className="truncate font-mono text-[11px] text-[#f5f0e6]">
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
                    className="absolute right-0 mt-2.5 w-72 rounded-xl border border-[#e6c27a]/25 bg-[#15131a] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,245,220,0.08)]"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-display text-xs font-bold tracking-wide text-[#f5f0e6]">
                        Player Callsign
                      </span>
                      <button
                        type="button"
                        onClick={() => setCallsignOpen(false)}
                        className="rounded-md p-1 text-[#8f8578] transition-colors hover:bg-[#24202c] hover:text-[#f5f0e6]"
                        aria-label="Close callsign editor"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="mb-3 text-xs leading-relaxed text-[#a89f91]">
                      Synced across all 1v1 arenas and multiplayer card tables.
                    </p>

                    <form onSubmit={saveCallsign} className="space-y-3">
                      <input
                        ref={callsignInputRef}
                        type="text"
                        maxLength={20}
                        value={draftCallsign}
                        onChange={(e) => setDraftCallsign(e.target.value)}
                        placeholder="e.g. GHOST_07"
                        className="w-full rounded-lg border border-[#e6c27a]/20 bg-[#0d0c11] px-3 py-2 font-mono text-xs text-[#f5f0e6] placeholder-[#686058] transition-colors focus:border-[#e6c27a]/55 focus:outline-none"
                      />
                      <div className="flex items-center justify-between gap-2">
                        {callsign ? (
                          <button
                            type="button"
                            onClick={clearCallsign}
                            className="rounded-md px-2 py-1 text-xs font-medium text-[#a89f91] transition-colors hover:bg-[#24202c] hover:text-[#f5f0e6]"
                          >
                            Clear
                          </button>
                        ) : (
                          <span className="font-mono text-[11px] text-[#7c7368]">
                            Max 20 chars
                          </span>
                        )}
                        <button
                          type="submit"
                          className="btn-brass inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs"
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
          className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-[#e6c27a]/10 bg-[#0c0b0e]/95 px-4 py-1.5 lg:hidden"
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
                  isActive ? 'text-[#f5d996]' : 'text-[#a89f91] hover:text-[#f5f0e6]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="globalNavActiveMobile"
                    transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    className="absolute inset-0 rounded-lg border border-[#e6c27a]/40 bg-[#e6c27a]/15"
                  />
                )}
                <Icon
                  className={`relative z-10 h-3.5 w-3.5 ${
                    isActive ? 'text-[#e6c27a]' : 'text-[#7c7368]'
                  }`}
                />
                <span className="relative z-10 whitespace-nowrap">{portal.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Noir Atelier Command Palette Modal */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            onClick={() => setPaletteOpen(false)}
            className="fixed inset-0 z-50 flex items-start justify-center bg-[#060508]/80 px-4 pt-[8vh] backdrop-blur-md sm:pt-[12vh]"
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
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#e6c27a]/25 bg-[#15131a] shadow-[0_30px_90px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,245,220,0.09)]"
            >
              {/* Search Bar */}
              <div className="flex items-center gap-3 border-b border-[#e6c27a]/15 px-4 py-3.5">
                <Search className="h-4 w-4 shrink-0 text-[#e6c27a]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handlePaletteKeyDown}
                  placeholder="Jump to any arena, card table, or hub..."
                  className="w-full bg-transparent text-sm text-[#f5f0e6] placeholder-[#7c7368] focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="rounded-md p-1 text-[#8f8578] transition-colors hover:bg-[#24202c] hover:text-[#f5f0e6]"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPaletteOpen(false)}
                  className="hidden rounded border border-[#e6c27a]/20 bg-[#100e14] px-1.5 py-0.5 font-mono text-[10px] text-[#c7beb0] transition-colors hover:border-[#e6c27a]/45 hover:text-[#f5f0e6] sm:inline-flex"
                >
                  ESC
                </button>
              </div>

              {/* Category Filter Strip */}
              <div className="flex items-center gap-1 border-b border-[#e6c27a]/10 bg-[#100e14] px-4 py-2">
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
                          ? 'border border-[#e6c27a]/35 bg-[#e6c27a]/15 text-[#f5d996]'
                          : 'text-[#a89f91] hover:bg-[#1b1822] hover:text-[#f5f0e6]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
                <span className="ml-auto font-mono text-[11px] text-[#8f8578]">
                  {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
                </span>
              </div>

              {/* Grouped Results List */}
              <div className="max-h-[55vh] overflow-y-auto p-2">
                {groupedSections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="mb-2.5 h-5 w-5 text-[#7c7368]" />
                    <p className="text-sm font-medium text-[#e9e0d0]">No matching games or hubs</p>
                    <p className="mt-1 text-xs text-[#8f8578]">
                      Try Mind Heist, Reality Draft, Equilibrium, Poker, or Quizzes.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e6c27a]/10">
                    {groupedSections.map((section) => (
                      <div key={section.key} className="py-1.5 first:pt-0.5 last:pb-0.5">
                        <div className="px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9e917d]">
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
                                  className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                                    isSelected
                                      ? 'border border-[#e6c27a]/30 bg-[#e6c27a]/12'
                                      : 'border border-transparent hover:bg-[#1d1a24]'
                                  }`}
                                >
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                      isSelected
                                        ? 'border-[#e6c27a]/45 bg-[#241e18] text-[#f5d996]'
                                        : 'border-[#e6c27a]/14 bg-[#100e14] text-[#9e9486]'
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate text-sm font-semibold text-[#f5f0e6]">
                                        {item.title}
                                      </span>
                                      <span
                                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide ${
                                          item.isNew
                                            ? 'border-[#e6c27a]/40 bg-[#e6c27a]/15 text-[#f5d996]'
                                            : 'border-[#e6c27a]/15 bg-[#100e14] text-[#a89f91]'
                                        }`}
                                      >
                                        {item.tag}
                                      </span>
                                    </div>
                                    <p className="truncate text-xs text-[#a89f91]">
                                      {item.subtitle}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-2">
                                    <span className="hidden font-mono text-[11px] text-[#7c7368] sm:inline">
                                      {item.href}
                                    </span>
                                    <ArrowRight
                                      className={`h-3.5 w-3.5 transition-transform ${
                                        isSelected
                                          ? 'translate-x-0.5 text-[#e6c27a]'
                                          : 'text-[#6c645a] group-hover:text-[#c7beb0]'
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
              <div className="flex items-center justify-between border-t border-[#e6c27a]/12 bg-[#100e14] px-4 py-2.5 font-mono text-[11px] text-[#8f8578]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <kbd className="rounded border border-[#e6c27a]/20 bg-[#191620] px-1 text-[#d7c6a5]">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CornerDownLeft className="h-3 w-3 text-[#d7c6a5]" />
                    open
                  </span>
                </div>
                <span className="font-serif italic text-[#e6c27a]/80">Reality Check</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
