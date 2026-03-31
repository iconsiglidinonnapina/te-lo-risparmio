import { TtlCache } from './cache.js';

export interface ReviewData {
  rating: number | null;
  count: number | null;
}

const REVIEW_CACHE = new TtlCache<ReviewData>(60 * 60 * 1000); // 1 hour

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const RATING_RE = /acrPopover[^>]*title="(\d+[.,]\d+)\s+su\s+\d+/;
const COUNT_RE = /acrCustomerReviewText[^>]*aria-label="([\d.]+)\s/;

function parseLocaleNumber(raw: string): number {
  return Number(raw.replace(/\./g, '').replace(',', '.'));
}

export async function scrapeReviews(asin: string): Promise<ReviewData> {
  const cached = REVIEW_CACHE.get(asin);
  if (cached) return cached;

  // Strict ASIN validation to prevent SSRF
  if (!/^[A-Z0-9]{10}$/.test(asin)) {
    const empty: ReviewData = { rating: null, count: null };
    return empty;
  }

  const url = `https://www.amazon.it/dp/${asin}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html', 'Accept-Language': 'it-IT,it' },
      signal: AbortSignal.timeout(5000),
      redirect: 'error', // don't follow redirects to prevent SSRF
    });

    if (!res.ok) {
      const empty: ReviewData = { rating: null, count: null };
      REVIEW_CACHE.set(asin, empty);
      return empty;
    }

    // Limit response size to 2 MB to prevent memory exhaustion
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 2_097_152) {
      const empty: ReviewData = { rating: null, count: null };
      REVIEW_CACHE.set(asin, empty);
      return empty;
    }

    const html = await res.text();

    const ratingMatch = RATING_RE.exec(html);
    const countMatch = COUNT_RE.exec(html);

    const result: ReviewData = {
      rating: ratingMatch?.[1] ? parseLocaleNumber(ratingMatch[1]) : null,
      count: countMatch?.[1] ? parseLocaleNumber(countMatch[1]) : null,
    };

    REVIEW_CACHE.set(asin, result);
    return result;
  } catch {
    const empty: ReviewData = { rating: null, count: null };
    REVIEW_CACHE.set(asin, empty);
    return empty;
  }
}
