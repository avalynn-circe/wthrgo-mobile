import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store/useStore';
import { space, radius, useTheme } from '../theme';
import { CitySearch } from './CitySearch';
import { ChevronIcon, SearchIcon, SunMoonIcon } from './Icons';
import { Sheet } from './Sheet';
import { Chip, IconButton } from './ui';

const DAY_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1);

/** Sticky toolbar: city, days dropdown, theme toggle. */
export function ForecastToolbar() {
  const t = useTheme();
  const city = useStore((s) => s.city);
  const days = useStore((s) => s.forecastDays);
  const setDays = useStore((s) => s.setForecastDays);
  const setTheme = useStore((s) => s.setTheme);
  const [citySheet, setCitySheet] = useState(false);
  const [daysSheet, setDaysSheet] = useState(false);

  const isDark = t.name === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <View style={[styles.bar, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
      <Pressable
        onPress={() => setCitySheet(true)}
        accessibilityRole="button"
        accessibilityLabel="Change city"
        style={({ pressed }) => [styles.cityBtn, { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.8 : 1 }]}
      >
        <SearchIcon size={16} />
        <Text style={{ color: t.text, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
          {city ? city.name : 'Choose a city'}
        </Text>
        {city?.admin1 ? (
          <Text style={{ color: t.textFaint, fontSize: 12 }} numberOfLines={1}>
            {city.admin1}
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        onPress={() => setDaysSheet(true)}
        accessibilityRole="button"
        accessibilityLabel="Forecast days"
        style={({ pressed }) => [styles.daysBtn, { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={{ color: t.text, fontWeight: '700' }}>{days}d</Text>
        <ChevronIcon size={14} />
      </Pressable>

      <IconButton onPress={toggleTheme} accessibilityLabel="Toggle theme">
        <SunMoonIcon dark={isDark} />
      </IconButton>

      <Sheet visible={citySheet} onClose={() => setCitySheet(false)} title="City" scroll={false}>
        <View style={{ minHeight: 320 }}>
          <CitySearch autoFocus onSelect={() => setCitySheet(false)} />
        </View>
      </Sheet>

      <Sheet visible={daysSheet} onClose={() => setDaysSheet(false)} title="Forecast length">
        <View style={styles.dayGrid}>
          {DAY_OPTIONS.map((d) => (
            <Chip
              key={d}
              label={`${d} day${d === 1 ? '' : 's'}`}
              on={d === days}
              onPress={() => {
                setDays(d);
                setDaysSheet(false);
              }}
            />
          ))}
        </View>
        <Text style={{ color: t.textFaint, fontSize: 12, marginTop: space.md }}>
          Open-Meteo provides up to 16 days. Accuracy drops past day 7.
        </Text>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  daysBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
