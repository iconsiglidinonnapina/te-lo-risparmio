const ASIN_PATTERN = /(?:\/(?:dp|product|gp\/product))\/([A-Z0-9]{10})(?:[/?#]|$)/i;

const AMAZON_HOST_PATTERN =
  /^(?:www\.)?amazon\.(com|co\.uk|co\.jp|com\.br|com\.au|it|de|fr|es|ca|nl|in|sg|ae|sa|pl|se|be|com\.mx|com\.tr)$/i;

const SHORT_LINK_HOST_PATTERN = /^(?:amzn\.to|amzn\.eu|a\.co)$/i;

export interface AsinExtractionResult {
  valid: boolean;
  asin: string | null;
  error: string | null;
}

export function isAmazonUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return AMAZON_HOST_PATTERN.test(url.hostname) || SHORT_LINK_HOST_PATTERN.test(url.hostname);
  } catch {
    return false;
  }
}

function maybeAddProtocol(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(?:www\.)?amazon\.|^amzn\.|^a\.co/i.test(raw)) return `https://${raw}`;
  return raw;
}

export function extractAsin(input: string): AsinExtractionResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, asin: null, error: 'Inserisci un URL Amazon' };
  }

  let url: URL;
  try {
    url = new URL(maybeAddProtocol(trimmed));
  } catch {
    return { valid: false, asin: null, error: "L'URL inserito non è valido" };
  }

  if (!AMAZON_HOST_PATTERN.test(url.hostname) && !SHORT_LINK_HOST_PATTERN.test(url.hostname)) {
    return {
      valid: false,
      asin: null,
      error: "L'URL non appartiene ad Amazon",
    };
  }

  const match = url.pathname.match(ASIN_PATTERN);
  if (!match?.[1]) {
    return {
      valid: false,
      asin: null,
      error: 'Impossibile estrarre il codice prodotto (ASIN) dal link',
    };
  }

  return { valid: true, asin: match[1].toUpperCase(), error: null };
}
