import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivitiesModal } from '../components/ActivitiesModal';
import { ConsentBanner } from '../components/ConsentBanner';
import { ForecastView } from '../components/ForecastView';
import { SettingsModal } from '../components/SettingsModal';
import { Splash } from '../components/Splash';
import { TopBar } from '../components/TopBar';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';

export function HomeScreen() {
  const t = useTheme();
  const city = useStore((s) => s.city);
  const hydrated = useStore((s) => s.hydrated);
  const [activities, setActivities] = useState(false);
  const [settings, setSettings] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <TopBar onActivities={() => setActivities(true)} onSettings={() => setSettings(true)} />
      {!hydrated ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : city ? (
        <ForecastView />
      ) : (
        <Splash />
      )}
      <ActivitiesModal visible={activities} onClose={() => setActivities(false)} />
      <SettingsModal visible={settings} onClose={() => setSettings(false)} />
      <ConsentBanner />
    </SafeAreaView>
  );
}
