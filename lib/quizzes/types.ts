import type React from 'react';

export type RoleDef = {
  title: string;
  subtitle: string;
  description: string;
  stats: { label: string; val: number }[];
  theme: string;
  textClass: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'glitched' | 'mythic' | 'abyssal';
  resultText: string;
  passive: string;
};

export interface Answer {
  text: string;
  points: Record<string, number>;
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[];
  depth?: number;
}

export interface QuizDef {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  roles: Record<string, RoleDef>;
  questions: Question[];
  type?: 'standard' | 'rapid-fire' | 'trick' | 'infinite' | 'profile';
  hidden?: boolean;
  password?: string;
}
