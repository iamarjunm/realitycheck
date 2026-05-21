/* eslint-disable react-hooks/purity, react/no-unescaped-entities */
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Check, CheckCheck } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them' | 'system';
  status?: 'sent' | 'delivered' | 'read';
  timestamp: string;
};

const getTimestamp = () => {
  const d = new Date();
  return `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
};

const SCENARIOS = [
  {
    reply: "yeah that sounds cool.",
    delay: 2000,
    options: ["did you want to go together?", "i've been meaning to check it out"],
  },
  {
    reply: "maybe. i've been pretty busy lately tbh",
    delay: 4000,
    options: ["no worries, another time maybe?", "busy with what?"],
  },
  {
    reply: "work mostly. you know how it is",
    delay: 2000,
    options: ["yeah totally get it.", "are we still good?"],
  },
  {
    reply: "yeah of course, why wouldn't we be?",
    delay: 5000,
    options: ["idk, you just seem distant.", "just checking."],
  },
  {
    reply: "im just not great at texting",
    delay: 3000,
    options: ["we could call?", "it didn't use to be like this"],
  },
  {
    reply: "can we talk about this later? im out with people",
    delay: 5000,
    options: ["oh. have fun.", "who are you out with?"],
  },
  {
    reply: "just friends. chill",
    delay: 1500,
    options: ["im chill. text me tomorrow.", "whatever."],
  },
  {
    reply: "lol ok.",
    delay: 2000,
    systemBeforeNext: "14 HOURS LATER",
    options: ["hey, thinking about last night..."],
  },
  {
    reply: "i miss you",
    delay: 1500,
    options: ["i miss you too", "where is this coming from?"],
  },
  {
    reply: "just been thinking about us. you're too good for me",
    delay: 4000,
    options: ["don't say that.", "what does that mean?"],
  },
  {
    reply: "i just don't know what i want right now.",
    delay: 3000,
    options: ["what are we doing then?", "i can wait for you."],
  },
  {
    reply: "you shouldn't wait for me.",
    delay: 4000,
    options: ["do you want me to leave you alone?", "i care about you."],
  },
  {
    reply: "i care about you too. im just confused",
    delay: 5000,
    systemBeforeNext: "NEXT THURSDAY, 2:14 PM",
    options: ["hey, are we still hanging out later?", "can we talk?"],
  },
  {
    reply: "cant tonight, something came up",
    delay: 6000,
    options: ["again?", "ok let me know when you're free."],
  },
  {
    reply: "what? no. just busy.", 
    delay: 8000,
    options: ["it takes 2 seconds to text back."],
  },
  {
    reply: "wow ok. if you're gonna be like that",
    delay: 2000,
    options: ["im sorry.", "wow what?"],
  },
  {
    reply: "i dont want to do this right now",
    delay: 3000,
    systemBeforeNext: "DELIVERED",
    options: ["do what?", "please talk to me."],
  },
  {
    reply: "...", 
    delay: 10000,
    systemBeforeNext: "READ",
    options: ["hello?", "are you ignoring me?"]
  },
  {
    reply: "...", 
    delay: 20000,
    options: ["?"]
  }
];

export function Situationship() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'so about that concert on friday', sender: 'me', status: 'read', timestamp: getTimestamp() },
    { id: '2', text: 'what about it', sender: 'them', timestamp: getTimestamp() }
  ]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [isThemTyping, setIsThemTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [chaos, setChaos] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isThemTyping]);

  useEffect(() => {
    setChaos(scenarioIndex / SCENARIOS.length);
  }, [scenarioIndex]);

  const handleSend = (text: string) => {
    if (ended) return;

    const newMsg: Message = { id: Date.now().toString(), text, sender: 'me', status: 'sent', timestamp: getTimestamp() };
    setMessages(prev => [...prev, newMsg]);
    
    // Simulate delivered then read
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
    }, 800);

    const nextScenario = SCENARIOS[scenarioIndex];
    if (!nextScenario) {
      // The final ghosting
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' } : m));
      }, 3000);
      setTimeout(() => {
        setEnded(true);
      }, 5000);
      return;
    }

    // Read receipt
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' } : m));
      setIsThemTyping(true);
    }, nextScenario.delay * 0.4);
    
    // The actual reply
    setTimeout(() => {
      setIsThemTyping(false);
      setMessages(prev => {
        const msgs = [...prev, { id: Date.now().toString(), text: nextScenario.reply, sender: 'them', timestamp: getTimestamp() } as Message];
        if (nextScenario.systemBeforeNext) {
          msgs.push({ id: (Date.now()+1).toString(), text: nextScenario.systemBeforeNext, sender: 'system', timestamp: '' } as Message);
        }
        return msgs;
      });
      setScenarioIndex(i => i + 1);
    }, nextScenario.delay);
  };

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
            <div className="text-sm font-semibold text-black tracking-tight transition-all" style={{ letterSpacing: chaos > 0.6 ? `${chaos * 2}px` : 'normal', opacity: 1 - chaos * 0.5 }}>Them</div>
            <div className="text-[10px] text-zinc-400 font-medium">
              {isThemTyping ? <span className="text-blue-500 animate-pulse">typing...</span> : "Emotionally Unavailable"}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={chatRef}
          className="flex-grow p-4 overflow-y-auto space-y-4 scbar-hide bg-white will-change-scroll relative"
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
                                ms.status === 'sent' ? <Check className="w-3 h-3 text-zinc-400" /> : null;

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
                      ? 'bg-blue-500 text-white rounded-br-sm' 
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
               <span className="text-xs text-zinc-400 font-medium tracking-wide">Read Yesterday</span>
               <div className="px-4 py-2 bg-zinc-100 text-zinc-500 text-xs rounded-lg max-w-[200px] mt-4 font-mono">
                 Simulation complete. The outcome is always the same.
               </div>
               <button 
                 onClick={() => window.location.reload()}
                 className="mt-6 text-sm text-blue-500 font-medium hover:underline"
               >
                 Try to fix it (Restart)
               </button>
             </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 relative overflow-hidden">
          {chaos > 0.6 && <div className="absolute inset-0 bg-red-500/5 mix-blend-color-burn" />}
          <AnimatePresence mode="popLayout">
            {!isThemTyping && !ended ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-col gap-2 relative z-10"
              >
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest text-center mb-1">Choose your response</div>
                {SCENARIOS[scenarioIndex]?.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(opt)}
                    className="w-full text-left px-5 py-3.5 rounded-2xl bg-white border border-blue-500/20 hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-medium text-[15px] transition-all shadow-sm active:scale-[0.98] outline-none hover:shadow-md"
                    style={{
                       transform: chaos > 0.8 && Math.random() > 0.5 ? `translate(${(Math.random() - 0.5) * 5}px, ${(Math.random() - 0.5) * 5}px)` : 'none'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            ) : (
              <div className="h-[92px] flex items-center justify-center relative z-10">
                <div className="w-full h-10 bg-white border border-zinc-200 rounded-full flex items-center px-4 opacity-70 cursor-not-allowed transition-all duration-1000" style={{ transform: chaos > 0.7 ? `scale(${1 - (chaos - 0.7) * 0.2})` : 'none' }}>
                  <span className="text-zinc-300 text-sm">Waiting for reply...</span>
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
