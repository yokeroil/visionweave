import { create } from 'zustand';

interface StyleState {
  genres: string[];
  moods: string[];
  quizRound: number;
  quizComplete: boolean;
  styleVector: Record<string, number> | null;
  styleSummary: string;
  setGenres: (g: string[]) => void;
  setMoods: (m: string[]) => void;
  nextRound: () => void;
  setQuizComplete: (v: boolean) => void;
  setStyleVector: (v: Record<string, number>, summary: string) => void;
  resetQuiz: () => void;
}

export const useStyleStore = create<StyleState>((set) => ({
  genres: [],
  moods: [],
  quizRound: 0,
  quizComplete: false,
  styleVector: null,
  styleSummary: '',
  setGenres: (genres) => set({ genres }),
  setMoods: (moods) => set({ moods }),
  nextRound: () => set((s) => ({ quizRound: s.quizRound + 1 })),
  setQuizComplete: (v) => set({ quizComplete: v }),
  setStyleVector: (styleVector, styleSummary) => set({ styleVector, styleSummary }),
  resetQuiz: () => set({ genres: [], moods: [], quizRound: 0, quizComplete: false, styleVector: null, styleSummary: '' }),
}));
