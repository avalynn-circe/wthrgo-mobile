import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Activity, City, ConsentState, IntervalSize, TempUnit, ThemeName } from '../types';

export const STORAGE_KEY = 'wthrgo-v1';
export const MAX_RECENT_CITIES = 8;

export const DEFAULT_SLOTS: Record<IntervalSize, number[]> = {
  3: [6, 9, 12, 15, 18, 21],
  1: Array.from({ length: 17 }, (_, i) => i + 6), // 6a .. 10p
};

export interface PersistedState {
  city: City | null;
  recentCities: City[];
  activities: Activity[];
  tempUnit: TempUnit;
  /** null = follow the OS. */
  theme: ThemeName | null;
  forecastDays: number;
  intervalSize: IntervalSize;
  displaySlots: number[];
  consent: ConsentState;
}

interface Actions {
  setCity: (city: City | null) => void;
  addActivity: (a: Activity) => void;
  updateActivity: (a: Activity) => void;
  removeActivity: (id: string) => void;
  toggleActivity: (id: string, enabled?: boolean) => void;
  setTempUnit: (u: TempUnit) => void;
  setTheme: (t: ThemeName | null) => void;
  setForecastDays: (d: number) => void;
  setIntervalSize: (s: IntervalSize) => void;
  toggleSlot: (hour: number) => void;
  setConsent: (c: ConsentState) => void;

  // --- ephemeral (not persisted) ---
  focusedActivityId: string | null;
  setFocusedActivity: (id: string | null) => void;
  hydrated: boolean;
  setHydrated: () => void;
}

export type StoreState = PersistedState & Actions;

const initial: PersistedState = {
  city: null,
  recentCities: [],
  activities: [],
  tempUnit: 'F',
  theme: null,
  forecastDays: 7,
  intervalSize: 3,
  displaySlots: DEFAULT_SLOTS[3],
  consent: null,
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...initial,
      focusedActivityId: null,
      hydrated: false,

      setCity: (city) =>
        set((s) => {
          if (!city) return { city: null };
          const recent = [city, ...s.recentCities.filter((c) => c.id !== city.id)].slice(0, MAX_RECENT_CITIES);
          return { city, recentCities: recent };
        }),
      addActivity: (a) => set((s) => ({ activities: [...s.activities, a] })),
      updateActivity: (a) =>
        set((s) => ({
          activities: s.activities.map((x) => (x.id === a.id ? { ...a, updatedAt: Date.now() } : x)),
        })),
      removeActivity: (id) =>
        set((s) => ({
          activities: s.activities.filter((x) => x.id !== id),
          focusedActivityId: s.focusedActivityId === id ? null : s.focusedActivityId,
        })),
      toggleActivity: (id, enabled) =>
        set((s) => ({
          activities: s.activities.map((x) =>
            x.id === id ? { ...x, enabled: enabled ?? !x.enabled, updatedAt: Date.now() } : x,
          ),
        })),
      setTempUnit: (tempUnit) => set({ tempUnit }),
      setTheme: (theme) => set({ theme }),
      setForecastDays: (d) => set({ forecastDays: Math.min(16, Math.max(1, Math.round(d))) }),
      setIntervalSize: (intervalSize) =>
        set((s) =>
          s.intervalSize === intervalSize
            ? {}
            : { intervalSize, displaySlots: DEFAULT_SLOTS[intervalSize] },
        ),
      toggleSlot: (hour) =>
        set((s) => {
          const has = s.displaySlots.includes(hour);
          const next = has ? s.displaySlots.filter((h) => h !== hour) : [...s.displaySlots, hour];
          return { displaySlots: next.sort((a, b) => a - b) };
        }),
      setConsent: (consent) => set({ consent }),

      setFocusedActivity: (focusedActivityId) => set({ focusedActivityId }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Exactly what gets persisted — swap the storage adapter later for sync.
      partialize: (s): PersistedState => ({
        city: s.city,
        recentCities: s.recentCities,
        activities: s.activities,
        tempUnit: s.tempUnit,
        theme: s.theme,
        forecastDays: s.forecastDays,
        intervalSize: s.intervalSize,
        displaySlots: s.displaySlots,
        consent: s.consent,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
