/**
 * Core domain types for WthrGo.
 *
 * Everything is metric internally (°C, kph, mm, km). Unit conversion for
 * display happens at the UI layer only.
 */

export type TempUnit = 'C' | 'F';
export type ThemeName = 'light' | 'dark';
export type IntervalSize = 1 | 3;

export type PrecipType = 'none' | 'rain' | 'snow' | 'sleet' | 'freezing-rain';

/** 8-point compass. */
export type CompassPoint = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type TimeOfDayPreference = 'day' | 'night' | 'any';

/**
 * Precipitation tolerance levels, lowest to highest tolerance.
 * 0 = clear skies only, 4 = any conditions.
 */
export type PrecipTolerance = 0 | 1 | 2 | 3 | 4;

export interface City {
  id: string;
  name: string;
  /** Admin region (state/province) when available. */
  admin1?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

/**
 * A single forecast interval (1h or 3h). Times are epoch seconds (UTC);
 * `localHour` is precomputed in the location's own time zone so the UI never
 * has to reason about the device time zone.
 */
export interface ForecastInterval {
  /** Epoch seconds at interval start. */
  start: number;
  /** Epoch seconds at interval end (start + size*3600). */
  end: number;
  /** Interval length in hours. */
  hours: IntervalSize;
  /** Local calendar date key, `YYYY-MM-DD`, in the location's time zone. */
  dateKey: string;
  /** Local hour of day 0-23 at interval start. */
  localHour: number;

  temperature: number;
  feelsLike: number;
  dewPoint: number;
  windSpeed: number;
  windGusts: number;
  windDirection: CompassPoint;
  windDirectionDeg: number;
  /** mm over the whole interval. */
  precipitation: number;
  precipType: PrecipType;
  precipProbability: number;
  cloudCover: number;
  uvIndex: number;
  /** km */
  visibility: number;
  weatherCode: number;
  conditionLabel: string;
  conditionEmoji: string;

  /** Sunrise / sunset for the interval's local day, epoch seconds. */
  sunrise: number;
  sunset: number;
  /** True when the day has no sunrise (polar night). */
  isPolarNight: boolean;
}

export interface DailySummary {
  dateKey: string;
  high: number;
  low: number;
  conditionLabel: string;
  conditionEmoji: string;
  weatherCode: number;
  sunrise: number;
  sunset: number;
}

export interface Forecast {
  city: City;
  fetchedAt: number;
  intervalSize: IntervalSize;
  utcOffsetSeconds: number;
  intervals: ForecastInterval[];
  days: DailySummary[];
}

/**
 * Criteria are kept separate from the Activity so they can be cloned and
 * versioned independently in later phases.
 */
export interface ActivityCriteria {
  // --- basic ---
  tempMin: number | null;
  tempMax: number | null;
  dewPointMax: number | null;
  windMax: number | null;
  precipTolerance: PrecipTolerance;
  timeOfDay: TimeOfDayPreference;
  consecutiveHoursRequired: number;

  // --- advanced ---
  precipTypes: PrecipType[] | null;
  uvMin: number | null;
  uvMax: number | null;
  visibilityMin: number | null;
  windDirections: CompassPoint[] | null;
  cloudCoverMax: number | null;
  detectPreRain: boolean;
  detectPostRain: boolean;
  /** Stored, not yet evaluated by the detector. */
  consecutiveDaysRequired: number;
}

export interface Activity {
  id: string;
  name: string;
  icon: string;
  color: string;
  notes: string;
  enabled: boolean;
  criteria: ActivityCriteria;
  createdAt: number;
  updatedAt: number;
}

export interface CriterionResult {
  key: string;
  label: string;
  /** Formatted actual value for display. */
  actual: string;
  /** Formatted limit for display. */
  limit: string;
  pass: boolean;
}

export interface QualifyResult {
  ok: boolean;
  checks: CriterionResult[];
}

export interface WeatherWindow {
  activityId: string;
  start: number;
  end: number;
  /** Indices into the interval array, inclusive. */
  firstIndex: number;
  lastIndex: number;
  intervalCount: number;
  precedesRain: boolean;
  precedesDeterioration: boolean;
  followsRain: boolean;
}

export type ConsentState = 'granted' | 'dismissed' | null;
