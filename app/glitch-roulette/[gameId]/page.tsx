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
  xray: { name: 'X-Ray', desc: 'Scan next shell', accent: 'border-zinc-800 bg-zinc-950 text-zinc-100 hover:border-amber-400/50 hover:bg-zinc-900', icon: Eye },
  overclock: { name: 'Overclock', desc: '2× LIVE dmg', accent: 'border-rose-500/30 bg-zinc-950 text-zinc-100 hover:border-rose-500/60 hover:bg-rose-950/20', icon: Flame },
  invert: { name: 'Flip', desc: 'LIVE ↔ BLANK', accent: 'border-amber-400/30 bg-zinc-950 text-zinc-100 hover:border-amber-400/60 hover:bg-amber-950/20', icon: RefreshCw },
  eject: { name: 'Eject', desc: 'Discard next', accent: 'border-zinc-800 bg-zinc-950 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900', icon: ArrowUpRight },
  cuff: { name: 'Cuff Lock', desc: 'Skip rival turn', accent: 'border-amber-400/30 bg-zinc-950 text-zinc-100 hover:border-amber-400/60 hover:bg-amber-950/20', icon: Lock },
  siphon: { name: 'Siphon +1', desc: 'Heal 1 HP', accent: 'border-emerald-500/30 bg-zinc-950 text-zinc-100 hover:border-emerald-400/60 hover:bg-emerald-950/20', icon: Heart },
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
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Chamber Not Found</h1>
        <button
          type="button"
          onClick={() => router.push('/glitch-roulette')}
          className="px-5 py-2.5 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  if (!gameDoc) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-zinc-400">
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
      className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#09090b] text-zinc-50 flex flex-col relative"
    >
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26 }}
            className={`pointer-events-none fixed inset-0 z-50 ${
              flash === 'live' ? 'bg-rose-600/35' : flash === 'glitch' ? 'bg-amber-400/15' : 'bg-zinc-200/10'
            }`}
          />
        )}
      </AnimatePresence>

      {/* HUD */}
      <header className="relative z-20 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md shrink-0">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/glitch-roulette')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby
            </button>
            <span className="text-zinc-800">|</span>
            <span className="font-semibold tracking-tight text-xs sm:text-sm text-zinc-50">
              Glitch Roulette 1v1
            </span>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300">
              {gameId}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-zinc-300" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1360px] mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center gap-3">
        {gameDoc.state === 'waiting' && (
          <div className="max-w-md w-full mx-auto bg-[#111113] border border-zinc-800/90 rounded-2xl p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl border border-zinc-800 bg-zinc-950 flex items-center justify-center">
              <Skull className="w-6 h-6 text-rose-500" />
            </div>
            {meIdx === -1 ? (
              <>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Enter 1v1 Chamber</h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="CODENAME"
                    maxLength={14}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono uppercase text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                  <button
                    type="button"
                    disabled={busy || !joinName.trim()}
                    onClick={() => joinRoom(joinName.trim())}
                    className="px-5 py-2 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs disabled:opacity-40 transition-colors"
                  >
                    Join
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Waiting for Rival</h1>
                <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-left">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-zinc-500">Chamber Code</div>
                    <div className="font-mono text-2xl font-semibold tracking-[0.2em] text-zinc-50">{gameId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(gameId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
              <div className={`rounded-2xl border p-4 flex items-center justify-between transition-colors ${isMyTurn ? 'border-zinc-500 bg-[#111113]' : 'border-zinc-800/90 bg-[#111113]'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100">{meP.nickname} (You)</span>
                    {isMyTurn && <span className="px-2 py-0.5 rounded-md bg-zinc-50 text-zinc-950 font-mono text-[10px] font-semibold">YOUR TURN</span>}
                    {meP.cuffed && <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-[10px]">CUFFED</span>}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {Array.from({ length: gameDoc.maxHp }).map((_, i) => (
                      <Zap key={i} size={16} className={i < meP.hp ? 'text-zinc-100 fill-zinc-100' : 'text-zinc-800'} />
                    ))}
                  </div>
                </div>
                <span className="font-mono text-2xl font-semibold text-zinc-100 tabular-nums">{meP.hp}/{gameDoc.maxHp}</span>
              </div>

              <div className={`rounded-2xl border p-4 flex items-center justify-between transition-colors ${!isMyTurn && gameDoc.state === 'playing' ? 'border-rose-500/60 bg-[#111113]' : 'border-zinc-800/90 bg-[#111113]'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100">{oppP.nickname}</span>
                    {!isMyTurn && gameDoc.state === 'playing' && <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono text-[10px] font-semibold">THEIR TURN</span>}
                    {oppP.cuffed && <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-[10px]">SKIPPED</span>}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {Array.from({ length: gameDoc.maxHp }).map((_, i) => (
                      <Zap key={i} size={16} className={i < oppP.hp ? 'text-rose-500 fill-rose-500' : 'text-zinc-800'} />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl font-semibold text-rose-500 tabular-nums">{oppP.hp}/{gameDoc.maxHp}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{oppP.chips.length} mods</div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Cylinder */}
              <section className="lg:col-span-5 bg-[#111113] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between gap-3 h-full max-h-[420px]">
                <div className="w-full flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">CHAMBER</span>
                  <span className="text-amber-400 font-semibold">{gameDoc.chamber.length} Left</span>
                </div>

                <div className="relative flex items-center justify-center my-auto">
                  <motion.div
                    animate={{ rotate: gameDoc.cylinderAngle }}
                    transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                    className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 flex items-center justify-center ${
                      gameDoc.overclocked ? 'border-rose-500 bg-rose-950/20' : 'border-zinc-700 bg-zinc-950'
                    }`}
                  >
                    <Crosshair className="w-5 h-5 text-zinc-500" />
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const angle = (idx * 60 * Math.PI) / 180;
                      const x = Math.cos(angle) * 48;
                      const y = Math.sin(angle) * 48;
                      const hasShell = idx < gameDoc.chamber.length;
                      return (
                        <div
                          key={idx}
                          style={{ transform: `translate(${x}px, ${y}px)` }}
                          className={`absolute w-6 h-6 rounded-full border-2 ${
                            hasShell
                              ? idx === 0 && meP.scannedNext
                                ? meP.scannedNext === 'live'
                                  ? 'bg-rose-500 border-rose-300'
                                  : 'bg-zinc-300 border-zinc-100'
                                : 'bg-amber-400/80 border-amber-300/90'
                              : 'bg-zinc-900 border-zinc-800'
                          }`}
                        />
                      );
                    })}
                  </motion.div>
                  {gameDoc.overclocked && (
                    <span className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-semibold">
                      2× OVERCLOCK
                    </span>
                  )}
                  {meP.scannedNext && !gameDoc.overclocked && (
                    <span className={`absolute -bottom-2.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${meP.scannedNext === 'live' ? 'bg-rose-600 text-white' : 'bg-zinc-200 text-zinc-950'}`}>
                      X-RAY: {meP.scannedNext.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="w-full space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className="rounded-xl border border-rose-500/25 bg-rose-950/20 py-1.5">
                      <div className="text-[10px] text-rose-400/80">LIVE</div>
                      <div className="font-semibold text-rose-400">{liveLeft}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 py-1.5">
                      <div className="text-[10px] text-zinc-400">BLANK</div>
                      <div className="font-semibold text-zinc-200">{blankLeft}</div>
                    </div>
                    <div className="rounded-xl border border-amber-400/25 bg-amber-950/15 py-1.5">
                      <div className="text-[10px] text-amber-400/80">ODDS</div>
                      <div className="font-semibold text-amber-400">{liveOdds}%</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-center font-mono text-xs text-zinc-300 truncate">
                    {gameDoc.lastEvent}
                  </div>
                </div>
              </section>

              {/* Chips + Triggers */}
              <section className="lg:col-span-7 bg-[#111113] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 h-full max-h-[420px]">
                <div className="space-y-2.5">
                  <h2 className="text-xs font-semibold tracking-tight text-zinc-100">Your Mod Chips ({meP.chips.length}/6)</h2>
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
                          className={`rounded-xl border p-2.5 text-left flex items-start gap-2.5 disabled:opacity-40 transition-colors ${m.accent}`}
                        >
                          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 shrink-0">
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate text-zinc-100">{m.name}</div>
                            <div className="text-[11px] text-zinc-400">{m.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    disabled={!isMyTurn || busy}
                    onClick={() => handleFire(false)}
                    className="py-4 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-left disabled:opacity-35 transition-colors"
                  >
                    <div className="flex items-center justify-between font-semibold text-sm">
                      <span className="truncate">Shoot {oppP.nickname}</span>
                      <Crosshair className="w-4 h-4 text-rose-100 shrink-0" />
                    </div>
                    <div className="text-[11px] font-mono text-rose-100/85 mt-1">
                      {gameDoc.overclocked ? '2 DMG if LIVE' : '1 DMG if LIVE'}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isMyTurn || busy}
                    onClick={() => handleFire(true)}
                    className="py-4 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-left disabled:opacity-35 transition-colors"
                  >
                    <div className="flex items-center justify-between font-semibold text-sm">
                      <span>Shoot Self</span>
                      <ShieldAlert className="w-4 h-4 text-zinc-300 shrink-0" />
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-1">
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
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              {gameDoc.winnerUid === meP?.uid ? 'You Survived!' : 'Flatlined'}
            </h2>
            <div className="flex gap-2">
              {meIdx === 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRematch}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-50 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Rematch
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push('/glitch-roulette')}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition-colors"
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
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs text-zinc-400">Loading Chamber...</div>}>
      <GlitchRoulettePvPContent />
    </Suspense>
  );
}
