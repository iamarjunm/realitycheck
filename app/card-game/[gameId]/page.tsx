"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import type { DocumentSnapshot } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

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

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto flex flex-col gap-6 text-white pt-24">
      {/* Header */}
      <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-4 border border-zinc-800 flex justify-between items-center text-center sm:text-left">
        <div>
          <h1 className="font-bold text-xl tracking-wide uppercase">Death Parade</h1>
          <p className="text-zinc-500 text-sm font-mono">Round {game.roundCount}</p>
        </div>
        {!isSpectator && (
          <div className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold font-mono">
            Your Tokens: {myTokens}
          </div>
        )}
        {game.state === 'finished' && (
          <div className="bg-green-600 px-6 py-2 rounded-xl font-bold">
            Player {game.winner === game.player1 ? '1' : '2'} WINS!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Play Area */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Opponent Area */}
          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex justify-between mb-4 items-center">
              <h3 className="font-bold text-zinc-400 uppercase text-sm tracking-wider">Opponent's Cards</h3>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {opponentCards.map((c, i) => renderCard(c, game.state !== 'finished'))}
            </div>
          </div>

          {/* Action Area */}
          {game.state === 'playing' && (
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl">
              <h3 className="font-bold mb-6 text-center text-zinc-300">
                {game.currentTurn === 'betting' && !myBetSubmitted && "YOUR TURN TO BET"}
                {game.currentTurn === 'betting' && myBetSubmitted && "WAITING FOR OPPONENT TO BET..."}
                {game.currentTurn === 'action' && isActivePlayer && "YOUR ACTION: ASK OR GUESS"}
                {game.currentTurn === 'action' && !isActivePlayer && "OPPONENT IS DECIDING..."}
                {game.currentTurn === 'answering' && game.activePlayerId !== auth.currentUser?.uid && "ANSWER THE QUESTION"}
                {game.currentTurn === 'answering' && game.activePlayerId === auth.currentUser?.uid && "WAITING FOR ANSWER..."}
              </h3>

              {game.currentTurn === 'betting' && !myBetSubmitted && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[0,1,2,3,4,5,6,7,8,9,10,11,12].filter(n => n <= myTokens).map(n => (
                      <button 
                        key={n} 
                        onClick={() => setMyBet(n)}
                        className={`w-12 h-12 rounded-full font-bold transition ${myBet === n ? 'bg-white text-black scale-110' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button onClick={submitBet} className="mt-4 w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-200 transition">
                    Lock Bet
                  </button>
                </div>
              )}

              {game.currentTurn === 'action' && isActivePlayer && (
                <div className="flex flex-col gap-6">
                  <div className="border border-zinc-800 bg-black/40 rounded-xl p-4">
                    <h4 className="font-bold text-sm text-zinc-400 mb-3 uppercase tracking-wider">Ask something</h4>
                    <div className="flex gap-2">
                      <input 
                        value={question} onChange={e => setQuestion(e.target.value)} 
                        placeholder="e.g. Do you have any red cards?" 
                        className="flex-grow bg-zinc-800 rounded-lg px-4 focus:outline-none"
                      />
                      <button onClick={askQuestion} disabled={!question} className="bg-white text-black px-6 py-2 rounded-lg font-bold disabled:opacity-50">Ask</button>
                    </div>
                  </div>
                  <div className="border border-zinc-800 bg-black/40 rounded-xl p-4">
                    <h4 className="font-bold text-sm text-zinc-400 mb-3 uppercase tracking-wider">Guess exact sequence (e.g. AH, 2C...)</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
                      {guessCards.map((g, i) => (
                        <input key={i} value={guessCards[i]} onChange={e => {
                          const n = [...guessCards]; n[i] = e.target.value; setGuessCards(n);
                        }} className="w-full text-center bg-zinc-800 rounded py-2 text-sm uppercase focus:outline-none font-bold placeholder:text-zinc-600" placeholder={`#${i+1}`} />
                      ))}
                    </div>
                    <button onClick={makeGuess} className="w-full bg-red-600 hover:bg-red-500 transition text-white py-3 rounded-lg font-bold uppercase tracking-widest">Submit Final Guess</button>
                  </div>
                </div>
              )}

              {game.currentTurn === 'answering' && game.activePlayerId !== auth.currentUser?.uid && (
                <div className="text-center py-4">
                  <div className="text-2xl font-serif italic mb-8 break-words text-zinc-300">"{game.pendingQuestion}"</div>
                  <button
                    onClick={promptAndSubmitAnswer}
                    className="rounded-xl bg-white px-10 py-4 text-lg font-bold tracking-wider text-black transition hover:bg-zinc-200"
                  >
                    Answer in Popup
                  </button>
                </div>
              )}

            </div>
          )}

          {/* My Area */}
          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex justify-between mb-4 items-center">
              <h3 className="font-bold text-white uppercase text-sm tracking-wider">Your Cards</h3>
              {!isSpectator && (
                <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold font-mono">
                  Tokens: {myTokens}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {myCards.map((c, i) => renderCard(c, false))}
            </div>
          </div>

        </div>

        {/* Sidebar Logs */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden max-h-[80vh]">
          <div className="bg-black/80 px-6 py-4 font-bold border-b border-zinc-800 text-sm tracking-widest text-zinc-400 uppercase">Event Log</div>
          <div className="p-4 flex-grow overflow-y-auto space-y-3 font-mono text-[11px] max-h-[600px] flex flex-col-reverse">
            {[...game.logs].reverse().map((l, i) => (
              <div key={i} className="text-zinc-400 border-l border-zinc-700 pl-3 py-1.5">{sanitizeLog(l)}</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
