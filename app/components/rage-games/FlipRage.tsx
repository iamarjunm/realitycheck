'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

const TAUNTS = [
  { max: 2, msgs: ["Did your finger slip?", "Is your monitor even on?", "My grandma has faster reflexes.", "Were you even trying?", "Oops."] },
  { max: 10, msgs: ["Barely acceptable.", "You can do better... probably.", "A toddler could beat that.", "Still trash.", "Focus!"] },
  { max: 20, msgs: ["Okay, maybe you have half a brain.", "Not completely useless.", "Sweating yet?", "Don't blink."] },
  { max: 40, msgs: ["You're getting addicted, aren't you?", "Go touch grass.", "I bet your hands are shaking.", "Almost impressive."] },
  { max: 1000, msgs: ["You have no life.", "Hacker.", "Okay, you win. Now go outside.", "God gamer?"] },
];

function getTaunt(score: number) {
  for (const t of TAUNTS) {
    if (score <= t.max) {
      return t.msgs[Math.floor(Math.random() * t.msgs.length)];
    }
  }
  return "I have no words.";
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; decay: number; color: string };
type Trail = { x: number; y: number; life: number };
type Obstacle = { x: number; y: number; w: number; h: number; passed: boolean; isScorable: boolean };

type GameState = {
  status: 'menu' | 'playing' | 'gameover';
  score: number;
  highScore: number;
  frames: number;
  speed: number;
  baseSpeed: number;
  gravity: number;
  spawnTimer: number;
  bgOffset: number;
  player: { x: number; y: number; size: number; velocity: number; gravityDir: number };
  obstacles: Obstacle[];
  particles: Particle[];
  trail: Trail[];
  shakeTime: number;
  flash: number;
  taunt: string;
};

import { playSound } from "./AudioSystem";

export default function FlipRage({ muted = false }: { muted?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiState, setUiState] = useState({ status: 'menu', score: 0, highScore: 0, taunt: '' });

  const gameState = useRef<GameState>({
    status: 'menu',
    score: 0,
    highScore: 0,
    frames: 0,
    speed: 7,
    baseSpeed: 7,
    gravity: 0.75,
    spawnTimer: 0,
    bgOffset: 0,
    player: { x: 150, y: 284, size: 32, velocity: 0, gravityDir: 1 },
    obstacles: [],
    particles: [],
    trail: [],
    shakeTime: 0,
    flash: 0,
    taunt: '',
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
    const saved = localStorage.getItem('rage_flip_high');
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
      speed: gameState.current.baseSpeed,
      spawnTimer: 0,
      player: { x: 150, y: 284, size: 32, velocity: 0, gravityDir: 1 },
      obstacles: [],
      particles: [],
      trail: [],
      shakeTime: 0,
      flash: 0,
    };
    syncUi();
  }, [syncUi]);

  const die = useCallback(() => {
    const state = gameState.current;
    state.status = 'gameover';
    playSound('die', muted);
    state.shakeTime = 20;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('rage_flip_high', state.score.toString());
    }
    state.taunt = getTaunt(state.score);

    for (let i = 0; i < 60; i++) {
      state.particles.push({
        x: state.player.x + state.player.size / 2,
        y: state.player.y + state.player.size / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.04,
        color: Math.random() > 0.5 ? '#22d3ee' : '#f43f5e',
      });
    }
    syncUi();
  }, [syncUi]);

  const spawnObstacle = useCallback((state: GameState) => {
    const H = 600;
    const type = Math.floor(Math.random() * 5);
    const w = 50 + Math.random() * 50;
    const x = 800;

    let h1;
    switch (type) {
      case 0: // Floor block
        h1 = 150 + Math.random() * 250;
        state.obstacles.push({ x, y: H - h1, w, h: h1, passed: false, isScorable: true });
        break;
      case 1: // Ceiling block
        h1 = 150 + Math.random() * 250;
        state.obstacles.push({ x, y: 0, w, h: h1, passed: false, isScorable: true });
        break;
      case 2: // Middle floating block
        h1 = 100 + Math.random() * 150;
        state.obstacles.push({
          x,
          y: H / 2 - h1 / 2 + (Math.random() * 140 - 70),
          w,
          h: h1,
          passed: false,
          isScorable: true,
        });
        break;
      case 3: // Tunnel
        const gap = 240 + Math.random() * 80;
        const offset = Math.random() * (H - gap - 100) + 50;
        state.obstacles.push({ x, y: 0, w, h: offset, passed: false, isScorable: true });
        state.obstacles.push({ x, y: offset + gap, w, h: H - (offset + gap), passed: false, isScorable: false });
        break;
      case 4: // Two staggered blocks
        h1 = 60 + Math.random() * 40;
        const y1 = Math.random() * (H / 2 - h1);
        state.obstacles.push({ x, y: y1, w, h: h1, passed: false, isScorable: true });
        state.obstacles.push({
          x: x + w + 120 + Math.random() * 80,
          y: H - y1 - h1,
          w,
          h: h1,
          passed: false,
          isScorable: false,
        });
        break;
    }
  }, []);

  const rectsIntersect = (px: number, py: number, size: number, ox: number, oy: number, ow: number, oh: number) => {
    const margin = 12; // Extremely forgiving hitbox for game feel
    return !(ox > px + size - margin || ox + ow < px + margin || oy > py + size - margin || oy + oh < py + margin);
  };

  const update = useCallback(() => {
    const state = gameState.current;

    if (state.status !== 'playing') {
      // Keep updating particles during game over
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) state.particles.splice(i, 1);
      }
      if (state.shakeTime > 0) state.shakeTime--;
      return;
    }

    state.frames++;
    state.speed += 0.003; // Constant speed scaling for ragebait

    // Player physics
    state.player.velocity += state.gravity * state.player.gravityDir;
    state.player.y += state.player.velocity;

    // Floor and Ceiling bounds
    if (state.player.y < 0) {
      state.player.y = 0;
      state.player.velocity = 0;
    }
    if (state.player.y > 600 - state.player.size) {
      state.player.y = 600 - state.player.size;
      state.player.velocity = 0;
    }

    // Motion Trail
    if (state.frames % 2 === 0) {
      state.trail.push({ x: state.player.x, y: state.player.y, life: 1.0 });
    }
    for (let i = state.trail.length - 1; i >= 0; i--) {
      state.trail[i].life -= 0.08;
      if (state.trail[i].life <= 0) state.trail.splice(i, 1);
    }

    // Obstacle management
    state.spawnTimer -= state.speed;
    if (state.spawnTimer <= 0) {
      spawnObstacle(state);
      // Spawn distance shrinks slightly as speed increases, but has a hard minimum
      state.spawnTimer = Math.max(420, 520 - (state.speed - state.baseSpeed) * 20);
    }

    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const obs = state.obstacles[i];
      obs.x -= state.speed;

      // Scoring
      if (!obs.passed && obs.x + obs.w < state.player.x) {
        obs.passed = true;
        if (obs.isScorable) {
          state.score++;
          playSound('score', muted);
          // Occasional visual glitch on high scores to mess with the player
          if (state.score > 0 && state.score % 15 === 0) state.flash = 8;
        }
      }

      // Collision Check
      if (rectsIntersect(state.player.x, state.player.y, state.player.size, obs.x, obs.y, obs.w, obs.h)) {
        die();
      }

      // Cleanup
      if (obs.x + obs.w < 0) {
        state.obstacles.splice(i, 1);
      }
    }
  }, [die, spawnObstacle]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;

    // Background (with flash glitch capability)
    ctx.fillStyle = state.flash > 0 ? '#ffffff' : '#09090b';
    ctx.fillRect(0, 0, 800, 600);

    ctx.save();
    
    // Screen Shake
    if (state.shakeTime > 0) {
      const dx = (Math.random() - 0.5) * 25;
      const dy = (Math.random() - 0.5) * 25;
      ctx.translate(dx, dy);
    }

    // Moving Grid Background
    ctx.strokeStyle = state.flash > 0 ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    state.bgOffset = (state.bgOffset || 0) - (state.status === 'playing' ? state.speed * 0.5 : 1);
    if (state.bgOffset <= -gridSize) state.bgOffset += gridSize;

    ctx.beginPath();
    for (let x = state.bgOffset; x < 800; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
    }
    for (let y = 0; y < 600; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
    }
    ctx.stroke();

    // Player Trail
    state.trail.forEach((t) => {
      ctx.fillStyle = `rgba(34, 211, 238, ${t.life * 0.4})`;
      ctx.fillRect(t.x, t.y, state.player.size, state.player.size);
    });

    // Draw Player
    if (state.status === 'playing' || state.status === 'menu') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#22d3ee';
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(state.player.x, state.player.y, state.player.size, state.player.size);
      ctx.shadowBlur = 0;
    }

    // Draw Obstacles
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    state.obstacles.forEach((obs) => {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    });
    ctx.shadowBlur = 0;

    // Draw Particles
    state.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, 6, 6);
    });
    ctx.globalAlpha = 1.0;

    // Draw Score Watermark
    if (state.status === 'playing') {
      ctx.fillStyle = state.flash > 0 ? 'rgba(0,0,0,0.8)' : 'rgba(255, 255, 255, 0.08)';
      ctx.font = '900 180px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.score.toString(), 400, 300);
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

  const handleInput = useCallback(() => {
    const state = gameState.current;
    if (state.status === 'playing') {
      state.player.gravityDir *= -1;
      state.player.velocity = 0; // Snappy direction change
      playSound('jump', muted);
    } else if (state.status === 'menu' || state.status === 'gameover') {
      // Prevent accidental instant-restarts when spamming by debouncing
      if (state.status === 'gameover' && state.shakeTime > 5) return;
      startGame();
    }
  }, [startGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
      }
    };
    const handlePointerDown = (e: PointerEvent) => {
      // Prevent input if they're clicking a button
      if ((e.target as HTMLElement).closest('button, a')) return;
      handleInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [handleInput]);

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none touch-none">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full max-w-[1200px] max-h-[900px] object-contain z-10 cursor-pointer"
      />

      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        {uiState.status === 'menu' && (
          <div className="text-center">
            <h1 className="text-7xl font-black text-cyan-400 mb-6 tracking-tighter drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              FLIP RAGE
            </h1>
            <p className="text-neutral-400 text-xl mb-10 animate-pulse font-medium">
              Tap anywhere or press Space to start
            </p>
            <div className="flex justify-center gap-4 text-sm font-bold text-neutral-400">
              <span className="bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-lg backdrop-blur">
                AVOID PINK
              </span>
              <span className="bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-lg backdrop-blur">
                TAP TO FLIP
              </span>
            </div>
          </div>
        )}

        {uiState.status === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-neutral-950/95 p-10 border border-red-500/40 rounded-3xl text-center backdrop-blur-xl pointer-events-auto shadow-[0_0_50px_rgba(153,27,27,0.3)] max-w-sm w-full mx-4"
          >
            <h2 className="text-6xl font-black text-red-500 mb-2 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">
              WASTED
            </h2>
            <p className="text-6xl font-black text-white mb-8">{uiState.score}</p>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 mb-8 text-neutral-300 font-medium">
                &quot;{uiState.taunt}&quot;
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-neutral-500 mb-6 px-2">
              <span>BEST</span>
              <span className="text-cyan-400 text-xl">{uiState.highScore}</span>
            </div>

            <p className="text-neutral-400 font-bold animate-pulse text-lg">Tap anywhere to retry</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
