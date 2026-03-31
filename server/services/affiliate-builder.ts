import { config } from '../config.js';

const DEFAULT_MARKETPLACE = config.creatorsApi.marketplace;
const DEFAULT_TAG = config.creatorsApi.partnerTag;

/**
 * Builds a clean, canonical Amazon affiliate link for a given ASIN.
 *
 * Output format: `https://{marketplace}/dp/{ASIN}?tag={partnerTag}`
 *
 * All tracking parameters and extraneous path segments are stripped.
 */
export function buildAffiliateLink(
  asin: string,
  options?: { marketplace?: string; tag?: string },
): string {
  const marketplace = options?.marketplace ?? DEFAULT_MARKETPLACE;
  const tag = options?.tag ?? DEFAULT_TAG;

  // Canonical path: /dp/{ASIN} — the shortest stable Amazon product URL
  const url = new URL(`https://${marketplace}/dp/${asin}`);

  if (tag) {
    url.searchParams.set('tag', tag);
  }

  return url.toString();
}

/**
 * Takes an arbitrary Amazon product URL (potentially full of tracking params)
 * and returns a clean affiliate link.
 *
 * If the URL doesn't contain a recognisable ASIN, returns `null`.
 */
export function cleanAndTagUrl(
  rawUrl: string,
  options?: { marketplace?: string; tag?: string },
): string | null {
  const asin = extractAsinFromUrl(rawUrl);
  if (!asin) return null;

  return buildAffiliateLink(asin, options);
}

// ---------------------------------------------------------------------------
// Internal helper — lightweight ASIN extraction (same pattern used by
// server/services/asin-extractor.ts but decoupled to avoid circular deps).
// ---------------------------------------------------------------------------

const ASIN_PATTERN = /(?:\/(?:dp|product|gp\/product))\/([A-Z0-9]{10})(?:[/?#]|$)/i;

function extractAsinFromUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const match = url.pathname.match(ASIN_PATTERN);
    return match?.[1]?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}
