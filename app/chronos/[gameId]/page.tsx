'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { playSound } from '@/lib/sounds';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Shield, AlertTriangle, Crosshair, X, Watch, Ghost, UserRound, Flame, Info, Clock, Copy
} from 'lucide-react';

// --- TYPES ---
type Action = 'U' | 'D' | 'L' | 'R' | 'SU' | 'SD' | 'SL' | 'SR' | 'SH' | 'W';

interface Pos { x: number; y: number; }

interface TickResult {
  tickNum: number;
  p0Pos: Pos;
  p1Pos: Pos;
  p0Action: Action;
  p1Action: Action;
  p0Hit: boolean;
  p1Hit: boolean;
  lasers: { pIndex: number; direction: Action; path: Pos[] }[];
  isEnd: boolean;
}

interface Player {
  uid: string;
  sessionId?: string;
  nickname: string;
  color: string;
  score: number;
  ready: boolean;
  readyForNext: boolean;
  actions: Action[];
  pastActions: Action[];
}

interface GameDoc {
  creatorId: string;
  state: 'waiting' | 'programming' | 'executing' | 'finished';
  players: Player[];
  turn: number;
  matchWinner: string | null;
  executionResults?: TickResult[] | null;
  executionId?: string | null;
}

// --- CONSTANTS ---
const BOARD_SIZE = 5;
const WIN_SCORE = 3;

const ACTION_COLORS: Record<Action, string> = {
  'U': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  'D': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  'L': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  'R': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  'SU': 'bg-red-500/20 text-red-400 border-red-500/50',
  'SD': 'bg-red-500/20 text-red-400 border-red-500/50',
  'SL': 'bg-red-500/20 text-red-400 border-red-500/50',
  'SR': 'bg-red-500/20 text-red-400 border-red-500/50',
  'SH': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'W': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50',
};

const P0_START = { x: 0, y: 2 };
const P1_START = { x: 4, y: 2 };

// --- HELPER COMPONENTS ---
const ActionIcon = ({ a, size = 16 }: { a: Action; size?: number }) => {
  switch (a) {
    case 'U': return <ArrowUp size={size} />;
    case 'D': return <ArrowDown size={size} />;
    case 'L': return <ArrowLeft size={size} />;
    case 'R': return <ArrowRight size={size} />;
    case 'SU': return <Crosshair size={size} className="rotate-0" />;
    case 'SD': return <Crosshair size={size} className="rotate-180" />;
    case 'SL': return <Crosshair size={size} className="-rotate-90" />;
    case 'SR': return <Crosshair size={size} className="rotate-90" />;
    case 'SH': return <Shield size={size} />;
    case 'W': return <div className="w-1.5 h-1.5 rounded-full bg-current" />;
    default: return null;
  }
};

export default function ChronosAssassin() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [game, setGame] = useState<GameDoc | null>(null);
  
  const [localSessionId, setLocalSessionId] = useState('');
  useEffect(() => {
    let sid = localStorage.getItem('chronosSid');
    if (!sid) { sid = Math.random().toString(36).slice(2); localStorage.setItem('chronosSid', sid); }
    setTimeout(() => setLocalSessionId(sid), 0);
  }, []);

  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const { onAuthStateChanged } = require('firebase/auth');
    const unsub = onAuthStateChanged(auth, (u: any) => setUser(u));
    return () => unsub();
  }, []);

  const meIdx = useMemo(() => {
    if (!game || !Array.isArray(game.players)) return -1;
    const currentUserUid = auth.currentUser?.uid || user?.uid;
    return game.players.findIndex(p => (localSessionId && p.sessionId === localSessionId) || (currentUserUid && p.uid === currentUserUid));
  }, [game, localSessionId, user]);

  const [myActions, setMyActions] = useState<Action[]>(['W', 'W', 'W', 'W', 'W']);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  
  // Execution state
  const [currentTick, setCurrentTick] = useState<number>(-1);
  const meIdxRef = useRef(meIdx);

  useEffect(() => {
    meIdxRef.current = meIdx;
  }, [meIdx]);

  // Load game
  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, 'chronos_assassin_games', gameId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as GameDoc;
        setGame(data);
      }
    });
    return () => unsub();
  }, [gameId]);

  // Sync myActions when programming phase begins
  useEffect(() => {
    if (game && meIdx !== -1 && game.state === 'programming') {
      const p = game.players[meIdx];
      if (!p.ready) {
        setTimeout(() => setMyActions(p.actions.length === 5 ? p.actions : ['W', 'W', 'W', 'W', 'W']), 0);
      }
    }
  }, [game?.state, game?.turn, meIdx, game]);

  // Execute Simulation safely, tied directly to a unique executionId
  useEffect(() => {
    if (game?.state === 'executing' && game.executionResults && game.executionId) {
      setCurrentTick(0);
      
      const len = game.executionResults.length;
      let tick = 0;
      
      const interval = setInterval(() => {
        tick++;
        if (tick < len) {
          setCurrentTick(tick);
        } else {
          clearInterval(interval);
          
          const mIdx = meIdxRef.current;
          if (mIdx !== -1) {
            const ref = doc(db, 'chronos_assassin_games', gameId);
            runTransaction(db, async (t) => {
              const s = await t.get(ref);
              if (!s.exists()) return;
              
              const data = s.data() as GameDoc;
              if (!data.players || !data.players[mIdx]) return;
              
              // Defensive check: don't write if already true
              if (data.players[mIdx].readyForNext) return;
              
              const p = [...data.players];
              p[mIdx] = { ...p[mIdx], readyForNext: true };
              t.update(ref, { players: p });
            }).catch(console.error);
          }
        }
      }, 1500); 
      
      return () => clearInterval(interval);
    }
  }, [game?.executionId, gameId]); // Strictly depend on executionId

  // Reset for programming phase
  useEffect(() => {
    if (game?.state === 'programming') {
      setCurrentTick(-1);
    }
  }, [game?.state]);

  // Host compute state advancement
  useEffect(() => {
    const creatorIsMe = game && (game.creatorId === auth.currentUser?.uid || game.creatorId === user?.uid);
    if (!creatorIsMe) return;

    if (game.state === 'waiting' && game.players.length === 2) {
      updateDoc(doc(db, 'chronos_assassin_games', gameId), { state: 'programming' });
    }
    
    if (game.state === 'programming' && game.players.length === 2) {
      if (game.players[0].ready && game.players[1].ready) {
        const results = simulateTicks(game.players[0].actions, game.players[1].actions);
        
        const p0 = { ...game.players[0], readyForNext: false };
        const p1 = { ...game.players[1], readyForNext: false };

        updateDoc(doc(db, 'chronos_assassin_games', gameId), {
          state: 'executing',
          executionResults: results,
          executionId: Math.random().toString(36).slice(2),
          players: [p0, p1]
        });
      }
    }

    if (game.state === 'executing' && game.players.length === 2) {
      if (game.players[0].readyForNext && game.players[1].readyForNext) {
        const results = game.executionResults!;
        const finalTick = results[results.length - 1];
        let p0Score = game.players[0].score;
        let p1Score = game.players[1].score;
        
        let p0Past = game.players[0].actions;
        let p1Past = game.players[1].actions;
        let nextTurn = game.turn + 1;

        if (finalTick.p0Hit || finalTick.p1Hit) {
          if (finalTick.p0Hit && !finalTick.p1Hit) p1Score++;
          if (finalTick.p1Hit && !finalTick.p0Hit) p0Score++;
          p0Past = [];
          p1Past = [];
          nextTurn = 1; 
        }

        let state = 'programming';
        let matchWinner = null;
        if (p0Score >= WIN_SCORE) { matchWinner = game.players[0].uid; state = 'finished'; }
        if (p1Score >= WIN_SCORE) { matchWinner = game.players[1].uid; state = 'finished'; }

        const defaultActions = p0Past.length > 0 ? p0Past : ['W', 'W', 'W', 'W', 'W'];
        const defaultActions1 = p1Past.length > 0 ? p1Past : ['W', 'W', 'W', 'W', 'W'];

        const p0 = { ...game.players[0], score: p0Score, pastActions: p0Past, actions: defaultActions, ready: false, readyForNext: false };
        const p1 = { ...game.players[1], score: p1Score, pastActions: p1Past, actions: defaultActions1, ready: false, readyForNext: false };

        updateDoc(doc(db, 'chronos_assassin_games', gameId), {
          state,
          turn: nextTurn,
          matchWinner,
          players: [p0, p1],
          executionResults: null,
          executionId: null
        }).then(() => {
          // Fixed reference error - removed the dead setIsAnimating variable
          if (meIdx === 0) { setCurrentTick(-1); }
        });
      }
    }
  }, [game, meIdx, user, gameId]);

  const joinGame = async (nickname: string) => {
    if (!game || game.players.length >= 2) return;
    if (!auth.currentUser) {
      const { signInAnonymously } = await import('firebase/auth');
      await signInAnonymously(auth);
    }
    const isCreator = game.creatorId === auth.currentUser!.uid;
    const p: Player = {
      uid: auth.currentUser!.uid,
      sessionId: localSessionId,
      nickname,
      color: isCreator ? 'cyan' : 'rose',
      score: 0,
      ready: false,
      readyForNext: false,
      actions: ['W', 'W', 'W', 'W', 'W'],
      pastActions: []
    };
    const updateData: any = {
      players: arrayUnion(p)
    };
    if (game.players.length === 1) {
      updateData.state = 'programming';
    }
    await updateDoc(doc(db, 'chronos_assassin_games', gameId), updateData);
  };

  const handleActionSelect = (a: Action) => {
    playSound('chip');
    if (game?.state !== 'programming' || meIdx === -1) return;
    const me = game.players[meIdx];
    
    if (me.pastActions.length === 5) {
      const nextActions = [...myActions];
      nextActions[activeSlot] = a;
      
      let differences = 0;
      for (let i = 0; i < 5; i++) {
        if (nextActions[i] !== me.pastActions[i]) differences++;
      }
      
      if (differences > 1) {
        const resolved = [...me.pastActions];
        resolved[activeSlot] = a;
        setMyActions(resolved);
      } else {
        setMyActions(nextActions);
      }
    } else {
      const nextActions = [...myActions];
      nextActions[activeSlot] = a;
      setMyActions(nextActions);
    }
    
    if (activeSlot < 4) setActiveSlot(activeSlot + 1);
  };

  const lockIn = async () => {
    playSound('reaction');
    if (meIdx === -1) return;
    
    const ref = doc(db, 'chronos_assassin_games', gameId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists()) return;
        
        const data = snap.data();
        if (!data.players || !data.players[meIdx]) return;

        const players = [...data.players];
        players[meIdx] = { ...players[meIdx], actions: myActions, ready: true };
        transaction.update(ref, { players });
      });
    } catch (error) {
      console.error("Transaction failed: ", error);
    }
  };

  if (!game) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-cyan-500">INITIATING TIMELINE...</div>;

  const me = meIdx !== -1 ? game.players[meIdx] : null;
  const opp = meIdx === 0 ? game.players[1] : game.players[0];

  return (
    <div className="min-h-[100dvh] bg-black text-cyan-100 font-mono flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* HEADER */}
      <header className="p-4 border-b border-cyan-900/50 flex justify-between items-center bg-black/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Clock className="text-cyan-400" />
          <div>
            <h1 className="text-lg font-black uppercase tracking-widest text-cyan-400">Chronos Assassin</h1>
            <div className="text-xs text-cyan-500/50">Loop: {game.turn} | Match point: {WIN_SCORE}</div>
          </div>
        </div>
        
        {/* SCORES */}
        {game.players.length === 2 && (
          <div className="flex items-center gap-6">
            <div className={`text-right ${meIdx === 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
               <div className="text-xs opacity-70">{game.players[0].nickname}</div>
               <div className="font-black text-xl">{game.players[0].score}</div>
            </div>
            <div className="text-cyan-800 font-black">VS</div>
            <div className={`text-left ${meIdx === 1 ? 'text-cyan-400' : 'text-rose-400'}`}>
               <div className="text-xs opacity-70">{game.players[1].nickname}</div>
               <div className="font-black text-xl">{game.players[1].score}</div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN PLAY AREA */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-4xl mx-auto">
        
        {/* WAITING OVERLAY */}
        {game.state === 'waiting' && meIdx === -1 && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-cyan-950/20 border border-cyan-500/30 p-8 rounded-2xl w-full max-w-sm">
              <h2 className="text-xl font-black uppercase text-center text-cyan-400 mb-6">Enter Timeline</h2>
              <input 
                type="text" 
                id="join-nick" 
                placeholder="NICKNAME" 
                className="w-full bg-black border border-cyan-500/30 rounded-xl px-4 py-3 text-center mb-4 uppercase focus:outline-none focus:border-cyan-400"
                maxLength={10}
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById('join-nick') as HTMLInputElement).value;
                  if (val) joinGame(val);
                }}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase py-3 rounded-xl transition-transform active:scale-95"
              >
                Sync
              </button>
            </div>
          </div>
        )}

        {game.state === 'waiting' && meIdx !== -1 && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="text-center text-cyan-500 bg-cyan-950/40 border border-cyan-500/30 p-8 rounded-2xl w-full max-w-sm">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <div className="text-sm tracking-widest uppercase mb-6 animate-pulse">Waiting for paradox equivalent...</div>
              
              <div className="bg-black/50 rounded-xl p-4 border border-cyan-500/20">
                <div className="text-[10px] uppercase tracking-widest text-cyan-600 mb-2 font-bold">Timeline ID</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl tracking-widest text-cyan-300 break-all">{gameId}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(gameId);
                      playSound('chip');
                    }}
                    className="p-2 bg-cyan-900/50 hover:bg-cyan-800 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOARD */}
        <div className="relative aspect-square w-full max-w-[400px] border-2 border-cyan-900/50 bg-black/80 shadow-[0_0_50px_rgba(6,182,212,0.1)] mb-8">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 pointer-events-none">
            {Array.from({length: 25}).map((_, i) => (
              <div key={i} className="border border-cyan-900/20" />
            ))}
          </div>

          <BoardEntities game={game} currentTick={currentTick} meIdx={meIdx} />
        </div>

        {/* PROGRAMMING PANEL */}
        {game.state === 'programming' && me && (
          <div className="w-full max-w-lg bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-4 sm:p-6 backdrop-blur-md">
            
            {me.ready ? (
              <div className="text-center py-8 opacity-50">
                <Watch className="w-8 h-8 mx-auto mb-2 animate-spin-slow text-cyan-400" />
                Wait for timeline convergence...
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm tracking-widest text-cyan-400">PROGRAM SEQUENCE</div>
                  {me.pastActions.length > 0 && (
                    <div className="text-xs text-rose-400 flex items-center gap-1 opacity-80">
                      <Ghost size={14} /> 1 PARADOX TOKEN
                    </div>
                  )}
                </div>

                {/* Ghosts of Opponent */}
                {me.pastActions.length > 0 && opp && opp.pastActions.length === 5 && (
                  <div className="flex justify-between gap-2 mb-6 p-2 bg-rose-950/20 border border-rose-900/30 rounded-lg">
                    <div className="w-full flex justify-center text-[10px] text-rose-500/50 -rotate-90 sm:rotate-0 tracking-widest">GHOST</div>
                    {opp.pastActions.map((a, i) => (
                      <div key={i} className="flex-1 aspect-square flex items-center justify-center opacity-30 border-b-2 border-rose-500/50">
                         <ActionIcon a={a} />
                      </div>
                    ))}
                  </div>
                )}

                {/* SLOTS */}
                <div className="flex gap-2 sm:gap-4 mb-6">
                  {myActions.map((a, i) => {
                    const isChangedFromPast = me.pastActions.length > 0 && a !== me.pastActions[i];
                    return (
                      <button 
                        key={i} 
                        onClick={() => setActiveSlot(i)}
                        className={`flex-1 aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                          activeSlot === i ? 'border-cyan-400 bg-cyan-900/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 
                          isChangedFromPast ? 'border-rose-500 text-rose-400' : 'border-cyan-900/60 bg-black'
                        } hover:border-cyan-400`}
                      >
                         <ActionIcon a={a} size={24} />
                      </button>
                    )
                  })}
                </div>

                {/* ACTION PALETTE */}
                <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6">
                  {(['U', 'D', 'L', 'R', 'SU', 'SD', 'SL', 'SR', 'SH', 'W'] as Action[]).map(a => (
                    <button
                      key={a}
                      onClick={() => handleActionSelect(a)}
                      className={`aspect-square rounded flex items-center justify-center border transition-all hover:scale-105 active:scale-95 ${ACTION_COLORS[a]}`}
                    >
                      <ActionIcon a={a} />
                    </button>
                  ))}
                </div>

                <button 
                  onClick={lockIn}
                  className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                >
                  LOCK TIMELINE
                </button>
              </>
            )}
          </div>
        )}

        {/* FINISHED overlay */}
        {game.state === 'finished' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="text-center">
              <div className="text-6xl mb-4 font-black text-cyan-400 tracking-widest uppercase text-shadow-sm shadow-cyan-500">
                {game.matchWinner === me?.uid ? 'VICTORY' : 'DEFEAT'}
              </div>
              <p className="text-cyan-500/50 font-mono tracking-widest mb-8">TIMELINE COLLAPSED</p>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 bg-cyan-950 border border-cyan-500 text-cyan-400 font-mono uppercase tracking-widest rounded-xl hover:bg-cyan-900"
              >
                Return to Hub
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// --- BOARD RENDER HELPER ---
function BoardEntities({ game, currentTick, meIdx }: { game: GameDoc, currentTick: number, meIdx: number }) {
  if (!game || game.players.length < 2) return null;

  // Determine current positions
  let p0pos = P0_START;
  let p1pos = P1_START;
  let lasers: {pIndex: number, direction: string, path: Pos[]}[] = [];
  let p0Shield = false, p1Shield = false;
  let p0Hit = false, p1Hit = false;

  const showExecution = game.state === 'executing' && game.executionResults && currentTick >= 0;

  if (showExecution && game.executionResults) {
    const tNum = Math.min(currentTick, game.executionResults.length - 1);
    const tick = game.executionResults[tNum];
    p0pos = tick.p0Pos;
    p1pos = tick.p1Pos;
    
    // Animate actions
    if (tick.p0Action === 'SH') p0Shield = true;
    if (tick.p1Action === 'SH') p1Shield = true;
    lasers = tick.lasers;
    p0Hit = tick.p0Hit;
    p1Hit = tick.p1Hit;
  }

  const getPosStyle = (p: Pos) => ({
    top: `${(p.y / BOARD_SIZE) * 100}%`,
    left: `${(p.x / BOARD_SIZE) * 100}%`,
    width: `${100 / BOARD_SIZE}%`,
    height: `${100 / BOARD_SIZE}%`
  });

  return (
    <>
      {/* Lasers */}
      <AnimatePresence>
        {lasers.map((l, i) => (
           <motion.div
             key={`laser-${i}-${currentTick}`}
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 pointer-events-none"
           >
             {/* Render laser squares */}
             {l.path.map((pos, j) => (
                <div 
                  key={j} 
                  className="absolute bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse" 
                  style={{
                    ...getPosStyle(pos), 
                    margin: 'auto', 
                    width: `${100/BOARD_SIZE/3}%`, 
                    height: `${100/BOARD_SIZE/3}%`, 
                    left: `calc(${(pos.x/BOARD_SIZE)*100}% + ${(100/BOARD_SIZE)/3}%)`, 
                    top: `calc(${(pos.y/BOARD_SIZE)*100}% + ${(100/BOARD_SIZE)/3}%)`
                  }} 
                />
             ))}
           </motion.div>
        ))}
      </AnimatePresence>

      <motion.div 
        animate={getPosStyle(p0pos)}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute flex items-center justify-center p-2"
      >
        <div className={`w-full h-full rounded-md flex items-center justify-center ${meIdx === 0 ? 'bg-cyan-500 shadow-[0_0_20px_#06b6d4]' : 'bg-rose-500/50 border-2 border-rose-500'} ${p0Hit ? 'bg-zinc-800 border-zinc-500' : ''}`}>
           {p0Shield && <div className="absolute -inset-2 rounded-full border-4 border-purple-500/50 bg-purple-500/20" />}
           {p0Hit && <X className="absolute text-red-500 w-full h-full p-1" />}
           {!p0Hit && <UserRound size={20} className="text-black" />}
        </div>
      </motion.div>

      <motion.div 
        animate={getPosStyle(p1pos)}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute flex items-center justify-center p-2"
      >
        <div className={`w-full h-full rounded-md flex items-center justify-center ${meIdx === 1 ? 'bg-cyan-500 shadow-[0_0_20px_#06b6d4]' : 'bg-rose-500/50 border-2 border-rose-500'} ${p1Hit ? 'bg-zinc-800 border-zinc-500' : ''}`}>
           {p1Shield && <div className="absolute -inset-2 rounded-full border-4 border-purple-500/50 bg-purple-500/20" />}
           {p1Hit && <X className="absolute text-red-500 w-full h-full p-1" />}
           {!p1Hit && <UserRound size={20} className="text-black" />}
        </div>
      </motion.div>

      {/* Ghost layer during programming */}
      {game.state === 'programming' && game.players[0]?.pastActions?.length > 0 && (
         <>
           <div className="absolute top-2 left-2 text-[10px] text-cyan-500/30 uppercase tracking-widest pointer-events-none">Time Loop Active</div>
         </>
      )}
    </>
  );
}

// --- SIMULATION LOGIC ---

function simulateTicks(p0Actions: Action[], p1Actions: Action[]): TickResult[] {
  let p0pos = { ...P0_START };
  let p1pos = { ...P1_START };
  const results: TickResult[] = [];

  for (let tNum = 0; tNum < 5; tNum++) {
    const a0 = p0Actions[tNum] || 'W';
    const a1 = p1Actions[tNum] || 'W';

    // 1. Move calculation
    let t0 = { ...p0pos };
    let t1 = { ...p1pos };

    if (a0 === 'U' && t0.y > 0) t0.y--;
    if (a0 === 'D' && t0.y < 4) t0.y++;
    if (a0 === 'L' && t0.x > 0) t0.x--;
    if (a0 === 'R' && t0.x < 4) t0.x++;

    if (a1 === 'U' && t1.y > 0) t1.y--;
    if (a1 === 'D' && t1.y < 4) t1.y++;
    if (a1 === 'L' && t1.x > 0) t1.x--;
    if (a1 === 'R' && t1.x < 4) t1.x++;

    // Collision Check
    const bothSameTarget = (t0.x === t1.x && t0.y === t1.y);
    const swapped = (t0.x === p1pos.x && t0.y === p1pos.y && t1.x === p0pos.x && t1.y === p0pos.y);
    
    if (!bothSameTarget && !swapped) {
      p0pos = t0;
      p1pos = t1;
    }

    // 2. Action resolve (Shield & Shooting)
    let p0Shield = (a0 === 'SH');
    let p1Shield = (a1 === 'SH');
    
    let p0Hit = false;
    let p1Hit = false;
    let lasers: any[] = [];

    const calculateLaserPath = (pos: Pos, a: Action) => {
      let path: Pos[] = [];
      if (a === 'SU') for (let y = pos.y-1; y>=0; y--) path.push({x: pos.x, y});
      if (a === 'SD') for (let y = pos.y+1; y<=4; y++) path.push({x: pos.x, y});
      if (a === 'SL') for (let x = pos.x-1; x>=0; x--) path.push({x, y: pos.y});
      if (a === 'SR') for (let x = pos.x+1; x<=4; x++) path.push({x, y: pos.y});
      return path;
    };

    if (a0.startsWith('S') && a0 !== 'SH') {
      const path = calculateLaserPath(p0pos, a0);
      lasers.push({ pIndex: 0, direction: a0, path });
      if (!p1Shield && path.some(p => p.x === p1pos.x && p.y === p1pos.y)) p1Hit = true;
    }

    if (a1.startsWith('S') && a1 !== 'SH') {
      const path = calculateLaserPath(p1pos, a1);
      lasers.push({ pIndex: 1, direction: a1, path });
      if (!p0Shield && path.some(p => p.x === p0pos.x && p.y === p0pos.y)) p0Hit = true;
    }

    results.push({
      tickNum: tNum,
      p0Pos: { ...p0pos },
      p1Pos: { ...p1pos },
      p0Action: a0,
      p1Action: a1,
      p0Hit,
      p1Hit,
      lasers,
      isEnd: (p0Hit || p1Hit || tNum === 4)
    });

    if (p0Hit || p1Hit) {
      break; 
    }
  }

  return results;
}