import type { ProductData } from './creators-api-client.js';

export interface RankedProduct extends ProductData {
  score: number;
}

/**
 * Ranks alternative products using a composite score that integrates
 * relevance, ratings, popularity, and price:
 *
 *   score = (relevance × 3) + (reviewRating × 2) + log(reviewCount) − (price / referencePrice)
 *
 * The relevance factor (0–1 Jaccard similarity) ensures that products
 * that closely match the reference product type are strongly boosted
 * over loosely related matches.
 *
 * Higher score → better alternative.
 */
export function rankAlternatives(
  alternatives: ProductData[],
  referencePrice: number,
  topN = 10,
  relevanceScores?: Map<string, number>,
): RankedProduct[] {
  if (referencePrice <= 0) return [];

  const scored: RankedProduct[] = alternatives.map((product) => {
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
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}
