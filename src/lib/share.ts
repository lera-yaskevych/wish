import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';

// The address that opens someone's list from its share token. On the web it is this
// site's own address, so it works for anyone, signed in or not.
export const listLink = (token: string) =>
  Platform.OS === 'web' ? `${window.location.origin}/list/${token}` : Linking.createURL(`list/${token}`);

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
