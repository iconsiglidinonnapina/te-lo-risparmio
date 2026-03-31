import { describe, it, expect } from 'vitest';
import { evaluatePrice } from '../server/services/price-evaluator';
import type { ProductData } from '../server/services/creators-api-client';

function makeProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    asin: 'B000000001',
    title: 'Test Product',
    imageUrl: null,
    detailPageUrl: '',
    price: { amount: 50, currency: 'EUR', displayAmount: '50,00 €' },
    listPrice: { amount: 70, currency: 'EUR', displayAmount: '70,00 €' },
    savingsPercentage: null,
    savingsAmount: null,
    reviewRating: 4.0,
    reviewCount: 100,
    browseNodeId: null,
    browseNodeName: null,
    ...overrides,
  };
}

function makeAlternative(amount: number): Pick<ProductData, 'price'> {
  return { price: { amount, currency: 'EUR', displayAmount: `${amount},00 €` } };
}

// -----------------------------------------------------------------------
// T6.1.4 — Unit tests
// -----------------------------------------------------------------------

describe('evaluatePrice', () => {
  // --- Prodotto con sconto alto ---
  describe('product with high discount', () => {
    it('returns green when savings >= 25% and alternatives are more expensive', () => {
      const product = makeProduct({
        savingsPercentage: 30,
        price: { amount: 35, currency: 'EUR', displayAmount: '35,00 €' },
        reviewRating: 4.5,
      });
      const alternatives = [makeAlternative(50), makeAlternative(60)];

      const result = evaluatePrice(product, alternatives);

      expect(result.color).toBe('green');
      expect(result.label).toBe('Ottimo prezzo');
      expect(result.savingsPct).toBe(30);
      expect(result.vsAlternativesPct).toBeGreaterThan(0);
    });

    it('returns green when savings >= 25% even with no alternatives', () => {
      const product = makeProduct({
        savingsPercentage: 30,
        reviewRating: 4.0,
      });

      const result = evaluatePrice(product, []);

      expect(result.color).toBe('green');
      expect(result.vsAlternativesPct).toBeNull();
    });
  });

  // --- Prodotto senza sconto ---
  describe('product without discount', () => {
    it('returns yellow when no savings and product price equals alternatives avg', () => {
      const product = makeProduct({
        savingsPercentage: 0,
        price: { amount: 50, currency: 'EUR', displayAmount: '50,00 €' },
        reviewRating: 4.0,
      });
      const alternatives = [makeAlternative(48), makeAlternative(52)];

      const result = evaluatePrice(product, alternatives);

      expect(result.color).toBe('yellow');
      expect(result.savingsPct).toBe(0);
    });

    it('returns red when no savings and product is much more expensive than alternatives', () => {
      const product = makeProduct({
        savingsPercentage: 0,
        price: { amount: 80, currency: 'EUR', displayAmount: '80,00 €' },
        reviewRating: 3.0,
      });
      const alternatives = [makeAlternative(40), makeAlternative(45)];

      const result = evaluatePrice(product, alternatives);

      expect(result.color).toBe('red');
    });
  });

  // --- Prezzo sopra media alternative ---
  describe('price above alternatives average', () => {
    it('returns yellow when product is moderately more expensive than alternatives', () => {
      const product = makeProduct({
        savingsPercentage: 12,
        price: { amount: 55, currency: 'EUR', displayAmount: '55,00 €' },
        reviewRating: 4.0,
      });
      // avg = 50, product is 10% more expensive
      const alternatives = [makeAlternative(45), makeAlternative(55)];

      const result = evaluatePrice(product, alternatives);

      expect(result.vsAlternativesPct).toBeLessThan(0);
      expect(['yellow', 'green']).toContain(result.color);
    });
  });

  // --- savingBasis assente ---
  describe('savingBasis absent (savingsPercentage is null)', () => {
    it('treats savings signal as neutral and evaluates via alternatives', () => {
      const product = makeProduct({
        savingsPercentage: null,
        listPrice: null,
        price: { amount: 30, currency: 'EUR', displayAmount: '30,00 €' },
        reviewRating: 4.6,
      });
      // avg alt = 50 → product is 40% cheaper → green
      const alternatives = [makeAlternative(50), makeAlternative(50)];

      const result = evaluatePrice(product, alternatives);

      expect(result.savingsPct).toBeNull();
      expect(result.color).toBe('green');
      expect(result.explanation).not.toContain('listino');
    });

    it('returns yellow when no savings data and alternatives are similar', () => {
      const product = makeProduct({
        savingsPercentage: null,
        listPrice: null,
        price: { amount: 50, currency: 'EUR', displayAmount: '50,00 €' },
        reviewRating: 4.0,
      });
      const alternatives = [makeAlternative(50), makeAlternative(50)];

      const result = evaluatePrice(product, alternatives);

      expect(result.savingsPct).toBeNull();
      expect(result.color).toBe('yellow');
    });

    it('falls back gracefully with no savings and no alternatives', () => {
      const product = makeProduct({
        savingsPercentage: null,
        listPrice: null,
        reviewRating: 4.0,
      });

      const result = evaluatePrice(product, []);

      expect(result.savingsPct).toBeNull();
      expect(result.vsAlternativesPct).toBeNull();
      expect(result.color).toBe('yellow');
      expect(result.explanation).toBeTruthy();
    });
  });

  // --- Output structure ---
  describe('output structure', () => {
    it('returns all expected fields', () => {
      const product = makeProduct({ savingsPercentage: 15 });
      const result = evaluatePrice(product, [makeAlternative(60)]);

      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('savingsPct');
      expect(result).toHaveProperty('vsAlternativesPct');
      expect(['green', 'yellow', 'red']).toContain(result.color);
      expect(typeof result.label).toBe('string');
      expect(typeof result.explanation).toBe('string');
    });
  });

  // --- Review signal impact ---
  describe('review score impact', () => {
    it('excellent reviews do not override price signals', () => {
      const product = makeProduct({
        savingsPercentage: 12,
        reviewRating: 4.8,
        price: { amount: 45, currency: 'EUR', displayAmount: '45,00 €' },
      });
      // avg = 52.5, product is ~14% cheaper → not quite 15% threshold
      const alternatives = [makeAlternative(50), makeAlternative(55)];

      const result = evaluatePrice(product, alternatives);

      // With 12% savings and ~14% cheaper: yellow (savings < 20%, vsAlt < 15%)
      expect(result.color).toBe('yellow');
    });

    it('high discount with cheaper alt comparison yields green', () => {
      const product = makeProduct({
        savingsPercentage: 22,
        reviewRating: 4.8,
        price: { amount: 35, currency: 'EUR', displayAmount: '35,00 €' },
      });
      const alternatives = [makeAlternative(50), makeAlternative(55)];

      const result = evaluatePrice(product, alternatives);

      expect(result.color).toBe('green');
    });

    it('poor reviews (< 3.5) push toward red', () => {
      const product = makeProduct({
        savingsPercentage: 0,
        reviewRating: 2.5,
        price: { amount: 60, currency: 'EUR', displayAmount: '60,00 €' },
      });
      // avg = 50, product is 20% more expensive
      const alternatives = [makeAlternative(50), makeAlternative(50)];

      const result = evaluatePrice(product, alternatives);

      expect(result.color).toBe('red');
    });

    it('null reviewRating is treated as neutral', () => {
      const product = makeProduct({
        savingsPercentage: 5,
        reviewRating: null,
        price: { amount: 50, currency: 'EUR', displayAmount: '50,00 €' },
      });
      // avg = 55, product is ~9% cheaper → vsAlt score = 1
      // savings 5% → score 0, review null → score 0, total = 1 → yellow
      const alternatives = [makeAlternative(55)];

      const result = evaluatePrice(product, alternatives);

      expect(result.color).toBe('yellow');
    });
  });

  // --- Edge cases ---
  describe('edge cases', () => {
    it('handles product with null price', () => {
      const product = makeProduct({ price: null, savingsPercentage: 20 });
      const alternatives = [makeAlternative(50)];

      const result = evaluatePrice(product, alternatives);

      expect(result.vsAlternativesPct).toBeNull();
    });

    it('handles alternatives with all null prices', () => {
      const product = makeProduct({
        savingsPercentage: 15,
        price: { amount: 50, currency: 'EUR', displayAmount: '50,00 €' },
      });
      const alternatives = [{ price: null }, { price: null }];

      const result = evaluatePrice(product, alternatives);

      expect(result.vsAlternativesPct).toBeNull();
    });
  });
});
