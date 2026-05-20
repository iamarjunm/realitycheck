'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Download, Share2, RotateCcw } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import type { RoleDef } from '../../../lib/quizzes';
import { loadLorSession, type LorSession } from '../../../lib/lor-session';
import { LorResultCard } from './LorResultCard';
import { LorFullReport } from './LorFullReport';

export function ResultScreen({ roleDef, secondaryRoleDef, quizName, quizId, userName, onRestart, isModal, onClose }: { roleDef: RoleDef, secondaryRoleDef: RoleDef | null, quizName: string, quizId: string, userName: string, onRestart?: () => void, isModal?: boolean, onClose?: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [cardId] = useState(() => Math.random().toString(36).substring(7).toUpperCase());
  const isRoast = quizId === 'roast';
  const [lorSession, setLorSession] = useState<LorSession | null>(null);

  React.useEffect(() => {
    if (quizId === 'lor') setLorSession(loadLorSession());
  }, [quizId]);


  const uniqueFeatures = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < cardId.length; i++) hash = cardId.charCodeAt(i) + ((hash << 5) - hash);
    const absHash = Math.abs(hash);
    return {
        hue: absHash % 360,
        pattern: absHash % 4,
        accent: `hsl(${absHash % 360}, 100%, 70%)`,
        cx: absHash % 100,
        cy: (absHash >> 2) % 100,
        rotation: (absHash >> 4) % 360,
        opacity: ((absHash >> 6) % 30) + 10,
        borderType: absHash % 3
    };
  }, [cardId]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { damping: 30, stiffness: 200 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { damping: 30, stiffness: 200 });
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [100, 0]), { damping: 30, stiffness: 200 });
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [100, 0]), { damping: 30, stiffness: 200 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  let containerAnim: any = { opacity: 1, x: 0, y: 0 };
  let cardInitial: any = { y: 0, scale: 1, rotateZ: 0, rotateX: 0, opacity: 0 };
  let cardAnim: any = { y: 0, scale: 1, rotateZ: 0, rotateX: 0, opacity: 1 };
  let cardTransition: any = { duration: 0.5, ease: "easeOut" };

  switch (quizId) {
    case 'npc':
      containerAnim = { opacity: 1 };
      cardInitial = { opacity: 0, scale: 0.9, filter: 'blur(10px)' };
      cardAnim = { opacity: 1, scale: 1, filter: 'blur(0px)' };
      cardTransition = { duration: 0.5, ease: "easeOut", delay: 0.2 };
      break;
    case 'liability':
      containerAnim = { 
        opacity: 1,
        x: [0, -20, 20, -10, 10, -5, 5, 0],
        y: [0, 20, -20, 10, -10, 5, -5, 0]
      };
      cardInitial = { y: -1000, rotateZ: -15, scale: 1.5, opacity: 1 };
      cardAnim = { y: 0, rotateZ: 0, scale: 1, opacity: 1 };
      cardTransition = { type: "spring", stiffness: 150, damping: 12, mass: 2, delay: 0.2 };
      break;
    case 'brainrot':
      containerAnim = { opacity: 1 };
      cardInitial = { scale: 0.1, rotateZ: 1080, opacity: 1 };
      cardAnim = { scale: 1, rotateZ: 0, opacity: 1 };
      cardTransition = { type: "spring", stiffness: 60, damping: 20, mass: 0.5, delay: 0.1 };
      break;
    case 'corp':
      containerAnim = { opacity: 1 };
      cardInitial = { y: 500, opacity: 0 };
      cardAnim = { y: 0, opacity: 1 };
      cardTransition = { duration: 1.5, ease: "easeOut", delay: 0.2 };
      break;
    case 'aesthetic':
      containerAnim = { opacity: 1 };
      cardInitial = { y: 20, opacity: 0, scale: 0.95 };
      cardAnim = { y: 0, opacity: 1, scale: 1 };
      cardTransition = { duration: 1.5, ease: "easeOut", delay: 0.5 };
      break;
    case 'lor':
      containerAnim = { opacity: 1 };
      cardInitial = { y: 600, rotateZ: 8, opacity: 0 };
      cardAnim = { y: 0, rotateZ: 0, opacity: 1 };
      cardTransition = { type: "spring", stiffness: 100, damping: 15, delay: 0.2 };
      break;
    case 'cosmic':
    default:
      containerAnim = { 
        opacity: 1,
        x: [0, -15, 15, -10, 10, -5, 5, 0],
        y: [0, 15, -15, 10, -10, 5, -5, 0]
      };
      cardInitial = { y: -1000, rotateZ: 75, rotateX: 45, scale: 0.2, opacity: 1 };
      cardAnim = { y: 0, rotateZ: 0, rotateX: 0, scale: 1, opacity: 1 };
      cardTransition = { type: "spring", stiffness: 80, damping: 10, mass: 1.2, delay: 0.3 };
      break;
  }

  const captureCard = async () => {
    const useFullReport = quizId === 'lor' && lorSession && reportRef.current;
    const targetNode = useFullReport ? reportRef.current : cardRef.current;
    if (!targetNode) return;
    
    let originalTransform = '';
    if (targetNode === cardRef.current && cardRef.current) {
      originalTransform = cardRef.current.style.transform;
      cardRef.current.style.transform = 'none';
    } else if (targetNode === reportRef.current && reportRef.current) {
      // Unhide the report ref temporarily for html2canvas/htmlToImage
      reportRef.current.style.position = 'absolute';
      reportRef.current.style.left = '0';
      reportRef.current.style.top = '0';
      reportRef.current.style.zIndex = '-1000';
      reportRef.current.style.visibility = 'visible';
    }

    try {
      const dataUrl = await htmlToImage.toPng(targetNode, {
        quality: 1,
        pixelRatio: 2,
        style: { transform: 'none' },
        width: targetNode.scrollWidth,
        height: targetNode.scrollHeight,
      });

      const link = document.createElement('a');
      link.download =
        quizId === 'lor'
          ? `thriftz-lor-report-${userName.toLowerCase().replace(/\s+/g, '-')}.png`
          : `stat-card-${userName.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.warn('Failed to generate image', err);
    } finally {
      if (targetNode === cardRef.current && cardRef.current) {
        cardRef.current.style.transform = originalTransform;
      } else if (targetNode === reportRef.current && reportRef.current) {
        reportRef.current.style.position = 'fixed';
        reportRef.current.style.left = '-9999px';
        reportRef.current.style.visibility = 'hidden';
      }
    }
  };

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Stat Card',
          text: `Module: ${quizName} | Result: ${roleDef.title}. What's yours?`,
          url: window.location.href,
        });
      } catch (err) {
        console.warn('Share failed', err);
      }
    } else {
      captureCard();
    }
  };

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={containerAnim}
      transition={{ 
        duration: 0.6, 
        delay: 0.25, 
        ease: "easeInOut" 
      }}
      className="z-10 flex flex-col items-center w-full px-4 relative my-auto mt-8 sm:mt-auto"
      style={{ maxWidth: 'min(384px, 100%, max(280px, calc((100vh - 220px) * 0.75)))' }}
    >
      <div className="mb-4 text-center z-10 shrink-0">
        <motion.h3 
          initial={{ opacity: 0, y: -20, scale: 2 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="text-zinc-500 font-mono text-sm uppercase tracking-widest mb-2 shadow-black drop-shadow-md"
        >
          Analysis Complete
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-white font-medium drop-shadow-lg"
        >
          {roleDef.resultText}
        </motion.p>
      </div>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        {(quizId === 'cosmic' || quizId === 'liability') && (
          <>
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 4, 8], opacity: [1, 0.8, 0] }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              className={`w-[300px] h-[300px] rounded-full blur-[60px] bg-gradient-to-t ${roleDef.theme}`}
            />
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 2, 4], opacity: [1, 0.5, 0] }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.25 }}
              className="absolute w-[200px] h-[200px] rounded-full blur-[40px] bg-white mix-blend-overlay"
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute inset-0 bg-white z-50 mix-blend-overlay"
            />
          </>
        )}
        {quizId === 'npc' && (
           <motion.div 
             initial={{ opacity: 1 }}
             animate={{ opacity: 0 }}
             transition={{ duration: 0.5, delay: 0.5 }}
             className="absolute inset-0 bg-green-500/20 z-50 mix-blend-color-dodge"
           />
        )}
        {quizId === 'brainrot' && (
           <motion.div 
             initial={{ opacity: 1, scale: 0 }}
             animate={{ opacity: 0, scale: 10 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="absolute w-20 h-20 bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] rounded-full blur-[20px]"
           />
        )}
      </div>

      <div className="w-full aspect-[3/4] perspective-[1000px] mb-8 relative z-20">        
        {/* Card wrapper */}
        <motion.div 
          initial={cardInitial}
          animate={cardAnim}
          transition={cardTransition}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            id="stat-card"
            ref={cardRef}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className={`w-full h-full relative p-4 sm:p-6 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-md ${
              isRoast ? 'bg-zinc-950 border-[3px] border-orange-900/50 rounded-sm outline outline-1 outline-offset-4 outline-orange-600/30' :
              roleDef.rarity === 'glitched' ? 'glitch-anim bg-black border-4 border-green-500 rounded-lg skew-x-1 outline outline-4 outline-fuchsia-500/50' :
              roleDef.rarity === 'abyssal' ? 'border-2 border-red-900 bg-black rounded-[100px] shadow-[0_0_100px_rgba(220,38,38,0.5)]' :
              roleDef.rarity === 'mythic' ? 'border-b-8 border-x-4 border-white bg-white/95 rounded-none shadow-[0_0_80px_rgba(255,255,255,0.4)]' :
              `rounded-2xl border-2 bg-gradient-to-b ${roleDef.theme}`
            }`}
          >
            {roleDef.rarity === 'legendary' && <div className="bg-starburst z-0"></div>}

          <motion.div 
            className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-60"
            style={{ background: useTransform([glareX, glareY], ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.8) 0%, transparent 60%)`) }}
          />

          {roleDef.rarity !== 'mythic' && <div className="absolute inset-0 card-noise z-10" />}
          <div className={`absolute inset-0 ${getFoilClass(roleDef.rarity)} z-10 pointer-events-none`} />
          
          <div 
               className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay opacity-50"
               style={{
                 filter: `hue-rotate(${uniqueFeatures.hue}deg)`,
                 backgroundImage: uniqueFeatures.pattern === 0 ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' :
                                  uniqueFeatures.pattern === 1 ? 'radial-gradient(circle at center, rgba(255,255,255,0.2) 2px, transparent 2.5px)' :
                                  uniqueFeatures.pattern === 2 ? 'repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(255,255,255,0.15) 5px, rgba(255,255,255,0.15) 10px)' :
                                  'none',
                 backgroundSize: uniqueFeatures.pattern === 1 ? '20px 20px' : 'auto'
               }}
            />

          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-overlay" style={{ opacity: uniqueFeatures.opacity / 100 }}>
               <div className="absolute rounded-full border border-white" style={{ left: `${uniqueFeatures.cx}%`, top: `${uniqueFeatures.cy}%`, width: '150%', height: '150%', transform: 'translate(-50%, -50%)' }}></div>
               <div className="absolute border border-white" style={{ left: `${100 - uniqueFeatures.cx}%`, top: `${100 - uniqueFeatures.cy}%`, width: '100%', height: '100%', transform: `translate(-50%, -50%) rotate(${uniqueFeatures.rotation}deg)` }}></div>
            </div>
          
          {quizId === 'lor' ? (
            <LorResultCard roleDef={roleDef} userName={userName} cardId={cardId} quizName={quizName} />
          ) : isRoast ? (
            <div className="relative z-30 h-full flex flex-col p-1 sm:p-2 overflow-hidden" style={{ transform: 'translateZ(35px)' }}>
               {/* ROAST INTERNAL STRUCTURE */}
               {/* Animated fire glow background */}
               <motion.div 
                 className="absolute inset-0 bg-gradient-to-b from-orange-600/10 to-red-600/5 pointer-events-none"
                 animate={{ opacity: [0.3, 0.6, 0.3] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               />
               
               {/* Animated crackling embers */}
               <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                 {Array.from({ length: 12 }).map((_, i) => (
                   <motion.div
                     key={i}
                     initial={{ y: `${100 + Math.random() * 50}%`, opacity: 0, left: `${Math.random() * 100}%` }}
                     animate={{ 
                       y: `-${20 + Math.random() * 30}%`, 
                       opacity: [0, Math.random() * 0.6 + 0.2, 0],
                       x: `${(Math.random() * 40) - 20}px` 
                     }}
                     transition={{
                       duration: 3 + Math.random() * 4,
                       repeat: Infinity,
                       delay: Math.random() * 5,
                       ease: "linear"
                     }}
                     className="absolute top-0 w-1 h-1 bg-orange-400 rounded-full blur-[0.5px]"
                     style={{
                       boxShadow: "0 0 6px 1px rgba(249, 115, 22, 0.6)",
                     }}
                   />
                 ))}
               </div>

               {/* Animated glowing inner border */}
               <motion.div 
                 className="absolute inset-0 border border-orange-500/30 m-2 mix-blend-overlay pointer-events-none"
                 animate={{ 
                   borderColor: ['rgba(234,88,12,0.3)', 'rgba(234,88,12,0.6)', 'rgba(239,68,68,0.4)', 'rgba(234,88,12,0.3)'],
                   boxShadow: ['0 0 10px rgba(234,88,12,0.3)', '0 0 20px rgba(239,68,68,0.5)', '0 0 10px rgba(234,88,12,0.3)']
                 }}
                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               />

               <div className="flex justify-between items-start mb-2 mt-1 px-2 relative z-10">
                 <div className="flex gap-2 items-center">
                   <motion.div 
                     className="p-2 bg-orange-950/80 rounded-sm border border-orange-600/50 shadow-[0_0_15px_rgba(234,88,12,0.6)]"
                     animate={{ 
                       boxShadow: ['0 0 15px rgba(234,88,12,0.6)', '0 0 25px rgba(239,68,68,0.8)', '0 0 15px rgba(234,88,12,0.6)']
                     }}
                     transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   >
                     {roleDef.icon}
                   </motion.div>
                   <div>
                     <p className="text-[8px] font-mono text-orange-500/70 tracking-widest uppercase">{quizName}</p>
                     <p className="text-[10px] font-bold font-mono text-orange-400 capitalize drop-shadow-md">{roleDef.subtitle}</p>
                   </div>
                 </div>
                 <motion.div 
                   className="text-[10px] font-mono text-red-500 bg-red-950/50 px-2 py-1 rounded-sm border border-red-900 shadow-inner"
                   animate={{ opacity: [0.7, 1, 0.7] }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                 >
                   ID:{cardId}
                 </motion.div>
               </div>
               
               <div className="flex flex-col mt-4 sm:mt-6 px-2 text-center items-center relative z-10">
                 <motion.h2 
                   className={`text-3xl sm:text-4xl font-black uppercase tracking-tighter ${roleDef.textClass} drop-shadow-[0_0_15px_rgba(234,88,12,0.8)] leading-[1.1]`}
                   animate={{ 
                     textShadow: [
                       'drop-shadow(0 4px 10px rgba(0,0,0,0.8))',
                       'drop-shadow(0 4px 15px rgba(234,88,12,0.6))',
                       'drop-shadow(0 4px 20px rgba(239,68,68,0.5))',
                       'drop-shadow(0 4px 10px rgba(0,0,0,0.8))'
                     ]
                   }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   style={{ 
                     filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.8))',
                     letterSpacing: '0.05em'
                   }}
                 >
                   {roleDef.title}
                 </motion.h2>
               </div>
               
               <motion.div 
                 className="px-3 py-3 mt-4 sm:mt-6 bg-zinc-950/90 border-y border-orange-900/60 shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative"
                 animate={{ 
                   borderColor: ['rgba(180,83,9,0.6)', 'rgba(192,132,250,0.4)', 'rgba(180,83,9,0.6)']
                 }}
                 transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
               >
                 <motion.div 
                   className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-600 via-red-600 to-orange-600"
                   animate={{ opacity: [0.6, 1, 0.6] }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                 />
                 <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed italic opacity-90 relative z-20">{roleDef.description}</p>
               </motion.div>
               
               <div className="mt-auto px-2 pb-2 relative z-10">
                 <motion.div 
                   className="space-y-2 mb-3 bg-red-950/20 p-3 rounded border border-red-900/30"
                   animate={{ 
                     borderColor: ['rgba(127,29,29,0.3)', 'rgba(234,88,12,0.5)', 'rgba(127,29,29,0.3)']
                   }}
                   transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                 >
                   {roleDef.stats.map((stat, i) => (
                     <motion.div 
                       key={i} 
                       className="flex flex-col gap-1"
                       whileHover={{ scale: 1.02 }}
                       transition={{ type: "spring", stiffness: 200 }}
                     >
                       <div className="flex justify-between text-[9px] sm:text-[10px] uppercase font-mono tracking-wider">
                         <span className="text-orange-300/80">{stat.label}</span>
                         <motion.span 
                           className="text-red-400 font-bold"
                           animate={{ color: ['rgba(248,113,113,1)', 'rgba(234,88,12,1)', 'rgba(248,113,113,1)'] }}
                           transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                         >
                           {typeof stat.val === 'number' ? `${stat.val}` : stat.val}
                         </motion.span>
                       </div>
                       <div className="h-1.5 w-full bg-zinc-900 rounded-sm overflow-hidden flex justify-start border border-orange-900/20 shadow-inner">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: typeof stat.val === 'number' ? `${stat.val}%` : '100%' }}
                           transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: "easeOut" }}
                           className={`h-full bg-gradient-to-r from-orange-600 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]`}
                         />
                       </div>
                     </motion.div>
                   ))}
                 </motion.div>
                 
                 <motion.div 
                   className="flex justify-between items-center px-1"
                   whileHover={{ x: 2 }}
                 >
                   {secondaryRoleDef ? (
                     <div className="text-[9px] sm:text-[10px] text-zinc-400 font-mono">
                       <span className="text-orange-500">Tainted by:</span> {secondaryRoleDef.title}
                     </div>
                   ) : (
                     <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">{userName}</div>
                   )}
                   <motion.div 
                     className="text-[8px] text-orange-700/50 font-mono border border-orange-900/30 px-1"
                     animate={{ opacity: [0.5, 0.8, 0.5], textShadow: ['0 0 5px rgba(234,88,12,0)', '0 0 8px rgba(234,88,12,0.4)', '0 0 5px rgba(234,88,12,0)'] }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                   >
                     IRREDEEMABLE_INDEX_V1
                   </motion.div>
                 </motion.div>
               </div>
            </div>
          ) : (
            <>
          {/* ABYSSAL INTERNAL STRUCTURE */}
          {roleDef.rarity === 'abyssal' && (
             <div className="relative z-30 h-full flex flex-col items-center justify-center text-center -mx-4" style={{ transform: 'translateZ(50px)' }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] z-0 rounded-full mix-blend-multiply"></div>
                <div className="z-10 bg-red-950/40 p-6 rounded-full border border-red-900 shadow-[inset_0_0_50px_rgba(0,0,0,1)] mix-blend-screen scale-110 mb-8 mt-4 animate-[pulse_3s_infinite]">
                   {roleDef.icon}
                </div>
                <h2 className="z-10 text-4xl sm:text-5xl font-black uppercase tracking-widest text-red-600 mb-2 mt-4 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] scale-y-110">{roleDef.title}</h2>
                <p className="z-10 text-[9px] sm:text-[10px] font-mono text-red-800 uppercase tracking-widest mb-4 border-b border-red-900/50 pb-2">{roleDef.subtitle}</p>
                <p className="z-10 text-xs sm:text-sm text-red-700/80 leading-relaxed font-sans px-8">{roleDef.description}</p>
                
                <div className="z-10 flex flex-col gap-3 w-full px-8 opacity-80 mt-auto mb-16">
                  {roleDef.stats.map((stat, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] sm:text-xs uppercase font-mono text-red-500 border-b border-red-950 pb-1">
                       <span>{stat.label}</span>
                       <span className="font-black drop-shadow-[0_0_5px_currentColor]">{stat.val}</span>
                    </div>
                  ))}
                </div>
                
                <div className="absolute bottom-6 text-[8px] text-red-900 font-mono tracking-tighter opacity-50">ENTITY_ID: {cardId}</div>
             </div>
          )}

          {/* MYTHIC INTERNAL STRUCTURE */}
          {roleDef.rarity === 'mythic' && (
             <div className="relative z-30 h-full flex flex-col items-center justify-between p-2 -mx-2 -my-2" style={{ transform: 'translateZ(40px)' }}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,1)_0%,rgba(200,200,200,0.5)_100%)] z-0 mix-blend-overlay pointer-events-none"></div>
                <div className="z-10 w-full flex justify-between p-2 font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-black/50 border-b border-black/10">
                   <span>{quizName}</span>
                   <span>{cardId}</span>
                </div>
                
                <div className="z-10 flex-1 flex flex-col items-center justify-center w-full mt-4">
                   <div className="p-8 rounded-full bg-black/5 shadow-[0_0_50px_rgba(255,255,255,1)] text-black mb-6">
                      {roleDef.icon}
                   </div>
                   <h2 className="text-3xl sm:text-4xl font-serif italic text-black tracking-tighter mb-2 mix-blend-difference drop-shadow-md text-center">{roleDef.title}</h2>
                   <div className="text-[10px] sm:text-xs font-mono font-bold text-black/40 uppercase tracking-widest mb-4">{roleDef.subtitle}</div>
                   <p className="text-black/60 text-[10px] sm:text-xs text-center px-4 leading-relaxed font-sans border-t border-black/10 pt-4 max-w-[90%]">{roleDef.description}</p>
                </div>
                
                <div className="z-10 w-[105%] bg-black/5 p-4 mt-auto border border-black/10">
                  {roleDef.stats.map((stat, i) => (
                    <div key={i} className="flex justify-between items-center text-[9px] sm:text-[10px] uppercase font-mono text-black/70 mb-1.5 border-black/5 border-b last:border-b-0 pb-1.5">
                       <span>{stat.label}</span>
                       <div className="w-1/2 h-1 bg-black/10 rounded-full overflow-hidden flex justify-end">
                         <div className="h-full bg-black/50" style={{ width: `${stat.val}%` }}></div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {/* GLITCHED INTERNAL STRUCTURE */}
          {roleDef.rarity === 'glitched' && (
             <div className="relative z-30 h-full flex flex-col p-2" style={{ transform: 'translateZ(30px)' }}>
                <div className="absolute -inset-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] mix-blend-overlay opacity-30 z-0 scale-150 animate-[pulse_0.4s_infinite]"></div>
                
                <h2 className="text-5xl sm:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-fuchsia-600 absolute top-20 left-[-20px] rotate-[-10deg] scale-150 mix-blend-screen opacity-40 z-0 blur-[4px] pointer-events-none">{roleDef.title}</h2>
                
                <div className="z-10 border-l-8 border-green-500 pl-4 mt-4 sm:mt-5 mb-3 relative bg-black/40 backdrop-blur-md pb-3 pt-2 -ml-2">
                   <div className="text-green-400 mix-blend-screen bg-green-900/40 p-2 sm:p-2.5 border border-green-500/50 w-fit animate-[pulse_0.2s_infinite] mb-3 sm:mb-4 shadow-[6px_4px_0_rgba(34,197,94,0.5)] skew-x-6">
                      {roleDef.icon}
                   </div>
                   <h2 className="text-3xl font-black font-mono text-white mb-1 shadow-[3px_3px_0_rgba(255,0,255,0.8)] tracking-tighter skew-x-[-2deg]">{roleDef.title}</h2>
                   <p className="text-[10px] sm:text-[11px] font-mono text-green-400 uppercase tracking-widest bg-black/80 px-2 py-1 w-fit">{roleDef.subtitle}</p>
                   <div className="absolute top-0 right-4 text-[8px] font-mono text-fuchsia-500 opacity-50 text-right mt-2">{quizName}<br/>SYS_ERR</div>
                </div>
                
                <div className="z-10 mb-4 bg-fuchsia-900/30 p-3 border-y-2 border-r-4 border-fuchsia-500/50 -skew-x-6 backdrop-blur-sm -ml-4 pl-6 w-[105%] shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                   <p className="text-[11px] sm:text-xs font-mono text-fuchsia-200 leading-tight">{roleDef.description}</p>
                </div>
                
                <div className="flex-grow"></div>
                
                <div className="z-10 grid grid-cols-2 gap-2 mb-3">
                   {roleDef.stats.map((stat, i) => (
                     <div key={i} className="bg-green-950/80 border border-green-500/50 p-2 sm:p-2.5 rotate-[1deg] hover:rotate-0 hover:scale-105 transition-transform flex flex-col justify-center">
                        <div className="text-[8px] sm:text-[9px] text-green-400 font-mono uppercase mb-0.5 opacity-80">{stat.label}</div>
                        <div className="text-lg sm:text-xl font-black text-white font-mono drop-shadow-[2px_2px_0_rgba(34,197,94,0.5)]">{stat.val}</div>
                     </div>
                   ))}
                </div>
                <div className="text-center text-[10px] sm:text-xs text-fuchsia-500 font-mono uppercase font-bold animate-[pulse_0.1s_infinite] bg-black py-1">!CORRUPTION_DETECTED_0X{cardId}</div>
             </div>
          )}

          {/* STANDARD INTERNAL STRUCTURE */}
          {!['abyssal', 'mythic', 'glitched', 'roast'].includes(roleDef.rarity) && !isRoast && (
            <div className="relative z-30 h-full flex flex-col" style={{ transform: 'translateZ(30px)' }}>
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg bg-black/40 border border-white/10 shadow-lg ${roleDef.textClass}`}>
                  {roleDef.icon}
                </div>
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs font-mono text-white/50 tracking-widest uppercase">Entity: {userName.substring(0, 15)}</div>
                  <div className={`text-xs font-mono font-bold ${roleDef.textClass}`}>
                    {roleDef.subtitle}
                    {secondaryRoleDef && <><br/>Hybrid: {secondaryRoleDef.title}</>}
                  </div>
                  <div className="text-[8px] sm:text-[9px] font-mono text-white/30 uppercase tracking-widest mt-0.5">{quizName}</div>
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none mb-2 ${roleDef.textClass}`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  {roleDef.title}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans drop-shadow-md bg-black/20 p-2 rounded-md border border-white/5">
                  {roleDef.description}
                </p>
              </div>
              
              {secondaryRoleDef && (
                <div className="mb-2 sm:mb-3">
                  <div className="text-[9px] text-white/50 uppercase font-mono mb-1 tracking-widest">Detected Anomalies:</div>
                  <div className={`text-[9px] sm:text-[10px] font-bold ${secondaryRoleDef.textClass} bg-black/40 p-1.5 sm:p-2 rounded border border-white/10 shadow-inner`}>
                    Traces of [{secondaryRoleDef.title}]: {secondaryRoleDef.passive}
                  </div>
                </div>
              )}

              <div className="flex-grow"></div>

              <div className="space-y-2 sm:space-y-3 bg-black/60 p-3 sm:p-4 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
                {roleDef.stats.map((stat, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] sm:text-xs font-mono uppercase tracking-widest">
                      <span className="text-white/80">{stat.label}</span>
                      <span className="text-white font-bold">{stat.val}/100</span>
                    </div>
                    {/* Progress bar container */}
                    <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden border border-black shadow-inner">
                      {/* The fill bar */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.val}%` }}
                        transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: "easeOut" }}
                        className={`h-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)] rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 bg-black/40 rounded-lg border border-white/10 flex flex-col shadow-md">
                <span className="text-[9px] text-white/50 uppercase font-mono mb-1 tracking-widest">Passive Ability</span>
                <span className={`text-xs sm:text-sm font-bold ${roleDef.textClass} drop-shadow-md`}>{roleDef.passive}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-end text-[8px] sm:text-[9px] font-mono text-white/50">
                <div className="flex flex-col gap-1">
                  <span>SYSTEM v3.0 // {roleDef.rarity.toUpperCase()}</span>
                  <span>ID: {cardId}</span>
                </div>
                <div className="tracking-tighter text-sm opacity-60 flex right-0">
                  █║▌│█│║▌║││█║▌
                </div>
              </div>
            </div>
          )}
            </>
          )}
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="flex w-full gap-2 mt-2 z-10"
      >
        <button 
          onClick={captureCard}
          className="flex-1 py-3 bg-white text-black font-bold uppercase rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          <Download className="w-4 h-4" /> {quizId === 'lor' ? 'Full report' : 'Save'}
        </button>
        {!isModal && (
          <button 
            onClick={shareCard}
            className="flex-1 py-3 bg-cyan-500 text-black font-bold uppercase rounded-lg hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        )}
        {isModal ? (
          <button 
            onClick={onClose}
            className="py-3 px-6 bg-red-600 text-white font-bold uppercase rounded-lg hover:bg-red-500 transition-colors text-sm shadow-md"
          >
            Close
          </button>
        ) : (
          <button 
            onClick={() => onRestart && onRestart()}
            className="py-3 px-4 bg-zinc-800 text-white font-bold uppercase rounded-lg hover:bg-zinc-700 transition-colors text-sm border border-zinc-600 shadow-md"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </motion.div>

    {quizId === 'lor' && lorSession && (
      <div ref={reportRef} className="fixed left-[-9999px] top-0" style={{ visibility: 'hidden' }}>
        <LorFullReport roleDef={roleDef} userName={userName} cardId={cardId} session={lorSession} quizName={quizName} />
      </div>
    )}
  </motion.div>
  );
}
