'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Skull,
  Zap,
  Eye,
  RefreshCw,
  ArrowUpRight,
  Lock,
  Heart,
  Crosshair,
  ShieldAlert,
  RotateCcw,
  Trophy,
  Copy,
  Check,
  Flame,
} from 'lucide-react';
import {
  ModChipType,
  RoulettePvPDoc,
  RoulettePvPPlayer,
  ShellType,
  buildPvPMagazine,
  drawPvPChips,
} from '@/lib/glitch-roulette';
import { playSound } from '@/lib/sounds';

const CHIP_META: Record<
  ModChipType,
  {
    name: string;
    desc: string;
    accent: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  xray: {
    name: 'X-Ray',
    desc: 'Scan next shell',
    accent:
      'border-[#e6c27a]/25 bg-gradient-to-b from-[#1b181d] to-[#110f13] text-[#f5efe2] hover:border-[#e6c27a]/65 hover:from-[#231e24]',
    icon: Eye,
  },
  overclock: {
    name: 'Overclock',
    desc: '2× LIVE dmg',
    accent:
      'border-[#dc2626]/40 bg-gradient-to-b from-[#231317] to-[#130c0f] text-[#f5efe2] hover:border-[#ef4444]/75 hover:from-[#2d161b]',
    icon: Flame,
  },
  invert: {
    name: 'Flip',
    desc: 'LIVE ↔ BLANK',
    accent:
      'border-[#e6c27a]/35 bg-gradient-to-b from-[#1e1915] to-[#120f0d] text-[#f5efe2] hover:border-[#e6c27a]/75 hover:from-[#272019]',
    icon: RefreshCw,
  },
  eject: {
    name: 'Eject',
    desc: 'Discard next',
    accent:
      'border-[#d6cbb8]/20 bg-gradient-to-b from-[#19171c] to-[#100e12] text-[#f5efe2] hover:border-[#e6c27a]/55 hover:from-[#221f26]',
    icon: ArrowUpRight,
  },
  cuff: {
    name: 'Cuff Lock',
    desc: 'Skip rival turn',
    accent:
      'border-[#e6c27a]/35 bg-gradient-to-b from-[#1e1915] to-[#120f0d] text-[#f5efe2] hover:border-[#e6c27a]/75 hover:from-[#272019]',
    icon: Lock,
  },
  siphon: {
    name: 'Siphon +1',
    desc: 'Heal 1 HP',
    accent:
      'border-emerald-500/35 bg-gradient-to-b from-[#111e1a] to-[#0c1311] text-[#f5efe2] hover:border-emerald-400/70 hover:from-[#162923]',
    icon: Heart,
  },
};

function GlitchRoulettePvPContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = (params.gameId as string).toUpperCase();
  const initialName = (searchParams.get('name') || '').slice(0, 14);

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [sid, setSid] = useState('');
  const [gameDoc, setGameDoc] = useState<RoulettePvPDoc | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<'live' | 'blank' | 'glitch' | null>(null);

  const autoJoinedRef = useRef(false);
  const lastFlashRef = useRef('');

  const sfx = useCallback(
    (type: Parameters<typeof playSound>[0]) => {
      if (soundEnabled) playSound(type);
    },
    [soundEnabled]
  );

  useEffect(() => {
    let local = sessionStorage.getItem('rouletteTabSid');
    if (!local) {
      local = Math.random().toString(36).slice(2);
      sessionStorage.setItem('rouletteTabSid', local);
    }
    setSid(local);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) setUid(u.uid);
      else {
        const cred = await signInAnonymously(auth);
        setUid(cred.user.uid);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, 'glitch_roulette_games', gameId), (snap) => {
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      setGameDoc(snap.data() as RoulettePvPDoc);
    });
    return () => unsub();
  }, [gameId]);

  const meIdx = useMemo(() => {
    if (!gameDoc) return -1;
    if (sid) {
      const bySid = gameDoc.players.findIndex((p) => p.sessionId === sid);
      if (bySid !== -1) return bySid;
    }
    if (uid) return gameDoc.players.findIndex((p) => p.uid === uid);
    return -1;
  }, [gameDoc, sid, uid]);

  // React to flashes / sounds across both clients
  useEffect(() => {
    if (!gameDoc || !gameDoc.lastFlashId || lastFlashRef.current === gameDoc.lastFlashId) return;
    lastFlashRef.current = gameDoc.lastFlashId;
    if (gameDoc.lastFlash === 'live') {
      sfx('gunshot');
      setFlash('live');
      setShake(true);
    } else if (gameDoc.lastFlash === 'blank') {
      sfx('blank_click');
      setFlash('blank');
    } else if (gameDoc.lastFlash === 'glitch') {
      sfx('paradox');
      setFlash('glitch');
    }
    const t = setTimeout(() => {
      setFlash(null);
      setShake(false);
    }, 320);
    if (gameDoc.state === 'finished' && meIdx !== -1 && gameDoc.winnerUid === gameDoc.players[meIdx]?.uid) {
      sfx('win');
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
    }
    return () => clearTimeout(t);
  }, [gameDoc, meIdx, sfx]);

  const joinRoom = useCallback(
    async (nickname: string) => {
      if (!uid || !sid || busy) return;
      setBusy(true);
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'glitch_roulette_games', gameId);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() as RoulettePvPDoc;
          if (data.players.length >= 2 || data.players.some((p) => p.sessionId === sid)) return;
          const p: RoulettePvPPlayer = {
            uid,
            sessionId: sid,
            nickname: nickname.slice(0, 14),
            hp: data.maxHp,
            chips: drawPvPChips(data.chipsPerLoad, []),
            cuffed: false,
            scannedNext: null,
          };
          tx.update(ref, {
            players: [...data.players, p],
            state: 'playing',
          });
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, gameId, sid, uid]
  );

  useEffect(() => {
    if (
      !autoJoinedRef.current &&
      uid &&
      sid &&
      gameDoc &&
      gameDoc.state === 'waiting' &&
      initialName &&
      meIdx === -1 &&
      gameDoc.players.length < 2
    ) {
      autoJoinedRef.current = true;
      joinRoom(initialName);
    }
  }, [gameDoc, initialName, joinRoom, meIdx, sid, uid]);

  const handleUseChip = async (chipIdx: number) => {
    if (!gameDoc || gameDoc.state !== 'playing' || meIdx === -1 || gameDoc.turnIdx !== meIdx || busy) return;
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'glitch_roulette_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as RoulettePvPDoc;
        if (data.state !== 'playing' || data.turnIdx !== meIdx || data.chamber.length === 0) return;

        const players = data.players.map((p) => ({ ...p, chips: [...p.chips] }));
        const meP = players[meIdx];
        const oppIdx = meIdx === 0 ? 1 : 0;
        const oppP = players[oppIdx];
        const chip = meP.chips[chipIdx];
        if (!chip) return;

        if (chip === 'overclock' && data.overclocked) return;
        if (chip === 'cuff' && oppP.cuffed) return;
        if (chip === 'siphon' && meP.hp >= data.maxHp) return;

        meP.chips.splice(chipIdx, 1);

        let chamber = [...data.chamber];
        let overclocked = data.overclocked;
        let cylinderAngle = data.cylinderAngle;
        let lastEvent = data.lastEvent;

        if (chip === 'xray') {
          meP.scannedNext = chamber[0];
          lastEvent = `${meP.nickname} SCANNED THE NEXT SHELL.`;
        } else if (chip === 'overclock') {
          overclocked = true;
          lastEvent = `${meP.nickname} ARMED 2× OVERCLOCK!`;
        } else if (chip === 'invert') {
          const flipped: ShellType = chamber[0] === 'live' ? 'blank' : 'live';
          chamber[0] = flipped;
          if (meP.scannedNext !== null) meP.scannedNext = flipped;
          if (oppP.scannedNext !== null) oppP.scannedNext = null;
          lastEvent = `${meP.nickname} FLIPPED SHELL POLARITY!`;
        } else if (chip === 'eject') {
          const ejected = chamber.shift()!;
          meP.scannedNext = null;
          oppP.scannedNext = null;
          cylinderAngle += 60;
          lastEvent = `${meP.nickname} EJECTED A ${ejected.toUpperCase()} SHELL!`;
          if (chamber.length === 0) {
            chamber = buildPvPMagazine();
            players[0].chips = drawPvPChips(data.chipsPerLoad, players[0].chips);
            players[1].chips = drawPvPChips(data.chipsPerLoad, players[1].chips);
            const liveCnt = chamber.filter((s) => s === 'live').length;
            lastEvent = `RELOADED: ${liveCnt} LIVE · ${chamber.length - liveCnt} BLANK`;
          }
        } else if (chip === 'cuff') {
          oppP.cuffed = true;
          lastEvent = `${meP.nickname} CUFF-LOCKED ${oppP.nickname}!`;
        } else if (chip === 'siphon') {
          meP.hp = Math.min(data.maxHp, meP.hp + 1);
          lastEvent = `${meP.nickname} SIPHONED +1 INTEGRITY!`;
        }

        tx.update(ref, {
          players,
          chamber,
          overclocked,
          cylinderAngle,
          lastEvent,
          lastFlash: 'glitch',
          lastFlashId: Math.random().toString(36).slice(2),
        });
      });
    } finally {
      setBusy(false);
    }
  };

  const handleFire = async (targetSelf: boolean) => {
    if (!gameDoc || gameDoc.state !== 'playing' || meIdx === -1 || gameDoc.turnIdx !== meIdx || busy) return;
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'glitch_roulette_games', gameId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as RoulettePvPDoc;
        if (data.state !== 'playing' || data.turnIdx !== meIdx || data.chamber.length === 0) return;

        const players = data.players.map((p) => ({ ...p, chips: [...p.chips], scannedNext: null }));
        const shooterIdx = meIdx as 0 | 1;
        const oppIdx = (meIdx === 0 ? 1 : 0) as 0 | 1;
        const targetIdx = targetSelf ? shooterIdx : oppIdx;

        const shell = data.chamber[0];
        let remaining = data.chamber.slice(1);
        const dmg = shell === 'live' ? (data.overclocked ? 2 : 1) : 0;

        let lastEvent = '';
        if (shell === 'live') {
          players[targetIdx].hp = Math.max(0, players[targetIdx].hp - dmg);
          lastEvent = `${players[shooterIdx].nickname} FIRED LIVE! ${dmg} DMG TO ${players[targetIdx].nickname}.`;
        } else {
          lastEvent = targetSelf
            ? `CLICK! ${players[shooterIdx].nickname} SURVIVED BLANK — EXTRA TURN!`
            : `CLICK! ${players[shooterIdx].nickname} SHOT A BLANK AT ${players[oppIdx].nickname}.`;
        }

        // Check winner
        let state: RoulettePvPDoc['state'] = 'playing';
        let winnerUid: string | null = null;
        if (players[0].hp <= 0) {
          state = 'finished';
          winnerUid = players[1].uid;
        } else if (players[1].hp <= 0) {
          state = 'finished';
          winnerUid = players[0].uid;
        }

        // Next turn
        let nextTurnIdx: 0 | 1 = shell === 'blank' && targetSelf ? shooterIdx : oppIdx;
        if (state === 'playing' && players[nextTurnIdx].cuffed) {
          players[nextTurnIdx].cuffed = false;
          nextTurnIdx = nextTurnIdx === 0 ? 1 : 0;
          lastEvent += ` (CUFF SKIP!)`;
        }

        // Reload if empty
        if (state === 'playing' && remaining.length === 0) {
          remaining = buildPvPMagazine();
          players[0].chips = drawPvPChips(data.chipsPerLoad, players[0].chips);
          players[1].chips = drawPvPChips(data.chipsPerLoad, players[1].chips);
          const liveCnt = remaining.filter((s) => s === 'live').length;
          lastEvent += ` | RELOAD: ${liveCnt} LIVE · ${remaining.length - liveCnt} BLANK`;
        }

        tx.update(ref, {
          state,
          winnerUid,
          turnIdx: nextTurnIdx,
          chamber: remaining,
          overclocked: false,
          cylinderAngle: data.cylinderAngle + 60,
          players,
          lastEvent,
          lastFlash: shell === 'live' ? 'live' : 'blank',
          lastFlashId: Math.random().toString(36).slice(2),
        });
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRematch = async () => {
    if (!gameDoc || meIdx !== 0 || busy) return;
    setBusy(true);
    const mag = buildPvPMagazine();
    const liveCnt = mag.filter((s) => s === 'live').length;
    try {
      await updateDoc(doc(db, 'glitch_roulette_games', gameId), {
        state: 'playing',
        turnIdx: 0,
        chamber: mag,
        overclocked: false,
        cylinderAngle: 0,
        winnerUid: null,
        lastEvent: `REMATCH LOADED: ${liveCnt} LIVE · ${mag.length - liveCnt} BLANK`,
        lastFlash: 'glitch',
        lastFlashId: Math.random().toString(36).slice(2),
        players: gameDoc.players.map((p) => ({
          ...p,
          hp: gameDoc.maxHp,
          chips: drawPvPChips(gameDoc.chipsPerLoad, []),
          cuffed: false,
          scannedNext: null,
        })),
      });
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0c0b0e] atelier-bg flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#faf4e8]">
          Chamber <span className="font-serif italic font-normal text-[#e6c27a]">Not Found</span>
        </h1>
        <button
          type="button"
          onClick={() => router.push('/glitch-roulette')}
          className="btn-brass px-5 py-2.5 rounded-xl font-display font-bold text-xs"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  if (!gameDoc) {
    return (
      <div className="min-h-screen bg-[#0c0b0e] atelier-bg flex items-center justify-center font-mono text-xs uppercase tracking-widest text-[#e6c27a]">
        Connecting to Chamber...
      </div>
    );
  }

  const meP = meIdx !== -1 ? gameDoc.players[meIdx] : null;
  const oppP = meIdx !== -1 && gameDoc.players.length === 2 ? gameDoc.players[meIdx === 0 ? 1 : 0] : null;
  const isMyTurn = gameDoc.state === 'playing' && meIdx !== -1 && gameDoc.turnIdx === meIdx;
  const liveLeft = gameDoc.chamber.filter((s) => s === 'live').length;
  const blankLeft = gameDoc.chamber.length - liveLeft;
  const liveOdds = gameDoc.chamber.length > 0 ? Math.round((liveLeft / gameDoc.chamber.length) * 100) : 0;

  return (
    <motion.div
      animate={shake ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.28 }}
      className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0c0b0e] atelier-bg text-[#f5efe2] flex flex-col relative"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 75% 45% at 50% 0%, rgba(168, 28, 36, 0.16), rgba(230, 194, 122, 0.04) 50%, transparent 75%)',
      }}
    >
      <div className="atelier-grain pointer-events-none fixed inset-0 z-0" />

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.38 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26 }}
            className={`pointer-events-none fixed inset-0 z-50 ${
              flash === 'live' ? 'bg-[#b91c1c]/45' : flash === 'glitch' ? 'bg-[#e6c27a]/18' : 'bg-[#f5efe2]/12'
            }`}
          />
        )}
      </AnimatePresence>

      {/* HUD */}
      <header className="relative z-20 w-full border-b border-[#e6c27a]/15 bg-[#0e0c10]/90 backdrop-blur-md shrink-0">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/glitch-roulette')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#b8aa95] hover:text-[#faf4e8] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#e6c27a]" /> Lobby
            </button>
            <span className="text-[#e6c27a]/25">|</span>
            <span className="font-display font-bold tracking-tight text-xs sm:text-sm text-[#faf4e8]">
              Glitch <span className="font-serif italic font-normal text-[#e6c27a]">Roulette</span> 1v1
            </span>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full border border-[#e6c27a]/25 bg-[#171318] text-[#e6c27a]">
              {gameId}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className="btn-obsidian p-1.5 rounded-lg"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#e6c27a]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#7a6f61]" />
            )}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1360px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center gap-3">
        {gameDoc.state === 'waiting' && (
          <div className="max-w-md w-full mx-auto atelier-card rounded-2xl p-6 text-center space-y-4 border border-[#e6c27a]/25">
            <div className="mx-auto w-12 h-12 rounded-2xl border border-[#e6c27a]/30 bg-[#151116] flex items-center justify-center shadow-inner">
              <Skull className="w-6 h-6 text-[#e0525c]" />
            </div>
            {meIdx === -1 ? (
              <>
                <h1 className="font-display text-xl font-bold tracking-tight text-[#faf4e8]">
                  Enter <span className="font-serif italic font-normal text-[#e6c27a]">1v1 Chamber</span>
                </h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="CODENAME"
                    maxLength={14}
                    className="flex-1 bg-[#0a090c] border border-[#e6c27a]/20 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase text-[#f5efe2] placeholder:text-[#6f6559] focus:outline-none focus:border-[#e6c27a]/60 transition-colors"
                  />
                  <button
                    type="button"
                    disabled={busy || !joinName.trim()}
                    onClick={() => joinRoom(joinName.trim())}
                    className="btn-crimson px-5 py-2.5 rounded-xl font-display font-bold text-xs disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-display text-xl font-bold tracking-tight text-[#faf4e8]">
                  Waiting for <span className="font-serif italic font-normal text-[#e6c27a]">Rival</span>
                </h1>
                <div className="flex items-center justify-between bg-[#0a090c] border border-[#e6c27a]/25 rounded-xl px-4 py-3 text-left shadow-inner">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#9c8f7e]">Chamber Code</div>
                    <div className="font-mono text-2xl font-bold tracking-[0.22em] text-[#e6c27a]">{gameId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(gameId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    }}
                    className="btn-obsidian px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#e6c27a]" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {gameDoc.state !== 'waiting' && meP && oppP && (
          <>
            {/* HP Bars */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div
                className={`atelier-card rounded-2xl p-4 flex items-center justify-between transition-all ${
                  isMyTurn
                    ? 'border-[#e6c27a]/65 shadow-[0_0_28px_rgba(230,194,122,0.14)]'
                    : 'border-[#e6c27a]/15'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold tracking-wide text-[#faf4e8]">
                      {meP.nickname} (You)
                    </span>
                    {isMyTurn && (
                      <span className="px-2 py-0.5 rounded-md bg-gradient-to-b from-[#e6c27a] to-[#b5893a] text-[#171108] font-mono text-[10px] font-bold">
                        YOUR TURN
                      </span>
                    )}
                    {meP.cuffed && (
                      <span className="px-2 py-0.5 rounded-md bg-[#e6c27a]/15 border border-[#e6c27a]/45 text-[#f3d99d] font-mono text-[10px]">
                        CUFFED
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {Array.from({ length: gameDoc.maxHp }).map((_, i) => (
                      <Zap
                        key={i}
                        size={16}
                        className={
                          i < meP.hp
                            ? 'text-[#e6c27a] fill-[#e6c27a] drop-shadow-[0_0_6px_rgba(230,194,122,0.5)]'
                            : 'text-[#2b262d]'
                        }
                      />
                    ))}
                  </div>
                </div>
                <span className="font-mono text-2xl font-bold text-[#f5efe2] tabular-nums">
                  {meP.hp}
                  <span className="text-[#7c7163] text-base">/{gameDoc.maxHp}</span>
                </span>
              </div>

              <div
                className={`atelier-card rounded-2xl p-4 flex items-center justify-between transition-all ${
                  !isMyTurn && gameDoc.state === 'playing'
                    ? 'border-[#dc2626]/70 shadow-[0_0_28px_rgba(185,28,28,0.22)]'
                    : 'border-[#e6c27a]/15'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold tracking-wide text-[#faf4e8]">{oppP.nickname}</span>
                    {!isMyTurn && gameDoc.state === 'playing' && (
                      <span className="px-2 py-0.5 rounded-md bg-gradient-to-b from-[#c8323e] to-[#8f1d27] text-white font-mono text-[10px] font-bold">
                        THEIR TURN
                      </span>
                    )}
                    {oppP.cuffed && (
                      <span className="px-2 py-0.5 rounded-md bg-[#e6c27a]/15 border border-[#e6c27a]/45 text-[#f3d99d] font-mono text-[10px]">
                        SKIPPED
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {Array.from({ length: gameDoc.maxHp }).map((_, i) => (
                      <Zap
                        key={i}
                        size={16}
                        className={
                          i < oppP.hp
                            ? 'text-[#e0525c] fill-[#e0525c] drop-shadow-[0_0_6px_rgba(224,82,92,0.55)]'
                            : 'text-[#2b262d]'
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl font-bold text-[#e0525c] tabular-nums">
                    {oppP.hp}
                    <span className="text-[#7c7163] text-base">/{gameDoc.maxHp}</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#9c8f7e]">{oppP.chips.length} mods</div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Cylinder */}
              <section className="lg:col-span-5 atelier-card rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between gap-3 h-full max-h-[420px] relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(230,194,122,0.08),transparent_62%)]" />
                <div className="relative z-10 w-full flex items-center justify-between text-xs font-mono">
                  <span className="text-[#a89b86] uppercase tracking-[0.16em]">Chamber</span>
                  <span className="text-[#e6c27a] font-semibold">{gameDoc.chamber.length} Left</span>
                </div>

                <div className="relative z-10 flex items-center justify-center my-auto">
                  <div className="absolute -inset-4 rounded-full border border-[#e6c27a]/15 pointer-events-none" />
                  <motion.div
                    animate={{ rotate: gameDoc.cylinderAngle }}
                    transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                    className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-[3px] flex items-center justify-center shadow-[inset_0_2px_14px_rgba(230,194,122,0.18),0_18px_42px_rgba(0,0,0,0.8)] ${
                      gameDoc.overclocked
                        ? 'border-[#dc2626] bg-[radial-gradient(circle_at_35%_30%,#3d151a,#190c0f_65%,#0b080a)] shadow-[0_0_32px_rgba(220,38,38,0.4)]'
                        : 'border-[#c89d4e]/75 bg-[radial-gradient(circle_at_35%_30%,#2d2724,#161317_65%,#0a090c)]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-[#c89d4e]/60 bg-[radial-gradient(circle_at_35%_35%,#2e261f,#0c0a0d)] flex items-center justify-center shadow-inner">
                      <Crosshair className={`w-4 h-4 ${gameDoc.overclocked ? 'text-[#f87171]' : 'text-[#e6c27a]'}`} />
                    </div>
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const angle = (idx * 60 * Math.PI) / 180;
                      const x = Math.cos(angle) * 48;
                      const y = Math.sin(angle) * 48;
                      const hasShell = idx < gameDoc.chamber.length;
                      return (
                        <div
                          key={idx}
                          style={{ transform: `translate(${x}px, ${y}px)` }}
                          className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            hasShell
                              ? idx === 0 && meP.scannedNext
                                ? meP.scannedNext === 'live'
                                  ? 'bg-gradient-to-br from-[#ef4444] to-[#991b1b] border-[#fca5a5] shadow-[0_0_14px_rgba(239,68,68,0.8)]'
                                  : 'bg-gradient-to-br from-[#faf4e8] to-[#b5aa99] border-white shadow-[0_0_10px_rgba(255,255,255,0.45)]'
                                : 'bg-gradient-to-br from-[#f2d28b] via-[#c79844] to-[#7c591e] border-[#fae3ad]/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_2px_6px_rgba(0,0,0,0.65)]'
                              : 'bg-[#0a090c] border-[#383135] shadow-inner'
                          }`}
                        >
                          {hasShell && (
                            <span className="w-2 h-2 rounded-full bg-black/30 border border-white/20" />
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                  {gameDoc.overclocked && (
                    <span className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-gradient-to-b from-[#dc2626] to-[#991b1b] border border-[#fca5a5]/40 text-white font-mono text-[10px] font-bold">
                      2× OVERCLOCK
                    </span>
                  )}
                  {meP.scannedNext && !gameDoc.overclocked && (
                    <span
                      className={`absolute -bottom-3 px-3 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        meP.scannedNext === 'live'
                          ? 'bg-gradient-to-b from-[#dc2626] to-[#991b1b] border border-[#fca5a5]/40 text-white'
                          : 'bg-gradient-to-b from-[#faf4e8] to-[#d6cbb8] text-[#14100d]'
                      }`}
                    >
                      X-RAY: {meP.scannedNext.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="relative z-10 w-full space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className="rounded-xl border border-[#dc2626]/35 bg-[#240e12]/80 py-1.5 shadow-inner">
                      <div className="text-[10px] text-[#f87171]/85">LIVE</div>
                      <div className="font-bold text-[#f87171]">{liveLeft}</div>
                    </div>
                    <div className="rounded-xl border border-[#e6c27a]/15 bg-[#121015] py-1.5 shadow-inner">
                      <div className="text-[10px] text-[#a89b86]">BLANK</div>
                      <div className="font-bold text-[#f5efe2]">{blankLeft}</div>
                    </div>
                    <div className="rounded-xl border border-[#e6c27a]/35 bg-[#1e1811]/85 py-1.5 shadow-inner">
                      <div className="text-[10px] text-[#e6c27a]/85">ODDS</div>
                      <div className="font-bold text-[#e6c27a]">{liveOdds}%</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#e6c27a]/20 bg-[#0a090c] px-3 py-2 text-center font-mono text-xs text-[#e6dbc7] truncate shadow-inner">
                    {gameDoc.lastEvent}
                  </div>
                </div>
              </section>

              {/* Chips + Triggers */}
              <section className="lg:col-span-7 atelier-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 h-full max-h-[420px]">
                <div className="space-y-2.5">
                  <h2 className="font-display text-xs font-bold tracking-wide uppercase text-[#faf4e8]">
                    Your Mod Chips <span className="font-mono text-[#e6c27a]">({meP.chips.length}/6)</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {meP.chips.map((c, i) => {
                      const m = CHIP_META[c];
                      const Icon = m.icon;
                      return (
                        <button
                          key={`${c}-${i}`}
                          type="button"
                          disabled={!isMyTurn || busy}
                          onClick={() => handleUseChip(i)}
                          className={`rounded-xl border p-2.5 text-left flex items-start gap-2.5 disabled:opacity-40 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.45)] ${m.accent}`}
                        >
                          <div className="p-1.5 rounded-lg bg-[#0a090c] border border-[#e6c27a]/30 text-[#e6c27a] shrink-0">
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate text-[#faf4e8]">{m.name}</div>
                            <div className="text-[11px] text-[#aba08f]">{m.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e6c27a]/15">
                  <button
                    type="button"
                    disabled={!isMyTurn || busy}
                    onClick={() => handleFire(false)}
                    className="btn-crimson py-4 px-4 rounded-xl text-left disabled:opacity-35"
                  >
                    <div className="flex items-center justify-between font-display font-bold text-sm tracking-wide">
                      <span className="truncate">Shoot {oppP.nickname}</span>
                      <Crosshair className="w-4 h-4 text-[#fecaca] shrink-0" />
                    </div>
                    <div className="text-[11px] font-mono text-[#fecaca]/85 mt-1">
                      {gameDoc.overclocked ? '2 DMG if LIVE' : '1 DMG if LIVE'}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isMyTurn || busy}
                    onClick={() => handleFire(true)}
                    className="btn-obsidian py-4 px-4 rounded-xl text-left disabled:opacity-35"
                  >
                    <div className="flex items-center justify-between font-display font-bold text-sm tracking-wide text-[#faf4e8]">
                      <span>Shoot Self</span>
                      <ShieldAlert className="w-4 h-4 text-[#e6c27a] shrink-0" />
                    </div>
                    <div className="text-[11px] font-mono text-[#b3a692] mt-1">
                      BLANK = Extra Turn
                    </div>
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {gameDoc.state === 'finished' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm atelier-card rounded-2xl p-6 text-center space-y-4 border border-[#e6c27a]/30">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#161217] border border-[#e6c27a]/30 flex items-center justify-center shadow-inner">
              <Trophy className="w-6 h-6 text-[#e6c27a]" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#faf4e8]">
              {gameDoc.winnerUid === meP?.uid ? (
                <>
                  You <span className="font-serif italic font-normal text-[#e6c27a]">Survived!</span>
                </>
              ) : (
                <span className="text-[#e0525c]">Flatlined</span>
              )}
            </h2>
            <div className="flex gap-2">
              {meIdx === 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRematch}
                  className="btn-brass flex-1 py-2.5 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Rematch
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push('/glitch-roulette')}
                className="btn-obsidian flex-1 py-2.5 rounded-xl font-medium text-xs"
              >
                Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function GlitchRouletteRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c0b0e] atelier-bg flex items-center justify-center font-mono text-xs text-[#e6c27a]">
          Loading Chamber...
        </div>
      }
    >
      <GlitchRoulettePvPContent />
    </Suspense>
  );
}
