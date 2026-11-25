export type Action = 'U' | 'D' | 'L' | 'R' | 'SU' | 'SD' | 'SL' | 'SR' | 'SH' | 'W';
export type BotDifficulty = 'casual' | 'sharp' | 'master';
export type ArenaMapId = 'pillars' | 'monolith' | 'gates' | 'void';

export interface Pos {
  x: number;
  y: number;
}

export interface LaserBeam {
  pIndex: 0 | 1;
  direction: Action;
  path: Pos[];
  blockedByShield: boolean;
}

export interface TickResult {
  tickNum: number;
  p0PrevPos: Pos;
  p1PrevPos: Pos;
  p0Pos: Pos;
  p1Pos: Pos;
  p0Action: Action;
  p1Action: Action;
  p0Hit: boolean;
  p1Hit: boolean;
  p0Shield: boolean;
  p1Shield: boolean;
  lasers: LaserBeam[];
  isEnd: boolean;
}

export interface ChronosPlayer {
  uid: string;
  sessionId?: string;
  nickname: string;
  isBot?: boolean;
  color: 'cyan' | 'rose';
  score: number;
  ready: boolean;
  readyForNext: boolean;
  actions: Action[];
  pastActions: Action[];
}

export interface ChronosGameState {
  gameId?: string;
  mode: 'solo' | 'multi';
  creatorId: string;
  state: 'waiting' | 'programming' | 'executing' | 'round_over' | 'finished';
  players: ChronosPlayer[];
  turn: number; // Current time-loop number within the round (1, 2, 3...)
  round: number; // Current round number (1, 2, ...)
  winScore: number;
  mapId: ArenaMapId;
  obstacles: Pos[];
  roundWinnerIdx: number | null; // 0, 1, or -1 for mutual annihilation / draw
  matchWinner: string | null;
  executionResults?: TickResult[] | null;
  executionId?: string | null;
}

export const BOARD_SIZE = 5;
export const MAX_TICKS = 5;
export const MAX_SHIELDS_PER_LOOP = 1;
export const P0_START: Pos = { x: 0, y: 2 };
export const P1_START: Pos = { x: 4, y: 2 };

export const ARENA_MAPS: Record<
  ArenaMapId,
  { name: string; tagline: string; obstacles: Pos[] }
> = {
  pillars: {
    name: 'Twin Pillars',
    tagline: 'Open center duel, cover on flanks',
    obstacles: [
      { x: 2, y: 1 },
      { x: 2, y: 3 },
    ],
  },
  monolith: {
    name: 'Center Monolith',
    tagline: 'Blocked mid-lane, flank warfare',
    obstacles: [{ x: 2, y: 2 }],
  },
  gates: {
    name: 'Diagonal Gates',
    tagline: 'Asymmetric diagonal sightlines',
    obstacles: [
      { x: 1, y: 1 },
      { x: 3, y: 3 },
    ],
  },
  void: {
    name: 'Open Void',
    tagline: 'Pure sightlines, nowhere to hide',
    obstacles: [],
  },
};

export const ALL_MAP_IDS: ArenaMapId[] = ['pillars', 'monolith', 'gates', 'void'];

export function pickRoundMap(prefer?: ArenaMapId | 'random'): { mapId: ArenaMapId; obstacles: Pos[] } {
  const id =
    prefer && prefer !== 'random'
      ? prefer
      : ALL_MAP_IDS[Math.floor(Math.random() * ALL_MAP_IDS.length)];
  return { mapId: id, obstacles: ARENA_MAPS[id].obstacles };
}

export function mirrorActionForPerspective(a: Action, isFlipped: boolean): Action {
  if (!isFlipped) return a;
  if (a === 'L') return 'R';
  if (a === 'R') return 'L';
  if (a === 'SL') return 'SR';
  if (a === 'SR') return 'SL';
  return a;
}

export function isObstacle(pos: Pos, obstacles: Pos[]): boolean {
  return obstacles.some((o) => o.x === pos.x && o.y === pos.y);
}

export function countShields(actions: Action[]): number {
  return actions.filter((a) => a === 'SH').length;
}

export function countParadoxDiffs(actions: Action[], pastActions: Action[]): number {
  if (pastActions.length !== MAX_TICKS) return 0;
  let diffs = 0;
  for (let i = 0; i < MAX_TICKS; i++) {
    if (actions[i] !== pastActions[i]) diffs++;
  }
  return diffs;
}

export function simulateTicks(
  p0Actions: Action[],
  p1Actions: Action[],
  obstacles: Pos[] = []
): TickResult[] {
  let p0pos: Pos = { ...P0_START };
  let p1pos: Pos = { ...P1_START };
  const results: TickResult[] = [];

  for (let tNum = 0; tNum < MAX_TICKS; tNum++) {
    const a0: Action = p0Actions[tNum] || 'W';
    const a1: Action = p1Actions[tNum] || 'W';
    const prev0 = { ...p0pos };
    const prev1 = { ...p1pos };

    const t0: Pos = { ...p0pos };
    const t1: Pos = { ...p1pos };

    if (a0 === 'U' && t0.y > 0) t0.y--;
    if (a0 === 'D' && t0.y < BOARD_SIZE - 1) t0.y++;
    if (a0 === 'L' && t0.x > 0) t0.x--;
    if (a0 === 'R' && t0.x < BOARD_SIZE - 1) t0.x++;

    if (a1 === 'U' && t1.y > 0) t1.y--;
    if (a1 === 'D' && t1.y < BOARD_SIZE - 1) t1.y++;
    if (a1 === 'L' && t1.x > 0) t1.x--;
    if (a1 === 'R' && t1.x < BOARD_SIZE - 1) t1.x++;

    const valid0 = isObstacle(t0, obstacles) ? { ...p0pos } : t0;
    const valid1 = isObstacle(t1, obstacles) ? { ...p1pos } : t1;

    const bothSameTarget = valid0.x === valid1.x && valid0.y === valid1.y;
    const swapped =
      valid0.x === p1pos.x &&
      valid0.y === p1pos.y &&
      valid1.x === p0pos.x &&
      valid1.y === p0pos.y;

    if (!bothSameTarget && !swapped) {
      // Check if one stayed still and the other tried to step into them
      const p0IntoStationaryP1 =
        valid0.x === valid1.x && valid0.y === valid1.y;
      if (!p0IntoStationaryP1) {
        p0pos = valid0;
        p1pos = valid1;
      }
    }

    const p0Shield = a0 === 'SH';
    const p1Shield = a1 === 'SH';
    let p0Hit = false;
    let p1Hit = false;
    const lasers: LaserBeam[] = [];

    const calculateLaserPath = (origin: Pos, a: Action): Pos[] => {
      const path: Pos[] = [];
      const dx = a === 'SL' ? -1 : a === 'SR' ? 1 : 0;
      const dy = a === 'SU' ? -1 : a === 'SD' ? 1 : 0;
      if (dx === 0 && dy === 0) return path;

      let cx = origin.x + dx;
      let cy = origin.y + dy;
      while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE) {
        const cell = { x: cx, y: cy };
        if (isObstacle(cell, obstacles)) break;
        path.push(cell);
        cx += dx;
        cy += dy;
      }
      return path;
    };

    if (a0.startsWith('S') && a0 !== 'SH') {
      const path = calculateLaserPath(p0pos, a0);
      const hitsTarget = path.some((p) => p.x === p1pos.x && p.y === p1pos.y);
      const blocked = hitsTarget && p1Shield;
      if (hitsTarget && !p1Shield) p1Hit = true;
      lasers.push({ pIndex: 0, direction: a0, path, blockedByShield: blocked });
    }

    if (a1.startsWith('S') && a1 !== 'SH') {
      const path = calculateLaserPath(p1pos, a1);
      const hitsTarget = path.some((p) => p.x === p0pos.x && p.y === p0pos.y);
      const blocked = hitsTarget && p0Shield;
      if (hitsTarget && !p0Shield) p0Hit = true;
      lasers.push({ pIndex: 1, direction: a1, path, blockedByShield: blocked });
    }

    results.push({
      tickNum: tNum,
      p0PrevPos: prev0,
      p1PrevPos: prev1,
      p0Pos: { ...p0pos },
      p1Pos: { ...p1pos },
      p0Action: a0,
      p1Action: a1,
      p0Hit,
      p1Hit,
      p0Shield,
      p1Shield,
      lasers,
      isEnd: p0Hit || p1Hit || tNum === MAX_TICKS - 1,
    });

    if (p0Hit || p1Hit) {
      break;
    }
  }

  return results;
}

/**
 * Generates a tactical solo-bot sequence (Player 1) respecting the 1-Shield cap
 * and the 1-Paradox-Edit constraint when continuing a time loop.
 */
export function pickBotChronosActions(
  botPastActions: Action[],
  playerPastActions: Action[],
  obstacles: Pos[],
  difficulty: BotDifficulty
): Action[] {
  const allActions: Action[] = ['U', 'D', 'L', 'R', 'SU', 'SD', 'SL', 'SR', 'SH', 'W'];

  const isValidBotSeq = (seq: Action[]): boolean => {
    if (seq.length !== MAX_TICKS) return false;
    if (countShields(seq) > MAX_SHIELDS_PER_LOOP) return false;
    return true;
  };

  // Evaluate candidate bot sequence against assumed human actions
  const scoreSequence = (botSeq: Action[], assumedHumanSeq: Action[]): number => {
    const sim = simulateTicks(assumedHumanSeq, botSeq, obstacles);
    const last = sim[sim.length - 1];
    let score = 0;

    if (last.p0Hit && !last.p1Hit) score += 100 - last.tickNum * 4;
    else if (last.p0Hit && last.p1Hit) score += 5;
    else if (last.p1Hit && !last.p0Hit) score -= 120 - last.tickNum * 4;

    // Reward blocking a human laser with a shield or staying close to firing lanes
    for (const t of sim) {
      for (const l of t.lasers) {
        if (l.pIndex === 0 && l.blockedByShield) score += 25;
      }
      if (t.p1Action.startsWith('S') && t.p1Action !== 'SH') {
        score += 2; // Slight preference for aggressive shots over passive waiting
      }
    }

    // Penalize bumping into walls/obstacles
    for (const t of sim) {
      if (
        ['U', 'D', 'L', 'R'].includes(t.p1Action) &&
        t.p1Pos.x === t.p1PrevPos.x &&
        t.p1Pos.y === t.p1PrevPos.y
      ) {
        score -= 8;
      }
    }

    return score;
  };

  // Loop 1: no pastActions yet -> generate tactical opening candidates
  if (botPastActions.length !== MAX_TICKS) {
    const assumedHumanOpeners: Action[][] = [
      ['SR', 'U', 'SR', 'D', 'SR'],
      ['U', 'R', 'SR', 'D', 'SL'],
      ['D', 'R', 'SR', 'U', 'SL'],
      ['SH', 'SR', 'U', 'SR', 'D'],
      ['R', 'U', 'SR', 'L', 'SD'],
    ];

    const candidates: Action[][] = [];
    for (let i = 0; i < (difficulty === 'master' ? 140 : difficulty === 'sharp' ? 60 : 20); i++) {
      const seq: Action[] = [];
      let usedShield = false;
      for (let t = 0; t < MAX_TICKS; t++) {
        const pool = usedShield
          ? allActions.filter((a) => a !== 'SH')
          : allActions;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (pick === 'SH') usedShield = true;
        seq.push(pick);
      }
      if (isValidBotSeq(seq)) candidates.push(seq);
    }

    // Always include a few clean opening templates
    candidates.push(
      ['U', 'SL', 'D', 'SL', 'U'],
      ['D', 'SL', 'U', 'SL', 'D'],
      ['SH', 'SL', 'U', 'L', 'SD'],
      ['L', 'U', 'SL', 'D', 'SL']
    );

    if (difficulty === 'casual') {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    let bestSeq = candidates[0];
    let bestScore = -Infinity;
    for (const cand of candidates) {
      let total = 0;
      for (const h of assumedHumanOpeners) {
        total += scoreSequence(cand, h);
      }
      const noise = difficulty === 'sharp' ? (Math.random() - 0.5) * 25 : (Math.random() - 0.5) * 6;
      if (total + noise > bestScore) {
        bestScore = total + noise;
        bestSeq = cand;
      }
    }
    return bestSeq;
  }

  // Loop 2+: Bot MUST obey the 1-Paradox-Edit rule relative to botPastActions
  const variants: Action[][] = [[...botPastActions]];
  for (let slot = 0; slot < MAX_TICKS; slot++) {
    for (const act of allActions) {
      if (act === botPastActions[slot]) continue;
      const cand = [...botPastActions];
      cand[slot] = act;
      if (isValidBotSeq(cand)) variants.push(cand);
    }
  }

  if (difficulty === 'casual') {
    return variants[Math.floor(Math.random() * variants.length)];
  }

  // Simulate against player's past actions + 1 random human paradox edit samples
  const humanSamples: Action[][] = [playerPastActions];
  const sampleCount = difficulty === 'master' ? 12 : 4;
  for (let s = 0; s < sampleCount; s++) {
    const slot = Math.floor(Math.random() * MAX_TICKS);
    const act = allActions[Math.floor(Math.random() * allActions.length)];
    const h = [...playerPastActions];
    h[slot] = act;
    if (countShields(h) <= MAX_SHIELDS_PER_LOOP) humanSamples.push(h);
  }

  let bestSeq = variants[0];
  let bestScore = -Infinity;
  for (const cand of variants) {
    let total = 0;
    for (let i = 0; i < humanSamples.length; i++) {
      // Weight exact pastActions slightly higher on Sharp, balanced on Master
      const weight = i === 0 ? 2 : 1;
      total += scoreSequence(cand, humanSamples[i]) * weight;
    }
    const noise = difficulty === 'sharp' ? (Math.random() - 0.5) * 30 : (Math.random() - 0.5) * 5;
    if (total + noise > bestScore) {
      bestScore = total + noise;
      bestSeq = cand;
    }
  }
  return bestSeq;
}
