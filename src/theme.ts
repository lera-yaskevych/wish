import { Platform, StyleSheet, type TextStyle } from 'react-native';

export const colors = {
  bg: '#F5F0E8',
  surface: '#FFFCF6',
  panel: '#ECE5DA',
  ink: '#1E1C18',
  body: '#4A463E',
  muted: '#6E685D',
  faint: '#A39C8E',
  line: '#E4DDCF',
  accent: '#A94C2B',
  danger: '#A33620',
  green: '#3D6247',
  greenSoft: '#E2E9DD',
  scrim: 'rgba(46, 40, 32, 0.62)',
  white: '#FFFFFF',
};

export const tints = {
  sand: { bg: '#E8DDCB', icon: '#B5A285', text: '#7A5A2E' },
  sage: { bg: '#DDE3D8', icon: '#93A790', text: '#3E5A40' },
  rose: { bg: '#EBD5CF', icon: '#C29A8E', text: '#8A3A28' },
  lavender: { bg: '#DCDBE8', icon: '#A09DBF', text: '#4A4670' },
};

export type TintName = keyof typeof tints;

const tintNames = Object.keys(tints) as TintName[];

// Stable tint per id, so a person or wish keeps its colour between renders.
export const tintFor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return tints[tintNames[hash % tintNames.length]];
};

const web = Platform.OS === 'web';

const SERIF_FALLBACK = 'Georgia, "Times New Roman", serif';
const SANS_FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

// Instrument Serif and Sans have no Cyrillic letters. A browser falls back letter by
// letter, so each face names what should draw Ukrainian text and repeats its weight and
// slant as a hint for that fallback (index.html turns off faux bold and italic, so the
// hint never distorts the real face). Native apps substitute the system font themselves
// and want the face name alone.
const face = (
  families: string[],
  fallback: string,
  fontWeight: TextStyle['fontWeight'],
  fontStyle: TextStyle['fontStyle'] = 'normal',
): TextStyle =>
  web ? { fontFamily: `${families.join(', ')}, ${fallback}`, fontWeight, fontStyle } : { fontFamily: families[0] };

export const fonts = {
  serif: face(['InstrumentSerif_400Regular', 'CormorantGaramond_500Medium'], SERIF_FALLBACK, '400'),
  serifItalic: face(
    ['InstrumentSerif_400Regular_Italic', 'CormorantGaramond_500Medium_Italic'],
    SERIF_FALLBACK,
    '400',
    'italic',
  ),
  sans: face(['InstrumentSans_400Regular'], SANS_FALLBACK, '400'),
  medium: face(['InstrumentSans_500Medium'], SANS_FALLBACK, '500'),
  semibold: face(['InstrumentSans_600SemiBold'], SANS_FALLBACK, '600'),
  bold: face(['InstrumentSans_700Bold'], SANS_FALLBACK, '700'),
};

export const type = StyleSheet.create({
  display: { ...fonts.serif, fontSize: 46, lineHeight: 48, letterSpacing: -0.6, color: colors.ink },
  title: { ...fonts.serif, fontSize: 36, lineHeight: 40, letterSpacing: -0.3, color: colors.ink },
  quote: { ...fonts.serifItalic, fontSize: 23, lineHeight: 28, color: colors.ink },
  cardTitle: { ...fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { ...fonts.sans, fontSize: 17, lineHeight: 25, color: colors.body },
  sub: { ...fonts.sans, fontSize: 15, lineHeight: 20, color: colors.muted },
  label: { ...fonts.medium, fontSize: 14, lineHeight: 18, color: colors.muted },
  small: { ...fonts.sans, fontSize: 13.5, lineHeight: 18, color: colors.muted },
  price: { ...fonts.bold, fontSize: 15, lineHeight: 20, color: colors.ink },
});
