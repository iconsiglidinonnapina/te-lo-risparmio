import type { FastifyInstance } from 'fastify';
import { CreatorsApiError, type ProductData } from '../services/creators-api-client.js';
import { getCachedProduct } from '../services/product-cache.js';
import { extractKeywords } from '../services/keyword-extractor.js';
import { buildAffiliateLink } from '../services/affiliate-builder.js';
import { enrichWithReviews } from '../services/review-enricher.js';

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

      try {
        const product = await getCachedProduct(asin);
        const enriched = await enrichWithReviews(product);

        const keywords = extractKeywords(enriched.title);
        const affiliateUrl = buildAffiliateLink(enriched.asin);
        return { ...enriched, keywords, affiliateUrl } satisfies ProductResponse;
      } catch (err) {
        if (err instanceof CreatorsApiError) {
          return reply.status(404).send({ error: 'Prodotto non trovato', code: err.code });
        }
        request.log.error(err, 'Errore durante il recupero dati prodotto');
        return reply.status(502).send({ error: 'Errore di comunicazione con Amazon' });
      }
    },
  );
}
