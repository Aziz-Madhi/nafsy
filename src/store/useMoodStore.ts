import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { MoodEntry } from './types';

type ViewMode = 'graph' | 'calendar';

interface MoodState {
  // Mood State
  selectedMood: string;
  viewMode: ViewMode;
  moodEntries: MoodEntry[];
  
  // Actions
  setSelectedMood: (mood: string) => void;
  setViewMode: (mode: ViewMode) => void;
  addMoodEntry: (entry: Omit<MoodEntry, 'id'>) => void;
  updateMoodEntry: (id: string, entry: Partial<MoodEntry>) => void;
  deleteMoodEntry: (id: string) => void;
  clearSelectedMood: () => void;
}

export const useMoodStore = create<MoodState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    selectedMood: '',
    viewMode: 'graph',
    moodEntries: [],

    // Actions
    setSelectedMood: (mood) =>
      set({ selectedMood: mood }),

    setViewMode: (mode) =>
      set({ viewMode: mode }),

    addMoodEntry: (entry) =>
      set((state) => {
        const newEntry: MoodEntry = {
          ...entry,
          id: Date.now().toString(),
        };
        
        return {
          moodEntries: [...state.moodEntries, newEntry],
        };
      }),

    updateMoodEntry: (id, entry) =>
      set((state) => ({
        moodEntries: state.moodEntries.map((mood) =>
          mood.id === id ? { ...mood, ...entry } : mood
        ),
      })),

    deleteMoodEntry: (id) =>
      set((state) => ({
        moodEntries: state.moodEntries.filter((mood) => mood.id !== id),
      })),

    clearSelectedMood: () =>
      set({ selectedMood: '' }),
  }))
);

// Selectors
export const useSelectedMood = () =>
  useMoodStore((state) => state.selectedMood);

export const useViewMode = () =>
  useMoodStore((state) => state.viewMode);

export const useMoodEntries = () =>
  useMoodStore((state) => state.moodEntries);

// Computed selectors
export const useTodayMoodEntry = () =>
  useMoodStore((state) => {
    const today = new Date().toDateString();
    return state.moodEntries.find(
      (entry) => entry.date.toDateString() === today
    );
  });

export const useRecentMoodEntries = (days: number = 7) =>
  useMoodStore((state) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return state.moodEntries.filter(
      (entry) => entry.date >= cutoffDate
    );
  });