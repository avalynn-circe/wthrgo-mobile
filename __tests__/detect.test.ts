import { detectAll, detectWindows, hoursToIntervals } from '../src/engine/detect';
import { activity, DAY0, series } from './fixtures';

const anyTime = { timeOfDay: 'any' as const };

describe('hoursToIntervals', () => {
  it('rounds up and never returns less than 1', () => {
    expect(hoursToIntervals(1, 3)).toBe(1);
    expect(hoursToIntervals(3, 3)).toBe(1);
    expect(hoursToIntervals(4, 3)).toBe(2);
    expect(hoursToIntervals(0, 1)).toBe(1);
    expect(hoursToIntervals(5, 1)).toBe(5);
  });
});

describe('detectWindows', () => {
  it('groups consecutive qualifying intervals into one window', () => {
    // 24 hourly intervals, rain from 10:00-12:00.
    const ivs = series(1, 24, (i) => (i >= 10 && i < 13 ? { precipitation: 5, precipType: 'rain' } : {}));
    const a = activity({ ...anyTime, consecutiveHoursRequired: 2 });
    const ws = detectWindows(ivs, a, { now: DAY0 - 1, intervalSize: 1 });
    expect(ws).toHaveLength(2);
    expect(ws[0]).toMatchObject({ firstIndex: 0, lastIndex: 9, intervalCount: 10, precedesDeterioration: true });
    expect(ws[1]).toMatchObject({ firstIndex: 13, lastIndex: 23, intervalCount: 11, precedesDeterioration: false });
  });

  it('drops runs shorter than consecutiveHoursRequired', () => {
    const ivs = series(1, 6, (i) => (i === 2 ? { temperature: 45 } : {}));
    const a = activity({ ...anyTime, consecutiveHoursRequired: 3 });
    const ws = detectWindows(ivs, a, { now: DAY0 - 1, intervalSize: 1 });
    expect(ws).toHaveLength(1);
    expect(ws[0]).toMatchObject({ firstIndex: 3, lastIndex: 5 });
  });

  it('converts hours to intervals in 3h mode', () => {
    const ivs = series(3, 8); // one full day
    const a4 = activity({ ...anyTime, consecutiveHoursRequired: 4 }); // → 2 intervals
    const a7 = activity({ ...anyTime, consecutiveHoursRequired: 25 }); // → 9 intervals > 8 available
    expect(detectWindows(ivs, a4, { now: DAY0 - 1, intervalSize: 3 })).toHaveLength(1);
    expect(detectWindows(ivs, a7, { now: DAY0 - 1, intervalSize: 3 })).toHaveLength(0);
  });

  it('filters windows entirely in the past but keeps ones still running', () => {
    const ivs = series(1, 10, (i) => (i === 4 ? { windSpeed: 99 } : {}));
    const a = activity({ ...anyTime, consecutiveHoursRequired: 1 });
    // now = 04:30 → first window (00-04) is over, second (05-10) upcoming.
    let ws = detectWindows(ivs, a, { now: DAY0 + 4.5 * 3600, intervalSize: 1 });
    expect(ws.map((w) => w.firstIndex)).toEqual([5]);
    // now = 02:30 → first window still in progress and kept.
    ws = detectWindows(ivs, a, { now: DAY0 + 2.5 * 3600, intervalSize: 1 });
    expect(ws.map((w) => w.firstIndex)).toEqual([0, 5]);
  });

  it('flags pre/post rain only when the activity opts in', () => {
    const rainy = { precipitation: 4, precipType: 'rain' as const };
    const ivs = series(1, 7, (i) => (i === 0 || i === 6 ? rainy : {}));
    const off = activity({ ...anyTime, consecutiveHoursRequired: 1 });
    const on = activity({ ...anyTime, consecutiveHoursRequired: 1, detectPreRain: true, detectPostRain: true });
    expect(detectWindows(ivs, off, { now: 0, intervalSize: 1 })[0]).toMatchObject({ precedesRain: false, followsRain: false });
    expect(detectWindows(ivs, on, { now: 0, intervalSize: 1 })[0]).toMatchObject({ precedesRain: true, followsRain: true, precedesDeterioration: true });
  });

  it('breaks a run across a gap in time', () => {
    const ivs = series(1, 6);
    ivs.splice(3, 1); // remove 03:00 → 02:00 and 04:00 are adjacent in the array but not in time
    const a = activity({ ...anyTime, consecutiveHoursRequired: 1 });
    const ws = detectWindows(ivs, a, { now: 0, intervalSize: 1 });
    expect(ws.map((w) => [w.firstIndex, w.lastIndex])).toEqual([
      [0, 2],
      [3, 4],
    ]);
  });
});

describe('detectAll', () => {
  it('skips disabled activities and indexes qualifying intervals', () => {
    const ivs = series(1, 4);
    const a = activity({ ...anyTime, consecutiveHoursRequired: 1 }, { id: 'a' });
    const b = activity({ ...anyTime, consecutiveHoursRequired: 1 }, { id: 'b', enabled: false });
    const { windows, byInterval } = detectAll(ivs, [a, b], { now: 0, intervalSize: 1 });
    expect(windows.has('a')).toBe(true);
    expect(windows.has('b')).toBe(false);
    expect(byInterval.map((s) => [...s])).toEqual([['a'], ['a'], ['a'], ['a']]);
  });
});
