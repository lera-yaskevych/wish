// Usernames are Latin so they can be typed on any keyboard. Names written in
// Cyrillic are transliterated first (Ukrainian national standard, simplified).

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i',
  ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia',
  ы: 'y', э: 'e', ё: 'io', ъ: '',
};

// These letters are written differently when they open a word: Юлія → yuliia.
const WORD_START: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' };

const latinize = (text: string) => {
  let out = '';
  let atWordStart = true;
  for (const char of text.toLowerCase()) {
    if (char in CYRILLIC) out += (atWordStart && WORD_START[char]) || CYRILLIC[char];
    else out += char;
    atWordStart = !/[\p{L}\p{N}’']/u.test(char);
  }
  return out;
};

export const usernameFrom = (name: string) =>
  latinize(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'friend';
