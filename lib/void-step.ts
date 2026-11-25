export const VOID_GRID_SIZE = 7;

export interface GridPos {
  x: number;
  y: number;
}

export interface VoidStepPlayer {
  uid: string;
  sessionId: string;
  nickname: string;
  isBot?: boolean;
  pos: GridPos;
  blinksLeft: number;
  score: number;
}

export interface VoidStepState {
  gameId?: string;
  mode: 'solo' | 'multi';
  creatorId: string;
  state: 'waiting' | 'playing' | 'round_over' | 'finished';
  subPhase: 'move' | 'shatter';
  turnIdx: 0 | 1;
  round: number;
  winScore: number;
  voidCells: number[]; // flattened y * 7 + x
  players: VoidStepPlayer[];
  roundWinnerIdx: number | null;
  winnerUid: string | null;
  lastEvent: string;
  createdAt?: number;
}

export const VOID_P0_START: GridPos = { x: 0, y: 3 };
export const VOID_P1_START: GridPos = { x: 6, y: 3 };

export function cellIdx(x: number, y: number): number {
  return y * VOID_GRID_SIZE + x;
}

export function getValidMoves(
  pos: GridPos,
  oppPos: GridPos,
  voidCells: number[],
  useBlink: boolean
): GridPos[] {
  const voidSet = new Set(voidCells);
  const dirs = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1],
  ];
  const dist = useBlink ? 2 : 1;
  const moves: GridPos[] = [];
  for (const [dx, dy] of dirs) {
    const nx = pos.x + dx * dist;
    const ny = pos.y + dy * dist;
    if (nx < 0 || nx >= VOID_GRID_SIZE || ny < 0 || ny >= VOID_GRID_SIZE) continue;
    if (nx === oppPos.x && ny === oppPos.y) continue;
    if (voidSet.has(cellIdx(nx, ny))) continue;
    moves.push({ x: nx, y: ny });
  }
  return moves;
}

export function hasAnyLegalMove(
  player: VoidStepPlayer,
  opp: VoidStepPlayer,
  voidCells: number[]
): boolean {
  if (getValidMoves(player.pos, opp.pos, voidCells, false).length > 0) return true;
  if (player.blinksLeft > 0 && getValidMoves(player.pos, opp.pos, voidCells, true).length > 0) return true;
  return false;
}

export function pickBotVoidMove(
  bot: VoidStepPlayer,
  human: VoidStepPlayer,
  voidCells: number[]
): { movePos: GridPos; usedBlink: boolean; shatterCell: number } | null {
  const normalMoves = getValidMoves(bot.pos, human.pos, voidCells, false);
  const blinkMoves = bot.blinksLeft > 0 ? getValidMoves(bot.pos, human.pos, voidCells, true) : [];

  type Candidate = { pos: GridPos; usedBlink: boolean; score: number };
  const cands: Candidate[] = [];

  for (const m of normalMoves) {
    const nextVoid = [...voidCells, cellIdx(bot.pos.x, bot.pos.y)];
    const mobility = getValidMoves(m, human.pos, nextVoid, false).length;
    const centerBias = 4 - (Math.abs(m.x - 3) + Math.abs(m.y - 3)) * 0.4;
    cands.push({ pos: m, usedBlink: false, score: mobility * 4 + centerBias + Math.random() });
  }

  // Only consider Blink if normal mobility is low (<= 2) or trapped
  if (blinkMoves.length > 0 && (normalMoves.length <= 2)) {
    for (const m of blinkMoves) {
      const nextVoid = [...voidCells, cellIdx(bot.pos.x, bot.pos.y)];
      const mobility = getValidMoves(m, human.pos, nextVoid, false).length;
      cands.push({
        pos: m,
        usedBlink: true,
        score: mobility * 4 + (normalMoves.length === 0 ? 50 : 2) + Math.random(),
      });
    }
  }

  if (cands.length === 0) return null;
  cands.sort((a, b) => b.score - a.score);
  const best = cands[0];
  const voidAfterMove = [...voidCells, cellIdx(bot.pos.x, bot.pos.y)];

  // Pick a shatter target: strongly prioritize tiles adjacent to human!
  const humanAdj = getValidMoves(human.pos, best.pos, voidAfterMove, false);
  let shatterCell = -1;
  if (humanAdj.length > 0) {
    // Pick the human neighbor that cuts off the most human mobility
    let bestDrop = -1;
    for (const hCell of humanAdj) {
      const testVoid = [...voidAfterMove, cellIdx(hCell.x, hCell.y)];
      const rem = getValidMoves(human.pos, best.pos, testVoid, false).length;
      const val = 10 - rem + Math.random() * 0.5;
      if (val > bestDrop) {
        bestDrop = val;
        shatterCell = cellIdx(hCell.x, hCell.y);
      }
    }
  }

  if (shatterCell === -1) {
    const voidSet = new Set(voidAfterMove);
    for (let i = 0; i < VOID_GRID_SIZE * VOID_GRID_SIZE; i++) {
      const x = i % VOID_GRID_SIZE;
      const y = Math.floor(i / VOID_GRID_SIZE);
      if (voidSet.has(i)) continue;
      if ((x === best.pos.x && y === best.pos.y) || (x === human.pos.x && y === human.pos.y)) continue;
      shatterCell = i;
      break;
    }
  }

  return { movePos: best.pos, usedBlink: best.usedBlink, shatterCell };
}
