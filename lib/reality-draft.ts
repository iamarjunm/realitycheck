export type AnomalyCardId =
  | 'zero_void'
  | 'glass_titan'
  | 'bluff_phantom'
  | 'echo_mirror'
  | 'chrono_thief'
  | 'chaos_dice'
  | 'vampire_sigil'
  | 'quantum_bomb'
  | 'siphon_witch'
  | 'gravity_anchor'
  | 'mind_parasite'
  | 'apex_singularity';

export type DistortionId =
  | 'ODD_SURGE'
  | 'INVERTED_GRAVITY'
  | 'BLOOD_MOON'
  | 'VOID_ECHO'
  | 'PURE_DUEL';

export type RealityStance = 'hold' | 'double' | 'ward';

export type AuraTier = 'LOW' | 'MID' | 'HIGH';

export type CardRarity = 'common' | 'rare' | 'epic' | 'mythic';

export interface AnomalyCardDef {
  id: AnomalyCardId;
  name: string;
  roman: string;
  basePower: number;
  rarity: CardRarity;
  archetype: string;
  ability: string;
  shortTag: string;
  accentHex: string;
  glowClass: string;
  borderClass: string;
  foilClass: string;
  disguisedAura?: AuraTier;
}

export interface DistortionDef {
  id: DistortionId;
  name: string;
  subtitle: string;
  rule: string;
  shortRule: string;
  accentHex: string;
  badgeClass: string;
  auraGradient: string;
  borderGlow: string;
}

export interface PowerMathStep {
  label: string;
  delta: number;
  value: number;
  tone: 'neutral' | 'buff' | 'debuff' | 'distortion' | 'paradox';
}

export interface ClashResultLog {
  round: number;
  distortion: DistortionId;
  cards: [AnomalyCardId, AnomalyCardId];
  stances: [RealityStance, RealityStance];
  displayedAuras: [AuraTier, AuraTier];
  basePowers: [number, number];
  finalPowers: [number, number];
  mathSteps: [PowerMathStep[], PowerMathStep[]];
  winnerIdx: 0 | 1 | null;
  lowestWins: boolean;
  damageMultiplier: number;
  damageTaken: [number, number];
  healed: [number, number];
  events: string[];
  headline: string;
  shatteredIdx: 0 | 1 | null;
  bluffTriggeredBy: 0 | 1 | null;
  quantumDetonated: boolean;
  swapped: boolean;
  nullifiedIdx: 0 | 1 | null;
  pendingMatchWinnerUid: string | null;
}

export interface RealityPlayer {
  uid: string;
  sessionId: string;
  nickname: string;
  isBot: boolean;
  hp: number;
  crowns: number;
  hand: AnomalyCardId[];
  deck: AnomalyCardId[];
  discard: AnomalyCardId[];
  doubleUsesLeft: number;
  wardUsesLeft: number;
  nextRoundCurse: number;
  lockedCard: AnomalyCardId | null;
  lockedStance: RealityStance;
  locked: boolean;
}

export type RealityGamePhase = 'waiting' | 'selecting' | 'clash' | 'finished';

export interface RealityDraftState {
  mode: 'solo' | 'multi';
  gameId?: string;
  creatorId: string;
  state: RealityGamePhase;
  round: number;
  distortion: DistortionId;
  players: RealityPlayer[];
  lastClash: ClashResultLog | null;
  history: ClashResultLog[];
  winnerUid: string | null;
  createdAt?: number;
}

export const STARTING_HP = 30;
export const MAX_HP = 30;
export const CROWNS_TO_WIN = 4;
export const HAND_SIZE = 5;
export const DOUBLE_STAKES_USES = 2;
export const WARD_SHIELD_USES = 2;

export const ANOMALY_CARDS: Record<AnomalyCardId, AnomalyCardDef> = {
  zero_void: {
    id: 'zero_void',
    name: 'ZERO VOID',
    roman: '0',
    basePower: 0,
    rarity: 'mythic',
    archetype: 'PARADOX',
    ability: "Nullifies rival's card ability AND swaps both cards' final Powers!",
    shortTag: 'NULLIFY + SWAP',
    accentHex: '#e879f9',
    glowClass: 'shadow-[0_0_24px_rgba(232,121,249,0.45)]',
    borderClass: 'border-fuchsia-400/70',
    foilClass: 'glitch-foil',
  },
  glass_titan: {
    id: 'glass_titan',
    name: 'GLASS TITAN',
    roman: 'IX',
    basePower: 9,
    rarity: 'epic',
    archetype: 'COLOSSUS',
    ability: 'Colossal power — but SHATTERS and auto-loses against any card with base Power ≤ 3!',
    shortTag: 'SHATTERS VS ≤3',
    accentHex: '#38bdf8',
    glowClass: 'shadow-[0_0_24px_rgba(56,189,248,0.45)]',
    borderClass: 'border-sky-400/70',
    foilClass: 'epic-foil',
  },
  bluff_phantom: {
    id: 'bluff_phantom',
    name: 'BLUFF PHANTOM',
    roman: 'II',
    basePower: 2,
    rarity: 'mythic',
    archetype: 'ILLUSION',
    ability: 'Disguises its Aura as HIGH (7–9)! If rival plays a 7+ card OR activates DOUBLE STAKES, deal +9 Psychic Damage and steal the clash!',
    shortTag: 'FAKE HIGH • AMBUSH',
    accentHex: '#c084fc',
    glowClass: 'shadow-[0_0_24px_rgba(192,132,252,0.5)]',
    borderClass: 'border-purple-400/75',
    foilClass: 'glitch-foil',
    disguisedAura: 'HIGH',
  },
  echo_mirror: {
    id: 'echo_mirror',
    name: 'ECHO MIRROR',
    roman: 'IV',
    basePower: 4,
    rarity: 'rare',
    archetype: 'MIMIC',
    ability: "If rival's base Power is higher, copies their base Power and adds +1!",
    shortTag: 'COPY +1 VS HIGHER',
    accentHex: '#22d3ee',
    glowClass: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]',
    borderClass: 'border-cyan-400/65',
    foilClass: 'rare-foil',
  },
  chrono_thief: {
    id: 'chrono_thief',
    name: 'CHRONO THIEF',
    roman: 'V',
    basePower: 5,
    rarity: 'rare',
    archetype: 'TEMPO',
    ability: "Steals 2 Power directly from the rival's card (+2 to you, -2 to rival)!",
    shortTag: 'STEAL 2 PWR',
    accentHex: '#fbbf24',
    glowClass: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]',
    borderClass: 'border-amber-400/65',
    foilClass: 'rare-foil',
  },
  chaos_dice: {
    id: 'chaos_dice',
    name: 'CHAOS DICE',
    roman: 'VI',
    basePower: 6,
    rarity: 'epic',
    archetype: 'WARP',
    ability: 'WARPS REALITY: Flips this clash so the LOWEST Power wins!',
    shortTag: 'LOWEST WINS',
    accentHex: '#a3e635',
    glowClass: 'shadow-[0_0_22px_rgba(163,230,53,0.42)]',
    borderClass: 'border-lime-400/70',
    foilClass: 'epic-foil',
  },
  vampire_sigil: {
    id: 'vampire_sigil',
    name: 'VAMPIRE SIGIL',
    roman: 'VII',
    basePower: 5,
    rarity: 'rare',
    archetype: 'BLOOD',
    ability: 'If you win this clash, heal +5 Reality HP and deal +3 extra bleed damage!',
    shortTag: 'WIN: +5 HP / +3 DMG',
    accentHex: '#fb7185',
    glowClass: 'shadow-[0_0_22px_rgba(251,113,133,0.45)]',
    borderClass: 'border-rose-400/70',
    foilClass: 'rare-foil',
  },
  quantum_bomb: {
    id: 'quantum_bomb',
    name: 'QUANTUM BOMB',
    roman: 'VIII',
    basePower: 7,
    rarity: 'epic',
    archetype: 'VOLATILE',
    ability: 'Detonates if Powers are within 2 of each other — deals 8 damage to BOTH players!',
    shortTag: 'DIFF ≤2: 8 TO BOTH',
    accentHex: '#fb923c',
    glowClass: 'shadow-[0_0_22px_rgba(251,146,60,0.45)]',
    borderClass: 'border-orange-400/70',
    foilClass: 'epic-foil',
  },
  siphon_witch: {
    id: 'siphon_witch',
    name: 'SIPHON WITCH',
    roman: 'III',
    basePower: 3,
    rarity: 'rare',
    archetype: 'HEX',
    ability: "If rival's base Power is EVEN, doubles your Power (+3) and heals +4 HP!",
    shortTag: 'VS EVEN: +3 PWR +4 HP',
    accentHex: '#34d399',
    glowClass: 'shadow-[0_0_20px_rgba(52,211,153,0.42)]',
    borderClass: 'border-emerald-400/70',
    foilClass: 'rare-foil',
  },
  gravity_anchor: {
    id: 'gravity_anchor',
    name: 'GRAVITY ANCHOR',
    roman: 'X',
    basePower: 8,
    rarity: 'epic',
    archetype: 'MONOLITH',
    ability: 'Unstoppable mass: Immune to power swaps, steals, and nullify!',
    shortTag: 'IMMUNE MONOLITH',
    accentHex: '#818cf8',
    glowClass: 'shadow-[0_0_24px_rgba(129,140,248,0.48)]',
    borderClass: 'border-indigo-400/75',
    foilClass: 'gold-foil',
  },
  mind_parasite: {
    id: 'mind_parasite',
    name: 'MIND PARASITE',
    roman: 'XI',
    basePower: 4,
    rarity: 'common',
    archetype: 'CURSE',
    ability: "Inflicts -3 Power curse on rival's NEXT round card + deals 3 immediate burn!",
    shortTag: '-3 NEXT + 3 BURN',
    accentHex: '#2dd4bf',
    glowClass: 'shadow-[0_0_18px_rgba(45,212,191,0.38)]',
    borderClass: 'border-teal-400/65',
    foilClass: 'common-foil',
  },
  apex_singularity: {
    id: 'apex_singularity',
    name: 'APEX SINGULARITY',
    roman: 'XII',
    basePower: 5,
    rarity: 'mythic',
    archetype: 'ASCENDANT',
    ability: 'Gains +1 Power for every card in your Discard Void (scales huge late-game)!',
    shortTag: '+1 PER VOID CARD',
    accentHex: '#facc15',
    glowClass: 'shadow-[0_0_26px_rgba(250,204,21,0.5)]',
    borderClass: 'border-yellow-400/80',
    foilClass: 'gold-foil',
  },
};

export const ALL_CARD_IDS: AnomalyCardId[] = Object.keys(ANOMALY_CARDS) as AnomalyCardId[];

export const WORLD_DISTORTIONS: Record<DistortionId, DistortionDef> = {
  ODD_SURGE: {
    id: 'ODD_SURGE',
    name: 'ODD RESONANCE',
    subtitle: 'HARMONIC OVERDRIVE',
    rule: 'All Odd-power cards gain +3 Power this clash!',
    shortRule: 'ODD BASE PWR +3',
    accentHex: '#22d3ee',
    badgeClass: 'border-cyan-400/50 bg-cyan-950/60 text-cyan-200',
    auraGradient: 'from-cyan-500/20 via-indigo-600/15 to-transparent',
    borderGlow: 'border-cyan-400/40 shadow-[0_0_35px_rgba(34,211,238,0.22)]',
  },
  INVERTED_GRAVITY: {
    id: 'INVERTED_GRAVITY',
    name: 'INVERTED GRAVITY',
    subtitle: 'ZENITH REVERSAL',
    rule: 'LOWEST final Power wins this clash!',
    shortRule: 'LOWEST PWR WINS',
    accentHex: '#a3e635',
    badgeClass: 'border-lime-400/50 bg-lime-950/60 text-lime-200',
    auraGradient: 'from-violet-600/22 via-lime-500/14 to-transparent',
    borderGlow: 'border-lime-400/40 shadow-[0_0_35px_rgba(163,230,53,0.2)]',
  },
  BLOOD_MOON: {
    id: 'BLOOD_MOON',
    name: 'BLOOD MOON',
    subtitle: 'CRIMSON ECLIPSE',
    rule: 'All clash damage is DOUBLED this round!',
    shortRule: '2× CLASH DAMAGE',
    accentHex: '#fb7185',
    badgeClass: 'border-rose-500/55 bg-rose-950/65 text-rose-200',
    auraGradient: 'from-rose-600/24 via-fuchsia-700/15 to-transparent',
    borderGlow: 'border-rose-500/45 shadow-[0_0_38px_rgba(244,63,94,0.25)]',
  },
  VOID_ECHO: {
    id: 'VOID_ECHO',
    name: 'ECHO CHAMBER',
    subtitle: 'UNDERDOG AMPLIFICATION',
    rule: 'Cards with base Power ≤ 4 gain +4 Power!',
    shortRule: 'BASE PWR ≤4 GET +4',
    accentHex: '#e879f9',
    badgeClass: 'border-fuchsia-400/50 bg-fuchsia-950/60 text-fuchsia-200',
    auraGradient: 'from-fuchsia-600/22 via-teal-500/14 to-transparent',
    borderGlow: 'border-fuchsia-400/40 shadow-[0_0_35px_rgba(232,121,249,0.22)]',
  },
  PURE_DUEL: {
    id: 'PURE_DUEL',
    name: 'PRIMAL SINGULARITY',
    subtitle: 'SOVEREIGN JUDGMENT',
    rule: 'Clash winner deals flat 8 damage + heals 2 HP!',
    shortRule: 'WIN: 8 DMG + 2 HEAL',
    accentHex: '#fbbf24',
    badgeClass: 'border-amber-400/50 bg-amber-950/60 text-amber-200',
    auraGradient: 'from-amber-500/22 via-orange-600/14 to-transparent',
    borderGlow: 'border-amber-400/40 shadow-[0_0_35px_rgba(251,191,36,0.22)]',
  },
};

export const ALL_DISTORTION_IDS: DistortionId[] = [
  'ODD_SURGE',
  'INVERTED_GRAVITY',
  'BLOOD_MOON',
  'VOID_ECHO',
  'PURE_DUEL',
];

export function shuffleCards(cards: AnomalyCardId[]): AnomalyCardId[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function rollNextDistortion(previous?: DistortionId): DistortionId {
  const pool = previous
    ? ALL_DISTORTION_IDS.filter((d) => d !== previous)
    : ALL_DISTORTION_IDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getTrueAuraTier(basePower: number): AuraTier {
  if (basePower <= 3) return 'LOW';
  if (basePower <= 6) return 'MID';
  return 'HIGH';
}

export function getDisplayedAuraTier(cardId: AnomalyCardId): AuraTier {
  const def = ANOMALY_CARDS[cardId];
  return def.disguisedAura ?? getTrueAuraTier(def.basePower);
}

export function getAuraRangeLabel(tier: AuraTier): string {
  if (tier === 'LOW') return '0–3';
  if (tier === 'MID') return '4–6';
  return '7–9';
}

export function createInitialPlayer(params: {
  uid: string;
  sessionId: string;
  nickname: string;
  isBot?: boolean;
}): RealityPlayer {
  const shuffled = shuffleCards(ALL_CARD_IDS);
  return {
    uid: params.uid,
    sessionId: params.sessionId,
    nickname: params.nickname.trim().slice(0, 14) || 'Drifter',
    isBot: Boolean(params.isBot),
    hp: STARTING_HP,
    crowns: 0,
    hand: shuffled.slice(0, HAND_SIZE),
    deck: shuffled.slice(HAND_SIZE),
    discard: [],
    doubleUsesLeft: DOUBLE_STAKES_USES,
    wardUsesLeft: WARD_SHIELD_USES,
    nextRoundCurse: 0,
    lockedCard: null,
    lockedStance: 'hold',
    locked: false,
  };
}

export function drawUpToHandSize(
  hand: AnomalyCardId[],
  deck: AnomalyCardId[],
  discard: AnomalyCardId[]
): { hand: AnomalyCardId[]; deck: AnomalyCardId[]; discard: AnomalyCardId[] } {
  const nextHand = [...hand];
  let nextDeck = [...deck];
  let nextDiscard = [...discard];

  while (nextHand.length < HAND_SIZE) {
    if (nextDeck.length === 0) {
      if (nextDiscard.length === 0) break;
      nextDeck = shuffleCards(nextDiscard);
      nextDiscard = [];
    }
    const drawn = nextDeck.shift();
    if (drawn) nextHand.push(drawn);
  }

  return { hand: nextHand, deck: nextDeck, discard: nextDiscard };
}

/**
 * Computes a live preview of a card's guaranteed pre-clash Power before rival reveal.
 */
export function getProjectedSelfPower(
  cardId: AnomalyCardId,
  distortion: DistortionId,
  stance: RealityStance,
  discardCount: number,
  curse: number
): { total: number; bonus: number } {
  const def = ANOMALY_CARDS[cardId];
  let total = def.basePower;

  if (curse !== 0) {
    total = Math.max(0, total + curse);
  }
  if (distortion === 'ODD_SURGE' && def.basePower % 2 !== 0) {
    total += 3;
  }
  if (distortion === 'VOID_ECHO' && def.basePower <= 4) {
    total += 4;
  }
  if (stance === 'ward') {
    total += 1;
  }
  if (cardId === 'apex_singularity') {
    total += discardCount;
  }

  return { total, bonus: total - def.basePower };
}

export function resolveRealityClash(
  round: number,
  distortion: DistortionId,
  p0: RealityPlayer,
  p1: RealityPlayer
): { nextP0: RealityPlayer; nextP1: RealityPlayer; log: ClashResultLog } {
  const c0: AnomalyCardId = p0.lockedCard ?? p0.hand[0] ?? 'zero_void';
  const c1: AnomalyCardId = p1.lockedCard ?? p1.hand[0] ?? 'zero_void';
  const def0 = ANOMALY_CARDS[c0];
  const def1 = ANOMALY_CARDS[c1];

  const s0: RealityStance =
    p0.lockedStance === 'double' && p0.doubleUsesLeft <= 0
      ? 'hold'
      : p0.lockedStance === 'ward' && p0.wardUsesLeft <= 0
        ? 'hold'
        : p0.lockedStance;
  const s1: RealityStance =
    p1.lockedStance === 'double' && p1.doubleUsesLeft <= 0
      ? 'hold'
      : p1.lockedStance === 'ward' && p1.wardUsesLeft <= 0
        ? 'hold'
        : p1.lockedStance;

  const base0 = def0.basePower;
  const base1 = def1.basePower;

  let pow0 = base0;
  let pow1 = base1;

  const steps0: PowerMathStep[] = [
    { label: 'Base Power', delta: base0, value: pow0, tone: 'neutral' },
  ];
  const steps1: PowerMathStep[] = [
    { label: 'Base Power', delta: base1, value: pow1, tone: 'neutral' },
  ];
  const events: string[] = [];

  // 1. Previous round Mind Parasite Curse
  if (p0.nextRoundCurse !== 0) {
    const before = pow0;
    pow0 = Math.max(0, pow0 + p0.nextRoundCurse);
    steps0.push({
      label: 'Parasite Curse',
      delta: pow0 - before,
      value: pow0,
      tone: 'debuff',
    });
    events.push(`${p0.nickname}'s card suffers ${pow0 - before} Power from Mind Parasite curse.`);
  }
  if (p1.nextRoundCurse !== 0) {
    const before = pow1;
    pow1 = Math.max(0, pow1 + p1.nextRoundCurse);
    steps1.push({
      label: 'Parasite Curse',
      delta: pow1 - before,
      value: pow1,
      tone: 'debuff',
    });
    events.push(`${p1.nickname}'s card suffers ${pow1 - before} Power from Mind Parasite curse.`);
  }

  // 2. World Distortion power bonuses
  if (distortion === 'ODD_SURGE') {
    if (base0 % 2 !== 0) {
      pow0 += 3;
      steps0.push({ label: 'Odd Resonance', delta: 3, value: pow0, tone: 'distortion' });
    }
    if (base1 % 2 !== 0) {
      pow1 += 3;
      steps1.push({ label: 'Odd Resonance', delta: 3, value: pow1, tone: 'distortion' });
    }
  } else if (distortion === 'VOID_ECHO') {
    if (base0 <= 4) {
      pow0 += 4;
      steps0.push({ label: 'Echo Chamber', delta: 4, value: pow0, tone: 'distortion' });
    }
    if (base1 <= 4) {
      pow1 += 4;
      steps1.push({ label: 'Echo Chamber', delta: 4, value: pow1, tone: 'distortion' });
    }
  }

  // 3. Stance Power bonus (Ward Shield gives +1 Power)
  if (s0 === 'ward') {
    pow0 += 1;
    steps0.push({ label: 'Ward Shield', delta: 1, value: pow0, tone: 'buff' });
  }
  if (s1 === 'ward') {
    pow1 += 1;
    steps1.push({ label: 'Ward Shield', delta: 1, value: pow1, tone: 'buff' });
  }

  // 4. Nullify check (Zero Void vs Gravity Anchor)
  let nullifiedIdx: 0 | 1 | null = null;
  const p0Nullified = c1 === 'zero_void' && c0 !== 'gravity_anchor' && c0 !== 'zero_void';
  const p1Nullified = c0 === 'zero_void' && c1 !== 'gravity_anchor' && c1 !== 'zero_void';

  if (p0Nullified) {
    nullifiedIdx = 0;
    events.push(`ZERO VOID nullified ${p0.nickname}'s ${def0.name}!`);
  } else if (c1 === 'zero_void' && c0 === 'gravity_anchor') {
    events.push(`${p0.nickname}'s GRAVITY ANCHOR resisted ZERO VOID's nullify!`);
  }

  if (p1Nullified) {
    nullifiedIdx = 1;
    events.push(`ZERO VOID nullified ${p1.nickname}'s ${def1.name}!`);
  } else if (c0 === 'zero_void' && c1 === 'gravity_anchor') {
    events.push(`${p1.nickname}'s GRAVITY ANCHOR resisted ZERO VOID's nullify!`);
  }

  // Track heals, direct/extra damages, and next round curses
  const healed: [number, number] = [0, 0];
  const extraDamage: [number, number] = [0, 0]; // damage dealt TO index
  const nextCurse: [number, number] = [0, 0];

  // 5. Card Power & Immediate Abilities
  // Apex Singularity
  if (c0 === 'apex_singularity' && !p0Nullified && p0.discard.length > 0) {
    const gain = p0.discard.length;
    pow0 += gain;
    steps0.push({ label: 'Discard Void', delta: gain, value: pow0, tone: 'buff' });
    events.push(`${p0.nickname}'s APEX SINGULARITY absorbed +${gain} Power from the Void!`);
  }
  if (c1 === 'apex_singularity' && !p1Nullified && p1.discard.length > 0) {
    const gain = p1.discard.length;
    pow1 += gain;
    steps1.push({ label: 'Discard Void', delta: gain, value: pow1, tone: 'buff' });
    events.push(`${p1.nickname}'s APEX SINGULARITY absorbed +${gain} Power from the Void!`);
  }

  // Siphon Witch
  if (c0 === 'siphon_witch' && !p0Nullified && base1 % 2 === 0) {
    pow0 += 3;
    healed[0] += 4;
    steps0.push({ label: 'Even Siphon', delta: 3, value: pow0, tone: 'buff' });
    events.push(`${p0.nickname}'s SIPHON WITCH drained Even Power (+3 PWR, +4 HP)!`);
  }
  if (c1 === 'siphon_witch' && !p1Nullified && base0 % 2 === 0) {
    pow1 += 3;
    healed[1] += 4;
    steps1.push({ label: 'Even Siphon', delta: 3, value: pow1, tone: 'buff' });
    events.push(`${p1.nickname}'s SIPHON WITCH drained Even Power (+3 PWR, +4 HP)!`);
  }

  // Echo Mirror
  if (c0 === 'echo_mirror' && !p0Nullified && base1 > base0) {
    const gain = base1 + 1 - base0;
    pow0 += gain;
    steps0.push({ label: 'Echo Mirror', delta: gain, value: pow0, tone: 'buff' });
    events.push(`${p0.nickname}'s ECHO MIRROR copied base ${base1} +1 (+${gain} PWR)!`);
  }
  if (c1 === 'echo_mirror' && !p1Nullified && base0 > base1) {
    const gain = base0 + 1 - base1;
    pow1 += gain;
    steps1.push({ label: 'Echo Mirror', delta: gain, value: pow1, tone: 'buff' });
    events.push(`${p1.nickname}'s ECHO MIRROR copied base ${base0} +1 (+${gain} PWR)!`);
  }

  // Chrono Thief (immune if rival is Gravity Anchor)
  if (c0 === 'chrono_thief' && !p0Nullified) {
    if (c1 === 'gravity_anchor') {
      events.push(`${p1.nickname}'s GRAVITY ANCHOR blocked Chrono Thief's steal!`);
    } else {
      const stolen = Math.min(2, pow1);
      pow0 += 2;
      pow1 = Math.max(0, pow1 - 2);
      steps0.push({ label: 'Chrono Steal', delta: 2, value: pow0, tone: 'buff' });
      steps1.push({ label: 'Chrono Drained', delta: -stolen, value: pow1, tone: 'debuff' });
      events.push(`${p0.nickname}'s CHRONO THIEF stole 2 Power from ${p1.nickname}!`);
    }
  }
  if (c1 === 'chrono_thief' && !p1Nullified) {
    if (c0 === 'gravity_anchor') {
      events.push(`${p0.nickname}'s GRAVITY ANCHOR blocked Chrono Thief's steal!`);
    } else {
      const stolen = Math.min(2, pow0);
      pow1 += 2;
      pow0 = Math.max(0, pow0 - 2);
      steps1.push({ label: 'Chrono Steal', delta: 2, value: pow1, tone: 'buff' });
      steps0.push({ label: 'Chrono Drained', delta: -stolen, value: pow0, tone: 'debuff' });
      events.push(`${p1.nickname}'s CHRONO THIEF stole 2 Power from ${p0.nickname}!`);
    }
  }

  // Mind Parasite (immediate 3 burn + -3 curse next round)
  if (c0 === 'mind_parasite' && !p0Nullified) {
    nextCurse[1] = -3;
    extraDamage[1] += 3;
    events.push(`${p0.nickname}'s MIND PARASITE burned ${p1.nickname} for 3 DMG & cursed next card (-3 PWR)!`);
  }
  if (c1 === 'mind_parasite' && !p1Nullified) {
    nextCurse[0] = -3;
    extraDamage[0] += 3;
    events.push(`${p1.nickname}'s MIND PARASITE burned ${p0.nickname} for 3 DMG & cursed next card (-3 PWR)!`);
  }

  // Chaos Dice reality flip
  let invertCount = distortion === 'INVERTED_GRAVITY' ? 1 : 0;
  if (c0 === 'chaos_dice' && !p0Nullified) {
    invertCount += 1;
    events.push(`${p0.nickname}'s CHAOS DICE warped the clash hierarchy!`);
  }
  if (c1 === 'chaos_dice' && !p1Nullified) {
    invertCount += 1;
    events.push(`${p1.nickname}'s CHAOS DICE warped the clash hierarchy!`);
  }
  const lowestWins = invertCount % 2 === 1;

  // 6. Zero Void Power Swap (blocked by Gravity Anchor or mirrored Zero Void)
  let swapped = false;
  if (c0 === 'zero_void' && c1 !== 'zero_void') {
    if (c1 === 'gravity_anchor') {
      events.push(`${p1.nickname}'s GRAVITY ANCHOR resisted ZERO VOID's Power Swap!`);
    } else {
      const prev0 = pow0;
      const prev1 = pow1;
      pow0 = prev1;
      pow1 = prev0;
      swapped = true;
      steps0.push({ label: 'Void Swap', delta: pow0 - prev0, value: pow0, tone: 'paradox' });
      steps1.push({ label: 'Void Swap', delta: pow1 - prev1, value: pow1, tone: 'paradox' });
      events.push(`ZERO VOID swapped final Powers (${prev0} ⇄ ${prev1})!`);
    }
  } else if (c1 === 'zero_void' && c0 !== 'zero_void') {
    if (c0 === 'gravity_anchor') {
      events.push(`${p0.nickname}'s GRAVITY ANCHOR resisted ZERO VOID's Power Swap!`);
    } else {
      const prev0 = pow0;
      const prev1 = pow1;
      pow0 = prev1;
      pow1 = prev0;
      swapped = true;
      steps0.push({ label: 'Void Swap', delta: pow0 - prev0, value: pow0, tone: 'paradox' });
      steps1.push({ label: 'Void Swap', delta: pow1 - prev1, value: pow1, tone: 'paradox' });
      events.push(`ZERO VOID swapped final Powers (${prev0} ⇄ ${prev1})!`);
    }
  }

  // 7. Determine Clash Winner (Bluff Phantom Ambush -> Glass Titan Shatter -> Power Compare)
  const bluff0 = c0 === 'bluff_phantom' && !p0Nullified && (base1 >= 7 || s1 === 'double');
  const bluff1 = c1 === 'bluff_phantom' && !p1Nullified && (base0 >= 7 || s0 === 'double');

  const shatter0 = c0 === 'glass_titan' && !p0Nullified && base1 <= 3;
  const shatter1 = c1 === 'glass_titan' && !p1Nullified && base0 <= 3;

  let winnerIdx: 0 | 1 | null = null;
  let bluffTriggeredBy: 0 | 1 | null = null;
  let shatteredIdx: 0 | 1 | null = null;

  if (bluff0 && !bluff1) {
    winnerIdx = 0;
    bluffTriggeredBy = 0;
    extraDamage[1] += 9;
    events.push(`${p0.nickname}'s BLUFF PHANTOM ambushed ${p1.nickname} for +9 Psychic Damage & STOLE the clash!`);
  } else if (bluff1 && !bluff0) {
    winnerIdx = 1;
    bluffTriggeredBy = 1;
    extraDamage[0] += 9;
    events.push(`${p1.nickname}'s BLUFF PHANTOM ambushed ${p0.nickname} for +9 Psychic Damage & STOLE the clash!`);
  } else {
    if (bluff0 && bluff1) {
      extraDamage[0] += 9;
      extraDamage[1] += 9;
      events.push('DUAL BLUFF PHANTOMS collided — BOTH players take 9 Psychic Damage!');
    }
    if (shatter0 && !shatter1) {
      winnerIdx = 1;
      shatteredIdx = 0;
      events.push(`${p0.nickname}'s GLASS TITAN shattered against ${def1.name} (base ≤ 3)!`);
    } else if (shatter1 && !shatter0) {
      winnerIdx = 0;
      shatteredIdx = 1;
      events.push(`${p1.nickname}'s GLASS TITAN shattered against ${def0.name} (base ≤ 3)!`);
    } else if (pow0 === pow1) {
      winnerIdx = null;
      events.push(`PARADOX TIE at ${pow0} Power — neither player claims the Crown!`);
    } else if (lowestWins) {
      winnerIdx = pow0 < pow1 ? 0 : 1;
    } else {
      winnerIdx = pow0 > pow1 ? 0 : 1;
    }
  }

  // 8. Calculate Clash Damage & Multipliers
  let damageMultiplier = 1;
  if (distortion === 'BLOOD_MOON') damageMultiplier *= 2;
  if (s0 === 'double') damageMultiplier *= 2;
  if (s1 === 'double') damageMultiplier *= 2;

  const clashDamage: [number, number] = [0, 0];

  if (winnerIdx !== null) {
    const loserIdx: 0 | 1 = winnerIdx === 0 ? 1 : 0;
    let rawDmg: number;

    if (distortion === 'PURE_DUEL') {
      rawDmg = 8;
      healed[winnerIdx] += 2;
      events.push(`PRIMAL SINGULARITY granted ${winnerIdx === 0 ? p0.nickname : p1.nickname} 8 flat DMG & +2 HP!`);
    } else {
      rawDmg = Math.max(5, Math.abs(pow0 - pow1) + 4);
    }

    rawDmg = rawDmg * damageMultiplier;

    const loserStance = loserIdx === 0 ? s0 : s1;
    if (loserStance === 'ward') {
      const reduced = Math.ceil(rawDmg / 2);
      events.push(
        `${loserIdx === 0 ? p0.nickname : p1.nickname}'s WARD SHIELD halved clash damage (${rawDmg} → ${reduced})!`
      );
      rawDmg = reduced;
    }

    clashDamage[loserIdx] += rawDmg;

    // Vampire Sigil on-win bleed + heal
    const winCard = winnerIdx === 0 ? c0 : c1;
    const winNullified = winnerIdx === 0 ? p0Nullified : p1Nullified;
    if (winCard === 'vampire_sigil' && !winNullified) {
      healed[winnerIdx] += 5;
      extraDamage[loserIdx] += 3;
      events.push(
        `${winnerIdx === 0 ? p0.nickname : p1.nickname}'s VAMPIRE SIGIL drained +5 HP & inflicted +3 bleed!`
      );
    }
  }

  // 9. Quantum Bomb detonation (if final powers within 2 of each other)
  let quantumDetonated = false;
  const q0 = c0 === 'quantum_bomb' && !p0Nullified;
  const q1 = c1 === 'quantum_bomb' && !p1Nullified;
  if ((q0 || q1) && Math.abs(pow0 - pow1) <= 2) {
    quantumDetonated = true;
    const blasts = (q0 ? 1 : 0) + (q1 ? 1 : 0);
    const blastDmg = 8 * blasts;
    extraDamage[0] += blastDmg;
    extraDamage[1] += blastDmg;
    events.push(`QUANTUM BOMB DETONATED (diff ${Math.abs(pow0 - pow1)} ≤ 2) — ${blastDmg} DMG to BOTH players!`);
  }

  const totalDamageTaken: [number, number] = [
    clashDamage[0] + extraDamage[0],
    clashDamage[1] + extraDamage[1],
  ];

  // Apply HP & Crowns
  const nextHp0 = Math.min(MAX_HP, Math.max(0, p0.hp - totalDamageTaken[0] + healed[0]));
  const nextHp1 = Math.min(MAX_HP, Math.max(0, p1.hp - totalDamageTaken[1] + healed[1]));

  const nextCrowns0 = p0.crowns + (winnerIdx === 0 ? 1 : 0);
  const nextCrowns1 = p1.crowns + (winnerIdx === 1 ? 1 : 0);

  // Move played card from hand -> discard & draw back to 5
  const removeOnce = (hand: AnomalyCardId[], card: AnomalyCardId): AnomalyCardId[] => {
    const idx = hand.indexOf(card);
    if (idx === -1) return [...hand];
    return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
  };

  const p0Draw = drawUpToHandSize(removeOnce(p0.hand, c0), p0.deck, [...p0.discard, c0]);
  const p1Draw = drawUpToHandSize(removeOnce(p1.hand, c1), p1.deck, [...p1.discard, c1]);

  const nextP0: RealityPlayer = {
    ...p0,
    hp: nextHp0,
    crowns: nextCrowns0,
    hand: p0Draw.hand,
    deck: p0Draw.deck,
    discard: p0Draw.discard,
    doubleUsesLeft: s0 === 'double' ? Math.max(0, p0.doubleUsesLeft - 1) : p0.doubleUsesLeft,
    wardUsesLeft: s0 === 'ward' ? Math.max(0, p0.wardUsesLeft - 1) : p0.wardUsesLeft,
    nextRoundCurse: nextCurse[0],
    lockedCard: null,
    lockedStance: 'hold',
    locked: false,
  };

  const nextP1: RealityPlayer = {
    ...p1,
    hp: nextHp1,
    crowns: nextCrowns1,
    hand: p1Draw.hand,
    deck: p1Draw.deck,
    discard: p1Draw.discard,
    doubleUsesLeft: s1 === 'double' ? Math.max(0, p1.doubleUsesLeft - 1) : p1.doubleUsesLeft,
    wardUsesLeft: s1 === 'ward' ? Math.max(0, p1.wardUsesLeft - 1) : p1.wardUsesLeft,
    nextRoundCurse: nextCurse[1],
    lockedCard: null,
    lockedStance: 'hold',
    locked: false,
  };

  // Determine if match ended
  let pendingMatchWinnerUid: string | null = null;
  if (nextHp0 <= 0 && nextHp1 <= 0) {
    if (nextCrowns0 > nextCrowns1) pendingMatchWinnerUid = p0.uid;
    else if (nextCrowns1 > nextCrowns0) pendingMatchWinnerUid = p1.uid;
    else pendingMatchWinnerUid = 'TIE';
  } else if (nextHp0 <= 0) {
    pendingMatchWinnerUid = p1.uid;
  } else if (nextHp1 <= 0) {
    pendingMatchWinnerUid = p0.uid;
  } else if (nextCrowns0 >= CROWNS_TO_WIN) {
    pendingMatchWinnerUid = p0.uid;
  } else if (nextCrowns1 >= CROWNS_TO_WIN) {
    pendingMatchWinnerUid = p1.uid;
  }

  let headline = 'PARADOX DRAW';
  if (bluffTriggeredBy !== null) {
    headline = `${bluffTriggeredBy === 0 ? p0.nickname : p1.nickname} PULLED OFF A BLUFF AMBUSH!`;
  } else if (shatteredIdx !== null) {
    headline = `${shatteredIdx === 0 ? p0.nickname : p1.nickname}'s GLASS TITAN SHATTERED!`;
  } else if (winnerIdx !== null) {
    headline = `${winnerIdx === 0 ? p0.nickname : p1.nickname} CLAIMED THE CLASH!`;
  }

  const log: ClashResultLog = {
    round,
    distortion,
    cards: [c0, c1],
    stances: [s0, s1],
    displayedAuras: [getDisplayedAuraTier(c0), getDisplayedAuraTier(c1)],
    basePowers: [base0, base1],
    finalPowers: [pow0, pow1],
    mathSteps: [steps0, steps1],
    winnerIdx,
    lowestWins,
    damageMultiplier,
    damageTaken: totalDamageTaken,
    healed,
    events,
    headline,
    shatteredIdx,
    bluffTriggeredBy,
    quantumDetonated,
    swapped,
    nullifiedIdx,
    pendingMatchWinnerUid,
  };

  return { nextP0, nextP1, log };
}

/**
 * Tactical ORACLE-AI that reads the active World Distortion, curse state,
 * discard scaling, and player HP/Crowns to pick smart cards & stances.
 */
export function pickOracleMove(
  ai: RealityPlayer,
  opponent: RealityPlayer,
  distortion: DistortionId
): { card: AnomalyCardId; stance: RealityStance } {
  const hand = ai.hand.length > 0 ? ai.hand : (['zero_void'] as AnomalyCardId[]);

  const scored = hand.map((cardId) => {
    const def = ANOMALY_CARDS[cardId];
    const base = def.basePower;
    let score = base;

    // Account for curse on AI
    if (ai.nextRoundCurse < 0) {
      if (distortion === 'INVERTED_GRAVITY') {
        score += 2.5; // curse actually helps under Inverted Gravity!
      } else if (cardId === 'zero_void') {
        score += 3; // zero void swaps the cursed low power away!
      } else {
        score -= 1.5;
      }
    }

    if (distortion === 'INVERTED_GRAVITY') {
      // Lower power is dramatically stronger under Inverted Gravity
      score = 10 - base;
      if (cardId === 'zero_void') score -= 4; // swapping 0 away loses under Inverted Gravity!
      if (cardId === 'chaos_dice') score += 5.5; // surprise flip back to HIGHEST wins!
      if (cardId === 'bluff_phantom') score += 3.5; // low base 2 + ambush threat
      if (cardId === 'siphon_witch') score += 1.5;
      if (cardId === 'mind_parasite') score += 2.2;
      if (cardId === 'glass_titan') score -= 3;
    } else {
      // Standard highest-power-wins heuristics
      if (distortion === 'ODD_SURGE' && base % 2 !== 0) score += 3.5;
      if (distortion === 'VOID_ECHO' && base <= 4) score += 4.5;

      switch (cardId) {
        case 'zero_void':
          // Great counter when opponent likely plays high cards or on Blood Moon
          score = distortion === 'BLOOD_MOON' ? 8.2 : 7.4;
          if (distortion === 'VOID_ECHO') score += 1.2;
          break;
        case 'glass_titan':
          // Risky during Void Echo / Odd Surge when low cards are popular; strong otherwise
          score = distortion === 'VOID_ECHO' ? 5.2 : 8.5;
          if (distortion === 'ODD_SURGE') score += 1.8;
          break;
        case 'bluff_phantom':
          // Great trap if opponent has Double Stakes left or plays big cards
          score = opponent.doubleUsesLeft > 0 ? 7.6 : 6.1;
          if (distortion === 'BLOOD_MOON') score += 1.5;
          break;
        case 'echo_mirror':
          score = distortion === 'VOID_ECHO' ? 8.4 : 7.2;
          break;
        case 'chrono_thief':
          score = 8.0 + (distortion === 'ODD_SURGE' ? 2.2 : 0);
          break;
        case 'chaos_dice':
          // Fun disruptor when high power distortions are up
          score = distortion === 'ODD_SURGE' ? 6.5 : 7.0;
          break;
        case 'vampire_sigil':
          score = 7.4 + (ai.hp <= 18 ? 2.2 : 0) + (distortion === 'ODD_SURGE' ? 2.2 : 0);
          break;
        case 'quantum_bomb':
          score = opponent.hp <= 12 && ai.hp > 12 ? 9.2 : 6.8;
          break;
        case 'siphon_witch':
          score = 6.9 + (ai.hp <= 20 ? 1.5 : 0) + (distortion === 'VOID_ECHO' ? 2.5 : 0);
          break;
        case 'gravity_anchor':
          score = 8.9;
          break;
        case 'mind_parasite':
          score = 6.8 + (distortion === 'VOID_ECHO' ? 2.5 : 0);
          break;
        case 'apex_singularity':
          score = 5 + ai.discard.length * 1.35 + (distortion === 'ODD_SURGE' ? 2.5 : 0);
          break;
      }
    }

    // Controlled jitter for unpredictability
    score += Math.random() * 1.8;
    return { cardId, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0];

  // Choose Tactical Stance
  let stance: RealityStance = 'hold';
  const highConfidence = chosen.score >= 9.4;
  const nearLethal = opponent.hp <= 14 || ai.crowns >= CROWNS_TO_WIN - 1;
  const lowHp = ai.hp <= 14;

  if (
    ai.doubleUsesLeft > 0 &&
    ((highConfidence && (Math.random() < 0.55 || distortion === 'BLOOD_MOON')) ||
      (nearLethal && chosen.score >= 8.3 && Math.random() < 0.65))
  ) {
    stance = 'double';
  } else if (
    ai.wardUsesLeft > 0 &&
    ((lowHp && Math.random() < 0.6) ||
      (distortion === 'BLOOD_MOON' && chosen.score < 8.4 && Math.random() < 0.7) ||
      (chosen.cardId === 'mind_parasite' && Math.random() < 0.45))
  ) {
    stance = 'ward';
  }

  return { card: chosen.cardId, stance };
}
