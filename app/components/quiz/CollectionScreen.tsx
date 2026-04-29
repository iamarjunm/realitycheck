'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { QUIZZES, RoleDef } from '../../../lib/quizzes';
import { ResultScreen } from './ResultScreen';

export function CollectionScreen() {
  const [unlockedCards, setUnlockedCards] = React.useState<string[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState<{ roleDef: RoleDef, quizTitle: string, quizId: string } | null>(null);

  React.useEffect(() => {
    try {
      const unlocked = JSON.parse(localStorage.getItem('unlockedCards') || '[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnlockedCards(unlocked);
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
    
    const timeoutId = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const allCards = React.useMemo(() => {
    let cards: { quizId: string, quizTitle: string, roleId: string, role: RoleDef }[] = [];
    QUIZZES.forEach(quiz => {
      Object.entries(quiz.roles).forEach(([roleId, role]) => {
        cards.push({ quizId: quiz.id, quizTitle: quiz.title, roleId, role });
      });
    });
    
    // Rarity map for sorting and styling
    const rarityOrder: Record<string, number> = { 
      'common': 1, 
      'rare': 2, 
      'epic': 3, 
      'legendary': 4, 
      'mythic': 5, 
      'abyssal': 6, 
      'glitched': 7 
    };
    
    return cards.sort((a, b) => rarityOrder[b.role.rarity as keyof typeof rarityOrder] - rarityOrder[a.role.rarity as keyof typeof rarityOrder]);
  }, []);

  const SYNERGIES = [
    { title: "The Capitalist", req: ['THE_BANK', 'FOUNDER_CEO'], desc: "Acquired immense hypothetical wealth." },
    { title: "System Outage", req: ['GLITCH', 'VOID_CORE'], desc: "Removed the UI entirely." },
    { title: "God Entity", req: ['THE_AWAKENED', 'THE_ARCHITECT'], desc: "Hacked the universe source code." },
    { title: "Chaos Engine", req: ['YAPPER', 'THE_INSTIGATOR'], desc: "Started a fire just to talk about it." },
    { title: "The Silent Witness", req: ['DOOMSCROLLER', 'THE_OBSERVER'], desc: "Watched the end from the back row." },
    { title: "The Phantom", req: ['QUIET_QUITTER', 'THE_FLAKE'], desc: "Cannot be located during business hours or weekends." },
    { title: "Absolute Zero", req: ['THE_SOCIOPATH', 'THE_RUTHLESS'], desc: "Optimized for maximum efficiency. Minimum humanity." }
  ];

  const earnedTitles = SYNERGIES.filter(syn => syn.req.every(r => unlockedCards.includes(r)));

  const getFoilClass = (rarity: string) => {
    switch(rarity) {
      case 'mythic': return 'mythic-foil';
      case 'abyssal': return 'abyssal-foil';
      case 'legendary': return 'gold-foil';
      case 'epic': return 'epic-foil';
      case 'rare': return 'rare-foil';
      case 'glitched': return 'glitch-foil';
      case 'common':
      default: return 'common-foil';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10';
      case 'rare': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'epic': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'legendary': return 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]';
      case 'mythic': return 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse';
      case 'abyssal': return 'text-red-600 border-red-600 bg-red-900/20 shadow-[0_0_30px_rgba(220,38,38,0.5)]';
      case 'glitched': return 'text-green-400 border-green-500/50 bg-green-500/10 shadow-[0_0_25px_rgba(34,197,94,0.4)] mix-blend-screen';
      default: return 'text-white border-white/20 bg-white/5';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="z-10 w-full max-w-6xl w-full pb-10 pt-16 sm:pt-20 flex flex-col items-center px-2 sm:px-4 flex-1"
    >
      <div className="text-center mb-0 mt-4 sm:mt-8 shrink-0">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-glow-cyan uppercase mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          Card Codex
        </h1>
        <p className="text-zinc-400 font-mono text-xs sm:text-sm uppercase tracking-widest mb-4">
          Unlocked: {isMounted ? unlockedCards.length : 0} / {allCards.length}
        </p>
      </div>

      {isMounted && earnedTitles.length > 0 && (
        <div className="w-full mb-6 max-w-4xl">
          <div className="text-cyan-400 text-xs font-mono uppercase tracking-widest mb-2 border-b border-cyan-500/30 pb-1">
            Achieved Synergy Titles
          </div>
          <div className="flex flex-wrap gap-2">
            {earnedTitles.map(syn => (
              <div key={syn.title} className="bg-cyan-900/40 border border-cyan-500 text-cyan-100 px-3 py-1.5 rounded-lg flex items-center gap-2" title={syn.desc}>
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold tracking-tight text-sm">{syn.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 w-full p-2 sm:p-4 rounded-xl border border-white/5 bg-black/40 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {allCards.map((card, i) => {
            const isUnlocked = unlockedCards.includes(card.roleId);
            const displayTitle = isUnlocked ? card.role.title : '???';
            const displayDescription = isUnlocked ? card.role.description : 'Undiscovered anomaly. Take more tests to unlock this entity.';
            const displayPassive = isUnlocked ? card.role.passive : '???';
            
            return (
              <motion.div
                key={`${card.quizId}-${card.roleId}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
                onClick={() => {
                  if (isUnlocked) {
                    setSelectedCard({ roleDef: card.role, quizTitle: card.quizTitle, quizId: card.quizId });
                  }
                }}
                className={`relative flex flex-col p-4 rounded-xl border ${
                  isUnlocked 
                    ? `bg-gradient-to-b ${card.role.theme.split(' ')[0]} ${card.role.theme.split(' ')[1] || 'to-zinc-900/80'} ${getRarityColor(card.role.rarity)}`
                    : 'bg-black border-white/5 text-zinc-600'
                } backdrop-blur-xl overflow-hidden transition-all duration-300 ${isUnlocked ? 'cursor-pointer group shadow-lg' : 'opacity-70 grayscale'}`}
              >
                {isUnlocked && <div className="absolute inset-0 card-noise z-0"></div>}
                {isUnlocked && <div className={`absolute inset-0 ${getFoilClass(card.role.rarity)} opacity-50 z-0`}></div>}
                {isUnlocked && <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-0"></div>}
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg border ${isUnlocked ? 'bg-black/50 border-white/10' : 'bg-black border-white/5'}`}>
                      {isUnlocked ? card.role.icon : <div className="w-8 h-8 flex items-center justify-center text-zinc-700 font-black">?</div>}
                    </div>
                    <div className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${isUnlocked ? `bg-black/60 border ${getRarityColor(card.role.rarity)}` : 'bg-white/5 text-zinc-500 border-white/10'}`}>
                      {card.role.rarity}
                    </div>
                  </div>
                  
                  <h3 className={`text-lg font-black uppercase tracking-tight mb-1 ${isUnlocked ? card.role.textClass : 'text-zinc-500'} drop-shadow-md`}>
                    {displayTitle}
                  </h3>
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
                    Origin: {card.quizTitle}
                  </div>
                  
                  <p className={`text-xs line-clamp-4 mb-4 flex-1 drop-shadow ${isUnlocked ? 'text-white/80' : 'text-zinc-600 italic font-mono'}`}>
                    {displayDescription}
                  </p>
  
                  <div className="mt-auto bg-black/40 p-2 rounded border border-white/5">
                    <div className="text-[8px] text-white/30 uppercase font-mono mb-1 tracking-widest">Passive Ability</div>
                    <div className={`text-[10px] font-bold ${isUnlocked ? card.role.textClass : 'text-zinc-500'}`}>{displayPassive}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedCard(null)}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center my-auto">
              <ResultScreen 
                roleDef={selectedCard.roleDef} 
                secondaryRoleDef={null} 
                quizName={selectedCard.quizTitle} 
                quizId={selectedCard.quizId} 
                userName="UNKNOWN" 
                isModal={true}
                onClose={() => setSelectedCard(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Required style for valid rendering, no imports needed */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.2);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
          }
        }
        @media (max-width: 767px) {
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .custom-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}} />
    </motion.div>
  );
}
