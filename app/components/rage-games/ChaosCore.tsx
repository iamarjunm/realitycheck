'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

const TAUNTS = [
  { max: 100, msgs: ["Sensory overload?", "Did you even see it coming?", "Pathetic reaction time.", "Too much visual noise?", "Focus."] },
  { max: 500, msgs: ["A little bit of matrix slowed you down?", "Can't handle the shift?", "You lost track of yourself.", "Follow the core, ignore the glitches."] },
  { max: 1500, msgs: ["Getting dizzy?", "The void consumes.", "Your eyes are bleeding.", "Acceptable, but still weak."] },
  { max: 3000, msgs: ["You're in the matrix now.", "Godlike focus.", "I didn't think you'd survive the flip.", "Are you a machine?"] },
  { max: 100000, msgs: ["ANOMALY.", "BEYOND HUMAN.", "Okay, you are actually insane.", "Please blink."] },
];

function getTaunt(score: number) {
  for (const t of TAUNTS) {
    if (score <= t.max) return t.msgs[Math.floor(Math.random() * t.msgs.length)];
  }
  return "I have no words.";
}

// --- Audio Engine (Web Audio API) ---
// --- Types ---
type Bullet = { x: number; y: number; vx: number; vy: number; r: number; color: string; bounce?: boolean };
type Laser = { x: number; y: number; w: number; h: number; warnTime: number; fireTime: number; active: boolean; dir: 'v'|'h' };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; decay: number; color: string; type: 'spark' | 'trail' | 'ring'; r?: number };

type GameState = {
  status: 'menu' | 'playing' | 'gameover';
  score: number;
  highScore: number;
  frames: number;
  realFrames: number;
  player: { x: number; y: number; vx: number; vy: number; r: number };
  bullets: Bullet[];
  lasers: Laser[];
  particles: Particle[];
  shakeTime: number;
  flash: number;
  freezeTimer: number;
  graceTimer: number;
  taunt: string;
  phase: number;
  keys: { [key: string]: boolean };
  width: number;
  height: number;
  
  // New Mechanics
  timeScale: number;
  targetTimeScale: number;
  combo: number;
  comboTimer: number;
  dashCooldown: number;
  dashDuration: number;
};

import { playSound } from "./AudioSystem";

export default function ChaosCore({ muted = false }: { muted?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uiState, setUiState] = useState({ status: 'menu', score: 0, highScore: 0, taunt: '', phase: 0, combo: 1 });

  const gameState = useRef<GameState>({
    status: 'menu',
    score: 0,
    highScore: 0,
    frames: 0,
    realFrames: 0,
    player: { x: 400, y: 300, vx: 0, vy: 0, r: 4 }, // Will be updated on start
    bullets: [],
    lasers: [],
    particles: [],
    shakeTime: 0,
    flash: 0,
    freezeTimer: 0,
    graceTimer: 0,
    taunt: '',
    phase: 0,
    keys: {},
    width: 800,
    height: 600,
    timeScale: 1.0,
    targetTimeScale: 1.0,
    combo: 1,
    comboTimer: 0,
    dashCooldown: 0,
    dashDuration: 0,
  });

  const syncUi = useCallback(() => {
    setUiState({
      status: gameState.current.status,
      score: gameState.current.score,
      highScore: gameState.current.highScore,
      taunt: gameState.current.taunt,
      phase: gameState.current.phase,
      combo: gameState.current.combo,
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('rage_chaos_high');
    if (saved) {
      gameState.current.highScore = parseInt(saved, 10);
      syncUi();
    }

    const handleResize = () => {
      gameState.current.width = window.innerWidth;
      gameState.current.height = window.innerHeight;
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init sizes
    return () => window.removeEventListener('resize', handleResize);
  }, [syncUi]);

  const startGame = useCallback(() => {
    const w = gameState.current.width;
    const h = gameState.current.height;
    gameState.current = {
      ...gameState.current,
      status: 'playing',
      score: 0,
      frames: 0,
      realFrames: 0,
      player: { x: w / 2, y: h / 2, vx: 0, vy: 0, r: 4 },
      bullets: [],
      lasers: [],
      particles: [],
      shakeTime: 0,
      flash: 0,
      freezeTimer: 0,
      phase: 0,
      keys: {},
      timeScale: 1.0,
      targetTimeScale: 1.0,
      combo: 1,
      comboTimer: 0,
      dashCooldown: 0,
      dashDuration: 0,
      graceTimer: 120, // 2 second grace period at start
    };
    if (containerRef.current) {
      containerRef.current.style.transform = 'none';
      containerRef.current.style.filter = 'none';
    }
    syncUi();
  }, [syncUi]);

  const die = useCallback(() => {
    const state = gameState.current;
    if (state.status === 'gameover') return;
    playSound('die', muted);
    state.status = 'gameover';
    state.shakeTime = 40;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('rage_chaos_high', state.score.toString());
    }
    state.taunt = getTaunt(state.score);

    for (let i = 0; i < 200; i++) {
      state.particles.push({
        x: state.player.x,
        y: state.player.y,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        life: 1.0,
        decay: 0.005 + Math.random() * 0.01,
        color: '#06b6d4',
        type: 'spark'
      });
    }
    
    // Massive death ring
    state.particles.push({ x: state.player.x, y: state.player.y, vx: 0, vy: 0, life: 1.0, decay: 0.02, color: '#f43f5e', type: 'ring' });
    
    if (containerRef.current) {
      containerRef.current.style.transform = 'none';
      containerRef.current.style.filter = 'none';
    }
    syncUi();
  }, [syncUi]);

  const triggerWowMoment = useCallback((phase: number, state: GameState) => {
    state.phase = phase;
    state.freezeTimer = 120; // 2 seconds of pure freeze
    state.graceTimer = 120; // 2 seconds of safe movement after unfreeze
    state.bullets = []; // Clear existing bullets
    state.lasers = []; // Clear existing lasers
    state.flash = 20;
    state.shakeTime = 60;
    playSound('die', muted);
    
    // Spawn massive explosion
    const w = state.width;
    const h = state.height;
    for (let i = 0; i < 300; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 25;
      state.particles.push({
        x: w / 2, y: h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0, decay: 0.01,
        color: phase === 1 ? '#ef4444' : phase === 2 ? '#06b6d4' : phase === 3 ? '#a855f7' : '#ffffff',
        type: 'spark'
      });
    }
    state.particles.push({ x: w / 2, y: h / 2, vx: 0, vy: 0, life: 1.0, decay: 0.01, color: '#06b6d4', type: 'ring' });
    
    syncUi();
  }, [syncUi]);

  const applyDomEffects = useCallback((phase: number, freezeTimer: number) => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    
    if (freezeTimer > 0) {
      // Glitching aggressively during warning
      el.style.transform = `scale(1.05) translate(${(Math.random() - 0.5) * 30}px, ${(Math.random() - 0.5) * 30}px) skewX(${(Math.random() - 0.5) * 15}deg)`;
      el.style.filter = `contrast(200%) brightness(150%) hue-rotate(${Math.random() * 360}deg)`;
      return;
    }

    if (phase === 0 || phase === 2) {
      el.style.transform = 'none';
      el.style.filter = 'none';
    } else if (phase === 1) {
      // The Flip
      el.style.transform = 'rotate(180deg)';
      el.style.filter = 'hue-rotate(180deg)';
    } else if (phase === 3) {
      // Invert + Scale bounce
      const scale = 0.85 + Math.sin(Date.now() / 150) * 0.15;
      el.style.transform = `rotate(-90deg) scale(${scale})`;
      el.style.filter = 'invert(1) hue-rotate(90deg)';
    } else if (phase >= 4) {
      // Absolute Chaos
      const rot = Math.sin(Date.now() / 1000) * 45;
      const skew = Math.sin(Date.now() / 300) * 10;
      el.style.transform = `rotate(${rot}deg) scale(1.15) skewY(${skew}deg)`;
      el.style.filter = `invert(${Math.sin(Date.now() / 500) > 0 ? 1 : 0}) hue-rotate(${Date.now() / 5}deg) contrast(150%)`;
    }
  }, []);

  const spawnPattern = useCallback((state: GameState, pattern: string) => {
    const W = state.width;
    const H = state.height;
    
    if (pattern === 'ring') {
      for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        state.bullets.push({
          x: W / 2, y: H / 2,
          vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
          r: 6, color: '#f43f5e', bounce: state.phase >= 2
        });
      }
    } else if (pattern === 'spiral') {
      const angle = state.frames * 0.15;
      for (let i = 0; i < 5; i++) {
        const a = angle + (i * Math.PI * 2 / 5);
        state.bullets.push({
          x: W / 2, y: H / 2,
          vx: Math.cos(a) * 6, vy: Math.sin(a) * 6,
          r: 8, color: '#a855f7'
        });
      }
    } else if (pattern === 'corner_lines') {
      const speed = 2.5;
      for (let i = 0; i < 15; i++) {
        const offset = i * 20;
        // Top-left
        state.bullets.push({ x: -offset, y: -offset, vx: speed, vy: speed, r: 6, color: '#f59e0b', bounce: false });
        // Top-right
        state.bullets.push({ x: W + offset, y: -offset, vx: -speed, vy: speed, r: 6, color: '#f59e0b', bounce: false });
        // Bottom-left
        state.bullets.push({ x: -offset, y: H + offset, vx: speed, vy: -speed, r: 6, color: '#f59e0b', bounce: false });
        // Bottom-right
        state.bullets.push({ x: W + offset, y: H + offset, vx: -speed, vy: -speed, r: 6, color: '#f59e0b', bounce: false });
      }
    } else if (pattern === 'tracker') {
       // A burst of fast aimed bullets
       for (let i=0; i<5; i++) {
          const angle = Math.atan2(state.player.y - H/2, state.player.x - W/2) + (i - 2) * 0.1;
          state.bullets.push({
            x: W / 2, y: H / 2,
            vx: Math.cos(angle) * 8.5, vy: Math.sin(angle) * 8.5,
            r: 7, color: '#06b6d4'
          });
       }
    }
  }, []);

  const update = useCallback(() => {
    const state = gameState.current;

    if (state.status === 'playing') {
      applyDomEffects(state.phase, state.freezeTimer);
    }

    if (state.status !== 'playing') {
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0) state.particles.splice(i, 1);
      }
      if (state.shakeTime > 0) state.shakeTime--;
      return;
    }

    if (state.freezeTimer > 0) {
      state.freezeTimer--;
      // Keep updating particles during freeze for visual flair
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0) state.particles.splice(i, 1);
      }
      return; 
    }

    // --- Time Scale Logic (Matrix Effect) ---
    state.timeScale += (state.targetTimeScale - state.timeScale) * 0.15; // smooth lerp
    
    state.realFrames++;
    state.frames += state.timeScale; // logical frames progress slower during matrix
    if (state.flash > 0) state.flash--;
    if (state.shakeTime > 0) state.shakeTime -= state.timeScale;
    
    if (state.comboTimer > 0) {
       state.comboTimer -= state.timeScale;
       if (state.comboTimer <= 0) state.combo = 1;
    }

    // Passive score generation based on combo
    if (state.realFrames % 10 === 0) {
      state.score += Math.floor(1 * state.combo);
      syncUi();
    }

    // WOW MOMENT TRIGGERS
    if (state.score > 250 && state.phase === 0) triggerWowMoment(1, state); 
    if (state.score > 500 && state.phase === 1) triggerWowMoment(2, state); 
    if (state.score > 3000 && state.phase === 2) triggerWowMoment(3, state); 
    if (state.score > 6000 && state.phase === 3) triggerWowMoment(4, state); 

    // --- Player Movement ---
    // Player remains faster than timeScale to allow matrix dodging
    const playerTimeScale = state.timeScale * 0.2 + 0.8; 
    let speed = 9.5 * playerTimeScale;
    
    let dx = 0; let dy = 0;
    if (state.keys['w'] || state.keys['KeyW'] || state.keys['ArrowUp']) dy -= speed;
    if (state.keys['s'] || state.keys['KeyS'] || state.keys['ArrowDown']) dy += speed;
    if (state.keys['a'] || state.keys['KeyA'] || state.keys['ArrowLeft']) dx -= speed;
    if (state.keys['d'] || state.keys['KeyD'] || state.keys['ArrowRight']) dx += speed;
    
    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707; dy *= 0.707;
    }

    // Dash (Shift)
    if ((state.keys['Shift'] || state.keys['ShiftLeft'] || state.keys['ShiftRight']) && state.dashCooldown <= 0) {
      state.dashDuration = 12; // frames
      state.dashCooldown = 35;
      playSound('jump', muted);
    }
    
    if (state.dashCooldown > 0) state.dashCooldown -= state.timeScale;
    if (state.dashDuration > 0) {
      state.dashDuration -= state.timeScale;
      dx *= 3; dy *= 3; // Dash multiplier
      
      // Dash trail
      state.particles.push({
        x: state.player.x, y: state.player.y,
        vx: 0, vy: 0, life: 0.6, decay: 0.05, color: '#06b6d4', type: 'trail', r: state.player.r
      });
    }

    state.player.x += dx;
    state.player.y += dy;

    // Bounds
    if (state.player.x < state.player.r) state.player.x = state.player.r;
    if (state.player.x > state.width - state.player.r) state.player.x = state.width - state.player.r;
    if (state.player.y < state.player.r) state.player.y = state.player.r;
    if (state.player.y > state.height - state.player.r) state.player.y = state.height - state.player.r;

    // --- Entity Spawning ---
    if (state.graceTimer > 0) {
      state.graceTimer -= state.timeScale;
    } else {
      const diff = 1 + (state.score / 2500); // Scales fast
    
      if (state.realFrames % Math.max(6, Math.floor(18 / diff)) === 0) {
        const angle = Math.atan2(state.player.y - state.height/2, state.player.x - state.width/2) + (Math.random() - 0.5) * 1.5;
        state.bullets.push({
          x: state.width / 2, y: state.height / 2,
          vx: Math.cos(angle) * (4.0 + Math.random() * 2.5 + (state.score / 120)),
          vy: Math.sin(angle) * (4.0 + Math.random() * 2.5 + (state.score / 120)),
          r: 5, color: '#eab308'
        });
      }

      if (state.phase >= 2 && state.realFrames % Math.max(120, Math.floor(250 / diff)) === 0) {
        spawnPattern(state, 'ring');
      }
      if (state.phase >= 2 && state.realFrames % Math.max(50, Math.floor(120 / diff)) === 0) {
         spawnPattern(state, 'tracker');
      }
      if (state.phase >= 3 && state.realFrames % Math.max(25, Math.floor(60 / diff)) === 0) {
        spawnPattern(state, 'spiral');
      }
      if (state.phase >= 3 && state.realFrames % Math.max(150, Math.floor(400 / diff)) === 0) {
        spawnPattern(state, 'corner_lines');
      }
    }

    // --- Update Bullets & Collision ---
    let minBulletDist = Infinity;
    
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      // Move by timeScale
      b.x += b.vx * state.timeScale; 
      b.y += b.vy * state.timeScale;
      
      if (b.bounce) {
        if (b.x < 0 || b.x > state.width) b.vx *= -1;
        if (b.y < 0 || b.y > state.height) b.vy *= -1;
      }

      const dist = Math.hypot(b.x - state.player.x, b.y - state.player.y);
      if (dist < minBulletDist) minBulletDist = dist;

      // Death collision
      if (dist < b.r + state.player.r) {
        die();
      } 
      // Graze mechanics (must be extremely close, and not dodging via dash I-frames if we had them)
      else if (dist < b.r + state.player.r + 20 && state.realFrames % 4 === 0) {
        state.score += 5 * state.combo;
        state.combo = Math.min(state.combo + 0.1, 10);
        state.comboTimer = 120;
        playSound('graze', muted);
        state.particles.push({
          x: state.player.x, y: state.player.y,
          vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
          life: 0.6, decay: 0.05, color: '#facc15', type: 'spark'
        });
      }

      if (!b.bounce && (b.x < -100 || b.x > state.width + 100 || b.y < -100 || b.y > state.height + 100)) {
        state.bullets.splice(i, 1);
      }
    }

    // Matrix Slow-Mo Trigger
    if (minBulletDist < 80) {
      state.targetTimeScale = 0.25; // Slow down time!
    } else {
      state.targetTimeScale = 1.0;
    }

    // --- Update Lasers ---
    for (let i = state.lasers.length - 1; i >= 0; i--) {
      const l = state.lasers[i];
      if (l.warnTime > 0) {
        l.warnTime -= state.timeScale;
        if (l.warnTime <= 0) {
          l.active = true;
          state.shakeTime = 30; // Massive shake on fire
          playSound('laserFire', muted);
        } else if (Math.floor(l.warnTime) % 15 === 0) {
          playSound('laserWarn', muted);
        }
      } else if (l.active) {
        l.fireTime -= state.timeScale;
        
        // Collision with laser
        if (state.player.x > l.x && state.player.x < l.x + l.w &&
            state.player.y > l.y && state.player.y < l.y + l.h) {
          die();
        }
        
        if (l.fireTime <= 0) {
          state.lasers.splice(i, 1);
        }
      }
    }

    // --- Update Particles ---
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * state.timeScale; 
      p.y += p.vy * state.timeScale; 
      p.life -= p.decay * state.timeScale;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

  }, [die, applyDomEffects, triggerWowMoment, spawnPattern, syncUi]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;

    // Base background with motion blur support
    ctx.globalCompositeOperation = 'source-over';
    
    // Matrix Tint
    if (state.timeScale < 0.95 && state.status === 'playing') {
       ctx.fillStyle = `rgba(6, 182, 212, ${(1 - state.timeScale) * 0.2})`; // Blue wash
    } else {
       ctx.fillStyle = state.flash > 0 ? '#ffffff' : 'rgba(9, 9, 11, 0.4)';
    }
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.save();
    
    if (state.shakeTime > 0) {
      const intensity = state.freezeTimer > 0 ? 15 : Math.min(15, state.shakeTime * 0.5);
      const dx = (Math.random() - 0.5) * intensity;
      const dy = (Math.random() - 0.5) * intensity;
      ctx.translate(dx, dy);
    }

    // --- Parallax Grid ---
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1;
    const offsetX = (state.player.x / state.width) * 40;
    const offsetY = (state.player.y / state.height) * 40;
    ctx.beginPath();
    for (let x = 0; x <= state.width + 40; x += 40) {
      ctx.moveTo(x - offsetX, 0); ctx.lineTo(x - offsetX, state.height);
    }
    for (let y = 0; y <= state.height + 40; y += 40) {
      ctx.moveTo(0, y - offsetY); ctx.lineTo(state.width, y - offsetY);
    }
    ctx.stroke();

    // Additive blending for pure visual pop
    ctx.globalCompositeOperation = 'lighter';

    // Draw Particles
    state.particles.forEach((p) => {
      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + p.life * 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'trail') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r || 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.lineWidth = 4 * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (1 - p.life) * 150, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1.0;

    // Draw Lasers
    state.lasers.forEach((l) => {
      if (l.warnTime > 0) {
        // Telegraph
        ctx.fillStyle = `rgba(244, 63, 94, ${0.1 + Math.sin(state.realFrames * 0.5) * 0.15})`;
        ctx.fillRect(l.x, l.y, l.w, l.h);
        ctx.fillStyle = '#f43f5e';
        if (l.dir === 'v') ctx.fillRect(l.x + l.w/2 - 1, l.y, 2, l.h);
        else ctx.fillRect(l.x, l.y + l.h/2 - 1, l.w, 2);
      } else if (l.active) {
        // Massive Laser Blast
        ctx.fillStyle = 'red';
        ctx.fillRect(l.x - 4, l.y, l.w, l.h);
        ctx.fillStyle = 'cyan';
        ctx.fillRect(l.x + 4, l.y, l.w, l.h);
        ctx.fillStyle = 'white';
        ctx.fillRect(l.x, l.y, l.w, l.h);
      }
    });

    // Draw Bullets (Core + Glow)
    state.bullets.forEach((b) => {
      ctx.fillStyle = b.color + '40'; // hex alpha
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    });

    // Draw Player
    if (state.status === 'playing' || state.status === 'menu') {
      // Aura
      ctx.fillStyle = `rgba(6, 182, 212, ${0.5 + Math.sin(state.realFrames * 0.2) * 0.2})`;
      ctx.beginPath(); ctx.arc(state.player.x, state.player.y, state.player.r * 4, 0, Math.PI * 2); ctx.fill();
      // Core Hitbox
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2); ctx.fill();

      // Combo popup near player
      if (state.combo > 1) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(250, 204, 21, ${Math.min(1, state.comboTimer / 30)})`;
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`x${Math.floor(state.combo)}`, state.player.x, state.player.y - 25);
        ctx.globalCompositeOperation = 'lighter';
      }
    }

    ctx.globalCompositeOperation = 'source-over';

    // Phase Shift Freeze Overlay
    if (state.freezeTimer > 0) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.8)';
      ctx.font = '900 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("ANOMALY DETECTED", state.width/2, state.height/2);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 30px sans-serif';
      ctx.fillText("PREPARE FOR SHIFT", state.width/2, state.height/2 + 60);
      
      // Giant expanding ring during freeze
      ctx.strokeStyle = `rgba(6, 182, 212, ${state.freezeTimer / 120})`;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(state.width/2, state.height/2, (120 - state.freezeTimer) * 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (state.status === 'playing' && state.freezeTimer <= 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '900 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${state.score}`, state.width / 2, 30);
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
      state.keys[e.key] = true;
      state.keys[e.code] = true;

      if (state.status === 'menu' || state.status === 'gameover') {
        if (e.code === 'Space') {
          e.preventDefault();
          if (state.status === 'gameover' && state.shakeTime > 10) return;
          startGame();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = false;
      gameState.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startGame]);

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      
      {/* Wrapper div for intense CSS DOM manipulations (The Wow factor) */}
      <div 
        ref={containerRef}
        className="relative shadow-[0_0_150px_rgba(6,182,212,0.15)] transition-transform duration-300 ease-out w-full h-full"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover z-10 overflow-hidden bg-neutral-950"
        />

        {/* CRT Scanline and Vignette Post-Processing Overlays purely in CSS */}
        <div 
          className="pointer-events-none absolute inset-0 z-40 opacity-30 mix-blend-overlay overflow-hidden"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 50%)',
            backgroundSize: '100% 4px'
          }}
        />
        <div 
          className="pointer-events-none absolute inset-0 z-40 opacity-80 overflow-hidden"
          style={{
            background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.9) 100%)'
          }}
        />

        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
          {uiState.status === 'menu' && (
            <div className="text-center bg-neutral-950/80 p-10 rounded-3xl backdrop-blur-md border border-cyan-900/50 shadow-2xl">
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6 tracking-tighter">
                CHAOS CORE
              </h1>
              <p className="text-neutral-300 text-xl mb-8 font-medium max-w-md mx-auto">
                Pure Sensory Overload. Survive the bullet hell.
              </p>
              <div className="flex flex-col items-center gap-4 text-sm font-bold text-neutral-400 mb-8">
                <span className="bg-neutral-900 px-6 py-3 rounded-lg border border-neutral-700 shadow-inner flex gap-2">
                  <span className="text-white">WASD</span> or <span className="text-white">ARROWS</span> to Move
                </span>
                <span className="bg-neutral-900 px-6 py-3 rounded-lg border border-neutral-700 shadow-inner text-cyan-400">
                  <span className="text-white">SHIFT</span> to Dash (I-Frames coming soon)
                </span>
                <span className="bg-neutral-900 px-6 py-3 rounded-lg border border-neutral-700 shadow-inner text-yellow-400">
                  Graze bullets to slow time & build combo
                </span>
              </div>

              {uiState.highScore > 0 && (
                <div className="mb-8 px-6 py-2 bg-neutral-900/80 rounded-full border border-cyan-500/30 text-cyan-400 font-bold tracking-widest text-sm flex items-center justify-center gap-3 mx-auto w-fit shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <span>HIGH SCORE</span>
                  <span className="text-white text-xl">{uiState.highScore}</span>
                </div>
              )}

              <p className="text-white font-black animate-pulse text-2xl">Press SPACE to Start</p>
            </div>
          )}

          {uiState.status === 'gameover' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-neutral-950/95 p-10 border border-cyan-500/40 rounded-3xl text-center backdrop-blur-xl shadow-[0_0_80px_rgba(6,182,212,0.4)] max-w-sm w-full mx-4 pointer-events-auto"
            >
              <h2 className="text-6xl font-black text-cyan-500 mb-2 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                ERASED
              </h2>
              <p className="text-cyan-400 font-bold mb-6 tracking-widest uppercase text-sm leading-relaxed">
                Phase {uiState.phase} Reached
              </p>
              
              <p className="text-7xl font-black text-white mb-8">{uiState.score}</p>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 mb-8 text-neutral-300 font-medium">
                &quot;{uiState.taunt}&quot;
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-neutral-500 mb-6 px-4">
                <span>BEST</span>
                <span className="text-cyan-400 text-xl">{uiState.highScore}</span>
              </div>

              <p className="text-neutral-400 font-bold animate-pulse text-lg">Press SPACE to retry</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
