export type PlayerIndex = 0 | 1;

export const GRID_SIZE = 4;
export const TOTAL_CELLS = 16;
export const INITIAL_HAND: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8];
export const LINE_CONTROL_BONUS = 5;
export const MAX_CORE_VALUE = 9;

export interface MatrixCell {
  owner: PlayerIndex;
  value: number; // 1..9 (1..8 base, up to 9 via Exact-10 Overload)
  overloaded: boolean;
  placedTurn: number;
}

export interface QuantumPlayer {
  uid: string;
  sessionId: string;
  nickname: string;
  isBot: boolean;
  hand: number[];
  invertLeft: number;
}

export interface TacticalLogEntry {
  turn: number;
  actor: PlayerIndex;
  actorName: string;
  cellIdx: number;
  playedValue: number;
  finalValue: number;
  usedInvert: boolean;
  outflanked: number[];
  hijacked: number[];
  overloaded: boolean;
  summary: string;
}

export interface QuantumMatrixGame {
  gameId?: string;
  mode: 'solo' | 'multi';
  creatorId: string;
  state: 'waiting' | 'playing' | 'finished';
  turnIdx: PlayerIndex;
  turnCount: number; // 0..16
  board: (MatrixCell | null)[]; // length 16
  ampCells: number[]; // 2 non-overlapping symmetric indices
  players: QuantumPlayer[];
  lastMove: TacticalLogEntry | null;
  logs: TacticalLogEntry[];
  winnerIdx: PlayerIndex | 'tie' | null;
  winnerUid: string | null;
  createdAt: number;
}

export interface LineScore {
  p0: number;
  p1: number;
  leader: PlayerIndex | null;
}

export interface PlayerScoreDetail {
  basePoints: number;
  ampBonus: number;
  cellPoints: number; // basePoints + ampBonus
  lineBonus: number;
  linesWon: number;
  total: number;
  cellCount: number;
}

export interface MatrixScoreBreakdown {
  p0: PlayerScoreDetail;
  p1: PlayerScoreDetail;
  rows: LineScore[];
  cols: LineScore[];
}

export interface PreviewFlip {
  cellIdx: number;
  type: 'outflank' | 'hijack';
  prevValue: number;
}

export interface PlacementPreview {
  valid: boolean;
  cellIdx: number;
  playedValue: number;
  finalValue: number;
  overloaded: boolean;
  flips: PreviewFlip[];
  outflanked: number[];
  hijacked: number[];
  isAmpCell: boolean;
  scoreBefore: MatrixScoreBreakdown;
  scoreAfter: MatrixScoreBreakdown;
  netSwing: number; // change in (actorTotal - oppTotal)
  actorGain: number; // change in actorTotal
}

const SYMMETRIC_AMP_PAIRS: readonly [number, number][] = [
  [0, 15],
  [3, 12],
  [1, 14],
  [2, 13],
  [4, 11],
  [7, 8],
  [5, 10],
  [6, 9],
];

const COL_LABELS = ['A', 'B', 'C', 'D'] as const;

export function generateAmpCells(): number[] {
  const pair = SYMMETRIC_AMP_PAIRS[Math.floor(Math.random() * SYMMETRIC_AMP_PAIRS.length)];
  return [pair[0], pair[1]];
}

export function createEmptyBoard(): (MatrixCell | null)[] {
  return Array.from({ length: TOTAL_CELLS }, () => null);
}

export function createInitialPlayer(params: {
  uid: string;
  sessionId: string;
  nickname: string;
  isBot?: boolean;
}): QuantumPlayer {
  return {
    uid: params.uid,
    sessionId: params.sessionId,
    nickname: params.nickname.trim().slice(0, 14) || (params.isBot ? 'MINIMAX-AI' : 'Operator'),
    isBot: Boolean(params.isBot),
    hand: [...INITIAL_HAND],
    invertLeft: 1,
  };
}

export function coordLabel(idx: number): string {
  const row = Math.floor(idx / GRID_SIZE);
  const col = idx % GRID_SIZE;
  return `${COL_LABELS[col] ?? 'A'}${row + 1}`;
}

export function getOrthogonalNeighbors(idx: number): number[] {
  const row = Math.floor(idx / GRID_SIZE);
  const col = idx % GRID_SIZE;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push((row - 1) * GRID_SIZE + col);
  if (row < GRID_SIZE - 1) neighbors.push((row + 1) * GRID_SIZE + col);
  if (col > 0) neighbors.push(row * GRID_SIZE + (col - 1));
  if (col < GRID_SIZE - 1) neighbors.push(row * GRID_SIZE + (col + 1));
  return neighbors;
}

export function computeScores(
  board: (MatrixCell | null)[],
  ampCells: number[]
): MatrixScoreBreakdown {
  const ampSet = new Set(ampCells);

  let p0Base = 0;
  let p0Amp = 0;
  let p0Cells = 0;
  let p1Base = 0;
  let p1Amp = 0;
  let p1Cells = 0;

  const rows: LineScore[] = Array.from({ length: GRID_SIZE }, () => ({
    p0: 0,
    p1: 0,
    leader: null,
  }));
  const cols: LineScore[] = Array.from({ length: GRID_SIZE }, () => ({
    p0: 0,
    p1: 0,
    leader: null,
  }));

  for (let idx = 0; idx < TOTAL_CELLS; idx++) {
    const cell = board[idx];
    if (!cell) continue;
    const row = Math.floor(idx / GRID_SIZE);
    const col = idx % GRID_SIZE;
    const isAmp = ampSet.has(idx);
    const ampExtra = isAmp ? cell.value : 0;

    if (cell.owner === 0) {
      p0Base += cell.value;
      p0Amp += ampExtra;
      p0Cells += 1;
      rows[row].p0 += cell.value;
      cols[col].p0 += cell.value;
    } else {
      p1Base += cell.value;
      p1Amp += ampExtra;
      p1Cells += 1;
      rows[row].p1 += cell.value;
      cols[col].p1 += cell.value;
    }
  }

  let p0Lines = 0;
  let p1Lines = 0;

  for (const line of rows) {
    if (line.p0 > line.p1) {
      line.leader = 0;
      p0Lines += 1;
    } else if (line.p1 > line.p0) {
      line.leader = 1;
      p1Lines += 1;
    }
  }

  for (const line of cols) {
    if (line.p0 > line.p1) {
      line.leader = 0;
      p0Lines += 1;
    } else if (line.p1 > line.p0) {
      line.leader = 1;
      p1Lines += 1;
    }
  }

  const p0CellPoints = p0Base + p0Amp;
  const p1CellPoints = p1Base + p1Amp;
  const p0LineBonus = p0Lines * LINE_CONTROL_BONUS;
  const p1LineBonus = p1Lines * LINE_CONTROL_BONUS;

  return {
    p0: {
      basePoints: p0Base,
      ampBonus: p0Amp,
      cellPoints: p0CellPoints,
      lineBonus: p0LineBonus,
      linesWon: p0Lines,
      total: p0CellPoints + p0LineBonus,
      cellCount: p0Cells,
    },
    p1: {
      basePoints: p1Base,
      ampBonus: p1Amp,
      cellPoints: p1CellPoints,
      lineBonus: p1LineBonus,
      linesWon: p1Lines,
      total: p1CellPoints + p1LineBonus,
      cellCount: p1Cells,
    },
    rows,
    cols,
  };
}

export function previewPlacement(
  board: (MatrixCell | null)[],
  cellIdx: number,
  playedValue: number,
  actor: PlayerIndex,
  useInvert: boolean,
  ampCells: number[]
): PlacementPreview {
  const scoreBefore = computeScores(board, ampCells);
  const isAmpCell = ampCells.includes(cellIdx);

  if (cellIdx < 0 || cellIdx >= TOTAL_CELLS || board[cellIdx] !== null) {
    return {
      valid: false,
      cellIdx,
      playedValue,
      finalValue: playedValue,
      overloaded: false,
      flips: [],
      outflanked: [],
      hijacked: [],
      isAmpCell,
      scoreBefore,
      scoreAfter: scoreBefore,
      netSwing: 0,
      actorGain: 0,
    };
  }

  const neighbors = getOrthogonalNeighbors(cellIdx);
  const flips: PreviewFlip[] = [];
  const outflanked: number[] = [];
  const hijacked: number[] = [];

  for (const nIdx of neighbors) {
    const neighbor = board[nIdx];
    if (!neighbor || neighbor.owner === actor) continue;

    if (playedValue + neighbor.value === 10) {
      flips.push({ cellIdx: nIdx, type: 'hijack', prevValue: neighbor.value });
      hijacked.push(nIdx);
    } else if (useInvert ? neighbor.value > playedValue : neighbor.value < playedValue) {
      flips.push({ cellIdx: nIdx, type: 'outflank', prevValue: neighbor.value });
      outflanked.push(nIdx);
    }
  }

  const overloaded = hijacked.length > 0 && playedValue < MAX_CORE_VALUE;
  const finalValue = overloaded ? Math.min(MAX_CORE_VALUE, playedValue + 1) : playedValue;

  const nextBoard = board.map((c) => (c ? { ...c } : null));
  nextBoard[cellIdx] = {
    owner: actor,
    value: finalValue,
    overloaded,
    placedTurn: 0,
  };
  for (const flip of flips) {
    const target = nextBoard[flip.cellIdx];
    if (target) {
      nextBoard[flip.cellIdx] = { ...target, owner: actor };
    }
  }

  const scoreAfter = computeScores(nextBoard, ampCells);
  const actorBefore = actor === 0 ? scoreBefore.p0.total : scoreBefore.p1.total;
  const oppBefore = actor === 0 ? scoreBefore.p1.total : scoreBefore.p0.total;
  const actorAfter = actor === 0 ? scoreAfter.p0.total : scoreAfter.p1.total;
  const oppAfter = actor === 0 ? scoreAfter.p1.total : scoreAfter.p0.total;

  return {
    valid: true,
    cellIdx,
    playedValue,
    finalValue,
    overloaded,
    flips,
    outflanked,
    hijacked,
    isAmpCell,
    scoreBefore,
    scoreAfter,
    netSwing: actorAfter - oppAfter - (actorBefore - oppBefore),
    actorGain: actorAfter - actorBefore,
  };
}

export function applyMove(
  game: QuantumMatrixGame,
  cellIdx: number,
  playedValue: number,
  useInvert: boolean
): QuantumMatrixGame | null {
  if (game.state !== 'playing') return null;
  if (cellIdx < 0 || cellIdx >= TOTAL_CELLS || game.board[cellIdx] !== null) return null;

  const actor = game.turnIdx;
  const currentPlayer = game.players[actor];
  if (!currentPlayer) return null;

  const cardIndex = currentPlayer.hand.indexOf(playedValue);
  if (cardIndex === -1) return null;

  const actuallyInvert = useInvert && currentPlayer.invertLeft > 0;
  const preview = previewPlacement(
    game.board,
    cellIdx,
    playedValue,
    actor,
    actuallyInvert,
    game.ampCells
  );
  if (!preview.valid) return null;

  const nextTurnCount = game.turnCount + 1;
  const nextBoard = game.board.map((c) => (c ? { ...c } : null));
  nextBoard[cellIdx] = {
    owner: actor,
    value: preview.finalValue,
    overloaded: preview.overloaded,
    placedTurn: nextTurnCount,
  };

  for (const flip of preview.flips) {
    const existing = nextBoard[flip.cellIdx];
    if (existing) {
      nextBoard[flip.cellIdx] = { ...existing, owner: actor };
    }
  }

  const nextHand = [...currentPlayer.hand];
  nextHand.splice(cardIndex, 1);

  const nextPlayers = game.players.map((p, idx) =>
    idx === actor
      ? {
          ...p,
          hand: nextHand,
          invertLeft: actuallyInvert ? Math.max(0, p.invertLeft - 1) : p.invertLeft,
        }
      : { ...p, hand: [...p.hand] }
  );

  const loc = coordLabel(cellIdx);
  const parts: string[] = [];
  if (actuallyInvert) parts.push('INVERT');
  if (preview.hijacked.length > 0) {
    parts.push(`EXACT-10 HIJACK ×${preview.hijacked.length}${preview.overloaded ? ' (+1)' : ''}`);
  }
  if (preview.outflanked.length > 0) {
    parts.push(`FLIP ×${preview.outflanked.length}`);
  }
  if (preview.isAmpCell) {
    parts.push('2× AMP');
  }

  const summary =
    parts.length > 0
      ? `${currentPlayer.nickname} dropped ${playedValue} on ${loc} · ${parts.join(' · ')}`
      : `${currentPlayer.nickname} deployed ${playedValue} on ${loc}`;

  const logEntry: TacticalLogEntry = {
    turn: nextTurnCount,
    actor,
    actorName: currentPlayer.nickname,
    cellIdx,
    playedValue,
    finalValue: preview.finalValue,
    usedInvert: actuallyInvert,
    outflanked: preview.outflanked,
    hijacked: preview.hijacked,
    overloaded: preview.overloaded,
    summary,
  };

  const finished = nextTurnCount >= TOTAL_CELLS;
  let winnerIdx: PlayerIndex | 'tie' | null = null;
  let winnerUid: string | null = null;

  if (finished) {
    const finalScores = computeScores(nextBoard, game.ampCells);
    if (finalScores.p0.total > finalScores.p1.total) {
      winnerIdx = 0;
      winnerUid = nextPlayers[0].uid;
    } else if (finalScores.p1.total > finalScores.p0.total) {
      winnerIdx = 1;
      winnerUid = nextPlayers[1].uid;
    } else {
      winnerIdx = 'tie';
      winnerUid = null;
    }
  }

  const nextTurnIdx: PlayerIndex = actor === 0 ? 1 : 0;

  return {
    ...game,
    state: finished ? 'finished' : 'playing',
    turnIdx: finished ? actor : nextTurnIdx,
    turnCount: nextTurnCount,
    board: nextBoard,
    players: nextPlayers,
    lastMove: logEntry,
    logs: [...game.logs, logEntry],
    winnerIdx,
    winnerUid,
  };
}

export interface AIMoveChoice {
  cellIdx: number;
  value: number;
  useInvert: boolean;
}

function evaluateBoardForAI(
  board: (MatrixCell | null)[],
  ampCells: number[],
  aiHand: number[],
  humanHand: number[],
  aiInvertLeft: number,
  humanInvertLeft: number
): number {
  const scores = computeScores(board, ampCells);
  let score = (scores.p1.total - scores.p0.total) * 3.0;

  const ampSet = new Set(ampCells);
  const humanHandSet = new Set(humanHand);
  const aiHandSet = new Set(aiHand);
  const humanMax = humanHand.length > 0 ? Math.max(...humanHand) : 0;
  const aiMax = aiHand.length > 0 ? Math.max(...aiHand) : 0;

  // Evaluate vulnerability and future potential of placed cores
  for (let idx = 0; idx < TOTAL_CELLS; idx++) {
    const cell = board[idx];
    if (!cell) continue;
    const neighbors = getOrthogonalNeighbors(idx);
    let emptyAdj = 0;
    for (const n of neighbors) {
      if (board[n] === null) emptyAdj += 1;
    }
    if (emptyAdj === 0) {
      // Locked-in core! Extra stable points.
      const weight = ampSet.has(idx) ? 1.8 : 0.7;
      score += (cell.owner === 1 ? 1 : -1) * cell.value * weight;
      continue;
    }

    const mult = ampSet.has(idx) ? 2.2 : 1.0;
    const hijackPartner = 10 - cell.value;

    if (cell.owner === 1) {
      // Risk that human can Exact-10 hijack this AI core
      if (humanHandSet.has(hijackPartner)) {
        score -= (cell.value * 0.65 + 2.2) * mult * Math.min(emptyAdj, 2);
      }
      // Risk that human can trivially outflank
      if (humanMax > cell.value) {
        score -= cell.value * 0.35 * mult;
      }
    } else {
      // Opportunity for AI to Exact-10 hijack human's core later
      if (aiHandSet.has(hijackPartner)) {
        score += (cell.value * 0.55 + 1.8) * mult;
      }
      if (aiMax > cell.value) {
        score += cell.value * 0.25 * mult;
      }
    }
  }

  // Value holding Polarity Invert when opponent has strong cores
  score += aiInvertLeft * 4.5;
  score -= humanInvertLeft * 3.5;

  return score;
}

/**
 * Smart 1-ply Minimax Lookahead AI (full reply simulation) for Quantum Matrix.
 * Actively hunts Exact-10 Hijacks, 2x Amplifier captures, +5 line swings,
 * and saves Polarity Invert for high-impact turnarounds.
 */
export function pickBestAIMove(game: QuantumMatrixGame): AIMoveChoice | null {
  if (game.state !== 'playing') return null;
  const aiIdx = game.turnIdx;
  const oppIdx: PlayerIndex = aiIdx === 0 ? 1 : 0;
  const ai = game.players[aiIdx];
  const opp = game.players[oppIdx];
  if (!ai || !opp || ai.hand.length === 0) return null;

  const emptyCells: number[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (game.board[i] === null) emptyCells.push(i);
  }
  if (emptyCells.length === 0) return null;

  interface CandidateMove {
    cellIdx: number;
    value: number;
    useInvert: boolean;
    nextState: QuantumMatrixGame;
    quickScore: number;
  }

  const candidates: CandidateMove[] = [];
  const ampSet = new Set(game.ampCells);

  for (const cellIdx of emptyCells) {
    for (const value of ai.hand) {
      const normalPreview = previewPlacement(
        game.board,
        cellIdx,
        value,
        aiIdx,
        false,
        game.ampCells
      );
      const normalNext = applyMove(game, cellIdx, value, false);
      if (normalNext) {
        let quick = evaluateBoardForAI(
          normalNext.board,
          normalNext.ampCells,
          normalNext.players[aiIdx].hand,
          normalNext.players[oppIdx].hand,
          normalNext.players[aiIdx].invertLeft,
          normalNext.players[oppIdx].invertLeft
        );
        // Flip sign if AI is somehow p0
        if (aiIdx === 0) quick = -quick;
        // Tactical tie-breakers
        quick += normalPreview.hijacked.length * 4.5;
        if (ampSet.has(cellIdx) && value >= 6) quick += 3.0;
        candidates.push({
          cellIdx,
          value,
          useInvert: false,
          nextState: normalNext,
          quickScore: quick,
        });
      }

      if (ai.invertLeft > 0) {
        const invPreview = previewPlacement(
          game.board,
          cellIdx,
          value,
          aiIdx,
          true,
          game.ampCells
        );
        // Only consider Invert if it produces strictly better swing than normal placement
        if (invPreview.netSwing >= normalPreview.netSwing + 6) {
          const invNext = applyMove(game, cellIdx, value, true);
          if (invNext) {
            let quick = evaluateBoardForAI(
              invNext.board,
              invNext.ampCells,
              invNext.players[aiIdx].hand,
              invNext.players[oppIdx].hand,
              invNext.players[aiIdx].invertLeft,
              invNext.players[oppIdx].invertLeft
            );
            if (aiIdx === 0) quick = -quick;
            quick += invPreview.hijacked.length * 4.5;
            // Extra conservation threshold in early turns
            if (emptyCells.length > 8 && invPreview.netSwing < 16) {
              quick -= 8;
            }
            candidates.push({
              cellIdx,
              value,
              useInvert: true,
              nextState: invNext,
              quickScore: quick,
            });
          }
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sort by heuristic quickScore and run 1-ply minimax reply simulation on top moves
  candidates.sort((a, b) => b.quickScore - a.quickScore);
  const shortlist = candidates.slice(0, emptyCells.length <= 5 ? candidates.length : 18);

  let bestMove = shortlist[0];
  let bestMinimaxScore = -Infinity;

  for (const cand of shortlist) {
    if (cand.nextState.state === 'finished') {
      const finalScores = computeScores(cand.nextState.board, cand.nextState.ampCells);
      const diff =
        aiIdx === 1
          ? finalScores.p1.total - finalScores.p0.total
          : finalScores.p0.total - finalScores.p1.total;
      const terminalVal = diff * 100 + (diff > 0 ? 5000 : diff === 0 ? 0 : -5000);
      if (terminalVal > bestMinimaxScore) {
        bestMinimaxScore = terminalVal;
        bestMove = cand;
      }
      continue;
    }

    // Simulate opponent's strongest reply
    const oppEmpty: number[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (cand.nextState.board[i] === null) oppEmpty.push(i);
    }
    const oppAfter = cand.nextState.players[oppIdx];
    const aiAfter = cand.nextState.players[aiIdx];

    let worstForAI = Infinity;

    for (const rCell of oppEmpty) {
      for (const rVal of oppAfter.hand) {
        const afterReply = applyMove(cand.nextState, rCell, rVal, false);
        if (afterReply) {
          let evalScore = evaluateBoardForAI(
            afterReply.board,
            afterReply.ampCells,
            afterReply.players[1].hand,
            afterReply.players[0].hand,
            afterReply.players[1].invertLeft,
            afterReply.players[0].invertLeft
          );
          if (aiIdx === 0) evalScore = -evalScore;
          if (evalScore < worstForAI) worstForAI = evalScore;
        }

        // Also check opponent's invert reply if they still hold it and rVal is low
        if (oppAfter.invertLeft > 0 && rVal <= 3) {
          const invPrev = previewPlacement(
            cand.nextState.board,
            rCell,
            rVal,
            oppIdx,
            true,
            cand.nextState.ampCells
          );
          if (invPrev.outflanked.length > 0) {
            const afterInvReply = applyMove(cand.nextState, rCell, rVal, true);
            if (afterInvReply) {
              let evalScore = evaluateBoardForAI(
                afterInvReply.board,
                afterInvReply.ampCells,
                afterInvReply.players[1].hand,
                afterInvReply.players[0].hand,
                afterInvReply.players[1].invertLeft,
                afterInvReply.players[0].invertLeft
              );
              if (aiIdx === 0) evalScore = -evalScore;
              // Slightly discount opponent burning invert
              evalScore += 2.5;
              if (evalScore < worstForAI) worstForAI = evalScore;
            }
          }
        }
      }
    }

    // Small blend with quickScore + tiny jitter for variety on equal lines
    const combined =
      (worstForAI === Infinity ? cand.quickScore : worstForAI) +
      cand.quickScore * 0.08 +
      (aiAfter.invertLeft * 0.5) +
      Math.random() * 0.35;

    if (combined > bestMinimaxScore) {
      bestMinimaxScore = combined;
      bestMove = cand;
    }
  }

  return {
    cellIdx: bestMove.cellIdx,
    value: bestMove.value,
    useInvert: bestMove.useInvert,
  };
}
