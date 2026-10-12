import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { colors } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const Grabber = () => <View style={styles.grabber} />;

// Bottom sheet over a dimmed screen, used for confirmations.
export const Sheet = ({ visible, onClose, children }: Props) => {
  const insets = useSafeAreaInsets();
  const t = useT();
  const offset = useRef(new Animated.Value(48)).current;

  useEffect(() => {
    if (!visible) return;
    offset.setValue(48);
    Animated.timing(offset, {
      toValue: 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, offset]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable accessibilityLabel={t.common.close} style={styles.scrim} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + 24, transform: [{ translateY: offset }] }]}>
          <Grabber />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
    marginBottom: 26,
  },
});
