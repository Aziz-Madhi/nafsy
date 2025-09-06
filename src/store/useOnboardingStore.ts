import { createStore } from '~/lib/store-factory';
import { shallow } from 'zustand/shallow';

export interface OnboardingAnswers {
  name?: string;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  moodRating?: number; // 1-10
  goals: string[]; // wellness goals selected
  selfImage: string[]; // how they see themselves
  moodMonth?: string | null; // overall mood for last month
  helpAreas: string[]; // what the app should help with
  fears: string[]; // concerns/fears
  struggles: string[]; // day-to-day struggles
  additionalNotes?: string | null; // optional free-form notes
}

interface OnboardingStoreState extends OnboardingAnswers {
  step: number; // current step index for UI control if needed
  setField: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  toggleArrayValue: (
    key: 'goals' | 'selfImage' | 'helpAreas' | 'fears' | 'struggles',
    value: string
  ) => void;
  reset: () => void;
}

const defaults: Pick<
  OnboardingStoreState,
  | 'name'
  | 'age'
  | 'gender'
  | 'moodRating'
  | 'goals'
  | 'selfImage'
  | 'moodMonth'
  | 'helpAreas'
  | 'fears'
  | 'struggles'
  | 'step'
> = {
  name: undefined,
  age: null,
  gender: null,
  moodRating: undefined,
  goals: [],
  selfImage: [],
  moodMonth: null,
  helpAreas: [],
  fears: [],
  struggles: [],
  additionalNotes: null,
  step: 0,
};

export const useOnboardingStore = createStore<OnboardingStoreState>((set, get) => ({
    ...defaults,
    setField: (key, value) => set({ [key]: value } as any),
    toggleArrayValue: (key, value) => {
      const current = get()[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      set({ [key]: next } as any);
    },
    reset: () => set({ ...defaults }),
  }));

export const useOnboardingAnswers = () =>
  useOnboardingStore(
    (s) => ({
      name: s.name,
      age: s.age,
      gender: s.gender,
      moodRating: s.moodRating,
      goals: s.goals,
      selfImage: s.selfImage,
      moodMonth: s.moodMonth,
      helpAreas: s.helpAreas,
      fears: s.fears,
      struggles: s.struggles,
      additionalNotes: s.additionalNotes,
    }),
    shallow
  );

export const useOnboardingActions = () =>
  useOnboardingStore(
    (s) => ({
      setField: s.setField,
      toggleArrayValue: s.toggleArrayValue,
      reset: s.reset,
    }),
    shallow
  );
