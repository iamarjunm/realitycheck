"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Crosshair } from 'lucide-react';

const AVATARS = ['Jack', 'King', 'Queen', 'Joker', 'Ace', 'Spade', 'Heart', 'Club', 'Diamond', 'Sniper', 'Bullet', 'Ghost'];

const SniperHoldemLobby = () => {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [startingChips, setStartingChips] = useState(1000);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('Jack');

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error", error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const createGame = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    
    try {
      const docRef = await addDoc(collection(db, "sniper_holdem_games"), {
        state: 'waiting',
        creatorId: auth.currentUser.uid,
        maxPlayers: Number(maxPlayers),
        startingChips: Number(startingChips),
        players: [{
          uid: auth.currentUser.uid,
          nickname: nickname.trim() || 'Creator',
          avatar: avatar,
          chips: Number(startingChips),
          cards: [],
          bet: 0,
          snipe: null,
          hasFolded: false,
          joinedAt: Date.now()
        }],
        deck: [],
        communityCards: [],
        pot: 0,
        currentBet: 0,
        dealerIdx: 0,
        turnIdx: 0,
        phase: 'preflop',
        playersActed: 0,
        logs: ["Game created. Waiting for targets..."],
        createdAt: serverTimestamp(),
        winner: null,
        handWinners: []
      });
      router.push(`/sniper-holdem/${docRef.id}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const joinGame = () => {
    if (inviteCode.trim()) {
      router.push(`/sniper-holdem/${inviteCode.trim()}`);
    }
  };

  if (loading) return (
    <div className="flex min-h-[40vh] items-center justify-center p-4">
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-red-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-black/85 backdrop-blur-xl border border-red-900/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_60px_rgba(220,38,38,0.12)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-40 w-40 bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-125 duration-700"></div>
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-red-900/10 rounded-full blur-3xl -ml-20 -mb-20 transition-transform group-hover:scale-125 duration-700"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-950/50 shadow-[0_0_20px_rgba(220,38,38,0.25)]">
            <Crosshair className="h-6 w-6 animate-pulse text-red-500" />
          </div>
          
          <div className="mb-3 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-red-400">
            The Devil&apos;s Plan
          </div>
          <h1 className="mb-5 text-center text-3xl font-black uppercase tracking-tighter text-white drop-shadow-lg sm:text-4xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-800">Sniper</span> Hold&apos;em
          </h1>
          
          {/* Profile Section */}
          <div className="mb-4 w-full rounded-2xl border border-white/5 bg-zinc-950/80 p-4 shadow-inner sm:p-5">
            <h2 className="mb-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
              <span className="h-px bg-zinc-800 flex-1"></span>
              Agent Identity
              <span className="h-px bg-zinc-800 flex-1"></span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Codename</label>
                <input 
                  type="text" 
                  value={nickname} 
                  onChange={e => setNickname(e.target.value)} 
                  placeholder="Enter Nickname..."
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 font-bold text-base text-white shadow-inner transition-colors focus:border-red-500 focus:outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Avatar Selection</label>
                <div className="grid h-28 grid-cols-4 gap-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black p-2">
                    {AVATARS.map(av => (
                        <button 
                          key={av} 
                          onClick={() => setAvatar(av)}
                          className={`relative flex items-center justify-center rounded-lg p-1 transition-all ${avatar === av ? 'scale-105 border border-red-500 bg-red-900/50 shadow-lg' : 'opacity-50 hover:scale-105 hover:bg-white/10 hover:opacity-100'}`}
                        >
                            <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${av}`} alt={av} className="h-9 w-9 object-contain" />
                        </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 w-full rounded-2xl border border-white/5 bg-zinc-950/80 p-4 shadow-inner sm:p-5">
            <h2 className="mb-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
              <span className="h-px bg-zinc-800 flex-1"></span>
              Mission Parameters
              <span className="h-px bg-zinc-800 flex-1"></span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Max Assailants</label>
                <div className="flex gap-1 overflow-hidden rounded-xl border border-white/10 bg-black p-1">
                  {[2, 3, 4, 5, 6, 7, 8].map(num => (
                    <button
                      key={num}
                      onClick={() => setMaxPlayers(num)}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-black transition-all ${maxPlayers === num ? 'border border-red-500/50 bg-red-900/50 text-red-400 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'text-zinc-600 hover:bg-white/5 hover:text-zinc-300'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Starting Bankroll</label>
                <input 
                  type="number" 
                  value={startingChips} 
                  onChange={e => setStartingChips(Number(e.target.value))} 
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 font-mono text-base font-bold text-white shadow-inner transition-colors focus:border-red-500 focus:outline-none" 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={createGame}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 py-4 font-black uppercase tracking-[0.18em] text-white shadow-[0_0_24px_rgba(220,38,38,0.35)] transition-all hover:bg-red-500 active:scale-[0.98]"
          >
            Deploy Lobby
            <Crosshair className="h-4 w-4 transition-transform hover:rotate-90" />
          </button>

          <div className="relative mb-3 flex w-full items-center py-3">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="mx-4 flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-zinc-600">Or Intercept Existing Game</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <div className="flex w-full gap-3">
            <input 
              type="text" 
              placeholder="Enter Access Code..." 
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-black px-4 py-3 focus:border-red-500 focus:outline-none transition-colors tracking-widest font-mono text-sm placeholder:text-zinc-700"
            />
            <button 
              onClick={joinGame}
              disabled={!inviteCode.trim()}
              className="rounded-2xl border border-white/10 bg-zinc-800 px-5 font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800"
            >
              Infiltrate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SniperHoldemLobby;
