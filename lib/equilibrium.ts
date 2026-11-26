export type EquationLawId =
  | 'gravity_80'
  | 'golden_climb'
  | 'prime_anchor'
  | 'mirror_tension'
  | 'harmonic_split';

export type EquilibriumProtocol = 'none' | 'shift_plus' | 'mirror_flip' | 'noise_shield';

export interface EquationLaw {
  id: EquationLawId;
  name: string;
  formulaLabel: string;
  shortRule: string;
  twistLabel: string;
  accent: string;
}

export const EQUATION_LAWS: Record<EquationLawId, EquationLaw> = {
  gravity_80: {
    id: 'gravity_80',
    name: 'Keynesian Gravity',
    formulaLabel: 'T = round(0.8 × Avg)',
    shortRule: 'Closest to 80% of the average wins.',
    twistLabel: 'TRAP: 100 CRUSHES 0 for -2 HP!',
    accent: 'cyan',
  },
  golden_climb: {
    id: 'golden_climb',
    name: 'Golden Ascent',
    formulaLabel: 'T = min(100, round(Avg + 12))',
    shortRule: 'Closest to Avg + 12 wins.',
    twistLabel: 'UNDERCUT: Within 5 apart → LOWER wins!',
    accent: 'amber',
  },
  prime_anchor: {
    id: 'prime_anchor',
    name: 'Prime Anchor',
    formulaLabel: 'T = round(0.65 × Avg + 15)',
    shortRule: 'Fixed point near 43. Closest wins.',
    twistLabel: 'PRIME BONUS: Winning with a PRIME deals -2 HP!',
    accent: 'violet',
  },
  mirror_tension: {
    id: 'mirror_tension',
    name: 'Mirror Paradox',
    formulaLabel: 'T = round(100 − Avg)',
    shortRule: 'High numbers drag Target low; low drags high.',
    twistLabel: 'EQUILIBRIUM: Exact center is 50 — dare to deviate!',
    accent: 'fuchsia',
  },
  harmonic_split: {
    id: 'harmonic_split',
    name: 'Geometric Rift',
    formulaLabel: 'T = round(√(A × B))',
    shortRule: 'Geometric mean favors the lower positive number.',
    twistLabel: 'ZERO PENALTY: Playing 0 vs ≥50 auto-loses!',
    accent: 'emerald',
  },
};

export const EQUATION_LAW_LIST: EquationLawId[] = [
  'gravity_80',
  'mirror_tension',
  'prime_anchor',
  'golden_climb',
  'harmonic_split',
];

export interface EquilibriumPlayer {
  uid: string;
  sessionId: string;
  nickname: string;
  isBot?: boolean;
  hp: number;
  maxHp: number;
  lockedNumber: number | null;
  lockedProtocol: EquilibriumProtocol;
  usedProtocols: EquilibriumProtocol[];
}

export interface EquilibriumRoundSummary {
  round: number;
  lawId: EquationLawId;
  rawP0: number;
  rawP1: number;
  effP0: number;
  effP1: number;
  proto0: EquilibriumProtocol;
  proto1: EquilibriumProtocol;
  baseTarget: number;
  finalTarget: number;
  winnerIdx: number | 'draw' | 'paradox';
  dmgToP0: number;
  dmgToP1: number;
  bullseye: boolean;
  specialNote: string;
}

export interface EquilibriumState {
  status: 'waiting' | 'picking' | 'reveal' | 'finished';
  round: number;
  currentLawId: EquationLawId;
  lawQueue: EquationLawId[];
  players: EquilibriumPlayer[];
  winnerIdx: number | null;
  lastSummary: EquilibriumRoundSummary | null;
  history: EquilibriumRoundSummary[];
  readyForNext: boolean[];
  updatedAt?: number;
}

export function isPrimeNumber(n: number): boolean {
  if (n < 2 || !Number.isInteger(n)) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function generateLawQueue(): EquationLawId[] {
  const pool = [...EQUATION_LAW_LIST];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Repeat shuffled sequence so long matches never run out
  return [...pool, ...pool, ...pool];
}

export function createEquilibriumPlayer(
  uid: string,
  sessionId: string,
  nickname: string,
  maxHp = 5,
  isBot = false
): EquilibriumPlayer {
  return {
    uid,
    sessionId,
    nickname,
    isBot,
    hp: maxHp,
    maxHp,
    lockedNumber: null,
    lockedProtocol: 'none',
    usedProtocols: [],
  };
}

export function computeBaseTarget(lawId: EquationLawId, a: number, b: number): number {
  const avg = (a + b) / 2;
  switch (lawId) {
    case 'gravity_80':
      return Math.round(avg * 0.8);
    case 'golden_climb':
      return Math.min(100, Math.round(avg + 12));
    case 'prime_anchor':
      return Math.round(avg * 0.65 + 15);
    case 'mirror_tension':
      return Math.round(100 - avg);
    case 'harmonic_split':
      return Math.round(Math.sqrt(Math.max(0, a) * Math.max(0, b)));
  }
}

export function evaluateEquilibriumRound(
  round: number,
  lawId: EquationLawId,
  rawP0: number,
  rawP1: number,
  proto0: EquilibriumProtocol,
  proto1: EquilibriumProtocol
): EquilibriumRoundSummary {
  // 1. Apply Mirror Flip protocol: if opponent > 50, flip your number to 100 - n
  let effP0 = rawP0;
  let effP1 = rawP1;
  const notes: string[] = [];

  if (proto0 === 'mirror_flip' && rawP1 > 50) {
    effP0 = 100 - rawP0;
    notes.push(`P1 Mirror Flip (${rawP0}→${effP0})`);
  }
  if (proto1 === 'mirror_flip' && rawP0 > 50) {
    effP1 = 100 - rawP1;
    notes.push(`P2 Mirror Flip (${rawP1}→${effP1})`);
  }

  // 2. Compute base target + Shift +15 protocols
  const baseTarget = computeBaseTarget(lawId, effP0, effP1);
  let shift = 0;
  if (proto0 === 'shift_plus') {
    shift += 15;
    notes.push('P1 Target +15');
  }
  if (proto1 === 'shift_plus') {
    shift += 15;
    notes.push('P2 Target +15');
  }
  const finalTarget = Math.max(0, Math.min(100, baseTarget + shift));

  let winnerIdx: number | 'draw' | 'paradox' = 'draw';
  let dmgToP0 = 0;
  let dmgToP1 = 0;
  let bullseye = false;

  // 3. Exact-Match Paradox
  if (effP0 === effP1) {
    winnerIdx = 'paradox';
    dmgToP0 = 1;
    dmgToP1 = 1;
    notes.push(`EXACT PARADOX (${effP0} = ${effP1}) — Both lose 1 HP!`);
  } else if (lawId === 'gravity_80' && ((effP0 === 0 && effP1 === 100) || (effP0 === 100 && effP1 === 0))) {
    // 100 crushes 0 rule
    winnerIdx = effP0 === 100 ? 0 : 1;
    if (winnerIdx === 0) dmgToP1 = 2;
    else dmgToP0 = 2;
    notes.push('100 SNIPED 0 — Double Damage (-2 HP)!');
  } else if (
    lawId === 'harmonic_split' &&
    ((effP0 === 0 && effP1 >= 50) || (effP1 === 0 && effP0 >= 50))
  ) {
    winnerIdx = effP0 === 0 ? 1 : 0;
    if (winnerIdx === 0) dmgToP1 = 1;
    else dmgToP0 = 1;
    notes.push('ZERO COLLAPSE PENALTY vs ≥50!');
  } else if (lawId === 'golden_climb' && Math.abs(effP0 - effP1) <= 5) {
    winnerIdx = effP0 < effP1 ? 0 : 1;
    if (winnerIdx === 0) dmgToP1 = 1;
    else dmgToP0 = 1;
    notes.push('WITHIN 5 UNDERCUT — Lower number steals the round!');
  } else {
    const d0 = Math.abs(effP0 - finalTarget);
    const d1 = Math.abs(effP1 - finalTarget);
    if (d0 === d1) {
      winnerIdx = 'draw';
      notes.push('Equidistant tie — No damage dealt.');
    } else {
      winnerIdx = d0 < d1 ? 0 : 1;
      const winNum = winnerIdx === 0 ? effP0 : effP1;
      const winDist = winnerIdx === 0 ? d0 : d1;
      let dmg = 1;

      if (winDist <= 1) {
        bullseye = true;
        dmg = 2;
        notes.push(`BULLSEYE (±${winDist}) — Critical -2 HP!`);
      } else if (lawId === 'prime_anchor' && isPrimeNumber(winNum)) {
        dmg = 2;
        notes.push(`PRIME STRIKE (${winNum}) — Bonus -2 HP!`);
      }

      if (winnerIdx === 0) dmgToP1 = dmg;
      else dmgToP0 = dmg;
    }
  }

  // 4. Noise Shield protocol (blocks normal loss, bypassed by Bullseye)
  if (proto0 === 'noise_shield' && dmgToP0 > 0 && !bullseye) {
    dmgToP0 = 0;
    notes.push('P1 Noise Shield blocked damage!');
  }
  if (proto1 === 'noise_shield' && dmgToP1 > 0 && !bullseye) {
    dmgToP1 = 0;
    notes.push('P2 Noise Shield blocked damage!');
  }

  return {
    round,
    lawId,
    rawP0,
    rawP1,
    effP0,
    effP1,
    proto0,
    proto1,
    baseTarget,
    finalTarget,
    winnerIdx,
    dmgToP0,
    dmgToP1,
    bullseye,
    specialNote: notes.length > 0 ? notes.join(' · ') : `Closest to Target ${finalTarget} wins.`,
  };
}

/**
 * Game-theory EULER-AI opponent for Solo mode.
 */
export function pickEulerBotMove(
  state: EquilibriumState,
  botIdx = 1
): { num: number; protocol: EquilibriumProtocol } {
  const bot = state.players[botIdx];
  const oppIdx = botIdx === 0 ? 1 : 0;
  const law = state.currentLawId;
  const used = new Set(bot.usedProtocols);

  // Estimate rival's average tendency from history
  const oppHistory = state.history.map((h) => (oppIdx === 0 ? h.rawP0 : h.rawP1));
  const avgOpp =
    oppHistory.length > 0
      ? oppHistory.reduce((s, v) => s + v, 0) / oppHistory.length
      : 45;

  let num = 35;
  let protocol: EquilibriumProtocol = 'none';

  switch (law) {
    case 'gravity_80': {
      // Mix between rational low bids (1-18) and bold 100 snipe if opponent goes ultra low
      if (oppHistory.some((x) => x <= 5) && Math.random() < 0.35) {
        num = 100;
      } else {
        const expected = Math.max(2, Math.min(35, Math.round(avgOpp * 0.45)));
        num = Math.max(1, Math.min(40, expected + Math.floor(Math.random() * 11) - 5));
      }
      break;
    }
    case 'golden_climb': {
      // High bids 68..96, or tactical undercut around 82
      num = Math.max(55, Math.min(98, Math.round(72 + Math.random() * 24)));
      break;
    }
    case 'prime_anchor': {
      // Primes near equilibrium (37, 41, 43, 47, 53)
      const primes = [29, 31, 37, 41, 43, 47, 53];
      num = primes[Math.floor(Math.random() * primes.length)];
      break;
    }
    case 'mirror_tension': {
      // Equilibrium is 50; play mindgames around 44..56 or extreme bait
      const offset = Math.floor(Math.random() * 19) - 9;
      num = Math.max(15, Math.min(85, 50 + offset));
      break;
    }
    case 'harmonic_split': {
      // Positive numbers 12..38 avoid zero-penalty while winning geometric mean
      num = Math.max(8, Math.min(42, Math.round(14 + Math.random() * 24)));
      break;
    }
  }

  // Smart protocol deployment
  if (bot.hp <= 2 && !used.has('noise_shield') && Math.random() < 0.6) {
    protocol = 'noise_shield';
  } else if (
    (law === 'gravity_80' || law === 'prime_anchor') &&
    !used.has('shift_plus') &&
    Math.random() < 0.3
  ) {
    protocol = 'shift_plus';
    num = Math.min(95, num + 14);
  } else if (law === 'golden_climb' && !used.has('mirror_flip') && Math.random() < 0.3) {
    protocol = 'mirror_flip';
    num = Math.max(10, 100 - num);
  }

  return { num: Math.max(0, Math.min(100, num)), protocol };
}
