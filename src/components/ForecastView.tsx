import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { detectAll } from '../engine/detect';
import { useForecast } from '../hooks/useForecast';
import { dateKey, dayLabel, nowEpoch } from '../lib/time';
import { useStore } from '../store/useStore';
import { space, useTheme } from '../theme';
import { DayCard } from './DayCard';
import { ForecastToolbar } from './ForecastToolbar';
import { Button } from './ui';

/** Sticky toolbar plus the scrollable day list. */
export function ForecastView() {
  const t = useTheme();
  const { forecast, loading, error, refresh } = useForecast();
  const activities = useStore((s) => s.activities);
  const unit = useStore((s) => s.tempUnit);
  const slots = useStore((s) => s.displaySlots);
  const focusedActivityId = useStore((s) => s.focusedActivityId);

  // Re-evaluate "now" every minute so past rows dim without a refetch.
  const [now, setNow] = useState(nowEpoch());
  useEffect(() => {
    const id = setInterval(() => setNow(nowEpoch()), 60_000);
    return () => clearInterval(id);
  }, []);

  const enabled = useMemo(() => activities.filter((a) => a.enabled), [activities]);
  const activitiesById = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);

  const detection = useMemo(
    () => (forecast ? detectAll(forecast.intervals, enabled, { now, intervalSize: forecast.intervalSize }) : null),
    [forecast, enabled, now],
  );

  const days = useMemo(() => {
    if (!forecast || !detection) return [];
    const offset = forecast.utcOffsetSeconds;
    const todayKey = dateKey(now, offset);
    const tomorrowKey = dateKey(now + 86400, offset);
    const slotSet = new Set(slots);
    return forecast.days.map((day) => ({
      day,
      label: dayLabel(day.dateKey, todayKey, tomorrowKey),
      intervals: forecast.intervals
        .map((interval, index) => ({ interval, index }))
        .filter((x) => x.interval.dateKey === day.dateKey && slotSet.has(x.interval.localHour)),
    }));
  }, [forecast, detection, slots, now]);

  return (
    <View style={{ flex: 1 }}>
      <ForecastToolbar />
      {error && !forecast ? (
        <View style={styles.center}>
          <Text style={{ color: t.danger, textAlign: 'center' }}>{error}</Text>
          <Button title="Try again" onPress={refresh} kind="ghost" style={{ marginTop: space.md }} />
        </View>
      ) : !forecast ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(d) => d.day.dateKey}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={t.accent} colors={[t.accent]} />}
          ListHeaderComponent={
            enabled.length === 0 ? (
              <View style={[styles.hint, { backgroundColor: t.accentSoft }]}>
                <Text style={{ color: t.text, fontWeight: '700' }}>No activities yet</Text>
                <Text style={{ color: t.textMuted, fontSize: 13 }}>Tap the activity icon up top to add one — the forecast will light up the hours that qualify.</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <DayCard
              day={item.day}
              label={item.label}
              intervals={item.intervals}
              byInterval={detection!.byInterval}
              activitiesById={activitiesById}
              enabledActivities={enabled}
              focusedActivityId={focusedActivityId}
              offset={forecast.utcOffsetSeconds}
              unit={unit}
              now={now}
              initiallyOpen={index < 2}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  list: { padding: space.lg, paddingBottom: 120 },
  hint: { padding: space.md, borderRadius: 12, marginBottom: space.md, gap: 4 },
});
