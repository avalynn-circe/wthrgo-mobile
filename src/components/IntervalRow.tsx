import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { qualifyInterval } from '../engine/qualify';
import { formatClock } from '../lib/time';
import { formatDistance, formatPrecip, formatTemp, formatWind } from '../lib/units';
import { radius, space, useTheme } from '../theme';
import type { Activity, ForecastInterval, TempUnit } from '../types';
import { ChevronIcon } from './Icons';

interface Props {
  interval: ForecastInterval;
  offset: number;
  unit: TempUnit;
  /** Activities (enabled) that have a qualifying *window* covering this interval. */
  windowActivities: Activity[];
  /** All enabled activities, for the expanded pass/fail breakdown. */
  enabledActivities: Activity[];
  focusedActivityId: string | null;
  isPast: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export const IntervalRow = memo(function IntervalRow({
  interval: iv,
  offset,
  unit,
  windowActivities,
  enabledActivities,
  focusedActivityId,
  isPast,
  expanded,
  onToggle,
}: Props) {
  const t = useTheme();
  const focused = focusedActivityId ? windowActivities.some((a) => a.id === focusedActivityId) : false;
  const dim = isPast || (focusedActivityId != null && !focused);

  return (
    <View style={[styles.wrap, { borderTopColor: t.border }, focused && { backgroundColor: t.accentSoft }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.row, { opacity: dim ? 0.45 : pressed ? 0.85 : 1 }]}
      >
        <Text style={[styles.time, { color: t.textMuted }]}>{formatClock(iv.start, offset)}</Text>
        <Text style={[styles.temp, { color: t.text }]}>{formatTemp(iv.temperature, unit)}</Text>
        <Text style={{ fontSize: 16 }}>{iv.conditionEmoji}</Text>
        <Text style={[styles.cond, { color: t.textMuted }]} numberOfLines={1}>
          {iv.conditionLabel}
        </Text>
        <View style={styles.icons}>
          {windowActivities.map((a) => (
            <View key={a.id} style={[styles.dot, { backgroundColor: a.color }]}>
              <Text style={{ fontSize: 11 }}>{a.icon || '•'}</Text>
            </View>
          ))}
        </View>
        <ChevronIcon open={expanded} />
      </Pressable>

      {expanded && (
        <View style={[styles.detail, { backgroundColor: t.surfaceRaised, borderColor: t.border }]}>
          <View style={styles.grid}>
            <Stat label="Feels like" value={formatTemp(iv.feelsLike, unit)} />
            <Stat label="Precip" value={`${formatPrecip(iv.precipitation, unit)}${iv.precipType !== 'none' ? ` ${iv.precipType}` : ''}`} />
            <Stat label="Chance" value={`${Math.round(iv.precipProbability)}%`} />
            <Stat label="Wind" value={`${formatWind(iv.windSpeed, unit)} ${iv.windDirection}`} />
            <Stat label="Gusts" value={formatWind(iv.windGusts, unit)} />
            <Stat label="Cloud" value={`${Math.round(iv.cloudCover)}%`} />
            <Stat label="Visibility" value={formatDistance(iv.visibility, unit)} />
            <Stat label="Dew point" value={formatTemp(iv.dewPoint, unit)} />
            <Stat label="UV" value={iv.uvIndex.toFixed(1)} />
          </View>

          {enabledActivities.length > 0 && (
            <View style={{ marginTop: space.md, gap: space.sm }}>
              {enabledActivities.map((a) => {
                const q = qualifyInterval(iv, a.criteria, { unit });
                return (
                  <View key={a.id} style={[styles.verdict, { borderLeftColor: a.color, backgroundColor: t.surface, borderColor: t.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text style={{ color: q.ok ? t.green : t.danger, fontWeight: '800' }}>{q.ok ? '✓' : '✗'}</Text>
                      <Text style={{ color: t.text, fontWeight: '700' }}>
                        {a.icon} {a.name}
                      </Text>
                    </View>
                    {q.checks.map((c) => (
                      <View key={c.key} style={styles.check}>
                        <Text style={{ color: c.pass ? t.green : t.danger, width: 14 }}>{c.pass ? '✓' : '✗'}</Text>
                        <Text style={{ color: t.textMuted, flex: 1, fontSize: 13 }}>{c.label}</Text>
                        <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{c.actual}</Text>
                        <Text style={{ color: t.textFaint, fontSize: 12, marginLeft: 6 }}>{c.limit}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
});

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={{ color: t.textFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 10, paddingHorizontal: space.md },
  time: { width: 52, fontSize: 13, fontWeight: '600' },
  temp: { width: 40, fontSize: 15, fontWeight: '700' },
  cond: { flex: 1, fontSize: 13 },
  icons: { flexDirection: 'row', gap: 4 },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  detail: { marginHorizontal: space.md, marginBottom: space.md, borderRadius: radius.md, borderWidth: 1, padding: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.sm },
  stat: { width: '33.33%' },
  verdict: { borderLeftWidth: 3, borderWidth: 1, borderRadius: radius.sm, padding: space.sm },
  check: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
});
