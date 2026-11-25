'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Action,
  ArenaMapId,
  BotDifficulty,
  ChronosGameState,
  pickBotChronosActions,
  pickRoundMap,
  simulateTicks,
} from '@/lib/chronos';
import { playSound } from '@/lib/sounds';
import { ChronosArena } from '@/components/chronos/ChronosArena';

function SoloChronosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const playerName = (searchParams.get('name') || 'Assassin').slice(0, 16);
  const rawDiff = searchParams.get('difficulty');
  const difficulty: BotDifficulty =
    rawDiff === 'casual' || rawDiff === 'master' ? rawDiff : 'sharp';
  const winScore = Number(searchParams.get('winScore')) === 5 ? 5 : 3;
  const rawMap = searchParams.get('map') as ArenaMapId | 'random' | null;
  const mapPref: ArenaMapId | 'random' = rawMap || 'random';

  const createInitialGame = useCallback((): ChronosGameState => {
    const { mapId, obstacles } = pickRoundMap(mapPref);
    const botLabel =
      difficulty === 'master'
        ? 'Paradox AI'
        : difficulty === 'casual'
        ? 'Glitch Bot'
        : 'Chronos AI';

    return {
      mode: 'solo',
      creatorId: 'human',
      state: 'programming',
      turn: 1,
      round: 1,
      winScore,
      mapId,
      obstacles,
      roundWinnerIdx: null,
      matchWinner: null,
      executionResults: null,
      executionId: null,
      players: [
        {
          uid: 'human',
          nickname: playerName,
          color: 'cyan',
          score: 0,
          ready: false,
          readyForNext: false,
          actions: ['W', 'W', 'W', 'W', 'W'],
          pastActions: [],
        },
        {
          uid: 'bot',
          nickname: botLabel,
          isBot: true,
          color: 'rose',
          score: 0,
          ready: false,
          readyForNext: false,
          actions: ['W', 'W', 'W', 'W', 'W'],
          pastActions: [],
        },
      ],
    };
  }, [difficulty, mapPref, playerName, winScore]);

  const [game, setGame] = useState<ChronosGameState>(() => createInitialGame());
  const [currentTick, setCurrentTick] = useState(-1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const sfx = useCallback(
    (type: Parameters<typeof playSound>[0]) => {
      if (soundEnabled) playSound(type);
    },
    [soundEnabled]
  );

  // Playback tick animation during executing
  useEffect(() => {
    if (game.state !== 'executing' || !game.executionResults) return;

    const results = game.executionResults;
    setCurrentTick(0);

    const playTickSfx = (tIdx: number) => {
      const tick = results[tIdx];
      if (!tick) return;
      if (tick.p0Hit || tick.p1Hit) sfx('hit');
      else if (tick.lasers.length > 0) sfx('laser');
      else if (tick.p0Shield || tick.p1Shield) sfx('shield');
      else sfx('move');
    };
    playTickSfx(0);

    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      if (tick < results.length) {
        setCurrentTick(tick);
        playTickSfx(tick);
      } else {
        clearInterval(interval);
        const finalTick = results[results.length - 1];

        setGame((prev) => {
          if (prev.state !== 'executing') return prev;
          let p0Score = prev.players[0].score;
          let p1Score = prev.players[1].score;

          // If someone was eliminated -> round ends
          if (finalTick.p0Hit || finalTick.p1Hit) {
            let roundWinnerIdx = -1;
            if (finalTick.p1Hit && !finalTick.p0Hit) {
              p0Score++;
              roundWinnerIdx = 0;
              sfx('win');
            } else if (finalTick.p0Hit && !finalTick.p1Hit) {
              p1Score++;
              roundWinnerIdx = 1;
              sfx('fold');
            } else {
              sfx('paradox');
            }

            let matchWinner: string | null = null;
            let nextState: ChronosGameState['state'] = 'round_over';
            if (p0Score >= prev.winScore) {
              matchWinner = prev.players[0].uid;
              nextState = 'finished';
              confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
            } else if (p1Score >= prev.winScore) {
              matchWinner = prev.players[1].uid;
              nextState = 'finished';
            }

            return {
              ...prev,
              state: nextState,
              roundWinnerIdx,
              matchWinner,
              players: [
                { ...prev.players[0], score: p0Score, ready: false, pastActions: [] },
                { ...prev.players[1], score: p1Score, ready: false, pastActions: [] },
              ],
            };
          }

          // No one died -> Time-Loop Rewind!
          sfx('paradox');
          return {
            ...prev,
            state: 'programming',
            turn: prev.turn + 1,
            executionResults: null,
            executionId: null,
            players: [
              {
                ...prev.players[0],
                ready: false,
                pastActions: [...prev.players[0].actions],
              },
              {
                ...prev.players[1],
                ready: false,
                pastActions: [...prev.players[1].actions],
              },
            ],
          };
        });
      }
    }, 750);

    return () => clearInterval(interval);
  }, [game.executionId, game.state, sfx]);

  const handleLockIn = (humanActions: Action[]) => {
    if (game.state !== 'programming') return;

    const bot = game.players[1];
    const human = game.players[0];
    const botActions = pickBotChronosActions(
      bot.pastActions,
      human.pastActions,
      game.obstacles,
      difficulty
    );

    const results = simulateTicks(humanActions, botActions, game.obstacles);

    setGame((prev) => ({
      ...prev,
      state: 'executing',
      executionResults: results,
      executionId: Math.random().toString(36).slice(2),
      players: [
        { ...prev.players[0], actions: humanActions, ready: true },
        { ...prev.players[1], actions: botActions, ready: true },
      ],
    }));
  };

  const handleNextRound = () => {
    const { mapId, obstacles } = pickRoundMap(mapPref);
    setCurrentTick(-1);
    setGame((prev) => ({
      ...prev,
      state: 'programming',
      turn: 1,
      round: prev.round + 1,
      mapId,
      obstacles,
      roundWinnerIdx: null,
      executionResults: null,
      executionId: null,
      players: prev.players.map((p) => ({
        ...p,
        ready: false,
        readyForNext: false,
        actions: ['W', 'W', 'W', 'W', 'W'],
        pastActions: [],
      })),
    }));
  };

  const handlePlayAgain = () => {
    setCurrentTick(-1);
    setGame(createInitialGame());
  };

  return (
    <ChronosArena
      game={game}
      meIdx={0}
      currentTick={currentTick}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/chronos')}
      onLockIn={handleLockIn}
      onNextRound={handleNextRound}
      onPlayAgain={handlePlayAgain}
    />
  );
}

export default function SoloChronosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#04060c] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-cyan-400">
          Initializing Chronos Loop...
        </div>
      }
    >
      <SoloChronosContent />
    </Suspense>
  );
}
