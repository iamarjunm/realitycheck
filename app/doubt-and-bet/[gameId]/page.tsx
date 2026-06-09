'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldAlert, Info, X, Coins, Layers, Zap, Copy, ArrowLeft, Flame, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PokerTable } from '../../components/poker/PokerTable';

const AVATARS = ['Devil', 'Gambler', 'Dealer', 'Player', 'King', 'Queen', 'Joker', 'Spy'];
const COLORS = ['Yellow', 'Green', 'Blue', 'Purple', 'Red'];
const CARD_COLORS: Record<string, string> = {
    Yellow: 'bg-yellow-400',
    Green: 'bg-emerald-500',
    Blue: 'bg-blue-500',
    Purple: 'bg-purple-500',
    Red: 'bg-red-500',
    Rainbow: 'bg-gradient-to-br from-red-500 via-green-400 to-blue-500',
};

const DECK_TEMPLATE = [
    ...Array(10).fill('Yellow'),
    ...Array(10).fill('Green'),
    ...Array(10).fill('Blue'),
    ...Array(10).fill('Purple'),
    ...Array(10).fill('Red'),
    ...Array(10).fill('Rainbow'),
];

type PlayerState = {
    uid: string;
    nickname: string;
    avatar: string;
    tokens: number;
    chips: number;
    cards: string[];
    isEliminated: boolean;
};

type Claim = {
    uid: string;
    count: number;
    color: string;
    wagerT: number;
    wagerC: number;
} | null;

type Doubt = {
    uid: string;
    wagerT: number;
    wagerC: number;
} | null;

type GameData = {
    creatorId: string;
    state: 'waiting' | 'playing' | 'finished';
    maxPlayers: number;
    startingTokens: number;
    players: PlayerState[];
    round: number;
    turnIdx: number;
    phase: 'waiting' | 'claiming' | 'responding' | 'showdown' | 'finished_round';
    currentClaim: Claim;
    currentDoubt: Doubt;
    deck: string[];
    logs: string[];
    winner: string | null;
    gameWinner: string | null;
};

function shuffle<T>(array: T[]) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const getPlayerPosition = (i: number, total: number, meIdx: number) => {
    const relIdx = meIdx !== -1 ? (i - meIdx + total) % total : i;
    if (total === 1) return { top: '82%', left: '50%', transform: 'translate(-50%, -50%)' };
    const angle = Math.PI / 2 + relIdx * ((2 * Math.PI) / total);
    // Tighter radii to avoid edge clipping on mobile but wide enough to avoid middle
    const radiusY = typeof window !== 'undefined' && window.innerWidth < 640 ? 38 : 42;
    const radiusX = typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 45;
    const top = 50 + Math.sin(angle) * radiusY;
    const left = 50 + Math.cos(angle) * radiusX;
    return { top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)' };
};

const getValue = (t: number, c: number) => t + c * 10;

const PHASE_LABELS: Record<string, string> = {
    waiting: 'Lobby',
    claiming: 'Claiming',
    responding: 'Showdown Pending',
    showdown: 'Reveal',
    finished_round: 'Round Over',
};

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#07060f] text-white flex flex-col items-center justify-center gap-4">
            <div className="h-14 w-14 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Syncing table...</p>
        </div>
    );
}

export default function DoubtAndBetGameRoom() {
    const params = useParams();
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';

    const [authReady, setAuthReady] = useState(false);
    const [game, setGame] = useState<GameData | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [joinNickname, setJoinNickname] = useState('');
    const [joinAvatar, setJoinAvatar] = useState('Devil');
    const [showRules, setShowRules] = useState(false);
    const [copied, setCopied] = useState(false);

    const [claimCount, setClaimCount] = useState(1);
    const [claimColor, setClaimColor] = useState('Yellow');
    const [wagerT, setWagerT] = useState(1);
    const [wagerC, setWagerC] = useState(0);
    const [doubtT, setDoubtT] = useState(0);
    const [doubtC, setDoubtC] = useState(0);

    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        signInAnonymously(auth)
            .catch(console.error)
            .finally(() => setAuthReady(true));
    }, []);

    useEffect(() => {
        if (!gameId || !authReady) return;
        const unsubscribe = onSnapshot(
            doc(db, 'doubt_and_bet_games', gameId),
            (docSnap) => {
                if (docSnap.exists()) {
                    setGame(docSnap.data() as GameData);
                    setNotFound(false);
                } else {
                    setNotFound(true);
                    setGame(null);
                }
            },
            (err) => {
                console.error(err);
                setNotFound(true);
            }
        );
        return () => unsubscribe();
    }, [gameId, authReady]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [game?.logs]);

    const playSound = (type: 'chip' | 'deal' | 'win' | 'lose') => {
        try {
            const AudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'chip') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'deal') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'win') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.25);
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            }
        } catch {
            /* audio optional */
        }
    };

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(gameId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    if (!authReady || (!game && !notFound)) return <LoadingScreen />;

    if (notFound || !game) {
        return (
            <div className="min-h-screen bg-[#07060f] text-white flex flex-col items-center justify-center p-6 text-center gap-6">
                <Flame className="text-purple-500" size={40} />
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Lobby Not Found</h1>
                    <p className="text-zinc-500 text-sm">Code <span className="font-mono text-zinc-300">{gameId}</span> doesn&apos;t exist or was removed.</p>
                </div>
                <Link href="/card-games" className="rounded-xl bg-white text-black font-bold px-6 py-3 uppercase tracking-widest text-sm hover:bg-zinc-100">
                    Card Games
                </Link>
            </div>
        );
    }

    const meIdx = game.players.findIndex(p => p.uid === auth.currentUser?.uid);
    const myPlayer = meIdx !== -1 ? game.players[meIdx] : null;
    const amIPlayer = meIdx !== -1;
    const isCreator = auth.currentUser?.uid === game.creatorId;
    const isMyTurn = game.state === 'playing' && game.turnIdx === meIdx;
    const activePlayer = game.players[game.turnIdx];

    const getNextPlayerIdx = (startIdx: number, players: PlayerState[]) => {
        let i = (startIdx + 1) % players.length;
        let guard = 0;
        while (players[i].isEliminated && guard < players.length) {
            i = (i + 1) % players.length;
            guard++;
        }
        return i;
    };

    const getFirstAliveIdx = (players: PlayerState[]) => {
        const idx = players.findIndex(p => !p.isEliminated);
        return idx === -1 ? 0 : idx;
    };

    const handleJoin = async () => {
        if (!auth.currentUser || amIPlayer || game.players.length >= game.maxPlayers) return;
        const newPlayer: PlayerState = {
            uid: auth.currentUser.uid,
            nickname: joinNickname.trim() || `Player ${game.players.length + 1}`,
            avatar: joinAvatar,
            tokens: game.startingTokens,
            chips: 5,
            cards: [],
            isEliminated: false,
        };
        await updateDoc(doc(db, 'doubt_and_bet_games', gameId), {
            players: [...game.players, newPlayer],
            logs: arrayUnion(`${newPlayer.nickname} joined the table.`),
        });
    };

    const checkEliminations = (plist: PlayerState[]) => {
        plist.forEach(p => {
            if (!p.isEliminated && p.tokens <= 0 && p.chips <= 0) {
                p.isEliminated = true;
                p.cards = [];
            }
        });
    };

    const awardPot = (winnerUid: string, claimT: number, claimC: number, doubtT: number, doubtC: number, pList: PlayerState[]) => {
        const wP = pList.find(p => p.uid === winnerUid)!;
        wP.tokens += claimT + doubtT;
        wP.chips += claimC + doubtC;
        if (wP.chips > 5) {
            const overflow = wP.chips - 5;
            wP.chips = 5;
            wP.tokens += overflow * 10;
        }
    };

    const startNewRound = async (playersList = game.players, currRound = game.round) => {
        const nR = currRound + 1;
        const pList = [...playersList];
        const logs: string[] = [];

        const alive = pList.filter(p => !p.isEliminated);
        if (alive.length === 1) {
            await updateDoc(doc(db, 'doubt_and_bet_games', gameId), {
                state: 'finished',
                gameWinner: alive[0].nickname,
                logs: arrayUnion(`GAME OVER! ${alive[0].nickname} is the ultimate survivor.`),
            });
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            return;
        }

        if (nR >= 15 && nR % 5 === 0) {
            logs.push(`⚠️ DEVIL'S TAX: Round ${nR}. Every player sacrifices 1 Token.`);
            pList.forEach(p => {
                if (!p.isEliminated && p.tokens > 0) p.tokens -= 1;
            });
        }

        const deck = shuffle([...DECK_TEMPLATE]);
        pList.forEach(p => {
            if (!p.isEliminated) {
                p.cards = deck.splice(0, p.chips);
            }
        });

        logs.push(`Round ${nR} started. Cards dealt.`);
        playSound('deal');

        const starterIdx = nR === 1 ? getFirstAliveIdx(pList) : getNextPlayerIdx(game.turnIdx, pList);

        await updateDoc(doc(db, 'doubt_and_bet_games', gameId), {
            state: 'playing',
            round: nR,
            phase: 'claiming',
            turnIdx: starterIdx,
            players: pList,
            deck,
            currentClaim: null,
            currentDoubt: null,
            winner: null,
            logs: arrayUnion(...logs),
        });
    };

    const handleStart = () => startNewRound(game.players, 0);

    const handleClaim = async () => {
        if (!myPlayer) return;
        if (wagerT > myPlayer.tokens || wagerC > myPlayer.chips) return;
        if (wagerT === 0 && wagerC === 0) return;
        if (game.currentClaim) {
            if (claimCount <= game.currentClaim.count) return;
        }
        if (claimCount > 20) return;

        playSound('chip');
        const nextPlayers = [...game.players];

        if (game.currentClaim) {
            const prevP = nextPlayers.find(p => p.uid === game.currentClaim!.uid);
            if (prevP) {
                prevP.tokens += game.currentClaim.wagerT;
                prevP.chips += game.currentClaim.wagerC;
            }
        }

        const msP = nextPlayers.find(p => p.uid === myPlayer.uid)!;
        msP.tokens -= wagerT;
        msP.chips -= wagerC;

        const nIdx = getNextPlayerIdx(game.turnIdx, nextPlayers);

        await updateDoc(doc(db, 'doubt_and_bet_games', gameId), {
            players: nextPlayers,
            currentClaim: { uid: msP.uid, count: claimCount, color: claimColor, wagerT, wagerC },
            turnIdx: nIdx,
            logs: arrayUnion(`${msP.nickname} claims at least ${claimCount} ${claimColor}${claimCount > 1 ? 's' : ''} exist.`),
        });

        setWagerT(1);
        setWagerC(0);
    };

    const handleDoubt = async () => {
        if (!myPlayer || !game.currentClaim) return;
        if (doubtT > myPlayer.tokens || doubtC > myPlayer.chips) return;

        const cV = getValue(game.currentClaim.wagerT, game.currentClaim.wagerC);
        const myV = getValue(doubtT, doubtC);
        if (myV < cV) return;

        playSound('chip');
        const nextPlayers = [...game.players];
        const msP = nextPlayers.find(p => p.uid === myPlayer.uid)!;
        msP.tokens -= doubtT;
        msP.chips -= doubtC;

        const claimPIdx = nextPlayers.findIndex(p => p.uid === game.currentClaim!.uid);

        await updateDoc(doc(db, 'doubt_and_bet_games', gameId), {
            players: nextPlayers,
            currentDoubt: { uid: msP.uid, wagerT: doubtT, wagerC: doubtC },
            phase: 'responding',
            turnIdx: claimPIdx,
            logs: arrayUnion(`${msP.nickname} DOUBTS the claim!`),
        });
    };

    const handleFold = async () => {
        if (!myPlayer || !game.currentClaim || !game.currentDoubt) return;
        playSound('lose');
        const nextPlayers = [...game.players];
        awardPot(game.currentDoubt.uid, game.currentClaim.wagerT, game.currentClaim.wagerC, game.currentDoubt.wagerT, game.currentDoubt.wagerC, nextPlayers);
        checkEliminations(nextPlayers);

        const doubterName = nextPlayers.find(p => p.uid === game.currentDoubt!.uid)?.nickname;

        await updateDoc(doc(db, 'doubt_and_bet_games', gameId), {
            players: nextPlayers,
            phase: 'finished_round',
            winner: doubterName,
            logs: arrayUnion(`${myPlayer.nickname} folded. ${doubterName} wins the pot!`),
        });
    };

    const handleAccept = async () => {
        if (!myPlayer || !game.currentClaim || !game.currentDoubt) return;
        playSound('chip');

        const cT = game.currentClaim.wagerT;
        const cC = game.currentClaim.wagerC;
        let dT = game.currentDoubt.wagerT;
        let dC = game.currentDoubt.wagerC;

        const reqT = Math.max(0, dT - cT);
        const reqC = Math.max(0, dC - cC);

        const addT = Math.min(myPlayer.tokens, reqT);
        const addC = Math.min(myPlayer.chips, reqC);

        const refundT = reqT - addT;
        const refundC = reqC - addC;

        const nextPlayers = [...game.players];
        const pMe = nextPlayers.find(p => p.uid === myPlayer.uid)!;
        pMe.tokens -= addT;
        pMe.chips -= addC;

        if (refundT > 0 || refundC > 0) {
            const pDoubt = nextPlayers.find(p => p.uid === game.currentDoubt!.uid)!;
            pDoubt.tokens += refundT;
            pDoubt.chips += refundC;
        }

        let totalColor = 0;
        nextPlayers.forEach(p => {
            if (!p.isEliminated) {
                p.cards.forEach(c => {
                    if (c === game.currentClaim!.color || c === 'Rainbow') totalColor++;
                });
            }
        });

        const doubterName = nextPlayers.find(p => p.uid === game.currentDoubt!.uid)?.nickname;

        let winnerName = '';
        if (totalColor >= game.currentClaim.count) {
            awardPot(myPlayer.uid, cT + addT, cC + addC, dT - refundT, dC - refundC, nextPlayers);
            winnerName = myPlayer.nickname;
            playSound('win');
        } else {
            awardPot(game.currentDoubt.uid, cT + addT, cC + addC, dT - refundT, dC - refundC, nextPlayers);
            winnerName = doubterName || 'Unknown';
            playSound('lose');
        }

        checkEliminations(nextPlayers);

        await updateDoc(doc(db, 'doubt_and_bet_games', gameId), {
            players: nextPlayers,
            phase: 'showdown',
            winner: winnerName,
            currentClaim: { ...game.currentClaim, wagerT: cT + addT, wagerC: cC + addC },
            currentDoubt: { ...game.currentDoubt, wagerT: dT - refundT, wagerC: dC - refundC },
            logs: arrayUnion(
                `${myPlayer.nickname} matched the doubt!`,
                `SHOWDOWN: ${totalColor} ${game.currentClaim.color}s revealed (needed ${game.currentClaim.count}).`,
                `${winnerName} WINS THE POT!`
            ),
        });
    };

    const minClaim = game.currentClaim ? game.currentClaim.count + 1 : 1;
    const minDoubtValue = game.currentClaim ? getValue(game.currentClaim.wagerT, game.currentClaim.wagerC) : 0;

    return (
        <div className="min-h-screen bg-[#07060f] text-white font-sans relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-purple-800/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-indigo-700/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col gap-4 p-4 lg:flex-row">
                {/* Table */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-zinc-950/80 px-5 py-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <Link href="/card-games" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                                <ArrowLeft size={14} /> Card Games
                            </Link>
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">Lobby</div>
                                <button onClick={copyCode} className="flex items-center gap-2 font-mono font-bold tracking-[0.2em] text-purple-300 hover:text-purple-200">
                                    {gameId}
                                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-white/10" />
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">Round</div>
                                <div className="font-bold">{game.round > 0 ? game.round : '—'}</div>
                            </div>
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">Phase</div>
                                <div className="text-sm font-bold text-purple-300">{PHASE_LABELS[game.phase] ?? game.phase}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                {game.players.length}/{game.maxPlayers} players
                            </span>
                            <button onClick={() => setShowRules(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-purple-200 hover:bg-purple-900/50 transition-colors">
                                <Info size={14} /> Rules
                            </button>
                        </div>
                    </div>

                    {game.currentClaim && game.state === 'playing' && (
                        <div className="border-b border-yellow-500/20 bg-yellow-950/20 px-5 py-3 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-500/80">Active Claim · </span>
                            <span className="text-sm font-black text-yellow-200">
                                ≥ {game.currentClaim.count} {game.currentClaim.color}
                                {game.currentClaim.count > 1 ? 's' : ''} across all hands
                            </span>
                        </div>
                    )}

                    <div className="relative flex flex-1 flex-col items-center justify-center min-h-[440px] p-4 sm:p-6 bg-[#06060a]">
                        <PokerTable
                            variant="violet"
                            potLabel={game.currentClaim ? `CLAIM: ≥${game.currentClaim.count} ${game.currentClaim.color}` : game.round > 0 ? `ROUND ${game.round}` : 'LOBBY'}
                            phaseLabel={PHASE_LABELS[game.phase] ?? game.phase}
                            className="flex-1 w-full !min-h-[400px]"
                        >

                        {!amIPlayer && game.state === 'waiting' && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm pointer-events-auto">
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-[1.75rem] border border-indigo-500/30 bg-zinc-950 p-8 shadow-2xl">
                                    <h2 className="text-xl font-black uppercase text-center mb-2">Join Table</h2>
                                    <p className="text-xs text-zinc-500 text-center mb-6">Pick your identity and take a seat.</p>
                                    <input type="text" value={joinNickname} onChange={e => setJoinNickname(e.target.value)} placeholder="Codename" maxLength={16} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 font-bold mb-4 focus:outline-none focus:border-indigo-500" />
                                    <div className="grid grid-cols-4 gap-2 mb-6">
                                        {AVATARS.map(av => (
                                            <button key={av} type="button" onClick={() => setJoinAvatar(av)} className={`p-2 rounded-xl transition-all ${joinAvatar === av ? 'bg-indigo-900/60 border border-indigo-500 scale-105' : 'opacity-50 hover:opacity-100 border border-transparent'}`}>
                                                <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${av}`} alt={av} className="w-10 h-10 mx-auto" />
                                            </button>
                                        ))}
                                    </div>
                                    <button type="button" onClick={handleJoin} disabled={game.players.length >= game.maxPlayers} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-black py-4 rounded-xl uppercase tracking-widest transition-colors">
                                        {game.players.length >= game.maxPlayers ? 'Table Full' : 'Take Seat'}
                                    </button>
                                </motion.div>
                            </div>
                        )}

                        {isCreator && game.state === 'waiting' && game.players.length >= 2 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-40 rounded-2xl border border-white/10 bg-zinc-950/90 px-8 py-6 text-center backdrop-blur-md shadow-2xl pointer-events-auto">
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4">{game.players.length} players ready</p>
                                <button type="button" onClick={handleStart} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black px-10 py-3 rounded-xl uppercase tracking-widest shadow-[0_0_30px_rgba(147,51,234,0.35)] hover:scale-105 transition-transform">
                                    Deal Round 1
                                </button>
                            </motion.div>
                        )}

                        {game.state === 'waiting' && !isCreator && amIPlayer && (
                            <div className="absolute z-40 rounded-2xl border border-white/10 bg-zinc-950/80 px-8 py-5 text-center backdrop-blur-md">
                                <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 animate-pulse">Waiting for host to start...</p>
                            </div>
                        )}

                        {game.state === 'finished' && game.gameWinner && (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute z-50 text-center pointer-events-none">
                                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-3">Sole Survivor</div>
                                <div className="text-5xl sm:text-7xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-orange-500 drop-shadow-[0_0_40px_rgba(250,204,21,0.4)]">
                                    {game.gameWinner}
                                </div>
                            </motion.div>
                        )}

                        {(game.phase === 'finished_round' || game.phase === 'showdown') && game.winner && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute z-40 top-8 left-1/2 -translate-x-1/2 pointer-events-none">
                                <div className="rounded-full border border-indigo-400/40 bg-indigo-950/80 px-6 py-2 text-sm font-black uppercase tracking-widest text-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                    {game.winner} wins the pot
                                </div>
                            </motion.div>
                        )}

                        <div className="absolute inset-0">
                            {game.players.map((p, i) => {
                                const pos = getPlayerPosition(i, game.players.length, meIdx);
                                const isMe = p.uid === auth.currentUser?.uid;
                                const isTurn = game.turnIdx === i;
                                return (
                                    <div key={p.uid} className={`absolute transition-all duration-500 z-10`} style={{...pos, zIndex: isTurn ? 30 : 10}}>
                                        <div className={`flex flex-col items-center w-20 sm:w-28 rounded-2xl border p-2 sm:p-4 backdrop-blur-md shadow-2xl transition-all duration-300 ${isTurn ? 'scale-110 sm:scale-125 border-indigo-400/60 bg-indigo-950/50 shadow-[0_0_35px_rgba(99,102,241,0.25)]' : 'scale-[0.85] sm:scale-100 border-white/10 bg-black/75'} ${p.isEliminated ? 'opacity-25 grayscale' : ''}`}>
                                            <div className="relative mb-2 h-12 w-12">
                                                <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${p.avatar}`} alt={p.avatar} className="h-full w-full object-contain" />
                                                {isTurn && game.state === 'playing' && (
                                                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                                )}
                                            </div>
                                            <div className="mb-2 max-w-[110px] truncate text-xs font-bold uppercase tracking-widest text-zinc-300">
                                                {p.nickname}{isMe ? ' (you)' : ''}
                                            </div>

                                            {isMe && (
                                                <div className="mb-2 flex gap-2">
                                                    <div className="flex items-center gap-1 rounded-lg border border-yellow-500/20 bg-black/50 px-2 py-1 text-[10px] font-mono font-bold">
                                                        <Coins size={11} className="text-yellow-400" /> {p.tokens}
                                                    </div>
                                                    <div className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-black/50 px-2 py-1 text-[10px] font-mono font-bold">
                                                        <Layers size={11} className="text-indigo-400" /> {p.chips}
                                                    </div>
                                                </div>
                                            )}

                                            {p.cards.length > 0 && (
                                                <div className="mb-2 flex flex-nowrap justify-center w-full group pl-2">
                                                    {(game.phase === 'showdown' || isMe)
                                                        ? p.cards.map((c, j) => (
                                                            <div key={j} className={`h-6 w-4 sm:h-7 sm:w-5 rounded-sm shadow-sm ${CARD_COLORS[c]} shrink-0 -ml-2 sm:-ml-2.5 transition-transform hover:-translate-y-2 hover:z-20`} style={{ zIndex: j }} title={c} />
                                                        ))
                                                        : p.cards.map((_, j) => (
                                                            <div key={j} className="h-6 w-4 sm:h-7 sm:w-5 rounded-sm border border-white/20 bg-zinc-800 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.06)_2px,rgba(255,255,255,0.06)_4px)] shrink-0 -ml-2 sm:-ml-2.5 transition-transform hover:-translate-y-2 hover:z-20" style={{ zIndex: j }} />
                                                        ))}
                                                </div>
                                            )}

                                            {p.isEliminated && (
                                                <div className="text-[9px] font-black uppercase tracking-widest text-red-400/80">Eliminated</div>
                                            )}

                                            {game.currentClaim?.uid === p.uid && game.phase === 'claiming' && (
                                                <div className="mt-1 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-center text-[9px] font-bold uppercase text-yellow-300">
                                                    Claimed {game.currentClaim.count} {game.currentClaim.color}
                                                </div>
                                            )}
                                            {game.currentDoubt?.uid === p.uid && game.phase === 'responding' && (
                                                <div className="mt-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-center text-[9px] font-bold uppercase text-red-300">
                                                    Doubted!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        </PokerTable>
                    </div>

                    <div className="border-t border-white/10 bg-zinc-950/80">
                        <div className="max-h-36 overflow-y-auto px-5 py-3 space-y-1 scbar-hide">
                            {game.logs.map((log, i) => (
                                <div key={i} className={`text-[11px] font-mono py-0.5 ${log.includes('WINS') ? 'text-indigo-300 font-bold' : log.includes('DOUBT') ? 'text-red-400' : log.includes('TAX') ? 'text-orange-400' : 'text-zinc-500'}`}>
                                    {log}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                        {(game.phase === 'finished_round' || game.phase === 'showdown') && isCreator && (
                            <div className="px-5 pb-4">
                                <button type="button" onClick={() => startNewRound(game.players, game.round)} className="w-full rounded-xl bg-indigo-600 py-3 font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition-colors">
                                    Start Next Round
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Console */}
                <div className="flex w-full flex-col gap-4 lg:w-[22rem] xl:w-96">
                    {myPlayer && !myPlayer.isEliminated && (
                        <div className="rounded-[1.75rem] border border-white/10 bg-black/50 p-5 backdrop-blur-xl">
                            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Your Hand</div>
                            <div className="flex flex-wrap gap-2 justify-center min-h-[3rem]">
                                {myPlayer.cards.length === 0 ? (
                                    <span className="text-xs text-zinc-600 italic">No cards yet</span>
                                ) : (
                                    myPlayer.cards.map((c, i) => (
                                        <div key={i} className={`h-14 w-10 rounded-lg shadow-lg ${CARD_COLORS[c]} flex items-end justify-center pb-1`}>
                                            <span className="text-[8px] font-black uppercase text-black/50">{c === 'Rainbow' ? '★' : c[0]}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-4 flex justify-center gap-4 text-center">
                                <div>
                                    <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Tokens</div>
                                    <div className="text-xl font-black text-yellow-400">{myPlayer.tokens}</div>
                                </div>
                                <div className="w-px bg-white/10" />
                                <div>
                                    <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Chips</div>
                                    <div className="text-xl font-black text-indigo-400">{myPlayer.chips}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 rounded-[1.75rem] border border-white/10 bg-black/50 p-6 backdrop-blur-xl shadow-xl">
                        <h2 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                            <ShieldAlert size={14} /> Command Console
                        </h2>

                        {amIPlayer && myPlayer && !myPlayer.isEliminated ? (
                            <>
                                {game.phase === 'claiming' && isMyTurn && (
                                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
                                            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                {game.currentClaim ? 'Raise the claim' : 'Open with a claim'}
                                            </div>

                                            <div className="mb-3 flex items-center gap-2">
                                                <button type="button" onClick={() => setClaimCount(c => Math.max(minClaim, c - 1))} className="h-10 w-10 rounded-lg bg-zinc-900 border border-white/10 font-bold hover:bg-zinc-800">−</button>
                                                <div className="flex-1 text-center">
                                                    <div className="text-3xl font-black">{claimCount}</div>
                                                    <div className="text-[9px] uppercase tracking-widest text-zinc-600">min {minClaim}</div>
                                                </div>
                                                <button type="button" onClick={() => setClaimCount(c => Math.min(20, c + 1))} className="h-10 w-10 rounded-lg bg-zinc-900 border border-white/10 font-bold hover:bg-zinc-800">+</button>
                                            </div>

                                            <div className="mb-4 flex flex-wrap gap-1.5 justify-center">
                                                {COLORS.map(c => (
                                                    <button key={c} type="button" onClick={() => setClaimColor(c)} className={`h-8 w-8 rounded-full border-2 transition-all ${CARD_COLORS[c]} ${claimColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`} title={c} />
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-4">
                                                <div>
                                                    <label className="text-[9px] uppercase text-zinc-600 font-bold mb-1 block">Tokens (max {myPlayer.tokens})</label>
                                                    <input type="number" min={0} max={myPlayer.tokens} value={wagerT} onChange={e => setWagerT(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-lg px-2 py-2 text-center font-bold focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] uppercase text-zinc-600 font-bold mb-1 block">Chips (max {myPlayer.chips})</label>
                                                    <input type="number" min={0} max={myPlayer.chips} value={wagerC} onChange={e => setWagerC(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-lg px-2 py-2 text-center font-bold focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>

                                            <button type="button" onClick={handleClaim} disabled={wagerT === 0 && wagerC === 0} className="w-full rounded-xl bg-indigo-600 py-3 font-black uppercase tracking-widest text-sm hover:bg-indigo-500 disabled:opacity-40 transition-colors">
                                                Submit Claim
                                            </button>
                                        </div>

                                        {game.currentClaim && (
                                            <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4">
                                                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-red-400">Or doubt the claim</div>
                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                    <div>
                                                        <label className="text-[9px] uppercase text-red-400/70 font-bold mb-1 block">Tokens</label>
                                                        <input type="number" min={0} max={myPlayer.tokens} value={doubtT} onChange={e => setDoubtT(Number(e.target.value))} className="w-full bg-black border border-red-500/30 rounded-lg px-2 py-2 text-center font-bold focus:outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] uppercase text-red-400/70 font-bold mb-1 block">Chips</label>
                                                        <input type="number" min={0} max={myPlayer.chips} value={doubtC} onChange={e => setDoubtC(Number(e.target.value))} className="w-full bg-black border border-red-500/30 rounded-lg px-2 py-2 text-center font-bold focus:outline-none" />
                                                    </div>
                                                </div>
                                                <p className="mb-3 text-center text-[10px] text-zinc-500">Wager value must be ≥ {minDoubtValue}</p>
                                                <button type="button" onClick={handleDoubt} disabled={getValue(doubtT, doubtC) < minDoubtValue} className="w-full rounded-xl bg-red-600 py-3 font-black uppercase tracking-widest text-xs hover:bg-red-500 disabled:opacity-40 shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-colors">
                                                    Declare Doubt
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {game.phase === 'responding' && isMyTurn && game.currentDoubt && game.currentClaim && (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-red-500/30 bg-zinc-950 p-5 text-center">
                                        <Zap className="mx-auto mb-3 text-red-500" size={28} />
                                        <h3 className="font-black uppercase text-lg tracking-widest mb-1">You Were Doubted</h3>
                                        <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                                            Match the difference or fold and forfeit your claim wager.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button type="button" onClick={handleFold} className="rounded-xl border border-white/10 bg-zinc-900 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-red-950 hover:text-red-400 hover:border-red-500/30 transition-colors">
                                                Fold
                                            </button>
                                            <button type="button" onClick={handleAccept} className="rounded-xl bg-indigo-600 py-3 text-xs font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg transition-colors">
                                                Match &amp; Show
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {!isMyTurn && game.state === 'playing' && game.phase !== 'showdown' && game.phase !== 'finished_round' && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                                        <div className="mb-2 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                            {activePlayer ? `${activePlayer.nickname}'s turn` : 'Waiting...'}
                                        </p>
                                    </div>
                                )}

                                {game.state === 'waiting' && amIPlayer && (
                                    <p className="text-center text-xs text-zinc-500 py-8">Lobby open — waiting for the host to deal.</p>
                                )}
                            </>
                        ) : myPlayer?.isEliminated ? (
                            <p className="text-center text-sm font-bold uppercase tracking-widest text-red-400/70 py-8">You&apos;ve been eliminated</p>
                        ) : (
                            <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-600 py-8">Spectator mode</p>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showRules && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" onClick={() => setShowRules(false)}>
                        <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }} onClick={e => e.stopPropagation()} className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-white/10 bg-zinc-950 p-8 shadow-2xl">
                            <button type="button" onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X /></button>
                            <h2 className="text-2xl font-black uppercase tracking-widest mb-6">Rules</h2>
                            <ul className="space-y-4 text-xs leading-relaxed text-zinc-400">
                                <li><strong className="text-zinc-200">Deck:</strong> 60 cards — 10 each of Yellow, Green, Blue, Purple, Red, and Rainbow. Rainbow counts as any color.</li>
                                <li><strong className="text-zinc-200">Chips &amp; cards:</strong> Each round you draw 1 card per chip (max 5 chips).</li>
                                <li><strong className="text-zinc-200">Claiming:</strong> Name a color and minimum count across all hands. Wager tokens and/or chips.</li>
                                <li><strong className="text-zinc-200">Doubting:</strong> Challenge the claim with a wager of equal or higher value (token = 1, chip = 10).</li>
                                <li><strong className="text-zinc-200">Responding:</strong> Fold (lose claim wager) or match to force a showdown.</li>
                                <li><strong className="text-zinc-200">Showdown:</strong> Cards revealed. If count is met, claimant wins. Otherwise doubter wins.</li>
                                <li><strong className="text-zinc-200">Devil&apos;s Tax:</strong> From round 15, every 5 rounds costs 1 token per player.</li>
                            </ul>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `.scbar-hide::-webkit-scrollbar { display: none; } .scbar-hide { -ms-overflow-style: none; scrollbar-width: none; }` }} />
        </div>
    );
}
