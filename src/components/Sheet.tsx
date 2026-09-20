import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, useTheme } from '../theme';
import { CloseIcon } from './Icons';
import { IconButton } from './ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 'sheet' slides up from the bottom; 'top' anchors under the top bar (Settings). */
  anchor?: 'sheet' | 'top';
  scroll?: boolean;
  footer?: React.ReactNode;
}

/**
 * Native replacement for the web app's portal-rendered modals: a dimmed
 * backdrop with a floating panel. Tapping the backdrop closes it.
 */
export function Sheet({ visible, onClose, title, children, anchor = 'sheet', scroll = true, footer }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <Modal visible={visible} transparent animationType={anchor === 'sheet' ? 'slide' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={[styles.backdrop, { backgroundColor: t.backdrop }]} onPress={onClose} accessibilityLabel="Close" />
        <View
          pointerEvents="box-none"
          style={[styles.host, anchor === 'top' ? { justifyContent: 'flex-start', paddingTop: insets.top + 56, alignItems: 'flex-end', paddingHorizontal: space.md } : { justifyContent: 'flex-end' }]}
        >
          <View
            style={[
              styles.panel,
              { backgroundColor: t.surface, borderColor: t.border },
              anchor === 'sheet'
                ? { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom, maxHeight: '88%' }
                : { borderRadius: radius.lg, width: '100%', maxWidth: 420, maxHeight: '80%' },
            ]}
          >
            <View style={[styles.header, { borderBottomColor: t.border }]}>
              <Text style={[styles.title, { color: t.text }]}>{title}</Text>
              <IconButton onPress={onClose} accessibilityLabel="Close">
                <CloseIcon />
              </IconButton>
            </View>
            <Body style={{ flexGrow: 0 }} contentContainerStyle={scroll ? { padding: space.lg } : undefined} keyboardShouldPersistTaps="handled">
              {scroll ? children : <View style={{ padding: space.lg }}>{children}</View>}
            </Body>
            {footer ? <View style={[styles.footer, { borderTopColor: t.border }]}>{footer}</View> : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  host: { flex: 1 },
  panel: { borderWidth: 1, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.lg,
    paddingRight: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: '800' },
  footer: { padding: space.md, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
});
