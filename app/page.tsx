'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Download, Share2, Terminal, ChevronRight, AlertTriangle, Cpu, RotateCcw } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

type RoleType = 'BACKGROUND_EXTRA' | 'YAPPER' | 'SIDE_QUEST_GIVER' | 'DOOMSCROLLER' | 'GLITCH' | 'MAIN_CHARACTER';

interface Answer {
  text: string;
  points: Partial<Record<RoleType, number>>;
}

interface Question {
  id: string;
  text: string;
  answers: Answer[];
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Do you walk slowly in the middle of the hallway?',
    answers: [
      { text: 'Yes, and I stop to check texts randomly.', points: { DOOMSCROLLER: 2, YAPPER: 1 } },
      { text: 'No, I speedwalk like I have an active mission.', points: { MAIN_CHARACTER: 1, GLITCH: 1 } },
      { text: 'I just follow whoever is walking in front of me.', points: { BACKGROUND_EXTRA: 3 } },
    ]
  },
  {
    id: 'q2',
    text: 'What is your default response when someone shows you a meme you\'ve already seen?',
    answers: [
      { text: 'Fake a laugh to be polite.', points: { BACKGROUND_EXTRA: 2, SIDE_QUEST_GIVER: 1 } },
      { text: '"Seen it bro." then walk away.', points: { GLITCH: 2, MAIN_CHARACTER: 1 } },
      { text: '"YEAH AND DID YOU SEE THE ONE WHERE..." *starts monologue*.', points: { YAPPER: 3 } },
    ]
  },
  {
    id: 'q3',
    text: 'Your phone is at 4% battery, you are in public. Action?',
    answers: [
      { text: 'Accept my fate and stare at the wall.', points: { DOOMSCROLLER: 1, BACKGROUND_EXTRA: 2 } },
      { text: 'Frantically ask 14 strangers for a charger.', points: { SIDE_QUEST_GIVER: 3 } },
      { text: 'My phone has never been below 50%.', points: { MAIN_CHARACTER: 2, GLITCH: 1 } },
    ]
  },
  {
    id: 'q4',
    text: 'How do you handle awkward silence in a group?',
    answers: [
      { text: 'Embrace it. It\'s only awkward if they bleed.', points: { GLITCH: 2, MAIN_CHARACTER: 1 } },
      { text: 'Fill it with completely meaningless noise.', points: { YAPPER: 3 } },
      { text: 'Pull out my phone and pretend to text.', points: { DOOMSCROLLER: 3, BACKGROUND_EXTRA: 1 } },
    ]
  },
  {
    id: 'q5',
    text: 'Someone waves at you, but it was for the person behind you. You:',
    answers: [
      { text: 'Evaporate from embarrassment into the astral plane.', points: { BACKGROUND_EXTRA: 2, SIDE_QUEST_GIVER: 1 } },
      { text: 'Wave back confidently and force an interaction.', points: { GLITCH: 3 } },
      { text: 'Turn it into a stretch and pretend nothing happened.', points: { MAIN_CHARACTER: 2, YAPPER: 1 } },
    ]
  },
  {
    id: 'q6',
    text: 'In a group project, what is your role?',
    answers: [
      { text: 'Doing 90% of the work and complaining on Twitter.', points: { MAIN_CHARACTER: 2 } },
      { text: 'Making the WhatsApp group and then going silent.', points: { BACKGROUND_EXTRA: 3 } },
      { text: 'Saying "I agree with whatever you guys think!"', points: { SIDE_QUEST_GIVER: 2, DOOMSCROLLER: 1 } },
    ]
  },
  {
    id: 'q7',
    text: 'Someone is crying in the bathroom. Your reaction?',
    answers: [
      { text: 'Wash hands aggressively fast and sprint out.', points: { BACKGROUND_EXTRA: 2, DOOMSCROLLER: 1 } },
      { text: '"Omg do you need anything? Water? My social security number?"', points: { SIDE_QUEST_GIVER: 3 } },
      { text: 'Ask them what happened so I have tea for later.', points: { YAPPER: 3 } },
    ]
  },
  {
    id: 'q8',
    text: 'What is your internal monologue mostly comprised of?',
    answers: [
      { text: 'Fake arguments that I always win.', points: { MAIN_CHARACTER: 2, YAPPER: 1 } },
      { text: 'Elevator music. Just pure static.', points: { BACKGROUND_EXTRA: 3, SIDE_QUEST_GIVER: 1 } },
      { text: '"Refresh timeline... refresh timeline..."', points: { DOOMSCROLLER: 3 } },
    ]
  },
  {
    id: 'q9',
    text: 'If the simulation crashed right now, what would your final log say?',
    answers: [
      { text: '"Awaiting instructions." (Idle state)', points: { BACKGROUND_EXTRA: 3 } },
      { text: '"Mid-yap." (Buffer overflow)', points: { YAPPER: 3 } },
      { text: '"Critical Error." (Unhandled exception)', points: { GLITCH: 3 } },
    ]
  },
  {
    id: 'q10',
    text: 'A random dog runs up to you. You:',
    answers: [
      { text: 'Pet it, obviously. It\'s a dog.', points: { MAIN_CHARACTER: 1, SIDE_QUEST_GIVER: 2 } },
      { text: 'Initiate a full 10-minute one-sided conversation with it.', points: { YAPPER: 3 } },
      { text: 'Take a picture for my story and ignore it after.', points: { DOOMSCROLLER: 3 } },
    ]
  }
];

const ROLES: Record<RoleType, { title: string; subtitle: string; description: string; stats: { label: string; val: number }[]; theme: string; textClass: string; icon: React.ReactNode; rarity: 'common' | 'rare' | 'legendary' | 'glitched'; resultText: string; passive: string }> = {
  BACKGROUND_EXTRA: {
    title: "BACKGROUND EXTRA",
    subtitle: "Code: NULL_ENTITY",
    description: "You have zero impact on the overarching plot. The simulation saves processing power by rendering you at 720p. You are filler content.",
    stats: [{ label: "Aura", val: 14 }, { label: "Dialogue", val: 0 }, { label: "Screen Time", val: 100 }, { label: "Impact", val: 0 }],
    theme: "from-zinc-500/20 to-zinc-900/80 border-zinc-500",
    textClass: "text-zinc-300",
    icon: <Cpu className="w-8 h-8 opacity-50" />,
    rarity: 'common',
    resultText: "You belong in the background.",
    passive: "Invisibility (Unintentional)"
  },
  YAPPER: {
    title: "THE YAPPER",
    subtitle: "Code: AUDIO_OVERFLOW",
    description: "High dialogue output, zero forward narrative momentum. You are the unskippable tutorial text box of real life.",
    stats: [{ label: "Aura", val: 45 }, { label: "Dialogue", val: 99 }, { label: "Action", val: 12 }, { label: "Brainrot", val: 85 }],
    theme: "from-orange-500/20 to-red-900/80 border-orange-500",
    textClass: "text-orange-400",
    icon: <Terminal className="w-8 h-8 text-orange-400" />,
    rarity: 'rare',
    resultText: "Please stop talking. We beg you.",
    passive: "Uninterruptible Cast (Monologue)"
  },
  SIDE_QUEST_GIVER: {
    title: "SIDE-QUEST GIVER",
    subtitle: "Code: DEP_INJECTION",
    description: "You exist purely to slow down the Main Character. Always needs a ride, a charger, or 'advice' you will never actually take.",
    stats: [{ label: "Aura", val: 30 }, { label: "Neediness", val: 99 }, { label: "Relevance", val: 15 }, { label: "Vague Posting", val: 80 }],
    theme: "from-blue-500/20 to-indigo-900/80 border-blue-500",
    textClass: "text-blue-400",
    icon: <AlertTriangle className="w-8 h-8 text-blue-400" />,
    rarity: 'common',
    resultText: "An annoying obstacle disguised as a friend.",
    passive: "Guilt Trip (Target cannot decline)"
  },
  DOOMSCROLLER: {
    title: "THE DOOMSCROLLER",
    subtitle: "Code: IDLE_LOOP",
    description: "Physically here, mentally inside a For You page. The simulation frequently pauses your subroutines to save RAM.",
    stats: [{ label: "Aura", val: 5 }, { label: "Screen Time", val: 99 }, { label: "Posture", val: 12 }, { label: "Awareness", val: 0 }],
    theme: "from-emerald-500/20 to-teal-900/80 border-emerald-500",
    textClass: "text-emerald-400",
    icon: <Cpu className="w-8 h-8 text-emerald-400" />,
    rarity: 'rare',
    resultText: "Wake up. You've been scrolling for 6 hours.",
    passive: "Time Dilation (Hours feel like seconds)"
  },
  GLITCH: {
    title: "THE GLITCH",
    subtitle: "Code: FATAL_ERROR",
    description: "Your behavior defies algorithmic prediction. You are actually interesting, but the devs are currently looking for a patch to remove you.",
    stats: [{ label: "Aura", val: 99 }, { label: "Consistency", val: 0 }, { label: "Unpredictability", val: 99 }, { label: "Vibes", val: 100 }],
    theme: "from-fuchsia-500/20 to-purple-900/80 border-fuchsia-500",
    textClass: "text-fuchsia-400",
    icon: <AlertTriangle className="w-8 h-8 text-fuchsia-400" />,
    rarity: 'glitched',
    resultText: "A threat to the simulation\'s stability.",
    passive: "NoClip (Ignores social boundaries)"
  },
  MAIN_CHARACTER: {
    title: "MAIN CHARACTER",
    subtitle: "Code: PROTAGONIST",
    description: "Against all odds, the universe revolves around you. Or at least, your delusion is strong enough to make it seem that way. Enjoy the plot armor.",
    stats: [{ label: "Aura", val: 95 }, { label: "Plot Armor", val: 99 }, { label: "Delusion", val: 80 }, { label: "Impact", val: 90 }],
    theme: "from-yellow-400/20 to-amber-900/80 border-yellow-400",
    textClass: "text-yellow-400",
    icon: <Terminal className="w-8 h-8 text-yellow-400" />,
    rarity: 'legendary',
    resultText: "You actually are the chosen one.",
    passive: "Plot Armor (Immune to consequences)"
  }
};

export default function NPCStatCardApp() {
  const [gameState, setGameState] = useState<'intro' | 'quiz' | 'calculating' | 'result'>('intro');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userName, setUserName] = useState('');
  const [scores, setScores] = useState<Record<RoleType, number>>({
    BACKGROUND_EXTRA: 0, YAPPER: 0, SIDE_QUEST_GIVER: 0, DOOMSCROLLER: 0, GLITCH: 0, MAIN_CHARACTER: 0
  });
  const [finalRole, setFinalRole] = useState<RoleType | null>(null);

  const handleStart = () => {
    if (!userName.trim()) return;
    setGameState('quiz');
  };

  const handleAnswer = (points: Partial<Record<RoleType, number>>) => {
    setScores(prev => {
      const newScores = { ...prev };
      for (const [role, pts] of Object.entries(points)) {
        newScores[role as RoleType] += pts;
      }
      return newScores;
    });

    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    setGameState('calculating');
    setTimeout(() => {
      // Find highest score
      let maxScore = -1;
      let winningRole: RoleType = 'BACKGROUND_EXTRA';
      
      for (const [role, score] of Object.entries(scores)) {
        // use State updater's snapshot of scores technically, but we have it here
        if (score > maxScore) {
          maxScore = score;
          winningRole = role as RoleType;
        }
      }
      setFinalRole(winningRole);
      setGameState('result');
    }, 2500); // Fake calculation time for tension
  };

  const restart = () => {
    setScores({ BACKGROUND_EXTRA: 0, YAPPER: 0, SIDE_QUEST_GIVER: 0, DOOMSCROLLER: 0, GLITCH: 0, MAIN_CHARACTER: 0 });
    setCurrentQuestionIdx(0);
    setFinalRole(null);
    setUserName('');
    setGameState('intro');
  };

  return (
    <main className="min-h-screen bg-grid-white relative flex flex-col items-center justify-center p-4">
      {/* Background noise */}
      <div className="absolute inset-0 noise-bg"></div>

      <AnimatePresence mode="wait">
        {gameState === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            className="z-10 flex flex-col items-center max-w-xl text-center space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 border border-cyan-500/50 bg-cyan-500/10 px-3 py-1 rounded-full text-cyan-400 font-mono text-sm mb-4">
                <AlertTriangle className="w-4 h-4" />
                <span>WARNING: EGO DESTRUCTION IMMINENT</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-glow-cyan uppercase">
                Reality Check
              </h1>
              <p className="text-xl md:text-2xl font-mono text-cyan-200/70 uppercase tracking-widest uppercase">
                NPC Stat Card Generator
              </p>
            </div>
            
            <p className="text-zinc-400 text-lg max-w-md">
              Everyone thinks they are the &quot;Main Character&quot; of the simulation. It&apos;s time to brutally categorize your actual role in the background runtime.
            </p>

            <div className="flex flex-col items-center w-full max-w-sm space-y-6 pt-4">
              <input
                type="text"
                maxLength={20}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter Entity Name..."
                className="w-full bg-transparent border-b-2 border-cyan-500/30 text-center text-white text-2xl pb-2 focus:outline-none focus:border-cyan-400 transition-colors font-mono placeholder:text-zinc-700 uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userName.trim()) handleStart();
                }}
                suppressHydrationWarning
                autoComplete="off"
                data-1p-ignore
              />

              <button 
                onClick={handleStart}
                disabled={!userName.trim()}
                className="group relative w-full py-4 bg-cyan-500 text-black font-bold font-mono text-xl uppercase tracking-wider overflow-hidden rounded-sm hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:not-disabled:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center justify-center">
                  Initialize Connect <ChevronRight className="ml-2 w-5 h-5 group-hover:not-disabled:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'quiz' && (
          <QuizScreen 
            key="quiz"
            question={QUESTIONS[currentQuestionIdx]} 
            progress={(currentQuestionIdx / QUESTIONS.length) * 100}
            onAnswer={handleAnswer} 
          />
        )}

        {gameState === 'calculating' && (
          <TerminalCalculationScreen />
        )}

        {gameState === 'result' && finalRole && (
          <ResultScreen key="result" roleKey={finalRole} userName={userName} onRestart={restart} />
        )}
      </AnimatePresence>
    </main>
  );
}

function QuizScreen({ question, progress, onAnswer }: { question: Question, progress: number, onAnswer: (p: any) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="z-10 w-full max-w-2xl"
    >
      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-800 mb-12 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-white mb-8">
          {question.text}
        </h2>

        <div className="space-y-4">
          {question.answers.map((ans, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAnswer(ans.points)}
              className="w-full text-left p-6 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-cyan-500/50 rounded-lg text-lg text-zinc-300 hover:text-white transition-all font-mono"
            >
              <span className="text-cyan-500/50 mr-4">[{String.fromCharCode(65 + i)}]</span>
              {ans.text}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ResultScreen({ roleKey, userName, onRestart }: { roleKey: RoleType, userName: string, onRestart: () => void }) {
  const role = ROLES[roleKey];
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardId] = useState(() => Math.random().toString(36).substring(7).toUpperCase());

  // 3D Tilt Effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { damping: 30, stiffness: 200 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { damping: 30, stiffness: 200 });
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [100, 0]), { damping: 30, stiffness: 200 });
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [100, 0]), { damping: 30, stiffness: 200 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    mouseX.set(x / rect.width - 0.5);
    mouseY.set(y / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const captureCard = async () => {
    if (!cardRef.current) return;
    try {
      // Temporarily remove 3D transform for clean capture
      const currentTransform = cardRef.current.style.transform;
      cardRef.current.style.transform = 'none';
      
      const dataUrl = await htmlToImage.toPng(cardRef.current, { 
        quality: 1,
        pixelRatio: 2,
        style: { transform: 'none' } // Force no transform
      });
      
      // Restore transform
      cardRef.current.style.transform = currentTransform;

      const link = document.createElement('a');
      link.download = `npc-stat-card-${roleKey.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to export image', e);
      alert("Failed to export image.");
    }
  };

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My NPC Stat Card',
          text: `Reality Check: I got classified as ${role.title} in the simulation. What's your role?`,
          url: window.location.href,
        });
      } catch (err) {
        console.warn('Share rejected or failed', err);
      }
    } else {
      captureCard(); // fallback to download
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="z-10 flex flex-col items-center w-full max-w-sm"
    >
      <div className="mb-6 text-center">
        <h3 className="text-zinc-500 font-mono text-sm uppercase tracking-widest mb-2">Analysis Complete</h3>
        <p className="text-white text-xl">{role.resultText}</p>
      </div>

      {/* The 3D Card Area */}
      <div 
        className={`w-full aspect-[3/4] perspective-[1000px] mb-8 ${role.rarity === 'glitched' ? 'glitch-anim' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          id="stat-card"
          ref={cardRef}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className={`w-full h-full relative rounded-2xl border ${role.rarity === 'legendary' ? 'border-amber-400/50' : 'border-white/20'} bg-gradient-to-b ${role.theme} p-6 flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm`}
        >
          {/* Legendary Starburst Background */}
          {role.rarity === 'legendary' && (
            <div className="bg-starburst z-0"></div>
          )}

          {/* Glare effect */}
          <motion.div 
            className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-50"
            style={{
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.8) 0%, transparent 50%)`
              )
            }}
          />
          {/* Holographic foil */}
          {role.rarity === 'legendary' ? (
            <div className="absolute inset-0 gold-foil z-10"></div>
          ) : (
            <div className="absolute inset-0 holo-foil z-10"></div>
          )}
          
          {/* Card Content - elevated for 3D */}
          <div className="relative z-30 h-full flex flex-col" style={{ transform: 'translateZ(30px)' }}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-lg bg-black/40 border border-white/10 ${role.textClass}`}>
                {role.icon}
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-white/50 tracking-widest uppercase">Entity: {userName.substring(0, 15)}</div>
                <div className={`text-xs font-mono font-bold ${role.textClass}`}>{role.subtitle}</div>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none mb-2 ${role.textClass}`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {role.title}
              </h2>
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                {role.description}
              </p>
            </div>

            {/* Spacer */}
            <div className="flex-grow"></div>

            {/* Stats */}
            <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
              {role.stats.map((stat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] sm:text-xs font-mono uppercase tracking-wider">
                    <span className="text-white/70">{stat.label}</span>
                    <span className="text-white font-bold">{stat.val}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.val}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className={`h-full ${role.textClass.replace('text-', 'bg-')}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Passive Ability */}
            <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/5 flex flex-col">
              <span className="text-[10px] text-white/50 uppercase font-mono mb-1 tracking-widest">Passive Ability</span>
              <span className={`text-sm font-semibold ${role.textClass}`}>{role.passive}</span>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-end text-[9px] font-mono text-white/40">
              <div className="flex flex-col gap-1">
                <span>REALITY CHECK v2.0</span>
                <span>ID: {cardId}</span>
              </div>
              <div className="tracking-tighter text-sm opacity-50 flex right-0">
                █║▌│█│║▌║││█║▌║▌║
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex w-full gap-2 mt-2">
        <button 
          onClick={captureCard}
          className="flex-1 py-3 bg-white text-black font-bold uppercase rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" /> Save
        </button>
        <button 
          onClick={shareCard}
          className="flex-1 py-3 bg-cyan-500 text-black font-bold uppercase rounded-lg hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button 
          onClick={onRestart}
          className="py-3 px-4 bg-zinc-800 text-white font-bold uppercase rounded-lg hover:bg-zinc-700 transition-colors text-sm border border-zinc-700"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4" /> Retry
        </button>
      </div>
    </motion.div>
  );
}

function TerminalCalculationScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const messages = [
      "INITIALIZING SCAN...",
      "FETCHING SOCIAL MEDIA FOOTPRINT...",
      "ANALYZING AWKWARD ENCOUNTERS...",
      "CALCULATING AURA POINTS...",
      "WARNING: CRINGE LEVELS DETECTED...",
      "CROSS-REFERENCING GLOBAL NPC DATABASE...",
      "ASSIGNING SIMULATION ROLE..."
    ];
    
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < messages.length) {
        setLogs(prev => [...prev, messages[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 300);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <motion.div 
      key="calc"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="z-10 flex flex-col items-start w-full max-w-lg font-mono bg-black/60 p-6 rounded-lg border border-cyan-500/30"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <div className="text-cyan-400 tracking-widest animate-pulse font-bold">
          SYSTEM_PROCESSING
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-zinc-400 w-full">
        {logs.map((log, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start ${index === logs.length - 1 ? 'text-cyan-300' : ''}`}
          >
            <span className="text-zinc-600 mr-2">{`>`}</span>
            <span>{log}</span>
          </motion.div>
        ))}
        {logs.length < 7 && (
          <motion.div 
            animate={{ opacity: [1, 0, 1] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-3 h-4 bg-cyan-400 inline-block ml-3 mt-1"
          />
        )}
      </div>
    </motion.div>
  );
}
