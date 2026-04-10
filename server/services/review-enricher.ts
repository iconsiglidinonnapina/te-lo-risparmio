import type { ProductData } from './creators-api-client.js';
import { scrapeReviews } from './review-scraper.js';

const SCRAPE_TIMEOUT_MS = 3000;

/**
 * Wraps a promise with a timeout. Resolves to `undefined` if the promise
 * does not settle within the limit (instead of rejecting).
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

/**
 * If the product has no reviewRating from the API, attempts to scrape it
 * from the Amazon product page. Returns a new object (does not mutate).
 * Times out after 3 s to avoid blocking the response.
 */
export async function enrichWithReviews<T extends ProductData>(product: T): Promise<T> {
  if (product.reviewRating !== null) return product;

  const reviews = await withTimeout(scrapeReviews(product.asin), SCRAPE_TIMEOUT_MS);
  if (!reviews) return product;

  return {
    ...product,
    reviewRating: reviews.rating,
    reviewCount: reviews.count,
  };
}

/**
 * Enriches multiple products in parallel, with a concurrency limit.
 */
export async function enrichAllWithReviews<T extends ProductData>(products: T[]): Promise<T[]> {
  return Promise.all(products.map(enrichWithReviews));
}
