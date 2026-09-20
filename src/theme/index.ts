import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useStore } from '../store/useStore';
import type { ThemeName } from '../types';

export interface Palette {
  name: ThemeName;
  bg: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  green: string;
  danger: string;
  backdrop: string;
  chip: string;
  chipOn: string;
  chipOnText: string;
}

export const LIGHT: Palette = {
  name: 'light',
  bg: '#F4F7F8',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border: '#E3E8EB',
  borderStrong: '#C9D2D7',
  text: '#0F1B20',
  textMuted: '#4E5F68',
  textFaint: '#8A9AA3',
  accent: '#0E8F8E',
  accentSoft: '#DDF3F2',
  green: '#22C55E',
  danger: '#DC2626',
  backdrop: 'rgba(8, 20, 24, 0.55)',
  chip: '#EAF0F2',
  chipOn: '#0E8F8E',
  chipOnText: '#FFFFFF',
};

export const DARK: Palette = {
  name: 'dark',
  bg: '#0B1418',
  surface: '#132026',
  surfaceRaised: '#19292F',
  border: '#213139',
  borderStrong: '#31454E',
  text: '#EAF2F4',
  textMuted: '#9DB0B8',
  textFaint: '#66787F',
  accent: '#2FC4C1',
  accentSoft: '#12393B',
  green: '#34D399',
  danger: '#F87171',
  backdrop: 'rgba(0, 0, 0, 0.65)',
  chip: '#1D2E35',
  chipOn: '#2FC4C1',
  chipOnText: '#06201F',
};

const ThemeContext = createContext<Palette>(LIGHT);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const os = useColorScheme();
  const pref = useStore((s) => s.theme);
  const palette = useMemo(() => {
    const name = pref ?? (os === 'dark' ? 'dark' : 'light');
    return name === 'dark' ? DARK : LIGHT;
  }, [pref, os]);
  return React.createElement(ThemeContext.Provider, { value: palette }, children);
}

export const useTheme = (): Palette => useContext(ThemeContext);

export const radius = { sm: 8, md: 12, lg: 16, xl: 22 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
