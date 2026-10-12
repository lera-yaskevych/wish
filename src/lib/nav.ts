import { router, type Href } from 'expo-router';

// On web a screen can be opened straight from its URL, leaving nothing to go back to.
export const goBack = (fallback: Href = '/') => (router.canGoBack() ? router.back() : router.replace(fallback));
