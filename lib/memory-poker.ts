export const POSITIONS = [
  'A', 'B', 'C', 'D',
  'E', 'F', 'G', 'H',
  'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P',
] as const;

export type PositionLabel = (typeof POSITIONS)[number];

export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export type BotDifficulty = 'casual' | 'sharp' | 'master';

export interface ParsedCard {
  id: string;
  rankStr: Rank;
  rank: number; // 2..14
  suit: Suit;
  isRed: boolean;
}

export interface HandEvaluation {
  score: number;
  category: number; // 0..9
  name: string;
  detail: string;
}

export const HAND_RANKINGS_GUIDE = [
  { name: 'Royal Flush', desc: 'A, K, Q, J, 10 of the same suit', example: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠'] },
  { name: 'Straight Flush', desc: 'Five sequential cards of the same suit', example: ['9♥', '8♥', '7♥', '6♥', '5♥'] },
  { name: 'Four of a Kind', desc: 'Four cards of matching rank', example: ['K♠', 'K♥', 'K♦', 'K♣', '9♠'] },
  { name: 'Full House', desc: 'Three of a kind plus a pair', example: ['Q♠', 'Q♥', 'Q♦', '7♣', '7♠'] },
  { name: 'Flush', desc: 'Any five cards of the same suit', example: ['A♦', 'J♦', '8♦', '5♦', '2♦'] },
  { name: 'Straight', desc: 'Five sequential cards of mixed suits', example: ['10♣', '9♦', '8♥', '7♠', '6♣'] },
  { name: 'Three of a Kind', desc: 'Three cards of matching rank', example: ['J♠', 'J♥', 'J♦', 'A♣', '4♠'] },
  { name: 'Two Pair', desc: 'Two different pairs plus a kicker', example: ['10♠', '10♥', '6♦', '6♣', 'A♠'] },
  { name: 'One Pair', desc: 'Two cards of matching rank', example: ['A♠', 'A♥', 'K♦', '9♣', '3♠'] },
  { name: 'High Card', desc: 'Highest single card when no combo forms', example: ['A♣', 'K♦', '9♥', '6♠', '2♣'] },
];

export function buildShuffledDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealMemoryPokerRound(): { gridCards: string[]; communityCards: string[] } {
  const deck = buildShuffledDeck();
  const gridCards = deck.slice(0, 16);
  const communityCards = deck.slice(16, 19);
  return { gridCards, communityCards };
}

export function parseCard(cardId: string): ParsedCard {
  const suit = cardId.slice(-1) as Suit;
  const rankStr = cardId.slice(0, -1) as Rank;
  const rank =
    rankStr === 'A' ? 14 :
    rankStr === 'K' ? 13 :
    rankStr === 'Q' ? 12 :
    rankStr === 'J' ? 11 :
    parseInt(rankStr, 10);
  return {
    id: cardId,
    rankStr,
    rank,
    suit,
    isRed: suit === '♥' || suit === '♦',
  };
}

function rankLabel(rank: number, plural = false): string {
  const base =
    rank === 14 ? 'Ace' :
    rank === 13 ? 'King' :
    rank === 12 ? 'Queen' :
    rank === 11 ? 'Jack' :
    String(rank);
  if (!plural) return base;
  return rank === 6 ? 'Sixes' : `${base}s`;
}

export function evaluateFiveCardHand(cards: string[]): HandEvaluation {
  if (cards.length !== 5) {
    return { score: 0, category: -1, name: 'Incomplete', detail: 'Select 2 memory cards' };
  }

  const parsed = cards.map(parseCard).sort((a, b) => b.rank - a.rank);
  const rankCounts = new Map<number, number>();
  const suitCounts = new Map<Suit, number>();

  for (const c of parsed) {
    rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1);
    suitCounts.set(c.suit, (suitCounts.get(c.suit) || 0) + 1);
  }

  const isFlush = suitCounts.size === 1;

  const uniqueRanks = Array.from(rankCounts.keys()).sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;

  if (uniqueRanks.length === 5) {
    if (uniqueRanks[0] - uniqueRanks[4] === 4) {
      isStraight = true;
      straightHigh = uniqueRanks[0];
    } else if (
      uniqueRanks[0] === 14 &&
      uniqueRanks[1] === 5 &&
      uniqueRanks[2] === 4 &&
      uniqueRanks[3] === 3 &&
      uniqueRanks[4] === 2
    ) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  const freq = Array.from(rankCounts.entries())
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  let category = 0;
  let name = 'High Card';
  let detail = `${rankLabel(parsed[0].rank)} High`;

  if (isStraight && isFlush) {
    if (straightHigh === 14) {
      category = 9;
      name = 'Royal Flush';
      detail = 'Ace-High Straight Flush';
    } else {
      category = 8;
      name = 'Straight Flush';
      detail = `${rankLabel(straightHigh)} High`;
    }
  } else if (freq[0].count === 4) {
    category = 7;
    name = 'Four of a Kind';
    detail = `${rankLabel(freq[0].rank, true)}`;
  } else if (freq[0].count === 3 && freq[1].count === 2) {
    category = 6;
    name = 'Full House';
    detail = `${rankLabel(freq[0].rank, true)} full of ${rankLabel(freq[1].rank, true)}`;
  } else if (isFlush) {
    category = 5;
    name = 'Flush';
    detail = `${rankLabel(parsed[0].rank)} High`;
  } else if (isStraight) {
    category = 4;
    name = 'Straight';
    detail = `${rankLabel(straightHigh)} High`;
  } else if (freq[0].count === 3) {
    category = 3;
    name = 'Three of a Kind';
    detail = `Trip ${rankLabel(freq[0].rank, true)}`;
  } else if (freq[0].count === 2 && freq[1].count === 2) {
    category = 2;
    name = 'Two Pair';
    detail = `${rankLabel(freq[0].rank, true)} & ${rankLabel(freq[1].rank, true)}`;
  } else if (freq[0].count === 2) {
    category = 1;
    name = 'Pair';
    detail = `Pair of ${rankLabel(freq[0].rank, true)}`;
  }

  let tieRanks: number[];
  if (isStraight) {
    tieRanks = [straightHigh, 0, 0, 0, 0];
  } else {
    tieRanks = [];
    for (const f of freq) {
      for (let k = 0; k < f.count; k++) {
        tieRanks.push(f.rank);
      }
    }
  }

  let score = category * 1_000_000_000;
  let weight = 15 ** 4;
  for (let i = 0; i < 5; i++) {
    score += (tieRanks[i] || 0) * weight;
    weight = Math.floor(weight / 15);
  }

  return { score, category, name, detail };
}

export function findBestBoardCombination(
  communityCards: string[],
  gridCards: string[]
): { indices: [number, number]; evaluation: HandEvaluation } {
  let bestIndices: [number, number] = [0, 1];
  let bestEval: HandEvaluation = { score: -1, category: -1, name: 'High Card', detail: '' };

  for (let i = 0; i < gridCards.length; i++) {
    for (let j = i + 1; j < gridCards.length; j++) {
      const ev = evaluateFiveCardHand([...communityCards, gridCards[i], gridCards[j]]);
      if (ev.score > bestEval.score) {
        bestEval = ev;
        bestIndices = [i, j];
      }
    }
  }

  return { indices: bestIndices, evaluation: bestEval };
}

export function pickBotMemoryPositions(
  communityCards: string[],
  gridCards: string[],
  difficulty: BotDifficulty
): [number, number] {
  const recallCount =
    difficulty === 'master' ? 14 :
    difficulty === 'sharp' ? 10 :
    6;

  const allIndices = Array.from({ length: 16 }, (_, idx) => idx);
  for (let i = allIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
  }

  const remembered = allIndices.slice(0, recallCount);
  const forgotten = allIndices.slice(recallCount);

  let bestPair: [number, number] = [remembered[0], remembered[1]];
  let bestScore = -1;

  for (let a = 0; a < remembered.length; a++) {
    for (let b = a + 1; b < remembered.length; b++) {
      const idxA = remembered[a];
      const idxB = remembered[b];
      const ev = evaluateFiveCardHand([...communityCards, gridCards[idxA], gridCards[idxB]]);
      if (ev.score > bestScore) {
        bestScore = ev.score;
        bestPair = [idxA, idxB];
      }
    }
  }

  if (difficulty === 'casual' && bestScore < 1_000_000_000 && forgotten.length > 0) {
    const guessIdx = forgotten[Math.floor(Math.random() * forgotten.length)];
    bestPair = [bestPair[0], guessIdx];
  }

  return bestPair[0] < bestPair[1] ? bestPair : [bestPair[1], bestPair[0]];
}
