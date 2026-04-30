'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function TerminalCalculationScreen() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const messages = [
      'INITIALIZING DEEP SCAN...',
      'FETCHING SOCIAL MEDIA FOOTPRINT...',
      'ANALYZING AWKWARD ENCOUNTERS...',
      'CALCULATING AURA POINTS...',
      'WARNING: CRINGE LEVELS DETECTED...',
      'CROSS-REFERENCING GLOBAL NPC DATABASE...',
      'ASSIGNING SIMULATION ROLE...',
    ];

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < messages.length) {
        setLogs((previousLogs) => [...previousLogs, messages[currentIndex]]);
        currentIndex += 1;
      } else {
        clearInterval(intervalId);
      }
    }, 400);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-10 flex flex-col items-start w-full max-w-lg font-mono bg-black/60 p-6 rounded-lg border border-cyan-500/30 mx-4 my-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <div className="text-cyan-400 tracking-widest animate-pulse font-bold">SYSTEM_PROCESSING</div>
      </div>

      <div className="space-y-2 text-sm text-zinc-400 w-full min-h-[200px]">
        {logs.map((log, index) => (
          <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-start ${index === logs.length - 1 ? 'text-cyan-300' : ''}`}>
            <span className="text-zinc-600 mr-2">&gt;</span>
            <span>{log}</span>
          </motion.div>
        ))}
        {logs.length < 7 && (
          <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-3 h-4 bg-cyan-400 inline-block ml-3 mt-1" />
        )}
      </div>
    </motion.div>
  );
}
