"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SniperHoldemLobby from '../components/experiences/SniperHoldem';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#080404] flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-700/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(127,29,29,0.3),transparent_70%)]" />
      </div>
      <Link
        href="/card-games"
        className="relative z-20 m-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-white w-fit"
      >
        <ArrowLeft size={14} /> Card Games
      </Link>
      <div className="relative z-10 flex-grow flex items-center justify-center p-4 pb-12">
        <SniperHoldemLobby />
      </div>
    </div>
  );
}
