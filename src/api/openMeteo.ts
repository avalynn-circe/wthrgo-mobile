import type { City, DailySummary, Forecast, ForecastInterval, IntervalSize } from '../types';
import { conditionEmoji, conditionLabel, precipTypeFromCode, severity } from '../lib/wmo';
import { degreesToCompass } from '../lib/units';
import { dateKey, localHour } from '../lib/time';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const HOURLY = [
  'temperature_2m',
  'apparent_temperature',
  'dew_point_2m',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'precipitation',
  'rain',
  'showers',
  'snowfall',
  'precipitation_probability',
  'cloud_cover',
  'uv_index',
  'visibility',
  'weather_code',
  'is_day',
];

const DAILY = ['temperature_2m_max', 'temperature_2m_min', 'weather_code', 'sunrise', 'sunset', 'daylight_duration'];

interface RawResponse {
  utc_offset_seconds: number;
  hourly: Record<string, number[]> & { time: number[] };
  daily: Record<string, number[]> & { time: number[] };
}

export async function fetchForecast(
  city: City,
  days: number,
  intervalSize: IntervalSize,
  signal?: AbortSignal,
): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    hourly: HOURLY.join(','),
    daily: DAILY.join(','),
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: String(Math.min(16, Math.max(1, days))),
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    temperature_unit: 'celsius',
  });
  const res = await fetch(`${FORECAST_URL}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
  const raw = (await res.json()) as RawResponse;
  return normalize(city, raw, intervalSize);
}

/** Exported for tests. */
export function normalize(city: City, raw: RawResponse, intervalSize: IntervalSize): Forecast {
  const offset = raw.utc_offset_seconds;
  const h = raw.hourly;
  const d = raw.daily;

  const dayInfo = new Map<string, { sunrise: number; sunset: number; polar: boolean }>();
  const days: DailySummary[] = d.time.map((t, i) => {
    const key = dateKey(t, offset);
    const sunrise = d.sunrise[i];
    const sunset = d.sunset[i];
    const polar = (d.daylight_duration?.[i] ?? 1) <= 0;
    dayInfo.set(key, { sunrise, sunset, polar });
    const code = d.weather_code[i];
    return {
      dateKey: key,
      high: d.temperature_2m_max[i],
      low: d.temperature_2m_min[i],
      weatherCode: code,
      conditionLabel: conditionLabel(code),
      conditionEmoji: conditionEmoji(code, true),
      sunrise,
      sunset,
    };
  });

  const hourly: ForecastInterval[] = h.time.map((t, i) => {
    const key = dateKey(t, offset);
    const info = dayInfo.get(key) ?? { sunrise: 0, sunset: 0, polar: false };
    const code = h.weather_code[i] ?? 0;
    const rain = (h.rain?.[i] ?? 0) + (h.showers?.[i] ?? 0);
    const snow = h.snowfall?.[i] ?? 0;
    const isDay = (h.is_day?.[i] ?? 1) === 1;
    const deg = h.wind_direction_10m[i] ?? 0;
    return {
      start: t,
      end: t + 3600,
      hours: 1,
      dateKey: key,
      localHour: localHour(t, offset),
      temperature: h.temperature_2m[i],
      feelsLike: h.apparent_temperature[i],
      dewPoint: h.dew_point_2m[i],
      windSpeed: h.wind_speed_10m[i],
      windGusts: h.wind_gusts_10m[i],
      windDirection: degreesToCompass(deg),
      windDirectionDeg: deg,
      precipitation: h.precipitation[i] ?? 0,
      precipType: precipTypeFromCode(code, rain, snow),
      precipProbability: h.precipitation_probability?.[i] ?? 0,
      cloudCover: h.cloud_cover[i],
      uvIndex: h.uv_index?.[i] ?? 0,
      visibility: (h.visibility?.[i] ?? 0) / 1000,
      weatherCode: code,
      conditionLabel: conditionLabel(code),
      conditionEmoji: conditionEmoji(code, isDay),
      sunrise: info.sunrise,
      sunset: info.sunset,
      isPolarNight: info.polar,
    };
  });

  const intervals = intervalSize === 1 ? hourly : aggregate(hourly, 3, offset);

  return {
    city,
    fetchedAt: Math.floor(Date.now() / 1000),
    intervalSize,
    utcOffsetSeconds: offset,
    intervals,
    days,
  };
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/**
 * Collapse hourly data into `size`-hour buckets aligned to local midnight.
 * Continuous values are averaged, precipitation is summed, probability takes
 * the max, and the condition is the most severe member hour.
 */
export function aggregate(hourly: ForecastInterval[], size: 3, offset: number): ForecastInterval[] {
  const out: ForecastInterval[] = [];
  let i = 0;
  while (i < hourly.length) {
    const first = hourly[i];
    const bucketStartHour = Math.floor(first.localHour / size) * size;
    const bucket: ForecastInterval[] = [];
    for (let j = i; j < hourly.length && bucket.length < size; j++) {
      const cand = hourly[j];
      if (cand.dateKey !== first.dateKey) break;
      if (Math.floor(cand.localHour / size) * size !== bucketStartHour) break;
      bucket.push(cand);
    }
    i += bucket.length;

    // Aggregate wind direction as a vector so N + NW does not average to S.
    const vx = mean(bucket.map((b) => Math.cos((b.windDirectionDeg * Math.PI) / 180)));
    const vy = mean(bucket.map((b) => Math.sin((b.windDirectionDeg * Math.PI) / 180)));
    const deg = ((Math.atan2(vy, vx) * 180) / Math.PI + 360) % 360;

    const worst = bucket.reduce((a, b) => (severity(b.weatherCode) >= severity(a.weatherCode) ? b : a));
    const rain = sum(bucket.map((b) => (b.precipType === 'rain' || b.precipType === 'freezing-rain' ? b.precipitation : 0)));
    const snow = sum(bucket.map((b) => (b.precipType === 'snow' ? b.precipitation : 0)));
    const anyDay = bucket.some((b) => b.conditionEmoji === conditionEmoji(b.weatherCode, true));

    const start = first.start - (first.localHour - bucketStartHour) * 3600;
    out.push({
      start,
      end: start + size * 3600,
      hours: size,
      dateKey: first.dateKey,
      localHour: localHour(start, offset),
      temperature: mean(bucket.map((b) => b.temperature)),
      feelsLike: mean(bucket.map((b) => b.feelsLike)),
      dewPoint: mean(bucket.map((b) => b.dewPoint)),
      windSpeed: mean(bucket.map((b) => b.windSpeed)),
      windGusts: Math.max(...bucket.map((b) => b.windGusts)),
      windDirection: degreesToCompass(deg),
      windDirectionDeg: deg,
      precipitation: sum(bucket.map((b) => b.precipitation)),
      precipType: precipTypeFromCode(worst.weatherCode, rain, snow),
      precipProbability: Math.max(...bucket.map((b) => b.precipProbability)),
      cloudCover: mean(bucket.map((b) => b.cloudCover)),
      uvIndex: mean(bucket.map((b) => b.uvIndex)),
      visibility: mean(bucket.map((b) => b.visibility)),
      weatherCode: worst.weatherCode,
      conditionLabel: worst.conditionLabel,
      conditionEmoji: conditionEmoji(worst.weatherCode, anyDay),
      sunrise: first.sunrise,
      sunset: first.sunset,
      isPolarNight: first.isPolarNight,
    });
  }
  return out;
}
