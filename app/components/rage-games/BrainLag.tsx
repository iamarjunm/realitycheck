'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

const TAUNTS = [
  { max: 5, msgs: ["Do you even know the alphabet?", "Brain disconnected?", "A, S, D. It's not hard.", "Pathetic.", "Literally single-digit IQ."] },
  { max: 15, msgs: ["Muscle memory betraying you?", "Read the letters, genius.", "Your brain is lagging.", "Try opening your eyes.", "Ouch."] },
  { max: 30, msgs: ["Okay, the neurons are firing.", "Getting dizzy?", "Don't trust your hands.", "Not completely useless."] },
  { max: 60, msgs: ["You're sweating. I can tell.", "Adrenaline spike?", "Focus.", "Almost a gamer."] },
  { max: 1000, msgs: ["You have ascended.", "Keyboard warrior.", "Alright, respect.", "Go outside now."] },
];

function getTaunt(score: number) {
  for (const t of TAUNTS) {
    if (score <= t.max) {
      return t.msgs[Math.floor(Math.random() * t.msgs.length)];
    }
  }
  return "I have no words.";
}

type Obstacle = { lane: number; y: number; h: number; passed: boolean };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; decay: number; color: string };

type GameState = {
  status: 'menu' | 'playing' | 'gameover';
  score: number;
  highScore: number;
  frames: number;
  speed: number;
  playerLane: number;
  laneKeys: string[];
  obstacles: Obstacle[];
  particles: Particle[];
  shakeTime: number;
  flash: number;
  scrambleTimer: number;
  spawnPauseTimer: number;
  taunt: string;
};

const BASE_KEYS = ['A', 'S', 'D'];

import { playSound } from "./AudioSystem";

export default function BrainLag({ muted = false }: { muted?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiState, setUiState] = useState({ status: 'menu', score: 0, highScore: 0, taunt: '' });

  const gameState = useRef<GameState>({
    status: 'menu',
    score: 0,
    highScore: 0,
    frames: 0,
    speed: 8,
    playerLane: 1,
    laneKeys: ['A', 'S', 'D'],
    obstacles: [],
    particles: [],
    shakeTime: 0,
    flash: 0,
    scrambleTimer: 0,
    spawnPauseTimer: 0,
    taunt: ''
  });

  const syncUi = useCallback(() => {
    setUiState({
      status: gameState.current.status,
      score: gameState.current.score,
      highScore: gameState.current.highScore,
      taunt: gameState.current.taunt,
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('rage_brain_high');
    if (saved) {
      gameState.current.highScore = parseInt(saved, 10);
      syncUi();
    }
  }, [syncUi]);

  const startGame = useCallback(() => {
    gameState.current = {
      ...gameState.current,
      status: 'playing',
      score: 0,
      frames: 0,
      speed: 8,
      playerLane: 1,
      laneKeys: ['A', 'S', 'D'], // Reset to normal
      obstacles: [],
      particles: [],
      shakeTime: 0,
      flash: 0,
      scrambleTimer: 0,
      spawnPauseTimer: 0,
    };
    syncUi();
  }, [syncUi]);

  const die = useCallback(() => {
    const state = gameState.current;
    if (state.status === 'gameover') return;
    state.status = 'gameover';
    playSound('die', muted);
    state.shakeTime = 30;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('rage_brain_high', state.score.toString());
    }
    state.taunt = getTaunt(state.score);

    const laneWidth = 800 / 3;
    const px = state.playerLane * laneWidth + laneWidth / 2;
    const py = 500;

    for (let i = 0; i < 80; i++) {
      state.particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 25,
        vy: (Math.random() - 0.5) * 25,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.03,
        color: '#eab308',
      });
    }
    syncUi();
  }, [syncUi]);

  const scrambleKeys = useCallback((state: GameState) => {
    let newKeys = [...BASE_KEYS];
    // Ensure it's different from current
    while (newKeys.join('') === state.laneKeys.join('') || newKeys.join('') === 'ASD') {
      newKeys.sort(() => Math.random() - 0.5);
    }
    state.laneKeys = newKeys;
    state.scrambleTimer = 60; // Show warning
    state.spawnPauseTimer = 120; // 2 seconds pause before new blocks
    state.flash = 10;
    state.shakeTime = 10;
  }, []);

  const spawnObstacles = useCallback((state: GameState) => {
    const numObstacles = state.score < 20 ? 1 : (Math.random() < 0.4 ? 2 : 1);
    const availableLanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numObstacles; i++) {
      state.obstacles.push({
        lane: availableLanes[i],
        y: -100,
        h: 80 + Math.random() * 100,
        passed: false
      });
    }
  }, []);

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
    state.speed += 0.005; // Gets faster forever

    if (state.scrambleTimer > 0) state.scrambleTimer--;
    if (state.spawnPauseTimer > 0) state.spawnPauseTimer--;
    if (state.flash > 0) state.flash--;

    // Spawn logic
    const spawnRate = Math.max(35, 70 - Math.floor(state.score * 1.2));
    if (state.frames % spawnRate === 0 && state.spawnPauseTimer <= 0) {
      spawnObstacles(state);
    }

    // Scramble logic
    if (state.score > 0 && state.score % 10 === 0 && state.frames % spawnRate === 0) {
      // Scramble right when a wave spawns for maximum panic
      scrambleKeys(state);
    }

    const laneWidth = 800 / 3;
    const playerY = 500;
    const playerSize = 60;

    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const obs = state.obstacles[i];
      obs.y += state.speed;

      // Scoring
      if (!obs.passed && obs.y > playerY + playerSize) {
        obs.passed = true;
        state.score++;
      }

      // Collision
      if (obs.lane === state.playerLane) {
        const obsBottom = obs.y + obs.h;
        if (obsBottom > playerY - playerSize / 2 && obs.y < playerY + playerSize / 2) {
          die();
        }
      }

      if (obs.y > 600) {
        state.obstacles.splice(i, 1);
      }
    }
  }, [die, spawnObstacles, scrambleKeys]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;

    ctx.fillStyle = state.flash > 0 ? '#ffffff' : '#09090b';
    ctx.fillRect(0, 0, 800, 600);

    ctx.save();
    
    if (state.shakeTime > 0) {
      const dx = (Math.random() - 0.5) * (state.status === 'gameover' ? 30 : 10);
      const dy = (Math.random() - 0.5) * (state.status === 'gameover' ? 30 : 10);
      ctx.translate(dx, dy);
    }

    const laneWidth = 800 / 3;

    // Draw Lanes
    ctx.lineWidth = 2;
    ctx.strokeStyle = state.flash > 0 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(laneWidth, 0); ctx.lineTo(laneWidth, 600);
    ctx.moveTo(laneWidth * 2, 0); ctx.lineTo(laneWidth * 2, 600);
    ctx.stroke();

    // Draw Obstacles
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 15;
    state.obstacles.forEach((obs) => {
      const x = obs.lane * laneWidth + laneWidth / 2 - 40;
      ctx.fillRect(x, obs.y, 80, obs.h);
    });
    ctx.shadowBlur = 0;

    // Draw Player
    if (state.status === 'playing' || state.status === 'menu') {
      const px = state.playerLane * laneWidth + laneWidth / 2;
      const py = 500;
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 20;
      ctx.fillRect(px - 30, py - 30, 60, 60);
      ctx.shadowBlur = 0;
    }

    // Draw Particles
    state.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, 8, 8);
    });
    ctx.globalAlpha = 1.0;

    // Draw Lane Indicators (THE RAGE MECHANIC)
    if (state.status === 'playing' || state.status === 'menu') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 3; i++) {
        const key = state.laneKeys[i];
        const isNormal = key === BASE_KEYS[i];
        
        ctx.fillStyle = isNormal ? 'rgba(255,255,255,0.2)' : 'rgba(234, 179, 8, 0.8)';
        ctx.font = isNormal ? '900 60px sans-serif' : '900 80px sans-serif'; // Bigger when scrambled
        ctx.fillText(key, i * laneWidth + laneWidth / 2, 530);
      }
    }

    // Draw Scramble Warning
    if (state.scrambleTimer > 0) {
      ctx.fillStyle = '#eab308';
      ctx.font = '900 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("CONTROLS SCRAMBLED!", 400, 200);
    }

    // Draw Score
    if (state.status === 'playing') {
      ctx.fillStyle = state.flash > 0 ? 'rgba(0,0,0,0.8)' : 'rgba(255, 255, 255, 0.1)';
      ctx.font = '900 150px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.score.toString(), 400, 100);
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
      const key = e.key.toUpperCase();

      if (state.status === 'menu' || state.status === 'gameover') {
        if (e.code === 'Space') {
          e.preventDefault();
          if (state.status === 'gameover' && state.shakeTime > 5) return;
          startGame();
        }
        return;
      }

      if (state.status === 'playing') {
        if (['A', 'S', 'D'].includes(key)) {
          // Find WHICH lane requires this key right now
          const targetLane = state.laneKeys.indexOf(key);
          if (targetLane !== -1) {
            state.playerLane = targetLane;
        playSound('jump', muted);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame]);

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
            <h1 className="text-7xl font-black text-yellow-400 mb-6 tracking-tighter drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
              BRAIN LAG
            </h1>
            <p className="text-neutral-400 text-xl mb-6 font-medium">
              Dodge the red blocks.
            </p>
            <div className="flex justify-center gap-4 text-xl font-black text-white mb-10 animate-pulse">
              <span className="bg-neutral-800 px-6 py-3 rounded-xl border-2 border-neutral-700">A</span>
              <span className="bg-neutral-800 px-6 py-3 rounded-xl border-2 border-neutral-700">S</span>
              <span className="bg-neutral-800 px-6 py-3 rounded-xl border-2 border-neutral-700">D</span>
            </div>
            <p className="text-yellow-400 font-bold mb-4">Read the letters at the bottom.</p>
            <p className="text-neutral-500 font-bold animate-bounce mt-8">Press SPACE to start</p>
          </div>
        )}

        {uiState.status === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-neutral-950/95 p-10 border border-yellow-500/40 rounded-3xl text-center backdrop-blur-xl shadow-[0_0_50px_rgba(234,179,8,0.2)] max-w-sm w-full mx-4"
          >
            <h2 className="text-6xl font-black text-yellow-500 mb-2 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]">
              CRASHED
            </h2>
            
            <p className="text-6xl font-black text-white mb-8">{uiState.score}</p>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 mb-8 text-neutral-300 font-medium">
                &quot;{uiState.taunt}&quot;
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-neutral-500 mb-6 px-2">
              <span>BEST</span>
              <span className="text-yellow-400 text-xl">{uiState.highScore}</span>
            </div>

            <p className="text-neutral-400 font-bold animate-pulse text-lg">Press SPACE to retry</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
