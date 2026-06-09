"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { AnimatePresence, motion } from 'motion/react';
import { Crosshair, UserRound, ArrowRight, ShieldAlert, Info, X, Zap } from 'lucide-react';
import { playSound } from '@/lib/sounds';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const AVATARS = ['Jack', 'King', 'Queen', 'Joker', 'Ace', 'Spade', 'Heart', 'Club', 'Diamond', 'Sniper', 'Bullet', 'Ghost'];
const REACTIONS = ['😂', '😡', '😎', '🎉', '🔥', '💀', '🤡', '🤑'];

const HAND_TYPES = [
    "High Card", "Pair", "Two Pair", "Three of a Kind", 
    "Straight", "Flush", "Full House", "Four of a Kind", "Straight Flush", "Royal Flush"
];

const HAND_RANKINGS_INFO = [
    { name: "Royal Flush", desc: "A, K, Q, J, 10, all same suit." },
    { name: "Straight Flush", desc: "Five cards in a sequence, all same suit." },
    { name: "Four of a Kind", desc: "All four cards of the same rank." },
    { name: "Full House", desc: "Three of a kind with a pair." },
    { name: "Flush", desc: "Any five cards of the same suit, not in sequence." },
    { name: "Straight", desc: "Five cards in a sequence, but not of the same suit." },
    { name: "Three of a Kind", desc: "Three cards of the same rank." },
    { name: "Two Pair", desc: "Two different pairs." },
    { name: "Pair", desc: "Two cards of the same rank." },
    { name: "High Card", desc: "When you haven't made any of the hands above." }
];

// Reusing poker hand evaluation
function getCombinations(arr: any[], k: number) {
    let results: any[] = [];
    function helper(start: number, combo: any[]) {
        if (combo.length === k) { results.push([...combo]); return; }
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            helper(i + 1, combo);
            combo.pop();
        }
    }
    helper(0, []);
    return results;
}

const evaluate5Cards = (cards: any[]) => {
    let sorted = [...cards].sort((a, b) => b.rank - a.rank);
    let counts: any = {};
    let suits: any = {};
    sorted.forEach(c => {
        counts[c.rank] = (counts[c.rank] || 0) + 1;
        suits[c.suit] = (suits[c.suit] || 0) + 1;
    });

    let isFlush = Object.keys(suits).length === 1;
    let isStraight = true;
    for (let i = 0; i < 4; i++) {
        if (sorted[i].rank - sorted[i + 1].rank !== 1) isStraight = false;
    }
    let isLowStraight = false;
    if (sorted[0].rank === 14 && sorted[1].rank === 5 && sorted[2].rank === 4 && sorted[3].rank === 3 && sorted[4].rank === 2) {
        isStraight = true;
        isLowStraight = true;
    }

    let freq: any[] = [];
    Object.keys(counts).forEach(k => freq.push({ rank: parseInt(k), count: counts[k] }));
    freq.sort((a, b) => b.count - a.count || b.rank - a.rank);

    let type = 0;
    let name = "High Card";

    let primaryRank = freq[0].rank;

    if (isStraight && isFlush) {
        type = sorted[0].rank === 14 && !isLowStraight ? 9 : 8;
        name = type === 9 ? "Royal Flush" : "Straight Flush";
        primaryRank = isLowStraight ? 5 : sorted[0].rank;
    } else if (freq[0].count === 4) { type = 7; name = "Four of a Kind"; }
    else if (freq[0].count === 3 && freq[1].count === 2) { type = 6; name = "Full House"; }
    else if (isFlush) { type = 5; name = "Flush"; primaryRank = sorted[0].rank; }
    else if (isStraight) { 
        type = 4; name = "Straight"; 
        primaryRank = isLowStraight ? 5 : sorted[0].rank;
    }
    else if (freq[0].count === 3) { type = 3; name = "Three of a Kind"; }
    else if (freq[0].count === 2 && freq[1].count === 2) { type = 2; name = "Two Pair"; }
    else if (freq[0].count === 2) { type = 1; name = "Pair"; }

    let score = type * 10000000000;
    if (isLowStraight) {
        score += 5 * 100000000;
    } else {
        let multiplier = 100000000;
        for (let i = 0; i < freq.length; i++) {
            score += freq[i].rank * multiplier;
            multiplier /= 100;
        }
    }

    return { score, type, name, primaryRank };
};

const getBestHand = (sevenCardsStr: string[]) => {
    let cards = sevenCardsStr.map(c => {
        let s = c.slice(-1);
        let rs = c.slice(0, -1);
        let r = rs === 'A' ? 14 : rs === 'K' ? 13 : rs === 'Q' ? 12 : rs === 'J' ? 11 : parseInt(rs);
        return { rank: r, suit: s };
    });
    if (cards.length < 5) return { score: -1, type: -1, name: "Incomplete", primaryRank: -1 };
    const combs = getCombinations(cards, 5);
    let best = { score: -1, type: -1, name: "", primaryRank: -1 };
    for (const comb of combs) {
        const ev = evaluate5Cards(comb);
        if (ev.score > best.score) best = ev as any;
    }
    return best;
};

const buildDeck = () => {
    let d = [];
    for (let s of SUITS) for (let r of RANKS) d.push(r + s);
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
};

type Snipe = { type: number, rank: number };

type PlayerState = {
  uid: string;
  nickname: string;
  avatar: string;
  chips: number;
  bet: number;
  cards: string[];
  snipe: Snipe | null;
  hasFolded: boolean;
  joinedAt: number;
};

type GameData = {
  state: 'waiting' | 'playing' | 'finished';
  creatorId: string;
  maxPlayers: number;
  startingChips: number;
  players: PlayerState[];
  deck: string[];
  communityCards: string[];
  pot: number;
  currentBet: number;
  dealerIdx: number;
  turnIdx: number;
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'sniping' | 'showdown';
  playersActed: number;
  logs: string[];
  winner: string | null;
  handWinners: string[];
  latestReaction?: { uid: string, r: string, ts: number } | null;
};

const formatCard = (c: string) => {
    const isRed = c.includes('♥') || c.includes('♦');
    return <span className={isRed ? 'text-red-500' : 'text-zinc-200'}>{c}</span>;
};

const formatSnipeObj = (s: Snipe | null) => {
    if (!s) return 'None';
    const rankName = s.rank === 14 ? 'A' : s.rank === 13 ? 'K' : s.rank === 12 ? 'Q' : s.rank === 11 ? 'J' : s.rank.toString();
    return `${HAND_TYPES[s.type]} (${rankName}s)`;
};

const getPlayerPosition = (i: number, total: number, meIdx: number) => {
    let relIdx = meIdx !== -1 ? (i - meIdx + total) % total : i;
    if (total === 1) return { top: '80%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const angle = (Math.PI / 2) + (relIdx * (2 * Math.PI / total));
    
    const radiusX = 40;
    const radiusY = 35;
    
    const top = 50 + Math.sin(angle) * radiusY;
    const left = 50 + Math.cos(angle) * radiusX;
    
    return {
        top: `${top}%`,
        left: `${left}%`,
        transform: 'translate(-50%, -50%)'
    };
};

export default function MultiSniperGameRoom() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<GameData | null>(null);
  const [raiseAmount, setRaiseAmount] = useState<string>('');
  
  const [showRankings, setShowRankings] = useState(false);
  const [joinNickname, setJoinNickname] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('Jack');
  
  const [showReactions, setShowReactions] = useState(false);
  
  const [selectedSnipeType, setSelectedSnipeType] = useState<number | null>(null);
  const [selectedSnipeRank, setSelectedSnipeRank] = useState<number | null>(null);

  const SNIPE_RANKS = [
    { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
    { label: '5', value: 5 }, { label: '6', value: 6 }, { label: '7', value: 7 },
    { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
    { label: 'J', value: 11 }, { label: 'Q', value: 12 }, { label: 'K', value: 13 },
    { label: 'A', value: 14 }
  ];

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sniper_holdem_games", gameId), (docSnap) => {
        if (docSnap.exists()) {
            setGame(docSnap.data() as GameData);
        }
    });
    return () => unsub();
  }, [gameId]);

  if (!game || !auth.currentUser) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
      <Crosshair className="w-16 h-16 animate-spin" />
    </div>
  );

  const isCreator = auth.currentUser.uid === game.creatorId;
  const meIdx = game.players.findIndex(p => p.uid === auth.currentUser!.uid);
  const amIPlayer = meIdx !== -1;
  const myPlayer = amIPlayer ? game.players[meIdx] : null;

  const handleJoin = async () => {
    if (amIPlayer || game.players.length >= game.maxPlayers) return;
    const newPlayer: PlayerState = {
        uid: auth.currentUser!.uid,
        nickname: joinNickname.trim() || `Agent ${game.players.length + 1}`,
        avatar: joinAvatar,
        chips: game.startingChips,
        bet: 0,
        cards: [],
        snipe: null,
        hasFolded: false,
        joinedAt: Date.now()
    };
    await updateDoc(doc(db, "sniper_holdem_games", gameId), {
        players: [...game.players, newPlayer],
        logs: arrayUnion(`${newPlayer.nickname} joined. (${game.players.length + 1}/${game.maxPlayers})`)
    });
  };

  const handleStart = async () => {
    if (!isCreator || game.players.length < 2) return;
    
    // Initial Deal
    let deck = buildDeck();
    let updatedPlayers = [...game.players];
    for (let p of updatedPlayers) {
        p.cards = [deck.pop()!, deck.pop()!];
        p.bet = 0;
        p.snipe = null;
        p.hasFolded = false;
    }
    
    let dbBet = 20;
    
    // Dealer is 0, SB is 1, BB is 2 (or 1 if only 2 players)
    let sbIdx = (0 + 1) % updatedPlayers.length;
    let bbIdx = updatedPlayers.length === 2 ? 0 : (0 + 2) % updatedPlayers.length; // Wait, actually SB is dealer if headsup, but let's standardise
    
    if (updatedPlayers.length === 2) {
        // Heads up: dealer is SB(10), other is BB(20)
        updatedPlayers[0].chips -= 10;
        updatedPlayers[0].bet = 10;
        updatedPlayers[1].chips -= 20;
        updatedPlayers[1].bet = 20;
        sbIdx = 0;
        bbIdx = 1;
    } else {
        updatedPlayers[sbIdx].chips -= 10;
        updatedPlayers[sbIdx].bet += 10;
        updatedPlayers[bbIdx].chips -= 20;
        updatedPlayers[bbIdx].bet += 20;
    }
    
    let turnIdx = (bbIdx + 1) % updatedPlayers.length;

    await updateDoc(doc(db, "sniper_holdem_games", gameId), {
        state: 'playing',
        players: updatedPlayers,
        deck: deck,
        communityCards: [],
        pot: 30,
        currentBet: 20,
        dealerIdx: 0,
        turnIdx: turnIdx,
        phase: 'preflop',
        playersActed: 0,
        logs: arrayUnion(`Game started! Blinds posted.`)
    });
    playSound('deal');
  };

  const nextTurnOrPhase = async (updates: any, updatedPlayers: PlayerState[], g: GameData) => {
      let activeCount = updatedPlayers.filter(p => !p.hasFolded).length;
      let allButOneFolded = activeCount === 1;

      if (allButOneFolded) {
          // Immediately give pot
          let winner = updatedPlayers.find(p => !p.hasFolded)!;
          winner.chips += updates.pot || g.pot;
          updates.state = 'finished';
          updates.winner = winner.nickname;
          updates.logs = arrayUnion(`Everyone folded. ${winner.nickname} won ${updates.pot || g.pot} chips.`);
          updates.players = updatedPlayers;
          return;
      }

      // Check if betting round is over
      const allInOrCalled = updatedPlayers.every(p => p.hasFolded || p.chips === 0 || p.bet === (updates.currentBet || g.currentBet));
      const everyoneActed = (updates.playersActed || g.playersActed) >= activeCount;

      if (everyoneActed && allInOrCalled) {
          // Next phase
          updates.playersActed = 0;
          for (let p of updatedPlayers) p.bet = 0;
          updates.currentBet = 0;

          if (g.phase === 'preflop') {
              updates.phase = 'flop';
              const deck = updates.deck || [...g.deck];
              updates.communityCards = [deck.pop()!, deck.pop()!, deck.pop()!];
              updates.deck = deck;
              updates.logs = arrayUnion(`Dealing Flop...`);
              playSound('deal');
          } else if (g.phase === 'flop') {
              updates.phase = 'turn';
              const deck = updates.deck || [...g.deck];
              updates.communityCards = [...g.communityCards, deck.pop()!];
              updates.deck = deck;
              updates.logs = arrayUnion(`Dealing Turn...`);
              playSound('deal');
          } else if (g.phase === 'turn') {
              updates.phase = 'river';
              const deck = updates.deck || [...g.deck];
              updates.communityCards = [...g.communityCards, deck.pop()!];
              updates.deck = deck;
              updates.logs = arrayUnion(`Dealing River...`);
              playSound('deal');
          } else if (g.phase === 'river') {
              updates.phase = 'sniping';
              updates.logs = arrayUnion(`ENGAGING SNIPER PROTOCOL. All players select targets.`);
          } else if (g.phase === 'sniping') {
              evaluateShowdown(updates, updatedPlayers, g);
              return;
          }

          // First active player after dealer
          let nextIdx = (g.dealerIdx + 1) % updatedPlayers.length;
          while (updatedPlayers[nextIdx].hasFolded || updatedPlayers[nextIdx].chips === 0) {
              nextIdx = (nextIdx + 1) % updatedPlayers.length;
          }
          updates.turnIdx = nextIdx;
      } else {
          // Find next player
          let nextIdx = (updates.turnIdx !== undefined ? updates.turnIdx : g.turnIdx);
          do {
              nextIdx = (nextIdx + 1) % updatedPlayers.length;
          } while (updatedPlayers[nextIdx].hasFolded || updatedPlayers[nextIdx].chips === 0);
          updates.turnIdx = nextIdx;
      }
      
      updates.players = updatedPlayers;
  };

  const evaluateShowdown = (updates: any, updatedPlayers: PlayerState[], g: GameData) => {
      updates.phase = 'showdown';
      const allSnipes = updatedPlayers.map(p => p.snipe).filter(s => s !== null) as Snipe[];

      let hands = updatedPlayers.map(p => {
          let h = getBestHand([...p.cards, ...(updates.communityCards || g.communityCards)]);
          return { ...p, handData: h };
      });

      let logs = ["SHOWDOWN!"];
      
      hands.forEach((p, idx) => {
          if (p.hasFolded) return;
          logs.push(`${p.nickname} shows ${p.handData.name}.`);
          // Sniper mechanics
          let matchedSnipe = allSnipes.some(s => s.type === p.handData.type && s.rank === p.handData.primaryRank);
          if (matchedSnipe) {
              p.handData.score = -1;
              logs.push(`⚠️ BOOM! ${p.nickname}'s hand perfectly matched a snipe! Hand destroyed to bottom ranking (-1).`);
              playSound('snipe');
          }
      });

      // Find winners
      let activeHands = hands.filter(h => !h.hasFolded);
      let maxScore = Math.max(...activeHands.map(h => h.handData.score));
      let winners = activeHands.filter(h => h.handData.score === maxScore);

      let pot = updates.pot || g.pot;
      updates.handWinners = winners.map(w => w.uid);
      
      if (winners.length > 0) {
          let split = Math.floor(pot / winners.length);
          winners.forEach(w => {
              let rp = updatedPlayers.find(up => up.uid === w.uid)!;
              rp.chips += split;
          });
          const winStr = winners.map(w => updatedPlayers.find(u=>u.uid===w.uid)?.nickname).join(' & ');
          updates.winner = winStr;
          logs.push(`${winStr} wins pot!`);
          playSound('win');
      }

      updates.logs = arrayUnion(...logs);
      updates.state = 'finished'; // end of hand
  };

  const handleAction = async (action: 'fold' | 'call' | 'raise') => {
      if (game.turnIdx !== meIdx) return;
      
      let amount = 0;
      let toCall = game.currentBet - myPlayer!.bet;

      if (action === 'call') {
          amount = Math.min(myPlayer!.chips, toCall);
      } else if (action === 'raise') {
          amount = parseInt(raiseAmount);
          if (isNaN(amount) || amount < toCall || amount > myPlayer!.chips) return;
      }

      const updatedPlayers = [...game.players];
      const p = updatedPlayers[meIdx];
      let updates: any = {};
      
      if (action === 'fold') {
          p.hasFolded = true;
          updates.logs = arrayUnion(`${p.nickname} folded.`);
          playSound('fold');
      } else {
          p.chips -= amount;
          p.bet += amount;
          updates.pot = game.pot + amount;
          if (p.bet > game.currentBet) {
              updates.currentBet = p.bet;
              updates.playersActed = 1; // Restart loop
              updates.logs = arrayUnion(`${p.nickname} raised to ${p.bet}.`);
              playSound('chip');
          } else {
              updates.logs = arrayUnion(`${p.nickname} called.`);
              updates.playersActed = game.playersActed + 1;
              playSound('chip');
          }
      }

      if (action === 'fold') {
          updates.playersActed = game.playersActed + 1;
      }

      await nextTurnOrPhase(updates, updatedPlayers, game);
      await updateDoc(doc(db, "sniper_holdem_games", gameId), updates);
      setRaiseAmount('');
  };

  const sendReaction = async (r: string) => {
      playSound('reaction');
      setShowReactions(false);
      await updateDoc(doc(db, "sniper_holdem_games", gameId), {
          latestReaction: { uid: auth.currentUser!.uid, r, ts: Date.now() }
      });
  };

  const handleSnipe = async () => {
      if (selectedSnipeType === null || selectedSnipeRank === null) return;
      
      const updatedPlayers = [...game.players];
      updatedPlayers[meIdx].snipe = { type: selectedSnipeType, rank: selectedSnipeRank };
      
      // Check if everyone has sniped
      const activePlayers = updatedPlayers.filter(p => !p.hasFolded);
      const allSniped = activePlayers.every(p => p.snipe !== null);

      let updates: any = {
          players: updatedPlayers,
          logs: arrayUnion(`${myPlayer?.nickname} locked in sniper coordinates.`)
      };

      if (allSniped) {
          evaluateShowdown(updates, updatedPlayers, game);
      }

      await updateDoc(doc(db, "sniper_holdem_games", gameId), updates);
  };

  const handleNextHand = async () => {
      if (!isCreator) return;
      
      let activePlayers = game.players.filter(p => p.chips > 0);
      if (activePlayers.length < 2) {
          // Game truly over
          return;
      }

      let deck = buildDeck();
      let nextDealerIdx = (game.dealerIdx + 1) % game.players.length;
      while (game.players[nextDealerIdx].chips === 0) {
          nextDealerIdx = (nextDealerIdx + 1) % game.players.length;
      }

      let updatedPlayers = game.players.map(p => ({
          ...p,
          cards: p.chips > 0 ? [deck.pop()!, deck.pop()!] : [],
          bet: 0,
          snipe: null,
          hasFolded: p.chips === 0
      }));

      let sbIdx = (nextDealerIdx + 1) % game.players.length;
      while (updatedPlayers[sbIdx].chips === 0) {
          sbIdx = (sbIdx + 1) % game.players.length;
      }
      
      let bbIdx = (sbIdx + 1) % game.players.length;
      while (updatedPlayers[bbIdx].chips === 0) {
          bbIdx = (bbIdx + 1) % game.players.length;
      }

      if (activePlayers.length === 2) {
          sbIdx = nextDealerIdx;
          bbIdx = (sbIdx + 1) % game.players.length;
          while(updatedPlayers[bbIdx].chips === 0) {
             bbIdx = (bbIdx + 1) % game.players.length;
          }
      }

      updatedPlayers[sbIdx].chips -= Math.min(10, updatedPlayers[sbIdx].chips);
      updatedPlayers[sbIdx].bet = 10;
      updatedPlayers[bbIdx].chips -= Math.min(20, updatedPlayers[bbIdx].chips);
      updatedPlayers[bbIdx].bet = 20;

      let turnIdx = (bbIdx + 1) % game.players.length;
      while (updatedPlayers[turnIdx].chips === 0) {
          turnIdx = (turnIdx + 1) % game.players.length;
      }

      await updateDoc(doc(db, "sniper_holdem_games", gameId), {
          state: 'playing',
          players: updatedPlayers,
          deck: deck,
          communityCards: [],
          pot: 30,
          currentBet: 20,
          dealerIdx: nextDealerIdx,
          turnIdx: turnIdx,
          phase: 'preflop',
          playersActed: 0,
          winner: null,
          handWinners: [],
          logs: ["--- NEW HAND ---", "Blinds posted."]
      });
  };

  const isMyTurn = game.state === 'playing' && game.phase !== 'sniping' && game.turnIdx === meIdx;

  return (
    <>
    <div className="min-h-screen bg-zinc-950 text-white p-4 font-sans relative overflow-hidden flex flex-col md:flex-row gap-4">
      
      {/* Table Side */}
      <div className="flex-1 flex flex-col relative z-10 gap-4">
          {/* Header */}
          <div className="bg-black/80 rounded-2xl p-4 border border-red-900/40 flex justify-between items-center shadow-lg backdrop-blur">
              <div className="flex items-center gap-4">
                  <div className="bg-red-950/50 p-2 rounded-lg border border-red-500/30">
                      <Crosshair className="text-red-500 animate-pulse" size={24} />
                  </div>
                  <div>
                      <h1 className="font-black uppercase tracking-widest text-lg drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">Sniper <span className="text-red-500">Hold&apos;em</span></h1>
                      <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{game.state.toUpperCase()} • POT: {game.pot}</div>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowRankings(true)}
                    className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/60 text-red-200 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-colors mr-2 border border-red-500/30"
                  >
                      <Info size={14} /> Rankings
                  </button>
                  <div className="bg-zinc-900 px-4 py-2 rounded-xl border border-white/5 font-mono text-sm shadow-inner group relative cursor-pointer">
                      <span className="text-zinc-500 mr-2 text-[10px] uppercase font-bold">Code</span>
                      <span className="font-bold tracking-widest">{gameId}</span>
                  </div>
                  {isCreator && game.state === 'waiting' && game.players.length >= 2 && (
                      <button onClick={handleStart} className="bg-white text-black hover:bg-zinc-200 font-bold py-2 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">Start Protocol</button>
                  )}
              </div>
          </div>

          {/* Table */}
          <div className="flex-1 bg-gradient-to-br from-zinc-900 to-black rounded-[100px] border-4 border-zinc-800 relative shadow-[inset_0_0_100px_rgba(0,0,0,1)] flex items-center justify-center p-8 overflow-hidden mx-4 my-8">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>
              
              {/* Join Overlay inside Table area if waiting and NOT player */}
              {!amIPlayer && game.state === 'waiting' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <div className="bg-zinc-950 p-8 rounded-3xl border border-red-900/50 shadow-2xl max-w-sm w-full animate-in zoom-in-95 pointer-events-auto">
                          <h2 className="text-xl font-black uppercase text-center mb-6 tracking-widest text-white">Join Mission</h2>
                          
                          <div className="space-y-4">
                              <div>
                                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Codename</label>
                                  <input 
                                      type="text" 
                                      value={joinNickname} 
                                      onChange={e => setJoinNickname(e.target.value)}
                                      placeholder="Enter Nickname"
                                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 font-bold mt-1 text-white focus:outline-none focus:border-red-500"
                                  />
                              </div>

                              <div>
                                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Select Avatar</label>
                                  <div className="grid grid-cols-4 gap-2 bg-black p-2 rounded-xl border border-white/10">
                                      {AVATARS.map(av => (
                                          <button 
                                              key={av} 
                                              onClick={() => setJoinAvatar(av)}
                                              className={`text-2xl p-1 rounded-lg transition-transform ${joinAvatar === av ? 'bg-red-900/50 border border-red-500 scale-110 shadow-lg' : 'hover:scale-110 opacity-60 hover:opacity-100'}`}
                                          >
                                              {av}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <button 
                                  onClick={handleJoin} 
                                  disabled={game.players.length >= game.maxPlayers}
                                  className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  {game.players.length >= game.maxPlayers ? 'Lobby Full' : 'Infiltrate Server'}
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Community Cards */}
              <div className="flex gap-2 p-6 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-sm z-10 shadow-2xl">
                  {game.communityCards.map((c, i) => (
                      <motion.div initial={{ y: -50, opacity: 0, rotateY: 180 }} animate={{ y: 0, opacity: 1, rotateY: 0 }} transition={{ delay: i * 0.1 }} key={i} className="w-16 h-24 bg-white rounded-lg shadow-xl flex items-center justify-center text-3xl font-bold border-2 border-zinc-200">
                          {formatCard(c)}
                      </motion.div>
                  ))}
                  {[...Array(5 - game.communityCards.length)].map((_, i) => (
                      <div key={'empty'+i} className="w-16 h-24 border border-white/10 rounded-lg flex items-center justify-center bg-black/50 shadow-inner">
                          <Crosshair className="text-white/5" size={24} />
                      </div>
                  ))}
              </div>

              {game.state === 'finished' && game.winner && (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute z-50 text-center pointer-events-none">
                      <div className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] mb-2 uppercase italic tracking-widest">{game.winner}</div>
                      <div className="text-2xl font-black text-white bg-black/50 px-6 py-2 rounded-full inline-block backdrop-blur-sm border border-yellow-500/50">WINS THE POT</div>
                  </motion.div>
              )}
              {game.state === 'finished' && game.handWinners && game.handWinners.length > 0 && !game.winner && (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute z-50 text-center flex flex-col items-center pointer-events-none">
                      <div className="text-6xl text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] mb-2 uppercase italic tracking-widest flex items-center justify-center font-black">
                         WINNER
                      </div>
                  </motion.div>
              )}

              {/* Dynamic Players Layout */}
              <div className="absolute inset-0">
                  {game.players.map((p, i) => {
                      const pos = getPlayerPosition(i, game.players.length, meIdx);
                      return (
                          <div key={p.uid} className={`absolute transition-all duration-700 ease-[cubic-bezier(0.3,1.5,0.4,1)] ${game.turnIdx === i ? 'scale-110 z-20' : 'opacity-80 scale-95 z-10'} ${p.hasFolded ? 'opacity-30 grayscale' : ''}`}
                               style={pos}>
                              <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex flex-col items-center min-w-[120px] ${game.turnIdx === i ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'bg-black/60 border-white/10'}`}>
                                  {game.dealerIdx === i && <div className="absolute -top-3 -right-3 w-6 h-6 bg-white text-black rounded-full font-black text-xs flex items-center justify-center shadow-lg border-2 border-black">D</div>}
                                  
                                  <div className="w-16 h-16 mb-2 relative">
                                      <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${p.avatar}`} alt={p.avatar} className="w-full h-full object-contain" />
                                      {game.latestReaction?.uid === p.uid && Date.now() - game.latestReaction.ts < 3000 && (
                                          <motion.div initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: -20 }} exit={{ scale: 0 }} className="absolute -top-4 -right-4 text-3xl z-50">
                                              {game.latestReaction.r}
                                          </motion.div>
                                      )}
                                  </div>
                                  <div className="text-xs uppercase font-bold tracking-widest text-zinc-300 mb-2 truncate max-w-[100px]" title={p.nickname}>
                                      {p.nickname} {p.uid === auth.currentUser?.uid ? "(YOU)" : ""}
                                      {game.handWinners?.includes(p.uid) && <span className="text-yellow-400 ml-1">🏆</span>}
                                  </div>
                                  
                                  <div className="font-mono text-sm font-black text-white px-3 py-1 bg-black/50 rounded-lg border border-white/5 mb-3 shadow-inner">
                                      {p.chips} CR
                                  </div>

                                  <div className="flex gap-2">
                                      {(game.phase === 'showdown' || p.uid === auth.currentUser?.uid) && p.cards.length > 0 ? (
                                        p.cards.map((c, j) => (
                                            <div key={j} className="w-10 h-14 bg-white rounded border border-zinc-300 flex items-center justify-center text-lg font-bold shadow-md">
                                                {formatCard(c)}
                                            </div>
                                        ))
                                      ) : p.cards.length > 0 ? (
                                        [1, 2].map((j) => (
                                            <div key={j} className="w-10 h-14 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)] bg-red-950 rounded border border-red-500/20 flex items-center justify-center shadow-md">
                                                <Crosshair size={12} className="text-red-500/20" />
                                            </div>
                                        ))
                                      ) : null}
                                  </div>

                                  <div className="mt-3 text-[10px] font-mono font-bold bg-zinc-950/80 px-2 py-1 rounded-md border border-white/5 w-full text-center">
                                      BET: <span className="text-red-400">{p.bet} CR</span>
                                  </div>

                                  {game.phase === 'showdown' && p.snipe !== null && (
                                    <div className="mt-2 w-full text-center text-[9px] font-bold uppercase tracking-widest bg-red-500/20 text-red-300 py-1 rounded border border-red-500/30">
                                        Sniped: {formatSnipeObj(p.snipe)}
                                    </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

      {/* Control Panel Sidebar */}
      <div className="w-full md:w-96 flex flex-col gap-4 relative z-20">
          
          {/* Action Pad */}
          {amIPlayer && myPlayer && !myPlayer.hasFolded && (
             <div className="bg-black/90 p-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                         <ShieldAlert size={16} /> Command Interface
                     </h2>
                     <div className="relative">
                         <button onClick={() => setShowReactions(!showReactions)} className="bg-white/5 border border-white/10 p-2 rounded-xl text-zinc-400 hover:text-white transition-colors relative">
                            <Zap size={16} />
                         </button>
                         <AnimatePresence>
                             {showReactions && (
                                 <motion.div initial={{opacity:0, scale:0.9, y: 10}} animate={{opacity:1, scale:1, y: 0}} exit={{opacity:0, scale:0.9, y: 10}} className="absolute bottom-full right-0 mb-2 bg-zinc-950 border border-white/10 p-2 flex gap-2 rounded-2xl shadow-xl w-[200px] flex-wrap justify-end">
                                     {REACTIONS.map(r => (
                                         <button key={r} onClick={() => sendReaction(r)} className="text-xl hover:scale-125 transition-transform p-1">
                                            {r}
                                         </button>
                                     ))}
                                 </motion.div>
                             )}
                         </AnimatePresence>
                     </div>
                 </div>

                 {game.phase === 'sniping' ? (
                     <div className="space-y-4 animate-in slide-in-from-right duration-300">
                        <div className="space-y-1">
                            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest border-b border-red-500/20 pb-2 mb-4">Engage Target Coordinates</h3>
                            <p className="text-[10px] text-zinc-400 font-mono mb-4 leading-relaxed bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                If *any* player perfectly matches your Snipe (Type & Primary Rank), their final rank collapses to absolute zero.
                            </p>
                        </div>
                        
                        {myPlayer.snipe === null ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 scbar-hide">
                                    {HAND_TYPES.map((type, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => setSelectedSnipeType(idx)}
                                            className={`text-[9px] font-black uppercase tracking-[0.2em] py-3 rounded-xl border transition-all ${selectedSnipeType === idx ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-black/50 border-white/10 text-zinc-500 hover:border-red-500/50'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-5 gap-1.5 p-2 bg-zinc-950 rounded-xl border border-white/5">
                                    {SNIPE_RANKS.map((r, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => setSelectedSnipeRank(r.value)}
                                            className={`text-xs font-black py-2.5 rounded-lg border transition-all ${selectedSnipeRank === r.value ? 'bg-red-900 border-red-500 text-white' : 'bg-black border-transparent text-zinc-600 hover:text-white'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleSnipe}
                                    disabled={selectedSnipeType === null || selectedSnipeRank === null}
                                    className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)] flex items-center justify-center gap-2"
                                >
                                    <Crosshair size={16} /> Confirm
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 border border-white/5 rounded-xl bg-black/50">
                                <Crosshair size={32} className="text-red-500 mb-4 animate-spin-slow opacity-50" />
                                <div className="text-sm font-bold uppercase tracking-widest text-zinc-500">Coordinates Locked</div>
                                <div className="text-xs text-zinc-600 mt-2 font-mono">Waiting for others...</div>
                            </div>
                        )}
                     </div>
                 ) : isMyTurn ? (
                     <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom duration-300 relative">
                         <button onClick={() => handleAction('fold')} className="col-span-2 bg-zinc-900 border border-white/5 text-zinc-400 py-3 rounded-xl font-bold uppercase hover:bg-red-950 hover:text-red-400 transition-colors">Fold</button>
                         <button onClick={() => handleAction('call')} className="col-span-2 bg-zinc-800 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors shadow-lg border border-white/10">
                            {game.currentBet > myPlayer.bet ? `Call ${game.currentBet - myPlayer.bet} CR` : 'Check'}
                         </button>
                         <input 
                             type="number" 
                             placeholder="Amount" 
                             value={raiseAmount} 
                             onChange={e => setRaiseAmount(e.target.value)} 
                             className="bg-black border border-white/10 px-4 rounded-xl text-center font-mono font-bold focus:outline-none focus:border-white transition-colors text-lg"
                         />
                         <button onClick={() => handleAction('raise')} className="bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">Bet</button>
                     </div>
                 ) : (
                     <div className="flex items-center justify-center py-10 opacity-50 border border-dashed border-white/10 rounded-xl">
                         <div className="text-xs uppercase font-bold tracking-widest text-zinc-500 animate-pulse">Awaiting Turn...</div>
                     </div>
                 )}
             </div>
          )}

          {game.state === 'finished' && isCreator && (
              <button onClick={handleNextHand} className="bg-red-600 text-white font-black py-5 rounded-3xl uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] animate-bounce border border-red-400/50 flex items-center justify-center gap-2">
                  <ArrowRight size={20} /> Next Hand
              </button>
          )}

          {/* Activity Log */}
          <div className="bg-black overflow-hidden border border-white/5 rounded-3xl flex-1 flex flex-col relative shadow-inner">
              <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none"></div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-end space-y-3 pb-8 scbar-hide">
                  <AnimatePresence initial={false}>
                      {game.logs.slice(-50).map((log, i) => (
                          <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: -20 }} 
                              animate={{ opacity: 1, x: 0 }} 
                              className={`text-xs font-mono break-words ${log.includes('BOOM') ? 'text-red-400 font-bold bg-red-950/30 p-2 rounded border border-red-500/20' : log.includes('SHOWDOWN') ? 'text-yellow-400 font-black tracking-widest border-b border-yellow-500/30 pb-1' : log.includes('assassinated') ? 'text-red-500' : 'text-zinc-500'}`}
                          >
                              <span className="opacity-50 mr-2 text-[10px]">[{i.toString().padStart(3, '0')}]</span>
                              {log}
                          </motion.div>
                      ))}
                  </AnimatePresence>
              </div>
          </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scbar-hide::-webkit-scrollbar { display: none; }
        .scbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
    
    {/* Hand Rankings Modal */}
    <AnimatePresence>
        {showRankings && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={() => setShowRankings(false)}
            >
                <motion.div 
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-zinc-950 border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-hidden relative pointer-events-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={() => setShowRankings(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    
                    <h2 className="text-xl font-black uppercase text-white tracking-widest mb-2">Hand Rankings</h2>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">From Highest to Lowest Rank</p>
                    
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scbar-hide">
                        {HAND_RANKINGS_INFO.map((hr, idx) => (
                            <div key={idx} className="bg-black/50 border border-white/5 rounded-xl p-4 flex gap-4 items-center">
                                <div className="text-red-500 font-black text-xl w-6 text-center">{idx + 1}</div>
                                <div>
                                    <div className="font-bold text-sm uppercase tracking-widest text-zinc-300">{hr.name}</div>
                                    <div className="text-xs text-zinc-500 font-mono mt-1 leading-relaxed">{hr.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
}
