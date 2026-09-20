import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { cityLabel, searchCities } from '../api/geocode';
import { useDebounce } from '../hooks/useDebounce';
import { useStore } from '../store/useStore';
import { radius, space, useTheme } from '../theme';
import type { City } from '../types';
import { SearchIcon } from './Icons';
import { Input } from './ui';

const DEBOUNCE_MS = 280;

interface Props {
  large?: boolean;
  autoFocus?: boolean;
  onSelect?: (c: City) => void;
}

/**
 * Debounced free-text city search with recent-city suggestions. Results render
 * inline below the input (no portal needed on native).
 */
export function CitySearch({ large, autoFocus, onSelect }: Props) {
  const t = useTheme();
  const setCity = useStore((s) => s.setCity);
  const recent = useStore((s) => s.recentCities);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounce(query, DEBOUNCE_MS);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    if (debounced.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    searchCities(debounced, ac.signal)
      .then((r) => {
        if (!ac.signal.aborted) setResults(r);
      })
      .catch((e: unknown) => {
        if (!ac.signal.aborted) setError(e instanceof Error ? e.message : 'Search failed');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [debounced]);

  const pick = (c: City) => {
    setCity(c);
    setQuery('');
    setResults([]);
    setFocused(false);
    onSelect?.(c);
  };

  const showRecent = focused && query.trim().length === 0 && recent.length > 0;
  const showResults = focused && (results.length > 0 || loading || error);

  return (
    <View style={{ position: 'relative', zIndex: 10 }}>
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: 14, zIndex: 1 }}>
          <SearchIcon size={large ? 22 : 18} />
        </View>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a city"
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          style={[{ paddingLeft: large ? 46 : 40 }, large && { fontSize: 18, paddingVertical: 15 }]}
          accessibilityLabel="City search"
        />
      </View>

      {(showRecent || showResults) && (
        <View style={[styles.dropdown, { backgroundColor: t.surfaceRaised, borderColor: t.border }]}>
          {showRecent && (
            <>
              <Text style={[styles.section, { color: t.textFaint }]}>Recent</Text>
              {recent.map((c) => (
                <ResultRow key={c.id} city={c} onPress={() => pick(c)} />
              ))}
            </>
          )}
          {showResults && loading && results.length === 0 && (
            <View style={{ padding: space.md }}>
              <ActivityIndicator color={t.accent} />
            </View>
          )}
          {showResults && error && <Text style={{ color: t.danger, padding: space.md }}>{error}</Text>}
          {showResults && results.map((c) => <ResultRow key={c.id} city={c} onPress={() => pick(c)} />)}
        </View>
      )}
    </View>
  );
}

function ResultRow({ city, onPress }: { city: City; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.result, { backgroundColor: pressed ? t.chip : 'transparent' }]}
    >
      <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{city.name}</Text>
      <Text style={{ color: t.textMuted, fontSize: 13 }}>{cityLabel(city).replace(`${city.name}, `, '')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  section: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  result: { paddingHorizontal: 14, paddingVertical: 10 },
});
