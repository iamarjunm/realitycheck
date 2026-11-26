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
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="h-9 w-9 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            <Link
                href="/card-games"
                className="absolute top-5 left-5 z-20 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
            >
                <ArrowLeft size={14} /> Card Games
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-lg py-12 sm:py-6"
            >
                <div className="text-center mb-6">
                    <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-[#111113]">
                        <Flame className="text-rose-400" size={24} />
                    </div>
                    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400/90 mb-1.5">The Devil&apos;s Deduction</p>
                    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
                        Doubt &amp; Bet
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                        Bluff, wager, and call the lie. Last player standing wins.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-5 sm:p-6">
                        <label className="block text-xs font-medium text-zinc-400 mb-2">Your Identity</label>
                        <input
                            type="text"
                            suppressHydrationWarning
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            placeholder="Enter codename..."
                            maxLength={16}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors mb-4"
                        />
                        <div className="grid grid-cols-4 gap-2">
                            {AVATARS.map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => setAvatar(av)}
                                    className={`relative p-2 rounded-xl border transition-colors flex items-center justify-center ${avatar === av ? 'bg-amber-400/10 border-amber-400/60' : 'bg-zinc-950 border-zinc-800/80 opacity-60 hover:opacity-100 hover:border-zinc-700'}`}
                                >
                                    <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${av}`} alt={av} className="w-10 h-10 object-contain" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800/90 bg-[#111113] p-5 sm:p-6 space-y-5">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                                <Users size={13} className="text-zinc-400" /> Max Players
                            </label>
                            <div className="flex gap-2">
                                {[2, 3, 4, 5, 6].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        suppressHydrationWarning
                                        onClick={() => setMaxPlayers(num)}
                                        className={`flex-1 py-2.5 rounded-xl font-mono font-semibold text-sm border transition-colors ${maxPlayers === num ? 'border-amber-400/50 bg-amber-400/10 text-amber-300' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                                <Sparkles size={13} className="text-amber-400" /> Starting Tokens
                            </label>
                            <div className="flex gap-2">
                                {[10, 20, 50, 100].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        suppressHydrationWarning
                                        onClick={() => setStartingTokens(num)}
                                        className={`flex-1 py-2.5 rounded-xl font-mono font-semibold text-sm border transition-colors ${startingTokens === num ? 'border-rose-400/50 bg-rose-400/10 text-rose-300' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'}`}
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
                            className="w-full bg-zinc-50 hover:bg-white text-zinc-950 font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {busy ? 'Creating...' : 'Create Lobby'}
                        </button>
                    </div>

                    <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-zinc-800" />
                        <span className="mx-4 text-[11px] uppercase tracking-widest text-zinc-500 font-medium">or join</span>
                        <div className="flex-grow border-t border-zinc-800" />
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
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-sm text-center uppercase text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 tracking-[0.25em] transition-colors"
                        />
                        <button
                            type="button"
                            suppressHydrationWarning
                            onClick={joinGame}
                            disabled={busy || !inviteCode.trim()}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium px-6 py-3 rounded-xl text-sm disabled:opacity-40 transition-colors"
                        >
                            Join
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
