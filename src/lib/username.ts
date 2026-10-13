// Usernames are Latin so they can be typed on any keyboard. Names written in
// Cyrillic are transliterated first (Ukrainian national standard, simplified).

const LETTERS: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i',
  ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia',
  ы: 'y', э: 'e', ё: 'io', ъ: '',
  // Turkish dotless i has no accent to strip, so it is mapped like a letter of its own.
  ı: 'i',
};

// These letters are written differently when they open a word: Юлія → yuliia.
const WORD_START: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' };

export const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/;

// Lower-case Latin letters with accents and apostrophes removed: "Мар’яна Kovač" → "mariana kovac".
const toLatin = (text: string) => {
  let out = '';
  let atWordStart = true;
  for (const char of text.toLowerCase()) {
    if (char in LETTERS) out += (atWordStart && WORD_START[char]) || LETTERS[char];
    else out += char;
    atWordStart = !/[\p{L}\p{N}’']/u.test(char);
  }
  return out
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '');
};

// The username suggested for a name: "Валерія Яскевич" → "valeriia.yaskevych".
export const usernameFrom = (name: string) => {
  const slug = toLatin(name)
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 24)
    .replace(/\.+$/, '');
  // Very short names are padded to the 3-character minimum.
  return slug ? slug.padEnd(3, '_') : '';
};

// Keeps a username field valid while the person types in it.
export const usernameAsTyped = (text: string) =>
  toLatin(text)
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 24);
