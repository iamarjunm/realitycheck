export const SHADOW_GRID_SIZE = 6;
export const SHADOW_TOTAL_CELLS = SHADOW_GRID_SIZE * SHADOW_GRID_SIZE;
export const SHADOW_FLEET_SIZE = 6; // 3 + 2 + 1 stealth nodes
export const SHADOW_SONAR_CHARGES = 2;
export const SHADOW_ORBITAL_CHARGES = 1;

export type ShadowWeapon = 'strike' | 'sonar' | 'orbital_row' | 'orbital_col';

export interface SonarPingResult {
  center: number;
  count: number;
}

export interface ShadowPlayer {
  uid: string;
  sessionId: string;
  nickname: string;
  isBot?: boolean;
  fleet: number[]; // 6 unique cell indices (0..35)
  ready: boolean;
  shotsFired: number[]; // cell indices fired at opponent
  sonarResults: SonarPingResult[];
  sonarLeft: number;
  orbitalLeft: number;
}

export interface ShadowActionLog {
  id: number;
  actorIdx: number;
  actorName: string;
  weapon: ShadowWeapon;
  target: number;
  hits: number;
  summary: string;
}

export interface ShadowStrikeState {
  status: 'waiting' | 'setup' | 'playing' | 'finished';
  players: ShadowPlayer[];
  turnIndex: number; // 0 or 1
  turnNumber: number;
  winnerIdx: number | null;
  lastAction: ShadowActionLog | null;
  logs: ShadowActionLog[];
  updatedAt?: number;
}

export function idxToRC(idx: number): [number, number] {
  return [Math.floor(idx / SHADOW_GRID_SIZE), idx % SHADOW_GRID_SIZE];
}

export function rcToIdx(r: number, c: number): number {
  return r * SHADOW_GRID_SIZE + c;
}

export function formatCoord(idx: number): string {
  const [r, c] = idxToRC(idx);
  return `${String.fromCharCode(65 + r)}${c + 1}`;
}

export function get3x3Cells(centerIdx: number): number[] {
  const [cr, cc] = idxToRC(centerIdx);
  const cells: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr >= 0 && nr < SHADOW_GRID_SIZE && nc >= 0 && nc < SHADOW_GRID_SIZE) {
        cells.push(rcToIdx(nr, nc));
      }
    }
  }
  return cells;
}

export function getOrbitalCells(cellIdx: number, mode: 'orbital_row' | 'orbital_col'): number[] {
  const [r, c] = idxToRC(cellIdx);
  const cells: number[] = [];
  if (mode === 'orbital_row') {
    for (let col = 0; col < SHADOW_GRID_SIZE; col++) {
      cells.push(rcToIdx(r, col));
    }
  } else {
    for (let row = 0; row < SHADOW_GRID_SIZE; row++) {
      cells.push(rcToIdx(row, c));
    }
  }
  return cells;
}

export function countFleetIn3x3(centerIdx: number, targetFleet: number[]): number {
  const fleetSet = new Set(targetFleet);
  return get3x3Cells(centerIdx).filter((c) => fleetSet.has(c)).length;
}

export function countHits(shotsFired: number[], targetFleet: number[]): number {
  const shotSet = new Set(shotsFired);
  return targetFleet.filter((c) => shotSet.has(c)).length;
}

export function allFleetSunk(shotsFired: number[], targetFleet: number[]): boolean {
  return targetFleet.length > 0 && countHits(shotsFired, targetFleet) >= targetFleet.length;
}

/**
 * Generates a valid non-overlapping 3 + 2 + 1 stealth formation on the 6x6 grid.
 */
export function generateAutoFleet(): number[] {
  const lengths = [3, 2, 1];
  for (let attempt = 0; attempt < 120; attempt++) {
    const occupied = new Set<number>();
    let ok = true;
    for (const len of lengths) {
      let placed = false;
      for (let tries = 0; tries < 40; tries++) {
        const horiz = Math.random() < 0.5;
        const r = Math.floor(Math.random() * (horiz ? SHADOW_GRID_SIZE : SHADOW_GRID_SIZE - len + 1));
        const c = Math.floor(Math.random() * (horiz ? SHADOW_GRID_SIZE - len + 1 : SHADOW_GRID_SIZE));
        const seg: number[] = [];
        for (let i = 0; i < len; i++) {
          seg.push(rcToIdx(horiz ? r : r + i, horiz ? c + i : c));
        }
        if (seg.every((cell) => !occupied.has(cell))) {
          seg.forEach((cell) => occupied.add(cell));
          placed = true;
          break;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (ok && occupied.size === SHADOW_FLEET_SIZE) {
      return Array.from(occupied).sort((a, b) => a - b);
    }
  }
  // Guaranteed deterministic fallback
  return [1, 2, 3, 19, 25, 34];
}

export function createShadowPlayer(
  uid: string,
  sessionId: string,
  nickname: string,
  isBot = false
): ShadowPlayer {
  return {
    uid,
    sessionId,
    nickname,
    isBot,
    fleet: isBot ? generateAutoFleet() : [],
    ready: isBot,
    shotsFired: [],
    sonarResults: [],
    sonarLeft: SHADOW_SONAR_CHARGES,
    orbitalLeft: SHADOW_ORBITAL_CHARGES,
  };
}

export function applyShadowWeapon(
  state: ShadowStrikeState,
  actorIdx: number,
  weapon: ShadowWeapon,
  targetIdx: number
): ShadowStrikeState {
  if (state.status !== 'playing' || state.turnIndex !== actorIdx) return state;
  if (targetIdx < 0 || targetIdx >= SHADOW_TOTAL_CELLS) return state;

  const oppIdx = actorIdx === 0 ? 1 : 0;
  const players: ShadowPlayer[] = state.players.map((p) => ({
    ...p,
    fleet: [...p.fleet],
    shotsFired: [...p.shotsFired],
    sonarResults: [...p.sonarResults],
  }));

  const actor = players[actorIdx];
  const opp = players[oppIdx];
  const oppFleetSet = new Set(opp.fleet);
  const alreadyShot = new Set(actor.shotsFired);

  let hits = 0;
  let extraTurn = false;
  let summary = '';

  if (weapon === 'strike') {
    if (alreadyShot.has(targetIdx)) return state;
    actor.shotsFired.push(targetIdx);
    if (oppFleetSet.has(targetIdx)) {
      hits = 1;
      extraTurn = true;
      summary = `${actor.nickname} nailed a STEALTH NODE at ${formatCoord(targetIdx)}! CHAIN TURN!`;
    } else {
      summary = `${actor.nickname} fired at ${formatCoord(targetIdx)} — open void.`;
    }
  } else if (weapon === 'sonar') {
    if (actor.sonarLeft <= 0) return state;
    actor.sonarLeft -= 1;
    const count = countFleetIn3x3(targetIdx, opp.fleet);
    // Replace if same center pinged again, else append
    const existingIdx = actor.sonarResults.findIndex((s) => s.center === targetIdx);
    if (existingIdx >= 0) {
      actor.sonarResults[existingIdx] = { center: targetIdx, count };
    } else {
      actor.sonarResults.push({ center: targetIdx, count });
    }
    summary = `${actor.nickname} pulsed 3×3 SONAR at ${formatCoord(targetIdx)} — detected ${count} node${count === 1 ? '' : 's'}.`;
  } else {
    if (actor.orbitalLeft <= 0) return state;
    actor.orbitalLeft -= 1;
    const lineCells = getOrbitalCells(targetIdx, weapon);
    const newlyHit: number[] = [];
    for (const cell of lineCells) {
      if (!alreadyShot.has(cell)) {
        actor.shotsFired.push(cell);
        alreadyShot.add(cell);
        if (oppFleetSet.has(cell)) {
          newlyHit.push(cell);
        }
      }
    }
    hits = newlyHit.length;
    const [r, c] = idxToRC(targetIdx);
    const lineLabel = weapon === 'orbital_row' ? `ROW ${String.fromCharCode(65 + r)}` : `COL ${c + 1}`;
    summary =
      hits > 0
        ? `${actor.nickname} fired ORBITAL BEAM down ${lineLabel} — VAPORIZED ${hits} node${hits === 1 ? '' : 's'}!`
        : `${actor.nickname} fired ORBITAL BEAM down ${lineLabel} — no hits.`;
  }

  const won = allFleetSunk(actor.shotsFired, opp.fleet);
  const logEntry: ShadowActionLog = {
    id: (state.lastAction?.id ?? 0) + 1,
    actorIdx,
    actorName: actor.nickname,
    weapon,
    target: targetIdx,
    hits,
    summary,
  };

  return {
    ...state,
    players,
    status: won ? 'finished' : 'playing',
    winnerIdx: won ? actorIdx : null,
    turnIndex: won ? actorIdx : extraTurn ? actorIdx : oppIdx,
    turnNumber: state.turnNumber + 1,
    lastAction: logEntry,
    logs: [logEntry, ...state.logs].slice(0, 14),
    updatedAt: Date.now(),
  };
}

/**
 * Hunt-and-Target tactical AI for Solo mode.
 */
export function pickBotShadowAction(
  bot: ShadowPlayer,
  human: ShadowPlayer
): { weapon: ShadowWeapon; target: number } {
  const shotSet = new Set(bot.shotsFired);
  const humanFleetSet = new Set(human.fleet);

  // 1. Find all confirmed hits so far
  const knownHits = bot.shotsFired.filter((c) => humanFleetSet.has(c));

  // 2. Collect orthogonal unshot neighbors of known hits
  const priorityTargets = new Set<number>();
  for (const h of knownHits) {
    const [r, c] = idxToRC(h);
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < SHADOW_GRID_SIZE && nc >= 0 && nc < SHADOW_GRID_SIZE) {
        const nIdx = rcToIdx(nr, nc);
        if (!shotSet.has(nIdx)) priorityTargets.add(nIdx);
      }
    }
  }

  // If we have active adjacent targets around a hit, strike them!
  if (priorityTargets.size > 0) {
    const arr = Array.from(priorityTargets);
    // Prefer cells aligned with 2+ hits if any
    const aligned = arr.filter((cand) => {
      const [cr, cc] = idxToRC(cand);
      const sameRowHits = knownHits.filter((h) => idxToRC(h)[0] === cr).length;
      const sameColHits = knownHits.filter((h) => idxToRC(h)[1] === cc).length;
      return sameRowHits >= 2 || sameColHits >= 2;
    });
    const pool = aligned.length > 0 ? aligned : arr;
    return {
      weapon: 'strike',
      target: pool[Math.floor(Math.random() * pool.length)],
    };
  }

  // 3. Use Orbital Beam mid-game on the row or column with the most unshot cells (weighted by positive sonar pings)
  if (bot.orbitalLeft > 0 && bot.shotsFired.length >= 4 && Math.random() < 0.45) {
    let bestScore = -1;
    let bestWeapon: 'orbital_row' | 'orbital_col' = 'orbital_row';
    let bestTarget = 0;

    for (let i = 0; i < SHADOW_GRID_SIZE; i++) {
      const rowCells = getOrbitalCells(rcToIdx(i, 0), 'orbital_row');
      const rowUnshot = rowCells.filter((c) => !shotSet.has(c)).length;
      if (rowUnshot > bestScore) {
        bestScore = rowUnshot;
        bestWeapon = 'orbital_row';
        bestTarget = rcToIdx(i, 0);
      }
      const colCells = getOrbitalCells(rcToIdx(0, i), 'orbital_col');
      const colUnshot = colCells.filter((c) => !shotSet.has(c)).length;
      if (colUnshot > bestScore) {
        bestScore = colUnshot;
        bestWeapon = 'orbital_col';
        bestTarget = rcToIdx(0, i);
      }
    }

    if (bestScore >= 4) {
      return { weapon: bestWeapon, target: bestTarget };
    }
  }

  // 4. Use Sonar Ping early/mid-game on an unscanned quadrant center
  if (bot.sonarLeft > 0 && (bot.shotsFired.length === 0 || (bot.shotsFired.length >= 6 && knownHits.length < 4))) {
    const centers = [7, 10, 25, 28]; // (1,1), (1,4), (4,1), (4,4) cover entire 6x6!
    const pinged = new Set(bot.sonarResults.map((s) => s.center));
    const available = centers.filter((c) => !pinged.has(c));
    if (available.length > 0) {
      return {
        weapon: 'sonar',
        target: available[Math.floor(Math.random() * available.length)],
      };
    }
  }

  // 5. Score remaining unshot cells using Sonar Ping evidence + checkerboard hunt pattern
  const unshot: number[] = [];
  for (let i = 0; i < SHADOW_TOTAL_CELLS; i++) {
    if (!shotSet.has(i)) unshot.push(i);
  }

  if (unshot.length === 0) {
    return { weapon: 'strike', target: 0 };
  }

  const scored = unshot.map((cell) => {
    let weight = 1;
    const [r, c] = idxToRC(cell);
    if ((r + c) % 2 === 0) weight += 1.5;

    for (const sonar of bot.sonarResults) {
      const box = get3x3Cells(sonar.center);
      if (box.includes(cell)) {
        const hitsAlreadyInBox = box.filter((b) => shotSet.has(b) && humanFleetSet.has(b)).length;
        const remainingInBox = Math.max(0, sonar.count - hitsAlreadyInBox);
        if (remainingInBox === 0) {
          weight -= 50; // Definitely empty!
        } else {
          weight += remainingInBox * 6;
        }
      }
    }
    return { cell, weight };
  });

  scored.sort((a, b) => b.weight - a.weight);
  const topWeight = scored[0].weight;
  const topPool = scored.filter((s) => s.weight >= topWeight - 1).map((s) => s.cell);
  return {
    weapon: 'strike',
    target: topPool[Math.floor(Math.random() * topPool.length)],
  };
}
