import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { radius, space, useTheme } from '../theme';
import { Button } from './ui';

/**
 * First-run notice. "Got it" records explicit consent; "Dismiss" hides the
 * banner without recording consent (matches the web app's semantics).
 */
export function ConsentBanner() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const consent = useStore((s) => s.consent);
  const setConsent = useStore((s) => s.setConsent);
  const hydrated = useStore((s) => s.hydrated);
  if (!hydrated || consent !== null) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + space.md }]} pointerEvents="box-none">
      <View style={[styles.banner, { backgroundColor: t.surfaceRaised, borderColor: t.borderStrong }]}>
        <Text style={{ color: t.text, fontWeight: '700', marginBottom: 4 }}>Your data stays on this device</Text>
        <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 18 }}>
          Cities, activities and settings are stored locally only. Nothing is sent to a server. Future features like sync or ads may ask for additional consent.
        </Text>
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md, justifyContent: 'flex-end' }}>
          <Button title="Dismiss" kind="ghost" onPress={() => setConsent('dismissed')} />
          <Button title="Got it" onPress={() => setConsent('granted')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.md, right: space.md },
  banner: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
});
