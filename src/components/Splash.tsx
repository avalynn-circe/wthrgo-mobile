import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { space, useTheme } from '../theme';
import { CitySearch } from './CitySearch';
import { Logo } from './Icons';
import { TAGLINE } from './TopBar';
import { Card } from './ui';

const CARDS = [
  { icon: '🎯', title: 'Define activities', body: 'Tell WthrGo what "good weather" means for each thing you like to do — temperature, wind, rain, time of day.' },
  { icon: '🪟', title: 'See your windows', body: 'The forecast lights up the hours that qualify. No more squinting at a 16-day forecast doing the math in your head.' },
  { icon: '⏱️', title: 'Know before it changes', body: 'Windows are flagged when rain is coming or conditions are about to turn, so you can plan around it.' },
];

/** First-open view shown whenever no city is selected. */
export function Splash() {
  const t = useTheme();
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: t.bg }}
    >
      <View style={styles.hero}>
        <Logo size={64} />
        <Text style={[styles.title, { color: t.text }]}>WthrGo</Text>
        <Text style={[styles.tag, { color: t.textMuted }]}>{TAGLINE}</Text>
      </View>

      <CitySearch large />

      <Text style={[styles.what, { color: t.textFaint }]}>What do I do here?</Text>
      <View style={{ gap: space.md }}>
        {CARDS.map((c) => (
          <Card key={c.title}>
            <Text style={{ fontSize: 26, marginBottom: 6 }}>{c.icon}</Text>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{c.title}</Text>
            <Text style={{ color: t.textMuted, fontSize: 14, lineHeight: 20 }}>{c.body}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, paddingTop: 48, paddingBottom: 96, gap: space.lg },
  hero: { alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  tag: { fontSize: 15, textAlign: 'center' },
  what: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: space.lg },
});
