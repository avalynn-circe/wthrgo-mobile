import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type TextInputProps, type ViewStyle } from 'react-native';
import { radius, space, useTheme } from '../theme';

export function Card({ children, style, highlighted }: { children: React.ReactNode; style?: ViewStyle; highlighted?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: highlighted ? t.accent : t.border },
        highlighted && { borderWidth: 1.5 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chip({
  label,
  on,
  onPress,
  color,
  small,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  color?: string;
  small?: boolean;
}) {
  const t = useTheme();
  const bg = on ? color ?? t.chipOn : t.chip;
  const fg = on ? (color ? '#fff' : t.chipOnText) : t.textMuted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      style={({ pressed }) => [
        styles.chip,
        small && styles.chipSmall,
        { backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.chipText, small && { fontSize: 12 }, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.accent : kind === 'danger' ? t.danger : 'transparent';
  const fg = kind === 'ghost' ? t.accent : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        kind === 'ghost' && { borderWidth: 1, borderColor: t.border },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ children, style, ...rest }: PressableProps & { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      {...rest}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: pressed ? t.chip : 'transparent' }, style]}
    >
      {children}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.textFaint}
      {...props}
      style={[
        styles.input,
        { backgroundColor: t.surfaceRaised, borderColor: t.border, color: t.text },
        props.style,
      ]}
    />
  );
}

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: space.xs }}>
      <Text style={[styles.label, { color: t.textMuted }]}>{children}</Text>
      {hint ? <Text style={{ color: t.textFaint, fontSize: 12 }}>{hint}</Text> : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: space.md }} />;
}

/** Segmented control for a small fixed set of options. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: t.chip }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.segmentItem, on && { backgroundColor: t.surface, borderColor: t.border }]}
          >
            <Text style={{ color: on ? t.text : t.textMuted, fontWeight: on ? '700' : '500', fontSize: 13 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipSmall: { paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.md - 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
