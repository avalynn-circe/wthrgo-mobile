import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatClock } from '../lib/time';
import { formatTemp } from '../lib/units';
import { radius, space, useTheme } from '../theme';
import type { Activity, DailySummary, ForecastInterval, TempUnit } from '../types';
import { ChevronIcon } from './Icons';
import { IntervalRow } from './IntervalRow';

interface Props {
  day: DailySummary;
  label: string;
  intervals: { interval: ForecastInterval; index: number }[];
  byInterval: Set<string>[];
  activitiesById: Map<string, Activity>;
  enabledActivities: Activity[];
  focusedActivityId: string | null;
  offset: number;
  unit: TempUnit;
  now: number;
  initiallyOpen: boolean;
}

/** Collapsible day card: summary header + interval rows. */
export const DayCard = memo(function DayCard({
  day,
  label,
  intervals,
  byInterval,
  activitiesById,
  enabledActivities,
  focusedActivityId,
  offset,
  unit,
  now,
  initiallyOpen,
}: Props) {
  const t = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Activities with at least one qualifying interval today (respecting focus).
  const dayActivityIds = new Set<string>();
  for (const { index } of intervals) for (const id of byInterval[index]) dayActivityIds.add(id);
  const dayActivities = [...dayActivityIds]
    .map((id) => activitiesById.get(id))
    .filter((a): a is Activity => !!a)
    .filter((a) => !focusedActivityId || a.id === focusedActivityId);
  const highlighted = dayActivities.length > 0;

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: highlighted ? t.accent : t.border }, highlighted && { borderWidth: 1.5 }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.label, { color: t.text }]}>{label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15 }}>{day.conditionEmoji}</Text>
            <Text style={{ color: t.textMuted, fontSize: 13 }} numberOfLines={1}>
              {day.conditionLabel}
            </Text>
            <Text style={{ color: t.textFaint, fontSize: 12 }}>
              ↑{formatClock(day.sunrise, offset, true)} ↓{formatClock(day.sunset, offset, true)}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ color: t.text, fontWeight: '700' }}>
            {formatTemp(day.high, unit)}
            <Text style={{ color: t.textFaint, fontWeight: '500' }}> / {formatTemp(day.low, unit)}</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {dayActivities.map((a) => (
              <View key={a.id} style={[styles.dot, { backgroundColor: a.color }]}>
                <Text style={{ fontSize: 11 }}>{a.icon || '•'}</Text>
              </View>
            ))}
          </View>
        </View>
        <ChevronIcon open={open} />
      </Pressable>

      {open &&
        (intervals.length === 0 ? (
          <Text style={{ color: t.textFaint, padding: space.md, fontSize: 13 }}>No time slots enabled for display. Adjust in Settings.</Text>
        ) : (
          intervals.map(({ interval, index }) => (
            <IntervalRow
              key={interval.start}
              interval={interval}
              offset={offset}
              unit={unit}
              windowActivities={[...byInterval[index]].map((id) => activitiesById.get(id)).filter((a): a is Activity => !!a)}
              enabledActivities={enabledActivities}
              focusedActivityId={focusedActivityId}
              isPast={interval.end <= now}
              expanded={expanded === index}
              onToggle={() => setExpanded((e) => (e === index ? null : index))}
            />
          ))
        ))}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
  label: { fontSize: 15, fontWeight: '800' },
  dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
