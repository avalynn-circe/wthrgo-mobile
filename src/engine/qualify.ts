import type {
  ActivityCriteria,
  CriterionResult,
  ForecastInterval,
  PrecipTolerance,
  QualifyResult,
  TempUnit,
} from '../types';
import { formatDistance, formatTemp, formatWind } from '../lib/units';

/**
 * Per-hour precipitation ceiling (mm/h) for each tolerance level.
 * Level 0 additionally requires a low precipitation probability.
 */
export const PRECIP_LIMITS_MM_PER_HOUR: Record<PrecipTolerance, number> = {
  0: 0,
  1: 0.3,
  2: 1.0,
  3: 4.0,
  4: Number.POSITIVE_INFINITY,
};

export const PRECIP_TOLERANCE_LABELS: Record<PrecipTolerance, string> = {
  0: 'Clear skies only',
  1: 'Light drizzle OK',
  2: 'Light rain OK',
  3: 'Moderate rain OK',
  4: 'Any conditions',
};

const CLEAR_SKIES_MAX_PROBABILITY = 20;

export interface QualifyOptions {
  /** Only affects how actual/limit strings are formatted. */
  unit?: TempUnit;
}

/**
 * Is a single interval "day" for the purposes of time-of-day preference?
 * Evaluated at the interval midpoint (GAP-001).
 */
export function isDaytimeAtMidpoint(iv: ForecastInterval): boolean {
  if (iv.isPolarNight) return false;
  if (!iv.sunrise || !iv.sunset) return iv.conditionEmoji !== '🌙';
  const mid = iv.start + (iv.end - iv.start) / 2;
  return mid >= iv.sunrise && mid < iv.sunset;
}

/**
 * Evaluate one interval against one set of criteria. Always evaluates every
 * criterion so the UI can show a full pass/fail breakdown, not just the first
 * failure.
 */
export function qualifyInterval(
  iv: ForecastInterval,
  c: ActivityCriteria,
  opts: QualifyOptions = {},
): QualifyResult {
  const unit = opts.unit ?? 'C';
  const checks: CriterionResult[] = [];
  const push = (key: string, label: string, actual: string, limit: string, pass: boolean) =>
    checks.push({ key, label, actual, limit, pass });

  if (c.tempMin != null) {
    push('tempMin', 'Min temp', formatTemp(iv.temperature, unit), `≥ ${formatTemp(c.tempMin, unit)}`, iv.temperature >= c.tempMin);
  }
  if (c.tempMax != null) {
    push('tempMax', 'Max temp', formatTemp(iv.temperature, unit), `≤ ${formatTemp(c.tempMax, unit)}`, iv.temperature <= c.tempMax);
  }
  if (c.dewPointMax != null) {
    push('dewPoint', 'Dew point', formatTemp(iv.dewPoint, unit), `≤ ${formatTemp(c.dewPointMax, unit)}`, iv.dewPoint <= c.dewPointMax);
  }
  if (c.windMax != null) {
    push('wind', 'Wind', formatWind(iv.windSpeed, unit), `≤ ${formatWind(c.windMax, unit)}`, iv.windSpeed <= c.windMax);
  }

  // Precipitation tolerance — compare per-hour rate so 1h and 3h modes agree.
  {
    const perHour = iv.precipitation / iv.hours;
    const limit = PRECIP_LIMITS_MM_PER_HOUR[c.precipTolerance];
    let pass = perHour <= limit;
    if (c.precipTolerance === 0) {
      pass = pass && iv.precipProbability <= CLEAR_SKIES_MAX_PROBABILITY && iv.precipType === 'none';
    }
    const actual =
      c.precipTolerance === 0
        ? `${perHour.toFixed(1)} mm/h · ${iv.precipProbability}%`
        : `${perHour.toFixed(1)} mm/h`;
    push('precip', 'Precipitation', actual, PRECIP_TOLERANCE_LABELS[c.precipTolerance], pass);
  }

  if (c.timeOfDay !== 'any') {
    const day = isDaytimeAtMidpoint(iv);
    const pass = c.timeOfDay === 'day' ? day : !day;
    push('timeOfDay', 'Time of day', day ? 'Daytime' : 'Night', c.timeOfDay === 'day' ? 'Daytime' : 'Night', pass);
  }

  // --- advanced ---
  if (c.precipTypes && c.precipTypes.length > 0 && iv.precipType !== 'none') {
    const pass = c.precipTypes.includes(iv.precipType);
    push('precipType', 'Precip type', iv.precipType, c.precipTypes.join(', '), pass);
  }
  if (c.uvMin != null) {
    push('uvMin', 'Min UV', iv.uvIndex.toFixed(1), `≥ ${c.uvMin}`, iv.uvIndex >= c.uvMin);
  }
  if (c.uvMax != null) {
    push('uvMax', 'Max UV', iv.uvIndex.toFixed(1), `≤ ${c.uvMax}`, iv.uvIndex <= c.uvMax);
  }
  if (c.visibilityMin != null) {
    push('visibility', 'Visibility', formatDistance(iv.visibility, unit), `≥ ${formatDistance(c.visibilityMin, unit)}`, iv.visibility >= c.visibilityMin);
  }
  if (c.windDirections && c.windDirections.length > 0) {
    const pass = c.windDirections.includes(iv.windDirection);
    push('windDir', 'Wind from', iv.windDirection, c.windDirections.join('/'), pass);
  }
  if (c.cloudCoverMax != null) {
    push('cloud', 'Cloud cover', `${Math.round(iv.cloudCover)}%`, `≤ ${c.cloudCoverMax}%`, iv.cloudCover <= c.cloudCoverMax);
  }

  return { ok: checks.every((k) => k.pass), checks };
}

export const qualifiesInterval = (iv: ForecastInterval, c: ActivityCriteria): boolean =>
  qualifyInterval(iv, c).ok;
