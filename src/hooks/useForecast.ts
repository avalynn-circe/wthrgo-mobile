import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchForecast } from '../api/openMeteo';
import { useStore } from '../store/useStore';
import type { Forecast } from '../types';

/**
 * Fetch (and refetch) the forecast whenever the city, day count or interval
 * size changes. Aborts any in-flight request when inputs change.
 */
export function useForecast() {
  const city = useStore((s) => s.city);
  const days = useStore((s) => s.forecastDays);
  const intervalSize = useStore((s) => s.intervalSize);

  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    if (!city) {
      setForecast(null);
      setError(null);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    fetchForecast(city, days, intervalSize, ac.signal)
      .then((f) => {
        if (!ac.signal.aborted) setForecast(f);
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Could not load forecast');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [city, days, intervalSize, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { forecast, loading, error, refresh };
}
