export type VaultProtocol = 'none' | 'double' | 'invert';

export interface VaultPlayer {
  uid: string;
  sessionId: string;
  nickname: string;
  isBot?: boolean;
  credits: number;
  score: number;
  hasDouble: boolean;
  hasInvert: boolean;
  currentBid: number | null;
  currentProtocol: VaultProtocol;
  locked: boolean;
}

export interface VaultRoundLog {
  round: number;
  vaultValue: number;
  p0Bid: number;
  p1Bid: number;
  p0Proto: VaultProtocol;
  p1Proto: VaultProtocol;
  p0Eff: number;
  p1Eff: number;
  inverted: boolean;
  winnerIdx: 0 | 1 | -1; // who received the vault (positive or trap)
  summary: string;
}

export interface BlindVaultState {
  gameId?: string;
  mode: 'solo' | 'multi';
  creatorId: string;
  state: 'waiting' | 'bidding' | 'reveal' | 'finished';
  round: number; // 1..7
  vaultDeck: number[]; // length 7
  players: VaultPlayer[];
  history: VaultRoundLog[];
  winnerUid: string | null;
  createdAt?: number;
}

export const STARTING_CREDITS = 100;

export function buildVaultDeck(): number[] {
  const vals = [2, 3, 4, 5, 6, 7, -3];
  for (let i = vals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [vals[i], vals[j]] = [vals[j], vals[i]];
  }
  return vals;
}

export function resolveVaultRound(
  round: number,
  vaultValue: number,
  p0: VaultPlayer,
  p1: VaultPlayer
): { nextP0: VaultPlayer; nextP1: VaultPlayer; log: VaultRoundLog } {
  const b0 = Math.max(0, Math.min(p0.credits, p0.currentBid ?? 0));
  const b1 = Math.max(0, Math.min(p1.credits, p1.currentBid ?? 0));
  const pr0: VaultProtocol =
    p0.currentProtocol === 'double' && p0.hasDouble
      ? 'double'
      : p0.currentProtocol === 'invert' && p0.hasInvert
      ? 'invert'
      : 'none';
  const pr1: VaultProtocol =
    p1.currentProtocol === 'double' && p1.hasDouble
      ? 'double'
      : p1.currentProtocol === 'invert' && p1.hasInvert
      ? 'invert'
      : 'none';

  const eff0 = pr0 === 'double' ? b0 * 2 : b0;
  const eff1 = pr1 === 'double' ? b1 * 2 : b1;
  const inverted = (pr0 === 'invert') !== (pr1 === 'invert');

  let recipientIdx: 0 | 1 | -1 = -1;
  if (eff0 !== eff1) {
    if (vaultValue >= 0) {
      // Positive vault: normally highest wins; if inverted, lowest wins!
      if (!inverted) recipientIdx = eff0 > eff1 ? 0 : 1;
      else recipientIdx = eff0 < eff1 ? 0 : 1;
    } else {
      // Trap vault (-3): normally lowest eats the trap; if inverted, highest eats the trap!
      if (!inverted) recipientIdx = eff0 < eff1 ? 0 : 1;
      else recipientIdx = eff0 > eff1 ? 0 : 1;
    }
  }

  let s0 = p0.score;
  let s1 = p1.score;
  if (recipientIdx === 0) s0 += vaultValue;
  if (recipientIdx === 1) s1 += vaultValue;

  const summary =
    recipientIdx === -1
      ? `TIE (${eff0} vs ${eff1}) — Vault ${vaultValue > 0 ? `+${vaultValue}` : vaultValue} vaporized!`
      : vaultValue >= 0
      ? `${recipientIdx === 0 ? p0.nickname : p1.nickname} claimed +${vaultValue} PTS${inverted ? ' via INVERT!' : '!'}`
      : `${recipientIdx === 0 ? p0.nickname : p1.nickname} ate the ${vaultValue} TRAP${inverted ? ' via INVERT!' : '!'}`;

  return {
    nextP0: {
      ...p0,
      credits: p0.credits - b0,
      score: s0,
      hasDouble: p0.hasDouble && pr0 !== 'double',
      hasInvert: p0.hasInvert && pr0 !== 'invert',
      currentBid: b0,
      currentProtocol: pr0,
      locked: false,
    },
    nextP1: {
      ...p1,
      credits: p1.credits - b1,
      score: s1,
      hasDouble: p1.hasDouble && pr1 !== 'double',
      hasInvert: p1.hasInvert && pr1 !== 'invert',
      currentBid: b1,
      currentProtocol: pr1,
      locked: false,
    },
    log: {
      round,
      vaultValue,
      p0Bid: b0,
      p1Bid: b1,
      p0Proto: pr0,
      p1Proto: pr1,
      p0Eff: eff0,
      p1Eff: eff1,
      inverted,
      winnerIdx: recipientIdx,
      summary,
    },
  };
}

export function pickBotVaultMove(
  bot: VaultPlayer,
  vaultValue: number,
  roundsLeft: number
): { bid: number; protocol: VaultProtocol } {
  if (bot.credits <= 0) {
    if (bot.hasInvert && vaultValue >= 5 && Math.random() < 0.7) {
      return { bid: 0, protocol: 'invert' };
    }
    return { bid: 0, protocol: 'none' };
  }

  // Sneaky Invert play on big positive vault!
  if (bot.hasInvert && vaultValue >= 6 && Math.random() < 0.45) {
    return { bid: Math.min(bot.credits, Math.floor(Math.random() * 4)), protocol: 'invert' };
  }

  // Trap vault (-3)
  if (vaultValue < 0) {
    if (bot.hasInvert && Math.random() < 0.4) {
      return { bid: 0, protocol: 'invert' };
    }
    const base = Math.min(bot.credits, Math.max(5, Math.floor(bot.credits / Math.max(2, roundsLeft)) - 3 + Math.floor(Math.random() * 10)));
    return { bid: base, protocol: 'none' };
  }

  const avgBudget = bot.credits / Math.max(1, roundsLeft);
  const weight = vaultValue / 4.5;
  let bid = Math.round(avgBudget * weight + (Math.random() - 0.5) * 10);
  bid = Math.max(0, Math.min(bot.credits, bid));

  let protocol: VaultProtocol = 'none';
  if (bot.hasDouble && vaultValue >= 5 && bid >= 10 && Math.random() < 0.5) {
    protocol = 'double';
  }
  return { bid, protocol };
}
