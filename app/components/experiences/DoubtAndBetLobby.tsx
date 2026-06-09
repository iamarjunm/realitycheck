'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Flame, Sparkles, Users } from 'lucide-react';
import { motion } from 'motion/react';

const AVATARS = ['Devil', 'Gambler', 'Dealer', 'Player', 'King', 'Queen', 'Joker', 'Spy'];

export default function DoubtAndBetLobby() {
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState('Devil');
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [startingTokens, setStartingTokens] = useState(20);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (!auth.currentUser) await signInAnonymously(auth);
            } catch (e) {
                console.error(e);
                setError('Could not connect. Refresh and try again.');
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const createGame = async () => {
        if (!auth.currentUser || busy) return;
        setBusy(true);
        setError(null);

        const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            await setDoc(doc(db, 'doubt_and_bet_games', newGameId), {
                creatorId: auth.currentUser.uid,
                state: 'waiting',
                maxPlayers: Number(maxPlayers),
                startingTokens: Number(startingTokens),
                players: [{
                    uid: auth.currentUser.uid,
                    nickname: nickname.trim() || 'Creator',
                    avatar,
                    tokens: Number(startingTokens),
                    chips: 5,
                    cards: [],
                    isEliminated: false,
                }],
                round: 0,
                turnIdx: 0,
                phase: 'waiting',
                currentClaim: null,
                currentDoubt: null,
                deck: [],
                logs: ['Lobby created. Waiting for players...'],
                winner: null,
                gameWinner: null,
            });
            router.push(`/doubt-and-bet/${newGameId}`);
        } catch (e) {
            console.error(e);
            setError('Failed to create lobby. Check Firebase permissions and try again.');
            setBusy(false);
        }
    };

    const joinGame = async () => {
        const code = inviteCode.trim().toUpperCase();
        if (!code || !auth.currentUser || busy) return;
        setBusy(true);
        setError(null);

        try {
            const snap = await getDoc(doc(db, 'doubt_and_bet_games', code));
            if (!snap.exists()) {
                setError('No lobby found with that code.');
                setBusy(false);
                return;
            }
            router.push(`/doubt-and-bet/${code}`);
        } catch (e) {
            console.error(e);
            setError('Could not join lobby. Check the code and try again.');
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07060f] flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#07060f] text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-700/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            <Link
                href="/card-games"
                className="absolute top-5 left-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
            >
                <ArrowLeft size={14} /> Card Games
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-950/50 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                        <Flame className="text-purple-400" size={28} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-400 mb-2">The Devil&apos;s Deduction</p>
                    <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-purple-300 via-fuchsia-400 to-indigo-500 drop-shadow-sm">
                        Doubt & Bet
                    </h1>
                    <p className="mt-3 text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        Bluff, wager, and call the lie. Last player standing wins.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200 text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="rounded-[1.75rem] border border-white/10 bg-black/50 backdrop-blur-xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                        <label className="block text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-3">Your Identity</label>
                        <input
                            type="text"
                            suppressHydrationWarning
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            placeholder="Enter codename..."
                            maxLength={16}
                            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-purple-500 transition-colors mb-4"
                        />
                        <div className="grid grid-cols-4 gap-2">
                            {AVATARS.map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => setAvatar(av)}
                                    className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${avatar === av ? 'bg-purple-900/60 border border-purple-500 scale-105 shadow-[0_0_20px_rgba(168,85,247,0.25)]' : 'border border-transparent opacity-50 hover:opacity-100 hover:bg-white/5'}`}
                                >
                                    <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${av}`} alt={av} className="w-10 h-10 object-contain" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-white/10 bg-black/50 backdrop-blur-xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] space-y-5">
                        <div>
                            <label className="flex items-center gap-2 text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-2">
                                <Users size={12} /> Max Players
                            </label>
                            <div className="flex gap-2">
                                {[2, 3, 4, 5, 6].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        suppressHydrationWarning
                                        onClick={() => setMaxPlayers(num)}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${maxPlayers === num ? 'bg-white text-black shadow-lg' : 'bg-zinc-950 text-zinc-400 border border-white/10 hover:border-white/20'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-2">
                                <Sparkles size={12} /> Starting Tokens
                            </label>
                            <div className="flex gap-2">
                                {[10, 20, 50, 100].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        suppressHydrationWarning
                                        onClick={() => setStartingTokens(num)}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${startingTokens === num ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'bg-zinc-950 text-zinc-400 border border-white/10 hover:border-white/20'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            suppressHydrationWarning
                            onClick={createGame}
                            disabled={busy}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-xl uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_0_30px_rgba(147,51,234,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {busy ? 'Creating...' : 'Create Lobby'}
                        </button>
                    </div>

                    <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-white/10" />
                        <span className="mx-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">or join</span>
                        <div className="flex-grow border-t border-white/10" />
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            suppressHydrationWarning
                            value={inviteCode}
                            onChange={e => setInviteCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && joinGame()}
                            placeholder="INVITE CODE"
                            maxLength={6}
                            className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 font-mono text-center uppercase text-white focus:outline-none focus:border-indigo-500 tracking-[0.3em]"
                        />
                        <button
                            type="button"
                            suppressHydrationWarning
                            onClick={joinGame}
                            disabled={busy || !inviteCode.trim()}
                            className="bg-white text-black font-black px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                        >
                            Join
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
