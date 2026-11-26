import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Reality Check — Multiplayer Strategy & Mindgames',
  description:
    'Real-time 1v1 tactical arenas, high-stakes card tables, quizzes, and interactive experiments.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#09090b] text-zinc-50 font-sans antialiased overflow-x-hidden selection:bg-zinc-700 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
