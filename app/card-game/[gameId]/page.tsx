"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import type { DocumentSnapshot } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PokerTable } from '@/app/components/poker/PokerTable';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['H', 'C', 'D', 'S'];
const SUIT_SYMBOLS: Record<string, string> = {
  H: '♥',
  C: '♣',
  D: '♦',
  S: '♠',
};

const buildOrderedDeck = () => {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck;
};

const getCardRankValue = (card: string) => RANKS.indexOf(card.slice(0, -1));

const sanitizeLog = (log: string) =>
  log
    .replace(/Bets revealed: P1 bet \d+, P2 bet \d+\.\s*/i, 'Bets revealed. ')
    .replace(/placed a bet\./i, 'locked in a bet.');

const isValidPlacement = (cards: string[]) => {
  const lastSeenBySuit: Record<string, number> = {};

  for (const card of cards) {
    const suit = card.slice(-1);
    const rankValue = getCardRankValue(card);
    const lastSeen = lastSeenBySuit[suit];

    if (lastSeen !== undefined && rankValue < lastSeen) {
      return false;
    }

    lastSeenBySuit[suit] = rankValue;
  }

  return true;
};

type GameData = {
  state: 'selecting' | 'waiting' | 'playing' | 'finished';
  player1: string;
  player2: string | null;
  player1Cards: string[];
  player2Cards: string[];
  deck: string[];
  player1Tokens: number;
  player2Tokens: number;
  player1Bet: number | null;
  player2Bet: number | null;
  roundWinner: string | null; // 'player1', 'player2', 'tie'
  currentTurn: 'betting' | 'action' | 'answering';
  activePlayerId: string | null;
  winner: string | null;
  logs: string[];
  pendingQuestion?: string | null;
  roundCount?: number;
  player1Ready?: boolean;
  player2Ready?: boolean;
};

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_34%),linear-gradient(160deg,_#08090f,_#121826_55%,_#090b12)] text-white">
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="relative flex flex-col items-center gap-5 rounded-[2rem] border border-white/10 bg-white/10 px-8 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-white/15" />
          <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{label}</p>
          <p className="mt-1 text-sm text-white/55">Please wait a moment.</p>
        </div>
      </div>
    </div>
  );
}

export default function GameRoom() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameData | null>(null);
  const [myBet, setMyBet] = useState(0);
  const [question, setQuestion] = useState('');
  const [guessCards, setGuessCards] = useState<string[]>(Array(8).fill(''));
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const deck = buildOrderedDeck();

  useEffect(() => {
    const init = async () => {
      if (!auth.currentUser) await signInAnonymously(auth);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (loading || !auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "games", gameId), (docSnap: DocumentSnapshot) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameData;
        setGame(data);
      }
    });
    return () => unsub();
  }, [gameId, loading]);

  useEffect(() => {
    if (game?.currentTurn === 'betting' && game.player1Bet === null && game.player2Bet === null) {
      setMyBet(0);
    }
  }, [game?.currentTurn, game?.player1Bet, game?.player2Bet]);

  const toggleSelectedCard = (card: string) => {
    setSelectedCards(previous => {
      if (previous.includes(card)) {
        return previous.filter(entry => entry !== card);
      }

      if (previous.length >= 8) {
        return previous;
      }

      return [...previous, card];
    });
  };

  const submitSelection = async () => {
    if (!game || !auth.currentUser || selectedCards.length !== 8) return;

    if (!isValidPlacement(selectedCards)) {
      alert('Cards must be ascending within each suit from left to right.');
      return;
    }

    const currentUserIsPlayer1 = auth.currentUser.uid === game.player1;
    const currentUserIsPlayer2 = auth.currentUser.uid === game.player2;

    if (!currentUserIsPlayer1 && !currentUserIsPlayer2) return;

    const updates: Record<string, unknown> = {
      logs: arrayUnion(`${currentUserIsPlayer1 ? 'Player 1' : 'Player 2'} locked in their 8-card hand.`),
    };

    if (currentUserIsPlayer1) {
      updates.player1Cards = selectedCards;
      updates.player1Ready = true;
    } else {
      updates.player2Cards = selectedCards;
      updates.player2Ready = true;
    }

    const nextPlayer1Ready = currentUserIsPlayer1 ? true : Boolean(game.player1Ready);
    const nextPlayer2Ready = currentUserIsPlayer2 ? true : Boolean(game.player2Ready);

    if (nextPlayer1Ready && nextPlayer2Ready) {
      updates.state = 'playing';
      updates.currentTurn = 'betting';
      updates.roundCount = 1;
      updates.logs = arrayUnion('Both players locked in. Betting begins now.');
    }

    await updateDoc(doc(db, 'games', gameId), updates);
  };

  if (loading || !game) {
    return <LoadingScreen label="Loading game table" />;
  }

  const joinAsPlayer2 = async () => {
    if (!game || game.player2 || !auth.currentUser || auth.currentUser.uid === game.player1) return;

    await updateDoc(doc(db, "games", gameId), {
      player2: auth.currentUser.uid,
      player2Ready: false,
      state: 'selecting',
      logs: arrayUnion("Player 2 joined. Both players will now choose their hands.")
    });
  };

  const currentUserId = auth.currentUser?.uid;
  const isPlayer1 = currentUserId === game.player1;
  const isPlayer2 = currentUserId === game.player2;
  const isSpectator = !isPlayer1 && !isPlayer2;

  const myCards = isPlayer1 ? game.player1Cards : isPlayer2 ? game.player2Cards : [];
  const opponentCards = isPlayer1 ? game.player2Cards : isPlayer2 ? game.player1Cards : [];
  const myTokens = isPlayer1 ? game.player1Tokens : isPlayer2 ? game.player2Tokens : 0;

  const myBetSubmitted = isPlayer1 ? game.player1Bet !== null : game.player2Bet !== null;
  const opponentBetSubmitted = isPlayer1 ? game.player2Bet !== null : game.player1Bet !== null;

  const isActivePlayer = game.activePlayerId === currentUserId;

  const submitBet = async () => {
    if (myBet > myTokens) return alert("Not enough tokens");
    const updates: any = {};
    if (isPlayer1) updates.player1Bet = myBet;
    else updates.player2Bet = myBet;
    
    // Check if other player already bet
    if (opponentBetSubmitted) {
      // Resolve betting phase
      const p1b = isPlayer1 ? myBet : game.player1Bet!;
      const p2b = isPlayer2 ? myBet : game.player2Bet!;
      
      let p1Tokens = game.player1Tokens;
      let p2Tokens = game.player2Tokens;
      
      let winnerName = p1b > p2b ? "Player 1" : p2b > p1b ? "Player 2" : "Tie";
      let activePlayerId = p1b > p2b ? game.player1 : p2b > p1b ? game.player2 : null;
      let newTurn = p1b === p2b ? 'betting' : 'action';

      // Both players permanently lose whatever they bet
      p1Tokens -= p1b;
      p2Tokens -= p2b;

      let logMsg = `Bets revealed. Both players lose their bets. ${winnerName === 'Tie' ? 'Tie! Bet again.' : winnerName + ' wins the bid.'}`;
      
      if (winnerName === 'Tie') {
        // Start another betting round immediately
        updates.player1Bet = null;
        updates.player2Bet = null;
      }

      await updateDoc(doc(db, "games", gameId), {
        ...updates,
        player1Tokens: p1Tokens,
        player2Tokens: p2Tokens,
        player1Bet: null,
        player2Bet: null,
        currentTurn: newTurn,
        activePlayerId,
        roundWinner: p1b > p2b ? game.player1 : p2b > p1b ? game.player2 : 'tie',
        logs: arrayUnion(logMsg)
      });
    } else {
      updates.logs = arrayUnion(`Player ${isPlayer1 ? '1' : '2'} locked in a bet.`);
      await updateDoc(doc(db, "games", gameId), updates);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;
    await updateDoc(doc(db, "games", gameId), {
      currentTurn: 'answering',
      pendingQuestion: question,
      logs: arrayUnion(`Player ${isPlayer1 ? 1 : 2} asks: "${question}"`)
    });
    setQuestion('');
  };

  const answerQuestion = async (answer: string) => {
    await updateDoc(doc(db, "games", gameId), {
      currentTurn: 'betting', // next round
      player1Bet: null,
      player2Bet: null,
      player1Tokens: game.player1Tokens + 2,
      player2Tokens: game.player2Tokens + 2,
      roundCount: (game.roundCount || 1) + 1,
      logs: arrayUnion(`Opponent answers: ${answer}. New round starting! +2 tokens.`)
    });
  };

  const promptAndSubmitAnswer = () => {
    const promptLabel = game.pendingQuestion
      ? `Answer this question:\n${game.pendingQuestion}`
      : 'Enter your answer';
    const answer = window.prompt(promptLabel);
    if (answer === null) return;

    const cleanedAnswer = answer.trim();
    if (!cleanedAnswer) return;

    answerQuestion(cleanedAnswer);
  };

  const makeGuess = async () => {
    if (guessCards.some(c => c === '')) return alert("Fill all 8 cards");
    const cleanGuess = guessCards.map(g => g.trim().toUpperCase());
    const isCorrect = cleanGuess.join(',') === opponentCards.join(',');
    
    if (isCorrect) {
      await updateDoc(doc(db, "games", gameId), {
        state: 'finished',
        winner: auth.currentUser?.uid,
        logs: arrayUnion(`Player ${isPlayer1 ? 1 : 2} guessed correctly and wins the game!!!`)
      });
    } else {
      alert('Wrong guess. The round continues.');
      await updateDoc(doc(db, "games", gameId), {
        currentTurn: 'betting', // next round
        player1Bet: null,
        player2Bet: null,
        player1Tokens: game.player1Tokens + 2,
        player2Tokens: game.player2Tokens + 2,
        roundCount: (game.roundCount || 1) + 1,
        logs: arrayUnion(`Player ${isPlayer1 ? 1 : 2} guessed WRONG. New round starts.`)
      });
    }
  };

  if (game.state === 'waiting') {
    const isPlayer1 = auth.currentUser?.uid === game.player1;

    if (isPlayer1) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_34%),linear-gradient(160deg,_#08090f,_#121826_55%,_#090b12)] text-white">
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <h2 className="text-xl font-bold mb-4">Waiting for opponent...</h2>
            <p className="mb-2 text-white/70">Share this invite code with a friend:</p>
            <div className="bg-black/40 p-4 rounded-xl font-mono text-lg mb-6 tracking-widest">{gameId}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_34%),linear-gradient(160deg,_#08090f,_#121826_55%,_#090b12)] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <h2 className="text-xl font-bold mb-4">Join the room</h2>
          <p className="mb-2 text-white/70">You can join now and then both players will pick cards on the next screen.</p>
          <button onClick={joinAsPlayer2} className="mt-4 rounded-xl bg-white px-6 py-3 font-semibold text-zinc-950 hover:bg-zinc-100 transition">
            Join Game
          </button>
          <div className="mt-6 bg-black/40 p-4 rounded-xl font-mono text-lg tracking-widest">{gameId}</div>
        </div>
      </div>
    );
  }

  if (game.state === 'selecting') {
    if (isSpectator) {
      return <LoadingScreen label="Waiting for players to lock in" />;
    }

    const currentPlayerReady = isPlayer1 ? Boolean(game.player1Ready) : Boolean(game.player2Ready);

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_34%),linear-gradient(160deg,_#08090f,_#121826_55%,_#090b12)] text-white">
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="relative w-full max-w-6xl rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.45)] p-6 sm:p-8 text-white">
          <div className="mb-8 space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl">♠</div>
            <h1 className="text-3xl font-black tracking-tight">Select Your 8 Cards</h1>
            <p className="text-sm text-white/70 leading-6">
              Pick your hand in left-to-right order. Cards can mix suits, but each suit must stay ascending.
            </p>
          </div>

            <div className="mb-6 rounded-3xl border border-white/10 bg-black/25 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
                  {isPlayer1 ? 'Player 1 hand' : 'Player 2 hand'}
                </h2>
                <p className="text-xs text-white/45">Selected {selectedCards.length}/8</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCards([])}
                className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Clear
              </button>
            </div>

            <div className="grid max-h-[28rem] grid-cols-4 gap-3 overflow-y-auto pr-1 sm:grid-cols-6 lg:[grid-template-columns:repeat(13,minmax(0,1fr))]">
              {deck.map(card => {
                const rank = card.slice(0, -1);
                const suit = card.slice(-1);
                const isRed = suit === 'H' || suit === 'D';
                const isSelected = selectedCards.includes(card);

                return (
                  <button
                    key={card}
                    type="button"
                    onClick={() => toggleSelectedCard(card)}
                    className={`group flex h-20 flex-col justify-between rounded-2xl border p-2.5 text-[11px] font-semibold transition duration-200 ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-300 text-zinc-950 shadow-[0_12px_28px_rgba(16,185,129,0.25)] -translate-y-0.5'
                        : 'border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] text-white hover:border-white/25 hover:-translate-y-1 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))]'
                    }`}
                  >
                    <div className="flex items-start justify-between leading-none">
                      <span className={`text-sm ${isRed ? 'text-rose-300' : 'text-white'}`}>{rank}</span>
                      <span className={`text-sm ${isRed ? 'text-rose-300' : 'text-white'}`}>{SUIT_SYMBOLS[suit]}</span>
                    </div>
                    <div className={`flex flex-1 items-center justify-center text-2xl ${isRed ? 'text-rose-300' : 'text-white'} drop-shadow-sm`}>
                      {SUIT_SYMBOLS[suit]}
                    </div>
                    <div className="flex items-end justify-between leading-none rotate-180">
                      <span className={`text-sm ${isRed ? 'text-rose-300' : 'text-white'}`}>{rank}</span>
                      <span className={`text-sm ${isRed ? 'text-rose-300' : 'text-white'}`}>{SUIT_SYMBOLS[suit]}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex min-h-16 flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
              {selectedCards.length === 0 ? (
                <span className="self-center text-sm text-white/45">Your selected cards will appear here in order.</span>
              ) : (
                selectedCards.map(card => (
                  <span key={card} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold">
                    {card}
                  </span>
                ))
              )}
            </div>

            <p className="mt-3 text-xs text-white/45">
              The rule is local ascending by suit, so cards like 2C, 4D, 6H are valid as long as each suit never goes backwards.
            </p>
          </div>

          <button
            onClick={submitSelection}
            disabled={selectedCards.length !== 8 || currentPlayerReady}
            className="w-full rounded-xl bg-white py-3.5 font-semibold text-zinc-950 shadow-lg shadow-black/20 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {currentPlayerReady ? 'Hand Locked' : 'Lock In Hand'}
          </button>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-white/60">
            {currentPlayerReady ? 'Waiting for the other player to lock their hand.' : 'Lock your hand when ready.'}
          </div>
        </div>
      </div>
    );
  }

  const renderCard = (label: string, hidden = false) => {
    const rank = label.slice(0, -1);
    const suit = label.slice(-1);
    const isRed = suit === 'H' || suit === 'D';
    const suitSymbol = SUIT_SYMBOLS[suit] ?? suit;

    return (
      <div className="relative h-24 w-16 sm:h-32 sm:w-20 rounded-2xl border border-zinc-300 bg-gradient-to-br from-white via-zinc-50 to-zinc-200 p-2 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
        {hidden ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.24),_transparent_40%),linear-gradient(135deg,#14213d,#0f172a_45%,#1e293b)] text-2xl text-white/90">
            ★
          </div>
        ) : (
          <>
            <div className={`flex h-full w-full flex-col justify-between rounded-xl ${isRed ? 'text-rose-600' : 'text-zinc-900'}`}>
              <div className="flex items-start justify-between text-[11px] font-semibold leading-none">
                <span>{rank}</span>
                <span>{suitSymbol}</span>
              </div>
              <div className="flex flex-1 items-center justify-center text-2xl sm:text-3xl font-bold">
                {suitSymbol}
              </div>
              <div className="flex items-end justify-between text-[11px] font-semibold leading-none rotate-180">
                <span>{rank}</span>
                <span>{suitSymbol}</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const turnLabel =
    game.currentTurn === 'betting' && !myBetSubmitted ? 'Your turn to bet' :
    game.currentTurn === 'betting' && myBetSubmitted ? 'Waiting for opponent bet' :
    game.currentTurn === 'action' && isActivePlayer ? 'Your action' :
    game.currentTurn === 'action' ? 'Opponent deciding' :
    game.currentTurn === 'answering' && game.activePlayerId !== auth.currentUser?.uid ? 'Answer the question' :
    game.currentTurn === 'answering' ? 'Waiting for answer' : 'Playing';

  return (
    <div className="min-h-screen bg-[#050a08] text-white flex flex-col lg:flex-row gap-0 lg:gap-4 p-4">
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-900/40 bg-black/60 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-4">
            <Link href="/card-games" className="text-zinc-500 hover:text-white transition-colors"><ArrowLeft size={18} /></Link>
            <div>
              <h1 className="font-black uppercase tracking-tight text-lg">Death Parade</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Round {game.roundCount ?? '—'}</p>
            </div>
          </div>
          {!isSpectator && (
            <div className="rounded-full border border-emerald-500/30 bg-emerald-950/50 px-4 py-1.5 text-sm font-bold font-mono text-emerald-200">
              Your Tokens: {myTokens}
            </div>
          )}
          {game.state === 'finished' && (
            <div className="rounded-xl bg-emerald-600 px-5 py-2 font-black uppercase text-sm">
              Player {game.winner === game.player1 ? '1' : '2'} Wins
            </div>
          )}
        </div>

        <div className="flex-1 relative rounded-[2rem] border border-emerald-900/30 bg-[#060d0a] p-4 min-h-[420px]">
          <PokerTable
            variant="emerald"
            potLabel={!isSpectator ? `YOUR TOKENS: ${myTokens}` : 'SPECTATING'}
            phaseLabel={turnLabel}
            className="h-full !min-h-[360px]"
          >
            {/* Opponent — top of table */}
            <div className="absolute top-[8%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Opponent</div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center max-w-[90vw]">
                {opponentCards.map((c, i) => renderCard(c, game.state !== 'finished'))}
              </div>
            </div>

            {/* Your hand — bottom of table */}
            {!isSpectator && (
              <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400/80">Your Hand</div>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
                  {myCards.map((c, i) => renderCard(c, false))}
                </div>
              </div>
            )}
          </PokerTable>
        </div>

        {game.state === 'playing' && (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/90 p-5 backdrop-blur shadow-xl">
            <h3 className="font-black mb-4 text-center text-xs uppercase tracking-[0.25em] text-zinc-400">{turnLabel}</h3>

            {game.currentTurn === 'betting' && !myBetSubmitted && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {[0,1,2,3,4,5,6,7,8,9,10,11,12].filter(n => n <= myTokens).map(n => (
                    <button key={n} onClick={() => setMyBet(n)} className={`h-11 w-11 rounded-full font-bold transition ${myBet === n ? 'bg-emerald-400 text-black scale-110 shadow-lg' : 'bg-zinc-900 border border-white/10 hover:border-emerald-500/50'}`}>{n}</button>
                  ))}
                </div>
                <button onClick={submitBet} className="w-full bg-white text-black py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-100 transition">Lock Bet</button>
              </div>
            )}

            {game.currentTurn === 'action' && isActivePlayer && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Ask</h4>
                  <div className="flex gap-2">
                    <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Any red cards?" className="flex-1 bg-zinc-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 border border-transparent" />
                    <button onClick={askQuestion} disabled={!question} className="bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-40">Ask</button>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Final guess</h4>
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {guessCards.map((g, i) => (
                      <input key={i} value={guessCards[i]} onChange={e => { const n = [...guessCards]; n[i] = e.target.value; setGuessCards(n); }} className="w-full text-center bg-zinc-900 rounded py-1.5 text-xs uppercase font-bold" placeholder={`${i+1}`} />
                    ))}
                  </div>
                  <button onClick={makeGuess} className="w-full bg-red-600 hover:bg-red-500 py-2.5 rounded-lg font-bold uppercase text-xs tracking-widest">Submit Guess</button>
                </div>
              </div>
            )}

            {game.currentTurn === 'answering' && game.activePlayerId !== auth.currentUser?.uid && (
              <div className="text-center py-2">
                <p className="text-lg italic text-zinc-300 mb-6">&ldquo;{game.pendingQuestion}&rdquo;</p>
                <button onClick={promptAndSubmitAnswer} className="rounded-xl bg-white px-8 py-3 font-bold text-black hover:bg-zinc-100">Answer</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:w-72 xl:w-80 flex flex-col rounded-2xl border border-white/10 bg-zinc-950/80 overflow-hidden max-h-[40vh] lg:max-h-none lg:min-h-[500px]">
        <div className="px-4 py-3 border-b border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Event Log</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px]">
          {[...game.logs].reverse().map((l, i) => (
            <div key={i} className="text-zinc-500 border-l-2 border-emerald-900 pl-3 py-1">{sanitizeLog(l)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
