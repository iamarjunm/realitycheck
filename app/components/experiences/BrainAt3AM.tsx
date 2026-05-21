/* eslint-disable react-hooks/purity, react/no-unescaped-entities */
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Variant = 'void' | 'drowning' | 'fever' | 'static';
const VARIANTS: Variant[] = ['void', 'drowning', 'fever', 'static'];

class AudioEngine {
  ctx: AudioContext | null = null;
  nodes: (AudioNode | null)[] = [];

  start(variant: Variant) {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.stop();

    const masterGain = this.ctx.createGain();
    masterGain.connect(this.ctx.destination);
    masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(variant === 'static' ? 0.05 : 0.1, this.ctx.currentTime + 2);
    this.nodes.push(masterGain);

    if (variant === 'void') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 15);
      osc.connect(masterGain);
      osc.start();
      this.nodes.push(osc);
    } else if (variant === 'fever') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(8000, this.ctx.currentTime); // Tinnitus
      
      const mod = this.ctx.createOscillator();
      mod.type = 'triangle';
      mod.frequency.setValueAtTime(15, this.ctx.currentTime); // Fast flutter
      const modGain = this.ctx.createGain();
      modGain.gain.setValueAtTime(2000, this.ctx.currentTime);
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      
      osc.connect(masterGain);
      osc.start();
      mod.start();
      this.nodes.push(osc, mod, modGain);
    } else if (variant === 'drowning') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, this.ctx.currentTime);
      
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.8, this.ctx.currentTime); // Slow heartbeat
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      
      osc.connect(masterGain);
      osc.start();
      lfo.start();
      this.nodes.push(osc, lfo, lfoGain);
    } else if (variant === 'static') {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      
      // Chopper
      const chopper = this.ctx.createOscillator();
      chopper.type = 'square';
      chopper.frequency.setValueAtTime(10, this.ctx.currentTime); // 10Hz chop
      const chopGain = this.ctx.createGain();
      chopGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      chopper.connect(chopGain);
      chopGain.connect(masterGain.gain);

      noise.connect(masterGain);
      noise.start();
      chopper.start();
      this.nodes.push(noise, chopper, chopGain);
    }
  }

  stop() {
    this.nodes.forEach(n => {
      if (n) {
        if (n instanceof AudioScheduledSourceNode) {
          try { n.stop(); } catch(e){}
        }
        n.disconnect();
      }
    });
    this.nodes = [];
  }
}

export function BrainAt3AM() {
  const [stage, setStage] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const audioEngine = useRef<AudioEngine | null>(null);
  
  // Pick random variant once
  const variant = useMemo(() => VARIANTS[Math.floor(Math.random() * VARIANTS.length)], []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const randomElements = useMemo(() => {
    return Array.from({ length: 15 * 8 }).map(() => ({
      isRed: Math.random() > (variant === 'drowning' ? 0.95 : 0.8),
      top: Math.random() * 100 + '%',
      left: Math.random() * 100 + '%',
      rotate: variant === 'drowning' ? (Math.random() * 10 - 5) : (Math.random() * 90 - 45),
      duration: variant === 'fever' ? (Math.random() * 0.5 + 0.1) : (Math.random() * 2 + 1),
      repeatDelay: variant === 'fever' ? 0.1 : Math.random() * 3,
      qIndex: Math.floor(Math.random() * 15)
    }));
  }, [variant]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chaoticQuestions = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      top: `${15 + Math.random() * 70}%`,
      left: `${10 + Math.random() * 60}%`,
      rotate: Math.random() * 30 - 15,
    }));
  }, [variant]);

  useEffect(() => {
    // Only init audio on interaction
    if (!audioEngine.current) {
      audioEngine.current = new AudioEngine();
    }
    
    if (stage === 1 && audioEngine.current) {
      audioEngine.current.start(variant);
    }

    if (stage === 0 && audioEngine.current) {
       audioEngine.current.stop();
    }

    return () => {
      audioEngine.current?.stop();
    };
  }, [stage, variant]);

  useEffect(() => {
    if (stage > 0 && stage < 15) {
      const ms = stage === 1 ? 4000 : (
        variant === 'fever' ? 400 : 
        variant === 'static' ? 600 : 
        variant === 'drowning' ? 3000 : 1500
      );
      const timer = setTimeout(() => {
        setStage(s => s + 1);
        if (variant === 'void' && stage > 5 && Math.random() > 0.5) setGlitch(true);
        if (variant === 'static' && Math.random() > 0.3) setGlitch(true);
        if (variant === 'fever' && Math.random() > 0.7) setGlitch(true);
      }, ms);
      return () => clearTimeout(timer);
    }
  }, [stage, variant]);

  useEffect(() => {
    if (glitch) {
      const t = setTimeout(() => setGlitch(false), variant === 'static' ? 50 : 150);
      return () => clearTimeout(t);
    }
  }, [glitch, variant]);

  const allQuestions = [
    "Do you ever miss versions of yourself that never existed?",
    "If they texted right now, would you reply?",
    "Why did you say that 4 years ago?",
    "Are you awake or just avoiding tomorrow?",
    "Is it too late?",
    "Have you noticed you're the only one still logged in?",
    "Who are you performing for in your head right now?",
    "If silence had a weight, would it crush you?",
    "You are scrolling to run away.",
    "Stop.",
    "Wake up.",
    "WAKE UP.",
    "They forgot you.",
    "Why did you leave?",
    "It's your fault."
  ];

  let bgClass = 'bg-black text-white';
  if (variant === 'drowning') bgClass = 'bg-blue-950 text-blue-100';
  if (variant === 'fever') bgClass = 'bg-orange-950 text-red-100';
  if (variant === 'static') bgClass = 'bg-zinc-900 text-zinc-300';
  
  if (glitch) {
    bgClass = 'bg-zinc-100 invert';
  }

  return (
    <div className={`flex flex-col items-center justify-center flex-grow p-4 min-h-[calc(100vh-4rem)] overflow-hidden relative transition-colors duration-200 ${bgClass}`}>
      
      {/* Background variations */}
      {stage > 2 && stage < 15 && variant === 'static' && (
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/staticnoise/500/500')] opacity-40 mix-blend-difference pointer-events-none z-10 animate-pulse" />
      )}
      
      {stage > 2 && stage < 15 && variant === 'fever' && (
        <div className="absolute inset-0 bg-red-600/20 mix-blend-color-burn pointer-events-none z-10 animate-[bounce_0.2s_infinite]" />
      )}
      
      {stage > 2 && stage < 15 && variant === 'drowning' && (
        <div className="absolute inset-0 bg-blue-900/40 mix-blend-overlay pointer-events-none z-10 blur-md animate-[pulse_4s_infinite]" />
      )}

      {/* Intrusive Thoughts Background Noise */}
      {stage > 2 && stage < 15 && (
        <div className="absolute inset-0 pointer-events-none opacity-30 select-none overflow-hidden">
          {randomElements.slice(0, stage * 10).map((el, i) => (
            <motion.div
              key={i}
              className={`absolute font-mono text-[8px] md:text-sm whitespace-nowrap ${el.isRed ? 'text-red-500' : 'text-current opacity-80'}`}
              style={{
                top: el.top,
                left: el.left,
                transform: `rotate(${el.rotate}deg)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: el.duration,
                repeat: Infinity,
                repeatDelay: el.repeatDelay
              }}
            >
              {allQuestions[el.qIndex]}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === 0 && (
          <motion.div key="intro" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center gap-12 z-20">
             <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest">[ AUDIO REQUIRED FOR FULL EXPERIENCE ]</div>
             <button
               onClick={() => setStage(1)}
               className="text-3xl md:text-5xl font-serif text-zinc-500 hover:text-white transition-all duration-1000 blur-[2px] hover:blur-none tracking-widest relative group"
             >
               What time is it?
               <span className="absolute -inset-4 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 scale-90 group-hover:scale-100 pointer-events-none"></span>
             </button>
             <div className="text-[10px] text-zinc-700 font-mono">Variant Hash: {variant}</div>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 2 }}
            className="text-center z-20 px-4"
          >
            <h2 className="text-3xl md:text-6xl font-serif italic max-w-3xl leading-relaxed text-zinc-300">
              {allQuestions[0]}
            </h2>
          </motion.div>
        )}

        {stage > 1 && stage < 15 && (
           <motion.div
            key="chaotic-qs"
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
           >
             {allQuestions.slice(1, Math.min(stage, allQuestions.length)).map((q, i) => {
               const c = chaoticQuestions[i];
               const isVisible = variant !== 'static' || Math.random() > 0.5; // Flicker for static
               return (
                 <motion.div
                   key={i}
                   className={`absolute text-2xl md:text-5xl font-serif mix-blend-difference drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                   style={{
                     top: c.top,
                     left: c.left,
                     rotate: c.rotate,
                   }}
                   initial={{ opacity: 0, scale: variant === 'drowning' ? 2 : 5, filter: 'blur(20px)' }}
                   animate={{ opacity: 1, scale: 1, filter: variant === 'drowning' ? 'blur(2px)' : 'blur(0px)' }}
                   transition={{ type: "spring", stiffness: variant === 'fever' ? 300 : 100 }}
                 >
                   {q}
                 </motion.div>
               );
             })}
           </motion.div>
        )}

        {stage >= 15 && (
          <motion.div
            key="diagnostics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 z-50 text-white"
          >
            <motion.h1
              animate={{ 
                scale: variant === 'fever' ? [1, 1.1, 1] : 1, 
                opacity: [0.9, 1, 0.9],
              }}
              transition={{ repeat: Infinity, duration: 0.1 }}
              className="text-5xl md:text-8xl font-black text-red-600 uppercase tracking-tighter"
            >
              DIAGNOSIS:
              <br />
              <span className="text-white">NIGHTTIME DREAD</span>
            </motion.h1>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 2 }}
               className="mt-12 space-y-4 font-mono max-w-lg text-left bg-black border border-red-900/50 p-8 shadow-[0_0_50px_rgba(255,0,0,0.1)]"
            >
               <p className="border-b border-red-900/50 pb-2 text-red-500 font-bold uppercase tracking-widest text-xs">Vitals Scanned ({variant})</p>
               <ul className="list-square pl-5 space-y-3 text-sm text-zinc-400 mt-4">
                 <li>Excessive rumination on past conversations</li>
                 <li>Phantom phone vibration syndrome</li>
                 <li>Romanticizing hypothetical futures that cannot exist</li>
               </ul>
               <div className="pt-6 mt-6 border-t border-red-900/50">
                  <p className="text-red-500 font-black animate-pulse">PROTOCOL: SLEEP.</p>
               </div>
            </motion.div>

             <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5 }}
                onClick={() => {
                  audioEngine.current?.stop();
                  setStage(0);
                }}
                className="mt-16 text-zinc-600 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors px-6 py-2 border-b border-zinc-800 hover:border-zinc-300"
             >
               Force Reboot
             </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

