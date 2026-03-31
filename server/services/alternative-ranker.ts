import type { ProductData } from './creators-api-client.js';

export interface RankedProduct extends ProductData {
  score: number;
}

/**
 * Ranks alternative products using a composite score:
 *   score = (reviewRating × 2) + log(reviewCount) − (price / referencePrice)
 *
 * Higher score → better alternative.
 */
export function rankAlternatives(
  alternatives: ProductData[],
  referencePrice: number,
  topN = 5,
): RankedProduct[] {
  if (referencePrice <= 0) return [];

  const scored: RankedProduct[] = alternatives.map((product) => {
    const rating = product.reviewRating ?? 0;
    const count = product.reviewCount ?? 0;
    const price = product.price?.amount ?? referencePrice;

    const ratingSignal = rating * 2;
    const popularitySignal = count > 0 ? Math.log(count) : 0;
    const priceSignal = price / referencePrice;

    return {
      ...product,
      score: ratingSignal + popularitySignal - priceSignal,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}
