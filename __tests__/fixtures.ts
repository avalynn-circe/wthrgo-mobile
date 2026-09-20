import type { Activity, ActivityCriteria, ForecastInterval } from '../src/types';
import { DEFAULT_CRITERIA } from '../src/engine/presets';

/** 2026-06-01T00:00:00Z as the local midnight of a UTC location. */
export const DAY0 = Date.UTC(2026, 5, 1) / 1000;
export const SUNRISE = DAY0 + 6 * 3600;
export const SUNSET = DAY0 + 20 * 3600;

export function interval(hourOffset: number, hours: 1 | 3, overrides: Partial<ForecastInterval> = {}): ForecastInterval {
  const start = DAY0 + hourOffset * 3600;
  const dayIndex = Math.floor(hourOffset / 24);
  return {
    start,
    end: start + hours * 3600,
    hours,
    dateKey: `2026-06-${String(1 + dayIndex).padStart(2, '0')}`,
    localHour: hourOffset % 24,
    temperature: 20,
    feelsLike: 20,
    dewPoint: 10,
    windSpeed: 10,
    windGusts: 15,
    windDirection: 'W',
    windDirectionDeg: 270,
    precipitation: 0,
    precipType: 'none',
    precipProbability: 5,
    cloudCover: 20,
    uvIndex: 4,
    visibility: 20,
    weatherCode: 1,
    conditionLabel: 'Mostly clear',
    conditionEmoji: '🌤️',
    sunrise: SUNRISE + dayIndex * 86400,
    sunset: SUNSET + dayIndex * 86400,
    isPolarNight: false,
    ...overrides,
  };
}

export function series(hours: 1 | 3, count: number, fn: (i: number) => Partial<ForecastInterval> = () => ({})): ForecastInterval[] {
  return Array.from({ length: count }, (_, i) => interval(i * hours, hours, fn(i)));
}

export function activity(criteria: Partial<ActivityCriteria> = {}, extra: Partial<Activity> = {}): Activity {
  return {
    id: 'act-1',
    name: 'Test',
    icon: '🧪',
    color: '#000',
    notes: '',
    enabled: true,
    criteria: { ...DEFAULT_CRITERIA, ...criteria },
    createdAt: 0,
    updatedAt: 0,
    ...extra,
  };
}
