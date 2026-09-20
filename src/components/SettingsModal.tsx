import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { hourChip } from '../lib/time';
import { useStore } from '../store/useStore';
import { space, useTheme } from '../theme';
import type { IntervalSize, TempUnit } from '../types';
import { Sheet } from './Sheet';
import { Chip, Divider, Label, Segmented } from './ui';

/** Settings: units, interval size, display-hour chips, notifications placeholder. */
export function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const unit = useStore((s) => s.tempUnit);
  const setUnit = useStore((s) => s.setTempUnit);
  const size = useStore((s) => s.intervalSize);
  const setSize = useStore((s) => s.setIntervalSize);
  const slots = useStore((s) => s.displaySlots);
  const toggleSlot = useStore((s) => s.toggleSlot);

  const hours = size === 3 ? [0, 3, 6, 9, 12, 15, 18, 21] : Array.from({ length: 24 }, (_, i) => i);

  return (
    <Sheet visible={visible} onClose={onClose} title="Settings" anchor="top">
      <Label>Temperature</Label>
      <Segmented<TempUnit>
        value={unit}
        onChange={setUnit}
        options={[
          { value: 'F', label: '°F' },
          { value: 'C', label: '°C' },
        ]}
      />

      <View style={{ marginTop: space.lg }}>
        <Label hint="Switching resets the display hours below">Forecast interval</Label>
        <Segmented<IntervalSize>
          value={size}
          onChange={setSize}
          options={[
            { value: 1, label: '1 hour' },
            { value: 3, label: '3 hours' },
          ]}
        />
      </View>

      <View style={{ marginTop: space.lg }}>
        <Label hint="Detection still runs on every hour; this only changes what is shown">Display hours</Label>
        <View style={styles.grid}>
          {hours.map((h) => (
            <Chip key={h} small label={hourChip(h)} on={slots.includes(h)} onPress={() => toggleSlot(h)} />
          ))}
        </View>
      </View>

      <Divider />
      <Label>Notifications</Label>
      <Text style={{ color: t.textFaint, fontSize: 13, lineHeight: 18 }}>
        Morning digests and window-closing alerts are coming in a later release.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
