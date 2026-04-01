const ASIN_PATTERN = /(?:\/(?:dp|product|gp\/product))\/([A-Z0-9]{10})(?:[/?#]|$)/i;

const AMAZON_HOST_PATTERN =
  /^(?:www\.)?amazon\.(com|co\.uk|co\.jp|com\.br|com\.au|it|de|fr|es|ca|nl|in|sg|ae|sa|pl|se|be|com\.mx|com\.tr)$/i;

const SHORT_LINK_HOST_PATTERN = /^(?:amzn\.to|amzn\.eu|amzn\.it|a\.co)$/i;

export interface AsinExtractionResult {
  valid: boolean;
  asin: string | null;
  error: string | null;
}

function maybeAddProtocol(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(?:www\.)?amazon\.|^amzn\.|^a\.co/i.test(raw)) return `https://${raw}`;
  return raw;
}

export function extractAsin(input: string): AsinExtractionResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, asin: null, error: 'URL mancante' };
  }

  if (trimmed.length > 2048) {
    return { valid: false, asin: null, error: 'URL troppo lungo' };
  }

  let url: URL;
  try {
    url = new URL(maybeAddProtocol(trimmed));
  } catch {
    return { valid: false, asin: null, error: 'URL non valido' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { valid: false, asin: null, error: 'URL non valido' };
  }

  if (!AMAZON_HOST_PATTERN.test(url.hostname) && !SHORT_LINK_HOST_PATTERN.test(url.hostname)) {
    return {
      valid: false,
      asin: null,
      error: 'URL non appartenente ad Amazon',
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

// ---------------------------------------------------------------------------
// Short-link detection & resolution
// ---------------------------------------------------------------------------

export function isShortLink(input: string): boolean {
  try {
    const url = new URL(maybeAddProtocol(input.trim()));
    return SHORT_LINK_HOST_PATTERN.test(url.hostname);
  } catch {
    return false;
  }
}

/** Allowlist of Amazon domains that short links may redirect to */
const AMAZON_REDIRECT_HOST =
  /^(?:www\.)?amazon\.(com|co\.uk|co\.jp|com\.br|com\.au|it|de|fr|es|ca|nl|in|sg|ae|sa|pl|se|be|com\.mx|com\.tr)$/i;

const MAX_REDIRECTS = 5;
const RESOLVE_TIMEOUT_MS = 5000;

/**
 * Resolves a short Amazon link (amzn.eu, amzn.to, a.co, amzn.it) by following
 * HTTP redirects manually. Returns the extracted ASIN from the final destination.
 *
 * Security:
 * - Manual redirect following with hop limit (anti-redirect-loop)
 * - Destination host must be a recognised Amazon domain (anti-SSRF)
 * - Strict timeout via AbortSignal
 */
export async function resolveShortLink(url: string): Promise<AsinExtractionResult> {
  const trimmed = url.trim();
  let currentUrl: string;

  try {
    currentUrl = new URL(maybeAddProtocol(trimmed)).href;
  } catch {
    return { valid: false, asin: null, error: 'URL non valido' };
  }

  const fetchHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    let response: Response;
    try {
      // Try GET (Amazon short-link servers return 404 for HEAD requests)
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
        headers: fetchHeaders,
      });
    } catch {
      return { valid: false, asin: null, error: 'Impossibile risolvere il link breve' };
    }

    // If we got a redirect, follow it
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return { valid: false, asin: null, error: 'Redirect senza destinazione' };
      }

      // Resolve relative redirects
      try {
        currentUrl = new URL(location, currentUrl).href;
      } catch {
        return { valid: false, asin: null, error: 'URL di redirect non valido' };
      }

      continue;
    }

    // We reached the final destination — validate it's an Amazon URL
    break;
  }

  // SSRF prevention: ensure final URL is an Amazon domain
  let finalHost: string;
  try {
    finalHost = new URL(currentUrl).hostname;
  } catch {
    return { valid: false, asin: null, error: 'URL finale non valido' };
  }

  if (!AMAZON_REDIRECT_HOST.test(finalHost)) {
    return { valid: false, asin: null, error: 'Il link non porta a un sito Amazon' };
  }

  // Extract ASIN from the resolved URL
  return extractAsin(currentUrl);
}
