import type { CompassPoint, TempUnit } from '../types';

export const cToF = (c: number): number => (c * 9) / 5 + 32;
export const fToC = (f: number): number => ((f - 32) * 5) / 9;

export function formatTemp(c: number, unit: TempUnit, digits = 0): string {
  const v = unit === 'F' ? cToF(c) : c;
  return `${v.toFixed(digits)}°`;
}

export function formatTempWithUnit(c: number, unit: TempUnit): string {
  return `${formatTemp(c, unit)}${unit}`;
}

export const kphToMph = (k: number): number => k * 0.621371;

export function formatWind(kph: number, unit: TempUnit): string {
  // Imperial users get mph, metric users get kph. Follows the temperature
  // unit so there is only one preference to manage.
  return unit === 'F' ? `${Math.round(kphToMph(kph))} mph` : `${Math.round(kph)} kph`;
}

export function formatDistance(km: number, unit: TempUnit): string {
  return unit === 'F' ? `${(km * 0.621371).toFixed(1)} mi` : `${km.toFixed(1)} km`;
}

export function formatPrecip(mm: number, unit: TempUnit): string {
  return unit === 'F' ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`;
}

export const COMPASS: CompassPoint[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function degreesToCompass(deg: number): CompassPoint {
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return COMPASS[idx];
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
