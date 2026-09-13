'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

const TAUNTS = [
  { max: 5, msgs: ["Do you even know the alphabet?", "Typo on level 1? Really?", "My grandma types faster.", "Embarrassing.", "Are you blind?"] },
  { max: 15, msgs: ["Still terrible.", "Fingers too fat?", "A toddler could do this.", "Focus!", "You have the coordination of a rock."] },
  { max: 30, msgs: ["Barely acceptable.", "Okay, maybe you're awake.", "Sweating yet?", "Don't blink."] },
  { max: 60, msgs: ["You're getting addicted, aren't you?", "Go touch grass.", "I bet your hands are shaking.", "Almost impressive."] },
  { max: 1000, msgs: ["You have no life.", "Hacker.", "Okay, you win. Now go outside.", "God gamer?"] },
];

function getTaunt(score: number) {
  for (const t of TAUNTS) {
    if (score <= t.max) return t.msgs[Math.floor(Math.random() * t.msgs.length)];
  }
  return "I have no words.";
}

const WORD_POOLS = [
  ['rage', 'type', 'fast', 'snap', 'quit', 'lost', 'fail'], // 0-5
  ['focus', 'panic', 'sweat', 'mouse', 'click', 'haste'], // 6-15
  ['obvious', 'terrible', 'mistake', 'garbage', 'furious'], // 16-30
  ['pLuMBer', 'aCCideNt', 'sYzyGy', 'rHyThM', 'aBsoLuTe'], // 31-45 (case sensitive)
  ['0OoO0', 'l1Iil', 'rn m', 'vv w', '1lI0O', 'qpbddpq'], // 46+ (lookalikes and pure evil)
];

function getWord(score: number) {
  let poolIndex = 0;
  if (score > 5) poolIndex = 1;
  if (score > 15) poolIndex = 2;
  if (score > 30) poolIndex = 3;
  if (score > 45) poolIndex = 4;
  
  const pool = WORD_POOLS[poolIndex];
  return pool[Math.floor(Math.random() * pool.length)];
}

function calculateDecayRate(word: string, score: number) {
  // Base time per character decreases as score goes up, but never below 0.15s
  const timePerChar = Math.max(0.2, 0.5 - (score * 0.005));
  // Total time = (chars * time per char) + 0.5s human reaction buffer
  const totalTimeSeconds = word.length * timePerChar + 1.0;
  // Convert to frame decay rate (assuming 60fps)
  return 1 / (totalTimeSeconds * 60);
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; decay: number; color: string };

type GameState = {
  status: 'menu' | 'playing' | 'gameover';
  score: number;
  highScore: number;
  frames: number;
  currentWord: string;
  typedIndex: number;
  timeLeft: number; // 1.0 to 0.0
  decayRate: number;
  particles: Particle[];
  shakeTime: number;
  flash: number;
  taunt: string;
  causeOfDeath: string;
};

import { playSound } from "./AudioSystem";

export default function TypeRage({ muted = false }: { muted?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiState, setUiState] = useState({ status: 'menu', score: 0, highScore: 0, taunt: '', causeOfDeath: '' });

  const gameState = useRef<GameState>({
    status: 'menu',
    score: 0,
    highScore: 0,
    frames: 0,
    currentWord: '',
    typedIndex: 0,
    timeLeft: 1.0,
    decayRate: 0.005,
    particles: [],
    shakeTime: 0,
    flash: 0,
    taunt: '',
    causeOfDeath: ''
  });

  const syncUi = useCallback(() => {
    setUiState({
      status: gameState.current.status,
      score: gameState.current.score,
      highScore: gameState.current.highScore,
      taunt: gameState.current.taunt,
      causeOfDeath: gameState.current.causeOfDeath,
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('rage_type_high');
    if (saved) {
      gameState.current.highScore = parseInt(saved, 10);
      syncUi();
    }
  }, [syncUi]);

  const startGame = useCallback(() => {
    const firstWord = getWord(0);
    gameState.current = {
      ...gameState.current,
      status: 'playing',
      score: 0,
      frames: 0,
      currentWord: firstWord,
      typedIndex: 0,
      timeLeft: 1.0,
      decayRate: calculateDecayRate(firstWord, 0),
      particles: [],
      shakeTime: 0,
      flash: 0,
      causeOfDeath: ''
    };
    syncUi();
  }, [syncUi]);

  const die = useCallback((cause: string) => {
    const state = gameState.current;
    if (state.status === 'gameover') return;
    state.status = 'gameover';
    playSound('die', muted);
    state.shakeTime = 30;
    state.causeOfDeath = cause;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('rage_type_high', state.score.toString());
    }
    state.taunt = getTaunt(state.score);

    for (let i = 0; i < 100; i++) {
      state.particles.push({
        x: 400,
        y: 300,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.03,
        color: '#22c55e', // Green shards
      });
    }
    syncUi();
  }, [syncUi]);

  const update = useCallback(() => {
    const state = gameState.current;

    if (state.status !== 'playing') {
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0) state.particles.splice(i, 1);
      }
      if (state.shakeTime > 0) state.shakeTime--;
      return;
    }

    state.frames++;
    if (state.flash > 0) state.flash--;

    // Time decay
    state.timeLeft -= state.decayRate;
    if (state.timeLeft <= 0) {
      die("TOO SLOW. TIME EXPIRED.");
      return;
    }

    // Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }, [die]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;

    // Visual rage mechanic: slightly shift background colors based on panic (low time)
    let bg = '#09090b';
    if (state.timeLeft < 0.3 && state.frames % 10 < 5) bg = '#1a0505'; // Throbbing red when low on time
    
    ctx.fillStyle = state.flash > 0 ? '#ffffff' : bg;
    ctx.fillRect(0, 0, 800, 600);

    ctx.save();
    
    // Screen Shake (increases as time runs out)
    let currentShake = state.shakeTime;
    if (state.status === 'playing' && state.timeLeft < 0.2) currentShake = 5;
    
    if (currentShake > 0) {
      const dx = (Math.random() - 0.5) * (state.status === 'gameover' ? 40 : 10);
      const dy = (Math.random() - 0.5) * (state.status === 'gameover' ? 40 : 10);
      ctx.translate(dx, dy);
    }

    // Draw Particles
    state.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    if (state.status === 'playing' || state.status === 'menu') {
      // Draw Timer Bar
      const barWidth = 600;
      const barHeight = 20;
      const bx = 100;
      const by = 500;
      
      // Background bar
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(bx, by, barWidth, barHeight);
      
      // Fill bar
      const fillW = barWidth * Math.max(0, state.timeLeft);
      ctx.fillStyle = state.timeLeft < 0.3 ? '#f43f5e' : '#22c55e';
      ctx.fillRect(bx, by, fillW, barHeight);

      // Draw Word
      ctx.font = '900 80px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const word = state.currentWord;
      const typed = word.substring(0, state.typedIndex);
      const untyped = word.substring(state.typedIndex);

      // We need to measure text to split colors properly
      const totalWidth = ctx.measureText(word).width;
      let startX = 400 - (totalWidth / 2);

      // Draw typed portion
      ctx.fillStyle = '#22c55e'; // Green
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'left';
      ctx.fillText(typed, startX, 300);
      
      const typedWidth = ctx.measureText(typed).width;
      
      // Draw untyped portion
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText(untyped, startX + typedWidth, 300);
    }

    // Draw Score
    if (state.status === 'playing') {
      ctx.fillStyle = state.flash > 0 ? 'rgba(0,0,0,0.8)' : 'rgba(255, 255, 255, 0.05)';
      ctx.font = '900 200px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.score.toString(), 400, 150);
    }

    ctx.restore();
  }, []);

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const loop = () => {
      update();
      draw(ctx);
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [update, draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameState.current;

      if (state.status === 'menu' || state.status === 'gameover') {
        if (e.code === 'Space') {
          e.preventDefault();
          if (state.status === 'gameover' && state.shakeTime > 10) return;
          startGame();
        }
        return;
      }

      if (state.status === 'playing') {
        // Ignore modifier keys like Shift, Control, Alt
        if (e.key.length > 1) return;
        e.preventDefault();

        const expectedChar = state.currentWord[state.typedIndex];
        
        if (e.key === expectedChar) {
          state.typedIndex++;
          playSound('jump', muted);
          
          if (state.typedIndex >= state.currentWord.length) {
            // Word complete!
            state.score++;
            playSound('score', muted);
            const nextWord = getWord(state.score);
            state.currentWord = nextWord;
            state.typedIndex = 0;
            state.timeLeft = 1.0;
            // Ramp up difficulty based on new word length and score
            state.decayRate = calculateDecayRate(nextWord, state.score);
            
            if (state.score % 5 === 0) state.flash = 6;
          }
        } else {
          die(`TYPO. YOU PRESSED '${e.key}' INSTEAD OF '${expectedChar}'.`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, die]);

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none pointer-events-none">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full max-w-[1200px] max-h-[900px] object-contain z-10"
      />

      <div className="absolute inset-0 z-20 flex items-center justify-center">
        {uiState.status === 'menu' && (
          <div className="text-center">
            <h1 className="text-7xl font-black text-green-500 mb-6 tracking-tighter drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]">
              TYPO TERROR
            </h1>
            <p className="text-neutral-400 text-xl mb-10 font-medium max-w-md mx-auto">
              Type the words perfectly before the time runs out.
            </p>
            <div className="flex flex-col items-center gap-4 text-sm font-bold text-neutral-400 max-w-lg mx-auto">
              <span className="bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-lg backdrop-blur">
                ONE TYPO = INSTANT DEATH
              </span>
              <span className="bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-lg backdrop-blur text-green-400">
                CASE SENSITIVE LATER ON
              </span>
            </div>
            <p className="text-white font-bold animate-pulse mt-10">Press SPACE to start</p>
          </div>
        )}

        {uiState.status === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-neutral-950/95 p-10 border border-red-500/40 rounded-3xl text-center backdrop-blur-xl shadow-[0_0_50px_rgba(153,27,27,0.3)] max-w-sm w-full mx-4"
          >
            <h2 className="text-6xl font-black text-red-500 mb-2 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">
              FAILED
            </h2>
            <p className="text-red-400 font-bold mb-6 tracking-widest uppercase text-sm leading-relaxed">{uiState.causeOfDeath}</p>
            
            <p className="text-6xl font-black text-white mb-8">{uiState.score}</p>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 mb-8 text-neutral-300 font-medium">
                &quot;{uiState.taunt}&quot;
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-neutral-500 mb-6 px-2">
              <span>BEST</span>
              <span className="text-green-400 text-xl">{uiState.highScore}</span>
            </div>

            <p className="text-neutral-400 font-bold animate-pulse text-lg">Press SPACE to retry</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
