import { TtlCache } from './cache.js';
import { getItem, type ProductData } from './creators-api-client.js';

const ONE_HOUR = 60 * 60 * 1000;
const cache = new TtlCache<ProductData>(ONE_HOUR);

/**
 * Fetches a product by ASIN, reusing the shared cache to avoid duplicate
 * Creators API calls across the product and alternatives routes.
 */
export async function getCachedProduct(asin: string): Promise<ProductData> {
  const cached = cache.get(asin);
  if (cached) return cached;

  const product = await getItem(asin);
  cache.set(asin, product);
  return product;
}
