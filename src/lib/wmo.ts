import type { PrecipType } from '../types';

interface WmoEntry {
  label: string;
  emoji: string;
  nightEmoji?: string;
}

/** WMO 4677 weather interpretation codes as used by Open-Meteo. */
const WMO: Record<number, WmoEntry> = {
  0: { label: 'Clear', emoji: '☀️', nightEmoji: '🌙' },
  1: { label: 'Mostly clear', emoji: '🌤️', nightEmoji: '🌙' },
  2: { label: 'Partly cloudy', emoji: '⛅', nightEmoji: '☁️' },
  3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Fog', emoji: '🌫️' },
  48: { label: 'Icy fog', emoji: '🌫️' },
  51: { label: 'Light drizzle', emoji: '🌦️' },
  53: { label: 'Drizzle', emoji: '🌦️' },
  55: { label: 'Heavy drizzle', emoji: '🌧️' },
  56: { label: 'Freezing drizzle', emoji: '🌧️' },
  57: { label: 'Heavy freezing drizzle', emoji: '🌧️' },
  61: { label: 'Light rain', emoji: '🌦️' },
  63: { label: 'Rain', emoji: '🌧️' },
  65: { label: 'Heavy rain', emoji: '🌧️' },
  66: { label: 'Freezing rain', emoji: '🌧️' },
  67: { label: 'Heavy freezing rain', emoji: '🌧️' },
  71: { label: 'Light snow', emoji: '🌨️' },
  73: { label: 'Snow', emoji: '❄️' },
  75: { label: 'Heavy snow', emoji: '❄️' },
  77: { label: 'Snow grains', emoji: '🌨️' },
  80: { label: 'Light showers', emoji: '🌦️' },
  81: { label: 'Showers', emoji: '🌧️' },
  82: { label: 'Heavy showers', emoji: '⛈️' },
  85: { label: 'Snow showers', emoji: '🌨️' },
  86: { label: 'Heavy snow showers', emoji: '❄️' },
  95: { label: 'Thunderstorm', emoji: '⛈️' },
  96: { label: 'Thunderstorm with hail', emoji: '⛈️' },
  99: { label: 'Severe thunderstorm', emoji: '⛈️' },
};

export function conditionLabel(code: number): string {
  return WMO[code]?.label ?? 'Unknown';
}

export function conditionEmoji(code: number, isDay = true): string {
  const e = WMO[code];
  if (!e) return '❔';
  return isDay ? e.emoji : e.nightEmoji ?? e.emoji;
}

/**
 * Rough severity ranking so a 3-hour aggregate can pick the "dominant"
 * (worst) condition of its member hours.
 */
export function severity(code: number): number {
  if (code >= 95) return 9;
  if (code === 82 || code === 86 || code === 75 || code === 65 || code === 67) return 8;
  if (code >= 80) return 7;
  if (code >= 71) return 6;
  if (code >= 61) return 5;
  if (code >= 51) return 4;
  if (code >= 45) return 3;
  return code; // 0-3
}

export function precipTypeFromCode(code: number, rainMm: number, snowMm: number): PrecipType {
  if (code === 56 || code === 57 || code === 66 || code === 67) return 'freezing-rain';
  if (rainMm > 0 && snowMm > 0) return 'sleet';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (snowMm > 0) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain';
  if (rainMm > 0) return 'rain';
  return 'none';
}
