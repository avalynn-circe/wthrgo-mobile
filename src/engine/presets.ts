import type { Activity, ActivityCriteria } from '../types';
import { uuid } from '../lib/uuid';

export const ACTIVITY_COLORS = [
  '#0EA5A4', '#22C55E', '#84CC16', '#EAB308',
  '#F97316', '#EF4444', '#EC4899', '#A855F7',
  '#6366F1', '#3B82F6', '#06B6D4', '#14B8A6',
  '#78716C', '#64748B', '#B45309', '#0F766E',
];

export const DEFAULT_CRITERIA: ActivityCriteria = {
  tempMin: 10,
  tempMax: 30,
  dewPointMax: null,
  windMax: 30,
  precipTolerance: 1,
  timeOfDay: 'day',
  consecutiveHoursRequired: 2,
  precipTypes: null,
  uvMin: null,
  uvMax: null,
  visibilityMin: null,
  windDirections: null,
  cloudCoverMax: null,
  detectPreRain: false,
  detectPostRain: false,
  consecutiveDaysRequired: 1,
};

export interface ActivityPreset {
  key: string;
  name: string;
  icon: string;
  color: string;
  notes: string;
  criteria: Partial<ActivityCriteria>;
}

export const PRESETS: ActivityPreset[] = [
  { key: 'golf', name: 'Golf', icon: '⛳', color: '#22C55E', notes: '',
    criteria: { tempMin: 10, tempMax: 32, windMax: 30, precipTolerance: 1, timeOfDay: 'day', consecutiveHoursRequired: 4 } },
  { key: 'cycling', name: 'Cycling', icon: '🚴', color: '#F97316', notes: '',
    criteria: { tempMin: 5, tempMax: 33, windMax: 35, precipTolerance: 1, timeOfDay: 'day', consecutiveHoursRequired: 2 } },
  { key: 'running', name: 'Running', icon: '🏃', color: '#EF4444', notes: '',
    criteria: { tempMin: -5, tempMax: 28, dewPointMax: 20, windMax: 40, precipTolerance: 2, timeOfDay: 'any', consecutiveHoursRequired: 1 } },
  { key: 'sailing', name: 'Sailing', icon: '⛵', color: '#3B82F6', notes: 'Needs some wind, not too much.',
    criteria: { tempMin: 8, tempMax: 35, windMax: 45, precipTolerance: 2, timeOfDay: 'day', consecutiveHoursRequired: 3, visibilityMin: 3 } },
  { key: 'stargazing', name: 'Stargazing', icon: '🔭', color: '#6366F1', notes: '',
    criteria: { tempMin: -15, tempMax: 35, windMax: 30, precipTolerance: 0, timeOfDay: 'night', consecutiveHoursRequired: 2, cloudCoverMax: 20 } },
  { key: 'hiking', name: 'Hiking', icon: '🥾', color: '#84CC16', notes: '',
    criteria: { tempMin: 0, tempMax: 30, windMax: 40, precipTolerance: 2, timeOfDay: 'day', consecutiveHoursRequired: 4 } },
  { key: 'photography', name: 'Photography', icon: '📷', color: '#A855F7', notes: 'Golden-hour friendly.',
    criteria: { tempMin: -10, tempMax: 38, windMax: 50, precipTolerance: 1, timeOfDay: 'any', consecutiveHoursRequired: 1, visibilityMin: 5 } },
  { key: 'yardwork', name: 'Yard Work', icon: '🌱', color: '#0F766E', notes: '',
    criteria: { tempMin: 5, tempMax: 30, windMax: 35, precipTolerance: 1, timeOfDay: 'day', consecutiveHoursRequired: 2 } },
  { key: 'motorcycle', name: 'Motorcycle', icon: '🏍️', color: '#64748B', notes: '',
    criteria: { tempMin: 10, tempMax: 35, windMax: 40, precipTolerance: 0, timeOfDay: 'any', consecutiveHoursRequired: 2 } },
  { key: 'beach', name: 'Beach', icon: '🏖️', color: '#EAB308', notes: '',
    criteria: { tempMin: 24, tempMax: 40, windMax: 30, precipTolerance: 0, timeOfDay: 'day', consecutiveHoursRequired: 3, cloudCoverMax: 50 } },
  { key: 'outdoor', name: 'Outdoor', icon: '🌳', color: '#0EA5A4', notes: 'Generic "nice outside" window.',
    criteria: { tempMin: 12, tempMax: 30, windMax: 35, precipTolerance: 1, timeOfDay: 'day', consecutiveHoursRequired: 2 } },
];

export function activityFromPreset(p: ActivityPreset): Activity {
  const now = Date.now();
  return {
    id: uuid(),
    name: p.name,
    icon: p.icon,
    color: p.color,
    notes: p.notes,
    enabled: true,
    criteria: { ...DEFAULT_CRITERIA, ...p.criteria },
    createdAt: now,
    updatedAt: now,
  };
}

export function blankActivity(): Activity {
  const now = Date.now();
  return {
    id: uuid(),
    name: '',
    icon: '',
    color: ACTIVITY_COLORS[0],
    notes: '',
    enabled: true,
    criteria: { ...DEFAULT_CRITERIA },
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneActivity(a: Activity): Activity {
  const now = Date.now();
  return {
    ...a,
    id: uuid(),
    name: `${a.name} (copy)`,
    criteria: { ...a.criteria },
    createdAt: now,
    updatedAt: now,
  };
}
