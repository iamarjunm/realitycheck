/* eslint-disable react-hooks/purity, react/no-unescaped-entities */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Profiler({ setActiveTab }: { setActiveTab?: (tab: 'profiler' | 'typing' | 'brain' | 'situationship') => void }) {
  const [phase, setPhase] = useState<'intro' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'analyzing' | 'result'>('intro');
  const [mouseData, setMouseData] = useState({ x: 0, y: 0, hesitation: 0, speed: 0 });
  const [trajectory, setTrajectory] = useState<{x: number, y: number}[]>([]);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fakeCamera, setFakeCamera] = useState(true);
  const [fakeClones, setFakeClones] = useState<{x: number, y: number}[]>([]);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0, time: 0 });
  const [startTime] = useState(Date.now());
  const [selectionCount, setSelectionCount] = useState(0);
  const [resultStep, setResultStep] = useState(0);
  const [showCollectibleCard, setShowCollectibleCard] = useState(false);
  const [traumaValue, setTraumaValue] = useState(0);
  const [impressName, setImpressName] = useState('');
  const [shakeInt, setShakeInt] = useState(0);

  useEffect(() => {
    let hesitationTimer: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      const dt = now - lastPos.time;
      const speed = dt > 0 ? Math.round((Math.sqrt(dx * dx + dy * dy) / dt) * 100) : 0;
      
      setMouseData((prev) => ({ ...prev, x: e.clientX, y: e.clientY, speed }));
      setLastPos({ x: e.clientX, y: e.clientY, time: now });

      if (Math.random() > 0.8) {
        setTrajectory(prev => [...prev, { x: e.clientX, y: e.clientY }].slice(-500));
      }

      clearTimeout(hesitationTimer);
      hesitationTimer = setTimeout(() => {
        setMouseData((prev) => ({ ...prev, hesitation: prev.hesitation + 1 }));
      }, 250); 
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hesitationTimer);
    };
  }, [lastPos]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitches(t => t + 1);
    };
    const handleSelection = () => {
      if (window.getSelection()?.toString().length) setSelectionCount(s => s + 1);
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("selectionchange", handleSelection);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, []);

  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => setFakeCamera(false), 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleNext = (nextPhase: typeof phase) => {
    setPhase(nextPhase);
  };

  useEffect(() => {
    if (phase === 'analyzing') {
      const t = setTimeout(() => setPhase('result'), 6000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'result') {
      setShowCollectibleCard(false);
      const t1 = setTimeout(() => setResultStep(1), 4000);
      const t2 = setTimeout(() => setResultStep(2), 8500);
      const t3 = setTimeout(() => setResultStep(3), 13000);
      const t4 = setTimeout(() => setResultStep(4), 16000);
      const t5 = setTimeout(() => setResultStep(5), 20500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
    }
  }, [phase]);

  const runAway = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.target as HTMLButtonElement;
    const x = (Math.random() > 0.5 ? 1 : -1) * (50 + Math.random() * 100);
    const y = (Math.random() > 0.5 ? 1 : -1) * (50 + Math.random() * 100);
    target.style.transform = `translate(${x}px, ${y}px)`;
    
    if (fakeClones.length < 5) {
      setFakeClones(prev => [...prev, { x: e.clientX + x/2, y: e.clientY + y/2 }]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center flex-grow p-4 min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 font-mono relative overflow-hidden"
      style={shakeInt > 0 ? { filter: `drop-shadow(${(Math.random() - 0.5) * (shakeInt / 3)}px ${(Math.random() - 0.5) * (shakeInt / 3)}px 0px rgba(255,0,0,0.5))` } : {}}
      onMouseMove={() => {
        if (shakeInt > 0 && Math.random() > 0.5) {
          setShakeInt(prev => prev > 0 ? prev : 0); // Force re-render to shake
        }
      }}
    >
      {/* Background Trajectory Canvas (Only in analyzing/result) */}
      <AnimatePresence>
        {(phase === 'analyzing' || phase === 'result') && (
          <motion.svg
             initial={{ opacity: 0 }}
             animate={{ opacity: 0.15 }}
             className="absolute inset-0 w-full h-full pointer-events-none z-0"
          >
            <polyline
              points={trajectory.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              className="path-draw"
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Creepy metadata tracking display */}
      <div className="absolute top-4 left-4 text-[9px] md:text-[10px] text-red-500/50 flex flex-col gap-1 tracking-widest pointer-events-none z-50 mix-blend-screen">
        <span>[SYS.NET.OBSERVER]</span>
        <span>SES_DUR: {Math.floor((Date.now() - startTime) / 1000)}s</span>
        <span>POS_X: {mouseData.x.toString().padStart(4, '0')}</span>
        <span>POS_Y: {mouseData.y.toString().padStart(4, '0')}</span>
        <span>VELOCITY: {mouseData.speed}px/ms</span>
        <span>HESITATION_INDEX: {mouseData.hesitation}</span>
        <span>FOCUS_BREAKS: {tabSwitches}</span>
        {selectionCount > 0 && <span>TEXT_SELECTION_DETECTED: {selectionCount}</span>}
        {tabSwitches > 0 && <span className="text-red-500 font-bold animate-pulse mt-2">EVASION TACTICS DETECTED</span>}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            className="text-center max-w-lg z-10"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              This Website Knows Too Much About You
            </h1>
            
            <div className="h-12 mb-8">
              {fakeCamera ? (
                <div className="text-red-500 text-xs animate-pulse font-bold tracking-widest border border-red-500/30 p-2 inline-block">
                  REQUESTING WEBCAM ACCESS...
                </div>
              ) : (
                <div className="text-zinc-500 text-xs tracking-widest flex flex-col gap-1">
                  <span className="line-through text-red-900">WEBCAM BYPASSED</span>
                  <span className="text-zinc-300">EXTRACTING KINETIC PSYCHOMETRICS INSTEAD...</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleNext('q1')}
              disabled={fakeCamera}
              className={`px-8 py-4 uppercase tracking-widest font-black transition-all duration-500 ${
                fakeCamera 
                  ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-red-600 hover:text-white hover:scale-105'
              }`}
            >
              Begin Extraction
            </button>
          </motion.div>
        )}

        {phase === 'q1' && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center space-y-12 z-10"
          >
            <h2 className="text-2xl md:text-5xl font-serif italic text-zinc-100 max-w-2xl">
              Are you proud of the person you become when no one is watching?
            </h2>
            <div className="flex gap-6 w-full justify-center relative h-32 items-center">
              <button
                onMouseEnter={runAway}
                onClick={runAway}
                className="px-10 py-4 border-2 border-red-900/50 text-red-500 hover:text-red-400 font-bold absolute right-1/2 transition-all duration-300 ease-out z-20 bg-zinc-950 translate-x-[150%]"
              >
                Yes
              </button>
              
              <button
                onClick={() => handleNext('q2')}
                className="px-10 py-4 border-2 border-zinc-700 hover:bg-white hover:text-black hover:border-white transition-colors font-bold z-20 bg-zinc-950 ml-32"
              >
                No
              </button>

              {/* Fake Clones */}
              {fakeClones.map((pos, i) => (
                <button
                  key={i}
                  style={{ top: pos.y % 100, left: pos.x % 100 }}
                  className="px-10 py-4 border-2 border-red-900/20 text-red-900/50 font-bold absolute pointer-events-none data-fake"
                >
                  Yes
                </button>
              ))}
            </div>
            {fakeClones.length > 2 && (
              <motion.div initial={{opacity:0}} animate={{opacity: 1}} className="text-xs text-red-500 tracking-widest mt-8 uppercase">
                Stop lying to yourself. Just click 'No'.
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'q2' && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center space-y-12 z-10"
          >
            <h2 className="text-3xl md:text-5xl font-serif italic text-white">
              When someone says <span className="text-red-500 border-b border-red-500">"we need to talk"</span>
            </h2>
            <p className="text-zinc-400 font-mono text-sm tracking-widest uppercase">How many disasters do you invent in 10 seconds?</p>
            
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {[
                { label: 'One. I wait for facts.', isLie: true },
                { label: 'A few possibilities.', isLie: true },
                { label: 'Every possible timeline where they leave me.', isLie: false },
              ].map((ans, i) => (
                <button
                  key={i}
                  onClick={() => handleNext('q3')}
                  className="px-6 py-4 bg-zinc-900/80 hover:bg-white hover:text-black border border-zinc-800 text-sm tracking-wide text-left transition-all group relative overflow-hidden"
                >
                  <span className="relative z-10 font-bold">{ans.label}</span>
                  {ans.isLie && (
                     <div className="absolute inset-0 bg-red-600 translate-x-[100%] group-hover:translate-x-0 transition-transform duration-300 flex items-center justify-end px-4 z-20">
                       <span className="text-white font-black tracking-widest italic text-xs">LIE DETECTED</span>
                     </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        
        {phase === 'q3' && (
          <motion.div
            key="q3"
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="flex flex-col items-center text-center space-y-12 z-10"
          >
            <h2 className="text-4xl font-serif italic text-white flex flex-col gap-4">
              <span>What is your actual fear?</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
              <button onClick={() => handleNext('q4')} className="py-12 border border-zinc-800 hover:bg-zinc-100 hover:text-black uppercase tracking-widest text-xs font-bold transition-colors">Being completely perceived</button>
              <button onClick={() => handleNext('q4')} className="py-12 border border-zinc-800 hover:bg-zinc-100 hover:text-black uppercase tracking-widest text-xs font-bold transition-colors">Being utterly ignored</button>
              <button onClick={() => handleNext('q4')} className="py-12 border border-zinc-800 hover:bg-zinc-100 hover:text-black uppercase tracking-widest text-xs font-bold transition-colors">Being as ordinary as you suspect</button>
              <button onClick={() => handleNext('q4')} className="py-12 border border-zinc-800 hover:bg-zinc-100 hover:text-black uppercase tracking-widest text-xs font-bold transition-colors">Dying before you do anything that matters</button>
            </div>
          </motion.div>
        )}

        {phase === 'q4' && (
          <motion.div
            key="q4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            className="flex flex-col items-center text-center space-y-16 z-10"
          >
            <div className="text-red-500 font-bold uppercase tracking-widest text-xs animate-pulse border border-red-500 p-2">
              CRITICAL INQUIRY
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Are you pretending <br/> to be okay?
            </h2>
            
            <div className="flex w-full max-w-sm gap-4">
              {/* Both buttons randomly swap text to confuse user */}
              <button 
                onClick={() => handleNext('q5')} 
                className="flex-1 py-6 bg-white text-black font-black uppercase text-xl hover:bg-red-600 hover:text-white transition-colors"
                onMouseEnter={(e) => { e.currentTarget.innerText = Math.random() > 0.5 ? "YES" : "NO"; }}
              >
                YES
              </button>
              <button 
                onClick={() => handleNext('q5')} 
                className="flex-1 py-6 bg-transparent border-2 border-white text-white font-black uppercase text-xl hover:bg-red-600 hover:border-red-600 transition-colors"
                onMouseEnter={(e) => { e.currentTarget.innerText = Math.random() > 0.5 ? "NO" : "YES"; }}
              >
                NO
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'q5' && (
          <motion.div
            key="q5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex flex-col items-center text-center space-y-12 z-10 w-full max-w-2xl px-4"
          >
            <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight">
              If your browser history was published right now, how long would it take for the people who love you to stop?
            </h2>
            <div className="flex flex-col w-full gap-3 font-mono text-sm uppercase">
              <button onClick={() => handleNext('q6')} className="py-4 border border-zinc-800 hover:bg-zinc-800 transition-colors">They already know I'm awful</button>
              <button onClick={() => handleNext('q6')} className="py-4 border border-zinc-800 hover:bg-zinc-800 transition-colors text-red-500 hover:text-red-400">Instantly</button>
              <button onClick={() => handleNext('q6')} className="py-4 border border-zinc-800 hover:bg-zinc-800 transition-colors">They'd just be confused</button>
              <button onClick={() => handleNext('q6')} className="py-4 border border-zinc-800 hover:bg-zinc-800 transition-colors opacity-50 hover:opacity-100">I use incognito for my real self</button>
            </div>
          </motion.div>
        )}

        {phase === 'q6' && (
          <motion.div
            key="q6"
            initial={{ opacity: 0, filter: 'blur(5px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
            className="flex flex-col items-center text-center space-y-12 z-10 w-full max-w-3xl px-4"
          >
            <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-zinc-500 pb-2 mb-4">
              Structural Assessment
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white leading-none mix-blend-difference">
              Do you actually want to change, or do you just want to complain about who you are?
            </h2>
            <div className="flex gap-4 items-center justify-center relative w-full h-64">
              <button 
                onClick={() => handleNext('q7')} 
                className="w-48 h-48 rounded-full bg-red-600 hover:bg-white hover:text-red-600 text-white font-black text-2xl uppercase transition-all duration-300 transform hover:scale-110 flex items-center justify-center p-4 absolute z-10"
              >
                Complain
              </button>
              
              <button 
                onMouseEnter={(e) => {
                  const target = e.currentTarget;
                  target.style.transform = `translate(${(Math.random() - 0.5) * 300}px, ${(Math.random() - 0.5) * 300}px) scale(0.5)`;
                  target.innerText = "Too hard";
                }}
                onClick={() => handleNext('q7')} 
                className="w-24 h-12 rounded-full border border-white text-white/50 text-xs uppercase transition-all duration-500 absolute z-0 left-0 hover:text-red-500 hover:border-red-500"
              >
                Change
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'q7' && (
          <motion.div
            key="q7"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="flex flex-col items-center text-center space-y-12 z-10 w-full max-w-4xl px-4"
            style={traumaValue > 50 ? { filter: `blur(${(traumaValue - 50) / 10}px) contrast(${1 + traumaValue / 50})` } : {}}
          >
            <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight flex flex-col gap-4">
              <span>How much of your "personality"</span>
              <span className="text-red-500 italic">is just an untreated trauma response?</span>
            </h2>
            
            <div className="w-full max-w-xl flex flex-col gap-8 relative mt-12">
               <span className="text-[200px] font-black text-white/5 absolute -top-32 left-1/2 -translate-x-1/2 pointer-events-none">{traumaValue}%</span>
               <input 
                 type="range" 
                 min="0" max="100" 
                 value={traumaValue} 
                 onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setTraumaValue(v);
                    if (v > 50) {
                      setShakeInt(v - 50);
                    } else {
                      setShakeInt(0);
                    }
                 }}
                 className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer z-10"
                 style={{ accentColor: 'red' }}
               />
               
               <div className="flex justify-between w-full text-xs font-mono text-zinc-500 uppercase">
                 <span>"I'm just quirky" (0%)</span>
                 <span>"I need help" (100%)</span>
               </div>
               
               <AnimatePresence>
                 {traumaValue > 80 && (
                   <motion.button 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     onClick={() => handleNext('q8')} 
                     className="mt-8 py-4 px-8 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white uppercase font-black tracking-widest text-xl transition-colors mx-auto"
                   >
                     Admit It
                   </motion.button>
                 )}
               </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === 'q8' && (
          <motion.div
            key="q8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="flex flex-col items-center text-center space-y-12 z-10 w-full max-w-2xl px-4"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
              Type the name of the person you are <span className="italic line-through decoration-red-500 decoration-4">still trying to impress</span>.
            </h2>
            
            <div className="relative w-full">
              <input
                 type="text"
                 value={impressName}
                 onChange={(e) => {
                    let val = e.target.value;
                    const scramble = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
                    if (val.length > impressName.length && Math.random() > 0.3) {
                       val = val.substring(0, val.length - 1) + scramble[Math.floor(Math.random() * scramble.length)];
                    }
                    setImpressName(val);
                 }}
                 placeholder="Their Name"
                 className="w-full bg-transparent border-b-2 border-zinc-700 text-center text-4xl md:text-6xl font-black uppercase tracking-widest py-4 text-white focus:outline-none focus:border-red-500 focus:text-red-500 transition-colors"
                 style={{
                   textShadow: impressName.length > 3 ? `${Math.random() * 5}px ${Math.random() * 5}px 0px rgba(255,0,0,0.5)` : 'none'
                 }}
              />
              {impressName.length > 0 && (
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-4 animate-pulse">
                  They aren't looking.
                </div>
              )}
            </div>
            
            <AnimatePresence>
               {impressName.length > 3 && (
                 <motion.button 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   onClick={() => handleNext('analyzing')} 
                   className="py-4 px-12 bg-white text-black hover:bg-black hover:text-white border border-white uppercase font-bold tracking-widest text-sm transition-all"
                 >
                   Let Them Go
                 </motion.button>
               )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center space-y-12 text-white z-10 w-full min-h-[50vh]"
          >
            <div className="text-center font-mono space-y-2">
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.2, repeat: Infinity }}
                className="text-7xl font-black text-red-600 mb-8"
              >
                PROCESSING
              </motion.div>
              
              <div className="text-xs tracking-widest space-y-3 bg-black/80 p-8 border border-red-900/50 backdrop-blur-md">
                <div className="text-left w-full max-w-md">
                  <span className="text-red-500">{"> "}</span>COMPILING KINETIC PROFILE... [OK]
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-left w-full max-w-md">
                   <span className="text-red-500">{"> "}</span>ANALYZING HESITATION DURATION: <span className="font-bold text-white">{mouseData.hesitation * 250}ms</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} className="text-left w-full max-w-md">
                   <span className="text-red-500">{"> "}</span>ATTENTION FRACTURES: <span className="font-bold text-white">{tabSwitches}</span> ESCAPES
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }} className="text-left w-full max-w-md">
                   <span className="text-red-500">{"> "}</span>MAPPING SUBCONSCIOUS TRAJECTORY... <span className="font-bold text-white">{trajectory.length} DATA POINTS</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.8 }} className="text-left w-full max-w-md text-red-400 font-bold">
                   <span className="text-red-500">{"> "}</span>EXTRACTING CORE INSECURITY...
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden pointer-events-auto"
          >
            <div className="absolute top-8 text-red-700/50 text-[10px] tracking-widest font-mono z-0">
                 CONFIDENCE: 99.9% | HES: {mouseData.hesitation} | ESC: {tabSwitches}
            </div>

            <AnimatePresence mode="wait">
              {resultStep === 0 && (
                <motion.div
                  key="r0"
                  initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="text-zinc-200 text-3xl md:text-5xl font-serif italic max-w-3xl text-center px-6 leading-relaxed relative"
                >
                  <span className="text-red-900 font-black not-italic absolute -top-16 left-1/2 -translate-x-1/2 text-2xl font-mono">01.</span>
                  You rehearse arguments in the shower because you need to win interactions that haven't even happened.
                </motion.div>
              )}
              {resultStep === 1 && (
                <motion.div
                  key="r1"
                  initial={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(30px)', scale: 0.5 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="text-zinc-400 text-3xl md:text-6xl font-serif italic max-w-3xl text-center px-6 leading-relaxed relative"
                >
                  <span className="text-red-900 font-black not-italic absolute -top-16 left-1/2 -translate-x-1/2 text-2xl font-mono">02.</span>
                  You desperately crave attention... <br/><br/><span className="text-white">but the moment you actually receive it, you panic and retreat.</span>
                </motion.div>
              )}
              {resultStep === 2 && (
                <motion.div
                  key="r2"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="text-red-500 text-4xl md:text-7xl font-sans font-black tracking-tighter max-w-5xl text-center px-6 leading-none relative uppercase"
                >
                  <span className="text-red-900 font-black absolute -top-16 left-1/2 -translate-x-1/2 text-2xl font-mono tracking-widest">03.</span>
                  You check notifications hoping for one specific person. <br/><br/><span className="text-zinc-700 italic font-serif capitalize text-3xl md:text-5xl tracking-normal">Everyone else is just noise.</span>
                </motion.div>
              )}
              {resultStep === 3 && (
                <motion.div
                   key="r3"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="text-center z-10"
                >
                   <div className="text-white text-4xl md:text-6xl font-black uppercase mb-8 border border-white p-4">PROFILE EXTRACTED.</div>
                   {tabSwitches > 0 && (
                     <div className="text-red-500 font-mono tracking-widest animate-pulse mt-4">And changing tabs {tabSwitches} times didn't save you.</div>
                   )}
                </motion.div>
              )}
              
              {resultStep === 4 && (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, scale: 0.7, rotateX: 70, rotateZ: -10, filter: 'blur(16px)' }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0, rotateZ: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="relative w-full max-w-[460px] px-4"
                >
                  <motion.div
                    className="absolute inset-0 rounded-[2rem] bg-cyan-500/20 blur-3xl"
                    animate={{ scale: [0.9, 1.05, 0.92], opacity: [0.6, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 3.5 }}
                  />
                  <motion.div
                    className="relative overflow-hidden rounded-[2rem] border border-cyan-300/50 bg-[#04131a] p-6 text-left shadow-[0_0_60px_rgba(34,211,238,0.28)]"
                    animate={{ rotate: [-1.5, 1.5, -1.5], y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                  >
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.18)_45%,transparent_55%)] bg-[length:220%_100%] animate-[shine_3s_linear_infinite]" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-cyan-200/70">Collectible Dossier</span>
                        <span className="text-[10px] font-mono tracking-widest text-cyan-100/60">RC-OBS-014</span>
                      </div>
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-20 h-20 rounded-full border border-cyan-300/50 bg-cyan-400/10 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.25)]">
                          <div className="w-10 h-10 rounded-full border-4 border-cyan-300 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-cyan-100 text-2xl font-black tracking-tight uppercase">KINETIC PARANOIA</div>
                          <div className="text-cyan-200/60 text-xs font-mono uppercase tracking-[0.25em]">Archived motion signature</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs font-mono uppercase tracking-widest">
                        <div className="rounded-xl border border-cyan-300/20 bg-black/30 p-3 text-cyan-100">Hesitation {mouseData.hesitation * 250}ms</div>
                        <div className="rounded-xl border border-cyan-300/20 bg-black/30 p-3 text-cyan-100">Escapes {tabSwitches}</div>
                        <div className="rounded-xl border border-cyan-300/20 bg-black/30 p-3 text-cyan-100 col-span-2">Trajectory points {trajectory.length}</div>
                      </div>
                      <p className="mt-5 text-sm text-cyan-50/80 leading-relaxed font-serif italic">
                        You do not enter a room. You arrive as a pattern, and the pattern was already tracked.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {resultStep >= 5 && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-950 p-4 overflow-hidden z-20"
                >
                  <motion.h3 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="text-red-500 font-mono tracking-widest uppercase mb-4 md:mb-12 animate-pulse text-xs sm:text-sm absolute top-12"
                  >
                    Select Your Next Torment
                  </motion.h3>
                  
                  <div className="relative w-full max-w-[300px] h-[400px] md:max-w-none md:w-[800px] md:h-[500px] flex items-center justify-center">
                    
                    {/* Situationship Card */}
                    <motion.button 
                      initial={{ scale: 0, rotate: -20, x: -500 }}
                      animate={{ scale: 1, rotate: -10, x: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : -250 }}
                      whileHover={{ scale: 1.05, rotate: -5, zIndex: 30 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.8 }}
                      onClick={() => setActiveTab?.('situationship')} 
                      className="absolute group w-64 h-80 md:w-80 md:h-96 border border-pink-900/40 bg-rose-950 hover:bg-rose-900 shadow-2xl p-6 flex flex-col items-center justify-center overflow-hidden z-10 origin-bottom rounded-2xl"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,100,150,0.2),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="relative z-10 flex flex-col items-center gap-4 text-rose-200">
                        <span className="text-3xl md:text-5xl font-serif italic text-center leading-tight">Situation-<br/>ship</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 mt-4 border-t border-rose-800 pt-4 w-full text-center">Hyper-realistic ghosting</span>
                      </div>
                    </motion.button>

                    {/* Typing Test Card */}
                    <motion.button 
                      initial={{ scale: 0, rotate: 20, x: 500 }}
                      animate={{ scale: 1, rotate: 10, x: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 250 }}
                      whileHover={{ scale: 1.05, rotate: 5, zIndex: 30 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.6 }}
                      onClick={() => setActiveTab?.('typing')} 
                      className="absolute group w-64 h-80 md:w-80 md:h-96 border border-zinc-800 bg-white hover:bg-red-600 shadow-2xl p-6 flex flex-col items-center justify-center overflow-hidden z-20 origin-bottom rounded-2xl"
                    >
                      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/type/200/300')] opacity-5 group-hover:opacity-20 mix-blend-multiply transition-opacity duration-500" />
                      <div className="relative z-10 flex flex-col items-center gap-4 text-black group-hover:text-white transition-colors duration-300">
                        <span className="text-4xl md:text-6xl font-black uppercase tracking-tighter mix-blend-difference leading-none">Typing <br/>Test</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-80 mt-4 border-t border-black/20 group-hover:border-white/20 pt-4 w-full text-center">Measure your anxiety</span>
                      </div>
                    </motion.button>
                    
                    {/* 3 AM Brain Card (Center) */}
                    <motion.button 
                      initial={{ scale: 0, y: 300 }}
                      animate={{ scale: 1, y: 0, rotate: 0 }}
                      whileHover={{ scale: 1.1, zIndex: 40 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 1 }}
                      onClick={() => setActiveTab?.('brain')} 
                      className="absolute group w-64 h-80 md:w-80 md:h-96 border-2 border-zinc-700 bg-black hover:border-white shadow-[0_0_50px_rgba(0,0,0,1)] p-6 flex flex-col items-center justify-center overflow-hidden z-30 rounded-2xl"
                    >
                      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/void/500/500')] opacity-30 group-hover:opacity-60 mix-blend-screen transition-opacity duration-1000 bg-cover scale-150 group-hover:scale-100" />
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <span className="text-5xl md:text-7xl font-serif italic text-zinc-300 group-hover:text-white transition-colors duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] leading-none text-center">3 AM<br/>Brain</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 group-hover:text-zinc-200 mt-4 border-t border-zinc-800 pt-4 w-full text-center">Existential Dread</span>
                      </div>
                    </motion.button>

                  </div>
                  
                  <motion.button 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    onClick={() => {
                      setPhase('intro');
                      setResultStep(0);
                      setTrajectory([]);
                      setMouseData({ x: 0, y: 0, hesitation: 0, speed: 0 });
                      setTabSwitches(0);
                      setFakeClones([]);
                    }} 
                    className="absolute bottom-8 text-zinc-600 hover:text-white font-mono text-[10px] uppercase tracking-widest border-b border-zinc-900 hover:border-white pb-1 transition-colors"
                  >
                    [ Scrub Data & Restart Sequence ]
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

