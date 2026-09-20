import { isDaytimeAtMidpoint, qualifyInterval } from '../src/engine/qualify';
import { DEFAULT_CRITERIA } from '../src/engine/presets';
import { interval, SUNRISE, SUNSET } from './fixtures';

const base = { ...DEFAULT_CRITERIA, timeOfDay: 'any' as const };

describe('qualifyInterval', () => {
  it('passes a benign interval against default-ish criteria', () => {
    const r = qualifyInterval(interval(12, 1), base);
    expect(r.ok).toBe(true);
    expect(r.checks.every((c) => c.pass)).toBe(true);
  });

  it('evaluates every criterion even after a failure', () => {
    const r = qualifyInterval(interval(12, 1, { temperature: 40, windSpeed: 80 }), base);
    expect(r.ok).toBe(false);
    const failed = r.checks.filter((c) => !c.pass).map((c) => c.key);
    expect(failed).toEqual(expect.arrayContaining(['tempMax', 'wind']));
  });

  it('formats actual and limit in °F when asked', () => {
    const r = qualifyInterval(interval(12, 1, { temperature: 20 }), base, { unit: 'F' });
    const tmax = r.checks.find((c) => c.key === 'tempMax')!;
    expect(tmax.actual).toBe('68°');
    expect(tmax.limit).toBe('≤ 86°');
  });

  describe('precipitation tolerance', () => {
    it('level 0 rejects any chance of rain', () => {
      const c = { ...base, precipTolerance: 0 as const };
      expect(qualifyInterval(interval(12, 1, { precipProbability: 40 }), c).ok).toBe(false);
      expect(qualifyInterval(interval(12, 1, { precipType: 'rain' }), c).ok).toBe(false);
      expect(qualifyInterval(interval(12, 1), c).ok).toBe(true);
    });

    it('compares per-hour rate so 1h and 3h modes agree', () => {
      const c = { ...base, precipTolerance: 2 as const }; // ≤ 1.0 mm/h
      expect(qualifyInterval(interval(12, 1, { precipitation: 0.9, precipType: 'rain' }), c).ok).toBe(true);
      expect(qualifyInterval(interval(12, 3, { precipitation: 2.7, precipType: 'rain' }), c).ok).toBe(true);
      expect(qualifyInterval(interval(12, 3, { precipitation: 3.3, precipType: 'rain' }), c).ok).toBe(false);
    });

    it('level 4 accepts anything', () => {
      const c = { ...base, precipTolerance: 4 as const };
      expect(qualifyInterval(interval(12, 1, { precipitation: 50, precipType: 'rain', precipProbability: 100 }), c).ok).toBe(true);
    });
  });

  describe('time of day at interval midpoint (GAP-001)', () => {
    it('uses the midpoint, not the start', () => {
      // 3h block starting 1h before sunrise: midpoint is 30 min after sunrise → day.
      const iv = interval(5, 3);
      expect(iv.start).toBe(SUNRISE - 3600);
      expect(isDaytimeAtMidpoint(iv)).toBe(true);
      // 3h block starting 2h before sunset: midpoint before sunset → day.
      expect(isDaytimeAtMidpoint(interval(18, 3))).toBe(true);
      // 3h block starting 1h before sunset: midpoint after sunset → night.
      const late = interval(19, 3);
      expect(late.start + 5400).toBeGreaterThan(SUNSET);
      expect(isDaytimeAtMidpoint(late)).toBe(false);
    });

    it('polar night is never daytime', () => {
      expect(isDaytimeAtMidpoint(interval(12, 1, { isPolarNight: true }))).toBe(false);
    });

    it('applies the preference', () => {
      expect(qualifyInterval(interval(12, 1), { ...base, timeOfDay: 'day' }).ok).toBe(true);
      expect(qualifyInterval(interval(12, 1), { ...base, timeOfDay: 'night' }).ok).toBe(false);
      expect(qualifyInterval(interval(23, 1), { ...base, timeOfDay: 'night' }).ok).toBe(true);
    });
  });

  describe('advanced criteria', () => {
    it('precip type preference only matters when it is precipitating', () => {
      const c = { ...base, precipTolerance: 4 as const, precipTypes: ['snow' as const] };
      expect(qualifyInterval(interval(12, 1), c).ok).toBe(true);
      expect(qualifyInterval(interval(12, 1, { precipType: 'rain', precipitation: 1 }), c).ok).toBe(false);
      expect(qualifyInterval(interval(12, 1, { precipType: 'snow', precipitation: 1 }), c).ok).toBe(true);
    });

    it('checks UV, visibility, wind direction and cloud cover', () => {
      const c = { ...base, uvMin: 2, uvMax: 6, visibilityMin: 5, windDirections: ['W' as const, 'NW' as const], cloudCoverMax: 50 };
      expect(qualifyInterval(interval(12, 1), c).ok).toBe(true);
      expect(qualifyInterval(interval(12, 1, { uvIndex: 9 }), c).ok).toBe(false);
      expect(qualifyInterval(interval(12, 1, { visibility: 1 }), c).ok).toBe(false);
      expect(qualifyInterval(interval(12, 1, { windDirection: 'E' }), c).ok).toBe(false);
      expect(qualifyInterval(interval(12, 1, { cloudCover: 90 }), c).ok).toBe(false);
    });
  });
});
