export type ShellType = 'live' | 'blank';
export type ModChipType = 'xray' | 'overclock' | 'invert' | 'eject' | 'cuff' | 'siphon';

export const ALL_CHIP_TYPES: ModChipType[] = [
  'xray',
  'overclock',
  'invert',
  'eject',
  'cuff',
  'siphon',
];

export interface RoulettePvPPlayer {
  uid: string;
  sessionId: string;
  nickname: string;
  hp: number;
  chips: ModChipType[];
  cuffed: boolean;
  scannedNext: ShellType | null;
}

export interface RoulettePvPDoc {
  creatorId: string;
  state: 'waiting' | 'playing' | 'finished';
  maxHp: number;
  chipsPerLoad: number;
  turnIdx: 0 | 1;
  chamber: ShellType[];
  overclocked: boolean;
  cylinderAngle: number;
  lastEvent: string;
  lastFlash: 'live' | 'blank' | 'glitch' | null;
  lastFlashId: string;
  winnerUid: string | null;
  players: RoulettePvPPlayer[];
  createdAt: number;
}

export function buildPvPMagazine(): ShellType[] {
  const size = 4 + Math.floor(Math.random() * 5); // 4..8 shells
  const liveCount = Math.max(
    1,
    Math.min(size - 1, Math.floor(size / 2) + (Math.random() < 0.45 ? 1 : 0))
  );
  const blankCount = size - liveCount;
  const arr: ShellType[] = [
    ...Array(liveCount).fill('live'),
    ...Array(blankCount).fill('blank'),
  ];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function drawPvPChips(count: number, current: ModChipType[]): ModChipType[] {
  const next = [...current];
  for (let i = 0; i < count; i++) {
    if (next.length >= 6) break;
    next.push(ALL_CHIP_TYPES[Math.floor(Math.random() * ALL_CHIP_TYPES.length)]);
  }
  return next;
}
