import type { FastifyInstance } from 'fastify';
import { getItem, searchAlternatives, CreatorsApiError } from '../services/creators-api-client.js';
import { extractSearchQuery } from '../services/keyword-extractor.js';
import { rankAlternatives, type RankedProduct } from '../services/alternative-ranker.js';
import { filterByRelevance } from '../services/relevance-filter.js';
import { buildAffiliateLink } from '../services/affiliate-builder.js';
import { enrichAllWithReviews } from '../services/review-enricher.js';
import { TtlCache } from '../services/cache.js';

const ONE_HOUR = 60 * 60 * 1000;
const alternativesCache = new TtlCache<AlternativesResponse>(ONE_HOUR);

export interface AlternativeWithAffiliateUrl extends RankedProduct {
  affiliateUrl: string;
}

export interface AlternativesResponse {
  asin: string;
  alternatives: AlternativeWithAffiliateUrl[];
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
        // 1. Fetch the main product to get browseNodeId, title, and price
        const product = await getItem(asin);

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

        // 3. Search for alternatives in the same category (no price cap — we need
        //    the full price landscape for an accurate comparison)
        const rawAlternatives = await searchAlternatives({
          browseNodeId: product.browseNodeId ?? undefined,
          keywords: searchQuery,
          excludeAsin: asin,
        });

        // 4. Enrich alternatives with scraped review data (API may not provide it)
        const enrichedAlternatives = await enrichAllWithReviews(rawAlternatives);

        // 5. Filter by semantic relevance to remove unrelated products
        const relevanceResults = filterByRelevance(product.title, enrichedAlternatives);

        // Build relevance score map for the ranker
        const relevanceScores = new Map<string, number>();
        const filteredAlternatives = relevanceResults.map((r) => {
          relevanceScores.set(r.product.asin, r.relevance.similarity);
          return r.product;
        });

        // 6. Rank and select top 10 (now with relevance integrated)
        const ranked = rankAlternatives(
          filteredAlternatives,
          product.price.amount,
          10,
          relevanceScores,
        );

        // 7. Attach affiliate links to each alternative
        const alternatives = ranked.map((alt) => ({
          ...alt,
          affiliateUrl: buildAffiliateLink(alt.asin),
        }));

        const response: AlternativesResponse = { asin, alternatives };
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
