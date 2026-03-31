import { describe, it, expect } from 'vitest';
import { rankAlternatives } from '../server/services/alternative-ranker';
import type { ProductData } from '../server/services/creators-api-client';

function makeProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    asin: 'B000000001',
    title: 'Test Product',
    imageUrl: null,
    detailPageUrl: '',
    price: { amount: 10, currency: 'EUR', displayAmount: '10,00 €' },
    listPrice: null,
    savingsPercentage: null,
    savingsAmount: null,
    reviewRating: 4.0,
    reviewCount: 100,
    browseNodeId: null,
    browseNodeName: null,
    ...overrides,
  };
}

describe('rankAlternatives', () => {
  it('returns an empty array when referencePrice is 0', () => {
    const result = rankAlternatives([makeProduct()], 0);
    expect(result).toEqual([]);
  });

  it('returns an empty array when referencePrice is negative', () => {
    const result = rankAlternatives([makeProduct()], -5);
    expect(result).toEqual([]);
  });

  it('returns an empty array when alternatives list is empty', () => {
    const result = rankAlternatives([], 25);
    expect(result).toEqual([]);
  });

  it('ranks products by composite score (higher is better)', () => {
    const highRated = makeProduct({
      asin: 'HIGH_RATED',
      reviewRating: 4.8,
      reviewCount: 5000,
      price: { amount: 9, currency: 'EUR', displayAmount: '9,00 €' },
    });
    const lowRated = makeProduct({
      asin: 'LOW_RATED',
      reviewRating: 2.0,
      reviewCount: 10,
      price: { amount: 9, currency: 'EUR', displayAmount: '9,00 €' },
    });

    const result = rankAlternatives([lowRated, highRated], 12);

    expect(result[0]!.asin).toBe('HIGH_RATED');
    expect(result[1]!.asin).toBe('LOW_RATED');
  });

  it('penalises more expensive products', () => {
    const cheap = makeProduct({
      asin: 'CHEAP',
      reviewRating: 4.0,
      reviewCount: 100,
      price: { amount: 5, currency: 'EUR', displayAmount: '5,00 €' },
    });
    const expensive = makeProduct({
      asin: 'EXPENSIVE',
      reviewRating: 4.0,
      reviewCount: 100,
      price: { amount: 20, currency: 'EUR', displayAmount: '20,00 €' },
    });

    const result = rankAlternatives([expensive, cheap], 20);

    expect(result[0]!.asin).toBe('CHEAP');
    expect(result[1]!.asin).toBe('EXPENSIVE');
  });

  it('selects only topN results', () => {
    const products = Array.from({ length: 10 }, (_, i) =>
      makeProduct({
        asin: `PROD_${String(i).padStart(2, '0')}`,
        reviewRating: 3 + i * 0.1,
        reviewCount: 50 * (i + 1),
      }),
    );

    const result = rankAlternatives(products, 10, 5);
    expect(result).toHaveLength(5);
  });

  it('returns fewer than topN when not enough alternatives', () => {
    const products = [makeProduct({ asin: 'ONLY_ONE' })];
    const result = rankAlternatives(products, 10, 5);
    expect(result).toHaveLength(1);
  });

  it('attaches a numeric score to each result', () => {
    const product = makeProduct();
    const result = rankAlternatives([product], 10, 1)[0]!;
    expect(typeof result.score).toBe('number');
    expect(Number.isFinite(result.score)).toBe(true);
  });

  it('handles products with null reviewRating and reviewCount', () => {
    const noReviews = makeProduct({
      asin: 'NO_REVIEWS',
      reviewRating: null,
      reviewCount: null,
    });

    const result = rankAlternatives([noReviews], 10);
    expect(result).toHaveLength(1);
    expect(result[0]!.score).toBe(0 + 0 - 1); // 0*2 + log(0→0) - 10/10
  });

  it('handles product with null price (defaults to referencePrice)', () => {
    const noPrice = makeProduct({
      asin: 'NO_PRICE',
      price: null,
      reviewRating: 4.0,
      reviewCount: 100,
    });

    const result = rankAlternatives([noPrice], 10);
    expect(result).toHaveLength(1);
    // price defaults to referencePrice → priceSignal = 1
    const expected = 4.0 * 2 + Math.log(100) - 1;
    expect(result[0]!.score).toBeCloseTo(expected, 5);
  });
});
