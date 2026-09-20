import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ACTIVITY_COLORS } from '../engine/presets';
import { PRECIP_TOLERANCE_LABELS } from '../engine/qualify';
import { cToF, COMPASS, fToC, kphToMph } from '../lib/units';
import { useStore } from '../store/useStore';
import { space, useTheme } from '../theme';
import type { Activity, ActivityCriteria, CompassPoint, PrecipTolerance, PrecipType, TimeOfDayPreference } from '../types';
import { Sheet } from './Sheet';
import { Button, Chip, Divider, Input, Label, Row, Segmented } from './ui';

interface Props {
  activity: Activity;
  isNew: boolean;
  onClose: () => void;
}

const PRECIP_TYPES: PrecipType[] = ['rain', 'snow', 'sleet', 'freezing-rain'];

/** Modal editor for one activity: basic + advanced criteria, color, icon, notes. */
export function ActivityEditor({ activity, isNew, onClose }: Props) {
  const t = useTheme();
  const unit = useStore((s) => s.tempUnit);
  const add = useStore((s) => s.addActivity);
  const update = useStore((s) => s.updateActivity);

  const [draft, setDraft] = useState<Activity>({ ...activity, criteria: { ...activity.criteria } });
  const [advanced, setAdvanced] = useState(false);

  const setC = <K extends keyof ActivityCriteria>(key: K, value: ActivityCriteria[K]) =>
    setDraft((d) => ({ ...d, criteria: { ...d.criteria, [key]: value } }));

  const save = () => {
    const a = { ...draft, name: draft.name.trim() || 'Untitled' };
    if (isNew) add(a);
    else update(a);
    onClose();
  };

  const c = draft.criteria;
  const wind = unit === 'F';

  return (
    <Sheet
      visible
      onClose={onClose}
      title={isNew ? 'New activity' : 'Edit activity'}
      footer={
        <>
          <Button title="Cancel" kind="ghost" onPress={onClose} />
          <Button title="Save" onPress={save} />
        </>
      }
    >
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ width: 70 }}>
          <Label>Icon</Label>
          <Input value={draft.icon} onChangeText={(icon) => setDraft({ ...draft, icon })} placeholder="⛳" maxLength={4} style={{ textAlign: 'center', fontSize: 22 }} />
        </View>
        <View style={{ flex: 1 }}>
          <Label>Name</Label>
          <Input value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="e.g. Golf" autoFocus={isNew} />
        </View>
      </Row>

      <View style={{ marginTop: space.md }}>
        <Label>Color</Label>
        <View style={styles.colors}>
          {ACTIVITY_COLORS.map((col) => (
            <Pressable
              key={col}
              onPress={() => setDraft({ ...draft, color: col })}
              accessibilityRole="button"
              accessibilityLabel={`Color ${col}`}
              style={[styles.swatch, { backgroundColor: col }, draft.color === col && { borderColor: t.text, borderWidth: 3 }]}
            />
          ))}
        </View>
      </View>

      <Divider />

      <Label hint={unit === 'F' ? 'Shown in °F, stored in °C' : undefined}>Temperature range</Label>
      <Row>
        <TempField value={c.tempMin} unit={unit} placeholder="Min" onChange={(v) => setC('tempMin', v)} />
        <Text style={{ color: t.textFaint }}>to</Text>
        <TempField value={c.tempMax} unit={unit} placeholder="Max" onChange={(v) => setC('tempMax', v)} />
      </Row>

      <View style={{ marginTop: space.md }}>
        <Label>Max dew point</Label>
        <TempField value={c.dewPointMax} unit={unit} placeholder="Any" onChange={(v) => setC('dewPointMax', v)} />
      </View>

      <View style={{ marginTop: space.md }}>
        <Label>Max wind ({wind ? 'mph' : 'kph'})</Label>
        <NumField
          value={c.windMax == null ? null : wind ? kphToMph(c.windMax) : c.windMax}
          placeholder="Any"
          onChange={(v) => setC('windMax', v == null ? null : wind ? v / 0.621371 : v)}
        />
      </View>

      <View style={{ marginTop: space.md }}>
        <Label>Precipitation tolerance</Label>
        <View style={styles.wrap}>
          {([0, 1, 2, 3, 4] as PrecipTolerance[]).map((lvl) => (
            <Chip key={lvl} label={PRECIP_TOLERANCE_LABELS[lvl]} on={c.precipTolerance === lvl} onPress={() => setC('precipTolerance', lvl)} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: space.md }}>
        <Label>Time of day</Label>
        <Segmented<TimeOfDayPreference>
          value={c.timeOfDay}
          onChange={(v) => setC('timeOfDay', v)}
          options={[
            { value: 'day', label: 'Daytime' },
            { value: 'night', label: 'Night' },
            { value: 'any', label: 'Any' },
          ]}
        />
      </View>

      <View style={{ marginTop: space.md }}>
        <Label hint="A window must be at least this long">Consecutive hours required</Label>
        <NumField value={c.consecutiveHoursRequired} placeholder="1" onChange={(v) => setC('consecutiveHoursRequired', Math.max(1, v ?? 1))} />
      </View>

      <Divider />

      <Pressable onPress={() => setAdvanced((a) => !a)} accessibilityRole="button" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: t.accent, fontWeight: '700' }}>{advanced ? 'Hide advanced' : 'Show advanced'}</Text>
        <Text style={{ color: t.textFaint }}>{advanced ? '▲' : '▼'}</Text>
      </Pressable>

      {advanced && (
        <View style={{ gap: space.md, marginTop: space.md }}>
          <View>
            <Label hint="Leave all off to allow any type">Allowed precipitation types</Label>
            <View style={styles.wrap}>
              {PRECIP_TYPES.map((p) => {
                const on = c.precipTypes?.includes(p) ?? false;
                return (
                  <Chip
                    key={p}
                    label={p}
                    on={on}
                    onPress={() => {
                      const cur = c.precipTypes ?? [];
                      const next = on ? cur.filter((x) => x !== p) : [...cur, p];
                      setC('precipTypes', next.length ? next : null);
                    }}
                  />
                );
              })}
            </View>
          </View>

          <View>
            <Label>UV index range</Label>
            <Row>
              <NumField value={c.uvMin} placeholder="Min" onChange={(v) => setC('uvMin', v)} />
              <Text style={{ color: t.textFaint }}>to</Text>
              <NumField value={c.uvMax} placeholder="Max" onChange={(v) => setC('uvMax', v)} />
            </Row>
          </View>

          <View>
            <Label>Minimum visibility (km)</Label>
            <NumField value={c.visibilityMin} placeholder="Any" onChange={(v) => setC('visibilityMin', v)} />
          </View>

          <View>
            <Label hint="Leave all off to allow any direction">Wind from</Label>
            <View style={styles.wrap}>
              {COMPASS.map((d) => {
                const on = c.windDirections?.includes(d) ?? false;
                return (
                  <Chip
                    key={d}
                    label={d}
                    on={on}
                    onPress={() => {
                      const cur: CompassPoint[] = c.windDirections ?? [];
                      const next = on ? cur.filter((x) => x !== d) : [...cur, d];
                      setC('windDirections', next.length ? next : null);
                    }}
                  />
                );
              })}
            </View>
          </View>

          <View>
            <Label>Max cloud cover (%)</Label>
            <NumField value={c.cloudCoverMax} placeholder="Any" onChange={(v) => setC('cloudCoverMax', v)} />
          </View>

          <ToggleRow label="Flag windows before rain" value={c.detectPreRain} onChange={(v) => setC('detectPreRain', v)} />
          <ToggleRow label="Flag windows after rain" value={c.detectPostRain} onChange={(v) => setC('detectPostRain', v)} />

          <View>
            <Label hint="Stored for a future release; not yet used in detection">Consecutive days required</Label>
            <NumField value={c.consecutiveDaysRequired} placeholder="1" onChange={(v) => setC('consecutiveDaysRequired', Math.max(1, v ?? 1))} />
          </View>
        </View>
      )}

      <Divider />
      <Label>Notes</Label>
      <Input value={draft.notes} onChangeText={(notes) => setDraft({ ...draft, notes })} placeholder="Anything worth remembering" multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
    </Sheet>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: t.text }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: t.accent, false: t.borderStrong }} thumbColor="#fff" />
    </View>
  );
}

/** Numeric text field that maps '' ↔ null. */
function NumField({ value, placeholder, onChange }: { value: number | null; placeholder: string; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(value == null ? '' : String(Math.round(value * 10) / 10));
  return (
    <Input
      value={text}
      placeholder={placeholder}
      keyboardType="numeric"
      onChangeText={(s) => {
        setText(s);
        const n = parseFloat(s.replace(',', '.'));
        onChange(s.trim() === '' || Number.isNaN(n) ? null : n);
      }}
      style={{ flex: 1 }}
    />
  );
}

/** Temperature field: displays in user's unit, stores °C. */
function TempField({ value, unit, placeholder, onChange }: { value: number | null; unit: 'C' | 'F'; placeholder: string; onChange: (c: number | null) => void }) {
  const shown = value == null ? null : unit === 'F' ? cToF(value) : value;
  return <NumField value={shown} placeholder={placeholder} onChange={(v) => onChange(v == null ? null : unit === 'F' ? fToC(v) : v)} />;
}

const styles = StyleSheet.create({
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 0, borderColor: 'transparent' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
