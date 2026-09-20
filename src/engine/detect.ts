/**
 * Window detection. Pure TypeScript — no UI or platform dependencies — so it
 * can run unchanged on a server later.
 */
import type { Activity, ForecastInterval, IntervalSize, WeatherWindow } from '../types';
import { qualifiesInterval } from './qualify';

/** Hours → interval count, always at least 1. */
export function hoursToIntervals(hours: number, intervalSize: IntervalSize): number {
  return Math.max(1, Math.ceil(hours / intervalSize));
}

export interface DetectOptions {
  /** Epoch seconds; windows that end at or before this are dropped. */
  now: number;
  intervalSize: IntervalSize;
}

const isRainy = (iv: ForecastInterval | undefined): boolean =>
  !!iv && (iv.precipitation > 0 || iv.precipType !== 'none');

/**
 * Detect qualifying windows for a single activity over the full interval
 * array. Every interval is evaluated; windows entirely in the past are
 * filtered from the output.
 */
export function detectWindows(
  intervals: ForecastInterval[],
  activity: Activity,
  opts: DetectOptions,
): WeatherWindow[] {
  const c = activity.criteria;
  const minRun = hoursToIntervals(c.consecutiveHoursRequired, opts.intervalSize);
  const pass = intervals.map((iv) => qualifiesInterval(iv, c));

  const windows: WeatherWindow[] = [];
  let i = 0;
  while (i < intervals.length) {
    if (!pass[i]) {
      i++;
      continue;
    }
    let j = i;
    // A run must be contiguous in time as well as adjacent in the array.
    while (j + 1 < intervals.length && pass[j + 1] && intervals[j + 1].start === intervals[j].end) j++;

    const count = j - i + 1;
    if (count >= minRun) {
      const before = intervals[i - 1];
      const after = intervals[j + 1];
      windows.push({
        activityId: activity.id,
        start: intervals[i].start,
        end: intervals[j].end,
        firstIndex: i,
        lastIndex: j,
        intervalCount: count,
        followsRain: c.detectPostRain && isRainy(before),
        precedesRain: c.detectPreRain && isRainy(after),
        precedesDeterioration: !!after && !pass[j + 1],
      });
    }
    i = j + 1;
  }

  return windows.filter((w) => w.end > opts.now);
}

/**
 * Detect for every enabled activity. Returns a map of activityId → windows,
 * plus a per-interval index of which activities qualify there.
 */
export function detectAll(
  intervals: ForecastInterval[],
  activities: Activity[],
  opts: DetectOptions,
): { windows: Map<string, WeatherWindow[]>; byInterval: Set<string>[] } {
  const windows = new Map<string, WeatherWindow[]>();
  const byInterval: Set<string>[] = intervals.map(() => new Set<string>());
  for (const a of activities) {
    if (!a.enabled) continue;
    const ws = detectWindows(intervals, a, opts);
    windows.set(a.id, ws);
    for (const w of ws) {
      for (let k = w.firstIndex; k <= w.lastIndex; k++) byInterval[k].add(a.id);
    }
  }
  return { windows, byInterval };
}
