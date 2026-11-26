'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Flame, Sparkles, Users } from 'lucide-react';
import { motion } from 'motion/react';
import GameArtwork from '@/components/GameArtwork';

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
            <div
                className="min-h-screen bg-[#0c0b0e] atelier-bg flex items-center justify-center"
                style={{ backgroundImage: 'radial-gradient(ellipse at top, rgba(16, 100, 72, 0.16), transparent 60%)' }}
            >
                <div className="h-9 w-9 rounded-full border-2 border-[#e6c27a]/25 border-t-[#e6c27a] animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-[#0c0b0e] atelier-bg text-[#f5efe2] flex flex-col items-center justify-center px-4 py-14 sm:py-8 font-sans relative overflow-x-hidden"
            style={{
                backgroundImage: 'radial-gradient(ellipse at top, rgba(16, 100, 72, 0.16), transparent 60%)',
            }}
        >
            <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />

            <Link
                href="/card-games"
                className="absolute top-5 left-5 z-20 inline-flex items-center gap-2 rounded-xl border border-[#e6c27a]/25 bg-[#0f1714]/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-[#d6cbb8] hover:text-[#faf4e8] hover:border-[#e6c27a]/50 transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            >
                <ArrowLeft size={14} className="text-[#e6c27a]" /> Card Games
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative z-10 w-full max-w-lg py-4 space-y-4"
            >
                {/* Framed Parlor Key-Art Banner */}
                <div className="atelier-card rounded-2xl overflow-hidden border border-[#e6c27a]/25 shadow-[0_24px_64px_rgba(0,0,0,0.75)]">
                    <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-[#0c1613]">
                        <GameArtwork id="doubt-and-bet" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1211] via-[#0d1211]/45 to-transparent" />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e6c27a]/55 to-transparent" />

                        <div className="absolute top-3 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#e6c27a]/30 bg-[#0b1210]/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#e6c27a]">
                            <Flame size={11} className="text-[#e0525c]" />
                            <span>The Devil&apos;s Deduction</span>
                        </div>

                        <div className="absolute bottom-3 left-4 right-4">
                            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#faf4e8] leading-none">
                                Doubt <span className="font-serif italic font-normal text-[#e6c27a]">&amp; Bet</span>
                            </h1>
                            <p className="mt-1.5 text-xs text-[#cbbda8] max-w-sm leading-relaxed">
                                Bluff, wager, and call the lie. Last player standing claims the table.
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-[#dc2626]/40 bg-[#450a0a]/60 px-4 py-3 text-sm text-[#fecaca] text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="atelier-card rounded-2xl p-5 sm:p-6">
                        <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-2">Your Identity</label>
                        <input
                            type="text"
                            suppressHydrationWarning
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            placeholder="Enter codename..."
                            maxLength={16}
                            className="w-full bg-[#090d0c] border border-[#e6c27a]/20 rounded-xl px-4 py-2.5 text-sm font-medium text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 transition-colors mb-4"
                        />
                        <div className="grid grid-cols-4 gap-2">
                            {AVATARS.map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => setAvatar(av)}
                                    className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${
                                        avatar === av
                                            ? 'bg-[#e6c27a]/15 border-[#e6c27a]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                                            : 'bg-[#090d0c] border-[#e6c27a]/15 opacity-65 hover:opacity-100 hover:border-[#e6c27a]/40'
                                    }`}
                                >
                                    <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${av}`} alt={av} className="w-10 h-10 object-contain" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="atelier-card rounded-2xl p-5 sm:p-6 space-y-5">
                        <div>
                            <label className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-2">
                                <Users size={13} className="text-emerald-400" /> Max Players
                            </label>
                            <div className="flex gap-2">
                                {[2, 3, 4, 5, 6].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        suppressHydrationWarning
                                        onClick={() => setMaxPlayers(num)}
                                        className={`flex-1 py-2.5 rounded-xl font-mono font-semibold text-sm border transition-all ${
                                            maxPlayers === num
                                                ? 'border-[#e6c27a]/65 bg-[#e6c27a]/15 text-[#f3d99d]'
                                                : 'bg-[#090d0c] text-[#9e9282] border-[#e6c27a]/15 hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-[#b9ab96] mb-2">
                                <Sparkles size={13} className="text-[#e6c27a]" /> Starting Tokens
                            </label>
                            <div className="flex gap-2">
                                {[10, 20, 50, 100].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        suppressHydrationWarning
                                        onClick={() => setStartingTokens(num)}
                                        className={`flex-1 py-2.5 rounded-xl font-mono font-semibold text-sm border transition-all ${
                                            startingTokens === num
                                                ? 'border-emerald-400/55 bg-emerald-950/45 text-emerald-200'
                                                : 'bg-[#090d0c] text-[#9e9282] border-[#e6c27a]/15 hover:border-[#e6c27a]/35 hover:text-[#f5efe2]'
                                        }`}
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
                            className="btn-brass w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {busy ? 'Creating...' : 'Create Lobby'}
                        </button>
                    </div>

                    <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-[#e6c27a]/15" />
                        <span className="mx-4 text-[11px] font-mono uppercase tracking-[0.2em] text-[#8e8271] font-medium">or join</span>
                        <div className="flex-grow border-t border-[#e6c27a]/15" />
                    </div>

                    <div className="atelier-card rounded-2xl p-3 flex gap-2">
                        <input
                            type="text"
                            suppressHydrationWarning
                            value={inviteCode}
                            onChange={e => setInviteCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && joinGame()}
                            placeholder="INVITE CODE"
                            maxLength={6}
                            className="flex-1 bg-[#090d0c] border border-[#e6c27a]/20 rounded-xl px-4 py-3 font-mono text-sm text-center uppercase text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 tracking-[0.25em] transition-colors"
                        />
                        <button
                            type="button"
                            suppressHydrationWarning
                            onClick={joinGame}
                            disabled={busy || !inviteCode.trim()}
                            className="btn-obsidian font-semibold px-6 py-3 rounded-xl text-sm disabled:opacity-40"
                        >
                            Join
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
