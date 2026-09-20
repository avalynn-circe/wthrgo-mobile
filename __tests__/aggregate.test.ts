import { aggregate, normalize } from '../src/api/openMeteo';
import { series } from './fixtures';

describe('aggregate (3h)', () => {
  it('averages continuous values, sums precipitation, keeps the worst condition', () => {
    const hourly = series(1, 6, (i) => ({
      temperature: 10 + i,
      precipitation: i < 3 ? 1 : 0,
      precipType: i < 3 ? 'rain' : 'none',
      weatherCode: i === 1 ? 63 : 1,
      precipProbability: i === 2 ? 70 : 10,
      windDirectionDeg: i < 3 ? 350 : 10, // N-ish either side of 0°
    }));
    const out = aggregate(hourly, 3, 0);
    expect(out).toHaveLength(2);
    expect(out[0].temperature).toBeCloseTo(11);
    expect(out[0].precipitation).toBe(3);
    expect(out[0].precipType).toBe('rain');
    expect(out[0].weatherCode).toBe(63);
    expect(out[0].precipProbability).toBe(70);
    expect(out[0].windDirection).toBe('N');
    expect(out[0].hours).toBe(3);
    expect(out[0].end - out[0].start).toBe(3 * 3600);
    expect(out[1].temperature).toBeCloseTo(14);
    expect(out[1].precipitation).toBe(0);
  });

  it('aligns buckets to local midnight even when the series starts mid-block', () => {
    const hourly = series(1, 5).slice(1); // starts at 01:00
    const out = aggregate(hourly, 3, 0);
    expect(out.map((o) => o.localHour)).toEqual([0, 3]);
    expect(out[0].temperature).toBe(20);
  });
});

describe('normalize', () => {
  it('builds intervals and daily summaries from a raw Open-Meteo response', () => {
    const t0 = Date.UTC(2026, 5, 1) / 1000;
    const n = 48;
    const zeros = Array(n).fill(0);
    const raw = {
      utc_offset_seconds: -7 * 3600,
      hourly: {
        time: Array.from({ length: n }, (_, i) => t0 + 7 * 3600 + i * 3600),
        temperature_2m: Array.from({ length: n }, (_, i) => 15 + (i % 24) / 2),
        apparent_temperature: zeros,
        dew_point_2m: zeros,
        wind_speed_10m: zeros,
        wind_direction_10m: zeros,
        wind_gusts_10m: zeros,
        precipitation: zeros,
        rain: zeros,
        showers: zeros,
        snowfall: zeros,
        precipitation_probability: zeros,
        cloud_cover: zeros,
        uv_index: zeros,
        visibility: Array(n).fill(24140),
        weather_code: zeros,
        is_day: Array.from({ length: n }, (_, i) => (i % 24 >= 6 && i % 24 < 20 ? 1 : 0)),
      },
      daily: {
        time: [t0 + 7 * 3600, t0 + 31 * 3600],
        temperature_2m_max: [26.5, 26.5],
        temperature_2m_min: [15, 15],
        weather_code: [0, 0],
        sunrise: [t0 + 13 * 3600, t0 + 37 * 3600],
        sunset: [t0 + 27 * 3600, t0 + 51 * 3600],
        daylight_duration: [50400, 50400],
      },
    };
    const city = { id: 'x', name: 'Test', latitude: 0, longitude: 0 };

    const one = normalize(city, raw, 1);
    expect(one.intervals).toHaveLength(48);
    expect(one.intervals[0]).toMatchObject({ dateKey: '2026-06-01', localHour: 0, hours: 1, visibility: 24.14, isPolarNight: false });
    expect(one.intervals[6].conditionEmoji).toBe('☀️');
    expect(one.intervals[0].conditionEmoji).toBe('🌙');
    expect(one.days.map((d) => d.dateKey)).toEqual(['2026-06-01', '2026-06-02']);

    const three = normalize(city, raw, 3);
    expect(three.intervals).toHaveLength(16);
    expect(three.intervals[1]).toMatchObject({ dateKey: '2026-06-01', localHour: 3, hours: 3 });
  });
});
