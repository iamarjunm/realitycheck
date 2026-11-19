export type CardShape = 'circle' | 'triangle' | 'diamond' | 'square' | 'star';
export type CardColor = 'yellow' | 'green' | 'blue' | 'purple' | 'offwhite';
export type BotDifficulty = 'casual' | 'sharp' | 'master';

export const CARD_SHAPES: CardShape[] = ['circle', 'triangle', 'diamond', 'square', 'star'];
export const CARD_COLORS: CardColor[] = ['yellow', 'green', 'blue', 'purple', 'offwhite'];

export const SHAPE_LABELS: Record<CardShape, string> = {
  circle: 'Circle',
  triangle: 'Triangle',
  diamond: 'Diamond',
  square: 'Square',
  star: 'Star',
};

export const COLOR_LABELS: Record<CardColor, string> = {
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  offwhite: 'Off-White',
};

export interface SecretCard {
  index: number; // 0..25
  number: number; // 1..26
  letter: string; // 'A'..'Z'
  shape: CardShape;
  color: CardColor;
}

export type RuleType =
  | 'SUM_TOTAL'
  | 'AVG_EXACT'
  | 'SUM_PAIR_EXACT'
  | 'DIFF_PAIR_EXACT'
  | 'SUM_MIN_MAX'
  | 'RANGE_DIFF'
  | 'PRODUCT_PAIR_EXACT'
  | 'PRODUCT_PAIR_MAX'
  | 'PRODUCT_PAIR_MIN'
  | 'RATIO_MULTIPLE'
  | 'HALF_SUM_GT'
  | 'ALL_COLORS_DIFF'
  | 'EXACT_COLOR_COUNT'
  | 'EXACT_SHAPE_COUNT'
  | 'SPECIFIC_COLOR_COUNT'
  | 'SPECIFIC_SHAPE_COUNT'
  | 'ADJACENT_SHAPES_DIFF'
  | 'ADJACENT_COLORS_DIFF'
  | 'ENDS_SAME_COLOR'
  | 'ENDS_SAME_SHAPE'
  | 'LOWEST_RAREST_COLOR'
  | 'HIGHEST_MOST_COMMON_SHAPE'
  | 'SLOT_SHAPE'
  | 'SLOT_COLOR'
  | 'SLOT_RANGE'
  | 'SLOT_PARITY'
  | 'SLOT_GREATER'
  | 'PARITY_EVEN_COUNT'
  | 'SAME_PARITY_COUNT'
  | 'MAX_IN_SLOT'
  | 'MIN_IN_SLOT'
  | 'PRIME_COUNT'
  | 'DIVISIBLE_COUNT'
  | 'VOWEL_COUNT'
  | 'CONSECUTIVE_PAIR';

export interface CipherRule {
  id: string;
  type: RuleType;
  category: 'math' | 'colors_shapes' | 'frequency' | 'position';
  text: string;
  params: Record<string, string | number>;
}

export interface DeckStats {
  colorCounts: Record<CardColor, number>;
  shapeCounts: Record<CardShape, number>;
  rarestColors: CardColor[];
  mostCommonColors: CardColor[];
  rarestShapes: CardShape[];
  mostCommonShapes: CardShape[];
}

export interface GeneratedPuzzle {
  cards: SecretCard[];
  secretIndices: [number, number, number, number];
  rules: CipherRule[];
}

export const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);
export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

const SLOT_NAMES = ['1st', '2nd', '3rd', '4th'] as const;

// Track recent primary rule types so back-to-back rounds feel genuinely distinct
let recentPrimaryMathTypes: RuleType[] = [];

export function computeDeckStats(cards: SecretCard[]): DeckStats {
  const colorCounts: Record<CardColor, number> = {
    yellow: 0,
    green: 0,
    blue: 0,
    purple: 0,
    offwhite: 0,
  };
  const shapeCounts: Record<CardShape, number> = {
    circle: 0,
    triangle: 0,
    diamond: 0,
    square: 0,
    star: 0,
  };

  for (const c of cards) {
    colorCounts[c.color]++;
    shapeCounts[c.shape]++;
  }

  const minColorVal = Math.min(...CARD_COLORS.map((c) => colorCounts[c]));
  const maxColorVal = Math.max(...CARD_COLORS.map((c) => colorCounts[c]));
  const minShapeVal = Math.min(...CARD_SHAPES.map((s) => shapeCounts[s]));
  const maxShapeVal = Math.max(...CARD_SHAPES.map((s) => shapeCounts[s]));

  return {
    colorCounts,
    shapeCounts,
    rarestColors: CARD_COLORS.filter((c) => colorCounts[c] === minColorVal),
    mostCommonColors: CARD_COLORS.filter((c) => colorCounts[c] === maxColorVal),
    rarestShapes: CARD_SHAPES.filter((s) => shapeCounts[s] === minShapeVal),
    mostCommonShapes: CARD_SHAPES.filter((s) => shapeCounts[s] === maxShapeVal),
  };
}

export function generateRandomDeck(): SecretCard[] {
  const colorWeights = CARD_COLORS.map(() => 0.45 + Math.random() * 1.4);
  const shapeWeights = CARD_SHAPES.map(() => 0.45 + Math.random() * 1.4);

  const pickWeighted = <T,>(items: T[], weights: number[]): T => {
    const total = weights.reduce((acc, w) => acc + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };

  const cards: SecretCard[] = [];
  for (let i = 0; i < 26; i++) {
    cards.push({
      index: i,
      number: i + 1,
      letter: String.fromCharCode(65 + i),
      shape: pickWeighted(CARD_SHAPES, shapeWeights),
      color: pickWeighted(CARD_COLORS, colorWeights),
    });
  }

  for (let cIdx = 0; cIdx < CARD_COLORS.length; cIdx++) {
    const c = CARD_COLORS[cIdx];
    if (!cards.some((card) => card.color === c)) {
      cards[(cIdx * 5) % 26].color = c;
    }
  }
  for (let sIdx = 0; sIdx < CARD_SHAPES.length; sIdx++) {
    const s = CARD_SHAPES[sIdx];
    if (!cards.some((card) => card.shape === s)) {
      cards[(sIdx * 5 + 2) % 26].shape = s;
    }
  }

  return cards;
}

export function evaluateRule(
  rule: CipherRule,
  guess: [SecretCard, SecretCard, SecretCard, SecretCard],
  stats: DeckStats
): boolean {
  const [c1, c2, c3, c4] = guess;
  const nums = [c1.number, c2.number, c3.number, c4.number];
  const minNum = Math.min(...nums);
  const maxNum = Math.max(...nums);

  switch (rule.type) {
    case 'SUM_TOTAL':
      return c1.number + c2.number + c3.number + c4.number === Number(rule.params.target);

    case 'AVG_EXACT':
      return c1.number + c2.number + c3.number + c4.number === Number(rule.params.avg) * 4;

    case 'SUM_PAIR_EXACT': {
      const a = Number(rule.params.a);
      const b = Number(rule.params.b);
      return guess[a].number + guess[b].number === Number(rule.params.target);
    }

    case 'DIFF_PAIR_EXACT': {
      const a = Number(rule.params.a);
      const b = Number(rule.params.b);
      return guess[a].number - guess[b].number === Number(rule.params.target);
    }

    case 'SUM_MIN_MAX':
      return minNum + maxNum === Number(rule.params.target);

    case 'RANGE_DIFF':
      return maxNum - minNum === Number(rule.params.target);

    case 'PRODUCT_PAIR_EXACT': {
      const a = Number(rule.params.a);
      const b = Number(rule.params.b);
      return guess[a].number * guess[b].number === Number(rule.params.target);
    }

    case 'PRODUCT_PAIR_MAX': {
      const a = Number(rule.params.a);
      const b = Number(rule.params.b);
      return guess[a].number * guess[b].number <= Number(rule.params.bound);
    }

    case 'PRODUCT_PAIR_MIN': {
      const a = Number(rule.params.a);
      const b = Number(rule.params.b);
      return guess[a].number * guess[b].number >= Number(rule.params.bound);
    }

    case 'RATIO_MULTIPLE': {
      const a = Number(rule.params.a);
      const b = Number(rule.params.b);
      const mult = Number(rule.params.mult);
      return guess[a].number === guess[b].number * mult;
    }

    case 'HALF_SUM_GT':
      return c1.number + c2.number > c3.number + c4.number;

    case 'ALL_COLORS_DIFF':
      return new Set([c1.color, c2.color, c3.color, c4.color]).size === 4;

    case 'EXACT_COLOR_COUNT':
      return new Set([c1.color, c2.color, c3.color, c4.color]).size === Number(rule.params.count);

    case 'EXACT_SHAPE_COUNT':
      return new Set([c1.shape, c2.shape, c3.shape, c4.shape]).size === Number(rule.params.count);

    case 'SPECIFIC_COLOR_COUNT':
      return (
        guess.filter((c) => c.color === rule.params.color).length === Number(rule.params.count)
      );

    case 'SPECIFIC_SHAPE_COUNT':
      return (
        guess.filter((c) => c.shape === rule.params.shape).length === Number(rule.params.count)
      );

    case 'ADJACENT_SHAPES_DIFF':
      return c1.shape !== c2.shape && c2.shape !== c3.shape && c3.shape !== c4.shape;

    case 'ADJACENT_COLORS_DIFF':
      return c1.color !== c2.color && c2.color !== c3.color && c3.color !== c4.color;

    case 'ENDS_SAME_COLOR':
      return c1.color === c4.color;

    case 'ENDS_SAME_SHAPE':
      return c1.shape === c4.shape;

    case 'LOWEST_RAREST_COLOR': {
      const lowestCard = guess.reduce((low, curr) => (curr.number < low.number ? curr : low), c1);
      return stats.rarestColors.includes(lowestCard.color);
    }

    case 'HIGHEST_MOST_COMMON_SHAPE': {
      const highestCard = guess.reduce((hi, curr) => (curr.number > hi.number ? curr : hi), c1);
      return stats.mostCommonShapes.includes(highestCard.shape);
    }

    case 'SLOT_SHAPE': {
      const slot = Number(rule.params.slot);
      return guess[slot].shape === rule.params.shape;
    }

    case 'SLOT_COLOR': {
      const slot = Number(rule.params.slot);
      return guess[slot].color === rule.params.color;
    }

    case 'SLOT_RANGE': {
      const slot = Number(rule.params.slot);
      const min = Number(rule.params.min);
      const max = Number(rule.params.max);
      return guess[slot].number >= min && guess[slot].number <= max;
    }

    case 'SLOT_PARITY': {
      const slot = Number(rule.params.slot);
      const wantEven = Number(rule.params.even) === 1;
      return (guess[slot].number % 2 === 0) === wantEven;
    }

    case 'SLOT_GREATER': {
      const a = Number(rule.params.a);
      const b = Number(rule.params.b);
      return guess[a].number > guess[b].number;
    }

    case 'PARITY_EVEN_COUNT': {
      const evens = nums.filter((n) => n % 2 === 0).length;
      return evens === Number(rule.params.count);
    }

    case 'SAME_PARITY_COUNT': {
      const a = Number(rule.params.a);
      const b = Number(rule.params.b);
      return guess[a].number % 2 === guess[b].number % 2;
    }

    case 'MAX_IN_SLOT': {
      const slot = Number(rule.params.slot);
      return guess[slot].number === maxNum;
    }

    case 'MIN_IN_SLOT': {
      const slot = Number(rule.params.slot);
      return guess[slot].number === minNum;
    }

    case 'PRIME_COUNT': {
      const primes = nums.filter((n) => PRIMES.has(n)).length;
      return primes === Number(rule.params.count);
    }

    case 'DIVISIBLE_COUNT': {
      const div = Number(rule.params.divisor);
      const matches = nums.filter((n) => n % div === 0).length;
      return matches === Number(rule.params.count);
    }

    case 'VOWEL_COUNT': {
      const vowels = guess.filter((c) => VOWELS.has(c.letter)).length;
      return vowels === Number(rule.params.count);
    }

    case 'CONSECUTIVE_PAIR': {
      const sorted = [...nums].sort((a, b) => a - b);
      const hasConsec =
        sorted[1] - sorted[0] === 1 ||
        sorted[2] - sorted[1] === 1 ||
        sorted[3] - sorted[2] === 1;
      return Number(rule.params.has) === 1 ? hasConsec : !hasConsec;
    }

    default:
      return false;
  }
}

function buildCandidateRulesForSolution(
  secret: [SecretCard, SecretCard, SecretCard, SecretCard],
  stats: DeckStats
): CipherRule[] {
  const [c1, c2, c3, c4] = secret;
  const nums = [c1.number, c2.number, c3.number, c4.number];
  const sum = nums.reduce((a, b) => a + b, 0);
  const minNum = Math.min(...nums);
  const maxNum = Math.max(...nums);
  const distinctColors = new Set([c1.color, c2.color, c3.color, c4.color]).size;
  const distinctShapes = new Set([c1.shape, c2.shape, c3.shape, c4.shape]).size;
  const evenCount = nums.filter((n) => n % 2 === 0).length;
  const primeCount = nums.filter((n) => PRIMES.has(n)).length;
  const vowelCount = secret.filter((c) => VOWELS.has(c.letter)).length;

  const candidates: CipherRule[] = [];

  // 1. Global & Pairwise Arithmetic (Math)
  candidates.push({
    id: 'sum_total',
    type: 'SUM_TOTAL',
    category: 'math',
    text: `The sum of all 4 card numbers is ${sum}.`,
    params: { target: sum },
  });

  if (sum % 4 === 0) {
    candidates.push({
      id: 'avg_exact',
      type: 'AVG_EXACT',
      category: 'math',
      text: `The average of the 4 card numbers is ${sum / 4}.`,
      params: { avg: sum / 4 },
    });
  }

  candidates.push({
    id: 'sum_min_max',
    type: 'SUM_MIN_MAX',
    category: 'math',
    text: `Smallest + Largest number in the code equals ${minNum + maxNum}.`,
    params: { target: minNum + maxNum },
  });

  candidates.push({
    id: 'range_diff',
    type: 'RANGE_DIFF',
    category: 'math',
    text: `Largest − Smallest number in the code equals ${maxNum - minNum}.`,
    params: { target: maxNum - minNum },
  });

  // Pairwise Sums, Differences, Products, and Ratios across ALL slot pairs (not just 2&3 or 1&4!)
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const va = secret[a].number;
      const vb = secret[b].number;

      candidates.push({
        id: `sum_pair_${a}_${b}`,
        type: 'SUM_PAIR_EXACT',
        category: 'math',
        text: `The ${SLOT_NAMES[a]} + ${SLOT_NAMES[b]} card numbers sum to ${va + vb}.`,
        params: { a, b, target: va + vb },
      });

      if (va > vb) {
        candidates.push({
          id: `diff_pair_${a}_${b}`,
          type: 'DIFF_PAIR_EXACT',
          category: 'math',
          text: `The ${SLOT_NAMES[a]} number minus the ${SLOT_NAMES[b]} number is ${va - vb}.`,
          params: { a, b, target: va - vb },
        });
        if (va % vb === 0 && va / vb >= 2) {
          const mult = va / vb;
          candidates.push({
            id: `ratio_${a}_${b}`,
            type: 'RATIO_MULTIPLE',
            category: 'math',
            text: `The ${SLOT_NAMES[a]} number is exactly ${mult}× the ${SLOT_NAMES[b]} number.`,
            params: { a, b, mult },
          });
        }
      } else {
        candidates.push({
          id: `diff_pair_${b}_${a}`,
          type: 'DIFF_PAIR_EXACT',
          category: 'math',
          text: `The ${SLOT_NAMES[b]} number minus the ${SLOT_NAMES[a]} number is ${vb - va}.`,
          params: { a: b, b: a, target: vb - va },
        });
        if (vb % va === 0 && vb / va >= 2) {
          const mult = vb / va;
          candidates.push({
            id: `ratio_${b}_${a}`,
            type: 'RATIO_MULTIPLE',
            category: 'math',
            text: `The ${SLOT_NAMES[b]} number is exactly ${mult}× the ${SLOT_NAMES[a]} number.`,
            params: { a: b, b: a, mult },
          });
        }
      }

      const prod = va * vb;
      candidates.push({
        id: `prod_pair_${a}_${b}`,
        type: 'PRODUCT_PAIR_EXACT',
        category: 'math',
        text: `The product of the ${SLOT_NAMES[a]} and ${SLOT_NAMES[b]} numbers is ${prod}.`,
        params: { a, b, target: prod },
      });

      if (prod <= 70) {
        const bound = Math.min(80, prod + Math.floor(Math.random() * 8));
        candidates.push({
          id: `prod_max_${a}_${b}`,
          type: 'PRODUCT_PAIR_MAX',
          category: 'math',
          text: `The product of the ${SLOT_NAMES[a]} and ${SLOT_NAMES[b]} numbers is at most ${bound}.`,
          params: { a, b, bound },
        });
      } else if (prod >= 150) {
        const bound = Math.max(120, prod - Math.floor(Math.random() * 15));
        candidates.push({
          id: `prod_min_${a}_${b}`,
          type: 'PRODUCT_PAIR_MIN',
          category: 'math',
          text: `The product of the ${SLOT_NAMES[a]} and ${SLOT_NAMES[b]} numbers is at least ${bound}.`,
          params: { a, b, bound },
        });
      }
    }
  }

  if (c1.number + c2.number > c3.number + c4.number) {
    candidates.push({
      id: 'half_sum_gt',
      type: 'HALF_SUM_GT',
      category: 'math',
      text: 'The sum of Slots 1 & 2 is greater than the sum of Slots 3 & 4.',
      params: {},
    });
  }

  candidates.push({
    id: 'parity_even',
    type: 'PARITY_EVEN_COUNT',
    category: 'math',
    text:
      evenCount === 0
        ? 'All 4 cards in the code have odd numbers.'
        : evenCount === 4
        ? 'All 4 cards in the code have even numbers.'
        : `Exactly ${evenCount} of the 4 cards ${evenCount === 1 ? 'is' : 'are'} even.`,
    params: { count: evenCount },
  });

  candidates.push({
    id: 'prime_count',
    type: 'PRIME_COUNT',
    category: 'math',
    text:
      primeCount === 0
        ? 'None of the 4 cards has a prime number.'
        : `Exactly ${primeCount} of the 4 cards ${primeCount === 1 ? 'is' : 'are'} prime.`,
    params: { count: primeCount },
  });

  for (const divisor of [3, 4, 5]) {
    const divCount = nums.filter((n) => n % divisor === 0).length;
    if (divCount >= 1 && divCount <= 3) {
      candidates.push({
        id: `div_${divisor}`,
        type: 'DIVISIBLE_COUNT',
        category: 'math',
        text: `Exactly ${divCount} of the 4 numbers ${divCount === 1 ? 'is' : 'are'} divisible by ${divisor}.`,
        params: { divisor, count: divCount },
      });
    }
  }

  candidates.push({
    id: 'vowel_count',
    type: 'VOWEL_COUNT',
    category: 'math',
    text:
      vowelCount === 0
        ? 'None of the 4 card letters is a vowel (A, E, I, O, U).'
        : `Exactly ${vowelCount} of the 4 card letters ${vowelCount === 1 ? 'is a vowel' : 'are vowels'} (A, E, I, O, U).`,
    params: { count: vowelCount },
  });

  const sortedNums = [...nums].sort((a, b) => a - b);
  const hasConsec =
    sortedNums[1] - sortedNums[0] === 1 ||
    sortedNums[2] - sortedNums[1] === 1 ||
    sortedNums[3] - sortedNums[2] === 1;
  candidates.push({
    id: 'consecutive_pair',
    type: 'CONSECUTIVE_PAIR',
    category: 'math',
    text: hasConsec
      ? 'At least two cards in the code have consecutive numbers (differ by 1).'
      : 'No two cards in the code have consecutive numbers.',
    params: { has: hasConsec ? 1 : 0 },
  });

  // 2. Color & Shape Rules
  if (distinctColors === 4) {
    candidates.push({
      id: 'all_colors_diff',
      type: 'ALL_COLORS_DIFF',
      category: 'colors_shapes',
      text: 'All 4 cards in the secret code have different colors.',
      params: {},
    });
  } else {
    candidates.push({
      id: 'exact_color_count',
      type: 'EXACT_COLOR_COUNT',
      category: 'colors_shapes',
      text: `Exactly ${distinctColors} distinct color${distinctColors === 1 ? '' : 's'} appear across the 4 cards.`,
      params: { count: distinctColors },
    });
  }

  candidates.push({
    id: 'exact_shape_count',
    type: 'EXACT_SHAPE_COUNT',
    category: 'colors_shapes',
    text:
      distinctShapes === 4
        ? 'All 4 cards have different shapes.'
        : `Exactly ${distinctShapes} distinct shape${distinctShapes === 1 ? '' : 's'} appear in the code.`,
    params: { count: distinctShapes },
  });

  for (const col of CARD_COLORS) {
    const cnt = secret.filter((c) => c.color === col).length;
    if (cnt >= 1 && cnt <= 3) {
      candidates.push({
        id: `spec_color_${col}`,
        type: 'SPECIFIC_COLOR_COUNT',
        category: 'colors_shapes',
        text: `Exactly ${cnt} card${cnt === 1 ? ' is' : 's are'} ${COLOR_LABELS[col]}.`,
        params: { color: col, count: cnt },
      });
    }
  }

  for (const shp of CARD_SHAPES) {
    const cnt = secret.filter((c) => c.shape === shp).length;
    if (cnt >= 1 && cnt <= 3) {
      candidates.push({
        id: `spec_shape_${shp}`,
        type: 'SPECIFIC_SHAPE_COUNT',
        category: 'colors_shapes',
        text: `Exactly ${cnt} card${cnt === 1 ? ' is a' : 's are'} ${SHAPE_LABELS[shp]}${cnt === 1 ? '' : 's'}.`,
        params: { shape: shp, count: cnt },
      });
    }
  }

  if (c1.shape !== c2.shape && c2.shape !== c3.shape && c3.shape !== c4.shape) {
    candidates.push({
      id: 'adj_shapes_diff',
      type: 'ADJACENT_SHAPES_DIFF',
      category: 'colors_shapes',
      text: 'No two adjacent slots (1-2, 2-3, 3-4) share the same shape.',
      params: {},
    });
  }

  if (c1.color !== c2.color && c2.color !== c3.color && c3.color !== c4.color) {
    candidates.push({
      id: 'adj_colors_diff',
      type: 'ADJACENT_COLORS_DIFF',
      category: 'colors_shapes',
      text: 'No two adjacent slots (1-2, 2-3, 3-4) share the same color.',
      params: {},
    });
  }

  if (c1.color === c4.color) {
    candidates.push({
      id: 'ends_same_color',
      type: 'ENDS_SAME_COLOR',
      category: 'colors_shapes',
      text: 'The 1st and 4th cards share the same color.',
      params: {},
    });
  }

  if (c1.shape === c4.shape) {
    candidates.push({
      id: 'ends_same_shape',
      type: 'ENDS_SAME_SHAPE',
      category: 'colors_shapes',
      text: 'The 1st and 4th cards share the same shape.',
      params: {},
    });
  }

  // 3. Global Deck Frequency Rules
  const lowestCard = secret.reduce((low, curr) => (curr.number < low.number ? curr : low), c1);
  if (stats.rarestColors.includes(lowestCard.color)) {
    candidates.push({
      id: 'lowest_rarest_color',
      type: 'LOWEST_RAREST_COLOR',
      category: 'frequency',
      text:
        stats.rarestColors.length === 1
          ? 'The lowest-numbered card in the code has the rarest color across A–Z.'
          : 'The lowest-numbered card in the code has one of the rarest colors across A–Z.',
      params: {},
    });
  }

  const highestCard = secret.reduce((hi, curr) => (curr.number > hi.number ? curr : hi), c1);
  if (stats.mostCommonShapes.includes(highestCard.shape)) {
    candidates.push({
      id: 'highest_common_shape',
      type: 'HIGHEST_MOST_COMMON_SHAPE',
      category: 'frequency',
      text:
        stats.mostCommonShapes.length === 1
          ? 'The highest-numbered card in the code has the most frequent shape across A–Z.'
          : 'The highest-numbered card in the code has one of the most frequent shapes across A–Z.',
      params: {},
    });
  }

  // 4. Positional Rules
  for (let s = 0; s < 4; s++) {
    const val = secret[s].number;
    candidates.push({
      id: `slot_shape_${s}`,
      type: 'SLOT_SHAPE',
      category: 'position',
      text: `The ${SLOT_NAMES[s]} card is a ${SHAPE_LABELS[secret[s].shape]}.`,
      params: { slot: s, shape: secret[s].shape },
    });
    candidates.push({
      id: `slot_color_${s}`,
      type: 'SLOT_COLOR',
      category: 'position',
      text: `The ${SLOT_NAMES[s]} card is ${COLOR_LABELS[secret[s].color]}.`,
      params: { slot: s, color: secret[s].color },
    });
    candidates.push({
      id: `slot_parity_${s}`,
      type: 'SLOT_PARITY',
      category: 'position',
      text: `The ${SLOT_NAMES[s]} card number is ${val % 2 === 0 ? 'even' : 'odd'}.`,
      params: { slot: s, even: val % 2 === 0 ? 1 : 0 },
    });

    // Clean numeric range buckets that actually narrow down the slot
    const lowBound = Math.max(1, val - (2 + Math.floor(Math.random() * 4)));
    const highBound = Math.min(26, val + (2 + Math.floor(Math.random() * 4)));
    if (highBound - lowBound <= 9) {
      candidates.push({
        id: `slot_range_${s}`,
        type: 'SLOT_RANGE',
        category: 'position',
        text: `The ${SLOT_NAMES[s]} card number is between ${lowBound} and ${highBound} (inclusive).`,
        params: { slot: s, min: lowBound, max: highBound },
      });
    }

    if (val === maxNum) {
      candidates.push({
        id: `max_slot_${s}`,
        type: 'MAX_IN_SLOT',
        category: 'position',
        text: `The largest number in the code sits in the ${SLOT_NAMES[s]} slot.`,
        params: { slot: s },
      });
    }
    if (val === minNum) {
      candidates.push({
        id: `min_slot_${s}`,
        type: 'MIN_IN_SLOT',
        category: 'position',
        text: `The smallest number in the code sits in the ${SLOT_NAMES[s]} slot.`,
        params: { slot: s },
      });
    }
  }

  for (let a = 0; a < 4; a++) {
    for (let b = 0; b < 4; b++) {
      if (a !== b && secret[a].number > secret[b].number) {
        candidates.push({
          id: `slot_gt_${a}_${b}`,
          type: 'SLOT_GREATER',
          category: 'position',
          text: `The ${SLOT_NAMES[a]} card number is greater than the ${SLOT_NAMES[b]} card.`,
          params: { a, b },
        });
      }
    }
  }

  return candidates;
}

/**
 * Enumerates matching 4-tuples for a set of seed rules, returning early if count exceeds maxKeep.
 */
function collectMatchingTuples(
  cards: SecretCard[],
  rules: CipherRule[],
  stats: DeckStats,
  maxKeep = 25000
): [number, number, number, number][] | null {
  const slotPools: SecretCard[][] = [0, 1, 2, 3].map((slotIdx) => {
    return cards.filter((card) => {
      for (const r of rules) {
        if (r.type === 'SLOT_SHAPE' && Number(r.params.slot) === slotIdx && card.shape !== r.params.shape)
          return false;
        if (r.type === 'SLOT_COLOR' && Number(r.params.slot) === slotIdx && card.color !== r.params.color)
          return false;
        if (
          r.type === 'SLOT_RANGE' &&
          Number(r.params.slot) === slotIdx &&
          (card.number < Number(r.params.min) || card.number > Number(r.params.max))
        )
          return false;
        if (
          r.type === 'SLOT_PARITY' &&
          Number(r.params.slot) === slotIdx &&
          (card.number % 2 === 0) !== (Number(r.params.even) === 1)
        )
          return false;
      }
      return true;
    });
  });

  const sumTotalRule = rules.find((r) => r.type === 'SUM_TOTAL' || r.type === 'AVG_EXACT');
  const sumTotalTarget = sumTotalRule
    ? sumTotalRule.type === 'AVG_EXACT'
      ? Number(sumTotalRule.params.avg) * 4
      : Number(sumTotalRule.params.target)
    : null;

  const twoSlotChecks = rules.filter(
    (r) =>
      r.type === 'SUM_PAIR_EXACT' ||
      r.type === 'DIFF_PAIR_EXACT' ||
      r.type === 'PRODUCT_PAIR_EXACT' ||
      r.type === 'PRODUCT_PAIR_MAX' ||
      r.type === 'PRODUCT_PAIR_MIN' ||
      r.type === 'RATIO_MULTIPLE' ||
      r.type === 'SLOT_GREATER'
  );

  const checkUpToSlot = (maxSlot: number, partial: SecretCard[]): boolean => {
    for (const r of twoSlotChecks) {
      const a = Number(r.params.a);
      const b = Number(r.params.b);
      if (a <= maxSlot && b <= maxSlot) {
        const va = partial[a].number;
        const vb = partial[b].number;
        if (r.type === 'SUM_PAIR_EXACT' && va + vb !== Number(r.params.target)) return false;
        if (r.type === 'DIFF_PAIR_EXACT' && va - vb !== Number(r.params.target)) return false;
        if (r.type === 'PRODUCT_PAIR_EXACT' && va * vb !== Number(r.params.target)) return false;
        if (r.type === 'PRODUCT_PAIR_MAX' && va * vb > Number(r.params.bound)) return false;
        if (r.type === 'PRODUCT_PAIR_MIN' && va * vb < Number(r.params.bound)) return false;
        if (r.type === 'RATIO_MULTIPLE' && va !== vb * Number(r.params.mult)) return false;
        if (r.type === 'SLOT_GREATER' && !(va > vb)) return false;
      }
    }
    return true;
  };

  const results: [number, number, number, number][] = [];

  for (const c1 of slotPools[0]) {
    for (const c2 of slotPools[1]) {
      if (c2.index === c1.index) continue;
      if (!checkUpToSlot(1, [c1, c2])) continue;

      for (const c3 of slotPools[2]) {
        if (c3.index === c1.index || c3.index === c2.index) continue;
        if (!checkUpToSlot(2, [c1, c2, c3])) continue;

        if (sumTotalTarget !== null) {
          const needed = sumTotalTarget - (c1.number + c2.number + c3.number);
          if (needed < 1 || needed > 26) continue;
        }

        for (const c4 of slotPools[3]) {
          if (c4.index === c1.index || c4.index === c2.index || c4.index === c3.index) continue;
          const tuple: [SecretCard, SecretCard, SecretCard, SecretCard] = [c1, c2, c3, c4];
          if (rules.every((r) => evaluateRule(r, tuple, stats))) {
            results.push([c1.index, c2.index, c3.index, c4.index]);
            if (results.length > maxKeep) return null;
          }
        }
      }
    }
  }

  return results;
}

export function countMatchingSolutions(
  cards: SecretCard[],
  rules: CipherRule[],
  stats: DeckStats,
  limit = 2
): number {
  const res = collectMatchingTuples(cards, rules, stats, limit - 1);
  return res === null ? limit : res.length;
}

/**
 * Generates a puzzle with 5–6 diverse, non-redundant rules where mathematical
 * and logical deduction yields EXACTLY ONE valid 4-card code across all 26 cards.
 */
export function generateUniqueSecretCodePuzzle(): GeneratedPuzzle {
  for (let attempt = 0; attempt < 35; attempt++) {
    const cards = generateRandomDeck();
    const stats = computeDeckStats(cards);

    const pool = Array.from({ length: 26 }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const secretIndices: [number, number, number, number] = [pool[0], pool[1], pool[2], pool[3]];
    const secretTuple: [SecretCard, SecretCard, SecretCard, SecretCard] = [
      cards[secretIndices[0]],
      cards[secretIndices[1]],
      cards[secretIndices[2]],
      cards[secretIndices[3]],
    ];

    const allCandidates = buildCandidateRulesForSolution(secretTuple, stats);

    // 1. Choose 2 strong, varied seed rules so the remaining tuple space is small (<15,000)
    //    and deliberately avoid repeating the exact same math rule type across rounds.
    const primaryMathPool = allCandidates.filter(
      (r) =>
        r.category === 'math' &&
        (r.type === 'SUM_PAIR_EXACT' ||
          r.type === 'DIFF_PAIR_EXACT' ||
          r.type === 'PRODUCT_PAIR_EXACT' ||
          r.type === 'RATIO_MULTIPLE' ||
          r.type === 'SUM_TOTAL' ||
          r.type === 'AVG_EXACT')
    );
    const freshMathPool = primaryMathPool.filter(
      (r) => !recentPrimaryMathTypes.includes(r.type)
    );
    const chosenMathPool = freshMathPool.length > 0 ? freshMathPool : primaryMathPool;
    const seedMath = chosenMathPool[Math.floor(Math.random() * chosenMathPool.length)];

    const anchorPool = allCandidates.filter(
      (r) => r.type === 'SLOT_COLOR' || r.type === 'SLOT_SHAPE' || r.type === 'SLOT_RANGE'
    );
    const seedAnchor = anchorPool[Math.floor(Math.random() * anchorPool.length)];

    if (!seedMath || !seedAnchor) continue;

    const selected: CipherRule[] = [seedMath, seedAnchor];
    const initialRemaining = collectMatchingTuples(cards, selected, stats, 18000);
    if (!initialRemaining || initialRemaining.length === 0) continue;
    let remaining: [number, number, number, number][] = initialRemaining;

    const usedTypes = new Set<RuleType>(selected.map((r) => r.type));
    const shuffled = [...allCandidates].sort(() => Math.random() - 0.5);

    // 2. Iteratively add non-redundant, diverse rules until 5-6 rules and remaining.length === 1
    while (selected.length < 6 && remaining.length > 1) {
      // Want variety first when we still have room (slots 3 and 4), then strong convergence for slots 5-6
      const needStrongConvergence = selected.length >= 4 || remaining.length > 150;

      // Score candidate rules on `remaining`
      const scored: { rule: CipherRule; nextRemaining: [number, number, number, number][] }[] = [];

      // Sample up to 32 unused candidates for fast evaluation
      let checked = 0;
      for (const cand of shuffled) {
        if (selected.some((s) => s.id === cand.id)) continue;
        // Avoid duplicating AVG_EXACT + SUM_TOTAL or stacking too many identical rule types
        if (cand.type === 'AVG_EXACT' && usedTypes.has('SUM_TOTAL')) continue;
        if (cand.type === 'SUM_TOTAL' && usedTypes.has('AVG_EXACT')) continue;

        const filtered = remaining.filter((idxTuple) => {
          const tuple: [SecretCard, SecretCard, SecretCard, SecretCard] = [
            cards[idxTuple[0]],
            cards[idxTuple[1]],
            cards[idxTuple[2]],
            cards[idxTuple[3]],
          ];
          return evaluateRule(cand, tuple, stats);
        });

        // Must strictly shrink the remaining solution space (no useless/redundant rules!)
        if (filtered.length < remaining.length && filtered.length >= 1) {
          // Don't collapse to 1 solution at rule 3 — keep at least 5 rules for a proper deduction puzzle
          if (selected.length < 4 && filtered.length === 1) continue;
          scored.push({ rule: cand, nextRemaining: filtered });
        }

        checked++;
        if (checked >= 36 && scored.length >= 8) break;
      }

      if (scored.length === 0) break;

      // Prefer unused categories / unused rule types, and pick a rule that shrinks well
      scored.sort((a, b) => {
        const aNewType = usedTypes.has(a.rule.type) ? 1 : 0;
        const bNewType = usedTypes.has(b.rule.type) ? 1 : 0;
        if (!needStrongConvergence && aNewType !== bNewType) return aNewType - bNewType;
        return a.nextRemaining.length - b.nextRemaining.length;
      });

      const pickPool = needStrongConvergence ? scored.slice(0, 2) : scored.slice(0, 4);
      const chosen = pickPool[Math.floor(Math.random() * pickPool.length)];
      selected.push(chosen.rule);
      usedTypes.add(chosen.rule.type);
      remaining = chosen.nextRemaining;
    }

    // If after 6 rules there are still 2..15 solutions, replace or add 1 strong closing rule to reach EXACTLY 1
    if (remaining.length > 1 && selected.length <= 6) {
      for (const cand of shuffled) {
        if (selected.some((s) => s.id === cand.id)) continue;
        const filtered = remaining.filter((idxTuple) => {
          const tuple: [SecretCard, SecretCard, SecretCard, SecretCard] = [
            cards[idxTuple[0]],
            cards[idxTuple[1]],
            cards[idxTuple[2]],
            cards[idxTuple[3]],
          ];
          return evaluateRule(cand, tuple, stats);
        });
        if (filtered.length === 1) {
          if (selected.length === 6) {
            // Try replacing the 3rd rule if still unique, otherwise keep 6 or 7
            const withoutThird = [...selected.slice(0, 2), ...selected.slice(3), cand];
            if (countMatchingSolutions(cards, withoutThird, stats, 2) === 1) {
              selected.splice(2, 1);
              selected.push(cand);
              remaining = filtered;
              break;
            }
          } else {
            selected.push(cand);
            remaining = filtered;
            break;
          }
        }
      }
    }

    // Double-check exact uniqueness across the full 26-card deck before returning!
    if (
      remaining.length === 1 &&
      selected.length >= 5 &&
      countMatchingSolutions(cards, selected, stats, 2) === 1
    ) {
      recentPrimaryMathTypes = [seedMath.type, ...recentPrimaryMathTypes].slice(0, 3);
      // Shuffle display order of rules so math/position/pattern clues mix naturally
      const displayRules = [...selected].sort(() => Math.random() - 0.5);
      return { cards, secretIndices, rules: displayRules };
    }
  }

  // Deterministic guaranteed-unique fallback (iterates until verified === 1)
  const cards = generateRandomDeck();
  const stats = computeDeckStats(cards);
  const secretIndices: [number, number, number, number] = [3, 14, 7, 21];
  const secretTuple: [SecretCard, SecretCard, SecretCard, SecretCard] = [
    cards[3],
    cards[14],
    cards[7],
    cards[21],
  ];
  const fallbackPool = buildCandidateRulesForSolution(secretTuple, stats);
  const rules: CipherRule[] = [];
  const seedIds = ['sum_total', 'prod_pair_0_1', 'prod_pair_2_3', 'slot_color_0', 'slot_shape_1', 'slot_gt_1_2'];
  for (const id of seedIds) {
    const r = fallbackPool.find((item) => item.id === id);
    if (r) rules.push(r);
  }
  for (const cand of fallbackPool) {
    if (countMatchingSolutions(cards, rules, stats, 2) === 1) break;
    if (!rules.some((r) => r.id === cand.id)) {
      rules.push(cand);
    }
  }
  return { cards, secretIndices, rules };
}

export function verifySecretCodeGuess(
  guessIndices: number[],
  secretIndices: number[],
  cards: SecretCard[],
  rules: CipherRule[]
): { isCorrect: boolean; ruleResults: { rule: CipherRule; passed: boolean }[] } {
  const stats = computeDeckStats(cards);
  const isUnique4 =
    guessIndices.length === 4 && new Set(guessIndices).size === 4;

  if (!isUnique4) {
    return {
      isCorrect: false,
      ruleResults: rules.map((rule) => ({ rule, passed: false })),
    };
  }

  const guessTuple: [SecretCard, SecretCard, SecretCard, SecretCard] = [
    cards[guessIndices[0]],
    cards[guessIndices[1]],
    cards[guessIndices[2]],
    cards[guessIndices[3]],
  ];

  const ruleResults = rules.map((rule) => ({
    rule,
    passed: evaluateRule(rule, guessTuple, stats),
  }));

  const exactMatch =
    guessIndices.length === 4 &&
    secretIndices.length === 4 &&
    guessIndices.every((val, idx) => val === secretIndices[idx]);

  const allRulesPassed = ruleResults.every((r) => r.passed);

  return {
    isCorrect: exactMatch || allRulesPassed,
    ruleResults,
  };
}
