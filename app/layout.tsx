import type {Metadata} from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Reality Check // Tactical Arcade & Mindgames',
  description: 'High-stakes 1v1 tactical arenas, psychological card tables, diagnostic quizzes, and dark-OS mindgames.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-[#04050a] text-white font-sans antialiased overflow-x-hidden selection:bg-cyan-500/30">
        <div className="scanlines"></div>
        {children}
      </body>
    </html>
  );
}
