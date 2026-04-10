import type { ProductData } from './creators-api-client.js';

export interface RankedProduct extends ProductData {
  score: number;
}

/**
 * Scores a single product using a composite formula:
 *
 *   score = (relevance × 3) + (reviewRating × 2) + log(reviewCount) − (price / referencePrice)
 *
 * Higher score → better alternative.
 */
function scoreProduct(
  product: ProductData,
  referencePrice: number,
  relevanceScores?: Map<string, number>,
): RankedProduct {
  const rating = product.reviewRating ?? 0;
  const count = product.reviewCount ?? 0;
  const price = product.price?.amount ?? referencePrice;

  const relevance = relevanceScores?.get(product.asin) ?? 0;
  const relevanceSignal = relevance * 3;
  const ratingSignal = rating * 2;
  const popularitySignal = count > 0 ? Math.log(count) : 0;
  const priceSignal = price / referencePrice;

  return {
    ...product,
    score: relevanceSignal + ratingSignal + popularitySignal - priceSignal,
  };
}

/**
 * Ranks alternative products and returns the top N sorted by score.
 */
export function rankAlternatives(
  alternatives: ProductData[],
  referencePrice: number,
  topN = 10,
  relevanceScores?: Map<string, number>,
): RankedProduct[] {
  if (referencePrice <= 0) return [];

  const scored = alternatives.map((p) => scoreProduct(p, referencePrice, relevanceScores));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}

/** Tier limits for per-tier ranking. */
export interface TierLimits {
  cheaper: number;
  similar: number;
  higher: number;
}

const DEFAULT_TIER_LIMITS: TierLimits = {
  cheaper: 10,
  similar: 6,
  higher: 4,
};

/** Price-tier thresholds relative to the reference price. */
const CHEAPER_CEILING = 0.95;
const SIMILAR_CEILING = 1.1;

export interface CategorizedRanked {
  cheaper: RankedProduct[];
  similar: RankedProduct[];
  higher: RankedProduct[];
  all: RankedProduct[];
}

/**
 * Splits alternatives into price tiers, ranks each tier independently,
 * then selects the top N per tier (with more slots for cheaper).
 *
 * This guarantees cheaper alternatives surface even when many higher-priced
 * products have better ratings/popularity.
 */
export function rankByTier(
  alternatives: ProductData[],
  referencePrice: number,
  relevanceScores?: Map<string, number>,
  limits: Partial<TierLimits> = {},
): CategorizedRanked {
  if (referencePrice <= 0) {
    return { cheaper: [], similar: [], higher: [], all: [] };
  }

  const lim = { ...DEFAULT_TIER_LIMITS, ...limits };

  const cheaperPool: ProductData[] = [];
  const similarPool: ProductData[] = [];
  const higherPool: ProductData[] = [];

  for (const alt of alternatives) {
    const price = alt.price?.amount;
    if (price === null || price === undefined) continue;
    if (price < referencePrice * CHEAPER_CEILING) {
      cheaperPool.push(alt);
    } else if (price <= referencePrice * SIMILAR_CEILING) {
      similarPool.push(alt);
    } else {
      higherPool.push(alt);
    }
  }

  const rank = (pool: ProductData[], n: number) => {
    const scored = pool.map((p) => scoreProduct(p, referencePrice, relevanceScores));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, n);
  };

  const cheaper = rank(cheaperPool, lim.cheaper);
  const similar = rank(similarPool, lim.similar);
  const higher = rank(higherPool, lim.higher);

  // "all" is the merged set sorted by score, for backward-compat
  const all = [...cheaper, ...similar, ...higher];
  all.sort((a, b) => b.score - a.score);

  return { cheaper, similar, higher, all };
}
