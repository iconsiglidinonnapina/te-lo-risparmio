import type { FastifyInstance } from 'fastify';
import { getItem, CreatorsApiError, type ProductData } from '../services/creators-api-client.js';
import { extractKeywords } from '../services/keyword-extractor.js';
import { buildAffiliateLink } from '../services/affiliate-builder.js';
import { enrichWithReviews } from '../services/review-enricher.js';
import { TtlCache } from '../services/cache.js';

const ONE_HOUR = 60 * 60 * 1000;
const productCache = new TtlCache<ProductData>(ONE_HOUR);

export interface ProductResponse extends ProductData {
  keywords: string;
  affiliateUrl: string;
}

export function productRoutes(app: FastifyInstance) {
  app.get<{ Params: { asin: string } }>(
    '/api/product/:asin',
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

      const cached = productCache.get(asin);
      if (cached) {
        const enriched = await enrichWithReviews(cached);
        const keywords = extractKeywords(enriched.title);
        const affiliateUrl = buildAffiliateLink(enriched.asin);
        return { ...enriched, keywords, affiliateUrl } satisfies ProductResponse;
      }

      try {
        const product = await getItem(asin);
        const enriched = await enrichWithReviews(product);
        productCache.set(asin, enriched);

        const keywords = extractKeywords(enriched.title);
        const affiliateUrl = buildAffiliateLink(enriched.asin);
        return { ...enriched, keywords, affiliateUrl } satisfies ProductResponse;
      } catch (err) {
        if (err instanceof CreatorsApiError) {
          return reply.status(404).send({ error: err.message, code: err.code });
        }
        request.log.error(err, 'Errore durante il recupero dati prodotto');
        return reply.status(502).send({ error: 'Errore di comunicazione con Amazon' });
      }
    },
  );
}
