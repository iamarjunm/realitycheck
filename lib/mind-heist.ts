export type ChamberId = 'ALPHA' | 'BETA' | 'OMEGA';

export const CHAMBERS: readonly ChamberId[] = ['ALPHA', 'BETA', 'OMEGA'] as const;

export const NEURAL_ENERGY = 12;
export const MAX_CHAMBER_SHIELD = 10;
export const DEFAULT_MAX_SANITY = 100;
export const SELECTABLE_SANITY_OPTIONS: readonly number[] = [80, 100] as const;

export const TRAP_RECOIL_BASE = 14;
export const COUNTER_READ_BASE = 14;
export const COUNTER_READ_STREAK_STEP = 4;
export const PARANOIA_BURN_DAMAGE = 10;
export const DOPPELGANGER_FALLBACK_STRIKE = 4;

export interface ChamberMeta {
  id: ChamberId;
  greek: string;
  label: string;
  codename: string;
  glitchLabel: string;
  hex: string;
  secondaryHex: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  svgX: number;
  svgY: number;
}

export const CHAMBER_META: Record<ChamberId, ChamberMeta> = {
  ALPHA: {
    id: 'ALPHA',
    greek: 'Α',
    label: 'ALPHA',
    codename: 'Crimson Spire',
    glitchLabel: 'A̵L̶P̴H̷4',
    hex: '#f43f5e',
    secondaryHex: '#fbbf24',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/50',
    bgClass: 'bg-rose-500/15',
    svgX: 210,
    svgY: 74,
  },
  BETA: {
    id: 'BETA',
    greek: 'Β',
    label: 'BETA',
    codename: 'Violet Mirror',
    glitchLabel: 'B̴3̷T̵Δ',
    hex: '#a855f7',
    secondaryHex: '#e879f9',
    textClass: 'text-violet-400',
    borderClass: 'border-violet-500/50',
    bgClass: 'bg-violet-500/15',
    svgX: 92,
    svgY: 282,
  },
  OMEGA: {
    id: 'OMEGA',
    greek: 'Ω',
    label: 'OMEGA',
    codename: 'Astral Abyss',
    glitchLabel: '0̷M̵E̶G4',
    hex: '#f59e0b',
    secondaryHex: '#22d3ee',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/50',
    bgClass: 'bg-amber-500/15',
    svgX: 328,
    svgY: 282,
  },
};

export type RelicId =
  | 'mirage_split'
  | 'soul_siphon'
  | 'paranoia_glitch'
  | 'time_freeze'
  | 'doppelganger'
  | 'overdrive';

export interface RelicDef {
  id: RelicId;
  name: string;
  arcana: string;
  shortEffect: string;
  description: string;
  accentHex: string;
  gradientClass: string;
  borderClass: string;
  textClass: string;
}

export const RELIC_DEFS: Record<RelicId, RelicDef> = {
  mirage_split: {
    id: 'mirage_split',
    name: 'Mirage Split',
    arcana: 'II · THE MIRAGE',
    shortEffect: 'Splash ALL chambers @ 50% · Best hit',
    description:
      'Your Breach also strikes both other chambers at 50% Strike Power, automatically dealing whichever hit deals the highest damage.',
    accentHex: '#e879f9',
    gradientClass: 'from-fuchsia-600/30 via-violet-900/40 to-indigo-950/90',
    borderClass: 'border-fuchsia-400/50',
    textClass: 'text-fuchsia-300',
  },
  soul_siphon: {
    id: 'soul_siphon',
    name: 'Soul Siphon',
    arcana: 'IX · THE SIPHON',
    shortEffect: 'Heal 50% of damage dealt',
    description:
      'Drain your rival’s fractured psyche — restore Sanity equal to 50% of all total damage you inflict this round.',
    accentHex: '#34d399',
    gradientClass: 'from-emerald-600/30 via-teal-900/40 to-slate-950/90',
    borderClass: 'border-emerald-400/50',
    textClass: 'text-emerald-300',
  },
  paranoia_glitch: {
    id: 'paranoia_glitch',
    name: 'Paranoia Glitch',
    arcana: 'XVI · THE GLITCH',
    shortEffect: '+10 Psychic Burn + Glitch Rival UI',
    description:
      'Deals +10 unblockable Psychic Burn immediately and corrupts your rival’s Chamber Telemetry with GLITCHED UI next round.',
    accentHex: '#f43f5e',
    gradientClass: 'from-rose-600/35 via-fuchsia-950/50 to-slate-950/90',
    borderClass: 'border-rose-400/55',
    textClass: 'text-rose-300',
  },
  time_freeze: {
    id: 'time_freeze',
    name: 'Time Freeze',
    arcana: 'XII · THE STASIS',
    shortEffect: 'Target Chamber Shield → 0',
    description:
      'Suspends time inside your targeted chamber, shattering its Shield to 0 right before your Strike lands.',
    accentHex: '#38bdf8',
    gradientClass: 'from-cyan-500/30 via-indigo-900/45 to-slate-950/90',
    borderClass: 'border-cyan-400/50',
    textClass: 'text-cyan-300',
  },
  doppelganger: {
    id: 'doppelganger',
    name: 'Doppelganger',
    arcana: 'VII · THE MIRROR',
    shortEffect: 'Copy rival Relic or +4 Strike',
    description:
      'Mirrors whatever Relic your rival arms this round. If they arm none (or also Doppelganger), surges your Strike by +4 Power.',
    accentHex: '#a78bfa',
    gradientClass: 'from-violet-600/35 via-purple-950/50 to-indigo-950/90',
    borderClass: 'border-violet-400/55',
    textClass: 'text-violet-300',
  },
  overdrive: {
    id: 'overdrive',
    name: 'Overdrive Core',
    arcana: 'XIX · THE OVERDRIVE',
    shortEffect: '2× Strike · 2× Trap Recoil risk',
    description:
      'Doubles your Strike Power for devastating breaches — but if you fall into an un-read Phantom Trap, Trap Recoil doubles to 28.',
    accentHex: '#fbbf24',
    gradientClass: 'from-amber-500/35 via-orange-950/45 to-rose-950/85',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-300',
  },
};

export const ALL_RELIC_IDS: readonly RelicId[] = [
  'mirage_split',
  'soul_siphon',
  'paranoia_glitch',
  'time_freeze',
  'doppelganger',
  'overdrive',
] as const;

export type ShieldMap = Record<ChamberId, number>;

export interface MindHeistPlan {
  shields: ShieldMap;
  trapChamber: ChamberId;
  targetChamber: ChamberId;
  strikePower: number;
  mindReadCall: ChamberId;
  relic: RelicId | null;
}

export interface TacticalPreset {
  id: 'glass_cannon' | 'iron_fortress' | 'mind_trick';
  name: string;
  tagline: string;
  shields: ShieldMap;
  strikePower: number;
  trapChamber: ChamberId;
  targetChamber: ChamberId;
  mindReadCall: ChamberId;
  accentClass: string;
}

export const TACTICAL_PRESETS: readonly TacticalPreset[] = [
  {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    tagline: '9 Strike · Paper Shields',
    shields: { ALPHA: 1, BETA: 1, OMEGA: 1 },
    strikePower: 9,
    trapChamber: 'BETA',
    targetChamber: 'ALPHA',
    mindReadCall: 'ALPHA',
    accentClass: 'border-rose-500/40 text-rose-300 hover:bg-rose-500/15',
  },
  {
    id: 'iron_fortress',
    name: 'Iron Fortress',
    tagline: '3/3/3 Wall · 3 Strike',
    shields: { ALPHA: 3, BETA: 3, OMEGA: 3 },
    strikePower: 3,
    trapChamber: 'OMEGA',
    targetChamber: 'BETA',
    mindReadCall: 'OMEGA',
    accentClass: 'border-amber-500/40 text-amber-300 hover:bg-amber-500/15',
  },
  {
    id: 'mind_trick',
    name: 'Mind Trick',
    tagline: '0-Shield Bait Trap · 6 Strike',
    shields: { ALPHA: 4, BETA: 0, OMEGA: 2 },
    strikePower: 6,
    trapChamber: 'BETA',
    targetChamber: 'OMEGA',
    mindReadCall: 'BETA',
    accentClass: 'border-violet-500/40 text-violet-300 hover:bg-violet-500/15',
  },
] as const;

export interface MindHeistPlayer {
  uid: string;
  sessionId: string;
  nickname: string;
  isBot: boolean;
  sanity: number;
  maxSanity: number;
  relics: RelicId[];
  usedRelics: RelicId[];
  readStreak: number;
  paranoiaActive: boolean;
  locked: boolean;
  nextReady: boolean;
  currentPlan: MindHeistPlan | null;
  attackHistory: ChamberId[];
  trapHistory: ChamberId[];
}

export interface AttackBreakdown {
  attackerIdx: 0 | 1;
  defenderIdx: 0 | 1;
  plan: MindHeistPlan;
  armedRelic: RelicId | null;
  effectiveRelic: RelicId | null;
  doppelgangerCopied: RelicId | null;
  doppelgangerFallbackBonus: boolean;
  effectiveStrike: number;
  effectiveShield: number;
  hitChamber: ChamberId;
  mirageSplashUsed: boolean;
  timeFreezeTriggered: boolean;
  breached: boolean;
  breachDamage: number;
  hitTrap: boolean;
  counterReadHit: boolean;
  ambushed: boolean;
  trapRecoilTaken: number;
  counterReadDamage: number;
  newReadStreak: number;
  paranoiaBurnDamage: number;
  inflictedParanoia: boolean;
  totalDamageDealt: number;
  healingReceived: number;
  netSanityChange: number;
  highlights: string[];
}

export interface MindHeistRoundLog {
  round: number;
  p0: AttackBreakdown;
  p1: AttackBreakdown;
  p0SanityAfter: number;
  p1SanityAfter: number;
  headline: string;
}

export type MindHeistStatus = 'waiting' | 'planning' | 'reveal' | 'finished';

export interface MindHeistState {
  status: MindHeistStatus;
  round: number;
  maxSanity: number;
  players: MindHeistPlayer[];
  history: MindHeistRoundLog[];
  winnerIdx: number | null; // 0, 1, or -1 for Mutual Collapse draw
  updatedAt: number;
}

export function dealRandomRelics(count = 3): RelicId[] {
  const pool: RelicId[] = [...ALL_RELIC_IDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, count);
}

export function createMindHeistPlayer(
  uid: string,
  sessionId: string,
  nickname: string,
  maxSanity: number = DEFAULT_MAX_SANITY,
  isBot = false
): MindHeistPlayer {
  return {
    uid,
    sessionId,
    nickname: nickname.slice(0, 18),
    isBot,
    sanity: maxSanity,
    maxSanity,
    relics: dealRandomRelics(3),
    usedRelics: [],
    readStreak: 0,
    paranoiaActive: false,
    locked: false,
    nextReady: false,
    currentPlan: null,
    attackHistory: [],
    trapHistory: [],
  };
}

export function createDefaultPlan(): MindHeistPlan {
  return {
    shields: { ALPHA: 2, BETA: 2, OMEGA: 2 },
    trapChamber: 'ALPHA',
    targetChamber: 'BETA',
    strikePower: 6,
    mindReadCall: 'OMEGA',
    relic: null,
  };
}

export function sanitizePlan(plan: MindHeistPlan, player: MindHeistPlayer): MindHeistPlan {
  let alpha = Math.max(0, Math.min(MAX_CHAMBER_SHIELD, Math.floor(plan.shields.ALPHA || 0)));
  let beta = Math.max(0, Math.min(MAX_CHAMBER_SHIELD, Math.floor(plan.shields.BETA || 0)));
  let omega = Math.max(0, Math.min(MAX_CHAMBER_SHIELD, Math.floor(plan.shields.OMEGA || 0)));

  // Enforce shield total <= NEURAL_ENERGY
  let totalShields = alpha + beta + omega;
  while (totalShields > NEURAL_ENERGY) {
    if (omega >= alpha && omega >= beta && omega > 0) omega--;
    else if (beta >= alpha && beta > 0) beta--;
    else if (alpha > 0) alpha--;
    totalShields = alpha + beta + omega;
  }

  const maxStrike = NEURAL_ENERGY - totalShields;
  const strikePower = Math.max(0, Math.min(maxStrike, Math.floor(plan.strikePower || 0)));

  const trapChamber: ChamberId = CHAMBERS.includes(plan.trapChamber) ? plan.trapChamber : 'ALPHA';
  const targetChamber: ChamberId = CHAMBERS.includes(plan.targetChamber) ? plan.targetChamber : 'BETA';
  const mindReadCall: ChamberId = CHAMBERS.includes(plan.mindReadCall) ? plan.mindReadCall : 'OMEGA';

  const relicValid =
    plan.relic !== null &&
    player.relics.includes(plan.relic) &&
    !player.usedRelics.includes(plan.relic);

  return {
    shields: { ALPHA: alpha, BETA: beta, OMEGA: omega },
    trapChamber,
    targetChamber,
    strikePower,
    mindReadCall,
    relic: relicValid ? plan.relic : null,
  };
}

export function computeBreachDamage(strike: number, shield: number): number {
  if (strike > shield) {
    return (strike - shield) * 4 + 8;
  }
  return 0;
}

function evaluateOneSide(
  attackerIdx: 0 | 1,
  defenderIdx: 0 | 1,
  attacker: MindHeistPlayer,
  attackerPlan: MindHeistPlan,
  defenderPlan: MindHeistPlan,
  rivalArmedRelic: RelicId | null
): AttackBreakdown {
  const armedRelic = attackerPlan.relic;
  let effectiveRelic: RelicId | null = armedRelic;
  let doppelgangerCopied: RelicId | null = null;
  let doppelgangerFallbackBonus = false;

  if (armedRelic === 'doppelganger') {
    if (rivalArmedRelic && rivalArmedRelic !== 'doppelganger') {
      effectiveRelic = rivalArmedRelic;
      doppelgangerCopied = rivalArmedRelic;
    } else {
      effectiveRelic = null;
      doppelgangerFallbackBonus = true;
    }
  }

  const counterReadHit = attackerPlan.mindReadCall === defenderPlan.trapChamber;
  const hitTrap = attackerPlan.targetChamber === defenderPlan.trapChamber;
  const ambushed = hitTrap && !counterReadHit;

  const newReadStreak = counterReadHit ? attacker.readStreak + 1 : 0;
  const counterReadDamage = counterReadHit
    ? COUNTER_READ_BASE + (newReadStreak - 1) * COUNTER_READ_STREAK_STEP
    : 0;

  let baseStrike = attackerPlan.strikePower + (doppelgangerFallbackBonus ? DOPPELGANGER_FALLBACK_STRIKE : 0);
  if (effectiveRelic === 'overdrive') {
    baseStrike = baseStrike * 2;
  }

  const effectiveStrike = ambushed ? Math.floor(baseStrike / 2) : baseStrike;
  const trapRecoilTaken = ambushed
    ? effectiveRelic === 'overdrive'
      ? TRAP_RECOIL_BASE * 2
      : TRAP_RECOIL_BASE
    : 0;

  // Primary target calculation
  const primaryChamber = attackerPlan.targetChamber;
  const timeFreezeTriggered = effectiveRelic === 'time_freeze';
  const primaryShield = timeFreezeTriggered ? 0 : defenderPlan.shields[primaryChamber];
  const primaryDamage = computeBreachDamage(effectiveStrike, primaryShield);

  let hitChamber: ChamberId = primaryChamber;
  let effectiveShield = primaryShield;
  let breachDamage = primaryDamage;
  let finalStrikeShown = effectiveStrike;
  let mirageSplashUsed = false;

  if (effectiveRelic === 'mirage_split') {
    const splashStrike = Math.round(effectiveStrike * 0.5);
    for (const chamber of CHAMBERS) {
      if (chamber === primaryChamber) continue;
      const sh = defenderPlan.shields[chamber];
      const dmg = computeBreachDamage(splashStrike, sh);
      if (dmg > breachDamage) {
        breachDamage = dmg;
        hitChamber = chamber;
        effectiveShield = sh;
        finalStrikeShown = splashStrike;
        mirageSplashUsed = true;
      }
    }
  }

  const breached = breachDamage > 0;
  const paranoiaBurnDamage = effectiveRelic === 'paranoia_glitch' ? PARANOIA_BURN_DAMAGE : 0;
  const inflictedParanoia = effectiveRelic === 'paranoia_glitch';

  const totalDamageDealt = breachDamage + counterReadDamage + paranoiaBurnDamage;
  const healingReceived =
    effectiveRelic === 'soul_siphon' ? Math.floor(totalDamageDealt * 0.5) : 0;

  const highlights: string[] = [];
  if (doppelgangerCopied) {
    highlights.push(`MIRRORED ${RELIC_DEFS[doppelgangerCopied].name.toUpperCase()}`);
  } else if (doppelgangerFallbackBonus) {
    highlights.push(`DOPPELGANGER +${DOPPELGANGER_FALLBACK_STRIKE} STRIKE`);
  }
  if (timeFreezeTriggered) {
    highlights.push(`TIME FREEZE (${primaryChamber} SHIELD → 0)`);
  }
  if (counterReadHit) {
    highlights.push(
      newReadStreak > 1
        ? `PSYCHIC COUNTER-READ ×${newReadStreak} (+${counterReadDamage})`
        : `PSYCHIC COUNTER-READ (+${counterReadDamage})`
    );
  }
  if (ambushed) {
    highlights.push(`AMBUSHED! -${trapRecoilTaken} RECOIL`);
  }
  if (breached) {
    highlights.push(
      mirageSplashUsed
        ? `MIRAGE BREACH ON ${hitChamber} (+${breachDamage})`
        : `BREACHED ${hitChamber} (+${breachDamage})`
    );
  } else {
    highlights.push(`BLOCKED ON ${primaryChamber}`);
  }
  if (paranoiaBurnDamage > 0) {
    highlights.push(`PARANOIA GLITCH (+${paranoiaBurnDamage})`);
  }
  if (healingReceived > 0) {
    highlights.push(`SOUL SIPHON (+${healingReceived} SANITY)`);
  }

  return {
    attackerIdx,
    defenderIdx,
    plan: attackerPlan,
    armedRelic,
    effectiveRelic,
    doppelgangerCopied,
    doppelgangerFallbackBonus,
    effectiveStrike: finalStrikeShown,
    effectiveShield,
    hitChamber,
    mirageSplashUsed,
    timeFreezeTriggered,
    breached,
    breachDamage,
    hitTrap,
    counterReadHit,
    ambushed,
    trapRecoilTaken,
    counterReadDamage,
    newReadStreak,
    paranoiaBurnDamage,
    inflictedParanoia,
    totalDamageDealt,
    healingReceived,
    netSanityChange: 0,
    highlights,
  };
}

export function resolveMindHeistRound(state: MindHeistState): MindHeistState {
  if (state.players.length < 2) return state;
  const p0 = state.players[0];
  const p1 = state.players[1];
  if (!p0.currentPlan || !p1.currentPlan) return state;

  const plan0 = sanitizePlan(p0.currentPlan, p0);
  const plan1 = sanitizePlan(p1.currentPlan, p1);

  const b0 = evaluateOneSide(0, 1, p0, plan0, plan1, plan1.relic);
  const b1 = evaluateOneSide(1, 0, p1, plan1, plan0, plan0.relic);

  const p0RawDelta = b0.healingReceived - b1.totalDamageDealt - b0.trapRecoilTaken;
  const p1RawDelta = b1.healingReceived - b0.totalDamageDealt - b1.trapRecoilTaken;

  const p0SanityAfter = Math.max(0, Math.min(p0.maxSanity, p0.sanity + p0RawDelta));
  const p1SanityAfter = Math.max(0, Math.min(p1.maxSanity, p1.sanity + p1RawDelta));

  b0.netSanityChange = p0SanityAfter - p0.sanity;
  b1.netSanityChange = p1SanityAfter - p1.sanity;

  let headline = 'NEURAL CLASH RESOLVED';
  if (b0.counterReadHit && b1.counterReadHit) {
    headline = 'DOUBLE PSYCHIC COUNTER-READ — MINDS COLLIDED!';
  } else if (b0.counterReadHit) {
    headline = `${p0.nickname.toUpperCase()} SHATTERED ${p1.nickname.toUpperCase()}’S PHANTOM TRAP!`;
  } else if (b1.counterReadHit) {
    headline = `${p1.nickname.toUpperCase()} SHATTERED ${p0.nickname.toUpperCase()}’S PHANTOM TRAP!`;
  } else if (b0.ambushed && b1.ambushed) {
    headline = 'MUTUAL AMBUSH — BOTH AGENTS SPRUNG PHANTOM TRAPS!';
  } else if (b0.breached && b1.breached) {
    headline = `DUAL VAULT BREACH — ${b0.totalDamageDealt} VS ${b1.totalDamageDealt} DAMAGE!`;
  } else if (b0.breached) {
    headline = `${p0.nickname.toUpperCase()} BREACHED ${b0.hitChamber} FOR ${b0.totalDamageDealt} DMG!`;
  } else if (b1.breached) {
    headline = `${p1.nickname.toUpperCase()} BREACHED ${b1.hitChamber} FOR ${b1.totalDamageDealt} DMG!`;
  } else {
    headline = 'STALEMATE — BOTH ASTRAL VAULTS HELD FIRM!';
  }

  const log: MindHeistRoundLog = {
    round: state.round,
    p0: b0,
    p1: b1,
    p0SanityAfter,
    p1SanityAfter,
    headline,
  };

  let winnerIdx: number | null = null;
  let nextStatus: MindHeistStatus = 'reveal';

  if (p0SanityAfter <= 0 && p1SanityAfter <= 0) {
    winnerIdx = -1;
    nextStatus = 'finished';
  } else if (p1SanityAfter <= 0) {
    winnerIdx = 0;
    nextStatus = 'finished';
  } else if (p0SanityAfter <= 0) {
    winnerIdx = 1;
    nextStatus = 'finished';
  }

  const nextP0: MindHeistPlayer = {
    ...p0,
    sanity: p0SanityAfter,
    usedRelics: plan0.relic ? [...p0.usedRelics, plan0.relic] : p0.usedRelics,
    readStreak: b0.newReadStreak,
    paranoiaActive: b1.inflictedParanoia,
    locked: false,
    nextReady: false,
    currentPlan: plan0,
    attackHistory: [...p0.attackHistory, plan0.targetChamber],
    trapHistory: [...p0.trapHistory, plan0.trapChamber],
  };

  const nextP1: MindHeistPlayer = {
    ...p1,
    sanity: p1SanityAfter,
    usedRelics: plan1.relic ? [...p1.usedRelics, plan1.relic] : p1.usedRelics,
    readStreak: b1.newReadStreak,
    paranoiaActive: b0.inflictedParanoia,
    locked: false,
    nextReady: false,
    currentPlan: plan1,
    attackHistory: [...p1.attackHistory, plan1.targetChamber],
    trapHistory: [...p1.trapHistory, plan1.trapChamber],
  };

  return {
    ...state,
    status: nextStatus,
    players: [nextP0, nextP1],
    history: [...state.history, log],
    winnerIdx,
    updatedAt: Date.now(),
  };
}

function randomChamber(exclude?: ChamberId): ChamberId {
  const list = exclude ? CHAMBERS.filter((c) => c !== exclude) : [...CHAMBERS];
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Adaptive Psychological AI ("PHANTOM-AI"):
 * Notices which chamber the human repeatedly attacks, baits & traps it,
 * reads human trap habits for Mind-Read calls, and times Astral Relics smartly.
 */
export function pickPhantomAiPlan(
  ai: MindHeistPlayer,
  human: MindHeistPlayer,
  round: number
): MindHeistPlan {
  // 1. Analyze human's attack patterns (recent rounds weighted heavier)
  const attackScore: Record<ChamberId, number> = { ALPHA: 0.5, BETA: 0.5, OMEGA: 0.5 };
  human.attackHistory.forEach((ch, idx) => {
    const recency = idx >= human.attackHistory.length - 2 ? 2.2 : 1.0;
    attackScore[ch] += recency;
  });

  const sortedByHumanAttack = [...CHAMBERS].sort((a, b) => attackScore[b] - attackScore[a]);
  const favoriteHumanTarget = sortedByHumanAttack[0];

  // Trap placement: if human has a habit, trap it ~65% of the time; otherwise mix it up
  let trapChamber: ChamberId;
  if (human.attackHistory.length >= 1 && Math.random() < 0.65) {
    trapChamber = favoriteHumanTarget;
  } else if (human.attackHistory.length >= 2 && Math.random() < 0.5) {
    // Predict they pivot away from last target
    trapChamber = randomChamber(human.attackHistory[human.attackHistory.length - 1]);
  } else {
    trapChamber = randomChamber();
  }

  // 2. Analyze human's trap habits for Mind-Read Call
  const trapScore: Record<ChamberId, number> = { ALPHA: 0, BETA: 0, OMEGA: 0 };
  human.trapHistory.forEach((ch, idx) => {
    trapScore[ch] += idx === human.trapHistory.length - 1 ? 1.8 : 1.0;
  });
  const sortedByHumanTrap = [...CHAMBERS].sort((a, b) => trapScore[b] - trapScore[a]);

  let mindReadCall: ChamberId;
  if (human.trapHistory.length >= 2 && trapScore[sortedByHumanTrap[0]] > trapScore[sortedByHumanTrap[1]] && Math.random() < 0.58) {
    mindReadCall = sortedByHumanTrap[0];
  } else if (human.trapHistory.length >= 1 && Math.random() < 0.45) {
    // Expect human to rotate trap away from last chamber
    mindReadCall = randomChamber(human.trapHistory[human.trapHistory.length - 1]);
  } else {
    mindReadCall = randomChamber();
  }

  // 3. Target selection: avoid calling the exact same chamber as predicted trap unless confident in counter-read
  let targetChamber: ChamberId;
  if (Math.random() < 0.35) {
    // Bold play: attack the very chamber we're mind-reading!
    targetChamber = mindReadCall;
  } else {
    targetChamber = randomChamber(mindReadCall);
  }

  // 4. Energy Allocation (12 total): Choose aggressive, defensive, or bait profile
  const aggressiveBias = human.sanity <= 40 || ai.sanity <= 35 ? 0.62 : 0.38;
  const roll = Math.random();

  let shields: ShieldMap;
  let strikePower: number;

  if (roll < aggressiveBias) {
    // Aggressive Breach
    strikePower = 7 + Math.floor(Math.random() * 3); // 7..9
    const rem = NEURAL_ENERGY - strikePower;
    shields = { ALPHA: 0, BETA: 0, OMEGA: 0 };
    for (let i = 0; i < rem; i++) {
      // Leave trapped chamber low as bait, shield the other two
      const ch = randomChamber(trapChamber);
      shields[ch]++;
    }
  } else if (roll < aggressiveBias + 0.35) {
    // Bait & Counter
    strikePower = 5 + Math.floor(Math.random() * 2); // 5..6
    const rem = NEURAL_ENERGY - strikePower;
    shields = { ALPHA: 0, BETA: 0, OMEGA: 0 };
    const others = CHAMBERS.filter((c) => c !== trapChamber);
    shields[others[0]] = Math.ceil(rem * 0.55);
    shields[others[1]] = rem - shields[others[0]];
    // Trap chamber has 0 shield — classic mind trick!
  } else {
    // Fortified Mind
    strikePower = 4;
    shields = { ALPHA: 2, BETA: 2, OMEGA: 2 };
    // Put +2 extra on human's favorite target
    shields[favoriteHumanTarget] += 2;
  }

  // 5. Smart Relic Selection
  const availableRelics = ai.relics.filter((r) => !ai.usedRelics.includes(r));
  let chosenRelic: RelicId | null = null;

  if (availableRelics.length > 0) {
    const humanRelicsLeft = human.relics.length - human.usedRelics.length;

    if (availableRelics.includes('overdrive') && (human.sanity <= 46 || round >= 4) && strikePower >= 6) {
      chosenRelic = 'overdrive';
    } else if (availableRelics.includes('soul_siphon') && ai.sanity <= ai.maxSanity * 0.68 && strikePower >= 5) {
      chosenRelic = 'soul_siphon';
    } else if (availableRelics.includes('time_freeze') && strikePower >= 6 && round >= 2 && Math.random() < 0.65) {
      chosenRelic = 'time_freeze';
    } else if (availableRelics.includes('paranoia_glitch') && !human.paranoiaActive && Math.random() < (round === 1 ? 0.35 : 0.6)) {
      chosenRelic = 'paranoia_glitch';
    } else if (availableRelics.includes('mirage_split') && strikePower >= 6 && Math.random() < 0.55) {
      chosenRelic = 'mirage_split';
    } else if (availableRelics.includes('doppelganger') && round >= 2 && humanRelicsLeft > 0 && Math.random() < 0.5) {
      chosenRelic = 'doppelganger';
    } else if (round >= 5 || ai.sanity <= 32) {
      // Don't die holding unused relics!
      chosenRelic = availableRelics[0];
    }
  }

  return sanitizePlan(
    {
      shields,
      trapChamber,
      targetChamber,
      strikePower,
      mindReadCall,
      relic: chosenRelic,
    },
    ai
  );
}
