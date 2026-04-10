import type { FastifyInstance } from 'fastify';
import { searchAlternatives, CreatorsApiError } from '../services/creators-api-client.js';
import { getCachedProduct } from '../services/product-cache.js';
import { extractSearchQuery } from '../services/keyword-extractor.js';
import { rankByTier, type RankedProduct } from '../services/alternative-ranker.js';
import { filterByRelevance } from '../services/relevance-filter.js';
import { buildAffiliateLink } from '../services/affiliate-builder.js';
import { enrichAllWithReviews } from '../services/review-enricher.js';
import { TtlCache } from '../services/cache.js';

const ONE_HOUR = 60 * 60 * 1000;
const alternativesCache = new TtlCache<AlternativesResponse>(ONE_HOUR);

export interface AlternativeWithAffiliateUrl extends RankedProduct {
  affiliateUrl: string;
}

export interface CategorizedAlternativesResponse {
  cheaper: AlternativeWithAffiliateUrl[];
  similar: AlternativeWithAffiliateUrl[];
  higher: AlternativeWithAffiliateUrl[];
}

export interface AlternativesResponse {
  asin: string;
  alternatives: AlternativeWithAffiliateUrl[];
  categorized?: CategorizedAlternativesResponse;
}

export function alternativesRoutes(app: FastifyInstance) {
  app.get<{ Params: { asin: string } }>(
    '/api/alternatives/:asin',
    {
      schema: {
        params: {
          type: 'object',
          required: ['asin'],
          properties: {
            asin: { type: 'string', pattern: '^[A-Z0-9]{10}$' },
          },
        },
      },
    },
    async (request, reply) => {
      const { asin } = request.params;

      const cached = alternativesCache.get(asin);
      if (cached) {
        return cached;
      }

      try {
        // 1. Fetch the main product (shared cache avoids duplicate API calls)
        const product = await getCachedProduct(asin);

        if (!product.price) {
          return reply
            .status(422)
            .send({ error: 'Prezzo del prodotto non disponibile', code: 'NO_PRICE' });
        }

        // 2. Extract search query from title + category for tighter matching
        const searchQuery = extractSearchQuery(product.title, product.browseNodeName);
        if (!searchQuery) {
          return reply
            .status(422)
            .send({ error: 'Impossibile estrarre parole chiave dal titolo', code: 'NO_KEYWORDS' });
        }

        // 3. Search for alternatives via two parallel queries for broader coverage:
        //    - Query A: same category (browseNodeId) + keywords → tighter match
        //    - Query B: keywords only (no browseNodeId) → cross-category discovery
        //    Results are merged and deduplicated by ASIN.
        const searchBase = {
          keywords: searchQuery,
          excludeAsin: asin,
          minReviewsRating: 3,
        };

        const [categoryResults, keywordResults] = await Promise.all([
          product.browseNodeId
            ? searchAlternatives({ ...searchBase, browseNodeId: product.browseNodeId })
            : Promise.resolve([]),
          searchAlternatives(searchBase),
        ]);

        const seenAsins = new Set<string>();
        const rawAlternatives: typeof categoryResults = [];
        for (const item of [...categoryResults, ...keywordResults]) {
          if (!seenAsins.has(item.asin)) {
            seenAsins.add(item.asin);
            rawAlternatives.push(item);
          }
        }

        // 4. Enrich alternatives with scraped review data (API may not provide it)
        const enrichedAlternatives = await enrichAllWithReviews(rawAlternatives);

        // 5. Filter by semantic relevance to remove unrelated products
        const relevanceResults = filterByRelevance(product.title, enrichedAlternatives, {
          referencePrice: product.price.amount,
        });

        // Build relevance score map for the ranker
        const relevanceScores = new Map<string, number>();
        const filteredAlternatives = relevanceResults.map((r) => {
          relevanceScores.set(r.product.asin, r.relevance.similarity);
          return r.product;
        });

        // 6. Rank per price tier (cheaper gets more slots) and categorize
        const { cheaper, similar, higher, all } = rankByTier(
          filteredAlternatives,
          product.price.amount,
          relevanceScores,
        );

        // 7. Attach affiliate links to each alternative
        const addLink = (alt: RankedProduct) => ({
          ...alt,
          affiliateUrl: buildAffiliateLink(alt.asin),
        });

        const categorized: CategorizedAlternativesResponse = {
          cheaper: cheaper.map(addLink),
          similar: similar.map(addLink),
          higher: higher.map(addLink),
        };

        const alternatives = all.map(addLink);

        const response: AlternativesResponse = { asin, alternatives, categorized };
        alternativesCache.set(asin, response);

        return response;
      } catch (err) {
        if (err instanceof CreatorsApiError) {
          return reply.status(404).send({ error: 'Prodotto non trovato', code: err.code });
        }
        request.log.error(err, 'Errore durante la ricerca alternative');
        return reply.status(502).send({ error: 'Errore di comunicazione con Amazon' });
      }
    },
  );
}
