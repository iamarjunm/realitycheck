'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  BotDifficulty,
  dealMemoryPokerRound,
  evaluateFiveCardHand,
  pickBotMemoryPositions,
} from '@/lib/memory-poker';
import { playSound } from '@/lib/sounds';
import {
  MemoryPokerArena,
  ArenaGameState,
  ArenaPlayer,
} from '@/components/memory-poker/MemoryPokerArena';

function SoloMemoryPokerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const playerName = (searchParams.get('name') || 'Player').slice(0, 20);
  const playerCrest = (searchParams.get('crest') || '♠').slice(0, 4);
  const totalRounds = Math.min(15, Math.max(1, Number(searchParams.get('rounds')) || 5));
  const memorizeSeconds = Math.min(60, Math.max(5, Number(searchParams.get('memTime')) || 20));
  const rawDiff = searchParams.get('difficulty');
  const difficulty: BotDifficulty =
    rawDiff === 'casual' || rawDiff === 'master' ? rawDiff : 'sharp';

  const selectSeconds = 25;

  const createInitialGame = useCallback((): ArenaGameState => {
    const { gridCards, communityCards } = dealMemoryPokerRound();
    const botLabel =
      difficulty === 'master'
        ? 'Grandmaster Bot'
        : difficulty === 'casual'
        ? 'Casual Bot'
        : 'Sharp Bot';
    return {
      mode: 'solo',
      state: 'playing',
      phase: 'memorize',
      round: 1,
      totalRounds,
      memorizeSeconds,
      selectSeconds,
      maxPlayers: 2,
      gridCards,
      communityCards,
      players: [
        {
          uid: 'human',
          nickname: playerName,
          crest: playerCrest,
          score: 0,
          readyMemorize: false,
          selectedIndices: [],
          lockedIn: false,
        },
        {
          uid: 'bot',
          nickname: botLabel,
          crest: '★',
          isBot: true,
          score: 0,
          readyMemorize: true,
          selectedIndices: [],
          lockedIn: false,
        },
      ],
      roundWinnerUids: [],
      matchWinnerUids: [],
      creatorId: 'human',
    };
  }, [difficulty, memorizeSeconds, playerCrest, playerName, totalRounds]);

  const [game, setGame] = useState<ArenaGameState>(() => createInitialGame());
  const [secondsLeft, setSecondsLeft] = useState<number>(memorizeSeconds);
  const [localSelection, setLocalSelection] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const triggerSound = useCallback(
    (type: Parameters<typeof playSound>[0]) => {
      if (soundEnabled) playSound(type);
    },
    [soundEnabled]
  );

  const resolveShowdown = useCallback(
    (currentGame: ArenaGameState, humanPick: number[], botPick: number[]): ArenaGameState => {
      const humanEval = evaluateFiveCardHand([
        ...currentGame.communityCards,
        currentGame.gridCards[humanPick[0]],
        currentGame.gridCards[humanPick[1]],
      ]);
      const botEval = evaluateFiveCardHand([
        ...currentGame.communityCards,
        currentGame.gridCards[botPick[0]],
        currentGame.gridCards[botPick[1]],
      ]);

      const maxScore = Math.max(humanEval.score, botEval.score);
      const winners: string[] = [];
      if (humanEval.score === maxScore) winners.push('human');
      if (botEval.score === maxScore) winners.push('bot');

      const updatedPlayers: ArenaPlayer[] = currentGame.players.map((p) => {
        const isHuman = p.uid === 'human';
        const picks = isHuman ? humanPick : botPick;
        const ev = isHuman ? humanEval : botEval;
        const wonRound = winners.includes(p.uid);
        return {
          ...p,
          selectedIndices: picks,
          lockedIn: true,
          score: p.score + (wonRound ? 1 : 0),
          lastHandName: ev.name,
          lastHandDetail: ev.detail,
          lastHandScore: ev.score,
        };
      });

      if (winners.includes('human')) {
        triggerSound('win');
      } else {
        triggerSound('fold');
      }

      return {
        ...currentGame,
        phase: 'showdown',
        players: updatedPlayers,
        roundWinnerUids: winners,
      };
    },
    [triggerSound]
  );

  const enterSelectPhase = useCallback(() => {
    triggerSound('flip');
    setLocalSelection([]);
    setSecondsLeft(selectSeconds);
    setGame((prev) => {
      if (prev.phase !== 'memorize') return prev;
      return {
        ...prev,
        phase: 'select',
        players: prev.players.map((p) => ({
          ...p,
          readyMemorize: true,
          selectedIndices: [],
          lockedIn: false,
        })),
      };
    });
  }, [selectSeconds, triggerSound]);

  useEffect(() => {
    if (game.state !== 'playing' || game.phase !== 'select') return;
    const bot = game.players.find((p) => p.uid === 'bot');
    if (!bot || bot.lockedIn) return;

    const timer = setTimeout(() => {
      const botPicks = pickBotMemoryPositions(game.communityCards, game.gridCards, difficulty);
      setGame((prev) => {
        if (prev.phase !== 'select') return prev;
        const human = prev.players.find((p) => p.uid === 'human');
        if (human?.lockedIn) {
          return resolveShowdown(prev, human.selectedIndices, botPicks);
        }
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.uid === 'bot' ? { ...p, selectedIndices: botPicks, lockedIn: true } : p
          ),
        };
      });
    }, 850);

    return () => clearTimeout(timer);
  }, [difficulty, game.communityCards, game.gridCards, game.phase, game.players, game.state, resolveShowdown]);

  useEffect(() => {
    if (game.state !== 'playing' || game.phase === 'showdown') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (game.phase === 'memorize') {
            setTimeout(() => enterSelectPhase(), 0);
          } else if (game.phase === 'select') {
            setTimeout(() => {
              setGame((curr) => {
                if (curr.phase !== 'select') return curr;
                const human = curr.players.find((p) => p.uid === 'human');
                const bot = curr.players.find((p) => p.uid === 'bot');
                const finalHuman = [...localSelection];
                while (finalHuman.length < 2) {
                  const candidate = Math.floor(Math.random() * 16);
                  if (!finalHuman.includes(candidate)) finalHuman.push(candidate);
                }
                const botPicks =
                  bot && bot.selectedIndices.length === 2
                    ? bot.selectedIndices
                    : pickBotMemoryPositions(curr.communityCards, curr.gridCards, difficulty);

                if (human && human.lockedIn) {
                  return resolveShowdown(curr, human.selectedIndices, botPicks);
                }
                return resolveShowdown(curr, finalHuman, botPicks);
              });
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [difficulty, enterSelectPhase, game.phase, game.state, localSelection, resolveShowdown]);

  const handleToggleGridCard = (idx: number) => {
    if (game.phase !== 'select') return;
    setLocalSelection((prev) => {
      if (prev.includes(idx)) {
        triggerSound('card_remove');
        return prev.filter((item) => item !== idx);
      }
      triggerSound('card_pick');
      if (prev.length >= 2) {
        return [prev[1], idx];
      }
      return [...prev, idx];
    });
  };

  const handleLockInSelection = () => {
    if (game.phase !== 'select' || localSelection.length !== 2) return;
    triggerSound('reaction');

    setGame((prev) => {
      if (prev.phase !== 'select') return prev;
      const bot = prev.players.find((p) => p.uid === 'bot');
      if (bot && bot.lockedIn && bot.selectedIndices.length === 2) {
        return resolveShowdown(prev, localSelection, bot.selectedIndices);
      }
      return {
        ...prev,
        players: prev.players.map((p) =>
          p.uid === 'human'
            ? { ...p, selectedIndices: localSelection, lockedIn: true }
            : p
        ),
      };
    });
  };

  const handleNextRound = () => {
    if (game.round >= game.totalRounds) {
      const topScore = Math.max(...game.players.map((p) => p.score));
      const matchWinners = game.players
        .filter((p) => p.score === topScore)
        .map((p) => p.uid);

      if (matchWinners.includes('human')) {
        triggerSound('win');
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
      setGame((prev) => ({
        ...prev,
        state: 'finished',
        matchWinnerUids: matchWinners,
      }));
      return;
    }

    triggerSound('deal');
    const { gridCards, communityCards } = dealMemoryPokerRound();
    setLocalSelection([]);
    setSecondsLeft(memorizeSeconds);
    setGame((prev) => ({
      ...prev,
      phase: 'memorize',
      round: prev.round + 1,
      gridCards,
      communityCards,
      roundWinnerUids: [],
      players: prev.players.map((p) => ({
        ...p,
        readyMemorize: Boolean(p.isBot),
        selectedIndices: [],
        lockedIn: false,
      })),
    }));
  };

  const handlePlayAgain = () => {
    triggerSound('deal');
    setLocalSelection([]);
    setSecondsLeft(memorizeSeconds);
    setGame(createInitialGame());
  };

  return (
    <MemoryPokerArena
      game={game}
      meUid="human"
      secondsLeft={secondsLeft}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/memory-poker')}
      localSelection={localSelection}
      onToggleGridCard={handleToggleGridCard}
      onReadyMemorize={enterSelectPhase}
      onLockInSelection={handleLockInSelection}
      onNextRound={handleNextRound}
      onPlayAgain={handlePlayAgain}
    />
  );
}

export default function SoloMemoryPokerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050a08] flex items-center justify-center text-stone-400 font-mono text-xs uppercase tracking-widest">
          Shuffling deck...
        </div>
      }
    >
      <SoloMemoryPokerContent />
    </Suspense>
  );
}
