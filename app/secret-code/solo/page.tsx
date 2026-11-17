'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  BotDifficulty,
  generateUniqueSecretCodePuzzle,
  verifySecretCodeGuess,
} from '@/lib/secret-code';
import { playSound } from '@/lib/sounds';
import {
  SecretCodeArena,
  SecretCodeArenaGame,
} from '@/components/secret-code/SecretCodeArena';

function SoloSecretCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const playerName = (searchParams.get('name') || 'Agent').slice(0, 20);
  const totalRounds = Math.min(15, Math.max(1, Number(searchParams.get('rounds')) || 5));
  const rawDiff = searchParams.get('difficulty');
  const difficulty: BotDifficulty =
    rawDiff === 'casual' || rawDiff === 'master' ? rawDiff : 'sharp';

  const createInitialGame = useCallback((): SecretCodeArenaGame => {
    const puzzle = generateUniqueSecretCodePuzzle();
    const botLabel =
      difficulty === 'master'
        ? 'Grandmaster Bot'
        : difficulty === 'casual'
        ? 'Casual Bot'
        : 'Sharp Bot';
    return {
      mode: 'solo',
      creatorId: 'human',
      state: 'playing',
      phase: 'deducing',
      round: 1,
      totalRounds,
      maxPlayers: 2,
      cards: puzzle.cards,
      rules: puzzle.rules,
      secretIndices: puzzle.secretIndices,
      roundWinnerUid: null,
      matchWinnerUids: [],
      players: [
        {
          uid: 'human',
          nickname: playerName,
          score: 0,
          eliminatedThisRound: false,
          lastGuess: [],
        },
        {
          uid: 'bot',
          nickname: botLabel,
          isBot: true,
          score: 0,
          eliminatedThisRound: false,
          lastGuess: [],
        },
      ],
    };
  }, [difficulty, playerName, totalRounds]);

  const [game, setGame] = useState<SecretCodeArenaGame>(() => createInitialGame());
  const [soundEnabled, setSoundEnabled] = useState(true);

  const triggerSound = useCallback(
    (type: 'deal' | 'chip' | 'win' | 'snipe' | 'fold' | 'reaction') => {
      if (soundEnabled) playSound(type);
    },
    [soundEnabled]
  );

  useEffect(() => {
    if (game.state !== 'playing' || game.phase !== 'deducing') return;
    const bot = game.players.find((p) => p.uid === 'bot');
    const human = game.players.find((p) => p.uid === 'human');
    if (!bot || bot.eliminatedThisRound) return;

    const humanOut = Boolean(human?.eliminatedThisRound);
    const delayMs = humanOut
      ? 2200
      : difficulty === 'master'
      ? 14000 + Math.floor(Math.random() * 6000)
      : difficulty === 'sharp'
      ? 24000 + Math.floor(Math.random() * 8000)
      : 35000 + Math.floor(Math.random() * 10000);

    const timer = setTimeout(() => {
      setGame((prev) => {
        if (prev.state !== 'playing' || prev.phase !== 'deducing') return prev;
        const currBot = prev.players.find((p) => p.uid === 'bot');
        const currHuman = prev.players.find((p) => p.uid === 'human');
        if (!currBot || currBot.eliminatedThisRound) return prev;

        const mistakeProb =
          currHuman?.eliminatedThisRound
            ? 0
            : difficulty === 'casual'
            ? 0.35
            : difficulty === 'sharp'
            ? 0.15
            : 0.05;

        if (Math.random() < mistakeProb) {
          const wrongGuess = [...prev.secretIndices];
          wrongGuess[3] = (wrongGuess[3] + 1) % 26;
          if (wrongGuess.slice(0, 3).includes(wrongGuess[3])) {
            wrongGuess[3] = (wrongGuess[3] + 5) % 26;
          }
          triggerSound('fold');
          return {
            ...prev,
            players: prev.players.map((p) =>
              p.uid === 'bot'
                ? { ...p, eliminatedThisRound: true, lastGuess: wrongGuess }
                : p
            ),
          };
        }

        triggerSound('snipe');
        return {
          ...prev,
          phase: 'round_over',
          roundWinnerUid: 'bot',
          players: prev.players.map((p) =>
            p.uid === 'bot'
              ? { ...p, score: p.score + 1, lastGuess: prev.secretIndices }
              : p
          ),
        };
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [difficulty, game.phase, game.players, game.round, game.state, triggerSound]);

  const handleSubmitGuess = (guessIndices: number[]) => {
    if (game.state !== 'playing' || game.phase !== 'deducing') return;

    const { isCorrect } = verifySecretCodeGuess(
      guessIndices,
      game.secretIndices,
      game.cards,
      game.rules
    );

    if (isCorrect) {
      triggerSound('win');
      setGame((prev) => ({
        ...prev,
        phase: 'round_over',
        roundWinnerUid: 'human',
        players: prev.players.map((p) =>
          p.uid === 'human'
            ? { ...p, score: p.score + 1, lastGuess: guessIndices }
            : p
        ),
      }));
    } else {
      triggerSound('fold');
      setGame((prev) => {
        const updatedPlayers = prev.players.map((p) =>
          p.uid === 'human'
            ? { ...p, eliminatedThisRound: true, lastGuess: guessIndices }
            : p
        );
        const allEliminated = updatedPlayers.every((p) => p.eliminatedThisRound);
        return {
          ...prev,
          phase: allEliminated ? 'round_over' : 'deducing',
          roundWinnerUid: null,
          players: updatedPlayers,
        };
      });
    }
  };

  const handleNextRound = () => {
    if (game.round >= game.totalRounds) {
      const topScore = Math.max(...game.players.map((p) => p.score));
      const winners = game.players
        .filter((p) => p.score === topScore)
        .map((p) => p.uid);

      if (winners.includes('human')) {
        triggerSound('win');
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
      setGame((prev) => ({
        ...prev,
        state: 'finished',
        matchWinnerUids: winners,
      }));
      return;
    }

    triggerSound('deal');
    const nextPuzzle = generateUniqueSecretCodePuzzle();
    setGame((prev) => ({
      ...prev,
      phase: 'deducing',
      round: prev.round + 1,
      cards: nextPuzzle.cards,
      rules: nextPuzzle.rules,
      secretIndices: nextPuzzle.secretIndices,
      roundWinnerUid: null,
      players: prev.players.map((p) => ({
        ...p,
        eliminatedThisRound: false,
        lastGuess: [],
      })),
    }));
  };

  const handlePlayAgain = () => {
    triggerSound('deal');
    setGame(createInitialGame());
  };

  return (
    <SecretCodeArena
      game={game}
      meUid="human"
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled((s) => !s)}
      onExit={() => router.push('/secret-code')}
      onSubmitGuess={handleSubmitGuess}
      onNextRound={handleNextRound}
      onPlayAgain={handlePlayAgain}
    />
  );
}

export default function SoloSecretCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050508] flex items-center justify-center text-zinc-400 font-mono text-xs uppercase tracking-widest">
          Generating cipher puzzle...
        </div>
      }
    >
      <SoloSecretCodeContent />
    </Suspense>
  );
}
