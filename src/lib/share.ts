import { Platform, Share } from 'react-native';

// Opens the phone's share sheet. Desktop browsers have none, so there the text
// is copied to the clipboard instead and the caller is told.
export const shareText = async (message: string): Promise<'shared' | 'copied' | 'failed'> => {
  if (Platform.OS !== 'web' || typeof navigator.share === 'function') {
    await Share.share({ message }).catch(() => {});
    return 'shared';
  }
  try {
    await navigator.clipboard.writeText(message);
    return 'copied';
  } catch {
    return 'failed';
  }
};
