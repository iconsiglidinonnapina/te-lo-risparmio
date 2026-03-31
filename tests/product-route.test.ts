import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProductData } from '../server/services/creators-api-client';

// Mock the creators-api-client module before importing the route
vi.mock('../server/services/creators-api-client', () => ({
  getItem: vi.fn(),
  CreatorsApiError: class CreatorsApiError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = 'CreatorsApiError';
      this.code = code;
    }
  },
}));

const cacheStore = new Map<string, ProductData>();
vi.mock('../server/services/cache', () => {
  return {
    TtlCache: vi.fn().mockImplementation(() => ({
      get: (key: string): ProductData | undefined => cacheStore.get(key),
      set: (key: string, value: ProductData) => cacheStore.set(key, value),
    })),
  };
});

import Fastify from 'fastify';
import { productRoutes } from '../server/routes/product';
import { getItem, CreatorsApiError } from '../server/services/creators-api-client';

interface ProductBody {
  asin: string;
  title: string;
  price: { amount: number };
  keywords: string;
}

interface ErrorBody {
  error: string;
  code?: string;
}

const mockGetItem = vi.mocked(getItem);

function buildApp() {
  const app = Fastify();
  app.register(productRoutes);
  return app;
}

const MOCK_PRODUCT = {
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

describe('GET /api/product/:asin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
  });

  it('returns product data with keywords', async () => {
    mockGetItem.mockResolvedValueOnce(MOCK_PRODUCT);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/product/B084K866MQ',
    });

    expect(res.statusCode).toBe(200);
    const body: ProductBody = res.json();
    expect(body.asin).toBe('B084K866MQ');
    expect(body.title).toBe(MOCK_PRODUCT.title);
    expect(body.price.amount).toBe(45.99);
    expect(body.keywords).toBeTruthy();
    expect(typeof body.keywords).toBe('string');
  });

  it('returns 404 for ITEM_NOT_FOUND', async () => {
    mockGetItem.mockRejectedValueOnce(
      new CreatorsApiError('Prodotto non trovato', 'ITEM_NOT_FOUND'),
    );

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/product/B000000000',
    });

    expect(res.statusCode).toBe(404);
    const body: ErrorBody = res.json();
    expect(body.error).toBe('Prodotto non trovato');
    expect(body.code).toBe('ITEM_NOT_FOUND');
  });

  it('returns 502 for unexpected errors', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('Network timeout'));

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/product/B084K866MQ',
    });

    expect(res.statusCode).toBe(502);
    const body: ErrorBody = res.json();
    expect(body.error).toContain('Amazon');
  });

  it('rejects invalid ASIN format', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/product/invalid',
    });

    expect(res.statusCode).toBe(400);
  });
});
