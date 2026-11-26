import type { Metadata } from 'next';
import {
  Plus_Jakarta_Sans,
  Syne,
  Playfair_Display,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['600', '700'],
  variable: '--font-serif',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Reality Check — High-Stakes Strategy & Mindgames',
  description:
    '1v1 tactical duels, surreal mindgames, casino card tables, quizzes, and arcade gauntlets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${syne.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#0c0b0e] text-[#f5f0e6] font-sans antialiased overflow-x-hidden selection:bg-[#e6c27a]/30 selection:text-[#fff8e7]"
      >
        {children}
      </body>
    </html>
  );
}
