export enum GameType {
  MATCHING = 'MATCHING',
  TIMELINE = 'TIMELINE',
  QUIZ = 'QUIZ',
  PUZZLE = 'PUZZLE',
  CHARACTER = 'CHARACTER'
}

export interface HistoricalEvent {
  id: string;
  name: string;
  year: number; // or string like "1945"
  description: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface CharacterInfo {
  id: string;
  name: string;
  hints: string[]; // Ordered from Hard to Easy
  description: string;
}

export interface ParsedData {
  title: string;
  events: HistoricalEvent[];
  questions: QuizQuestion[];
  characters: CharacterInfo[];
  imageUrl?: string; // For puzzle
}

export interface GameConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  timeLimit: number; // in seconds
}

export interface PlayerScore {
  gameType: GameType;
  score: number;
  maxScore: number;
  timestamp: number;
}

export type ScreenState = 'WELCOME' | 'UPLOAD' | 'EDITOR' | 'MENU' | 'PLAYING' | 'RESULT';