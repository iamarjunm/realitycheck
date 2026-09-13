'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

const TAUNTS = [
  { max: 5, msgs: ["Panic much?", "Smooth movements, genius.", "Stop jerking the mouse.", "It's a rubber band, not a whip.", "You did that to yourself."] },
  { max: 15, msgs: ["You're fighting the physics.", "Slingshotted into a wall. Classic.", "Breathe.", "Are your hands shaking?", "Too twitchy."] },
  { max: 30, msgs: ["Getting a feel for the tether?", "Don't get cocky.", "A bit too fast there.", "Almost looked like you knew what you were doing."] },
  { max: 60, msgs: ["Zone state achieved?", "I'm genuinely surprised.", "Your patience is... acceptable.", "Don't choke now."] },
  { max: 1000, msgs: ["Absolute Zen master.", "Physics bender.", "Okay, you've conquered the rage.", "Unbelievable."] },
];

function getTaunt(score: number) {
  for (const t of TAUNTS) {
    if (score <= t.max) {
      return t.msgs[Math.floor(Math.random() * t.msgs.length)];
    }
  }
  return "I have no words.";
}

type Obstacle = { x: number; y: number; w: number; h: number; passed: boolean; isScorable: boolean };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; decay: number; color: string };

type GameState = {
  status: 'menu' | 'playing' | 'gameover';
  score: number;
  highScore: number;
  frames: number;
  speed: number;
  pointer: { x: number; y: number };
  player: { x: number; y: number; vx: number; vy: number; r: number };
  obstacles: Obstacle[];
  particles: Particle[];
  shakeTime: number;
  flash: number;
  taunt: string;
};

import { playSound } from "./AudioSystem";

export default function TetherRage({ muted = false }: { muted?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiState, setUiState] = useState({ status: 'menu', score: 0, highScore: 0, taunt: '' });

  const gameState = useRef<GameState>({
    status: 'menu',
    score: 0,
    highScore: 0,
    frames: 0,
    speed: 5,
    pointer: { x: 400, y: 300 },
    player: { x: 400, y: 300, vx: 0, vy: 0, r: 12 },
    obstacles: [],
    particles: [],
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
    const saved = localStorage.getItem('rage_tether_high');
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
      speed: 4, // Starts a bit slower
      pointer: { x: 200, y: 300 },
      player: { x: 200, y: 300, vx: 0, vy: 0, r: 12 },
      obstacles: [],
      particles: [],
      shakeTime: 0,
      flash: 0,
    };
    syncUi();
  }, [syncUi]);

  const die = useCallback(() => {
    const state = gameState.current;
    if (state.status === 'gameover') return;
    state.status = 'gameover';
    playSound('die', muted);
    state.shakeTime = 40;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('rage_tether_high', state.score.toString());
    }
    state.taunt = getTaunt(state.score);

    for (let i = 0; i < 150; i++) {
      state.particles.push({
        x: state.player.x,
        y: state.player.y,
        vx: (Math.random() - 0.5) * 35,
        vy: (Math.random() - 0.5) * 35,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.02,
        color: Math.random() > 0.5 ? '#a855f7' : '#f43f5e',
      });
    }
    syncUi();
  }, [syncUi]);

  const spawnObstacle = useCallback((state: GameState) => {
    const H = 600;
    const type = Math.floor(Math.random() * 4);
    const w = 50 + Math.random() * 80;
    const x = 850; // Just off screen

    if (state.frames < 200) {
      // Gentle start
      const h1 = 100 + Math.random() * 150;
      state.obstacles.push({ x, y: 0, w, h: h1, passed: false, isScorable: true });
      return;
    }

    switch (type) {
      case 0: // Top wall
      case 1: // Bottom wall
        const isTop = type === 0;
        const h1 = 150 + Math.random() * 250;
        state.obstacles.push({ x, y: isTop ? 0 : H - h1, w, h: h1, passed: false, isScorable: true });
        break;
      case 2: // Floating center block
        const ch = 100 + Math.random() * 150;
        const cy = H / 2 - ch / 2 + (Math.random() * 200 - 100);
        state.obstacles.push({ x, y: cy, w, h: ch, passed: false, isScorable: true });
        break;
      case 3: // Squeeze tunnel
        const gap = 140 + Math.random() * 60; // Gets very tight
        const topH = 50 + Math.random() * (H - gap - 100);
        state.obstacles.push({ x, y: 0, w, h: topH, passed: false, isScorable: true });
        state.obstacles.push({ x, y: topH + gap, w, h: H - (topH + gap), passed: false, isScorable: false });
        break;
    }
  }, []);

  const circleRectIntersect = (cx: number, cy: number, cr: number, ox: number, oy: number, ow: number, oh: number) => {
    let testX = cx;
    let testY = cy;
    if (cx < ox) testX = ox;
    else if (cx > ox + ow) testX = ox + ow;
    if (cy < oy) testY = oy;
    else if (cy > oy + oh) testY = oy + oh;
    
    const distX = cx - testX;
    const distY = cy - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));
    
    return distance <= cr - 2; // -2 for slight forgiveness margin
  };

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
    state.speed += 0.002; // Slower speed ramp than FlipRage because physics are harder

    // TETHER PHYSICS (The core rage mechanic)
    // The player's ball is attached to the mouse pointer via a spring.
    const k = 0.04; // Spring constant (stiffness)
    const damping = 0.88; // Friction (closer to 1 = more bouncy and out of control)
    
    const dx = state.pointer.x - state.player.x;
    const dy = state.pointer.y - state.player.y;
    
    state.player.vx += dx * k;
    state.player.vy += dy * k;
    
    state.player.vx *= damping;
    state.player.vy *= damping;
    
    state.player.x += state.player.vx;
    state.player.y += state.player.vy;

    // Boundary constraints (bounce off screen edges so they don't get permanently lost, but this can kill them via obstacles)
    if (state.player.x < state.player.r) { state.player.x = state.player.r; state.player.vx *= -0.5; }
    if (state.player.x > 800 - state.player.r) { state.player.x = 800 - state.player.r; state.player.vx *= -0.5; }
    if (state.player.y < state.player.r) { state.player.y = state.player.r; state.player.vy *= -0.5; }
    if (state.player.y > 600 - state.player.r) { state.player.y = 600 - state.player.r; state.player.vy *= -0.5; }

    // Spawn Obstacles
    const spawnRate = Math.max(50, 110 - Math.floor(state.speed * 6));
    if (state.frames % spawnRate === 0) {
      spawnObstacle(state);
    }

    // Process Obstacles
    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const obs = state.obstacles[i];
      obs.x -= state.speed;

      // Scoring
      if (!obs.passed && obs.x + obs.w < state.player.x) {
        obs.passed = true;
        if (obs.isScorable) {
          state.score++;
          playSound('score', muted);
          if (state.score % 10 === 0) state.flash = 6;
        }
      }

      // Collision
      if (circleRectIntersect(state.player.x, state.player.y, state.player.r, obs.x, obs.y, obs.w, obs.h)) {
        die();
      }

      if (obs.x + obs.w < 0) {
        state.obstacles.splice(i, 1);
      }
    }
    
    // Process Particles (ambient speed lines)
    if (state.frames % 5 === 0) {
      state.particles.push({
        x: 800,
        y: Math.random() * 600,
        vx: -state.speed * (1.5 + Math.random()),
        vy: 0,
        life: 0.5,
        decay: 0.005,
        color: 'rgba(255,255,255,0.1)'
      });
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

  }, [die, spawnObstacle]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;

    ctx.fillStyle = state.flash > 0 ? '#ffffff' : '#09090b';
    ctx.fillRect(0, 0, 800, 600);

    ctx.save();
    
    if (state.shakeTime > 0) {
      const dx = (Math.random() - 0.5) * (state.status === 'gameover' ? 40 : 15);
      const dy = (Math.random() - 0.5) * (state.status === 'gameover' ? 40 : 15);
      ctx.translate(dx, dy);
    }

    // Draw Ambient Particles
    state.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.color.startsWith('rgba')) {
         ctx.fillRect(p.x, p.y, 40, 2); // speed lines
      } else {
         ctx.fillRect(p.x, p.y, 6, 6); // death particles
      }
    });
    ctx.globalAlpha = 1.0;

    // Draw Obstacles
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    state.obstacles.forEach((obs) => {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    });
    ctx.shadowBlur = 0;

    if (state.status === 'playing' || state.status === 'menu') {
      // Calculate tension for tether color
      const dx = state.pointer.x - state.player.x;
      const dy = state.pointer.y - state.player.y;
      const dist = Math.hypot(dx, dy);
      const maxDist = 300;
      const tension = Math.min(1, dist / maxDist); // 0 to 1
      
      // Interpolate from Cyan (relaxed) to Red (tense)
      const r = Math.round(34 + tension * (244 - 34));
      const g = Math.round(211 + tension * (63 - 211));
      const b = Math.round(238 + tension * (94 - 238));
      const tetherColor = `rgb(${r}, ${g}, ${b})`;

      // Draw Tether
      ctx.beginPath();
      ctx.moveTo(state.pointer.x, state.pointer.y);
      ctx.lineTo(state.player.x, state.player.y);
      ctx.strokeStyle = tetherColor;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Draw Pointer (Mouse)
      ctx.beginPath();
      ctx.arc(state.pointer.x, state.pointer.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Draw Player Ball
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Score
    if (state.status === 'playing') {
      ctx.fillStyle = state.flash > 0 ? 'rgba(0,0,0,0.8)' : 'rgba(255, 255, 255, 0.08)';
      ctx.font = '900 150px sans-serif';
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

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Update pointer position
    gameState.current.pointer.x = (e.clientX - rect.left) * (800 / rect.width);
    gameState.current.pointer.y = (e.clientY - rect.top) * (600 / rect.height);
  }, []);

  const handlePointerDown = useCallback(() => {
    const state = gameState.current;
    if (state.status === 'menu' || state.status === 'gameover') {
      if (state.status === 'gameover' && state.shakeTime > 10) return;
      startGame();
    }
  }, [startGame]);

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none touch-none">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-full max-w-[1200px] max-h-[900px] object-contain z-10 cursor-none"
      />

      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        {uiState.status === 'menu' && (
          <div className="text-center">
            <h1 className="text-7xl font-black text-purple-500 mb-6 tracking-tighter drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
              TETHER RAGE
            </h1>
            <p className="text-neutral-400 text-xl mb-10 font-medium">
              You are attached by a bungee cord. Guide the ball.
            </p>
            <div className="flex flex-col items-center gap-4 text-sm font-bold text-neutral-400 max-w-lg mx-auto">
              <span className="bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-lg backdrop-blur">
                PANIC = SNAP BACK = DEATH
              </span>
              <span className="bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-lg backdrop-blur text-purple-400">
                SLOW AND STEADY WINS
              </span>
            </div>
            <p className="text-white font-bold animate-pulse mt-10">Click anywhere to start</p>
          </div>
        )}

        {uiState.status === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-neutral-950/95 p-10 border border-red-500/40 rounded-3xl text-center backdrop-blur-xl pointer-events-auto shadow-[0_0_50px_rgba(153,27,27,0.3)] max-w-sm w-full mx-4"
          >
            <h2 className="text-6xl font-black text-red-500 mb-2 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">
              SNAPPED
            </h2>
            
            <p className="text-6xl font-black text-white mb-8">{uiState.score}</p>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 mb-8 text-neutral-300 font-medium">
                &quot;{uiState.taunt}&quot;
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-neutral-500 mb-6 px-2">
              <span>BEST</span>
              <span className="text-purple-400 text-xl">{uiState.highScore}</span>
            </div>

            <p className="text-neutral-400 font-bold animate-pulse text-lg">Click to retry</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
