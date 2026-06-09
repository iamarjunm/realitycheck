"use client";

import { useRouter } from 'next/navigation';
import SniperHoldemLobby from '../components/experiences/SniperHoldem';

export default function Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex flex-col bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      <div className="flex justify-start px-8 pt-8 relative z-20">
        <button onClick={() => router.push('/')} className="text-zinc-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-white/10">
          &lt; Back to Experiments
        </button>
      </div>
      <div className="flex-grow flex items-center justify-center p-4">
        <SniperHoldemLobby />
      </div>
    </div>
  );
}
