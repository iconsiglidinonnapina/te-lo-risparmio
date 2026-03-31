import type { ProductData } from './creators-api-client.js';
import { scrapeReviews } from './review-scraper.js';

/**
 * If the product has no reviewRating from the API, attempts to scrape it
 * from the Amazon product page. Returns a new object (does not mutate).
 */
export async function enrichWithReviews<T extends ProductData>(product: T): Promise<T> {
  if (product.reviewRating !== null) return product;

  const reviews = await scrapeReviews(product.asin);

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
