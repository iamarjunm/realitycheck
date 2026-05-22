/* eslint-disable react-hooks/purity, react/no-unescaped-entities */
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Check, CheckCheck } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them' | 'system';
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  isGreen?: boolean;
};

const getTimestamp = () => {
  const d = new Date();
  return `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
};

type Option = string | { text: string; sendAs?: string; unclickable?: boolean };

const SCENARIOS: {
  reply: string;
  delay: number;
  options: Option[];
  systemBeforeNext?: string;
  typingPattern?: 'normal' | 'hesitant' | 'ghost';
  endSimulation?: boolean;
}[] = [
  {
    reply: "oh wait, is that this friday?",
    delay: 2000,
    typingPattern: 'normal',
    options: [
      "yeah, remember we talked about it?",
      "did you forget?",
      "yeah. you still down?"
    ],
  },
  {
    reply: "yeah no im down. just been a crazy week tbh",
    delay: 4000,
    typingPattern: 'hesitant',
    options: [
      "we can just chill instead if you want?",
      "everything okay?",
      "okay, but are we still going?"
    ],
  },
  {
    reply: "idk. let me check my schedule and let you know",
    delay: 3000,
    options: [
      "alright, let me know.",
      "when will you know?",
      "okay."
    ],
  },
  {
    reply: "prob soon. dont wait up for me though",
    delay: 3500,
    options: [
      "so that's a no.",
      "what does that mean?",
      "fine."
    ],
  },
  {
    reply: "dude why are you being so intense",
    delay: 2000,
    typingPattern: 'hesitant',
    options: [
      "im not being intense, i just want an answer",
      { text: "im sorry.", sendAs: "im sorry. im just stressed." },
      "nevermind."
    ],
  },
  {
    reply: "it's fine. we're fine. i just need space rn",
    delay: 5000,
    options: [
      "space from what? we barely talk",
      "okay.",
      "did i do something wrong?"
    ],
  },
  {
    reply: "you didn't do anything. it's me",
    delay: 4000,
    systemBeforeNext: "2 DAYS LATER",
    typingPattern: 'ghost',
    options: [
      "hey.",
      "are we ever going to talk again?",
      { text: "i miss you.", sendAs: "i hate this." }
    ],
  },
  {
    reply: "hey. miss u too. just going thru a lot",
    delay: 3000,
    options: [
      "i'm here for you, you know.",
      "are we okay?",
      "i just want to understand."
    ],
  },
  {
    reply: "i know. i just can't be what you need me to be right now",
    delay: 3500,
    typingPattern: 'hesitant',
    options: [
      "i'm not asking for much",
      "so this is it?",
      { text: "please don't do this.", sendAs: "please." }
    ],
  },
  {
    reply: "i just think we're on different pages",
    delay: 2500,
    options: [
      "we don't have to be.",
      "what page are you on?",
      { text: "are you kidding me?", sendAs: "i can change." }
    ],
  },
  {
    reply: "i dont want to hurt you",
    delay: 4500,
    typingPattern: 'ghost',
    options: [
      "you're hurting me right now.",
      "just tell me the truth.",
      { text: "too late.", sendAs: "i'm already hurting." }
    ],
  },
  {
    reply: "the truth is i like you, i just don't want a relationship",
    delay: 5000,
    options: [
      "that's not what you said a month ago.",
      "i'm not asking for a relationship.",
      { text: "so what was all of this?", sendAs: "was any of it real?" }
    ],
  },
  {
    reply: "im sorry. you're amazing, really.",
    delay: 3000,
    systemBeforeNext: "DELIVERED",
    typingPattern: 'hesitant',
    options: [
      { text: "don't do that. don't pity me.", sendAs: "don't." },
      { text: "please, can we just talk in person?", sendAs: "please. please. please." },
      { text: "i hate this.", sendAs: "i hate you." },
      { text: "i'm done.", unclickable: true }
    ],
  },
  {
    reply: "...", 
    delay: 8000,
    systemBeforeNext: "READ",
    typingPattern: 'ghost',
    options: [
      "hello?",
      "say something.",
      { text: "coward.", sendAs: "i'm sorry, come back." }
    ]
  },
  {
    reply: "...", 
    delay: 15000,
    endSimulation: true,
    options: [
      { text: "?", sendAs: "why am i like this" },
      { text: "leave them alone", unclickable: true },
      { text: "im sorry", sendAs: "please look at me" }
    ]
  }
];

export function Situationship() {
  const [phase, setPhase] = useState<'setup' | 'chat'>('setup');
  const [setupStep, setSetupStep] = useState(0);
  const [targetPronoun, setTargetPronoun] = useState('Them');

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'so about that concert on friday', sender: 'me', status: 'read', timestamp: getTimestamp() },
    { id: '2', text: 'what about it', sender: 'them', timestamp: getTimestamp() }
  ]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [isThemTyping, setIsThemTyping] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [ended, setEnded] = useState(false);
  const chaos = scenarioIndex / SCENARIOS.length;
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isThemTyping]);

  const handleSend = async (opt: Option) => {
    if (ended || isWaiting) return;
    if (typeof opt === 'object' && opt.unclickable) return;
    
    setIsWaiting(true);

    const textToSend = typeof opt === 'string' ? opt : (opt.sendAs || opt.text);

    const newMsg: Message = { id: Date.now().toString(), text: textToSend, sender: 'me', status: 'sent', timestamp: getTimestamp() };
    setMessages(prev => [...prev, newMsg]);
    
    // Simulate delivered
    await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
    setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));

    const nextScenario = SCENARIOS[scenarioIndex];
    if (!nextScenario) return;
    
    if (nextScenario.endSimulation) {
      // The final ghosting - wait long, then fallback to SMS (green) and fail
      await new Promise(r => setTimeout(r, 4000));
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, isGreen: true } : m));
      
      await new Promise(r => setTimeout(r, 2000));
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'failed' } : m));
      
      await new Promise(r => setTimeout(r, 2000));
      setEnded(true);
      setIsWaiting(false);
      return;
    }

    // Read receipt
    const readDelay = nextScenario.delay * (0.3 + chaos * 0.5);
    await new Promise(r => setTimeout(r, readDelay));
    setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' } : m));
    
    // Typing simulation
    const pat = nextScenario.typingPattern || 'normal';
    
    if (pat === 'ghost') {
       await new Promise(r => setTimeout(r, 1000));
       setIsThemTyping(true);
       await new Promise(r => setTimeout(r, 2000));
       setIsThemTyping(false);
       await new Promise(r => setTimeout(r, 4000));
       setIsThemTyping(true);
       await new Promise(r => setTimeout(r, 1500));
    } else if (pat === 'hesitant') {
       await new Promise(r => setTimeout(r, 500));
       setIsThemTyping(true);
       await new Promise(r => setTimeout(r, 1500));
       setIsThemTyping(false);
       await new Promise(r => setTimeout(r, 1500));
       setIsThemTyping(true);
       await new Promise(r => setTimeout(r, 1500));
    } else {
       await new Promise(r => setTimeout(r, 500));
       setIsThemTyping(true);
       await new Promise(r => setTimeout(r, nextScenario.delay * 0.5));
    }
    
    setIsThemTyping(false);
    
    setMessages(prev => {
      const msgs = [...prev, { id: Date.now().toString(), text: nextScenario.reply, sender: 'them', timestamp: getTimestamp() } as Message];
      if (nextScenario.systemBeforeNext) {
        msgs.push({ id: (Date.now()+1).toString(), text: nextScenario.systemBeforeNext, sender: 'system', timestamp: '' } as Message);
      }
      return msgs;
    });
    setScenarioIndex(i => i + 1);
    setIsWaiting(false);
  };

  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center flex-grow p-4 min-h-[calc(100vh-4rem)] bg-zinc-100 relative overflow-hidden pointer-events-auto">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/noise/1000/1000')] bg-repeat opacity-[0.02] mix-blend-screen pointer-events-none z-0" />
        <AnimatePresence mode="wait">
          {setupStep === 0 && (
            <motion.div key="step0" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0, y:-10}} className="text-center max-w-md z-10 w-full px-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-black mb-4">Situationship Simulator</h1>
              <p className="text-zinc-500 mb-10 leading-relaxed max-w-[280px] mx-auto">A hyper-realistic simulation of modern romance. Protect your peace, or don't.</p>
              <button 
                onClick={() => setSetupStep(1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-black text-white rounded-full font-medium active:scale-95 transition-all shadow-lg hover:shadow-xl hover:bg-zinc-800"
              >
                Begin
              </button>
            </motion.div>
          )}

          {setupStep === 1 && (
            <motion.div key="step1" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="w-full max-w-sm z-10 px-4">
              <h2 className="text-3xl font-bold text-center mb-2 tracking-tight text-black">How do you identify?</h2>
              <p className="text-zinc-500 text-center text-sm mb-8">This determines how the void perceives you.</p>
              <div className="flex flex-col gap-3">
                {['Male', 'Female', 'Non-binary'].map(g => (
                  <button 
                    key={g}
                    onClick={() => setSetupStep(2)}
                    className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-center font-medium hover:border-black transition-all active:scale-[0.98] shadow-sm hover:shadow-md text-black"
                  >
                    {g}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {setupStep === 2 && (
            <motion.div key="step2" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="w-full max-w-sm z-10 px-4">
              <h2 className="text-3xl font-bold text-center mb-2 tracking-tight text-black">Who ignored you?</h2>
              <p className="text-zinc-500 text-center text-sm mb-8">Who are you sacrificing your peace for?</p>
               <div className="flex flex-col gap-3">
                {[
                  { label: 'Men', pro: 'Him' },
                  { label: 'Women', pro: 'Her' }, 
                  { label: 'Anyone', pro: 'Them' }
                ].map(g => (
                  <button 
                    key={g.label}
                    onClick={() => {
                      setTargetPronoun(g.pro);
                      setSetupStep(3);
                      setTimeout(() => setPhase('chat'), 2500);
                    }}
                    className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-center font-medium hover:border-black transition-all active:scale-[0.98] shadow-sm hover:shadow-md text-black"
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          {setupStep === 3 && (
            <motion.div key="step3" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center z-10">
              <div className="w-8 h-8 border-[3px] border-black border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Generating False Hope...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center flex-grow p-4 min-h-[calc(100vh-4rem)] bg-zinc-100 relative pointer-events-auto transition-colors duration-1000 ${chaos > 0.5 ? 'bg-zinc-200' : ''}`}>
      
      {chaos > 0.6 && (
        <div className="absolute inset-0 bg-red-900/5 mix-blend-color-burn pointer-events-none z-10 animate-pulse" />
      )}

      {chaos > 0.8 && (
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/noise/1000/1000')] bg-repeat opacity-[0.03] mix-blend-screen pointer-events-none z-0" />
      )}

      <div className="text-center mb-6 max-w-lg relative z-20">
        <h2 className="text-3xl font-bold tracking-tight text-black">The Situationship Simulator</h2>
        <p className="text-zinc-500 mt-2 text-sm">Hyper-realistic modern intimacy. No matter what you choose, they slip away.</p>
      </div>

      <div 
        className="w-full max-w-md h-[650px] max-h-[75vh] bg-white shadow-xl rounded-[2rem] overflow-hidden flex flex-col border border-zinc-200 relative z-20 transition-transform duration-1000"
        style={{
          transform: chaos > 0.7 ? `scale(${1 - (chaos - 0.7) * 0.1}) translateY(${(chaos - 0.7) * 20}px)` : 'none',
          boxShadow: chaos > 0.8 ? `0 20px 40px rgba(255, 0, 0, ${chaos * 0.1})` : ''
        }}
      >
        {/* iOS style header */}
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-center bg-zinc-50/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-tr from-zinc-200 to-zinc-300 rounded-full mb-1 flex items-center justify-center shadow-inner relative overflow-hidden">
               {chaos > 0.5 && <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />}
               <span className="text-zinc-500 font-bold text-lg transition-opacity" style={{ opacity: Math.max(0, 1 - chaos * 1.5) }}>?</span>
            </div>
            <div className="text-sm font-semibold text-black tracking-tight transition-all" style={{ letterSpacing: chaos > 0.6 ? `${chaos * 2}px` : 'normal', opacity: 1 - chaos * 0.5 }}>{targetPronoun}</div>
            <div className="text-[10px] text-zinc-400 font-medium">
              {isThemTyping ? <span className="text-blue-500 animate-pulse">typing...</span> : "Emotionally Unavailable"}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={chatRef}
          className="flex-grow min-h-0 p-4 overflow-y-auto space-y-4 scbar-hide bg-white will-change-scroll relative"
        >
          <AnimatePresence initial={false}>
            {messages.map((ms, i) => {
              if (ms.sender === 'system') {
                return (
                  <motion.div key={ms.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center my-6">
                    <span className="text-[10px] font-bold tracking-widest text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">{ms.text}</span>
                  </motion.div>
                );
              }

              const checkIcon = ms.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-500" /> : 
                                ms.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-zinc-400" /> : 
                                ms.status === 'sent' ? (ms.isGreen ? <span className="text-[10px] text-zinc-400 font-medium">Sent as Text Message</span> : <Check className="w-3 h-3 text-zinc-400" />) : 
                                ms.status === 'failed' ? <span className="text-[10px] text-red-500 font-medium tracking-wide">Not Delivered</span> : null;

              return (
                <motion.div
                  key={ms.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${ms.sender === 'me' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[75%] text-[15px] font-sans leading-snug relative ${
                    ms.sender === 'me' 
                      ? (ms.isGreen || ms.status === 'failed' ? 'bg-[#34c759] text-white rounded-br-sm' : 'bg-blue-500 text-white rounded-br-sm')
                      : 'bg-zinc-100 text-black rounded-bl-sm'
                  }`}>
                    {ms.text}
                  </div>
                  {ms.sender === 'me' && (
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-zinc-400">{ms.timestamp}</span>
                      {checkIcon}
                    </div>
                  )}
                  {ms.sender === 'them' && (
                     <div className="mt-1 px-1 text-[10px] text-zinc-400 flex items-center gap-2">
                       {ms.timestamp}
                     </div>
                  )}
                </motion.div>
              );
            })}
            
            {isThemTyping && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, originY: 1 }}
                className="flex items-start"
              >
                <div className="px-4 py-3 bg-zinc-100 rounded-2xl rounded-bl-sm flex gap-1 items-center h-[38px]">
                  <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {ended && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 1 }}
               className="text-center pt-12 pb-4 flex flex-col items-center gap-2"
             >
               <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase px-3 py-1 bg-zinc-100 rounded-full">Connection Severed</span>
               <div className="px-4 py-2 text-zinc-400 text-[13px] rounded-lg max-w-[200px] mt-4 font-mono opacity-80">
                 Simulation complete. The outcome is always the same.
               </div>
               <button 
                 onClick={() => window.location.reload()}
                 className="mt-6 px-4 py-2 rounded-full border border-zinc-200 text-sm text-zinc-500 font-medium hover:bg-zinc-50 active:scale-95 transition-all"
               >
                 Try to fix it (Restart)
               </button>
             </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 relative shrink-0">
          {chaos > 0.6 && <div className="absolute inset-0 bg-red-500/5 mix-blend-color-burn pointer-events-none" />}
          <AnimatePresence mode="popLayout">
            {!isThemTyping && !isWaiting && !ended ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-col gap-2 relative z-10 max-h-[40vh] overflow-y-auto scbar-hide"
              >
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest text-center mb-1">Choose your response</div>
                {SCENARIOS[scenarioIndex]?.options.map((opt, i) => {
                  const text = typeof opt === 'string' ? opt : opt.text;
                  const unclickable = typeof opt === 'object' && opt.unclickable;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(opt)}
                      disabled={unclickable}
                      className={`w-full text-left px-5 py-3.5 rounded-2xl border transition-all shadow-sm outline-none text-[15px] ${
                        unclickable
                          ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed line-through opacity-60'
                          : 'bg-white border-blue-500/20 hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-medium active:scale-[0.98] hover:shadow-md'
                      }`}
                      style={{
                         transform: chaos > 0.8 && !unclickable ? `translate(${Math.random() > 0.5 ? '-1px' : '1px'}, ${Math.random() > 0.5 ? '1px' : '-1px'})` : 'none'
                      }}
                    >
                      {text}
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <div className="h-[92px] flex items-center justify-center relative z-10">
                <div className="w-full h-10 bg-white border border-zinc-200 rounded-full flex items-center px-4 opacity-70 cursor-not-allowed transition-all duration-1000" style={{ transform: chaos > 0.7 ? `scale(${1 - (chaos - 0.7) * 0.2})` : 'none' }}>
                  <span className="text-zinc-300 text-sm">{ended ? "Message Failed" : "Waiting for reply..."}</span>
                  <Send className="w-4 h-4 ml-auto text-zinc-300" />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
