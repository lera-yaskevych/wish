// Small URL helpers written with regexes so they behave the same on iOS, Android and web.

export const normalizeUrl = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https?:\/\/[^\s/?#]+\.[^\s/?#]{2,}/i.test(url) ? url : null;
};

export const domainOf = (url: string) => {
  const match = /^(?:https?:\/\/)?(?:www\.)?([^\s/?#:]+)/i.exec(url.trim());
  return match ? match[1] : url;
};

export type LinkPreview = { title: string | null; imageUri: string | null; price: string | null };

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', UAH: '₴', JPY: '¥' };

const decodeEntities = (text: string) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, '’')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

const metaContent = (html: string, key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']|` +
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`,
    'i',
  );
  const match = pattern.exec(html);
  const value = match?.[1] ?? match?.[2];
  return value ? decodeEntities(value) : null;
};

const formatPrice = (amount: string | null, currency: string | null) => {
  if (!amount) return null;
  const number = Number(amount.replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0) return null;
  const value = Number.isInteger(number) ? String(number) : number.toFixed(2);
  const code = currency?.toUpperCase();
  if (!code) return value;
  return CURRENCY_SYMBOLS[code] ? `${CURRENCY_SYMBOLS[code]}${value}` : `${value} ${code}`;
};

const absoluteUrl = (value: string, pageUrl: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  const origin = /^https?:\/\/[^/?#]+/i.exec(pageUrl)?.[0];
  return origin && value.startsWith('/') ? `${origin}${value}` : null;
};

// Best effort: reads a shop page's share metadata. Many shops block this, and
// browsers block it entirely (CORS), so callers must cope with null.
export const fetchLinkPreview = async (url: string): Promise<LinkPreview | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'text/html' } });
    if (!response.ok) return null;
    const html = (await response.text()).slice(0, 400_000);
    const image = metaContent(html, 'og:image');
    const amount =
      metaContent(html, 'product:price:amount') ??
      metaContent(html, 'og:price:amount') ??
      /"price"\s*:\s*"?([\d.,]+)"?/.exec(html)?.[1] ??
      null;
    const currency =
      metaContent(html, 'product:price:currency') ??
      metaContent(html, 'og:price:currency') ??
      /"priceCurrency"\s*:\s*"([A-Za-z]{3})"/.exec(html)?.[1] ??
      null;
    return {
      title: metaContent(html, 'og:title'),
      imageUri: image ? absoluteUrl(image, url) : null,
      price: formatPrice(amount, currency),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};
