import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { activityFromPreset, blankActivity, cloneActivity, PRESETS } from '../engine/presets';
import { useStore } from '../store/useStore';
import { radius, space, useTheme } from '../theme';
import type { Activity } from '../types';
import { ActivityEditor } from './ActivityEditor';
import { Sheet } from './Sheet';
import { Button, Chip } from './ui';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Lists activities with enable toggles (Google-Calendar style), edit / clone /
 * delete actions, and an Add flow (preset picker or blank).
 */
export function ActivitiesModal({ visible, onClose }: Props) {
  const t = useTheme();
  const activities = useStore((s) => s.activities);
  const toggle = useStore((s) => s.toggleActivity);
  const add = useStore((s) => s.addActivity);
  const remove = useStore((s) => s.removeActivity);
  const focused = useStore((s) => s.focusedActivityId);
  const setFocused = useStore((s) => s.setFocusedActivity);

  const [editing, setEditing] = useState<Activity | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [picker, setPicker] = useState(false);

  const startNew = (a: Activity) => {
    setPicker(false);
    setIsNew(true);
    setEditing(a);
  };

  const confirmDelete = (a: Activity) =>
    Alert.alert('Delete activity?', `"${a.name}" and its criteria will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(a.id) },
    ]);

  return (
    <>
      <Sheet
        visible={visible && !editing}
        onClose={onClose}
        title="Activities"
        footer={
          <>
            {focused ? <Button title="Clear focus" kind="ghost" onPress={() => setFocused(null)} /> : null}
            <Button title="+ Add" onPress={() => setPicker(true)} />
          </>
        }
      >
        {activities.length === 0 ? (
          <Text style={{ color: t.textMuted, lineHeight: 20 }}>
            No activities yet. Add one from a preset or start from scratch — every preset is fully editable.
          </Text>
        ) : (
          <View style={{ gap: space.sm }}>
            {activities.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.item,
                  { backgroundColor: t.surfaceRaised, borderColor: focused === a.id ? t.accent : t.border, borderLeftColor: a.color },
                ]}
              >
                <Pressable
                  onPress={() => setFocused(focused === a.id ? null : a.id)}
                  accessibilityRole="button"
                  accessibilityHint="Focus the forecast on this activity"
                  style={{ flex: 1 }}
                >
                  <Text style={{ color: a.enabled ? t.text : t.textFaint, fontSize: 16, fontWeight: '700' }}>
                    {a.icon ? `${a.icon} ` : ''}
                    {a.name || 'Untitled'}
                  </Text>
                  <Text style={{ color: t.textFaint, fontSize: 12 }} numberOfLines={1}>
                    {summarize(a)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    <Chip small label="Edit" onPress={() => { setIsNew(false); setEditing(a); }} />
                    <Chip small label="Clone" onPress={() => add(cloneActivity(a))} />
                    <Chip small label="Delete" onPress={() => confirmDelete(a)} />
                  </View>
                </Pressable>
                <Switch
                  value={a.enabled}
                  onValueChange={(v) => toggle(a.id, v)}
                  trackColor={{ true: a.color, false: t.borderStrong }}
                  thumbColor="#fff"
                  accessibilityLabel={`Enable ${a.name}`}
                />
              </View>
            ))}
          </View>
        )}

        {picker && (
          <View style={[styles.picker, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: space.sm }}>
              Start from a preset
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {PRESETS.map((p) => (
                <Chip key={p.key} label={`${p.icon} ${p.name}`} onPress={() => startNew(activityFromPreset(p))} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
              <Button title="Blank activity" kind="ghost" onPress={() => startNew(blankActivity())} />
              <Button title="Cancel" kind="ghost" onPress={() => setPicker(false)} />
            </View>
          </View>
        )}
      </Sheet>

      {editing && (
        <ActivityEditor
          activity={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function summarize(a: Activity): string {
  const c = a.criteria;
  const parts: string[] = [];
  if (c.tempMin != null || c.tempMax != null) parts.push(`${c.tempMin ?? '–'}–${c.tempMax ?? '–'}°C`);
  if (c.windMax != null) parts.push(`wind ≤${c.windMax}`);
  parts.push(c.timeOfDay === 'any' ? 'any time' : c.timeOfDay);
  parts.push(`${c.consecutiveHoursRequired}h+`);
  return parts.join(' · ');
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: radius.md,
    padding: space.md,
  },
  picker: { marginTop: space.lg, borderWidth: 1, borderRadius: radius.md, padding: space.md },
});
