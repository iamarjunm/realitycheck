'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

const TAUNTS = [
  { max: 5, msgs: ["Too slow.", "Did you even try?", "My grandma aims better.", "Embarrassing.", "Are you blind?"] },
  { max: 15, msgs: ["Still terrible.", "You clicked the wrong color.", "A toddler could do this.", "Focus!", "You have the reflexes of a rock."] },
  { max: 30, msgs: ["Barely acceptable.", "Okay, maybe you're awake.", "Sweating yet?", "Don't blink."] },
  { max: 60, msgs: ["You're getting addicted, aren't you?", "Go touch grass.", "I bet your hands are shaking.", "Almost impressive."] },
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

type TargetType = 'good' | 'bad' | 'runner' | 'troll';

type Target = {
  id: number;
  x: number;
  y: number;
  r: number;
  type: TargetType;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; decay: number; color: string };

type GameState = {
  status: 'menu' | 'playing' | 'gameover';
  score: number;
  highScore: number;
  frames: number;
  pointerX: number;
  pointerY: number;
  targets: Target[];
  particles: Particle[];
  shakeTime: number;
  flash: number;
  taunt: string;
  causeOfDeath: string;
};

import { playSound } from "./AudioSystem";

export default function MadTap({ muted = false }: { muted?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiState, setUiState] = useState({ status: 'menu', score: 0, highScore: 0, taunt: '', causeOfDeath: '' });

  const gameState = useRef<GameState>({
    status: 'menu',
    score: 0,
    highScore: 0,
    frames: 0,
    pointerX: -1000,
    pointerY: -1000,
    targets: [],
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
    const saved = localStorage.getItem('rage_tap_high');
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
      targets: [],
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
      localStorage.setItem('rage_tap_high', state.score.toString());
    }
    state.taunt = getTaunt(state.score);

    for (let i = 0; i < 100; i++) {
      state.particles.push({
        x: state.pointerX,
        y: state.pointerY,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.03,
        color: '#f43f5e',
      });
    }
    syncUi();
  }, [syncUi]);

  const createParticles = (x: number, y: number, color: string) => {
    const state = gameState.current;
    for (let i = 0; i < 20; i++) {
      state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        decay: 0.05 + Math.random() * 0.05,
        color
      });
    }
  };

  const spawnTarget = useCallback((state: GameState) => {
    const r = 25 + Math.random() * 25;
    const x = r + Math.random() * (800 - r * 2);
    const y = r + Math.random() * (600 - r * 2);
    
    let type: TargetType = 'good';
    
    // Rage mechanics escalate with score
    if (state.score > 3) {
      const roll = Math.random();
      if (roll < 0.2) type = 'bad';
      else if (roll < 0.4 && state.score > 8) type = 'runner';
      else if (roll < 0.6 && state.score > 15) type = 'troll';
    }

    const lifeMultiplier = Math.max(0.45, 1.0 - state.score * 0.015); // Shrinks time available as you score
    
    state.targets.push({
      id: Math.random(),
      x, y, r, type,
      life: 120 * lifeMultiplier, // frames
      maxLife: 120 * lifeMultiplier,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    });
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

    // Spawning logic
    const spawnRate = Math.max(35, 100 - state.score * 1.5);
    if (state.frames % spawnRate === 0) {
      spawnTarget(state);
      // Sometimes double spawn for chaos
      if (Math.random() < 0.3 && state.score > 10) spawnTarget(state);
    }

    // Update targets
    for (let i = state.targets.length - 1; i >= 0; i--) {
      const t = state.targets[i];
      t.life--;

      if (t.life <= 0) {
        if (t.type === 'good' || t.type === 'runner' || t.type === 'troll') {
          // You let a good target expire! Game over!
          state.pointerX = t.x; state.pointerY = t.y; // Center explosion on the missed target
          die("TOO SLOW.");
          return; // Stop updating
        } else {
          // Bad targets naturally expire, perfectly fine
          state.targets.splice(i, 1);
          continue;
        }
      }

      // Movement
      t.x += t.vx;
      t.y += t.vy;

      // Bounce off walls
      if (t.x < t.r || t.x > 800 - t.r) t.vx *= -1;
      if (t.y < t.r || t.y > 600 - t.r) t.vy *= -1;

      // Rage Mechanics: Proximity checks
      const dx = t.x - state.pointerX;
      const dy = t.y - state.pointerY;
      const dist = Math.hypot(dx, dy);

      if (t.type === 'runner' && dist < 150) {
        // Runs away from pointer
        t.x += (dx / dist) * 12;
        t.y += (dy / dist) * 12;
      }
      
      if (t.type === 'troll' && dist < 80) {
        // Pure evil: turns into a bad target RIGHT before you click it
        t.type = 'bad';
      }
    }

    // Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }, [die, spawnTarget]);

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

    // Draw Targets
    state.targets.forEach((t) => {
      ctx.beginPath();
      
      // Visual radius shrinks as life decreases to induce panic
      const visualR = Math.max(5, t.r * (0.4 + 0.6 * (t.life / t.maxLife)));
      ctx.arc(t.x, t.y, visualR, 0, Math.PI * 2);
      
      if (t.type === 'bad') {
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
      } else {
        // Troll and Runner look identical to Good to trick the player
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#22d3ee';
      }
      
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner stroke to show time left
      ctx.beginPath();
      ctx.arc(t.x, t.y, visualR * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Draw Particles
    state.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Score
    if (state.status === 'playing') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.font = '900 200px sans-serif';
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
    gameState.current.pointerX = (e.clientX - rect.left) * (800 / rect.width);
    gameState.current.pointerY = (e.clientY - rect.top) * (600 / rect.height);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = gameState.current;
    if (state.status === 'menu' || state.status === 'gameover') {
      if (state.status === 'gameover' && state.shakeTime > 10) return; // Prevent instant restart
      startGame();
      return;
    }

    if (state.status !== 'playing') return;

    const px = state.pointerX;
    const py = state.pointerY;

    // Check hit (Reverse order for z-index)
    let hitIndex = -1;
    for (let i = state.targets.length - 1; i >= 0; i--) {
      const t = state.targets[i];
      // The hitbox is now permanently large and forgiving, regardless of visual shrinking
      const hitboxR = t.r + 25;
      if (Math.hypot(t.x - px, t.y - py) < hitboxR) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex === -1) {
      // Pure Ragebait: Clicking the background is an instant loss
      die("YOU MISSED. DON'T MISS.");
    } else {
      const t = state.targets[hitIndex];
      if (t.type === 'bad') {
        die("YOU CLICKED THE RED ONE.");
      } else {
        // Success
        state.score++;
        createParticles(t.x, t.y, '#22d3ee');
        state.targets.splice(hitIndex, 1);
        
        // Minor flash effect on high score milestones
        if (state.score % 20 === 0) state.flash = 5;
      }
    }
  }, [startGame, die]);

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none touch-none">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-full max-w-[1200px] max-h-[900px] object-contain z-10 cursor-crosshair"
      />

      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        {uiState.status === 'menu' && (
          <div className="text-center">
            <h1 className="text-7xl font-black text-cyan-400 mb-6 tracking-tighter drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              MAD TAP
            </h1>
            <p className="text-neutral-400 text-xl mb-10 animate-pulse font-medium">
              Tap the cyan circles before they shrink.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-neutral-400 max-w-lg mx-auto">
              <span className="bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-lg backdrop-blur">
                DO NOT TAP RED
              </span>
              <span className="bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-lg backdrop-blur text-red-400">
                DO NOT MISS THE CIRCLES
              </span>
              <span className="bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-lg backdrop-blur text-yellow-400">
                TRUST NOTHING
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
            <p className="text-red-400 font-bold mb-6 tracking-widest uppercase">{uiState.causeOfDeath}</p>
            
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
