import { Image } from 'expo-image';
import { Image as ImageIcon } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tintFor, tints, type TintName } from '@/theme';

type Props = {
  uri: string;
  // Keeps the placeholder colour stable for a given wish.
  seed: string;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

// Seeded demo wishes use "demo:<tint>" in place of a real photo.
const demoTint = (uri: string) => {
  const name = uri.startsWith('demo:') ? (uri.slice(5) as TintName) : null;
  return name && tints[name] ? tints[name] : null;
};

export const WishImage = ({ uri, seed, iconSize = 22, style }: Props) => {
  const demo = demoTint(uri);
  const tint = demo ?? tintFor(seed);
  return (
    <View style={[styles.frame, { backgroundColor: tint.bg }, style]}>
      {demo ? (
        <ImageIcon size={iconSize} color={tint.icon} strokeWidth={1.75} />
      ) : (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
