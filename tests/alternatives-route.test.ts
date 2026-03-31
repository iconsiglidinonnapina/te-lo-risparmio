import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProductData } from '../server/services/creators-api-client';

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing modules that use them
// ---------------------------------------------------------------------------

vi.mock('../server/services/creators-api-client', () => ({
  getItem: vi.fn(),
  searchAlternatives: vi.fn(),
  CreatorsApiError: class CreatorsApiError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = 'CreatorsApiError';
      this.code = code;
    }
  },
}));

const alternativesCacheStore = new Map<string, unknown>();
vi.mock('../server/services/cache', () => {
  return {
    TtlCache: vi.fn().mockImplementation(() => ({
      get: (key: string) => alternativesCacheStore.get(key),
      set: (key: string, value: unknown) => alternativesCacheStore.set(key, value),
    })),
  };
});

import Fastify from 'fastify';
import { alternativesRoutes } from '../server/routes/alternatives';
import {
  getItem,
  searchAlternatives,
  CreatorsApiError,
} from '../server/services/creators-api-client';

// ---------------------------------------------------------------------------
// Typed mocks
// ---------------------------------------------------------------------------

const mockGetItem = vi.mocked(getItem);
const mockSearchAlternatives = vi.mocked(searchAlternatives);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ErrorBody {
  error: string;
  code?: string;
}

interface AlternativesBody {
  asin: string;
  alternatives: Array<ProductData & { score: number }>;
}

function buildApp() {
  const app = Fastify();
  app.register(alternativesRoutes);
  return app;
}

const MOCK_PRODUCT: ProductData = {
  asin: 'B084K866MQ',
  title: 'Samsung Galaxy S24 Ultra Smartphone 256GB',
  imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71abc.jpg',
  detailPageUrl: 'https://www.amazon.it/dp/B084K866MQ?tag=mytag-21',
  price: { amount: 45.99, currency: 'EUR', displayAmount: '45,99 €' },
  listPrice: { amount: 59.99, currency: 'EUR', displayAmount: '59,99 €' },
  savingsPercentage: 23,
  savingsAmount: { amount: 14.0, currency: 'EUR', displayAmount: '14,00 €' },
  reviewRating: 4.3,
  reviewCount: 1250,
  browseNodeId: '123456',
  browseNodeName: 'Smartphone',
};

function makeAlternative(overrides: Partial<ProductData> = {}): ProductData {
  return {
    asin: 'B000000001',
    title: 'Alternative Product',
    imageUrl: null,
    detailPageUrl: 'https://www.amazon.it/dp/B000000001?tag=mytag-21',
    price: { amount: 35.0, currency: 'EUR', displayAmount: '35,00 €' },
    listPrice: null,
    savingsPercentage: null,
    savingsAmount: null,
    reviewRating: 4.0,
    reviewCount: 500,
    browseNodeId: null,
    browseNodeName: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/alternatives/:asin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    alternativesCacheStore.clear();
  });

  it('returns ranked alternatives sorted by score', async () => {
    mockGetItem.mockResolvedValueOnce(MOCK_PRODUCT);

    const alternatives = [
      makeAlternative({
        asin: 'ALT_LOW',
        reviewRating: 3.5,
        reviewCount: 100,
        price: { amount: 40, currency: 'EUR', displayAmount: '40,00 €' },
      }),
      makeAlternative({
        asin: 'ALT_HIGH',
        reviewRating: 4.8,
        reviewCount: 3000,
        price: { amount: 30, currency: 'EUR', displayAmount: '30,00 €' },
      }),
    ];
    mockSearchAlternatives.mockResolvedValueOnce(alternatives);

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });

    expect(res.statusCode).toBe(200);
    const body: AlternativesBody = res.json();
    expect(body.asin).toBe('B084K866MQ');
    expect(body.alternatives).toHaveLength(2);
    // ALT_HIGH should rank first (higher rating, more reviews, lower price)
    expect(body.alternatives[0]!.asin).toBe('ALT_HIGH');
    expect(body.alternatives[1]!.asin).toBe('ALT_LOW');
    expect(typeof body.alternatives[0]!.score).toBe('number');
  });

  it('passes browseNodeId, keywords, and maxPrice to searchAlternatives', async () => {
    mockGetItem.mockResolvedValueOnce(MOCK_PRODUCT);
    mockSearchAlternatives.mockResolvedValueOnce([]);

    const app = buildApp();
    await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });

    expect(mockSearchAlternatives).toHaveBeenCalledWith({
      browseNodeId: '123456',
      keywords: expect.any(String) as string,
      maxPrice: 45.99,
      excludeAsin: 'B084K866MQ',
    });
  });

  it('returns empty alternatives when no matches found', async () => {
    mockGetItem.mockResolvedValueOnce(MOCK_PRODUCT);
    mockSearchAlternatives.mockResolvedValueOnce([]);

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });

    expect(res.statusCode).toBe(200);
    const body: AlternativesBody = res.json();
    expect(body.alternatives).toEqual([]);
  });

  it('limits results to 5 alternatives', async () => {
    mockGetItem.mockResolvedValueOnce(MOCK_PRODUCT);

    const many = Array.from({ length: 9 }, (_, i) =>
      makeAlternative({
        asin: `ALT_${String(i).padStart(2, '0')}`,
        reviewRating: 3.5 + i * 0.1,
        reviewCount: 100 * (i + 1),
        price: { amount: 30 + i, currency: 'EUR', displayAmount: `${30 + i},00 €` },
      }),
    );
    mockSearchAlternatives.mockResolvedValueOnce(many);

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });

    const body: AlternativesBody = res.json();
    expect(body.alternatives.length).toBeLessThanOrEqual(5);
  });

  it('returns 422 when main product has no price', async () => {
    mockGetItem.mockResolvedValueOnce({ ...MOCK_PRODUCT, price: null });

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });

    expect(res.statusCode).toBe(422);
    const body: ErrorBody = res.json();
    expect(body.code).toBe('NO_PRICE');
  });

  it('returns 422 when no keywords can be extracted', async () => {
    mockGetItem.mockResolvedValueOnce({
      ...MOCK_PRODUCT,
      title: 'il la di del per con', // only stop words
    });

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });

    expect(res.statusCode).toBe(422);
    const body: ErrorBody = res.json();
    expect(body.code).toBe('NO_KEYWORDS');
  });

  it('returns 404 when product is not found (CreatorsApiError)', async () => {
    mockGetItem.mockRejectedValueOnce(
      new CreatorsApiError('Prodotto non trovato', 'ITEM_NOT_FOUND'),
    );

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/alternatives/B000000000' });

    expect(res.statusCode).toBe(404);
    const body: ErrorBody = res.json();
    expect(body.code).toBe('ITEM_NOT_FOUND');
  });

  it('returns 502 on unexpected errors', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('Network timeout'));

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });

    expect(res.statusCode).toBe(502);
    const body: ErrorBody = res.json();
    expect(body.error).toContain('Amazon');
  });

  it('rejects invalid ASIN format', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/alternatives/invalid' });

    expect(res.statusCode).toBe(400);
  });

  it('serves cached response on subsequent requests', async () => {
    mockGetItem.mockResolvedValueOnce(MOCK_PRODUCT);
    mockSearchAlternatives.mockResolvedValueOnce([makeAlternative({ asin: 'CACHED_ALT' })]);

    const app = buildApp();

    // First request — populates cache
    const res1 = await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });
    expect(res1.statusCode).toBe(200);

    // Second request — should hit cache, no additional API calls
    const res2 = await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });
    expect(res2.statusCode).toBe(200);

    const body: AlternativesBody = res2.json();
    expect(body.alternatives[0]!.asin).toBe('CACHED_ALT');

    // getItem should have been called only once
    expect(mockGetItem).toHaveBeenCalledTimes(1);
  });

  it('omits browseNodeId when product has none', async () => {
    mockGetItem.mockResolvedValueOnce({ ...MOCK_PRODUCT, browseNodeId: null });
    mockSearchAlternatives.mockResolvedValueOnce([]);

    const app = buildApp();
    await app.inject({ method: 'GET', url: '/api/alternatives/B084K866MQ' });

    expect(mockSearchAlternatives).toHaveBeenCalledWith(
      expect.objectContaining({ browseNodeId: undefined }),
    );
  });
});
