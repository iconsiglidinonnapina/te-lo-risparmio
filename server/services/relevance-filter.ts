import { tokenize } from './keyword-extractor.js';
import type { ProductData } from './creators-api-client.js';

// ---------------------------------------------------------------------------
// Title tokenization for similarity — reuses the keyword-extractor pipeline
// but keeps ALL meaningful tokens (no maxTokens limit, no brand skipping).
// ---------------------------------------------------------------------------

/**
 * Extracts significant tokens from a product title for similarity comparison.
 * Deduplicates and lowercases. Generic adjectives are included because they
 * contribute to similarity when both titles share them.
 */
function extractTitleTokens(title: string): Set<string> {
  return new Set(tokenize(title));
}

// ---------------------------------------------------------------------------
// Jaccard similarity
// ---------------------------------------------------------------------------

/**
 * Calculates Jaccard similarity between two sets: |A ∩ B| / |A ∪ B|.
 * Returns 0 if both sets are empty.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersection = 0;
  const smaller = a.size <= b.size ? a : b;
  const larger = a.size <= b.size ? b : a;

  for (const token of smaller) {
    if (larger.has(token)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ---------------------------------------------------------------------------
// Core-token overlap — stricter check using the first N product-descriptive
// tokens (typically the product type, e.g. "apri tende" or "mouse gaming").
// ---------------------------------------------------------------------------

/**
 * Extracts the "core" of a product title — the first few meaningful tokens
 * after the brand (position 0). These usually identify the product type.
 * E.g. "SwitchBot Apri Tende Intelligente" → ["apri", "tende"]
 */
function extractCoreTokens(title: string, maxCore = 4): string[] {
  const tokens = tokenize(title);
  // Deduplicate
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t);
      unique.push(t);
    }
  }
  // Skip brand (first token), take next maxCore tokens
  return unique.length > 1 ? unique.slice(1, 1 + maxCore) : unique.slice(0, maxCore);
}

/**
 * Checks if the alternative title contains at least `minOverlap` of
 * the reference product's core tokens.
 */
function coreTokenOverlap(
  referenceCore: string[],
  alternativeTokens: Set<string>,
  minOverlap = 1,
): boolean {
  if (referenceCore.length === 0) return true;
  let matches = 0;
  for (const token of referenceCore) {
    if (alternativeTokens.has(token)) matches++;
  }
  return matches >= minOverlap;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RelevanceScore {
  similarity: number;
  coreMatch: boolean;
}

/**
 * Computes the relevance score between the reference product and an alternative.
 */
export function computeRelevance(referenceTitle: string, alternativeTitle: string): RelevanceScore {
  const refTokens = extractTitleTokens(referenceTitle);
  const altTokens = extractTitleTokens(alternativeTitle);
  const similarity = jaccardSimilarity(refTokens, altTokens);
  const referenceCore = extractCoreTokens(referenceTitle);
  const coreMatch = coreTokenOverlap(referenceCore, altTokens);
  return { similarity, coreMatch };
}

/**
 * Default thresholds for relevance filtering.
 *
 * - `minSimilarity`: Minimum Jaccard similarity. Alternatives below this
 *   are discarded unless `minFallback` would leave too few results.
 * - `minCoreOverlap`: At least one core token must match (product type).
 * - `minResults`: If strict filtering leaves fewer than this many results,
 *   relax the similarity threshold to `minSimilarityRelaxed`.
 * - `minSimilarityRelaxed`: Relaxed Jaccard threshold used as fallback.
 */
export interface RelevanceFilterConfig {
  minSimilarity: number;
  minSimilarityRelaxed: number;
  requireCoreMatch: boolean;
  minResults: number;
  /** Maximum price multiplier vs reference — alternatives above this are excluded as outliers */
  maxPriceMultiplier: number;
  /** Reference price for outlier filtering (set by caller) */
  referencePrice: number | null;
}

const DEFAULT_CONFIG: RelevanceFilterConfig = {
  minSimilarity: 0.15,
  minSimilarityRelaxed: 0.08,
  requireCoreMatch: true,
  minResults: 2,
  maxPriceMultiplier: 3,
  referencePrice: null,
};

export interface RelevanceFilterResult<T extends ProductData> {
  product: T;
  relevance: RelevanceScore;
}

/**
 * Filters and scores alternatives by relevance to the reference product.
 *
 * Strategy:
 * 1. Compute Jaccard similarity + core-token overlap for each alternative.
 * 2. Apply strict filter: similarity >= minSimilarity AND coreMatch (if required).
 * 3. If strict filtering leaves fewer than `minResults`, fall back to relaxed
 *    similarity threshold (without core match requirement).
 * 4. Return filtered alternatives with their relevance scores, sorted by
 *    descending similarity.
 */
export function filterByRelevance<T extends ProductData>(
  referenceTitle: string,
  alternatives: T[],
  config: Partial<RelevanceFilterConfig> = {},
): RelevanceFilterResult<T>[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Pre-filter: exclude price outliers (alternatives absurdly more expensive)
  let pool = alternatives;
  if (cfg.referencePrice !== null && cfg.referencePrice > 0) {
    const priceLimit = cfg.referencePrice * cfg.maxPriceMultiplier;
    pool = alternatives.filter((p) => p.price === null || p.price.amount <= priceLimit);
  }

  // Score all alternatives
  const scored: RelevanceFilterResult<T>[] = pool.map((product) => ({
    product,
    relevance: computeRelevance(referenceTitle, product.title),
  }));

  // Strict filter
  const strict = scored.filter(
    (r) =>
      r.relevance.similarity >= cfg.minSimilarity &&
      (!cfg.requireCoreMatch || r.relevance.coreMatch),
  );

  // If strict filtering yields enough results, use them
  if (strict.length >= cfg.minResults) {
    strict.sort((a, b) => b.relevance.similarity - a.relevance.similarity);
    return strict;
  }

  // Relaxed fallback: lower similarity, no core match required
  const relaxed = scored.filter((r) => r.relevance.similarity >= cfg.minSimilarityRelaxed);

  // If relaxed still yields fewer than minResults, return whatever we have
  // (sorted by similarity) — better to show something than nothing
  const result = relaxed.length >= cfg.minResults ? relaxed : scored;
  result.sort((a, b) => b.relevance.similarity - a.relevance.similarity);
  return result.slice(0, Math.max(result.length, cfg.minResults));
}
