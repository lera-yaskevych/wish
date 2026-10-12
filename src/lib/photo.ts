import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const MAX_WIDTH = 1000;

// Opens the photo library and returns a small JPEG. Phone photos are several
// megabytes; shrinking them keeps lists fast and fits browser storage.
export const pickPhoto = async (): Promise<string | null> => {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (picked.canceled) return null;

  const asset = picked.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  // A browser's file URL dies with the tab, so on web the picture is kept as data.
  const web = Platform.OS === 'web';
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: web });
  return web && saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : saved.uri;
};
