/* eslint-disable react-hooks/purity, react/no-unescaped-entities */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const TARGET_TEXT = "The quick brown fox jumps over the lazy dog. But honestly, why are you typing this? There are a million other things you could be doing right now. Are you trying to prove something? You keep checking your speed, hoping you're above average. It's just a test. Just type the letters. Stop overthinking the punctuation. Stop trying to be perfect.";

export function TypingTest() {
  const [phase, setPhase] = useState<'intro' | 'typing' | 'judging' | 'result'>('intro');
  const [input, setInput] = useState('');
  const [backspaces, setBackspaces] = useState(0);
  const [charsTyped, setCharsTyped] = useState(0);
  const [lastKeystrokeTime, setLastKeystrokeTime] = useState<number>(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [judgmentMsg, setJudgmentMsg] = useState<string | null>(null);
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const [stress, setStress] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let interval: any;
    if (phase === 'typing') {
      interval = setInterval(() => {
        setStress(s => {
          const newStress = Math.min(100, s + (lastKeystrokeTime > 0 && Date.now() - lastKeystrokeTime > 1000 ? 5 : -2));
          if (newStress === 100 && phase === 'typing') {
            setPhase('judging');
            setTimeout(() => setPhase('result'), 4000);
          }
          return newStress;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [phase, lastKeystrokeTime]);

  useEffect(() => {
    if (phase === 'typing' || phase === 'judging') {
      inputRef.current?.focus();
    }
  }, [phase]);

  const handleContainerClick = () => {
    if (phase === 'typing' || phase === 'judging') {
      inputRef.current?.focus();
    }
  };

  const shakeScreen = () => {
    setShake(true);
    setTimeout(() => setShake(false), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      setBackspaces(b => b + 1);
      shakeScreen();
      if (backspaces > 5 && Math.random() > 0.5) {
        showJudgment("Stop deleting. Commit to your mistakes. Typical.");
      } else if (backspaces > 15 && Math.random() > 0.8) {
        showJudgment("You can't erase the past, why bother here?");
      }
    }
  };

  const showJudgment = (msg: string) => {
    setJudgmentMsg(msg);
    setTimeout(() => setJudgmentMsg(null), 2500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.replace(/[\n\r]/g, '');
    
    // Check for mistake explicitly
    let mistakeMade = false;
    if (val.length > input.length && val[val.length - 1] !== TARGET_TEXT[val.length - 1]) {
        shakeScreen();
        mistakeMade = true;
        setStress(s => {
          const ns = Math.min(100, s + 10);
          if (ns >= 100 && phase === 'typing') {
            setPhase('judging');
            setTimeout(() => setPhase('result'), 4000);
          }
          return ns;
        });
    }

    setInput(val);
    setCharsTyped(c => c + 1);
    
    if (!startTime) setStartTime(Date.now());
    
    const now = Date.now();
    if (lastKeystrokeTime > 0) {
      const delay = now - lastKeystrokeTime;
      if (delay > 1500) {
        setHesitationCount(h => h + 1);
        if (charsTyped > 15) {
          showJudgment("Bored already? Overthinking?");
        }
      }
    }
    setLastKeystrokeTime(now);

    // Calc pseudo WPM
    if (startTime) {
      const elapsedMinutes = (now - startTime) / 60000;
      const words = val.length / 5;
      if (elapsedMinutes > 0) {
        setWpm(Math.round(words / elapsedMinutes));
      }
    }

    // Hard interruption
    if (val.length >= TARGET_TEXT.length && phase === 'typing') {
      setTimeout(() => setPhase('result'), 500);
    }
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center flex-grow p-4 min-h-[calc(100vh-4rem)] bg-zinc-100 text-black font-sans relative overflow-hidden transition-colors duration-700 data-[phase=judging]:bg-red-600 data-[phase=judging]:text-white data-[phase=result]:bg-zinc-900 data-[phase=result]:text-white ${shake ? 'translate-x-1 outline outline-4 outline-red-500' : ''}`} 
      data-phase={phase}
      onClick={handleContainerClick}
    >
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center max-w-md"
          >
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Typing Test</h1>
            <p className="text-zinc-500 mb-8 font-mono text-sm leading-relaxed">Test your WPM and accuracy. Relax and type normally. Don't think about it too much. Just focus. Stay calm.</p>
            <button
              onClick={() => {
                setPhase('typing');
                setInput('');
                setBackspaces(0);
                setCharsTyped(0);
                setHesitationCount(0);
                setStress(0);
                setStartTime(null);
                setLastKeystrokeTime(0);
              }}
              className="px-8 py-4 bg-black text-white rounded-none font-bold hover:bg-zinc-800 transition-colors uppercase tracking-widest text-xs"
            >
              Initialize Assessment
            </button>
          </motion.div>
        )}

        {(phase === 'typing' || phase === 'judging') && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl relative"
          >
            <div className="absolute -top-16 left-0 w-full flex items-center gap-4">
              <span className="text-xs font-mono font-bold text-zinc-400">STRESS</span>
              <div className="h-1 flex-1 bg-zinc-200 overflow-hidden rounded-full">
                <motion.div 
                   className="h-full bg-red-500" 
                   animate={{ width: `${Math.max(0, stress)}%` }}
                   transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                />
              </div>
            </div>

            <div className={`text-2xl md:text-3xl font-serif mb-8 select-none leading-loose transition-colors duration-500 relative ${phase === 'judging' ? 'text-red-300' : 'text-zinc-500'}`}>
              {TARGET_TEXT.split('').map((char, i) => {
                let color = "";
                if (phase === 'judging') {
                  color = i < input.length ? (input[i] === char ? "text-white opacity-40" : "text-black bg-red-500") : "text-red-900/10";
                } else {
                  color = i < input.length ? (input[i] === char ? "text-black drop-shadow-sm" : "text-red-600 bg-red-100 font-bold") : "text-zinc-400";
                }
                const isCurrent = i === input.length;
                return (
                  <span key={i} className={`transition-colors border-b-2 border-transparent ${color} ${isCurrent && phase === 'typing' ? '!border-red-500/50 bg-red-500/10' : ''}`}>
                    {char}
                  </span>
                );
              })}
              {input.length === TARGET_TEXT.length && phase === 'typing' && (
                <span className="inline-block w-2 bg-red-500 animate-pulse h-[1em] translate-y-1 ml-1" />
              )}
            </div>
            
            {/* Invisible robust input over the text */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="absolute inset-0 w-full h-full text-transparent bg-transparent outline-none resize-none caret-transparent z-10 p-0 m-0 cursor-text mix-blend-multiply"
              spellCheck={false}
              autoFocus
            />
            
            <div className={`flex gap-6 text-sm font-mono transition-colors ${phase === 'judging' ? 'text-red-200' : 'text-zinc-400'}`}>
              <span>WPM: {wpm || '--'}</span>
              <span>ERRORS: {backspaces}</span>
            </div>

            <AnimatePresence>
              {judgmentMsg && phase !== 'judging' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  className="absolute top-[-40px] left-1/2 -translate-x-1/2 text-red-500 font-bold whitespace-nowrap tracking-wide bg-red-50 px-4 py-1 rounded border border-red-200"
                >
                  {judgmentMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'judging' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 bg-red-600/90 mix-blend-multiply"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">Stop.</h2>
              <p className="text-2xl mt-4 font-mono font-bold text-red-200">
                You're forcing it.
              </p>
            </div>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-xl w-full p-8 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-800">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <h3 className="font-bold text-2xl tracking-tighter">Psychological Readout</h3>
            </div>
            
            <div className="space-y-6 font-mono text-sm md:text-base text-zinc-300">
              <div className="flex justify-between items-end border-b border-zinc-800/50 pb-2">
                <span className="text-zinc-500 text-xs">RAW HESITATIONS</span>
                <span className="text-red-400 font-bold">{hesitationCount}</span>
              </div>
              <div className="flex justify-between items-end border-b border-zinc-800/50 pb-2">
                <span className="text-zinc-500 text-xs">BACKSPACES / DOUBT</span>
                <span className="text-red-400 font-bold">{backspaces}</span>
              </div>
              
              <div className="pt-4 space-y-4 text-zinc-100 font-sans text-lg">
                <p className="flex gap-3">
                  <span className="text-red-500">{"->"}</span>
                  {backspaces > 10 
                    ? "You rewrite texts 6 times before sending because you fear being misunderstood." 
                    : "You rush forward without thinking, leaving mistakes in your wake to pretend you don't care."}
                </p>
                <p className="flex gap-3">
                  <span className="text-red-500">{"->"}</span>
                  {hesitationCount > 3 
                    ? "Your hesitation is a defense mechanism. You pause to calculate the exact words to avoid friction."
                    : "You type fast to drown out the silence."}
                </p>
                <p className="flex gap-3">
                  <span className="text-red-500">{"->"}</span>
                  "You crave validation but panic the moment you receive it."
                </p>
              </div>
            </div>

            <button
              onClick={() => setPhase('intro')}
              className="mt-12 w-full py-4 bg-white hover:bg-zinc-200 text-black transition-colors font-bold uppercase text-sm tracking-widest"
            >
              Recalibrate & Lie Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
