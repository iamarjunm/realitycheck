"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import type { DocumentSnapshot } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const sanitizeLog = (log: string) =>
  log
    .replace(/Bets revealed: P1 bet \d+, P2 bet \d+\.\s*/i, 'Bets revealed. ')
    .replace(/placed a bet\./i, 'locked in a bet.');

const CARDS = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'
];
const SUITS = ['H', 'D', 'C', 'S'];

type GameData = {
  state: 'waiting' | 'playing' | 'finished';
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
};

export default function GameRoom() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameData | null>(null);
  const [myBet, setMyBet] = useState(0);
  const [question, setQuestion] = useState('');
  const [guessCards, setGuessCards] = useState<string[]>(Array(8).fill(''));

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
        
        // Auto-join if waiting and I am not player1
        if (data.state === 'waiting' && data.player1 !== auth.currentUser?.uid) {
          joinAsPlayer2(data);
        }
        
        setGame(data);
      }
    });
    return () => unsub();
  }, [gameId, loading]);

  const joinAsPlayer2 = async (data: GameData) => {
    if (data.player2 || !auth.currentUser) return;
    
    let deck = [...data.deck];
    let p2Cards = deck.splice(0, 8);
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const rankValue = (r: string) => ranks.indexOf(r.slice(0, -1));
    p2Cards.sort((a, b) => rankValue(a) - rankValue(b));

    await updateDoc(doc(db, "games", gameId), {
      player2: auth.currentUser.uid,
      player2Cards: p2Cards,
      deck: deck,
      state: 'playing',
      roundCount: 1,
      logs: arrayUnion("Player 2 joined! Let the game begin. Place your bets.")
    });
  };

  if (loading || !game) return <div className="p-8 text-center text-white">Loading game...</div>;

  const isPlayer1 = auth.currentUser?.uid === game.player1;
  const isPlayer2 = auth.currentUser?.uid === game.player2;
  const isSpectator = !isPlayer1 && !isPlayer2;

  const myCards = isPlayer1 ? game.player1Cards : isPlayer2 ? game.player2Cards : [];
  const opponentCards = isPlayer1 ? game.player2Cards : isPlayer2 ? game.player1Cards : [];
  const myTokens = isPlayer1 ? game.player1Tokens : isPlayer2 ? game.player2Tokens : 0;

  const myBetSubmitted = isPlayer1 ? game.player1Bet !== null : game.player2Bet !== null;
  const opponentBetSubmitted = isPlayer1 ? game.player2Bet !== null : game.player1Bet !== null;

  const isActivePlayer = game.activePlayerId === auth.currentUser?.uid;

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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
          <h2 className="text-xl font-bold mb-4">Waiting for opponent...</h2>
          <p className="mb-2 text-zinc-400">Share this invite code with a friend:</p>
          <div className="bg-black p-4 rounded-xl font-mono text-lg mb-6 tracking-widest">{gameId}</div>
        </div>
      </div>
    );
  }

  const renderCard = (label: string, hidden = false) => {
    return (
      <div className="w-12 h-16 sm:w-16 sm:h-24 bg-white border-2 border-zinc-200 rounded-lg flex items-center justify-center shadow-sm font-bold text-sm sm:text-xl"
           style={{ color: label.includes('H') || label.includes('D') ? 'red' : 'black' }}>
        {hidden ? '?' : label}
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
              <h3 className="font-bold text-zinc-400 uppercase text-sm tracking-wider">Opponent&apos;s Cards</h3>
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
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => answerQuestion("Yes")} className="bg-white text-black px-10 py-4 rounded-xl font-bold hover:bg-zinc-200 transition text-lg tracking-wider">YES</button>
                    <button onClick={() => answerQuestion("No")} className="bg-zinc-800 text-white px-10 py-4 rounded-xl font-bold hover:bg-zinc-700 transition text-lg tracking-wider">NO</button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* My Area */}
          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex justify-between mb-4 items-center">
              <h3 className="font-bold text-white uppercase text-sm tracking-wider">Your Cards</h3>
              <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">Tokens: {myTokens}</span>
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
