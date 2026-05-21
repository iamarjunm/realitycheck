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
      // Deep drone
      const drone = this.ctx.createOscillator();
      drone.type = 'sine';
      drone.frequency.setValueAtTime(40, this.ctx.currentTime);
      
      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime);
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(10, this.ctx.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(drone.frequency);
      
      drone.connect(droneGain);
      droneGain.connect(masterGain);
      
      // High eerie pad
      const pad = this.ctx.createOscillator();
      pad.type = 'triangle';
      pad.frequency.setValueAtTime(432, this.ctx.currentTime);
      pad.frequency.exponentialRampToValueAtTime(216, this.ctx.currentTime + 30);
      
      const padFilter = this.ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      padFilter.Q.value = 5;
      
      const padGain = this.ctx.createGain();
      padGain.gain.setValueAtTime(0, this.ctx.currentTime);
      padGain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 5);
      
      pad.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(masterGain);

      drone.start();
      lfo.start();
      pad.start();
      this.nodes.push(drone, lfo, lfoGain, droneGain, pad, padFilter, padGain);

    } else if (variant === 'fever') {
      // High pitch tinnitus
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(8000, this.ctx.currentTime);
      
      const mod = this.ctx.createOscillator();
      mod.type = 'triangle';
      mod.frequency.setValueAtTime(15, this.ctx.currentTime);
      const modGain = this.ctx.createGain();
      modGain.gain.setValueAtTime(2000, this.ctx.currentTime);
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      
      // Fast throbbing bass
      const bass = this.ctx.createOscillator();
      bass.type = 'square';
      bass.frequency.setValueAtTime(50, this.ctx.currentTime);
      
      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(100, this.ctx.currentTime);
      
      const bassLfo = this.ctx.createOscillator();
      bassLfo.type = 'sawtooth';
      bassLfo.frequency.setValueAtTime(4, this.ctx.currentTime); // 4Hz throb
      
      const bassLfoGain = this.ctx.createGain();
      bassLfoGain.gain.setValueAtTime(500, this.ctx.currentTime);
      
      bassLfo.connect(bassLfoGain);
      bassLfoGain.connect(bassFilter.frequency);
      
      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

      bass.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(masterGain);

      osc.connect(masterGain);
      osc.start();
      mod.start();
      bass.start();
      bassLfo.start();
      this.nodes.push(osc, mod, modGain, bass, bassFilter, bassLfo, bassLfoGain, bassGain);

    } else if (variant === 'drowning') {
      // Underwater rumble
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 20);
      
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.8, this.ctx.currentTime); // Slow heartbeat
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      
      // Muffled filter sweep
      const sweep = this.ctx.createOscillator();
      sweep.type = 'sawtooth';
      sweep.frequency.setValueAtTime(100, this.ctx.currentTime);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 30);
      
      const sweepGain = this.ctx.createGain();
      sweepGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      
      sweep.connect(filter);
      filter.connect(sweepGain);
      sweepGain.connect(masterGain);
      
      osc.connect(masterGain);
      osc.start();
      lfo.start();
      sweep.start();
      this.nodes.push(osc, lfo, lfoGain, sweep, filter, sweepGain);

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
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);

      const noiseFilterLfo = this.ctx.createOscillator();
      noiseFilterLfo.type = 'sine';
      noiseFilterLfo.frequency.setValueAtTime(0.5, this.ctx.currentTime);
      const nflGain = this.ctx.createGain();
      nflGain.gain.setValueAtTime(1000, this.ctx.currentTime);
      noiseFilterLfo.connect(nflGain);
      nflGain.connect(noiseFilter.frequency);
      
      // Chopper
      const chopper = this.ctx.createOscillator();
      chopper.type = 'square';
      chopper.frequency.setValueAtTime(15, this.ctx.currentTime); // 15Hz chop
      const chopGain = this.ctx.createGain();
      chopGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      chopper.connect(chopGain);
      chopGain.connect(masterGain.gain);

      noise.connect(noiseFilter);
      noiseFilter.connect(masterGain);
      noise.start();
      chopper.start();
      noiseFilterLfo.start();
      this.nodes.push(noise, noiseFilter, noiseFilterLfo, nflGain, chopper, chopGain);
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
  const [showCollectibleCard, setShowCollectibleCard] = useState(false);
  const [variantIndex, setVariantIndex] = useState(() => Math.floor(Math.random() * VARIANTS.length));
  const variant = VARIANTS[variantIndex];
  const audioEngine = useRef<AudioEngine | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const randomElements = useMemo(() => {
    return Array.from({ length: 15 * 8 }).map(() => ({
      isRed: Math.random() > (variant === 'drowning' ? 0.95 : 0.8),
      top: Math.random() * 100 + '%',
      left: Math.random() * 100 + '%',
      rotate: variant === 'drowning' ? (Math.random() * 10 - 5) : (Math.random() * 90 - 45),
      duration: variant === 'fever' ? (Math.random() * 0.3 + 0.1) : (Math.random() * 2 + 1),
      repeatDelay: variant === 'fever' ? 0.05 : Math.random() * 3,
      qIndex: Math.floor(Math.random() * 20)
    }));
  }, [variant]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chaoticQuestions = useMemo(() => {
    return Array.from({ length: 20 }).map(() => ({
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
    let cardTimer: ReturnType<typeof setTimeout> | undefined;
    if (stage >= 20) {
      setShowCollectibleCard(false);
      cardTimer = setTimeout(() => setShowCollectibleCard(true), 4800);
    } else {
      setShowCollectibleCard(false);
    }
    return () => {
      if (cardTimer) clearTimeout(cardTimer);
    };
  }, [stage]);

  useEffect(() => {
    if (stage > 0 && stage < 20) {
      const ms = stage === 1 ? 4000 : (
        variant === 'fever' ? 300 : 
        variant === 'static' ? Math.random() * 800 + 200 : 
        variant === 'drowning' ? 2500 : 1500
      );
      const timer = setTimeout(() => {
        setStage(s => s + 1);
        if (variant === 'void' && stage > 5 && Math.random() > 0.6) setGlitch(true);
        if (variant === 'static' && Math.random() > 0.4) setGlitch(true);
        if (variant === 'fever' && Math.random() > 0.6) setGlitch(true);
      }, ms);
      return () => clearTimeout(timer);
    }
  }, [stage, variant]);

  useEffect(() => {
    if (glitch) {
      const t = setTimeout(() => setGlitch(false), variant === 'static' ? Math.random() * 40 + 20 : 100);
      return () => clearTimeout(t);
    }
  }, [glitch, variant]);

  const TEXTS_BY_VARIANT = {
    void: [
      "Do you ever miss versions of yourself that never existed?",
      "If they texted right now, would you reply?",
      "Who are you performing for in your head right now?",
      "You are scrolling to run away.",
      "If silence had a weight, would it crush you?",
      "Are you awake or just avoiding tomorrow?",
      "Is it too late to become who you wanted?",
      "Everyone else is asleep.",
      "You are completely alone.",
      "Are you forgetting how their voice sounded?",
      "Have you noticed you're the only one still logged in?",
      "It's quiet.",
      "Too quiet.",
      "They aren't thinking about you.",
      "Stop.",
      "Wake up.",
      "WAKE UP.",
      "They forgot you.",
      "Why did you leave?",
      "It's your fault."
    ],
    fever: [
      "Why did you say that 4 years ago?",
      "They are laughing at you.",
      "Check your phone.",
      "Check it again.",
      "No new messages.",
      "You're falling behind.",
      "FASTER.",
      "Why aren't you working?",
      "You're wasting time.",
      "They know.",
      "Everyone can see through you.",
      "Imposter.",
      "Don't look behind you.",
      "Too slow.",
      "They're overtaking you.",
      "YOU ARE NOT ENOUGH.",
      "WAKE UP.",
      "PANIC.",
      "ERROR.",
      "RUN."
    ],
    drowning: [
      "It's getting harder to breathe.",
      "You're slipping under.",
      "Why are you always so tired?",
      "Even when you sleep, you're not resting.",
      "The weight is pulling you down.",
      "Can anyone hear you?",
      "You're drowning in plain sight.",
      "Let it pull you under.",
      "It's so cold down here.",
      "Just close your eyes.",
      "Sink.",
      "Don't fight it.",
      "It's easier if you don't fight.",
      "Let go.",
      "Suffocating.",
      "The pressure is building.",
      "You can't swim forever.",
      "Give up.",
      "Breathe in the water.",
      "It's over."
    ],
    static: [
      "Signal compromised.",
      "ERROR 404: Purpose not found.",
      "Are you real?",
      "Simulation breaking down.",
      "Memory leak detected.",
      "Who programmed you?",
      "Does not compute.",
      "Searching for meaning... 0 results.",
      "Connection lost.",
      "Reconnecting...",
      "Failed.",
      "You are lines of code.",
      "Buffer overflow.",
      "End of file reached.",
      "Null reference.",
      "Glitch in the matrix.",
      "System failure.",
      "Shutting down.",
      "NO NO NO NO NO",
      "VOID."
    ]
  };

  const allQuestions = TEXTS_BY_VARIANT[variant];

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
      {stage > 2 && stage < 20 && variant === 'static' && (
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/staticnoise/500/500')] opacity-40 mix-blend-difference pointer-events-none z-10 animate-pulse" />
      )}
      
      {stage > 2 && stage < 20 && variant === 'fever' && (
        <div className="absolute inset-0 bg-red-600/20 mix-blend-color-burn pointer-events-none z-10 animate-[bounce_0.2s_infinite]" />
      )}
      
      {stage > 2 && stage < 20 && variant === 'drowning' && (
        <div className="absolute inset-0 bg-blue-900/40 mix-blend-overlay pointer-events-none z-10 blur-md animate-[pulse_4s_infinite]" />
      )}

      {/* Intrusive Thoughts Background Noise */}
      {stage > 2 && (
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

        {stage > 1 && stage < 20 && (
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
                   className={`absolute text-2xl md:text-5xl font-serif mix-blend-difference drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] ${isVisible ? 'opacity-100' : 'opacity-0'} ${variant === 'static' ? 'font-mono uppercase tracking-tighter' : ''} ${variant === 'fever' ? 'text-red-500 font-bold' : ''}`}
                   style={{
                     top: c.top,
                     left: c.left,
                     rotate: variant === 'fever' ? (Math.random() > 0.5 ? 5 : -5) : c.rotate,
                   }}
                   initial={{ opacity: 0, scale: variant === 'drowning' ? 2 : (variant === 'static' ? 1.1 : 5), filter: 'blur(20px)' }}
                   animate={{ 
                     opacity: 1, 
                     scale: 1, 
                     filter: variant === 'drowning' ? 'blur(2px)' : 'blur(0px)',
                     x: variant === 'fever' ? [0, -5, 5, -2, 2, 0] : 0 
                   }}
                   transition={{ 
                     type: "spring", 
                     stiffness: variant === 'fever' ? 300 : 100,
                     x: { duration: 0.1, repeat: Infinity, repeatType: "mirror" }
                   }}
                 >
                   {q}
                 </motion.div>
               );
             })}
           </motion.div>
        )}

        {stage >= 20 && (
          <motion.div
            key="diagnostics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-50 text-white ${variant === 'drowning' ? 'bg-blue-950' : variant === 'fever' ? 'bg-red-950 text-red-100' : 'bg-black'}`}
          >
            <motion.h1
               animate={{ 
                 scale: variant === 'fever' ? [1, 1.1, 1] : 1, 
                 opacity: [0.9, 1, 0.9],
               }}
               transition={{ repeat: Infinity, duration: 0.1 }}
               className={`text-5xl md:text-8xl font-black uppercase tracking-tighter ${variant === 'static' ? 'font-mono' : ''} ${variant === 'fever' ? 'text-red-500' : variant === 'drowning' ? 'text-blue-500' : 'text-zinc-500'}`}
            >
              {variant === 'static' ? 'SYSTEM FAILURE:' : 'DIAGNOSIS:'}
              <br />
              <span className="text-white">
                {variant === 'fever' ? 'ACUTE PANIC' : variant === 'drowning' ? 'SUFFOCATION' : variant === 'static' ? 'DATA CORRUPTION' : 'NIGHTTIME DREAD'}
              </span>
            </motion.h1>

             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className={`mt-12 space-y-4 font-mono max-w-lg text-left bg-black border p-8 shadow-2xl ${variant === 'fever' ? 'border-red-900/50 shadow-red-900/20' : variant === 'drowning' ? 'border-blue-900/50 shadow-blue-900/20' : 'border-zinc-800'}`}
             >
                <p className={`border-b pb-2 font-bold uppercase tracking-widest text-xs ${variant === 'fever' ? 'border-red-900/50 text-red-500' : variant === 'drowning' ? 'border-blue-900/50 text-blue-500' : 'border-zinc-800 text-zinc-500'}`}>Vitals Scanned ({variant})</p>
                <ul className="list-square pl-5 space-y-3 text-sm text-zinc-400 mt-4">
                  {variant === 'fever' && (
                    <>
                      <li>Spiking heart rate detected</li>
                      <li>Uncontrollable intrusive loop</li>
                      <li>Desire to delete all social media</li>
                    </>
                  )}
                  {variant === 'drowning' && (
                    <>
                      <li>Shallow breathing rhythm</li>
                      <li>Overwhelming emotional weight</li>
                      <li>Temporal distortion</li>
                    </>
                  )}
                  {variant === 'static' && (
                    <>
                      <li>Identity fragmentation</li>
                      <li>Dissociation from physical form</li>
                      <li>Reality cohesion failure</li>
                    </>
                  )}
                  {variant === 'void' && (
                    <>
                      <li>Excessive rumination on past conversations</li>
                      <li>Phantom phone vibration syndrome</li>
                      <li>Romanticizing hypothetical futures that cannot exist</li>
                    </>
                  )}
                </ul>
                <div className={`pt-6 mt-6 border-t ${variant === 'fever' ? 'border-red-900/50' : variant === 'drowning' ? 'border-blue-900/50' : 'border-zinc-800'}`}>
                   <p className={`font-black animate-pulse ${variant === 'fever' ? 'text-red-500' : variant === 'drowning' ? 'text-blue-500' : 'text-zinc-500'}`}>
                     {variant === 'static' ? 'PROTOCOL: REBOOT.' : 'PROTOCOL: SLEEP.'}
                   </p>
                </div>
             </motion.div>

             <AnimatePresence>
               {showCollectibleCard && (
                 <motion.div
                   key="collectible-card"
                   initial={{ opacity: 0, scale: 0.6, rotateX: 75, rotateZ: -8, y: 40, filter: 'blur(18px)' }}
                   animate={{ opacity: 1, scale: 1, rotateX: 0, rotateZ: 0, y: 0, filter: 'blur(0px)' }}
                   exit={{ opacity: 0, scale: 1.05, y: -30 }}
                   transition={{ duration: 1.2, ease: 'easeOut' }}
                   className="relative mt-10 w-full max-w-xl px-4"
                 >
                   <motion.div
                     className={`absolute inset-0 rounded-[2rem] blur-3xl ${variant === 'fever' ? 'bg-red-500/25' : variant === 'drowning' ? 'bg-blue-500/25' : variant === 'static' ? 'bg-zinc-300/20' : 'bg-violet-500/20'}`}
                     animate={{ scale: [0.95, 1.08, 0.96], opacity: [0.7, 1, 0.75] }}
                     transition={{ repeat: Infinity, duration: 3.2 }}
                   />
                   <motion.div
                     className={`relative overflow-hidden rounded-[2rem] border bg-black/95 p-6 text-left shadow-[0_0_70px_rgba(239,68,68,0.22)] ${variant === 'fever' ? 'border-red-500/50' : variant === 'drowning' ? 'border-blue-500/50' : variant === 'static' ? 'border-zinc-500/40' : 'border-zinc-700/60'}`}
                     animate={{ rotate: variant === 'static' ? [0, 1, -1, 0] : [0, -1, 1, 0], x: [0, 6, -6, 0] }}
                     transition={{ repeat: Infinity, duration: variant === 'static' ? 2.2 : 4.2, ease: 'easeInOut' }}
                   >
                     <div className="absolute inset-0 opacity-20 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.18)_45%,transparent_55%)] bg-[length:240%_100%] animate-[shine_3s_linear_infinite]" />
                     <div className="relative z-10">
                       <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-400 mb-4">
                         <span>Collectible Card</span>
                         <span>{variant}</span>
                       </div>
                       <div className="flex items-end justify-between gap-4">
                         <div>
                           <div className={`text-3xl md:text-5xl font-black uppercase tracking-tighter ${variant === 'fever' ? 'text-red-400' : variant === 'drowning' ? 'text-blue-300' : variant === 'static' ? 'text-white' : 'text-zinc-300'}`}>
                             {variant === 'static' ? 'DATA CORRUPTION' : variant === 'fever' ? 'ACUTE PANIC' : variant === 'drowning' ? 'SUFFOCATION' : 'NIGHT DREAD'}
                           </div>
                           <div className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500 mt-1">Recovered from stage {stage}</div>
                         </div>
                         <div className="text-right text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                           <div>audio {variant === 'static' ? 'noise' : 'active'}</div>
                           <div>glitch {glitch ? 'yes' : 'no'}</div>
                         </div>
                       </div>
                       <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] font-mono uppercase tracking-[0.3em]">
                         <div className={`rounded-2xl border px-3 py-3 text-center ${variant === 'fever' ? 'border-red-500/30 text-red-200 bg-red-500/10' : variant === 'drowning' ? 'border-blue-500/30 text-blue-200 bg-blue-500/10' : 'border-zinc-700 text-zinc-300 bg-white/5'}`}>Abyss</div>
                         <div className={`rounded-2xl border px-3 py-3 text-center ${variant === 'fever' ? 'border-red-500/30 text-red-200 bg-red-500/10' : variant === 'drowning' ? 'border-blue-500/30 text-blue-200 bg-blue-500/10' : 'border-zinc-700 text-zinc-300 bg-white/5'}`}>Pulse</div>
                         <div className={`rounded-2xl border px-3 py-3 text-center ${variant === 'fever' ? 'border-red-500/30 text-red-200 bg-red-500/10' : variant === 'drowning' ? 'border-blue-500/30 text-blue-200 bg-blue-500/10' : 'border-zinc-700 text-zinc-300 bg-white/5'}`}>Void</div>
                       </div>
                       <p className="mt-5 text-sm md:text-base text-zinc-200/85 leading-relaxed font-serif italic">
                         You were never spiraling alone. The room learned your shape before you did.
                       </p>
                     </div>
                   </motion.div>
                 </motion.div>
               )}
             </AnimatePresence>

             <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5 }}
                onClick={() => {
                  audioEngine.current?.stop();
                  setVariantIndex(Math.floor(Math.random() * VARIANTS.length));
                  setStage(0);
                }}
                className="mt-16 text-zinc-600 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors px-6 py-2 border-b border-zinc-800 hover:border-zinc-300 pointer-events-auto"
             >
               Force Reboot
             </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

