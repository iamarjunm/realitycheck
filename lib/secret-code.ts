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
  | 'SUM_MIN_MAX'
  | 'RANGE_DIFF'
  | 'PRODUCT_1_4_MAX'
  | 'PRODUCT_1_4_MIN'
  | 'PRODUCT_2_3_EXACT'
  | 'ALL_COLORS_DIFF'
  | 'EXACT_COLOR_COUNT'
  | 'EXACT_SHAPE_COUNT'
  | 'ADJACENT_SHAPES_DIFF'
  | 'ADJACENT_COLORS_DIFF'
  | 'LOWEST_RAREST_COLOR'
  | 'HIGHEST_MOST_COMMON_SHAPE'
  | 'SLOT_SHAPE'
  | 'SLOT_COLOR'
  | 'SLOT_GREATER'
  | 'PARITY_EVEN_COUNT'
  | 'MAX_IN_SLOT'
  | 'MIN_IN_SLOT'
  | 'PRIME_COUNT'
  | 'FIRST_HALF_SUM_GT_SECOND';

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
  const colorWeights = CARD_COLORS.map(() => 0.4 + Math.random() * 1.4);
  const shapeWeights = CARD_SHAPES.map(() => 0.4 + Math.random() * 1.4);

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

    case 'SUM_MIN_MAX':
      return minNum + maxNum === Number(rule.params.target);

    case 'RANGE_DIFF':
      return maxNum - minNum === Number(rule.params.target);

    case 'PRODUCT_1_4_MAX':
      return c1.number * c4.number <= Number(rule.params.bound);

    case 'PRODUCT_1_4_MIN':
      return c1.number * c4.number >= Number(rule.params.bound);

    case 'PRODUCT_2_3_EXACT':
      return c2.number * c3.number === Number(rule.params.target);

    case 'ALL_COLORS_DIFF':
      return new Set([c1.color, c2.color, c3.color, c4.color]).size === 4;

    case 'EXACT_COLOR_COUNT':
      return new Set([c1.color, c2.color, c3.color, c4.color]).size === Number(rule.params.count);

    case 'EXACT_SHAPE_COUNT':
      return new Set([c1.shape, c2.shape, c3.shape, c4.shape]).size === Number(rule.params.count);

    case 'ADJACENT_SHAPES_DIFF':
      return c1.shape !== c2.shape && c2.shape !== c3.shape && c3.shape !== c4.shape;

    case 'ADJACENT_COLORS_DIFF':
      return c1.color !== c2.color && c2.color !== c3.color && c3.color !== c4.color;

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

    case 'SLOT_GREATER': {
      const a = Number(rule.params.a);
      const b = Number(rule.params.b);
      return guess[a].number > guess[b].number;
    }

    case 'PARITY_EVEN_COUNT': {
      const evens = nums.filter((n) => n % 2 === 0).length;
      return evens === Number(rule.params.count);
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

    case 'FIRST_HALF_SUM_GT_SECOND':
      return c1.number + c2.number > c3.number + c4.number;

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

  const candidates: CipherRule[] = [];

  candidates.push({
    id: 'sum_total',
    type: 'SUM_TOTAL',
    category: 'math',
    text: `The sum of all 4 card numbers is ${sum}.`,
    params: { target: sum },
  });

  candidates.push({
    id: 'sum_min_max',
    type: 'SUM_MIN_MAX',
    category: 'math',
    text: `The sum of the largest and smallest numbers in the code is ${minNum + maxNum}.`,
    params: { target: minNum + maxNum },
  });

  candidates.push({
    id: 'range_diff',
    type: 'RANGE_DIFF',
    category: 'math',
    text: `The difference between the largest and smallest numbers is ${maxNum - minNum}.`,
    params: { target: maxNum - minNum },
  });

  const prod14 = c1.number * c4.number;
  if (prod14 <= 60) {
    const bound = Math.min(65, prod14 + Math.floor(Math.random() * 8));
    candidates.push({
      id: 'prod_1_4_max',
      type: 'PRODUCT_1_4_MAX',
      category: 'math',
      text: `The product of the 1st and 4th card numbers is at most ${bound}.`,
      params: { bound },
    });
  } else {
    const bound = Math.max(40, prod14 - Math.floor(Math.random() * 12));
    candidates.push({
      id: 'prod_1_4_min',
      type: 'PRODUCT_1_4_MIN',
      category: 'math',
      text: `The product of the 1st and 4th card numbers is at least ${bound}.`,
      params: { bound },
    });
  }

  candidates.push({
    id: 'prod_2_3_exact',
    type: 'PRODUCT_2_3_EXACT',
    category: 'math',
    text: `The product of the 2nd and 3rd card numbers equals ${c2.number * c3.number}.`,
    params: { target: c2.number * c3.number },
  });

  candidates.push({
    id: 'parity_even',
    type: 'PARITY_EVEN_COUNT',
    category: 'math',
    text:
      evenCount === 0
        ? 'All 4 cards in the code have odd numbers.'
        : evenCount === 4
        ? 'All 4 cards in the code have even numbers.'
        : `Exactly ${evenCount} of the 4 cards ${evenCount === 1 ? 'has an' : 'have'} even number${evenCount === 1 ? '' : 's'}.`,
    params: { count: evenCount },
  });

  candidates.push({
    id: 'prime_count',
    type: 'PRIME_COUNT',
    category: 'math',
    text:
      primeCount === 0
        ? 'None of the 4 cards has a prime number.'
        : `Exactly ${primeCount} of the 4 cards ${primeCount === 1 ? 'is' : 'are'} prime numbers.`,
    params: { count: primeCount },
  });

  if (c1.number + c2.number > c3.number + c4.number) {
    candidates.push({
      id: 'half_sum_gt',
      type: 'FIRST_HALF_SUM_GT_SECOND',
      category: 'math',
      text: 'The sum of the 1st and 2nd cards is greater than the sum of the 3rd and 4th cards.',
      params: {},
    });
  }

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
        : `Exactly ${distinctShapes} distinct shape${distinctShapes === 1 ? '' : 's'} appear in the 4-card code.`,
    params: { count: distinctShapes },
  });

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

  const lowestCard = secret.reduce((low, curr) => (curr.number < low.number ? curr : low), c1);
  if (stats.rarestColors.includes(lowestCard.color)) {
    candidates.push({
      id: 'lowest_rarest_color',
      type: 'LOWEST_RAREST_COLOR',
      category: 'frequency',
      text:
        stats.rarestColors.length === 1
          ? 'The lowest-numbered card in the code has the color that appears least often across A–Z.'
          : 'The lowest-numbered card in the code has one of the least frequent colors across A–Z.',
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

  const slotNames = ['1st', '2nd', '3rd', '4th'];
  for (let s = 0; s < 4; s++) {
    candidates.push({
      id: `slot_shape_${s}`,
      type: 'SLOT_SHAPE',
      category: 'position',
      text: `The ${slotNames[s]} card is a ${SHAPE_LABELS[secret[s].shape]}.`,
      params: { slot: s, shape: secret[s].shape },
    });
    candidates.push({
      id: `slot_color_${s}`,
      type: 'SLOT_COLOR',
      category: 'position',
      text: `The ${slotNames[s]} card is ${COLOR_LABELS[secret[s].color]}.`,
      params: { slot: s, color: secret[s].color },
    });
    if (secret[s].number === maxNum) {
      candidates.push({
        id: `max_slot_${s}`,
        type: 'MAX_IN_SLOT',
        category: 'position',
        text: `The largest number in the code sits in the ${slotNames[s]} slot.`,
        params: { slot: s },
      });
    }
    if (secret[s].number === minNum) {
      candidates.push({
        id: `min_slot_${s}`,
        type: 'MIN_IN_SLOT',
        category: 'position',
        text: `The smallest number in the code sits in the ${slotNames[s]} slot.`,
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
          text: `The ${slotNames[a]} card's letter/number comes after the ${slotNames[b]} card's.`,
          params: { a, b },
        });
      }
    }
  }

  return candidates;
}

export function countMatchingSolutions(
  cards: SecretCard[],
  rules: CipherRule[],
  stats: DeckStats,
  limit = 2
): number {
  const slotPools: SecretCard[][] = [0, 1, 2, 3].map((slotIdx) => {
    const unaryRules = rules.filter(
      (r) =>
        (r.type === 'SLOT_SHAPE' && Number(r.params.slot) === slotIdx) ||
        (r.type === 'SLOT_COLOR' && Number(r.params.slot) === slotIdx)
    );
    if (unaryRules.length === 0) return cards;
    return cards.filter((card) =>
      unaryRules.every((r) =>
        r.type === 'SLOT_SHAPE' ? card.shape === r.params.shape : card.color === r.params.color
      )
    );
  });

  const adjShapeRule = rules.some((r) => r.type === 'ADJACENT_SHAPES_DIFF');
  const adjColorRule = rules.some((r) => r.type === 'ADJACENT_COLORS_DIFF');
  const allColorsDiffRule = rules.some((r) => r.type === 'ALL_COLORS_DIFF');
  const exactShapeRule = rules.find((r) => r.type === 'EXACT_SHAPE_COUNT');
  const exactShapeTarget = exactShapeRule ? Number(exactShapeRule.params.count) : null;
  const prod14Max = rules.find((r) => r.type === 'PRODUCT_1_4_MAX');
  const prod14Min = rules.find((r) => r.type === 'PRODUCT_1_4_MIN');
  const prod23Exact = rules.find((r) => r.type === 'PRODUCT_2_3_EXACT');
  const sumTotalRule = rules.find((r) => r.type === 'SUM_TOTAL');
  const sumTotalTarget = sumTotalRule ? Number(sumTotalRule.params.target) : null;

  const gtConstraints = rules
    .filter((r) => r.type === 'SLOT_GREATER')
    .map((r) => [Number(r.params.a), Number(r.params.b)] as [number, number]);

  let count = 0;

  for (const c1 of slotPools[0]) {
    for (const c2 of slotPools[1]) {
      if (c2.index === c1.index) continue;
      if (adjShapeRule && c1.shape === c2.shape) continue;
      if ((adjColorRule || allColorsDiffRule) && c1.color === c2.color) continue;
      if (exactShapeTarget === 4 && c1.shape === c2.shape) continue;

      let gtOk2 = true;
      for (const [a, b] of gtConstraints) {
        if (a <= 1 && b <= 1) {
          const va = a === 0 ? c1.number : c2.number;
          const vb = b === 0 ? c1.number : c2.number;
          if (!(va > vb)) {
            gtOk2 = false;
            break;
          }
        }
      }
      if (!gtOk2) continue;

      for (const c3 of slotPools[2]) {
        if (c3.index === c1.index || c3.index === c2.index) continue;
        if (adjShapeRule && c2.shape === c3.shape) continue;
        if (adjColorRule && c2.color === c3.color) continue;
        if (allColorsDiffRule && (c3.color === c1.color || c3.color === c2.color)) continue;
        if (exactShapeTarget === 4 && (c3.shape === c1.shape || c3.shape === c2.shape)) continue;
        if (prod23Exact && c2.number * c3.number !== Number(prod23Exact.params.target)) continue;

        let gtOk3 = true;
        for (const [a, b] of gtConstraints) {
          if (a <= 2 && b <= 2) {
            const nums3 = [c1.number, c2.number, c3.number];
            if (!(nums3[a] > nums3[b])) {
              gtOk3 = false;
              break;
            }
          }
        }
        if (!gtOk3) continue;

        if (sumTotalTarget !== null) {
          const needed = sumTotalTarget - (c1.number + c2.number + c3.number);
          if (needed < 1 || needed > 26) continue;
        }

        for (const c4 of slotPools[3]) {
          if (c4.index === c1.index || c4.index === c2.index || c4.index === c3.index) continue;
          if (sumTotalTarget !== null && c1.number + c2.number + c3.number + c4.number !== sumTotalTarget)
            continue;
          if (prod14Max && c1.number * c4.number > Number(prod14Max.params.bound)) continue;
          if (prod14Min && c1.number * c4.number < Number(prod14Min.params.bound)) continue;

          const tuple: [SecretCard, SecretCard, SecretCard, SecretCard] = [c1, c2, c3, c4];
          if (rules.every((r) => evaluateRule(r, tuple, stats))) {
            count++;
            if (count >= limit) return count;
          }
        }
      }
    }
  }

  return count;
}

export function generateUniqueSecretCodePuzzle(): GeneratedPuzzle {
  for (let attempt = 0; attempt < 25; attempt++) {
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
    const shuffled = [...allCandidates].sort(() => Math.random() - 0.5);

    const selected: CipherRule[] = [];
    const pickByCategory = (cat: CipherRule['category'], preferIds?: string[]) => {
      if (preferIds) {
        const preferred = shuffled.find(
          (r) => r.category === cat && preferIds.includes(r.id) && !selected.includes(r)
        );
        if (preferred) {
          selected.push(preferred);
          return;
        }
      }
      const found = shuffled.find((r) => r.category === cat && !selected.includes(r));
      if (found) selected.push(found);
    };

    pickByCategory('frequency');
    pickByCategory('colors_shapes', ['all_colors_diff', 'exact_shape_count', 'exact_color_count']);
    pickByCategory('math', ['sum_min_max', 'prod_1_4_max', 'prod_1_4_min', 'sum_total']);
    pickByCategory('position', ['max_slot_0', 'max_slot_1', 'max_slot_2', 'max_slot_3', 'min_slot_0', 'min_slot_1', 'min_slot_2', 'min_slot_3']);

    while (selected.length < 6) {
      const currentCount = countMatchingSolutions(cards, selected, stats, 2);
      if (currentCount === 1 && selected.length >= 5) {
        return { cards, secretIndices, rules: selected };
      }

      let added = false;
      const highSignalPriority = [
        'sum_total',
        'prod_2_3_exact',
        'sum_min_max',
        'range_diff',
        'slot_shape_0',
        'slot_shape_1',
        'slot_shape_2',
        'slot_shape_3',
        'slot_color_0',
        'slot_color_1',
        'slot_color_2',
        'slot_color_3',
      ];
      for (const id of highSignalPriority) {
        const rule = shuffled.find((r) => r.id === id && !selected.includes(r));
        if (rule) {
          selected.push(rule);
          added = true;
          break;
        }
      }
      if (!added) {
        const nextRule = shuffled.find((r) => !selected.includes(r));
        if (!nextRule) break;
        selected.push(nextRule);
      }
    }

    if (countMatchingSolutions(cards, selected, stats, 2) === 1) {
      return { cards, secretIndices, rules: selected };
    }
  }

  const cards = generateRandomDeck();
  const stats = computeDeckStats(cards);
  const secretIndices: [number, number, number, number] = [2, 17, 8, 22];
  const secretTuple: [SecretCard, SecretCard, SecretCard, SecretCard] = [
    cards[2],
    cards[17],
    cards[8],
    cards[22],
  ];
  const fallbackPool = buildCandidateRulesForSolution(secretTuple, stats);
  const rules: CipherRule[] = [];
  const mustIds = ['sum_total', 'prod_2_3_exact', 'sum_min_max', 'slot_color_0', 'slot_shape_3', 'slot_gt_1_2'];
  for (const id of mustIds) {
    const r = fallbackPool.find((item) => item.id === id);
    if (r) rules.push(r);
  }
  while (rules.length < 5 && fallbackPool.length > rules.length) {
    const next = fallbackPool.find((r) => !rules.includes(r));
    if (next) rules.push(next);
    else break;
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
