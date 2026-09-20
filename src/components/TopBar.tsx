import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { space, useTheme } from '../theme';
import { ActivityPulseIcon, GearIcon, Logo } from './Icons';
import { IconButton } from './ui';

export const TAGLINE = 'Know when the weather works for you.';

export function TopBar({ onActivities, onSettings }: { onActivities: () => void; onSettings: () => void }) {
  const t = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
      <View style={styles.brand}>
        <Logo size={30} />
        <View>
          <Text style={[styles.title, { color: t.text }]}>WthrGo</Text>
          <Text style={[styles.tag, { color: t.textFaint }]} numberOfLines={1}>
            {TAGLINE}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        <IconButton onPress={onActivities} accessibilityLabel="Activities">
          <ActivityPulseIcon size={26} />
        </IconButton>
        <IconButton onPress={onSettings} accessibilityLabel="Settings">
          <GearIcon size={24} />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  tag: { fontSize: 11 },
});
