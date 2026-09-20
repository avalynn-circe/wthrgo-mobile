# WthrGo — Android (React Native)

Native React Native port of [wthrgo.com](https://wthrgo.com). Not a WebView wrapper: the UI is
rebuilt with React Native components and the domain logic (Open-Meteo client, 3-hour aggregation,
activity criteria, window detection) is ported to platform-free TypeScript under `src/engine` and
`src/api`.

Built on Expo SDK 57 / React Native 0.86 (managed workflow, prebuild-ready). No account or API key
is needed: Open-Meteo is free, and all user data lives on the device in AsyncStorage under the same
`wthrgo-v1` key the web app uses in localStorage.

## Layout

```
App.tsx                     Providers (safe area, theme) + status bar
src/types                   Domain types (Activity, ActivityCriteria, ForecastInterval, WeatherWindow …)
src/api/openMeteo.ts        Forecast fetch, normalisation, 1h → 3h aggregation
src/api/geocode.ts          City search (Open-Meteo geocoding, up to 8 results)
src/engine/qualify.ts       Per-interval pass/fail with a full per-criterion breakdown
src/engine/detect.ts        Window detection (pure TS, runs on the full array, filters past windows)
src/engine/presets.ts       Preset library, default criteria, 16-colour palette, clone/blank helpers
src/store/useStore.ts       Zustand + persist (AsyncStorage). `partialize` controls what is saved.
src/theme                   Light/dark palettes; follows the OS until the user toggles
src/components              TopBar, Splash, CitySearch, ForecastToolbar, DayCard, IntervalRow,
                            ActivitiesModal, ActivityEditor, SettingsModal, ConsentBanner, Sheet, ui
src/screens/HomeScreen.tsx  Splash when no city, otherwise the forecast
__tests__                   Jest (jest-expo) tests for the engine, aggregation and time helpers
```

## Feature parity with the web app

- Forecast 1–16 days, 1-hour or 3-hour intervals (hourly data aggregated: averages for continuous
  values, sums for precipitation, max probability, most severe condition, vector-averaged wind).
- All per-interval data points (temp, feels-like, dew point, wind + gusts + 8-point direction,
  precipitation + type + probability, cloud cover, UV, visibility, WMO condition label + emoji).
- Daily summary with high/low, dominant condition, sunrise/sunset.
- Debounced (280 ms) city search with up to 8 recent cities.
- Activities: 11 presets (all editable), blank activity, edit, clone, delete, enable/disable toggle,
  focus (tap a name to highlight only that activity's windows).
- Basic and advanced criteria exactly as on the web, including pre/post-rain flags and the stored
  but not-yet-evaluated consecutive-days field.
- Detection decisions preserved: metric internally, `max(1, ceil(hours / intervalSize))`,
  time-of-day at interval midpoint (GAP-001), `isPolarNight` on the interval (now populated from
  Open-Meteo `daylight_duration`), full-array semantics, flag-based window shape.
- Collapsible day cards, dimmed past rows, expandable interval detail with ✓/✗ per activity and
  per-criterion actual-vs-limit.
- Display-hours chip filter (3-hour blocks or 24 individual hours; switching interval resets to
  sensible defaults).
- Settings: °F/°C, interval size, display hours, notifications placeholder.
- Light/dark theme with OS detection, persisted once toggled.
- First-run consent banner ("Got it" records consent, "Dismiss" hides without consent).

Native-specific differences: modals are bottom sheets / anchored panels instead of portals, the
"days" dropdown is a chip sheet, and pull-to-refresh refetches the forecast.

## Develop

```bash
npm install
npm run typecheck
npm test
npm start            # Metro; scan the QR with Expo Go, or press "a" for an emulator
```

## Build an Android APK / AAB

Local build (needs Android Studio / SDK, JDK 17):

```bash
npx expo prebuild --platform android      # generates ./android (git-ignored)
npx expo run:android                      # debug build to a connected device / emulator
cd android && ./gradlew assembleRelease   # release APK → android/app/build/outputs/apk/release/
```

Cloud build with EAS (no local SDK needed):

```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview    # APK for sideloading
eas build -p android --profile production # AAB for Play Store
```

Package name is `com.wthrgo.app` (see `app.json`). Icons and splash use the Expo defaults under
`assets/` — replace them with the WthrGo brand assets before publishing.

## Roadmap hooks

- `src/engine` has no React or platform imports and can be reused server-side unchanged.
- `ActivityCriteria` is a separate object from `Activity` for cloning/versioning.
- Swap `createJSONStorage(() => AsyncStorage)` in the store for a synced storage adapter when
  accounts arrive; `partialize` already defines the sync payload.
- Notifications (morning digest, window-closing alerts) can be added with `expo-notifications`;
  the Settings modal already reserves the space.
